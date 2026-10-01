---
name: parcel-compiler
description: Develop, inspect, and verify the proof-gated Parcel Compiler scaffold and its frozen command contracts. Use when extending pcc, reviewing its canonicalization or Git utilities, or preparing a parcel that implements one of its currently stubbed commands. Do not use it as an operational compiler yet because the command handlers are not implemented.
---

# Parcel Compiler

Use this skill to work on the `pcc` trust-path CLI without overstating its
current maturity.

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

## Overview

This skill governs work on `pcc`, the proof-gated Parcel Compiler scaffold at
`tool/` (version `0.1.0-scaffold`). Command routing, canonical JSON
serialization, hashing, and Git primitives are implemented and tested;
operational commands (`compile`, `verify`, `receipt verify`) intentionally
return `NOT_IMPLEMENTED`, and the package is not yet a globally executable
binary. The skill keeps contributions inside the frozen command contracts and
keeps the scaffold's maturity described honestly.

## When to Use

Use when extending `pcc`, reviewing its canonicalization or Git utilities, or
preparing a parcel that implements one of the currently stubbed commands. Use
before writing any code under `tool/` so the zero-dependency contract and the
parcel's exact `Allowed Files` bound the work first.

Not for compiling or verifying parcels operationally — those handlers do not
exist yet. Follow the repository's parcel workflow instead of routing real
compilation through `pcc`.

## Common Rationalizations

- **"Just describe `pcc` as a working compiler."** The operational commands are
  stubs; reports, docs, and PR descriptions must say so. Overstating maturity is
  the exact failure this skill exists to prevent.
- **"The change is tiny; skip the parcel's `Allowed Files`.**" Every file edit
  still needs to be named by the parcel. If the list is wrong, amend the parcel,
  not the discipline.
- **"Add one small runtime dependency."** The zero-runtime-dependency contract
  holds unless a ratified parcel explicitly changes it.
- **"Adjust an exit-code meaning to fit the implementation."** Exit codes and
  command contracts are frozen; changing one is a stop condition, not an
  implementation detail.
- **"Write the tests after; the behavior is obvious."** Failing tests come
  before implementation — that ordering is the proof discipline.

## Red Flags

- Any text describing the scaffold as a functioning end-to-end compiler, or
  listing `compile`/`verify`/`receipt verify` as working features.
- Edits to command contracts, receipt hash or signature semantics, or exit-code
  meanings without a ratified amendment.
- A new entry in `tool/package.json` `dependencies` (not `devDependencies`).
- Files changed outside the parcel's exact `Allowed Files` list.
- A stub being quietly implemented without a failing test that lands first, or
  an implementation report that merges implemented commands and stubs together.

## Verification

- From `tool/`: `npm install`, `npm test`, `npm run typecheck`, `npm run lint`,
  and `npm audit --omit=dev` all pass.
- The diff's file set is a subset of the parcel's `Allowed Files`.
- Failing tests were added before the behavior they assert (visible in the
  commit sequence).
- The final report separates implemented commands from commands that still
  return `NOT_IMPLEMENTED`, and names the command contracts that remain frozen.
