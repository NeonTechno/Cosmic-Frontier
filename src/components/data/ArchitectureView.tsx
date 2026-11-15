/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * COSMIC FRONTIER — System Architecture & NASA Data Integration Roadmap
 */

import React, { useState } from 'react';
import { OFFICIAL_NASA_DATA_SOURCES, testEndpointReadiness } from '../../science/dataConnector.ts';
import { FreezePaneButton } from '../common/FreezePaneButton.tsx';
import {
  Database,
  Telescope,
  Orbit,
  Sparkles,
  Server,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Code2,
  Terminal,
  RefreshCw,
  Clock,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [panesFrozen, setPanesFrozen] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<string>('arch-overview');
  const [pingResults, setPingResults] = useState<
    Record<string, { reachable: boolean; latencyMs: number; message: string }>
  >({});

  const jumpToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTestPing = async (serviceId: string) => {
    setTestingId(serviceId);
    try {
      const res = await testEndpointReadiness(serviceId);
      setPingResults((prev) => ({
        ...prev,
        [serviceId]: {
          reachable: res.isReachable,
          latencyMs: res.latencyMs,
          message: res.message,
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const sections = [
    { id: 'arch-overview', label: '0. Mission Overview' },
    { id: 'arch-pillars', label: '1. Architecture Pillars' },
    { id: 'arch-connectors', label: `2. Live Connectors (${OFFICIAL_NASA_DATA_SOURCES.length})` },
    { id: 'arch-methodology', label: '3. Methodology & Caveats' },
  ];

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[235px_1fr] gap-6 items-start">
      {/* Frozen Section Index Rail */}
      <aside className={`${panesFrozen ? 'lg:sticky lg:top-[84px] self-start' : ''} bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3`}>
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
          <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Section Index
          </span>
          <FreezePaneButton
            frozen={panesFrozen}
            onToggle={() => setPanesFrozen((v) => !v)}
            label="Freeze"
          />
        </div>

        <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pane-scroll pb-1 lg:pb-0">
          {sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => jumpToSection(sec.id)}
              className={`text-left px-3 py-2 rounded-lg text-xs font-mono transition whitespace-nowrap lg:whitespace-normal cursor-pointer border ${
                activeSection === sec.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-semibold'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-white hover:border-slate-700'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </nav>

        <div className="hidden lg:block pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>Pixel Scale:</span>
            <span className="text-cyan-300">6.15″/px</span>
          </div>
          <div className="flex justify-between">
            <span>Spectral Bands:</span>
            <span className="text-cyan-300">102 LVF</span>
          </div>
          <div className="flex justify-between">
            <span>Endpoints:</span>
            <span className="text-emerald-400">{OFFICIAL_NASA_DATA_SOURCES.length} APIs</span>
          </div>
        </div>
      </aside>

      {/* Main Scrollable Specification Document */}
      <div className="space-y-6 min-w-0">
      {/* Hero Header */}
      <div id="arch-overview" className="scroll-mt-24 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-3">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2.5 py-1 rounded border border-purple-800/60">
            System Architecture & NASA Integration
          </span>
          <span className="font-mono text-xs text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Live IRSA DR1/QR3 + Gaia DR3 + AllWISE
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          BLACK STAR ORBIT — The Infrared Sky Time Machine
        </h2>
        <p className="text-sm text-slate-300 font-sans leading-relaxed max-w-3xl">
          Built for NASA Space Apps Challenge 2026 (Planet X and SPHEREx). Connects directly to NASA/IPAC IRSA SIAv2 &amp; IBE servers to download calibrated SPHEREx Level-2 Multi-Extension FITS cutouts (IMAGE, FLAGS, VARIANCE, ZODI), reprojects roll-rotated frames onto a North-Up East-Left ICRS grid, and cross-matches ESA Gaia DR3 astrometry and 2010 AllWISE baselines.
        </p>
      </div>

      {/* Grid of Key Architecture Pillars */}
      <div id="arch-pillars" className="scroll-mt-24 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xl">
          <div className="h-10 w-10 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60 flex items-center justify-center">
            <Telescope className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide">
            1. Live IRSA SPHEREx Time Machine
          </h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Queries <code>spherex_dr1</code> and <code>spherex_qr3</code> via SIAv2, fetches IBE MEF cutouts across D1–D6 (0.75–5.00 µm), solves TAN-SIP WCS roll angles into North-Up grids, and computes Zodi-subtracted aperture photometry &amp; variance-weighted difference imaging.
          </p>
          <div className="pt-2 border-t border-slate-800/80 font-mono text-[11px] text-cyan-400">
            Pixel Scale: 6.15″ / pixel • HDU 1–4 Parsed
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xl">
          <div className="h-10 w-10 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center">
            <Orbit className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide">
            2. Multi-Catalog Astrometry &amp; Triage
          </h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Pairs SPHEREx (2025–2026) with 2010 AllWISE W1/W2 coadds (15-year motion baseline) and live ESA Gaia DR3 proper motions. Strictly distinguishes observed residuals, unconfirmed candidates, and confirmed discoveries.
          </p>
          <div className="pt-2 border-t border-slate-800/80 font-mono text-[11px] text-indigo-400">
            Gaia DR3 TAP + AllWISE IBE + WiseView
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xl">
          <div className="h-10 w-10 rounded-lg bg-purple-950 text-purple-400 border border-purple-800/60 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide">
            3. Scientific Honesty &amp; Limitations
          </h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Explicitly badges live IRSA archive frames vs. simulated fallback data. Accounts for LVF spatial-wavelength coupling, 6.15″/px undersampling, and notes that NEOSSat monitors orbital debris/bright inner-SS asteroids rather than deep outer-SS Planet X.
          </p>
          <div className="pt-2 border-t border-slate-800/80 font-mono text-[11px] text-purple-400">
            Zero Fabricated Detections
          </div>
        </div>
      </div>

      {/* Official Data Integration & Protocol Diagnostic Panel */}
      <div id="arch-connectors" className="scroll-mt-24 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                NASA, Caltech/IPAC &amp; ESA Live Data Connector Status
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Real-time HTTP connectivity check against official archive servers
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            Total Endpoints: {OFFICIAL_NASA_DATA_SOURCES.length}
          </span>
        </div>

        <div className="space-y-3">
          {OFFICIAL_NASA_DATA_SOURCES.map((source) => {
            const ping = pingResults[source.serviceId];
            const isTesting = testingId === source.serviceId;

            return (
              <div
                key={source.serviceId}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 space-y-2 text-xs font-mono"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{source.name}</span>
                      <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-cyan-300">
                        {source.protocol}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{source.organization}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        source.status === 'ONLINE_AVAILABLE'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : source.status === 'PRE_LAUNCH_SPEC'
                          ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      {source.status.replace('_', ' ')}
                    </span>

                    <button
                      disabled={isTesting}
                      onClick={() => handleTestPing(source.serviceId)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  {source.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-900">
                  <span className="truncate max-w-md text-slate-500">
                    Endpoint: {source.endpointUrl}
                  </span>
                  <a
                    href={source.documentationRef}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:underline"
                  >
                    <span>Documentation</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {ping && (
                  <div
                    className={`p-2.5 rounded-lg text-[11px] flex items-center justify-between ${
                      ping.reachable
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                        : 'bg-red-950/40 text-red-300 border border-red-800/40'
                    }`}
                  >
                    <span>{ping.message}</span>
                    <span className="font-bold">{ping.latencyMs} ms latency</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Methodology, Known Limitations & Future Roadmap */}
      <div id="arch-methodology" className="scroll-mt-24 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
          <Clock className="h-5 w-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Methodology, Scientific Limitations &amp; Next-Phase Integrations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-cyan-400 font-bold block text-sm">
              Current SPHEREx Pipeline &amp; Caveats
            </span>
            <ul className="space-y-1.5 text-slate-300 font-sans leading-relaxed text-[11px]">
              <li>
                <strong>• Band &amp; Roll Coupling:</strong> SPHEREx Level-2 images come from Linear Variable Filters; different dates often hit slightly different wavelengths and roll angles. Our North-Up bilinear reprojection enables blinking, while difference peaks near bright stars can include chromatic PSF residuals.
              </li>
              <li>
                <strong>• Coarse Plate Scale:</strong> At 6.15″/pixel, sub-pixel motions (~1–5″/yr) require comparing epochs &gt;1 year apart or blinking against 2010 AllWISE baselines.
              </li>
              <li>
                <strong>• Target Coverage:</strong> Regions like WISE 0855 have rich DR1 epochs (May &amp; Nov 2025) while QR3 coverage varies across ecliptic latitudes.
              </li>
            </ul>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-indigo-400 font-bold block text-sm">
              Planet X &amp; Outer Solar System Scope
            </span>
            <ul className="space-y-1.5 text-slate-300 font-sans leading-relaxed text-[11px]">
              <li>
                <strong>• CSA NEOSSat Scope Clarification:</strong> While NEOSSat tracks near-Earth asteroids and orbital space debris (V &lt; 19), it is not sensitive enough to detect hypothetical 20th+ magnitude outer-SS Planet X objects.
              </li>
              <li>
                <strong>• Vera C. Rubin Observatory (LSST):</strong> Next-phase broker integration (Fink/ANTARES) for deep optical moving-object recovery.
              </li>
              <li>
                <strong>• Shift-and-Stack Coaddition:</strong> Co-adding dozens of aligned SPHEREx single exposures along trial Keplerian parallax tracks to boost faint cold-brown-dwarf &amp; distant-TNO SNR.
              </li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
