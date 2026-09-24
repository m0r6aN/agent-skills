$wd = (Get-Location).Path
$grokPrompt = "Correctness and contract auditor. Read brief.md in the current directory and complete the task in its Your task section. Judge exact identity, acceptance criteria, and dependency gating hardest. Write your final answer to grok-out.txt in this directory."
$codexPrompt = "Correctness and contract auditor. Read brief.md in the current directory and complete the task in its Your task section. Judge exact identity, acceptance criteria, and dependency gating hardest. Write your final answer to codex-out.txt in this directory."
$claudePrompt = "Correctness and contract auditor. Read brief.md in the current directory and complete the task in its Your task section. Judge exact identity, acceptance criteria, and dependency gating hardest. Write your final answer to claude-out.txt in this directory."
$geminiPrompt = "Correctness and contract auditor. Read brief.md in the current directory and complete the task in its Your task section. Judge exact identity, acceptance criteria, and dependency gating hardest. Output ONLY the answer in the exact format the brief demands, no preamble."

Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoProfile", "-Command", "Set-Location -LiteralPath '$wd'; & grok.exe --always-approve -p '$grokPrompt' *> '$wd\grok-run.txt'") -WindowStyle Hidden
Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoProfile", "-Command", "Set-Location -LiteralPath '$wd'; & powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\nodejs_symlinks\codex.ps1' exec --skip-git-repo-check '$codexPrompt' *> '$wd\codex-run.txt'") -WindowStyle Hidden
$env:ANTHROPIC_BASE_URL = $null
Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoProfile", "-Command", "Set-Location -LiteralPath '$wd'; & powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\nodejs_symlinks\claude.ps1' -p '$claudePrompt' --allowedTools 'Read,Write' *> '$wd\claude-run.txt'") -WindowStyle Hidden
Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoProfile", "-Command", "Set-Location -LiteralPath '$wd'; & powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\nodejs_symlinks\gemini.ps1' -p '$geminiPrompt' *> '$wd\gemini-run.txt'") -WindowStyle Hidden
Write-Output "launched"
