/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Global Keyboard Shortcut System for Black Star Orbit
 * Enables power users to quickly navigate between application modules using Alt + key combinations.
 */

import { useEffect, useState, useCallback } from 'react';

export type AppModuleTab = 'overview' | 'spherex' | 'planetx' | 'astrobiology' | 'architecture' | 'cosmic-suite';

export interface ShortcutDefinition {
  key: string;
  code?: string;
  altKey: boolean;
  label: string;
  module: AppModuleTab;
  moduleName: string;
  description: string;
}

export const MODULE_SHORTCUTS: ShortcutDefinition[] = [
  {
    key: 'o',
    code: 'KeyO',
    altKey: true,
    label: 'Alt + O',
    module: 'overview',
    moduleName: 'Editorial Overview',
    description: 'Switch to Editorial Journal publication sector',
  },
  {
    key: 's',
    code: 'KeyS',
    altKey: true,
    label: 'Alt + S',
    module: 'spherex',
    moduleName: 'SPHEREx Explorer',
    description: 'Switch to 102-band spectrophotometric infrared viewer',
  },
  {
    key: 'p',
    code: 'KeyP',
    altKey: true,
    label: 'Alt + P',
    module: 'planetx',
    moduleName: 'Planet X Lab',
    description: 'Switch to outer solar system gravitational candidate investigation',
  },
  {
    key: 'b',
    code: 'KeyB',
    altKey: true,
    label: 'Alt + B',
    module: 'astrobiology',
    moduleName: 'Astrobiology Lab',
    description: 'Switch to cosmic ice spectroscopy and biosignature analytics',
  },
  {
    key: 'c',
    code: 'KeyC',
    altKey: true,
    label: 'Alt + C',
    module: 'cosmic-suite',
    moduleName: 'Cosmic Frontier Suite',
    description: 'Switch to interactive 3D universe, orrery, and observatories',
  },
  {
    key: 'n',
    code: 'KeyN',
    altKey: true,
    label: 'Alt + N',
    module: 'architecture',
    moduleName: 'NASA Specifications',
    description: 'Switch to IPAC/IRSA data protocol architecture roadmap',
  },
];

interface UseKeyboardShortcutsOptions {
  activeTab: AppModuleTab;
  onNavigate: (module: AppModuleTab) => void;
  onToggleTheme?: () => void;
  onOpenShortcutsHelp?: () => void;
  disabled?: boolean;
}

export function useKeyboardShortcuts({
  activeTab,
  onNavigate,
  onToggleTheme,
  onOpenShortcutsHelp,
  disabled = false,
}: UseKeyboardShortcutsOptions) {
  const [lastTriggered, setLastTriggered] = useState<{
    label: string;
    moduleName: string;
    timestamp: number;
  } | null>(null);

  const triggerToast = useCallback((label: string, moduleName: string) => {
    setLastTriggered({
      label,
      moduleName,
      timestamp: Date.now(),
    });
  }, []);

  useEffect(() => {
    if (!lastTriggered) return;
    const timeout = setTimeout(() => {
      setLastTriggered(null);
    }, 2200);
    return () => clearTimeout(timeout);
  }, [lastTriggered]);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing inside input, textarea, select, or contenteditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // 1. Help modal toggle: '?' (Shift + /) or 'Alt + /' or 'Alt + H'
      if (
        (e.key === '?' && !e.altKey && !e.ctrlKey && !e.metaKey) ||
        (e.altKey && (e.key === '/' || e.key === 'h' || e.code === 'Slash' || e.code === 'KeyH'))
      ) {
        e.preventDefault();
        onOpenShortcutsHelp?.();
        return;
      }

      // 2. Theme Toggle: 'Alt + T'
      if (e.altKey && (e.key.toLowerCase() === 't' || e.code === 'KeyT')) {
        e.preventDefault();
        onToggleTheme?.();
        triggerToast('Alt + T', 'Theme Switched');
        return;
      }

      // 3. Module switching: Alt + Key
      if (e.altKey) {
        const pressedKey = e.key.toLowerCase();
        const pressedCode = e.code;

        // Astrobiology also supports Alt + A
        if (pressedKey === 'a' || pressedCode === 'KeyA') {
          e.preventDefault();
          onNavigate('astrobiology');
          triggerToast('Alt + A', 'Astrobiology Lab');
          return;
        }

        const match = MODULE_SHORTCUTS.find(
          (s) => s.key === pressedKey || (s.code && s.code === pressedCode)
        );

        if (match) {
          e.preventDefault();
          onNavigate(match.module);
          triggerToast(match.label, match.moduleName);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onNavigate, onToggleTheme, onOpenShortcutsHelp, triggerToast]);

  return {
    lastTriggered,
  };
}
