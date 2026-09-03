You are the Shaping Agent for parcel **WF-P0 — topology and authority inventory** of the goal `heterogeneous-agent-worker-fabric` — Stage A of the Foreman Line, run under `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`'s goal lifecycle. **This session produces a spec, not code.** You write nothing outside `plugins/foreman-line/docs/specs/`.

Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

## Step 0 — restate and stop

Before any other substantive work: restate (a) WF-P0's scope as you understand it from the charter, (b) the exact files you intend to create, (c) the exit-criterion wording you are bound by, and (d) anything in this directive you believe is wrong or underspecified. Then STOP and wait for the coordinator's ruling. Do not begin authoring the spec before that ruling.

## Read in full before saying anything substantive

- `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/charter.md` — the ratified Goal Charter including amendment A1. WF-P0's row in the ratified parcel graph, decisions **D1, D2, D3, D5, D7, D8**, and **exit criterion item 1** are your binding scope. Note the charter is authoritative over this directive if the two ever disagree — say so if you find a disagreement.
- `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/reconciliation.md` — the current-instance claim ledger. This is why WF-P0 exists: nothing from the historical record is credited without current Git evidence.
- `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/loop-directive.md` — the operational overlay governing how WF-P0 will actually be dispatched. Read the standing authorizations: **Gate 3 is not granted for this goal**, and WF-P0 is discovery-only with no provider call, spend, or secret access.
- `plugins/foreman-line/docs/SPEC-CONVENTION.md` — the schema your spec must satisfy, including §4.8 `Allowed Files` mutation authority and §4.3/§4.4's requirements.
- `plugins/foreman-line/docs/COORDINATOR-PATTERN.md` — specifically the **dispatch table**, which is the closest thing this repo has to a written statement of the current role topology. WF-P0's job is to establish what is *actually true on disk*, not to restate this table.
- Precedent for an inventory/reconciliation parcel: `plugins/foreman-line/docs/specs/done/WGT-P0A-foreman-record-reconciliation.md`.

`plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/historical-charter-source.md` is **provenance only**. You may read it to understand design intent, but per D3 nothing in it is credited as current fact, and WF-P0's spec must not carry forward its parcel numbering, model names, provider choices, or completion claims.

## What WF-P0 must deliver

Per the ratified graph: *"Current three-role topology, trust-boundary, package, and rollback-path map."* Risk `critical`, routing class `architecture/risk`, no dependencies.

The point of this parcel is that every later parcel in an 18-parcel graph depends on an accurate picture of what exists today. A wrong inventory is worse than no inventory, because 17 downstream parcels will build against it.

## Decisions I expect you to surface, each with your recommendation

Every design decision is either (a) already locked by the charter — cite the D-number or exit item — or (b) surfaced as a numbered question with your recommended default. At minimum:

1. **The load-bearing one: what does exit criterion item 1 actually require of WF-P0?** The ratified text is: *"the current three-role path is mapped and remains a tested rollback path."* "Mapped" is clearly WF-P0's. **"Tested" may not be.** Read the exit criterion word for word and tell me which of these you believe is correct, with reasoning: (i) WF-P0 must itself produce an executable test that exercises the current three-role path, so the rollback path is proven from the start; (ii) WF-P0 maps and *specifies* the rollback test, which WF-P16 (observability and rollout operations, which owns "exercised rollback path") actually implements; or (iii) something else. Do not paper over this: per lesson #33, a criterion naming a produced artifact is not satisfied by a document describing one, and a spec can weaken a criterion while appearing to implement it. If your answer is (ii), the spec must say explicitly which parcel owns the test and must not claim exit item 1 is satisfied by WF-P0 alone.
2. **Docs-only, or docs plus read-only inventory tooling?** The loop directive permits "documentation paths plus, at most, read-only inventory tooling." A hand-written map rots the day it merges; a script that regenerates it is verifiable but is code, with tests and a dependency allowlist. Recommend one and state the cost. If you recommend tooling, say exactly what it reads and prove it cannot mutate.
3. **What "three-role" names, precisely.** `COORDINATOR-PATTERN.md`'s dispatch table lists five roles (coordinator, builder-standard, builder-architecture/risk, adversarial reviewer, shaping agent). The charter repeatedly says "the current three-role path." Identify the three, cite your evidence, and flag the discrepancy explicitly if the honest answer is that the current path has a different number of roles than the charter's phrase assumes. **Do not silently reconcile this** — it is exactly the kind of unexamined assumption WF-P0 exists to catch, and if the charter's phrase is wrong I need to know at shaping time, not at review.
4. **Inventory scope and its boundary.** Which packages, contracts, validators, receipts, permission profiles, routing-policy surfaces, and existing goals are in scope for the map, and which are deliberately excluded. Enumerate; do not write "all Foreman Line packages."
5. **Trust boundaries: what counts as one, and what evidence establishes it.** A boundary asserted in prose is not a boundary. State how each claimed boundary is evidenced (a permission profile, a validator, a CI check, a code path) and mark ones that are documentation-only as such. The permission-profile registry's session-start-load bound and its documented failure modes are directly relevant prior art — the reviewer envelope is *reduced, not eliminated*, and your map must not overstate it.
6. **Where the artifact lives, and its exact filename.** Recommend a path under `plugins/foreman-line/docs/`. Say whether it is versioned (the graph says "versioned map") and, if so, what versioning means for a document — a `version:` field, a schema, a digest, or something else.
7. **Authority inventory: whose authority, over what.** The parcel name says "topology **and authority** inventory." Distinguish the *goal-level* gate authority (Gates 1/2/3, which the charter already fixes) from the *runtime* authority a dispatched agent holds (write scope, network, shell). WF-P0 should map the second; the first is charter-locked and must only be cited, never re-decided.

## Boundary collisions — hunt them and write them into Out of Scope

WF-P0 does **not**: define role or envelope contracts (WF-P1); touch `plugins/foreman-line/routing-policy/` or extend the registry (WF-P2, and D4 makes routing-policy the sole registry authority); build any transport or invocation seam (WF-P3); implement any scope guard (WF-P4); bind anything at dispatch time (WF-P5); route anything (WF-P6); build a corpus (WF-P10); or exercise a rollback (WF-P16, subject to question 1). It touches no contract in `plugins/foreman-line/contracts/` and no validator surface. It makes **no provider call, incurs no spend, and reads no credential value** — credentials are referenced by name only (D5).

Also out of scope: the `foreman-kernel` and `hierarchical-coordination-sidecars` goals are separately owned (D7). WF-P0 may record that they exist and note any interface it would consume, but must not amend their files or claim their serialization points.

## Constraints your spec must carry

- The Verification Plan section must name its **adversarial-review focus questions** (WF-P0 is `architecture/risk`, so it will get **two independent frontier reviews**) and state the deterministic-pass environment: **PowerShell, `node -v` first**.
- The spec must tell the builder where to stand: named feature branch and worktree at `D:\Repos\agent-skills-worktrees\hwf-wf-p0-<yyyymmdd>`, isolated from `main`.
- `## Allowed Files` is mandatory, with exact repo-relative paths — no globs, no directory shorthand (§4.8).
- Out of Scope must be non-empty and specific.
- Acceptance Criteria must be checkable. For an inventory parcel the failure mode is criteria that read "the map is complete and accurate," which no reviewer can falsify. Prefer criteria that name the specific claims a reviewer can independently verify against disk, and state how a reader distinguishes a *verified* entry from an *asserted* one.
- If any acceptance criterion restates a charter exit item, quote the charter's wording verbatim rather than paraphrasing it.

## Output artifact

A spec at `plugins/foreman-line/docs/specs/active/WF-P0-topology-and-authority-inventory.md` (flag if you would name it differently), with frontmatter per `SPEC-CONVENTION.md` §4: `ticket: KONE-TBD`, `status: draft`, `owner: clinton.morgan`, `risk: critical`, `routing_class: architecture/risk`, `surfaces:` including the doc paths it writes. All required §4 body sections in order, non-empty Out of Scope, plus Verification Plan and Allowed Files.

Alongside it, output your **numbered open-questions list with recommendations** — questions 1–7 above plus anything you found. The coordinator rules on these; you do not resolve them silently.

## Then STOP

`status:` stays `draft`. You do not flip it to `active`, you do not write a kickstarter, you do not dispatch a builder, you do not commit outside your worktree's spec path, and you do not decide the shaping is done — the coordinator does. If shaping surfaces a problem with a ratified decision or the parcel graph, say so plainly and stop: that is a Gate 1 matter, not yours or the coordinator's to resolve.
