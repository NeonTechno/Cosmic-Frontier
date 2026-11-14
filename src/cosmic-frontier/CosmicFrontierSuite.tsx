import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppPage, SolarSystemObject } from './types';
import { SOLAR_SYSTEM_OBJECTS } from './data/solarSystemData';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { MissionControlDashboard } from './components/MissionControlDashboard';
import { LiveCosmicObservatory } from './components/LiveCosmicObservatory';
import { Universe3DExplorer } from './components/Universe3DExplorer';
import { AsteroidWatch } from './components/AsteroidWatch';
import { ExoplanetDiscoveryLab } from './components/ExoplanetDiscoveryLab';
import { GalaxyExplorer } from './components/GalaxyExplorer';
import { SPHERExExplorer } from './components/SPHERExExplorer';
import { PlanetXExplorer } from './components/PlanetXExplorer';
import { NasaDataCentre } from './components/NasaDataCentre';
import { AIGuide } from './components/AIGuide';
import { AboutPage } from './components/AboutPage';
import { AstrobiologyLab } from '../components/astrobiology/AstrobiologyLab';

// Common Next-Gen Scientific Modals & Drawers
import { CosmicCommandPalette } from './components/common/CosmicCommandPalette';
import { CelestialObjectInspector } from './components/common/CelestialObjectInspector';
import { ObjectComparisonModal } from './components/common/ObjectComparisonModal';
import { DiscoveryCollectionDrawer } from './components/common/DiscoveryCollectionDrawer';
import { FreezePaneButton } from '../components/common/FreezePaneButton';

const BOOKMARKS_STORAGE_KEY = 'blackstar_discovery_bookmarks';

const COSMIC_LAB_TOPICS: Record<string, { topic: string; subtopic: string }> = {
  home: {
    topic: 'Cosmic Lab Observatories',
    subtopic: 'Astronomy Observatories & Research Consoles',
  },
  'mission-control': {
    topic: 'Mission Control Dashboard',
    subtopic: 'Unified Planetary Command & Telemetry',
  },
  observatory: {
    topic: 'Live Cosmic Observatory',
    subtopic: 'Keplerian Motion & Historical Epochs',
  },
  universe: {
    topic: '3D Universe Explorer',
    subtopic: 'Interactive Heliocentric Orrery',
  },
  'asteroid-watch': {
    topic: 'Asteroid Watch & NEO Defense',
    subtopic: 'Close-Approach Telemetry & Orbits',
  },
  exoplanets: {
    topic: 'Exoplanet Discovery Lab',
    subtopic: 'Worlds Beyond Our Solar System',
  },
  galaxies: {
    topic: 'Galaxy Explorer',
    subtopic: 'Deep-Sky Catalog & Extragalactic Redshifts',
  },
  'data-centre': {
    topic: 'NASA Astronomical Data Centre',
    subtopic: 'Verified Catalogs & Mission Archives',
  },
  'ai-guide': {
    topic: 'Cosmic AI Guide',
    subtopic: 'Interactive Astrophysics Q&A',
  },
  guide: {
    topic: 'Cosmic AI Guide',
    subtopic: 'Interactive Astrophysics Q&A',
  },
  about: {
    topic: 'About Black Star Orbit',
    subtopic: 'NASA Space Apps Challenge 2026',
  },
};

export type MainAppTab = 'overview' | 'spherex' | 'planetx' | 'astrobiology' | 'architecture' | 'cosmic-suite';

interface CosmicFrontierSuiteProps {
  onSwitchToEditorial?: () => void;
  onNavigateTab?: (tab: MainAppTab) => void;
}

export function CosmicFrontierSuite({ onSwitchToEditorial, onNavigateTab }: CosmicFrontierSuiteProps = {}) {
  const [currentPage, setCurrentPage] = useState<AppPage>('home');

  // Next-Gen Modals & Drawers State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedInspectorObject, setSelectedInspectorObject] = useState<SolarSystemObject | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareInitialA, setCompareInitialA] = useState<SolarSystemObject | undefined>(undefined);
  const [compareInitialB, setCompareInitialB] = useState<SolarSystemObject | undefined>(undefined);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [panesFrozen, setPanesFrozen] = useState(true);
  const [activeSubtopic, setActiveSubtopic] = useState('');
  const mainRef = useRef<HTMLElement>(null);

  // Persistent bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['ceres', 'earth', 'planet-x'];
    } catch {
      return ['ceres', 'earth', 'planet-x'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.warn('Failed to persist bookmarks:', e);
    }
  }, [bookmarkedIds]);

  const handleToggleBookmark = useCallback((object: SolarSystemObject) => {
    setBookmarkedIds((prev) => {
      if (prev.includes(object.id)) {
        return prev.filter((id) => id !== object.id);
      } else {
        return [...prev, object.id];
      }
    });
  }, []);

  const handleRemoveBookmark = useCallback((id: string) => {
    setBookmarkedIds((prev) => prev.filter((item) => item !== id));
  }, []);

  // Global Keyboard Shortcuts (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle URL hash routing or direct navigation
  const handleNavigate = (page: AppPage) => {
    // Blend/fuse flagship modules to their respective master sites
    if (page === 'spherex' && onNavigateTab) {
      onNavigateTab('spherex');
      return;
    }
    if (page === 'planet-x' && onNavigateTab) {
      onNavigateTab('planetx');
      return;
    }
    if (page === 'astrobiology' && onNavigateTab) {
      onNavigateTab('astrobiology');
      return;
    }

    let targetPage: AppPage = page;
    if (page === 'guide' || page === 'ai-guide') {
      targetPage = 'ai-guide';
    } else if ((page as string) === 'live-space') {
      targetPage = 'mission-control';
    }
    setCurrentPage(targetPage);
    if (targetPage === 'home') {
      if (window.location.hash) {
        window.location.hash = '';
      }
      if (window.location.pathname !== '/' && window.history?.pushState) {
        window.history.pushState(null, '', '/');
      }
    } else {
      window.location.hash = targetPage;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Object Inspector
  const handleInspectObject = (objectIdOrObject: string | SolarSystemObject) => {
    if (typeof objectIdOrObject === 'string') {
      const found = SOLAR_SYSTEM_OBJECTS.find((o) => o.id === objectIdOrObject);
      if (found) setSelectedInspectorObject(found);
    } else {
      setSelectedInspectorObject(objectIdOrObject);
    }
  };

  // Open Compare Modal
  const handleOpenComparison = (objA?: SolarSystemObject, objB?: SolarSystemObject) => {
    setCompareInitialA(objA);
    setCompareInitialB(objB);
    setIsCompareModalOpen(true);
  };

  // Sync with browser hash and path on initial load and hash change
  useEffect(() => {
    const handleLocationChange = () => {
      // Strip leading and trailing slashes and hashes
      const rawHash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
      const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const fullCandidate = (rawHash || rawPath).toLowerCase();
      const candidate = fullCandidate.split('?')[0];

      if (candidate === 'live-space') {
        setCurrentPage('mission-control');
        window.location.hash = 'mission-control';
      } else if (candidate === 'ai-guide' || candidate === 'guide') {
        setCurrentPage('ai-guide');
      } else if (candidate === 'spherex' || candidate === 'image-lab') {
        setCurrentPage('spherex');
      } else if (candidate === 'astrobiology' || candidate === 'ice-lab') {
        setCurrentPage('astrobiology');
      } else if (candidate === 'home' || !candidate) {
        setCurrentPage('home');
      } else if (['mission-control', 'observatory', 'universe', 'asteroid-watch', 'exoplanets', 'galaxies', 'planet-x', 'data-centre', 'about', 'astrobiology'].includes(candidate)) {
        setCurrentPage(candidate as AppPage);
      } else {
        // Fallback for any unknown route/hash to guarantee the app never stays blank
        setCurrentPage('home');
      }
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Track visible subtopic headlines inside Cosmic Lab pages for the frozen Topic/Subtopic bar
  useEffect(() => {
    const meta = COSMIC_LAB_TOPICS[currentPage] || COSMIC_LAB_TOPICS.home;
    setActiveSubtopic(meta.subtopic);

    const container = mainRef.current;
    if (!container) return;

    let observer: IntersectionObserver | null = null;
    const timer = window.setTimeout(() => {
      const elements = Array.from(container.querySelectorAll<HTMLElement>('[data-subtopic]'));
      if (elements.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible.length > 0) {
            const sub = visible[0].target.getAttribute('data-subtopic');
            if (sub) setActiveSubtopic(sub);
          }
        },
        {
          rootMargin: '-120px 0px -60% 0px',
          threshold: 0.05,
        }
      );

      elements.forEach((el) => observer?.observe(el));
    }, 120);

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [currentPage]);

  const currentTopicMeta = COSMIC_LAB_TOPICS[currentPage] || COSMIC_LAB_TOPICS.home;

  return (
    <div className="min-h-screen flex flex-col bg-[#050B1A] text-[#F8FAFC] selection:bg-[#38BDF8]/20 selection:text-[#38BDF8]">
      {/* Global Modern Navbar with Quick Commands & Research Collection */}
      <Navbar 
        currentPage={currentPage} 
        onNavigate={handleNavigate}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenCompare={() => handleOpenComparison()}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        bookmarksCount={bookmarkedIds.length}
        onSwitchToEditorial={onSwitchToEditorial}
      />

      {/* Frozen Cosmic Lab Topic & Subtopic Headline Bar */}
      <div
        className={`${
          panesFrozen ? 'sticky top-16 sm:top-[72px] z-30 backdrop-blur-md shadow-lg' : ''
        } border-b border-[#1E293B] bg-[#070E22]/95 transition-all`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 font-semibold shrink-0">
              Cosmic Lab
            </span>
            <h2 className="text-sm sm:text-base font-bold text-[#F8FAFC] tracking-tight truncate">
              {currentTopicMeta.topic}
            </h2>
            <span className="text-[#475569] hidden sm:inline">/</span>
            <span className="text-xs font-mono text-[#38BDF8] truncate">
              {activeSubtopic || currentTopicMeta.subtopic}
            </span>
          </div>

          <FreezePaneButton
            frozen={panesFrozen}
            onToggle={() => setPanesFrozen((v) => !v)}
            label="Freeze Headlines"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <main ref={mainRef} className="flex-1">
        <div key={currentPage} className="animate-page-enter">
          {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
          {currentPage === 'mission-control' && (
            <MissionControlDashboard onNavigate={handleNavigate} />
          )}
          {currentPage === 'observatory' && <LiveCosmicObservatory onNavigate={handleNavigate} />}
          {currentPage === 'universe' && (
            <Universe3DExplorer 
              onNavigate={handleNavigate} 
              onInspectObject={handleInspectObject}
              onCompareObject={(obj) => handleOpenComparison(obj)}
            />
          )}
          {currentPage === 'asteroid-watch' && <AsteroidWatch onNavigate={handleNavigate} />}
          {currentPage === 'exoplanets' && <ExoplanetDiscoveryLab onNavigate={handleNavigate} />}
          {currentPage === 'galaxies' && <GalaxyExplorer onNavigate={handleNavigate} />}
          {currentPage === 'spherex' && <SPHERExExplorer />}
          {currentPage === 'astrobiology' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <AstrobiologyLab onNavigateToSpherex={() => handleNavigate('spherex')} />
            </div>
          )}
          {currentPage === 'planet-x' && <PlanetXExplorer onNavigate={handleNavigate} />}
          {currentPage === 'data-centre' && <NasaDataCentre onNavigate={handleNavigate} />}
          {(currentPage === 'guide' || currentPage === 'ai-guide') && (
            <AIGuide onNavigate={handleNavigate} />
          )}
          {currentPage === 'about' && <AboutPage />}
        </div>
      </main>

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* --- NEXT-GEN SCIENTIFIC HUD MODALS --- */}

      {/* 1. Cosmic Command Palette (Cmd/Ctrl + K) */}
      <CosmicCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onSelectObject={(objId) => {
          handleInspectObject(objId);
        }}
        onOpenCompareModal={() => {
          setIsCommandPaletteOpen(false);
          setIsCompareModalOpen(true);
        }}
        onOpenBookmarks={() => {
          setIsCommandPaletteOpen(false);
          setIsBookmarksOpen(true);
        }}
      />

      {/* 2. Holographic Celestial Object Inspector */}
      <CelestialObjectInspector
        object={selectedInspectorObject}
        onClose={() => setSelectedInspectorObject(null)}
        onOpenIn3D={() => {
          setSelectedInspectorObject(null);
          handleNavigate('universe');
        }}
        onCompare={(obj) => {
          setSelectedInspectorObject(null);
          handleOpenComparison(obj);
        }}
        onAskAI={() => {
          setSelectedInspectorObject(null);
          handleNavigate('ai-guide');
        }}
        isBookmarked={selectedInspectorObject ? bookmarkedIds.includes(selectedInspectorObject.id) : false}
        onToggleBookmark={handleToggleBookmark}
      />

      {/* 3. Object Comparison Matrix Modal */}
      <ObjectComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        initialObjectA={compareInitialA}
        initialObjectB={compareInitialB}
      />

      {/* 4. Personal Discovery Collection Drawer */}
      <DiscoveryCollectionDrawer
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarkedIds={bookmarkedIds}
        onRemoveBookmark={handleRemoveBookmark}
        onSelectObject={(objId) => {
          setIsBookmarksOpen(false);
          handleInspectObject(objId);
        }}
      />
    </div>
  );
}

export default CosmicFrontierSuite;
