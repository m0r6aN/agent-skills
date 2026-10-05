# Loop directive / state record — plugin-packaging-and-scaffolder

**State:** `p1_p7_reconciled_p5_p6_delivered_p7_trial_recorded`
**Updated:** 2026-09-26 (coordinator decision 2026-09-26 under owner blanket authority)
**Charter:** `charter.md` (ratified 2026-07-29, D9a re-ratified) · **Authority:** charter §8
(Gate 2 standing for P1–P7; Gate 3 not delegated — human merge, D12).

Resume state is this file plus `docs/goals/INDEX.md` (D7). The per-item queue
after the 2026-09-26 reconciliation (`p1-p7-reconciliation-2026-09-26.md`):

| Item | Status | Evidence / residual |
|---|---|---|
| P1 — manifest + skill relocation | **DELIVERED** | `.claude-plugin/plugin.json` + marketplace `foreman-line` entry + plugin-local `skills/{goal,foreman-shaping,parcel-driven-development}`; residual human step: delete `~/.claude/skills/parcel-driven-development/` after local plugin install |
| P2 — spec-location split | **DELIVERED** | SPEC-CONVENTION §4.8 `Allowed Files` (D11); PDD copy on `docs/specs/`, zero `docs/parcels` hits; `keon-skills` third copy recorded as known external divergence (in the reconciliation) |
| P3 — de-dogfood canon into `templates/` | **DELIVERED** | shipped starter set + 2026-09-26 completion inside the 6 coordinator-assigned files (listed in the reconciliation); anything else under `templates/` **DEFERRED — Window P hold** |
| P4 — profile seam | **REMAINING** | `involves:` delivered (spec-linter + foreman-config, D14 intact); remaining: `integration.jira`→`ticketing` rename (`skill-injection/`), routing-policy `models:` block (`routing-policy/`, sequenced), dispatch queue identity per Ruling 1 (`dispatch/`), Layer-3 presets (`templates/profiles/`, Window P) |
| P5 — `project-scaffold` package | **DONE-THIS-RUN** | `project-scaffold/` (typed CLI, gap detection, byte-exact copy + enumerated substitution, managed-block splice, atomic writes + collision handling, credential refusal, D9a pre-check, PCC-P0 exit codes) + full §6 test suite (38 tests) |
| P6 — `/goal` preflight wiring | **DONE-THIS-RUN (generator seam)** + **REMAINING (skill call site)** | `project-scaffold plan` = dry-run default presenting the plan; `apply` reports created/skipped/updated. Residual: invocation step in `skills/goal/SKILL.md` (verified absent; outside this run's assigned files) |
| P7 — clean-room trial | **DONE-THIS-RUN (checkable parts)** | `p7-clean-room-trial-2026-09-26.md`: §7 criteria 2/3/4/5 + §6 item 9 + D12 no-remote precondition proven with exact commands; residual gaps (never faked): §7 criterion 1 fresh-session plugin load, §7 criterion 6 live `/goal` dry-run preflight |

## Acceptance evidence (test names, `project-scaffold/` suite, 38/38 green)

- Non-destruction (§6.1): "non-destruction: sentinel targets survive
  byte-identical and are reported skipped (managed block is the documented
  exception)"
- Idempotency (§6.2): "idempotency: a second run writes zero bytes and exits
  clean"
- Managed block, six cases (§6.3): the six `managed block: …` tests in
  `tests/managed-block.test.ts` (append, replace, begin-only, end-only,
  reversed, nested) + CRLF sides, missing trailing newline, mid-file block
- Placeholder integrity (§6.4): "a typo'd placeholder in a template fails the
  run and writes nothing"
- Fixture projects (§6.5): "an empty target receives the complete §4.5
  artifact set", "fixture project: hand-curated CLAUDE.md and partial canon
  survive; only gaps are filled"
- Generated output passes the wired linter (§6.6): "generated canon passes the
  spec-linter the scaffold wired up"
- Clean-room grep (§6.7): "clean-room grep: generated output has zero hits for
  the enumerated pattern list"
- Zero-resolution no-op, linter half (§6.8): "involves: [ticketing] against an
  empty capability map passes with no blocking output (D14)"
- Equivalent-layout refusal (§6.9): "an F9-shaped repo carrying docs/PARCELS/
  is refused, and docs/specs/ is not created" (+ lowercase variant,
  non-spec frontmatter negative case, canonical-tree no-conflict case)
- Collision/negative: "a target path that exists as a directory is a typed
  PATH_TYPE_CONFLICT and nothing is written", "a file colliding at apply time
  is skipped, not overwritten", "a directory standing where a file belongs is
  refused at apply time", "atomic writes leave no temp files behind"
- CLI contract: usage errors (2), per-field charset refusals (1) incl.
  quote/backslash/newline/tab independently, credential refusal (3) with no
  credential in logs/artifacts, injection-shaped names refused

## Next action

Coordinator: (1) land the six owned `templates/` files with Window P
sequencing; (2) shape P4's three remaining parcels; (3) shape P6's
`skills/goal/SKILL.md` call-site; (4) run P7 criteria 1+6 in a fresh session
with the plugin installed. Gate 3 remains human (D12).
