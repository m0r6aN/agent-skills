# JEV-P0 — Verification record and negative-proof plan

## Scope

This record verifies the JEV-P0 contract and evidence-boundary documents only.
It does not authorize JEV-P1 or later, a provider call, runtime use, spend,
credential access, dispatch, promotion, or Gate 3. The only mutation authority
for the parcel is:

- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md`

Every other path and effect is forbidden. This file records local checks and
the evidence still required from the coordinator before Gate 3.

## Required local checks

Run all commands from `C:\Repos\foreman-line-jev-p0`, in PowerShell, with the
version probe first. These checks are read-only after authoring the documents.

### 1. Version and frozen frontmatter lint

```powershell
node -v
Set-Location plugins/foreman-line/spec-linter
npx tsx src/cli.ts validate ../docs/specs/active/JEV-P0-alpha-decisions-contract-and-evidence-boundary.md
Set-Location ../../..
```

Success requires a supported Node version and linter exit 0 for the exact
active spec. Advisory warnings may be printed; they are not failures.

### 2. Two-layer shaping advisory self-check

```powershell
Set-Location plugins/foreman-line/shaping
npx tsx -e "import { readFileSync } from 'node:fs'; import { selfCheckDraft } from './src/index.ts'; const p = '../docs/specs/active/JEV-P0-alpha-decisions-contract-and-evidence-boundary.md'; const r = selfCheckDraft(readFileSync(p, 'utf8')); console.log(JSON.stringify(r)); if (!r.valid) process.exit(1)"
Set-Location ../../..
```

Success requires both delegated frontmatter validation and the body-section
check to pass. The required body sections are `Intent`, `Constraints`,
`Acceptance Criteria`, `Out of Scope`, and `Context & References`, in order,
with non-empty `Out of Scope`. This advisory check never promotes or mutates a
spec.

### 3. Scope, whitespace, and parent-surface checks

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

Success requires exactly the three allowed paths, no forbidden path, no
whitespace error, and no change to parent RCM, JEV authority, routing, Pi,
HAWF, Helmholtz, GMF, host, credential, schema, code, test, fixture, receipt,
or downstream surfaces.

### 4. Field-by-field contract review

Review the three documents against the active spec and ratified J1–J10
replacement decisions. Confirm, at minimum:

- Capability ownership and the exact endpoint are literal and exclusive.
- Requested identity is exact and case-sensitive; served identity is separate
  and cannot satisfy D13.
- `jev-decisions/v1`, complete typed envelopes, criteria coverage, answer
  matching, confidence/distribution rules, response ID, and 64-KiB request and
  response refusals are explicit.
- Evidence contains the required safe live metadata, canonical request and
  response digests, provenance, timestamps, usage, and currency-qualified cost;
  it excludes credentials and unsafe payloads.
- One call, zero retries, concurrency one, 30-second timeout, 64-KiB limits,
  and `$0.01 USD` aggregate cap are explicit and fail closed.
- Replay is fixture-based and deterministic; live observations are not replay
  authority.
- The refusal matrix covers endpoint, identities, schema, malformed or
  incomplete envelopes, missing answers, malformed distributions,
  authentication, timeout, size, non-JSON, unqualified cost, digest,
  provenance, binding, retry, and unauthorized consumer failures.
- Only `support-triage-advisory-v1` may consume recommendation data, and Jev
  cannot route, escalate, spend, mutate, or authorize effects.

## Parent-surface negative proof plan

The parcel must prove absence of mutation, not infer it from intent. The
coordinator should inspect the final path-scoped diff and confirm unchanged
content for:

| Surface | Negative proof |
|---|---|
| Parent RCM D13, charter, loop directive, and boundary-routing D10 | No changed path and no contract wording that amends or reinterprets them. |
| RCM routing registry/policy and standard routing | No changed path, route registration, catalog substitution, or general model-selection authority. |
| JEV charter and loop directive | No changed path; this parcel records their ratified decisions without editing them. |
| Pi template/settings, host, credentials | No changed path, credential read, setting mutation, or secret-bearing evidence. |
| HAWF and Helmholtz | No action, handoff, invocation, or changed path. |
| GMF receipt/envelope contracts | No changed path, receipt minting, or runtime envelope creation. |
| Code, schemas, tests, fixtures, receipts, Jira, worktrees, installed plugins | No changed path or generated artifact; documentation only. |

## Mandated independent review gate

Two independent fresh frontier reviews are required before any Gate 3 request.
The reviewers must be read-only and independent of both the author and each
other. Each report must answer:

1. Can a served model identifier, alias, or endpoint mismatch be mistaken for
   the requested identity or parent RCM D13 eligibility?
2. Can any evidence, fixture, digest input, log, or review report contain a
   credential, raw authorization header, or unsafe payload?
3. Are one-call, zero-retry, timeout, request-size, concurrency, and
   currency-qualified-cost bounds concrete and fail closed?
4. Does replay prove the exact canonical request/response bytes and both
   identities while keeping live observations non-authoritative?
5. Can malformed, incomplete, non-JSON, or provider-unbound answers escape the
   refusal matrix?
6. Can `support-triage-advisory-v1` or any parent/shared surface acquire
   routing, escalation, spend, mutation, or host/Pi authority by implication?

The builder does not self-approve these reviews. A review finding is triaged by
the coordinator; unresolved findings block Gate 3.

## Execution record

The following table is completed after the local checks run. It distinguishes
passing deterministic checks from coordinator-owned review and merge gates.

| Check | Result | Evidence |
|---|---|---|
| Starting branch and commit | `codex/jev-p0-contract` at coordinator commit `0ee3f10` before edits | Confirmed in worktree. |
| `node -v` | Passed: `v24.7.0` | First verification command; the shaping package declares `>=24.11.1`, so this version is recorded as an environment mismatch. |
| Frozen spec-linter on exact active spec | Blocked: exit 1 before validation because local `ajv` is missing; no dependency install performed | Exact command in section 1. |
| Shaping two-layer advisory self-check | Blocked: exit 1 before validation because local `ajv` is missing; no dependency install performed | Exact command in section 2. |
| Allowed-file/path-scoped diff | Passed: exactly the three allowed files are present; no other changed or untracked paths | Exact command in section 3. |
| `git diff --check` | Passed: no whitespace errors | Exact command in section 3. |
| Field-by-field J1–J10 review | Documented coverage completed by builder; independent review remains required | Checklist in section 4. |
| Two independent fresh frontier reviews | Coordinator-owned; not performed by builder | Required before Gate 3. |
| Gate 3 / merge | Not granted; human-owned | No self-approval or merge. |

## Completion boundary

JEV-P0 is locally complete only when the three allowed documents exist, the
deterministic checks pass, the path-scoped diff is clean, and the field review
is recorded. It is not Gate 3-ready until the two independent fresh frontier
reviews are complete and triaged by the coordinator. JEV-P0 does not itself
request or grant that gate.
