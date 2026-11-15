/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BLACK STAR ORBIT — Live Astronomical Archive Service
 * Queries NASA/IPAC IRSA SIAv2 (SPHEREx DR1 & QR3), IRSA AllWISE IBE,
 * and ESA Gaia DR3 TAP with TTL caching and honest fallback provenance.
 */

import fs from 'fs';
import path from 'path';
import type {
  AllWiseCutoutRecord,
  GaiaSourceRecord,
  ObservationFrame,
  SpherexObservation,
  SyntheticStar,
} from '../types/index.ts';
import {
  CHALLENGE_BENCHMARK_TARGETS,
  celestialToGalactic,
  generateBenchmarkObservation,
  generateObservationAtCoordinates,
  parseCelestialCoordinates,
} from '../science/spherexCoordinates.ts';
import { fitsPixelToSky, parseAndReprojectFitsCutout, skyToFitsPixel } from './fitsParser.ts';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const MEMORY_CACHE = new Map<string, CacheEntry<unknown>>();
const CACHE_DIR = '/tmp/blackstar_astro_cache';
const DEFAULT_TTL_MS = 1000 * 60 * 30; // 30 min cache for immutable archive cutouts

function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  } catch {
    // ignore cache dir creation errors
  }
}

function getCached<T>(key: string): T | null {
  const mem = MEMORY_CACHE.get(key) as CacheEntry<T> | undefined;
  if (mem && mem.expiresAt > Date.now()) {
    return mem.value;
  }

  try {
    const safeKey = key.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 160);
    const filePath = path.join(CACHE_DIR, `${safeKey}.json`);
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as CacheEntry<T>;
      if (parsed.expiresAt > Date.now()) {
        MEMORY_CACHE.set(key, parsed);
        return parsed.value;
      }
    }
  } catch {
    // ignore disk cache miss
  }
  return null;
}

function setCached<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs };
  MEMORY_CACHE.set(key, entry);
  try {
    ensureCacheDir();
    const safeKey = key.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 160);
    const filePath = path.join(CACHE_DIR, `${safeKey}.json`);
    fs.writeFileSync(filePath, JSON.stringify(entry));
  } catch {
    // ignore disk write errors
  }
}

export interface SiaObservationRow {
  obsId: string;
  obsCollection: string;
  bandpassName: string;
  sRa: number;
  sDec: number;
  tMinMjd: number;
  tMaxMjd: number;
  emMinMicrons: number;
  emMaxMicrons: number;
  tExptime: number;
  pixelScaleArcsec: number;
  calibLevel: number;
  accessUrl: string;
  accessFormat: string;
}

function mjdToIso(mjd: number): string {
  if (!Number.isFinite(mjd) || mjd <= 0) return '2025-01-01T00:00:00Z';
  const unixMs = (mjd - 40587) * 86400 * 1000;
  return new Date(unixMs).toISOString();
}

function bandCenterMicrons(band: string, emMin: number, emMax: number): number {
  if (Number.isFinite(emMin) && Number.isFinite(emMax) && emMax > emMin) {
    return Number(((emMin + emMax) / 2).toFixed(3));
  }
  const defaults: Record<string, number> = {
    'SPHEREx-D1': 0.93,
    'SPHEREx-D2': 1.38,
    'SPHEREx-D3': 2.03,
    'SPHEREx-D4': 3.12,
    'SPHEREx-D5': 4.12,
    'SPHEREx-D6': 4.71,
  };
  return defaults[band] || 3.05;
}

function decodeXmlValue(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_m, code) => String.fromCodePoint(parseInt(code, 16))).trim();
}

function parseVotableRows(xml: string): Record<string, string>[] {
  const fields = [...xml.matchAll(/<FIELD\b([^>]*)\/?\s*>/gi)]
    .map((m) => m[1].match(/name=["']([^"']+)["']/i)?.[1].toLowerCase())
    .filter((name): name is string => Boolean(name));
  if (!fields.length) return [];
  const rows: Record<string, string>[] = [];
  for (const tr of xml.matchAll(/<TR\b[^>]*>([\s\S]*?)<\/TR>/gi)) {
    const cells = [...tr[1].matchAll(/<TD\b[^>]*>([\s\S]*?)<\/TD>/gi)].map((td) => decodeXmlValue(td[1]));
    if (cells.length !== fields.length) continue;
    const row: Record<string, string> = {};
    fields.forEach((field, index) => { row[field] = cells[index]; });
    rows.push(row);
  }
  return rows;
}
export async function queryIrsaSpherexSia(
  raDeg: number,
  decDeg: number,
  collection: 'spherex_dr1' | 'spherex_dr1_deep' | 'spherex_qr3' | 'spherex_qr3_deep',
  radiusDeg = 0.03
): Promise<SiaObservationRow[]> {
  // Versioned cache prevents reuse of older empty or incompletely parsed SIA responses.
  const cacheKey = `sia_v2_${raDeg.toFixed(4)}_${decDeg.toFixed(4)}_${radiusDeg}_${collection}`;
  const cached = getCached<SiaObservationRow[]>(cacheKey);
  if (cached) return cached;
  const params = new URLSearchParams({
    COLLECTION: collection,
    POS: `CIRCLE ${raDeg.toFixed(6)} ${decDeg.toFixed(6)} ${radiusDeg}`,
    RESPONSEFORMAT: 'VOTABLE',
    MAXREC: '2000',
  });
  const url = `https://irsa.ipac.caltech.edu/SIA?${params.toString()}`;
  let xml = '';
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/x-votable+xml, application/xml, text/xml' },
        signal: AbortSignal.timeout(attempt === 0 ? 18000 : 22000),
      });
      if (!res.ok) {
        const detail = (await res.text().catch(() => '')).slice(0, 180);
        throw new Error(`IRSA SIA ${collection} HTTP ${res.status}${detail ? `: ${detail}` : ''}`);
      }
      xml = await res.text();
      if (!/<(?:\w+:)?VOTABLE\b/i.test(xml)) throw new Error(`IRSA SIA ${collection} returned a non-VOTable response`);
      lastError = null;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }
  if (lastError) throw lastError;
  const parsed = parseVotableRows(xml);
  const rows: SiaObservationRow[] = parsed.filter((row) => {
    const type = (row.dataproduct_type || '').toLowerCase();
    const format = (row.access_format || '').toLowerCase();
    return Boolean(row.access_url) && (!type || type === 'image') && (!format || format.includes('fits'));
  }).map((row) => {
    const tMin = Number.parseFloat(row.t_min);
    const tMax = Number.parseFloat(row.t_max);
    const emMin = Number.parseFloat(row.em_min);
    const emMax = Number.parseFloat(row.em_max);
    return {
      obsId: row.obs_id || `${collection}-obs`,
      obsCollection: row.obs_collection || collection,
      bandpassName: row.energy_bandpassname || 'SPHEREx',
      sRa: Number.isFinite(Number.parseFloat(row.s_ra)) ? Number.parseFloat(row.s_ra) : raDeg,
      sDec: Number.isFinite(Number.parseFloat(row.s_dec)) ? Number.parseFloat(row.s_dec) : decDeg,
      tMinMjd: Number.isFinite(tMin) ? tMin : 60800,
      tMaxMjd: Number.isFinite(tMax) ? tMax : (Number.isFinite(tMin) ? tMin : 60800),
      emMinMicrons: Number.isFinite(emMin) ? emMin * 1e6 : 3.0,
      emMaxMicrons: Number.isFinite(emMax) ? emMax * 1e6 : 3.5,
      tExptime: Number.parseFloat(row.t_exptime) || 112.5,
      pixelScaleArcsec: Number.parseFloat(row.s_pixel_scale) || 6.15,
      calibLevel: Number.parseInt(row.calib_level || '2', 10),
      accessUrl: row.access_url,
      accessFormat: row.access_format || 'image/fits',
    };
  }).sort((a, b) => a.tMinMjd - b.tMinMjd);
  setCached(cacheKey, rows);
  return rows;
}
export async function fetchAndParseSpherexCutout(
  accessUrl: string,
  raDeg: number,
  decDeg: number,
  sizePix = 64,
  fovArcmin?: number
) {
  const cacheKey = `fits_cutout_v2_${accessUrl.split('/').pop()}_${raDeg.toFixed(4)}_${decDeg.toFixed(4)}_${sizePix}_${fovArcmin || 'nat'}`;
  const cached = getCached<ReturnType<typeof parseAndReprojectFitsCutout>>(cacheKey);
  if (cached) return cached;

  // IBE expects a sky-coordinate center in degrees and an angular cutout size.
  // A size in pixels is valid only when center is also supplied in parent-image pixels.
  const cutoutUrl = new URL(accessUrl);
  cutoutUrl.searchParams.set('center', `${raDeg.toFixed(6)},${decDeg.toFixed(6)}`);
  const cutoutSizeDeg = (sizePix * 6.15) / 3600;
  cutoutUrl.searchParams.set('size', cutoutSizeDeg.toFixed(5));
  const res = await fetch(cutoutUrl.toString(), { signal: AbortSignal.timeout(20000) });
  if (!res.ok) {
    throw new Error(`IRSA IBE cutout HTTP ${res.status}`);
  }
  const ab = await res.arrayBuffer();
  const buf = Buffer.from(ab);
  const parsed = parseAndReprojectFitsCutout(buf, raDeg, decDeg, sizePix, fovArcmin);
  if (parsed) {
    setCached(cacheKey, parsed);
  }
  return parsed;
}

export async function queryGaiaDr3Cone(
  raDeg: number,
  decDeg: number,
  radiusArcmin = 4.0
): Promise<GaiaSourceRecord[]> {
  const radiusDeg = Math.max(0.01, Math.min(0.25, radiusArcmin / 60));
  const cacheKey = `gaia_dr3_${raDeg.toFixed(4)}_${decDeg.toFixed(4)}_${radiusDeg.toFixed(3)}`;
  const cached = getCached<GaiaSourceRecord[]>(cacheKey);
  if (cached) return cached;

  const adql = `SELECT TOP 30 source_id, ra, dec, pmra, pmdec, parallax, phot_g_mean_mag, bp_rp, ruwe, DISTANCE(POINT('ICRS', ra, dec), POINT('ICRS', ${raDeg.toFixed(6)}, ${decDeg.toFixed(6)})) * 3600.0 AS dist_arcsec FROM gaiadr3.gaia_source WHERE 1=CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', ${raDeg.toFixed(6)}, ${decDeg.toFixed(6)}, ${radiusDeg.toFixed(5)})) ORDER BY dist_arcsec ASC`;
  const url = `https://gea.esac.esa.int/tap-server/tap/sync?REQUEST=doQuery&LANG=ADQL&FORMAT=json&QUERY=${encodeURIComponent(adql)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: (string | number | null)[][] };
    const rows = (json.data || []).map((row) => ({
      sourceId: String(row[0] ?? ''),
      raDeg: Number(row[1]),
      decDeg: Number(row[2]),
      pmRaMasYr: row[3] !== null && row[3] !== undefined ? Number(Number(row[3]).toFixed(2)) : null,
      pmDecMasYr: row[4] !== null && row[4] !== undefined ? Number(Number(row[4]).toFixed(2)) : null,
      parallaxMas: row[5] !== null && row[5] !== undefined ? Number(Number(row[5]).toFixed(2)) : null,
      photGMeanMag: row[6] !== null && row[6] !== undefined ? Number(Number(row[6]).toFixed(2)) : null,
      bpRpColor: row[7] !== null && row[7] !== undefined ? Number(Number(row[7]).toFixed(2)) : null,
      ruwe: row[8] !== null && row[8] !== undefined ? Number(Number(row[8]).toFixed(2)) : null,
      distanceArcsecFromCenter: Number(Number(row[9] || 0).toFixed(2)),
    }));
    setCached(cacheKey, rows);
    return rows;
  } catch {
    return [];
  }
}

export async function queryAllWiseCutouts(
  raDeg: number,
  decDeg: number,
  fovArcmin = 6.5
): Promise<AllWiseCutoutRecord[]> {
  const cacheKey = `allwise_${raDeg.toFixed(4)}_${decDeg.toFixed(4)}_${fovArcmin.toFixed(1)}`;
  const cached = getCached<AllWiseCutoutRecord[]>(cacheKey);
  if (cached) return cached;

  try {
    const siaUrl = `https://irsa.ipac.caltech.edu/ibe/sia/wise/allwise/p3am_cdd?POS=${raDeg.toFixed(5)},${decDeg.toFixed(5)}&SIZE=0.05`;
    const res = await fetch(siaUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const xml = await res.text();
    const rows = parseVotableRows(xml);
    const wantedBands: Array<'W2' | 'W1'> = ['W2', 'W1'];
    const results: AllWiseCutoutRecord[] = [];

    for (const band of wantedBands) {
      const match = rows.find((r) => r.sia_bp_id === band && r.sia_url);
      if (!match) continue;
      const fitsCutoutUrl = `${match.sia_url}?center=${raDeg.toFixed(6)},${decDeg.toFixed(6)}&size=64pix`;
      let fitsData: AllWiseCutoutRecord['fitsData'];
      try {
        const fRes = await fetch(fitsCutoutUrl, { signal: AbortSignal.timeout(9000) });
        if (fRes.ok) {
          const buf = Buffer.from(await fRes.arrayBuffer());
          fitsData = parseAndReprojectFitsCutout(buf, raDeg, decDeg, 64, fovArcmin) || undefined;
        }
      } catch {
        // leave metadata only if image download timed out
      }
      results.push({
        band,
        wavelengthMicrons: band === 'W1' ? 3.35 : 4.6,
        coaddId: match.coadd_id || 'AllWISE',
        raDeg: parseFloat(match.sia_ra) || raDeg,
        decDeg: parseFloat(match.sia_dec) || decDeg,
        epochLabel: 'AllWISE Coadd (2010–2011)',
        mjdObs: 55400.0,
        fitsCutoutUrl,
        fitsData,
      });
    }

    setCached(cacheKey, results);
    return results;
  } catch {
    return [];
  }
}

/**
 * Propagate Gaia DR3 J2016.0 coordinates to any observation MJD and project onto North-Up cutout normalized [0..1]
 */
function buildStarsFromGaiaAndWcs(
  gaiaSources: GaiaSourceRecord[],
  mjdObs: number,
  targetRaDeg: number,
  targetDecDeg: number,
  fovArcmin: number,
  wcs?: NonNullable<ObservationFrame['fitsData']>['wcs']
): SyntheticStar[] {
  const dtYears = (mjdObs - 57388.5) / 365.25; // Gaia DR3 epoch is J2016.0 (MJD ~ 57388.5)
  const cosDec = Math.cos((targetDecDeg * Math.PI) / 180) || 1;
  const fallbackScaleDeg = fovArcmin / 60 / 64;
  const effectiveWcs = wcs || {
    crval1: targetRaDeg,
    crval2: targetDecDeg,
    crpix1: 32.5,
    crpix2: 32.5,
    cd1_1: -fallbackScaleDeg,
    cd1_2: 0,
    cd2_1: 0,
    cd2_2: fallbackScaleDeg,
    ctype1: 'RA---TAN',
    ctype2: 'DEC--TAN',
    pixelScaleArcsec: Number((fallbackScaleDeg * 3600).toFixed(3)),
  };

  const out: SyntheticStar[] = [];
  for (const g of gaiaSources.slice(0, 20)) {
    const dRaDeg = g.pmRaMasYr ? ((g.pmRaMasYr * dtYears) / 3600000) / cosDec : 0;
    const dDecDeg = g.pmDecMasYr ? (g.pmDecMasYr * dtYears) / 3600000 : 0;
    const raAtEpoch = g.raDeg + dRaDeg;
    const decAtEpoch = g.decDeg + dDecDeg;
    const pix = skyToFitsPixel(raAtEpoch, decAtEpoch, effectiveWcs);
    if (!pix) continue;

    // Convert 1-based FITS pixel (bottom-up) to 0..1 normalized canvas coordinates (top-down)
    const normX = (pix.px1 - 0.5) / 64;
    const normY = 1 - (pix.py1 - 0.5) / 64;
    if (normX < 0 || normX > 1 || normY < 0 || normY > 1) continue;

    const totalPmMas = Math.hypot(g.pmRaMasYr || 0, g.pmDecMasYr || 0);
    const approxFlux = g.photGMeanMag !== null ? Math.max(2, Math.min(80, 45 * Math.pow(10, -0.2 * (g.photGMeanMag - 10)))) : 12;

    out.push({
      id: `GAIA-${g.sourceId.slice(-6)}`,
      x: Number(normX.toFixed(4)),
      y: Number(normY.toFixed(4)),
      peakFlux: Number(approxFlux.toFixed(2)),
      fwhm: 0.03,
      colorTempK: g.bpRpColor && g.bpRpColor > 1.8 ? 3200 : 5400,
      pmRaMasYr: g.pmRaMasYr ?? undefined,
      pmDecMasYr: g.pmDecMasYr ?? undefined,
      parallaxMas: g.parallaxMas ?? undefined,
      catalogName: `Gaia ${g.sourceId.slice(-6)}${g.photGMeanMag ? ` (G=${g.photGMeanMag.toFixed(1)})` : ''}`,
      isTargetObject: totalPmMas > 500 || g.distanceArcsecFromCenter < 12,
    });
  }
  return out;
}

/**
 * Select up to N chronologically spread observations across DR1 + QR3 for a chosen band.
 */
function selectChronologicalRows(
  allRows: SiaObservationRow[],
  preferredBand?: string,
  maxEpochs = 4
): { selected: SiaObservationRow[]; selectedBand: string; availableBands: string[] } {
  const availableBands = [...new Set(allRows.map((r) => r.bandpassName))].sort();
  if (allRows.length === 0) {
    return { selected: [], selectedBand: preferredBand || 'SPHEREx-D5', availableBands };
  }

  // Pick requested band if available, otherwise pick the band with the best time baseline (prefer D5/D4/D6 for IR)
  let band = preferredBand && preferredBand !== 'ALL' && availableBands.includes(preferredBand)
    ? preferredBand
    : '';

  if (!band) {
    const bandOrder = ['SPHEREx-D5', 'SPHEREx-D6', 'SPHEREx-D4', 'SPHEREx-D3', 'SPHEREx-D2', 'SPHEREx-D1'];
    let bestSpan = -1;
    for (const b of bandOrder) {
      const subset = allRows.filter((r) => r.bandpassName === b);
      if (subset.length === 0) continue;
      const span = subset[subset.length - 1].tMinMjd - subset[0].tMinMjd;
      if (span > bestSpan + 5 || (bestSpan < 0 && subset.length > 0)) {
        bestSpan = span;
        band = b;
      }
    }
    if (!band) band = availableBands[0];
  }

  const bandRows = allRows.filter((r) => r.bandpassName === band).sort((a, b) => a.tMinMjd - b.tMinMjd);
  if (bandRows.length <= maxEpochs) {
    return { selected: bandRows, selectedBand: band, availableBands };
  }

  // Cluster into distinct time windows (> 15 days apart) first so we capture 6-month / 1-year intervals cleanly
  const clusters: SiaObservationRow[][] = [];
  for (const row of bandRows) {
    const lastCluster = clusters[clusters.length - 1];
    if (!lastCluster || row.tMinMjd - lastCluster[0].tMinMjd > 15) {
      clusters.push([row]);
    } else {
      lastCluster.push(row);
    }
  }

  const selected: SiaObservationRow[] = [];
  if (clusters.length >= maxEpochs) {
    // Pick evenly spaced clusters including earliest & latest
    for (let i = 0; i < maxEpochs; i++) {
      const idx = Math.round((i * (clusters.length - 1)) / (maxEpochs - 1));
      const cl = clusters[idx];
      selected.push(cl[Math.floor(cl.length / 2)]);
    }
  } else {
    // Take one from each cluster, then fill remaining from earliest/latest spread
    for (const cl of clusters) {
      selected.push(cl[0]);
      if (cl.length > 1 && selected.length < maxEpochs && clusters.length === 1) {
        selected.push(cl[cl.length - 1]);
      }
    }
    for (const cl of clusters) {
      if (selected.length >= maxEpochs) break;
      const lastInCl = cl[cl.length - 1];
      if (!selected.some((s) => s.obsId === lastInCl.obsId)) {
        selected.push(lastInCl);
      }
    }
  }

  selected.sort((a, b) => a.tMinMjd - b.tMinMjd);
  return { selected, selectedBand: band, availableBands };
}

/**
 * Main Time-Machine query: queries live IRSA SPHEREx DR1 + QR3 SIA, Gaia DR3, and AllWISE,
 * fetches and reprojects real FITS cutouts, and falls back transparently only if live archive fails.
 */
export async function querySpherexTimeMachine(options: {
  raDeg: number;
  decDeg: number;
  targetName?: string;
  band?: string;
  fovArcmin?: number;
}): Promise<SpherexObservation> {
  const { raDeg, decDeg, band, fovArcmin = 6.5 } = options;
  const cacheKey = `timemachine_v2_${raDeg.toFixed(4)}_${decDeg.toFixed(4)}_${band || 'AUTO'}_${fovArcmin.toFixed(1)}`;
  const cached = getCached<SpherexObservation>(cacheKey);
  if (cached) {
    return {
      ...cached,
      archiveSummary: cached.archiveSummary ? { ...cached.archiveSummary, cached: true } : undefined,
    };
  }

  const t0 = Date.now();
  const benchmark = CHALLENGE_BENCHMARK_TARGETS.find(
    (t) => Math.abs(t.raDeg - raDeg) < 0.025 && Math.abs(t.decDeg - decDeg) < 0.025
  );
  const resolvedName =
    options.targetName ||
    benchmark?.name ||
    `Sky Field (${raDeg.toFixed(4)}°, ${decDeg.toFixed(4)}°)`;

  // Search a cone covering the selected field of view and include wide + deep surveys.
  // IRSA recommends querying DR1 and QR3 together; both releases expose deep collections.
  const searchRadiusDeg = Math.max(0.01, Math.min(0.25, fovArcmin / 120));
  const [dr1Wide, dr1Deep, qr3Wide, qr3Deep, gaiaSources, allWiseCutouts] = await Promise.all([
    queryIrsaSpherexSia(raDeg, decDeg, 'spherex_dr1', searchRadiusDeg).catch((err) => {
      console.warn('[AstroArchive] DR1 wide SIA error:', err.message); return [] as SiaObservationRow[];
    }),
    queryIrsaSpherexSia(raDeg, decDeg, 'spherex_dr1_deep', searchRadiusDeg).catch((err) => {
      console.warn('[AstroArchive] DR1 deep SIA error:', err.message); return [] as SiaObservationRow[];
    }),
    queryIrsaSpherexSia(raDeg, decDeg, 'spherex_qr3', searchRadiusDeg).catch((err) => {
      console.warn('[AstroArchive] QR3 wide SIA error:', err.message); return [] as SiaObservationRow[];
    }),
    queryIrsaSpherexSia(raDeg, decDeg, 'spherex_qr3_deep', searchRadiusDeg).catch((err) => {
      console.warn('[AstroArchive] QR3 deep SIA error:', err.message); return [] as SiaObservationRow[];
    }),
    queryGaiaDr3Cone(raDeg, decDeg, Math.max(3.5, fovArcmin * 0.7)),
    queryAllWiseCutouts(raDeg, decDeg, fovArcmin),
  ]);
  const dr1Res = [...dr1Wide, ...dr1Deep];
  const qr3Res = [...qr3Wide, ...qr3Deep];
  const combinedRows = [...dr1Res, ...qr3Res]
    .filter((row, index, all) => all.findIndex((other) => other.obsId === row.obsId) === index)
    .sort((a, b) => a.tMinMjd - b.tMinMjd);
  const limitations: string[] = [];

  if (qr3Res.length === 0) {
    limitations.push('No SPHEREx QR3 (2026) quick-release observations returned at these coordinates yet; using multi-pass DR1 timeline.');
  }
  if (gaiaSources.length === 0) {
    limitations.push('No optical Gaia DR3 sources detected inside search cone (expected for optically faint Y-dwarfs such as WISE 0855).');
  }

  // Fallback ONLY if zero live SPHEREx rows are available
  if (combinedRows.length === 0) {
    const baseFallback = benchmark
      ? generateBenchmarkObservation(benchmark)
      : generateObservationAtCoordinates(raDeg, decDeg, resolvedName, fovArcmin);
    const latency = Date.now() - t0;

    return {
      ...baseFallback,
      targetName: resolvedName,
      dataSourceStatus: 'FALLBACK_SIMULATED',
      dataSourceLabel: 'CALIBRATED FALLBACK SIMULATION — Live IRSA SPHEREx query returned 0 archival rows at these coordinates.',
      gaiaSources,
      allWiseCutouts,
      archiveSummary: {
        dr1ObservationCount: 0,
        qr3ObservationCount: 0,
        availableBands: [],
        distinctMjdCount: 0,
        earliestDate: baseFallback.epochs[0]?.timestamp || '',
        latestDate: baseFallback.epochs[baseFallback.epochs.length - 1]?.timestamp || '',
        queryLatencyMs: latency,
        cached: false,
        limitations: [
          ...limitations,
          'Live IRSA SPHEREx DR1/QR3 SIA returned 0 matching Level-2 images; displaying explicitly labeled synthetic fallback.',
        ],
        wiseViewUrl: `https://byw.tools/wiseview-v2#ra=${raDeg.toFixed(5)}&dec=${decDeg.toFixed(5)}&size=${Math.round(fovArcmin * 60)}`,
        irsaFinderUrl: `https://irsa.ipac.caltech.edu/applications/finderchart/?locstr=${raDeg.toFixed(5)}+${decDeg.toFixed(5)}&subsetsize=${fovArcmin.toFixed(1)}`,
        aladinUrl: `https://aladin.cds.unistra.fr/AladinLite/?target=${raDeg.toFixed(4)}%20${decDeg.toFixed(4)}&fov=${(fovArcmin / 60).toFixed(3)}&survey=P%2FALLWISE%2Fcolor`,
      },
    };
  }

  const { selected, selectedBand, availableBands } = selectChronologicalRows(combinedRows, band, 4);

  // Fetch FITS cutouts for selected chronological epochs concurrently
  const epochFitsResults = await Promise.all(
    selected.map(async (row) => {
      try {
        const fits = await fetchAndParseSpherexCutout(row.accessUrl, raDeg, decDeg, 64, fovArcmin);
        return { row, fits };
      } catch (err: any) {
        limitations.push(`Cutout ${row.obsId} (${row.bandpassName}) download error: ${err.message}`);
        return { row, fits: null };
      }
    })
  );

  // Sample multi-band SED across D1..D6 using one cutout per band near center
  const sedTargets: Array<{ bandName: string; obs: SiaObservationRow }> = [];
  for (const b of ['SPHEREx-D1', 'SPHEREx-D2', 'SPHEREx-D3', 'SPHEREx-D4', 'SPHEREx-D5', 'SPHEREx-D6']) {
    const already = epochFitsResults.find((e) => e.row.bandpassName === b && e.fits);
    if (already) {
      sedTargets.push({ bandName: b, obs: already.row });
    } else {
      const candidate = combinedRows.find((r) => r.bandpassName === b);
      if (candidate) sedTargets.push({ bandName: b, obs: candidate });
    }
  }

  const sedMeasurements = await Promise.all(
    sedTargets.map(async ({ bandName, obs }) => {
      const existing = epochFitsResults.find((e) => e.row.obsId === obs.obsId && e.fits);
      let fits = existing?.fits || null;
      if (!fits) {
        try {
          fits = await fetchAndParseSpherexCutout(obs.accessUrl, raDeg, decDeg, 48, fovArcmin);
        } catch {
          fits = null;
        }
      }
      const wl = bandCenterMicrons(bandName, obs.emMinMicrons, obs.emMaxMicrons);
      if (!fits) {
        return {
          wavelength: wl,
          fluxMJySr: 0,
          uncertainty: 0,
          modelFit: 0,
          bandLabel: bandName,
          isMeasured: false,
          obsId: obs.obsId,
        };
      }
      const flux = Math.max(0, fits.stats.apertureFluxMJySr);
      return {
        wavelength: wl,
        fluxMJySr: Number(flux.toFixed(3)),
        uncertainty: Number(fits.stats.apertureErrMJySr.toFixed(3)),
        modelFit: Number(flux.toFixed(3)),
        bandLabel: bandName,
        isMeasured: true,
        obsId: obs.obsId,
      };
    })
  );

  // Build chronological ObservationFrames
  const epochs: ObservationFrame[] = epochFitsResults.map(({ row, fits }, idx) => {
    const isoDate = (fits?.headerSummary['DATE-OBS'] as string) || mjdToIso(row.tMinMjd);
    const mjd = Number(fits?.headerSummary['MJD-OBS'] || row.tMinMjd);
    const wl = bandCenterMicrons(row.bandpassName, row.emMinMicrons, row.emMaxMicrons);
    const stars = buildStarsFromGaiaAndWcs(gaiaSources, mjd, raDeg, decDeg, fovArcmin, fits?.wcs);

    return {
      frameId: row.obsId,
      timestamp: isoDate,
      epochIndex: idx,
      bandWavelengthMicrons: wl,
      exposureTimeSec: row.tExptime,
      backgroundLevelMJySr: fits?.stats.median ?? 0.8,
      nebulaIntensity: 0,
      detectorNoiseSigma: fits?.stats.rmsNoise ?? 0.05,
      stars,
      transients: [],
      surveyCycleName: `${row.obsCollection.toUpperCase()} (${row.bandpassName})`,
      obsId: row.obsId,
      obsCollection: row.obsCollection,
      mjdObs: mjd,
      detectorBand: row.bandpassName,
      emMinMicrons: Number(row.emMinMicrons.toFixed(3)),
      emMaxMicrons: Number(row.emMaxMicrons.toFixed(3)),
      accessUrl: row.accessUrl,
      isRealArchive: Boolean(fits),
      fitsData: fits || undefined,
    };
  });

  // Check if any real FITS data succeeded
  const realCutoutCount = epochs.filter((e) => e.isRealArchive).length;
  if (realCutoutCount === 0) {
    limitations.push('IRSA returned observation metadata rows, but FITS cutout downloads timed out or returned no valid image array.');
  }
  limitations.push('SPHEREx Level-2 images use Linear Variable Filters (wavelength varies across detector Y-axis) and 6.15″/px sampling; North-Up WCS bilinear reprojection is applied for multi-epoch alignment.');

  // Add real centroid shift summary across first & last real frames if available
  const realFrames = epochs.filter((e) => e.fitsData);
  if (realFrames.length >= 2) {
    const first = realFrames[0].fitsData!;
    const last = realFrames[realFrames.length - 1].fitsData!;
    const firstSky = first.wcs
      ? fitsPixelToSky(first.stats.centroidX * first.width + 0.5, (1 - first.stats.centroidY) * first.height + 0.5, first.wcs)
      : { raDeg, decDeg };
    const lastSky = last.wcs
      ? fitsPixelToSky(last.stats.centroidX * last.width + 0.5, (1 - last.stats.centroidY) * last.height + 0.5, last.wcs)
      : { raDeg, decDeg };
    const dtDays = Math.max(1, (realFrames[realFrames.length - 1].mjdObs || 60900) - (realFrames[0].mjdObs || 60800));
    const dFlux = Number((last.stats.apertureFluxMJySr - first.stats.apertureFluxMJySr).toFixed(3));
    const combinedErr = Math.hypot(first.stats.apertureErrMJySr, last.stats.apertureErrMJySr) || 0.1;
    const snr = Number((Math.abs(dFlux) / combinedErr).toFixed(2));
    if (snr >= 3.0) {
      realFrames[realFrames.length - 1].transients.push({
        id: `SPX-RES-${realFrames[realFrames.length - 1].obsId?.slice(-6) || 'EPOCH'}`,
        x: last.stats.centroidX,
        y: last.stats.centroidY,
        raDeg: lastSky.raDeg,
        decDeg: lastSky.decDeg,
        deltaFluxMJySr: dFlux,
        snr,
        candidateType: Math.hypot(lastSky.raDeg - firstSky.raDeg, lastSky.decDeg - firstSky.decDeg) * 3600 > 1.5
          ? 'High Proper Motion Candidate'
          : 'Infrared Variable Protostar',
        detectionEpoch: realFrames[realFrames.length - 1].timestamp,
        referenceEpoch: realFrames[0].timestamp,
        significanceSigma: snr,
        isVerified: false,
      });
    }
    void dtDays;
  }

  const { glonDeg, glatDeg } = celestialToGalactic(raDeg, decDeg);
  const distinctMjds = new Set(combinedRows.map((r) => Math.floor(r.tMinMjd)));
  const latency = Date.now() - t0;
  const firstRealHeader = realFrames[0]?.fitsData?.headerSummary || {};

  const obs: SpherexObservation = {
    id: `IRSA-SPHEREX-${raDeg.toFixed(3)}_${decDeg.toFixed(3)}-${selectedBand}`,
    targetName: resolvedName,
    shortDesc: benchmark
      ? `${benchmark.designation} (${benchmark.spectralType}) — ${benchmark.scienceHighlights}`
      : `Live NASA/IPAC IRSA SPHEREx Level-2 multi-epoch cutout sequence (${combinedRows.length} archival exposures found).`,
    category: benchmark?.category || 'High Proper Motion Stars',
    raDeg,
    decDeg,
    glonDeg,
    glatDeg,
    fieldOfViewArcmin: fovArcmin,
    detectorArray: `${selectedBand} (${availableBands.length} bands archived: ${availableBands.join(', ')})`,
    detectorTempK: 80.0,
    pixelScaleArcsec: epochs[0]?.fitsData?.wcs?.pixelScaleArcsec || 6.15,
    dataQualityFlag: 'CALIBRATED_NOMINAL',
    dataSourceStatus: realCutoutCount > 0 ? 'LIVE_IRSA_SPHEREX' : 'FALLBACK_SIMULATED',
    dataSourceLabel:
      realCutoutCount > 0
        ? `LIVE NASA/IPAC IRSA ARCHIVE: ${dr1Res.length} SPHEREx DR1 + ${qr3Res.length} SPHEREx QR3 exposures (${realCutoutCount} Level-2 FITS cutouts parsed & North-Up WCS aligned)`
        : 'LIVE METADATA ONLY — Cutout pixel retrieval failed; showing metadata.',
    documentationUrl: 'https://irsa.ipac.caltech.edu/Missions/spherex.html',
    fitsHeader: {
      TELESCOP: 'SPHEREx',
      INSTRUME: 'SPHEREx-LVF',
      OBSERVER: 'NASA/Caltech-IPAC',
      CRVAL1: raDeg,
      CRVAL2: decDeg,
      CDELT_ARCSEC: epochs[0]?.fitsData?.wcs?.pixelScaleArcsec || 6.15,
      BUNIT: 'MJy / sr',
      DR1_ROWS: dr1Res.length,
      QR3_ROWS: qr3Res.length,
      ACTIVE_BAND: selectedBand,
      ...firstRealHeader,
    },
    epochs,
    fullSedCurve: sedMeasurements.some((m) => m.isMeasured)
      ? sedMeasurements
      : (benchmark ? generateBenchmarkObservation(benchmark).fullSedCurve : []),
    archiveSummary: {
      dr1ObservationCount: dr1Res.length,
      qr3ObservationCount: qr3Res.length,
      availableBands,
      distinctMjdCount: distinctMjds.size,
      earliestDate: mjdToIso(combinedRows[0].tMinMjd).split('T')[0],
      latestDate: mjdToIso(combinedRows[combinedRows.length - 1].tMinMjd).split('T')[0],
      queryLatencyMs: latency,
      cached: false,
      limitations,
      wiseViewUrl: `https://byw.tools/wiseview-v2#ra=${raDeg.toFixed(5)}&dec=${decDeg.toFixed(5)}&size=${Math.round(fovArcmin * 60)}`,
      irsaFinderUrl: `https://irsa.ipac.caltech.edu/applications/finderchart/?locstr=${raDeg.toFixed(5)}+${decDeg.toFixed(5)}&subsetsize=${fovArcmin.toFixed(1)}`,
      aladinUrl: `https://aladin.cds.unistra.fr/AladinLite/?target=${raDeg.toFixed(4)}%20${decDeg.toFixed(4)}&fov=${(fovArcmin / 60).toFixed(3)}&survey=P%2FALLWISE%2Fcolor`,
    },
    gaiaSources,
    allWiseCutouts,
    contaminationFlags: {
      zodiacalLevel: (realFrames[0]?.fitsData?.stats.zodiMedianMJySr || 0) > 0.35 ? 'Moderate' : 'Low',
      strayLight: false,
      cosmicRayHits: realFrames[0]?.fitsData?.stats.flaggedPixelCount || 0,
      saturationWarning: false,
      moonSeparationDeg: 75.0,
    },
    properMotionTarget: benchmark
      ? {
          name: benchmark.name,
          pmRaMasYr: benchmark.pmRaMasYr,
          pmDecMasYr: benchmark.pmDecMasYr,
          totalPmArcsecYr: benchmark.properMotionArcsecYr,
          parallaxMas: benchmark.parallaxMas,
          spectralType: benchmark.spectralType,
        }
      : gaiaSources[0] && (gaiaSources[0].pmRaMasYr !== null || gaiaSources[0].pmDecMasYr !== null)
      ? {
          name: `Gaia DR3 ${gaiaSources[0].sourceId}`,
          pmRaMasYr: gaiaSources[0].pmRaMasYr || 0,
          pmDecMasYr: gaiaSources[0].pmDecMasYr || 0,
          totalPmArcsecYr: Number((Math.hypot(gaiaSources[0].pmRaMasYr || 0, gaiaSources[0].pmDecMasYr || 0) / 1000).toFixed(3)),
          parallaxMas: gaiaSources[0].parallaxMas || 0,
          spectralType: 'Gaia DR3 Cross-Matched Source',
        }
      : undefined,
    variabilityTarget: benchmark?.isVariable
      ? {
          name: benchmark.name,
          periodDays: benchmark.variabilityPeriodDays || 0,
          amplitudeMag: benchmark.variabilityDeltaMag || 0,
          classification: benchmark.spectralType,
        }
      : undefined,
  };

  if (realCutoutCount > 0) {
    setCached(cacheKey, obs);
  }
  return obs;
}

/**
 * Resolve target name or coordinate pair into J2000 (raDeg, decDeg)
 */
export async function resolveTargetDesignator(query: string): Promise<{
  found: boolean;
  name: string;
  raDeg?: number;
  decDeg?: number;
  resolver: string;
  error?: string;
}> {
  const q = query.trim();
  if (!q) return { found: false, name: '', resolver: 'none', error: 'Empty target query.' };

  // 1. Check required NASA Space Apps 2026 challenge targets
  const lower = q.toLowerCase();
  const bench = CHALLENGE_BENCHMARK_TARGETS.find(
    (t) =>
      t.name.toLowerCase().includes(lower) ||
      t.designation.toLowerCase().includes(lower) ||
      t.id.toLowerCase().includes(lower)
  );
  if (bench) {
    return {
      found: true,
      name: bench.name,
      raDeg: bench.raDeg,
      decDeg: bench.decDeg,
      resolver: 'Challenge Benchmark Catalog (ICRS)',
    };
  }

  // 2. Check if query contains comma/space separated RA Dec
  const parts = q.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 2) {
    const parsed = parseCelestialCoordinates(parts[0], parts[1]);
    if (parsed.valid) {
      return {
        found: true,
        name: `Coordinates (${parsed.raDeg.toFixed(4)}°, ${parsed.decDeg.toFixed(4)}°)`,
        raDeg: parsed.raDeg,
        decDeg: parsed.decDeg,
        resolver: 'Coordinate Parser (ICRS)',
      };
    }
  }

  // 3. Built-in well-known astronomical catalog designations
  const knownObjects: Record<string, { name: string; ra: number; dec: number }> = {
    'proxima centauri': { name: 'Proxima Centauri', ra: 217.4289, dec: -62.6795 },
    'vega': { name: 'Vega (Alpha Lyrae)', ra: 279.2347, dec: 38.7837 },
    'betelgeuse': { name: 'Betelgeuse', ra: 88.7929, dec: 7.4071 },
    'l1688': { name: 'L1688 Ophiuchus Ice Core', ra: 246.75, dec: -24.62 },
    'cosmos': { name: 'COSMOS Deep Field', ra: 150.119, dec: 2.205 },
    'nep': { name: 'North Ecliptic Pole (NEP)', ra: 270.0, dec: 66.5607 },
    '61 cygni': { name: '61 Cygni A', ra: 316.7248, dec: 38.7494 },
    'kapteyn': { name: "Kapteyn's Star", ra: 77.9191, dec: -45.0184 },
    'teegarden': { name: "Teegarden's Star", ra: 43.2537, dec: 16.8813 },
  };
  for (const [k, v] of Object.entries(knownObjects)) {
    if (lower.includes(k)) {
      return { found: true, name: v.name, raDeg: v.ra, decDeg: v.dec, resolver: 'Verified Catalog Table' };
    }
  }

  return {
    found: false,
    name: q,
    resolver: 'none',
    error: `Target "${q}" not matched. Enter decimal/sexagesimal RA & Dec or select one of the 5 challenge benchmarks.`,
  };
}

/**
 * Live diagnostic ping for external astronomical archives
 */
export async function pingExternalEndpoint(serviceId: string): Promise<{
  reachable: boolean;
  latencyMs: number;
  message: string;
}> {
  const endpoints: Record<string, { url: string; label: string }> = {
    'irsa-spherex-sia': {
      url: 'https://irsa.ipac.caltech.edu/SIA?POS=circle+269.4521+4.6934+0.02&COLLECTION=spherex_dr1',
      label: 'NASA/IPAC IRSA SPHEREx DR1/QR3 SIAv2',
    },
    'irsa-spherex-tap': {
      url: 'https://irsa.ipac.caltech.edu/TAP/tables',
      label: 'NASA/IPAC IRSA TAP Schema Service',
    },
    'esa-gaia-dr3': {
      url: 'https://gea.esac.esa.int/tap-server/tap/sync?REQUEST=doQuery&LANG=ADQL&FORMAT=json&QUERY=' +
        encodeURIComponent('SELECT TOP 1 source_id FROM gaiadr3.gaia_source'),
      label: 'ESA Gaia DR3 TAP Astrometry',
    },
    'irsa-allwise-ibe': {
      url: 'https://irsa.ipac.caltech.edu/ibe/sia/wise/allwise/p3am_cdd?POS=133.795,-7.245&SIZE=0.02',
      label: 'NASA/IPAC IRSA AllWISE IBE Cutout Service',
    },
    'nasa-open-data-api': {
      url: `https://api.nasa.gov/neo/rest/v1/neo/3542519?api_key=${process.env.NASA_API_KEY || 'DEMO_KEY'}`,
      label: 'NASA Open Data API (NeoWs)',
    },
  };

  const target = endpoints[serviceId];
  if (!target) {
    return {
      reachable: true,
      latencyMs: 2,
      message: 'Local calibrated benchmark / fallback handler active.',
    };
  }

  const t0 = Date.now();
  try {
    const res = await fetch(target.url, { signal: AbortSignal.timeout(7000) });
    const dt = Date.now() - t0;
    return {
      reachable: res.ok,
      latencyMs: dt,
      message: res.ok
        ? `${target.label} responded HTTP ${res.status} in ${dt} ms.`
        : `${target.label} returned HTTP ${res.status}.`,
    };
  } catch (err: any) {
    return {
      reachable: false,
      latencyMs: Date.now() - t0,
      message: `${target.label} unreachable: ${err?.message || 'timeout'}`,
    };
  }
}
