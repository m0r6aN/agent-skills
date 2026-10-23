---
ticket: PAN-RP01
title: Private bounded OpenCode Go codec and one-shot sender
status: active
owner: clinton.morgan
created: 2026-10-23
updated: 2026-10-23
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/dispatch/src/pmc-launch/opencode-go-wire.ts
  - plugins/foreman-line/dispatch/src/pmc-launch/opencode-go-sender.ts
  - plugins/foreman-line/dispatch/tests/pmc-opencode-go-wire.test.ts
  - plugins/foreman-line/dispatch/tests/pmc-opencode-go-sender.test.ts
  - plugins/foreman-line/docs/contracts/opencode-go-no-tools-wire-v1.md
  - plugins/foreman-line/docs/specs/active/PAN-RP01-opencode-go-transport.md
  - plugins/foreman-line/docs/specs/done/PAN-RP01-opencode-go-transport.md
  - plugins/foreman-line/docs/kickstarters/PAN-RP01-opencode-go-transport.md
  - plugins/foreman-line/docs/specs/reviews/PAN-RP01-review.md
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: public
verification_class: judgment-required
---

# PAN-RP01 — private OpenCode Go transport dependency

## Intent

Implement the additive [wire amendment](../../contracts/opencode-go-no-tools-wire-v1.md) as two private source modules and offline intercepted tests. This closes a concrete missing source dependency for remote MiMo work; it is neither an executable public route nor commissioned Pantheon operation. RP-02 owns actual resolver/controller/terminal admission after the current CI4 owner boundary. Ember/Anthropic is excluded.

RP-02 explicitly consumes the canonical incarnation P03 owner's model/tool/publication/memory/laptop admission/accounting and terminal contracts; it creates no parallel authority/history. Current owner runtimeAdmissionReady=false and independent verification defects remain open. Merged PR244 source alone closes no readiness gate.

## Constraints

Base`c1a558edbd1a09449e9e98cc0321a6f2b6dc41c4`, branch`feat/pan-rp01-opencode-go`, worktree`D:/Repos/agent-skills-worktrees/pan-rp01-opencode-go`. Existing primary dirty work and other goal custody preserved. Root architecture decision delegated under user's explicit non-destructive authority; no human/Foreman production receipt is fabricated.

Builder edits only the two new source modules and two named tests. Coordinator owns enumerated contract/spec/kickstarter/review docs. No other paths, public barrel, old WireV1/controller/sender/production factory, registry/policy, package/lockfile/CI/config changes. Do not bridge provider types with casts/any, relabel OpenCode as OpenRouter, relax production refusal or import this helper into a launcher. Existing source freezes are checked by coordinator diff, not permanent shipped byte-pin tests.

Use Node builtins; reuse existing immutable bounded JSON scanner if compatible. No SDK/package upgrade or remote installation. Existing package lockfiles/dependencies remain pinned. No credential files, environment credential discovery, real network/server/provider calls, Pi prompts, Docker, auth/account/billing/config changes or deployment. Tests must intercept HTTPS constructors before any possible I/O and use fake credentials only. No generic HTTP service/router/ledger framework.

## Contract

The wire amendment is normative for exact endpoint/model/protocol/headers/body/input/response/usage semantics. Factories are installation-private named exports from new private files only, not package barrels. Prepared values are owned/opaque and bind exact copied bytes/request+decision correlation; no effect authority is implied. Sender is one-shot across concurrent/repeated calls, no redirect/retry/fallback;120s fixed ceiling with bounded cleanup and honest post-constructor uncertainty. Request/response inputs are untrusted and locally validated; installation capabilities are captured separately, never data fields. Preserve unknown money and usage distinctly. Fresh account/gateway-cap/route qualification remains mandatory in RP-02.

## Acceptance criteria

1. Correct rendered private request: official current Go URL/model, truthful client/session headers, exactly system/user text, finite rendered UTF8 input/body, max_completion_tokens1024 including upstream-defined reasoning budget, thinking disabled, streamfalse and no tools/history/custom headers. Installed old base/max_tokens discrepancy is explicit, no silent fallback or live guarantee.
2. Closed plain input capture rejects accessors/custom prototypes/symbols/unknown keys, invalid digests/session IDs/Unicode and boundary overflow without callback/request effects. Prepared-wire forgery/mutation refuses. Correlation/body digest cannot silently drift.
3. Offline fake200 validates exact response identity/choice/text/finish and reported usage. Length remains incomplete, optional/missing usage/reasoning remains unknown, malformed usage never becomes0, no billable amount/ledger result is invented. Reject tool/protocol/malformed/oversize responses safely.
4. Intercepted constructor proves fixed HTTPS/TLS/no-agent headers/body/content length, one attempt for429/5xx/errors/timeouts/repeats/concurrency, pre-send refusal vs post-constructor uncertainty,120s hard deadline and no late reentry. No raw secrets/headers/body/errors leak into result/log.
5. Every owned request/response/timer/listener is cleaned on success/error/abort/timeout; pre-abort and credential refusal produce no request. Throwing credential supplier and synchronous constructor throws have the correct distinct exposure semantics. No unresolved handles or live sockets in tests.
6. Existing production/controller/provider types/public exports remain untouched. Meaningful mutations must kill the relevant tests: output cap changed/removed, retry/second request allowed, uncertainty rewritten no-send after exposure, endpoint identity changed, and usage missing defaulted0. Use dedicated temp/reviewer copies; no source contamination.

## Verification

Node24.19.0 via bundled runtime matches repository CI; default shell Node24.7.0 does not meet dispatch engine>=24.11.1. Install only existing locked development dependencies in the isolated worktree, no manifest edits; discover/record the actual sibling dependency install set required for package checks. Tests are offline despite package installation using existing registries.

Run new wire/sender tests first, then dispatch test/typecheck/lint and relevant existing PMC transport/controller tests under the declared install environment. Lint only touched paths if repository-wide baseline lint is independently red; retain baseline failure, never waive a required CI gate. Run spec-linter and exact source-scope comparison. Normal PR CI is required at the actual final head; no admin/protection bypass. Rebase current main before PR and revalidate changed applicability.

Evidence: actual command exits/test identities/counts/env/install set, captured outgoing request and response/lifecycle cases, named mutation failures, source hashes, two independent source reviews with triage and ordinary eligible PR/merge. Parent coordinator owns broad deterministic validation; avoid duplicate full suites unless changes/failures justify them.

## Dispatch and review

Fresh native`gpt-6-luna`, medium, implements the frozen routine codec/tests under explicit user model direction. Step0 restate-and-stop; no edits until coordinator release. Builder no commits/push/merge. Native role selection is disclosed bootstrap execution, no production resolver receipt claim; native costs unmeasured. Required plan review is fresh independent Sol before implementation. Two independent fresh Sol source reviews afterward: A wire/input/identity/usage contracts; B HTTPS/abort/retry/secret/lifecycle/security, applying security-review guidance. Reviewers never fix/commit; each has its own checkout and mutation probes. Standing constraints apply:`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

Plan gate: fresh native Sol`rp01_plan_review` reviewed038c368f read-only and returned PASS/no must-fix findings; direct new-path overlap not found. Luna`rp01_builder` verified clean038c368f/branch and completed Step0 with strict capture, bounded scanner reuse, one-shot/unknown/lifecycle and offline mutation plan. Coordinator accepted Step0 and promoted this packet before release. Local install/verification environment is recorded in the review evidence; broad checks remain coordinator-owned.

Stop on source collision, missing product/boundary decision, need to weaken/change an existing contract, unsupported cap semantics being presented as live proof, unexpected credential/network access, or failed required checks. Unknown outcomes are retained, not retried. Source completion does not close RP-02/remote account/Pi/Runtime commissioning.

## Source-review closure and pending gates

Corrected source72e9d711 passed both independent exact-head Sol reviews after accepted wrapper-correlation and lexical-usage fixes. See [review and incident record](../reviews/PAN-RP01-review.md). Final package typecheck/lint and surface pins pass; canonical full dispatch recheck995/995 passes after two retained child-process timeout failures and a2/2serial diagnostic; actual counts/times remain in the review record. This packet remains active pending actual final-head CI/eligibility; base-main unrelated CI defects are retained, not waived. No merge or remote admission is implied.
