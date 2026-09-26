# HRO-P1c owner bridge shaping handoff

2026-09-26. DRAFT, documentation only. Workspace
`D:/Repos/agent-skills-worktrees/hro-p1c-shaping-20260926`, branch
`codex/hro-p1c-shaping-20260926`, inspected clean base
`725d74107642ecf510974f71d21c00bf6909f149`. Coordinator accepted Step 0 and
released exactly this file and
[HRO-P1c accepted spec](../../specs/done/HRO-P1c-owner-bridge.md).
No implementation, publication or activation is authorized.

## Source inspection and missing value

Read actual root/plugin AGENTS, standing constraints, foreman-shaping, spec
convention, HRO charter/loop, HRO proposal/consumer modules, public PMC projection,
resolver/types, and RCM producer/adapter/projector. Read the current coordinator
copy of `pi-model-configuration/pmc-p2c-composition-notes.md` and
`gate-1-amendment-05.md` V8 in the read-only hro-coordination-20260926 worktree.
V8 and the concrete controller are draft integration context, not implemented
ports. Coordinator reports P2A PR61 merged unchanged source via
`4b86643acd4e5cdf183e85cf1cd1c2ace51e0182`, all twelve checks green with two final
and combined approvals. This shaper did not query the network independently.

| Actual surface | Consequence |
| --- | --- |
| P1a validates HRO draft projection and mapping proposal; P1b consumes unknown oracle/evaluator returns | Neither is PMC policy, a pmc/v1 selector or authorization. Preserve their separate offline role. |
| projectProviderBindingsV1 returns whole validated policy, unknowns and lane occurrences | Reuse it losslessly; do not invent a subset of allowed proposals. |
| evaluateCatalogEligibility returns adapter/reader/projector stages; successful rows use requested.provider/id | PMC CatalogClaim uses provider/providerModelId. A small deterministic translation is missing. |
| producePublicObservationSnapshot returns canonical bytes, digest, acceptedSource and evidenceOnly | Production is outside the bridge; test the real retained evidence chain instead of fake ports. |
| resolvePmcRouteV1(request: unknown, context: unknown) already validates context, current claims and ranks | Do not duplicate it. Assembled context honestly remains unknown until this owner validates it. |
| P2A decisions say authority selection-only | No result in this parcel can launch anything. P2B/B1/C/D/E remain authority/caller prerequisites. |

Recommended one parcel: evidence-only context assembly in four exact HRO files,
architecture/risk, elevated risk. The coordinator accepted this decomposition
direction during shaping, subject to review of the concrete draft. No extra
resolver wrapper, mapping conversion package, general adapter registry or new
claim schema is needed. The one useful exported value is consumed by the real
resolver in integration tests; its intended future production consumer is P2C's
trusted controller. That controller contract must separately name the call site
and authenticate source/profile before adoption; this draft does not declare it
already wired.

## Owner boundaries and deliberate limits

The bridge owns safe capture, closed envelope, matching evaluation times and
catalog-row identity/field translation. PMC owns policy validation, exact request
lane coverage, current eligibility, ranking and refusal semantics. RCM owns
canonical reader, source/scope/config/freshness and normalized catalog facts.
Trusted caller owners authenticate claims and bind producer profile/source
evidence; copied claims remain assertions, never proof. In particular a hash
field cannot manufacture catalog-source authority or actual provider availability.

No proposal-to-PMC conversion is necessary. P1a/P1b evidence can be inspected as
proposal evidence; feeding it into the new API's policy or owner claim positions
does not satisfy the owner resolver. The regression suite preserves their old
behavior and exercises real RCM output in the P1b oracle slot, while its legacy
v0 evaluator remains fixture-only. Invoking dispatch evaluateRouting in this
library would add policy-file/receipt effects and a runtime dependency cycle;
the draft excludes it.

Later exact caching may retain reusable choice evidence, not budget, availability,
independence, intent authority or a one-use permit. The actual P2A implementation
currently repeats full context validation and ranking; it exposes no cached-choice
fast path. This bridge is useful integration groundwork and provides no measured
speedup. A future optimization must identify redundant work and preserve owner
revalidation, then demonstrate benefit instead of assuming it.

## Pending review decisions and gates

1. Ratify the concrete four-file scope and deliberately bounded capture limits.
   Do not expand to owner exports, dependencies or runtime files without amendment.
2. Review the honest unknown context boundary: it permits assembly of malformed
   dynamic claim data for subsequent owner refusal, never claims prior validation.
3. Review the future P2C contract adjustment separately. Production cannot proceed
   on fictional authentication/custody ports; V8 requires actual P2B1 durable
   intent custody, accepted controller, controlled transport and exercised caller.
4. Independent design review, coordinator lint/promotion and named Step-0 builder
   release remain necessary. User's existing delegation avoids a redundant user
   authority question; it does not waive these evidence gates.

The full charter exit still requires actual approved Foreman/Pi execution,
deterministic cache reuse with current gates, correlated receipts, bounded unknown
model recovery, configuration repair/diagnostics, measured comparable cost/latency/
quality and independent live-smoke acceptance. This offline slice cannot close it.

## Validation and scope record

Two-layer draft self-check and frozen frontmatter CLI lint are run with the
read-only hro-pmc-p1a-20260926 tooling donor on Node 24.19.0. Validation outcomes
are recorded below after execution. No install, provider request, host/config
write, PR, push or implementation is part of this shaping session. The explicit
two-file instruction supersedes the shaping skill's generic extra ShapingResult
JSON artifact; this document is the handoff, not a schema-valid ShapingResult or
receipt. Both changed files stay documentation and the spec stays draft.

Executed validation: Node reported v24.19.0; donor spec-linter CLI `validate`
against the absolute draft path exited 0 without diagnostics. Donor shaping
`selfCheckDraft` returned valid=true, frontmatter valid=true with no errors or
warnings, and body valid=true with no errors. The first loader invocation used
a Windows drive path where Node requires a file URL and failed before validation;
the corrected file-URL invocation produced the passing results above. No tooling
or dependencies were changed. `git diff --check` passed; exact scope inspection
found only the two authorized new Markdown files. No implementation tests were
run for this prose-only shaping work; the draft defines the later required suite.
