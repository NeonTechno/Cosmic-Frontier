#!/usr/bin/env python3
"""Index genuine NASA/IPAC IRSA SPHEREx FITS files; never generate observations."""
from __future__ import annotations
import argparse, hashlib, json, re, sys
from datetime import datetime, timezone
from pathlib import Path

SOURCE_URL = "https://irsa.ipac.caltech.edu/ibe/data/spherex/"

def sha256_file(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""): h.update(chunk)
    return h.hexdigest()

def value(header,*keys):
    for key in keys:
        v=header.get(key)
        if v not in (None,""): return v
    return None

def number(v):
    try:
        n=float(v)
        return n if n==n and abs(n)!=float("inf") else None
    except (TypeError,ValueError): return None

def infer_release(path,forced):
    if forced: return forced
    for part in path.parts:
        m=re.search(r"(?i)(?:^|[^a-z0-9])(dr1|qr3|qr2)(?:[^a-z0-9]|$)",part)
        if m: return m.group(1).lower()
    return "unknown"

def index_one(path,root,forced,fits):
    with fits.open(path,memmap=False,lazy_load_hdus=True) as hdus:
        primary=hdus[0].header.copy()
        image=next((h for h in hdus if str(h.header.get("EXTNAME","")).strip().upper()=="IMAGE" and h.data is not None),None)
        if image is None: image=next((h for h in hdus if h.data is not None and getattr(h.data,"ndim",0)>=2),None)
        if image is None: raise ValueError("no image HDU found")
        header=primary.copy(); header.extend(image.header,update=True)
        ra,dec=number(value(header,"CRVAL1")),number(value(header,"CRVAL2"))
        if ra is None or dec is None or not -90<=dec<=90: raise ValueError("no valid CRVAL1/CRVAL2 sky coordinates")
        mjd=number(value(header,"MJD-OBS","MJD_OBS"))
        from astropy.time import Time
        date=value(header,"DATE-OBS","DATE_OBS")
        if mjd is None and date:
            try: mjd=float(Time(date,scale="utc").mjd)
            except Exception: mjd=None
        if mjd is None: raise ValueError("no valid MJD-OBS or DATE-OBS; refusing to invent an epoch")
        date_obs=Time(mjd,format="mjd",scale="utc").isot+"Z"
        detector_raw=value(header,"DETECTOR","DET_ID")
        dm=re.search(r"(?i)D([1-6])",str(detector_raw or "")+" "+path.name)
        if not dm: raise ValueError("detector could not be identified")
        detector=int(dm.group(1)); release=infer_release(path.relative_to(root),forced)
        if release not in ("dr1","qr3","qr2"): raise ValueError("unknown release; use incoming/dr1 or incoming/qr3")
        relative=path.resolve().relative_to(root.resolve()).as_posix()
        obs=str(value(header,"OBSID","OBS_ID","OBS_ID1") or path.stem)
        return {
          "id":f"{release}-{obs}-D{detector}","release":release,"observationId":obs,
          "detector":detector,"bandpassName":f"SPHEREx-D{detector}","raDeg":ra%360,"decDeg":dec,
          "mjdObs":mjd,"dateObs":date_obs,"exposureTimeSec":number(value(header,"EXPTIME","TEXPTIME")),
          "emMinMicrons":number(value(header,"EM_MIN","EMMIN","WAVELMIN")),
          "emMaxMicrons":number(value(header,"EM_MAX","EMMAX","WAVELMAX")),
          "file":relative,"fileSizeBytes":path.stat().st_size,"sha256":sha256_file(path),
          "source":"NASA/IPAC IRSA SPHEREx archive; locally downloaded FITS product",
          "sourceUrl":SOURCE_URL,"indexedAtUTC":datetime.now(timezone.utc).isoformat(),
          "imageShape":list(image.data.shape)
        }

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--input",default="data/spherex/incoming")
    ap.add_argument("--root",default="data/spherex")
    ap.add_argument("--output",default="data/spherex/manifest.json")
    ap.add_argument("--release",choices=["dr1","qr3","qr2"])
    args=ap.parse_args(); root=Path(args.root).expanduser().resolve(); source=Path(args.input).expanduser().resolve(); output=Path(args.output).expanduser().resolve()
    if not source.is_dir(): print(f"Input folder not found: {source}",file=sys.stderr); return 2
    try:
        from astropy.io import fits
    except ImportError:
        print("Install Astropy: python3 -m pip install -r requirements-spherex.txt",file=sys.stderr); return 2
    candidates=sorted(p for p in source.rglob("*") if p.is_file() and (p.name.lower().endswith(".fits") or p.name.lower().endswith(".fits.gz")))
    if not candidates: print(f"No FITS files found under {source}",file=sys.stderr); return 2
    records=[]; rejected=[]
    for p in candidates:
        try: records.append(index_one(p,root,args.release,fits))
        except Exception as e: rejected.append({"file":str(p),"reason":str(e)})
    records.sort(key=lambda r:(r["mjdObs"],r["bandpassName"],r["id"]))
    manifest={"schemaVersion":1,"source":"NASA/IPAC IRSA SPHEREx archive","generatedAtUTC":datetime.now(timezone.utc).isoformat(),"datasetRoot":".","recordCount":len(records),"records":records,"rejectedFiles":rejected}
    if not records: print(json.dumps({"indexed":0,"rejected":rejected},indent=2),file=sys.stderr); return 2
    output.parent.mkdir(parents=True,exist_ok=True); tmp=output.with_suffix(output.suffix+".tmp")
    tmp.write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8"); tmp.replace(output)
    print(json.dumps({"manifest":str(output),"indexed":len(records),"rejected":len(rejected),"releases":sorted({r["release"] for r in records}),"bands":sorted({r["bandpassName"] for r in records})},indent=2))
    return 0

if __name__=="__main__": raise SystemExit(main())
