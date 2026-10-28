# Kimi K3.1 Pro council seat — qualified 2026-10-23

Select **Kimi K3.1 Pro (Moonshot)** as an additional independent advisory seat for
difficult public code/contract questions. Its default lens is contract invariants,
boundary cases, failure recovery, and concrete counterexamples. Use the same neutral
brief as the other seats, without their answers or the orchestrator's verdict.
Count Moonshot as one family; Kimi cannot independently validate its own work.

Exact binding: **`opencode-go/kimi-k3.1-pro`, HIGH reasoning**. This seat uses the
qualified Foreman L3 pilot launcher described below, which issues its own fresh
receipt and launch verdict. This is a specific exception to the generic Pi-session,
read-tool, and two-attempt council instructions. Do not substitute a direct Pi or
vendor CLI call. Its advice is supplementary: it does not fill required L1/L2,
frontier-reviewer, security-approval, or minimum critique-quorum slots.

## Dispatch

Embed the complete public brief and relevant public evidence in the task prompt;
the model cannot read local files or execute tools. Do not mark private material
public to make it eligible. Use a unique task ID and output directory per seat/run.

Create `kimi-task.json` with this shape (replace the prompt with the actual brief):

```json
{
  "id": "council-topic-kimi-001",
  "classification": "public",
  "prompt": "You are an independent contract reasoning adviser. Judge invariants, boundary cases, failure recovery, and concrete counterexamples hardest. Complete the task and output contract in the following shared brief.\n\n<complete public brief and evidence>",
  "maxOutputTokens": 2048,
  "budgetUsd": 0.05
}
```

```powershell
& 'D:/Repos/Pantheon/.coordinator/kimi-k31/Invoke-KimiFrontier.ps1' `
  -TaskFile 'D:/path/to/council/kimi-task.json' `
  -OutputDirectory 'D:/path/to/council/kimi-evidence' `
  -DryRun
```

Dry-run checks admission without credentials or inference. For an authorized council
run, remove `-DryRun`; the directory permits one dry-run and one live request.
After successful execution, export the answer for synthesis:

```powershell
$kimiResult = Get-Content -LiteralPath 'D:/path/to/council/kimi-evidence/result.json' -Raw | ConvertFrom-Json
if ($kimiResult.status -ne 'succeeded' -or $kimiResult.binding -ne 'opencode-go/kimi-k3.1-pro' -or [string]::IsNullOrWhiteSpace($kimiResult.content)) {
    throw 'Kimi seat did not return an eligible answer; retain evidence and record it unavailable.'
}
$kimiResult.content | Set-Content -LiteralPath 'D:/path/to/council/kimi-out.txt' -Encoding utf8
```

Check the shared output contract and independently validate findings before synthesis.
Retain the task, answer, receipt, launch verdict, attempt record, and result together.
Record the actual model, HIGH reasoning, usage, elapsed time, and estimated cost.

## Bounds and evidence

- Public text/code only, no executable tools; 16,384 serialized request bytes,
  256–4,096 output tokens, 180-second deadline, 262,144 response bytes.
- One request; **no retry, redirect, or automatic fallback**, including the council's
  generic second attempt. Preserve unknown outcomes and their reservations.
- Per-task budget at most $0.10, checked conservatively before send; this is a
  list-price estimate, not a provider-enforced billing cap.
- Qualification expires **2026-10-30 19:05:03.528 UTC** (3:05 p.m. Eastern).
  Expiry or evidence drift refuses launch. Refresh qualification before further use.
- Live qualification validated a contract repair against 540 cases, synthetic
  tool-message replay, and an admitted failure-recovery reasoning task. This is
  bounded task evidence, not a broad benchmark or executable-tool qualification.

See the [qualified launcher runbook](D:/Repos/agent-skills-worktrees/kimi-k31-qualification/plugins/foreman-line/docs/goals/kimi-k31-qualification/RUNBOOK.md)
and [admission evidence](D:/Repos/agent-skills-worktrees/kimi-k31-qualification/plugins/foreman-line/docs/goals/kimi-k31-qualification/ADMISSION.md).
The isolated checkout is the active installation and must remain available.

## Real council observation — 2026-10-23

The [Pantheon non-send evidence council](D:/Repos/Pantheon/.audit/kimi-council-remote-outcomes-20261023/DIRECTIVE.md) tested this seat on an actual integration design dependency, using a public abstract brief and local private-source validation. A broad whole-protocol task exhausted 4,096 completion tokens with no final answer. A separately scoped one-issue counterexample task completed at HIGH in 72.188s, using 3,925 completion tokens and approximately $0.040438 list-price usage. Its 266-word answer exceeded a 250-word contract. Three focused families converged; deterministic checks supported the hazard, but it was already prompted/documented, and no unique source defect was proven. The proposed gate still needs concrete integration proof and a terminology correction (cancel the already-consumed claim; do not consume twice).

Retain this seat for supervised compact counterexample tasks, with explicit format and independent source checks. This run does not establish broad architecture suitability within the current cap, extend qualification expiry, or admit a mandatory reviewer lane. Preserve failed attempts when assessing usefulness; do not infer success from provider completion alone.

## Expanded allowance and broad rerun — 2026-10-23

An explicit expanded profile is now qualified: set `maxOutputTokens` to at most
`16384`, `budgetUsd` to at most `0.25`, and add `-Expanded` to the wrapper
(`--expanded` to the CLI). HIGH remains unchanged; the deadline becomes 600
seconds. Completion includes reasoning as reported. All public-input, byte,
one-shot, receipt, no-fallback and original-expiry controls still apply. Without
the switch, the standard 4,096-token profile above remains in force.

The exact original broad Pantheon prompt subsequently completed: normal stop,
696 words within 800, all five headings, 69.044 seconds, 1,338 prompt and 3,465
completion tokens, approximately $0.037326 list-price usage. This is a successful
broad advisory sample under the expanded profile. Because actual completion was
below the old cap, it does not establish that increasing the cap caused success.
The earlier truncated run remains part of the record.

Use the expanded seat for supervised bounded public architecture proposals with
independent validation. Its broad answer reinforces known no-replay, stop-race,
unknown-liability and late-evidence obligations; do not credit these as newly
discovered source defects. See the [expanded council directive](D:/Repos/Pantheon/.audit/kimi-expanded-budget-20261023/DIRECTIVE.md)
for claim validation, corrections and the limited usefulness assessment. This
does not qualify general autonomous frontier execution or a required reviewer.
