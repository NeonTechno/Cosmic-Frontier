/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BLACK STAR ORBIT — Keyboard Shortcuts Cheat Sheet Modal
 * Power user reference guide for rapid module switching and scientific tools.
 */

import React, { useEffect } from 'react';
import {
  Keyboard,
  X,
  Compass,
  Telescope,
  Orbit,
  FlaskConical,
  Globe,
  Database,
  Moon,
  Search,
  Zap,
} from 'lucide-react';
import { MODULE_SHORTCUTS, type AppModuleTab } from '../../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: AppModuleTab) => void;
  onToggleTheme?: () => void;
  isLight?: boolean;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onToggleTheme,
  isLight = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getModuleIcon = (module: AppModuleTab) => {
    switch (module) {
      case 'overview':
        return <Compass className="w-4 h-4 text-[#d44d5c]" />;
      case 'spherex':
        return <Telescope className="w-4 h-4 text-cyan-400" />;
      case 'planetx':
        return <Orbit className="w-4 h-4 text-indigo-400" />;
      case 'astrobiology':
        return <FlaskConical className="w-4 h-4 text-emerald-400" />;
      case 'cosmic-suite':
        return <Globe className="w-4 h-4 text-sky-400" />;
      case 'architecture':
        return <Database className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative z-10 w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 flex flex-col max-h-[90vh] ${
          isLight
            ? 'bg-[#fdfcf8] border-[#1a1a1a]/20 text-[#1a1a1a]'
            : 'bg-[#080d1a] border-cyan-500/30 text-slate-100 shadow-[0_0_50px_rgba(56,189,248,0.15)]'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isLight ? 'border-[#1a1a1a]/10 bg-black/2' : 'border-white/10 bg-white/2'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${
              isLight ? 'bg-black/5 border-[#1a1a1a]/15 text-[#1a1a1a]' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
            }`}>
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 id="shortcuts-modal-title" className={`text-base font-bold tracking-tight ${isLight ? 'font-serif' : 'font-nasa tracking-wider'}`}>
                KEYBOARD SHORTCUTS
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Power user fast navigation across Black Star Orbit modules
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isLight
                ? 'hover:bg-black/5 border-transparent hover:border-[#1a1a1a]/15 text-[#666]'
                : 'hover:bg-white/5 border-transparent hover:border-white/15 text-slate-400 hover:text-white'
            }`}
            aria-label="Close shortcuts modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Module Switching */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono uppercase font-bold tracking-wider ${
                isLight ? 'text-[#d44d5c]' : 'text-cyan-400'
              }`}>
                Module Navigation
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Click or press shortcut
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MODULE_SHORTCUTS.map((item) => (
                <div
                  key={item.module}
                  onClick={() => {
                    onNavigate(item.module);
                    onClose();
                  }}
                  className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isLight
                      ? 'bg-white hover:bg-[#f4f1ea] border-[#1a1a1a]/10 hover:border-[#1a1a1a]/30 shadow-xs'
                      : 'bg-[#0b1329]/80 hover:bg-[#112248] border-white/5 hover:border-cyan-500/40 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0">{getModuleIcon(item.module)}</div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate group-hover:text-cyan-400 transition-colors">
                        {item.moduleName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <kbd className={`inline-flex items-center px-2 py-1 rounded border text-[11px] font-mono font-bold tracking-wider shadow-inner ${
                      isLight
                        ? 'bg-black/5 border-[#1a1a1a]/20 text-[#1a1a1a]'
                        : 'bg-[#050b1a] border-cyan-500/30 text-cyan-300'
                    }`}>
                      {item.label}
                    </kbd>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Global Controls & Tools */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <span className={`text-xs font-mono uppercase font-bold tracking-wider ${
              isLight ? 'text-[#d44d5c]' : 'text-cyan-400'
            }`}>
              Quick Actions & Tools
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div 
                onClick={() => {
                  onToggleTheme?.();
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-[#f4f1ea] border-[#1a1a1a]/10 hover:border-[#1a1a1a]/30'
                    : 'bg-[#0b1329]/80 hover:bg-[#112248] border-white/5 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Moon className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-semibold">Toggle Theme</div>
                    <div className="text-[10px] text-slate-400">Switch Dark Orbit / Light Journal</div>
                  </div>
                </div>
                <kbd className={`px-2 py-1 rounded border text-[11px] font-mono font-bold tracking-wider ${
                  isLight
                    ? 'bg-black/5 border-[#1a1a1a]/20 text-[#1a1a1a]'
                    : 'bg-[#050b1a] border-cyan-500/30 text-cyan-300'
                }`}>
                  Alt + T
                </kbd>
              </div>

              <div 
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isLight
                    ? 'bg-white border-[#1a1a1a]/10'
                    : 'bg-[#0b1329]/80 border-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-xs font-semibold">Command Palette</div>
                    <div className="text-[10px] text-slate-400">Fast object search & tools</div>
                  </div>
                </div>
                <kbd className={`px-2 py-1 rounded border text-[11px] font-mono font-bold tracking-wider ${
                  isLight
                    ? 'bg-black/5 border-[#1a1a1a]/20 text-[#1a1a1a]'
                    : 'bg-[#050b1a] border-cyan-500/30 text-cyan-300'
                }`}>
                  ⌘K / Ctrl+K
                </kbd>
              </div>

              <div 
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isLight
                    ? 'bg-white border-[#1a1a1a]/10'
                    : 'bg-[#0b1329]/80 border-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Keyboard className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold">Shortcuts Help</div>
                    <div className="text-[10px] text-slate-400">Toggle this cheat sheet HUD</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className={`px-1.5 py-1 rounded border text-[11px] font-mono font-bold ${
                    isLight ? 'bg-black/5 border-[#1a1a1a]/20 text-[#1a1a1a]' : 'bg-[#050b1a] border-cyan-500/30 text-cyan-300'
                  }`}>
                    ?
                  </kbd>
                  <span className="text-slate-500 text-xs">or</span>
                  <kbd className={`px-1.5 py-1 rounded border text-[11px] font-mono font-bold ${
                    isLight ? 'bg-black/5 border-[#1a1a1a]/20 text-[#1a1a1a]' : 'bg-[#050b1a] border-cyan-500/30 text-cyan-300'
                  }`}>
                    Alt+/
                  </kbd>
                </div>
              </div>

              <div 
                onClick={onClose}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-[#f4f1ea] border-[#1a1a1a]/10'
                    : 'bg-[#0b1329]/80 hover:bg-[#112248] border-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-violet-400" />
                  <div>
                    <div className="text-xs font-semibold">Dismiss Dialogs</div>
                    <div className="text-[10px] text-slate-400">Close modal or popup</div>
                  </div>
                </div>
                <kbd className={`px-2 py-1 rounded border text-[11px] font-mono font-bold tracking-wider ${
                  isLight
                    ? 'bg-black/5 border-[#1a1a1a]/20 text-[#1a1a1a]'
                    : 'bg-[#050b1a] border-cyan-500/30 text-cyan-300'
                }`}>
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t flex items-center justify-between text-xs font-mono ${
          isLight ? 'border-[#1a1a1a]/10 bg-black/2 text-slate-500' : 'border-white/10 bg-white/2 text-slate-400'
        }`}>
          <span>Tip: On macOS, use Option (⌥) as Alt key</span>
          <button
            onClick={onClose}
            className={`px-3 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
              isLight
                ? 'bg-[#1a1a1a] text-white hover:bg-[#333]'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
            }`}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
