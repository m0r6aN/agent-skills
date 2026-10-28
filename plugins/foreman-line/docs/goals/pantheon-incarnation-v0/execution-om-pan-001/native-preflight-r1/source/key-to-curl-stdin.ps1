# Private subprocess bridge. Its stdout is a pipe into the native sender only.
# Never run this interactively or redirect its output into an evidence file.
$ErrorActionPreference='Stop'
if (-not [Console]::IsOutputRedirected) { throw 'Secret bridge requires a private redirected pipe' }
$bindingPath=Join-Path $env:LOCALAPPDATA 'Pantheon/OM-PAN-001/secrets/anthropic-default.dpapi'
$secureKey=Get-Content -LiteralPath $bindingPath -Raw | ConvertTo-SecureString
$plainKey=$null
try {
  $plainKey=[Net.NetworkCredential]::new('',$secureKey).Password
  if ($plainKey -notmatch '^sk-ant-[A-Za-z0-9_-]{20,300}$') { throw 'Binding format refused' }
  [Console]::Out.WriteLine('header = "x-api-key: '+$plainKey+'"')
  [Console]::Out.WriteLine('header = "anthropic-workspace-id: wrkspc_01Ddkc7MrJwHXBnjszr5fDrk"')
} finally { $plainKey=$null;$secureKey.Dispose() }
