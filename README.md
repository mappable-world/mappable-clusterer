# @mappable-world/mappable-clusterer package

---

Using the clusterer helps to display a large number of markers on the map.
When the scale of the map is increased, individual markers are combined into a cluster;
when the map is scaled down, the cluster breaks up into individual markers.

[![npm](https://img.shields.io/npm/dm/@mappable-world/mappable-clusterer.svg)](https://www.npmjs.com/package/@mappable-world/mappable-clusterer)

## How use

The package is located in the `dist` folder:

- `dist/types` TypeScript types
- `dist/esm` es6 modules for direct connection in your project
- `dist/index.js` Mappable JS Module

to use Mappable JS Module you need to add your module loading handler to JS API

```js
mappable.import.loaders.unshift(async (pkg) => {
  if (!pkg.includes('@mappable-world/mappable-clusterer')) {
    return;
  }

  if (location.href.includes('localhost')) {
    await mappable.import.script(`/dist/index.js`);
  } else {
    // You can use another CDN
    await mappable.import.script(`https://unpkg.com/${pkg}/dist/index.js`);
  }

  Object.assign(mappable, window[`${pkg}`]);
  return window[`${pkg}`];
});
```

and in your final code just use `mappable.import`

We will use these functions and constants in example:

```js
const LOCATION = {center: [55.205247, 25.077816], zoom: 10};

const BOUNDS = [
  [54.58311, 25.9985],
  [56.30248, 24.47889]
];

const rndPoint = (bounds) => [
  bounds[0][0] + (bounds[1][0] - bounds[0][0]) * Math.random(),
  bounds[1][1] + (bounds[0][1] - bounds[1][1]) * Math.random()
];

/**
 * Generates randomly count points inside the BOUNDS area
 *
 * @param count
 * @param bounds
 * @returns {{geometry: {coordinates: *}, id, type: string, properties: {name: string}}[]}
 */
const getRandomPoints = (count, bounds) =>
  Array.from({length: count}, () => ({
    type: 'Feature',
    id: i++,
    geometry: {coordinates: rndPoint(bounds)},
    properties: {name: 'beer shop'}
  }));
```

```js
main();
async function main() {
  await mappable.ready;
  const {MMap, MMapDefaultSchemeLayer, MMapLayer, MMapFeatureDataSource} = mappable;

  const {MMapClusterer, clusterByGrid} = await mappable.import('@mappable-world/mappable-clusterer@0.0.1');

  map = new MMap(document.getElementById('app'), {location: LOCATION});
  map
    .addChild(new MMapDefaultSchemeLayer())
    .addChild(new MMapFeatureDataSource({id: 'clusterer-source'}))
    .addChild(new MMapLayer({source: 'clusterer-source', type: 'markers', zIndex: 1800}));

  const contentPin = document.createElement('div');
  contentPin.innerHTML = '<img src="./pin.svg" class="pin">';

  // Makes usual point Marker
  const marker = (feature) =>
    new mappable.MMapMarker(
      {
        coordinates: feature.geometry.coordinates,
        source: 'clusterer-source'
      },
      contentPin.cloneNode(true)
    );

  // Makes Cluster Marker
  const cluster = (coordinates, features) =>
    new mappable.MMapMarker(
      {
        coordinates,
        source: 'clusterer-source'
      },
      circle(features.length).cloneNode(true)
    );

  function circle(count) {
    const circle = document.createElement('div');
    circle.classList.add('circle');
    circle.innerHTML = `
        <div class="circle-content">
            <span class="circle-text">${count}</span>
        </div>
    `;
    return circle;
  }

  const clusterer = new MMapClusterer({
    method: clusterByGrid({gridSize: 64}),
    features: getRandomPoints(100, BOUNDS),
    marker,
    cluster
  });

  map.addChild(clusterer);
}
```

Or React version

```jsx
main();
async function main() {
  const [mappableReact] = await Promise.all([mappable.import('@mappable-world/mappable-reactify'), mappable.ready]);
  const reactify = mappableReact.reactify.bindTo(React, ReactDOM);
  const {MMap, MMapDefaultSchemeLayer, MMapLayer, MMapFeatureDataSource, MMapMarker} = reactify.module(mappable);

  const {MMapClusterer, clusterByGrid} = reactify.module(
    await mappable.import('@mappable-world/mappable-clusterer@0.0.1')
  );
  const {useState, useCallback, useMemo} = React;
  const points = getRandomPoints(100, BOUNDS);
  const gridSizedMethod = clusterByGrid({gridSize: 64});

  function App() {
    const marker = useCallback(
      (feature) => (
        <MMapMarker key={feature.id} coordinates={feature.geometry.coordinates} source="clusterer-source">
          <img src="./pin.svg" className="pin" />
        </MMapMarker>
      ),
      []
    );

    const cluster = useCallback(
      (coordinates, features) => (
        <MMapMarker key={`${features[0].id}-${features.length}`} coordinates={coordinates} source="clusterer-source">
          <div className="circle">
            <div className="circle-content">
              <span className="circle-text">{features.length}</span>
            </div>
          </div>
        </MMapMarker>
      ),
      []
    );

    return (
      <>
        <MMap location={LOCATION} ref={(x) => (map = x)}>
          <MMapDefaultSchemeLayer />
          <MMapFeatureDataSource id="clusterer-source" />
          <MMapLayer source="clusterer-source" type="markers" zIndex={1800} />
          <MMapClusterer marker={marker} cluster={cluster} method={gridSizedMethod} features={points} />
        </MMap>
      </>
    );
  }

  const reactRoot = ReactDOM.createRoot(document.getElementById('app'));
  reactRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
```
