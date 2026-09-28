[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('FixtureSuccess','ExpectedInternalLink','ExpectedPathEscape','FixtureLongPath','SourceCapture')]
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
$script:R5Root = 'D:/Repos/keon-omega-preserve/ppr-r5-f-20260914'
$script:SRoot = 'D:/Repos/keon-omega-preserve/ppr-r5-s-20260914-01'
$script:Patent = 'D:/Repos/keon-omega/keon-docs-internal/patents'
$script:Doctrine = 'D:/Repos/keon-omega/keon-doctrine'
$script:ReviewA = 'D:/Repos/agent-skills-worktrees/provisional-patent-readiness-20260813/plugins/foreman-line/docs/goals/provisional-patent-readiness/handoffs/W0-P01R-R5-F-review-A-accept.json'
$script:ReviewB = 'D:/Repos/agent-skills-worktrees/provisional-patent-readiness-20260813/plugins/foreman-line/docs/goals/provisional-patent-readiness/handoffs/W0-P01R-R5-F-review-B-accept.json'
$script:A1Names = @('node_modules','bin','obj','.next','.artifacts','.vs','.venv','dist','packages','.turbo','.nuget','TestResults')
$script:NativeReparseApi = $null
$script:VolumeComponentLimits = @{}

function Get-CanonicalPath([string]$Path) {
    if ([string]::IsNullOrWhiteSpace($Path)) { throw 'Empty path' }
    # Pure lexical validation only. No filesystem API, extended prefix, UNC,
    # drive-relative spelling, dot segment, ADS, or device name is authorized.
    if ($Path -cnotmatch '^[A-Za-z]:[\\/]') { throw "Unsupported ordinary absolute path: $Path" }
    $plain = $Path.Replace('/','\')
    if ($plain.Length -gt 32760) { throw 'Absolute path exceeds extended-length ceiling' }
    $root = $plain.Substring(0,3)
    if ($plain.Length -eq 3) { return $root }
    if ($plain.EndsWith('\')) { $plain = $plain.Substring(0,$plain.Length-1) }
    $parts = $plain.Substring(3).Split([char]'\')
    $utf8 = [Text.UTF8Encoding]::new($false,$true)
    foreach ($part in $parts) {
        if ([string]::IsNullOrEmpty($part) -or $part -eq '.' -or $part -eq '..' -or
            $part.Length -gt 255 -or $part.EndsWith('.') -or $part.EndsWith(' ') -or
            $part -match '[<>:"|?*\x00-\x1F]' -or
            $part -match '^(?i:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$') {
            throw "Unsafe path segment: $part"
        }
        try { [void]$utf8.GetBytes($part) } catch { throw 'Invalid Unicode path segment' }
    }
    return $root + ($parts -join '\')
}
function Get-ParentPath([string]$Path) {
    $ordinary = Get-CanonicalPath $Path
    if ($ordinary.Length -eq 3) { throw 'Volume root has no parent' }
    $cut = $ordinary.LastIndexOf('\')
    if ($cut -eq 2) { return $ordinary.Substring(0,3) }
    return $ordinary.Substring(0,$cut)
}
function Get-LeafName([string]$Path) {
    $ordinary = Get-CanonicalPath $Path
    if ($ordinary.Length -eq 3) { throw 'Volume root has no leaf' }
    return $ordinary.Substring($ordinary.LastIndexOf('\')+1)
}
function Join-SafePath([string]$Base,[string]$Relative) {
    if ([string]::IsNullOrWhiteSpace($Relative) -or $Relative -match '^[\\/]' -or $Relative -match '^[A-Za-z]:') { throw 'Unsafe relative path' }
    $basePath = Get-CanonicalPath $Base
    $joined = if ($basePath.EndsWith('\')) { $basePath + $Relative } else { $basePath + '\' + $Relative }
    return Get-CanonicalPath $joined
}
function Get-IoPath([string]$Path) {
    # Conversion is internal representation only; never itself performs I/O.
    return '\\?\' + (Get-CanonicalPath $Path)
}
function Get-VolumeComponentLimit([string]$Path) {
    $root = (Get-CanonicalPath $Path).Substring(0,3)
    if ($script:VolumeComponentLimits.ContainsKey($root)) { return [int]$script:VolumeComponentLimits[$root] }
    [void](Get-NativeReparseApi)
    [uint32]$maximum = 0
    $ok = [R5CustodyReparseIo.Win32]::GetVolumeInformationW($root,[IntPtr]::Zero,[uint32]0,[IntPtr]::Zero,[ref]$maximum,[IntPtr]::Zero,[IntPtr]::Zero,[uint32]0)
    if (-not $ok -or $maximum -lt 1 -or $maximum -gt 255) { throw "Volume component limit unavailable or unsupported: $root" }
    $script:VolumeComponentLimits[$root] = [int]$maximum
    return [int]$maximum
}
function Assert-VolumeComponents([string]$Path) {
    $ordinary = Get-CanonicalPath $Path
    $maximum = Get-VolumeComponentLimit $ordinary
    if ($ordinary.Length -gt 3) {
        foreach ($component in $ordinary.Substring(3).Split([char]'\')) {
            if ($component.Length -gt $maximum) { throw "Path component exceeds observed volume limit $maximum : $component" }
        }
    }
}
function Get-PathKind([string]$Path) {
    Assert-VolumeComponents $Path
    $io = Get-IoPath $Path
    try { $attributes = [IO.File]::GetAttributes($io) }
    catch [IO.FileNotFoundException] { return 'ABSENT' }
    catch [IO.DirectoryNotFoundException] { return 'ABSENT' }
    catch { throw "Path attribute classification failed: $Path : $($_.Exception.Message)" }
    if (($attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { return 'REPARSE_POINT' }
    if (($attributes -band [IO.FileAttributes]::Directory) -ne 0) { return 'DIRECTORY' }
    return 'REGULAR_FILE'
}
function Get-SafeAttributes([string]$Path) {
    Assert-SourcePath $Path -AllowTerminalReparse
    try { return [IO.File]::GetAttributes((Get-IoPath $Path)) }
    catch { throw "Existing path attributes unavailable: $Path : $($_.Exception.Message)" }
}
function Test-SafeDirectory([string]$Path) { return (Get-PathKind $Path) -ceq 'DIRECTORY' }
function Test-SafeFile([string]$Path) { return (Get-PathKind $Path) -ceq 'REGULAR_FILE' }
function Test-SafeAbsent([string]$Path) { return (Get-PathKind $Path) -ceq 'ABSENT' }
function Get-SafeEntries([string]$Directory) {
    Assert-SourcePath $Directory
    if (-not (Test-SafeDirectory $Directory)) { throw "Directory unavailable: $Directory" }
    $names = [System.Collections.Generic.List[string]]::new()
    foreach ($entry in [IO.Directory]::GetFileSystemEntries((Get-IoPath $Directory))) {
        $leaf = $entry.Substring($entry.LastIndexOf('\')+1)
        $names.Add((Join-SafePath $Directory $leaf))
    }
    $result = $names.ToArray()
    [Array]::Sort($result,[StringComparer]::Ordinal)
    return $result
}
function Open-NoFollowRead([string]$Path) {
    Assert-SourcePath $Path
    if ((Get-PathKind $Path) -ne 'REGULAR_FILE') { throw "No-follow regular file unavailable: $Path" }
    [void](Get-NativeReparseApi)
    # GENERIC_READ, FILE_SHARE_READ|WRITE|DELETE, OPEN_EXISTING,
    # FILE_FLAG_OPEN_REPARSE_POINT. The terminal link itself cannot resolve.
    $handle = [R5CustodyReparseIo.Win32]::CreateFileW((Get-IoPath $Path),[uint32]2147483648,[uint32]7,[IntPtr]::Zero,[uint32]3,[uint32]2097152,[IntPtr]::Zero)
    if ($handle -eq [IntPtr]::new(-1)) { throw "No-follow file open failed: $Path" }
    $safe = [Microsoft.Win32.SafeHandles.SafeFileHandle]::new($handle,$true)
    try {
        if ((Get-PathKind $Path) -ne 'REGULAR_FILE') { throw "File changed during no-follow open: $Path" }
        return [IO.FileStream]::new($safe,[IO.FileAccess]::Read)
    } catch { $safe.Dispose(); throw }
}
function Get-SafeFileLength([string]$Path) {
    Assert-SourcePath $Path
    if (-not (Test-SafeFile $Path)) { throw "Regular file unavailable: $Path" }
    $stream = Open-NoFollowRead $Path
    try { return [long]$stream.Length } finally { $stream.Dispose() }
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
    $volume = $cursor.Substring(0,3)
    $seen = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    $chain = New-Object 'System.Collections.Generic.List[string]'
    for ($depth=0; $depth -lt 260; $depth++) {
        if (-not $seen.Add($cursor)) { throw "Repeated output ancestor: $cursor" }
        $chain.Add($cursor)
        if ($cursor.Equals($volume,[StringComparison]::OrdinalIgnoreCase)) { return $chain.ToArray() }
        $cursor = Get-ParentPath $cursor
    }
    throw 'Output ancestor depth exceeds 260'
}
function Assert-OutputPath([string]$Path,[string]$AuthorizedRoot) {
    if (-not (Test-WithinRoot $Path $AuthorizedRoot)) { throw "Output path escapes authorized root: $Path" }
    $chain = @(Get-AncestorChain $Path)
    [array]::Reverse($chain)
    foreach ($ancestor in $chain) {
        $kind = Get-PathKind $ancestor
        if ($kind -eq 'REPARSE_POINT') { throw "Reparse point in output ancestor chain: $ancestor" }
        if ($kind -eq 'REGULAR_FILE' -and -not $ancestor.Equals((Get-CanonicalPath $Path),[StringComparison]::OrdinalIgnoreCase)) { throw "File in output ancestor chain: $ancestor" }
    }
}
function Assert-SourcePath([string]$Path,[switch]$AllowTerminalReparse) {
    $chain = @(Get-AncestorChain $Path)
    [array]::Reverse($chain)
    $terminal = Get-CanonicalPath $Path
    foreach ($ancestor in $chain) {
        $kind = Get-PathKind $ancestor
        if ($kind -eq 'ABSENT') { throw "Source path component unavailable: $ancestor" }
        if ($kind -eq 'REPARSE_POINT') {
            if ($AllowTerminalReparse -and $ancestor.Equals($terminal,[StringComparison]::OrdinalIgnoreCase)) { return }
            throw "Reparse point in source ancestor chain: $ancestor"
        }
        if ($kind -eq 'REGULAR_FILE' -and -not $ancestor.Equals($terminal,[StringComparison]::OrdinalIgnoreCase)) { throw "File in source ancestor chain: $ancestor" }
    }
}
function Ensure-Directory([string]$Path,[string]$AuthorizedRoot) {
    Assert-OutputPath $Path $AuthorizedRoot
    $kind = Get-PathKind $Path
    if ($kind -eq 'DIRECTORY') { return }
    if ($kind -ne 'ABSENT') { throw "Non-directory blocks directory: $Path" }
    $parent = Get-ParentPath $Path
    if (-not (Test-SafeDirectory $parent)) { Ensure-Directory $parent $AuthorizedRoot }
    Assert-OutputPath $Path $AuthorizedRoot
    if (-not (Test-SafeAbsent $Path)) { throw "Directory creation collision: $Path" }
    [IO.Directory]::CreateDirectory((Get-IoPath $Path)) | Out-Null
    Assert-OutputPath $Path $AuthorizedRoot
}
function Write-TextOnce([string]$Path,[string]$Text,[string]$AuthorizedRoot) {
    Assert-OutputPath $Path $AuthorizedRoot
    if (-not (Test-SafeAbsent $Path)) { throw "Create-once destination exists: $Path" }
    Ensure-Directory (Get-ParentPath $Path) $AuthorizedRoot
    Assert-OutputPath $Path $AuthorizedRoot
    $encoding = [Text.UTF8Encoding]::new($false)
    $stream = [IO.File]::Open((Get-IoPath $Path),[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
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
    $stream = Open-NoFollowRead $Path
    $reader = [IO.StreamReader]::new($stream,$encoding,$false)
    try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
}
function Read-Utf8Json([string]$Path) {
    return (Read-Utf8Text $Path | ConvertFrom-Json)
}
function Get-Sha256([string]$Path) {
    Assert-SourcePath $Path
    if (-not (Test-SafeFile $Path)) { throw "Hash input is not an ordinary file: $Path" }
    $stream = Open-NoFollowRead $Path
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($sha.ComputeHash($stream))).Replace('-','') }
    finally { $sha.Dispose(); $stream.Dispose() }
}
function Get-TextSha256([string]$Text) {
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($Text)))).Replace('-','') }
    finally { $sha.Dispose() }
}
function Get-AclObservation([string]$Path) {
    Assert-SourcePath $Path
    $kind = Get-PathKind $Path
    if ($kind -eq 'DIRECTORY') { $acl = [IO.Directory]::GetAccessControl((Get-IoPath $Path)) }
    elseif ($kind -eq 'REGULAR_FILE') { $acl = [IO.File]::GetAccessControl((Get-IoPath $Path)) }
    else { throw "ACL path is not ordinary: $Path" }
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
function Resolve-FinalPayloadIdentity {
    param(
        [object[]]$SourceEntries,
        [object[]]$ManifestEntries,
        [object[]]$PayloadEntries,
        [object[]]$AbsentDecisions=@()
    )
    # Pure, shared F/S reconciliation. PayloadEntries must be a fresh no-follow
    # inventory: its sourceSha256 field is the direct final payload hash.
    $issues = [System.Collections.Generic.List[object]]::new()
    $source = [System.Collections.Generic.Dictionary[string,object]]::new([StringComparer]::Ordinal)
    $manifest = [System.Collections.Generic.Dictionary[string,object]]::new([StringComparer]::Ordinal)
    $payload = [System.Collections.Generic.Dictionary[string,object]]::new([StringComparer]::Ordinal)
    $absent = [System.Collections.Generic.Dictionary[string,object]]::new([StringComparer]::Ordinal)
    $strictUtf8 = [Text.UTF8Encoding]::new($false,$true)
    foreach ($set in @(
        [ordered]@{name='SOURCE';entries=$SourceEntries;map=$source},
        [ordered]@{name='MANIFEST';entries=$ManifestEntries;map=$manifest},
        [ordered]@{name='PAYLOAD';entries=$PayloadEntries;map=$payload},
        [ordered]@{name='ABSENCE';entries=$AbsentDecisions;map=$absent}
    )) {
        foreach ($entry in $set['entries']) {
            try {
                $relative = [string]$entry.relativePath
                $null = $strictUtf8.GetBytes($relative)
            }
            catch { $issues.Add([ordered]@{category='UNDECODABLE_IDENTITY';relativePath=$null}); continue }
            $unsafe = [string]::IsNullOrEmpty($relative) -or $relative.StartsWith('/',[StringComparison]::Ordinal) -or
                $relative.Contains('\') -or $relative.Contains(':') -or $relative.IndexOf([char]0) -ge 0
            if (-not $unsafe) {
                foreach ($part in $relative.Split([char[]]@('/'))) {
                    if ([string]::IsNullOrEmpty($part) -or $part -ceq '.' -or $part -ceq '..') { $unsafe=$true; break }
                }
            }
            if ($unsafe) { $issues.Add([ordered]@{category='UNSAFE_IDENTITY';relativePath=$relative}); continue }
            if ($set['map'].ContainsKey($relative)) {
                $issues.Add([ordered]@{category=('DUPLICATE_'+$set['name']);relativePath=$relative})
            } else { $set['map'].Add($relative,$entry) }
        }
    }
    foreach ($relative in $source.Keys) {
        $s = $source[$relative]
        if (-not $manifest.ContainsKey($relative)) {
            $issues.Add([ordered]@{category='MISSING_MANIFEST';relativePath=$relative}); continue
        }
        $m = $manifest[$relative]
        if ([string]$s.entryType -cne [string]$m.entryType -or
            [string]$s.classification -cne [string]$m.classification) {
            $issues.Add([ordered]@{category='SOURCE_MANIFEST_TYPE_OR_CLASS';relativePath=$relative}); continue
        }
        foreach ($field in @('reason','traversed','linkType','resolvedTarget','targetWithinRoot','immediateEntryCount','enumerationError')) {
            if ([string]$s.$field -cne [string]$m.$field) {
                $issues.Add([ordered]@{category='SOURCE_MANIFEST_METADATA';relativePath=$relative}); break
            }
        }
        if ($s.classification -eq 'LINK_INTERNAL') {
            $issues.Add([ordered]@{category='INTERNAL_LINK';relativePath=$relative}); continue
        }
        if ($s.classification -eq 'EXCLUDED' -or $s.classification -eq 'LINK_OPAQUE') {
            if ($m.copyResult -ne 'NOT_COPIED' -or $payload.ContainsKey($relative) -or [bool]$s.traversed -or [bool]$m.traversed) {
                $issues.Add([ordered]@{category='BOUNDARY_PAYLOAD_OR_DISPOSITION';relativePath=$relative})
            }
            continue
        }
        if ($s.entryType -eq 'REGULAR_FILE' -and $s.classification -eq 'REGULAR') {
            if (-not $payload.ContainsKey($relative)) {
                $issues.Add([ordered]@{category='MISSING_PAYLOAD_FILE';relativePath=$relative}); continue
            }
            $p = $payload[$relative]
            if ($p.entryType -ne 'REGULAR_FILE' -or $p.classification -ne 'REGULAR' -or $m.copyResult -ne 'COPIED') {
                $issues.Add([ordered]@{category='PAYLOAD_TYPE_OR_DISPOSITION';relativePath=$relative}); continue
            }
            if ($null -eq $s.byteLength -or $null -eq $m.byteLength -or $null -eq $p.byteLength -or
                [long]$s.byteLength -ne [long]$m.byteLength -or [long]$s.byteLength -ne [long]$p.byteLength) {
                $issues.Add([ordered]@{category='LENGTH_MISMATCH';relativePath=$relative})
            }
            if ([string]$s.sourceSha256 -notmatch '^[A-Fa-f0-9]{64}$' -or
                [string]$m.sourceSha256 -cne [string]$s.sourceSha256 -or
                [string]$m.payloadSha256 -cne [string]$s.sourceSha256 -or
                [string]$p.sourceSha256 -cne [string]$s.sourceSha256) {
                $issues.Add([ordered]@{category='HASH_MISMATCH';relativePath=$relative})
            }
            continue
        }
        if ($s.entryType -eq 'DIRECTORY' -and $s.classification -eq 'DIRECTORY') {
            if (-not $payload.ContainsKey($relative)) {
                $issues.Add([ordered]@{category='MISSING_PAYLOAD_DIRECTORY';relativePath=$relative}); continue
            }
            $p = $payload[$relative]
            if ($p.entryType -ne 'DIRECTORY' -or $p.classification -ne 'DIRECTORY' -or $m.copyResult -ne 'COPIED' -or
                $null -ne $s.byteLength -or $null -ne $m.byteLength -or $null -ne $p.byteLength -or
                $null -ne $s.sourceSha256 -or $null -ne $m.sourceSha256 -or
                $null -ne $m.payloadSha256 -or $null -ne $p.sourceSha256) {
                $issues.Add([ordered]@{category='DIRECTORY_TYPE_OR_DISPOSITION';relativePath=$relative})
            }
            continue
        }
        $issues.Add([ordered]@{category='UNCLASSIFIED_SOURCE';relativePath=$relative})
    }
    foreach ($relative in $manifest.Keys) {
        if ($source.ContainsKey($relative)) { continue }
        $m = $manifest[$relative]
        if ($m.entryType -eq 'ABSENT_TRACKED' -and $m.classification -eq 'TRACKED_DELETED' -and
            $m.copyResult -eq 'ABSENT_NOT_COPIED' -and $absent.ContainsKey($relative) -and
            $absent[$relative].disposition -eq 'ABSENT_TRACKED' -and -not $payload.ContainsKey($relative)) {
            continue
        }
        $issues.Add([ordered]@{category='EXTRA_OR_FALSE_ABSENT_MANIFEST';relativePath=$relative})
    }
    foreach ($relative in $absent.Keys) {
        if (-not $manifest.ContainsKey($relative) -or $source.ContainsKey($relative) -or $payload.ContainsKey($relative)) {
            $issues.Add([ordered]@{category='MISSING_OR_FALSE_ABSENT_DECISION';relativePath=$relative})
        }
    }
    $mapping = [System.Collections.Generic.List[object]]::new()
    $sourcePairs = [System.Collections.Generic.List[string]]::new()
    $payloadPairs = [System.Collections.Generic.List[string]]::new()
    [string[]]$paths = @($payload.Keys)
    [Array]::Sort($paths,[StringComparer]::Ordinal)
    foreach ($relative in $paths) {
        $p = $payload[$relative]
        if (-not $source.ContainsKey($relative) -or $source[$relative].classification -notin @('REGULAR','DIRECTORY')) {
            $issues.Add([ordered]@{category='EXTRA_PAYLOAD';relativePath=$relative})
        }
        if ($p.entryType -eq 'REGULAR_FILE' -and $p.classification -eq 'REGULAR') {
            $mapping.Add([ordered]@{relativePath=$relative;entryType='REGULAR_FILE';byteLength=$p.byteLength;sha256=$p.sourceSha256})
            if ($source.ContainsKey($relative)) { $sourcePairs.Add(($relative+':'+[string]$source[$relative].sourceSha256)) }
            $payloadPairs.Add(($relative+':'+[string]$p.sourceSha256))
        } elseif ($p.entryType -eq 'DIRECTORY' -and $p.classification -eq 'DIRECTORY') {
            $mapping.Add([ordered]@{relativePath=$relative;entryType='DIRECTORY';byteLength=$null;sha256=$null})
        } else { $issues.Add([ordered]@{category='REPARSE_OR_UNCLASSIFIED_PAYLOAD';relativePath=$relative}) }
    }
    return [ordered]@{
        status=$(if($issues.Count -eq 0){'MATCH'}else{'MISMATCH'})
        mismatches=$issues.ToArray()
        mapping=$mapping.ToArray()
        sourceFilePairs=$sourcePairs.ToArray()
        payloadFilePairs=$payloadPairs.ToArray()
        counts=[ordered]@{source=$source.Count;manifest=$manifest.Count;payload=$payload.Count;absent=$absent.Count;mapping=$mapping.Count}
    }
}
function Get-FinalMappingSha256([object[]]$Mapping) {
    # ConvertTo-Json -InputObject preserves an array even for one/zero entries.
    $json = ConvertTo-Json -InputObject ([object[]]$Mapping) -Depth 10 -Compress
    return Get-TextSha256 $json
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
    if ([string]::IsNullOrWhiteSpace($env:R5_BUILDER_TASK_ID) -or [string]::IsNullOrWhiteSpace($env:R5_BUILDER_SESSION_ID)) { throw 'Builder task/session identity missing' }
    if ($Mode -eq 'SourceCapture') {
        if ($FixtureRoot -or $SourceRoot) { throw 'SourceCapture forbids FixtureRoot/SourceRoot arguments' }
        foreach ($x in @($PatentRoot,$DoctrineRoot,$CaptureRoot,$ExpectedToolSha256)) { if ([string]::IsNullOrWhiteSpace($x)) { throw 'Missing SourceCapture argument' } }
    } else {
        foreach ($x in @($FixtureRoot,$SourceRoot,$CaptureRoot)) { if ([string]::IsNullOrWhiteSpace($x)) { throw 'Missing F argument' } }
        if ($PatentRoot -or $DoctrineRoot -or $ExpectedToolSha256) { throw 'F forbids S arguments' }
    }
}
function Get-NativeReparseApi {
    # Reflection.Emit creates a Run-only in-memory P/Invoke type. Add-Type's
    # compiler/temp-file path would exceed the authorized write scope.
    if ($null -ne $script:NativeReparseApi) { return $script:NativeReparseApi }
    $assemblyName = [Reflection.AssemblyName]::new('R5CustodyReparseIo')
    $assembly = [AppDomain]::CurrentDomain.DefineDynamicAssembly($assemblyName,[Reflection.Emit.AssemblyBuilderAccess]::Run)
    $module = $assembly.DefineDynamicModule('R5CustodyReparseIo')
    $type = $module.DefineType('R5CustodyReparseIo.Win32',[Reflection.TypeAttributes]::Public -bor [Reflection.TypeAttributes]::Class)
    $publicStatic = [Reflection.MethodAttributes]::Public -bor [Reflection.MethodAttributes]::Static
    $winapi = [Runtime.InteropServices.CallingConvention]::Winapi
    $unicode = [Runtime.InteropServices.CharSet]::Unicode
    $m = $type.DefinePInvokeMethod('CreateFileW','kernel32.dll',$publicStatic,[Reflection.CallingConventions]::Standard,[IntPtr],@([string],[uint32],[uint32],[IntPtr],[uint32],[uint32],[IntPtr]),$winapi,$unicode)
    $m.SetImplementationFlags($m.GetMethodImplementationFlags() -bor [Reflection.MethodImplAttributes]::PreserveSig)
    $m = $type.DefinePInvokeMethod('DeviceIoControl','kernel32.dll',$publicStatic,[Reflection.CallingConventions]::Standard,[bool],@([IntPtr],[uint32],[IntPtr],[uint32],[IntPtr],[uint32],[uint32].MakeByRefType(),[IntPtr]),$winapi,[Runtime.InteropServices.CharSet]::None)
    $m.SetImplementationFlags($m.GetMethodImplementationFlags() -bor [Reflection.MethodImplAttributes]::PreserveSig)
    $m = $type.DefinePInvokeMethod('CloseHandle','kernel32.dll',$publicStatic,[Reflection.CallingConventions]::Standard,[bool],@([IntPtr]),$winapi,[Runtime.InteropServices.CharSet]::None)
    $m.SetImplementationFlags($m.GetMethodImplementationFlags() -bor [Reflection.MethodImplAttributes]::PreserveSig)
    $m = $type.DefinePInvokeMethod('GetVolumeInformationW','kernel32.dll',$publicStatic,[Reflection.CallingConventions]::Standard,[bool],@([string],[IntPtr],[uint32],[IntPtr],[uint32].MakeByRefType(),[IntPtr],[IntPtr],[uint32]),$winapi,$unicode)
    $m.SetImplementationFlags($m.GetMethodImplementationFlags() -bor [Reflection.MethodImplAttributes]::PreserveSig)
    $script:NativeReparseApi = $type.CreateType()
    return $script:NativeReparseApi
}
function Resolve-LinkRelativeTarget([string]$Parent,[string]$Raw) {
    # Lexical metadata classification only; never opens or authorizes Target.
    if ([string]::IsNullOrWhiteSpace($Raw) -or $Raw -match '^[\\/]' -or $Raw -match '^[A-Za-z]:') { throw 'Unsupported relative link target' }
    $parts = [System.Collections.Generic.List[string]]::new()
    $base = Get-CanonicalPath $Parent
    foreach ($part in $base.Substring(3).Split([char]'\')) { if ($part) { $parts.Add($part) } }
    foreach ($part in $Raw.Replace('/','\').Split([char]'\')) {
        if ($part -eq '.') { continue }
        if ($part -eq '..') {
            if ($parts.Count -eq 0) { throw 'Relative link target escapes volume' }
            $parts.RemoveAt($parts.Count-1)
            continue
        }
        if (-not $part) { throw 'Empty relative link target segment' }
        $parts.Add($part)
    }
    return Get-CanonicalPath ($base.Substring(0,3) + ($parts.ToArray() -join '\'))
}
function Get-LinkTarget([string]$Path) {
    # Win32 opens only the terminal reparse object, with OPEN_REPARSE_POINT;
    # FSCTL_GET_REPARSE_POINT returns stored metadata without following it.
    Assert-SourcePath $Path -AllowTerminalReparse
    if ((Get-PathKind $Path) -ne 'REPARSE_POINT') { throw "Link metadata requested for ordinary path: $Path" }
    [void](Get-NativeReparseApi)
    $handle = [R5CustodyReparseIo.Win32]::CreateFileW((Get-IoPath $Path),[uint32]0,[uint32]7,[IntPtr]::Zero,[uint32]3,[uint32]0x02200000,[IntPtr]::Zero)
    if ($handle -eq [IntPtr]::new(-1)) { throw "No-follow reparse open failed: $Path" }
    $buffer = [IntPtr]::Zero
    try {
        $buffer = [Runtime.InteropServices.Marshal]::AllocHGlobal(16384)
        [uint32]$returned = 0
        $ok = [R5CustodyReparseIo.Win32]::DeviceIoControl($handle,[uint32]0x000900A8,[IntPtr]::Zero,[uint32]0,$buffer,[uint32]16384,[ref]$returned,[IntPtr]::Zero)
        if (-not $ok -or $returned -lt 16 -or $returned -gt 16384) { throw "FSCTL_GET_REPARSE_POINT failed: $Path" }
        $bytes = New-Object byte[] $returned
        [Runtime.InteropServices.Marshal]::Copy($buffer,$bytes,0,[int]$returned)
        $tag = [BitConverter]::ToUInt32($bytes,0)
        $dataLength = [BitConverter]::ToUInt16($bytes,4)
        if (([int]$dataLength + 8) -gt $returned) { throw 'Truncated reparse data' }
        $base = if ($tag -eq [uint32]2684354563) { 16 } elseif ($tag -eq [uint32]2684354572) { 20 } else { throw "Unsupported reparse tag: $tag" }
        if ($returned -lt $base -or ([int]$dataLength + 8) -lt $base) { throw 'Short reparse header' }
        $subOffset = [BitConverter]::ToUInt16($bytes,8)
        $subLength = [BitConverter]::ToUInt16($bytes,10)
        $printOffset = [BitConverter]::ToUInt16($bytes,12)
        $printLength = [BitConverter]::ToUInt16($bytes,14)
        foreach ($value in @($subOffset,$subLength,$printOffset,$printLength)) { if (($value % 2) -ne 0) { throw 'Odd UTF-16 reparse field' } }
        if ($subLength -eq 0 -or ($base+$subOffset+$subLength) -gt $returned -or
            ($base+$printOffset+$printLength) -gt $returned -or
            ($base+$subOffset+$subLength) -gt (8+[int]$dataLength) -or
            ($base+$printOffset+$printLength) -gt (8+[int]$dataLength)) { throw 'Reparse name exceeds returned buffer' }
        $strictUtf16 = [Text.UnicodeEncoding]::new($false,$false,$true)
        $raw = $strictUtf16.GetString($bytes,$base+$subOffset,$subLength)
        $print = $strictUtf16.GetString($bytes,$base+$printOffset,$printLength)
        if ($tag -eq [uint32]2684354572 -and ([BitConverter]::ToUInt32($bytes,16) -band [uint32]1) -ne 0) {
            $target = Resolve-LinkRelativeTarget (Get-ParentPath $Path) $raw
        } else {
            if ($raw.StartsWith('\??\',[StringComparison]::Ordinal)) { $raw = $raw.Substring(4) }
            $target = Get-CanonicalPath $raw
        }
        # PrintName is informative metadata; the strict substitute name alone
        # determines lexical target classification. Do not open either path.
        if ($print -match '[\x00-\x1F]') { throw 'Malformed reparse print name' }
        if ((Get-PathKind $Path) -ne 'REPARSE_POINT') { throw "Link changed during metadata read: $Path" }
        return [ordered]@{linkType=$(if ($tag -eq [uint32]2684354563) {'JUNCTION'} else {'SYMBOLIC_LINK'});resolvedTarget=$target}
    } finally {
        if ($buffer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::FreeHGlobal($buffer) }
        if (-not [R5CustodyReparseIo.Win32]::CloseHandle($handle)) { throw "Reparse handle close failed: $Path" }
    }
}
function Get-Inventory([string]$Root) {
    Assert-SourcePath $Root
    if (-not (Test-SafeDirectory $Root)) { throw "Source directory absent: $Root" }
    $entries = New-Object 'System.Collections.Generic.List[object]'
    $stack = New-Object 'System.Collections.Generic.Stack[string]'
    $stack.Push((Get-CanonicalPath $Root))
    while ($stack.Count -gt 0) {
        $directory = $stack.Pop()
        Assert-SourcePath $directory
        foreach ($path in @(Get-SafeEntries $directory)) {
            $attributes = Get-SafeAttributes $path
            $isDir = (($attributes -band [IO.FileAttributes]::Directory) -ne 0)
            $isLink = (($attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)
            $name = Get-LeafName $path
            $relative = Get-RelativePath $Root $path
            if ($isDir -and $script:A1Names -contains $name) {
                $entry = New-Entry $relative 'DIRECTORY' 'EXCLUDED'
                $entry['reason'] = 'BUILD_EPHEMERA'
                if ($isLink) { $entry['enumerationError'] = 'REPARSE_EXCLUDED_NOT_ENUMERATED' }
                else {
                    Assert-SourcePath $path
                    try { $entry['immediateEntryCount'] = @([IO.Directory]::GetFileSystemEntries((Get-IoPath $path))).Count }
                    catch { $entry['enumerationError'] = $_.Exception.Message }
                }
                $entries.Add($entry); continue
            }
            if ($name -eq '.git') {
                $entry = New-Entry $relative $(if ($isDir) {'DIRECTORY'} else {'REGULAR_FILE'}) 'EXCLUDED'
                $entry['reason'] = 'GIT_METADATA'
                $entries.Add($entry); continue
            }
            if ($isLink) {
                $entry = New-Entry $relative 'REPARSE_POINT' 'LINK_OPAQUE'
                $metadata = Get-LinkTarget $path
                $entry['linkType'] = $metadata['linkType']
                $entry['resolvedTarget'] = $metadata['resolvedTarget']
                $inside = Test-WithinRoot $metadata['resolvedTarget'] $Root
                $entry['targetWithinRoot'] = $inside
                if ($inside) { $entry['classification'] = 'LINK_INTERNAL' }
                $entries.Add($entry); continue
            }
            if ($isDir) {
                $entry = New-Entry $relative 'DIRECTORY' 'DIRECTORY'
                $entry['traversed'] = $true
                $entries.Add($entry)
                $stack.Push($path)
            } else {
                Assert-SourcePath $path
                $entry = New-Entry $relative 'REGULAR_FILE' 'REGULAR'
                $entry['byteLength'] = Get-SafeFileLength $path
                $entry['sourceSha256'] = Get-Sha256 $path
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
        $absolute = Join-SafePath $Root $relative
        if (-not (Test-WithinRoot $absolute $Root)) { throw "Git deletion escapes source root: $relative" }
        $parent = Get-ParentPath $absolute
        Assert-SourcePath $parent
        if (-not (Test-SafeDirectory $parent)) { throw "Previously traversed deletion parent drifted: $relative" }
        $state = Get-PathKind $absolute
        if ($state -eq 'ABSENT') {
            Assert-SourcePath $parent
            if (-not (Test-SafeDirectory $parent)) { throw "Deletion parent drifted during absence check: $relative" }
        }
        $results.Add([ordered]@{relativePath=$relative;state=$state;boundaryPath=$null})
    }
    return $results.ToArray()
}
function Get-LayoutDigest([string]$Attempt) {
    $layout = [ordered]@{
        success=@(Get-Inventory (Join-SafePath $Attempt 'fixture-success-source'))
        internal=@(Get-Inventory (Join-SafePath $Attempt 'fixture-internal-link-source'))
        referents=@(Get-Inventory (Join-SafePath $Attempt 'referents'))
    }
    return Get-TextSha256 ($layout | ConvertTo-Json -Depth 30 -Compress)
}
function Initialize-Fixture([string]$Attempt) {
    $receiptPath = Join-SafePath $Attempt 'fixture-layout-receipt.json'
    $names = @('fixture-success-source','fixture-internal-link-source','referents','captures','expected')
    if (Test-SafeAbsent $receiptPath) {
        foreach ($name in $names) { if (-not (Test-SafeAbsent (Join-SafePath $Attempt $name))) { throw "Fixture subroot not initially absent: $name" } }
        foreach ($name in $names) { Ensure-Directory (Join-SafePath $Attempt $name) $Attempt }
        $success = Join-SafePath $Attempt 'fixture-success-source'
        $internal = Join-SafePath $Attempt 'fixture-internal-link-source'
        $referents = Join-SafePath $Attempt 'referents'
        $unicodeName = 'caf' + [char]0x00E9 + ' plan.txt'
        Write-TextOnce (Join-SafePath $success $unicodeName) "synthetic success regular`n" $Attempt
        Ensure-Directory (Join-SafePath $success 'nested') $Attempt
        Write-TextOnce (Join-SafePath $success 'nested/nested.txt') "synthetic nested regular`n" $Attempt
        Ensure-Directory (Join-SafePath $success 'empty-directory') $Attempt
        foreach ($name in $script:A1Names) { Ensure-Directory (Join-SafePath $success $name) $Attempt }
        Ensure-Directory (Join-SafePath $referents 'external-target') $Attempt
        Write-TextOnce (Join-SafePath $referents 'external-target/target.txt') "synthetic external referent`n" $Attempt
        Ensure-Directory (Join-SafePath $internal 'authored-internal-target') $Attempt
        Write-TextOnce (Join-SafePath $internal 'authored-internal-target/target.txt') "synthetic internal referent`n" $Attempt
        $externalLink = Join-SafePath $success 'external-junction'
        $internalLink = Join-SafePath $internal 'internal-junction'
        Assert-OutputPath $externalLink $Attempt
        Assert-OutputPath $internalLink $Attempt
        New-Item -ItemType Junction -Path $externalLink -Target (Join-SafePath $referents 'external-target') -ErrorAction Stop | Out-Null
        New-Item -ItemType Junction -Path $internalLink -Target (Join-SafePath $internal 'authored-internal-target') -ErrorAction Stop | Out-Null
        if ((Get-PathKind $externalLink) -ne 'REPARSE_POINT' -or (Get-PathKind $internalLink) -ne 'REPARSE_POINT') { throw 'Synthetic junction prerequisite failed' }
        $receipt = [ordered]@{schemaVersion='w0-p01r-r5-layout-v1'; attemptRoot=$Attempt; subroots=$names; rootRegularFile=$unicodeName; replacedR2Slot='regular.txt'; externalJunction=$externalLink; internalJunction=$internalLink; layoutSha256=(Get-LayoutDigest $Attempt)}
        Write-JsonOnce $receiptPath $receipt $Attempt
    } else {
        foreach ($name in $names) { if (-not (Test-SafeDirectory (Join-SafePath $Attempt $name))) { throw "Fixture layout subroot missing: $name" } }
        $receipt = Read-Utf8Json $receiptPath
        if ($receipt.schemaVersion -ne 'w0-p01r-r5-layout-v1' -or $receipt.rootRegularFile -cne ('caf' + [char]0x00E9 + ' plan.txt') -or $receipt.replacedR2Slot -cne 'regular.txt') { throw 'R5 Unicode fixture layout receipt mismatch' }
        if ($receipt.layoutSha256 -ne (Get-LayoutDigest $Attempt)) { throw 'Fixture layout digest mismatch' }
    }
}
function Assert-LongPathFixture([string]$Attempt,[string]$InputRoot,[string]$OutputRoot) {
    # The harness owns this source and freezes its plan before the fifth child.
    # This check only reads that exact plan and ordinary source, never creates it.
    $planPath = Join-SafePath $Attempt 'longpath-fixture-plan.json'
    Assert-SourcePath $planPath
    if (-not (Test-SafeFile $planPath)) { throw 'Frozen long-path fixture plan missing' }
    $plan = Read-Utf8Json $planPath
    if ($plan.schemaVersion -cne 'w0-p01r-r5-longpath-plan-v1') { throw 'Long-path plan schema mismatch' }
    Assert-ExactPath $plan.sourceRoot $InputRoot 'long-path planned source'
    Assert-ExactPath $plan.captureRoot $OutputRoot 'long-path planned capture'
    if ([int]$plan.volumeMaximumComponentLength -ne (Get-VolumeComponentLimit $InputRoot)) { throw 'Observed volume component limit changed since long-path plan' }
    if (@($plan.files).Count -ne 2 -or @($plan.junctions).Count -ne 2 -or -not $plan.emptyDirectory) { throw 'Long-path fixture topology mismatch' }
    if (-not (Test-SafeAbsent $OutputRoot)) { throw 'Long-path capture was not initially absent' }
    $inventory = @(Get-Inventory $InputRoot)
    if ((Get-InventoryDigest $inventory) -cne [string]$plan.sourceInventorySha256) { throw 'Frozen long-path inventory drift' }
    $payload = Join-SafePath $OutputRoot 'payload'
    $hashes = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    foreach ($file in $plan.files) {
        $relative = [string]$file.relativePath
        $source = Join-SafePath $InputRoot $relative
        $destination = Join-SafePath $payload $relative
        Assert-VolumeComponents $source
        Assert-VolumeComponents $destination
        $matches = @($inventory | Where-Object { [string]$_['relativePath'] -ceq $relative -and [string]$_['entryType'] -ceq 'REGULAR_FILE' -and [string]$_['classification'] -ceq 'REGULAR' })
        if ($matches.Count -ne 1 -or [int64]$matches[0]['byteLength'] -ne [int64]$file.byteLength -or [string]$matches[0]['sourceSha256'] -cne [string]$file.sha256 -or -not $hashes.Add([string]$file.sha256)) { throw "Long-path planned file mismatch: $relative" }
        if ($source.Length -ne [int]$file.sourcePathLength -or $destination.Length -ne [int]$file.destinationPathLength -or (Get-ParentPath $destination).Length -ne [int]$file.destinationParentLength) { throw "Long-path file length mismatch: $relative" }
    }
    $first = $plan.files[0]; $second = $plan.files[1]
    if ([int]$first.destinationPathLength -ne 261 -or [int]$first.destinationParentLength -gt 170 -or [int]$first.sourcePathLength -ge 260 -or [int]$second.sourcePathLength -lt 300 -or [int]$second.destinationPathLength -lt 300) { throw 'Required long-path boundary cases absent' }
    if (-not ([string]$first.relativePath + [string]$second.relativePath).Contains([string][char]0x00E9)) { throw 'Case-sensitive Unicode long-path name absent' }
    $empty = Join-SafePath $InputRoot ([string]$plan.emptyDirectory)
    Assert-SourcePath $empty
    if (-not (Test-SafeDirectory $empty) -or @(Get-SafeEntries $empty).Count -ne 0) { throw 'Planned long-path empty directory is not empty' }
    $externalCount=0; $excludedCount=0
    foreach ($junction in $plan.junctions) {
        $relative = [string]$junction.relativePath
        $path = Join-SafePath $InputRoot $relative
        Assert-VolumeComponents $path
        Assert-SourcePath $path -AllowTerminalReparse
        if ($path.Length -le 260 -or $path.Length -ne [int]$junction.pathLength -or (Get-PathKind $path) -ne 'REPARSE_POINT') { throw "Long junction path/type mismatch: $relative" }
        $target = Get-CanonicalPath ([string]$junction.target)
        Assert-VolumeComponents $target
        if (-not (Test-WithinRoot $target $Attempt) -or (Test-WithinRoot $target $InputRoot)) { throw 'Long junction sentinel target out of scope' }
        $matching = @($inventory | Where-Object { [string]$_['relativePath'] -ceq $relative })
        if ($matching.Count -ne 1) { throw "Long junction inventory entry absent: $relative" }
        if ($junction.kind -ceq 'external') {
            if ($matching[0]['classification'] -cne 'LINK_OPAQUE' -or $matching[0]['linkType'] -cne 'JUNCTION' -or [string]$matching[0]['resolvedTarget'] -cne $target) { throw 'External long junction lexical metadata mismatch' }
            $externalCount++
        } elseif ($junction.kind -ceq 'excluded') {
            if ((Get-LeafName $path) -cne 'node_modules' -or $matching[0]['classification'] -cne 'EXCLUDED' -or $matching[0]['reason'] -cne 'BUILD_EPHEMERA' -or $null -ne $matching[0]['resolvedTarget'] -or $matching[0]['enumerationError'] -cne 'REPARSE_EXCLUDED_NOT_ENUMERATED') { throw 'Excluded long junction was resolved or misclassified' }
            $excludedCount++
        } else { throw 'Unplanned junction kind' }
    }
    if ($externalCount -ne 1 -or $excludedCount -ne 1) { throw 'Long junction kind counts mismatch' }
    return [ordered]@{planSha256=(Get-Sha256 $planPath);sourceInventorySha256=[string]$plan.sourceInventorySha256;files=@($plan.files);junctions=@($plan.junctions)}
}
function New-Envelope([string]$InvocationMode,[string]$Attempt,[string]$InputRoot,[string]$OutputRoot) {
    return [ordered]@{
        schemaVersion='w0-p01r-r5-v1'; mode=$InvocationMode; toolSha256=(Get-Sha256 $PSCommandPath)
        fixtureRoot=$Attempt; sourceRoot=$InputRoot; captureRoot=$OutputRoot
        startedAtUtc=[DateTime]::UtcNow.ToString('o'); completedAtUtc=$null
        remoteOperations=$false; sourceStability=$null; counts=[ordered]@{}
        entries=@(); assertions=[ordered]@{}
        builderSessionIdentity=[ordered]@{taskId=$env:R5_BUILDER_TASK_ID;sessionId=$env:R5_BUILDER_SESSION_ID}
        outputParentAclOwner=$null
    }
}
function Write-SidecarAndVerify([string]$Manifest,[string]$AuthorizedRoot) {
    $sidecar = "$Manifest.sha256"
    $digest = Get-Sha256 $Manifest
    Write-TextOnce $sidecar "$digest  $(Get-LeafName $Manifest)" $AuthorizedRoot
    $recorded = ((Read-Utf8Text $sidecar) -split ' ')[0]
    if ($recorded -ne (Get-Sha256 $Manifest)) { throw 'Sidecar verification failed' }
    return [ordered]@{manifestSha256=$digest;sidecarSha256=(Get-Sha256 $sidecar);sidecarPath=$sidecar}
}
function Assert-PersistedEntries([object[]]$Expected,[object[]]$Persisted,[string]$Label) {
    if ($Expected.Count -ne $Persisted.Count) { throw "$Label entry-count mismatch" }
    $seen = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
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
    $outputParent = Get-ParentPath $OutputRoot
    Ensure-Directory $outputParent $AuthorizedRoot
    $longPlan = if ($InvocationMode -eq 'FixtureLongPath') { Assert-LongPathFixture $Attempt $InputRoot $OutputRoot } else { $null }
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
        $stopPath = Join-SafePath $OutputRoot 'stop-record.json'
        Write-JsonOnce $stopPath $envelope $AuthorizedRoot
        return [ordered]@{stopped=$true;recordPath=$stopPath;recordSha256=(Get-Sha256 $stopPath)}
    }
    if ($InvocationMode -eq 'ExpectedInternalLink') { throw 'Expected internal link absent' }
    if (-not (Test-SafeAbsent $OutputRoot)) { throw "Capture root already exists: $OutputRoot" }
    Ensure-Directory $OutputRoot $AuthorizedRoot
    $payload = Join-SafePath $OutputRoot 'payload'
    Ensure-Directory $payload $AuthorizedRoot
    $payloadFiles=0; $payloadDirs=0
    foreach ($entry in $entries.ToArray()) {
        $relative = [string]$entry['relativePath']
        $source = Join-SafePath $InputRoot $relative
        $destination = Join-SafePath $payload $relative
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
            Ensure-Directory (Get-ParentPath $destination) $AuthorizedRoot
            Assert-OutputPath $destination $AuthorizedRoot
            Assert-SourcePath $source
            if (-not (Test-SafeAbsent $destination)) { throw "No-overwrite copy destination exists: $destination" }
            $sourceStream = Open-NoFollowRead $source
            try {
                $destinationStream = [IO.File]::Open((Get-IoPath $destination),[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
                try { $sourceStream.CopyTo($destinationStream) } finally { $destinationStream.Dispose() }
            } finally { $sourceStream.Dispose() }
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
    # The final no-follow inventory is authoritative for payload path/type/hash.
    # Cached copy-entry hashes alone cannot establish final payload identity.
    $payloadInventory = @(Get-Inventory $payload)
    $finalIdentity = Resolve-FinalPayloadIdentity $post $entries.ToArray() $payloadInventory
    if ($finalIdentity['status'] -ne 'MATCH') { throw "Final payload identity mismatch: $($finalIdentity['mismatches'] | ConvertTo-Json -Depth 8 -Compress)" }
    $actualPayloadFiles = @($payloadInventory | Where-Object { $_['entryType'] -eq 'REGULAR_FILE' }).Count
    $actualPayloadDirs = @($payloadInventory | Where-Object { $_['entryType'] -eq 'DIRECTORY' }).Count
    $sourceAggregate = Get-TextSha256 ($finalIdentity['sourceFilePairs'] -join "`n")
    $payloadAggregate = Get-TextSha256 ($finalIdentity['payloadFilePairs'] -join "`n")
    $finalMappingSha256 = Get-FinalMappingSha256 $finalIdentity['mapping']
    $envelope['entries'] = $entries.ToArray()
    $envelope['payloadFinalMappingSha256'] = $finalMappingSha256
    $envelope['sourceStability'] = [ordered]@{preSha256=$preDigest;postSha256=$postDigest;stable=$true}
    $envelope['counts'] = [ordered]@{sourceFiles=$files.Count;sourceDirectories=$dirs.Count;payloadFiles=$actualPayloadFiles;payloadDirectories=$actualPayloadDirs;excludedBuildEphemera=$excluded.Count;opaqueLinks=$opaque.Count;internalLinks=0}
    $envelope['assertions'] = [ordered]@{
        sourceStable=$true;allPayloadHashesMatch=($finalIdentity['status'] -eq 'MATCH')
        finalPayloadIdentityMatched=($finalIdentity['status'] -eq 'MATCH')
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
        if ($files.Count -ne 2 -or $dirs.Count -ne 2 -or @($files | Where-Object { [string]$_['relativePath'] -ceq $unicodeName }).Count -ne 1 -or @($files | Where-Object { [string]$_['relativePath'] -ceq 'regular.txt' }).Count -ne 0) { throw 'R4 two-file Unicode fixture substitution mismatch' }
        $emptyPayload = Join-SafePath $payload 'empty-directory'
        Assert-SourcePath $emptyPayload
        if (-not (Test-SafeDirectory $emptyPayload)) { throw 'Empty directory not copied' }
    }
    if ($InvocationMode -eq 'FixtureLongPath') {
        $envelope['longpathFixturePlanSha256'] = $longPlan['planSha256']
        if ($files.Count -ne 2 -or $opaque.Count -ne 1 -or @($excluded | Where-Object { (Get-LeafName (Join-SafePath $InputRoot ([string]$_['relativePath']))) -ceq 'node_modules' }).Count -ne 1) { throw 'Long-path capture topology mismatch' }
        if ($finalMappingSha256 -cnotmatch '^[A-F0-9]{64}$') { throw 'Long-path final mapping digest absent' }
    }
    $envelope['completedAtUtc'] = [DateTime]::UtcNow.ToString('o')
    $manifestPath = Join-SafePath $OutputRoot 'manifest.json'
    Write-JsonOnce $manifestPath $envelope $AuthorizedRoot
    $sidecar = Write-SidecarAndVerify $manifestPath $AuthorizedRoot
    $reloaded = Read-Utf8Json $manifestPath
    if ($reloaded.entries.Count -ne $entries.Count -or -not $reloaded.assertions.acceptedCapture -or -not $reloaded.sourceStability.stable -or $reloaded.counts.payloadFiles -ne $files.Count) { throw 'Final persisted manifest differs from reviewed in-memory assertions' }
    if ($InvocationMode -eq 'FixtureLongPath' -and [string]$reloaded.longpathFixturePlanSha256 -cne [string]$longPlan['planSha256']) { throw 'Persisted long-path plan binding mismatch' }
    foreach ($record in $reloaded.entries) { if ($null -eq $record.PSObject.Properties['payloadSha256']) { throw 'Persisted manifest omitted payloadSha256' } }
    Assert-PersistedEntries $entries.ToArray() @($reloaded.entries) "${InvocationMode} manifest"
    $persistedIdentity = Resolve-FinalPayloadIdentity $post @($reloaded.entries) $payloadInventory
    if ($persistedIdentity['status'] -ne 'MATCH' -or
        (Get-FinalMappingSha256 $persistedIdentity['mapping']) -ne $finalMappingSha256 -or
        $reloaded.payloadFinalMappingSha256 -ne $finalMappingSha256) { throw 'Persisted final payload identity mismatch' }
    if ((ConvertTo-Json -InputObject $envelope['counts'] -Depth 10 -Compress) -cne (ConvertTo-Json -InputObject $reloaded.counts -Depth 10 -Compress)) { throw 'Persisted capture counts differ from in-memory counts' }
    return [ordered]@{stopped=$false;manifestPath=$manifestPath;manifestSha256=$sidecar['manifestSha256'];sidecarSha256=$sidecar['sidecarSha256'];sourceInventory=$post;inMemoryEntries=$entries.ToArray();counts=$envelope['counts'];payloadFinalMappingSha256=$finalMappingSha256;finalPayloadMapping=$finalIdentity['mapping']}
}
function Write-DeterminismReport([string]$Attempt) {
    $aPath = Join-SafePath $Attempt 'captures/success-a/manifest.json'
    $bPath = Join-SafePath $Attempt 'captures/success-b/manifest.json'
    $a = Read-Utf8Json $aPath
    $b = Read-Utf8Json $bPath
    foreach ($m in @($a,$b)) { $m.startedAtUtc=$null; $m.completedAtUtc=$null; $m.captureRoot=$null }
    $normalizedA = $a | ConvertTo-Json -Depth 40 -Compress
    $normalizedB = $b | ConvertTo-Json -Depth 40 -Compress
    $matches = $normalizedA -ceq $normalizedB
    $report = [ordered]@{
        schemaVersion='w0-p01r-r5-determinism-v1'; matches=$matches
        normalizedASha256=(Get-TextSha256 $normalizedA);normalizedBSha256=(Get-TextSha256 $normalizedB)
        successAManifestSha256=(Get-Sha256 $aPath);successBManifestSha256=(Get-Sha256 $bPath)
        successASidecarSha256=(Get-Sha256 "$aPath.sha256");successBSidecarSha256=(Get-Sha256 "$bPath.sha256")
        normalizedDifferencesAllowed=@('startedAtUtc','completedAtUtc','captureRoot')
    }
    Write-JsonOnce (Join-SafePath $Attempt 'determinism-comparison.json') $report $Attempt
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
        'payloadReconciliationMatrixReceiptSha256','payloadFinalIdentityReceiptSha256',
        'commandContractSha256','commandReceiptSha256','successReceiptSha256',
        'successAManifestSha256','successASidecarSha256',
        'successBManifestSha256','successBSidecarSha256',
        'internalLinkStopSha256','pathEscapeStopSha256','determinismComparisonSha256',
        'longpathFixturePlanSha256','longpathRegressionReceiptSha256',
        'longpathManifestSha256','longpathSidecarSha256'
    )
    foreach ($path in @($script:ReviewA,$script:ReviewB)) {
        Assert-SourcePath $path
        if (-not (Test-SafeFile $path)) { throw "Missing F ACCEPT record: $path" }
        $review = Read-Utf8Json $path
        if ($review.verdict -ne 'ACCEPT' -or $review.scriptSnapshotSha256 -ne $Digest -or $review.selectedAttempt -ne ([IO.Path]::GetFileName($Attempt))) { throw 'F review binding mismatch' }
        if (-not $review.reviewerTaskId -or -not $review.reviewedAtUtc -or -not $review.underlyingMessageReference -or -not $review.actualDispatchMetadata) { throw 'Incomplete F reviewer identity/message/dispatch evidence' }
        $reviewTime = [DateTime]::MinValue
        if (-not [DateTime]::TryParse([string]$review.reviewedAtUtc,[ref]$reviewTime)) { throw 'Invalid F review timestamp' }
        if (-not $review.actualDispatchMetadata.turnContextId -or -not $review.actualDispatchMetadata.source -or -not $review.actualDispatchMetadata.effort) { throw 'Missing actual F reviewer turn metadata' }
        if ($review.actualDispatchMetadata.model -ne 'gpt-5.6-sol' -or $review.actualDispatchMetadata.effort -ne 'xhigh') { throw 'F reviewer model/effort is not the verified R5 frontier dispatch' }
        foreach ($field in $evidenceFields) {
            $property = $review.PSObject.Properties[$field]
            if ($null -eq $property -or [string]::IsNullOrWhiteSpace([string]$property.Value) -or [string]$property.Value -notmatch '^[A-Fa-f0-9]{64}$') { throw "Missing or invalid F evidence hash: $field" }
        }
        $mapping = $review.payloadFinalMappingSha256
        if ($null -eq $mapping -or @($mapping.PSObject.Properties.Name).Count -ne 3) { throw 'F review final mapping keys mismatch' }
        foreach ($key in @('successA','successB','longpath')) {
            $property = $mapping.PSObject.Properties[$key]
            if ($null -eq $property -or [string]$property.Value -cnotmatch '^[A-F0-9]{64}$') { throw "Invalid F final mapping digest: $key" }
        }
        $reviews += [ordered]@{path=$path;sha256=(Get-Sha256 $path);record=$review}
    }
    if ($reviews[0].record.reviewerTaskId -eq $reviews[1].record.reviewerTaskId) { throw 'F reviewers are not independent' }
    if ($reviews[0].record.actualDispatchMetadata.turnContextId -eq $reviews[1].record.actualDispatchMetadata.turnContextId) { throw 'F reviewer turn contexts are not independent' }
    foreach ($field in $evidenceFields) {
        if ($reviews[0].record.$field -ne $reviews[1].record.$field) { throw "F reviews disagree on $field" }
    }
    foreach ($key in @('successA','successB','longpath')) {
        if ($reviews[0].record.payloadFinalMappingSha256.$key -cne $reviews[1].record.payloadFinalMappingSha256.$key) { throw "F reviews disagree on final mapping $key" }
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
    Assert-ExactPath $attempt (Join-SafePath $script:R5Root 'attempt-01') 'accepted R5 attempt'
    Assert-ExactPath $PSCommandPath (Join-SafePath $attempt 'script-snapshot.ps1') 'S script snapshot'
    $reviews = @(Assert-FReviews $attempt $actual)
    Assert-OutputPath $CaptureRoot $CaptureRoot
    if (-not (Test-SafeAbsent $CaptureRoot)) { throw 'S output root is not initially absent' }
    foreach ($root in @($PatentRoot,$DoctrineRoot)) { Assert-SourcePath $root; if (-not (Test-SafeDirectory $root)) { throw "S approved source absent: $root" } }
    $started = [DateTime]::UtcNow.ToString('o')
    $parentAcl = Get-AclObservation (Get-ParentPath $CaptureRoot)
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
    $patentCapture = Invoke-CustodyCapture 'SourceCapture' $PatentRoot (Join-SafePath $CaptureRoot 'tracks/patents') $CaptureRoot $null $null
    $doctrineCapture = Invoke-CustodyCapture 'SourceCapture' $DoctrineRoot (Join-SafePath $CaptureRoot 'tracks/doctrine') $CaptureRoot $null $null
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
    # Both track payloads are re-inventoried after both copies. This catches
    # later track work changing an earlier track's final payload assertion.
    $patentPayloadFinal = @(Get-Inventory (Join-SafePath $CaptureRoot 'tracks/patents/payload'))
    $doctrinePayloadFinal = @(Get-Inventory (Join-SafePath $CaptureRoot 'tracks/doctrine/payload'))
    $patentIdentity = Resolve-FinalPayloadIdentity $postPatent @($patentManifest.entries) $patentPayloadFinal
    $doctrineIdentity = Resolve-FinalPayloadIdentity $postDoctrine @($doctrineManifest.entries) $doctrinePayloadFinal
    if ($patentIdentity['status'] -ne 'MATCH' -or $doctrineIdentity['status'] -ne 'MATCH') { throw 'S final track payload identity mismatch' }
    $patentFinalMappingSha256 = Get-FinalMappingSha256 $patentIdentity['mapping']
    $doctrineFinalMappingSha256 = Get-FinalMappingSha256 $doctrineIdentity['mapping']
    if ($patentFinalMappingSha256 -ne $patentManifest.payloadFinalMappingSha256 -or
        $patentFinalMappingSha256 -ne $patentCapture['payloadFinalMappingSha256'] -or
        $doctrineFinalMappingSha256 -ne $doctrineManifest.payloadFinalMappingSha256 -or
        $doctrineFinalMappingSha256 -ne $doctrineCapture['payloadFinalMappingSha256']) { throw 'S final track mapping digest mismatch' }
    if ((Get-TextSha256 ($patentIdentity['sourceFilePairs'] -join "`n")) -ne (Get-TextSha256 ($patentIdentity['payloadFilePairs'] -join "`n")) -or
        (Get-TextSha256 ($doctrineIdentity['sourceFilePairs'] -join "`n")) -ne (Get-TextSha256 ($doctrineIdentity['payloadFilePairs'] -join "`n"))) { throw 'S final track direct aggregate mismatch' }
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
    $combinedSource = [System.Collections.Generic.List[object]]::new()
    $combinedPayload = [System.Collections.Generic.List[object]]::new()
    $combinedAbsent = [System.Collections.Generic.List[object]]::new()
    foreach ($track in @(
        [ordered]@{name='patents';source=$postPatent;payload=$patentPayloadFinal;decisions=$patentDeleted['decisions']},
        [ordered]@{name='doctrine';source=$postDoctrine;payload=$doctrinePayloadFinal;decisions=$doctrineDeleted['decisions']}
    )) {
        foreach ($entry in $track['source']) {
            $copy = [ordered]@{}
            foreach ($key in $entry.Keys) { $copy[$key]=$entry[$key] }
            $copy['relativePath'] = "$($track['name'])/$($entry['relativePath'])"
            $combinedSource.Add($copy)
        }
        foreach ($entry in $track['payload']) {
            $copy = [ordered]@{}
            foreach ($key in $entry.Keys) { $copy[$key]=$entry[$key] }
            $copy['relativePath'] = "$($track['name'])/$($entry['relativePath'])"
            $combinedPayload.Add($copy)
        }
        foreach ($decision in $track['decisions']) {
            if ($decision['disposition'] -eq 'ABSENT_TRACKED') {
                $combinedAbsent.Add([ordered]@{relativePath="$($track['name'])/$($decision['relativePath'])";disposition='ABSENT_TRACKED'})
            }
        }
    }
    $combinedIdentity = Resolve-FinalPayloadIdentity $combinedSource.ToArray() $allEntries.ToArray() $combinedPayload.ToArray() $combinedAbsent.ToArray()
    if ($combinedIdentity['status'] -ne 'MATCH') { throw 'S in-memory combined final payload identity mismatch' }
    $sourceFiles = [int]$patentManifest.counts.sourceFiles + [int]$doctrineManifest.counts.sourceFiles
    $payloadFiles = [int]$patentManifest.counts.payloadFiles + [int]$doctrineManifest.counts.payloadFiles
    $sourceDirs = [int]$patentManifest.counts.sourceDirectories + [int]$doctrineManifest.counts.sourceDirectories
    $payloadDirs = [int]$patentManifest.counts.payloadDirectories + [int]$doctrineManifest.counts.payloadDirectories
    if ($sourceFiles -ne $payloadFiles -or $sourceDirs -ne $payloadDirs -or -not $patentManifest.assertions.aggregateHashesEqual -or -not $doctrineManifest.assertions.aggregateHashesEqual) { throw 'S combined count/hash mismatch' }
    $combined = [ordered]@{
        schemaVersion='w0-p01r-r5-source-v1';mode='SourceCapture';toolSha256=$actual
        fixtureRoot=$null;sourceRoot=[ordered]@{patent=$PatentRoot;doctrine=$DoctrineRoot};captureRoot=$CaptureRoot
        startedAtUtc=$started;completedAtUtc=[DateTime]::UtcNow.ToString('o')
        remoteOperations=$false
        sourceStability=[ordered]@{patentPreSha256=$patentPreDigest;patentPostSha256=$patentPostDigest;doctrinePreSha256=$doctrinePreDigest;doctrinePostSha256=$doctrinePostDigest;stable=$stable}
        counts=[ordered]@{sourceFiles=$sourceFiles;payloadFiles=$payloadFiles;sourceDirectories=$sourceDirs;payloadDirectories=$payloadDirs;trackedDeleted=([int]$patentDeleted['counts']['absentTracked'] + [int]$doctrineDeleted['counts']['absentTracked']);entryCount=$allEntries.Count}
        entries=$allEntries.ToArray()
        assertions=[ordered]@{sourceStable=$stable;gitStable=$true;fileCountsEqual=($sourceFiles -eq $payloadFiles);directoryCountsEqual=($sourceDirs -eq $payloadDirs);patentAggregateHashesEqual=$patentManifest.assertions.aggregateHashesEqual;doctrineAggregateHashesEqual=$doctrineManifest.assertions.aggregateHashesEqual;trackFinalPayloadIdentityMatched=$true;combinedFinalPayloadIdentityMatched=$true;remoteOperations=$false;acceptedCapture=$true}
        selectedAttempt=[IO.Path]::GetFileName($attempt)
        expectedToolSha256=$ExpectedToolSha256.ToUpperInvariant();actualToolSha256=$actual
        deletedPresenceMatrixReceiptSha256=$reviews[0].record.deletedPresenceMatrixReceiptSha256
        unicodeRoundTripReceiptSha256=$reviews[0].record.unicodeRoundTripReceiptSha256
        payloadReconciliationMatrixReceiptSha256=$reviews[0].record.payloadReconciliationMatrixReceiptSha256
        payloadFinalIdentityReceiptSha256=$reviews[0].record.payloadFinalIdentityReceiptSha256
        longpathFixturePlanSha256=$reviews[0].record.longpathFixturePlanSha256
        longpathRegressionReceiptSha256=$reviews[0].record.longpathRegressionReceiptSha256
        longpathManifestSha256=$reviews[0].record.longpathManifestSha256
        longpathSidecarSha256=$reviews[0].record.longpathSidecarSha256
        fPayloadFinalMappingSha256=$reviews[0].record.payloadFinalMappingSha256
        payloadFinalMappingSha256=[ordered]@{patents=$patentFinalMappingSha256;doctrine=$doctrineFinalMappingSha256}
        payloadFinalMappings=[ordered]@{patents=$patentIdentity['mapping'];doctrine=$doctrineIdentity['mapping']}
        combinedPayloadFinalMapping=$combinedIdentity['mapping']
        patentSourceRoot=$PatentRoot;doctrineSourceRoot=$DoctrineRoot
        fReviewASha256=$reviews[0].sha256;fReviewBSha256=$reviews[1].sha256
        sourceInventoryPre=[ordered]@{patent=$prePatent;doctrine=$preDoctrine}
        sourceInventoryPost=[ordered]@{patent=$postPatent;doctrine=$postDoctrine}
        gitBaseline=[ordered]@{patent=$gitPatent;doctrine=$gitDoctrine}
        deletionReconciliation=[ordered]@{patent=$patentDeleted;doctrine=$doctrineDeleted;patentObservations=$patentObservations;doctrineObservations=$doctrineObservations}
        trackResults=[ordered]@{patent=$patentCapture;doctrine=$doctrineCapture}
        outputParentAclOwner=$parentAcl
        builderSessionIdentity=[ordered]@{taskId=$env:R5_BUILDER_TASK_ID;sessionId=$env:R5_BUILDER_SESSION_ID}
    }
    $combinedPath = Join-SafePath $CaptureRoot 'combined-manifest.json'
    Write-JsonOnce $combinedPath $combined $CaptureRoot
    $combinedSidecar = Write-SidecarAndVerify $combinedPath $CaptureRoot
    $reloaded = Read-Utf8Json $combinedPath
    foreach ($field in @('schemaVersion','mode','toolSha256','fixtureRoot','sourceRoot','captureRoot','startedAtUtc','completedAtUtc','remoteOperations','sourceStability','counts','entries','assertions','expectedToolSha256','actualToolSha256','deletedPresenceMatrixReceiptSha256','unicodeRoundTripReceiptSha256','payloadReconciliationMatrixReceiptSha256','payloadFinalIdentityReceiptSha256','longpathFixturePlanSha256','longpathRegressionReceiptSha256','longpathManifestSha256','longpathSidecarSha256','fPayloadFinalMappingSha256','payloadFinalMappingSha256','payloadFinalMappings','combinedPayloadFinalMapping','fReviewASha256','fReviewBSha256','gitBaseline','deletionReconciliation','outputParentAclOwner','builderSessionIdentity')) {
        if ($null -eq $reloaded.PSObject.Properties[$field]) { throw "Persisted combined S manifest missing $field" }
    }
    if ($reloaded.schemaVersion -ne 'w0-p01r-r5-source-v1' -or $reloaded.mode -ne 'SourceCapture' -or $reloaded.toolSha256 -ne $actual -or $reloaded.expectedToolSha256 -ne $actual -or $reloaded.actualToolSha256 -ne $actual) { throw 'Persisted S tool binding mismatch' }
    if ($reloaded.fReviewASha256 -ne $reviews[0].sha256 -or $reloaded.fReviewBSha256 -ne $reviews[1].sha256) { throw 'Persisted S F-review binding mismatch' }
    if ($reloaded.deletedPresenceMatrixReceiptSha256 -ne $reviews[0].record.deletedPresenceMatrixReceiptSha256) { throw 'Persisted S matrix-receipt binding mismatch' }
    if ($reloaded.unicodeRoundTripReceiptSha256 -ne $reviews[0].record.unicodeRoundTripReceiptSha256) { throw 'Persisted S Unicode-receipt binding mismatch' }
    if ($reloaded.payloadReconciliationMatrixReceiptSha256 -ne $reviews[0].record.payloadReconciliationMatrixReceiptSha256 -or
        $reloaded.payloadFinalIdentityReceiptSha256 -ne $reviews[0].record.payloadFinalIdentityReceiptSha256) { throw 'Persisted S R5 F-receipt binding mismatch' }
    foreach ($field in @('longpathFixturePlanSha256','longpathRegressionReceiptSha256','longpathManifestSha256','longpathSidecarSha256')) {
        if ([string]$reloaded.$field -cne [string]$reviews[0].record.$field) { throw "Persisted S R5 long-path binding mismatch: $field" }
    }
    if ((ConvertTo-Json -InputObject $reloaded.fPayloadFinalMappingSha256 -Compress) -cne
        (ConvertTo-Json -InputObject $reviews[0].record.payloadFinalMappingSha256 -Compress)) { throw 'Persisted S F final-mapping binding mismatch' }
    if (-not $reloaded.assertions.acceptedCapture -or -not $reloaded.assertions.sourceStable -or -not $reloaded.assertions.gitStable -or -not $reloaded.assertions.fileCountsEqual -or -not $reloaded.assertions.directoryCountsEqual -or -not $reloaded.assertions.patentAggregateHashesEqual -or -not $reloaded.assertions.doctrineAggregateHashesEqual -or -not $reloaded.assertions.trackFinalPayloadIdentityMatched -or -not $reloaded.assertions.combinedFinalPayloadIdentityMatched -or -not $reloaded.sourceStability.stable -or $reloaded.remoteOperations) { throw 'Persisted combined S assertions failed' }
    if ($reloaded.entries.Count -ne $allEntries.Count -or $reloaded.counts.sourceFiles -ne $sourceFiles -or $reloaded.counts.payloadFiles -ne $payloadFiles -or $reloaded.counts.trackedDeleted -ne ([int]$patentDeleted['counts']['absentTracked'] + [int]$doctrineDeleted['counts']['absentTracked'])) { throw 'Persisted combined S entry/count mismatch' }
    Assert-PersistedEntries $allEntries.ToArray() @($reloaded.entries) 'S combined'
    if ((ConvertTo-Json -InputObject $combined['counts'] -Depth 10 -Compress) -cne (ConvertTo-Json -InputObject $reloaded.counts -Depth 10 -Compress)) { throw 'Persisted combined S counts mismatch' }
    # Final verification reads fresh source/payload inventories after the
    # combined manifest's UTF-8 persistence, then reconciles exact prefixed
    # combined identities, including every separately proved absent decision.
    $patentSourceLast = @(Get-Inventory $PatentRoot)
    $doctrineSourceLast = @(Get-Inventory $DoctrineRoot)
    if ((Get-InventoryDigest $patentSourceLast) -ne $patentPreDigest -or
        (Get-InventoryDigest $doctrineSourceLast) -ne $doctrinePreDigest) { throw 'S source drift at combined finalization' }
    $patentPayloadLast = @(Get-Inventory (Join-SafePath $CaptureRoot 'tracks/patents/payload'))
    $doctrinePayloadLast = @(Get-Inventory (Join-SafePath $CaptureRoot 'tracks/doctrine/payload'))
    $patentLastIdentity = Resolve-FinalPayloadIdentity $patentSourceLast @($patentManifest.entries) $patentPayloadLast
    $doctrineLastIdentity = Resolve-FinalPayloadIdentity $doctrineSourceLast @($doctrineManifest.entries) $doctrinePayloadLast
    if ($patentLastIdentity['status'] -ne 'MATCH' -or $doctrineLastIdentity['status'] -ne 'MATCH') { throw 'S persisted track final payload identity mismatch' }
    if (@($reloaded.payloadFinalMappingSha256.PSObject.Properties.Name).Count -ne 2 -or
        (Get-FinalMappingSha256 $patentLastIdentity['mapping']) -ne $reloaded.payloadFinalMappingSha256.patents -or
        (Get-FinalMappingSha256 $doctrineLastIdentity['mapping']) -ne $reloaded.payloadFinalMappingSha256.doctrine -or
        $reloaded.payloadFinalMappingSha256.patents -ne $patentFinalMappingSha256 -or
        $reloaded.payloadFinalMappingSha256.doctrine -ne $doctrineFinalMappingSha256) { throw 'S persisted final track mapping mismatch' }
    $combinedSourceLast = [System.Collections.Generic.List[object]]::new()
    $combinedPayloadLast = [System.Collections.Generic.List[object]]::new()
    foreach ($track in @(
        [ordered]@{name='patents';source=$patentSourceLast;payload=$patentPayloadLast},
        [ordered]@{name='doctrine';source=$doctrineSourceLast;payload=$doctrinePayloadLast}
    )) {
        foreach ($entry in $track['source']) {
            $copy=[ordered]@{}
            foreach ($key in $entry.Keys) { $copy[$key]=$entry[$key] }
            $copy['relativePath']="$($track['name'])/$($entry['relativePath'])"
            $combinedSourceLast.Add($copy)
        }
        foreach ($entry in $track['payload']) {
            $copy=[ordered]@{}
            foreach ($key in $entry.Keys) { $copy[$key]=$entry[$key] }
            $copy['relativePath']="$($track['name'])/$($entry['relativePath'])"
            $combinedPayloadLast.Add($copy)
        }
    }
    $combinedLastIdentity = Resolve-FinalPayloadIdentity $combinedSourceLast.ToArray() @($reloaded.entries) $combinedPayloadLast.ToArray() $combinedAbsent.ToArray()
    if ($combinedLastIdentity['status'] -ne 'MATCH' -or
        (ConvertTo-Json -InputObject $combinedLastIdentity['mapping'] -Depth 10 -Compress) -cne
        (ConvertTo-Json -InputObject $reloaded.combinedPayloadFinalMapping -Depth 10 -Compress) -or
        (ConvertTo-Json -InputObject $patentLastIdentity['mapping'] -Depth 10 -Compress) -cne
        (ConvertTo-Json -InputObject $reloaded.payloadFinalMappings.patents -Depth 10 -Compress) -or
        (ConvertTo-Json -InputObject $doctrineLastIdentity['mapping'] -Depth 10 -Compress) -cne
        (ConvertTo-Json -InputObject $reloaded.payloadFinalMappings.doctrine -Depth 10 -Compress)) { throw 'S persisted combined final payload identity mismatch' }
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
Assert-ExactPath $FixtureRoot (Join-SafePath $script:R5Root 'attempt-01') 'R5 F attempt root'
$attemptRoot = Get-CanonicalPath $FixtureRoot
Assert-FInput $SourceRoot $attemptRoot
Assert-FInput $CaptureRoot $attemptRoot
Assert-OutputPath $attemptRoot $attemptRoot
Assert-OutputPath $CaptureRoot $attemptRoot
if (-not (Test-SafeDirectory $attemptRoot)) { throw 'Harness-owned attempt parent absent' }
$expectedSource = switch ($Mode) {
    'ExpectedInternalLink' { Join-SafePath $attemptRoot 'fixture-internal-link-source' }
    'FixtureLongPath' { Join-SafePath $attemptRoot 'fixture-longpath-source' }
    default { Join-SafePath $attemptRoot 'fixture-success-source' }
}
Assert-ExactPath $SourceRoot $expectedSource 'F synthetic source'
$expectedCapture = switch ($Mode) {
    'ExpectedInternalLink' { Join-SafePath $attemptRoot 'expected/internal-link-stop' }
    'ExpectedPathEscape' { Join-SafePath $attemptRoot 'expected/path-escape-stop' }
    'FixtureLongPath' { Join-SafePath $attemptRoot 'captures/longpath-success' }
    default {
        $captureLeaf = [IO.Path]::GetFileName((Get-CanonicalPath $CaptureRoot))
        if (@('success-a','success-b') -notcontains $captureLeaf) { throw 'Unapproved success capture leaf' }
        Join-SafePath $attemptRoot "captures/$captureLeaf"
    }
}
Assert-ExactPath $CaptureRoot $expectedCapture 'F capture'
if ($Mode -ne 'FixtureLongPath') { Initialize-Fixture $attemptRoot }
$escape = if ($Mode -eq 'ExpectedPathEscape') { Join-SafePath $script:R5Root 'outside-attempt-path-escape' } else { $null }
$result = Invoke-CustodyCapture $Mode $SourceRoot $CaptureRoot $attemptRoot $attemptRoot $escape
if ($Mode -eq 'FixtureSuccess' -or $Mode -eq 'FixtureLongPath') {
    if ($result.stopped) { throw 'Success mode yielded a stop' }
    if ([IO.Path]::GetFileName((Get-CanonicalPath $CaptureRoot)) -eq 'success-b') { Write-DeterminismReport $attemptRoot }
} else {
    if (-not $result.stopped) { throw 'Expected stop did not stop' }
}
