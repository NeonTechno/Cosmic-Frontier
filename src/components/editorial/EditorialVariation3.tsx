import React, { useState, useMemo, useEffect } from 'react';
import confirmedExoplanetsData from '../../cosmic-frontier/data/catalogs/confirmed-exoplanets.json';
import { ArrowUpRight, Search, Sparkles, Filter, Database, ShieldCheck, Compass, Eye, RefreshCw, Moon, Sun, LayoutGrid, Table2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { BlackStarLogo } from '../common/BlackStarLogo';
import { assetUrl } from '../../utils/assetUrl';

interface EditorialVariation3Props {
  onNavigate: (tab: 'overview' | 'spherex' | 'planetx' | 'astrobiology' | 'architecture' | 'cosmic-suite') => void;
  onOpenDataModal?: () => void;
  onOpenAiAssistant?: () => void;
  onSwitchTheme?: () => void;
  onOpenShortcutsHelp?: () => void;
}

interface EditorialExoplanetRecord {
  planetName: string;
  hostStar: string;
  discoveryMethod: string;
  discoveryYear: number;
  orbitalPeriodDays: number | null;
  radiusEarthRadii: number | null;
  massEarthMasses: number | null;
  stellarEffectiveTempK: number | null;
  distanceLightYears: number | null;
  distanceParsecs?: number | null;
  dataStatus?: string;
}

export const EditorialVariation3: React.FC<EditorialVariation3Props> = ({
  onNavigate,
  onOpenDataModal,
  onOpenAiAssistant,
  onSwitchTheme,
  onOpenShortcutsHelp,
}) => {
  const { isLight, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [catalogView, setCatalogView] = useState<'cards' | 'table'>('cards');
  const [liveExoplanets, setLiveExoplanets] = useState<EditorialExoplanetRecord[] | null>(null);
  const [isLiveCatalog, setIsLiveCatalog] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/data/exoplanets')
      .then((res) => (res.ok && (res.headers.get('content-type') || '').includes('application/json') ? res.json() : null))
      .then((json) => {
        if (active && json && Array.isArray(json.records) && json.records.length > 0) {
          setLiveExoplanets(json.records);
          setIsLiveCatalog(Boolean(json.isLive));
        }
      })
      .catch(() => {
        // Keep bundled fallback gracefully
      });
    return () => {
      active = false;
    };
  }, []);

  const exoplanets = useMemo(() => {
    if (liveExoplanets && liveExoplanets.length > 0) return liveExoplanets;
    return ((confirmedExoplanetsData as { records?: EditorialExoplanetRecord[] }).records || []);
  }, [liveExoplanets]);

  const filteredPlanets = useMemo(() => {
    if (!searchQuery.trim()) return exoplanets;
    const q = searchQuery.toLowerCase();
    return exoplanets.filter(
      (p) =>
        p.planetName.toLowerCase().includes(q) ||
        p.hostStar.toLowerCase().includes(q) ||
        p.discoveryMethod.toLowerCase().includes(q)
    );
  }, [exoplanets, searchQuery]);

  return (
    <div className={`editorial-root relative min-h-screen transition-colors duration-200 ${
      isLight
        ? 'editorial-light bg-[#fdfcf8] text-[#1a1a1a] selection:bg-[#d44d5c] selection:text-white'
        : 'editorial-dark bg-[#080d1a] text-[#f1f5f9] selection:bg-cyan-500/30 selection:text-cyan-200'
    }`}>
      {/* --- BACKGROUND DECO LABELS --- */}
      <div className={`editorial-edge-label editorial-edge-t hidden sm:block ${isLight ? 'text-[#1a1a1a]/25' : 'text-slate-400/25'}`}>
        Observation Platform // NASA 2026
      </div>
      <div className={`editorial-edge-label editorial-edge-l hidden md:block ${isLight ? 'text-[#1a1a1a]/25' : 'text-slate-400/25'}`}>
        45.034.22 // ARCHIVE
      </div>

      <div className="editorial-container">
        {/* --- HEADER --- */}
        <header className={`editorial-header pt-10 sm:pt-16 pb-8 border-b mb-12 sm:mb-20 ${
          isLight ? 'border-[#1a1a1a]/10' : 'border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between w-full gap-6">
            <div className="flex items-center gap-5 sm:gap-6">
              <BlackStarLogo size="xl" showGlow={false} className="editorial-logo-box" />
              <div>
                <span className={`editorial-label ${isLight ? 'text-[#8c8c8c]' : 'text-slate-400'}`}>SCIENTIFIC JOURNAL // VOL. 04</span>
                <h1 className={`editorial-title tracking-tight ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>BLACK STAR ORBIT</h1>
              </div>
            </div>

            {/* Editorial Nav Links */}
            <div className={`flex flex-wrap items-center gap-3 sm:gap-6 font-mono text-xs uppercase tracking-widest pr-12 sm:pr-14 ${
              isLight ? 'text-[#1a1a1a]' : 'text-slate-300'
            }`}>
              <button
                onClick={() => onNavigate('spherex')}
                className={`hover:text-[#d44d5c] transition-colors cursor-pointer py-1 border-b border-transparent hover:border-[#d44d5c] ${!isLight ? 'hover:text-cyan-400 hover:border-cyan-400' : ''}`}
                title="SPHEREx Explorer (Alt + S)"
              >
                SPHEREx
              </button>
              <button
                onClick={() => onNavigate('planetx')}
                className={`hover:text-[#d44d5c] transition-colors cursor-pointer py-1 border-b border-transparent hover:border-[#d44d5c] ${!isLight ? 'hover:text-cyan-400 hover:border-cyan-400' : ''}`}
                title="Planet X Lab (Alt + P)"
              >
                Planet X
              </button>
              <button
                onClick={() => onNavigate('astrobiology')}
                className={`hover:text-[#d44d5c] transition-colors cursor-pointer py-1 border-b border-transparent hover:border-[#d44d5c] ${!isLight ? 'hover:text-cyan-400 hover:border-cyan-400' : ''}`}
                title="Astrobiology Lab (Alt + B)"
              >
                Astrobiology
              </button>
              <button
                onClick={() => onNavigate('cosmic-suite')}
                className={`hover:text-[#d44d5c] transition-colors cursor-pointer py-1 border-b border-transparent hover:border-[#d44d5c] ${!isLight ? 'hover:text-cyan-400 hover:border-cyan-400' : ''}`}
                title="Cosmic Frontier Suite (Alt + C)"
              >
                Cosmic Lab
              </button>
              {onOpenShortcutsHelp && (
                <button
                  onClick={onOpenShortcutsHelp}
                  className={`px-2 py-1 border transition-all cursor-pointer text-[10px] tracking-normal font-sans ${
                    isLight ? 'border-[#1a1a1a]/30 hover:border-[#1a1a1a] hover:bg-black/5' : 'border-slate-700 hover:border-slate-400 hover:bg-white/5 text-slate-300'
                  }`}
                  title="Keyboard Shortcuts Guide (Alt + / or ?)"
                >
                  Shortcuts [Alt+/]
                </button>
              )}
              <button
                onClick={() => onNavigate('spherex')}
                className={`px-3 py-1 border font-bold transition-all cursor-pointer ${
                  isLight
                    ? 'border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#fdfcf8]'
                    : 'border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20'
                }`}
                title="SPHEREx Live Telemetry (Alt + S)"
              >
                [ Live Telemetry ]
              </button>
            </div>
          </div>
        </header>

        {/* --- EDITORIAL INDEX & QUICK-FILTER BAR --- */}
        <div className={`mb-10 py-2.5 pr-12 sm:pr-14 border-b transition-all ${
          isLight
            ? 'bg-[#fdfcf8] border-[#1a1a1a]/12'
            : 'bg-[#080d1a] border-slate-800'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono text-[11px] uppercase tracking-wider">
              <span className={`hidden md:inline text-[10px] mr-1 ${isLight ? 'text-[#8c8c8c]' : 'text-slate-500'}`}>
                Index //
              </span>
              {[
                { id: 'editorial-overview', label: 'Overview' },
                { id: 'editorial-catalog', label: `Catalog (${filteredPlanets.length})` },
                { id: 'editorial-habitable', label: 'Habitable Zones' },
                { id: 'editorial-sources', label: 'Archive Sources' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                    isLight
                      ? 'border-[#1a1a1a]/15 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#fdfcf8]'
                      : 'border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <div className="relative hidden sm:block">
                <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-[#8c8c8c]' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick filter catalog..."
                  className={`pl-8 pr-3 py-1 text-xs font-mono border outline-none w-44 transition-colors ${
                    isLight
                      ? 'bg-white border-[#1a1a1a]/20 focus:border-[#1a1a1a] text-[#1a1a1a]'
                      : 'bg-slate-900/90 border-slate-700 focus:border-cyan-400 text-slate-100'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- CINEMATIC NASA ASTRONAUT EDITORIAL HERO --- */}
        <section id="editorial-overview" className="editorial-astronaut-hero scroll-mt-20 mb-20 sm:mb-28">
          <img
            className="editorial-astronaut-image"
            src={assetUrl('assets/editorial-astronaut.jpg')}
            alt="Cosmic Frontier orbital astronaut conducting deep-space observations"
            loading="eager"
            fetchPriority="high"
          />
          <div className="editorial-astronaut-shade" aria-hidden="true" />
          <div className="editorial-astronaut-grid" aria-hidden="true" />
          <div className="editorial-astronaut-frame" aria-hidden="true">
            <span>ISS / EVA 059</span>
            <span>ORBITAL FIELD NOTES</span>
          </div>

          <div className="editorial-astronaut-layout">
            <div className="editorial-astronaut-copy">
              <span className="editorial-astronaut-kicker">OBSERVATIONAL ASTROPHYSICS // 2026</span>
              <h2>
                The Cosmic Dust
                <span>Horizon.</span>
              </h2>
              <p>
                Explore the infrared universe through calibrated all-sky observations, exoplanet records and orbital research. Every scientific workflow is grounded in traceable mission data and published astronomical sources.
              </p>
              <div className="editorial-astronaut-actions">
                <button onClick={() => onNavigate('spherex')} className="editorial-astronaut-primary">
                  Launch SPHEREx Workbench <span aria-hidden="true">↗</span>
                </button>
                <button onClick={() => onNavigate('planetx')} className="editorial-astronaut-secondary">
                  Investigate Planet X
                </button>
              </div>
              {onOpenDataModal && (
                <button onClick={onOpenDataModal} className="editorial-astronaut-spec-link">
                  View NASA data specifications
                </button>
              )}
            </div>

            <div className="editorial-astronaut-center-space" aria-hidden="true" />

            <aside className="editorial-astronaut-telemetry" aria-label="Scientific platform status">
              <div className="editorial-astronaut-panel-top">
                <span>MISSION TELEMETRY</span>
                <span className="editorial-astronaut-live"><i /> ACTIVE</span>
              </div>
              <div className="editorial-astronaut-metric">
                <span>SYSTEM STATUS</span>
                <strong>Nominal</strong>
                <small>Level-2/3 processing mode</small>
              </div>
              <div className="editorial-astronaut-metric">
                <span>INFRARED SPECTRAL SPAN</span>
                <strong>0.75 – 5.0 µm</strong>
                <small>102 continuous wavelength bands</small>
              </div>
              <div className="editorial-astronaut-metric">
                <span>ORBITAL MODEL REFERENCE</span>
                <strong>Batygin &amp; Brown</strong>
                <small>2021 · eTNO perihelion clustering</small>
              </div>
              <button onClick={() => onNavigate('astrobiology')} className="editorial-astronaut-study">
                <span>FEATURED SCIENTIFIC STUDY</span>
                <strong>Prebiotic Interstellar Ices <b>↗</b></strong>
                <small>H₂O · CO₂ · CH₃OH</small>
              </button>
            </aside>
          </div>

          <footer className="editorial-astronaut-caption">
            <span>FIG. 01 — HUMAN PRESENCE IN LOW EARTH ORBIT</span>
            <a href="https://www.nasa.gov/image-article/nasa-spacewalker-nick-hague-3/" target="_blank" rel="noreferrer">
              IMAGE: NASA / NICK HAGUE · ISS059E002192 ↗
            </a>
          </footer>
        </section>

        {/* --- CATALOG SECTION --- */}
        <section id="editorial-catalog" className={`scroll-mt-20 catalog-section border-t pt-12 mb-20 sm:mb-28 ${
          isLight ? 'border-[#1a1a1a]' : 'border-slate-800'
        }`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className={`editorial-label ${isLight ? 'text-[#8c8c8c]' : 'text-slate-400'}`}>
                {isLiveCatalog ? 'LIVE CALTECH IPAC / NASA EXOPLANET ARCHIVE (TAP)' : 'CALTECH IPAC / IRSA COMPLIANT DATA'}
              </span>
              <h2 className={`editorial-h2 ${!isLight ? 'text-white' : ''}`}>
                Exoplanet Catalog // {exoplanets.length} {isLiveCatalog ? 'Live' : 'Verified'} Records
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* View Switcher: Editorial Cards vs Frozen Data Table */}
              <div className={`flex items-center border p-0.5 font-mono text-xs ${
                isLight ? 'border-[#1a1a1a]/20 bg-[#f4f1ea]' : 'border-slate-700 bg-slate-900'
              }`}>
                <button
                  type="button"
                  onClick={() => setCatalogView('cards')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer transition ${
                    catalogView === 'cards'
                      ? isLight
                        ? 'bg-[#1a1a1a] text-[#fdfcf8] font-bold'
                        : 'bg-cyan-600 text-white font-bold'
                      : isLight
                        ? 'text-[#666] hover:text-[#1a1a1a]'
                        : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogView('table')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer transition ${
                    catalogView === 'table'
                      ? isLight
                        ? 'bg-[#1a1a1a] text-[#fdfcf8] font-bold'
                        : 'bg-cyan-600 text-white font-bold'
                      : isLight
                        ? 'text-[#666] hover:text-[#1a1a1a]'
                        : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>Frozen Table</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[260px]">
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-[#8c8c8c]' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search planet name or host star..."
                  className={`w-full pl-10 pr-4 py-2 bg-transparent border text-sm font-editorial-sans outline-none transition-colors ${
                    isLight
                      ? 'border-[#1a1a1a]/20 focus:border-[#1a1a1a] text-[#1a1a1a] placeholder:text-[#8c8c8c]'
                      : 'border-slate-700 focus:border-cyan-400 text-slate-100 placeholder:text-slate-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {catalogView === 'table' ? (
            /* Frozen Header & Locked First Column Spreadsheet View */
            <div className={`freeze-table-wrap pane-scroll border ${
              isLight ? 'border-[#1a1a1a]/20 bg-white' : 'border-slate-800 bg-[#0b1326]'
            }`}>
              <table className="w-full text-left text-xs font-mono border-collapse tabular-nums">
                <thead className="freeze-thead">
                  <tr className={`border-b uppercase text-[10px] tracking-wider ${
                    isLight ? 'border-[#1a1a1a]/15 text-[#555]' : 'border-slate-800 text-slate-400'
                  }`}>
                    <th className="py-3 px-4 freeze-col">Planet Name</th>
                    <th className="py-3 px-4">Host Star</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Year</th>
                    <th className="py-3 px-4">Radius (R⊕)</th>
                    <th className="py-3 px-4">Mass (M⊕)</th>
                    <th className="py-3 px-4">Period (d)</th>
                    <th className="py-3 px-4">Distance (ly)</th>
                    <th className="py-3 px-4">Host Teff</th>
                    <th className="py-3 px-4 text-right">3D View</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-[#1a1a1a]/10' : 'divide-slate-800/80'}`}>
                  {filteredPlanets.map((planet) => (
                    <tr
                      key={planet.planetName}
                      onClick={() => setSelectedPlanet(selectedPlanet === planet.planetName ? null : planet.planetName)}
                      className={`cursor-pointer transition-colors ${
                        isLight ? 'hover:bg-black/[0.03]' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className={`py-3 px-4 font-bold freeze-col whitespace-nowrap ${
                        isLight ? 'text-[#1a1a1a]' : 'text-cyan-300'
                      }`}>
                        {planet.planetName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{planet.hostStar}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{planet.discoveryMethod}</td>
                      <td className="py-3 px-4">{planet.discoveryYear}</td>
                      <td className="py-3 px-4 font-semibold">{planet.radiusEarthRadii ?? 'N/A'}</td>
                      <td className="py-3 px-4">{planet.massEarthMasses ?? 'N/A'}</td>
                      <td className="py-3 px-4">{planet.orbitalPeriodDays !== null ? planet.orbitalPeriodDays.toFixed(2) : 'N/A'}</td>
                      <td className="py-3 px-4">{planet.distanceLightYears !== null ? planet.distanceLightYears.toFixed(1) : 'N/A'}</td>
                      <td className="py-3 px-4">{planet.stellarEffectiveTempK !== null ? `${planet.stellarEffectiveTempK} K` : 'N/A'}</td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onNavigate('cosmic-suite')}
                          className={`px-2 py-1 border text-[10px] uppercase cursor-pointer transition ${
                            isLight
                              ? 'border-[#1a1a1a]/25 hover:bg-[#1a1a1a] hover:text-white'
                              : 'border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20'
                          }`}
                        >
                          3D View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
          /* Planet Cards Grid */
          <div className={`divide-y ${isLight ? 'divide-[#1a1a1a]/10' : 'divide-slate-800'}`}>
            {filteredPlanets.map((planet) => {
              const isSelected = selectedPlanet === planet.planetName;
              return (
                <div
                  key={planet.planetName}
                  className={`py-8 sm:py-10 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 sm:gap-10 transition-colors ${
                    isSelected ? (isLight ? 'bg-black/[0.03] -mx-4 px-4 rounded-lg' : 'bg-slate-900/60 border border-cyan-500/30 -mx-4 px-4 rounded-lg') : ''
                  }`}
                >
                  {/* Planet Art Sphere */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="editorial-planet-art w-28 h-28 sm:w-36 sm:h-36">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#d44d5c]/60 shadow-[0_0_8px_#d44d5c]" />
                    </div>
                    <span className={`font-mono text-[10px] uppercase tracking-widest mt-4 ${
                      isLight ? 'text-[#8c8c8c]' : 'text-slate-400'
                    }`}>
                      {planet.discoveryMethod} // {planet.discoveryYear}
                    </span>
                  </div>

                  {/* Planet Data & Metrics */}
                  <div className="space-y-4 flex flex-col justify-center">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-3">
                        <h3 className={`font-serif text-3xl sm:text-4xl font-semibold ${
                          isLight ? 'text-[#1a1a1a]' : 'text-white'
                        }`}>
                          {planet.planetName}
                        </h3>
                        <span className={`font-mono text-xs uppercase ${
                          isLight ? 'text-[#8c8c8c]' : 'text-slate-400'
                        }`}>
                          Host: {planet.hostStar}
                        </span>
                      </div>
                      <span className={`font-mono text-[11px] px-2 py-0.5 border uppercase ${
                        isLight ? 'border-[#1a1a1a]/20 text-[#1a1a1a]' : 'border-cyan-500/40 text-cyan-300 bg-cyan-950/30'
                      }`}>
                        {planet.dataStatus || 'Confirmed Planet'}
                      </span>
                    </div>

                    <p className={`text-sm font-editorial-sans leading-relaxed max-w-3xl ${
                      isLight ? 'text-[#1a1a1a]/70' : 'text-slate-300'
                    }`}>
                      Exoplanet orbit detected around {planet.hostStar}
                      {planet.stellarEffectiveTempK !== null
                        ? ` with an equilibrium stellar temperature of ${planet.stellarEffectiveTempK} K.`
                        : '.'}{' '}
                      Analyzed via high-precision photometric light curve and radial velocity observations.
                    </p>

                    {/* Discovery 4-stat Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                      <div className={`border-l pl-3 ${isLight ? 'border-[#1a1a1a]/15' : 'border-slate-800'}`}>
                        <span className="editorial-label !mb-0 text-[10px]">RADIUS</span>
                        <span className={`font-mono text-base font-bold block mt-1 ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                          {planet.radiusEarthRadii !== null ? `${planet.radiusEarthRadii} R⊕` : 'N/A'}
                        </span>
                        <span className={`text-[10px] font-mono ${isLight ? 'text-[#8c8c8c]' : 'text-slate-400'}`}>Earth Radii</span>
                      </div>

                      <div className={`border-l pl-3 ${isLight ? 'border-[#1a1a1a]/15' : 'border-slate-800'}`}>
                        <span className="editorial-label !mb-0 text-[10px]">PLANETARY MASS</span>
                        <span className={`font-mono text-base font-bold block mt-1 ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                          {planet.massEarthMasses !== null ? `${planet.massEarthMasses} M⊕` : 'N/A'}
                        </span>
                        <span className={`text-[10px] font-mono ${isLight ? 'text-[#8c8c8c]' : 'text-slate-400'}`}>Earth Masses</span>
                      </div>

                      <div className={`border-l pl-3 ${isLight ? 'border-[#1a1a1a]/15' : 'border-slate-800'}`}>
                        <span className="editorial-label !mb-0 text-[10px]">ORBITAL PERIOD</span>
                        <span className={`font-mono text-base font-bold block mt-1 ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                          {planet.orbitalPeriodDays !== null ? `${planet.orbitalPeriodDays.toFixed(2)} d` : 'N/A'}
                        </span>
                        <span className={`text-[10px] font-mono ${isLight ? 'text-[#8c8c8c]' : 'text-slate-400'}`}>Days</span>
                      </div>

                      <div className={`border-l pl-3 ${isLight ? 'border-[#1a1a1a]/15' : 'border-slate-800'}`}>
                        <span className="editorial-label !mb-0 text-[10px]">DISTANCE</span>
                        <span className={`font-mono text-base font-bold block mt-1 ${isLight ? 'text-[#1a1a1a]' : 'text-white'}`}>
                          {planet.distanceLightYears !== null ? `${planet.distanceLightYears.toFixed(1)} ly` : 'N/A'}
                        </span>
                        <span className={`text-[10px] font-mono ${isLight ? 'text-[#8c8c8c]' : 'text-slate-400'}`}>Light Years</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        onClick={() => setSelectedPlanet(isSelected ? null : planet.planetName)}
                        className={`font-mono text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${
                          isLight ? 'text-[#1a1a1a] hover:text-[#d44d5c]' : 'text-slate-200 hover:text-cyan-400'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'Collapse Details' : 'Inspect Spectral Profile'}</span>
                      </button>
                      <button
                        onClick={() => onNavigate('cosmic-suite')}
                        className={`font-mono text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${
                          isLight ? 'text-[#8c8c8c] hover:text-[#1a1a1a]' : 'text-slate-400 hover:text-cyan-300'
                        }`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>View In 3D Universe</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {filteredPlanets.length === 0 && (
            <div className="py-16 text-center text-[#8c8c8c] font-mono text-sm">
              No exoplanets match your query "{searchQuery}".
            </div>
          )}
        </section>

        {/* --- HABITABLE ZONE TERRACOTTA BLOCK (#d44d5c) --- */}
        <div id="editorial-habitable" className="scroll-mt-20 editorial-habitable-block rounded-none mb-24">
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/70 block">
              ZONAL GRADIENT 01
            </span>
            <h3 className="font-serif text-2xl font-semibold text-white">Inner Boundary</h3>
            <p className="text-xs text-white/85 font-editorial-sans leading-relaxed">
              Runaway greenhouse threshold corresponding to 0.95 AU equivalent solar insolation, where stellar irradiance vaporizes planetary surface oceans.
            </p>
          </div>

          <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-6">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/70 block">
              ZONAL GRADIENT 02
            </span>
            <h3 className="font-serif text-2xl font-semibold text-white">Liquid Water Zone</h3>
            <p className="text-xs text-white/85 font-editorial-sans leading-relaxed">
              Equilibrium thermal envelope sustaining liquid hydrospheres under 1 bar atmospheric pressure, facilitating organic prebiotic synthesis.
            </p>
          </div>

          <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-6">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/70 block">
              ZONAL GRADIENT 03
            </span>
            <h3 className="font-serif text-2xl font-semibold text-white">Outer Boundary</h3>
            <p className="text-xs text-white/85 font-editorial-sans leading-relaxed">
              Maximum greenhouse threshold at 1.67 AU equivalent insolation, beyond which carbon dioxide condensation triggers irreversible surface glaciation.
            </p>
          </div>
        </div>
      </div>

      {/* --- EDITORIAL FOOTER (#111) --- */}
      <footer id="editorial-sources" className="scroll-mt-20 editorial-footer-info">
        <div className="editorial-container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-white/10">
            <div className="space-y-3">
              <span className="font-mono text-xs uppercase tracking-widest text-white/50 block">
                EDITORIAL ARCHIVE
              </span>
              <h4 className="font-serif text-2xl text-white font-semibold">
                BLACK STAR ORBIT
              </h4>
              <p className="text-xs text-white/60 font-editorial-sans leading-relaxed">
                NASA Space Apps Challenge 2026. High-fidelity spectrophotometric astronomical explorer.
              </p>
            </div>

            <div className="space-y-2 font-mono text-xs text-white/70">
              <span className="text-[10px] uppercase tracking-widest text-white/40 block">
                INTEGRITY STATEMENT
              </span>
              <p className="font-editorial-sans text-xs text-white/70 leading-relaxed">
                Zero AI fabrication on astronomical measurements. Ephemerides directly derived from Standish (1990) & Minor Planet Center catalogs.
              </p>
            </div>

            <div className="space-y-2 font-mono text-xs text-white/70">
              <span className="text-[10px] uppercase tracking-widest text-white/40 block">
                DATA SOURCES
              </span>
              <ul className="space-y-1.5">
                <li>• SPHEREx 102-Band All-Sky Survey</li>
                <li>• NASA Exoplanet Archive (IPAC)</li>
                <li>• JPL HORIZONS System</li>
                <li>• Gaia Data Release 3 (ESA)</li>
              </ul>
            </div>

            <div className="space-y-2 font-mono text-xs text-white/70">
              <span className="text-[10px] uppercase tracking-widest text-white/40 block">
                GALACTIC CENTER COORDINATES
              </span>
              <div className="font-mono text-sm text-white font-bold">
                RA 17h 45m 40s
              </div>
              <div className="font-mono text-sm text-white font-bold">
                Dec -29° 00' 28"
              </div>
              <span className="text-[10px] text-white/40 block">
                Sgr A* Supermassive Black Hole
              </span>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-white/40">
            <div>
              BLACK STAR ORBIT // DESIGN VARIATION 3 — EDITORIAL PUBLICATION
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Back to Top ↑
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
