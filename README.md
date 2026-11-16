# Black Star Orbit — The Infrared Sky Time Machine

**NASA Space Apps Challenge 2026 — Planet X and SPHEREx**

Black Star Orbit is a public-facing astronomical discovery and time-domain analysis platform built to inspect repeated infrared observations from **NASA's SPHEREx** mission (`0.75–5.00 µm` across 6 detector arrays D1–D6), align epochs onto a unified North-Up ICRS sky grid, cross-match **ESA Gaia DR3** proper motions and **2010 AllWISE** baselines, and triage candidate moving or variable sources with strict scientific integrity.

---

## Core Architecture & Live Data Pipeline

1. **Live NASA/IPAC IRSA SPHEREx Query Engine (`src/server/astroArchiveService.ts`)**
   - Queries **IRSA SIAv2** (`https://irsa.ipac.caltech.edu/SIA`) across both **`spherex_dr1`** and **`spherex_qr3`** across all four DR1/QR3 wide and deep collections (`spherex_dr1`, `spherex_dr1_deep`, `spherex_qr3`, `spherex_qr3_deep`) for user-supplied RA/Dec (decimal or sexagesimal) or resolved object name.
   - Groups available observations chronologically across survey dates (`t_min` / `MJD`) and detector arrays (`D1`–`D6`), and fetches calibrated **Level-2 Multi-Extension FITS cutouts** (`IMAGE`, `FLAGS`, `VARIANCE`, `ZODI`) via IRSA IBE (`?center={ra},{dec}&size=64pix`).
   - The archive API never substitutes synthetic frames when IRSA is unavailable or returns zero rows. The viewer can open a separate, visibly labelled synthetic demo so visitors can explore the interface; it is never presented as a NASA/IPAC observation.

2. **Zero-Dependency FITS Parser & WCS North-Up Reprojection (`src/server/fitsParser.ts`)**
   - Parses IEEE-754 float32 and int32 FITS HDUs (both raw and `.gz` AllWISE cutouts) directly in TypeScript inside the Node/Express server.
   - Reads `PC1_1..PC2_2` + `CDELT1/2` (and `CD` matrices) with `CRVAL1/2`, `CRPIX1/2` TAN WCS headers—essential because SPHEREx rotates spacecraft roll angles (~180° flips) between 6-month survey passes.
   - Bilinearly reprojects every cutout onto a common **North-Up, East-Left ICRS grid** (`6.15″/px`) and computes background-subtracted **aperture photometry**, variance-propagated **SNR**, Zodi medians, and flux-weighted centroids.

3. **Multi-Catalog Cross-Matching**
   - **ESA Gaia DR3 TAP (`gea.esac.esa.int`)**: Live ADQL cone searches returning proper motions (`pmra`, `pmdec`), parallaxes, and G magnitudes overlaid on the SPHEREx FOV.
   - **NASA/IPAC AllWISE IBE**: Live W1 (`3.35 µm`) and W2 (`4.60 µm`) 2010 coadd FITS cutouts integrated directly into the **Time-lapse & Blink Comparator** for a ~15-year proper-motion baseline.
   - **External Deep-Links**: Uses the official **IRSA SPHEREx Data Explorer** for product search/download and **CDS Aladin Lite** for independent sky inspection.

4. **Time Machine & Candidate Vetting Modules**
   - **Sky Viewer**: `asinh` / `log` / `linear` / `sqrt` stretching, astronomical colormaps, `−Zodi` toggle, variance-weighted `SNR` map toggle, coordinate readout, and high-res PNG export.
   - **Time-lapse & Blink Comparator**: Chronological scrubber + 2-frame Blink Comparator supporting `2010 AllWISE -> 2025 SPHEREx DR1 -> 2026 SPHEREx QR3`.
   - **WCS-Aligned Difference Imaging**: Genuine pixel subtraction (`Epoch B − Epoch A`) with Zodi removal, variance-propagated SNR peak extraction, and methodological caveats.
   - **Candidate Investigation Workbench**: Triage queue distinguishing **observed signals**, **unconfirmed candidates**, and **confirmed discoveries**—never claiming Planet X has been discovered.

---

## Research Operations
- **JPL Horizons Observer Planner:** Mission Control can query NASA/JPL Horizons for geocentric RA/Dec, apparent magnitude, range, range rate, solar elongation and constellation for a selected solar-system body or supported asteroid. Results are explicitly labelled computed ephemerides, not telescope observations.



- **Research Source Monitor:** the NASA Data Centre runs cached reachability checks against SPHEREx IRSA, Gaia DR3, AllWISE, the NASA Exoplanet Archive, JPL SBDB, JPL CAD, and NASA Open Data. A responding endpoint is not treated as proof that a target has archive coverage or that a measurement is scientifically valid.
- **Reproducibility export:** the SPHEREx metadata panel exports a human-readable Markdown report and structured JSON record containing target coordinates, source provenance, archive query summary, observation identifiers, FITS/WCS/statistics metadata, SED values, and explicit limitations.
- **Calculated ephemeris labels:** Solar System positions propagated from bundled reference orbital elements are labelled as calculated models, not live JPL Horizons telemetry.

## SPHEREx Interactive Demo Mode (Judges / Offline Preview)

When the live IRSA query is unavailable, the SPHEREx viewer opens an explicitly labelled **SIMULATED_DEMO** field so visitors can inspect the interface without mistaking generated values for mission data. The benchmark library contains eight target-specific fields: the five challenge targets (Barnard's Star, Epsilon Indi B, WISE 0855-0714, RW Aurigae and R Draconis), plus L1688 Ophiuchus, the COSMOS deep-field strip and the North Ecliptic Pole calibration field. Each preview has four illustrative six-month epochs, a synthetic source field and transient candidates, and a 102-channel spectrum sampled on the SPHEREx band table.

The demo exercises the viewer controls: 102-band selection across six detector arrays, image stretch and colormap controls, coordinate/crosshair and survey-tile overlays, Gaia-style and WISE-style reference overlays marked SIM, illustrative proper-motion vectors, zodiacal-background toggle, SNR-style view, co-add preview, multi-epoch comparison, blink/timelapse, difference visualization, spectral plots and diagnostic tracers, metadata inspection, provenance-aware AI explanation, PNG export, and CSV/JSON benchmark export. Catalog overlays are not represented as Gaia or AllWISE matches in demo mode.

**Provenance rule:** the demo is for interface walkthroughs only. Its pixels, source positions, fluxes, timestamps, candidate scores and spectral values are generated examples—not NASA/IPAC measurements, not FITS data, and not scientific detections. Verified live IRSA results and locally imported NASA/IPAC FITS products retain their separate provenance labels.

---

## Hybrid Data Retrieval & Download Workflow

- **Fetch live:** `GET /api/spherex/time-machine` resolves target names or RA/Dec, checks indexed local DR1/QR3 files first, then queries IRSA DR1/QR3 and requires successfully parsed FITS pixels before an observation is returned.
- **Download FITS:** `GET /api/spherex/download-fits` accepts only official HTTPS IRSA IBE product URLs and returns a bounded 64-pixel FITS cutout after validating the FITS signature. The metadata panel exposes per-epoch cutout downloads and the original IRSA product URL.
- **Export analysis:** the metadata panel exports the SED as CSV plus a provenance-aware research report in Markdown and JSON. In demo mode, the report explicitly records `SIMULATED_DEMO` provenance and `isMeasured=false` semantics.
- **Build a local dataset:** place downloaded products under `data/spherex/incoming/dr1/` or `data/spherex/incoming/qr3/`, run the Astropy indexer, then query the indexed FITS files offline. The in-app Hybrid SPHEREx Data Engine panel reports local manifest availability and guides collection.
- **Hosted storage:** the Render free test service does not automatically persist files downloaded to a user's laptop. A shared hosted dataset requires a persistent volume or object-storage adapter and should be configured separately; no local file is silently assumed to exist in the cloud.

## Baseline Assessment & Key Scientific Improvements

During technical due diligence of the initial prototype:
- **Separated Scientific Data from UI Simulation**: Removed implicit synthetic observations from the archive/API path. Verified archive observations still require parsed FITS pixels; generated values are available only through the visibly labelled `SIMULATED_DEMO` interface-preview mode and are never treated as measurements.
- **Replaced Fake Difference Imaging**: Replaced synthetic star-loop subtraction (`Math.random()` noise) in `DifferenceOverlay.tsx` with variance-weighted, WCS-aligned pixel subtraction (`computeRealFrameDifference`).
- **Corrected Candidate Vetting Claims**: Replaced `"Confirm PX"` / `"Confirmed High-Priority Planet X Candidate"` wording with honest citizen-science triage (`"Flag Priority"` / unconfirmed follow-up queue).
- **Fixed Plate Scale & Roll Alignment**: Handled SPHEREx `PC + CDELT` WCS rotations so multi-epoch blink comparisons align background stars cleanly.

---

## Official SPHEREx Calibration, HiPS Cube & MPC eTNO Workflows

### Position-specific SPHEREx ePSF
- **UI:** SPHEREx → PSF Calibration. **API:** `GET /api/spherex/psf?ra={deg}&dec={deg}`.
- Searches the four IRSA DR1/QR3 wide/deep SIAv2 collections, retrieves real Level-2 FITS cutouts, and reads the `EPSF` binary-table extension from v7+ products.
- Uses the cutout celestial WCS plus `CRPIX1A` / `CRPIX2A` to map the requested coordinate back to parent LVF detector pixels. Selects the nearest detector-zone row by Euclidean distance in `XCENTER` / `YCENTER`.
- Returns the 33×33 float64 ePSF, detector, image version, 5× oversampling, `NEFF_MEAN`, wavelength, and all 441 zone locations. Legacy pre-v7 external calibration files are not substituted; those products return an explicit unsupported-version message.
- The returned ePSF is oversampled. Forward modelling on native detector pixels still requires sub-pixel phase shifting, pixel integration and normalization as described by the official notebook.

### SPHEREx HiPS all-sky cube
- **UI:** SPHEREx → HiPS Cube. **API:** `GET /api/spherex/hips-cube?ra={deg}&dec={deg}`.
- Reads the official HiPS `properties`, resolves the Norder-5 nested HEALPix tile and retrieves the corresponding IRSA FITS cube from the official DR1 HiPS cube data path.
- Reads the 102-plane `IMAGE` cube plus `NHITS` and `FLAGS`; wavelength coordinates come from `data_cube_crval3_arr` in the HiPS properties.
- Extracts a quick-look spectrum using a 5-pixel circular aperture and a 40–60-pixel annulus with iterative 3σ background clipping. Flux is converted to mJy using the equal-area HEALPix pixel solid angle.
- Layers 50 and 51 are explicitly excluded as the documented blank dichroic channels. The UI can inspect the spectrum and export the 102-layer measurements as CSV.

### Live Minor Planet Center ingestion
- **UI:** Planet X → Live MPC Catalogue. **API:** `GET /api/planetx/mpc-etnos`; append `?refresh=1` to bypass the 12-hour in-memory cache.
- Downloads the official MPC `distant_extended.json.gz` feed (TNOs, Centaurs and scattered-disk objects), parses the documented extended JSON orbital fields and filters bound objects with `a > 150 AU`, `q > 30 AU`, and `e < 1`.
- Preserves MPC designations, osculating elements, epoch, last-observed date, observation count and opposition count. Missing fields remain unknown.
- The MPC catalogue does **not** label objects as Planet X evidence. The app leaves apsidal-clustering status unassessed; any later clustering analysis must state its sample selection and observational-bias treatment.

Official methods: [SPHEREx ePSF notebook](https://caltech-ipac.github.io/irsa-tutorials/spherex-psf/) · [SPHEREx HiPS cube notebook](https://caltech-ipac.github.io/irsa-tutorials/spherex-hipscube/) · [MPC data files](https://data.minorplanetcenter.net/data) · [MPC extended JSON format manual](https://minorplanetcenter.net/Extended_Files/Extended_MPCORB_Data_Format_Manual.pdf).

---

## Methodological Limitations & Mission Scope Notes

- **SPHEREx Spatial Scale & LVF Coupling**: At `6.15″/pixel`, PSFs are undersampled, and repeated passes over a target often land on different Linear Variable Filter (LVF) bands (`D1`–`D6`) and roll angles. Chromatic PSF differences near bright sources can leave bipolar subtraction residuals.
- **NEOSSat Scope**: Canada's NEOSSat tracks near-Earth asteroids and orbital debris (`V < 19`), not faint (`> 20 mag`) outer-solar-system Planet X candidates.
- **Catalog Coverage**: Some regions (e.g., WISE 0855) have multi-epoch DR1 passes (May & Nov 2025) without QR3 passes yet; the UI reports exact DR1/QR3 row counts transparently.

---

## Validation Targets

The five challenge targets are query presets, not claims of archive coverage. For each target, the application retrieves actual IRSA metadata and FITS products or reports that coverage is unknown / no matching data were returned. The local dataset collector can be used when direct downloads are available even if a live query service is temporarily unavailable.


- **Barnard's Star** (`17h57m48.50s, +04°41′36.2″`, `μ = 10.33″/yr`): Multi-epoch DR1 (2025) + QR3 (2026) coverage (>1 year baseline) + AllWISE 2010 W2 baseline.
- **Epsilon Indi B** (`22h04m10.52s, -56°47′09.5″`, `μ = 4.70″/yr`): DR1 + QR3 epochs + Gaia DR3 / AllWISE comparison.
- **WISE 0855-0714** (`08h55m10.831s, -07°14′42.53″`, `μ = 8.15″/yr`): Multi-epoch DR1 passes (May & Nov 2025) + 2010 AllWISE W2 cold-brown-dwarf blinking (`W1−W2` extreme red source).
- **RW Aurigae** (`05h07m49.57s, +30°24′05.1″`): DR1 + QR3 epochs tracking T Tauri accretion/dust-dip variability.
- **R Draconis** (`16h32m40.23s, +66°45′17.9″`): Dense DR1 + QR3 high-ecliptic-latitude sampling of Mira-type long-period variability.

---

## Production Deployment

Black Star Orbit is a full-stack application. The supported production host is the Render Web Service running the Express API and serving the Vite build from the same origin. Static-only hosting (including GitHub Pages) cannot run the API routes and is not a supported production deployment.

Current service configuration:
- Service: `cosmic-frontier-spherex-demo`
- Intended production branch: `main`
- Deployment note: the existing Render service is still configured to deploy `feat/spherex-judges-demo-mode`; change its branch to `main` in the Render service settings before expecting this merge to reach the live site.
- Build: `npm ci --include=dev && npm run build`
- Start: `npm start`
- Health check: `/api/health`

Configure optional server-side credentials in Render Dashboard → Service → Environment. See `.env.example`; never commit real API keys. Render's free filesystem is ephemeral, so user-downloaded FITS files remain local unless persistent storage or an object-storage adapter is configured.

Vercel deployment configuration (`vercel.json`), the Vercel serverless API adapter, and the legacy static Pages deployment workflow have been removed from this repository. The external Vercel project-to-GitHub connection is account-level configuration and must still be disconnected in Vercel → Project Settings → Git → Disconnect if you want the project fully detached.

GitHub Actions runs typechecking, scientific integrity tests, and the production build. It validates code but does not deploy the application; Render is the deployment target.

---

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Production build: `npm run build && npm start`.

---
