import React from 'react';
import { Pin, PinOff } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';

interface FreezePaneButtonProps {
  frozen: boolean;
  onToggle: () => void;
  label?: string;
  className?: string;
}

export const FreezePaneButton: React.FC<FreezePaneButtonProps> = ({
  frozen,
  onToggle,
  label = 'Freeze Panes',
  className = '',
}) => {
  const { isLight } = useTheme();

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={frozen}
      title={frozen ? 'Unfreeze sticky panes (scroll normally)' : 'Freeze primary viewport & controls while scrolling'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition border cursor-pointer shrink-0 ${
        frozen
          ? isLight
            ? 'bg-[#1a1a1a] text-[#fdfcf8] border-[#1a1a1a] font-semibold shadow-xs'
            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-semibold shadow-xs'
          : isLight
            ? 'bg-white text-[#666] border-[#1a1a1a]/20 hover:text-[#1a1a1a] hover:border-[#1a1a1a]'
            : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'
      } ${className}`}
    >
      {frozen ? <Pin className="w-3.5 h-3.5 shrink-0" /> : <PinOff className="w-3.5 h-3.5 shrink-0" />}
      <span className="hidden sm:inline">{frozen ? `${label}: ON` : `${label}: OFF`}</span>
    </button>
  );
};
