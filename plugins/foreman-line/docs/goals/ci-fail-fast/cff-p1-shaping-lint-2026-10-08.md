# CFF-P1 shaping lint (coordinator) — 2026-10-08

**Coordinator session:** the `/goal resume` coordinator session (ownership per
`loop-directive.md`; third iteration).
**Artifact linted:**
`plugins/foreman-line/docs/specs/active/CFF-P1-change-proximity-ordering-and-early-red.md`
(draft at lint) + `cff-p1-change-proximity-ordering-and-early-red.shaping-result.json`,
uncommitted on `feat/foreman-line-CFF-P1` @ `032f8a4a` (drafted at `fcaa4b1a`;
worktree `../foreman-line-cff-p1`).
**Method:** every factual claim re-read/re-measured on disk before acceptance.
Lint host: Linux, node v26.8.2 — verification-of-claims only; build-stage
deterministic passes run per the spec's Verification Plan.

## Claim-by-claim verification

All line citations re-checked against the worktree HEAD (scripts unchanged
since drafting HEAD `fcaa4b1a`; last scripts change `145da132` — confirmed via
`git log -- scripts/`).

| Spec claim | Disk check | Result |
|---|---|---|
| `discoverPackages` :212 | line 212 exactly (`export function discoverPackages`) | **CONFIRMED** |
| `COST_TABLE` :277, 27 entries, keyed by name | line 277 exactly; `Object.keys(COST_TABLE).length === 27` | **CONFIRMED** |
| ~~stale `hybrid-routing` entry "for a package no longer discovered"~~ | `discoverPackages` returns 30 names **including `hybrid-routing`** (package.json last touched `da59a0d3`; `hybrid-routing: 17.2` at :285 is a live, priced entry; hybrid-routing ran in shard 3 of CFF-P0's measured sweep) | **REFUTED — erratum E1** (correction ruled below; the "harmless" conclusion survives for the opposite reason: the entry is live, not dead) |
| `costKnown` gate `.every(...)` over the discovered list | :339–345: `orderedNames.every((name) => Number.isFinite(costTable[name]))`, all-or-nothing, round-robin fallback | **CONFIRMED** |
| 30 discovered, missing exactly `kernel-import`, `ops-console`, `project-scaffold` | live `discoverPackages` + diff against `COST_TABLE` keys | **CONFIRMED** (exactly those three) |
| `assignShards` :319; live 8/8/7/7 at shardCount 4, byte-identical to pure round-robin | ran `assignShards(names, 4)` → sizes 8/8/7/7; deep-equal to naive `i % 4` round-robin | **CONFIRMED** |
| `WAIVED_EXCLUSIONS` :517, 4 entries (`bypass-outage-harness`, `kernel-lease`, `authority-registry`, `jev-decisions`) | line 517 exactly; 4 frozen entries, identities match | **CONFIRMED** |
| `EXPECTED_SKIPS` :623, empty | line 623 exactly, `Object.freeze([])` | **CONFIRMED** |
| `OUTCOMES_SCHEMA` :788 / `buildShardOutcomes` :816; no `additionalProperties: false` in consumers | lines exact; consumers (:818, :1008, :1042, test :28/:171) — grep finds no `additionalProperties` anywhere in the outcomes path | **CONFIRMED** (additive named field is safe) |
| `runShard` :837; phase-1/phase-2 barrier; phase 2 iterates `mine` with no early exit; pre-populated `skipped` | :837 exact; `mine = assignShards(...)` :860; "Phase 1: ALL installs before ANY check (per-shard barrier, AC4)"; phase-2 loop runs every check for every `mine` package to completion today; records pre-populated `skipped` for all names | **CONFIRMED** |
| per-pair `output` = `${stdout}${stderr}`, one `invoke()` per (package, check) | `invoke` :868–889, sequential loop, no concurrency surface | **CONFIRMED** |
| waiver-rejection carries `evaluation.layer` (AC5's annotation field source) | `waiver_rejected[check] = { layer: evaluation.layer, ... }` :931–936 | **CONFIRMED** |
| `runCli`'s `shard` branch writes the artifact before checking `result.exitCode` | `writeFile(join(dir, 'shard-outcomes.json'), ...)` precedes `return result.exitCode` | **CONFIRMED** |
| workflow upload step `if: ${{ !cancelled() }}` (no workflow edit needed) | `.github/workflows/foreman-line-ci.yml` :127–131: upload-artifact@v4 under `if: ${{ !cancelled() }}`, path `shard-outcomes/shard-outcomes.json` | **CONFIRMED** (a failed shard job is not cancelled; the partial artifact uploads) |
| `sameSet` :962, call sites :1047/:1089/:1108 | all four lines exact | **CONFIRMED** |
| `reconcile`'s `missing-checks`/`unexpected-skip`/`shard-fail`/`shard-error` codes :1058–1083 | codes present in range; `unexpected-skip` fires on any `skipped` check with `EXPECTED_SKIPS` empty | **CONFIRMED** |
| `verdict()` :1150; `gateResult !== 'success'` → `gate-failed` :1151 | lines exact | **CONFIRMED** |
| `buildSummary` :1163 | line exact | **CONFIRMED** |
| `sanitizeField` :140 / `sanitizeOutput` :175 (`::` → `: :`, bidi → `?`, caps) | lines exact; neutralizations as described | **CONFIRMED** |
| ci-reuse: rule 0 (event-name gate) at :746 — re-cited from kickstarter's :623 | :746 carries the rule-0 comment ("only pull_request-class runs are ever eligible"); kickstarter's :623 is stale exactly as the kickstarter itself flagged ("re-cite at build") | **CONFIRMED** (drift as predicted, accounted for) |
| ci-reuse: `GITHUB_EVENT_PATH` seam :1086, unchanged | line 1086: `event = JSON.parse(read(envString(env, 'GITHUB_EVENT_PATH'), 'utf8'))` | **CONFIRMED** |
| ci-reuse: `parseNameStatusZ` :416, `classifyPath` :175, `READER_SET` :129 (25 entries) | lines exact; `READER_SET.length === 25` | **CONFIRMED** |
| no existing shared "changed paths from the event" export — AC6 adds the first | full export list read (` CiReuseError … runCli`); `decideCore`/`verifyCore` consume diffs internally; no changed-paths-from-event export exists | **CONFIRMED** |
| pre-existing evidence-verification diff at ci-reuse `:835` (a different, already-reviewed use) | :835 `gitBytes(git, ['diff', '--name-status', '-z', ...])` inside `verifyCore` | **CONFIRMED** |
| CFF-P0 records present in-worktree (`cff-p0-waiver-input-contract.md`, `cff-p0-assignment-and-waivers.md`, `read-graph/measurement-log.md`) | all three present | **CONFIRMED** |
| AC4's cited green-run evidence: run `37674775022` @ `fb25630` | `gh run view`: completed, success, headSha `fb25630c…` | **CONFIRMED** |
| scripts last changed `145da132` | `git log -- scripts/foreman-line-ci.mjs scripts/ci-reuse.mjs` tip is `145da132` | **CONFIRMED** |
| spec-linter | `spec-linter validate --repo-root …` → exit 0; advisories only (`scripts/` surfaces prefix) — same class the shipped CI-P2 spec carries | **PASS** (advisories non-blocking, precedent held) |
| shaping-result format | `parcelSpecRefs` + `epics: []` — byte-shape matches CFF-P0/CFF-P3 peers | **CONFIRMED** |

## Errata (coordinator-ruled corrections, applied to the spec at promotion)

- **E1 (REFUTED claim, Constraints + AC3):** the draft called `COST_TABLE`'s
  `hybrid-routing` key "a stale entry for a package no longer discovered."
  Re-measured: `hybrid-routing` **is** discovered (30-name list above) and its
  entry is live. The load-bearing facts (27 entries; exactly three missing
  names; all-or-nothing `costKnown` gate; round-robin-identical live
  assignment) are all confirmed and unchanged. Corrected in place; AC3's
  directive ("existing 27 entries untouched") is unaffected.
- **E2 (mechanism imprecision, AC5(a)):** the draft described a
  `kind !== 'exit'` invoke result as "never reach[ing] waiver evaluation."
  On disk every failure **does** reach `evaluateWaiver` (`:918`) and non-exit
  kinds are rejected at its kind-gate (`:701`, `record: null`). Same outcome
  (a non-waived failure), wrong path description. Corrected in place; the
  AC5(a) trigger ("the `evaluation.record === null` branch") already covered
  the case correctly.
- **E3 (stale reference path, Context & References):** the draft cited
  `docs/specs/active/CI-P2-deterministic-sweep-sharding.md`; CI-P2's spec
  moved to `docs/specs/done/` at its Stage F (`7e0735a6`, `c5ca76d6`), and
  the 2026-10-08 hygiene sync made `done/` the authority. Path corrected.

None of the errata touch a locked decision (D3/D6/D7/D8/D10/D11 re-verified
against the corrected text), an acceptance behavior, or the Allowed Files
list — no Gate 1 re-open, no amendment required. Recorded openly per the
lint's verify-every-claim mandate; the spec's own "re-cite at build"
discipline remains in force for the builder.

## AC ↔ charter diff (lesson #33)

- The spec's own "Charter → spec AC mapping" table was re-diffed row by row
  against the ratified charter (D3/D6/D7/D8/D10/D11, exit criteria 4 and 6).
  Every row is strengthening-only: proximity pinned to D7's actual binary
  per-package shape (no invented distance metric); fail-closed scope bounded
  to ordering, never shard membership; annotation fields fixed-shape +
  `sanitizeField`, never raw output; cost-table re-pin named as a deliberate
  mechanism flip with before/after loudness; D11's single-export seam with
  the fail-closed signal shape pinned; no early-green path anywhere.
- **Exit criterion 4** restated faithfully and correctly routed: this parcel
  is the mechanism; CFF-P4 performs the live demonstration. No weakening.
- **Exit criterion 6** negative controls each mapped to a named, falsifiable
  AC8 test (reordered-output waiver invariance → AC7/AC8; affection-pin
  error → full discovery-order fallback → AC2/AC8; early-red never alters a
  verdict → AC5/AC8). The platform-skip and uncovered-pin-read clauses bind
  CFF-P2/CFF-P4 surfaces, correctly not claimed here.
- `risk: critical` / `routing_class: architecture/risk` → **two independent
  adversarial reviews** are mandated at build completion; the Verification
  Plan's seven focus questions are well-formed (hostile-input probing
  licensed, mutate-the-fixture discipline cited per standing constraint #11).

## Open Questions disposition

All three open questions are deliberately build-time and behavior-pinned
(export identifier naming; the three measured `COST_TABLE` wall-second
figures; per-waiver disposition outcomes) — the spec pins the contract and
leaves only the measurement/naming to the builder, each required to be
recorded in the completion report. **No coordinator ruling required; no
question blocks dispatch.**

## Verdict

**PASS → promote.** `status: draft → active` with errata E1–E3 corrected and
this lint filed. Spec is dispatchable for build under the full-graph Gate 2
grant (2026-10-08), with the charter-mandated **two independent adversarial
reviews** (`anthropic/claude-opus-5-5`, per the reviewer model policy) at
completion, before any Gate 3 request.
