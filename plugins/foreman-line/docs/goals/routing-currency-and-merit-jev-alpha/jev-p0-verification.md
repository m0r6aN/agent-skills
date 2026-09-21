# JEV-P0 — Rework verification record and negative-proof plan

## Scope

This record verifies the JEV-P0 contract and evidence-boundary documents only.
It does not authorize JEV-P1 or later, a provider call, runtime use, spend,
credential access, dispatch, promotion, or Gate 3. The only mutation authority
for the parcel is:

- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md`

Every other path and effect is forbidden. This rework closes the eleven
coordinator-directed Review A/B findings without changing any parent, host,
runtime, provider, or downstream surface.

## Verification authority and environment boundary

These goal documents are Markdown artifacts, not dispatchable frontmatter
specs. Their content is reviewed against the active JEV-P0 spec; they are not
the target of the repository frontmatter linter. The frontmatter linter and
shaping advisory self-check are run coordinator-side against the exact active
spec only:

`plugins/foreman-line/docs/specs/active/JEV-P0-alpha-decisions-contract-and-evidence-boundary.md`

The builder must not claim that either tool validated the three contract
documents. In the current worktree, the targeted checks are environment-
limited because the local `ajv` dependency is absent, and the installed Node
version is below the shaping package's declared engine floor. No dependency
installation is authorized for this parcel.

## Required coordinator-side checks

Run from `C:\Repos\foreman-line-jev-p0`, in PowerShell, with the version probe
first. These commands are read-only and target only the active spec or the
allowed document diff.

### 1. Targeted active-spec frontmatter lint

```powershell
node -v
Set-Location plugins/foreman-line/spec-linter
npx --no-install tsx src/cli.ts validate ../docs/specs/active/JEV-P0-alpha-decisions-contract-and-evidence-boundary.md
Set-Location ../../..
```

This command does not lint `jev-p0-contract.md`,
`jev-p0-evidence-boundary.md`, or `jev-p0-verification.md`. A missing local
dependency is an environment limitation, not a contract-document result.

### 2. Targeted active-spec two-layer advisory self-check

```powershell
Set-Location plugins/foreman-line/shaping
npx --no-install tsx -e "import { readFileSync } from 'node:fs'; import { selfCheckDraft } from './src/index.ts'; const p = '../docs/specs/active/JEV-P0-alpha-decisions-contract-and-evidence-boundary.md'; const r = selfCheckDraft(readFileSync(p, 'utf8')); console.log(JSON.stringify(r)); if (!r.valid) process.exit(1)"
Set-Location ../../..
```

This is also targeted only at the active spec. It checks the delegated
frontmatter layer and required body-section order without writing, moving, or
promoting any spec.

### 3. Exact scope, whitespace, and parent-surface checks

```powershell
$allowed = @(
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md'
)
$trackedChanged = @(git diff --name-only HEAD)
$untracked = @(git ls-files --others --exclude-standard)
$changed = @($trackedChanged + $untracked | Sort-Object -Unique)
if (@($changed | Where-Object { $_ -notin $allowed }).Count -ne 0) { throw 'forbidden changed path' }
if (@($changed | Where-Object { $_ -in $allowed }).Count -ne 3) { throw 'expected exactly three changed files' }
git diff --check
git diff -- $allowed
```

Success requires exactly the three allowed paths, no whitespace error, and no
change to parent RCM, JEV authority, routing, Pi, HAWF, Helmholtz, GMF, host,
credential, schema, code, test, fixture, receipt, or downstream surfaces.

### 4. Rework-content assertions

Perform a read-only field-by-field review of the three allowed documents and
confirm every item in the following checklist:

1. `served_identity.model` and `response_id` come only from the authenticated
   provider response; no client synthesis/fallback is possible; served metadata
   is non-D13; a negative fixture changes/removes `model` or `response_id`.
2. RFC 8785/JCS is the canonical logical-byte procedure; UTF-8 and SHA-256
   steps are explicit; raw body bytes are distinct; both JCS vectors are
   present.
3. Complete status requires provider-declared parseable `response_id` and
   `server_timestamp_utc`; missing/unparseable values are terminal holds.
4. Choice distributions use absolute tolerance `1e-12`; no renormalization,
   clamping, repair, or silent key insertion is allowed.
5. Request size is raw UTF-8 serialized body before transmission; response size
   is raw UTF-8 body before parse/persistence; both are `<= 65,536` bytes.
6. The endpoint is an immutable capability-owned constant; caller endpoints,
   redirects, origin changes, method/host/path/TLS mismatches, and transport
   failures refuse.
7. A coordinator-issued `run_id`, atomic single-call lease, pre-call budget
   reservation, concurrency one, zero retries, and terminal non-USD/over-cap
   holds are explicit.
8. Fixtures require immutable reviewable manifest/commit custody, fixture ID,
   paired digests, provenance digest, and the trusted custody rule.
9. Holds are terminal, non-consumable, and non-retryable pending coordinator
   disposition; TLS/certificate, redirect, non-2xx, content-type, transport,
   decompression, and truncation refusals are present.
10. `support-triage-advisory-v1` has an exact allowlist with no commands,
    capability tokens, recipients, or effect fields; independent application
    authorization and negative tests are required.
11. This verification record targets active-spec lint only and accurately states
    the dependency/Node environment limitation.

### 5. JCS vector and recommendation negative checks

The later deterministic validator/replay parcel must reproduce these exact
JCS vectors from the evidence-boundary document:

| Vector | Canonical UTF-8 bytes | SHA-256 |
|---|---|---|
| `jev-jcs-request-001` | `{"a":1,"b":[true,"x"]}` | `63e8063d9dc6f0fd5a24b4706818a165fd57c3531b74466cf5dea62bff09b0b6` |
| `jev-jcs-response-001` | `{"model":"typesafe/jev-1.13","response_id":"r-001","schema_version":"jev-decisions/v1"}` | `dab820809e40697f1bdcc99736067d9d282090766ae72d0e65137daf3cf6bca2` |

The review must also require negative recommendation cases for injected
`command`, `capability_token`, `recipients`, `effect`, `route`, `escalate`,
`spend`, or `mutation` fields, and for bypassing the independent application
authorization gate.

## Parent-surface negative proof plan

The parcel must prove absence of mutation, not infer it from intent. The final
path-scoped diff must show unchanged content for:

| Surface | Negative proof |
|---|---|
| Parent RCM D13, charter, loop directive, and boundary-routing D10 | No changed path and no wording that amends or reinterprets them. |
| RCM routing registry/policy and standard routing | No route registration, catalog substitution, or general model-selection authority. |
| JEV charter and loop directive | No changed path; this parcel records ratified decisions without editing them. |
| Pi template/settings, host, credentials | No changed path, credential read, setting mutation, or secret-bearing evidence. |
| HAWF and Helmholtz | No action, handoff, invocation, or changed path. |
| GMF receipt/envelope contracts | No changed path, receipt minting, or runtime envelope creation. |
| Code, schemas, tests, fixtures, receipts, Jira, worktrees, installed plugins | No changed path or generated artifact; documentation only. |

## Mandated independent review gate

Two independent fresh frontier reviews are required before any Gate 3 request.
The reviewers must be read-only and independent of both the author and each
other. Each report must answer:

1. Can served identity be forged, synthesized, or confused with requested
   identity or parent RCM D13 eligibility?
2. Can raw wire bytes, JCS bytes, digests, fixtures, or reports leak a
   credential or unsafe payload?
3. Are complete metadata, distribution tolerance, transport, lease, budget,
   timeout, and cost holds concrete and fail closed?
4. Does replay require trusted manifest/commit custody and reproduce both JCS
   vectors and paired identity-bound digests?
5. Can redirects, non-2xx, content-type, TLS, decompression, truncation,
   malformed, incomplete, or provider-unbound responses escape refusal?
6. Can the recommendation object acquire commands, capabilities, recipients,
   effects, routing, escalation, spend, or mutation without independent
   application authorization?
7. Can any parent/shared surface acquire authority by implication?

The builder does not self-approve these reviews. Findings are triaged by the
coordinator; unresolved findings block Gate 3.

## Execution record

| Check | Result | Evidence |
|---|---|---|
| Starting branch and commit | `codex/jev-p0-contract` at rework starting commit `0d52d12` | Confirmed before edits. |
| `node -v` | Passed: `v24.7.0`; shaping package declares `>=24.11.1` | First check; the engine-floor mismatch is recorded as an environment limitation. |
| Targeted active-spec frontmatter lint | Blocked: exit 1 before validation because local `ajv` is missing; no dependency install performed | Targets the active spec only; never the three goal docs. |
| Targeted active-spec shaping self-check | Blocked: exit 1 before validation because local `ajv` is missing; no dependency install performed | Targets the active spec only. |
| Exact allowed-file/path-scoped diff | Passed: exactly the three allowed paths; no other changed or untracked paths | Must be exactly three allowed paths. |
| `git diff --check` | Passed: no whitespace errors | Read-only check. |
| Eleven-item rework-content review | Completed by builder against sections 4–5; independent review remains required | Checklist in sections 4–5. |
| Two independent fresh frontier reviews | Coordinator-owned; not performed by builder | Required before Gate 3. |
| Gate 3 / merge | Not granted; human-owned | No self-approval or merge. |

## Completion boundary

The rework is document-complete only when all eleven findings are explicitly
closed in the three allowed documents, the exact scope and whitespace checks
pass, and the verification record accurately reports the targeted active-spec
checks and environment limitations. It is not Gate 3-ready until the two
independent fresh frontier reviews are complete and triaged by the coordinator.
