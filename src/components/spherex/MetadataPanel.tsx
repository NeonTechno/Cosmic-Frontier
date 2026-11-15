/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BLACK STAR ORBIT — SPHEREx Observation & FITS Metadata Panel
 */

import React, { useState } from 'react';
import { SpherexObservation } from '../../types/index.ts';
import {
  FileText,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Clock,
  MapPin,
  Eye,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

interface MetadataPanelProps {
  observation: SpherexObservation;
  onExplainWithAi: () => void;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({
  observation,
  onExplainWithAi,
}) => {
  const [showFullFits, setShowFullFits] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLive = observation.dataSourceStatus === 'LIVE_IRSA_SPHEREX' || observation.dataSourceStatus === 'LOCAL_IRSA_SPHEREX';

  const copyFitsText = () => {
    const lines = Object.entries(observation.fitsHeader).map(
      ([k, v]) => `${k.padEnd(8)} = ${String(v).padEnd(20)} / SPHEREx telemetry`
    );
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Observation & FITS Metadata
          </h3>
        </div>
        <button
          onClick={onExplainWithAi}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-950 text-cyan-300 border border-cyan-700/60 hover:bg-cyan-900/50 transition cursor-pointer"
        >
          <span>Explain with AI</span>
        </button>
      </div>

      {/* Live vs Simulated Data Provenance Banner */}
      <div
        className={`rounded-lg p-3 text-xs flex items-start space-x-2.5 border ${
          isLive
            ? 'bg-emerald-950/35 border-emerald-700/50 text-emerald-100'
            : 'bg-amber-950/30 border-amber-800/40 text-amber-200/90'
        }`}
      >
        {isLive ? (
          <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="space-y-1 min-w-0">
          <div
            className={`font-semibold flex flex-wrap items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider ${
              isLive ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            <span>DATA PROVENANCE:</span>
            <span
              className={`px-1.5 py-0.5 rounded border ${
                isLive
                  ? 'bg-emerald-900/60 border-emerald-600/60'
                  : 'bg-amber-900/60 border-amber-700/50'
              }`}
            >
              {observation.dataSourceStatus}
            </span>
          </div>
          <p className={`text-[11px] leading-relaxed ${isLive ? 'text-emerald-200/85' : 'text-amber-200/80'}`}>
            {observation.dataSourceLabel.replace(/\.+$/, '')}. Units: MJy/sr (Level-2 calibrated).
          </p>
        </div>
      </div>

      {/* Live Archive Summary & Limitations */}
      {observation.archiveSummary && (
        <div className="bg-slate-950/75 border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-cyan-300 font-semibold text-[11px]">
            <span>IRSA ARCHIVE QUERY SUMMARY</span>
            <span className="text-[10px] text-slate-400">
              {observation.archiveSummary.cached ? 'Cached' : `${observation.archiveSummary.queryLatencyMs} ms`}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">DR1 / QR3 Rows</span>
              <span className="text-white font-semibold">
                {observation.archiveSummary.dr1ObservationCount} DR1 • {observation.archiveSummary.qr3ObservationCount} QR3
              </span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Epochs / Date Span</span>
              <span className="text-white font-semibold">
                {observation.archiveSummary.distinctMjdCount} MJDs ({observation.archiveSummary.earliestDate} → {observation.archiveSummary.latestDate})
              </span>
            </div>
          </div>
          {observation.archiveSummary.availableBands.length > 0 && (
            <div className="text-[10px] text-slate-300">
              <span className="text-slate-400">Detected Arrays: </span>
              {observation.archiveSummary.availableBands.join(', ')}
            </div>
          )}
          {observation.archiveSummary.limitations.length > 0 && (
            <div className="pt-1 border-t border-slate-800/80 space-y-1">
              <div className="text-[10px] text-amber-300 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>Instrumental / Archive Caveats:</span>
              </div>
              {observation.archiveSummary.limitations.slice(0, 2).map((lim, i) => (
                <p key={i} className="text-[10px] font-sans text-slate-400 leading-snug">
                  • {lim}
                </p>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1 text-[10px]">
            <a href="https://irsa.ipac.caltech.edu/applications/SPHEREx/" target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline inline-flex items-center gap-1">
              SPHEREx Data Explorer <ExternalLink className="h-2.5 w-2.5" />
            </a>
            {observation.archiveSummary.aladinUrl && (
              <a href={observation.archiveSummary.aladinUrl} target="_blank" rel="noreferrer" className="text-slate-300 hover:underline inline-flex items-center gap-1">
                Aladin Lite <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Target Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <MapPin className="h-3 w-3 text-cyan-400" /> Equat. RA / Dec
          </span>
          <span className="text-white font-semibold mt-1 block">
            {observation.raDeg.toFixed(4)}°, {observation.decDeg.toFixed(4)}°
          </span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <MapPin className="h-3 w-3 text-indigo-400" /> Galactic (l, b)
          </span>
          <span className="text-white font-semibold mt-1 block">
            {observation.glonDeg.toFixed(1)}°, {observation.glatDeg.toFixed(1)}°
          </span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Clock className="h-3 w-3 text-emerald-400" /> Obs Date (UTC)
          </span>
          <span className="text-white font-semibold mt-1 block truncate">
            {String(observation.fitsHeader['DATE-OBS'] || observation.epochs?.[0]?.timestamp || 'Not recorded').split('T')[0]}
          </span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Clock className="h-3 w-3 text-purple-400" /> Exposure Time
          </span>
          <span className="text-white font-semibold mt-1 block">
            {observation.fitsHeader['EXPTIME'] ?? observation.epochs?.[0]?.exposureTimeSec ?? 'Not recorded in FITS'}{observation.fitsHeader['EXPTIME'] !== undefined || observation.epochs?.[0]?.exposureTimeSec !== undefined ? ' s' : ''}
          </span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Thermometer className="h-3 w-3 text-red-400" /> FPA Temp
          </span>
          <span className="text-white font-semibold mt-1 block">
            {observation.detectorTempK !== undefined ? `${observation.detectorTempK} K` : 'Not recorded in FITS'}
          </span>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Eye className="h-3 w-3 text-amber-400" /> Pixel Scale
          </span>
          <span className="text-white font-semibold mt-1 block">
            {observation.pixelScaleArcsec}″ / pixel
          </span>
        </div>
      </div>

      {/* Live Gaia DR3 Cone Match Table */}
      {observation.gaiaSources && observation.gaiaSources.length > 0 && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 font-semibold text-[11px]">
              GAIA DR3 CROSS-MATCH ({observation.gaiaSources.length} SOURCES)
            </span>
            <span className="text-[10px] text-slate-400">Live ESA TAP</span>
          </div>
          <div className="max-h-44 overflow-y-auto pane-scroll space-y-1.5 pr-1">
            {observation.gaiaSources.slice(0, 6).map((src) => {
              const pmTot =
                src.pmRaMasYr !== null && src.pmDecMasYr !== null
                  ? Math.hypot(src.pmRaMasYr, src.pmDecMasYr).toFixed(1)
                  : '—';
              return (
                <div
                  key={src.sourceId}
                  className="bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800 flex items-center justify-between text-[10px] animate-row-fade-in"
                >
                  <div className="min-w-0">
                    <div className="text-slate-200 font-semibold truncate">
                      Gaia {src.sourceId.slice(-8)} ({src.distanceArcsecFromCenter.toFixed(1)}″)
                    </div>
                    <div className="text-slate-400">
                      G={src.photGMeanMag !== null ? src.photGMeanMag.toFixed(2) : '—'} • π=
                      {src.parallaxMas !== null ? `${src.parallaxMas.toFixed(1)} mas` : '—'}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-emerald-300 font-bold">μ = {pmTot} mas/yr</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contamination Flags & Quality Assurance */}
      {observation.contaminationFlags && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-semibold text-cyan-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Contamination & Quality Flags</span>
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
              {observation.dataQualityFlag}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Zodiacal Light:</span>
              <span
                className={`font-semibold ${
                  observation.contaminationFlags.zodiacalLevel === 'Low' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {observation.contaminationFlags.zodiacalLevel}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Stray Light:</span>
              <span className="font-semibold text-emerald-400">
                {observation.contaminationFlags.strayLight ? 'Detected' : 'Nominal'}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Flagged Pixels:</span>
              <span className="font-semibold text-cyan-300">
                {observation.contaminationFlags.cosmicRayHits} masked
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Moon Avoidance:</span>
              <span className="font-semibold text-slate-200">
                {observation.contaminationFlags.moonSeparationDeg.toFixed(1)}°
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive FITS Headers Drawer */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
        <button
          onClick={() => setShowFullFits(!showFullFits)}
          className="w-full px-3 py-2 text-xs font-mono text-slate-300 hover:text-white bg-slate-900/60 flex items-center justify-between transition"
        >
          <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
            <span>FITS Standard Header</span>
            <span className="text-slate-500 font-normal">({Object.keys(observation.fitsHeader).length} keywords)</span>
          </span>
          <span className="text-slate-400 text-[11px] underline">
            {showFullFits ? 'Collapse' : 'Expand Header'}
          </span>
        </button>

        {showFullFits && (
          <div className="p-3 border-t border-slate-800 space-y-2">
            <div className="flex justify-end">
              <button
                onClick={copyFitsText}
                className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy Header Text'}</span>
              </button>
            </div>
            <div className="max-h-56 overflow-y-auto pane-scroll font-mono text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
              {Object.entries(observation.fitsHeader).map(([key, val]) => (
                <div key={key} className="flex items-baseline justify-between py-0.5 border-b border-slate-900 last:border-0 gap-2">
                  <span className="text-cyan-400 font-bold shrink-0">{key.padEnd(8)}</span>
                  <span className="text-emerald-300 truncate">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
