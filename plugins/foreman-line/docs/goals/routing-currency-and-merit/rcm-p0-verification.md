# RCM-P0 verification — bounded delivery, acceptance held

## Narrow rework NR — byte diagnosis and chronology correction

This rework follows the coordinator's report of two fresh post-rework adversarial
reviews; the builder has not independently obtained those reports. Authorization
is the current four-file-only narrow-rework instruction, with no commit. F1-F6
remain blocked-secret-boundary; HAWF remains escalated-unresolved/downstream hold;
Jev remains refused/disabled-lane evidence only; the incomplete snapshot is
non-consumable. No positive host facts or live authority are created.

Fresh Step 0: assigned root and baseline
`1ec2b1012d5290851e924cc91137ec3f09122820`; exactly the four allowed untracked
evidence files, no tracked changes. No host/catalog/settings/auth/credential
access, network, installation, dispatch/evaluator access, commit or merge.
Initial inventory native exits were not captured individually (shell 0); NR00
freshly captured HEAD/tracked/untracked native exits, all 0, without reconstructing
the earlier exits. Instruction reads were the two worktree AGENTS files and the
local debugging-and-error-recovery skill. Preparation included a failed rg glob
(Windows path syntax; native exit unretained, containing shell 0) and corrected
read-only discovery. Truncated displays were followed by targeted/full reads.

NR00 directly inspected only the four fixed artifact paths; it did not establish
source-role gate coverage. NR01 and subsequent evidence suites use RW04's gated
artifact prefix. Initial Step 0/RW01 reads still predate the later RW04 gate
proof; that chronology gap remains open, with no fabricated retroactive coverage.

Diagnosis: NR00 returned byte BOM=false and ordinal BOM=false on all four files,
while the intentionally reproduced legacy culture-sensitive diagnostic returned
true. Prefixes were 232052 (Markdown) and 7B0A20 (JSON), not EFBBBF. All four
decoded as strict UTF-8, with LF and zero CRLF. NR01 adds BOM/no-BOM, empty and
embedded-BOM synthetic controls. C08/C09's recorded failures/exits are retained;
their attribution to actual BOM bytes is unsupported/misdiagnosed. Historical
C10/C13 encoding output is not independent byte proof. C06 and C13 gaps remain.

Only environment-map and verification are edited in this narrow rework.
Drift-report and catalog-snapshot bytes, acquisition times and SHA-256s are
unchanged. The debugging skill led to the predicate reproduction and synthetic
regression controls; it did not expand acquisition or authorization boundaries.

### Narrow rework ledger

| ID | Exact command / observed result |
|---|---|
| NR00 | Step 0/byte diagnostic below, 2026-09-20T16:06:46.0829964Z: shell 0; four scope checks; three native exits 0; four byte observations. Legacy predicate is diagnosis only. |
| NR01 | RW04 artifact prefix + byte suffix below, 2026-09-20T16:07:59.4246561Z: 28 completed checks (8 synthetic + 20 artifact), shell 0; no native commands. |
| NR02 | Exact RW04 command, unchanged, 2026-09-20T16:08:04.7621975Z: 185 completed checks, shell 0; seven native exits 0. Fresh pre-edit floor 185 >= 124 met. |
| NR-W01a | apply_patch rejected partial-line context before application; no writes, shell/native exits or checks. |
| NR-W01b | apply_patch succeeded: corrected encoding/history predicates and chronology in verification; chronology/reproduction guidance in environment-map. No shell/native exit. |
| NR01b | Exact NR01 repeat, 2026-09-20T16:09:57.6924564Z: 28 completed checks, shell 0; no native commands. Intermediate verification digest is not the final seal. |
| NR-W02a | apply_patch rejected malformed multiline hunk before application; no writes, shell/native exits or checks. |
| NR-W02b | apply_patch adds this narrow ledger, exact commands and current sealing targets to verification only. No shell/native exit. |
| NR03 | Exact RW04 post-edit rerun, 2026-09-20T16:11:36.7175351Z: 185 completed checks; shell 0; seven native exits 0; 12 permitted source digest/length/mtime matches. |
| NR04 | RW04 artifact prefix + refusal suffix below, 2026-09-20T16:11:38.7203871Z: seven completed integrity/refusal checks; shell 1 expected; no native commands. Positive consumption refused. |
| NR-W03 | apply_patch records the observed NR03/NR04 results and corrects an internal section direction in verification only; no shell/native exit. Final NR05 follows this edit. |
| NR05 | Current final seal below, run after the last ledger edit; actual count, exits and all four final SHA-256s emitted externally. No result or aggregate is assumed in advance. |

Historical completed counts remain 124 (C05/C10/C11/C12), 167 (RW02), and
192 (RW04/RW06). Prior RW07's conditional 201 is not promoted to a completed
total here. Narrow batches are separate; repeated invariants are counted per
execution, not as unique coverage. No production/lint/self-check or independent
review run is added by this rework.

### Current non-self-referential sealing targets

| Artifact | SHA-256 | UTF-8 bytes / BOM / LF |
|---|---|---|
| rcm-p0-drift-report.md | `56183f98db34615d211c8dfffb0f13478356b278f4dd31bee3cd0c096aa9527f` | 12112 / no / 138 |
| rcm-p0-catalog-snapshot.v1.json | `246a37dde67f3bd0663e40afeb739bdfbcab97ee7b669655acbe1d2e893b2917` | 29299 / no / 873 |
| rcm-p0-environment-map.md | `b736fb0765145044c008500451568bdce78a164db8a7c09865437b4f1f9905db` | 15612 / no / 213 |

All three have zero CRLF. The verification document also has UTF-8 without BOM
and LF; its final length/count/digest come from NR05 after the last edit. Its
pre-NR digest was `bd3fea00f9f78e39fb60b483ea0a5348a187ad2bfc6f38919a70e90c21fbce64`
(105986 bytes, 1577 LF). A final self-hash cannot be embedded in this document.
Historical digests below are retained historical values, not current targets.

### NR00 exact executed Step 0 diagnostic (retired diagnostic, not a sealing predicate)

```text
$ErrorActionPreference='Stop'
$root='C:\Repos\foreman-line-routing-currency-merit-rcm-p0-builder'
if ((Get-Location).Path -cne $root) { throw 'ROOT_BINDING_REFUSED' }
$g='plugins/foreman-line/docs/goals/routing-currency-and-merit'
$names=@('rcm-p0-drift-report.md','rcm-p0-catalog-snapshot.v1.json','rcm-p0-environment-map.md','rcm-p0-verification.md')
$head=git rev-parse HEAD
$headExit=$LASTEXITCODE
if ($headExit -ne 0 -or $head -cne '1ec2b1012d5290851e924cc91137ec3f09122820') { throw 'HEAD_REFUSED' }
$tracked=@(git diff --name-only HEAD --)
$trackedExit=$LASTEXITCODE
if ($trackedExit -ne 0 -or $tracked.Count -ne 0) { throw 'TRACKED_REFUSED' }
$untracked=@(git ls-files --others --exclude-standard)
$untrackedExit=$LASTEXITCODE
$allowed=@($names | ForEach-Object {"$g/$_"})
if ($untrackedExit -ne 0 -or $untracked.Count -ne 4 -or @($untracked | Where-Object {$_ -cnotin $allowed}).Count -ne 0) { throw 'SCOPE_REFUSED' }
$records=@()
foreach ($name in $names) {
  $bytes=[IO.File]::ReadAllBytes((Join-Path $root "$g/$name"))
  $raw=[Text.UTF8Encoding]::new($false,$true).GetString($bytes)
  $records += [ordered]@{name=$name;sha256=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant();bytes=$bytes.Length;prefix=[Convert]::ToHexString($bytes[0..2]);bom=($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191);ordinalBom=$raw.StartsWith([string][char]0xfeff,[StringComparison]::Ordinal);legacyCultureTest=$raw.StartsWith([string][char]0xfeff);crlf=[regex]::Matches($raw,"\r\n").Count;lf=[regex]::Matches($raw,"(?<!\r)\n").Count}
}
[ordered]@{observedAtUtc=(Get-Date -AsUTC -Format o);scopeChecks=4;head=$head;nativeExits=@{head=$headExit;tracked=$trackedExit;untracked=$untrackedExit};artifacts=$records;access='repository evidence only; no host/network/credential/install/dispatch access'} | ConvertTo-Json -Depth 5
```

### NR01 exact byte-control command construction

Use the exact RW04 prefix from `$ErrorActionPreference = 'Stop'` through the
artifactBindings loop, ending immediately before `$s = Get-Content -LiteralPath`,
then append this suffix. This runs no source reads or native executables.
NR01b is an exact repeat. Inputs are four fixed artifact bindings and synthetic
in-memory byte arrays. All current BOM decisions use byte prefixes or ordinal
comparison; the NR00 legacy expression is retained only as the executed diagnosis.

```powershell
function HasUtf8Bom([byte[]]$bytes) {
  return ($bytes.Length -ge 3 -and $bytes[0] -eq 0xef -and $bytes[1] -eq 0xbb -and $bytes[2] -eq 0xbf)
}
$utf8=[Text.UTF8Encoding]::new($false,$true)
$controls=@(
  @{name='bom';bytes=[byte[]]@(0xef,0xbb,0xbf,0x41,0x0a);expected=$true},
  @{name='no-bom';bytes=[byte[]]@(0x41,0x0a);expected=$false},
  @{name='empty';bytes=[byte[]]@();expected=$false},
  @{name='embedded-bom';bytes=[byte[]]@(0x41,0xef,0xbb,0xbf,0x0a);expected=$false}
)
foreach ($case in $controls) {
  Check ((HasUtf8Bom $case.bytes) -eq $case.expected) "synthetic-$($case.name)-byte-prefix"
  $text=$utf8.GetString($case.bytes)
  Check ($text.StartsWith([string][char]0xfeff,[StringComparison]::Ordinal) -eq $case.expected) "synthetic-$($case.name)-ordinal"
}
$records=@()
foreach ($name in $artifactNames) {
  $bytes=[IO.File]::ReadAllBytes($artifactPaths[$name])
  $raw=$utf8.GetString($bytes)
  Check ($raw.Length -gt 0) "$name-strict-utf8-nonempty"
  Check (-not (HasUtf8Bom $bytes)) "$name-no-byte-bom"
  Check (-not $raw.StartsWith([string][char]0xfeff,[StringComparison]::Ordinal)) "$name-no-ordinal-bom"
  Check (-not $raw.Contains([char]13) -and $raw.Contains([char]10)) "$name-lf-only"
  Check (@($raw -split '\n' | Where-Object {$_ -match '[ \t]+$'}).Count -eq 0) "$name-no-trailing-whitespace"
  $records += [ordered]@{name=$name;sha256=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant();bytes=$bytes.Length;prefix=[Convert]::ToHexString($bytes[0..2]);bom=(HasUtf8Bom $bytes);crlfCount=[regex]::Matches($raw,"\r\n").Count;bareLfCount=[regex]::Matches($raw,"(?<!\r)\n").Count}
}
[ordered]@{observedAtUtc=(Get-Date -AsUTC -Format o);completedChecks=$checks.Count;syntheticChecks=8;artifactChecks=20;nativeExits=@();artifacts=$records;checks=@($checks)} | ConvertTo-Json -Depth 5
```

### NR02 and NR03 exact source-verification command

Both execute the complete unchanged code block under heading RW04. NR02 was pre-edit;
NR03 is post-edit. Seven native exits are captured immediately: node -v;
git rev-parse HEAD; git branch --show-current; git diff --name-only HEAD --;
git ls-files --others --exclude-standard; git diff --check; and the exact
git show 96b6e39:.../loop-directive.md command retained in RW04.

### NR04 exact refusal command construction

Use the same RW04 artifact prefix as NR01, then this suffix. Exit 1 is an
intentional positive-consumption refusal only after all seven checks complete.

```powershell
$expected = @{
  'rcm-p0-drift-report.md'='56183f98db34615d211c8dfffb0f13478356b278f4dd31bee3cd0c096aa9527f'
  'rcm-p0-catalog-snapshot.v1.json'='246a37dde67f3bd0663e40afeb739bdfbcab97ee7b669655acbe1d2e893b2917'
  'rcm-p0-environment-map.md'='b736fb0765145044c008500451568bdce78a164db8a7c09865437b4f1f9905db'
}

foreach ($name in $expected.Keys) {
  Check ((Get-FileHash -LiteralPath $artifactPaths[$name] -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $expected[$name]) "$name-exact-expected-digest"
}
$raw = Get-Content -LiteralPath $artifactPaths['rcm-p0-verification.md'] -Raw
Check (@($raw -split '\r?\n' | Where-Object {$_ -match '[ \t]+$'}).Count -eq 0) 'verification-no-trailing-whitespace'
$bytes = [IO.File]::ReadAllBytes($artifactPaths['rcm-p0-catalog-snapshot.v1.json'])
$copy = [byte[]]$bytes.Clone()
$copy[0] = $copy[0] -bxor 1
$changedHash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($copy)).ToLowerInvariant()
Check ($changedHash -cne $expected['rcm-p0-catalog-snapshot.v1.json']) 'changed-byte-DIGEST_MISMATCH_REFUSED'
$s = Get-Content -LiteralPath $artifactPaths['rcm-p0-catalog-snapshot.v1.json'] -Raw | ConvertFrom-Json -DateKind String
Check ($null -eq $s.freshness.maxAgeSeconds -and $s.freshness.verdict -ceq 'refused') 'FRESHNESS_BOUND_UNRATIFIED_REFUSED'
Check ($s.complete -eq $false -and @($s.incompleteReasons).Count -gt 0) 'PARTIAL_REFUSED'
[ordered]@{verifiedAtUtc=(Get-Date -AsUTC -Format o);completedChecks=$checks.Count;checks=@($checks);nativeExits=@();evidenceConsumptionExit=1;meaning='seven checks completed; positive evidence consumption intentionally refused'} | ConvertTo-Json -Depth 4
exit 1
```

### NR05 current sealing procedure — exact command construction

After the final edit, concatenate the RW04 artifact prefix, the NR01 suffix
through the closing artifact loop (omit its final observedAtUtc output statement),
and this suffix. The seal independently repeats the 28 byte/format controls,
compares three expected hashes, and checks HEAD, four-file scope and diff.
Only the emitted completed count/exits may be reported as completed. Do not edit
after obtaining the external verification self-hash; any edit requires re-sealing.

```powershell
$expected = @{
  'rcm-p0-drift-report.md'='56183f98db34615d211c8dfffb0f13478356b278f4dd31bee3cd0c096aa9527f'
  'rcm-p0-catalog-snapshot.v1.json'='246a37dde67f3bd0663e40afeb739bdfbcab97ee7b669655acbe1d2e893b2917'
  'rcm-p0-environment-map.md'='b736fb0765145044c008500451568bdce78a164db8a7c09865437b4f1f9905db'
}

foreach ($name in $expected.Keys) {
  Check ((Get-FileHash -LiteralPath $artifactPaths[$name] -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $expected[$name]) "$name-final-expected-digest"
}
$head=git rev-parse HEAD
NativeExit 'git rev-parse HEAD' $LASTEXITCODE
Check ($head -ceq '1ec2b1012d5290851e924cc91137ec3f09122820') 'final-head-no-commit'
$tracked=@(git diff --name-only HEAD --)
NativeExit 'git diff --name-only HEAD --' $LASTEXITCODE
$untracked=@(git ls-files --others --exclude-standard)
NativeExit 'git ls-files --others --exclude-standard' $LASTEXITCODE
$allowed=@($artifactNames | ForEach-Object {"$g/$_"})
Check ($tracked.Count -eq 0 -and $untracked.Count -eq 4 -and @($untracked | Where-Object {$_ -cnotin $allowed}).Count -eq 0) 'final-four-file-scope'
git diff --check
NativeExit 'git diff --check' $LASTEXITCODE
Check $true 'final-diff-check'
[ordered]@{sealedAtUtc=(Get-Date -AsUTC -Format o);completedChecks=$checks.Count;syntheticChecks=8;artifactFormatChecks=20;digestChecks=3;scopeChecks=3;nativeExits=@($native);artifacts=$records;checks=@($checks);head=$head;changedPaths=$untracked} | ConvertTo-Json -Depth 5
```


## Coordinator-release record R1 and rework release R2

This retained record binds **process authorization** to coordinator task
`01a0bf3f-559b-7291-a20e-8d8a4bbb16b3`, the ratified loop-directive commit
`96b6e39d9845f15b52057ffa5e73147fc02ae5e7` (`96b6e39`), and the exact Gate 2
phrase **“Grant Gate 2 for RCM-P0 and RCM-P1”**. The directive's ownership block
names that task; its Standing authorizations item 2 records that grant. RW02
compared the committed directive text with the unchanged disk directive and
checked the task and phrase. Its SHA-256 remains
`5ed29906d77105eb3a5b05cc9b7cbe00f102930208d93cd7ff44cb06b1c057dc`.

R1 is the coordinator execution ruling transcribed from the initial assignment:
“Coordinator Step-0 ruling: release RCM-P0 execution under the accepted spec with
these limits.” The current coordinator rework assignment explicitly confirms those
limits and directs retention of this binding. R2 is the subsequent coordinator
message: “Coordinator releases rework. Apply the four requested fixes exactly
within the four evidence files.” It follows this builder's new Step 0 restatement
and authorizes this bounded rework of the existing artifacts.

The ruling permits repository evidence and in-memory verification while safe host
source binding remains unavailable. It requires F1–F6 blocked-secret-boundary,
HAWF escalated-unresolved with downstream hold, Jev refused/disabled-lane evidence
only, and snapshot complete=false/freshness refused. Node v24.7.0 is below shaping's
>=24.11.1 floor and worktree dependencies are absent; no installation is authorized.
Only the four evidence files may change. No host/catalog/settings/auth/credential
content, guessed paths, home/environment/credential-store enumeration, Pi launch,
network, dispatch/evaluator access, host/policy/control writes, commit or merge.

Provenance class: builder-retained transcription of coordinator messages plus
repository control evidence. Exact original user-message timestamps and immutable
message IDs are unavailable; no tool identity is asserted and there is
**no independent human signature**. The original artifact's “received before
2026-09-20T15:22:22.2949213Z” is a retained initial-run receipt upper-bound claim,
not a newly verified user timestamp. Rework observation times identify command
execution only. This record neither independently authenticates a human nor
turns process authorization into host evidence, TTL approval, spec promotion,
P1 dependency release, Gate 3 delegation, or full acceptance. No control document
was amended to create this record.

## Current evidence-procedure control

Chronology limitation (open): initial Step 0 and RW01 repository reads predated
RW04's later safety-gate proof. RW02 also cannot retroactively cover those reads.
No retained evidence establishes equivalent gating for those earlier reads; the
later controls do not close that process-evidence gap. Current source reads must
use the corrected RW04 gate before metadata/content/hash access. This is not
retroactive coverage or a claim of production enforcement.

RW04 supersedes historical C06–C12 locator-based reacquisition. It is an
**evidence-procedure control; not production runtime enforcement**. The only
rework-readable source roles are S01 and S03–S13. S02/S14 remain historical
dispatch/evaluator observations and are not accessed, rehashed or freshly attested.
H01–H04 remain unbound and unread.

Before a source metadata/content/hash read, require one exact, case-sensitive
source-ID + role + full safe-locator match against the fixed approved table.
Resolve the path from that table, never from `safeLocator.Substring(5)`. Reject
unknown roles, changed locators, absolute/drive-relative/UNC/device paths, dot
segments, traversal, alternate streams and malformed separators. Canonicalize
under the coordinator-bound repository root and require root-plus-separator
containment. Only after the role/containment gate, inspect each ancestor's
attributes without traversing a reparse point; refuse any reparse point before
descending or reading source content/hash/length/mtime.

Reject credential-bearing fields and URL userinfo/query/fragment before path
resolution or metadata reads. The source-role table accepts repository locators
only, so no URL can become a readable source. Refusals emit fixed labels without
the rejected value. No host document is acquired to perform these checks: inputs
are the existing safe evidence manifest and explicitly synthetic in-memory
negative copies. This is not an extractor or permission to parse mixed host JSON.

The negative changed-locator case changes S01 to another otherwise valid repository
path while retaining S01's role. It must yield SOURCE_ROLE_REFUSED with zero
additional metadata probes. Absolute, UNC, traversal, wrong-role, credential-field,
secret-URL and forbidden-source cases also refuse before metadata. A synthetic
reparse attribute exercises the same rejection predicate used by the ancestor
walk; no junction is created. This procedure does not claim atomic protection
against concurrent filesystem substitution; source changes refuse acceptance and
require coordinator handling.

An independent section-aware policy scan verifies each of 45 classification rows
and 15 tier rows against its exact cited line, then compares all six arrays in
exact source order. Reversed economy order and a changed classification citation
must fail on in-memory copies. Counts or set equality alone cannot pass those
checks. These results establish bounded repository declarations only.

## Rework AC-by-AC disposition

| AC | Rework evidence and remaining limitation |
|---|---|
| AC1 — Provenance | Explicit R1/R2 task/commit/Gate 2/process binding; 12 approved repository sources independently rechecked. S02/S14 historical only under current access limits. Host provenance blocked; original message time/signature and lost exits are not invented. |
| AC2 — F1–F6 | Repository citation/order checks strengthened; all six overall findings remain blocked-secret-boundary. No host or execution closure claimed. |
| AC3 — Exact identity | Exact case-sensitive policy IDs, citations and arrays verified with changed-order controls. Current provider/model/endpoint joins remain refused. |
| AC4 — Ownership | HAWF escalated-unresolved; reporting retained, downstream hold unchanged. No INDEX/ownership change. |
| AC5 — F4/Jev | Exact contractual tuple and recommend-only boundary retained; refused/disabled-lane evidence only. Enabled/default host inventory remains blocked. |
| AC6 — Snapshot | complete=false and freshness refused preserved; safe verification procedure referenced without refreshing original host/source times. Positive consumption remains refused. |
| AC7 — Safety | Exact-role/root/reparse/credential/URL gate and refusal controls documented. Four-file-only edits; host and dispatch/evaluator access excluded. No runtime enforcement claim. |
| AC8 — Verification | Fresh pre-edit tripwire met (167 >= 124); exact rework commands and results retained separately from C06/C13 gaps. Node/dependency lint limitation persists. Two prior frontier reviews are reported by the coordinator; this builder has not independently obtained their reports. Post-rework review and coordinator acceptance remain outstanding. |


## Rework command/effect accounting

Prior completed-check baseline remains **124** (C05 14 + C10 79 + C11 6 + C12 25).
RW02 completed **167 fresh checks before any rework edit**, at
2026-09-20T15:46:45.6758392Z, shell exit 0. The hard floor was satisfied before
RW-W01. No original checks are relabeled as fresh.

C06 original shell exit: **unretained**. Its original result payload was lost when
the output wrapper attempted JSON.parse on Exception output. That is the retained
C06 result, not a recovered native/shell exit. C07's exit 1 is a separate repeat.
RW02/RW04 are corrected rework commands: they use -DateKind String, actual byte
digests, four-file accounting and gated sources; they do not recover C06's exit.

| Historical operation | Shell exit | Native exits / qualification |
|---|---|---|
| Initial Step 0 | unretained in supplied artifacts | Exact original command list and individual exits unavailable; initial status/tool/dependency findings are historical, not independently reconstructed. |
| C01 | 0 | node -v=0; git rev-parse HEAD=0; git status=0 |
| C02 | 0 | No native executable invoked |
| C03 | 0 | git --version=0; rg --version=0 |
| C04 | 0 | No native executable invoked |
| C05 | 0 | No native executable invoked; 14 completed comparisons |
| C06 | unretained | Result-wrapper failure; no native audit exit retained; C07 failed before its native audits, but that cannot recover C06's execution. |
| C07 | 1 | Native audit commands not reached |
| C08 | 1 | Native audit commands not reached |
| C09 | 1 | Native audit commands not reached |
| C10 | 0 | git tracked diff=0; git untracked list=0; git diff --check=0; 79 checks |
| C11 | 1 expected | No native executable; 6 completed refusal/integrity checks |
| C12 | 0 | git HEAD=0; tracked diff=0; untracked list=0; diff --check=0; 25 checks |
| C13 | unretained in supplied artifacts | Script specified; old record refers result externally. No native executable in script; historical shell result is not invented. Fresh seal is separate. |

The historical ledger therefore has 12 known native exits, all 0, and C06's
unretained execution uncertainty. C13 and initial Step 0 have explicit evidence
gaps; they are neither successes nor newly fabricated failures.

### Rework Step 0 command inventory

Eight read-only PowerShell invocations completed, each shell exit 0:
P00a inspected location, status, repository filenames and the named parcel skill;
P00b reread the skill after display truncation; P00c read the omitted skill section,
both AGENTS files and the spec, then checked branch/HEAD; P00d read drift/environment;
P00e read verification; P00f read verification lines 221–460 to resolve truncation;
P00g read snapshot lines 1–430; P00h read the remaining snapshot, directive and
standing constraints. Output-only retrieval from the orchestration store did not
launch another shell. No edits or verification-suite execution occurred at Step 0.

P00a's git status and rg filename-search native exits were not captured individually;
the shell exit 0 does not establish them. P00c captured git branch=0 and git HEAD=0.
Fresh status, branch and version results below are replacements only for current
observations, never reconstructions of those lost native exits. Instruction-skill
reads used the exact installed SKILL.md path supplied by the skill catalog; that
instruction path is represented here as INSTRUCTION_SKILL to avoid publishing a
user-home path. It is not an acquired host catalog/settings source.

P00 commands (only the private instruction-path operand is role-redacted):
```text
P00a: Get-Location; git status --short; rg --files -g AGENTS.md -g '*rcm-p0*' -g '*RCM*' -g '*routing-currency*' -g '*loop-directive*'; Get-Content INSTRUCTION_SKILL
P00b: Get-Content INSTRUCTION_SKILL
P00c: Get-Content INSTRUCTION_SKILL | Select-Object -Skip 390 -First 160; Get-Content AGENTS.md; Get-Content plugins/foreman-line/AGENTS.md; Get-Content plugins/foreman-line/docs/specs/active/RCM-P0-current-instance-recon.md; git branch --show-current; Write-Output "git-branch-native-exit=$LASTEXITCODE"; git rev-parse HEAD; Write-Output "git-head-native-exit=$LASTEXITCODE"
P00d: Get-Content plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-drift-report.md; Get-Content plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-environment-map.md
P00e: Get-Content plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-verification.md
P00f: Get-Content plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-verification.md | Select-Object -Skip 220 -First 240
P00g: Get-Content plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-catalog-snapshot.v1.json | Select-Object -First 430
P00h: Get-Content plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-catalog-snapshot.v1.json | Select-Object -Skip 430; Get-Content plugins/foreman-line/docs/goals/routing-currency-and-merit/loop-directive.md; Get-Content plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md
```

### Released rework ledger

| ID | Command/result |
|---|---|
| RW01 | Read verification header and policy; status and Node. Shell 0; git status=0; node -v=0 (v24.7.0). |
| RW-PARSE | Orchestration JavaScript syntax error before tool execution: unescaped PowerShell backtick in a template literal. No shell launched, no native exit, no filesystem effect, no checks counted. |
| RW02 | Corrected in-memory suite below: shell 0, 167 checks; 7 native exits all 0. Pre-edit tripwire satisfied. |
| RW03 | Retain exact four evidence texts/pre-edit digests and tool versions. Shell 0; git --version=0; rg --version=0. PowerShell 7.6.6, Git 2.45.2.windows.1, ripgrep 14.1.0. |
| RW-W01 | apply_patch only: bounded rework of the four evidence files; tool result retained externally. No shell/native exit. |
| RW04 | Post-edit corrected suite below. Result is recorded only after execution. |

RW02's seven native commands, each exit 0: node -v; git rev-parse HEAD;
git branch --show-current; git diff --name-only HEAD --;
git ls-files --others --exclude-standard; git diff --check;
git show 96b6e39:plugins/foreman-line/docs/goals/routing-currency-and-merit/loop-directive.md.
RW04 records these exits again immediately. No piped/truncated exit inference.

### RW01

```powershell
Get-Content plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-verification.md -First 155
Get-Content plugins/foreman-line/routing-policy/routing-policy.yaml
git status --short --untracked-files=all
Write-Output "native_status_exit=$LASTEXITCODE"
node -v
Write-Output "native_node_exit=$LASTEXITCODE"
```

### RW03

```powershell
$ErrorActionPreference='Stop'
$g='plugins/foreman-line/docs/goals/routing-currency-and-merit'
git --version
Write-Output "git_version_exit=$LASTEXITCODE"
rg --version
Write-Output "rg_version_exit=$LASTEXITCODE"
Write-Output "powershell=$($PSVersionTable.PSVersion)"
foreach ($name in @('rcm-p0-drift-report.md','rcm-p0-catalog-snapshot.v1.json','rcm-p0-environment-map.md','rcm-p0-verification.md')) {
  [ordered]@{name=$name;sha256=(Get-FileHash -LiteralPath "$g/$name" -Algorithm SHA256).Hash.ToLowerInvariant();text=(Get-Content -LiteralPath "$g/$name" -Raw)} | ConvertTo-Json -Compress -Depth 3
}
```

Pre-edit SHA-256 values from RW03:
- rcm-p0-drift-report.md: `a059e78399edf3cc431ecc76d7c90224333f1d93b0bbacb8c143d0fdd7eb8b9f`
- rcm-p0-catalog-snapshot.v1.json: `3991ad80a34c1c861d06c4732b488b742e858ee64a79fc2f974a9b1d06ecdab6`
- rcm-p0-environment-map.md: `6d56c156846e554ea7826ed6565bb453afc1604002516878c3be2dc40ad87e0f`
- rcm-p0-verification.md: `cdeb4e9c198e4a4a7cf9ebc0d29117ec0308fa441cb2ef923eb61209f4850182`

### RW02

Exact pre-edit command, shell exit 0:
```powershell
$ErrorActionPreference = 'Stop'
$g = 'plugins/foreman-line/docs/goals/routing-currency-and-merit'
$root = [IO.Path]::GetFullPath((Get-Location).Path)
$expectedRoot = 'C:\Repos\foreman-line-routing-currency-merit-rcm-p0-builder'
if ($root -cne $expectedRoot) { throw 'ROOT_BINDING_REFUSED' }
$checks = [Collections.Generic.List[string]]::new()
$native = [Collections.Generic.List[object]]::new()
function Check([bool]$ok,[string]$name) {
  if (-not $ok) { throw "CHECK_FAILED: $name" }
  $checks.Add($name)
}
function NativeExit([string]$name,[int]$code) {
  $native.Add([ordered]@{command=$name;exit=$code})
  if ($code -ne 0) { throw "NATIVE_FAILED: $name ($code)" }
}
# Exact approved bindings; S02/S14 are excluded by the rework access limits.
$bindings = @(
  @('S01','repository routing policy','plugins/foreman-line/routing-policy/routing-policy.yaml'),
  @('S03','RCM charter / historical hypotheses',"$g/charter.md"),
  @('S04','RCM authority and queue',"$g/loop-directive.md"),
  @('S05','ratified amendments',"$g/gate-1-reopen-proposal.md"),
  @('S06','goal index','plugins/foreman-line/docs/goals/INDEX.md'),
  @('S07','HAWF charter','plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/charter.md'),
  @('S08','HAWF directive','plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/loop-directive.md'),
  @('S09','boundary-routing contract','plugins/foreman-line/docs/goals/foreman-line-boundary-routing/charter.md'),
  @('S10','accepted parcel spec','plugins/foreman-line/docs/specs/active/RCM-P0-current-instance-recon.md'),
  @('S11','standing constraints','plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md'),
  @('S12','shaping runtime manifest','plugins/foreman-line/shaping/package.json'),
  @('S13','spec-linter runtime manifest','plugins/foreman-line/spec-linter/package.json')
)
$artifactNames = @('rcm-p0-drift-report.md','rcm-p0-catalog-snapshot.v1.json','rcm-p0-environment-map.md','rcm-p0-verification.md')
$artifactBindings = @($artifactNames | ForEach-Object { ,@($_,'parcel evidence',"$g/$_") })
$script:metadataProbes = 0
function RejectUnsafeFields($value) {
  if ($null -eq $value) { return }
  if ($value -is [string]) {
    foreach ($m in [regex]::Matches($value,'https?://[^\s"<>]+')) {
      $url = [uri]$m.Value
      if ($url.UserInfo -or $url.Query -or $url.Fragment -or $url.IsLoopback -or -not $url.Host.Contains('.')) { throw 'SECRET_URL_REFUSED' }
    }
    return
  }
  if ($value -is [Collections.IDictionary]) {
    foreach ($key in $value.Keys) {
      if ($key -match '(?i)^(headers?|authorization|proxy.authorization|cookies?|credentials?|credentialRefs?|secrets?|tokens?|access.token|refresh.token|api.key|password|auth|compat)$') { throw 'CREDENTIAL_FIELD_REFUSED' }
      RejectUnsafeFields $value[$key]
    }
  } elseif ($value -is [pscustomobject]) {
    foreach ($p in $value.PSObject.Properties) {
      if ($p.Name -match '(?i)^(headers?|authorization|proxy.authorization|cookies?|credentials?|credentialRefs?|secrets?|tokens?|access.token|refresh.token|api.key|password|auth|compat)$') { throw 'CREDENTIAL_FIELD_REFUSED' }
      RejectUnsafeFields $p.Value
    }
  } elseif ($value -is [Collections.IEnumerable]) {
    foreach ($v in $value) { RejectUnsafeFields $v }
  }
}
function RejectReparse([IO.FileAttributes]$attributes) {
  if (($attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'REPARSE_REFUSED' }
}
function BoundPath($source,$approved) {
  # No metadata/content/hash access before this lexical/role gate.
  RejectUnsafeFields $source
  $entry = @($approved | Where-Object { $_[0] -ceq $source.id })
  if ($entry.Count -ne 1) { throw 'SOURCE_ROLE_REFUSED' }
  $b = $entry[0]
  if ($source.role -cne $b[1] -or $source.safeLocator -cne "repo:$($b[2])") { throw 'SOURCE_ROLE_REFUSED' }
  $relative = $b[2] # fixed binding, never a path extracted from the locator
  if ([IO.Path]::IsPathRooted($relative) -or $relative -notmatch '^[A-Za-z0-9_./-]+$' -or @($relative.Split('/') | Where-Object { $_ -in @('','.', '..') }).Count) { throw 'PATH_FORM_REFUSED' }
  $full = [IO.Path]::GetFullPath([IO.Path]::Combine($root,$relative))
  if (-not $full.StartsWith($root + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'CONTAINMENT_REFUSED' }
  # Only after role/containment validation: inspect ancestors individually,
  # refusing reparse points before descending or permitting content/hash reads.
  $parts = $full.Split([IO.Path]::DirectorySeparatorChar)
  $probe = [IO.Path]::GetPathRoot($full)
  $script:metadataProbes++
  RejectReparse (Get-Item -LiteralPath $probe -Force).Attributes
  foreach ($part in $parts | Select-Object -Skip 1) {
    $probe = [IO.Path]::Combine($probe,$part)
    $script:metadataProbes++
    RejectReparse (Get-Item -LiteralPath $probe -Force).Attributes
  }
  return $full
}
$artifactPaths = @{}
foreach ($b in $artifactBindings) {
  $artifactPaths[$b[0]] = BoundPath ([pscustomobject]@{id=$b[0];role=$b[1];safeLocator="repo:$($b[2])"}) $artifactBindings
}
$s = Get-Content -LiteralPath $artifactPaths['rcm-p0-catalog-snapshot.v1.json'] -Raw | ConvertFrom-Json -DateKind String
Check ($s.recordVersion -eq 1) 'record-version'
Check ($s.purpose -ceq 'recon-evidence-only') 'evidence-purpose'
Check ($s.complete -eq $false) 'incomplete'
Check ($s.incompleteReasons -ccontains 'blocked-secret-boundary') 'blocked-boundary'
Check (@($s.providers).Count -eq 0) 'providers-unobserved'
Check (@($s.models).Count -eq 0) 'models-unobserved'
Check ($null -eq $s.settingsFacts.facts) 'settings-unobserved'
Check ($s.settingsFacts.status -ceq 'blocked-secret-boundary') 'settings-refused'
Check ($null -eq $s.freshness.maxAgeSeconds) 'no-accepted-ttl'
Check ($s.freshness.proposedMaxAgeSeconds -eq 86400) 'proposed-ttl-only'
Check ($s.freshness.verdict -ceq 'refused') 'freshness-refused'
Check ($null -eq $s.freshness.computedAgeSeconds) 'age-unknown'
Check ($null -eq $s.freshness.oldestRequiredSourceOrProviderFactTimeUtc) 'host-time-unknown'
Check ($null -eq $s.repositoryFacts.catalogJoin.presentCount) 'host-joins-unknown'
Check ($s.repositoryFacts.catalogJoin.verdict -ceq 'blocked-secret-boundary') 'host-joins-refused'
foreach ($id in @('H01','H02','H03','H04')) {
  $h = @($s.sourceRefs | Where-Object id -CEQ $id)
  Check ($h.Count -eq 1 -and $h[0].status -ceq 'blocked-secret-boundary' -and $null -eq $h[0].safeProjectionSha256 -and $null -eq $h[0].acquiredAtUtc) "$id-unbound-unread"
}
$paths = @{}
foreach ($b in $bindings) {
  $rows = @($s.sourceRefs | Where-Object id -CEQ $b[0])
  Check ($rows.Count -eq 1) "$($b[0])-unique-role"
  $source = $rows[0]
  $path = BoundPath $source $bindings
  $paths[$source.id] = $path
  Check ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $source.safeProjectionSha256) "$($source.id)-digest"
  $item = Get-Item -LiteralPath $path
  Check ($item.Length -eq $source.byteFormat.length) "$($source.id)-length"
  Check ($item.LastWriteTimeUtc.ToString('o') -ceq $source.sourceStability.lastWriteTimeUtc) "$($source.id)-metadata"
}
# Independent section-aware scan; snapshot values never select policy sections.
$lines = @(Get-Content -LiteralPath $paths['S01'])
$groups = @{}
$section = ''; $subsection = ''
for ($i=0; $i -lt $lines.Count; $i++) {
  $line = $lines[$i]
  if ($line -cmatch '^([a-z_]+):') { $section=$Matches[1]; $subsection='' }
  elseif ($line -cmatch '^  ([a-z]+):' -and $section -cin @('model_tiers','data_classification')) {
    $subsection=$Matches[1]; $groups["$section.$subsection"]=@()
  } elseif ($line -cmatch '^\s+- ([^ #]+)' -and $subsection -cne '' -and $section -cin @('model_tiers','data_classification')) {
    $groups["$section.$subsection"] += [pscustomobject]@{id=$Matches[1];line=$i+1}
  }
}
function ExactSequence($actual,$expected) {
  if (@($actual).Count -ne @($expected).Count) { throw 'ORDER_REFUSED' }
  for ($j=0;$j -lt @($expected).Count;$j++) {
    if ($actual[$j].id -cne $expected[$j].id -or $actual[$j].line -ne $expected[$j].line) { throw 'ORDER_REFUSED' }
  }
}
foreach ($kind in @('tiers','classificationIds')) {
  $sectionName = if ($kind -ceq 'tiers') {'model_tiers'} else {'data_classification'}
  $keys = if ($kind -ceq 'tiers') {@('frontier','standard','economy')} else {@('public','internal','restricted')}
  foreach ($key in $keys) {
    $actual = @($s.repositoryFacts.$kind.$key)
    $expected = @($groups["$sectionName.$key"])
    ExactSequence $actual $expected
    Check $true "$kind-$key-exact-order-and-membership"
    foreach ($row in $actual) {
      $m = if ($row.line -gt 0 -and $row.line -le $lines.Count) { [regex]::Match($lines[$row.line-1],'^\s+- ([^ #]+)') } else { $null }
      Check ($null -ne $m -and $m.Success -and $m.Groups[1].Value -ceq $row.id) "$kind-$key-cited-line-$($row.line)"
    }
  }
}
$tierIds = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach ($key in @('frontier','standard','economy')) { foreach ($row in $s.repositoryFacts.tiers.$key) { [void]$tierIds.Add($row.id) } }
Check ($tierIds.Count -eq 15) 'distinct-tier-count'
foreach ($key in @('public','internal','restricted')) {
  $ids = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  foreach ($row in $s.repositoryFacts.classificationIds.$key) { [void]$ids.Add($row.id) }
  Check ($ids.Count -eq 15 -and $ids.SetEquals($tierIds)) "$key-classification-set"
}
# Negative copies never touch disk; bad locators must refuse before metadata.
$original = $s.sourceRefs | Where-Object id -CEQ 'S01'
foreach ($case in @('changed-locator','absolute','UNC','traversal','wrong-role','secret-url','credential-field','forbidden-source')) {
  $copy = $original | ConvertTo-Json -Depth 15 | ConvertFrom-Json -DateKind String
  switch ($case) {
    'changed-locator' { $copy.safeLocator='repo:plugins/foreman-line/docs/goals/routing-currency-and-merit/charter.md' }
    'absolute' { $copy.safeLocator='repo:C:/outside/file.txt' }
    'UNC' { $copy.safeLocator='repo:\\invalid.example\share\file.txt' }
    'traversal' { $copy.safeLocator='repo:../outside.txt' }
    'wrong-role' { $copy.role='host catalog' }
    'secret-url' { $copy.safeLocator='https://example.invalid/?token=SYNTHETIC' }
    'credential-field' { $copy | Add-Member -NotePropertyName headers -NotePropertyValue @{Authorization='SYNTHETIC'} }
    'forbidden-source' { $copy.id='S02' }
  }
  $before=$script:metadataProbes; $refused=$false
  try { [void](BoundPath $copy $bindings) } catch {
    if ($_.Exception.Message -notin @('SOURCE_ROLE_REFUSED','SECRET_URL_REFUSED','CREDENTIAL_FIELD_REFUSED','PATH_FORM_REFUSED','CONTAINMENT_REFUSED')) { throw }
    $refused=$true
  }
  Check ($refused -and $before -eq $script:metadataProbes) "negative-$case-before-metadata"
}
$refused=$false
try { RejectReparse ([IO.FileAttributes]::ReparsePoint) } catch { if ($_.Exception.Message -cne 'REPARSE_REFUSED') {throw}; $refused=$true }
Check $refused 'negative-reparse-attribute-in-memory'
$reverse = @($s.repositoryFacts.tiers.economy)
[array]::Reverse($reverse)
$refused=$false
try { ExactSequence $reverse $groups['model_tiers.economy'] } catch { if ($_.Exception.Message -cne 'ORDER_REFUSED') {throw}; $refused=$true }
Check $refused 'negative-reversed-economy-order'
$badClass = $s.repositoryFacts.classificationIds.public | ConvertTo-Json | ConvertFrom-Json
$badClass[0].line=75
$refused=$false
try { ExactSequence $badClass $groups['data_classification.public'] } catch { if ($_.Exception.Message -cne 'ORDER_REFUSED') {throw}; $refused=$true }
Check $refused 'negative-classification-citation'
foreach ($name in $artifactNames) {
  $raw = Get-Content -LiteralPath $artifactPaths[$name] -Raw
  Check ($raw.Length -gt 0) "$name-nonempty"
  Check (@($raw -split '\r?\n' | Where-Object { $_ -match '[ \t]+$' }).Count -eq 0) "$name-no-trailing-whitespace"
}
node -v
NativeExit 'node -v' $LASTEXITCODE
$head = git rev-parse HEAD
NativeExit 'git rev-parse HEAD' $LASTEXITCODE
Check ($head -ceq $s.repoCommit) 'head-unchanged'
$branch = git branch --show-current
NativeExit 'git branch --show-current' $LASTEXITCODE
Check ($branch -ceq 'codex/rcm-p0-builder') 'branch-bound'
$tracked = @(git diff --name-only HEAD --)
NativeExit 'git diff --name-only HEAD --' $LASTEXITCODE
Check ($tracked.Count -eq 0) 'no-tracked-edits'
$untracked = @(git ls-files --others --exclude-standard)
NativeExit 'git ls-files --others --exclude-standard' $LASTEXITCODE
$allowed = @($artifactNames | ForEach-Object {"$g/$_"})
Check ($untracked.Count -eq 4 -and @($untracked | Where-Object {$_ -cnotin $allowed}).Count -eq 0) 'exact-four-evidence-files'
git diff --check
NativeExit 'git diff --check' $LASTEXITCODE
Check $true 'diff-check'
$directive = @(git show '96b6e39:plugins/foreman-line/docs/goals/routing-currency-and-merit/loop-directive.md')
NativeExit 'git show 96b6e39:loop-directive.md' $LASTEXITCODE
$diskDirective = @(Get-Content -LiteralPath $paths['S04'])
Check (($directive -join [char]10) -ceq ($diskDirective -join [char]10)) 'ratified-directive-equals-disk'
Check (($directive -join [char]10).Contains('01a0bf3f-559b-7291-a20e-8d8a4bbb16b3')) 'directive-task-binding'
Check (($directive -join [char]10).Contains('Grant Gate 2 for RCM-P0 and RCM-P1')) 'directive-gate2-phrase'
foreach ($dep in @('node_modules','plugins/foreman-line/shaping/node_modules','plugins/foreman-line/spec-linter/node_modules')) {
  Check (-not (Test-Path -LiteralPath (Join-Path $root $dep))) "$dep-absent"
}
if ($checks.Count -lt 124) { throw "TRIPWIRE: fresh completed checks=$($checks.Count), floor=124" }
[ordered]@{checkedAtUtc=(Get-Date -AsUTC -Format o);completedChecks=$checks.Count;assertions=@($checks);nativeExits=@($native);sourceDigestsRechecked=12;excludedSources=@('S02','S14');scope='repository evidence only; no production/host test'} | ConvertTo-Json -Depth 6

```

### RW04

Exact corrected post-edit command; preserves the same checks and adds release-record
assertions and credential-key spelling coverage. This is an in-memory evidence
procedure, not a newly installed executable or production test suite.
```powershell
$ErrorActionPreference = 'Stop'
$g = 'plugins/foreman-line/docs/goals/routing-currency-and-merit'
$root = [IO.Path]::GetFullPath((Get-Location).Path)
$expectedRoot = 'C:\Repos\foreman-line-routing-currency-merit-rcm-p0-builder'
if ($root -cne $expectedRoot) { throw 'ROOT_BINDING_REFUSED' }
$checks = [Collections.Generic.List[string]]::new()
$native = [Collections.Generic.List[object]]::new()
function Check([bool]$ok,[string]$name) {
  if (-not $ok) { throw "CHECK_FAILED: $name" }
  $checks.Add($name)
}
function NativeExit([string]$name,[int]$code) {
  $native.Add([ordered]@{command=$name;exit=$code})
  if ($code -ne 0) { throw "NATIVE_FAILED: $name ($code)" }
}
# Exact approved bindings; S02/S14 are excluded by the rework access limits.
$bindings = @(
  @('S01','repository routing policy','plugins/foreman-line/routing-policy/routing-policy.yaml'),
  @('S03','RCM charter / historical hypotheses',"$g/charter.md"),
  @('S04','RCM authority and queue',"$g/loop-directive.md"),
  @('S05','ratified amendments',"$g/gate-1-reopen-proposal.md"),
  @('S06','goal index','plugins/foreman-line/docs/goals/INDEX.md'),
  @('S07','HAWF charter','plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/charter.md'),
  @('S08','HAWF directive','plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/loop-directive.md'),
  @('S09','boundary-routing contract','plugins/foreman-line/docs/goals/foreman-line-boundary-routing/charter.md'),
  @('S10','accepted parcel spec','plugins/foreman-line/docs/specs/active/RCM-P0-current-instance-recon.md'),
  @('S11','standing constraints','plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md'),
  @('S12','shaping runtime manifest','plugins/foreman-line/shaping/package.json'),
  @('S13','spec-linter runtime manifest','plugins/foreman-line/spec-linter/package.json')
)
$artifactNames = @('rcm-p0-drift-report.md','rcm-p0-catalog-snapshot.v1.json','rcm-p0-environment-map.md','rcm-p0-verification.md')
$artifactBindings = @($artifactNames | ForEach-Object { ,@($_,'parcel evidence',"$g/$_") })
$script:metadataProbes = 0
function RejectUnsafeFields($value) {
  if ($null -eq $value) { return }
  if ($value -is [string]) {
    foreach ($m in [regex]::Matches($value,'https?://[^\s"<>]+')) {
      $url = [uri]$m.Value
      if ($url.UserInfo -or $url.Query -or $url.Fragment -or $url.IsLoopback -or -not $url.Host.Contains('.')) { throw 'SECRET_URL_REFUSED' }
    }
    return
  }
  if ($value -is [Collections.IDictionary]) {
    foreach ($key in $value.Keys) {
      if ($key -match '(?i)^(headers?|authorization|proxy.?authorization|cookies?|credentials?|credential.*|secret.*|tokens?|access.?token|refresh.?token|api.?key|password|auth|compat)$') { throw 'CREDENTIAL_FIELD_REFUSED' }
      RejectUnsafeFields $value[$key]
    }
  } elseif ($value -is [pscustomobject]) {
    foreach ($p in $value.PSObject.Properties) {
      if ($p.Name -match '(?i)^(headers?|authorization|proxy.?authorization|cookies?|credentials?|credential.*|secret.*|tokens?|access.?token|refresh.?token|api.?key|password|auth|compat)$') { throw 'CREDENTIAL_FIELD_REFUSED' }
      RejectUnsafeFields $p.Value
    }
  } elseif ($value -is [Collections.IEnumerable]) {
    foreach ($v in $value) { RejectUnsafeFields $v }
  }
}
function RejectReparse([IO.FileAttributes]$attributes) {
  if (($attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'REPARSE_REFUSED' }
}
function BoundPath($source,$approved) {
  # No metadata/content/hash access before this lexical/role gate.
  RejectUnsafeFields $source
  $entry = @($approved | Where-Object { $_[0] -ceq $source.id })
  if ($entry.Count -ne 1) { throw 'SOURCE_ROLE_REFUSED' }
  $b = $entry[0]
  if ($source.role -cne $b[1] -or $source.safeLocator -cne "repo:$($b[2])") { throw 'SOURCE_ROLE_REFUSED' }
  $relative = $b[2] # fixed binding, never a path extracted from the locator
  if ([IO.Path]::IsPathRooted($relative) -or $relative -notmatch '^[A-Za-z0-9_./-]+$' -or @($relative.Split('/') | Where-Object { $_ -in @('','.', '..') }).Count) { throw 'PATH_FORM_REFUSED' }
  $full = [IO.Path]::GetFullPath([IO.Path]::Combine($root,$relative))
  if (-not $full.StartsWith($root + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'CONTAINMENT_REFUSED' }
  # Only after role/containment validation: inspect ancestors individually,
  # refusing reparse points before descending or permitting content/hash reads.
  $parts = $full.Split([IO.Path]::DirectorySeparatorChar)
  $probe = [IO.Path]::GetPathRoot($full)
  $script:metadataProbes++
  RejectReparse (Get-Item -LiteralPath $probe -Force).Attributes
  foreach ($part in $parts | Select-Object -Skip 1) {
    $probe = [IO.Path]::Combine($probe,$part)
    $script:metadataProbes++
    RejectReparse (Get-Item -LiteralPath $probe -Force).Attributes
  }
  return $full
}
$artifactPaths = @{}
foreach ($b in $artifactBindings) {
  $artifactPaths[$b[0]] = BoundPath ([pscustomobject]@{id=$b[0];role=$b[1];safeLocator="repo:$($b[2])"}) $artifactBindings
}
$s = Get-Content -LiteralPath $artifactPaths['rcm-p0-catalog-snapshot.v1.json'] -Raw | ConvertFrom-Json -DateKind String
Check ($s.recordVersion -eq 1) 'record-version'
Check ($s.purpose -ceq 'recon-evidence-only') 'evidence-purpose'
Check ($s.complete -eq $false) 'incomplete'
Check ($s.incompleteReasons -ccontains 'blocked-secret-boundary') 'blocked-boundary'
Check (@($s.providers).Count -eq 0) 'providers-unobserved'
Check (@($s.models).Count -eq 0) 'models-unobserved'
Check ($null -eq $s.settingsFacts.facts) 'settings-unobserved'
Check ($s.settingsFacts.status -ceq 'blocked-secret-boundary') 'settings-refused'
Check ($null -eq $s.freshness.maxAgeSeconds) 'no-accepted-ttl'
Check ($s.freshness.proposedMaxAgeSeconds -eq 86400) 'proposed-ttl-only'
Check ($s.freshness.verdict -ceq 'refused') 'freshness-refused'
Check ($null -eq $s.freshness.computedAgeSeconds) 'age-unknown'
Check ($null -eq $s.freshness.oldestRequiredSourceOrProviderFactTimeUtc) 'host-time-unknown'
Check ($null -eq $s.repositoryFacts.catalogJoin.presentCount) 'host-joins-unknown'
Check ($s.repositoryFacts.catalogJoin.verdict -ceq 'blocked-secret-boundary') 'host-joins-refused'
foreach ($id in @('H01','H02','H03','H04')) {
  $h = @($s.sourceRefs | Where-Object id -CEQ $id)
  Check ($h.Count -eq 1 -and $h[0].status -ceq 'blocked-secret-boundary' -and $null -eq $h[0].safeProjectionSha256 -and $null -eq $h[0].acquiredAtUtc) "$id-unbound-unread"
}
$paths = @{}
foreach ($b in $bindings) {
  $rows = @($s.sourceRefs | Where-Object id -CEQ $b[0])
  Check ($rows.Count -eq 1) "$($b[0])-unique-role"
  $source = $rows[0]
  $path = BoundPath $source $bindings
  $paths[$source.id] = $path
  Check ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $source.safeProjectionSha256) "$($source.id)-digest"
  $item = Get-Item -LiteralPath $path
  Check ($item.Length -eq $source.byteFormat.length) "$($source.id)-length"
  Check ($item.LastWriteTimeUtc.ToString('o') -ceq $source.sourceStability.lastWriteTimeUtc) "$($source.id)-metadata"
}
# Independent section-aware scan; snapshot values never select policy sections.
$lines = @(Get-Content -LiteralPath $paths['S01'])
$groups = @{}
$section = ''; $subsection = ''
for ($i=0; $i -lt $lines.Count; $i++) {
  $line = $lines[$i]
  if ($line -cmatch '^([a-z_]+):') { $section=$Matches[1]; $subsection='' }
  elseif ($line -cmatch '^  ([a-z]+):' -and $section -cin @('model_tiers','data_classification')) {
    $subsection=$Matches[1]; $groups["$section.$subsection"]=@()
  } elseif ($line -cmatch '^\s+- ([^ #]+)' -and $subsection -cne '' -and $section -cin @('model_tiers','data_classification')) {
    $groups["$section.$subsection"] += [pscustomobject]@{id=$Matches[1];line=$i+1}
  }
}
function ExactSequence($actual,$expected) {
  if (@($actual).Count -ne @($expected).Count) { throw 'ORDER_REFUSED' }
  for ($j=0;$j -lt @($expected).Count;$j++) {
    if ($actual[$j].id -cne $expected[$j].id -or $actual[$j].line -ne $expected[$j].line) { throw 'ORDER_REFUSED' }
  }
}
foreach ($kind in @('tiers','classificationIds')) {
  $sectionName = if ($kind -ceq 'tiers') {'model_tiers'} else {'data_classification'}
  $keys = if ($kind -ceq 'tiers') {@('frontier','standard','economy')} else {@('public','internal','restricted')}
  foreach ($key in $keys) {
    $actual = @($s.repositoryFacts.$kind.$key)
    $expected = @($groups["$sectionName.$key"])
    ExactSequence $actual $expected
    Check $true "$kind-$key-exact-order-and-membership"
    foreach ($row in $actual) {
      $m = if ($row.line -gt 0 -and $row.line -le $lines.Count) { [regex]::Match($lines[$row.line-1],'^\s+- ([^ #]+)') } else { $null }
      Check ($null -ne $m -and $m.Success -and $m.Groups[1].Value -ceq $row.id) "$kind-$key-cited-line-$($row.line)"
    }
  }
}
$tierIds = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach ($key in @('frontier','standard','economy')) { foreach ($row in $s.repositoryFacts.tiers.$key) { [void]$tierIds.Add($row.id) } }
Check ($tierIds.Count -eq 15) 'distinct-tier-count'
foreach ($key in @('public','internal','restricted')) {
  $ids = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  foreach ($row in $s.repositoryFacts.classificationIds.$key) { [void]$ids.Add($row.id) }
  Check ($ids.Count -eq 15 -and $ids.SetEquals($tierIds)) "$key-classification-set"
}
# Negative copies never touch disk; bad locators must refuse before metadata.
$original = $s.sourceRefs | Where-Object id -CEQ 'S01'
foreach ($case in @('changed-locator','absolute','UNC','traversal','wrong-role','secret-url','credential-field','forbidden-source')) {
  $copy = $original | ConvertTo-Json -Depth 15 | ConvertFrom-Json -DateKind String
  switch ($case) {
    'changed-locator' { $copy.safeLocator='repo:plugins/foreman-line/docs/goals/routing-currency-and-merit/charter.md' }
    'absolute' { $copy.safeLocator='repo:C:/outside/file.txt' }
    'UNC' { $copy.safeLocator='repo:\\invalid.example\share\file.txt' }
    'traversal' { $copy.safeLocator='repo:../outside.txt' }
    'wrong-role' { $copy.role='host catalog' }
    'secret-url' { $copy.safeLocator='https://example.invalid/?token=SYNTHETIC' }
    'credential-field' { $copy | Add-Member -NotePropertyName headers -NotePropertyValue @{Authorization='SYNTHETIC'} }
    'forbidden-source' { $copy.id='S02' }
  }
  $before=$script:metadataProbes; $refused=$false
  try { [void](BoundPath $copy $bindings) } catch {
    if ($_.Exception.Message -notin @('SOURCE_ROLE_REFUSED','SECRET_URL_REFUSED','CREDENTIAL_FIELD_REFUSED','PATH_FORM_REFUSED','CONTAINMENT_REFUSED')) { throw }
    $refused=$true
  }
  Check ($refused -and $before -eq $script:metadataProbes) "negative-$case-before-metadata"
}
$refused=$false
try { RejectReparse ([IO.FileAttributes]::ReparsePoint) } catch { if ($_.Exception.Message -cne 'REPARSE_REFUSED') {throw}; $refused=$true }
Check $refused 'negative-reparse-attribute-in-memory'
$reverse = @($s.repositoryFacts.tiers.economy)
[array]::Reverse($reverse)
$refused=$false
try { ExactSequence $reverse $groups['model_tiers.economy'] } catch { if ($_.Exception.Message -cne 'ORDER_REFUSED') {throw}; $refused=$true }
Check $refused 'negative-reversed-economy-order'
$badClass = $s.repositoryFacts.classificationIds.public | ConvertTo-Json | ConvertFrom-Json
$badClass[0].line=75
$refused=$false
try { ExactSequence $badClass $groups['data_classification.public'] } catch { if ($_.Exception.Message -cne 'ORDER_REFUSED') {throw}; $refused=$true }
Check $refused 'negative-classification-citation'
foreach ($name in $artifactNames) {
  $raw = Get-Content -LiteralPath $artifactPaths[$name] -Raw
  Check ($raw.Length -gt 0) "$name-nonempty"
  Check (@($raw -split '\r?\n' | Where-Object { $_ -match '[ \t]+$' }).Count -eq 0) "$name-no-trailing-whitespace"
}
node -v
NativeExit 'node -v' $LASTEXITCODE
$head = git rev-parse HEAD
NativeExit 'git rev-parse HEAD' $LASTEXITCODE
Check ($head -ceq $s.repoCommit) 'head-unchanged'
$branch = git branch --show-current
NativeExit 'git branch --show-current' $LASTEXITCODE
Check ($branch -ceq 'codex/rcm-p0-builder') 'branch-bound'
$tracked = @(git diff --name-only HEAD --)
NativeExit 'git diff --name-only HEAD --' $LASTEXITCODE
Check ($tracked.Count -eq 0) 'no-tracked-edits'
$untracked = @(git ls-files --others --exclude-standard)
NativeExit 'git ls-files --others --exclude-standard' $LASTEXITCODE
$allowed = @($artifactNames | ForEach-Object {"$g/$_"})
Check ($untracked.Count -eq 4 -and @($untracked | Where-Object {$_ -cnotin $allowed}).Count -eq 0) 'exact-four-evidence-files'
git diff --check
NativeExit 'git diff --check' $LASTEXITCODE
Check $true 'diff-check'
$directive = @(git show '96b6e39:plugins/foreman-line/docs/goals/routing-currency-and-merit/loop-directive.md')
NativeExit 'git show 96b6e39:loop-directive.md' $LASTEXITCODE
$diskDirective = @(Get-Content -LiteralPath $paths['S04'])
Check (($directive -join [char]10) -ceq ($diskDirective -join [char]10)) 'ratified-directive-equals-disk'
Check (($directive -join [char]10).Contains('01a0bf3f-559b-7291-a20e-8d8a4bbb16b3')) 'directive-task-binding'
Check (($directive -join [char]10).Contains('Grant Gate 2 for RCM-P0 and RCM-P1')) 'directive-gate2-phrase'
foreach ($dep in @('node_modules','plugins/foreman-line/shaping/node_modules','plugins/foreman-line/spec-linter/node_modules')) {
  Check (-not (Test-Path -LiteralPath (Join-Path $root $dep))) "$dep-absent"
}

# Rework-record assertions, separate from original observation timestamps.
$envText = Get-Content -LiteralPath $artifactPaths['rcm-p0-environment-map.md'] -Raw
$verificationText = Get-Content -LiteralPath $artifactPaths['rcm-p0-verification.md'] -Raw
$driftText = Get-Content -LiteralPath $artifactPaths['rcm-p0-drift-report.md'] -Raw
foreach ($text in @($envText,$verificationText)) {
  $label = if ($text -ceq $envText) {'environment'} else {'verification'}
  foreach ($required in @('01a0bf3f-559b-7291-a20e-8d8a4bbb16b3','96b6e39d9845f15b52057ffa5e73147fc02ae5e7','Grant Gate 2 for RCM-P0 and RCM-P1','process authorization','no independent human signature')) {
    Check ($text.Contains($required)) "$label-release-$required"
  }
}
Check ($s.verificationProcedure.controlScope -ceq 'evidence-procedure control; not production runtime enforcement') 'procedure-scope'
Check ($s.verificationProcedure.commandRef -ceq 'rcm-p0-verification.md#rw04') 'procedure-command'
Check (($s.verificationProcedure.reworkReadableSourceIds -join ',') -ceq 'S01,S03,S04,S05,S06,S07,S08,S09,S10,S11,S12,S13') 'procedure-exact-readable-roles'
Check (($s.verificationProcedure.retainedHistoricalOnlySourceIds -join ',') -ceq 'S02,S14') 'procedure-exclusions'
Check ($driftText.Contains('escalated-unresolved') -and $driftText.Contains('downstream hold')) 'hawf-hold-retained'
Check ($driftText.Contains('refused/disabled-lane') -and $driftText.Contains('not a claim of runtime disablement')) 'jev-evidence-only'
Check ($verificationText.Contains('C06 original shell exit: **unretained**')) 'lost-exit-disclosed'
Check ($verificationText.Contains('Historical commands below are archived evidence, not the current verification procedure.')) 'unsafe-historical-procedure-retired'

if ($checks.Count -lt 124) { throw "TRIPWIRE: fresh completed checks=$($checks.Count), floor=124" }
[ordered]@{checkedAtUtc=(Get-Date -AsUTC -Format o);completedChecks=$checks.Count;assertions=@($checks);nativeExits=@($native);sourceDigestsRechecked=12;excludedSources=@('S02','S14');scope='repository evidence only; no production/host test'} | ConvertTo-Json -Depth 6

```

## Rework results and final handoff accounting

**Post-edit completed checks through RW06: 192 = RW04 185 + RW06 7.**
The prior-run 124 is preserved as historical evidence, not included in this total.
RW02's separate pre-edit 167 checks established the tripwire before any mutation.
Across all fresh completed batches through RW06: 359 check executions
(167 + 185 + 7), with repeated invariants explicitly counted per batch.
The post-edit total alone exceeds the 124 floor.

RW04 at 2026-09-20T15:51:40.9730704Z: shell **0**; seven native exits **0**.
Its 185 checks comprise 19 incomplete-envelope/host-role checks; 48 checks across
12 approved source roles (uniqueness, digest, length, mtime); 60 exact cited-line
checks; six exact array comparisons; four tier/classification set checks; 11
negative controls; eight artifact checks; eight repository/authority checks;
three dependency-absence checks; and 18 release/procedure/hold-record checks.
All 12 fresh source hashes/lengths/mtimes matched. No S02/S14 or H01–H04 read occurred.

RW05 at 2026-09-20T15:52:10.3222437Z: shell **0**, no native commands;
four artifact byte digests/formats captured. RW06 at
2026-09-20T15:53:06.2895555Z: shell **1 expected**, no native commands,
**7 completed integrity/refusal checks**. It matched three expected artifact
digests, checked verification whitespace, rejected changed snapshot bytes in
memory, and confirmed unratified-freshness and partial-evidence refusals.
The exit 1 is intentional refusal of positive consumption, not a failed assertion.

| Prior rework artifact (pre-NR; BOM corrected by NR00/NR01) | SHA-256 | UTF-8 bytes / BOM / LF |
|---|---|---|
| rcm-p0-drift-report.md | `56183f98db34615d211c8dfffb0f13478356b278f4dd31bee3cd0c096aa9527f` | 12112 / no / 138 |
| rcm-p0-catalog-snapshot.v1.json | `246a37dde67f3bd0663e40afeb739bdfbcab97ee7b669655acbe1d2e893b2917` | 29299 / no / 873 |
| rcm-p0-environment-map.md | `76184324e623b06bffdbf1855b0817ae9623c34f79298862e1d7d24e80571f9f` | 14811 / no / 201 |

All three pre-NR artifacts have zero CRLF and no BOM, verified by NR00/NR01
against these same hashes. These historical hashes remain unchanged; current
sealing is NR05 below. Hash exact bytes without normalization.
RW05's verification digest `8d9a52194d017913e0125f645331362000af4d72594258d728e21e6858d929cf`
describes the pre-results version only and is superseded by RW07's final external
seal. The verification document cannot contain its own final SHA-256.
RW07 below supplies that digest and its exact shell/native exits in the final
tool result and builder handoff; its outcome is not pre-asserted in this file.

Additional effect accounting: RW-W01a rejected the patch before application because
multiple operations targeted the same file; RW-W01b rejected unmatched full-line
context. Neither attempt wrote files or launched a shell. RW-W01c successfully
applied the four-file patch. RW-W02 appends these already-observed results and the
exact final-seal command to verification only. apply_patch results are tool success/
rejection, never fabricated native exit codes. No other writes, commits or merges.

RW01–RW06 have exact shell exits **0, 0, 0, 0, 0, 1 expected**, respectively;
RW-PARSE had no shell. Their 18 native executable exits are all 0:
RW01 two; RW02 seven; RW03 two; RW04 seven; RW05/RW06 none.
Step-0 and historical gaps remain separately disclosed above.

RW07 performs nine final artifact/scope checks after RW-W02; if all complete,
the post-edit total becomes **201 = 185 + 7 + 9**, separately from the pre-edit
167. The actual completed count/exits are emitted externally, not assumed here.
Source-dependent host checks, production tests, lint/self-check and independent
post-rework review remain unexecuted. No full acceptance or downstream release.

### RW05, RW06 and RW07 exact command construction

Each command is the exact RW04 prefix from `$ErrorActionPreference = 'Stop'`
through the closing brace of the `foreach ($b in $artifactBindings)` block,
ending immediately before `$s = Get-Content -LiteralPath`, followed by the
corresponding exact suffix below. The prefix fixes the repository root, functions,
approved role table and four artifact paths; it does not read source content.
This is textual concatenation of retained command text, not execution of all
RW04 assertions. No script file is created.

#### RW05 suffix (BOM predicate corrected; historical result not rerun)

```powershell

$records = @()
foreach ($name in $artifactNames) {
  $path = $artifactPaths[$name]
  $bytes = [IO.File]::ReadAllBytes($path)
  $raw = [Text.UTF8Encoding]::new($false,$true).GetString($bytes)
  $records += [ordered]@{name=$name;sha256=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant();bytes=$bytes.Length;bom=$raw.StartsWith([string][char]0xfeff,[StringComparison]::Ordinal);crlfCount=[regex]::Matches($raw,"\r\n").Count;bareLfCount=[regex]::Matches($raw,"(?<!\r)\n").Count}
}
[ordered]@{observedAtUtc=(Get-Date -AsUTC -Format o);artifacts=$records;nativeExits=@();scope='safe artifact byte seal only'} | ConvertTo-Json -Depth 5

```

#### RW06 suffix

```powershell

$expected = @{
  'rcm-p0-drift-report.md'='56183f98db34615d211c8dfffb0f13478356b278f4dd31bee3cd0c096aa9527f'
  'rcm-p0-catalog-snapshot.v1.json'='246a37dde67f3bd0663e40afeb739bdfbcab97ee7b669655acbe1d2e893b2917'
  'rcm-p0-environment-map.md'='76184324e623b06bffdbf1855b0817ae9623c34f79298862e1d7d24e80571f9f'
}

foreach ($name in $expected.Keys) {
  Check ((Get-FileHash -LiteralPath $artifactPaths[$name] -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $expected[$name]) "$name-exact-expected-digest"
}
$raw = Get-Content -LiteralPath $artifactPaths['rcm-p0-verification.md'] -Raw
Check (@($raw -split '\r?\n' | Where-Object {$_ -match '[ \t]+$'}).Count -eq 0) 'verification-no-trailing-whitespace'
$bytes = [IO.File]::ReadAllBytes($artifactPaths['rcm-p0-catalog-snapshot.v1.json'])
$copy = [byte[]]$bytes.Clone()
$copy[0] = $copy[0] -bxor 1
$changedHash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($copy)).ToLowerInvariant()
Check ($changedHash -cne $expected['rcm-p0-catalog-snapshot.v1.json']) 'changed-byte-DIGEST_MISMATCH_REFUSED'
$s = Get-Content -LiteralPath $artifactPaths['rcm-p0-catalog-snapshot.v1.json'] -Raw | ConvertFrom-Json -DateKind String
Check ($null -eq $s.freshness.maxAgeSeconds -and $s.freshness.verdict -ceq 'refused') 'FRESHNESS_BOUND_UNRATIFIED_REFUSED'
Check ($s.complete -eq $false -and @($s.incompleteReasons).Count -gt 0) 'PARTIAL_REFUSED'
[ordered]@{verifiedAtUtc=(Get-Date -AsUTC -Format o);completedChecks=$checks.Count;checks=@($checks);nativeExits=@();evidenceConsumptionExit=1;meaning='seven checks completed; positive evidence consumption intentionally refused'} | ConvertTo-Json -Depth 4
exit 1

```

#### RW07 suffix — final seal, result external

```powershell

$expected = @{
  'rcm-p0-drift-report.md'='56183f98db34615d211c8dfffb0f13478356b278f4dd31bee3cd0c096aa9527f'
  'rcm-p0-catalog-snapshot.v1.json'='246a37dde67f3bd0663e40afeb739bdfbcab97ee7b669655acbe1d2e893b2917'
  'rcm-p0-environment-map.md'='76184324e623b06bffdbf1855b0817ae9623c34f79298862e1d7d24e80571f9f'
}

foreach ($name in $expected.Keys) {
  Check ((Get-FileHash -LiteralPath $artifactPaths[$name] -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $expected[$name]) "$name-final-digest"
}
foreach ($name in $artifactNames) {
  $raw = Get-Content -LiteralPath $artifactPaths[$name] -Raw
  Check (@($raw -split '\r?\n' | Where-Object {$_ -match '[ \t]+$'}).Count -eq 0) "$name-final-whitespace"
}
$head=git rev-parse HEAD
NativeExit 'git rev-parse HEAD' $LASTEXITCODE
Check ($head -ceq '1ec2b1012d5290851e924cc91137ec3f09122820') 'final-head-no-commit'
$tracked=@(git diff --name-only HEAD --)
NativeExit 'git diff --name-only HEAD --' $LASTEXITCODE
$untracked=@(git ls-files --others --exclude-standard)
NativeExit 'git ls-files --others --exclude-standard' $LASTEXITCODE
$allowed=@($artifactNames | ForEach-Object {"$g/$_"})
Check ($tracked.Count -eq 0 -and $untracked.Count -eq 4 -and @($untracked | Where-Object {$_ -cnotin $allowed}).Count -eq 0) 'final-four-file-scope'
git diff --check
NativeExit 'git diff --check' $LASTEXITCODE
$seal=@()
foreach ($name in $artifactNames) {
  $seal += [ordered]@{path="$g/$name";sha256=(Get-FileHash -LiteralPath $artifactPaths[$name] -Algorithm SHA256).Hash.ToLowerInvariant()}
}
[ordered]@{sealedAtUtc=(Get-Date -AsUTC -Format o);completedChecks=$checks.Count;postEditCompletedTotal=(185+7+$checks.Count);checks=@($checks);nativeExits=@($native);artifacts=$seal;head=$head;changedPaths=$untracked} | ConvertTo-Json -Depth 5

```

Unresolved holds: safe host-source/approved endpoint binding; all F1–F6 host
measurements; installed parity; accepted TTL and host timestamps; HAWF ownership
reconciliation/downstream hold; Jev lane; compatible preinstalled shaping/lint
tooling; post-rework adversarial review and coordinator acceptance.

## Retained initial-delivery history

Historical commands below are archived evidence, not the current verification procedure.
Do not execute C01–C13 from this archive for rework: C06–C12 trust a locator-derived
path and some commands access sources excluded by the current coordinator limits.
Their failures, counts and historical digests are preserved for audit. The BOM
predicates in the archived command excerpts have been corrected to ordinal
comparison during NR-W01; they are no longer verbatim executed command text.
The original predicates used the culture-sensitive one-argument StartsWith for
U+FEFF. This annotation preserves the defect, not a claim that corrected excerpts
produced the historical results. Code fences remain text. Current source
verification is RW04 above; current byte controls/sealing are NR01/NR05 below. The initial
record's pending-review/authorization wording and artifact hashes describe that
initial delivery; the R1/R2 binding and current rework results supersede it.

This is a builder evidence-delivery claim under coordinator ruling R1, not a claim
that all ACs passed. F1-F6 host findings are blocked-secret-boundary. No runtime
implementation, live catalog proof, dispatch permission or host correction is delivered.
R1 is recorded in the environment map; immutable message/time binding remains with
the coordinator. Two fresh frontier reviews (one security-focused) are coordinator-routed
after this claim and are **pending, 0 completed by this builder**.

## AC-by-AC disposition

| AC | Evidence | Disposition |
|---|---|---|
| AC1 provenance | Snapshot sourceRefs S01-S14 carry exact repo paths, per-source UTC time, safe byte SHA-256, metadata, field/line coverage and procedure C04; C05 reacquires; C10 rechecks. Drift references exact source lines. | Repository evidence supported; host provenance blocked. R1 exact message timestamp/ID not exposed; C06 exit not retained. Not a complete provenance pass. |
| AC2 F1-F6 | Drift table supplies historical hypothesis, repository measurements/calculation, comparison, blocked verdict and next owner for all six. F6 lists every policy-tier ID. | All six host verdicts blocked. No historical host fact credited by quotation; no runtime closure or invalidated locked decision claimed. |
| AC3 exact identity | Snapshot repositoryFacts.catalogJoin has 15 required IDs, unknown match/absence/duplicate/mismatch counts; H04 approved host endpoint unbound. | Positive joins refused. Case-sensitive policy set derivation is verified; live tuple resolution/negative identity cases remain blocked. |
| AC4 ownership | S06:12,50-52; S07:6; S08:5,10; R1 clause 4; drift HAWF section and hashes. | Reporting satisfied as escalated-unresolved. Downstream hold remains; no INDEX edit or HAWF ownership taken. |
| AC5 F4/Jev | Drift F4 and Jev section; S09:29,58,68-69; R1 clause 5. | Exact contractual tuple and recommend-only boundary recorded; refused/disabled-lane evidence. Enabled/default inventory blocked; no runtime disable or substitution claimed. |
| AC6 snapshot | recordVersion 1; recon-evidence-only; complete false; named missing reasons; H01-H04 unbound; null ages/accepted TTL; proposed 86400. C11 checks expected digest and refused consumption. | Incomplete evidence record delivered; freshness and positive consumption refused. Empty arrays mean unobserved, not no models. |
| AC7 safety | R1 scope; source manifest; command/effect log; C10/C12 allowed-path checks. | Only four evidence files authorized; no host acquisition, credential read/hash, network, dispatch, installation or control-file mutation. No host stability proof asserted. |
| AC8 independent verification | C05 separate source reacquisition; C10 document checks; C11 digest/refusal checks; C12 scope audit; versions and exact commands below. | Partial. Lint/self-check not run; one shell exit unretained; host-dependent negative cases blocked; two independent frontier reviews and coordinator acceptance pending. |

## Scope, effects and source stability

All commands run from the assigned isolated worktree, represented as REPO_ROOT to
avoid publishing identifying host paths. Its exact binding stays in the coordinator's
assignment. Initial HEAD: 1ec2b1012d5290851e924cc91137ec3f09122820,
branch codex/rcm-p0-builder. Step 0 and C01 found no dirty/untracked files; all four
evidence files were initially absent. Authority-baseline diff contained the parcel
spec only; no branch/commit action was taken.

Only apply_patch writes occurred: W01 created drift report, snapshot and environment
map; W02 created this verification record; W03 recorded the final audit result in
this same file. No other file, control, schema, source, test, dependency, receipt,
installed plugin or host configuration was written. Shell commands are read-only
except in-memory calculations. No evaluator/dispatch import or function invocation,
network request, Pi launch, provider spend, watcher, automation, commit or merge.

No host paths or metadata were guessed/read. Host source stability is unknown.
Repository source hashes and metadata matched at C05 and again C10; complete
commands/effects accompany this evidence because stable timestamps alone prove little.

Repository-source formats are retained in the snapshot. The former C10 artifact
claim of UTF-8 with BOM and the C08/C09 diagnosis attributing failures to actual
BOM bytes were unsupported/misdiagnosed. The retained observations are C08's
combined LF/no-BOM assertion failure and C09's isolated no-BOM assertion failure,
both shell exit 1 before native audits. A culture-sensitive StartsWith result
cannot establish a byte prefix. C10's format label and the earlier line-ending
explanation do not establish the cause of those historical failures. Historical
artifact bytes have not been reacquired; their BOM status is not reconstructed.
NR00/NR01 independently establish that all four pre-NR artifacts are strict UTF-8
without BOM, LF, zero CRLF; the old predicate reports true on those no-BOM bytes.
Hash exact bytes without normalization. No encoding conversion was performed.

## Command and verification counts

Execution-phase ledger is C01-C13; prior Step-0 inventory is separate.
Through C11: **11 PowerShell invocations: 6 exit 0, 4 exit 1, 1 shell exit unretained**.
C12 final audit and C13 seal are specified below; results are recorded at the end
and in the final handoff respectively. Do not count unexecuted commands as passes.

C06 failed in the tool-output wrapper: it attempted JSON.parse on an Exception
result before preserving the tool result. The shell exit is **unretained**, not 0
and not asserted to be 1. C07 repeats the exact command and reports exit 1 at
S01-metadata. PowerShell ConvertFrom-Json automatically parsed timestamps, making
a string comparison fail. C08 adds -DateKind String and passes that comparison.
C08 exits 1 on the combined LF/no-BOM assertion; C09 exits 1 after isolating
the no-BOM check. Their BOM diagnosis is unsupported/misdiagnosed, as explained
above. C10 completed 79 assertions, but its culture-sensitive BOM output was not
byte evidence. The recorded failures/counts remain; no historical rerun or host
source change is inferred.

- C05: 14 source-digest comparisons passed; independent repository policy scan.
- C10: **79 document/repository assertions passed**, exit 0; 14 source digests,
  lengths and metadata matched; 15 exact tier line/ID checks; classification sets;
  blocked envelope checks; encoding/whitespace and allowed-path checks.
- C11: **6 integrity/refusal checks passed**, shell exit **1 expected**:
  three expected artifact digest comparisons, one in-memory changed-byte digest
  refusal, unratified freshness-bound refusal, and partial-evidence refusal.
- Repository test suites: **0 run**. Self-check: **0 run, no exit**.
  Spec-linter: **0 run, no exit**. Reviews: **0 completed**, pending coordinator.
- Native executable exits through C11: **8**, all **0**:
  C01 node/head/status (3), C03 git/rg version (2), C10 tracked/untracked/diff (3).
  C06-C09 fail before their native audit commands.

Runtime: Node v24.7.0; PowerShell 7.6.6; Git 2.45.2.windows.1; ripgrep 14.1.0.
S12:8 requires Node >=24.11.1; S13:8 requires >=22; three checked node_modules
directories are absent. No dependencies installed or out-of-worktree tooling searched.
Coordinator lint remains authoritative. Spec status stays draft.

## Negative/refusal coverage

These are evidence decisions, not implemented production errors or a runtime test suite.

| Case | Evidence / outcome |
|---|---|
| Actual incomplete snapshot | C11 exits 1 with PARTIAL_REFUSED; missing sources are not replaced by raw cache/settings/network/old snapshot. |
| Actual unratified bound / missing required times | C11 confirms FRESHNESS_BOUND_UNRATIFIED_REFUSED at the fixed snapshot evaluation time; accepted bound/age remain null. |
| Changed exact snapshot bytes | C11 flips one byte of an in-memory clone only; SHA-256 differs from the recorded expected digest; DIGEST_MISMATCH_REFUSED. Disk bytes unchanged. |
| Missing provider/model, partial provider set | Actual source unavailable; refusal documented, but no acquired catalog exists to mutate or distinguish missing records from incomplete coverage. Detailed model-level cases blocked. |
| Duplicate key / same ID under another provider / ambiguous unqualified ID | Blocked: no safe live tuples. No fictional host facts or production resolver claimed. |
| Endpoint trailing slash / different path / wrong provider / alias | Blocked: approved configuration and observed identities unavailable; exact comparisons required, no normalization permitted. |
| Stale/future provider timestamp | Blocked: no accepted TTL or required host timestamps. No synthetic timestamp result is passed off as current evidence. |
| Missing thinking map | Blocked host coverage; mark unknown, never invent capability. Optional missing capability facts are not automatically false or fabricated. |
| Unknown price units / zero denominator | Current comparison refused; only historical nonzero-denominator arithmetic computed (23.076923% / 11.111111%). |

## Artifact hashes

The three completed artifacts were hashed in C10 and compared with their recorded
expected values by C11. Any serialization edit invalidates the expected snapshot hash.
This document does not carry a self-hash; its final exact digest is emitted externally
by C13 and in the final completion handoff.

| File | SHA-256 | Exact bytes / BOM / LF |
|---|---|---|
| rcm-p0-drift-report.md | `a059e78399edf3cc431ecc76d7c90224333f1d93b0bbacb8c143d0fdd7eb8b9f` | 10853 / unsupported / 117 |
| rcm-p0-catalog-snapshot.v1.json | `3991ad80a34c1c861d06c4732b488b742e858ee64a79fc2f974a9b1d06ecdab6` | 27758 / unsupported / 833 |
| rcm-p0-environment-map.md | `6d56c156846e554ea7826ed6565bb453afc1604002516878c3be2dc40ad87e0f` | 9507 / unsupported / 120 |

Source digest references are snapshot S01-S14 and environment-map source table;
safe host digest references are null because no safe acquisition occurred.

## Exact command ledger

PowerShell scripts below are in-memory invocations, not new executable files.
All are run with the assigned worktree as working directory. No shell write is used.
C01's display was truncated; no truncated section is used as exclusive proof:
policy/directive/amendments were reacquired in C02, relevant line references in C03,
source bytes in C04/C05, and assertions in C10. C01 shell exit and native exits were 0.

| ID | Result |
|---|---|
| C01 | 0; UTC, Node, HEAD, clean status; initial repository read display truncated |
| C02 | 0; numbered policy/directive/amendments and evaluator selection/effect references |
| C03 | 0; source-line references, dependency absence, versions |
| C04 | 0; 14 safe source digests/formats, policy sets, historical arithmetic |
| C05 | 0; 14 independent hash matches and independent section-based policy scan |
| C06 | shell exit unretained; output-wrapper JSON parse failed on Exception output |
| C07 | 1; identical C06 repeat, S01-metadata timestamp representation assertion |
| C08 | 1; timestamp representation fixed, combined LF/no-BOM assertion fails |
| C09 | 1; isolated no-BOM assertion fails |
| C10 | 0; 79 checks pass; BOM output unsupported (culture-sensitive predicate) |
| C11 | 1 expected; six checks, partial snapshot refused |
| C12 | 0; 25 final scope/source/whitespace checks pass; four native exits 0 |
| C13 | Final read-only seal after W03; result and self-hash in external final handoff |

### C01

```text
$ErrorActionPreference = 'Stop'
Get-Date -AsUTC -Format o
node -v
Write-Output "node_exit=$LASTEXITCODE"
git rev-parse HEAD
Write-Output "head_exit=$LASTEXITCODE"
git status --short --untracked-files=all
Write-Output "status_exit=$LASTEXITCODE"
Get-Content -LiteralPath 'plugins/foreman-line/docs/goals/routing-currency-and-merit/charter.md','plugins/foreman-line/docs/goals/routing-currency-and-merit/loop-directive.md','plugins/foreman-line/routing-policy/routing-policy.yaml','plugins/foreman-line/dispatch/src/routing-eval/index.ts' -Raw
```

### C02

```text
$ErrorActionPreference = 'Stop'
$paths = @('plugins/foreman-line/routing-policy/routing-policy.yaml','plugins/foreman-line/docs/goals/routing-currency-and-merit/loop-directive.md','plugins/foreman-line/docs/goals/routing-currency-and-merit/gate-1-reopen-proposal.md')
foreach ($path in $paths) { Write-Output "SOURCE $path"; $line = 0; Get-Content -LiteralPath $path | ForEach-Object { $line++; '{0}:{1}' -f $line,$_ } }
$evalPath = 'plugins/foreman-line/dispatch/src/routing-eval/index.ts'
Select-String -LiteralPath $evalPath -Pattern 'readonly routing_class','readonly data_classification','readonly workflowId','readFileSync\(join','eligible =','for \(const tier','for \(const model','eligible.has','mkdirSync\(receiptDir','writeFileSync\(join' | ForEach-Object { '{0}:{1}:{2}' -f $evalPath,$_.LineNumber,$_.Line }
```

### C03

```text
$ErrorActionPreference = 'Stop'
$queries = @(
@{ Path='plugins/foreman-line/docs/goals/routing-currency-and-merit/charter.md'; Pattern='Provenance caveat|F[1-6] \||daily|Daily|OQ7|jev|608|341|contextWindow|thinkingLevelMap|defaultThinkingLevel' },
@{ Path='plugins/foreman-line/docs/goals/INDEX.md'; Pattern='authoritative|heterogeneous-agent-worker-fabric|conflict|stop|goal-local' },
@{ Path='plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/charter.md'; Pattern='Status:|SUPERSEDED|not dispatchable' },
@{ Path='plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/loop-directive.md'; Pattern='Queue owner|State:|ownership|Claim ownership' },
@{ Path='plugins/foreman-line/docs/goals/foreman-line-boundary-routing/charter.md'; Pattern='D10|jev|openrouter.ai/api/v1|recommend|classification|D7|D8' },
@{ Path='plugins/foreman-line/dispatch/src/approval-cli/index.ts'; Pattern='evaluateRouting|prepareDispatch|executeDispatch|pluginRoot' },
@{ Path='plugins/foreman-line/shaping/package.json'; Pattern='node|ajv|tsx' },
@{ Path='plugins/foreman-line/spec-linter/package.json'; Pattern='node|ajv|yaml|tsx' }
)
foreach ($q in $queries) { Select-String -LiteralPath $q.Path -Pattern $q.Pattern | ForEach-Object { '{0}:{1}:{2}' -f $q.Path,$_.LineNumber,$_.Line } }
foreach ($path in @('node_modules','plugins/foreman-line/shaping/node_modules','plugins/foreman-line/spec-linter/node_modules')) { Write-Output "$path exists=$(Test-Path -LiteralPath $path)" }
Write-Output "powershell=$($PSVersionTable.PSVersion)"
git --version
Write-Output "git_version_exit=$LASTEXITCODE"
rg --version
Write-Output "rg_version_exit=$LASTEXITCODE"
```

### C04

```text
$ErrorActionPreference = 'Stop'
$paths = @('plugins/foreman-line/routing-policy/routing-policy.yaml','plugins/foreman-line/dispatch/src/routing-eval/index.ts','plugins/foreman-line/docs/goals/routing-currency-and-merit/charter.md','plugins/foreman-line/docs/goals/routing-currency-and-merit/loop-directive.md','plugins/foreman-line/docs/goals/routing-currency-and-merit/gate-1-reopen-proposal.md','plugins/foreman-line/docs/goals/INDEX.md','plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/charter.md','plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/loop-directive.md','plugins/foreman-line/docs/goals/foreman-line-boundary-routing/charter.md','plugins/foreman-line/docs/specs/active/RCM-P0-current-instance-recon.md','plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md','plugins/foreman-line/shaping/package.json','plugins/foreman-line/spec-linter/package.json','plugins/foreman-line/dispatch/src/approval-cli/index.ts')
$records = @()
$sourceNumber = 0
foreach ($path in $paths) {
  $sourceNumber++
  $bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path $path))
  $raw = [System.Text.UTF8Encoding]::new($false,$true).GetString($bytes)
  $item = Get-Item -LiteralPath $path
  $records += [ordered]@{ id=('S{0:d2}' -f $sourceNumber); path=$path; acquiredAtUtc=(Get-Date -AsUTC -Format o); sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant(); length=$bytes.Length; lastWriteTimeUtc=$item.LastWriteTimeUtc.ToString('o'); encoding='UTF-8'; bom=($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191); crlfCount=[regex]::Matches($raw,"\r\n").Count; bareLfCount=[regex]::Matches($raw,"(?<!\r)\n").Count }
}
$policyLines = @(Get-Content -LiteralPath $paths[0])
$sets = [ordered]@{}
foreach ($range in @(@{Name='frontier';Start=162;End=170},@{Name='standard';Start=171;End=181},@{Name='economy';Start=182;End=194},@{Name='public';Start=67;End=91},@{Name='internal';Start=92;End=114},@{Name='restricted';Start=115;End=137})) {
  $ids = @()
  for ($i=$range.Start-1; $i -lt $range.End; $i++) { if ($policyLines[$i] -match '^\s+- ([^ #]+)') { $ids += $Matches[1] } }
  $sets[$range.Name] = $ids
}
$tierIds = @($sets.frontier) + @($sets.standard) + @($sets.economy)
$unique = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
foreach ($id in $tierIds) { [void]$unique.Add($id) }
$extras = [ordered]@{}
foreach ($name in @('public','internal','restricted')) { $extras[$name] = @($sets[$name] | Where-Object { -not $unique.Contains($_) }) }
[ordered]@{ observedAtUtc=(Get-Date -AsUTC -Format o); sources=$records; policySets=$sets; distinctTierCount=$unique.Count; tierEntryCount=$tierIds.Count; tierDuplicateCount=($tierIds.Count-$unique.Count); classificationOutsideTiers=$extras; historicalArithmeticOnly=@([decimal]::Round(((0.08d-0.065d)/0.065d*100),6),[decimal]::Round(((0.20d-0.18d)/0.18d*100),6)) } | ConvertTo-Json -Depth 8
```

### C05

```text
$ErrorActionPreference = 'Stop'
$expected = @{
  'plugins/foreman-line/routing-policy/routing-policy.yaml'='578f7a8a3a4384bf5f3e0064cb0439032e068a9e869bbf42770714e1466bebb0'
  'plugins/foreman-line/dispatch/src/routing-eval/index.ts'='6b754fc0b2bb535198141dd18bb25aefb360ddb1d3ab436c5cbd41f556bec23f'
  'plugins/foreman-line/docs/goals/routing-currency-and-merit/charter.md'='93c536582fc893ba57c08859799d8fa72ef49866f51a639b521f1d6208965a79'
  'plugins/foreman-line/docs/goals/routing-currency-and-merit/loop-directive.md'='5ed29906d77105eb3a5b05cc9b7cbe00f102930208d93cd7ff44cb06b1c057dc'
  'plugins/foreman-line/docs/goals/routing-currency-and-merit/gate-1-reopen-proposal.md'='c661823fef414f83fa716fb52fb78061d5ece0613d159f484e2fb4e70d5621af'
  'plugins/foreman-line/docs/goals/INDEX.md'='d10de5af1553d2405860e2ab3efa242279fa422c72fd8dba102aba404aeb1e30'
  'plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/charter.md'='6f9cd2a813dd69b1ec061df06db34e2bfb5098156643088c344de92a10900253'
  'plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/loop-directive.md'='508fb3206520a5f4161f7f1e5076009fb56d420d1daeae924dacd75e489b4b51'
  'plugins/foreman-line/docs/goals/foreman-line-boundary-routing/charter.md'='b02460686c89453cb4ca812127384d9723db6c67935f5442340dd9ea416aa567'
  'plugins/foreman-line/docs/specs/active/RCM-P0-current-instance-recon.md'='20f2f6f26f32d51ef085abbfd2b30e9357c177eb5180cff04104ba21d1cf53d0'
  'plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md'='57e345f9294cb8fcd8c3d90325505c80903648f60522f820061a5f8f288a86ac'
  'plugins/foreman-line/shaping/package.json'='6b34e93b94db565e625393c5cd2e9c6e131e30dc649d87937e61bb69b925f569'
  'plugins/foreman-line/spec-linter/package.json'='6247ddaad5d93dcd1fd2fbeff98cf34a9885ca7228b10b542882cf51e6711aff'
  'plugins/foreman-line/dispatch/src/approval-cli/index.ts'='1eceee9253163c829bc80fd5e96f1f3810a672e2871a436f04a48eb0b876281d'
}
$verified = @()
foreach ($path in $expected.Keys | Sort-Object) {
  $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
  if ($actual -cne $expected[$path]) { throw "SOURCE_CHANGED: $path" }
  $item = Get-Item -LiteralPath $path
  $verified += [ordered]@{ path=$path; sha256=$actual; length=$item.Length; lastWriteTimeUtc=$item.LastWriteTimeUtc.ToString('o') }
}
$policyPath = 'plugins/foreman-line/routing-policy/routing-policy.yaml'
$lines = @(Get-Content -LiteralPath $policyPath)
$section = ''
$subsection = ''
$groups = [ordered]@{}
for ($i=0; $i -lt $lines.Count; $i++) {
  $line = $lines[$i]
  if ($line -cmatch '^([a-z_]+):') { $section=$Matches[1]; $subsection='' }
  elseif ($line -cmatch '^  ([a-z]+):' -and $section -cin @('model_tiers','data_classification')) { $subsection=$Matches[1]; $groups["$section.$subsection"]=@() }
  elseif ($line -cmatch '^\s+- ([^ #]+)' -and $subsection -cne '' -and $section -cin @('model_tiers','data_classification')) { $groups["$section.$subsection"] += [ordered]@{id=$Matches[1]; line=($i+1)} }
}
[ordered]@{ verifiedAtUtc=(Get-Date -AsUTC -Format o); sourceDigestMatches=$verified.Count; sources=$verified; independentPolicyGroups=$groups; endState='repo sources re-read; host source stability unavailable' } | ConvertTo-Json -Depth 8
```

### C06

```text
$ErrorActionPreference = 'Stop'
$g = 'plugins/foreman-line/docs/goals/routing-currency-and-merit'
$names = @('rcm-p0-drift-report.md','rcm-p0-catalog-snapshot.v1.json','rcm-p0-environment-map.md')
$checks = [System.Collections.Generic.List[string]]::new()
function Assert-Evidence([bool]$Condition,[string]$Name) { if (-not $Condition) { throw "CHECK_FAILED: $Name" }; $checks.Add($Name) }
$s = Get-Content -LiteralPath "$g/rcm-p0-catalog-snapshot.v1.json" -Raw | ConvertFrom-Json
Assert-Evidence ($s.recordVersion -eq 1 -and $s.purpose -ceq 'recon-evidence-only') 'format'
Assert-Evidence ($s.repoCommit -ceq '1ec2b1012d5290851e924cc91137ec3f09122820') 'spec-commit'
Assert-Evidence ($s.complete -eq $false -and $s.incompleteReasons -ccontains 'blocked-secret-boundary') 'explicit-incomplete-boundary'
Assert-Evidence (@($s.providers).Count -eq 0 -and @($s.models).Count -eq 0 -and $null -eq $s.coverage.modelCount) 'no-invented-host-records'
Assert-Evidence ($null -eq $s.settingsFacts.facts -and $s.settingsFacts.sourceRef -ceq 'H03') 'settings-unobserved'
Assert-Evidence ($null -eq $s.freshness.maxAgeSeconds -and $s.freshness.proposedMaxAgeSeconds -eq 86400 -and $s.freshness.verdict -ceq 'refused') 'ttl-unratified'
Assert-Evidence ($null -eq $s.freshness.computedAgeSeconds -and $null -eq $s.freshness.oldestRequiredSourceOrProviderFactTimeUtc) 'age-unknown'
Assert-Evidence (@($s.sourceRefs | Where-Object id -Like 'H*').Count -eq 4) 'four-unbound-host-roles'
Assert-Evidence (@($s.sourceRefs | Where-Object { $_.id -like 'H*' -and ($null -ne $_.safeProjectionSha256 -or $_.status -cne 'blocked-secret-boundary') }).Count -eq 0) 'no-host-digests'
Assert-Evidence ($s.policySha256 -ceq '578f7a8a3a4384bf5f3e0064cb0439032e068a9e869bbf42770714e1466bebb0') 'policy-binding'
foreach ($source in @($s.sourceRefs | Where-Object id -Like 'S*')) {
  $path = $source.safeLocator.Substring(5)
  $item = Get-Item -LiteralPath $path
  Assert-Evidence ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $source.safeProjectionSha256) "$($source.id)-digest"
  Assert-Evidence ($item.Length -eq $source.byteFormat.length) "$($source.id)-length"
  Assert-Evidence ($item.LastWriteTimeUtc.ToString('o') -ceq $source.sourceStability.lastWriteTimeUtc) "$($source.id)-metadata"
}
$policyLines = @(Get-Content -LiteralPath 'plugins/foreman-line/routing-policy/routing-policy.yaml')
$tierIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
foreach ($tier in @('frontier','standard','economy')) {
  foreach ($row in $s.repositoryFacts.tiers.$tier) {
    $match = [regex]::Match($policyLines[$row.line-1],'^\s+- ([^ #]+)')
    Assert-Evidence ($match.Success -and $match.Groups[1].Value -ceq $row.id) "tier-$tier-line-$($row.line)"
    [void]$tierIds.Add($row.id)
  }
}
Assert-Evidence ($tierIds.Count -eq 15) '15-distinct-tier-ids'
foreach ($classification in @('public','internal','restricted')) {
  $rows = @($s.repositoryFacts.classificationIds.$classification)
  $classIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
  foreach ($row in $rows) { [void]$classIds.Add($row.id) }
  Assert-Evidence ($rows.Count -eq 15 -and $classIds.Count -eq 15 -and $classIds.SetEquals($tierIds)) "$classification-exact-policy-set"
}
$hashes = @()
foreach ($name in $names) {
  $path = "$g/$name"
  $bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path $path))
  $raw = [System.Text.UTF8Encoding]::new($false,$true).GetString($bytes)
  Assert-Evidence (-not $raw.Contains("`r") -and -not $raw.StartsWith([string][char]0xfeff,[StringComparison]::Ordinal)) "$name-utf8-lf-no-bom"
  Assert-Evidence (@($raw -split "`n" | Where-Object { $_ -match '[ \t]+$' }).Count -eq 0) "$name-no-trailing-whitespace"
  $hashes += [ordered]@{name=$name; sha256=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant(); bytes=$bytes.Length}
}
$tracked = @(git diff --name-only HEAD --)
$trackedExit = $LASTEXITCODE
if ($trackedExit -ne 0) { throw 'git tracked audit failed' }
Assert-Evidence ($tracked.Count -eq 0) 'no-tracked-file-changes'
$untracked = @(git ls-files --others --exclude-standard)
$untrackedExit = $LASTEXITCODE
if ($untrackedExit -ne 0) { throw 'git untracked audit failed' }
$allowed = @($names | ForEach-Object { "$g/$_" })
Assert-Evidence ($untracked.Count -eq 3 -and @($untracked | Where-Object { $_ -cnotin $allowed }).Count -eq 0) 'only-three-created-artifacts-before-verification-record'
git diff --check
$diffExit = $LASTEXITCODE
if ($diffExit -ne 0) { throw 'git diff check failed' }
[ordered]@{verifiedAtUtc=(Get-Date -AsUTC -Format o); assertionCount=$checks.Count; assertions=@($checks); artifactHashes=$hashes; nativeExits=@{tracked=$trackedExit;untracked=$untrackedExit;diffCheck=$diffExit}; sourceRechecks=14; scope='repository/document checks only; no production test suite'} | ConvertTo-Json -Depth 5
```

### C07

```text
$ErrorActionPreference = 'Stop'
$g = 'plugins/foreman-line/docs/goals/routing-currency-and-merit'
$names = @('rcm-p0-drift-report.md','rcm-p0-catalog-snapshot.v1.json','rcm-p0-environment-map.md')
$checks = [System.Collections.Generic.List[string]]::new()
function Assert-Evidence([bool]$Condition,[string]$Name) { if (-not $Condition) { throw "CHECK_FAILED: $Name" }; $checks.Add($Name) }
$s = Get-Content -LiteralPath "$g/rcm-p0-catalog-snapshot.v1.json" -Raw | ConvertFrom-Json
Assert-Evidence ($s.recordVersion -eq 1 -and $s.purpose -ceq 'recon-evidence-only') 'format'
Assert-Evidence ($s.repoCommit -ceq '1ec2b1012d5290851e924cc91137ec3f09122820') 'spec-commit'
Assert-Evidence ($s.complete -eq $false -and $s.incompleteReasons -ccontains 'blocked-secret-boundary') 'explicit-incomplete-boundary'
Assert-Evidence (@($s.providers).Count -eq 0 -and @($s.models).Count -eq 0 -and $null -eq $s.coverage.modelCount) 'no-invented-host-records'
Assert-Evidence ($null -eq $s.settingsFacts.facts -and $s.settingsFacts.sourceRef -ceq 'H03') 'settings-unobserved'
Assert-Evidence ($null -eq $s.freshness.maxAgeSeconds -and $s.freshness.proposedMaxAgeSeconds -eq 86400 -and $s.freshness.verdict -ceq 'refused') 'ttl-unratified'
Assert-Evidence ($null -eq $s.freshness.computedAgeSeconds -and $null -eq $s.freshness.oldestRequiredSourceOrProviderFactTimeUtc) 'age-unknown'
Assert-Evidence (@($s.sourceRefs | Where-Object id -Like 'H*').Count -eq 4) 'four-unbound-host-roles'
Assert-Evidence (@($s.sourceRefs | Where-Object { $_.id -like 'H*' -and ($null -ne $_.safeProjectionSha256 -or $_.status -cne 'blocked-secret-boundary') }).Count -eq 0) 'no-host-digests'
Assert-Evidence ($s.policySha256 -ceq '578f7a8a3a4384bf5f3e0064cb0439032e068a9e869bbf42770714e1466bebb0') 'policy-binding'
foreach ($source in @($s.sourceRefs | Where-Object id -Like 'S*')) {
  $path = $source.safeLocator.Substring(5)
  $item = Get-Item -LiteralPath $path
  Assert-Evidence ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $source.safeProjectionSha256) "$($source.id)-digest"
  Assert-Evidence ($item.Length -eq $source.byteFormat.length) "$($source.id)-length"
  Assert-Evidence ($item.LastWriteTimeUtc.ToString('o') -ceq $source.sourceStability.lastWriteTimeUtc) "$($source.id)-metadata"
}
$policyLines = @(Get-Content -LiteralPath 'plugins/foreman-line/routing-policy/routing-policy.yaml')
$tierIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
foreach ($tier in @('frontier','standard','economy')) {
  foreach ($row in $s.repositoryFacts.tiers.$tier) {
    $match = [regex]::Match($policyLines[$row.line-1],'^\s+- ([^ #]+)')
    Assert-Evidence ($match.Success -and $match.Groups[1].Value -ceq $row.id) "tier-$tier-line-$($row.line)"
    [void]$tierIds.Add($row.id)
  }
}
Assert-Evidence ($tierIds.Count -eq 15) '15-distinct-tier-ids'
foreach ($classification in @('public','internal','restricted')) {
  $rows = @($s.repositoryFacts.classificationIds.$classification)
  $classIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
  foreach ($row in $rows) { [void]$classIds.Add($row.id) }
  Assert-Evidence ($rows.Count -eq 15 -and $classIds.Count -eq 15 -and $classIds.SetEquals($tierIds)) "$classification-exact-policy-set"
}
$hashes = @()
foreach ($name in $names) {
  $path = "$g/$name"
  $bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path $path))
  $raw = [System.Text.UTF8Encoding]::new($false,$true).GetString($bytes)
  Assert-Evidence (-not $raw.Contains("`r") -and -not $raw.StartsWith([string][char]0xfeff,[StringComparison]::Ordinal)) "$name-utf8-lf-no-bom"
  Assert-Evidence (@($raw -split "`n" | Where-Object { $_ -match '[ \t]+$' }).Count -eq 0) "$name-no-trailing-whitespace"
  $hashes += [ordered]@{name=$name; sha256=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant(); bytes=$bytes.Length}
}
$tracked = @(git diff --name-only HEAD --)
$trackedExit = $LASTEXITCODE
if ($trackedExit -ne 0) { throw 'git tracked audit failed' }
Assert-Evidence ($tracked.Count -eq 0) 'no-tracked-file-changes'
$untracked = @(git ls-files --others --exclude-standard)
$untrackedExit = $LASTEXITCODE
if ($untrackedExit -ne 0) { throw 'git untracked audit failed' }
$allowed = @($names | ForEach-Object { "$g/$_" })
Assert-Evidence ($untracked.Count -eq 3 -and @($untracked | Where-Object { $_ -cnotin $allowed }).Count -eq 0) 'only-three-created-artifacts-before-verification-record'
git diff --check
$diffExit = $LASTEXITCODE
if ($diffExit -ne 0) { throw 'git diff check failed' }
[ordered]@{verifiedAtUtc=(Get-Date -AsUTC -Format o); assertionCount=$checks.Count; assertions=@($checks); artifactHashes=$hashes; nativeExits=@{tracked=$trackedExit;untracked=$untrackedExit;diffCheck=$diffExit}; sourceRechecks=14; scope='repository/document checks only; no production test suite'} | ConvertTo-Json -Depth 5
```

### C08

```text
$ErrorActionPreference = 'Stop'
$g = 'plugins/foreman-line/docs/goals/routing-currency-and-merit'
$names = @('rcm-p0-drift-report.md','rcm-p0-catalog-snapshot.v1.json','rcm-p0-environment-map.md')
$checks = [System.Collections.Generic.List[string]]::new()
function Assert-Evidence([bool]$Condition,[string]$Name) { if (-not $Condition) { throw "CHECK_FAILED: $Name" }; $checks.Add($Name) }
$s = Get-Content -LiteralPath "$g/rcm-p0-catalog-snapshot.v1.json" -Raw | ConvertFrom-Json -DateKind String
Assert-Evidence ($s.recordVersion -eq 1 -and $s.purpose -ceq 'recon-evidence-only') 'format'
Assert-Evidence ($s.repoCommit -ceq '1ec2b1012d5290851e924cc91137ec3f09122820') 'spec-commit'
Assert-Evidence ($s.complete -eq $false -and $s.incompleteReasons -ccontains 'blocked-secret-boundary') 'explicit-incomplete-boundary'
Assert-Evidence (@($s.providers).Count -eq 0 -and @($s.models).Count -eq 0 -and $null -eq $s.coverage.modelCount) 'no-invented-host-records'
Assert-Evidence ($null -eq $s.settingsFacts.facts -and $s.settingsFacts.sourceRef -ceq 'H03') 'settings-unobserved'
Assert-Evidence ($null -eq $s.freshness.maxAgeSeconds -and $s.freshness.proposedMaxAgeSeconds -eq 86400 -and $s.freshness.verdict -ceq 'refused') 'ttl-unratified'
Assert-Evidence ($null -eq $s.freshness.computedAgeSeconds -and $null -eq $s.freshness.oldestRequiredSourceOrProviderFactTimeUtc) 'age-unknown'
Assert-Evidence (@($s.sourceRefs | Where-Object id -Like 'H*').Count -eq 4) 'four-unbound-host-roles'
Assert-Evidence (@($s.sourceRefs | Where-Object { $_.id -like 'H*' -and ($null -ne $_.safeProjectionSha256 -or $_.status -cne 'blocked-secret-boundary') }).Count -eq 0) 'no-host-digests'
Assert-Evidence ($s.policySha256 -ceq '578f7a8a3a4384bf5f3e0064cb0439032e068a9e869bbf42770714e1466bebb0') 'policy-binding'
foreach ($source in @($s.sourceRefs | Where-Object id -Like 'S*')) {
  $path = $source.safeLocator.Substring(5)
  $item = Get-Item -LiteralPath $path
  Assert-Evidence ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $source.safeProjectionSha256) "$($source.id)-digest"
  Assert-Evidence ($item.Length -eq $source.byteFormat.length) "$($source.id)-length"
  Assert-Evidence ($item.LastWriteTimeUtc.ToString('o') -ceq $source.sourceStability.lastWriteTimeUtc) "$($source.id)-metadata"
}
$policyLines = @(Get-Content -LiteralPath 'plugins/foreman-line/routing-policy/routing-policy.yaml')
$tierIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
foreach ($tier in @('frontier','standard','economy')) {
  foreach ($row in $s.repositoryFacts.tiers.$tier) {
    $match = [regex]::Match($policyLines[$row.line-1],'^\s+- ([^ #]+)')
    Assert-Evidence ($match.Success -and $match.Groups[1].Value -ceq $row.id) "tier-$tier-line-$($row.line)"
    [void]$tierIds.Add($row.id)
  }
}
Assert-Evidence ($tierIds.Count -eq 15) '15-distinct-tier-ids'
foreach ($classification in @('public','internal','restricted')) {
  $rows = @($s.repositoryFacts.classificationIds.$classification)
  $classIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
  foreach ($row in $rows) { [void]$classIds.Add($row.id) }
  Assert-Evidence ($rows.Count -eq 15 -and $classIds.Count -eq 15 -and $classIds.SetEquals($tierIds)) "$classification-exact-policy-set"
}
$hashes = @()
foreach ($name in $names) {
  $path = "$g/$name"
  $bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path $path))
  $raw = [System.Text.UTF8Encoding]::new($false,$true).GetString($bytes)
  Assert-Evidence (-not $raw.Contains("`r") -and -not $raw.StartsWith([string][char]0xfeff,[StringComparison]::Ordinal)) "$name-utf8-lf-no-bom"
  Assert-Evidence (@($raw -split "`n" | Where-Object { $_ -match '[ \t]+$' }).Count -eq 0) "$name-no-trailing-whitespace"
  $hashes += [ordered]@{name=$name; sha256=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant(); bytes=$bytes.Length}
}
$tracked = @(git diff --name-only HEAD --)
$trackedExit = $LASTEXITCODE
if ($trackedExit -ne 0) { throw 'git tracked audit failed' }
Assert-Evidence ($tracked.Count -eq 0) 'no-tracked-file-changes'
$untracked = @(git ls-files --others --exclude-standard)
$untrackedExit = $LASTEXITCODE
if ($untrackedExit -ne 0) { throw 'git untracked audit failed' }
$allowed = @($names | ForEach-Object { "$g/$_" })
Assert-Evidence ($untracked.Count -eq 3 -and @($untracked | Where-Object { $_ -cnotin $allowed }).Count -eq 0) 'only-three-created-artifacts-before-verification-record'
git diff --check
$diffExit = $LASTEXITCODE
if ($diffExit -ne 0) { throw 'git diff check failed' }
[ordered]@{verifiedAtUtc=(Get-Date -AsUTC -Format o); assertionCount=$checks.Count; assertions=@($checks); artifactHashes=$hashes; nativeExits=@{tracked=$trackedExit;untracked=$untrackedExit;diffCheck=$diffExit}; sourceRechecks=14; scope='repository/document checks only; no production test suite'} | ConvertTo-Json -Depth 5
```

### C09

```text
$ErrorActionPreference = 'Stop'
$g = 'plugins/foreman-line/docs/goals/routing-currency-and-merit'
$names = @('rcm-p0-drift-report.md','rcm-p0-catalog-snapshot.v1.json','rcm-p0-environment-map.md')
$checks = [System.Collections.Generic.List[string]]::new()
function Assert-Evidence([bool]$Condition,[string]$Name) { if (-not $Condition) { throw "CHECK_FAILED: $Name" }; $checks.Add($Name) }
$s = Get-Content -LiteralPath "$g/rcm-p0-catalog-snapshot.v1.json" -Raw | ConvertFrom-Json -DateKind String
Assert-Evidence ($s.recordVersion -eq 1 -and $s.purpose -ceq 'recon-evidence-only') 'format'
Assert-Evidence ($s.repoCommit -ceq '1ec2b1012d5290851e924cc91137ec3f09122820') 'spec-commit'
Assert-Evidence ($s.complete -eq $false -and $s.incompleteReasons -ccontains 'blocked-secret-boundary') 'explicit-incomplete-boundary'
Assert-Evidence (@($s.providers).Count -eq 0 -and @($s.models).Count -eq 0 -and $null -eq $s.coverage.modelCount) 'no-invented-host-records'
Assert-Evidence ($null -eq $s.settingsFacts.facts -and $s.settingsFacts.sourceRef -ceq 'H03') 'settings-unobserved'
Assert-Evidence ($null -eq $s.freshness.maxAgeSeconds -and $s.freshness.proposedMaxAgeSeconds -eq 86400 -and $s.freshness.verdict -ceq 'refused') 'ttl-unratified'
Assert-Evidence ($null -eq $s.freshness.computedAgeSeconds -and $null -eq $s.freshness.oldestRequiredSourceOrProviderFactTimeUtc) 'age-unknown'
Assert-Evidence (@($s.sourceRefs | Where-Object id -Like 'H*').Count -eq 4) 'four-unbound-host-roles'
Assert-Evidence (@($s.sourceRefs | Where-Object { $_.id -like 'H*' -and ($null -ne $_.safeProjectionSha256 -or $_.status -cne 'blocked-secret-boundary') }).Count -eq 0) 'no-host-digests'
Assert-Evidence ($s.policySha256 -ceq '578f7a8a3a4384bf5f3e0064cb0439032e068a9e869bbf42770714e1466bebb0') 'policy-binding'
foreach ($source in @($s.sourceRefs | Where-Object id -Like 'S*')) {
  $path = $source.safeLocator.Substring(5)
  $item = Get-Item -LiteralPath $path
  Assert-Evidence ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $source.safeProjectionSha256) "$($source.id)-digest"
  Assert-Evidence ($item.Length -eq $source.byteFormat.length) "$($source.id)-length"
  Assert-Evidence ($item.LastWriteTimeUtc.ToString('o') -ceq $source.sourceStability.lastWriteTimeUtc) "$($source.id)-metadata"
}
$policyLines = @(Get-Content -LiteralPath 'plugins/foreman-line/routing-policy/routing-policy.yaml')
$tierIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
foreach ($tier in @('frontier','standard','economy')) {
  foreach ($row in $s.repositoryFacts.tiers.$tier) {
    $match = [regex]::Match($policyLines[$row.line-1],'^\s+- ([^ #]+)')
    Assert-Evidence ($match.Success -and $match.Groups[1].Value -ceq $row.id) "tier-$tier-line-$($row.line)"
    [void]$tierIds.Add($row.id)
  }
}
Assert-Evidence ($tierIds.Count -eq 15) '15-distinct-tier-ids'
foreach ($classification in @('public','internal','restricted')) {
  $rows = @($s.repositoryFacts.classificationIds.$classification)
  $classIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
  foreach ($row in $rows) { [void]$classIds.Add($row.id) }
  Assert-Evidence ($rows.Count -eq 15 -and $classIds.Count -eq 15 -and $classIds.SetEquals($tierIds)) "$classification-exact-policy-set"
}
$hashes = @()
foreach ($name in $names) {
  $path = "$g/$name"
  $bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path $path))
  $raw = [System.Text.UTF8Encoding]::new($false,$true).GetString($bytes)
  Assert-Evidence (-not $raw.StartsWith([string][char]0xfeff,[StringComparison]::Ordinal)) "$name-utf8-no-bom"
  Assert-Evidence (@($raw -split "\r?\n" | Where-Object { $_ -match '[ \t]+$' }).Count -eq 0) "$name-no-trailing-whitespace"
  $hashes += [ordered]@{name=$name; sha256=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant(); bytes=$bytes.Length; crlfCount=[regex]::Matches($raw,"\r\n").Count; bareLfCount=[regex]::Matches($raw,"(?<!\r)\n").Count}
}
$tracked = @(git diff --name-only HEAD --)
$trackedExit = $LASTEXITCODE
if ($trackedExit -ne 0) { throw 'git tracked audit failed' }
Assert-Evidence ($tracked.Count -eq 0) 'no-tracked-file-changes'
$untracked = @(git ls-files --others --exclude-standard)
$untrackedExit = $LASTEXITCODE
if ($untrackedExit -ne 0) { throw 'git untracked audit failed' }
$allowed = @($names | ForEach-Object { "$g/$_" })
Assert-Evidence ($untracked.Count -eq 3 -and @($untracked | Where-Object { $_ -cnotin $allowed }).Count -eq 0) 'only-three-created-artifacts-before-verification-record'
git diff --check
$diffExit = $LASTEXITCODE
if ($diffExit -ne 0) { throw 'git diff check failed' }
[ordered]@{verifiedAtUtc=(Get-Date -AsUTC -Format o); assertionCount=$checks.Count; assertions=@($checks); artifactHashes=$hashes; nativeExits=@{tracked=$trackedExit;untracked=$untrackedExit;diffCheck=$diffExit}; sourceRechecks=14; scope='repository/document checks only; no production test suite'} | ConvertTo-Json -Depth 5
```

### C10

```text
$ErrorActionPreference = 'Stop'
$g = 'plugins/foreman-line/docs/goals/routing-currency-and-merit'
$names = @('rcm-p0-drift-report.md','rcm-p0-catalog-snapshot.v1.json','rcm-p0-environment-map.md')
$checks = [System.Collections.Generic.List[string]]::new()
function Assert-Evidence([bool]$Condition,[string]$Name) { if (-not $Condition) { throw "CHECK_FAILED: $Name" }; $checks.Add($Name) }
$s = Get-Content -LiteralPath "$g/rcm-p0-catalog-snapshot.v1.json" -Raw | ConvertFrom-Json -DateKind String
Assert-Evidence ($s.recordVersion -eq 1 -and $s.purpose -ceq 'recon-evidence-only') 'format'
Assert-Evidence ($s.repoCommit -ceq '1ec2b1012d5290851e924cc91137ec3f09122820') 'spec-commit'
Assert-Evidence ($s.complete -eq $false -and $s.incompleteReasons -ccontains 'blocked-secret-boundary') 'explicit-incomplete-boundary'
Assert-Evidence (@($s.providers).Count -eq 0 -and @($s.models).Count -eq 0 -and $null -eq $s.coverage.modelCount) 'no-invented-host-records'
Assert-Evidence ($null -eq $s.settingsFacts.facts -and $s.settingsFacts.sourceRef -ceq 'H03') 'settings-unobserved'
Assert-Evidence ($null -eq $s.freshness.maxAgeSeconds -and $s.freshness.proposedMaxAgeSeconds -eq 86400 -and $s.freshness.verdict -ceq 'refused') 'ttl-unratified'
Assert-Evidence ($null -eq $s.freshness.computedAgeSeconds -and $null -eq $s.freshness.oldestRequiredSourceOrProviderFactTimeUtc) 'age-unknown'
Assert-Evidence (@($s.sourceRefs | Where-Object id -Like 'H*').Count -eq 4) 'four-unbound-host-roles'
Assert-Evidence (@($s.sourceRefs | Where-Object { $_.id -like 'H*' -and ($null -ne $_.safeProjectionSha256 -or $_.status -cne 'blocked-secret-boundary') }).Count -eq 0) 'no-host-digests'
Assert-Evidence ($s.policySha256 -ceq '578f7a8a3a4384bf5f3e0064cb0439032e068a9e869bbf42770714e1466bebb0') 'policy-binding'
foreach ($source in @($s.sourceRefs | Where-Object id -Like 'S*')) {
  $path = $source.safeLocator.Substring(5)
  $item = Get-Item -LiteralPath $path
  Assert-Evidence ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ceq $source.safeProjectionSha256) "$($source.id)-digest"
  Assert-Evidence ($item.Length -eq $source.byteFormat.length) "$($source.id)-length"
  Assert-Evidence ($item.LastWriteTimeUtc.ToString('o') -ceq $source.sourceStability.lastWriteTimeUtc) "$($source.id)-metadata"
}
$policyLines = @(Get-Content -LiteralPath 'plugins/foreman-line/routing-policy/routing-policy.yaml')
$tierIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
foreach ($tier in @('frontier','standard','economy')) {
  foreach ($row in $s.repositoryFacts.tiers.$tier) {
    $match = [regex]::Match($policyLines[$row.line-1],'^\s+- ([^ #]+)')
    Assert-Evidence ($match.Success -and $match.Groups[1].Value -ceq $row.id) "tier-$tier-line-$($row.line)"
    [void]$tierIds.Add($row.id)
  }
}
Assert-Evidence ($tierIds.Count -eq 15) '15-distinct-tier-ids'
foreach ($classification in @('public','internal','restricted')) {
  $rows = @($s.repositoryFacts.classificationIds.$classification)
  $classIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
  foreach ($row in $rows) { [void]$classIds.Add($row.id) }
  Assert-Evidence ($rows.Count -eq 15 -and $classIds.Count -eq 15 -and $classIds.SetEquals($tierIds)) "$classification-exact-policy-set"
}
$hashes = @()
foreach ($name in $names) {
  $path = "$g/$name"
  $bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path $path))
  $raw = [System.Text.UTF8Encoding]::new($false,$true).GetString($bytes)
  Assert-Evidence ($raw.Length -gt 0) "$name-valid-nonempty-utf8"
  Assert-Evidence (@($raw -split "\r?\n" | Where-Object { $_ -match '[ \t]+$' }).Count -eq 0) "$name-no-trailing-whitespace"
  $hashes += [ordered]@{name=$name; sha256=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant(); bytes=$bytes.Length; bom=$raw.StartsWith([string][char]0xfeff,[StringComparison]::Ordinal); crlfCount=[regex]::Matches($raw,"\r\n").Count; bareLfCount=[regex]::Matches($raw,"(?<!\r)\n").Count}
}
$tracked = @(git diff --name-only HEAD --)
$trackedExit = $LASTEXITCODE
if ($trackedExit -ne 0) { throw 'git tracked audit failed' }
Assert-Evidence ($tracked.Count -eq 0) 'no-tracked-file-changes'
$untracked = @(git ls-files --others --exclude-standard)
$untrackedExit = $LASTEXITCODE
if ($untrackedExit -ne 0) { throw 'git untracked audit failed' }
$allowed = @($names | ForEach-Object { "$g/$_" })
Assert-Evidence ($untracked.Count -eq 3 -and @($untracked | Where-Object { $_ -cnotin $allowed }).Count -eq 0) 'only-three-created-artifacts-before-verification-record'
git diff --check
$diffExit = $LASTEXITCODE
if ($diffExit -ne 0) { throw 'git diff check failed' }
[ordered]@{verifiedAtUtc=(Get-Date -AsUTC -Format o); assertionCount=$checks.Count; assertions=@($checks); artifactHashes=$hashes; nativeExits=@{tracked=$trackedExit;untracked=$untrackedExit;diffCheck=$diffExit}; sourceRechecks=14; scope='repository/document checks only; no production test suite'} | ConvertTo-Json -Depth 5
```

### C11

```text
$ErrorActionPreference = 'Stop'
$g = 'plugins/foreman-line/docs/goals/routing-currency-and-merit'
$expected = @{
  'rcm-p0-drift-report.md'='a059e78399edf3cc431ecc76d7c90224333f1d93b0bbacb8c143d0fdd7eb8b9f'
  'rcm-p0-catalog-snapshot.v1.json'='3991ad80a34c1c861d06c4732b488b742e858ee64a79fc2f974a9b1d06ecdab6'
  'rcm-p0-environment-map.md'='6d56c156846e554ea7826ed6565bb453afc1604002516878c3be2dc40ad87e0f'
}
$count = 0
foreach ($name in $expected.Keys | Sort-Object) {
  $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath "$g/$name").Hash.ToLowerInvariant()
  if ($actual -cne $expected[$name]) { throw "ARTIFACT_DIGEST_MISMATCH: $name" }
  $count++
}
$snapshotPath = "$g/rcm-p0-catalog-snapshot.v1.json"
$bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path $snapshotPath))
$copy = [byte[]]$bytes.Clone()
$copy[0] = $copy[0] -bxor 1
$alteredDigest = [System.Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($copy)).ToLowerInvariant()
if ($alteredDigest -ceq $expected['rcm-p0-catalog-snapshot.v1.json']) { throw 'NEGATIVE_DIGEST_CHECK_FAILED' }
$count++
Write-Output 'in-memory changed byte: DIGEST_MISMATCH_REFUSED; disk untouched'
$s = Get-Content -LiteralPath $snapshotPath -Raw | ConvertFrom-Json -DateKind String
if ($null -ne $s.freshness.maxAgeSeconds -or $s.freshness.verdict -cne 'refused') { throw 'FRESHNESS_REFUSAL_MISSING' }
$count++
Write-Output "FRESHNESS_BOUND_UNRATIFIED_REFUSED at $($s.freshness.evaluatedAtUtc); age unavailable"
if ($s.complete -eq $false -and @($s.incompleteReasons).Count -gt 0) {
  $count++
  Write-Output "PARTIAL_REFUSED; checks=$count; expected evidence-consumption exit=1"
  exit 1
}
throw 'PARTIAL_REFUSAL_MISSING'
```

### C12

```text
$ErrorActionPreference = 'Stop'
$g = 'plugins/foreman-line/docs/goals/routing-currency-and-merit'
$names = @('rcm-p0-drift-report.md','rcm-p0-catalog-snapshot.v1.json','rcm-p0-environment-map.md','rcm-p0-verification.md')
$expected = @{
  'rcm-p0-drift-report.md'='a059e78399edf3cc431ecc76d7c90224333f1d93b0bbacb8c143d0fdd7eb8b9f'
  'rcm-p0-catalog-snapshot.v1.json'='3991ad80a34c1c861d06c4732b488b742e858ee64a79fc2f974a9b1d06ecdab6'
  'rcm-p0-environment-map.md'='6d56c156846e554ea7826ed6565bb453afc1604002516878c3be2dc40ad87e0f'
}
$count = 0
foreach ($name in $expected.Keys) {
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath "$g/$name").Hash.ToLowerInvariant() -cne $expected[$name]) { throw "ARTIFACT_CHANGED: $name" }
  $count++
}
$s = Get-Content -LiteralPath "$g/rcm-p0-catalog-snapshot.v1.json" -Raw | ConvertFrom-Json -DateKind String
foreach ($source in @($s.sourceRefs | Where-Object id -Like 'S*')) {
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $source.safeLocator.Substring(5)).Hash.ToLowerInvariant() -cne $source.safeProjectionSha256) { throw "SOURCE_CHANGED: $($source.id)" }
  $count++
}
$head = git rev-parse HEAD
$headExit = $LASTEXITCODE
if ($headExit -ne 0 -or $head -cne $s.repoCommit) { throw 'HEAD_CHANGED' }
$count++
$tracked = @(git diff --name-only HEAD --)
$trackedExit = $LASTEXITCODE
if ($trackedExit -ne 0 -or $tracked.Count -ne 0) { throw 'TRACKED_FILE_CHANGED' }
$count++
$untracked = @(git ls-files --others --exclude-standard)
$untrackedExit = $LASTEXITCODE
$allowed = @($names | ForEach-Object { "$g/$_" })
if ($untrackedExit -ne 0 -or $untracked.Count -ne 4 -or @($untracked | Where-Object { $_ -cnotin $allowed }).Count -ne 0) { throw 'PATH_SCOPE_VIOLATION' }
$count++
foreach ($name in $names) {
  $raw = Get-Content -LiteralPath "$g/$name" -Raw
  if (@($raw -split "\r?\n" | Where-Object { $_ -match '[ \t]+$' }).Count -ne 0) { throw "TRAILING_WHITESPACE: $name" }
  $count++
}
git diff --check
$diffExit = $LASTEXITCODE
if ($diffExit -ne 0) { throw 'DIFF_CHECK_FAILED' }
$count++
[ordered]@{verifiedAtUtc=(Get-Date -AsUTC -Format o); checkCount=$count; nativeExits=@{head=$headExit;tracked=$trackedExit;untracked=$untrackedExit;diffCheck=$diffExit}; changedPaths=$untracked; sourceDigestsMatched=14; artifactExpectedDigestsMatched=3; head=$head} | ConvertTo-Json -Depth 4
```

### C13

```text
$ErrorActionPreference = 'Stop'
$g = 'plugins/foreman-line/docs/goals/routing-currency-and-merit'
foreach ($name in @('rcm-p0-drift-report.md','rcm-p0-catalog-snapshot.v1.json','rcm-p0-environment-map.md','rcm-p0-verification.md')) {
  $path = "$g/$name"
  $bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path $path))
  $raw = [System.Text.UTF8Encoding]::new($false,$true).GetString($bytes)
  [ordered]@{name=$name;sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant();bytes=$bytes.Length;bom=$raw.StartsWith([string][char]0xfeff,[StringComparison]::Ordinal);crlfCount=[regex]::Matches($raw,"\r\n").Count;bareLfCount=[regex]::Matches($raw,"(?<!\r)\n").Count} | ConvertTo-Json -Compress
}
```


## Final audit result

C12 at 2026-09-20T15:32:37.9524164Z exited 0: **25 checks passed**.
All 14 source digests and three expected artifact digests matched. HEAD remains
1ec2b1012d5290851e924cc91137ec3f09122820. No tracked file changes; exactly the
four allowed evidence paths are untracked additions. All four files passed trailing
whitespace checks; git diff --check exited 0. Four native command exits were 0.

Through C12: **12 shell invocations: 7 exit 0, 4 exit 1, 1 exit unretained**;
**12 explicitly recorded native executable exits, all 0**. Completed verification
batches: C05 14 source-digest comparisons; C10 79 assertions; C11 six integrity/refusal
checks; C12 25 audit checks (124 completed checks across these batches, with repeated
invariants counted per batch). Failed diagnostic attempts C06-C09 are separately
retained and are not counted as completed passing batches. Production test suites,
self-check, linter and independent reviews remain 0.

Changed paths, relative to the assigned repository root:

- plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-drift-report.md
- plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-catalog-snapshot.v1.json
- plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-environment-map.md
- plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-verification.md

W03 updated this result and its ledger/effect entries only. C13 subsequently hashes
the final four files without writes; its external result binds this document without
an impossible self-referential digest. C13's result is not pre-asserted here.

## Unresolved holds and acceptance

Safe source acquisition and current approved endpoint authority; installed parity;
all host-derived F1-F6 facts and supporting catalog statistics; approved TTL and
required source times; HAWF escalated-unresolved and downstream dispatch hold;
Jev refused/disabled-lane; compatible preinstalled lint tooling; C06 unretained exit;
exact R1 conversation binding; two fresh frontier reviews (one security-focused);
coordinator acceptance. No blanket pass and no downstream release is claimed.
