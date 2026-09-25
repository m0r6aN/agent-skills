param([Parameter(Mandatory=$true)][ValidateSet('grok','codex','claude','claude2','gemini')][string]$Seat)
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$brief = Get-Content -Raw (Join-Path $dir 'brief.md')
if ($Seat -eq 'grok') {
  & 'C:\Users\clint\.grok\bin\grok.exe' --always-approve --prompt-file (Join-Path $dir 'brief.md')
  exit $LASTEXITCODE
}
if ($Seat -eq 'codex') {
  $brief | & 'D:\nodejs_symlinks\codex.ps1' exec --skip-git-repo-check -
  exit $LASTEXITCODE
}
if ($Seat -eq 'claude') {
  $env:ANTHROPIC_BASE_URL = $null
  & 'D:\nodejs_symlinks\claude.ps1' -p $brief --allowedTools Read,Write
  exit $LASTEXITCODE
}
if ($Seat -eq 'claude2') {
  $env:ANTHROPIC_BASE_URL = $null
  $securityBrief = $brief + "`n`nAdditional lens: judge data egress, provider trust, package supply-chain risk, and how to prevent automatic routing from bypassing Foreman authority."
  & 'D:\nodejs_symlinks\claude.ps1' -p $securityBrief --allowedTools Read,Write
  exit $LASTEXITCODE
}
$node = 'D:\nodejs_symlinks\node.exe'
& $node 'D:\nodejs_symlinks\node_modules\@google\gemini-cli\bundle\gemini.js' -p $brief
exit $LASTEXITCODE
