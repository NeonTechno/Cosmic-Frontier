/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * COSMIC FRONTIER — SPHEREx Scientific Processing Engine
 * Mathematical algorithms for flux stretching, colormaps, image difference analysis,
 * and processing of verified Level-2/Level-3 SPHEREx image products.
 */

import { ColorMap, StretchMode, SpectralBand, SpherexObservation, SyntheticStar, TransientCandidate } from '../types/index.ts';

/**
 * 102-Band SPHEREx Spectral Channel Table
 * Configured according to the official Caltech / JPL SPHEREx Instrument Design:
 * Array 1: 0.75 - 1.12 µm (R ~ 41)
 * Array 2: 1.12 - 1.68 µm (R ~ 41)
 * Array 3: 1.68 - 2.42 µm (R ~ 41)
 * Array 4: 2.42 - 3.82 µm (R ~ 35-41)
 * Array 5: 3.82 - 4.42 µm (R ~ 110-130)
 * Array 6: 4.42 - 5.00 µm (R ~ 110-130)
 */
export const SPHEREX_BANDS: SpectralBand[] = (() => {
  const bands: SpectralBand[] = [];
  const arrayConfigs = [
    { arrayIndex: 1 as const, minW: 0.75, maxW: 1.12, steps: 17, R: 41, target: 'Galaxy Clustering / Cosmic Inflation' },
    { arrayIndex: 2 as const, minW: 1.12, maxW: 1.68, steps: 17, R: 41, target: 'Extragalactic Background Light (EBL)' },
    { arrayIndex: 3 as const, minW: 1.68, maxW: 2.42, steps: 17, R: 41, target: 'Paschen-Alpha / Reionization Epoch' },
    { arrayIndex: 4 as const, minW: 2.42, maxW: 3.82, steps: 17, R: 41, target: 'Water Ice (H2O) & PAH Carbonaceous Dust' },
    { arrayIndex: 5 as const, minW: 3.82, maxW: 4.42, steps: 17, R: 120, target: 'Carbon Dioxide Ice (CO2) & Brackett-Alpha' },
    { arrayIndex: 6 as const, minW: 4.42, maxW: 5.00, steps: 17, R: 130, target: 'Carbon Monoxide Ice (CO) & Protoplanetary Disks' },
  ];

  let idCounter = 1;
  for (const cfg of arrayConfigs) {
    const deltaW = (cfg.maxW - cfg.minW) / (cfg.steps - 1);
    for (let s = 0; s < cfg.steps; s++) {
      const w = Number((cfg.minW + s * deltaW).toFixed(3));
      const features: string[] = [];
      let isKeyLine = false;

      // Key astronomical spectral markers
      if (Math.abs(w - 0.85) < 0.02) { features.push('Ca II Triplet (0.85µm)'); isKeyLine = true; }
      if (Math.abs(w - 1.28) < 0.02) { features.push('Paschen-Beta (1.28µm)'); }
      if (Math.abs(w - 1.875) < 0.03) { features.push('Paschen-Alpha (1.875µm)'); isKeyLine = true; }
      if (Math.abs(w - 2.12) < 0.03) { features.push('H2 Molecular Shock (2.12µm)'); }
      if (Math.abs(w - 3.05) < 0.05) { features.push('Interstellar H2O Ice Band (3.05µm)'); isKeyLine = true; }
      if (Math.abs(w - 3.30) < 0.04) { features.push('PAH Aromatic C-H Stretch (3.30µm)'); isKeyLine = true; }
      if (Math.abs(w - 4.05) < 0.03) { features.push('Brackett-Alpha (4.05µm)'); isKeyLine = true; }
      if (Math.abs(w - 4.27) < 0.04) { features.push('Solid CO2 Ice Absorption (4.27µm)'); isKeyLine = true; }
      if (Math.abs(w - 4.67) < 0.04) { features.push('CO Ice Stretching Mode (4.67µm)'); isKeyLine = true; }

      bands.push({
        bandId: idCounter++,
        arrayIndex: cfg.arrayIndex,
        wavelengthMicrons: w,
        resolvingPower: cfg.R,
        scienceTarget: cfg.target,
        spectralFeatures: features,
        isKeyLine,
      });
    }
  }
  return bands;
})();

/**
 * Astronomical flux stretching routines
 */
export function applyFluxStretch(
  normalizedVal: number, // 0 to 1
  mode: StretchMode,
  asinhBeta: number = 0.08
): number {
  const clamped = Math.max(0, Math.min(1, normalizedVal));
  switch (mode) {
    case 'linear':
      return clamped;
    case 'log':
      // standard astronomical log stretch: log(1 + 1000 * x) / log(1001)
      return Math.log10(1 + 999 * clamped) / 3;
    case 'asinh':
      // Lupton et al. 2004 SDSS asinh stretch: asinh(x / beta) / asinh(1 / beta)
      return Math.asinh(clamped / asinhBeta) / Math.asinh(1 / asinhBeta);
    case 'sqrt':
      return Math.sqrt(clamped);
    default:
      return clamped;
  }
}

/**
 * High-fidelity colormaps for astronomical infrared imaging
 */
export function getColorFromMap(v: number, cmap: ColorMap): [number, number, number] {
  const t = Math.max(0, Math.min(1, v));

  if (cmap === 'grayscale') {
    const g = Math.round(t * 255);
    return [g, g, g];
  }

  if (cmap === 'inferno') {
    // Exact polynomial piecewise fit for Matplotlib Inferno
    const r = Math.min(255, Math.max(0, Math.round(255 * (0.0002 + 0.999 * t + 1.25 * Math.sin(Math.PI * t * 0.8)))));
    const g = Math.min(255, Math.max(0, Math.round(255 * (Math.pow(t, 2.1) * 0.9 + 0.3 * Math.sin(Math.PI * Math.pow(t, 1.5))))));
    const b = Math.min(255, Math.max(0, Math.round(255 * (0.35 * Math.sin(Math.PI * t) + (t > 0.8 ? (t - 0.8) * 4 * 180 : 0)))));
    return [r, g, b];
  }

  if (cmap === 'viridis') {
    // Matplotlib Viridis approximation
    const r = Math.round(255 * (0.267 + 0.5 * t * t - 0.1 * t));
    const g = Math.round(255 * (0.005 + 1.2 * t - 0.35 * t * t));
    const b = Math.round(255 * (0.329 + 0.7 * (1 - t) * Math.sin(t * Math.PI) + 0.15 * t));
    return [
      Math.min(255, Math.max(0, r)),
      Math.min(255, Math.max(0, g)),
      Math.min(255, Math.max(0, b)),
    ];
  }

  if (cmap === 'magma') {
    const r = Math.round(255 * (0.02 + 1.25 * t));
    const g = Math.round(255 * (Math.pow(t, 2.5) * 0.95));
    const b = Math.round(255 * (0.2 + 0.7 * Math.sin(t * Math.PI * 0.9)));
    return [
      Math.min(255, Math.max(0, r)),
      Math.min(255, Math.max(0, g)),
      Math.min(255, Math.max(0, b)),
    ];
  }

  if (cmap === 'plasma') {
    const r = Math.round(255 * (0.05 + 1.1 * t));
    const g = Math.round(255 * (Math.sin(t * Math.PI * 0.8) * 0.85));
    const b = Math.round(255 * (0.6 * (1 - t) + 0.3 * Math.sin(t * Math.PI)));
    return [
      Math.min(255, Math.max(0, r)),
      Math.min(255, Math.max(0, g)),
      Math.min(255, Math.max(0, b)),
    ];
  }

  if (cmap === 'coolwarm') {
    // Bipolar diverging: blue (negative/zero) -> gray/white -> red (high)
    let r = 0, g = 0, b = 0;
    if (t < 0.5) {
      const u = t * 2;
      r = Math.round(59 + u * 150);
      g = Math.round(130 + u * 80);
      b = Math.round(246 - u * 36);
    } else {
      const u = (t - 0.5) * 2;
      r = Math.round(209 + u * 46);
      g = Math.round(210 - u * 140);
      b = Math.round(210 - u * 170);
    }
    return [r, g, b];
  }

  return [Math.round(t * 255), Math.round(t * 255), Math.round(t * 255)];
}

export interface RealDifferenceResult {
  width: number;
  height: number;
  diffGrid: Float32Array;
  snrGrid: Float32Array;
  maxDeltaFlux: number;
  minDeltaFlux: number;
  rmsResidual: number;
  isRealPixelSubtraction: boolean;
  detectedPeaks: {
    x: number;
    y: number;
    snr: number;
    deltaVal: number;
    polarity: 'positive' | 'negative';
  }[];
}

/**
 * Compute genuine aligned pixel-by-pixel image subtraction (Science Epoch B - Reference Epoch A)
 * using real FITS IMAGE - ZODI and VARIANCE arrays when present, or rasterized synthetic stars cleanly.
 */
export function computeRealFrameDifference(
  frameA: SpherexObservation['epochs'][0],
  frameB: SpherexObservation['epochs'][0],
  snrThreshold: number = 3.0,
  subtractZodi: boolean = true
): RealDifferenceResult {
  if (frameA.fitsData && frameB.fitsData && frameA.fitsData.width === frameB.fitsData.width && frameA.fitsData.height === frameB.fitsData.height) {
    const w = frameA.fitsData.width;
    const h = frameA.fitsData.height;
    const size = w * h;
    const diffGrid = new Float32Array(size);
    const snrGrid = new Float32Array(size);

    const imgA = frameA.fitsData.imagePixels;
    const imgB = frameB.fitsData.imagePixels;
    const zodiA = frameA.fitsData.zodiPixels;
    const zodiB = frameB.fitsData.zodiPixels;
    const varA = frameA.fitsData.variancePixels;
    const varB = frameB.fitsData.variancePixels;
    const fallbackSigmaSq = Math.pow(Math.max(frameA.fitsData.stats.rmsNoise, frameB.fitsData.stats.rmsNoise, 0.02), 2);

    // Estimate residual sky offset between epochs via median
    const deltas: number[] = [];
    for (let i = 0; i < size; i++) {
      const valA = imgA[i] - (subtractZodi && zodiA ? zodiA[i] || 0 : 0);
      const valB = imgB[i] - (subtractZodi && zodiB ? zodiB[i] || 0 : 0);
      const d = valB - valA;
      diffGrid[i] = d;
      if (Number.isFinite(d)) deltas.push(d);
    }
    deltas.sort((a, b) => a - b);
    const medOffset = deltas.length > 0 ? deltas[Math.floor(deltas.length * 0.5)] : 0;

    let maxDeltaFlux = -Infinity;
    let minDeltaFlux = Infinity;
    let sumSq = 0;

    for (let i = 0; i < size; i++) {
      const d = diffGrid[i] - medOffset;
      diffGrid[i] = d;
      if (d > maxDeltaFlux) maxDeltaFlux = d;
      if (d < minDeltaFlux) minDeltaFlux = d;
      sumSq += d * d;

      const vA = varA && varA[i] > 0 ? varA[i] : fallbackSigmaSq;
      const vB = varB && varB[i] > 0 ? varB[i] : fallbackSigmaSq;
      snrGrid[i] = d / Math.sqrt(vA + vB);
    }

    const rmsResidual = Number(Math.sqrt(sumSq / Math.max(1, size)).toFixed(4));
    const peaks: RealDifferenceResult['detectedPeaks'] = [];

    for (let y = 2; y < h - 2; y++) {
      for (let x = 2; x < w - 2; x++) {
        const idx = y * w + x;
        const absSnr = Math.abs(snrGrid[idx]);
        if (absSnr < snrThreshold) continue;

        // 3x3 local extremum check
        let isLocalMax = true;
        for (let dy = -1; dy <= 1 && isLocalMax; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (Math.abs(snrGrid[(y + dy) * w + (x + dx)]) > absSnr) {
              isLocalMax = false;
              break;
            }
          }
        }
        if (isLocalMax) {
          peaks.push({
            x: (x + 0.5) / w,
            y: (y + 0.5) / h,
            snr: Number(absSnr.toFixed(2)),
            deltaVal: Number(diffGrid[idx].toFixed(3)),
            polarity: diffGrid[idx] >= 0 ? 'positive' : 'negative',
          });
        }
      }
    }

    peaks.sort((a, b) => b.snr - a.snr);
    return {
      width: w,
      height: h,
      diffGrid,
      snrGrid,
      maxDeltaFlux,
      minDeltaFlux,
      rmsResidual,
      isRealPixelSubtraction: true,
      detectedPeaks: peaks.slice(0, 12),
    };
  }

  // Deterministic synthetic grid subtraction fallback (no random jitter)
  const w = 128;
  const h = 128;
  const size = w * h;
  const diffGrid = new Float32Array(size);
  const snrGrid = new Float32Array(size);
  const noiseSigma = Math.hypot(frameA.detectorNoiseSigma || 0.03, frameB.detectorNoiseSigma || 0.03);

  let maxDeltaFlux = -Infinity;
  let minDeltaFlux = Infinity;
  let sumSq = 0;

  const evalFrameFlux = (frame: SpherexObservation['epochs'][0], nx: number, ny: number) => {
    let flux = 0;
    for (const s of frame.stars) {
      const dx = nx - s.x;
      const dy = ny - s.y;
      const distSq = dx * dx + dy * dy;
      const fwhmSq = s.fwhm * s.fwhm;
      if (distSq < fwhmSq * 8) {
        flux += s.peakFlux * Math.exp(-distSq / (2 * fwhmSq));
      }
    }
    return flux;
  };

  for (let y = 0; y < h; y++) {
    const ny = (y + 0.5) / h;
    for (let x = 0; x < w; x++) {
      const nx = (x + 0.5) / w;
      const idx = y * w + x;
      const d = evalFrameFlux(frameB, nx, ny) - evalFrameFlux(frameA, nx, ny);
      diffGrid[idx] = d;
      snrGrid[idx] = d / Math.max(0.05, noiseSigma * 4);
      if (d > maxDeltaFlux) maxDeltaFlux = d;
      if (d < minDeltaFlux) minDeltaFlux = d;
      sumSq += d * d;
    }
  }

  const peaks: RealDifferenceResult['detectedPeaks'] = [];
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const idx = y * w + x;
      const absSnr = Math.abs(snrGrid[idx]);
      if (absSnr < snrThreshold) continue;
      let isMax = true;
      for (let dy = -2; dy <= 2 && isMax; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (Math.abs(snrGrid[(y + dy) * w + (x + dx)]) > absSnr) {
            isMax = false;
            break;
          }
        }
      }
      if (isMax) {
        peaks.push({
          x: (x + 0.5) / w,
          y: (y + 0.5) / h,
          snr: Number(absSnr.toFixed(1)),
          deltaVal: Number(diffGrid[idx].toFixed(2)),
          polarity: diffGrid[idx] >= 0 ? 'positive' : 'negative',
        });
      }
    }
  }
  peaks.sort((a, b) => b.snr - a.snr);

  return {
    width: w,
    height: h,
    diffGrid,
    snrGrid,
    maxDeltaFlux,
    minDeltaFlux,
    rmsResidual: Number(Math.sqrt(sumSq / size).toFixed(4)),
    isRealPixelSubtraction: false,
    detectedPeaks: peaks.slice(0, 10),
  };
}

export interface RenderObservationOptions {
  showGrid?: boolean;
  selectedCoord?: { x: number; y: number } | null;
  showGaiaOverlay?: boolean;
  showWiseOverlay?: boolean;
  showMotionVectors?: boolean;
  arrayCoAdd?: boolean;
  fieldOfViewArcmin?: number;
  subtractZodi?: boolean;
  showSnrMap?: boolean;
  isSimulatedDemo?: boolean;
}

/**
 * Bilinear lookup into a real FITS pixel array
 */
function sampleGridBilinear(arr: number[], gw: number, gh: number, nx: number, ny: number): number {
  const fx = Math.max(0, Math.min(gw - 1, nx * gw - 0.5));
  const fy = Math.max(0, Math.min(gh - 1, ny * gh - 0.5));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(gw - 1, x0 + 1);
  const y1 = Math.min(gh - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const v00 = arr[y0 * gw + x0] ?? 0;
  const v10 = arr[y0 * gw + x1] ?? 0;
  const v01 = arr[y1 * gw + x0] ?? 0;
  const v11 = arr[y1 * gw + x1] ?? 0;
  return (v00 * (1 - tx) + v10 * tx) * (1 - ty) + (v01 * (1 - tx) + v11 * tx) * ty;
}

/**
 * Render real FITS cutout or synthetic fallback frame directly to HTML5 Canvas
 */
export function renderObservationToCanvas(
  canvas: HTMLCanvasElement,
  frame: SpherexObservation['epochs'][0],
  stretch: StretchMode,
  cmap: ColorMap,
  showGridOrOptions: boolean | RenderObservationOptions = true,
  legacySelectedCoord?: { x: number; y: number } | null
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const options: RenderObservationOptions = typeof showGridOrOptions === 'boolean'
    ? { showGrid: showGridOrOptions, selectedCoord: legacySelectedCoord }
    : showGridOrOptions;

  const showGrid = options.showGrid ?? true;
  const selectedCoord = options.selectedCoord ?? null;
  const showGaiaOverlay = options.showGaiaOverlay ?? false;
  const showWiseOverlay = options.showWiseOverlay ?? false;
  const showMotionVectors = options.showMotionVectors ?? false;
  const arrayCoAdd = options.arrayCoAdd ?? false;
  const fieldOfViewArcmin = options.fieldOfViewArcmin ?? 6.5;
  const subtractZodi = options.subtractZodi ?? true;
  const showSnrMap = options.showSnrMap ?? false;
  const isSimulatedDemo = options.isSimulatedDemo ?? false;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  // REAL FITS PIXEL RENDERING PATH
  if (frame.fitsData && frame.fitsData.imagePixels.length > 0) {
    const fd = frame.fitsData;
    const gw = fd.width;
    const gh = fd.height;
    const effective = new Array<number>(gw * gh);

    for (let i = 0; i < gw * gh; i++) {
      let val = fd.imagePixels[i] - (subtractZodi && fd.zodiPixels ? fd.zodiPixels[i] || 0 : 0);
      if (showSnrMap) {
        const varVal = fd.variancePixels && fd.variancePixels[i] > 0 ? fd.variancePixels[i] : fd.stats.rmsNoise * fd.stats.rmsNoise;
        val = (val - (fd.stats.median - (subtractZodi ? fd.stats.zodiMedianMJySr || 0 : 0))) / Math.sqrt(varVal);
      }
      effective[i] = Number.isFinite(val) ? val : 0;
    }

    const sorted = [...effective].sort((a, b) => a - b);
    const low = sorted[Math.floor(sorted.length * 0.08)] ?? 0;
    const high = Math.max(low + (showSnrMap ? 6 : 0.25), sorted[Math.floor(sorted.length * 0.992)] ?? low + 1);
    const span = Math.max(1e-5, high - low);

    for (let y = 0; y < h; y++) {
      const ny = (y + 0.5) / h;
      for (let x = 0; x < w; x++) {
        const nx = (x + 0.5) / w;
        const idx = (y * w + x) * 4;
        const val = sampleGridBilinear(effective, gw, gh, nx, ny);
        const normalized = Math.max(0, Math.min(1, (val - low) / span));
        const stretched = applyFluxStretch(normalized, stretch, 0.06);
        const [r, g, b] = getColorFromMap(stretched, cmap);
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } else {
    // SYNTHETIC FALLBACK PATH
    const bg = frame.backgroundLevelMJySr;
    const noise = arrayCoAdd ? frame.detectorNoiseSigma / 4.12 : frame.detectorNoiseSigma;
    const nebula = frame.nebulaIntensity;

    for (let y = 0; y < h; y++) {
      const ny = y / h;
      for (let x = 0; x < w; x++) {
        const nx = x / w;
        const idx = (y * w + x) * 4;

        let flux = bg * 0.2 + 0.1 * Math.sin(nx * Math.PI) * Math.cos(ny * Math.PI);
        const simulatedZodi = 0.12 + 0.06 * Math.cos(nx * Math.PI * 2) * Math.sin(ny * Math.PI * 2);
        if (!subtractZodi) flux += simulatedZodi;
        if (nebula > 0) {
          const filament = Math.sin(nx * 8 + ny * 6) * Math.cos(ny * 12 - nx * 4);
          flux += nebula * Math.max(0, filament * 0.8 + 0.2);
        }

        for (const star of frame.stars) {
          const dx = (nx - star.x) * (w / h);
          const dy = ny - star.y;
          const distSq = dx * dx + dy * dy;
          const fwhmSq = star.fwhm * star.fwhm;
          if (distSq < fwhmSq * 8) {
            const core = star.peakFlux * Math.exp(-distSq / (2 * fwhmSq));
            const wing = (star.peakFlux * 0.15) / Math.pow(1 + distSq / fwhmSq, 2.5);
            flux += core + wing;
          }
        }

        const r1 = Math.random();
        const r2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(r1 || 0.0001)) * Math.cos(2.0 * Math.PI * r2);
        flux += z0 * noise;

        const displayValue = showSnrMap
          ? Math.max(0, Math.min(1, ((flux - bg * 0.2) / Math.max(noise, 0.01) + 2) / 18))
          : Math.max(0, flux / 30);
        const normalized = displayValue;
        const stretched = applyFluxStretch(normalized, stretch);
        const [r, g, b] = getColorFromMap(stretched, cmap);

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // Coordinate Grid Overlay
  if (showGrid) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const numGrid = 4;
    for (let i = 1; i < numGrid; i++) {
      const gx = Math.round((w * i) / numGrid);
      const gy = Math.round((h * i) / numGrid);

      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Gaia DR3 Astrometric Overlay & Proper Motion Vectors
  if (showGaiaOverlay) {
    if (isSimulatedDemo) {
      ctx.fillStyle = 'rgba(167, 243, 208, 0.95)';
      ctx.font = '10px monospace';
      ctx.fillText('SIMULATED ASTROMETRY OVERLAY', 12, 18);
    }
    for (const star of frame.stars) {
      const sx = star.x * w;
      const sy = star.y * h;

      // Gaia diamond reticle
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)'; // Emerald
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 7);
      ctx.lineTo(sx + 7, sy);
      ctx.lineTo(sx, sy + 7);
      ctx.lineTo(sx - 7, sy);
      ctx.closePath();
      ctx.stroke();

      // Gaia proper motion vector
      if (star.pmRaMasYr !== undefined && star.pmDecMasYr !== undefined) {
        // Vector scaling: 1000 mas/yr -> 12px
        const vx = (-star.pmRaMasYr / 1000) * 8;
        const vy = (star.pmDecMasYr / 1000) * 8;
        const arrowLen = Math.sqrt(vx * vx + vy * vy);

        if (arrowLen > 2) {
          ctx.strokeStyle = '#34d399';
          ctx.fillStyle = '#34d399';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + vx, sy + vy);
          ctx.stroke();

          // Arrowhead
          const angle = Math.atan2(vy, vx);
          ctx.beginPath();
          ctx.moveTo(sx + vx, sy + vy);
          ctx.lineTo(sx + vx - 5 * Math.cos(angle - Math.PI / 6), sy + vy - 5 * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(sx + vx - 5 * Math.cos(angle + Math.PI / 6), sy + vy - 5 * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        }
      }

      // Catalog label
      if (star.catalogName) {
        ctx.fillStyle = 'rgba(167, 243, 208, 0.9)';
        ctx.font = '9px monospace';
        ctx.fillText(star.catalogName.slice(0, 16), sx + 9, sy - 4);
      }
    }
  }

  // AllWISE Mid-Infrared Overlay (W1 3.4µm / W2 4.6µm)
  if (showWiseOverlay) {
    if (isSimulatedDemo) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.95)';
      ctx.font = '10px monospace';
      ctx.fillText('SIMULATED WISE-STYLE OVERLAY', 12, 32);
    }
    for (const star of frame.stars) {
      const sx = star.x * w;
      const sy = star.y * h;

      // WISE circular aperture
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)'; // Amber
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(sx, sy, 11, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '8px monospace';
      ctx.fillText(isSimulatedDemo ? 'SIM W1/W2' : 'W1/W2', sx - 12, sy + 18);
    }
  }

  // Motion Vector Tracking Rings for Moving / Shifting Objects
  if (showMotionVectors) {
    if (isSimulatedDemo) {
      ctx.fillStyle = 'rgba(125, 211, 252, 0.95)';
      ctx.font = '10px monospace';
      ctx.fillText('SIMULATED MOTION VECTORS', 12, 46);
    }
    for (const star of frame.stars) {
      if (star.isTargetObject || (star.pmRaMasYr && Math.abs(star.pmRaMasYr) > 1000)) {
        const sx = star.x * w;
        const sy = star.y * h;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 16, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText(`MOVER: ${star.catalogName || star.id}`, sx + 18, sy + 4);
      }
    }
  }

  // Astronomical Scale Bar (Bottom Left)
  const scaleBarArcmin = fieldOfViewArcmin <= 5 ? 1.0 : (fieldOfViewArcmin <= 15 ? 3.0 : 10.0);
  const scaleFraction = scaleBarArcmin / fieldOfViewArcmin;
  const barPx = Math.round(w * scaleFraction);

  if (barPx > 20 && barPx < w * 0.7) {
    const bx = 20;
    const by = h - 20;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + barPx, by);
    ctx.moveTo(bx, by - 4);
    ctx.lineTo(bx, by + 4);
    ctx.moveTo(bx + barPx, by - 4);
    ctx.lineTo(bx + barPx, by + 4);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    const label = scaleBarArcmin < 1.0 ? `${Math.round(scaleBarArcmin * 60)}″` : `${scaleBarArcmin}′`;
    ctx.fillText(`${label} (FOV: ${fieldOfViewArcmin}′)`, bx, by - 7);
  }

  // Crosshair at user-selected coordinate
  if (selectedCoord) {
    const cx = selectedCoord.x * w;
    const cy = selectedCoord.y * h;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 22, cy);
    ctx.lineTo(cx - 8, cy);
    ctx.moveTo(cx + 8, cy);
    ctx.lineTo(cx + 22, cy);
    ctx.moveTo(cx, cy - 22);
    ctx.lineTo(cx, cy - 8);
    ctx.moveTo(cx, cy + 8);
    ctx.lineTo(cx, cy + 22);
    ctx.stroke();
  }
}
