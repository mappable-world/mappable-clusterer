import type {MMap, MMapEntity} from '@mappable-world/mappable-types';
import type {LngLat, WorldCoordinates, GenericPointFeature} from '@mappable-world/mappable-types/common/types';

/** Represents object on a map (either cluster or feature) */
type ClustererObject = {
    world: WorldCoordinates;
    lnglat: LngLat;
    clusterId: string;
    features: Feature[];
};

/** Feature to clusterize on a map */
type Feature = GenericPointFeature<LngLat>;

/** Cluster that contains cluster or feature and its sum of coordinates */
type Cluster = {sumX: number; sumY: number; objects: ClustererObject[]; features: Feature[]};
type ClustersCollection = Map<string, Cluster>;

/** Props for rendering */
type RenderProps = {
    map: MMap;
    features: Feature[];
};

/** Represents map of entities with its id */
type EntitiesMap = Record<string, MMapEntity<unknown> | undefined>;

/** Interface of method class*/
interface IClusterMethod {
    render(props: RenderProps): ClustererObject[];
}

export type {EntitiesMap, ClustersCollection, ClustererObject, Feature, IClusterMethod, RenderProps};
