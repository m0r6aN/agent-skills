---
ticket: EXA-P5
title: Wire /goal and the shaping sessions to the CLI with independent Council scheduling
status: draft
owner: clinton.morgan
created: 2026-10-17
updated: 2026-10-17
risk: elevated
surfaces:
  - plugins/foreman-line/execution-adapter/
  - plugins/foreman-line/skills/
  - plugins/foreman-line/templates/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

# EXA-P5 - Wire /goal and the shaping sessions to the CLI with independent Council scheduling

## Intent

Make the CLI the discoverable execution path used by /goal, DocSpine/Kompress shaping work and Council critiques. Preserve coordinator decisions, worker independence, receipt-per-seat discipline and bounded host concurrency.

## Constraints

These are proposed implementation boundaries in a Stage A draft. Human choices confirmed in this chat: local CLI first; only DocSpine/Kompress shaping and AI Council critique sessions; select concrete routes during admission from approved profiles, with no fixed roster in these specs. This draft grants no implementation, provider spend, dispatch, merge, or activation authority. Parcel identifiers are local planning keys, not claims of registered Jira issues. Risk classifications are recommendations for coordinator/human disposition.

/goal remains coordinator and decision owner. The Pi package still expands skills; it does not become an alternate issuer. Add exact CLI invocation, request/evidence contracts and named refusal/recovery guidance to existing skills. Resolve ${CLAUDE_PLUGIN_ROOT} using established package conventions.

Host-owned templates produce task envelopes/packets for docspine-shaping and kompress-shaping. Workers return text; host persists drafts through existing Stage A tooling. No worker edits a spec, service, global config or approval state. These are subject-matter shaping sessions, not claims that DocSpine indexing or Kompress semantics have been fixed.

Council uses a fresh conversation, approved route/permit, role/lens and output artifact for each critique seat. Family diversity and author/reviewer exclusions are checked for primary AND fallback at scheduling/launch time. The same brief/mandate is shared without the orchestrator's verdict; outputs are inaccessible to other seats. One route's fallback never counts as a second independent reviewer.

Reuse council quorum discipline: at least two successful independent critique seats plus orchestrator, report absent/failed seats; higher existing architecture/risk requirements still apply. At most two attempts per seat within its approved pair and aggregate budget. Decision-model REST seats are outside this release and cannot satisfy critique quorum.

Do not freeze model names, host timings or auth modes in templates. Stagger launches with a P0-admitted host-capacity profile; seats.md's observed ~25-second spacing is initial advisory evidence, not proof or an excuse for automatic cost-bearing retries. Default conservative one-at-a-time execution is acceptable until a measured profile admits more; no same-family substitution.

Preserve human gating and Stage A stop. Reconcile routing directive through the new companion semantics without weakening legacy/public-v1 rules. seats.md's unrelated local edits require an explicit merge/owner disposition before the future patch; never overwrite them from a cached copy.

## Acceptance Criteria

1. Each skill names the tested CLI path and an immutable request/artifact contract; if unavailable it reports the missing command/evidence instead of using bare pi.

2. Two task templates validate with the unchanged TaskEnvelope schema and scope only the intended shaping outputs; data class and grant are explicit, not silently public/default.

3. Council scheduling allocates distinct task/instance/permit/attempt/output records for every seat and validates family independence for all eligible fallback combinations.

4. Shared brief and lens fixtures prove no previous output, orchestrator conclusion or author history enters another seat's packet.

5. Host capacity, stagger, seat attempt ceiling and batch budget are enforced; OOM, missing profile or exhausted quota gives a truthful partial result without hidden new route.

6. At least two independent critique results and the orchestrator's recorded independent findings satisfy minimum quorum; a failed seat or decision-model vote never substitutes for critique coverage.

7. Artifact mapping connects request -> approved route/permit -> observed runtime -> result -> synthesis. Missing results or identity remain incomplete rather than consensus.

8. Documentation/examples require no model-name CLI override, credential exposure or runtime config mutation; seats.md evidence remains maintained local notes, not approval.

## Out of Scope

Decision-model REST integration, general builders/coordinators, automatic acceptance/merge, full AI Council run in documentation tests, service changes, global Pi package installation and modification of the Pi command-expansion implementation.

## Context & References

- [EXA-P0-contract-reuse-and-bootstrap.md](EXA-P0-contract-reuse-and-bootstrap.md)
- [EXA-P4-installed-cli-and-composition.md](EXA-P4-installed-cli-and-composition.md)
- [../../../skills/goal/SKILL.md](../../../skills/goal/SKILL.md)
- [../../../skills/foreman-shaping/SKILL.md](../../../skills/foreman-shaping/SKILL.md)
- [../../../skills/ai-council/SKILL.md](../../../skills/ai-council/SKILL.md)
- [../../../skills/ai-council/references/seats.md](../../../skills/ai-council/references/seats.md)

## Dependencies

EXA-P0-P4 accepted. Shared skill/directive/notes files require a single coordinator-owned mutation window and reconciliation of existing local edits.

## Allowed Files

Future proposed mutation envelope, exact repository-relative paths. These draft entries grant no current mutation authority.

- plugins/foreman-line/execution-adapter/src/council.ts
- plugins/foreman-line/execution-adapter/tests/council.test.ts
- plugins/foreman-line/execution-adapter/templates/docspine-shaping.request.json
- plugins/foreman-line/execution-adapter/templates/kompress-shaping.request.json
- plugins/foreman-line/execution-adapter/templates/council-critique.request.json
- plugins/foreman-line/skills/goal/SKILL.md
- plugins/foreman-line/skills/foreman-shaping/SKILL.md
- plugins/foreman-line/skills/ai-council/SKILL.md
- plugins/foreman-line/skills/ai-council/references/seats.md
- plugins/foreman-line/templates/pi-routing-directive.md

## Verification Plan

Validate examples and scheduling with imported schemas and private offline profiles. Reviewer questions: Can a fallback destroy family independence? Does the orchestration leak prior verdicts? Do user notes or a generated template accidentally become route authority?

