---
ticket: FCA-P4
title: Action registry — verbs, invocation classes, autonomy envelopes, audit
status: active
owner: clinton.morgan
created: 2026-10-11
updated: 2026-10-11
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/ops-console/src/invoke.ts
  - plugins/foreman-line/ops-console/src/remedy.ts
  - plugins/foreman-line/ops-console/src/api.ts
  - plugins/foreman-line/ops-console/src/guards.ts
routing_class: architecture/risk
verification_class: equivalence-provable
permission_profile: builder-standard
data_classification: internal
---

# FCA-P4 — Action registry

## 1. Purpose

Signals (FCA-P3) say what needs attention; remedies (FCA-3) say what to do.
Nothing is *doable*. This spec defines the registry that maps
`(signal class × verb)` to an invocation class, a prompt template, an autonomy
envelope, and an audit record — the contract `spawn` (FCA-P5) executes and
`console-ui` (FCA-P6) renders. Owner (2026-10-11): actionable items get
buttons — "Investigate", "Remediate", "Explain", "Close/Delete", etc.

## 2. Owner directive (2026-10-11)

Buttons for appropriate actions that spawn new agent sessions; close/delete
covers "All of it" (notifications, PRs, branches, stale worktrees, goal
records) with local repo hygiene as an objective; `lumber-jack` where
appropriate; per-action autonomy options for decisions and repo actions.

## 3. Additive surface (the ONLY changes)

- `actions.ts` (new): `ActionSpec` — `{ verb, signalClasses[], invocation:
  'spawn' | 'present' | 'execute', promptTemplate, autonomy: {
  decisions: 'full'|'partial', commit, push, openPr, merge }, destructive:
  boolean }`. Registry is closed: unregistered (class, verb) pairs are refused
  typed.
- Baseline verbs: `investigate`, `remediate`, `explain`, `close-delete`
  (extensible by spec change only).
- `invoke.ts`: `spawn` becomes a legal `InvokeAction` outcome; the frozen
  `execute` set is unchanged; `present` semantics unchanged. Every registry
  dispatch appends an audit entry (existing audit file, same shape + autonomy
  envelope + spawn id when applicable).
- `guards.ts`: destructive-verb guard — `close-delete` requires confirmation
  (explicit typed intent from UI or spawned session), never silent execution.

## 4. Contracts

- **Invocation classes.** `execute` stays frozen to non-interactive,
  non-minting flows. Destructive verbs are `spawn` or `present` only. The
  registry never runs a mutating command in the console process.
- **Autonomy envelope** is data carried to the spawned session, not a promise
  the console enforces mid-run: the composed prompt states the envelope, and
  repo-level rules remain the final authority (Stage F fail-closed merge).
- **Prompt templates** are kickstarter-style: signal evidence, restated task,
  boundaries (no self-graded verification), and the autonomy envelope. Plain
  text, testable by string composition — no templating dependency.
- **Audit is append-only** and includes refused actions (refusal + reason).

## 5. Acceptance criteria

1. Every baseline verb has specs for its allowed signal classes; disallowed
   pairs return typed refusals and audit entries.
2. `close-delete` on every owner-named artifact class (notification, PR,
   branch, worktree, goal record) composes a distinct prompt with the right
   evidence and destructive guard.
3. Autonomy envelopes round-trip into composed prompts verbatim.
4. `execute` cannot be registered for any mutating verb (type-level +
   runtime guard).
5. Audit entries cover executed/presented/spawned/refused outcomes.

## 6. Verification

Deterministic tests in `ops-console/tests/`: registry matrix, refusal + audit
matrices, prompt composition snapshots, destructive-guard behavior. Full
package sweep green.
