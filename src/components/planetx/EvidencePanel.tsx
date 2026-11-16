/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * COSMIC FRONTIER — Planet X Evidence & Observational Constraints Panel
 */

import React, { useMemo, useState } from 'react';
import { ExtremeTNO, PlanetXHypothesisParams } from '../../types/index.ts';
import { calculateClusteringSignificance } from '../../science/orbitalMechanics.ts';
import { ShieldCheck, BarChart3, Sliders, AlertTriangle, Sparkles, BookOpen, Download } from 'lucide-react';

interface EvidencePanelProps {
  etnoCatalog: ExtremeTNO[];
  hypothesis: PlanetXHypothesisParams;
  onUpdateHypothesis: (params: PlanetXHypothesisParams) => void;
  onExplainEvidence: () => void;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  etnoCatalog,
  hypothesis,
  onUpdateHypothesis,
  onExplainEvidence,
}) => {
  const stats = useMemo(() => calculateClusteringSignificance(etnoCatalog), [etnoCatalog]);
  const sourceCounts = useMemo(() => ({
    mpc: etnoCatalog.filter((object) => object.source === 'MPC').length,
    literature: etnoCatalog.filter((object) => object.source === 'literature').length,
    unspecified: etnoCatalog.filter((object) => !object.source).length,
  }), [etnoCatalog]);
  const [mass, setMass] = useState<number>(hypothesis.massEarths);
  const [semiMajor, setSemiMajor] = useState<number>(hypothesis.semiMajorAxisAU);
  const [ecc, setEcc] = useState<number>(hypothesis.eccentricity);
  const [inc, setInc] = useState<number>(hypothesis.inclinationDeg);

  const downloadAnalysisManifest = () => {
    const manifest = {
      schemaVersion: '1.0',
      generatedAt: new Date().toISOString(),
      application: 'Black Star Orbit',
      analysis: {
        name: 'Exploratory eTNO angular-clustering diagnostics',
        version: stats.analysisVersion,
        method: 'Seeded Monte Carlo null comparisons',
        nullModels: {
          longitudeOfPerihelion: 'Uniform circular angles',
          orbitalPoles: 'Isotropic directions on the sphere',
        },
        simulations: stats.simulations,
        randomSeed: stats.seed,
        selectionBiasCorrected: false,
        commonEpochPropagation: false,
        result: stats,
        sourceCounts,
        limitations: stats.warnings,
      },
      hypothesisParameters: hypothesis,
      inputCatalogue: etnoCatalog.map((object) => ({
        id: object.id,
        name: object.name,
        semiMajorAxisAU: object.semiMajorAxisAU,
        perihelionDistanceAU: object.perihelionDistAU,
        eccentricity: object.eccentricity,
        inclinationDeg: object.inclinationDeg,
        longitudeAscendingNodeDeg: object.longAscNodeDeg,
        argumentOfPerihelionDeg: object.argPerihelionDeg,
        longitudeOfPerihelionDeg: object.longPerihelionDeg,
        orbitEpochJD: object.orbitEpochJD ?? null,
        discoverySurvey: object.discoverySurvey,
        source: object.source ?? 'unspecified',
      })),
      interpretation: 'This export is an exploratory, unweighted null-model analysis. It is not survey-selection corrected and is not evidence that Planet Nine exists.',
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'black-star-orbit-etno-analysis-manifest.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyParams = () => {
    const perihelion = semiMajor * (1 - ecc);
    const aphelion = semiMajor * (1 + ecc);
    const orbitalPeriod = Math.round(Math.pow(semiMajor, 1.5));

    onUpdateHypothesis({
      ...hypothesis,
      massEarths: mass,
      semiMajorAxisAU: semiMajor,
      perihelionAU: Number(perihelion.toFixed(1)),
      aphelionAU: Number(aphelion.toFixed(1)),
      eccentricity: ecc,
      inclinationDeg: inc,
      orbitalPeriodYears: orbitalPeriod,
    });
  };

  return (
    <div className="space-y-4">
      {/* Evidence & Statistical Rigor Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Rayleigh Non-Randomness */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
            <span className="flex items-center gap-1 font-semibold">
              <BarChart3 className="h-4 w-4" /> Monte Carlo null test (ϖ)
            </span>
            <span className="text-emerald-400 font-bold">p = {stats.pValueClustering}</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {stats.meanVarpiDeg === null ? 'No preferred direction' : `${stats.meanVarpiDeg}°`}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
            Mean longitude across {stats.sampleSize} catalogue objects. The p-value compares the observed concentration with a uniform-angle null; it is not corrected for survey selection.
          </p>
        </div>

        {/* Card 2: Angular Dispersion */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-purple-400">
            <span className="flex items-center gap-1 font-semibold">
              <ShieldCheck className="h-4 w-4" /> Orbital Pole Dispersion
            </span>
            <span className="text-slate-300">{stats.poleDispersionDeg === null ? 'Dispersion unavailable' : `Δθ ≈ ${stats.poleDispersionDeg}°`}</span>
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">
            R = {stats.poleRayleighR}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
            Mean angular separation from the sample's mean orbital pole. Isotropic-null Monte Carlo p = {stats.pValuePoleClustering} (n = {stats.poleSampleSize}).
          </p>
        </div>

        {/* Card 3: Observational Blind Spot */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-amber-400">
            <span className="flex items-center gap-1 font-semibold">
              <AlertTriangle className="h-4 w-4" /> Why Not Discovered Yet?
            </span>
            <span className="text-amber-300 font-bold">Not modelled</span>
          </div>
          <div className="text-xl font-bold text-amber-200 font-mono">
            Survey selection effects
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
            These diagnostics do not model survey pointings, depth, cadence, weather, tracking or follow-up efficiency. A selection-aware analysis is still required.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
          <AlertTriangle className="h-4 w-4" /> Interpretation and limitations
        </div>
        <p className="text-[11px] leading-relaxed text-slate-300">
          {stats.simulations.toLocaleString()} deterministic Monte Carlo trials · {stats.nullModel}. These are exploratory null-model diagnostics, not a selection-corrected Planet Nine significance test.
        </p>
        <p className="text-[10px] leading-relaxed text-slate-400">
          Sample composition: {sourceCounts.mpc} MPC feed objects · {sourceCounts.literature} bundled literature references · {sourceCounts.unspecified} with unspecified source. Only objects with usable angles enter each statistic.
        </p>
        <ul className="list-disc space-y-1 pl-4 text-[10px] leading-relaxed text-slate-400">
          {stats.warnings.map((warning: string, index: number) => <li key={index}>{warning}</li>)}
        </ul>
        <p className="text-[10px] leading-relaxed text-slate-400">
          Further reading: <a className="text-cyan-300 underline underline-offset-2" href="https://doi.org/10.3847/PSJ/abe53e" target="_blank" rel="noreferrer">Napier et al. (2021), selection effects in ETNO clustering</a> · <a className="text-cyan-300 underline underline-offset-2" href="https://github.com/OSSOS/SurveySimulator" target="_blank" rel="noreferrer">OSSOS Survey Simulator</a>.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={downloadAnalysisManifest}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-950/30 px-3 py-2 text-[11px] font-mono text-cyan-200 transition hover:bg-cyan-900/40"
          >
            <Download className="h-3.5 w-3.5" /> Export reproducible analysis manifest
          </button>
        </div>
      </div>

      {/* Interactive Hypothesis Parameter Explorer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center space-x-2">
            <Sliders className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Batygin & Brown (2021) Theoretical Parameter Sandbox
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Adjust orbital perturbation model to evaluate observational coverage
              </p>
            </div>
          </div>

          <button
            onClick={onExplainEvidence}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 transition cursor-pointer"
          >
            <span>Explain Evidence with AI</span>
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* Mass */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Mass (M⊕):</span>
              <span className="text-indigo-400 font-bold">{mass.toFixed(1)} Earths</span>
            </div>
            <input
              type="range"
              min={3.0}
              max={15.0}
              step={0.5}
              value={mass}
              onChange={(e) => setMass(Number(e.target.value))}
              aria-label="Planet X hypothetical mass in Earth masses"
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Best fit: 6.2 (+2.2 / −1.3) M⊕</span>
          </div>

          {/* Semi-major Axis */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Semi-major Axis (a):</span>
              <span className="text-cyan-400 font-bold">{semiMajor} AU</span>
            </div>
            <input
              type="range"
              min={280}
              max={650}
              step={10}
              value={semiMajor}
              onChange={(e) => setSemiMajor(Number(e.target.value))}
              aria-label="Planet X semi-major axis in Astronomical Units"
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Best fit: 380 (+140 / −80) AU</span>
          </div>

          {/* Eccentricity */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Eccentricity (e):</span>
              <span className="text-amber-400 font-bold">{ecc.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.15}
              max={0.65}
              step={0.05}
              value={ecc}
              onChange={(e) => setEcc(Number(e.target.value))}
              aria-label="Planet X orbital eccentricity"
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Best fit: 0.35 (range 0.2–0.5)</span>
          </div>

          {/* Inclination */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Inclination (i):</span>
              <span className="text-purple-400 font-bold">{inc.toFixed(1)}°</span>
            </div>
            <input
              type="range"
              min={8.0}
              max={35.0}
              step={1.0}
              value={inc}
              onChange={(e) => setInc(Number(e.target.value))}
              aria-label="Planet X orbital plane inclination in degrees"
              className="w-full accent-purple-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Best fit: 16° ± 5°</span>
          </div>
        </div>

        {/* Update Button */}
        <div className="flex justify-end">
          <button
            onClick={handleApplyParams}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold rounded-lg transition"
          >
            Update Simulation & Orbital Dynamics
          </button>
        </div>
      </div>
    </div>
  );
};
