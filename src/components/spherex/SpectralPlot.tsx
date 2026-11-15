/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BLACK STAR ORBIT — SPHEREx Spectral Energy Distribution (SED) Plotter
 */

import React, { useState } from 'react';
import { SpherexObservation } from '../../types/index.ts';
import { Activity, Sparkles, Info } from 'lucide-react';

interface SpectralPlotProps {
  observation: SpherexObservation;
  onExplainSpectrum: () => void;
}

export const SpectralPlot: React.FC<SpectralPlotProps> = ({
  observation,
  onExplainSpectrum,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    wavelength: number;
    fluxMJySr: number;
    uncertainty: number;
    modelFit: number;
    bandLabel?: string;
    isMeasured?: boolean;
  } | null>(null);

  const data = observation.fullSedCurve;
  if (!data || data.length === 0) return null;

  const hasMeasured = data.some((d) => d.isMeasured);
  const isDemo = observation.dataSourceStatus === 'SIMULATED_DEMO';
  const isLive = observation.dataSourceStatus === 'LIVE_IRSA_SPHEREX' || observation.dataSourceStatus === 'LOCAL_IRSA_SPHEREX' || observation.dataSourceStatus === 'REAL_MISSION_ARCHIVAL';

  const width = 680;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 40, left: 55 };

  const minW = 0.7;
  const maxW = 5.1;
  const maxFlux = Math.max(1, ...data.map((d) => Math.max(0, d.fluxMJySr + d.uncertainty))) * 1.15;
  const minFlux = Math.min(0, ...data.map((d) => d.fluxMJySr - d.uncertainty));

  const scaleX = (w: number) =>
    padding.left + ((w - minW) / (maxW - minW)) * (width - padding.left - padding.right);
  const scaleY = (f: number) =>
    height - padding.bottom - ((f - minFlux) / Math.max(0.01, maxFlux - minFlux)) * (height - padding.top - padding.bottom);

  const modelLinePath = observation.dataSourceStatus === 'LOCAL_IRSA_SPHEREX' ? '' : data.reduce((acc, pt, i) => {
    const x = scaleX(pt.wavelength);
    const y = scaleY(pt.modelFit);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const markers = [
    { w: 1.875, label: 'Pa-α 1.88µm', color: '#38bdf8' },
    { w: 3.05, label: 'H2O Ice 3.05µm', color: '#60a5fa' },
    { w: 3.30, label: 'PAH 3.30µm', color: '#c084fc' },
    { w: 4.27, label: 'CO2 Ice 4.27µm', color: '#f59e0b' },
    { w: 4.67, label: 'CO Ice 4.67µm', color: '#fb923c' },
  ].filter((m) => m.w >= minW && m.w <= maxW);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2 flex-wrap">
          <Activity className="h-5 w-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            {isDemo ? 'Simulated Benchmark SED Profile' : observation.dataSourceStatus === 'LOCAL_IRSA_SPHEREX' ? 'Measured Aperture Flux — Nominal Band Center' : hasMeasured ? 'Measured Multi-Band Aperture SED' : 'Spectroscopic SED Profile'}
          </h3>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
              hasMeasured
                ? 'bg-emerald-950/70 border-emerald-600/50 text-emerald-300'
                : 'bg-amber-950/70 border-amber-700/50 text-amber-300'
            }`}
          >
            {hasMeasured ? `${data.length} IRSA FITS Bands` : isDemo ? `${data.length} SIMULATED CHANNELS` : 'No measured FITS data'}
          </span>
        </div>

        <button
          onClick={onExplainSpectrum}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-950 text-cyan-300 border border-cyan-700/60 hover:bg-cyan-900/50 transition cursor-pointer"
        >
          <span>Explain Spectrum</span>
        </button>
      </div>

      {/* SVG Chart */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-56 bg-slate-950 rounded-lg border border-slate-800 select-none"
        >
          {[1, 2, 3, 4, 5].map((w) => (
            <g key={w}>
              <line
                x1={scaleX(w)}
                y1={padding.top}
                x2={scaleX(w)}
                y2={height - padding.bottom}
                stroke="#1e293b"
                strokeDasharray="3 3"
              />
              <text
                x={scaleX(w)}
                y={height - padding.bottom + 16}
                fill="#64748b"
                fontSize="10"
                fontFamily="JetBrains Mono"
                textAnchor="middle"
              >
                {w} µm
              </text>
            </g>
          ))}

          {[0, 0.33, 0.66, 1].map((frac) => {
            const val = minFlux + (maxFlux - minFlux) * frac;
            const y = scaleY(val);
            return (
              <g key={frac}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  textAnchor="end"
                >
                  {val < 10 ? val.toFixed(1) : val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {markers.map((m) => {
            const x = scaleX(m.w);
            return (
              <g key={m.label}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke={m.color}
                  strokeWidth="1.2"
                  strokeDasharray="4 2"
                  opacity="0.55"
                />
                <text
                  x={x}
                  y={padding.top + 10}
                  fill={m.color}
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {m.label}
                </text>
              </g>
            );
          })}

          <path d={modelLinePath} fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.75" />

          {data.map((pt, i) => {
            const cx = scaleX(pt.wavelength);
            const cy = scaleY(pt.fluxMJySr);
            const errTop = scaleY(pt.fluxMJySr + pt.uncertainty);
            const errBot = scaleY(pt.fluxMJySr - pt.uncertainty);

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <line x1={cx} y1={errTop} x2={cx} y2={errBot} stroke="#94a3b8" strokeWidth="1.5" />
                <line x1={cx - 3} y1={errTop} x2={cx + 3} y2={errTop} stroke="#94a3b8" strokeWidth="1" />
                <line x1={cx - 3} y1={errBot} x2={cx + 3} y2={errBot} stroke="#94a3b8" strokeWidth="1" />

                <circle
                  cx={cx}
                  cy={cy}
                  r={pt.isMeasured ? '5' : '4'}
                  fill={pt.isMeasured ? '#10b981' : '#f59e0b'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          <text
            x={width / 2}
            y={height - 6}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="Space Grotesk"
            textAnchor="middle"
          >
            Wavelength λ (µm) — SPHEREx D1–D6 Detector Arrays
          </text>

          <text
            transform={`rotate(-90) translate(${-height / 2}, 16)`}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="Space Grotesk"
            textAnchor="middle"
          >
            {isDemo ? 'Illustrative Signal Scale (not calibrated MJy/sr)' : 'Surface Brightness (MJy / sr)'}
          </text>
        </svg>

        {hoveredPoint && (
          <div className="absolute top-2 right-2 bg-slate-950/90 border border-slate-700 p-2 rounded text-xs font-mono text-slate-200 pointer-events-none shadow-lg">
            <div className="text-cyan-400 font-bold">
              {hoveredPoint.wavelength.toFixed(3)} µm {hoveredPoint.bandLabel ? `(${hoveredPoint.bandLabel})` : ''}
            </div>
            <div>
              {isDemo ? "Signal: " : "Flux: "}{hoveredPoint.fluxMJySr.toFixed(3)} ± {hoveredPoint.uncertainty.toFixed(3)} {isDemo ? "demo units" : "MJy/sr"}
            </div>
            <div className="text-[10px] text-slate-400">
              {isDemo ? 'SIMULATED_BENCHMARK — illustrative value, not measured' : observation.dataSourceStatus === 'LOCAL_IRSA_SPHEREX' ? 'Measured FITS flux; wavelength is nominal detector center' : hoveredPoint.isMeasured ? 'Measured from IRSA FITS HDU' : 'Reference Model'}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start space-x-2 text-[11px] text-slate-400 font-mono">
        <Info className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <span>
          {isDemo
            ? 'Orange points and the blue guide curve are a target-specific synthetic benchmark SED across all 102 SPHEREx passbands. This preview is for interface demonstration only; it is not a calibrated spectrum, FITS measurement, or detection.'
            : isLive && hasMeasured
              ? observation.dataSourceStatus === 'LOCAL_IRSA_SPHEREX'
                ? 'Green points are measured aperture fluxes from imported IRSA FITS pixels. Wavelength positions use nominal detector-band centers because this FITS header lacks explicit wavelength bounds; this is not pixel-level LVF calibration.'
                : 'Green points represent direct aperture photometry (Zodi-subtracted) extracted from downloaded IRSA SPHEREx DR1/QR3 FITS cutouts across observed bands; unobserved channels are not interpolated.'
              : 'No measured FITS data are available. No synthetic SED is displayed.'}
        </span>
      </div>
    </div>
  );
};
