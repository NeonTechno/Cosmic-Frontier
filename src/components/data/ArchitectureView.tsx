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
  Database, Telescope, Orbit, Server, Layers, ShieldCheck, ExternalLink,
  RefreshCw, Clock, Activity, ArrowUpRight, Radio, Gauge, FileCode2,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [panesFrozen, setPanesFrozen] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<string>('arch-overview');
  const [pingResults, setPingResults] = useState<Record<string, { reachable: boolean; latencyMs: number; message: string }>>({});

  const jumpToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleTestPing = async (serviceId: string) => {
    setTestingId(serviceId);
    try {
      const res = await testEndpointReadiness(serviceId);
      setPingResults((prev) => ({ ...prev, [serviceId]: {
        reachable: res.isReachable, latencyMs: res.latencyMs, message: res.message,
      }}));
    } finally {
      setTestingId(null);
    }
  };

  const sections = [
    { id: 'arch-overview', number: '00', label: 'Mission overview' },
    { id: 'arch-pillars', number: '01', label: 'Architecture pillars' },
    { id: 'arch-connectors', number: '02', label: 'Live connectors' },
    { id: 'arch-methodology', number: '03', label: 'Methodology & caveats' },
  ];

  const panel = 'rounded-2xl border border-slate-800/90 bg-[#0b1424] shadow-[0_18px_55px_rgba(0,0,0,0.16)]';
  const eyebrow = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500';
  const heading = 'text-base font-semibold tracking-tight text-slate-100';

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 pb-10 text-slate-200">
      {/* Page heading */}
      <header className="relative overflow-hidden rounded-[26px] border border-slate-800 bg-[#080f1d] px-5 py-7 sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border border-sky-400/10" />
        <div className="pointer-events-none absolute -right-2 -top-12 h-56 w-56 rounded-full border border-sky-400/10" />
        <div className="pointer-events-none absolute right-20 top-8 h-2 w-2 rounded-full bg-sky-300/70 shadow-[0_0_18px_rgba(125,211,252,0.8)]" />
        <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
                <Database className="h-3.5 w-3.5" /> Technical reference / 2026
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[10px] font-medium tracking-wide text-slate-400">
                <Activity className="h-3 w-3 text-emerald-400" /> Data architecture
              </span>
            </div>
            <div>
              <p className={eyebrow}>Black Star Orbit · Mission systems</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-4xl lg:text-[42px]">
                NASA data & <span className="text-sky-300">architecture</span>
              </h1>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-400 sm:text-[15px]">
              A technical overview of the SPHEREx data pipeline, archive protocols, partner catalogues and scientific safeguards powering the Planet X investigation.
            </p>
          </div>
          <div className="relative grid grid-cols-2 gap-2 sm:min-w-[290px]">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
              <p className={eyebrow}>Spectral channels</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">102</p>
              <p className="mt-1 text-[10px] text-slate-500">Linear variable filters</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
              <p className={eyebrow}>Archive endpoints</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{OFFICIAL_NASA_DATA_SOURCES.length}</p>
              <p className="mt-1 text-[10px] text-slate-500">Registered connectors</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* Section navigation */}
        <aside className={`${panesFrozen ? 'lg:sticky lg:top-[84px]' : ''} ${panel} p-4`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <p className={eyebrow}>On this page</p>
              <p className="mt-1 text-xs font-semibold text-slate-300">Specification index</p>
            </div>
            <FreezePaneButton frozen={panesFrozen} onToggle={() => setPanesFrozen((v) => !v)} label="Freeze" />
          </div>
          <nav className="mt-3 flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
            {sections.map((sec) => (
              <button key={sec.id} type="button" onClick={() => jumpToSection(sec.id)}
                className={`group flex min-w-max items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200 lg:w-full lg:min-w-0 ${activeSection === sec.id
                  ? 'border-sky-400/30 bg-sky-400/[0.08] text-white shadow-[inset_2px_0_0_rgba(125,211,252,0.8)]'
                  : 'border-transparent text-slate-500 hover:border-slate-800 hover:bg-slate-900 hover:text-slate-200'}`}>
                <span className={`font-mono text-[10px] ${activeSection === sec.id ? 'text-sky-300' : 'text-slate-600'}`}>{sec.number}</span>
                <span className="text-xs font-medium">{sec.label}</span>
                <ArrowUpRight className="ml-auto hidden h-3.5 w-3.5 opacity-50 group-hover:block" />
              </button>
            ))}
          </nav>
          <div className="mt-4 hidden space-y-3 border-t border-slate-800 pt-4 lg:block">
            <div className="flex items-center justify-between text-[11px]"><span className="text-slate-500">Pixel scale</span><span className="font-mono text-slate-300">6.15″ / px</span></div>
            <div className="flex items-center justify-between text-[11px]"><span className="text-slate-500">Wavelength</span><span className="font-mono text-slate-300">0.75–5.00 µm</span></div>
            <div className="flex items-center justify-between text-[11px]"><span className="text-slate-500">Archive basis</span><span className="font-mono text-emerald-300">IRSA DR1 / QR3</span></div>
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          {/* Mission overview */}
          <section id="arch-overview" className={`${panel} scroll-mt-24 overflow-hidden`}>
            <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
              <p className={eyebrow}>00 / Mission overview</p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white">The infrared sky time machine</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Built for NASA Space Apps Challenge 2026 (Planet X and SPHEREx). Connects directly to NASA/IPAC IRSA SIAv2 &amp; IBE servers to download calibrated SPHEREx Level-2 Multi-Extension FITS cutouts (IMAGE, FLAGS, VARIANCE, ZODI), reprojects roll-rotated frames onto a North-Up East-Left ICRS grid, and cross-matches ESA Gaia DR3 astrometry and 2010 AllWISE baselines.
              </p>
            </div>
            <div className="grid grid-cols-1 divide-y divide-slate-800 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="p-4 sm:px-5"><p className={eyebrow}>Primary archive</p><p className="mt-1.5 text-sm font-semibold text-slate-200">NASA / IPAC IRSA</p><p className="mt-1 text-[11px] text-slate-500">SIAv2 · IBE · FITS products</p></div>
              <div className="p-4 sm:px-5"><p className={eyebrow}>Cross-match catalogues</p><p className="mt-1.5 text-sm font-semibold text-slate-200">Gaia DR3 + AllWISE</p><p className="mt-1 text-[11px] text-slate-500">Astrometry · historical infrared</p></div>
              <div className="p-4 sm:px-5"><p className={eyebrow}>Scientific guardrail</p><p className="mt-1.5 text-sm font-semibold text-emerald-300">No fabricated detections</p><p className="mt-1 text-[11px] text-slate-500">Observed data kept distinct from models</p></div>
            </div>
          </section>

          {/* Architecture pillars */}
          <section id="arch-pillars" className="scroll-mt-24 space-y-3">
            <div className="flex items-end justify-between gap-3 px-1">
              <div><p className={eyebrow}>01 / System design</p><h2 className="mt-1 text-lg font-semibold text-white">Architecture pillars</h2></div>
              <span className="hidden text-[10px] font-mono text-slate-600 sm:block">THREE CORE LAYERS</span>
            </div>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              <article className={`${panel} group p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400/30`}>
                <div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/[0.08] text-sky-300"><Telescope className="h-5 w-5" /></div><span className="font-mono text-[10px] text-slate-600">01</span></div>
                <h3 className="mt-4 text-sm font-semibold text-white">Live IRSA SPHEREx Time Machine</h3>
                <p className="mt-2 text-xs leading-6 text-slate-400">Queries <code className="rounded bg-slate-950 px-1 py-0.5 text-sky-300">spherex_dr1</code> and <code className="rounded bg-slate-950 px-1 py-0.5 text-sky-300">spherex_qr3</code> via SIAv2, fetches IBE MEF cutouts across D1–D6 (0.75–5.00 µm), solves TAN-SIP WCS roll angles into North-Up grids, and computes Zodi-subtracted aperture photometry &amp; variance-weighted difference imaging.</p>
                <div className="mt-4 border-t border-slate-800 pt-3 text-[10px] font-mono text-sky-300">6.15″ / pixel · HDU 1–4 parsed</div>
              </article>
              <article className={`${panel} group p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400/30`}>
                <div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-400/[0.08] text-indigo-300"><Orbit className="h-5 w-5" /></div><span className="font-mono text-[10px] text-slate-600">02</span></div>
                <h3 className="mt-4 text-sm font-semibold text-white">Multi-catalog astrometry &amp; triage</h3>
                <p className="mt-2 text-xs leading-6 text-slate-400">Pairs SPHEREx (2025–2026) with 2010 AllWISE W1/W2 coadds (15-year motion baseline) and live ESA Gaia DR3 proper motions. Strictly distinguishes observed residuals, unconfirmed candidates, and confirmed discoveries.</p>
                <div className="mt-4 border-t border-slate-800 pt-3 text-[10px] font-mono text-indigo-300">Gaia DR3 TAP · AllWISE IBE · IRSA</div>
              </article>
              <article className={`${panel} group p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/30`}>
                <div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"><ShieldCheck className="h-5 w-5" /></div><span className="font-mono text-[10px] text-slate-600">03</span></div>
                <h3 className="mt-4 text-sm font-semibold text-white">Scientific honesty &amp; limitations</h3>
                <p className="mt-2 text-xs leading-6 text-slate-400">Explicitly badges live IRSA archive frames vs. simulated fallback data. Accounts for LVF spatial-wavelength coupling, 6.15″/px undersampling, and notes that NEOSSat monitors orbital debris/bright inner-SS asteroids rather than deep outer-SS Planet X.</p>
                <div className="mt-4 border-t border-slate-800 pt-3 text-[10px] font-mono text-emerald-300">Zero fabricated detections</div>
              </article>
            </div>
          </section>

          {/* Live connectors */}
          <section id="arch-connectors" className={`${panel} scroll-mt-24 overflow-hidden`}>
            <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/[0.08] text-sky-300"><Radio className="h-5 w-5" /></div>
                <div><p className={eyebrow}>02 / Service registry</p><h2 className="mt-1 text-base font-semibold text-white">NASA, Caltech/IPAC &amp; ESA connectors</h2><p className="mt-1 text-[11px] text-slate-500">Run an on-demand reachability check against each registered endpoint.</p></div>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] font-mono text-slate-400"><Server className="h-3.5 w-3.5" /> {OFFICIAL_NASA_DATA_SOURCES.length} registered endpoints</span>
            </div>
            <div className="divide-y divide-slate-800/80">
              {OFFICIAL_NASA_DATA_SOURCES.map((source) => {
                const ping = pingResults[source.serviceId];
                const isTesting = testingId === source.serviceId;
                return (
                  <article key={source.serviceId} className="p-4 transition-colors hover:bg-slate-900/40 sm:p-5">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-100">{source.name}</h3>
                          <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-sky-300">{source.protocol}</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500">{source.organization}</p>
                        <p className="max-w-3xl text-xs leading-6 text-slate-400">{source.description}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <span className={`rounded-md border px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider ${source.status === 'ONLINE_AVAILABLE'
                          ? 'border-emerald-800/70 bg-emerald-950/40 text-emerald-300'
                          : source.status === 'PRE_LAUNCH_SPEC'
                          ? 'border-indigo-800/70 bg-indigo-950/40 text-indigo-300'
                          : 'border-amber-800/70 bg-amber-950/30 text-amber-300'}`}>{source.status.replace(/_/g, ' ')}</span>
                        <button disabled={isTesting} onClick={() => handleTestPing(source.serviceId)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-[11px] font-medium text-slate-200 transition hover:border-sky-400/40 hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60">
                          <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />{isTesting ? 'Testing…' : 'Test connection'}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 border-t border-slate-800/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="flex min-w-0 items-center gap-2 truncate text-[10px] font-mono text-slate-600"><span className="shrink-0 text-slate-500">ENDPOINT</span><span className="truncate">{source.endpointUrl}</span></span>
                      <a href={source.documentationRef} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-sky-300 transition hover:text-sky-200">Official documentation <ExternalLink className="h-3 w-3" /></a>
                    </div>
                    {ping && <div className={`mt-3 flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-[11px] sm:flex-row sm:items-center sm:justify-between ${ping.reachable ? 'border-emerald-800/50 bg-emerald-950/25 text-emerald-300' : 'border-red-800/50 bg-red-950/25 text-red-300'}`}><span className="inline-flex items-center gap-2"><Activity className="h-3.5 w-3.5" />{ping.message}</span><span className="font-mono">{ping.latencyMs} ms latency</span></div>}
                  </article>
                );
              })}
            </div>
          </section>

          {/* Methodology */}
          <section id="arch-methodology" className={`${panel} scroll-mt-24 overflow-hidden`}>
            <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-4 sm:px-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/[0.07] text-amber-300"><Clock className="h-5 w-5" /></div>
              <div><p className={eyebrow}>03 / Research integrity</p><h2 className="mt-1 text-base font-semibold text-white">Methodology, limitations &amp; roadmap</h2></div>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:p-5 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-[#080f1d] p-4">
                <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-sky-300" /><h3 className="text-sm font-semibold text-slate-200">Current SPHEREx pipeline &amp; caveats</h3></div>
                <ul className="mt-3 space-y-3 text-xs leading-6 text-slate-400">
                  <li><strong className="text-slate-200">Band &amp; roll coupling:</strong> SPHEREx Level-2 images come from Linear Variable Filters; different dates often hit slightly different wavelengths and roll angles. Our North-Up bilinear reprojection enables blinking, while difference peaks near bright stars can include chromatic PSF residuals.</li>
                  <li><strong className="text-slate-200">Coarse plate scale:</strong> At 6.15″/pixel, sub-pixel motions (~1–5″/yr) require comparing epochs &gt;1 year apart or blinking against 2010 AllWISE baselines.</li>
                  <li><strong className="text-slate-200">Target coverage:</strong> Regions like WISE 0855 have rich DR1 epochs (May &amp; Nov 2025) while QR3 coverage varies across ecliptic latitudes.</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#080f1d] p-4">
                <div className="flex items-center gap-2"><Orbit className="h-4 w-4 text-indigo-300" /><h3 className="text-sm font-semibold text-slate-200">Planet X &amp; outer solar system scope</h3></div>
                <ul className="mt-3 space-y-3 text-xs leading-6 text-slate-400">
                  <li><strong className="text-slate-200">CSA NEOSSat scope clarification:</strong> While NEOSSat tracks near-Earth asteroids and orbital space debris (V &lt; 19), it is not sensitive enough to detect hypothetical 20th+ magnitude outer-SS Planet X objects.</li>
                  <li><strong className="text-slate-200">Vera C. Rubin Observatory (LSST):</strong> Next-phase broker integration (Fink/ANTARES) for deep optical moving-object recovery.</li>
                  <li><strong className="text-slate-200">Shift-and-stack coaddition:</strong> Co-adding dozens of aligned SPHEREx single exposures along trial Keplerian parallax tracks to boost faint cold-brown-dwarf &amp; distant-TNO SNR.</li>
                </ul>
              </div>
            </div>
            <div className="flex items-start gap-2 border-t border-slate-800 bg-slate-900/40 px-5 py-3 text-[11px] leading-5 text-slate-500 sm:px-6">
              <FileCode2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
              Technical note: endpoint status labels describe the registered connector configuration; use the connection test for a current reachability result. Archive availability does not imply that a target observation exists.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
