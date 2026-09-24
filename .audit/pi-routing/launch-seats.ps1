$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$worker = Join-Path $dir 'run-seat.ps1'
$procs = @()
$procs += Start-Process -FilePath 'powershell.exe' -WorkingDirectory $dir -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',$worker,'-Seat','grok') -RedirectStandardOutput (Join-Path $dir 'grok-out.txt') -RedirectStandardError (Join-Path $dir 'grok-err.txt') -PassThru
$procs += Start-Process -FilePath 'powershell.exe' -WorkingDirectory $dir -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',$worker,'-Seat','codex') -RedirectStandardOutput (Join-Path $dir 'codex-out.txt') -RedirectStandardError (Join-Path $dir 'codex-err.txt') -PassThru
$procs += Start-Process -FilePath 'powershell.exe' -WorkingDirectory $dir -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',$worker,'-Seat','claude') -RedirectStandardOutput (Join-Path $dir 'claude-out.txt') -RedirectStandardError (Join-Path $dir 'claude-err.txt') -PassThru
$procs += Start-Process -FilePath 'powershell.exe' -WorkingDirectory $dir -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',$worker,'-Seat','gemini') -RedirectStandardOutput (Join-Path $dir 'gemini-out.txt') -RedirectStandardError (Join-Path $dir 'gemini-err.txt') -PassThru
$procs | Select-Object Id,ProcessName | Out-File -Encoding utf8 (Join-Path $dir 'processes.txt')
