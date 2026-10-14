# Owner authorization — OPMEM-H1 SQLite dependency remediation

**Date:** 2026-10-13  
**Sole coordinator:** Pi `01a1358d-711a-7345-8874-901c5e2b50e3`

## Verbatim owner response

> Authorized to proceed as recommended

## Recommendation approved / exact boundary

The immediately preceding recommendation was: authorize a narrow, separate dependency-remediation parcel for pre-existing CVE-2025-6965 / GHSA-2m69-gcr7-jv3q, preserve the Gateway's 421-test baseline, obtain independent review, and prohibit production deployment. This grants the separate **OPMEM-H1** prerequisite before P5a, not a blanket dependency modernization, a temporary security waiver, cloud/credential changes, or promotion to main/develop.

Proposed implementation mutation surface: the two direct SQLite package manifests and one narrowly focused runtime-version regression test in `Keon-Systems/keon-mcp-gateway`. Exact paths, compatible stable version and verification commands are frozen in the H1 spec/kickstarter before GO. All other packages, production code semantics and deployment workflows stay unchanged. The target is a restored explicitly non-deploying `opmem/integration` based on observed main `0e0878a5938ada21409e6e95ab8d2ea260c2f6b5`, never a main/develop merge. Restoration is a reversible Git action within the inherited grant; existing branches/dirty checkouts remain untouched.

Risk/routing: elevated / architecture/risk (native-library supply-chain remediation); two fresh family-independent frontier reviews before acceptance. Preserved spend guard USD 45 per architecture parcel / USD 400 cumulative; recorded predecessor USD 191.10, unknown prior costs remain unknown. Estimated H1 delegated cost < USD 8; hard guard unchanged. Every actual request is separately time-bounded and accounted from JSON usage. No work/provider route is certified merely by catalog visibility.

## Administrative source correction before dispatch

Fetched agent-skills main `543b261bba8c67265b1628fdb5834c287dac80ba` contains committed conflict markers mixing stale original goal snapshots with the approved #220 successor state. In isolated coordinator branch `coord/opmem-h1-01a1358d`, the conflicts in `charter.md` and `loop-directive.md` were mechanically resolved to **exactly** PR #220 head `a887095bab82c02107a6902677908cadbca84c05` (LF-normalized comparison passed for both files). This restores already-approved metadata; it changes no grant, requirement or decision. Historical Git bytes and unrelated main work are preserved. Commit this repair separately from H1 scope and source implementation.

Current coordinator workspace: `D:/Repos/agent-skills-worktrees/opmem-h1-coord-01a1358d`, branch `coord/opmem-h1-01a1358d`; previous coordinator worktree retained. Builder workspace: `D:/Repos/opmem-worktrees/gateway-h1-01a1358d`, branch `feat/opmem-h1-sqlite-01a1358d`, immutable initial base `0e0878a5938ada21409e6e95ab8d2ea260c2f6b5`. Existing P5a preparation worktree is not reused for H1.

## Remaining gates

Fresh shaping → coordinator factual lint / exact manifests → builder Step 0 / GO → deterministic native-version and audit evidence on Windows and Linux → dual fresh independent reviews / triage → non-deploying exact-head merge / closure. S-1 is authorized for remediation, not yet closed. Deployment remains unperformed/unverified and owner-controlled.
