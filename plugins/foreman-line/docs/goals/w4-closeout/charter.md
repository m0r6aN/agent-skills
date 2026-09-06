# Goal Charter — w4-closeout

**Status:** FULLY RATIFIED — Gate 1 (D1–D6) ratified 2026-07-28 11:17 EDT; plan-adversarial review complete (RATIFY-WITH-AMENDMENTS — `plan-review-findings.md`, all amendments applied); scoped Gate-1 re-open (D4, D6, authorizations, Jira-leg scope) **RE-RATIFIED 2026-07-28 11:35 EDT** (Clint, all four recommendations); D4-R1 review **HOLD**; D4-R2B sole-owner compromise **RATIFIED 2026-09-05, FOLLOW-UP REVIEW PASS**. Governance-record publication is authorized; no D4 ruleset mutation is authorized before that record is human-merged.
**Coordinator:** canonical task `/root`, transferred by Clint Morgan on 2026-09-05 at a parcel boundary; takeover anchored to worktree `D:/Repos/agent-skills-worktrees/w4-closeout-d4-r1-20260905`, branch `docs/foreman-w4-closeout-d4-r1`, and base `a345ce408cc5ee8c3ae44eed34ad6593434f03aa`. One goal, one coordinator.
**Predecessor:** `w4-ci-integration` (COMPLETE 2026-07-28; exit items 1 and 6 recorded OPEN at closure — this goal exists to close them and clear the accepted hygiene debt).
**Current amendment:** [`d4-r2b-sole-owner-compromise-amendment.md`](./d4-r2b-sole-owner-compromise-amendment.md) supersedes the held [D4-R1 proposal](./d4-r1-ruleset-retarget-amendment.md), subject to fresh follow-up review.

## Objective

Close out Wave 4 completely: satisfy the two exit conditions W4 honestly recorded as OPEN (item 6 — minted receipt chain; item 1 — config-proven PR and trusted-check protection under the owner-approved D4-R2B sole-owner compromise), reconcile the spec-linter corpus (W4-P5), and put biome into CI so the two defect classes that landed on main because CI never ran it cannot recur.

## Locked decisions

| # | Decision | Reasoning |
|---|---|---|
| D1 | Single goal covering minted-chain, W4-P5, and biome-CI; FUP-1 / FUP-3 / W4-FUP-AUDIT are **deferred debts**, out of scope | Stage Zero ruling (Clint, 2026-07-28). Items are small, related, and share one paper trail; the deferred three each need spec amendments and have no caller pressure yet. |
| D2 | Exit item 6 is satisfied **only** by real receipts persisted on disk with `validateChain` AND `isSealed` passing over the minted chain — never by fixtures | Lesson #33: a criterion naming a produced artifact is not closable by a fixture imitating one. "Zero self-graded claims" is inherited from the W4 charter verbatim. |
| D3 | CLOSE-P1 carries the live-wiring cluster as one parcel: FUP-2 (route Stage F through the real `emitClosureReceipt`), RW3 (caller passes chain-tip), W4-P1-FUP-1 (GitHub-JSON → `EffectiveRulesResponse` normalization at the live boundary) | These are the same seam — the injected-write/live-fetch boundary no test has ever exercised (lesson #28). Splitting them creates parcels that silently collide on the same files. |
| D4 | **D4-R2B (ratified 2026-09-05):** preserve current all-branch ruleset `17746056` unchanged. After the corrected governance record merges, Clint creates a separate active `main-pr-gate` ruleset targeting only `~DEFAULT_BRANCH`, with no bypass, zero required approvals, resolved review threads, strict required checks `test` and `integration-report` pinned to GitHub Actions app ID `15368`, and all current merge methods retained. The coordinator verifies the complete rule payload, effective `main` rules, and a real goal-complete PR before closure. | The current repository is sole-owned and the existing ruleset targets all branches. Zero approvals is an explicit owner-approved compromise: PRs and trusted checks become mechanically required, but agent self-merge under shared owner credentials remains technically possible and may not be claimed otherwise. Separate topology preserves all-branch deletion/force-push protection without creating a circular feature-branch gate. |
| D5 | Parcel order: CLOSE-P3 (biome-CI) → CLOSE-P1 (minted chain) → CLOSE-P2 (W4-P5) | Biome-in-CI first is cheap and makes the CI net stricter for the two parcels that follow; minted chain is the critical path; W4-P5 is decoupled and never blocks. |
| D6 | Standard Gate-2/Gate-3 standing authorizations (green-chain contingent) — **except CLOSE-P1's minted-chain vehicle PR, whose merge is HUMAN (re-ratified per plan review Q3), and D4-R2B's governance-record and goal-complete PRs, whose merges are HUMAN under the ratified D4-R2B sequence.** | The Stage-F seal must record a human merge to honestly close a criterion defined "on human merge." D4-R2B likewise keeps its two irreversible record transitions human-owned despite zero configuration-required approvals. All other ordinary parcel merges remain agent-executable behind green chains. |

## Parcels

| Parcel | One-liner | Risk | Routing class / review |
|---|---|---|---|
| CLOSE-P3 | Add biome to CI as a per-package `npm run lint --if-present` loop in `plugins.yml`, mirroring the existing test loop (S3 — a single root `biome check` fails on 15 nested-root configs; each package's pinned binary is authoritative); fix the two existing biome errors on main (`integration/src/index.ts` organizeImports, `docspine-hook.test.ts` formatting). Check-only, no auto-fix. **Plus (B2, re-ratified): always-report jobs — additive changes to `plugins.yml` and `foreman-line-ci.yml` so `test` and `integration-report` report a conclusion (pass or no-op) on every PR to main, making them safe to require at D4.** | low | boilerplate — single review |
| CLOSE-P1 | Minted-chain exit vehicle: wire the real write seam (FUP-2), chain-tip passing (RW3), and live effective-rules normalization (W4-P1-FUP-1); execute a genuine Stage A→F run that persists receipts under `docs/receipts/`; `validateChain` + `isSealed` green over the minted chain. | elevated | architecture/risk — dual review |
| CLOSE-P2 | W4-P5: spec-linter corpus reconciliation (grandfather rule for pre-registry `permission_profile` values), `data_classification` schematize, linter CI re-enable. | standard | standard-feature — single review |

## Exit criterion

1. A minted A→F receipt chain exists on disk under `docs/receipts/`, produced by a real run (not a fixture); the coordinator's deterministic pass asserts all three of: `validateChain` passes, `isSealed` passes, and the chain's stages are exactly `['A','B','C','D','E','F']` in sequence order (B1 — `isSealed` alone reads only the last receipt). **Bound to observable events (S1):** the Stage-E receipt's subject names the real PR number and head SHA of an actual PR; the Stage-F receipt's subject names the real merge SHA; the coordinator cross-checks both against `gh`. Emitters invoked against the pre-existing A→D chain (`docs/receipts/1912af36-…`) with hand-assembled subjects do NOT satisfy this item.
2. `spec-linter validate` over `plugins/foreman-line/docs/specs/done/` **as of CLOSE-P2's own final SHA** exits 0 and runs in CI (S4 — the corpus includes the specs P1/P3 move to done/ after shaping; those are also coordinator-linted at their own closures).
3. Biome runs in CI as a blocking check and main is biome-clean.
4. Exit item 1 of the W4 charter, as replaced by D4-R2B: existing ruleset `17746056` remains unchanged; a separate active `main-pr-gate` ruleset targets exactly `~DEFAULT_BRANCH` with no bypass and the complete ratified pull-request/status-check parameters; effective `main` rules require a PR plus strict `test` and `integration-report` checks from GitHub Actions app ID `15368`; and a real goal-complete PR proves the gate before its human merge. The final report states explicitly that zero required approvals do not prevent agent self-merge under shared owner credentials. **Human gate:** Clint creates the ruleset only after the corrected governance record merges.
5. Stage-F closure for all three parcels (specs → done/, lessons appended **with dispositions installed per FOREMAN-LINE-PLAN §Stage F item 4**, worktree/branch cleanup, loop-directive state current).

## Standing authorizations requested (granted at Gate 1)

1. **Gate 2 (dispatch):** shaping + builder + reviewer dispatch for the three named parcels, in D5 order, one at a time.
2. **Gate 3 (merge):** PR-only merge behind a fully green chain (deterministic pass + adversarial review(s) + required CI checks on the final SHA); any red step voids the authorization for that PR. **Human-merge exceptions:** CLOSE-P1's minted-chain vehicle PR and D4-R2B's governance-record and goal-complete PRs. All other ordinary parcel merges retain their prior green-chain-contingent authority.
3. Push, PR, and Stage-F closure work within this repo only.
4. No Jira writes this goal unless a spec designates them (KONE-only, gated, if so).
5. **Narrow gating-workflow authorization (B3, re-ratified):** additive edits to `.github/workflows/plugins.yml` and `.github/workflows/foreman-line-ci.yml` for exactly the chartered diffs — CLOSE-P3's biome lint-loop + always-report jobs, and CLOSE-P2's spec-linter exclusion removal. PR-only, adversarially reviewed, green-chain contingent, like all other work. Any gating-workflow change beyond these named diffs remains human-apply-only (predecessor D8 carve-out stands).

## Stop conditions

Universal set (COORDINATOR-PATTERN): frozen contract needs modification; a tripwire fires twice on one parcel; a security finding can't close in-parcel; anything outward-facing beyond the standing authorizations; queue empty. Goal-specific under D4-R2B: stop on any pre-write live drift, same-named ruleset collision, unexpected check producer, missing required check, modification to ruleset `17746056`, or any attempt to infer configuration-enforced independent approval. After follow-up review PASS and governance-record merge, stop awaiting Clint's exact human creation of `main-pr-gate`; no agent ruleset write is authorized.

## Deferred debts (recorded, not chartered)

- **SCAF-P4-FUP-1** — GitHub-login format guard (whitespace/homoglyph/RTL parse today; fails closed for authz, spoofing vector at report sinks — lesson #31 class).
- **SCAF-P4-FUP-3** — own-property guards.
- **W4-FUP-AUDIT** — broader audit follow-up; largest and least defined.
- **W4-item-6 Jira leg (S2a, re-ratified deferral)** — the W4 original required "the Jira ticket transitions to closed via MCP" on human merge; SCAF-P4's ticket was never minted (KONE-TBD). Deferred explicitly, not silently dropped: a future parcel mints a real KONE ticket for a run vehicle and exercises the Stage-F transition through the W1-P4 transport.
