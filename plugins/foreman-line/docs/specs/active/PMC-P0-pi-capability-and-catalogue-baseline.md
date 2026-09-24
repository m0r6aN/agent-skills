---
ticket: PMC-P0
title: Pi capability and catalogue baseline
status: draft
owner: clinton.morgan
created: 2026-09-23
updated: 2026-09-24
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
Pi 0.86.1 configuration semantics, safe catalogue facts for every in-scope
matrix binding, exact ID spelling per provider, tool and structured-output
compatibility, data-routing constraints, the A3 suitability rubric that defines
"comparable or higher", and a candidate role/lane/authority map for owner
ratification. This parcel writes evidence documents only. It implements no
resolver, changes no policy, and touches no host configuration. Catalogue facts
prove recorded configuration, never live provider availability.

## Constraints

Authority baseline is charter `D1`–`D8` as amended by **Amendment 01 (A1–A8)**,
**Amendment 02 (M2–M4)**, **Amendment 03** (which supersedes Amendment 02 M1 and
governs the Opus identity on conflict), and **Amendment 04** (which governs the
AC2a "URL mismatch" comparator, the binding 7 disposition, and the corrected
verification query, on conflict). Gate 2 names PMC-P0 only. Gate 3
remains human-owned. No Gate 2 exists for any later parcel.

Model identities are the Amendment 03 corrected set, enumerated in **AC2**.
`opencode/claude-opus-5-5` and `openrouter/anthropic/claude-opus-5.5` are the
Opus routes. The typed routing/classification lane is **refused /
disabled-lane** per M2, with the precise resolver semantics fixed in **AC6**.

### Coordinator preconditions (recorded, not builder decisions)

These are ruled by the coordinator before dispatch. A builder may not decide
them.

1. **Evidence-state disposition.** PMC-P0 may derive **`static-conformance`
   evidence only** from the frozen host-owner export. Every live availability,
   reachability, and quality claim is **held** and routed to A6
   `live-availability` / `model-quality`. No positive availability claim may be
   made from this parcel's evidence.
2. **Freshness disposition.** The export's freshness bound is **not accepted**
   (`freshnessBound: "not-accepted-by-coordinator"`,
   `liveEvidence: "not-yet-accepted"`). The export is additionally **known
   stale on the Opus identity**, having been superseded by Amendment 03.
   Therefore it is authorized as a source for **settings/enablement facts and
   capability fields only**, and is **never** an availability oracle or an
   absence proof for any identity.
3. **Opus identity is owner-attested.** The Amendment 03 Opus identities are
   owner-attested from live catalogues the builder cannot access. The builder
   **must not** attempt to confirm or falsify them from the frozen export,
   which predates the correction. Record them as `owner-attested` pending
   `live-availability`. A stale-export absence result is **expected and
   non-authoritative** and must not be reported as a contradiction.
4. **Promotion is the coordinator's act.** The `draft → active` transition
   modifies this spec file, which is **outside** the builder's Allowed Files.
   The coordinator performs promotion **before** dispatch. The builder writes
   **only** the four evidence files and never edits this spec, including its
   frontmatter, checkboxes, or `status`.

### Evidence acquisition boundary

Consume the credential-free host-owner export at
`plugins/foreman-line/docs/goals/routing-currency-and-merit/host-owner-export/`.
Pinned digests:

| File | SHA-256 |
|---|---|
| `catalog-projection.json` | `b0c2dc8cf1412773b4ed4f17fcba10634a997f3b2b2b960d6dca200bdbb171fe` |
| `settings-projection.json` | `1024154d7245a52fb3cb82b3c8105a2249d5406daee03498f99cbed8ed137d1e` |
| `export-manifest.json` | `aa9b03faff555c6f5e98fd06b0f6e940269a5393f846877f57af562d1df692c3` |

**Do not modify, regenerate, or publish a replacement export or hash. Locally
recomputing SHA-256 solely to verify the three pinned digests above is
required.** A mismatch is a hard stop.

Do **not** read host `settings.json`, `models-store.json`, auth files,
credential stores, `headers` fields, or any secret-bearing URL; do not guess
home directories; do not enumerate environment variables; do not launch Pi,
which may refresh or write its cache. RCM-P0 closed `blocked-secret-boundary`
attempting host reads — do not repeat it.

The export is owned by the Routing Currency and Merit coordinator session
`e45b4d47-8455-49e9-9629-31c713c1b356`. Read it only.

Use the current frozen frontmatter schema including `verification_class`. This
parcel introduces no schema field, executable, test, collector, or dependency.

## Acceptance Criteria

- [ ] **AC1 — Provenance.** Every factual claim cites an exact source path,
  field or record locator, acquisition digest, and a repeatable command with its
  raw output and exit code. Re-read each source independently rather than
  quoting this spec or the coordinator lint. No claim is credited by citation
  alone.

- [ ] **AC2 — Enumerated identity resolution, in two classes.** The in-scope set
  is exactly the **fifteen** distinct provider/model bindings below, split into
  **thirteen `catalogue-resolved`** and **two `owner-attested`**. The two classes
  have different, non-interchangeable success conditions. A binding's class is
  fixed by the table; the builder may not reclassify one.

  **AC2a — the thirteen `catalogue-resolved` bindings.** Resolve each against the
  catalogue projection to exactly one provider key, one exact model ID, and its
  exact public `baseUrl`. Comparison is **case-sensitive and literal**: no case
  folding, alias substitution, dot/dash conversion, suffix stripping, or URL
  trimming. Zero matches, multiple matches, wrong provider, `:batch` or other
  variant suffixes, and URL mismatch each **refuse** with a named reason.

  Per **Amendment 04 (D-a1)**, "URL mismatch" above is a **catalogue-internal**
  test: it refuses only when the literal `provider`+`id` resolves to records with
  duplicate or mutually inconsistent `baseUrl` values **within the catalogue**. A
  catalogue `baseUrl` that differs from a `settings-projection.json` registered
  provider `baseUrl` or from `routing-policy/src/pi-openrouter.ts` is **not** an
  AC2a refusal — record it as a `static-conformance` finding for PMC-P1/PMC-P2,
  never as an availability or absence claim. Per **Amendment 04 (D-b1)**, binding
  7 (`opencode/qwen3.8-flash`) is **expected** to return `AC2A_ZERO_MATCH`: record
  the named refusal and its raw zero-match query, do **not** alias or reclassify
  it, and do **not** count it against the thirteen; the `qwen3.8-flash` id appears
  only under providers `opencode-go` and `qwen-token-plan`, and its L5
  economy-primary / L6 recommendation-only roles are **held** to A6 and PMC-P2.

  **AC2b — the two `owner-attested` bindings (1 and 10).** These are **not**
  required to resolve in the frozen catalogue, which predates Amendment 03.
  Record each as **`OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY`**, citing
  Amendment 03 as the attesting authority. Run the same literal query for the
  record and report its result verbatim, marked **non-authoritative**. A zero
  match is the **expected** outcome: it is neither a refusal, nor a failure, nor
  a contradiction of Amendment 03, and it must not be counted against AC2a.
  Any capability field unavailable for these bindings is marked `unknown` per
  AC5, never inferred from the other Opus entries or from model family.

  Lane keys: `L1` frontier-coordination/shaping/architecture-risk;
  `L2` adversarial-review/verification/security-audit; `L3`
  complex-implementation; `L4` standard-implementation; `L5` economy;
  `L6` typed-routing-classification (**disabled**, see AC6).

  | # | Provider | Exact model ID | Lane roles | Resolution class |
  |---|---|---|---|---|
  | 1 | `opencode` | `claude-opus-5-5` | L1 primary; L2 fallback | **`owner-attested`** (AC2b) |
  | 2 | `opencode` | `gpt-6-astra` | L1 fallback; L2 primary | `catalogue-resolved` |
  | 3 | `opencode` | `gpt-5.6-sol` | L3 primary | `catalogue-resolved` |
  | 4 | `opencode` | `claude-sonnet-5` | L3 fallback | `catalogue-resolved` |
  | 5 | `opencode` | `deepseek-v4-pro` | L4 primary | `catalogue-resolved` |
  | 6 | `opencode` | `gpt-5.6-terra` | L4 fallback | `catalogue-resolved` |
  | 7 | `opencode` | `qwen3.8-flash` | L5 primary; L6 recommendation-only primary | `catalogue-resolved` |
  | 8 | `opencode` | `glm-5.3-flash` | L5 fallback; L6 recommendation-only fallback | `catalogue-resolved` |
  | 9 | `openrouter` | `openai/gpt-6-astra` | L1 primary; L2 fallback | `catalogue-resolved` |
  | 10 | `openrouter` | `anthropic/claude-opus-5.5` | L1 fallback; L2 primary | **`owner-attested`** (AC2b) |
  | 11 | `openrouter` | `anthropic/claude-sonnet-5` | L3 primary | `catalogue-resolved` |
  | 12 | `openrouter` | `openai/gpt-5.6-sol` | L3 fallback | `catalogue-resolved` |
  | 13 | `openrouter` | `openai/gpt-5.6-terra` | L4 primary | `catalogue-resolved` |
  | 14 | `openrouter` | `google/gemini-3.8-flash` | L4 fallback; L5 primary | `catalogue-resolved` |
  | 15 | `openrouter` | `anthropic/claude-haiku-4.5` | L5 fallback | `catalogue-resolved` |

  Counts to report: **13 attempted under AC2a** — **twelve literal catalogue
  resolutions plus the one documented `AC2A_ZERO_MATCH` refusal for binding 7**,
  per Amendment 04 (D-b1) — and **2** under AC2b. `13 + 2 = 15`; no binding
  appears in both classes and none is omitted. The binding 7 refusal is acceptable
  AC2a **evidence**, not an unresolved acceptance criterion.

  **Excluded, not a candidate:** `openrouter` / `typesafe/jev-1.13`, struck by
  M2. Record its catalogue and settings status as an observation only; never
  resolve it as an eligible binding or propose a replacement.

  Bindings 1 and 10 follow AC2b and coordinator precondition 3. Their live
  reachability is established later under A6 `live-availability`, never here.

- [ ] **AC3 — Jev and enablement dispositions re-derived.** Independently
  re-derive, from the export only: that `typesafe/jev-1.13` appears in
  `settings-projection.json` `enabledModels` yet is listed under
  `export-manifest.json` `openrouterMissingRequiredIdentities`, confirming the
  M2 refused/disabled-lane ruling. Record separately that
  `routing-policy/routing-policy.yaml` and its tests still encode Jev as the
  routing/classification model — an unreconciled gap between M2 and code, owned
  by PMC-P1/PMC-P2, **not** fixed here.

- [ ] **AC4 — Enablement gap quantified.** Record exactly which of the fifteen
  AC2 bindings appear in `enabledModels` and which do not, with counts stated as
  `n of 15`. Name PMC-P2 as owner per M4. Do not enable anything or present a
  settings edit as executed. Note: the coordinator lint's earlier "twelve"
  figure was an unenumerated estimate and is **superseded** by the AC2 set.

- [ ] **AC5 — Capability facts per binding.** For each **AC2a
  catalogue-resolved** binding record allowlisted facts only: `contextWindow`, `maxTokens`, `input` modalities,
  `reasoning`, numeric `cost` fields with documented units, `thinkingLevelMap`
  coverage, and provider `checkedAt`. Mark every absent field `unknown`. Absence
  of a quality field is **not** evidence of merit. State explicitly whether
  tool-use and structured-output support are **derivable** from the safe field
  set; where they are not, record `capability-unverified` rather than inferring
  from model family or reputation.

- [ ] **AC6 — A3 suitability rubric, with disabled-lane semantics.** Deliver a
  reviewed rubric defining "comparable or higher suitability" as required
  ranking inputs with types, units, and refusal semantics: data-class
  eligibility, required capability, independence obligation, available context,
  remaining budget, verified availability, recorded quality score, plus the
  documented stable tie-break order. State the evidence threshold below which a
  candidate is unrankable, and route any input that cannot be populated without
  a provider call to A6 rather than inventing a proxy.

  The rubric must specify **L6 resolution as a total function**, in this order:

  1. **Lane-disabled check precedes all eligibility and ranking.** L6 resolves
     to a terminal refusal — proposed outcome `LANE_DISABLED_REFUSED` — and
     **no** eligibility filtering, ranking, or tie-break is evaluated.
  2. If a future ratified amendment re-enables recommendation-only use, the
     candidate list is **exactly** `[opencode/qwen3.8-flash,
     opencode/glm-5.3-flash]` in that declared stable order, and nothing else.
  3. **Forbidden in L6 unconditionally:** any authority-bearing route; any
     cross-provider fallback; any prose, implementation, review, approval,
     merge, verification, or control-plane output; and any promotion of an L6
     binding into another lane's authority.
  4. **Termination:** the declared order is total over that two-element list, so
     tie-break is never invoked; a single eligible candidate resolves directly;
     an empty eligible set refuses. Show this terminates without appeal to
     provider symmetry, which L6 does not have.

- [ ] **AC7 — Candidate role/lane/authority map.** Deliver the candidate mapping
  of all six lanes to role, routing class, and authority cap, extending the
  current `coordinator | verifier | builder` vocabulary, showing each lane's
  frontier-only, independent-family, and human-gate obligations, and naming every
  collision with current `roles:` content. Mark it
  **`awaiting-owner-ratification`** per A5.4. This parcel does not freeze it and
  PMC-P2 may not start against an unratified map.

- [ ] **AC8 — Independent verification.** The verification record carries exact
  commands, tool versions, exit codes, raw output, artifact digests,
  before/after repo status, an allowed-path audit, negative cases, AC-by-AC
  evidence mapping, and remaining holds, plus **two** fresh frontier adversarial
  reviews (elevated / architecture-risk). A documented blocked or refused result
  is not a clean pass. Coordinator acceptance, not the builder's claim, releases
  the gate.

## Out of Scope

Implementing the resolver, launch boundary, break-glass path, preflight, route
receipt, or any schema, validator, fixture, or test; editing
`routing-policy.yaml`, `src/validator.ts`, `KNOWN_FRONTIER_MODELS`, templates,
or any plugin source; reconciling the Jev policy/test gap found in AC3; enabling
models; changing Pi settings, host defaults, provider registrations, or
credentials; modifying, regenerating, or republishing the host-owner export;
making any provider call, network request, or spend; freezing the role/authority
map; **editing this spec file, including its `status`, frontmatter, or
checkboxes**; editing the charter, amendments, coordinator lint, loop directive,
or `docs/goals/INDEX.md`; editing RCM, PRAC, HAWF, GMF, or boundary-routing goal
files; creating a kickstarter, receipt, or `ShapingResult`; dispatching
reviewers or builders; committing, merging, or releasing.

## Context & References

- [Charter](../../goals/pi-model-configuration/charter.md)
- [Plan review](../../goals/pi-model-configuration/plan-review-findings.md)
- [Amendment 01](../../goals/pi-model-configuration/gate-1-amendment-01.md)
- [Amendment 02](../../goals/pi-model-configuration/gate-1-amendment-02.md)
- [Amendment 03](../../goals/pi-model-configuration/gate-1-amendment-03.md)
- [Amendment 04](../../goals/pi-model-configuration/gate-1-amendment-04.md)
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

The builder may create or edit **only** these four evidence artifacts:

- `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-capability-baseline.md`
- `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-suitability-rubric.md`
- `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-role-lane-map.md`
- `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-verification.md`

These are documentation, not executable contracts. Existing artifacts are not
overwritten without coordinator disposition; a new evidence version requires an
exact-path amendment.

**This spec file is not in the builder's Allowed Files.** The `draft → active`
promotion and any later `active → done` move are **coordinator** acts performed
outside the builder's scope, per coordinator precondition 4. During this shaping
session the only authorized output is this spec file itself; none of the four
evidence artifacts is created now.

## Forbidden Files and Effects

Every path outside Allowed Files is a forbidden write, specifically: **this spec
file**; this goal's `charter.md`, `gate-1-amendment-01.md`,
`gate-1-amendment-02.md`, `gate-1-amendment-03.md`, `gate-1-amendment-04.md`,
`plan-review-findings.md`,
`coordinator-lint-pmc-p0.md`, `loop-directive.md`; `docs/goals/INDEX.md`; the
entire `docs/goals/routing-currency-and-merit/` tree including
`host-owner-export/`; the `docs/goals/pi-routing-adapter-compat/` tree; HAWF,
GMF, and boundary-routing goal files; `docs/SPEC-CONVENTION.md`; all
`routing-policy/` files; `templates/`; `foreman-config/`;
`permission-profiles/`; every other parcel spec; and all plugin source, schemas,
tests, manifests, locks, hooks, and receipts.

Forbidden reads: host `settings.json`, `models-store.json`, auth or credential
files, credential stores, `headers` fields, and any secret-bearing URL.

Do not invoke `evaluateRouting`, `prepareDispatch`, or `executeDispatch` to
"inspect" routing — the evaluator writes a receipt and dispatch can create
worktrees and effects. Read code and calculate from safe facts instead. No
dependency installation, generated output, network request, watcher, or
automation is authorized.

## Evidence Procedure and Artifacts

Proceed in order: verify pinned digests; resolve the AC2 bindings; derive
capability facts; build the rubric including L6 semantics; draft the role map;
verify independently.

### Capability baseline

One row per AC2 binding: index, lane roles, provider key, exact model ID, exact
`baseUrl`, presence verdict, allowlisted capability facts, `unknown` markers,
source record locator, `capability-unverified` flags, and `owner-attested`
marking for bindings 1 and 10. Record separately the enablement gap as `n of
15`, the Jev observations, the `opencode` versus `opencode-go` namespace
observation without treating equal endpoints as licence to alias providers, and
variant-suffix identities such as `:batch` as observations never eligible as
candidates. Per **Amendment 04 (D-a1)** record each resolved binding's catalogue
`baseUrl` verbatim and flag every catalogue-vs-`settings-projection` /
`pi-openrouter.ts` endpoint divergence as a named `static-conformance` finding
assigned to PMC-P1/PMC-P2 (never an availability or absence claim, never an AC2a
refusal). Per **Amendment 04 (D-b1)** record binding 7 as `AC2A_ZERO_MATCH`
acceptable evidence with its raw zero-match query, and hold its L5/L6 roles to A6
and PMC-P2.

### Suitability rubric

Each ranking input gets a name, type, unit, source of truth, refusal semantics,
and whether PMC-P0 evidence can populate it today. Where it cannot — most
likely `recorded quality score` and `verified availability` — say so plainly and
route it to A6. Define the stable tie-break order explicitly, and give the L6
total function exactly as specified in AC6.

### Candidate role/lane map

One row per lane: role name, routing class, authority cap, frontier-only
obligation, independence obligation, human gates, and declared provider rule
under A3. Show how six lanes reconcile with the existing three-role vocabulary.
Mark the artifact `awaiting-owner-ratification`.

## Dependencies, Consumers, and Collision Risk

PMC-P0 depends on the ratified charter plus Amendments 01–04, digest-verified
export availability, and the coordinator preconditions above. It does not depend
on unwritten P1 code.

PMC-P1 consumes the rubric and identity facts as contract requirements,
fixtures, and refusal cases, and owns the Jev policy/test reconciliation — only
after coordinator acceptance. PMC-P2 consumes the ratified role map, the
enablement gap (M4), and launch-boundary requirements. PMC-P3 consumes
vocabulary for canon. PMC-P4 consumes exposure cases and owns
legacy-representation removal. No consumer may treat these artifacts as
installed policy, a live allowlist, an availability guarantee, or permission to
dispatch.

**Collision.** PMC-P1 and PMC-P2 must change `routing-policy/` surfaces owned by
the live RCM coordinator session `e45b4d47-8455-49e9-9629-31c713c1b356` (state
`RCM-P0-closed-incomplete`, RCM-P1 held). PMC-P0 does not collide on files. Wave
1 must be sequenced with that coordinator before its Gate 2 — never co-owned.
The adjacent `pi-routing-adapter-compat` goal declares its own surfaces and
forbids `routing-policy/` writes, so it does not currently collide; re-check
before Wave 1. Record collisions; do not resolve them from inside this parcel.

## Security Gate and Stop Conditions

Elevated risk and `architecture/risk` require **two** independent fresh frontier
adversarial reviews, one focused on evidence acquisition and leakage. The
`builder-architecture` profile does not widen Allowed Files or authorize
credential reads. This shaping session dispatches no reviews and no builders.

Stop and report on: a pinned-digest mismatch or missing export file; any route
that would read a credential; ambiguous, duplicate, or multi-match identity;
endpoint mismatch **within a single literal identity** (a catalogue-internal
inconsistent `baseUrl`; a catalogue-vs-`settings-projection`/`pi-openrouter.ts`
divergence is a recorded static-conformance finding per Amendment 04, not a
stop); a required ranking input that cannot be populated without a
provider call; an unauthorized write or effect; a file collision with RCM, PRAC,
or another live goal; pressure to freeze the role map, promote this spec, or
reconcile the Jev policy gap inside this parcel; or evidence contradicting
Amendment 01, 02 M2–M4, 03, or 04 — **excluding** the expected, non-authoritative
stale-export result for bindings 1 and 10, the expected `AC2A_ZERO_MATCH` refusal
for binding 7 (acceptable evidence per Amendment 04, D-b1), and
catalogue-vs-settings/contract endpoint divergences (static-conformance findings
per Amendment 04, D-a1). Record safe refusal detail only;
never quote a suspect payload. No repeated attempt may bypass a refusal.

## Verification Plan

The authorized environment is **Windows**; `sha256sum` and `grep` are **not
available**. Use the PowerShell below or an equivalent Node script. Capture raw
output and the exit code of every command immediately, without truncated
pipelines.

```powershell
$ErrorActionPreference = 'Stop'
node -v; "node exit=$LASTEXITCODE"
git rev-parse HEAD; "git exit=$LASTEXITCODE"
git status --short --untracked-files=all
git diff --check; "diffcheck exit=$LASTEXITCODE"

$X = 'plugins/foreman-line/docs/goals/routing-currency-and-merit/host-owner-export'
$expected = @{
  'catalog-projection.json'  = 'B0C2DC8CF1412773B4ED4F17FCBA10634A997F3B2B2B960D6DCA200BDBB171FE'
  'settings-projection.json' = '1024154D7245A52FB3CB82B3C8105A2249D5406DAEE03498F99CBED8ED137D1E'
  'export-manifest.json'     = 'AA9B03FAFF555C6F5E98FD06B0F6E940269A5393F846877F57AF562D1DF692C3'
}
foreach ($k in $expected.Keys) {
  $h = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $X $k)).Hash
  "{0} actual={1} expected={2} match={3}" -f $k, $h, $expected[$k], ($h -eq $expected[$k])
  if ($h -ne $expected[$k]) { throw "DIGEST_MISMATCH_REFUSED: $k" }
}

# AC3 — Jev disposition (expect: enabled in settings, listed missing in manifest)
Select-String -Path "$X/settings-projection.json","$X/export-manifest.json" -Pattern 'jev-1\.13' -CaseSensitive
Select-String -Path 'plugins/foreman-line/routing-policy/routing-policy.yaml' -Pattern 'jev' -CaseSensitive

# AC4 — enablement gap
(Get-Content -Raw -LiteralPath "$X/settings-projection.json" | ConvertFrom-Json).enabledModels

# AC2a — the 13 catalogue-resolved bindings, literal case-sensitive resolution.
# Example uses binding 3. Repeat per AC2a row, substituting the exact provider/id
# pair, filtering providers[].models[] on the inner model.provider field (there is
# NO top-level .models field). Per Amendment 04 (D-b1) a zero match is a named
# refusal, but binding 7 (opencode/qwen3.8-flash) is EXPECTED to be
# AC2A_ZERO_MATCH and is recorded as acceptable evidence, not a failure. Per
# Amendment 04 (D-a1) resolve each binding to its catalogue baseUrl and record
# any catalogue-vs-settings/contract endpoint divergence as a static-conformance
# observation; do NOT treat it as an AC2a refusal.
$cat = Get-Content -Raw -LiteralPath "$X/catalog-projection.json" | ConvertFrom-Json
$cat.providers | ForEach-Object { $_.models } |
  Where-Object { $_.provider -ceq 'opencode' -and $_.id -ceq 'gpt-5.6-sol' } |
  Select-Object provider, id, baseUrl, contextWindow, maxTokens, input, reasoning, cost, thinkingLevelMap
# settings-registered provider baseUrls, for the D-a1 endpoint-divergence observation:
(Get-Content -Raw -LiteralPath "$X/settings-projection.json" | ConvertFrom-Json).providers

# AC2b — bindings 1 and 10 are owner-attested; the frozen catalogue predates
# Amendment 03. Run these for the record only. A zero match is EXPECTED and
# NON-AUTHORITATIVE: do not refuse, do not treat it as a contradiction, and do
# not count it against AC2a. Report the raw result, then record
# OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY and mark capability fields unknown.
$cat.providers | ForEach-Object { $_.models } |
  Where-Object { $_.provider -ceq 'opencode'   -and $_.id -ceq 'claude-opus-5-5' }
$cat.providers | ForEach-Object { $_.models } |
  Where-Object { $_.provider -ceq 'openrouter' -and $_.id -ceq 'anthropic/claude-opus-5.5' }

# AC7 — current role vocabulary and tier order
Select-String -Path 'plugins/foreman-line/routing-policy/routing-policy.yaml' -Pattern 'roles:|model_tiers:|ORDER IS'
Select-String -Path 'plugins/foreman-line/routing-policy/src/validator.ts' -Pattern 'claude-opus'
```

Negative cases, by in-memory copies of safe facts only — never by mutating a
source: absent identity; duplicate identity; same ID under another provider;
`:batch` or other variant suffix; `baseUrl` trailing-slash and different-path
mismatch; case-folded near-match; stale and future timestamps; absent
`thinkingLevelMap`; unknown cost units; changed digest. Each must produce an
explicit named refusal, with missing optional facts marked `unknown` rather than
invented.

Draft self-check, for coordinator use only (the builder does not run it against
this spec, which it may not edit): spec-linter CLI with `--repo-root` explicitly
supplied, plus the shaping package's `selfCheckDraft`. Both layers must pass.
Preinstalled dependencies only; no installation is authorized. The self-check is
**advisory** — coordinator lint remains the sole promotion authority.

Mandated reviewer focus questions:

- Can any step in the acquisition path read a credential before redaction, or
  reach a host file the constraints forbid?
- Does any claim upgrade frozen-export facts into live availability, catalogue
  presence into uptime, or an absent record into a verified absence — especially
  for the `owner-attested` bindings 1 and 10?
- Do the identity joins reject aliases, case-folded near-matches, `:batch`
  variants, duplicates, and `baseUrl` mismatches under literal comparison?
- Does the rubric invent a proxy for a ranking input that genuinely requires a
  provider call, instead of routing it to A6?
- Does L6 refuse **before** eligibility and ranking, forbid cross-provider
  fallback and any authority-bearing route, and provably terminate without
  assuming provider symmetry?
- Is the AC2 set exactly fifteen bindings — thirteen under AC2a and two under
  AC2b — with Jev excluded, no binding reclassified between the two classes, and
  no lane's primary/fallback/recommendation-only role silently changed?
- Was an expected AC2b zero match anywhere reported as a refusal, a failure, or
  a contradiction of Amendment 03, or counted against the AC2a thirteen?
- Could a later parcel mistake the role map for ratified authority, or the
  capability baseline for permission to dispatch or enable models?
- Did the builder edit this spec, promote its status, or reconcile the Jev
  policy gap — any of which is out of scope?

## Session Handoff

The shaper returns this draft path, the full base SHA, this spec's SHA-256, the
exact changed-file list, commands and results, and unresolved flags — no
evidence artifacts, no kickstarter, no status promotion, and no `ShapingResult`
file (per the RCM-P0 precedent for coordinator-run goal parcels). The
coordinator lints, records the preconditions above, performs the `draft → active`
promotion itself, and only then dispatches a builder that restates its
four-file scope and safe-source boundary at Step 0. That builder returns
AC-by-AC evidence, source and digest references, a refusal/hold list, tool
versions, and exact command exits with raw output. Coordinator plus two
independent reviewers decide acceptance and whether PMC-P1 may consume the
evidence. Wave 1 requires its own Gate 2 and RCM sequencing. Freshness
acceptance and safe-source availability are execution prerequisites, not
outcomes established by this shaping session.
