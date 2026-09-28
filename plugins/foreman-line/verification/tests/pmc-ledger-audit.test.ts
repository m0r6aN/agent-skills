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
const ledger = 'dispatch/src/pmc-launch/ledger.ts'
const source = readFileSync(join(pluginRoot, ledger), 'utf8').replaceAll('\r\n', '\n')

test('PMC ledger: real D19 pins guarded paths and SQLite provenance', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'pmc-ledger-audit-'))
  try {
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
          join(packageRoot, 'src/d19-audit.ts'),
          '--plugin-root',
          root,
        ],
        { cwd: packageRoot, encoding: 'utf8', windowsHide: true, timeout: 120_000 },
      )
      assert.ifError(result.error)
      return { status: result.status, output: result.stdout + result.stderr }
    }
    await t.test('reviewed ledger passes with exactly ten pinned sites', () => {
      const result = run()
      assert.equal(result.status, 0, result.output)
      assert.match(result.output, /PMC ledger: 10 observed; expected 10/)
    })

    await t.test('formatting and comments preserve every reviewed role', () => {
      writeFileSync(
        join(root, ledger),
        source
          .replaceAll('function ', 'function /* formatting */  ')
          .replaceAll('db.exec(', 'db /* receiver */ . exec /* call */ (')
          .replaceAll('resolve(root)', 'resolve( /* supplied */ root )'),
      )
      const result = run()
      assert.equal(result.status, 0, result.output)
      assert.match(result.output, /PMC ledger: 10 observed; expected 10/)
    })
    const mutations: [string, string][] = []
    const replace = (name: string, from: string, to: string) => {
      assert.ok(source.includes(from), name)
      mutations.push([name, source.replace(from, to)])
    }
    await t.test('JSDoc and unrelated source changes preserve enrollment', () => {
      writeFileSync(
        join(root, ledger),
        source.replaceAll('function ', '/** Ordinary documentation. */\nfunction ') +
          '\nconst unrelatedAuditControl = 1 + 2\n',
      )
      const result = run()
      assert.equal(result.status, 0, result.output)
      assert.match(result.output, /PMC ledger: 10 observed; expected 10/)
    })
    replace('token collision: unary guard operator', '!isAbsolute(root)', '+isAbsolute(root)')
    replace('token collision: type-only import', '{ DatabaseSync,', '{ type DatabaseSync,')
    replace('token collision: schema declaration kind', 'const schema =', 'let schema =')
    replace('token: schema var declaration', 'const schema =', 'var schema =')
    replace('token: local declaration kind', 'let current =', 'const current =')
    replace('token: unary bitwise guard', '!isAbsolute(root)', '~isAbsolute(root)')
    replace('token: async modifier', 'function path(', 'async function path(')
    replace('token: generator punctuation', 'function path(', 'function* path(')
    replace('token: postfix operator', 'return filename', 'return filename++')
    replace('token: ASI changes return structure', 'return filename', 'return\nfilename')
    replace('token: unterminated comment refuses', 'return filename', 'return filename /*')
    replace(
      'token: export modifier',
      'export function initializeLocalPmcLedger',
      'function initializeLocalPmcLedger',
    )
    replace('token: import type modifier removed', 'type SQLInputValue', 'SQLInputValue')
    replace('token: import clause type-only', 'import { createHash }', 'import type { createHash }')
    const owners = [
      'path',
      'settings',
      'transaction',
      'initializeLocalPmcLedger',
      'connection',
      'fail',
    ]
    const ownerText = (name: string) => {
      const start = source.indexOf(`function ${name}`)
      assert.ok(start >= 0)
      const end = source.indexOf('\n}\n', start) + 2
      assert.ok(end > start)
      return source.slice(start, end)
    }
    for (const owner of owners) {
      const body = ownerText(owner)
      replace(`${owner}: missing owner`, body, '')
      replace(`${owner}: duplicate owner`, body, `${body}\n${body}`)
      replace(`${owner}: nested owner`, body, `function wrapper() {\n${body}\n}`)
      replace(`${owner}: renamed owner`, `function ${owner}`, `function changed_${owner}`)
      replace(`${owner}: changed body`, body, body.replace('{', '{ throw new Error("changed");'))
    }
    for (const line of source.split('\n').filter((line) => line.startsWith('import '))) {
      replace(`missing provenance ${line}`, line, '')
      replace(`duplicate provenance ${line}`, line, `${line}\n${line}`)
      replace(
        `substituted provenance ${line}`,
        line,
        line.replace('from ', 'from /* changed */ ').replace(/'([^']+)'$/, "'substitute'"),
      )
    }
    const sites = [
      ['path', 'resolve(root)'],
      ['path', 'resolve(root)', 1],
      [
        'settings',
        "db.exec(\n    'PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA; PRAGMA busy_timeout=1000; PRAGMA foreign_keys=ON',\n  )",
      ],
      ['transaction', "db.exec(write ? 'BEGIN IMMEDIATE' : 'BEGIN')"],
      ['transaction', "db.exec('COMMIT')"],
      ['transaction', "db.exec('ROLLBACK')"],
      ['initializeLocalPmcLedger', "db.exec('BEGIN IMMEDIATE')"],
      ['initializeLocalPmcLedger', 'db.exec(sql)'],
      ['initializeLocalPmcLedger', "db.exec('COMMIT')"],
      ['initializeLocalPmcLedger', "db.exec('ROLLBACK')"],
    ] as const
    for (const [owner, expression, occurrence = 0] of sites) {
      const body = ownerText(owner)
      let index = body.indexOf(expression)
      if (occurrence) index = body.indexOf(expression, index + expression.length)
      assert.ok(index >= 0, owner + expression)
      const change = (replacement: string) =>
        source.replace(
          body,
          body.slice(0, index) + replacement + body.slice(index + expression.length),
        )
      const label = `${owner}/${expression}/${occurrence}`
      mutations.push([`${label}: absent site`, change('undefined')])
      mutations.push([`${label}: extra site`, change(`(${expression}, ${expression})`)])
      mutations.push([
        `${label}: changed argument`,
        change(expression.replace('(', '("changed", ')),
      ])
      mutations.push([`${label}: optional call`, change(expression.replace('(', '?.('))])
      mutations.push([`${label}: wrapper`, change(`wrapper(${expression})`)])
      mutations.push([
        `${label}: changed receiver`,
        change(expression.replace(/^(db|resolve)/, 'other')),
      ])
    }
    replace('guard polarity', '!isAbsolute(root)', 'isAbsolute(root)')
    replace('guard operand', '!isAbsolute(root)', '!isAbsolute(other)')
    replace('guard conjunction', '!isAbsolute(root) ||', '!isAbsolute(root) &&')
    replace('guard bypass', "fail('LEDGER_PATH_REFUSED')\n  try", 'void 0\n  try')
    const guardStart = source.indexOf('  if (\n    !isAbsolute(root)')
    const guardEnd = source.indexOf('  try {', guardStart)
    const guard = source.slice(guardStart, guardEnd)
    mutations.push([
      'guard moved after resolve',
      source
        .replace(guard, '')
        .replace('let current = resolve(root)', `let current = resolve(root)\n${guard}`),
    ])
    replace('guard conditional bypass', guard, `if (false) {\n${guard}}\n`)
    replace(
      'guard root reassignment',
      'let current = resolve(root)',
      'root = other; let current = resolve(root)',
    )
    replace(
      'guard root shadowing',
      'let current = resolve(root)',
      'let root = other; let current = resolve(root)',
    )
    replace('schema SQL value', 'CREATE TABLE ledger_meta', 'CREATE TABLE changed_meta')
    replace('schema binding missing', 'const schema =', 'const otherSchema =')
    for (const owner of ['connection', 'initializeLocalPmcLedger']) {
      const body = ownerText(owner)
      for (const [name, from, to] of [
        ['constructor substitution', 'new DatabaseSync(', 'new OtherDatabase('],
        ['constructor configuration', 'defensive: true', 'defensive: false'],
        ['db assignment', 'settings(db)', 'db = other; settings(db)'],
        ['db shadow', 'settings(db)', '{ const db = other; settings(db) }'],
      ] as const)
        replace(`${owner}: ${name}`, body, body.replace(from, to))
    }
    for (const owner of ['settings', 'transaction']) {
      const body = ownerText(owner)
      replace(`${owner}: db assignment`, body, body.replace('db.exec(', 'db = other; db.exec('))
      replace(
        `${owner}: shadow binding`,
        body,
        body
          .replace('db.exec(', 'const other = () => { const db = process; db.exec(')
          .replace(/\n}$/, '\n} }'),
      )
    }
    for (const name of [
      'DatabaseSync',
      'isAbsolute',
      'resolve',
      'path',
      'connection',
      'settings',
      'transaction',
      'initializeLocalPmcLedger',
      'fail',
      'schema',
    ]) {
      mutations.push([`${name}: external assignment`, `${source}\n${name} = other\n`])
      mutations.push([
        `${name}: external shadow`,
        `${source}\nfunction shadow() { const ${name} = other }\n`,
      ])
    }
    replace('import alias', '{ DatabaseSync,', '{ OtherDatabase as DatabaseSync,')
    replace('guard import alias', 'isAbsolute, join', 'other as isAbsolute, join')
    replace('optional receiver', "db.exec('COMMIT')", "db?.exec('COMMIT')")
    replace('element receiver', "db.exec('COMMIT')", "db['exec']('COMMIT')")
    for (const [name, changed] of mutations) {
      await t.test(name, () => {
        assert.notEqual(changed, source)
        writeFileSync(join(root, ledger), changed)
        const result = run()
        assert.equal(result.status, 1, result.output)
        assert.match(
          result.output,
          /PMC ledger (declaration|call|external reference|site cardinality)/,
        )
      })
    }
    await t.test('real subprocess exec remains class 4 in the ledger file', () => {
      writeFileSync(
        join(root, ledger),
        `${source}\nimport * as cp from "node:child_process"\ncp.exec("echo forbidden")\n`,
      )
      const result = run()
      assert.equal(result.status, 1, result.output)
      assert.match(result.output, /\[class 4\].*ledger\.ts.*cp\.exec/)
    })
    await t.test('empty exact file still reconciles missing owners and all ten sites', () => {
      writeFileSync(join(root, ledger), 'export {}\n')
      const result = run()
      assert.equal(result.status, 1, result.output)
      assert.match(result.output, /PMC ledger: 0 observed; expected 10/)
      assert.match(
        result.output,
        /PMC ledger declaration cardinality: path; expected 1, observed 0/,
      )
    })
    await t.test('same-name owners in another file cannot enroll', () => {
      writeFileSync(join(root, ledger), source)
      writeFileSync(join(root, 'dispatch/src/pmc-launch/other-ledger.ts'), source)
      const result = run()
      assert.equal(result.status, 1, result.output)
      assert.match(result.output, /\[class 4\].*other-ledger\.ts/)
      assert.match(result.output, /\[class 5\].*other-ledger\.ts/)
      assert.match(result.output, /PMC ledger: 10 observed; expected 10/)
    })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
