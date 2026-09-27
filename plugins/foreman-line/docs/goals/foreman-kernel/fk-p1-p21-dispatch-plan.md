# FK-P1–FK-P21 dispatch plan — 2026-09-26

**Goal:** `foreman-kernel`
**Purpose:** one-row-per-parcel routing plan for the coordinator's next waves. No FK-P1+
work is started here (gate decision GD-3 in `fk-p0-canon-authority-enforcement-registry.md`).
**Routing classes** use the live `routing-policy.yaml` enum (lines 17–32):
`boilerplate`, `standard-feature`, `implementation/standard`, `architecture/risk`.
Charter display labels map as: "architecture-risk" → `architecture/risk`;
"standard-feature" → `implementation/standard`. Per charter §15.3 the exact routing
value for contract work is `architecture/risk`; friendly labels never redefine the enum.
**Dependencies** are charter §6 edges. **Owned surfaces** are the parcel's exact
ownership per charter §12 (bold = named serialization point owned by exactly one parcel;
all other parcels emit fragments/fixtures only). Every parcel also owns its spec,
fixtures, and goal-doc artifacts under `docs/goals/foreman-kernel/` and works in its own
isolated worktree.

## Pre-dispatch prerequisites (all waves)

1. **Human Gate-3 merge of the accepted R31 FK-P0 registry** (`codex/fk-p0-r31-source-adoption-20260907` @ `1747c1d`; PR material prepared at `947e6f1`, unsubmitted). FK-P1 depends on FK-P0; its dependency is the *merged* P0 (per `CURRENT-RESUME.md`: "FK-P1 awaits merged P0 and its exact field mapping").
2. **Fresh independent frontier review of the consolidated charter's incorporated changes** (charter §15.2) — authority mapping, parcel coverage, collision ownership, A1 consistency, evidence sufficiency, false-completeness. Report-and-triage only; unratified changes to locked decisions/graph/exits need scoped Gate 1.
3. **Recorded owner-of-record handoff** at a parcel boundary (branch canon: "Reconcile an owner-of-record handoff before successor dispatch"; reconciliation row 16).
4. Per-parcel: reviewed spec under SPEC-CONVENTION with exact non-glob Allowed Files, isolated named worktree from a verified base SHA, Step 0 restate-and-stop, standing-constraints line in every kickstarter.

## Parcel rows

| Parcel | Work summary | Routing class | Dependencies | Owned surfaces | Notes / prior evidence |
|---|---|---|---|---|---|
| FK-P1 | Lifecycle event, authenticated-principal/local-capability admission, `authorizeAction` contract, decision envelope, refusal codes, assurance levels, repository identity, content/read-capability boundary, host-path normalization split, golden vectors; adopts the A1 decision-path latency contract | `architecture/risk` | FK-P0 (merged) | Contract docs + golden-vector fixtures (new kernel contract surface) | **Stage A shaped** on `codex/foreman-kernel-resume-20260908`: `FK-P1-shaping-decisions-20260907.md`, `FK-P1-shaping-review-20260907.md`, `R31-to-P1-field-reconciliation-20260907.md` (F01–F04 accepted; F05 schema field table + merged P0 gate activation). INF-5 carrier |
| FK-P2 | Spec-body compiler: parses required spec sections; compiles exact non-glob Allowed Files + frozen/forbidden surfaces; rejects ambiguity, traversal, equivalent paths, symlink/reparse escape, missing authority | `architecture/risk` | FK-P0 (merged), FK-P1 | Compiler package + hostile fixtures | Never reads `surfaces:` as mutation permission (D10); feeds FK-P12 |
| FK-P3 | Pure dispatch decisions: routing + skill resolution split into deterministic no-I/O decision functions with injected validated policy and stable digests; legacy writers become compatibility adapters | `architecture/risk` | FK-P1 | Pure decision functions + recorder adapters in **`dispatch/`** / routing + skill-injection surfaces — **contested** with `foreman-line-boundary-routing` (routing authority + installability) | Seam recorded in reconciliation §3; ownership must be negotiated before dispatch. D16 carrier; INF-7: covers every read-surface-reachable mixed evaluator |
| FK-P4 | Verifier facade: one provider-neutral library facade over immediate validators/evaluators; chain results say `STRUCTURAL`; public calls content-only or via the D19 capability-bound repository reader | `architecture/risk` | FK-P1, FK-P2, FK-P3 | Facade package + reader capability | D6/D19 carrier |
| FK-P5 | Clean-room trust-core spike: facade against an unrelated fixture repository — positive, negative, malformed, hostile-path, degraded-assurance cases | `implementation/standard` | FK-P4 | Spike fixtures + evidence records | INF-4 clean-environment proof carrier |
| FK-P6 | Read-only MCP server: versioned read-only catalog, strict schemas, payload limits, health/readiness/version endpoints, semantic-parity tests vs facade | `architecture/risk` | FK-P4, FK-P5 | **Read-only server package manifest** (serialization owner) | D17 parity tests |
| FK-P7 | Stateless verifier image + launcher: multi-stage Node image, one dependency graph, non-root, read-only root fs, capability-bound repo mount, no state volume/external credentials, named-container launcher + labels; build benchmarks | `architecture/risk` | FK-P6 | **Stateless Docker/launcher files** (serialization owner) | INF-2/INF-3 carrier (native named volume contract is P9/P14; build/launcher config + benchmark evidence here) |
| FK-P8 | Stateless harness portability proof: same verifier image from ≥2 independent harness shapes, no package-local installs; read confidentiality; records tool/version/policy/image digests; no stateful-container claim | `implementation/standard` | FK-P7 | Portability proof harness + evidence | INF-4 carrier |
| FK-P9 | SQLite storage + migration ABI: schema migrations, events/goals/artifact tables, WAL/busy policy, transactional migration startup, newer-schema/corruption refusal, online backup/checkpoint recovery, storage exports | `architecture/risk` | FK-P1 | **State migrations / storage package exports** (serialization owner) | D14; INF-2/INF-8: backup boundary, integrity checks, protected destination, retention, restore sequence |
| FK-P10 | Lease + transition engine: trusted lease time, CAS revisions, principal/operation/idempotency binding, transactional event/state updates, legal transition invariants, real process-boundary crash/concurrency tests | `architecture/risk` | FK-P9 | Lease/transition engine package | D14; INF-6 carrier (contention measurement) |
| FK-P11 | Legacy import + projection engine: one-time digest/commit-bound import with no manufactured approvals; field-level authority reconciliation; deterministic Markdown projection; cutover epoch; divergence-stop | `architecture/risk` | FK-P9, FK-P10 | Import/projection engine package | D2/D14 authority matrix; human-gate state evidence-derived (D9) |
| FK-P12 | Authorization policy engine: implements `authorizeAction` over admission, repo/worktree identity, compiled scopes, roles, leases/revisions, gate evidence, outage mode, post-diff obligations; one golden negative vector per initial refusal code | `architecture/risk` | FK-P2, FK-P10 | Policy engine package | D18 owning engine; the five mediated refusal classes' vectors live here |
| FK-P13 | Admission-protected control catalog: get/claim/renew/release/transition/evidence/project behind the distinct local capability; principal+digest binding on every request; anonymous verifier clients cannot list or call control tools | `architecture/risk` | FK-P6, FK-P10, FK-P11, FK-P12 | Control catalog package | D3/D15/D17 |
| FK-P14 | Stateful image composition + operator lifecycle: final image/launcher with separate read/control endpoints, non-root UID, state-volume ABI, migrations, health/version negotiation, backup/restore, bounded shutdown; no read-surface access to state | `architecture/risk` | FK-P7, FK-P13 | **Final stateful Docker/launcher composition** (serialization owner) | INF-2/INF-3/INF-8 carrier |
| FK-P15 | Stateful restart + admission proof: clean-room process-boundary proof of restart recovery, split-brain refusal, stale CAS, idempotency conflict, migration crash/recovery, anonymous-control denial, digest-pinned projections | `architecture/risk` | FK-P14 | Proof harness + evidence | INF-2/INF-4/INF-8; proofs valid only for the native named-volume placement |
| FK-P16 | Claude lifecycle adapter, shadow mode: capability-preflighted SessionStart/PreToolUse/PostToolUse/Stop for the D20 matrix; enrollment heartbeat; host-path normalization; calls FK-P12; records would-allow/would-refuse/detected-only | `architecture/risk` | FK-P12, FK-P13, FK-P15 | **Claude hook registration + Claude manifest only** (serialization owner; no Codex or shared Docker files) | D7/D8/D20; INF-5: measures both latency spans + cold start + 1000 ms deadline failure on D20 |
| FK-P17 | Bypass + outage harness: shell, subprocess, custom-tool/MCP, symlink/reparse, subagent, mediated bypass, hook non-enrollment, stale state, service timeout, restart; produces mechanical/detected/unsupported matrix | `architecture/risk` | FK-P16 | Harness + matrix evidence | D13; INF-1/INF-5/INF-6 carrier (two-span latency, cold start, decision latency) |
| FK-P18 | CI scope + state-evidence backstops: mirrors exact-scope, enrollment, state/evidence, dirty-reviewer invariants in CI; negative control bypasses the hook and must fail CI before enforcement promotes | `architecture/risk` | FK-P17 | **Its named workflow/CI integration points only** | D13; INF-4: independent-host backstop (host independence is load-bearing — ADR Consequences); pin external actions per reviewed CI contract |
| FK-P19 | High-confidence refusal enforcement: promotes only the five mediated classes whose negative controls, corpus sweeps, authorization vectors, and FK-P18 backstops pass; degraded read-only mode; fail-closed governed mutation | `architecture/risk` | FK-P17, FK-P18 | Enforcement promotion config in adapter/policy surfaces | D8/D11; INF-7: complete sweep evidence (one disposition per item) before any retirement/promotion |
| FK-P20 | Second-host feasibility + host registration: Codex lifecycle capability probe; either thin adapter with process-boundary parity or recorded unsupported gap | `architecture/risk` | FK-P19 | **Codex manifest changes only** (serialization owner; no Claude-hook or Docker-file edits) | D20: no enforcement claim without process-boundary evidence; INF-1 |
| FK-P21 | Exit evidence manifest + clean-room proof: committed manifest binding source SHA, image digests, tool/schema/policy digests, host/harness versions, corpus inventory/count, reviewer identities, commands/results, named mutation controls | `architecture/risk` | FK-P19, FK-P20 | Evidence manifest + retained evidence records | INF-4/6/7/8 final assembly; CI job URLs are navigation pointers, not sole evidence |

## Wave exits (charter §6, unchanged)

- **Wave 0 (P0–P2):** contracts and fixtures merged; exact path authority compiles
  without reading `surfaces:` as mutation permission; plan-level contradictions have no
  unresolved implementation consequence. *(P0 fragment satisfied 2026-09-26; P1/P2
  pending.)*
- **Wave 1 (P3–P5):** every first-release evaluator deterministic, no-I/O unless
  documented, contract-tested, proven against an unrelated repository.
- **Wave 2 (P6–P8):** pinned stateless container serves the read-only verifier to
  independent harnesses, cannot read the future state volume, survives clean-room launch
  without package-local installs.
- **Wave 3 (P9–P15):** no split ownership; restart reconstructs from SQLite; stale
  revisions and same-key/different-payload calls conflict; crash points and migrations
  recover or fail closed; projections deterministic; Git/SQLite authority matrix stops on
  divergence.
- **Wave 4 (P16–P21):** selected mediated violations mechanically refused on the proven
  host; non-enrollment/unmediated changes detected by heartbeat/diff/CI; CI green before
  promotion; bounded outage recovery; host claims and proof identities bound in the
  evidence manifest.

## Serialization points recap (charter §12)

One active parcel at a time for: plugin manifests, marketplace metadata, root workflow
files, shared package manifests, receipt schemas, `SPEC-CONVENTION.md`, barrel exports,
plus the bolded owners above. FK-P6/FK-P7/FK-P9/FK-P14/FK-P16/FK-P18/FK-P20 are the
named owners of their manifests/Docker/migrations/CI files. `routing-policy/`,
`dispatch/`, `contracts/`, `templates/` are contested with active sibling goals —
FK-P2/FK-P3 dispatch must first reconcile that ownership (seam recorded in
`fk-reconciliation-2026-09-26.md` §3). Concurrency after FK-P1 merges: FK-P2, FK-P3,
FK-P9 are candidate concurrent lanes if their shaped Allowed Files and serialization
points are disjoint (charter §15.4).

## Review routing

Architecture/risk parcels (all rows above except FK-P5 and FK-P8) receive **two fresh
independent reviews**; FK-P5/FK-P8 receive one independent review. Reviewers report and
triage (fix / accept-as-documented / informational); they never fix or commit. Every
builder/reviewer kickstarter includes the standing-constraints reference line.
