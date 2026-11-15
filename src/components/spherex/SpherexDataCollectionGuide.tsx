import React, { useEffect, useState } from 'react';
import { Database, ExternalLink, AlertTriangle, RefreshCw, Download, CloudDownload } from 'lucide-react';

interface SpherexDataCollectionGuideProps {
  targetName?: string;
  onFetchLive?: () => void;
  isFetching?: boolean;
}

interface LocalDatasetStatus {
  available: boolean;
  manifestFound: boolean;
  recordCount: number;
  usableRecordCount: number;
  releases: string[];
  bands: string[];
  note?: string;
}

export const SpherexDataCollectionGuide: React.FC<SpherexDataCollectionGuideProps> = ({
  targetName = 'current target',
  onFetchLive,
  isFetching = false,
}) => {
  const [status, setStatus] = useState<LocalDatasetStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const refreshStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/spherex/local-datasets');
      if (!response.ok) throw new Error('Dataset status unavailable');
      setStatus(await response.json());
    } catch {
      setStatus(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => { void refreshStatus(); }, []);

  return (
    <section className="w-full rounded-2xl border border-cyan-800/50 bg-slate-950/90 p-4 sm:p-5 text-left space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Database className="h-6 w-6 text-cyan-300 shrink-0 mt-1" />
          <div>
            <h3 className="text-base font-bold text-white">Hybrid SPHEREx Data Engine</h3>
            <p className="text-sm text-slate-300 mt-1">
              Three connected paths: live NASA/IPAC IRSA retrieval, indexed local FITS datasets, and a clearly labelled synthetic benchmark for interface demonstrations.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {onFetchLive && (
            <button
              type="button"
              onClick={onFetchLive}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-60 px-3 py-2 text-xs font-semibold text-white"
            >
              {isFetching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CloudDownload className="h-3.5 w-3.5" />}
              {isFetching ? 'Fetching…' : 'Fetch live DR1 / QR3'}
            </button>
          )}
          <a
            href="https://irsa.ipac.caltech.edu/applications/SPHEREx/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 hover:border-cyan-500 px-3 py-2 text-xs font-semibold text-cyan-200"
          >
            <ExternalLink className="h-3.5 w-3.5" /> IRSA Data Explorer
          </a>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/25 p-3">
          <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-mono">1 · Live archive</div>
          <div className="text-sm text-white font-semibold mt-1">DR1 + QR3</div>
          <p className="text-[11px] text-slate-400 mt-1">Query by target, RA/Dec, field of view and detector array. Only parsed FITS pixels become observations.</p>
        </div>
        <div className="rounded-lg border border-blue-800/60 bg-blue-950/25 p-3">
          <div className="text-[10px] uppercase tracking-wider text-blue-300 font-mono">2 · Local dataset</div>
          <div className="text-sm text-white font-semibold mt-1">
            {status ? status.usableRecordCount + ' usable FITS files' : 'Dataset status'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {status?.available ? 'Indexed releases: ' + status.releases.join(', ') + '. Bands: ' + status.bands.join(', ') : 'Download FITS products, index their metadata and query them offline.'}
          </p>
          <button type="button" onClick={() => void refreshStatus()} disabled={checking} className="mt-2 inline-flex items-center gap-1 text-[10px] text-cyan-300 hover:text-white">
            <RefreshCw className={'h-3 w-3 ' + (checking ? 'animate-spin' : '')} /> Refresh local inventory
          </button>
        </div>
        <div className="rounded-lg border border-amber-800/60 bg-amber-950/25 p-3">
          <div className="text-[10px] uppercase tracking-wider text-amber-300 font-mono">3 · Benchmark mode</div>
          <div className="text-sm text-white font-semibold mt-1">8 demo fields · 102 bands</div>
          <p className="text-[11px] text-slate-400 mt-1">Generated pixels and SED curves exercise the viewer. They are not archive coverage, measurements or detections.</p>
        </div>
      </div>

      <details className="group rounded-xl border border-slate-800 bg-slate-900/70">
        <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-3.5 py-3 text-sm font-semibold text-cyan-100">
          <span className="flex items-center gap-2"><Download className="h-4 w-4" /> Download and build a real SPHEREx dataset for {targetName}</span>
          <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">⌄</span>
        </summary>
        <div className="px-4 pb-4 pt-1 space-y-3 text-xs text-slate-300">
          <div className="flex flex-wrap gap-2">
            <a className="text-cyan-300 hover:underline inline-flex items-center gap-1" href="https://irsa.ipac.caltech.edu/spherex-archive-documentation/spherex-data-access/" target="_blank" rel="noreferrer">
              Official data-access guide <ExternalLink className="h-3 w-3" />
            </a>
            <a className="text-cyan-300 hover:underline inline-flex items-center gap-1" href="https://irsa.ipac.caltech.edu/spherex-archive-documentation/spherex-data-products/" target="_blank" rel="noreferrer">
              FITS product reference <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Open IRSA Data Explorer and search for {targetName} or paste the target's RA/Dec. Select available Level-2 Spectral Image FITS products from DR1 and/or QR3.</li>
            <li>Choose the observation dates and detector arrays you need. Select a small cutout or a few observations rather than downloading the all-sky archive.</li>
            <li>In the IRSA Results panel, select products and choose <strong>Generate Download Script</strong>. Run the script supplied by IRSA and keep releases in separate folders.</li>
            <li>Place files under <code className="text-cyan-200">data/spherex/incoming/dr1/</code> and <code className="text-cyan-200">data/spherex/incoming/qr3/</code>.</li>
            <li>Install the indexer and create a provenance manifest:</li>
          </ol>
          <pre className="overflow-x-auto rounded-lg bg-black/60 p-3 text-[11px] text-cyan-100">{'python3 -m pip install -r requirements-spherex.txt\npython3 scripts/index_spherex_datasets.py\nnpm run dev'}</pre>
          <div className="flex items-start gap-2 rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 text-amber-100">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>Files stay on the machine running the Node server. A hosted Render service cannot read a laptop's local folder; hosted datasets require a separately configured persistent disk or object store. The indexer records SHA-256 provenance and rejects files without valid sky coordinates and observation times.</p>
          </div>
          <p className="text-[10px] text-slate-500">Prefer DR1 and QR3 for this comparison workflow. QR2 is excluded because its calibration differs. A zero-result query does not prove that an object has never been observed.</p>
        </div>
      </details>
    </section>
  );
};
