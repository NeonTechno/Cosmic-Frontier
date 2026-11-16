export interface HorizonsObserverObservation {
  dateUTC: string;
  rightAscensionDeg: number | null;
  declinationDeg: number | null;
  apparentMagnitude: number | null;
  surfaceBrightness: number | null;
  rangeAU: number | null;
  rangeRateKmS: number | null;
  solarElongationDeg: number | null;
  sunTargetObserverAngleDeg: number | null;
  constellation: string | null;
}

export interface HorizonsObserverResponse {
  success: true;
  source: 'NASA/JPL Horizons API';
  dataStatus: 'LIVE JPL HORIZONS COMPUTATION';
  isLive: true;
  retrievedAtUTC: string;
  targetId: string;
  targetName: string;
  center: 'Geocentric Earth';
  timeScale: 'UT';
  queryDateUTC: string;
  sourceUrl: string;
  documentationUrl: string;
  note: string;
  observations: HorizonsObserverObservation[];
}

export const HORIZONS_OBSERVER_TARGETS = [
  { id: '10', name: 'Sun' },
  { id: '199', name: 'Mercury' },
  { id: '299', name: 'Venus' },
  { id: '301', name: 'Moon' },
  { id: '499', name: 'Mars' },
  { id: '599', name: 'Jupiter' },
  { id: '699', name: 'Saturn' },
  { id: '799', name: 'Uranus' },
  { id: '899', name: 'Neptune' },
  { id: '999', name: 'Pluto' },
  { id: '433', name: '433 Eros' },
  { id: '99942', name: '99942 Apophis' },
  { id: '101955', name: '101955 Bennu' },
] as const;

const responseCache = new Map<string, { expiresAt: number; value: HorizonsObserverResponse }>();

function finiteValue(value: string | undefined): number | null {
  if (!value || value.trim() === '' || value.trim().toLowerCase() === 'n.a.') return null;
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseHorizonsObserverResult(rawText: string): HorizonsObserverObservation[] {
  const start = rawText.indexOf('$$SOE');
  const end = rawText.indexOf('$$EOE');
  if (start < 0 || end < 0 || end <= start) {
    throw new Error('JPL Horizons response did not contain a complete $$SOE / $$EOE ephemeris table.');
  }

  const headerLine = rawText
    .slice(0, start)
    .split(/\r?\n/)
    .reverse()
    .find((line) => line.includes('R.A._(ICRF)') && line.includes('DEC_(ICRF)'));
  if (!headerLine) throw new Error('JPL Horizons observer table header was not recognised.');

  const headers = headerLine.split(',').map((field) => field.trim());
  const column = (fragment: string) => headers.findIndex((header) => header.includes(fragment));
  const columns = {
    date: column('Date__'),
    ra: column('R.A._(ICRF)'),
    dec: column('DEC_(ICRF)'),
    apparentMagnitude: column('APmag'),
    surfaceBrightness: column('S-brt'),
    rangeAU: column('delta'),
    rangeRateKmS: column('deldot'),
    solarElongationDeg: column('S-O-T'),
    sunTargetObserverAngleDeg: column('S-T-O'),
    constellation: column('Cnst'),
  };
  if (columns.date < 0 || columns.ra < 0 || columns.dec < 0) {
    throw new Error('JPL Horizons response is missing required observer columns.');
  }

  const table = rawText.slice(start + '$$SOE'.length, end);
  return table
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const fields = line.split(',').map((field) => field.trim());
      const read = (index: number) => index >= 0 ? fields[index] : undefined;
      const dateUTC = read(columns.date) || '';
      if (!dateUTC) return null;
      return {
        dateUTC,
        rightAscensionDeg: finiteValue(read(columns.ra)),
        declinationDeg: finiteValue(read(columns.dec)),
        apparentMagnitude: finiteValue(read(columns.apparentMagnitude)),
        surfaceBrightness: finiteValue(read(columns.surfaceBrightness)),
        rangeAU: finiteValue(read(columns.rangeAU)),
        rangeRateKmS: finiteValue(read(columns.rangeRateKmS)),
        solarElongationDeg: finiteValue(read(columns.solarElongationDeg)),
        sunTargetObserverAngleDeg: finiteValue(read(columns.sunTargetObserverAngleDeg)),
        constellation: read(columns.constellation) || null,
      };
    })
    .filter((row): row is HorizonsObserverObservation => row !== null);
}

export async function fetchHorizonsObserverEphemeris(
  targetId: string,
  dateUTC: string
): Promise<HorizonsObserverResponse> {
  const target = HORIZONS_OBSERVER_TARGETS.find((candidate) => candidate.id === targetId);
  if (!target) throw new Error('Unsupported Horizons target. Choose a body from the approved target list.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateUTC)) throw new Error('Date must use YYYY-MM-DD format.');
  const startDate = new Date(dateUTC + 'T00:00:00.000Z');
  if (!Number.isFinite(startDate.getTime()) || startDate.toISOString().slice(0, 10) !== dateUTC) {
    throw new Error('Date is not a valid UTC calendar date.');
  }

  const cacheKey = targetId + '|' + dateUTC;
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const stopDate = new Date(startDate.getTime() + 86400000).toISOString().slice(0, 10);
  const url = new URL('https://ssd.jpl.nasa.gov/api/horizons.api');
  const parameters: Record<string, string> = {
    format: 'json',
    COMMAND: "'" + targetId + "'",
    OBJ_DATA: 'NO',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER',
    CENTER: "'500@399'",
    START_TIME: "'" + dateUTC + "'",
    STOP_TIME: "'" + stopDate + "'",
    STEP_SIZE: "'1 d'",
    TIME_TYPE: 'UT',
    TIME_DIGITS: 'SECONDS',
    QUANTITIES: "'1,9,20,23,24,29'",
    ANG_FORMAT: 'DEG',
    CSV_FORMAT: 'YES',
  };
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('NASA/JPL Horizons returned HTTP ' + response.status + '.');
  const payload = await response.json() as { result?: string; error?: string; signature?: { source?: string } };
  if (payload.error) throw new Error('NASA/JPL Horizons: ' + payload.error);
  if (typeof payload.result !== 'string') throw new Error('NASA/JPL Horizons response did not include a result table.');

  const observations = parseHorizonsObserverResult(payload.result);
  if (observations.length === 0) throw new Error('NASA/JPL Horizons returned no observer rows for the selected target and date.');

  const value: HorizonsObserverResponse = {
    success: true,
    source: 'NASA/JPL Horizons API',
    dataStatus: 'LIVE JPL HORIZONS COMPUTATION',
    isLive: true,
    retrievedAtUTC: new Date().toISOString(),
    targetId,
    targetName: target.name,
    center: 'Geocentric Earth',
    timeScale: 'UT',
    queryDateUTC: dateUTC,
    sourceUrl: url.toString(),
    documentationUrl: 'https://ssd-api.jpl.nasa.gov/doc/horizons.html',
    note: 'These are JPL-computed ephemeris values for the requested time and observing center, not telescope observations or measured image pixels.',
    observations,
  };
  responseCache.set(cacheKey, { expiresAt: Date.now() + 5 * 60 * 1000, value });
  return value;
}
