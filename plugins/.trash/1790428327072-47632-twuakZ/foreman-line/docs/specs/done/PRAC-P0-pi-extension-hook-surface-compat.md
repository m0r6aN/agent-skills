---
ticket: PRAC-P0
title: Pi extension/hook API surface compatibility memo
status: done
owner: clinton.morgan
created: 2026-09-24
updated: 2026-09-24
risk: standard
surfaces:
  - plugins/foreman-line/docs/goals/pi-routing-adapter-compat/
routing_class: implementation/standard
verification_class: judgment-required
permission_profile: builder-standard
data_classification: public
---

## Intent

Produce an evidence-backed compatibility memo, `compat-memo.md`, that settles — with facts,
not assertion — what the installed Pi runtime (pin **0.87.1**) actually exposes on its
extension/hook surface, against the *rejected* frontmatter-driven model-routing middleware
proposal (a `~/.pi/agent/extensions/cost-router.ts` using a `beforeLLMTurn` hook and
`ctx.session.updateModel(...)` / `ctx.session.updateThinkingLevel(...)`). The memo is a
pointer-only input that `pi-model-configuration` (PMC-P2/P3) may later consume; it grants no
authority and proposes no routing design. This parcel writes documents and a read-only probe
inside the goal directory only.

## Constraints

Authority is the ratified charter (`pi-routing-adapter-compat/charter.md`) D1–D11 and the
exit criterion; the 0.87.1 pin and the plan-review amendments (D4/D5/D6/D7/D9/D10) govern.
This parcel introduces no schema field, no dependency, no host mutation, and no routing
logic. It must not overlap `pi-model-configuration` (model/config/catalogue/resolver/canon),
`routing-currency-and-merit`, `foreman-line-boundary-routing`, or `routing-policy/`.

- **D7 probe discipline.** The probe is Node stdlib-only and read-only. It must **not** load
  Pi or register an extension (that would write the host extension dir — forbidden). It
  resolves the installed package, asserts `package.json` version == 0.87.1, records the
  absolute package root, enumerates exactly which shipped files it searched
  (`docs/index.md`, `docs/extensions.md`, the `examples/extensions/` catalog, and shipped
  `.d.ts` declarations), captures SHA-256 hashes of each inspected file, greps the exported
  and proposal API names, and writes result + exit status into the evidence snapshot. It
  reports "absent from the enumerated shipped 0.87.1 surface", never "absent at runtime",
  and **fails closed (non-zero) on any missing required surface** — the files
  `docs/index.md`, `docs/extensions.md`, `dist/core/extensions/types.d.ts` and the
  directories `examples/extensions/` and `dist/` — or on a version mismatch. A missing or
  empty surface is a refusal, never a pass.
- **D4 absence bound.** An "absent" disposition is *not found in the enumerated, hashed
  surface* — never "does not exist at runtime."
- **D10 snapshot-then-restate.** Before any restatement, copy the directive's API claims
  into the goal directory as `evidence/pi-0.87.1/directive-excerpt.md` with its SHA-256.
  Source: `C:/Users/clint/Documents/Codex/2026-09-23/pl/.audit/directive.md` (proposal API
  claims only; no credentials, no other inventors).
- **D6 writes.** Only the files listed under `## Allowed Files`, nothing else. Never
  `~/.pi/agent/extensions/`, `pi-jev-budget-guard`, `routing-policy/`, or plugin source.
- No secrets, PII, or provider calls. No live provider availability claims.

## Acceptance Criteria

- [ ] **AC1 — Provenance.** Every factual claim in the memo cites a concrete source path +
  field/section, or the recorded probe output; each "absent" claim is bounded to the
  enumerated 0.87.1 surface. No claim is asserted without citation or probe record.
- [ ] **AC2 — Snapshot.** `evidence/pi-0.87.1/` contains `snapshot.json` (version, resolved
  package root, enumerated inspected-file list + SHA-256 hashes, probe command + exit status)
  and `probe-output.txt` (raw capture); the probe exits 0 only when `package.json` is
  exactly 0.87.1 AND every required surface exists (`docs/index.md`, `docs/extensions.md`,
  `examples/extensions/`, `dist/`, `dist/core/extensions/types.d.ts`). A missing surface or
  a version mismatch exits non-zero, proven by `check-api-surface.negative-test.mjs`.
- [ ] **AC3 — Dispositions, not pre-decided answers.** Each proposal API
  (`beforeLLMTurn`, `ctx.session.updateModel`, `ctx.session.updateThinkingLevel`) carries a
  verified disposition — present / absent-from-enumerated-surface / unverifiable — derived
  from the probe. The actual 0.87.1 surface relevant to those claims is the **shipped type
  declarations**, not the docs prose: `setActiveTools(toolNames: string[]): void`,
  `setModel(model: Model<any>): Promise<boolean>`, `setThinkingLevel(level: ThinkingLevel): void`
  in `dist/core/extensions/types.d.ts`, plus `TurnStartEvent`/`TurnEndEvent` and
  `BeforeProviderRequestEvent`. The memo records both halves of the distinction — *absent
  from docs prose in 0.87.1* and *present in shipped types* — and flags each present method
  *present and still not an authorization to route*.
- [ ] **AC4 — Zero routing-design content.** The memo proposes no contract field, precedence,
  fallback, budget ledger, model identity, resolver, or adapter; its governance text is the
  verbatim pointer-only template naming boundary-routing D7/D8, RCM D1–D14, routing-policy,
  and PMC, plus "no adapter is authorized by this goal." (D5, D11.)
- [ ] **AC5 — Negative control.** A check (grep/doc-lint) confirms the memo matches its
  recorded dispositions (never asserts an absent API as present), carries no routing-design
  verbs/config keys beyond the pointer template, and records the source path + hash of the
  directive excerpt (D10).
- [ ] **AC6 — Reproducibility.** The probe reproduces on the coordinator's machine in
  PowerShell with `node -v` first, and the memo pins Pi 0.87.1 (asserted, not assumed).
- [ ] **AC7 — Scope.** The merge diff is exactly the `## Allowed Files` set (plus this spec's
  own `docs/specs/` lifecycle), verified against the pre-dispatch `git status` baseline; no
  `~/.pi/` or other goal's file is touched.

## Out of Scope

- Any adapter, middleware, hook registration, or Pi extension. Any routing contract, resolver,
  fallback, budget/settlement ledger, or receipt-schema content (RCM/boundary-routing/GMF).
- Any model identity, provider configuration, catalogue fact, or Pi-session canon (PMC).
- Writing to `~/.pi/agent/extensions/`, reading or modifying `pi-jev-budget-guard`, editing
  `routing-policy/`, plugin source, or any Pi host/settings file.
- Live provider availability claims, provider calls, credential inspection, or spend.
- Re-stating RCM's "Assessment of the proposed approach" beyond what D5/D11 pointers require.

## Context & References

- Charters: `plugins/foreman-line/docs/goals/pi-routing-adapter-compat/charter.md`,
  `../pi-model-configuration/charter.md`, `../foreman-line-boundary-routing/charter.md`,
  `../routing-currency-and-merit/charter.md`.
- Plan review: `plugins/foreman-line/docs/goals/pi-routing-adapter-compat/plan-review-findings.md`.
- Source directive: `C:/Users/clint/Documents/Codex/2026-09-23/pl/.audit/directive.md`.
- Installed runtime (pin): `D:\nvm\v24.7.0\node_modules\@earendil-works\pi-coding-agent`
  (version 0.87.1), docs `docs/extensions.md`, examples `examples/extensions/`.

## Allowed Files

```
plugins/foreman-line/docs/goals/pi-routing-adapter-compat/compat-memo.md
plugins/foreman-line/docs/goals/pi-routing-adapter-compat/probe/check-api-surface.mjs
plugins/foreman-line/docs/goals/pi-routing-adapter-compat/probe/check-api-surface.negative-test.mjs
plugins/foreman-line/docs/goals/pi-routing-adapter-compat/evidence/pi-0.87.1/snapshot.json
plugins/foreman-line/docs/goals/pi-routing-adapter-compat/evidence/pi-0.87.1/probe-output.txt
plugins/foreman-line/docs/goals/pi-routing-adapter-compat/evidence/pi-0.87.1/directive-excerpt.md
plugins/foreman-line/docs/goals/pi-routing-adapter-compat/probe/negative-control.mjs
plugins/foreman-line/docs/goals/pi-routing-adapter-compat/evidence/pi-0.87.1/negative-control.txt
```

No other file may be created, edited, or deleted. Paths outside this list require a
coordinator-ratified amendment.

## Verification Plan

Deterministic pass (PowerShell, `node -v` first, from the goal directory):
`node probe/check-api-surface.mjs` (exit 0; `snapshot.json` version == `0.87.1`, every
enumerated-file hash matches disk), `node probe/check-api-surface.negative-test.mjs` (exit
0; proves each missing surface and a version mismatch exit non-zero), and
`node probe/negative-control.mjs` (exit 0). Coordinator closure
check: read `compat-memo.md` and confirm AC3/AC4/AC5 dispositions against
`snapshot.json` before re-running anything.

Mandated reviewer focus questions:

1. Does every "absent" disposition bound itself to the enumerated 0.87.1 surface, with no
   assertion that any API does not exist at runtime?
2. Does the memo contain exactly zero routing-design content, and is the governance
   paragraph verbatim pointer-only with no forward prediction?
3. Does the probe reproduce on the coordinator's machine, fail closed on a missing path or
   version mismatch, and never load Pi or write the host extension directory?
4. Is every real API named as present paired with the "still not an authorization to route"
   pointer?
5. Is the directive excerpt hashed and is it the actual in-repo source of the restated claims?
