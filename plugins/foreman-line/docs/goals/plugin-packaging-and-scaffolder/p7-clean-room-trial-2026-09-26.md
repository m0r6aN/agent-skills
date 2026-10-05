# P7 clean-room scaffold trial — 2026-09-26

**Charter:** `charter.md` §7 (exit criterion) + §5 P7 clean-room shape (coordinator ruling).
**Ran:** 2026-09-26, this environment (Windows 10.0.26200, Git Bash, Node v24.7.0, tsx 4.23.15).
**Gate receipt:** coordinator decision 2026-09-26 under owner blanket authority.

Every checkable part was run with the exact commands below. Two steps need a
capability this environment lacks (a Claude Code session able to invoke the
`/goal` skill against an installed plugin); they are recorded as residual gaps
with empty boxes — never as checkmarks.

## Fixtures (per the clean-room shape ruling)

- **Clean repo:** ephemeral OS-temp `mkdtemp`, `git init` + one commit + named
  default branch `main`, **no remote**. Retained on failure, deleted on
  success — this run had failures-to-record = none, but the fixture is
  retained for coordinator re-inspection at
  `C:\Users\clint\AppData\Local\Temp\foreman-cleanroom-mA87Yh` and is
  disposable.
- **F9-shaped repo:** second ephemeral fixture carrying `docs/PARCELS/` with a
  spec-shaped spec, required by charter §6 verification item 9.

```
$ ROOT=$(mktemp -d -t foreman-cleanroom-XXXXXX) && cd "$ROOT" && git init -b main -q . \
  && git config user.email trial@foreman-line.invalid && git config user.name "Foreman Line P7 Trial" \
  && node -e "require('fs').writeFileSync('README.md','# clean room fixture\n')" \
  && git add README.md && git commit -q -m "clean room baseline"
CLEANROOM_ROOT=C:\Users\clint\AppData\Local\Temp\foreman-cleanroom-mA87Yh
branch: main
remotes: []
489ac5f clean room baseline
```

## Criterion 5 — every §4.5 artifact is present

```
$ node node_modules/tsx/dist/cli.mjs src/cli.ts apply \
    --project-name "Example Project" --slug example-project --base-branch main \
    --branch-prefix "work/" --worktree-root .worktrees --target "$ROOT"
create  AGENTS.md
create  CLAUDE.md
create  foreman/config.yaml
create  foreman/routing-policy.yaml
create  foreman/skill-injection.yaml
create  docs/specs/INDEX.md
create  docs/transcripts/defects_lessons.md
create  docs/kickstarters/STANDING-CONSTRAINTS.md
create  docs/kickstarters/shaping-template.md
create  docs/kickstarters/builder-template.md
create  docs/kickstarters/reviewer-template.md
create  docs/kickstarters/VENDORED-CANON.md
create  docs/goals/INDEX.md
create  .github/workflows/spec-lint.yml
applied: 14 path(s), 7 director(ies) created
exit=0
```

`find` over the fixture (excluding `.git`) lists all 14 files above plus the
fixture's own baseline `README.md`. Every artifact in charter §4.5 is present
(`AGENTS.md`, `CLAUDE.md`, `foreman/config.yaml`, `foreman/routing-policy.yaml`,
`foreman/skill-injection.yaml`, `docs/specs/INDEX.md` + `active/` + `done/`,
`docs/goals/INDEX.md`, `docs/transcripts/defects_lessons.md`,
`docs/kickstarters/STANDING-CONSTRAINTS.md`, the three kickstarter templates,
`.github/workflows/spec-lint.yml`). `docs/kickstarters/VENDORED-CANON.md` is a
deliberate additive artifact beyond §4.5: the shipped template's own contract
says "It ships empty at scaffold time" (see reconciliation, P3 row).
**Proves:** the gap-driven generator emits the complete chartered artifact set
into an empty, Foreman/Kaseya-free repo.

## Criterion 2 — generated canon passes the spec-linter the scaffold itself wired

Minimal fixture spec (D11 shape: `surfaces:` plus `## Allowed Files`, plus
`involves: [ticketing]`) written to `docs/specs/active/fixture-spec.md`, then
the emitted workflow's exact per-file invocation shape (`validate --config
foreman/config.yaml --repo-root <abs> <file>` over `docs/specs/active` and
`docs/specs/done`):

```
$ for f in $(find "$ROOT/docs/specs/active" "$ROOT/docs/specs/done" -name '*.md' | sort); do
    node node_modules/tsx/dist/cli.mjs ../spec-linter/src/cli.ts validate \
      --config "$ROOT/foreman/config.yaml" --repo-root "$ROOT" "$f"; echo "linter-exit=$? file=$f"
  done
linter-exit=0 file=.../docs/specs/active/fixture-spec.md
```

**Proves:** (a) the generated `foreman/config.yaml` passes the existing
foreman-config contract (the linter loads and validates it via `--config`), (b)
a D11-shaped spec in the scaffolded tree lints clean through the very linter
the scaffold wired into `.github/workflows/spec-lint.yml`, (c) verification
item 8's linter half: `involves: [ticketing]` against an empty `capabilities:`
map is a no-op (exit 0, no blocking output) — D14 optionality holds at the
linter. The "dispatch proceeds" half of item 8 cannot run here (dispatch
machinery is a forbidden surface this run) — recorded as a gap, not checked.

## Criterion 3 — a second scaffold run writes zero bytes and exits 0

```
$ BEFORE=$(find "$ROOT" -type f -not -path '*/.git/*' | sort | xargs sha256sum | sha256sum)
$ node .../cli.ts apply ... --target "$ROOT"     # same typed arguments
block-unchanged AGENTS.md
skip-existing   CLAUDE.md
skip-existing   foreman/config.yaml
... (all 13 remaining paths skip-existing) ...
applied: 14 path(s), 0 director(ies) created
$ AFTER=$(find "$ROOT" -type f -not -path '*/.git/*' | sort | xargs sha256sum | sha256sum)
hash-before=71d4d0c505cf48dd5cb8b0d4aca5837b39c7ae67347356fbe7d27ce29e3d49fb
hash-after=71d4d0c505cf48dd5cb8b0d4aca5837b39c7ae67347356fbe7d27ce29e3d49fb
```

Identical whole-tree content hash; exit 0. **Proves:** idempotency at byte
level, and that the managed-block splice reports `block-unchanged` (zero-byte
write) when the region is already correct.

## Criterion 4 — clean-room grep, zero hits for the enumerated list

```
$ grep -riE 'KONE|kaseya|clinton\.morgan|atlassian\.net|plugins/foreman-line/|skills/goal/|skills/foreman-shaping/|docs/foreman-line/' "$ROOT" --exclude-dir=.git -l
grep-hits-files exit=1 (1 = zero hits)
```

Case-insensitive over all generated output (superset of the enumerated
case). **Proves:** D8/D10 de-dogfooding of the generated canon — the only test
in the charter that actually enforces it (§6 item 7) also runs as a regression
test (`cleanroom.test.ts`, "clean-room grep: generated output has zero hits for
the enumerated pattern list").

## §6 item 9 / D9a — F9-shaped repo is refused with zero writes

```
$ F9=$(mktemp -d -t foreman-f9-XXXXXX) && mkdir -p "$F9/docs/PARCELS" && <write spec-shaped old.md>
$ node .../cli.ts plan ... --target "$F9"
error: [EQUIVALENT_LAYOUT_CONFLICT] equivalent layout conflict: 'docs/PARCELS' serves the role of the canonical spec location 'docs/specs'; reconcile the two conventions before scaffolding
  path: docs/PARCELS
  path: docs/specs
f9-exit=1
$ find "$F9" -type f
.../docs/PARCELS/old.md        (the pre-existing fixture, and nothing else)
```

**Proves:** the equivalent-layout pre-check names both paths, refuses before
gap detection, writes zero bytes, and does not create `docs/specs/`.

## D12 fail-closed precondition (no-remote case)

```
$ git -C "$ROOT" remote
(empt
y)
```

**Asserted outcome:** the clean room has no remote, so D12's ruleset query
cannot succeed; per D12 as amended (plan-review Ruling 2) an unavailable
ruleset query fails **closed to human-owned merge** — the delegation condition
evaluates false. What this trial exercises is the precondition (no remote ⇒
query impossible); the condition's evaluation lives in the Line's
dispatch/integration machinery, which charter §1 scopes out of this goal, so
no ruleset query was executed here and none is claimed.

## Residual gaps (environment lacks the capability — not checked)

- [ ] **§7 criterion 1 — "`/goal` is invokable from the installed plugin."**
  Disk-verifiable half is proven: `.claude-plugin/plugin.json` parses and
  carries the ratified field set; `.claude-plugin/marketplace.json` carries the
  `foreman-line` entry (`source: ./plugins/foreman-line`); the plugin tree
  carries `skills/goal/`, `skills/foreman-shaping/`,
  `skills/parcel-driven-development/`; repo-root `skills/` no longer carries
  those three directories. The load check itself is a fresh-session human
  check (skill discovery happens at session start — the P1 verifiability
  split), and this environment has no Claude Code session that can install the
  plugin and load `/goal`.
- [ ] **§7 criterion 6 — "`/goal` completes its dry-run preflight in the
  scaffolded repo" against a minimal fixture spec.** The `/goal` skill cannot
  be invoked in this environment (no Claude Code host; the skill's call-site
  wiring is also not yet written — see reconciliation P6). What IS proven is
  the generator-side half of the preflight: `project-scaffold plan` is the
  dry-run default, presents the plan, writes nothing, and `apply` lands it
  (regression tests `cli.test.ts` "plan is the default mode and writes
  nothing", `generator.test.ts` "planning writes nothing"). The end-to-end
  `/goal`-driven trial remains to be run in a clean worktree with the plugin
  installed, by whoever performs the P1 fresh-session check.

## Cleanup state

Fixtures retained (this record is the evidence; a destroyed fixture is
unusable evidence per the clean-room ruling). Re-running the trial mints fresh
children — never re-scaffold these directories.
