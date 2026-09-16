---
ticket: GMF-P1
title: Effect, source, environment, envelope, artifact, terminal, receipt, and evidence contract freeze
status: active
owner: clinton.morgan
created: 2026-09-16
updated: 2026-09-16
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-*.md
  - plugins/foreman-line/docs/specs/active/GMF-P1-effect-source-environment-evidence-contracts.md
  - plugins/foreman-line/docs/specs/active/gmf-p1-effect-source-environment-evidence-contracts.shaping-result.json
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
---

# GMF-P1 — Effect/source/environment/evidence contracts freeze

## Intent

Freeze the eight Fleet contract families — effect descriptors, source identity,
execution-environment identity, permission-envelope presentation, artifact
manifests, terminal outcomes, receipt profiles, and evidence rules — as
versioned, hash-pinned Markdown records with canonical byte domains, hash
procedures, a ratified error-code vocabulary, and decisive policy answers to
the P0 decision requests owned by P1. The parcel resolves DR-001, DR-002,
DR-004-contract, DR-005-taxonomy, DR-006-contract, DR-007, and DR-008-placement
with recorded contract-owner concurrence, carries DR-003-tech-selection,
DR-009, and DR-010 with named owners and blocking rules, and preserves all 66
permanent negative scenarios as byte-stable conformance targets. Its consumers
are the GMF coordinator, the two independent P1 reviewers, the human Gate-2
owner, and the downstream GMF-P2A/P2B/P2C/P3B/P5/P6/P8 builders who must
implement byte-faithfully against the freeze.

## Constraints

- The controlling authority is the ratified Governed Model Fleet charter as
  amended by A1, the closed plan-review findings, the discovery record, and the
  loop directive, at the exact shaping-time SHA-256 pins listed below, plus the
  five accepted P0 output files as read-only hash-pinned inputs. A hash
  mismatch is drift to reconcile, not permission to reinterpret canon.
- GMF-P1 is zero implementation. It may inspect local text, Git metadata, and
  already-present artifacts. It must not edit product repositories, exercise a
  product effect path, or create executable product code, machine schemas,
  migrations, fixtures, tests, services, images, repositories, or deployments.
  Machine-readable contract schemas are downstream parcel work bound to this
  freeze, not part of it.
- No provider/model call, workload process, MCP workload, container, WSL
  distribution, or VM may be launched. No network probe, package installation,
  dependency resolution, credential access, source upload, source disclosure,
  paid action, or external mutation is allowed. Version/status queries must
  remain passive and local.
- Do not create or protect `keon-model-gateway` or `keon-fleet-executor`. Their
  absence is evidence and the human prerequisite `GMF-HG-R1` remains
  unsatisfied.
- Do not edit `charter.md`, `amendment-a1.md`, `plan-review-findings.md`,
  `discovery.md`, `loop-directive.md`, the goal index, any file under
  `model-fleet-v1`, any of the five P0 output files, or any product repo.
  Model Fleet V1 is immutable predecessor evidence; the P0 outputs are frozen
  shaping inputs.
- Runtime-issued `IPermission` remains the sole authority. A role, prompt,
  profile, `FleetPermissionEnvelope`, receipt, evidence file, readiness
  recommendation, or this spec cannot authorize an effect. The DR-001
  audience/nonce resolution must be provably free of authority duplication: it
  extends or binds the canonical permission, never a second spendable
  primitive.
- Treat `fleet.worker.execute`, `fleet.model.infer`, and `fleet.patch.promote`
  as separate effects with separate descriptors, permissions, spends, receipts,
  terminal states, and denial paths. Never collapse source materialization,
  provider attempt, or promotion into ambient execution authority.
- Preserve D5/D9 timing: pre-spend preparation is blank and source-free; one
  satisfied execution spend precedes one isolated root process tree; source
  materialization is post-spend and pre-cognition; failure consumes authority
  and cannot retry under it. The PR-11 process-tree semantics below elaborate
  this boundary; they do not amend it.
- Preserve D13/D21 timing: one exact provider attempt is one spend; automatic
  retry and fallback are prohibited; an unknown post-send charge remains
  reserved until append-only settlement or human resolution.
- Preserve D15: only the separately deployable Promotion Actuator may stage
  into a new isolated worktree/ref; it cannot merge and Gate 3 remains human.
- Preserve D8 exactly: source identity is `base_commit + explicit overlay`
  with ambient dirty state forbidden. The PR-11 filesystem edge semantics below
  elaborate this definition; they do not amend it.
- No frozen canon may change under GMF-P1 authority: D1–D24 as amended by A1,
  A1–A7, the GMF-P0–P9 graph, the seven receipt-type count, the three effect
  classes, retry/no-fallback semantics, or any P0-frozen ID (MAP-001–014,
  CTR-001–015, B-001–010, T-001–T-013, GMF-NEG-001–066, DR-001–010 meanings).
  Any freeze answer that requires such a change is a STOP with a scoped Gate-1
  amendment request, never a silent edit.
- Findings must distinguish observed fact, ratified requirement, inference,
  proposal, unresolved decision, unavailable evidence, and stale evidence. A
  missing product decision outside P1 ownership is recorded as CARRIED with a
  named owner and blocking rule; the builder must not invent it.
- All seven output records are Markdown governance/evidence artifacts. They
  must contain no credentials, tokens, customer data, PII, internal endpoints,
  or copied proprietary source.
- The optional shaping red-team is intentionally not run for this critical
  draft because the governing authority forbids provider calls. P1 still
  requires two independent fresh architecture/security reviews after Gate 2 and
  after its evidence is complete.
- `status: draft` is mandatory until coordinator lint and an explicit human
  Gate-2 decision. A passing advisory self-check or a `READY` recommendation
  never flips status or grants dispatch.

## Acceptance Criteria

- [ ] `gmf-p1-effect-descriptors.md` freezes the complete field schema for each
  of the three effect descriptors (`fleet.worker.execute`,
  `fleet.model.infer`, `fleet.patch.promote`) per D4/D7, the
  recompute-effective-descriptor-before-spend procedure per A1-D5, the
  attempt-ordinal rule per A1-D13/A1-D21, and the inference payload taxonomy
  resolving DR-005 (allowlist preserving the A1-D22 synthetic/public-only
  default; credentials/regulated/secrets/ambiguous remain denied). Every field
  cites its ratified source and the NEG IDs it constrains.
- [ ] `gmf-p1-source-environment-identities.md` freezes the `SourceIdentity`
  schema per D8 and the `ExecutionEnvironmentIdentity` schema per A1-D10 with
  explicit canonical byte domains, the manifest formats and
  verification-before-cognition procedure per A1-D9, the independent pre-spend
  attestation format, and the PR-11 edge semantics: one authorized root process
  tree with descendant accounting and whole-tree termination, plus
  symlink/hardlink/mode/case/LFS/submodule/sparse/overlay rules. The record
  states explicitly that D5/D8 are elaborated, not amended.
- [ ] `gmf-p1-envelope-and-admission.md` freezes the `FleetPermissionEnvelope`
  schema per D3 (allowed fields, allowed proof material, audience/nonce
  binding) resolving DR-001 with a machine-checkable non-authority proof
  (envelope can never mint, delegate, refresh, or spend), and freezes the D14
  MCP capability schema (server identity, exact tool names, argument
  constraints, mapped effect class, maximum calls, audience, expiry) with
  transport-parity and no-bypass rules resolving DR-008-placement. Misuse as
  authority remains threat T-001 with NEG-059 as its proof case.
- [ ] `gmf-p1-canonicalization-and-error-codes.md` freezes one canonicalization
  standard or per-artifact procedures with explicit byte domains for every
  descriptor, identity, patch, and manifest, resolving DR-002, plus the Fleet
  error-code vocabulary covering every NEG denial/failure family (pre-spend
  denial, post-spend failure, unknown-settlement pending, race-loser denial).
  The `BLOCKED_UNRATIFIED_ERROR_CODE` placeholder appears nowhere except in
  quoted P0 history; domain-separation mismatch (NEG-066) fails closed.
- [ ] `gmf-p1-artifact-evidence-manifests.md` freezes the patch-manifest and
  evidence-manifest formats with content-addressing and hash procedures per
  CTR-009, the export-only-after-policy-hold rule (NEG-050), the redaction
  policy for secret leakage (T-011), the patch-form eligibility policy
  resolving DR-007 that is decisive for NEG-032–NEG-037 (no residual
  "ratified P1 policy" forward reference), and the signing/trust-bundle format
  with rotation semantics resolving DR-006-contract (NEG-065).
- [ ] `gmf-p1-terminal-receipt-settlement.md` freezes the per-effect terminal
  profiles per A1-D16 (inference: denied / failed-before-send /
  sent-usage-pending / unknown-post-send / settled / adjustment-refund;
  execution: bootstrap / materialization / manifest / launch / runtime /
  termination failures; promotion: rejected / staged / applied-to-isolated-ref
  / rolled-back-compensated / partial-ambiguous), the seven receipt-type
  profiles per CTR-015 with pre-effect receipt fields and
  terminal-completeness rules, and the cost-reconciliation contract resolving
  DR-004-contract (unknown cost stays reserved; append-only settlement only;
  no silent currency conversion; forged cost evidence rejected per NEG-064;
  leaked reservations quarantined per NEG-063; conflicting terminals rejected
  per NEG-062).
- [ ] Every RESOLVE disposition above carries a recorded concurrence:
  DR-001/002/004-contract/006-contract from the `keon-systems` contract owner
  (code owner of `keon-contracts`) and the goal owner; DR-005-taxonomy from the
  goal owner (disclosure policy is owner-held per A1-D22); DR-007 from the goal
  owner and coordinator (P6 unshaped, executor repository absent); DR-008 from
  the `keon-mcp-gateway` owner and the goal owner. A missing concurrence is a
  `HOLD`, never assumed.
- [ ] DR-003-tech-selection is CARRIED to human isolation review with P1/P4B as
  freeze consumers: P1 freezes only the attestation format, never the
  qualifying VM stack; Docker/WSL2 stays deny-only-candidate; private/internal
  proof is impossible until decided. DR-009 is CARRIED to human HG-R1: P1
  freezes only the receipt shape HG-R1 evidence must contain for downstream
  base pinning (base SHAs, protection rules, initial commits), never the
  procedure. DR-010 is CARRIED to P7 with the non-authoritative-copy rule
  restated. Each carry states owner, blocking rule, and downstream consumer.
- [ ] All 66 scenario IDs GMF-NEG-001 through GMF-NEG-066 are traceable from
  the freeze: every ID is cited by at least one frozen clause as a
  conformance target with its result family preserved. No ID is omitted,
  merged, renamed, weakened, redefined, or deleted; no additive P1 IDs are
  introduced. New coverage needs remain additive downstream IDs with
  provenance.
- [ ] All 15 inventory contracts CTR-001–CTR-015 are frozen clause-by-clause:
  each CTR maps to one or more frozen clauses `P1-C001`–`P1-C0NN` (single
  namespace, unique, gap-free) with provenance and NEG links; each P0 DR-001–
  DR-010 has exactly one recorded disposition (RESOLVED-in-clause or
  CARRIED-to-owner) in the closure record.
- [ ] `gmf-p1-closure-evidence.md` is a bounded evidence index and P1 decision
  package, not an approval. It records exact files/hashes, commands and
  outputs, DR dispositions with concurrence evidence, NEG/CTR traceability
  counts, review verdicts, collision state, authority boundaries, carried
  items with owners, and a single `READY_TO_REQUEST_GMF_P2A_GATE_2` or `HOLD`
  recommendation with reasons.
- [ ] No output makes GMF-P2A dispatchable or represents that Gate 2,
  repository creation, provider spend, source disclosure, promotion, merge,
  installation, deployment, publication, or Gate 3 has been granted.
- [ ] The parcel changes only the exact Allowed Files. `git diff --check` is
  clean, all factual claims reconcile to local evidence, and the spec/advisory
  lint remains green.
- [ ] Two fresh, independent, read-only architecture/security reviewers assess
  the exact seven-file evidence set with no builder context and return explicit
  verdicts. No unresolved Critical, High, or decision/graph-changing finding
  may remain before a Gate-2 readiness recommendation; reviewers do not fix,
  commit, call providers, launch workloads, or mutate external state.

## Out of Scope

- Product implementation in `agent-skills`, `keon-systems`, `keon-mcp-gateway`,
  or any future Fleet repository, including code, machine schemas, migrations,
  fixtures, or tests. P1 freezes Markdown contract records; transcription into
  machine schemas is downstream parcel work.
- Creating/protecting service repositories or satisfying `GMF-HG-R1`; the
  HG-R1 procedure itself (only its evidence receipt shape is frozen).
- Selecting or provisioning a VM, container, WSL distribution, hypervisor,
  enforcement plane, service identity, key provider, signing root, durable
  database, provider, model, pricing source, or production environment; the VM
  technology decision itself (DR-003, carried).
- Provider/model/MCP calls, network or egress tests, workload/process-tree
  launches, container or VM activity, secret inspection, paid activity, and any
  private/internal source transfer or disclosure.
- Changing A1–A7, D1–D24 as amended, the GMF-P0–P9 graph, the seven
  receipt-type count, effect classes, ownership boundaries, retry/no-fallback
  semantics, data-class policy defaults, promotion authority, or any
  frozen/candidate contract or P0-frozen ID. Such a need is a STOP with a
  scoped Gate-1 amendment request, not a P1 edit.
- Redefining, executing, or adding to the 66 permanent negative scenarios. P1
  cites them as conformance targets only.
- Implementing the durable store, atomic transaction, terminal reconciliation,
  model gateway, executor, MCP admission, Promotion Actuator, foreman skill,
  offline verifier, or E2E proof. Those are GMF-P2A and later.
- Promotion, patch application, worktree/ref staging against a product
  repository, merge, installation, activation, deployment, publication, receipt
  minting, or Gate 3.
- Editing, reinterpreting, or refreshing the charter, amendment, findings,
  discovery, loop directive, goal index, any file under `model-fleet-v1`, or
  any of the five P0 output files.

## Context & References

- `plugins/foreman-line/docs/goals/governed-model-fleet/charter.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/amendment-a1.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/plan-review-findings.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/discovery.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/loop-directive.md`
- `plugins/foreman-line/docs/SPEC-CONVENTION.md`
- `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`
- `plugins/foreman-line/skills/parcel-driven-development/SKILL.md`
- `plugins/foreman-line/permission-profiles/permission-profiles.yaml`
- `plugins/foreman-line/docs/specs/active/GMF-P0-governed-model-fleet-discovery-and-negative-contracts.md`
- `plugins/foreman-line/docs/specs/active/gmf-p0-governed-model-fleet-discovery-and-negative-contracts.shaping-result.json`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p0-repository-canon-environment-map.md` (read-only input)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p0-contract-inventory.md` (read-only input)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p0-threat-model.md` (read-only input)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p0-permanent-negative-scenarios.md` (read-only input)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p0-closure-evidence.md` (read-only input)

## Shaping-Time Passive Baseline

Observed locally on 2026-09-16; every value must be refreshed at builder Step 0
and drift must stop execution until the coordinator reconciles it.

| Repository/environment | Observation |
|---|---|
| `D:/Repos/agent-skills-worktrees/gmf-p1-shaping-20260916` | Branch `codex/gmf-p1-shaping-20260916`, merge-forwarded to `origin/main` at `3ea16a2` (Gate-2 prep; shaping files untouched by the merge); `origin/main` fetched 2026-09-16 |
| `D:/Repos/agent-skills` (main checkout) | On `fix/marketplace-plugin-versions-069`, untouched by this parcel; not a base and never a write target |
| `D:/Repos/keon-omega/keon-systems` (read-only) | `main` at `2b6c75536f50f125155ee697446cec89f70f2fec`; clean tracked worktree; local `main` 3 ahead of origin |
| `D:/Repos/keon-omega/keon-mcp-gateway` (read-only) | `main` at `d6376fd024d43be7ff458af675c646ae93c52492`; pre-existing `M .serena/project.yml`; local `main` 2 ahead of origin |
| Future repositories | `D:/Repos/keon-omega/keon-model-gateway` and `D:/Repos/keon-omega/keon-fleet-executor` absent |
| Host/tool surface | Carried from P0 MAP-010 as NOT_TESTED (Windows / PowerShell / Git / Node / npm / .NET SDK / Codex CLI / Docker / WSL values of 2026-09-04, unrefreshed). No environment eligibility is claimed; Docker/WSL2 stays deny-only-candidate per A1-D11. |

The named builder branch is `codex/gmf-p1-contracts-20260916`; the named
builder worktree is `D:/Repos/agent-skills-worktrees/gmf-p1-contracts-20260916`.
Both are absent at shaping time and must not be created before explicit Gate 2.

Shaping-time governing-record SHA-256 pins. Ruling 2026-09-16 (coordinator,
pre-Gate-2 shaping maintenance): five of six MATCH the P0 pins; `loop-directive.md`
drifted by the coordinator's own scoped standing-grants/state edit (PR #30, additive,
no canon change) — drift ACCEPTED, pin re-based below; all other pins unchanged:

| Record | SHA-256 |
|---|---|
| `charter.md` | `cfb1557b25e01d892daeb01fb94cf31869f963c3cdf4eb81043dbc05705b938e` |
| `amendment-a1.md` | `22d681f0fc8786fc501a555143d6f3687495457d67647207ecd479377170e501` |
| `plan-review-findings.md` | `b784ed7656294d19e887c3a221e5eb8354160bb3f647530e2d3c1519532bd5ff` |
| `discovery.md` | `56affe5c3e77e8a260abe88df4cf5662b3ff541ff0c0a6525d193f018cfd9e2d` |
| `loop-directive.md` | `9e2060e345f685907ac591162d59d5b8da6df0b209064401af352ce862aa7bf9` |
| `SPEC-CONVENTION.md` | `7ac315005cde6ad6def848b83de1d1b644e321c5d9f6434bc925deb6daba8703` |

Accepted P0 outputs as read-only hash-pinned inputs (Step-0 verified; builder
Step 0 must re-hash and STOP on any mismatch):

| P0 input | SHA-256 |
|---|---|
| `gmf-p0-closure-evidence.md` | `5E1974A8E7800F6FD870884F822F184BA85F9C83A6720DDDB1241C0E4A707E3E` |
| `gmf-p0-contract-inventory.md` | `81206C570461711B3B5AF264B5CC41CBFCB3618DBD7A0E3D6A4E728B1EAD03CD` |
| `gmf-p0-permanent-negative-scenarios.md` | `F8BBEB1FEE6E238B5AB49A64F01B782052CFD40D543F2867E16A339B9C698549` |
| `gmf-p0-repository-canon-environment-map.md` | `68E5BFF22D75912F383216403BF768F06E64DA093B1D6F839070384FE332ADA6` |
| `gmf-p0-threat-model.md` | `EF4D9409AEFD1CB020DE62BFD5530650D07D3B967DB66C7627CE570AE393B8AC` |

Shaping-time counts the builder must preserve: scenarios `66`
(GMF-NEG-001–066); inventory contracts `15` (CTR-001–015); trust boundaries
`10` (B-001–010); threats `13` (T-001–013); map items `14` (MAP-001–014);
decision requests `10` (DR-001–010); contract families `8`; new builder files
`7`; Allowed Files `9`; hash pins `11` (6 governing + 5 P0).

## Required Contract Freeze Scope

The seven content records freeze eight families. Frozen clauses use one
namespace `P1-C001`–`P1-C0NN` (unique, gap-free, allocated across the files
below). Each clause states provenance (ratified D#/A1 decision), the P0 anchor
it freezes (CTR/B/T/MAP ID), and the NEG IDs it constrains; prose summaries
cannot replace the clause table.

| Family | Frozen in | Ratified source |
|---|---|---|
| Effect descriptors (3 classes + recompute + ordinal + DR-005 taxonomy) | `gmf-p1-effect-descriptors.md` | D4, D7, A1-D5, A1-D13, A1-D21, A1-D22 |
| Source identity + environment identity + PR-11 filesystem/process-tree edge | `gmf-p1-source-environment-identities.md` | D8, A1-D9, A1-D10, A1-D11, PR-11 |
| Envelope schema + non-authority proof + MCP capability + DR-008 placement | `gmf-p1-envelope-and-admission.md` | D3, D14, A1-D19, DR-001, DR-008 |
| Canonicalization + hash procedures + error-code vocabulary | `gmf-p1-canonicalization-and-error-codes.md` | D7, A1-D6, DR-002 |
| Artifact/evidence manifests + DR-007 patch policy + DR-006 trust bundle | `gmf-p1-artifact-evidence-manifests.md` | A1-D9, A1-D15, A1-D16, DR-006, DR-007 |
| Terminal profiles + receipt profiles + DR-004 settlement contract | `gmf-p1-terminal-receipt-settlement.md` | A1-D6, A1-D16, DR-004 |
| Evidence index + DR dispositions + concurrence + recommendation | `gmf-p1-closure-evidence.md` | This spec |

DR disposition table (P0 chooses none; P1 records exactly one disposition per
DR with provenance; full option text lives in P0 closure DR-001–DR-010):

| DR | Disposition | Concurrence required |
|---|---|---|
| DR-001 audience/nonce | RESOLVE in envelope clauses | `keon-systems` contract owner + goal owner |
| DR-002 canonicalization + error codes | RESOLVE in canonicalization clauses | `keon-systems` contract owner + goal owner |
| DR-003 VM technology | CARRY to human isolation review (P1/P4B consume format only) | Human reviewer at selection time |
| DR-004 cost reconciliation | RESOLVE contract half in terminal/settlement clauses; implementation carried to P2C/P3B | `keon-systems` contract owner + goal owner |
| DR-005 payload taxonomy | RESOLVE taxonomy half in effect-descriptor clauses; enforcement carried to P3B | Goal owner |
| DR-006 store + signing | RESOLVE contract half (formats, bundle, rotation) in artifact/evidence clauses; implementation carried to P2A/P3A | `keon-systems` contract owner + goal owner |
| DR-007 patch-form policy | RESOLVE in artifact/evidence clauses (decisive for NEG-032–037) | Goal owner + coordinator |
| DR-008 MCP surface | RESOLVE placement in envelope/admission clauses; implementation carried to P5 | `keon-mcp-gateway` owner + goal owner |
| DR-009 repository procedure | CARRY to human HG-R1 (P1 freezes only HG-R1 evidence receipt shape) | Human at HG-R1 |
| DR-010 foreman packaging | CARRY to P7 with non-authoritative-copy rule restated | P7 owner at shaping time |

PR-11 rule: the one-authorized-root-process-tree definition (descendant
accounting, resource/policy enforcement, independent whole-tree-death proof)
and the filesystem edge rules (traversal rejection, symlink/hardlink/binary
disposition per DR-007, submodule/LFS/overlay manifest binding, case/alias
normalization, sparse-checkout membership, archive-form safety, TOCTOU
re-verification at the cognition gate) are contract elaborations frozen under
D5/D8 authority. If any answer needs D5/D8 text to change, STOP with a scoped
Gate-1 amendment request.

Freeze rule: after P1 acceptance, the seven records are frozen canon for
GMF-P2A and later. Any later change to a frozen clause requires a scoped
Gate-1 amendment before dependents proceed; downstream parcels cite `P1-C###`
IDs and never paraphrase them into weaker form.

## Verification Plan

Builder Step 0 must restate this spec, exact Allowed Files, branch/worktree/
base, read-only repositories, all eleven hashes, prohibited actions, counts
`66/15/10/13/14/10` (NEG/CTR/B/T/MAP/DR), the DR disposition table, and known
blockers, then stop for coordinator ruling before writing P1 outputs. Any
mismatch, pre-existing Allowed File, or overlapping writer is a stop.

Required deterministic checks after the builder claim:

1. Refresh local Git/path facts using read-only commands only. Compare
   repository HEAD, status, remotes, future-repository absence, instruction
   files, and all eleven hashes to the shaping-time baseline. Record drift; do
   not fetch, pull, install, or probe the network.
2. Verify `git diff --name-only` is a subset of Allowed Files and that no
   existing governing record, P0 file, predecessor file, product repository,
   install path, or external state changed.
3. Prove every NEG ID `GMF-NEG-001` through `GMF-NEG-066` is cited at least
   once across the freeze records as a conformance target with its result
   family intact. Reject omitted, merged, renamed, weakened, or redefined
   cases; reject additive P1 IDs.
4. Prove every CTR-001–CTR-015 maps to at least one frozen clause; prove
   `P1-C001`–`P1-C0NN` unique and gap-free with provenance and NEG links on
   every clause; prove every DR-001–DR-010 has exactly one recorded
   disposition with its required concurrence attached (missing concurrence is
   `HOLD`).
5. Prove no D1–D24/A1–A7/graph/receipt-count/effect-class text is altered or
   contradicted: every clause cites its ratified source and the PR-11 record
   carries the elaboration-not-amendment statement for D5/D8.
6. Prove the DR-007 policy decides every NEG-032–NEG-037 case with no residual
   forward reference, and that `BLOCKED_UNRATIFIED_ERROR_CODE` survives only
   inside quoted P0 history.
7. Run the frozen frontmatter validator plus the shaping body-section advisory
   check on this draft, and run `git diff --check`. Advisory green is recorded
   but does not authorize a status change.
8. Run two fresh independent architecture/security reviews of the exact
   seven-file evidence set and this spec. Each review returns a per-focus-
   question finding table and explicit `PASS`, `REQUEST_CHANGES`, or `HOLD`;
   no reviewer edits or executes a prohibited action.
9. Reconcile the reviews. A product/architecture decision, missing concurrence,
   canon conflict, D5/D8 amendment smuggled into PR-11 semantics, or Critical/
   High finding forces `HOLD` in the Gate-2 evidence record.

Mandatory reviewer focus questions:

- Does any frozen clause let the envelope, role, receipt, evidence artifact, or
  foreman confer authority outside Runtime-issued `IPermission` — especially
  the DR-001 audience/nonce resolution?
- Is the DR-001 resolution concurrence-recorded and provably free of authority
  duplication (no second spendable primitive)?
- Does canonicalization plus the error-code vocabulary (DR-002) cover every
  artifact with explicit byte domains, or does cross-artifact confusion
  (NEG-066) survive?
- Do the PR-11 process-tree and filesystem semantics elaborate D5/D8 without
  amending their effect boundary?
- Is the DR-007 patch-form policy decisive for NEG-032–NEG-037 with no
  residual forward reference?
- Does the DR-005 taxonomy preserve the A1-D22 default-deny
  (synthetic/public only)?
- Does the DR-004 settlement contract keep unknown cost reserved with
  append-only settlement, no silent conversion, and forged-evidence rejection?
- Do MCP placement and the capability schema (DR-008/D14) preserve
  transport parity and no-bypass with P5 as implementer?
- Is every carried item (DR-003/009/010) explicitly CARRIED with a named owner
  and blocking rule, never silently chosen?
- Is the closure record merely contracts plus recommendation, with every
  external effect and later gate still withheld?

## Allowed Files

Only these exact repo-relative paths may be created or changed for GMF-P1:

- `plugins/foreman-line/docs/specs/active/GMF-P1-effect-source-environment-evidence-contracts.md`
- `plugins/foreman-line/docs/specs/active/gmf-p1-effect-source-environment-evidence-contracts.shaping-result.json`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-effect-descriptors.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-source-environment-identities.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-envelope-and-admission.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-canonicalization-and-error-codes.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-artifact-evidence-manifests.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-terminal-receipt-settlement.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-closure-evidence.md`

The first two files are shaping-owned artifacts and remain read-only inputs
after Gate 2; they are listed because this shaping session creates them, not
as builder authority to rewrite the contract or result. The builder creates
only the seven new goal-local P1 files. No glob, directory shorthand, related
file, generated file, cache, log, receipt, or temporary artifact is mutation
authority. Any required path outside this list requires a coordinator-ratified
spec amendment.

## Forbidden

- Editing the charter, amendment, findings, discovery, loop directive, goal
  index, `model-fleet-v1`, any P0 output file, any product repository
  (`keon-systems`, `keon-mcp-gateway`, future gateways/executor), install
  paths, or external state.
- Creating or protecting repositories; launching workloads, containers, VMs,
  or WSL distributions; provider/model/MCP calls; network probes; package
  installs; credential access; source disclosure of any non-synthetic class.
- Writing executable code, machine schemas, migrations, fixtures, tests, or
  services under GMF-P1 authority.
- Altering D1–D24 as amended, A1–A7, the GMF-P0–P9 graph, receipt-type count,
  effect classes, retry/no-fallback semantics, or any frozen ID.
- Rewording that grants Gate 2, repository creation, source disclosure,
  provider spend, promotion, merge, installation, deployment, publication, or
  Gate 3.

## Collision Risk and Sequencing

Collision risk is **high** because the ambient `agent-skills` checkout moves
daily, the main checkout sits on an unrelated branch, and a separate Foreman
Kernel writer owns adjacent governance state. No Allowed File existed before
shaping except this newly created draft/result. GMF-P1 must use the named
isolated worktree after Gate 2, read the coordinator worktree's governing
records and the P0 worktree's outputs only through verified hashes, and
serialize any later integration with uncommitted governance baselines. It must
not stage, commit, reset, clean, stash, move, or delete user-owned changes.
GMF-P1 must also serialize against any live GMF-P0 claim-verification writes:
if P0 evidence bytes move, the five P0 pins above are stale and work stops for
a re-pin ruling.

## Evidence and Handoff

The final P1 handoff is contained in `gmf-p1-closure-evidence.md` and must
state: starting and ending commit; exact files changed; commands run; passive
observations; DR dispositions with concurrence evidence; NEG/CTR traceability
counts; checks passed, failed, skipped, or prohibited; both independent review
verdicts; carried items with owners; blockers; and the next safe action. No
receipt is minted. The only permissible next action after a green P1 review
chain is for the coordinator to present an exact human decision request; it is
not permission to shape, dispatch, build, or merge GMF-P2A.

## Stop-and-Report Rules

Stop without inventing or widening scope if:

- a governing hash, P0 input hash, repository HEAD/state, instruction, owner,
  or existing file conflicts with this spec;
- a current product fact cannot be established passively;
- a freeze answer needs a D1–D24/A1–A7/graph/receipt-type/effect-class change
  (file a scoped Gate-1 amendment request instead), an error-code or policy
  invention beyond the concurrence recorded here, or any unratified
  product/architecture choice outside the DR table;
- a required concurrence (DR-001/002/004-contract/005-taxonomy/006-contract/
  007/008-placement) is unavailable or refused;
- a carried owner (DR-003 human review, DR-009 human HG-R1, DR-010 P7) cannot
  be named or their blocking rule cannot be stated;
- completing a clause would require executing a scenario, creating a
  fixture/test/schema, calling a provider/MCP/network service, launching a
  workload/container/VM, or accessing a secret;
- a required output path is occupied by another writer or a mutation would
  escape Allowed Files;
- any action would edit the charter, amendment, findings, discovery, loop,
  index, `model-fleet-v1`, a P0 file, a product repo, an install path, or
  external state; or
- any wording could be read as granting Gate 2, repository creation, source
  disclosure, provider spend, promotion, merge, installation, deployment,
  publication, or Gate 3.

On stop, preserve the partial evidence, set the Gate-2 recommendation to
`HOLD`, name the exact decision/evidence/authority required, and return control
to the coordinator.
