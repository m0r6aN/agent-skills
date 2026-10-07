# foreman-config

The `foreman/config.yaml` declaration contract (P1a, any-repo-runnability
charter §4.1): JSON Schema, TypeScript types, document validator, CLI, and
the `involves:` → `capabilities:` resolution helper.

A repo becomes Line-runnable by declaring exactly four things the Line
cannot reasonably infer — all four groups required, all closed
(`additionalProperties: false`; a new key needs a spec amendment):

- **`identity:`** — `project_key`, `base_branch`, `branch_prefix`,
  `worktree_root`, `dispatch_queue`. All five KEYS required; `project_key`
  and `dispatch_queue` accept an explicit `null` (a repo with no tracker
  declares that, rather than omitting the key — declaring nothing is an
  explicit act). Queue-identity semantics are P1b's.
- **`stack:`** — `profile` (`vite-react-ts-tailwind` default,
  `nextjs-app-router`, or `none`), `layout` (five root arrays), and
  `surfaces_present`. `profile != none` requires both `layout` and
  `surfaces_present` (`[]` legal but must be written — D28a); `profile:
  none` prohibits both (a self-contradiction is refused, not ignored).
  Unknown profile values are invalid (D28b, document half). Detector
  consumption is P4's; scaffold/dispatch enforcement is P6's.
- **`capabilities:`** — capability-area name → `SkillName[]`. Empty map
  legal; a present key's EMPTY array is also legal (coordinator ruling):
  `telemetry: []` means "telemetry is a known capability area here, and no
  local skill serves it yet" — declaring a key extends the SPEC-CONVENTION
  §4.8 `involves:` vocabulary independently of providing skills, and zero
  resolution is already a normal, announced-once outcome (D14). Entries
  that are present must be non-blank strings.
- **`policy:`** — `audit.require_security_audit_at`, enum-constrained to
  `low | standard | elevated | critical`. Semantics are P6's.

## Boundary discipline (D19 / D14)

- The config path arrives as an **explicit argument** everywhere — no
  `process.cwd()`, no `__dirname` walking, no default location.
- This is a **document** validator: it never stats the filesystem for
  declared layout paths (P4's D28b semantics).
- `resolveInvolves` is pure — never writes, never throws; degradation goes
  through an injected reporter, announced exactly once. `involves:` is
  optional, advisory, and never a gate (locked D14).
- No live `foreman/config.yaml` lands in this repo; `tests/fixtures/` are
  the canonical instances (P6 lands the live one).

## CLI

`foreman-config validate <path>` — exit `0` valid, `1` validation failure
(every violation on stderr), `2` usage error (missing/unreadable path,
unknown command, unparsable YAML including duplicate keys).

## Verification

PowerShell only on Windows (Node >= 24.11.1): `npm install`, then
`npx tsc --noEmit`, `npx tsx --test tests/*.test.ts`, `npx biome check .`.
`npm run generate` regenerates `schemas/*.json`; `tests/parity.test.ts`
proves the committed files never drift from the typed sources in
`src/schemas.ts`. Runtime dependencies are exactly `{ajv, yaml}`,
machine-enforced by `tests/dependency-allowlist.test.ts` via the shared
`schema-scaffold` registrar.
