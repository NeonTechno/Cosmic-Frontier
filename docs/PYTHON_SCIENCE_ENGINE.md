# Python scientific research engine

This package provides an offline-testable, provenance-first scientific workflow alongside the existing TypeScript web application. Python is used for numerical analysis and FITS handling; the web app remains the presentation and interactive research workbench.

## Capabilities

| Workflow | Retrieval / input | Output |
|---|---|---|
| SPHEREx archive discovery | NASA/IPAC IRSA SIAv2 CSV, DR1/QR3 wide and deep collections | Observation metadata, query parameters, response hashes, original product URLs |
| Gaia cross-match input | ESA Gaia DR3 TAP cone search | Source astrometry, photometry, query and response hash |
| Distant TNO catalogue | IAU Minor Planet Center `distant_extended.json.gz` | Raw catalogue snapshot plus filtered bound eTNO orbital records |
| ETNO statistics | Retrieved MPC eTNO JSON | Seeded Monte Carlo longitude-of-perihelion and orbital-pole null diagnostics |
| FITS image diagnostics | Locally downloaded FITS image | Header/WCS availability, invalid-pixel count, robust background/noise and aperture-sum diagnostics |

## Install

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements-science.txt
```

The existing SPHEREx local indexer remains available through `requirements-spherex.txt`; the science requirements include Astropy as well as NumPy.

## Collect real archive data

SPHEREx metadata around a sky position:

```bash
python -m science.pipeline collect-spherex --ra 60.8109955 --dec 51.3404038 --radius 0.03
```

Gaia DR3 sources around the same position:

```bash
python -m science.pipeline collect-gaia --ra 60.8109955 --dec 51.3404038 --radius-arcmin 4
```

MPC distant-object catalogue:

```bash
python -m science.pipeline collect-mpc
```

Collectors write under `data/science/` by default. Raw source payloads and processed JSON are kept separately. Each retrieved payload receives a SHA-256 hash and UTC retrieval timestamp. The SPHEREx collector retrieves SIAv2 metadata only; it does not claim that metadata is an image measurement.\n\nDownload a selected official IRSA product using its `accessUrl` from the SPHEREx JSON result:\n\n```bash\npython -m science.fits_download \\\n  --url 'PASTE_IRSA_ACCESS_URL_HERE' \\\n  --ra 60.8109955 --dec 51.3404038 --size 64 \\\n  --out data/spherex/incoming/dr1/target_cutout.fits\n```\n\nThe downloader only accepts HTTPS IRSA product URLs, adds the coordinate cutout parameters, enforces a 100 MB response limit, checks the FITS signature (including gzip products), and writes a SHA-256 sidecar manifest. It rejects HTML/error pages rather than saving them as FITS.

## Run analyses

After collecting MPC data:

```bash
python -m science.pipeline analyze-etnos \
  --input data/science/processed/mpc_etnos.json \
  --simulations 20000 --seed 20261116
```

Run a diagnostic aperture/background analysis on a locally downloaded FITS image:

```bash
python -m science.pipeline analyze-fits \
  --file data/spherex/incoming/dr1/your_product.fits \
  --ra 60.8109955 --dec 51.3404038
```

FITS analysis is deliberately described as a diagnostic aperture sum, not calibrated photometry. It does not convert units, validate the SPHEREx FLAGS bit policy, or provide complete propagated uncertainties. Inspect the product's IMAGE, VARIANCE and FLAGS extensions and use the official IRSA science tools for science-grade spectra.

## Tests

```bash
python -m unittest discover -s tests_science -v
```

Tests use small deterministic fixtures and do not need network access or real NASA data.

## Scientific integrity rules

- Missing orbital elements, epochs, coordinates, uncertainties and calibration metadata remain missing. The pipeline does not invent them.
- MPC discovery catalogues are observationally selected. The included angular tests compare against simple uniform-longitude and isotropic-pole nulls only.
- The reported Monte Carlo p-values are not posterior probabilities that Planet X exists. No survey pointings, limiting magnitudes, cadence, tracking efficiency, or discovery efficiency are modelled.
- The Planet X output must continue to say **selection effects not modelled** until a characterized survey simulator and matched forward model are independently validated.
- SPHEREx SIAv2 metadata is not a FITS image. A source product must be downloaded, parsed and traced to its archive URL before pixel analysis.
- Synthetic demo records must never be mixed into archive-derived data files.

## Next integration milestones

1. Add a typed Node-to-Python worker/API boundary with job IDs and bounded input/output sizes.
2. Add a validated FITS product downloader with per-product checksum, file-size cap, retry policy and persistent object storage.
3. Add SPHEREx variance-aware aperture/PSF photometry only after detector calibration and quality-flag semantics are verified against IRSA reference products.
4. Integrate OSSOS or another fully characterized survey simulator only after pinning its source version, licensing review, and independent validation.
5. Expose analysis provenance, assumptions and downloadable manifests in the Cosmic Lab research UI.

No Python HTTP server is exposed by this milestone; the CLI can be run locally or by a controlled background worker. Do not imply that locally collected files are automatically available to the hosted Render instance.
