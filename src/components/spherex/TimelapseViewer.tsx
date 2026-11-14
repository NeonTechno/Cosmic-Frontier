/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BLACK STAR ORBIT — Multi-Epoch Time-lapse & Blink Comparator Interface
 * NASA Space Apps Challenge 2026: Planet X and SPHEREx
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  ObservationFrame,
  StretchMode,
  ColorMap,
  AllWiseCutoutRecord,
} from '../../types/index.ts';
import { renderObservationToCanvas } from '../../science/spherexEngine.ts';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Film,
  Eye,
  Download,
  SkipBack,
  SkipForward,
  Repeat,
  Layers,
  Crosshair,
} from 'lucide-react';
import { exportGenericCanvasPNG } from '../../science/spherexExport.ts';

interface TimelapseViewerProps {
  epochs: ObservationFrame[];
  allWiseCutouts?: AllWiseCutoutRecord[];
  stretch: StretchMode;
  cmap: ColorMap;
  subtractZodi?: boolean;
  targetName?: string;
  targetCategory?: string;
  properMotionInfo?: {
    name: string;
    pmRaMasYr: number;
    pmDecMasYr: number;
    totalPmArcsecYr: number;
    parallaxMas: number;
    spectralType: string;
  };
  variabilityInfo?: {
    name: string;
    periodDays: number;
    amplitudeMag: number;
    classification: string;
  };
  fieldOfViewArcmin?: number;
  onExplainWithAi?: (contextType: string, payload: Record<string, unknown>) => void;
  isLight?: boolean;
}

export const TimelapseViewer: React.FC<TimelapseViewerProps> = ({
  epochs,
  allWiseCutouts = [],
  stretch,
  cmap,
  subtractZodi = true,
  targetName = 'Target Field',
  properMotionInfo,
  variabilityInfo,
  fieldOfViewArcmin = 6.0,
  isLight = false,
}) => {
  const [includeAllWise, setIncludeAllWise] = useState<boolean>(true);

  // Build chronological timeline: optional AllWISE 2010 baseline cutout + SPHEREx epochs
  const timelineFrames = useMemo<ObservationFrame[]>(() => {
    const wiseFrames: ObservationFrame[] = [];
    if (includeAllWise && allWiseCutouts.length > 0) {
      // Prefer W2 (4.6 um) or W1 (3.35 um) whichever has parsed FITS pixels
      const chosen = allWiseCutouts.find((w) => w.band === 'W2' && w.fitsData) || allWiseCutouts.find((w) => w.fitsData);
      if (chosen?.fitsData) {
        wiseFrames.push({
          frameId: `ALLWISE-${chosen.band}-${chosen.coaddId}`,
          timestamp: '2010-06-15T00:00:00Z',
          epochIndex: -1,
          bandWavelengthMicrons: chosen.wavelengthMicrons,
          exposureTimeSec: 88,
          backgroundLevelMJySr: chosen.fitsData.stats.median,
          stars: epochs[0]?.stars || [],
          transients: [],
          nebulaIntensity: 0,
          detectorNoiseSigma: chosen.fitsData.stats.rmsNoise,
          surveyCycleName: `AllWISE ${chosen.band} Baseline (2010)`,
          obsId: chosen.coaddId,
          obsCollection: 'wise_allwise_p3am_cdd',
          mjdObs: chosen.mjdObs,
          detectorBand: `WISE-${chosen.band}`,
          isRealArchive: true,
          fitsData: chosen.fitsData,
        });
      }
    }
    return [...wiseFrames, ...epochs];
  }, [epochs, allWiseCutouts, includeAllWise]);

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(1.5);
  const [isBlinkMode, setIsBlinkMode] = useState<boolean>(false);
  const [blinkEpochA, setBlinkEpochA] = useState<number>(0);
  const [blinkEpochB, setBlinkEpochB] = useState<number>(Math.max(0, timelineFrames.length - 1));
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  const [showGaia, setShowGaia] = useState<boolean>(true);
  const [showWise, setShowWise] = useState<boolean>(false);
  const [showMotionVectors, setShowMotionVectors] = useState<boolean>(true);
  const [arrayCoAdd, setArrayCoAdd] = useState<boolean>(false);

  // Clamp indices whenever timelineFrames changes
  useEffect(() => {
    setCurrentIdx((prev) => Math.min(prev, Math.max(0, timelineFrames.length - 1)));
    setBlinkEpochA(0);
    setBlinkEpochB(Math.max(0, timelineFrames.length - 1));
  }, [timelineFrames.length, targetName]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeFrame = isBlinkMode
    ? (currentIdx % 2 === 0
        ? timelineFrames[Math.min(blinkEpochA, timelineFrames.length - 1)]
        : timelineFrames[Math.min(blinkEpochB, timelineFrames.length - 1)])
    : timelineFrames[Math.min(currentIdx, timelineFrames.length - 1)] || timelineFrames[0];

  const renderActive = useCallback(() => {
    if (canvasRef.current && activeFrame) {
      renderObservationToCanvas(canvasRef.current, activeFrame, stretch, cmap, {
        showGrid: true,
        showGaiaOverlay: showGaia,
        showWiseOverlay: showWise,
        showMotionVectors: showMotionVectors,
        arrayCoAdd: arrayCoAdd,
        fieldOfViewArcmin: fieldOfViewArcmin,
        subtractZodi,
      });
    }
  }, [activeFrame, stretch, cmap, showGaia, showWise, showMotionVectors, arrayCoAdd, fieldOfViewArcmin, subtractZodi]);

  useEffect(() => {
    renderActive();
  }, [renderActive]);

  useEffect(() => {
    if (!isPlaying || timelineFrames.length <= 1) return;
    const intervalMs = 1000 / fps;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => {
        if (isBlinkMode) {
          return prev === 0 ? 1 : 0;
        }
        if (prev + 1 >= timelineFrames.length) {
          return isLooping ? 0 : prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, fps, isBlinkMode, timelineFrames.length, isLooping]);

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentIdx((prev) => (prev > 0 ? prev - 1 : Math.max(0, timelineFrames.length - 1)));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentIdx((prev) => (prev + 1) % Math.max(1, timelineFrames.length));
  };

  const handleDownloadTimelapseFrame = async () => {
    if (!canvasRef.current || !activeFrame) return;
    setIsExporting(true);
    try {
      await exportGenericCanvasPNG(
        canvasRef.current,
        `SPHEREx_Timelapse_${targetName.replace(/\s+/g, '_')}_${activeFrame.frameId}.png`,
        `SPHEREx Time Machine Frame: ${targetName} (${activeFrame.surveyCycleName || activeFrame.timestamp})`
      );
    } catch (err) {
      console.error('Timelapse frame export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const hasAllWiseBaseline = allWiseCutouts.some((w) => !!w.fitsData);

  return (
    <div
      className={`border rounded-xl p-4 space-y-4 ${
        isLight ? 'bg-white border-[#1a1a1a]/15 shadow-xs' : 'bg-slate-950 border-slate-800'
      }`}
    >
      {/* Title & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <Film className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Infrared Sky Time Machine — Chronological Sequence & Blink Comparator
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              WCS North-Up aligned {timelineFrames.length}-epoch stack ({activeFrame?.isRealArchive ? 'Live IRSA / AllWISE FITS' : 'Simulated Fallback'})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono flex-wrap">
          {hasAllWiseBaseline && (
            <button
              onClick={() => setIncludeAllWise((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg transition border cursor-pointer ${
                includeAllWise
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-transparent'
              }`}
              title="Include 2010 AllWISE W2 baseline image as Epoch 0 for 15-year proper motion blinking"
            >
              + 2010 AllWISE
            </button>
          )}

          <button
            onClick={() => {
              setIsBlinkMode(false);
              setIsPlaying(false);
            }}
            className={`px-3 py-1.5 rounded-lg transition border cursor-pointer ${
              !isBlinkMode
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            Video Sequence
          </button>

          <button
            onClick={() => {
              setIsBlinkMode(true);
              setIsPlaying(true);
            }}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 border cursor-pointer ${
              isBlinkMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Blink Comparator</span>
          </button>

          <button
            onClick={handleDownloadTimelapseFrame}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 transition disabled:opacity-50 cursor-pointer"
            title="Download Active Frame as High-Resolution PNG"
          >
            {isExporting ? (
              <div className="h-3.5 w-3.5 border-2 border-cyan-300/30 border-t-cyan-300 rounded-full animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Export Frame</span>
          </button>
        </div>
      </div>

      {/* Screen & Canvas */}
      <div className="relative aspect-square max-w-xl mx-auto rounded-xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
        <canvas ref={canvasRef} width={520} height={520} className="w-full h-full object-contain" />

        {/* Overlay Telemetry Badge (Top Left) */}
        <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300 border border-cyan-500/30 flex items-center space-x-2 shadow-lg">
          <span className={`h-2 w-2 rounded-full ${activeFrame?.isRealArchive ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          <span className="font-bold">
            {activeFrame?.surveyCycleName || `Epoch ${activeFrame?.epochIndex + 1}`}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-200">{activeFrame?.timestamp.split('T')[0]}</span>
        </div>

        {/* Mode / Band Indicator (Top Right) */}
        {isBlinkMode ? (
          <div className="absolute top-3 right-3 bg-amber-950/90 text-amber-300 font-mono text-xs px-3 py-1.5 rounded-lg border border-amber-600 shadow-lg flex items-center gap-1.5 animate-pulse">
            <Eye className="w-3.5 h-3.5" />
            <span>
              BLINK: {currentIdx % 2 === 0 ? `Epoch A (#${blinkEpochA + 1})` : `Epoch B (#${blinkEpochB + 1})`}
            </span>
          </div>
        ) : (
          <div className="absolute top-3 right-3 bg-slate-950/85 text-slate-300 font-mono text-[11px] px-2.5 py-1 rounded border border-white/10">
            {activeFrame?.detectorBand || 'LVF'} • {activeFrame?.bandWavelengthMicrons.toFixed(2)} µm
          </div>
        )}

        {/* Aperture Photometry Telemetry (Bottom Right) */}
        {activeFrame?.fitsData?.stats && (
          <div className="absolute bottom-3 right-3 bg-slate-950/90 text-emerald-300 font-mono text-[10px] px-2.5 py-1 rounded border border-emerald-500/40">
            Aper Flux: {activeFrame.fitsData.stats.apertureFluxMJySr.toFixed(2)} ±{' '}
            {activeFrame.fitsData.stats.apertureErrMJySr.toFixed(2)} MJy/sr (SNR{' '}
            {activeFrame.fitsData.stats.apertureSnr.toFixed(1)}σ)
          </div>
        )}
      </div>

      {/* Video & Playback Controls Bar */}
      <div className="max-w-xl mx-auto bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleStepBack}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Step backward one epoch"
              aria-label="Step backward one epoch"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-md shadow-cyan-900/40 cursor-pointer"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={handleStepForward}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Step forward one epoch"
              aria-label="Step forward one epoch"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentIdx(0);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Reset to first epoch"
              aria-label="Reset to first epoch"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-2 rounded-lg border transition cursor-pointer ${
                isLooping
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-transparent hover:text-white'
              }`}
              title={isLooping ? 'Looping Enabled' : 'Looping Disabled'}
              aria-label="Toggle timeline looping"
            >
              <Repeat className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-400">
            <FastForward className="h-3.5 w-3.5 text-cyan-400" />
            <span>Rate:</span>
            {[0.5, 1, 1.5, 3].map((s) => (
              <button
                key={s}
                onClick={() => setFps(s)}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  fps === s
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                {s}Hz
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Scrubber Slider */}
        {!isBlinkMode && timelineFrames.length > 1 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span className="font-semibold text-cyan-400">
                {activeFrame?.surveyCycleName || `Epoch ${currentIdx + 1}`}
              </span>
              <span className="text-slate-400">
                {activeFrame?.mjdObs ? `MJD ${activeFrame.mjdObs.toFixed(2)} • ` : ''}
                {activeFrame?.obsId || activeFrame?.timestamp}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={timelineFrames.length - 1}
              value={currentIdx}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentIdx(Number(e.target.value));
              }}
              aria-label="Time-lapse frame timeline scrubber"
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 overflow-x-auto gap-2">
              {timelineFrames.map((ep, idx) => (
                <span
                  key={ep.frameId + idx}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentIdx(idx);
                  }}
                  className={`cursor-pointer hover:text-cyan-300 shrink-0 ${
                    currentIdx === idx ? 'text-cyan-400 font-bold' : ''
                  }`}
                >
                  {ep.timestamp.split('T')[0]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Blink Mode Selectors */}
        {isBlinkMode && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Reference Epoch (A):</span>
              <select
                value={blinkEpochA}
                onChange={(e) => setBlinkEpochA(Number(e.target.value))}
                aria-label="Reference Epoch A for blink comparator"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {timelineFrames.map((ep, i) => (
                  <option key={ep.frameId + i} value={i}>
                    {ep.surveyCycleName || `Epoch ${i + 1}`} ({ep.timestamp.split('T')[0]})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Comparison Epoch (B):</span>
              <select
                value={blinkEpochB}
                onChange={(e) => setBlinkEpochB(Number(e.target.value))}
                aria-label="Comparison Epoch B for blink comparator"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {timelineFrames.map((ep, i) => (
                  <option key={ep.frameId + i} value={i}>
                    {ep.surveyCycleName || `Epoch ${i + 1}`} ({ep.timestamp.split('T')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Scientific Overlays Toolbar */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 mr-1">Overlays:</span>
            <button
              onClick={() => setShowGaia(!showGaia)}
              className={`px-2 py-1 rounded transition border cursor-pointer ${
                showGaia
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                  : 'bg-slate-800 text-slate-400 border-transparent hover:text-white'
              }`}
            >
              Gaia DR3 Vectors
            </button>
            <button
              onClick={() => setShowWise(!showWise)}
              className={`px-2 py-1 rounded transition border cursor-pointer ${
                showWise
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                  : 'bg-slate-800 text-slate-400 border-transparent hover:text-white'
              }`}
            >
              AllWISE Markers
            </button>
            <button
              onClick={() => setShowMotionVectors(!showMotionVectors)}
              className={`px-2 py-1 rounded transition border cursor-pointer ${
                showMotionVectors
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                  : 'bg-slate-800 text-slate-400 border-transparent hover:text-white'
              }`}
            >
              Target Reticle
            </button>
          </div>

          <button
            onClick={() => setArrayCoAdd(!arrayCoAdd)}
            className={`px-2.5 py-1 rounded-lg transition border cursor-pointer flex items-center gap-1.5 ${
              arrayCoAdd
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 shadow-sm font-semibold'
                : 'bg-slate-800 text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Array Co-Add</span>
          </button>
        </div>
      </div>

      {/* Target Motion / Variability Diagnostic Card */}
      {(properMotionInfo || variabilityInfo) && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-mono space-y-1.5 ${
            isLight
              ? 'bg-[#f4f1ea] border-[#1a1a1a]/15 text-[#1a1a1a]'
              : 'bg-slate-900/60 border-cyan-500/30 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-cyan-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" />
              <span>Reference Astrometry: {targetName}</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {properMotionInfo ? `PM = ${properMotionInfo.totalPmArcsecYr}″/yr` : 'Photometric Variable'}
            </span>
          </div>

          {properMotionInfo && (
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Known proper motion of <strong className="text-cyan-300">{properMotionInfo.totalPmArcsecYr}″/yr</strong> produces a{' '}
              <strong className="text-cyan-300">{(properMotionInfo.totalPmArcsecYr * 0.5).toFixed(2)}″</strong> shift per 6-month SPHEREx pass (or{' '}
              <strong className="text-cyan-300">{(properMotionInfo.totalPmArcsecYr * 15).toFixed(1)}″</strong> over the 15-year AllWISE → SPHEREx baseline!).
            </p>
          )}

          {variabilityInfo && (
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Published variability amplitude{' '}
              <strong className="text-amber-300">Δ{variabilityInfo.amplitudeMag} mag</strong> (period{' '}
              <strong className="text-amber-300">{variabilityInfo.periodDays} days</strong>), measurable directly via multi-epoch SPHEREx aperture photometry.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
