# @mappable-world/mappable-clusterer package

---

Using the clusterer helps to display a large number of markers on the map.
When the scale of the map is increased, individual markers are combined into a cluster;
when the map is scaled down, the cluster breaks up into individual markers.

- [GitHub](https://github.com/mappable-world/mappable-clusterer)

[![npm version](https://badge.fury.io/js/@mappable-world%2Fmappable-clusterer.svg)](https://www.npmjs.com/package/@mappable-world/mappable-clusterer)
[![npm](https://img.shields.io/npm/dm/@mappable-world/mappable-clusterer.svg)](https://www.npmjs.com/package/@mappable-world/mappable-clusterer)
[![Build Status](https://github.com/mappable-world/mappable-clusterer/workflows/Run%20tests/badge.svg)](https://github.com/mappable-world/mappable-clusterer/actions/workflows/tests.yml)

## How use

The package is located in the `dist` folder:

- `dist/types` TypeScript types
- `dist/esm` es6 modules for direct connection in your project
- `dist/index.js` Mappable JS Module

to use Mappable JS Module you need to add your module loading handler to JS API

```js
mappable.import.loaders.unshift(async (pkg) => {
  if (!pkg.startsWith('@mappable-world/mappable-clusterer')) {
    return;
  }

  if (location.href.includes('localhost')) {
    await mappable.import.script(`/dist/index.js`);
  } else {
    // You can use another CDN
    await mappable.import.script(`https://unpkg.com/${pkg}/dist/index.js`);
  }

  return window[`@mappable-world/mappable-clusterer`];
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

## More about working with the package

### Example 1: Creating a Map and adding a Clusterer to the Map

We declare a variable for the map, load the mappable library, extract the necessary classes.

```javascript
window.map = null;
async function main() {
  await mappable.ready;

  const {MMap, MMapDefaultSchemeLayer, MMapMarker, MMapLayer, MMapFeatureDataSource} = mappable;
  //...
}
```

We load the package with the clusterer, extract the classes for creating clusterer objects and the clustering method.

```javascript
const {MMapClusterer, clusterByGrid} = await mappable.import('@mappable-world/mappable-clusterer@0.0.1');
```

Create and add to the map a layer with a default schema, data sources, a layer of markers.

```javascript
const map = new MMap(document.getElementById('app'), {location: LOCATION});
map
  .addChild(new MMapDefaultSchemeLayer())
  .addChild(new MMapFeatureDataSource({id: 'my-source'}))
  .addChild(new MMapLayer({source: 'my-source', type: 'markers', zIndex: 1800}));
```

You can set any markup for the marker and for the cluster.

```javascript
const contentPin = document.createElement('div');
contentPin.innerHTML = '<img src="./pin.svg" />';
```

We declare the function for rendering ordinary markers, we will submit it to the clusterer settings.
Note that the function must return any Entity element. In the example, this is mappable.MMapMarker.

```javascript
const marker = (feature) =>
  new mappable.MMapMarker(
    {
      coordinates: feature.geometry.coordinates,
      source: 'my-source'
    },
    contentPin.cloneNode(true)
  );
```

As for ordinary markers, we declare a cluster rendering function that also returns an Entity element.

```javascript
const cluster = (coordinates, features) =>
  new mappable.MMapMarker(
    {
      coordinates,
      source: 'my-source'
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
```

Let's declare an array with marker coordinates, then create an array of features with the appropriate interface. We will pass it to the clusterer settings.

```javascript
const coordinates = [
  [54.64, 25.76],
  [54.63, 25.7],
  [54.43, 25.69],
  [54.42, 25.127],
  [54.12, 25.437]
];

const points = coordinates.map((lnglat, i) => ({
  type: 'Feature',
  id: i,
  geometry: {coordinates: lnglat},
  properties: {name: 'Point of issue of orders'}
}));
```

We create a clusterer object and add it to the map object.
As parameters, we pass the clustering method, an array of features, the functions for rendering markers and clusters.
For the clustering method, we will pass the size of the grid division in pixels.

```javascript
const clusterer = new MMapClusterer({
    method: clusterByGrid({gridSize: 64}),
    features: points,
    marker,
    cluster
});

map.addChild(clusterer);
```

### Example 2. Using a Clusterer with React JS

We declare a variable for the map, load the mappable library, extract the necessary classes.

```jsx
window.map = null;
main();
async function main() {
  await mappable.ready;
  const mappableReact = await mappable.import('@mappable-world/mappable-reactify');
  const reactify = mappableReact.reactify.bindTo(React, ReactDOM);
  const {
    MMap,
    MMapDefaultSchemeLayer,
    MMapLayer,
    MMapFeatureDataSource,
    MMapMarker
  } = reactify.module(mappable);
  // ...
}
```

We connect the package with the clusterer, extract the classes for creating clusterer objects and the clustering method.

```jsx
const {MMapClusterer, clusterByGrid} = reactify.module(
  await mappable.import('@mappable-world/mappable-clusterer@0.0.1')
);
```

We extract the necessary hooks. Let's declare an array with marker coordinates, then create an array of features with the appropriate interface.
We will pass it to the clusterer settings.

```jsx
const {useCallback, useMemo} = React;

const coordinates = [
  [54.64, 25.76],
  [54.63, 25.7],
  [54.43, 25.69],
  [54.47, 25.68],
  [54.53, 25.6],
  [54.59, 25.71],
  [54.5, 25.63],
  [54.42, 25.57],
  [54.12, 25.57],
  [54.32, 25.57]
];

const points = coordinates.map((lnglat, i) => ({
  type: 'Feature',
  id: i,
  geometry: {coordinates: lnglat},
  properties: {name: 'Point of issue of orders'}
}));
```

We declare a render function. For the clustering method, we pass and store the size of one grid division in pixels.

```jsx
function App() {
  const gridSizedMethod = useMemo(() => clusterByGrid({gridSize: 64}), []);
  // ...
}
```

We declare a function for rendering ordinary markers. Note that the function must return any Entity element. In the example, this is mappable.MMapMarker.

```jsx
const marker = useCallback(
  (feature) => (
    <MMapMarker coordinates={feature.geometry.coordinates} source={'my-source'}>
      <img src={'./pin.svg'} />
    </MMapMarker>
  ),
  []
);
```

We declare a cluster rendering function that also returns an Entity element. We will transfer the marker and cluster rendering functions to the clusterer settings.

```jsx
const cluster = useCallback(
  (coordinates, features) => (
    <MMapMarker coordinates={coordinates} source={'my-source'}>
      <div className="circle">
        <div className="circle-content">
          <span className="circle-text">{features.length}</span>
        </div>
      </div>
    </MMapMarker>
  ),
  []
);
```

We return JSX, in which we render the components of the map, the default layer, data sources, the layer for markers and the clusterer.
In the clusterer props, we pass the previously declared functions for rendering markers and clusters, the clustering method, and an array of features.

```jsx
function App() {
  // ...
  return <>
    <MMap location={LOCATION} ref={x => map = x}>
      <MMapDefaultSchemeLayer />
      <MMapFeatureDataSource id="my-source" />
      <MMapLayer source="my-source" type="markers" zIndex={1800} />
      <MMapClusterer
        marker={marker}
        cluster={cluster}
        method={gridSizedMethod}
        features={points}
      />
    </MMap>
  </>;
}
// ...
ReactDOM.render(<App />, document.getElementById("app"));
```
