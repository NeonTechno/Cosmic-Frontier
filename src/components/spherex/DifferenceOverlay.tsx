/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BLACK STAR ORBIT — Calibrated Difference Imaging & Residual Extraction
 * Performs pixel-by-pixel WCS-aligned subtraction (Epoch B - Epoch A) with
 * variance-propagated SNR maps and explicit methodological caveats.
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ObservationFrame, TransientCandidate, StretchMode } from '../../types/index.ts';
import {
  applyFluxStretch,
  getColorFromMap,
  computeRealFrameDifference,
} from '../../science/spherexEngine.ts';
import {
  AlertCircle,
  Crosshair,
  Sparkles,
  Sliders,
  ShieldCheck,
  Download,
  Flag,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { exportGenericCanvasPNG } from '../../science/spherexExport.ts';

interface DifferenceOverlayProps {
  epochs?: ObservationFrame[];
  referenceFrame: ObservationFrame;
  scienceFrame: ObservationFrame;
  targetName?: string;
  raDeg?: number;
  decDeg?: number;
  fieldOfViewArcmin?: number;
  stretch: StretchMode;
  subtractZodi?: boolean;
  panesFrozen?: boolean;
  onExplainTransient: (transient: TransientCandidate) => void;
  onPromoteCandidate?: (payload: {
    designation: string;
    raDeg: number;
    decDeg: number;
    deltaFluxMJySr: number;
    snr: number;
    epochA: string;
    epochB: string;
    notes: string;
  }) => Promise<void>;
}

export const DifferenceOverlay: React.FC<DifferenceOverlayProps> = ({
  epochs,
  referenceFrame,
  scienceFrame,
  targetName = 'SPHEREx Field',
  raDeg = 0,
  decDeg = 0,
  fieldOfViewArcmin = 6.5,
  stretch,
  subtractZodi: initialSubtractZodi = true,
  panesFrozen = true,
  onExplainTransient,
  onPromoteCandidate,
}) => {
  const availableEpochs = epochs && epochs.length > 0 ? epochs : [referenceFrame, scienceFrame];
  const [epochAIdx, setEpochAIdx] = useState<number>(0);
  const [epochBIdx, setEpochBIdx] = useState<number>(Math.max(0, availableEpochs.length - 1));
  const [subtractZodi, setSubtractZodi] = useState<boolean>(initialSubtractZodi);
  const [snrThreshold, setSnrThreshold] = useState<number>(4.0);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [promotedIds, setPromotedIds] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    setEpochAIdx(0);
    setEpochBIdx(Math.max(0, availableEpochs.length - 1));
  }, [availableEpochs.length, referenceFrame.frameId]);

  const frameA = availableEpochs[Math.min(epochAIdx, availableEpochs.length - 1)] || referenceFrame;
  const frameB = availableEpochs[Math.min(epochBIdx, availableEpochs.length - 1)] || scienceFrame;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute genuine variance-propagated pixel subtraction
  const diffResult = useMemo(() => {
    return computeRealFrameDifference(frameA, frameB, snrThreshold, subtractZodi);
  }, [frameA, frameB, snrThreshold, subtractZodi]);

  // Convert local pixel peaks to TransientCandidate descriptors for display/inspection
  const extractedResiduals = useMemo<TransientCandidate[]>(() => {
    const fovDeg = fieldOfViewArcmin / 60;
    const cosDec = Math.max(0.1, Math.cos((decDeg * Math.PI) / 180));

    return diffResult.detectedPeaks.map((pk, idx) => {
      const peakRa = raDeg - ((pk.x - 0.5) * fovDeg) / cosDec;
      const peakDec = decDeg - (pk.y - 0.5) * fovDeg;
      return {
        id: `RES-${idx + 1}-${pk.polarity === 'positive' ? 'POS' : 'NEG'}`,
        x: pk.x,
        y: pk.y,
        raDeg: Number(peakRa.toFixed(5)),
        decDeg: Number(peakDec.toFixed(5)),
        deltaFluxMJySr: pk.deltaVal,
        snr: pk.snr,
        candidateType:
          pk.polarity === 'positive' ? 'Infrared Variable Protostar' : 'High Proper Motion Candidate',
        detectionEpoch: frameB.timestamp,
        referenceEpoch: frameA.timestamp,
        significanceSigma: pk.snr,
        isVerified: false,
      };
    });
  }, [diffResult, fieldOfViewArcmin, raDeg, decDeg, frameA.timestamp, frameB.timestamp]);

  // Render difference grid to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    const gw = diffResult.width;
    const gh = diffResult.height;
    const scaleAmp = Math.max(
      1.0,
      Math.min(25.0, Math.max(Math.abs(diffResult.maxDeltaFlux), Math.abs(diffResult.minDeltaFlux)) * 0.65)
    );

    for (let y = 0; y < h; y++) {
      const fy = Math.max(0, Math.min(gh - 1, ((y + 0.5) / h) * gh - 0.5));
      const y0 = Math.floor(fy);
      const y1 = Math.min(gh - 1, y0 + 1);
      const ty = fy - y0;

      for (let x = 0; x < w; x++) {
        const fx = Math.max(0, Math.min(gw - 1, ((x + 0.5) / w) * gw - 0.5));
        const x0 = Math.floor(fx);
        const x1 = Math.min(gw - 1, x0 + 1);
        const tx = fx - x0;

        const v00 = diffResult.diffGrid[y0 * gw + x0] ?? 0;
        const v10 = diffResult.diffGrid[y0 * gw + x1] ?? 0;
        const v01 = diffResult.diffGrid[y1 * gw + x0] ?? 0;
        const v11 = diffResult.diffGrid[y1 * gw + x1] ?? 0;
        const deltaFlux = (v00 * (1 - tx) + v10 * tx) * (1 - ty) + (v01 * (1 - tx) + v11 * tx) * ty;

        const normalized = Math.max(0, Math.min(1, 0.5 + deltaFlux / (2 * scaleAmp)));
        const stretched = stretch === 'linear' ? normalized : 0.5 + (normalized - 0.5) * (0.7 + 0.3 * applyFluxStretch(Math.abs(normalized - 0.5) * 2, stretch));
        const [r, g, b] = getColorFromMap(Math.max(0, Math.min(1, stretched)), 'coolwarm');

        const idx = (y * w + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Overlay extracted peaks
    for (const tr of extractedResiduals.slice(0, 8)) {
      const cx = tr.x * w;
      const cy = tr.y * h;
      ctx.strokeStyle = tr.deltaFluxMJySr >= 0 ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`${tr.id} (${tr.snr}σ)`, Math.min(w - 95, cx + 16), Math.max(12, cy - 6));
    }
  }, [diffResult, extractedResiduals, stretch]);

  const handleDownloadDifferenceView = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      await exportGenericCanvasPNG(
        canvasRef.current,
        `SPHEREx_Difference_Residual_${frameB.frameId}_vs_${frameA.frameId}.png`,
        `Difference Subtraction (${snrThreshold.toFixed(1)}σ)`
      );
    } catch (err) {
      console.error('Difference view export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePromote = async (tr: TransientCandidate) => {
    if (!onPromoteCandidate) return;
    setPromotingId(tr.id);
    try {
      await onPromoteCandidate({
        designation: `${targetName} ${tr.id}`,
        raDeg: tr.raDeg,
        decDeg: tr.decDeg,
        deltaFluxMJySr: tr.deltaFluxMJySr,
        snr: tr.snr,
        epochA: frameA.timestamp,
        epochB: frameB.timestamp,
        notes: `Flagged from ${diffResult.isRealPixelSubtraction ? 'WCS-aligned IRSA FITS' : 'synthetic'} subtraction (${frameB.timestamp.split('T')[0]} minus ${frameA.timestamp.split('T')[0]}). Observed residual signal only — not a confirmed discovery.`,
      });
      setPromotedIds((prev) => ({ ...prev, [tr.id]: true }));
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-amber-400" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                WCS-Aligned Difference Imaging & Residual Extraction
              </h4>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  diffResult.isRealPixelSubtraction
                    ? 'bg-emerald-950/70 border-emerald-600/50 text-emerald-300'
                    : 'bg-amber-950/70 border-amber-700/50 text-amber-300'
                }`}
              >
                {diffResult.isRealPixelSubtraction ? 'REAL FITS VARIANCE-WEIGHTED' : 'SYNTHETIC FALLBACK'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Residual = Epoch B ({frameB.timestamp.split('T')[0]}) − Epoch A ({frameA.timestamp.split('T')[0]}) • RMS ={' '}
              {diffResult.rmsResidual.toFixed(3)} MJy/sr
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubtractZodi((v) => !v)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
              subtractZodi
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {subtractZodi ? 'Zodi Subtracted' : 'Raw + Zodi'}
          </button>

          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-400">Threshold:</span>
            <span className="text-amber-400 font-bold">{snrThreshold.toFixed(1)}σ</span>
            <input
              type="range"
              min={2.5}
              max={15.0}
              step={0.5}
              value={snrThreshold}
              onChange={(e) => setSnrThreshold(Number(e.target.value))}
              aria-label="Residual detection SNR threshold"
              className="w-24 accent-amber-400 cursor-pointer"
            />
          </div>

          <button
            onClick={handleDownloadDifferenceView}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 text-xs font-mono font-semibold transition disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Epoch Pair Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 bg-slate-900/70 p-2 rounded-lg border border-slate-800">
          <span className="text-blue-400 font-bold shrink-0">Reference (A):</span>
          <select
            value={epochAIdx}
            onChange={(e) => setEpochAIdx(Number(e.target.value))}
            aria-label="Select difference reference epoch A"
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 truncate"
          >
            {availableEpochs.map((ep, i) => (
              <option key={ep.frameId + i} value={i}>
                {ep.surveyCycleName || `Epoch ${i + 1}`} • {ep.timestamp.split('T')[0]} ({ep.detectorBand || 'LVF'})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/70 p-2 rounded-lg border border-slate-800">
          <span className="text-red-400 font-bold shrink-0">Science (B):</span>
          <select
            value={epochBIdx}
            onChange={(e) => setEpochBIdx(Number(e.target.value))}
            aria-label="Select difference science epoch B"
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 truncate"
          >
            {availableEpochs.map((ep, i) => (
              <option key={ep.frameId + i} value={i}>
                {ep.surveyCycleName || `Epoch ${i + 1}`} • {ep.timestamp.split('T')[0]} ({ep.detectorBand || 'LVF'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scientific Limitations Callout */}
      <div className="bg-amber-950/25 border border-amber-800/40 rounded-lg px-3 py-2 text-[11px] font-sans text-amber-200/85 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong>Methodological Caveat:</strong> SPHEREx passes often sample different LVF wavelengths (D1–D6) and spacecraft roll angles across epochs. Difference dipole pairs (+ΔF / −ΔF) can reflect genuine proper motion OR PSF/chromatic residuals from 6.15″/px undersampling. Always verify residuals against blink frames & Gaia DR3 vectors before candidate triage.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Difference Canvas */}
        <div className={`lg:col-span-7 flex flex-col items-center ${panesFrozen ? 'lg:sticky lg:top-[152px] self-start' : ''}`}>
          <div className="relative aspect-square w-full max-w-md rounded-lg overflow-hidden border border-slate-800 bg-black shadow-inner">
            <canvas ref={canvasRef} width={450} height={450} className="w-full h-full object-contain" />
            <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-mono flex items-center justify-between text-slate-300 border border-slate-800">
              <span className="text-blue-400">−ΔF (Moved From / Dimmed)</span>
              <span className="text-slate-400">0</span>
              <span className="text-red-400">+ΔF (Moved To / Brightened)</span>
            </div>
          </div>
        </div>

        {/* Extracted Residual Peaks Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
              <Crosshair className="h-3.5 w-3.5 text-amber-400" />
              <span>Variance-Weighted Peaks ({extractedResiduals.length})</span>
            </span>
          </div>

          {extractedResiduals.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-lg p-6 text-center space-y-2">
              <ShieldCheck className="h-8 w-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400 font-mono">
                No pixel residuals above {snrThreshold.toFixed(1)}σ between selected epochs.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pane-scroll pr-1">
              {extractedResiduals.map((tr) => {
                const isPromoted = promotedIds[tr.id];
                const isBusy = promotingId === tr.id;
                return (
                  <div
                    key={tr.id}
                    className="p-3 rounded-lg border bg-slate-900/80 border-slate-800 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono font-bold text-amber-300">{tr.id}</span>
                      <span className="font-mono text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                        SNR {tr.snr}σ
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
                      <div>
                        Δ Flux: {tr.deltaFluxMJySr >= 0 ? '+' : ''}
                        {tr.deltaFluxMJySr} MJy/sr
                      </div>
                      <div>RA: {tr.raDeg.toFixed(4)}°</div>
                      <div>Dec: {tr.decDeg.toFixed(4)}°</div>
                      <div>Polarity: {tr.deltaFluxMJySr >= 0 ? 'Positive (+)' : 'Negative (−)'}</div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      {onPromoteCandidate && (
                        <button
                          disabled={isBusy || isPromoted}
                          onClick={() => handlePromote(tr)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded text-[11px] font-mono border transition cursor-pointer ${
                            isPromoted
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                              : 'bg-indigo-950 text-indigo-300 border-indigo-700/60 hover:bg-indigo-900/60'
                          }`}
                        >
                          {isPromoted ? <Check className="h-3 w-3" /> : <Flag className="h-3 w-3" />}
                          <span>{isPromoted ? 'Queued in Candidate Workbench' : 'Flag for Vetting'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => onExplainTransient(tr)}
                        className="flex items-center space-x-1 px-2 py-1 rounded text-[11px] bg-cyan-950 text-cyan-300 border border-cyan-700/60 hover:bg-cyan-900/60 transition cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3 text-cyan-400" />
                        <span>Analyze Signal</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
