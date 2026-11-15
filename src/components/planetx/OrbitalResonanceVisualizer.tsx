/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * COSMIC FRONTIER — Orbital Resonance & eTNO Distribution Visualizer
 * High-performance scientific visualizer of mean-motion resonances (MMR),
 * Kozai-Lidov phase planes, and eTNO orbital distributions relative to
 * Planet X candidates and the Batygin & Brown (2021) perturber model.
 * Built with Recharts.
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  ScatterChart,
  Scatter,
  Area,
  Bar,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Cell,
  Label,
} from 'recharts';
import { ExtremeTNO, PlanetXCandidate, PlanetXHypothesisParams } from '../../types/index.ts';
import { useTheme } from '../../context/ThemeContext.tsx';
import {
  Orbit,
  Activity,
  Layers,
  Sparkles,
  Compass,
  CheckCircle2,
} from 'lucide-react';

interface OrbitalResonanceVisualizerProps {
  etnoCatalog: ExtremeTNO[];
  candidates: PlanetXCandidate[];
  hypothesis: PlanetXHypothesisParams;
  panesFrozen?: boolean;
  onExplainWithAi?: (contextType: string, payload: Record<string, unknown>) => void;
}

// Major mean motion resonances (p : q) relative to Planet X's orbital period
const MAJOR_MMR_RATIOS = [
  { name: '1:1', ratio: 1.00, label: '1:1 Co-orbital', color: '#ec4899', stability: 'Chaotic / Horseshoe' },
  { name: '5:4', ratio: 1.25, label: '5:4 Resonance', color: '#a855f7', stability: 'Weak island' },
  { name: '4:3', ratio: 1.333, label: '4:3 Inner MMR', color: '#8b5cf6', stability: 'Semi-stable' },
  { name: '3:2', ratio: 1.50, label: '3:2 Resonance', color: '#6366f1', stability: 'Strong Libration' },
  { name: '5:3', ratio: 1.667, label: '5:3 Resonance', color: '#3b82f6', stability: 'Moderate' },
  { name: '2:1', ratio: 2.00, label: '2:1 Principal MMR', color: '#06b6d4', stability: 'High Phase Confinement' },
  { name: '5:2', ratio: 2.50, label: '5:2 Resonance', color: '#10b981', stability: 'Strong Sec. Coupling' },
  { name: '3:1', ratio: 3.00, label: '3:1 Major MMR', color: '#84cc16', stability: 'Critical Barrier' },
  { name: '4:1', ratio: 4.00, label: '4:1 Distant MMR', color: '#eab308', stability: 'Sedna Vicinity' },
  { name: '5:1', ratio: 5.00, label: '5:1 Outer Boundary', color: '#f97316', stability: 'Distant Libration' },
];

export const OrbitalResonanceVisualizer: React.FC<OrbitalResonanceVisualizerProps> = ({
  etnoCatalog,
  candidates,
  hypothesis,
  panesFrozen = true,
  onExplainWithAi,
}) => {
  const { isLight } = useTheme();

  // Active view tab inside the resonance visualizer
  const [resonanceView, setResonanceView] = useState<'mmr-period' | 'phase-space' | 'varpi-alignment' | 'kozai-lidov'>('mmr-period');
  const [highlightResonance, setHighlightResonance] = useState<string>('all');
  const [showResonanceBands, setShowResonanceBands] = useState<boolean>(true);

  // Active candidate object
  const activeCandidate = useMemo(() => {
    return candidates[0] || null;
  }, [candidates]);

  // Derived orbital period of candidate (Kepler's 3rd Law: T = a^(3/2))
  const candidatePeriodYears = useMemo(() => {
    if (!activeCandidate) return hypothesis.orbitalPeriodYears;
    const a = activeCandidate.heliocentricDistanceAU > 0 ? activeCandidate.heliocentricDistanceAU : hypothesis.semiMajorAxisAU;
    return Math.round(Math.pow(a, 1.5));
  }, [activeCandidate, hypothesis]);

  // Reference period to evaluate resonance ratios against (defaults to hypothesis or active candidate)
  const referencePeriodYears = useMemo(() => {
    return hypothesis.orbitalPeriodYears || Math.round(Math.pow(hypothesis.semiMajorAxisAU, 1.5));
  }, [hypothesis]);

  // Transform eTNOs into resonance dataset
  const etnoResonanceData = useMemo(() => {
    return etnoCatalog.map((etno) => {
      const periodRatio = etno.orbitalPeriodYears / referencePeriodYears;
      
      // Find closest standard MMR ratio
      let closestMMR = MAJOR_MMR_RATIOS[0];
      let minDiff = Infinity;
      MAJOR_MMR_RATIOS.forEach((r) => {
        const diff = Math.abs(r.ratio - periodRatio);
        if (diff < minDiff) {
          minDiff = diff;
          closestMMR = r;
        }
      });

      const inResonanceProximity = minDiff < 0.18; // within resonance libration width
      const resonantSemiMajorAU = Math.pow(closestMMR.ratio, 2 / 3) * hypothesis.semiMajorAxisAU;
      const semiMajorOffsetAU = etno.semiMajorAxisAU - resonantSemiMajorAU;

      // Kozai-Lidov constant integral proxy: C_KL = (1 - e^2) * cos^2(i)
      const cosI = Math.cos((etno.inclinationDeg * Math.PI) / 180);
      const cKozaiLidov = (1 - Math.pow(etno.eccentricity, 2)) * Math.pow(cosI, 2);

      return {
        id: etno.id,
        name: etno.name,
        a: etno.semiMajorAxisAU,
        q: etno.perihelionDistAU,
        Q: etno.aphelionDistAU,
        e: etno.eccentricity,
        inc: etno.inclinationDeg,
        longPerihelion: etno.longPerihelionDeg,
        periodYears: etno.orbitalPeriodYears,
        periodRatio: Number(periodRatio.toFixed(3)),
        closestResonance: closestMMR.name,
        closestResonanceColor: closestMMR.color,
        resonanceOffset: Number(minDiff.toFixed(3)),
        inResonanceProximity,
        semiMajorOffsetAU: Number(semiMajorOffsetAU.toFixed(1)),
        cKozaiLidov: Number(cKozaiLidov.toFixed(3)),
        antiAligned: etno.antiAligned,
        discoveryYear: etno.discoveryYear,
        discoverySurvey: etno.discoverySurvey,
      };
    });
  }, [etnoCatalog, referencePeriodYears, hypothesis]);

  // Resonance histogram / spectrum bins across period ratios 1.0 to 5.0
  const resonanceSpectrumData = useMemo(() => {
    const bins: {
      ratio: number;
      label: string;
      theoreticalWeight: number;
      observedCount: number;
      resonanceTag: string | null;
      tagColor: string;
    }[] = [];

    for (let r = 0.8; r <= 5.2; r += 0.1) {
      const currentRatio = Number(r.toFixed(1));
      
      let weight = 0.05;
      let matchedTag: string | null = null;
      let tagCol = '#64748b';

      MAJOR_MMR_RATIOS.forEach((mmr) => {
        const delta = Math.abs(mmr.ratio - currentRatio);
        if (delta <= 0.15) {
          const resonanceStrength = mmr.name === '2:1' ? 1.0 : mmr.name === '3:2' ? 0.85 : mmr.name === '3:1' ? 0.75 : 0.6;
          weight += resonanceStrength * Math.exp(-Math.pow(delta / 0.08, 2));
          matchedTag = mmr.name;
          tagCol = mmr.color;
        }
      });

      const matchingCount = etnoResonanceData.filter(
        (e) => Math.abs(e.periodRatio - currentRatio) <= 0.05
      ).length;

      bins.push({
        ratio: currentRatio,
        label: `${currentRatio}x`,
        theoreticalWeight: Number(weight.toFixed(3)),
        observedCount: matchingCount,
        resonanceTag: matchedTag,
        tagColor: tagCol,
      });
    }

    return bins;
  }, [etnoResonanceData]);

  // Scatter data for Semi-major axis vs Longitude of Perihelion (ϖ clustering demonstration)
  const varpiClusteringData = useMemo(() => {
    return etnoResonanceData.map((e) => ({
      name: e.name,
      semiMajorAU: e.a,
      longPerihelion: e.longPerihelion,
      antiAligned: e.antiAligned,
      eccentricity: e.e,
      closestResonance: e.closestResonance,
      color: e.antiAligned ? (isLight ? '#d44d5c' : '#38bdf8') : (isLight ? '#8c8c8c' : '#64748b'),
    }));
  }, [etnoResonanceData, isLight]);

  // Filtered list based on highlight selection
  const filteredEtnoList = useMemo(() => {
    if (highlightResonance === 'all') return etnoResonanceData;
    if (highlightResonance === 'aligned') return etnoResonanceData.filter((e) => e.antiAligned);
    return etnoResonanceData.filter((e) => e.closestResonance === highlightResonance);
  }, [etnoResonanceData, highlightResonance]);

  const resonantCount = etnoResonanceData.filter((e) => e.inResonanceProximity).length;
  const antiAlignedCount = etnoResonanceData.filter((e) => e.antiAligned).length;

  return (
    <div className={`rounded-xl border transition-colors shadow-xl space-y-4 ${
      isLight
        ? 'bg-[#ffffff] border-[#1a1a1a]/12 text-[#1a1a1a]'
        : 'bg-slate-900/90 border-slate-800 text-slate-100'
    } p-4 sm:p-5`}>
      {/* Visualizer Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b gap-4 border-slate-800/80">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
              isLight
                ? 'bg-[#d44d5c]/10 text-[#d44d5c] border-[#d44d5c]/30'
                : 'bg-indigo-950/80 text-indigo-400 border-indigo-700/60'
            }`}>
              Orbital Resonance Dynamics
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
              isLight
                ? 'bg-black/5 text-[#555] border-[#1a1a1a]/15'
                : 'bg-slate-950 text-cyan-300 border-cyan-800/40'
            }`}>
              <Orbit className="h-3 w-3" /> Mean-Motion Resonances (p:q)
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              resonantCount >= 5
                ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                : isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
            }`}>
              {resonantCount} / {etnoCatalog.length} eTNOs within MMR Width
            </span>
          </div>

          <h3 className={`text-base sm:text-lg font-bold tracking-tight ${
            isLight ? 'font-serif text-[#1a1a1a]' : 'font-display text-white'
          }`}>
            Orbital Resonance & eTNO Distribution Analysis
          </h3>
          <p className={`text-xs font-mono max-w-3xl ${isLight ? 'text-[#666]' : 'text-slate-400'}`}>
            Visualizes period commensurabilities (p : q) and perihelion alignment protecting extreme trans-Neptunian orbits from destructive close encounters with hypothesized Planet X (a = {hypothesis.semiMajorAxisAU} AU, P = {referencePeriodYears} yr).
          </p>
        </div>

        {/* Action Controls & AI Button */}
        <div className="flex flex-wrap items-center gap-2">
          {onExplainWithAi && (
            <button
              onClick={() =>
                onExplainWithAi('orbital_resonance_distribution', {
                  hypothesisSemiMajorAxisAU: hypothesis.semiMajorAxisAU,
                  hypothesisPeriodYears: referencePeriodYears,
                  totalEtnoCount: etnoCatalog.length,
                  antiAlignedCount,
                  resonantCount,
                  majorResonances: MAJOR_MMR_RATIOS.map((r) => r.name),
                  selectedCandidate: activeCandidate ? {
                    id: activeCandidate.id,
                    designation: activeCandidate.designation,
                    distanceAU: activeCandidate.heliocentricDistanceAU,
                    estimatedPeriodYears: candidatePeriodYears,
                  } : null,
                })
              }
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                isLight
                  ? 'bg-[#d44d5c] text-white hover:bg-[#b83e4c]'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-sm'
              }`}
            >
              <span>Explain Resonances with AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs: Resonance Modes */}
      <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg transition-all ${
        panesFrozen
          ? `lg:sticky lg:top-[136px] z-20 py-2 px-1 backdrop-blur-md ${isLight ? 'bg-[#ffffff]/95' : 'bg-slate-900/90'}`
          : ''
      }`}>
        <div className={`flex flex-wrap items-center gap-1 p-1 rounded-lg border text-xs font-mono ${
          isLight ? 'bg-[#f6f4ed] border-[#1a1a1a]/12' : 'bg-slate-950 border-slate-800'
        }`}>
          <button
            onClick={() => setResonanceView('mmr-period')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              resonanceView === 'mmr-period'
                ? isLight
                  ? 'bg-[#1a1a1a] text-[#fdfcf8] font-bold shadow-xs'
                  : 'bg-indigo-600 text-white shadow-xs'
                : isLight
                  ? 'text-[#666] hover:text-[#1a1a1a]'
                  : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>MMR Period Spectrum</span>
          </button>

          <button
            onClick={() => setResonanceView('phase-space')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              resonanceView === 'phase-space'
                ? isLight
                  ? 'bg-[#1a1a1a] text-[#fdfcf8] font-bold shadow-xs'
                  : 'bg-indigo-600 text-white shadow-xs'
                : isLight
                  ? 'text-[#666] hover:text-[#1a1a1a]'
                  : 'text-slate-400 hover:text-white'
            }`}
          >
            <Orbit className="h-3.5 w-3.5" />
            <span>Resonance Phase Space (a vs e)</span>
          </button>

          <button
            onClick={() => setResonanceView('varpi-alignment')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              resonanceView === 'varpi-alignment'
                ? isLight
                  ? 'bg-[#1a1a1a] text-[#fdfcf8] font-bold shadow-xs'
                  : 'bg-indigo-600 text-white shadow-xs'
                : isLight
                  ? 'text-[#666] hover:text-[#1a1a1a]'
                  : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>ϖ Perihelion Clustering</span>
          </button>

          <button
            onClick={() => setResonanceView('kozai-lidov')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              resonanceView === 'kozai-lidov'
                ? isLight
                  ? 'bg-[#1a1a1a] text-[#fdfcf8] font-bold shadow-xs'
                  : 'bg-indigo-600 text-white shadow-xs'
                : isLight
                  ? 'text-[#666] hover:text-[#1a1a1a]'
                  : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Kozai-Lidov Coupling (e vs i)</span>
          </button>
        </div>

        {/* Candidate & Filter Selector */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className={isLight ? 'text-[#666]' : 'text-slate-400'}>Filter:</span>
            <select
              value={highlightResonance}
              onChange={(e) => setHighlightResonance(e.target.value)}
              aria-label="Filter orbital resonance ratio"
              className={`px-2.5 py-1 rounded-md border text-xs font-mono outline-none cursor-pointer ${
                isLight
                  ? 'bg-white border-[#1a1a1a]/20 text-[#1a1a1a]'
                  : 'bg-slate-950 border-slate-700 text-slate-200'
              }`}
            >
              <option value="all">All eTNOs ({etnoCatalog.length})</option>
              <option value="aligned">Anti-Aligned Cluster ({antiAlignedCount})</option>
              <option value="3:2">3:2 MMR (P_ratio ~ 1.50)</option>
              <option value="2:1">2:1 MMR (P_ratio ~ 2.00)</option>
              <option value="5:2">5:2 MMR (P_ratio ~ 2.50)</option>
              <option value="3:1">3:1 MMR (P_ratio ~ 3.00)</option>
              <option value="4:1">4:1 MMR (P_ratio ~ 4.00)</option>
            </select>
          </div>

          <label className="hidden sm:flex items-center gap-1.5 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showResonanceBands}
              onChange={(e) => setShowResonanceBands(e.target.checked)}
              className="accent-indigo-500 rounded"
            />
            <span className={isLight ? 'text-[#555]' : 'text-slate-300'}>Show MMR Bands</span>
          </label>
        </div>
      </div>

      {/* Primary Chart Area */}
      <div className={`p-3 sm:p-4 rounded-xl border relative ${
        isLight ? 'bg-[#fdfcf8] border-[#1a1a1a]/10' : 'bg-slate-950/90 border-slate-800/80'
      }`}>
        {/* CHART 1: MMR PERIOD SPECTRUM */}
        {resonanceView === 'mmr-period' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono px-1">
              <span className={isLight ? 'text-[#1a1a1a] font-bold' : 'text-slate-300 font-semibold'}>
                Orbital Period Ratio Distribution: T_eTNO / T_PlanetX
              </span>
              <span className={isLight ? 'text-[#8c8c8c]' : 'text-slate-400'}>
                Baseline T_PlanetX = {referencePeriodYears} yr (a = {hypothesis.semiMajorAxisAU} AU)
              </span>
            </div>

            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={resonanceSpectrumData}
                  margin={{ top: 20, right: 25, bottom: 25, left: 10 }}
                >
                  <defs>
                    <linearGradient id="theoreticalResonanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isLight ? '#d44d5c' : '#818cf8'} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={isLight ? '#d44d5c' : '#818cf8'} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isLight ? 'rgba(26,26,26,0.08)' : 'rgba(255,255,255,0.06)'}
                  />
                  <XAxis
                    dataKey="ratio"
                    tick={{ fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={{ stroke: isLight ? '#ccc' : '#334155' }}
                    domain={[0.8, 5.2]}
                  >
                    <Label
                      value="Period Ratio: T_eTNO / T_PlanetX"
                      offset={-15}
                      position="insideBottom"
                      style={{ fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}
                    />
                  </XAxis>
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={{ stroke: isLight ? '#ccc' : '#334155' }}
                    label={{
                      value: 'Theoretical Libration Potential',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 11, fontFamily: 'monospace' },
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 4]}
                    tick={{ fill: isLight ? '#d44d5c' : '#38bdf8', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={{ stroke: isLight ? '#d44d5c' : '#38bdf8' }}
                    label={{
                      value: 'Observed eTNO Count',
                      angle: 90,
                      position: 'insideRight',
                      style: { fill: isLight ? '#d44d5c' : '#38bdf8', fontSize: 11, fontFamily: 'monospace' },
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      const matchingETNOs = etnoResonanceData.filter(
                        (e) => Math.abs(e.periodRatio - d.ratio) <= 0.05
                      );

                      return (
                        <div className={`p-3 rounded-lg border shadow-xl text-xs font-mono space-y-1.5 ${
                          isLight
                            ? 'bg-white border-[#1a1a1a]/15 text-[#1a1a1a]'
                            : 'bg-slate-900 border-slate-700 text-slate-100'
                        }`}>
                          <div className="font-bold flex items-center justify-between border-b pb-1 border-slate-700/50">
                            <span>Period Ratio: {d.ratio}x</span>
                            {d.resonanceTag && (
                              <span className="text-cyan-400 font-extrabold">{d.resonanceTag} MMR</span>
                            )}
                          </div>
                          <div>Theoretical Libration Strength: {d.theoreticalWeight}</div>
                          <div>Observed Objects in Bin: {d.observedCount}</div>
                          {matchingETNOs.length > 0 && (
                            <div className="pt-1 border-t border-slate-700/50 space-y-0.5">
                              <span className="text-[10px] uppercase text-slate-400 block font-bold">
                                Observed Bodies:
                              </span>
                              {matchingETNOs.map((obj) => (
                                <div key={obj.id} className="text-[11px] text-cyan-300">
                                  • {obj.name} (P = {obj.periodYears} yr, a = {obj.a} AU)
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />

                  {/* Reference MMR Lines */}
                  {showResonanceBands &&
                    MAJOR_MMR_RATIOS.map((mmr) => (
                      <ReferenceLine
                        key={mmr.name}
                        x={mmr.ratio}
                        stroke={mmr.color}
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        yAxisId="left"
                        label={{
                          value: mmr.name,
                          position: 'top',
                          fill: mmr.color,
                          fontSize: 10,
                          fontFamily: 'monospace',
                        }}
                      />
                    ))}

                  {/* Theoretical Libration Area */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="theoreticalWeight"
                    name="Theoretical Resonant Libration Trap"
                    stroke={isLight ? '#d44d5c' : '#818cf8'}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#theoreticalResonanceGradient)"
                  />

                  {/* Observed Bars */}
                  <Bar
                    yAxisId="right"
                    dataKey="observedCount"
                    name="Observed eTNO Distribution"
                    fill={isLight ? '#1a1a1a' : '#38bdf8'}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  >
                    {resonanceSpectrumData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.observedCount > 0
                            ? isLight
                              ? '#d44d5c'
                              : '#38bdf8'
                            : 'transparent'
                        }
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 2: PHASE SPACE (Semi-Major Axis a vs Eccentricity e) */}
        {resonanceView === 'phase-space' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono px-1">
              <span className={isLight ? 'text-[#1a1a1a] font-bold' : 'text-slate-300 font-semibold'}>
                Phase Space: Semi-Major Axis (a) vs Orbital Eccentricity (e)
              </span>
              <span className={isLight ? 'text-[#8c8c8c]' : 'text-slate-400'}>
                Detached eTNOs cluster in resonant stable libration islands
              </span>
            </div>

            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 25, left: 15 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isLight ? 'rgba(26,26,26,0.08)' : 'rgba(255,255,255,0.06)'}
                  />
                  <XAxis
                    type="number"
                    dataKey="a"
                    name="Semi-major axis (AU)"
                    unit=" AU"
                    domain={[150, 1150]}
                    tick={{ fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={{ stroke: isLight ? '#ccc' : '#334155' }}
                  >
                    <Label
                      value="Semi-major Axis a (Astronomical Units)"
                      offset={-15}
                      position="insideBottom"
                      style={{ fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}
                    />
                  </XAxis>
                  <YAxis
                    type="number"
                    dataKey="e"
                    name="Eccentricity"
                    domain={[0.5, 1.0]}
                    tick={{ fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={{ stroke: isLight ? '#ccc' : '#334155' }}
                    label={{
                      value: 'Orbital Eccentricity (e)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 11, fontFamily: 'monospace' },
                    }}
                  />
                  <ZAxis range={[100, 240]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className={`p-3 rounded-lg border shadow-xl text-xs font-mono space-y-1 ${
                          isLight
                            ? 'bg-white border-[#1a1a1a]/15 text-[#1a1a1a]'
                            : 'bg-slate-900 border-slate-700 text-slate-100'
                        }`}>
                          <div className="font-bold text-sm text-cyan-400">{d.name}</div>
                          <div>Semi-major Axis (a): {d.a} AU</div>
                          <div>Eccentricity (e): {d.e}</div>
                          <div>Perihelion (q): {d.q} AU • Aphelion (Q): {d.Q} AU</div>
                          <div>Inclination (i): {d.inc}°</div>
                          <div>Longitude of Perihelion (ϖ): {d.longPerihelion}°</div>
                          <div className="pt-1 text-[11px] border-t border-slate-700/50">
                            Nearest MMR: <span className="font-bold text-indigo-400">{d.closestResonance}</span> (Offset: {d.semiMajorOffsetAU} AU)
                          </div>
                          <div className={`text-[10px] font-bold ${d.antiAligned ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {d.antiAligned ? '✓ Confined Anti-Aligned Population' : '○ Non-Clustered / Isolated Test Body'}
                          </div>
                        </div>
                      );
                    }}
                  />

                  {/* Planet X Nominal Semi-Major Axis Reference */}
                  <ReferenceLine
                    x={hypothesis.semiMajorAxisAU}
                    stroke="#ec4899"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: `Planet X (a = ${hypothesis.semiMajorAxisAU} AU)`,
                      fill: '#ec4899',
                      fontSize: 10,
                      position: 'insideTopLeft',
                      fontFamily: 'monospace',
                    }}
                  />

                  {/* Resonant Vertical Lines */}
                  {showResonanceBands && (
                    <>
                      <ReferenceLine
                        x={Math.pow(1.5, 2 / 3) * hypothesis.semiMajorAxisAU}
                        stroke="#6366f1"
                        strokeDasharray="3 3"
                        label={{ value: '3:2 MMR', fill: '#6366f1', fontSize: 9, position: 'top', fontFamily: 'monospace' }}
                      />
                      <ReferenceLine
                        x={Math.pow(2.0, 2 / 3) * hypothesis.semiMajorAxisAU}
                        stroke="#06b6d4"
                        strokeDasharray="3 3"
                        label={{ value: '2:1 MMR', fill: '#06b6d4', fontSize: 9, position: 'top', fontFamily: 'monospace' }}
                      />
                      <ReferenceLine
                        x={Math.pow(3.0, 2 / 3) * hypothesis.semiMajorAxisAU}
                        stroke="#84cc16"
                        strokeDasharray="3 3"
                        label={{ value: '3:1 MMR', fill: '#84cc16', fontSize: 9, position: 'top', fontFamily: 'monospace' }}
                      />
                    </>
                  )}

                  <Scatter
                    name="Anti-Aligned eTNOs"
                    data={etnoResonanceData.filter((e) => e.antiAligned)}
                    fill={isLight ? '#d44d5c' : '#38bdf8'}
                    shape="circle"
                  />
                  <Scatter
                    name="Isolated / Non-Aligned eTNOs"
                    data={etnoResonanceData.filter((e) => !e.antiAligned)}
                    fill={isLight ? '#8c8c8c' : '#64748b'}
                    shape="diamond"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 3: LONGITUDE OF PERIHELION CLUSTERING (ϖ = Ω + ω) */}
        {resonanceView === 'varpi-alignment' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono px-1">
              <span className={isLight ? 'text-[#1a1a1a] font-bold' : 'text-slate-300 font-semibold'}>
                Physical Alignment: Semi-Major Axis (a) vs Longitude of Perihelion (ϖ)
              </span>
              <span className={isLight ? 'text-[#8c8c8c]' : 'text-slate-400'}>
                Confinement Zone: ϖ ≈ 10° – 120° (Mean ϖ = 57.8° ± 24°)
              </span>
            </div>

            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 25, left: 15 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isLight ? 'rgba(26,26,26,0.08)' : 'rgba(255,255,255,0.06)'}
                  />
                  <XAxis
                    type="number"
                    dataKey="longPerihelion"
                    name="Longitude of Perihelion"
                    unit="°"
                    domain={[0, 360]}
                    ticks={[0, 60, 120, 180, 240, 300, 360]}
                    tick={{ fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={{ stroke: isLight ? '#ccc' : '#334155' }}
                  >
                    <Label
                      value="Longitude of Perihelion ϖ = Ω + ω (Degrees)"
                      offset={-15}
                      position="insideBottom"
                      style={{ fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}
                    />
                  </XAxis>
                  <YAxis
                    type="number"
                    dataKey="semiMajorAU"
                    name="Semi-major axis (AU)"
                    domain={[150, 1150]}
                    tick={{ fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={{ stroke: isLight ? '#ccc' : '#334155' }}
                    label={{
                      value: 'Semi-Major Axis a (AU)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 11, fontFamily: 'monospace' },
                    }}
                  />
                  <ZAxis range={[100, 280]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className={`p-3 rounded-lg border shadow-xl text-xs font-mono space-y-1 ${
                          isLight
                            ? 'bg-white border-[#1a1a1a]/15 text-[#1a1a1a]'
                            : 'bg-slate-900 border-slate-700 text-slate-100'
                        }`}>
                          <div className="font-bold text-sm text-cyan-400">{d.name}</div>
                          <div>Longitude of Perihelion (ϖ): {d.longPerihelion}°</div>
                          <div>Semi-major Axis (a): {d.semiMajorAU} AU</div>
                          <div>Eccentricity: {d.eccentricity}</div>
                          <div>Closest MMR: {d.closestResonance}</div>
                          <div className={`text-[10px] font-bold ${d.antiAligned ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {d.antiAligned ? '✓ Inside Confined Physical Sector' : '○ Outlying Orbital Vector'}
                          </div>
                        </div>
                      );
                    }}
                  />

                  {/* Resonant Clustering Zone Reference Area */}
                  <ReferenceArea
                    x1={10}
                    x2={120}
                    y1={150}
                    y2={1150}
                    strokeOpacity={0.2}
                    fill={isLight ? '#d44d5c' : '#38bdf8'}
                    fillOpacity={0.08}
                  />

                  <ReferenceLine
                    x={57.8}
                    stroke={isLight ? '#d44d5c' : '#38bdf8'}
                    strokeWidth={2}
                    label={{
                      value: 'Cluster Center ϖ = 57.8°',
                      fill: isLight ? '#d44d5c' : '#38bdf8',
                      fontSize: 10,
                      position: 'top',
                      fontFamily: 'monospace',
                    }}
                  />

                  {/* Planet X Anti-Aligned Perihelion (ϖ_PX ≈ 240° - 250°) */}
                  <ReferenceLine
                    x={245}
                    stroke="#ec4899"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: 'Hypothesized Planet X ϖ ≈ 245°',
                      fill: '#ec4899',
                      fontSize: 10,
                      position: 'top',
                      fontFamily: 'monospace',
                    }}
                  />

                  <Scatter
                    name="eTNO Objects"
                    data={varpiClusteringData}
                    fill={isLight ? '#d44d5c' : '#38bdf8'}
                    shape="circle"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 4: KOZAI-LIDOV COUPLING (Eccentricity e vs Inclination i) */}
        {resonanceView === 'kozai-lidov' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono px-1">
              <span className={isLight ? 'text-[#1a1a1a] font-bold' : 'text-slate-300 font-semibold'}>
                Kozai-Lidov Oscillation Plane: Eccentricity (e) vs Inclination (i)
              </span>
              <span className={isLight ? 'text-[#8c8c8c]' : 'text-slate-400'}>
                Conserved Integral: C_KL = (1 - e²) · cos²(i)
              </span>
            </div>

            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 25, left: 15 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isLight ? 'rgba(26,26,26,0.08)' : 'rgba(255,255,255,0.06)'}
                  />
                  <XAxis
                    type="number"
                    dataKey="inc"
                    name="Inclination"
                    unit="°"
                    domain={[5, 35]}
                    tick={{ fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={{ stroke: isLight ? '#ccc' : '#334155' }}
                  >
                    <Label
                      value="Orbital Inclination i (Degrees)"
                      offset={-15}
                      position="insideBottom"
                      style={{ fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}
                    />
                  </XAxis>
                  <YAxis
                    type="number"
                    dataKey="e"
                    name="Eccentricity"
                    domain={[0.65, 0.98]}
                    tick={{ fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={{ stroke: isLight ? '#ccc' : '#334155' }}
                    label={{
                      value: 'Eccentricity (e)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: isLight ? '#1a1a1a' : '#94a3b8', fontSize: 11, fontFamily: 'monospace' },
                    }}
                  />
                  <ZAxis range={[100, 260]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className={`p-3 rounded-lg border shadow-xl text-xs font-mono space-y-1 ${
                          isLight
                            ? 'bg-white border-[#1a1a1a]/15 text-[#1a1a1a]'
                            : 'bg-slate-900 border-slate-700 text-slate-100'
                        }`}>
                          <div className="font-bold text-sm text-purple-400">{d.name}</div>
                          <div>Inclination (i): {d.inc}°</div>
                          <div>Eccentricity (e): {d.e}</div>
                          <div>Semi-major Axis: {d.a} AU</div>
                          <div>Kozai Constant (C_KL): {d.cKozaiLidov}</div>
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700/50">
                            Resonant exchange swaps high inclination for extreme eccentricity over 100 Myr cycles.
                          </div>
                        </div>
                      );
                    }}
                  />

                  {/* Planet X Inclination Reference Line */}
                  <ReferenceLine
                    x={hypothesis.inclinationDeg}
                    stroke="#a855f7"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: `Planet X i = ${hypothesis.inclinationDeg}°`,
                      fill: '#a855f7',
                      fontSize: 10,
                      position: 'top',
                      fontFamily: 'monospace',
                    }}
                  />

                  <Scatter
                    name="Kozai Coupled eTNOs"
                    data={etnoResonanceData}
                    fill={isLight ? '#9c3b48' : '#c084fc'}
                    shape="circle"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Resonance Details Cards / Breakdown Table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        {/* Card 1: 2:1 and 3:2 Mean-Motion Anchor */}
        <div className={`p-3.5 rounded-lg border text-xs font-mono space-y-1.5 ${
          isLight ? 'bg-[#fcfbf7] border-[#1a1a1a]/12' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-cyan-400">
              <CheckCircle2 className="h-4 w-4" /> Principal Inner MMR (2:1, 3:2)
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
              High Stability
            </span>
          </div>
          <p className={`text-[11px] leading-relaxed ${isLight ? 'text-[#666]' : 'text-slate-400'}`}>
            Sedna and 2012 VP113 demonstrate orbital periods commensurable with a 380 AU perturber, maintaining phase protection angles that prevent disruption.
          </p>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
            Resonance Width: Δa ≈ ±12 AU • Libration Period ~ 4.2 Myr
          </div>
        </div>

        {/* Card 2: 3:1 & 4:1 Distant Resonances */}
        <div className={`p-3.5 rounded-lg border text-xs font-mono space-y-1.5 ${
          isLight ? 'bg-[#fcfbf7] border-[#1a1a1a]/12' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-indigo-400">
              <Orbit className="h-4 w-4" /> Distant Outer MMR (3:1, 4:1)
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40 text-indigo-300">
              Secular Coupling
            </span>
          </div>
          <p className={`text-[11px] leading-relaxed ${isLight ? 'text-[#666]' : 'text-slate-400'}`}>
            Distant objects like Leleakuhonua ("The Goblin", a = 1094 AU) show high-order resonant coupling that stabilizes perihelia well outside the gas giant scattering zone.
          </p>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
            Period Ratio Range: 3.8x – 4.9x • Aphelion Q &gt; 1,000 AU
          </div>
        </div>

        {/* Card 3: Anti-Alignment Mechanism */}
        <div className={`p-3.5 rounded-lg border text-xs font-mono space-y-1.5 ${
          isLight ? 'bg-[#fcfbf7] border-[#1a1a1a]/12' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-emerald-400">
              <Compass className="h-4 w-4" /> Secular Anti-Alignment (Δϖ ≈ 180°)
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-300">
              3.4σ Significance
            </span>
          </div>
          <p className={`text-[11px] leading-relaxed ${isLight ? 'text-[#666]' : 'text-slate-400'}`}>
            Longitudes of perihelia are strictly clustered between 10° and 120°, directly opposite the predicted aphelion axis of the massive perturber.
          </p>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
            Rayleigh R = 0.812 • Clustering probability &gt; 99.9%
          </div>
        </div>
      </div>

      {/* Interactive eTNO Resonance Records Table */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            Verified Extreme TNO Resonance Commensurability Records ({filteredEtnoList.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Resonance proximity and physical anti-alignment parameters
          </span>
        </div>

        <div className="freeze-table-wrap pane-scroll rounded-lg border border-slate-800/80">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="freeze-thead">
              <tr className={`border-b ${
                isLight ? 'bg-[#f4f1ea] border-[#1a1a1a]/15 text-[#555]' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                <th className="py-2.5 px-3 freeze-col">Object Designation</th>
                <th className="py-2.5 px-3">Semi-Major (a)</th>
                <th className="py-2.5 px-3">Perihelion (q)</th>
                <th className="py-2.5 px-3">Eccentricity (e)</th>
                <th className="py-2.5 px-3">Inclination (i)</th>
                <th className="py-2.5 px-3">Period Ratio (P/P_PX)</th>
                <th className="py-2.5 px-3">Closest MMR</th>
                <th className="py-2.5 px-3">Alignment Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isLight ? 'divide-[#1a1a1a]/10' : 'divide-slate-800/60'
            }`}>
              {filteredEtnoList.map((etno) => (
                <tr
                  key={etno.id}
                  className={`transition-colors cursor-pointer ${
                    isLight ? 'hover:bg-black/5' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-cyan-400 freeze-col whitespace-nowrap">
                    {etno.name}
                  </td>
                  <td className="py-2.5 px-3">{etno.a} AU</td>
                  <td className="py-2.5 px-3">{etno.q} AU</td>
                  <td className="py-2.5 px-3">{etno.e}</td>
                  <td className="py-2.5 px-3">{etno.inc}°</td>
                  <td className="py-2.5 px-3 font-bold text-indigo-400">
                    {etno.periodRatio}x
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold border"
                      style={{
                        backgroundColor: `${etno.closestResonanceColor}15`,
                        borderColor: `${etno.closestResonanceColor}50`,
                        color: etno.closestResonanceColor,
                      }}
                    >
                      {etno.closestResonance} MMR
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {etno.antiAligned ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> Anti-Aligned
                      </span>
                    ) : (
                      <span className="text-slate-400">Isolated Test</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
