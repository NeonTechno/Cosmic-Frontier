/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * COSMIC FRONTIER — Celestial Coordinate Parser & SPHEREx Benchmark Targets
 * NASA Space Apps Challenge 2026: Mapping the Universe with SPHEREx
 */


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

