#!/usr/bin/env python3
"""Reproducible research data retrieval and analysis for Black Star Orbit.

All archive-derived records retain source URLs, retrieval timestamps and SHA-256
hashes. This module never fabricates observations or fills missing orbital data.
"""
from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import io
import json
import math
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np

MPC_URL = "https://minorplanetcenter.net/Extended_Files/distant_extended.json.gz"
IRSA_SIA_URL = "https://irsa.ipac.caltech.edu/SIA"
GAIA_TAP_URL = "https://gea.esac.esa.int/tap-server/tap/sync"
ALLOWED_ARCHIVE_HOSTS = {"irsa.ipac.caltech.edu", "minorplanetcenter.net", "www.minorplanetcenter.net", "gea.esac.esa.int"}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    temporary.replace(path)


def fetch_url(url: str, timeout: int = 45, max_bytes: int = 250 * 1024 * 1024) -> tuple[bytes, dict[str, str]]:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_ARCHIVE_HOSTS:
        raise ValueError(f"Refusing non-HTTPS or non-allowlisted archive URL: {url}")
    request = urllib.request.Request(url, headers={"User-Agent": "BlackStarOrbit-Research/1.0", "Accept": "*/*"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        data = response.read(max_bytes + 1)
        if len(data) > max_bytes:
            raise ValueError(f"Response exceeded safety limit ({max_bytes} bytes)")
        return data, {k.lower(): v for k, v in response.headers.items()}


def finite_float(value: Any) -> float | None:
    try:
        number = float(value)
        return number if math.isfinite(number) else None
    except (TypeError, ValueError):
        return None


def mpc_rows(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [r for r in payload if isinstance(r, dict)]
    if isinstance(payload, dict):
        for key in ("data", "objects", "results"):
            if isinstance(payload.get(key), list):
                return [r for r in payload[key] if isinstance(r, dict)]
    raise ValueError("MPC response did not contain a recognized object-record array")


def normalize_etnos(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Select bound extreme TNOs without inventing absent orbital fields."""
    output = []
    for row in rows:
        a = finite_float(row.get("a"))
        e = finite_float(row.get("e"))
        q = finite_float(row.get("Perihelion_dist"))
        inc = finite_float(row.get("i"))
        node = finite_float(row.get("Node"))
        arg_peri = finite_float(row.get("Peri"))
        if None in (a, e, q, inc, node, arg_peri):
            continue
        if not (a > 150 and q > 30 and 0 <= e < 1):
            continue
        designation = str(row.get("Principal_desig") or row.get("Number") or row.get("Name") or "unidentified")
        output.append({
            "designation": designation,
            "name": str(row.get("Name") or designation),
            "semiMajorAxisAU": a,
            "eccentricity": e,
            "perihelionDistanceAU": q,
            "inclinationDeg": inc,
            "longitudeAscendingNodeDeg": node % 360,
            "argumentPerihelionDeg": arg_peri % 360,
            "longitudePerihelionDeg": (node + arg_peri) % 360,
            "orbitEpochJD": finite_float(row.get("Epoch")),
            "lastObserved": row.get("Last_obs"),
            "observationCount": finite_float(row.get("Num_obs")),
            "oppositionCount": finite_float(row.get("Num_opps")),
            "source": "MPC distant_extended feed",
        })
    return sorted(output, key=lambda item: item["semiMajorAxisAU"], reverse=True)


def collect_mpc(output_dir: Path) -> dict[str, Any]:
    raw, headers = fetch_url(MPC_URL)
    decoded = gzip.decompress(raw) if raw[:2] == b"\x1f\x8b" else raw
    payload = json.loads(decoded.decode("utf-8"))
    rows = mpc_rows(payload)
    etnos = normalize_etnos(rows)
    if not rows:
        raise ValueError("MPC returned an empty catalogue; existing local data must not be overwritten")
    raw_path = output_dir / "raw" / "mpc_distant_extended.json"
    raw_path.parent.mkdir(parents=True, exist_ok=True)
    raw_path.write_bytes(decoded)
    result = {
        "schemaVersion": 1,
        "dataset": "MPC distant extended objects",
        "sourceUrl": MPC_URL,
        "retrievedAtUTC": utc_now(),
        "httpLastModified": headers.get("last-modified"),
        "rawFile": str(raw_path),
        "rawSha256": sha256_bytes(decoded),
        "sourceRecordCount": len(rows),
        "selectedEtnoCount": len(etnos),
        "selection": {"aAU": ">150", "qAU": ">30", "boundOrbit": "0<=e<1"},
        "records": etnos,
        "scientificCaveat": "Discovery catalogues are observationally selected; this is not a debiased parent population and is not evidence of Planet X.",
    }
    write_json(output_dir / "processed" / "mpc_etnos.json", result)
    return result


def collect_spherex(ra: float, dec: float, radius: float, output_dir: Path, collections: list[str]) -> dict[str, Any]:
    if not (0 <= ra < 360 and -90 <= dec <= 90 and 0 < radius <= 1):
        raise ValueError("Require 0<=RA<360, -90<=Dec<=90 and 0<radius<=1 degree")
    rows: list[dict[str, Any]] = []
    raw_responses = []
    for collection in collections:
        params = urllib.parse.urlencode({
            "COLLECTION": collection,
            "POS": f"CIRCLE {ra:.7f} {dec:.7f} {radius:.6f}",
            "RESPONSEFORMAT": "CSV",
            "MAXREC": "5000",
        })
        body, _ = fetch_url(f"{IRSA_SIA_URL}?{params}", timeout=30, max_bytes=25 * 1024 * 1024)
        raw_text = body.decode("utf-8", errors="replace")
        raw_responses.append({"collection": collection, "sha256": sha256_bytes(body), "body": raw_text})
        if raw_text.lstrip().startswith("<?xml") or "<VOTABLE" in raw_text[:500].upper():
            raise ValueError(f"{collection}: IRSA returned VOTable XML; this collector currently expects CSV and will not silently misparse it")
        for row in csv.DictReader(io.StringIO(raw_text)):
            if (row.get("dataproduct_type") or "").lower() != "image" or not row.get("access_url"):
                continue
            rows.append({
                "obsId": row.get("obs_id"),
                "collection": row.get("obs_collection") or collection,
                "bandpass": row.get("energy_bandpassname"),
                "raDeg": finite_float(row.get("s_ra")),
                "decDeg": finite_float(row.get("s_dec")),
                "startMJD": finite_float(row.get("t_min")),
                "endMJD": finite_float(row.get("t_max")),
                "wavelengthMinM": finite_float(row.get("em_min")),
                "wavelengthMaxM": finite_float(row.get("em_max")),
                "exposureSeconds": finite_float(row.get("t_exptime")),
                "accessUrl": row.get("access_url"),
                "accessFormat": row.get("access_format"),
                "source": "NASA/IPAC IRSA SIAv2",
            })
    rows.sort(key=lambda row: row["startMJD"] if row["startMJD"] is not None else float("inf"))
    result = {
        "schemaVersion": 1, "dataset": "SPHEREx SIAv2 observation metadata",
        "sourceUrl": IRSA_SIA_URL, "retrievedAtUTC": utc_now(),
        "query": {"raDeg": ra, "decDeg": dec, "radiusDeg": radius, "collections": collections},
        "responseHashes": [{"collection": item["collection"], "sha256": item["sha256"]} for item in raw_responses],
        "observationCount": len(rows), "records": rows,
        "scientificCaveat": "SIAv2 metadata records are not pixel measurements. Download and validate the referenced FITS product before performing image analysis.",
    }
    write_json(output_dir / "processed" / f"spherex_{ra:.5f}_{dec:.5f}.json", result)
    raw_dir = output_dir / "raw" / "spherex"
    raw_dir.mkdir(parents=True, exist_ok=True)
    for item in raw_responses:
        (raw_dir / f"{item['collection']}_{item['sha256'][:12]}.csv").write_text(item["body"], encoding="utf-8")
    return result


def collect_gaia(ra: float, dec: float, radius_arcmin: float, output_dir: Path, limit: int = 500) -> dict[str, Any]:
    if not (0 <= ra < 360 and -90 <= dec <= 90 and 0 < radius_arcmin <= 30):
        raise ValueError("Invalid Gaia cone-search coordinates or radius")
    adql = (
        f"SELECT TOP {int(limit)} source_id,ra,dec,pmra,pmdec,parallax,phot_g_mean_mag,bp_rp,ruwe "
        "FROM gaiadr3.gaia_source "
        f"WHERE 1=CONTAINS(POINT('ICRS',ra,dec),CIRCLE('ICRS',{ra:.8f},{dec:.8f},{radius_arcmin/60:.8f}))"
    )
    params = urllib.parse.urlencode({"REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "json", "QUERY": adql})
    body, _ = fetch_url(f"{GAIA_TAP_URL}?{params}", timeout=60, max_bytes=50 * 1024 * 1024)
    payload = json.loads(body.decode("utf-8"))
    fields = [item.get("name") for item in payload.get("metadata", [])]
    records = [dict(zip(fields, row)) for row in payload.get("data", [])]
    result = {
        "schemaVersion": 1, "dataset": "Gaia DR3 cone search", "sourceUrl": GAIA_TAP_URL,
        "retrievedAtUTC": utc_now(), "query": {"raDeg": ra, "decDeg": dec, "radiusArcmin": radius_arcmin, "adql": adql},
        "rawSha256": sha256_bytes(body), "recordCount": len(records), "records": records,
        "scientificCaveat": "Gaia DR3 astrometry has source-specific uncertainties and quality considerations; propagate uncertainties before scientific inference.",
    }
    write_json(output_dir / "processed" / f"gaia_dr3_{ra:.5f}_{dec:.5f}.json", result)
    return result


def rayleigh_statistic(angles_deg: np.ndarray) -> float:
    if angles_deg.size == 0:
        return float("nan")
    radians = np.deg2rad(angles_deg)
    return float(np.hypot(np.cos(radians).mean(), np.sin(radians).mean()))


def orbital_pole_concentration(inclination_deg: np.ndarray, node_deg: np.ndarray) -> float:
    """Length of mean unit orbital-pole vector; 0 is diffuse, 1 is aligned."""
    inc = np.deg2rad(inclination_deg)
    node = np.deg2rad(node_deg)
    vectors = np.column_stack((np.sin(inc) * np.sin(node), -np.sin(inc) * np.cos(node), np.cos(inc)))
    return float(np.linalg.norm(vectors.mean(axis=0)))


def analyze_etnos(dataset: dict[str, Any], simulations: int = 20000, seed: int = 20261116) -> dict[str, Any]:
    records = dataset.get("records", [])
    usable = [r for r in records if all(finite_float(r.get(k)) is not None for k in (
        "longitudePerihelionDeg", "inclinationDeg", "longitudeAscendingNodeDeg"
    ))]
    if len(usable) < 4:
        raise ValueError(f"At least four ETNOs with all required angular elements are needed; found {len(usable)}")
    varpi = np.array([r["longitudePerihelionDeg"] for r in usable], dtype=float)
    inc = np.array([r["inclinationDeg"] for r in usable], dtype=float)
    node = np.array([r["longitudeAscendingNodeDeg"] for r in usable], dtype=float)
    if np.any((inc < 0) | (inc > 180)):
        raise ValueError("Inclinations must lie in [0,180] degrees")
    observed_varpi = rayleigh_statistic(varpi)
    observed_poles = orbital_pole_concentration(inc, node)
    rng = np.random.default_rng(seed)
    n = len(usable)
    exceed_varpi = 0
    exceed_poles = 0
    batch = min(2000, simulations)
    remaining = simulations
    while remaining:
        count = min(batch, remaining)
        random_varpi = rng.uniform(0, 360, size=(count, n))
        null_varpi = np.hypot(np.cos(np.deg2rad(random_varpi)).mean(axis=1), np.sin(np.deg2rad(random_varpi)).mean(axis=1))
        if np.count_nonzero(null_varpi >= observed_varpi):
            exceed_varpi += int(np.count_nonzero(null_varpi >= observed_varpi))
        # Isotropic orbital poles: cos(i) uniform on [-1,1], node uniform [0,360).
        cos_i = rng.uniform(-1, 1, size=(count, n))
        random_i = np.arccos(cos_i)
        random_node = np.deg2rad(rng.uniform(0, 360, size=(count, n)))
        vx = np.sin(random_i) * np.sin(random_node)
        vy = -np.sin(random_i) * np.cos(random_node)
        vz = cos_i
        null_poles = np.sqrt(vx.mean(axis=1)**2 + vy.mean(axis=1)**2 + vz.mean(axis=1)**2)
        exceed_poles += int(np.count_nonzero(null_poles >= observed_poles))
        remaining -= count
    return {
        "schemaVersion": 1, "analysis": "Exploratory ETNO angular concentration diagnostics",
        "createdAtUTC": utc_now(), "sourceDataset": dataset.get("dataset"),
        "sourceSha256": dataset.get("rawSha256"), "sampleSize": n,
        "method": {"simulations": simulations, "seed": seed, "pValueEstimator": "(exceedances+1)/(simulations+1)"},
        "longitudePerihelion": {
            "statistic": "mean resultant length (Rayleigh R)", "observedR": observed_varpi,
            "null": "independent uniform longitudes", "exceedances": exceed_varpi,
            "monteCarloPValue": (exceed_varpi + 1) / (simulations + 1),
        },
        "orbitalPole": {
            "statistic": "length of mean unit orbital-pole vector", "observedConcentration": observed_poles,
            "null": "independent isotropic pole directions (uniform node, uniform cos(inclination))",
            "exceedances": exceed_poles, "monteCarloPValue": (exceed_poles + 1) / (simulations + 1),
        },
        "limitations": [
            "Exploratory uncorrected diagnostics only; no survey pointings, depth, cadence, tracking or discovery efficiency are modelled.",
            "The MPC discovery catalogue is not an unbiased sample of the intrinsic trans-Neptunian population.",
            "Orbital elements are not propagated to a common epoch and element covariance is not sampled.",
            "Monte Carlo p-values are not posterior probabilities that Planet X exists and do not establish a detection.",
            "A characterized survey simulator and matched forward model are required before selection-corrected claims.",
        ],
    }


def analyze_fits(path: Path, ra: float | None, dec: float | None, aperture: float, inner: float, outer: float) -> dict[str, Any]:
    try:
        from astropy.io import fits
        from astropy.wcs import WCS
    except ImportError as exc:
        raise RuntimeError("Install requirements-science.txt to analyze FITS products") from exc
    from astropy.stats import mad_std
    with fits.open(path, memmap=False) as hdus:
        image_hdu = next((h for h in hdus if getattr(h, "data", None) is not None and np.ndim(h.data) == 2 and str(h.header.get("EXTNAME", "")).upper() in ("IMAGE", "")), None)
        if image_hdu is None:
            image_hdu = next((h for h in hdus if getattr(h, "data", None) is not None and np.ndim(h.data) == 2), None)
        if image_hdu is None:
            raise ValueError("No 2-D image HDU found")
        data = np.asarray(image_hdu.data, dtype=float)
        valid = np.isfinite(data)
        if not np.any(valid):
            raise ValueError("Image contains no finite pixels")
        wcs = WCS(image_hdu.header).celestial
        if ra is not None and dec is not None:
            if not wcs.has_celestial:
                raise ValueError("Cannot perform coordinate-centred photometry: image has no celestial WCS")
            x0, y0 = wcs.world_to_pixel_values(ra, dec)
        else:
            x0, y0 = (data.shape[1] - 1) / 2, (data.shape[0] - 1) / 2
        yy, xx = np.indices(data.shape)
        radius = np.hypot(xx - x0, yy - y0)
        ap_mask = (radius <= aperture) & valid
        ann_mask = (radius >= inner) & (radius <= outer) & valid
        if ap_mask.sum() < 1 or ann_mask.sum() < 10:
            raise ValueError("Insufficient valid aperture or annulus pixels")
        background_values = data[ann_mask]
        background = float(np.median(background_values))
        noise_sigma = float(mad_std(background_values, ignore_nan=True))
        flux = float(np.sum(data[ap_mask] - background))
        result = {
            "schemaVersion": 1, "analysis": "FITS image quality and aperture diagnostic",
            "createdAtUTC": utc_now(), "file": str(path), "fileSha256": sha256_bytes(path.read_bytes()),
            "source": "FITS header provenance; verify archive association independently",
            "hdu": image_hdu.name, "shape": list(data.shape), "bitpix": image_hdu.header.get("BITPIX"),
            "wcsPresent": bool(wcs.has_celestial), "targetPixel": {"x": float(x0), "y": float(y0)},
            "finitePixelCount": int(valid.sum()), "invalidPixelCount": int((~valid).sum()),
            "imageMedian": float(np.median(data[valid])), "imageMADStd": float(mad_std(data[valid])),
            "backgroundMedian": background, "backgroundMADStd": noise_sigma,
            "aperture": {"radiusPixels": aperture, "innerAnnulusPixels": inner, "outerAnnulusPixels": outer,
                         "validPixels": int(ap_mask.sum()), "backgroundPixels": int(ann_mask.sum()), "backgroundSubtractedSum": flux},
            "limitations": ["Diagnostic aperture sum only; no calibrated flux unit conversion or complete uncertainty propagation is performed.",
                            "Mask/quality-bit semantics are not inferred. Inspect FLAGS and VARIANCE HDUs before interpreting science measurements.",
                            "This result is not a source detection or astrophysical classification."],
        }
        return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    mpc = sub.add_parser("collect-mpc"); mpc.add_argument("--out", type=Path, default=Path("data/science"))
    sx = sub.add_parser("collect-spherex")
    sx.add_argument("--ra", type=float, required=True); sx.add_argument("--dec", type=float, required=True)
    sx.add_argument("--radius", type=float, default=0.03); sx.add_argument("--out", type=Path, default=Path("data/science"))
    sx.add_argument("--collections", nargs="+", default=["spherex_dr1", "spherex_dr1_deep", "spherex_qr3", "spherex_qr3_deep"])
    gaia = sub.add_parser("collect-gaia")
    gaia.add_argument("--ra", type=float, required=True); gaia.add_argument("--dec", type=float, required=True)
    gaia.add_argument("--radius-arcmin", type=float, default=4); gaia.add_argument("--out", type=Path, default=Path("data/science"))
    etno = sub.add_parser("analyze-etnos"); etno.add_argument("--input", type=Path, default=Path("data/science/processed/mpc_etnos.json"))
    etno.add_argument("--simulations", type=int, default=20000); etno.add_argument("--seed", type=int, default=20261116)
    etno.add_argument("--out", type=Path, default=Path("data/science/analysis/etno_statistics.json"))
    fits_cmd = sub.add_parser("analyze-fits"); fits_cmd.add_argument("--file", type=Path, required=True)
    fits_cmd.add_argument("--ra", type=float); fits_cmd.add_argument("--dec", type=float)
    fits_cmd.add_argument("--aperture", type=float, default=5); fits_cmd.add_argument("--annulus-inner", type=float, default=12)
    fits_cmd.add_argument("--annulus-outer", type=float, default=20); fits_cmd.add_argument("--out", type=Path, default=Path("data/science/analysis/fits_diagnostic.json"))
    args = parser.parse_args(argv)
    try:
        if args.command == "collect-mpc":
            result = collect_mpc(args.out); print(f"Retrieved {result['sourceRecordCount']} MPC rows; selected {result['selectedEtnoCount']} eTNOs.")
        elif args.command == "collect-spherex":
            result = collect_spherex(args.ra, args.dec, args.radius, args.out, args.collections); print(f"Retrieved {result['observationCount']} SPHEREx metadata rows.")
        elif args.command == "collect-gaia":
            result = collect_gaia(args.ra, args.dec, args.radius_arcmin, args.out); print(f"Retrieved {result['recordCount']} Gaia DR3 sources.")
        elif args.command == "analyze-etnos":
            dataset = json.loads(args.input.read_text(encoding="utf-8"))
            result = analyze_etnos(dataset, args.simulations, args.seed); write_json(args.out, result)
            print(json.dumps({"sampleSize": result["sampleSize"], "varpiP": result["longitudePerihelion"]["monteCarloPValue"],
                              "poleP": result["orbitalPole"]["monteCarloPValue"], "output": str(args.out)}, indent=2))
        else:
            result = analyze_fits(args.file, args.ra, args.dec, args.aperture, args.annulus_inner, args.annulus_outer)
            write_json(args.out, result); print(f"Saved FITS diagnostic to {args.out}")
        return 0
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
