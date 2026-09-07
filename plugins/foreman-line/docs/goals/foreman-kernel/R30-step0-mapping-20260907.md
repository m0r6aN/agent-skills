# R30 Step 0 source-first mapping, 2026-09-07

Status: proposed for independent review and coordinator ruling; no package implementation, generation, installation, tests or commits performed by this builder. Read R30.6 and U01-U04 at coordinator `21ea65da75febc6825fbc9de5409c1e08cc37764`, then the reserved-identity no-fallback correction at coordinator `8d78992`. The source snapshot stays `65c471416e4a3916695815e951ffbe389288560e`; later integration metadata does not change its eighteen source bytes.

## Evidence subjects and boundary

Baseline verification subject: `0ee165720f8d1e3a91eb283cb770400b23f61bf5`. Last commit changing shipped registry: `66a514d35a384f901486e7b814580eb6fb7de6ea`; proposed appended migration `registry-rework-66a514d`. Baseline direct-exit result is pending coordinator attachment. No baseline pass is inferred.

All eighteen Git-blob SHA-256 values were independently read and matched to R30-source-integration.json at the exact source snapshot. Changed sources are charter `c289fbcc384ca825181662b091572c2f085e23c984ad2be6bec5fff49d7350d3` and loop `8b2cd6818833d3f27ecd346f05d3f84bdfc669f16ce81265a1bf6667664ce4cb`; sixteen others are unchanged. No nineteenth source, D22, new dependency, schema expansion, global assurance ordering change or runtime effect is proposed. Package writes remain limited to the existing exact 28 Allowed Files. This document is separately authorized coordinator shaping evidence.

## Closed rule shape

Each row below is one new rule. These common fields are literal, not defaults chosen from generated output:

* `severity: critical`; `assurance: human-ratified`; `pairedRuleIds: []`; `retirementState: active-reading`.
* `retirementEvidence: {predicate: null, negativeRefusalTest: null, corpusSweep: null, independentBypassAttempt: null}`.
* IJ expands exactly to `classification: independent-review-human-judgment`, `decision: REQUIRE_HUMAN`, `enforcementOwner: independent-reviewer`, `refusalCode: null`.
* PR expands exactly to `classification: pre-action-refusal`, `decision: REFUSE`, `enforcementOwner: kernel-policy`, `refusalCode: FK_CANON_RULE_REFUSED`.
* PD expands exactly to `classification: post-action-detection`, `decision: ADVISORY`, `enforcementOwner: coordinator`, `refusalCode: null`.
* `authoritySubject` is exactly the subject column. `authorityClaim` is exactly the claim column. Subjects are intentionally separate from existing rule subjects to avoid changing an existing controlling set.
* `normalizedStatement` is exactly the Statement cell, using the existing normalization function. Each mixed source unit's NP observations/references are explicitly retained as contextual provenance through the full item excerpt; they are not new ALLOW rules. Same-class obligations grouped in one statement are explicit compound coverage, not omission.
* Each row's `authorityBasisRef` is its own unit's exact source reference. `sourceRefs` is the ordered list `[own-unit]` for ledger and loop units and `[own-unit, C03]` for C05-C45 infrastructure units. C18-C24 instead use `[own-unit, C01, C03]` to bind D21 corroboration. C02 uses `[own-unit]`; U01 uses `[own-unit, C02]`. No references to adjacent non-corpus documents become sourceRefs.
* A source reference contains exact sourceId/itemId/locatorDigest/valueDigest from the source-anchor appendix. Runtime generation may not derive trusted expectations from the candidate registry.
* Rule ID convention is the existing `rule.<sourceId>.<itemId without item.>.<component>` with the exact component suffix in the first column. This is not a new identity algorithm. Existing frozen item IDs take precedence over newly derived IDs.

The ordinary class decision/owner pairing is preserved even when the source names a coordinator, builder or parcel carrier: those actors are named in applicability and the statement. `enforcementOwner` here retains the existing registry's enforcement-surface vocabulary, while `human-ratified` explicitly denies any claim that the mechanism/review actually ran. IJ does not create another human gate or revoke existing coordinator authorization; its REQUIRE_HUMAN result is the existing registry classification outcome for human-ratified judgment obligations, not an execution request for repeat approval. Review must assess this interpretation; if it requires a different decision/owner, stop for a separate ruling rather than widen the exception.

## Exact applicability presets

Every preset has `goals: [foreman-kernel]` and `hosts: [any]`. Hosts any preserves duties even on unsupported/unenrolled hosts; the D20 measurement limitation is expressed in source semantics and never erases outage/cache requirements.

| Preset | roles | stages | operations |
|---|---|---|---|
| G | [coordinator,shaper,builder,reviewer] | [stage-zero,shaping,step-zero,build,deterministic-verify,adversarial-review,merge,closure] | [source-inventory,spec-mutation,repo-read,repo-mutation,state-transition] |
| L | [coordinator,builder,reviewer,kernel] | [shaping,step-zero,build,deterministic-verify,adversarial-review,runtime] | [source-inventory,spec-mutation,repo-read,state-transition,receipt-validation] |
| B | [coordinator,builder,reviewer,operator] | [shaping,step-zero,build,deterministic-verify,adversarial-review,closure] | [source-inventory,spec-mutation,repo-read,repo-mutation,state-transition,control-call] |
| E | [coordinator,builder,reviewer,ci] | [build,deterministic-verify,adversarial-review,merge,closure] | [source-inventory,repo-read,repo-mutation,state-transition,control-call,receipt-validation] |
| M | [coordinator,builder,reviewer,kernel,host-adapter,ci] | [build,deterministic-verify,adversarial-review,closure,runtime] | [repo-read,state-transition,control-call] |
| K | [builder,reviewer,kernel,host-adapter,operator] | [build,deterministic-verify,adversarial-review,runtime] | [repo-mutation,state-transition,control-call,receipt-validation] |
| X | [coordinator,shaper,builder,reviewer,operator] | [shaping,step-zero,build,deterministic-verify,adversarial-review,merge,closure,runtime] | [spec-mutation,repo-mutation,state-transition,control-call,external-write] |
| C | [coordinator] | [stage-zero,shaping,step-zero,build,deterministic-verify,adversarial-review,merge,closure] | [source-inventory,spec-mutation,repo-read,repo-mutation,state-transition,external-write] |
| S | [coordinator,shaper] | [stage-zero,shaping,step-zero] | [source-inventory,spec-mutation,repo-read,repo-mutation,state-transition] |

## Proposed 72 new components

The unit prefix links to the reviewed C/L/U inventory, not a generated rule count. Component suffixes are the text following the slash. Each row selects one literal applicability preset.

| Unit/component | Class | Preset | Subject | Claim | Statement |
|---|---|---|---|---|---|
| C02/self-application | IJ | L | goal.ratification-ledger.self-application | a1-8-a1-9-self-application-recorded | L4 records September 7 ratification of the A1.8 ledger and A1.9 stable Entry keying, including the instruments' own required row; it adds no decision, gate, parcel, scenario or exit criterion. |
| C03/adoption | IJ | G | goal.infrastructure-adoption.ratification | l5-ratifies-detailed-infrastructure-adoption | L5 records September 7 adoption of INF-1 through INF-8, detailed carriers, D21 rationale and cold-deadline clarification, and U1 ownership; no parcel is added or dependency removed, and ratification is not acceptance evidence. |
| C04/events | IJ | L | goal.ratification-ledger.actual-events | stable-rows-record-actual-ratification | Every charter-changing amendment requires a ledger row even without a changed binding set; stable rows record actual ratification events, never inferred approval. |
| C04/unrowed | PR | L | goal.ratification-ledger.unrowed-amendment | unrowed-amendment-remains-proposal | An amendment without its required ledger row remains a proposal; neither a self-hash nor a generated row creates an actual developer ratification event. |
| C05/scope | IJ | G | goal.infrastructure-adoption.scope-and-evidence | detailed-carriers-and-distinct-adoption-evidence-govern | L5 adopts the eight recommendations through detailed carriers without new parcels or edges; the companion's older sections are provenance, A1 and A1.8/A1.9 remain recorded in L3/L4, and new source coverage requires a separately reviewed P0 corpus amendment; unchanged Round 6 is only baseline evidence. |
| C06/platform | IJ | B | host.first-release-platform-proof | d20-proof-remains-distinct-from-portability | Windows 11, Docker Desktop and the tested Claude Code launcher/plugin remain the D20 proving environment; portable development or CI elsewhere does not prove Windows parity; first release uses local IPC and a long-lived kernel, without universal remote-filesystem or network-latency claims. |
| C07/future | IJ | G | goal.future-hosting-separate-authority | future-hosting-needs-separate-ratification | Future coordinator, sidecar, retrieval and worker hosting require separately ratified designs; HCS and worker-fabric retain owners and gates; this goal imports neither HCS A3 nor hierarchical commissioning nor distributed execution scope, while preserving neutral contracts. |
| C08/carriers | IJ | B | infrastructure.platform-carriers | platform-proof-carriers-retain-exact-duties | P1 records environment and assurance semantics; P7/P14 implement local deployment; P16/P17 prove Windows mediation; P20 reports only demonstrated additional capabilities; P21 binds the resulting matrix to evidence. |
| C09/evidence | IJ | B | storage.native-volume-evidence | exact-native-volume-placement-is-recorded | First-release SQLite WAL uses a native Docker named volume; evidence records actual driver, backing filesystem, runtime version, mounts and ownership. |
| C09/substitution | PR | B | storage.network-volume-substitution | network-backed-name-cannot-satisfy-native-placement | A named volume backed by network storage cannot satisfy the native-volume acceptance condition. |
| C10/topology | PR | B | storage.current-aca-files-wal-topology | reject-current-aca-azure-files-wal-topology | Reject the current ACA with SQLite WAL on Azure Files topology; a different mount protocol does not satisfy same-host WAL requirements. |
| C10/change-contract | IJ | B | storage.changed-service-proof-and-scope | changed-state-service-needs-separate-proof | No permanent ACA ban or inherent PostgreSQL ownership conflict is claimed; a changed state service needs its own durability, authority, recovery and concurrency contract and proof; this adoption grants no migration, public ingress or kernel credential authority. |
| C11/carriers | IJ | B | infrastructure.storage-carriers | storage-carriers-retain-exact-duties | P9 owns storage and backup contracts, P14 deployment and operator lifecycle, and P15 recovery and concurrency proof on the exact placement. |
| C12/blanket | PR | X | operator.blanket-antivirus-exclusions | blanket-antivirus-exclusions-forbidden | Do not install blanket antivirus exclusions for D:\Repos, worktree roots, package caches or the Docker VHDX. |
| C12/measured | IJ | B | operator.measured-optimization-authority | optimization-is-profiled-and-operator-authorized | Profile hot paths first; evaluate Dev Drive with Defender performance mode; residual exclusions require narrow scope and measured impact; OS changes remain authorized operator actions rather than kernel capabilities. |
| C13/reproducible | IJ | B | build.independent-reproducible-verification | preserve-independent-lockfile-verification-and-work | Retain independent workspace verification and lockfile-based installs; shared cache does not remove installed trees; linked stores or package-manager changes need compatibility decisions; benchmark BuildKit caches, resource ceilings and install changes against cold/warm baselines before claims, preserving dirty and untracked work. |
| C14/carriers | IJ | B | infrastructure.build-carriers | build-carriers-retain-exact-duties | P0 records operational rules, P7/P14 own their respective configuration and benchmark evidence, and P21 reports measured outcomes. |
| C14/scope | PR | X | build.cross-package-scope-expansion | adoption-does-not-grant-cross-package-tuning | These carriers grant neither cross-package lockfile edits nor a workstation-tuning implementation parcel. |
| C15/independence | IJ | E | verification.independence-assurance-boundaries | accepted-verification-path-identifies-independence-boundary | Each accepted path identifies protected verifier/workflow, allowed credentials, builder inputs, runner lifecycle and independent negatives; separate machines alone are insufficient, and fresh local dependency isolation is not host-compromise resistance. |
| C16/retention | IJ | E | verification.evidence-retention-and-identities | retain-digested-retrievable-tested-identities | Retain artifacts with source, workflow, toolchain, image and configuration digests and retrieval/retention procedure; CI URLs are pointers with no assumed public access; pin actions/container inputs under the reviewed CI contract, never treating mutable labels or tags as tested identities. |
| C17/carriers | IJ | E | infrastructure.verification-carriers | verification-carriers-retain-exact-duties | P5/P8/P15 define clean-environment proof, P18 the independently controlled CI backstop, and P21 the retained evidence manifest. |
| C17/external | PR | X | verification.external-effect-authority | external-verification-effects-need-actual-authority | Publishing images, changing repository rules or provisioning runners requires actual external-effect authority; infrastructure adoption grants none automatically. |
| C18/reaffirm | IJ | L | latency.adopted-a1-reaffirmation | adopted-a1-remains-binding | A1 is ratified as D21 and L3; numeric budgets, two spans, revision-bound cache and D8 mapping remain binding; old not-yet-landed wording is historical. |
| C19/warm | PD | M | latency.warm-kernel-observation | warm-kernel-percentiles-are-recorded | Record warm kernel decision p50 at most 5 ms, p95 at most 20 ms and p99 at most 50 ms under D21; a budget miss alone is not a refusal. |
| C20/mediated | PD | M | latency.mediated-action-observation | inclusive-mediated-p99-is-recorded | Record D21 end-to-end mediated action p99 at most 150 ms, including adapter and transport; a budget miss alone is not a refusal. |
| C21/cold | PD | M | latency.cold-observation | first-call-observation-is-separate | Record first-call-after-startup separately against at most 2000 ms, never in warm percentiles and never as a deadline extension. |
| C22/deadline | PR | K | latency.hard-deadline-outage | decision-deadline-inherits-d8 | A single decision exceeding 1000 ms invokes the existing D8 outage posture. |
| C23/no-late-allow | PR | K | latency.no-late-allow-or-cache-broadening | late-allow-and-cache-broadening-forbidden | The cold observation allowance never extends the 1000 ms decision deadline or permits a late ALLOW; deadline overruns inherit D8 and cache eligibility is never broadened to meet a target. |
| C23/points | IJ | B | latency.observation-points-contract | p1-defines-observation-and-startup-boundaries | P1 specifies observation points and which startup work is outside the decision span. |
| C23/overrun | PD | M | latency.budget-overrun-record | budget-overruns-remain-recorded-obligations | Record budget overruns as obligations; distinguish observation-budget overruns from hard-deadline outage behavior. |
| C24/carriers | IJ | E | infrastructure.latency-carriers-and-ci-ceiling | latency-carriers-preserve-platform-proof-ceiling | P0 records reconciliation, P1 the contract, P16 the adapter, P17 both spans/cold/deadline behavior on D20, P18 only A1-authorized coarse CI regressions, and P21 evidence; coarse CI does not prove platform latency. |
| C25/baseline | IJ | M | measurement.baseline-evidence-honesty | no-unmeasured-baseline-claims | Do not assert unmeasured bottleneck rankings, Defender multipliers, model fit, prices or spend ratios; record workload, source/configuration, sample count, concurrency, cold/warm state, measurement boundaries and gaps. |
| C26/throughput | IJ | M | measurement.accepted-throughput | throughput-counts-accepted-delivery | Measure accepted parcels per hour using required green chain and human merge acceptance, not raw starts. |
| C27/cost | IJ | M | measurement.accepted-parcel-cost | unit-cost-includes-rework-and-defined-acceptance | Cost per accepted parcel includes rework and explicit components; with no acceptance report undefined unit cost. |
| C28/review | IJ | M | measurement.review-capacity | review-capacity-metrics-remain-distinct | Record reviewer queue delay, latency, tokens and rework rate separately from implementation performance. |
| C29/build | IJ | M | measurement.build-duration | install-and-verification-duration-is-observed | Record installation and verification duration to evaluate caching, disk and verification-chain work. |
| C30/spans | PD | M | measurement.distinct-latency-regressions | distinguish-kernel-and-adapter-regressions | Observe both A1 spans and distinguish kernel from adapter regressions. |
| C31/capacity | IJ | M | measurement.tested-capacity-boundary | capacity-claims-bind-tested-concurrency | Record SQLite contention and CPU, memory and disk pressure by concurrency to identify the tested capacity boundary. |
| C32/accounting | IJ | M | measurement.acceptance-accounting-and-unknowns | accounting-defines-window-components-and-unknowns | Define acceptance, window, currency/time basis and components; report no acceptance explicitly, unknown spend/telemetry as unknown, actual before/after evidence for improvements and no invented percentage target. |
| C32/credentials | PR | X | measurement.billing-credential-boundary | billing-observation-does-not-authorize-kernel-credentials | Do not add kernel credentials merely to collect billing data. |
| C33/carriers | IJ | M | infrastructure.measurement-carriers | measurement-carriers-retain-exact-duties | Coordinator records parcel/review economics, P7/P14 build paths, P10/P15 contention, P17 decision latency, and P21 the baseline and gaps. |
| C33/instrumentation | PR | K | measurement.instrumentation-authority-separation | instrumentation-stays-out-of-authority-semantics | Keep instrumentation out of authority semantics. |
| C34/manifest | IJ | E | corpus.exhaustive-disposition-manifest | complete-corpus-has-one-disposition-per-item | Deterministically enumerate the full in-scope corpus at a named revision; manifest unreadable, failed, unsupported and excluded items with reasons; retrieval prioritizes review but never defines completeness. |
| C34/retirement | PR | E | corpus.unswept-retirement | failed-or-unexamined-items-cannot-count-as-swept | A failed or unexamined in-scope item cannot support a rule-retirement sweep claim. |
| C35/eligibility | IJ | G | routing.current-policy-and-capability-evidence | routing-eligibility-is-verified-currently | The dated 476b8df shadow_routes observation is provenance; current routing policy and actual host capability determine eligibility, not an assumption that Cerebras or GPU routing is active. |
| C35/scope | PR | X | routing.unadmitted-model-or-local-scope | unselectable-models-and-unscoped-local-work-refused | Do not substitute a model the session cannot select; local GPU evaluation or a retrieval index needs separate scope admission. |
| C36/carriers | IJ | E | infrastructure.corpus-carriers | corpus-carriers-retain-exact-duties | P0 inventories obligations, P3 covers every read-reachable mixed evaluator, P19 requires complete sweep before retirement/promotion, and P21 binds identities, counts and outcomes. |
| C37/contract | IJ | B | recovery.backup-restore-contract-and-proof | recovery-defines-consistency-integrity-retention-and-restore | Source reproducibility is not runtime recovery; P9/P14 define consistent backup, integrity checks, protected destination, retention and operator restore; P15 exercises restore and ownership reconciliation using existing authority/lease contracts. |
| C37/refusal | PR | K | recovery.stale-duplicate-authority-and-dispatch | restore-refuses-stale-duplicate-authority-and-silent-dispatch | Exercise refusal of stale leases, stale authorization and duplicate owners; restore never silently restarts dispatch and adds no competing recovery-authority primitive. |
| C38/objectives | IJ | B | recovery.objectives-measurement-and-gate-scope | objective-claims-require-defined-needs-and-measurement | Define RPO/RTO from actual needs before success claims; record measured behavior and unresolved numbers without builder invention; name a blocking objective only at affected acceptance, preserving orthogonal work. |
| C39/revisit | IJ | G | infrastructure.measured-revisit-triggers | measured-continuity-capacity-economics-triggers-evaluation | Open separate infrastructure evaluation when continuity, manual regeneration, verifier demand, queue delay, contention, recovery or accepted-parcel cost justifies it. |
| C39/grant | PR | X | infrastructure.no-implied-spend-host-grant | revisit-does-not-grant-azure-spend-or-d20-expansion | Revisit triggers do not choose Azure, authorize spend or widen D20 automatically. |
| C40/carriers | IJ | B | infrastructure.recovery-carriers | recovery-carriers-retain-exact-duties | P9/P14 define backup and restore, P15 proves recovery, and P21 records limitations, objectives, results and revisit evidence. |
| C41/ownership | IJ | E | verification.u1-owner-producer-verifier-retention | u1-contract-production-verification-retention-have-owners | Coordinator resolves U1, P18 supplies reviewed producer evidence, P19 independently verifies it at promotion, and P21 retains evidence already produced. |
| C41/late | PR | E | verification.late-promotion-prerequisites | p21-cannot-first-produce-promotion-prerequisites | P21 cannot be the first producer of evidence required before promotion. |
| C42/gates | PR | E | verification.u1-dispatch-and-promotion-prerequisites | p18-dispatch-and-promotion-require-valid-prerequisites | Before P18 implementation dispatch require its independently reviewed concrete contract; missing or invalid evidence refuses promotion. |
| C42/contract | IJ | E | verification.u1-reviewed-contract-boundaries | u1-contract-covers-control-inputs-lifecycle-negatives-and-outcomes | The U1 contract binds protected verifier/workflow, builder-input limits, credentials, runner lifecycle, independent negatives, evidence identities/retention and bounded unavailable/unsupported outcomes; upstream evaluator work proceeds and no A2 draft is revived. |
| C43/window | IJ | M | measurement.coordinator-accepted-window-baseline | coordinator-records-green-chain-and-human-merge-acceptance | Coordinator records an observation window where acceptance requires the green chain and human merge gate, with elapsed time, queue delay, components and unknowns; zero accepted means undefined unit cost and no manufactured telemetry. |
| C44/ownership | IJ | B | recovery.acceptance-objectives-ownership | recovery-owners-define-objectives-before-affected-acceptance | P9/P14 define boundaries/objectives before affected acceptance, P15 measures recovery, unknown objectives do not block orthogonal work, and no objective is claimed met without measurement. |
| C45/precedence | IJ | G | infrastructure.detailed-carrier-precedence-and-serialization | detailed-carriers-and-serialization-ownership-govern | Detailed INF carriers govern over the companion section 16 summary; check packaging, HCS and worker-fabric ownership before affected edits. |
| C45/foreign | PR | X | infrastructure.foreign-goal-scope-import | no-foreign-goal-scope-import | Infrastructure adoption imports no foreign-goal implementation scope. |
| L01/continuation | IJ | C | goal.continuation.scoped-decision-authority | covered-coordinator-decisions-need-no-repeat-permission | The recorded developer instruction authorizes this coordinator's needed non-destructive decisions/actions within the existing goal without repeated permission requests. |
| L01/preserve | PR | G | goal.continuation.preserve-contract-and-guarantees | continuation-preserves-contract-scope-and-verification | Record source/contract changes before implementation and retain exact write boundaries, substantive fail-closed guarantees, complete verification and independent review. |
| L02/publication | IJ | C | goal.continuation.named-git-publication | named-git-publication-is-scoped-coordinator-authority | The named source, continuation and evidence branches may be published under the scoped coordinator exception to older external-effect wording; this is not a kernel grant. |
| L02/boundary | PR | X | goal.continuation.external-effects-and-human-merge | publication-does-not-authorize-external-effects-or-merge | No deployment, spend, credentials, repository-settings mutation or destructive cleanup authority is created; human Gate3 remains the merge boundary and tests/publication cannot satisfy it. |
| L03/shaping | IJ | S | goal.continuation.downstream-shaping | isolated-downstream-shaping-may-precede-dependencies | Preparatory downstream shaping may proceed in isolated documents while implementation dependencies remain pending. |
| L03/dependencies | PR | G | goal.continuation.implementation-prerequisites | drafts-do-not-satisfy-implementation-dependencies | A draft never satisfies a dependency; implementation dispatch preserves the charter graph and exact Allowed Files. |
| L04/preservation | PR | G | goal.continuation.source-preservation-and-ambient-boundary | preserve-worktrees-handoff-and-ambient-boundary | Preserve prior worktrees and published handoff; the explicitly published September 7 companion is historical provenance and creates no general authorization8 exception for unrelated ambient work. |
| U01/stable-ids | IJ | L | goal.ratification-ledger.stable-entry-identities | event-ids-are-stable-ordered-and-referenceable | Each ledger event has a unique stable ID assigned in order, never reused or renumbered; amendments and registry refer to its ID rather than date or position. |
| U02/original-event | IJ | L | goal.ratification-ledger.original-gate1-event | l1-preserves-original-ratification-and-dispatch-event | L1 records August 31 Original Gate1 ratification of D1-D17, P0-P21 graph, wave exits, scenarios and goal exits with its date and developer quote ratifying Gate1 and authorizing Gate2 dispatches; it creates no new ALLOW, principal or current gate satisfaction. |
| U03/reopen-event | IJ | L | goal.ratification-ledger.scoped-reopen-event | l2-preserves-scoped-reopen-and-resumption-event | L2 records August 31 R1-R13 re-ratification of D3, D7-D9, D13-D17, new D18-D20, amended graph and affected exits with the original quote resuming Gate2; R30 neither re-dates that event nor manufactures unrelated grants. |
| U04/a1-event | IJ | L | goal.ratification-ledger.a1-event | l3-preserves-a1-ratification-scope | L3 records September 1 A1 ratification binding D21, P1/P17, Wave0 exit, scenario14 and section13 items7/9; its amendment path is provenance, not a nineteenth source, new measurement or cache authorization. |

## Existing D21 and non-rule dispositions

C01 changes the full D21 row's rationale/value, not operative numeric text. Preserve existing `rule.fk-charter.d21.latency-budget` and `rule.fk-charter.d21.cache-revision-binding` identities and non-assurance fields as named in baseline. Both source bindings change; neither enters this new exception map. Existing hard-deadline/measurement grouping remains historical behavior; C22/C23 add explicit source-intent deadline duties on separate subjects. Keep the changed rationale's denial of universal network-round-trip claims in the complete inventory excerpt.

Eleven new headings are heading-only structural navigation, with no new normative rule. V01-V06 use only the existing three volatile regions, with no new extent. Owner-rule/five authority items remain direct body, owner-state remains region2, authorization8 remains outside volatility and the stop override remains under Stop conditions. No source item may be excluded just because it concerns continuation.

## Independent count and migration design

Baseline committed YAML inspection counted 1525 inventory items, 469 rules, 145 audit entries and 19 reconciliations. Source-first decomposition gives C02/C03 two new ledger rows, C05-C45 forty-one new charter body items and L01-L04 four loop paragraphs: 47 body additions. Ten charter headings plus one loop heading add eleven structural items. Thus 1525 + 47 + 11 = **1583 inventory items**. U01-U04 already exist and add no items. C01 and C04 change exactly two existing item values; no existing locator identity or item removal is intended. LineHint shifts are not locator digest changes.

The first table's C/L rows have **68 new rule components**, and U01-U04 add **4**, totaling **72 additions** and **541 rules**. Existing D21 contributes two changed binding digests, not new identities. No rule removal is intended. Audit explicitly adds all 49 touched governed C/L units plus 4 unchanged U units: 145 + 53 = **198 audit entries**. Existing entries retain historical expected dispositions except source-supported deltas separately enumerated. Exactly one appended migration yields **20 reconciliation records**. Eighteen sources remain fixed.

These are proposed expected numbers calculated before generation, conditional on review of this explicit mapping. If parser-level inspection disproves a locator/cardinality assumption, record and review the source-backed correction before accepting any generated count.

Load all 19 old reconciliations from exact prior registry-changing commit 66a514d and preserve their complete canonical forms. Append registry-rework-66a514d with prior commit/manifest, exact source snapshot, new manifest and source-backed adoption authority. Never rebuild registry-rework-40394be from new CURRENT_SNAPSHOT. Move it to historical required identities with existing canonical pin `307a1b563240107c5a12610e18b340e66f3be0621e6bc30b438ae79af91b4bfd`; preserve all old pins/prose/refs. Establish/protect the new shipped head and future-demotion pin without admitting a second unregistered append, forks, cycles, missing records or weaker Git binding.

## Later implementation verification, not performed here

Independently mutate every trusted exception axis: identity, typed locator, normalized value, subject/claim/statement, basis/complete refs, classification, decision/refusal code, severity, owner, assurance, each applicability axis, pairings, retirement and evidence. Wrong rules copying human-ratified or an approved shape refuse. Approved exception match never bypasses source/manifest/chain/protected-operation checks. Positive exact entries remain admitted, with source-intent assurance in resolver output and no new ALLOW. Existing mediated-profile and legacy negatives remain active; no global assurance-order edit.

For each INF section mutate actual governed bytes and observe the named source-binding failure. Independently test D21 budgets/cache/deadline, no late cold ALLOW, ledger event substitution, U01 stable-ID constraints, all carrier assignments, source-wide exclusion and each volatile region's governed-sibling/overlap laundering. Prove valid operational mutation still passes. Keep old R28 469-to-468-to-469 and 146-to-145 assertions against committed historical baseline data, while general protections run against the new sample. Preserve every old reconciliation canonically and refuse old-head rewrite while appending.

After coordinator baseline direct exit and code ruling: pre/post source hashes, deterministic generation twice, typecheck, full sequential test suite with direct exits and complete stdout/stderr, lint, full validate and exact-source sweep; preserve meaningful historical tests and add adoption coverage. Final source inventory, delta, generated hashes, candidate SHA and two fresh independent reviews precede human Gate3. This document reports no passing implementation or completed gate.

## Source-anchor appendix (independent text inspection, no registry generation)

Exact anchors, existing/fresh item identities and source-value hashes below were derived directly from the adopted source text using a small PowerShell read-only block enumeration. Existing baseline item IDs are preserved; new IDs follow the unchanged canonical locator/source algorithm including the source lineHint. Locator digests exclude lineHint. This is reviewed source mapping evidence, not a candidate registry or fixture.

### C01

- sourceId: `fk-charter`; itemId: `item.d21`; kind: `table-row`; lineHint: 97
- anchor: `D21`
- locatorDigest: `61f80dd868f286aaf636de375ee2d75e497635e1bd46431b9278686c21226123`
- valueDigest: `b0d9a5ebd522f7bbc42088141e1b42c56f07c12ed511c9fa532130058e02d877`

### C02

- sourceId: `fk-charter`; itemId: `item.fbed3af63b13`; kind: `table-row`; lineHint: 114
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L4`
- locatorDigest: `78e8b87907322cf1dae7fd214ab9079aa16ce6e1b3446709b2b0745d01b68024`
- valueDigest: `c79a6e083966ed83dbbe3d7655b8202713fe70c5df036e265c4cdd79e5bdc1a7`

### C03

- sourceId: `fk-charter`; itemId: `item.f081be090f04`; kind: `table-row`; lineHint: 115
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L5`
- locatorDigest: `99d6c696ddd05b97d9a97d61c1a19217c12d4e430d509e622dc4b0161bf2e405`
- valueDigest: `ab5dce965ea7e68dcfa2ac68e0c7cd1217949553daeace56cbaf2241005577d5`

### C04

- sourceId: `fk-charter`; itemId: `item.131a7863b940`; kind: `line-excerpt`; lineHint: 117
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:paragraph:3`
- locatorDigest: `c912b118b8d8d243968b8c5dae10899d27bc398ac8b8b78db6e872c0a3a1b36a`
- valueDigest: `463f75ca85843d1223f301c815e7e677b49e6642149003ea69d3c545853d1aa4`

### C05

- sourceId: `fk-charter`; itemId: `item.7df1436dcd98`; kind: `line-excerpt`; lineHint: 444
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07:paragraph:1`
- locatorDigest: `4fc0181749940bbea6964f4476056000687b7b48d6b147b013d2f3f761ceb097`
- valueDigest: `7cdb06b5d62c333331028f47aa79a9c5c01650a0d20ecd5d6e63ef1756751da4`

### C06

- sourceId: `fk-charter`; itemId: `item.6aa2e5c4c5e5`; kind: `line-excerpt`; lineHint: 448
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution:paragraph:1`
- locatorDigest: `507db9239273fcf016096325e685e782e0fb56857606132cffc10f739334171f`
- valueDigest: `718cdbdaf7eb1c33c65a3f1406dc4fba47bef84318c64619eddc87a3b336d3f3`

### C07

- sourceId: `fk-charter`; itemId: `item.0334ebc1c195`; kind: `line-excerpt`; lineHint: 455
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution:paragraph:2`
- locatorDigest: `76750020376f56a3b2104e2e961b27cd1f927c5b739ea41a5e51378332c55224`
- valueDigest: `b0ad07741b0f585054c316c55dccdd2381af5adbf835af80fe90d7634b7934cd`

### C08

- sourceId: `fk-charter`; itemId: `item.ac3a94701bf0`; kind: `line-excerpt`; lineHint: 463
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution:paragraph:3`
- locatorDigest: `138456051cb4fd46eafe91d1c2bd87afa290e91950b60d609fb6bdbf8936d731`
- valueDigest: `885da27a0ab8b8113ea9b8763b691a2ec1a87a92c52b2a1245643d2282be69f7`

### C09

- sourceId: `fk-charter`; itemId: `item.d5def2117d58`; kind: `line-excerpt`; lineHint: 470
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts:paragraph:1`
- locatorDigest: `0a8e2c74c5a03ac61c0e5ed6ae251dafb7dcd6394dbc0d66a64448fad9dc2d9f`
- valueDigest: `4e7fb00f29af7a0513a606af4d226b3b74eb9d225c38047fcec1731d832bde9f`

### C10

- sourceId: `fk-charter`; itemId: `item.aedd676e1a43`; kind: `line-excerpt`; lineHint: 475
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts:paragraph:2`
- locatorDigest: `55fcc70cc4db1c5e213cd9d14cbacc651112a562ab93f4d2485750676d1213de`
- valueDigest: `e80447cf1949f27260b56ba203ccf8180118f8100851e57bcd4bd462d7508bf2`

### C11

- sourceId: `fk-charter`; itemId: `item.5602e9c0f2d7`; kind: `line-excerpt`; lineHint: 484
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts:paragraph:3`
- locatorDigest: `0a1b97eb822375755436ef9db29b12acba5ac1cdd4faa526cf8237c075e243b6`
- valueDigest: `441f7a8234754e2bdf32a23516c4914d0dfc896b9608fff75c2599abdca2e994`

### C12

- sourceId: `fk-charter`; itemId: `item.0e5b4dca9153`; kind: `line-excerpt`; lineHint: 489
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions:paragraph:1`
- locatorDigest: `32a6cb9e553981dea8d87912c6d6fb20137853b59be59370c189dc3ca8ffe02f`
- valueDigest: `a5c60298e50b4f882c79410999acefa80364ab3389338a5611fdf4f0d1d4be71`

### C13

- sourceId: `fk-charter`; itemId: `item.823540249b94`; kind: `line-excerpt`; lineHint: 495
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions:paragraph:2`
- locatorDigest: `bcc0e0518e60a3da38a6b6bc215bd5ce828b637a69d3de4ff69f7676a5e3f88e`
- valueDigest: `cc2b292fc763639f0268a30fe790f4ecbb07ab814c5b66263859d47a65bf2bad`

### C14

- sourceId: `fk-charter`; itemId: `item.b760093ab1a0`; kind: `line-excerpt`; lineHint: 502
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions:paragraph:3`
- locatorDigest: `adba99a81cf6269c21d92fe6e5e383fe6f27e91af20c28250ee273f3250c307e`
- valueDigest: `f31ddd26f10d95b4600788f348ffc89a5f28197136a99905af72876990313df9`

### C15

- sourceId: `fk-charter`; itemId: `item.a903b0947304`; kind: `line-excerpt`; lineHint: 509
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence:paragraph:1`
- locatorDigest: `6e88bd6b51fa05309ba0e99398c6750b988d688b9ef4a7ec2e1cd261bd1689b1`
- valueDigest: `d270568d88576df98355eb7562487d2dc0257df8c39fa417ca5d7c810fac2539`

### C16

- sourceId: `fk-charter`; itemId: `item.738d073932ec`; kind: `line-excerpt`; lineHint: 516
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence:paragraph:2`
- locatorDigest: `094a7ac7e92e92dc4fe5cffb3f0ad3ea6ded12d9d19698a2ba93e326c7465e2b`
- valueDigest: `4d2c95c0c853e2a90b9f30e9f70e3df14737295f48ce7ae63a20c2b5d8348491`

### C17

- sourceId: `fk-charter`; itemId: `item.4d179a0e3c71`; kind: `line-excerpt`; lineHint: 522
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence:paragraph:3`
- locatorDigest: `5359f92c233b35fc364dc96fe56d9712c58dafa7f169d0cc9b1fccb541b07368`
- valueDigest: `1014689b6a7b2d7ee374948367b955d916e990c82d21839ebdb5706e05c75a0b`

### C18

- sourceId: `fk-charter`; itemId: `item.f0be0de850ce`; kind: `line-excerpt`; lineHint: 529
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:paragraph:1`
- locatorDigest: `c7a376dfd8f9db8c95f36ce318fec447931231b03993eb198c5afefad0dd1f9e`
- valueDigest: `991c6811c1aab8d9c4fb885bfceedf282617ab26201c985990fb33bd5c8b747e`

### C19

- sourceId: `fk-charter`; itemId: `item.85625a932abb`; kind: `table-row`; lineHint: 533
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:Warm kernel decision`
- locatorDigest: `f23b3dc45588fd8d2c1ff15f41e0b358717035de88e7f848fb4b41f10c5d79ed`
- valueDigest: `d28871e2cbd8dce8c907acd9b7f6b7f0a06672cdc3065b021393de8a91abf23a`

### C20

- sourceId: `fk-charter`; itemId: `item.c9672cddd1f2`; kind: `table-row`; lineHint: 534
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:End-to-end mediated action`
- locatorDigest: `f13ee5f18880bea1280640d7de00e17003f9753fc1be056d2f90b4a41f303be3`
- valueDigest: `705a2ed7f955548982cdbec85ba713c6dabbcdc3a29f96aec5685aa2a565a32b`

### C21

- sourceId: `fk-charter`; itemId: `item.db57a9d18103`; kind: `table-row`; lineHint: 535
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:First call after startup`
- locatorDigest: `abae1d5c7df77797b6406226ab381b1f01f32f159388fea3291e95ae8395c950`
- valueDigest: `10b89c57d7a263417d3b562160af061db1f92759902d68039a73b5d6bd7de0ae`

### C22

- sourceId: `fk-charter`; itemId: `item.8e7289313266`; kind: `table-row`; lineHint: 536
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:Per-decision hard deadline`
- locatorDigest: `ca0613157c2841ebcdb0b906a14cec6da63f8b42637ac6aa4328d286bea069ea`
- valueDigest: `185dd02060ac72766f09581849c2eac612423c9cec667a122e926ecd669f1b0e`

### C23

- sourceId: `fk-charter`; itemId: `item.90282758c3ec`; kind: `line-excerpt`; lineHint: 538
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:paragraph:2`
- locatorDigest: `e757d18986be5c67396e96fef5c118dcc1111b222cca1deb5cff469c08d278f4`
- valueDigest: `5e80bc865949837ad1a4e505ca8287e38152067f9430b6c901d952818943af21`

### C24

- sourceId: `fk-charter`; itemId: `item.bd0165a4630f`; kind: `line-excerpt`; lineHint: 540
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:paragraph:3`
- locatorDigest: `5a537c41cc8dce77ba8050734d8465d46fbd5a4f3af60f6f090f3be196969a86`
- valueDigest: `67b2b4486373bbeb158e9f488f38d414686d22188ddaa8edbf49640debcf409f`

### C25

- sourceId: `fk-charter`; itemId: `item.52a3074f5030`; kind: `line-excerpt`; lineHint: 547
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:paragraph:1`
- locatorDigest: `acf2245e477192d1eaf67f53aa95011ea775e1a67aec382761239ad0286fb354`
- valueDigest: `bb891c6487a2ed866169f56e4874f470cf9c1dedaf30715d94e9058f726abed8`

### C26

- sourceId: `fk-charter`; itemId: `item.7dd8dba116bc`; kind: `table-row`; lineHint: 554
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Accepted parcels per hour`
- locatorDigest: `e7ffe97e83b601f3f2d55ce268a1ef4c2ee296746784427387ec29574bfcd107`
- valueDigest: `222efd280053046fd30dfae35af8cf40bd26711f4960ccd2969dc03f4bde2cbf`

### C27

- sourceId: `fk-charter`; itemId: `item.5eb069676d8e`; kind: `table-row`; lineHint: 555
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Cost per accepted parcel, including rework`
- locatorDigest: `d2dbbe3bc702b47bd0f49946c7d2adfe90b561b9351c712a6d3d3a4b765d7450`
- valueDigest: `47138a879b48761a8fafc2c07338176e6fcff8d4daa448eb4b5b679ba2232f12`

### C28

- sourceId: `fk-charter`; itemId: `item.73e69c428a2f`; kind: `table-row`; lineHint: 556
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Reviewer queue delay, latency, tokens, rework rate`
- locatorDigest: `5bf02d2f5731fcf1e3e36144efac47a351fc881aa7000da48db15de7aefd0af2`
- valueDigest: `65047f7e4f0a3e535a34e30ff433a9812d84054074458b4cd08c485207b9d13a`

### C29

- sourceId: `fk-charter`; itemId: `item.065406de951b`; kind: `table-row`; lineHint: 557
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Installation and verification duration`
- locatorDigest: `e906c507f36f4fc0827a64bdb3f9da19021da303aa9000676fcc749a5d7bb4bf`
- valueDigest: `5fd42944a43c9bb90b7bc9e3100a59817c99a8cdd8212ef3695b38fa0a41be30`

### C30

- sourceId: `fk-charter`; itemId: `item.aac81e1754fb`; kind: `table-row`; lineHint: 558
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Both A1 latency spans`
- locatorDigest: `6b1553f523c87b1da8d44bc92dd8381417f9f21d01f12f58458deb12555027de`
- valueDigest: `5eb6cf7d7d15216d14ea590caac6304c899ecebab3b011b3055a9c5865d9b39a`

### C31

- sourceId: `fk-charter`; itemId: `item.a09a3029f031`; kind: `table-row`; lineHint: 559
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:SQLite contention and CPU/memory/disk pressure by concurrency`
- locatorDigest: `044ce673b268c5e69a21845aa9465c11386dcf1a96d26580a5b43dd94b715bde`
- valueDigest: `8ecc71533bc18b378202f053aaa6aa8b3aa416639a9d6534797d12c596a6efb3`

### C32

- sourceId: `fk-charter`; itemId: `item.5ab7daa95afc`; kind: `line-excerpt`; lineHint: 561
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:paragraph:2`
- locatorDigest: `ff62db4263f7b489738feb327cfa0618d37cf4ff7b34f27f18789309f99c1ca2`
- valueDigest: `445f858c17e0af3052acc8a9fd603ef7187c7fabe3def7810292f7050c1995fb`

### C33

- sourceId: `fk-charter`; itemId: `item.2483eaff6f43`; kind: `line-excerpt`; lineHint: 568
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:paragraph:3`
- locatorDigest: `fc425483e98452868b478b70dafb9d404f36da694b7b7e1736868d13e20f5f9d`
- valueDigest: `f7105e55003f855866e2119c3c0aa06514a49121fed66c57968389232e28dd5f`

### C34

- sourceId: `fk-charter`; itemId: `item.6bef45e68858`; kind: `line-excerpt`; lineHint: 575
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory:paragraph:1`
- locatorDigest: `9fdf866e282f94fa77dd0328a435b739e10b723c37ae66ca5f5672f50f9eb16b`
- valueDigest: `39ddd54a680143a68b4b8972db409c19c621124c1896cbb30b0969f7c69908c0`

### C35

- sourceId: `fk-charter`; itemId: `item.4ed03c71f99b`; kind: `line-excerpt`; lineHint: 581
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory:paragraph:2`
- locatorDigest: `9b15aa69861a9d316496e9807a496625c995139baee4bc0ff6a7c910d8d3503d`
- valueDigest: `33528b32a55f362f7110d1ee7de30168a5450502aaa87a93417666360039ae2f`

### C36

- sourceId: `fk-charter`; itemId: `item.9b7ce5dacd99`; kind: `line-excerpt`; lineHint: 588
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory:paragraph:3`
- locatorDigest: `b6065dcc34a4d4835e29aa1a1ee7cfd8bc456c68b2a1cb397e471127879f2b8a`
- valueDigest: `74a087d5a4c75bff1e3018f52aac808feaa0334f8dbf5e90774025145ac4bca7`

### C37

- sourceId: `fk-charter`; itemId: `item.462313b4d210`; kind: `line-excerpt`; lineHint: 594
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:1`
- locatorDigest: `222f517bba587d9b4c1ea30e52bc2da6a2eaad81367be14931f9be5a234ca040`
- valueDigest: `3b0961d85aeaf823a8147d9715ca2f9a45e2610c9a39de85025395c93ccbed4c`

### C38

- sourceId: `fk-charter`; itemId: `item.4f5a41ed9f1d`; kind: `line-excerpt`; lineHint: 601
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:2`
- locatorDigest: `0ec3da57a09d1b3a914f3f1c11572de9bad083ecc92d63b0704107b07dfcceb6`
- valueDigest: `e8325766788b7b4225bfbeab607a33e939f387e7fdd9002317f113771ef8553b`

### C39

- sourceId: `fk-charter`; itemId: `item.dbbeaf39106c`; kind: `line-excerpt`; lineHint: 607
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:3`
- locatorDigest: `1430d36ac3a1c88d723153036390ee017e7e57945f5130f59a353e1a08814e6b`
- valueDigest: `284f11242f5dd836e0fc27a99a27b80eade3d741b12e1329ff0e4e9dff84637b`

### C40

- sourceId: `fk-charter`; itemId: `item.96e53dfda63f`; kind: `line-excerpt`; lineHint: 612
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:4`
- locatorDigest: `fb04b02c3403d5da8b64abbf4b76fe25dd2620994fcbac5f1b0717f9555d3dbd`
- valueDigest: `2aa46edb2223185ac862bd192e1bba2b39e3883d0e55d2fd97933377dd582ecb`

### C41

- sourceId: `fk-charter`; itemId: `item.c3ba63d89fb1`; kind: `numbered-item`; lineHint: 617
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:1`
- locatorDigest: `4fd2857932514c488480e2dcecf7875cb68addd128ebeca1926dd11b9f08cfb0`
- valueDigest: `7cbc7c80c2d8cb38be0fe1fc2e514ff869a8d9d8c68d4bb9cb271eb50b50c8c6`

### C42

- sourceId: `fk-charter`; itemId: `item.f95b77d201bc`; kind: `numbered-item`; lineHint: 618
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:2`
- locatorDigest: `ae9b333a43a69b31ae81d42163e6eb8a8592153f9c29dd4fedb5faeea2eeb26f`
- valueDigest: `8e4d31552ac7a2706b75a6903045412225434c57dccda59eed43d09b53ed9f0b`

### C43

- sourceId: `fk-charter`; itemId: `item.24841a6c1279`; kind: `numbered-item`; lineHint: 619
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:3`
- locatorDigest: `7b9432b738c849536a0c19ab2eabf9b0656b0eb3d641978f2f2d9022a17a50aa`
- valueDigest: `4dd478551e4a12cb6d04b6c7ee420058bfb2f297f8ef47191b5e64858da59669`

### C44

- sourceId: `fk-charter`; itemId: `item.df7635424bf7`; kind: `numbered-item`; lineHint: 620
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:4`
- locatorDigest: `45e6510c07c337c30896e7920d2bd0a42254643084ef370bf7a7e6cfe6d7dd3f`
- valueDigest: `9aab73c2a8893a644d36436691dc8a70625745739bf5acd6526e97bb7a565e9e`

### C45

- sourceId: `fk-charter`; itemId: `item.6eca2202eee8`; kind: `numbered-item`; lineHint: 621
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:5`
- locatorDigest: `16df7355c481786387be5d21c80f02bccfacc4697d9a496b3c5b0db55f927761`
- valueDigest: `72c06f92ca6947cd47fb275407f254a6d04cef2e765fdec8eec570c4d83e20d7`

### L01

- sourceId: `fk-loop-directive`; itemId: `item.10bc39350722`; kind: `line-excerpt`; lineHint: 345
- anchor: `md-block:# Foreman Kernel — Coordinator Loop Directive > ## September 7 continuation authority:paragraph:1`
- locatorDigest: `1388a84f45baa2148f545913cc7c750ae1e2deb65ca58db0de74ed4824c00588`
- valueDigest: `f8efec1d5b8607c1af4634545b805ef6fff99f1b18a615575b37b10fd07a0146`

### L02

- sourceId: `fk-loop-directive`; itemId: `item.fe7ecb120fa5`; kind: `line-excerpt`; lineHint: 347
- anchor: `md-block:# Foreman Kernel — Coordinator Loop Directive > ## September 7 continuation authority:paragraph:2`
- locatorDigest: `f3e292ad7d8e772fecd9ba246b677ede160ad936e15a10e5c040a275479ab095`
- valueDigest: `9b9752cb3d78643f1331326ae5ae3e1f4deb24662b86f6140d2dbdc4cbbd9ada`

### L03

- sourceId: `fk-loop-directive`; itemId: `item.6bf290417cad`; kind: `line-excerpt`; lineHint: 349
- anchor: `md-block:# Foreman Kernel — Coordinator Loop Directive > ## September 7 continuation authority:paragraph:3`
- locatorDigest: `78d87f065b486d3c5105a6e067ad73165b4dd71c775653ab8a9630a3d9cab3c9`
- valueDigest: `af812328707a698461dbc9a2c221e7f2547060223d4457e1af23885cfe0f0a61`

### L04

- sourceId: `fk-loop-directive`; itemId: `item.06af83fccfb7`; kind: `line-excerpt`; lineHint: 351
- anchor: `md-block:# Foreman Kernel — Coordinator Loop Directive > ## September 7 continuation authority:paragraph:4`
- locatorDigest: `b80a41c8077ba49642c80926ed06aec01b20f21d550ac6d5547783f3bea2b45d`
- valueDigest: `99e68117bf269d57f9cb07c703cd81d2a210a974a41d71446ebb882b2c27ee0b`

### U01

- sourceId: `fk-charter`; itemId: `item.11307b6ee77e`; kind: `line-excerpt`; lineHint: 105
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:paragraph:2`
- locatorDigest: `db19b61d7acd1f6b1924ca7ad8fd946f15ef92e54e3e64f066a9543211352f8b`
- valueDigest: `5e7cd92bdf6e801b50e2b7e00850c9bb8525e7f420bb10240e945ab875ee4533`

### U02

- sourceId: `fk-charter`; itemId: `item.73c2e8af98c5`; kind: `table-row`; lineHint: 111
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L1`
- locatorDigest: `5be96aabdbd4616070df8699ac926a4054fb9cc4764558e5f8841dcd17f84a1e`
- valueDigest: `10227f07e504175c130d828b50c7924ce2fd5bd1aaf379c5044528a228e4daab`

### U03

- sourceId: `fk-charter`; itemId: `item.56c611d71350`; kind: `table-row`; lineHint: 112
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L2`
- locatorDigest: `9ed5b6bb5387081898d234a7234de6a00783a61789d39cd0b66b43dbb58b5459`
- valueDigest: `87ca8e25c8dc385f9a685eedd2cd26da688e706e1b08f3b313e23d5f8cea3643`

### U04

- sourceId: `fk-charter`; itemId: `item.cf301316d970`; kind: `table-row`; lineHint: 113
- anchor: `md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L3`
- locatorDigest: `878f7003a230b2948dba17fd503be70abaf6cfa489a57c014fe4c21a00fe4162`
- valueDigest: `77fca69f904dc731171e4d5263cb55848a94dea875d76d945fba243f330da5f7`

## Exact reserved identities and noncollision inspection

| Unit/component | Exact reserved ruleId |
|---|---|
| C02/self-application | `rule.fk-charter.fbed3af63b13.self-application` |
| C03/adoption | `rule.fk-charter.f081be090f04.adoption` |
| C04/events | `rule.fk-charter.131a7863b940.events` |
| C04/unrowed | `rule.fk-charter.131a7863b940.unrowed` |
| C05/scope | `rule.fk-charter.7df1436dcd98.scope` |
| C06/platform | `rule.fk-charter.6aa2e5c4c5e5.platform` |
| C07/future | `rule.fk-charter.0334ebc1c195.future` |
| C08/carriers | `rule.fk-charter.ac3a94701bf0.carriers` |
| C09/evidence | `rule.fk-charter.d5def2117d58.evidence` |
| C09/substitution | `rule.fk-charter.d5def2117d58.substitution` |
| C10/topology | `rule.fk-charter.aedd676e1a43.topology` |
| C10/change-contract | `rule.fk-charter.aedd676e1a43.change-contract` |
| C11/carriers | `rule.fk-charter.5602e9c0f2d7.carriers` |
| C12/blanket | `rule.fk-charter.0e5b4dca9153.blanket` |
| C12/measured | `rule.fk-charter.0e5b4dca9153.measured` |
| C13/reproducible | `rule.fk-charter.823540249b94.reproducible` |
| C14/carriers | `rule.fk-charter.b760093ab1a0.carriers` |
| C14/scope | `rule.fk-charter.b760093ab1a0.scope` |
| C15/independence | `rule.fk-charter.a903b0947304.independence` |
| C16/retention | `rule.fk-charter.738d073932ec.retention` |
| C17/carriers | `rule.fk-charter.4d179a0e3c71.carriers` |
| C17/external | `rule.fk-charter.4d179a0e3c71.external` |
| C18/reaffirm | `rule.fk-charter.f0be0de850ce.reaffirm` |
| C19/warm | `rule.fk-charter.85625a932abb.warm` |
| C20/mediated | `rule.fk-charter.c9672cddd1f2.mediated` |
| C21/cold | `rule.fk-charter.db57a9d18103.cold` |
| C22/deadline | `rule.fk-charter.8e7289313266.deadline` |
| C23/no-late-allow | `rule.fk-charter.90282758c3ec.no-late-allow` |
| C23/points | `rule.fk-charter.90282758c3ec.points` |
| C23/overrun | `rule.fk-charter.90282758c3ec.overrun` |
| C24/carriers | `rule.fk-charter.bd0165a4630f.carriers` |
| C25/baseline | `rule.fk-charter.52a3074f5030.baseline` |
| C26/throughput | `rule.fk-charter.7dd8dba116bc.throughput` |
| C27/cost | `rule.fk-charter.5eb069676d8e.cost` |
| C28/review | `rule.fk-charter.73e69c428a2f.review` |
| C29/build | `rule.fk-charter.065406de951b.build` |
| C30/spans | `rule.fk-charter.aac81e1754fb.spans` |
| C31/capacity | `rule.fk-charter.a09a3029f031.capacity` |
| C32/accounting | `rule.fk-charter.5ab7daa95afc.accounting` |
| C32/credentials | `rule.fk-charter.5ab7daa95afc.credentials` |
| C33/carriers | `rule.fk-charter.2483eaff6f43.carriers` |
| C33/instrumentation | `rule.fk-charter.2483eaff6f43.instrumentation` |
| C34/manifest | `rule.fk-charter.6bef45e68858.manifest` |
| C34/retirement | `rule.fk-charter.6bef45e68858.retirement` |
| C35/eligibility | `rule.fk-charter.4ed03c71f99b.eligibility` |
| C35/scope | `rule.fk-charter.4ed03c71f99b.scope` |
| C36/carriers | `rule.fk-charter.9b7ce5dacd99.carriers` |
| C37/contract | `rule.fk-charter.462313b4d210.contract` |
| C37/refusal | `rule.fk-charter.462313b4d210.refusal` |
| C38/objectives | `rule.fk-charter.4f5a41ed9f1d.objectives` |
| C39/revisit | `rule.fk-charter.dbbeaf39106c.revisit` |
| C39/grant | `rule.fk-charter.dbbeaf39106c.grant` |
| C40/carriers | `rule.fk-charter.96e53dfda63f.carriers` |
| C41/ownership | `rule.fk-charter.c3ba63d89fb1.ownership` |
| C41/late | `rule.fk-charter.c3ba63d89fb1.late` |
| C42/gates | `rule.fk-charter.f95b77d201bc.gates` |
| C42/contract | `rule.fk-charter.f95b77d201bc.contract` |
| C43/window | `rule.fk-charter.24841a6c1279.window` |
| C44/ownership | `rule.fk-charter.df7635424bf7.ownership` |
| C45/precedence | `rule.fk-charter.6eca2202eee8.precedence` |
| C45/foreign | `rule.fk-charter.6eca2202eee8.foreign` |
| L01/continuation | `rule.fk-loop-directive.10bc39350722.continuation` |
| L01/preserve | `rule.fk-loop-directive.10bc39350722.preserve` |
| L02/publication | `rule.fk-loop-directive.fe7ecb120fa5.publication` |
| L02/boundary | `rule.fk-loop-directive.fe7ecb120fa5.boundary` |
| L03/shaping | `rule.fk-loop-directive.6bf290417cad.shaping` |
| L03/dependencies | `rule.fk-loop-directive.6bf290417cad.dependencies` |
| L04/preservation | `rule.fk-loop-directive.06af83fccfb7.preservation` |
| U01/stable-ids | `rule.fk-charter.11307b6ee77e.stable-ids` |
| U02/original-event | `rule.fk-charter.73c2e8af98c5.original-event` |
| U03/reopen-event | `rule.fk-charter.56c611d71350.reopen-event` |
| U04/a1-event | `rule.fk-charter.cf301316d970.a1-event` |

Read-only literal inspection found 72 distinct proposed subjects, zero duplicates within this map, and zero exact subject matches against the 469 baseline rules. The resolver selects controlling rules by exact subject, so no proposed R30 subject can form a mixed R30/legacy controlling set under any applicability query. Later resolver controls must confirm this property on the committed candidate; this inspection does not claim those tests ran.

Component class totals: IJ=46, PR=21, PD=5; total=72.

## Corrected reserved-set validation contract (coordinator 8d78992)

This supersedes any interpretation permitting reserved mismatches to fall through. All 72 exact reserved IDs must exist. Each reserved entry must match its entire approved source/semantic/applicability/evidence shape and human-ratified assurance, or fail AUTHORITY_ESCALATION. Reserved missing/substituted identities fail the required-set check independently. Only unrelated legacy identities use ordinary class checks. Matching a reserved shape is not an early validation success: ordinary source, manifest, migration, protected-operation and retirement checks still run.

Required later controls recompute incidental binding/manifest digests after reverting IJ human-ratified to independently-verified, PD to detected, or PR to structural. Each reversion must fail the named authority-semantic check, not be admitted through legacy fallback. Also test required-set removal/substitution and copying approved assurance/shape to unrelated IDs. No global assurance-order/resolver change is permitted.
