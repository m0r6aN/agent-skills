---
ticket: RCM-P0
title: Current-instance routing reconnaissance
status: done
owner: clinton.morgan
created: 2026-09-20
updated: 2026-09-20
risk: elevated
surfaces:
  - plugins/foreman-line/docs/goals/routing-currency-and-merit/
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
---

## Intent

Re-derive Routing Currency and Merit's F1–F6 against the current instance and
produce reviewable evidence for the coordinator and later parcels. Deliver a drift
report, versioned catalog facts, environment map, and verification record without
implementing code or correcting host configuration. Historical observations are
hypotheses; a snapshot proves recorded facts, not live provider availability or
dispatch authority. This completed evidence parcel is not a runtime implementation
and does not release downstream P1 while its live-source holds remain.

## Constraints

Authority baseline is `96b6e39d9845f15b52057ffa5e73147fc02ae5e7`: Gate 1 includes
amendments A–K and queue amendments 1–6; Gate 2 names only RCM-P0/P1. Gate 3 remains
human-owned. This evidence parcel is not a runtime dispatch path. The coordinator's subsequent Step-0
ruling explicitly makes HAWF/INDEX reconciliation an in-scope P0 evidence item,
not a shaping blocker; it does not waive the downstream ownership gate.

Boundary-routing D1–D10, RCM D1–D14, and GMF contracts remain unchanged. The repo
policy owns routing; classification precedes capability and tier order. No price
sorting, fallback substitution, promotion, network/MCP catalog call, provider spend,
or host correction is authorized here. In-memory calculations and existing
read-only tools are permitted; no executable, test, schema, or collector is added.

Use the current frozen frontmatter schema, including `verification_class`.
RCM-P2 owns introducing `inputs`, `min_context`, `thinking_level`, and `expertise`;
P0 does not prematurely add rejected fields. Evidence inputs are text; any later
runtime requirement derivation belongs to P2/P4/P4A, not this fact record.

### Safe source acquisition

At execution Step 0, name the exact repository, installed plugin, catalog, and Pi
settings sources through coordinator-supplied absolute paths. Do not guess home
directories, enumerate environment variables, search credential stores, or launch
Pi (which may refresh/write its cache). Record source roles and safe locators in
the environment map. A template is not proof of an installed configuration.

Before reading content, establish a reviewed, already-available field-access
method that cannot read credential values, or obtain a credential-free export
produced by the host owner and bound to the current source/time. Only allowlisted
fields below may reach the agent. Bulk `Get-Content`, JSON parsing of an entire
mixed host document, post-read redaction, copying, and whole-file hashing of such
a document are forbidden: they would already have read secrets. Do not implement
a new extractor in P0. If safe access or source binding cannot be established,
record `blocked-secret-boundary` and incomplete evidence; never claim live proof.

Allowed catalog facts: provider key, model `id`, `provider`, public `baseUrl`,
`api`, `input`, `reasoning`, `contextWindow`, `maxTokens`, numeric `cost` fields
with documented units, `thinkingLevelMap`, provider `checkedAt`, safe field-name
inventory, and counts. Allowed settings facts: `defaultProvider`, `defaultModel`,
`enabledModels`, `defaultThinkingLevel`, provider keys and public `baseUrl` values.
Do not read `headers`, credential values/references, auth files, arbitrary `compat`
payloads, or unrelated settings. Reject secret-bearing URLs before they reach the
agent; never publish userinfo, query tokens, private endpoints, or PII. Schema/key
inventories must likewise come from the safe access boundary.

## Acceptance Criteria

- [ ] **AC1 — Provenance:** Every factual claim links to a current disk source,
  observation time, safe digest, exact field/line reference, and repeatable command
  or owner-export procedure. Re-read sources for independent verification. No
  historical count, identity, capability, or defect is credited by quotation alone.
- [ ] **AC2 — F1–F6:** Each row has `reproduced`, `not-reproduced`, or `blocked`,
  measured results, comparison, and disposition using the procedure below.
  Discard non-reproducing claims; escalate any invalidated locked decision.
- [ ] **AC3 — Exact identity:** Resolve each pair to exactly one provider key and
  exact model ID, with exact public `baseUrl` agreement against an explicitly
  identified approved configuration source. Zero/multiple matches, wrong provider,
  ambiguous unqualified IDs, unknown authority, and URL mismatch refuse. No case
  folding, alias substitution, dot/dash conversion, suffix removal, or URL trimming.
- [ ] **AC4 — Ownership:** Record HAWF/INDEX evidence and coordinator disposition
  or escalation. Escalation satisfies reporting only; unresolved authority blocks
  P1/downstream dispatch. Do not edit INDEX or take ownership of HAWF.
- [ ] **AC5 — F4/Jev:** Inventory every enabled/default reference. Record exactly
  `openrouter` / `typesafe/jev-1.13` / `https://openrouter.ai/api/v1` and its
  recommend-only routing/classification boundary. Absence or unverifiable identity
  produces an explicit disabled/refused-lane disposition and correction proposal;
  it does not install a substitute or assert a runtime disable was implemented.
- [ ] **AC6 — Snapshot:** Deliver the versioned fact record with source, timestamp,
  digest, completeness and freshness semantics below. Missing, stale, partial,
  changing, or mismatched inputs refuse positive consumption; retained historical
  facts remain evidence only. No snapshot is installed as dispatch authority.
- [ ] **AC7 — Safety:** No credential values are read, emitted, hashed, or retained.
  Only the four allowed evidence files change during parcel execution; no code,
  host, policy, control-document, receipt, or dependency write occurs.
- [ ] **AC8 — Independent verification:** Verification records exact commands,
  versions, exit codes, safe results, artifact digests, AC mapping, and two fresh
  frontier adversarial reviews. A documented blocked result is not a clean pass.
  Coordinator acceptance, not the worker's own claim, releases the evidence gate.

## Out of Scope

Implementing the reader/projector, resolver, preflight, refresh automation, settings
projection, receipt/replay contract, or merit corpus; closing F1/F2 through execution;
changing tier order, prices, schemas, policy, host defaults, or providers; creating
a kickstarter, dispatching, committing, merging, publishing, or promoting this draft.

## Context & References

- [RCM charter](../../goals/routing-currency-and-merit/charter.md)
- [Plan review](../../goals/routing-currency-and-merit/plan-review-findings.md)
- [Ratified amendments](../../goals/routing-currency-and-merit/gate-1-reopen-proposal.md)
- [Loop directive](../../goals/routing-currency-and-merit/loop-directive.md)
- [Spec convention](../../SPEC-CONVENTION.md)
- [Boundary routing](../../goals/foreman-line-boundary-routing/charter.md)
- [Goal index](../../goals/INDEX.md)
- [HAWF charter](../../goals/heterogeneous-agent-worker-fabric/charter.md)
- [HAWF directive](../../goals/heterogeneous-agent-worker-fabric/loop-directive.md)
- [Routing policy](../../../routing-policy/routing-policy.yaml)
- [Evaluator](../../../dispatch/src/routing-eval/index.ts)
- [Dispatch caller](../../../dispatch/src/approval-cli/index.ts)
- [Pi configuration contract](../../../routing-policy/src/pi-openrouter.ts)
- [Pi template](../../../templates/pi-openrouter-routing.json)
- [Foreman configuration](../../../foreman-config/src/types.ts)
- [Config template](../../../templates/foreman-config.yaml)
- [GMF evidence contract](../../goals/governed-model-fleet/gmf-p1-artifact-evidence-manifests.md)

## Allowed Files

For the later accepted reconnaissance parcel, create only these evidence artifacts:

- `plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-drift-report.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-catalog-snapshot.v1.json`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-environment-map.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-verification.md`

These are data/documentation, not executable contracts. Existing artifacts must
not be overwritten without coordinator disposition; a new evidence version needs
an exact-path amendment. During this shaping session, the only authorized output
is `plugins/foreman-line/docs/specs/active/RCM-P0-current-instance-recon.md` itself;
none of the four evidence artifacts is collected or created now.

## Forbidden Files and Effects

Every path outside Allowed Files is forbidden for execution writes, specifically
the goal's `charter.md`, `plan-review-findings.md`, `gate-1-reopen-proposal.md`,
`loop-directive.md`; `plugins/foreman-line/docs/goals/INDEX.md`; both HAWF and
boundary-routing charters/directives; `plugins/foreman-line/docs/SPEC-CONVENTION.md`;
`plugins/foreman-line/routing-policy/routing-policy.yaml`;
`plugins/foreman-line/templates/pi-openrouter-routing.json`;
`plugins/foreman-line/templates/foreman-config.yaml`; and `foreman/config.yaml`.
All plugin source, schemas, tests, package manifests/locks, hooks, receipts,
kickstarters, other parcel specs, installed plugin files, host `settings.json`,
`models-store.json`, auth/credential files, and environment configuration are also
forbidden writes. Credential stores are forbidden reads as well.

Do not invoke `evaluateRouting`, `prepareDispatch`, or `executeDispatch` to
"inspect" routing: the current evaluator writes a receipt, and dispatch can create
worktrees/effects. Read code and calculate from safe facts instead. No dependency
installation, generated output, network request, watcher, or automation is needed.

## Evidence Procedure and Artifacts

Proceed sequentially: establish safe sources and source stability; capture facts;
re-derive findings; record ownership/Jev dispositions; independently verify.

### Drift report

Each finding records charter hypothesis, current observation, source references,
calculation, verdict, consequence, and accountable next parcel/human. Include:

| Finding | Required derivation (historical values are comparison targets only) |
|---|---|
| F1 | Read economy order, class/classification membership and evaluator predicates; exact-match Nemotron's OpenRouter record and `input`. Establish whether text-only remains first eligible for image-bearing boilerplate. Distinguish static exposure from actual execution, which P4/P4A must prove. |
| F2 | Repeat for `z-ai/glm-5.3`, including its measured standard-tier position. Do not call the fourth entry the selected primary; record when earlier eligibility exclusions could expose it. |
| F3 | Compare dated policy-comment rates with safe catalog rates, separately for input/output. Record USD per 1M tokens and evidence for source units; compute `(new-old)/old*100`. Unknown units/prices or zero denominators refuse comparison. Do not compare rates with `ceiling_usd`. |
| F4 | Enumerate every current enabled/default reference and exact match count, provider, endpoint and reason for absence/refusal; calculate missing/total without assuming 4/5. Add Jev's disposition and a non-executing correction proposal with separately authorized human ownership. |
| F5 | Compare configured `opencode` and `opencode-go` namespaces/endpoints with their catalog keys and approved config source. Record each mismatch independently; equal endpoints do not permit provider aliasing. Unknown approved endpoint means unresolved, not approved-by-cache. |
| F6 | Derive the distinct policy-tier ID set and join every ID to OpenRouter at the exact approved endpoint. Report present/total, duplicates, absent and mismatched rows, including classification references outside tiers. Do not assume 15/15 or claim provider uptime. |

Re-derive supporting charter observations too: provider/model counts, field-name
inventory, modalities, output-modality absence, reasoning coverage, context ranges,
thinking-map coverage, provider refresh times, and default thinking level. Record
unknown/redacted field coverage explicitly; absence of visible quality fields is
not proof of model merit. Inventory sentinel prices, meta-routers and variant IDs
as observations for P1, never as new eligible candidates.

The HAWF section cites both current goal-local controls and INDEX at exact hashes.
Propose the stale pickup row's reconciliation to the superseded, non-dispatchable
status; name the RCM coordinator as ruling owner, not HAWF owner. Record ruling
reference/time, `reconciled` or `escalated-unresolved`, and downstream hold. Do not
claim INDEX was corrected when only a correction proposal exists.

### Catalog fact record v1

The JSON envelope has `recordVersion: 1`, `purpose: "recon-evidence-only"`,
`repoCommit`, `observedAtUtc`, `sourceRefs`, `policySha256`, `complete`,
`incompleteReasons`, `freshness`, `providers`, `models`, and `settingsFacts`.
Each source reference carries role, safe locator, UTC acquisition time, safe
projection SHA-256, extraction method/version, source-stability evidence and field
coverage. Each provider carries exact key/baseUrl, `checkedAtUtc`, model count and
completeness. Each model carries its provider/id/baseUrl tuple, allowlisted facts,
explicit rate units, source reference/record locator, and missing-field markers.
`settingsFacts` contains only the allowlisted projection and its source reference.

Bind approved endpoint/config sources separately from observed settings. No raw
headers, secrets, arbitrary metadata blobs, or fictional execution/GMF receipt
fields. Preserve observed array order; never sort candidate lists to infer routing.
Treat duplicate provider/model keys, missing expected provider coverage, malformed
records, unknown units/timestamps, and excluded required facts as incomplete.
Deliberately excluded credential-bearing fields are not required routing facts.

`freshness` records fixed `evaluatedAtUtc`, `maxAgeSeconds`, its coordinator ruling
reference, oldest required source/provider fact time, computed age and verdict.
Daily refresh is not itself a ratified TTL: propose 86400 seconds for evidence
acceptance; absent an explicit accepted bound, refuse freshness acceptance. Future
times, missing times, age exceeding the bound, or a changed source between capture
and verification refuse. Re-reading an old cache does not reset its age.

Hash only safe projection bytes; record encoding/line endings and procedure so
the digest is reproducible. The verification record stores SHA-256 of the exact
UTF-8 snapshot bytes (no self-hash field). Any serialization change invalidates
that digest. Immutable historical evidence can be replayed at its recorded time;
current consumption must re-evaluate freshness. Missing/digest-mismatched/stale/
partial/namespace-mismatched records produce named evidence refusals, not a
fallback to raw cache, settings, network, or a previous snapshot. These refusal
labels describe P0 evidence decisions, not already-implemented runtime errors.

### Environment map and verification record

Map repository commit/root role, installed plugin version/source and parity,
tool/runtime versions, explicit cache/settings roles, approved configuration
authority, freshness, read method, and owning actor. Report repo versus installed
drift; never infer installation parity from the checkout. Do not include private
hostnames or identifying host paths; use safe role locators with an owner-held
exact-path binding for independent reproduction.

Verification records command text and exits, safe source reacquisition procedure,
digests, before/after repo status, host metadata stability (without content reads),
allowed-path audit, negative cases, AC evidence references and remaining holds.
Stable timestamps alone do not prove absence of writes; combine source stability
with a complete command/effect log. No blanket "all claims verified" when a source
was unavailable or a freshness bound remains unratified.

## Dependencies, Consumers, and Collision Risk

P0 depends on the ratified controls, coordinator ownership ruling, safe source
access and explicit freshness disposition; not on unfinished P1 code. P1 may
consume accepted safe facts as reader requirements/fixtures and refusal cases.
P2/P3 consume field coverage and provenance requirements, not automatic vocabulary
or schema approval. P4/P4A/P5 consume exposure cases, exact identity constraints
and snapshot requirements; they own runtime enforcement and end-to-end closure.
P6/P7 consume drift and correction proposals without host-write authority. P8A
owns receipt/replay contracts; P8/P9 receive no merit evidence from this catalog.
P10 may cite accepted evidence and unresolved holds, never invent closure.

The fact record is a P0 evidence format, not a silently frozen cross-package API.
Later production formats require their own ratified specs and explicit conversion
and validation. No consumer may treat P0 as a live allowlist, installed policy,
availability guarantee, GMF execution receipt, or permission to dispatch.

Collision points: the coordinator owns goal controls/INDEX reconciliation; HAWF
and boundary-routing retain their own authority; GMF owns receipt/envelope files;
P1 consumes evidence only after coordinator acceptance. Do not co-edit any of
these surfaces. Catalog refresh by Pi can race observation: refuse inconsistent
captures, never lock, pause, repair, or rewrite Pi. A conflicting active claimant
requires sequencing by the coordinator before affected downstream work.

## Security Gate and Stop Conditions

Elevated risk and architecture/risk require two independent frontier adversarial
reviews, including a security-focused review of source acquisition and evidence
leakage. The registered builder profile does not widen Allowed Files or authorize
credential reads. This shaping session dispatches no reviews or builders.

Stop affected collection/acceptance on unsafe source access, credential discovery,
unreproducible binding, stale/missing/partial/changing facts, ambiguous identity,
endpoint mismatch, unavailable approved config, no eligible lane, unauthorized
write/effect, file collision, or evidence invalidating a locked decision. Record
safe refusal details only; never quote suspect payloads. Escalate decisions beyond
P0. Known HAWF drift may be documented under the Step-0 ruling; unresolved ownership
still holds downstream dispatch. Missing Jev holds its lane, never triggers silent
substitution. No repeated attempt may bypass a refusal or security boundary.

## Verification Plan

Run from the explicit isolated repository root in PowerShell. Commands below read
repo documents or already-approved safe evidence only; they never acquire mixed
host JSON. Capture every exit immediately, without truncated pipelines.

```powershell
node -v
if ($LASTEXITCODE -ne 0) { throw 'node unavailable' }
git rev-parse HEAD
git status --short --untracked-files=all
git diff --name-only 96b6e39
git diff --check
if ($LASTEXITCODE -ne 0) { throw 'diff check failed' }
$g = 'plugins/foreman-line/docs/goals/routing-currency-and-merit'
Get-FileHash -Algorithm SHA256 -LiteralPath "$g/charter.md","$g/loop-directive.md",'plugins/foreman-line/routing-policy/routing-policy.yaml'
rg -n 'SUPERSEDED|awaiting_coordinator_claim|ownership|Queue owner' plugins/foreman-line/docs/goals/INDEX.md plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/charter.md plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/loop-directive.md
rg -n 'model_tiers|economy:|standard:|nemotron|glm-5.3|ORDER IS' plugins/foreman-line/routing-policy/routing-policy.yaml
rg -n 'input|eligible.has|for \(const tier|writeFileSync|evaluateRouting' plugins/foreman-line/dispatch/src/routing-eval/index.ts plugins/foreman-line/dispatch/src/approval-cli/index.ts
```

For later evidence verification, only after the safe-source gate:

```powershell
$f = "$g/rcm-p0-catalog-snapshot.v1.json"
Get-FileHash -Algorithm SHA256 -LiteralPath $f
$s = Get-Content -Raw -LiteralPath $f | ConvertFrom-Json
if ($s.recordVersion -ne 1 -or $s.purpose -cne 'recon-evidence-only') { throw 'FORMAT_REFUSED' }
if ($s.complete -ne $true -or @($s.incompleteReasons).Count -ne 0) { throw 'PARTIAL_REFUSED' }
$duplicates = @($s.models | Group-Object provider,id -CaseSensitive | Where-Object Count -ne 1)
if ($duplicates.Count -ne 0) { throw 'DUPLICATE_IDENTITY_REFUSED' }
$s.models | Where-Object { $_.provider -ceq 'openrouter' -and $_.id -cin @('nvidia/nemotron-3.5-lightning','z-ai/glm-5.3','typesafe/jev-1.13') } | Select-Object provider,id,baseUrl,input,cost,contextWindow,thinkingLevelMap
[decimal]::Round(((0.08d - 0.065d) / 0.065d * 100), 6)
[decimal]::Round(((0.20d - 0.18d) / 0.18d * 100), 6)
```

The last two calculations verify historical comparison arithmetic only; repeat
with the measured, unit-verified rates for F3. Record complete safe outputs and
exact additional field/join commands for F1–F6 in the verification artifact, once
the live projection's shape is established. Independent review checks all rows,
not just these three sample IDs. Verify the snapshot digest against the recorded
expected digest; a freshly printed hash alone is not an integrity comparison.

Using the same fixed evaluation time/bound, document negative cases by in-memory
copies of safe facts: missing provider/model, duplicate key, same ID under another
provider, endpoint trailing-slash/different-path mismatch, stale/future timestamp,
partial provider set, absent thinking map, unknown rate units and changed digest.
Expected results are explicit evidence refusals, with missing optional capability
facts marked unknown rather than invented. Do not mutate host inputs or claim
production tests exist. Recompute every joined identity with case-sensitive exact
comparison and every freshness result from its recorded operands.

Draft self-check: use existing `shaping/src/self-check.ts::selfCheckDraft` and the
spec-linter CLI against this exact file with `--repo-root` explicitly supplied;
require both layers valid. At shaping time the file was draft. Use preinstalled dependencies
and a compatible Node runtime; no installation or cache output is authorized.
Coordinator lint remains authoritative.

Mandated reviewer focus questions:

- Can any proposed acquisition read a credential before redaction or hashing?
- Are absent records confused with partial coverage, or catalog facts with uptime?
- Do exact provider/model/baseUrl joins reject aliases and duplicate identities?
- Does HAWF escalation or a Jev proposal accidentally authorize downstream use?
- Can a later parcel mistake the snapshot, freshness proposal, or permission
  profile for live routing or host-write authority?

## Session Handoff

Shaper returns this draft path, base commit/branch, exact changed-file list,
commands/results, and unresolved flags; no commit, kickstarter, status promotion,
or extra shaping-result file. Coordinator lints before a fresh reconnaissance
worker restates its four-file scope and safe-source boundary at Step 0. That
worker returns AC-by-AC evidence, source/digest references, refusal/hold list,
ownership and Jev dispositions, tool versions and exact command exits. Coordinator
and independent reviewers decide acceptance and whether P1 can consume evidence;
later waves need new Gate 2 grants. Freshness TTL and safe acquisition availability
are execution prerequisites, not claims established by this shaping session.

## Stage F closure

Gate 3 for the bounded RCM-P0 handoff was explicitly granted by Clinton Morgan.
The evidence artifacts and this spec were merged from `codex/rcm-p0-builder` after
the coordinator closure pass and two fresh post-rework frontier reviews. The
handoff is accepted as incomplete evidence only: F1–F6 remain
`blocked-secret-boundary`, HAWF remains `escalated-unresolved` with downstream hold,
Jev remains evidence-only refused/disabled-lane, and the catalog snapshot is not
consumable as live routing authority. RCM-P1 remains held until the missing evidence
boundary is resolved and its parcel is separately advanced through the loop.
