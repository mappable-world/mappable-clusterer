import {Vec2, WorldCoordinates} from '@mappable-world/mappable-types/common/types';

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
function divv(a: Vec2, b: Vec2, dst: Vec2 = {x: 0, y: 0} as Vec2): Vec2 {
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
export function divn(v: Vec2, n: number, dst: Vec2 = {x: 0, y: 0}): Vec2 {
    dst.x = v.x / n;
    dst.y = v.y / n;
    return dst;
}

export function convertPixelSizeToWorldSize(pixel: Vec2, zoom: number, dst?: Vec2): WorldCoordinates {
    const scale = (2 ** zoom / 2) * worldPixelSize;
    return divv(pixel, {x: scale, y: -scale}, dst);
}
