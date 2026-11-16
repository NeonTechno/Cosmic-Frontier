# Phase 2 — OSSOS survey-selection adapter design

## Decision

Use the OSSOS Survey Simulator as a separately versioned research worker, not as code imported into the React/browser application and not as a quick TypeScript reimplementation.

The current upstream repository documents a Python package backed by a Fortran detection engine. Installing it builds an f90wrap extension; its simulator accepts a model population and a characterized survey directory. The repository includes small example characterizations, while full OSSOS v11 and JWST characterizations are maintained in separate research repositories. The upstream project is licensed under EUPL. See the upstream [SurveySimulator repository](https://github.com/OSSOS/SurveySimulator), its [characterization format documentation](https://github.com/OSSOS/SurveySimulator/tree/main/docs), and the [OSSOS survey-simulator methodology](https://www.frontiersin.org/journals/astronomy-and-space-sciences/articles/10.3389/fspas.2018.00014/full).

This is an architecture decision only. No OSSOS software, survey characterization, or survey-corrected result has been integrated into Black Star Orbit by this document.

## Why this route

A characterized survey is more than a field-of-view circle and limiting magnitude. The detection process depends on the survey's pointing history and usable footprint, magnitude and rate-of-motion efficiency, cadence, tracking/recovery, and quality cuts. A discovery catalogue alone cannot reconstruct where a survey looked and failed to detect an object.

The upstream simulator is designed to forward-bias an intrinsic population through those measured selection effects. Its Fortran/Python build chain and EUPL licensing make a separate, pinned worker safer to evaluate than copying its implementation into the TypeScript application.

## Integration boundary

Keep the current Node/Express API as the product-facing gateway. A future Python worker should:

1. Run in a separately built container with a pinned OSSOS Simulator commit, Python version, compiler, f90wrap and native dependencies.
2. Mount or fetch a read-only, versioned characterization bundle. Record its source repository, immutable commit/tag, file hashes, cited survey papers, and licence.
3. Accept a validated model-population file and an explicit survey-characterization identifier. Do not accept arbitrary filesystem paths from public requests.
4. Execute the upstream simulator without silently modifying its scientific detection engine.
5. Return normalized detected, tracked, and rejected outcomes, with rejection reasons where the upstream output supports them.
6. Preserve the raw upstream output files and complete run configuration as immutable artifacts.
7. Expose a typed, versioned JSON API to the Node gateway. The browser must never execute the Fortran simulator.

The Node gateway should enforce authentication or rate limits appropriate to the deployment, input size limits, execution timeouts, and strict schema validation. It must not report a successful analysis until the worker has completed and its output has passed validation.

## Proposed API contract

### Request

- `schemaVersion`: version of this gateway contract.
- `runId`: caller-generated idempotency key.
- `simulator`: upstream repository and immutable commit.
- `characterization`: survey id, repository, immutable commit/tag, relative directory, per-file SHA-256 hashes, citations, and licence identifier.
- `population`: model name/version, epoch (JD/TDB with explicit time scale), coordinate frame, element convention, object count, and input-file hash.
- `modelParameters`: declared distributions and parameter values for semimajor axis, eccentricity, inclination, angular elements, absolute magnitude, and any additional model variables required by the chosen simulator.
- `randomness`: seed and generator/version when controllable.
- `requestedOutputs`: detected/tracked catalogues, summary statistics, and raw artifacts.

Reject requests with missing epoch, coordinate frame, model definition, characterization provenance, or source hashes. Never fill missing orbital or brightness values with defaults that change the scientific population.

### Response

- `status`: queued, running, succeeded, failed, or cancelled.
- `runId`, `schemaVersion`, `startedAt`, `completedAt`.
- `software`: application commit, worker image digest, OSSOS commit, runtime/compiler versions.
- `inputs`: population hash, model parameters, epoch, random seed, characterization identity and hashes.
- `summary`: number drawn, in-footprint, detected, tracked, and rejected, only where supported by actual upstream outputs.
- `artifacts`: content-addressed references to raw drawn/detected/tracked files and normalized tables.
- `limitations`: unmodelled effects, unavailable output fields, and validation status.
- `provenance`: source citations, licence metadata, and retrieval timestamps.

A missing count or rejection category must be null/unavailable, not zero. A worker error must remain a failed run, not an empty successful catalogue.

## Staged implementation and acceptance gates

### Stage A — reproducible worker build

- Pin the upstream OSSOS repository to an immutable commit.
- Build the Fortran/f90wrap extension in a clean container.
- Run upstream tests and the smallest upstream example characterization.
- Record image digest, compiler/runtime versions, upstream test output, and licence review.
- Do not connect this worker to the public application yet.

**Gate:** a clean rebuild from the pinned commit produces passing upstream tests and a repeatable example run.

### Stage B — Black Star Orbit adapter

- Implement a Python wrapper around the upstream public interface; do not fork or silently patch the detection engine.
- Add request/response JSON Schema and strict input validation.
- Normalize upstream output without discarding raw files.
- Add deterministic contract tests using the upstream mini-survey fixture.
- Test malformed input, missing characterization files, timeout, worker crash, and partial output.

**Gate:** identical pinned inputs and seed reproduce identical normalized outputs, or any upstream nondeterminism is measured and documented.

### Stage C — real survey characterization

- Select one published, well-characterized survey sample and its matching characterized detections.
- Evaluate the OSSOS v11 characterization repository and the survey paper's sample definition before selecting it.
- Pin the characterization repository commit and hash every required file.
- Verify that the selected detections are the same survey/sample represented by the characterization; do not compare a mixed MPC feed to an OSSOS-only simulation as if they were matched.
- Document any unavailable selection term and exclude the survey if it prevents a defensible like-for-like comparison.

**Gate:** an independent reviewer can trace every characterization file and observed comparison object to its source and published sample definition.

### Stage D — hypothesis comparison

- Define a null population and explicit alternative population(s) before running simulations.
- State orbital-element epoch, frame, element convention, magnitude distribution, and all priors.
- Propagate observed and synthetic orbits to a documented common epoch using a validated method.
- Run each model through the same survey characterization and cuts.
- Compare only simulated detections with the corresponding observed survey sample.
- Report Monte Carlo uncertainty, sensitivity to priors, and the effect of sample definition.

**Gate:** outputs support a reproducible model-compatibility statement, not a claim that Planet X has been discovered or that a p-value is the probability Planet Nine exists.

## Licensing and data governance

The upstream repository states that it is distributed under the European Union Public Licence (EUPL). Before packaging, hosting, modifying, or redistributing it, obtain a project-level compatibility review of the exact upstream version and any characterization data terms. Keep the adapter and upstream worker boundary explicit; a separate process does not by itself settle every licence obligation.

Do not commit large survey datasets, private credentials, or unreviewed data files into the frontend repository. Prefer pinned, documented external artifacts with checksums and a clear access policy. Preserve original upstream files unchanged.

## Current status

- [x] Review current OSSOS Survey Simulator architecture and documented installation path.
- [x] Identify the Fortran/f90wrap build requirement and separate characterization repositories.
- [x] Record the EUPL licensing constraint and separate-worker decision.
- [x] Define an initial API contract and staged acceptance gates.
- [ ] Pin and build an immutable OSSOS version in a clean container.
- [ ] Complete licence and characterization-data review.
- [ ] Select and validate one matched real survey sample.
- [ ] Implement and test the worker adapter.
- [ ] Run null and alternative populations through the characterized survey.
- [ ] Add run artifacts and hashes to the user-facing reproducibility manifest.

Until those remaining gates pass, the existing Planet X statistics must continue to say **selection effects not modelled**.
