/**
 * H4 symlink/reparse fixtures: `verifyCompiledPaths` refuses escaping and
 * in-root reparse points at every component and the final target, and the
 * LINK-08 opened-target race is detected by handle identity (never by
 * re-checking the original path). OQ-5 privilege discipline: junction cases
 * MUST execute (creation failure hard-fails the chain); privilege-classed
 * symlink cases may skip ONLY with a machine-readable gap record and are
 * never counted as passed.
 */
import assert from 'node:assert/strict'
import {
  closeSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  type CompiledScopeArtifact,
  compileScope,
  reverifyOpenedTarget,
  ScopeCompileError,
  verifyCompiledPaths,
} from '../src/index.js'

interface TreeOp {
  op: string
  path: string
  content?: string
  target?: string
  linkKind?: string
}

interface LinkCase {
  id: string
  linkKind: 'file' | 'dir' | 'junction' | 'race'
  tree: TreeOp[]
  verify: string[]
  expectedCode: string
  repair: string
  race?: { steps: string[] }
}

const here = dirname(fileURLToPath(import.meta.url))
const table = JSON.parse(
  readFileSync(join(here, 'fixtures', 'hostile', 'link-trees.json'), 'utf8'),
) as { cases: LinkCase[] }

const FRONTMATTER = [
  '---',
  'ticket: FK-T0',
  'status: active',
  'surfaces: [plugins/]',
  '---',
  '',
].join('\n')
function specWith(entries: string[]): string {
  const lines = [
    FRONTMATTER,
    '## Intent',
    'x',
    '',
    '## Constraints',
    'x',
    '',
    '## Acceptance Criteria',
    'x',
    '',
    '## Out of Scope',
    'x',
    '',
    '## Context & References',
    'x',
    '',
    '## Allowed Files',
  ]
  for (const entry of entries) lines.push(`- ${entry}`)
  lines.push('')
  return lines.join('\n')
}

function artifactFor(entries: string[]): CompiledScopeArtifact {
  return compileScope(specWith(entries), { specPath: 'p.md' }).artifact
}

function materialize(
  c: LinkCase,
  withLinks: boolean,
): { base: string; root: string; blocked: string | null } {
  const base = mkdtempSync(join(tmpdir(), 'fkp2-link-'))
  const root = join(base, 'root')
  mkdirSync(root)
  let blocked: string | null = null
  for (const op of c.tree) {
    const inRoot = join(root, op.path)
    const outside = join(base, op.path)
    if (op.op === 'dir') mkdirSync(inRoot, { recursive: true })
    else if (op.op === 'file') {
      mkdirSync(dirname(inRoot), { recursive: true })
      writeFileSync(inRoot, op.content ?? '')
    } else if (op.op === 'outside-dir') mkdirSync(outside, { recursive: true })
    else if (op.op === 'outside-file') {
      mkdirSync(dirname(outside), { recursive: true })
      writeFileSync(outside, op.content ?? '')
    } else if (op.op === 'link') {
      const kind = op.linkKind ?? 'file'
      if (!withLinks) {
        if (kind === 'file') writeFileSync(inRoot, 'x')
        else mkdirSync(inRoot, { recursive: true })
        continue
      }
      try {
        if (kind === 'junction') {
          // Junctions are privilege-free on Windows (OQ-5a: MUST execute).
          symlinkSync(resolve(root, op.target ?? ''), inRoot, 'junction')
        } else {
          symlinkSync(op.target ?? '', inRoot, kind as 'file' | 'dir')
        }
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code ?? 'unknown'
        if (kind === 'junction') throw error
        blocked = `${c.id} ${kind}-symlink: ${code}`
      }
    }
  }
  if (!withLinks) {
    for (const target of c.verify) {
      const full = join(root, target)
      if (!lstatOrUndefined(full)) {
        mkdirSync(dirname(full), { recursive: true })
        writeFileSync(full, 'x')
      }
    }
  }
  return { base, root, blocked }
}

function lstatOrUndefined(path: string): boolean {
  try {
    lstatSync(path)
    return true
  } catch {
    return false
  }
}

for (const c of table.cases) {
  if (c.id === 'LINK-08') continue
  test(`${c.id}: verifyCompiledPaths refuses with ${c.expectedCode}`, (t) => {
    const tree = materialize(c, true)
    try {
      if (tree.blocked) {
        // OQ-5b machine-readable gap record; never counted as passed.
        console.log(JSON.stringify({ gap: c.id, blocked: tree.blocked }))
        t.skip(`blocked: ${tree.blocked}`)
        return
      }
      assert.throws(
        () => {
          verifyCompiledPaths(tree.root, artifactFor(c.verify))
        },
        (error: unknown) => {
          assert.ok(error instanceof ScopeCompileError, String(error))
          assert.equal(error.code, c.expectedCode, c.id)
          return true
        },
      )
    } finally {
      rmSync(tree.base, { recursive: true, force: true })
    }
  })
  test(`${c.id} repaired (${c.repair}): the tree verifies clean`, () => {
    const tree = materialize(c, false)
    try {
      const records = verifyCompiledPaths(tree.root, artifactFor(c.verify))
      assert.equal(records.length, c.verify.length, `${c.id} repaired identities captured`)
    } finally {
      rmSync(tree.base, { recursive: true, force: true })
    }
  })
}

test('LINK-08: opened-target substitution race is detected by handle identity', () => {
  const base = mkdtempSync(join(tmpdir(), 'fkp2-link-'))
  const root = join(base, 'root')
  mkdirSync(root)
  writeFileSync(join(root, 'target.txt'), 'original')
  mkdirSync(join(base, 'outside'))
  writeFileSync(join(base, 'outside', 'racer.txt'), 'racer')
  try {
    const records = verifyCompiledPaths(root, artifactFor(['target.txt']))
    const expected = records[0]
    assert.ok(expected)
    // Substitution between check and use, then a double swap off the path.
    unlinkSync(join(root, 'target.txt'))
    writeFileSync(join(root, 'target.txt'), 'evil')
    const fd = openSync(join(root, 'target.txt'), 'r')
    unlinkSync(join(root, 'target.txt'))
    writeFileSync(join(root, 'target.txt'), 'original')
    try {
      // The path itself looks clean again — only the opened handle betrays the swap.
      assert.equal(lstatSync(join(root, 'target.txt')).isFile(), true)
      assert.throws(
        () => {
          reverifyOpenedTarget(fd, expected)
        },
        (error: unknown) => {
          assert.ok(error instanceof ScopeCompileError, String(error))
          assert.equal(error.code, 'LINK_TARGET_RACE')
          return true
        },
      )
    } finally {
      closeSync(fd)
    }
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
})

test('LINK-08 repaired: no substitution passes the re-verify contract', () => {
  const base = mkdtempSync(join(tmpdir(), 'fkp2-link-'))
  const root = join(base, 'root')
  mkdirSync(root)
  writeFileSync(join(root, 'target.txt'), 'original')
  try {
    const records = verifyCompiledPaths(root, artifactFor(['target.txt']))
    const expected = records[0]
    assert.ok(expected)
    const fd = openSync(join(root, 'target.txt'), 'r')
    try {
      assert.doesNotThrow(() => {
        reverifyOpenedTarget(fd, expected)
      })
    } finally {
      closeSync(fd)
    }
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
})
