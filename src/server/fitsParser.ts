/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BLACK STAR ORBIT — Pure TypeScript FITS Binary & WCS Parser
 * Parses NASA/IPAC IRSA SPHEREx Level-2 Multi-Extension FITS (IMAGE, FLAGS, VARIANCE, ZODI)
 * and AllWISE gzipped FITS cutouts, computes TAN WCS transformations (CD or PC+CDELT),
 * reprojects to a common North-Up East-Left ICRS grid, and runs aperture photometry.
 */

import zlib from 'zlib';
import type { FitsWcsInfo, RealFitsCutoutData, RealFitsStats } from '../types/index.ts';

interface ParsedHdu {
  extname: string;
  header: Record<string, string | number | boolean>;
  bitpix: number;
  naxis: number;
  naxis1: number;
  naxis2: number;
  bzero: number;
  bscale: number;
  dataFloat?: Float32Array;
  dataInt?: Int32Array;
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function parseFitsCard(card: string): { key: string; value: string | number | boolean } | null {
  const key = card.slice(0, 8).trim();
  if (!key || key === 'COMMENT' || key === 'HISTORY' || key === 'END') return null;
  if (card[8] !== '=' || card[9] !== ' ') return null;

  const rest = card.slice(10);
  const trimmed = rest.trimStart();
  if (trimmed.startsWith("'")) {
    const closeIdx = trimmed.indexOf("'", 1);
    const strVal = closeIdx > 0 ? trimmed.slice(1, closeIdx).trim() : trimmed.slice(1).trim();
    return { key, value: strVal };
  }

  const slashIdx = rest.indexOf('/');
  const rawVal = (slashIdx >= 0 ? rest.slice(0, slashIdx) : rest).trim();
  if (rawVal === 'T') return { key, value: true };
  if (rawVal === 'F') return { key, value: false };
  const num = Number(rawVal);
  if (rawVal !== '' && !Number.isNaN(num)) {
    return { key, value: num };
  }
  return { key, value: rawVal };
}

function numVal(h: Record<string, string | number | boolean>, key: string, fallback = 0): number {
  const v = h[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function strVal(h: Record<string, string | number | boolean>, key: string, fallback = ''): string {
  const v = h[key];
  return v !== undefined ? String(v) : fallback;
}

export function extractWcsFromHeader(h: Record<string, string | number | boolean>): FitsWcsInfo | undefined {
  const crval1 = numVal(h, 'CRVAL1', NaN);
  const crval2 = numVal(h, 'CRVAL2', NaN);
  const crpix1 = numVal(h, 'CRPIX1', NaN);
  const crpix2 = numVal(h, 'CRPIX2', NaN);
  if (!Number.isFinite(crval1) || !Number.isFinite(crval2) || !Number.isFinite(crpix1) || !Number.isFinite(crpix2)) {
    return undefined;
  }

  let cd1_1 = numVal(h, 'CD1_1', NaN);
  let cd1_2 = numVal(h, 'CD1_2', NaN);
  let cd2_1 = numVal(h, 'CD2_1', NaN);
  let cd2_2 = numVal(h, 'CD2_2', NaN);

  if (!Number.isFinite(cd1_1) || !Number.isFinite(cd2_2)) {
    const cdelt1 = numVal(h, 'CDELT1', 1);
    const cdelt2 = numVal(h, 'CDELT2', 1);
    const pc1_1 = numVal(h, 'PC1_1', 1);
    const pc1_2 = numVal(h, 'PC1_2', 0);
    const pc2_1 = numVal(h, 'PC2_1', 0);
    const pc2_2 = numVal(h, 'PC2_2', 1);
    cd1_1 = cdelt1 * pc1_1;
    cd1_2 = cdelt1 * pc1_2;
    cd2_1 = cdelt2 * pc2_1;
    cd2_2 = cdelt2 * pc2_2;
  }

  const scaleX = Math.hypot(cd1_1, cd2_1) * 3600;
  const scaleY = Math.hypot(cd1_2, cd2_2) * 3600;
  const pixelScaleArcsec = Number(((scaleX + scaleY) / 2).toFixed(3)) || 6.15;

  return {
    crval1,
    crval2,
    crpix1,
    crpix2,
    cd1_1,
    cd1_2,
    cd2_1,
    cd2_2,
    ctype1: strVal(h, 'CTYPE1', 'RA---TAN'),
    ctype2: strVal(h, 'CTYPE2', 'DEC--TAN'),
    pixelScaleArcsec,
  };
}

/**
 * TAN (gnomonic) forward projection: (RA deg, Dec deg) -> 1-based FITS pixel (px1, py1)
 */
export function skyToFitsPixel(raDeg: number, decDeg: number, wcs: FitsWcsInfo): { px1: number; py1: number } | null {
  const ra = raDeg * DEG_TO_RAD;
  const dec = decDeg * DEG_TO_RAD;
  const ra0 = wcs.crval1 * DEG_TO_RAD;
  const dec0 = wcs.crval2 * DEG_TO_RAD;

  const cosC = Math.sin(dec0) * Math.sin(dec) + Math.cos(dec0) * Math.cos(dec) * Math.cos(ra - ra0);
  if (cosC <= 0.01) return null;

  const xiDeg = (RAD_TO_DEG * (Math.cos(dec) * Math.sin(ra - ra0))) / cosC;
  const etaDeg =
    (RAD_TO_DEG * (Math.cos(dec0) * Math.sin(dec) - Math.sin(dec0) * Math.cos(dec) * Math.cos(ra - ra0))) / cosC;

  const det = wcs.cd1_1 * wcs.cd2_2 - wcs.cd1_2 * wcs.cd2_1;
  if (Math.abs(det) < 1e-18) return null;

  const dx = (wcs.cd2_2 * xiDeg - wcs.cd1_2 * etaDeg) / det;
  const dy = (-wcs.cd2_1 * xiDeg + wcs.cd1_1 * etaDeg) / det;

  return {
    px1: wcs.crpix1 + dx,
    py1: wcs.crpix2 + dy,
  };
}

/**
 * TAN (gnomonic) inverse projection: 1-based FITS pixel (px1, py1) -> (RA deg, Dec deg)
 */
export function fitsPixelToSky(px1: number, py1: number, wcs: FitsWcsInfo): { raDeg: number; decDeg: number } {
  const dx = px1 - wcs.crpix1;
  const dy = py1 - wcs.crpix2;

  const xiDeg = wcs.cd1_1 * dx + wcs.cd1_2 * dy;
  const etaDeg = wcs.cd2_1 * dx + wcs.cd2_2 * dy;

  const xi = xiDeg * DEG_TO_RAD;
  const eta = etaDeg * DEG_TO_RAD;
  const ra0 = wcs.crval1 * DEG_TO_RAD;
  const dec0 = wcs.crval2 * DEG_TO_RAD;

  const rho = Math.hypot(xi, eta);
  if (rho < 1e-12) {
    return { raDeg: wcs.crval1, decDeg: wcs.crval2 };
  }

  const c = Math.atan(rho);
  const sinC = Math.sin(c);
  const cosC = Math.cos(c);

  const dec = Math.asin(cosC * Math.sin(dec0) + (eta * sinC * Math.cos(dec0)) / rho);
  const ra =
    ra0 + Math.atan2(xi * sinC, rho * Math.cos(dec0) * cosC - eta * Math.sin(dec0) * sinC);

  const raDeg = ((ra * RAD_TO_DEG) % 360 + 360) % 360;
  return { raDeg, decDeg: dec * RAD_TO_DEG };
}

function readFitsBuffer(rawBuffer: Buffer): ParsedHdu[] {
  // Decompress gzip if needed (AllWISE cuts are .fits.gz)
  const isGzip = rawBuffer.length >= 2 && rawBuffer[0] === 0x1f && rawBuffer[1] === 0x8b;
  const buf = isGzip ? zlib.gunzipSync(rawBuffer) : rawBuffer;

  const hdus: ParsedHdu[] = [];
  let pos = 0;

  while (pos + 2880 <= buf.length && hdus.length < 8) {
    const header: Record<string, string | number | boolean> = {};
    let endFound = false;

    while (pos + 2880 <= buf.length) {
      for (let i = 0; i < 36; i++) {
        const card = buf.subarray(pos + i * 80, pos + (i + 1) * 80).toString('ascii');
        if (card.startsWith('END     ') || card.trim() === 'END') {
          endFound = true;
          break;
        }
        const parsed = parseFitsCard(card);
        if (parsed) {
          header[parsed.key] = parsed.value;
        }
      }
      pos += 2880;
      if (endFound) break;
    }

    if (!endFound) break;

    const extname = String(header.EXTNAME || (hdus.length === 0 ? 'PRIMARY' : `HDU_${hdus.length}`)).trim().toUpperCase();
    const xtension = String(header.XTENSION || '').trim().toUpperCase();
    const bitpix = Number(header.BITPIX || 8);
    const naxis = Number(header.NAXIS || 0);
    const naxis1 = Number(header.NAXIS1 || 0);
    const naxis2 = Number(header.NAXIS2 || 0);
    const gcount = Number(header.GCOUNT || 1);
    const pcount = Number(header.PCOUNT || 0);
    const bzero = Number(header.BZERO || 0);
    const bscale = Number(header.BSCALE || 1);

    let dataElements = 0;
    if (naxis > 0) {
      dataElements = 1;
      for (let a = 1; a <= naxis; a++) {
        dataElements *= Number(header[`NAXIS${a}`] || 0);
      }
      dataElements = gcount * (pcount + dataElements);
    }

    const bytesPerElem = Math.abs(bitpix) / 8;
    const dataBytes = dataElements * bytesPerElem;
    const paddedBytes = Math.ceil(dataBytes / 2880) * 2880;

    // Stop before reading massive BINTABLE extensions like EPSF
    if (xtension.includes('BINTABLE')) {
      break;
    }

    const hdu: ParsedHdu = {
      extname,
      header,
      bitpix,
      naxis,
      naxis1,
      naxis2,
      bzero,
      bscale,
    };

    const wantImageData =
      naxis === 2 &&
      naxis1 > 0 &&
      naxis2 > 0 &&
      pos + dataBytes <= buf.length &&
      ['PRIMARY', 'IMAGE', 'ZODI', 'VARIANCE', 'FLAGS'].includes(extname);

    if (wantImageData) {
      const count = naxis1 * naxis2;
      const dv = new DataView(buf.buffer, buf.byteOffset + pos, dataBytes);

      if (extname === 'FLAGS' && bitpix === 32) {
        const arr = new Int32Array(count);
        for (let i = 0; i < count; i++) {
          arr[i] = dv.getInt32(i * 4, false);
        }
        hdu.dataInt = arr;
      } else {
        const arr = new Float32Array(count);
        for (let i = 0; i < count; i++) {
          let val = NaN;
          if (bitpix === -32) val = dv.getFloat32(i * 4, false);
          else if (bitpix === -64) val = dv.getFloat64(i * 8, false);
          else if (bitpix === 16) val = dv.getInt16(i * 2, false);
          else if (bitpix === 32) val = dv.getInt32(i * 4, false);
          else if (bitpix === 8) val = dv.getUint8(i);
          arr[i] = Number.isFinite(val) ? val * bscale + bzero : NaN;
        }
        hdu.dataFloat = arr;
      }
    }

    hdus.push(hdu);
    pos += paddedBytes;
  }

  return hdus;
}

function bilinearSample(
  arr: Float32Array,
  srcW: number,
  srcH: number,
  px0: number,
  py0: number
): number {
  if (px0 < 0 || py0 < 0 || px0 > srcW - 1 || py0 > srcH - 1) return NaN;
  const x0 = Math.floor(px0);
  const y0 = Math.floor(py0);
  const x1 = Math.min(srcW - 1, x0 + 1);
  const y1 = Math.min(srcH - 1, y0 + 1);
  const fx = px0 - x0;
  const fy = py0 - y0;

  const v00 = arr[y0 * srcW + x0];
  const v10 = arr[y0 * srcW + x1];
  const v01 = arr[y1 * srcW + x0];
  const v11 = arr[y1 * srcW + x1];

  const vals = [
    { v: v00, w: (1 - fx) * (1 - fy) },
    { v: v10, w: fx * (1 - fy) },
    { v: v01, w: (1 - fx) * fy },
    { v: v11, w: fx * fy },
  ].filter((item) => Number.isFinite(item.v));

  if (vals.length === 0) return NaN;
  const wSum = vals.reduce((s, item) => s + item.w, 0);
  if (wSum <= 0) return vals[0].v;
  return vals.reduce((s, item) => s + item.v * item.w, 0) / wSum;
}

function computeStatsAndPhotometry(
  width: number,
  height: number,
  imagePixels: number[],
  zodiPixels?: number[],
  variancePixels?: number[],
  flagsPixels?: number[],
  pixelScaleArcsec: number = 6.15
): RealFitsStats {
  const finite = imagePixels.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (finite.length === 0) {
    return {
      min: 0,
      max: 0,
      median: 0,
      p05: 0,
      p99: 1,
      rmsNoise: 0.05,
      apertureFluxMJySr: 0,
      apertureErrMJySr: 0.05,
      apertureSnr: 0,
      centroidX: 0.5,
      centroidY: 0.5,
      flaggedPixelCount: 0,
    };
  }

  const min = finite[0];
  const max = finite[finite.length - 1];
  const median = finite[Math.floor(finite.length * 0.5)];
  const p05 = finite[Math.floor(finite.length * 0.05)];
  const p99 = finite[Math.floor(finite.length * 0.99)];

  // Robust MAD estimator for background noise sigma
  const absDevs = finite.map((v) => Math.abs(v - median)).sort((a, b) => a - b);
  const mad = absDevs[Math.floor(absDevs.length * 0.5)] || 0.01;
  const rmsNoise = Number(Math.max(1e-4, 1.4826 * mad).toFixed(4));

  // Aperture photometry centered at field center (radius ~ 2.5 pixels) + annulus background
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const apRad = Math.max(2.2, 14 / pixelScaleArcsec);
  const annIn = apRad * 2.0;
  const annOut = apRad * 3.5;

  const annulusVals: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = Math.hypot(x - cx, y - cy);
      if (r >= annIn && r <= annOut) {
        const idx = y * width + x;
        const val = imagePixels[idx] - (zodiPixels ? zodiPixels[idx] || 0 : 0);
        if (Number.isFinite(val)) annulusVals.push(val);
      }
    }
  }
  annulusVals.sort((a, b) => a - b);
  const localBg = annulusVals.length > 0 ? annulusVals[Math.floor(annulusVals.length * 0.5)] : median;

  let apSum = 0;
  let varSum = 0;
  let apCount = 0;
  let wSum = 0;
  let wxSum = 0;
  let wySum = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = Math.hypot(x - cx, y - cy);
      if (r <= apRad) {
        const idx = y * width + x;
        const raw = imagePixels[idx] - (zodiPixels ? zodiPixels[idx] || 0 : 0);
        if (Number.isFinite(raw)) {
          const net = raw - localBg;
          apSum += net;
          apCount++;
          const v = variancePixels && Number.isFinite(variancePixels[idx]) && variancePixels[idx] > 0
            ? variancePixels[idx]
            : rmsNoise * rmsNoise;
          varSum += v;
          if (net > 0) {
            wSum += net;
            wxSum += net * x;
            wySum += net * y;
          }
        }
      }
    }
  }

  const apertureFluxMJySr = Number((apCount > 0 ? apSum : 0).toFixed(4));
  const apertureErrMJySr = Number(Math.max(1e-4, Math.sqrt(varSum)).toFixed(4));
  const apertureSnr = Number((apertureFluxMJySr / apertureErrMJySr).toFixed(2));

  const centroidX = wSum > 0 ? Number((wxSum / wSum / width).toFixed(4)) : 0.5;
  const centroidY = wSum > 0 ? Number((wySum / wSum / height).toFixed(4)) : 0.5;

  let zodiMedianMJySr: number | undefined;
  if (zodiPixels && zodiPixels.length > 0) {
    const zFinite = zodiPixels.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    if (zFinite.length > 0) {
      zodiMedianMJySr = Number(zFinite[Math.floor(zFinite.length * 0.5)].toFixed(3));
    }
  }

  const flaggedPixelCount = flagsPixels
    ? flagsPixels.reduce((acc, f) => acc + (f !== 0 ? 1 : 0), 0)
    : 0;

  return {
    min: Number(min.toFixed(4)),
    max: Number(max.toFixed(4)),
    median: Number(median.toFixed(4)),
    p05: Number(p05.toFixed(4)),
    p99: Number(p99.toFixed(4)),
    rmsNoise,
    apertureFluxMJySr,
    apertureErrMJySr,
    apertureSnr,
    zodiMedianMJySr,
    centroidX,
    centroidY,
    flaggedPixelCount,
  };
}

/**
 * Parse a FITS buffer (SPHEREx L2 MEF or AllWISE single-HDU gzipped FITS)
 * and reproject to a shared North-Up, East-Left TAN grid centered on (targetRa, targetDec).
 */
export function parseAndReprojectFitsCutout(
  rawBuffer: Buffer,
  targetRaDeg: number,
  targetDecDeg: number,
  outSize: number = 64,
  targetFovArcmin?: number
): RealFitsCutoutData | null {
  const hdus = readFitsBuffer(rawBuffer);
  if (hdus.length === 0) return null;

  const imgHdu =
    hdus.find((h) => h.extname === 'IMAGE' && h.dataFloat) ||
    hdus.find((h) => h.extname === 'PRIMARY' && h.dataFloat) ||
    hdus.find((h) => h.dataFloat);

  if (!imgHdu || !imgHdu.dataFloat) return null;

  const srcW = imgHdu.naxis1;
  const srcH = imgHdu.naxis2;
  const wcs = extractWcsFromHeader(imgHdu.header);

  const zodiHdu = hdus.find((h) => h.extname === 'ZODI' && h.dataFloat);
  const varHdu = hdus.find((h) => h.extname === 'VARIANCE' && h.dataFloat);
  const flagsHdu = hdus.find((h) => h.extname === 'FLAGS' && h.dataInt);

  const nativeScaleArcsec = wcs?.pixelScaleArcsec || 6.15;
  const fovArcmin = targetFovArcmin || (Math.min(srcW, srcH) * nativeScaleArcsec) / 60;
  const outScaleDeg = fovArcmin / 60 / outSize;

  // Common North-Up East-Left TAN WCS for the reprojected cutout
  const outWcs: FitsWcsInfo = {
    crval1: targetRaDeg,
    crval2: targetDecDeg,
    crpix1: (outSize + 1) / 2,
    crpix2: (outSize + 1) / 2,
    cd1_1: -outScaleDeg, // East is left (increasing pixel X decreases RA)
    cd1_2: 0,
    cd2_1: 0,
    cd2_2: outScaleDeg,  // North is up (in canvas row 0 is top -> flip Y when placing)
    ctype1: 'RA---TAN',
    ctype2: 'DEC--TAN',
    pixelScaleArcsec: Number((outScaleDeg * 3600).toFixed(3)),
  };

  const count = outSize * outSize;
  const imagePixels = new Array<number>(count);
  const zodiPixels = zodiHdu?.dataFloat ? new Array<number>(count) : undefined;
  const variancePixels = varHdu?.dataFloat ? new Array<number>(count) : undefined;
  const flagsPixels = flagsHdu?.dataInt ? new Array<number>(count) : undefined;

  for (let canvasY = 0; canvasY < outSize; canvasY++) {
    // Canvas Y=0 is top (North = +dec offset), FITS Y=outSize is top
    const outFitsPy1 = outSize - canvasY;
    for (let canvasX = 0; canvasX < outSize; canvasX++) {
      const outFitsPx1 = canvasX + 1;
      const dstIdx = canvasY * outSize + canvasX;

      let sx0 = (canvasX / outSize) * srcW;
      let sy0 = ((outSize - 1 - canvasY) / outSize) * srcH;

      if (wcs) {
        const sky = fitsPixelToSky(outFitsPx1, outFitsPy1, outWcs);
        const srcPix = skyToFitsPixel(sky.raDeg, sky.decDeg, wcs);
        if (srcPix) {
          sx0 = srcPix.px1 - 1;
          sy0 = srcPix.py1 - 1;
        } else {
          sx0 = -1;
          sy0 = -1;
        }
      }

      const v = bilinearSample(imgHdu.dataFloat, srcW, srcH, sx0, sy0);
      imagePixels[dstIdx] = Number.isFinite(v) ? Number(v.toFixed(4)) : NaN;

      if (zodiPixels && zodiHdu?.dataFloat) {
        const zv = bilinearSample(zodiHdu.dataFloat, srcW, srcH, sx0, sy0);
        zodiPixels[dstIdx] = Number.isFinite(zv) ? Number(zv.toFixed(4)) : 0;
      }

      if (variancePixels && varHdu?.dataFloat) {
        const vv = bilinearSample(varHdu.dataFloat, srcW, srcH, sx0, sy0);
        variancePixels[dstIdx] = Number.isFinite(vv) ? Number(vv.toFixed(5)) : NaN;
      }

      if (flagsPixels && flagsHdu?.dataInt) {
        const nx = Math.round(sx0);
        const ny = Math.round(sy0);
        flagsPixels[dstIdx] =
          nx >= 0 && nx < srcW && ny >= 0 && ny < srcH
            ? flagsHdu.dataInt[ny * srcW + nx]
            : 0;
      }
    }
  }

  // Replace NaNs at rotated corners with median so visualization remains clean while marking edge
  const finiteOnly = imagePixels.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  const fillVal = finiteOnly.length > 0 ? finiteOnly[Math.floor(finiteOnly.length / 2)] : 0;
  for (let i = 0; i < count; i++) {
    if (!Number.isFinite(imagePixels[i])) imagePixels[i] = fillVal;
    if (variancePixels && !Number.isFinite(variancePixels[i])) variancePixels[i] = 0.002;
  }

  const stats = computeStatsAndPhotometry(
    outSize,
    outSize,
    imagePixels,
    zodiPixels,
    variancePixels,
    flagsPixels,
    outWcs.pixelScaleArcsec
  );

  // Curate clean header summary
  const headerSummary: Record<string, string | number> = {};
  const wantedKeys = [
    'TELESCOP',
    'INSTRUME',
    'DETECTOR',
    'DATE-OBS',
    'MJD-OBS',
    'EXPTIME',
    'BUNIT',
    'CTYPE1',
    'CTYPE2',
    'CRVAL1',
    'CRVAL2',
    'CRPIX1',
    'CRPIX2',
    'MAGZP',
    'ORIGIN',
  ];
  for (const k of wantedKeys) {
    if (imgHdu.header[k] !== undefined) {
      headerSummary[k] = String(imgHdu.header[k]);
    }
  }
  const primaryHdr = hdus[0]?.header || {};
  for (const k of ['TELESCOP', 'INSTRUME', 'DATE-OBS', 'MJD-OBS', 'EXPTIME', 'OBSERVER', 'SPX_REL', 'PIPELINE']) {
    if (primaryHdr[k] !== undefined && headerSummary[k] === undefined) {
      headerSummary[k] = String(primaryHdr[k]);
    }
  }
  headerSummary['RESAMPLED_WCS'] = 'NORTH_UP_EAST_LEFT_TAN';
  headerSummary['PIXEL_SCALE_ARCSEC'] = outWcs.pixelScaleArcsec;

  return {
    width: outSize,
    height: outSize,
    imagePixels,
    zodiPixels,
    variancePixels,
    flagsPixels,
    wcs: outWcs,
    headerSummary,
    stats,
  };
}
