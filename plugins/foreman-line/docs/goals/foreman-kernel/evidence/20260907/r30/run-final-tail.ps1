$ErrorActionPreference='Stop'
$e=Join-Path $PSScriptRoot '.'
$steps=@(
 @{number=40;name='final-biome';exe='npx';argv=@('biome','check','.')},
 @{number=41;name='final-validate';exe='npx';argv=@('tsx','src/cli.ts','validate','authority-enforcement-registry.yaml')},
 @{number=42;name='final-sweep';exe='npx';argv=@('tsx','src/cli.ts','sweep','authority-enforcement-registry.yaml','--repo-root','../../..')},
 @{number=43;name='final-generate-one';exe='npm';argv=@('run','generate')},
 @{number=44;name='final-generate-two';exe='npm';argv=@('run','generate')},
 @{number=45;name='final-evidence-collector';exe='node';argv=@((Join-Path $e 'collect-final-evidence.mjs'))}
)
foreach($step in $steps){
 $base=('{0}-{1}' -f $step.number,$step.name)
 $log=Join-Path $e ($base+'.log')
 $start=[DateTime]::UtcNow
 $watch=[System.Diagnostics.Stopwatch]::StartNew()
 $argv=$step.argv
 & $step.exe @argv *> $log
 $ec=$LASTEXITCODE
 $watch.Stop()
 $end=[DateTime]::UtcNow
 Add-Content -LiteralPath $log "DIRECT_EXIT=$ec"
 [pscustomobject]@{command=$step.exe;arguments=$argv;cwd=(Get-Location).Path;startUtc=$start.ToString('o');endUtc=$end.ToString('o');elapsedSeconds=$watch.Elapsed.TotalSeconds;directExit=$ec;timingBasis='explicit UTC timestamps immediately before invocation and after process return; stopwatch monotonic elapsed'} | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $e ($base+'.metadata.json'))
 Write-Output "$base DIRECT_EXIT=$ec elapsed=$($watch.Elapsed.TotalSeconds)"
 if($ec -ne 0){Get-Content -LiteralPath $log -Tail 30;exit $ec}
 if($step.number -in @(43,44)){
  $expected=Get-Content (Join-Path $e 'checkpoint-artifact-hashes.json') -Raw | ConvertFrom-Json
  $actual=foreach($f in $expected){$hash=(Get-FileHash -LiteralPath $f.Path -Algorithm SHA256).Hash; [pscustomobject]@{path=$f.Path;before=$f.Hash;after=$hash;identical=($f.Hash -eq $hash)}}
  $actual | ConvertTo-Json | Set-Content (Join-Path $e ($base+'.hashes.json'))
  if(@($actual | Where-Object {-not $_.identical}).Count){throw 'Generated artifacts or lockfile differ from code checkpoint'}
 }
}
