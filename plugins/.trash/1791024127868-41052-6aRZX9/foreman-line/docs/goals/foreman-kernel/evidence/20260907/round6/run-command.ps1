param([Parameter(Mandatory=$true)][string]$Step)
$ErrorActionPreference = 'Stop'
$env:GIT_OPTIONAL_LOCKS = '0'
$evidenceRoot = $PSScriptRoot
$repoRoot = 'D:/Repos/agent-skills-worktrees/fk-p0-recovery-20260907'
$packageRoot = Join-Path $repoRoot 'plugins/foreman-line/authority-registry'
Set-Location -LiteralPath $packageRoot
$commands = @{
  '01-node' = @('node.exe', '-v')
  '02-install' = @('npm.cmd', 'ci')
  '03-typecheck' = @('npx.cmd', 'tsc', '--noEmit')
  '04-test' = @('npm.cmd', 'test')
  '05-biome' = @('npx.cmd', 'biome', 'check', '.')
  '06-validate' = @('npx.cmd', 'tsx', 'src/cli.ts', 'validate', 'authority-enforcement-registry.yaml')
  '07-sweep' = @('npx.cmd', 'tsx', 'src/cli.ts', 'sweep', 'authority-enforcement-registry.yaml', '--repo-root', '../../../')
  '08-generate' = @('npm.cmd', 'run', 'generate')
  '09-status' = @('git.exe', 'status', '--porcelain=v1')
  '10-scope' = @('git.exe', 'diff', '--name-only', '51857a3a7796b393c0c0a68712f98c06e7015d79...HEAD')
}
if (-not $commands.ContainsKey($Step)) { throw "Unknown step: $Step" }
$metaPath = Join-Path $evidenceRoot "$Step.metadata.json"
if (Test-Path -LiteralPath $metaPath) { throw "Evidence already exists: $metaPath" }
$candidateHead = (& git.exe rev-parse HEAD).Trim()
if ($candidateHead -ne '0ee165720f8d1e3a91eb283cb770400b23f61bf5') { throw "Candidate changed: $candidateHead" }
$command = $commands[$Step]
$executable = $command[0]
[string[]]$commandArgs = $command[1..($command.Length-1)]
$stdoutPath = Join-Path $evidenceRoot "$Step.stdout.log"
$stderrPath = Join-Path $evidenceRoot "$Step.stderr.log"
$started = [DateTime]::UtcNow
$watch = [Diagnostics.Stopwatch]::StartNew()
@{step=$Step;head=$candidateHead;startedUtc=$started.ToString('o');wrapperPid=$PID;command=$command;status='running'} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $evidenceRoot "$Step.running.json") -Encoding utf8
& $executable @commandArgs 1> $stdoutPath 2> $stderrPath
$directExit = $LASTEXITCODE
$watch.Stop()
$ended = [DateTime]::UtcNow
$marker = "FK_P0_COMMAND_COMPLETE command=$Step exit=$directExit head=$candidateHead elapsed_ms=$($watch.ElapsedMilliseconds)"
$marker | Set-Content -LiteralPath (Join-Path $evidenceRoot "$Step.exit.txt") -Encoding utf8
@{step=$Step;head=$candidateHead;startedUtc=$started.ToString('o');endedUtc=$ended.ToString('o');elapsedMs=$watch.ElapsedMilliseconds;directExit=$directExit;command=$command;stdoutSha256=(Get-FileHash -LiteralPath $stdoutPath -Algorithm SHA256).Hash;stderrSha256=(Get-FileHash -LiteralPath $stderrPath -Algorithm SHA256).Hash} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $metaPath -Encoding utf8
Write-Output $marker
Get-Content -LiteralPath $stdoutPath -Tail 16
Get-Content -LiteralPath $stderrPath -Tail 16
exit $directExit
