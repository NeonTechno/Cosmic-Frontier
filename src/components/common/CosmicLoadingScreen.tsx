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
    if (showIntroMode) onCloseIntro?.();
    else onEnter?.();
  };

  return (
    <div className="fixed inset-0 z-[100] isolate flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#03050b] text-white">
      {/* Cinematic deep-space background */}
      <div className="absolute inset-0 -z-20">
        <img
          src={assetUrl('assets/cosmic-dust-universe.jpg')}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-55"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(3,5,11,0.48)_0%,rgba(3,5,11,0.24)_42%,rgba(3,5,11,0.88)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_43%,rgba(18,52,83,0.2)_0%,rgba(3,5,11,0.05)_35%,rgba(3,5,11,0.72)_100%)]" />

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

      <main className="relative z-10 flex w-full max-w-3xl flex-col items-center px-7 py-12 text-center sm:px-10">
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
          className="group mt-9 inline-flex items-center gap-3 border border-white/30 bg-white/[0.06] px-7 py-3.5 text-[10px] font-semibold uppercase tracking-[0.23em] text-white backdrop-blur-sm transition duration-300 hover:border-sky-200/70 hover:bg-white/[0.12] active:scale-[0.98]"
        >
          {showIntroMode ? 'ENTER WORKSPACE' : readyToEnter || progress >= 100 ? 'ENTER ORBIT' : 'LAUNCH EXPLORER'}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>

        <p className="mt-10 text-[8px] uppercase tracking-[0.24em] text-white/30">
          NASA Space Apps Challenge 2026
        </p>
      </main>
    </div>
  );
};
