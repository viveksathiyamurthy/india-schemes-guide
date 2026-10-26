import assert from 'node:assert/strict';
import { buildPlanet, mapToDir, stateAt, stateSlugs, dirToMap } from '../src/lib/planet';
import { mapShapes } from '../src/data/southMap';

// Each state's centre on the sphere must land inside that same state.
stateSlugs.forEach((slug, i) => {
  const [cx, cy] = mapShapes[slug].centroid;
  assert.equal(stateAt(mapToDir(cx, cy)), i, `${slug} centre`);
});
// Far away and the back of the planet are sea.
assert.equal(stateAt([0, 0, -1]), -1);
assert.equal(stateAt(mapToDir(10, 10)), -1);
// Round trip.
const [x, y] = dirToMap(mapToDir(200, 300));
assert.ok(Math.abs(x - 200) < 0.01 && Math.abs(y - 300) < 0.01);
const t0 = Date.now();
const p = buildPlanet({});
console.log('vertices', p.planet.vertexCount, 'clouds', p.clouds.vertexCount, 'ms', Date.now() - t0);
assert.ok(p.planet.vertexCount > 50000);
console.log('planet tests passed');
