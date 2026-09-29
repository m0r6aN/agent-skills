---
ticket: FK-P11
title: Foreman Kernel - legacy import and projection engine
status: draft
owner: clinton.morgan
created: 2026-09-29
updated: 2026-09-29
supersedes: null
superseded_by: null
risk: critical
surfaces: [plugins/foreman-line/kernel-import/**]
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
---

# FK-P11 — Legacy import and projection engine

## Intent

Build the one-time, digest/commit-bound legacy import that materializes legacy
operational goal state into the merged FK-P9 substrate under the D2/D14 field-level
authority matrix — with **no manufactured approvals**: every imported human-gate fact
is an evidence-derived, provenance-bound record, and any fabricated or unevidenced
approval is refused. The imported corpus is an explicit, digest-bound **corpus
manifest** (deterministic enumeration, one disposition per item — INF-7; the
extractor consumes the manifest only, never globs). Build the deterministic,
byte-stable Markdown projection over the ledger, the recorded one-time cutover epoch
(one epoch per source lineage; re-import refused), and the named **divergence-stop**
refusal — FK-P11's in-scope Wave-3a exit duty (RS-1.4(c): "restart reconstruction,
CAS/idempotency conflicts, migration crash/recovery, divergence-stop" for
FK-P9–FK-P11's ledger properties; RS-2.2 assigns FK-P11 the divergence-stop and
crash/recovery exit-evidence fragments). The parcel claims no dispatch, no
gate-genuineness verification, no enforcement, and no FK-P15 process-boundary
recovery proof.

## Constraints

### Dependency and dispatch boundary

**Status: draft — not dispatchable.** Dispatch requires (1) coordinator lint of this
spec (charter §15.3; SPEC-CONVENTION §3), (2) the recorded FK-P9 amendment **A1e**
(T12) landed, and (3) Step-0 restate-and-stop confirmed by the coordinator. No spec
text here claims dispatch.

**Dependencies (exact):**
- **FK-P9 (merged) — real package dependency.** FK-P11 consumes the merged
  `@foreman-line/kernel-state` package at `plugins/foreman-line/kernel-state/` through
  `file:../kernel-state`, integrity-pinned in this package's own lockfile. Only the
  documented exports are used (`openStorage`/`closeStorage`, `withTransaction`, the
  parameter-bound row primitives incl. the A1c/A1d reads, the `Clock` seam); every call
  is wrapped in typed try-catch rethrown as FK-P11's own `ImportError` (standing
  constraint #1). There is **no raw SQL anywhere in this package** — all reads and
  writes compose FK-P9 row primitives inside `withTransaction`. FK-P11 never edits
  `kernel-state/**`: schema/registry needs arrive only as recorded FK-P9 amendments
  (FK-P9 OQ-5 ruling; the A1-family route — for this parcel, A1e), never direct edits.
- **FK-P10 (merged) — data/contract dependency.** FK-P11 imports the merged
  `@foreman-line/kernel-lease` package at `plugins/foreman-line/kernel-lease/`
  (through `file:../kernel-lease`, integrity-pinned) **for data only**: the exported T1
  goal-status vocabulary and T2 transition edge table (`src/state-machine.ts`), so
  FK-P11 never re-decides a status or an edge. Import route (coordinator ruling F-3,
  2026-09-29): the data is consumed through kernel-lease's PUBLIC `src/index.ts`
  export surface via the deep specifier `@foreman-line/kernel-lease/src/index.ts`
  (`kernel-lease/package.json` carries no `exports` map) — internal-layout
  coupling, read-only, recorded; a future kernel-lease export-map change is a
  named break point. FK-P11 calls **no engine operation**
  (no `createEngine`, no claim/renew/release/request/decide/apply), creates **no
  `leases`, `transitions`, or `idempotency_keys` rows**, and emits **no FK-P10 engine
  event kinds** (T12/A1e registers its own import kinds). `projection_id = 'goal-state'`
  is FK-P10's reserved cursor (its OQ-4): FK-P11 reads it, never writes it.
- **FK-P1 (merged) — contract-only.** FK-P11 binds FK-P1's recorded shapes verbatim,
  one home each: F05.1 bounds (`Id`, `Digest`, `SafeInt`, `Micros`, `Bytes<N>`);
  F05.4 `GitGateEvidenceRef` members `evidenceKind`, `gitIdentity`, `digest` verbatim
  (the three-member closed object); F05.5 digest literal `sha256:` + 64 lowercase hex
  and the canonical-JSON byte rules; F05.10 safe-diagnostic discipline; the charter §5
  rule that no credential, prompt, source payload, or secret enters the operational
  event stream. This is a dependency on recorded contract text, **not** a package
  import: `kernel-contracts/**` is never imported and never written; its golden
  fixtures are read-only conformance test input only (the FK-P9/FK-P10 pattern).
- **NOT FK-P12, FK-P13, FK-P14, FK-P15.** Gate-evidence genuineness/sufficiency
  (FK-P12), the admission-protected control catalog incl. the `project`/`evidence`
  tools and D17 request binding (FK-P13), and process-boundary recovery proof (FK-P15,
  stranded per RS-2.2) are consumers or successors of this surface. Their algorithms
  are not built here.
- **No spec-grammar pin.** FK-P11 parses no spec bodies and consumes no
  SPEC-CONVENTION grammar; the SPEC-CONVENTION citation is identity-only under the
  three-state known-base rule (Context & References).

**Out of this parcel's dispatch preconditions:** any window on `dispatch/**`,
`routing-policy/**`, `mutation-scope-guard/**`, `hooks/**`, or `skill-injection/**`
(RS-2.4 — FK-P11 writes none of them). No contested seam is touched.

Isolated builder branch and worktree are assigned at dispatch from a verified base SHA
(charter §15.3 identity/environment rows). Standing constraints apply:
`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` — #1 (typed errors at
every substrate/clock/seam/git/process boundary), #2 (substrate rows and seam returns
are `unknown` until normalized), #3 (default-deny: every structural invariant tested
independently), #19 (linear-time parsing of import documents, payloads, and legacy
text), #30 (one test per invalid shape), #31 (sanitize external text before any
Markdown/line-protocol emission), #32 (failing-when-broken mutation tests per named
invariant), #34 (no shipped byte-pins of moving files; fixture bytes and spec-level
pins only).

### Pin-integrity rule (normative, FK-P17 lesson 2026-09-28)

Every pin in this spec binds **COMMITTED bytes at the parcel base** (HEAD
`d5ca69b828f5f50b55a9a72954bb34d99ba42341`, 2026-09-29) unless explicitly classified
as a three-state known-base target. Uncommitted sibling state is never pinnable: where
a cited file's worktree copy is dirty or absent from HEAD, the pin carries the
committed digest (or the file is recorded unpinnable) and the dirty state may never
silently reproduce the pin. A pin change is a spec amendment (standing constraint #34),
never an in-parcel re-anchor. Line anchors are documentation; symbol names are the
resolution authority.

### Package and version rules

Propose private ESM package **`@foreman-line/kernel-import`** at
**`plugins/foreman-line/kernel-import/`**, version/API `0.1.0`, Node >=22 (observed
pinned runtime 24.7.0), TypeScript sources, biome lint config, own `package-lock.json`,
no root/workspace manifest registration, no shared lockfile alteration (FK-P1/FK-P2/
FK-P9/FK-P10 pattern). **Location justification:** sibling FK-owned packages use
kebab-case top-level directories under `plugins/foreman-line/` (`kernel-contracts`,
`kernel-state`, `kernel-lease`, `spec-body-compiler`, `spec-linter`,
`mutation-scope-guard`, `schema-scaffold`); `kernel-import/` is a new FK-owned,
non-contested top-level directory outside every contested seam (`dispatch/`,
`routing-policy/`, `mutation-scope-guard/`, `hooks/`, `skill-injection/`) and outside
FK-P1's `kernel-contracts/`, FK-P2's `spec-body-compiler/`, FK-P9's `kernel-state/`,
and FK-P10's `kernel-lease/`. The name follows the `kernel-*` family and names this
program's cutover act; the README states the full legacy-import + projection +
cutover/divergence-stop scope (the FK-P10 naming precedent). Alternatives considered:
`kernel-projection` (loses the import/cutover connotation), `kernel-cutover`
(epoch-centric; the projection engine is half the charter row). Cross-package imports:
**exactly two** — `@foreman-line/kernel-state` and `@foreman-line/kernel-lease` (plus
Node built-ins). Unknown fields, unknown enum values, missing required data, and
over-limit input fail closed (FK-P1 F05.1 wire discipline). The only sanctioned
external reads of sibling packages are the FK-P9 substrate at runtime, the FK-P10
state-machine data at runtime, and the FK-P1 golden fixtures at test time (read-only,
digest-checked by the conformance test, never written).

### Source-lineage reader seam (the one external read seam)

`SourceLineageReader` defines the three-method read contract below. It is implemented
in TWO places: the **shipped production reader** (OQ-8 ruling) and an **injected test
seam**.

| Method | Contract |
|---|---|
| `commitExists(commitId)` | `unknown` until normalized to boolean; false = the commit is not known |
| `isAncestor(ancestor, descendant)` | `unknown` until normalized to boolean; inclusive (a commit is its own ancestor) |
| `readCommittedBlob(commitId, sourcePath)` | `unknown` until normalized to `Uint8Array` or a typed absence; returns the committed blob BYTES only |

Rules: (1) every reader call is wrapped in typed try-catch and rethrown as
`LINEAGE_READER_FAILURE` carrying the seam's own code literal only (standing #1);
HARNESS_*-branded seam errors rethrow **unwrapped** — harness failures are never
laundered into product errors (the three-instance error-laundering class, exit annex
§5); (2) seam returns are `unknown` until explicitly normalized (#28) — a
nonconforming return refuses typed, never a confident cast; (3) **digests are always
computed by FK-P11 over the returned bytes** (SHA-256, `sha256:`-tagged) — the reader
never supplies a digest, so a lying digest cannot pass; (4) lineage membership is
computed by FK-P11 from the reader's raw boolean answers as the ancestry closure
`rootCommit … tipCommit` (inclusive): a claimed commit is in lineage iff
`isAncestor(rootCommit, claimed)` AND `isAncestor(claimed, tipCommit)`; (5) the
operator-trust assumption (a reader that fabricates bytes could fabricate provenance)
is recorded **ONLY for injected-seam test runs — never for the shipped reader**
(OQ-8 ruling).

**Shipped production reader (OQ-8 ruling, 2026-09-29):** FK-P11 ships a REAL-Git
`GitLineageReader` as production code — read-only commit-bound blob reads over the
named revision via git plumbing (`git cat-file`/`git rev-parse`-class invocations in
argv-array form, never shell strings; no git mutation subcommand is ever reachable).
It implements the same three methods; every call is typed (#1) and every return
normalized (#28); its failures surface as `LINEAGE_READER_FAILURE`. The injected seam
is retained for tests (fixtures incl. lying-reader probes). If the reader needed more
files than the Allowed Files ceiling carries, the standing instruction is STOP and
report rather than drop it — the ceiling in this spec names the reader's files
explicitly (47-file ceiling, reported to the coordinator, never silently absorbed).

## Contract tables

### T1 Import document and corpus manifest (closed shapes; default-deny per member, #30)

Types follow FK-P1 F05.1. `CommitId` = lowercase hex of length
`COMMIT_ID_LENGTH_SHA1 = 40` or `COMMIT_ID_LENGTH_SHA256 = 64` (both accepted shapes,
each with its own fixture — OQ-6 ruling). All objects are closed: an unknown field, a
missing required member, an unknown enum value, or an over-limit value refuses
(`IMPORT_ARGUMENT_INVALID` / `IMPORT_LIMIT_EXCEEDED`) — never a default, never
truncation.

| Shape | Members (all REQUIRED unless noted) |
|---|---|
| `CorpusManifest` | `manifestKind` (literal `legacy-corpus-manifest`), `sourceRevision: CommitId`, `items: CorpusItem[]` |
| `CorpusItem` | `sourcePath: Bytes<4096>`, `sourceDigest: Digest`, `disposition: 'import' \| 'excluded'`, `reason: Bytes<256>` (non-empty) |
| `ImportDocument` | `apiVersion` (literal `0.1.0`), `documentKind` (literal `legacy-import`), `corpusDigest: Digest` (F-2: canonical digest over the rows' `SourceProvenance` tuples sorted by canonical key order, domain `foreman-line.kernel-import.corpus`), `sourceLineage { rootCommit: CommitId, tipCommit: CommitId }`, `corpusManifest: CorpusManifest`, `rows: LegacyGoalRecord[]` |
| `LegacyGoalRecord` | `goalId: Id`, `claimedStatus: <T1 vocab literal>`, `source: SourceProvenance`, `claimedRatificationRefs: RatificationRef[]` (may be empty), `claimedApprovals: ApprovalClaim[]` (may be empty), `claimedOperationalFacts: OperationalFacts` |
| `SourceProvenance` | `sourcePath: Bytes<4096>` (repo-relative form only — traversal, absolute, backslash, ADS, reserved-name, trailing dot-space, control/format-char forms refuse; no host path is ever echoed), `sourceDigest: Digest`, `sourceCommit: CommitId` |
| `RatificationRef` | `gitIdentity: Bytes<256>`, `digest: Digest`, `provenance: SourceProvenance` |
| `ApprovalClaim` | `evidenceKind: 'commit-ref' \| 'signature' \| 'status-check' \| 'merge-record'` (the F05.4 closed union verbatim), `gitIdentity: Bytes<256>`, `digest: Digest`, `provenance: SourceProvenance` — i.e. the F05.4 `GitGateEvidenceRef` members verbatim **plus provenance** ("imported approvals arrive with their provenance") |
| `OperationalFacts` | `claimedRevision: SafeInt \| null`, `claimedLeaseHolderPrincipalRef: Id \| null`, `claimedPendingTransitionTarget: <T1 vocab literal> \| null`, `claimedWakeupCount: SafeInt \| null`, `claimedHandoffCount: SafeInt \| null`, `claimedBinding: { principalRef: Id, operationId: Id, repositoryRef: Id, worktreeRef: Id } \| null` (F-5: the legacy binding claim; a 4-tuple colliding with a recorded `idempotency_keys` binding stops (CON-08)) — **provenance-only** per T2; these members can never reach `goals.revision`, `leases`, `transitions`, `wakeup_handoffs`, or `idempotency_keys` |

**Corpus-manifest contract (OQ-1 ruling; INF-7).** The corpus is defined by the
manifest — exact input paths, source digests, and a named source revision;
deterministic enumeration with **one disposition per item** (an `excluded` item
carries a reason and produces no row — recorded, never silently dropped). The
extractor consumes the manifest ONLY, never globs. Consistency is default-deny: a
`rows[]` entry whose `source` does not match an `import`-disposition manifest item
exactly, a manifest item without a disposition/reason, or duplicate manifest items
refuse (`IMPORT_ARGUMENT_INVALID`); a manifest-item/row digest disagreement refuses
`IMPORT_SOURCE_DIGEST_MISMATCH`; a manifest `sourceRevision` outside the lineage
refuses `IMPORT_COMMIT_OUT_OF_LINEAGE`; an `excluded` item that produced a row refuses
(`IMPORT_ARGUMENT_INVALID`). The shipped TEST manifest is synthetic fixture records
(`tests/fixtures/corpus/test-corpus-manifest.json`); the PRODUCTION manifest (which
real records) is an owner-supplied named run-time input — recorded as an exit-annex
deployment row, NOT-satisfied until supplied.

Named bounds (constants): `IMPORT_MAX_ROWS = 1024`; `CORPUS_MAX_ITEMS = 4096`;
per-row ref arrays ≤ 64 (the F05.4 cap); `sourcePath`/`gitIdentity` ≤ 4,096/256
bytes; each emitted event payload ≤ 65,536 bytes (substrate cap — an over-size row
refuses `IMPORT_LIMIT_EXCEEDED`). Reserved gate namespace: a `gate.*` or `human.*`
literal anywhere refuses (`IMPORT_STATUS_UNKNOWN` in `claimedStatus`;
`IMPORT_ARGUMENT_INVALID` elsewhere), and **no FK-P11 shape carries a gate-satisfaction
field at all** (a smuggle such as `gateSatisfied: true` is an unknown-field refusal).
Import-time failure precedence (documented first-failure order; one precedence-edge
fixture per family): structural → corpus-manifest consistency → limits → lineage
membership → digest match → approval-evidenced-ness → field-conflict
(`DIVERGENCE_STOP`) → epoch. Same-lineage exemption (coordinator ruling F-7,
2026-09-29): goals imported by a recorded epoch of the SAME lineage root are
exempt from the field-conflict family's vs-recorded checks — re-import of an
imported lineage is the epoch's refusal (`IMPORT_EPOCH_EXISTS`, forever), and
`existing-state-collision` protects against ALIEN pre-existing goals only
(CTL-08: collision only for the same `goalId`). Field-conflict sub-order (T5
table order): status → ratification-fact → human-gate-fact → revision → lease →
pending-transition → wakeup-handoff → idempotency → existing-state-collision.

### T2 Field-level authority matrix (D2/D14 — per-field winner + conflict behavior)

Post-cutover, per field class: the named winner is the only source that may determine
the value; a disagreement **stops** (never overwrites, never repairs, never picks a
winner at runtime). `DIVERGENCE_STOP` reasonCodes are the closed enum in T5; the
import-time codes are T10.

| Field / fact class | Winner (post-cutover) | Import behavior | Conflict behavior (STOP, never overwrite) |
|---|---|---|---|
| Ratified canon (charter/spec/policy/review/committed-proof bytes) | **Git** | recorded as provenance refs only (`RatificationRef` → evidence-index rows + event payload); never materialized as state | claimed digest ≠ committed bytes at claim → `IMPORT_SOURCE_DIGEST_MISMATCH`; competing claims or post-cutover drift → `DIVERGENCE_STOP(ratification-fact)` |
| Human-gate facts (approvals; F05.4 `GitGateEvidenceRef`) | **Git** (evidence-derived, D9) | recorded ONLY as provenance-bound evidence records (T3); never as state | unevidenced/fabricated → `IMPORT_APPROVAL_UNEVIDENCED` (refused); digest contradiction → `IMPORT_SOURCE_DIGEST_MISMATCH`; competing claims / post-cutover evidence drift → `DIVERGENCE_STOP(human-gate-fact)` |
| Goal status | **SQLite** (seeded once at cutover; thereafter only FK-P10 engine edges may change it) | materialized as `goals.status` (FK-P10 T1 vocabulary only) + full provenance in the `import.recorded` payload | two sources disagree → `DIVERGENCE_STOP(status)`; goal already present in the ledger → `DIVERGENCE_STOP(existing-state-collision)`; out-of-vocab literal → `IMPORT_STATUS_UNKNOWN` |
| Revision (`goals.revision`, CAS) | **SQLite** | row created at `revision = 1` (the substrate's CAS baseline — OQ-5 ruling); `claimedRevision` is provenance-only | legacy assertion colliding with recorded state → `DIVERGENCE_STOP(revision)`; never written to `goals.revision` |
| Leases | **SQLite** | provenance-only; FK-P11 creates **zero** `leases` rows (a legacy ownership claim is never manufactured into a live lease; post-cutover holders claim through FK-P10) | competing legacy claims or claim-vs-live-lease → `DIVERGENCE_STOP(lease)` |
| Pending transition | **SQLite** | provenance-only; zero `transitions` rows created | competing claims → `DIVERGENCE_STOP(pending-transition)` |
| Idempotency keys | **SQLite** | FK-P11 writes **zero** `idempotency_keys` rows (the epoch record is the one-shot guard; FK-P10 T6 semantics are never reimplemented); legacy binding claims provenance-only | claim colliding with a recorded binding → `DIVERGENCE_STOP(idempotency)` |
| Wakeups / handoffs | **SQLite** | provenance-only (`claimedWakeupCount`/`claimedHandoffCount`; semantics unassigned per FK-P10 OQ-7); zero `wakeup_handoffs` rows | competing claims → `DIVERGENCE_STOP(wakeup-handoff)` |
| Projection cursor | **SQLite** | FK-P11 advances only its registered ids (T7); `goal-state` is read-only for FK-P11 | write attempt on an unregistered id → `CURSOR_ID_UNREGISTERED(unregistered)`; on `goal-state` → `CURSOR_ID_UNREGISTERED(reserved)` |
| Evidence index (`artifacts`) | **SQLite as index only** (the referenced artifacts remain Git-authoritative — FK-P9 rule; the table never becomes evidence authority) | imported approvals + ratification refs recorded as index rows under FK-P11's owned `artifacts.kind` vocabulary (`import.epoch`, `import.approval`, `import.ratification-ref` — *(P11/P21)* per FK-P9) | referenced bytes disagree with Git → `DIVERGENCE_STOP(human-gate-fact)` / `(ratification-fact)`; at import → `IMPORT_SOURCE_DIGEST_MISMATCH` |

### T3 No manufactured approvals (D9 — mechanically tested)

1. **Gate satisfaction is never writable state.** No FK-P11 shape or write path carries
   a gate column, gate status value, or gate-satisfaction field; `gate.*`/`human.*`
   literals refuse everywhere. (FK-P10's `GATE_STATE_NOT_WRITABLE` invariant is
   preserved: FK-P11 adds no column, no status value, no write API.)
2. **`claimedStatus = 'completed'` requires ≥ 1 valid `ApprovalClaim`** — the L4
   gate-dependence mirrored at materialization. A `completed` row with zero claims, or
   whose claims include any invalid one, refuses `IMPORT_APPROVAL_UNEVIDENCED`. Valid
   claims never launder invalid ones.
3. **Every approval claim present must be evidence-derived regardless of status:**
   its provenance must resolve in the lineage (commit in lineage; blob present at
   `sourceCommit`/`sourcePath`; claimed `digest` equals the digest FK-P11 computes over
   the returned bytes). A well-formed-but-unresolvable claim is fabricated and refuses
   `IMPORT_APPROVAL_UNEVIDENCED`.
4. **Imported approvals are evidence records, never conclusions.** They land as
   evidence-index rows plus refs bound into the `import.recorded` event payload. The
   import never records "gate satisfied"; genuineness/sufficiency is derived downstream
   (FK-P12/FK-P15) and is **never claimed here** (D13 honesty).
5. **The 25-edge machine is never traversed or minted by the import.** FK-P11 creates
   zero `transitions` rows and calls no engine edge; an imported status is a
   provenance-bound materialization of what the committed legacy record says, not a
   transition outcome. The gate-evidence-bound edges (T2 L4 `active→completed`, L6
   `awaiting-human→active`) are exactly the ones the import must never manufacture:
   a legacy "resumed from awaiting-human" narrative lands as provenance only, and any
   approval it claims is subject to rule 3. The zero-row assertions (zero `transitions`,
   zero `leases`, zero `idempotency_keys` rows after import) are named
   failing-when-broken tests and stay (risk (c) ACK).
6. **A row claiming a fabrication is refused, never downgraded:** an evidence-missing
   approval is not imported as an ordinary unverified fact — the row refuses, and the
   **whole import aborts** (OQ-2 ruling: one epoch, one transaction; per-row
   dispositions would embed operator judgment in the machine and reopen the
   manufactured-approvals surface). Fixtures lock on abort semantics.

### T4 Cutover epoch (one-time, digest-bound, recorded)

- The epoch record is exactly: one `import.epoch` event (T8) **plus** one `artifacts`
  row (`kind: 'import.epoch'`, `digest` = the ImportDocument's canonical-JSON digest,
  `locator` = bounded `{ rootCommit, tipCommit, rowCount }` descriptor).
- The epoch binds: `documentDigest` (domain `foreman-line.kernel-import.import-document`),
  `corpusDigest` (canonical digest over the rows' `SourceProvenance` tuples), the
  corpus manifest's `sourceRevision`, the lineage `rootCommit`/`tipCommit`, `rowCount`,
  `principalRef`/`operationId` (identify, never authenticate — FK-P9 rule),
  `toolVersion`, and `recordedAtMicros` from the **injected Clock seam** (the only
  clock read in the package; no ambient time).
- **One epoch per source lineage (OQ-7 ruling).** The epoch-existence check and the
  epoch insert run inside the import's single `withTransaction`, so exactly one import
  per lineage can ever commit. Any subsequent run whose lineage root matches a recorded
  epoch refuses `IMPORT_EPOCH_EXISTS` — with the same document, a different document, a
  different tip, or after the package has been rolled back (the epoch is history). A
  second, distinct lineage may import later; the no-manufactured-approvals property
  holds per epoch.
- **Atomic all-or-nothing:** the entire import (corpus-manifest verification, all
  `goals` rows, `import.recorded` events, evidence-index rows, cursor rows, and the
  epoch record) is ONE `withTransaction`. A crash at any point rolls back to
  fully-absent (WAL), and a rerun completes exactly once (INT/REI fixtures).

### T5 Divergence-stop (THE named refusal code)

`DIVERGENCE_STOP` is the named, closed refusal code for every field-level authority
divergence (import-time conflicts and post-cutover Git-vs-SQLite drift alike). Safe
diagnostic: the closed `reasonCode` literal plus a goal/field id only — no row content,
no host path. Decision semantics: REFUSE at the API boundary (a deliberate structured
refusal, never a kernel-failure shape).

| reasonCode | Fires when | Fixture |
|---|---|---|
| `ratification-fact` | two sources claim different ratified bytes for one artifact; or recorded ratification bytes drift after the epoch | CON-02, CON-10 |
| `human-gate-fact` | two sources claim different approval digests for one gate fact; or recorded evidence bytes drift after the epoch | CON-03, CON-10 |
| `status` | two sources disagree on one goal's status | CON-01 |
| `revision` | a legacy revision assertion collides with recorded state | CON-04 |
| `lease` | competing legacy lease claims; or a legacy claim vs a live lease | CON-05 |
| `pending-transition` | competing pending-transition claims | CON-06 |
| `wakeup-handoff` | competing wakeup/handoff claims | CON-07 |
| `idempotency` | a legacy binding claim collides with a recorded binding | CON-08 |
| `existing-state-collision` | an imported row targets a goal already present in the ledger | CON-09 |
| `projection-source-drift` | at render time, Git-side bytes for a Git-winner field no longer match the epoch-bound digest | CON-10 |

Semantics: FK-P11 **stops** — at import the whole transaction refuses (nothing
imported); at projection the render refuses (no bytes emitted, cursor unmoved). The
exported `checkDivergence` surface (T8) re-derives every Git-winner field through the
lineage reader against the epoch-bound digests and the current ledger rows and either
passes or throws `DIVERGENCE_STOP`. This surface + its fixture matrix is FK-P11's
named RS-1.4(c) exit-duty evidence for the divergence-stop fragment.

### T6 Deterministic Markdown projection

Two registered whole-ledger views; each renders one deterministic document from state
(OQ-4 ruling: exactly these two views; bytes-only output):

| projectionId | Content |
|---|---|
| `md-goals-index` | goals index — one line per goal (`goalId`, status, revision, pending transition or `-`, active lease holder or `-`), sorted by `goalId` in UTF-16 code-unit order |
| `md-goal-ledger` | full per-goal detail — status/revision/lease/pending, the goal's evidence-index refs (safely rendered), and its import provenance (`sourcePath`, `sourceDigest`, `sourceCommit`) + epoch id |

Render contract (byte-stability invariant):

1. **Clock-free and version-stable-by-format:** the bytes contain no live-clock value,
   no wall-time, and no `toolVersion`. A fixed `projectionFormatVersion: '0.1.0'`
   literal appears in the header block alongside `projectionId` and
   `renderedThroughEventSeq`. Timestamps are rendered only as state-derived integer
   micros.
2. **Ordering is canonical:** rows sort by canonical key (UTF-16 code-unit order, the
   F05.5 discipline); the same logical state yields identical bytes regardless of row
   insertion order, page layout, checkpoint history, or in-memory member order.
3. **Canonical-strict decode:** event payloads and stored strings decode under the
   F05.5 byte rules; non-canonical bytes or unpaired surrogates refuse
   (`PROJECTION_INPUT_NONCANONICAL`); a stored status outside the FK-P10 T1 vocabulary
   or an unnormalizable row refuses (`PROJECTION_STATE_INVALID`) — fail closed, never
   render a guess.
4. **Sanitization (#31) + linear-time (#19):** every interpolated external string
   (goal ids, source paths, `gitIdentity`, any legacy text) passes the deterministic
   `sanitizeForMarkdown` before it enters the template: **backslash escapes first**
   (coordinator rework R1 — the escaper escapes itself: every `\` becomes `\\`
   before any other escape, so a raw input backslash can never re-mark a
   delimiter as live); `\r` removed; embedded newlines
   collapsed to a single line; control chars U+0000–U+001F/U+007F and format chars
   (U+200B, U+200E/F, U+202A–U+202E, U+FEFF) replaced with a fixed literal;
   Markdown structural delimiters escaped deterministically (backtick runs, `|`,
   leading `#`/`-`/`>`/`<digits>.` at line starts); HTML-ish payloads rendered inert.
   The sanitizer is linear-time string handling with hostile tests pinning the bound.
   Line-protocol delimiters can never be broken from legacy text.
5. **Git-winner fields render through the matrix:** ratification and human-gate facts
   render only after the lineage reader confirms the recorded digests still match the
   committed bytes; drift refuses the render (`DIVERGENCE_STOP(projection-source-drift)`)
   — "generated Markdown follows the field-level authority matrix and stops on
   divergence".
6. **Render is pure given (state rows, reader answers)**; `publishProjection` advances
   the stream's registered cursor to the current max `event_seq` inside one
   `withTransaction` and returns `{ markdownBytes, projectionDigest,
   renderedThroughEventSeq, cursorBefore, cursorAfter }`. A refused render leaves the
   cursor unmoved. **The projection emits DATA (bytes) only (OQ-4 ruling): FK-P11
   writes NO repo files and holds NO mutation authority (the D10 family); the owned
   Markdown writer is FK-P13-class deferred territory (Out of Scope).**

### T7 Registered projection cursors (never a silent grab)

| projectionId | Status | Owner |
|---|---|---|
| `goal-state` | **RESERVED** — the FK-P10 engine state-application cursor (its T7/OQ-4 ruling) | FK-P10 (FK-P11 reads only) |
| `md-goals-index` | registered for FK-P11's index stream (name CONFIRMED) | FK-P11 |
| `md-goal-ledger` | registered for FK-P11's detail stream (name CONFIRMED) | FK-P11 |

Registration of the two FK-P11 ids arrives inside the **recorded FK-P9 amendment A1e**
(T12; the A1-family route) before builder code — never an in-parcel constant grab
(FK-P10 OQ-4: "FK-P11 registers any additional cursor ids via a recorded FK-P9
amendment … no silent namespace grabs"). The runtime registry is the closed set above;
`setProjectionCursor` with any other id refuses `CURSOR_ID_UNREGISTERED(unregistered)`,
and a write attempt on `goal-state` from FK-P11 refuses
`CURSOR_ID_UNREGISTERED(reserved)`. Cursor rows are created at import with
`last_applied_event_seq = 0` (nothing published yet) and move only inside
`publishProjection`'s transaction. Concurrent publishes of one stream serialize under
the storage write lock; both renders are byte-identical either way (asserted
interleaving fixture).

### T8 Event vocabulary (FK-P11-owned kinds; A1e carries them)

| Kind | Emitted by | Payload (canonical JSON, ≤ 65,536 bytes) |
|---|---|---|
| `import.recorded` | one per imported goal row | `goalId`, `importedStatus`, `source` (SourceProvenance), `claimedRatificationRefs`, `claimedApprovals` (F05.4 members + provenance), `claimedOperationalFacts`, `epochId`, `documentDigest`, `principalRef`, `operationId`, `toolVersion` |
| `import.epoch` | exactly one per cutover | `epochId`, `rootCommit`, `tipCommit`, `documentDigest`, `corpusDigest`, `corpusSourceRevision`, `rowCount`, `principalRef`, `operationId`, `toolVersion`, `recordedAtMicros` |

These two kinds extend FK-P10 T8's closed `events.kind` vocabulary and travel inside
the single recorded FK-P9 amendment **A1e** (OQ-3 ruling), which also carries the
cursor registrations and an `events.kind` CHECK migration (defense-in-depth parity
with the A1a/A1b CHECKs); FK-P10's ownership of the vocabulary is preserved in the
record (the A1 precedent). Payloads never carry credentials, prompts, source payloads,
or secrets (charter §5; writer-contract fixture). `events.principal_ref`/`operation_id`
carry the request identity (identify, never authenticate). Alternative considered and
rejected: recording the import with `artifacts` rows only (no events) — rejected
because the append-only ledger is the audit surface and projection cursors advance
over `event_seq`.

### T9 Exported API surface

`createImporter({ storage, clock, toolVersion, lineageReader })` and
`createProjector({ storage, lineageReader })` wrap an FK-P9 `Storage` handle, an
injected FK-P9 `Clock` (importer only), and the lineage reader (the shipped
`GitLineageReader` in production; an injected seam in tests). Refusals throw typed
`ImportError` (T10).

| Export | Kind | Result |
|---|---|---|
| `runImport(importer, { importDocument, principalRef, operationId })` | effectful (exactly one `withTransaction`) | `{ epoch: EpochRecord, importedGoalIds, recordedEventSeqs }` |
| `getEpoch(importer, { rootCommit })` | read | the `EpochRecord` recorded for ONE source lineage, or `null` — keyed by lineage root (coordinator clarification 2026-09-29: T9's "single recorded EpochRecord" is per lineage under OQ-7; a missing/ambiguous query refuses). `getAllEpochs(importer)` returns the full recorded set |
| `checkDivergence(importer \| projector)` | read + reader | passes or throws `DIVERGENCE_STOP` (T5) |
| `renderProjection(projector, { projectionId })` | read + reader (pure render; no writes) | `{ markdownBytes, projectionDigest, renderedThroughEventSeq }` |
| `publishProjection(projector, { projectionId })` | effectful (one `withTransaction`: cursor advance) | as `renderProjection` + `{ cursorBefore, cursorAfter }` |
| `getProjectionCursor(projector, { projectionId })` | read | `{ projectionId, lastAppliedEventSeq }` (registered ids only) |

No exported parameter carries a timestamp, `now`, or absolute time (the importer's
clock is a constructor seam; hostile rows assert the request shapes admit no time
source). No export writes `leases`, `transitions`, or `idempotency_keys`, and none
calls an FK-P10 engine operation. No export mutates the repository or git state.

### T10 Closed error registry (`ImportError`; 14 codes — the T10 thirteen + `IMPORT_SOURCE_BLOB_ABSENT` per coordinator ruling F-6, 2026-09-29; F05.10 safe diagnostics)

| Code | Raised when | Safe diagnostic |
|---|---|---|
| `IMPORT_ARGUMENT_INVALID` | structural input failure (unknown/missing field, bad Id/Digest/CommitId/Micros shape, reserved gate literal outside `claimedStatus`, inverted lineage at document level, malformed cursor id, corpus-manifest structural violation: row outside the manifest, missing disposition/reason, duplicate item, excluded item with a row) | field path only |
| `IMPORT_LIMIT_EXCEEDED` | named bound exceeded (rows, corpus items, ref array, path length, payload bytes) | field name + bound value only |
| `IMPORT_SOURCE_DIGEST_MISMATCH` | a claimed digest contradicts bytes that DO resolve (row source, ratification ref, approval ref, a manifest-item/row disagreement, or the document's own `corpusDigest`) | row/field id only |
| `IMPORT_SOURCE_BLOB_ABSENT` | the claimed digest cannot be established because the blob does not exist at `sourceCommit`/`sourcePath` (F-6: distinct cause from `IMPORT_SOURCE_DIGEST_MISMATCH` — bytes never resolved; different operator response) | row/field id only |
| `IMPORT_COMMIT_OUT_OF_LINEAGE` | a claimed commit — or the manifest's `sourceRevision` — lies outside the lineage closure (unknown, sibling lineage, or beyond root..tip) | commit id only |
| `IMPORT_EPOCH_EXISTS` | re-import of an imported source lineage | root commit + epoch id only |
| `IMPORT_APPROVAL_UNEVIDENCED` | approval claim that cannot be established as committed lineage evidence (provenance absent, blob absent, or no claim where one is required) | row id + reason literal only |
| `IMPORT_STATUS_UNKNOWN` | `claimedStatus` outside the FK-P10 T1 vocabulary (incl. `gate.*`/`human.*`) | none |
| `DIVERGENCE_STOP` | field-level authority divergence (T5 closed reasonCode enum — THE named divergence code) | reason literal + goal/field id only |
| `CURSOR_ID_UNREGISTERED` | cursor id outside the registered set (reason `unregistered` \| `reserved`) | id + reason literal |
| `PROJECTION_INPUT_NONCANONICAL` | non-canonical payload/string bytes or unpaired surrogate at projection decode | field name only |
| `PROJECTION_STATE_INVALID` | stored row unnormalizable or status outside T1 (defense-in-depth read refusal) | none |
| `LINEAGE_READER_FAILURE` | lineage-reader failure or nonconforming return (shipped git reader or injected seam; HARNESS_*-branded seam errors rethrow unwrapped — never laundered) | reader code literal only |
| `STORAGE_FAILURE` | wrapped FK-P9 `StorageError` at a substrate seam | FK-P9 `StorageErrorCode` literal only |

14 codes, closed (coordinator ruling F-6 adds `IMPORT_SOURCE_BLOB_ABSENT`; provenance
"coordinator rulings F-1/F-2/F-3/F-5/F-6/F-7, 2026-09-29"). No driver message text, host path, row content, credential, seam
message text, or unbounded value can reach a caller (fault-injection test per code).
The named refusal codes fire as themselves across every boundary: a boundary fallback
never erases a named refusal into `STORAGE_FAILURE` (the three-instance
error-laundering class; ERR-03 failing-when-broken).

### T11 Hostile-fixture inventory (dominant hostile space; 85 fixture records — derived from the fixture rows)

Records live in `tests/fixtures/`; hostile cases are JSON tables of
`{ id, input, expectedCode | expectedOutcome, expectedReasonCode? }`, canonical cases
are committed byte vectors, controls are positive rows. Every row carries one
pre-declared expected outcome; the inventory-map test proves the counts and
one-outcome-per-row. Each invalid shape gets its own row (#30); each named invariant
gets a failing-when-broken mutation (#32); each refusal family gets at least one
precedence-edge row (the documented first-failure order is what fires).

| Class | IDs | Count | Expected |
|---|---|---|---|
| F1 Fabricated approval | FAB-01 approval claim with no provenance (evidence-missing); FAB-02 well-formed ref, blob absent at claimed commit/path; FAB-03 `completed` row with zero claims; FAB-04 `completed` row mixing one valid + one invalid claim; FAB-05 unknown `evidenceKind`; FAB-06 malformed ref digest; FAB-07 malformed `gitIdentity`; FAB-08 gate-state smuggle field (`gateSatisfied: true`); FAB-09/FAB-10 reserved gate status literals (`gate.satisfied`, `human.approved`); FAB-11 refs array at 65 entries; FAB-12 resume-claim row (awaiting-human→active narrative) claiming an unevidenced approval | 12 | FAB-01/02/03/04/12 `IMPORT_APPROVAL_UNEVIDENCED`; FAB-05/06/07/08 `IMPORT_ARGUMENT_INVALID`; FAB-09/10 `IMPORT_STATUS_UNKNOWN`; FAB-11 `IMPORT_LIMIT_EXCEEDED`; nothing imported in any case (whole-import abort) |
| F2 Digest mismatch | DIG-01 row `sourceDigest` ≠ computed committed-bytes digest (or — the DIG-01 family's F-6 absent case — the source blob is absent at `sourceCommit`/`sourcePath` → `IMPORT_SOURCE_BLOB_ABSENT`, carried as a named case inside the closed 67-record count); DIG-02 ratification ref digest ≠ committed bytes; DIG-03 approval ref digest ≠ committed blob bytes (blob resolves); DIG-04 document `corpusDigest` ≠ canonical digest of row provenance tuples | 4 | `IMPORT_SOURCE_DIGEST_MISMATCH` per row (absent-blob case: `IMPORT_SOURCE_BLOB_ABSENT`) |
| F3 Commit-boundary | CMT-01 unknown claimed commit; CMT-02 claimed commit in a sibling lineage; CMT-03 approval/ratification provenance commit outside root..tip though the blob resolves; CMT-04 `tipCommit` not a descendant of `rootCommit`; CMT-05 `sourcePath` escaping repo-relative form (traversal/host path); CMT-06 malformed commit-id length (neither 40 nor 64 hex) | 6 | CMT-01/02/03 `IMPORT_COMMIT_OUT_OF_LINEAGE`; CMT-04/05/06 `IMPORT_ARGUMENT_INVALID`; no host path echoed |
| F4 Re-import | REI-01 second run, same lineage; REI-02 same root, different tip/document; REI-03 re-import after package rollback (rows still present); REI-04 recovery-positive: kill mid-import then rerun | 4 | REI-01/02/03 `IMPORT_EPOCH_EXISTS` (the epoch is history and refuses forever); REI-04 completes exactly once with one epoch record |
| F5 Field conflicts → divergence-stop | CON-01 status; CON-02 ratification-fact; CON-03 human-gate-fact; CON-04 revision; CON-05 lease; CON-06 pending-transition; CON-07 wakeup/handoff; CON-08 idempotency; CON-09 existing-state-collision (goal already in ledger); CON-10 projection-source-drift (post-cutover Git byte change) | 10 | `DIVERGENCE_STOP` with the named reasonCode per row (each conflict class its own fixture); import rows: nothing imported; CON-10: render refuses with cursor unmoved |
| F6 Projection determinism | PRJ-01 same state rendered twice; PRJ-02 row insertion-order permutation; PRJ-03 injected clock/ambient-time attempt; PRJ-04 non-canonical event payload bytes; PRJ-05 seeded status outside T1; PRJ-06 injected nondeterministic ordering (mutation, #32); PRJ-07 unpaired surrogate in a stored string | 7 | PRJ-01/02/03 byte-identical outputs (`projectionDigest` equal; PRJ-03 bytes independent of injected clock); PRJ-04/07 `PROJECTION_INPUT_NONCANONICAL`; PRJ-05 `PROJECTION_STATE_INVALID`; PRJ-06 the named determinism test FAILS when the nondeterminism is injected |
| F7 Cursor grabs | CUR-01 unregistered cursor id write; CUR-02 `goal-state` write attempt from FK-P11; CUR-03 malformed cursor id; CUR-04 invented per-goal id (`md-goal-detail.<goalId>`) | 4 | CUR-01/04 `CURSOR_ID_UNREGISTERED(unregistered)`; CUR-02 `CURSOR_ID_UNREGISTERED(reserved)`; CUR-03 `IMPORT_ARGUMENT_INVALID` |
| F8 Partial-import interruption (real child-process kill) | INT-01 kill mid-row-insert pre-commit; INT-02 kill after epoch event insert pre-commit; INT-03 kill post-commit pre-return; INT-04 kill mid-`publishProjection` cursor transaction | 4 | INT-01/02: rollback to fully-absent (goals/events/artifacts/cursors row-exact), rerun completes (asserted-reached kill point — MIG-02/CR precedent); INT-03 state fully applied and retry refuses `IMPORT_EPOCH_EXISTS` (never double-apply); INT-04 cursor unmoved and render remains byte-deterministic |
| F9 Projection output injection (#31) | INJ-01 newline/CR in goal id/path cells; INJ-02 code-fence breakout (three-backtick run); INJ-03 control chars (U+0000, U+001F, DEL); INJ-04 bidi/format chars (U+202E, U+200B, U+200E, U+FEFF); INJ-05 Markdown structural delimiters (`\|`, leading `#`/`-`/`>`/`1.`); INJ-06 HTML-ish payload (`<script>`, `<img onerror=`); INJ-07 terminal-escape/EOF-marker injection (NUL, `\u001b`) | 7 | per row: the rendered bytes contain the sanitized form only — no injected line, fence, heading, table break, HTML effect, or control byte survives (golden-bytes assertion per row) |
| F10 Error laundering (three-instance class) | ERR-01 HARNESS_*-branded seam error rethrows unwrapped; ERR-02 wrapped `StorageError` carries the code literal only; ERR-03 boundary fallback never erases a named refusal (transient substrate fault inside the import transaction) | 3 | ERR-01 the harness error surfaces as itself (failing-when-broken: wrapping it fails the test); ERR-02 no driver text reaches a caller; ERR-03 the named refusal fires, never a `STORAGE_FAILURE`-shaped erasure |
| F11 Corpus manifest (INF-7) | CM-01 row source not enumerated in the manifest (glob-style extraction attempt); CM-02 manifest item without disposition/reason; CM-03 duplicate manifest items; CM-04 manifest `sourceRevision` outside the lineage; CM-05 manifest-item/row digest disagreement; CM-06 `excluded` item that produced a row | 6 | CM-01/02/03/06 `IMPORT_ARGUMENT_INVALID`; CM-04 `IMPORT_COMMIT_OUT_OF_LINEAGE`; CM-05 `IMPORT_SOURCE_DIGEST_MISMATCH`; nothing imported in any case |
| Controls | CTL-01 full import on a fresh ledger (2 goals: `active` with provenance; `completed` with one evidenced approval) — epoch recorded once, rows exact; CTL-02 reopen reconstructs identical state (in-suite evidence, never the FK-P15 proof); CTL-03 `md-goals-index` golden bytes; CTL-04 `md-goal-ledger` golden bytes; CTL-05 publish advances the cursor 0→N transactionally and a republish of unchanged state is byte-identical with no cursor movement; CTL-06 `checkDivergence` passes on a clean matrix (non-vacuous); CTL-07 evidenced approval renders through the projection sanitized; CTL-08 import alongside pre-existing engine-created goals (collision only for the same `goalId`); CTL-09 the synthetic TEST corpus manifest imports cleanly (manifest consumed exactly; `excluded` items produce no rows but keep their dispositions); CTL-10 both commit-id shapes accepted (40-hex and 64-hex), each its own fixture row | 10 | each passes as named; CTL rows prove the suite can observe success |
| Canonical | 8 byte-rule vectors (key order UTF-16, array order, escape set, digits-only integer lexemes, Unicode non-normalization, no path case folding, empty containers, unpaired-surrogate rejection) | 8 | byte-exact re-derivation by the local F05.5 encoder + read-only cross-check against FK-P1 golden fixtures |

Counts (derived from the fixture rows; coordinator ruling F-1, 2026-09-29): 12+4+6+4+10+7+4+4+7+3+6 = **67 hostile** + 10 controls + 8 canonical = **85
fixture records** (derived from the fixture rows). Hostile classes dominate (~79%).

### T12 Recorded amendment predecessor: FK-P9 amendment A1e (must land before Step-0)

One recorded FK-P9-owned amendment **A1e** (the A1-family route) — dispatched to the
FK-P9 owner-session in parallel with this spec's incorporation and REQUIRED to land
before Step-0 (the A1b-class gate) — carries exactly three components (OQ-3 ruling):

1. **Projection-cursor registrations:** `md-goals-index` and `md-goal-ledger` as
   reserved `projection_cursors.projection_id` values alongside FK-P10's reserved
   `goal-state` (names confirmed). Record-only; no schema change is needed for the
   registration itself (the column is Id-shaped and unconstrained — the A1c
   precedent).
2. **Events-kind vocabulary extension:** `import.recorded` and `import.epoch` added to
   the closed `events.kind` vocabulary, with FK-P10's T8 ruling carried in the record
   and FK-P10's ownership of the vocabulary preserved (the A1 precedent).
3. **An `events.kind` CHECK migration:** defense-in-depth parity with the A1a/A1b
   status CHECKs (migration file FK-P9-owned, transactional per the FK-P9 ABI).

`artifacts.kind` values (`import.epoch`, `import.approval`, `import.ratification-ref`)
stay FK-P11-owned (*(P11/P21)* per the FK-P9 schema) — no amendment. If the FK-P9
owner-session splits A1e into separate records, the split is cosmetic; the gate is
that all three components land before Step-0.

## Allowed Files

Proposed builder ceiling, inactive until dispatch — exact 47-file ceiling.
**Expansion provenance: coordinator ruling 2026-09-29 (OQ-8/OQ-1 consequence;
reported per stop-and-report trigger)** — the 43 → 47 expansion (`src/lineage-git.ts`,
`tests/lineage-git.test.ts`, `tests/fixtures/hostile/corpus.json`,
`tests/fixtures/corpus/test-corpus-manifest.json`) is APPROVED as a required
consequence of the OQ-8 ruling (ship the real-Git reader — never drop it) and OQ-1
(manifest fixtures); 47 exact non-glob paths satisfies SPEC-CONVENTION §4.8:

- `plugins/foreman-line/kernel-import/package.json`
- `plugins/foreman-line/kernel-import/package-lock.json`
- `plugins/foreman-line/kernel-import/tsconfig.json`
- `plugins/foreman-line/kernel-import/biome.json`
- `plugins/foreman-line/kernel-import/README.md`
- `plugins/foreman-line/kernel-import/src/index.ts`
- `plugins/foreman-line/kernel-import/src/errors.ts`
- `plugins/foreman-line/kernel-import/src/canonical.ts`
- `plugins/foreman-line/kernel-import/src/import-document.ts`
- `plugins/foreman-line/kernel-import/src/lineage.ts`
- `plugins/foreman-line/kernel-import/src/lineage-git.ts`
- `plugins/foreman-line/kernel-import/src/import.ts`
- `plugins/foreman-line/kernel-import/src/divergence.ts`
- `plugins/foreman-line/kernel-import/src/projection.ts`
- `plugins/foreman-line/kernel-import/src/sanitize.ts`
- `plugins/foreman-line/kernel-import/src/cursors.ts`
- `plugins/foreman-line/kernel-import/schemas/legacy-import.schema.json`
- `plugins/foreman-line/kernel-import/schemas/import-epoch.schema.json`
- `plugins/foreman-line/kernel-import/tests/import.test.ts`
- `plugins/foreman-line/kernel-import/tests/approvals.test.ts`
- `plugins/foreman-line/kernel-import/tests/lineage.test.ts`
- `plugins/foreman-line/kernel-import/tests/lineage-git.test.ts`
- `plugins/foreman-line/kernel-import/tests/divergence.test.ts`
- `plugins/foreman-line/kernel-import/tests/projection.test.ts`
- `plugins/foreman-line/kernel-import/tests/projection-determinism.test.ts`
- `plugins/foreman-line/kernel-import/tests/sanitize.test.ts`
- `plugins/foreman-line/kernel-import/tests/cursors.test.ts`
- `plugins/foreman-line/kernel-import/tests/interruption.test.ts`
- `plugins/foreman-line/kernel-import/tests/errors.test.ts`
- `plugins/foreman-line/kernel-import/tests/canonical-conformance.test.ts`
- `plugins/foreman-line/kernel-import/tests/helpers/child-worker.ts`
- `plugins/foreman-line/kernel-import/tests/helpers/fake-lineage.ts`
- `plugins/foreman-line/kernel-import/tests/fixtures/hostile/approvals.json`
- `plugins/foreman-line/kernel-import/tests/fixtures/hostile/digest-mismatch.json`
- `plugins/foreman-line/kernel-import/tests/fixtures/hostile/commit-boundary.json`
- `plugins/foreman-line/kernel-import/tests/fixtures/hostile/reimport.json`
- `plugins/foreman-line/kernel-import/tests/fixtures/hostile/conflicts.json`
- `plugins/foreman-line/kernel-import/tests/fixtures/hostile/projection.json`
- `plugins/foreman-line/kernel-import/tests/fixtures/hostile/cursors.json`
- `plugins/foreman-line/kernel-import/tests/fixtures/hostile/interruption.json`
- `plugins/foreman-line/kernel-import/tests/fixtures/hostile/injection.json`
- `plugins/foreman-line/kernel-import/tests/fixtures/hostile/error-laundering.json`
- `plugins/foreman-line/kernel-import/tests/fixtures/hostile/corpus.json`
- `plugins/foreman-line/kernel-import/tests/fixtures/corpus/test-corpus-manifest.json`
- `plugins/foreman-line/kernel-import/tests/fixtures/controls.json`
- `plugins/foreman-line/kernel-import/tests/fixtures/canonical/encoder-vectors.json`
- `plugins/foreman-line/kernel-import/tests/fixtures/golden/projection-golden.json`

(The hostile fixture files carry the F1–F11 rows above, `test-corpus-manifest.json` is
the synthetic TEST corpus manifest (OQ-1), `controls.json` carries CTL-01..10, and
`encoder-vectors.json` carries the 8 canonical byte vectors. No fixture row may be
dropped to fit the ceiling.)

Nothing outside this package is writable. No shared manifest/export/schema/workflow/
lockfile is writable. FK-P11 owns only its new package manifest, lockfile, exports,
schemas, and fixtures. If implementation needs a path not listed here, the coordinator
records a spec amendment before code; no implied neighboring-path permission.

**Forbidden surfaces (exact):** `plugins/foreman-line/dispatch/**` (contested; RCM
Window-R discipline); `plugins/foreman-line/routing-policy/**` (contested;
`foreman-line-boundary-routing`); `plugins/foreman-line/mutation-scope-guard/**`
(FK-P2B / `foreman-line-boundary-routing` territory, RS-2.4); `plugins/foreman-line/hooks/**`
(contested; FK-P2B/FK-P3 territory); `plugins/foreman-line/skill-injection/**`
(`plugin-packaging-and-scaffolder` territory); `plugins/foreman-line/kernel-state/**`
(FK-P9-owned; READ-ONLY — schema/curriculum needs via recorded FK-P9 amendments only);
`plugins/foreman-line/kernel-lease/**` (FK-P10-owned; READ-ONLY);
`plugins/foreman-line/kernel-contracts/**` (FK-P1-owned; READ-ONLY conformance input);
`plugins/foreman-line/spec-body-compiler/**` (FK-P2-owned);
`plugins/foreman-line/contracts/**` (frozen pipeline A–F contracts);
`plugins/foreman-line/authority-registry/**` (FK-P0 source and generated registry);
`plugins/foreman-line/docs/SPEC-CONVENTION.md`; shared manifests/lockfiles/exports,
root workflow files, plugin/marketplace metadata; `docs/specs/INDEX.md`; other goals'
records (Jira linkage, corpus-registry R32 work, and shaping-emitter/ShapingResult
machinery are parent-coordinated).

## Acceptance Criteria

1. **One-time digest/commit-bound import over a manifest-defined corpus.** Every
   imported row is bound to a source digest and commit (digests computed from committed
   bytes via the lineage reader — never reader-supplied); the corpus manifest enumerates
   every input exactly with one disposition per item and is consumed ONLY (never globs;
   CM fixtures); the epoch binds the document, corpus, and manifest-revision digests;
   re-import is refused (`IMPORT_EPOCH_EXISTS`) for the same lineage with the same or
   different payloads and after package rollback (F4). Exactly one epoch per source
   lineage lands, atomically (F8).
2. **No manufactured approvals (D9).** Every T3 rule is mechanically tested:
   fabricated/evidence-missing/well-formed-but-unevidenced approvals refuse
   (`IMPORT_APPROVAL_UNEVIDENCED`, F1); `completed` without evidence refuses; imported
   approvals land only as provenance-bound evidence records; no gate-satisfaction
   write path, column, or status value exists anywhere in the package (failing-when-
   broken: adding one makes a named test fail); zero `transitions` rows are created and
   no L4/L6 outcome is ever manufactured (the zero-row failing-when-broken assertions
   stay).
3. **Field-level authority reconciliation.** The D2/D14 matrix (T2) is enumerated with
   a per-field winner and conflict behavior; every conflict class has its own fixture
   and raises `DIVERGENCE_STOP` with its named reasonCode (F5, ten classes); no
   conflict path overwrites, repairs, or silently picks a winner.
4. **Divergence-stop is the NAMED refusal code** `DIVERGENCE_STOP` with its closed
   reasonCode enum (T5), exposed through `checkDivergence`; the RS-1.4(c) exit-duty
   evidence (divergence-stop + import crash/recovery behavior) is recorded in the
   parcel's evidence; and no artifact claims enforcement, promotion, containment, gate
   genuineness verification, the FK-P15 process-boundary recovery proof, or any
   stranded INF obligation (D13; exit annex rows stay NOT-satisfied).
5. **Deterministic Markdown projection, data-only.** Both streams render byte-stable
   golden bytes (F6, F9); the same state yields identical bytes across runs, insertion
   orders, and injected clocks; no live clock or toolVersion appears in the bytes;
   non-canonical inputs refuse; the sanitizer holds every injection vector (#31) and is
   linear-time (#19). FK-P11 emits bytes only, writes NO repo files, and holds NO
   mutation authority (OQ-4 ruling; failing-when-broken on any file-writing path).
6. **Cursor discipline.** Only the registered ids exist (`goal-state` reserved-read;
   `md-goals-index`/`md-goal-ledger` registered inside the recorded FK-P9 amendment
   A1e, T12 item 1, landed before code); unregistered and reserved grabs refuse (F7).
7. **Commit-boundary integrity.** Rows claiming commits not in the imported lineage
   refuse (`IMPORT_COMMIT_OUT_OF_LINEAGE`, F3); both commit-id shapes are honored with
   their own fixtures (OQ-6); lineage membership and digests are computed by FK-P11
   from raw reader answers (T-seam rules 3–4).
8. **Partial-import interruption.** Real child-process kills at asserted-reached points
   mid-import recover to fully-absent or fully-applied (row-exact assertions; F8),
   reruns complete exactly once, and a post-commit kill never double-applies.
9. **Closed error registry + error-laundering discipline.** All 13 codes carry exactly
   one fault-injection test with the declared safe diagnostic shape; every boundary
   preserves the true cause (ERR-01..03 failing-when-broken); no driver/seam message
   text, host path, or row content reaches a caller.
10. **Default-deny and failing-when-broken.** One test per invalid shape per invariant
    (#30); one mutation per named invariant that must fail (#32), including the
    determinism mutation (PRJ-06) and the gate-smuggle mutation (FAB-08).
11. **Substrate/engine boundary.** No raw SQL; no engine operation calls; zero
    `leases`/`transitions`/`idempotency_keys` rows written; FK-P10 T6 semantics never
    reimplemented; no repository/git mutation reachable (the shipped reader is
    read-only plumbing, argv-array form); `kernel-state/**`, `kernel-lease/**`,
    `kernel-contracts/**` asserted byte-unchanged (pre/post digests) by the chain; only
    documented exports used.
12. **Mechanical completeness.** The exact 47-file ceiling holds; no root/workspace
    manifest registration and no shared lockfile alteration; the deterministic chain
    passes with direct exit codes retained; the load soak (≥13 loaded runs,
    flakes-are-failures) passes; two fresh independent architecture/risk reviews
    return verdicts on the ten mandated focus questions and neither fixes nor commits.

## Out of Scope

- Gate-evidence **genuineness/sufficiency** verification and `authorizeAction` —
  **FK-P12** (the import records evidence; it never verifies it). The admission-
  protected control catalog (`project`/`evidence` tools, D17 request/digest binding,
  lease-bound effectful calls) — **FK-P13** (deferred).
- Writing projection output to disk: FK-P11 emits deterministic **bytes** and holds no
  mutation authority (OQ-4 ruling; the D10 family). The owned Markdown writer is
  **FK-P13-class deferred territory** (named here so it is never claimed as shipped).
- Producing the PRODUCTION corpus manifest (which real records): an owner-supplied
  named run-time input per the OQ-1 ruling — recorded as an exit-annex deployment row,
  NOT-satisfied until supplied. FK-P11 ships the manifest CONTRACT and a synthetic
  TEST manifest only.
- Process-boundary restart/split-brain/stale-authority recovery proof and stateful
  placement — **FK-P14/FK-P15** (stranded per RS-2.2; never claimed here). FK-P11's
  crash evidence is in-suite real-process-boundary evidence labeled exactly as such.
- Legacy status-vocabulary translation for out-of-vocab legacy status words: FK-P11
  **refuses such rows at import** (typed refusal; rows never rewritten — OQ-9 ruling),
  and the exit-annex vocabulary-mapping row stays NOT-satisfied until an owner mapping
  decision is recorded (the A1d legacy-null precedent).
- Lease/CAS/idempotency/transition-legality semantics (**FK-P10**); storage mechanics,
  migrations, backup/export (**FK-P9**); wakeup/handoff semantics (FK-P10 OQ-7
  unassigned — counts are provenance-only here).
- Multi-epoch or merge semantics for a single lineage: one epoch per source lineage,
  no re-import (a second, distinct lineage may import later — OQ-7 ruling; delta/merge
  import for one lineage would need a future ratified amendment).
- Enforcement/promotion/containment claims and stranded-INF assembly: INF-4 retention,
  INF-6 baseline, INF-7 corpus manifest binding at goal-exit scope, INF-8 RPO/RTO and
  process-boundary recovery rows — exit-annex NOT-satisfied rows, never claimed.
- Any write to the Forbidden surfaces above (contested seams, `kernel-state/**`,
  `kernel-lease/**`, `kernel-contracts/**`, `contracts/**`, `authority-registry/**`,
  `SPEC-CONVENTION.md`, shared manifests/lockfiles/exports, workflows, plugin/
  marketplace metadata, other goals' records); Jira linkage, `INDEX.md` regeneration,
  corpus-registry (R32) work, shaping-emitter machinery (parent-coordinated).

## Context & References

Pinned by SHA-256 as computed on disk at shaping time (2026-09-29; re-verified at the
incorporation round). **Pin-integrity rule binds: every pin below is the COMMITTED
bytes at base HEAD `d5ca69b828f5f50b55a9a72954bb34d99ba42341`** (verified via
`git show HEAD:<path>`); uncommitted sibling state is never pinnable and never silently
reproduces a pin.

| Source | SHA-256 (committed bytes) | What is cited |
|---|---|---|
| [Live charter](../../goals/foreman-kernel/charter.md) | `29a08a63b8e1c540bfa6863a0244dddb7e08b1e3889dac64d10892f87b06b693` | D2, D9, D14 (field authority; evidence-derived gates; divergence-stop); §6 Wave-3a FK-P11 row + Wave-3 exit; §12 serialization; §15.3 dispatch contract |
| [FK-P1–FK-P21 dispatch plan](../../goals/foreman-kernel/fk-p1-p21-dispatch-plan.md) | `51c410c5deb63fd7390fe712d7c77e4b06ae05c223d00821713d9216508bbacf` | FK-P11 row (D2/D14 authority matrix; human-gate state evidence-derived D9); Wave-3a exit wording |
| [RS-2 Gate-1 re-ratification](../../goals/foreman-kernel/fk-rs2-gate1-reratification-2026-09-27.md) | `bb12ccb5c279b8c32095814c4a89ec577b4e0d7aa368656cd56c91a38d16b2ea` | RS-2.2: FK-P11 records divergence-stop + migration crash/recovery in its exit evidence (INF-8 in-scope fragment); RS-2.3 exit honesty |
| [RS-1 re-scope](../../goals/foreman-kernel/fk-rescope-RS1-2026-09-27.md) | `53251e4faeab5f7d11fe322e19bae82dc54a905d49def53ca990e9daaeb43cb1` | RS-1.4(c): the Wave-3 exit fragment for FK-P9–FK-P11's ledger properties (divergence-stop among them) |
| [FK exit annex draft](../../goals/foreman-kernel/fk-exit-annex-draft-2026-09-27.md) | `ab610e4d25a03c2f135a7f6d5759c07c939e00a38f7ab7c1be77988cbb15046b` | the NOT-claim list; §5 error-laundering class (three instances), legacy status-vocabulary row, watchdog/checkpoint-commit lesson. (Living record — this pin supersedes FK-P10's earlier `cceb32dd…` pin of its then-current committed bytes.) |
| [FK-P9 amendment A1-family record](../../goals/foreman-kernel/fk-p9-amendment-a1a2-2026-09-28.md) | `81570a368ed0af26025474b170a171f39deefefb1beb0e6b49a6bc20a5469ae7` | the recorded FK-P9 amendment route (A1/A2/A1c/A1d) this parcel's A1e predecessor follows; the "substrate, not policy" migration-boundary honesty pattern |
| [FK-P10 Stage-F closure](../../goals/foreman-kernel/fk-p10-stage-f-closure-2026-09-28.md) | `05afdf5748662831cdf8fd89b945ab9d7f0aae620d232905d7d7b4382494f7ff` | the flakes-are-failures + loaded-soak shape (16/16 loaded soak: 10 sequential + 3 dual-parallel pairs) and the F5-masking lesson (a fix must never delete/weaken a named-refusal assertion to make runs pass) |
| [FK-P10 R2 tripwire ruling](../../goals/foreman-kernel/fk-p10-r2-tripwire-ruling-2026-09-28.md) | `ad8c8bee608345caaf0e4bf77580439fb76491dadd494b66f65f16064b825003` | the bounded-rework precedent: restore named-loser assertions + relabel-mutation proof + one loaded soak pass before closure |
| [FK-P1 lifecycle/admission/decision contracts](../done/FK-P1-lifecycle-admission-decision-contracts.md) | `ec2d892288933845c32191e587a19b8a9f650e12d31538d28c78ca54552068a2` | F05.1 bounds; F05.4 `GitGateEvidenceRef` members verbatim; F05.5 digest literal + canonical byte rules; F05.10 safe-diagnostic discipline |
| [FK-P9 storage/migration ABI](../done/FK-P9-storage-migration-abi.md) | `f713bb43e96da78fd8e85a41ed8a18677761c3725b8af6fcc300571d30aab6f9` | substrate contract tables (`projection_cursors`, `artifacts`, `events`, `goals`); `withTransaction` seam; OQ-5 migration-serialization ruling; MIG-02 child-process-kill and CONC-03 concurrency precedents; "export is write-only-side — import is FK-P11's" |
| [FK-P10 lease/transition engine](../done/FK-P10-lease-transition-engine.md) | `b3a2871590a21f85039cdefe4849f9ec500e61905c723c9d5952dab430c53a06` | T1 status vocabulary; T2 25-edge machine (L4/L6 gate-evidence-bound); T7 `goal-state` cursor + the FK-P11 registration route (OQ-4); T8 closed event vocabulary; T6 idempotency semantics FK-P11 must not reimplement. (Re-pinned 2026-09-29 in the coordinator's commit-correction round: the previously-dirty delta — `status: done` + the AC11 23-code fix — is now committed bytes; the pin-integrity rule held throughout: the earlier pin bound the then-committed `57222d44…` and the dirty state was never pinned.) |
| [FK-P17 bypass/outage matrix](../done/FK-P17-bypass-outage-matrix.md) | `932a0262497b5a3f5e8a75c8732b085b581ad48d54081b7bc238c29d7d97880c` | the environment-prerequisite Verification Plan pattern; T4 mapping-never-redefines; skip-and-record discipline; banned-claim scan |
| [Spec convention](../../SPEC-CONVENTION.md) | **THREE-STATE** — target `70508684d2c929d1331ed0cd9a147fcc2206593a04fbf210314e22fb80cba0a8` (v0.4 revision); KNOWN-BASE `7ac315005cde6ad6def848b83de1d1b644e321c5d9f6434bc925deb6daba8703` | §4 schema + §4.8 Allowed Files authority (identity pin only — FK-P11 pins no grammar). Known-base pattern: `7ac31500…` is the committed pre-v0.4 state at base HEAD (verified via `git show HEAD:`); `70508684…` is the uncommitted RCM-P2 v0.4 delta (sibling write set) → KNOWN-GAP `blocked: RCM-P2 schema-v0.4 delta uncommitted` until it lands; any third state → `PIN_DRIFT` fail-closed |
| [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md) | `57e345f9294cb8fcd8c3d90325505c80903648f60522f820061a5f8f288a86ac` | #1, #2, #3, #19, #30, #31, #32, #34 |
| `plugins/foreman-line/kernel-state/src/index.ts` | `4656f5b9a70c64e7a61698f301b6843c27e39c5e5cb87a74d89098a819da3177` | exported substrate API FK-P11 composes |
| `plugins/foreman-line/kernel-state/src/rows.ts` | `6d0df36a6bf7fe9391c132cad0381c579c1a7b97d314da54b204f0e6fafaccad` | row primitives (incl. A1c/A1d reads) FK-P11 uses |
| `plugins/foreman-line/kernel-state/src/transactions.ts` | `5cd966ca82be09ebaaca786a43644fd4c9b80c31c1f0b2cf1f78c94f58b73aa1` | `withTransaction` — the only transaction primitive |
| `plugins/foreman-line/kernel-state/src/clock.ts` | `866e5920a25bb650200a3e11a4f2a834ecacc1ba7bd1414500b083d16de56d11` | `Clock` seam discipline (the importer's only time source) |
| `plugins/foreman-line/kernel-state/src/schema.ts` | `73e33202a890ee0f681970208572be4e21eb0a40172659075d1ed661ed8041c2` | `isId`/`isDigest`/`isSafeInt` validators reused |
| `plugins/foreman-line/kernel-state/src/errors.ts` | `a0bc31c0d1d5fb2bd717db22804ba70a36a78ab368897335ca3f56a4e93d80a4` | `StorageError` codes wrapped as `STORAGE_FAILURE` (literal only) |
| `plugins/foreman-line/kernel-state/src/canonical.ts` | `9bf206cf769791e633d52ab8c61e3165e4befd3901e323a209825bf7fa776d60` | F05.5 domains/byte rules FK-P11's local encoder mirrors |
| `plugins/foreman-line/kernel-state/package.json` | `46f917c33f77ac8d12113b82f034ea9f15a3c9b117f19f43d134cb467d377869` | `file:../kernel-state` dependency target |
| `plugins/foreman-line/kernel-lease/src/state-machine.ts` | `3ad8b2d690feae33909ae175a45427998f7b39b9f3b200a7e5d3eadbf48f0a22` | the T1 vocabulary + T2 edge-table data FK-P11 binds (single source; never re-decided) |
| `plugins/foreman-line/kernel-lease/src/index.ts` | `bc2d982f2a0c5a97f018beff344498b77f0389cb2781245bbdc404d25e19e67f` | the exported engine surface FK-P11 deliberately does NOT call |
| `plugins/foreman-line/kernel-lease/package.json` | `c2e309c150e5f8bcad9f4dd477b97839906977704ebfa65fcbafe1f8c090abdd` | `file:../kernel-lease` dependency target |
| `plugins/foreman-line/kernel-contracts/src/types.ts` | `819f173a7ffba499a923b8aadbdeddb584abf626e413635464788eef1eb0de51` | `GitGateEvidenceRef` members verbatim (read-only) |
| `plugins/foreman-line/kernel-contracts/tests/fixtures/golden-vectors.json` | `ba795f9d6de63b15831e24273256ec47a3d40af9f12d50b86b19f1e41c6a06dd` | read-only F05.5 conformance cross-check input (never written) |

All pins were cross-checked worktree-vs-committed at the incorporation round: every row
above is worktree-clean at its committed digest except SPEC-CONVENTION (the declared
three-state target). Recorded lesson (coordinator commit-hygiene, 2026-09-29): a stale
pathspec in a `git add` aborted and silently staged only a rename, leaving the two
FK-P10 closure records and the FK-P10 spec delta uncommitted at first pin time; the
repair commit landed them and this round re-pinned them as ordinary pinned records.
The pin-integrity rule held throughout: nothing uncommitted was ever pinned.

## Verification Plan

**Environment prerequisite (FK-P17 pattern).** The tests exercise the REAL FK-P9
substrate (real SQLite via the merged `kernel-state` package and its native binding),
the REAL FK-P10 state-machine data, the REAL FK-P1 golden fixtures, real child
processes, and — in `tests/lineage-git.test.ts` — the REAL git binary behind the
shipped `GitLineageReader` (temp fixture repositories materialized at test time). A
missing dependency tree or a missing `git` binary fails with one named
environment-prerequisite error — never skipped, never passed (a preflight test asserts
it first). Provision first: `npm ci` in `plugins/foreman-line/kernel-state/` (native
`better-sqlite3` binding install), then `npm ci` in `plugins/foreman-line/kernel-lease/`,
then `npm ci` in `plugins/foreman-line/kernel-import/` (each lockfile integrity-pins
its `file:` dependencies; lockfiles unchanged by the run).

Deterministic chain, run by the coordinator on the sequential Node lane (Windows rule
preserved: package setup and deterministic passes run sequentially even when reasoning
lanes are concurrent), after provisioning above, cwd the isolated `kernel-import`
package, full output and direct exit codes retained, in this exact order: `node -v`
(>=22); `npm ci` (kernel-state); `npm ci` (kernel-lease); `npm ci` (kernel-import);
`npm run typecheck`; `npm test` (which MUST include the fixture inventory map proving
85 records (derived from the fixture rows, never a hand-typed literal) with one pre-declared expected outcome each; the T2 conflict-class coverage
map (one fixture per `DIVERGENCE_STOP` reasonCode + one precedence-edge row per refusal
family); the corpus-manifest consumption tests (manifest-only, never globs; CM rows);
the real child-process kill suite with asserted-reached kill points; the
publish-serialization race with asserted interleaving and seeded preconditions (the
CONC-03 lesson); the real-git reader tests against temp fixture repositories; the #32
failing-when-broken mutation checks; the closed-registry fault-injection matrix (13
codes); the sanitization hostile matrix with golden bytes; and the read-only F05.5
conformance cross-check against FK-P1's golden fixtures in
`tests/canonical-conformance.test.ts`); `npm run lint`. The chain also asserts
`kernel-state/**`, `kernel-lease/**`, and `kernel-contracts/**` are byte-unchanged
(pre/post digests) and records the banned-claim scan result (D13 honesty: no
enforcement/promotion/gate-genuineness/FK-P15/stranded-INF claim in any emitted byte).

**Flakes-are-failures + load soak (≥13 loaded runs; the FK-P10 lesson).** The full
suite runs at least 13 loaded times under imposed CPU/IO load — the FK-P10 shape
recorded in its Stage-F closure (10 sequential + 3 dual-parallel pairs = 16 loaded
runs) is the model. **Any nondeterministic failure across runs fails the chain** — no
retry-and-ship, no flake-tolerance budget. The FK-P10 F5 lesson binds: a fix must
never delete or weaken a named-refusal/named-loser assertion to make runs pass — every
relabel/refusal-erasure mutation must fail a named test loudly (the R2 tripwire
precedent: restore the named-loser assertion + the relabel-mutation proof + one loaded
soak pass before closure). Races assert exact interleavings with seeded preconditions
(CONC-03: "asserted interleavings + seeded preconditions", never merely "no crash").
Interrupted-import rows kill at asserted-reached points (MIG-02 precedent) and assert
row-exact recovery (fully-absent or fully-applied, never partial).

**Error-laundering discipline.** Every boundary preserves the true cause (the
three-instance class in the exit annex: hardcoded success signals; seam rethrow
flattening; boundary fallback erasure). ERR-01..03 are failing-when-broken;
HARNESS_*-branded seam errors rethrow unwrapped; a named refusal can never surface as
`STORAGE_FAILURE` and vice versa.

**Acceptance-to-evidence map:** AC1 → `import.test.ts` +
`fixtures/hostile/reimport.json` + `fixtures/hostile/corpus.json` +
`fixtures/corpus/test-corpus-manifest.json` + `interruption.test.ts`; AC2 →
`approvals.test.ts` + `fixtures/hostile/approvals.json` + the gate-smuggle mutation
row; AC3 → `divergence.test.ts` + `fixtures/hostile/conflicts.json` (CON-01..10); AC4 →
`checkDivergence` tests + the recorded RS-1.4(c) exit-evidence fragment + banned-claim
scan record; AC5 → `projection.test.ts` + `projection-determinism.test.ts` +
`fixtures/golden/projection-golden.json` + `sanitize.test.ts` +
`fixtures/hostile/injection.json` + the no-file-write assertion; AC6 → `cursors.test.ts`
+ `fixtures/hostile/cursors.json` + the A1e recorded-amendment row (T12 item 1); AC7 →
`lineage.test.ts` + `lineage-git.test.ts` +
`fixtures/hostile/commit-boundary.json` + `fixtures/hostile/digest-mismatch.json`;
AC8 → `interruption.test.ts` + `helpers/child-worker.ts` +
`fixtures/hostile/interruption.json`; AC9 → `errors.test.ts` +
`fixtures/hostile/error-laundering.json`; AC10 → the per-test mutation map (inventory
test); AC11 → API audit + the pre/post byte-digest assertions + the read-only git
plumbing audit; AC12 → the ceiling assertion + chain + soak record + two review
verdicts.

**Mandated reviewer focus questions** (field-by-field assessment, not generic linting):

1. **Manufactured approvals, naive reading (#14, D9):** attempt the wrong-but-literal
   reading — is there ANY path (import row, seeded row, event payload, ref array,
   status materialization, projection render) by which a human-gate fact becomes state
   or an unevidenced approval lands? Does `completed` without evidence refuse? Is each
   smuggle dimension (field, status literal, ref member, array cap) tested
   independently (#30)? Does any text or artifact claim gate genuineness is verified?
2. **Edge non-manufacture:** does the import ever create `transitions` rows, call an
   engine operation, or mint an L4/L6 outcome without bound evidence? Are the
   zero-row assertions (`transitions`/`leases`/`idempotency_keys`) real tests that fail
   when a write is added (#32)? Is "materialized status ≠ edge traversal" stated
   honestly and consistently everywhere?
3. **Field-matrix completeness:** is EVERY member of `LegacyGoalRecord`/`OperationalFacts`
   classified in T2 with a named winner and conflict behavior? Does every
   `DIVERGENCE_STOP` reasonCode have exactly its own fixture and fire ONLY its class
   (precedence-edge rows)? Does any conflict path overwrite, repair, or silently pick
   a winner?
4. **Commit-boundary soundness:** are lineage membership and digests computed by
   FK-P11 from raw reader answers (ancestry closure root..tip; digests over returned
   bytes, never reader-supplied)? Is the shipped `GitLineageReader` genuinely
   read-only git plumbing (argv-array, no mutation subcommand reachable), and is the
   operator-trust assumption confined to injected-seam test runs exactly as ruled?
5. **One-time epoch:** can two imports of one lineage ever both land (epoch-check +
   insert in ONE `withTransaction`; kill tests at asserted points)? Is re-import
   refused even after package rollback (REI-03) and with a different document/tip
   (REI-02)? Is the epoch genuinely digest-bound (documentDigest + corpusDigest +
   manifest sourceRevision + lineage in the record)?
6. **Projection determinism:** do the bytes contain any live-clock, toolVersion,
   row-order, map-iteration, or platform dependence? Are PRJ-06-style mutations proven
   to fail (#32)? Are golden bytes fixture-pinned (fixture bytes only — #34, never a
   moving external file)?
7. **Sanitization and linear time (#31/#19):** enumerate every interpolated external
   field — which ones did the implementer miss? Is the sanitizer linear-time with
   hostile tests pinning the bound? Can Markdown structure (fences, tables, headings,
   lists) or a line-protocol delimiter still be broken from legacy text (INJ rows)?
8. **Cursor namespace:** does the runtime registry bind to the recorded FK-P9
   registration (A1e) plus FK-P10's reserved `goal-state`? Can any code path write
   `goal-state` or an invented per-goal id (CUR-02/04 failing-when-broken)? Is
   `goal-state` ever written by FK-P11 under a different export name?
9. **Substrate/engine boundary and error laundering:** no raw SQL, no engine calls, no
   reimplemented T6 idempotency semantics, no repository/git mutation? Does every
   wrapped error carry the code literal only, and does every boundary preserve the
   true cause (ERR-01..03 failing-when-broken)? Can a named refusal be erased into
   `STORAGE_FAILURE` on any path (the three-instance class)?
10. **Claim honesty (D13, RS-2.2, exit annex):** does any sentence or artifact claim
    enforcement, promotion, containment, gate-genuineness verification, FK-P15
    process-boundary recovery proof, or a stranded INF obligation (INF-4/6/7/8 rows)?
    Is the crash/recovery evidence labeled in-suite real-process-boundary evidence
    exactly, and is the RS-1.4(c) fragment (divergence-stop + crash/recovery) claimed
    only at its named scope?

Two fresh independent architecture/risk reviews return verdicts on these questions;
reviewers report and triage (fix / accept-as-documented / informational) and never fix
or commit; each review ends with the post-review no-dirty-files/no-commits assertion
(standing #24 family).

## Rollback

FK-P11 is an additive package on FK-owned surfaces: it creates one new private
directory and mutates no existing code, substrate, schema, engine, data format, or
shared surface. Rollback is delete-to-rollback: revert this spec and delete
`plugins/foreman-line/kernel-import/` entirely. **What survives (the cutover epoch is
one-time history):** (1) the recorded cutover epoch and every imported row survive in
the operator's SQLite database — `events` is append-only and `artifacts`/`goals` rows
are history (the R24–R29 never-rewrite discipline); the epoch keeps refusing re-import
(`IMPORT_EPOCH_EXISTS`) even with the package gone (REI-03); (2) the recorded FK-P9
amendment A1e travels with FK-P9's ledger and survives rollback unmodified (the
FK-P9 OQ-5 / A1-family pattern: an amendment belongs to its owner's record even if the
requesting parcel rolls back); (3) any Markdown a consumer published from FK-P11 bytes
is the consumer's artifact and is untouched. FK-P11 owns no operator data: every
database its tests create lives in a test temp directory and dies with the suite, and
its evidence records are package-local (INF-4 retention stays stranded in the exit
annex — FK-P17 OQ-3 pattern). FK-P11 requests no migration of its own (A1e's CHECK is
FK-P9-owned) and deletes no operator data. If a later parcel consumed the package,
that parcel's own change removes its imports.

## Shaping questions — RESOLVED by coordinator ruling 2026-09-29 (dispositions recorded below; no open questions remain)

As posed at shaping time (retained as the record):

1. **OQ-1 — Legacy corpus identity and extraction owner.** Which committed files
   constitute the legacy operational-state corpus, and who produces the import manifest
   (`LegacyGoalRecord` rows)? Proposed default: the goal's committed Markdown
   operational records (goal status reports, queue/ownership tables, worktree
   inventories under `docs/goals/**` plus named sidecars), extracted by an
   operator/coordinator-produced manifest; FK-P11 defines the row contract and its
   verification, not the corpus mapping. **Product decision — do not resolve
   silently.**
2. **OQ-2 — Refusal granularity.** Proposed: any refused row aborts the whole import
   (atomic fail-closed, nothing imported). Alternative: an owner-ratified per-row
   disposition list (INF-7 "one disposition per item" style) in which skipped rows are
   recorded explicitly, never silently dropped. Ruling required before fixtures lock.
3. **OQ-3 — Vocabulary-extension routing.** The `import.recorded`/`import.epoch` event
   kinds extend FK-P10 T8's closed vocabulary. Proposed route: a recorded FK-P9
   amendment carrying the FK-P10-class semantics ruling (A1 precedent), FK-P10's
   ownership preserved; alternative: a separate recorded FK-P10 amendment. Also
   confirm the exact registered cursor id names (`md-goals-index`, `md-goal-ledger`)
   for the task-mandated recorded FK-P9 registration (T12 item 1), and whether an
   `events.kind` CHECK migration is wanted alongside.
4. **OQ-4 — Projection views and write surface.** Confirm the two whole-ledger views
   (goals index + goal ledger) and that FK-P11 emits bytes only (no file writer). An
   owned Markdown writer would add a path-guarded sink surface and mutation-authority
   questions that today belong to FK-P13's territory.
5. **OQ-5 — Imported revision baseline.** Imported goals are created at
   `revision = 1` (legacy revision numbers are provenance-only per T2). Confirm, or
   specify the baseline.
6. **OQ-6 — Commit-id hash shape.** `[0-9a-f]{40}` (the observed SHA-1 object format)
   only, or also 64-hex (SHA-256 object format) as named constants `40 | 64` to avoid
   a future format-migration refusal class.
7. **OQ-7 — Epoch strictness.** One epoch per source lineage (the charter/task
   wording) vs at-most-one-epoch-ever per ledger. Proposed: per-lineage; the stricter
   rule is a one-line constant change if the coordinator prefers it.
8. **OQ-8 — Lineage-reader trust boundary.** The injected `SourceLineageReader`'s
   honesty is an operator-trust assumption (the engine cannot manufacture Git facts
   from nothing). Confirm this statement as the recorded trust boundary, or name an
   owner for a production real-Git reader (e.g. a coordinator-side CLI) used at actual
   cutover.
9. **OQ-9 — Out-of-vocab legacy statuses.** If the real corpus carries status words
   outside the FK-P10 T1 vocabulary, a recorded owner mapping decision is a
   prerequisite (the exit-annex legacy-vocabulary row stays NOT-satisfied until then;
   FK-P11 refuses such rows today). Confirm that refusal-at-import is the intended
   interim behavior.

### Coordinator Rulings — Resolved Decisions (2026-09-29)

All nine shaping questions above are resolved by coordinator ruling (owner standing
delegation; the INF-7 pattern for OQ-1); the dispositions are incorporated in
substance at the normative locations named below. Risks (a)–(d) are **ACK'd as
recorded**: (a) lineage-reader trust is mitigated per OQ-8 (the shipped real-Git
reader; the operator-trust assumption applies only to injected-seam test runs);
(b) corpus uncertainty is closed per OQ-1's corpus-manifest contract; (c) the
zero-row failing-when-broken assertions stay; (d) resolved by the pin corrections
(both FK-P10 closure records and the corrected FK-P10 spec pinned to committed bytes
at `d5ca69b8`). The 10 mandated reviewer-focus questions in the Verification Plan
stand as the review mandate.

- **OQ-1 — RULED (product decision, INF-7 pattern):** the corpus is defined by an
  explicit **corpus manifest** — exact input paths + source digests + a named source
  revision (deterministic enumeration, one disposition per item). The extractor
  consumes the manifest ONLY, never globs. The shipped TEST manifest is synthetic
  fixture records; the PRODUCTION manifest (which real records) is an owner-supplied
  named run-time input — recorded as an exit-annex deployment row, NOT-satisfied until
  supplied. (Normative: T1 corpus-manifest contract; F11/CTL-09 fixtures; Out of
  Scope row.)
- **OQ-2 — RULED as proposed:** whole-import abort — one epoch, one transaction. Per-
  row dispositions would embed operator judgment in the machine and reopen the
  manufactured-approvals surface. Fixtures lock on abort semantics. (Normative: T3
  rule 6.)
- **OQ-3 — RULED:** one recorded FK-P9 amendment **A1e** (the A1-family route)
  carrying (1) the `md-goals-index`/`md-goal-ledger` projection_cursors registrations
  (names CONFIRMED), (2) the `import.recorded`/`import.epoch` events.kind vocabulary
  extension (FK-P10 T8 ruling carried in the record), and (3) an `events.kind` CHECK
  migration (defense-in-depth parity with A1a/A1b — included). `artifacts.kind` values
  stay FK-P11-owned. A1e is dispatched to the FK-P9 owner-session in parallel with
  this incorporation and must land before Step-0 (the A1b-class gate). (Normative:
  T12.)
- **OQ-4 — RULED:** the two whole-ledger views and bytes-only output are CONFIRMED.
  The projection emits DATA; FK-P11 writes NO repo files and holds NO mutation
  authority (the D10 family); the owned writer is FK-P13-class deferred territory,
  named in Out of Scope. (Normative: T6 rule 6; AC5.)
- **OQ-5 — RULED:** imported goals start at `revision: 1` (the substrate's CAS
  baseline); legacy revision numbers travel as PROVENANCE fields only, never state
  (D14: SQLite wins revisions post-cutover). (Normative: T2 revision row.)
- **OQ-6 — RULED:** `COMMIT_ID_LENGTH_SHA1 = 40` and `COMMIT_ID_LENGTH_SHA256 = 64`,
  both accepted shapes, each with its own fixture. (Normative: T1 CommitId; CMT-06/
  CTL-10.)
- **OQ-7 — RULED:** one epoch per source lineage (as proposed); re-import refused
  (`IMPORT_EPOCH_EXISTS`) even after rollback; a second, distinct lineage may import
  later; the no-manufactured-approvals property holds per epoch. (Normative: T4.)
- **OQ-8 — RULED:** FK-P11 ships a REAL-Git `LineageReader` (read-only commit-bound
  blob reads over the named revision) as production code, with the injected seam
  retained for tests. The operator-trust assumption is recorded ONLY for injected-seam
  test runs — never for the shipped reader. Ceiling impact REPORTED per the standing
  stop-and-report instruction and **APPROVED by coordinator ruling 2026-09-29
  (OQ-8/OQ-1 consequence)**: the ceiling carries the reader's named files and the
  corpus fixtures (43 → 47), and nothing is dropped. (Normative: T-seam shipped-reader
  paragraph; Allowed Files.)
- **OQ-9 — RULED:** refuse-at-import for out-of-vocab legacy statuses (typed refusal;
  rows never rewritten); the exit-annex vocabulary-mapping row stays NOT-satisfied
  (consistent with the A1d legacy-null precedent). (Normative: Out of Scope row.)

### Amendment — coordinator rulings F-1/F-2/F-3/F-5/F-6/F-7 (2026-09-29)

Build-time derived resolutions incorporated at their normative sites above
(provenance: coordinator rulings F-1/F-2/F-3/F-5/F-6/F-7, 2026-09-29; inline
authorization, one amendment commit at chain end):

1. **F-1 — fixture counts:** the T11 totals are 67 hostile / 10 controls / 8
   canonical = **85 fixture records**, DERIVED from the fixture rows (the class
   count columns + ID enums are the source of truth); the inventory-map test
   derives the count from the rows and asserts set-equality with the ID enums,
   never a hand-typed literal (dropping a row fails the map).
2. **F-2 — `ImportDocument.corpusDigest`:** REQUIRED member; canonical digest
   over the rows' `SourceProvenance` tuples sorted by canonical key order,
   domain `foreman-line.kernel-import.corpus`.
3. **F-3 — kernel-lease import route:** public `src/index.ts` export surface via
   the deep specifier (no `exports` map in kernel-lease); internal-layout
   coupling, read-only, recorded; a future kernel-lease export-map change is a
   named break point.
4. **F-5 — `OperationalFacts.claimedBinding`:** REQUIRED sixth member
   (`{ principalRef, operationId, repositoryRef, worktreeRef } | null`), the
   legacy binding claim; CON-08 = a claimed 4-tuple colliding with a recorded
   `idempotency_keys` binding → `DIVERGENCE_STOP(idempotency)`.
5. **F-6 — `IMPORT_SOURCE_BLOB_ABSENT`:** the 14th closed registry code (the
   claimed digest cannot be established because the blob does not exist —
   distinct from `IMPORT_SOURCE_DIGEST_MISMATCH`, where bytes resolve and
   differ); the DIG-01 fixture family gains its absent case as a named case
   inside the closed 67-record count (F-1's totals stand).
6. **F-7 — same-lineage exemption:** goals imported by a recorded epoch of the
   same lineage root are exempt from the field-conflict family's vs-recorded
   checks; `IMPORT_EPOCH_EXISTS` is the rerun's refusal and
   `existing-state-collision` protects ALIEN pre-existing goals only.
7. **getEpoch clarification:** keyed by lineage root
   (`getEpoch(importer, { rootCommit })`; `getAllEpochs` returns the full set) —
   T9's "single recorded EpochRecord" reads as per-lineage under OQ-7.
8. **R1 escaper-first (coordinator rework R1, 2026-09-29):** T6 rule 4's
   sanitizer escapes `\` → `\\` BEFORE all other escapes (the escaper escapes
   itself first); structural-delimiter escapes are parity-escaped end to end.
   Contract semantics of T6 rule 4 / F9 unchanged — the prior implementation
   was wrong (a raw `\` could re-mark an escaped delimiter live).
