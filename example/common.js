mappable.import.loaders.unshift(async (pkg) => {
    if (!pkg.includes('@mappable-world/mappable-clusterer')) {
        return;
    }

    if (location.href.includes('localhost')) {
        await mappable.import.script(`/dist/index.js`);
    } else {
        await mappable.import.script(`https://unpkg.com/${pkg}/dist/index.js`);
    }

    Object.assign(mappable, window[`${pkg}`]);
    return window[`${pkg}`];
});

const BOUNDS = [
    [-73.95184497632046, 40.71517531718148],
    [-73.79379690161176, 40.676480480724436]
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LOCATION = {bounds: BOUNDS};

const seed = (s) => () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
};

const rnd = seed(10000); // () => Math.random()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const rndNum = () => Math.floor(Math.random() * (1000 - 1)) + 1;
rnd.point = (bounds = BOUNDS) => [
    bounds[0][0] + (bounds[1][0] - bounds[0][0]) * rnd(),
    bounds[1][1] + (bounds[0][1] - bounds[1][1]) * rnd()
];

let i = 0;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getRandomPoints = (count, bounds) =>
    Array.from({length: count}, () => ({
        type: 'Feature',
        id: i++,
        geometry: {coordinates: rnd.point(bounds)},
        properties: {name: 'beer shop'}
    }));

document.addEventListener('DOMContentLoaded', async () => {
    if (location.search.includes('hide-toolbar')) {
        document.querySelector('.toolbar').style.display = 'none';
    }
});
