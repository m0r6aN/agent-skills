Context

Compare the standalone repository at D:\Repos\foreman-line with the packaged plugin at D:\Repos\agent-skills\plugins\foreman-line. The plugin is an installable, cross-repository coordination package. Preserve the plugin's portability boundary: target-repository artifacts and installed-plugin canon are separate roots. Treat provider-specific routing and governance as security-sensitive.

Inventory

- Standalone root manifest files report version 0.4.0; both manifests include the skills directory. The packaged plugin manifests report version 0.2.0.
- Both trees share the core packages: approval, contracts, dispatch, integration, permission-profiles, projection, receipts, registration, routing-policy, schema-scaffold, shaping, skill-injection, spec-linter, and verification.
- Standalone-only functional areas are contract-readers, foreman-config, mutation-scope-guard, role-authority, worker-envelopes, hooks, and templates.
- Standalone dispatch adds a Fireworks worker-contract module, role-aware worker routing, model aliases/runtime profiles, worker lanes, provenance, cost/concurrency/attempt/fallback controls, and structured-result repair/audit behavior.
- Standalone dispatch query and skill resolution accept explicit target/plugin roots and caller-declared identity; the packaged version contains cwd defaults, plugin-shaped path literals, and hardcoded KONE/operator identity in those areas.
- Standalone verification adds a D19 AST audit and a ratified package allowlist. Standalone changelog states that mutation-scope guard has no caller, the hooks tests are not in CI, and dispatch still has known role/runtime defects.
- Standalone hooks use SessionStart to record a model verdict and PreToolUse to enforce it; the model-gate test suite has 12 passing cases in the inspected checkout. Standalone package tests could not be run because tsx/node_modules are absent.
- Standalone foreman-config defines four required closed groups: identity, stack, capabilities, and policy; its resolver is pure and advisory. Worker envelopes are versioned task/result schemas and import role vocabulary. Mutation scope uses preflight and post-hoc checks with forbidden-wins semantics and malformed-path rejection. Contract readers derive timestamped/commit-stamped touch sets and expose intersection, but state that scheduler wiring is not shipped.

Verified observations

- Packaged source contains process.cwd defaults in dispatch, projection, permission-profiles, verification, and related libraries; standalone changes several of these APIs to require absolute roots and distinguishes target repo root from installed plugin root.
- Packaged dispatch query constructs JQL with a fixed assignee email and default project assumptions; standalone adds DispatchIdentityUndeclared and validates project/assignee identity before creating an MCP client.
- Standalone routing policy validates model references, exact runtime profiles, Fireworks lane metadata, provenance, public-only third-party eligibility, cost ceilings, fallback monotonicity, and one schema repair.
- Standalone changelog records that no shipped runtime path calls evaluateRouting and that the worker role mapping has defects.

Your task

Determine which standalone functionality should improve the packaged plugin, distinguish high-confidence ports from design-only references and known-risk work, and propose an ordered adoption plan. Do not recommend copying features solely because they exist.

Output contract

Deliver EXACTLY: "TOP 5 BRUTAL FINDINGS" (numbered, one line each) then "TOP 5 MOVES" (numbered, one line each, implementation-ready). Max 350 words total. Plain text only.
