---
name: parcel-compiler
description: Develop, inspect, and verify the proof-gated Parcel Compiler scaffold and its frozen command contracts. Use when extending pcc, reviewing its canonicalization or Git utilities, or preparing a parcel that implements one of its currently stubbed commands. Do not use it as an operational compiler yet because the command handlers are not implemented.
---

# Parcel Compiler

Use this skill to work on the `pcc` trust-path CLI without overstating its
current maturity.

## Overview

`pcc` is a proof-gated CLI scaffold for compiling and verifying parcels — deterministic canonicalization, hashing, and Git primitives are implemented and tested, but the operational commands (`compile`, `verify`, `receipt verify`) are intentionally stubbed. This skill governs how to extend that scaffold safely: implement only what a ratified parcel spec's `Allowed Files` names, add failing tests before behavior, keep the zero-runtime-dependency contract, and never describe the scaffold as a working compiler until a command handler is actually implemented and proven.

## When to Use

- Extending `pcc` — implementing one of its currently stubbed commands (`compile`, `verify`, `receipt verify`)
- Reviewing or modifying `pcc`'s canonical JSON, hashing, or Git utilities
- Preparing a parcel spec that targets one of the frozen command contracts
- Auditing whether a claim about `pcc`'s capabilities overstates its current `0.1.0-scaffold` maturity

Do NOT use this skill to run `pcc` as an operational compiler — the command handlers that would make that true are not implemented yet.

## Current boundary

The package at `tool/` is a tested `0.1.0-scaffold`. Its command routing,
canonical JSON, hashing, and Git primitives are implemented. Operational
commands such as `compile`, `verify`, and `receipt verify` intentionally return
`NOT_IMPLEMENTED`, and the package is not yet a globally executable binary.

## Workflow

1. Read `tool/README.md` and the relevant spec under `docs/specs/`.
2. Preserve the zero-runtime-dependency contract unless a ratified parcel
   explicitly changes it.
3. Implement only the command and files named by the parcel's exact
   `Allowed Files`.
4. Add failing tests before implementing behavior.
5. Run the deterministic checks from `tool/`:

   ```powershell
   npm install
   npm test
   npm run typecheck
   npm run lint
   npm audit --omit=dev
   ```

6. Report implemented commands separately from remaining stubs. Never describe
   the scaffold as a functioning end-to-end compiler.

## Stop conditions

- A command contract or exit-code meaning must change.
- Receipt hash or signature semantics are not already ratified.
- Implementation requires a runtime dependency.
- A required file is absent from the parcel's `Allowed Files`.

Stop and request a contract amendment instead of making any of those decisions
silently.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll implement `compile` fully while I'm in here, since it's related." | Implement only the command and files named by the parcel's exact `Allowed Files`. Scope creep past the ratified parcel is exactly what the contract discipline exists to prevent. |
| "The tests pass, I don't need to describe what's still stubbed." | Report implemented commands separately from remaining stubs — a passing test suite for a partial scaffold is not evidence of a working compiler. |
| "This dependency is tiny, adding it won't really break the zero-dependency contract." | The zero-runtime-dependency contract is non-negotiable unless a ratified parcel explicitly changes it — "tiny" doesn't get a pass. |
| "I'm confident about the exit-code meaning, I'll just adjust it to be clearer." | Exit-code meanings and command contracts are frozen. Changing one silently is a stop condition — request a contract amendment instead. |

## Red Flags

- Code written for a command or file outside the parcel's `Allowed Files`
- A claim (in docs, commits, or chat) that `pcc` is a working end-to-end compiler
- A new runtime dependency added without a ratified parcel authorizing it
- Behavior implemented before a failing test exists for it
- A receipt hash or signature semantic changed without a contract amendment

## Verification

- [ ] Only files listed in the parcel's `Allowed Files` were touched
- [ ] Failing tests existed before the corresponding implementation was written
- [ ] `npm test`, `npm run typecheck`, `npm run lint`, and `npm audit --omit=dev` all pass from `tool/`
- [ ] No new runtime dependency was introduced without an explicit contract change
- [ ] The report distinguishes implemented commands from remaining `NOT_IMPLEMENTED` stubs
