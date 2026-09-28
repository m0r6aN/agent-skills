import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { RATIFIED_PACKAGES } from '../src/ratified-packages.js'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pluginRoot = resolve(packageRoot, '..')
const replayFile = 'jev-decisions/src/replay.ts'
const runtimeFile = 'jev-decisions/src/runtime.ts'
const movedFile = 'jev-decisions/src/legacy-path-mutant.ts'
const replay = readFileSync(join(pluginRoot, replayFile), 'utf8').replaceAll('\r\n', '\n')
const runtime = readFileSync(join(pluginRoot, runtimeFile), 'utf8').replaceAll('\r\n', '\n')
const declaration = replay.match(/const PATHS = \[[\s\S]*?\] as const;/)?.[0]
assert.ok(declaration, 'exact retained replay declaration must exist')
const literals = Array.from(declaration.matchAll(/"([^"]+)"/g), (match) => match[1] ?? '')
assert.equal(literals.length, 10)
const retainedDigest = '2f40b0bb22bd0a0c008e40b5340bddeb7b8c5f0c1af22c716a086cd0bdfc8d8b'
assert.equal(
  createHash('sha256')
    .update(JSON.stringify([...literals].sort()), 'utf8')
    .digest('hex'),
  retainedDigest,
)
const first = literals[0]
assert.ok(first)
const quoted = JSON.stringify(first)
const historicalRuntimeDeclaration = [
  'const CUSTODY_PATHS = new Set([',
  '  "plugins/foreman-line/jev-decisions/tests/fixtures/complete.json",',
  '  "plugins/foreman-line/jev-decisions/tests/fixtures/refused.json",',
  '  "plugins/foreman-line/jev-decisions/tests/fixtures/hold.json",',
  ']);',
].join('\n')

test('PMC legacy retirement: real audit preserves replay pins without a dormant runtime exemption', async (t) => {
  const temporaryParent = resolve(tmpdir())
  const root = mkdtempSync(join(temporaryParent, 'pmc-legacy-audit-'))
  try {
    // Only the real audit executes. These copied sources are parsed, never imported.
    for (const pkg of RATIFIED_PACKAGES)
      cpSync(join(pluginRoot, pkg), join(root, pkg), {
        recursive: true,
        filter: (path) => !['node_modules', 'dist', 'tests', '.git'].includes(basename(path)),
      })
    const reset = () => {
      writeFileSync(join(root, replayFile), replay)
      writeFileSync(join(root, runtimeFile), runtime)
      if (existsSync(join(root, movedFile))) rmSync(join(root, movedFile))
    }
    const run = () => {
      const result = spawnSync(
        process.execPath,
        [
          '--import',
          import.meta.resolve('tsx'),
          join(packageRoot, 'src/d19-audit.ts'),
          '--plugin-root',
          root,
        ],
        { cwd: packageRoot, encoding: 'utf8', windowsHide: true, timeout: 60_000 },
      )
      assert.ifError(result.error)
      assert.equal(result.signal, null)
      return { status: result.status, output: result.stdout + result.stderr }
    }
    const otherPins = (output: string) => {
      assert.match(output, /PMC ledger: 10 observed; expected 10/)
      assert.match(output, /PMC intent custody: 9 observed; expected 9/)
      assert.match(output, /RCM provenance DATA: 1 observed; expected 1/)
    }
    const accepted = (output: string) => {
      otherPins(output)
      assert.match(output, /UNRULED INSTANCES \(classes 1-5\): 0 — PASS/)
      assert.match(
        output,
        /JEV path DATA \(exact declarations \+ direct array elements\): 10 observed; expected 10/,
      )
      assert.ok(output.includes(`expected ${retainedDigest}; observed ${retainedDigest}`))
      assert.match(output, /RESULT: PASS/)
    }
    for (const [name, changed] of [
      ['accepted retired source', replay],
      [
        'comments, whitespace and line splitting',
        replay.replace(
          declaration,
          declaration
            .replace('const PATHS = [', 'const /* declaration */ PATHS = [\n// values')
            .replaceAll('",', '" /* value */ ,'),
        ),
      ],
      ['unrelated safe source', `${replay}\nconst unrelatedRetirementControl = 1 + 2\n`],
    ] as const)
      await t.test(name, () => {
        reset()
        writeFileSync(join(root, replayFile), changed)
        const result = run()
        assert.equal(result.status, 0, result.output)
        accepted(result.output)
      })

    // Restoring all three historical values satisfies the old audit again.
    // Class-3 findings prove removal of the exemption, not just its count.
    await t.test('reintroduced historical runtime declaration is unruled, not enrolled', () => {
      reset()
      writeFileSync(join(root, runtimeFile), `${runtime}\n${historicalRuntimeDeclaration}\n`)
      const result = run()
      assert.equal(result.status, 1, result.output)
      otherPins(result.output)
      assert.match(
        result.output,
        /JEV path DATA \(exact declarations \+ direct array elements\): 10 observed; expected 10/,
      )
      const runtimeFindings = result.output
        .split('\n')
        .filter(
          (line) => line.includes('[class 3]') && line.includes('jev-decisions/src/runtime.ts'),
        )
      assert.equal(runtimeFindings.length, 3, result.output)
      for (const value of ['complete', 'refused', 'hold'])
        assert.ok(
          runtimeFindings.some((line) => line.includes(`fixtures/${value}.json`)),
          result.output,
        )
      assert.doesNotMatch(result.output, /PIN (?:CARDINALITY|VALUE DIGEST) MISMATCH: JEV/)
    })

    const mutations: [string, string, RegExp][] = []
    const pin = /PIN (?:CARDINALITY|VALUE DIGEST) MISMATCH: JEV path DATA/
    const unruled = /\[class 3\].*jev-decisions\/src\/replay\.ts/
    for (const literal of literals) {
      const token = JSON.stringify(literal)
      assert.ok(declaration.includes(token))
      mutations.push([
        `missing retained value: ${literal}`,
        replay.replace(`${token},`, ''),
        /JEV path DATA: jev-decisions\/src\/replay\.ts — 9 pinned literal\(s\) observed/,
      ])
      mutations.push([
        `changed retained value: ${literal}`,
        replay.replace(token, JSON.stringify(`${literal}.changed`)),
        /PIN VALUE DIGEST MISMATCH: JEV path DATA/,
      ])
    }
    mutations.push(
      [
        'extra value',
        replay.replace(
          declaration,
          declaration.replace('[', '["plugins/foreman-line/unapproved.md",'),
        ),
        pin,
      ],
      [
        'duplicate value',
        replay.replace(declaration, declaration.replace('[', `[${quoted},`)),
        pin,
      ],
      ['missing declaration', replay.replace(declaration, ''), pin],
      ['wrong declaration', replay.replace('const PATHS =', 'const OTHER_PATHS ='), unruled],
      ['mutable declaration', replay.replace('const PATHS =', 'let PATHS ='), unruled],
      [
        'nested declaration',
        replay.replace(declaration, `function nested() {\n${declaration}\n}`),
        unruled,
      ],
      [
        'wrong literal shape',
        replay.replace(quoted, String.fromCharCode(96) + first + String.fromCharCode(96)),
        unruled,
      ],
      [
        'wrapped array shape',
        replay.replace(
          declaration,
          declaration.replace('= [', '= wrap([').replace('] as const;', ']) as const;'),
        ),
        unruled,
      ],
      ['object member shape', replay.replace(quoted, `{ value: ${quoted} }`), unruled],
      [
        'indirected value',
        replay.replace(
          declaration,
          `const indirect = ${quoted};\n${declaration.replace(quoted, 'indirect')}`,
        ),
        unruled,
      ],
      ['duplicate declaration', replay.replace(declaration, `${declaration}\n${declaration}`), pin],
      [
        'same literal in unrelated declaration',
        `${replay}\nconst unrelated = ${quoted};\n`,
        unruled,
      ],
      ['same literal in reference context', `${replay}\nreadFileSync(${quoted});\n`, unruled],
      [
        'same literal in another declaration array',
        `${replay}\nconst OTHER = [${quoted}] as const;\n`,
        unruled,
      ],
    )
    for (const [name, changed, diagnostic] of mutations)
      await t.test(name, () => {
        reset()
        assert.notEqual(changed, replay, name)
        writeFileSync(join(root, replayFile), changed)
        const result = run()
        assert.equal(result.status, 1, result.output)
        otherPins(result.output)
        assert.match(result.output, diagnostic)
        assert.match(result.output, /RESULT: FAIL/)
      })

    await t.test('missing exact replay file cannot silently drop its pin', () => {
      reset()
      rmSync(join(root, replayFile))
      const result = run()
      assert.equal(result.status, 1, result.output)
      otherPins(result.output)
      assert.match(
        result.output,
        /JEV path DATA declaration: required exact file jev-decisions\/src\/replay\.ts is absent/,
      )
    })
    await t.test('moving the same declaration into a sibling file cannot enroll', () => {
      reset()
      writeFileSync(join(root, replayFile), replay.replace(declaration, ''))
      writeFileSync(join(root, movedFile), declaration)
      const result = run()
      assert.equal(result.status, 1, result.output)
      otherPins(result.output)
      assert.match(result.output, /\[class 3\].*jev-decisions\/src\/legacy-path-mutant\.ts/)
      assert.match(
        result.output,
        /JEV path DATA: jev-decisions\/src\/replay\.ts — 0 pinned literal\(s\) observed/,
      )
    })
    await t.test('unrelated root-conflation detector remains active', () => {
      reset()
      writeFileSync(join(root, runtimeFile), `${runtime}\nconst root = process.cwd();\n`)
      const result = run()
      assert.equal(result.status, 1, result.output)
      otherPins(result.output)
      assert.match(result.output, /\[class 1\].*jev-decisions\/src\/runtime\.ts/)
      assert.match(
        result.output,
        /JEV path DATA \(exact declarations \+ direct array elements\): 10 observed; expected 10/,
      )
    })
  } finally {
    // Validate the exact owned target before recursive cleanup on Windows.
    assert.equal(dirname(resolve(root)), temporaryParent)
    assert.ok(basename(root).startsWith('pmc-legacy-audit-'))
    rmSync(root, { recursive: true, force: true })
  }
})
