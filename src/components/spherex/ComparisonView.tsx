/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BLACK STAR ORBIT — Side-by-Side Astronomical Comparison Viewer
 */

import React, { useRef, useEffect, useState } from 'react';
import { ObservationFrame, StretchMode, ColorMap } from '../../types/index.ts';
import { renderObservationToCanvas } from '../../science/spherexEngine.ts';
import { SlidersHorizontal, SplitSquareVertical, Download } from 'lucide-react';

interface ComparisonViewProps {
  epochs?: ObservationFrame[];
  frameA: ObservationFrame;
  frameB: ObservationFrame;
  stretch: StretchMode;
  cmap: ColorMap;
  subtractZodi?: boolean;
  labelA?: string;
  labelB?: string;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  epochs,
  frameA,
  frameB,
  stretch,
  cmap,
  subtractZodi = true,
}) => {
  const availableEpochs = epochs && epochs.length > 0 ? epochs : [frameA, frameB];
  const [idxA, setIdxA] = useState<number>(0);
  const [idxB, setIdxB] = useState<number>(Math.max(0, availableEpochs.length - 1));

  useEffect(() => {
    setIdxA(0);
    setIdxB(Math.max(0, availableEpochs.length - 1));
  }, [availableEpochs.length, frameA.frameId]);

  const effectiveA = availableEpochs[Math.min(idxA, availableEpochs.length - 1)] || frameA;
  const effectiveB = availableEpochs[Math.min(idxB, availableEpochs.length - 1)] || frameB;

  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'curtain'>('side-by-side');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    if (canvasARef.current && effectiveA) {
      renderObservationToCanvas(canvasARef.current, effectiveA, stretch, cmap, {
        showGrid: true,
        subtractZodi,
      });
    }
    if (canvasBRef.current && effectiveB) {
      renderObservationToCanvas(canvasBRef.current, effectiveB, stretch, cmap, {
        showGrid: true,
        subtractZodi,
      });
    }
  }, [effectiveA, effectiveB, stretch, cmap, subtractZodi, viewMode]);

  const handleDownloadComparison = async () => {
    const cA = canvasARef.current;
    const cB = canvasBRef.current;
    if (!cA || !cB) return;

    setIsExporting(true);
    try {
      const exportCanvas = document.createElement('canvas');
      const bannerH = 64;
      exportCanvas.width = cA.width + cB.width + 20;
      exportCanvas.height = Math.max(cA.height, cB.height) + bannerH;

      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText('SPHEREx MULTI-EPOCH ASTRONOMICAL COMPARISON', 16, 28);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(
        `EPOCH A: ${effectiveA.frameId} (${effectiveA.timestamp}) vs EPOCH B: ${effectiveB.frameId} (${effectiveB.timestamp})`,
        16,
        48
      );

      ctx.drawImage(cA, 0, bannerH);
      ctx.drawImage(cB, cA.width + 20, bannerH);

      exportCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SPHEREx_Comparison_${effectiveA.frameId}_vs_${effectiveB.frameId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }, 'image/png');
    } catch (err) {
      console.error('Comparison export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const formatEpochLabel = (f: ObservationFrame, i: number) =>
    `${f.surveyCycleName || `Epoch ${i + 1}`} • ${f.timestamp.split('T')[0]}${f.detectorBand ? ` (${f.detectorBand} ${f.bandWavelengthMicrons.toFixed(2)}µm)` : ''}`;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <SplitSquareVertical className="h-4 w-4 text-cyan-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Side-by-Side Astronomical Comparison (WCS North-Up Aligned)
          </h4>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-2.5 py-1 rounded transition ${
              viewMode === 'side-by-side'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Dual View
          </button>
          <button
            onClick={() => setViewMode('curtain')}
            className={`px-2.5 py-1 rounded transition ${
              viewMode === 'curtain'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Curtain Split
          </button>

          <button
            onClick={handleDownloadComparison}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 font-mono transition ml-1 disabled:opacity-50"
            title="Download Side-by-Side View as PNG"
          >
            {isExporting ? (
              <div className="h-3 w-3 border-2 border-cyan-300/30 border-t-cyan-300 rounded-full animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Download View</span>
          </button>
        </div>
      </div>

      {/* Epoch Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 bg-slate-900/70 p-2 rounded-lg border border-slate-800">
          <span className="text-cyan-400 font-bold shrink-0">Epoch A:</span>
          <select
            value={idxA}
            onChange={(e) => setIdxA(Number(e.target.value))}
            aria-label="Select Comparison Epoch A"
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 truncate"
          >
            {availableEpochs.map((ep, i) => (
              <option key={ep.frameId + i} value={i}>
                {formatEpochLabel(ep, i)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/70 p-2 rounded-lg border border-slate-800">
          <span className="text-indigo-400 font-bold shrink-0">Epoch B:</span>
          <select
            value={idxB}
            onChange={(e) => setIdxB(Number(e.target.value))}
            aria-label="Select Comparison Epoch B"
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 truncate"
          >
            {availableEpochs.map((ep, i) => (
              <option key={ep.frameId + i} value={i}>
                {formatEpochLabel(ep, i)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {viewMode === 'side-by-side' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono text-cyan-300 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
              <span className="font-semibold truncate">{effectiveA.surveyCycleName || 'Epoch A'}</span>
              <span className="text-slate-400 shrink-0">{effectiveA.timestamp.split('T')[0]}</span>
            </div>
            <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-800 bg-black">
              <canvas ref={canvasARef} width={400} height={400} className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono text-indigo-300 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
              <span className="font-semibold truncate">{effectiveB.surveyCycleName || 'Epoch B'}</span>
              <span className="text-slate-400 shrink-0">{effectiveB.timestamp.split('T')[0]}</span>
            </div>
            <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-800 bg-black">
              <canvas ref={canvasBRef} width={400} height={400} className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative aspect-square max-w-xl mx-auto rounded-lg overflow-hidden border border-slate-800 bg-black">
            <canvas ref={canvasBRef} width={500} height={500} className="absolute inset-0 w-full h-full object-contain" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${splitPercent}%` }}>
              <canvas
                ref={canvasARef}
                width={500}
                height={500}
                className="w-full h-full object-contain"
                style={{ width: `${(100 / Math.max(1, splitPercent)) * 100}%`, maxWidth: 'none' }}
              />
            </div>
            <div className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-lg pointer-events-none" style={{ left: `${splitPercent}%` }}>
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-cyan-500 text-black p-1 rounded-full shadow-md">
                <SlidersHorizontal className="h-3 w-3" />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono text-slate-400 max-w-xl mx-auto px-2">
            <span className="truncate max-w-[160px]">{effectiveA.timestamp.split('T')[0]}</span>
            <input
              type="range"
              min={1}
              max={99}
              value={splitPercent}
              onChange={(e) => setSplitPercent(Number(e.target.value))}
              aria-label="Interactive comparison slider split position"
              className="flex-1 accent-cyan-400 cursor-pointer"
            />
            <span className="truncate max-w-[160px]">{effectiveB.timestamp.split('T')[0]}</span>
          </div>
        </div>
      )}
    </div>
  );
};
