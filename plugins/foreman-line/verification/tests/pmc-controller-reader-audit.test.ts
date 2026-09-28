import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { RATIFIED_PACKAGES } from '../src/ratified-packages.js'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pluginRoot = resolve(packageRoot, '..')
const registryFile = 'contract-readers/src/registry-data.ts'
const source = readFileSync(join(pluginRoot, registryFile), 'utf8').replaceAll('\r\n', '\n')
const reader = 'plugins/foreman-line/dispatch/src/pmc-launch/controller.ts'
const literal = `'${reader}',`
const expectedDigest = '03adbbf53a4c30c42db51268b8749bea0c88217e633e1aedc570926202a13af6'

test('PMC controller registry: actual D19 fixed DATA enrollment and bounded ruling contexts', async (t) => {
  assert.equal(source.split(literal).length - 1, 1)
  const temporaryParent = resolve(tmpdir())
  const root = mkdtempSync(join(temporaryParent, 'pmc-controller-reader-'))
  const moved = join(root, 'contract-readers/src/registry-relocated.ts')
  try {
    // Only the real audit executes; copied mutated source is parsed, never imported.
    for (const pkg of RATIFIED_PACKAGES)
      cpSync(join(pluginRoot, pkg), join(root, pkg), {
        recursive: true,
        filter: (path) => !['node_modules', 'dist', 'tests', '.git'].includes(basename(path)),
      })
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
        { cwd: packageRoot, encoding: 'utf8', windowsHide: true, timeout: 60000 },
      )
      assert.ifError(result.error)
      assert.equal(result.signal, null)
      return { status: result.status, output: result.stdout + result.stderr }
    }
    const unchangedPins = (output: string) => {
      assert.match(output, /PMC ledger: 10 observed; expected 10/)
      assert.match(output, /PMC intent custody: 9 observed; expected 9/)
      assert.match(output, /RCM provenance DATA: 1 observed; expected 1/)
      assert.match(
        output,
        /JEV path DATA \(exact declarations \+ direct array elements\): 10 observed; expected 10/,
      )
    }
    const relocatedToA = source
      .replace(literal, '')
      .replace('  readers: [', `  readers: [\n    ${literal}`)
    for (const [name, changed] of [
      ['accepted exact registry', source],
      ['formatting only', source.replace(literal, `/* enrolled reader */\n    ${literal}`)],
      ['unrelated safe source', `${source}\nconst unrelatedRegistryControl = 1 + 2\n`],
      // This is deliberately a positive D19 control: membership semantics belong
      // to touch-set.test.ts. Both named direct contexts were already allowed.
      ['A/B relocation is outside D19 membership semantics', relocatedToA],
    ] as const)
      await t.test(name, () => {
        writeFileSync(join(root, registryFile), changed)
        const result = run()
        assert.equal(result.status, 0, result.output)
        unchangedPins(result.output)
        assert.ok(result.output.includes(`expected ${expectedDigest}; observed ${expectedDigest}`))
        assert.match(
          result.output,
          /cardinality reconciliation: expected 11; observed 11; file swept/,
        )
        assert.match(result.output, /RESULT: PASS/)
      })
    for (const [name, changed] of [
      ['missing reader', source.replace(literal, '')],
      ['duplicate reader', source.replace(literal, `${literal}\n    ${literal}`)],
      [
        'renamed value',
        source.replace(literal, `'${reader.replace('controller.ts', 'controller-other.ts')}',`),
      ],
      [
        'substituted value',
        source.replace(
          literal,
          "'plugins/foreman-line/dispatch/src/pmc-launch/intent-custody.ts',",
        ),
      ],
      [
        'unapproved declaration',
        source.replace('export const contractB:', 'export const contractC:'),
      ],
      ['nested readers element', source.replace(literal, `[${literal}],`)],
      [
        'unrelated declaration',
        `${source.replace(literal, '')}\nconst unrelatedPath = '${reader}'\n`,
      ],
      [
        'filesystem path use',
        source.replace(literal, '') +
          `\nimport {readFileSync} from 'node:fs'\nreadFileSync('${reader}')\n`,
      ],
      ['empty exact source', ''],
    ] as const)
      await t.test(name, () => {
        assert.notEqual(changed, source)
        writeFileSync(join(root, registryFile), changed)
        const result = run()
        assert.equal(result.status, 1, result.output)
        unchangedPins(result.output)
        assert.match(result.output, /PIN (CARDINALITY|VALUE DIGEST) MISMATCH: A7 registry DATA/)
        assert.match(result.output, /RESULT: FAIL/)
      })
    for (const [name, appended] of [
      ['retained pin plus unrelated declaration', `\nconst unrelatedPath = '${reader}'\n`],
      [
        'retained pin plus filesystem use',
        `\nimport {readFileSync} from 'node:fs'\nreadFileSync('${reader}')\n`,
      ],
    ] as const)
      await t.test(name, () => {
        writeFileSync(join(root, registryFile), source + appended)
        const result = run()
        assert.equal(result.status, 1, result.output)
        unchangedPins(result.output)
        assert.match(
          result.output,
          /cardinality reconciliation: expected 11; observed 11; file swept/,
        )
        assert.ok(result.output.includes(`expected ${expectedDigest}; observed ${expectedDigest}`))
        assert.doesNotMatch(
          result.output,
          /PIN (CARDINALITY|VALUE DIGEST) MISMATCH: A7 registry DATA/,
        )
        assert.match(result.output, /UNRULED INSTANCES \(classes 1-5\): 1 — FAIL/)
        assert.match(result.output, /class 3.*contract-readers\/src\/registry-data\.ts/)
        assert.match(result.output, /RESULT: FAIL/)
      })
    await t.test('same source relocated to another filename', () => {
      writeFileSync(join(root, registryFile), '')
      writeFileSync(moved, source)
      const result = run()
      assert.equal(result.status, 1, result.output)
      unchangedPins(result.output)
      assert.match(result.output, /PIN CARDINALITY MISMATCH: A7 registry DATA/)
      assert.match(result.output, /registry-relocated\.ts/)
    })
  } finally {
    assert.equal(dirname(root), temporaryParent)
    if (existsSync(root)) rmSync(root, { recursive: true, force: true })
  }
})
