import type { FC } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AiVisualStudio } from '../../components/editorial/AiVisualStudio';
import { assetUrl } from '../../utils/assetUrl';
import type { AppPage } from '../types';
import { NasaLiveDispatch } from './NasaLiveDispatch';
import { 
  Telescope, 
  Orbit, 
  ChevronRight, 
  ArrowRight,
  Database,
  Compass,
  Disc
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: AppPage) => void;
}

export const HomePage: FC<HomePageProps> = ({ onNavigate }) => {
  const { isLight } = useTheme();

  return (
    <div className="cf-lab-home space-y-8 pb-12 pt-3">
      {/* DISCOVERY CATEGORIES GATEWAY */}
      <section id="observatories-section" className="cf-home-hero max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <img
          className="cf-home-hero__image"
          src={assetUrl('/assets/JWST Messier 16 processed.jpg')}
          alt="JWST NIRCam infrared image of the Pillars of Creation in the Eagle Nebula (Messier 16)"
          loading="eager"
          fetchPriority="high"
          aria-hidden="true"
        />
        <div className="cf-home-hero__shade" aria-hidden="true" />
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 text-xs font-mono font-semibold uppercase tracking-wider">
            COSMIC LAB
          </div>
          <h2 data-subtopic="Astronomy Observatories & Research Consoles" className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
            Explore the universe
          </h2>
          <p className="text-sm sm:text-base text-[#A7B4CC] leading-relaxed">
            Choose a workspace and start exploring.
          </p>
        </div>

        {/* PRIMARY FLAGSHIPS: SPHEREx Explorer & Planet X Investigation Lab */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Flagship 1: SPHEREx Explorer (7 Cols) */}
          <div 
            onClick={() => onNavigate('spherex')}
            className="cf-surface cf-surface--cyan lg:col-span-7 group rounded-2xl bg-[#0B1630] border border-[#1E293B] p-6 sm:p-7 space-y-5 shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
                  <Telescope className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-semibold text-[#38BDF8] px-2.5 py-0.5 rounded-full bg-[#050B1A] border border-[#1E293B]">
                  102 Infrared Bands • 0.75–5.0 µm
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-wider font-semibold">
                  INFRARED SKY
                </span>
                <h3 className="text-2xl font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors">
                  SPHEREx Explorer
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#A7B4CC] leading-relaxed">
                Explore infrared observations across 0.75–5.0 µm.
              </p>
              
              <div className="grid grid-cols-3 gap-2.5 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#050B1A]/70 border border-[#1E293B]">
                  <div className="text-[10px] text-[#A7B4CC]">Spectral Span</div>
                  <div className="font-bold text-[#F8FAFC]">0.75 – 5.0 µm</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#050B1A]/70 border border-[#1E293B]">
                  <div className="text-[10px] text-[#A7B4CC]">Channels</div>
                  <div className="font-bold text-[#38BDF8]">102 Bands (LVF)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#050B1A]/70 border border-[#1E293B]">
                  <div className="text-[10px] text-[#A7B4CC]">Pipeline</div>
                  <div className="font-bold text-emerald-400">IRSA ObsCore</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs font-mono font-bold text-[#38BDF8]">
              <span>Open SPHEREx</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Flagship 2: Planet X Investigation Lab (5 Cols) */}
          <div 
            onClick={() => onNavigate('planet-x')}
            className="cf-surface cf-surface--violet lg:col-span-5 group rounded-2xl bg-[#0B1630] border border-[#1E293B] p-6 sm:p-7 space-y-5 shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center text-[#C084FC]">
                  <Orbit className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-semibold text-[#C084FC] px-2.5 py-0.5 rounded-full bg-[#050B1A] border border-[#1E293B]">
                  Batygin & Brown Hypotheses
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono text-[#8B5CF6] uppercase tracking-wider font-semibold">
                  OUTER SOLAR SYSTEM
                </span>
                <h3 className="text-2xl font-bold text-[#F8FAFC] group-hover:text-[#C084FC] transition-colors">
                  Planet X Investigation Lab
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#A7B4CC] leading-relaxed">
                Explore distant orbits, eTNOs, and the Planet Nine hypothesis.
              </p>

              <div className="space-y-2 pt-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#050B1A]/70 border border-[#1E293B]">
                  <span className="text-[#A7B4CC]">Predicted Mass:</span>
                  <span className="font-bold text-[#F5C451]">5 – 10 M⊕ (~380 AU)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#050B1A]/70 border border-[#1E293B]">
                  <span className="text-[#A7B4CC]">Orbital Signature:</span>
                  <span className="font-bold text-[#C084FC]">ω & Ω Anti-Aligned</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs font-mono font-bold text-[#C084FC]">
              <span>Open Planet X</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* GEMINI VISUAL STUDIO — creative astronomy workspace */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Gemini Visual Studio">
          <AiVisualStudio isLight={isLight} />
        </section>

        {/* STRUCTURED EXPLORATION DOMAINS (4 Thematic Clusters) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Domain 1: Solar System & Orbits */}
          <div className="p-5 rounded-2xl bg-[#0B1630]/60 border border-[#1E293B] space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#38BDF8] font-semibold">
                <span>01. SOLAR SYSTEM</span>
                <Orbit className="w-4 h-4" />
              </div>
              <h4 className="text-base font-bold text-[#F8FAFC]">Planets & Distant Orbits</h4>
              <p className="text-xs text-[#A7B4CC] leading-relaxed">
                Explore planetary orbits and distant objects.
              </p>
            </div>
            <div className="space-y-2 pt-2 border-t border-[#1E293B]/70">
              <button
                onClick={() => onNavigate('universe')}
                className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-[#050B1A] text-xs font-mono text-[#F8FAFC] hover:text-[#38BDF8] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>3D Solar System</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('planet-x')}
                className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-[#050B1A] text-xs font-mono text-[#F8FAFC] hover:text-[#8B5CF6] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Planet X Investigation Lab</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Domain 2: Deep Space & Exoplanets */}
          <div className="p-5 rounded-2xl bg-[#0B1630]/60 border border-[#1E293B] space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#C084FC] font-semibold">
                <span>02. DEEP UNIVERSE</span>
                <Disc className="w-4 h-4" />
              </div>
              <h4 className="text-base font-bold text-[#F8FAFC]">Exoplanets & Galaxies</h4>
              <p className="text-xs text-[#A7B4CC] leading-relaxed">
                Browse confirmed exoplanets and distant galaxies.
              </p>
            </div>
            <div className="space-y-2 pt-2 border-t border-[#1E293B]/70">
              <button
                onClick={() => onNavigate('exoplanets')}
                className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-[#050B1A] text-xs font-mono text-[#F8FAFC] hover:text-[#C084FC] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Exoplanet Lab</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('galaxies')}
                className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-[#050B1A] text-xs font-mono text-[#F8FAFC] hover:text-[#C084FC] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Galaxy Explorer</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Domain 3: Missions & Spectral Science */}
          <div className="p-5 rounded-2xl bg-[#0B1630]/60 border border-[#1E293B] space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#F5C451] font-semibold">
                <span>03. MISSIONS & DEFENSE</span>
                <Compass className="w-4 h-4" />
              </div>
              <h4 className="text-base font-bold text-[#F8FAFC]">Infrared & Asteroid Watch</h4>
              <p className="text-xs text-[#A7B4CC] leading-relaxed">
                Explore infrared data and near-Earth objects.
              </p>
            </div>
            <div className="space-y-2 pt-2 border-t border-[#1E293B]/70">
              <button
                onClick={() => onNavigate('spherex')}
                className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-[#050B1A] text-xs font-mono text-[#F8FAFC] hover:text-[#38BDF8] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>SPHEREx Explorer</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('asteroid-watch')}
                className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-[#050B1A] text-xs font-mono text-[#F8FAFC] hover:text-emerald-400 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Asteroid Watch (CNEOS)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Domain 4: Data Centre & AI Assistant */}
          <div className="p-5 rounded-2xl bg-[#0B1630]/60 border border-[#1E293B] space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
                <span>04. DATA & PEDAGOGY</span>
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-base font-bold text-[#F8FAFC]">Open Archives & Guide</h4>
              <p className="text-xs text-[#A7B4CC] leading-relaxed">
                Search mission archives and ask the astronomy guide.
              </p>
            </div>
            <div className="space-y-2 pt-2 border-t border-[#1E293B]/70">
              <button
                onClick={() => onNavigate('data-centre')}
                className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-[#050B1A] text-xs font-mono text-[#F8FAFC] hover:text-[#38BDF8] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>NASA Data Centre</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('ai-guide')}
                className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-[#050B1A] text-xs font-mono text-[#F8FAFC] hover:text-[#10B981] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>COSMIC GUIDE</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NasaLiveDispatch onNavigate={onNavigate} />
      </section>
    </div>
  );
};
