/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Explicitly synthetic SPHEREx interface demonstration.
 * This fixture is for exercising the viewer only; it is not NASA/IPAC data.
 */
import type { SpherexObservation, SyntheticStar, TransientCandidate } from '../../types/index.ts';

const DEMO_RA = 83.8;
const DEMO_DEC = -5.4;

function makeStars(epoch: number): SyntheticStar[] {
  return Array.from({ length: 42 }, (_, i) => {
    const x = 0.08 + ((i * 37) % 83) / 100;
    const y = 0.08 + ((i * 53 + 17) % 83) / 100;
    const variable = i === 7 || i === 23;
    return {
      id: `SIM-STAR-${String(i + 1).padStart(3, '0')}`,
      x: Math.min(0.94, x + (epoch * ((i % 3) - 1) * 0.0015)),
      y: Math.min(0.94, y + (epoch * ((i % 4) - 2) * 0.001)),
      peakFlux: 0.8 + ((i * 19) % 90) / 10 + (variable ? epoch * 1.8 : 0),
      fwhm: 0.004 + ((i * 7) % 5) / 1000,
      colorTempK: 2400 + ((i * 613) % 9000),
      isVariable: variable,
      varAmplitude: variable ? 0.18 : 0,
      varPeriodDays: variable ? 12.4 + i : undefined,
      pmRaMasYr: (i % 5 - 2) * 18,
      pmDecMasYr: (i % 7 - 3) * 13,
      parallaxMas: 2 + (i % 9) * 0.4,
      spectralType: ['M', 'K', 'G', 'F', 'A'][i % 5],
      catalogName: 'SIMULATED SOURCE',
      isTargetObject: i === 7,
    };
  });
}

function makeTransients(epoch: number): TransientCandidate[] {
  return [
    {
      id: 'SIM-TRANSIENT-A',
      x: 0.68 + epoch * 0.012,
      y: 0.34 - epoch * 0.006,
      raDeg: DEMO_RA - 0.003,
      decDeg: DEMO_DEC + 0.002,
      deltaFluxMJySr: 2.4 + epoch * 0.7,
      snr: 5.2 + epoch * 1.1,
      candidateType: 'Infrared Variable Protostar',
      detectionEpoch: `SIMULATED EPOCH ${epoch + 1}`,
      referenceEpoch: 'SIMULATED REFERENCE',
      significanceSigma: 5.2 + epoch * 1.1,
      isVerified: false,
    },
    {
      id: 'SIM-TRANSIENT-B',
      x: 0.29,
      y: 0.72 - epoch * 0.004,
      raDeg: DEMO_RA + 0.002,
      decDeg: DEMO_DEC - 0.002,
      deltaFluxMJySr: -1.1 - epoch * 0.2,
      snr: 3.8 + epoch * 0.4,
      candidateType: 'High Proper Motion Candidate',
      detectionEpoch: `SIMULATED EPOCH ${epoch + 1}`,
      referenceEpoch: 'SIMULATED REFERENCE',
      significanceSigma: 3.8 + epoch * 0.4,
      isVerified: false,
    },
  ];
}

export function createSpherexDemoObservation(): SpherexObservation {
  const epochs = [0, 1, 2].map((epoch) => ({
    frameId: `SIM-DEMO-FRAME-${epoch + 1}`,
    timestamp: ['2025-01-15T00:00:00.000Z', '2025-07-15T00:00:00.000Z', '2026-01-15T00:00:00.000Z'][epoch],
    epochIndex: epoch,
    bandWavelengthMicrons: [1.65, 3.05, 4.27][epoch],
    backgroundLevelMJySr: 0.9 + epoch * 0.08,
    stars: makeStars(epoch),
    transients: makeTransients(epoch),
    nebulaIntensity: 2.8 + epoch * 0.25,
    detectorNoiseSigma: 0.045,
    surveyCycleName: `SIMULATED SIX-MONTH CYCLE ${epoch + 1}`,
  }));

  const fullSedCurve = Array.from({ length: 102 }, (_, i) => {
    const wavelength = 0.75 + (4.25 * i) / 101;
    const absorption = (center: number, width: number, depth: number) =>
      1 - depth * Math.exp(-Math.pow((wavelength - center) / width, 2));
    const continuum = 3.2 + 0.55 * Math.sin(wavelength * 1.7) + wavelength * 0.22;
    const flux = continuum *
      absorption(3.05, 0.13, 0.48) *
      absorption(4.27, 0.10, 0.34) *
      absorption(4.67, 0.09, 0.26);
    return {
      wavelength: Number(wavelength.toFixed(4)),
      fluxMJySr: Number(flux.toFixed(4)),
      uncertainty: Number((0.08 + flux * 0.035).toFixed(4)),
      modelFit: Number((flux * 0.985).toFixed(4)),
      bandLabel: `SIM-BAND-${String(i + 1).padStart(3, '0')}`,
      isMeasured: false,
    };
  });

  return {
    id: 'SPHEREX-SIMULATED-DEMO-001',
    targetName: 'Illustrative Infrared Field',
    shortDesc: 'Interactive synthetic field for demonstrating the SPHEREx analysis workflow',
    category: 'Interstellar Ices',
    raDeg: DEMO_RA,
    decDeg: DEMO_DEC,
    glonDeg: 209.0,
    glatDeg: -19.5,
    fieldOfViewArcmin: 6.5,
    detectorArray: 'SIMULATED SIX-ARRAY COVERAGE',
    pixelScaleArcsec: 6.2,
    dataQualityFlag: 'SIMULATED_DEMO',
    dataSourceStatus: 'SIMULATED_DEMO',
    dataSourceLabel: 'SIMULATED DEMONSTRATION ONLY — illustrative pixels, sources, epochs and spectra generated for interface testing. Not a NASA/IPAC observation, not FITS data, and not a scientific detection.',
    documentationUrl: 'https://irsa.ipac.caltech.edu/Missions/spherex.html',
    fitsHeader: {
      DEMO_MODE: true,
      DATA_ORIGIN: 'LOCAL SYNTHETIC FIXTURE',
      IS_NASA_DATA: false,
      IS_FITS_PRODUCT: false,
      CHANNELS: 102,
      WAVELENGTH: '0.75–5.00 um (illustrative model)',
      EPOCHS: 3,
      NOTICE: 'SIMULATED VALUES — NOT ARCHIVE MEASUREMENTS',
    },
    epochs,
    fullSedCurve,
    archiveSummary: {
      dr1ObservationCount: 0,
      qr3ObservationCount: 0,
      availableBands: [],
      distinctMjdCount: 0,
      earliestDate: 'SIMULATED',
      latestDate: 'SIMULATED',
      queryLatencyMs: 0,
      cached: false,
      limitations: ['This is a synthetic UI demonstration, not an IRSA query result.'],
    },
    gaiaSources: [],
    allWiseCutouts: [],
    contaminationFlags: {
      zodiacalLevel: 'Moderate',
      strayLight: false,
      cosmicRayHits: 0,
      saturationWarning: false,
      moonSeparationDeg: 90,
    },
  };
}
