# Read-only exact-owner/held-lock probe. Never resolves credentials or writes authority state.
param([Parameter(Mandatory=$true)][string]$OwnerFile,[Parameter(Mandatory=$true)][string]$LockFile)
$ErrorActionPreference='Stop'
try {
  if(-not [IO.File]::Exists($OwnerFile) -or -not [IO.File]::Exists($LockFile)){exit 10}
  $owner=Get-Content -LiteralPath $OwnerFile -Raw|ConvertFrom-Json
  if($owner.ownerSessionId -ne '01a15424-1fd5-77a2-a73a-d92a60a5de34' -or $owner.host -ne 'M0R6AN' -or $owner.processId -le 0){exit 11}
  $process=Get-Process -Id $owner.processId -ErrorAction Stop
  if($process.StartTime.ToUniversalTime().ToString('o') -cne $owner.processStartedUtc){exit 12}
  try {
    $handle=[IO.File]::Open($LockFile,[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
    $handle.Dispose();exit 13 # Existing but unheld is never authority.
  } catch [IO.IOException] {
    $win32=$_.Exception.HResult -band 0xffff
    if($win32 -ne 32 -and $win32 -ne 33){exit 14} # Only sharing/lock violations qualify.
    if(-not [IO.File]::Exists($LockFile)){exit 15}
    $again=Get-Process -Id $owner.processId -ErrorAction Stop
    if($again.StartTime.ToUniversalTime().ToString('o') -cne $owner.processStartedUtc){exit 16}
    [Console]::Out.Write('HELD');exit 0
  }
} catch {exit 17} # Missing paths, ACL denial, malformed JSON, stale PID and other IO failures fail closed.
