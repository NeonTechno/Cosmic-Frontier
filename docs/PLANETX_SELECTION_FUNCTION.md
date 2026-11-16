# Planet X / eTNO survey-selection modelling plan

## Current status

Black Star Orbit currently computes two exploratory angular statistics:

1. Longitude of perihelion (varpi) concentration compared with a uniform-angle null.
2. Orbital-pole concentration compared with an isotropic-sphere null.

These are reproducible, deterministic Monte Carlo diagnostics. They are **not survey-selection corrected**, do not propagate all orbits to a common epoch, and are not a Planet Nine detection test. Do not present their p-values as the probability that Planet Nine exists.

The MPC distant-object feed is useful for assembling candidate orbital elements, but a catalogue of discoveries alone does not describe where surveys looked and found nothing. It is not an unbiased parent-population sample.

## Why a survey simulator is required

A meaningful forward model needs the observational process, not just the discovered-object list. At minimum, each included survey needs characterized:

- Pointing history: field centre or footprint, epoch, and usable area.
- Depth: filter-specific limiting magnitude and, ideally, a measured detection-efficiency curve.
- Cadence: observation timing and rate-of-motion constraints.
- Tracking/follow-up: probability that a detection becomes a securely tracked orbit.
- Quality cuts: orbit arc, astrometric uncertainty, magnitude and other discovery criteria.

Napier et al. (2021) used published pointing histories, depth, and tracking selections for a 14-object DES/OSSOS/Sheppard–Trujillo sample and found that the apparent angular clustering was consistent with a uniform parent population for that sample. This illustrates why a generic uniform-angle p-value is not a replacement for a survey simulator.

## Proposed forward-model workflow

1. **Freeze a characterized survey sample.** Include only surveys for which the required pointing, depth, cadence, and tracking characterization can be sourced and versioned. Record excluded surveys and why they are excluded.
2. **Define competing intrinsic populations.** At minimum, a null population with uniform varpi and longitude of ascending node, and one or more explicitly parameterized Planet Nine dynamical hypotheses. Record the assumed distributions of semimajor axis, eccentricity, inclination, absolute magnitude, and orbital phase.
3. **Normalize epochs.** Propagate all observed and simulated orbital elements to a documented common epoch using a validated ephemeris/integrator. Preserve original MPC epochs and covariance/uncertainty where available.
4. **Generate synthetic objects.** Draw orbital elements and physical brightness from the declared population model; never invent observed catalogue entries.
5. **Forward through each survey.** At every characterized field/epoch, compute sky position and apparent magnitude; apply footprint, magnitude-efficiency, rate/cadence, tracking, and quality cuts.
6. **Build detected mock catalogues.** Retain the survey identity, field, simulated epoch, detection decision, and rejection reason for each mock object.
7. **Compare like with like.** Compare observed detections only with mock detections passed through the same survey selection. Use predeclared summary statistics and posterior-predictive / Monte Carlo distributions.
8. **Report sensitivity.** Repeat across plausible population priors, efficiency curves, absolute-magnitude distributions, and survey-characterization uncertainties. Show how conclusions change.
9. **Publish a reproducibility manifest.** Include source files and hashes, survey characterization versions, code commit, random seeds, model priors, epoch, cuts, simulation count, and outputs.

## Proposed survey-field data contract

The application should not accept a survey as “characterized” unless its source and required fields are present. A future normalized record should include:

- `surveyId`, `fieldId`, `sourceReference`, `sourceFileHash`
- `epochJD`, `raDeg`, `decDeg`, and a documented field footprint (polygon or validated geometry)
- `filter`, `limitingMagnitude`, and optional measured `detectionEfficiencyCurve`
- `rateMinArcsecPerHour`, `rateMaxArcsecPerHour`, and cadence requirements when published
- `trackingProbability` or a documented statement that it is unavailable
- `characterizationVersion` and `uncertaintyNotes`

Missing fields must remain unavailable. A generic circular field, step-function depth, or assumed 100% tracking probability must never be silently substituted for a real survey characterization.

## Existing research software to evaluate

- [OSSOS Survey Simulator](https://github.com/OSSOS/SurveySimulator): a Python/Fortran simulator that applies characterized survey selection to model populations. Its EUPL license and build/runtime requirements need review before any code is reused or wrapped.
- [OSSOS survey simulator methodology](https://www.frontiersin.org/journals/astronomy-and-space-sciences/articles/10.3389/fspas.2018.00014/full): explains why characterized pointings, depth, tracking, and rate cuts are required.
- [Napier et al. (2021)](https://doi.org/10.3847/PSJ/abe53e): selection-aware ETNO clustering analysis and FastSSim methodology.

## Integration recommendation

Do not reimplement a survey simulator hastily inside the React client. First obtain and validate the characterized data and choose whether to:

- run the OSSOS simulator as a separately versioned Python/Fortran research service with a typed API, or
- implement a documented, tested TypeScript adapter for a deliberately limited set of characterized surveys.

Whichever route is chosen, the service must return per-survey mock detections, rejection reasons, configuration hashes, uncertainty/sensitivity summaries, and an explicit statement of which selection effects were and were not modelled.

## Release gate

Until a characterized survey dataset has been ingested, independently checked, and run end-to-end, the application must keep the label **“selection effects not modelled”** visible and must not describe the Planet X statistics as selection-corrected or conclusive.
