# @foreman-line/project-scaffold

The Foreman Line's project scaffolder (goal charter `plugin-packaging-and-scaffolder`,
parcels P5/P6): a deterministic, byte-exact generator that bootstraps the Line's canon
into a target project as a `/goal` preflight — gap-driven, never destructive.

## CLI

```
project-scaffold [plan|apply]
  --project-name <name>        display name (letters, digits, space, . _ -)
  --slug <slug>                project slug (token charset)
  --base-branch <branch>       e.g. main
  --branch-prefix <prefix>     e.g. work/
  --worktree-root <path>       relative dir, e.g. .worktrees
  --target <dir>               target project root (REQUIRED absolute — relative refused)
  --templates <dir>            template source root (REQUIRED absolute — relative refused)
  [--preset <name>]            named profile preset (templates/profiles/<name>.yaml)
  [--project-key <key>]        optional project key (token charset)
  [--dispatch-queue <id>]      optional dispatch queue identity (account-id or address shape)
```

`plan` is the default and the preflight mode: it prints the action per path and
writes nothing. `apply` executes the same plan and reports every path as
`create` / `skip-existing` / `block-append` / `block-replace` / `block-unchanged`.

## Contract

- **Explicit roots (D1 / P2b-i).** `--target` and `--templates` are
  absolute-or-refused inputs: a relative root would silently anchor every
  derived path to the process working directory and is refused (`USAGE`,
  exit 2, typed `ScaffoldError`) before anything is planned. There is no
  default templates path derived from module location — both roots are
  caller-supplied.
- **Typed arguments only.** Every argument is a closed field with its own
  default-deny character allowlist; user values are never interpolated into
  executable JavaScript anywhere in this package — they flow only into
  enumerated template placeholders (`{{PROJECT_NAME}}`, `{{SLUG}}`,
  `{{BASE_BRANCH}}`, `{{BRANCH_PREFIX}}`, `{{WORKTREE_ROOT}}`,
  `{{PROJECT_KEY}}`, `{{DISPATCH_QUEUE}}`). Any unreplaced `{{...}}` surviving
  into output fails the run (GitHub Actions `${{ }}` expressions are exempt via
  the `$` sigil).
- **Credentials never reach logs, keys, or artifacts.** Credential-shaped input
  is refused at the boundary (`CREDENTIAL_INPUT_REFUSED`, exit 3), and every
  error/report line passes through a redactor.
- **Non-destruction.** The generator never modifies a file it did not create —
  the sole exception is the managed block region of `AGENTS.md`
  (`<!-- foreman-line:begin … -->` … `<!-- foreman-line:end -->`). Existing
  files are reported `skip-existing`; malformed markers refuse with
  `MANAGED_BLOCK_MALFORMED` and zero writes.
- **Equivalent-layout pre-check (D9a).** A repo carrying `docs/PARCELS/` /
  `docs/parcels/`, or spec markdown with SPEC-CONVENTION-shaped frontmatter
  outside `docs/specs/`, refuses with `EQUIVALENT_LAYOUT_CONFLICT` naming both
  paths before anything is written.
- **Atomic writes.** Every file lands via same-directory temp file + rename;
  a create whose target appears between plan and apply is downgraded to
  `skip-existing`, never overwritten.
- **Existing parsers, one contract dialect.** YAML/config parsing and
  validation reuse `foreman-config` (generated `foreman/config.yaml` must
  satisfy it) and `spec-linter`'s `parseFrontmatter` (parcel detection); the
  sole runtime npm dependency is `yaml` (preset documents). Exit codes reuse
  the PCC-P0 contract: `0` success, `1` validation failure, `2` usage error,
  `3` trust-invariant violation, `4` environment error.

## Scripts

- `npm test` — `tsx --test tests/*.test.ts` (charter §6 verification items 1–7, 9)
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — `biome check .`
