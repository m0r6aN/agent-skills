---
ticket: PMC-P0
title: Pi capability and catalogue baseline
status: draft
owner: clinton.morgan
created: 2026-09-23
updated: 2026-09-23
risk: elevated
surfaces:
  - plugins/foreman-line/docs/goals/pi-model-configuration/
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
---

## Intent

Produce the reproducible evidence baseline that PMC-P1 and PMC-P2 consume:
Pi 0.86.1 configuration semantics, safe model-catalogue facts for every
corrected matrix identity, exact ID spelling per provider, tool and
structured-output compatibility, data-routing constraints, the A3 suitability
rubric that defines "comparable or higher", and a candidate role/lane/authority
map for owner ratification. This parcel writes evidence documents only. It
implements no resolver, changes no policy, and touches no host configuration.
Catalogue facts prove recorded configuration, never live provider availability.

## Constraints

Authority baseline is charter `D1`–`D8` as amended by **Amendment 01 (A1–A8)**
and **Amendment 02 (M1–M4)**; Amendment 02 governs on conflict. Gate 2 names
PMC-P0 only. Gate 3 remains human-owned. No Gate 2 exists for any later parcel.

Model identities are the Amendment 02 corrected set. `claude-opus-5` /
`anthropic/claude-opus-5` are the Opus routes; `claude-opus-5.5` does not exist
and must not be reintroduced. The typed routing/classification lane is
**refused / disabled-lane** and row 6 is single-provider; do not propose a
substitute classifier or promote an authority-bearing agent into that lane.

**Evidence acquisition is bounded to the established safe boundary.** Consume
the credential-free host-owner export at
`plugins/foreman-line/docs/goals/routing-currency-and-merit/host-owner-export/`
(catalog projection SHA-256
`b0c2dc8cf1412773b4ed4f17fcba10634a997f3b2b2b960d6dca200bdbb171fe`, manifest
`aa9b03faff555c6f5e98fd06b0f6e940269a5393f846877f57af562d1df692c3`, settings
`1024154d7245a52fb3cb82b3c8105a2249d5406daee03498f99cbed8ed137d1e`). Do **not**
read host `settings.json`, `models-store.json`, auth files, credential stores,
or `headers`; do not guess home directories; do not enumerate environment
variables; do not launch Pi, which may refresh or write its cache. RCM-P0
closed `blocked-secret-boundary` attempting host reads — do not repeat it.

That export is **not accepted evidence**: its manifest records
`freshnessBound: "not-accepted-by-coordinator"`,
`liveEvidence: "not-yet-accepted"`, and
`downstreamAuthority: "existing complete:false snapshot remains authoritative"`.
Treat freshness as unratified. Every derived fact inherits that standing and
must be labelled `static-conformance` per A6. A catalogue record is not uptime,
and an absent record is not the same as incomplete coverage.

The export is owned by the Routing Currency and Merit coordinator session
`e45b4d47-8455-49e9-9629-31c713c1b356`. Read it; never edit, re-export,
refresh, or re-hash it. Refuse if its digests do not match those above.

Use the current frozen frontmatter schema including `verification_class`. This
parcel introduces no schema field, executable, test, collector, or dependency.

## Acceptance Criteria

- [ ] **AC1 — Provenance.** Every factual claim cites an exact source path,
  field or record locator, acquisition digest, and a repeatable read command.
  Re-read each source independently rather than quoting this spec or the
  coordinator lint. No claim is credited by citation alone.
- [ ] **AC2 — Corrected identity resolution.** Each of the eleven surviving
  matrix identities resolves to exactly one provider key and one exact model ID,
  with its exact public `baseUrl`. Comparison is **case-sensitive and literal**:
  no case folding, alias substitution, dot/dash conversion, suffix stripping, or
  URL trimming. Zero matches, multiple matches, wrong provider, `:batch` or
  other variant suffixes, and URL mismatch each **refuse** with a named reason.
- [ ] **AC3 — Opus and Jev dispositions confirmed.** Independently re-derive
  L1 and L2: record that no `5.5`/`5-5` Opus spelling exists, that
  `anthropic/claude-opus-5` is present in both the catalogue and
  `KNOWN_FRONTIER_MODELS`, and that `typesafe/jev-1.13` is enabled in settings
  yet absent from the catalogue. Confirm or contradict; a contradiction
  escalates to the coordinator and does not silently revise Amendment 02.
- [ ] **AC4 — Enablement gap quantified.** Record, exactly, which matrix
  identities appear in `enabledModels` and which do not, with counts. Name
  PMC-P2 as the owner per M4. Do not enable anything or propose a settings edit
  as an executed change.
- [ ] **AC5 — Capability facts per identity.** For each resolved identity record
  allowlisted facts only: `contextWindow`, `maxTokens`, `input` modalities,
  `reasoning`, numeric `cost` fields with documented units, `thinkingLevelMap`
  coverage, and provider `checkedAt`. Mark every absent field `unknown`. Absence
  of a quality field is **not** evidence of model merit. Explicitly record
  whether tool-use and structured-output support are **derivable** from the safe
  field set; if they are not, record `capability-unverified` rather than
  inferring from model family or reputation.
- [ ] **AC6 — A3 suitability rubric.** Deliver a reviewed rubric defining
  "comparable or higher suitability" as required ranking inputs with types,
  units, and refusal semantics: data-class eligibility, required capability,
  independence obligation, available context, remaining budget, verified
  availability, recorded quality score, plus the documented stable tie-break
  order. Encode A3's per-lane provider rule, including the **asymmetric
  single-provider case** created by M2. State the evidence threshold below which
  a candidate is unrankable. The rubric is a proposal for PMC-P1 to encode, not
  an installed policy.
- [ ] **AC7 — Candidate role/lane/authority map.** Deliver the candidate
  mapping of all six matrix lanes to role, routing class, and authority cap,
  extending the current `coordinator | verifier | builder` vocabulary, and show
  each lane's frontier-only, independent-family, and human-gate obligations.
  Mark it **awaiting owner ratification** per A5.4; it is not frozen by this
  parcel and PMC-P2 may not start against an unratified map.
- [ ] **AC8 — Independent verification.** The verification record carries exact
  commands, tool versions, exit codes, artifact digests, before/after repo
  status, an allowed-path audit, negative cases, AC-by-AC evidence mapping, and
  remaining holds, plus **two** fresh frontier adversarial reviews (elevated /
  architecture-risk). A documented blocked or refused result is not a clean
  pass. Coordinator acceptance, not the builder's claim, releases the gate.

## Out of Scope

Implementing the resolver, launch boundary, break-glass path, preflight, route
receipt, or any schema, validator, fixture, or test; editing
`routing-policy.yaml`, `src/validator.ts`, `KNOWN_FRONTIER_MODELS`, templates,
or any plugin source; enabling models; changing Pi settings, host defaults,
provider registrations, or credentials; re-exporting, refreshing, or re-hashing
the host-owner export; making any provider call, network request, or spend;
freezing the role/authority map; editing the charter, amendments, coordinator
lint, loop directive, or `docs/goals/INDEX.md`; editing RCM, HAWF, GMF, or
boundary-routing goal files; promoting this spec's `status`; creating a
kickstarter, receipt, or `ShapingResult`; dispatching reviewers or builders;
committing, merging, or releasing.

## Context & References

- [Charter](../../goals/pi-model-configuration/charter.md)
- [Plan review](../../goals/pi-model-configuration/plan-review-findings.md)
- [Amendment 01](../../goals/pi-model-configuration/gate-1-amendment-01.md)
- [Amendment 02](../../goals/pi-model-configuration/gate-1-amendment-02.md)
- [Coordinator lint](../../goals/pi-model-configuration/coordinator-lint-pmc-p0.md)
- [Loop directive](../../goals/pi-model-configuration/loop-directive.md)
- [Spec convention](../../SPEC-CONVENTION.md)
- [Goal index](../../goals/INDEX.md)
- [RCM charter](../../goals/routing-currency-and-merit/charter.md)
- [RCM-P0 precedent](../done/RCM-P0-current-instance-recon.md)
- [Routing policy](../../../routing-policy/routing-policy.yaml)
- [Frontier registry](../../../routing-policy/src/validator.ts)
- [Pi configuration contract](../../../routing-policy/src/pi-openrouter.ts)
- [Permission profiles](../../../permission-profiles/permission-profiles.yaml)

## Allowed Files

Create only these four evidence artifacts:

- `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-capability-baseline.md`
- `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-suitability-rubric.md`
- `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-role-lane-map.md`
- `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-verification.md`

These are documentation, not executable contracts. Existing artifacts are not
overwritten without coordinator disposition; a new evidence version requires an
exact-path amendment. During this shaping session the only authorized output is
this spec file itself — none of the four artifacts is created now.

## Forbidden Files and Effects

Every path outside Allowed Files is a forbidden write, specifically: this goal's
`charter.md`, `gate-1-amendment-01.md`, `gate-1-amendment-02.md`,
`plan-review-findings.md`, `coordinator-lint-pmc-p0.md`, `loop-directive.md`;
`docs/goals/INDEX.md`; the entire
`docs/goals/routing-currency-and-merit/` tree including `host-owner-export/`;
HAWF, GMF, and boundary-routing goal files; `docs/SPEC-CONVENTION.md`; all
`routing-policy/` files; `templates/`; `foreman-config/`; `permission-profiles/`;
every other parcel spec; and all plugin source, schemas, tests, manifests,
locks, hooks, and receipts.

Forbidden reads: host `settings.json`, `models-store.json`, auth or credential
files, credential stores, `headers` fields, and any secret-bearing URL.

Do not invoke `evaluateRouting`, `prepareDispatch`, or `executeDispatch` to
"inspect" routing — the evaluator writes a receipt and dispatch can create
worktrees and effects. Read code and calculate from safe facts instead. No
dependency installation, generated output, network request, watcher, or
automation is authorized.

## Evidence Procedure and Artifacts

Proceed in order: bind and digest-verify sources; resolve identities; derive
capability facts; build the rubric; draft the role map; verify independently.

### Capability baseline

For each of the eleven surviving matrix identities, one row: lane, provider key,
exact model ID, exact `baseUrl`, presence verdict, allowlisted capability facts,
`unknown` markers, source record locator, and `capability-unverified` flags for
tool-use or structured output that the safe field set cannot establish.

Record separately: the disjoint enabled-vs-matrix sets with counts (AC4); the
Opus and Jev re-derivations (AC3); the `opencode` versus `opencode-go`
namespace observation, without treating equal endpoints as licence to alias
providers; and variant-suffix identities such as `:batch` as observations that
are never eligible candidates.

### Suitability rubric

Each ranking input gets a name, type, unit, source of truth, refusal semantics,
and whether PMC-P0 evidence can populate it today. Where it cannot — most
likely `recorded quality score` and `verified availability` — say so plainly and
route it to A6's `live-availability` or `model-quality` state rather than
inventing a proxy. Define the stable tie-break order explicitly and show it
terminates for the asymmetric row-6 case.

### Candidate role/lane map

One row per lane: role name, routing class, authority cap, frontier-only
obligation, independence obligation, human gates, and the lane's declared
provider rule under A3. Show how the six lanes reconcile with the existing
three-role vocabulary and name every collision with current `roles:` content.
Mark the whole artifact `awaiting-owner-ratification`.

## Dependencies, Consumers, and Collision Risk

PMC-P0 depends on the ratified charter plus Amendments 01 and 02, the safe
export's digest-verified availability, and coordinator disposition on freshness.
It does not depend on unwritten P1 code.

PMC-P1 consumes the rubric and identity facts as contract requirements,
fixtures, and refusal cases — only after coordinator acceptance. PMC-P2 consumes
the ratified role map, the enablement gap (M4), and launch-boundary
requirements. PMC-P3 consumes vocabulary for canon. PMC-P4 consumes exposure
cases and owns legacy-representation removal. No consumer may treat these
artifacts as installed policy, a live allowlist, an availability guarantee, or
permission to dispatch.

**Collision.** PMC-P1 and PMC-P2 must change `routing-policy/` surfaces owned by
the live RCM coordinator session `e45b4d47-8455-49e9-9629-31c713c1b356` (state
`RCM-P0-closed-incomplete`, RCM-P1 held). PMC-P0 does not collide on files. Wave
1 must be sequenced with that coordinator before its Gate 2 — never co-owned.
Record the collision; do not attempt to resolve it from inside this parcel.

## Security Gate and Stop Conditions

Elevated risk and `architecture/risk` require **two** independent fresh frontier
adversarial reviews, one focused on evidence acquisition and leakage. The
`builder-architecture` profile does not widen Allowed Files or authorize
credential reads. This shaping session dispatches no reviews and no builders.

Stop and report on: a host-owner-export digest mismatch or missing file; any
route that would read a credential; ambiguous, duplicate, or multi-match
identity; endpoint mismatch; evidence contradicting Amendment 01 or 02; a
required ranking input that cannot be populated without a provider call; an
unauthorized write or effect; a file collision with RCM or another live goal; or
pressure to freeze the role map inside this parcel. Record safe refusal detail
only; never quote a suspect payload. No repeated attempt may bypass a refusal.

## Verification Plan

Run from the explicit repository root. Capture every exit code immediately.

```bash
node -v
git rev-parse HEAD
git status --short --untracked-files=all
git diff --check

X=plugins/foreman-line/docs/goals/routing-currency-and-merit/host-owner-export
sha256sum "$X/catalog-projection.json" "$X/settings-projection.json" "$X/export-manifest.json"

# AC3 — Opus and Jev re-derivation (expect: no 5.5/5-5; opus-5 present; jev absent)
grep -o '[a-z0-9./-]*opus[a-z0-9./-]*' "$X/catalog-projection.json" | sort -u
grep -c 'claude-opus-5\.5\|claude-opus-5-5' "$X/catalog-projection.json"
grep -n 'jev-1.13' "$X/export-manifest.json" "$X/settings-projection.json"
grep -n 'claude-opus-5' plugins/foreman-line/routing-policy/src/validator.ts

# AC4 — enablement gap
grep -A 10 '"enabledModels"' "$X/settings-projection.json"

# AC2/AC5 — per-identity resolution and capability facts
grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' "$X/catalog-projection.json" | sort -u

# current role vocabulary and tier order for AC7
grep -n 'roles:\|model_tiers:\|ORDER IS' plugins/foreman-line/routing-policy/routing-policy.yaml
```

Negative cases, by in-memory copies of safe facts only — never by mutating a
source: absent identity; duplicate identity; same ID under another provider;
`:batch` or other variant suffix; `baseUrl` trailing-slash and different-path
mismatch; case-folded near-match; stale and future timestamps; absent
`thinkingLevelMap`; unknown cost units; changed digest. Each must produce an
explicit named refusal, with missing optional facts marked `unknown` rather than
invented.

Draft self-check: run the spec-linter CLI against this exact file with
`--repo-root` explicitly supplied, and the shaping package's
`selfCheckDraft`. Both layers must pass. Use preinstalled dependencies only; no
installation is authorized. The self-check is **advisory** — coordinator lint
remains the sole authority and a passing self-check never authorizes promotion.

Mandated reviewer focus questions:

- Can any step in the acquisition path read a credential before redaction, or
  reach a host file the constraints forbid?
- Does any claim upgrade unratified snapshot facts into live availability,
  catalogue presence into uptime, or absent records into verified incompleteness?
- Do the identity joins reject aliases, case-folded near-matches, `:batch`
  variants, duplicates, and `baseUrl` mismatches under literal comparison?
- Does the rubric invent a proxy for a ranking input that genuinely requires a
  provider call, instead of routing it to A6 `live-availability`/`model-quality`?
- Does the tie-break order provably terminate for the asymmetric,
  single-provider row-6 lane created by M2?
- Could a later parcel mistake the role map for ratified authority, or the
  capability baseline for permission to dispatch or to enable models?
- Does anything here silently revise Amendment 02 rather than escalating a
  contradiction to the coordinator?

## Session Handoff

The shaper returns this draft path, base commit, exact changed-file list,
commands and results, and unresolved flags — no commit of evidence artifacts, no
kickstarter, no status promotion, and no `ShapingResult` file (per the RCM-P0
precedent for coordinator-run goal parcels). The coordinator lints before a
fresh builder restates its four-file scope and safe-source boundary at Step 0.
That builder returns AC-by-AC evidence, source and digest references, a
refusal/hold list, tool versions, and exact command exits. Coordinator plus two
independent reviewers decide acceptance and whether PMC-P1 may consume the
evidence. Wave 1 requires its own Gate 2 and RCM sequencing. Freshness
acceptance and safe-source availability are execution prerequisites, not
outcomes established by this shaping session.
