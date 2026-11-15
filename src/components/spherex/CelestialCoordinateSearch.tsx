/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BLACK STAR ORBIT — Celestial Coordinate Search & Challenge Target Benchmarks
 * NASA Space Apps Challenge 2026: Planet X and SPHEREx
 */

import React, { useState } from 'react';
import {
  CHALLENGE_BENCHMARK_TARGETS,
  ChallengeBenchmarkTarget,
  parseCelestialCoordinates,
  formatSexagesimalRA,
  formatSexagesimalDec,
} from '../../science/spherexCoordinates.ts';
import {
  Search,
  Compass,
  Sparkles,
  ExternalLink,
  Share2,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface CelestialCoordinateSearchProps {
  currentRa: number;
  currentDec: number;
  currentFovArcmin: number;
  activeTargetName: string;
  selectedDetectorBand: string;
  isSearchingLive?: boolean;
  onChangeDetectorBand: (band: string) => void;
  onSelectBenchmark: (target: ChallengeBenchmarkTarget) => void;
  onSearchCoordinates: (raDeg: number, decDeg: number, targetName?: string) => void;
  onSearchTargetName: (query: string) => void;
  isLight?: boolean;
}

const SPHEREX_ARRAY_BANDS = [
  { id: '', label: 'All Arrays (Multi-Band)' },
  { id: 'D1', label: 'D1 (0.75–1.11 µm)' },
  { id: 'D2', label: 'D2 (1.11–1.64 µm)' },
  { id: 'D3', label: 'D3 (1.64–2.42 µm)' },
  { id: 'D4', label: 'D4 (2.42–3.82 µm)' },
  { id: 'D5', label: 'D5 (3.82–4.42 µm)' },
  { id: 'D6', label: 'D6 (4.42–5.00 µm)' },
];

export const CelestialCoordinateSearch: React.FC<CelestialCoordinateSearchProps> = ({
  currentRa,
  currentDec,
  currentFovArcmin,
  activeTargetName,
  selectedDetectorBand,
  isSearchingLive = false,
  onChangeDetectorBand,
  onSelectBenchmark,
  onSearchCoordinates,
  onSearchTargetName,
  isLight = false,
}) => {
  const [targetQuery, setTargetQuery] = useState<string>('');
  const [raInput, setRaInput] = useState<string>('');
  const [decInput, setDecInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const activeBenchmark = CHALLENGE_BENCHMARK_TARGETS.find(
    (t) =>
      Math.abs(t.raDeg - currentRa) < 0.015 &&
      Math.abs(t.decDeg - currentDec) < 0.015
  );

  const handleCoordinateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!raInput.trim() && !decInput.trim() && targetQuery.trim()) {
      onSearchTargetName(targetQuery.trim());
      return;
    }

    const parsed = parseCelestialCoordinates(raInput, decInput);
    if (!parsed.valid) {
      setErrorMsg(parsed.error || 'Invalid coordinates format.');
      return;
    }

    onSearchCoordinates(parsed.raDeg, parsed.decDeg);
  };

  const handleTargetNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmed = targetQuery.trim();
    if (!trimmed) {
      setErrorMsg('Enter an object name (e.g., "Barnard\'s Star", "WISE 0855") or RA/Dec pair.');
      return;
    }
    onSearchTargetName(trimmed);
  };

  const handleCopyShareLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'spherex');
      url.searchParams.set('ra', currentRa.toFixed(4));
      url.searchParams.set('dec', currentDec.toFixed(4));
      url.searchParams.set('fov', currentFovArcmin.toString());
      if (activeBenchmark) {
        url.searchParams.set('target', activeBenchmark.id);
      }
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const aladinUrl = `https://aladin.cds.unistra.fr/AladinLite/?target=${currentRa.toFixed(4)}%20${currentDec.toFixed(4)}&fov=${(currentFovArcmin / 60).toFixed(3)}&survey=P%2FALLWISE%2Fcolor`;
  const spherexExplorerUrl = 'https://irsa.ipac.caltech.edu/applications/SPHEREx/';

  return (
    <div
      className={`rounded-xl border transition-all ${
        isLight
          ? 'bg-white border-[#1a1a1a]/15 shadow-xs'
          : 'bg-[#090f1f]/95 border-cyan-500/20 shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
      }`}
    >
      {/* Header bar */}
      <div
        className={`px-4 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          isLight ? 'border-[#1a1a1a]/10 bg-black/2' : 'border-white/10 bg-white/2'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-lg border ${
              isLight
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}
          >
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'font-mono text-[#1a1a1a]' : 'font-nasa text-white'
                }`}
              >
                Infrared Sky Time Machine — Target & Coordinate Query
              </h3>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  isLight
                    ? 'bg-black/5 border-[#1a1a1a]/15 text-[#1a1a1a]'
                    : 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300'
                }`}
              >
                IRSA SPHEREx DR1 & QR3
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {activeTargetName} • RA {formatSexagesimalRA(currentRa)} ({currentRa.toFixed(4)}°) • Dec{' '}
              {formatSexagesimalDec(currentDec)} ({currentDec.toFixed(4)}°)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyShareLink}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition border cursor-pointer ${
              copiedLink
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : isLight
                  ? 'bg-white border-[#1a1a1a]/20 text-[#1a1a1a] hover:border-[#1a1a1a]'
                  : 'bg-slate-900 border-white/10 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300'
            }`}
            title="Copy shareable URL for these celestial coordinates"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          <a href={spherexExplorerUrl} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition border cursor-pointer ${isLight ? 'bg-white border-[#1a1a1a]/20 text-[#1a1a1a] hover:border-[#1a1a1a]' : 'bg-slate-900 border-white/10 text-cyan-300 hover:border-cyan-500/40'}`}
            title="Search and download real SPHEREx observations from NASA/IPAC IRSA">
            <ExternalLink className="w-3.5 h-3.5" /><span>SPHEREx Data Explorer</span>
          </a>

          <a
            href={aladinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition border cursor-pointer ${
              isLight
                ? 'bg-white border-[#1a1a1a]/20 text-[#1a1a1a] hover:border-[#1a1a1a]'
                : 'bg-slate-900 border-white/10 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300'
            }`}
            title="Inspect this sky coordinate in CDS Aladin Lite"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Aladin</span>
          </a>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Benchmark Presets Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-[11px] font-mono uppercase font-bold tracking-wider ${
                isLight ? 'text-[#d44d5c]' : 'text-cyan-400'
              }`}
            >
              NASA Space Apps 5 Validation Targets (Click to Query Live IRSA DR1/QR3):
            </span>
            {isSearchingLive && (
              <span className="text-[11px] text-cyan-300 font-mono flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Querying IRSA SIAv2 + FITS + Gaia DR3 + AllWISE...
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {CHALLENGE_BENCHMARK_TARGETS.map((target) => {
              const isSelected = activeBenchmark?.id === target.id;
              return (
                <button
                  key={target.id}
                  disabled={isSearchingLive}
                  onClick={() => onSelectBenchmark(target)}
                  className={`text-left p-3 min-h-[88px] rounded-lg border transition-all cursor-pointer flex flex-col justify-between disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 ${
                    isSelected
                      ? isLight
                        ? 'bg-[#172536] border-[#172536] text-white shadow-md shadow-slate-900/15'
                        : 'bg-cyan-600/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                      : isLight
                        ? 'bg-white hover:bg-[#f0f6fa] border-[#cbd5e1] hover:border-[#7893a8] text-[#172536] shadow-sm'
                        : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold leading-snug truncate ${isLight ? (isSelected ? 'text-white' : 'text-[#172536]') : 'text-inherit'}`}>{target.name}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 animate-ping" />}
                    </div>
                    <div className={`mt-1 text-[10px] leading-snug truncate font-mono ${isLight ? (isSelected ? 'text-slate-200' : 'text-[#526174]') : 'text-inherit opacity-80'}`}>
                      {target.category === 'High Proper Motion Stars' && 'μ = 10.3″/yr'}
                      {target.category === 'Brown Dwarfs' &&
                        (target.id === 'WISE-0855' ? 'Cold Y-Dwarf (250K)' : 'T1+T6 Binary Pair')}
                      {target.category === 'Variable Stars' &&
                        (target.id === 'RW-AURIGAE' ? 'T Tauri Dust Dips' : 'Mira Red Giant')}
                    </div>
                  </div>

                  <div className={`pt-2 mt-2 border-t flex items-center justify-between text-[10px] font-mono font-medium ${isLight ? (isSelected ? 'border-white/20 text-slate-200' : 'border-[#d8e0e8] text-[#526174]') : 'border-white/10 text-inherit opacity-80'}`}>
                    <span>{target.sexagesimalRa.split(' ')[0]}</span>
                    <span>{target.sexagesimalDec.split(' ')[0]}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Name Search & Custom Coordinates Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-2 border-t border-white/10">
          {/* Quick Name / Designator Resolver */}
          <form onSubmit={handleTargetNameSubmit} className="lg:col-span-5 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Object Name or Target Query
              </label>
              <input
                type="text"
                value={targetQuery}
                onChange={(e) => {
                  setTargetQuery(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Barnard's Star, WISE 0855, RW Aurigae..."
                className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border focus:outline-none transition ${
                  isLight
                    ? 'bg-white border-[#1a1a1a]/20 text-[#1a1a1a] focus:border-[#d44d5c]'
                    : 'bg-[#050b1a] border-white/15 text-white focus:border-cyan-400'
                }`}
              />
            </div>
            <div className="sm:self-end">
              <button
                type="submit"
                disabled={isSearchingLive}
                className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer border disabled:opacity-50 ${
                  isLight
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] hover:bg-black/80'
                    : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border-indigo-500/50'
                }`}
              >
                {isSearchingLive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Resolve</span>
              </button>
            </div>
          </form>

          {/* Direct RA/Dec + Detector Band Form */}
          <form onSubmit={handleCoordinateSubmit} className="lg:col-span-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Right Ascension (RA)
              </label>
              <input
                type="text"
                value={raInput}
                onChange={(e) => {
                  setRaInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="08h55m10.831s or 133.795"
                className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border focus:outline-none transition ${
                  isLight
                    ? 'bg-white border-[#1a1a1a]/20 text-[#1a1a1a] focus:border-[#d44d5c]'
                    : 'bg-[#050b1a] border-white/15 text-white focus:border-cyan-400'
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Declination (Dec)
              </label>
              <input
                type="text"
                value={decInput}
                onChange={(e) => {
                  setDecInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="-7d14m42.53s or -7.245"
                className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border focus:outline-none transition ${
                  isLight
                    ? 'bg-white border-[#1a1a1a]/20 text-[#1a1a1a] focus:border-[#d44d5c]'
                    : 'bg-[#050b1a] border-white/15 text-white focus:border-cyan-400'
                }`}
              />
            </div>

            <div className="sm:w-36">
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Detector Array
              </label>
              <select
                value={selectedDetectorBand}
                onChange={(e) => onChangeDetectorBand(e.target.value)}
                aria-label="SPHEREx detector array band filter"
                className={`w-full px-2 py-1.5 text-xs font-mono rounded-lg border focus:outline-none cursor-pointer ${
                  isLight
                    ? 'bg-white border-[#1a1a1a]/20 text-[#1a1a1a]'
                    : 'bg-[#050b1a] border-white/15 text-cyan-300'
                }`}
              >
                {SPHEREX_ARRAY_BANDS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:self-end">
              <button
                type="submit"
                disabled={isSearchingLive}
                className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider font-mono transition cursor-pointer border disabled:opacity-50 ${
                  isLight
                    ? 'bg-[#d44d5c] text-white border-[#d44d5c] hover:bg-[#b83e4c]'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                }`}
              >
                {isSearchingLive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Fetch IRSA</span>
              </button>
            </div>
          </form>
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-400 flex items-center gap-1.5 font-mono">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Active Benchmark Target Intel Banner */}
        {activeBenchmark && (
          <div
            className={`p-3 rounded-lg border text-xs font-mono space-y-2 ${
              isLight
                ? 'bg-[#f4f1ea] border-[#1a1a1a]/15 text-[#1a1a1a]'
                : 'bg-[#050e24] border-cyan-500/30 text-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-cyan-300">
                  {activeBenchmark.name} ({activeBenchmark.designation})
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                  {activeBenchmark.spectralType}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Distance: {activeBenchmark.distanceLightYears} ly • Proper Motion:{' '}
                {activeBenchmark.properMotionArcsecYr}″/yr
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
              {activeBenchmark.scienceHighlights}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-slate-400">
              <span>
                <strong>Gaia DR3:</strong> {activeBenchmark.gaiaDr3Id}
              </span>
              <span>•</span>
              <span>
                <strong>AllWISE:</strong> {activeBenchmark.allwiseId}
              </span>
              <span>•</span>
              <span>
                <strong>PM Vector:</strong> [{activeBenchmark.pmRaMasYr} mas/yr RA, {activeBenchmark.pmDecMasYr}{' '}
                mas/yr Dec]
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
