import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Check, Compass, Database, FlaskConical,
  Globe2, Orbit, Rocket, Telescope, X
} from 'lucide-react';

type TourTab = 'overview' | 'cosmic-suite' | 'spherex' | 'planetx' | 'astrobiology' | 'architecture';

interface ProjectTourProps {
  onComplete: () => void;
  onNavigate: (tab: TourTab) => void;
  isLight: boolean;
}

const steps = [
  {
    eyebrow: 'WELCOME ABOARD',
    title: 'Explore the universe with evidence.',
    description: 'Black Star Orbit brings together infrared sky observations, outer Solar System research and the tools used to investigate worlds beyond our own.',
    detail: 'This short tour introduces the main workspaces and how to move between them.',
    icon: Rocket,
    tab: 'overview' as TourTab,
    action: 'Open Editorial Journal',
    highlights: ['Editorial journal', 'Evidence-led research', 'Learning pathways'],
  },
  {
    eyebrow: '01 / THE JOURNAL',
    title: 'Start with the science story.',
    description: 'The Editorial Journal is the front door to Black Star Orbit: a readable field guide to the mission, its discoveries, the questions being investigated, and an AI visual studio for illustrative astronomy concept art.',
    detail: 'Use it as your home page whenever you return. From the journal, move directly into SPHEREx, Planet X or the Astrobiology Lab.',
    icon: BookOpen,
    tab: 'overview' as TourTab,
    action: 'Read the journal',
    highlights: ['Mission context', 'Research highlights', 'AI visual studies'],
  },
  {
    eyebrow: '01 / THE PLATFORM',
    title: 'Your mission control.',
    description: 'The Cosmic Frontier Suite is the central workspace for exploring the project’s scientific experiences, discoveries and research tools.',
    detail: 'Use the navigation to move between the editorial overview and the interactive workspaces.',
    icon: Globe2,
    tab: 'cosmic-suite' as TourTab,
    action: 'Open Cosmic Lab',
    highlights: ['Unified workspace', 'Module navigation', 'Research context'],
  },
  {
    eyebrow: '02 / INFRARED SKY',
    title: 'Meet SPHEREx.',
    description: 'Explore the all-sky infrared mission through spectral observations, wavelength views and archive-backed data workflows.',
    detail: 'SPHEREx tools help you investigate how the sky looks across infrared wavelengths.',
    icon: Telescope,
    tab: 'spherex' as TourTab,
    action: 'Open SPHEREx',
    highlights: ['102 infrared bands', '0.75–5.0 µm', 'Archive workflows'],
  },
  {
    eyebrow: '03 / OUTER SOLAR SYSTEM',
    title: 'Investigate Planet X.',
    description: 'Examine distant trans-Neptunian objects, orbital patterns and candidate evidence related to the Planet X hypothesis.',
    detail: 'Distinguish confirmed catalogue objects from candidate interpretations and model scenarios.',
    icon: Orbit,
    tab: 'planetx' as TourTab,
    action: 'Open Planet X',
    highlights: ['eTNO catalogue', 'Orbital patterns', 'Candidate review'],
  },
  {
    eyebrow: '04 / LIFE BEYOND EARTH',
    title: 'Enter the Astrobiology Lab.',
    description: 'Explore habitability, biosignatures and the scientific questions used when evaluating the possibility of life beyond Earth.',
    detail: 'The lab connects planetary environments with the evidence researchers look for.',
    icon: FlaskConical,
    tab: 'astrobiology' as TourTab,
    action: 'Open Astrobiology',
    highlights: ['Habitability', 'Biosignatures', 'Prebiotic chemistry'],
  },
  {
    eyebrow: '05 / TRACEABLE SCIENCE',
    title: 'Follow the data.',
    description: 'Review NASA and IPAC data specifications, source information and the architecture behind the project’s scientific workflows.',
    detail: 'Wherever possible, the platform distinguishes live archive responses from verified reference data.',
    icon: Database,
    tab: 'architecture' as TourTab,
    action: 'View NASA specifications',
    highlights: ['NASA / IPAC references', 'Data provenance', 'System architecture'],
  },
];

export const ProjectTour: React.FC<ProjectTourProps> = ({ onComplete, onNavigate, isLight }) => {
  const [current, setCurrent] = useState(0);
  const step = steps[current];
  const Icon = step.icon;
  const light = isLight;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setCurrent((value) => Math.min(value + 1, steps.length - 1));
      if (event.key === 'ArrowLeft') setCurrent((value) => Math.max(value - 1, 0));
      if (event.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onComplete]);

  const finish = (tab?: TourTab) => {
    onNavigate(tab || 'overview');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#020611]/90 px-4 py-6 backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby="project-tour-title">
      <div className={`relative my-auto w-full max-w-3xl overflow-hidden rounded-3xl border shadow-2xl ${light ? 'border-slate-200 bg-[#fbfaf7] text-slate-900' : 'border-white/10 bg-[#080f20] text-white'}`}>
        <div className="absolute inset-x-0 top-0 h-1 bg-white/10">
          <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${((current + 1) / steps.length) * 100}%` }} />
        </div>
        <div className="flex items-center justify-between px-6 pb-4 pt-7 sm:px-9">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${light ? 'bg-slate-900 text-cyan-300' : 'bg-cyan-400/10 text-cyan-300'}`}>
              <Compass size={20} />
            </div>
            <div>
              <p className={`text-[10px] font-semibold tracking-[0.24em] ${light ? 'text-slate-500' : 'text-slate-400'}`}>BLACK STAR ORBIT</p>
              <p className="text-xs font-medium">Interactive mission briefing · 2 min</p>
            </div>
          </div>
          <button onClick={() => finish()} className={`rounded-full p-2 transition hover:bg-black/10 ${light ? 'text-slate-500' : 'text-slate-400 hover:text-white'}`} aria-label="Skip project tour">
            <X size={19} />
          </button>
        </div>

        <div className="grid gap-8 px-6 pb-7 pt-4 sm:grid-cols-[0.85fr_1.15fr] sm:items-center sm:px-9 sm:pb-10">
          <div className={`tour-visual relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl border ${light ? 'border-slate-200 bg-slate-100' : 'border-cyan-300/10 bg-[#050b18]'}`}>
            <div className="absolute h-44 w-44 rounded-full border border-cyan-400/15" />
            <div className="absolute h-32 w-32 rounded-full border border-indigo-400/20" />
            <div className="absolute h-20 w-20 rounded-full border border-cyan-300/20" />
            <div className="absolute h-2 w-2 translate-x-20 -translate-y-12 rounded-full bg-cyan-300 shadow-[0_0_18px_5px_rgba(103,232,249,0.35)]" />
            <div className={`relative flex h-24 w-24 items-center justify-center rounded-3xl border shadow-2xl ${light ? 'border-slate-300 bg-white text-slate-900' : 'border-cyan-300/20 bg-slate-900 text-cyan-200 shadow-cyan-950/50'}`}>
              <Icon size={42} strokeWidth={1.35} />
            </div>
            <span className={`absolute bottom-4 left-4 font-mono text-[9px] tracking-[0.2em] ${light ? 'text-slate-400' : 'text-slate-500'}`}>FIELD GUIDE / 0{current + 1}</span>
          </div>

          <div>
            <p className="mb-3 text-[10px] font-bold tracking-[0.24em] text-cyan-500">{step.eyebrow}</p>
            <h2 id="project-tour-title" className={`max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl ${light ? 'text-slate-950' : 'text-white'}`}>{step.title}</h2>
            <p className={`mt-4 text-sm leading-7 ${light ? 'text-slate-600' : 'text-slate-300'}`}>{step.description}</p>
            <p className={`mt-3 border-l-2 border-cyan-500/60 pl-3 text-xs leading-6 ${light ? 'text-slate-500' : 'text-slate-400'}`}>{step.detail}</p>
            <div className="mt-5 flex flex-wrap gap-2" aria-label="What you can explore">
              {step.highlights.map((highlight: string) => <span key={highlight} className={`tour-highlight ${light ? 'tour-highlight--light' : ''}`}>{highlight}</span>)}
            </div>
            <button onClick={() => finish(step.tab)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 hover:shadow-lg hover:shadow-cyan-500/20">
              {step.action}<ArrowRight size={15} />
            </button>
          </div>
        </div>

        <div className={`flex flex-col gap-4 border-t px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-9 ${light ? 'border-slate-200 bg-white/70' : 'border-white/10 bg-black/10'}`}>
          <div className="flex items-center gap-2">
            {steps.map((item, index) => (
              <button key={item.eyebrow} onClick={() => setCurrent(index)} aria-label={`Go to tour step ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === current ? 'w-8 bg-cyan-500' : `w-3 ${light ? 'bg-slate-300' : 'bg-slate-700'}`}`} />
            ))}
            <span className={`ml-2 text-[10px] font-mono ${light ? 'text-slate-500' : 'text-slate-400'}`}>{current + 1} / {steps.length}</span>
            <span className="ml-2 hidden sm:inline text-[9px] font-mono tracking-wider text-slate-500">← → TO NAVIGATE · ESC TO EXIT</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => current === 0 ? finish() : setCurrent((value) => value - 1)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition hover:bg-black/5 ${light ? 'text-slate-600' : 'text-slate-300 hover:bg-white/5'}`}>
              <ArrowLeft size={14} />{current === 0 ? 'Skip tour' : 'Back'}
            </button>
            <button onClick={() => current === steps.length - 1 ? finish() : setCurrent((value) => value + 1)} className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 px-4 py-2.5 text-xs font-bold text-cyan-500 transition hover:bg-cyan-500/10">
              {current === steps.length - 1 ? 'Finish tour' : 'Next'}{current === steps.length - 1 ? <Check size={14} /> : <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
