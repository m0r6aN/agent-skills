# Scoped Gate 1 Amendment 02 — Model Identity

**Goal slug:** `pi-model-configuration`
**Raised:** 2026-09-23 by coordinator lint (`coordinator-lint-pmc-p0.md`, L1–L4)
**Status:** **RATIFIED IN FULL by the owner on 2026-09-23; M1 superseded by Amendment 03 on 2026-09-24**
**Scope:** historical model identity decision — the Gate 1 record's Opus claim, matrix rows 1–2
and 6, D6, the A7/Q5 clause, and exit criterion 2 ownership.
**Not re-opened:** D2, and A1–A8 other than the A7 Opus clause.

The in-force text is mirrored into `charter.md` § *Amendment 02*, which governs
on conflict.

For M1, the in-force text is now superseded by `gate-1-amendment-03.md` and
`charter.md` § *Amendment 03*. M2–M4 remain in force unchanged.

## Ratified items

| # | Finding | Ratified decision |
|---|---|---|
| **M1** | L1 — `claude-opus-5.5` / `claude-opus-5-5` absent from the catalogue | Correct the Opus identity to **`claude-opus-5`** (OpenCode) and **`anthropic/claude-opus-5`** (OpenRouter) in the Gate 1 record and matrix rows 1–2. The A7/Q5 instruction to change `KNOWN_FRONTIER_MODELS` is **withdrawn**: `anthropic/claude-opus-5` is already in the registry, so PMC-P1 makes no frontier-registry change for Opus. |
| **M2** | L2 — `typesafe/jev-1.13` enabled but uncatalogued | The typed routing/classification lane is ruled **refused / disabled-lane**, matching the existing RCM disposition. No substitute classifier is installed, and no authority-bearing agent may be promoted into the lane. Matrix row 6's OpenRouter primary is struck; the lane's OpenCode entries remain recommendation-only. |
| **M3** | L4 — D6 default mismatch | Correct D6's stated interactive default to the observed **`opencode` / `qwen/qwen-2.5-coder-32b` / `minimal`**. This is a **documentation correction only**; changing the host default is not authorized by this charter. |
| **M4** | L3 — zero of twelve matrix models enabled | Enabling the matrix model set is **assigned to PMC-P2** as explicit configuration work under its own Gate 2. It is removed from the implicit reading of exit criterion 2 and becomes a named, owned deliverable. |

## Consequences carried forward

1. **PMC-P1 loses its only frontier-registry change.** Its scope narrows to
   schemas, the policy contract, migration inventory, compatibility versioning,
   and fixtures. If PMC-P0 later establishes that a different frontier candidate
   is required, that is a fresh amendment, not a P1 discretionary edit.
2. **PMC-P2 gains configuration scope** (M4) on top of resolver, Pi
   configuration, launch boundary, break-glass path, and route artifacts.
3. **Matrix row 6 is now single-provider.** The resolver must tolerate a lane
   whose provider set is not symmetric across OpenCode and OpenRouter — A3's
   per-lane tie-break must not assume two eligible providers exist.
4. **Evidence standing is unchanged.** M1–M4 rest on an unratified host-owner
   export. They correct falsified claims; they do not establish live
   availability. Every corrected identity still requires
   `live-availability` under A6 before activation.

## Authority

This amendment authorizes **PMC-P0 shaping only**. It grants no Gate 2 dispatch,
provider spend, credential inspection, host or settings change, merge, release,
or default-route activation.
