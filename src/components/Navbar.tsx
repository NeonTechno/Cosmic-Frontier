/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BLACK STAR ORBIT — Navigation & Mission Control Bar
 */

import { Telescope, Orbit, Database, Activity, Globe, FlaskConical, Compass, Keyboard } from 'lucide-react';
import { BlackStarLogo } from './common/BlackStarLogo.tsx';
import { useTheme } from '../context/ThemeContext.tsx';

interface NavbarProps {
  activeTab: 'overview' | 'spherex' | 'planetx' | 'astrobiology' | 'architecture' | 'cosmic-suite';
  setActiveTab: (tab: 'overview' | 'spherex' | 'planetx' | 'astrobiology' | 'architecture' | 'cosmic-suite') => void;
  onOpenDataModal: () => void;
  onOpenIntroModal?: () => void;
  onOpenProjectTour?: () => void;
  onOpenShortcutsHelp?: () => void;
  serverStatusOk: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDataModal,
  onOpenIntroModal,
  onOpenProjectTour,
  onOpenShortcutsHelp,
  serverStatusOk,
}) => {
  const { isLight } = useTheme();

  return (
    <header className={`mission-control-navbar sticky top-0 z-40 w-full transition-colors duration-200 ${
      isLight
        ? 'bg-[#fdfcf8]/95 border-b border-[#1a1a1a]/12 backdrop-blur-md shadow-xs'
        : 'border-b border-cyan-500/20 bg-[#060914]/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
    }`}>
      <div className="mission-control-navbar__inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 grid grid-cols-1 xl:grid-cols-[minmax(260px,1fr)_auto_auto] gap-3 items-center">
        
        {/* Brand & Mission Title */}
        <button
          onClick={() => setActiveTab('overview')}
          className="flex items-center space-x-3 text-left group cursor-pointer focus:outline-none"
        >
          <BlackStarLogo size="md" />
          <div>
            <h1 className={`text-base sm:text-lg font-bold tracking-tight transition-colors flex items-center gap-1.5 ${
              isLight
                ? 'font-serif text-[#0b1324] font-black group-hover:text-[#d44d5c]'
                : 'font-nasa tracking-wider text-white group-hover:text-cyan-300'
            }`}>
              BLACK STAR ORBIT
            </h1>
          </div>
        </button>

        {/* Module Switcher Tabs */}
        <nav className={`mission-control-navbar__tabs flex items-center gap-1 p-1 rounded-xl border max-w-full overflow-x-auto nav-scroll ${
          isLight
            ? 'bg-[#f1f5f9] border-[#cbd5e1]'
            : 'bg-slate-900/60 border-white/[0.08]'
        }`}>
          {/* Distinct Editorial Publication Sector Button */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center shrink-0 gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
              activeTab === 'overview'
                ? isLight
                  ? 'bg-[#0b1324] text-[#ffffff] border-[#0b1324] font-bold shadow-xs'
                  : 'bg-cyan-600/30 text-cyan-300 border-cyan-500/50 shadow-sm font-semibold'
                : isLight
                  ? 'bg-black/5 hover:bg-black/10 text-[#1e293b] hover:text-[#0b1324] font-semibold border-transparent hover:border-[#1a1a1a]/20'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border-transparent hover:border-cyan-500/30'
            }`}
            title="Editorial Journal (Alt + O)"
            aria-label="Switch to Editorial Journal"
          >
            <Compass className={`h-4 w-4 shrink-0 ${activeTab === 'overview' ? (isLight ? 'text-white' : 'text-cyan-300') : 'text-[#d44d5c]'}`} />
            <span className="hidden sm:inline font-mono uppercase text-xs font-semibold">Editorial</span>
          </button>

          {/* Sector Separator: Distinctly separates Editorial Sector from Scientific Workstations */}
          <div className={`h-4.5 w-px mx-1 sm:mx-1.5 shrink-0 ${isLight ? 'bg-[#1a1a1a]/20' : 'bg-white/15'}`} />

          <button
            onClick={() => setActiveTab('spherex')}
            className={`flex items-center shrink-0 space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'spherex'
                ? isLight
                  ? 'bg-[#0b1324] text-[#ffffff] font-bold shadow-xs'
                  : 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : isLight
                  ? 'text-[#1e293b] hover:text-[#0b1324] hover:bg-black/5 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="SPHEREx All-Sky Spectral Explorer (Alt + S)"
          >
            <Telescope className="h-4 w-4" />
            <span className={isLight ? 'font-mono uppercase text-xs' : ''}>SPHEREx Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('planetx')}
            className={`flex items-center shrink-0 space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'planetx'
                ? isLight
                  ? 'bg-[#0b1324] text-[#ffffff] font-bold shadow-xs'
                  : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-sm'
                : isLight
                  ? 'text-[#1e293b] hover:text-[#0b1324] hover:bg-black/5 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Planet X Perturber Orbit Lab (Alt + P)"
          >
            <Orbit className="h-4 w-4" />
            <span className={isLight ? 'font-mono uppercase text-xs' : ''}>Planet X</span>
          </button>

          <button
            onClick={() => setActiveTab('astrobiology')}
            className={`flex items-center shrink-0 space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'astrobiology'
                ? isLight
                  ? 'bg-[#0b1324] text-[#ffffff] font-bold shadow-xs'
                  : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : isLight
                  ? 'text-[#1e293b] hover:text-[#0b1324] hover:bg-black/5 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Astrobiology & Biosignature Workbench (Alt + B)"
          >
            <FlaskConical className="h-4 w-4" />
            <span className={isLight ? 'font-mono uppercase text-xs' : ''}>Astrobiology</span>
          </button>

          <button
            onClick={() => setActiveTab('cosmic-suite')}
            className={`flex items-center shrink-0 space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'cosmic-suite'
                ? isLight
                  ? 'bg-[#0b1324] text-[#ffffff] font-bold shadow-xs'
                  : 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : isLight
                  ? 'text-[#1e293b] hover:text-[#0b1324] hover:bg-black/5 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Cosmic Frontier Suite (Alt + C)"
          >
            <Globe className="h-4 w-4" />
            <span className={isLight ? 'font-mono uppercase text-xs' : ''}>Cosmic Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`hidden md:flex items-center shrink-0 space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'architecture'
                ? isLight
                  ? 'bg-[#0b1324] text-[#ffffff] font-bold shadow-xs'
                  : 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-sm'
                : isLight
                  ? 'text-[#1e293b] hover:text-[#0b1324] hover:bg-black/5 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="NASA Mission Specs & Spectral Coverage (Alt + N)"
          >
            <Database className="h-4 w-4" />
            <span className={isLight ? 'font-mono uppercase text-xs' : ''}>NASA Specs</span>
          </button>
        </nav>

        {/* Quick Tools */}
        <div className="flex items-center justify-end gap-2 flex-wrap pr-12 sm:pr-14">
          {onOpenProjectTour && (
            <button
              onClick={onOpenProjectTour}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${isLight ? 'border-[#1a1a1a]/20 bg-white text-[#1a1a1a] hover:bg-black/5' : 'border-cyan-500/25 bg-slate-900/70 text-cyan-200 hover:border-cyan-400/50 hover:bg-cyan-950/40'}`}
              title="Replay the project guide tour"
              aria-label="Replay project tour"
            >
              <Compass className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Project tour</span>
              <span className="sm:hidden">Tour</span>
            </button>
          )}
          {/* Keyboard Shortcuts Cheat Sheet Button */}
          {onOpenShortcutsHelp && (
            <button
              onClick={onOpenShortcutsHelp}
              className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-lg text-xs font-mono transition whitespace-nowrap cursor-pointer border ${
                isLight
                  ? 'bg-[#ffffff] border-[#1a1a1a]/20 text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-black/5'
                  : 'bg-slate-900/70 border-white/[0.09] text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300'
              }`}
              title="Keyboard Shortcuts Guide (Alt + / or ?)"
              aria-label="Keyboard shortcuts"
            >
              <Keyboard className="h-3.5 w-3.5" />
              <kbd className="hidden xl:inline text-[10px] px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 font-bold">
                Alt+/
              </kbd>
            </button>
          )}

          {/* Data status button */}
          <button
            onClick={onOpenDataModal}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-mono transition whitespace-nowrap cursor-pointer ${
              isLight
                ? 'bg-[#ffffff] border border-[#1a1a1a]/20 text-[#1a1a1a] hover:border-[#1a1a1a]'
                : 'bg-slate-900/70 border border-white/[0.09] text-slate-300 hover:border-cyan-500/40'
            }`}
            title="Inspect NASA / IPAC Data Connectors"
          >
            <Activity className={`h-3.5 w-3.5 ${serverStatusOk ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`} />
            <span className="hidden lg:inline">Data Sources</span>
          </button>

        </div>
      </div>
    </header>
  );
};

