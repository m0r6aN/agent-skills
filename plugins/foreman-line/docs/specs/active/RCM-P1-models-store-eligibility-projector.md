---
ticket: RCM-P1
title: Pure catalog-snapshot reader and eligibility projector
status: active
owner: clinton.morgan
created: 2026-09-22
updated: 2026-09-22
supersedes: null
superseded_by: null
risk: standard
surfaces:
  - plugins/foreman-line/routing-policy/src/
  - plugins/foreman-line/routing-policy/tests/
  - plugins/foreman-line/routing-policy/README.md
  - plugins/foreman-line/docs/specs/active/RCM-P1-models-store-eligibility-projector.md
routing_class: implementation/standard
verification_class: equivalence-provable
permission_profile: builder-standard
data_classification: internal
---

## Intent

Ship a pure, typed, offline reader for a versioned, digest-bound catalog
snapshot of allowlisted `models-store` facts, plus an eligibility projector that
turns requested `provider`/`id` identities into either normalized eligibility
facts or closed, typed refusals. Later parcels consume these values: RCM-P3
machine-checks policy capability claims against them, and RCM-P5 enforces them
at dispatch-time preflight. P1 produces facts and refusal values only. It never
decides a route, never enforces anything at dispatch, and never becomes routing
authority (charter D1, D2, D10, D11, D13; RCM-P1 row at `charter.md:203`).

## Constraints

**Authority baseline:** `37cbb5c0f4ae5f203842735beef4833a16d41095` (shaping
worktree HEAD). Controls: charter D1–D14 as amended, Gate 2 re-grant and the
"RCM-P0 evidence-boundary ruling" of 2026-09-22 (`charter.md:370-394`),
`loop-directive.md`, and boundary-routing D1–D10, all unchanged.

Binding rules from the 2026-09-22 ruling, carried as acceptance criteria:

1. P0 evidence is design input only. Stale freshness, missing approved-configuration
   authority, endpoint mismatch, and catalog absence (including
   `openrouter`/`typesafe/jev-1.13`) are **typed refusals**. They are never
   warnings, defaults, log lines, or silently dropped records.
2. Freshness bound is exactly 24 hours (`86_400_000` ms). A snapshot whose source
   time is more than 24 hours older than the evaluation time refuses. The
   evaluation time is an explicit input.
3. Endpoints are joined by exact, case-sensitive string equality (D13). No
   aliasing, trailing-slash trimming, path normalization, case folding, or
   provider substitution. `https://openrouter.ai/api` never equals
   `https://openrouter.ai/api/v1`.
4. Duplicate or ambiguous identities refuse. An identity is always
   `(provider, id)`; there is no cross-provider or unqualified lookup.

Forbidden inside the new modules, enforced by test (AC11):

- ambient clock (`Date.now`, argument-less `new Date()`, `performance.now`),
  randomness, timers;
- `process`, environment variables, filesystem, network, `fetch`, HTTP, MCP,
  child processes, dynamic `import()` or `require`;
- reading Pi `settings.json`, `models-store.json`, any host file, or the
  `templates/pi-openrouter-routing.json` / `PI_OPENROUTER_ROUTING` value as a
  default approved configuration;
- sorting of any kind (`.sort`, `.toSorted`, `localeCompare`), and any price
  comparison between records. Output order equals request order;
- importing anything except `node:crypto` and type-only imports.

No new runtime or dev dependency. `tests/dependency-allowlist.test.ts` stays
`{ajv, yaml}` and green. No change to `package.json`, `package-lock.json`,
`schemas/`, `src/registry.ts`, or the existing public entrypoint `src/index.ts`
(see OQ-7). Errors never echo rejected catalog values. A refusal carries codes,
the caller-supplied requested identity, and a field path at most.

Frontmatter uses the frozen schema only. `inputs`, `min_context`,
`thinking_level`, and `expertise` belong to RCM-P2 and are not added here.

## Acceptance Criteria

Every item is proven by a named test in the listed file. `S` is
`tests/catalog-snapshot.test.ts`, `E` is `tests/eligibility.test.ts`, and `P` is
`tests/catalog-purity.test.ts`.

- [ ] **AC1 — Digest binding (S).** `readCatalogSnapshot(bytes, expectedSha256)`
  computes lowercase SHA-256 over the exact input bytes. A one-byte mutation, or
  an expected digest that is not 64 lowercase hex characters, refuses with
  `DIGEST_REFUSED`. Test-side digests come from an independent `node:crypto`
  call in the test file.
- [ ] **AC2 — Format and canonical bytes (S).** Invalid UTF-8, a BOM, non-JSON,
  bytes not equal to `JSON.stringify(parsed, null, 2) + "\n"` (this catches
  duplicate JSON members, CRLF, and overflow such as `1e400`), and any
  `formatVersion` other than `rcm-catalog-snapshot/v1` refuse with
  `FORMAT_REFUSED`. The committed P0 evidence file
  `docs/goals/routing-currency-and-merit/rcm-p0-catalog-snapshot.v1.json`,
  passed with its true digest, refuses with `FORMAT_REFUSED`. This is the
  negative control that P0 evidence is not a P1 input.
- [ ] **AC3 — Closed shape (S).** Every unknown, missing, or wrong-typed field at
  envelope, provider, model, cost, or thinking-map level refuses with
  `MALFORMED_REFUSED`, one test per level. The same code covers:
  `headers`/`compat`/`name` on a model; empty `providers`/`models`; a model
  whose `provider` is not a declared `providerKey`; non-positive or non-integer
  `contextWindow`/`maxTokens`; empty or duplicate `input`; and a `baseUrl` that
  is not `https:` or carries userinfo, a query, or a fragment.
- [ ] **AC4 — Duplicate identity (S).** A repeated `providerKey` refuses with
  `DUPLICATE_PROVIDER_REFUSED`. A repeated `(provider, id)` model pair refuses
  with `DUPLICATE_IDENTITY_REFUSED`. The same `id` under two providers is legal
  when unique per provider: fixture `z-ai/glm-5.3` exists under `nvidia` and
  `openrouter`.
- [ ] **AC5 — Time inputs (E).** `evaluationTimeUtc` and each `checkedAtUtc` must
  match `YYYY-MM-DDTHH:mm:ss.sssZ` and round-trip through `toISOString`.
  Otherwise the result is `TIME_INVALID_REFUSED`. Non-strings, `Date` objects,
  and epoch numbers also refuse.
- [ ] **AC6 — Freshness (E).** Source time is the oldest `checkedAtUtc` across all
  providers in the snapshot. Any `null` gives `SOURCE_TIME_UNKNOWN_REFUSED`,
  the P0 reality of 13/13 absent. Source time after evaluation time gives
  `FUTURE_REFUSED`. Age of exactly `86_400_000` ms is accepted. Age of
  `86_400_001` ms gives `STALE_REFUSED`. Boundary tests cover both sides and
  the one-millisecond-future case.
- [ ] **AC7 — Approved configuration authority (E).** An absent, `null`, or
  `undefined` approved configuration gives `AUTHORITY_UNKNOWN_REFUSED` for the
  whole projection. A malformed configuration, a duplicate provider entry, or
  a non-https/userinfo/query/fragment `baseUrl` gives `AUTHORITY_INVALID_REFUSED`.
  A requested provider with no approved entry gives the identity-level
  `ENDPOINT_AUTHORITY_UNKNOWN_REFUSED`.
- [ ] **AC8 — Exact endpoint join (E).** With approved
  `openrouter → https://openrouter.ai/api/v1`, each of the four fixture records
  at `https://openrouter.ai/api` refuses with `ENDPOINT_MISMATCH_REFUSED`:
  `anthropic/claude-opus-5`, `anthropic/claude-fable-5.1`,
  `anthropic/claude-sonnet-5`, `anthropic/claude-haiku-4.5`. A trailing slash,
  host case change, and `/api` versus `/api/v1` each refuse in both directions.
- [ ] **AC9 — Catalog absence and identity (E).**
  `openrouter`/`typesafe/jev-1.13` refuses with `MISSING_MODEL_REFUSED`. An
  unknown provider key, including a case-changed `OpenRouter`, refuses with
  `MISSING_PROVIDER_REFUSED`. Requesting `opencode` with an ID present only
  under `opencode-go` refuses with `MISSING_MODEL_REFUSED`, with no namespace
  fallback. A requested identity with a missing or empty `provider` refuses
  with `AMBIGUOUS_IDENTITY_REFUSED`. A non-array, empty, or duplicate-containing
  request list refuses with `REQUEST_INVALID_REFUSED`.
- [ ] **AC10 — Rejected classes (E), each by its own test.**
  - `META_ROUTER_REFUSED` for exact `openrouter/auto`, `openrouter/auto-beta`,
    and `auto`, whether or not they are in the catalog and at any price,
    including `auto` at 0/0.
  - `VARIANT_REFUSED` for any ID containing a colon. One test each for `:free`,
    `:nitro`, `:floor`, `:batch`, using hand-built records for `:nitro`/`:floor`,
    which P0 has zero of, plus one test for an unlisted suffix such as
    `:extended` (ruling on OQ-5).
  - `SENTINEL_RATE_REFUSED` for any negative rate, including the P0
    `openrouter/auto-beta` record at −1000000.
  - `RATE_REFUSED` for `value: null` or any unit other than exactly
    `USD per 1M tokens`, tested separately for input and output.
  - `MODALITY_REFUSED` for any `input` value outside `text | image`.
  - Codes for one identity are all collected in the declared order of
    `IDENTITY_REFUSAL_CODES`. A refused identity never carries facts.
- [ ] **AC11 — Purity (P).** A static scan of both new source files finds none
  of the forbidden constructs in Constraints and only the permitted imports. At
  runtime, `globalThis.fetch`, `Date.now`, and `Math.random` are replaced with
  throwing stubs and `process.env` with a throwing proxy. Read and project still
  succeed and return deep-equal results on repeated calls.
- [ ] **AC12 — No sort, order preserved (E).** Given requested identities with
  descending, ascending, and mixed rates, `results` keeps request order exactly.
  `inputModalities` and thinking-level entries keep catalog order.
- [ ] **AC13 — Facts shape (E).** An accepted identity returns exactly the
  `EligibilityFacts` fields in Contract, with no extra keys, deep-frozen, and
  every value equal to the fixture record. A missing `thinkingLevelMap`
  becomes `{ status: "unknown" }`, never an empty map or default. `null` map
  values and non-canonical values (`HIGH`, `MINIMAL`, `default`) are kept
  verbatim. Zero rates are facts, not refusals (OQ-4). Provenance carries
  digest, `sourceRef`, source time, evaluation time, `ageMs`, `maxAgeMs`, and
  `approvedConfigRef`.
- [ ] **AC14 — Snapshot-level refusal dominates (E).** When the projection
  refuses at snapshot, authority, or request level, `ok` is `false` and there
  is no `results` array. No partial per-identity output leaks.
- [ ] **AC15 — Fixture provenance (S).** Every fixture record on the test's
  `P0_DERIVED` list deep-equals the matching `(provider, id)` record in the
  committed P0 snapshot on all ten fact fields. All other records use the
  reserved `fixture-` provider prefix. The fixture contains no key outside the
  closed shape in AC3, and no string value matching
  `/bearer|authorization|api[_-]?key|secret/i`.
- [ ] **AC16 — Not wired, scope exact.** A search of `plugins/foreman-line/`
  outside `routing-policy/` finds no reference to the new modules. The
  base-to-head diff equals Allowed Files exactly. Package `test`, `typecheck`,
  and `lint` pass natively.

## Out of Scope

- Dispatch-time enforcement, preflight wiring, and refusal messages that name
  parcel fields. RCM-P5 owns these.
- Resolver predicates, tier walking, and classification gating: RCM-P4/P4A.
- Policy schema v0.4 and validator invariants: RCM-P3.
- Spec fields `inputs`, `min_context`, `thinking_level`, `expertise`: RCM-P2.
- Thinking-level satisfaction, context-floor checks, and rate-versus-`ceiling_usd`
  comparisons.
- A raw `models-store.json` adapter or exporter, credential exclusion, and the
  scheduled proposer: RCM-P6 or the host owner (OQ-2).
- Settings projection: RCM-P7. Receipts and replay: RCM-P8A.
- Choosing or binding the approved-configuration source (OQ-8).
- Any change to `routing-policy.yaml`, templates, `src/index.ts`, `schemas/`,
  `dispatch/`, P0 evidence, goal control documents, HAWF, the Jev child goal,
  or host files. No live catalog access, spend, or credential access.

## Context & References

- [RCM charter](../../goals/routing-currency-and-merit/charter.md): D1–D14 at
  lines 176-189, RCM-P1 row at 203, Gate 2 re-grant at 370-373, ruling at 375-394.
- [Loop directive](../../goals/routing-currency-and-merit/loop-directive.md)
- [Plan review](../../goals/routing-currency-and-merit/plan-review-findings.md)
  (PR-02, PR-09)
- [RCM-P0 spec](../done/RCM-P0-current-instance-recon.md)
- [P0 drift report](../../goals/routing-currency-and-merit/rcm-p0-drift-report.md):
  F5/F6 at lines 27-28, sentinels and variants at 104-109, Jev at 128-143.
- [P0 catalog snapshot](../../goals/routing-currency-and-merit/rcm-p0-catalog-snapshot.v1.json)
- [P0 verification](../../goals/routing-currency-and-merit/rcm-p0-verification.md):
  evidence refusal labels at lines 369-417.
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)
- [Spec convention](../../SPEC-CONVENTION.md)
- [Routing-policy README](../../../routing-policy/README.md)

## Allowed Files

- `plugins/foreman-line/routing-policy/src/catalog-snapshot.ts` (new)
- `plugins/foreman-line/routing-policy/src/eligibility.ts` (new)
- `plugins/foreman-line/routing-policy/tests/catalog-snapshot.test.ts` (new)
- `plugins/foreman-line/routing-policy/tests/eligibility.test.ts` (new)
- `plugins/foreman-line/routing-policy/tests/catalog-purity.test.ts` (new)
- `plugins/foreman-line/routing-policy/tests/fixtures/catalog-snapshot/baseline.v1.json` (new)
- `plugins/foreman-line/routing-policy/README.md` (append one section)

At Stage F the coordinator alone moves this spec to `docs/specs/done/`.

## Forbidden Files and Effects

Every path not listed above is forbidden. That includes all other
`routing-policy` files, `dispatch/`, `foreman-config/`, `spec-linter/`,
`templates/`, `SPEC-CONVENTION.md`, the goal folder including P0 evidence
(read-only), `docs/goals/INDEX.md`, and HAWF and boundary-routing documents. No
installation from the network, no evaluator or dispatch invocation, no host read
or write, no commit to shared branches, and no push without coordinator
instruction.

## Contract

`src/catalog-snapshot.ts` holds the reader and types. `src/eligibility.ts` holds
the projector and re-exports the reader surface. Seam inputs are typed `unknown`
(standing constraint 2).

```ts
readCatalogSnapshot(bytes: Uint8Array, expectedSha256: unknown): SnapshotReadResult
projectEligibility(req: {
  snapshot: CatalogSnapshot            // branded; only the reader constructs it
  approvedConfig: unknown              // { authorityRef, endpoints: [{ provider, baseUrl }] }
  evaluationTimeUtc: unknown
  identities: unknown                  // [{ provider, id }]
}): ProjectionResult
```

**Snapshot input `rcm-catalog-snapshot/v1` (closed):** the envelope is
`{ formatVersion, sourceRef, providers[], models[] }`. Each provider is
`{ providerKey, checkedAtUtc: string | null }`. Each model is `{ provider, id,
baseUrl, api, input[], reasoning, contextWindow, maxTokens, cost: { input:
{ unit, value: number | null }, output: {…} }, thinkingLevelMap? }`, where
`thinkingLevelMap` is `Record<string, string | null>`. These ten fact fields
equal the P0 model-record fields minus the P0 locator and annotation fields.

**Outputs:** `SnapshotReadResult` is `{ ok: true, snapshot }` or
`{ ok: false, code }`. `ProjectionResult` is `{ ok: true, provenance,
results }` or `{ ok: false, level: 'snapshot' | 'authority' | 'request', code }`.
Each entry in `results` is `{ requested, outcome: 'facts', facts }` or
`{ requested, outcome: 'refused', codes }`. `EligibilityFacts` has exactly these
fields:

- `provider`, `id`, `baseUrl`, `api`, `reasoning`, `contextWindow`, `maxTokens`
- `inputModalities: readonly ('text'|'image')[]`
- `rates: { input, output }`, each `{ value, unit: 'USD per 1M tokens' }`
- `thinkingLevels`: `{ status: 'unknown' }` or `{ status: 'declared', levels:
  readonly { level, providerValue: string | null }[] }`

Exported constants:

- `CATALOG_FRESHNESS_MAX_AGE_MS = 86_400_000`
- `META_ROUTER_IDS = ['openrouter/auto', 'openrouter/auto-beta', 'auto']`
- `REFUSED_VARIANT_SUFFIXES = [':free', ':nitro', ':floor', ':batch']`
- `RATE_UNIT`
- the two refusal-code tuples below

**Closed refusal codes.** Names reuse the P0 evidence labels where the meaning
matches. Snapshot and authority codes are listed in pipeline order, and the
first failure wins:

`DIGEST_REFUSED`, `FORMAT_REFUSED`, `MALFORMED_REFUSED`,
`DUPLICATE_PROVIDER_REFUSED`, `DUPLICATE_IDENTITY_REFUSED`,
`TIME_INVALID_REFUSED`, `SOURCE_TIME_UNKNOWN_REFUSED`, `FUTURE_REFUSED`,
`STALE_REFUSED`, `AUTHORITY_UNKNOWN_REFUSED`, `AUTHORITY_INVALID_REFUSED`,
`REQUEST_INVALID_REFUSED`.

Identity codes, in declared collection order:

`AMBIGUOUS_IDENTITY_REFUSED`, `META_ROUTER_REFUSED`, `VARIANT_REFUSED`,
`MISSING_PROVIDER_REFUSED`, `MISSING_MODEL_REFUSED`,
`ENDPOINT_AUTHORITY_UNKNOWN_REFUSED`, `ENDPOINT_MISMATCH_REFUSED`,
`SENTINEL_RATE_REFUSED`, `RATE_REFUSED`, `MODALITY_REFUSED`.

Adding any code requires a coordinator amendment.

## Fixture Policy

There is one committed fixture, `baseline.v1.json`, in canonical bytes. Its
records are either copied field-for-field from the committed sanitized P0
snapshot, checked by AC15, or hand-built under the `fixture-` provider prefix.
Minimum P0-derived set:

- `nvidia/nemotron-3.5-lightning`, `z-ai/glm-5.3` under both `openrouter` and
  `nvidia`, and `openai/gpt-4o-mini`
- the four `/api` Anthropic IDs
- `openrouter/auto`, `openrouter/auto-beta`, `auto`
- one `:free` and one `:batch` ID
- one `opencode`/`opencode-go` shared ID

Every `checkedAtUtc` in the fixture is synthetic, because P0 exported none, and
the fixture says so in `sourceRef`. Negative cases are in-memory mutations of
the fixture bytes or parsed clones, re-serialized canonically with a
recomputed digest. No raw host data, settings projection values beyond public
endpoints, credentials, headers, or `compat` payloads appear anywhere.

## Verification Plan

Run in PowerShell from the builder worktree root. Check `$LASTEXITCODE` after
every native command, and never read an exit code through a pipeline.

```powershell
node -v; if ($LASTEXITCODE -ne 0) { throw 'node' }
git rev-parse HEAD; git status --short --untracked-files=all
Push-Location plugins/foreman-line/schema-scaffold
npm ci --ignore-scripts --no-audit --no-fund --offline; if ($LASTEXITCODE -ne 0) { throw 'ci scaffold' }
Pop-Location; Push-Location plugins/foreman-line/routing-policy
npm ci --ignore-scripts --no-audit --no-fund --offline; if ($LASTEXITCODE -ne 0) { throw 'ci' }
npm test;          if ($LASTEXITCODE -ne 0) { throw 'test' }
npm run typecheck; if ($LASTEXITCODE -ne 0) { throw 'typecheck' }
npm run lint;      if ($LASTEXITCODE -ne 0) { throw 'lint' }
Pop-Location
git diff --name-only 37cbb5c0f4ae5f203842735beef4833a16d41095
git diff --check 37cbb5c0f4ae5f203842735beef4833a16d41095; if ($LASTEXITCODE -ne 0) { throw 'ws' }
rg -n "catalog-snapshot|eligibility\.js|projectEligibility|readCatalogSnapshot" plugins/foreman-line --glob "!plugins/foreman-line/routing-policy/**" --glob "!plugins/foreman-line/docs/**"
rg -n -i "api[_-]?key|bearer|authorization|secret" plugins/foreman-line/routing-policy/tests/fixtures/catalog-snapshot
```

The two `rg` searches must return exit 1, meaning no matches. If an offline
install misses the cache, stop and report. Do not fall back to network install.
The coordinator may additionally run the full offline CI runner,
`node scripts/foreman-line-ci.mjs <npm-cli.js> --offline`.

**Mandated reviewer focus questions:**

- Can any rejected class reach `outcome: 'facts'` through ordering, a
  catalog-absent path, or a zero price?
- Does any path read the clock, environment, filesystem, or network, including
  through a transitively imported helper?
- Is endpoint equality truly exact, and is a missing approved endpoint ever
  treated as "matches the catalog"?
- Is freshness computed from explicit operands with correct boundary
  semantics, and can a `null` provider time be skipped instead of refusing?
- Can a caller forge a `CatalogSnapshot` that bypasses digest and shape
  checks?
- Does any refusal or error echo catalog strings or other untrusted input?

## Open Questions

- **OQ-1, HAWF hold.** `charter.md:52-54` and P0 AC4 say the unresolved HAWF/INDEX
  ownership conflict blocks P1. HAWF is the superseded
  heterogeneous-agent-worker-fabric goal, still listed as awaiting pickup in the
  goal index. The P0 disposition is still `escalated-unresolved`. The
  2026-09-22 ruling nonetheless releases P1 on that `complete:false` evidence.
  *Recommendation:* the coordinator records at Step 0 that the ruling
  supersedes the hold for P1 only. P1 touches no ownership or routing authority.
- **OQ-2, input format.** The raw `models-store.json` shape was never verified,
  because P0 saw only an allowlist projection, and the P0 fact record is
  declared "not a frozen API". *Recommendation:* P1 owns the closed
  `rcm-catalog-snapshot/v1` projection. A raw-store adapter with credential
  exclusion belongs to P6 or the host owner.
- **OQ-3, meta-router set.** The charter names only `openrouter/auto` and
  `auto`. P0 also shows `openrouter/auto-beta`, which the sentinel check already
  catches, plus `openrouter/free` and `openrouter/fusion` at 0/0.
  Whether the last two are meta-routers is unverified. *Recommendation:* add
  `openrouter/auto-beta` by amendment. Leave free and fusion for P6 evidence.
- **OQ-4, zero rates.** 70 P0 records declare 0/0. *Recommendation:* treat zero
  as a declared fact. Only negative values are sentinels.
- **OQ-5, other colon suffixes.** The charter names four suffixes. All 94
  colon IDs in P0 are `:batch` or `:free`. *Recommendation:* refuse any
  colon-suffixed ID as `VARIANT_REFUSED`, default-deny, because policy IDs are
  bare slugs. This widens the charter text and needs a ruling.
- **OQ-6, freshness scope.** *Recommendation:* use the oldest provider time in
  the whole snapshot rather than only the requested providers, since the
  cache refreshes wholesale.
- **OQ-7, public export.** Dispatch imports `routing-policy/src/index.ts`.
  *Recommendation:* do not export from `index.ts` in P1, so dispatch's import
  graph is provably unchanged. P3/P5 add the export when they consume it.
- **OQ-8, approved-config source.** The approved configuration source (H04 in
  the P0 environment map) was never supplied. The template is not proof.
  *Recommendation:* P1 takes the configuration as data only. P5/P4A and a human
  ruling bind the source.
- **OQ-9, thinking map.** P0 labelled an absent map
  `UNKNOWN_CAPABILITY_REFUSED`. *Recommendation:* P1 returns typed
  `unknown`, and P5 refuses against a requested level.
- **OQ-10, toolchain.** Host Node is v24.7.0. The shaping template says
  `>=24.11.1`, package engines say `>=22`, and CI pins 24.19.0. The JEV-P1
  handoff reported the native TypeScript compiler unavailable.
  *Recommendation:* package engines govern locally, CI is authoritative, and
  a typecheck toolchain failure is reported, not waived.

## Coordinator Rulings (2026-09-22)

Coordinator lint verified the spec's disk claims against the P0 snapshot, the
charter, `routing-policy/package.json`, and dispatch's imports. The spec linter
passes, and `npm run typecheck` in `routing-policy` exits 0 on host Node v24.7.0.
The builder treats these rulings as binding:

- **OQ-1:** building and reviewing P1 proceed. P1 is an unwired library that
  creates no routing or ownership authority, so it is orthogonal to the HAWF
  conflict. The charter's HAWF sentence is not amended. Whether it blocks the
  P1 merge is left to the human Gate 3 decision.
- **OQ-2, OQ-4, OQ-6, OQ-7, OQ-8, OQ-9:** accepted as recommended.
- **OQ-3:** `openrouter/auto-beta` joins `META_ROUTER_IDS`. `openrouter/free`
  and `openrouter/fusion` are deferred to RCM-P6 evidence.
- **OQ-5:** any colon in an ID refuses as `VARIANT_REFUSED`. The charter's four
  suffixes remain individually tested. This is stricter than the charter's
  list and changes no locked decision.
- **OQ-10:** local typecheck works, so native `test`, `typecheck`, and `lint` are
  all mandatory. A toolchain failure is a stop-and-report, not a waiver.

**Step-0 amendment A1 (2026-09-22).** The builder's Step-0 flags exposed two
unnamed contract details. They are fixed as follows:

- The 12-code pipeline tuple is exported as `SNAPSHOT_REFUSAL_CODES`, next to
  `IDENTITY_REFUSAL_CODES`.
- `ProjectionResult` failure levels: `TIME_INVALID_REFUSED` caused by
  `evaluationTimeUtc` is `level: 'request'`. `TIME_INVALID_REFUSED` caused by a
  provider `checkedAtUtc`, and `SOURCE_TIME_UNKNOWN_REFUSED`, `FUTURE_REFUSED`,
  and `STALE_REFUSED`, are `level: 'snapshot'`. `AUTHORITY_*` codes are
  `level: 'authority'`. `REQUEST_INVALID_REFUSED` is `level: 'request'`. AC14
  tests assert the level for each.
- The reader checks `checkedAtUtc` only for type (`string | null`, else
  `MALFORMED_REFUSED`). The projector checks its ISO format and round-trip
  (`TIME_INVALID_REFUSED`).
- `DIGEST_REFUSED` through `DUPLICATE_IDENTITY_REFUSED` come from the reader
  only. `projectEligibility` never returns them.

**Review amendment A2 (2026-09-22).** The adversarial review of `cf20fd8`
reproduced that a forged or post-read-mutated snapshot yields facts, and that
hostile inputs throw. A2 adds these binding rules:

- **Reader-issued snapshots only.** The reader deep-freezes every snapshot it
  returns and records it in a module-private `WeakSet`. `projectEligibility`
  first checks membership. A snapshot that is absent, not an object, or not
  reader-issued refuses with the new code `SNAPSHOT_UNVERIFIED_REFUSED`,
  `level: 'snapshot'`. It is the first entry in the projector's pipeline and is
  appended to `SNAPSHOT_REFUSAL_CODES` as the 13th code.
- **Never throw.** `readCatalogSnapshot` and `projectEligibility` return a typed
  refusal for every input, including `null`, `undefined`, non-`Uint8Array`
  bytes, proxies, and getters that throw. A throw while reading
  `approvedConfig` refuses `AUTHORITY_INVALID_REFUSED`. A throw while reading
  `identities` or any identity refuses `REQUEST_INVALID_REFUSED`. Non-byte
  input to the reader refuses `FORMAT_REFUSED`.
- **Read caller input once.** Each identity's `provider` and `id` are read
  exactly once into a plain copy. The duplicate check, the evaluation, and
  `requested` all use that copy.
- **Own properties only.** Closed-shape checks on caller and catalog objects use
  own-property tests, never `in`. Keys such as `__proto__` in a thinking map are
  kept verbatim as levels, never dropped.
- **URL strictness.** A `baseUrl` containing `?`, `#`, or `@` anywhere refuses,
  including empty query, fragment, and userinfo.
- **Purity proof.** The runtime probe also stubs the `Date` constructor,
  `performance.now`, `setTimeout`, `setInterval`, and `setImmediate`. The static
  scan must include positive-control tests showing it flags every construct the
  review listed as missed.

**Review amendment A3 (2026-09-22).** The third review of `c13e4bb`, reproduced by
the coordinator, found two gaps. A3 adds these binding rules:

- **Request-size caps.** The exported frozen constant
  `MAX_REQUESTED_IDENTITIES = 256` bounds the request. An `identities` length
  greater than 256 refuses `REQUEST_INVALID_REFUSED`, level `request`. The
  exported frozen constant `MAX_APPROVED_ENDPOINTS = 256` bounds the
  configuration. An `approvedConfig.endpoints` length greater than 256 refuses
  `AUTHORITY_INVALID_REFUSED`, level `authority`. Each cap is checked on the
  single length read, before any allocation or iteration.
- **Every provider time is bounded.** Any provider `checkedAtUtc` later than the
  evaluation time refuses `FUTURE_REFUSED`, not only the oldest one. Staleness
  is still measured from the oldest provider time.
- **Threat model, stated in the README.** Callers are same-process code. Refusals
  cover hostile values passed as arguments. Tampering with shared globals or
  built-in prototypes in the same realm is out of scope, and so is resource
  exhaustion below the caps.

## Session Handoff

The shaper returns this draft path, the base commit, and open questions. No
commit, no status flip, no shaping-result file. The builder returns AC-by-AC
test names and counts, commands with native exits, the exact diff list, and
any flag. A contract change stops for a coordinator amendment committed before
code.

## Stop-and-Report Rule

Stop and report if work needs any of the following:

- a path outside Allowed Files
- a new dependency or a refusal code not in the contract
- network or credential access
- a change to P0 evidence or goal controls
- wiring into dispatch
- resolving any open question without a ruling
