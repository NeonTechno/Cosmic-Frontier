# Black Star Orbit — The Infrared Sky Time Machine

**NASA Space Apps Challenge 2026 — Planet X and SPHEREx**

Black Star Orbit is a public-facing astronomical discovery and time-domain analysis platform built to inspect repeated infrared observations from **NASA's SPHEREx** mission (`0.75–5.00 µm` across 6 detector arrays D1–D6), align epochs onto a unified North-Up ICRS sky grid, cross-match **ESA Gaia DR3** proper motions and **2010 AllWISE** baselines, and triage candidate moving or variable sources with strict scientific integrity.

---

## Core Architecture & Live Data Pipeline

1. **Live NASA/IPAC IRSA SPHEREx Query Engine (`src/server/astroArchiveService.ts`)**
   - Queries **IRSA SIAv2** (`https://irsa.ipac.caltech.edu/SIA`) across both **`spherex_dr1`** and **`spherex_qr3`** for any user-supplied RA/Dec (decimal or sexagesimal) or resolved object name.
   - Groups available observations chronologically across survey dates (`t_min` / `MJD`) and detector arrays (`D1`–`D6`), and fetches calibrated **Level-2 Multi-Extension FITS cutouts** (`IMAGE`, `FLAGS`, `VARIANCE`, `ZODI`) via IRSA IBE (`?center={ra},{dec}&size=64pix`).
   - Falls back cleanly and explicitly (`FALLBACK_SIMULATED` / `SIMULATED_BENCHMARK`) only if external IRSA endpoints time out or return zero coverage—never disguising synthetic data as real mission imagery.

2. **Zero-Dependency FITS Parser & WCS North-Up Reprojection (`src/server/fitsParser.ts`)**
   - Parses IEEE-754 float32 and int32 FITS HDUs (both raw and `.gz` AllWISE cutouts) directly in TypeScript inside the Node/Express server.
   - Reads `PC1_1..PC2_2` + `CDELT1/2` (and `CD` matrices) with `CRVAL1/2`, `CRPIX1/2` TAN WCS headers—essential because SPHEREx rotates spacecraft roll angles (~180° flips) between 6-month survey passes.
   - Bilinearly reprojects every cutout onto a common **North-Up, East-Left ICRS grid** (`6.15″/px`) and computes background-subtracted **aperture photometry**, variance-propagated **SNR**, Zodi medians, and flux-weighted centroids.

3. **Multi-Catalog Cross-Matching**
   - **ESA Gaia DR3 TAP (`gea.esac.esa.int`)**: Live ADQL cone searches returning proper motions (`pmra`, `pmdec`), parallaxes, and G magnitudes overlaid on the SPHEREx FOV.
   - **NASA/IPAC AllWISE IBE**: Live W1 (`3.35 µm`) and W2 (`4.60 µm`) 2010 coadd FITS cutouts integrated directly into the **Time-lapse & Blink Comparator** for a ~15-year proper-motion baseline.
   - **External Deep-Links**: Direct coordinate handoff to **Backyard Worlds WiseView v2**, **IRSA FinderChart**, and **CDS Aladin Lite**.

4. **Time Machine & Candidate Vetting Modules**
   - **Sky Viewer**: `asinh` / `log` / `linear` / `sqrt` stretching, astronomical colormaps, `−Zodi` toggle, variance-weighted `SNR` map toggle, coordinate readout, and high-res PNG export.
   - **Time-lapse & Blink Comparator**: Chronological scrubber + 2-frame Blink Comparator supporting `2010 AllWISE -> 2025 SPHEREx DR1 -> 2026 SPHEREx QR3`.
   - **WCS-Aligned Difference Imaging**: Genuine pixel subtraction (`Epoch B − Epoch A`) with Zodi removal, variance-propagated SNR peak extraction, and methodological caveats.
   - **Candidate Investigation Workbench**: Triage queue distinguishing **observed signals**, **unconfirmed candidates**, and **confirmed discoveries**—never claiming Planet X has been discovered.

---

## Baseline Assessment & Key Scientific Improvements

During technical due diligence of the initial prototype:
- **Resolved Simulated-Only SPHEREx Data**: Replaced synthetic-only target generators with live IRSA SIAv2 (`spherex_dr1` + `spherex_qr3`) + IBE FITS cutout ingestion while retaining explicit `FALLBACK_SIMULATED` labeling when offline.
- **Replaced Fake Difference Imaging**: Replaced synthetic star-loop subtraction (`Math.random()` noise) in `DifferenceOverlay.tsx` with variance-weighted, WCS-aligned pixel subtraction (`computeRealFrameDifference`).
- **Corrected Candidate Vetting Claims**: Replaced `"Confirm PX"` / `"Confirmed High-Priority Planet X Candidate"` wording with honest citizen-science triage (`"Flag Priority"` / unconfirmed follow-up queue).
- **Fixed Plate Scale & Roll Alignment**: Handled SPHEREx `PC + CDELT` WCS rotations so multi-epoch blink comparisons align background stars cleanly.

---

## Methodological Limitations & Mission Scope Notes

- **SPHEREx Spatial Scale & LVF Coupling**: At `6.15″/pixel`, PSFs are undersampled, and repeated passes over a target often land on different Linear Variable Filter (LVF) bands (`D1`–`D6`) and roll angles. Chromatic PSF differences near bright sources can leave bipolar subtraction residuals.
- **NEOSSat Scope**: Canada's NEOSSat tracks near-Earth asteroids and orbital debris (`V < 19`), not faint (`> 20 mag`) outer-solar-system Planet X candidates.
- **Catalog Coverage**: Some regions (e.g., WISE 0855) have multi-epoch DR1 passes (May & Nov 2025) without QR3 passes yet; the UI reports exact DR1/QR3 row counts transparently.

---

## Validation Across the 5 Challenge Targets

- **Barnard's Star** (`17h57m48.50s, +04°41′36.2″`, `μ = 10.33″/yr`): Multi-epoch DR1 (2025) + QR3 (2026) coverage (>1 year baseline) + AllWISE 2010 W2 baseline.
- **Epsilon Indi B** (`22h04m10.52s, -56°47′09.5″`, `μ = 4.70″/yr`): DR1 + QR3 epochs + Gaia DR3 / AllWISE comparison.
- **WISE 0855-0714** (`08h55m10.831s, -07°14′42.53″`, `μ = 8.15″/yr`): Multi-epoch DR1 passes (May & Nov 2025) + 2010 AllWISE W2 cold-brown-dwarf blinking (`W1−W2` extreme red source).
- **RW Aurigae** (`05h07m49.57s, +30°24′05.1″`): DR1 + QR3 epochs tracking T Tauri accretion/dust-dip variability.
- **R Draconis** (`16h32m40.23s, +66°45′17.9″`): Dense DR1 + QR3 high-ecliptic-latitude sampling of Mira-type long-period variability.

---

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Production build: `npm run build && npm start`.

---

## Deploying Online (Vercel — Recommended Full-Stack)

Black Star Orbit includes `vercel.json` and a serverless API entrypoint (`api/index.ts`) so **both the Vite frontend and all `/api/*` Express routes** (live IRSA SPHEREx FITS cutouts, Gaia DR3, AllWISE, NASA NED, and NVIDIA NIM AI) run together on Vercel.

1. Push your repository to **GitHub** (or GitLab / Bitbucket).
2. Log in to [vercel.com](https://vercel.com), click **Add New → Project**, and import your repository.
3. Keep the auto-detected settings (`Framework Preset: Vite`, `Build Command: npm run build`, `Output Directory: dist`).
4. *(Optional, for live AI & NASA keys)* Under **Environment Variables**, add:
   - `NVIDIA_API_KEY` — enables live `nvidia/nemotron-3.5-bolt-e4b` explanations & chat (otherwise uses built-in deterministic astrophysics responses).
   - `NASA_API_KEY` — optional key for higher rate limits on `api.nasa.gov`.
5. Click **Deploy**. Your full-stack site will be live at `https://<your-project>.vercel.app`.

---

## Alternative: GitHub Pages (Static-Only Hosting)

If you prefer static hosting without serverless functions, `.github/workflows/deploy-pages.yml` builds `dist/` with automatic subpath resolution and a `404.html` SPA fallback:

1. Push to `main` on GitHub.
2. Go to **Settings → Pages → Source** and select **GitHub Actions**.
3. Wait for **Deploy Website to GitHub Pages** to complete (`https://<username>.github.io/<repo>/`).

> **Note on static mode**: GitHub Pages serves only static frontend files (`dist/`), so `/api/*` calls automatically fall back to bundled catalogs, synthetic SPHEREx benchmarks, and deterministic scientific explanations.


