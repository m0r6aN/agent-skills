# Amendment 01 proposal — early second development machine

Status: **PROPOSED — NOT RATIFIED OR EXECUTABLE**  
Prepared: 2026-10-18  
Base: charter blob `69a2ee0822c1b4807680dbeb73b31a9217244f7a`, ratified by G1-001 in `gate-record.md`.

## Intent

Introduce a second qualified engineering machine as soon as existing gates permit, so independent ready work can run across machines. Do not advance live Pantheon federation or duplicate an implementation/inhabitant. No change to settled D1–D7, authority ownership, identity invariants or Protocol 0. Approval of this proposal does not grant remote writes, installation, credential access, provider spend or a copy exception.

## Exact proposed additional decision D17

> D17 — Qualify a second development machine early, independently of commissioning a second Pantheon runtime node. One coordinator owns dispatch and acceptance across both machines. Each dispatched parcel/review/test session has a distinct session identity, explicit device assignment, isolated branch/worktree, pinned spec/base/configuration, approved route/envelope and shared task-tree budget. An active session/incarnation, its credentials or live state must not be cloned or resumed concurrently on the other machine. Parallel work is permitted only where the approved dependency graph and exact mutation surfaces are disjoint, or where independent read-only review/test lanes use separately isolated snapshots. The approved remote for each owning repository and one approved Linear project provide shared visibility; neither Git nor Linear grants task/effect authority or overrides failed evidence. Second-device runtime membership/federation remains a separately commissioned successor increment.

Reason: engineering throughput does not require early federation, weakening exclusive identity or creating a second coordinator. Development agents remain governed by Foreman/harness rules; they are not automatically recognized members of a Pantheon runtime.

## Proposed new parcel

| ID | Owning track / deliverable | Risk / routing | Dependencies |
|---|---|---|---|
| PIN-P0D | Planning/development operations: qualify the second machine using the existing toolchain; document device/admin trust, repo/branch mapping, session/route support, environment parity, sanitized evidence transfer, shared budgets and exclusive task ownership; run an approved non-effectful checkout/build/test smoke check for each claimed supported work class. | elevated / architecture/risk; two independent frontier reviews | PIN-P0 and plan-review closure; named device, allowed paths, copy/disclosure authorization and remote/project scope before their dependent actions |

No new scheduler, custom sync service, distributed membership registry or two-master coordinator database. If setup needs implementation/configuration beyond one bounded parcel, stop and split via an approved amendment. Installation/network/remote mutations are not implicit in qualification.

PIN-P0D can proceed alongside PIN-P1 after PIN-P0, subject to their respective holds and grants. PIN-P1 does not depend on successful device qualification. PIN-P0D gates every assignment to machine B, not work provably confined to machine A. Qualification may be class-specific: e.g. documentation/review readiness does not imply .NET/container/VM fault-test readiness.

## Exact proposed scheduling replacement

Replace the charter paragraph beginning `Initial dispatch queue is serial` with:

> PIN-P0 precedes implementation. After PIN-P0, PIN-P0D may run alongside PIN-P1 on non-overlapping surfaces. The PIN-P1 → PIN-P2 → PIN-P3 → PIN-P4 → PIN-P5 → PIN-P6 → PIN-P7 → PIN-P8 → PIN-P9 implementation dependency chain remains unchanged unless a further explicit amendment proves an edge can be removed. Once PIN-P0D qualifies a work class on machine B, the coordinator may distribute independently ready parcels, fresh independent reviews, or isolated verification jobs across the two machines within their grants. A second machine does not waive dependencies or make a serial code chain parallel. Each implementation parcel retains one branch/worktree and one owning builder; one coordinator assigns and accepts work. Shared schema/policy/wiring files remain serialized, and each result records its machine and exact commit/configuration set. No session or mutable worktree is concurrently driven from both machines. Each risk row still requires two independent frontier adversarial reviews; the coordinator consumes results and performs closure checks/deterministic reruns, never substitutes its own judgment as independent verification.

The independent plan reviewer must examine whether P5/P6/P7/P8 can later build against frozen contracts in parallel with separate assembly/conformance gates. That is a review question, not an approved removal of current dependencies. Two machines alone do not establish reviewer/model-family independence.

## Proposed additional completion criterion C9

> C9. PIN-P0D records supported work classes and evidence on the named second machine, or an explicit owner-approved deferral amendment. Assignments are exclusive and reconciled by the single coordinator; pinned work crosses machines without sharing live authority/session state. Approved Git and Linear updates are traceable to the parcel and canonical evidence. Local/offline/unpublished, awaiting-sync and remotely published states remain distinct. Device qualification is not described as Pantheon runtime/federation readiness.

## Shared repository / Linear proposal

- **Repository:** each machine uses the same explicitly approved remote for each owning Keon repository; separate local clones/worktrees, one unique branch per parcel. This does not relocate all Keon components into a new monorepo. Pantheon's planning Git home still requires T9 disposition.
- **Ownership:** the coordinator assigns a unique attempt to exactly one device. No worker self-claims from a Linear status or stale local queue. Existing initiative-coordination state remains single-writer, not independently writable copied SQLite databases. Before any reassignment, reconcile the previous worker's state and stop/quarantine its task authority; unknown ownership blocks reassignment. A branch is not a lock.
- **Budget:** requests on both machines draw from the same approved task-tree ceiling through the existing approved reservation/accounting boundary. Do not give each machine the full ceiling independently. If global reservation cannot be enforced, serialize charged dispatch or stop; no new accounting authority.
- **Frequent updates:** propose canonical status updates at claim, Step 0, start, blocker, review-ready, verification, acceptance/merge and handoff; publish scoped coherent checkpoint commits after local checks and before cross-device handoff. During active work, propose a progress heartbeat at most 15 minutes apart through the coordinator. Heartbeats neither renew authority nor prove liveness. No empty-commit churn, force pushes, direct main pushes or unreviewed raw transcript/payload dumps.
- **Linear:** one named project; stable parcel/attempt IDs, dependencies, device assignment, blocker and evidence/commit links. Coordinator is the sole agent publisher of consolidated state. Machine B returns artifacts/status to it, not a competing acceptance board. A status change cannot dispatch, approve or mark evidence accepted.
- **Outage:** no new cross-device reassignment on stale ownership; preserve local evidence and report sync pending. No widening network/data/provider permissions to restore connectivity. Authority expiry/fence rules continue independently of Git/Linear availability; no automatic retry of uncertain remote mutations.
- **Transfer:** approved source/spec/test artifacts only, with hashes/commit references. No API keys, active credentials, private recovery keys, live memory/session checkpoints or provider-account files in Git/Linear. T1 artifact/copy semantics and T7 disclosure/retention still require explicit disposition; this proposal does not decide them.

## Proposed authorization changes — not grants

1. Keep mandatory plan-review SA4 separate; include this amendment only if explicitly approved before review, otherwise list it as pending input, not binding canon.
2. If SA1 is approved, propose extending its named scope from PIN-P0–PIN-P2 to **PIN-P0, PIN-P0D, PIN-P1 and PIN-P2**, with the **same USD 25 aggregate inference ceiling across both machines**, not a second allowance. Request approval for this exact extension, not presume it.
3. Approve remote/Linear publication only after exact remotes, project, permitted fields/branches, data classes and identity/scope are supplied. Push/PR/merge remain distinct actions; publication does not authorize merge, installation or runtime activation.
4. No Gate 3 change. All risk reviews, Step 0 gates, contract holds, protected-change review and green-chain requirements remain.

## Required owner disposition

- Approve/amend D17, PIN-P0D, scheduling replacement, C9 and the proposed authorization extension; no edits have been applied to the ratified charter.
- Identify machine B (OS and location/access method), trusted administrators and initial eligible work classes.
- Identify exact shared repository remote(s), the Pantheon planning home and Linear project. Confirm whether frequent publication may be authorized after a scoped preview; no credential values are needed in chat.
- Confirm artifact-copy boundaries T1 and approved transfer/disclosure classes. Preserve all other unresolved trust holds.

No second device was contacted, inspected or configured; no remote repository or Linear project was changed. The mandatory review must challenge new ownership/reassignment, budget, stale-state and privilege boundaries before dispatch.
