# PMC-P1 design and compatibility inventory

Status: revised draft; coordinator accepted D1-D5 and independent review fixes,
2026-09-26. Docs-only shaping; not
implementation verification, Gate 2, PMC-P2 enablement or a production contract.
Base: 5d5716d8dc65d05f821bb3c21238ad6c9fda530c (PR49 merged).

## Canon and reconciled requirements

Read: charter D1-D8; in-force Amendment01 A1-A8; Amendment02 (M1 superseded,
M2-M4 retained); Amendment03 exact Opus identities; Amendment04 AC2a semantics;
PMC-P0 capability baseline, role/lane map and suitability rubric; and
COORDINATOR-PATTERN. Map section 4 owner ratification governs stale rubric prose:
L1/L2 pin opencode, L3/L4 prefer openrouter, three new class labels accepted,
quality tolerance zero. The map is installed as validated v1 declarations only;
P1 does not create a launch path.

A5.5 requires additive compatibility, not immediate conversion of v0 consumers.
A7 assigns schemas/policy/compatibility to P1 and runtime resolver/Pi to P2.
The v1 policy and immutable read-only projection are separate from legacy
RoutingPolicy. The projection carries evidence/constraints, never effective
runtime eligibility or authorization. It is suitable for dependency injection;
HRO must explicitly adapt it and refuse unknown required facts. No direct import
of RCM implementation files is needed.

Main already has anthropic/claude-opus-5.5 in KNOWN_FRONTIER_MODELS, all three
classification sets, first frontier policy entry, positive policy fixtures and
dispatch routing expectations. Amendment03 is therefore a regression assertion,
not grounds for another mutation. Historical negative fixtures still mention
Opus 5; do not bulk rewrite them or erase historical evidence.

## Accepted coordinator rulings and independent review fixes

| ID | Concrete decision | Accepted disposition and basis |
|---|---|---|
| D1 | Every candidate has exactly one fallback versus finite primary/fallback pairs | Encode fallback per lane occurrence: primary has one fallback reference; fallback occurrence is terminal/null. Matrix reverses 1/2 across L1/L2 and 9/10 across L1/L2, so a global graph would misdiagnose cycles. Charter says both members failing must stop; no third fallback. Coordinator accepts this terminal-pair interpretation; pairs must stay in the same lane and provider. Off-pin matrix declarations remain nonselectable. |
| D2 | Ratified new classes lack ceiling values and legacy enum integration | Include labels in v1 lane declarations; retain CLASS_NAMES and v0 dispatch unchanged under A5.5. Mark budget source unresolved for new classes; P2 cannot dispatch them until an approved envelope supplies the budget source. Do not copy a neighboring ceiling without authority. |
| D3 | Declared family is required for independence but no concrete family table was ratified | Represent family as recorded declaration with evidence reference or unknown. Baseline uses unknown until a coordinator-approved sourced declaration exists. Unknown never proves independence; no family derivation from provider or substring. No blocker to static schema completion. |
| D4 | Public export serialization against concurrent RCM-P1 | P1 owns new provider-binding modules plus additive index.ts, registry.ts and parity test changes only. Coordinator records final RCM base and edit order before dispatch. Never add/re-export RCM internals by opportunistic deep imports. |
| D5 | Existing PiOpenRouter registry enables Jev despite M2 disabling L6 | Preserve legacy bytes/API under deprecation window; v1 L6 is hard-disabled and includes no Jev binding. Carry old registry as an explicit cutover debt, never advertise legacy registry as v1 eligibility. PMC-P2 must enforce disabled L6 across BOTH legacy and v1 launch boundaries before ANY activation. P3 canon and P4 removal cannot defer this enforcement. |

Coordinator accepted D1-D5 as scoped representation/serialization decisions.
The user authorized necessary PMC/RCM prerequisites, subject to independent
review. No unresolved design decision blocks this static shape; per-parcel
lint, explicit Gate 2, reconciled base and reviews remain required execution steps.
Shaping does not ratify owner-only charter changes.

## Smallest implementation surface

New provider-bindings.ts owns types, frozen lane constraints, pure structural and
semantic validation. New provider-binding-schemas.ts owns closed schemas and
nested definitions in sequential PMC-P1a. After its acceptance, PMC-P1b's new
provider-binding-projection.ts calls that validator and encloses the ENTIRE
validated policy under policy, with schemaVersion and evidenceOnly:true. No
flattened subset survives this review fix. Each parcel adds its own schema,
public export and parity sample in order; the shared index/registry/parity paths
are never edited concurrently. P1b owns final consumer inventory closure.
No change to routing-policy.yaml, v0 schemas/types/validator, Pi registry,
package dependencies, template, dispatch evaluator or RCM implementation.

Public API: ProviderBindingPolicyV1, ProviderBindingProjectionV1, supporting
readonly types, providerBindingPolicyV1Schema, providerBindingProjectionV1Schema,
validateProviderBindingPolicyV1, projectProviderBindingsV1. Contract version is
explicit /v1; adding an incompatible field changes version. A validated object
is structurally sound evidence, not proof that its claimed evidence is authentic.
The caller/producer retains provenance custody; PMC-P2 later authenticates
availability/quality and launch authority. Content hash identifies named source
bytes, not a fabricated certificate or recursive hash.

Binding provenance and explicit clocks travel as evidence; P1 does not evaluate
wall time. Unknown protocol/endpoint/capability remains unknown. In particular
Opus bindings 1/10 are owner-attested identity only, and 7 is held. SCF-1/2/3
endpoint divergences remain findings: catalog-vs-settings disagreement is not
catalog-internal AC2A_URL_MISMATCH. No host export is loaded at runtime or needed
for this implementation; the reviewed baseline contains sufficient fixture facts.

## Compatibility inventory

Inventory discovery used repository search for routing-policy/src,
routing-policy.yaml, PI_OPENROUTER_ROUTING, CLASS_NAMES and Pi template references.
The builder must repeat the search on its final reconciled base, append any new
consumer rows, and classify them; this document is the initial concrete inventory.
Historical done-specs/transcripts are provenance and are not migrated in place.

| Surface / exact consumer paths | P1 compatibility treatment | Migration owner / cutover condition |
|---|---|---|
| routing-policy/src/types.ts, schemas.ts, validator.ts, testing.ts; routing-policy/routing-policy.yaml | Existing four classes, three roles, ordered model lists and data constraints unchanged; new sibling v1 representation | P2 consumes v1; P4 removes legacy only after all downstream consumers migrated |
| routing-policy/src/pi-openrouter.ts; routing-policy/schemas/pi-openrouter-routing.schema.json | Preserve legacy registry/schema, including explicit recorded Jev debt; v1 cannot use it as eligibility | P2 MUST refuse L6 at both legacy and v1 launch boundaries before ANY activation; P3 canon/P4 removal are later cleanup |
| routing-policy/src/index.ts, registry.ts, generate.ts; routing-policy/tests/parity.test.ts | Add exports/schema registry entries and samples; old schemas byte-identical, generation mechanism unchanged | P1 owns additive change; coordinate shared barrel with RCM |
| dispatch/src/routing-eval/index.ts, routing-eval/shadow.ts, src/index.ts | Preserve public input/result/error behavior, four-class allowlist and receipt production; no imports from v1 | P2 or named bridge parcel under owner-approved scope; no production use before launch boundary |
| dispatch/tests/routing-eval.test.ts, approval-cli.test.ts, shadow-routing.test.ts, w4-p0-correlation-lineage.test.ts, dependency-allowlist.test.ts | Unchanged regression checks, existing Opus expectations intact | P2/P4 versioned migration; no old result/error meaning changed in P1 |
| contract-readers/src/registry-data.ts; contract-readers/tests/touch-set.test.ts | Frozen class vocabulary registry remains accurate because v0 ClassName unchanged | Named contract-reader owner before global new-class cutover |
| spec-linter/src/schemas.ts; docs/SPEC-CONVENTION.md | Existing dispatchable routing_class enum unchanged; new v1 labels do not bypass spec lint | Named vocabulary migration with budgets before P2 dispatches new classes |
| verification/src/d19-audit.ts | Existing routing-policy path/audit semantics preserved | Verification owner if v1 becomes authority-bearing production input |
| hooks/model-gate.policy.json; hooks/README.md | Existing model gate behavior untouched, no v1 opt-in | P2/P3 review hook compatibility before launch |
| templates/pi-openrouter-routing.json; templates/pi-routing-directive.md; templates/AGENTS.md | No template edits (A7); legacy strings not presented as installed v1 | P3 after ratified P2 resolver interface |
| skills/goal/SKILL.md; skills/parcel-driven-development/SKILL.md; docs/COORDINATOR-PATTERN.md; docs/FOREMAN-LINE-PLAN.md | Session/canon instructions remain; no new provider/runtime default | P3 owns Pi-session canon; preserve gates and independence |
| routing-policy/README.md; dispatch/README.md; permission-profiles/README.md | Existing legacy documentation stays valid; new contract documented in this goal record | P3 public/canon documentation migration before activation |
| docs/kickstarters/foreman-line-build-PMC-P0.md; foreman-line-supercharge-phase1-models.md; foreman-line-supercharge-phase1-handoff.md; foreman-line-supercharge-phase2-findings.md; foreman-line-supercharge-carryover.md | Historical evidence/task instructions retained, not rewritten to pretend prior v1 use | Archive/historical handling only; active new kickstarters use explicit version |
| RCM-P1 catalog-snapshot.ts / eligibility.ts (concurrent incoming work, not yet on shaping base) | No direct imports, mutations, custom reader or eligibility duplication | RCM owns normalized facts and its stable export; named later adapter passes facts by injection |
| HRO hybrid-routing package (concurrent work) | ProviderBindingProjectionV1 differs from HroBindingProjectionDraftV1; no implicit cast or authority upgrade | HRO bridge parcel maps by explicit field/version rules, rejects unknown protocol/family when required |

Paths in the table are relative to plugins/foreman-line unless already prefixed.
A5.5 named cutover: PMC-P4 may remove v0 only when the inventory has no active
legacy consumer, PMC-P2 resolver/launch boundary (including L6 refusal across BOTH legacy and v1) and PMC-P3 canon are reviewed,
v1 adapters have explicit budgets/role scope, rollback is recorded, and all
required static plus activation evidence/gates are satisfied. P1 success does
not imply that cutover condition or PMC goal exit is met.

## Static evidence and deferred claims

Schema, references, frozen lane constraints and projection fidelity can be
verified entirely offline. Real baseline has no rankable binding: availability,
lane quality, and tool/structured-output evidence are not established; OpenCode
data policy and upstream privacy assurance are not established; freshness is
not accepted; binding 7 is held; Opus capabilities are unknown. No prices,
reputation or family guesses fill these gaps. PMC-P2 must also settle endpoint
registrations/SCF-1/2/3, explicit launch receipt verification, enablement and
new-class budgets before any runtime activation. Those are named open exit
conditions, not reasons to claim this static contract incomplete once its
scoped acceptance criteria pass.

## Review-fix closure and sequential dispatch

| Review issue / coordinator direction | Exact correction in revised shape | Closure check |
|---|---|---|
| Flattened projection loses policy declarations/authority/ranking fields | P1b uses closed {schemaVersion, evidenceOnly:true, policy:ProviderBindingPolicyV1}; the entire validated policy is retained, including unreferenced declarations. No occurrence index needed in smallest v1. | Deep equality for all fields, nested mutation checks, schema parity and independent P1b review. |
| Legacy Jev/L6 debt could defer enforcement to documentation/removal | D5 and both specs require PMC-P2 to refuse disabled L6 across legacy AND v1 launch boundaries before ANY activation. P3/P4 cannot defer this obligation. | PMC-P2 acceptance must include both launch paths; P1b inventory names this predecessor explicitly. |
| Original 13-file parcel too broad | Split PMC-P1a contract/schema/validator (9 exact allowed paths) then PMC-P1b projection/inventory (8 exact allowed paths). P1b consumes accepted P1a validation unchanged. | Separate Gate2, acceptance and two independent implementation reviews per parcel; fresh pinned base for P1b. |
| D1 terminal pairs must preserve provider restrictions | No cross-provider links in any pair; same lane, primary-to-terminal fallback only; no off-pin declaration becomes selectable. Reversed L1/L2 roles remain separate occurrences. | P1a negative tests for cross-provider/cross-lane/pin escape and terminal references. |
| D2/D3 unknown inputs could imply authority | New class budgets remain unresolved/non-dispatching; unknown family never satisfies independence. No inferred ceilings or family aliases. | P1a negative evidence tests; lossless P1b retention. |
| D4 concurrent RCM changes | Reconciled RCM base first, P1a shared edits second, accepted P1a/P1b shared edits third. Neither imports/mutates RCM internals. | Coordinator records exact base and shared-file handoff before each dispatch. |

Drafts:
- [PMC-P1a](../../specs/active/PMC-P1a-provider-binding-contract.md)
- [PMC-P1b](../../specs/active/PMC-P1b-provider-binding-projection.md)

The former combined draft was uncommitted and is replaced by these two drafts;
there is no competing PMC-P1 dispatch spec. This review-fix closure records
shaping corrections only, not the future implementation review results.
