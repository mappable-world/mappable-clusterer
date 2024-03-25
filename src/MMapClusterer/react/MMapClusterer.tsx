import type TReact from 'react';
import type {LngLat, MMapEntity} from '@mappable-world/mappable-types';
import type {CustomReactify, OverrideProps, Prettify} from '@mappable-world/mappable-types/reactify/reactify';

import type {ClustererObject, Feature} from '../interface';
import type {MMapClusterer as MMapClustererI, MMapClustererProps} from '../MMapClusterer';

/**
 * Create reactified version of MMapCluster module
 *
 * @example
 * ```jsx
 * <MMap location={LOCATION} ref={x => map = x}>
 *     <MMapDefaultSchemeLayer />
 *     <MMapFeatureDataSource id="my-source"/>
 *     <MMapLayer source="my-source" type="markers" zIndex={1800}/>
 *     <MMapClusterer
 *         marker={(feature) => <MMapMarker
 *             coordinates={feature.geometry.coordinates}
 *             source={'my-source'} >
 *                 <img src={'./pin.svg'}/>
 *             </MMapMarker>}
 *         cluster={(coordinates, features) => <MMapMarker
 *             coordinates={coordinates}
 *             source={'my-source'} >
 *             <div className="circle">
 *                 <div className="circle-content">
 *                     <span className="circle-text">{features.length}</span>
 *                 </div>
 *             </div>
 *             </MMapMarker>}
 *         method={gridSizedMethod}
 *         features={points}
 *     />
 * </MMap>
 * ```
 */

type MMapClustererReactifiedProps = Prettify<
    OverrideProps<
        MMapClustererProps,
        {
            /** Function that returns MMapMarker react component to render marker*/
            marker: (feature: Feature) => TReact.ReactElement;
            /** Function that returns MMapMarker react component to render cluster*/
            cluster: (coordinates: LngLat, features: Feature[]) => TReact.ReactElement;
        }
    >
>;

type MMapClustererImperative = new (props: MMapClustererReactifiedProps) => MMapEntity<MMapClustererReactifiedProps>;
type MMapClustererR = TReact.ForwardRefExoticComponent<
    MMapClustererReactifiedProps & React.RefAttributes<MMapEntity<MMapClustererReactifiedProps>>
>;

type EntitiesMap = {
    [x: string]: TReact.ReactElement;
};

export const MMapClustererReactifyOverride: CustomReactify<MMapClustererI, MMapClustererR> = (
    MMapClustererI,
    {reactify, React}
) => {
    const MMapClustererReactified = reactify.entity(MMapClustererI as unknown as MMapClustererImperative);

    const MMapClusterer = React.forwardRef<MMapEntity<MMapClustererReactifiedProps>, MMapClustererReactifiedProps>(
        (props, ref) => {
            const [clusters, setClusters] = React.useState<React.ReactNode[]>([]);

            const onRender = React.useCallback(
                (clusters: ClustererObject[]): false => {
                    const reactClusters: EntitiesMap = {};

                    clusters.forEach(({lnglat, features, clusterId}) => {
                        reactClusters[clusterId] = (
                            <React.Fragment key={clusterId}>
                                {features.length === 1
                                    ? props.marker(features[0])
                                    : props.cluster(lnglat as LngLat, features)}
                            </React.Fragment>
                        );
                    });

                    setClusters(Object.values(reactClusters));
                    return false;
                },
                [props]
            );

            return (
                <>
                    <MMapClustererReactified {...props} ref={ref} onRender={onRender} />
                    {clusters}
                </>
            );
        }
    );

    return MMapClusterer;
};
