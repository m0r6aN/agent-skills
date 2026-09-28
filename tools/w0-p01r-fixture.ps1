[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('FixtureSuccess', 'ExpectedInternalLink', 'ExpectedPathEscape', 'SourceCapture')]
    [string]$Mode,

    [string]$FixtureRoot,
    [string]$SourceRoot,
    [string]$CaptureRoot,
    [string]$ResultPath,
    [string]$PatentRoot,
    [string]$DoctrineRoot,
    [string]$ExpectedToolSha256
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:SchemaVersion = 'w0-p01r-fixture-v1'
$script:EphemeraNames = @('node_modules', 'bin', 'obj', '.next', '.artifacts', '.vs', '.venv', 'dist', 'packages', '.turbo', '.nuget', 'TestResults')
$script:RequiredEntryFields = @('relativePath', 'entryType', 'classification', 'traversed', 'byteLength', 'sourceSha256', 'payloadSha256', 'copyResult')

function Get-CanonicalPath {
    param([Parameter(Mandatory = $true)][string]$Path)
    return [System.IO.Path]::GetFullPath($Path).TrimEnd([char]'\', [char]'/')
}

function Get-RelativePathUnderRoot {
    param(
        [Parameter(Mandatory = $true)][string]$Root,
        [Parameter(Mandatory = $true)][string]$Candidate
    )

    $canonicalRoot = Get-CanonicalPath -Path $Root
    $canonicalCandidate = Get-CanonicalPath -Path $Candidate
    if ([string]::Equals($canonicalCandidate, $canonicalRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        return ''
    }

    $rootWithSeparator = $canonicalRoot + [System.IO.Path]::DirectorySeparatorChar
    if (-not $canonicalCandidate.StartsWith($rootWithSeparator, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Path escapes asserted root. Root='$canonicalRoot'; Candidate='$canonicalCandidate'."
    }
    return $canonicalCandidate.Substring($rootWithSeparator.Length)
}

function Test-PathUnderRoot {
    param([Parameter(Mandatory = $true)][string]$Root, [Parameter(Mandatory = $true)][string]$Candidate)
    try {
        $null = Get-RelativePathUnderRoot -Root $Root -Candidate $Candidate
        return $true
    } catch {
        return $false
    }
}

function New-ManifestEntry {
    param(
        [Parameter(Mandatory = $true)][string]$RelativePath,
        [Parameter(Mandatory = $true)][string]$EntryType,
        [Parameter(Mandatory = $true)][string]$Classification
    )

    return [ordered]@{
        relativePath = $RelativePath
        entryType = $EntryType
        classification = $Classification
        traversed = $false
        byteLength = $null
        sourceSha256 = $null
        payloadSha256 = $null
        copyResult = $null
        reason = $null
        immediateEntryCount = $null
        enumerationError = $null
        linkType = $null
        resolvedTarget = $null
        targetWithinRoot = $null
    }
}

function Assert-EntrySchema {
    $entry = New-ManifestEntry -RelativePath 'schema-smoke.txt' -EntryType 'FILE' -Classification 'INCLUDED'
    $entry['payloadSha256'] = '0123456789abcdef'
    foreach ($field in $script:RequiredEntryFields) {
        if (-not $entry.Contains($field)) { throw "Schema smoke failure: missing field '$field'." }
    }
    if ($entry['payloadSha256'] -ne '0123456789abcdef') { throw 'Schema smoke failure: payloadSha256 is not writable.' }
    return [ordered]@{ passed = $true; payloadSha256 = $entry['payloadSha256']; fields = @($entry.Keys) }
}

function Assert-ScriptParses {
    $tokens = $null
    $parseErrors = $null
    [void][System.Management.Automation.Language.Parser]::ParseFile($PSCommandPath, [ref]$tokens, [ref]$parseErrors)
    if ($parseErrors.Count -ne 0) {
        throw ('PowerShell parser errors: ' + (($parseErrors | ForEach-Object { $_.Message }) -join '; '))
    }
    return [ordered]@{ passed = $true; errorCount = 0 }
}

function Test-IsReparsePoint {
    param([Parameter(Mandatory = $true)]$Item)
    return (($Item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)
}

function Get-LinkMetadata {
    param([Parameter(Mandatory = $true)]$Item, [Parameter(Mandatory = $true)][string]$SourceRoot)
    $linkType = if ($Item.PSObject.Properties.Name -contains 'LinkType') { [string]$Item.LinkType } else { 'ReparsePoint' }
    $targetText = if ($Item.PSObject.Properties.Name -contains 'Target') { [string]$Item.Target } else { $null }
    $resolvedTarget = $null
    if (-not [string]::IsNullOrWhiteSpace($targetText)) {
        if ([System.IO.Path]::IsPathRooted($targetText)) {
            $resolvedTarget = Get-CanonicalPath -Path $targetText
        } else {
            $resolvedTarget = Get-CanonicalPath -Path (Join-Path -Path $Item.DirectoryName -ChildPath $targetText)
        }
    }
    return [ordered]@{
        linkType = $linkType
        resolvedTarget = $resolvedTarget
        targetWithinRoot = if ($null -eq $resolvedTarget) { $null } else { Test-PathUnderRoot -Root $SourceRoot -Candidate $resolvedTarget }
    }
}

function Get-ImmediateChildObservation {
    param([Parameter(Mandatory = $true)][string]$Path)
    try {
        return [ordered]@{ count = @((Get-ChildItem -LiteralPath $Path -Force -ErrorAction Stop)).Count; error = $null }
    } catch {
        return [ordered]@{ count = $null; error = $_.Exception.Message }
    }
}

function Write-JsonFile {
    param([Parameter(Mandatory = $true)][string]$Path, [Parameter(Mandatory = $true)]$Value)
    $parent = Split-Path -Parent $Path
    if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    $json = $Value | ConvertTo-Json -Depth 32
    [System.IO.File]::WriteAllText($Path, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
}

function Get-FileSha256 {
    param([Parameter(Mandatory = $true)][string]$Path)
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Write-ManifestAndSidecar {
    param([Parameter(Mandatory = $true)][string]$CaptureRoot, [Parameter(Mandatory = $true)]$Manifest)
    $manifestPath = Join-Path -Path $CaptureRoot -ChildPath 'manifest.json'
    Write-JsonFile -Path $manifestPath -Value $Manifest
    $manifestHash = Get-FileSha256 -Path $manifestPath
    $sidecarPath = Join-Path -Path $CaptureRoot -ChildPath 'manifest.sha256'
    [System.IO.File]::WriteAllText($sidecarPath, ("$manifestHash  manifest.json" + [Environment]::NewLine), [System.Text.UTF8Encoding]::new($false))
    $sidecarText = [System.IO.File]::ReadAllText($sidecarPath).Trim()
    if ($sidecarText -ne "$manifestHash  manifest.json") { throw 'Manifest sidecar verification failed.' }
    return [ordered]@{ manifestPath = $manifestPath; sidecarPath = $sidecarPath; manifestSha256 = $manifestHash; sidecarVerified = $true }
}

function Assert-CaptureRootAbsent {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (Test-Path -LiteralPath $Path) { throw "Capture/result root already exists: $Path" }
}

function Invoke-CustodyCapture {
    param(
        [Parameter(Mandatory = $true)][string]$RunMode,
        [Parameter(Mandatory = $true)][string]$FixtureRoot,
        [Parameter(Mandatory = $true)][string]$SourceRoot,
        [Parameter(Mandatory = $true)][string]$CaptureRoot,
        [hashtable]$AdditionalManifestFields = @{}
    )

    Assert-CaptureRootAbsent -Path $CaptureRoot
    $canonicalSourceRoot = Get-CanonicalPath -Path $SourceRoot
    $canonicalCaptureRoot = Get-CanonicalPath -Path $CaptureRoot
    if (-not (Test-Path -LiteralPath $canonicalSourceRoot -PathType Container)) { throw "Source root does not exist: $canonicalSourceRoot" }
    if (-not (Test-PathUnderRoot -Root $FixtureRoot -Candidate $canonicalSourceRoot) -and $RunMode -ne 'SourceCapture') { throw 'Fixture mode source root escapes fixture root.' }

    New-Item -ItemType Directory -Path $canonicalCaptureRoot -ErrorAction Stop | Out-Null
    $payloadRoot = Join-Path -Path $canonicalCaptureRoot -ChildPath 'payload'
    New-Item -ItemType Directory -Path $payloadRoot -ErrorAction Stop | Out-Null

    $entries = New-Object System.Collections.Generic.List[object]
    $queue = New-Object System.Collections.Generic.Queue[string]
    $queue.Enqueue($canonicalSourceRoot)
    $internalLink = $null

    while ($queue.Count -gt 0) {
        $current = $queue.Dequeue()
        $children = @(Get-ChildItem -LiteralPath $current -Force -ErrorAction Stop | Sort-Object -Property @{ Expression = { $_.FullName.ToUpperInvariant() } })
        foreach ($item in $children) {
            $relativePath = Get-RelativePathUnderRoot -Root $canonicalSourceRoot -Candidate $item.FullName
            $destination = Join-Path -Path $payloadRoot -ChildPath $relativePath
            $isDirectory = ($item.PSIsContainer -or (($item.Attributes -band [System.IO.FileAttributes]::Directory) -ne 0))
            $isExcluded = $isDirectory -and ($script:EphemeraNames -contains $item.Name)
            $isReparse = Test-IsReparsePoint -Item $item

            if ($isExcluded) {
                $entry = New-ManifestEntry -RelativePath $relativePath -EntryType 'DIRECTORY' -Classification 'EXCLUDED'
                $entry['reason'] = 'BUILD_EPHEMERA'
                $entry['traversed'] = $false
                if ($isReparse) {
                    $entry['enumerationError'] = 'Not enumerated: excluded reparse point is never traversed.'
                } else {
                    $observation = Get-ImmediateChildObservation -Path $item.FullName
                    $entry['immediateEntryCount'] = $observation.count
                    $entry['enumerationError'] = $observation.error
                }
                $entry['copyResult'] = 'NOT_COPIED'
                [void]$entries.Add($entry)
                continue
            }

            if ($isReparse) {
                $metadata = Get-LinkMetadata -Item $item -SourceRoot $canonicalSourceRoot
                $classification = if ($metadata.targetWithinRoot -eq $true) { 'LINK_INTERNAL' } else { 'LINK_OPAQUE' }
                $entry = New-ManifestEntry -RelativePath $relativePath -EntryType 'REPARSE_POINT' -Classification $classification
                $entry['traversed'] = $false
                $entry['copyResult'] = 'NOT_COPIED'
                $entry['linkType'] = $metadata.linkType
                $entry['resolvedTarget'] = $metadata.resolvedTarget
                $entry['targetWithinRoot'] = $metadata.targetWithinRoot
                [void]$entries.Add($entry)
                if ($classification -eq 'LINK_INTERNAL') { $internalLink = $entry; break }
                continue
            }

            if ($isDirectory) {
                New-Item -ItemType Directory -Path $destination -Force | Out-Null
                $entry = New-ManifestEntry -RelativePath $relativePath -EntryType 'DIRECTORY' -Classification 'INCLUDED'
                $entry['traversed'] = $true
                $entry['copyResult'] = 'CREATED'
                [void]$entries.Add($entry)
                $queue.Enqueue($item.FullName)
                continue
            }

            $destinationParent = Split-Path -Parent $destination
            if (-not (Test-Path -LiteralPath $destinationParent)) { New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null }
            $sourceHash = Get-FileSha256 -Path $item.FullName
            Copy-Item -LiteralPath $item.FullName -Destination $destination -ErrorAction Stop
            $payloadHash = Get-FileSha256 -Path $destination
            if ($sourceHash -ne $payloadHash) { throw "Hash mismatch copying '$relativePath'." }
            $entry = New-ManifestEntry -RelativePath $relativePath -EntryType 'FILE' -Classification 'INCLUDED'
            $entry['traversed'] = $true
            $entry['byteLength'] = [Int64]$item.Length
            $entry['sourceSha256'] = $sourceHash
            $entry['payloadSha256'] = $payloadHash
            $entry['copyResult'] = 'COPIED'
            [void]$entries.Add($entry)
        }
        if ($null -ne $internalLink) { break }
    }

    $toolHash = Get-FileSha256 -Path $PSCommandPath
    $counts = [ordered]@{
        total = $entries.Count
        includedFiles = @($entries | Where-Object { $_['entryType'] -eq 'FILE' -and $_['copyResult'] -eq 'COPIED' }).Count
        includedDirectories = @($entries | Where-Object { $_['entryType'] -eq 'DIRECTORY' -and $_['classification'] -eq 'INCLUDED' }).Count
        excluded = @($entries | Where-Object { $_['classification'] -eq 'EXCLUDED' }).Count
        opaqueLinks = @($entries | Where-Object { $_['classification'] -eq 'LINK_OPAQUE' }).Count
        internalLinks = @($entries | Where-Object { $_['classification'] -eq 'LINK_INTERNAL' }).Count
    }
    $manifest = [ordered]@{
        schemaVersion = $script:SchemaVersion
        mode = $RunMode
        toolSha256 = $toolHash
        fixtureRoot = (Get-CanonicalPath -Path $FixtureRoot)
        sourceRoot = $canonicalSourceRoot
        captureRoot = $canonicalCaptureRoot
        startedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
        completedAtUtc = $null
        remoteOperations = $false
        sourceStability = [ordered]@{ stable = $true; method = 'single synthetic capture pass' }
        counts = $counts
        entries = @($entries)
        assertions = [ordered]@{
            parser = (Assert-ScriptParses)
            schemaSmoke = (Assert-EntrySchema)
            payloadHashesMatch = $true
            internalLinkDetected = ($null -ne $internalLink)
        }
    }
    foreach ($key in $AdditionalManifestFields.Keys) { $manifest[$key] = $AdditionalManifestFields[$key] }

    if ($null -ne $internalLink) {
        $manifest['stopReason'] = 'LINK_INTERNAL'
        $manifest['completedAtUtc'] = (Get-Date).ToUniversalTime().ToString('o')
        return [ordered]@{ accepted = $false; stopReason = 'LINK_INTERNAL'; manifest = $manifest; captureRoot = $canonicalCaptureRoot }
    }

    $manifest['completedAtUtc'] = (Get-Date).ToUniversalTime().ToString('o')
    $receipt = Write-ManifestAndSidecar -CaptureRoot $canonicalCaptureRoot -Manifest $manifest
    return [ordered]@{ accepted = $true; manifest = $manifest; receipt = $receipt; captureRoot = $canonicalCaptureRoot }
}

function New-FixtureLayout {
    param([Parameter(Mandatory = $true)][string]$FixtureRoot)
    $root = Get-CanonicalPath -Path $FixtureRoot
    if (-not (Test-Path -LiteralPath $root)) {
        New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
        $success = Join-Path $root 'fixture-success-source'
        $internal = Join-Path $root 'fixture-internal-link-source'
        $externalTarget = Join-Path $root 'referents/external-target'
        $internalTarget = Join-Path $internal 'authored-internal-target'
        foreach ($path in @($success, $internal, $externalTarget, $internalTarget, (Join-Path $success 'empty-directory'))) { New-Item -ItemType Directory -Path $path -Force | Out-Null }
        [System.IO.File]::WriteAllText((Join-Path $success 'regular.txt'), 'synthetic fixture payload`n', [System.Text.UTF8Encoding]::new($false))
        [System.IO.File]::WriteAllText((Join-Path $success 'nested.txt'), 'second synthetic payload`n', [System.Text.UTF8Encoding]::new($false))
        foreach ($name in $script:EphemeraNames) {
            $path = Join-Path $success $name
            New-Item -ItemType Directory -Path $path -Force | Out-Null
            [System.IO.File]::WriteAllText((Join-Path $path 'unread.txt'), 'ephemera must not be copied', [System.Text.UTF8Encoding]::new($false))
        }
        [System.IO.File]::WriteAllText((Join-Path $externalTarget 'outside.txt'), 'external junction target', [System.Text.UTF8Encoding]::new($false))
        [System.IO.File]::WriteAllText((Join-Path $internalTarget 'inside.txt'), 'internal junction target', [System.Text.UTF8Encoding]::new($false))
        try {
            New-Item -ItemType Junction -Path (Join-Path $success 'external-junction') -Target $externalTarget -ErrorAction Stop | Out-Null
            New-Item -ItemType Junction -Path (Join-Path $internal 'internal-junction') -Target $internalTarget -ErrorAction Stop | Out-Null
        } catch {
            throw ('Fixture prerequisite failed: Windows junction creation is unavailable. ' + $_.Exception.Message)
        }
    }
    return $root
}

function Write-FixtureLedger {
    param([Parameter(Mandatory = $true)][string]$FixtureRoot, [Parameter(Mandatory = $true)][string]$Mode, [Parameter(Mandatory = $true)]$Result)
    $ledgerPath = Join-Path -Path $FixtureRoot -ChildPath 'fixture-command-ledger.jsonl'
    $record = [ordered]@{ timestampUtc = (Get-Date).ToUniversalTime().ToString('o'); mode = $Mode; result = $Result; protectedSourceAccess = $false; remoteOperations = $false }
    Add-Content -LiteralPath $ledgerPath -Value ($record | ConvertTo-Json -Compress -Depth 16) -Encoding utf8
}

function Invoke-FixtureSuccess {
    $root = New-FixtureLayout -FixtureRoot $FixtureRoot
    $result = Invoke-CustodyCapture -RunMode 'FixtureSuccess' -FixtureRoot $root -SourceRoot $SourceRoot -CaptureRoot $CaptureRoot
    if (-not $result.accepted) { throw "Fixture success unexpectedly stopped: $($result.stopReason)" }
    $manifest = $result.manifest
    if ($manifest.counts.excluded -ne $script:EphemeraNames.Count) { throw 'Fixture assertion failed: not every ephemera class was recorded.' }
    if ($manifest.counts.opaqueLinks -ne 1) { throw 'Fixture assertion failed: external junction was not recorded exactly once as opaque.' }
    if ($manifest.counts.internalLinks -ne 0) { throw 'Fixture assertion failed: success source contained an internal link.' }
    if (-not (Test-Path -LiteralPath (Join-Path $CaptureRoot 'payload/empty-directory') -PathType Container)) { throw 'Fixture assertion failed: empty directory did not persist.' }
    $result.manifest.assertions['fixtureAssertions'] = [ordered]@{ allEphemeraRecorded = $true; externalJunctionOpaque = $true; emptyDirectoryPersisted = $true; sourceFree = $true }
    Write-FixtureLedger -FixtureRoot $root -Mode 'FixtureSuccess' -Result $result.receipt
    return $result
}

function Invoke-ExpectedInternalLink {
    $root = New-FixtureLayout -FixtureRoot $FixtureRoot
    $result = Invoke-CustodyCapture -RunMode 'ExpectedInternalLink' -FixtureRoot $root -SourceRoot $SourceRoot -CaptureRoot $CaptureRoot
    if ($result.accepted -or $result.stopReason -ne 'LINK_INTERNAL') { throw 'Expected internal-link stop did not occur.' }
    $stopPath = Join-Path -Path $CaptureRoot -ChildPath 'stop.json'
    Write-JsonFile -Path $stopPath -Value $result.manifest
    Write-FixtureLedger -FixtureRoot $root -Mode 'ExpectedInternalLink' -Result ([ordered]@{ stopPath = $stopPath; stopReason = 'LINK_INTERNAL' })
    return [ordered]@{ stopPath = $stopPath; stopReason = 'LINK_INTERNAL' }
}

function Invoke-ExpectedPathEscape {
    $root = New-FixtureLayout -FixtureRoot $FixtureRoot
    if (Test-Path -LiteralPath $ResultPath) { throw "Result path already exists: $ResultPath" }
    $candidate = Join-Path -Path $root -ChildPath 'referents/external-target/outside.txt'
    $assertedRoot = Join-Path -Path $root -ChildPath 'fixture-success-source'
    $rejected = $false
    try { $null = Get-RelativePathUnderRoot -Root $assertedRoot -Candidate $candidate } catch { $rejected = $true }
    if (-not $rejected) { throw 'Expected path-escape rejection did not occur.' }
    Write-JsonFile -Path $ResultPath -Value ([ordered]@{ schemaVersion = $script:SchemaVersion; mode = 'ExpectedPathEscape'; stopReason = 'PATH_ESCAPE'; fixtureRoot = $root; assertedRoot = $assertedRoot; candidate = $candidate; remoteOperations = $false })
    Write-FixtureLedger -FixtureRoot $root -Mode 'ExpectedPathEscape' -Result ([ordered]@{ resultPath = $ResultPath; stopReason = 'PATH_ESCAPE' })
}

function Invoke-SourceCapture {
    if ([string]::IsNullOrWhiteSpace($ExpectedToolSha256)) { throw 'SourceCapture requires ExpectedToolSha256 from both accepted F reviews.' }
    $actual = Get-FileSha256 -Path $PSCommandPath
    if (-not [string]::Equals($actual, $ExpectedToolSha256, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'SourceCapture refused: script digest differs from accepted F digest.' }
    Assert-CaptureRootAbsent -Path $CaptureRoot
    New-Item -ItemType Directory -Path $CaptureRoot -ErrorAction Stop | Out-Null
    $patentResult = Invoke-CustodyCapture -RunMode 'SourceCapture' -FixtureRoot $FixtureRoot -SourceRoot $PatentRoot -CaptureRoot (Join-Path $CaptureRoot 'payload/keon-docs-internal-patents') -AdditionalManifestFields @{ expectedToolSha256 = $ExpectedToolSha256; actualToolSha256 = $actual; patentSourceRoot = (Get-CanonicalPath $PatentRoot); doctrineSourceRoot = (Get-CanonicalPath $DoctrineRoot) }
    $doctrineResult = Invoke-CustodyCapture -RunMode 'SourceCapture' -FixtureRoot $FixtureRoot -SourceRoot $DoctrineRoot -CaptureRoot (Join-Path $CaptureRoot 'payload/keon-doctrine') -AdditionalManifestFields @{ expectedToolSha256 = $ExpectedToolSha256; actualToolSha256 = $actual; patentSourceRoot = (Get-CanonicalPath $PatentRoot); doctrineSourceRoot = (Get-CanonicalPath $DoctrineRoot) }
    if (-not ($patentResult.accepted -and $doctrineResult.accepted)) { throw 'SourceCapture stopped; preserve output for adjudication.' }
    Write-JsonFile -Path (Join-Path $CaptureRoot 'source-capture-summary.json') -Value ([ordered]@{ schemaVersion = $script:SchemaVersion; expectedToolSha256 = $ExpectedToolSha256; actualToolSha256 = $actual; remoteOperations = $false; patent = $patentResult.receipt; doctrine = $doctrineResult.receipt })
}

switch ($Mode) {
    'FixtureSuccess' { Invoke-FixtureSuccess }
    'ExpectedInternalLink' { Invoke-ExpectedInternalLink }
    'ExpectedPathEscape' { Invoke-ExpectedPathEscape }
    'SourceCapture' { Invoke-SourceCapture }
}
