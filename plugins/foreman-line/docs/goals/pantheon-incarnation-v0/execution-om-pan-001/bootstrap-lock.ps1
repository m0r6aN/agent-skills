param([Parameter(Mandatory=$true)][string]$OwnerSessionId)
$ErrorActionPreference = 'Stop'
$stateDir = $PSScriptRoot
$lockPath = Join-Path $stateDir 'bootstrap-owner.lock'
$stopPath = Join-Path $stateDir 'bootstrap-release.request'
if (Test-Path -LiteralPath $stopPath) { throw 'Stale release request must be reconciled before acquisition.' }
$stream = [System.IO.File]::Open($lockPath, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
try {
  $acquired = [DateTimeOffset]::UtcNow
  $owner = [ordered]@{schema='pantheon.bootstrap-lock.v1';ownerSessionId=$OwnerSessionId;processId=$PID;processStartedUtc=(Get-Process -Id $PID).StartTime.ToUniversalTime().ToString('o');host=$env:COMPUTERNAME;acquiredAtUtc=$acquired.ToString('o');mechanism='Windows exclusive FileStream; single-host bootstrap only';runtimeLease=$false}
  $bytes = [Text.Encoding]::UTF8.GetBytes(($owner | ConvertTo-Json -Compress))
  $stream.SetLength(0); $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true)
  $owner | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $stateDir 'bootstrap-owner.json') -Encoding utf8
  $owner | ConvertTo-Json -Compress
  while (-not (Test-Path -LiteralPath $stopPath)) {
    if (([DateTimeOffset]::UtcNow - $acquired).TotalHours -ge 2) { break }
    [Threading.Thread]::Sleep(1000)
  }
} finally {
  $stream.Dispose()
  [ordered]@{ownerSessionId=$OwnerSessionId;releasedAtUtc=[DateTimeOffset]::UtcNow.ToString('o');processId=$PID} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $stateDir 'bootstrap-release.json') -Encoding utf8
}
