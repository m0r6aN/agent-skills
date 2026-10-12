# OPMEM — concrete unblock proposal for questions 5–12

**Recorded:** 2026-10-11  
**Coordinator:** Pi session `01a12a83-24d6-7641-b3ac-52563eeb86fb`  
**Authority:** owner directed `5-12: investigate and bring me a concrete proposal.`  
**Status:** HISTORICAL PROPOSAL; owner now disposed G5–G12 in `owner-rulings-g5-g12-2026-10-11.md`. Jira recommendation rejected; P0/Git/merge grants and G11/G12 approvals recorded there. Actual publication evidence is in `source-publication-2026-10-11.md`. Original proposed wording below is retained as history, not current authority.  
**Kind:** preparatory decision package; not independent plan review, coordinator lint, a P0 deliverable, an approval/route receipt, or deployed-readiness evidence

## Summary

Questions 1–4 are disposed in `owner-decisions-2026-10-11.md`: sole coordination restored to this session; human relay selected; upstream prerequisite planning only authorized; the exact USD 5 initial-review envelope conditionally approved. Do not ask for those approvals again unless a material condition changes. Delivery, route admission and independent review have not happened.

For questions 5–12, recommend: isolate and pin source evidence without modifying dirty checkouts; preserve the unversioned bridge as a scaffold/reference; select a personal Jira destination and commission only a narrowly reviewed registrar extension; request P0-only operational authority; keep merge human-owned absent effective-rule proof; name real contract/source maintainers; use isolated non-production Azure/Neon scope with existing Gateway dependencies accounted for; and protect AgentTask through one-parcel checkpoints and a three-machine pilot after controlled validation. None of these recommendations is implemented or silently ratified.

## Investigation scope and evidence limits

- Read local repository instructions, original OPMEM plan/advisory handoff, package/readme/runbook material, selected registrar/emitter source, and only the Cortex canon header for its edition discrepancy.
- Observe Git roots, HEADs, cached `origin/main`, ancestry counts, status and worktree metadata with optional Git locks disabled. No fetch, sync, clone, stash, reset, worktree creation or remote API call.
- Credential-bearing files, `.env` files, host auth/settings, databases, raw session logs/transcripts and desktop applications were not inspected. No service/daemon/WSL launch, cloud/Neon/tracker access, provider inference or suite.
- Installed executable paths for Node, PowerShell, Docker, Pi and WSL were discoverable on this workstation. This establishes neither working runtime versions nor running Docker/WSL, enrollment, cloud access or either Omarchy machine's availability. Referenced Keon instruction file requests RTK shell prefixing; RTK was not discoverable here and was not installed.
- Existing repository remotes identify GitHub provenance; account membership, maintainer authority, effective branch protection and supported/deployed release versions are not proved by local config.
- This package does not investigate/freeze service APIs, gravity math, numeric outbox/pilot thresholds or downstream exact manifests. Those are P0 outputs after its gates.

## Q5 — roots, supported revisions and existing-change owners

### Observed local evidence

Counts are `HEAD-only / cached-origin-main-only`, not network-refreshed truth.

| Logical root / local directory | Local HEAD | Cached `origin/main` | Ancestry / existing changes |
|---|---|---|---|
| agent-skills — `D:/Repos/agent-skills` | `0df276e6c7c440093ebc3f836372d8c2bc92ba9e` | same | 0 / 0; only untracked OPMEM planning/draft/handoff at intake |
| Cortex — `D:/Repos/keon-omega/keon-cortex` | `ba33bb9f7ebb1ff39a1420377feeca2c6ccccfd5` | `5f1a71ab3822260b51e6d70fbcfa0960a2db3959` | 0 / 102; five unstaged tracked worktree-path deletions |
| Gateway — `D:/Repos/keon-omega/keon-mcp-gateway` | `d6376fd024d43be7ff458af675c646ae93c52492` | `c03afe02707dc05a6e33d0c31cc53ca1002e59a0` | 2 / 2; staged+unstaged project metadata and GA initiative documents |
| Keon docs — `D:/Repos/keon-omega/keon-docs` | `ddcf3e6d0e4fd23569ce3a8528360cecd13b6fe5` | `74030096a63d15d3e46cb09dfbdc05fa27bb6952` | 0 / 84; dirty Runtime canon/capability registry, metadata/content and untracked material |
| Bridge — `D:/Repos/keon-cortex-mcp-bridge` | none | none | Own `.git` absent; Git root resolution fails |

Gateway merge base is `9916d6a0c8a019f8851be5b326bf6d11088d2ad0`; divergent tips must not be arbitrarily merged or reset. Remotes identify the expected Keon-Systems Cortex/Gateway/docs repositories, not authority to mutate them. Alternate Gateway checkout directory names exist; they were not selected as authoritative or inspected as replacement sources.

### Proposal G5

1. Accept the exact logical-to-local root map above for bounded planning reconnaissance, not as deployed release truth.
2. Use agent-skills `0df276e…` as the proposed P0 planning base. Before eventual branch/publish, separately authorized remote freshness reconciliation may require a reviewed rebase; stop if canon changes.
3. Ask the Cortex/Gateway/docs source owners to nominate supported immutable revisions. The three cached-origin hashes above are concrete comparison candidates, **not automatically approved bases**. Prefer a supported merged revision over stale local HEAD or dirty working files.
4. Request clean read-only source snapshots/exported worktrees at the approved hashes from the source owners. Do not update or clean their existing working trees. If owner-managed export is unavailable, return an exact isolated checkout/fetch proposal for approval before acting.
5. Treat every existing change as foreign/unowned by OPMEM until its owner is identified. In particular, leave Gateway GA work, docs canon/content work and Cortex worktree-path deletions alone.

**Ruling needed:** approve the planning root map and nominate the source maintainers/approved hashes or authorize obtaining their supported-base dispositions. No recovery or synchronization is included in G5.

## Q6 — bridge provenance and adoption

Evidence: bridge `README.md` says **contract-first internal dogfood scaffold** and calls its HTTP paths proposed/configurable; `pyproject.toml` identifies package `keon-cortex-mcp-bridge` 0.1.0, Python >=3.12, Proprietary, without a project upstream declaration. No tracked bridge-name match was found in the four inspected Git roots; this does not prove no upstream exists elsewhere.

The README's topology places the adapter downstream of Gateway, while ratified OPMEM D4/D5 puts the local delivery adapter upstream of Azure Gateway. It is a scaffold to evaluate, not an already-conforming client. P0 must reconcile this before P6; no README or code edit is made now.

**Proposal G6:** preserve the existing directory untouched and reference-only. Ask its creator/source owner for canonical upstream and ownership/license disposition. Preserve the approved narrative plan and advisory artifacts as provenance. If no upstream exists, bring back a separately approved, exact clean-repository/import proposal after P0 establishes reuse needs; do not initialize this directory. Exclude credentials, environment state and build output from any later import. Do not discard or recreate it implicitly.

**Ruling needed:** confirm reference-only treatment and identify the bridge source owner/upstream, or explicitly state that no canonical upstream exists so an adoption proposal can be shaped.

## Q7 — registration destination and process compatibility

Evidence:
- `registration/config/project-allowlist.json` permits only KONE.
- `registration/README.md` and `src/adapter-docker-mcp.ts` bind the production adapter to the existing corporate site selector.
- `src/payloads.ts` hardcodes Epic/Story IDs 11/7 and `customfield_14522` option 12817; the label/prefix gate is mechanical.
- `src/backfill.ts` changes only the ticket line. It does not promote status or rename the spec. SPEC-CONVENTION §2/§5 ticket-key filename and permalink/ref requirements still need a compatible approved lifecycle.

**Proposal G7:** select an owner-authorized **personal Jira project** as the least protocol-changing personal destination. Shape a separate reviewed registrar extension that covers site/project admission, real schema discovery, idempotency, preview-before-write, exact approval subject, ticket/file-ref lifecycle, SHA-permalink links and receipt chain. Merely changing the allowlist is insufficient. Keep the current KONE sandbox gate intact for existing consumers; no live write until new destination/schema/access are explicitly authorized and validated.

If no personal Jira destination is available, ask whether an explicitly authorized KONE test use is appropriate or commission a reviewed alternative tracking-contract proposal. GitHub Issues/Git-only is not silently substituted for the current Jira contract. Do not register personal work in KONE just because it is the only admitted project.

**Ruling needed:** tracker/site/project selection and authorized registrar owner. Only safe logical identifiers are needed here; authenticate through the approved connector, not by pasting secrets. G7 is a proposal to shape a prerequisite, not registrar implementation authorization or an OPMEM queue amendment.

## Q8 — bounded P0 operational authority

Evidence: original Stage A result contains exactly one P0 ref and `epics: []`; projection produces one Epic and one Story per ref, preserving the pristine input. Approval is human TTY + exact typed confirmation; it binds the tree and spec bytes. Conversation is not the W1 receipt. The emitter derives branch `feat/foreman-line-OPMEM-P0` from parcel `OPMEM-P0`.

**Proposal G8:** after independent plan review/triage, source dispositions and process compatibility close, request:
- Coordinator authority to reconcile the existing draft only through expressly approved amendments; preserve the original shaping handoff.
- A one-P0 projection with proposed explicit Epic title **Operator-developer Cortex memory — authority and contract baseline**. Expected new artifact: `plugins/foreman-line/docs/specs/active/operator-developer-cortex-memory-2026-10-10.projected.shaping-result.json`. Do not project P1–P10 into dispatchable Stories.
- Human execution of W1 approval over the final subject; exact approval/receipt output paths and registration mutation seams enumerated before their writes. Do not run even `show` blindly: approval README says it may create the projection if absent.
- Registration only through the selected admitted path and separate outward-facing authority.
- Conditional **P0-only Gate 2**, with named builder branch `feat/foreman-line-OPMEM-P0`, proposed worktree `D:/Repos/agent-skills-worktrees/opmem-p0-20261011`, `builder-architecture`, exact seven existing Allowed Files, admitted frontier route and own budget, and builder Step 0 restate-and-stop before work. Worktree creation belongs to the approved emitter; no precreation. Builder never gets registrar/config/source mutation authority.
- Two independently admitted frontier completion reviews with eligible independence on primary and fallback, evaluated against the actual builder and each other. The approved Fable→Opus initial-review fallback pair is **not** two completion-review seats.

The current emitter writes Claude settings; its README explicitly limits enforcement to sessions that load them and preserves shell residuals. P0 cannot claim Pi enforcement from the profile name. Upstream must provide the accepted Pi envelope/custody mechanism, including actual clean-state detection.

**Ruling needed:** approve the proposed Epic title and preparation/conditional-P0 authority envelope, then receive the concrete linted spec/kickstarter/output manifest before releasing dispatch. G8 is not granted by `investigate`. Gate 1 reopens only if a locked decision changes; W1 human approval remains human-only.

## Q9 — commits, publication and merge

**Proposal G9:** request authority for coordinator-owned, exact-path planning/spec/approval-registration paper-trail commits and approved parcel branch push/PR against agent-skills `main`. Preserve the original untracked inputs and unrelated work; no blanket staging, direct main commits, force-push or edits to dependency repositories. Registration's two-commit/push/link workflow must be included explicitly in the approved process manifest, not borrowed from builder authority. A separate process/registration branch should be named and linted before it is created; no branch is created in this investigation.

Keep **Gate 3 human-owned**. Only request delegated merge if effective remote rules at merge time identify the required distinct agent bypass identity; none was queried/proved here. Human-authenticated tooling or a chat delegation alone is not that proof. Every merge still waits for full green checks/reviews and exact-head evidence.

**Ruling needed:** scoped publishing authority and a human merge contact. The proposal does not grant it. Source-owner snapshots, human approval and registrar steps retain their own gates.

## Q10 — contract/canon/scoring authority

No CODEOWNERS file was present at the three conventional paths inspected in Cortex/Gateway/docs. That observation neither denies that maintainers exist nor makes OPMEM their owner. The header at docs `canon/keon_cortex_canon_v1_locked.json` declares locked **KEON-CORTEX-VERIFICATION-CANON-v2**, version 2.0.0 and v2 file name. Only the header was inspected for this proposal; its edition/source authority remains unresolved.

**Proposal G10:** ask Clinton to identify/confirm the maintainers empowered to approve Cortex canon/scoring, Gateway identity/protocol, and docs ratification. If Clinton holds those authorities, record that explicitly; otherwise receive their dispositions. P0 maps contradictory canon editions and supported code/tests, then returns exact amendment text/version/replay consequences plus proposed numeric limits. Preserve the four forces and old-version replay; no global numerical defaults are guessed here. Runtime/Collective contracts remain separately owned; their representations cannot be invented to fill missing source fields.

**Ruling needed:** accountable technical decision owners. Approval of operational coordination does not supply contract ratification or permission to author P0 contracts early.

## Q11 — non-production deployment and validation plan

Evidence: Gateway `DEPLOYMENT.md` mandates Cortex → `keon.control.website` including usage-event migrations → Gateway release order, persistent Cortex signing keys and actual composed boundary proof. Thus P8 needs a Control/metering owner/environment readiness disposition, not just Cortex/Gateway pods. The local `keon.control.website` directory was located by name only; it was not inspected or assigned to OPMEM.

A local Gateway staging workflow exists but its push trigger is `develop`, while its deploy job requires `github.ref == 'refs/heads/main'`. On the literal automatic push path these conditions do not align. This is a static workflow observation, not a live failure test or a repair grant. Require CI-owner reconciliation at the supported revision before claiming it is the usable staging path.

**Proposal G11:** a dedicated non-production operator tenant/profile on an owner-approved Azure Container Apps environment, with an isolated Neon branch/database appropriate to the approved Cortex storage contract; no production memory copy. Reuse healthy shared services only with their owners' scope/compatibility disposition. Gateway stays sole ingress; clients receive no Cortex/Neon credentials. Include persistent signing-key custody, Control usage-event/migration readiness, Runtime/governance dependencies, explicit role/machine grants, immutable image digests, rollback and independent end-to-end evidence. No existing environment/resource is assumed available from workflow names.

Before P8, produce a costed dry-run/readiness plan naming safe resource roles, region, dependency owners, data realm, write operations, backup/rollback and test access. Obtain separate Azure/Neon/credential/deployment authority. Do not execute the documented production script or its skip switches during planning.

**Ruling needed:** cloud operator and intended non-production environment/resource roles, plus authority to obtain their report-only readiness disposition. No credentials/connection strings in this packet. Actual cost/availability remains unmeasured; later cloud calls and writes require exact approval.

## Q12 — three-machine proving run and primary-delivery guardrails

Evidence: original plan D3/D18 and §8 require one Windows plus two Omarchy machines and fourteen days of attributable real work, after controlled no-skip gates. Neither Omarchy host was contacted. AgentTask has staged work and active worktree/goal records; those records are claims of ongoing coordination, not this session's live-worker verification. Do not borrow its model routes, spending, approvals or lifecycle exceptions.

**Proposal G12:**
- Name machines by safe aliases `windows-operator`, `omarchy-a`, `omarchy-b` in the eventual matrix, each with its own revocable machine credential and trusted tenant/role assignment; no MAC/IP identity. Owner confirms actual aliases/availability and applicable WSL/container contexts.
- Hold onboarding/installation until P8's admitted release and explicit access approval. Require controlled cross-machine positive/negative/outage cases in P9; only then start the fourteen-day P10 clock. No fixtures or elapsed waiting substitute for practical evidence.
- Keep AgentTask workspaces, staged files, keys, demo services and coordinator seats untouched. Proposed OPMEM concurrency is one parcel builder at a time, with bounded review sessions only when primary work has capacity; no busy polling or background retries.
- Suggested initial funding decision: **USD 25 aggregate P0 lifecycle ceiling**, including the already conditionally approved USD 5 plan review, leaving at most USD 20 for separately approved P0 builder/completion reviews/rework. This is a proposed pooled cap, not an existing policy-based grant, price quote or assurance the work fits it. If admitted tariffs/custody/accounting cannot enforce it, stop and request a concrete budget revision before dispatch. No P1–P10/provider/cloud funding is inferred.
- Checkpoint after the initial independent plan review and again after P0; report source/amendment gaps, effort/spend, source-owner waiting and delivery impact. Do not auto-expand into Cortex/platform repair. Pilot token/latency/capacity/usefulness thresholds remain P0's separately approved contract work.

**Ruling needed:** three-machine availability, primary-project deadlines/acceptable interference and the proposed P0 cap. A calendar can be planned only after those facts; no completion date or causal savings are promised.

## Ordered next actions and checks

This is the goal-specific planning/task index required by the Foreman project layout, not an implementation task list or external tracker registration. No unrelated `tasks/plan.md`/`tasks/todo.md` is overwritten and no ticket is fabricated.

| Action | Dependency | Acceptance / evidence | Mutation scope / verification |
|---|---|---|---|
| A1 — Human relay / upstream disposition | Owner-selected human relay | Confirm recipient/successor, actual delivery and supported-path/hold response; held response may include the authorized bounded prerequisite plan | Human relay of goal packet; coordinator persists actual return only. No upstream records/code mutated. |
| A2 — Owner rules G5–G7/G10 | This proposal; maintainer/tracker facts supplied | Exact planning roots, supported source nominations/change owners, bridge disposition and personal registration direction | Goal decision ledger only; source/tracker state remains unchanged. |
| Checkpoint 1 — Initial plan review | A1 plus exact candidate eligibility, custody and enforceable USD 5 envelope | Real independent findings and route/executed-identity evidence, followed by coordinator triage; any changed locked D gets human ratification | Accepted fresh read-only seat; coordinator-owned findings. No self-review, fixtures-as-review or model substitution. |
| A3 — Final P0 process/spec packet | A2 + Checkpoint 1 + approved tracking path | Linted exact spec, one-P0 tree, named process/output/branch/worktree authority, human approval and real registration chain; G8/G9 approvals actually recorded | Separate scoped coordinator process records; not builder execution. PowerShell deterministic checks with Node version first when authorized. |
| Checkpoint 2 — P0 release/acceptance | A3, admitted builder/dual-review routes and separately granted budget/Gate 2 | Step 0; seven-doc completion mapped to ACs; independent green chain before human Gate 3; no unclosed authority contradiction | Exact P0 seven files only; immutable source evidence; no production source work. |
| A4 — P8–P10 readiness preparation | Approved P0 conclusions; G11/G12 human inputs | Actual environment/owner/access/cost plan and three-machine availability; controlled gates before pilot | Later independently scoped planning/test/deployment parcels with separate approvals; no cloud/onboarding now. |

Stop on unknown ownership, an unapproved path/contract change, unsupported route, unaccounted spend, unavailable required human gate, scope expansion or primary-delivery conflict. No scheduling or retry loop is armed while these dependencies wait.

## Minimal inputs only the owner can supply

The investigation did not turn these into guessable facts:
1. Cortex/Gateway/docs maintainers or explicit confirmation of the owner's authority, plus bridge creator/upstream status.
2. Intended personal tracking site/project (or an explicitly appropriate alternative).
3. Cloud operator and safe non-production resource roles; never secret values.
4. Actual machine availability and primary-delivery deadlines/interference limits.

The concrete decisions G5–G12 above can be approved, amended or held independently. Approval of the proposal's planning mechanics does not bypass A1 or admit a different review route.

## Preservation and handoff

Original plan, Stage A validation, P0 draft and shaping JSON were read but not edited. Local-byte SHA-256 observations (ordinary preservation checks, not receipt hashes):
- Plan: `342315dae66b4d396c71db40f771dc03a49fbd60b5272587cdd4dcb1da479d68`.
- Stage A validation: `fdb7382de127958887006935b95c4fe1e08ba3e8cbbfed0268a70ae9b661eacf`.
- P0 draft: `2731d720bb5718f1fe8821917f2d53a2004db8912aca96df8789b354dc6d9062`.
- Original shaping result: `b178c9d498be1c63e30c483d293b1d374f822e5540817ac74d18485ac46e7aa1`.

No P0 deliverable or dependency source was produced/changed, no suites or independent verification executed. Agent-skills tracked HEAD remains `0df276e6c7c440093ebc3f836372d8c2bc92ba9e`; no staging/commit/push/PR, receipt, external registration, credentials, cloud/data operation, worker or wakeup. This proposal plus the authority record and administrative charter/directive/handoff updates are the only new work in this pass. Operational loop stops awaiting relay/upstream disposition and owner rulings, with sole coordination retained by this session.
