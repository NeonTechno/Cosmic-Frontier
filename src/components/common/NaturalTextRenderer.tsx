/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Clean, lightweight renderer that transforms markdown and LaTeX-style symbols
 * into natural, readable typography without exposing raw syntax tokens.
 */

import React from 'react';

interface NaturalTextRendererProps {
  text: string;
  className?: string;
}

function normalizeMathAndSymbols(input: string): string {
  return input
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^$\n]+)\$/g, '$1')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\mathrm\{([^}]*)\}/g, '$1')
    .replace(/\\mu/g, 'µ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\pi/g, 'π')
    .replace(/\\alpha/g, 'α')
    .replace(/\\delta/g, 'δ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\approx/g, '≈')
    .replace(/\\sim/g, '~')
    .replace(/\\propto/g, '∝')
    .replace(/\\times/g, '×')
    .replace(/\\pm/g, '±')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\degree/g, '°')
    .replace(/\\,/g, ' ')
    .replace(/\^\{([^}]+)\}/g, '^($1)');
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const cleaned = normalizeMathAndSymbols(text);
  const tokens: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partIdx = 0;

  while ((match = pattern.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(cleaned.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={`${keyPrefix}-b-${partIdx++}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={`${keyPrefix}-i-${partIdx++}`} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={`${keyPrefix}-c-${partIdx++}`}
          className="px-1.5 py-0.5 rounded bg-slate-800/80 text-cyan-300 font-mono text-[0.9em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < cleaned.length) {
    tokens.push(cleaned.slice(lastIndex));
  }

  return tokens;
}

export const NaturalTextRenderer: React.FC<NaturalTextRendererProps> = ({ text, className = '' }) => {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Headings (#, ##, ###, ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      blocks.push(
        <h4
          key={`b-${blockKey++}`}
          className={
            level <= 3
              ? 'text-sm sm:text-[15px] font-semibold text-cyan-200 tracking-tight pt-1'
              : 'text-xs sm:text-sm font-semibold text-slate-100 pt-1'
          }
        >
          {renderInline(content, `h-${blockKey}`)}
        </h4>
      );
      i += 1;
      continue;
    }

    // Bullet list items (- or * or •)
    if (/^[-*•]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ul key={`b-${blockKey++}`} className="space-y-1.5 pl-4 list-disc marker:text-cyan-400/80">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(item, `ul-${blockKey}-${idx}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list items (1. , 2. )
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ol key={`b-${blockKey++}`} className="space-y-1.5 pl-5 list-decimal marker:text-cyan-400/80 marker:font-medium">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(item, `ol-${blockKey}-${idx}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph (group contiguous non-empty, non-heading/list lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4})\s+/.test(lines[i].trim()) &&
      !/^[-*•]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i += 1;
    }

    blocks.push(
      <p key={`b-${blockKey++}`} className="leading-relaxed">
        {renderInline(paraLines.join(' '), `p-${blockKey}`)}
      </p>
    );
  }

  return <div className={`space-y-3 ${className}`}>{blocks}</div>;
};
