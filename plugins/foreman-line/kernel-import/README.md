# @foreman-line/kernel-import

FK-P11 — the legacy import and projection engine on the merged FK-P9 substrate
(`@foreman-line/kernel-state`) with FK-P10's (`@foreman-line/kernel-lease`)
status/edge vocabulary bound as read-only data.

## Scope (full, D13-honest)

- **One-time digest/commit-bound legacy import.** Every imported row is bound
  to its committed source digest and commit (digests are always computed by
  this package over lineage-reader bytes — never reader-supplied). The corpus
  is defined by an explicit **corpus manifest** (exact paths + digests + a
  named source revision; one disposition per item) and is consumed ONLY —
  never globs. Exactly one cutover **epoch per source lineage** lands inside
  the import's single `withTransaction`; re-import refuses
  `IMPORT_EPOCH_EXISTS` (same or different document, or after package
  rollback — the epoch is history). A crash rolls back to fully-absent; a
  rerun completes exactly once.
- **No manufactured approvals (D9).** Imported approvals arrive ONLY as
  provenance-bound `GitGateEvidenceRef`-shaped evidence records; fabricated or
  unevidenced claims refuse `IMPORT_APPROVAL_UNEVIDENCED` (valid claims never
  launder invalid ones; `completed` requires ≥ 1 valid claim). The FK-P10
  25-edge machine is never traversed or minted: zero `transitions`, zero
  `leases`, zero `idempotency_keys` rows are ever written and no engine
  operation is called (failing-when-broken asserted). Gate satisfaction is
  never writable state; `gate.*`/`human.*` literals refuse everywhere.
- **D2/D14 field-level authority matrix.** Git wins ratified-canon and
  human-gate facts (recorded as provenance/evidence, never materialized as
  state); SQLite wins status, revision (`revision = 1` baseline; legacy
  revisions provenance-only), leases, pending transitions, idempotency,
  wakeups/handoffs (provenance-only at import), and projection cursors. Every
  disagreement STOPS with `DIVERGENCE_STOP` and its closed reasonCode — never
  overwrites, never repairs, never picks a winner at runtime.
- **Deterministic Markdown projection, bytes-only.** Two whole-ledger views
  (`md-goals-index`, `md-goal-ledger`) render byte-stable documents: no live
  clock, no wall-time, no `toolVersion` in the bytes; canonical UTF-16
  code-unit ordering; canonical-strict decode (non-canonical bytes or unpaired
  surrogates refuse); every interpolated external string passes the
  deterministic `sanitizeForMarkdown` (linear-time; fences/tables/headings/
  HTML/line-protocol delimiters cannot be broken from legacy text). The
  projection emits DATA only — it writes NO repo files and holds NO mutation
  authority; the owned Markdown writer is FK-P13-class deferred territory.
- **Cutover epoch (one-time, digest-bound, recorded).** One `import.epoch`
  event + one `artifacts` row binding `documentDigest`
  (`foreman-line.kernel-import.import-document`), `corpusDigest`
  (`foreman-line.kernel-import.corpus`), the manifest `sourceRevision`, the
  lineage `rootCommit`/`tipCommit`, `rowCount`, request identity
  (identify — never authenticate), `toolVersion`, and `recordedAtMicros` from
  the injected `Clock` (the package's only time source).
- **Named divergence-stop.** `checkDivergence` re-derives every Git-winner
  fact through the lineage reader against the epoch-bound digests and the
  current ledger rows and either passes or throws `DIVERGENCE_STOP`; render
  drift refuses `DIVERGENCE_STOP(projection-source-drift)` with the cursor
  unmoved. This surface is FK-P11's named RS-1.4(c) exit-duty evidence for the
  divergence-stop fragment.

## Out of scope (named so it is never claimed)

Gate-evidence genuineness/sufficiency and `authorizeAction` (FK-P12); the
admission-protected control catalog and the owned Markdown writer (FK-P13);
the PRODUCTION corpus manifest (owner-supplied named run-time input — the
shipped TEST manifest is synthetic); process-boundary restart/split-brain/
stale-authority recovery proof (FK-P14/FK-P15, stranded per RS-2.2);
out-of-vocab legacy status translation (rows refuse at import; the
vocabulary-mapping exit-annex row stays NOT-satisfied); lease/CAS/idempotency/
transition-legality semantics (FK-P10 T6 never reimplemented); wakeup/handoff
semantics (counts are provenance-only); multi-epoch or merge semantics for a
single lineage; enforcement/promotion/containment claims and stranded-INF
assembly (INF-4/6/7/8 rows stay NOT-satisfied).

## Reads derive from the event stream

FK-P9 exposes parameter-bound point reads plus `queryEvents` (no goals or
artifacts enumeration; raw SQL is forbidden here). Whole-ledger views and
`checkDivergence` therefore derive from the append-only event stream (every
goal-creating operation emits ≥ 1 event: FK-P11 records `import.recorded` per
row; FK-P10 engine operations emit their own kinds) plus point reads
(`getGoal` / `getUnreleasedLease` / `getTransition` / `getIdempotencyKey`).
The `artifacts` evidence-index rows are written for downstream consumers
(`import.epoch`, `import.approval`, `import.ratification-ref` — *(P11/P21)*).

## Lineage seam

`SourceLineageReader` (`commitExists` / `isAncestor` (inclusive) /
`readCommittedBlob`) is implemented by the shipped read-only real-Git
`GitLineageReader` (argv-array plumbing; `cat-file` / `merge-base` /
`rev-parse` only — no mutation subcommand is reachable) and by injected test
seams. Seams return `unknown` until normalized; digests and lineage
membership are computed by this package from raw answers; HARNESS_*-branded
seam errors rethrow unwrapped (harness failures are never laundered into
product errors). The operator-trust assumption is recorded ONLY for
injected-seam test runs — never for the shipped reader (OQ-8).

## Import failure precedence (documented first-failure order)

structural → corpus-manifest consistency → limits → lineage membership →
digest match → approval-evidenced-ness → field-conflict (`DIVERGENCE_STOP`) →
epoch. Field-conflict sub-order (per goal group): status → ratification-fact →
human-gate-fact → revision → lease → pending-transition → wakeup-handoff →
idempotency → existing-state-collision. Goals imported by a recorded epoch of
the same lineage root are exempt from vs-recorded checks: re-import of an
imported lineage is the epoch's refusal, and `existing-state-collision`
protects against ALIEN pre-existing goals.

## Registry

`ImportError` is a closed registry (14 codes after the coordinator's F-6
ruling; safe diagnostics per code, fault-injection tested): the T10 thirteen
plus `IMPORT_SOURCE_BLOB_ABSENT` (a claimed digest cannot be established
because the blob does not exist at `sourceCommit`/`sourcePath` — distinct
from `IMPORT_SOURCE_DIGEST_MISMATCH`, where bytes resolve and differ).
