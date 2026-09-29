# Adversarial Review Brief — PRAC-P0 (compatibility memo)

## Context

Foreman Line is a contract-first, parcel-driven coordination method. The goal
`pi-routing-adapter-compat` produces ONE evidence-backed fact sheet, not an adapter: it
records what the installed Pi coding agent (pin **0.87.1**) actually exposes on its
extension/hook surface, tested against four API-name claims from a *rejected*
middleware proposal (`beforeLLMTurn`, `ctx.session.updateModel(...)`,
`ctx.session.updateThinkingLevel(...)`, and the path `~/.pi/agent/extensions/cost-router.ts`).

You are the adversarial reviewer. You are independent and read-only: you never fix, never
edit, never commit. You read the delivered artifacts and judge them against the contract.

## Artifacts to review (in this repo)

- Spec (the contract, incl. acceptance criteria AC1–AC7 and the verification plan):
  `plugins/foreman-line/docs/specs/active/PRAC-P0-pi-extension-hook-surface-compat.md`
- Charter (locked decisions D1–D11 and the exit criterion):
  `plugins/foreman-line/docs/goals/pi-routing-adapter-compat/charter.md`
- The memo under review:
  `plugins/foreman-line/docs/goals/pi-routing-adapter-compat/compat-memo.md`
- Evidence: `evidence/pi-0.87.1/snapshot.json` (version, hashes, search counts, signature
  lines), `evidence/pi-0.87.1/probe-output.txt`, `evidence/pi-0.87.1/directive-excerpt.md`
  (SHA-256 `0975965d2d369abfd2fd9614c6e9c1b60a985bc2df126d23fa45e9f38630cf36`), and
  `evidence/pi-0.87.1/negative-control.txt`.
- Probe source: `probe/check-api-surface.mjs` and `probe/negative-control.mjs`.

## Verified observations (coordinator, for context — re-check, do not trust)

- `node v24.7.0`; installed package `@earendil-works/pi-coding-agent` is version 0.87.1;
  package root `D:\nvm\v24.7.0\node_modules\@earendil-works\pi-coding-agent`.
- The probe enumerates and hashes 329 files (docs prose, `examples/extensions/`, and
  `dist/**/*.d.ts`), exit 0, `versionMatch: true`.
- Negative control exit 0.

## Your task

Judge the memo hard, against the spec's acceptance criteria and the charter's exit
criterion. Answer each mandated focus question with a PASS / FAIL / CONCERN plus one line of
evidence, and list any additional findings ranked by severity (blocker / major / minor).
Focus questions:

1. Does every "absent" disposition bound itself to the enumerated 0.87.1 surface, with no
   assertion that any API does not exist at runtime?
2. Does the memo contain exactly zero routing-design content, and is the governance
   paragraph verbatim pointer-only with no forward prediction?
3. Does the probe reproduce (read the exit status and search counts in the snapshot; you
   may NOT re-run probes that write files), fail closed on a missing path or version
   mismatch, and never load Pi or write the host extension directory?
4. Is every real API named as present paired with the "still not an authorization to
   route" pointer?
5. Is the directive excerpt hashed, and is it the actual in-repo source of the restated
   claims?

Additional things to probe hardest: (a) any factual claim in the memo that the snapshot or
the repo does not support; (b) the `updateModel` nuance — does the memo correctly explain
why the bare token's two shipped-type occurrences are NOT the proposal's API; (c) whether
the memo accidentally authorizes, recommends, or narrows into anything `pi-model-configuration`
owns.

## Output contract

Deliver EXACTLY: "REVIEW VERDICT" (APPROVE / APPROVE WITH NITS / REQUEST CHANGES), then
"FOCUS QUESTIONS" (Q1–Q5 each PASS/FAIL/CONCERN + one line), then "FINDINGS" numbered and
severity-tagged (blocker/major/minor), one line each. Max 400 words. Plain text only. Write
your final answer to `claude-review-out.txt` in this directory.
