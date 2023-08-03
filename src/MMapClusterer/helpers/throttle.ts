/**
 * Throttles a function and delays its execution, so it's only called at most
 * once within a given time period.
 *
 * @param {Function} fn The function to throttle.
 * @param {number} wait The amount of time that must pass before the function can be called again.
 * @return {Function} The throttled function.
 */

export const throttle = (fn: Function, wait: number) => {
    let inThrottle: boolean;
    let lastFn: ReturnType<typeof setTimeout>;
    let lastTime: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function (this: any) {
        const context = this;
        const args = arguments;
        if (!inThrottle) {
            fn.apply(context, args);
            lastTime = Date.now();
            inThrottle = true;
        } else {
            clearTimeout(lastFn);
            lastFn = setTimeout(() => {
                if (Date.now() - lastTime >= wait) {
                    fn.apply(context, args);
                    lastTime = Date.now();
                }
            }, Math.max(wait - (Date.now() - lastTime), 0));
        }
    };
};
