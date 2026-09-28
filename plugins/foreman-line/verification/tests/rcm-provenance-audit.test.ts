import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { RATIFIED_PACKAGES } from '../src/ratified-packages.js'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pluginRoot = resolve(packageRoot, '..')
const producer = 'routing-policy/src/public-observation-producer.ts'
const literal =
  'plugins/foreman-line/docs/specs/active/PMC-P0-pi-capability-and-catalogue-baseline.md'
const original = readFileSync(join(pluginRoot, producer), 'utf8')
const check = `check(\n    baseline.file ===\n      '${literal}' &&\n      baseline.table === 'AC2',\n  )`
const source = original.replaceAll('\r\n', '\n')
assert.ok(source.includes(check))
const functionStart = source.indexOf('function validateBindings(')
assert.ok(functionStart >= 0)
const functionEnd = source.indexOf('\n}\n', functionStart) + 2
assert.ok(functionEnd > functionStart)
const validationFunction = source.slice(functionStart, functionEnd)

test('RCM provenance: real D19 audit enforces exact identity, AST position, value and cardinality', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'rcm-provenance-audit-'))
  try {
    // Preserve every existing inventory and package; omit dependencies and build/test output.
    for (const pkg of RATIFIED_PACKAGES) {
      cpSync(join(pluginRoot, pkg), join(root, pkg), {
        recursive: true,
        filter: (path) => !['node_modules', 'dist', 'tests', '.git'].includes(basename(path)),
      })
    }
    const run = () => {
      const result = spawnSync(
        process.execPath,
        [
          '--import',
          import.meta.resolve('tsx'),
          join(packageRoot, 'src', 'd19-audit.ts'),
          '--plugin-root',
          root,
        ],
        {
          cwd: packageRoot,
          encoding: 'utf8',
          windowsHide: true,
          timeout: 120_000,
        },
      )
      assert.ifError(result.error)
      return { status: result.status, output: result.stdout + result.stderr }
    }
    await t.test('accepted current source passes and reports exactly one provenance site', () => {
      const result = run()
      assert.equal(result.status, 0, result.output)
      assert.match(result.output, /RCM provenance DATA: 1 observed; expected 1/)
    })
    const mutations: [string, string][] = [
      ['missing site', source.replace(check, 'check(true)')],
      ['changed value', source.replace(literal, `${literal}.changed`)],
      ['duplicate site', source.replace(check, `${check}\n  ${check}`)],
      [
        'different function',
        source.replace('function validateBindings(', 'function anotherFunction('),
      ],
      ['nested function', source.replace(check, `function nested() { ${check} }`)],
      ['nested statement', source.replace(check, `if (true) { ${check} }`)],
      ['declaration instead of statement', source.replace(check, `const result = ${check}`)],
      ['different property', source.replace('baseline.file ===', 'baseline.other ===')],
      ['different receiver', source.replace('baseline.file ===', 'other.file ===')],
      ['element access', source.replace('baseline.file ===', "baseline['file'] ===")],
      ['different operator', source.replace('baseline.file ===', 'baseline.file !==')],
      ['different call', source.replace(check, check.replace('check(', 'other('))],
      ['member call', source.replace(check, check.replace('check(', 'object.check('))],
      ['optional call', source.replace(check, check.replace('check(', 'check?.('))],
      [
        'optional file access',
        source.replace(check, check.replace('baseline.file', 'baseline?.file')),
      ],
      [
        'optional table access',
        source.replace(check, check.replace('baseline.table', 'baseline?.table')),
      ],
      [
        'function moved below module scope',
        source.replace(validationFunction, `function outer() {\n${validationFunction}\n}`),
      ],
      ['additional argument', source.replace(check, check.replace("'AC2',", "'AC2', true,"))],
      ['different conjunction', source.replace(check, check.replace(' &&', ' ||'))],
      ['different companion guard', source.replace(check, check.replace("'AC2'", "'AC3'"))],
      [
        'indirected value',
        source.replace(
          check,
          `const path = '${literal}'\n  ${check.replace(`'${literal}'`, 'path')}`,
        ),
      ],
      ['template literal', source.replace(`'${literal}'`, `\`${literal}\``)],
      [
        'adjacent unruled literal',
        source.replace(check, `${check}\n  const other = 'plugins/foreman-line/unruled.md'`),
      ],
      ['filesystem argument', source.replace(check, `${check}\n  readFileSync('${literal}')`)],
      ['other audit classes remain enforced', `${source}\nconst root = process.cwd()\n`],
    ]
    for (const [name, changed] of mutations) {
      await t.test(name, () => {
        assert.notEqual(changed, source)
        writeFileSync(join(root, producer), changed)
        const result = run()
        assert.equal(result.status, 1, result.output)
        assert.match(result.output, /RESULT: FAIL/)
      })
    }
    await t.test('existing registry pin remains mandatory', () => {
      writeFileSync(join(root, producer), source)
      const registry = join(root, 'contract-readers', 'src', 'registry-data.ts')
      const saved = readFileSync(registry, 'utf8')
      try {
        rmSync(registry)
        const result = run()
        assert.equal(result.status, 1, result.output)
        assert.match(result.output, /A7 registry DATA declaration.*absent/)
        assert.match(result.output, /RCM provenance DATA: 1 observed; expected 1/)
      } finally {
        writeFileSync(registry, saved)
      }
    })
    await t.test('missing file fails even though the package still exists', () => {
      rmSync(join(root, producer))
      const result = run()
      assert.equal(result.status, 1, result.output)
      assert.match(result.output, /RCM provenance DATA.*absent/)
    })
    await t.test('equivalent site in another file cannot enroll', () => {
      mkdirSync(join(root, 'routing-policy', 'src'), { recursive: true })
      writeFileSync(join(root, 'routing-policy', 'src', 'wrong-producer.ts'), source)
      const result = run()
      assert.equal(result.status, 1, result.output)
      assert.match(result.output, /\[class 3\].*wrong-producer/)
    })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
