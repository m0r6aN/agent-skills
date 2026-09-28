# Goal Charter: Provisional Patent Readiness

Status: **Gate 1 ratified 2026-08-13 — plan review triaged and targeted amendments ratified; W0-P01 may be shaped**
Initiative ID: `provisional-patent-readiness`  
Parent: `operation-receipt-remediation` (subsumed; OR-P22 dissolved)  
Coordinator control worktree: `D:/Repos/agent-skills-worktrees/provisional-patent-readiness-20260813`  

## Objective

Reconcile code and documentation for seven G-2 mechanisms into a local-only filing package sufficient to support a US provisional patent application. Every retained mechanism must be implemented, described consistently with the merged code, and documented enablingly under 35 U.S.C. 112(a).

The package target is `keon-docs-internal/docs/patents/provisional-2026/` and includes mechanism descriptions, figures, claim-support matrix, prior-art delta statements, and conception/evidence snapshot.

## Scope and immutable constraints

- Hard Rule Zero: no push to a public remote; no public PR, package publish, deploy, container push, public issue/gist/forum/third-party disclosure, or edits to public README marketing copy, `LICENSE`, `keon-systems-web`, or LinkedIn material.
- Private remote operations are allowed only if the baseline records that repository's remote as private. This charter grants no remote operation.
- `keon-docs-internal/patents/` is local-only, untracked, and preservation-critical. `keon-doctrine` is also preservation-critical. No agent may delete, move, clean, stash, or `git clean` either working tree.
- Code is authoritative. A documentation parcel cannot rewrite behavior, and a code change that changes a documented claim requires a ratified specification amendment before the implementation change.
- OpenClaw is entirely out of scope. It is not verified, reconciled, or mentioned in the filing package.

## Evidence baseline

- `Operation Receipt remediation Stage Zero` supplied the repository inventory and mechanism anchors; it recorded no implementation dispatch after its Gate 1 plan-review reopen.
- Current track worktrees are treated as potentially dirty until W0-P03 records their baseline. No existing worktree is an ambient editing location.
- The parent directive `Operation Receipt v3.0` has not been recovered as a source artifact. D7 governs this provenance gap.

## Decisions

### Pre-ratified

| ID | Decision | Ruling |
|---|---|---|
| D1 | Employment/ownership | Developer accepts the risk. Counsel review remains RG-7, developer-owned, and does not block build work. |
| D2 | OpenClaw | Entirely out of scope; OR-P22 is dissolved. |
| D3 | Disclosure status | No enabling public disclosure is accepted as the baseline. Hard Rule Zero remains in force for the entire initiative. |
| D4 | Code/documentation authority | Code is authority; documentation conforms. Merits-changing code needs a separately ratified specification amendment first. |
| D5 | Filing scope | Plan for all seven mechanisms. Four are potentially describable now; three require build work. If Wave 2 slips, narrow rather than delay the first filing. |

### Gate 1 decisions — proposed defaults

| ID | Decision | Proposed ruling | Consequence |
|---|---|---|---|
| D6 | Control-artifact location | Use this isolated goal-owned worktree, never the dirty ambient `D:/Repos/agent-skills` checkout. | Control state remains isolated and reversible. |
| D7 | Parent directive provenance | Rule `Operation Receipt v3.0` unavailable; derive constraints/parcels from the remediation directive and Stage Zero snapshot only. Drop claims that depend solely on the unavailable parent. | Prevents invented inherited scope. |
| D8 | PolicyHash version break | Add explicit hash version; freeze present semantics as `v1`; put changed canonicalization behind `v2`. | No silent hash redefinition. |
| D9 | `Cool` to `Cold` replay | Accept legacy `Cool` recordings with an explicit compatibility parser and migration note. | Preserves replay, HeatEventId, and Defense Pack compatibility. |
| D10 | Cognitive Heat dimensions | Do not decide the meaning of the six-vs-four discrepancy yet. Ratify a W1 delta investigation; its evidence re-opens this decision. | No guessed doctrine or behavior. |
| D11 | Evidence Vault | Build the README-described architecture in a separately sized W2 sub-wave, subject to normal stop conditions; if it cannot clear in time, drop it from the first filing rather than claim prose-only behavior. | Preserves seven-mechanism intent without claiming an unimplemented vault. |
| D12 | Capability Registry | Run a bounded W0 search. Rule it absent only after the recorded bounded search completes. | No absence claim based on prior timeouts. |
| D13 | Filing package and delta custody | Use an isolated local-only filing-package worktree rooted at `D:/Repos/keon-omega-worktrees/keon-docs-internal-provisional-2026/`. Treat `keon-docs-internal/patents/` as read-only source material. | Preserves the single local patent corpus while allowing exact, controlled package artifacts. |
| D14 | Release evidence model | Use local-only evidence through W4: dispatched-session local verification artifacts, local Git evidence, and local configured-remote/no-push audit. No fetch, pull, push, PR, CI trigger, or remote API call is implied. Gate 3 remains fail-closed. | Reconciles RG-1/RG-6 with Hard Rule Zero. |
| D15 | Retained mechanism rule | After W1, retain a mechanism only if implementation evidence and an enabling description both exist. A prose-only or unresolved mechanism is expressly excluded from the first filing. | Enforces D5 without invented behavior. |

## Tracks

| Track | Repository | Role |
|---|---|---|
| T-runtime | `D:/Repos/keon-omega/keon-systems` | PolicyHash, ARO, Decision Receipt/spine, tenant binding, Evidence Pack |
| T-collective | `D:/Repos/keon-omega/keon.collective` | Cognitive Heat, Temporal Echo, replay, Defense Pack |
| T-cortex | `D:/Repos/keon-omega/keon-cortex` | Python spine and tenant enforcement |
| T-vault | `D:/Repos/keon-omega/keon-evidence-vault` | Evidence Vault surface |
| T-doctrine | `D:/Repos/keon-omega/keon-doctrine` | Whitepaper and canon |
| T-patent | `D:/Repos/keon-omega/keon-docs-internal` | Adjudication and filing package |
| T-control | This worktree | Coordinator state and parcel records |

## Waves and dependency order

### W0 — preservation and provenance (serial)

1. W0-P01: create a copy-only, non-mutating custody snapshot of each preservation-critical track's tracked, untracked, and dirty state; verify file count and hash manifest. No move, delete, stash, clean, restore, or in-place archive operation is allowed.
2. W0-P02: create a local git bundle for every track and all local branches only after W0-P01; record only local bundle paths in evidence.
3. W0-P03: capture commit and working-tree baselines; reconcile all drift against Stage Zero only after W0-P01 and W0-P02.
4. W0-P04: read-only finding on the shadow-worktree/ARO-size premise drift.
5. W0-P05: bounded `CAPABILITY_REGISTRY.yaml` search and finding.
6. W0-P06: formalize control-worktree provenance and persistent coordinator state: decisions, evidence hashes, preservation manifests, parcels/dependencies, and gate status.

Gate: all W0 evidence must be accepted before any W1 parcel dispatches.

### W1 — mechanism truth reconciliation (parallel, read-only)

One delta parcel each for PolicyHash, ARO, Decision Receipt plus causal spine, Temporal Echo/collapse, Cognitive Heat, tenant enforcement, and Evidence Pack/Vault. Each reads source/doctrine without mutation and writes exactly one assigned file under the D13 isolated filing-package worktree. A W0-generated manifest owns exact filenames and serializes shared artifact indexes. Each delta documents code references, documentation references, a delta table, and a D4 ruling recommendation. No code or doctrine changes.

### W2 — completion and verification

- Rescope OR-P02 through OR-P21 only after their W1 deltas into a source-backed mechanism-to-parcel catalog; each fresh W2 spec receives its own scoped Gate 2 authorization. Green means zero failures or a separately ratified, evidence-backed exception list.
- Implement D8 and D9 only after their relevant W1 delta and Gate 1 ruling.
- Treat tenant enforcement as one cross-repository integration parcel.
- Resolve D10 only through its evidence parcel.
- Decompose D11 into a separately ratified, explicitly sized Evidence Vault sub-wave before implementation.

### W3 — documentation conformance

For each D15-retained mechanism, write an enabling, auditor-grade technical description and at least one block and sequence diagram matching merged code. Serialize the retained-mechanism manifest, figure registry, claim-support matrix, final consistency pass, and all whitepaper changes to `keon-doctrine/docs/whitepaper/WHITEPAPER_v2.0.md`.

### W4 — disclosure assembly

1. Claim-support matrix with a code and enabling-document reference for every retained claim.
2. Prior-art delta statement per mechanism.
3. Human conception and reduction-to-practice evidence.
4. Consolidated numbered figure set.
5. Filing-package consistency pass.

## Release gates

- RG-1: dispatched-session evidence of local deterministic verification on each accepted local branch; no remote CI is required or authorized.
- RG-2: all W1 deltas reconciled as agreed, fixed, or dropped.
- RG-3: retained mechanisms have enabling technical descriptions and figures.
- RG-4: prior-art delta statement per retained mechanism.
- RG-5: conception/evidence snapshot with commit hashes.
- RG-6: local configured-remote and no-push audit confirms Hard Rule Zero remained intact.
- RG-7: developer-owned counsel review before filing; this does not authorize submission.

## Requested standing authorizations

- Gate 2: **granted 2026-08-13** for the named W0–W4 queue, subject to every stop condition and W0/W1 dependencies.
- Gate 3: **not yet granted**. The ratified ruling holds local-only merges until effective branch rules and distinct-agent bypass authority are evidenced. No remote operation is authorized.

## Stop conditions

Stop and report immediately for a Hard Rule Zero violation; a proposed destructive action in T-patent or T-doctrine; a W1 scope mismatch; inability to write an enabling description without inventing behavior; a human legal/ratification/merge decision; a frozen-spec amendment; or a developer stop instruction.

## Gate 1 record

The developer explicitly ratified D6–D12, D13–D15, the plan-review safety fixes, and blanket authority for non-destructive actions on 2026-08-13. D10 remains an evidence-first route, not a substantive semantic ruling; D12 remains contingent on the bounded W0 search. Gate 2 is granted as recorded above. Gate 3 remains held under the ratified fail-closed condition above.

The next required action is an independent plan-level adversarial review. No parcel shaping or dispatch may occur until its findings are triaged; any finding that changes a decision re-opens Gate 1 only for that decision.
