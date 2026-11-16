import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCelestialCoordinates } from '../src/science/spherexCoordinates.ts';
import { SPHEREX_BANDS } from '../src/science/spherexEngine.ts';

test('SPHEREx band table contains 102 channels across six arrays', () => {
  assert.equal(SPHEREX_BANDS.length, 102);
  assert.equal(SPHEREX_BANDS[0].wavelengthMicrons, 0.75);
  assert.equal(SPHEREX_BANDS.at(-1)?.wavelengthMicrons, 5);
  for (let arrayIndex = 1; arrayIndex <= 6; arrayIndex += 1) {
    assert.equal(SPHEREX_BANDS.filter((band) => band.arrayIndex === arrayIndex).length, 17);
  }
});

test('SPHEREx spectral channels are numbered sequentially', () => {
  assert.deepEqual(
    SPHEREX_BANDS.map((band) => band.bandId),
    Array.from({ length: 102 }, (_, index) => index + 1)
  );
});

test('coordinate parser converts sexagesimal coordinates to decimal degrees', () => {
  const result = parseCelestialCoordinates('08h55m10.831s', '-7d14m42.53s');
  assert.equal(result.valid, true);
  assert.ok(Math.abs(result.raDeg - 133.79513) < 0.00002);
  assert.ok(Math.abs(result.decDeg - (-7.24515)) < 0.00002);
});

test('coordinate parser rejects out-of-range declination', () => {
  const result = parseCelestialCoordinates('12h00m00s', '+91d00m00s');
  assert.equal(result.valid, false);
});
