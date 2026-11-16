import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAstrometricTrajectory,
  INITIAL_CANDIDATE_QUEUE,
  LITERATURE_ETNO_REFERENCE_SAMPLE,
} from '../src/science/orbitalMechanics.ts';
import type { PlanetXCandidate } from '../src/types/index.ts';

function makeCandidate(distanceAU: number | null): PlanetXCandidate {
  return {
    id: 'ASTROMETRY-TEST',
    designation: 'Astrometry test fixture',
    survey: 'Rubin LSST Mock Drill',
    dataOrigin: 'SYNTHETIC_DEMO',
    raDeg: 120,
    decDeg: 20,
    eclipticLonDeg: 120,
    eclipticLatDeg: 0,
    heliocentricDistanceAU: distanceAU,
    apparentMagW1: null,
    apparentMagW2: null,
    colorW1W2: null,
    properMotionAlphaArcsecYr: 0.01,
    properMotionDeltaArcsecYr: -0.02,
    parallaxArcsec: null,
    estimatedMassEarths: null,
    astrometricSnr: null,
    status: 'unvetted',
    confidenceScore: null,
    notes: 'Synthetic test only',
    observationHistory: [
      { epoch: '2024-01-01T00:00:00Z', dxArcsec: 0, dyArcsec: 0, w1FluxMjy: null, w2FluxMjy: null, surveyTag: 'Synthetic fixture' },
      { epoch: '2025-01-01T00:00:00Z', dxArcsec: 0.2, dyArcsec: -0.1, w1FluxMjy: null, w2FluxMjy: null, surveyTag: 'Synthetic fixture' },
    ],
    theoreticalConsistency: null,
  };
}

test('astrometric illustration refuses to invent a default heliocentric distance', () => {
  assert.throws(
    () => calculateAstrometricTrajectory(makeCandidate(null)),
    /positive, explicitly supplied heliocentric distance/
  );
});

test('astrometric illustration uses supplied observation epochs and makes no fit claim', () => {
  const candidate = makeCandidate(400);
  const result = calculateAstrometricTrajectory(candidate);

  const firstEpochMjd = Date.parse('2024-01-01T00:00:00Z') / 86400000 + 40587;
  const secondEpochMjd = Date.parse('2025-01-01T00:00:00Z') / 86400000 + 40587;
  assert.ok(Math.abs(result.modelTrajectory[0].epochMJD - firstEpochMjd) < 1e-9);
  assert.equal(result.observedPositions.length, 2);
  assert.ok(Math.abs(result.observedPositions[1].epochMJD - secondEpochMjd) < 1e-9);
  assert.equal(result.reducedChi2, null);
  assert.equal(result.isPhysicalOrbit, null);
  assert.equal(result.modelStatus, 'ILLUSTRATIVE_ONLY');
});

test('bundled Planet X candidate fixtures are explicitly synthetic', () => {
  assert.ok(INITIAL_CANDIDATE_QUEUE.length > 0);
  assert.ok(INITIAL_CANDIDATE_QUEUE.every((candidate) => candidate.dataOrigin === 'SYNTHETIC_DEMO'));
});

test('bundled ETNO examples are identified as literature references', () => {
  assert.ok(LITERATURE_ETNO_REFERENCE_SAMPLE.length > 0);
  assert.ok(LITERATURE_ETNO_REFERENCE_SAMPLE.every((object) => object.source === 'literature'));
});
