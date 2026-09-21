# JEV-P0 — Bounded Gate 2 builder round 13 verification record

## Scope

This record verifies the bounded JEV-P0 builder round 13 only.
It does not authorize JEV-P1 or later, provider calls, runtime use, spend,
credential access, dispatch, promotion, or Gate 3. The only mutation authority
is:

- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md`

Every other path and effect is forbidden. The current round is round 13 on
branch `codex/jev-p0-rework23`, starting from immediate prior candidate
`60f9d72c4191167082fd96db8bf3b6eacc6e5bac`. The cumulative parcel proof base
remains `eb88b65426c5e37893ac0591be83eef8c91da123`; intervening candidates in
that cumulative chain are `cf79819848c129581b13ff1289920f4cace2beca`,
`d439b4dfd9c0f9783f76a2dbb0c6a4a7bf4e5241`,
`dbc2db5f5dbae7b3df142a22230d69ed6584e5c6`,
`a83930eb174cc7afedcf3cd06c6d6bf63ab68b8a`,
`dc9d6a76772097be07832a2fe2b2653fb81fdf87`, and
`d18d08ba12e5b06d08a6c4ccf11875d0bc77cfda`; `60f9d72c` is the immediate prior
candidate for this round. `c71bdbfa0f9597eb44d0c3a01aa853f1f33989a8` is
historical proof evidence, not an intervening or immediate-prior candidate.
The full-scope proof compares one cumulative base-to-head range `eb88..HEAD`
so it covers the complete parcel change set; `eb88` is not the immediate prior
candidate, and `c71` is historical.

## Prior-closure preservation and twenty-first-review closure/current review checklist

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
5. Generic refusal/hold records carry no fixture provenance; complete
   `sanitized-replay-fixture` provenance rejects `none` and requires
   provider-declared response IDs.
6. The closed `budget_ack` object is mandatory for every live call and is bound
   by exact equality to lease_id, run, capability, decision schema, request
   digest, and the durable lease record; the top-level and nested
   `acknowledged_at_utc` values must be exactly equal and freshness uses that
   one value; one trusted coordinator UTC clock
   enforces the exact timestamp grammar and
   `run_started_at_utc <= acknowledged_at_utc <=
   transmission_started_at_utc <= socket_opened_at_utc`, the 60-second
   age/expiry, future/backward/missing-clock rejection, lease recheck,
   consume-before-socket, and no reuse.
   The internal lease record is closed and strict: generated `run_id` and
   `lease_id` grammars, 64-lowercase-hexadecimal `request_digest`, exact
   capability/schema literals, exact state set, UTC transition grammars, and
   `claimed_at_utc == live_observation.run_started_at_utc` plus
   `consumed_at_utc == live_observation.transmission_started_at_utc`; terminal
   transition time may remain internal-only.
7. Replay custody requires an independent coordinator manifest receipt/resolution;
   wrapper self-equality and format-only IDs never establish trust.
8. The finite custody allowlist includes the approved JEV-P1 fixture paths and
   planned P1 ref; the closed reason-code/status partition maps R12 to missing
   metadata only, R10 to malformed/unparseable present response fields while
   explicitly excluding missing provider metadata, R09 to validly shaped
   conflicts only, and the ordered R14/R15/R16 pre-call family deterministically
   (including CAS loss to an existing in-flight owner as R16, never R15);
   missing cost/currency remains hold-only and malformed or unauthorized cost
   remains refusal-only. Live-observation and sanitized-replay-fixture are
   complete-only; claim/consume artifacts are internal durable lease-record
   transitions and never external evidence records; generic refusal/hold uses
    no fixture provenance, R21 uses only generic `evidence:R21`, and R20 emits
    only `evidence:R20`. Custody validation is explicitly first-failure
    ordered: first structurally scan the recognized closed evidence-wrapper and
    retained-record schemas defined in this parcel. An unknown/extra field,
    raw authorization header, unsafe payload, or structural retention/schema
    violation is R23 and stops validation. Logs and review reports are not
    evidence surfaces, are outside R23's evidence-wrapper classification, and
    must never contain credentials, raw authorization headers, unsafe payloads,
    or rejected sensitive input. Only when that scan passes, validate
    recognized field values; a finite vocabulary, repository/ref/path allowlist,
    generated-ID grammar, numeric bound, or minimization/redaction uncertainty
    is R22. The first failing stage owns the result, so a combined structural-
    and-value violation is R23, never R22; no unbounded log/report object is
    classified. After R23 then R22 pass, missing, unverified, or non-resolving
    coordinator custody after repository/ref/path allowlist success and before
    a resolved immutable custody tuple exists is R19 hold; invalid ref/path is
    R22; canonical provenance JCS/digest/procedure failure is R18 refusal, and
    present, validly shaped request/response JCS canonical-byte or paired
    digest inputs whose canonicalization, computation, or reproducibility
    fails are R17. The structural stage owns absent fields as R23; the
    recognized-value stage owns out-of-grammar values as R22.
    After R17, custody-resolved committed bytes/tree or manifest-entry custody
    mismatch is exclusively R20. After R20, any unequal valid field in the
    closed post-custody semantic equality set is R21. The ordered predicates
    are mutually exclusive: R23, then R22, then R19, R18, R17, R20, and R21;
    R20 excludes R17, and R21 excludes R17 and R20. R18 never owns generic
    out-of-schema fields.
9. Retention uses a trusted coordinator capture/recording clock, rejects future
   anchors, and preserves `anchor <= retention <= anchor+90 days`.
10. Scope proof first enumerates the complete unfiltered cumulative base-to-head
    diff over one cumulative base-to-head range from the exact base to the
    coordinator-supplied
    expected reviewed head and asserts exact set equality, exact `M` statuses,
    and native exit codes before reporting success. It does not verify document
    semantics.
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

The following is exact coordinator evidence for a historical candidate from
round 5. It is neither the immediate prior candidate for current round 13 nor
current-round-head proof, builder approval, or Gate 3 authorization. The
external proof targeted candidate
`c71bdbfa0f9597eb44d0c3a01aa853f1f33989a8` using receipt path
`D:\Repos\jev-p0-triage-receipt-round5.txt`.

| Prior-candidate coordinator proof item | Recorded result |
|---|---|
| Receipt path | `D:\Repos\jev-p0-triage-receipt-round5.txt` |
| Base | `2fe8b456b397e2f8f0731f51788a0c5b7b795b4a` |
| Repository root | `C:\Repos\foreman-line-jev-p0-rework5` |
| Coordinator target SHA | `c71bdbfa0f9597eb44d0c3a01aa853f1f33989a8` |
| Observed HEAD | `c71bdbfa0f9597eb44d0c3a01aa853f1f33989a8` (`c71bdbf`) — target/head assertion passed for the prior candidate |
| Receipt-open | Passed; strict UTF-8, exact closed receipt, and native file-read checks passed |
| Receipt-target-match | Passed; receipt target, coordinator target, and observed prior HEAD matched exactly |
| Unfiltered base-to-head scope | Passed; the unfiltered prior-candidate range contained exactly the three allowed documents |
| Allowed paths | Exact three allowed documents only |
| Whitespace | Passed; filtered prior-candidate `git diff --check` passed |
| Native exit checks | Passed; native command exits were checked immediately |
| Filtered status | Passed; all three allowed paths were exactly `M` |
| Independent review count | `0/2` at the time of this prior-candidate coordinator proof; no review approval inferred |

This historical-candidate record does not assert the current round 13 final HEAD,
current base-to-head scope, whitespace, or status results. Those remain
pending until the coordinator runs the proof below with the current immutable
expected head. It does not authorize a provider call, merge, or Gate 3.

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

Run after the resulting round-13 builder commit exists:

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

$base = 'eb88b65426c5e37893ac0591be83eef8c91da123'
$allowed = @(
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md'
)
function New-OrdinalStringSet {
  param([AllowNull()][object[]]$Values)
  $set = [System.Collections.Generic.HashSet[string]]::new(
    [System.StringComparer]::Ordinal
  )
  foreach ($value in $Values) {
    if ($null -ne $value) { [void]$set.Add([string]$value) }
  }
  return ,$set
}
function Test-OrdinalStringSetEqual {
  param(
    [Parameter(Mandatory = $true)]
    [System.Collections.Generic.HashSet[string]]$Expected,
    [Parameter(Mandatory = $true)]
    [System.Collections.Generic.HashSet[string]]$Actual
  )
  if ($Expected.Count -ne $Actual.Count) { return $false }
  foreach ($value in $Expected) {
    if (-not $Actual.Contains($value)) { return $false }
  }
  return $true
}
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
# Prove the cumulative base is an ancestor before comparing path scope.
git -C $resolvedRepositoryRoot merge-base --is-ancestor $base $head
$ancestryExitCode = $LASTEXITCODE
if ($ancestryExitCode -ne 0) { throw 'cumulative base is not an ancestor of reviewed head' }
Write-Output 'cumulative_base_ancestry=passed'
# First enumerate without any path filter; no forbidden path can be hidden.
$allChanged = @(git -C $resolvedRepositoryRoot diff --name-only "$base..$head")
if ($LASTEXITCODE -ne 0) { throw 'git diff --name-only failed' }
Write-Output 'full_base_to_head_changed_paths:'
$allChanged
# HashSet membership uses StringComparer.Ordinal; no PowerShell culture or
# case-insensitive comparison defaults can alter the exact path-set result.
$expectedSet = New-OrdinalStringSet $allowed
$actualSet = New-OrdinalStringSet $allChanged
if ($allChanged.Count -ne $allowed.Count -or
    -not (Test-OrdinalStringSetEqual -Expected $expectedSet -Actual $actualSet)) {
  throw 'full base-to-head path set is not exactly the Allowed Files set'
}
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
$expectedStatusSet = New-OrdinalStringSet $expectedStatus
$actualStatusSet = New-OrdinalStringSet $nameStatus
if ($nameStatus.Count -ne $expectedStatus.Count -or
    -not (Test-OrdinalStringSetEqual -Expected $expectedStatusSet -Actual $actualStatusSet)) {
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

This is the authoritative scope proof. It proves ancestry and then compares the
complete unfiltered path set over one cumulative `$base..$head` range from the
cumulative parcel proof base to the coordinator-supplied
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

## Manual semantic consistency review requirements

The following are manual review requirements for the coordinator or independent
reviewers. The dependency-free scope script verifies receipt, head, cumulative
base-to-head path scope, whitespace, and `M` status only; it does not verify
these semantic assertions.

The three documents must contain the same closed response-metadata partition.
After transport and request-identity checks, the exact UTC grammar for
`server_timestamp_utc` is
`^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$`; `model` and
`response_id` use their declared exact field grammars and all present values
must be validly shaped before conflict comparison:

| Evaluation order | Reason | Disjoint predicate | Outcome |
|---|---|---|---|
| 1 | R12 | One or more provider-declared complete metadata fields (`model`, `response_id`, or `server_timestamp_utc`) is missing. Missing `server_timestamp_utc` belongs here. | `hold` |
| 2 | R10 | All required metadata fields are present, but any present response field is malformed or unparseable under its exact grammar, including malformed `model`, malformed `response_id`, or unparseable `server_timestamp_utc`; missing provider metadata is explicitly excluded and belongs only to R12. This row has precedence over R09. | `refused` |
| 3 | R09 | All required metadata fields are present and individually valid under their exact field grammars, but authenticated response `model` conflicts with `served_identity.model`, or the provider response identifier conflicts with `served_identity.response_id` or `response_id`. | `refused` |

The three documents must also contain the same canonical observable, disjoint
pre-call lease-state table. `available` means no durable record; `claimed` is
only the event creating `in-flight`; atomic consume-before-socket is
`in-flight -> consumed`; completion or terminal refusal/hold is
`consumed -> terminal`; no transition reopens or recreates a run. Evaluate
exactly R16, then R15, then R14; no caller selects a status:

| Evaluation order | Reason | Disjoint observable predicate | Outcome |
|---|---|---|---|
| 1 | R16 | An explicit retry, second, or concurrent invocation is observed; an existing same-run durable lease record is in `in-flight`, `consumed`, or `terminal`; a supplied token is duplicated, unrecognized, or wrongly bound; or CAS/create-if-absent loses to an existing `in-flight` owner. Every R16 state or token is excluded from R15. | `refused` |
| 2 | R15 | This is a first invocation with no R16 predicate, no existing same-run `in-flight`, `consumed`, or `terminal` record, and no successful fresh record because `run_id` is missing or the lease service is unavailable or unobservable. | `hold` |
| 3 | R14 | After a fresh `in-flight` record is successfully created and correctly bound, `budget_ack` is missing, malformed, stale, reused, mutable, custody-unverified, future, backward-clock, expired, over-cap, non-USD, or otherwise invalid. | `hold` |

The three documents must also contain the same ordered custody and post-custody
validation precedence before the refusal matrix. First structurally scan the
recognized closed evidence-wrapper and retained-record schemas defined in this
parcel: an unknown/extra field, raw authorization header, unsafe payload, or
structural retention/schema violation is R23 and stops validation. Only when
that scan passes, validate recognized field values: a finite vocabulary,
repository/ref/path allowlist, generated-ID grammar, numeric bound, or
minimization/redaction uncertainty is R22. The first failing stage owns the
result, so a combined structural-and-value violation is R23, never R22. No
unbounded log/report object is classified. Logs and review reports are not
evidence surfaces, are outside R23's evidence-wrapper classification, and
must never contain credentials, raw authorization headers, unsafe payloads,
or rejected sensitive input. Only after R23 then R22 pass, resolve immutable
custody; missing, unverified, or non-resolving coordinator custody after
structural and recognized-value validation plus repository/ref/path allowlist
success, before a resolved immutable custody tuple exists, is R19 hold;
invalid ref/path is R22; once that tuple resolves, no custody mismatch is R19
and any such mismatch is R20.
After custody and defined schema pass, canonical provenance JCS/digest/procedure
failures are R18; after R18, present, validly shaped request/response JCS
canonical-byte or paired digest inputs whose canonicalization, computation,
or reproducibility fails are R17; the structural stage owns absent fields as
R23 and the recognized-value stage owns out-of-grammar values as R22; after
R17,
custody-resolved committed fixture bytes/tree or manifest-entry custody
mismatches are exclusively R20. After R20, evaluate R21 for a present, validly
shaped, non-empty, non-sentinel value that is unequal in the finite path set
below. The set is exactly these paths:
`fixture.evidence_class`, `fixture.fixture_id`, `fixture.manifest_id`,
`fixture.schema_version`, `fixture.requested_identity`,
`fixture.requested_identity.provider`, `fixture.requested_identity.model`,
`fixture.requested_identity.surface`, `fixture.served_identity`,
`fixture.served_identity.model`, `fixture.served_identity.response_id`,
`fixture.served_identity.source`,
`fixture.response_id`, `fixture.server_timestamp_utc`, `fixture.request`,
`fixture.request.schema_version`, `fixture.request.capability`,
`fixture.request.requested_identity`,
`fixture.request.requested_identity.provider`,
`fixture.request.requested_identity.model`,
`fixture.request.requested_identity.surface`, `fixture.request.state`,
`fixture.request.state.schema_version`, `fixture.request.state.values`,
`fixture.request.state.values.case_type`,
`fixture.request.state.values.urgency_signal`,
`fixture.request.state.values.frustration_signal`,
`fixture.request.state.values.contact_channel`,
`fixture.request.questions`, `fixture.request.questions[0]`,
`fixture.request.questions[0].name`, `fixture.request.questions[0].type`,
`fixture.request.questions[0].instructions`,
`fixture.request.questions[0].instructions[0]`,
`fixture.request.questions[0].criteria`,
`fixture.request.questions[0].criteria[0]`,
`fixture.request.questions[0].criteria[0].key`,
`fixture.request.questions[0].criteria[0].description`,
`fixture.request.questions[1]`, `fixture.request.questions[1].name`,
`fixture.request.questions[1].type`,
`fixture.request.questions[1].instructions`,
`fixture.request.questions[1].instructions[0]`,
`fixture.request.questions[1].criteria`,
`fixture.request.questions[1].criteria[0]`,
`fixture.request.questions[1].criteria[0].key`,
`fixture.request.questions[1].criteria[0].description`,
`fixture.request.questions[1].choices`,
`fixture.request.questions[1].choices[0]`,
`fixture.request.questions[1].choices[1]`,
`fixture.request.questions[1].choices[2]`,
`fixture.request.questions[2]`, `fixture.request.questions[2].name`,
`fixture.request.questions[2].type`,
`fixture.request.questions[2].instructions`,
`fixture.request.questions[2].instructions[0]`,
`fixture.request.questions[2].criteria`,
`fixture.request.questions[2].criteria[0]`,
`fixture.request.questions[2].criteria[0].key`,
`fixture.request.questions[2].criteria[0].description`,
`fixture.request.questions[2].score_label`,
`fixture.request_digest`, `fixture.response`,
`fixture.response.schema_version`, `fixture.response.capability`,
`fixture.response.requested_identity`,
`fixture.response.requested_identity.provider`,
`fixture.response.requested_identity.model`,
`fixture.response.requested_identity.surface`,
`fixture.response.served_identity`,
`fixture.response.served_identity.model`,
`fixture.response.served_identity.response_id`,
`fixture.response.served_identity.source`,
`fixture.response.response_id`, `fixture.response.server_timestamp_utc`,
`fixture.response.answers`, `fixture.response.answers[0]`,
`fixture.response.answers[0].name`, `fixture.response.answers[0].type`,
`fixture.response.answers[0].criteria`,
`fixture.response.answers[0].criteria[0]`,
`fixture.response.answers[0].criteria[0].key`,
`fixture.response.answers[0].criteria[0].description`,
`fixture.response.answers[0].value`,
`fixture.response.answers[0].confidence`,
`fixture.response.answers[1]`, `fixture.response.answers[1].name`,
`fixture.response.answers[1].type`, `fixture.response.answers[1].criteria`,
`fixture.response.answers[1].criteria[0]`,
`fixture.response.answers[1].criteria[0].key`,
`fixture.response.answers[1].criteria[0].description`,
`fixture.response.answers[1].value`,
`fixture.response.answers[1].confidence`,
`fixture.response.answers[1].distribution`,
`fixture.response.answers[1].distribution.billing`,
`fixture.response.answers[1].distribution.technical`,
`fixture.response.answers[1].distribution.sales`,
`fixture.response.answers[2]`, `fixture.response.answers[2].name`,
`fixture.response.answers[2].type`, `fixture.response.answers[2].criteria`,
`fixture.response.answers[2].criteria[0]`,
`fixture.response.answers[2].criteria[0].key`,
`fixture.response.answers[2].criteria[0].description`,
`fixture.response.answers[2].value`,
`fixture.response.answers[2].confidence`,
`fixture.response_digest`, `fixture.provenance.fixture_id`,
`fixture.provenance.manifest_id`, `fixture.provenance.source_kind`,
`fixture.provenance.source_ref`, `fixture.provenance.captured_at_utc`,
`fixture.provenance.authenticated_response_id`,
`fixture.provenance_digest`, `fixture.source_kind`, `fixture.source_ref`,
`fixture.status`, `fixture.reason_code`, `fixture.retention_until_utc`,
`fixture.manifest_entry.schema_version`,
`fixture.manifest_entry.manifest_id`,
`fixture.manifest_entry.fixture_id`,
`fixture.manifest_entry.request_digest`,
`fixture.manifest_entry.response_digest`, and
`fixture.manifest_entry.provenance_digest`.

The exact equality paths are:
`fixture.schema_version == fixture.request.schema_version ==
fixture.response.schema_version == fixture.manifest_entry.schema_version`;
`fixture.manifest_id == fixture.provenance.manifest_id ==
fixture.manifest_entry.manifest_id`;
`fixture.fixture_id == fixture.provenance.fixture_id ==
fixture.manifest_entry.fixture_id`;
`fixture.requested_identity == fixture.request.requested_identity ==
fixture.response.requested_identity`;
`fixture.served_identity == fixture.response.served_identity`;
`fixture.served_identity.model == fixture.response.served_identity.model`;
`fixture.served_identity.response_id ==
fixture.response.served_identity.response_id`;
`fixture.served_identity.source == fixture.response.served_identity.source`;
`fixture.response_id == fixture.response.response_id ==
fixture.served_identity.response_id ==
fixture.response.served_identity.response_id ==
fixture.provenance.authenticated_response_id`;
`fixture.server_timestamp_utc == fixture.response.server_timestamp_utc`;
`fixture.source_kind == fixture.provenance.source_kind`;
`fixture.source_ref == fixture.provenance.source_ref`;
`fixture.response.answers[0].name == fixture.request.questions[0].name`;
`fixture.response.answers[0].type == fixture.request.questions[0].type`;
`fixture.response.answers[0].criteria ==
fixture.request.questions[0].criteria`;
`fixture.response.answers[1].name == fixture.request.questions[1].name`;
`fixture.response.answers[1].type == fixture.request.questions[1].type`;
`fixture.response.answers[1].criteria ==
fixture.request.questions[1].criteria`;
`fixture.response.answers[2].name == fixture.request.questions[2].name`;
`fixture.response.answers[2].type == fixture.request.questions[2].type`;
`fixture.response.answers[2].criteria ==
fixture.request.questions[2].criteria`;
`fixture.request_digest == SHA256(JCS-UTF8(fixture.request)) ==
fixture.manifest_entry.request_digest`;
`fixture.response_digest == SHA256(JCS-UTF8(fixture.response)) ==
fixture.manifest_entry.response_digest`; and
`fixture.provenance_digest == SHA256(JCS-UTF8(fixture.provenance)) ==
fixture.manifest_entry.provenance_digest`.

`fixture.request` and `fixture.response` are compared as the exact closed
request and response envelope objects defined by the contract, with the nested
paths listed above compared at their exact values. The singleton paths
`fixture.evidence_class`, `fixture.status`, and `fixture.reason_code` are
compared to their exact closed-schema literals. The path
`fixture.provenance.captured_at_utc` is compared byte-for-byte with the
coordinator-approved canonical provenance capture timestamp for this fixture
and is the retention anchor:
`fixture.provenance.captured_at_utc <= fixture.retention_until_utc <=
fixture.provenance.captured_at_utc + 90 days`. The path
`fixture.retention_until_utc` is compared using that exact invariant. All
listed identity, timestamp, digest, ID, source, object, string, number, and
array comparisons are exact and case-sensitive. Repository/ref/path/commit/
tree and `fixture.manifest_entry.repository/ref/path/commit/tree` are
custody-tuple paths owned only by R20; request/response digest computation
failures belong only to R17; provenance digest procedure failures belong only
to R18. A missing, one-sided, empty, sentinel, or invalid listed value is R23
or R22, never R21.

The predicates are ordered and mutually exclusive:
`R23 -> R22 -> R19 -> R18 -> R17 -> R20 -> R21`. No digest-procedure failure
may be reclassified as `R20`, no resolved custody mismatch may be reclassified
as `R19`, and no `R21` semantic equality failure may absorb an `R17` or `R20`
failure.

Every repeated timestamp section is also a manual consistency requirement and
must use the one exact grammar
`^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$` for
`server_timestamp_utc` and all operational fields, and the exact ordering
`run_started_at_utc <= acknowledged_at_utc <= transmission_started_at_utc <=
socket_opened_at_utc`; the top-level live-observation
`acknowledged_at_utc` must equal nested `budget_ack.acknowledged_at_utc`
exactly, and freshness uses that one value. Claim/consume artifacts are
internal durable lease-record transitions with a closed field list, not
external evidence records; the closed lease record binds
`claimed_at_utc == live_observation.run_started_at_utc` and
`consumed_at_utc == live_observation.transmission_started_at_utc`, while
`terminal_at_utc` may remain internal-only. Generic refusal/hold records carry
no fixture provenance, R21 is generic `evidence:R21`, and R20 is exclusively
generic `evidence:R20`; the post-custody order is R18, then R17, then R20,
then R21, in addition to the existing freshness and expiry rules.

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
- coordinator-issued run/lease, exact generated ID and digest grammars,
  CAS/create-if-absent claim, immutable binding, final exact `lease_id`
  recheck, provider/account budget acknowledgement, and append-only terminal
  state;
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
| Starting branch/base | `codex/jev-p0-rework23`, immediate prior candidate `60f9d72c4191167082fd96db8bf3b6eacc6e5bac`; cumulative proof base `eb88b65426c5e37893ac0591be83eef8c91da123`; intervening candidates are `cf798`, `d439`, `dbc2`, `a839`, `dc9d`, and `d18d`; `60f9d72c` is the immediate prior candidate for round 13; `c71` is historical | Confirmed before current builder round 13 edits. The proof intentionally compares one cumulative base-to-head range `eb88..HEAD`; it is not a direct-parent proof. |
| `node -v` | Passed: `v24.7.0`, native exit code `0`; below shaping requirement `>=24.11.1` | Immediate exit-code capture/check followed `node -v`. |
| `RepositoryRoot` input | Mandatory and documented; the prior-candidate proof used `C:\Repos\foreman-line-jev-p0-rework5` | The proof resolves a literal existing Git root and uses `git -C` for every relative Git operation; unsafe/missing/non-repository roots reject. |
| Prior-candidate coordinator proof | Passed externally for candidate `c71bdbfa0f9597eb44d0c3a01aa853f1f33989a8` | Exact receipt/path, target/head, base, repository root, three-file scope, whitespace, native exits, and `M` status results are recorded above; this is prior-candidate coordinator evidence, not current-head proof, builder approval, or Gate 3 authorization. |
| `CoordinatorTriageReceiptPath` input | Pending: coordinator-supplied receipt path remains unverified until the coordinator executes the proof; no path was fabricated or inferred | A coordinator-controlled receipt is required. |
| `CoordinatorTargetSha` input | Pending: coordinator-supplied target remains unverified until the coordinator executes the proof | The target must come from coordinator input and the exact receipt declaration; it is never derived from `HEAD`. |
| `ExpectedHead` input | Pending: coordinator-supplied expected head remains unverified until the coordinator executes the proof | `ExpectedHead` must be supplied independently and must equal `CoordinatorTargetSha`. |
| Receipt-open result | Pending until the coordinator executes the proof; no pass claimed | Strict UTF-8, no BOM, exact two-line closed format with an optional final LF, and native file-read evidence are required. |
| Receipt target-match result | Pending until the coordinator executes the proof; no pass claimed | Receipt `target_sha`, `CoordinatorTargetSha`, and `ExpectedHead` must match exactly. |
| Observed repository head | Not used as a target; no authoritative comparison executed | `git rev-parse --verify HEAD` may only be observed and compared after the coordinator inputs pass. |
| Cumulative base ancestry | Pending until the coordinator executes the proof; no pass claimed | Before path scope comparison, `git -C $resolvedRepositoryRoot merge-base --is-ancestor $base $head` must exit `0`; a nonzero exit fails the proof, and the procedure outputs `cumulative_base_ancestry=passed` only on success. |
| Full base-to-head scope comparison | Pending until the coordinator executes the proof after receipt-open, target-match, and `ExpectedHead`; no pass claimed | The script first enumerates the unfiltered base-to-head path set, then checks exact set equality. |
| Filtered base-to-head `git diff --check` and status | Pending until the coordinator executes the proof; no pass claimed | These checks run only after the unfiltered three-file set and reviewed head are proven. |
| Targeted active-spec linter/self-check | Environment limitation: local `ajv` missing; no install | These tools do not lint the three goal documents. |
| Manual semantic consistency review | Required; not claimed by the scope script and not independent approval | Review all three documents for canonical lease vocabulary/state transitions, exact lease/budget/live-record equalities, narrow status/reason suffixes, complete-only observations, one timestamp grammar/order, R09/R10/R12/R13, first-failure R23/R22 structural/value stages, R19/R20 custody partition, and the full ordered R17/R20/R21 semantic rules. |
| Field-by-field twenty-first-review closure/current review | Blocked for coordinator traceability; read-only content review is not independent approval | Checked the requested twenty-first-review control text locally; current-round coordinator proof and two independent reviews remain external. |
| Independent frontier review A | Observed result: no fresh report supplied or performed in this builder session (`0/2`) | Coordinator must supply and triage; no pass inferred. |
| Independent frontier review B | Observed result: no fresh report supplied or performed in this builder session (`0/2`) | Coordinator must supply and triage; no pass inferred. |
| Gate 3 / merge | Not granted; human-owned | No self-approval or merge. |

## Completion boundary

This bounded Gate 2 builder round is document-complete when all current findings are explicit
and testable in the three allowed documents, local deterministic checks and
environment limitations are accurately recorded, and the coordinator later
executes the receipt-open, target-match, and full base-to-head scope proof.
It is not Gate 3-ready until that evidence and two independent fresh frontier
reviews are supplied and coordinator-triaged.
