# Plan Review Findings: Provisional Patent Readiness

Status: **Independent review complete — triage ratified 2026-08-13**
Reviewer: fresh read-only adversarial session  
Review mandate: decomposition coherence, boundaries, missing parcels, load-bearing decisions, collisions, W1 read-only integrity, and Evidence Vault sizing.

## Triage

| ID | Finding | Disposition | Gate 1 impact |
|---|---|---|---|
| PR-01 | The charter names `keon-docs-internal/docs/patents/provisional-2026/`, but the preserved local corpus is `keon-docs-internal/patents/`; package custody was never decided. | **Fix, proposed D13.** Choose a new isolated filing-package location or explicitly authorize a protected subdirectory in the existing corpus. Do not infer either. | Re-open: filing-package custody/location. |
| PR-02 | W0 archives/bundles before capturing dirty/untracked state, and “archive” is ambiguous beside the no-move rule. | **Fix.** Replace the first preservation step with a copy-only, non-mutating custody snapshot (tracked, untracked, and dirty state), manifest, hashes, destination, access restriction, and restore prohibition. Bundles follow that snapshot. | No decision change. |
| PR-03 | W1 calls itself read-only while writing seven deltas into the protected patent track and gives no exact paths/worktrees. | **Fix, coupled to D13.** Read-only means no source/doctrine mutation. Deltas must write in the selected controlled package location with exact per-mechanism filenames and isolated worktrees. | Re-open: delta-artifact custody/location. |
| PR-04 | W2 is not a dispatchable queue; inherited OR-P02–OR-P21 cannot be invented from an unavailable parent directive. | **Fix.** W1 produces a source-backed mechanism-to-parcel catalog; fresh W2 specs and a scoped Gate 2 follow. Tenant enforcement splits into contract, per-track, and integration-scenario parcels. Green means zero failures or a ratified exception list. | No decision change. |
| PR-05 | Evidence Vault currently appears planned/unimplemented; the repository README says it is not source code. | **Fix.** Mark it planned/unimplemented until a separately ratified sub-wave provides implementation evidence. Exclude Vault-dependent claims from the first filing if that sub-wave does not clear. | Enforces D11; future sub-wave requires separate ratification. |
| PR-06 | RG-1/RG-6 require merged-track CI and remote audit, while the charter authorizes neither remote operations nor Gate 3 merge. | **Fix, proposed D14.** Select a local-only evidence model for this initiative, or narrowly authorize named private-remote audit/CI operations after privacy-baseline evidence. Gate 3 remains fail-closed in either case. | Re-open: evidence and remote-operation model. |
| PR-07 | Parallel W1/W3/W4 artifacts have no owner, filenames, or serialization plan beyond the whitepaper. | **Fix.** Unique delta paths; serialized retained-mechanism manifest, figure registry, claim-support matrix, and final consistency pass. | No decision change. |
| PR-08 | D5 permits narrowing but lacks a retained-set decision record and explicit prose-only exclusion. | **Fix, proposed D15.** After W1, record each mechanism's implementation, enabling-document, and evidence status; retain or exclude it explicitly before W3/W4. | Re-open only if a retained-set rule differs from D5. |
| PR-09 | W0-P06 does not define durable state or acceptance. | **Fix.** W0-P06 creates a local coordinator ledger for decisions, evidence hashes, preservation manifests, parcels/dependencies, and gate status. | No decision change. |

## Evidence consumed

- Charter filing path and W1 output path: `charter.md` lines 12 and 79.
- Preservation constraint and dirty-track premise: `charter.md` lines 18 and 25.
- Gate 3 and release-gate inconsistency: `charter.md` lines 17, 103, 108, and 114.
- Evidence Vault status: `D:/Repos/keon-omega/keon-evidence-vault/README.md` lines 48–50.
- Exact-allowed-file and persistent-state requirements: `plugins/foreman-line/skills/parcel-driven-development/SKILL.md` lines 166–175.

## Coordinator recommendation for targeted re-ratification

1. **D13 — filing package and delta custody:** create an isolated, local-only package worktree rooted under `D:/Repos/keon-omega-worktrees/keon-docs-internal-provisional-2026/`; preserve `keon-docs-internal/patents/` as read-only source material. W1/W3/W4 write only in that isolated package worktree.
2. **D14 — release evidence:** use a local-only evidence model through W4: dispatched-session local verification artifacts, local Git evidence, and local remote-configuration audit. RG-1 becomes local merged-branch verification only after Gate 3 evidence; RG-6 becomes a local audit of configured remotes and the no-push record. No fetch, pull, push, PR, CI trigger, or remote API access is implied.
3. **D15 — retained mechanisms:** after W1, retain a mechanism only when implementation evidence and an enabling description both exist. A prose-only or unresolved mechanism is explicitly excluded from the first filing and remains eligible for a subsequent provisional.

These amendments do not weaken Hard Rule Zero, the patent/doctrine preservation constraint, or the Gate 3 fail-closed condition.

## Ratification record

The developer explicitly ratified D13, D14, D15, and every listed fix on 2026-08-13. The coordinator may now shape W0-P01 only. W0 remains serial; no other preservation, reconciliation, implementation, doctrine, or filing-assembly parcel may dispatch until W0-P01 is accepted under the normal builder/evidence/review chain.
