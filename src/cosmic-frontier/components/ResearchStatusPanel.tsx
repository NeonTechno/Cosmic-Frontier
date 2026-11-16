import { useCallback, useEffect, useState, type FC } from 'react';
import { Activity, AlertCircle, CheckCircle2, Clock3, ExternalLink, RefreshCw, Server } from 'lucide-react';

interface ResearchSourceStatus {
  id: string;
  name: string;
  protocol: string;
  role: string;
  documentationUrl: string;
  reachable: boolean;
  latencyMs: number;
  message: string;
}

interface ResearchStatusResponse {
  checkedAt: string;
  onlineCount: number;
  totalCount: number;
  overallStatus: string;
  note: string;
  cached: boolean;
  sources: ResearchSourceStatus[];
}

export const ResearchStatusPanel: FC = () => {
  const [status, setStatus] = useState<ResearchStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/research/status', { cache: 'no-store' });
      if (!response.ok) throw new Error('Research status endpoint returned HTTP ' + response.status);
      const payload = await response.json() as ResearchStatusResponse;
      if (!Array.isArray(payload.sources)) throw new Error('Research status response has an invalid source list');
      setStatus(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not retrieve research source status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const checkedLabel = status?.checkedAt
    ? new Date(status.checkedAt).toLocaleString()
    : 'Not checked yet';

  return (
    <section className="rounded-2xl border border-[#1E293B] bg-[#071126] p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">Research Source Monitor</h2>
            <p className="text-xs text-slate-400 mt-1">Live reachability checks for the archives behind the research workspaces</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500/50 hover:text-cyan-200 disabled:opacity-50"
        >
          <RefreshCw className={'w-3.5 h-3.5 ' + (loading ? 'animate-spin' : '')} />
          {loading ? 'Checking sources' : 'Refresh checks'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-700/40 bg-amber-950/20 p-3 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}. The source monitor is unavailable; this does not imply that every archive is offline.</span>
        </div>
      )}

      {status && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5">
            <div className="flex items-center gap-2">
              {status.onlineCount === status.totalCount
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                : <AlertCircle className="w-4 h-4 text-amber-400" />}
              <span className="text-xs font-mono font-bold text-slate-100">{status.onlineCount}/{status.totalCount} SOURCES RESPONDING</span>
              <span className="text-[10px] text-slate-500">{status.overallStatus}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500">
              <Clock3 className="w-3 h-3" />
              {checkedLabel}{status.cached ? ' · cached' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {status.sources.map((source) => (
              <article key={source.id} className="rounded-xl border border-slate-800 bg-slate-950/55 p-3 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={'w-2 h-2 rounded-full shrink-0 ' + (source.reachable ? 'bg-emerald-400' : 'bg-amber-400')} />
                    <h3 className="text-xs font-semibold text-slate-100 truncate">{source.name}</h3>
                  </div>
                  <span className={'text-[9px] font-mono font-bold tracking-wide shrink-0 ' + (source.reachable ? 'text-emerald-300' : 'text-amber-300')}>
                    {source.reachable ? 'RESPONDING' : 'UNAVAILABLE'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">{source.role}</p>
                <div className="flex items-center justify-between gap-2 mt-3">
                  <span className="text-[9px] text-slate-500 font-mono">{source.protocol} · {source.reachable ? source.latencyMs + ' ms' : 'no response'}</span>
                  <a href={source.documentationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-cyan-300 hover:text-cyan-100">
                    Docs <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-slate-500">{source.message}</p>
              </article>
            ))}
          </div>
          <p className="text-[10px] leading-relaxed text-slate-500 border-t border-slate-800 pt-3">
            <Server className="w-3 h-3 inline mr-1.5" />
            {status.note}
          </p>
        </>
      )}

      {!status && loading && (
        <div className="py-6 text-center text-xs text-slate-500">Checking NASA, ESA and JPL endpoints…</div>
      )}
    </section>
  );
};
