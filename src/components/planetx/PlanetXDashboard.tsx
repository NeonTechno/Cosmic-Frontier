/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * COSMIC FRONTIER — Master Planet X Explorer Dashboard
 */

import React, { useState } from 'react';
import { PlanetXCandidate, ExtremeTNO, PlanetXHypothesisParams } from '../../types/index.ts';
import { CandidateInvestigation } from './CandidateInvestigation.tsx';
import { MpcCatalogPanel } from './MpcCatalogPanel.tsx';
import { OrbitalSimulation } from './OrbitalSimulation.tsx';
import { EvidencePanel } from './EvidencePanel.tsx';
import { UncertaintyIndicator } from './UncertaintyIndicator.tsx';
import { OrbitalResonanceVisualizer } from './OrbitalResonanceVisualizer.tsx';
import { FreezePaneButton } from '../common/FreezePaneButton.tsx';
import {
  Orbit,
  Crosshair,
  BarChart2,
  HelpCircle,
  Sparkles,
  MapPin,
  ShieldCheck,
  Activity,
  Database,
} from 'lucide-react';

interface PlanetXDashboardProps {
  candidates: PlanetXCandidate[];
  etnoCatalog: ExtremeTNO[];
  hypothesis: PlanetXHypothesisParams;
  onVetCandidate: (id: string, status: PlanetXCandidate['status'], notes: string, verdict: string) => Promise<void>;
  onUpdateHypothesis: (params: PlanetXHypothesisParams) => void;
  onExplainWithAi: (contextType: string, payload: Record<string, unknown>, prompt?: string) => void;
}

export const PlanetXDashboard: React.FC<PlanetXDashboardProps> = ({
  candidates,
  etnoCatalog,
  hypothesis,
  onVetCandidate,
  onUpdateHypothesis,
  onExplainWithAi,
}) => {
  const [activeTab, setActiveTab] = useState<'workbench' | 'resonances' | 'simulation' | 'evidence' | 'uncertainty' | 'mpc'>('workbench');
  const [panesFrozen, setPanesFrozen] = useState<boolean>(true);


  const subtopicMeta: Record<typeof activeTab, { title: string; subtitle: string }> = {
    workbench: {
      title: 'Candidate Vetting Workbench',
      subtitle: 'WISE/NEOWISE astrometric blinking & multi-epoch vetting queue',
    },
    resonances: {
      title: 'Orbital Resonances & eTNOs',
      subtitle: 'Mean-motion resonances & longitude-of-perihelion clustering',
    },
    simulation: {
      title: '3D Orbital Phase Space',
      subtitle: 'Interactive heliocentric phase-space geometry',
    },
    evidence: {
      title: 'Evidence & Parameter Sandbox',
      subtitle: 'Rayleigh Z-clustering statistics & dynamical sensitivity',
    },
    uncertainty: {
      title: 'Uncertainty & Posteriors',
      subtitle: 'Parameter posterior bounds & observational selection bias',
    },
    mpc: {
      title: 'Live MPC Distant Catalogue',
      subtitle: 'Official Minor Planet Center orbital elements and reproducible eTNO filtering',
    },
  };

  return (
    <div className="planetx-dashboard space-y-4">
      {/* Frozen Topic & Subtopic Header Banner */}
      <div className={`${panesFrozen ? 'sticky top-[66px] z-30 backdrop-blur-md shadow-2xl' : 'shadow-xl'} bg-gradient-to-r from-slate-900/95 via-indigo-950/70 to-slate-900/95 border border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-3 transition-all`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase font-semibold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                Outer Solar System Hypothesis
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Batygin & Brown (2021) Baseline
              </span>
              <span className="text-[11px] font-mono text-cyan-300 hidden sm:inline">
                • Subtopic: {subtopicMeta[activeTab].title}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Planet X / Nine Astrometric & Dynamical Investigation
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Mass ~ {hypothesis.massEarths} M⊕ • Distance ~ {hypothesis.semiMajorAxisAU} AU • Inc {hypothesis.inclinationDeg}°
              </p>
            </div>
            <p className="text-[11px] text-slate-400 sm:hidden">
              Subtopic: <span className="text-cyan-300 font-mono">{subtopicMeta[activeTab].title}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Predicted Sky Search Corridor */}
            <div className="hidden lg:flex items-center space-x-2.5 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
              <MapPin className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
              <div>
                <span className="text-white font-semibold">{hypothesis.predictedSkyRegion.constellation}</span>
                <span className="text-slate-400 block text-[10px]">
                  RA ≈ {hypothesis.predictedSkyRegion.raCenterDeg}°, Dec ≈ +{hypothesis.predictedSkyRegion.decCenterDeg}°
                </span>
              </div>
            </div>

            <FreezePaneButton
              frozen={panesFrozen}
              onToggle={() => setPanesFrozen((v) => !v)}
              label="Freeze Headlines"
            />
          </div>
        </div>

        {/* Subtopic Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('workbench')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'workbench'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span>Candidate Vetting Workbench</span>
          </button>

          <button
            onClick={() => setActiveTab('resonances')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'resonances'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span>Orbital Resonances & eTNOs</span>
          </button>

          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'simulation'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Orbit className="h-3.5 w-3.5" />
            <span>3D Orbital Phase Space</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'evidence'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Evidence & Parameter Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('mpc')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'mpc'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Live MPC Catalogue</span>
          </button>

          <button
            onClick={() => setActiveTab('uncertainty')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'uncertainty'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Uncertainty & Posteriors</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'workbench' && (
        <CandidateInvestigation
          candidates={candidates}
          panesFrozen={false}
          onVetCandidate={onVetCandidate}
          onExplainCandidate={(cand) =>
            onExplainWithAi('planet_x_candidate', {
              id: cand.id,
              designation: cand.designation,
              survey: cand.survey,
              raDeg: cand.raDeg,
              decDeg: cand.decDeg,
              heliocentricDistanceAU: cand.heliocentricDistanceAU,
              properMotionAlphaArcsecYr: cand.properMotionAlphaArcsecYr,
              properMotionDeltaArcsecYr: cand.properMotionDeltaArcsecYr,
              parallaxArcsec: cand.parallaxArcsec,
              apparentMagW1: cand.apparentMagW1,
              apparentMagW2: cand.apparentMagW2,
              colorW1W2: cand.colorW1W2,
              astrometricSnr: cand.astrometricSnr,
              status: cand.status,
              theoreticalConsistency: cand.theoreticalConsistency,
            })
          }
        />
      )}

      {activeTab === 'resonances' && (
        <OrbitalResonanceVisualizer
          etnoCatalog={etnoCatalog}
          candidates={candidates}
          hypothesis={hypothesis}
          panesFrozen={false}
          onExplainWithAi={onExplainWithAi}
        />
      )}

      {activeTab === 'simulation' && (
        <OrbitalSimulation
          etnoCatalog={etnoCatalog}
          hypothesis={hypothesis}
          onSelectObject={(name) => {
            console.log('Selected orbit object:', name);
          }}
        />
      )}

      {activeTab === 'evidence' && (
        <EvidencePanel
          etnoCatalog={etnoCatalog}
          hypothesis={hypothesis}
          onUpdateHypothesis={onUpdateHypothesis}
          onExplainEvidence={() =>
            onExplainWithAi('etno_clustering', {
              etnoCatalogCount: etnoCatalog.length,
              clusteredObjects: etnoCatalog.filter((o) => o.antiAligned).map((o) => o.name),
              hypothesisParams: hypothesis,
            })
          }
        />
      )}

      {activeTab === 'uncertainty' && (
        <UncertaintyIndicator hypothesis={hypothesis} />
      )}

      {activeTab === 'mpc' && <MpcCatalogPanel />}
    </div>
  );
};
