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

## Seat 1 — `<ROLE / LENS>`

- Approved route: `<PROVIDER/MODEL-ROUTE>` — from approved route receipt `<PATH-TO-ROUTE-RECEIPT>`
- Declared fallback: `<FALLBACK-ROUTE>` — exactly one, recorded in the same receipt
- Thinking level: `<LEVEL>` · Budget: `<BUDGET>`
- Input: `<brief>.md` in the current directory — "<role>. Read <brief>.md in the current directory and complete the task in its 'Your task' section. Judge <lens> hardest."
- Evidence requirement: write the final answer to `<seat-1>-out.txt` in this directory.
- Per-machine notes: `<record observed timings, auth quirks, and launch gotchas here after the first run>`

## Seat 2 — `<ROLE / LENS>`

- Approved route: `<PROVIDER/MODEL-ROUTE>` — from approved route receipt `<PATH-TO-ROUTE-RECEIPT>`
- Declared fallback: `<FALLBACK-ROUTE>` — exactly one, recorded in the same receipt
- Thinking level: `<LEVEL>` · Budget: `<BUDGET>`
- Input: `<brief>.md` in the current directory — "<role>. Read <brief>.md in the current directory and complete the task in its 'Your task' section. Judge <lens> hardest."
- Evidence requirement: write the final answer to `<seat-2>-out.txt` in this directory.
- Per-machine notes: `<record observed timings, auth quirks, and launch gotchas here after the first run>`

`<ADD ONE SECTION PER SEAT — SEATS 3..N — WITH THE SAME DISPATCH FIELDS.>`

## Orchestration notes
- Record per-seat timings, auth quirks, and platform gotchas here as you learn them.
- Seat down after 2 attempts: drop it, note it in the directive, continue with quorum
  (2 seats + orchestrator minimum).
