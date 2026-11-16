# Collecting and using real SPHEREx FITS data locally

Black Star Orbit does not generate substitute SPHEREx observations. The Time Machine uses live NASA/IPAC IRSA results with successfully parsed FITS pixels or products downloaded and indexed locally. The in-app benchmark mode is a separate interface-only path. Empty results and failed downloads remain empty in the archive API.

## 1. Collect a small dataset

1. Open the [IRSA SPHEREx Data Explorer](https://irsa.ipac.caltech.edu/applications/SPHEREx/).
2. Search a target. Barnard's Star is RA \`269.4521\` degrees, Dec \`+4.6934\` degrees.
3. Select available **Level-2 Spectral Image FITS** products from **DR1** and/or **QR3**.
4. Prefer small target cutouts (64–128 pixels across); do not download the full all-sky archive.
5. Select observations and use **Generate Download Script**. Run the script supplied by IRSA.
6. Place files under \`data/spherex/incoming/dr1/\` and \`data/spherex/incoming/qr3/\`.

## 2. Index and validate

\`\`\`bash
python3 -m pip install -r requirements-spherex.txt
python3 scripts/index_spherex_datasets.py
\`\`\`

The indexer opens each FITS file with Astropy, requires valid \`CRVAL1\`/\`CRVAL2\` and a real \`MJD-OBS\` or \`DATE-OBS\`, identifies release and detector, records file size and SHA-256, and writes \`data/spherex/manifest.json\`. Files without valid coordinates or observation times are rejected; inspect \`rejectedFiles\`.

## 3. Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

The server reads \`data/spherex/manifest.json\` by default. Override with \`SPHEREX_DATA_DIR\` if needed. \`GET /api/spherex/local-datasets\` reports manifest availability and usable files. Matching local DR1/QR3 files are parsed first and labelled \`LOCAL_IRSA_SPHEREX\`; if neither local nor live sources provide FITS pixels, no frames are shown.


## Downloading products from the workbench

When a live or local observation includes an official IRSA IBE access URL, the Observation & FITS Metadata panel offers:

- **Download 64px FITS** — retrieves a bounded cutout centered on the selected target through `/api/spherex/download-fits`. The server only accepts HTTPS URLs on `irsa.ipac.caltech.edu`, validates the returned FITS signature, and sends the file as an attachment.
- **Original IRSA product** — opens the source product URL. For a larger multi-product dataset, use the official IRSA Data Explorer's **Generate Download Script** feature.
- **Export SED CSV** — exports the spectrum shown in the workbench with provenance and measured/not-measured columns.

For a synthetic benchmark, the export controls instead provide a JSON preview package and SED CSV explicitly marked `SIMULATED_DEMO`; they are not FITS files and must not be used as scientific measurements.

## Deployment limitation

\`data/spherex/\` is ignored by Git. A hosted Render deployment cannot read files from your laptop. Local datasets are available to the local Node server only. A hosted dataset feature needs a persistent object store or approved dataset host and a separately tested retrieval adapter.

## Scientific-integrity notes

- Prefer DR1 and QR3; QR2 is excluded from local comparisons because its calibration differs.
- A zero-result search is not proof that an object has never been observed.
- Metadata without parsed FITS pixels is not an image observation.
- Gaia and AllWISE are separate catalogs; importing SPHEREx FITS does not imply those catalogs were cross-matched.
- Missing bands are not filled with generated values.

## Official resources

- [SPHEREx data access guide](https://irsa.ipac.caltech.edu/spherex-archive-documentation/spherex-data-access/)
- [SPHEREx data products](https://irsa.ipac.caltech.edu/spherex-archive-documentation/spherex-data-products/)
- [SPHEREx cutout tool](https://irsa.ipac.caltech.edu/data/SPHEREx/docs/cutout_tool.html)
