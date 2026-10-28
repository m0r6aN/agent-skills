# Read-only account qualification: exactly two supported metadata GETs, no inference.
$ErrorActionPreference='Stop'
$bindingPath=Join-Path $env:LOCALAPPDATA 'Pantheon/OM-PAN-001/secrets/anthropic-default.dpapi'
$curlPath=Join-Path $env:WINDIR 'System32/curl.exe'
if ((Get-FileHash -LiteralPath $curlPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne '73d24149ff289afc49ec41f08918ef9faa727d39ad993e929757dc2ddafab805') { throw 'Native curl source pin changed' }
$state=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'activation.json') -Raw | ConvertFrom-Json
if ($state.status -ne 'RATIFIED_BOOTSTRAP_ACTIVE' -or -not $state.autoReloadOffVerified -or [DateTimeOffset]::UtcNow -ge [DateTimeOffset]::Parse($state.expiresAt)) { throw 'Activation prerequisites failed' }
$outDir=Join-Path $PSScriptRoot 'account-metadata-3'
if (Test-Path -LiteralPath $outDir) { throw 'Metadata attempt already exists; reconcile before another read' }
New-Item -ItemType Directory -Path $outDir | Out-Null
$bindingCiphertext=[IO.File]::ReadAllBytes($bindingPath)
$bindingHasher=[Security.Cryptography.SHA256]::Create()
try { $bindingDigest=[BitConverter]::ToString($bindingHasher.ComputeHash($bindingCiphertext)).Replace('-','').ToLowerInvariant() } finally { $bindingHasher.Dispose() }
$secureKey=[Text.Encoding]::UTF8.GetString($bindingCiphertext).Trim() | ConvertTo-SecureString
$bindingCiphertext=$null
$plainKey=$null
try {
  $plainKey=[Net.NetworkCredential]::new('',$secureKey).Password
  if ($plainKey -notmatch '^sk-ant-[A-Za-z0-9_-]{20,300}$') { throw 'Binding format rejected without disclosure' }
  $workspaceId='wrkspc_01Ddkc7MrJwHXBnjszr5fDrk'
  $results=@()
  foreach($route in @(@{name='organization';url='https://api.anthropic.com/v1/organizations/me'},@{name='models';url='https://api.anthropic.com/v1/models?limit=100'})) {
    $start=[Diagnostics.ProcessStartInfo]::new()
    $start.FileName=$curlPath
    $start.Arguments='--disable --config - --request GET --retry 0 --max-redirs 0 --proto =https --noproxy "*" --connect-timeout 15 --max-time 60 --max-filesize 2097152 --silent --show-error --write-out "\n%{http_code}" "'+$route.url+'"'
    $start.UseShellExecute=$false; $start.CreateNoWindow=$true
    $start.RedirectStandardInput=$true; $start.RedirectStandardOutput=$true; $start.RedirectStandardError=$true
    foreach($name in @('ANTHROPIC_API_KEY','HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','CURL_CA_BUNDLE','SSL_CERT_FILE','SSL_CERT_DIR')) { $start.EnvironmentVariables.Remove($name) }
    $proc=[Diagnostics.Process]::new(); $proc.StartInfo=$start
    if(-not $proc.Start()){throw 'Native metadata process did not start'}
    $stdoutTask=$proc.StandardOutput.ReadToEndAsync();$stderrTask=$proc.StandardError.ReadToEndAsync()
    $proc.StandardInput.WriteLine('header = "x-api-key: '+$plainKey+'"')
    $proc.StandardInput.WriteLine('header = "anthropic-version: 2023-06-01"')
    if ($route.name -eq 'models') { $proc.StandardInput.WriteLine('header = "anthropic-workspace-id: '+$workspaceId+'"') }
    $proc.StandardInput.Close()
    if(-not $proc.WaitForExit(65000)){ $proc.Kill();$proc.WaitForExit();throw 'Metadata timeout; no automatic retry' }
    $stdout=$stdoutTask.Result; $stderr=$stderrTask.Result
    # Only cleansed metadata response is persisted; raw stderr is never emitted.
    $stdout=$stdout.Replace($plainKey,'[REDACTED]');$stderr=$stderr.Replace($plainKey,'[REDACTED]')
    $split=$stdout.LastIndexOf("`n");if($split -lt 0){throw 'Missing HTTP status'}
    $body=$stdout.Substring(0,$split);$status=$stdout.Substring($split+1).Trim()
    [IO.File]::WriteAllText((Join-Path $outDir ($route.name+'.json')),$body,[Text.UTF8Encoding]::new($false))
    $result=[ordered]@{route=$route.name;method='GET';httpStatus=$status;curlExitCode=$proc.ExitCode;stderrPresent=($stderr.Length -gt 0);recordedAtUtc=[DateTimeOffset]::UtcNow.ToString('o');responseSha256=(Get-FileHash -LiteralPath (Join-Path $outDir ($route.name+'.json')) -Algorithm SHA256).Hash.ToLowerInvariant()}
    $results+=$result
    $results | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $outDir 'transport.json') -Encoding utf8
    if($proc.ExitCode -ne 0 -or $status -ne '200'){throw ('Metadata refused: '+$route.name+' HTTP '+$status+'; curl '+$proc.ExitCode)}
    $proc.Dispose();$stdout=$null;$stderr=$null;$body=$null
  }
  $org=Get-Content -LiteralPath (Join-Path $outDir 'organization.json') -Raw | ConvertFrom-Json
  $models=Get-Content -LiteralPath (Join-Path $outDir 'models.json') -Raw | ConvertFrom-Json
  if($org.name -cne 'Morgan Findings LLC' -or $org.type -ne 'organization'){throw 'Account organization mismatch; route held'}
  $available=@($models.data | ForEach-Object {$_.id})
  if($available -notcontains 'claude-opus-5-5' -or $available -notcontains 'claude-sonnet-5-5'){throw 'Approved models missing from credential catalog'}
  if ((Get-FileHash -LiteralPath $bindingPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $bindingDigest) { throw 'Credential binding changed during qualification; no qualification issued' }
  $qualification=[ordered]@{credentialBindingCiphertextSha256=$bindingDigest;schema='pantheon.account-metadata-qualification.v1';at=[DateTimeOffset]::UtcNow.ToString('o');bindingName='pantheon-om-pan-001-anthropic-default';organization=$org.name;organizationId=$org.id;workspaceName='Default';workspaceId=$workspaceId;workspaceBindingEvidence='Console workspace ID plus successful authenticated GET with matching anthropic-workspace-id header';approvedModels=@('claude-opus-5-5','claude-sonnet-5-5');metadataQualified=$true;inferenceQualified=$false;providerInferenceCalls=0;secretValueLogged=$false;apiSources=@('https://platform.claude.com/docs/en/api/http/beta/organization/retrieve','https://platform.claude.com/docs/en/api/models/list')}
  $qualification | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $outDir 'qualification.json') -Encoding utf8
  $qualification | ConvertTo-Json -Depth 6
} finally { $plainKey=$null; $secureKey.Dispose() }
