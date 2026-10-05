/**
 * RCM-P2 (schema v0.4): `expertise:`, `inputs:`, `min_context:`, `thinking_level:`
 * — accept/refuse paths through the real CLI, plus lockstep proof that every
 * restated vocabulary literal equals its owning source (foreman-config owns the
 * expertise vocabulary per RCM D7; routing-policy owns the routing vocabularies).
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { EXPERTISE_AREAS as OWNER_EXPERTISE_AREAS } from '../../foreman-config/src/expertise.js'
import {
  INPUT_MODALITIES as OWNER_INPUT_MODALITIES,
  THINKING_LEVELS as OWNER_THINKING_LEVELS,
} from '../../routing-policy/src/types.js'
import { specFrontmatterSchema } from '../src/schemas.js'
import { EXPERTISE_AREAS, INPUT_MODALITIES, THINKING_LEVELS } from '../src/types.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const fixturesDir = join(packageRoot, 'tests', 'fixtures')
const tsxCli = join(packageRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs')
const cliEntry = join(packageRoot, 'src', 'cli.ts')

function runCli(args: readonly string[]): {
  status: number | null
  stderr: string
  stdout: string
} {
  const result = spawnSync(process.execPath, [tsxCli, cliEntry, ...args], {
    cwd: packageRoot,
    encoding: 'utf8',
  })
  return { status: result.status, stderr: result.stderr, stdout: result.stdout }
}

test('RCM v0.4 fields with ratified values: exit 0, no advisory', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'valid-rcm-fields.md')])
  assert.equal(status, 0, stderr)
  assert.ok(!stderr.includes('advisory'), stderr)
})

test('legacy omission of all four fields stays valid (D8 gives omission meaning, never an error)', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'valid-involves-known.md')])
  assert.equal(status, 0, stderr)
  assert.ok(!stderr.includes('advisory'), stderr)
})

test('refuses an expertise value outside the closed foreman-config vocabulary (D7: never free text)', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'reject-expertise-unknown.md')])
  assert.equal(status, 1)
  assert.ok(stderr.includes('expertise'), stderr)
})

test('refuses an input modality outside text|image (D8)', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'reject-inputs-audio.md')])
  assert.equal(status, 1)
  assert.ok(stderr.includes('inputs'), stderr)
})

test('refuses an empty inputs array — absent means text-only, empty means nothing (D8)', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'reject-inputs-empty.md')])
  assert.equal(status, 1)
  assert.ok(stderr.includes('inputs'), stderr)
})

test('refuses min_context: 0 — the context floor is a positive token count (OQ6)', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'reject-min-context-zero.md')])
  assert.equal(status, 1)
  assert.ok(stderr.includes('min_context'), stderr)
})

test('refuses a thinking_level outside the ThinkingLevel vocabulary (D8: maps to thinkingLevelMap)', () => {
  const { status, stderr } = runCli([
    'validate',
    join(fixturesDir, 'reject-thinking-level-turbo.md'),
  ])
  assert.equal(status, 1)
  assert.ok(stderr.includes('thinking_level'), stderr)
})

test('lockstep: the expertise enum equals its owning foreman-config vocabulary exactly', () => {
  assert.deepEqual([...EXPERTISE_AREAS], [...OWNER_EXPERTISE_AREAS])
})

test('lockstep: thinking-level and input-modality vocabularies equal the routing-policy owners exactly', () => {
  assert.deepEqual([...THINKING_LEVELS], [...OWNER_THINKING_LEVELS])
  assert.deepEqual([...INPUT_MODALITIES], [...OWNER_INPUT_MODALITIES])
})

test('the schema literal enums equal the typed vocabularies (no silent divergence between the two restatements)', () => {
  const properties = specFrontmatterSchema.properties as Record<string, { enum?: unknown[] }>
  assert.deepEqual(properties.expertise?.enum, [...EXPERTISE_AREAS])
  assert.deepEqual(properties.thinking_level?.enum, [...THINKING_LEVELS])
  const inputs = properties.inputs as { items?: { enum?: unknown[] } }
  assert.deepEqual(inputs.items?.enum, [...INPUT_MODALITIES])
})
