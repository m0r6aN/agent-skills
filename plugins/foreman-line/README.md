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

For Pantheon only, actual EX11 in the [standing mandate](docs/standing-mandates/OM-PAN-001.md) governs all current obligations; other goals retain their gates. Keep $75 total/$65 bootstrap/$20.25 P00/$25 each P01–P05/B1–B3/$6/request; 29 inclusive bootstrap/120 goal claims. Retain both holds: older $5 counts once against total outside bootstrap/unit sums; $5.34 stays in bootstrap. Preserve mandatory unfinished claim/money floors, including $6 sole validation until a narrower exact profile is independently verified. Billed cost remains null until genuine reconciliation; allowances promise neither every recovery nor exact invoices.

B1 review revision3 is final: no revision4; B2/B3 retain0–2. Inherited timeRevision2 balances are P01 2111/P02 1786 seconds, each at most two remaining segments against the same2700-second/three-segment parent and original135-minute cap; actual ledgers govern later balances. Only two inherited independent source-check windows remain across B1, at most60 minutes each. Retain EX9 operational counters (three60-minute windows per purpose plus actual attempt/source-revision/proposal identity), original12-model-call/eight-session limits (four sessions consumed), two semantic attempts per seat/subject, one paid request globally, one worker per host/two globally, existing accounts/hosts/access and expiry2026-11-02T13:38:02.935Z. No label/head/chat resets counters; failures count.

Pin each segment's original identity, head/spec/allowlist, host/profile/tools/network, immutable start/deadline; exact Step0 matching proceeds automatically. Charge ceil dispatch-through-pinned-effect-free-freeze/explicit-release time, including setup/waiting/checks/reporting. No pause/backdate; missing/disputed/late freeze spends the allocation and holds. Further dispatch requires verified release, checker release, a concrete same-scope correction and remaining balance. Each segment counts; full timeout+cleanup must fit before preparation and launch. Initial windows stay closed; builders cannot amend committed specs or perform forbidden effects listed in the mandate.

Correction requires two conclusive predecessor results including substantive changes_required, or one such material-source result plus qualified independent checker retirement of the never-started stale other seat. The mandate's complete history/subject/heads/result/disposition/identity/successor pins, create-only record and permanently fenced attempt ID under exclusive admission, and pre-effect recheck are mandatory. No coordinator self-retirement, started/unknown retirement, fake pass/claim/refund or new successor. Every changed final subject needs two fresh independent substantive passing whole-unit reviews on identical complete source; changes invalidate both. Tests/retirement grant no admission. All45 B1 files, current specs and complete operative EX11 must fit1MiB; preserve exact lossless fixtures and exclude prior reviewer narrative/triage from fresh context while retaining local evidence. Preserve EX7/EX8 history, separate cycle11 acceptance and closed old P00 cycles; no plan/qualification rerun. Human-required policies, Runtime admission, protected merge, supported package loading and permanent native cutover retain their separate gates.

The pure [Pantheon boundary contracts](dispatch/src/pantheon-runtime/contracts/README.md) carry structural data only; tests do not establish Runtime admission.

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
