# The Foreman Line

Foreman Line is an installable, contract-first coordination plugin for carrying a
development goal through shaping, parcel dispatch, external verification,
integration, and closure.

This `0.2.1` release is an **alpha**. Its pipeline packages are implemented and
tested, while some integrations remain profile-specific. Receipt chains are
structurally validated; cryptographic recomputation and signature verification
remain future Parcel Compiler work. Stage F validates supplied merge metadata
but does not yet authenticate that metadata against the source-control host.

Full design and rationale: [docs/FOREMAN-LINE-PLAN.md](docs/FOREMAN-LINE-PLAN.md). Coordinator role charter (Stage Zero ideation, human gates, dispatch table, long-running loop): [docs/COORDINATOR-PATTERN.md](docs/COORDINATOR-PATTERN.md).

## Authority gates

For Pantheon under a verified, active OM-PAN-001 grant, apply `docs/standing-mandates/OM-PAN-001.md`; this exception does not apply to other goals or create Runtime authority. Initial ratification and material authority changes remain owner decisions. Routine shaping, dispatch and eligible merge proceed automatically under the standing grant after evidence and repository checks. The general defaults below apply outside that scope.

Pantheon's actual EX4–EX10 amendments and R7 rules, EX7/EX8 P00 acceptance history and B1/B2/B3 review units are recorded in the [standing mandate](docs/standing-mandates/OM-PAN-001.md). Actual EX10 replaces only EX9's uninterrupted rework clock: each original P01–P05 builder retains 2700 total dispatched seconds per existing rework revision, split into at most three segments with immutable absolute deadlines. All elapsed dispatched time counts through verified effect-free freeze and explicit slot release; no pause or counter reset is allowed. Resume requires a same-scope finding, checker release and remaining ledger balance; each failed segment counts and a full job timeout plus cleanup must fit. Unproven freeze/release charges the full allocation and holds on overrun. Initial windows stay closed. The two-revision/135-minute, source/operational-check, model-call, native-session, paid-attempt, spending and access limits remain unchanged; no P00 repair or plan/qualification rerun is granted. Permanent native cutover remains required. The pure [Pantheon boundary contracts](dispatch/src/pantheon-runtime/contracts/README.md) carry structural data only. Their parser tests do not establish Runtime admission; source acceptance, supported package loading and exact loaded digests remain required.

1. Goal-charter ratification.
2. Parcel dispatch.
3. Merge, unless a distinct agent identity is explicitly authorized by the
   target repository's effective branch rules and that authorization is
   verified at merge time. Missing or ambiguous authority fails closed to a
   human-owned merge.

## Pipeline stages

| Stage | What happens | Package(s) |
|---|---|---|
| A — Intake & Shaping | Idea → parcel spec(s) under `docs/specs/active/` | `shaping/`, `spec-linter/`, `schema-scaffold/` |
| B — Registration | Spec → Jira Epic/Story/Task tree, bidirectionally linked | `registration/`, `projection/` |
| C — Dispatch & Build | Candidate proposal, Step 0 restatement, model routing, skill injection | `dispatch/`, `routing-policy/`, `skill-injection/`, `permission-profiles/` |
| D — Verification | Deterministic harness + adversarial review, no self-graded work | `verification/` |
| E — Integration | PR, DocSpine validation, risk-driven audit triggers | `integration/` |
| F — Closure | Merge, ticket close, receipt chain sealed, lesson distillation | `receipts/`, `approval/` |

`contracts/` defines the shared stage-envelope schemas and types every package above builds on.

## Layout

- `docs/` — plan, coordinator charter, conventions, kickstarters (dispatch prompts), specs (`active/` = live contracts, `done/` = shipped), transcripts and lessons ledger.
- `skills/` — loadable `goal`, `foreman-shaping`, and
  `parcel-driven-development` skills.
- Each pipeline package is an independent TypeScript workspace (own `package.json`, `tsconfig.json`, `biome.json`, `tests/`) — not a shared monorepo build.

## Installation

The plugin contains separate manifests for Claude Code
(`.claude-plugin/plugin.json`) and Codex (`.codex-plugin/plugin.json`). Install
it through a marketplace that points at this directory, then start a fresh
session so the host discovers the plugin-local skills.

The `parcel-compiler` package is currently a separately distributed scaffold;
its advertised command surface is not yet a functional CLI.

## Working in a package

```bash
cd <package>
npm install
npm test        # tsx --test tests/*.test.ts
npm run typecheck
npm run lint     # biome check .
```

## Conventions

Spec format and lifecycle: `docs/SPEC-CONVENTION.md`. Dispatch prompts live in
`docs/kickstarters/`; standing constraints referenced by every builder/reviewer
kickstarter are in `docs/kickstarters/STANDING-CONSTRAINTS.md`. Lessons earned
during builds are logged in `docs/transcripts/defects_lessons.md`, each with a
disposition routing its rule into the artifact that governs the agent it
concerns.
