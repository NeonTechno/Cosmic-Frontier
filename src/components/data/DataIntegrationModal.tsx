/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * COSMIC FRONTIER — Official NASA Data Integration & Endpoint Diagnostic Guide
 */

import React, { useState } from 'react';
import { OFFICIAL_NASA_DATA_SOURCES, testEndpointReadiness } from '../../science/dataConnector.ts';
import {
  Database,
  ShieldAlert,
  CheckCircle,
  ExternalLink,
  Activity,
  X,
  RefreshCw,
  Server,
  Layers,
  Code2,
} from 'lucide-react';

const SPACE_APPS_RESOURCES = [
  {
    group: 'NASA data and resources',
    agency: 'NASA / IPAC',
    title: 'NASA/IPAC Infrared Science Archive — SPHEREx',
    description: 'Primary mission archive for SPHEREx spectral images, DR1 and Quick Release products, metadata, and programmatic image access.',
    url: 'https://irsa.ipac.caltech.edu/Missions/spherex.html',
    tag: 'PRIMARY DATA',
  },
  {
    group: 'NASA data and resources',
    agency: 'Caltech/IPAC',
    title: 'SPHEREx Tutorial Notebooks',
    description: 'Official Python notebooks for discovering observations, reading spectral-image FITS files, making cutouts, and working with PSF and mosaic products.',
    url: 'https://caltech-ipac.github.io/irsa-tutorials/spherex/',
    tag: 'DEVELOPER GUIDE',
  },
  {
    group: 'NASA data and resources',
    agency: 'NASA/IPAC IRSA',
    title: 'SPHEREx DR1 & QR3 Wide + Deep SIA collections',
    description: 'The searchable spectral-image collections: spherex_dr1, spherex_dr1_deep, spherex_qr3, and spherex_qr3_deep. The app queries all four collection families for live spatial observations.',
    url: 'https://irsa.ipac.caltech.edu/SIA?COLLECTION=spherex_dr1',
    tag: 'LIVE ARCHIVE · 4 COLLECTIONS',
    coverage: 'INTEGRATED — live SIAv2 search includes DR1/QR3 wide and deep collections; results retain their originating collection.',
  },
  {
    group: 'NASA data and resources',
    agency: 'NASA/IPAC IRSA',
    title: 'SPHEREx DR1 All-Sky HiPS Cube (102 spectral layers)',
    description: 'The all-sky cube is a separate product from the spectral-image MEFs. It contains IMAGE, NHITS, FLAGS, SPECTRAL_CHANNELS and WCS-WAVE extensions; its 102 layers map to the SPHEREx wavelength channels.',
    url: 'https://irsa.ipac.caltech.edu/data/hips/SPHEREx/spherex_allsky_cube',
    tag: 'ALL-SKY FITS CUBE',
    coverage: 'NOT YET PORTED — the site links the official HiPS notebook; direct HEALPix FITS tile retrieval and per-position spectrum extraction are still outstanding.',
  },
  {
    group: 'NASA data and resources',
    agency: 'NASA/IPAC IRSA',
    title: 'SPHEREx ePSF calibration product',
    description: 'The EPSF binary-table extension stores detector-zone metadata and 33×33 oversampled PSF arrays (OVSMPX/OVSMPY = 5). The official notebook selects the nearest XCENTER/YCENTER zone.',
    url: 'https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/',
    tag: 'CALIBRATION · EPSF',
    coverage: 'NOT YET PORTED — the current FITS reader does not parse the EPSF BINTABLE or select a detector-zone PSF.',
  },
  {
    group: 'NASA data and resources',
    agency: 'Backyard Worlds / WISE',
    title: 'WiseView',
    description: 'Official challenge inspiration: blink historical WISE/NEOWISE images to inspect moving and variable infrared sources. Complementary to, not a substitute for, SPHEREx observations.',
    url: 'https://byw.tools/wiseview',
    tag: 'TIME-DOMAIN REFERENCE',
  },
  {
    group: 'NASA data and resources',
    agency: 'Caltech/IPAC IRSA',
    title: 'SPHEREx Data Overview notebook',
    description: 'SIA spatial search, observation metadata, multi-extension FITS structure, IMAGE/FLAGS/VARIANCE/ZODI products, and spatial plus wavelength WCS.',
    url: 'https://caltech-ipac.github.io/irsa-tutorials/spherex-intro',
    tag: 'NOTEBOOK · DATA ACCESS',
    coverage: 'PARTIAL — live archive search, FITS parsing and image display exist; Firefly notebook parity is not complete.',
  },
  {
    group: 'NASA data and resources',
    agency: 'Caltech/IPAC IRSA',
    title: 'SPHEREx Spectral Image Cutouts notebook',
    description: 'Build multi-epoch spatial/spectral cutouts, retain the CUTOUT_INFO table, observation dates, wavelengths, processing versions and source access URLs.',
    url: 'https://caltech-ipac.github.io/irsa-tutorials/spherex-cutouts',
    tag: 'NOTEBOOK · CUTOUTS',
    coverage: 'PARTIAL — single observation cutouts and local multi-epoch FITS indexing exist; notebook-style multi-cutout MEF export is not complete.',
  },
  {
    group: 'NASA data and resources',
    agency: 'Caltech/IPAC IRSA',
    title: 'SPHEREx PSF Models notebook',
    description: 'Extract the EPSF extension, select the detector zone by XCENTER/YCENTER, and understand oversampling, wavelength and effective-area metadata.',
    url: 'https://caltech-ipac.github.io/irsa-tutorials/spherex-psf',
    tag: 'NOTEBOOK · PSF',
    coverage: 'NOT YET PORTED — the current viewer does not expose validated ePSF zone extraction or PSF fitting.',
  },
  {
    group: 'NASA data and resources',
    agency: 'Caltech/IPAC IRSA',
    title: 'SPHEREx Source Discovery Tool notebook',
    description: 'Background subtraction, bad-pixel masking, reprojection, difference-colour images, source extraction, aperture photometry and 1D spectra.',
    url: 'https://caltech-ipac.github.io/irsa-tutorials/spherex-source-discovery-tool-demo',
    tag: 'NOTEBOOK · SOURCES',
    coverage: 'PARTIAL — image comparison and spectral views exist; the notebook SExtractor/SEP extraction and full quality-flag workflow are not ported.',
  },
  {
    group: 'NASA data and resources',
    agency: 'Caltech/IPAC IRSA',
    title: 'SPHEREx Mosaic Cube notebook',
    description: 'Inspect and analyze calibrated SPHEREx mosaic cubes and their spatial/spectral data products.',
    url: 'https://caltech-ipac.github.io/irsa-tutorials/spherex-mosaic',
    tag: 'NOTEBOOK · MOSAICS',
    coverage: 'NOT YET PORTED — no verified mosaic-cube reader or analysis workflow is exposed in the app.',
  },
  {
    group: 'NASA data and resources',
    agency: 'Caltech/IPAC IRSA',
    title: 'SPHEREx HiPS All-Sky Cube notebook',
    description: 'Explore HiPS all-sky mosaic cubes, retrieve FITS tiles, drill into cube data and extract quick-look spectra.',
    url: 'https://caltech-ipac.github.io/irsa-tutorials/spherex-hipscube',
    tag: 'NOTEBOOK · HiPS',
    coverage: 'NOT YET PORTED — tile-level HiPS FITS cube retrieval and drill-through are not verified in the app.',
  },
  {
    group: 'NASA data and resources',
    agency: 'STScI / MAST',
    title: 'Gaia Mission Data — Data Release 3',
    description: 'Astrometry, proper motions, parallaxes, and photometry for cross-matching and checking background-star motion.',
    url: 'https://archive.stsci.edu/missions-and-data/gaia',
    tag: 'ASTROMETRY',
  },
  {
    group: 'Space agency partner resources',
    agency: 'Canadian Space Agency (CSA)',
    title: 'NEOSSat: Observing Asteroids, Space Debris and Exoplanets',
    description: 'Mission background on tracking near-Earth asteroids, comets, satellites, and space debris. Supplementary context; it is not a replacement for SPHEREx infrared imagery.',
    url: 'https://www.asc-csa.gc.ca/eng/satellites/neossat/',
    tag: 'SUPPLEMENTARY',
  },
  {
    group: 'Space agency partner resources',
    agency: 'Canadian Astronomy Data Centre',
    title: 'Canadian Astronomy Data Centre (CADC)',
    description: 'Astronomical archive access and discovery services for complementary observations and catalog context.',
    url: 'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/',
    tag: 'SUPPLEMENTARY ARCHIVE',
  },
  {
    group: 'Space agency partner resources',
    agency: 'Canadian Space Agency (CSA)',
    title: 'NEOSSat Data Tutorial',
    description: 'Open-source tutorial showing how to retrieve and visualize NEOSSat observations with Python.',
    url: 'https://github.com/asc-csa/NEOSSAT_Tutorial',
    tag: 'CODE TUTORIAL',
  },
  {
    group: 'Space agency partner resources',
    agency: 'Canadian Space Agency (CSA)',
    title: 'NEOSSat Dataset',
    description: 'Public mission dataset for exploring observations of near-Earth objects and orbital debris.',
    url: 'https://data.asc-csa.gc.ca/dataset/neossat',
    tag: 'OPEN DATASET',
  },
] as const;

interface DataIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataIntegrationModal: React.FC<DataIntegrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<
    Record<string, { reachable: boolean; latencyMs: number; message: string }>
  >({});

  if (!isOpen) return null;

  const handleTestPing = async (serviceId: string) => {
    setTestingId(serviceId);
    try {
      const res = await testEndpointReadiness(serviceId);
      setPingResults((prev) => ({
        ...prev,
        [serviceId]: {
          reachable: res.isReachable,
          latencyMs: res.latencyMs,
          message: res.message,
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-purple-950 text-purple-400 border border-purple-800/60">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                NASA & Caltech/IPAC Data Integration Architecture
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Official APIs, VO Protocols, and Pre-Commissioning Data Pipeline Status
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live and local verified data boundary */}
        <div className="bg-emerald-950/35 border-b border-emerald-800/40 px-4 py-3 text-xs text-emerald-100 flex items-start space-x-3 font-mono">
          <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-emerald-300 uppercase tracking-wide">
              LIVE IRSA + LOCAL FITS SUPPORT
            </div>
            <p className="leading-relaxed text-emerald-100/85 font-sans">
              The application has live-first IRSA SIAv2 search, Level-2 FITS cutout parsing, local DR1/QR3 FITS indexing, and Gaia/AllWISE cross-match paths. This does not mean every official notebook workflow is implemented: the notebook coverage map below distinguishes working, partial, and not-yet-ported features.
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Section 1: Official Data Sources Registry */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 font-mono">
              <Server className="h-4 w-4 text-cyan-400" />
              <span>Target Endpoints & Protocol Connectors</span>
            </h4>

            <div className="space-y-3">
              {OFFICIAL_NASA_DATA_SOURCES.map((source) => {
                const ping = pingResults[source.serviceId];
                const isTesting = testingId === source.serviceId;

                return (
                  <div
                    key={source.serviceId}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs font-mono"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{source.name}</span>
                          <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                            {source.protocol}
                          </span>
                        </div>
                        <span className="text-[11px] text-cyan-400">{source.organization}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border ${
                            source.status === 'ONLINE_AVAILABLE'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : source.status === 'PRE_LAUNCH_SPEC'
                              ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          {source.status.replace('_', ' ')}
                        </span>

                        <button
                          disabled={isTesting}
                          onClick={() => handleTestPing(source.serviceId)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        >
                          <RefreshCw className={`h-3 w-3 ${isTesting ? 'animate-spin' : ''}`} />
                          <span>{isTesting ? 'Testing...' : 'Ping Test'}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      {source.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span className="truncate max-w-sm text-slate-500">
                        Endpoint: {source.endpointUrl}
                      </span>
                      <a
                        href={source.documentationRef}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-cyan-400 hover:underline"
                      >
                        <span>Official Docs</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    {ping && (
                      <div
                        className={`p-2 rounded text-[11px] flex items-center justify-between ${
                          ping.reachable
                            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                            : 'bg-red-950/40 text-red-300 border border-red-800/40'
                        }`}
                      >
                        <span>{ping.message}</span>
                        <span className="font-bold">{ping.latencyMs} ms latency</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Official challenge resource pack */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 font-mono">
                  <Layers className="h-4 w-4 text-cyan-400" />
                  <span>Official Space Apps Challenge Resources</span>
                </h4>
                <p className="mt-1 text-[11px] text-slate-400 font-sans">
                  Official NASA Space Apps links plus the full public Caltech/IPAC SPHEREx notebook suite. Coverage labels describe the current app, not the notebook itself.
                </p>
              </div>
              <a
                href="https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/?tab=resources"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Open challenge resource page ↗
              </a>
            </div>

            {(['NASA data and resources', 'Space agency partner resources'] as const).map((group) => (
              <div key={group} className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">{group}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {SPACE_APPS_RESOURCES.filter((resource) => resource.group === group).map((resource) => (
                    <a
                      key={resource.title}
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-slate-800 bg-slate-900/80 p-3 hover:border-cyan-500/50 hover:bg-slate-900 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] text-cyan-400 font-mono">{resource.agency}</span>
                        <span className="shrink-0 rounded border border-slate-700 px-1.5 py-0.5 text-[9px] text-slate-400 font-mono">{resource.tag}</span>
                      </div>
                      <span className="mt-1 block text-xs font-semibold text-white">{resource.title}</span>
                      <span className="mt-1 block text-[11px] leading-relaxed text-slate-400 font-sans">{resource.description}</span>
                      {'coverage' in resource && <span className="mt-2 block text-[10px] leading-relaxed text-amber-200/90 font-mono">APP COVERAGE: {resource.coverage}</span>}
                      <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
                        Open resource <ExternalLink className="h-3 w-3" />
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
            <p className="rounded-lg border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-[11px] leading-relaxed text-amber-200/90 font-sans">
              Scientific scope note: SPHEREx IRSA is the primary SPHEREx image source. Gaia DR3 provides complementary astrometry; WISE/NEOWISE provides historical infrared context. NEOSSat is a separate Canadian mission and its observations must not be presented as SPHEREx images or direct evidence for Planet X. The official resource list does not supply a dedicated Planet X notebook; orbital-catalogue analysis remains a separate workflow.
            </p>
          </div>

          {/* Section 2: Architectural Separation */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3 text-xs font-mono">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Code2 className="h-4 w-4 text-purple-400" />
              <span>Full-Stack Engineering & Decoupling Model</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                <span className="text-cyan-400 font-bold block">1. Frontend Layer</span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  React 19 + TypeScript with HTML5 Canvas acceleration for FITS pixel rendering, dynamic asinh/log flux stretching, and multi-epoch blink comparisons.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                <span className="text-indigo-400 font-bold block">2. Scientific Core</span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Isolated in <code>src/science/</code>: Keplerian orbital mechanics, eTNO Rayleigh Z-clustering, image difference subtraction, and 102-channel LVF table.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                <span className="text-purple-400 font-bold block">3. Backend & AI Security</span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Express.js server strictly holds API keys on the server. Calls <code>nvidia/nemotron-3.5-bolt-e4b</code> via NVIDIA NIM (<code>integrate.api.nvidia.com</code>) with non-negotiable scientific grounding directives.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono rounded-lg transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
