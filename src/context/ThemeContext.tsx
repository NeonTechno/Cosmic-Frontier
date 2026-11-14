/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Theme Context & Provider
 * Supports Editorial Journal Light Theme (Variation 3 style: Cormorant Garamond,
 * Inter, Space Mono, parchment #fdfcf8, ink #1a1a1a, terracotta #d44d5c)
 * and Deep Cosmic Dark Theme.
 */

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Sun, Moon, Compass, Sparkles } from 'lucide-react';

export type AppTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: AppTheme;
  isLight: boolean;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'blackstar_orbit_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      // Default to light theme as requested by user
      return 'light';
    } catch {
      return 'light';
    }
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('Could not persist theme to localStorage', e);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Sync to <html> and <body> classes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
      root.setAttribute('data-theme', 'light');
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
      root.setAttribute('data-theme', 'dark');
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isLight: theme === 'light',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Editorial theme toggle button
 */
export const ThemeToggle: React.FC<{
  className?: string;
  variant?: 'minimal' | 'badge' | 'editorial';
}> = ({ className = '', variant = 'editorial' }) => {
  const { theme, toggleTheme, isLight } = useTheme();

  if (variant === 'minimal') {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg border transition-all cursor-pointer ${
          isLight
            ? 'bg-[#ffffff] text-[#1a1a1a] border-[#1a1a1a]/20 hover:border-[#1a1a1a]'
            : 'bg-[#0B1630] text-cyan-300 border-cyan-500/30 hover:border-cyan-400'
        } ${className}`}
        title={isLight ? 'Switch to Cosmic Dark Orbit' : 'Switch to Editorial Journal Light Theme'}
        aria-label="Toggle Theme"
      >
        {isLight ? <Moon className="w-4 h-4 text-[#1a1a1a]" /> : <Sun className="w-4 h-4 text-amber-300" />}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-all cursor-pointer rounded-full sm:rounded-lg border shadow-md ${
        isLight
          ? 'bg-[#1a1a1a] text-[#fdfcf8] hover:bg-[#333] border-[#1a1a1a]'
          : 'bg-[#0f1d3d]/95 text-cyan-200 hover:bg-[#152a57] border-cyan-500/50 backdrop-blur-md'
      } ${className}`}
      title={isLight ? 'Switch to Cosmic Dark Orbit' : 'Switch to Editorial Journal Light Theme'}
      aria-label="Toggle theme"
    >
      {isLight ? (
        <>
          <Moon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="font-semibold">Dark Orbit</span>
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="font-semibold">Light Journal</span>
        </>
      )}
    </button>
  );
};
