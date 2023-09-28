import type {LngLat, WorldCoordinates, PixelCoordinates, Projection} from '@mappable-world/mappable-types';

import type {IClusterMethod, ClustererObject, ClustersCollection, RenderProps, Feature} from '../interface';
import {convertPixelSizeToWorldSize, divn} from "../helpers/utils";
import {DEFAULT_SCREEN_OFFSET} from "../constants";

class ClusterByGridMethod implements IClusterMethod {
    private _gridSize: number;
    private _nextFeatureIndex = 0;
    private _featureIdCharCache: Record<string, string> = {};

    constructor(gridSize: number) {
        this._gridSize = gridSize;
    }

    private _getClusterSizeWorld(targetZoom: number): number {
        return convertPixelSizeToWorldSize({x: this._gridSize, y: 0}, targetZoom).x;
    }

    private _computeVisibleClusters(
        size: PixelCoordinates,
        targetZoom: number,
        center: WorldCoordinates
    ): Map<string, boolean> {
        const halfViewportSize = divn(convertPixelSizeToWorldSize(size, targetZoom), 2);

        const offset = convertPixelSizeToWorldSize({x: DEFAULT_SCREEN_OFFSET, y: 0}, targetZoom).x

        const top = center.y + halfViewportSize.y - offset;
        const bottom = center.y - halfViewportSize.y + offset;
        const left = center.x - halfViewportSize.x - offset;
        const right = center.x + halfViewportSize.x + offset;

        const clusterSize = this._getClusterSizeWorld(targetZoom);

        const minBucketX = Math.floor(left / clusterSize);
        const maxBucketX = Math.ceil(right / clusterSize);
        const minBucketY = Math.floor(top / clusterSize);
        const maxBucketY = Math.ceil(bottom / clusterSize);

        const result = new Map();
        for (let x = minBucketX; x <= maxBucketX; x++) {
            for (let y = minBucketY; y <= maxBucketY; y++) {
                result.set(`${x}-${y}`, true);
            }
        }

        return result;
    }

    private _clusterize(projection: Projection, features: Feature[], targetZoom: number): ClustersCollection {
        const clusters: ClustersCollection = new Map();
        const clusterSize = this._getClusterSizeWorld(targetZoom);

        for (const feature of features) {
            const object = {
                world: projection.toWorldCoordinates(feature.geometry.coordinates as LngLat),
                lnglat: feature.geometry.coordinates as LngLat,
                clusterId: '',
                features: [feature]
            };

            const clusterX = Math.floor(object.world.x / clusterSize);
            const clusterY = Math.floor(object.world.y / clusterSize);

            const id = `${clusterX}-${clusterY}`;
            let cluster = clusters.get(id);
            if (!cluster) {
                cluster = {sumX: 0, sumY: 0, objects: [], features: []};
                clusters.set(id, cluster);
            }

            cluster.sumX += object.world.x;
            cluster.sumY += object.world.y;

            cluster.objects.push(object);
            cluster.features.push(object.features[0]);
        }

        return clusters;
    }

    private _generateClusterId(features: Feature[]): string {
        const result: string[] = ['cluster-'];
        features.forEach(({id}) => {
            if (!this._featureIdCharCache[id]) {
                this._featureIdCharCache[id] = String.fromCharCode(this._nextFeatureIndex);
                this._nextFeatureIndex += 1;
            }
            result.push(this._featureIdCharCache[id]);
        });

        return result.join('');
    }

    render({map, features}: RenderProps): ClustererObject[] {
        const targetZoom = Math.round(map.zoom);
        const visibleClusters = this._computeVisibleClusters(
            map.size,
            targetZoom,
            map.projection.toWorldCoordinates(map.center as LngLat)
        );

        const currentCollection = this._clusterize(map.projection, features, targetZoom);

        const nextViewportObjects: ClustererObject[] = [];

        for (const [clusterId, cluster] of currentCollection.entries()) {
            if (!visibleClusters.get(clusterId)) continue;

            const length = cluster.objects.length;
            if (length === 1) {
                nextViewportObjects.push({
                    ...cluster.objects[0],
                    clusterId: cluster.features[0].id
                });
            } else {
                const world = {x: cluster.sumX / length, y: cluster.sumY / length};

                nextViewportObjects.push({
                    world,
                    lnglat: map.projection.fromWorldCoordinates(world),
                    clusterId: this._generateClusterId(cluster.features),
                    features: cluster.features
                });
            }
        }

        return nextViewportObjects;
    }
}

export function clusterByGrid({gridSize}: {gridSize: number}): IClusterMethod {
    return new ClusterByGridMethod(gridSize);
}
