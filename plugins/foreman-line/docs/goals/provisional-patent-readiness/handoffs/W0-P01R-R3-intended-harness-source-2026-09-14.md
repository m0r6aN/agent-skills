# W0-P01R-R3 intended attempt harness — static transcript

This is a create-once control handoff of the same R3 builder's literal intended attempt-harness.ps1 source, received as three contiguous plaintext collaboration messages in builder turn 01a09f92-0b7c-7830-bcb2-8ce9171af3fa (actual gpt-5.6-sol/xhigh), session 01a09f83-d7bc-7ff0-97b2-e63f660404f7, agent /root/r3_attempt01_builder_step0. Chunk 1/3 was labeled lines 1–220, chunk 2/3 lines 221–440, and chunk 3/3 lines 441–630. The single fenced block below transcribes their fenced contents in order, joined with exactly one LF between adjacent chunks. The fence and this header are not part of the intended harness bytes. No harness file, proof root, fixture, matrix or S capture was created by this transcription.

Candidate pin: 4DA71D15D87F2C95AEB4D6D848504600FE808B2314761BF8CBC9C9210469C9A8.
Controlling R3 proposal pin: E2315C046D0F57BDA27BE4FACAE3E0899E04A3CC2A714437D24017BA9767A751.

~~~powershell
[CmdletBinding()]
param([ValidateSet('Execute')][string]$Phase='Execute')

Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$script:Attempt='D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r3-fixture-proof-20260913/attempt-01'
$script:WorktreeScript='D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01r-r3-fixture-20260913/tools/w0-p01r-fixture.ps1'
$script:Snapshot=Join-Path $script:Attempt 'script-snapshot.ps1'
$script:TaskId='/root/r3_attempt01_builder_step0'
$script:SessionId='01a09f83-d7bc-7ff0-97b2-e63f660404f7'
$script:Results=New-Object 'System.Collections.Generic.List[object]'
$script:StartedAt=[DateTime]::UtcNow.ToString('o')
$script:HarnessHash=$null
$script:SnapshotHash=$null
$script:MatrixHash=$null
$script:UnicodeHash=$null
$script:Stage='INITIAL'
$script:Commands=@()
$script:OutcomeWritten=$false

function Get-CanonicalPath([string]$Path) {
    $full=[IO.Path]::GetFullPath($Path)
    $volume=[IO.Path]::GetPathRoot($full)
    if ($full.Equals($volume,[StringComparison]::OrdinalIgnoreCase)) {return $volume}
    return $full.TrimEnd([char[]]@([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar))
}
function Test-WithinRoot([string]$Path,[string]$Root) {
    $actual=Get-CanonicalPath $Path
    $allowed=Get-CanonicalPath $Root
    if ($actual.Equals($allowed,[StringComparison]::OrdinalIgnoreCase)) {return $true}
    return $actual.StartsWith(($allowed+'\'),[StringComparison]::OrdinalIgnoreCase)
}
function Get-AncestorChain([string]$Path) {
    $cursor=Get-CanonicalPath $Path
    $volume=[IO.Path]::GetPathRoot($cursor)
    $seen=New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    $chain=New-Object 'System.Collections.Generic.List[string]'
    for ($depth=0;$depth -lt 260;$depth++) {
        if (-not $seen.Add($cursor)) {throw "Repeated ancestor: $cursor"}
        $chain.Add($cursor)
        if ($cursor.Equals($volume,[StringComparison]::OrdinalIgnoreCase)) {return $chain.ToArray()}
        $next=[IO.Path]::GetDirectoryName($cursor)
        if ([string]::IsNullOrWhiteSpace($next)) {throw 'Ancestor chain did not reach volume root'}
        $cursor=Get-CanonicalPath $next
    }
    throw 'Ancestor depth exceeded 260'
}
function Assert-OutputPath([string]$Path) {
    if (-not (Test-WithinRoot $Path $script:Attempt)) {throw "Harness output outside attempt: $Path"}
    $chain=@(Get-AncestorChain $Path)
    [array]::Reverse($chain)
    foreach ($ancestor in $chain) {
        if ([IO.File]::Exists($ancestor) -or [IO.Directory]::Exists($ancestor)) {
            if (([IO.File]::GetAttributes($ancestor) -band [IO.FileAttributes]::ReparsePoint) -ne 0) {throw "Harness output ancestor is reparse: $ancestor"}
        }
    }
}
function Get-Sha256([string]$Path) {Assert-RegularNoFollow $Path;return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToUpperInvariant()}
function Get-TextSha256([string]$Value) {
    $sha=[Security.Cryptography.SHA256]::Create()
    try {return ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($Value)))).Replace('-','')}
    finally {$sha.Dispose()}
}

function Assert-RegularNoFollow([string]$Path) {
    $allowed=(Test-WithinRoot $Path $script:Attempt) -or
        (Get-CanonicalPath $Path).Equals((Get-CanonicalPath $script:WorktreeScript),[StringComparison]::OrdinalIgnoreCase)
    if (-not $allowed) {throw "Harness read outside exact scope: $Path"}
    $chain=@(Get-AncestorChain $Path)
    [array]::Reverse($chain)
    foreach ($ancestor in $chain) {
        if ([IO.File]::Exists($ancestor) -or [IO.Directory]::Exists($ancestor)) {
            if (([IO.File]::GetAttributes($ancestor) -band [IO.FileAttributes]::ReparsePoint) -ne 0) {throw "Harness read ancestor is reparse: $ancestor"}
        }
    }
    $item=Get-Item -LiteralPath $Path -Force -ErrorAction Stop
    if ($item.PSIsContainer -or (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)) {throw "Harness read is not a regular file: $Path"}
}
function Read-Utf8Text([string]$Path) {
    Assert-RegularNoFollow $Path
    return [IO.File]::ReadAllText($Path,[Text.UTF8Encoding]::new($false,$true))
}
function Read-Utf8Json([string]$Path) {
    return (Read-Utf8Text $Path | ConvertFrom-Json)
}
function Get-CodePoints([string]$Value) {
    $points=New-Object 'System.Collections.Generic.List[int]'
    foreach ($ch in $Value.ToCharArray()) {$points.Add([int][char]$ch)}
    return $points.ToArray()
}
function Write-JsonOnce([string]$Path,[object]$Value) {
    Assert-OutputPath $Path
    if (Test-Path -LiteralPath $Path) {throw "Create-once evidence exists: $Path"}
    $parent=[IO.Path]::GetDirectoryName((Get-CanonicalPath $Path))
    if (-not [IO.Directory]::Exists($parent)) {throw "Harness evidence parent absent: $parent"}
    $text=$Value | ConvertTo-Json -Depth 40
    $bytes=([Text.UTF8Encoding]::new($false)).GetBytes($text)
    $stream=[IO.File]::Open($Path,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    try {$stream.Write($bytes,0,$bytes.Length)} finally {$stream.Dispose()}
}
function Get-AttemptInventory {
    $items=New-Object 'System.Collections.Generic.List[object]'
    $stack=New-Object 'System.Collections.Generic.Stack[string]'
    $stack.Push((Get-CanonicalPath $script:Attempt))
    while ($stack.Count -gt 0) {
        $directory=$stack.Pop()
        foreach ($item in @(Get-ChildItem -LiteralPath $directory -Force -ErrorAction Stop | Sort-Object Name)) {
            $relative=(Get-CanonicalPath $item.FullName).Substring((Get-CanonicalPath $script:Attempt).Length).TrimStart([char[]]@([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar)).Replace('\','/')
            $reparse=(($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)
            if ($reparse) {$items.Add([ordered]@{path=$relative;type='REPARSE_POINT';sha256=$null});continue}
            if ($item.PSIsContainer) {$items.Add([ordered]@{path=$relative;type='DIRECTORY';sha256=$null});$stack.Push($item.FullName)}
            else {$items.Add([ordered]@{path=$relative;type='REGULAR_FILE';sha256=(Get-Sha256 $item.FullName)})}
        }
    }
    return $items.ToArray()
}
function Assert-InMemoryPreflight([string]$CandidatePath) {
    $tokens=$null;$errors=$null
    $ast=[System.Management.Automation.Language.Parser]::ParseFile($CandidatePath,[ref]$tokens,[ref]$errors)
    if ($errors.Count -ne 0) {throw "Candidate parser errors: $($errors.Count)"}
    $parameters=@($ast.ParamBlock.Parameters | ForEach-Object {$_.Name.VariablePath.UserPath})
    foreach ($name in @('Mode','FixtureRoot','SourceRoot','CaptureRoot','PatentRoot','DoctrineRoot','ExpectedToolSha256')) {
        if ($parameters -notcontains $name) {throw "Candidate mode parameter absent: $name"}
    }
    $source=Read-Utf8Text $CandidatePath
    foreach ($name in @('FixtureSuccess','ExpectedInternalLink','ExpectedPathEscape','SourceCapture','Invoke-CustodyCapture','Invoke-SourceCapture','Assert-OutputPath','Get-Inventory','Write-DeterminismReport')) {
        if (-not $source.Contains($name)) {throw "Candidate mode/core absent: $name"}
    }
    $entry=[ordered]@{
        relativePath='probe.txt';entryType='REGULAR_FILE';classification='REGULAR';traversed=$false
        byteLength=1;sourceSha256=$null;payloadSha256=$null;copyResult=$null
        reason=$null;immediateEntryCount=$null;enumerationError=$null
        linkType=$null;resolvedTarget=$null;targetWithinRoot=$null
    }
    $probeHash='A'*64
    $entry['payloadSha256']=$probeHash
    if ($entry['payloadSha256'] -ne $probeHash) {throw 'Harness writable payloadSha256 probe failed'}
    $list=New-Object 'System.Collections.Generic.List[object]'
    $list.Add($entry)
    if ($list.ToArray().Count -ne 1 -or $list.ToArray()[0]['payloadSha256'] -ne $probeHash) {throw 'Harness Generic.List ToArray probe failed'}
    $chain=@(Get-AncestorChain 'D:/synthetic-proof')
    if ($chain.Count -lt 2 -or -not $chain[-1].Equals('D:\',[StringComparison]::OrdinalIgnoreCase) -or $chain -contains 'D:') {throw 'Harness drive-root ancestor probe failed'}
    if (Test-WithinRoot 'D:/synthetic-proof-outside' 'D:/synthetic-proof') {throw 'Harness path escape probe failed'}
    Assert-OutputPath (Join-Path $script:Attempt 'captures/success-a/manifest.json')
    Assert-OutputPath (Join-Path $script:Attempt 'expected/path-escape-stop.json')
    return [ordered]@{parserErrorCount=0;schemaSmokePassed=$true;genericListToArrayPassed=$true;modeParameterPreflightPassed=$true;driveRootBoundaryPassed=$true;outputBoundaryPassed=$true}
}
function Invoke-DeletedPresenceMatrix([string]$CandidatePath) {
    $matrix=[ordered]@{
        schemaVersion='w0-p01r-r3-deleted-presence-matrix-v1';attempt='attempt-01'
        harnessSha256=$script:HarnessHash;snapshotSha256=$script:SnapshotHash
        createdAtUtc=[DateTime]::UtcNow.ToString('o')
        extractedHelpers=@();closureSha256=$null;cases=@();pathIdentityGuard=$null
        allPassed=$false;extractionError=$null
    }
    try {
        $tokens=$null;$errors=$null
        $ast=[System.Management.Automation.Language.Parser]::ParseFile($CandidatePath,[ref]$tokens,[ref]$errors)
        if ($errors.Count -ne 0) {throw "Candidate parser errors before matrix: $($errors.Count)"}
        $names=@('Resolve-GitPathIdentity','Resolve-DeletedPresence')
        $all=@($ast.FindAll({param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $names -contains $n.Name},$true))
        if ($all.Count -ne 2) {throw 'Expected exactly one definition of each pure candidate helper'}
        $top=@($ast.EndBlock.Statements | Where-Object {$_ -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $names -contains $_.Name})
        if ($top.Count -ne 2) {throw 'Candidate helper is not a direct top-level function definition'}
        $texts=New-Object 'System.Collections.Generic.List[string]'
        foreach ($name in $names) {
            $matches=@($top | Where-Object {$_.Name -eq $name})
            if ($matches.Count -ne 1) {throw "Missing or duplicate top-level helper $name"}
            $text=[string]$matches[0].Extent.Text
            $texts.Add($text)
            $matrix['extractedHelpers']+=([ordered]@{name=$name;textSha256=(Get-TextSha256 $text)})
        }
        $closure=$texts.ToArray() -join [Environment]::NewLine
        $matrix['closureSha256']=Get-TextSha256 $closure
        $closureTokens=$null;$closureErrors=$null
        $closureAst=[System.Management.Automation.Language.Parser]::ParseInput($closure,[ref]$closureTokens,[ref]$closureErrors)
        if ($closureErrors.Count -ne 0) {throw 'Extracted closure parser error'}
        $statements=@($closureAst.EndBlock.Statements)
        if ($statements.Count -ne 2) {throw 'Extracted closure contains top-level candidate statement'}
        foreach ($statement in $statements) {
            if ($statement -isnot [System.Management.Automation.Language.FunctionDefinitionAst] -or $names -notcontains $statement.Name) {
                throw 'Extracted closure contains non-helper top-level statement'
            }
        }
        $allowedTypes=@('Convert','string','StringComparison','System.Collections.Generic.List[byte]',
            'Text.StringBuilder','Text.UTF8Encoding','Array','StringComparer',
            'System.Collections.Generic.Dictionary[string,object]',
            'System.Collections.Generic.List[object]','System.Collections.Generic.List[string]')
        $allowedMethods=@('Add','AddRange','Append','Clear','Contains','ContainsKey','EndsWith',
            'Equals','GetBytes','GetString','IndexOf','IsNullOrEmpty','new','Split','StartsWith',
            'Substring','ToArray','ToInt32','ToString','Sort')
        foreach ($helper in $statements) {
            $commands=@($helper.FindAll({param($n) $n -is [System.Management.Automation.Language.CommandAst]},$true))
            foreach ($command in $commands) {
                if ($helper.Name -ne 'Resolve-DeletedPresence' -or $command.GetCommandName() -ne 'Resolve-GitPathIdentity') {
                    throw "I/O, Git, dynamic or unapproved command in extracted helper: $($command.Extent.Text)"
                }
            }
            $variables=@($helper.FindAll({param($n) $n -is [System.Management.Automation.Language.VariableExpressionAst]},$true))
            foreach ($variable in $variables) {
                if (@('env','script','global') -contains [string]$variable.VariablePath.DriveName) {
                    throw "Environment or external-scope access in extracted helper: $($variable.Extent.Text)"
                }
            }
            $typeNodes=@($helper.FindAll({param($n) $n -is [System.Management.Automation.Language.TypeExpressionAst]},$true))
            foreach ($typeNode in $typeNodes) {
                if ($allowedTypes -notcontains [string]$typeNode.TypeName.FullName) {
                    throw "Unapproved helper type: $($typeNode.TypeName.FullName)"
                }
            }
            $methodNodes=@($helper.FindAll({param($n) $n -is [System.Management.Automation.Language.InvokeMemberExpressionAst]},$true))
            foreach ($methodNode in $methodNodes) {
                if ($methodNode.Member -isnot [System.Management.Automation.Language.StringConstantExpressionAst] -or
                    $allowedMethods -notcontains [string]$methodNode.Member.Value) {
                    throw "Unapproved helper method: $($methodNode.Extent.Text)"
                }
            }
            if (@($helper.FindAll({param($n) $n -is [System.Management.Automation.Language.ScriptBlockExpressionAst]},$true)).Count -ne 0) {
                throw 'Dynamic scriptblock in extracted helper'
            }
        }
        $boundaries=@(
            ([ordered]@{relativePath='node_modules';entryType='DIRECTORY';classification='EXCLUDED';traversed=$false}),
            ([ordered]@{relativePath='opaque-junction';entryType='REPARSE_POINT';classification='LINK_OPAQUE';traversed=$false}),
            ([ordered]@{relativePath='internal-junction';entryType='REPARSE_POINT';classification='LINK_INTERNAL';traversed=$false})
        )
        $factsExact=@(
            ([ordered]@{rawPath='node_modules';stagedDeleted=$true;unstagedDeleted=$false}),
            ([ordered]@{rawPath='opaque-junction';stagedDeleted=$true;unstagedDeleted=$false}),
            ([ordered]@{rawPath='internal-junction';stagedDeleted=$true;unstagedDeleted=$false})
        )
        $factsBelow=@(
            ([ordered]@{rawPath='node_modules/child.txt';stagedDeleted=$true;unstagedDeleted=$false}),
            ([ordered]@{rawPath='opaque-junction/child.txt';stagedDeleted=$true;unstagedDeleted=$false}),
            ([ordered]@{rawPath='internal-junction/child.txt';stagedDeleted=$true;unstagedDeleted=$false})
        )
        $cases=@(
            ([ordered]@{name='staged_recreated';facts=@(([ordered]@{rawPath='recreated.txt';stagedDeleted=$true;unstagedDeleted=$false}));inventory=@(([ordered]@{relativePath='recreated.txt';entryType='REGULAR_FILE';classification='REGULAR';traversed=$false}));observations=@(([ordered]@{relativePath='recreated.txt';state='REGULAR_FILE'}));status='RESOLVED';paths=@('recreated.txt');dispositions=@('COPIED_FILE');counts=@(1,0,0,0);staged=@($true);unstaged=@($false)}),
            ([ordered]@{name='staged_absent';facts=@(([ordered]@{rawPath='staged-gone.txt';stagedDeleted=$true;unstagedDeleted=$false}));inventory=@();observations=@(([ordered]@{relativePath='staged-gone.txt';state='ABSENT'}));status='RESOLVED';paths=@('staged-gone.txt');dispositions=@('ABSENT_TRACKED');counts=@(0,1,0,0);staged=@($true);unstaged=@($false)}),
            ([ordered]@{name='unstaged_absent';facts=@(([ordered]@{rawPath='unstaged-gone.txt';stagedDeleted=$false;unstagedDeleted=$true}));inventory=@();observations=@(([ordered]@{relativePath='unstaged-gone.txt';state='ABSENT'}));status='RESOLVED';paths=@('unstaged-gone.txt');dispositions=@('ABSENT_TRACKED');counts=@(0,1,0,0);staged=@($false);unstaged=@($true)}),
            ([ordered]@{name='dual_flags_deduplicated';facts=@(([ordered]@{rawPath='dual-gone.txt';stagedDeleted=$true;unstagedDeleted=$false}),([ordered]@{rawPath='dual-gone.txt';stagedDeleted=$false;unstagedDeleted=$true}));inventory=@();observations=@(([ordered]@{relativePath='dual-gone.txt';state='ABSENT'}));status='RESOLVED';paths=@('dual-gone.txt');dispositions=@('ABSENT_TRACKED');counts=@(0,1,0,0);staged=@($true);unstaged=@($true)}),
            ([ordered]@{name='exact_boundary_preserved';facts=$factsExact;inventory=$boundaries;observations=@(([ordered]@{relativePath='node_modules';state='BOUNDARY'}),([ordered]@{relativePath='opaque-junction';state='BOUNDARY'}),([ordered]@{relativePath='internal-junction';state='BOUNDARY'}));status='RESOLVED';paths=@('internal-junction','node_modules','opaque-junction');dispositions=@('BOUNDARY_PRESERVED','BOUNDARY_PRESERVED','BOUNDARY_PRESERVED');counts=@(0,0,3,0);staged=@($true,$true,$true);unstaged=@($false,$false,$false)}),
            ([ordered]@{name='below_boundary_unobserved';facts=$factsBelow;inventory=$boundaries;observations=@(([ordered]@{relativePath='node_modules/child.txt';state='UNOBSERVED'}),([ordered]@{relativePath='opaque-junction/child.txt';state='UNOBSERVED'}),([ordered]@{relativePath='internal-junction/child.txt';state='UNOBSERVED'}));status='UNRESOLVED_PRESENCE';paths=@('internal-junction/child.txt','node_modules/child.txt','opaque-junction/child.txt');dispositions=@('UNRESOLVED_BOUNDARY','UNRESOLVED_BOUNDARY','UNRESOLVED_BOUNDARY');counts=@(0,0,0,3);staged=@($true,$true,$true);unstaged=@($false,$false,$false)})
        )
        $expectedUnicode='caf'+[char]0x00E9+' plan.txt'
        $quotedGit='"caf\303\251 plan.txt"'
        $out=& {
            param($functionsOnly,$matrixCases,$quoted,$unicode)
            . ([ScriptBlock]::Create($functionsOnly))
            $caseResults=New-Object 'System.Collections.Generic.List[object]'
            $allPassed=$true
            foreach ($case in $matrixCases) {
                $actual=Resolve-DeletedPresence $case['facts'] $case['inventory'] $case['observations']
                $expected=[ordered]@{status=$case['status'];paths=$case['paths'];dispositions=$case['dispositions'];counts=$case['counts'];staged=$case['staged'];unstaged=$case['unstaged']}
                $decisions=@($actual['decisions'])
                $passed=($actual['status'] -eq $case['status'] -and $decisions.Count -eq $case['paths'].Count)
                $actualCounts=@([int]$actual['counts']['copiedFile'],[int]$actual['counts']['absentTracked'],[int]$actual['counts']['boundaryPreserved'],[int]$actual['counts']['unresolved'])
                for ($j=0;$j -lt 4;$j++) {if ($actualCounts[$j] -ne $case['counts'][$j]) {$passed=$false}}
                if ($decisions.Count -eq $case['paths'].Count) {
                    for ($j=0;$j -lt $decisions.Count;$j++) {
                        if ($decisions[$j]['relativePath'] -cne $case['paths'][$j] -or
                            $decisions[$j]['disposition'] -cne $case['dispositions'][$j] -or
                            [bool]$decisions[$j]['stagedDeleted'] -ne [bool]$case['staged'][$j] -or
                            [bool]$decisions[$j]['unstagedDeleted'] -ne [bool]$case['unstaged'][$j]) {$passed=$false}
                    }
                }
                $caseResults.Add([ordered]@{name=$case['name'];input=[ordered]@{gitFacts=$case['facts'];inventory=$case['inventory'];presenceObservations=$case['observations']};expected=$expected;actual=[ordered]@{status=$actual['status'];decisions=$actual['decisions'];counts=$actual['counts'];reason=$actual['reason']};passed=$passed})
                if (-not $passed) {$allPassed=$false}
            }
            $identity=Resolve-GitPathIdentity $quoted $unicode
            $guardPassed=($identity['status'] -eq 'RESOLVED' -and $identity['relativePath'] -ceq $unicode)
            if (-not $guardPassed) {$allPassed=$false}
            return [ordered]@{cases=$caseResults.ToArray();pathIdentityGuard=[ordered]@{gitQuotedRendering=$quoted;observedWindowsRelativePath=$unicode;actual=$identity;passed=$guardPassed};allPassed=$allPassed}
        } $closure $cases $quotedGit $expectedUnicode
        $matrix['cases']=$out['cases']
        $matrix['pathIdentityGuard']=$out['pathIdentityGuard']
        $matrix['allPassed']=[bool]$out['allPassed']
    } catch {
        $matrix['extractionError']=$_.Exception.Message
        $matrix['allPassed']=$false
    }
    return $matrix
}
function New-Command([string]$Mode,[string]$Source,[string]$Capture) {
    $arguments='-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "{0}" -Mode {1} -FixtureRoot "{2}" -SourceRoot "{3}" -CaptureRoot "{4}"' -f $script:Snapshot,$Mode,$script:Attempt,$Source,$Capture
    return [ordered]@{
        mode=$Mode;sourceRoot=$Source;captureRoot=$Capture
        executable='powershell.exe';arguments=$arguments
        exactCommand="powershell.exe $arguments"
    }
}
function Set-CurrentEvidenceReadOnly([string]$FinalName) {
    foreach ($name in @('attempt-harness.ps1','script-snapshot.ps1','command-contract.json','deleted-presence-matrix-receipt.json','preflight-receipt.json','command-receipt.json','fixture-layout-receipt.json','unicode-roundtrip-receipt.json','determinism-comparison.json','captures/success-a/manifest.json','captures/success-a/manifest.json.sha256','captures/success-b/manifest.json','captures/success-b/manifest.json.sha256','expected/internal-link-stop/stop-record.json','expected/path-escape-stop.json',$FinalName)) {
        $path=Join-Path $script:Attempt $name
        if ([IO.File]::Exists($path)) {
            $attributes=[IO.File]::GetAttributes($path)
            if (($attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {throw "Receipt/snapshot is reparse: $path"}
            [IO.File]::SetAttributes($path,($attributes -bor [IO.FileAttributes]::ReadOnly))
        }
    }
}
function Write-StreamOnce([string]$Path,[string]$Content) {
    Assert-OutputPath $Path
    if (Test-Path -LiteralPath $Path) {throw "Child stream artifact exists: $Path"}
    $bytes=([Text.UTF8Encoding]::new($false)).GetBytes($Content)
    $stream=[IO.File]::Open($Path,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    try {$stream.Write($bytes,0,$bytes.Length)} finally {$stream.Dispose()}
}
function Invoke-Child([object]$Command,[int]$Index) {
    $stdout=Join-Path $script:Attempt ("command-{0:d2}.stdout.txt" -f $Index)
    $stderr=Join-Path $script:Attempt ("command-{0:d2}.stderr.txt" -f $Index)
    foreach ($path in @($stdout,$stderr)) {Assert-OutputPath $path;if (Test-Path -LiteralPath $path) {throw "Child stream artifact exists: $path"}}
    $started=[DateTime]::UtcNow.ToString('o')
    $process=New-Object System.Diagnostics.Process
    $startInfo=New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName='powershell.exe'
    $startInfo.Arguments=$Command.arguments
    $startInfo.UseShellExecute=$false
    $startInfo.CreateNoWindow=$true
    $startInfo.RedirectStandardOutput=$true
    $startInfo.RedirectStandardError=$true
    $process.StartInfo=$startInfo
    $pidValue=$null; $created=$null; $outText=''; $errText=''
    $exitCode=$null; $exitObserved=$false; $expired=$false
    $verifiedTermination=$false; $lifecycleError=$null
    $outTask=$null; $errTask=$null
    $deadlineClock=[Diagnostics.Stopwatch]::StartNew()
    try {
        if (-not $process.Start()) {throw 'Process.Start returned false'}
        $pidValue=$process.Id
        $created=$process.StartTime.ToUniversalTime().ToString('o')
        $outTask=$process.StandardOutput.ReadToEndAsync()
        $errTask=$process.StandardError.ReadToEndAsync()
        $waitBudget=[Math]::Max(0,120000-[int]$deadlineClock.ElapsedMilliseconds)
        $waited=$process.WaitForExit($waitBudget)
        if (-not $waited) {
            $expired=$true
            $cim=Get-CimInstance Win32_Process -Filter "ProcessId=$pidValue" -ErrorAction SilentlyContinue
            if ($null -ne $cim -and $cim.Name -ieq 'powershell.exe' -and $cim.ParentProcessId -eq $PID -and $cim.CommandLine -and $cim.CommandLine.Contains($script:Snapshot)) {
                $delta=[Math]::Abs((([DateTime]$cim.CreationDate).ToUniversalTime()-([DateTime]$created)).TotalSeconds)
                if ($delta -le 5) {
                    $process.Kill()
                    $verifiedTermination=$true
                    $process.WaitForExit(5000) | Out-Null
                }
            }
            if (-not $verifiedTermination) {throw "Deadline expired with unresolved owned PID $pidValue"}
        }
        if (-not $process.HasExited) {throw "Child exit is unobserved for PID $pidValue"}
        $drainBudget=[Math]::Max(0,120000-[int]$deadlineClock.ElapsedMilliseconds)
        if (-not $outTask.Wait($drainBudget)) {throw "Stdout drain exceeded 120-second invocation deadline for PID $pidValue"}
        $drainBudget=[Math]::Max(0,120000-[int]$deadlineClock.ElapsedMilliseconds)
        if (-not $errTask.Wait($drainBudget)) {throw "Stderr drain exceeded 120-second invocation deadline for PID $pidValue"}
        $outText=$outTask.GetAwaiter().GetResult()
        $errText=$errTask.GetAwaiter().GetResult()
        try {
            $rawExitCode=$process.ExitCode
            $parsedExitCode=0
            if ($null -eq $rawExitCode -or -not [int]::TryParse([string]$rawExitCode,[ref]$parsedExitCode)) {throw "Numeric ExitCode unavailable for PID $pidValue"}
            $exitCode=$parsedExitCode
            $exitObserved=$true
        } catch {throw "Numeric ExitCode unavailable for PID $pidValue"}
    } catch {
        $lifecycleError=$_.Exception.Message
        if ($null -ne $outTask -and $outTask.IsCompleted) {try {$outText=$outTask.GetAwaiter().GetResult()} catch {}}
        if ($null -ne $errTask -and $errTask.IsCompleted) {try {$errText=$errTask.GetAwaiter().GetResult()} catch {}}
    } finally {
        Write-StreamOnce $stdout $outText
        Write-StreamOnce $stderr $errText
        $record=[ordered]@{
            index=$Index;command=$Command.exactCommand;pid=$pidValue;processCreatedAtUtc=$created
            startedAtUtc=$started;endedAtUtc=[DateTime]::UtcNow.ToString('o')
            deadlineSeconds=120;deadlineExpired=$expired;verifiedOwnedChildTermination=$verifiedTermination
            exitObserved=$exitObserved;exitResult=$(if ($exitObserved) {'OBSERVED'} else {'UNKNOWN_FAILURE'});exitCode=$exitCode
            stdoutPath=$stdout;stdoutSha256=(Get-Sha256 $stdout)
            stderrPath=$stderr;stderrSha256=(Get-Sha256 $stderr)
            harnessSha256=$script:HarnessHash;snapshotSha256=$script:SnapshotHash
            lifecycleError=$lifecycleError
        }
        $script:Results.Add($record)
        $process.Dispose()
    }
    if ($lifecycleError) {throw "Child command $Index lifecycle failure: $lifecycleError"}
    if ($expired) {throw "Child command $Index exceeded 120-second deadline"}
    if (-not $exitObserved) {throw "Child command $Index UNKNOWN_FAILURE: numeric ExitCode unobserved"}
    if ($exitCode -ne 0) {throw "Child command $Index exited $exitCode"}
}
function Assert-FinalEvidence {
    $required=@(
        'deleted-presence-matrix-receipt.json','fixture-layout-receipt.json','unicode-roundtrip-receipt.json','captures/success-a/manifest.json','captures/success-a/manifest.json.sha256',
        'captures/success-b/manifest.json','captures/success-b/manifest.json.sha256',
        'expected/internal-link-stop/stop-record.json','expected/path-escape-stop.json','determinism-comparison.json'
    )
    $hashes=[ordered]@{}
    foreach ($name in $required) {
        $path=Join-Path $script:Attempt $name
        if (-not [IO.File]::Exists($path)) {throw "Required F evidence absent: $name"}
        $item=Get-Item -LiteralPath $path
        if ($item.PSIsContainer -or (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)) {throw "F evidence not regular: $name"}
        $hashes[$name]=Get-Sha256 $path
    }
    $a=Read-Utf8Json (Join-Path $script:Attempt 'captures/success-a/manifest.json')
    $b=Read-Utf8Json (Join-Path $script:Attempt 'captures/success-b/manifest.json')
    foreach ($manifest in @($a,$b)) {
        if (-not $manifest.assertions.acceptedCapture -or -not $manifest.assertions.allPayloadHashesMatch -or -not $manifest.assertions.fileCountsEqual -or -not $manifest.assertions.directoryCountsEqual -or -not $manifest.assertions.aggregateHashesEqual -or -not $manifest.sourceStability.stable -or $manifest.counts.excludedBuildEphemera -ne 12 -or $manifest.counts.opaqueLinks -ne 1) {throw 'Persisted success assertion mismatch'}
    }
    foreach ($name in @('captures/success-a/manifest.json','captures/success-b/manifest.json')) {
        $manifestPath=Join-Path $script:Attempt $name
        $sidecar=((Read-Utf8Text "$manifestPath.sha256") -split ' ')[0]
        if ($sidecar -ne (Get-Sha256 $manifestPath)) {throw "F sidecar mismatch: $name"}
    }
    $internal=Read-Utf8Json (Join-Path $script:Attempt 'expected/internal-link-stop/stop-record.json')
    $escape=Read-Utf8Json (Join-Path $script:Attempt 'expected/path-escape-stop.json')
    if ($internal.stopReason -ne 'LINK_INTERNAL' -or $escape.stopReason -ne 'PATH_ESCAPE' -or $internal.assertions.acceptedCapture -or $escape.assertions.acceptedCapture) {throw 'Expected-stop envelope mismatch'}
    $determinism=Read-Utf8Json (Join-Path $script:Attempt 'determinism-comparison.json')
    if (-not $determinism.matches) {throw 'F determinism report failed'}
    return $hashes
}


function Invoke-UnicodeRoundTrip {
    $expectedName='caf' + [char]0x00E9 + ' plan.txt'
    $expectedPoints=@(99,97,102,233,32,112,108,97,110,46,116,120,116)
    $receiptPath=Join-Path $script:Attempt 'unicode-roundtrip-receipt.json'
    $receipt=[ordered]@{
        schemaVersion='w0-p01r-r3-unicode-roundtrip-v1';attempt='attempt-01'
        harnessSha256=$script:HarnessHash;snapshotSha256=$script:SnapshotHash
        windowsPowerShellVersion=$PSVersionTable.PSVersion.ToString()
        defaultCodePage=[Text.Encoding]::Default.CodePage
        expectedName=$expectedName;expectedCodePoints=$expectedPoints
        captures=@();allPassed=$false;failureStage=$null;failureMessage=$null
        createdAtUtc=[DateTime]::UtcNow.ToString('o')
    }
    try {
        if ($PSVersionTable.PSVersion.Major -ne 5 -or $PSVersionTable.PSVersion.Minor -ne 1) {throw 'Unicode proof requires actual Windows PowerShell 5.1'}
        if (((Get-CodePoints $expectedName) -join ',') -cne ($expectedPoints -join ',')) {throw 'Planned Unicode code points differ'}
        $layoutPath=Join-Path $script:Attempt 'fixture-layout-receipt.json'
        $layout=Read-Utf8Json $layoutPath
        if ($layout.schemaVersion -ne 'w0-p01r-r3-layout-v1' -or $layout.rootRegularFile -cne $expectedName -or $layout.replacedR2Slot -cne 'regular.txt') {throw 'Persisted R3 fixture substitution missing'}
        foreach ($slot in @('success-a','success-b')) {
            $manifestPath=Join-Path $script:Attempt "captures/$slot/manifest.json"
            $sidecarPath="$manifestPath.sha256"
            $manifestSha=Get-Sha256 $manifestPath
            $sidecarSha=Get-Sha256 $sidecarPath
            $sidecarText=Read-Utf8Text $sidecarPath
            if ((($sidecarText -split ' ')[0]) -cne $manifestSha) {throw "Unicode $slot sidecar mismatch"}
            $manifest=Read-Utf8Json $manifestPath
            if (-not $manifest.assertions.acceptedCapture -or -not $manifest.sourceStability.stable -or
                $manifest.counts.sourceFiles -ne 2 -or $manifest.counts.payloadFiles -ne 2 -or
                $manifest.counts.sourceDirectories -ne 2 -or $manifest.counts.payloadDirectories -ne 2 -or
                $manifest.counts.excludedBuildEphemera -ne 12 -or $manifest.counts.opaqueLinks -ne 1) {
                throw "Unicode $slot success topology/assertions mismatch"
            }
            $entries=@($manifest.entries)
            $seen=New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
            foreach ($entry in $entries) {
                $relative=[string]$entry.relativePath
                if (-not $seen.Add($relative) -or $relative.Contains('"')) {throw "Unicode $slot duplicate or quoted manifest path"}
            }
            $regular=@($entries | Where-Object {$_.entryType -eq 'REGULAR_FILE' -and $_.classification -eq 'REGULAR'})
            $matches=@($regular | Where-Object {[string]$_.relativePath -ceq $expectedName})
            $nested=@($regular | Where-Object {[string]$_.relativePath -ceq 'nested/nested.txt'})
            $absent=@($entries | Where-Object {$_.entryType -eq 'ABSENT_TRACKED' -and [string]$_.relativePath -ieq $expectedName})
            if ($regular.Count -ne 2 -or $matches.Count -ne 1 -or $nested.Count -ne 1 -or $absent.Count -ne 0) {
                throw "Unicode $slot copied/absent entry identity mismatch"
            }
            $entry=$matches[0]
            $actualName=[string]$entry.relativePath
            $actualPoints=@(Get-CodePoints $actualName)
            if ($actualName -cne $expectedName -or ($actualPoints -join ',') -cne ($expectedPoints -join ',') -or
                $entry.copyResult -ne 'COPIED') {throw "Unicode $slot persisted code-point or copy-result mismatch"}
            $sourcePath=Join-Path $script:Attempt "fixture-success-source/$expectedName"
            $payloadPath=Join-Path $script:Attempt "captures/$slot/payload/$expectedName"
            $sourceSha=Get-Sha256 $sourcePath
            $payloadSha=Get-Sha256 $payloadPath
            $sourceItem=Get-Item -LiteralPath $sourcePath -Force -ErrorAction Stop
            $payloadItem=Get-Item -LiteralPath $payloadPath -Force -ErrorAction Stop
            if ($sourceItem.Name -cne $expectedName -or $payloadItem.Name -cne $expectedName -or
                $sourceItem.Length -ne $entry.byteLength -or $payloadItem.Length -ne $entry.byteLength -or
                $sourceSha -cne $entry.sourceSha256 -or $payloadSha -cne $entry.payloadSha256 -or
                $sourceSha -cne $payloadSha) {throw "Unicode $slot filesystem/payload/hash identity mismatch"}
            $receipt['captures']+=([ordered]@{
                slot=$slot;manifestPath=$manifestPath;manifestSha256=$manifestSha
                sidecarPath=$sidecarPath;sidecarSha256=$sidecarSha
                expectedName=$expectedName;actualName=$actualName
                expectedCodePoints=$expectedPoints;actualCodePoints=$actualPoints
                sourcePath=$sourcePath;sourceRelativePath=$sourceItem.Name;sourceSha256=$sourceSha
                payloadPath=$payloadPath;payloadRelativePath=$payloadItem.Name;payloadSha256=$payloadSha
                unicodeCopiedEntryCount=$matches.Count;unicodeAbsentEntryCount=$absent.Count
                duplicatePathCount=0;sourcePayloadHashesEqual=$true;passed=$true
            })
        }
        if ($receipt['captures'].Count -ne 2) {throw 'Both Unicode success captures were not checked'}
        $receipt['allPassed']=$true
    } catch {
        $receipt['failureStage']='UNICODE_ROUNDTRIP'
        $receipt['failureMessage']=$_.Exception.Message
    }
    Write-JsonOnce $receiptPath $receipt
    $script:UnicodeHash=Get-Sha256 $receiptPath
    $persisted=Read-Utf8Json $receiptPath
    if ([bool]$persisted.allPassed -ne [bool]$receipt['allPassed'] -or $persisted.expectedName -cne $expectedName -or @($persisted.captures).Count -ne @($receipt['captures']).Count) {throw 'Persisted Unicode receipt differs from in-memory proof'}
    if (-not $receipt['allPassed']) {throw "Unicode round-trip failed: $($receipt['failureMessage'])"}
    return $receipt
}

try {
    $script:Stage='FRESHNESS'
    if ($Phase -ne 'Execute') {throw 'Only Execute phase is authorized'}
    if ($PSVersionTable.PSVersion.Major -ne 5 -or $PSVersionTable.PSVersion.Minor -ne 1) {throw 'Harness requires Windows PowerShell 5.1'}
    if (-not (Get-CanonicalPath $PSCommandPath).Equals((Get-CanonicalPath (Join-Path $script:Attempt 'attempt-harness.ps1')),[StringComparison]::OrdinalIgnoreCase)) {throw 'Harness is not at exact attempt-01 path'}
    if (-not [IO.Directory]::Exists($script:Attempt)) {throw 'Fresh attempt parent absent'}
    Assert-OutputPath $script:Attempt
    $initial=@(Get-ChildItem -LiteralPath $script:Attempt -Force)
    if ($initial.Count -ne 1 -or $initial[0].Name -ne 'attempt-harness.ps1') {throw 'Attempt-01 was not fresh at harness initialization'}
    if (-not [IO.File]::Exists($script:WorktreeScript)) {throw 'Allowed worktree candidate absent'}
    $script:Stage='SNAPSHOT'
    $script:HarnessHash=Get-Sha256 $PSCommandPath
    Assert-OutputPath $script:Snapshot
    if (Test-Path -LiteralPath $script:Snapshot) {throw 'Snapshot already exists'}
    [IO.File]::Copy($script:WorktreeScript,$script:Snapshot,$false)
    $script:SnapshotHash=Get-Sha256 $script:Snapshot
    if ($script:SnapshotHash -ne (Get-Sha256 $script:WorktreeScript) -or $script:SnapshotHash -ne '4DA71D15D87F2C95AEB4D6D848504600FE808B2314761BF8CBC9C9210469C9A8') {throw 'Snapshot/candidate pinned hash mismatch'}
    $script:Stage='DELETED_PRESENCE_MATRIX'
    $matrix=Invoke-DeletedPresenceMatrix $script:Snapshot
    $matrixPath=Join-Path $script:Attempt 'deleted-presence-matrix-receipt.json'
    Write-JsonOnce $matrixPath $matrix
    $script:MatrixHash=Get-Sha256 $matrixPath
    if (-not $matrix['allPassed']) {throw "Deleted-presence matrix failed: $($matrix['extractionError'])"}
    $script:Stage='PREFLIGHT_AND_COMMAND_CONTRACT'
    $success=Join-Path $script:Attempt 'fixture-success-source'
    $internal=Join-Path $script:Attempt 'fixture-internal-link-source'
    $script:Commands=@(
        (New-Command 'FixtureSuccess' $success (Join-Path $script:Attempt 'captures/success-a')),
        (New-Command 'FixtureSuccess' $success (Join-Path $script:Attempt 'captures/success-b')),
        (New-Command 'ExpectedInternalLink' $internal (Join-Path $script:Attempt 'expected/internal-link-stop')),
        (New-Command 'ExpectedPathEscape' $success (Join-Path $script:Attempt 'expected/path-escape-stop'))
    )
    $contract=[ordered]@{
        schemaVersion='w0-p01r-r3-command-contract-v2';attempt='attempt-01'
        harnessSha256=$script:HarnessHash;snapshotSha256=$script:SnapshotHash
        deletedPresenceMatrixReceiptSha256=$script:MatrixHash
        candidateInvocationCount=4;commands=$script:Commands
        plannedUnicodeFilename=('caf' + [char]0x00E9 + ' plan.txt')
        replacedR2Slot='regular.txt';unicodeRoundTripReceiptSchema='w0-p01r-r3-unicode-roundtrip-v1'
        sourceCaptureInvoked=$false;protectedSourceAccess=$false;remoteOperations=$false
    }
    Write-JsonOnce (Join-Path $script:Attempt 'command-contract.json') $contract
    $checks=Assert-InMemoryPreflight $script:Snapshot
    $preflight=[ordered]@{
        schemaVersion='w0-p01r-r3-preflight-v2';attempt='attempt-01'
        startedAtUtc=$script:StartedAt;completedAtUtc=[DateTime]::UtcNow.ToString('o')
        harnessSha256=$script:HarnessHash;snapshotSha256=$script:SnapshotHash
        deletedPresenceMatrixReceiptSha256=$script:MatrixHash
        checks=$checks;fixtureLayoutExists=$false;candidateInvocations=0
        plannedUnicodeFilename=('caf' + [char]0x00E9 + ' plan.txt')
        plannedUnicodeCodePoints=@(99,97,102,233,32,112,108,97,110,46,116,120,116)
        replacedR2Slot='regular.txt';unicodeRoundTripReceiptSchema='w0-p01r-r3-unicode-roundtrip-v1'
        unicodeRoundTripReceiptSha256=$null
        builderIdentity=[ordered]@{taskId=$script:TaskId;sessionId=$script:SessionId;verifiedNativeModel='gpt-5.6-sol';verifiedEffort='xhigh'}
        protectedSourceAccess=$false;remoteOperations=$false
    }
    Write-JsonOnce (Join-Path $script:Attempt 'preflight-receipt.json') $preflight
    $commandReceipt=[ordered]@{
        schemaVersion='w0-p01r-r3-command-plan-v2';attempt='attempt-01'
        createdAtUtc=[DateTime]::UtcNow.ToString('o')
        harnessSha256=$script:HarnessHash;snapshotSha256=$script:SnapshotHash
        deletedPresenceMatrixReceiptSha256=$script:MatrixHash
        contractSha256=(Get-Sha256 (Join-Path $script:Attempt 'command-contract.json'))
        preflightSha256=(Get-Sha256 (Join-Path $script:Attempt 'preflight-receipt.json'))
        plannedCommands=@($script:Commands);executedAtCreation=0
        plannedUnicodeFilename=('caf' + [char]0x00E9 + ' plan.txt')
        unicodeRoundTripReceiptSchema='w0-p01r-r3-unicode-roundtrip-v1'
        protectedSourceAccess=$false;remoteOperations=$false
    }
    Write-JsonOnce (Join-Path $script:Attempt 'command-receipt.json') $commandReceipt
    $env:R3_BUILDER_TASK_ID=$script:TaskId
    $env:R3_BUILDER_SESSION_ID=$script:SessionId
    for ($index=0;$index -lt $script:Commands.Count;$index++) {
        $script:Stage="CHILD_$($index+1)"
        Invoke-Child $script:Commands[$index] ($index+1)
    }
    $script:Stage='UNICODE_ROUNDTRIP'
    Invoke-UnicodeRoundTrip | Out-Null
    $script:Stage='FINAL_EVIDENCE'
    $evidence=Assert-FinalEvidence
    $script:Stage='SUCCESS_OUTCOME'
    $successReceipt=[ordered]@{
        schemaVersion='w0-p01r-r3-outcome-v2';status='ENDED_SUCCESS';attempt='attempt-01'
        startedAtUtc=$script:StartedAt;completedAtUtc=[DateTime]::UtcNow.ToString('o')
        harnessSha256=$script:HarnessHash;snapshotSha256=$script:SnapshotHash
        deletedPresenceMatrixReceiptSha256=$script:MatrixHash
        unicodeRoundTripReceiptSha256=$script:UnicodeHash
        commandContractSha256=(Get-Sha256 (Join-Path $script:Attempt 'command-contract.json'))
        preflightReceiptSha256=(Get-Sha256 (Join-Path $script:Attempt 'preflight-receipt.json'))
        commandReceiptSha256=(Get-Sha256 (Join-Path $script:Attempt 'command-receipt.json'))
        childResults=$script:Results.ToArray();evidenceSha256=$evidence
        attemptInventoryBeforeOutcome=@(Get-AttemptInventory)
        protectedSourceAccess=$false;sourceGitAccess=$false;remoteOperations=$false
        sourceCaptureInvoked=$false;stagingOrCommit=$false
    }
    Write-JsonOnce (Join-Path $script:Attempt 'success-receipt.json') $successReceipt
    $script:OutcomeWritten=$true
    Set-CurrentEvidenceReadOnly 'success-receipt.json'
} catch {
    $errorRecord=[ordered]@{
        message=$_.Exception.Message;fullyQualifiedErrorId=$_.FullyQualifiedErrorId
        scriptStackTrace=$_.ScriptStackTrace;category=[string]$_.CategoryInfo.Category
    }
    if (-not $script:OutcomeWritten) {
        $unicodeReceiptPath=Join-Path $script:Attempt 'unicode-roundtrip-receipt.json'
        if ($null -eq $script:UnicodeHash -and [IO.File]::Exists($unicodeReceiptPath)) {$script:UnicodeHash=Get-Sha256 $unicodeReceiptPath}
        $failure=[ordered]@{
            schemaVersion='w0-p01r-r3-outcome-v2';status='ENDED_FAILED';attempt='attempt-01'
            startedAtUtc=$script:StartedAt;completedAtUtc=[DateTime]::UtcNow.ToString('o')
            harnessSha256=$script:HarnessHash;snapshotSha256=$script:SnapshotHash
            deletedPresenceMatrixReceiptSha256=$script:MatrixHash
            unicodeRoundTripReceiptSha256=$script:UnicodeHash;failureStage=$script:Stage
            childResults=$script:Results.ToArray();error=$errorRecord
            attemptInventoryBeforeOutcome=@(Get-AttemptInventory)
            protectedSourceAccess=$false;sourceGitAccess=$false;remoteOperations=$false
            sourceCaptureInvoked=$false;stagingOrCommit=$false
        }
        Write-JsonOnce (Join-Path $script:Attempt 'failure-receipt.json') $failure
        $script:OutcomeWritten=$true
        Set-CurrentEvidenceReadOnly 'failure-receipt.json'
    }
    throw
}
~~~
