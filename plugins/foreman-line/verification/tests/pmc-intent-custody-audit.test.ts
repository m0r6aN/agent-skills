import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { RATIFIED_PACKAGES } from '../src/ratified-packages.js'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pluginRoot = resolve(packageRoot, '..')
const ownerFile = 'dispatch/src/pmc-launch/intent-custody.ts'
const source = readFileSync(join(pluginRoot, ownerFile), 'utf8').replaceAll('\r\n', '\n')

test('PMC intent custody: real D19 exact owners, sites and provenance', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'pmc-owner-audit-'))
  try {
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
    await t.test(
      'accepted source enrolls exactly nine B1 sites and preserves ten ledger sites',
      () => {
        const result = run()
        assert.equal(result.status, 0, result.output)
        assert.match(result.output, /PMC intent custody: 9 observed; expected 9/)
        assert.match(result.output, /PMC ledger: 10 observed; expected 10/)
      },
    )
    for (const [name, changed] of [
      [
        'comments and whitespace',
        source
          .replaceAll('function ', 'function /* formatting */  ')
          .replaceAll('db.exec(', 'db /* receiver */ . exec /* call */ (')
          .replaceAll('resolve(root)', 'resolve( /* supplied */ root )'),
      ],
      [
        'JSDoc and unrelated safe source',
        source.replaceAll('function ', '/** Documentation. */\nfunction ') +
          '\nconst unrelatedAuditControl = 1 + 2\n',
      ],
    ] as const)
      await t.test(name, () => {
        writeFileSync(join(root, ownerFile), changed)
        const result = run()
        assert.equal(result.status, 0, result.output)
        assert.match(result.output, /PMC intent custody: 9 observed; expected 9/)
      })
    const mutations: [string, string][] = []
    const replace = (name: string, from: string, to: string) => {
      assert.ok(source.includes(from), name)
      assert.notEqual(from, to, name)
      mutations.push([name, source.replace(from, to)])
    }
    const owners = [
      'path',
      'settings',
      'transaction',
      'initializeIntentOwnerV1',
      'connect',
      'fail',
      'io',
      'nativeCode',
      'rows',
    ]
    const ownerText = (name: string) => {
      const start = source.indexOf(`function ${name}`)
      assert.ok(start >= 0, name)
      const end = source.indexOf('\n}\n', start) + 2
      assert.ok(end > start, name)
      return source.slice(start, end)
    }
    for (const owner of owners) {
      const body = ownerText(owner)
      replace(`${owner}: missing`, body, '')
      replace(`${owner}: duplicate`, body, `${body}\n${body}`)
      replace(`${owner}: nested`, body, `function wrapper() {\n${body}\n}`)
      replace(`${owner}: renamed`, `function ${owner}`, `function changed_${owner}`)
      replace(`${owner}: body changed`, body, body.replace('{', '{ throw new Error("changed");'))
    }
    const imports = source.match(/^import[\s\S]*?from '[^']+'$/gm) ?? []
    assert.equal(imports.length, 7)
    for (const statement of imports) {
      replace(`import missing: ${statement}`, statement, '')
      replace(`import duplicated: ${statement}`, statement, `${statement}\n${statement}`)
      replace(
        `import substituted: ${statement}`,
        statement,
        statement.replace(/from '[^']+'$/, "from 'other'"),
      )
    }
    const sites = [
      ['path', 'resolve(root)', 0],
      ['path', 'resolve(root)', 1],
      ['path', 'resolve(root)', 2],
      ['settings', "db.exec('PRAGMA page_size=4096')"],
      [
        'settings',
        "db.exec(\n    'PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA; PRAGMA busy_timeout=1000; PRAGMA foreign_keys=ON; PRAGMA trusted_schema=OFF; PRAGMA max_page_count=32768',\n  )",
      ],
      ['transaction', "db.exec('BEGIN IMMEDIATE')"],
      ['transaction', "db.exec('COMMIT')"],
      ['transaction', "db.exec('ROLLBACK')"],
      ['initializeIntentOwnerV1', 'db.exec(sql)'],
    ] as const
    assert.equal(sites.length, 9)
    for (const [owner, expression, occurrence = 0] of sites) {
      const body = ownerText(owner)
      let index = -1
      for (let i = 0; i <= occurrence; i++) index = body.indexOf(expression, index + 1)
      assert.ok(index >= 0, owner + expression)
      const change = (replacement: string) =>
        source.replace(
          body,
          body.slice(0, index) + replacement + body.slice(index + expression.length),
        )
      for (const [name, replacement] of [
        ['missing', 'undefined'],
        ['extra', `(${expression}, ${expression})`],
        ['argument', expression.replace('(', '("changed", ')],
        ['optional', expression.replace('(', '?.(')],
        ['wrapper', `wrapper(${expression})`],
        ['receiver', expression.replace(/^(db|resolve)/, 'other')],
      ] as const)
        mutations.push([`${owner}:${occurrence}:${expression}:${name}`, change(replacement)])
    }
    for (const [name, from, to] of [
      ['unary plus collision', '!isAbsolute(root)', '+isAbsolute(root)'],
      ['unary bitwise collision', '!isAbsolute(root)', '~isAbsolute(root)'],
      ['guard polarity', '!isAbsolute(root)', 'isAbsolute(root)'],
      ['guard operand', '!isAbsolute(root)', '!isAbsolute(other)'],
      ['guard conjunction', '!isAbsolute(root) ||', '!isAbsolute(root) &&'],
      [
        'normalization polarity',
        'normalize(root) !== resolve(root)',
        'normalize(root) === resolve(root)',
      ],
      ['type-only binding', '{ DatabaseSync,', '{ type DatabaseSync,'],
      ['type-only clause', 'import { randomUUID }', 'import type { randomUUID }'],
      ['type keyword removed', 'type SQLInputValue', 'SQLInputValue'],
      ['const to let', 'const schema =', 'let schema ='],
      ['const to var', 'const schema =', 'var schema ='],
      ['local declaration kind', 'let current =', 'const current ='],
      ['async modifier', 'function path(', 'async function path('],
      ['generator punctuation', 'function path(', 'function* path('],
      ['postfix operator', 'return filename', 'return filename++'],
      ['ASI', 'return filename', 'return\nfilename'],
      [
        'export removed',
        'export function initializeIntentOwnerV1',
        'function initializeIntentOwnerV1',
      ],
      ['schema SQL', 'CREATE TABLE owner_meta', 'CREATE TABLE changed_meta'],
      ['schema binding', 'const schema =', 'const changedSchema ='],
      ['FILE value', "const FILE = 'pmc-intent-v1.sqlite'", "const FILE = 'other.sqlite'"],
      ['file limit', 'const FILE_LIMIT = 134217728', 'const FILE_LIMIT = 1'],
      [
        'initialization guard',
        'const initializing = new Set<string>()',
        'const initializing = new Set<string>(["other"])',
      ],
      ['import alias', '{ DatabaseSync,', '{ OtherDatabase as DatabaseSync,'],
      ['guard alias', 'isAbsolute, join', 'other as isAbsolute, join'],
      ['optional receiver', "db.exec('COMMIT')", "db?.exec('COMMIT')"],
      ['element receiver', "db.exec('COMMIT')", "db['exec']('COMMIT')"],
    ] as const)
      replace(name, from, to)
    for (const owner of ['connect', 'initializeIntentOwnerV1']) {
      const body = ownerText(owner)
      for (const [name, from, to] of [
        ['constructor', 'new DatabaseSync(', 'new OtherDatabase('],
        ['constructor options', 'defensive: true', 'defensive: false'],
        ['receiver assignment', 'settings(db,', 'db = other; settings(db,'],
        ['receiver shadow', 'settings(db,', 'const db = other; settings(db,'],
      ] as const)
        replace(`${owner}: ${name}`, body, body.replace(from, to))
    }
    const guardStart = source.indexOf('  if (\n    !isAbsolute(root)')
    const guardEnd = source.indexOf('  return io(', guardStart)
    assert.ok(guardStart >= 0 && guardEnd > guardStart)
    const guard = source.slice(guardStart, guardEnd)
    replace('guard bypass', guard, '')
    replace('guard conditional bypass', guard, `if (false) {\n${guard}}\n`)
    mutations.push([
      'guard moved after resolve',
      source
        .replace(guard, '')
        .replace('let current = resolve(root)', `let current = resolve(root)\n${guard}`),
    ])
    replace(
      'root reassignment',
      'let current = resolve(root)',
      'root = other; let current = resolve(root)',
    )
    replace(
      'root shadowing',
      'let current = resolve(root)',
      'let root = other; let current = resolve(root)',
    )
    for (const name of [
      ...owners,
      'DatabaseSync',
      'isAbsolute',
      'resolve',
      'schema',
      'FILE',
      'FILE_LIMIT',
      'initializing',
      'codes',
      'randomUUID',
      'closeSync',
      'openSync',
      'lstatSync',
      'readdirSync',
      'realpathSync',
      'dirname',
      'join',
      'normalize',
      'parse',
      'pathToFileURL',
    ]) {
      mutations.push([`${name}: external reassignment`, `${source}\n${name} = other\n`])
      mutations.push([
        `${name}: external shadow`,
        `${source}\nfunction shadow() { const ${name} = other }\n`,
      ])
    }
    for (const [name, changed] of mutations)
      await t.test(name, () => {
        assert.notEqual(changed, source)
        writeFileSync(join(root, ownerFile), changed)
        const result = run()
        assert.equal(result.status, 1, result.output)
        assert.match(
          result.output,
          /PMC intent custody (declaration|call|external reference|site cardinality)/,
        )
        assert.match(result.output, /PMC intent custody: 0 observed; expected 9/)
      })
    await t.test('unrelated subprocess and root resolve remain enforcing', () => {
      writeFileSync(
        join(root, ownerFile),
        `${source}\nimport * as cp from 'node:child_process'\ncp.exec('forbidden')\nresolve(otherRoot)\n`,
      )
      const result = run()
      assert.equal(result.status, 1, result.output)
      assert.match(result.output, /\[class 4\].*intent-custody\.ts.*cp\.exec/)
      assert.match(result.output, /\[class 5\].*intent-custody\.ts.*resolve\(otherRoot\)/)
    })
    await t.test('empty exact file reconciles missing owners and nine sites', () => {
      writeFileSync(join(root, ownerFile), 'export {}\n')
      const result = run()
      assert.equal(result.status, 1, result.output)
      assert.match(result.output, /PMC intent custody: 0 observed; expected 9/)
      assert.match(
        result.output,
        /PMC intent custody declaration cardinality: path; expected 1, observed 0/,
      )
    })
    await t.test('same-name owners elsewhere cannot enroll', () => {
      writeFileSync(join(root, ownerFile), source)
      writeFileSync(join(root, 'dispatch/src/pmc-launch/other-owner.ts'), source)
      const result = run()
      assert.equal(result.status, 1, result.output)
      assert.match(result.output, /\[class 4\].*other-owner\.ts/)
      assert.match(result.output, /\[class 5\].*other-owner\.ts/)
      assert.match(result.output, /PMC intent custody: 9 observed; expected 9/)
    })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
