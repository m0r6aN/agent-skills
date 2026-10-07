# HCS-P0 — Verification record — 2026-09-26

**Goal:** `hierarchical-coordination-sidecars`
**Record:** HCS-P0 independent-verification arrangements (AC8) for
[`hcs-p0-authority-and-collision-map.md`](hcs-p0-authority-and-collision-map.md)
**Date:** 2026-09-26
**Authority receipt line:** coordinator decision 2026-09-26 under owner blanket authority
**Prepared by:** `HcsP0`, delegated builder slice (task/session id `HcsP0`)
**Rework 2026-09-26:** `HcsP0Rework` — post-review rework against both findings files;
finding dispositions in §9, locator corrections in map §9 (sample re-verified at C24)
**Binding contract:** [HCS-P0 shaped spec](../../specs/active/HCS-P0-authority-and-collision-reconnaissance.md)

> **Receipt character.** The authority receipt line is a coordinator decision under the
> owner's 2026-09-26 blanket authority — a coordinator decision receipt, **not** a human
> approval. Gate 3 (merge, release, spend, external effects) is human-owned and not
> delegated (authority basis: charter D7; owner blanket authority does not delegate
> Gate 3). **Coordinator acceptance, not the builder's claim, releases the gate.** This
> builder verifies nothing about its own claim: the two fresh frontier adversarial reviews
> scheduled below (§8) are the independent verification, and they are **pending**.

## 1. Environment and tool versions (C22)

| Item | Value | Command |
|---|---|---|
| Repository | `D:/Repos/agent-skills`, shared dirty registration tree | — |
| HEAD at observation | `305ecbf01a8b458a81a3ba5e04b4919e63281f94` | C1 |
| Shell | bash (Git for Windows / MSYS environment) | — |
| git | `git version 2.45.2.windows.1` | `git --version` |
| Node | `v24.7.0` | `node --version` |
| Spec lint runner | `npx tsx src/cli.ts` (spec-linter) | C20 |
| Observation date | 2026-09-26 (all [M] observations) | — |

## 2. Artifact digests

| Artifact | SHA-256 | Command |
|---|---|---|
| `source-proposed-amendment-A3.md` | `a5d9196c994d3215cd1966a234764174c1421f888d3cf68b901d31f07d221695` — **matches** the digest pinned in `charter.md` | C2 |
| FK `foreman-kernel/charter.md` (live) | `94d974b80dbc61066e0c135a710e5fe695654df298fd5e7b63696706ca3b6cb7` | C3 |
| `hcs-p0-authority-and-collision-map.md` (this slice's output) | `bccf9594ff6af44628806fb94c4770ccdd6ace6734e2646f536834bd78af28d0` (as first written) | `sha256sum` post-write |
| `hcs-p0-authority-and-collision-map.md` **post-review-rework (final)** | `f3c6bf604428571f49a762c4112a0a882c4d97441ab701498747166125cc2670` (supersedes the intermediate `b1ae2a0b…`, recorded during the rework pass) | `sha256sum` post-rework |
| `loop-directive.md` pre-update | `a80f827bc7fb6365573536a2cd9d4853d00fd0108231876f7ac16e6077510c40` | C18 |
| `loop-directive.md` post-update | `21ea644dc4b40d938aea7e461d92e22d57a9731ce067098414b077447698a246` | `sha256sum` post-edit |
| `loop-directive.md` **post-review-rework** (state line updated to `p0_reworked_post_review`) | `f3fbb129503bdbd815e90a1c40e5a2f67bb714fa4314e20dfc63121b68736f7d` | `sha256sum` post-rework (C25) |
| Spec `HCS-P0-authority-and-collision-reconnaissance.md` **post-F1-disposition** | `372d07d488ff36b229454a65fb3b84c5939b25b079a4d2c292b7b8c1afc846f1` | `sha256sum` post-edit |
| Source pins S3–S12 | `bd748566…` / `d628f98e…` / `13d8a20a…` / `5748c70d…` / `92f61629…` / `4e82276f…` / (loop-directive, above) / `46e54386…` / `7ac31500…` / `ed17361c…` (full values in C18 raw output and map §0) | C18 |
| Source pins S13–S18 (rework pass; review F2 + B-01/B-03 sources) | `fc24bae4…` / `81d85418…` / `b0246068…` / `e792c87b…` / `be66d6dd…` / `04292564…` (full values in C23 raw output and map §0) | C23 |
| `hcs-p0-verification.md` (this record) | computed by the coordinator/reviewer at acceptance time (a record cannot embed its own digest) | — |

## 3. Command log (exact commands, raw output, exit codes)

All commands run from `D:/Repos/agent-skills` on 2026-09-26. `cut -c1-N` display truncation
is noted where applied; the command itself is complete and repeatable. Paths in `sha256sum`
C18 output are relative to `plugins/foreman-line/docs/` as run.

### C1 — repository identity
```powershell
git rev-parse HEAD
```
```
305ecbf01a8b458a81a3ba5e04b4919e63281f94
```
exit `0`

### C2 — A3 digest pin check
```powershell
sha256sum plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/source-proposed-amendment-A3.md
```
```
a5d9196c994d3215cd1966a234764174c1421f888d3cf68b901d31f07d221695  plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/source-proposed-amendment-A3.md
```
exit `0` — identical to the digest pinned in the goal `charter.md` header. Source anchor holds.

### C3 — FK charter digest + line count
```powershell
sha256sum plugins/foreman-line/docs/goals/foreman-kernel/charter.md ; wc -l plugins/foreman-line/docs/goals/foreman-kernel/charter.md
```
```
94d974b80dbc61066e0c135a710e5fe695654df298fd5e7b63696706ca3b6cb7  plugins/foreman-line/docs/goals/foreman-kernel/charter.md
807 plugins/foreman-line/docs/goals/foreman-kernel/charter.md
```
exit `0`

### C4a/C4b — exact line count + trailing byte
```powershell
awk 'END{print NR}' plugins/foreman-line/docs/goals/foreman-kernel/charter.md ; tail -c 1 plugins/foreman-line/docs/goals/foreman-kernel/charter.md | xxd -p
```
```
807
0a
```
exit `0` — 807 newline-terminated lines, file ends with a newline. (Discrepancy vs Stage
Zero §3.3 row 1's "808 lines" recorded as contradiction X1 in map §7.3; digests identical.)

### C5 — FK charter section anchors
```powershell
grep -nE '^#{1,3} ' plugins/foreman-line/docs/goals/foreman-kernel/charter.md
```
```
1:# Foreman Kernel Development Charter
11:## Read this first
37:## 1. Objective
53:## 2. Problem statement
73:## 3. Authority hierarchy
88:## 4. Locked decisions
122:## 5. First-release architecture
135:### Common decision envelope
150:### Initial enforceable refusal classes
170:## 6. Parcel decomposition
176:### Wave 0  -  Authority and contracts
188:### Wave 1  -  Pure trust core
199:### Wave 2  -  Stateless read-only MCP and container
211:### Wave 3  -  Durable operational state
228:### Wave 4  -  Hook adapter and enforcement promotion
244:## 7. Explicitly not doing in this goal
262:## 8. Integration scenarios
295:## 9. Goal exit criterion
324:## 10. Human gates and standing authorizations requested
326:### Gate 1  -  charter ratification
333:### Gate 2  -  parcel dispatch
340:### Gate 3  -  merge
346:## 11. Stop conditions
374:## 12. Known serialization points and repo constraints
398:## 13. Gate 1 decision list
425:## 14. Ratified infrastructure adoption, 2026-09-07
435:### INF-1: Separate platform proof, development, and future execution
460:### INF-2: Scope storage and hosting decisions to their actual contracts
479:### INF-3: Measure workstation optimization without blanket exclusions
499:### INF-4: Prove verification independence and retain evidence
519:### INF-5: Reconcile A1 and measure both latency spans
549:### INF-6: Use a reproducible performance and cost baseline
577:### INF-7: Exhaustive corpus manifests; retrieval remains advisory
596:### INF-8: Demonstrate recovery and define measured revisit conditions
619:## 15. Dispatch readiness and operating sequence
621:### 15.1 Live-source reconciliation comes first
651:### 15.2 Gates and review
674:### 15.3 Per-parcel dispatch contract
710:### 15.4 Parallelism and serialization
726:### 15.5 Ready-to-use coordinator launch instruction
759:## 16. Completion accounting for the infrastructure requirements
781:## 17. Source record and ratification ledger
```
exit `0` — no `§4.1` heading exists; ratification ledger is `## 17` at line 781 (A3.8 re-anchor).

### C6 — §4 decision rows (raw; each row display-truncated at 100 chars)
```powershell
grep -nE '^\| D[0-9]+ ' plugins/foreman-line/docs/goals/foreman-kernel/charter.md
```
```
101:| D1 | This is a new goal, `foreman-kernel`, separate from `plugin-packaging-and-scaffolder`. | …
102:| D2 | Git remains authoritative for ratified charters, specs, policies, reviews, human-gate artifacts, …
103:| D3 | The kernel is divided into a provider-neutral trust core, a read-only MCP surface, …
104:| D4 | First release scope is: compiled constraints, pure evaluators, read-only Docker MCP, …
105:| D5 | There is no generic `mintReceipt` tool in the first release. …
106:| D6 | Receipt tools exposed in the first release are explicitly labeled structural. …
107:| D7 | One portable MCP contract is primary. Claude Code on the declared Windows/Docker Desktop matrix …
108:| D8 | Hooks begin in shadow mode. …
109:| D9 | Human authority is preserved: Gate 1 is nondelegable; …
110:| D10 | Exact `Allowed Files` is compiled from the spec body …
111:| D11 | A defect class is retired from the agent reading path only after: …
112:| D12 | Hooks are adapters, not policy engines. …
113:| D13 | Pre-action path checks are backed by post-action realpath-aware Git-diff detection and CI, …
114:| D14 | Operational state uses SQLite WAL with versioned transactional migrations, …
115:| D15 | The first container has no Jira, SCM, cloud, signing, Docker-socket, or other external-system credential. …
116:| D16 | Existing mixed functions are split before exposure: …
117:| D17 | Every public tool has a versioned input/output schema, …
118:| D18 | `authorizeAction` is a dedicated provider-neutral policy engine, …
119:| D19 | Public read APIs are content-only by default. …
120:| D20 | First-release enforcement is claimed only for Claude Code on Windows 11 with Docker Desktop …
```
exit `0` — exactly D1–D20, rows at lines 101–120; **no decision row after D20**.

### C7 — §13 Gate 1 decision list (raw, `sed -n '398,424p' | cat -n`)
```powershell
sed -n '398,424p' plugins/foreman-line/docs/goals/foreman-kernel/charter.md | cat -n
```
```
     1	## 13. Gate 1 decision list
     2	
     3	Ratifying this charter confirms:
     4	
     5	1. the authority split, authenticated control admission, and separate `foreman-kernel`
     6	   goal (D1–D3, D18);
     7	2. the bounded first-release scope and no-generic-mint boundary (D4–D6);
     8	3. portable MCP with the bounded D20 platform matrix, host-specific adapters,
     9	   enrollment detection, and shadow-first enforcement (D7–D8, D20);
    10	4. preserved human gates and evidence-derived human-gate state (D9);
    11	5. the Allowed-Files compiler and rule-retirement standard (D10–D13);
    12	6. durable field-authoritative SQLite state, local control capability, read-volume
    13	   isolation, and pure/effect separation (D14–D16);
    14	7. versioned typed tool contracts plus the read-confidentiality boundary (D17, D19);
    15	8. the FK-P0 through FK-P21 dependency graph and Wave 0–4 exit criteria;
    16	9. the explicit out-of-scope list and thirteen integration scenarios;
    17	10. standing Gate-2 dispatch authorization under the stated contingencies; and
    18	11. nondelegated human Gate 3 for every merge.
    19	
    20	**Gate 1 record:** Clinton Morgan explicitly ratified the original list and authorized
    21	the contingent Gate 2 dispatch grant on 2026-08-31, then explicitly re-ratified plan-review
    22	amendments R1–R13 and resumed Gate 2 on 2026-08-31. Parcel shaping and dispatch may now
    23	proceed in dependency order under the stated contingencies.
    24	
    25	
    26	---
    27	
```
exit `0` — file lines: item 1 at 402, item 7 at 411, items 8–11 at 412–415 (A3.7 insertion/renumber anchors).

### C8 — §11 stop conditions (raw, `sed -n '346,373p' | cat -n`)
```powershell
sed -n '346,373p' plugins/foreman-line/docs/goals/foreman-kernel/charter.md | cat -n
```
```
     1	## 11. Stop conditions
     2	
     3	The coordinator stops and reports if any of the following occurs:
     4	
     5	- Gate 1 is not explicit or a locked decision becomes ambiguous;
     6	- a fresh plan review changes a locked decision, parcel graph, or exit criterion without
     7	  scoped re-ratification;
     8	- an existing goal or parcel owns a required serialization point and no safe sequence is
     9  ratified;
    10	- implementation requires changing ratified Foreman stage contracts outside a named
    11	  contract amendment;
    12	- a parcel needs a file outside its exact Allowed Files;
    13	- exact path authority cannot be compiled without interpreting `surfaces:` as permission;
    14	- a hook or server design requires claiming complete mediation of arbitrary shell or
    15	  unsupported host behavior;
    16	- a proposed tool can manufacture human approval, independent-verifier evidence, merge
    17	  authorization, or closure authority;
    18	- a container requires Jira, SCM, cloud, signing, Docker-socket, or broad-host access;
    19	- a control request relies on self-asserted identity or a read-only client can discover or
    20	  call control tools;
    21	- a read-only request can select an arbitrary host path or access the state volume;
    22	- state migration would manufacture or infer a historical approval/authorization;
    23	- a security boundary cannot be closed inside its parcel;
    24	- the same tripwire or rework cap fires as defined by the parcel contract;
    25	- a reviewer or builder modifies the ambient dirty checkout or another goal's worktree;
    26	- a user-owned change collides with a required file; or
    27	- the queue is empty and the exit criterion is not fully evidenced.
    28	
```
exit `0` — final queue-empty item at file line 372 (A3.6 insertion anchor).

### C9 — §7 explicit deferrals (raw, `sed -n '244,261p' | cat -n`)
```powershell
sed -n '244,261p' plugins/foreman-line/docs/goals/foreman-kernel/charter.md | cat -n
```
```
     1	## 7. Explicitly not doing in this goal
     2	
     3	- generic or authoritative receipt minting;
     4	- Gate-1 approval, Gate-2 authorization, or Gate-3 merge through an agent-callable tool;
     5	- Git commit/push/PR/merge, Jira mutation, cloud mutation, deployment, publication, or
     6	  external communication;
     7	- trusted-key management or a signing service;
     8	- live source-control authentication of merge metadata;
     9	- cryptographic receipt-chain recomputation and stage-subject custody sufficient for
    10	  evidentiary closure;
    11	- Docker socket mounting or broad host filesystem mounts;
    12	- claiming universal enforcement across shells, subagents, custom tools, or unsupported
    13	  hosts; or
    14	- deleting the lessons/provenance record after a rule becomes mechanical.
    15	
    16	The receipt-custody and stage-specific append service becomes a separate follow-on goal
    17	after this kernel demonstrates evaluator, state, and enforcement boundaries safely.
    18	
```
exit `0` — closing paragraph at file lines 259–260 (A3.5 insertion anchor).

### C10 — §5 insertion point (raw, `sed -n '122,140p' | cat -n`)
```powershell
sed -n '122,140p' plugins/foreman-line/docs/goals/foreman-kernel/charter.md | cat -n
```
```
     1	## 5. First-release architecture
     2	
     3	| Component | Boundary and responsibility |
     4	|---|---|
     5	| Claude adapter and heartbeat | Normalize lifecycle events; call local admission; report enrollment |
     6	| Host-local admission | Bind capability to a mechanically distinct authenticated principal |
     7	| Authorization engine | Evaluate principal, repository, role, scope, gates, leases, revisions, and obligations |
     8	| Control MCP catalog | Admit bounded operational requests to the SQLite ledger |
     9	| SQLite ledger | Store operational transitions, leases, evidence references, and projection cursors |
    10	| Provider-neutral trust core | Supply deterministic evaluation to the read-only MCP catalog |
    11	| Read-only MCP catalog | Accept bounded content or admitted repository reads; no state-volume access |
    12	| Git canon and independent CI | Preserve ratified authority and independently controlled backstops |
    13	
    14	### Common decision envelope
    15	
    16	Every tool result follows one versioned shape with:
    17	
    18	- `apiVersion` and `toolVersion`;
    19	- `decision`: `ALLOW | REFUSE | ADVISORY | APPLIED | NOOP | CONFLICT | REQUIRE_HUMAN`;
```
exit `0` — `### Common decision envelope` at file line 135 (A3.4 insertion anchor).

### C11 — §17 ratification ledger (raw, `sed -n '781,807p' | cat -n`)
```powershell
sed -n '781,807p' plugins/foreman-line/docs/goals/foreman-kernel/charter.md | cat -n
```
```
     1	## 17. Source record and ratification ledger
     2	
     3	| Date | Record | Meaning |
     4	|---|---|---|
     5	| 2026-08-31 | "Ratify Gate 1 and authorize Gate 2 dispatches." | Original charter grant, as recorded in the recovered source |
     6	| 2026-08-31 | "Re-ratify Gate 1 amendments R1-R13 and resume Gate 2" | Amended FK-P0-FK-P21 graph and contingencies; original source uses an en dash in R1-R13 |
     7	| 2026-09-01 | A1 records "Ratified as written by Clint Morgan - 09/01/2026" | Historical A1 ratification record; live adoption and contradictory drafting text still need reconciliation |
     8	| 2026-09-07 | "Your recommendations are ratified, as written." | Eight ADR review recommendations in this conversation |
     9	| 2026-09-07 | "Nice work. Create the charter so we can dispatch agents to start development." | Authorization to prepare this concrete development charter |
    10	
    11	Original charter snapshot: uploaded 2026-08-31, SHA-256
    12	`a69b19d69106243a918b2b228b29b8a85d854c8966e3d578ed1036105c90cc84`.
    13	Original plan review: `plan-review-findings.md`, reviewed charter commit
    14	`c4bf00f6fde9058e1350898914e06f261ae38c93`, triage commit
    15	`a9a48b5656c3ce3837781c962a6ee00035d7f3c6`, re-ratification commit
    16	`26fb2b56e4861b6122a95f1d413394c0dcd3b4a1`, as recorded in the saved loop.
    17	These historical commit claims have not been verified against the Windows clone.
    18	
    19	Revised ADR source: `ADR-001-runtime-infrastructure-posture.md`, SHA-256
    20	`09821b3930e6c8fbbd6ed6520dede1b5b4494118c1b5ebf772712bc40226763f`.
    21	Recovered A1 source: commit `c654c0475e868c8cd1ff734fe7c30de43b7b3133`
    22	on `origin/temp/plugin-bump`.
    23	
    24	This artifact preserves the recovered baseline and provides a scoped development
    25	handoff. It has not changed the Windows repository, claimed its ownership, or
    26	dispatched an implementation agent. Preserve the original charter and later
    27	amendments until the live owner completes the documented reconciliation.
```
exit `0` — ledger rows at file lines 785–789; **no A3 row** (A3.8 unfilled).

### C12a — decision-ID re-sweep (FK goal dir)
```powershell
grep -rnE '\bD2[1-5]\b' plugins/foreman-line/docs/goals/foreman-kernel/ | cut -c1-160
```
```
plugins/foreman-line/docs/goals/foreman-kernel/charter.md:521:The recovered adjacent A1 text identifies D21, names FK-P1 and FK-P17, distinguishes
plugins/foreman-line/docs/goals/foreman-kernel/fk-reconciliation-2026-09-26.md:47:The recovered A1 text (row 5) "identifies D21, names FK-P1 and FK-P17, disting
plugins/foreman-line/docs/goals/foreman-kernel/fk-reconciliation-2026-09-26.md:57:2. **No decision ID is assigned here.** The recovered text's "D21" is not rati
```
exit `0` — only recovered-A1 "D21" references; **no FK decision row D21–D25**. D23–D25
reservation (A3) remains collision-free on this re-sweep. (HCS goal dir occurrences of
D21–D25 = 34 lines, all inside the A3 proposal/HCS records — expected proposal text. The
figure is now command-backed (review B-08): `grep -rnE '\bD2[1-5]\b'` over the four
pre-record files counts 23 (`source-proposed-amendment-A3.md`) + 7 (`hcs-stage-zero-2026-09-26.md`)
+ 3 (`gate-1-ratification-2026-09-26.md`) + 1 (`charter.md`) = 34; re-run at rework time
reproduces 1+3+7+23 = 34.)

### C13 — live FK goal dir listing
```powershell
ls plugins/foreman-line/docs/goals/foreman-kernel/
```
```
ADR-001-runtime-infrastructure-posture.md
charter.md
fk-p0-canon-authority-enforcement-registry.md
fk-p1-p21-dispatch-plan.md
fk-reconciliation-2026-09-26.md
```
exit `0` — **no `loop-directive.md`** in the live FK goal dir (Stage Zero §3.3 row 5 re-verified).

### C14 — FK worktree family (`git worktree list | grep -iE "foreman-kernel|fk-p0"`)
```
D:/Repos/agent-skills-worktrees/fk-p0-canon-authority-enforcement-registry                     0ee1657 [codex/fk-p0-canon-authority-enforcement-registry]
D:/Repos/agent-skills-worktrees/fk-p0-r10-contract-20260901                                    f3366be (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r10-coverage-20260901                                    f3366be (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r11-contract-20260901                                    9059bb2 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r11-coverage-security-20260901                           9059bb2 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r12-contract-20260901                                    0683bc0 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r12-coverage-security-20260901                           0683bc0 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r13-contract-20260901                                    df8155a (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r13-coverage-security-20260901                           df8155a (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r2-authority-20260831                                    08ebfc6 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r2-coverage-20260831                                     08ebfc6 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r3-authority-20260831                                    87237a8 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r3-coverage-20260831                                     87237a8 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r30-adoption-20260907                                    c35ff72 [codex/fk-p0-r30-adoption-20260907]
D:/Repos/agent-skills-worktrees/fk-p0-r31-source-adoption-20260907                             1747c1d [codex/fk-p0-r31-source-adoption-20260907]
D:/Repos/agent-skills-worktrees/fk-p0-r4-authority-20260831                                    f73a384 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r4-coverage-20260831                                     f73a384 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r5-contract-20260831                                     a61eb08 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r5-coverage-20260831                                     a61eb08 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r6-contract-20260831                                     6123474 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r6-coverage-20260831                                     6123474 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r7-contract-20260831                                     5d7ca99 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r7-coverage-20260831                                     5d7ca99 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r8-contract-20260831                                     84d5c7c (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r8-coverage-20260831                                     84d5c7c (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r9-contract-20260831                                     89d7e48 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-r9-coverage-20260831                                     89d7e48 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-recovery-20260907                                        0ee1657 [codex/fk-p0-recovery-20260907]
D:/Repos/agent-skills-worktrees/fk-p0-review-authority-20260831                                4666ea1 (detached HEAD)
D:/Repos/agent-skills-worktrees/fk-p0-review-coverage-20260831                                 4666ea1 (detached HEAD)
D:/Repos/agent-skills-worktrees/foreman-kernel-handoff-20260907                                fe31042 [handoff/foreman-kernel-live-20260907]
D:/Repos/agent-skills-worktrees/foreman-kernel-resume-20260908                                 947e6f1 [codex/foreman-kernel-resume-20260908]
D:/Repos/agent-skills-worktrees/foreman-kernel-stage0-20260830                                 d0e87ce [codex/foreman-kernel-stage0-20260830]
D:/Repos/agent-skills-worktrees/foreman-kernel-unattended-20260907                             865e16c [codex/foreman-kernel-unattended-20260907]
```
exit `0` (grep filter; `git worktree list` exit `0`).

### C15 — FK branch family
```powershell
git for-each-ref --format='%(refname:short) %(objectname:short)' 'refs/heads/codex/foreman-kernel*' 'refs/heads/codex/fk-p0*'
```
```
codex/fk-p0-canon-authority-enforcement-registry 0ee1657
codex/fk-p0-r30-adoption-20260907 c35ff72
codex/fk-p0-r31-source-adoption-20260907 1747c1d
codex/fk-p0-recovery-20260907 0ee1657
codex/fk-p0-rework6-unclaimed-20260903 b0518f8
codex/foreman-kernel-resume-20260908 947e6f1
codex/foreman-kernel-stage0-20260830 d0e87ce
codex/foreman-kernel-unattended-20260907 865e16c
```
exit `0` (read-only ref enumeration; no branch operation performed).

### C16 — tracked SQLite ledger presence
```powershell
git ls-files | grep -iE '\.(sqlite|db)$'
```
```
(no matches)
```
exit `1` (grep: no matches) — **no tracked SQLite operational-state database in the live
tree** (FK-P9 `unstarted`; consequence recorded at map SA2).

### C17/C17b — queue-mechanics and contested-surface searches
```powershell
grep -rniE "parcel loop|Stage-D/E|Stage 0|Stage-D" plugins/foreman-line/docs --include=*.md -l   # C17a (file list)
```
```
plugins/foreman-line/docs\COORDINATOR-PATTERN.md
plugins/foreman-line/docs\goals\foreman-kernel\fk-p0-canon-authority-enforcement-registry.md
plugins/foreman-line/docs\goals\foreman-ops-console\charter.md
plugins/foreman-line/docs\goals\hierarchical-coordination-sidecars\charter.md
plugins/foreman-line/docs\goals\hierarchical-coordination-sidecars\hcs-p0-authority-and-collision-map.md
plugins/foreman-line/docs\goals\hierarchical-coordination-sidecars\hcs-p0-verification.md
plugins/foreman-line/docs\goals\routing-currency-and-merit\charter.md
plugins/foreman-line/docs\goals\w4-closeout\e6-r1-plan-review-findings.md
plugins/foreman-line/docs\goals\w4-closeout\e6-r1-stage-e-pr-observation.md
plugins/foreman-line/docs\kickstarters\STANDING-CONSTRAINTS.md
plugins/foreman-line/docs\kickstarters\foreman-line-build-W3-P1.md
plugins/foreman-line/docs\kickstarters\foreman-line-build-W3-P4.md
plugins/foreman-line/docs\kickstarters\foreman-line-shaping-W4-P1.md
plugins/foreman-line/docs\specs\done\CLOSE-P1-minted-chain-exit-vehicle.md
plugins/foreman-line/docs\specs\done\E6-R1-current-repository-identity-and-evidence-rerun.md
plugins/foreman-line/docs\specs\done\SCAF-P3-receipt-chain-walker.md
plugins/foreman-line/docs\specs\done\W3-P1-verification-harness.md
plugins/foreman-line/docs\specs\done\W3-P2-adversarial-reviewer.md
plugins/foreman-line/docs\specs\done\W3-P3-pipeline-rework.md
plugins/foreman-line/docs\specs\done\W3-P4-human-gate-jira.md
plugins/foreman-line/docs\specs\done\W4-P0-correlation-lineage-fix.md
plugins/foreman-line/docs\specs\done\W4-P1-integration-stage-e.md
plugins/foreman-line/docs\specs\done\W4-P3-risk-driven-audit-triggers.md
```
exit `0` — 23 files at rework time (the original record's unprinted "20 hits" figure is
superseded by this listing, pasted per review B-08; `COORDINATOR-PATTERN.md` is among them).
```powershell
grep -nE "Stage Zero \(ideation\)|Per-parcel loop|Plan adversarial review|The long-running loop|work while there is work|11-step|GATE 2|GATE 3|first agent|only long-running" plugins/foreman-line/docs/COORDINATOR-PATTERN.md | cut -c1-180
```
```
7:The coordinator is the first agent a developer works with and the only long-running one. It carries a goal from concept to shipped, but it never produces verification of its own 
12:Stage Zero (ideation)          - coordinator + developer, mutual  → Goal Charter
14:Plan adversarial review        - fresh frontier session, ALWAYS   → findings + triage
16:Per-parcel loop (repeat)       - the proven 11-step loop           → merged parcel
17:   ├─ GATE 2: dispatch approval (delegable via standing authorization)
18:   └─ GATE 3: merge (delegable via standing authorization, green-chain contingent)
71:## The long-running loop
73:The coordinator runs as a self-pacing loop (`/goal` enters it after ratification): work while there is work, sleep on a long fallback while builders build (completion notificati
79:The per-parcel 11-step loop is canon in the coordinator carryover and is not duplicated here. Its non-negotiables: claims are verified on disk before acceptance (green checks ve
89:This charter generalizes: the Foreman Line coordinator carryover (role + 11-step loop), the 2026-07-15 loop directive (long-running mechanics, ownership, standing authorizations
```
exit `0`

```powershell
grep -rniE "own[s]? .{0,40}contracts|contracts.{0,30}own" plugins/foreman-line/docs/goals --include=*.md | cut -c1-190   # C17b
```
```
plugins/foreman-line/docs/goals\foreman-kernel\charter.md:101:| D1 | This is a new goal, `foreman-kernel`, separate from `plugin-packaging-and-scaffolder`. | The packaging/scaffolder goal ow
plugins/foreman-line/docs/goals\foreman-kernel\charter.md:476:**Carriers:** FK-P9 owns storage and backup contracts; FK-P14 owns deployment and
plugins/foreman-line/docs/goals\hybrid-routing-optimization\hro-p0-integration-contract.md:68:| **Settlement — owner: EXTERNAL (governed model fleet, Keon initiative)** | "receipt, envelop
plugins/foreman-line/docs/goals\hybrid-routing-optimization\hro-p0-integration-contract.md:104:Cross-goal external owner: **governed-model-fleet** (Keon repos) owns receipt/envelope/settleme
plugins/foreman-line/docs/goals\routing-currency-and-merit\charter.md:56:`governed-model-fleet` owns receipt, envelope, and settlement contracts (P0/P1 landed).
```
exit `0` — **reworked 2026-09-26 per review B-01 (the prior conclusion is withdrawn).**
The earlier text claimed "no owner-of-record named for `plugins/foreman-line/contracts/`"
— but this raw output itself contains three owner-claim rows naming `governed-model-fleet`
(external, Keon initiative) as owner of the receipt/envelope/settlement contract families
(`routing-currency-and-merit/charter.md:56`; `hro-p0-integration-contract.md:68,104`), and
the swept package carries exactly those families (`contracts/src/envelope.ts`,
`contracts/src/stages/a-intake.ts` … `f-closure.ts` — C26). Corrected conclusion: the sweep
names a **candidate owner** for the contract families; whether that external claim covers
the local `plugins/foreman-line/contracts/` package is **not established** by any swept row
[I], and a bounded single-pattern grep cannot establish "no live record" [I]. Map O7/SP10
now carry the named-candidate reconciliation; their `escalated-unresolved` verdict stands,
with the candidate owner named in the Owner cell.

### C18 — source pin digests (run from `plugins/foreman-line/docs/`)
```powershell
sha256sum goals/foreman-kernel/fk-reconciliation-2026-09-26.md goals/foreman-kernel/fk-p0-canon-authority-enforcement-registry.md goals/foreman-kernel/fk-p1-p21-dispatch-plan.md goals/hierarchical-coordination-sidecars/charter.md goals/hierarchical-coordination-sidecars/hcs-stage-zero-2026-09-26.md goals/hierarchical-coordination-sidecars/gate-1-ratification-2026-09-26.md goals/hierarchical-coordination-sidecars/loop-directive.md COORDINATOR-PATTERN.md SPEC-CONVENTION.md goals/goal-status-report-2026-09-26.md
```
```
bd7485663df7808c759d98744aca62e6e9b131ed9ff1d8c651c9478516b15b75  goals/foreman-kernel/fk-reconciliation-2026-09-26.md
d628f98edc57edd4291b7b32bcf2ae99847266608d4155f3cce421d0a50639a4  goals/foreman-kernel/fk-p0-canon-authority-enforcement-registry.md
13d8a20aa81153907cd529d9676b6483a531c0eb6a2d4fae15cb6a5b74f2ac92  goals/foreman-kernel/fk-p1-p21-dispatch-plan.md
5748c70d0e2a31e3284f8f59e0e87c6dfb5236b07925269ac49189f53e15653c  goals/hierarchical-coordination-sidecars/charter.md
92f6162957585b0c5193ccb78539c616184534d30e9bed551b741758eb9e6e7b  goals/hierarchical-coordination-sidecars/hcs-stage-zero-2026-09-26.md
4e82276fa362fc4f0b8512530f18540903b5750c8840788507e890d00bde65f4  goals/hierarchical-coordination-sidecars/gate-1-ratification-2026-09-26.md
a80f827bc7fb6365573536a2cd9d4853d00fd0108231876f7ac16e6077510c40  goals/hierarchical-coordination-sidecars/loop-directive.md
46e5438615e1a05bfb5b07abd177b26244548a7415e02ad7f1bb927ec95bf326  COORDINATOR-PATTERN.md
7ac315005cde6ad6def848b83de1d1b644e321c5d9f6434bc925deb6daba8703  SPEC-CONVENTION.md
ed17361c1e6b96506f832d27d4c3b01ff0499ea43b4fd3da60e2ad49a93b50fd  goals/goal-status-report-2026-09-26.md
```
exit `0` (the `loop-directive.md` value is the **pre-update** pin; see §2 for the post-update digest).

### C20 — spec-linter on the shaped spec
```powershell
cd plugins/foreman-line/spec-linter ; npx tsx src/cli.ts validate ../docs/specs/active/HCS-P0-authority-and-collision-reconnaissance.md
```
```
(no stdout)
spec-lint exit=0
```
exit `0` — the shaped spec validates; this slice did not edit the spec (frontmatter untouched).

### C21 — merged-package check
```powershell
ls plugins/foreman-line/ | grep -i authority
```
```
role-authority
```
exit `0` — no `authority-registry/` directory in the live tree (only `role-authority`);
the R31 package remains Gate-3-pending (map O3/K15).

### C22 — tool versions
```powershell
git --version ; node --version
```
```
git version 2.45.2.windows.1
v24.7.0
```
exit `0`

### C23a — rework-pass source pins (review F2: the three previously unpinned charters, plus the B-01/B-03 sources)
```powershell
sha256sum plugins/foreman-line/docs/goals/foreman-ops-console/charter.md plugins/foreman-line/docs/goals/plugin-packaging-and-scaffolder/charter.md plugins/foreman-line/docs/goals/foreman-line-boundary-routing/charter.md plugins/foreman-line/docs/goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md plugins/foreman-line/docs/goals/routing-currency-and-merit/charter.md plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p0-integration-contract.md plugins/foreman-line/docs/goals/routing-currency-and-merit/loop-directive.md
```
```
fc24bae4a80c23259567e1f54d7e8bc81dc190c859f65b365f44672f70ec5712  plugins/foreman-line/docs/goals/foreman-ops-console/charter.md
81d854189c2be9c817394862d1664d7f1d33bbb165a037332eff1ec2a2c89b6f  plugins/foreman-line/docs/goals/plugin-packaging-and-scaffolder/charter.md
b02460686c89453cb4ca812127384d9723db6c67935f5442340dd9ea416aa567  plugins/foreman-line/docs/goals/foreman-line-boundary-routing/charter.md
e792c87b913f6fc075d2cbb8aea3afcc555fa8b2b769c225919ff86cc327575d  plugins/foreman-line/docs/goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md
be66d6dd2db9f73c389e9c456b74271d1d69cde635c7ec5df65abefa42aa9948  plugins/foreman-line/docs/goals/routing-currency-and-merit/charter.md
042925645bfec8ab4b57bc26da6b9c50ad290805db9c293f9cc4333af9a3dba3  plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p0-integration-contract.md
7b97a6df957da42b4c516a2a31100dd2a1918933ca35894cc5bb1e5f78a9b95f  plugins/foreman-line/docs/goals/routing-currency-and-merit/loop-directive.md
```
exit `0` — pins recorded in map §0 (S13–S18; the RCM loop-directive is cited via S16's
corroborating note and pinned here).

### C23b — cited-line capture for the C23a sources (line-numbered, display width 170 by `substr` in the command)
```powershell
cd plugins/foreman-line/docs && awk 'NR==55||NR==92||NR==96{print FILENAME":"NR": "substr($0,1,170)}' goals/foreman-ops-console/charter.md && awk 'NR==98||NR==266{print FILENAME":"NR": "substr($0,1,170)}' goals/plugin-packaging-and-scaffolder/charter.md && awk 'NR==22||NR==23||NR==67{print FILENAME":"NR": "substr($0,1,170)}' goals/foreman-line-boundary-routing/charter.md && awk 'NR==29||NR==31||NR==40||NR==48||NR==54||NR==56||NR==58||NR==62||NR==85||NR==100||NR==104{print FILENAME":"NR": "substr($0,1,170)}' goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md && awk 'NR==51||NR==56||NR==58{print FILENAME":"NR": "substr($0,1,170)}' goals/routing-currency-and-merit/charter.md && awk 'NR==68||NR==104{print FILENAME":"NR": "substr($0,1,170)}' goals/hybrid-routing-optimization/hro-p0-integration-contract.md && awk 'NR==34||NR==36||NR==38{print FILENAME":"NR": "substr($0,1,170)}' goals/routing-currency-and-merit/loop-directive.md
```
```
goals/foreman-ops-console/charter.md:55: | D2 | Observer + gate UI only. The console writes nothing directly to `contracts/`, `docs/specs/`, `docs/receipts/`, or `docs/goals/`; every action it offers shells to a
goals/foreman-ops-console/charter.md:92: - Frozen W0 contracts (`plugins/foreman-line/contracts/`) — modification is a loop-stop.
goals/foreman-ops-console/charter.md:96: - Shipped packages as read-only inputs: `receipts/` (chain + `receiptPath` convention), `dispatch/` (routing-eval, approval-cli), `projection/` (import-mechanism preceden
goals/plugin-packaging-and-scaffolder/charter.md:98:   templates/                      # de-dogfooded canon the scaffolder copies
goals/plugin-packaging-and-scaffolder/charter.md:266: **P3 — De-dogfood canon into `templates/`.** Curated universal `STANDING-CONSTRAINTS.md`, empty
goals/foreman-line-boundary-routing/charter.md:22: | D3 | `foreman-config` owns the configuration document shape, validation, and capability vocabulary. The spec linter consumes it explicitly; dispatch consumes its identi
goals/foreman-line-boundary-routing/charter.md:23: | D4 | Role contracts and task/result envelopes are provider-neutral. Their TypeScript sources, committed JSON Schemas, generated artifacts, and full-population fixtures
goals/foreman-line-boundary-routing/charter.md:67: `templates/pi-openrouter-routing.json`; it contains the exact base URL and
goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md:29: RCM-side write set (RCM charter D14: "All governed logic — reader, resolver, validator,
goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md:31: and `plugins/foreman-line/dispatch/**` for RCM-P2+.
goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md:40: **Window P goes first — PMC-P1, then PMC-P2, in that order, on the exact PMC paths above.**
goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md:48: 2. **While Window P is open, RCM must not touch** any path on the PMC list — no create,
goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md:54: 3. **Second writer (Window R): RCM-P2+**, on `plugins/foreman-line/routing-policy/**` and
goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md:56:    **While Window R is open, PMC must not touch** `routing-policy/**` or `dispatch/**`.
goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md:58: 4. **No co-ownership at any time.** Per the PMC loop-directive cross-goal note, PMC-P1 and
goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md:62: 5. **Second-writer rule (draft § 4.4), binding on both sides:** whichever writer lands
goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md:85: **Window P releases back to RCM** — Window R opens — when **PMC-P2's Gate 3 merge has
goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md:100: Allowed Files and the branch diff at `codex/rcm-p1-builder` / `7faa46a`). It collides with
goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md:104: - RCM-P1's human Gate 3 merge of that **frozen** branch is **not** sequenced-blocked; it
goals/routing-currency-and-merit/charter.md:51: queue** as `awaiting_coordinator_claim`. Per INDEX's own update rule, a conflict between
goals/routing-currency-and-merit/charter.md:56: `governed-model-fleet` owns receipt, envelope, and settlement contracts (P0/P1 landed).
goals/routing-currency-and-merit/charter.md:58: not amend them. If both goals claim the same file, both stop until sequenced.
goals/hybrid-routing-optimization/hro-p0-integration-contract.md:68: | **Settlement — owner: EXTERNAL (governed model fleet, Keon initiative)** | "receipt, envelope, and settlement ownership" (`charter.md:25`); "`governed-model-fleet` owns
goals/hybrid-routing-optimization/hro-p0-integration-contract.md:104: Cross-goal external owner: **governed-model-fleet** (Keon repos) owns receipt/envelope/settlement contracts (`charter.md:25`; `docs/goals/routing-currency-and-merit/chart
goals/routing-currency-and-merit/loop-directive.md:34: **Updated 2026-09-26:** cross-goal serialization decided — see
goals/routing-currency-and-merit/loop-directive.md:36: here per its cross-goal requirement): **Window P** = PMC-P1 then PMC-P2 hold
goals/routing-currency-and-merit/loop-directive.md:38: `dispatch/**` window until Window P releases per that decision's release conditions
```
exit `0` — every line the reworked rows cite (map O7/O8, SP8/SP9, SP11, SP13–SP21) resolves
at its cited locator at the pinned bytes. Note: review B-07 cited boundary-routing D3 as
`:23` and D4 as `:24`; re-measurement puts D3 at `:22` and D4 at `:23` (map §9 rows 23–24).

### C24 — corrected-locator sample (review rework: ≥10 corrected locators re-resolved against the live tree)
```powershell
cd plugins/foreman-line/docs && awk 'NR==26||NR==72||NR==118||NR==210||NR==215||NR==229||NR==230 {print "fk-p0-canon-authority-enforcement-registry.md:"NR": "substr($0,1,110)}' goals/foreman-kernel/fk-p0-canon-authority-enforcement-registry.md && awk 'NR==79||NR==80||NR==82 {print "fk-reconciliation-2026-09-26.md:"NR": "substr($0,1,110)}' goals/foreman-kernel/fk-reconciliation-2026-09-26.md && awk 'NR==55||NR==69||NR==73 {print "COORDINATOR-PATTERN.md:"NR": "substr($0,1,110)}' COORDINATOR-PATTERN.md && awk 'NR==101||NR==380||NR==387||NR==611 {print "foreman-kernel/charter.md:"NR": "substr($0,1,110)}' goals/foreman-kernel/charter.md && awk 'NR==12||NR==41||NR==59||NR==65||NR==70 {print "loop-directive.md:"NR": "substr($0,1,110)}' goals/hierarchical-coordination-sidecars/loop-directive.md
```
```
fk-p0-canon-authority-enforcement-registry.md:26: | Gate 3 merge | Human-owned, not delegated | charter §10; D9 | Every merge is a human action; nothing in this
fk-p0-canon-authority-enforcement-registry.md:72: | Legacy routing/skill recorders | compatibility adapters over pure decisions | D16 | pure decision functions
fk-p0-canon-authority-enforcement-registry.md:118: | D13 pre-action checks backed by post-diff + CI; reviewer fail-closed on opaque shell | FK-P18 CI backstops +
fk-p0-canon-authority-enforcement-registry.md:210:   run 36 passed 751/751, zero failures; two fresh independent whole-change final reviews
fk-p0-canon-authority-enforcement-registry.md:215:   and the actual merge remain open; FK-P1 Stage A shaped but unimplemented.
fk-p0-canon-authority-enforcement-registry.md:229: | GD-2 | Edit only `docs/goals/foreman-kernel/`; touch no contested surface (`routing-policy/`, `dispatch/`, `
fk-p0-canon-authority-enforcement-registry.md:230: | GD-3 | Do not start FK-P1+; defer dispatch to the coordinator's next waves | Charter dependency order (FK-P1
fk-reconciliation-2026-09-26.md:79: - **Contested surfaces:** this slice edited only `docs/goals/foreman-kernel/`. Seams
fk-reconciliation-2026-09-26.md:80:   recorded, not edited: `routing-policy/`, `dispatch/`, `contracts/`, `templates/`
fk-reconciliation-2026-09-26.md:82:   authority + installability); FK-P3's routing/skill split and FK-P2's compiler inputs
COORDINATOR-PATTERN.md:55: Standing authorizations are written into the goal's loop directive verbatim, with their scope and their contin
COORDINATOR-PATTERN.md:69: Three dispatch mechanics rules, all earned: every dispatch - including rework - opens with a Step 0 restate-an
COORDINATOR-PATTERN.md:73: The coordinator runs as a self-pacing loop (`/goal` enters it after ratification): work while there is work, s
foreman-kernel/charter.md:101: | D1 | This is a new goal, `foreman-kernel`, separate from `plugin-packaging-and-scaffolder`. | The packaging/
foreman-kernel/charter.md:380: - Plugin manifests, marketplace metadata, root workflow files, shared package manifests,
foreman-kernel/charter.md:387:   Other parcels emit fragments/fixtures and do not edit those serialization points.
foreman-kernel/charter.md:611: Open a separately governed infrastructure evaluation when continuity, manual proof
loop-directive.md:12: > ambiguous, stop and report.
loop-directive.md:41: 1. Claim ownership in this block at a parcel boundary.
loop-directive.md:59: - Gate 2 is not granted.
loop-directive.md:65:   (`gate-1-ratification-2026-09-26.md`). Gate 2 remains not granted; Gate 3 remains not
loop-directive.md:70: Stop if the live Foreman Kernel owner is active on a required surface, the source anchor has
```
exit `0` — 21 lines covering 15 of the 24 corrected locators (map §9 rows 1–8, 9–12, 22–24
plus the loop-directive family rows 13–21): every sampled citation resolves at the corrected
line at the pinned bytes (`loop-directive.md` sampled against the post-review-rework file;
its line numbering below line 20 is unchanged by the state-line edit — C25).

### C25 — loop-directive state-line-only diff (review B-09: scope proof by hunk, not by digest)
```powershell
diff -u /tmp/loop-directive.pre-rework.md plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/loop-directive.md
```
```
--- /tmp/loop-directive.pre-rework.md
+++ plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/loop-directive.md
@@ -11,13 +11,13 @@
-**State:** `claimed; stage_zero_done; gate_1_recorded; p0_shaped; p0_records_produced` —
-next: two frontier adversarial reviews of the P0 records (`HCS-P0-AR-1` general +
-`HCS-P0-AR-2` security-focused, both pending coordinator dispatch per
-`hcs-p0-verification.md`), then P1 shaping (updated 2026-09-26; see
-`hcs-stage-zero-2026-09-26.md`, `gate-1-ratification-2026-09-26.md`,
-`hcs-p0-authority-and-collision-map.md`, `hcs-p0-verification.md`, and
-`../../specs/active/HCS-P0-authority-and-collision-reconnaissance.md`)
+**State:** `claimed; stage_zero_done; gate_1_recorded; p0_shaped; p0_records_produced;`
+`p0_reworked_post_review` — next: re-review (fresh adversarial re-review of the reworked P0
+records; both 2026-09-26 reviews — `hcs-p0-review-a-findings.md`,
+`hcs-p0-review-b-findings.md` — dispositioned in `hcs-p0-verification.md` §9), then P1
+shaping (updated 2026-09-26; see `hcs-stage-zero-2026-09-26.md`,
+`gate-1-ratification-2026-09-26.md`, `hcs-p0-authority-and-collision-map.md`,
+`hcs-p0-verification.md`, and `../../specs/active/HCS-P0-authority-and-collision-reconnaissance.md`)
```
```
1 file changed, 7 insertions(+), 7 deletions(-)
```
diff exit `1` (differences present) — the rework edit touches **only** the `**State:**`
block (lines 14–20, replaced 7↔7, file stat `7 insertions, 7 deletions`). This supersedes
the earlier digest-only scope claim for W3 (review B-09). For W3 itself the strongest
available evidence is recorded honestly: the pre-update bytes (`a80f827b…`) are
**unrecoverable in the shared tree** (review F7 — HEAD predates the claim block and the
working tree carries the post-W3 state), so a byte-level W3 hunk cannot be re-produced; the
scope claim for W3 rests on (i) review B-05's independent reconstruction ("W3 grew the
`**State:**` block (14–20) by 3 lines"), and (ii) C24's demonstration that every
loop-directive locator outside the state block resolves at the post-update numbering while
the pre-update numbering was exactly 3 lower below line 14.

### C26 — swept contracts package contents (B-01 reconciliation evidence)
```powershell
ls plugins/foreman-line/contracts/src/ plugins/foreman-line/contracts/src/stages/
```
```
plugins/foreman-line/contracts/src/:
correlation.ts
envelope.ts
generate.ts
index.ts
registry.ts
stages
testing.ts

plugins/foreman-line/contracts/src/stages/:
a-intake.ts
b-registration.ts
c-dispatch.ts
d-verification.ts
e-integration.ts
f-closure.ts
```
exit `0` — the package carries `envelope.ts` and the stage receipt contracts
(`a-intake.ts` … `f-closure.ts`), i.e. exactly the receipt/envelope/settlement families
C17b's owner-claim rows name.

## 4. Before/after repo status and allowed-path audit (C19)

The repository is the shared dirty registration tree (1207 `git status --porcelain` entries
before this slice; sibling builders are editing concurrently — see §5 attribution). No git
publication of any kind was performed (no add/commit/push/merge/branch/stash/reset).

```powershell
git status --porcelain > /tmp/hcs-p0-status-before.txt   # before this slice's writes
git status --porcelain > /tmp/hcs-p0-status-after.txt    # after  (incl. this record)
wc -l /tmp/hcs-p0-status-before.txt /tmp/hcs-p0-status-after.txt
diff /tmp/hcs-p0-status-before.txt /tmp/hcs-p0-status-after.txt
```
```
  1207 /tmp/hcs-p0-status-before.txt
  1239 /tmp/hcs-p0-status-after.txt
```
`diff` exit `1` (differences present); raw diff — **builder-attributed rows are marked**:
```
38a39,42
>  M plugins/foreman-line/approval/src/approval-record.ts            [sibling]
>  M plugins/foreman-line/approval/src/receipt-writer.ts             [sibling]
>  M plugins/foreman-line/approval/src/rejection-record.ts           [sibling]
>  M plugins/foreman-line/approval/src/resolve-input.ts              [sibling]
143a148,157
>  M plugins/foreman-line/integration/src/branch-protection.ts       [sibling]
>  M plugins/foreman-line/integration/src/closure-receipt.ts         [sibling]
>  M plugins/foreman-line/integration/src/closure.ts                 [sibling]
>  M plugins/foreman-line/integration/src/docspine-hook.ts           [sibling]
>  M plugins/foreman-line/integration/src/errors.ts                  [sibling]
>  M plugins/foreman-line/integration/src/exit-vehicle.ts            [sibling]
>  M plugins/foreman-line/integration/src/governing-spec.ts          [sibling]
>  M plugins/foreman-line/integration/src/pr-plan.ts                 [sibling]
>  M plugins/foreman-line/integration/src/receipt.ts                 [sibling]
>  M plugins/foreman-line/integration/src/report.ts                  [sibling]
144a159,166
>  M plugins/foreman-line/projection/src/write.ts                    [sibling]
>  M plugins/foreman-line/registration/src/backfill.ts               [sibling]
>  M plugins/foreman-line/registration/src/git.ts                    [sibling]
>  M plugins/foreman-line/registration/src/prior-registration.ts     [sibling]
>  M plugins/foreman-line/registration/src/register.ts               [sibling]
>  M plugins/foreman-line/registration/src/types.ts                  [sibling]
>  M plugins/foreman-line/registration/tests/project-key-plumbing.test.ts  [sibling]
>  M plugins/foreman-line/registration/tests/root-conflation.test.ts       [sibling]
148a171,174
>  M plugins/foreman-line/shaping/src/emit.ts                        [sibling]
>  M plugins/foreman-line/shaping/src/errors.ts                      [sibling]
>  M plugins/foreman-line/shaping/src/index.ts                       [sibling]
>  M plugins/foreman-line/shaping/src/read.ts                        [sibling]
149a176
>  M plugins/foreman-line/spec-linter/tests/cli.test.ts              [sibling]
150a178,180
>  M plugins/foreman-line/templates/AGENTS.md                        [sibling]
>  M plugins/foreman-line/templates/STANDING-CONSTRAINTS.md          [sibling]
>  M plugins/foreman-line/templates/foreman-config.yaml              [sibling]
1195a1226
> ?? plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md   [THIS BUILDER]
1205a1237
> ?? plugins/foreman-line/ops-console/                             [sibling]
```
Rows marked `[sibling]` are concurrent sibling-builder activity in the shared tree and are
**not** attributable to this slice; this slice neither wrote nor reverted them (rule:
unexpected repo changes are the user's/siblings'; adapt, don't touch).

```powershell
git status --porcelain -- plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/
```
```
 M plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/loop-directive.md
?? plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/gate-1-ratification-2026-09-26.md
?? plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md
?? plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/hcs-stage-zero-2026-09-26.md
```

**Allowed-path audit — this builder's writes (exhaustive):**

| Write | Path | Class | Authority |
|---|---|---|---|
| W1 | `…/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md` (created) | documentation record (.md) | spec Allowed Files |
| W2 | `…/hierarchical-coordination-sidecars/hcs-p0-verification.md` (created; this file) | documentation record (.md) | spec Allowed Files |
| W3 | `…/hierarchical-coordination-sidecars/loop-directive.md` (state line only, §14 area) | documentation record (.md) | **RATIFIED exact-path exception — F1 disposition, below** |

- **Zero code files touched.** Every write is a `.md` record; no plugin source, schema,
  test, manifest, lock, hook, receipt, kickstarter, spec, FK file, `routing-policy/`,
  `dispatch/`, `contracts/`, `templates/`, `foreman-config/`, `permission-profiles/`, or
  `spec-linter/` file was created or edited by this builder.
- `gate-1-ratification-2026-09-26.md` and `hcs-stage-zero-2026-09-26.md` appear as `??`
  untracked in the tree because the shared tree publishes nothing (no commits allowed);
  they were authored by earlier wave slices, not this one.
- The `loop-directive.md` ` M` status predates this slice (it was already modified by the
  Stage Zero claim write); W3 changed only the `**State:**` line. Scope evidence per review
  B-09 is the diff hunk, not the digest: the equivalent state-block-only hunk for the rework
  edit is recorded at C25 (`7 insertions(+), 7 deletions(-)`, `**State:**` block only); for
  W3 itself the pre-update bytes (`a80f827b…`) are unrecoverable in the shared tree (review
  F7), so the scope claim rests on review B-05's independent reconstruction (W3 grew the
  `**State:**` block (14–20) by 3 lines) plus C24's re-resolution of every non-state
  loop-directive locator at post-update numbering. The digest change `a80f827b…` →
  `21ea644d…` (§2) remains recorded as byte evidence, no longer as the scope proof.

### Named deviation D-1 (loop-directive state line) — RATIFIED 2026-09-26 (F1 disposition)

- **What:** one state-line update in `loop-directive.md` (`**State:**` block) recording
  `p0_records_produced` and the next step (adversarial reviews, then P1).
- **Tension:** the shaped spec's Forbidden Files list includes the goal's
  `loop-directive.md`; its Allowed Files section also records that the 2026-09-26 shaping
  wave's authorized outputs included "the `loop-directive.md` claim/state update".
- **Authority:** the owner's 2026-09-26 assignment for this slice explicitly directs
  "Update `loop-directive.md` state line (P0 records produced; next: adversarial reviews
  then P1)" and lists "loop state current" as an acceptance criterion. Owner direction
  supersedes the spec's forbidden-writes list for this one named line; the change is
  documentation state, not an FK or contested-surface write. Recorded here rather than
  absorbed silently; both citations above. No other line of `loop-directive.md` changed.
- **F1 disposition (recorded verbatim on coordinator direction; identical text is in the
  spec's Allowed Files note):**

> F1 disposition — coordinator decision 2026-09-26 under owner blanket authority: the
> `loop-directive.md` state-line update performed by the P0 slice is RATIFIED as an
> exact-path exception to the HCS-P0 spec's Forbidden Files. Basis: (a) the owner's
> dispatch directive explicitly instructed the state-line update ('Update
> loop-directive.md state line'), (b) the standing repo convention (docs/goals/INDEX.md
> update rule) requires loop state to stay current on every stop/closure, so the spec's
> blanket ban on loop-directive.md was over-strict. Ratified scope is EXACTLY the
> state-line/claim-block maintenance, nothing else. Record this disposition in the spec's
> Allowed Files note and in the verification record §4. No other out-of-Allowed-Files
> write is permitted.

D-1 is closed as a violation finding (review F1) by this disposition: the write stands,
its scope is exactly the state-line/claim-block maintenance (the 2026-09-26 rework state
update is inside that scope — C25), and no other out-of-Allowed-Files write exists in this
slice's audit.

### Final capture (after this record's write)

```powershell
git status --porcelain > /tmp/hcs-p0-status-final.txt ; wc -l /tmp/hcs-p0-status-final.txt
git status --porcelain -- plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/
git status --porcelain -- plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/ | grep -vE '\.md$'   # code-file check
```
```
1252 /tmp/hcs-p0-status-final.txt
 M plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/loop-directive.md
?? plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/gate-1-ratification-2026-09-26.md
?? plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md
?? plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/hcs-p0-verification.md
?? plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/hcs-stage-zero-2026-09-26.md
```
code-file check: **no matches**, exit `1` — **zero code files touched** (every path in this
goal dir is `.md`). Tree-wide count grew 1207 → 1252 across the slice window; the growth
beyond this builder's two `??` records is concurrent sibling activity (§4 attribution).
Post-write digest of the map record re-measured unchanged: `bccf9594ff6af44628806fb94c4770ccdd6ace6734e2646f536834bd78af28d0`.

### Rework write audit (2026-09-26, post-review rework — exhaustive)

| Write | Path | Class | Authority |
|---|---|---|---|
| W4 | `plugins/foreman-line/docs/specs/active/HCS-P0-authority-and-collision-reconnaissance.md` — Allowed Files note only (the F1 disposition, verbatim) | documentation record (.md) | **F1 disposition** (quoted above): "Record this disposition in the spec's Allowed Files note and in the verification record §4" |
| W5 | `…/hierarchical-coordination-sidecars/loop-directive.md` — `**State:**` block only (state line updated to `p0_reworked_post_review`; 7↔7 lines, C25) | documentation record (.md) | F1 ratified scope ("EXACTLY the state-line/claim-block maintenance") |
| W6 | `…/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md` (rework edits) | documentation record (.md) | spec Allowed Files |
| W7 | `…/hierarchical-coordination-sidecars/hcs-p0-verification.md` (rework edits; this file) | documentation record (.md) | spec Allowed Files |

- The rework slice touched **nothing else**: no FK file, no sibling-goal file, no
  `routing-policy/`, `dispatch/`, `contracts/`, `templates/`, `foreman-config/`, plugin
  source, schema, test, manifest, lock, hook, receipt, kickstarter, or other spec.
- Findings files (`hcs-p0-review-a-findings.md`, `hcs-p0-review-b-findings.md`) were read
  as the worklist and were **not** edited.
- No git operation of any kind was performed (the C25 scope proof uses plain `diff` on
  `/tmp` copies, not git).

## 5. Verification-time divergence check (spec Collision Risk clause)

The spec requires re-checking `authority-registry/` and the FK charter at verification time
and stopping on divergence beyond the Stage Zero §3.3 deltas. Re-measured 2026-09-26:

| Check | Result | Evidence |
|---|---|---|
| FK charter bytes vs Stage Zero's measured digest | **No divergence** — `94d974b8…` matches S7 §3.3 row 1 exactly | C3 |
| A3 bytes vs charter-pinned digest | **No divergence** — `a5d9196c…` | C2 |
| `authority-registry/` merged into the live tree? | **No** — absent (only `role-authority`) | C21 |
| Any source missing or renamed under its pinned path? | **No** — all S1–S12 read at their pinned paths | C2/C18 |
| Beyond-delta divergence | **None found.** The single discrepancy (X1: 807 vs "808 lines" at identical digest) is recorded, not harmonized (map §7.3) | C3/C4a/C4b |

## 6. AC-by-AC evidence mapping

| AC | Where satisfied | Key evidence |
|---|---|---|
| AC1 — Ownership map | map §1 (rows O1–O9) | S3 rows 1/3/16 (`:28,:30,:43`), `goal-status-report-2026-09-26.md:12,66`, C13–C15, C21, `foreman-ops-console/charter.md:55,92`, `plugin-packaging-and-scaffolder/charter.md:98,266`; unresolved rows recorded `escalated-unresolved` |
| AC2 — Kernel-contract map | map §2 (rows K1–K15) | `fk-p0-…-registry.md:36–74,102–138,201–223`; FK charter §4 (C6), §14 (C5); `fk-p1-p21-dispatch-plan.md` parcel rows |
| AC3 — State-authority map | map §3 (rows SA1–SA5) | FK D2/D9/D14 (`charter.md:102,109,114`), `fk-p0-…-registry.md:66–68,71`; C16 (no live ledger); Stage Zero §3.2/GD-3 lease disposition |
| AC4 — Queue-mechanics map | map §4 + gap list G1–G9 | `loop-directive.md:14–20,41–53` (post-update numbering), `COORDINATOR-PATTERN.md:7,11–19,63,69,73,79` (C17; corrected per map §9 rows 9–15); A3.2 role limits (S1); no target property claimed present |
| AC5 — Serialization-point inventory | map §5 (rows SP1–SP21; reworked per reviews B-02/B-03/B-07/F10) | `fk-p0-…-registry.md:46,47,50,66–68,71`; FK charter D2/D14 + §12/§15.4 (`charter.md:374–397,710–717`); SPEC-CONVENTION §2/§4.8/§8; COORDINATOR-PATTERN.md:69,73; the live PMC↔RCM one-writer order (S16 `:1–14,29–31,40–64,85–90,100–107`; RCM loop-directive `:34–42`); sibling-charter points (S13/S15/S17); contested-surface citations per O5–O9; C23b |
| AC6 — Exact A3 landing target | map §6 (rows A3.1–A3.8) | Re-anchored anchors quoted at measured locators (`charter.md:88,120,122,135,244,257,259,346,372,398,402,411,412,415,781`); measurement commands C5–C11; dispositions + preconditions (a)–(d); no FK file edited |
| AC7 — Evidence discipline | map §0 + §7 (7.1–7.4) + §9 locator correction log | Source pins C2/C3/C18/C23; labels: unlabeled rows are measured facts per the narrowed §7.1 rule (reviews F9/B-06); Stage Zero §3.3 rows 1–7 all re-verified (§7.2); contradiction ledger X1–X6 (§7.3); open questions Q1–Q5 preserved (§7.4); all wrong locators corrected (map §9 rows 1–24) and re-resolved (C24) |
| AC8 — Independent verification | **this record** §1–§9 | Commands C1–C26 with raw output + exit codes; digests §2; before/after status + allowed-path audit §4 (incl. F1 disposition + rework write audit); divergence check §5; remaining holds §7; review receipts + finding dispositions §8–§9 |

## 7. Remaining holds (documented; a blocked result is not a clean pass)

| # | Hold | Owner |
|---|---|---|
| H1 | **Both frontier adversarial reviews have run (§8) and all 20 findings are dispositioned (§9); the post-rework re-review is next** — the records are not verified until the reworked records are re-reviewed and the coordinator accepts | coordinator dispatches the re-review; reviewers produce receipts |
| H2 | Coordinator acceptance of the records releases HCS-P0 — not the builder's claim | coordinator |
| H3 | FK owner-of-record handoff remains open (map O1; Stage Zero §3.1(2a)) | FK side (human/coordinator) |
| H4 | Human FK Gate-3 merge of the R31 registry remains open (map O3/K15); the merged package wins on divergence | human (Gate 3) |
| H5 | Authority-wording tension X6 (spec "Gate 2 covers HCS-P0 only" vs loop-directive/gate-1 "Gate 2 is not granted") recorded `escalated-unresolved` | coordinator/owner |
| H6 | `contracts/` and `templates/` ownership recorded `escalated-unresolved` (map O7/O8) — `contracts/` now carries the **named candidate owner** `governed-model-fleet` (external; coverage of the local package unestablished, review B-01), `templates/` carries the scaffolder/boundary-routing overlap; a required write at either is stop-and-escalate | coordinator |
| H7 | A3 transcription preconditions (a)–(d) unmet; A3.8 additionally requires an exact developer ratification statement (map §6) | HCS-P7 + FK owner + developer |
| H8 | Q2 (where HCS implementation code lands) and A3's prove-out repository remain open (map §7.4) | HCS-P1/Gate 2 planning |

## 8. Independent verification — two frontier adversarial reviews (both run 2026-09-26)

Risk `critical` / routing class `architecture/risk` (spec frontmatter) required **two fresh**
frontier adversarial reviews of these records before coordinator acceptance. Both **ran on
2026-09-26** and produced the findings files below; their findings are dispositioned in §9
and the reworked records await a post-rework re-review. (COORDINATOR-PATTERN review routing:
two independent adversarial reviews for architecture/risk; reviewers report and triage,
they never fix or commit.)

### Review receipt 1 — `HCS-P0-AR-1` (general frontier adversarial review)

| Field | Value |
|---|---|
| Status | **RUN 2026-09-26 — COMPLETE** (was scheduled pending by this record); findings filed as `hcs-p0-review-a-findings.md` |
| Scope | Both records field-by-field against the five mandated reviewer focus questions (below) |
| Risk / routing | `critical` / `architecture/risk` |
| Session shape | Fresh frontier session, zero builder context, reviewer-mutates-nothing posture |
| Reviewer identity | Review A (fresh frontier adversarial review; wrote only `hcs-p0-review-a-findings.md`) |
| Session id / transcript | recorded by the coordinator's dispatch |
| Verdict + triage (fix / accept-as-documented / informational) | **REQUEST CHANGES** — 1 blocker (F1), 2 major (F2, F3), 5 minor (F4–F8), 3 nit (F9–F11). Triage: all 11 fixed in the 2026-09-26 rework (§9); no disputes |
| Receipt | `hcs-p0-review-a-findings.md` (the reviewer's receipt); rework disposition §9; **re-review pending** — coordinator acceptance of the reworked records releases the gate |

### Review receipt 2 — `HCS-P0-AR-2` (security-focused frontier adversarial review)

| Field | Value |
|---|---|
| Status | **RUN 2026-09-26 — COMPLETE** (was scheduled pending by this record); findings filed as `hcs-p0-review-b-findings.md` |
| Scope | Evidence leakage and source safety specifically: (i) no credential/secret value read, emitted, hashed, or retained in either record (forbidden reads were not touched — map §0); (ii) source-pin integrity (digests bind claims to bytes — §2/C2/C3/C18); (iii) no citation or wording that could be read as authorizing an FK edit, a merge/release/spend, or the FK-P10 lease decision (map §8 "Not an FK authority change…"); (iv) raw outputs in this record contain no secret-bearing URL, token, or host-internal credential; (v) the loop-directive deviation D-1 is honestly bounded |
| Risk / routing | `critical` / `architecture/risk` |
| Session shape | Fresh frontier session, zero builder context, reviewer-mutates-nothing posture |
| Reviewer identity | `HCS-P0-AR-B` (independent slice; wrote only `hcs-p0-review-b-findings.md`) |
| Session id / transcript | recorded by the coordinator's dispatch |
| Verdict + triage | **REQUEST CHANGES** — 0 blocker, 4 major (B-01–B-04), 3 minor (B-05–B-07), 2 nit (B-08, B-09). Triage: all 9 fixed in the 2026-09-26 rework (§9); no disputes. Security scope items (i)–(v) reported clean ("no unearned Allowed-Files claim found") |
| Receipt | `hcs-p0-review-b-findings.md` (the reviewer's receipt); rework disposition §9; **re-review pending** — coordinator acceptance of the reworked records releases the gate |

### Mandated reviewer focus questions (spec Verification Plan — assess each field-by-field)

1. Does the landing-target table (map §6) survive the FK charter's 435-line → 807/808-line
   drift, or does any row quote A3's 2026-09-03 anchors as if they were current? (Every row
   quotes a re-measured locator from C5–C11; A3's stale anchors appear only in the
   contradiction ledger X1–X5 as stale.)
2. Does any seam row silently assume the R31 `authority-registry/` package or the FK-P10
   lease engine is merged and live? (Map rows O3/K8/K15 mark them `Gate-3-pending` /
   `unstarted`; C21 proves absence live; SA2/SA3 state the fail-closed consequence.)
3. Is every map row's verdict backed by a re-measured source, and are dated observations,
   measured facts, and inferences labeled distinctly enough that none can be mistaken for
   another? (Label vocabulary map §7.1; [I] appears only at X1/X6.)
4. Could any wording in the map or verification record be read as authorizing an FK edit, a
   merge, or the FK-P10 lease decision? (Map §6 "No FK file is edited by this record";
   map §8 gate table; §3.2 lease question explicitly not decided; D-1 is bounded to one
   state line.)
5. Does the queue-mechanics map (AC4) avoid presenting the A3 D24 target properties as
   already achieved? (Map §4 states "no target property is present today"; G1–G9 are all
   `unstarted`.)

**Gate statement.** Coordinator acceptance, not the builder's claim, releases the gate. This
record is complete as a builder deliverable; the gate is **not** released.

## 9. Review-finding disposition table (rework 2026-09-26)

Every finding from both adversarial reviews is dispositioned below. All fixes carry evidence
at re-verified locators (map §9 correction log rows 1–24; re-resolution sample C24). **No
finding is disputed.** Rework writes are audited in §4 (W4–W7).

| ID | Sev | Disposition | Fix / evidence |
|---|---|---|---|
| F1 | blocker | **FIXED (coordinator disposition)** | F1 disposition recorded **verbatim** in the spec's Allowed Files note and in §4 above; W3 ratified as exact-path exception for state-line/claim-block maintenance only; no other out-of-Allowed-Files write exists (§4 audit W1–W7) |
| F2 | major | **FIXED** | Three charters pinned in map §0 (S13 `fc24bae4…`, S14 `81d85418…`, S15 `b0246068…`) with one recorded command + raw output covering the cited lines (C23a/C23b); map §7.1 "every source pinned" now true as written |
| F3 | major | **FIXED** | Six wrong registry locators corrected (`:215`, `:209–210`, `:118`, `:72`, `:229`, `:26`, GD-3 `:230`) — map §9 rows 1–7; re-resolved at C24 |
| F4 | minor | **FIXED** | O5/SP8 seam quote re-anchored `:66–68` → `:79–83` (quote at `:80–82`) — map §9 row 8; C24 |
| F5 | minor | **FIXED** | COORDINATOR-PATTERN locators re-anchored `:53`→`:55`, `:67`→`:69`, `:75`→`:73` — map §9 rows 9–11; C24 |
| F6 | minor | **FIXED** | INF-8 contention re-anchored `charter.md:605–607` → `:611–614` — map §9 row 12; C24 |
| F7 | minor | **FIXED** | All loop-directive citations re-anchored to post-update numbering (`:41–53`, `:14–20`, `:50–53`, `:59`, `:65–66`, `:5–20`, `:3,11–12,70–72`, `:70–72`, S9 pin convention) — map §9 rows 13–21; S9 now records the pre-update bytes as unrecoverable (§4 + C25) |
| F8 | minor | **FIXED** | S2 status now describes both uncommitted edit sites and quotes S3's wording (`fk-reconciliation-2026-09-26.md:20–21`) — map §0 S2 row |
| F9 | nit | **FIXED** | Map label claim narrowed: labels carried where shown; unlabeled rows are measured facts citing their locator — map header + §7.1 |
| F10 | nit | **FIXED** | AC5 exhaustiveness claim bounded to the swept record set; the §12 list is now inventoried (SP13–SP16) rather than omitted — map §5 header + rows |
| F11 | nit | **FIXED** | O9 relabeled D1 (`charter.md:101`; D2 at `:102`) — map §9 row 22 |
| B-01 | major | **FIXED** | `contracts/` owner negative withdrawn as over-claim; C17b conclusion rewritten (§3 C17b); O7/SP10 restate the named candidate owner `governed-model-fleet` (external) with the coverage reconciliation and the C26 package-family evidence |
| B-02 | major | **FIXED** | AC5 extended with FK charter §12 file family (SP13, `charter.md:380–382`), §12/§15.4 parcel-owned points (SP14, `:383–387` + dispatch plan `:33–47`), §15.4 shared exports/lockfiles/migrations/manifests (SP15, `:710–717`), ambient user-owned `routing-policy.yaml` (SP16, `:376–378`) |
| B-03 | major | **FIXED** | SP8/SP9 rewritten with the live BINDING one-writer order (Window P → Window R, no co-ownership, second-writer rebase + full-suite re-run, release conditions) citing S16 measured lines and the RCM loop-directive 2026-09-26 note (`routing-currency-and-merit/loop-directive.md:34–42`); SP17 (file-disjoint `routing-policy/tests/`) and SP18 (`host-owner-export/` digest freeze) added; SP9 carries the boundary item-4 dispatch-path slot (`items-1-2-status-2026-09-26.md:244–246`) with the recorded note that no literal "single-writer slot" phrase exists in-tree |
| B-04 | major | **FIXED** | All nine mis-anchored citations corrected (map §9 rows 1–12); every locator re-measured at pinned bytes before the fix |
| B-05 | minor | **FIXED** | Loop-directive locators re-measured against the delivered bytes (same corrections as F7); S9 pin records both numbering schemes and the unrecoverable pre-update pin |
| B-06 | minor | **FIXED** | Same as F9 (map:27 claim narrowed; default class stated) |
| B-07 | minor | **FIXED** | SP19 (`docs/goals/INDEX.md` stop-and-reconcile, `routing-currency-and-merit/charter.md:49–54`), SP20 (`foreman-config` shape owner, boundary-routing D3 `:22`), SP21 (D4 parity family `:23`) added; D4's cross-file parity constraint is a named row |
| B-08 | nit | **FIXED** | C17a raw listing pasted (23 files at rework time; "20 hits" figure superseded); C12a's 34-line figure now command-backed with the 1+3+7+23 derivation |
| B-09 | nit | **FIXED** | W3 scope proof moved from digest to hunk: C25 records the state-block-only diff (7↔7 lines) for the rework edit; for W3 the unrecoverable pre-update bytes are recorded honestly with the strongest available reconstruction (§4, C25) |

**Inter-review note (not a dispute):** F4 cited the reconciliation seam quote as `:79–83`
and B-04 as `:80–82`; both re-measured — the §3 bullet spans `:79–83`, the quoted sentence
`:80–82` — and the map cites the bullet range with the quote span inline (map §9 row 8).
Review B-07's own cited lines for boundary-routing D3/D4 (`:23`/`:24`) re-measure to
`:22`/`:23` (map §9 row 23); the reworked rows cite the measured lines.
