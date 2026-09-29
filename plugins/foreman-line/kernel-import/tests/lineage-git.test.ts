/**
 * `GitLineageReader` (OQ-8 shipped reader) against REAL git fixture repos,
 * the gateway integration over it, the typed-normalization refusals and
 * ERR-01 harness pass-through at the seam boundary, and the read-only audit
 * (failing-when-broken): no banned mutation subcommand token in the shipped
 * source, and zero repository mutation after exercising every reader method.
 *
 * Windows-safe: temp dirs via `fs.mkdtempSync(path.join(os.tmpdir(), …))`,
 * every git call is `execFileSync` argv-array form, identity supplied with
 * `git -c` (never a shell string).
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { ImportError } from '../src/errors.js'
import { BLOB_ABSENT, createLineageGateway } from '../src/lineage.js'
import { GitLineageReader } from '../src/lineage-git.js'
import { harnessFailureReader, nonconformingReader } from './helpers/fake-lineage.js'

const NON_ASCII_NAME = 'ünïcode ñäme.txt'
const SPACED_NAME = 'file with spaces.txt'

const BANNED_MUTATION_SUBCOMMANDS = [
  'commit',
  'merge',
  'rebase',
  'reset',
  'checkout',
  'switch',
  'clean',
  'rm',
  'add',
  'mv',
  'update-ref',
  'gc',
  'prune',
  'repack',
  'cherry-pick',
  'revert',
  'stash',
  'tag',
  'branch',
  'push',
  'fetch',
  'pull',
] as const

interface Fixture {
  dir: string
  c1: string
  c2: string
  sibling: string
  unrelatedRoot: string
  dataV1: Uint8Array
  dataV2: Uint8Array
  nonAsciiBytes: Uint8Array
  spacedBytes: Uint8Array
}

let built: Fixture | null = null
let tempRoot: string | null = null

after(() => {
  if (tempRoot !== null) rmSync(tempRoot, { recursive: true, force: true })
})

function fixtureGit(repo: string, args: readonly string[]): Buffer {
  return execFileSync(
    'git',
    ['-c', 'user.name=FK-P11-Test', '-c', 'user.email=fk-p11-test@example.invalid', ...args],
    { cwd: repo, encoding: 'buffer', shell: false, maxBuffer: 1 << 24 },
  )
}

function fixtureGitLine(repo: string, args: readonly string[]): string {
  return String(fixtureGit(repo, args)).trim()
}

function getFixture(): Fixture {
  if (built !== null) return built
  const dir = mkdtempSync(join(tmpdir(), 'fk-p11-git-'))
  tempRoot = dir
  fixtureGit(dir, ['init', '-q'])
  // Byte-exact round-trips: no line-ending translation, no signing prompts.
  fixtureGit(dir, ['config', 'core.autocrlf', 'false'])
  fixtureGit(dir, ['config', 'commit.gpgsign', 'false'])
  const dataV1 = new Uint8Array([0x76, 0x31, 0x0a])
  const dataV2 = new Uint8Array([0x76, 0x32, 0x0a])
  const nonAsciiBytes = new Uint8Array([0x61, 0xc3, 0xb1, 0x0a])
  const spacedBytes = new Uint8Array([0x00, 0xff, 0xfe, 0x0d, 0x0a, 0x41])
  writeFileSync(join(dir, 'data.txt'), dataV1)
  writeFileSync(join(dir, NON_ASCII_NAME), nonAsciiBytes)
  writeFileSync(join(dir, SPACED_NAME), spacedBytes)
  fixtureGit(dir, ['add', '.'])
  fixtureGit(dir, ['commit', '-q', '-m', 'c1: base'])
  const c1 = fixtureGitLine(dir, ['rev-parse', 'HEAD'])
  writeFileSync(join(dir, 'data.txt'), dataV2)
  fixtureGit(dir, ['add', '.'])
  fixtureGit(dir, ['commit', '-q', '-m', 'c2: head'])
  const c2 = fixtureGitLine(dir, ['rev-parse', 'HEAD'])
  const tree = fixtureGitLine(dir, ['rev-parse', `${c1}^{tree}`])
  // Sibling of c2 (child of c1) and an unrelated-history root, no checkout needed.
  const sibling = fixtureGitLine(dir, ['commit-tree', tree, '-p', c1, '-m', 'sibling side'])
  const unrelatedRoot = fixtureGitLine(dir, ['commit-tree', tree, '-m', 'unrelated root'])
  built = { dir, c1, c2, sibling, unrelatedRoot, dataV1, dataV2, nonAsciiBytes, spacedBytes }
  return built
}

function captureThrow(fn: () => unknown): unknown {
  try {
    fn()
  } catch (value) {
    return value
  }
  assert.fail('expected the call to throw')
}

test('preflight: git --version succeeds', () => {
  try {
    execFileSync('git', ['--version'], { encoding: 'buffer', shell: false, stdio: 'ignore' })
  } catch {
    throw new Error('ENV_PREREQUISITE_GIT_MISSING')
  }
})

test('commitExists: existing commit true, fabricated id false', () => {
  const f = getFixture()
  const reader = new GitLineageReader(f.dir)
  assert.equal(reader.commitExists(f.c1), true)
  assert.equal(reader.commitExists(f.c2), true)
  assert.equal(reader.commitExists('f'.repeat(40)), false)
})

test('isAncestor: inclusive ancestry over the fixture graph', () => {
  const f = getFixture()
  const reader = new GitLineageReader(f.dir)
  assert.equal(reader.isAncestor(f.c1, f.c2), true) // parent -> child
  assert.equal(reader.isAncestor(f.c2, f.c2), true) // self -> self (inclusive)
  assert.equal(reader.isAncestor(f.c2, f.sibling), false) // sibling branches
  assert.equal(reader.isAncestor(f.sibling, f.c2), false)
  assert.equal(reader.isAncestor(f.unrelatedRoot, f.c2), false) // unrelated-history root
})

test('readCommittedBlob: exact bytes, typed absence, commit-bound reads', () => {
  const f = getFixture()
  const reader = new GitLineageReader(f.dir)
  // Exact byte round-trip, including a non-ASCII name and a name with spaces (argv safety).
  assert.deepEqual(reader.readCommittedBlob(f.c2, NON_ASCII_NAME), f.nonAsciiBytes)
  assert.deepEqual(reader.readCommittedBlob(f.c2, SPACED_NAME), f.spacedBytes)
  // Missing path at a valid commit -> typed absence, not a string and not a throw.
  assert.equal(reader.readCommittedBlob(f.c2, 'missing.txt'), BLOB_ABSENT)
  // Commit-bound: the old commit's bytes differ from the HEAD content.
  assert.deepEqual(reader.readCommittedBlob(f.c1, 'data.txt'), f.dataV1)
  assert.deepEqual(reader.readCommittedBlob(f.c2, 'data.txt'), f.dataV2)
  assert.notDeepEqual(f.dataV1, f.dataV2)
})

test('gateway over GitLineageReader: lineage closure and FK-P11-computed digests', () => {
  const f = getFixture()
  const gateway = createLineageGateway(new GitLineageReader(f.dir))
  assert.equal(gateway.commitInLineage(f.c1, f.c2, f.c1), true) // root of the closure
  assert.equal(gateway.commitInLineage(f.c1, f.c2, f.c2), true) // tip of the closure
  assert.equal(gateway.commitInLineage(f.c1, f.c2, f.sibling), false) // sibling commit
  const bytes = gateway.readCommittedBlob(f.c2, 'data.txt')
  assert.ok(bytes instanceof Uint8Array)
  const digest = gateway.digestOf(bytes)
  assert.match(digest, /^sha256:[0-9a-f]{64}$/)
  // The reader never supplies a digest: FK-P11 computes it over returned bytes.
  assert.equal(digest, `sha256:${createHash('sha256').update(bytes).digest('hex')}`)
})

test('gateway normalization: nonconforming seam returns refuse typed', () => {
  const gateway = createLineageGateway(nonconformingReader())
  const calls: (() => unknown)[] = [
    () => gateway.commitExists('c'),
    () => gateway.isAncestor('c', 'c'),
    () => gateway.readCommittedBlob('c', 'p'),
  ]
  for (const call of calls) {
    // 5 rounds per method covers every wrong-typed shape the seam rotates through.
    for (let round = 0; round < 5; round += 1) {
      const failure = captureThrow(call)
      assert.ok(failure instanceof ImportError)
      assert.equal(failure.code, 'LINEAGE_READER_FAILURE')
      assert.deepEqual(failure.diagnostic, { readerCode: 'nonconforming-return' })
    }
  }
})

test('ERR-01: HARNESS_ seam failures surface unwrapped, never laundered', () => {
  const reader = harnessFailureReader()
  const gateway = createLineageGateway(reader)
  const pairs = [
    [() => reader.commitExists('c'), () => gateway.commitExists('c')],
    [() => reader.isAncestor('c', 'c'), () => gateway.isAncestor('c', 'c')],
    [() => reader.readCommittedBlob('c', 'p'), () => gateway.readCommittedBlob('c', 'p')],
  ] as const
  for (const [directCall, gatewayCall] of pairs) {
    const thrown = captureThrow(directCall)
    const surfaced = captureThrow(gatewayCall)
    // Same object, unwrapped: any wrapping (e.g. into ImportError) fails here.
    assert.equal(surfaced, thrown)
    assert.ok(!(surfaced instanceof ImportError))
    if (!(surfaced !== null && typeof surfaced === 'object' && 'code' in surfaced)) {
      assert.fail('harness failure must carry its code literal')
    }
    assert.equal(surfaced.code, 'HARNESS_TEST_FAULT')
  }
})

test('read-only audit: no mutation tokens in code, repository unmutated', () => {
  const f = getFixture()
  // (a) Source audit: strip comments, then no banned mutation subcommand token
  // in code. The (?<!\^\{) exemption is the `^{commit}` revision-type suffix
  // (not a subcommand); (?![\w-]) keeps `merge-base` out of `merge` matches.
  const source = readFileSync(fileURLToPath(new URL('../src/lineage-git.ts', import.meta.url)), {
    encoding: 'utf8',
  })
  const code = source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ')
  for (const token of BANNED_MUTATION_SUBCOMMANDS) {
    const occurrence = new RegExp(`(?<![\\w-])(?<!\\^\\{)${token}(?![\\w-])`)
    assert.equal(occurrence.test(code), false, `banned mutation subcommand token: ${token}`)
  }
  // (b) Behavior audit: exercising every reader method mutates nothing.
  const reader = new GitLineageReader(f.dir)
  const headBefore = fixtureGitLine(f.dir, ['rev-parse', 'HEAD'])
  reader.commitExists(f.c1)
  reader.isAncestor(f.c1, f.c2)
  reader.readCommittedBlob(f.c2, SPACED_NAME)
  reader.readCommittedBlob(f.c1, 'missing.txt')
  reader.readCommittedBlob('f'.repeat(40), 'data.txt')
  assert.equal(fixtureGitLine(f.dir, ['rev-parse', 'HEAD']), headBefore)
  assert.equal(fixtureGitLine(f.dir, ['status', '--porcelain']), '')
})
