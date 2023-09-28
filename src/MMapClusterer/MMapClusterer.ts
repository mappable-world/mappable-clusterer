import type {MMapEntity, MMapCollection, MMapListener, LngLat} from '@mappable-world/mappable-types';

import throttle from 'lodash/throttle';

import type {ClustererObject, EntitiesMap, Feature, IClusterMethod} from './interface';
import {THROTTLE_DEFAULT_TIMEOUT_MS} from './constants';
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
        super(props, {container: true});
        this._render = this._render.bind(this);
    }

    /**
     * Get entity from store or create it
     *
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
            nextVisibleEntities[object.clusterId] = this._getEntity(object);
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

    private _render(): void {
        const map = this.root;

        if (!map) return;

        const {features} = this._props;

        const nextViewportObjects = this._props.method.render({
            map,
            features: features
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
        this._addDirectChild(this._container);

        const onUpdateRender = this._props.tickTimeout ? throttle(this._render, this._props.tickTimeout) : this._render;
        this._mapListener = new mappable.MMapListener({onUpdate: onUpdateRender, onResize: onUpdateRender});
        this._addDirectChild(this._mapListener);

        this._render();
    }

    protected _onDetach(): void {
        this._removeDirectChild(this._container);
        this._removeDirectChild(this._mapListener);

        this._entitiesCache = {};
        this._visibleEntities = {};
    }

    protected _onUpdate(): void {
        this._render();
    }
}

export {MMapClusterer, MMapClustererProps};
