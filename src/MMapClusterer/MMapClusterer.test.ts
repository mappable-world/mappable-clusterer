import type {LngLat} from '@mappable-world/mappable-types';
import type {ClustererObject, IClusterMethod} from './interface';
import {MMapClusterer, clusterByGrid, Feature} from './index';

describe('MMapClusterer', () => {
    const BOUNDS = [
        [36.69, 55.95],
        [38.54, 55.28]
    ] as [LngLat, LngLat];
    const container = document.createElement('div');
    Object.assign(container.style, {width: `1350px`, height: `856px`});
    const map = new mappable.MMap(container, {location: {bounds: BOUNDS}});

    describe('main', () => {
        const coordinates: LngLat[] = [
            [37.64, 55.76],
            [37.63, 55.7],
            [37.43, 55.69],
            [37.47, 55.68],
            [38.53, 58.6],
            [37.59, 55.71],
            [37.5, 55.63],
            [37.52, 55.57],
            [37.52, 58.57],
            [40.52, 58.57]
        ];

        const points = coordinates.map((lnglat: LngLat, i) => ({
            type: 'Feature',
            id: i.toString(),
            geometry: {type: 'Point', coordinates: lnglat},
            properties: {name: 'пивной ларёк'}
        })) as Feature[];

        const pointElement = document.createElement('div');
        pointElement.id = 'point';

        const clusterElement = document.createElement('div');
        clusterElement.id = 'cluster';

        const clusterer = new MMapClusterer({
            method: clusterByGrid({gridSize: 64}),
            features: points,

            marker: (feature) =>
                new mappable.MMapMarker(
                    {
                        coordinates: feature.geometry.coordinates,
                        source: 'my-source'
                    },
                    pointElement.cloneNode() as HTMLElement
                ),

            cluster: (coordinates, _) =>
                new mappable.MMapMarker(
                    {
                        coordinates,
                        source: 'my-source'
                    },
                    clusterElement.cloneNode() as HTMLElement
                ),
            tickTimeout: 0
        });

        map.addChild(new mappable.MMapDefaultSchemeLayer({}))
            .addChild(new mappable.MMapFeatureDataSource({id: 'my-source'}))
            .addChild(new mappable.MMapLayer({source: 'my-source', type: 'markers', zIndex: 1800}))
            .addChild(clusterer);

        // @ts-ignore for getting private property
        const entities = clusterer._container.children as Entities<unknown>[];

        it('should show 7/10 initial points', () => {
            expect(entities.length).toBe(7);
        });

        it('should show 3 points, 2 clusters after zoom out (5 entities in general)', () => {
            map.setLocation({
                bounds: [
                    [35.91, 56.22],
                    [39.52, 54.89]
                ]
            });
            expect(entities.length).toBe(3);
            const pointsCount = entities.filter((entity) => entity.element.id === 'point').length;
            expect(pointsCount).toBe(1);

            const clusterCount = entities.filter((entity) => entity.element.id === 'cluster').length;
            expect(clusterCount).toBe(2);
        });

        it('should show 3 remaining initial points after drag', () => {
            map.setLocation({
                bounds: [
                    [37.16, 58.92],
                    [40.87, 57.69]
                ]
            });
            expect(entities.length).toBe(3);
        });

        it('should show all points after zoom out with dummy method applying', () => {
            const method: IClusterMethod = {
                render({features}): ClustererObject[] {
                    return features.map((feature) => ({
                        world: {x: 0, y: 1},
                        lnglat: feature.geometry.coordinates,
                        clusterId: feature.id as string,
                        features: [feature]
                    }));
                }
            };

            clusterer.update({method});
            expect(entities.length).toBe(4);

            map.setLocation({zoom: 3});
            expect(entities.length).toBe(10);
        });
    });
});
