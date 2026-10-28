# Private subprocess bridge. Its stdout is a pipe into the native sender only.
# Never run this interactively or redirect its output into an evidence file.
param([Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}$')][string]$ExpectedCiphertextSha256)
$ErrorActionPreference='Stop'
if (-not [Console]::IsOutputRedirected) { throw 'Secret bridge requires a private redirected pipe' }
$bindingPath=Join-Path $env:LOCALAPPDATA 'Pantheon/OM-PAN-001/secrets/anthropic-default.dpapi'
$bindingBytes=[IO.File]::ReadAllBytes($bindingPath)
$bindingHasher=[Security.Cryptography.SHA256]::Create()
try { $actualCiphertextSha256=[BitConverter]::ToString($bindingHasher.ComputeHash($bindingBytes)).Replace('-','').ToLowerInvariant() }
finally { $bindingHasher.Dispose() }
if($actualCiphertextSha256 -cne $ExpectedCiphertextSha256){throw 'Credential ciphertext binding changed'}
# Decode and decrypt the same checked byte buffer; never reopen an interchangeable binding file.
$bindingStream=[IO.MemoryStream]::new($bindingBytes,$false)
$bindingReader=[IO.StreamReader]::new($bindingStream,[Text.Encoding]::UTF8,$true)
try { $ciphertext=$bindingReader.ReadToEnd() } finally { $bindingReader.Dispose() }
$secureKey=ConvertTo-SecureString -String $ciphertext
$ciphertext=$null;$bindingBytes=$null
$plainKey=$null
try {
  $plainKey=[Net.NetworkCredential]::new('',$secureKey).Password
  if ($plainKey -notmatch '^sk-ant-[A-Za-z0-9_-]{20,300}$') { throw 'Binding format refused' }
  [Console]::Out.WriteLine('header = "x-api-key: '+$plainKey+'"')
  [Console]::Out.WriteLine('header = "anthropic-workspace-id: wrkspc_01Ddkc7MrJwHXBnjszr5fDrk"')
} finally { $plainKey=$null;$secureKey.Dispose() }
