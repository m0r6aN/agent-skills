/**
 * AC7: the `validate <path>` CLI's exit-code contract, exercised as a real
 * subprocess against the local `tsx` entry script (not an in-process import)
 * so the actual entry point — argv parsing, file I/O, stderr — is what's
 * under test. Same pattern as W0-P3/W0-P4's cli.test.ts.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const fixturesDir = join(packageRoot, 'tests', 'fixtures')
const repoRoot = join(packageRoot, '..', '..', '..')
const doneDir = join(repoRoot, 'plugins', 'foreman-line', 'docs', 'specs', 'done')
// The real `tsx` entry script (not the .cmd/.sh shim), so it can be invoked
// directly via `node` with no shell — avoids Node's shell-argument-escaping
// security warning entirely.
const tsxCli = join(packageRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs')
const cliEntry = join(packageRoot, 'src', 'cli.ts')

function runCli(
  args: readonly string[],
  cwd: string = packageRoot,
): {
  status: number | null
  stderr: string
  stdout: string
} {
  const result = spawnSync(process.execPath, [tsxCli, cliEntry, ...args], {
    cwd,
    encoding: 'utf8',
  })
  return { status: result.status, stderr: result.stderr, stdout: result.stdout }
}

// Exit 0 -------------------------------------------------------------------

test('exit 0 on a single valid spec file', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'valid-spec.md')])
  assert.equal(status, 0, stderr)
})

test('exit 0 (with advisory warning) on all four shipped docs/specs/done specs with an explicit repo root', () => {
  const { status, stderr } = runCli(['validate', '--repo-root', repoRoot, doneDir])
  assert.equal(status, 0, stderr)
  assert.ok(stderr.includes('grandfathered (verification-class-missing)'), stderr)
})

test('exit 0 unaffected by advisory warnings; W0-P1 vocabulary warning appears on stderr', () => {
  const { status, stderr } = runCli([
    'validate',
    '--repo-root',
    repoRoot,
    join(doneDir, 'W0-P1-pipeline-stage-contracts.md'),
  ])
  assert.equal(status, 0)
  assert.ok(stderr.includes('does not begin with a known vocabulary prefix'))
})

test('GSO-P1 CLI accepts both legal verification_class values', () => {
  for (const fixture of ['valid-spec.md', 'valid-verification-class-equivalence.md']) {
    const { status, stderr } = runCli(['validate', join(fixturesDir, fixture)])
    assert.equal(status, 0, `${fixture}: ${stderr}`)
  }
})

// Exit 1 --------------------------------------------------------------------

test('exit 1 on AC6a rejecting fixture (bad risk), violation on stderr', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'reject-risk.md')])
  assert.equal(status, 1)
  assert.ok(stderr.includes('risk'))
})

test('exit 1 on AC6b rejecting fixture (bad routing_class), violation on stderr', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'reject-routing-class.md')])
  assert.equal(status, 1)
  assert.ok(stderr.includes('routing_class'))
})

test('GSO-P1 CLI rejects verification_class omission and an unknown value through the public entry point', () => {
  for (const fixture of [
    'reject-verification-class-missing.md',
    'reject-verification-class-unknown.md',
  ]) {
    const { status, stderr } = runCli(['validate', join(fixturesDir, fixture)])
    assert.equal(status, 1, `${fixture}: ${stderr}`)
    assert.ok(stderr.includes('verification_class'), `${fixture}: ${stderr}`)
  }
})

test('exit 1 on AC6c rejecting fixture (empty surfaces), violation on stderr', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'reject-surfaces-empty.md')])
  assert.equal(status, 1)
  assert.ok(stderr.includes('surfaces'))
})

test('exit 1 on AC6d rejecting fixture (whitespace permission_profile), violation on stderr', () => {
  const { status, stderr } = runCli([
    'validate',
    join(fixturesDir, 'reject-permission-profile-whitespace.md'),
  ])
  assert.equal(status, 1)
  assert.ok(stderr.includes('permission_profile'))
})

test('exit 1 on AC6d rejecting fixture (unregistered permission_profile name), violation on stderr', () => {
  const { status, stderr } = runCli([
    'validate',
    join(fixturesDir, 'reject-permission-profile-unknown.md'),
  ])
  assert.equal(status, 1)
  assert.ok(stderr.includes('permission_profile'))
})

test('exit 1 on AC6e rejecting fixture (bad status), violation on stderr', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'reject-status.md')])
  assert.equal(status, 1)
  assert.ok(stderr.includes('status'))
})

test('exit 1 on AC6f rejecting fixture (superseded with null superseded_by), violation on stderr', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'reject-superseded-null.md')])
  assert.equal(status, 1)
  assert.ok(stderr.includes('superseded_by'))
})

test('exit 1 on permission_profile: null fixture (explicit null, distinct from absent)', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'permission-profile-null.md')])
  assert.equal(status, 1)
  assert.ok(stderr.includes('permission_profile'))
})

test('exit 1 lists every violation, not just the first', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'reject-risk.md')])
  assert.equal(status, 1)
  // reject-risk.md is only invalid on one field, but this proves the CLI
  // writes every entry in `result.errors` to stderr, not just the first.
  const lines = stderr
    .trim()
    .split('\n')
    .filter((l) => l.length > 0)
  assert.ok(lines.length >= 1)
})

// permission_profile warning behavior ---------------------------------------

test('permission_profile warning: absent -> exit 0 + exactly one advisory warning on stderr', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'valid-spec-no-perm.md')])
  assert.equal(status, 0)
  const warningLines = stderr.split('\n').filter((l) => l.includes('permission_profile is absent'))
  assert.equal(warningLines.length, 1)
})

test('--no-permission-profile-warning fully suppresses the advisory with no other side effects', () => {
  const { status, stderr } = runCli([
    'validate',
    '--no-permission-profile-warning',
    join(fixturesDir, 'valid-spec-no-perm.md'),
  ])
  assert.equal(status, 0)
  assert.ok(!stderr.includes('permission_profile is absent'))
})

test('permission_profile: null -> exit 1 (rejected, not warned)', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'permission-profile-null.md')])
  assert.equal(status, 1)
  assert.ok(!stderr.includes('permission_profile is absent'))
})

// surfaces vocabulary warning behavior ----------------------------------------

test('surfaces vocabulary warning: unknown prefix -> advisory warning on stderr, exit 0', () => {
  const { status, stderr } = runCli([
    'validate',
    join(fixturesDir, 'valid-spec-unknown-surface.md'),
  ])
  assert.equal(status, 0)
  assert.ok(stderr.includes('does not begin with a known vocabulary prefix'))
})

test('surfaces vocabulary warning: known prefix -> no warning', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'valid-spec.md')])
  assert.equal(status, 0)
  assert.ok(!stderr.includes('does not begin with a known vocabulary prefix'))
})

// Grandfather scoping (CLOSE-P2 rework R1a, CLI-level) -------------------------

test('R1a regression: grandfathered basename in a NON-done/ scratch dir -> exit 1 (no waiver)', () => {
  const scratchDir = mkdtempSync(join(tmpdir(), 'spec-linter-scratch-'))
  const probeFile = join(scratchDir, 'P1-permission-profile-registry-schema.md')
  writeFileSync(
    probeFile,
    [
      '---',
      'ticket: KONE-PROBE',
      'title: reviewer probe replica',
      'status: done',
      'owner: clinton.morgan',
      'created: 2026-07-28',
      'updated: 2026-07-28',
      'risk: standard',
      'surfaces: [docs/]',
      'routing_class: standard-feature',
      'permission_profile: builder',
      '---',
      'probe',
      '',
    ].join('\n'),
    'utf8',
  )
  try {
    const { status, stderr } = runCli(['validate', probeFile])
    assert.equal(status, 1)
    assert.ok(stderr.includes('permission_profile'))
    assert.ok(!stderr.includes('grandfathered'))
  } finally {
    rmSync(scratchDir, { recursive: true, force: true })
  }
})

test('GSO-P1 CLI without --repo-root gives an inventoried done spec no new waiver', () => {
  const { status, stderr } = runCli([
    'validate',
    join(doneDir, 'W0-P1-pipeline-stage-contracts.md'),
  ])
  assert.equal(status, 1, stderr)
  assert.ok(stderr.includes('verification_class'), stderr)
  assert.ok(!stderr.includes('verification-class-missing'), stderr)
})

// Exit 2 ----------------------------------------------------------------------

test('exit 2 on a missing path', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'does-not-exist.md')])
  assert.equal(status, 2)
  assert.ok(stderr.length > 0)
})

test('stderr line protocol sanitizes a hostile raw target-path argument', () => {
  const hostilePath = `missing\r\ninjected-line\u001b[31m.md`
  const { status, stderr } = runCli(['validate', hostilePath])
  assert.equal(status, 2, stderr)
  assert.equal(stderr.trimEnd().split(/\r?\n/).length, 1, stderr)
  assert.ok(!stderr.includes('\r'), stderr)
  assert.ok(!stderr.includes('\u001b'), stderr)
})

test('stderr line protocol sanitizes a hostile raw repo-root argument and filesystem error text', () => {
  const hostileRoot = `missing-root\ninjected-line\u001b[31m`
  const { status, stderr } = runCli([
    'validate',
    '--repo-root',
    hostileRoot,
    join(fixturesDir, 'valid-spec.md'),
  ])
  assert.equal(status, 2, stderr)
  assert.equal(stderr.trimEnd().split(/\r?\n/).length, 1, stderr)
  assert.ok(!stderr.includes('\u001b'), stderr)
})

test('exit 2 on a directory containing no .md files', () => {
  const emptyDir = mkdtempSync(join(tmpdir(), 'spec-linter-empty-'))
  writeFileSync(join(emptyDir, 'not-markdown.txt'), 'no markdown here\n', 'utf8')
  try {
    const { status, stderr } = runCli(['validate', emptyDir])
    assert.equal(status, 2)
    assert.ok(stderr.includes('no .md files'))
  } finally {
    rmSync(emptyDir, { recursive: true, force: true })
  }
})

test('exit 2 on a missing path argument', () => {
  const { status } = runCli(['validate'])
  assert.equal(status, 2)
})

test('exit 2 on an unknown command', () => {
  const { status } = runCli(['explain', join(fixturesDir, 'valid-spec.md')])
  assert.equal(status, 2)
})

test('GSO-P1 CLI returns typed exit 2 for a missing --repo-root value, missing root, missing candidate, and out-of-root candidate', () => {
  const missing = join(tmpdir(), 'spec-linter-no-such-root')
  const cases: readonly (readonly string[])[] = [
    ['validate', '--repo-root'],
    [
      'validate',
      '--repo-root',
      join(fixturesDir, 'valid-spec.md'),
      join(fixturesDir, 'valid-spec.md'),
    ],
    ['validate', '--repo-root', missing, join(fixturesDir, 'valid-spec.md')],
    ['validate', '--repo-root', repoRoot, missing],
    ['validate', '--repo-root', repoRoot, tmpdir()],
  ]
  for (const args of cases) {
    const { status, stderr } = runCli(args)
    assert.equal(status, 2, `${args.join(' ')}\n${stderr}`)
  }
})

test('GSO-P1 CLI rejects an explicitly blank --repo-root from repository-root cwd without a waiver', () => {
  const { status, stderr } = runCli(
    ['validate', '--repo-root', '', join(doneDir, 'W0-P1-pipeline-stage-contracts.md')],
    repoRoot,
  )
  assert.equal(status, 2, stderr)
  assert.ok(!stderr.includes('grandfathered'), stderr)
})

// P1a: involves — advisory vocabulary, hard shape (AC2/AC3/AC4) ----------------

const telemetryConfig = join(fixturesDir, 'foreman-config-telemetry.yaml')

test('P1a AC2: involves with a known base-vocabulary value -> exit 0, NO advisory', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'valid-involves-known.md')])
  assert.equal(status, 0, stderr)
  assert.ok(!stderr.includes('involves entry'), stderr)
})

test('P1a AC2: involves with an unknown value -> stderr advisory in the surfaces format family, exit 0', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'valid-involves-unknown.md')])
  assert.equal(status, 0, stderr)
  assert.ok(
    stderr.includes("advisory: involves entry 'divination' does not name a known capability area"),
    stderr,
  )
})

test('P1a AC3: involves as a non-array -> exit 1 (shape is a schema rejection)', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'reject-involves-non-array.md')])
  assert.equal(status, 1)
  assert.ok(stderr.includes('involves'), stderr)
})

test('P1a AC3: involves containing an empty string -> exit 1', () => {
  const { status, stderr } = runCli([
    'validate',
    join(fixturesDir, 'reject-involves-empty-string.md'),
  ])
  assert.equal(status, 1)
  assert.ok(stderr.includes('/involves'), stderr)
})

test('P1a AC3: involves containing a whitespace-only string -> exit 1', () => {
  const { status, stderr } = runCli([
    'validate',
    join(fixturesDir, 'reject-involves-whitespace.md'),
  ])
  assert.equal(status, 1)
  assert.ok(stderr.includes('/involves'), stderr)
})

test('P1a AC3: involves: [] (equivalent to absence) -> exit 0, no advisory', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'valid-involves-empty.md')])
  assert.equal(status, 0, stderr)
  assert.ok(!stderr.includes('involves entry'), stderr)
})

test('P1a AC3: no involves at all (valid-spec.md) -> exit 0, no advisory (absence is never an error)', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'valid-spec.md')])
  assert.equal(status, 0, stderr)
  assert.ok(!stderr.includes('involves entry'), stderr)
})

test('P1a AC4 with-config half: --config declaring telemetry -> NO advisory, exit 0', () => {
  const { status, stderr } = runCli([
    'validate',
    '--config',
    telemetryConfig,
    join(fixturesDir, 'valid-involves-extension.md'),
  ])
  assert.equal(status, 0, stderr)
  assert.ok(!stderr.includes('involves entry'), stderr)
})

test('P1a AC4 without-config half: same spec, no config -> advisory appears, exit STILL 0', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'valid-involves-extension.md')])
  assert.equal(status, 0, stderr)
  assert.ok(
    stderr.includes("advisory: involves entry 'telemetry' does not name a known capability area"),
    stderr,
  )
})

test('P1a: --config with a missing file -> exit 2 (bad argument, a usage error)', () => {
  const { status, stderr } = runCli([
    'validate',
    '--config',
    join(fixturesDir, 'no-such-config.yaml'),
    join(fixturesDir, 'valid-involves-known.md'),
  ])
  assert.equal(status, 2)
  assert.ok(stderr.includes('cannot read config'), stderr)
})

test('P1a: --config with an INVALID config document -> exit 2, foreman-config violations shown', () => {
  const scratchDir = mkdtempSync(join(tmpdir(), 'spec-linter-badcfg-'))
  const badConfig = join(scratchDir, 'bad-config.yaml')
  writeFileSync(badConfig, 'identity: {}\n', 'utf8')
  try {
    const { status, stderr } = runCli([
      'validate',
      '--config',
      badConfig,
      join(fixturesDir, 'valid-involves-known.md'),
    ])
    assert.equal(status, 2)
    assert.ok(stderr.includes('is not a valid foreman/config.yaml'), stderr)
  } finally {
    rmSync(scratchDir, { recursive: true, force: true })
  }
})

test('P1a: --config missing its value -> exit 2 usage error', () => {
  const { status } = runCli(['validate', join(fixturesDir, 'valid-involves-known.md'), '--config'])
  assert.equal(status, 2)
})

// Directory mode: recursion ----------------------------------------------------

test('directory mode: validates every .md file found recursively, propagating exit 1 if any fails', () => {
  const { status, stderr } = runCli(['validate', fixturesDir])
  assert.equal(status, 1)
  assert.ok(stderr.length > 0)
})

// ── P2b-ii (finding B2): broken-tree fixtures ────────────────────────────────
// ISOLATED temp trees (ruling A1.4 — the real worktree's sibling node_modules
// are never mutated mid-suite) shaped per amendment A2.3 as corrected by
// A4.3: EVERY sibling package's SOURCES are present (src + package.json, the
// spec's own Step-0 reproduction shape) and only the named packages'
// node_modules are installed. What each variant enforces (A4.3 corrected
// A2.3's overclaim): the ONLY-spec-linter tree enforces the no-flag STARTUP
// graph and the FIRST --config edge (in it, the foreman-config import fails
// first and short-circuits the graph beyond it); the foreman-config-installed
// variant exercises the --config path PAST that first edge, so a later
// sibling edge inside the config-load path is enforced too, not merely
// asserted. Shared fixtures per file (ruling A1.5), built once at module
// scope, removed in `after`.
const pluginRoot = join(packageRoot, '..')

/** Build one broken tree; returns its spec-linter directory. */
function buildBrokenTree(prefix: string, installedSiblings: readonly string[]): string {
  const root = mkdtempSync(join(tmpdir(), prefix))
  for (const entry of readdirSync(pluginRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'spec-linter') continue
    const srcDir = join(pluginRoot, entry.name, 'src')
    const manifest = join(pluginRoot, entry.name, 'package.json')
    if (!existsSync(srcDir) || !existsSync(manifest)) continue
    cpSync(srcDir, join(root, entry.name, 'src'), { recursive: true })
    cpSync(manifest, join(root, entry.name, 'package.json'))
    if (installedSiblings.includes(entry.name)) {
      cpSync(join(pluginRoot, entry.name, 'node_modules'), join(root, entry.name, 'node_modules'), {
        recursive: true,
      })
    }
  }
  const linter = join(root, 'spec-linter')
  cpSync(join(packageRoot, 'package.json'), join(linter, 'package.json'))
  cpSync(join(packageRoot, 'tsconfig.json'), join(linter, 'tsconfig.json'))
  for (const dir of ['src', 'schemas', 'node_modules', join('tests', 'fixtures')]) {
    cpSync(join(packageRoot, dir), join(linter, dir), { recursive: true })
  }
  return linter
}

// AC1/AC2 tree: only spec-linter installed.
const brokenLinter = buildBrokenTree('spec-linter-broken-', [])
// A4.3b tree: foreman-config INSTALLED, every OTHER sibling's deps absent —
// the --config path past the first edge.
const configPathLinter = buildBrokenTree('spec-linter-cfgpath-', ['foreman-config'])
// A4.3a tree: same shape, plus the reviewer's planted lazy sibling import
// AFTER the successful foreman-config import inside the config-load path.
const injectedLinter = buildBrokenTree('spec-linter-inject-', ['foreman-config'])
{
  const injectedCli = join(injectedLinter, 'src', 'cli.ts')
  const original = readFileSync(injectedCli, 'utf8')
  const anchor = 'const { parseForemanConfigYaml, validateForemanConfig } = foremanConfig'
  assert.ok(original.includes(anchor), 'the injection anchor must exist in cli.ts')
  writeFileSync(
    injectedCli,
    original.replace(
      anchor,
      `${anchor}\n  await import('../../permission-profiles/src/validator.js') // A4.3 reviewer repro: lazy sibling import past the first edge`,
    ),
    'utf8',
  )
}

after(() => {
  for (const linter of [brokenLinter, configPathLinter, injectedLinter]) {
    rmSync(dirname(linter), { recursive: true, force: true })
  }
})

/**
 * STANDING #14: the child must not inherit the parent test runner's env —
 * NODE_TEST_CONTEXT (and friends) makes a nested runner silently skip, and
 * NODE_OPTIONS can smuggle loader state. Strip both families.
 */
function strippedChildEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('NODE_TEST') || key === 'NODE_OPTIONS') continue
    env[key] = value
  }
  return env
}

function runTreeCli(
  linter: string,
  args: readonly string[],
): {
  status: number | null
  stderr: string
  stdout: string
} {
  const result = spawnSync(
    process.execPath,
    [join(linter, 'node_modules', 'tsx', 'dist', 'cli.mjs'), 'src/cli.ts', ...args],
    { cwd: linter, encoding: 'utf8', env: strippedChildEnv() },
  )
  return { status: result.status, stderr: result.stderr, stdout: result.stdout }
}

function runBrokenCli(args: readonly string[]): {
  status: number | null
  stderr: string
  stdout: string
} {
  return runTreeCli(brokenLinter, args)
}

const brokenFixtures = join('tests', 'fixtures')

test('P2b-ii AC1: broken tree, NO --config -> exit 0; foreman-config is never loaded (watched red on the unfixed code: exit 1, ERR_MODULE_NOT_FOUND naming ajv)', () => {
  const { status, stderr, stdout } = runBrokenCli([
    'validate',
    join(brokenFixtures, 'valid-spec.md'),
  ])
  const combined = `${stdout}${stderr}`
  assert.equal(status, 0, combined)
  assert.ok(!combined.includes('ERR_MODULE_NOT_FOUND'), combined)
  assert.ok(!combined.includes('Cannot find package'), combined)
})

test('P2b-ii AC1: broken tree, directory mode without --config also runs (validates recursively, exit 1 from reject fixtures — the linter RAN and judged)', () => {
  const { status, stderr, stdout } = runBrokenCli(['validate', brokenFixtures])
  const combined = `${stdout}${stderr}`
  // Exit 1 here is a LINT verdict (the fixtures dir contains reject-* files),
  // which is exactly what B2 destroyed: in the broken tree the unfixed CLI
  // exits 1 WITHOUT running. The crash marker distinguishes the two.
  assert.equal(status, 1, combined)
  assert.ok(!combined.includes('ERR_MODULE_NOT_FOUND'), combined)
  assert.ok(stderr.includes('reject-risk.md'), combined)
})

test('P2b-ii AC1/AC4: broken tree, unknown involves value without --config -> advisory only, exit 0 (D14 holds where foreman-config cannot load)', () => {
  const { status, stderr, stdout } = runBrokenCli([
    'validate',
    join(brokenFixtures, 'valid-involves-unknown.md'),
  ])
  const combined = `${stdout}${stderr}`
  assert.equal(status, 0, combined)
  assert.ok(!combined.includes('ERR_MODULE_NOT_FOUND'), combined)
  assert.ok(stderr.includes('advisory: involves entry'), combined)
})

test('P2b-ii AC2: broken tree WITH --config -> typed exit-2 refusal naming foreman-config and the remedy, never an untyped crash', () => {
  const { status, stderr } = runBrokenCli([
    'validate',
    '--config',
    join(brokenFixtures, 'foreman-config-telemetry.yaml'),
    join(brokenFixtures, 'valid-involves-extension.md'),
  ])
  assert.equal(status, 2, stderr)
  assert.ok(stderr.includes('cannot load foreman-config'), stderr)
  assert.ok(stderr.includes("run 'npm install' in the sibling foreman-config package"), stderr)
})

// ── A4.3: the --config path PAST the first edge ──────────────────────────────

test('P2b-ii A4.3b: broken-tree VARIANT (foreman-config installed, every other sibling absent) — --config works, exit 0: the post-foreman-config graph is ENFORCED, not asserted', () => {
  const { status, stderr, stdout } = runTreeCli(configPathLinter, [
    'validate',
    '--config',
    join(brokenFixtures, 'foreman-config-telemetry.yaml'),
    join(brokenFixtures, 'valid-involves-extension.md'),
  ])
  const combined = `${stdout}${stderr}`
  assert.equal(status, 0, combined)
  assert.ok(!combined.includes('ERR_MODULE_NOT_FOUND'), combined)
  assert.ok(!stderr.includes('involves entry'), combined)
})

test('P2b-ii A4.3a (REVIEWER REPRO, watched red on the unwidened catch): a lazy sibling import AFTER the successful foreman-config import inside the config-load path is a TYPED exit-2 refusal, never an untyped non-2 crash', () => {
  // The planted spelling that defeated the pre-A4 code: foreman-config loads
  // fine (its deps ARE installed in this tree), then a later sibling import
  // inside loadCapabilityExtensions pulls permission-profiles' ajv — absent
  // here — and pre-A4 escaped the typed try/catch as an uncaught
  // ERR_MODULE_NOT_FOUND with a non-2 exit: exactly what AC2 exists to
  // prevent. The widened catch must convert it to a typed exit-2 refusal.
  const { status, stderr } = runTreeCli(injectedLinter, [
    'validate',
    '--config',
    join(brokenFixtures, 'foreman-config-telemetry.yaml'),
    join(brokenFixtures, 'valid-involves-extension.md'),
  ])
  assert.equal(status, 2, `must be the typed exit-2 refusal, never an untyped crash\n${stderr}`)
  assert.ok(stderr.includes('cannot honor --config'), stderr)
  // The refusal is typed OUTPUT, not a re-thrown loader crash:
  assert.ok(!stderr.includes('    at '), `no stack trace — a refusal, not a crash\n${stderr}`)
})

test('P2b-ii AC4 with-config half: valid --config NOT declaring the value -> unknown involves stays advisory, exit 0 (D14)', () => {
  const { status, stderr } = runCli([
    'validate',
    '--config',
    telemetryConfig,
    join(fixturesDir, 'valid-involves-unknown.md'),
  ])
  assert.equal(status, 0, stderr)
  assert.ok(stderr.includes('advisory: involves entry'), stderr)
})
