# Execution Plan — Trustworthy Observation

Status: ratified 2026-10-10; plan review closed; baseline repaired; TO-P0 merged78c8b41f; TO-P1 built, independently verified/reviewed; publication/merge pending. [Charter](../charter.md) owns the scope,
decision list, graph, gates, and exit criteria. Tasks live in [todo.md](todo.md).
This goal-local location follows Foreman's goal organization; no existing
repository-level plan or task list is replaced.

## Layout and commands

Console implementation: `plugins/foreman-line/ops-console/src/`; served UI:
`ops-console/ui/`; Node tests: `ops-console/tests/`. Receipt CLI and tests:
`plugins/foreman-line/receipts/src/` and `receipts/tests/`. Goal docs are here;
dispatchable contracts go in the plugin's `docs/specs/active/` after shaping.
Follow each existing package's TypeScript/Biome style and dependency manifest.

In each affected package, use `npm ci`, `npm run typecheck`, `npm test`, and
`npm run lint`, with `node -v` recorded first. There is no assumed build script.
Focused tests: `node --import tsx --test tests/<actual-test-name>.test.ts`.
CLI parity: `node --import tsx ../receipts/src/cli.ts validate <absolute-workflow-dir>`
from ops-console, using a recorded real workflow path and its genuine sidecars.
Console run: `FOC_REPO_ROOT=<absolute-repo> FOC_STATE_DIR=<isolated-state> npm start`.
Do not replace the running service to obtain proof.

Exact files, dependency installation needs, supported-shell commands, test
baselines, and review questions are fixed in shaped specs, not guessed here.
No runtime dependency or UI framework addition is planned.

## Ordered tasks

| Task | Likely implementation surfaces | Scope control |
| --- | --- | --- |
| TO-P0 | companion amendment and bounded scenario inventory | docs only; map each affected frozen clause and owner |
| TO-P1 | scan.ts, focused ratification tests/fixtures | reader only; no gate writes or new approval schema |
| TO-P2 | chain.ts, project/API containment seam, focused tests | invalid evidence visible, unrelated projection survives |
| TO-P3 | receipts membership helper/export/CLI, console consumer, parity tests | shared ownership seam; split by owner amendment if oversized |
| TO-P4 | config/scan refs, API source metadata, UI links, multi-root tests | preserve qualified keys and actual layout; scope exact files |
| TO-P5 | remedy.ts, command rendering, focused tests | only existing command handoffs; no action expansion |
| TO-P6 | app.js, minimal index.html status UI, browser tests | current layout; generation/error state, no redesign |
| TO-P7 | goal-local evidence, README, regression/browser scenarios | prove behavior through actual consumers |

Five or fewer implementation files is the shaping target. Large fixture
populations remain close to tests. Any overlarge owner-crossing parcel is
re-proposed before dispatch, not expanded at build time.

## Checkpoints

- After TO-P0: independent contract reviews accepted and amendment landed.
- After TO-P3: approval negatives and malformed evidence contained; real CLI
  and console parity proven; affected suites and read-only controls green.
- After TO-P5: actual multi-root navigation and command grounding verified.
- After TO-P7: real browser refresh/race/error proof and full exit manifest.

Each parcel requires a green-chain merge under delegated Gate 3 (A1). Checkpoints aggregate evidence; they
do not add a redundant permission gate for reversible prescribed checks.

## Baseline CI dependency

PR #167 sweep diagnostics report five D19 audit violations in unchanged FCA
config.ts (d86ade55 baseline). Independent read-only reproduction is dispatched.
No merge may bypass green requirements. A confirmed baseline repair must receive
its own scoped spec/build/review before an observation release; no audit weakening.

## Risks

| Risk | Mitigation |
| --- | --- |
| FCA baseline not merged / console surface owned elsewhere | record base and owner disposition before code; preserve original checkout |
| Ratification dialects are ambiguous | test real records; unsupported/conflicting evidence stays unknown |
| Companion amendment widens authority | dual contract review; fixed observer and human-gate boundaries |
| Reader helper changes other CLI consumers | inventory consumers, retain invariants, parity and negative tests |
| file links cannot open from browser | specify and verify a supported bounded document presentation mechanism in TO-P0/TO-P4; never count string output as navigation proof |
| Mixed responses look like one moment | generation guard plus freshness disclosure; no atomic snapshot claim |
| Browser or platform evidence unavailable | name gap and hold affected exit condition; no simulated completion |

## Authority and routing

D1–D8 and graph ratified. Standing Gate 2 and scoped publication granted; Gate 3
merges delegated by A1. The same delegation and worker preference persist across
all three goals via ../ops-console-roadmap-authority.md. No repeat merge approval.
TO-P0 supplies exact contract text for independent review before code; it cannot
add states, routes, writable files, or console authority outside ratified scope.
