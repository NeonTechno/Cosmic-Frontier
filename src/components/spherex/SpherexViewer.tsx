/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * COSMIC FRONTIER — Master SPHEREx Interactive Astronomical Viewer
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SpherexObservation,
  StretchMode,
  ColorMap,
  TransientCandidate,
} from '../../types/index.ts';
import { renderObservationToCanvas, SPHEREX_BANDS } from '../../science/spherexEngine.ts';
import { CelestialCoordinateSearch } from './CelestialCoordinateSearch.tsx';
import {
  CHALLENGE_BENCHMARK_TARGETS,
  ChallengeBenchmarkTarget,
  generateBenchmarkObservation,
  generateObservationAtCoordinates,
} from '../../science/spherexCoordinates.ts';
import { BandSelector } from './BandSelector.tsx';
import { MetadataPanel } from './MetadataPanel.tsx';
import { ComparisonView } from './ComparisonView.tsx';
import { TimelapseViewer } from './TimelapseViewer.tsx';
import { DifferenceOverlay } from './DifferenceOverlay.tsx';
import { SpectralPlot } from './SpectralPlot.tsx';
import { InfraredSignalAnalysisChart } from './InfraredSignalAnalysisChart.tsx';
import { SpectralSignalVisualizer } from './SpectralSignalVisualizer.tsx';
import {
  computeSpherexSurveyTiles,
  findTileAtCoord,
  SpherexSurveyTile,
} from '../../science/spherexSurveyTiles.ts';
import {
  CoordinateGridOverlay,
  SurveyTileControlPanel,
} from './CoordinateGridOverlay.tsx';
import {
  Telescope,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Crosshair,
  Palette,
  Sliders,
  SplitSquareVertical,
  Film,
  AlertCircle,
  Activity,
  RefreshCw,
  Eye,
  Download,
  ChevronDown,
  Check,
  Waves,
  Grid3X3,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { exportHighResAstronomicalMap, exportGenericCanvasPNG } from '../../science/spherexExport.ts';
import { DownloadViewModal } from './DownloadViewModal.tsx';
import { FreezePaneButton } from '../common/FreezePaneButton.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';

interface SpherexViewerProps {
  observations: SpherexObservation[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onCandidatePromoted?: () => Promise<void> | void;
  onExplainWithAi: (contextType: string, payload: Record<string, unknown>, prompt?: string) => void;
}

export const SpherexViewer: React.FC<SpherexViewerProps> = ({
  observations,
  isLoading,
  error,
  onRetry,
  onCandidatePromoted,
  onExplainWithAi,
}) => {
  const { isLight } = useTheme();

  // Local observations list supporting live IRSA DR1/QR3 FITS responses
  const [localObservations, setLocalObservations] = useState<SpherexObservation[]>(observations);
  const [selectedObsId, setSelectedObsId] = useState<string>(observations[0]?.id || '');
  const [selectedEpochIdx, setSelectedEpochIdx] = useState<number>(0);
  const [selectedBandId, setSelectedBandId] = useState<number>(SPHEREX_BANDS[54]?.bandId || 55);
  const [selectedDetectorBand, setSelectedDetectorBand] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'single' | 'signal-analysis' | 'compare' | 'timelapse' | 'difference' | 'sed'>('single');
  const [panesFrozen, setPanesFrozen] = useState<boolean>(true);
  const [isSearchingLive, setIsSearchingLive] = useState<boolean>(false);
  const [liveSearchError, setLiveSearchError] = useState<string | null>(null);
  const [showObservationsList, setShowObservationsList] = useState<boolean>(true);
  const [obsRowVersions, setObsRowVersions] = useState<Record<string, number>>({});
  const [animatingObsKeys, setAnimatingObsKeys] = useState<Set<string>>(() => new Set());
  const initialAutoFetchedRef = useRef<boolean>(false);
  const knownObsIdsRef = useRef<Set<string>>(new Set(observations.map((o) => o.id)));
  const obsRowVersionsRef = useRef<Record<string, number>>({});

  // Visualization parameters
  const [stretch, setStretch] = useState<StretchMode>('asinh');
  const [cmap, setCmap] = useState<ColorMap>('inferno');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showCrosshair, setShowCrosshair] = useState<boolean>(true);
  const [showTileGrid, setShowTileGrid] = useState<boolean>(false);
  const [showTileLabels, setShowTileLabels] = useState<boolean>(true);
  const [highlightFilter, setHighlightFilter] = useState<'all' | 'targets' | 'protostars' | 'calibration'>('all');
  const [selectedTile, setSelectedTile] = useState<SpherexSurveyTile | null>(null);
  const [hoveredTile, setHoveredTile] = useState<SpherexSurveyTile | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Astronomical overlays & calibration toggles
  const [selectedFov, setSelectedFov] = useState<number>(6.5);
  const [showGaiaOverlay, setShowGaiaOverlay] = useState<boolean>(true);
  const [showWiseOverlay, setShowWiseOverlay] = useState<boolean>(false);
  const [showMotionVectors, setShowMotionVectors] = useState<boolean>(true);
  const [arrayCoAdd, setArrayCoAdd] = useState<boolean>(false);
  const [subtractZodi, setSubtractZodi] = useState<boolean>(true);
  const [showSnrMap, setShowSnrMap] = useState<boolean>(false);

  // Hover coordinate & flux readout
  const [cursorInfo, setCursorInfo] = useState<{
    ra: number;
    dec: number;
    flux: number;
    pixelX: number;
    pixelY: number;
  } | null>(null);

  const [selectedCoord, setSelectedCoord] = useState<{ x: number; y: number } | null>({
    x: 0.5,
    y: 0.5,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const markObservationAdded = useCallback((obsId: string) => {
    knownObsIdsRef.current.add(obsId);
    const nextVer = (obsRowVersionsRef.current[obsId] || 0) + 1;
    obsRowVersionsRef.current[obsId] = nextVer;
    setObsRowVersions({ ...obsRowVersionsRef.current });
    setAnimatingObsKeys((keys) => {
      const next = new Set(keys);
      next.add(`${obsId}::${nextVer}`);
      return next;
    });
  }, []);

  // Synchronize localObservations when observations prop updates, preserving live IRSA entries
  useEffect(() => {
    if (observations.length > 0) {
      const incomingNewIds: string[] = [];
      for (const o of observations) {
        if (!knownObsIdsRef.current.has(o.id)) {
          knownObsIdsRef.current.add(o.id);
          incomingNewIds.push(o.id);
        }
      }
      if (incomingNewIds.length > 0) {
        setAnimatingObsKeys((keys) => {
          const next = new Set(keys);
          for (const id of incomingNewIds) {
            next.add(`${id}::${obsRowVersionsRef.current[id] || 0}`);
          }
          return next;
        });
      }
      setLocalObservations((prev) => {
        const liveOnes = prev.filter(
          (p) =>
            p.dataSourceStatus === 'LIVE_IRSA_SPHEREX' ||
            p.id.startsWith('IRSA-SPHEREX') ||
            p.id.startsWith('SPHEREX-IRSA') ||
            p.id.startsWith('SPHEREX-CUSTOM')
        );
        const existingIds = new Set(liveOnes.map((l) => l.id));
        return [...liveOnes, ...observations.filter((o) => !existingIds.has(o.id))];
      });
    }
  }, [observations]);

  // Live IRSA SPHEREx DR1/QR3 Time Machine Query
  const fetchLiveTimeMachine = useCallback(async (params: {
    q?: string;
    ra?: number;
    dec?: number;
    band?: string;
    fov?: number;
  }) => {
    setIsSearchingLive(true);
    setLiveSearchError(null);
    try {
      const qs = new URLSearchParams();
      if (params.ra !== undefined && params.dec !== undefined) {
        qs.set('ra', params.ra.toString());
        qs.set('dec', params.dec.toString());
        if (params.q) qs.set('target', params.q);
      } else if (params.q) {
        qs.set('q', params.q);
      }
      if (params.band) qs.set('band', params.band);
      qs.set('fov', String(params.fov || selectedFov || 6.5));

      const res = await fetch(`/api/spherex/time-machine?${qs.toString()}`);
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const obs = data as SpherexObservation;
      setLocalObservations((prev) => {
        const filtered = prev.filter(
          (o) =>
            o.id !== obs.id &&
            !(
              o.dataSourceStatus === 'SIMULATED_BENCHMARK' &&
              o.targetName.toLowerCase() === obs.targetName.toLowerCase()
            )
        );
        return [obs, ...filtered];
      });
      markObservationAdded(obs.id);
      setSelectedObsId(obs.id);
      setSelectedEpochIdx(0);
      setSelectedFov(obs.fieldOfViewArcmin);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown network or API error';
      setLiveSearchError(`Live NASA/IPAC IRSA query failed (${reason}). Showing a clearly labelled simulated benchmark instead.`);
      // Offline fallback is for exploration only and must never be mistaken for archive observations.
      const qLower = (params.q || '').trim().toLowerCase();
      const matchedTarget =
        CHALLENGE_BENCHMARK_TARGETS.find(
          (t) =>
            (qLower && (t.name.toLowerCase().includes(qLower) || t.designation.toLowerCase().includes(qLower) || t.id.toLowerCase() === qLower)) ||
            (params.ra !== undefined && params.dec !== undefined && Math.hypot(t.raDeg - params.ra, t.decDeg - params.dec) < 0.15)
        );

      let fallbackObs: SpherexObservation | null = null;
      if (matchedTarget) {
        fallbackObs = generateBenchmarkObservation(matchedTarget);
      } else if (params.ra !== undefined && params.dec !== undefined) {
        fallbackObs = generateObservationAtCoordinates(
          params.ra,
          params.dec,
          params.q,
          params.fov || selectedFov || 6.5
        );
      } else {
        fallbackObs = generateBenchmarkObservation(CHALLENGE_BENCHMARK_TARGETS[0]);
      }

      if (fallbackObs) {
        fallbackObs = {
          ...fallbackObs,
          dataSourceStatus: 'FALLBACK_SIMULATED',
          dataSourceLabel: `SIMULATED OFFLINE BENCHMARK — live IRSA query failed: ${reason}`,
        };
        const resolvedObs = fallbackObs;
        setLocalObservations((prev) => {
          const filtered = prev.filter((o) => o.id !== resolvedObs.id);
          return [resolvedObs, ...filtered];
        });
        markObservationAdded(resolvedObs.id);
        setSelectedObsId(resolvedObs.id);
        setSelectedEpochIdx(0);
        setSelectedFov(resolvedObs.fieldOfViewArcmin);
      } else {
        setLiveSearchError('Live IRSA backend unavailable in static mode; enter RA/Dec coordinates to inspect sky fields locally.');
      }
    } finally {
      setIsSearchingLive(false);
    }
  }, [selectedFov, markObservationAdded]);

  // Read URL query parameters OR auto-load live IRSA cutouts for the initial challenge target
  useEffect(() => {
    if (typeof window === 'undefined' || initialAutoFetchedRef.current) return;
    initialAutoFetchedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const targetParam = params.get('target');
    const raParam = params.get('ra');
    const decParam = params.get('dec');
    const fovParam = params.get('fov');
    const tabParam = params.get('tab');

    const fovVal = fovParam && !isNaN(parseFloat(fovParam)) ? parseFloat(fovParam) : 6.5;
    if (fovParam && !isNaN(fovVal)) setSelectedFov(fovVal);
    if (tabParam && ['single', 'signal-analysis', 'compare', 'timelapse', 'difference', 'sed'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }

    if (raParam && decParam && !isNaN(parseFloat(raParam)) && !isNaN(parseFloat(decParam))) {
      fetchLiveTimeMachine({
        ra: parseFloat(raParam),
        dec: parseFloat(decParam),
        q: targetParam || undefined,
        fov: fovVal,
      });
    } else if (targetParam) {
      fetchLiveTimeMachine({ q: targetParam, fov: fovVal });
    } else {
      // Automatically pull real IRSA DR1/QR3 cutouts for Barnard's Star on entry
      fetchLiveTimeMachine({
        q: "Barnard's Star",
        ra: 269.4521,
        dec: 4.6934,
        fov: 6.5,
      });
    }
  }, [fetchLiveTimeMachine]);

  // Active observation & active frame
  const activeObs = localObservations.find((o) => o.id === selectedObsId) || localObservations[0];
  const safeEpochIdx = activeObs ? Math.min(selectedEpochIdx, Math.max(0, activeObs.epochs.length - 1)) : 0;
  const activeFrame = activeObs?.epochs[safeEpochIdx];
  const compareFrame = activeObs?.epochs[activeObs.epochs.length - 1] || activeFrame;

  const handleSelectBenchmark = (target: ChallengeBenchmarkTarget) => {
    fetchLiveTimeMachine({
      q: target.name,
      ra: target.raDeg,
      dec: target.decDeg,
      band: selectedDetectorBand || undefined,
      fov: target.fieldOfViewArcmin || 6.5,
    });
  };

  const handleSearchCoordinates = (raDeg: number, decDeg: number, name?: string) => {
    const benchmark = CHALLENGE_BENCHMARK_TARGETS.find(
      (t) => Math.abs(t.raDeg - raDeg) < 0.02 && Math.abs(t.decDeg - decDeg) < 0.02
    );
    fetchLiveTimeMachine({
      q: name || benchmark?.name,
      ra: raDeg,
      dec: decDeg,
      band: selectedDetectorBand || undefined,
      fov: selectedFov || 6.5,
    });
  };

  const handleSearchTargetName = (query: string) => {
    fetchLiveTimeMachine({
      q: query,
      band: selectedDetectorBand || undefined,
      fov: selectedFov || 6.5,
    });
  };

  const handleSelectObservation = (nextId: string) => {
    setSelectedObsId(nextId);
    setSelectedEpochIdx(0);
    const chosen = localObservations.find((o) => o.id === nextId);
    if (chosen && chosen.dataSourceStatus !== 'LIVE_IRSA_SPHEREX') {
      fetchLiveTimeMachine({
        q: chosen.targetName,
        ra: chosen.raDeg,
        dec: chosen.decDeg,
        band: selectedDetectorBand || undefined,
        fov: chosen.fieldOfViewArcmin || 6.5,
      });
    }
  };

  const handleChangeDetectorBand = (band: string) => {
    setSelectedDetectorBand(band);
    if (activeObs) {
      fetchLiveTimeMachine({
        q: activeObs.targetName,
        ra: activeObs.raDeg,
        dec: activeObs.decDeg,
        band: band || undefined,
        fov: selectedFov || activeObs.fieldOfViewArcmin,
      });
    }
  };

  // Compute 16 SPHEREx survey tiles across observation footprint
  const surveyTiles = React.useMemo(() => {
    if (!activeObs || !activeFrame) return [];
    return computeSpherexSurveyTiles(activeObs, activeFrame);
  }, [activeObs, activeFrame]);

  // Set default selected tile to primary target tile or center tile
  useEffect(() => {
    if (surveyTiles.length > 0) {
      const targetTile =
        surveyTiles.find((t) => t.status === 'TARGET_PRIMARY') ||
        surveyTiles.find((t) => t.isTargetInterest) ||
        surveyTiles[5] ||
        surveyTiles[0];
      setSelectedTile((prev) => {
        if (prev && surveyTiles.some((t) => t.tileId === prev.tileId)) {
          return surveyTiles.find((t) => t.tileId === prev.tileId) || targetTile;
        }
        return targetTile;
      });
    }
  }, [surveyTiles]);

  const handleSelectTile = (tile: SpherexSurveyTile) => {
    setSelectedTile(tile);
    setSelectedCoord(tile.centerNorm);
  };

  const handleCenterOnTile = (tile: SpherexSurveyTile) => {
    setSelectedTile(tile);
    setSelectedCoord(tile.centerNorm);
    if (zoomLevel > 1) {
      const dispW = 520;
      const dispH = 520;
      const panX = (0.5 - tile.centerNorm.x) * dispW * (zoomLevel - 1);
      const panY = (0.5 - tile.centerNorm.y) * dispH * (zoomLevel - 1);
      setPanOffset({ x: panX, y: panY });
    }
  };

  // Sync selectedObsId if observations update
  useEffect(() => {
    if (!selectedObsId && localObservations.length > 0) {
      setSelectedObsId(localObservations[0].id);
    }
  }, [localObservations, selectedObsId]);

  // Main canvas rendering
  const renderCanvas = useCallback(() => {
    if (canvasRef.current && activeFrame) {
      renderObservationToCanvas(
        canvasRef.current,
        activeFrame,
        stretch,
        cmap,
        {
          showGrid,
          selectedCoord: showCrosshair ? selectedCoord : null,
          showGaiaOverlay,
          showWiseOverlay,
          showMotionVectors,
          arrayCoAdd,
          fieldOfViewArcmin: selectedFov || activeObs.fieldOfViewArcmin,
          subtractZodi,
          showSnrMap,
        }
      );
    }
  }, [
    activeFrame,
    stretch,
    cmap,
    showGrid,
    showCrosshair,
    selectedCoord,
    showGaiaOverlay,
    showWiseOverlay,
    showMotionVectors,
    arrayCoAdd,
    selectedFov,
    activeObs,
    subtractZodi,
    showSnrMap,
  ]);

  useEffect(() => {
    if (activeTab === 'single') {
      renderCanvas();
    }
  }, [renderCanvas, activeTab, selectedObsId, selectedEpochIdx, stretch, cmap, showGrid, showCrosshair, selectedCoord, showGaiaOverlay, showWiseOverlay, showMotionVectors, arrayCoAdd, selectedFov, subtractZodi, showSnrMap]);

  // Mouse interaction for pan & coordinates
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current || !activeObs) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (isPanning) {
      setPanOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }

    // Calculate celestial coordinates (North-Up, East-Left ICRS)
    const fovDeg = (selectedFov || activeObs.fieldOfViewArcmin) / 60;
    const cosDec = Math.max(0.1, Math.cos((activeObs.decDeg * Math.PI) / 180));
    const ra = activeObs.raDeg - ((x - 0.5) * fovDeg) / cosDec;
    const dec = activeObs.decDeg - (y - 0.5) * fovDeg;

    let fluxEstimate = 0;
    let pxX = Math.round(x * 2048);
    let pxY = Math.round(y * 2048);

    if (activeFrame?.fitsData && activeFrame.fitsData.imagePixels.length > 0) {
      const gw = activeFrame.fitsData.width;
      const gh = activeFrame.fitsData.height;
      const ix = Math.max(0, Math.min(gw - 1, Math.floor(x * gw)));
      const iy = Math.max(0, Math.min(gh - 1, Math.floor(y * gh)));
      pxX = ix;
      pxY = iy;
      const rawVal = activeFrame.fitsData.imagePixels[iy * gw + ix] ?? 0;
      const zodiVal = subtractZodi && activeFrame.fitsData.zodiPixels ? activeFrame.fitsData.zodiPixels[iy * gw + ix] ?? 0 : 0;
      fluxEstimate = rawVal - zodiVal;
    } else if (activeFrame) {
      fluxEstimate =
        activeFrame.backgroundLevelMJySr +
        activeFrame.stars.reduce((acc, s) => {
          const d = Math.hypot(x - s.x, y - s.y);
          return d < 0.04 ? acc + s.peakFlux * Math.exp(-(d * d) / 0.0004) : acc;
        }, 0);
    }

    setCursorInfo({
      ra: Number(ra.toFixed(4)),
      dec: Number(dec.toFixed(4)),
      flux: Number(fluxEstimate.toFixed(2)),
      pixelX: pxX,
      pixelY: pxY,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setSelectedCoord({ x, y });

    const clickedTile = findTileAtCoord(surveyTiles, x, y);
    if (clickedTile) {
      setSelectedTile(clickedTile);
    }
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Export & Download View state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isQuickExporting, setIsQuickExporting] = useState<boolean>(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  const activeBand =
    SPHEREX_BANDS.find((b) => b.bandId === selectedBandId) || SPHEREX_BANDS[54] || SPHEREX_BANDS[0];

  // Direct high-resolution download of currently rendered astronomical map
  const handleDirectDownload = async () => {
    if (!activeObs || !activeFrame) return;
    setIsQuickExporting(true);
    try {
      const filename = await exportHighResAstronomicalMap(
        activeFrame,
        activeObs,
        activeBand,
        {
          resolution: 2048,
          stretch,
          cmap,
          showGrid,
          showCrosshair,
          includeTileGrid: showTileGrid,
          highlightedTileCodes: surveyTiles.filter((t) => t.isTargetInterest).map((t) => t.code),
          selectedCoord,
          includeMetadataBanner: true,
          includeColorbar: true,
          includeCompass: true,
          cropToViewport: zoomLevel > 1,
          zoomLevel,
          panOffset,
          canvasDisplayWidth: 520,
          canvasDisplayHeight: 520,
        }
      );
      setDownloadSuccessToast(filename);
      setTimeout(() => setDownloadSuccessToast(null), 4000);
    } catch (err) {
      console.error('Download View error:', err);
    } finally {
      setIsQuickExporting(false);
    }
  };

  // Export generic on-screen view if on compare, difference, or timelapse tab
  const handleExportCurrentTab = async () => {
    if (activeTab === 'single') {
      await handleDirectDownload();
      return;
    }

    setIsQuickExporting(true);
    try {
      const activeContainer = document.querySelector('main');
      const canvas = activeContainer?.querySelector('canvas') as HTMLCanvasElement | null;
      if (canvas) {
        const cleanTarget = activeObs.id.replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `SPHEREx_${cleanTarget}_${activeTab}_view_${Date.now()}.png`;
        const tabTitle =
          activeTab === 'difference'
            ? `${activeObs.targetName} — Image Difference Residual`
            : activeTab === 'compare'
            ? `${activeObs.targetName} — Side-by-Side Epoch Comparison`
            : activeTab === 'timelapse'
            ? `${activeObs.targetName} — Multi-Epoch Blink Frame`
            : `${activeObs.targetName} — Spectral View`;

        await exportGenericCanvasPNG(canvas, filename, tabTitle);
        setDownloadSuccessToast(filename);
        setTimeout(() => setDownloadSuccessToast(null), 4000);
      } else {
        await handleDirectDownload();
      }
    } catch (err) {
      console.error('Failed to export current tab view:', err);
    } finally {
      setIsQuickExporting(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
        <RefreshCw className="h-10 w-10 text-cyan-400 animate-spin" />
        <div className="text-center">
          <h3 className="text-sm font-semibold text-white">Loading SPHEREx Mission Observations...</h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Querying NASA/IPAC IRSA SPHEREx DR1 and QR3 archives...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-slate-950 border border-red-900/50 rounded-2xl space-y-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <div>
          <h3 className="text-base font-semibold text-white">SPHEREx Telemetry Retrieval Failed</h3>
          <p className="text-xs text-red-300 font-mono mt-1 max-w-md">{error}</p>
        </div>
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono transition"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  // Empty State
  if (!observations || observations.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-center">
        <Telescope className="h-12 w-12 text-slate-600" />
        <h3 className="text-base font-semibold text-white">No Observations Available</h3>
        <p className="text-xs text-slate-400 font-mono">
          Ensure synthetic pipeline generators or IRSA endpoints are active.
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs font-mono hover:bg-cyan-500 transition"
        >
          Load Default Benchmark Field
        </button>
      </div>
    );
  }

  return (
    <div className="spherex-viewer space-y-4">
      {/* NASA Space Apps Challenge Celestial Coordinate Search & Benchmark Targets */}
      <CelestialCoordinateSearch
        currentRa={activeObs.raDeg}
        currentDec={activeObs.decDeg}
        currentFovArcmin={selectedFov || activeObs.fieldOfViewArcmin}
        activeTargetName={activeObs.targetName}
        selectedDetectorBand={selectedDetectorBand}
        isSearchingLive={isSearchingLive}
        onChangeDetectorBand={handleChangeDetectorBand}
        onSelectBenchmark={handleSelectBenchmark}
        onSearchCoordinates={handleSearchCoordinates}
        onSearchTargetName={handleSearchTargetName}
        isLight={isLight}
      />

      {/* Live vs Fallback Provenance & Archive Status Banner */}
      <div
        className={`rounded-xl px-4 py-2.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono ${
          isSearchingLive
            ? 'bg-cyan-950/35 border-cyan-700/50 text-cyan-200'
            : activeObs.dataSourceStatus === 'LIVE_IRSA_SPHEREX'
            ? 'bg-emerald-950/35 border-emerald-700/50 text-emerald-200'
            : 'bg-slate-900/80 border-amber-700/40 text-amber-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isSearchingLive ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
          ) : activeObs.dataSourceStatus === 'LIVE_IRSA_SPHEREX' ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="truncate">
            {isSearchingLive ? (
              <>
                <strong>CONNECTING TO IRSA ARCHIVE:</strong> Fetching live SPHEREx DR1/QR3 FITS cutouts, Gaia DR3, and AllWISE baselines...
              </>
            ) : (
              <>
                <strong>{activeObs.dataSourceStatus}:</strong> {activeObs.dataSourceLabel}
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-[11px] flex-wrap">
          {activeObs.archiveSummary && (
            <span className="text-slate-300">
              DR1: <strong>{activeObs.archiveSummary.dr1ObservationCount}</strong> • QR3:{' '}
              <strong>{activeObs.archiveSummary.qr3ObservationCount}</strong> • Span:{' '}
              <strong>
                {activeObs.archiveSummary.earliestDate} → {activeObs.archiveSummary.latestDate}
              </strong>
            </span>
          )}
          {activeObs.gaiaSources && activeObs.gaiaSources.length > 0 && (
            <span className="text-emerald-300">Gaia DR3: {activeObs.gaiaSources.length}</span>
          )}
          {activeObs.allWiseCutouts && activeObs.allWiseCutouts.length > 0 && (
            <span className="text-amber-300">AllWISE: {activeObs.allWiseCutouts.length} bands</span>
          )}
          {!isSearchingLive && activeObs.dataSourceStatus !== 'LIVE_IRSA_SPHEREX' && (
            <button
              onClick={() =>
                fetchLiveTimeMachine({
                  q: activeObs.targetName,
                  ra: activeObs.raDeg,
                  dec: activeObs.decDeg,
                  band: selectedDetectorBand || undefined,
                  fov: selectedFov || activeObs.fieldOfViewArcmin || 6.5,
                })
              }
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Query Live IRSA</span>
            </button>
          )}
        </div>
      </div>

      {liveSearchError && (
        <div className="bg-rose-950/40 border border-rose-800/60 text-rose-200 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between">
          <span>Query Notice: {liveSearchError}</span>
          <button onClick={() => setLiveSearchError(null)} className="underline ml-3">
            Dismiss
          </button>
        </div>
      )}

      {/* Frozen Topic & Subtopic Headline Bar + Mode Switcher */}
      <div className={`${panesFrozen ? 'sticky top-[66px] z-30 backdrop-blur-md' : ''} ${
        isLight ? 'bg-white/95 border-slate-200 shadow-md' : 'bg-slate-900/95 border-slate-800 shadow-xl'
      } border rounded-xl p-3 sm:p-4 space-y-3 transition-all`}>
        <div className={`flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b ${
          isLight ? 'border-slate-200' : 'border-slate-800/80'
        }`}>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-semibold border ${
              isLight
                ? 'bg-cyan-100 border-cyan-300 text-cyan-900'
                : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
            }`}>
              SPHEREx Explorer
            </span>
            <h2 className={`text-sm sm:text-base font-bold tracking-tight truncate ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {activeObs.targetName}
            </h2>
            <span className={isLight ? 'text-slate-400 hidden sm:inline' : 'text-slate-600 hidden sm:inline'}>/</span>
            <span className={`text-xs font-mono font-medium ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>
              {activeTab === 'single' && 'Sky Viewer & Band Cutouts'}
              {activeTab === 'signal-analysis' && 'Signal Analysis & Variability'}
              {activeTab === 'compare' && 'Side-by-Side Epoch Comparison'}
              {activeTab === 'timelapse' && 'Time-lapse Motion Blink'}
              {activeTab === 'difference' && 'Change Highlights (Image Subtraction)'}
              {activeTab === 'sed' && 'SED Spectrum (102 LVF Bands)'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <FreezePaneButton
              frozen={panesFrozen}
              onToggle={() => setPanesFrozen((v) => !v)}
              label="Freeze Headlines"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Target Switcher Dropdown */}
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg border ${
            isLight
              ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
              : 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
          }`}>
            <Telescope className="h-5 w-5" />
          </div>
          <div>
            <span className={`text-[10px] font-mono uppercase tracking-wider block ${
              isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'
            }`}>
              Active Astronomical Target
            </span>
            <select
              value={selectedObsId}
              onChange={(e) => handleSelectObservation(e.target.value)}
              aria-label="Select active SPHEREx target field"
              className={`border rounded-lg px-2.5 py-1 text-sm font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer max-w-xs truncate ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900'
                  : 'bg-slate-950 border-slate-700 text-white'
              }`}
            >
              {localObservations.map((obs) => (
                <option key={obs.id} value={obs.id}>
                  {obs.targetName} [{obs.dataSourceStatus === 'LIVE_IRSA_SPHEREX' ? 'LIVE IRSA' : 'BENCHMARK'}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className={`flex flex-wrap items-center gap-1.5 p-1 rounded-xl border text-xs font-mono ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('single')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'single'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Sky Viewer</span>
          </button>

          <button
            onClick={() => setActiveTab('signal-analysis')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'signal-analysis'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm font-semibold'
                : isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Waves className="h-3.5 w-3.5" />
            <span>Signal Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'compare'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <SplitSquareVertical className="h-3.5 w-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            onClick={() => setActiveTab('timelapse')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'timelapse'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            <span>Time-lapse</span>
          </button>

          <button
            onClick={() => setActiveTab('difference')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'difference'
                ? 'bg-amber-600 text-white shadow-sm'
                : isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Change Highlights</span>
          </button>

          <button
            onClick={() => setActiveTab('sed')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'sed'
                ? 'bg-purple-600 text-white shadow-sm'
                : isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>SED Spectrum</span>
          </button>

          <button
            onClick={handleExportCurrentTab}
            disabled={isQuickExporting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 hover:from-cyan-600/50 hover:to-indigo-600/50 text-cyan-200 border border-cyan-500/40 transition shadow-sm font-semibold"
            title="Download View as High-Resolution PNG"
          >
            {isQuickExporting ? (
              <div className="h-3.5 w-3.5 border-2 border-cyan-300/30 border-t-cyan-300 rounded-full animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5 text-cyan-300" />
            )}
            <span>Download View</span>
          </button>
        </div>
        </div>
      </div>

      {/* SPHEREx Observations List (with smooth fade-in animation for each newly added row) */}
      <div
        className={`rounded-xl border transition-colors ${
          isLight
            ? 'bg-white border-[#1a1a1a]/15 shadow-xs'
            : 'bg-slate-900/90 border-slate-800 shadow-lg'
        }`}
      >
        <div
          className={`flex items-center justify-between px-3.5 py-2 border-b text-xs font-mono ${
            isLight ? 'border-[#1a1a1a]/10 text-[#1a1a1a]' : 'border-slate-800/80 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Telescope className={`h-3.5 w-3.5 ${isLight ? 'text-[#d44d5c]' : 'text-cyan-400'}`} />
            <span className="font-semibold tracking-tight">SPHEREx Observations</span>
            <span className={isLight ? 'text-[#666] tabular-nums' : 'text-slate-400 tabular-nums'}>
              · {localObservations.length} {localObservations.length === 1 ? 'record' : 'records'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowObservationsList((v) => !v)}
            className={`flex items-center gap-1 text-[11px] cursor-pointer transition-colors ${
              isLight ? 'text-[#666] hover:text-[#1a1a1a]' : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <span>{showObservationsList ? 'Hide list' : 'Show list'}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                showObservationsList ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {showObservationsList && (
          <div className={`max-h-40 overflow-y-auto pane-scroll divide-y ${isLight ? 'divide-[#1a1a1a]/10' : 'divide-slate-800/60'}`}>
            {localObservations.map((obs) => {
              const ver = obsRowVersions[obs.id] || 0;
              const rowKey = `${obs.id}::${ver}`;
              const isNewRow = animatingObsKeys.has(rowKey);
              const isSelected = obs.id === activeObs?.id;
              const isLive = obs.dataSourceStatus === 'LIVE_IRSA_SPHEREX';

              return (
                <button
                  key={rowKey}
                  type="button"
                  onClick={() => handleSelectObservation(obs.id)}
                  onAnimationEnd={() => {
                    if (isNewRow) {
                      setAnimatingObsKeys((prev) => {
                        if (!prev.has(rowKey)) return prev;
                        const next = new Set(prev);
                        next.delete(rowKey);
                        return next;
                      });
                    }
                  }}
                  className={`w-full text-left px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs transition-colors cursor-pointer ${
                    isNewRow ? 'animate-row-fade-in' : ''
                  } ${
                    isSelected
                      ? isLight
                        ? 'bg-[#f4f1ea] text-[#1a1a1a]'
                        : 'bg-cyan-950/35 text-white'
                      : isLight
                        ? 'hover:bg-black/[0.03] text-[#1a1a1a]'
                        : 'hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`font-semibold truncate ${isSelected ? (isLight ? 'text-[#d44d5c]' : 'text-cyan-300') : ''}`}>
                      {obs.targetName}
                    </span>
                    <span className={`text-[11px] font-mono truncate hidden sm:inline ${isLight ? 'text-[#666]' : 'text-slate-400'}`}>
                      · {obs.category}
                    </span>
                  </div>

                  <div className={`flex items-center gap-2 text-[11px] font-mono tabular-nums shrink-0 ${isLight ? 'text-[#555]' : 'text-slate-400'}`}>
                    <span>
                      RA {obs.raDeg.toFixed(3)}° · Dec {obs.decDeg.toFixed(3)}°
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{obs.epochs.length} epochs</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        isLive
                          ? isLight
                            ? 'text-emerald-700 font-semibold'
                            : 'text-emerald-300 font-semibold'
                          : isLight
                            ? 'text-amber-700'
                            : 'text-amber-300'
                      }
                    >
                      {isLive ? 'Live IRSA' : obs.dataSourceStatus === 'FALLBACK_SIMULATED' ? 'Offline Fallback' : 'Benchmark'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Sky Viewer Area (when in 'single' mode) */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Sky Canvas Column */}
          <div className="lg:col-span-8 space-y-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl space-y-2">
              {/* Canvas Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-xs font-mono">
                {/* Stretch Controls */}
                <div className="flex items-center space-x-1 text-slate-400">
                  <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Stretch:</span>
                  {(['asinh', 'log', 'linear', 'sqrt'] as StretchMode[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStretch(s)}
                      className={`px-2 py-0.5 rounded uppercase text-[11px] transition ${
                        stretch === s
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Colormap Palette Controls */}
                <div className="flex items-center space-x-1 text-slate-400">
                  <Palette className="h-3.5 w-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Palette:</span>
                  {(['inferno', 'viridis', 'magma', 'plasma', 'grayscale'] as ColorMap[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCmap(c)}
                      className={`px-2 py-0.5 rounded capitalize text-[11px] transition ${
                        cmap === c
                          ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Field of View Selector (NASA Challenge Requirement) */}
                <div className="flex items-center space-x-1 text-slate-400 pl-1 border-l border-slate-800">
                  <span className="hidden xl:inline text-[10px]">FOV:</span>
                  <select
                    value={selectedFov}
                    onChange={(e) => setSelectedFov(Number(e.target.value))}
                    aria-label="Field of View Selector"
                    className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-cyan-300 cursor-pointer"
                  >
                    <option value={1.5}>1.5′ (Ultra Zoom)</option>
                    <option value={3.0}>3.0′ (Target Track)</option>
                    <option value={6.0}>6.0′ (Standard)</option>
                    <option value={15.0}>15.0′ (Survey Strip)</option>
                    <option value={30.0}>30.0′ (Mosaic)</option>
                  </select>
                </div>

                {/* Overlays: Gaia, WISE, Motion Rings, Array Co-Add */}
                <div className="flex items-center space-x-1 text-slate-400 pl-1 border-l border-slate-800">
                  <button
                    onClick={() => setShowGaiaOverlay(!showGaiaOverlay)}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition border cursor-pointer ${
                      showGaiaOverlay
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-slate-800 text-slate-400 border-transparent hover:text-white'
                    }`}
                    title="Toggle Gaia DR3 Astrometry & Proper Motion Vector Arrows"
                  >
                    Gaia
                  </button>

                  <button
                    onClick={() => setShowWiseOverlay(!showWiseOverlay)}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition border cursor-pointer ${
                      showWiseOverlay
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                        : 'bg-slate-800 text-slate-400 border-transparent hover:text-white'
                    }`}
                    title="Toggle AllWISE Mid-IR Apertures (W1 3.4µm / W2 4.6µm)"
                  >
                    WISE
                  </button>

                  <button
                    onClick={() => setShowMotionVectors(!showMotionVectors)}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition border cursor-pointer ${
                      showMotionVectors
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                        : 'bg-slate-800 text-slate-400 border-transparent hover:text-white'
                    }`}
                    title="Toggle Moving Object Locator Rings"
                  >
                    Movers
                  </button>

                  <button
                    onClick={() => setSubtractZodi(!subtractZodi)}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition border cursor-pointer ${
                      subtractZodi
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                        : 'bg-slate-800 text-slate-400 border-transparent hover:text-white'
                    }`}
                    title="Subtract IRSA SPHEREx Level-2 ZODI HDU background"
                  >
                    −Zodi
                  </button>

                  <button
                    onClick={() => setShowSnrMap(!showSnrMap)}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition border cursor-pointer ${
                      showSnrMap
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'
                        : 'bg-slate-800 text-slate-400 border-transparent hover:text-white'
                    }`}
                    title="Display variance-weighted Signal-to-Noise Ratio (SNR) significance map"
                  >
                    SNR
                  </button>

                  <button
                    onClick={() => setArrayCoAdd(!arrayCoAdd)}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition border cursor-pointer ${
                      arrayCoAdd
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 font-bold'
                        : 'bg-slate-800 text-slate-400 border-transparent hover:text-white'
                    }`}
                    title="Co-Add all 17 spectral channels in array"
                  >
                    Co-Add
                  </button>
                </div>

                {/* Overlays & View resets */}
                <div className="flex items-center space-x-1 text-slate-400">
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`p-1.5 rounded transition ${
                      showGrid ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                    }`}
                    title="Toggle Coordinate Grid"
                  >
                    <Grid className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => setShowTileGrid(!showTileGrid)}
                    className={`p-1.5 rounded transition flex items-center space-x-1 ${
                      showTileGrid
                        ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title="Toggle SPHEREx Survey Tile Coordinate Grid Overlay"
                  >
                    <Grid3X3 className="h-3.5 w-3.5" />
                    <span className="hidden xl:inline text-[10px] font-mono font-semibold">Tiles</span>
                  </button>

                  <button
                    onClick={() => setShowCrosshair(!showCrosshair)}
                    className={`p-1.5 rounded transition ${
                      showCrosshair ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                    }`}
                    title="Toggle Aperture Crosshair"
                  >
                    <Crosshair className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Zoom in"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Zoom out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={handleResetView}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Reset Zoom & Pan"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>

                  {/* Download View Button with Quality Options Dropdown */}
                  <div className="flex items-center pl-1 border-l border-slate-800 space-x-1">
                    <button
                      onClick={handleDirectDownload}
                      disabled={isQuickExporting}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono text-[11px] font-semibold transition shadow-md shadow-cyan-950/40 disabled:opacity-50"
                      title="Download View as High-Resolution PNG (2048 × 2048 FITS Scale)"
                    >
                      {isQuickExporting ? (
                        <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      <span>{isQuickExporting ? 'Exporting...' : 'Download View'}</span>
                    </button>

                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Download Options (Resolution 1K/2K/4K, Overlays, Metadata)"
                      aria-label="Download View options"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Canvas Container with Pan/Zoom */}
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={handleCanvasClick}
                className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-800 bg-black cursor-crosshair select-none"
              >
                <div
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={520}
                    height={520}
                    className="w-full h-full object-contain"
                  />

                  {/* SPHEREx Coordinate Selection Grid Overlay on the main astronomical map */}
                  {showTileGrid && (
                    <CoordinateGridOverlay
                      tiles={surveyTiles}
                      selectedTile={selectedTile}
                      onSelectTile={handleSelectTile}
                      hoveredTile={hoveredTile}
                      onHoverTile={setHoveredTile}
                      showTileLabels={showTileLabels}
                      highlightFilter={highlightFilter}
                      onCenterOnTile={handleCenterOnTile}
                    />
                  )}
                </div>

                {/* Active Cutout Telemetry Watermark */}
                <div className="absolute top-2 left-2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded border border-slate-800 text-[10px] font-mono text-cyan-300 pointer-events-none z-20 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeFrame?.isRealArchive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span>
                    {activeFrame?.detectorBand || 'LVF'} • {activeFrame?.bandWavelengthMicrons.toFixed(2)} µm •{' '}
                    {activeFrame?.timestamp.split('T')[0]}
                  </span>
                </div>

                {/* Telemetry coordinate readout overlay */}
                {cursorInfo && (
                  <div className="absolute bottom-2 left-2 bg-slate-950/85 backdrop-blur-md p-2 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 space-y-0.5 pointer-events-none z-20">
                    <div className="flex items-center space-x-2">
                      <span className="text-cyan-400 font-bold">RA:</span> {cursorInfo.ra}°
                      <span className="text-cyan-400 font-bold ml-2">Dec:</span> {cursorInfo.dec}°
                    </div>
                    <div className="flex items-center space-x-2 text-slate-400">
                      <span>Pixel ({cursorInfo.pixelX}, {cursorInfo.pixelY})</span>
                      <span>•</span>
                      <span className="text-amber-300 font-semibold">{cursorInfo.flux} MJy/sr</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chronological Epoch Selector Strip */}
              {activeObs.epochs.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
                  <span className="text-slate-400 mr-1">Epochs ({activeObs.epochs.length}):</span>
                  {activeObs.epochs.map((ep, idx) => (
                    <button
                      key={ep.frameId + idx}
                      onClick={() => setSelectedEpochIdx(idx)}
                      className={`px-2 py-1 rounded-md border transition cursor-pointer ${
                        safeEpochIdx === idx
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                      title={ep.obsId || ep.frameId}
                    >
                      {ep.timestamp.split('T')[0]} ({ep.detectorBand || `${ep.bandWavelengthMicrons.toFixed(2)}µm`})
                    </button>
                  ))}
                </div>
              )}

              {/* SPHEREx Survey Tile Coordinate Selection & Highlight Control Panel */}
              {showTileGrid && (
                <div className="mt-3">
                  <SurveyTileControlPanel
                    tiles={surveyTiles}
                    selectedTile={selectedTile}
                    onSelectTile={handleSelectTile}
                    showTileGrid={showTileGrid}
                    onToggleTileGrid={() => setShowTileGrid(!showTileGrid)}
                    highlightFilter={highlightFilter}
                    onSetHighlightFilter={setHighlightFilter}
                    onCenterOnTile={handleCenterOnTile}
                  />
                </div>
              )}
            </div>

            {/* 102 Spectral Bands Selector */}
            <BandSelector
              selectedBandId={selectedBandId}
              onSelectBand={(b) => setSelectedBandId(b.bandId)}
            />
          </div>

          {/* Metadata & SED Column */}
          <div className="lg:col-span-4 space-y-4">
            <MetadataPanel
              observation={activeObs}
              onExplainWithAi={() =>
                onExplainWithAi('spherex_fits', {
                  targetName: activeObs.targetName,
                  category: activeObs.category,
                  raDeg: activeObs.raDeg,
                  decDeg: activeObs.decDeg,
                  fitsHeader: activeObs.fitsHeader,
                  dataSourceStatus: activeObs.dataSourceStatus,
                  dataSourceLabel: activeObs.dataSourceLabel,
                })
              }
            />

            <SpectralPlot
              observation={activeObs}
              onExplainSpectrum={() =>
                onExplainWithAi('spherex_spectrum', {
                  targetName: activeObs.targetName,
                  category: activeObs.category,
                  sedCurve: activeObs.fullSedCurve,
                  iceAbsorptionDiagnostics: ['H2O Ice 3.05µm', 'CO2 Ice 4.27µm', 'CO Ice 4.67µm'],
                  dataSourceStatus: activeObs.dataSourceStatus,
                })
              }
            />
          </div>

          {/* Full-Width Spectral Signal Visualizer (Recharts) */}
          <div className="lg:col-span-12 mt-2 space-y-4">
            <SpectralSignalVisualizer
              targetName={activeObs.targetName}
              category={activeObs.category}
              spectralPoints={activeObs.fullSedCurve?.map((p) => ({
                wavelength: p.wavelength,
                fluxMJySr: p.fluxMJySr,
                uncertainty: p.uncertainty,
                modelFit: p.modelFit,
              }))}
              activeWavelength={SPHEREX_BANDS.find((b) => b.bandId === selectedBandId)?.wavelengthMicrons || 3.05}
              onSelectWavelength={(w) => {
                const closest = SPHEREX_BANDS.reduce((prev, curr) => {
                  return Math.abs(curr.wavelengthMicrons - w) < Math.abs(prev.wavelengthMicrons - w) ? curr : prev;
                }, SPHEREX_BANDS[0]);
                if (closest) {
                  setSelectedBandId(closest.bandId);
                }
              }}
              onExplainWithAi={onExplainWithAi}
            />

            <InfraredSignalAnalysisChart
              observation={activeObs}
              onExplainWithAi={onExplainWithAi}
            />
          </div>
        </div>
      )}

      {/* Dedicated Infrared Signal Analysis Mode */}
      {activeTab === 'signal-analysis' && (
        <div className="space-y-4">
          <SpectralSignalVisualizer
            targetName={activeObs.targetName}
            category={activeObs.category}
            spectralPoints={activeObs.fullSedCurve?.map((p) => ({
              wavelength: p.wavelength,
              fluxMJySr: p.fluxMJySr,
              uncertainty: p.uncertainty,
              modelFit: p.modelFit,
            }))}
            activeWavelength={SPHEREX_BANDS.find((b) => b.bandId === selectedBandId)?.wavelengthMicrons || 3.05}
            onSelectWavelength={(w) => {
              const closest = SPHEREX_BANDS.reduce((prev, curr) => {
                return Math.abs(curr.wavelengthMicrons - w) < Math.abs(prev.wavelengthMicrons - w) ? curr : prev;
              }, SPHEREX_BANDS[0]);
              if (closest) {
                setSelectedBandId(closest.bandId);
              }
            }}
            onExplainWithAi={onExplainWithAi}
          />

          <InfraredSignalAnalysisChart
            observation={activeObs}
            onExplainWithAi={onExplainWithAi}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6">
              <MetadataPanel
                observation={activeObs}
                onExplainWithAi={() =>
                  onExplainWithAi('spherex_fits', {
                    targetName: activeObs.targetName,
                    category: activeObs.category,
                    raDeg: activeObs.raDeg,
                    decDeg: activeObs.decDeg,
                    fitsHeader: activeObs.fitsHeader,
                    dataSourceStatus: activeObs.dataSourceStatus,
                    dataSourceLabel: activeObs.dataSourceLabel,
                  })
                }
              />
            </div>
            <div className="lg:col-span-6">
              <SpectralPlot
                observation={activeObs}
                onExplainSpectrum={() =>
                  onExplainWithAi('spherex_spectrum', {
                    targetName: activeObs.targetName,
                    category: activeObs.category,
                    sedCurve: activeObs.fullSedCurve,
                    iceAbsorptionDiagnostics: ['H2O Ice 3.05µm', 'CO2 Ice 4.27µm', 'CO Ice 4.67µm'],
                    dataSourceStatus: activeObs.dataSourceStatus,
                  })
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Mode */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          <ComparisonView
            epochs={activeObs.epochs}
            frameA={activeFrame}
            frameB={compareFrame}
            stretch={stretch}
            cmap={cmap}
            subtractZodi={subtractZodi}
          />
        </div>
      )}

      {/* Multi-Epoch Time-lapse Mode */}
      {activeTab === 'timelapse' && (
        <div className="space-y-4">
          <TimelapseViewer
            epochs={activeObs.epochs}
            allWiseCutouts={activeObs.allWiseCutouts}
            stretch={stretch}
            cmap={cmap}
            subtractZodi={subtractZodi}
            targetName={activeObs.targetName}
            targetCategory={activeObs.category}
            properMotionInfo={activeObs.properMotionTarget}
            variabilityInfo={activeObs.variabilityTarget}
            fieldOfViewArcmin={selectedFov || activeObs.fieldOfViewArcmin}
            onExplainWithAi={onExplainWithAi}
            isLight={isLight}
          />
        </div>
      )}

      {/* Change Highlighting / Difference Mode */}
      {activeTab === 'difference' && (
        <div className="space-y-4">
          <DifferenceOverlay
            epochs={activeObs.epochs}
            referenceFrame={activeFrame}
            scienceFrame={compareFrame}
            targetName={activeObs.targetName}
            raDeg={activeObs.raDeg}
            decDeg={activeObs.decDeg}
            fieldOfViewArcmin={selectedFov || activeObs.fieldOfViewArcmin}
            stretch={stretch}
            subtractZodi={subtractZodi}
            panesFrozen={panesFrozen}
            onExplainTransient={(tr: TransientCandidate) =>
              onExplainWithAi('transient_detection', {
                targetField: activeObs.targetName,
                transientId: tr.id,
                candidateType: tr.candidateType,
                raDeg: tr.raDeg,
                decDeg: tr.decDeg,
                deltaFluxMJySr: tr.deltaFluxMJySr,
                snr: tr.snr,
                significanceSigma: tr.significanceSigma,
                detectionEpoch: tr.detectionEpoch,
                referenceEpoch: tr.referenceEpoch,
                dataSourceStatus: activeObs.dataSourceStatus,
              })
            }
            onPromoteCandidate={async (payload) => {
              try {
                const res = await fetch('/api/planetx/candidates/from-spherex', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                if (res.ok && onCandidatePromoted) {
                  await onCandidatePromoted();
                }
              } catch (err) {
                console.warn('Backend candidate promotion unavailable in static mode:', err);
              }
            }}
          />
        </div>
      )}

      {/* Full SED Spectral Mode */}
      {activeTab === 'sed' && (
        <div className="space-y-4">
          <SpectralSignalVisualizer
            targetName={activeObs.targetName}
            category={activeObs.category}
            spectralPoints={activeObs.fullSedCurve?.map((p) => ({
              wavelength: p.wavelength,
              fluxMJySr: p.fluxMJySr,
              uncertainty: p.uncertainty,
              modelFit: p.modelFit,
            }))}
            activeWavelength={SPHEREX_BANDS.find((b) => b.bandId === selectedBandId)?.wavelengthMicrons || 3.05}
            onSelectWavelength={(w) => {
              const closest = SPHEREX_BANDS.reduce((prev, curr) => {
                return Math.abs(curr.wavelengthMicrons - w) < Math.abs(prev.wavelengthMicrons - w) ? curr : prev;
              }, SPHEREX_BANDS[0]);
              if (closest) {
                setSelectedBandId(closest.bandId);
              }
            }}
            onExplainWithAi={onExplainWithAi}
          />

          <SpectralPlot
            observation={activeObs}
            onExplainSpectrum={() =>
              onExplainWithAi('spherex_spectrum', {
                targetName: activeObs.targetName,
                sedCurve: activeObs.fullSedCurve,
                dataSourceStatus: activeObs.dataSourceStatus,
              })
            }
          />
        </div>
      )}

      {/* High-Resolution Astronomical Map Export Modal */}
      <DownloadViewModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        observation={activeObs}
        band={activeBand}
        stretch={stretch}
        cmap={cmap}
        showGrid={showGrid}
        showCrosshair={showCrosshair}
        selectedCoord={selectedCoord}
        zoomLevel={zoomLevel}
        panOffset={panOffset}
        onNotification={(msg) => {
          setDownloadSuccessToast(msg);
          setTimeout(() => setDownloadSuccessToast(null), 4000);
        }}
      />

      {/* Download Success Floating Toast Notification */}
      {downloadSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 text-cyan-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs font-mono animate-fade-in">
          <div className="p-1.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/60 shrink-0">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold block text-white">Export Complete</span>
            <span className="text-[11px] text-slate-400 max-w-xs truncate block">
              {downloadSuccessToast}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
