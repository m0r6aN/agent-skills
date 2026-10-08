# CFF-P3 shaping lint (coordinator) — 2026-10-08

**Coordinator session:** the `/goal resume` coordinator session (ownership transferred 2026-10-08 per `loop-directive.md`).
**Artifact linted:** `plugins/foreman-line/docs/specs/active/CFF-P3-gate-surface-pin-precheck.md` (draft at lint) + `cff-p3-gate-surface-pin-precheck.shaping-result.json`, uncommitted on `feat/foreman-line-cff-p3` @ `14b2501a` (worktree `../foreman-line-cff-p3`).
**Method:** every factual claim re-read/re-measured on disk before acceptance. Lint host: Linux, node v26.8.2 — verification-of-claims only; build-stage deterministic passes run per the spec's Verification Plan.

## Claim-by-claim verification

| Spec claim | Disk check | Result |
|---|---|---|
| 18 `PinEntry` rows + the FK-P17 spec pin (AC1) | `tests/surface-pins.test.ts:80` asserts `SURFACE_PINS.length === 18`; `surface-refs.ts` carries 19 `id:` literals = 18 PinEntry rows + the `fk-p17-spec` record; `SPEC_RELATIVE_PATH`/`SPEC_SHA256` constants present; `digestFile(specPath()) === SPEC_SHA256` (:59) and `spec.pinnedDigest === SPEC_SHA256` (:75) asserted | **CONFIRMED** (suite run is build-stage: `tsx` not installed in the fresh worktree at lint) |
| Identical public surface to re-export (AC2) | `surface-refs.ts` exports: `SURFACE_PINS`, `classifyPin`, `snapshotPins`, `SPEC_RELATIVE_PATH`, `SPEC_SHA256` + remaining (`PinKnownBase`, `PinEntry`, `PinState`, `pluginRoot`, `specPath`, `digestFile`, `PinSnapshotRow`, `Fk2ReferenceState`, `classifyFk2Reference`) — names match the spec's wrapper contract | **CONFIRMED** |
| Three-state classification; KNOWN-GAP preserved (AC5) | `classifyPin` returns `match`/`known-base`/`drift` (test :47–49); strict entry without knownBase → `drift` on mismatch (:54, fail-closed); 6 `knownBase` rows each with `gapReason`; FK-P17 "pins bind committed bytes only" header rule present | **CONFIRMED** |
| `sanitizeField` consumed at `scripts/foreman-line-ci.mjs:140` (Constraints) | line 140 exactly | **CONFIRMED** |
| R1 layer 2 fail-closed chain (AC6) | `verdict()` :1150–1151: `gateResult !== 'success'` → `gate-failed` | **CONFIRMED** |
| Workflow insert point "after `setup-node`, before `decide`"; no new permissions (AC6) | `gate` job: LF-preserve (`core.autocrlf false` :34–36) → `checkout@v6` → `setup-node@v6` (:43) → decide (:49, `id: decide`) → verify (:61) → resolve (:70); workflow `permissions: contents: read, actions: read` | **CONFIRMED** — insert point real; assumption (LF checkout = committed bytes) corroborated by the workflow's own LF step |
| D11 seam belongs to CFF-P1, untouched (Out of Scope) | `ci-reuse.mjs` `GITHUB_EVENT_PATH` seam untouched by Unit A's Allowed Files | **CONFIRMED** |

## AC ↔ charter diff (lesson #33)

- D5 ↔ AC1/AC4/AC5/AC6 + Constraints: single plain-data source, three-state preserved, no test execution in the gate job — no weakening.
- D10 ↔ AC7: re-derive-and-compare drift check named as a sequenced seam, FK-P17 pattern, fed by CFF-P0's two-reviewed artifact; no substitute measurement. Matches the ratified text.
- D11 ↔ Out of Scope/Forbidden: diff seam excluded, `foreman-line-ci.mjs` read-only import only. Matches.
- Exit criterion 7 clause: present **verbatim** in Out of Scope (detected-not-prevented; "(CFF-P3's precheck does not fix it)").
- Two independent adversarial reviews before any Gate 3 request: in Constraints, AC, and Verification Plan — matches the charter's elevated/architecture-risk routing.
- Gate invariants (required `test` identity via R1 layer 2, recorded-not-inferred): consistent with the verified `verdict()` source.

## Ruling — the open question (Unit B vehicle), named at promotion lint as required

**RULED: Unit B (the D7 read-graph drift check, AC7) rides as a second change under this spec via a named SPEC-CONVENTION §4.8 amendment — Amendment `CFF-P3-A1`.**

- **Why not a follow-up parcel:** the ratified charter graph (P0–P4) assigns the drift check to CFF-P3; a new parcel would mutate the locked decomposition and force a Gate 1 re-open for no gain. §4.8 is the designed authority for growing `Allowed Files` mid-spec, and AC7's landing condition ("a change where CFF-P0's measured artifact is in-tree") is a clean amendment boundary.
- **Amendment content:** the exact Unit B `Allowed Files` paths (the gate-job drift step and any fixture/schema touchpoints) — ratified and **committed alone before Unit B code**, when CFF-P0's read-graph artifact is in-tree. Until then Unit B has no mutation authority.
- **No soft-pass branch** anywhere: where the artifact is absent, the step does not exist (AC7 binds this either way).
- **Dispatch condition:** no Unit B work is dispatched before `CFF-P3-A1` is committed. Unit A dispatch is unblocked now.

## Verdict

**PASS → promote.** `status: draft → active` with the ruling recorded in the spec (Open Questions resolved; AC8/Unit-B name `CFF-P3-A1`). Spec is dispatchable for Unit A under the standing Gate 2 grant.
