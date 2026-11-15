# Black Star Orbit — The Infrared Sky Time Machine

**NASA Space Apps Challenge 2026 — Planet X and SPHEREx**

Black Star Orbit is a public-facing astronomical discovery and time-domain analysis platform built to inspect repeated infrared observations from **NASA's SPHEREx** mission (`0.75–5.00 µm` across 6 detector arrays D1–D6), align epochs onto a unified North-Up ICRS sky grid, cross-match **ESA Gaia DR3** proper motions and **2010 AllWISE** baselines, and triage candidate moving or variable sources with strict scientific integrity.

---

## Core Architecture & Live Data Pipeline

1. **Live NASA/IPAC IRSA SPHEREx Query Engine (`src/server/astroArchiveService.ts`)**
   - Queries **IRSA SIAv2** (`https://irsa.ipac.caltech.edu/SIA`) across both **`spherex_dr1`** and **`spherex_qr3`** for any user-supplied RA/Dec (decimal or sexagesimal) or resolved object name.
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

## SPHEREx Interactive Demo Mode (Judges / Offline Preview)

When the live IRSA query is unavailable, the SPHEREx viewer opens an explicitly labelled **SIMULATED_DEMO** field so visitors can inspect the interface without mistaking generated values for mission data. The fixture contains three illustrative epochs, a synthetic star field, example transient candidates, and a 102-point illustrative spectrum.

The demo exercises the existing viewer controls: 102-band selection, image stretch and colormap controls, coordinate/crosshair and survey-tile overlays, multi-epoch comparison, blink/timelapse, difference/SNR visualization, spectral plots, metadata inspection, AI explanation, and PNG export. Catalog overlays are not represented as Gaia or AllWISE matches in demo mode.

**Provenance rule:** the demo is for interface walkthroughs only. Its pixels, source positions, fluxes, timestamps, candidate scores and spectral values are generated examples—not NASA/IPAC measurements, not FITS data, and not scientific detections. Verified live IRSA results and locally imported NASA/IPAC FITS products retain their separate provenance labels.

---

## Baseline Assessment & Key Scientific Improvements

During technical due diligence of the initial prototype:
- **Resolved Simulated-Only SPHEREx Data**: Removed synthetic SPHEREx fallbacks. The API and client no longer populate the scientific viewer with generated benchmark observations; FITS pixels are required for an epoch to be displayed.
- **Replaced Fake Difference Imaging**: Replaced synthetic star-loop subtraction (`Math.random()` noise) in `DifferenceOverlay.tsx` with variance-weighted, WCS-aligned pixel subtraction (`computeRealFrameDifference`).
- **Corrected Candidate Vetting Claims**: Replaced `"Confirm PX"` / `"Confirmed High-Priority Planet X Candidate"` wording with honest citizen-science triage (`"Flag Priority"` / unconfirmed follow-up queue).
- **Fixed Plate Scale & Roll Alignment**: Handled SPHEREx `PC + CDELT` WCS rotations so multi-epoch blink comparisons align background stars cleanly.

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

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Production build: `npm run build && npm start`.

---
