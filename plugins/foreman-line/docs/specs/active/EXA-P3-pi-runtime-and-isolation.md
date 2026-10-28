---
ticket: EXA-P3
title: Launch and observe fresh Pi workers through admitted runtime profiles
status: draft
owner: clinton.morgan
created: 2026-10-17
updated: 2026-10-17
risk: critical
surfaces:
  - plugins/foreman-line/execution-adapter/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

# EXA-P3 - Launch and observe fresh Pi workers through admitted runtime profiles

## Intent

Implement the actual Pi execution capability behind P1/P2, using the supported installed runtime rather than bare model commands. Prove that approved identity, evidence/tool isolation and request limits are enforced at the real launch/send boundary.

## Constraints

These are proposed implementation boundaries in a Stage A draft. Human choices confirmed in this chat: local CLI first; only DocSpine/Kompress shaping and AI Council critique sessions; select concrete routes during admission from approved profiles, with no fixed roster in these specs. This draft grants no implementation, provider spend, dispatch, merge, or activation authority. Parcel identifiers are local planning keys, not claims of registered Jira issues. Risk classifications are recommendations for coordinator/human disposition.

P0 must first pin a concrete supported Pi integration profile and the exact installed package/runtime version. Pi 1.3.0 and Node 24.19.0 are source-inspection candidates; no compatibility or production claim follows from installation. Read installed SDK/RPC declarations at that pin and record compatibility. Use Pi's supported provider/auth path; never construct an OAuth/HTTP broker or copy credentials.

A fresh supervised child has a new isolated conversation, explicit resources and exactly read_evidence(entryId). No inherited history, compaction, ancestor configuration/prompts/AGENTS, automatic skills/extensions/MCP, shell/edit/write/network/environment tools, model switching or hidden retries. Native provider authentication remains outside model context. The coordinator persists returned text.

Process/filesystem/network confinement must be the actual platform mechanism fixed by P0. A prompt, worktree, tool allowlist or ResourceLoader by itself is not confinement proof. Contain child processes and clean them up through supported APIs; if the mechanism cannot enforce the stated boundary, return the exact unsupported seam before live activation.

Before every token-bearing request, revalidate P2 permit/expiry, selected route/auth/thinking, immutable packet and remaining cumulative limits. Observe actual selected/executed identity and thinking through trusted runtime events, not model prose. If a Pi/auth profile lacks a required pre-send/usage hook or approved data/billing evidence, hold that profile; never silently use another credential/provider.

Reuse existing compatible PMC runtime/stream/finalization patterns as imported primitives only where their contract applies. createProductionPmcTerminalV1 stays refused; its public/OpenRouter/toolUse=false contract is not cast to this internal/read_evidence path. The OPMEM native-only approval is not inherited.

The runtime returns bounded raw findings plus trusted execution/usage/terminal observations to the host. It cannot accept findings, issue new authority or write repository artifacts. P4 owns common result packaging.

## Acceptance Criteria

1. Accepted compatibility record names actual package/runtime/dependency pins, supported constructors/events/hooks and configured auth mode for each admitted runtime profile. No unsupported profile advertises launchable.

2. Positive offline integration uses real pinned Pi APIs with a network-incapable test provider, proving session/resource construction; mocks alone do not claim SDK integration.

3. A consumed P2 permit is required before any provider operation. Wrong/revoked/expired identity, packet or allowance refuses before credential resolution/send.

4. Exact selected/executed provider/model/thinking matches the admitted namespace mapping; silent auth/model fallback and hidden retry are blocked or the profile remains held.

5. Evidence ID lookup works; tests/probes establish actual denial of arbitrary files, shell/process escape, inherited tools/history, network outside the admitted provider boundary and secret exposure. Claims are separated into deterministic and live platform evidence.

6. Cumulative input, output/reasoning, request count and elapsed limits include every model/tool turn. Missing usage and native auth/charge uncertainty propagate to P2 without invented zero values.

7. Output/cleanup are bounded; cancellation and orphan/restart tests terminate or report uncertain children truthfully, preserving liabilities and any partial findings. Wait for the actual settled boundary appropriate to the pinned runtime.

8. The production binding cannot be selected by task data or an env/test flag. Missing authentic installation/control evidence returns a useful held reason without sending.

## Out of Scope

Interactive terminal automation, global Pi settings repair, provider model calls during this parcel's deterministic checks, custom auth/brokers, code-writing workers, general sandbox platform, and direct CLI bypass.

## Context & References

- [EXA-P0-contract-reuse-and-bootstrap.md](EXA-P0-contract-reuse-and-bootstrap.md)
- [EXA-P1-packet-and-route-admission.md](EXA-P1-packet-and-route-admission.md)
- [EXA-P2-durable-authority-and-accounting.md](EXA-P2-durable-authority-and-accounting.md)
- [../../../dispatch/src/pmc-launch/pi-runtime-port.ts](../../../dispatch/src/pmc-launch/pi-runtime-port.ts)
- [../../../dispatch/src/pi-entry/index.ts](../../../dispatch/src/pi-entry/index.ts)
- [../../contracts/internal-review-launch-v1.md](../../contracts/internal-review-launch-v1.md)

## Dependencies

EXA-P0/P1/P2 accepted and a concrete P0 runtime/isolation integration profile released. If platform/request hooks are unavailable, report the named seam; do not broaden into a new broker or pretend an injected test port is production.

## Allowed Files

Future proposed mutation envelope, exact repository-relative paths. These draft entries grant no current mutation authority.

- plugins/foreman-line/execution-adapter/src/pi-runtime.ts
- plugins/foreman-line/execution-adapter/src/isolation.ts
- plugins/foreman-line/execution-adapter/src/evidence-tool.ts
- plugins/foreman-line/execution-adapter/src/runtime-observation.ts
- plugins/foreman-line/execution-adapter/tests/pi-runtime.test.ts
- plugins/foreman-line/execution-adapter/tests/isolation.test.ts
- plugins/foreman-line/docs/goals/execution-adapter/pi-compatibility-and-control-evidence.md

## Verification Plan

Run pinned API compatibility and network-incapable runtime tests. Actual provider/platform probes belong to EXA-P6's separately admitted proof. Reviewer questions: Are auth/resources controlled before first send? Does isolation enforce the claim outside the prompt? Are settled and merely model-ended states distinguished?

