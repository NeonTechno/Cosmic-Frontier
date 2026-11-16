import test from 'node:test';
import assert from 'node:assert/strict';
import { healpixNestedIndex, normalizeMpcDistantRecords, SPHEREX_HIPS_TILE_SIZE } from '../src/server/spherexAdvancedService.ts';

test('SPHEREx tutorial coordinate resolves to nested Norder 5 pixel 445', () => {
  const tile = healpixNestedIndex(32, 60.8109955, 51.3404038);
  assert.equal(tile.pixel, 445);
  assert.equal(SPHEREX_HIPS_TILE_SIZE, 512);
  const child = healpixNestedIndex(32 * SPHEREX_HIPS_TILE_SIZE, 60.8109955, 51.3404038);
  assert.equal(child.pixel, 116764229);
  assert.equal(Math.floor(child.pixel / (SPHEREX_HIPS_TILE_SIZE ** 2)), tile.pixel);
  assert.equal(child.ix % SPHEREX_HIPS_TILE_SIZE, 299);
  assert.equal(child.iy % SPHEREX_HIPS_TILE_SIZE, 240);
});

test('MPC distant records are filtered to bound eTNOs and preserve published elements', () => {
  const objects = normalizeMpcDistantRecords([
    { Name: 'Example TNO', Number: '999001', Principal_desig: '2012 AB1', Epoch: 2460000.5,
      a: 250, e: 0.8, i: 12.5, Node: 40, Peri: 130, M: 20,
      Perihelion_dist: 50, Aphelion_dist: 450, Orbital_period: 3952,
      Last_obs: '2026-10-20', Num_obs: 125, Num_opps: 8 },
    { Name: 'Centaur', Principal_desig: '2001 XY', a: 120, e: 0.5, i: 4, Node: 10, Peri: 20, Perihelion_dist: 60 },
    { Name: 'Unbound', Principal_desig: '2002 XY', a: 300, e: 1.1, i: 4, Node: 10, Peri: 20, Perihelion_dist: 60 },
    { Name: 'Low perihelion', Principal_desig: '2003 XY', a: 300, e: 0.8, i: 4, Node: 10, Peri: 20, Perihelion_dist: 20 },
  ]);
  assert.equal(objects.length, 1);
  assert.equal(objects[0].semiMajorAxisAU, 250);
  assert.equal(objects[0].longPerihelionDeg, 170);
  assert.equal(objects[0].antiAligned, null);
  assert.equal(objects[0].clusteringStatus, 'not-assessed');
  assert.equal(objects[0].observationCount, 125);
  assert.equal(objects[0].lastObserved, '2026-10-20');
});
