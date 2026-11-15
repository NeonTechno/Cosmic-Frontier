/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * COSMIC FRONTIER — Celestial Coordinate Parser & SPHEREx Benchmark Targets
 * NASA Space Apps Challenge 2026: Mapping the Universe with SPHEREx
 */

import type { SpherexObservation, ObservationFrame, SyntheticStar, TransientCandidate } from '../types/index.ts';

/**
 * Benchmark Astronomical Targets specified by NASA Space Apps Challenge
 */
export interface ChallengeBenchmarkTarget {
  id: string;
  name: string;
  designation: string;
  category: 'High Proper Motion Stars' | 'Brown Dwarfs' | 'Variable Stars' | 'Solar System Objects';
  raDeg: number;
  decDeg: number;
  sexagesimalRa: string;
  sexagesimalDec: string;
  fieldOfViewArcmin: number;
  spectralType: string;
  distanceLightYears: number;
  properMotionArcsecYr: number;
  pmRaMasYr: number;
  pmDecMasYr: number;
  parallaxMas: number;
  isVariable: boolean;
  variabilityPeriodDays?: number;
  variabilityDeltaMag?: number;
  scienceHighlights: string;
  spherexDiscoverySignatures: string[];
  gaiaDr3Id: string;
  allwiseId: string;
}

export const CHALLENGE_BENCHMARK_TARGETS: ChallengeBenchmarkTarget[] = [
  {
    id: 'BARNARDS-STAR',
    name: "Barnard's Star",
    designation: 'GJ 699 / Munich 1',
    category: 'High Proper Motion Stars',
    raDeg: 269.4521,
    decDeg: 4.6934,
    sexagesimalRa: '17h 57m 48.50s',
    sexagesimalDec: '+04° 41′ 36.2″',
    fieldOfViewArcmin: 6.0,
    spectralType: 'M4.0V Red Dwarf',
    distanceLightYears: 5.96,
    properMotionArcsecYr: 10.33,
    pmRaMasYr: -798.58,
    pmDecMasYr: 10328.12,
    parallaxMas: 546.98,
    isVariable: false,
    scienceHighlights: 'Fastest apparent proper motion star in the celestial sphere (~10.33″/yr). Moves ~5.16″ between each 6-month SPHEREx all-sky pass.',
    spherexDiscoverySignatures: [
      'Displaces by ~0.83 SPHEREx pixels every 6 months along northeast trajectory',
      'Strong TiO and near-IR H2O vapor absorption across Arrays 1–3',
      'Benchmark astrometric motion calibration standard',
    ],
    gaiaDr3Id: 'Gaia DR3 4472832130942585856',
    allwiseId: 'WISE J175748.49+044137.7',
  },
  {
    id: 'EPSILON-INDI-B',
    name: 'Epsilon Indi B (Ba/Bb)',
    designation: 'HD 209100 B / Eps Ind Ba,Bb',
    category: 'Brown Dwarfs',
    raDeg: 331.0438,
    decDeg: -56.7860,
    sexagesimalRa: '22h 04m 10.52s',
    sexagesimalDec: '-56° 47′ 09.5″',
    fieldOfViewArcmin: 4.0,
    spectralType: 'T1V + T6V Binary Brown Dwarf',
    distanceLightYears: 11.81,
    properMotionArcsecYr: 4.70,
    pmRaMasYr: 3961.0,
    pmDecMasYr: -2539.0,
    parallaxMas: 275.8,
    isVariable: false,
    scienceHighlights: 'Nearest known pair of brown dwarfs to Earth, orbiting primary star Epsilon Indi with mutual orbital period of ~15 years.',
    spherexDiscoverySignatures: [
      'Spectacular deep methane (CH4) absorption troughs at 1.6µm, 2.2µm, and 3.3µm',
      'Collision-induced H2 absorption suppressing flux in Array 3',
      'Binary separation resolvable across Array 4 & 5 (2.42 - 4.42 µm)',
    ],
    gaiaDr3Id: 'Gaia DR3 6412571447043329280',
    allwiseId: 'WISE J220410.51-564709.6',
  },
  {
    id: 'WISE-0855',
    name: 'WISE 0855-0714',
    designation: 'WISE J085510.83-071442.5',
    category: 'Brown Dwarfs',
    raDeg: 133.7951,
    decDeg: -7.2451,
    sexagesimalRa: '08h 55m 10.831s',
    sexagesimalDec: '-07° 14′ 42.53″',
    fieldOfViewArcmin: 5.0,
    spectralType: 'Y4 Sub-stellar Brown Dwarf (250 K)',
    distanceLightYears: 7.27,
    properMotionArcsecYr: 8.15,
    pmRaMasYr: -8132.0,
    pmDecMasYr: 541.0,
    parallaxMas: 448.5,
    isVariable: false,
    scienceHighlights: 'Fourth closest star/substellar system to the Sun. Coldest known brown dwarf (~250 K) with atmospheric water-ice clouds. Discovered via multi-epoch blink comparisons.',
    spherexDiscoverySignatures: [
      'Near-total optical darkness; shines in SPHEREx near-IR (Array 4 & 5, 3.5 - 5.0 µm)',
      'Water ice cloud absorption dip around 3.05 µm and 4.6 µm',
      'Fast westward proper motion: moves ~4.08″ between consecutive SPHEREx survey epochs',
    ],
    gaiaDr3Id: 'Non-detection in Optical Gaia (G > 22 mag)',
    allwiseId: 'WISE J085510.83-071442.5',
  },
  {
    id: 'RW-AURIGAE',
    name: 'RW Aurigae',
    designation: 'RW Aur A/B / HIP 23873',
    category: 'Variable Stars',
    raDeg: 76.9564,
    decDeg: 30.4014,
    sexagesimalRa: '05h 07m 49.54s',
    sexagesimalDec: '+30° 24′ 05.1″',
    fieldOfViewArcmin: 8.0,
    spectralType: 'Classical T Tauri (CTTS) Binary',
    distanceLightYears: 532.0,
    properMotionArcsecYr: 0.024,
    pmRaMasYr: 1.25,
    pmDecMasYr: -23.8,
    parallaxMas: 6.13,
    isVariable: true,
    variabilityPeriodDays: 2.77,
    variabilityDeltaMag: 3.8,
    scienceHighlights: 'Famous young protostellar binary undergoing catastrophic dust occultation dips caused by circumstellar tidal arms and protoplanetary disk perturbations.',
    spherexDiscoverySignatures: [
      'Dramatic infrared photometric variability between 6-month epochs (ΔFlux > 300%)',
      'Massive warm circumstellar silicate & PAH dust emission in 3–5 µm bands',
      'Clear dipole residual signature in difference imaging analysis',
    ],
    gaiaDr3Id: 'Gaia DR3 162985172289694464',
    allwiseId: 'WISE J050749.54+302405.0',
  },
  {
    id: 'R-DRACONIS',
    name: 'R Draconis',
    designation: 'HD 149214 / HR 6157',
    category: 'Variable Stars',
    raDeg: 248.1676,
    decDeg: 66.7551,
    sexagesimalRa: '16h 32m 40.23s',
    sexagesimalDec: '+66° 45′ 18.2″',
    fieldOfViewArcmin: 10.0,
    spectralType: 'M5e-M9e Mira Pulsating Red Giant',
    distanceLightYears: 1350.0,
    properMotionArcsecYr: 0.038,
    pmRaMasYr: 14.2,
    pmDecMasYr: 35.1,
    parallaxMas: 2.42,
    isVariable: true,
    variabilityPeriodDays: 245.6,
    variabilityDeltaMag: 6.5,
    scienceHighlights: 'Extreme long-period pulsating Mira red giant varying by over 6.5 visual magnitudes every 245 days. Circumstellar molecular envelope of carbon and water.',
    spherexDiscoverySignatures: [
      'Huge amplitude brightness pulsation perfectly sampled by SPHEREx 6-month survey cycles',
      'Deep CO molecular overtone bands at 2.3 µm and 4.67 µm',
      'Circumstellar dust thermal emission peak in Array 5 & 6',
    ],
    gaiaDr3Id: 'Gaia DR3 1645081192849502976',
    allwiseId: 'WISE J163240.23+664518.2',
  },
];

/**
 * Robust Celestial Coordinate Parser
 * Parses both sexagesimal (e.g., "08h55m10.831s, -7d14m42.53s") and decimal degrees ("133.795, -7.245")
 */
export function parseCelestialCoordinates(
  raStr: string,
  decStr: string
): { raDeg: number; decDeg: number; valid: boolean; error?: string } {
  const cleanRa = raStr.trim();
  const cleanDec = decStr.trim();

  if (!cleanRa || !cleanDec) {
    return { raDeg: 0, decDeg: 0, valid: false, error: 'Both RA and Declination coordinates are required.' };
  }

  let raDeg: number | null = null;
  let decDeg: number | null = null;

  // 1. Try direct decimal degrees
  const raNum = parseFloat(cleanRa);
  const decNum = parseFloat(cleanDec);
  if (!isNaN(raNum) && !isNaN(decNum) && !cleanRa.includes('h') && !cleanRa.includes(':') && !cleanDec.includes('d') && !cleanDec.includes(':')) {
    if (raNum >= 0 && raNum <= 360 && decNum >= -90 && decNum <= 90) {
      raDeg = raNum;
      decDeg = decNum;
    }
  }

  // 2. Parse sexagesimal RA: e.g. "08h55m10.831s" or "08:55:10.831" or "08 55 10.831"
  if (raDeg === null) {
    const raMatch = cleanRa.match(/^(\d{1,2})(?:h|:|\s+)(\d{1,2})(?:m|:|\s+)(\d{1,2}(?:\.\d+)?)(?:s)?$/i);
    if (raMatch) {
      const h = parseFloat(raMatch[1]);
      const m = parseFloat(raMatch[2]);
      const s = parseFloat(raMatch[3]);
      if (h < 24 && m < 60 && s < 60) {
        raDeg = (h + m / 60 + s / 3600) * 15.0;
      }
    }
  }

  // 3. Parse sexagesimal Dec: e.g. "-7d14m42.53s" or "+04:41:36.2" or "-07 14 42.53"
  if (decDeg === null) {
    const decMatch = cleanDec.match(/^([+-]?)(\d{1,2})(?:d|°|:|\s+)(\d{1,2})(?:m|'|:|\s+)(\d{1,2}(?:\.\d+)?)(?:s|″|")?$/i);
    if (decMatch) {
      const sign = decMatch[1] === '-' ? -1 : 1;
      const d = parseFloat(decMatch[2]);
      const m = parseFloat(decMatch[3]);
      const s = parseFloat(decMatch[4]);
      if (d <= 90 && m < 60 && s < 60) {
        decDeg = sign * (d + m / 60 + s / 3600);
      }
    }
  }

  if (raDeg === null || decDeg === null) {
    return {
      raDeg: 0,
      decDeg: 0,
      valid: false,
      error: 'Invalid format. Use sexagesimal (e.g., 08h55m10.831s, -7d14m42.53s) or decimal degrees (e.g., 133.795, -7.245)',
    };
  }

  // Normalization
  raDeg = (raDeg % 360 + 360) % 360;
  if (decDeg < -90 || decDeg > 90) {
    return { raDeg: 0, decDeg: 0, valid: false, error: 'Declination must be between -90° and +90°.' };
  }

  return {
    raDeg: Number(raDeg.toFixed(5)),
    decDeg: Number(decDeg.toFixed(5)),
    valid: true,
  };
}

/**
 * Format decimal degrees into standard astronomical sexagesimal RA
 */
export function formatSexagesimalRA(raDeg: number): string {
  const norm = (raDeg % 360 + 360) % 360;
  const hours = norm / 15.0;
  const h = Math.floor(hours);
  const remM = (hours - h) * 60;
  const m = Math.floor(remM);
  const s = (remM - m) * 60;
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toFixed(2).padStart(5, '0')}s`;
}

/**
 * Format decimal degrees into standard astronomical sexagesimal Dec
 */
export function formatSexagesimalDec(decDeg: number): string {
  const sign = decDeg >= 0 ? '+' : '-';
  const abs = Math.abs(decDeg);
  const d = Math.floor(abs);
  const remM = (abs - d) * 60;
  const m = Math.floor(remM);
  const s = (remM - m) * 60;
  return `${sign}${d.toString().padStart(2, '0')}° ${m.toString().padStart(2, '0')}′ ${s.toFixed(1).padStart(4, '0')}″`;
}

/**
 * Convert RA/Dec to Galactic Coordinates (l, b)
 */
export function celestialToGalactic(raDeg: number, decDeg: number): { glonDeg: number; glatDeg: number } {
  const rad = Math.PI / 180;
  const ra = raDeg * rad;
  const dec = decDeg * rad;

  // North Galactic Pole: RA = 192.85948°, Dec = 27.12825° (J2000)
  const raNGP = 192.85948 * rad;
  const decNGP = 27.12825 * rad;
  const lNCP = 122.93192 * rad;

  const sinB = Math.sin(dec) * Math.sin(decNGP) + Math.cos(dec) * Math.cos(decNGP) * Math.cos(ra - raNGP);
  const b = Math.asin(Math.max(-1, Math.min(1, sinB)));

  const cosB = Math.cos(b);
  const sinL = (Math.cos(dec) * Math.sin(ra - raNGP)) / (cosB || 0.0001);
  const cosL = (Math.sin(dec) * Math.cos(decNGP) - Math.cos(dec) * Math.sin(decNGP) * Math.cos(ra - raNGP)) / (cosB || 0.0001);

  let l = lNCP - Math.atan2(sinL, cosL);
  l = ((l / rad) % 360 + 360) % 360;

  return {
    glonDeg: Number(l.toFixed(2)),
    glatDeg: Number((b / rad).toFixed(2)),
  };
}

/**
 * Generate 4 authentic SPHEREx survey epochs (Survey 1: May 2025, Survey 2: Nov 2025, Survey 3: May 2026, Survey 4: Nov 2026)
 * for a specific target with true astronomical motions or variability.
 */
export function generateBenchmarkObservation(target: ChallengeBenchmarkTarget): SpherexObservation {
  const { glonDeg, glatDeg } = celestialToGalactic(target.raDeg, target.decDeg);
  const fov = target.fieldOfViewArcmin; // e.g. 6 arcmin
  const fovArcsec = fov * 60; // 360 arcsec

  // Survey cycles
  const surveyCycles = [
    { cycle: 'Survey 1', date: '2025-05-15T12:00:00Z', dtYr: 0.0, mjd: 60810.5 },
    { cycle: 'Survey 2', date: '2025-11-15T12:00:00Z', dtYr: 0.5, mjd: 60994.5 },
    { cycle: 'Survey 3', date: '2026-05-15T12:00:00Z', dtYr: 1.0, mjd: 61175.5 },
    { cycle: 'Survey 4', date: '2026-11-15T12:00:00Z', dtYr: 1.5, mjd: 61359.5 },
  ];

  // Primary target starting normalized coordinates (centered in field)
  const originX = 0.50;
  const originY = 0.50;

  // Create fixed reference field background stars
  const fixedFieldStars: SyntheticStar[] = [
    { id: 'BG-STAR-01', x: 0.22, y: 0.28, peakFlux: 14.5, fwhm: 0.024, colorTempK: 5500, catalogName: 'Gaia DR3 Ref 1' },
    { id: 'BG-STAR-02', x: 0.78, y: 0.20, peakFlux: 19.8, fwhm: 0.025, colorTempK: 6200, catalogName: 'Gaia DR3 Ref 2' },
    { id: 'BG-STAR-03', x: 0.18, y: 0.76, peakFlux: 11.2, fwhm: 0.023, colorTempK: 4800, catalogName: 'Gaia DR3 Ref 3' },
    { id: 'BG-STAR-04', x: 0.84, y: 0.72, peakFlux: 16.0, fwhm: 0.025, colorTempK: 5100, catalogName: 'Gaia DR3 Ref 4' },
    { id: 'BG-STAR-05', x: 0.35, y: 0.85, peakFlux: 8.7, fwhm: 0.022, colorTempK: 7000, catalogName: 'Gaia DR3 Ref 5' },
    { id: 'BG-STAR-06', x: 0.65, y: 0.15, peakFlux: 7.9, fwhm: 0.022, colorTempK: 4300, catalogName: 'Gaia DR3 Ref 6' },
  ];

  const epochs: ObservationFrame[] = surveyCycles.map((sc, epIdx) => {
    // Calculate target position for this epoch
    // properMotion in arcsec/yr. Normalized delta = (arcsec / fovArcsec)
    const dRaArcsec = (target.pmRaMasYr / 1000) * sc.dtYr;
    const dDecArcsec = (target.pmDecMasYr / 1000) * sc.dtYr;

    // In astronomy projection: X increases towards east (-RA), Y increases towards north (+Dec)
    const normDx = (-dRaArcsec / fovArcsec);
    const normDy = (dDecArcsec / fovArcsec);

    let targetFlux = 35.0;
    if (target.id === 'RW-AURIGAE') {
      // Catastrophic occultation variability
      const fluxes = [38.5, 8.2, 24.0, 46.8];
      targetFlux = fluxes[epIdx] ?? 30.0;
    } else if (target.id === 'R-DRACONIS') {
      // 245.6 day Mira pulsation curve sampled at 6-month (182.6-day) intervals
      const fluxes = [45.2, 7.8, 32.4, 48.0];
      targetFlux = fluxes[epIdx] ?? 35.0;
    } else if (target.id === 'WISE-0855') {
      targetFlux = 26.5; // faint cold brown dwarf
    } else if (target.id === 'EPSILON-INDI-B') {
      targetFlux = 32.0;
    } else {
      targetFlux = 42.0; // Barnard's Star
    }

    const frameStars: SyntheticStar[] = [...fixedFieldStars];

    if (target.id === 'EPSILON-INDI-B') {
      // Binary brown dwarf pair! Ba and Bb orbiting barycenter
      const orbitalAngle = (epIdx * 0.12) * Math.PI * 2; // slow 15-year orbit
      const separationNorm = 0.016; // resolvable separation
      frameStars.push({
        id: 'TGT-EPS-INDI-BA',
        x: originX + normDx - separationNorm * Math.cos(orbitalAngle),
        y: originY + normDy - separationNorm * Math.sin(orbitalAngle),
        peakFlux: targetFlux * 0.65,
        fwhm: 0.026,
        colorTempK: 1300,
        spectralType: 'T1V Brown Dwarf',
        catalogName: 'Eps Ind Ba',
        pmRaMasYr: target.pmRaMasYr,
        pmDecMasYr: target.pmDecMasYr,
        parallaxMas: target.parallaxMas,
        isTargetObject: true,
      });
      frameStars.push({
        id: 'TGT-EPS-INDI-BB',
        x: originX + normDx + separationNorm * Math.cos(orbitalAngle),
        y: originY + normDy + separationNorm * Math.sin(orbitalAngle),
        peakFlux: targetFlux * 0.45,
        fwhm: 0.025,
        colorTempK: 900,
        spectralType: 'T6V Brown Dwarf',
        catalogName: 'Eps Ind Bb',
        pmRaMasYr: target.pmRaMasYr,
        pmDecMasYr: target.pmDecMasYr,
        parallaxMas: target.parallaxMas,
        isTargetObject: true,
      });
    } else {
      // Single target object
      frameStars.push({
        id: `TGT-${target.id}`,
        x: originX + normDx,
        y: originY + normDy,
        peakFlux: targetFlux,
        fwhm: 0.026,
        colorTempK: target.spectralType.includes('Red Dwarf') ? 3100 : target.spectralType.includes('Brown Dwarf') ? 1000 : 5000,
        spectralType: target.spectralType,
        catalogName: target.name,
        pmRaMasYr: target.pmRaMasYr,
        pmDecMasYr: target.pmDecMasYr,
        parallaxMas: target.parallaxMas,
        isTargetObject: true,
        isVariable: target.isVariable,
      });
    }

    const transients: TransientCandidate[] = [];
    if (epIdx > 0 && Math.abs(target.properMotionArcsecYr) > 1.0) {
      transients.push({
        id: `PM-MOTION-${target.id}-${epIdx}`,
        x: originX + normDx,
        y: originY + normDy,
        raDeg: target.raDeg + (dRaArcsec / 3600),
        decDeg: target.decDeg + (dDecArcsec / 3600),
        deltaFluxMJySr: targetFlux * 0.75,
        snr: 24.5,
        candidateType: target.category === 'Brown Dwarfs' ? 'Brown Dwarf Candidate' : 'High Proper Motion Candidate',
        detectionEpoch: sc.date,
        referenceEpoch: surveyCycles[0].date,
        significanceSigma: 18.2,
        isVerified: true,
      });
    } else if (epIdx > 0 && target.isVariable) {
      transients.push({
        id: `VAR-FLUX-${target.id}-${epIdx}`,
        x: originX,
        y: originY,
        raDeg: target.raDeg,
        decDeg: target.decDeg,
        deltaFluxMJySr: Math.abs(targetFlux - 38.5),
        snr: 19.8,
        candidateType: 'Infrared Variable Protostar',
        detectionEpoch: sc.date,
        referenceEpoch: surveyCycles[0].date,
        significanceSigma: 14.5,
        isVerified: true,
      });
    }

    return {
      frameId: `SPHEREX-FRAME-${target.id}-EP0${epIdx + 1}`,
      timestamp: sc.date,
      epochIndex: epIdx,
      bandWavelengthMicrons: 3.05,
      exposureTimeSec: 180,
      backgroundLevelMJySr: target.id === 'WISE-0855' ? 0.65 : 1.15,
      nebulaIntensity: target.id === 'RW-AURIGAE' ? 0.45 : 0.08,
      detectorNoiseSigma: 0.028,
      stars: frameStars,
      transients,
      surveyCycleName: `${sc.cycle} (${sc.date.slice(0, 7)})`,
    };
  });

  // Target-specific SED curves calibrated to physical near-IR chemistry
  let sedCurve: SpherexObservation['fullSedCurve'] = [];
  if (target.id === 'BARNARDS-STAR') {
    sedCurve = [
      { wavelength: 0.85, fluxMJySr: 28.5, uncertainty: 0.8, modelFit: 28.2 },
      { wavelength: 1.25, fluxMJySr: 38.4, uncertainty: 0.9, modelFit: 38.0 },
      { wavelength: 1.65, fluxMJySr: 44.2, uncertainty: 1.1, modelFit: 44.0 }, // Peak near-IR H-band
      { wavelength: 2.20, fluxMJySr: 36.8, uncertainty: 0.9, modelFit: 36.5 },
      { wavelength: 3.05, fluxMJySr: 22.4, uncertainty: 0.7, modelFit: 22.1 }, // H2O vapor opacity
      { wavelength: 4.27, fluxMJySr: 15.6, uncertainty: 0.5, modelFit: 15.4 },
      { wavelength: 4.85, fluxMJySr: 12.8, uncertainty: 0.4, modelFit: 12.5 },
    ];
  } else if (target.id === 'WISE-0855') {
    // Ultra-cool Y-dwarf: completely suppressed below 2µm, bright near 4.5µm
    sedCurve = [
      { wavelength: 0.85, fluxMJySr: 0.2, uncertainty: 0.05, modelFit: 0.15 },
      { wavelength: 1.25, fluxMJySr: 0.8, uncertainty: 0.1, modelFit: 0.75 },
      { wavelength: 1.65, fluxMJySr: 2.4, uncertainty: 0.15, modelFit: 2.3 },
      { wavelength: 2.20, fluxMJySr: 1.6, uncertainty: 0.12, modelFit: 1.5 }, // Strong CH4 absorption
      { wavelength: 3.05, fluxMJySr: 0.9, uncertainty: 0.1, modelFit: 0.85 }, // Water ice cloud absorption
      { wavelength: 4.27, fluxMJySr: 18.4, uncertainty: 0.6, modelFit: 18.2 }, // Mid-IR peak window
      { wavelength: 4.85, fluxMJySr: 24.8, uncertainty: 0.8, modelFit: 24.5 },
    ];
  } else if (target.id === 'EPSILON-INDI-B') {
    // T-dwarf pair with deep methane troughs
    sedCurve = [
      { wavelength: 0.85, fluxMJySr: 2.5, uncertainty: 0.15, modelFit: 2.4 },
      { wavelength: 1.25, fluxMJySr: 16.8, uncertainty: 0.5, modelFit: 16.5 }, // J-band peak
      { wavelength: 1.65, fluxMJySr: 6.2, uncertainty: 0.3, modelFit: 6.0 },  // CH4 drop
      { wavelength: 2.15, fluxMJySr: 14.5, uncertainty: 0.4, modelFit: 14.2 }, // K-band peak
      { wavelength: 3.05, fluxMJySr: 4.8, uncertainty: 0.2, modelFit: 4.6 },  // H2O/CH4 absorption
      { wavelength: 4.27, fluxMJySr: 22.4, uncertainty: 0.7, modelFit: 22.0 },
      { wavelength: 4.85, fluxMJySr: 19.5, uncertainty: 0.6, modelFit: 19.2 },
    ];
  } else if (target.id === 'RW-AURIGAE') {
    // Young star with warm dust disk excess
    sedCurve = [
      { wavelength: 0.85, fluxMJySr: 22.0, uncertainty: 0.7, modelFit: 21.8 },
      { wavelength: 1.25, fluxMJySr: 28.5, uncertainty: 0.8, modelFit: 28.2 },
      { wavelength: 1.65, fluxMJySr: 34.0, uncertainty: 0.9, modelFit: 33.8 },
      { wavelength: 2.20, fluxMJySr: 41.2, uncertainty: 1.1, modelFit: 41.0 },
      { wavelength: 3.05, fluxMJySr: 46.5, uncertainty: 1.2, modelFit: 46.0 }, // Circumstellar dust thermal peak
      { wavelength: 4.27, fluxMJySr: 52.8, uncertainty: 1.4, modelFit: 52.5 },
      { wavelength: 4.85, fluxMJySr: 56.4, uncertainty: 1.5, modelFit: 56.0 },
    ];
  } else {
    // R-DRACONIS (Mira pulsating giant)
    sedCurve = [
      { wavelength: 0.85, fluxMJySr: 12.0, uncertainty: 0.4, modelFit: 11.8 },
      { wavelength: 1.25, fluxMJySr: 29.5, uncertainty: 0.8, modelFit: 29.2 },
      { wavelength: 1.65, fluxMJySr: 48.0, uncertainty: 1.2, modelFit: 47.8 }, // Massive stellar peak
      { wavelength: 2.20, fluxMJySr: 42.5, uncertainty: 1.1, modelFit: 42.1 },
      { wavelength: 3.05, fluxMJySr: 28.0, uncertainty: 0.8, modelFit: 27.5 },
      { wavelength: 4.27, fluxMJySr: 36.4, uncertainty: 1.0, modelFit: 36.0 },
      { wavelength: 4.85, fluxMJySr: 32.1, uncertainty: 0.9, modelFit: 31.8 },
    ];
  }

  return {
    id: `SPHEREX-2026-${target.id}`,
    targetName: target.name,
    shortDesc: `${target.designation} (${target.spectralType}) — ${target.scienceHighlights}`,
    category: target.category,
    raDeg: target.raDeg,
    decDeg: target.decDeg,
    glonDeg,
    glatDeg,
    fieldOfViewArcmin: target.fieldOfViewArcmin,
    detectorArray: 'Array 1 - 6 All-Sky Full Pass (0.75 - 5.00 µm)',
    detectorTempK: 80.0,
    pixelScaleArcsec: 6.2,
    dataQualityFlag: 'CALIBRATED_NOMINAL',
    dataSourceStatus: 'SIMULATED_BENCHMARK',
    dataSourceLabel: 'Pre-loaded Challenge Benchmark — click "Query Live IRSA" or select a target to load live DR1/QR3 FITS cutouts',
    documentationUrl: 'https://irsa.ipac.caltech.edu/Missions/spherex.html',
    fitsHeader: {
      'SIMPLE': 'T',
      'BITPIX': -32,
      'NAXIS': 3,
      'NAXIS1': 2048,
      'NAXIS2': 2048,
      'NAXIS3': 102,
      'TELESCOP': 'SPHEREx Space Observatory',
      'INSTRUME': 'SPHEREx-FPA',
      'OBJECT': target.name,
      'CRVAL1': target.raDeg,
      'CRVAL2': target.decDeg,
      'CDELT1': -0.00172,
      'CDELT2': 0.00172,
      'EQUINOX': 2000.0,
      'RADESYS': 'ICRS',
      'PMRA': target.pmRaMasYr,
      'PMDEC': target.pmDecMasYr,
      'PLX': target.parallaxMas,
      'SP_TYPE': target.spectralType,
      'GAIA_ID': target.gaiaDr3Id,
      'WISE_ID': target.allwiseId,
      'WAVEMIN': 0.75,
      'WAVEMAX': 5.00,
      'PIPELINE': 'IPAC_SPHEREX_L3_v2.4',
      'DATA_REL': 'SPHEREx_SURVEY_CYCLE_1-4',
    },
    epochs,
    fullSedCurve: sedCurve,
    contaminationFlags: {
      zodiacalLevel: target.id === 'WISE-0855' ? 'Moderate' : 'Low',
      strayLight: false,
      cosmicRayHits: 4,
      saturationWarning: false,
      moonSeparationDeg: 68.4,
    },
    properMotionTarget: {
      name: target.name,
      pmRaMasYr: target.pmRaMasYr,
      pmDecMasYr: target.pmDecMasYr,
      totalPmArcsecYr: target.properMotionArcsecYr,
      parallaxMas: target.parallaxMas,
      spectralType: target.spectralType,
    },
    variabilityTarget: target.isVariable
      ? {
          name: target.name,
          periodDays: target.variabilityPeriodDays || 0,
          amplitudeMag: target.variabilityDeltaMag || 0,
          classification: target.spectralType,
        }
      : undefined,
  };
}

/**
 * Generate a dynamic SPHEREx multi-epoch observation cube for arbitrary user-entered coordinates.
 */
export function generateObservationAtCoordinates(
  raDeg: number,
  decDeg: number,
  customName?: string,
  fieldOfViewArcmin: number = 6.0
): SpherexObservation {
  const { glonDeg, glatDeg } = celestialToGalactic(raDeg, decDeg);
  const targetName = customName || `Sky Field (RA ${raDeg.toFixed(3)}°, Dec ${decDeg.toFixed(3)}°)`;

  // Realistic background stars based on galactic latitude
  const starDensity = Math.max(4, Math.min(18, Math.round(18 - Math.abs(glatDeg) / 5)));
  const stars: SyntheticStar[] = [];

  // Seeded pseudo-random placement
  const seed = Math.abs(Math.sin(raDeg * 12.9898 + decDeg * 78.233)) * 43758.5453;
  const pseudoRand = (i: number) => {
    const x = Math.sin(seed + i * 99.123) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < starDensity; i++) {
    const sx = 0.1 + pseudoRand(i * 3 + 1) * 0.8;
    const sy = 0.1 + pseudoRand(i * 3 + 2) * 0.8;
    const peak = 6.0 + pseudoRand(i * 3 + 3) * 28.0;
    const temp = 3000 + Math.round(pseudoRand(i * 3 + 4) * 6000);
    stars.push({
      id: `STAR-FLD-${i + 1}`,
      x: Number(sx.toFixed(3)),
      y: Number(sy.toFixed(3)),
      peakFlux: Number(peak.toFixed(1)),
      fwhm: 0.024,
      colorTempK: temp,
      catalogName: `Gaia DR3 source ${Math.round(seed * 1000 + i)}`,
    });
  }

  // Include one moving object candidate near center to reward citizen scientist exploration
  const candidateMover: SyntheticStar = {
    id: 'CANDIDATE-MOVER-01',
    x: 0.50,
    y: 0.50,
    peakFlux: 18.4,
    fwhm: 0.025,
    colorTempK: 2400,
    spectralType: 'Uncataloged Moving Object Candidate',
    catalogName: 'SPHEREx Fast Mover / Candidate',
    pmRaMasYr: -3400.0,
    pmDecMasYr: 1800.0,
    isTargetObject: true,
  };
  stars.push(candidateMover);

  const surveyCycles = [
    { cycle: 'Survey 1', date: '2025-05-15T12:00:00Z', dtYr: 0.0 },
    { cycle: 'Survey 2', date: '2025-11-15T12:00:00Z', dtYr: 0.5 },
    { cycle: 'Survey 3', date: '2026-05-15T12:00:00Z', dtYr: 1.0 },
    { cycle: 'Survey 4', date: '2026-11-15T12:00:00Z', dtYr: 1.5 },
  ];

  const fovArcsec = fieldOfViewArcmin * 60;

  const epochs: ObservationFrame[] = surveyCycles.map((sc, epIdx) => {
    const dRaArcsec = (-3400.0 / 1000) * sc.dtYr;
    const dDecArcsec = (1800.0 / 1000) * sc.dtYr;
    const normDx = (-dRaArcsec / fovArcsec);
    const normDy = (dDecArcsec / fovArcsec);

    const frameStars = stars.map((s) => {
      if (s.id === 'CANDIDATE-MOVER-01') {
        return {
          ...s,
          x: Math.min(0.95, Math.max(0.05, 0.50 + normDx)),
          y: Math.min(0.95, Math.max(0.05, 0.50 + normDy)),
        };
      }
      return { ...s };
    });

    const transients: TransientCandidate[] = [];
    if (epIdx > 0) {
      transients.push({
        id: `TR-CUSTOM-MOV-${epIdx}`,
        x: Math.min(0.95, Math.max(0.05, 0.50 + normDx)),
        y: Math.min(0.95, Math.max(0.05, 0.50 + normDy)),
        raDeg: raDeg + (dRaArcsec / 3600),
        decDeg: decDeg + (dDecArcsec / 3600),
        deltaFluxMJySr: 12.5,
        snr: 9.8,
        candidateType: 'Fast Moving Solar System Object',
        detectionEpoch: sc.date,
        referenceEpoch: surveyCycles[0].date,
        significanceSigma: 8.2,
        isVerified: false,
      });
    }

    return {
      frameId: `FRAME-CUSTOM-RA${raDeg.toFixed(1)}-EP0${epIdx + 1}`,
      timestamp: sc.date,
      epochIndex: epIdx,
      bandWavelengthMicrons: 3.05,
      exposureTimeSec: 180,
      backgroundLevelMJySr: 0.95,
      nebulaIntensity: Math.abs(glatDeg) < 15 ? 0.35 : 0.05,
      detectorNoiseSigma: 0.03,
      stars: frameStars,
      transients,
      surveyCycleName: `${sc.cycle} (${sc.date.slice(0, 7)})`,
    };
  });

  return {
    id: `SPHEREX-CUSTOM-${raDeg.toFixed(2)}_${decDeg.toFixed(2)}`,
    targetName,
    shortDesc: `SPHEREx 102-Band Multi-Epoch Sky Cutout centered at RA ${raDeg.toFixed(4)}°, Dec ${decDeg.toFixed(4)}° (l=${glonDeg}°, b=${glatDeg}°).`,
    category: 'High Proper Motion Stars',
    raDeg,
    decDeg,
    glonDeg,
    glatDeg,
    fieldOfViewArcmin,
    detectorArray: 'Array 1 - 6 All-Sky Full Pass (0.75 - 5.00 µm)',
    detectorTempK: 80.0,
    pixelScaleArcsec: 6.2,
    dataQualityFlag: 'CALIBRATED_NOMINAL',
    dataSourceStatus: 'SIMULATED_BENCHMARK',
    dataSourceLabel: 'CALIBRATED SYNTHETIC GENERATOR: Coordinate Benchmark Preview (Query IRSA Live Archive for Real DR1/QR3 FITS Cutouts)',
    documentationUrl: 'https://irsa.ipac.caltech.edu/Missions/spherex.html',
    fitsHeader: {
      'SIMPLE': 'T',
      'BITPIX': -32,
      'NAXIS': 3,
      'NAXIS1': 2048,
      'NAXIS2': 2048,
      'NAXIS3': 102,
      'TELESCOP': 'SPHEREx Space Observatory',
      'INSTRUME': 'SPHEREx-FPA',
      'CRVAL1': raDeg,
      'CRVAL2': decDeg,
      'CDELT1': -0.00172,
      'CDELT2': 0.00172,
      'EQUINOX': 2000.0,
      'RADESYS': 'ICRS',
      'PIPELINE': 'IPAC_SPHEREX_CUTOUT_v1.0',
    },
    epochs,
    fullSedCurve: [
      { wavelength: 0.85, fluxMJySr: 14.5, uncertainty: 0.5, modelFit: 14.2 },
      { wavelength: 1.25, fluxMJySr: 21.0, uncertainty: 0.6, modelFit: 20.8 },
      { wavelength: 1.65, fluxMJySr: 26.5, uncertainty: 0.7, modelFit: 26.2 },
      { wavelength: 2.20, fluxMJySr: 22.0, uncertainty: 0.6, modelFit: 21.8 },
      { wavelength: 3.05, fluxMJySr: 17.5, uncertainty: 0.5, modelFit: 17.2 },
      { wavelength: 4.27, fluxMJySr: 12.0, uncertainty: 0.4, modelFit: 11.8 },
      { wavelength: 4.85, fluxMJySr: 10.5, uncertainty: 0.35, modelFit: 10.2 },
    ],
    contaminationFlags: {
      zodiacalLevel: 'Low',
      strayLight: false,
      cosmicRayHits: 3,
      saturationWarning: false,
      moonSeparationDeg: 82.1,
    },
  };
}
