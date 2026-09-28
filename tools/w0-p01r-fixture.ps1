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
$script:R1Root = 'D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913'
$script:SRoot = 'D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260913-w0-p01r-source-capture-01'
$script:Patent = 'D:/Repos/keon-omega/keon-docs-internal/patents'
$script:Doctrine = 'D:/Repos/keon-omega/keon-doctrine'
$script:ReviewA = 'D:/Repos/agent-skills-worktrees/provisional-patent-readiness-20260813/plugins/foreman-line/docs/goals/provisional-patent-readiness/handoffs/W0-P01R-R1-F-review-A-accept.json'
$script:ReviewB = 'D:/Repos/agent-skills-worktrees/provisional-patent-readiness-20260813/plugins/foreman-line/docs/goals/provisional-patent-readiness/handoffs/W0-P01R-R1-F-review-B-accept.json'
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
    if ([string]::IsNullOrWhiteSpace($env:R1_BUILDER_TASK_ID) -or [string]::IsNullOrWhiteSpace($env:R1_BUILDER_SESSION_ID)) { throw 'Builder task/session identity missing' }
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
        Write-TextOnce (Join-Path $success 'regular.txt') "synthetic success regular`n" $Attempt
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
        $receipt = [ordered]@{schemaVersion='w0-p01r-r1-layout-v2'; attemptRoot=$Attempt; subroots=$names; externalJunction=$externalLink; internalJunction=$internalLink; layoutSha256=(Get-LayoutDigest $Attempt)}
        Write-JsonOnce $receiptPath $receipt $Attempt
    } else {
        foreach ($name in $names) { if (-not [IO.Directory]::Exists((Join-Path $Attempt $name))) { throw "Fixture layout subroot missing: $name" } }
        $receipt = Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json
        if ($receipt.layoutSha256 -ne (Get-LayoutDigest $Attempt)) { throw 'Fixture layout digest mismatch' }
    }
}
function New-Envelope([string]$InvocationMode,[string]$Attempt,[string]$InputRoot,[string]$OutputRoot) {
    return [ordered]@{
        schemaVersion='w0-p01r-r1-v2'; mode=$InvocationMode; toolSha256=(Get-Sha256 $PSCommandPath)
        fixtureRoot=$Attempt; sourceRoot=$InputRoot; captureRoot=$OutputRoot
        startedAtUtc=[DateTime]::UtcNow.ToString('o'); completedAtUtc=$null
        remoteOperations=$false; sourceStability=$null; counts=[ordered]@{}
        entries=@(); assertions=[ordered]@{}
        builderSessionIdentity=[ordered]@{taskId=$env:R1_BUILDER_TASK_ID;sessionId=$env:R1_BUILDER_SESSION_ID}
        outputParentAclOwner=$null
    }
}
function Write-SidecarAndVerify([string]$Manifest,[string]$AuthorizedRoot) {
    $sidecar = "$Manifest.sha256"
    $digest = Get-Sha256 $Manifest
    Write-TextOnce $sidecar "$digest  $([IO.Path]::GetFileName($Manifest))" $AuthorizedRoot
    $recorded = ((Get-Content -LiteralPath $sidecar -Raw) -split ' ')[0]
    if ($recorded -ne (Get-Sha256 $Manifest)) { throw 'Sidecar verification failed' }
    return [ordered]@{manifestSha256=$digest;sidecarSha256=(Get-Sha256 $sidecar);sidecarPath=$sidecar}
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
        if (-not [IO.Directory]::Exists((Join-Path $payload 'empty-directory'))) { throw 'Empty directory not copied' }
    }
    $envelope['completedAtUtc'] = [DateTime]::UtcNow.ToString('o')
    $manifestPath = Join-Path $OutputRoot 'manifest.json'
    Write-JsonOnce $manifestPath $envelope $AuthorizedRoot
    $sidecar = Write-SidecarAndVerify $manifestPath $AuthorizedRoot
    $reloaded = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    if ($reloaded.entries.Count -ne $entries.Count -or -not $reloaded.assertions.acceptedCapture -or -not $reloaded.sourceStability.stable -or $reloaded.counts.payloadFiles -ne $files.Count) { throw 'Final persisted manifest differs from reviewed in-memory assertions' }
    foreach ($record in $reloaded.entries) { if ($null -eq $record.PSObject.Properties['payloadSha256']) { throw 'Persisted manifest omitted payloadSha256' } }
    return [ordered]@{stopped=$false;manifestPath=$manifestPath;manifestSha256=$sidecar['manifestSha256'];sidecarSha256=$sidecar['sidecarSha256'];sourceInventory=$post;counts=$envelope['counts']}
}
function Write-DeterminismReport([string]$Attempt) {
    $aPath = Join-Path $Attempt 'captures/success-a/manifest.json'
    $bPath = Join-Path $Attempt 'captures/success-b/manifest.json'
    $a = Get-Content -LiteralPath $aPath -Raw | ConvertFrom-Json
    $b = Get-Content -LiteralPath $bPath -Raw | ConvertFrom-Json
    foreach ($m in @($a,$b)) { $m.startedAtUtc=$null; $m.completedAtUtc=$null; $m.captureRoot=$null }
    $normalizedA = $a | ConvertTo-Json -Depth 40 -Compress
    $normalizedB = $b | ConvertTo-Json -Depth 40 -Compress
    $matches = $normalizedA -ceq $normalizedB
    $report = [ordered]@{
        schemaVersion='w0-p01r-r1-determinism-v1'; matches=$matches
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
        $head = (& git -C $Root rev-parse HEAD)
        if ($LASTEXITCODE -ne 0) { throw 'Local Git HEAD read failed' }
        $tracked = @(& git -C $Root ls-files --cached -- .)
        if ($LASTEXITCODE -ne 0) { throw 'Local Git tracked read failed' }
        $unstagedDeleted = @(& git -C $Root ls-files --deleted -- .)
        if ($LASTEXITCODE -ne 0) { throw 'Local Git unstaged-deletion read failed' }
        $stagedDeleted = @(& git -C $Root diff --cached --name-only --diff-filter=D --relative -- .)
        if ($LASTEXITCODE -ne 0) { throw 'Local Git staged-deletion read failed' }
        $deleted = @($unstagedDeleted + $stagedDeleted | Sort-Object -Unique)
        $status = @(& git -C $Root status --porcelain=v1 --untracked-files=all --ignored -- .)
        if ($LASTEXITCODE -ne 0) { throw 'Local Git status read failed' }
        return [ordered]@{
            head=[string]$head;trackedPaths=$tracked;unstagedDeletedPaths=$unstagedDeleted;stagedDeletedPaths=$stagedDeleted;deletedPaths=$deleted;statusPorcelain=$status
            trackedCount=$tracked.Count;untrackedCount=@($status | Where-Object { $_ -match '^\?\?' }).Count
            ignoredCount=@($status | Where-Object { $_ -match '^!!' }).Count
            stagedDirtyCount=@($status | Where-Object { $_ -match '^[MADRCU]' }).Count
            unstagedDirtyCount=@($status | Where-Object { $_ -match '^.[MADRCU]' }).Count
            deletedCount=$deleted.Count
        }
    } finally { $env:GIT_OPTIONAL_LOCKS=$old }
}
function Assert-FReviews([string]$Attempt,[string]$Digest) {
    $reviews = @()
    $evidenceFields = @(
        'harnessSha256','fixtureLayoutReceiptSha256','preflightReceiptSha256',
        'commandContractSha256','commandReceiptSha256','successReceiptSha256',
        'successAManifestSha256','successASidecarSha256',
        'successBManifestSha256','successBSidecarSha256',
        'internalLinkStopSha256','pathEscapeStopSha256','determinismComparisonSha256'
    )
    foreach ($path in @($script:ReviewA,$script:ReviewB)) {
        if (-not [IO.File]::Exists($path)) { throw "Missing F ACCEPT record: $path" }
        $review = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
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
    if (-not (Test-WithinRoot $attempt $script:R1Root) -or @('attempt-02','attempt-03') -notcontains [IO.Path]::GetFileName($attempt)) { throw 'S must use accepted R1 attempt snapshot' }
    Assert-ExactPath $PSCommandPath (Join-Path $attempt 'script-snapshot.ps1') 'S script snapshot'
    $reviews = @(Assert-FReviews $attempt $actual)
    if (Test-Path -LiteralPath $CaptureRoot) { throw 'S output root is not initially absent' }
    Assert-OutputPath $CaptureRoot $CaptureRoot
    foreach ($root in @($PatentRoot,$DoctrineRoot)) { if (-not [IO.Directory]::Exists($root)) { throw "S approved source absent: $root" } }
    $started = [DateTime]::UtcNow.ToString('o')
    $parentAcl = Get-AclObservation ([IO.Path]::GetDirectoryName((Get-CanonicalPath $CaptureRoot)))
    $prePatent = @(Get-Inventory $PatentRoot); $preDoctrine = @(Get-Inventory $DoctrineRoot)
    $gitPatent = Get-GitBaseline $PatentRoot; $gitDoctrine = Get-GitBaseline $DoctrineRoot
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
    $patentManifest = Get-Content -LiteralPath $patentCapture.manifestPath -Raw | ConvertFrom-Json
    $doctrineManifest = Get-Content -LiteralPath $doctrineCapture.manifestPath -Raw | ConvertFrom-Json
    $allEntries = New-Object 'System.Collections.Generic.List[object]'
    foreach ($track in @(@{name='patents';manifest=$patentManifest},@{name='doctrine';manifest=$doctrineManifest})) {
        foreach ($entry in $track.manifest.entries) {
            $copy = [ordered]@{}
            foreach ($property in $entry.PSObject.Properties) { $copy[$property.Name] = $property.Value }
            $copy['relativePath'] = "$($track.name)/$($entry.relativePath)"
            $allEntries.Add($copy)
        }
    }
    foreach ($relative in $gitPatent.deletedPaths) {
        $absent = New-Entry "patents/$relative" 'ABSENT_TRACKED' 'TRACKED_DELETED'
        $absent['copyResult'] = 'ABSENT_NOT_COPIED'; $absent['reason'] = 'TRACKED_BUT_DELETED'
        $allEntries.Add($absent)
    }
    foreach ($relative in $gitDoctrine.deletedPaths) {
        $absent = New-Entry "doctrine/$relative" 'ABSENT_TRACKED' 'TRACKED_DELETED'
        $absent['copyResult'] = 'ABSENT_NOT_COPIED'; $absent['reason'] = 'TRACKED_BUT_DELETED'
        $allEntries.Add($absent)
    }
    $sourceFiles = [int]$patentManifest.counts.sourceFiles + [int]$doctrineManifest.counts.sourceFiles
    $payloadFiles = [int]$patentManifest.counts.payloadFiles + [int]$doctrineManifest.counts.payloadFiles
    $sourceDirs = [int]$patentManifest.counts.sourceDirectories + [int]$doctrineManifest.counts.sourceDirectories
    $payloadDirs = [int]$patentManifest.counts.payloadDirectories + [int]$doctrineManifest.counts.payloadDirectories
    if ($sourceFiles -ne $payloadFiles -or $sourceDirs -ne $payloadDirs -or -not $patentManifest.assertions.aggregateHashesEqual -or -not $doctrineManifest.assertions.aggregateHashesEqual) { throw 'S combined count/hash mismatch' }
    $combined = [ordered]@{
        schemaVersion='w0-p01r-r1-source-v2';mode='SourceCapture';toolSha256=$actual
        fixtureRoot=$null;sourceRoot=[ordered]@{patent=$PatentRoot;doctrine=$DoctrineRoot};captureRoot=$CaptureRoot
        startedAtUtc=$started;completedAtUtc=[DateTime]::UtcNow.ToString('o')
        remoteOperations=$false
        sourceStability=[ordered]@{patentPreSha256=$patentPreDigest;patentPostSha256=$patentPostDigest;doctrinePreSha256=$doctrinePreDigest;doctrinePostSha256=$doctrinePostDigest;stable=$stable}
        counts=[ordered]@{sourceFiles=$sourceFiles;payloadFiles=$payloadFiles;sourceDirectories=$sourceDirs;payloadDirectories=$payloadDirs;trackedDeleted=($gitPatent.deletedCount + $gitDoctrine.deletedCount);entryCount=$allEntries.Count}
        entries=$allEntries.ToArray()
        assertions=[ordered]@{sourceStable=$stable;gitStable=$true;fileCountsEqual=($sourceFiles -eq $payloadFiles);directoryCountsEqual=($sourceDirs -eq $payloadDirs);patentAggregateHashesEqual=$patentManifest.assertions.aggregateHashesEqual;doctrineAggregateHashesEqual=$doctrineManifest.assertions.aggregateHashesEqual;remoteOperations=$false;acceptedCapture=$true}
        selectedAttempt=[IO.Path]::GetFileName($attempt)
        expectedToolSha256=$ExpectedToolSha256.ToUpperInvariant();actualToolSha256=$actual
        patentSourceRoot=$PatentRoot;doctrineSourceRoot=$DoctrineRoot
        fReviewASha256=$reviews[0].sha256;fReviewBSha256=$reviews[1].sha256
        sourceInventoryPre=[ordered]@{patent=$prePatent;doctrine=$preDoctrine}
        sourceInventoryPost=[ordered]@{patent=$postPatent;doctrine=$postDoctrine}
        gitBaseline=[ordered]@{patent=$gitPatent;doctrine=$gitDoctrine}
        trackResults=[ordered]@{patent=$patentCapture;doctrine=$doctrineCapture}
        outputParentAclOwner=$parentAcl
        builderSessionIdentity=[ordered]@{taskId=$env:R1_BUILDER_TASK_ID;sessionId=$env:R1_BUILDER_SESSION_ID}
    }
    $combinedPath = Join-Path $CaptureRoot 'combined-manifest.json'
    Write-JsonOnce $combinedPath $combined $CaptureRoot
    $combinedSidecar = Write-SidecarAndVerify $combinedPath $CaptureRoot
    $reloaded = Get-Content -LiteralPath $combinedPath -Raw | ConvertFrom-Json
    foreach ($field in @('schemaVersion','mode','toolSha256','fixtureRoot','sourceRoot','captureRoot','startedAtUtc','completedAtUtc','remoteOperations','sourceStability','counts','entries','assertions','expectedToolSha256','actualToolSha256','fReviewASha256','fReviewBSha256','gitBaseline','outputParentAclOwner','builderSessionIdentity')) {
        if ($null -eq $reloaded.PSObject.Properties[$field]) { throw "Persisted combined S manifest missing $field" }
    }
    if ($reloaded.schemaVersion -ne 'w0-p01r-r1-source-v2' -or $reloaded.mode -ne 'SourceCapture' -or $reloaded.toolSha256 -ne $actual -or $reloaded.expectedToolSha256 -ne $actual -or $reloaded.actualToolSha256 -ne $actual) { throw 'Persisted S tool binding mismatch' }
    if ($reloaded.fReviewASha256 -ne $reviews[0].sha256 -or $reloaded.fReviewBSha256 -ne $reviews[1].sha256) { throw 'Persisted S F-review binding mismatch' }
    if (-not $reloaded.assertions.acceptedCapture -or -not $reloaded.assertions.sourceStable -or -not $reloaded.assertions.gitStable -or -not $reloaded.assertions.fileCountsEqual -or -not $reloaded.assertions.directoryCountsEqual -or -not $reloaded.assertions.patentAggregateHashesEqual -or -not $reloaded.assertions.doctrineAggregateHashesEqual -or -not $reloaded.sourceStability.stable -or $reloaded.remoteOperations) { throw 'Persisted combined S assertions failed' }
    if ($reloaded.entries.Count -ne $allEntries.Count -or $reloaded.counts.sourceFiles -ne $sourceFiles -or $reloaded.counts.payloadFiles -ne $payloadFiles -or $reloaded.counts.trackedDeleted -ne ($gitPatent.deletedCount + $gitDoctrine.deletedCount)) { throw 'Persisted combined S entry/count mismatch' }
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
if (-not (Test-WithinRoot $FixtureRoot $script:R1Root) -or @('attempt-02','attempt-03') -notcontains [IO.Path]::GetFileName((Get-CanonicalPath $FixtureRoot))) { throw 'F fixture root must be the exact fresh R1 attempt' }
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
$escape = if ($Mode -eq 'ExpectedPathEscape') { Join-Path $script:R1Root 'outside-attempt-path-escape' } else { $null }
$result = Invoke-CustodyCapture $Mode $SourceRoot $CaptureRoot $attemptRoot $attemptRoot $escape
if ($Mode -eq 'FixtureSuccess') {
    if ($result.stopped) { throw 'Success mode yielded a stop' }
    if ([IO.Path]::GetFileName((Get-CanonicalPath $CaptureRoot)) -eq 'success-b') { Write-DeterminismReport $attemptRoot }
} else {
    if (-not $result.stopped) { throw 'Expected stop did not stop' }
}
