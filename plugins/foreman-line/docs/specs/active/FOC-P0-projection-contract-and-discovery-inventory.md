---
ticket: FOC-P0
title: Ops-console projection contract and discovery inventory
status: active
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/docs/specs/active/FOC-P0-projection-contract-and-discovery-inventory.md
  - plugins/foreman-line/docs/goals/foreman-ops-console/
  - plugins/foreman-line/ops-console/tests/fixtures/
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
---

## Intent

Freeze the Foreman Ops Console's projection contract: the `ParcelState` schema,
the derivation rules that turn disk truth (receipt chains, spec location and
frontmatter, goal records, worktree liveness) into exactly one of five parcel
states with explicit precedence, the receipt-chain walk semantics, the read-only
gate-proxy rules (OQ5), and the CLI-invocation safety boundary (M1) with its
invocation audit log (A1). This parcel also inventories every truth source on
disk (F1, D-LOAD) and ships the fixture corpus for every state, including the
`hung` vs `awaiting-gate` confusion cases. Zero implementation: FOC-P1–FOC-P4
build against these frozen rules (charter D3, D4; plan-review constraints
A1/A2/C1/M1/D-LOAD/X1/T1/F1/S1).

## Constraints

**Authority baseline:** charter D1–D8 + OQ1–OQ5 rulings (`charter.md`), Gate 1
granted 2026-09-16, plan-level adversarial review findings triaged
(`plan-review-findings.md`, REQUEST CHANGES 2026-09-16 — constraints below are
that triage's accepted dispositions, coordinator decision 2026-09-26 under owner
blanket authority), `loop-directive.md`, SPEC-CONVENTION, and the standing
constraints (`docs/kickstarters/STANDING-CONSTRAINTS.md`).

**S1 — the FOC-P4 target goal and chain-walk target are named here (live
artifacts, not fixtures):** the board target is goal `w4-closeout`
(`docs/goals/w4-closeout/`); the live chain-walk target is parcel `E6-R1`,
workflow `a5b1975a-7497-4200-bac2-5d8a6fd6c749`
(`docs/receipts/a5b1975a-7497-4200-bac2-5d8a6fd6c749/`) — the only real receipt
chain on disk at shaping time (six A–F receipts, sealed by Stage-F hash
`3de881be904eb9bee9cb2b25034299a99b79a588b5308c00d81ba6847d66407f`). Rationale:
any other goal lacks a real chain, so exit criterion 3 could only be met by a
fixture, which lesson #33 forbids.

**T1 — FOC-P1 keeps standard-feature routing and a single review (not
up-routed), justified here:** the derivation rules and precedence freeze in this
dual-reviewed contract; FOC-P1 is conformance to frozen rules, and its
acceptance gate requires the frozen fixture corpus to pass 100%, so the review
question collapses to conformance. If FOC-P1 is found to deviate from any rule
text here, that is a defect against this contract, not a design question.

**C1 — FOC-P2 stays a single bundled parcel (API + UI + container), recorded as
safe:** all three surfaces are new files under `plugins/foreman-line/ops-console/`
behind one seam (the FOC-P1 library), the container is a copy of the Automations
hub Docker pattern (D6), and one review covering the whole read path is cheaper
and safer than two reviews of a split seam. The transcript/log-viewer input is
named here (D-LOAD-adjacent naming request): the log viewer renders exactly
(a) the parcel's receipt chain documents `docs/receipts/<workflowId>/*.json`
(chain members and sidecars), (b) the console-local invocation audit log
(`ops-console/state/invocation-audit.json`), and (c) the goal's loop-directive
state lines. `docs/transcripts/defects_lessons.md` is provenance only and is
never a log source.

**D-LOAD — the liveness signal must be disk truth, or D3's precedence
collapses.** The inventory (see
`docs/goals/foreman-ops-console/foc-p0-discovery-inventory.md`) proves no live
builder-session registry exists on disk: harness session IDs appear only inside
receipt `correlation` fields (historical, not live). The derivation therefore
freezes the **worktree liveness composite** as its liveness input, replacing
D3's prose "live builder session" with its disk-truth realization:

> liveness = a git worktree (listed in `<gitdir>/worktrees/*/gitdir`) whose
> worktree directory basename contains the parcel key or goal slug
> (case-insensitive), whose recorded branch ref
> (`<gitdir>/worktrees/<name>/HEAD`) exists, and whose newest content mtime
> (recursive, skipping `.git`, `node_modules`, `dist`, `state`) is within the
> heartbeat threshold of the evaluation time.

Failure mode is defined and safe: an unmatched or absent worktree means "no
liveness", which only ever moves a parcel toward `hung`, and `hung` is
outranked by `failed`, `complete`, and `awaiting-gate`.

**Heartbeat threshold (OQ1, Gate 1 ruling landed verbatim):** "Single default of
6h no-receipt-progress with no live builder session, overridable per goal in its
loop directive." The parse for the override is frozen here: the goal's
`loop-directive.md` may contain a line matching
`/^hung-threshold:\s*([0-9]+(?:\.[0-9]+)?)h\s*$/m`; the captured hours override
the default for that goal only. Absent or unparseable → default
`21_600_000` ms (6h). Goal override wins over default; nothing else overrides.

**D2 / read-only posture.** The console and its projection library write
nothing to `contracts/`, `docs/specs/`, `docs/receipts/`, or `docs/goals/`.
The ONLY writable paths in the whole package are `ops-console/state/notifications.json`
(OQ3) and `ops-console/state/invocation-audit.json` (A1). Everything the
console offers to run goes through an allowlisted existing CLI (M1) whose own
writes are pre-existing flows, enumerated below (A2).

**M1 + A1 — CLI-invocation safety boundary (contract section; FOC-P3 owns the
implementation and its acceptance gate).** The console exposes exactly the
frozen flow registry below. Every request — executed, presented, or refused —
appends one entry to the invocation audit log
(`ops-console/state/invocation-audit.json`, format `foc-invocation-audit/v1`,
append-only; "records nothing itself" never means "leaves no trace"). Arg rules:
argv is passed as an array (never a shell string); each argument matches its
flow's frozen pattern (UUID, 6-digit sequence, `^[a-z0-9-]+$` slug, absolute
`--repo-root` that must equal the configured repo root); arguments outside a
flow's frozen surface are refused before any spawn; no environment passthrough;
working directory is the configured repo root's package context.

**A2 — invoked flows and exactly where they write (transitive writes named):**

| Flow id | Command surface | Writes (via the pre-existing flow, never by the console) |
|---|---|---|
| `approval-show` | `approval show <slug> --repo-root <abs>` | nothing (read-only render) |
| `approval-approve` | `approval approve <slug> --repo-root <abs>` | `<specs-dir>/<slug>.approval.json`; genesis `docs/receipts/<workflowId>/000000-A-shaping-result.json`; transitively `<specs-dir>/<slug>.projected.shaping-result.json` when absent (approval CLI's load-if-exists-else-project path) |
| `approval-reject` | `approval reject <slug> --repo-root <abs>` | `<specs-dir>/<slug>.rejection.json`; transitively the projected artifact as above |
| `dispatch-execute` | dispatch `approval-cli` `executeDispatch` (library surface; no bin exists on disk) | builder worktree via the permission-profile emitter; `docs/receipts/<workflowId>/000002-C-dispatch-order.json` and its sidecars (`kompress.json`, `routing-decision.json`, `skill-injection.json`) |
| `receipts-validate` | `receipts validate <path>` | nothing (exit 1 on invalid chain, 2 on usage) |

Execution modes (frozen): `execute` mode is available only for non-interactive,
non-minting flows (`approval-show`, `receipts-validate`). Human-gate mutating
flows (`approval-approve`, `approval-reject`, `dispatch-execute`) are
`present` mode only: the console renders the exact copy-pasteable command for a
real interactive terminal and audits the presentation. The console never
fabricates a TTY, never pipes a typed confirmation phrase, and never auto-approves
(W1-P3 human-gate integrity is frozen elsewhere and is not weakened here).
`dispatch-execute` is `present` mode in Phase 1 because no invokable bin exists
on disk; building one is out of scope (dispatch/ is not this goal's surface).

**X1 — seam owners (sequential default stands):**

| Seam | Sole owner | Rule |
|---|---|---|
| Projection authority (`ops-console/src/` chain-walk + scans + derivation) | FOC-P1 | No other component parses receipts/specs/goals (D4). |
| HTTP route table | FOC-P2 (`src/api.ts`, `src/server.ts`) | The route table below is frozen here; no route may be added without amending this contract. |
| Gates/alerts/notifications/invoke modules (`src/gates.ts`, `src/alerts.ts`, `src/notifications.ts`, `src/invoke.ts`) | FOC-P3 | FOC-P2 mounts them; FOC-P3 never touches the read routes. |
| CLI-invocation shell (`src/invoke.ts`) | FOC-P3 | The only exec-capable module in the package. |
| Notification store `state/notifications.json` (`foc-notifications/v1`) | FOC-P3 (sole writer) | FOC-P2 renders via API only. |
| Invocation audit `state/invocation-audit.json` (`foc-invocation-audit/v1`) | `src/invoke.ts` (sole writer) | Append-only. |

**Frozen route table (read-only over goal/receipt data):**

- `GET /api/health`
- `GET /api/goals`
- `GET /api/goals/:slug`
- `GET /api/parcels?goal=<slug>`
- `GET /api/parcels/:parcel/chain?goal=<slug>`
- `GET /api/parcels/:parcel/logs?goal=<slug>`
- `GET /api/gates?goal=<slug>`
- `GET /api/alerts?goal=<slug>`
- `GET /api/routing?goal=<slug>`
- `GET /api/notifications`, `DELETE /api/notifications/:id`
- `POST /api/invoke` (allowlisted flows only; see M1)

Binding (D6): the server binds `127.0.0.1` at port `8081` by default and refuses
any non-loopback bind unless `FOC_CONTAINER=1` (container-internal `0.0.0.0`,
published only as `-p 127.0.0.1:8081:8080`). No auth, same posture as the
Automations hub. Never exposed beyond loopback — non-loopback publication is a
charter stop condition (D6), not a configuration option.

## Contract

**Consumers:** the FOC-P1 projection library implements these rules; the FOC-P2
API and UI consume only the library (D4). **Non-goals of the projection:** no
writes, no authority (it never decides or records a gate), no stored status
(every state is re-derived from disk on each projection call).

### C1. Parcel identity and discovery

A **parcel** is one entry of a goal's queue (the `## Queue` list of the goal's
`loop-directive.md`, items shaped `N. **<KEY>** …`). `parcelKey` is the
`<KEY>` token (e.g. `E6-R1`, `CLOSE-P1`), matching `^[A-Z0-9]+(-[A-Z0-9]+)*$`.
Specs join to parcels by filename stem prefix `<KEY>-` (SPEC-CONVENTION §2
filename format) across `docs/specs/active/` and `docs/specs/done/`. Receipt
chains join to parcels through the Stage-A receipt's
`subject.specSet[].ref` / `subject.projectedResult.parcelSpecRefs` basenames;
approval/rejection/projected sidecars join through
`subject.specSet[].ref` basenames (or `artifactRef`). A chain that joins to no
parcel is still walked and surfaced as `unmapped`. If two chains join to one
parcel, the lexicographically smallest `workflowId` wins and the projection
carries a `duplicate-chain` flag.

### C2. Receipt-chain walk semantics

1. Workflow directories are exactly `docs/receipts/<workflowId>/` with
   `workflowId` matching the receipts `UUID_PATTERN`.
2. Chain members are files matching `^[0-9]{6}-([A-F])-[a-z0-9-]+\.json$` — the
   `receiptPath` locator convention. Other files (`kompress.json`,
   `routing-decision.json`, `skill-injection.json`, …) are sidecars, never chain
   members.
3. The walk parses each member as JSON; an unparseable member invalidates the
   chain. It orders members by filename sequence prefix and calls the shipped
   receipts validator: `validateReceiptDocument` per member and
   `validateChain(docs)` for sequence contiguity `0..M-1`, genesis
   `prevHash: null`, `prevHash` linkage to the prior receipt's stored `hash`,
   and shared `correlation.workflowId` — the charter's "contiguity + hash
   linkage via the receipts validator" (no re-implementation).
4. `isSealed(chain)` defines **sealed**: a valid chain ending in a stage-F
   `ClosureRecord`. Seal is structural, not a completion claim by itself.
5. The chain summary reports per member: `sequence`, `stage`, `subjectKind`,
   `timestamp`, `hash`, and the repo-relative POSIX locator.

### C3. Gate proxy rules (OQ5, read-only; the console records no gate decision)

| Gate | Evidenced (proxy present) | Pending | Unknown |
|---|---|---|---|
| G1 — Stage-A approval | approval sidecar (`<slug>.approval.json`, `decision`) joins the spec, or the chain has its A receipt | a projected shaping artifact joins the spec but no approval and no chain | neither |
| G2 — dispatch | chain has its C `DispatchOrder` receipt | chain exists (tip ≤ B) and has no C receipt | no chain |
| G3 — merge | chain has its F `ClosureRecord` with `subject.mergeSha` matching `^[0-9a-f]{40}$` | chain exists and has no F receipt | no chain |

Goal-level ratification renders from the goal record's Status/ratification text
(`Gate 1` + `RATIFIED|GRANTED`); gate-state rendering is presentation of these
proxies only. Gate 1 ratification and Gate 3 merge have no console capture path
(exit criterion 4). Routing renders read-only from the chain's
`routing-decision.json` sidecar (class, tier, model) plus the spec frontmatter
`routing_class`; the models view is read-only `routing-policy/routing-policy.yaml`
class×ceiling output — never an editor (D5).

### C4. `ParcelState` schema and derivation (D3 frozen)

```ts
type ParcelStateValue = 'running' | 'hung' | 'awaiting-gate' | 'failed' | 'complete'

interface ParcelProjection {
  goal: string                 // goal slug
  parcel: string               // parcel key
  specRef: string | null       // repo-relative POSIX path
  specLocation: 'active' | 'done' | 'none'
  chain: ChainSummary | null
  gates: { G1: GateProxy; G2: GateProxy; G3: GateProxy }
  routing: { routingClass: string | null; resolvedModelId: string | null; resolvedTier: string | null }
  liveness: LivenessSignal
  heartbeat: { thresholdMs: number; source: 'goal-override' | 'default'; lastProgressAt: string | null }
  failure: { code: FailureCode; detail: string } | null
  state: ParcelStateValue
  rule: string                 // first-matching rule id
  flags: string[]              // e.g. 'duplicate-chain', 'proxy-drift'
}
```

`FailureCode = 'chain-invalid' | 'red-review' | 'tripwire' | 'closure-drift'`.

**Inputs:** receipt-chain facts (C2), spec location + frontmatter
(`status:`, `updated:`, `routing_class`), goal record facts (queue item text,
`**Current state (date): …**` lines, `hung-threshold` override), liveness
(D-LOAD composite), approval/projected/rejection sidecars, and the evaluation
time (an explicit argument; the library reads no ambient clock).

**Progress timestamp** (heartbeat clock): the newest `timestamp` among the
mapped chain's receipts; else the spec frontmatter `updated:` (date-only values
count as `T00:00:00Z`); else the spec file's mtime; else `null` (never
progressed ⇒ age `∞`).

**Derivation rules — first match wins (precedence frozen):**

- **R1 `failed`** — any failure evidence:
  - `chain-invalid`: a mapped chain exists and `validateChain` fails (including
    an unparseable member);
  - `red-review`: any D receipt in the mapped chain has `verdict: 'rework'`
    (frozen `VerificationVerdict` enum: `pass | rework`);
  - `tripwire`: the goal's loop-directive queue item text for the parcel records
    a fired tripwire (`/tripwire/i` and `/fired/i` in the same item);
  - `closure-drift`: the mapped chain is sealed but the spec is not in
    `docs/specs/done/` (the F receipt's asserted lifecycle move disagrees with
    disk).
- **R2 `complete`**:
  - the spec is in `docs/specs/done/` AND the mapped chain is sealed; or
  - no chain maps AND the spec is in `docs/specs/done/` AND the goal record
    marks the item closed (`☑` or `SHIPPED|CLOSED|COMPLETE` in the item text) —
    carried as `chainEvidence: 'absent'`.
- **R3 `awaiting-gate`** — the next expected step is a human gate and its proxy
  is absent (this rule is what separates **idle-but-gated** from hung):
  - no chain AND a projected shaping artifact joins the spec AND no approval
    sidecar ⇒ G1 pending; or
  - chain tip is A and no approval sidecar and no A-receipt-backed approval ⇒ G1
    pending; or
  - chain tip is B ⇒ G2 pending (dispatch); or
  - chain tip is E ⇒ G3 pending (merge).
- **R4 `hung`** — not R1–R3 AND progress age > threshold AND no liveness
  (idle-and-abandoned).
- **R5 `running`** — everything else (the canonical live pattern: active spec +
  recent receipt progress + live worktree/branch).

Where a gate-boundary proxy and its chain evidence disagree (e.g. an approval
sidecar at a tip where the chain says otherwise), the state follows the chain
position per R3 and the projection carries `proxy-drift`; presentation of the
gate shows both.

**Confusion cases (frozen):** idle-but-gated (tip B or E, or projected-artifact
awaiting G1, with old timestamps and no worktree) is `awaiting-gate` — a slow
human decision is not abandonment; idle-and-abandoned (tip C or D, old
timestamps, no worktree, no pending gate) is `hung`.

### C5. Fixture corpus (FOC-P0 deliverable)

`ops-console/tests/fixtures/scenarios/*.json` holds one scenario manifest per
case; `tests/support/materialize.ts` (FOC-P1) materializes each into a temp
repo. The corpus MUST cover every `ParcelStateValue` and at minimum: sealed
complete (E6-R1-shaped), complete-with-absent-chain, chain-invalid,
red-review (`rework`), closure-drift, G1-pending, G2-pending (tip B),
G3-pending (tip E), hung at tip C and at tip D, running with liveness, the two
confusion cases, and the heartbeat override.

## Acceptance Criteria

- [ ] **AC1.** This spec passes `spec-linter validate` with zero errors (schema
  v0.2/v0.3 fields complete; `verification_class: judgment-required`).
- [ ] **AC2.** The discovery inventory
  (`docs/goals/foreman-ops-console/foc-p0-discovery-inventory.md`) names, for
  every truth source, its exact on-disk path(s), parseability evidence, and the
  derivation input it feeds: receipt paths per `receipts/src/paths.ts`, spec
  frontmatter per SPEC-CONVENTION §4, goal charter/loop-directive fields, and
  the worktree/branch liveness signals (D-LOAD). Each of the four OQ5 proxy
  artifacts (Stage-A approval record, Stage-C dispatch receipt, GitHub merge
  commit, goal loop-directive state lines) has a recorded existence proof with
  path and a parseability note (F1).
- [ ] **AC3.** The shaping-decision record
  (`docs/goals/foreman-ops-console/foc-p0-shaping-decisions.md`) contains one
  entry per accepted plan-review constraint (A1, A2, C1, M1, D-LOAD, X1, T1,
  F1, S1) with its disposition, rationale, and the authority basis
  ("coordinator decision 2026-09-26 under owner blanket authority").
- [ ] **AC4.** The heartbeat rule lands the OQ1 Gate 1 ruling verbatim (quoted
  in Constraints) with the frozen override parse; no other threshold source
  exists.
- [ ] **AC5.** The fixture corpus covers each state INCLUDING both confusion
  cases (idle-but-gated ⇒ `awaiting-gate`, idle-and-abandoned ⇒ `hung`), each
  scenario asserting its expected state and first-matching rule id.
- [ ] **AC6.** The contract names its consumers (FOC-P1 library, FOC-P2 API)
  and its non-goals (no writes, no authority, no stored status) — see Contract
  preamble.
- [ ] **AC7.** The seam-owner table (X1) assigns exactly one owner to routes,
  the invocation shell, and the notification store; the route table is frozen.
- [ ] **AC8.** The invocation flow registry (M1) is a closed set with per-flow
  write surfaces including transitive writes (A2), and the audit-log format
  `foc-invocation-audit/v1` is specified in the inventory.

## Out of Scope

- All implementation: the FOC-P1 projection library, FOC-P2 API/UI/container,
  FOC-P3 gates/alerts/invocation modules, FOC-P4 live wiring and docs. This
  parcel produces contract text, inventory evidence, and fixture data only.
- Phase 2 (FOC-P5–FOC-P8: analytics, cost ledger, push alerts, portfolio/Jira
  sync) — excluded by D7 until a scoped Gate 1 amendment.
- Any change to `contracts/`, `receipts/`, `dispatch/`, `approval/`,
  `projection/`, `spec-linter/`, `routing-policy/`, `templates/`, or any other
  goal's records.
- New gate-decision types, gate capture paths, stored status fields, or any
  write into `docs/specs/`, `docs/receipts/`, `docs/goals/`, `contracts/` by
  the console (D2).
- Network exposure beyond loopback (D6), authentication design, multi-goal
  portfolio views, cost accounting, push notifications.
- A `dispatch-execute` bin wrapper in `dispatch/` (out of this goal's surfaces;
  recorded as a follow-up).

## Context & References

- [Charter](../../goals/foreman-ops-console/charter.md) — D1–D8, OQ1–OQ5,
  exit criterion, parcel table, ratification record.
- [Loop directive](../../goals/foreman-ops-console/loop-directive.md) —
  authorizations, FOC-P0 shaping checklist.
- [Plan review findings](../../goals/foreman-ops-console/plan-review-findings.md)
  — A1/A2/C1/M1/D-LOAD/X1/T1/F1/S1 dispositions.
- [Discovery inventory](../../goals/foreman-ops-console/foc-p0-discovery-inventory.md)
- [Shaping decisions](../../goals/foreman-ops-console/foc-p0-shaping-decisions.md)
- [SPEC-CONVENTION](../../SPEC-CONVENTION.md) — spec schema, `Allowed Files`
  authority.
- `plugins/foreman-line/receipts/src/paths.ts`, `src/validator.ts` — locator
  convention and chain validation (cited, not restated).
- `plugins/foreman-line/docs/specs/done/W1-P3-human-approval-flow.md` — the
  `approval` CLI's frozen human-gate contract.
- `plugins/foreman-line/docs/specs/done/W2-P2-dispatch-approval-cli.md` — the
  dispatch approval-cli surface.
- `plugins/foreman-line/docs/goals/w4-closeout/` + workflow
  `a5b1975a-7497-4200-bac2-5d8a6fd6c749` — the named S1 live targets.

## Allowed Files

- `plugins/foreman-line/docs/specs/active/FOC-P0-projection-contract-and-discovery-inventory.md` (new)
- `plugins/foreman-line/docs/goals/foreman-ops-console/foc-p0-discovery-inventory.md` (new)
- `plugins/foreman-line/docs/goals/foreman-ops-console/foc-p0-shaping-decisions.md` (new)
- `plugins/foreman-line/ops-console/tests/fixtures/scenarios/*.json` (new; fixture corpus only)

At Stage F the coordinator alone moves this spec to `docs/specs/done/`.

## Forbidden Files and Effects

Every path not listed above is forbidden to FOC-P0. The FOC-P1–FOC-P4 build
parcels carry their own file manifests, recorded in
`docs/goals/foreman-ops-console/foc-p1-p4-build-evidence.md`. No frozen
contract (`contracts/`, `receipts/`, `dispatch/`, `approval/`, `projection/`,
`spec-linter/`, `routing-policy/`, `templates/`) is modified by any Phase 1
parcel of this goal.

## Verification Plan

Deterministic: `spec-linter validate` over this file (AC1); corpus-conformance
checks (AC5) run by the FOC-P1 test suite against these manifests. Shaping
evidence (AC2/AC3/AC4/AC7/AC8) is read on disk before acceptance.

Mandated reviewer focus questions (dual review, architecture/risk):

1. **Precedence completeness.** Is the rule order R1–R5 total and unambiguous
   over every reachable combination of inputs — does any input combination fall
   through with no first match, and does the naive reading of D3's five prose
   states differ from any rule here in a way the text does not exclude?
2. **Confusion-case fidelity.** Does R3 fire only when the next expected step is
   genuinely a human gate, and can a truly abandoned parcel slip into
   `awaiting-gate` (or a gated one into `hung`) under any fixture in the corpus?
3. **Proxy honesty (OQ5).** Do the gate proxy rules render exactly what disk
   proves and nothing inferred — especially: can `complete` be shown when the
   chain is absent (R2 fallback) and is its `chainEvidence: 'absent'` marker
   non-optional?
4. **Liveness substitution (D-LOAD).** Is the worktree composite genuinely
   disk-truth (no hidden process/session dependency), is its failure mode
   toward `hung` only, and is `hung` provably outranked by the three higher
   rules?
5. **Invocation boundary (M1/A1).** Does the flow registry leave any path by
   which the console could mint a receipt, fake a TTY, auto-approve, or spawn
   anything outside the allowlist — and does the audit log capture refusals as
   well as executions?
