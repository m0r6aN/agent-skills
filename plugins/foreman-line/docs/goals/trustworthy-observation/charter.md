# Goal Charter — Trustworthy Foreman Observation

**Goal slug:** `trustworthy-observation`
**Created:** 2026-10-10
**Owner:** Clinton Morgan
**Status:** RATIFIED 2026-10-10 — D1–D8 and TO-P0–TO-P7 approved; owner amendment A1 below applies
**Coordinator:** Codex `/root`, this conversation; plan review next
**Mode:** repo-local, sequential parcels
**Planning branch:** `docs/foreman-trustworthy-observation`
**Planning base:** `2f7fc9a4ddd479dc2b2282b57d63fbc5025f837d` (FCA-P0/P1)

## Objective

Make the existing Foreman Ops Console reliable enough to monitor the subsequent
operator-experience goal. Correct misleading approval presentation, contain
malformed evidence, align console/CLI chain membership, resolve documents to
their actual repositories, ground existing remediation commands, and prevent
stale or cross-goal refresh results from masquerading as current observations.

The operator is Clinton. Success means the existing board and terminal handoffs
describe their evidence and limitations accurately. This goal does not claim to
prove worker liveness or eliminate false hung classifications.

## Intake and prior agreement

The owner agreed to the analysis and execution order, then directed shaping this
first goal. That authorizes these planning artifacts, not ratification of their
new technical decisions. The larger roadmap remains three goals: trustworthy
observation; operator experience; operational integration.

The capability boundary is observation correctness. Its independently verifiable
parcels and order are below; dispatchable module specs follow Gate 1 and mandatory
plan-review triage. This charter is the proposed scope map and decision packet.

## Locked decisions

D1–D8 and the parcel graph were ratified 2026-10-10. Amendment A1 supersedes
the original human-owned merge/publication language below and applies across
the three-goal roadmap. Historical proposal text remains traceable in git.

| ID | Decision | Reasoning |
| --- | --- | --- |
| D1 | Scope is TO-P0–TO-P7 below. Retain the existing board and dependency-free UI. Decision inbox, UI redesign, kernel/queue integration, worker heartbeats, spend, and routing modernization belong to later goals. | Repair confidence before expanding capability. |
| D2 | Retain observer posture, loopback binding, the closed action registry, present-only human gates, and the two console-local writable files. No new route, gate record, approval capture, or stored workflow status. | Correct observation without creating a second coordinator. |
| D3 | TO-P0 delivers an explicit, documentation-only companion amendment before affected implementation. Its exact ratification-reading and locator rules must be reviewed against FOC-P0 and FCA-P0/P1. No implementation silently reinterprets a frozen contract. R1–R5 state vocabulary and precedence remain unchanged. | The legacy ratification rule and alias-as-locator convention require reconciliation; historical contracts remain traceable. |
| D4 | Ratification presentation consumes explicit current evidence, not incidental positive words. Negative, quoted, instructional, historical, or superseded text cannot establish a current grant. Unsupported or conflicting evidence is unknown with a diagnostic. Evidence remains a read-only proxy, never authenticated authority. | Prevent false grants without claiming a new approval engine. TO-P0 defines supported dialects, supersession, and reference-resolution bounds. |
| D5 | Console and receipts CLI use one receipts-owned chain-membership definition, preserving member order and validation invariants. Malformed members remain visible as invalid; one damaged chain must not prevent unrelated goals from loading. | Sidecars are not chain members, and invalid evidence must be observable. Structural validity is not cryptographic verification. |
| D6 | Repository identity and document location are separate. Goal aliases select trees; document locators are actual relative paths within their configured root. Commands bind the correct root, workflow, and approval artifact slug; unsupported commands are withheld with an explanation. | A plausible link or command pointing at the wrong source is an operational defect. Shell quoting is explicit for supported shells. |
| D7 | Refresh all related views as one client refresh generation; only the current goal/generation may update the UI. Show last successful observation and partial failures; preserve selection. This is client consistency, not a transactional filesystem snapshot. | Correct stale counts and races without importing an indexing service. |
| D8 | One coordinator, one active builder, sequential parcel merges. Fresh shaping/build/review sessions; dual independent reviews for architecture/risk parcels. Monitor through direct artifacts and CLI until exit. Linux is the primary validation host for this goal; platform-sensitive commands require an explicit shell matrix and unsupported rows remain named. | Preserve independent evidence while minimizing coordination overhead. This goal does not inherit historical PowerShell-only authorization from another goal. |

## Parcel graph and acceptance outcomes

Risk and routing entries are ratified, subject to A1 worker preference. Exact Allowed
Files and branch/worktree assignments land in shaped specs, never inferred here.

| Parcel | Outcome and acceptance | Dependency | Risk / routing |
| --- | --- | --- | --- |
| TO-P0 — Observation contract amendment | Documentation-only companion amendment defines negative/conflicting ratification, bounded evidence references, actual-root locators, malformed-evidence isolation, chain membership, and client freshness. Inventory affected consumers and live-goal collisions. Every change maps to an old clause and a positive/negative scenario; unsupported cases are explicit. | none | critical / architecture/risk |
| TO-P1 — Ratification reader | Negated/quoted/historical grant words never grant. Explicit supported current records render evidence; conflicting or unsupported records render unknown. Existing real ratification records form a compatibility corpus; no record is rewritten to fit the parser. | TO-P0 | critical / architecture/risk |
| TO-P2 — Malformed chain containment | JSON null, primitives, arrays, malformed objects, unreadable members, and mid-read disappearance produce invalid evidence diagnostics. Unrelated projection remains usable, and the API contains failures. | TO-P1 | elevated / architecture/risk |
| TO-P3 — Chain membership parity | Console and CLI agree on the same directory containing members and sidecars; invalid members remain invalid. Preserve per-file validation, ordering, gaps, linkage, and correlation checks. | TO-P2 | elevated / architecture/risk |
| TO-P4 — Repository document references | Primary/plugin-native, extra repo-native, and initiative-tree references resolve to the actual configured root and relative path. Unknown roots/path escapes refuse. Alias labels are never fabricated path components. | TO-P3 | elevated / architecture/risk |
| TO-P5 — Valid remediation handoffs | Approval uses the actual supported artifact slug; validation targets the mapped workflow; commands use the selected repository and correct supported-shell quoting. Unavailable/ambiguous actions explain why rather than invent arguments. No human-gate action executes in the console. | TO-P4 | elevated / architecture/risk |
| TO-P6 — Refresh consistency | Goal counts, board, alerts, routing, and selected detail refresh together by generation. Delayed responses from a prior goal cannot overwrite current data. Failed refreshes retain explicitly stale data and show errors without unhandled promises. | TO-P5 | standard / standard-feature |
| TO-P7 — Real exit evidence | Full regression, chain CLI/console parity, root-resolution evidence, and browser checks for selection/races/failure/freshness. Record actual changed behavior, unsupported environments, and next-goal limitations. | TO-P6 | standard / standard-feature |

No fan-out is planned. Shared readers, exports, API wiring, manifests, and app.js
are serialization points. If shaping reveals an oversized parcel, propose a
graph amendment rather than quietly splitting the authorized set.

## Exit criterion

This goal is complete only when all of the following are evidenced:

1. Gate 1 ratification, fresh plan review and triage, parcel contracts, independent
   reviews, and authorized merges are recorded for the named parcel set.
2. Negative ratification and malformed-member reproductions fail safely; supported
   positive cases still work; no changed test merely asserts the faulty behavior.
3. The same real sealed chain validates consistently through console and CLI with
   its genuine sidecars present. A genuinely invalid member fails both paths.
4. Actual API responses and browser navigation identify the correct source root
   and existing document for each supported tree layout. Synthetic alternate-root
   checks supplement, but never replace, a real multi-root read-only run.
5. Existing remediation handoffs are grounded in CLI contracts and checked without
   executing approvals, merges, or dispatch. Ambiguous commands are withheld.
6. Browser evidence demonstrates fresh goal counts, refreshed selected detail,
   safe rapid goal switching, and honest stale/error presentation. A DOM-only
   harness may support tests but cannot substitute for the real browser proof.
7. An evidence manifest records commands, revisions, independent review outcomes,
   read-only negative controls, environment gaps, and remaining limitations.

The existing five-state classifier remains limited: queued work can still appear
hung and file mtime does not prove agent liveness. Document this in the console's
existing explanatory UI/docs; deeper lifecycle/execution modeling is deferred.

## Gates and standing authorizations — owner amendment A1

- **Gate 1:** D1–D8, TO-P0–TO-P7 graph, and exit criterion explicitly ratified
  by Clinton Morgan in this conversation on 2026-10-10.
- **Gate 2:** standing dispatch for TO-P0–TO-P7 granted. Prerequisites remain:
  independent plan review/triage, shaped/linted specs, exact Allowed Files,
  named isolated worktree/branch, role permissions, and Step 0 scope check.
- **Gate 3:** coordinator may perform actual merges after the complete green
  verification chain and effective repository requirements are satisfied.
  No repeated owner merge approval is required. Do not bypass GitHub controls.
- **Authority:** owner grants decisions on his behalf and any non-destructive
  actions across trustworthy-observation, operator-experience, and
  operational-integration. Includes scoped local commits, ordinary pushes,
  draft PRs, and merges. Preserve independent reviews, collision ownership,
  frozen-contract amendments, no-secret rules, and existing work. Destructive
  actions and protections removal are not authorized by this grant.
- **Routing:** use `opencode-go/MiMo-v2.6-pro` and `fireworks/ember-1` preferentially
  for eligible execution workers. Jev/Drex strictly perform high-speed,
  cost-optimized intent classification, complexity pre-screening, and risk
  assessment; no code generation, synthesis, verification verdict, or approval
  authority. Traditional reasoning models are used only where deeper execution,
  synthesis, code generation, or independent architecture/risk review requires
  them. Record actual route, escalation reason, and availability limitations;
  never label a different runtime identity as the owner's requested model.

[Roadmap authority](../ops-console-roadmap-authority.md) is the persistent record
for subsequent goals. A1 explicitly replaces the draft's human-only merge and
return-to-owner language for routine non-destructive decisions. It does not
turn an advisor's risk label into verification or widen console mutation rights.

The older console/FCA/CI/kernel goals keep their existing ownership and gates.
This charter neither ratifies nor changes another goal. The companion amendment
must identify whether it changes canon owned by a live goal; that collision is
resolved with its owner before landing or dispatching dependent work.

## Stop conditions

Missing required gate; ownership or baseline ambiguity; an affected live goal
owns a collision surface; required frozen-contract change exceeds TO-P0; scope
or authority widening; a tripwire fires twice; a security finding cannot close
in-parcel; missing environment evidence necessary for acceptance; any outward
effect beyond the eventual standing grant. Write a durable stop report and stop.

## Plan-review contract clarifications — coordinator disposition A2

Within A1's non-destructive decision delegation, incorporate PR-1–PR-8 from
plan-review-findings.md. Unknown ratification remains separately attention-bearing;
unmapped invalid chains remain visible without invented parcel identity; source
navigation uses designated documents projected through the existing logs route,
never an arbitrary file endpoint. TO-P5 covers remedy and invocation consumers.
Refresh waits for the current generation to settle and discloses panel freshness.
TO-P6 owns the classifier/liveness limitation explanation. dispatch-preflight.md
binds preferred execution workers, containment, target revision, and live evidence.
These clarify the approved scope; R1–R5, route table and observer rights stay fixed.

## References

- [Coordinator pattern](../../COORDINATOR-PATTERN.md)
- [Goal skill](../../../skills/goal/SKILL.md)
- [Spec convention](../../SPEC-CONVENTION.md)
- [FOC charter](../foreman-ops-console/charter.md)
- [FOC-P0 contract](../../specs/active/FOC-P0-projection-contract-and-discovery-inventory.md)
- [FCA-P0](../../specs/active/FCA-P0-ops-console-multi-root-and-status-index.md)
- [FCA-P1](../../specs/active/FCA-P1-remediation-advisor.md)
- [Planning baseline](baseline.md)
- [Execution plan](tasks/plan.md)

## Gate 1 record

Owner instruction received 2026-10-10:

> Ratify D1–D8 and the parcel plan, grant standing dispatch and goal-scoped
> commits/pushes/draft PRs

Amendment A1: the owner authorizes actual merges and non-destructive decisions
across all three goals, and names preferred workers and bounded classifier roles.
The earlier draft record is superseded by this explicit instruction. Plan-level
review has not yet run; no parcel is accepted by this ratification alone.
