# Run locally as the same Windows user as the trusted Pantheon broker.
# Accepts an EXISTING Morgan Findings LLC / Default workspace key; creates no provider access.
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'This binding uses Windows DPAPI CurrentUser.' }
$bindingDir = Join-Path $env:LOCALAPPDATA 'Pantheon\OM-PAN-001\secrets'
$bindingPath = Join-Path $bindingDir 'anthropic-default.dpapi'
if (Test-Path -LiteralPath $bindingPath) { throw 'Binding already exists; reconcile it rather than overwrite.' }
New-Item -ItemType Directory -Path $bindingDir -Force | Out-Null
$identity = [Security.Principal.WindowsIdentity]::GetCurrent().User
$acl = New-Object Security.AccessControl.DirectorySecurity
$acl.SetAccessRuleProtection($true,$false)
$rule = New-Object Security.AccessControl.FileSystemAccessRule($identity,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
$acl.AddAccessRule($rule)
Set-Acl -LiteralPath $bindingDir -AclObject $acl
$secureKey = Read-Host 'Paste the existing Anthropic Default workspace key (hidden input; never paste into chat)' -AsSecureString
if ($secureKey.Length -eq 0) { throw 'No key supplied; no binding written.' }
try {
  $encrypted = ConvertFrom-SecureString -SecureString $secureKey
  [IO.File]::WriteAllText($bindingPath,$encrypted,[Text.Encoding]::ASCII)
  Write-Output 'Existing key encrypted with Windows DPAPI CurrentUser.'
  Write-Output 'Binding name: pantheon-om-pan-001-anthropic-default'
  Write-Output 'This does not send a request or prove workspace identity/entitlement.'
} finally { $secureKey.Dispose(); $encrypted=$null }
