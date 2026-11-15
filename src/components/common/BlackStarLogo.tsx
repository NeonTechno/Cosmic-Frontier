/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cosmic Frontier — Astronomy identity mark.
 * A telescope is used as the primary emblem to represent observation and research.
 */
import React from 'react';
import { Telescope } from 'lucide-react';

interface BlackStarLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showGlow?: boolean;
  className?: string;
}

export const BlackStarLogo: React.FC<BlackStarLogoProps> = ({
  size = 'md',
  showGlow = true,
  className = '',
}) => {
  const sizeMap = {
    xs: { box: 'w-6 h-6 rounded-md', icon: 'w-3.5 h-3.5' },
    sm: { box: 'w-8 h-8 rounded-lg', icon: 'w-4.5 h-4.5' },
    md: { box: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5' },
    lg: { box: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6' },
    xl: { box: 'w-16 h-16 rounded-3xl', icon: 'w-8 h-8' },
    '2xl': { box: 'w-20 h-20 sm:w-24 sm:h-24 rounded-3xl', icon: 'w-10 h-10 sm:w-12 sm:h-12' },
  };
  const { box, icon } = sizeMap[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${box} border border-cyan-300/35 bg-gradient-to-br from-[#102a43] via-[#0b1930] to-[#171b3a] text-cyan-200 ${showGlow ? 'shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/25' : 'ring-1 ring-white/10'} transition-transform duration-300 hover:scale-105 ${className}`}
      title="Cosmic Frontier telescope emblem"
      aria-label="Cosmic Frontier telescope emblem"
    >
      <Telescope className={`${icon} stroke-[1.8] drop-shadow-[0_0_8px_rgba(103,232,249,0.35)]`} aria-hidden="true" />
    </div>
  );
};
