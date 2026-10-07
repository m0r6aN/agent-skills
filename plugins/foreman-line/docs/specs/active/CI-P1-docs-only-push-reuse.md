---
ticket: CI-P1
title: Safe Documentation-Only Push Reuse
status: active
owner: clinton.morgan
created: 2026-09-30
updated: 2026-09-30
risk: elevated
surfaces: [.github/, scripts/, plugins/]
routing_class: architecture/risk
permission_profile: builder-architecture
---

# CI-P1 — Safe Documentation-Only Push Reuse

## Intent

Stop re-running the full package sweep when a push to an existing PR lineage changes only ordinary documentation after a verified passing run, while keeping the merge gate exactly as trustworthy as it is today. The reuse decision is derived from GitHub Actions API conclusions plus content-hash equivalence of the five named input classes, is default-deny at every step, and falls back to the full sweep on every uncertainty. This is the first of two chartered parcels (`charter.md` "Proposed Parcel 1"); CI-P2 shards the sweep and must prove this reuse behavior survives under it.

## Current Behavior Record

Recorded against **named refs** (F8). Observed via `git rev-parse` at 2026-09-30:

| Ref | SHA | Role |
| --- | --- | --- |
| `origin/main` | `e5dce4d03c4b83b8646c9517967c1554204e2db3` | the gated base (ruleset `main-pr-gate`); the pinned base for all parcel work |
| `origin/dev` | `e25d6a517ea69853c92aefcd52dd4a8ba4d9e93b` | PR #122 line (`dev`→`main`, developer-owned) — **developer state**, not absorbed |
| working tree | uncommitted `scripts/foreman-line-ci.mjs` (+43/−5), `scripts/foreman-line-ci.test.mjs` (+32/−1) | developer WIP (failure capture), **developer state** — not landed, not dropped, not implemented by this parcel (F8) |

**What runs today** (as of `origin/main` @ `e5dce4d0`):

- `.github/workflows/foreman-line-ci.yml` triggers on **every `push` and every `pull_request`** — no path filters (workflow comment: "No path filters: documentation-only PRs need these named checks too."). `permissions: contents: read` (no `actions` scope — see AC3/F2).
- `test` job (`windows-latest`, 30-min timeout): LF config (`core.autocrlf false`), `actions/checkout@v6` (`fetch-depth: 0`, `persist-credentials: false`), Node `24.19.0`, `node --test scripts/foreman-line-ci.test.mjs`, then `node scripts/foreman-line-ci.mjs <npm-cli>` — a frozen list of **19 packages** under `plugins/foreman-line/` (approval, contract-readers, contracts, dispatch, foreman-config, integration, mutation-scope-guard, permission-profiles, projection, receipts, registration, role-authority, routing-policy, schema-scaffold, shaping, skill-injection, spec-linter, verification, worker-envelopes): phase 1 `npm ci --ignore-scripts --no-audit --no-fund` per package, phase 2 `npm run test`/`typecheck`/`lint` per package, serially ("every install must succeed before any check"); outcomes aggregated to a Markdown table in `GITHUB_STEP_SUMMARY`; exit 1 if any check ≠ pass.
- `integration-report` job (`needs: test`, `if: always()`): exits 1 iff `needs.test.result != 'success'` — it mirrors `test` and never masks failure.
- Job names `test` and `integration-report` are the required status contexts of ruleset `main-pr-gate` (id 22369510, `strict_required_status_checks_policy: true`, `~DEFAULT_BRANCH` = `main`). There is no classic branch protection (lint L3).
- **No classification and no reuse exist today** (lint L5): classification is NEW behavior introduced by this parcel.

**The two cases distinguished (charter AC1):**

1. **Docs-only PR** — every change in the PR lineage is ordinary documentation. Today: the first run still performs the full sweep (necessary — the required contexts must report), and every subsequent docs-only push repeats the full sweep from scratch.
2. **Docs-only push to a mixed PR** — the PR already contains test-relevant changes; an incremental push adds only ordinary documentation. Today: the full sweep repeats again, including all 19 `npm ci` installs. **This is the reuse unit**: a push to an existing PR lineage that changes only ordinary documentation after a verified passing run.

Additional current-behavior fact that bounds every saving claim: each push to a PR branch fires **both** a `push` run and a `pull_request` run, and each sweeps fully — duplicate runs reporting the same context names on one head (pre-existing; see OQ1/OQ3).

**Recorded CI baseline** (lint record, live runs 2026-09-28 → 2026-09-30): ~40 observed runs of `foreman-line-ci`, 99/100 red (exactly one success: run 36513723913, `dev` push, run span 221 s); typical run spans (created→updated) 250–450 s; queue delay is material (~73 min observed on run 36755880046).

**Comparison methodology (SHARED with CI-P2 — stated byte-consistently):** queue-separated (job `startedAt→completedAt` = run time; run created→updated reported separately); runner minutes = Σ job durations, windows-latest 2× multiplier stated. Every elapsed/cost claim in this parcel's closure evidence uses this methodology; the charter assumes no specific savings figure.

## Constraints

Design decisions with rationale (a silently resolved fork is a defect; forks left open are in Open Questions). Standing constraints apply by reference — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` — not restated here.

- **C1 — Evidence source (F2 ruling, adopted).** Prior-run evidence = GitHub Actions API conclusions of a prior run of **this** workflow, retrieved with `GITHUB_TOKEN` after `.github/workflows/foreman-line-ci.yml` gains `actions: read` (today's `permissions: contents: read` makes the Actions-API evidence lookup 403). In-repo evidence files, caches, and artifacts are rejected as evidence stores: forgeable by the very PRs they gate, evictable, retention-bound. Fork PRs: the read-only token still reads the API; no shared store exists by design — fork-lineage evidence unreachable ⇒ fallback, never a new store.
- **C2 — Hash derivation from platform-attested SHAs, never from logs.** `input_hashes` for both the current head and the source run are computed from **git object bytes at the API-attested `head_sha`** (`git cat-file`/tree walk at that SHA — not the worktree). The evidence record in the log/summary is audit-only; the decision never parses it. Rationale: a forged log line cannot influence the decision; the platform attests which commit a run validated, git attests its bytes. (This closes the "self-graded" gap F6 named.)
- **C3 — Decision location (file split).** `scripts/ci-reuse.mjs` (pure decision core + thin CLI; injected `spawn`/`fetch` seams; seam returns are `unknown`, normalized at the boundary — SC #2; typed try-catch at every external boundary — SC #1) and `scripts/ci-reuse.test.mjs` (tests + fixture matrix). The runner `scripts/foreman-line-ci.mjs` and its harness stay **byte-stable**: the fallback sweep is invoked through the runner's existing CLI as a child process, so today's sweep behavior, ordering barrier, and summary emission are unchanged. Rationale: minimal blast radius on the merge gate; the harness's ordering pin is CI-P2's churn, not ours.
- **C4 — Classification precedence (first match wins):** `workflow` > `dependency_inputs` > `specifications` > `ordinary_documentation` (rules 4a–4d) > default-deny bucket `code`. Every tracked path resolves to exactly one class; an unknown path is `code` (test-relevant). Rationale: overlaps (e.g. `plugins/foreman-line/spec-linter/package.json`) must resolve deterministically; default-deny makes silence safe.
- **C5 — Docs-only delta = `git diff --name-status -z <source_sha> <head_sha>`.** The reuse unit is "after a verified passing run", so classification runs over the delta from the **source run's head** (not the push's `before`/`after` pair); both sides of renames are classified; the source head must be an ancestor of the current head (force-push / side history ⇒ `not-ancestor` ⇒ fallback). Null-separated output; path bytes compared exactly (embedded newlines cannot split a path).
- **C6 — merge_context semantics (SHARED definition, plus one strengthening).** The `merge_context` hash covers exactly **base branch + base SHA from the event payload** (`pull_request.base.ref` / `pull_request.base.sha`; `null`/`null` sentinel when the payload carries no base). Reuse additionally requires: same event class for source and current runs (`push`↔`push`, `pull_request`↔`pull_request`; cross-class never eligible), and — strengthening, outside the shared hash — equal resolved `git merge-base <head> origin/<base_branch>` for source and current heads (closes the history-sensitivity residual audited in OQ1).
- **C7 — Failure semantics of the decision machinery.** Any error inside `decide` maps to `decision: fallback` with a `fallback_reason` (default-deny), never a silent green and never a crashed red caused by recoverable uncertainty; a process-level failure that escapes the error mapping reds the head **visibly** (no suppression, no `continue-on-error` on decision or verification steps).
- **C8 — Untrusted text handling (SC #4/#5, lessons #31/#19).** Branch names, PR titles, run names, API strings, and git path bytes are untrusted: sanitize (strip/replace `::`, newlines, CR, ESC/`\x1b`, bidi overrides; length-cap) before any emission into job logs, `GITHUB_STEP_SUMMARY`, or annotations; linear-time parsing only (no backtracking regexes; bounded candidate scans). Hostile-input fixtures mandatory (AC7).
- **C9 — Ordinary-documentation set is derived against the frozen-19 sweep and shrink-only under CI-P2.** The set in AC2 is justified against what `scripts/foreman-line-ci.mjs`, `scripts/foreman-line-ci.test.mjs`, and the 19 swept packages actually read (see table). CI-P2's dynamic discovery expands the swept set (e.g. `authority-registry` tests read `plugins/foreman-line/docs/goals/foreman-kernel/**`, `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`, and package READMEs), which can only **shrink** the ordinary set. The classification table is the named seam; CI-P2 MUST re-derive it (shrink-only) and prove CI-P1 reuse remains valid (charter closure clause).
- **C10 — Risk posture.** `risk: elevated`, `routing_class: architecture/risk` (charter Invariant 5): merge-gate behavior changes; **two independent adversarial reviews** required at closure (gate integrity + evidence validity — see Verification Plan).
- **C11 — Scope of mutation.** This parcel changes `.github/workflows/foreman-line-ci.yml`, adds `scripts/ci-reuse.mjs` + `scripts/ci-reuse.test.mjs`, and may touch `scripts/foreman-line-ci.{mjs,test.mjs}` only if wiring demands (expected byte-stable, C3). The frozen package list, sweep order, install-before-check barrier, `integration-report` mirroring, and both required context names are **unchanged**. Sharding, discovery, and eligibility expansion belong to CI-P2.
- **C12 — Topology seam for CI-P2 (agreed with CI-P2 shaping).** `node scripts/ci-reuse.mjs decide` is the sole decision point and completes **before** any sweep/shard work launches. It exposes `decision` (`reuse|fallback`), `fallback_reason`, `base_sha`, `head_sha`, and `evidence_record` (full record, single-line JSON) as step/job outputs, and exits 0 in both modes. The fallback sweep is a separate step gated on `decision == 'fallback'`; the reuse path is `node scripts/ci-reuse.mjs verify` gated on `decision == 'reuse'`. `verify` always emits the **effective** post-verify decision under the same output names (`decision`, `fallback_reason`, `head_sha`, `base_sha`, `evidence_record`) **before any sweep work**; it invokes the full sweep itself only when a sweep source is supplied (CI-P1's `test` job supplies the runner's CLI, preserving AC5's exit-code contract). A consumer that owns its own fallback sweep — CI-P2's pre-shard gate, which runs `decide` then `verify` in one gate job and tests the effective decision (`== 'fallback'`) to launch its shard matrix — supplies **no** sweep source: a verify flip emits `decision: fallback` and exits 0, and the matrix runs the sharded sweep as the single fallback branch (a reused push runs zero shard jobs). Output names above are a cross-parcel coordination stop: deviation voids CI-P2's gate wiring.

## Acceptance Criteria

### AC0 — SHARED INTERFACE (byte-consistent with CI-P2)

The following five statements are pinned shared text; field names appear verbatim in code, tests, and the emitted record:

- **Evidence record** (emitted to the job log and `GITHUB_STEP_SUMMARY` on every run): `decision: reuse|fallback`, `base_sha`, `head_sha`, `input_hashes: { code, specifications, workflow, dependency_inputs, merge_context }`, `source_run: { run_id, conclusion, input_hashes }|null`, `fallback_reason: string|null`.
- **Classification:** closed-world, default-deny. Enumerated path sets; unknown paths are test-relevant. `docs/specs/**` is the `specifications` class (test-relevant). Define the ordinary-documentation set conservatively: only paths that provably feed no check of this workflow.
- **Required contexts:** `test` and `integration-report` both report on EVERY head in EVERY mode (validated, reused, fallback); CI-P2's single aggregation verdict surfaces through `test`, `integration-report` mirrors it (exactly today's relationship).
- **Workflow permissions:** `.github/workflows/foreman-line-ci.yml` gains `actions: read` (today's `permissions: contents: read` makes the Actions-API evidence lookup 403 — F2).
- **Comparison methodology:** queue-separated (job `startedAt→completedAt` = run time; run created→updated reported separately); runner minutes = Σ job durations, windows-latest 2× multiplier stated.

The evidence-record shape (the pinned field names, no others at top level):

```json
{
  "decision": "reuse",
  "base_sha": "<hex40 | null>",
  "head_sha": "<hex40>",
  "input_hashes": {
    "code": "<hex64>",
    "specifications": "<hex64>",
    "workflow": "<hex64>",
    "dependency_inputs": "<hex64>",
    "merge_context": "<hex64>"
  },
  "source_run": {
    "run_id": 123456789,
    "conclusion": "success",
    "input_hashes": {
      "code": "<hex64>",
      "specifications": "<hex64>",
      "workflow": "<hex64>",
      "dependency_inputs": "<hex64>",
      "merge_context": "<hex64>"
    }
  },
  "fallback_reason": null
}
```

### AC1 — Behavior record exists and distinguishes the two cases

The `## Current Behavior Record` section above records today's behavior against named refs (`origin/main` @ `e5dce4d03c4b83b8646c9517967c1554204e2db3`; `origin/dev` @ `e25d6a517ea69853c92aefcd52dd4a8ba4d9e93b` and the uncommitted WIP recorded as developer state per F8) and distinguishes **docs-only PRs** from **docs-only pushes to mixed PRs**, naming the latter as the reuse unit. Every implementation claim in the closure evidence MUST diff against this record (what changed vs. what was recorded). Baseline and savings claims use the shared comparison methodology.

### AC2 — Closed-world classification table and five-class equivalence table

**Classification table** (first match wins; the only classes are the four path classes below plus `ordinary_documentation`; everything unmatched is `code` = test-relevant):

| # | Class | Rule (repo-relative path) | Justification — what actually feeds the checks of this workflow |
| --- | --- | --- | --- |
| 1 | `workflow` | `.github/**` | `plugins/foreman-line/integration/tests/conformance.test.ts` reads `.github/workflows/foreman-line-ci.yml` directly (marker test over the real file); workflow files define what runs and with which permissions |
| 2 | `dependency_inputs` | any tracked path with basename `package.json`, `package-lock.json`, `npm-shrinkwrap.json`, or `.npmrc` | `scripts/foreman-line-ci.mjs` runs `npm ci` inside each of the 19 package dirs — manifests/lockfiles/npm config determine the installed trees every check resolves against |
| 3 | `specifications` | any path containing a `docs/specs/` segment (`**/docs/specs/**`) | spec-linter tests read the real corpora: `plugins/foreman-line/docs/specs/done/**` (grandfather inventory reconciliation + schema-validation live-corpus tests) and `skills/parcel-compiler/docs/specs/done/**`; SPEC-CONVENTION-governed documents retain validation (charter Invariant 1) |
| 4 | `ordinary_documentation` | (a) any tracked path with basename `README.md` or `AGENTS.md`; (b) `plugins/foreman-line/docs/goals/**`; (c) `plugins/foreman-line/docs/transcripts/**`; (d) repo-root `docs/**` after rule 3 | provably feeds **no** check of this workflow: the runner invokes npm only inside the 19 package dirs; the harness spawns only injected fakes; the tree-walking package tests (`approval` bare-specifier/canonical-parity scanners) collect `*.ts` only; spec-linter reads only `docs/specs` corpora and its own `tests/fixtures`; goal records and transcripts are read by no swept package (their only readers — `authority-registry` tests — are outside the frozen 19; see C9) |
| 5 | `code` (default-deny bucket) | every other tracked path, including **unknown paths** | everything the swept checks read: package sources/tests/fixtures under `plugins/foreman-line/**` (including cross-package relative imports `../../<sibling>/src/**` — e.g. approval→contracts/receipts/projection/shaping, dispatch→approval/contracts/mutation-scope-guard/permission-profiles/receipts/routing-policy), `scripts/**` (runner, harness, reuse module), tsconfig/biome config, and anything unenumerated |

Deliberately **not** ordinary (fall to `code`, test-relevant): `plugins/foreman-line/docs/kickstarters/**` and plugin-level convention docs (`SPEC-CONVENTION.md`, `COORDINATOR-PATTERN.md`, `FOREMAN-LINE-PLAN.md`) — governance documents keep validation (Invariant 1 spirit) and `authority-registry` validates their content; `skills/**` — documentation-shaped but not proven check-free (skill content is validated by `test-plugin-install.yml`, and `skills/parcel-compiler/docs/specs/**` is read by spec-linter tests; the under-detect direction must stay closed — SC #6). A push is **docs-only** iff every changed path (both sides of renames, deletions included) classifies `ordinary_documentation`; gitlink entries and non-regular modes are unsupported ⇒ fallback.

**Equivalence table** — the five classes and exact content-hash semantics. All hashes are computed from **git object bytes at the named SHA** (never the worktree; C2):

| Class | Bytes fed into the hash | Derivation |
| --- | --- | --- |
| `code` | raw blob bytes + file mode + path of every tracked entry at `head_sha` classified `code` (default-deny bucket, AC2 table #5) | `class_hash = SHA-256` over the canonical serialization: entries sorted by path bytes, one line each: `hex(SHA-256(blob bytes)) + ' ' + <mode> + ' ' + <path> + '\n'`; empty class hashes the empty serialization (pinned constant, tested) |
| `specifications` | same inputs for entries classified `specifications` (`**/docs/specs/**`) | as above |
| `workflow` | same inputs for entries under `.github/**` | as above |
| `dependency_inputs` | same inputs for entries classified `dependency_inputs` (manifests/lockfiles/npm config) | as above |
| `merge_context` | `base_branch` + `base_sha` **from the event payload** (`pull_request.base.ref` / `pull_request.base.sha`; `null`/`null` when the payload carries no base) | `SHA-256` over `base_branch + '\0' + base_sha` — exactly base branch + base SHA; no other inputs |

Source-run side: the source run's four tree classes are recomputed from its API-attested `head_sha`; its `merge_context` derives from the workflow-run record's associated `pull_requests[].base.{ref,sha}` when present (platform data), else the `null`/`null` pair. Symlink blobs hash their target string; gitlinks/non-regular modes force fallback (`unsupported-entry`).

### AC3 — Evidence-based reuse decision (mechanism, record, location)

The reuse decision derives **only** from GitHub Actions API conclusions of a prior run of **this** workflow in the same PR/branch lineage whose `input_hashes` equal the current head's for all five classes. Decision rule (all must hold for the first eligible candidate; candidates scanned newest-first, bounded at 10):

1. **Lineage**: same repository, same workflow, same head branch (and same PR number when the event payload names one); source and current runs share an event class (C6).
2. **Conclusion**: the source run is `status: completed` with `conclusion: success` per the API (allowlist-validated).
3. **Ancestry**: the source run's `head_sha` is an ancestor of the current `head_sha` (`git merge-base --is-ancestor`).
4. **Docs-only delta**: every path in `git diff --name-status -z <source_sha> <head_sha>` classifies `ordinary_documentation` (C5).
5. **Equivalence**: the current head's five `input_hashes` equal the source run's recomputed five `input_hashes`.
6. **push-class strengthening**: equal resolved `git merge-base` with the base branch (C6).

Mechanism facts pinned by AC0/F2: `.github/workflows/foreman-line-ci.yml` gains `actions: read`; fork-PR behavior: the read-only token still reads the API; no shared store exists by design (unreachable evidence ⇒ fallback). The decision logic lives in `scripts/ci-reuse.mjs` (imported/runnable standalone per C12); `scripts/ci-reuse.test.mjs` is its harness. The evidence record is emitted to the job log and `GITHUB_STEP_SUMMARY` on every run (both modes) and exposed as the `evidence_record` output; every untrusted string in it is sanitized before emission (C8). Workflow wiring (the `test` job): harness step runs `node --test scripts/foreman-line-ci.test.mjs` and `node --test scripts/ci-reuse.test.mjs`; then `node scripts/ci-reuse.mjs decide` (step id `decide`, `if: ${{ success() || failure() }}`); then the existing sweep step `node scripts/foreman-line-ci.mjs <npm-cli>` gated `if: ${{ (success() || failure()) && steps.decide.outputs.decision == 'fallback' }}`; then `node scripts/ci-reuse.mjs verify` gated `if: ${{ (success() || failure()) && steps.decide.outputs.decision == 'reuse' }}`. `integration-report` is unchanged.

### AC4 — Required-check compatibility (Invariant 4 / F3) with live demonstration

On a reused head the sweep is **replaced** by the evidence-verification step (`node scripts/ci-reuse.mjs verify`) which exits 0 **only after API-verified equivalence**: it re-fetches the source run's conclusion and recomputes both heads' `input_hashes` at verification time; any unverifiable condition emits `decision: fallback` with a `fallback_reason` and — in CI-P1's wiring, where the step supplies the sweep source (C12) — runs the full sweep in its place, exiting with the sweep's exit code (AC5); a consumer owning its own fallback sweep consumes the flipped effective decision instead of an in-step sweep (C12). `test` and `integration-report` both report on EVERY head in EVERY mode (validated, reused, fallback) — no path filters exist or are added — so strict `strict_required_status_checks_policy` stays satisfiable; `integration-report` continues to mirror `needs.test.result` exactly (CI-P2's single aggregation verdict will surface through `test`, `integration-report` mirrors it — exactly today's relationship). **Live demonstration required**: the demo runs in AC6 must show both contexts green on a reused head (with `test` carrying the evidence-verification verdict) and both contexts reporting on every fallback head; run IDs and SHAs recorded in the closure evidence.

### AC5 — Fallback is total and default-deny

Every uncertain path falls back to the full sweep (`decision: fallback`, `fallback_reason` set, sweep runs, exit code = sweep's): missing evidence (no prior run in the lineage), stale/incompatible evidence (hash mismatch in any class, merge-context mismatch, merge-base mismatch, non-ancestor/unreachable source head — e.g. after a force-push —, candidate-cap truncation, expired run history), failed or pending prior runs (`prior-run-inconclusive:<conclusion>` for `failure`, `cancelled`, `timed_out`, `action_required`, `neutral`, `skipped`, `stale`, `null`), classification of an unknown path (`unknown-path`), unsupported entries (`unsupported-entry`), test-relevant changes (`test-relevant-change`), API errors (`api-error`: HTTP ≥ 400, malformed/unvalidated JSON, timeouts, rate limits), and any internal error (`evidence-unverifiable` / `classification-error`). Default-deny everywhere: no enumerated positive rule ⇒ no reuse; `decision: reuse` is reachable only through the full rule chain of AC3.

### AC6 — Demos: local logic checks and live CI evidence

Local logic checks (the `scripts/ci-reuse.test.mjs` suite, AC7) **plus** LIVE CI evidence for all of the following on the parcel PR (base `main`):

- **(a) Eligible reuse fires**: after a verified green run on the parcel branch, a push changing only `plugins/foreman-line/docs/goals/ci-optimization/**` yields `decision: reuse`, `source_run.run_id` = that green run, equal `input_hashes`, both required contexts green, sweep not executed.
- **(b) Falsifiable negatives — a docs-only push with tampered, missing, or incompatible evidence MUST take the fallback**, each with its `fallback_reason` in the record: *missing* (fresh branch with no prior runs → `no-prior-run`); *incompatible* (docs-only push whose nearest successful run fails equivalence — e.g. base moved (`merge-context-mismatch`), a test-relevant commit with only failed runs intervenes (`prior-run-inconclusive:*` / `hash-mismatch:*`), or history rewritten (`source-head-unreachable`)); *tampered* (a forged evidence line in a log cannot affect the decision — pinned by test — and any live unverifiable evidence state falls back).
- **(c) A test-relevant push MUST take the fallback** (e.g. a push touching `plugins/foreman-line/docs/specs/**` or a package source → `decision: fallback`, `fallback_reason: test-relevant-change`), demonstrated live.
- **Red-base contingency (verbatim, F9):** if no verified green prior run can be established for reasons outside the parcel surfaces, STOP AND REPORT — never paper over a red base.

All live demos are recorded with run IDs, head/base SHAs, and the emitted evidence records in the closure evidence, reported with the shared comparison methodology.

### AC7 — Tests and fixture matrix

Test file: **`scripts/ci-reuse.test.mjs`** (node:test; all seams injected; no network, no npm — the contract forbids `npm ci`/`npm install` anywhere in this goal's agent work). `scripts/foreman-line-ci.test.mjs` remains green unchanged. Fixture matrix (inline fixtures; each row at least one test):

- **Per-class refusal, tested independently (SC #3)**: five tests — `code`, `specifications`, `workflow`, `dependency_inputs`, `merge_context` — each mismatching in exactly one class with all others equal ⇒ fallback with that class's reason. Plus per-class positive control (equal ⇒ reuse).
- **Default-deny and boundaries**: unknown path ⇒ `unknown-path`; gitlink/non-regular mode ⇒ `unsupported-entry`; rename ordinary→code ⇒ fallback (both sides classified); deletion of a code path ⇒ fallback; mode-only change on a code path ⇒ fallback; empty delta with equal hashes ⇒ allowed; boundary paths: `docs/specs/x.md` ⇒ specifications, `docs/specs-extra/x.md` ⇒ code, `xdocs/specs/x.md` ⇒ code, `skills/parcel-compiler/docs/specs/done/x.md` ⇒ specifications, `plugins/foreman-line/docs/goals/ci-optimization/x.md` ⇒ ordinary.
- **Under-detect fixtures dominate (SC #6)** — test-relevant shapes that must never classify as docs-only: governed specs under `plugins/foreman-line/docs/specs/active/**`; skill content (`skills/**/SKILL.md` — documentation-shaped but validated elsewhere); `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`; `plugins/foreman-line/docs/SPEC-CONVENTION.md`; any `package.json`/lockfile; `.github/workflows/*.yml`; `scripts/*.mjs`; package sources/tests/fixtures incl. cross-package relative imports; `plugins/foreman-line/*/tsconfig.json`, `biome.json`.
- **Hostile inputs (SC #4/#5, lessons #31/#19)** for everything parsing untrusted text (run names, branch names, PR titles, git path bytes, API JSON): strings containing `\n`, `\r\n`, `::error::`, `::set-output`, `\x1b[`, bidi overrides, NUL-adjacent bytes, 10 KB names; git `-z` output with newline-bearing paths (never split); API bodies with wrong types, missing fields, `conclusion: null`, non-hex or wrong-length SHAs, `run_id` as string/array, huge `workflow_runs` arrays (bounded scan asserted), runs of other workflows/branches/PR numbers/repositories, truncated/garbage JSON, fetch throwing, HTTP 403/405/429/500, timeouts. Assert: all map to `fallback` or sanitized emission; emitted log/summary text contains no raw control characters or `::`-sequences originating from untrusted data; parsing is linear-time (no backtracking regex).
- **Evidence-record schema**: exactly the pinned top-level field names and value shapes (AC0); `source_run` null on fallback; `fallback_reason` null on reuse; record emitted to log **and** `GITHUB_STEP_SUMMARY` on every run in both modes; field names asserted against the literal shared strings (byte-consistency with CI-P2).
- **Log non-ingestion**: a forged `CI_REUSE_EVIDENCE`-style line in captured output does not influence the decision (records are audit-only, C2).
- **Decision/verification behavior**: positive path (docs-only push after green run ⇒ reuse; spawn-spy asserts the sweep is NOT invoked); every fallback row asserts the sweep IS invoked and the process exit code equals the sweep's; `verify` success exits 0 without the sweep; `verify` on tampered/missing/unverifiable evidence emits `decision: fallback` and runs the sweep.

Permanent tests must bind to their named invariants (SC #11): each refusal test must fail when its fixture is mutated back to equal. Deterministic pass: PowerShell, `node -v` first.

### Charter acceptance-criteria mapping (lesson #33 — every charter clause preserved or strengthened, none dropped)

| Charter clause (`charter.md`) | Spec location | Status |
| --- | --- | --- |
| Objective ("reduce unnecessary test execution and full-sweep wall time while preserving merge-gate integrity and complete package coverage; measure against a recorded baseline; no assumed savings") | Intent; AC1; AC6; shared comparison methodology in Current Behavior Record | preserved (baseline recorded; savings are measured reporting, not a target) |
| Invariant 1 — PR-wide classification (ordinary docs = docs-only; governed specs keep validation) | AC2 classification table (`specifications` = `**/docs/specs/**`, test-relevant) | preserved + strengthened (closed-world rules, precedence, boundary fixtures) |
| Invariant 2 — reuse only on verified-passing equivalent evidence (docs-only push alone insufficient) | AC3 (rule chain 1–6), AC2 equivalence table | strengthened (five-class hash equality + ancestry + docs-only delta + merge-base equality) |
| Invariant 3 — missing/stale/incompatible/unverifiable evidence → normal validation | AC5 | strengthened (enumerated `fallback_reason` codes + per-class refusal tests) |
| Invariant 4 — required check identity preserved + branch-protection compatibility verified | AC4 | strengthened (live demonstration required; both contexts on every head/mode) |
| Invariant 5 — elevated risk, two independent reviews | frontmatter `risk: elevated`; Verification Plan step 5 | preserved |
| AC1 — "Record current behavior and distinguish docs-only PRs from docs-only pushes to mixed PRs" | AC1 + `## Current Behavior Record` | strengthened (ref-pinned SHAs per F8, queue-separated baseline) |
| AC2 — "Permit reuse only when a prior successful run has equivalent code, specifications, workflow, dependency inputs, and merge context" | AC2 (five-class table, exact hash semantics per F7) + AC3 | strengthened (hash derivation from platform-attested SHAs per F2/F6) |
| AC3 — "Fall back to normal validation for relevant changes, failed or pending prior runs, unusable history, or evidence uncertainty" | AC5 | strengthened (total enumeration, default-deny) |
| AC4 — "Emit the compared revisions, reuse decision, and source run. The current head's required check must explicitly establish success" | AC0 evidence record + AC3 + AC4 | strengthened (pinned schema per F6, falsifiable negatives, both contexts) |
| AC5 — "Demonstrate eligible reuse and fallback cases through local logic checks and live CI evidence" | AC6 + AC7 | strengthened (named negative classes; red-base contingency verbatim per F9) |
| Scope — "Classification and evidence-based reuse within the existing workflow" | Constraints C11; Out of Scope; Allowed Files | preserved |
| Reviews — "Gate integrity and evidence validity" | Verification Plan mandated focus questions 1 and 4/5 | preserved (two independent reviews, focus questions named) |

Plan-review named deliverables → spec: F8 → Current Behavior Record (ref-pinned); F7 → AC2 tables; F2 → AC0/C1 (`actions: read`, API evidence, fork behavior); F6 → AC0 record schema + AC6(b) falsifiable negatives; F3 → AC4 (both contexts, live demo); F9 → AC6 red-base contingency verbatim; F5 comparison methodology → Current Behavior Record (shared with CI-P2).

## Out of Scope

- CI-P2 entirely: dynamic package discovery, eligibility contract (F4), shard generation/aggregation, per-shard dependency installs, the 19/20/27 reconciliation, and any change to the frozen 19-package list or the install-before-check barrier.
- Event-trigger or path-filter changes (e.g. dropping `on: push`, filtering duplicate runs) — OQ3; the workflow keeps triggering on every push and pull_request.
- `.github/workflows/test-plugin-install.yml`, `scripts/validate-*.js`, and the whole skills-library validation surface (context only).
- Repo settings, rulesets (`main-pr-gate`, `agent-skills-default`), branch protection, required-context renames — Gate 3 / stop-and-report territory.
- The developer's uncommitted failure-capture WIP on `scripts/foreman-line-ci.{mjs,test.mjs}` and all of PR #122's commits (`dev`→`main`): not landed, not dropped, not implemented, not absorbed here.
- Any shared evidence store (cache/artifact/in-repo record) — rejected by design (C1); any Jira/registry work; changes to SPEC-CONVENTION, frozen contracts, or other goals' records.
- Performance/cost targets: the charter assumes no specific savings; measurement is reporting, not a target.

## Allowed Files

- `plugins/foreman-line/docs/specs/active/CI-P1-docs-only-push-reuse.md`
- `.github/workflows/foreman-line-ci.yml`
- `scripts/foreman-line-ci.mjs`
- `scripts/foreman-line-ci.test.mjs`
- `scripts/ci-reuse.mjs`
- `scripts/ci-reuse.test.mjs`

## Assumptions

- **A1 — Git availability**: the checkout already uses `fetch-depth: 0`; the source `head_sha` is reachable locally or fetchable. If not, that is `source-head-unreachable` ⇒ fallback (safe).
- **A2 — Evidence retention**: GitHub retains Actions run history across the demo window (default ≥ 90 days). Expired evidence ⇒ `no-prior-run` ⇒ fallback (safe).
- **A3 — API run metadata**: the workflow-run record's `pull_requests[].base.{ref,sha}` reflects the run-time base (platform data). When absent or unvalidated, merge_context falls to the `null` pair and cross-class rules keep the decision safe (C6).
- **A4 — Red baseline**: 99/100 of recorded runs are red; the eligible-reuse demo therefore begins by establishing a green run through the parcel's own PR runs, per the AC6 contingency.
- **A5 — Duplicate runs**: with both `push` and `pull_request` triggers, one head carries two runs reporting the same context names. Equivalence makes a reused-green verdict imply the inputs a full sweep would see; residual disagreement is flake-level and pre-existing (OQ1).

## Open Questions

- **OQ1 — push-class reuse residual + duplicate-context ambiguity.** The history-sensitivity audit (approval `canonical-parity.test.ts` diffs `git merge-base HEAD origin/main`; `authority-registry` reads pinned git objects; spec-linter reads worktree `docs/specs` corpora — all covered by hash classes + C6's merge-base equality as of `origin/main` @ `e5dce4d0`) holds today; new history-sensitive checks would require tightening push→push eligibility. Separately, push and pull_request runs report the same context names on one head (pre-existing); if review finds that gate-breaking, the safe ruling is: reuse only within `pull_request`-class runs, push-class always fallback.
- **OQ2 — CI-P2 seam.** CI-P2's expanded discovery shrinks the ordinary-documentation set (C9) and its "empty expected-skip set" must treat a reuse-replaced sweep as a **named mode**, not an unexpected skip. Ruled: the classification table is the seam and the set is shrink-only until re-derived; the aggregator consumes the `evidence_record` output (C12), never log scraping. CI-P2 must prove reuse remains valid post-sharding (charter closure clause).
- **OQ3 — duplicate-run cost.** Dropping or filtering `on: push` would remove the largest structural waste (double sweeps per head) but changes which contexts report for branch pushes without PRs. Out of charter scope; developer decision.
- **OQ4 — candidate scan depth.** Newest-first, capped at 10 lineage runs: older green runs may go unexamined (over-fallback, safe). Raising the cap trades API calls for reuse rate; no evidence yet that 10 is wrong.

## Context & References

- `plugins/foreman-line/docs/goals/ci-optimization/charter.md` (ratified charter; ACs and Invariants)
- `plugins/foreman-line/docs/goals/ci-optimization/ci-optimization-lint-2026-09-30.md` (verified ground truth, baseline, boundary facts)
- `plugins/foreman-line/docs/goals/ci-optimization/gate-1-ratification-2026-09-30.md` (authorizations, Gate-3 reality)
- `plugins/foreman-line/docs/goals/ci-optimization/plan-review-findings.md` (F1–F10 triage)
- `plugins/foreman-line/docs/goals/ci-optimization/loop-directive.md` (topology, PR #122 protocol, WIP protocol, stop valves)
- `plugins/foreman-line/docs/SPEC-CONVENTION.md` (spec schema; §4.8 mutation authority)
- `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` (builder/reviewer constraints, by reference)
- Surfaces: `.github/workflows/foreman-line-ci.yml`, `.github/workflows/test-plugin-install.yml` (context only), `scripts/foreman-line-ci.mjs`, `scripts/foreman-line-ci.test.mjs`

## Verification Plan

1. **Deterministic pass** (PowerShell, `node -v` first): `node --test scripts/ci-reuse.test.mjs` and `node --test scripts/foreman-line-ci.test.mjs` both green (the latter byte-stable per C3); workflow YAML validation of `foreman-line-ci.yml`; closure diff check against `## Allowed Files` (coordinator).
2. **Local logic checks**: the full AC7 fixture matrix green, with each refusal test proven binding by mutation (SC #11).
3. **Live CI evidence** per AC6: named run IDs/SHAs and emitted evidence records for the positive demo and every negative class; both required contexts green on the reused head and reporting on every head (AC4); the red-base contingency honored (verbatim clause in AC6).
4. **Cost reporting** (not a target): shared comparison methodology applied to the demo runs (queue-separated run times; runner minutes with the windows-latest 2× multiplier stated).
5. **Two independent adversarial reviews** (charter Invariant 5; elevated risk): one gate-integrity review, one evidence-validity review; every finding triaged; findings are a floor, not a ceiling.

**Mandated reviewer focus questions** (assess each field-by-field):

1. **Trust-chain honesty**: a hostile PR author controls `scripts/ci-reuse.mjs` at the validated head. Does the spec claim any anti-forgery the design cannot deliver, and does the reuse path weaken the merge gate relative to today's sweep (which already runs PR-controlled code)? The intended answer is "no weakening, boundary stated honestly" — attempt the naive reading and show the text excludes overselling (SC #9).
2. **Under-detect closure**: implement the naive reading of the AC2 classification rules. Is there ANY changed-path shape (rename, case-collision, path containing newline/`::`/ESC, `docs/specs` under a new top-level directory, submodule/gitlink, mode-only change, CRLF-only change) that classifies as `ordinary_documentation` yet can flip a check's outcome? The under-detect direction must be impossible, not merely tested (SC #6).
3. **merge_context sufficiency**: walk every history-sensitive check you can find (approval `canonical-parity.test.ts`, `authority-registry` pinned-object reads, spec-linter live-corpus reads, `integration` conformance) and the strict-policy merge-commit semantics. Does the AC3 eligibility chain guarantee a reused head would produce the source run's verdict? Where it does not, is the residual either closed or honestly parked in OQ1?
4. **Cross-parcel consistency**: is the evidence-record schema byte-consistent with CI-P2's (field names verbatim, same emission points), does the C12 seam actually let CI-P2 gate shards before the sweep launches, and do both required contexts report on every head in every mode with strict policy satisfiable (AC4)?
5. **Fallback totality (mutate to prove)**: is every uncertainty path enumerated in AC5, and does any code path reach `decision: reuse` without an API-verified success conclusion at an equivalent head? Break each guard in turn (forged log line, stale conclusion, wrong event class, non-ancestor) and confirm the decision flips to fallback (SC #11, C7).