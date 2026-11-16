import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateClusteringSignificance } from '../src/science/orbitalMechanics.ts';
import type { ExtremeTNO } from '../src/types/index.ts';

function object(index: number, varpi: number, inclination = 20, node = 45, antiAligned: boolean | null = null): ExtremeTNO {
  return {
    id: 'test-' + index,
    name: 'Test TNO ' + index,
    semiMajorAxisAU: 250 + index,
    perihelionDistAU: 40,
    aphelionDistAU: 500,
    eccentricity: 0.8,
    inclinationDeg: inclination,
    longAscNodeDeg: node,
    argPerihelionDeg: (varpi - node + 360) % 360,
    longPerihelionDeg: varpi,
    discoveryYear: 2010 + index,
    discoverySurvey: 'Synthetic unit-test fixture',
    antiAligned,
    orbitalPeriodYears: 4000,
    source: 'MPC',
    orbitEpochJD: 2460000.5 + index,
  };
}

test('orbital statistics include all eligible objects, ignoring legacy antiAligned flags', () => {
  const sample = Array.from({ length: 8 }, (_, i) => object(i, 45, 20, 70, false));
  const result = calculateClusteringSignificance(sample, 5000, 1234);

  assert.equal(result.sampleSize, 8);
  assert.equal(result.poleSampleSize, 8);
  assert.equal(result.meanVarpiDeg, 45);
  assert.equal(result.rayleighR, 1);
  assert.equal(result.pValueClustering, 0.0002);
  assert.equal(result.poleRayleighR, 1);
  assert.equal(result.pValuePoleClustering, 0.0002);
  assert.equal(result.selectionBiasCorrected, false);
  assert.ok(result.warnings.some((warning) => warning.includes('antiAligned annotations were ignored')));
});

test('uniformly spaced perihelion longitudes do not appear strongly clustered', () => {
  const sample = [0, 90, 180, 270].map((angle, i) => object(i, angle));
  const result = calculateClusteringSignificance(sample, 5000, 99);

  assert.ok(result.rayleighR < 0.000001);
  assert.equal(result.meanVarpiDeg, null);
  assert.equal(result.dispersionDeg, null);
  assert.equal(result.pValueClustering, 1);
});

test('Monte Carlo orbital diagnostics are deterministic for a fixed sample and seed', () => {
  const sample = [
    object(1, 12, 10, 25),
    object(2, 25, 14, 32),
    object(3, 38, 18, 39),
    object(4, 52, 22, 46),
    object(5, 65, 26, 53),
  ];
  const first = calculateClusteringSignificance(sample, 3000, 2026);
  const second = calculateClusteringSignificance(sample, 3000, 2026);
  assert.deepEqual(first, second);
  assert.equal(first.simulations, 3000);
  assert.equal(first.seed, 2026);
  assert.equal(first.analysisVersion, 'orbital-null-monte-carlo-v1');
});

test('empty or invalid angular samples return neutral p-values and explicit limitations', () => {
  const result = calculateClusteringSignificance([], 1000, 7);
  assert.equal(result.sampleSize, 0);
  assert.equal(result.poleSampleSize, 0);
  assert.equal(result.pValueClustering, 1);
  assert.equal(result.pValuePoleClustering, 1);
  assert.equal(result.meanPoleLongitudeDeg, null);
  assert.equal(result.poleDispersionDeg, null);
  assert.equal(result.selectionBiasCorrected, false);
  assert.ok(result.warnings.some((warning) => warning.includes('Not corrected for survey pointing')));
});

test('Monte Carlo simulation count is bounded', () => {
  assert.throws(() => calculateClusteringSignificance([], 999), /between 1,000 and 100,000/);
  assert.throws(() => calculateClusteringSignificance([], 100001), /between 1,000 and 100,000/);
});
