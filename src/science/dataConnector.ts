/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * COSMIC FRONTIER — NASA & Caltech/IPAC Data Access Connector
 * Modular architecture for authentic NASA IRSA, IVOA TAP/SIAv2,
 * Minor Planet Center, and synthetic benchmark pipeline telemetry.
 */

import { NasaDataEndpointStatus } from '../types/index.ts';

export const OFFICIAL_NASA_DATA_SOURCES: NasaDataEndpointStatus[] = [
  {
    serviceId: 'irsa-spherex-sia',
    name: 'NASA / Caltech IPAC IRSA SIAv2 (SPHEREx DR1/QR3 Wide & Deep)',
    organization: 'NASA IRSA / Caltech',
    endpointUrl: 'https://irsa.ipac.caltech.edu/SIA?COLLECTION=spherex_dr1',
    protocol: 'SIAv2',
    status: 'ONLINE_AVAILABLE',
    lastPingMs: 1400,
    description: 'Live spatial cone-search across spherex_dr1, spherex_dr1_deep, spherex_qr3, and spherex_qr3_deep, paired with direct IBE Level-2 Multi-Extension FITS cutouts (IMAGE, FLAGS, VARIANCE, ZODI).',
    documentationRef: 'https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access',
  },
  {
    serviceId: 'esa-gaia-dr3',
    name: 'ESA Gaia DR3 TAP Astrometry Service',
    organization: 'European Space Agency (ESAC)',
    endpointUrl: 'https://gea.esac.esa.int/tap-server/tap/sync',
    protocol: 'TAP / IVOA',
    status: 'ONLINE_AVAILABLE',
    lastPingMs: 950,
    description: 'Live ADQL cone searches returning J2016.0 astrometry, proper motions (pmra, pmdec), parallaxes, and G magnitudes propagated to SPHEREx observation epochs.',
    documentationRef: 'https://gea.esac.esa.int/archive/',
  },
  {
    serviceId: 'irsa-allwise-ibe',
    name: 'NASA / IPAC AllWISE IBE Mid-IR Cutout Service',
    organization: 'NASA IRSA / Caltech',
    endpointUrl: 'https://irsa.ipac.caltech.edu/ibe/sia/wise/allwise/p3am_cdd',
    protocol: 'SIAv2',
    status: 'ONLINE_AVAILABLE',
    lastPingMs: 650,
    description: 'Live W1 (3.4 µm) and W2 (4.6 µm) AllWISE coadd FITS cutouts (~2010 baseline) enabling 15-year proper motion blinking against 2025–2026 SPHEREx epochs.',
    documentationRef: 'https://irsa.ipac.caltech.edu/Missions/wise.html',
  },
  {
    serviceId: 'irsa-spherex-tap',
    name: 'NASA / Caltech IPAC IRSA TAP (spherex.obscore)',
    organization: 'NASA Infrared Processing and Analysis Center (IPAC)',
    endpointUrl: 'https://irsa.ipac.caltech.edu/TAP',
    protocol: 'TAP / IVOA',
    status: 'PRE_LAUNCH_SPEC',
    lastPingMs: 0,
    description: 'The TAP schema is documented, but this application currently uses SIAv2 for spatial discovery; no live TAP query workflow is wired into the UI yet.',
    documentationRef: 'https://irsa.ipac.caltech.edu/docs/program_interface/TAP.html',
  },
  {
    serviceId: 'mpc-outer-ss',
    name: 'IAU Minor Planet Center Distant Extended Orbit Catalogue',
    organization: 'International Astronomical Union / Smithsonian Astrophysical Observatory',
    endpointUrl: 'https://minorplanetcenter.net/Extended_Files/distant_extended.json.gz',
    protocol: 'REST / JSON',
    status: 'ONLINE_AVAILABLE',
    lastPingMs: 0,
    description: 'Live MPC distant_extended.json.gz feed. Black Star Orbit parses published osculating orbital elements and filters bound eTNOs (a > 150 AU, q > 30 AU, e < 1); clustering membership remains unassessed.',
    documentationRef: 'https://data.minorplanetcenter.net/data',
  },
  {
    serviceId: 'irsa-spherex-hips-cube',
    name: 'NASA/IPAC IRSA SPHEREx DR1 HiPS All-Sky Cube',
    organization: 'NASA IRSA / Caltech',
    endpointUrl: 'https://irsa.ipac.caltech.edu/data/hips/SPHEREx/spherex_allsky_cube/properties',
    protocol: 'REST / JSON',
    status: 'ONLINE_AVAILABLE',
    lastPingMs: 0,
    description: 'Live HiPS metadata and Norder-5 HEALPix FITS cube retrieval; Black Star Orbit extracts a background-subtracted 102-layer spectrum at user-specified sky coordinates.',
    documentationRef: 'https://caltech-ipac.github.io/irsa-tutorials/spherex-hipscube/',
  },
  {
    serviceId: 'nasa-open-data-api',
    name: 'NASA Open Data API (NeoWs, APOD, DONKI)',
    organization: 'NASA (api.nasa.gov)',
    endpointUrl: 'https://api.nasa.gov',
    protocol: 'REST / JSON',
    status: 'ONLINE_AVAILABLE',
    lastPingMs: 140,
    description: 'Authenticated NASA Open Data API querying planetary defense near-Earth asteroid encounters and astronomy dispatches.',
    documentationRef: 'https://api.nasa.gov/',
  },
  {
    serviceId: 'spherex-benchmark-calib',
    name: 'SPHEREx Level-2 Synthetic Fallback Generator',
    organization: 'Black Star Orbit Offline Resilience Layer',
    endpointUrl: '/api/spherex/observations',
    protocol: 'REST / JSON',
    status: 'PROXY_SIMULATED',
    lastPingMs: 4,
    description: 'Explicitly labelled synthetic benchmark for interface walkthroughs only. It is available only through SIMULATED_DEMO and is never substituted for failed or empty IRSA archive queries.',
    documentationRef: 'https://spherex.caltech.edu/Science.html',
  }
];

/**
 * Diagnostic tool to check connectivity and protocol readiness of external sources
 */
export async function testEndpointReadiness(serviceId: string): Promise<{
  isReachable: boolean;
  latencyMs: number;
  message: string;
}> {
  const t0 = performance.now();
  try {
    const res = await fetch(`/api/data-status/ping?service=${encodeURIComponent(serviceId)}`);
    const dt = Math.round(performance.now() - t0);
    if (!res.ok) {
      return { isReachable: false, latencyMs: dt, message: `HTTP ${res.status}: ${res.statusText}` };
    }
    const data = await res.json();
    return { isReachable: data.reachable, latencyMs: data.latencyMs || dt, message: data.message };
  } catch (err: unknown) {
    const dt = Math.round(performance.now() - t0);
    const msg = err instanceof Error ? err.message : 'Network unreachable';
    return { isReachable: false, latencyMs: dt, message: msg };
  }
}
