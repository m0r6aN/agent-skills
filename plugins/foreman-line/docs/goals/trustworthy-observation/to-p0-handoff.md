# TO-P0 rework handoff

Proposed documentation-only rework; no implementation, independent acceptance, or live behavioral evidence claimed. Replaces failed draft per [review findings](to-p0-review-findings.md) and [rulings](to-p0-rework-rulings.md). Only amendment, scenarios, handoff written; no commit. Pre-existing worker-dispatch-log modification preserved.

## Acceptance mapping and ownership

| TO-P0 acceptance | Delivery / later owner |
|---|---|
| Grammar/exclusions/supersession/conflicts/reference bounds | RAT, RAT-P/N; TO-P1 |
| Unknown activity/remedy | ATT, ATT-P/N; TO-P1/TO-P5 |
| Malformed isolation/shared membership | EVD/MEM, paired scenarios; TO-P2/TO-P3 |
| Actual-root/document bounds/unsupported parcel-less access | DOC/EVD, paired scenarios; TO-P4 |
| Grounded frozen handoffs | INV, INV-P/N; TO-P5 |
| Generation/freshness/selection/limits | REF, REF-P/N; TO-P6 |
| Old clauses plus positive/negative links | Every contract section cites frozen clause and explicit paired anchors |
| Inventory/collisions/checks/reviewer questions | Below; TO-P7 behavioral proof pending |

## Source consumers and collisions

Inspected actual public consumer declarations and relevant implementations under `plugins/foreman-line/`: [scan](../../../ops-console/src/scan.ts), [status](../../../ops-console/src/status.ts), [chain](../../../ops-console/src/chain.ts), [project](../../../ops-console/src/project.ts), [types](../../../ops-console/src/types.ts), [api](../../../ops-console/src/api.ts), [config](../../../ops-console/src/config.ts), [remedy](../../../ops-console/src/remedy.ts), [invoke](../../../ops-console/src/invoke.ts), [UI](../../../ops-console/ui/app.js); receipts [CLI](../../../receipts/src/cli.ts), [validator](../../../receipts/src/validator.ts), [index](../../../receipts/src/index.ts). TO-P3 future receipts-owned membership file/path must be fixed in its shaped spec; no existing helper assumed. Approval [CLI](../../../approval/src/cli.ts)/[resolver](../../../approval/src/resolve-input.ts) reveal default-path and owner-input constraints.

[Goal index](../INDEX.md) registers [foreman-ops-console](../foreman-ops-console/charter.md) with [directive](../foreman-ops-console/loop-directive.md), owner Clinton Morgan, coordinator ownership recorded there; FOC-P0/FCA-P0/P1 public specs remain active. FCA additions merged PR163 baseline (coordinator-provided d86ade55); no separate FCA goal invented. [Ownership disposition](ownership-disposition.md) (b66bb088) resolves this documentation-only landing under Clinton’s explicit D3 companion-amendment ratification and A1 authority. FOC Phase 1 is delivered; Phase 2 remains excluded. TO-P0 does not edit other-goal canon or transfer ownership. Each dependent source parcel must recheck exact Allowed Files against current main, worktrees and goal ownership, resolving any actual live-coordinator collision before dispatch.

Public source examples read: [w4 charter](../w4-closeout/charter.md) and [directive](../w4-closeout/loop-directive.md). Coordinator inventory supplies existence-only targets: E6-R1 workflow a5b1975a-7497-4200-bac2-5d8a6fd6c749, agent-task intelligence-layer native tree, biostack protocol-upload-graceful-failure/native and biostack-algorithm-reproduction-2026-09-02 initiative tree. External private contents not inspected. Coordinator-supplied browser preflight: baseline-repair cbfcf7cb, HTTP200, 22 goals/statuses and 19 picker options; exact keys agent-task.intelligence-layer, biostack.1.protocol-upload-graceful-failure, biostack.2.biostack-algorithm-reproduction-2026-09-02. Connectivity only, server stopped; navigation/refresh/current-chain proof remains TO-P7 work. Reported baseline faults at five sites are coordinator's independent reproduction, not TO-P0 implementation failures or builder-run tests.

Bounded compatibility: ci-fail-fast balanced multiline bold RATIFIED is supported; foreman-ops-console review NOT-run and w4 parcel HOLD do not negate goal ratification. Case-insensitive anchored `Ratified` is supported; `GATE 1 RATIFIED`, `Status: Gate 1 ratified`, `SCOPED GATE 1 CLOSED` and living-state headers are unsupported by this bounded anchored grammar absent another supported record; unknown, never rewritten. Unsupported phrasing is a review flag, not authenticated authority.

## Verification and review

Builder checks: local Markdown target/explicit-anchor existence, paired rule traceability, word count, three-file write scope, bounded sensitive-content inspection. 71 local links/anchors passed; all seven rules carry paired explicit scenario links; bounded sensitive-pattern/manual inspection found no credential/private-host values (not certification). Write scope confirmed three deliverables plus untouched pre-existing worker log. No behavioral tests or browser/CLI handoffs executed. Spec-linter attempted but blocked by missing local tsx dependency (ERR_MODULE_NOT_FOUND); no validation result. Command (validates spec, not prose): from `plugins/foreman-line/spec-linter`, `node --import tsx src/cli.ts validate --repo-root <absolute-root> <absolute-root>/plugins/foreman-line/docs/specs/active/TO-P0-observation-contract-amendment.md`.

Fresh dual independent architecture/risk reviews required: does bounded grammar handle actual corpus and current conflicts? Do unknown counts/remedies and unmapped diagnostics reach parcel-less UI? Do membership/exits and containment match both consumers? Are successful/error documents and log-input amendment sufficient? Are approval default mismatch/owner inputs/duplicate actions honestly withheld? Does selection-keyed freshness distinguish unavailable/stale/current without snapshot claims? Is live-owner collision resolution and evidence provenance accurate? Review closure, spec lint and later live proofs remain pending; documentation ownership is resolved, while dependent-source collision checks remain required.
