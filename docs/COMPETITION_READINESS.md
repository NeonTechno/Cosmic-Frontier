# Black Star Orbit — Competition Readiness Tracker

This is the working checklist for turning Black Star Orbit into a compelling, reproducible astronomy research and learning experience. A feature is not considered complete merely because a UI element exists: it must work, be testable, and communicate the limits of its evidence.

## Current upgrade — product experience

- [x] Remove the standalone Live Telemetry navigation button from the Editorial Journal header without removing telemetry features from their dedicated observatory views.
- [x] Place Gemini Visual Studio in the Cosmic Lab homepage as a dedicated creative astronomy workspace.

- [x] Make the Editorial Journal the default page after the launch screen.
- [x] Keep returning visitors on the Editorial Journal rather than silently bypassing it for the Cosmic Lab.
- [x] Add the Editorial Journal as a dedicated step in the project tour.
- [x] Make Skip / Finish return to the Editorial Journal unless the visitor explicitly chooses another tour destination.
- [x] Remove the standalone “Scientific Intel” navigation button; contextual AI and the Cosmic AI Guide remain available.
- [x] Make the selected SPHEREx challenge target readable in light mode, with a pale cyan selection treatment instead of a dark filled tile.
- [x] Simplify verbose Astrobiology header badges without removing scientific source attribution from the underlying research content.
- [x] Extend the glass treatment with restrained highlights and sparkle details, while respecting reduced-motion preferences.

## AI assistance

- [x] Add server-side Gemini configuration through `GEMINI_API_KEY` and `GEMINI_MODEL`.
- [x] Route contextual scientific explanations through Gemini when configured.
- [x] Route the conversational astronomy guide through Gemini when configured.
- [x] Preserve NVIDIA NIM as an alternative provider and deterministic educational fallbacks when no provider is configured.
- [ ] Add an in-app provider health indicator that reports availability without exposing secrets.
- [ ] Add rate limiting, request-size limits, and abuse controls for public AI endpoints.
- [ ] Add structured response validation and a user-visible “AI-generated explanation” label.
- [x] Add Gemini-powered astronomy concept-art generation to the Cosmic Lab homepage; generated artwork is labelled illustrative and never presented as telescope imagery or a measured result.
- [ ] Evaluate AI answers against a curated astronomy question set, including adversarial prompts that try to elicit invented observations.

## Scientific hardening — phase 1

- [x] Correct the HiPS FITS tile dimensions to the official 512 × 512 × 102 layout and align the nested HEALPix child scale and pixel solid-angle conversion.
- [x] Add a regression fixture using the official IRSA notebook coordinate example and expected Norder-5 pixel 445.
- [x] Enforce the official 512 × 512 × 102 cube dimensions with a dedicated regression-tested validator.
- [x] Label the HiPS aperture spectrum as visualization-only and direct scientific photometry to the IRSA Spectrophotometry Tool.
- [x] Report non-zero HiPS FLAGS values without silently masking them before the flag-bit policy is validated.
- [x] Replace the Planet X evidence panel's hardcoded “less than 0.1% / 3.4σ” statement with reproducible Monte Carlo null diagnostics.
- [x] Include all catalogue objects with valid angles; do not pre-filter on the legacy `antiAligned` label.
- [x] Add separate uniform-`varpi` and isotropic-orbital-pole null comparisons with deterministic seeds and explicit warnings.
- [x] Display the MPC/literature/unspecified catalogue composition and link to peer-reviewed selection-bias and survey-simulator methodology.
- [x] Mark the bundled Planet X candidate queue as synthetic teaching fixtures rather than implying they are WISE/Subaru detections.
- [x] Mark the bundled ETNO examples as literature references and distinguish archive-derived SPHEREx residual leads from confirmed objects.
- [x] Remove the default 400 AU substitution and fabricated reduced-χ² / physical-orbit flags from the astrometry illustration.
- [x] Use supplied observation dates for plotted astrometry epochs and label the simplified circular-Earth track as illustrative only.
- [x] Avoid allocating full IMAGE, NHITS, and FLAGS Float32 copies when extracting a small HiPS aperture; read only sampled FITS values to reduce peak memory.
- [ ] Do not call the Planet X analysis selection-corrected until survey-specific pointing, depth, cadence, weather, tracking, and follow-up selection functions are implemented and validated.
  - Research design and data contract: [Planet X survey-selection modelling plan](PLANETX_SELECTION_FUNCTION.md).
- [ ] Propagate MPC osculating elements to a common epoch before comparing angular orbital elements.
- [ ] Validate HiPS aperture photometry against the official notebook on a real downloaded cube; validate FITS FLAGS interpretation and science-grade uncertainties.

## Scientific research integrity

- [ ] Verify each SPHEREx query against the official IRSA archive response and retain query parameters, retrieval time, product identifiers, and source URLs.
- [ ] Keep live archive observations, locally imported FITS products, reference catalogues, synthetic benchmarks, and theoretical models visibly distinct.
- [ ] Validate FITS parsing, WCS handling, units, masks, uncertainty propagation, and spectral extraction against official SPHEREx tutorial notebook outputs.
- [ ] Validate ePSF extraction against the official PSF notebook, including sub-pixel sampling, pixel integration, normalization, and residual diagnostics.
- [ ] Validate HiPS cube extraction against the official all-sky cube workflow; preserve missing-data masks and uncertainty metadata.
- [ ] Ensure every plotted measurement can be traced to an observation, catalogue row, or documented calculation.
- [ ] Never fill unavailable physical parameters with invented values or treat missing data as zero.
- [ ] Keep SPHEREx residual candidates attributed to the actual source survey; do not relabel them as WISE/NEOWISE without an independent cross-match.
- [ ] Keep Planet X explicitly hypothetical. An ETNO catalogue or apparent clustering is not proof of a new planet.
- [ ] For Planet X analyses, model survey selection effects and observability; report sample definitions, null hypotheses, uncertainty, and reproducible significance tests.
- [ ] Compare orbital-clustering statistics under null and Planet X hypotheses using bootstrap / Monte Carlo methods and publish assumptions.
- [ ] Persist candidate vetting decisions with provenance, timestamps, and audit history rather than relying on process memory.

## Analytical and reproducibility quality

- [ ] Every analysis view should show: input data, source, method, assumptions, units, uncertainty, output, and limitations.
- [x] Add JSON analysis-manifest export with the full input catalogue, source labels, Monte Carlo seed, method/version, null assumptions, hypothesis parameters, and caveats.
- [ ] Add a human-readable report and bind the exact application Git commit, archive retrieval timestamp, and source-payload hashes.
- [ ] Add deterministic tests for coordinate transforms, orbital propagation, spectral calculations, FITS parsing, and uncertainty handling.
- [ ] Add integration tests for live archive failures, empty query results, malformed FITS products, and rate limits.
- [ ] Add a clean “reproduce this analysis” workflow from a saved target/query.
- [ ] Ensure charts label observed values separately from model curves, synthetic examples, and illustrative overlays.

## Education and visitor engagement

- [ ] Build a guided path: question → target → observation → analysis → interpretation → limitations → further reading.
- [ ] Add plain-language definitions for spectra, wavelength, signal-to-noise, PSF, WCS, parallax, perihelion, and orbital clustering.
- [ ] Give each major visualization a short “How to read this” explanation and an accessible text alternative.
- [ ] Add small inquiry prompts and mini-investigations rather than relying only on static descriptions.
- [ ] Include citations and links to official NASA/IPAC, JPL, MPC, and peer-reviewed sources close to the relevant claims.
- [ ] Make the experience welcoming to students and curious visitors without hiding scientific caveats.

## Visual design, accessibility, and performance

- [ ] Check all modules in both light and dark themes.
- [ ] Check responsive layouts at phone, tablet, and desktop widths.
- [ ] Verify keyboard navigation, focus visibility, semantic labels, contrast, and screen-reader names.
- [ ] Respect `prefers-reduced-motion`; avoid animation that obscures scientific controls or data.
- [ ] Lazy-load expensive 3D scenes and large visual assets; provide loading, empty, and error states.
- [ ] Keep glass effects subtle enough that charts, labels, and input values remain legible.
- [ ] Compress media and measure initial load, interaction latency, and memory use on mobile hardware.

## Competition demo and release gates

- [ ] Prepare a 3–5 minute judge walkthrough with a clear research question and a complete evidence trail.
- [ ] Demonstrate one successful live SPHEREx archive query and one honest no-coverage / archive-unavailable case.
- [ ] Demonstrate one reproducible spectral or image analysis with source metadata and uncertainty.
- [ ] Demonstrate Planet X as a testable hypothesis, including a null comparison and selection-bias discussion.
- [ ] Demonstrate one educational path from an accessible explanation to the underlying scientific method.
- [ ] Run typecheck, all tests, production build, dependency audit, and secret scan before each release.
- [ ] Test deployed API routes for JSON content types and expected schemas; an HTTP 200 SPA fallback is not proof that an API route works.
- [ ] Verify Render deploys the intended branch and smoke-test the public service after deployment.
- [ ] Keep a known-issues list and never describe incomplete or simulated functionality as a verified scientific result.

## Release status

The checked items above describe code changes included in the current upgrade branch. Unchecked items are follow-up research, engineering, validation, or release work; they are not represented as completed. The upgrade still requires CI and deployment verification before it should be described as release-ready.
