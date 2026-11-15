/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * BLACK STAR ORBIT — Official Identity Mark
 */
import React from 'react';
import { assetUrl } from '../../utils/assetUrl';
import { useTheme } from '../../context/ThemeContext';

interface BlackStarLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showGlow?: boolean;
  showBox?: boolean;
  className?: string;
}

export const BlackStarLogo: React.FC<BlackStarLogoProps> = ({
  size = 'md',
  showGlow = false,
  showBox = false,
  className = '',
}) => {
  const { isLight } = useTheme();

  const sizeMap = {
    xs: { box: 'w-6 h-6', icon: 'w-4 h-4' },
    sm: { box: 'w-8 h-8', icon: 'w-5 h-5' },
    md: { box: 'w-9 h-9', icon: 'w-7 h-7' },
    lg: { box: 'w-12 h-12', icon: 'w-9 h-9' },
    xl: { box: 'w-16 h-16', icon: 'w-12 h-12' },
    '2xl': { box: 'w-24 h-24', icon: 'w-20 h-20 sm:w-24 sm:h-24' },
  };
  const { box, icon } = sizeMap[size];

  if (!showBox) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${box} transition-transform duration-300 hover:scale-105 ${className}`}
        title="BLACK STAR ORBIT official logo"
        aria-label="BLACK STAR ORBIT official logo"
      >
        <img
          src={assetUrl('assets/black-star-logo.png')}
          alt="Black Star Orbit Logo"
          className={`${icon} object-contain select-none ${
            isLight
              ? 'filter drop-shadow-xs'
              : 'filter drop-shadow-[0_0_12px_rgba(56,189,248,0.7)] drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]'
          }`}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${box} rounded-2xl transition-all duration-300 hover:scale-105 ${
        isLight
          ? 'bg-transparent border border-[#1a1a1a]/15 shadow-xs'
          : `border border-cyan-300/35 bg-gradient-to-br from-[#102a43] via-[#0b1930] to-[#171b3a] text-cyan-200 ${
              showGlow ? 'shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/30' : 'ring-1 ring-white/10'
            }`
      } ${className}`}
      title="BLACK STAR ORBIT official logo"
      aria-label="BLACK STAR ORBIT official logo"
    >
      <img
        src={assetUrl('assets/black-star-logo.png')}
        alt="Black Star Orbit Logo"
        className={`${icon} object-contain select-none ${
          isLight ? '' : 'drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]'
        }`}
      />
    </div>
  );
};
