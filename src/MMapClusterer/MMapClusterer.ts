import type {MMapEntity, MMapCollection, MMapListener} from '@mappable-world/mappable-types';
import type {LngLat, LngLatBounds, Projection} from '@mappable-world/mappable-types/common/types';

import type {ClustererObject, EntitiesMap, Feature, IClusterMethod} from './interface';
import {THROTTLE_DEFAULT_TIMEOUT_MS} from './constants';
import {throttle} from './helpers/throttle';
import {MMapClustererReactifyOverride} from './react/MMapClusterer';

/**
 * MMapClusterer props
 */
type MMapClustererProps = {
    /** Clusterisation method */
    method: IClusterMethod;
    /** Features */
    features: Feature[];
    /** Function to create marker for point*/
    marker: (feature: Feature) => MMapEntity<unknown>;
    /** Function to create marker for cluster*/
    cluster: (coordinates: LngLat, features: Feature[]) => MMapEntity<unknown>;
    /** The amount of time that may be passed before the render method can be called again */
    tickTimeout?: number;
    /** Return false, if you want to override the render */
    onRender?: (clusters: ClustererObject[]) => void | false;
};

type DefaultProps = typeof defaultProps;

const defaultProps = Object.freeze({
    tickTimeout: THROTTLE_DEFAULT_TIMEOUT_MS
});

/**
 * Display clustered features on a map.
 *
 * @example
 * ```javascript
 * const clusterer = new MMapClusterer({
 *      method: clusterByGrid({gridSize: 64}),
 *      features: POINTS,
 *      marker: (feature) => new MMapMarker({
 *          coordinates: feature.geometry.coordinates,
 *          source: 'my-source'
 *      }
 *      cluster: (coordinates, cluster) => new MMapMarker({
 *          coordinates,
 *          source: 'my-source'
 *      }
 * });
 *
 * map.addChild(new MMapDefaultSchemeLayer())
 *      .addChild(new MMapFeatureDataSource({id: 'my-source'}))
 *      .addChild(new MMapLayer({source: 'my-source', type: 'markers'}))
 *      .addChild(clusterer);
 * ```
 */
class MMapClusterer extends mappable.MMapComplexEntity<MMapClustererProps, DefaultProps> {
    static defaultProps = defaultProps;
    static [mappable.overrideKeyReactify] = MMapClustererReactifyOverride;

    /** All created entities with cluster id*/
    private _entitiesCache: EntitiesMap = {};
    /** Viewport entities with cluster id */
    private _visibleEntities: EntitiesMap = {};
    /** Store to add entities on a map */
    private _container!: MMapCollection;
    /** Listener on map update and resize */
    private _mapListener!: MMapListener;

    constructor(props: MMapClustererProps) {
        super(props);
        this._render = this._render.bind(this);
    }

    /**
     * Compare feature coordinates with bounds
     *
     * @param feature
     * @param bounds
     * @param projection
     * @returns either feature belongs to viewport or not
     */
    private _isVisible(feature: Feature, bounds: LngLatBounds, projection: Projection): boolean {
        const {x, y} = projection.toWorldCoordinates(feature.geometry.coordinates as LngLat);
        const {x: x1, y: y1} = projection.toWorldCoordinates(bounds[0]);
        const {x: x2, y: y2} = projection.toWorldCoordinates(bounds[1]);
        return x1 <= x && y1 >= y && x2 >= x && y2 <= y;
    }

    /**
     * Get entity from store or create it
     *
     * @param feature
     * @param entityId
     * @param length count of entities in the cluster
     * @returns ready to add to map entity
     */
    private _getEntity({lnglat, features, clusterId: entityId}: ClustererObject): MMapEntity<unknown> {
        let entity = this._entitiesCache[entityId];

        if (!entity) {
            if (features.length === 1) {
                entity = this._props.marker(features[0]);
            } else {
                entity = this._props.cluster(lnglat as LngLat, features);
            }
            this._entitiesCache[entityId] = entity;
        }

        return entity;
    }

    /**
     * Generate map of new entities based on returned from method objects
     *
     * @param nextViewportObjects clustered objects
     * @returns map of entities for new render
     */
    private _getVisibleEntities(nextViewportObjects: ClustererObject[]): EntitiesMap {
        const nextVisibleEntities: EntitiesMap = {};

        nextViewportObjects.forEach((object: ClustererObject) => {
            const entity = this._getEntity(object);
            nextVisibleEntities[object.clusterId] = entity;
        });

        return nextVisibleEntities;
    }

    /**
     * Removes unnecessary entities and adds new to the map
     *
     * @param nextVisibleEntities new entities for matching with existing entities
     */
    private _syncVisibleEntities(nextVisibleEntities: EntitiesMap): void {
        for (const entityId in this._visibleEntities) {
            if (!nextVisibleEntities[entityId]) {
                this._container.removeChild(this._visibleEntities[entityId] as MMapEntity<unknown>);
            }
        }

        for (const entityId in nextVisibleEntities) {
            if (!this._visibleEntities[entityId]) {
                this._container.addChild(nextVisibleEntities[entityId] as MMapEntity<unknown>);
            }
        }
    }

    private _render({mapInAction}: {mapInAction?: boolean} = {}): void {
        const map = this.root;

        if (!map || mapInAction) return;

        const visibleFeatures = this._props.features.filter((feature) =>
            this._isVisible(feature, map.bounds, map.projection)
        );

        const nextViewportObjects = this._props.method.render({
            map,
            features: visibleFeatures
        });

        if (this._props.onRender && this._props.onRender(nextViewportObjects) === false) {
            return;
        }

        const nextVisibleEntities = this._getVisibleEntities(nextViewportObjects);
        this._syncVisibleEntities(nextVisibleEntities);
        this._visibleEntities = nextVisibleEntities;
    }

    protected __implGetDefaultProps(): DefaultProps {
        return MMapClusterer.defaultProps;
    }

    protected _onAttach(): void {
        this._entitiesCache = {};
        this._visibleEntities = {};

        this._container = new mappable.MMapCollection({});
        this.addChild(this._container);

        const onUpdateRender = this._props.tickTimeout ? throttle(this._render, this._props.tickTimeout) : this._render;
        this._mapListener = new mappable.MMapListener({onUpdate: onUpdateRender, onResize: onUpdateRender});
        this.addChild(this._mapListener);

        this._render();
    }

    protected _onDetach(): void {
        this.removeChild(this._container);
        this.removeChild(this._mapListener);

        this._entitiesCache = {};
        this._visibleEntities = {};
    }

    protected _onUpdate(): void {
        this._render();
    }
}

export {MMapClusterer, MMapClustererProps};
