import React from 'react';
import { Database, ExternalLink, AlertTriangle } from 'lucide-react';

export const SpherexDataCollectionGuide: React.FC = () => (
  <section className="w-full max-w-4xl rounded-2xl border border-cyan-800/50 bg-slate-950/90 p-5 text-left space-y-4">
    <div className="flex items-start gap-3">
      <Database className="h-6 w-6 text-cyan-300 shrink-0 mt-1" />
      <div>
        <h3 className="text-base font-bold text-white">Build your local NASA SPHEREx dataset</h3>
        <p className="text-sm text-slate-300 mt-1">No verified FITS observations are loaded. Black Star Orbit will not invent sky frames, dates, spectra, or detections to fill the gap.</p>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <a className="rounded-xl border border-slate-700 bg-slate-900 p-3 hover:border-cyan-500 transition" href="https://irsa.ipac.caltech.edu/applications/SPHEREx/" target="_blank" rel="noreferrer">
        <div className="flex items-center gap-2 text-cyan-200 font-semibold"><ExternalLink className="h-4 w-4" /> Open SPHEREx Data Explorer</div>
        <p className="text-xs text-slate-400 mt-2">Search the official NASA/IPAC IRSA archive by target coordinates.</p>
      </a>
      <a className="rounded-xl border border-slate-700 bg-slate-900 p-3 hover:border-cyan-500 transition" href="https://irsa.ipac.caltech.edu/spherex-archive-documentation/spherex-data-access/" target="_blank" rel="noreferrer">
        <div className="flex items-center gap-2 text-cyan-200 font-semibold"><ExternalLink className="h-4 w-4" /> Official download guide</div>
        <p className="text-xs text-slate-400 mt-2">FITS products, cutouts, direct downloads, and programmatic access.</p>
      </a>
    </div>
    <ol className="space-y-3 text-sm text-slate-200 list-decimal pl-5">
      <li><strong>Search a target.</strong> Start with Barnard's Star (RA 269.4521°, Dec +4.6934°), or enter another challenge target.</li>
      <li><strong>Select real products.</strong> Choose SPHEREx Level-2 Spectral Image FITS products from DR1 and/or QR3. Select actual observation dates and detector arrays; request small cutouts instead of the full sky.</li>
      <li><strong>Generate the download script.</strong> Select observations in IRSA's Results panel, use <em>Generate Download Script</em>, and run the script supplied by IRSA. Keep releases in separate folders.</li>
      <li><strong>Place FITS files here:</strong><pre className="mt-2 overflow-x-auto rounded-lg bg-black/60 p-3 text-xs text-cyan-100">data/spherex/incoming/dr1/{'\n'}data/spherex/incoming/qr3/</pre></li>
      <li><strong>Install the indexer and build the manifest:</strong><pre className="mt-2 overflow-x-auto rounded-lg bg-black/60 p-3 text-xs text-cyan-100">python3 -m pip install -r requirements-spherex.txt{'\n'}python3 scripts/index_spherex_datasets.py</pre></li>
      <li><strong>Run Black Star Orbit locally:</strong><pre className="mt-2 overflow-x-auto rounded-lg bg-black/60 p-3 text-xs text-cyan-100">npm install{'\n'}npm run dev</pre></li>
    </ol>
    <div className="flex items-start gap-2 rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 text-xs text-amber-100">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <p><strong>Important:</strong> Local FITS files are read by the machine running the Node server. A Vercel deployment cannot read files from your laptop. Run the app locally after indexing. The indexer records source, release, observation metadata, file size, and SHA-256; it rejects files without valid sky coordinates or observation times.</p>
    </div>
    <p className="text-xs text-slate-400">Start with a small reproducible sample: a few epochs across available detector bands. Prefer DR1 and QR3; do not mix QR2 calibrations into the same comparison.</p>
  </section>
);
