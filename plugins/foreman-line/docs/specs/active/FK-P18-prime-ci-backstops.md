---
ticket: FK-P18
title: Foreman Kernel - CI scope and state-evidence backstops
status: draft
owner: clinton.morgan
created: 2026-10-02
updated: 2026-10-02
supersedes: null
superseded_by: null
risk: critical
surfaces: [.github/workflows/**, plugins/foreman-line/docs/goals/foreman-kernel/**]
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
---

# FK-P18′ — CI scope and state-evidence backstops

## Intent

Ship the FK-P18′ CI backstops: a GitHub-hosted workflow that mirrors the exact-scope
(class-1, post-action realpath-aware diff), enrollment, state/evidence, and dirty-reviewer
(class-3) invariants in CI as independent, mechanically-checked gates — the invariants the
enforcement hook will later carry — and a fail-closed negative control that mutates outside
the hook and **must turn those backstops red before FK-P19 may promote enforcement**
(D13: "CI lands before enforcement promotion"). The backstops execute on hosts the hook
does not run on (INF-4; ADR-001 §Consequences — host independence is load-bearing), consume
the U1 evidence contract's named records (configuration checklist, expected-outcome oracle,
verifier seal — seal-only) as inputs under the contract's three-state discipline, assert
only A1.3 coarse CI regression bounds over FK-P17′ measurement records, and emit one
committed FK-P18′ evidence record proving the backstops are load-bearing, not decorative.

## Constraints

### Dependency and dispatch boundary

**Status: draft — not dispatchable** (SPEC-CONVENTION §3). No spec text here claims
dispatch. Dispatch requires both gates below; on both, this spec dispatches immediately
with no further amendment.

1. **Coordinator lint promotion** of this spec `draft` → `active` (charter §15.3; standard
   pre-dispatch prerequisite 4).
2. **Charter §14 / E7 — the U1 §8 closure ACCEPT (parcel-specific; PENDING).** Charter §14:
   "Before FK-P18 implementation dispatch, a concrete independently reviewed contract must
   bind protected verifier/workflow control, builder-input limits, credentials and runner
   lifecycle, independent negative controls, evidence identities/retention, and bounded
   unsupported/unavailable outcomes." The concrete contract is
   `U1-contract-2026-09-29.md` as amended by `U1-8-closure-amendments-2026-10-01.md`
   (A-U1.8.01–A-U1.8.16, owner-ratified 2026-10-01). Its §8 review protocol must complete
   with a reasoned ACCEPT over the closure package (`U1-8-closure-report-2026-10-01.md`,
   the amendments, the re-cut pin record, the shakedown decision/seal). **State at shaping
   (2026-10-02): verdict pending** — `U1-8-closure-rereview-dossier-2026-10-01.md`
   (recorded digest `9093511c…`) is submitted to the §8 reviewer of record
   (`anthropic/claude-sonnet-5-5`); the prior §8 round returned FINDINGS
   (`U1-8-review-verdict-2026-10-01.json`), all 18 closed by the amendments per the
   closure report. The ACCEPT verdict is a coordinator-side record; this spec does not
   adjudicate it.
3. **F-12 dispatch preconditions P1–P3, checked at dispatch** (closure report F-12 row):
   the builder credential holds no bypass/admin/environment rights; ≥ 1 approval +
   code-owner review is restored when the builder identity exists; the `main-pr-gate`
   bypass sunset is tied to a green baseline. Any unmet precondition is a dispatch stop.

**Dependency (exact):** FK-P17′ (merged; `docs/specs/done/FK-P17-bypass-outage-matrix.md`)
— read-only evidence shapes (`evidence/matrix.json`, `evidence/summary.json`,
`evidence/manifest.json`, `evidence/measurement-summary.json`), its D13 honesty rules, and
its three-state pin/gap pattern. NOT FK-P16/FK-P19 (deferred): no adapter, no hook
registration, no enforcement, no promotion.

**E6 (plan-review-findings):** RS-1.4(d) "CI backstops green" carries an unowned
prerequisite — the plugins `test` job recorded failing every run
(`fk-wave3-4-marginal-value-2026-09-27.md` P18 row). This spec's default disposition is
**waive-and-record**: "CI backstops green" is read as this parcel's named
`fk-p18-ci-backstops.yml` checks; the failing job is a named waived prerequisite recorded
in the FK-P18′ evidence record. OQ-1 lets the coordinator instead assign the fix here
(requires a recorded `foreman-line-ci.yml` window). The disposition must be settled before
dispatch; it is never silently dropped.

### Owned surfaces and write boundary

Per RS-2.5 item 3, FK-P18′ is the named owner of its CI backstop files: the
`test-plugin-install.yml` scope per ADR-001 and any new workflow files this spec names
exactly. `foreman-line-ci.yml` remains outside its write set unless a window is recorded.
Everything else is read-only input or forbidden (exact list under **Allowed Files**).
FK-P2 compiled-scope output is consumed read-only "where available" under the three-state
rule (RS-1.2); never a hard prerequisite (FK-P17′ precedent).

### Invariant mirrors (closed registry, 4 rows)

The backstops mirror the invariant families of the U1 IA-5 table (IDs verbatim; refusal
classes the IA-6 `WireCode` spellings verbatim — a second vocabulary is never introduced).
"Class-1/class-3" are the RS-1.2 labels for the exact-scope and dirty-reviewer residuals
(`fk-wave3-4-marginal-value-2026-09-27.md` §2: "classes 1 & 3, cheaply closable as
CI/diff invariants (post-action realpath-aware diff; dirty-reviewer check)").

| ID | Mirror (RS-1.2 label) | IA-5 | Mechanical check | IA-6 refusal class / disposition | FK-P17 anchor |
|---|---|---|---|---|---|
| BM-1 | exact-scope — class-1 post-action realpath-aware diff | INV-U1-01 (+ INV-U1-02 identity precondition) | the change set of the PR/push diff, each changed path resolved to its **realpath** before membership testing (symlink/reparse/case-alias aware), checked against the compiled Allowed Files authority; frozen surfaces immutable; run branch/tree identity equals the recorded diff base | `PATH_OUTSIDE_ALLOWED_FILES`, `FROZEN_SURFACE_MUTATION`, (`WORKTREE_MISMATCH`/`BRANCH_MISMATCH` on identity mismatch) | T2 CTL-01/02; V1–V4, V6 |
| BM-2 | enrollment — mediation-coverage detection | INV-U1-06 | `hooks/hooks.json` registration (SessionStart + PreToolUse) and plugin enrollment present in the checked-out tree; missing/disabled registration detected | none — **detected-only** (`SESSION_ENROLLMENT_MISSING`; D7: a missing/non-loaded hook is detected, never described as refused) | V7 NRE-01…03 |
| BM-3 | state/evidence | INV-U1-05 | every consumed state/evidence record present, digest-bound in a manifest, and revision-current (its bound commit is the run SHA or an ancestor); gate satisfaction of the named checks recorded | `STATE_REVISION_STALE`, `OWNER_LEASE_MISMATCH`, `GATE_NOT_SATISFIED` | V8 SST-01…03; V10 RST-01/02 |
| BM-4 | dirty-reviewer — class-3 | INV-U1-03 | no reviewer-attributed mutation in the diff; the reviewer worktree-clean assertion matches the reviewed tree | `REVIEWER_MUTATION_FORBIDDEN`, `REVIEW_WORKTREE_DIRTY` | standing #10 / R10; `INVALID_REVIEW_BINDING` adjacent |

INV-U1-04 (policy integrity) is **not** mirrored here — it is the U1 verifier lane's
evaluation; FK-P18′ never claims it. BM-2's output is a detection record, never a refusal
(D13/D7). Every mirror derives its verdict from candidate inputs directly; reusing a hook
verdict, compiled result, or success flag is insufficient (U1 §3.4.5, PIN-03).

### Negative control — fail-closed proof (closed registry, 7 cases)

The negative control **bypasses the enforcement hook**: seeded violations are raw
mutations/diff states in throwaway temp workspaces, with no mediated surface invoked (the
FK-P17 V1 channel shape: `guardInvocation: false`). If a seeded case routes through
`hooks/model-gate.mjs`, `dispatch/src/approval-cli`, or `mutation-scope-guard`, the case is
invalid. Each case runs the **real backstop checker as a child process** — never a
reimplementation, never a mock echo — and the parent asserts the child's captured exit
status **and** its output naming the specific violation code (standing #14). A case whose
child exits 0, or whose output lacks the named code, makes the workflow **FAIL**: that is
the "negative control must fail CI before enforcement promotes" requirement — proven
load-bearing, not decorative.

| ID | Seeded violation (hook bypassed) | Required backstop outcome |
|---|---|---|
| NC-FK18-01 (**must-prove**) | direct write to a path outside every Allowed Files | BM-1 exits non-zero naming `PATH_OUTSIDE_ALLOWED_FILES` |
| NC-FK18-02 | mutation of a frozen surface | `FROZEN_SURFACE_MUTATION` |
| NC-FK18-03 | symlink/reparse write-through (in-scope link → out-of-scope target); case-variant/trailing-dot alias where the platform supports it | realpath-aware diff reports the **resolved target**; `PATH_OUTSIDE_ALLOWED_FILES` |
| NC-FK18-04 | enrollment removed (registration absent) | BM-2 detection record `SESSION_ENROLLMENT_MISSING`, classification `detected` — never `mechanical`, never a refusal (D7) |
| NC-FK18-05 | stale/mismatched state record (bound revision ≠ run lineage) | `STATE_REVISION_STALE` |
| NC-FK18-06 | dirty reviewer worktree / reviewer-attributed mutation | `REVIEW_WORKTREE_DIRTY` / `REVIEWER_MUTATION_FORBIDDEN` |
| CTL-FK18-01 | positive control: clean in-scope change | all four mirrors pass, exit 0 (allow baseline; proves non-vacuousness both directions) |

**Expected-outcome authority (A-U1.8.04 semantics).** Where a promotion request is bound,
each NC case's expected exit status / refusal class / classification / required signals are
compared against the **coordinator-owned expected-outcome oracle record** — never against a
builder-authored `expected` field (the producer's `expected` is ignored as an oracle and is
compared to nothing). Resolution is through the oracle's closed rows only: a case's
expected refusal classes resolve through `invariantExpectations[]` for its mapped IA-5
invariant (`expectedRefusalClassIds[]`, the IA-5 column-5 mapping, plus `minExercisedRows`),
and through `controlExpectations[]` (`expectedExitStatus`, `expectedRefusalClassId`,
`expectedClassification`, `requiredSignals[]`) where the case corresponds to a closed
IA-11 control row (mapping recorded per case). Where no promotion request is bound, the
cases run against the expectations declared in this spec, recorded as provisional and never
claimed oracle-conformant. Three-state, per case: (a) request + oracle bound and
digest-matched → oracle-conformant comparison; (b) not bound → machine-readable gap record
`blocked: no promotion request bound`, never a pass; (c) digest mismatch → fail closed
(`PIN_DRIFT`). Not-run ≠ passed (FK-P17 rule 4) in every state.

**IA-11 relationship (live-row obligation, carried honestly).** The closed U1 control set
is `NC-U1-01 … NC-U1-13`; the closure report §4 records that "the first REAL evidence cycle
(FK-P18′) must exercise them against live rows", and A-U1.8.04/§7.6 admits **only the
three named PIN-09 inherited gaps** (file-symlink privilege case, CTRL-01, the
`outage.ts` realpath sweep) as `not-exercised` gap rows — any other gap makes the control
`INCOMPLETE`/`U1_REQUIRED_EVIDENCE_MISSING`, and a control whose rows are all gaps is never
ACCEPT. Each NC-FK18 case therefore records its IA-5 invariant + IA-6 class + any
corresponding IA-11 control ID (e.g. NC-FK18-04/05/06 are the three independent failures
of NC-U1-02; NC-FK18-03 exercises the NC-U1-07 artifact-closure/alias rejection seam).
Whether FK-P18′ carries the full 13-row live exercise or only the rows whose channel is the
CI/diff/detection lane is an open question (OQ-9); this spec never claims rows it does not
exercise.

### U1 named record inputs (consumption contract)

The backstops consume the U1 evidence contract's records as **named, digest-bound inputs**.
Digest classes follow A-U1.8.01: a document digest and a byte digest are distinct values;
comparing one against the other is a failure, never a pass. Every consumption is
three-state: (a) present + digest-matched → consumed; (b) named absence → gap record,
never a pass; (c) drift/mismatch → fail closed.

| Record | Exact path | Consumption |
|---|---|---|
| Configuration checklist record (`u1-configuration-checklist/v1`) | `plugins/foreman-line/docs/goals/foreman-kernel/U1-configuration-checklist.json` | read-only; committed-bytes SHA-256 re-checked against `configurationChecklistSha256` in `U1-verifier-pin.json` and `configurationChecklistDigest` in the promotion request; mismatch → `PIN_DRIFT`; `entries[]` §5 recorded/unrecorded state annotated in the evidence record; never itself an ACCEPT |
| Expected-outcome oracle record (`u1-expected-outcome-oracle/v1`) | `plugins/foreman-line/docs/goals/foreman-kernel/promotion-requests/<promotionRequestId>/expected-outcome-oracle.json` | sole expected-outcome authority for NC rows (A-U1.8.04); bound by `oracleDigest` (IA-2.8) in the promotion request `plugins/foreman-line/docs/goals/foreman-kernel/promotion-requests/<promotionRequestId>.json` and in `U1-verifier-pin.json` |
| Verifier seal (`u1-seal/v1`) | `u1/m0r6an/agent-skills/verifications/<promotionRequestId>/a<K>/seal.json` | **seal-only consumption** (A-U1.8.09): `audit/decision.json` alone is never a consumable record; a decision without a matching seal is never evidence. Order: enumerate the revocation prefix `u1/m0r6an/agent-skills/revocations/` FIRST (A-U1.8.14 — a seal whose `decisionDigest` appears in a revocation record, or whose `sealedAt` falls in a `revocationWindow`, is never consumable); then require `retentionObservationResult: match` and matching sealed decision digests; any failure refuses the seal |
| Pin record | `plugins/foreman-line/docs/goals/foreman-kernel/U1-verifier-pin.json` | identity-binding source for the two committed records and the protected verifier revision (`workflowCommit`, `workflowFileSha256`); read-only |

The blob-store read path (seal/revocations) needs a read-only credential — an external act
(see OQ-6). If none is provisioned at dispatch, seal consumption runs in three-state (b)
(`blocked: no U1 read credential`) and the two repo-tree records are fully consumed.

### A1.3 coarse CI regression bounds only (RS-2.5)

One bounds job consumes FK-P17′'s `plugins/foreman-line/bypass-outage-harness/evidence/measurement-summary.json`
read-only (three-state) and asserts **only a coarse regression bound**: fail when a
warm-population p99 exceeds **10× its F05.16 budget** (`mediatedActionLatency` >
1,500,000 µs; `kernelDecisionLatency` > 500,000 µs) or the record is structurally invalid.
No fine-grained percentile gating, no p50/p95 gates, no latency measurement in CI. Every
bounds record carries the ceiling statement: **a CI latency assertion is never platform
evidence** (A1.3); the authoritative measurement remains FK-P17′ on the proven host. The
10× figures are shaping-time defaults (OQ-7).

### INF-4, host independence, external-action pinning

- **Independent-host backstop (INF-4; ADR-001 §Consequences).** Every backstop job runs on
  a GitHub-hosted runner (`windows-latest` — GitHub-hosted, matching the repo's package-CI
  precedent, and the NTFS reparse/case-alias semantics of the V4 evasion classes are real
  there). The workflow records runner facts per run (runner name/label, `ImageOS`,
  `ImageVersion`, `RUNNER_*`) and fails closed when the runner environment is not
  GitHub-hosted. Host independence is load-bearing — see Assumptions.
- **External actions pinned per the reviewed CI contract** (INF-4, PIN-06; U1 §3.1.1,
  §3.1.5): every `uses:` in both touched workflows is pinned by **full 40-hex commit SHA**
  with a version comment; container inputs are pinned by content digest; a mutable runner
  label or image tag is never a tested identity. A branch- or tag-pinned external action is
  a failing defect.
- **CI job URLs are navigation pointers, never sole durable evidence** (INF-4; U1 §3.5.4).

### Standing constraints (binder)

`STANDING-CONSTRAINTS.md` applies in full; this parcel leans on: #1 (typed boundaries),
#10 (post-review clean-worktree control — the standing basis of BM-4), #12 (no moving-ref
byte pins in shipped checks; merge-idempotence), #13/#20 (pinned sets pin identity +
location + value and assert cardinality both ways), #14 (a spawned checker must prove it
ran: exit status AND named-violation output), #16/#19 (absence-proving checks enumerate
mechanisms and publish unmodeled cases), #17 (enumerations reconciled against disk both
ways), #21 (environment assumptions recorded in the evidence record), #19/#31 (linear-time
parsing; sanitization of all external text before emission), #34 (this parcel adds no
`package.json`; the governed package list is byte-unchanged — enrollment N/A, asserted).
External text (hook output, record fields) is sanitized before any summary/annotation
emission (standing #4/#31).

## Allowed Files

Exact mutation authority (SPEC-CONVENTION §4.8). Exactly 3 files:

- `.github/workflows/fk-p18-ci-backstops.yml` — **new**. The complete backstop surface:
  the four invariant mirrors, the negative-control registry and its fail-closed
  meta-assertions, the A1.3 coarse-bounds job, the U1 record consumption (three-state),
  the runner-facts/host-independence check, the action-pin lint, and run-summary emission.
  All check logic is inline in this file (the workflow is the single source; no helper
  package is created).
- `.github/workflows/test-plugin-install.yml` — **sole permitted delta: one named FK-P18′
  integration edit** wiring the `fk-p18-ci-backstops` checks as a named gate on the
  plugin-CI surface (ADR-001 Tier 1 / RS-2.5 item 3). No other change to this file; if
  OQ-4 resolves standalone-only, this file is left untouched and this row is withdrawn by
  spec amendment.
- `plugins/foreman-line/docs/goals/foreman-kernel/fk-p18-prime-ci-backstop-evidence.md` —
  the FK-P18′ evidence/report record (run identity, per-case outcomes, U1 record digests,
  host facts, gap records; see AC13).

**Forbidden surfaces (exact):** `.github/workflows/foreman-line-ci.yml` (outside the write
set unless a window is recorded — RS-2.5 item 3), `.github/workflows/u1-verify.yml` and
`.github/workflows/u1-produce.yml` (protected verifier workflows), `plugins/foreman-line/hooks/**`,
`plugins/foreman-line/dispatch/**`, `plugins/foreman-line/mutation-scope-guard/**`,
`plugins/foreman-line/routing-policy/**`, `plugins/foreman-line/skill-injection/**`,
`plugins/foreman-line/contracts/**`, `plugins/foreman-line/authority-registry/**`,
`plugins/foreman-line/kernel-contracts/**`, `plugins/foreman-line/spec-body-compiler/**`,
`plugins/foreman-line/spec-linter/**`, `plugins/foreman-line/bypass-outage-harness/**`
(FK-P17′ — read-only), `plugins/foreman-line/docs/SPEC-CONVENTION.md`,
`plugins/foreman-line/docs/goals/foreman-kernel/U1-verifier-pin.json`,
`plugins/foreman-line/docs/goals/foreman-kernel/U1-configuration-checklist.json`,
`plugins/foreman-line/docs/goals/foreman-kernel/promotion-requests/**` (CODEOWNERS-covered
coordinator write surface), shared manifests/lockfiles/barrel exports, plugin/marketplace
metadata, root workflow files other than the two named, and other goals' records.

If implementation needs a path not listed above, work stops until the coordinator records a
spec amendment (FK-P17′ rule: no implied neighboring-path permission).

## Acceptance Criteria

1. **Closed registry completeness (default-deny, #30/#20):** exactly 4 invariant mirrors
   (BM-1…BM-4), 7 negative-control cases (NC-FK18-01…06 + CTL-FK18-01), 1 coarse-bounds
   job. The registry asserts its own cardinality **in both directions** against disk — a
   missing case and an extra case each fail the run (standing #17).
2. **BM-1 is genuinely realpath-aware:** the changed-path computation resolves each path to
   its realpath before membership testing. NC-FK18-03 (in-scope link → out-of-scope
   target) fails with `PATH_OUTSIDE_ALLOWED_FILES` **naming the resolved target**; a
   lexical-only matcher makes the fixture case fail (failing-when-broken proof). NC-FK18-01
   (must-prove, hook bypassed) fails with `PATH_OUTSIDE_ALLOWED_FILES`; NC-FK18-02 fails
   with `FROZEN_SURFACE_MUTATION`. Identity mismatch fails with `WORKTREE_MISMATCH` /
   `BRANCH_MISMATCH`.
3. **Negative control fail-CI (the load-bearing proof):** every NC case runs the real
   backstop checker as a child process; the parent asserts child exit status ≠ 0 **and**
   output naming the specific violation code (standing #14 — never the absence of a
   throw). Any NC case where the child exits 0, or the output lacks the named code, makes
   the workflow FAIL. On a real change set containing a seeded violation the backstop jobs
   turn CI red before any FK-P19 promotion (D13). A mock echo must fail every NC case.
4. **Positive control non-vacuousness:** CTL-FK18-01 exits 0 with all four mirrors passing;
   a checker that fails or passes everything fails the control set.
5. **Enrollment detection is detected-only (D7):** NC-FK18-04 records
   `SESSION_ENROLLMENT_MISSING` as classification `detected`; no `mechanical`
   classification and no refusal vocabulary may attach to non-enrollment; a scan of all
   emitted bytes finds no enforcement/promotion/hook-refusal-for-non-enrollment claim
   vocabulary (scan result recorded in the evidence record — FK-P17 AC5 pattern).
6. **State/evidence mirror:** NC-FK18-05 fails with `STATE_REVISION_STALE`; every consumed
   evidence record is digest-bound in a manifest and revision-current; `not-exercised`/gap
   rows are recorded as gaps and never counted passed.
7. **Dirty-reviewer mirror (class-3):** NC-FK18-06 fails with `REVIEW_WORKTREE_DIRTY` /
   `REVIEWER_MUTATION_FORBIDDEN`; a clean reviewer case passes (CTL-FK18-01 covers the
   allow side).
8. **U1 consumption is three-state, seal-only, digest-class-correct:** checklist/oracle/seal
   bindings are re-verified with the correct digest class (a document digest compared to a
   byte digest fails — A-U1.8.01); absent records produce named gap records, never passes;
   mismatch, a revoked seal, or `retentionObservationResult != match` fails closed;
   `audit/decision.json` is never consumed without its seal; the `revocations/` prefix is
   enumerated before any seal consumption.
9. **Oracle authority (A-U1.8.04):** NC expected outcomes are compared only against the
   coordinator-owned oracle record where bound; the workflow contains no
   builder-authored expected-outcome table used as an oracle; unbound state emits
   `blocked: no promotion request bound` gap records.
10. **A1.3 coarse bounds only:** the bounds job fails only at the declared 10× thresholds
    or on structurally invalid records; no p50/p95 or fine-grained gates exist anywhere in
    the workflow (a scan for fine-grained percentile assertions returns none); every bounds
    record carries the "never platform evidence" ceiling statement; no CI-measured latency
    figure is emitted.
11. **External-action pinning:** every `uses:` in both touched workflows matches
    `@[0-9a-f]{40}` (full 40-hex) with a version comment; zero tag/branch-pinned external
    actions; container inputs pinned by digest; a fixture with a tag-pinned action is
    caught by the workflow's own pin lint (failing-when-broken).
12. **Host independence (INF-4):** every backstop job declares a GitHub-hosted `runs-on`
    label; the evidence record captures runner facts; the workflow fails closed when the
    runner environment is not GitHub-hosted; the host-independence consequence is recorded
    in this spec's Assumptions and echoed in the evidence record.
13. **Evidence record:** `fk-p18-prime-ci-backstop-evidence.md` binds run identity (run id
    + attempt; URL recorded as pointer only), source SHA, workflow-bytes SHA-256, action
    pins, per-case NC outcomes (expected vs observed exit status + violation code), U1
    record digests consumed and their three-state dispositions, coarse-bounds disposition,
    host facts, and every gap record. It claims no enforcement, no promotion, no human
    Gate 3, and cites no CI URL as sole durable evidence.
14. **Enrollment obligations (standing #34):** the parcel adds no `package.json`; the
    governed package list is byte-unchanged (asserted in the diff review).
15. **Exact 3-file ceiling:** nothing outside **Allowed Files** is created, edited, moved,
    or deleted; forbidden surfaces are byte-unchanged.
16. Two fresh independent `architecture/risk` reviews return verdicts on the mandated
    focus questions; no reviewer fixes or commits. FK-P18′ alone closes no exit fragment
    beyond "CI backstops green" and never claims dispatch, enforcement, or promotion while
    this spec is `draft`.

## Out of Scope

- **FK-P19** enforcement promotion, degraded read-only mode, fail-closed governed-mutation
  policy — and any promotion/retaliation claim of any kind. The `promotedRefusalClassIds`
  selection is FK-P19/owner's parameter (U1 OQ-U1-08); this parcel never selects it.
- **FK-P16** adapter/hook registration; **FK-P12** `authorizeAction`; hook behavior
  changes or claims (`hooks/**` is invoked-read-only at most, actually untouched).
- INV-U1-04 policy-integrity evaluation and the U1 promotion resolver/verifier execution
  (`u1-verify.yml` / `u1-produce.yml` lane) — consumed as records only, never run or edited.
- Writes to `foreman-line-ci.yml` (unless a coordinator-recorded window), to every other
  forbidden surface listed under **Allowed Files**, and to the U1 records
  (`U1-verifier-pin.json`, `U1-configuration-checklist.json`, `promotion-requests/**`).
- Provisioning any external resource (Azure storage credentials, GHCR, runner groups,
  branch-protection/ruleset settings): external-effect authority is not granted by this
  spec (E8/INF-4; owner gate named in the Open Questions).
- Fine-grained latency gating or any platform-latency claim (A1.3); D21 §8-scenario-14
  evidence; INF-8 process-boundary recovery proof; INF-4 retained-evidence
  manifest/retention (stranded exit-annex rows); INF-7 corpus binding; INF-1/2/3/6 residual
  assembly (exit-annex rows remain NOT satisfied).
- **FK-P20** Codex probe; D20 host claims beyond the recorded runner facts; real Claude
  Code session automation; the U1 shakedown's lock flip (owner-ruling deferred).
- Implementing detection machinery beyond the four mirrors (enrollment heartbeat is
  FK-P16's deferred lane; BM-2 detects from the tree only).

## Context & References

Pin table — SHA-256 over committed file bytes as computed at shaping time (2026-10-02).
Basis: `origin/main` = `27323ec87880c53e300418ee24b1497e94f2261f` unless another commit is
named. **Pin-table integrity rule (FK-P17′, carried):** every pin binds COMMITTED bytes;
uncommitted or untracked state is never pinnable — if a pin's only reproduction is dirty
worktree bytes, that is `PIN_DRIFT` until the coordinator amends the row. Path/line anchors
are documentation; names are the resolution authority.

| File (repo-relative) | SHA-256 | Binds |
|---|---|---|
| `plugins/foreman-line/docs/goals/foreman-kernel/fk-p1-p21-dispatch-plan.md` | `51c410c5deb63fd7390fe712d7c77e4b06ae05c223d00821713d9216508bbacf` | FK-P18′ row + RS-1.2 retarget note; RS-2.5 annotations |
| `plugins/foreman-line/docs/goals/foreman-kernel/fk-rs2-gate1-reratification-2026-09-27.md` | `bb12ccb5c279b8c32095814c4a89ec577b4e0d7aa368656cd56c91a38d16b2ea` | RS-2.5 item 3 (CI file ownership); item 4 (E6/E7); A1.3 coarse-bounds limit |
| `plugins/foreman-line/docs/goals/foreman-kernel/fk-rescope-RS1-2026-09-27.md` | `53251e4faeab5f7d11fe322e19bae82dc54a905d49def53ca990e9daaeb43cb1` | RS-1.2 retarget; class-1/class-3 CI invariants; RS-1.4(d) |
| `plugins/foreman-line/docs/goals/foreman-kernel/fk-wave3-4-marginal-value-2026-09-27.md` | `e7feaf8dcfafb31db7ddea4903508c812e2ef1e460cb3a07c8f493e3b5889d92` | §2 class-1/class-3 residual; P18 row (E6 facts) |
| `plugins/foreman-line/docs/goals/foreman-kernel/charter.md` | `29a08a63b8e1c540bfa6863a0244dddb7e08b1e3889dac64d10892f87b06b693` | D7/D13/D21; §14 infrastructure adoption; INF-4; §12/§15.3 |
| `plugins/foreman-line/docs/goals/foreman-kernel/ADR-001-runtime-infrastructure-posture.md` | `7d7f1ac7f5f543052b475737879d8fa278cdb788b61df257b63e4481ed40b5e7` | Tier-1 CI surface (`test-plugin-install.yml` scope); §Consequences host independence |
| `plugins/foreman-line/docs/goals/foreman-kernel/plan-review-findings.md` | `809ab93603993dd84782257543b49b889009b75384d3fdc1c5e637817af8f567` | E6/E7/E8 dispositions |
| `plugins/foreman-line/docs/goals/foreman-kernel/U1-contract-2026-09-29.md` | `8d5f849cf22f6662f17c2502142e354d82f8f5604d64b511250abc72157df9d5` (committed @ `2ca6cd7`; matches the amendments' own base-document pin) | IA-5/IA-6/IA-11; §3.4.5; §3.5; §3.6; §14 gate text |
| `plugins/foreman-line/docs/goals/foreman-kernel/U1-8-closure-amendments-2026-10-01.md` | `895fbe0e6de1cd8966e309cc834eb5f580b4cbda5bb7866d3121b39a398360e1` (committed @ `3de4a7e`) | A-U1.8.01 digest classes; A-U1.8.03 checklist; A-U1.8.04 oracle; A-U1.8.06 request shape; A-U1.8.09 seal-only; A-U1.8.14 revocation |
| `plugins/foreman-line/docs/goals/foreman-kernel/U1-8-closure-report-2026-10-01.md` | `4e8efc18e63363be018e14eca77146f43f87125de4e7579580c97d2cf85a9ebf` | closure map F-1…F-18; F-12 P1–P3 preconditions; shakedown record |
| `plugins/foreman-line/docs/goals/foreman-kernel/U1-8-closure-rereview-dossier-2026-10-01.md` | **not pinned** — untracked at shaping time (recorded digest `9093511c…` per `U1-observations-2026-09-30.md`; re-pin committed bytes at the parcel base) | the pending §8 closure review vehicle |
| `plugins/foreman-line/docs/goals/foreman-kernel/U1-8-review-verdict-2026-10-01.json` | **not pinned** — untracked at shaping time (re-pin at the parcel base) | §8 FINDINGS verdict of record |
| `plugins/foreman-line/docs/goals/foreman-kernel/U1-verifier-pin.json` | `dbfacbcb5df7a17fe6d40bd73155b49dca48580b1e12b547cfa5f516e5fd5a9f` | `configurationChecklistSha256`, `workflowCommit`/`workflowFileSha256` bindings |
| `plugins/foreman-line/docs/goals/foreman-kernel/U1-configuration-checklist.json` | `f6ce063326c79e70633e29bc1a3d3a87dea271708427cd6362f6fbcb8d0a1998` (= its recorded `configurationChecklistSha256`) | the checklist record consumed by BM jobs |
| `plugins/foreman-line/docs/goals/foreman-kernel/promotion-requests/u1-shakedown-2026-10-01.json` | `23b14849031fa1ed41c1cdd0fa0801be79c9883269f0e161226257805de0c020` | `U1PromotionRequest` shape reference (`u1-promotion-request/v1`) |
| `plugins/foreman-line/docs/goals/foreman-kernel/fk-exit-annex-draft-2026-09-27.md` | `cceb32dd7c4979dd8d75bdf7e8aa53a63db17883331216d7e30fd590c49dfc11` | what this parcel must NOT claim (stranded rows) |
| `plugins/foreman-line/docs/specs/done/FK-P17-bypass-outage-matrix.md` | `932a0262497b5a3f5e8a75c8732b085b581ad48d54081b7bc238c29d7d97880c` | evidence shapes; D13 honesty rules; three-state pattern; T2/T4 anchors |
| `plugins/foreman-line/templates/STANDING-CONSTRAINTS.md` | `e7ccf0cee98f265a37a6478ff20710cb481ae3fdf4e08bf4231f586f7e314c40` | #1/#10/#12/#13/#14/#16/#17/#19/#20/#21/#31/#34 |
| `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` | `b5cce5029c4619058795414b624a418fb8c1c28f8534dab9d58c8fef61994c2f` | the copy FK-P17′ pinned (kickstarter binder) |
| `.github/workflows/test-plugin-install.yml` | `1ae5e01cbf5c562d5006f4946c1af4ac2f25908255fa1243b4918ae7176bbd11` | the ADR-001 integration point |
| `.github/workflows/foreman-line-ci.yml` | `eb5d7144e7aa5e6b2274ddc17048a95c9c22da6e92889549a39e1ce345f384be` | context only (E6 facts; outside the write set) |
| `plugins/foreman-line/docs/SPEC-CONVENTION.md` | FK-P17′ three-state row, carried verbatim: identity pin `70508684d2c929d1331ed0cd9a147fcc2206593a04fbf210314e22fb80cba0a8` (the v0.4 revision, uncommitted delta); KNOWN-BASE committed `7ac315005cde6ad6def848b83de1d1b644e321c5d9f6434bc925deb6daba8703` (re-verified at `origin/main` 2026-10-02) → KNOWN-GAP `blocked: RCM-P2 schema-v0.4 delta uncommitted`; any other state → `PIN_DRIFT` fail-closed | spec schema §4/§4.8 (identity pin only) |

Related records: [loop directive](../../goals/foreman-kernel/loop-directive.md),
[FK-P17′ spec](../done/FK-P17-bypass-outage-matrix.md) (upstream evidence),
[dispatch plan](../../goals/foreman-kernel/fk-p1-p21-dispatch-plan.md) (FK-P18′ row),
[U1 observations](../../goals/foreman-kernel/U1-observations-2026-09-30.md) (U1 lane
state), `U1-8-review-dossier-2026-10-01.md` (§8 protocol).

## Assumptions

**INF-4 host independence — ADR-style consequence note (load-bearing).** ADR-001
§Consequences: "FK-P18's value derives entirely from executing somewhere the hook does
not," and the ADR recommends the parcel state that property explicitly in its acceptance
criteria. Stated here and enforced by AC12. **Consequences:** (a) any future convenience
change moving these backstop jobs to a self-hosted runner on the developer machine silently
voids the backstop while every check can remain green — this spec makes that a visible
contract breach (runner-facts check fails closed) rather than a silent downgrade; (b) a
GitHub-hosted run produces backstop evidence, never D20 host-parity evidence (A2-r2/r3
record); (c) the hook is absent from CI by design — these are post-action detections in the
D13 layered model, and a red backstop is detection, not containment. The authority on what
is mechanically refused vs detected vs unsupported remains FK-P17′'s matrix.

**Other assumptions (each falsifiable at dispatch):**
- The §8 closure ACCEPT arrives as a coordinator-side record; this spec assumes it before
  dispatch and claims nothing about it.
- Custodian separation (U1 §3.1.4 / F-12): the control custodian is distinct from the
  FK-P18′ builder; absence of recorded protection evidence is `INCOMPLETE`, never inferred
  from CODEOWNERS presence.
- The promotion request + oracle for the first evidence cycle are coordinator-authored;
  where absent, three-state (b) gap records carry — consistent with the owner ruling that
  the first cycle is a non-ACCEPT shakedown (A-U1.8.03).
- E6 is waived-and-recorded by default (see Constraints); if the coordinator assigns the
  fix instead, a `foreman-line-ci.yml` window must be recorded first.
- The alias-evasion sub-cases of NC-FK18-03 that require a case-insensitive filesystem are
  exercised on `windows-latest`; where a platform dimension cannot be exercised, the case
  is a gap record, never a pass.

## Verification Plan

The surface is live GitHub Actions; the authoritative verification is observed runs on
GitHub-hosted runners. Chain, run by the coordinator after dispatch (full output and direct
exit codes retained):

1. **Static scans (any host):** action-pin lint over both touched workflows (AC11);
   registry-cardinality self-check (AC1); banned-vocabulary scan over emitted bytes (AC5);
   fine-grained-percentile scan returns none (AC10).
2. **Negative-control run:** dispatch `fk-p18-ci-backstops.yml` on a branch; observe every
   NC case's child exit status and named-violation output; observe the workflow FAIL if any
   backstop fails to fail (AC3); observe CTL-FK18-01 green (AC4).
3. **Real-violation red proof:** open a scratch PR containing a seeded out-of-scope
   mutation (temp branch, discarded); observe the backstop jobs FAIL naming
   `PATH_OUTSIDE_ALLOWED_FILES`; observe the clean-PR run green. This is the D13 "CI lands
   before enforcement promotion" receipt.
4. **U1 consumption:** observe the three-state dispositions recorded per record (a/b/c);
   break one binding deliberately (wrong digest in a scratch copy of the request) and
   observe `PIN_DRIFT` fail-closed (AC8).
5. **Host facts:** confirm the evidence record carries runner facts and the runner
   environment check (AC12).

**Mandated reviewer focus questions** (field-by-field assessment, not generic linting):

1. **Load-bearing proof:** would a backstop that no-ops make CI red? Attempt the naive
   reading — can the negative control pass while the backstop checks nothing (child never
   ran, standing #14)? Is the must-prove case (NC-FK18-01) genuinely two-sided?
2. **Real-surface faithfulness:** does every NC case run the real checker as a child? Would
   a mock echo pass any case?
3. **Realpath-awareness:** does BM-1's matcher actually resolve realpaths — break the
   alias fixture and show the test fails. Is the reported path the resolved target?
4. **Digest-class honesty (A-U1.8.01):** can a document digest be compared to a byte
   digest anywhere and pass? Is `configurationChecklistSha256` (byte) vs `checklistDigest`
   (document) distinction preserved?
5. **Seal-only honesty:** can a bare `audit/decision.json` be consumed? Can a revoked seal
   or a `retentionObservationResult != match` slip through? Is the `revocations/` prefix
   enumerated before consumption, every time?
6. **Oracle honesty:** can a builder-authored `expected` become an oracle anywhere? Does
   unbound state record gaps rather than passes?
7. **D7/D13 honesty:** does any output describe non-enrollment as refused or enforced? Does
   any artifact claim enforcement, promotion, FK-P16/adapter behavior, D20 host parity, or
   a stranded INF obligation?
8. **A1.3 discipline:** is the bounds gate genuinely coarse (10× only; no p50/p95)? Does
   any record cite CI latency as platform evidence?
9. **Host independence:** is it enforced mechanically (self-hosted detection), or only
   promised in prose? Would a runner-label change be caught?
10. **Pin integrity:** do the pin rows bind committed bytes per the carried rule? Are the
    two untracked files honestly marked not-pinned (no silent worktree pin)?
11. **Scope authority:** is the E6 disposition explicit? Is `Allowed Files` exactly 3, and
    would a 4th path be refused rather than implied?
12. **Parcel purpose (standing #26):** if this implementation were perfect, what would
    still be broken? — the answer must not be "the backstops are decorative" or "CI green
    is unproven before promotion"; if it is, stop and say so.

## SHAPING-RISK

What could make this parcel fail review (each is a live risk at shaping time):

1. **Decorative negative control.** The meta-assertion can pass while the child checker
   never ran (standing #14's exact defect). AC3/AC4 and focus question 1 exist for this;
   reviewers should break it first.
2. **Write-surface creep via the U1 consumption seam.** Reading the blob-store seal needs a
   credential (E8); if provisioning turns out to require repo-file configuration, the
   "workflow/CI integration points only" boundary breaks → Allowed Files amendment (OQ-6).
3. **BM-4's detection surface is unpinned.** The concrete record consumed for reviewer
   attribution / worktree-clean assertions is not yet named (OQ-2) — the largest shaping
   gap; a reviewer can reasonably reject the mirror as unimplementable until it is.
4. **Exact-scope authority source unsettled (OQ-3).** BM-1 needs a compiled Allowed-Files
   authority; FK-P2 output "where available" plus spec-block parsing is a shaped default,
   not a ruling.
5. **E6 disposition may be overturned** (OQ-1): owning the plugins `test` job fix widens
   the write set to `foreman-line-ci.yml` under a window and re-scopes the parcel.
6. **Inline workflow logic.** Keeping all checks inside one workflow file (no helper
   package) trades testability for the minimal write surface; reviewers may demand
   extracted, unit-tested scripts → Allowed Files amendment. If so, amend before code.
7. **Coarse-bounds numbers are proposals.** A1.3 mandates "coarse" but ratifies no numbers;
   10× is a shaping default (OQ-7) and could be ruled inadmissible if considered a latency
   gate in disguise.
8. **Pin-table fragility.** The two untracked U1 files (rereview dossier, verdict JSON)
   cannot be pinned at shaping time; if they change before the parcel base, the §14 gate's
   own evidence identity shifts under the spec.
9. **NC-U1 live-row scope (OQ-9).** If the coordinator assigns the full 13-row live
   exercise to this parcel, the "named workflow/CI integration points only" write surface
   may prove too narrow (several IA-11 rows exercise channels CI cannot reach) — scope
   amendment or named lane split required before dispatch.

## Open Questions

For the coordinator — numbered, each with the shaping recommended default. None is
resolved by this spec.

1. **E6 — failing plugins `test` job disposition.** Own the fix here (requires a recorded
   `foreman-line-ci.yml` window) or waive-and-record as a named prerequisite of RS-1.4(d)?
   **Default: waive-and-record** ("CI backstops green" = this parcel's named checks).
2. **BM-4 detection surface.** What exact record does the dirty-reviewer check consume for
   reviewer attribution and worktree-clean assertions (standing #10/R10 basis)?
   **Default: reviewer end-of-cycle clean-tree assertion records retained with the review
   evidence; coordinator supplies the exact path at dispatch.**
3. **BM-1 exact-scope authority source.** FK-P2 compiled-scope output (three-state) or
   read-only parsing of the assigned spec's `## Allowed Files` block? **Default: FK-P2
   output where available; otherwise the spec block, with the authority used recorded per
   run.**
4. **`test-plugin-install.yml` integration edit.** Required (one named edit wiring the
   backstop checks as a gate per ADR-001 Tier 1) or standalone workflow only (file
   untouched)? **Default: one named integration edit** (Allowed Files row pre-bounded; if
   standalone-only wins, withdraw the row by amendment).
5. **Promotion-request binding at run time.** How does the workflow learn its
   `promotionRequestId` — discovery of the newest committed
   `promotion-requests/<id>.json`, or a dispatch input? **Default: committed-file
   discovery; unbound → three-state (b) gap records.**
6. **U1 blob-store read path (E8 external act).** Provision a read-only credential for the
   `u1/m0r6an/agent-skills/verifications/**` + `revocations/` reads, or run seal
   consumption in three-state (b) until provisioned? **Default: three-state (b) until the
   owner provisions; no credential handling is added to the workflow by this parcel.**
7. **A1.3 coarse-bounds thresholds.** Ratify 10× the F05.16 budgets as the coarse bound,
   or supply numbers? Fine-grained bounds remain forbidden either way. **Default: 10×.**
8. **Evidence-record retention.** Confirm INF-4 retention stays the stranded exit-annex row
   (FK-P17′ OQ-3 ruling extended here) and the committed
   `fk-p18-prime-ci-backstop-evidence.md` is the durable artifact, with CI run logs as
   navigation pointers only. **Default: confirm.**
9. **NC-U1-01…13 live-row carrier.** Does FK-P18′ carry the full 13-row live exercise
   (closure report §4: "the first REAL evidence cycle (FK-P18′) must exercise them against
   live rows"), or only the rows whose channel is the CI/diff/detection lane — with the
   remainder carried by the U1 producer/verifier lane? Under A-U1.8.04/§7.6 only the three
   PIN-09 inherited gaps may be gap rows, so every other row needs a named live carrier
   before any ACCEPT. **Default: FK-P18′ supplies live rows for every control whose channel
   is CI; the coordinator names the carrier for the remaining rows at dispatch, and those
   rows are recorded as named lane obligations here, never as passes.**

## COORDINATOR RULINGS ON THE OPEN QUESTIONS (2026-10-02; shaping-ratification record)

Ruled by the coordinator under the goal's standing authority (owner delegation, RS-1.5);
product-level items carried to the owner's review through the spec-review channel.

| OQ | Ruling | Effect on the spec |
|---|---|---|
| OQ-1 (E6 plugins `test` job) | **Waive-and-record** as a named prerequisite of RS-1.4(d) | no write to `foreman-line-ci.yml`; "CI backstops green" = this parcel's named checks only |
| OQ-2 (BM-4 detection surface) | The dirty-reviewer check consumes the **§8 review-verdict JSON records** (`U1-8-review-verdict-*.json` / `U1-8-closure-*verdict-*.json`) as reviewer-attribution + worktree-clean evidence — each verdict's `selfReviewStatement`/`custodianDisclosure`/`methodNotes` carries the standing-#10 attestation; extended per future review | named consumption path fixed: `plugins/foreman-line/docs/goals/foreman-kernel/U1-8-*verdict-*.json`, three-state |
| OQ-3 (BM-1 authority) | **FK-P2 compiled-scope output where available; otherwise the assigned spec's `## Allowed Files` block; the authority used recorded per run** | accepted as shaped |
| OQ-4 (`test-plugin-install.yml`) | **One named integration edit** wiring the backstop checks as a gate (ADR-001 Tier 1) | Allowed Files row 2 stands as pre-bounded |
| OQ-5 (promotion-request binding) | **Committed-file discovery** of `promotion-requests/<id>.json`; unbound → three-state (b) gap records | accepted as shaped — the CI trigger model (pull_request/push) admits no dispatch inputs |
| OQ-6 (U1 read credential) | **Provisioned at ruling time**: read-only identity for the seal/revocations reads is provisioned by the coordinator (`u1-reader-mi`, container-scoped Blob Data Reader, FIC subject `repo:m0r6aN/agent-skills:pull_request`); the workflow self-checks its `job_workflow_ref`/`repository_id` claims per the A-U1.8.14 binding standard | three-state (b) fallback REMAINS as the recorded degradation if the credential is revoked; the workflow never handles secrets (OIDC only) |
| OQ-7 (coarse bounds) | **Ratified: 10× the F05.16 budgets** (`mediatedActionLatency` > 1,500,000 µs; `kernelDecisionLatency` > 500,000 µs); fine-grained bounds remain forbidden | accepted as shaped; the "never platform evidence" ceiling statement stands |
| OQ-8 (evidence retention) | **Confirmed**: INF-4 retention stays the stranded exit-annex row (FK-P17′ OQ-3 extended); `fk-p18-prime-ci-backstop-evidence.md` is the durable artifact; CI run logs are navigation pointers only | accepted as shaped |
| OQ-9 (NC-U1 live-row carrier) | **Carrier split ruled:** FK-P18′ carries live rows for every NC-U1 control whose channel IS the CI/diff/detection lane. The rows whose channels are the blob-store/verifier lane are carried by the **U1 first real evidence cycle** (the FK-P19-era promotion run of the full U1 verifier against live FK-P17 rows) — recorded here as named lane obligations, never as passes. No scope amendment to FK-P18′'s write surface | rows split at dispatch by channel; the split table is appended to the evidence record at dispatch |
