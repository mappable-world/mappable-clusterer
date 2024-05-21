import type TVue from '@vue/runtime-core';
import type {LngLat} from '@mappable-world/mappable-types/common/types';
import type {CustomVuefyFn, CustomVuefyOptions} from '@mappable-world/mappable-types/modules/vuefy';
import type {ClustererObject, MMapClusterer, MMapClustererProps} from '..';
import {THROTTLE_DEFAULT_TIMEOUT_MS} from '../constants';
import type {Feature} from '../interface';

export const MMapClustererVuefyOptions: CustomVuefyOptions<MMapClusterer> = {
    props: {
        method: {type: Object, required: true},
        features: {type: Array, required: true},
        marker: Function as TVue.PropType<MMapClustererProps['marker']>,
        cluster: Function as TVue.PropType<MMapClustererProps['cluster']>,
        tickTimeout: {type: Number, default: THROTTLE_DEFAULT_TIMEOUT_MS},
        onRender: Function as TVue.PropType<MMapClustererProps['onRender']>,
        maxZoom: {type: Number}
    }
};

type EntitiesMap = {
    [x: string]: TVue.VNodeChild;
};

type MMapClustererSlots = {
    marker?: {feature: Feature};
    cluster?: {coordinates: LngLat; features: Feature[]};
};

export const MMapClustererVuefyOverride: CustomVuefyFn<MMapClusterer> = (MMapClustererI, props, {vuefy, Vue}) => {
    const MMapClustererV = vuefy.entity(MMapClustererI, props);
    const MMapCollectionV = vuefy.entity(mappable.MMapCollection);
    return Vue.defineComponent({
        name: 'MMapClustererContainer',
        props,
        slots: Object as TVue.SlotsType<MMapClustererSlots>,
        setup(props, {slots}) {
            const clustersVNode: TVue.Ref<TVue.VNodeChild[] | null> = Vue.ref(null);
            const onRender = (clusters: ClustererObject[]): false => {
                const vueClusters: EntitiesMap = {};
                clusters.forEach(({lnglat, features, clusterId}) => {
                    vueClusters[clusterId] = Vue.h(
                        Vue.Fragment,
                        {key: clusterId},
                        features.length === 1
                            ? slots.marker?.({feature: features[0]})
                            : slots.cluster?.({coordinates: lnglat, features})
                    );
                });
                clustersVNode.value = Object.values(vueClusters);
                return false;
            };
            return () => [
                Vue.h(MMapClustererV, {...props, onRender} as MMapClustererProps),
                Vue.h(MMapCollectionV, () => clustersVNode.value)
            ];
        }
    });
};
