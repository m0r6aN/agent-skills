# Spawn flag verification — 2026-10-11 (Task 12 fail-fast spike)

**Goal:** `foreman-ops-console` (control-center initiative, FCA-P5)
**Method:** live `pi --help` (42 flags enumerated) and `claude --help` capture on
the spawn host, before any argv builder was written.

## Verified flag matrix

| Control | pi | claude |
|---|---|---|
| model | `--model <pattern>` (supports `provider/id` and optional `:<thinking>`) | `--model <model>` (alias or full name) |
| thinking | `--thinking <off\|minimal\|low\|medium\|high\|xhigh\|max>` — exactly the ratified dropdown vocabulary | `--effort <low\|medium\|high\|xhigh\|max>` — **no `off`, no `minimal`** |
| budget | **no spend-cap flag exists** | `--max-budget-usd <amount>` — **help text: "only works with `--print`"** |
| session name | `--name`, `-n <name>` | `-n, --name <name>` |
| prompt | trailing message args after `--` | positional `prompt` argument |

## Consequences (encoded in `src/harness.ts` + the planner refusal matrix)

1. **claude + `off`/`minimal` thinking is unexpressible** → typed refusal
   `unsupported-thinking` at plan time. Fail closed; never silently downgrade a
   thinking level the operator asked for.
2. **Neither harness can enforce a spend cap in an interactive session** —
   `--max-budget-usd` is print-only and pi has none. The budget is therefore
   **prompt-asserted** ("hard max-USD cap - stop and report before exceeding")
   per FCA-P5 §4, and `--max-budget-usd` is never placed on interactive argv
   (it would overstate enforcement).
3. Budget presets are the owner-ruled max-USD set `$1 $5 $10 $20 $50 $100`
   (`Unlimited` withdrawn 2026-10-11).

## Status

Manual verification step of Task 12 recorded here; argv snapshots in
`tests/spawn-plan.test.ts` pin the exact flag sequences for both harnesses.
