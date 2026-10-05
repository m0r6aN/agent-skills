# JEV-P0 — Ninth-review rework verification record

## Scope

This record verifies the bounded JEV-P0 rework that closes the preserved ninth
review findings only.
It does not authorize JEV-P1 or later, provider calls, runtime use, spend,
credential access, dispatch, promotion, or Gate 3. The only mutation authority
is:

- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md`

Every other path and effect is forbidden. The exact rework base is the current
builder head before these edits:
`76836d84a15c3896c76970916293367483fcafb0`.

## Ninth-review closure checklist

The three allowed documents explicitly close these findings while preserving
all earlier identity, schema, answer, JCS, transport, custody, lease, budget,
terminal, recommendation, refusal, and parent-surface controls:

1. Complete replay fixtures bind duplicated wrapper fields to nested
   request/response/provenance and manifest-entry schema version, identities,
   response ID, timestamp, digests, IDs, source metadata, and custody fields.
2. `budget_ack` freshness has deterministic age, expiry, one-clock, run-start,
   lease, and transmission ordering rules.
3. Retention uses an explicit `captured_at_utc` provenance anchor for replay
   fixtures and explicit anchors for every other evidence class.
4. Stale field-count wording is removed; non-complete fixture custody equality
   is explicit and reason codes are partitioned by evidence class.
5. Scope proof opens the coordinator receipt, verifies its target SHA, matches
   it to the supplied target and reviewed `HEAD`, then checks the full
   unfiltered base-to-head path set before any filtered check.
6. The builder records deterministic local results without self-approving the
   two independent reviews or granting Gate 3.

## External coordinator traceability

The execution record's review target is supplied by the coordinator through
three immutable inputs: `CoordinatorTriageReceiptPath`, `CoordinatorTargetSha`,
and `ExpectedHead`. The receipt path identifies a coordinator-owned receipt
file. The command opens that exact file as strict UTF-8, rejects a missing,
non-file, unreadable, empty, or malformed path, and requires one exact receipt
line of the form `CoordinatorTargetSha: <40 lowercase-hex SHA>` (optional
horizontal whitespace around the separator is allowed). It extracts that
receipt value and requires it to equal the supplied `CoordinatorTargetSha`,
which must equal `ExpectedHead` and the verified `git rev-parse --verify HEAD`;
neither value is ever assigned from `HEAD`. A path that is merely non-empty, or
a receipt that does not name the exact reviewed target, fails closed. Coordinator review
evidence is external to this builder session; builder review counts remain
`0/2`, and no builder result is self-approval or Gate 3 authorization.

## Dependency-free verification commands

Run from `C:\Repos\foreman-line-jev-p0-rework` in PowerShell. No dependency
installation is part of this parcel. The coordinator must supply the immutable
expected reviewed-head SHA captured before execution; the script must not
derive it from `HEAD`.

### 1. Environment probe

```powershell
$nodeVersion = node -v
$nodeExitCode = $LASTEXITCODE
if ($nodeExitCode -ne 0) { throw "node -v failed with exit code $nodeExitCode" }
Write-Output "node_version=$nodeVersion"
Write-Output "node_exit_code=$nodeExitCode"
```

The shaping package declares `>=24.11.1`; a lower version is an environment
limitation, not a contract pass.

### 2. Full base-to-head scope proof, then filtered checks

Run after the resulting rework commit exists:

```powershell
param(
  [Parameter(Mandatory = $true)]
  [string]$ExpectedHead,
  [Parameter(Mandatory = $true)]
  [string]$CoordinatorTriageReceiptPath,
  [Parameter(Mandatory = $true)]
  [string]$CoordinatorTargetSha
)

$base = '76836d84a15c3896c76970916293367483fcafb0'
$allowed = @(
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md'
)
if ([string]::IsNullOrWhiteSpace($CoordinatorTriageReceiptPath) -or
    $CoordinatorTriageReceiptPath -match '[\x00-\x1F\x7F]' -or
    $CoordinatorTriageReceiptPath -match '\s') {
  throw 'CoordinatorTriageReceiptPath is missing or unsafe'
}
if ([string]::IsNullOrWhiteSpace($ExpectedHead) -or
    $ExpectedHead -cnotmatch '^[0-9a-f]{40}$') {
  throw 'ExpectedHead is missing or is not exactly 40 lowercase hexadecimal characters'
}
if ([string]::IsNullOrWhiteSpace($CoordinatorTargetSha) -or
    $CoordinatorTargetSha -cnotmatch '^[0-9a-f]{40}$') {
  throw 'CoordinatorTargetSha is missing or is not exactly 40 lowercase hexadecimal characters'
}
if ($CoordinatorTargetSha -cne $ExpectedHead) {
  throw 'CoordinatorTargetSha does not equal immutable ExpectedHead'
}
$receipt = Get-Item -LiteralPath $CoordinatorTriageReceiptPath -ErrorAction Stop
if (-not $receipt.PSIsContainer -and $receipt.Length -ge 0) { }
else { throw 'CoordinatorTriageReceiptPath is not a regular file' }
try {
  $utf8Strict = [System.Text.UTF8Encoding]::new($false, $true)
  $receiptText = [System.IO.File]::ReadAllText($receipt.FullName, $utf8Strict)
} catch {
  throw 'CoordinatorTriageReceiptPath could not be opened as strict UTF-8'
}
if ([string]::IsNullOrWhiteSpace($receiptText)) {
  throw 'Coordinator triage receipt is empty'
}
$receiptMatch = [regex]::Match(
  $receiptText,
  '(?m)^\s*CoordinatorTargetSha\s*[:=]\s*(?<sha>[0-9a-f]{40})\s*$'
)
if (-not $receiptMatch.Success) {
  throw 'Coordinator triage receipt has no exact CoordinatorTargetSha field'
}
$receiptTargetSha = $receiptMatch.Groups['sha'].Value
if ($receiptTargetSha -cne $CoordinatorTargetSha) {
  throw 'Coordinator triage receipt target does not equal CoordinatorTargetSha'
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
Write-Output "coordinator_target_sha=$CoordinatorTargetSha"
Write-Output "coordinator_triage_receipt_path=$CoordinatorTriageReceiptPath"
Write-Output 'coordinator_triage_receipt_open_and_target_match=passed'
Write-Output 'base_to_head_scope_checked_status_and_head_assertion=passed'
```

This is the authoritative scope proof. It compares the complete unfiltered
path set from the exact rework base to the coordinator-supplied
immutable expected reviewed head, asserts exact set equality and exact `M`
statuses, checks each native exit code immediately, and only then reports
success. It opens and matches the coordinator receipt before asserting the
reviewed head; it does not use a clean-worktree assertion as the scope proof.

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
  no mutable/self-recomputed fixture acceptance, and explicit non-complete
  wrapper/provenance custody equality;
- exact complete-fixture equality for nested schema version, requested/served
  identities, response IDs, response timestamp, digests, source metadata, IDs,
  and manifest custody;
- deterministic `budget_ack` age/expiry/clock/run-start/lease/transmission
  checks and explicit retention anchors;
- class-partitioned refusal/hold reason codes with no unprefixed code;
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
| Starting branch/base | `codex/jev-p0-rework10`, base `76836d84a15c3896c76970916293367483fcafb0` | Confirmed before ninth-review closure edits. |
| `node -v` | Passed: `v24.7.0`, native exit code `0`; below shaping requirement `>=24.11.1` | Immediate exit-code capture/check followed `node -v`. |
| Coordinator review target and receipt | Blocked: no external `CoordinatorTriageReceiptPath`, `CoordinatorTargetSha`, or `ExpectedHead` was supplied to this builder session | The verification command requires the receipt to exist, be read as strict UTF-8, and name a matching `CoordinatorTargetSha`; builder review remains `0/2`. |
| Expected reviewed head | Not run: immutable external `ExpectedHead` was not supplied; no value was inferred from `HEAD` | The command fails closed before scope success without the coordinator inputs. |
| Full base-to-head scope comparison | Not run: the final commit SHA and immutable coordinator target are not available until commit and receipt handoff | The authoritative command performs unfiltered exact-set equality before any filtered check. |
| Filtered base-to-head `git diff --check` and status | Passed locally for the final commit: no whitespace errors; all three allowed paths reported `M` exactly | This local check is not a substitute for coordinator receipt/target verification. |
| Targeted active-spec linter/self-check | Environment limitation: local `ajv` missing; no install | These tools do not lint the three goal documents. |
| Field-by-field ninth-review closure check | Passed local deterministic content assertions; not independent approval | Reconciled complete-fixture nested bindings, non-complete custody equality, budget acknowledgement freshness, captured-at retention anchors, partitioned reason codes, corrected field-set wording, and prior controls. |
| Independent frontier review A | Observed result: no fresh report supplied or performed in this builder session (`0/2`) | Coordinator must supply and triage; no pass inferred. |
| Independent frontier review B | Observed result: no fresh report supplied or performed in this builder session (`0/2`) | Coordinator must supply and triage; no pass inferred. |
| Gate 3 / merge | Not granted; human-owned | No self-approval or merge. |

## Completion boundary

This ninth-review rework is document-complete when all current findings are
explicit and testable in the three allowed documents, local deterministic
content and whitespace checks pass, and environment limitations are accurately
recorded. The authoritative base-to-head scope proof remains pending the final
commit and coordinator receipt/target inputs. It is not Gate 3-ready until two
independent fresh frontier reviews are supplied and coordinator-triaged.
