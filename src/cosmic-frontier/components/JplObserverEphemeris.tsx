import { useState, type FC } from 'react';
import { Activity, AlertCircle, CalendarDays, ExternalLink, RefreshCw, Satellite } from 'lucide-react';

interface HorizonsObservation {
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

interface HorizonsResponse {
  success: true;
  source: string;
  dataStatus: string;
  isLive: true;
  retrievedAtUTC: string;
  targetId: string;
  targetName: string;
  center: string;
  timeScale: string;
  queryDateUTC: string;
  sourceUrl: string;
  documentationUrl: string;
  note: string;
  observations: HorizonsObservation[];
}

const TARGETS = [
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
];

const formatNumber = (value: number | null, digits = 3) =>
  value === null ? 'Not available' : value.toFixed(digits);

export const JplObserverEphemeris: FC = () => {
  const [targetId, setTargetId] = useState('599');
  const [dateUTC, setDateUTC] = useState(() => new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<HorizonsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runQuery = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ target: targetId, date: dateUTC });
      const response = await fetch('/api/horizons/observer?' + params.toString(), { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || payload.success === false) {
        throw new Error(payload.details || payload.error || 'JPL Horizons query failed');
      }
      setResult(payload as HorizonsResponse);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Could not retrieve the JPL Horizons ephemeris');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-cyan-900/50 bg-[#071126] p-5 sm:p-6 shadow-xl space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 flex items-center justify-center shrink-0">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">Live JPL tool</span>
              <span className="text-[9px] font-mono text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">OBSERVER EPHEMERIS</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">JPL Horizons Observing Planner</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Query geocentric sky position, brightness and range for a selected solar-system body or supported asteroid.
            </p>
          </div>
        </div>
        <a href="https://ssd-api.jpl.nasa.gov/doc/horizons.html" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-cyan-300 hover:text-cyan-100 shrink-0">
          Horizons API documentation <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <label className="block space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Target body</span>
          <select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-cyan-500">
            {TARGETS.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">UTC date</span>
          <span className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
            <input type="date" value={dateUTC} onChange={(event) => setDateUTC(event.target.value)} className="w-full bg-transparent text-xs text-slate-100 outline-none [color-scheme:dark]" />
          </span>
        </label>
        <button type="button" onClick={() => void runQuery()} disabled={loading || !dateUTC} className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50">
          <RefreshCw className={'w-3.5 h-3.5 ' + (loading ? 'animate-spin' : '')} />
          {loading ? 'Querying JPL' : 'Query Horizons'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-700/40 bg-amber-950/20 p-3 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-y border-slate-800 py-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">{result.targetName}</span>
              <span className="text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 rounded px-1.5 py-0.5">JPL COMPUTED</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Retrieved {new Date(result.retrievedAtUTC).toLocaleString()}</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-slate-900/90 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-3">UTC epoch</th>
                  <th className="px-3 py-3">RA (ICRF)</th>
                  <th className="px-3 py-3">Dec (ICRF)</th>
                  <th className="px-3 py-3">App. mag</th>
                  <th className="px-3 py-3">Range (AU)</th>
                  <th className="px-3 py-3">Range rate</th>
                  <th className="px-3 py-3">Solar elong.</th>
                  <th className="px-3 py-3">Constellation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {result.observations.map((row, index) => (
                  <tr key={row.dateUTC + '-' + index} className="bg-slate-950/50">
                    <td className="px-3 py-3 font-mono whitespace-nowrap">{row.dateUTC}</td>
                    <td className="px-3 py-3 tabular-nums">{formatNumber(row.rightAscensionDeg, 5)}°</td>
                    <td className="px-3 py-3 tabular-nums">{formatNumber(row.declinationDeg, 5)}°</td>
                    <td className="px-3 py-3 tabular-nums">{formatNumber(row.apparentMagnitude, 2)}</td>
                    <td className="px-3 py-3 tabular-nums">{formatNumber(row.rangeAU, 5)}</td>
                    <td className="px-3 py-3 tabular-nums">{formatNumber(row.rangeRateKmS, 3)} km/s</td>
                    <td className="px-3 py-3 tabular-nums">{formatNumber(row.solarElongationDeg, 2)}°</td>
                    <td className="px-3 py-3">{row.constellation || 'Not available'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500 font-mono">{result.center} · UTC · JPL Horizons numerical ephemeris</span>
            <a href={result.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] text-cyan-300 hover:text-cyan-100">
              Open raw JPL query <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="rounded-lg border border-sky-900/50 bg-sky-950/20 px-3 py-2.5 text-[10px] leading-relaxed text-sky-200/80">
            {result.note}
          </p>
        </div>
      )}

      {!result && !error && !loading && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 py-5 text-center text-xs text-slate-500">
          Select a target and UTC date, then query JPL Horizons to retrieve a live computed ephemeris.
        </div>
      )}
    </section>
  );
};
