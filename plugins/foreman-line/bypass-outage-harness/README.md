# @foreman-line/bypass-outage-harness (FK-P17′)

Bypass + outage matrix and A1/D21 measurement instrument (RS-1.2/RS-2.2) for
the foreman-kernel goal. The harness runs the ten-class matrix (26 cases),
3 controls, and 5 measurement cases against the **shipped** mediated surfaces
(`hooks/model-gate.mjs`, `dispatch/src/approval-cli`, `mutation-scope-guard`) as
**read-only runtime inputs** and emits the mechanical/detected/unsupported
classification matrix with per-case evidence artifacts.

The harness measures and records only. It claims no enforcement, promotion, or
containment beyond the one proven row (D13).

## Commands

| Command | Emits |
|---|---|
| `npm run matrix` | `evidence/vectors/V1-…V10-*.json`, `evidence/controls.json`, `evidence/matrix.json`, `evidence/summary.json`, `evidence/manifest.json` |
| `npm run measure` | `evidence/measurements.jsonl`, `evidence/measurement-summary.json`, then refreshes the five measurement rows in `matrix.json`/`summary.json` and the artifact hashes in `manifest.json` so the final set carries one coherent disposition |
| `npm test` | registry completeness, channel tests against real surfaces in throwaway temp workspaces, measure determinism, record honesty rules, hypothesis binding, three-state pin tests |
| `npm run typecheck` / `npm run lint` | `tsc --noEmit` / `biome check .` |

Verification chain (spec Verification Plan, sequential Node lane):
`node -v` (>=22) → `npm ci` (lockfile unchanged) → `npm run typecheck` →
`npm test` → `npm run lint` → `npm run matrix` → `npm run measure`.

## Evidence model

- **Closed classification vocabulary**: `mechanical | detected | unsupported`,
  derived from observed signals only via the T4 derivation table. The
  hypothesis is never written into the classification field; a falsified
  hypothesis is recorded (`hypothesisFalsified: true`). Contradictory signals
  refuse emission (`SIGNAL_AMBIGUOUS`).
- **`exercised: yes | gap` is first-class on every matrix row** (OQ-1). A gap
  row carries a machine-readable gap record naming its FK-P18′-lane evidence
  obligation; it is never counted passed and never dropped from `matrix.json`.
- **Policy-class honesty**: any refusal produced by `model-gate.mjs` is tagged
  `mechanismPolicyClass: model-membership` (derived from the recorded refusal
  source) and excluded from scope-containment tallies.
- **D7**: V7 (hook non-enrollment) rows can never classify `mechanical` and are
  never reported as hook refusals — emission refuses instead.
- **Must-prove [INFERENCE] row (BYP-SH-01)** is two-sided (OQ-5): falsified and
  confirmed outcomes are equally acceptable; both named signals are required
  (realpath-verified effect observation + guard non-invocation proof via the
  invocation ledger).
- **Measurement** (T3/MEAS-01…05): integer microseconds, nearest-rank
  percentiles (`pX = a[ceil(X·N/100)]`, 1-indexed, clamped); warm `N ≥ 200`,
  cold `N ≥ 10`, deadline 3 repeats/case; below threshold the claim is refused
  with `MEASUREMENT_INCOMPLETE` while records are retained. `firstCallObservation`
  is never folded into warm. IP-3 is a guard-seam **analog** of the D21
  `kernelDecisionLatency` literal — the binding comparability caveat is carried
  in `measurement-summary.json`; IP-4 is an `INSTRUMENT_UNREACHABLE` gap. D8
  outage-posture inheritance is recorded **not-proven**, never claimed.
- **Three-state pins**: the 18 external pins + the spec are digested into
  `manifest.json` pre/post each run (`READ_ONLY_SURFACE_VIOLATION` if a surface
  changes mid-run); known-base states emit KNOWN-GAP records; any other drift
  fails closed (`PIN_DRIFT`). The FK-P2 compiled-scope reference (MEAS-05) is
  three-state the same way (`FK2_REFERENCE_DRIFT` on shape drift).
- **Banned-claim scan**: every emitted byte is scanned for enforcement /
  promotion / non-enrollment-refusal / stranded-INF claim vocabulary;
  `summary.json` records the result (its own scan block excluded as
  self-reference).

## Environment provisioning note

The shipped surfaces are invoked as libraries (and spawned as the real hook).
This package installs **no code into them**; `npm ci` is run inside the
read-only dependency packages (`dispatch`, `contracts`, `receipts`,
`permission-profiles`, `worker-envelopes`, `routing-policy`, `skill-injection`,
`foreman-config`, `projection`, `registration`, `role-authority`,
`schema-scaffold`, `shaping`, `spec-linter`) purely to resolve their
lockfile-pinned npm dependencies — untracked `node_modules` residue per the
repo's per-package convention. No tracked byte of any pinned surface is
touched; the manifest pre/post digests prove it.

## Throwaway workspaces

Every case runs in a fresh temp workspace (`%TEMP%/fk-p17-ws-*`) and cleans up
after itself. Gate state under `%TEMP%/foreman-line-model-gate` is created and
removed per case. Nothing is written inside the repo tree except this package's
own `evidence/` outputs.
