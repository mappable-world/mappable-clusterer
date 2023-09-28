import type {Vec2, WorldCoordinates} from '@mappable-world/mappable-types';

// World at 0 zoom is always 256x256 pixels.
const worldPixelSize = 256;

/**
 * Divides a vector by another one component wise and stores the result into a
 * third one.
 *
 * @param a The dividend vector.
 * @param b The divisor vector.
 * @param dst The vector the result will be stored to.
 * @returns `dst`.
 */
function divv<T extends Vec2>(a: T, b: T, dst: T = {x: 0, y: 0} as T): T {
    dst.x = a.x / b.x;
    dst.y = a.y / b.y;
    return dst;
}

/**
 * Divides a vector by a scalar and stores the result into a third vector.
 *
 * @param v The dividend vector.
 * @param n The scalar.
 * @param dst The vector the result will be stored to.
 * @returns `dst`.
 */
export function divn<T extends Vec2>(v: T, n: number, dst: Vec2 = {x: 0, y: 0}): T {
    dst.x = v.x / n;
    dst.y = v.y / n;
    return dst as T;
}

export function convertPixelSizeToWorldSize(pixel: Vec2, zoom: number, dst?: Vec2): WorldCoordinates {
    const scale = (2 ** zoom / 2) * worldPixelSize;
    return divv(pixel, {x: scale, y: -scale}, dst);
}
