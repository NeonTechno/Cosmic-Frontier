"""Download and verify an official IRSA SPHEREx FITS cutout from an SIAv2 access_url."""
from __future__ import annotations

import argparse
import gzip
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from science.pipeline import ALLOWED_ARCHIVE_HOSTS, fetch_url, sha256_bytes, write_json


def build_cutout_url(access_url: str, ra: float, dec: float, size_pixels: int) -> str:
    parsed = urlparse(access_url)
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_ARCHIVE_HOSTS or parsed.hostname != "irsa.ipac.caltech.edu":
        raise ValueError("Only HTTPS product URLs hosted by irsa.ipac.caltech.edu are accepted")
    if not (0 <= ra < 360 and -90 <= dec <= 90 and 1 <= size_pixels <= 256):
        raise ValueError("Invalid ICRS coordinates or cutout size (1–256 pixels)")
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query.update({"center": f"{ra:.7f},{dec:.7f}", "size": f"{size_pixels}pix"})
    return urlunparse(parsed._replace(query=urlencode(query)))


def download_fits(access_url: str, ra: float, dec: float, size_pixels: int, output: Path) -> dict:
    url = build_cutout_url(access_url, ra, dec, size_pixels)
    payload, headers = fetch_url(url, timeout=60, max_bytes=100 * 1024 * 1024)
    is_gzip = payload[:2] == b"\x1f\x8b"
    try:
        uncompressed = gzip.decompress(payload) if is_gzip else payload
    except OSError as exc:
        raise ValueError("IRSA response has a gzip signature but cannot be decompressed") from exc
    if not uncompressed.startswith(b"SIMPLE  ="):
        raise ValueError("IRSA response is not a primary FITS file; refusing to save HTML/error content as science data")
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".tmp")
    temporary.write_bytes(payload)
    temporary.replace(output)
    return {
        "schemaVersion": 1,
        "source": "NASA/IPAC IRSA SPHEREx SIAv2 product",
        "sourceProductUrl": access_url,
        "downloadUrl": url,
        "retrievedAtUTC": datetime.now(timezone.utc).isoformat(),
        "httpLastModified": headers.get("last-modified"),
        "target": {"raDeg": ra, "decDeg": dec},
        "cutoutSizePixels": size_pixels,
        "file": str(output),
        "fileSizeBytes": len(payload),
        "isGzip": is_gzip,
        "sha256": sha256_bytes(payload),
        "fitsSignatureValidated": True,
        "note": "FITS signature verified. Inspect FITS headers, IMAGE, VARIANCE and FLAGS extensions before scientific interpretation.",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True, help="access_url copied from a retrieved IRSA SIAv2 record")
    parser.add_argument("--ra", type=float, required=True)
    parser.add_argument("--dec", type=float, required=True)
    parser.add_argument("--size", type=int, default=64)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        manifest = download_fits(args.url, args.ra, args.dec, args.size, args.out)
        write_json(args.out.with_suffix(args.out.suffix + ".manifest.json"), manifest)
        print(json.dumps(manifest, indent=2))
        return 0
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
