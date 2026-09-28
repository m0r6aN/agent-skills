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
const recovery = 'dispatch/src/pmc-launch/recovery-admission.ts'
const source = readFileSync(join(pluginRoot, recovery), 'utf8').replaceAll('\r\n', '\n')

test('HRO P4A1 recovery admission: real D19 pins six SQLite sites', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'hro-p4a1-audit-'))
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
    const assertPass = (name: string, result = run()) => {
      assert.equal(result.status, 0, `${name}\n${result.output}`)
      assert.match(result.output, /PMC recovery admission: 6 observed; expected 6/)
      assert.match(result.output, /PMC ledger: 10 observed; expected 10/)
      assert.match(result.output, /PMC intent custody: 9 observed; expected 9/)
    }
    const assertRecoveryRefusal = (name: string, changed: string) => {
      writeFileSync(join(root, recovery), changed)
      const result = run()
      assert.equal(result.status, 1, `${name}\n${result.output}`)
      assert.match(
        result.output,
        /PMC recovery admission (declaration|call|external reference|site cardinality)/,
      )
      assert.match(result.output, /PMC recovery admission: 0 observed; expected 6/)
    }

    await t.test('approved source and formatting/comment changes pass', () => {
      writeFileSync(join(root, recovery), source)
      assertPass('approved source')
      writeFileSync(
        join(root, recovery),
        source
          .replaceAll('function ', 'function /* formatting */  ')
          .replaceAll('db.exec(', 'db /* receiver */ . exec /* call */ (')
          .replaceAll(
            "'hro-recovery-admission-v1.sqlite'",
            "/* comment */ 'hro-recovery-admission-v1.sqlite'",
          ),
      )
      assertPass('formatting/comments')
      writeFileSync(join(root, recovery), `${source}\nconst unrelatedAuditControl = 1 + 2\n`)
      assertPass('unrelated source')
    })

    const replace = (name: string, from: string, to: string) => {
      assert.ok(source.includes(from), name)
      assertRecoveryRefusal(name, source.replace(from, to))
    }

    const ownerText = (name: string) => {
      const start = source.indexOf(`function ${name}`)
      assert.ok(start >= 0, name)
      const end = source.indexOf('\n}\n', start) + 2
      assert.ok(end > start, name)
      return source.slice(start, end)
    }
    const owners = [
      'fail',
      'nativeCode',
      'rows',
      'settings',
      'transaction',
      'expectedMeta',
      'validateRows',
      'writeAdmission',
    ]
    for (const owner of owners) {
      const body = ownerText(owner)
      await t.test(`${owner} declaration controls`, () => {
        replace(`${owner}: missing`, body, '')
        replace(`${owner}: duplicate`, body, `${body}\n${body}`)
        replace(`${owner}: nested`, body, `function wrapper() {\n${body}\n}`)
        replace(`${owner}: renamed`, `function ${owner}`, `function changed_${owner}`)
        replace(`${owner}: changed`, body, body.replace('{', '{ throw new Error("changed");'))
      })
    }

    for (const line of source.split('\n').filter((line) => line.startsWith('import '))) {
      replace(`import missing: ${line}`, line, '')
      replace(`import duplicate: ${line}`, line, `${line}\n${line}`)
      replace(
        `import substitution: ${line}`,
        line,
        line.includes('from ')
          ? line.replace('from ', 'from /* changed */ ').replace(/'([^']+)'$/, "'substitute'")
          : line.replace('import type ', 'import '),
      )
    }

    for (const declaration of [
      'const ADMISSION_FILE =',
      'const DB_LIMIT =',
      'const JOURNAL_LIMIT =',
      'const schema =',
    ]) {
      replace(`${declaration} renamed`, declaration, `const changed_${declaration.slice(6)}`)
    }

    const sites = [
      ['settings', "db.exec('PRAGMA page_size=4096')"],
      [
        'settings',
        "db.exec(\n    'PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA; PRAGMA busy_timeout=1000; PRAGMA foreign_keys=ON; PRAGMA trusted_schema=OFF; PRAGMA max_page_count=1024',\n  )",
      ],
      ['transaction', "db.exec('BEGIN IMMEDIATE')"],
      ['transaction', "db.exec('COMMIT')"],
      ['transaction', "db.exec('ROLLBACK')"],
      ['writeAdmission', 'db.exec(sql)'],
    ] as const
    for (const [owner, expression] of sites) {
      await t.test(`${owner}/${expression} controls`, () => {
        replace(`${owner}: missing site`, expression, 'undefined')
        replace(`${owner}: duplicate site`, expression, `(${expression}, ${expression})`)
        replace(`${owner}: changed SQL`, expression, expression.replace('(', '("changed", '))
        replace(`${owner}: optional site`, expression, expression.replace('(', '?.('))
        replace(`${owner}: wrapped site`, expression, `wrapper(${expression})`)
        replace(`${owner}: changed receiver`, expression, expression.replace(/^db/, 'other'))
      })
    }

    await t.test('constructor, receiver and external provenance controls', () => {
      replace('DatabaseSync constructor', 'new DatabaseSync(', 'new OtherDatabase(')
      replace('DatabaseSync defensive option', 'defensive: true', 'defensive: false')
      replace('DatabaseSync assignment', 'settings(db, true)', 'db = other; settings(db, true)')
      replace(
        'DatabaseSync shadow',
        'settings(db, true)',
        '{ const db = other; settings(db, true) }',
      )
      for (const name of [
        'DatabaseSync',
        'closeSync',
        'openSync',
        'pathToFileURL',
        'rows',
        'settings',
        'transaction',
        'writeAdmission',
        'schema',
        'ADMISSION_FILE',
        'DB_LIMIT',
        'JOURNAL_LIMIT',
        'fail',
        'nativeCode',
      ]) {
        assertRecoveryRefusal(`${name} external assignment`, `${source}\n${name} = other\n`)
        assertRecoveryRefusal(
          `${name} external shadow`,
          `${source}\nfunction shadow() { const ${name} = other }\n`,
        )
      }
    })

    await t.test('real subprocess and same-name owner remain class 4', () => {
      writeFileSync(
        join(root, recovery),
        `${source}\nimport * as cp from 'node:child_process'\ncp.exec('echo forbidden')\n`,
      )
      const subprocess = run()
      assert.equal(subprocess.status, 1, subprocess.output)
      assert.match(subprocess.output, /\[class 4\].*recovery-admission\.ts.*cp\.exec/)
      writeFileSync(join(root, recovery), source)
      writeFileSync(join(root, 'dispatch/src/pmc-launch/other-recovery-admission.ts'), source)
      const other = run()
      assert.equal(other.status, 1, other.output)
      assert.match(other.output, /\[class 4\].*other-recovery-admission\.ts/)
      assert.match(other.output, /PMC recovery admission: 6 observed; expected 6/)
    })

    await t.test('empty exact owner reconciles all six missing sites', () => {
      writeFileSync(join(root, recovery), 'export {}\n')
      const result = run()
      assert.equal(result.status, 1, result.output)
      assert.match(result.output, /PMC recovery admission: 0 observed; expected 6/)
    })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
