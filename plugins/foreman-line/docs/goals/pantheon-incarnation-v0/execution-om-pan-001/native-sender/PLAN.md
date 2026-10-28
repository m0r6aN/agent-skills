# P00 native sender preparation plan

Assignment SHA-256: `6e135460709afc6b5f278a9606181e9809409b170a96749156eaba2269a69d37`.
Base HEAD: `64fb8949bf5134f96fda02df0d4f52ac291a6138`.
Branch/workspace: `codex/om-pan-001-p00`, `D:/Repos/Pantheon/work/foreman-om-pan-001-p00`.
Step 0: accepted by the coordinating agent before implementation. This is native bootstrap preparation session 1/8, not Runtime-admitted execution or an independent review.

All writes stay in this `native-sender/` directory. Reference package/activation records remain read-only. No live call, secret lookup, account action, historical replay, commit/push, installation or production change is included.

1. Write failing tests for the data-only live descriptor, exact native loopback POST and refused unsafe inputs. Implement the smallest curl wrapper and durable claim/capture path; run green.
2. Add transport failures, claim races, config/proxy/environment controls, deadline/capture limits and structured output/accounting tests; fix demonstrated defects locally.
3. Run the full isolated suite, record runtime/counts/hashes and write a durable handoff. Preserve the diff for independent review and coordinator closure.

Native binary is `C:/Windows/System32/curl.exe`, observed version 8.21.0, SHA-256 `73d24149ff289afc49ec41f08918ef9faa727d39ad993e929757dc2ddafab805`. It is invoked directly with `shell:false`, first argument `--disable`, fixed stdin fake marker, and a deliberately minimal child environment. The initial Step 0 prose transcribed one extra `d`; a direct recheck confirmed this exact 64-hex value before any curl fixture execution.

The live descriptor has fixed Anthropic HTTPS endpoint and limits but cannot execute. The loopback runner captures curl `--include --output -` into one pre-opened fixed raw evidence file, keeping the total header/body capture within 2 MiB. Structural review fields follow BOOTSTRAP.md; semantic acceptance stays held until a separate source-locator/identity verifier validates the pinned artifact and independence. A held substantive `changes_required` result remains useful rework input, never a pass.

Verification command from the worktree root:

```powershell
node --test plugins/foreman-line/docs/goals/pantheon-incarnation-v0/execution-om-pan-001/native-sender/native-sender.test.mjs
```
