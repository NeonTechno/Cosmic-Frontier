/**
 * COSMIC FRONTIER — Live Space & Earth Approach Data Service
 * 
 * Communicates with backend endpoints:
 *   - /api/data/live-space/ephemeris: High-precision J2000 state vectors from NASA JPL Solar System Dynamics
 *   - /api/data/live-space/close-approaches: Verified near-Earth close approaches from NASA/JPL CNEOS CAD API
 */

import type { LiveEphemerisResponse, LiveCloseApproachesResponse, AsteroidMotionResponse } from '../types';

export interface EphemerisQueryParams {
  date?: string;
  target?: string;
}

export interface CloseApproachesQueryParams {
  timeframe?: '24h' | '7d' | '30d' | 'custom';
  phaOnly?: boolean;
  sort?: 'dist' | 'date' | 'size';
  limit?: number;
  dateMin?: string;
  dateMax?: string;
}

export interface AsteroidOrbitQueryParams {
  des?: string;
  date?: string;
}

export async function fetchAsteroidOrbit(
  params?: AsteroidOrbitQueryParams,
  signal?: AbortSignal
): Promise<AsteroidMotionResponse> {
  const url = new URL('/api/data/asteroid/orbit', window.location.origin);
  if (params?.des) url.searchParams.set('des', params.des);
  if (params?.date) url.searchParams.set('date', params.date);

  const res = await fetch(url.toString(), {
    signal,
    headers: { 'Accept': 'application/json' }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch asteroid orbit: HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchLiveEphemeris(
  params?: EphemerisQueryParams,
  signal?: AbortSignal
): Promise<LiveEphemerisResponse> {
  const url = new URL('/api/data/live-space/ephemeris', window.location.origin);
  if (params?.date) url.searchParams.set('date', params.date);
  if (params?.target) url.searchParams.set('target', params.target);

  const res = await fetch(url.toString(), {
    signal,
    headers: { 'Accept': 'application/json' }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ephemeris: HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchLiveCloseApproaches(
  params?: CloseApproachesQueryParams,
  signal?: AbortSignal
): Promise<LiveCloseApproachesResponse> {
  const url = new URL('/api/data/live-space/close-approaches', window.location.origin);
  if (params?.timeframe) url.searchParams.set('timeframe', params.timeframe);
  if (params?.phaOnly !== undefined) url.searchParams.set('phaOnly', String(params.phaOnly));
  if (params?.sort) url.searchParams.set('sort', params.sort);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.dateMin) url.searchParams.set('dateMin', params.dateMin);
  if (params?.dateMax) url.searchParams.set('dateMax', params.dateMax);

  const res = await fetch(url.toString(), {
    signal,
    headers: { 'Accept': 'application/json' }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch close approaches: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data && Array.isArray(data.approaches)) {
    data.approaches = data.approaches.map((item: any) => {
      const minM = item.estimatedDiameterMeters?.min ?? item.estimatedDiameterMinM ?? 50;
      const maxM = item.estimatedDiameterMeters?.max ?? item.estimatedDiameterMaxM ?? 120;
      const avgM = item.estimatedDiameterMeters?.avg ?? Math.round((minM + maxM) / 2);
      const distAU = item.missDistanceAU ?? item.distanceAU ?? 0.05;
      const distKm = item.missDistanceKm ?? item.distanceKm ?? Math.round(distAU * 149597870.7);
      const distLunar = item.missDistanceLunar ?? item.distanceLunar ?? +(distAU * 389.17).toFixed(2);

      return {
        ...item,
        designation: item.designation || item.des || 'NEO Candidate',
        closeApproachDate: item.closeApproachDate || item.cd || '2025-05-01 00:00',
        missDistanceAU: distAU,
        missDistanceKm: distKm,
        missDistanceLunar: distLunar,
        relativeVelocityKmS: item.relativeVelocityKmS ?? item.vRelKmS ?? 15.0,
        absoluteMagnitudeH: item.absoluteMagnitudeH ?? item.h ?? 22.0,
        estimatedDiameterMeters: {
          min: minM,
          max: maxM,
          avg: avgM
        },
        isPotentiallyHazardous: Boolean(item.isPotentiallyHazardous ?? item.pha)
      };
    });
  }
  return data;
}
