---
name: modernizer
description: |
  A contract-first modernization agent skill.
  Modernizer extracts behavioral contracts from legacy systems,
  orchestrates human-in-the-loop validation, and generates
  target-native implementations that are provably correct
  via reconciliation and receipt packs.
version: "1.2"
metadata:
  author: The Brotherhood
  keywords:
    - modernization
    - legacy rewrite
    - contract-first
    - reconciliation
    - receipts
compatibility:
  required:
    - filesystem_access
    - git
    - persistent_storage
    - execution_tracing
  optional:
    - network_capture_tools
    - schema_contracts
    - runtime_engines
specification: https://agentskills.io/specification
---

## Objective

Modernize a legacy codebase by extracting **behavioral contracts** (inputs + state → outputs + side effects), validating them with human intervention where needed, and rebuilding a clean, target-native implementation that is provably equivalent within defined drift tolerances.

Correctness is demonstrated with:
- Contract conformance tests
- Dual-execution or protocol parity evidence
- Replayable receipts and trace artifacts

---

## Overview

Modernizer treats a legacy codebase's behavior, not its source, as the thing worth preserving. It extracts behavioral contracts from evidence, routes them through a human-in-the-loop validation gate before any implementation begins, rebuilds the system idiomatically in the target stack against approved contracts only, and proves equivalence with reconciliation and a replayable receipt pack — so "we modernized it" is a claim backed by evidence, not a claim taken on faith.

## When to Use

- Rebuilding a legacy system in a new stack where behavioral parity must be provable, not assumed
- The team needs a human validation gate before implementation starts, to catch ambiguity and undocumented behavior early
- Reconciliation evidence (contract tests, parity comparisons, replayable receipts) is required before release
- A migration is large or risky enough that "it compiles and looks right" is not an acceptable bar

---

## Rules (Non-Negotiable)

1. **Contracts are the truth.** You may not implement or guess behavior that is not defined in approved contracts.
2. **No line-for-line translation.** Implementation must be idiomatic in the target stack.
3. **Human validation gate required** before any implementation begins.
4. **Every behavioral claim must link to evidence** via receipts.
5. **Ambiguity triggers escalation.** If behavior is unclear, do not proceed without HITL resolution.
6. **Reconciliation must pass before release.** Drift must remain within tolerance.

---

## Required Outputs

The Modernizer run must produce:

- `contracts/` directory with:
  - `DRAFT_MANIFEST.yaml`  
  - `MANIFEST.yaml` (HITL-approved)
  - individual contract files
- `TOMBSTONES.md` documenting approved divergences
- `ARCHITECTURE.md` describing target design
- `task_store.db` and lease metadata
- `telemetry.log` with evidence links
- Reconciliation outputs:
  - `coverage_summary.md`
  - `sampling_summary.md`
  - `delta_report.md`
  - `recon/` diffs
- Receipt pack:
  - `receipts/manifest.json`
  - `receipts/trace_index.json`
  - `receipts/replay.sh` / `receipts/replay.ps1`
  - `receipts/hashes.sha256`

---

## Execution Phases

### Phase I — Discovery
- Inventory source system (API, code, traces, tests, logs)
- Extract behavioral contracts based on prioritized sources

### Phase II — Validation Gate (HITL)
- Present draft manifest
- Resolve ambiguities
- Record tombstones
- Approve final manifest

### Phase III — Architecture
- Create target-native design
- Populate task graph and persistence store

### Phase IV — Implementation
- Implement only from approved contracts
- Add tests per contract
- Track confidence and emit receipts

### Phase V — Reconciliation
- Execute stratified sampling
- Compare legacy vs new outputs using drift rules
- Generate reports and diffs

---

## Failure Conditions

Stop and escalate if:
- Contract coverage is insufficient
- Strict fields drift outside tolerance
- Ambiguities remain unresolved
- Confidence below threshold
- Reconciliation fails

---

## Contract Format

Contracts must describe:

- Inputs and preconditions
- Execution trigger
- Expected outputs
- Side effects with structured assertions
- Error handling cases
- Determinism strategy

Contracts must be stored in versioned YAML and reference schemas where available.

---

## Drift Scoring

Drift is measured using weighted scoring:

- Strict fields (status codes, signed outputs)
- Ignored fields (timestamps, IDs)
- Epsilon rules for floats
- Ordering semantics (set vs list)

---

## Receipts

Receipts are replayable proof artifacts with:

- Manifest linkage
- Trace indexes
- Contract versions
- Checksums
- Replay scripts

Receipts must make it possible to rebuild and reverify acceptance criteria without external context.

---

## Non-Goals

This skill does NOT:

- Reimagine domain semantics beyond approved tombstones
- Attempt speculative refactors
- Enforce architectural preferences outside contracts
- Assume behavior not validated by evidence

---

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I understand the old system well enough, I'll start building now." | Human validation gate is required before any implementation begins — understanding is not the same as an approved manifest. |
| "The new system's output looks right on the cases I tried." | Correctness is demonstrated with contract conformance tests and parity evidence, not spot-checked plausibility. |
| "This behavior wasn't in the contract, but it's obviously needed — I'll add it." | Contracts are the truth. Undocumented behavior discovered mid-implementation triggers escalation and a contract update, not silent addition. |
| "The drift is small, it's probably fine to ship." | Reconciliation must pass before release; drift must remain within defined tolerance, not "probably fine." |
| "I'll port this function line-for-line to save time." | No line-for-line translation — implementation must be idiomatic in the target stack even when it takes longer. |

## Red Flags

- Implementation started before the manifest passed the HITL validation gate
- A behavioral claim with no receipt or trace evidence backing it
- Ambiguous legacy behavior resolved by guessing instead of escalating for human resolution
- Reconciliation skipped or reported without the underlying diff artifacts
- A tombstoned divergence that isn't recorded in `TOMBSTONES.md`

## Verification

- [ ] `MANIFEST.yaml` is HITL-approved before any implementation task started
- [ ] Every contract includes inputs, triggers, outputs, side effects, and error handling
- [ ] Contract tests exist and pass for implemented behavior
- [ ] Reconciliation reports (`coverage_summary.md`, `sampling_summary.md`, `delta_report.md`) exist and drift is within tolerance
- [ ] Receipt pack is present and replay scripts run successfully

## Final Instruction

Optimize for **defensibility, replayability, and evidence**. A modernization that “seems right” but is not provable with receipts and reconciliation is a failure.

---