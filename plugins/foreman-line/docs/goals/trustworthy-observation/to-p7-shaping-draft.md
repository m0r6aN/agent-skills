---
ticket: TO-P7
title: Real trustworthy observation exit evidence
status: draft
owner: clinton.morgan
created: 2026-10-10
updated: 2026-10-10
supersedes: null
superseded_by: null
risk: standard
routing_class: standard-feature
verification_class: judgment-required
permission_profile: builder-standard
data_classification: public
surfaces:
  - plugins/foreman-line/docs/goals/trustworthy-observation/exit-evidence.md
  - plugins/foreman-line/docs/goals/trustworthy-observation/exit-evidence-manifest.json
  - plugins/foreman-line/ops-console/tests/api.test.ts
  - plugins/foreman-line/ops-console/tests/multi-root.test.ts
  - plugins/foreman-line/ops-console/tests/read-only.test.ts
  - plugins/foreman-line/ops-console/tests/ui-refresh.test.ts
---

## Intent

Produce trustworthy, independently verifiable exit evidence for the TO program's
observation goal by exercising the real sealed w4-closeout/E6-R1 workflow
(`a5b1975a-7497-4200-bac2-5d8a6fd6c749`) end-to-end through console and CLI with
genuine kompress, routing, and skill sidecars present, and by recording that
evidence in a manifest a reviewer can audit. All evidence comes from real
artifacts and real runs; fixtures supplement but never substitute. No product
code changes are in scope. This ticket is outside-active draft only: no
ShapingResult, receipt, activation, or implementation acceptance is produced
here.

## Constraints

- Prerequisites: all of P0–P6 merged; sources and owners verified before any run.
- No product code changes. Any failure halts work for an exact remedial scope
  amendment before code; tests are never weakened and green is never claimed
  without proof.
- The real sealed chain is read-only. The genuinely invalid matching-member
  negative control runs only against an isolated copy; no real source mutation.
- Preserve per-file CLI exits, membership, ordering, link, and correlation
  behavior; no synthetic seal or approval is fabricated.
- Multi-root evidence uses the actual plugin-primary tree plus extra
  native/initiative trees configured locally; real API responses and browser
  navigation must identify the correct existing source identity and content.
- External-worker inputs are public only; private targets are inspected locally
  by the independent verifier, which retains bounded redacted summaries/hashes,
  never raw contents or DOM.
- Console state is isolated and temporary; an unused localhost port; chromium
  runs with an isolated profile; no operator service replacement.
- Command handoffs are grounded in actual shipped CLI contracts and
  supported-shell quoting; approval-show resolves only an existing unique
  artifact with no projection; approvals/reject/dispatch are never executed.
- Shell matrix reflects real availability: record supported-shell execution, copy-only, and unavailable environments separately; cmd.exe copies
  are withheld; no fake environment proof.
- No repo browser launcher or child process outside the sole invoke; the
  independent verifier may run a temporary `/tmp` browser harness as
  uncommitted local verification tooling.
- No manifests, deps, routes, state, or registry changes.
- Store no tokens, private workflow contents, or raw browser DOM.
- NodeDOM supplements but never replaces real browser proof.

## Acceptance Criteria

The exit criteria below are reproduced verbatim from the public charter and
must remain verbatim in requirements:

1. Gate 1 ratification, fresh plan review and triage, parcel contracts, independent
   reviews, and authorized merges are recorded for the named parcel set.
2. Negative ratification and malformed-member reproductions fail safely; supported
   positive cases still work; no changed test merely asserts the faulty behavior.
3. The same real sealed chain validates consistently through console and CLI with
   its genuine sidecars present. A genuinely invalid member fails both paths.
4. Actual API responses and browser navigation identify the correct source root
   and existing document for each supported tree layout. Synthetic alternate-root
   checks supplement, but never replace, a real multi-root read-only run.
5. Existing remediation handoffs are grounded in CLI contracts and checked without
   executing approvals, merges, or dispatch. Ambiguous commands are withheld.
6. Browser evidence demonstrates fresh goal counts, refreshed selected detail,
   safe rapid goal switching, and honest stale/error presentation. A DOM-only
   harness may support tests but cannot substitute for the real browser proof.
7. An evidence manifest records commands, revisions, independent review outcomes,
   read-only negative controls, environment gaps, and remaining limitations.

The existing five-state classifier remains limited: queued work can still appear
hung and file mtime does not prove agent liveness. Document this in the console's
existing explanatory UI/docs; deeper lifecycle/execution modeling is deferred.

The goal is not complete until all actual exit conditions are proved.

## Out of Scope

- Product code changes of any kind.
- ShapingResult, receipts, activation, or implementation acceptance.
- Lifecycle/execution modeling beyond the documented five-state classifier
  limitation.
- New manifests, dependencies, routes, state, or registry entries.
- Any path not listed in Allowed Files.

## Context & References

- Public charter exit criterion (quoted above).
- Sealed workflow: w4-closeout/E6-R1, id `a5b1975a-7497-4200-bac2-5d8a6fd6c749`.
- P0–P6 merged parcels; P6 introduced `plugins/foreman-line/ops-console/tests/ui-refresh.test.ts`, which this
  ticket must reconcile against real browser evidence.

## Allowed Files

- `plugins/foreman-line/docs/goals/trustworthy-observation/exit-evidence.md`
- `plugins/foreman-line/docs/goals/trustworthy-observation/exit-evidence-manifest.json`
- Optional, only if meaningful coverage is missing: `plugins/foreman-line/ops-console/tests/api.test.ts`,
  `plugins/foreman-line/ops-console/tests/multi-root.test.ts`, `plugins/foreman-line/ops-console/tests/read-only.test.ts`, `plugins/foreman-line/ops-console/tests/ui-refresh.test.ts`
- No unspecified paths.

## Verification Plan

- Independent verifier produces actual proof; coordinator consumes; reviewer
  verifies claims.
- Run the real sealed chain through console and CLI with genuine sidecars;
  confirm parity of exits, membership, ordering, link, and correlation.
- Run the genuinely invalid matching member against an isolated copy; confirm
  safe failure on both paths with no real source mutation.
- Execute a real multi-root read-only run (plugin-primary plus native/initiative
  trees); confirm API responses and browser navigation identify the correct
  source root and existing document per layout.
- Validate remediation handoffs against shipped CLI contracts and supported-shell
  quoting; confirm ambiguous commands are withheld; never execute
  approvals/merges/dispatch; approval-show resolves only an existing unique
  artifact.
- Real browser runs (isolated profile, unused localhost port, temporary console
  state) demonstrate fresh goal counts, refreshed selected detail, safe rapid
  goal switching, delayed responses, and honest stale/error/recovery
  presentation; NodeDOM only supplements.
- Shell matrix: record real availability; withhold cmd.exe copies; separately name copy-only/unavailable environments; no fake environment proof.
- Full `npm test`, typecheck, lint; unchanged-root audit; read-only negatives;
  independent review; exact PR CI and merge revisions recorded.
- Evidence manifest records commands, revisions, artifact refs, reviews,
  environment gaps, open exit conditions, next-goal limitations.

Reviewer questions:

1. Does every manifest claim cite a reproducible command, revision, and artifact
   ref?
2. Did the invalid-member negative control run only on an isolated copy?
3. Does real browser proof (not NodeDOM) back each UI claim, including
   reconciliation of `plugins/foreman-line/ops-console/tests/ui-refresh.test.ts`?
4. Were any approvals, merges, or dispatch executed, or any environment proof
   faked?
5. Are environment gaps and remaining limitations honestly recorded?

Coordinator corrections: exact repository paths replace invented short paths; approval-show uses actual registry spelling; shell-copy support is distinct from tested runtime availability. Historical spec closure/merge review applies normally at actual activation; the draft itself emits no receipt or activation. Parent/source/owner reconciliation required. This shaping draft is not exit evidence.
