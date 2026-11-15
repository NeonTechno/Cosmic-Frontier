/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * COSMIC FRONTIER — Core TypeScript Type Definitions
 * NASA Space Apps Challenge 2026
 */

export type StretchMode = 'linear' | 'log' | 'asinh' | 'sqrt';
export type ColorMap = 'inferno' | 'viridis' | 'magma' | 'plasma' | 'grayscale' | 'coolwarm';

export interface SpectralBand {
  bandId: number;              // 1 to 102
  arrayIndex: 1 | 2 | 3 | 4 | 5 | 6; // SPHEREx 6 detector arrays
  wavelengthMicrons: number;   // 0.75 to 5.00
  resolvingPower: number;      // R ~ 40 to 130
  scienceTarget: string;       // e.g. "Water Ice", "Galaxy Inflation", "Extragalactic Background Light"
  spectralFeatures: string[];  // e.g. ["H2O Ice 3.05µm", "CO2 Ice 4.27µm", "CO Ice 4.67µm", "PAH 3.3µm"]
  isKeyLine?: boolean;
}

export interface SyntheticStar {
  id: string;
  x: number; // 0..1 normalized in field
  y: number; // 0..1 normalized in field
  peakFlux: number; // MJy/sr
  fwhm: number;
  colorTempK: number;
  isVariable?: boolean;
  varAmplitude?: number;
  varPeriodDays?: number;
  pmRaMasYr?: number;
  pmDecMasYr?: number;
  parallaxMas?: number;
  spectralType?: string;
  catalogName?: string;
  isTargetObject?: boolean;
}

export interface TransientCandidate {
  id: string;
  x: number;
  y: number;
  raDeg: number;
  decDeg: number;
  deltaFluxMJySr: number;
  snr: number;
  candidateType: 'Supernova / Optical Transient' | 'Infrared Variable Protostar' | 'Fast Moving Solar System Object' | 'High Proper Motion Candidate' | 'Brown Dwarf Candidate';
  detectionEpoch: string;
  referenceEpoch: string;
  significanceSigma: number;
  isVerified?: boolean;
}

export interface FitsWcsInfo {
  crval1: number;
  crval2: number;
  crpix1: number;
  crpix2: number;
  cd1_1: number;
  cd1_2: number;
  cd2_1: number;
  cd2_2: number;
  ctype1: string;
  ctype2: string;
  pixelScaleArcsec: number;
}

export interface RealFitsStats {
  min: number;
  max: number;
  median: number;
  p05: number;
  p99: number;
  rmsNoise: number;
  apertureFluxMJySr: number;
  apertureErrMJySr: number;
  apertureSnr: number;
  zodiMedianMJySr?: number;
  centroidX: number; // 0..1 normalized
  centroidY: number; // 0..1 normalized
  flaggedPixelCount: number;
}

export interface RealFitsCutoutData {
  width: number;
  height: number;
  imagePixels: number[];      // row-major bottom-to-top or top-to-bottom normalized for canvas
  zodiPixels?: number[];
  variancePixels?: number[];
  flagsPixels?: number[];
  wcs?: FitsWcsInfo;
  headerSummary: Record<string, string | number>;
  stats: RealFitsStats;
}

export interface GaiaSourceRecord {
  sourceId: string;
  raDeg: number;
  decDeg: number;
  pmRaMasYr: number | null;
  pmDecMasYr: number | null;
  parallaxMas: number | null;
  photGMeanMag: number | null;
  bpRpColor: number | null;
  ruwe: number | null;
  distanceArcsecFromCenter: number;
}

export interface AllWiseCutoutRecord {
  band: 'W1' | 'W2';
  wavelengthMicrons: number;
  coaddId: string;
  raDeg: number;
  decDeg: number;
  epochLabel: string;
  mjdObs: number;
  fitsCutoutUrl: string;
  fitsData?: RealFitsCutoutData;
}

export interface ObservationFrame {
  frameId: string;
  timestamp: string;
  epochIndex: number;
  bandWavelengthMicrons: number;
  exposureTimeSec?: number;
  backgroundLevelMJySr: number;
  stars: SyntheticStar[];
  transients: TransientCandidate[];
  nebulaIntensity: number;
  detectorNoiseSigma: number;
  surveyCycleName?: string;
  // Real archive metadata & FITS data (present when retrieved from IRSA)
  obsId?: string;
  obsCollection?: string;
  mjdObs?: number;
  detectorBand?: string;
  emMinMicrons?: number;
  emMaxMicrons?: number;
  accessUrl?: string;
  isRealArchive?: boolean;
  fitsData?: RealFitsCutoutData;
}

export interface SpherexObservation {
  id: string;
  targetName: string;
  shortDesc: string;
  category: 'Interstellar Ices' | 'Cosmic Inflation / Galaxies' | 'Extragalactic Background Light' | 'Deep Celestial Poles' | 'High Proper Motion Stars' | 'Brown Dwarfs' | 'Variable Stars' | 'Solar System Objects' | string;
  raDeg: number;
  decDeg: number;
  glonDeg: number;
  glatDeg: number;
  fieldOfViewArcmin: number;
  detectorArray: string;
  detectorTempK?: number;
  pixelScaleArcsec: number;
  dataQualityFlag: 'CALIBRATED_NOMINAL' | 'HIGH_BACKGROUND_ZODIACAL' | 'PASSING_CALIBRATION';
  dataSourceStatus: 'LIVE_IRSA_SPHEREX' | 'LOCAL_IRSA_SPHEREX' | 'REAL_MISSION_ARCHIVAL';
  dataSourceLabel: string;
  documentationUrl: string;
  fitsHeader: Record<string, string | number>;
  epochs: ObservationFrame[];
  fullSedCurve: {
    wavelength: number;
    fluxMJySr: number;
    uncertainty: number;
    modelFit: number;
    bandLabel?: string;
    isMeasured?: boolean;
    obsId?: string;
  }[];
  archiveSummary?: {
    dr1ObservationCount: number;
    qr3ObservationCount: number;
    availableBands: string[];
    distinctMjdCount: number;
    earliestDate: string;
    latestDate: string;
    queryLatencyMs: number;
    cached: boolean;
    limitations: string[];
    collectionResults?: {
      collection: string;
      status: 'success' | 'error';
      rowCount: number;
      attempts: number;
      latencyMs: number;
      error?: string;
    }[];
    wiseViewUrl?: string;
    irsaFinderUrl?: string;
    aladinUrl?: string;
  };
  gaiaSources?: GaiaSourceRecord[];
  allWiseCutouts?: AllWiseCutoutRecord[];
  contaminationFlags?: {
    zodiacalLevel: 'Low' | 'Moderate' | 'High';
    strayLight: boolean;
    cosmicRayHits: number;
    saturationWarning: boolean;
    moonSeparationDeg: number;
  };
  properMotionTarget?: {
    name: string;
    pmRaMasYr: number;
    pmDecMasYr: number;
    totalPmArcsecYr: number;
    parallaxMas: number;
    spectralType: string;
  };
  variabilityTarget?: {
    name: string;
    periodDays: number;
    amplitudeMag: number;
    classification: string;
  };
}

export interface PlanetXCandidate {
  id: string;
  designation: string;
  survey: 'WISE / NEOWISE' | 'Subaru HSC Deep' | 'Pan-STARRS' | 'Rubin LSST Mock Drill';
  raDeg: number;
  decDeg: number;
  eclipticLonDeg: number;
  eclipticLatDeg: number;
  heliocentricDistanceAU: number;
  apparentMagW1: number; // 3.4 µm
  apparentMagW2: number; // 4.6 µm
  colorW1W2: number;
  properMotionAlphaArcsecYr: number; // Proper motion in RA
  properMotionDeltaArcsecYr: number; // Proper motion in Dec
  parallaxArcsec: number;            // Annual heliocentric parallax
  estimatedMassEarths: number;
  astrometricSnr: number;
  status: 'unvetted' | 'candidate' | 'known_asteroid' | 'instrumental_artifact' | 'brown_dwarf';
  confidenceScore: number; // 0 - 100
  notes: string;
  observationHistory: {
    epoch: string;
    dxArcsec: number;
    dyArcsec: number;
    w1FluxMjy: number;
    w2FluxMjy: number;
    surveyTag: string;
  }[];
  theoreticalConsistency: number; // Alignment with Batygin & Brown 2021 predictions
  vettedBy?: string;
  vettingTimestamp?: string;
  vettingVerdict?: string;
}

export interface ExtremeTNO {
  id: string;
  name: string;
  semiMajorAxisAU: number;
  perihelionDistAU: number;
  aphelionDistAU: number;
  eccentricity: number;
  inclinationDeg: number;
  longAscNodeDeg: number;
  argPerihelionDeg: number;
  longPerihelionDeg: number; // varpi = Omega + omega
  discoveryYear: number;
  discoverySurvey: string;
  antiAligned: boolean; // Part of the clustered population argument
  orbitalPeriodYears: number;
}

export interface PlanetXHypothesisParams {
  massEarths: number;
  semiMajorAxisAU: number;
  perihelionAU: number;
  aphelionAU: number;
  eccentricity: number;
  inclinationDeg: number;
  argPerihelionDeg: number;
  longAscNodeDeg: number;
  meanAnomalyDeg: number;
  orbitalPeriodYears: number;
  predictedSkyRegion: {
    raCenterDeg: number;
    decCenterDeg: number;
    angularRadiusDeg: number;
    constellation: string;
  };
}

export interface AstrometryFitResult {
  observedPositions: { epochMJD: number; ra: number; dec: number }[];
  modelTrajectory: { epochMJD: number; ra: number; dec: number }[];
  parallaxAmplitudeArcsec: number;
  linearProperMotionArcsecYr: number;
  reducedChi2: number;
  isPhysicalOrbit: boolean;
}

export interface NasaDataEndpointStatus {
  serviceId: string;
  name: string;
  organization: string;
  endpointUrl: string;
  protocol: 'TAP / IVOA' | 'SIAv2' | 'REST / JSON' | 'PDS4';
  status: 'ONLINE_AVAILABLE' | 'PRE_LAUNCH_SPEC' | 'PROXY_SIMULATED';
  lastPingMs: number;
  description: string;
  documentationRef: string;
}

export interface AiExplanationRequest {
  contextType: 'spherex_fits' | 'spherex_spectrum' | 'planet_x_candidate' | 'etno_clustering' | 'transient_detection' | 'general_science';
  dataPayload: Record<string, unknown>;
  userPrompt?: string;
}

export interface AiExplanationResponse {
  success: boolean;
  explanation: string;
  groundedAttributes: string[];
  scientificReferences: string[];
  dataVerificationStatus: 'GROUNDED_VERIFIED' | 'SIMULATION_GROUNDED';
  confidenceRating: 'HIGH_PRECISION' | 'THEORETICAL_MODEL';
  modelUsed: string;
  timestamp: string;
}

export type GeminiExplanationRequest = AiExplanationRequest;
export type GeminiExplanationResponse = AiExplanationResponse;
