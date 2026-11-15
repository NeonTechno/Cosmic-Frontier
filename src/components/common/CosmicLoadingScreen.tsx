/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BLACK STAR ORBIT — Cosmic Loading Screen & Intro Display
 * Displays the official cosmic dust universe artwork as the loading visual and intro banner.
 */

import React, { useState, useEffect } from 'react';
import { Telescope, Orbit, ArrowRight, ShieldCheck } from 'lucide-react';
import { BlackStarLogo } from './BlackStarLogo';
import { assetUrl } from '../../utils/assetUrl';

interface CosmicLoadingScreenProps {
  isLoading: boolean;
  onEnter?: () => void;
  showIntroMode?: boolean;
  onCloseIntro?: () => void;
}

const LOADING_STAGES = [
  'INITIALIZING BLACK STAR ORBIT ENGINE...',
  'CALIBRATING SPHEREx 102-BAND INFRARED DETECTOR...',
  'SYNTHESIZING DEEP-SKY COSMIC DUST NEBULAE...',
  'ALIGNING KUIPER BELT & EXTREME TNO ORBITAL PLANES...',
  'CALCULATING GROUNDED TELEMETRY VECTORS...',
  'SYSTEM READY • ALL TELEMETRY CHANNELS NOMINAL',
];

export const CosmicLoadingScreen: React.FC<CosmicLoadingScreenProps> = ({
  isLoading,
  onEnter,
  showIntroMode = false,
  onCloseIntro,
}) => {
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(15);
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
        const next = prev + Math.floor(Math.random() * 18 + 12);
        return Math.min(next, 100);
      });
    }, 280);

    return () => clearInterval(interval);
  }, [isLoading, showIntroMode]);

  useEffect(() => {
    const stage = Math.min(
      Math.floor((progress / 100) * LOADING_STAGES.length),
      LOADING_STAGES.length - 1
    );
    setStageIndex(stage);
  }, [progress]);

  // When loading completes and user hasn't explicitly entered in intro mode
  useEffect(() => {
    if (!isLoading && !showIntroMode && progress >= 100) {
      const timer = setTimeout(() => {
        onEnter?.();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading, progress, onEnter, showIntroMode]);

  if (!isLoading && !showIntroMode) return null;

  return (
    <div className="launching-page-locked fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#030611]">
      {/* 1. Full-Bleed Cosmic Dust Artwork Background with High Luminance & Cinematic Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={assetUrl('assets/cosmic-dust-universe.jpg')}
          alt="Black Star Orbit Cosmic Dust Deep Universe"
          className="w-full h-full object-cover object-center scale-100 transition-transform duration-1000 ease-out select-none"
        />
        {/* Subtle, soft vignette that lets the purple nebula, celestial dust, and planet globes shine vividly */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030611]/85 via-transparent to-[#030611]/50" />
        <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-[#030611]/15 to-[#030611]/70" />

        {/* Ambient atmospheric lighting echoing the cosmic dust magenta & cyan hues */}
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-gradient-to-r from-cyan-500/10 via-pink-500/10 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Ultra-subtle starlight shimmer grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      {/* 2. Floating Top Controls Header */}
      <header className="absolute top-5 sm:top-8 left-5 sm:left-8 right-5 sm:right-8 flex items-center justify-end z-20 pointer-events-none">
        {showIntroMode && onCloseIntro && (
          <button
            onClick={onCloseIntro}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-mono tracking-wider transition-all cursor-pointer backdrop-blur-md pointer-events-auto"
          >
            CLOSE ✕
          </button>
        )}
      </header>

      {/* 3. Sleek, Minimalist Futuristic Cosmic Loading Progress Bar Console (Fully Transparent) */}
      <main className="relative z-20 w-full max-w-md px-6 py-8 mx-4 rounded-3xl bg-transparent border border-white/10 shadow-none text-center space-y-6 overflow-hidden flex flex-col items-center">
        {/* Animated laser-scan light filament across top */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent shadow-[0_0_12px_#38bdf8] animate-pulse" />

        {/* Minimal Corner Tech Reticles */}
        <div className="absolute top-3 left-3 w-2.5 h-2.5 border-t border-l border-cyan-400/70" />
        <div className="absolute top-3 right-3 w-2.5 h-2.5 border-t border-r border-cyan-400/70" />
        <div className="absolute bottom-3 left-3 w-2.5 h-2.5 border-b border-l border-cyan-400/70" />
        <div className="absolute bottom-3 right-3 w-2.5 h-2.5 border-b border-r border-cyan-400/70" />

        {/* Official Black Star Emblem (Just the star, no white background box) */}
        <div className="flex flex-col items-center gap-3 pt-1">
          <div className="relative flex items-center justify-center p-2">
            <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl animate-pulse pointer-events-none" />
            <img
              src={assetUrl('assets/black-star-logo.png')}
              alt="Black Star Orbit Official Emblem"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain select-none relative z-10 transition-transform duration-300 hover:scale-105 filter drop-shadow-[0_0_16px_rgba(56,189,248,0.85)] drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]"
            />
          </div>
          <div>
            <h1 className="text-3xl sm:text-5xl font-black font-nasa tracking-[0.2em] text-white uppercase leading-tight drop-shadow-[0_4px_25px_rgba(0,0,0,0.95)]">
              BLACK STAR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 drop-shadow-[0_0_35px_rgba(56,189,248,0.6)]">
                ORBIT
              </span>
            </h1>
          </div>
        </div>

        {/* Cool Futuristic Cyberpunk Loading Progress Bar */}
        <div className="w-full space-y-2.5 pt-1">
          {/* Progress Header with Stage & Percentage */}
          <div className="flex items-center justify-between text-xs font-mono px-1">
            <div className="flex items-center gap-1.5 truncate max-w-[270px]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-300 text-[11px] font-medium tracking-wider truncate">
                {LOADING_STAGES[stageIndex]}
              </span>
            </div>
            <span className="font-mono text-xs font-black tracking-widest text-white bg-cyan-950/80 border border-cyan-400/40 px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(56,189,248,0.3)]">
              {progress}%
            </span>
          </div>

          {/* Dual-Chamber Futuristic Track */}
          <div className="relative w-full h-3.5 rounded-full bg-slate-950/90 border border-cyan-500/40 p-0.5 shadow-inner backdrop-blur-xl overflow-hidden">
            {/* Background hash grid markings */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, transparent 1px, transparent 8px)'
              }}
            />

            {/* Glowing active progress fill */}
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 via-purple-500 to-indigo-400 transition-all duration-300 ease-out shadow-[0_0_18px_rgba(56,189,248,0.95)] overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Electric light sweep shimmer passing through the bar */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent w-full -skew-x-12 opacity-80"
                style={{
                  animation: 'energySweep 1.6s infinite ease-in-out'
                }}
              />
            </div>
          </div>

          {/* Lower Segment Micro-LED Markers */}
          <div className="flex justify-between items-center px-1 text-[9px] font-mono text-slate-400">
            <span>CALIBRATION</span>
            <span className="text-cyan-400 font-semibold">{progress >= 100 ? 'READY' : 'ACQUIRING TELEMETRY'}</span>
            <span>102 BANDS</span>
          </div>
        </div>

        {/* Enter Orbit / Launch Explorer CTA */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (showIntroMode) {
                onCloseIntro?.();
              } else {
                onEnter?.();
              }
            }}
            className="group relative px-7 py-3 rounded-full overflow-hidden bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 text-slate-950 font-nasa font-bold text-xs tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(56,189,248,0.5)] hover:shadow-[0_0_40px_rgba(56,189,248,0.85)] cursor-pointer flex items-center gap-2"
          >
            <span className="relative z-10 font-black">
              {showIntroMode ? 'ENTER WORKSTATION' : readyToEnter || progress >= 100 ? 'ENTER ORBIT' : 'LAUNCH EXPLORER'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3] group-hover:translate-x-1 transition-transform relative z-10" />
            <div className="absolute inset-0 bg-white/25 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        </div>
      </main>
    </div>
  );
};

