# Plan Review Brief — `pi-routing-adapter-compat` goal charter

## Context

Foreman Line is a contract-first, parcel-driven coordination method for multi-session,
multi-project development. The coordinator owns contracts, sequencing, allowed-file scope,
persistent state, integration surfaces, verification evidence, and release gates.

On 2026-09-23 a 3-seat model council reviewed a proposal to add **frontmatter-driven model
routing to the Pi coding agent** via a middleware extension (`~/.pi/agent/extensions/
cost-router.ts`, a `beforeLLMTurn` hook, `ctx.session.updateModel(...)` /
`ctx.session.updateThinkingLevel(...)`). The council verdict: adopt only a constrained,
coordinator-owned routing adapter; do not install the middleware; ship a versioned routing
contract + durable evidence first; run a compatibility spike against the installed Pi.

The repository already contains, on disk: `plugins/foreman-line/routing-policy/` (schema +
validator + `routing-policy.yaml` v0.3 — the routing contract), a
`foreman-line-boundary-routing` charter (D1–D10, the "live routing authority"), an active
`routing-currency-and-merit` goal (D1–D14, carrying a point-by-point assessment that already
refutes this same middleware), `governed-model-fleet` (receipt/envelope/settlement), and a
frozen `model-fleet-v1`.

A new goal `pi-routing-adapter-compat` was created to own ONLY the residual the canon does
not cover: an **evidence-backed compatibility memo** recording the installed Pi runtime's
actual extension/hook API surface against the rejected proposal. Its charter is the subject
of this review.

## Inventory (verbatim structure of the charter)

- **Objective:** produce an evidence-backed compatibility memo; record per-Pi-version which
  proposed APIs exist, which do not, and what the runtime actually exposes; one paragraph of
  governance consequence by pointer; explicitly NOT a routing design, adapter, contract,
  resolver, or ledger.
- **Relationship section:** subordinate to boundary-routing D1–D10, routing-policy, RCM
  D1–D14, governed-model-fleet, model-fleet-v1 (frozen). "Non-duplication is a locked property."
- **Evidence baseline:** 5 observations, marked "design input, re-verified by the parcel,"
  with a provenance caveat.
- **Locked decisions D1–D8:** D1 memo-not-design; D2 governance-by-pointer-never-restated;
  D3 pinned to Pi 0.86.1; D4 every assertion doc-cited OR deterministic-check-backed (neither =
  refusal); D5 one governance paragraph naming the D7/D8 lane and stating no adapter is
  authorized; D6 writes confined to the goal directory; D7 any probe is Node stdlib-only,
  read-only, fail-closed, PowerShell with `node -v` first; D8 single parcel, `implementation/
  standard`, single review.
- **Decomposition:** one parcel **PRAC-P0** — produce `compat-memo.md` + evidence, with a
  deterministic read-only probe per OQ1.
- **Exit criterion (6 items):** memo merged under the goal dir; every assertion cited-or-probed
  and reproducible in PowerShell/`node -v`; the three proposal APIs flagged absent with real
  equivalents named; zero routing-design content; a negative-control grep passes; no writes
  outside the goal dir.
- **Standing authorizations requested:** Gate 2 for PRAC-P0 only; contingent Gate 3 "merge it"
  (repo-local, green-chain-contingent).
- **Stop conditions / out of scope:** amend nothing frozen; build no adapter; write no host
  file; no `~/.pi/agent/extensions/` modification.
- **Open questions OQ1–OQ3:** memo+probe (recommended); probe lives in goal dir; memo filename
  `compat-memo.md`.

## Verified observations

- Installed package `D:\nvm\v24.7.0\node_modules\@earendil-works\pi-coding-agent` is version
  **0.86.1**.
- `~/.pi/agent/extensions/` exists and contains one extension, `pi-jev-budget-guard`.
- `docs/extensions.md` exposes `pi.setModel(model)` and `pi.setThinkingLevel()`.
- No `beforeLLMTurn`, `ctx.session.updateModel`, or `ctx.session.updateThinkingLevel` name was
  found in `docs/extensions.md`; the hook surface is provider-level and session-scoped.
- An `examples/extensions/` catalog exists (preset.ts, provider-payload.ts, tool-override.ts,
  subagent/, etc.).

## Your task

Red-team this charter as a plan review. Answer, with findings keyed to severity:

1. Is the decomposition coherent? (single-package, single-parcel — too thin, or exactly right?)
2. Are the parcel boundaries real or wishful?
3. Which parcel — or which required piece of work — is missing?
4. Which locked decision is load-bearing but unexamined?
5. Where will two parcels (or files) silently collide?

## Output contract

Deliver EXACTLY: "TOP 5 BRUTAL FINDINGS" (numbered, one line each) then "TOP 5 MOVES"
(numbered, one line each, implementation-ready). Max 350 words total. Plain text only.
