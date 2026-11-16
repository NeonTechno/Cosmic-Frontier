import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, Download, Loader2, RefreshCw, Telescope } from 'lucide-react';

type WorkflowMode = 'psf' | 'hips';
interface Props { mode: WorkflowMode; }
type AnyResult = Record<string, any>;

export const SpherexAdvancedWorkflows: React.FC<Props> = ({ mode }) => {
  const [ra, setRa] = useState(mode === 'psf' ? '305.59875' : '60.8109955');
  const [dec, setDec] = useState(mode === 'psf' ? '41.1488889' : '51.3404038');
  const [result, setResult] = useState<AnyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLayer, setSelectedLayer] = useState(62);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const endpoint = mode === 'psf' ? '/api/spherex/psf' : '/api/spherex/hips-cube';
  const title = mode === 'psf' ? 'Spatially varying ePSF calibration' : '102-layer HiPS all-sky spectral cube';
  const subtitle = mode === 'psf'
    ? 'Fetch a real SPHEREx Level-2 cutout, map the requested sky coordinate to the parent LVF detector, and select the nearest calibrated PSF zone.'
    : 'Resolve the nested HEALPix tile, retrieve the actual IRSA FITS cube, and extract a background-subtracted 102-band spectrum at the selected sky position.';

  const run = async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ ra, dec });
      const response = await fetch(endpoint + '?' + params.toString());
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Scientific archive request failed.');
      setResult(payload);
      setSelectedLayer(62);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Unable to complete the archive workflow.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (mode === 'psf' && Array.isArray(result.psf)) {
      const n = Number(result.dimensions?.width || 33);
      const values: number[] = result.psf;
      const min = Math.min(...values), max = Math.max(...values);
      const cell = 9;
      canvas.width = n * cell; canvas.height = n * cell;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      values.forEach((value, i) => {
        const t = max === min ? 0.5 : (value - min) / (max - min);
        const x = (i % n) * cell, y = Math.floor(i / n) * cell;
        ctx.fillStyle = 'hsl(' + (245 - t * 220) + ' 88% ' + (12 + t * 68) + '%)';
        ctx.fillRect(x, y, cell, cell);
      });
    } else if (mode === 'hips' && Array.isArray(result.spectrum)) {
      canvas.width = 900; canvas.height = 300;
      const w = canvas.width, h = canvas.height, left = 58, right = 18, top = 18, bottom = 42;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, w, h);
      const points = result.spectrum.filter((p: any) => Number.isFinite(p.fluxMilliJansky));
      if (!points.length) return;
      const ys = points.map((p: any) => p.fluxMilliJansky as number);
      const min = Math.min(0, ...ys), max = Math.max(...ys, 1e-8);
      const x = (wl: number) => left + (wl - result.wavelengthRangeMicrons[0]) / (result.wavelengthRangeMicrons[1] - result.wavelengthRangeMicrons[0]) * (w-left-right);
      const y = (v: number) => h-bottom - (v-min)/(max-min || 1) * (h-top-bottom);
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, h-bottom); ctx.lineTo(w-right, h-bottom); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.font = '12px monospace';
      ctx.fillText('Flux density (mJy)', 10, 14);
      ctx.fillText('Wavelength (µm)', w/2-48, h-10);
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2; ctx.beginPath();
      let started = false;
      result.spectrum.forEach((p: any) => {
        if (!Number.isFinite(p.fluxMilliJansky)) { started = false; return; }
        const px=x(p.wavelengthMicrons), py=y(p.fluxMilliJansky);
        if (!started) { ctx.moveTo(px,py); started=true; } else ctx.lineTo(px,py);
      });
      ctx.stroke();
      result.spectrum.forEach((p: any) => {
        if (!Number.isFinite(p.fluxMilliJansky)) return;
        ctx.beginPath(); ctx.arc(x(p.wavelengthMicrons),y(p.fluxMilliJansky),2.5,0,Math.PI*2);
        ctx.fillStyle=p.blank?'#f59e0b':'#67e8f9'; ctx.fill();
      });
      const chosen=result.spectrum[selectedLayer];
      if (chosen && Number.isFinite(chosen.fluxMilliJansky)) {
        ctx.strokeStyle='#f59e0b'; ctx.setLineDash([4,4]); ctx.beginPath();
        ctx.moveTo(x(chosen.wavelengthMicrons),top); ctx.lineTo(x(chosen.wavelengthMicrons),h-bottom); ctx.stroke(); ctx.setLineDash([]);
      }
    }
  }, [result, mode, selectedLayer]);

  const selected = mode === 'hips' ? result?.spectrum?.[selectedLayer] : null;
  const downloadCsv = () => {
    if (!result?.spectrum) return;
    const lines = ['layer,wavelength_um,flux_mJy,background_MJy_sr,aperture_pixels,flagged_pixels,median_hits,blank,spectrum_use,flags_policy'];
    for (const p of result.spectrum) lines.push([p.layer,p.wavelengthMicrons,p.fluxMilliJansky ?? '',p.backgroundSurfaceBrightness ?? '',p.aperturePixels,p.flaggedPixels,p.medianHits ?? '',p.blank,result.spectrumUse ?? 'unspecified',result.flagsPolicy ?? 'unspecified'].join(','));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href=url; link.download='spherex-hips-spectrum.csv'; link.click(); URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">
            <Telescope className="h-3.5 w-3.5" /> NASA/IPAC IRSA · Official notebook workflow
          </div>
          <h2 className="mt-2 text-lg font-bold text-white">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{subtitle}</p>
        </div>
        <a href={mode === 'psf' ? 'https://caltech-ipac.github.io/irsa-tutorials/spherex-psf/' : 'https://caltech-ipac.github.io/irsa-tutorials/spherex-hipscube/'} target="_blank" rel="noreferrer" className="text-[11px] text-cyan-300 hover:text-cyan-100 underline underline-offset-4">Open official notebook ↗</a>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Right ascension · ICRS degrees
          <input value={ra} onChange={e=>setRa(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400" />
        </label>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Declination · ICRS degrees
          <input value={dec} onChange={e=>setDec(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400" />
        </label>
        <button onClick={run} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? 'Querying archive…' : mode === 'psf' ? 'Extract calibrated PSF' : 'Retrieve cube & extract spectrum'}
        </button>
      </div>

      {error && <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {!result && !error && <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-xs text-slate-500">Enter a sky position and run the workflow to retrieve real archive data. No synthetic PSF or spectrum is substituted.</div>}

      {mode === 'psf' && result && (
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,360px)_1fr]">
          <div className="rounded-xl border border-slate-800 bg-black/40 p-3">
            <div className="mb-2 flex items-center justify-between text-[10px] font-mono text-slate-400"><span>SELECTED ePSF · 33 × 33</span><span>{result.oversampling.x}× / {result.oversampling.y}× oversampled</span></div>
            <div className="flex justify-center overflow-auto"><canvas ref={canvasRef} className="max-w-full image-rendering-pixelated" /></div>
            <div className="mt-2 text-[10px] text-slate-500">Oversampled detector PSF samples; native-pixel fitting requires phase shift, pixel integration and normalization.</div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                ['Detector',result.detector],['Image version',result.imageVersion],['Selected zone',result.selectedZone.binX+', '+result.selectedZone.binY],
                ['Wavelength',Number(result.selectedZone.wavelengthMicrons).toFixed(4)+' µm'],['N_eff',Number(result.selectedZone.nEffMean).toFixed(4)],['Zone offset',result.selectedZone.distancePixels+' px'],
              ].map(([label,value])=><div key={label} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div><div className="mt-1 text-sm font-semibold text-white">{value}</div></div>)}
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
              <div className="mb-2 flex items-center gap-2 font-semibold text-cyan-300"><CheckCircle2 className="h-4 w-4" /> Position-specific calibration selected</div>
              The sky coordinate maps to parent LVF pixel ({result.parentPixel.x}, {result.parentPixel.y}). The nearest calibration zone is table row {result.selectedZone.row} of {result.zones.length}; the PSF is read directly from the FITS EPSF binary table.
              <div className="mt-2 text-[10px] text-slate-500">Observation: {result.observation.obsId} · {result.observation.collection} · MJD {Number(result.observation.mjd).toFixed(2)} · {result.observation.band}</div>
            </div>
            <div className="rounded-lg border border-slate-800 p-3">
              <div className="mb-2 text-[10px] font-mono uppercase text-slate-400">Detector-zone ePSF coverage · {result.zones.length} zones</div>
              <div className="grid grid-cols-11 gap-1">
                {result.zones.map((zone:any,i:number)=><div key={i} title={'BIN '+zone.binX+','+zone.binY+' · N_eff '+zone.nEffMean.toFixed(3)} className={'aspect-square rounded-sm '+(i===result.selectedZone.row?'bg-amber-300 ring-2 ring-amber-100':'bg-cyan-500/50')} />)}
              </div>
            </div>
            <div className="text-[10px] text-slate-500">Provenance: {result.source}. {result.calibrationHistory?.join(' · ')}</div>
          </div>
        </div>
      )}

      {mode === 'hips' && result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['HEALPix order',result.hipsOrder],['Tile pixel',result.healpixPixel],['Tile coordinate',result.pixel.x+', '+result.pixel.y],['Spectral layers',result.spectrum.length],
            ].map(([label,value])=><div key={label} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div><div className="mt-1 text-sm font-semibold text-white">{value}</div></div>)}
          </div>
          <div className="rounded-xl border border-slate-800 bg-black/40 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono uppercase text-slate-400"><span>Extracted spectrum · 0.75–5.00 µm</span><button onClick={downloadCsv} className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-100"><Download className="h-3 w-3" /> Export CSV</button></div>
            <canvas ref={canvasRef} className="w-full" style={{height:240}} />
            <div className="mt-3 flex items-center gap-3">
              <label className="text-[10px] font-mono text-slate-400">Layer {selectedLayer}</label>
              <input type="range" min="0" max="101" value={selectedLayer} onChange={e=>setSelectedLayer(Number(e.target.value))} className="min-w-0 flex-1 accent-cyan-400" />
              <span className="text-[10px] font-mono text-cyan-300">{selected?.wavelengthMicrons?.toFixed(3)} µm</span>
            </div>
            <div className="mt-2 text-xs text-slate-300">{selected?.blank ? 'Documented blank dichroic layer — excluded from the extracted spectrum.' : selected?.fluxMilliJansky == null ? 'No valid aperture measurement at this layer.' : 'Background-subtracted aperture flux: '+selected.fluxMilliJansky.toFixed(5)+' mJy'}</div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-800 p-3 text-xs"><div className="text-slate-500">Aperture / annulus</div><div className="mt-1 text-white">{result.aperture.radiusPixels}px / {result.aperture.annulusInnerPixels}–{result.aperture.annulusOuterPixels}px</div></div>
            <div className="rounded-lg border border-slate-800 p-3 text-xs"><div className="text-slate-500">Cube FITS</div><a className="mt-1 block break-all text-cyan-300 underline" href={result.cubeUrl} target="_blank" rel="noreferrer">Open source tile</a></div>
            <div className="rounded-lg border border-slate-800 p-3 text-xs"><div className="text-slate-500">Wavelength range</div><div className="mt-1 text-white">{result.wavelengthRangeMicrons[0]}–{result.wavelengthRangeMicrons[1]} µm</div></div>
          </div>
          {mode === 'hips' && (
            <div role="note" className="rounded-lg border border-amber-500/30 bg-amber-950/25 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
              <strong>Quick-look spectrum — visualization only.</strong> This aperture extraction is not a science-grade SPHEREx spectrum. Use the IRSA Spectrophotometry Tool for scientific photometry. Non-zero flags are reported but not masked in this preview.
            </div>
          )}
          <ul className="space-y-1 text-[10px] leading-relaxed text-slate-500">{result.notes.map((note:string,i:number)=><li key={i}>• {note}</li>)}</ul>
        </div>
      )}
    </section>
  );
};
