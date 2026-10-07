# Seat Dispatches — TEMPLATE

Copy this file to `seats.md` in the same directory and fill in the per-machine
notes that work on YOUR machine. `seats.md` is machine-local state and is git-ignored — it never
ships with the plugin. Treat it as maintained state, not gospel: when a dispatch step fails
twice, diagnose, fix, and update it so the next run inherits the fix.

All commands assume cwd = the directory containing the brief file. Launch seats
concurrently where your environment allows, but remember the SKILL.md rule: the
orchestrator must outlive the seats.

Each seat is a **separate dispatched Pi session**, authorized only by its own
**approved route receipt** minted by the resolver (never asserted, never shared
between seats). Fill every dispatch field below from the receipt; the seat's task
envelope is the shared brief plus its role/lens and its evidence requirement.
Keep the seats family-diverse per D5.

## Launching a seat

Each seat is one `pi` process. The shape is the same for every seat; only the
route, lens, and output file change:

```
pi --model <provider>/<model-id>:<thinking-level> \
   -p "<ROLE>. Read <brief>.md in the current directory and complete the task in \
       its 'Your task' section. Judge <LENS> hardest." \
   > <seat-N>-out.txt
```

- `-p` is non-interactive: the seat processes the prompt and exits, which is what
  makes seats safe to run concurrently.
- `--model` takes `provider/id` with an optional `:<thinking>` suffix, so the
  approved route and its thinking level are expressed in one argument, e.g.
  `pi --model anthropic/claude-opus-5-5:high`.
- Use the route's spelling **exactly** as the receipt records it. The namespaces
  differ and are never interchangeable: `anthropic/claude-opus-5-5` (dashes),
  `openrouter/anthropic/claude-opus-5.5` (dots),
  `fireworks/accounts/fireworks/models/glm-5p3` (`p` for a decimal point).
- `--model` carries identity only. It is not authorization: the approved route
  receipt is, and a seat launched without one is not a Foreman execution path.
- Seats judging non-public material must not be routed to the open-weight
  (`fireworks`) lane — it is `public`-data-only.
- Check credentials before a run with `pi auth check --provider <provider>`;
  `not_ready` means the seat cannot launch, which is a seat-down condition (see
  the 2-attempt rule below), not something to work around.

## Seat 1 — `<ROLE / LENS>`

- Approved route: `<PROVIDER/MODEL-ROUTE>` — from approved route receipt `<PATH-TO-ROUTE-RECEIPT>`
- Declared fallback: `<FALLBACK-ROUTE>` — exactly one, recorded in the same receipt
- Thinking level: `<LEVEL>` · Budget: `<BUDGET>`
- Input: `<brief>.md` in the current directory — "<role>. Read <brief>.md in the current directory and complete the task in its 'Your task' section. Judge <lens> hardest."
- Evidence requirement: write the final answer to `<seat-1>-out.txt` in this directory.
- Launch: `pi --model <PROVIDER/MODEL-ID>:<LEVEL> -p "..." > <seat-N>-out.txt` (see *Launching a seat*)
- Per-machine notes: `<record observed timings, auth quirks, and launch gotchas here after the first run>`

## Seat 2 — `<ROLE / LENS>`

- Approved route: `<PROVIDER/MODEL-ROUTE>` — from approved route receipt `<PATH-TO-ROUTE-RECEIPT>`
- Declared fallback: `<FALLBACK-ROUTE>` — exactly one, recorded in the same receipt
- Thinking level: `<LEVEL>` · Budget: `<BUDGET>`
- Input: `<brief>.md` in the current directory — "<role>. Read <brief>.md in the current directory and complete the task in its 'Your task' section. Judge <lens> hardest."
- Evidence requirement: write the final answer to `<seat-2>-out.txt` in this directory.
- Launch: `pi --model <PROVIDER/MODEL-ID>:<LEVEL> -p "..." > <seat-N>-out.txt` (see *Launching a seat*)
- Per-machine notes: `<record observed timings, auth quirks, and launch gotchas here after the first run>`

`<ADD ONE SECTION PER SEAT — SEATS 3..N — WITH THE SAME DISPATCH FIELDS.>`

## Orchestration notes
- Record per-seat timings, auth quirks, and platform gotchas here as you learn them.
- Seat down after 2 attempts: drop it, note it in the directive, continue with quorum
  (2 seats + orchestrator minimum).
