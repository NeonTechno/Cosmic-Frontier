import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Database, Loader2, RefreshCw } from 'lucide-react';

interface MpcObject {
  id:string; name:string; mpcDesignation?:string; semiMajorAxisAU:number; perihelionDistAU:number;
  aphelionDistAU:number; eccentricity:number; inclinationDeg:number; longAscNodeDeg:number;
  argPerihelionDeg:number; longPerihelionDeg:number; orbitalPeriodYears:number;
  lastObserved?:string|null; observationCount?:number|null; oppositionCount?:number|null;
  orbitEpochJD?:number|null; clusteringStatus?:string;
}
interface Feed {
  source:string; feedUrl:string; fetchedAt:string; lastModified:string|null;
  sourceRecordCount:number; etnoCount:number; objects:MpcObject[];
  filter:{semiMajorAxisAU:string;perihelionDistanceAU:string;boundOrbitsOnly:boolean};
  attribution:string;
}
export const MpcCatalogPanel:React.FC=()=>{
  const [feed,setFeed]=useState<Feed|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [minA,setMinA]=useState('150');
  const [minQ,setMinQ]=useState('30');
  const [query,setQuery]=useState('');
  const [showAll,setShowAll]=useState(false);
  const load=async(refresh=false)=>{
    setLoading(true);setError(null);
    try{
      const response=await fetch('/api/planetx/mpc-etnos'+(refresh?'?refresh=1':''));
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error||'MPC catalogue request failed.');
      setFeed(payload);
    }catch(err){setError(err instanceof Error?err.message:'MPC feed unavailable.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{void load(false);},[]);
  const filtered=useMemo(()=>{
    if(!feed)return[];
    const a=Number(minA)||0,q=Number(minQ)||0,term=query.trim().toLowerCase();
    return feed.objects.filter(o=>o.semiMajorAxisAU>=a&&o.perihelionDistAU>=q&&(!term||o.name.toLowerCase().includes(term)||o.id.toLowerCase().includes(term)||o.mpcDesignation?.toLowerCase().includes(term)));
  },[feed,minA,minQ,query]);
  const shown=showAll?filtered:filtered.slice(0,100);
  return <section className="space-y-4 rounded-2xl border border-indigo-500/20 bg-slate-950/70 p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-indigo-300"><Database className="h-3.5 w-3.5"/> Official orbit catalogue · Live ingestion</div>
        <h3 className="mt-2 text-lg font-bold text-white">Minor Planet Center — Distant Objects</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">Fetches the MPC distant_extended.json.gz feed and selects bound extreme trans-Neptunian objects using a &gt; 150 AU and q &gt; 30 AU. Orbital elements are the MPC's published osculating elements; no Planet X membership is inferred.</p>
      </div>
      <button onClick={()=>void load(true)} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-3 py-2 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/25 disabled:opacity-50">{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<RefreshCw className="h-4 w-4"/>}Refresh MPC feed</button>
    </div>
    {error&&<div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/><div>{error}<p className="mt-1 text-[10px] text-amber-300/70">The last successful catalogue, if any, is not silently replaced with fabricated records.</p></div></div>}
    {loading&&!feed&&<div className="flex items-center justify-center gap-2 p-10 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin"/>Downloading and parsing official MPC feed…</div>}
    {feed&&<>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['MPC source records',feed.sourceRecordCount.toLocaleString()],
          ['Qualifying eTNOs',feed.etnoCount.toLocaleString()],
          ['Fetched at',new Date(feed.fetchedAt).toLocaleString()],
          ['Source update',feed.lastModified?new Date(feed.lastModified).toLocaleString():'Not supplied'],
        ].map(([k,v])=><div key={k} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"><div className="text-[9px] uppercase tracking-wider text-slate-500">{k}</div><div className="mt-1 text-sm font-semibold text-white">{v}</div></div>)}
      </div>
      <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:grid-cols-3">
        <label className="text-[10px] font-mono uppercase text-slate-400">Minimum semi-major axis (AU)<input value={minA} onChange={e=>setMinA(e.target.value)} type="number" min="0" className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white"/></label>
        <label className="text-[10px] font-mono uppercase text-slate-400">Minimum perihelion (AU)<input value={minQ} onChange={e=>setMinQ(e.target.value)} type="number" min="0" className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white"/></label>
        <label className="text-[10px] font-mono uppercase text-slate-400">Find designation / name<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. Sedna" className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white"/></label>
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-400"><span>{filtered.length.toLocaleString()} objects match current filters</span><span>Showing {shown.length.toLocaleString()}</span></div>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-slate-400"><tr>{['Object / MPC designation','a (AU)','q (AU)','e','i (°)','Ω (°)','ω (°)','Last observed','Obs.'].map(x=><th key={x} className="px-3 py-3 font-semibold">{x}</th>)}</tr></thead>
          <tbody>{shown.map(o=><tr key={o.id} className="border-t border-slate-800/80 hover:bg-slate-900/60">
            <td className="px-3 py-2.5"><div className="font-semibold text-white">{o.name}</div><div className="text-[10px] text-slate-500">{o.mpcDesignation||o.id}</div></td>
            <td className="px-3 py-2.5 font-mono text-cyan-200">{o.semiMajorAxisAU.toFixed(2)}</td>
            <td className="px-3 py-2.5 font-mono text-cyan-200">{o.perihelionDistAU.toFixed(2)}</td>
            <td className="px-3 py-2.5 font-mono">{o.eccentricity.toFixed(4)}</td>
            <td className="px-3 py-2.5 font-mono">{o.inclinationDeg.toFixed(2)}</td>
            <td className="px-3 py-2.5 font-mono">{o.longAscNodeDeg.toFixed(2)}</td>
            <td className="px-3 py-2.5 font-mono">{o.argPerihelionDeg.toFixed(2)}</td>
            <td className="px-3 py-2.5 text-slate-400">{o.lastObserved||'—'}</td>
            <td className="px-3 py-2.5 text-slate-400">{o.observationCount??'—'}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {filtered.length>100&&<button onClick={()=>setShowAll(v=>!v)} className="text-xs text-cyan-300 underline underline-offset-4">{showAll?'Show first 100':'Show all '+filtered.length.toLocaleString()+' objects'}</button>}
      <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-3 text-[10px] leading-relaxed text-amber-100/80"><strong className="text-amber-200">Scientific caution:</strong> MPC orbital elements do not by themselves establish a Planet Nine signal. The catalog records are not pre-labelled as aligned or anti-aligned; the clustering field remains unassessed until a separately documented statistical analysis is run. {feed.attribution}</div>
      <a href={feed.feedUrl} target="_blank" rel="noreferrer" className="break-all text-[10px] text-cyan-300 underline">{feed.feedUrl}</a>
    </>}
  </section>;
};
