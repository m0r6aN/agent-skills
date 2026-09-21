# JEV-P0 — Seventh rework verification record

## Scope

This record verifies the seventh JEV-P0 contract/evidence-boundary rework only.
It does not authorize JEV-P1 or later, provider calls, runtime use, spend,
credential access, dispatch, promotion, or Gate 3. The only mutation authority
is:

- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md`

Every other path and effect is forbidden. The exact seventh-rework base is
`2187402c218499fba8b413bec2c6824efd92ed8f`.

## Seventh-rework closure checklist

The three allowed documents explicitly close these findings while preserving
all earlier identity, schema, answer, JCS, transport, custody, lease, budget,
terminal, recommendation, refusal, and parent-surface controls:

1. Privacy uses the exact finite support-triage question array, closed state
   enums/numeric bounds, duplicate/unknown-field refusal, and no caller free
text outside the fixed schema.
2. Evidence metadata uses explicit required/forbidden field sets for every
   evidence class and status, generated opaque IDs, finite repository/ref/path
   literals, custody fields, timestamps, digests, status, reason, wrapper
   fields, and retention; no free text is permitted.
3. The closed cost object has exactly `amount` and `currency`; refusal/hold
   field sets forbid `cost`.
4. Complete fixtures require exact four-way response-ID equality and exact
   wrapper/provenance/manifest-entry custody equality.
5. Non-complete provenance uses only JSON string `"none"`; complete provenance
   rejects `none` and requires provider-declared response IDs.
6. The closed `budget_ack` object is mandatory for every live call and is bound
   to run/capability/request digest and custody; there is no direct enforcement
   alternative.
7. Scope proof first enumerates the complete unfiltered two-commit diff from
   the exact base to the coordinator-supplied expected reviewed head and
   asserts exact set equality, exact `M` statuses, and native exit codes before
   reporting success.

## Dependency-free verification commands

Run from `C:\Repos\foreman-line-jev-p0` in PowerShell. No dependency
installation is part of this parcel. The coordinator must supply the immutable
expected reviewed-head SHA captured before execution; the script must not
derive it from `HEAD`.

### 1. Environment probe

```powershell
node -v
```

The shaping package declares `>=24.11.1`; a lower version is an environment
limitation, not a contract pass.

### 2. Full base-to-head scope proof, then filtered checks

Run after the resulting rework commit exists:

```powershell
param(
  [Parameter(Mandatory = $true)]
  [string]$ExpectedHead
)

$base = '2187402c218499fba8b413bec2c6824efd92ed8f'
$allowed = @(
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md'
)
if ([string]::IsNullOrWhiteSpace($ExpectedHead) -or
    $ExpectedHead -cnotmatch '^[0-9a-f]{40}$') {
  throw 'ExpectedHead is missing or is not exactly 40 lowercase hexadecimal characters'
}
$head = (git rev-parse --verify HEAD).Trim()
if ($LASTEXITCODE -ne 0) { throw 'git rev-parse HEAD failed' }
if ($head -cne $ExpectedHead) { throw "HEAD does not equal immutable ExpectedHead $ExpectedHead" }
# First enumerate without any path filter; no forbidden path can be hidden.
$allChanged = @(git diff --name-only "$base..$head")
if ($LASTEXITCODE -ne 0) { throw 'git diff --name-only failed' }
Write-Output 'full_base_to_head_changed_paths:'
$allChanged
$expectedSet = @($allowed | Sort-Object -Unique)
$actualSet = @($allChanged | Sort-Object -Unique)
$setDelta = @(Compare-Object -ReferenceObject $expectedSet -DifferenceObject $actualSet)
if ($setDelta.Count -ne 0 -or $actualSet.Count -ne $expectedSet.Count) { throw 'full base-to-head path set is not exactly the Allowed Files set' }
# Only after exact full-set equality do filtered checks run.
git diff --check "$base..$head" -- $allowed
if ($LASTEXITCODE -ne 0) { throw 'git diff --check failed' }
Write-Output 'filtered_whitespace=passed'
$nameStatus = @(git diff --name-status "$base..$head" -- $allowed)
if ($LASTEXITCODE -ne 0) { throw 'git diff --name-status failed' }
$expectedStatus = @(
  "M`tplugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md",
  "M`tplugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md",
  "M`tplugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md"
)
if ($nameStatus.Count -ne $expectedStatus.Count -or
    @(Compare-Object -ReferenceObject $expectedStatus -DifferenceObject $nameStatus).Count -ne 0) {
  throw 'filtered name-status is not exactly M for the three Allowed Files'
}
$nameStatus
Write-Output 'filtered_status=passed'
Write-Output "base=$base"
Write-Output "head=$head"
Write-Output "expected_reviewed_head=$ExpectedHead"
Write-Output 'base_to_head_scope_checked_status_and_head_assertion=passed'
```

This is the authoritative scope proof. It compares the complete unfiltered
path set from the exact seventh-rework base to the coordinator-supplied
immutable expected reviewed head, asserts exact set equality and exact `M`
statuses, checks each native exit code immediately, and only then reports
success. It does not use a clean-worktree assertion as the scope proof.

### 3. Targeted active-spec tooling limitation

The frontmatter linter and shaping advisory self-check, if coordinator-run,
target only this active spec; they do not lint the three goal documents:

```text
plugins/foreman-line/docs/specs/active/JEV-P0-alpha-decisions-contract-and-evidence-boundary.md
```

The commands are:

```powershell
Set-Location plugins/foreman-line/spec-linter
npx --no-install tsx src/cli.ts validate ../docs/specs/active/JEV-P0-alpha-decisions-contract-and-evidence-boundary.md
Set-Location ../../..
Set-Location plugins/foreman-line/shaping
npx --no-install tsx -e "import { readFileSync } from 'node:fs'; import { selfCheckDraft } from './src/index.ts'; const p = '../docs/specs/active/JEV-P0-alpha-decisions-contract-and-evidence-boundary.md'; const r = selfCheckDraft(readFileSync(p, 'utf8')); console.log(JSON.stringify(r)); if (!r.valid) process.exit(1)"
Set-Location ../../..
```

The available environment is limited: local `ajv` is missing, Node is
`v24.7.0` below the shaping package engine floor, and no dependency install is
authorized. These tools do not lint the three goal documents.

## Field-by-field review

The builder read-only review must confirm:

- closed ASCII-only request grammar, exact refusal regexes, bounds, duplicate
  rules, unknown-field refusal, and zero retention for rejected metadata;
- closed usage/source/ID/path/timestamp/digest/status/retention schemas with
  exact enums/regexes/number bounds, generated IDs, finite custody literals,
  and no free text;
- cost type, exact USD currency, non-negative finite value, and cap;
- canonical provenance object, JCS provenance digest, exact manifest custody,
  and no mutable/self-recomputed fixture acceptance;
- exact complete-fixture equality between provenance and served response IDs;
- immutable transport authority, forbidden caller headers/body/endpoint,
  measured transmitted bytes, redirect refusal, and final TLS origin;
- coordinator-issued run/lease, CAS/create-if-absent claim, immutable binding,
  provider/account budget acknowledgement, and append-only terminal state;
- existing identity, schema, answer, JCS, size, recommendation, refusal, and
  parent-surface requirements remain intact.

## Parent-surface negative proof

The final full base-to-head diff must show no change outside the three allowed
goal documents, including parent RCM D13/charter/directive, boundary-routing
D10, routing registry/policy, Pi, host, credentials, HAWF, Helmholtz, GMF,
code, schemas, tests, fixtures, receipts, Jira, worktrees, installed plugins,
or downstream JEV surfaces.

## Independent review gate

Two independent fresh frontier reviews remain required before Gate 3. Reviewers
must be read-only and independent of the author and each other, and must assess
privacy grammar, metadata bounds, provenance equality/custody, transport
authority, atomic lease/budget/terminal guarantees, identity binding, refusal
completeness, recommendation authorization, and parent-surface collision. The
builder does not self-approve or merge.

## Execution record

| Check | Result | Evidence |
|---|---|---|
| Starting branch/base | `codex/jev-p0-contract`, base `2187402c218499fba8b413bec2c6824efd92ed8f` | Confirmed before seventh-rework edits. |
| `node -v` | Passed: `v24.7.0`; below shaping requirement `>=24.11.1` | Dependency-free environment probe. |
| Expected reviewed head | Passed: coordinator-supplied `ExpectedHead` was present, exactly 40 lowercase hex characters, and matched `git rev-parse --verify HEAD`; the exact observed SHA is reported in the handoff | The script never derives the expected value from `HEAD`. |
| Full base-to-head scope comparison | Passed: exact unfiltered set from base `2187402c218499fba8b413bec2c6824efd92ed8f` to the externally expected reviewed head exactly equaled the three Allowed Files | `git diff --name-only` was unfiltered; set equality passed before filtered checks. |
| Filtered base-to-head `git diff --check` and status | Passed: no whitespace errors; all three allowed paths reported `M` exactly | Native exit codes were checked immediately after each command; exact name-status equality passed. |
| Targeted active-spec linter/self-check | Environment limitation: local `ajv` missing; no install | These tools do not lint the three goal documents. |
| Field-by-field seventh-rework review | Passed as a builder read-only content check; not independent approval | Exact cost object, four-way response-ID equality, custody equality, timestamp grammar, and prior controls were checked. |
| Independent frontier review A | Observed result: no fresh report supplied or performed in this builder session (`0/2`) | Coordinator must supply and triage; no pass inferred. |
| Independent frontier review B | Observed result: no fresh report supplied or performed in this builder session (`0/2`) | Coordinator must supply and triage; no pass inferred. |
| Gate 3 / merge | Not granted; human-owned | No self-approval or merge. |

## Completion boundary

The seventh rework is document-complete when all current findings are explicit
and testable in the three allowed documents, the dependency-free full
base-to-head scope and whitespace commands pass, and environment limitations
are accurately recorded. It is not Gate 3-ready until two independent fresh
frontier reviews are supplied and coordinator-triaged.
