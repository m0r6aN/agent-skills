# Foreman Line Boundary and Routing Charter

**Prepared:** 2026-09-19
**Goal:** `foreman-line-boundary-routing`
**Status:** Authorized implementation directive
**Owner:** Foreman Line maintainers

## Objective

Port the reference Foreman Line boundary controls into the packaged plugin,
make repository identity and roots explicit, and add a safe Pi execution-plane
router without moving Foreman authority into the harness. The result must be
installable by each supported client and must not contain an active Fireworks
route, model alias, worker adapter, credential contract, or fallback path.

## Locked decisions

| ID | Decision |
|---|---|
| D1 | Every target-repository and installed-plugin root is supplied explicitly and must be absolute. No library silently derives a root from `process.cwd()`, module location, or a guessed checkout layout. |
| D2 | Repository identity is injected from `foreman/config.yaml`; no registration or dispatch library owns a project key, queue identity, operator identity, or customer-specific default. |
| D3 | `foreman-config` owns the configuration document shape, validation, and capability vocabulary. The spec linter consumes it explicitly; dispatch consumes its identity type; registration consumes or verifies its declared project key. Invalid or contradictory declarations refuse before external effects. |
| D4 | Role contracts and task/result envelopes are provider-neutral. Their TypeScript sources, committed JSON Schemas, generated artifacts, and full-population fixtures must remain in parity. Concrete models are opaque registry keys. |
| D5 | Mutation scope is checked twice when a task envelope is supplied: preflight against spec `surfaces:` before dispatch, and post-hoc against adapter-reported changed paths before the Stage-C receipt is written. Missing changed-path evidence is a refusal. |
| D6 | Hooks are thin host adapters and templates are scaffolding. They may report or block a host-visible violation, but they do not become a second routing or approval engine. |
| D7 | Pi automatic routing is permitted only inside a Foreman-approved execution lane. Foreman still decides role, risk, data classification, required independence, approval status, allowed files, and the maximum cost/attempt budget. Every selected model and route explanation is recorded in the dispatch/result evidence. |
| D8 | Coordinator, human approval, security review, verification independence, merge, and release decisions are never delegated to Pi auto-routing. They use an explicit approved model/profile or stop for a human. |
| D9 | Fireworks routing is removed completely. There is no Fireworks provider, worker lane, environment variable, model alias, direct adapter, fallback, or route fixture in shipped functionality. |
| D10 | The Pi/OpenRouter structured-decision candidate is exactly `typesafe/jev-1.13` at `https://openrouter.ai/api/v1`. Jev is enabled only for fast routing/classification recommendations; it is not a prose-generation or implementation worker and cannot approve, merge, release, or bypass policy. |

## Work items and dependencies

1. Port explicit roots and identity injection across approval, shaping,
   projection, dispatch, registration, linting, and integration.
2. Ship `foreman-config`; wire explicit config validation into linting and
   identity use into dispatch and registration.
3. Ship `role-authority`, `worker-envelopes`, and `contract-readers`, including
   generated-schema parity and fully populated contract tests.
4. Ship and invoke `mutation-scope-guard` at dispatch preflight and post-hoc
   completion.
5. Ship hooks and templates, including a config template and client-neutral
   role/envelope scaffolding.
6. Remove Fireworks route code, provider references, credentials, fixtures, and
   stale active documentation; keep no hidden fallback.
7. Run package, integration, parity, negative-control, and installation gates.

## Pi routing directive

Pi is the execution-plane router, not the Foreman coordinator. The initial
designation is deliberately conservative:

| Lane | Initial handling | Candidate designation |
|---|---|---|
| `boilerplate` / low-risk builder | Pi may auto-route within the approved budget and public-data policy | `openrouter:openai/gpt-4o-mini` or the current approved economy equivalent |
| standard builder | Pi may auto-route among approved coding models | `opencode:qwen/qwen-2.5-coder-32b` as the default coding candidate |
| reasoning-heavy builder or repair | Explicit selection or tightly bounded auto-route | `opencode:deepseek/deepseek-r1-distill-qwen-32b` |
| independent verifier/reviewer | Explicit provider/family distinct from the builder where diversity is required | `openrouter:anthropic/claude-3.5-sonnet` or the current approved independent equivalent |
| routing / classification decision | Pi may ask Jev for a typed lane recommendation after Foreman supplies the bounded input | `typesafe/jev-1.13` through OpenRouter; `recommend-only`, never prose or implementation |
| coordinator, approval, security, merge | Explicit only; no automatic route | Human-selected approved session model |

These are starting designations, not a promise that every identifier remains
available. The runtime registry must validate availability, capability, data
policy, and budget before use. Pi's `enabledModels` is a user-facing cycling
list; it is not the authority source for routing. The authority source is the
Foreman route decision plus the selected harness's bounded route configuration.
The shipped Pi/OpenRouter template is
`templates/pi-openrouter-routing.json`; it contains the exact base URL and
enabled model list without credentials. Jev's capability entry is
machine-checked as `recommend-only` with only `routing` and `classification`
lanes allowed.

## Acceptance and release gates

- A clean-room caller can pass absolute `repoRoot` and `pluginRoot` values and
  receives a typed refusal for relative roots.
- No shipped library contains a customer-specific project, assignee, or root
  fallback; identity comes from explicit caller/config inputs.
- Linting rejects malformed `foreman/config.yaml` documents and accepts declared
  capability vocabulary only through `foreman-config`.
- Role, envelope, config, reader, and mutation schemas pass generated parity
  tests; negative fixtures prove unknown keys, missing required fields, and
  malformed paths refuse.
- Dispatch with a scope envelope refuses an unauthorized surface before
  worktree creation and refuses missing or out-of-scope post-hoc evidence before
  receipt emission.
- Hooks and templates are present, documented, and do not introduce a second
  policy source.
- A repository-wide active-code sweep finds zero Fireworks references,
  provider aliases, credential names, or worker-lane route paths. Historical
  records are not executable functionality; any retained historical record must
  be clearly labelled as retired.
- All eligible client installations report the new plugin/skill version, with
  unsupported clients recorded as not applicable rather than silently skipped.
- The Pi/OpenRouter template and routing-policy capability tests prove the
  exact Jev ID, base URL, enabled-list membership, schema parity, and refusal
  of prose/implementation/control-plane use.

## Out of scope

This charter does not host a custom fine-tuned model, choose a permanent vendor
or model family, add provider credentials to the repository, or claim that a
client hook can mediate channels the host does not expose.
