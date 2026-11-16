/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * COSMIC FRONTIER — Planet X Candidate Astrometric Investigation Workbench
 */

import React, { useState, useRef, useEffect } from 'react';
import { PlanetXCandidate } from '../../types/index.ts';
import { calculateAstrometricTrajectory } from '../../science/orbitalMechanics.ts';
import {
  Compass,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Play,
  Pause,
  Sliders,
  Send,
  Check,
  Flame,
  ExternalLink,
} from 'lucide-react';

interface CandidateInvestigationProps {
  candidates: PlanetXCandidate[];
  panesFrozen?: boolean;
  onVetCandidate: (id: string, status: PlanetXCandidate['status'], notes: string, verdict: string) => Promise<void>;
  onExplainCandidate: (candidate: PlanetXCandidate) => void;
}

export const CandidateInvestigation: React.FC<CandidateInvestigationProps> = ({
  candidates,
  panesFrozen = true,
  onVetCandidate,
  onExplainCandidate,
}) => {
  const [selectedId, setSelectedId] = useState<string>(candidates[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isBlinking, setIsBlinking] = useState<boolean>(true);
  const [activeEpochIdx, setActiveEpochIdx] = useState<number>(0);
  const [userNotes, setUserNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [vetSuccess, setVetSuccess] = useState<boolean>(false);

  const blinkCanvasRef = useRef<HTMLCanvasElement>(null);
  const trajectoryCanvasRef = useRef<HTMLCanvasElement>(null);

  const candidate = candidates.find((c) => c.id === selectedId) || candidates[0];
  const hasEpochMeasurements = Boolean(candidate?.observationHistory.some((obs) =>
    obs.dxArcsec !== null || obs.dyArcsec !== null || obs.w1FluxMjy !== null || obs.w2FluxMjy !== null
  ));
  const isSyntheticDemo = candidate?.dataOrigin === 'SYNTHETIC_DEMO';

  // Auto-select newly added candidate when candidates list grows or selection is missing
  useEffect(() => {
    if (candidates.length > 0 && !candidates.some((c) => c.id === selectedId)) {
      setSelectedId(candidates[0].id);
    }
  }, [candidates, selectedId]);

  // Sync userNotes when selected candidate changes
  useEffect(() => {
    if (candidate) {
      setUserNotes(candidate.notes || '');
      setActiveEpochIdx(0);
    }
  }, [candidate?.id]);

  // Blink animation loop across observation history
  useEffect(() => {
    if (!isBlinking || !candidate || candidate.observationHistory.length <= 1) return;
    const interval = setInterval(() => {
      setActiveEpochIdx((idx) => (idx + 1) % candidate.observationHistory.length);
    }, 600); // 600ms blink rate
    return () => clearInterval(interval);
  }, [isBlinking, candidate]);

  // Draw simulated multi-epoch blink comparator canvas
  useEffect(() => {
    const canvas = blinkCanvasRef.current;
    if (!canvas || !candidate || !candidate.observationHistory.some((obs) => obs.dxArcsec !== null || obs.dyArcsec !== null || obs.w1FluxMjy !== null || obs.w2FluxMjy !== null)) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // Clear
    const lightCanvas = Boolean(canvas.closest('.theme-light')) || document.documentElement.classList.contains('theme-light');
    ctx.fillStyle = lightCanvas ? '#F4F6F8' : '#111820';
    ctx.fillRect(0, 0, w, h);

    const currentObs = candidate.observationHistory[activeEpochIdx] || candidate.observationHistory[0];

    // Background stationary stars
    const fixedStars = [
      { x: 0.22, y: 0.28, r: 2.5, flux: 1.0 },
      { x: 0.82, y: 0.18, r: 3.0, flux: 1.2 },
      { x: 0.15, y: 0.75, r: 2.0, flux: 0.8 },
      { x: 0.78, y: 0.82, r: 2.2, flux: 0.9 },
      { x: 0.45, y: 0.15, r: 1.8, flux: 0.7 },
    ];

    fixedStars.forEach((star) => {
      ctx.fillStyle = lightCanvas ? '#788692' : '#D7E0E7';
      ctx.beginPath();
      ctx.arc(star.x * w, star.y * h, star.r, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Moving candidate object: displaced by dx, dy arcseconds
    // Scale: 1 arcsec = 120 pixels on canvas
    const pxOffsetX = (currentObs.dxArcsec || 0) * 140;
    const pxOffsetY = -(currentObs.dyArcsec || 0) * 140;

    const objX = cx + pxOffsetX;
    const objY = cy + pxOffsetY;

    // Diffraction artifact rendering if candidate is an artifact
    if (candidate.status === 'instrumental_artifact') {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(objX - 60, objY - 60);
      ctx.lineTo(objX + 60, objY + 60);
      ctx.moveTo(objX - 60, objY + 60);
      ctx.lineTo(objX + 60, objY - 60);
      ctx.stroke();
    }

    // Candidate Point Source
    const isColdCandidate = (candidate.colorW1W2 ?? 0) > 1.8;
    ctx.fillStyle = lightCanvas ? '#526779' : '#C4D0DA';
    ctx.shadowColor = lightCanvas ? '#8495A3' : '#AAB8C5';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(objX, objY, 4.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Crosshair Reticle
    ctx.strokeStyle = lightCanvas ? '#607487' : '#AABAC8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(objX, objY, 14, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(objX - 20, objY);
    ctx.lineTo(objX - 8, objY);
    ctx.moveTo(objX + 8, objY);
    ctx.lineTo(objX + 20, objY);
    ctx.moveTo(objX, objY - 20);
    ctx.lineTo(objX, objY - 8);
    ctx.moveTo(objX, objY + 8);
    ctx.lineTo(objX, objY + 20);
    ctx.stroke();

    // Scale bar: 0.1 arcsec
    ctx.strokeStyle = lightCanvas ? '#71808D' : '#8796A4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w - 70, h - 20);
    ctx.lineTo(w - 70 + 0.1 * 140, h - 20);
    ctx.stroke();

    ctx.fillStyle = lightCanvas ? '#596A78' : '#AAB6C2';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText('0.1″', w - 55, h - 24);

  }, [candidate, activeEpochIdx]);

  // Draw astrometric reflex parallax trajectory
  useEffect(() => {
    const canvas = trajectoryCanvasRef.current;
    if (!canvas || !candidate || candidate.heliocentricDistanceAU == null || candidate.heliocentricDistanceAU <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    const lightCanvas = Boolean(canvas.closest('.theme-light')) || document.documentElement.classList.contains('theme-light');
    ctx.fillStyle = lightCanvas ? '#F4F6F8' : '#111820';
    ctx.fillRect(0, 0, w, h);

    const fit = calculateAstrometricTrajectory(candidate);

    // Compute coordinate bounds
    const allRas = fit.modelTrajectory.map((p) => p.ra);
    const allDecs = fit.modelTrajectory.map((p) => p.dec);
    const minRa = Math.min(...allRas);
    const maxRa = Math.max(...allRas);
    const minDec = Math.min(...allDecs);
    const maxDec = Math.max(...allDecs);

    const pad = 35;
    const toPxX = (ra: number) =>
      pad + ((ra - minRa) / (maxRa - minRa || 0.0001)) * (w - 2 * pad);
    const toPxY = (dec: number) =>
      h - pad - ((dec - minDec) / (maxDec - minDec || 0.0001)) * (h - 2 * pad);

    // Grid lines
    ctx.strokeStyle = lightCanvas ? '#DCE3E8' : '#2B3742';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pad, cy);
    ctx.lineTo(w - pad, cy);
    ctx.moveTo(cx, pad);
    ctx.lineTo(cx, h - pad);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw model reflex loop curve
    ctx.strokeStyle = lightCanvas ? '#718394' : '#AAB8C5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    fit.modelTrajectory.forEach((pt, i) => {
      const x = toPxX(pt.ra);
      const y = toPxY(pt.dec);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw observed epochs points
    fit.observedPositions.forEach((pt, i) => {
      const x = toPxX(pt.ra);
      const y = toPxY(pt.dec);

      ctx.fillStyle = lightCanvas ? '#526779' : '#C4D0DA';
      ctx.strokeStyle = lightCanvas ? '#FFFFFF' : '#202B35';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = lightCanvas ? '#40515F' : '#D2DCE4';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(`Ep ${i + 1}`, x + 6, y - 4);
    });

    // Titles
    ctx.fillStyle = lightCanvas ? '#596A78' : '#AAB6C2';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`Illustrative parallax: π ≈ ${fit.parallaxAmplitudeArcsec}″`, 12, 18);
    ctx.fillText(`Proper Motion: μ = ${fit.linearProperMotionArcsecYr}″/yr`, 12, 32);

  }, [candidate]);

  const handleVetSubmit = async (verdict: PlanetXCandidate['status']) => {
    if (!candidate) return;
    setIsSubmitting(true);
    try {
      await onVetCandidate(
        candidate.id,
        verdict,
        userNotes,
        verdict === 'candidate'
          ? 'Flagged Priority Candidate (Unconfirmed — Requires Astrometric & Spectral Follow-Up)'
          : verdict === 'known_asteroid'
          ? 'Classified as Foreground Centaur / Asteroid'
          : 'Rejected as Instrumental Diffraction Ghost'
      );
      setVetSuccess(true);
      setTimeout(() => setVetSuccess(false), 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  return (
    <div className="space-y-4">
      {/* Scientific Integrity Disclaimer */}
      <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl px-4 py-2.5 text-xs font-sans text-amber-200/90 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong>Candidate Triage Notice:</strong> Items below represent simulated training benchmarks or unvetted SPHEREx residual signals. Flagging a candidate queues it for independent astrometric & spectroscopic verification and <strong>does not constitute a confirmed discovery of Planet X</strong>.
        </span>
      </div>

      {/* Top Filter and Candidate Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Candidate Astrometry Queue
            </span>
            <div className="flex items-center gap-2">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                aria-label="Select candidate designation from queue"
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {filteredCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.designation} ({c.survey}{c.dataOrigin === 'SYNTHETIC_DEMO' ? ' · demo' : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-400 mr-1">Status:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'candidate', label: 'Candidates' },
            { id: 'unvetted', label: 'Unvetted' },
            { id: 'known_asteroid', label: 'Centaur/Asteroid' },
            { id: 'instrumental_artifact', label: 'Artifacts' },
          ].map((flt) => (
            <button
              key={flt.id}
              onClick={() => setStatusFilter(flt.id)}
              className={`px-2.5 py-1 rounded transition ${
                statusFilter === flt.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {flt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Investigation Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Multi-Epoch Blinker & Parallax Loop */}
        <div className={`lg:col-span-7 space-y-4 ${panesFrozen ? 'lg:sticky lg:top-[136px] self-start lg:max-h-[calc(100vh-9.5rem)] lg:overflow-y-auto pane-scroll pr-1' : ''}`}>
          {/* Multi-Epoch Blink Comparator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-cyan-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Multi-epoch Evidence Viewer · {candidate?.survey}
                </h4>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono">
                <button
                  onClick={() => setIsBlinking(!isBlinking)}
                  disabled={!hasEpochMeasurements}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isBlinking ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  <span>{!hasEpochMeasurements ? 'No epoch data' : isBlinking ? 'Pause Blink' : 'Auto Blink'}</span>
                </button>
              </div>
            </div>

            {/* Blink Canvas */}
            <div className="relative aspect-square max-w-md mx-auto rounded-lg overflow-hidden border border-slate-800 bg-black">
              {hasEpochMeasurements ? (
                <canvas
                  ref={blinkCanvasRef}
                  width={420}
                  height={420}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                  <Eye className="h-8 w-8 text-slate-600" />
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-300">No epoch imagery attached</span>
                  <span className="max-w-xs text-[11px] leading-relaxed text-slate-500">This candidate has no time-tagged pixel frames, measured positional offsets, or WISE photometry yet. The viewer will not synthesize an observation.</span>
                </div>
              )}

              {/* Epoch Tag on Canvas */}
              {hasEpochMeasurements && candidate?.observationHistory[activeEpochIdx] && (
                <div className="absolute top-2 left-2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded border border-slate-800 text-xs font-mono text-cyan-300">
                  <span className="font-bold text-white">
                    {candidate.observationHistory[activeEpochIdx].surveyTag}
                  </span>
                  <span className="text-slate-400 block text-[10px]">
                    Date: {candidate.observationHistory[activeEpochIdx].epoch}
                  </span>
                </div>
              )}

              {/* Candidate Info Pill */}
              {hasEpochMeasurements && <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded border border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300">
                  Δx: {candidate?.observationHistory[activeEpochIdx]?.dxArcsec == null ? '—' : candidate.observationHistory[activeEpochIdx].dxArcsec.toFixed(2)}″ | Δy:{' '}
                  {candidate?.observationHistory[activeEpochIdx]?.dyArcsec == null ? '—' : candidate.observationHistory[activeEpochIdx].dyArcsec.toFixed(2)}″
                </span>
                <span
                  className={`font-semibold ${
                    (candidate?.colorW1W2 ?? 0) > 1.8 ? 'text-red-400' : 'text-amber-400'
                  }`}
                >
                  W1−W2: {candidate?.colorW1W2 == null ? 'Not measured' : candidate.colorW1W2.toFixed(1) + ' mag'}
                </span>
              </div>}
            </div>

            {/* Epoch Selector Buttons */}
            {hasEpochMeasurements ? (
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-mono pt-1">
                {candidate?.observationHistory.map((ep, i) => (
                  <button
                    key={ep.epoch}
                    onClick={() => {
                      setIsBlinking(false);
                      setActiveEpochIdx(i);
                    }}
                    className={`px-2.5 py-1 rounded border transition ${
                      activeEpochIdx === i
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Ep {i + 1} ({ep.epoch.split('-')[0]})
                  </button>
                ))}
              </div>
            ) : (
              <p className="pt-1 text-center text-[10px] font-mono text-slate-500">No time-tagged observations attached</p>
            )}
          </div>

          {/* Astrometric Parallax Ellipse Fit */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sliders className="h-4 w-4 text-purple-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Illustrative Parallax + Proper-Motion Track
                </h4>
                <p className="mt-1 text-[10px] text-slate-500">Circular-Earth approximation for visual learning; not a fitted orbit or JPL ephemeris.</p>
              </div>
              <span className="text-xs font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                {isSyntheticDemo ? 'Illustrative distance:' : 'Distance:'} {candidate?.heliocentricDistanceAU == null ? 'Not measured' : `${candidate.heliocentricDistanceAU} AU`}
              </span>
            </div>

            <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-slate-800 bg-black">
              {hasMeasuredDistance ? (
                <canvas
                  ref={trajectoryCanvasRef}
                  width={600}
                  height={320}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                  <Compass className="h-7 w-7 text-slate-600" />
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-300">No orbit fit available</span>
                  <span className="max-w-md text-[11px] leading-relaxed text-slate-500">A heliocentric distance and time-tagged astrometry are required before this workbench can plot a candidate-specific parallax or orbital trajectory. No default distance is substituted.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Candidate Evidence & Vetting Form */}
        <div className="lg:col-span-5 space-y-4">
          {/* Candidate Diagnostics Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Flame className="h-4 w-4 text-amber-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Physical & Astrometric Measurements
                </h4>
              </div>
              <button
                onClick={() => onExplainCandidate(candidate)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-950 text-indigo-300 border border-indigo-700/60 hover:bg-indigo-900/50 transition cursor-pointer"
              >
                <span>Explain with AI</span>
              </button>
            </div>

            <div className={`rounded-lg border px-3 py-2 text-[11px] leading-relaxed ${
              isSyntheticDemo
                ? 'border-amber-500/35 bg-amber-950/25 text-amber-200'
                : candidate?.dataOrigin === 'ARCHIVE_DERIVED'
                  ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-200'
                  : 'border-slate-700 bg-slate-950 text-slate-300'
            }`}>
              <strong>{isSyntheticDemo ? 'SYNTHETIC DEMONSTRATION — NOT A DETECTION' : candidate?.dataOrigin === 'ARCHIVE_DERIVED' ? 'ARCHIVE-DERIVED RESIDUAL — NOT A CONFIRMED OBJECT' : 'PROVENANCE NOT SPECIFIED'}</strong>
              <span className="block mt-1">
                {isSyntheticDemo
                  ? 'All displayed coordinates, photometry, offsets, distances and scores are invented teaching values. They demonstrate the vetting interface only and must not be cited as survey observations.'
                  : candidate?.dataOrigin === 'ARCHIVE_DERIVED'
                    ? 'This record was derived from a SPHEREx archive residual. It is a follow-up lead, not a confirmed moving object or Planet X detection.'
                    : 'The origin of this record has not been verified. Treat its measurements as unconfirmed until provenance is supplied.'}
              </span>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{isSyntheticDemo ? 'Demo SNR (not measured)' : 'Astrometric SNR'}</span>
                <span className="text-amber-400 font-bold text-sm">{candidate?.astrometricSnr == null ? 'Not measured' : `${candidate.astrometricSnr} σ`}</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{isSyntheticDemo ? 'Demo W1−W2 (illustrative)' : 'Infrared Color W1−W2'}</span>
                <span className="text-white font-bold text-sm">{candidate?.colorW1W2 == null ? 'Not measured' : candidate.colorW1W2 + ' mag'}</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{isSyntheticDemo ? 'Demo parallax (illustrative)' : 'Annual Parallax (π)'}</span>
                <span className="text-cyan-400 font-bold text-sm">{candidate?.parallaxArcsec == null ? 'Not measured' : `${(candidate.parallaxArcsec * 1000).toFixed(1)} mas`}</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{isSyntheticDemo ? 'Demo mass (not inferred)' : 'Predicted Mass'}</span>
                <span className="text-purple-300 font-bold text-sm">{candidate?.estimatedMassEarths == null ? 'Not estimated' : `~${candidate.estimatedMassEarths} M⊕`}</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">RA / Dec (J2000)</span>
                <span className="text-slate-200 font-semibold truncate block">
                  {candidate?.raDeg.toFixed(2)}°, {candidate?.decDeg.toFixed(2)}°
                </span>
                {candidate && <a
                  href={`https://byw.tools/wiseview#ra=${candidate.raDeg}&dec=${candidate.decDeg}&size=176&band=2&speed=500`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-200"
                >
                  Compare this position in WiseView <ExternalLink className="h-3 w-3" />
                </a>}
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">{isSyntheticDemo ? 'Demo hypothesis score' : 'Batygin & Brown Fit'}</span>
                <span className="text-emerald-400 font-bold text-sm">{candidate?.theoreticalConsistency == null ? 'Not evaluated' : `${candidate.theoreticalConsistency}%`}</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">MMR Protected eTNOs</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {candidate?.heliocentricDistanceAU == null ? 'Insufficient data' : candidate.heliocentricDistanceAU > 200 ? '6 / 7 Resonances' : '0 (Centaur Orbit)'}
                </span>
              </div>
            </div>

            {/* Color physics note */}
            <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
              <div className="text-amber-300 font-semibold">Photometric Diagnosis:</div>
              <p className="text-slate-400 leading-relaxed">
                {candidate?.colorW1W2 == null
                  ? 'W1/W2 photometry is unavailable. No infrared-colour classification or photometric vetting can be made for this candidate.'
                  : candidate.colorW1W2 > 1.8
                    ? 'Extremely red W1-W2 colour can be consistent with cold infrared sources; confirm with calibrated photometry and independent observations.'
                    : 'This measured W1-W2 colour is not strongly red. Interpret it with uncertainties and other observations; colour alone does not classify the object.'}
              </p>
            </div>
          </div>

          {/* Student Vetting & Classification Form */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Citizen Science Vetting Workbench</span>
              </h4>
              <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Current: {candidate?.status}
              </span>
            </div>

            {candidate?.vettedBy && (
              <div className="bg-emerald-950/30 border border-emerald-800/40 p-2 rounded text-[11px] font-mono text-emerald-300">
                Vetted by {candidate.vettedBy}: "{candidate.vettingVerdict}"
              </div>
            )}

            <div className="space-y-1.5 text-xs font-mono">
              <label className="text-slate-300 block">Analysis & Vetting Notes:</label>
              <textarea
                rows={3}
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Document your evidence: proper motion consistency, color index, or diffraction characteristics..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-mono text-slate-400">Record Citizen Science Triage:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleVetSubmit('candidate')}
                  className="px-2.5 py-2 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-600/50 font-mono text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Flag Priority</span>
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleVetSubmit('known_asteroid')}
                  className="px-2.5 py-2 rounded-lg bg-amber-600/30 text-amber-300 border border-amber-500/50 hover:bg-amber-600/50 font-mono text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Centaur</span>
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleVetSubmit('instrumental_artifact')}
                  className="px-2.5 py-2 rounded-lg bg-rose-600/30 text-rose-300 border border-rose-500/50 hover:bg-rose-600/50 font-mono text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Artifact</span>
                </button>
              </div>

              {candidate && (
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800 text-[11px] font-mono">
                  <a href="https://irsa.ipac.caltech.edu/applications/SPHEREx/" target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline inline-flex items-center gap-1">
                    SPHEREx Data Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={`https://aladin.cds.unistra.fr/AladinLite/?target=${candidate.raDeg.toFixed(4)}%20${candidate.decDeg.toFixed(4)}&fov=0.1&survey=P%2FALLWISE%2Fcolor`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-300 hover:underline inline-flex items-center gap-1"
                  >
                    Aladin Lite <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {vetSuccess && (
                <div className="text-center font-mono text-xs text-emerald-400 animate-pulse pt-1">
                  ✓ Candidate triage status saved to session queue!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
