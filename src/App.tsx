/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BLACK STAR ORBIT — NASA Space Apps Challenge 2026
 * Full-Stack Astronomy Web Application
 * 
 * Modules:
 * 1. SPHEREx Explorer (Spectrophotometric all-sky infrared imaging)
 * 2. Planet X Explorer (Outer solar system candidate investigation)
 * 3. NASA Data & Architecture (Official IPAC/IRSA specifications & roadmap)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CosmicFrontierSuite } from './cosmic-frontier/CosmicFrontierSuite';
import { Navbar } from './components/Navbar.tsx';
import { SpherexViewer } from './components/spherex/SpherexViewer.tsx';
import { PlanetXDashboard } from './components/planetx/PlanetXDashboard.tsx';
import { ArchitectureView } from './components/data/ArchitectureView.tsx';
import { CosmicAiAssistant } from './components/ai/CosmicAiAssistant.tsx';
import { DataIntegrationModal } from './components/data/DataIntegrationModal.tsx';
import { AstrobiologyLab } from './components/astrobiology/AstrobiologyLab.tsx';
import { BlackStarLogo } from './components/common/BlackStarLogo.tsx';
import { CosmicLoadingScreen } from './components/common/CosmicLoadingScreen.tsx';
import { ProjectTour } from './components/common/ProjectTour.tsx';
import { EditorialVariation3 } from './components/editorial/EditorialVariation3.tsx';
import { useTheme } from './context/ThemeContext.tsx';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.ts';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal.tsx';
import {
  SpherexObservation,
  PlanetXCandidate,
  ExtremeTNO,
  PlanetXHypothesisParams,
} from './types/index.ts';
import {
  VERIFIED_ETNO_CATALOG,
  DEFAULT_PLANET_X_HYPOTHESIS,
  INITIAL_CANDIDATE_QUEUE,
} from './science/orbitalMechanics.ts';
import { ShieldCheck, Compass, ExternalLink, ArrowUpRight, Orbit, Telescope, Activity, FlaskConical, ImageIcon, Globe, Moon, Sun } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'spherex' | 'planetx' | 'astrobiology' | 'architecture' | 'cosmic-suite'>('overview');
  const [serverOk, setServerOk] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [showIntroModal, setShowIntroModal] = useState<boolean>(false);
  const [showProjectTour, setShowProjectTour] = useState<boolean>(false);

  // SPHEREx State
  const [spherexObservations, setSpherexObservations] = useState<SpherexObservation[]>([]);
  const [isSpherexLoading, setIsSpherexLoading] = useState<boolean>(true);
  const [spherexError, setSpherexError] = useState<string | null>(null);

  // Planet X State
  const [candidates, setCandidates] = useState<PlanetXCandidate[]>([]);
  const [etnoCatalog, setEtnoCatalog] = useState<ExtremeTNO[]>([]);
  const [hypothesis, setHypothesis] = useState<PlanetXHypothesisParams>(DEFAULT_PLANET_X_HYPOTHESIS);

  // Modals & AI State
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [aiContextType, setAiContextType] = useState<string>('general_science');
  const [aiPayload, setAiPayload] = useState<Record<string, unknown> | null>(null);

  // Fetch initial telemetry from backend
  const loadData = useCallback(async () => {
    setIsSpherexLoading(true);
    setSpherexError(null);

    try {
      const isJsonOk = (res: Response) =>
        res.ok && (res.headers.get('content-type') || '').includes('application/json');

      // Health check
      fetch('/api/health')
        .then((r) => (isJsonOk(r) ? r.json() : Promise.reject(new Error('No backend'))))
        .then(() => setServerOk(true))
        .catch(() => setServerOk(false));

      // SPHEREx observations
      const obsRes = await fetch('/api/spherex/observations');
      if (isJsonOk(obsRes)) {
        const obsData = await obsRes.json();
        setSpherexObservations(Array.isArray(obsData.observations) ? obsData.observations : []);
        setSpherexError(null);
      } else {
        setSpherexObservations([]);
        setSpherexError(`SPHEREx API unavailable (HTTP ${obsRes.status}). No synthetic observations are loaded.`);
      }

      // Planet X candidates
      const candRes = await fetch('/api/planetx/candidates');
      if (isJsonOk(candRes)) {
        const candData = await candRes.json();
        setCandidates(candData.candidates || INITIAL_CANDIDATE_QUEUE);
        if (candData.hypothesis) setHypothesis(candData.hypothesis);
      } else {
        setCandidates(INITIAL_CANDIDATE_QUEUE);
      }

      // eTNO catalog
      const etnoRes = await fetch('/api/planetx/etno-catalog');
      if (isJsonOk(etnoRes)) {
        const etnoData = await etnoRes.json();
        setEtnoCatalog(etnoData.objects || VERIFIED_ETNO_CATALOG);
      } else {
        setEtnoCatalog(VERIFIED_ETNO_CATALOG);
      }
    } catch (err: unknown) {
      console.warn('Backend fetch failed; SPHEREx observations remain empty rather than being simulated:', err);
      setSpherexObservations([]);
      setSpherexError(err instanceof Error ? err.message : 'SPHEREx backend unavailable. No synthetic observations are loaded.');
      setCandidates(INITIAL_CANDIDATE_QUEUE);
      setEtnoCatalog(VERIFIED_ETNO_CATALOG);
    } finally {
      setIsSpherexLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshCandidates = useCallback(async () => {
    try {
      const candRes = await fetch('/api/planetx/candidates');
      if (candRes.ok) {
        const candData = await candRes.json();
        setCandidates(candData.candidates || INITIAL_CANDIDATE_QUEUE);
      }
    } catch (err) {
      console.warn('Failed to refresh candidates:', err);
    }
  }, []);

  // Vetting handler
  const handleVetCandidate = async (
    id: string,
    status: PlanetXCandidate['status'],
    notes: string,
    verdict: string
  ) => {
    try {
      const res = await fetch(`/api/planetx/candidates/${id}/vet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, verdict }),
      });
      if (res.ok) {
        const data = await res.json();
        setCandidates((prev) =>
          prev.map((c) => (c.id === id ? data.candidate : c))
        );
        return;
      }
    } catch (err) {
      console.error('Failed to update candidate on server:', err);
    }

    // Local fallback update
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              notes,
              vettedBy: 'Space Apps Researcher / You',
              vettingTimestamp: new Date().toISOString(),
              vettingVerdict: verdict,
            }
          : c
      )
    );
  };

  // Open AI modal with context
  const handleExplainWithAi = (
    contextType: string,
    payload: Record<string, unknown>,
    _prompt?: string
  ) => {
    setAiContextType(contextType);
    setAiPayload(payload);
    setIsAiModalOpen(true);
  };

  const { isLight, toggleTheme } = useTheme();

  const handleProjectTourComplete = useCallback(() => {
    try {
      window.localStorage.setItem('black-star-orbit-project-tour-completed', 'true');
    } catch (error) {
      console.warn('Could not save project tour preference:', error);
    }
    setShowProjectTour(false);
  }, []);

  const handleInitialEnter = useCallback(() => {
    setIsInitialLoading(false);
    try {
      const tourCompleted =
        window.localStorage.getItem('black-star-orbit-project-tour-completed') === 'true';

      // Existing visitors have a workspace footprint from earlier versions.
      // Preserve their flow: take them straight into the Cosmic Frontier Suite.
      const hasVisitedBefore =
        window.localStorage.getItem('blackstar_orbit_theme') !== null ||
        window.localStorage.getItem('blackstar_discovery_bookmarks') !== null;

      if (tourCompleted || hasVisitedBefore) {
        window.localStorage.setItem('black-star-orbit-project-tour-completed', 'true');
        setActiveTab('overview');
        setShowProjectTour(false);
      } else {
        setShowProjectTour(true);
      }
    } catch {
      // If browser storage is unavailable, offer the tour for this visit.
      setShowProjectTour(true);
    }
  }, []);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState<boolean>(false);

  const { lastTriggered } = useKeyboardShortcuts({
    activeTab,
    onNavigate: (module) => setActiveTab(module),
    onToggleTheme: toggleTheme,
    onOpenShortcutsHelp: () => setIsShortcutsHelpOpen((prev) => !prev),
    disabled: isInitialLoading || showIntroModal,
  });

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isLight
        ? 'theme-light bg-[#fdfcf8] text-[#1a1a1a] selection:bg-[#d44d5c] selection:text-white'
        : 'bg-slate-950 text-slate-100 cosmic-grid selection:bg-cyan-500/30 selection:text-cyan-200'
    }`}>
      {/* Editorial Edge Labels when in Light Theme */}
      {isLight && (
        <>
          <div className="editorial-edge-label editorial-edge-t hidden sm:block">
            Observation Platform // NASA 2026
          </div>
          <div className="editorial-edge-label editorial-edge-l hidden md:block">
            45.034.22 // ARCHIVE
          </div>
        </>
      )}

      {/* Cosmic Loading Screen & Intro Visual Display */}
      {isInitialLoading && (
        <CosmicLoadingScreen
          isLoading={isInitialLoading}
          onEnter={handleInitialEnter}
        />
      )}

      {showIntroModal && (
        <CosmicLoadingScreen
          isLoading={false}
          showIntroMode={true}
          onCloseIntro={() => setShowIntroModal(false)}
        />
      )}

      {/* If activeTab is 'overview', render full-fidelity Variation 3 Editorial layout */}
      {activeTab === 'overview' ? (
        <EditorialVariation3
          onNavigate={setActiveTab}
          onOpenDataModal={() => setIsDataModalOpen(true)}
          onOpenAiAssistant={() => {
            setAiContextType('general_science');
            setAiPayload({
              mission: 'NASA Space Apps Challenge 2026',
              spherexStatus: 'Level-2/3 Specification Calibrated',
              planetXModel: 'Batygin & Brown (2021) Eccentric Perturber',
            });
            setIsAiModalOpen(true);
          }}
          onSwitchTheme={toggleTheme}
          onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
        />
      ) : (
        <>
          {/* Navigation Header for Workstation Modules */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenDataModal={() => setIsDataModalOpen(true)}
            onOpenIntroModal={() => setShowIntroModal(true)}
            onOpenProjectTour={() => setShowProjectTour(true)}
            onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
            serverStatusOk={serverOk}
          />
        </>
      )}

      {/* Main Content Area for Workstation Modules */}
      {activeTab !== 'overview' && (
        <main className={`flex-1 w-full mx-auto ${activeTab === 'cosmic-suite' ? 'max-w-none' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6'}`}>

        {activeTab === 'cosmic-suite' && (
          <CosmicFrontierSuite 
            onSwitchToEditorial={() => setActiveTab('overview')} 
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'spherex' && (
          <SpherexViewer
            observations={spherexObservations}
            isLoading={isSpherexLoading}
            error={spherexError}
            onRetry={loadData}
            onCandidatePromoted={refreshCandidates}
            onExplainWithAi={handleExplainWithAi}
          />
        )}

        {activeTab === 'astrobiology' && (
          <AstrobiologyLab
            onNavigateToSpherex={() => setActiveTab('spherex')}
          />
        )}

        {activeTab === 'planetx' && (
          <PlanetXDashboard
            candidates={candidates}
            etnoCatalog={etnoCatalog}
            hypothesis={hypothesis}
            onVetCandidate={handleVetCandidate}
            onUpdateHypothesis={setHypothesis}
            onExplainWithAi={handleExplainWithAi}
          />
        )}

        {activeTab === 'architecture' && <ArchitectureView />}
        </main>
      )}

      {/* Footer for Workstation Modules */}
      {activeTab !== 'cosmic-suite' && activeTab !== 'overview' && (
        <footer className={`py-6 px-4 sm:px-6 lg:px-8 text-xs font-mono border-t transition-colors ${
          isLight
            ? 'bg-[#fdfcf8] border-[#1a1a1a]/12 text-[#666]'
            : 'border-slate-800/80 bg-slate-950/90 text-slate-500'
        }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <BlackStarLogo size="xs" />
                        <span className={`font-semibold ${isLight ? 'font-serif text-[#1a1a1a] text-sm' : 'text-slate-300 font-display'}`}>
              BLACK STAR ORBIT
            </span>
            <span>•</span>
            <span className={isLight ? 'text-[#888]' : ''}>NASA Space Apps Challenge 2026</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span className={`flex items-center gap-1 ${isLight ? 'text-[#1a1a1a]' : 'text-slate-400'}`}>
              <ShieldCheck className={`h-3.5 w-3.5 ${isLight ? 'text-[#d44d5c]' : 'text-cyan-400'}`} />
              Grounded AI (No Fabricated Detections)
            </span>
            <span>•</span>
            <button
              onClick={() => setIsDataModalOpen(true)}
              className={`${isLight ? 'text-[#d44d5c] hover:underline' : 'text-cyan-400 hover:underline'} cursor-pointer`}
            >
              NASA IPAC IRSA Specifications
            </button>
            <span>•</span>
            <a
              href="https://spherex.caltech.edu"
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-1 ${isLight ? 'hover:text-[#1a1a1a]' : 'hover:text-slate-300'}`}
            >
              <span>Caltech SPHEREx</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>
      )}

      {showProjectTour && !isInitialLoading && (
        <ProjectTour
          isLight={isLight}
          onComplete={handleProjectTourComplete}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      )}

      {/* AI Assistant Modal */}
      <CosmicAiAssistant
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        activeContextType={aiContextType}
        activePayload={aiPayload}
      />

      {/* NASA Data & Protocol Architecture Modal */}
      <DataIntegrationModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
      />

      {/* Floating Moon/Theme Toggle at Top Corner (Universal across all pages, excluded from launching page) */}
      {!isInitialLoading && !showIntroModal && (
        <button
          onClick={toggleTheme}
          className={`group fixed top-3 sm:top-3.5 right-3 sm:right-4 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full border transition-all duration-200 cursor-pointer backdrop-blur-md shadow-md hover:scale-105 active:scale-95 flex items-center justify-center ${
            isLight
              ? 'bg-[#ffffff]/90 hover:bg-[#ffffff] text-[#1a1a1a] border-[#1a1a1a]/20 hover:border-[#1a1a1a] shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
              : 'bg-[#091224]/90 hover:bg-[#0e1c38] text-cyan-300 border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_18px_rgba(56,189,248,0.3)]'
          }`}
          title={isLight ? 'Switch to Cosmic Dark Orbit (Alt + T)' : 'Switch to Editorial Light Journal (Alt + T)'}
          aria-label="Toggle dark/light mode"
        >
          {isLight ? (
            <Moon className="w-4 h-4 text-[#1a1a1a] group-hover:text-amber-500 transition-colors" />
          ) : (
            <Sun className="w-4 h-4 text-amber-300 group-hover:text-amber-200 transition-colors" />
          )}
        </button>
      )}

      {/* Keyboard Shortcut HUD Feedback Toast */}
      {lastTriggered && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-fade-in">
          <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-2xl backdrop-blur-md ${
            isLight
              ? 'bg-white/95 border-[#1a1a1a]/20 text-[#1a1a1a] shadow-lg'
              : 'bg-slate-950/95 border-cyan-400/50 text-white shadow-[0_0_25px_rgba(56,189,248,0.35)]'
          }`}>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <kbd className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider border ${
              isLight
                ? 'bg-black/5 border-[#1a1a1a]/20 text-[#1a1a1a]'
                : 'bg-cyan-950/90 border-cyan-400/40 text-cyan-300'
            }`}>
              {lastTriggered.label}
            </kbd>
            <span className={`text-xs font-semibold tracking-wider ${isLight ? 'font-mono text-[#1a1a1a]' : 'font-nasa text-slate-100'}`}>
              {lastTriggered.moduleName}
            </span>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
        onNavigate={(mod) => setActiveTab(mod)}
        onToggleTheme={toggleTheme}
        isLight={isLight}
      />
    </div>
  );
}
