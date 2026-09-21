# JEV-P0 — Fresh rework builder round 3 verification record

## Scope

This record verifies the fresh JEV-P0 rework builder round 3 only.
It does not authorize JEV-P1 or later, provider calls, runtime use, spend,
credential access, dispatch, promotion, or Gate 3. The only mutation authority
is:

- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md`

Every other path and effect is forbidden. The exact starting base for this
builder round is `9380955cc6b16c4a4a9533113e02eb16429d4989`.

## Prior-closure preservation and eleventh-review closure checklist

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
4. Complete fixtures require exact schema-version equality across wrapper,
   request, response, and manifest entry, plus nested identity, response,
   timestamp, digest, ID, and custody equalities.
5. Non-complete provenance uses only JSON string `"none"`; complete provenance
   rejects `none` and requires provider-declared response IDs.
6. The closed `budget_ack` object is mandatory for every live call and is bound
   to run/capability/request digest and custody; one trusted coordinator UTC
   clock enforces run-start ordering, the 60-second age/expiry, future/backward/
   missing-clock rejection, lease recheck, consume-before-socket, and no reuse.
7. Replay custody requires an independent coordinator manifest receipt/resolution;
   wrapper self-equality and format-only IDs never establish trust.
8. The finite custody allowlist includes the approved JEV-P1 fixture paths and
   planned P1 ref; the closed reason-code/status partition maps R12 and R15
   deterministically (and keeps missing cost/currency hold-only and malformed
   or unauthorized cost refusal-only); invalid custody uses generic R18/R19
   records with evidence-class prefixes.
9. Retention uses a trusted coordinator capture/recording clock, rejects future
   anchors, and preserves `anchor <= retention <= anchor+90 days`.
10. Scope proof first enumerates the complete unfiltered two-commit diff from
    the exact base to the coordinator-supplied expected reviewed head and
    asserts exact set equality, exact `M` statuses, and native exit codes before
    reporting success.
11. Complete replay equalities include wrapper/request/response requested
    identity and wrapper/provenance source kind/source ref, with explicit
    mismatch refusal.
12. The immutable execution record identifies the coordinator review target by
    a strictly parsed coordinator receipt, externally supplied target SHA, and
    externally supplied expected head; the builder never derives the target
    from `HEAD` or treats builder review as approval.

## External coordinator traceability and receipt proof

The execution record's review target is supplied by the coordinator through
three immutable inputs: `CoordinatorTriageReceiptPath`, `CoordinatorTargetSha`,
and `ExpectedHead`. The receipt path identifies the coordinator-owned triage
receipt; `CoordinatorTargetSha` is the exact SHA supplied by that coordinator
and named by the receipt; and `ExpectedHead` is the exact reviewed head to
compare with an observed `git rev-parse --verify HEAD`. All three are external
inputs. The command rejects missing or malformed values, opens and validates
the receipt before any target comparison, requires the receipt declaration,
`CoordinatorTargetSha`, and `ExpectedHead` to be identical, and never assigns
any target value from `HEAD`.

The receipt file is strict UTF-8 with no BOM and must contain exactly these two
ASCII lines, with one LF separator, optionally followed by exactly one final
LF, and no other bytes:

```text
receipt_schema_version=jev-p0-triage-receipt/v1
target_sha=<exactly 40 lowercase hexadecimal characters>
```

The parser uses the complete-file expression
`\Areceipt_schema_version=jev-p0-triage-receipt/v1\ntarget_sha=([0-9a-f]{40})(?:\n)?\z`.
Therefore there is exactly one target declaration, no duplicate declaration,
no CR, no missing separator, no newline-spanning field, and no ambiguous extra
target content. Any missing/unreadable receipt, invalid UTF-8, BOM, CR, extra
byte, duplicate declaration, or malformed line is a receipt-open refusal and
the target and scope results remain blocked. Coordinator review evidence is
external to this builder session; builder review counts remain `0/2`, and no
builder result is self-approval or Gate 3 authorization.

## Prior-candidate coordinator proof evidence

The following is exact prior-candidate evidence supplied by the coordinator;
it is not proof of this round's final HEAD and is not builder approval. The
external proof targeted prior candidate
`9380955cc6b16c4a4a9533113e02eb16429d4989` using receipt path
`D:\Repos\jev-p0-triage-receipt-round3.txt`.

| Prior-candidate proof item | Recorded result |
|---|---|
| Receipt path | `D:\Repos\jev-p0-triage-receipt-round3.txt` |
| Base | `369207585812dcdfcd237d5241b83c61accbad5b` |
| Coordinator target SHA | `9380955cc6b16c4a4a9533113e02eb16429d4989` |
| Observed HEAD | `9380955cc6b16c4a4a9533113e02eb16429d4989` — assertion passed for the prior candidate |
| Receipt open / target match | `passed` / `passed` |
| Unfiltered scope | `passed`; exact changed-path set was the three allowed documents only |
| Whitespace | `passed`; filtered `git diff --check` passed |
| Filtered status | `passed`; each allowed path was exactly `M` |
| Native command exits | `passed` for the receipt, HEAD, unfiltered scope, whitespace, and status checks |

This prior-candidate record does not assert the current round-3 final HEAD,
current base-to-head scope, whitespace, or status results. Those remain
pending until the coordinator runs the proof below with the current immutable
expected head.

## Dependency-free verification commands

Run in PowerShell with an explicit repository root. No dependency installation
is part of this parcel. The coordinator must supply the immutable expected
reviewed-head SHA captured before execution; the script must not derive it
from `HEAD`. The mandatory `RepositoryRoot` parameter is resolved as a literal
existing directory, must contain the requested repository, and is used for
every relative Git path. Missing, unsafe, non-directory, or non-repository
roots are rejected; no stale rework worktree path is embedded.

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
  [string]$RepositoryRoot,
  [Parameter(Mandatory = $true)]
  [string]$ExpectedHead,
  [Parameter(Mandatory = $true)]
  [string]$CoordinatorTriageReceiptPath,
  [Parameter(Mandatory = $true)]
  [string]$CoordinatorTargetSha
)

$base = '9380955cc6b16c4a4a9533113e02eb16429d4989'
$allowed = @(
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md'
)
if ([string]::IsNullOrWhiteSpace($RepositoryRoot) -or
    $RepositoryRoot -match '[\x00-\x1F\x7F]') {
  throw 'RepositoryRoot is missing or unsafe'
}
try {
  $resolvedRepositoryRoot = (Resolve-Path -LiteralPath $RepositoryRoot -ErrorAction Stop).Path
} catch {
  throw 'RepositoryRoot could not be resolved'
}
if (-not (Test-Path -LiteralPath $resolvedRepositoryRoot -PathType Container)) {
  throw 'RepositoryRoot is not an existing directory'
}
$gitRootOutput = @(git -C $resolvedRepositoryRoot rev-parse --show-toplevel)
$gitRootExitCode = $LASTEXITCODE
if ($gitRootExitCode -ne 0) { throw 'RepositoryRoot is not a Git repository' }
$gitRoot = ($gitRootOutput -join "`n").Trim()
if ([string]::IsNullOrWhiteSpace($gitRoot)) { throw 'RepositoryRoot Git root is empty' }
if ([System.IO.Path]::GetFullPath($gitRoot) -cne
    [System.IO.Path]::GetFullPath($resolvedRepositoryRoot)) {
  throw 'RepositoryRoot does not resolve to the Git worktree root'
}
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
# Open and parse the coordinator receipt before observing the repository head.
if (-not (Test-Path -LiteralPath $CoordinatorTriageReceiptPath -PathType Leaf)) {
  throw 'CoordinatorTriageReceiptPath could not be opened as a file'
}
try {
  $receiptBytes = [System.IO.File]::ReadAllBytes($CoordinatorTriageReceiptPath)
  $strictUtf8 = [System.Text.UTF8Encoding]::new($false, $true)
  $receiptText = $strictUtf8.GetString($receiptBytes)
} catch {
  throw 'coordinator receipt is not strict UTF-8 or could not be read'
}
if ($receiptBytes.Length -ge 3 -and
    $receiptBytes[0] -eq 0xEF -and $receiptBytes[1] -eq 0xBB -and
    $receiptBytes[2] -eq 0xBF) {
  throw 'coordinator receipt must not contain a UTF-8 BOM'
}
$receiptPattern = '\Areceipt_schema_version=jev-p0-triage-receipt/v1\ntarget_sha=([0-9a-f]{40})(?:\n)?\z'
$receiptMatch = [System.Text.RegularExpressions.Regex]::Match(
  $receiptText,
  $receiptPattern,
  [System.Text.RegularExpressions.RegexOptions]::CultureInvariant
)
if (-not $receiptMatch.Success) {
  throw 'coordinator receipt is not the exact closed two-line format'
}
$receiptTargetSha = $receiptMatch.Groups[1].Value
if ($receiptText -is [string] -and
    ([regex]::Matches($receiptText, 'target_sha=')).Count -ne 1) {
  throw 'coordinator receipt must contain exactly one target declaration'
}
if ($receiptTargetSha -cne $CoordinatorTargetSha) {
  throw 'receipt target_sha does not equal CoordinatorTargetSha'
}
if ($CoordinatorTargetSha -cne $ExpectedHead) {
  throw 'CoordinatorTargetSha does not equal immutable ExpectedHead'
}
$receiptOpenResult = 'passed'
$receiptTargetMatchResult = 'passed'
$head = (git -C $resolvedRepositoryRoot rev-parse --verify HEAD).Trim()
if ($LASTEXITCODE -ne 0) { throw 'git rev-parse HEAD failed' }
if ($head -cne $ExpectedHead) { throw "HEAD does not equal immutable ExpectedHead $ExpectedHead" }
# First enumerate without any path filter; no forbidden path can be hidden.
$allChanged = @(git -C $resolvedRepositoryRoot diff --name-only "$base..$head")
if ($LASTEXITCODE -ne 0) { throw 'git diff --name-only failed' }
Write-Output 'full_base_to_head_changed_paths:'
$allChanged
$expectedSet = @($allowed | Sort-Object -Unique)
$actualSet = @($allChanged | Sort-Object -Unique)
$setDelta = @(Compare-Object -ReferenceObject $expectedSet -DifferenceObject $actualSet)
if ($setDelta.Count -ne 0 -or $actualSet.Count -ne $expectedSet.Count) { throw 'full base-to-head path set is not exactly the Allowed Files set' }
# Only after exact full-set equality do filtered checks run.
git -C $resolvedRepositoryRoot diff --check "$base..$head" -- $allowed
if ($LASTEXITCODE -ne 0) { throw 'git diff --check failed' }
Write-Output 'filtered_whitespace=passed'
$nameStatus = @(git -C $resolvedRepositoryRoot diff --name-status "$base..$head" -- $allowed)
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
Write-Output "repository_root=$resolvedRepositoryRoot"
Write-Output "head=$head"
Write-Output "expected_reviewed_head=$ExpectedHead"
Write-Output "coordinator_target_sha=$CoordinatorTargetSha"
Write-Output "coordinator_triage_receipt_path=$CoordinatorTriageReceiptPath"
Write-Output "receipt_open=$receiptOpenResult"
Write-Output "receipt_target_match=$receiptTargetMatchResult"
Write-Output 'base_to_head_scope_checked_status_and_head_assertion=passed'
```

This is the authoritative scope proof. It compares the complete unfiltered
path set from the exact fresh-rework base to the coordinator-supplied
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
| Starting branch/base | `codex/jev-p0-rework13`, base `9380955cc6b16c4a4a9533113e02eb16429d4989` | Confirmed before fresh rework round 3 edits. |
| `node -v` | Passed: `v24.7.0`, native exit code `0`; below shaping requirement `>=24.11.1` | Immediate exit-code capture/check followed `node -v`. |
| `RepositoryRoot` input | Mandatory and documented; current worktree is `C:\Repos\foreman-line-jev-p0-rework4` | The proof resolves a literal existing Git root and uses `git -C` for every relative Git operation; unsafe/missing/non-repository roots reject. |
| Prior-candidate coordinator proof | Passed externally for candidate `9380955cc6b16c4a4a9533113e02eb16429d4989` | Exact receipt/path, target/head, three-file scope, whitespace, and `M` status results are recorded above; this is not current final-HEAD proof. |
| `CoordinatorTriageReceiptPath` input | Pending: coordinator-supplied receipt path remains unverified until the coordinator executes the proof; no path was fabricated or inferred | A coordinator-controlled receipt is required. |
| `CoordinatorTargetSha` input | Pending: coordinator-supplied target remains unverified until the coordinator executes the proof | The target must come from coordinator input and the exact receipt declaration; it is never derived from `HEAD`. |
| `ExpectedHead` input | Pending: coordinator-supplied expected head remains unverified until the coordinator executes the proof | `ExpectedHead` must be supplied independently and must equal `CoordinatorTargetSha`. |
| Receipt-open result | Pending until the coordinator executes the proof; no pass claimed | Strict UTF-8, no BOM, exact two-line closed format with an optional final LF, and native file-read evidence are required. |
| Receipt target-match result | Pending until the coordinator executes the proof; no pass claimed | Receipt `target_sha`, `CoordinatorTargetSha`, and `ExpectedHead` must match exactly. |
| Observed repository head | Not used as a target; no authoritative comparison executed | `git rev-parse --verify HEAD` may only be observed and compared after the coordinator inputs pass. |
| Full base-to-head scope comparison | Pending until the coordinator executes the proof after receipt-open, target-match, and `ExpectedHead`; no pass claimed | The script first enumerates the unfiltered base-to-head path set, then checks exact set equality. |
| Filtered base-to-head `git diff --check` and status | Pending until the coordinator executes the proof; no pass claimed | These checks run only after the unfiltered three-file set and reviewed head are proven. |
| Targeted active-spec linter/self-check | Environment limitation: local `ajv` missing; no install | These tools do not lint the three goal documents. |
| Field-by-field fresh-rework review | Blocked for coordinator traceability; read-only content review is not independent approval | Checked the requested round-3 control text locally; current coordinator proof and two independent reviews remain external. |
| Independent frontier review A | Observed result: no fresh report supplied or performed in this builder session (`0/2`) | Coordinator must supply and triage; no pass inferred. |
| Independent frontier review B | Observed result: no fresh report supplied or performed in this builder session (`0/2`) | Coordinator must supply and triage; no pass inferred. |
| Gate 3 / merge | Not granted; human-owned | No self-approval or merge. |

## Completion boundary

This fresh rework is document-complete when all current findings are explicit
and testable in the three allowed documents, local deterministic checks and
environment limitations are accurately recorded, and the coordinator later
executes the receipt-open, target-match, and full base-to-head scope proof.
It is not Gate 3-ready until that evidence and two independent fresh frontier
reviews are supplied and coordinator-triaged.
