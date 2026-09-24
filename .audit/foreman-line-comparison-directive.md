# DIRECTIVE — Foreman Line standalone-to-plugin comparison (1-seat verified review)

Evidence: `foreman-line-comparison-brief.md`, `foreman-line-comparison-codex.txt`, and direct source/test inspection. Grok and Claude CLI seats did not return final artifacts during the bounded review window; Gemini returned a CLI argument error.

## Verdict

The standalone tree contains real improvements worth bringing into the plugin, but it is not a safe drop-in replacement. Port the portability and identity boundaries first; stage worker-fabric/runtime features behind explicit contracts, integration callers, and security ratification.

## Convergent / verified findings

- F1 — Critical: the plugin still has library-level `process.cwd()` defaults and home-repo path assumptions, while standalone requires separate absolute target/plugin roots.
- F2 — High: `foreman-config` closes an already-documented portability gap and provides the missing identity/capability declaration boundary.
- F3 — High: `role-authority` and `worker-envelopes` are useful schema contracts, but they are not runtime enforcement by themselves.
- F4 — High: `mutation-scope-guard` is security-relevant but standalone explicitly has no caller; ship it only with dispatch/post-execution wiring.
- F5 — Conditional: Fireworks routing/result contracts add substantial controls, but standalone records role/runtime defects and no shipped runtime caller for `evaluateRouting`.

## Execution plan

1. Create a compatibility branch; sync manifests/version/docs only after package-level parity checks.
2. Port explicit roots and caller-declared Jira identity across dispatch, registration, projection, skill resolution, approval, permission profiles, and verification; add relocation and refusal tests.
3. Port `foreman-config`; wire spec-linter capability extensions and dispatch/registration identity from it.
4. Port `role-authority` and `worker-envelopes` as generated-schema contracts with full-population/parity tests.
5. Integrate mutation-scope preflight/post-hoc checks in one owned parcel.
6. Separately gate model hooks, templates, contract-readers, Fireworks routing, and provider policies; do not copy the standalone `.env`.

## Rules of engagement

Keep each port as a focused change, preserve relative ESM imports, ratify every added package in the D19 allowlist, run typecheck/test/lint, and record known standalone defects as blockers rather than silently inheriting them.
