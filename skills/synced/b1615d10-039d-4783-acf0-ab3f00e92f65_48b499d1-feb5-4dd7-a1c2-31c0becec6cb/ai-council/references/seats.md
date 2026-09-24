# Seat Invocations — this machine (verified 2026-08-04, Clint's rig "m0r6an", Windows)

Maintained state, not gospel: if a command below fails twice, diagnose, fix, and UPDATE this
file so the next run inherits the fix. All commands assume cwd = the directory containing the
brief file. Launch seats as separate background processes so they run concurrently.

## Grok (xAI) — ~70s/run
```
grok --always-approve -p "<role>. Read <brief>.md in the current directory and complete the task in its 'Your task' section. Judge <lens> hardest. Write your final answer to grok-out.txt in this directory."
```
- `-p/--single` = headless mode. `--always-approve` needed so its file tools run unattended.
- Reliable at writing its own output file.

## Codex (OpenAI) — ~5-8 min/run (slowest seat; launch first)
```
codex exec --skip-git-repo-check "<role>. Read <brief>.md in the current directory and complete the task in its 'Your task' section. Judge <lens> hardest. Write your final answer to codex-out.txt in this directory."
```
- `--skip-git-repo-check` harmless inside a repo, required outside one.
- Reliable at writing its own output file.

## Claude (Anthropic) — ~3-4 min/run
```
claude -p "<role>. Read <brief>.md in the current directory and complete the task in its 'Your task' section. Judge <lens> hardest. Write your final answer to claude-out.txt in this directory." --allowedTools Read,Write < NUL
```
- `< NUL` (cmd) avoids the 3s stdin wait. Add `--model sonnet` if the default model errors.
- Config note: ANTHROPIC_BASE_URL must stay UNSET in ~/.claude/settings.json (a stale
  127.0.0.1:8787 headroom proxy entry once broke headless runs with ConnectionRefused).
  keon-kompress is an MCP server at http://127.0.0.1:5402/mcp (registered user-scope), NOT
  an API proxy — never point base URL at it.

## Gemini (Google) — ~30s/run (fastest seat)
```
gemini -p "<role>. Read the file <brief>.md in the current directory and complete the task in its 'Your task' section. Judge <lens> hardest. Output ONLY the answer in the exact format the brief demands, no preamble." > gemini-out.txt 2> gemini-err.txt
```
- Capture STDOUT — do not ask gemini to write files (its write tool needs approval prompts).
- Auth: GEMINI_API_KEY in C:\Users\clint\.gemini\.env + settings.json
  security.auth.selectedType = "gemini-api-key". The key is a Google Cloud key
  (project 618041384434) restricted to the Generative Language API — it does NOT work
  against Vertex/aiplatform. Free-tier Google OAuth is dead for gemini-cli
  (IneligibleTierError → Antigravity migration); do not switch back to oauth-personal.
- If the key is ever replaced: strip surrounding quotes from the .env value (a pasted
  quoted key produces API_KEY_INVALID).
- Known quirk (observed in council run 2026-08-04): gemini can hang AFTER fully flushing its
  answer to stdout (its MCP servers keep the process alive). Mitigation: add `-e none` to
  disable extensions, and/or kill the process once the output file is complete — the output
  is valid.

## Orchestration notes (Windows)
- Prefer `cmd /c` over PowerShell for these launches; some bridges strip `$` from
  PowerShell commands. For anything complex, write a .py helper and run `python helper.py`.
- Poll seat processes rather than blocking; Codex finishing defines the critical path.
- Seat down after 2 attempts → drop it, note it in the directive, continue with quorum
  (2 seats + orchestrator minimum).
