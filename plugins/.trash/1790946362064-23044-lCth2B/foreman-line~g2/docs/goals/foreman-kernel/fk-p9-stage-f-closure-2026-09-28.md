# FK-P9 Stage F closure — 2026-09-28

**Parcel:** FK-P9 — Storage and migration ABI (Wave 3a core)
**Outcome:** DELIVERED AND MERGED.

## Merge record (Gate 3, delegated — RS-2.1, ledger L7)

- Package `plugins/foreman-line/kernel-state/` merged into `reconcile/refresh-actions` ("Merge FK-P9 kernel-state storage/migration ABI into live tree (Gate 3, delegated, RS-2.1)"); byte-identical to reviewed build `cf78eba8` (verified `git diff` empty).
- Parcel branch `codex/fk-p9-storage-migration-abi` @ `cf78eba8` (two commits: `7fcc595` build, `cf78eba8` rework round 1). Branch kept as merged provenance; worktree removed at Stage F.

## Verification chain evidence

| Step | Result |
|---|---|
| Builder chain (build) | all exit 0; 144/144 tests |
| Builder chain (rework 1) | all exit 0; 149/149 (additions only) |
| **Coordinator acceptance chain** | test=0, typecheck=0, lint=0 (clean Node lane) |
| Post-merge smoke (integration tree) | npm ci + npm test exit 0 |

## Independent review trail

| Session | Verdict |
|---|---|
| Lens 1 storage (FkP9Review1Storage) | REQUEST CHANGES — F1 (sequential fake race), F2 (raw guardedUpdate binding), F3 (C7 pairing ambiguity), F4 (unasserted pragma) |
| Lens 2 export (FkP9Review2Export) | REQUEST CHANGES — EXPD-01 degenerate fixture |
| Rework-1 closure (`cf78eba8`) | BOTH LENSES CLOSED (0.92/0.95) — race proven load-bearing; four guarded-write refusals pre-write; F3 amendment exact; pragma double-mutation-bound; EXPD-01 binds normalization; golden vector re-derived byte-exact |

## Contract amendments during the parcel (pre-merge)

- C7 link-reason amendment (`89c6a43`) + over-broad-grouping correction (`09cfd2f`, spec pin `213d739d`): `link-component` = non-final component without higher-precedence violation (PATH-16); `link-target` = final component (PATH-14); PATH-15 keeps `outside-root`. The correction was prompted by the builder's own F3 honesty flag — the first amendment's "(PATH-15, PATH-16)" grouping was mine and over-broad.

## Lessons with dispositions

1. **A "concurrent" test that never races is a silent lie:** CONC-03's racers ran sequentially and the root cause was deeper (real.prepare threw on a fresh DB before any barrier code could run). The named behavior was unexercised and the under-lock re-check mutation-invisible. Disposition: true concurrent children + a lazy-statement rendezvous; the re-check is now load-bearing (disabled → CONC-03 fails alone). Rule: concurrency fixtures must assert their OWN interleaving (both markers before either commit), not just their outcomes.
2. **Raw guard/patch binding poisons reads and misclassifies failures:** `guardedUpdate` persisted non-Id/TEXT values, poisoning later reads into STORAGE_IO_FAILURE. Disposition: closed member sets + require* pre-write validation; identity columns structurally unpatchable. Rule: every write primitive validates its input surface before binding — insert paths already did; update paths must too.
3. **Ambiguous contract text is a defect class of its own:** the C7 parenthetical and case names disagreed; the builder's disclosed reading was semantically right but textually ungrounded. Disposition: mechanism-semantics ruling + text amendment + the second-pass correction. Rule: reason-code pairings in fixture tables name each case's code explicitly — never slash-lists.

## Deferred/named remainders (exit-annex items)

- INF-8 RPO/RTO numeric objectives: named in the exit annex (OQ-1 ruling) — owner-policy gap, FK-P15 measures.
- CTRL-01 (non-WAL filesystem refusal) + file-symlink privilege gaps: `blocked:` records, FK-P18′-lane obligations (already in the annex).
- FK-P10 (lease/transition engine) consumes this substrate next in the RS-1.4 in-scope set.
