/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BLACK STAR ORBIT — Cinematic Launch Screen
 * Retains the official Black Star identity and existing launch flow.
 */

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { assetUrl } from '../../utils/assetUrl';

interface CosmicLoadingScreenProps {
  isLoading: boolean;
  onEnter?: () => void;
  showIntroMode?: boolean;
  onCloseIntro?: () => void;
}

const LOADING_STAGES = [
  'INITIALIZING OBSERVATORY',
  'CONNECTING INFRARED INSTRUMENTS',
  'PREPARING SKY SURVEY',
  'ALIGNING CELESTIAL COORDINATES',
  'PREPARING RESEARCH WORKSPACE',
  'OBSERVATORY READY',
];

export const CosmicLoadingScreen: React.FC<CosmicLoadingScreenProps> = ({
  isLoading,
  onEnter,
  showIntroMode = false,
  onCloseIntro,
}) => {
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(12);
  const [readyToEnter, setReadyToEnter] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (!isLoading && !showIntroMode) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setReadyToEnter(true);
          return 100;
        }
        return Math.min(prev + Math.floor(Math.random() * 13 + 10), 100);
      });
    }, 320);

    return () => clearInterval(interval);
  }, [isLoading, showIntroMode]);

  useEffect(() => {
    setStageIndex(Math.min(
      Math.floor((progress / 100) * LOADING_STAGES.length),
      LOADING_STAGES.length - 1
    ));
  }, [progress]);

  useEffect(() => {
    if (!isLoading && !showIntroMode) return;
    if (!isLoading && progress >= 100) {
      const timer = setTimeout(() => onEnter?.(), 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading, progress, onEnter, showIntroMode]);

  if (!isLoading && !showIntroMode) return null;

  const handleEnter = () => {
    if (isEntering) return;
    setIsEntering(true);
    window.setTimeout(() => {
      if (showIntroMode) onCloseIntro?.();
      else onEnter?.();
    }, 620);
  };

  return (
    <div className={`fixed inset-0 z-[100] isolate flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#03050b] text-white ${isEntering ? 'orbit-exit' : 'splash-enter'}`}>
      <style>{`\n        @keyframes orbit-drift { 0% { transform: scale(1.04) translate3d(0,0,0); } 100% { transform: scale(1.12) translate3d(-1.2%,1.1%,0); } }\n        @keyframes ring-rotate { from { transform:translate(-50%,-50%) rotate(0deg); } to { transform:translate(-50%,-50%) rotate(360deg); } }
        @keyframes ring-rotate-reverse { from { transform:translate(-50%,-50%) rotate(360deg); } to { transform:translate(-50%,-50%) rotate(0deg); } }
        .orbital-track { position:absolute; left:50%; top:50%; border:1px solid rgba(186,220,245,.19); border-radius:50%; }
        .orbital-track::before { content:""; position:absolute; left:50%; top:-4px; width:7px; height:7px; border-radius:50%; background:#c4e8ff; box-shadow:0 0 12px 3px rgba(125,211,252,.65); }
        .orbital-track::after { content:""; position:absolute; left:50%; bottom:-2px; width:4px; height:4px; border-radius:50%; background:rgba(255,255,255,.85); box-shadow:0 0 9px rgba(255,255,255,.7); }
        .orbital-track-one { width:min(88vw,900px); aspect-ratio:1; animation:ring-rotate 38s linear infinite; }
        .orbital-track-two { width:min(68vw,690px); aspect-ratio:1; border-style:dashed; border-color:rgba(186,220,245,.13); animation:ring-rotate-reverse 29s linear infinite; }
        .orbital-track-three { width:min(48vw,480px); aspect-ratio:1; border-color:rgba(186,220,245,.11); animation:ring-rotate 23s linear infinite; }
        .orbital-track-two::before { width:5px; height:5px; background:#e7c98b; box-shadow:0 0 12px 3px rgba(231,201,139,.55); }
        .orbital-track-three::before { width:4px; height:4px; background:#fff; }
        @keyframes orbit-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }\n        @keyframes orbit-pulse { 0%,100% { opacity:.42; transform:scale(.96); } 50% { opacity:.9; transform:scale(1.06); } }\n        @keyframes splash-rise { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }\n        @keyframes orbit-launch { 0% { opacity:1; transform:scale(1); } 35% { opacity:1; transform:scale(1.025); } 100% { opacity:0; transform:scale(1.12); filter:blur(8px); } }\n        .splash-enter .splash-content { animation:splash-rise .9s cubic-bezier(.2,.75,.25,1) both; }\n        .splash-enter .splash-bg { animation:orbit-drift 34s ease-in-out infinite alternate; }
        .splash-enter .splash-hero { animation:hero-reveal 1.4s ease-out both; }
        @keyframes hero-reveal { from { opacity:0; transform:scale(1.025); } to { opacity:.9; transform:scale(1); } }\n        @keyframes launch-glow { 0%,100% { box-shadow:0 0 0 rgba(125,211,252,0), inset 0 0 0 rgba(125,211,252,0); border-color:rgba(255,255,255,.3); } 50% { box-shadow:0 0 26px rgba(56,189,248,.2), inset 0 0 18px rgba(125,211,252,.08); border-color:rgba(186,230,253,.8); } }\n        @keyframes launch-sheen { 0% { transform:translateX(-160%) skewX(-18deg); opacity:0; } 25% { opacity:.7; } 65%,100% { transform:translateX(260%) skewX(-18deg); opacity:0; } }\n        @keyframes launch-arrow { 0%,100% { transform:translateX(0); } 50% { transform:translateX(4px); } }\n        .launch-button { position:relative; isolation:isolate; overflow:hidden; animation:launch-glow 3.2s ease-in-out infinite; }\n        .launch-button::before { content:""; position:absolute; z-index:-1; top:-30%; bottom:-30%; left:0; width:34%; background:linear-gradient(90deg,transparent,rgba(186,230,253,.24),transparent); animation:launch-sheen 4s ease-in-out infinite; }\n        .launch-button .launch-arrow { animation:launch-arrow 1.8s ease-in-out infinite; }\n        .launch-button:hover .launch-arrow { animation:none; transform:translateX(5px); }\n        .splash-enter .orbit-mark { animation:orbit-float 7s ease-in-out infinite; }
        .splash-enter .orbital-track { will-change:transform; }\n        .splash-enter .orbit-halo { animation:orbit-pulse 5s ease-in-out infinite; }\n        .orbit-exit { animation:orbit-launch .62s cubic-bezier(.65,0,.35,1) both; pointer-events:none; }\n        @media (prefers-reduced-motion: reduce) { .splash-enter .splash-content,.splash-enter .splash-bg,.splash-enter .splash-hero,.splash-enter .orbital-track,.splash-enter .orbit-mark,.splash-enter .orbit-halo,.orbit-exit { animation:none !important; } }\n      `}</style>
      {/* Cinematic deep-space background */}
      <div className="absolute inset-0 -z-20 overflow-hidden bg-[#03050b]">
        <img
          src="/assets/Astronaut%20Facing%20a%20Glowing%20Black%20Hole.png"
          alt=""
          aria-hidden="true"
          className="splash-bg absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl"
        />
        <img
          src="/assets/Astronaut%20Facing%20a%20Glowing%20Black%20Hole.png"
          alt="Astronaut aboard the International Space Station"
          aria-hidden="true"
          className="splash-hero absolute inset-0 h-full w-full object-cover object-center opacity-90"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(3,5,11,0.48)_0%,rgba(3,5,11,0.24)_42%,rgba(3,5,11,0.88)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_43%,rgba(18,52,83,0.2)_0%,rgba(3,5,11,0.05)_35%,rgba(3,5,11,0.72)_100%)]" />

      {/* Slow-moving orbital paths and satellites */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden" aria-hidden="true">
        <div className="orbital-track orbital-track-one" />
        <div className="orbital-track orbital-track-two" />
        <div className="orbital-track orbital-track-three" />
      </div>

      {/* Restrained observatory detailing */}
      <div className="pointer-events-none absolute inset-5 border border-white/[0.08] sm:inset-8" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-28 w-px -translate-x-1/2 bg-gradient-to-b from-white/25 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-28 w-px -translate-x-1/2 bg-gradient-to-t from-white/20 to-transparent" />

      {showIntroMode && onCloseIntro && (
        <button
          onClick={onCloseIntro}
          className="absolute right-8 top-8 z-20 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-[10px] font-semibold tracking-[0.2em] text-white/75 backdrop-blur-md transition hover:border-white/50 hover:text-white"
        >
          CLOSE
        </button>
      )}

      <main className="splash-content relative z-10 flex w-full max-w-3xl flex-col items-center px-7 py-12 text-center sm:px-10">
        <div className="mb-7 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.34em] text-white/55 sm:text-[10px]">
          <span className="h-px w-8 bg-white/35" />
          Astronomy Research Platform
          <span className="h-px w-8 bg-white/35" />
        </div>

        {/* Official Black Star mark — no replacement symbol or logo treatment */}
        <div className="relative mb-7 flex h-28 w-28 items-center justify-center sm:mb-8 sm:h-36 sm:w-36">
          <div className="absolute inset-0 rounded-full bg-sky-300/10 blur-2xl" />
          <div className="absolute inset-1 rounded-full border border-white/[0.13]" />
          <div className="absolute inset-3 rounded-full border border-white/[0.07]" />
          <img
            src={assetUrl('assets/black-star-logo.png')}
            alt="Black Star"
            className="relative z-10 h-[76%] w-[76%] object-contain drop-shadow-[0_0_22px_rgba(126,190,230,0.35)]"
          />
        </div>

        <h1 className="font-sans text-[2.55rem] font-semibold uppercase leading-[0.98] tracking-[0.16em] text-white sm:text-6xl sm:tracking-[0.2em]">
          BLACK STAR
          <span className="mt-2 block text-[0.78em] font-light tracking-[0.34em] text-sky-100/90 sm:mt-3">
            ORBIT
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-xs font-medium uppercase tracking-[0.2em] text-white/65 sm:text-sm sm:tracking-[0.28em]">
          The Infrared Sky Time Machine
        </p>
        <p className="mt-3 max-w-md text-sm leading-6 text-white/55 sm:text-[15px]">
          Explore the universe through multi-epoch infrared observations, celestial data and scientific discovery.
        </p>

        <div className="mt-12 w-full max-w-sm">
          <div className="mb-3 flex items-center justify-between gap-4 text-[9px] font-medium uppercase tracking-[0.17em] text-white/55 sm:text-[10px]">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.9)]" />
              <span className="truncate">{LOADING_STAGES[stageIndex]}</span>
            </span>
            <span className="tabular-nums text-white/75">{progress}%</span>
          </div>
          <div
            className="h-[2px] w-full overflow-hidden bg-white/15"
            role="progressbar"
            aria-label="Preparing Black Star Orbit"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full bg-gradient-to-r from-sky-200 via-sky-400 to-white shadow-[0_0_12px_rgba(125,211,252,0.65)] transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[8px] uppercase tracking-[0.2em] text-white/35">
            <span>SPHEREx · 102 Bands</span>
            <span>{progress >= 100 ? 'Ready to explore' : 'Preparing workspace'}</span>
          </div>
        </div>

        <button
          onClick={handleEnter}
          className="launch-button group mt-9 inline-flex items-center gap-3 rounded-full border border-sky-100/40 bg-gradient-to-r from-slate-950/80 via-slate-900/75 to-sky-950/70 px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.23em] text-white shadow-[0_8px_32px_rgba(2,8,23,0.45)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-sky-950/80 active:translate-y-0 active:scale-[0.98]"
        >
          {showIntroMode ? 'ENTER WORKSPACE' : readyToEnter || progress >= 100 ? 'ENTER ORBIT' : 'LAUNCH EXPLORER'}
          <ArrowRight className="launch-arrow h-3.5 w-3.5 transition-transform duration-300" />
        </button>

        <p className="mt-10 text-[8px] uppercase tracking-[0.24em] text-white/30">
          NASA Space Apps Challenge 2026
        </p>
      </main>
    </div>
  );
};
