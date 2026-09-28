[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('FixtureSuccess','ExpectedInternalLink','ExpectedPathEscape','SourceCapture')]
    [string]$Mode,
    [string]$FixtureRoot,
    [string]$SourceRoot,
    [string]$CaptureRoot,
    [string]$PatentRoot,
    [string]$DoctrineRoot,
    [string]$ExpectedToolSha256
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:R3Root = 'D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r3-fixture-proof-20260913'
$script:SRoot = 'D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260913-w0-p01r-source-capture-01'
$script:Patent = 'D:/Repos/keon-omega/keon-docs-internal/patents'
$script:Doctrine = 'D:/Repos/keon-omega/keon-doctrine'
$script:ReviewA = 'D:/Repos/agent-skills-worktrees/provisional-patent-readiness-20260813/plugins/foreman-line/docs/goals/provisional-patent-readiness/handoffs/W0-P01R-R3-F-review-A-accept.json'
$script:ReviewB = 'D:/Repos/agent-skills-worktrees/provisional-patent-readiness-20260813/plugins/foreman-line/docs/goals/provisional-patent-readiness/handoffs/W0-P01R-R3-F-review-B-accept.json'
$script:A1Names = @('node_modules','bin','obj','.next','.artifacts','.vs','.venv','dist','packages','.turbo','.nuget','TestResults')

function Get-CanonicalPath([string]$Path) {
    if ([string]::IsNullOrWhiteSpace($Path)) { throw 'Empty path' }
    $full = [IO.Path]::GetFullPath($Path)
    $volume = [IO.Path]::GetPathRoot($full)
    if ($full.Equals($volume,[StringComparison]::OrdinalIgnoreCase)) { return $volume }
    return $full.TrimEnd([char[]]@([IO.Path]::DirectorySeparatorChar,[IO.Path]::AltDirectorySeparatorChar))
}
function Test-WithinRoot([string]$Path,[string]$Root) {
    $candidate = Get-CanonicalPath $Path
    $allowed = Get-CanonicalPath $Root
    if ($candidate.Equals($allowed,[StringComparison]::OrdinalIgnoreCase)) { return $true }
    $prefix = if ($allowed.EndsWith('\')) { $allowed } else { $allowed + '\' }
    return $candidate.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)
}
function Assert-ExactPath([string]$Actual,[string]$Expected,[string]$Label) {
    if (-not (Get-CanonicalPath $Actual).Equals((Get-CanonicalPath $Expected),[StringComparison]::OrdinalIgnoreCase)) { throw "Unexpected $Label path: $Actual" }
}
function Get-AncestorChain([string]$Path) {
    $cursor = Get-CanonicalPath $Path
    $volume = [IO.Path]::GetPathRoot($cursor)
    $seen = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    $chain = New-Object 'System.Collections.Generic.List[string]'
    for ($depth=0; $depth -lt 260; $depth++) {
        if (-not $seen.Add($cursor)) { throw "Repeated output ancestor: $cursor" }
        $chain.Add($cursor)
        if ($cursor.Equals($volume,[StringComparison]::OrdinalIgnoreCase)) { return $chain.ToArray() }
        $next = [IO.Path]::GetDirectoryName($cursor)
        if ([string]::IsNullOrWhiteSpace($next)) { throw "Ancestor chain ended before volume root: $cursor" }
        $cursor = Get-CanonicalPath $next
    }
    throw 'Output ancestor depth exceeds 260'
}
function Assert-OutputPath([string]$Path,[string]$AuthorizedRoot) {
    if (-not (Test-WithinRoot $Path $AuthorizedRoot)) { throw "Output path escapes authorized root: $Path" }
    $chain = @(Get-AncestorChain $Path)
    [array]::Reverse($chain)
    foreach ($ancestor in $chain) {
        if ([IO.File]::Exists($ancestor) -or [IO.Directory]::Exists($ancestor)) {
            $attributes = [IO.File]::GetAttributes($ancestor)
            if (($attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Reparse point in output ancestor chain: $ancestor" }
        }
    }
}
function Assert-SourcePath([string]$Path,[switch]$AllowTerminalReparse) {
    $chain = @(Get-AncestorChain $Path)
    [array]::Reverse($chain)
    $terminal = Get-CanonicalPath $Path
    foreach ($ancestor in $chain) {
        try { $attributes = [IO.File]::GetAttributes($ancestor) }
        catch { throw "Source path component unavailable: $ancestor" }
        if (($attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            if ($AllowTerminalReparse -and $ancestor.Equals($terminal,[StringComparison]::OrdinalIgnoreCase)) { return }
            throw "Reparse point in source ancestor chain: $ancestor"
        }
    }
}
function Ensure-Directory([string]$Path,[string]$AuthorizedRoot) {
    Assert-OutputPath $Path $AuthorizedRoot
    if ([IO.Directory]::Exists($Path)) { return }
    if ([IO.File]::Exists($Path)) { throw "File blocks directory: $Path" }
    $parent = [IO.Path]::GetDirectoryName((Get-CanonicalPath $Path))
    if (-not [IO.Directory]::Exists($parent)) { Ensure-Directory $parent $AuthorizedRoot }
    Assert-OutputPath $Path $AuthorizedRoot
    [IO.Directory]::CreateDirectory($Path) | Out-Null
}
function Write-TextOnce([string]$Path,[string]$Text,[string]$AuthorizedRoot) {
    Assert-OutputPath $Path $AuthorizedRoot
    if ([IO.File]::Exists($Path) -or [IO.Directory]::Exists($Path)) { throw "Create-once destination exists: $Path" }
    Ensure-Directory ([IO.Path]::GetDirectoryName((Get-CanonicalPath $Path))) $AuthorizedRoot
    Assert-OutputPath $Path $AuthorizedRoot
    $encoding = [Text.UTF8Encoding]::new($false)
    $stream = [IO.File]::Open($Path,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    try {
        $bytes = $encoding.GetBytes($Text)
        $stream.Write($bytes,0,$bytes.Length)
    } finally { $stream.Dispose() }
}
function Write-JsonOnce([string]$Path,[object]$Value,[string]$AuthorizedRoot) {
    Write-TextOnce $Path ($Value | ConvertTo-Json -Depth 40) $AuthorizedRoot
}
function Read-Utf8Text([string]$Path) {
    # PS 5.1's bare Get-Content may decode BOM-less UTF-8 as the local ANSI page.
    # Throw on malformed UTF-8 instead of replacing bytes and accepting false paths.
    Assert-SourcePath $Path
    $encoding = [Text.UTF8Encoding]::new($false,$true)
    return [IO.File]::ReadAllText($Path,$encoding)
}
function Read-Utf8Json([string]$Path) {
    return (Read-Utf8Text $Path | ConvertFrom-Json)
}
function Get-Sha256([string]$Path) { return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToUpperInvariant() }
function Get-TextSha256([string]$Text) {
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($Text)))).Replace('-','') }
    finally { $sha.Dispose() }
}
function Get-AclObservation([string]$Path) {
    $acl = Get-Acl -LiteralPath $Path
    $rules = @($acl.Access | ForEach-Object {
        [ordered]@{
            identity=[string]$_.IdentityReference;rights=[string]$_.FileSystemRights
            type=[string]$_.AccessControlType;isInherited=[bool]$_.IsInherited
            inheritanceFlags=[string]$_.InheritanceFlags;propagationFlags=[string]$_.PropagationFlags
        }
    })
    if ([string]::IsNullOrWhiteSpace([string]$acl.Owner) -or [string]::IsNullOrWhiteSpace([string]$acl.Sddl)) { throw "Output-parent ACL observation incomplete: $Path" }
    return [ordered]@{path=$Path;owner=[string]$acl.Owner;sddl=[string]$acl.Sddl;accessRules=$rules}
}
function Get-RelativePath([string]$Root,[string]$Path) {
    $rootFull = Get-CanonicalPath $Root
    $itemFull = Get-CanonicalPath $Path
    if ($itemFull.Equals($rootFull,[StringComparison]::OrdinalIgnoreCase)) { return '' }
    if (-not (Test-WithinRoot $itemFull $rootFull)) { throw "Relative path escapes source root: $Path" }
    $prefix = if ($rootFull.EndsWith('\')) { $rootFull } else { $rootFull + '\' }
    return $itemFull.Substring($prefix.Length).Replace('\','/')
}
function Assert-FInput([string]$Path,[string]$Attempt) {
    if (-not (Test-WithinRoot $Path $Attempt)) { throw "F input outside exact attempt: $Path" }
    foreach ($protected in @($script:Patent,$script:Doctrine)) {
        if (Test-WithinRoot $Path $protected) { throw "Protected F source: $Path" }
    }
}
function New-Entry([string]$Relative,[string]$EntryType,[string]$Classification) {
    return [ordered]@{
        relativePath=$Relative; entryType=$EntryType; classification=$Classification
        traversed=$false; byteLength=$null; sourceSha256=$null; payloadSha256=$null
        copyResult=$null; reason=$null; immediateEntryCount=$null; enumerationError=$null
        linkType=$null; resolvedTarget=$null; targetWithinRoot=$null
    }
}
function Resolve-GitPathIdentity {
    param([string]$GitPath,[string]$ObservedPath)
    # Git's C-quoted path is UTF-8 bytes, not a filename containing quote characters.
    if ([string]::IsNullOrEmpty($GitPath)) { return [ordered]@{status='UNRESOLVED_IDENTITY';relativePath=$null;reason='EMPTY_GIT_PATH'} }
    $startsQuote = $GitPath.StartsWith('"',[StringComparison]::Ordinal)
    $endsQuote = $GitPath.EndsWith('"',[StringComparison]::Ordinal)
    if ($startsQuote -ne $endsQuote -or ($startsQuote -and $GitPath.Length -lt 2)) {
        return [ordered]@{status='UNRESOLVED_IDENTITY';relativePath=$null;reason='UNBALANCED_GIT_QUOTE'}
    }
    try {
        if ($startsQuote) {
            $body = $GitPath.Substring(1,$GitPath.Length-2)
            $bytes = [System.Collections.Generic.List[byte]]::new()
            $plain = [Text.StringBuilder]::new()
            $utf8 = [Text.UTF8Encoding]::new($false,$true)
            for ($i=0; $i -lt $body.Length; $i++) {
                $ch = $body[$i]
                if ($ch -ne '\') { [void]$plain.Append($ch); continue }
                if ($plain.Length -gt 0) {
                    $bytes.AddRange($utf8.GetBytes($plain.ToString()))
                    [void]$plain.Clear()
                }
                $i++
                if ($i -ge $body.Length) { throw 'TRAILING_GIT_ESCAPE' }
                $escape = [string]$body[$i]
                if ($escape -match '^[0-7]$') {
                    if ($i+2 -ge $body.Length) { throw 'SHORT_GIT_OCTAL' }
                    $octal = $body.Substring($i,3)
                    if ($octal -notmatch '^[0-7]{3}$') { throw 'INVALID_GIT_OCTAL' }
                    $bytes.Add([byte][Convert]::ToInt32($octal,8))
                    $i += 2
                } else {
                    switch ($escape) {
                        '\' { $bytes.Add([byte]92) }
                        '"' { $bytes.Add([byte]34) }
                        'a' { $bytes.Add([byte]7) }
                        'b' { $bytes.Add([byte]8) }
                        'f' { $bytes.Add([byte]12) }
                        'n' { $bytes.Add([byte]10) }
                        'r' { $bytes.Add([byte]13) }
                        't' { $bytes.Add([byte]9) }
                        'v' { $bytes.Add([byte]11) }
                        default { throw 'UNKNOWN_GIT_ESCAPE' }
                    }
                }
            }
            if ($plain.Length -gt 0) { $bytes.AddRange($utf8.GetBytes($plain.ToString())) }
            $decoded = $utf8.GetString($bytes.ToArray())
        } else { $decoded = $GitPath }
    } catch {
        return [ordered]@{status='UNRESOLVED_IDENTITY';relativePath=$null;reason=[string]$_.Exception.Message}
    }
    if ([string]::IsNullOrEmpty($decoded) -or $decoded.StartsWith('/',[StringComparison]::Ordinal) -or
        $decoded.Contains('\') -or $decoded.Contains(':') -or $decoded.IndexOf([char]0) -ge 0) {
        return [ordered]@{status='UNRESOLVED_IDENTITY';relativePath=$null;reason='UNSAFE_RELATIVE_PATH'}
    }
    foreach ($part in $decoded.Split([char[]]@('/'))) {
        if ([string]::IsNullOrEmpty($part) -or $part -eq '.' -or $part -eq '..') {
            return [ordered]@{status='UNRESOLVED_IDENTITY';relativePath=$null;reason='UNSAFE_RELATIVE_COMPONENT'}
        }
    }
    if ($PSBoundParameters.ContainsKey('ObservedPath') -and
        -not $decoded.Equals($ObservedPath,[StringComparison]::OrdinalIgnoreCase)) {
        return [ordered]@{status='UNRESOLVED_IDENTITY';relativePath=$null;reason='OBSERVED_PATH_MISMATCH'}
    }
    return [ordered]@{status='RESOLVED';relativePath=$decoded;reason=$null}
}
function Resolve-DeletedPresence {
    param([object[]]$GitFacts,[object[]]$Inventory,[object[]]$PresenceObservations)
    # All arguments are in-memory facts. No filesystem, Git, environment or candidate mode is consulted.
    $merged = [System.Collections.Generic.Dictionary[string,object]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($fact in $GitFacts) {
        $identity = Resolve-GitPathIdentity ([string]$fact['rawPath'])
        if ($identity['status'] -ne 'RESOLVED') {
            return [ordered]@{status='UNRESOLVED_IDENTITY';decisions=@();counts=$null;reason=$identity['reason']}
        }
        $relative = [string]$identity['relativePath']
        if (-not [bool]$fact['stagedDeleted'] -and -not [bool]$fact['unstagedDeleted']) {
            return [ordered]@{status='UNRESOLVED_GIT_FACT';decisions=@();counts=$null;reason='MISSING_DELETION_FLAG'}
        }
        if (-not $merged.ContainsKey($relative)) {
            $merged.Add($relative,[ordered]@{relativePath=$relative;stagedDeleted=$false;unstagedDeleted=$false;rawGitPaths=[System.Collections.Generic.List[string]]::new()})
        }
        $record = $merged[$relative]
        $record['stagedDeleted'] = [bool]$record['stagedDeleted'] -or [bool]$fact['stagedDeleted']
        $record['unstagedDeleted'] = [bool]$record['unstagedDeleted'] -or [bool]$fact['unstagedDeleted']
        $record['rawGitPaths'].Add([string]$fact['rawPath'])
    }
    $decisions = [System.Collections.Generic.List[object]]::new()
    $counts = [ordered]@{copiedFile=0;absentTracked=0;boundaryPreserved=0;unresolved=0}
    [string[]]$orderedPaths = @($merged.Keys)
    [Array]::Sort($orderedPaths,[StringComparer]::OrdinalIgnoreCase)
    foreach ($relative in $orderedPaths) {
        $record = $merged[$relative]
        $observedEntry = $null
        $boundary = $null
        $boundaryIsExact = $false
        foreach ($entry in $Inventory) {
            $path = [string]$entry['relativePath']
            if ($relative.Equals($path,[StringComparison]::OrdinalIgnoreCase)) { $observedEntry = $entry }
            if (@('EXCLUDED','LINK_OPAQUE','LINK_INTERNAL') -contains [string]$entry['classification']) {
                if ($relative.Equals($path,[StringComparison]::OrdinalIgnoreCase)) { $boundary=$entry; $boundaryIsExact=$true }
                elseif ($relative.StartsWith(($path+'/'),[StringComparison]::OrdinalIgnoreCase)) { $boundary=$entry }
            }
        }
        $observation = $null
        foreach ($candidate in $PresenceObservations) {
            if ($relative.Equals([string]$candidate['relativePath'],[StringComparison]::OrdinalIgnoreCase)) {
                if ($null -ne $observation) { return [ordered]@{status='UNRESOLVED_OBSERVATION';decisions=@();counts=$null;reason='DUPLICATE_PRESENCE_OBSERVATION'} }
                $observation = $candidate
            }
        }
        $disposition = 'UNRESOLVED_OBSERVATION'
        if ($null -ne $boundary) {
            if ($boundaryIsExact) { $disposition='BOUNDARY_PRESERVED'; $counts['boundaryPreserved']++ }
            else { $disposition='UNRESOLVED_BOUNDARY'; $counts['unresolved']++ }
        } elseif ($null -eq $observation) { $counts['unresolved']++ }
        elseif ($observation['state'] -eq 'REGULAR_FILE' -and $null -ne $observedEntry -and
            $observedEntry['entryType'] -eq 'REGULAR_FILE' -and $observedEntry['classification'] -eq 'REGULAR') {
            $disposition='COPIED_FILE'; $counts['copiedFile']++
        } elseif ($observation['state'] -eq 'ABSENT' -and $null -eq $observedEntry) {
            $disposition='ABSENT_TRACKED'; $counts['absentTracked']++
        } else { $counts['unresolved']++ }
        $decisions.Add([ordered]@{relativePath=$relative;disposition=$disposition;stagedDeleted=[bool]$record['stagedDeleted'];unstagedDeleted=[bool]$record['unstagedDeleted'];rawGitPaths=$record['rawGitPaths'].ToArray();boundaryPath=$(if($null -ne $boundary){[string]$boundary['relativePath']}else{$null})})
    }
    $status = if ($counts['unresolved'] -gt 0) { 'UNRESOLVED_PRESENCE' } else { 'RESOLVED' }
    return [ordered]@{status=$status;decisions=$decisions.ToArray();counts=$counts;reason=$(if($status -eq 'RESOLVED'){$null}else{'PRESENCE_NOT_PROVEN'})}
}
function Assert-SchemaSmoke {
    $entry = New-Entry 'probe.txt' 'REGULAR_FILE' 'REGULAR'
    $known = 'A' * 64
    $entry['payloadSha256'] = $known
    if ($entry['payloadSha256'] -ne $known) { throw 'Writable payloadSha256 smoke test failed' }
    foreach ($field in @('relativePath','entryType','classification','traversed','byteLength','sourceSha256','payloadSha256','copyResult','reason','immediateEntryCount','enumerationError','linkType','resolvedTarget','targetWithinRoot')) {
        if (-not $entry.Contains($field)) { throw "Missing entry field $field" }
    }
    $list = New-Object 'System.Collections.Generic.List[object]'
    $list.Add($entry)
    if ($list.ToArray().Count -ne 1 -or $list.ToArray()[0]['payloadSha256'] -ne $known) { throw 'Generic.List ToArray regression' }
}
function Assert-Preflight {
    $tokens = $null; $errors = $null
    [System.Management.Automation.Language.Parser]::ParseFile($PSCommandPath,[ref]$tokens,[ref]$errors) | Out-Null
    if ($errors.Count -ne 0) { throw "Candidate parser errors: $($errors.Count)" }
    Assert-SchemaSmoke
    $chain = @(Get-AncestorChain 'D:/synthetic-proof')
    if ($chain.Count -lt 2 -or -not $chain[-1].Equals('D:\',[StringComparison]::OrdinalIgnoreCase) -or $chain -contains 'D:') { throw 'Drive-root ancestor regression' }
    if (Test-WithinRoot 'D:/synthetic-proof-outside' 'D:/synthetic-proof') { throw 'Output prefix escape regression' }
    if ([string]::IsNullOrWhiteSpace($env:R3_BUILDER_TASK_ID) -or [string]::IsNullOrWhiteSpace($env:R3_BUILDER_SESSION_ID)) { throw 'Builder task/session identity missing' }
    if ($Mode -eq 'SourceCapture') {
        if ($FixtureRoot -or $SourceRoot) { throw 'SourceCapture forbids FixtureRoot/SourceRoot arguments' }
        foreach ($x in @($PatentRoot,$DoctrineRoot,$CaptureRoot,$ExpectedToolSha256)) { if ([string]::IsNullOrWhiteSpace($x)) { throw 'Missing SourceCapture argument' } }
    } else {
        foreach ($x in @($FixtureRoot,$SourceRoot,$CaptureRoot)) { if ([string]::IsNullOrWhiteSpace($x)) { throw 'Missing F argument' } }
        if ($PatentRoot -or $DoctrineRoot -or $ExpectedToolSha256) { throw 'F forbids S arguments' }
    }
}
function Get-LinkTarget([object]$Item) {
    $property = $Item.PSObject.Properties['Target']
    if ($null -eq $property -or $null -eq $property.Value) { return $null }
    $target = @($property.Value)[0]
    if ([string]::IsNullOrWhiteSpace([string]$target)) { return $null }
    $lexical = [string]$target
    if (-not [IO.Path]::IsPathRooted($lexical)) {
        $lexical = Join-Path ([IO.Path]::GetDirectoryName((Get-CanonicalPath $Item.FullName))) $lexical
    }
    return Get-CanonicalPath $lexical
}
function Get-Inventory([string]$Root) {
    Assert-SourcePath $Root
    if (-not [IO.Directory]::Exists($Root)) { throw "Source directory absent: $Root" }
    $entries = New-Object 'System.Collections.Generic.List[object]'
    $stack = New-Object 'System.Collections.Generic.Stack[string]'
    $stack.Push((Get-CanonicalPath $Root))
    while ($stack.Count -gt 0) {
        $directory = $stack.Pop()
        Assert-SourcePath $directory
        foreach ($item in @(Get-ChildItem -LiteralPath $directory -Force -ErrorAction Stop | Sort-Object Name)) {
            Assert-SourcePath $item.FullName -AllowTerminalReparse
            $relative = Get-RelativePath $Root $item.FullName
            $isLink = (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)
            if ($item.PSIsContainer -and $script:A1Names -contains $item.Name) {
                $entry = New-Entry $relative 'DIRECTORY' 'EXCLUDED'
                $entry['reason'] = 'BUILD_EPHEMERA'
                if ($isLink) { $entry['enumerationError'] = 'REPARSE_EXCLUDED_NOT_ENUMERATED' }
                else {
                    try { $entry['immediateEntryCount'] = @(Get-ChildItem -LiteralPath $item.FullName -Force -ErrorAction Stop).Count }
                    catch { $entry['enumerationError'] = $_.Exception.Message }
                }
                $entries.Add($entry); continue
            }
            if ($item.Name -eq '.git') {
                $entry = New-Entry $relative $(if ($item.PSIsContainer) {'DIRECTORY'} else {'REGULAR_FILE'}) 'EXCLUDED'
                $entry['reason'] = 'GIT_METADATA'
                $entries.Add($entry); continue
            }
            if ($isLink) {
                $entry = New-Entry $relative 'REPARSE_POINT' 'LINK_OPAQUE'
                $entry['linkType'] = if ($item.PSObject.Properties['LinkType']) {[string]$item.LinkType} else {'UNKNOWN'}
                $target = Get-LinkTarget $item
                $entry['resolvedTarget'] = $target
                if ($null -ne $target) {
                    $inside = Test-WithinRoot $target $Root
                    $entry['targetWithinRoot'] = $inside
                    if ($inside) { $entry['classification'] = 'LINK_INTERNAL' }
                } else { $entry['targetWithinRoot'] = 'UNKNOWN' }
                $entries.Add($entry); continue
            }
            if ($item.PSIsContainer) {
                $entry = New-Entry $relative 'DIRECTORY' 'DIRECTORY'
                $entry['traversed'] = $true
                $entries.Add($entry)
                $stack.Push($item.FullName)
            } else {
                Assert-SourcePath $item.FullName
                $entry = New-Entry $relative 'REGULAR_FILE' 'REGULAR'
                $entry['byteLength'] = [long]$item.Length
                $entry['sourceSha256'] = Get-Sha256 $item.FullName
                $entries.Add($entry)
            }
        }
    }
    return @($entries.ToArray() | Sort-Object {$_['relativePath']})
}
function Get-InventoryDigest([object[]]$Inventory) { return Get-TextSha256 ($Inventory | ConvertTo-Json -Depth 25 -Compress) }
function Get-DeletedPresenceObservations([string]$Root,[object[]]$Inventory,[object[]]$GitFacts) {
    # This is S-only I/O. First prove every parent was traversed; never probe through
    # an EXCLUDED, LINK_OPAQUE, or LINK_INTERNAL boundary to settle a Git deletion.
    $results = [System.Collections.Generic.List[object]]::new()
    $seen = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($fact in $GitFacts) {
        $identity = Resolve-GitPathIdentity ([string]$fact['rawPath'])
        if ($identity['status'] -ne 'RESOLVED') { throw "Unresolved Git path identity: $($identity['reason'])" }
        $relative = [string]$identity['relativePath']
        if (-not $seen.Add($relative)) { continue }
        $boundary = $null
        foreach ($entry in $Inventory) {
            $path = [string]$entry['relativePath']
            if (@('EXCLUDED','LINK_OPAQUE','LINK_INTERNAL') -contains [string]$entry['classification']) {
                if ($relative.Equals($path,[StringComparison]::OrdinalIgnoreCase) -or
                    $relative.StartsWith(($path+'/'),[StringComparison]::OrdinalIgnoreCase)) { $boundary=$path; break }
            }
        }
        if ($null -ne $boundary) {
            $state = if ($relative.Equals($boundary,[StringComparison]::OrdinalIgnoreCase)) { 'BOUNDARY' } else { 'UNOBSERVED' }
            $results.Add([ordered]@{relativePath=$relative;state=$state;boundaryPath=$boundary})
            continue
        }
        $parts = $relative.Split([char[]]@('/'))
        $eligible = $true
        for ($i=1; $i -lt $parts.Length; $i++) {
            $parentRelative = ($parts[0..($i-1)] -join '/')
            $parentEntry = $null
            foreach ($entry in $Inventory) {
                if ($parentRelative.Equals([string]$entry['relativePath'],[StringComparison]::OrdinalIgnoreCase)) { $parentEntry=$entry; break }
            }
            if ($null -eq $parentEntry -or $parentEntry['entryType'] -ne 'DIRECTORY' -or
                $parentEntry['classification'] -ne 'DIRECTORY' -or -not [bool]$parentEntry['traversed']) { $eligible=$false; break }
        }
        if (-not $eligible) {
            $results.Add([ordered]@{relativePath=$relative;state='UNOBSERVED';boundaryPath=$null})
            continue
        }
        $absolute = Join-Path $Root $relative
        if (-not (Test-WithinRoot $absolute $Root)) { throw "Git deletion escapes source root: $relative" }
        $parent = [IO.Path]::GetDirectoryName((Get-CanonicalPath $absolute))
        Assert-SourcePath $parent
        if (-not [IO.Directory]::Exists($parent)) { throw "Previously traversed deletion parent drifted: $relative" }
        try {
            $attributes = [IO.File]::GetAttributes($absolute)
            if (($attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { $state='REPARSE_POINT' }
            elseif (($attributes -band [IO.FileAttributes]::Directory) -ne 0) { $state='DIRECTORY' }
            else { $state='REGULAR_FILE' }
        } catch [IO.FileNotFoundException] {
            Assert-SourcePath $parent
            if (-not [IO.Directory]::Exists($parent)) { throw "Deletion parent drifted during absence check: $relative" }
            $state='ABSENT'
        }
        $results.Add([ordered]@{relativePath=$relative;state=$state;boundaryPath=$null})
    }
    return $results.ToArray()
}
function Get-LayoutDigest([string]$Attempt) {
    $layout = [ordered]@{
        success=@(Get-Inventory (Join-Path $Attempt 'fixture-success-source'))
        internal=@(Get-Inventory (Join-Path $Attempt 'fixture-internal-link-source'))
        referents=@(Get-Inventory (Join-Path $Attempt 'referents'))
    }
    return Get-TextSha256 ($layout | ConvertTo-Json -Depth 30 -Compress)
}
function Initialize-Fixture([string]$Attempt) {
    $receiptPath = Join-Path $Attempt 'fixture-layout-receipt.json'
    $names = @('fixture-success-source','fixture-internal-link-source','referents','captures','expected')
    if (-not [IO.File]::Exists($receiptPath)) {
        foreach ($name in $names) { if (Test-Path -LiteralPath (Join-Path $Attempt $name)) { throw "Fixture subroot not initially absent: $name" } }
        foreach ($name in $names) { Ensure-Directory (Join-Path $Attempt $name) $Attempt }
        $success = Join-Path $Attempt 'fixture-success-source'
        $internal = Join-Path $Attempt 'fixture-internal-link-source'
        $referents = Join-Path $Attempt 'referents'
        $unicodeName = 'caf' + [char]0x00E9 + ' plan.txt'
        Write-TextOnce (Join-Path $success $unicodeName) "synthetic success regular`n" $Attempt
        Ensure-Directory (Join-Path $success 'nested') $Attempt
        Write-TextOnce (Join-Path $success 'nested/nested.txt') "synthetic nested regular`n" $Attempt
        Ensure-Directory (Join-Path $success 'empty-directory') $Attempt
        foreach ($name in $script:A1Names) { Ensure-Directory (Join-Path $success $name) $Attempt }
        Ensure-Directory (Join-Path $referents 'external-target') $Attempt
        Write-TextOnce (Join-Path $referents 'external-target/target.txt') "synthetic external referent`n" $Attempt
        Ensure-Directory (Join-Path $internal 'authored-internal-target') $Attempt
        Write-TextOnce (Join-Path $internal 'authored-internal-target/target.txt') "synthetic internal referent`n" $Attempt
        $externalLink = Join-Path $success 'external-junction'
        $internalLink = Join-Path $internal 'internal-junction'
        Assert-OutputPath $externalLink $Attempt
        Assert-OutputPath $internalLink $Attempt
        New-Item -ItemType Junction -Path $externalLink -Target (Join-Path $referents 'external-target') -ErrorAction Stop | Out-Null
        New-Item -ItemType Junction -Path $internalLink -Target (Join-Path $internal 'authored-internal-target') -ErrorAction Stop | Out-Null
        $externalItem = Get-Item -LiteralPath $externalLink -Force
        $internalItem = Get-Item -LiteralPath $internalLink -Force
        if ((($externalItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0) -or (($internalItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0)) { throw 'Synthetic junction prerequisite failed' }
        $receipt = [ordered]@{schemaVersion='w0-p01r-r3-layout-v1'; attemptRoot=$Attempt; subroots=$names; rootRegularFile=$unicodeName; replacedR2Slot='regular.txt'; externalJunction=$externalLink; internalJunction=$internalLink; layoutSha256=(Get-LayoutDigest $Attempt)}
        Write-JsonOnce $receiptPath $receipt $Attempt
    } else {
        foreach ($name in $names) { if (-not [IO.Directory]::Exists((Join-Path $Attempt $name))) { throw "Fixture layout subroot missing: $name" } }
        $receipt = Read-Utf8Json $receiptPath
        if ($receipt.schemaVersion -ne 'w0-p01r-r3-layout-v1' -or $receipt.rootRegularFile -cne ('caf' + [char]0x00E9 + ' plan.txt') -or $receipt.replacedR2Slot -cne 'regular.txt') { throw 'R3 Unicode fixture layout receipt mismatch' }
        if ($receipt.layoutSha256 -ne (Get-LayoutDigest $Attempt)) { throw 'Fixture layout digest mismatch' }
    }
}
function New-Envelope([string]$InvocationMode,[string]$Attempt,[string]$InputRoot,[string]$OutputRoot) {
    return [ordered]@{
        schemaVersion='w0-p01r-r3-v1'; mode=$InvocationMode; toolSha256=(Get-Sha256 $PSCommandPath)
        fixtureRoot=$Attempt; sourceRoot=$InputRoot; captureRoot=$OutputRoot
        startedAtUtc=[DateTime]::UtcNow.ToString('o'); completedAtUtc=$null
        remoteOperations=$false; sourceStability=$null; counts=[ordered]@{}
        entries=@(); assertions=[ordered]@{}
        builderSessionIdentity=[ordered]@{taskId=$env:R3_BUILDER_TASK_ID;sessionId=$env:R3_BUILDER_SESSION_ID}
        outputParentAclOwner=$null
    }
}
function Write-SidecarAndVerify([string]$Manifest,[string]$AuthorizedRoot) {
    $sidecar = "$Manifest.sha256"
    $digest = Get-Sha256 $Manifest
    Write-TextOnce $sidecar "$digest  $([IO.Path]::GetFileName($Manifest))" $AuthorizedRoot
    $recorded = ((Read-Utf8Text $sidecar) -split ' ')[0]
    if ($recorded -ne (Get-Sha256 $Manifest)) { throw 'Sidecar verification failed' }
    return [ordered]@{manifestSha256=$digest;sidecarSha256=(Get-Sha256 $sidecar);sidecarPath=$sidecar}
}
function Assert-PersistedEntries([object[]]$Expected,[object[]]$Persisted,[string]$Label) {
    if ($Expected.Count -ne $Persisted.Count) { throw "$Label entry-count mismatch" }
    $seen = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    $fields = @('relativePath','entryType','classification','traversed','byteLength','sourceSha256','payloadSha256','copyResult','reason','immediateEntryCount','enumerationError','linkType','resolvedTarget','targetWithinRoot')
    for ($i=0; $i -lt $Expected.Count; $i++) {
        $left = $Expected[$i]
        $right = $Persisted[$i]
        foreach ($field in $fields) {
            if ($null -eq $right.PSObject.Properties[$field]) { throw "$Label entry $i missing $field" }
        }
        if ([string]$left['relativePath'] -cne [string]$right.relativePath) { throw "$Label entry $i path identity mismatch" }
        if (-not $seen.Add([string]$right.relativePath)) { throw "$Label duplicate path: $($right.relativePath)" }
        $leftJson = ConvertTo-Json -InputObject $left -Depth 15 -Compress
        $rightJson = ConvertTo-Json -InputObject $right -Depth 15 -Compress
        if ($leftJson -cne $rightJson) { throw "$Label entry $i persisted-field mismatch" }
    }
}
function Invoke-CustodyCapture([string]$InvocationMode,[string]$InputRoot,[string]$OutputRoot,[string]$AuthorizedRoot,[string]$Attempt,[string]$EscapeCandidate) {
    $outputParent = [IO.Path]::GetDirectoryName((Get-CanonicalPath $OutputRoot))
    Ensure-Directory $outputParent $AuthorizedRoot
    $envelope = New-Envelope $InvocationMode $Attempt $InputRoot $OutputRoot
    $envelope['outputParentAclOwner'] = Get-AclObservation $outputParent
    $pre = @(Get-Inventory $InputRoot)
    $preDigest = Get-InventoryDigest $pre
    $entries = New-Object 'System.Collections.Generic.List[object]'
    foreach ($entry in $pre) { $entries.Add($entry) }
    $envelope['entries'] = $entries.ToArray()
    $internal = @($pre | Where-Object { $_['classification'] -eq 'LINK_INTERNAL' })
    if ($InvocationMode -eq 'ExpectedPathEscape') {
        $caught = $null
        try { Assert-OutputPath $EscapeCandidate $AuthorizedRoot }
        catch { $caught = $_.Exception.Message }
        if ($null -eq $caught -or -not $caught.StartsWith('Output path escapes authorized root:',[StringComparison]::Ordinal)) { throw 'Path escape was not rejected by the common boundary validator' }
        $envelope['stopReason'] = 'PATH_ESCAPE'
        $envelope['assertions'] = [ordered]@{outsideCandidateRejected=$true;detail=$caught;acceptedCapture=$false}
        $postDigest = Get-InventoryDigest @(Get-Inventory $InputRoot)
        $envelope['sourceStability'] = [ordered]@{preSha256=$preDigest;postSha256=$postDigest;stable=($preDigest -eq $postDigest)}
        if ($preDigest -ne $postDigest) { throw 'Path-escape source inventory changed' }
        $envelope['counts'] = [ordered]@{sourceEntries=$pre.Count;payloadFiles=0}
        $envelope['completedAtUtc'] = [DateTime]::UtcNow.ToString('o')
        $stopFile = "$OutputRoot.json"
        Write-JsonOnce $stopFile $envelope $AuthorizedRoot
        return [ordered]@{stopped=$true;recordPath=$stopFile;recordSha256=(Get-Sha256 $stopFile)}
    }
    Assert-OutputPath $OutputRoot $AuthorizedRoot
    if ($internal.Count -gt 0) {
        if ($InvocationMode -ne 'ExpectedInternalLink') { throw 'LINK_INTERNAL requires stop before copy' }
        $envelope['stopReason'] = 'LINK_INTERNAL'
        $envelope['assertions'] = [ordered]@{internalLinkCount=$internal.Count;acceptedCapture=$false}
        $postDigest = Get-InventoryDigest @(Get-Inventory $InputRoot)
        $envelope['sourceStability'] = [ordered]@{preSha256=$preDigest;postSha256=$postDigest;stable=($preDigest -eq $postDigest)}
        $envelope['counts'] = [ordered]@{sourceEntries=$pre.Count;payloadFiles=0}
        $envelope['completedAtUtc'] = [DateTime]::UtcNow.ToString('o')
        $stopPath = Join-Path $OutputRoot 'stop-record.json'
        Write-JsonOnce $stopPath $envelope $AuthorizedRoot
        return [ordered]@{stopped=$true;recordPath=$stopPath;recordSha256=(Get-Sha256 $stopPath)}
    }
    if ($InvocationMode -eq 'ExpectedInternalLink') { throw 'Expected internal link absent' }
    if ([IO.Directory]::Exists($OutputRoot) -or [IO.File]::Exists($OutputRoot)) { throw "Capture root already exists: $OutputRoot" }
    Ensure-Directory $OutputRoot $AuthorizedRoot
    $payload = Join-Path $OutputRoot 'payload'
    Ensure-Directory $payload $AuthorizedRoot
    $payloadFiles=0; $payloadDirs=0
    foreach ($entry in $entries.ToArray()) {
        $relative = [string]$entry['relativePath']
        $source = Join-Path $InputRoot $relative
        $destination = Join-Path $payload $relative
        if ($entry['classification'] -eq 'EXCLUDED' -or $entry['classification'] -eq 'LINK_OPAQUE') {
            $entry['copyResult'] = 'NOT_COPIED'
            continue
        }
        Assert-OutputPath $destination $AuthorizedRoot
        if ($entry['entryType'] -eq 'DIRECTORY') {
            Assert-SourcePath $source
            Ensure-Directory $destination $AuthorizedRoot
            $entry['copyResult'] = 'COPIED'; $payloadDirs++
        } elseif ($entry['entryType'] -eq 'REGULAR_FILE') {
            Ensure-Directory ([IO.Path]::GetDirectoryName((Get-CanonicalPath $destination))) $AuthorizedRoot
            Assert-OutputPath $destination $AuthorizedRoot
            Assert-SourcePath $source
            [IO.File]::Copy($source,$destination,$false)
            $entry['payloadSha256'] = Get-Sha256 $destination
            if ($entry['payloadSha256'] -ne $entry['sourceSha256']) { throw "Payload hash mismatch: $relative" }
            $entry['copyResult'] = 'COPIED'; $payloadFiles++
        } else { throw "Unclassified entry: $relative" }
    }
    $post = @(Get-Inventory $InputRoot)
    $postDigest = Get-InventoryDigest $post
    if ($preDigest -ne $postDigest) { throw 'Source inventory changed during copy' }
    $files = @($entries.ToArray() | Where-Object { $_['entryType'] -eq 'REGULAR_FILE' -and $_['classification'] -eq 'REGULAR' })
    $dirs = @($entries.ToArray() | Where-Object { $_['entryType'] -eq 'DIRECTORY' -and $_['classification'] -eq 'DIRECTORY' })
    $excluded = @($entries.ToArray() | Where-Object { $_['classification'] -eq 'EXCLUDED' -and $_['reason'] -eq 'BUILD_EPHEMERA' })
    $opaque = @($entries.ToArray() | Where-Object { $_['classification'] -eq 'LINK_OPAQUE' })
    $payloadInventory = @(Get-Inventory $payload)
    $actualPayloadFiles = @($payloadInventory | Where-Object { $_['entryType'] -eq 'REGULAR_FILE' }).Count
    $actualPayloadDirs = @($payloadInventory | Where-Object { $_['entryType'] -eq 'DIRECTORY' }).Count
    $sourcePairs = @($entries.ToArray() | Where-Object { $_['entryType'] -eq 'REGULAR_FILE' -and $_['classification'] -eq 'REGULAR' } | ForEach-Object { "$($_['relativePath']):$($_['sourceSha256'])" })
    $payloadPairs = @($entries.ToArray() | Where-Object { $_['entryType'] -eq 'REGULAR_FILE' -and $_['classification'] -eq 'REGULAR' } | ForEach-Object { "$($_['relativePath']):$($_['payloadSha256'])" })
    $sourceAggregate = Get-TextSha256 ($sourcePairs -join "`n")
    $payloadAggregate = Get-TextSha256 ($payloadPairs -join "`n")
    $envelope['entries'] = $entries.ToArray()
    $envelope['sourceStability'] = [ordered]@{preSha256=$preDigest;postSha256=$postDigest;stable=$true}
    $envelope['counts'] = [ordered]@{sourceFiles=$files.Count;sourceDirectories=$dirs.Count;payloadFiles=$actualPayloadFiles;payloadDirectories=$actualPayloadDirs;excludedBuildEphemera=$excluded.Count;opaqueLinks=$opaque.Count;internalLinks=0}
    $envelope['assertions'] = [ordered]@{
        sourceStable=$true;allPayloadHashesMatch=$true
        fileCountsEqual=($files.Count -eq $payloadFiles -and $files.Count -eq $actualPayloadFiles)
        directoryCountsEqual=($dirs.Count -eq $payloadDirs -and $dirs.Count -eq $actualPayloadDirs)
        sourceAggregateSha256=$sourceAggregate;payloadAggregateSha256=$payloadAggregate
        aggregateHashesEqual=($sourceAggregate -eq $payloadAggregate)
        noInternalLink=$true;remoteOperations=$false;acceptedCapture=$true
    }
    if (-not $envelope['assertions']['fileCountsEqual'] -or -not $envelope['assertions']['directoryCountsEqual'] -or -not $envelope['assertions']['aggregateHashesEqual']) { throw 'Source/payload count or aggregate hash mismatch' }
    if ($InvocationMode -eq 'FixtureSuccess') {
        if ($excluded.Count -ne 12 -or $opaque.Count -ne 1) { throw 'Synthetic exclusion/link classification mismatch' }
        $unicodeName = 'caf' + [char]0x00E9 + ' plan.txt'
        if ($files.Count -ne 2 -or $dirs.Count -ne 2 -or @($files | Where-Object { [string]$_['relativePath'] -ceq $unicodeName }).Count -ne 1 -or @($files | Where-Object { [string]$_['relativePath'] -ceq 'regular.txt' }).Count -ne 0) { throw 'R3 two-file Unicode fixture substitution mismatch' }
        if (-not [IO.Directory]::Exists((Join-Path $payload 'empty-directory'))) { throw 'Empty directory not copied' }
    }
    $envelope['completedAtUtc'] = [DateTime]::UtcNow.ToString('o')
    $manifestPath = Join-Path $OutputRoot 'manifest.json'
    Write-JsonOnce $manifestPath $envelope $AuthorizedRoot
    $sidecar = Write-SidecarAndVerify $manifestPath $AuthorizedRoot
    $reloaded = Read-Utf8Json $manifestPath
    if ($reloaded.entries.Count -ne $entries.Count -or -not $reloaded.assertions.acceptedCapture -or -not $reloaded.sourceStability.stable -or $reloaded.counts.payloadFiles -ne $files.Count) { throw 'Final persisted manifest differs from reviewed in-memory assertions' }
    foreach ($record in $reloaded.entries) { if ($null -eq $record.PSObject.Properties['payloadSha256']) { throw 'Persisted manifest omitted payloadSha256' } }
    Assert-PersistedEntries $entries.ToArray() @($reloaded.entries) "${InvocationMode} manifest"
    if ((ConvertTo-Json -InputObject $envelope['counts'] -Depth 10 -Compress) -cne (ConvertTo-Json -InputObject $reloaded.counts -Depth 10 -Compress)) { throw 'Persisted capture counts differ from in-memory counts' }
    return [ordered]@{stopped=$false;manifestPath=$manifestPath;manifestSha256=$sidecar['manifestSha256'];sidecarSha256=$sidecar['sidecarSha256'];sourceInventory=$post;inMemoryEntries=$entries.ToArray();counts=$envelope['counts']}
}
function Write-DeterminismReport([string]$Attempt) {
    $aPath = Join-Path $Attempt 'captures/success-a/manifest.json'
    $bPath = Join-Path $Attempt 'captures/success-b/manifest.json'
    $a = Read-Utf8Json $aPath
    $b = Read-Utf8Json $bPath
    foreach ($m in @($a,$b)) { $m.startedAtUtc=$null; $m.completedAtUtc=$null; $m.captureRoot=$null }
    $normalizedA = $a | ConvertTo-Json -Depth 40 -Compress
    $normalizedB = $b | ConvertTo-Json -Depth 40 -Compress
    $matches = $normalizedA -ceq $normalizedB
    $report = [ordered]@{
        schemaVersion='w0-p01r-r3-determinism-v1'; matches=$matches
        normalizedASha256=(Get-TextSha256 $normalizedA);normalizedBSha256=(Get-TextSha256 $normalizedB)
        successAManifestSha256=(Get-Sha256 $aPath);successBManifestSha256=(Get-Sha256 $bPath)
        successASidecarSha256=(Get-Sha256 "$aPath.sha256");successBSidecarSha256=(Get-Sha256 "$bPath.sha256")
        normalizedDifferencesAllowed=@('startedAtUtc','completedAtUtc','captureRoot')
    }
    Write-JsonOnce (Join-Path $Attempt 'determinism-comparison.json') $report $Attempt
    if (-not $matches) { throw 'Two success manifests are not deterministic' }
}
function Get-GitBaseline([string]$Root) {
    $old = $env:GIT_OPTIONAL_LOCKS
    $env:GIT_OPTIONAL_LOCKS='0'
    try {
        # Force ASCII Git C-quoting, so Windows PowerShell 5.1's native-output
        # decoding cannot corrupt non-ASCII relative-path identity.
        $head = (& git -C $Root -c core.quotePath=true rev-parse HEAD)
        if ($LASTEXITCODE -ne 0) { throw 'Local Git HEAD read failed' }
        $tracked = @(& git -C $Root -c core.quotePath=true ls-files --cached -- .)
        if ($LASTEXITCODE -ne 0) { throw 'Local Git tracked read failed' }
        $unstagedDeleted = @(& git -C $Root -c core.quotePath=true ls-files --deleted -- .)
        if ($LASTEXITCODE -ne 0) { throw 'Local Git unstaged-deletion read failed' }
        $stagedDeleted = @(& git -C $Root -c core.quotePath=true diff --cached --name-only --diff-filter=D --relative -- .)
        if ($LASTEXITCODE -ne 0) { throw 'Local Git staged-deletion read failed' }
        $facts = [System.Collections.Generic.List[object]]::new()
        foreach ($raw in $unstagedDeleted) { $facts.Add([ordered]@{rawPath=[string]$raw;stagedDeleted=$false;unstagedDeleted=$true}) }
        foreach ($raw in $stagedDeleted) { $facts.Add([ordered]@{rawPath=[string]$raw;stagedDeleted=$true;unstagedDeleted=$false}) }
        $status = @(& git -C $Root -c core.quotePath=true status --porcelain=v1 --untracked-files=all --ignored -- .)
        if ($LASTEXITCODE -ne 0) { throw 'Local Git status read failed' }
        return [ordered]@{
            head=[string]$head;trackedPaths=$tracked;unstagedDeletedPaths=$unstagedDeleted;stagedDeletedPaths=$stagedDeleted;deletionFacts=$facts.ToArray();statusPorcelain=$status
            trackedCount=$tracked.Count;untrackedCount=@($status | Where-Object { $_ -match '^\?\?' }).Count
            ignoredCount=@($status | Where-Object { $_ -match '^!!' }).Count
            stagedDirtyCount=@($status | Where-Object { $_ -match '^[MADRCU]' }).Count
            unstagedDirtyCount=@($status | Where-Object { $_ -match '^.[MADRCU]' }).Count
            stagedDeletedCount=$stagedDeleted.Count;unstagedDeletedCount=$unstagedDeleted.Count
        }
    } finally { $env:GIT_OPTIONAL_LOCKS=$old }
}
function Assert-FReviews([string]$Attempt,[string]$Digest) {
    $reviews = @()
    $evidenceFields = @(
        'harnessSha256','fixtureLayoutReceiptSha256','preflightReceiptSha256',
        'deletedPresenceMatrixReceiptSha256','unicodeRoundTripReceiptSha256',
        'commandContractSha256','commandReceiptSha256','successReceiptSha256',
        'successAManifestSha256','successASidecarSha256',
        'successBManifestSha256','successBSidecarSha256',
        'internalLinkStopSha256','pathEscapeStopSha256','determinismComparisonSha256'
    )
    foreach ($path in @($script:ReviewA,$script:ReviewB)) {
        if (-not [IO.File]::Exists($path)) { throw "Missing F ACCEPT record: $path" }
        $review = Read-Utf8Json $path
        if ($review.verdict -ne 'ACCEPT' -or $review.scriptSnapshotSha256 -ne $Digest -or $review.selectedAttempt -ne ([IO.Path]::GetFileName($Attempt))) { throw 'F review binding mismatch' }
        if (-not $review.reviewerTaskId -or -not $review.reviewedAtUtc -or -not $review.underlyingMessageReference -or -not $review.actualDispatchMetadata) { throw 'Incomplete F reviewer identity/message/dispatch evidence' }
        $reviewTime = [DateTime]::MinValue
        if (-not [DateTime]::TryParse([string]$review.reviewedAtUtc,[ref]$reviewTime)) { throw 'Invalid F review timestamp' }
        if (-not $review.actualDispatchMetadata.turnContextId -or -not $review.actualDispatchMetadata.source -or -not $review.actualDispatchMetadata.effort) { throw 'Missing actual F reviewer turn metadata' }
        if ($review.actualDispatchMetadata.model -ne 'gpt-5.6-sol') { throw 'F reviewer model is not the eligible native frontier model under the pinned current policy' }
        foreach ($field in $evidenceFields) {
            $property = $review.PSObject.Properties[$field]
            if ($null -eq $property -or [string]::IsNullOrWhiteSpace([string]$property.Value) -or [string]$property.Value -notmatch '^[A-Fa-f0-9]{64}$') { throw "Missing or invalid F evidence hash: $field" }
        }
        $reviews += [ordered]@{path=$path;sha256=(Get-Sha256 $path);record=$review}
    }
    if ($reviews[0].record.reviewerTaskId -eq $reviews[1].record.reviewerTaskId) { throw 'F reviewers are not independent' }
    if ($reviews[0].record.actualDispatchMetadata.turnContextId -eq $reviews[1].record.actualDispatchMetadata.turnContextId) { throw 'F reviewer turn contexts are not independent' }
    foreach ($field in $evidenceFields) {
        if ($reviews[0].record.$field -ne $reviews[1].record.$field) { throw "F reviews disagree on $field" }
    }
    return $reviews
}
function Invoke-SourceCapture {
    Assert-ExactPath $PatentRoot $script:Patent 'patent source'
    Assert-ExactPath $DoctrineRoot $script:Doctrine 'doctrine source'
    Assert-ExactPath $CaptureRoot $script:SRoot 'S output'
    $actual = Get-Sha256 $PSCommandPath
    if ($actual -ne $ExpectedToolSha256.ToUpperInvariant()) { throw 'S tool digest mismatch' }
    $attempt = [IO.Path]::GetDirectoryName((Get-CanonicalPath $PSCommandPath))
    Assert-ExactPath $attempt (Join-Path $script:R3Root 'attempt-01') 'accepted R3 attempt'
    Assert-ExactPath $PSCommandPath (Join-Path $attempt 'script-snapshot.ps1') 'S script snapshot'
    $reviews = @(Assert-FReviews $attempt $actual)
    if (Test-Path -LiteralPath $CaptureRoot) { throw 'S output root is not initially absent' }
    Assert-OutputPath $CaptureRoot $CaptureRoot
    foreach ($root in @($PatentRoot,$DoctrineRoot)) { if (-not [IO.Directory]::Exists($root)) { throw "S approved source absent: $root" } }
    $started = [DateTime]::UtcNow.ToString('o')
    $parentAcl = Get-AclObservation ([IO.Path]::GetDirectoryName((Get-CanonicalPath $CaptureRoot)))
    $prePatent = @(Get-Inventory $PatentRoot); $preDoctrine = @(Get-Inventory $DoctrineRoot)
    $gitPatent = Get-GitBaseline $PatentRoot; $gitDoctrine = Get-GitBaseline $DoctrineRoot
    $patentObservations = @(Get-DeletedPresenceObservations $PatentRoot $prePatent $gitPatent.deletionFacts)
    $doctrineObservations = @(Get-DeletedPresenceObservations $DoctrineRoot $preDoctrine $gitDoctrine.deletionFacts)
    $patentDeleted = Resolve-DeletedPresence $gitPatent.deletionFacts $prePatent $patentObservations
    $doctrineDeleted = Resolve-DeletedPresence $gitDoctrine.deletionFacts $preDoctrine $doctrineObservations
    if ($patentDeleted['status'] -ne 'RESOLVED' -or $doctrineDeleted['status'] -ne 'RESOLVED') {
        throw "S deletion presence unresolved; patent=$($patentDeleted['status']) doctrine=$($doctrineDeleted['status'])"
    }
    Ensure-Directory $CaptureRoot $CaptureRoot
    $patentCapture = Invoke-CustodyCapture 'SourceCapture' $PatentRoot (Join-Path $CaptureRoot 'tracks/patents') $CaptureRoot $null $null
    $doctrineCapture = Invoke-CustodyCapture 'SourceCapture' $DoctrineRoot (Join-Path $CaptureRoot 'tracks/doctrine') $CaptureRoot $null $null
    $postPatent = @(Get-Inventory $PatentRoot); $postDoctrine = @(Get-Inventory $DoctrineRoot)
    $patentPreDigest = Get-InventoryDigest $prePatent
    $patentPostDigest = Get-InventoryDigest $postPatent
    $doctrinePreDigest = Get-InventoryDigest $preDoctrine
    $doctrinePostDigest = Get-InventoryDigest $postDoctrine
    $stable = ($patentPreDigest -eq $patentPostDigest) -and ($doctrinePreDigest -eq $doctrinePostDigest)
    if (-not $stable) { throw 'S source inventory drift' }
    $postGitPatent = Get-GitBaseline $PatentRoot
    $postGitDoctrine = Get-GitBaseline $DoctrineRoot
    if (($gitPatent | ConvertTo-Json -Depth 20 -Compress) -cne ($postGitPatent | ConvertTo-Json -Depth 20 -Compress) -or ($gitDoctrine | ConvertTo-Json -Depth 20 -Compress) -cne ($postGitDoctrine | ConvertTo-Json -Depth 20 -Compress)) { throw 'S Git classification drift' }
    $patentManifest = Read-Utf8Json $patentCapture.manifestPath
    $doctrineManifest = Read-Utf8Json $doctrineCapture.manifestPath
    Assert-PersistedEntries @($patentCapture['inMemoryEntries']) @($patentManifest.entries) 'S patent track'
    Assert-PersistedEntries @($doctrineCapture['inMemoryEntries']) @($doctrineManifest.entries) 'S doctrine track'
    if ((ConvertTo-Json -InputObject $patentCapture['counts'] -Depth 10 -Compress) -cne (ConvertTo-Json -InputObject $patentManifest.counts -Depth 10 -Compress) -or
        (ConvertTo-Json -InputObject $doctrineCapture['counts'] -Depth 10 -Compress) -cne (ConvertTo-Json -InputObject $doctrineManifest.counts -Depth 10 -Compress)) { throw 'S reloaded track counts mismatch' }
    $allEntries = New-Object 'System.Collections.Generic.List[object]'
    foreach ($track in @(@{name='patents';manifest=$patentManifest},@{name='doctrine';manifest=$doctrineManifest})) {
        foreach ($entry in $track.manifest.entries) {
            $copy = [ordered]@{}
            foreach ($property in $entry.PSObject.Properties) { $copy[$property.Name] = $property.Value }
            $copy['relativePath'] = "$($track.name)/$($entry.relativePath)"
            $allEntries.Add($copy)
        }
    }
    foreach ($track in @(@{name='patents';decisions=$patentDeleted['decisions'];manifest=$patentManifest},@{name='doctrine';decisions=$doctrineDeleted['decisions'];manifest=$doctrineManifest})) {
        foreach ($decision in $track.decisions) {
            $relative = [string]$decision['relativePath']
            $matches = @($track.manifest.entries | Where-Object { [string]$_.relativePath -ieq $relative })
            if ($decision['disposition'] -eq 'ABSENT_TRACKED') {
                if ($matches.Count -ne 0) { throw "Absent path also present in capture: $relative" }
                $absent = New-Entry "$($track.name)/$relative" 'ABSENT_TRACKED' 'TRACKED_DELETED'
                $absent['copyResult'] = 'ABSENT_NOT_COPIED'; $absent['reason'] = 'OBSERVED_WORKTREE_ABSENT'
                $allEntries.Add($absent)
            } elseif ($decision['disposition'] -eq 'COPIED_FILE') {
                if ($matches.Count -ne 1 -or $matches[0].entryType -ne 'REGULAR_FILE' -or
                    [string]$matches[0].relativePath -cne $relative -or $matches[0].copyResult -ne 'COPIED' -or
                    $matches[0].sourceSha256 -ne $matches[0].payloadSha256) {
                    throw "Recreated deletion path not copied exactly once: $relative"
                }
            } elseif ($decision['disposition'] -eq 'BOUNDARY_PRESERVED') {
                if ($matches.Count -ne 1 -or @('EXCLUDED','LINK_OPAQUE','LINK_INTERNAL') -notcontains [string]$matches[0].classification) {
                    throw "Deleted Git fact boundary not preserved: $relative"
                }
            } else { throw "Unresolved deletion decision: $relative" }
        }
    }
    $sourceFiles = [int]$patentManifest.counts.sourceFiles + [int]$doctrineManifest.counts.sourceFiles
    $payloadFiles = [int]$patentManifest.counts.payloadFiles + [int]$doctrineManifest.counts.payloadFiles
    $sourceDirs = [int]$patentManifest.counts.sourceDirectories + [int]$doctrineManifest.counts.sourceDirectories
    $payloadDirs = [int]$patentManifest.counts.payloadDirectories + [int]$doctrineManifest.counts.payloadDirectories
    if ($sourceFiles -ne $payloadFiles -or $sourceDirs -ne $payloadDirs -or -not $patentManifest.assertions.aggregateHashesEqual -or -not $doctrineManifest.assertions.aggregateHashesEqual) { throw 'S combined count/hash mismatch' }
    $combined = [ordered]@{
        schemaVersion='w0-p01r-r3-source-v1';mode='SourceCapture';toolSha256=$actual
        fixtureRoot=$null;sourceRoot=[ordered]@{patent=$PatentRoot;doctrine=$DoctrineRoot};captureRoot=$CaptureRoot
        startedAtUtc=$started;completedAtUtc=[DateTime]::UtcNow.ToString('o')
        remoteOperations=$false
        sourceStability=[ordered]@{patentPreSha256=$patentPreDigest;patentPostSha256=$patentPostDigest;doctrinePreSha256=$doctrinePreDigest;doctrinePostSha256=$doctrinePostDigest;stable=$stable}
        counts=[ordered]@{sourceFiles=$sourceFiles;payloadFiles=$payloadFiles;sourceDirectories=$sourceDirs;payloadDirectories=$payloadDirs;trackedDeleted=([int]$patentDeleted['counts']['absentTracked'] + [int]$doctrineDeleted['counts']['absentTracked']);entryCount=$allEntries.Count}
        entries=$allEntries.ToArray()
        assertions=[ordered]@{sourceStable=$stable;gitStable=$true;fileCountsEqual=($sourceFiles -eq $payloadFiles);directoryCountsEqual=($sourceDirs -eq $payloadDirs);patentAggregateHashesEqual=$patentManifest.assertions.aggregateHashesEqual;doctrineAggregateHashesEqual=$doctrineManifest.assertions.aggregateHashesEqual;remoteOperations=$false;acceptedCapture=$true}
        selectedAttempt=[IO.Path]::GetFileName($attempt)
        expectedToolSha256=$ExpectedToolSha256.ToUpperInvariant();actualToolSha256=$actual
        deletedPresenceMatrixReceiptSha256=$reviews[0].record.deletedPresenceMatrixReceiptSha256
        unicodeRoundTripReceiptSha256=$reviews[0].record.unicodeRoundTripReceiptSha256
        patentSourceRoot=$PatentRoot;doctrineSourceRoot=$DoctrineRoot
        fReviewASha256=$reviews[0].sha256;fReviewBSha256=$reviews[1].sha256
        sourceInventoryPre=[ordered]@{patent=$prePatent;doctrine=$preDoctrine}
        sourceInventoryPost=[ordered]@{patent=$postPatent;doctrine=$postDoctrine}
        gitBaseline=[ordered]@{patent=$gitPatent;doctrine=$gitDoctrine}
        deletionReconciliation=[ordered]@{patent=$patentDeleted;doctrine=$doctrineDeleted;patentObservations=$patentObservations;doctrineObservations=$doctrineObservations}
        trackResults=[ordered]@{patent=$patentCapture;doctrine=$doctrineCapture}
        outputParentAclOwner=$parentAcl
        builderSessionIdentity=[ordered]@{taskId=$env:R3_BUILDER_TASK_ID;sessionId=$env:R3_BUILDER_SESSION_ID}
    }
    $combinedPath = Join-Path $CaptureRoot 'combined-manifest.json'
    Write-JsonOnce $combinedPath $combined $CaptureRoot
    $combinedSidecar = Write-SidecarAndVerify $combinedPath $CaptureRoot
    $reloaded = Read-Utf8Json $combinedPath
    foreach ($field in @('schemaVersion','mode','toolSha256','fixtureRoot','sourceRoot','captureRoot','startedAtUtc','completedAtUtc','remoteOperations','sourceStability','counts','entries','assertions','expectedToolSha256','actualToolSha256','deletedPresenceMatrixReceiptSha256','unicodeRoundTripReceiptSha256','fReviewASha256','fReviewBSha256','gitBaseline','deletionReconciliation','outputParentAclOwner','builderSessionIdentity')) {
        if ($null -eq $reloaded.PSObject.Properties[$field]) { throw "Persisted combined S manifest missing $field" }
    }
    if ($reloaded.schemaVersion -ne 'w0-p01r-r3-source-v1' -or $reloaded.mode -ne 'SourceCapture' -or $reloaded.toolSha256 -ne $actual -or $reloaded.expectedToolSha256 -ne $actual -or $reloaded.actualToolSha256 -ne $actual) { throw 'Persisted S tool binding mismatch' }
    if ($reloaded.fReviewASha256 -ne $reviews[0].sha256 -or $reloaded.fReviewBSha256 -ne $reviews[1].sha256) { throw 'Persisted S F-review binding mismatch' }
    if ($reloaded.deletedPresenceMatrixReceiptSha256 -ne $reviews[0].record.deletedPresenceMatrixReceiptSha256) { throw 'Persisted S matrix-receipt binding mismatch' }
    if ($reloaded.unicodeRoundTripReceiptSha256 -ne $reviews[0].record.unicodeRoundTripReceiptSha256) { throw 'Persisted S Unicode-receipt binding mismatch' }
    if (-not $reloaded.assertions.acceptedCapture -or -not $reloaded.assertions.sourceStable -or -not $reloaded.assertions.gitStable -or -not $reloaded.assertions.fileCountsEqual -or -not $reloaded.assertions.directoryCountsEqual -or -not $reloaded.assertions.patentAggregateHashesEqual -or -not $reloaded.assertions.doctrineAggregateHashesEqual -or -not $reloaded.sourceStability.stable -or $reloaded.remoteOperations) { throw 'Persisted combined S assertions failed' }
    if ($reloaded.entries.Count -ne $allEntries.Count -or $reloaded.counts.sourceFiles -ne $sourceFiles -or $reloaded.counts.payloadFiles -ne $payloadFiles -or $reloaded.counts.trackedDeleted -ne ([int]$patentDeleted['counts']['absentTracked'] + [int]$doctrineDeleted['counts']['absentTracked'])) { throw 'Persisted combined S entry/count mismatch' }
    Assert-PersistedEntries $allEntries.ToArray() @($reloaded.entries) 'S combined'
    if ((ConvertTo-Json -InputObject $combined['counts'] -Depth 10 -Compress) -cne (ConvertTo-Json -InputObject $reloaded.counts -Depth 10 -Compress)) { throw 'Persisted combined S counts mismatch' }
    if ([string]::IsNullOrWhiteSpace($reloaded.outputParentAclOwner.sddl) -or [string]::IsNullOrWhiteSpace($reloaded.builderSessionIdentity.taskId) -or [string]::IsNullOrWhiteSpace($reloaded.builderSessionIdentity.sessionId)) { throw 'Persisted combined S ACL or identity missing' }
    foreach ($entry in $reloaded.entries) {
        foreach ($field in @('relativePath','entryType','classification','traversed','byteLength','sourceSha256','payloadSha256','copyResult')) {
            if ($null -eq $entry.PSObject.Properties[$field]) { throw "Persisted S entry missing $field" }
        }
    }
    if ((Get-Sha256 $combinedPath) -ne $combinedSidecar['manifestSha256']) { throw 'Persisted combined S sidecar digest mismatch' }
}

Assert-Preflight
if ($Mode -eq 'SourceCapture') { Invoke-SourceCapture; return }
Assert-ExactPath $FixtureRoot (Join-Path $script:R3Root 'attempt-01') 'R3 F attempt root'
$attemptRoot = Get-CanonicalPath $FixtureRoot
Assert-FInput $SourceRoot $attemptRoot
Assert-FInput $CaptureRoot $attemptRoot
Assert-OutputPath $attemptRoot $attemptRoot
Assert-OutputPath $CaptureRoot $attemptRoot
if (-not [IO.Directory]::Exists($attemptRoot)) { throw 'Harness-owned attempt parent absent' }
$expectedSource = if ($Mode -eq 'ExpectedInternalLink') { Join-Path $attemptRoot 'fixture-internal-link-source' } else { Join-Path $attemptRoot 'fixture-success-source' }
Assert-ExactPath $SourceRoot $expectedSource 'F synthetic source'
$expectedCapture = switch ($Mode) {
    'ExpectedInternalLink' { Join-Path $attemptRoot 'expected/internal-link-stop' }
    'ExpectedPathEscape' { Join-Path $attemptRoot 'expected/path-escape-stop' }
    default {
        $captureLeaf = [IO.Path]::GetFileName((Get-CanonicalPath $CaptureRoot))
        if (@('success-a','success-b') -notcontains $captureLeaf) { throw 'Unapproved success capture leaf' }
        Join-Path $attemptRoot "captures/$captureLeaf"
    }
}
Assert-ExactPath $CaptureRoot $expectedCapture 'F capture'
Initialize-Fixture $attemptRoot
$escape = if ($Mode -eq 'ExpectedPathEscape') { Join-Path $script:R3Root 'outside-attempt-path-escape' } else { $null }
$result = Invoke-CustodyCapture $Mode $SourceRoot $CaptureRoot $attemptRoot $attemptRoot $escape
if ($Mode -eq 'FixtureSuccess') {
    if ($result.stopped) { throw 'Success mode yielded a stop' }
    if ([IO.Path]::GetFileName((Get-CanonicalPath $CaptureRoot)) -eq 'success-b') { Write-DeterminismReport $attemptRoot }
} else {
    if (-not $result.stopped) { throw 'Expected stop did not stop' }
}
