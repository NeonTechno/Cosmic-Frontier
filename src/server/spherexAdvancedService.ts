/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Black Star Orbit — reproducible SPHEREx calibration/cube and MPC ingestion.
 * Methods follow the official Caltech/IPAC IRSA notebooks and MPC extended feed.
 */
import { gunzipSync } from 'node:zlib';
import { extractWcsFromHeader, skyToFitsPixel } from './fitsParser.ts';
import { queryIrsaSpherexSia, type SpherexCollectionName, type SiaObservationRow } from './astroArchiveService.ts';
import type { ExtremeTNO } from '../types/index.ts';

type FitsScalar = string | number | boolean;
interface FitsHdu {
  extname: string;
  header: Record<string, FitsScalar>;
  bitpix: number;
  axes: number[];
  dataOffset: number;
  dataBytes: number;
}

const HIPS_ROOT = 'https://irsa.ipac.caltech.edu/data/hips/SPHEREx/spherex_allsky_cube';
const HIPS_DATA_ROOT = process.env.SPHEREX_HIPS_DATA_URL ||
  'https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/hips5_cube/hips_20261026';
const MPC_DISTANT_URL = 'https://minorplanetcenter.net/Extended_Files/distant_extended.json.gz';
const FITS_BLOCK = 2880;
export const SPHEREX_HIPS_TILE_SIZE = 512;
export const SPHEREX_HIPS_CUBE_DEPTH = 102;

export function validateSpherexHipsCubeDimensions(width: number, height: number, depth: number): void {
  if (width !== SPHEREX_HIPS_TILE_SIZE || height !== SPHEREX_HIPS_TILE_SIZE || depth !== SPHEREX_HIPS_CUBE_DEPTH) {
    throw new Error(
      'Unexpected SPHEREx HiPS cube dimensions ' + width + '×' + height + '×' + depth +
      '; expected 512×512×102 per the official IRSA notebook.'
    );
  }
}
const fitsCaches = new Map<string, { expires: number; value: unknown }>();

function cacheGet<T>(key: string): T | null {
  const hit = fitsCaches.get(key);
  return hit && hit.expires > Date.now() ? hit.value as T : null;
}
function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  fitsCaches.set(key, { value, expires: Date.now() + ttlMs });
}
function parseCard(card: string): [string, FitsScalar] | null {
  const key = card.slice(0, 8).trim();
  if (!key || card[8] !== '=' || card[9] !== ' ') return null;
  const raw = card.slice(10);
  const val = raw.trimStart();
  if (val.startsWith("'")) {
    const end = val.indexOf("'", 1);
    return [key, (end >= 0 ? val.slice(1, end) : val.slice(1)).trim()];
  }
  const scalar = (raw.split('/')[0] || '').trim();
  if (scalar === 'T') return [key, true];
  if (scalar === 'F') return [key, false];
  const n = Number(scalar);
  return [key, scalar !== '' && Number.isFinite(n) ? n : scalar];
}
function readHdus(input: Buffer): { buffer: Buffer; hdus: FitsHdu[] } {
  const buffer = input.length > 2 && input[0] === 0x1f && input[1] === 0x8b ? gunzipSync(input) : input;
  const hdus: FitsHdu[] = [];
  let pos = 0;
  while (pos + FITS_BLOCK <= buffer.length && hdus.length < 16) {
    const header: Record<string, FitsScalar> = {};
    let end = false;
    while (pos + FITS_BLOCK <= buffer.length && !end) {
      for (let i = 0; i < 36; i++) {
        const card = buffer.subarray(pos + i * 80, pos + (i + 1) * 80).toString('ascii');
        if (card.startsWith('END     ') || card.trim() === 'END') { end = true; break; }
        const pair = parseCard(card);
        if (pair) header[pair[0]] = pair[1];
      }
      pos += FITS_BLOCK;
    }
    if (!end) break;
    const naxis = Number(header.NAXIS || 0);
    const axes = Array.from({ length: naxis }, (_, i) => Number(header['NAXIS' + (i + 1)] || 0));
    const bitpix = Number(header.BITPIX || 8);
    const pcount = Number(header.PCOUNT || 0);
    const gcount = Number(header.GCOUNT || 1);
    const elements = naxis ? axes.reduce((a, b) => a * b, 1) : 0;
    const dataBytes = (gcount * (pcount + elements)) * Math.abs(bitpix) / 8;
    if (!Number.isFinite(dataBytes) || dataBytes < 0 || pos + dataBytes > buffer.length) break;
    hdus.push({
      extname: String(header.EXTNAME || (hdus.length === 0 ? 'PRIMARY' : 'HDU_' + hdus.length)).trim().toUpperCase(),
      header, bitpix, axes, dataOffset: pos, dataBytes,
    });
    pos += Math.ceil(dataBytes / FITS_BLOCK) * FITS_BLOCK;
  }
  return { buffer, hdus };
}
function numericAccessor(buffer: Buffer, hdu: FitsHdu): (index: number) => number {
  const count = hdu.axes.reduce((a, b) => a * b, 1);
  const dv = new DataView(buffer.buffer, buffer.byteOffset + hdu.dataOffset, hdu.dataBytes);
  const scale = Number(hdu.header.BSCALE ?? 1);
  const zero = Number(hdu.header.BZERO ?? 0);
  const bytes = Math.abs(hdu.bitpix) / 8;
  return (index: number) => {
    if (!Number.isInteger(index) || index < 0 || index >= count) return NaN;
    const p = index * bytes;
    let value = NaN;
    if (hdu.bitpix === -32) value = dv.getFloat32(p, false);
    else if (hdu.bitpix === -64) value = dv.getFloat64(p, false);
    else if (hdu.bitpix === 32) value = dv.getInt32(p, false);
    else if (hdu.bitpix === 16) value = dv.getInt16(p, false);
    else if (hdu.bitpix === 8) value = dv.getUint8(p);
    return Number.isFinite(value) ? value * scale + zero : NaN;
  };
}
function tableColumns(header: Record<string, FitsScalar>) {
  const count = Number(header.TFIELDS || 0);
  let offset = 0;
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const name = String(header['TTYPE' + n] || '').trim().toUpperCase();
    const form = String(header['TFORM' + n] || '').trim().toUpperCase();
    const match = form.match(/^(\d*)([A-Z])$/);
    if (!match) throw new Error('Unsupported FITS table column format: ' + form);
    const repeat = Number(match[1] || 1);
    const code = match[2];
    const width = ({ A: 1, L: 1, B: 1, I: 2, J: 4, K: 8, E: 4, D: 8, C: 8, M: 16 } as Record<string, number>)[code];
    if (!width) throw new Error('Unsupported FITS binary table type: ' + code);
    const column = { name, code, repeat, offset, bytes: repeat * width };
    offset += column.bytes;
    return column;
  });
}
function readTableNumber(buffer: Buffer, rowOffset: number, col: ReturnType<typeof tableColumns>[number], index = 0): number {
  const p = rowOffset + col.offset + index * (col.bytes / col.repeat);
  if (col.code === 'J') return buffer.readInt32BE(p);
  if (col.code === 'I') return buffer.readInt16BE(p);
  if (col.code === 'E') return buffer.readFloatBE(p);
  if (col.code === 'D') return buffer.readDoubleBE(p);
  if (col.code === 'K') return Number(buffer.readBigInt64BE(p));
  if (col.code === 'B') return buffer.readUInt8(p);
  return NaN;
}
function finite(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function versionAtLeastSeven(value: unknown): boolean {
  const m = String(value || '').match(/^(\d+)\.(\d+)/);
  return !!m && (Number(m[1]) > 7 || (Number(m[1]) === 7 && Number(m[2]) >= 0));
}

export interface SpherexEpsfResult {
  source: 'NASA/IPAC IRSA SPHEREx Level-2 EPSF extension';
  observation: { obsId: string; collection: string; band: string; mjd: number; accessUrl: string };
  imageVersion: string;
  detector: string;
  oversampling: { x: number; y: number };
  parentPixel: { x: number; y: number };
  selectedZone: { row: number; binX: number; binY: number; xCenter: number; yCenter: number; distancePixels: number; nStar: number; nEffMean: number; wavelengthMicrons: number; bandMicrons: number };
  dimensions: { width: number; height: number };
  sum: number;
  min: number;
  max: number;
  psf: number[];
  zones: { binX: number; binY: number; xCenter: number; yCenter: number; nEffMean: number; wavelengthMicrons: number }[];
  calibrationHistory: string[];
}
export function parseSpherexEpsfFits(input: Buffer, raDeg: number, decDeg: number, observation: SpherexEpsfResult['observation']): SpherexEpsfResult {
  const { buffer, hdus } = readHdus(input);
  const primary = hdus.find(h => h.extname === 'PRIMARY');
  const image = hdus.find(h => h.extname === 'IMAGE');
  const epsf = hdus.find(h => h.extname === 'EPSF');
  if (!image || !epsf) {
    const version = primary?.header.VERSION || image?.header.VERSION || 'unknown';
    throw new Error('This SPHEREx cutout has no EPSF binary-table extension (image version ' + version + '). The official legacy pre-7.0 calibration-file fallback is not enabled; no substitute PSF is used.');
  }
  const imageVersion = String(primary?.header.VERSION || image.header.VERSION || 'not recorded');
  if (imageVersion !== 'not recorded' && !versionAtLeastSeven(imageVersion)) {
    throw new Error('SPHEREx image version ' + imageVersion + ' predates the supported v7.0 in-file EPSF workflow.');
  }
  const wcs = extractWcsFromHeader(image.header as Record<string, string | number | boolean>);
  if (!wcs) throw new Error('IMAGE extension has no usable celestial WCS.');
  const cutoutPixel = skyToFitsPixel(raDeg, decDeg, wcs);
  if (!cutoutPixel) throw new Error('Requested sky position falls outside the SPHEREx cutout WCS.');
  const crpix1a = finite(image.header.CRPIX1A);
  const crpix2a = finite(image.header.CRPIX2A);
  if (crpix1a === null || crpix2a === null) throw new Error('SPHEREx IMAGE header is missing CRPIX1A/CRPIX2A parent-image offsets.');
  // Match the official notebook: x_parent = 1 + x_cutout_zero_based - CRPIX1A.
  const parentX = 1 + (cutoutPixel.px1 - 1) - crpix1a;
  const parentY = 1 + (cutoutPixel.py1 - 1) - crpix2a;
  const columns = tableColumns(epsf.header);
  const col = (name: string) => columns.find(c => c.name === name);
  const required = ['BINX','BINY','XCENTER','YCENTER','NSTAR','NEFF_MEAN','CWAVE','CBAND','EPSF'];
  for (const name of required) if (!col(name)) throw new Error('EPSF table is missing required column ' + name);
  const rowLength = Number(epsf.header.NAXIS1);
  const rowCount = Number(epsf.header.NAXIS2);
  if (rowLength <= 0 || rowCount <= 0 || epsf.dataOffset + rowLength * rowCount > buffer.length) throw new Error('EPSF binary table has invalid dimensions.');
  const epsfCol = col('EPSF')!;
  if (epsfCol.repeat !== 1089 || epsfCol.code !== 'D') throw new Error('Unsupported EPSF array format; expected 1089D (33×33 float64).');
  let best: { row: number; distance: number; values: number[] } | null = null;
  const zones: SpherexEpsfResult['zones'] = [];
  for (let row = 0; row < rowCount; row++) {
    const offset = epsf.dataOffset + row * rowLength;
    const x = readTableNumber(buffer, offset, col('XCENTER')!);
    const y = readTableNumber(buffer, offset, col('YCENTER')!);
    const binX = readTableNumber(buffer, offset, col('BINX')!);
    const binY = readTableNumber(buffer, offset, col('BINY')!);
    const neff = readTableNumber(buffer, offset, col('NEFF_MEAN')!);
    const wave = readTableNumber(buffer, offset, col('CWAVE')!);
    const distance = Math.hypot(parentX - x, parentY - y);
    zones.push({ binX, binY, xCenter: x, yCenter: y, nEffMean: neff, wavelengthMicrons: wave });
    if (!best || distance < best.distance) best = { row, distance, values: [] };
  }
  if (!best) throw new Error('EPSF table contains no detector zones.');
  const selectedOffset = epsf.dataOffset + best.row * rowLength;
  const selected = columns.reduce((acc, c) => { acc[c.name] = c; return acc; }, {} as Record<string, typeof columns[number]>);
  const values = Array.from({ length: 1089 }, (_, i) => readTableNumber(buffer, selectedOffset, selected.EPSF, i));
  const zone = zones[best.row];
  const sum = values.reduce((a, b) => a + b, 0);
  const finiteValues = values.filter(Number.isFinite);
  const history = Object.entries(epsf.header).filter(([k]) => k.startsWith('HISTORY')).map(([,v]) => String(v));
  return {
    source: 'NASA/IPAC IRSA SPHEREx Level-2 EPSF extension',
    observation, imageVersion, detector: String(epsf.header.DETECTOR || image.header.DETECTOR || 'unknown'),
    oversampling: { x: Number(epsf.header.OVSMPX || 1), y: Number(epsf.header.OVSMPY || 1) },
    parentPixel: { x: Number(parentX.toFixed(3)), y: Number(parentY.toFixed(3)) },
    selectedZone: { row: best.row, binX: zone.binX, binY: zone.binY, xCenter: zone.xCenter, yCenter: zone.yCenter, distancePixels: Number(best.distance.toFixed(3)), nStar: readTableNumber(buffer, selectedOffset, selected.NSTAR), nEffMean: zone.nEffMean, wavelengthMicrons: zone.wavelengthMicrons, bandMicrons: readTableNumber(buffer, selectedOffset, selected.CBAND) },
    dimensions: { width: 33, height: 33 }, sum, min: Math.min(...finiteValues), max: Math.max(...finiteValues),
    psf: values, zones, calibrationHistory: history.slice(-4),
  };
}

async function getSpherexProperties(): Promise<Record<string,string>> {
  const cached = cacheGet<Record<string,string>>('hips-properties');
  if (cached) return cached;
  const response = await fetch(HIPS_ROOT + '/properties', { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('IRSA HiPS properties HTTP ' + response.status);
  const body = await response.text();
  const props: Record<string,string> = {};
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) props[trimmed.slice(0,eq).trim()] = trimmed.slice(eq+1).trim();
  }
  cacheSet('hips-properties', props, 6 * 60 * 60 * 1000);
  return props;
}
function projectHpx(longitudeDeg: number, latitudeDeg: number): { xDeg: number; yDeg: number } {
  const lon = ((longitudeDeg % 360) + 360) % 360 * Math.PI / 180;
  const lat = latitudeDeg * Math.PI / 180;
  const z = Math.sin(lat);
  const za = Math.abs(z);
  let x: number, y: number;
  if (za <= 2 / 3) {
    x = lon;
    y = (3 * Math.PI / 8) * z;
  } else {
    const quadrant = Math.min(3, Math.floor(lon / (Math.PI / 2)));
    const facetCenter = (quadrant + 0.5) * (Math.PI / 2);
    const sigma = Math.sqrt(3 * (1 - za));
    x = facetCenter + (lon - facetCenter) * sigma;
    y = Math.sign(z) * (Math.PI / 4) * (2 - sigma);
  }
  return { xDeg: x * 180 / Math.PI, yDeg: y * 180 / Math.PI };
}

/** HPX projection WCS forward transform, followed by the FITS CD/PC matrix. */
function skyToHpxPixel(raDeg: number, decDeg: number, header: Record<string, FitsScalar>): { px1: number; py1: number } {
  const wcs = extractWcsFromHeader(header as Record<string, string | number | boolean>);
  if (!wcs) throw new Error('HiPS IMAGE extension has no usable celestial WCS.');
  const deltaLon = ((raDeg - wcs.crval1 + 540) % 360) - 180;
  const point = projectHpx(deltaLon, decDeg);
  const reference = projectHpx(0, wcs.crval2);
  const dxWorld = point.xDeg - reference.xDeg;
  const dyWorld = point.yDeg - reference.yDeg;
  const determinant = wcs.cd1_1 * wcs.cd2_2 - wcs.cd1_2 * wcs.cd2_1;
  if (Math.abs(determinant) < 1e-18) throw new Error('HiPS celestial WCS has a singular CD matrix.');
  const dx = (wcs.cd2_2 * dxWorld - wcs.cd1_2 * dyWorld) / determinant;
  const dy = (-wcs.cd2_1 * dxWorld + wcs.cd1_1 * dyWorld) / determinant;
  return { px1: wcs.crpix1 + dx, py1: wcs.crpix2 + dy };
}

function spreadBits(value: number): number {
  let out = 0;
  for (let bit = 0; bit < 16; bit++) out |= ((value >>> bit) & 1) << (bit * 2);
  return out >>> 0;
}
function compactBits(value: number): number {
  let out = 0;
  for (let bit = 0; bit < 16; bit++) out |= ((value >>> (bit * 2)) & 1) << bit;
  return out >>> 0;
}
/** HEALPix ang2pix_nest, equivalent to hpgeom.angle_to_pixel(..., nest=true, lonlat=true). */
export function healpixNestedIndex(nside: number, raDeg: number, decDeg: number): { pixel: number; face: number; ix: number; iy: number } {
  if (!Number.isInteger(nside) || nside < 1 || (nside & (nside - 1)) !== 0) throw new Error('HEALPix nside must be a power of two.');
  if (!Number.isFinite(raDeg) || raDeg < 0 || raDeg >= 360 || !Number.isFinite(decDeg) || decDeg < -90 || decDeg > 90) throw new Error('Invalid sky coordinates.');
  const order = Math.round(Math.log2(nside));
  const z = Math.sin(decDeg * Math.PI / 180);
  const za = Math.abs(z);
  const phi = ((raDeg * Math.PI / 180) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const tt = phi / (Math.PI / 2);
  let face: number, ix: number, iy: number;
  if (za <= 2/3) {
    const jp = Math.floor(nside * (0.5 + tt - z * 0.75));
    const jm = Math.floor(nside * (0.5 + tt + z * 0.75));
    const ifp = jp >> order, ifm = jm >> order;
    face = ifp === ifm ? (ifp & 3) + 4 : ifp < ifm ? (ifp & 3) : (ifm & 3) + 8;
    ix = jm & (nside - 1);
    iy = nside - (jp & (nside - 1)) - 1;
  } else {
    const nt = Math.min(3, Math.floor(tt));
    const tp = tt - nt;
    const tmp = nside * Math.sqrt(3 * (1 - za));
    const jp = Math.min(nside - 1, Math.floor(tp * tmp));
    const jm = Math.min(nside - 1, Math.floor((1 - tp) * tmp));
    if (z >= 0) { face = nt; ix = nside - jm - 1; iy = nside - jp - 1; }
    else { face = nt + 8; ix = jp; iy = jm; }
  }
  const pixel = face * nside * nside + spreadBits(ix) + (spreadBits(iy) << 1);
  return { pixel, face, ix, iy };
}
export interface SpherexHipsSpectrum {
  source: 'NASA/IPAC IRSA SPHEREx DR1 HiPS All-Sky Mosaic Cube';
  hipsUrl: string;
  cubeUrl: string;
  hipsOrder: number;
  healpixPixel: number;
  tileDirectory: number;
  pixel: { x: number; y: number; width: number; height: number };
  wavelengthRangeMicrons: [number, number];
  blankDichroicLayers: number[];
  aperture: { radiusPixels: number; annulusInnerPixels: number; annulusOuterPixels: number; backgroundMethod: string };
  spectrum: { layer: number; wavelengthMicrons: number; fluxMilliJansky: number | null; backgroundSurfaceBrightness: number | null; aperturePixels: number; flaggedPixels: number; medianHits: number | null; blank: boolean }[];
  spectrumUse: 'visualization-only';
  flagsPolicy: 'reported-not-masked';
  notes: string[];
}
export async function extractSpherexHipsSpectrum(raDeg: number, decDeg: number, apertureRadius = 5, annulusInner = 40, annulusOuter = 60): Promise<SpherexHipsSpectrum> {
  const cacheKey = 'hips-spectrum-' + [raDeg,decDeg,apertureRadius,annulusInner,annulusOuter].map(n=>n.toFixed(7)).join('-');
  const cached = cacheGet<SpherexHipsSpectrum>(cacheKey);
  if (cached) return cached;
  if (!(apertureRadius > 0 && annulusInner > apertureRadius && annulusOuter > annulusInner && annulusOuter <= 100)) throw new Error('Use aperture radius > 0 and annulus radii with aperture < inner < outer ≤ 100 pixels.');
  const props = await getSpherexProperties();
  const waveValues = String(props.data_cube_crval3_arr || '').trim().split(/\s+/).map(Number).filter(Number.isFinite);
  const depth = Number(props.hips_cube_depth || waveValues.length);
  if (depth !== SPHEREX_HIPS_CUBE_DEPTH || waveValues.length !== SPHEREX_HIPS_CUBE_DEPTH) throw new Error('IRSA HiPS metadata did not report the expected 102 spectral layers.');
  const order = 5, nside = 1 << order;
  const coarse = healpixNestedIndex(nside, raDeg, decDeg);
  const fineNside = nside * SPHEREX_HIPS_TILE_SIZE;
  const fine = healpixNestedIndex(fineNside, raDeg, decDeg);
  if (coarse.pixel !== Math.floor(fine.pixel / (SPHEREX_HIPS_TILE_SIZE * SPHEREX_HIPS_TILE_SIZE))) throw new Error('Nested HEALPix child pixel does not map to the expected Norder 5 parent tile.');
  const dir = Math.floor(coarse.pixel / 10000) * 10000;
  const cubeUrl = HIPS_DATA_ROOT + '/Norder' + order + '/Dir' + dir + '/Npix' + coarse.pixel + '_cube.fits';
  const response = await fetch(cubeUrl, { signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error('IRSA HiPS FITS cube HTTP ' + response.status + ' for tile ' + coarse.pixel);
  const input = Buffer.from(await response.arrayBuffer());
  const { buffer, hdus } = readHdus(input);
  const image = hdus.find(h => h.extname === 'IMAGE');
  const hits = hdus.find(h => h.extname === 'NHITS');
  const flags = hdus.find(h => h.extname === 'FLAGS');
  if (!image || image.axes.length !== 3 || image.axes[2] !== 102) throw new Error('HiPS IMAGE extension is not a 102-layer 3D cube.');
  const width = image.axes[0], height = image.axes[1], layers = image.axes[2];
  validateSpherexHipsCubeDimensions(width, height, depth);
  const hipsWcs = skyToHpxPixel(raDeg, decDeg, image.header);
  // Preserve the sub-pixel sky position returned by the HPX WCS, as in the IRSA notebook.
  const x = hipsWcs.px1 - 1, y = hipsWcs.py1 - 1;
  if (x < -0.5 || x > width - 0.5 || y < -0.5 || y > height - 0.5) {
    throw new Error('The selected sky position maps outside the retrieved HiPS FITS tile according to its HPX WCS.');
  }
  // Read only aperture/annulus samples from the FITS buffer. A 512×512×102
  // cube can be >300 MB across IMAGE/NHITS/FLAGS; materializing three more
  // Float32Arrays would unnecessarily double peak memory on the web service.
  const readCube = numericAccessor(buffer, image);
  const readHits = hits && hits.axes.length === 3 ? numericAccessor(buffer, hits) : null;
  const readFlags = flags && flags.axes.length === 3 ? numericAccessor(buffer, flags) : null;
  const spec = [];
  const blankLayers = [50, 51];
  const annulusTouchesTileEdge = x - annulusOuter < -0.5 || x + annulusOuter > width - 0.5 || y - annulusOuter < -0.5 || y + annulusOuter > height - 0.5;
  const notes = [
    'Layer index is zero-based; wavelength order is ascending from the official HiPS properties.',
    'Layers 50 and 51 are the documented blank dichroic channels (band 3 channel 17 and band 4 channel 1).',
    'Aperture photometry uses a circular source aperture and a local annulus; the annulus background is a 3-sigma clipped mean.',
    'The tile is selected with nested HEALPix Norder 5 and contains 512×512 pixels, matching the official IRSA notebook.',
    'This simple aperture spectrum is for visualization only; IRSA recommends its Spectrophotometry Tool for science-grade spectra.',
    'Non-zero FLAGS values are reported for the aperture but are not masked because the flag-bit policy has not been independently validated here.',
    'Aperture membership uses pixel-center inclusion around the sub-pixel WCS position; fractional pixel overlap and a full photometric uncertainty model are not implemented.',
    ...(annulusTouchesTileEdge ? ['The background annulus reaches beyond the FITS tile edge and is clipped; the local background estimate may be biased.'] : []),
  ];
  const pixScaleArcsec = Math.sqrt(4 * Math.PI / (12 * Math.pow(fineNside, 2))) * (180 / Math.PI) * 3600;
  const pixSr = Math.pow(pixScaleArcsec / 206264.806, 2);
  for (let layer = 0; layer < layers; layer++) {
    const layerOffset: number = layer * width * height;
    const ap: number[] = [], ann: number[] = [];
    let flaggedPixels = 0, hitsValues: number[] = [];
    for (let py = Math.max(0, Math.floor(y - annulusOuter)); py <= Math.min(height - 1, Math.ceil(y + annulusOuter)); py++) {
      for (let px = Math.max(0, Math.floor(x - annulusOuter)); px <= Math.min(width - 1, Math.ceil(x + annulusOuter)); px++) {
        const radius = Math.hypot(px - x, py - y);
        const idx = layerOffset + py * width + px;
        const value = readCube(idx);
        if (!Number.isFinite(value)) continue;
        if (radius <= apertureRadius) {
          ap.push(value);
          if (readFlags && readFlags(idx) !== 0) flaggedPixels++;
          if (readHits) {
            const hitValue = readHits(idx);
            if (Number.isFinite(hitValue)) hitsValues.push(hitValue);
          }
        } else if (radius >= annulusInner && radius <= annulusOuter) ann.push(value);
      }
    }
    const sortedAnn = ann.slice().sort((a,b)=>a-b);
    let clipped = sortedAnn;
    for (let iter=0;iter<5 && clipped.length>4;iter++) {
      const mean=clipped.reduce((a,b)=>a+b,0)/clipped.length;
      const sigma=Math.sqrt(clipped.reduce((a,b)=>a+(b-mean)**2,0)/clipped.length);
      if (!sigma) break;
      const next=clipped.filter(v=>Math.abs(v-mean)<=3*sigma);
      if (next.length===clipped.length || next.length<4) break;
      clipped=next;
    }
    const background=clipped.length?clipped.reduce((a,b)=>a+b,0)/clipped.length:null;
    const sum=ap.reduce((a,b)=>a+b,0);
    const flux=background===null?null:sum-background*ap.length;
    const blank=blankLayers.includes(layer);
    spec.push({
      layer, wavelengthMicrons:waveValues[layer],
      fluxMilliJansky:blank||flux===null?null:Number((flux*pixSr*1e9).toFixed(6)),
      backgroundSurfaceBrightness:background===null?null:Number(background.toFixed(6)),
      aperturePixels:ap.length, flaggedPixels,
      medianHits:hitsValues.length?hitsValues.sort((a,b)=>a-b)[Math.floor(hitsValues.length/2)]:null,
      blank,
    });
  }
  const result: SpherexHipsSpectrum = {
    source:'NASA/IPAC IRSA SPHEREx DR1 HiPS All-Sky Mosaic Cube',
    hipsUrl:HIPS_ROOT, cubeUrl, hipsOrder:order, healpixPixel:coarse.pixel, tileDirectory:dir,
    pixel:{x,y,width,height}, wavelengthRangeMicrons:[waveValues[0],waveValues[waveValues.length-1]],
    blankDichroicLayers:blankLayers,
    spectrumUse:'visualization-only', flagsPolicy:'reported-not-masked',
    aperture:{radiusPixels:apertureRadius,annulusInnerPixels:annulusInner,annulusOuterPixels:annulusOuter,backgroundMethod:'Iterative 3σ-clipped annulus mean; pixel-center aperture approximation'},
    spectrum:spec, notes,
  };
  cacheSet(cacheKey,result,60*60*1000);
  return result;
}

export interface MpcIngestionResult {
  source: 'International Astronomical Union Minor Planet Center';
  feedUrl: string;
  fetchedAt: string;
  lastModified: string | null;
  sourceRecordCount: number;
  etnoCount: number;
  filter: { semiMajorAxisAU: '> 150'; perihelionDistanceAU: '> 30'; boundOrbitsOnly: true };
  objects: ExtremeTNO[];
  attribution: string;
}
export function normalizeMpcDistantRecords(payload: unknown): ExtremeTNO[] {
  const root = payload as any;
  const rows: any[] = Array.isArray(root) ? root :
    Array.isArray(root?.data) ? root.data :
    Array.isArray(root?.objects) ? root.objects :
    Array.isArray(root?.results) ? root.results : [];
  const objects: ExtremeTNO[] = [];
  rows.forEach((row, index) => {
    const a=finite(row.a), e=finite(row.e), q=finite(row.Perihelion_dist), i=finite(row.i);
    const node=finite(row.Node), peri=finite(row.Peri);
    if (a===null || e===null || q===null || i===null || node===null || peri===null) return;
    if (!(a>150 && q>30 && e>=0 && e<1)) return;
    const Q=finite(row.Aphelion_dist) ?? a*(1+e);
    const name=String(row.Name || row.Principal_desig || row.Number || 'MPC distant object');
    const desig=String(row.Principal_desig || row.Number || name);
    const yearMatch=desig.match(/^(\d{4})/);
    const period=finite(row.Orbital_period) ?? Math.sqrt(a*a*a);
    const longPeri=(node+peri+360)%360;
    objects.push({
      id:'MPC-'+String(row.Number || desig || index).replace(/[^A-Za-z0-9_-]/g,'-'),
      name: name + (name===desig?'':' ('+desig+')'),
      semiMajorAxisAU:a, perihelionDistAU:q, aphelionDistAU:Q,
      eccentricity:e, inclinationDeg:i, longAscNodeDeg:(node+360)%360,
      argPerihelionDeg:(peri+360)%360, longPerihelionDeg:longPeri,
      discoveryYear:yearMatch?Number(yearMatch[1]):null,
      discoverySurvey:'Minor Planet Center Distant Extended catalogue',
      antiAligned:null, orbitalPeriodYears:period,
      source:'MPC', mpcDesignation:desig,
      lastObserved:typeof row.Last_obs==='string'?row.Last_obs:null,
      observationCount:finite(row.Num_obs), oppositionCount:finite(row.Num_opps),
      orbitEpochJD:finite(row.Epoch), clusteringStatus:'not-assessed',
    } as ExtremeTNO);
  });
  return objects.sort((a,b)=>b.semiMajorAxisAU-a.semiMajorAxisAU);
}
export async function ingestMpcDistantEtnoCatalog(force=false): Promise<MpcIngestionResult> {
  const key='mpc-distant-etno';
  if (!force) {
    const cached=cacheGet<MpcIngestionResult>(key);
    if (cached) return cached;
  }
  const response=await fetch(MPC_DISTANT_URL,{headers:{Accept:'application/json, application/gzip'},signal:AbortSignal.timeout(45000)});
  if (!response.ok) throw new Error('MPC distant_extended.json.gz HTTP '+response.status);
  const raw=Buffer.from(await response.arrayBuffer());
  if (raw.length>250*1024*1024) throw new Error('MPC feed exceeded the 250 MB safety limit.');
  const body=raw.length>2&&raw[0]===0x1f&&raw[1]===0x8b?gunzipSync(raw):raw;
  const payload=JSON.parse(body.toString('utf8')) as unknown;
  const root=payload as any;
  const sourceRows=Array.isArray(root)?root:Array.isArray(root?.data)?root.data:Array.isArray(root?.objects)?root.objects:Array.isArray(root?.results)?root.results:[];
  if (!sourceRows.length) throw new Error('MPC feed returned no parseable object records; live catalogue was not replaced.');
  const objects=normalizeMpcDistantRecords(payload);
  const result:MpcIngestionResult={
    source:'International Astronomical Union Minor Planet Center',
    feedUrl:MPC_DISTANT_URL, fetchedAt:new Date().toISOString(),
    lastModified:response.headers.get('last-modified'),
    sourceRecordCount:sourceRows.length, etnoCount:objects.length,
    filter:{semiMajorAxisAU:'> 150',perihelionDistanceAU:'> 30',boundOrbitsOnly:true},
    objects,
    attribution:'This research has made use of data and/or services provided by the International Astronomical Union’s Minor Planet Center.',
  };
  cacheSet(key,result,12*60*60*1000);
  return result;
}

export async function fetchSpherexEpsfAtPosition(raDeg:number,decDeg:number):Promise<SpherexEpsfResult>{
  if (!Number.isFinite(raDeg)||raDeg<0||raDeg>=360||!Number.isFinite(decDeg)||decDeg< -90||decDeg>90) throw new Error('Valid ICRS RA/Dec coordinates are required.');
  const collections:SpherexCollectionName[]=['spherex_dr1','spherex_dr1_deep','spherex_qr3','spherex_qr3_deep'];
  const rows=(await Promise.all(collections.map(c=>queryIrsaSpherexSia(raDeg,decDeg,c,0.02,9000).catch(()=>[] as SiaObservationRow[])))).flat();
  const ordered=rows.sort((a,b)=>b.tMinMjd-a.tMinMjd).slice(0,6);
  if (!ordered.length) throw new Error('IRSA returned no SPHEREx Level-2 image observations at this position.');
  const errors:string[]=[];
  for(const row of ordered){
    try{
      const sep=row.accessUrl.includes('?')?'&':'?';
      const url=row.accessUrl+sep+'center='+raDeg.toFixed(7)+','+decDeg.toFixed(7)+'d&size=0.01';
      const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
      if(!response.ok) throw new Error('IBE cutout HTTP '+response.status);
      const buffer=Buffer.from(await response.arrayBuffer());
      const observation={obsId:row.obsId,collection:row.obsCollection,band:row.bandpassName,mjd:row.tMinMjd,accessUrl:row.accessUrl};
      try{return parseSpherexEpsfFits(buffer,raDeg,decDeg,observation);}
      catch(error){errors.push(row.obsId+': '+(error instanceof Error?error.message:String(error)));}
    }catch(error){errors.push(row.obsId+': '+(error instanceof Error?error.message:String(error)));}
  }
  throw new Error('SPHEREx observations were found, but no selected cutout supplied a supported v7+ EPSF extension. '+errors.slice(0,3).join(' | '));
}
