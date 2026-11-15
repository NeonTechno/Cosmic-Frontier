/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Explicitly synthetic SPHEREx interface benchmark.
 * These deterministic fixtures demonstrate the workbench; they are never NASA/IPAC observations.
 */
import type { SpherexObservation, SyntheticStar, TransientCandidate } from '../../types/index.ts';
import { CHALLENGE_BENCHMARK_TARGETS } from '../../science/spherexCoordinates.ts';
import { SPHEREX_BANDS } from '../../science/spherexEngine.ts';

interface DemoTarget {
  id: string;
  name: string;
  category: string;
  raDeg: number;
  decDeg: number;
  fov: number;
  description: string;
  spectralType: string;
  distanceLy?: number;
  properMotion?: number;
  pmRa?: number;
  pmDec?: number;
  parallax?: number;
  gaiaId?: string;
  allwiseId?: string;
  highlights: string;
  features: string[];
  variabilityPeriod?: number;
  variabilityAmplitude?: number;
  spectrum: 'y-dwarf' | 't-dwarf' | 'protostar' | 'mira' | 'ice-cloud' | 'galaxy' | 'calibration' | 'stellar';
}

const EXTRA_TARGETS: DemoTarget[] = [
  {
    id: 'L1688-OPHIUCHUS', name: 'L1688 Ophiuchus Molecular Cloud Ice Core',
    category: 'Interstellar Ices', raDeg: 246.750, decDeg: -24.620, fov: 8,
    description: 'Synthetic molecular-cloud field for demonstrating ice-band inspection.',
    spectralType: 'Dense molecular cloud (demo template)',
    highlights: 'Illustrative H₂O, CO₂ and CO ice absorption workflow.',
    features: ['H₂O ice 3.05 µm', 'CO₂ ice 4.27 µm', 'CO ice 4.67 µm'], spectrum: 'ice-cloud',
  },
  {
    id: 'COSMOS-DEEP-STRIP', name: 'COSMOS Deep Galaxy Evolution Strip',
    category: 'Cosmic Inflation / Galaxies', raDeg: 150.119, decDeg: 2.205, fov: 10,
    description: 'Synthetic deep-field preview for galaxy and background-light analysis controls.',
    spectralType: 'Extragalactic deep field (demo template)',
    highlights: 'Illustrative deep-field spectral continuum and multi-band inspection.',
    features: ['Galaxy continuum', 'PAH 3.30 µm', 'Paschen-α 1.875 µm'], spectrum: 'galaxy',
  },
  {
    id: 'NORTH-ECLIPTIC-POLE', name: 'North Ecliptic Pole (NEP) Deep Calibration Field',
    category: 'Deep Celestial Poles', raDeg: 270.000, decDeg: 66.560, fov: 8,
    description: 'Synthetic calibration-field preview for band and detector comparison.',
    spectralType: 'Deep calibration field (demo template)',
    highlights: 'Illustrative reference field for exploring detector arrays and calibration views.',
    features: ['Continuum reference', 'Array-to-array comparison'], spectrum: 'calibration',
  },
];

const CHALLENGE_TARGETS: DemoTarget[] = CHALLENGE_BENCHMARK_TARGETS.map((t) => ({
  id: t.id,
  name: t.name,
  category: t.category,
  raDeg: t.raDeg,
  decDeg: t.decDeg,
  fov: t.fieldOfViewArcmin,
  description: t.scienceHighlights,
  spectralType: t.spectralType,
  distanceLy: t.distanceLightYears,
  properMotion: t.properMotionArcsecYr,
  pmRa: t.pmRaMasYr,
  pmDec: t.pmDecMasYr,
  parallax: t.parallaxMas,
  gaiaId: t.gaiaDr3Id,
  allwiseId: t.allwiseId,
  highlights: t.scienceHighlights,
  features: t.spherexDiscoverySignatures,
  variabilityPeriod: t.variabilityPeriodDays,
  variabilityAmplitude: t.variabilityDeltaMag,
  spectrum: t.id === 'WISE-0855' ? 'y-dwarf'
    : t.id === 'EPSILON-INDI-B' ? 't-dwarf'
    : t.id === 'RW-AURIGAE' ? 'protostar'
    : t.id === 'R-DRACONIS' ? 'mira' : 'stellar',
}));

export const SPHEREX_DEMO_TARGETS: DemoTarget[] = [...CHALLENGE_TARGETS, ...EXTRA_TARGETS];

function targetHash(name: string): number {
  return [...name].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 17);
}

function makeStars(epoch: number, seed: number, targetName: string): SyntheticStar[] {
  return Array.from({ length: 48 }, (_, i) => {
    const x = 0.07 + (((i * 37 + seed) % 85) / 100);
    const y = 0.07 + (((i * 53 + seed * 3) % 85) / 100);
    const variable = i === 7 || i === 23 || i === 36;
    const moving = i === 7 || i === 18;
    return {
      id: 'SIM-' + String(seed).slice(-4) + '-STAR-' + String(i + 1).padStart(3, '0'),
      x: Math.min(0.95, x + (moving ? epoch * 0.003 : epoch * ((i % 3) - 1) * 0.0006)),
      y: Math.min(0.95, y + (moving ? -epoch * 0.0015 : epoch * ((i % 4) - 2) * 0.0005)),
      peakFlux: 0.8 + ((i * 19 + seed) % 90) / 10 + (variable ? epoch * 1.1 : 0),
      fwhm: 0.004 + ((i * 7) % 5) / 1000,
      colorTempK: 2400 + ((i * 613 + seed) % 9000),
      isVariable: variable,
      varAmplitude: variable ? 0.12 + (i % 4) * 0.025 : 0,
      varPeriodDays: variable ? 12.4 + i : undefined,
      pmRaMasYr: (i % 5 - 2) * 18,
      pmDecMasYr: (i % 7 - 3) * 13,
      parallaxMas: 2 + (i % 9) * 0.4,
      spectralType: ['M', 'K', 'G', 'F', 'A'][i % 5],
      catalogName: 'SIMULATED SOURCE — NOT A CATALOG MATCH (' + targetName + ')',
      isTargetObject: i === 7,
    };
  });
}

function makeTransients(epoch: number, seed: number): TransientCandidate[] {
  return [
    {
      id: 'SIM-' + seed + '-TRANSIENT-A',
      x: 0.68 + epoch * 0.009,
      y: 0.34 - epoch * 0.006,
      raDeg: 0,
      decDeg: 0,
      deltaFluxMJySr: 2.4 + epoch * 0.7,
      snr: 5.2 + epoch * 1.1,
      candidateType: 'Infrared Variable Protostar',
      detectionEpoch: 'SIMULATED EPOCH ' + (epoch + 1),
      referenceEpoch: 'SIMULATED REFERENCE',
      significanceSigma: 5.2 + epoch * 1.1,
      isVerified: false,
    },
    {
      id: 'SIM-' + seed + '-TRANSIENT-B',
      x: 0.29,
      y: 0.72 - epoch * 0.004,
      raDeg: 0,
      decDeg: 0,
      deltaFluxMJySr: -1.1 - epoch * 0.2,
      snr: 3.8 + epoch * 0.4,
      candidateType: 'High Proper Motion Candidate',
      detectionEpoch: 'SIMULATED EPOCH ' + (epoch + 1),
      referenceEpoch: 'SIMULATED REFERENCE',
      significanceSigma: 3.8 + epoch * 0.4,
      isVerified: false,
    },
  ];
}

function spectralProfile(target: DemoTarget) {
  return SPHEREX_BANDS.map((band, i) => {
    const w = band.wavelengthMicrons;
    const gaussian = (center: number, width: number, depth: number) =>
      1 - depth * Math.exp(-Math.pow((w - center) / width, 2));
    let continuum = 5.2 + 1.7 * Math.sin(w * 1.12 + (targetHash(target.name) % 13) / 10) + w * 1.9;
    if (target.spectrum === 'galaxy') continuum = 9 + 3.5 * Math.pow(w, 0.7) + 1.2 * Math.sin(w * 2.1);
    if (target.spectrum === 'calibration') continuum = 7.5 + 0.4 * Math.sin(w * 1.5);
    let flux = continuum;
    if (target.spectrum === 'y-dwarf') {
      flux *= gaussian(1.67, 0.13, 0.23) * gaussian(2.20, 0.14, 0.17) * gaussian(3.05, 0.16, 0.48) * gaussian(4.27, 0.12, 0.34) * gaussian(4.67, 0.10, 0.28);
    } else if (target.spectrum === 't-dwarf') {
      flux *= gaussian(1.60, 0.18, 0.35) * gaussian(2.20, 0.15, 0.28) * gaussian(3.30, 0.15, 0.18) * gaussian(4.67, 0.12, 0.16);
    } else if (target.spectrum === 'protostar') {
      flux *= gaussian(1.875, 0.08, 0.12) * gaussian(3.30, 0.18, 0.20) * gaussian(4.05, 0.09, 0.10);
    } else if (target.spectrum === 'mira') {
      flux *= gaussian(2.30, 0.12, 0.25) * gaussian(3.05, 0.16, 0.20) * gaussian(4.67, 0.12, 0.30);
    } else if (target.spectrum === 'ice-cloud') {
      flux *= gaussian(3.05, 0.17, 0.55) * gaussian(4.27, 0.12, 0.34) * gaussian(4.67, 0.12, 0.22);
    } else if (target.spectrum === 'stellar') {
      flux *= gaussian(0.85, 0.08, 0.08) * gaussian(1.28, 0.08, 0.07) * gaussian(3.30, 0.15, 0.08);
    }
    const uncertainty = 0.08 + flux * 0.035;
    return {
      wavelength: w,
      fluxMJySr: Number(Math.max(0.02, flux).toFixed(4)),
      uncertainty: Number(uncertainty.toFixed(4)),
      modelFit: Number((flux * 0.985).toFixed(4)),
      bandLabel: 'SIM-BAND-' + String(i + 1).padStart(3, '0') + ' / ARRAY ' + band.arrayIndex,
      isMeasured: false,
    };
  });
}

function resolveTarget(input?: { targetName?: string; raDeg?: number; decDeg?: number; fovArcmin?: number }): DemoTarget {
  const q = (input?.targetName || '').toLowerCase().trim();
  const byName = SPHEREX_DEMO_TARGETS.find((t) =>
    q && (t.name.toLowerCase() === q || t.id.toLowerCase() === q ||
      t.name.toLowerCase().includes(q) || q.includes(t.name.toLowerCase()))
  );
  if (byName) return byName;
  if (Number.isFinite(input?.raDeg) && Number.isFinite(input?.decDeg)) {
    const byCoord = SPHEREX_DEMO_TARGETS.find((t) =>
      Math.abs(t.raDeg - Number(input?.raDeg)) < 0.05 && Math.abs(t.decDeg - Number(input?.decDeg)) < 0.05
    );
    if (byCoord) return byCoord;
    return {
      id: 'CUSTOM-SKY-FIELD',
      name: input?.targetName || 'Custom Sky Field',
      category: 'Custom Coordinates',
      raDeg: Number(input?.raDeg),
      decDeg: Number(input?.decDeg),
      fov: input?.fovArcmin || 6.5,
      description: 'Synthetic interface preview at user-supplied coordinates.',
      spectralType: 'Unclassified demo field',
      highlights: 'Generated sky field for testing the interactive workbench.',
      features: ['Illustrative infrared continuum', 'Synthetic source-motion markers'],
      spectrum: 'stellar',
    };
  }
  return SPHEREX_DEMO_TARGETS[2];
}

export function createSpherexDemoObservation(input?: {
  targetName?: string;
  raDeg?: number;
  decDeg?: number;
  fovArcmin?: number;
  fallbackReason?: string;
}): SpherexObservation {
  const target = resolveTarget(input);
  const seed = targetHash(target.name);
  const glonDeg = Number(((target.raDeg * 0.72 + target.decDeg * 0.31 + 180) % 360).toFixed(3));
  const glatDeg = Number((target.decDeg * 0.61 - target.raDeg * 0.08).toFixed(3));
  const dates = ['2025-05-15', '2025-11-15', '2026-05-15', '2026-11-15'];
  const epochs = dates.map((date, epoch) => ({
    frameId: 'SIM-' + target.id + '-EPOCH-' + (epoch + 1),
    timestamp: date + 'T00:00:00.000Z',
    epochIndex: epoch,
    bandWavelengthMicrons: 3.05,
    backgroundLevelMJySr: 0.9 + epoch * 0.08,
    stars: makeStars(epoch, seed, target.name),
    transients: makeTransients(epoch, seed).map((candidate) => ({
      ...candidate,
      raDeg: Number((target.raDeg + (candidate.x - 0.5) * target.fov / 60).toFixed(6)),
      decDeg: Number((target.decDeg + (0.5 - candidate.y) * target.fov / 60).toFixed(6)),
    })),
    nebulaIntensity: 2.8 + epoch * 0.25,
    detectorNoiseSigma: 0.045 + epoch * 0.002,
    surveyCycleName: 'SIMULATED SIX-MONTH CYCLE ' + (epoch + 1),
    isRealArchive: false,
  }));

  const properMotionTarget = target.properMotion !== undefined ? {
    name: target.name,
    pmRaMasYr: target.pmRa || 0,
    pmDecMasYr: target.pmDec || 0,
    totalPmArcsecYr: target.properMotion,
    parallaxMas: target.parallax || 0,
    spectralType: target.spectralType,
  } : undefined;

  return {
    id: 'SPHEREX-SIM-' + target.id,
    targetName: target.name,
    shortDesc: target.description,
    category: target.category,
    raDeg: target.raDeg,
    decDeg: target.decDeg,
    glonDeg,
    glatDeg,
    fieldOfViewArcmin: input?.fovArcmin || target.fov,
    detectorArray: 'SIMULATED D1–D6 / ALL SIX ARRAYS',
    pixelScaleArcsec: 6.2,
    dataQualityFlag: 'SIMULATED_DEMO',
    dataSourceStatus: 'SIMULATED_DEMO',
    dataSourceLabel: 'SIMULATED_BENCHMARK — preloaded interface challenge preview for ' + target.name + '. Generated example pixels, source positions, four epochs, overlays and a 102-point SED. Not a NASA/IPAC observation, not a FITS product, and not a scientific detection.' +
      (input?.fallbackReason ? ' Live archive retrieval status: ' + input.fallbackReason : ''),
    documentationUrl: 'https://irsa.ipac.caltech.edu/Missions/spherex.html',
    fitsHeader: {
      DEMO_MODE: 'true',
      DATA_ORIGIN: 'LOCAL SYNTHETIC BENCHMARK FIXTURE',
      IS_NASA_DATA: 'false',
      IS_FITS_PRODUCT: 'false',
      TARGET_TEMPLATE: target.id,
      CHANNELS: 102,
      WAVELENGTH: '0.75–5.00 um (illustrative model)',
      EPOCHS: 4,
      SIM_EXPTIME_SEC: 180,
      SIM_FPA_TEMP_K: 80,
      PIXSCALE_ARCSEC: 6.2,
      GAIA_REFERENCE: target.gaiaId || 'Not queried in demo mode',
      ALLWISE_REFERENCE: target.allwiseId || 'Not queried in demo mode',
      DISTANCE_LIGHT_YEARS: target.distanceLy ?? 'Not supplied for this field',
      PROPER_MOTION_ARCSEC_YR: target.properMotion ?? 'Not supplied for this field',
      KEY_SCIENCE_SIGNATURES: target.features.join('; '),
      SCIENCE_HIGHLIGHTS: target.highlights,
      NOTICE: 'SIMULATED VALUES — NOT ARCHIVE MEASUREMENTS',
    },
    epochs,
    fullSedCurve: spectralProfile(target),
    archiveSummary: {
      dr1ObservationCount: 0,
      qr3ObservationCount: 0,
      availableBands: [],
      distinctMjdCount: 0,
      earliestDate: 'Not queried',
      latestDate: 'Not queried',
      queryLatencyMs: 0,
      cached: false,
      limitations: [
        'SIMULATED_BENCHMARK only: the four displayed epochs are illustrative and do not imply DR1/QR3 archive coverage.',
        'Select Query Live IRSA to attempt a real DR1/QR3 retrieval. A failed request leaves coverage unknown.',
      ],
    },
    gaiaSources: [],
    allWiseCutouts: [],
    contaminationFlags: {
      zodiacalLevel: 'Moderate',
      strayLight: false,
      cosmicRayHits: 4,
      saturationWarning: false,
      moonSeparationDeg: 68.4,
    },
    ...(properMotionTarget ? { properMotionTarget } : {}),
    ...(target.variabilityPeriod ? {
      variabilityTarget: {
        name: target.name,
        periodDays: target.variabilityPeriod,
        amplitudeMag: target.variabilityAmplitude || 0,
        classification: target.spectralType,
      },
    } : {}),
  };
}

export function createSpherexDemoObservations(): SpherexObservation[] {
  return SPHEREX_DEMO_TARGETS.map((target) => createSpherexDemoObservation({ targetName: target.name }));
}
