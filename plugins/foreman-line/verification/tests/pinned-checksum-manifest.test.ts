import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { RATIFIED_PACKAGES } from '../src/ratified-packages.js'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pluginRoot = resolve(packageRoot, '..')
const manifestIdentity = 'authority-registry/evidence/qf-p0/SHA256SUMS'
const manifest = readFileSync(join(pluginRoot, manifestIdentity))
const fixtureBudgetBytes = 64 * 1024 * 1024
// Only the mandatory pinned source inventories are copied, never repository trees.
const requiredSources = [
  'authority-registry/src/generate.ts',
  'authority-registry/src/validate.ts',
  'authority-registry/src/r33-migrations.ts',
  'authority-registry/src/r34-migrations.ts',
  'spec-linter/src/grandfather.ts',
  'contract-readers/src/registry-data.ts',
  'jev-decisions/src/replay.ts',
  'routing-policy/src/public-observation-producer.ts',
]

function measuredBytes(path: string): number {
  const info = lstatSync(path)
  if (info.isSymbolicLink()) return 0
  if (!info.isDirectory()) return info.size
  return readdirSync(path).reduce((sum, name) => sum + measuredBytes(join(path, name)), 0)
}

test('PAN-CI2: pinned checksum admission and hostile source controls', async (t) => {
  const scratch = mkdtempSync(join(tmpdir(), 'pinned-checksum-manifest-'))
  const root = join(scratch, 'plugin')
  const target = join(root, manifestIdentity)
  let peakBytes = 0
  const measure = () => {
    const bytes = measuredBytes(scratch)
    peakBytes = Math.max(peakBytes, bytes)
    assert.ok(bytes <= fixtureBudgetBytes, `focused fixtures exceed ${fixtureBudgetBytes} bytes`)
  }
  const put = (identity: string, bytes: string | Buffer) => {
    const path = join(root, identity)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, bytes)
    measure()
    return path
  }
  const run = (rootArg = root, observeReads = false) => {
    measure()
    const args = ['--import', import.meta.resolve('tsx')]
    if (observeReads) args.push('--import', pathToFileURL(join(scratch, 'observe.mjs')).href)
    args.push(join(packageRoot, 'src', 'd19-audit.ts'), '--plugin-root', rootArg)
    const result = spawnSync(process.execPath, args, {
      cwd: packageRoot,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 30_000,
      maxBuffer: 2 * 1024 * 1024,
      env: { ...process.env, CI2_OBSERVED_FILE: target },
    })
    assert.ifError(result.error)
    assert.equal(result.signal, null)
    measure()
    return { status: result.status, output: result.stdout + result.stderr }
  }
  const refuse = (reason: RegExp, observeReads = false) => {
    const result = run(root, observeReads)
    assert.equal(result.status, 2, result.output)
    assert.match(result.output, reason)
    return result
  }
  try {
    for (const pkg of RATIFIED_PACKAGES) put(`${pkg}/src/fixture.ts`, 'export const value = 1\n')
    for (const identity of requiredSources) {
      const path = join(root, identity)
      mkdirSync(dirname(path), { recursive: true })
      copyFileSync(join(pluginRoot, identity), path)
      chmodSync(path, 0o600)
    }
    put(manifestIdentity, manifest)
    // Observe real bounded-handle I/O, including deliberately short reads. Any full-file
    // read of the admitted identity fails this control instead of being silently allowed.
    writeFileSync(
      join(scratch, 'observe.mjs'),
      `import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
const target = process.env.CI2_OBSERVED_FILE;
const originalOpen = fs.openSync, originalRead = fs.readSync, originalReadFile = fs.readFileSync;
const originalClose = fs.closeSync;
const descriptors = new Set(); let bytes = 0, calls = 0, maxRequest = 0;
fs.openSync = function(path, ...args) {
  const fd = originalOpen.call(this, path, ...args);
  if (String(path) === target) descriptors.add(fd);
  return fd;
};
fs.closeSync = function(fd) { descriptors.delete(fd); return originalClose.call(this, fd); };
fs.readFileSync = function(path, ...args) {
  if (String(path) === target || descriptors.has(path)) throw Error('UNBOUNDED_MANIFEST_READ');
  return originalReadFile.call(this, path, ...args);
};
fs.readSync = function(fd, buffer, offset, length, position) {
  if (!descriptors.has(fd)) return originalRead.call(this, fd, buffer, offset, length, position);
  if (typeof length !== 'number' || length > 896) throw Error('READ_REQUEST_OVER_BOUND');
  maxRequest = Math.max(maxRequest, length); calls++;
  const count = originalRead.call(this, fd, buffer, offset, Math.min(length, 17), position);
  bytes += count;
  if (bytes > 896) throw Error('READ_TOTAL_OVER_BOUND');
  return count;
};
syncBuiltinESMExports();
process.on('exit', () => console.log('CI2_READ_BOUND_PROBE ' + JSON.stringify({ bytes, calls, maxRequest })));
`,
    )
    await t.test('exact bytes pass with precise data identity and bounded short reads', () => {
      const result = run(root, true)
      assert.equal(result.status, 0, result.output)
      assert.ok(result.output.includes(`known non-source data: ${manifestIdentity}; bytes=895;`))
      assert.match(
        result.output,
        /sha256=86b25c60cfc3b14f0dedd667ca914bf206988108e502794470df06d2824e147d/,
      )
      assert.match(
        result.output,
        /CI2_READ_BOUND_PROBE \{"bytes":895,"calls":\d+,"maxRequest":896\}/,
      )
      assert.match(result.output, /RESULT: PASS/)
    })
    for (const [name, bytes] of [
      ['one-byte same-length mutation', Buffer.concat([Buffer.from('!'), manifest.subarray(1)])],
      ['truncation', manifest.subarray(0, -1)],
      ['one-byte oversize', Buffer.concat([manifest, Buffer.from('\n')])],
      ['BOM changes raw identity', Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), manifest])],
    ] as const) {
      await t.test(name, () => {
        try {
          writeFileSync(target, bytes)
          refuse(/pinned checksum data/)
        } finally {
          writeFileSync(target, manifest)
        }
      })
    }
    await t.test('large sparse oversize refuses before reading any manifest content', () => {
      try {
        truncateSync(target, 16 * 1024 * 1024)
        const result = refuse(/exactly 895 bytes/, true)
        assert.match(result.output, /CI2_READ_BOUND_PROBE \{"bytes":0,"calls":0,"maxRequest":0\}/)
      } finally {
        writeFileSync(target, manifest)
      }
    })
    for (const identity of [
      'verification/evidence/qf-p0/SHA256SUMS',
      'authority-registry/evidence/other/SHA256SUMS',
      'authority-registry/evidence/qf-p0/sha256sums',
      'authority-registry/evidence/qf-p0/SHA256SUMS.bak',
      'authority-registry/evidence/qf-p0/SHA256SUMS-extra',
      'authority-registry/evidence/qf-p0/UNKNOWN',
    ]) {
      await t.test(`identical bytes at ${identity} are not admitted`, () => {
        // Remove the exact spelling first so the case-variant control also works on Windows.
        rmSync(target)
        const other = put(identity, manifest)
        try {
          refuse(/unrecognized file extension/)
        } finally {
          rmSync(other)
          writeFileSync(target, manifest)
        }
      })
    }
    await t.test('a directory at the exact file identity refuses', () => {
      rmSync(target)
      mkdirSync(target)
      try {
        refuse(/regular non-link file/)
      } finally {
        rmSync(target, { recursive: true })
        writeFileSync(target, manifest)
      }
    })
    for (const identity of [
      manifestIdentity,
      'authority-registry/evidence/qf-p0',
      'authority-registry/evidence',
      'authority-registry',
    ]) {
      await t.test(`link substitution at ${identity} refuses`, () => {
        const path = join(root, identity)
        const moved = join(scratch, 'linked-target')
        const directory = lstatSync(path).isDirectory()
        renameSync(path, moved)
        symlinkSync(moved, path, directory ? 'junction' : 'file')
        try {
          refuse(/pinned checksum data.*non-link/)
        } finally {
          rmSync(path)
          renameSync(moved, path)
        }
      })
    }
    await t.test('a linked explicit plugin root refuses for this admission', () => {
      const alias = join(scratch, 'plugin-alias')
      symlinkSync(root, alias, 'junction')
      try {
        const result = run(alias)
        assert.equal(result.status, 2, result.output)
        assert.match(result.output, /pinned checksum data ancestor.*non-link/)
      } finally {
        rmSync(alias)
      }
    })
    for (const extension of ['js', 'ts']) {
      await t.test(`additional hostile ${extension} source remains swept`, () => {
        const path = put(`verification/src/hostile.${extension}`, 'const root = process.cwd()\n')
        try {
          const result = run()
          assert.equal(result.status, 1, result.output)
          assert.match(result.output, new RegExp(`\\[class 1\\].*hostile\\.${extension}`))
        } finally {
          rmSync(path)
        }
      })
    }
    await t.test('an extra source file changes the swept source count', () => {
      const before = run()
      assert.equal(before.status, 0, before.output)
      const beforeCount = Number(/swept \d+ packages, (\d+) source files/.exec(before.output)?.[1])
      assert.ok(Number.isFinite(beforeCount))
      const path = put('verification/src/extra.mts', 'export const extra = true\n')
      try {
        const after = run()
        assert.equal(after.status, 0, after.output)
        assert.ok(after.output.includes(`, ${beforeCount + 1} source files`))
      } finally {
        rmSync(path)
      }
    })
    await t.test('missing pinned registry source still fails cardinality and identity', () => {
      const path = join(root, 'contract-readers/src/registry-data.ts')
      const original = readFileSync(path)
      rmSync(path)
      try {
        const result = run()
        assert.equal(result.status, 1, result.output)
        assert.match(result.output, /PIN CARDINALITY MISMATCH: A7 registry DATA declaration/)
      } finally {
        writeFileSync(path, original)
      }
    })
    await t.test('a duplicated pinned declaration remains a cardinality failure', () => {
      const path = join(root, 'spec-linter/src/grandfather.ts')
      const original = readFileSync(path, 'utf8')
      try {
        writeFileSync(path, `${original}\n${original}\n`)
        const result = run()
        assert.equal(result.status, 1, result.output)
        assert.match(result.output, /PIN CARDINALITY MISMATCH/)
      } finally {
        writeFileSync(path, original)
      }
    })
    await t.test('restored fixture and original checksum still pass', () => {
      assert.deepEqual(readFileSync(target), manifest)
      const result = run()
      assert.equal(result.status, 0, result.output)
    })
    const authorityIdentity = 'authority-registry/src/r33-migrations.ts'
    const authorityPath = join(root, authorityIdentity)
    const authoritySource = readFileSync(authorityPath, 'utf8')
    const recordStart = authoritySource.indexOf("  {\n    unit: 'adopt-item.36fc26502361',")
    assert.ok(recordStart >= 0)
    const recordEnd = authoritySource.indexOf('\n  },', recordStart) + '\n  },'.length
    assert.ok(recordEnd > recordStart)
    const record = authoritySource.slice(recordStart, recordEnd)
    const literal = /normalizedExcerpt:\s*("[^\n]+"),/.exec(record)?.[1]
    assert.ok(literal)
    const value = JSON.parse(literal) as string
    assert.equal(Buffer.byteLength(value, 'utf8'), 750)
    const mutateRecord = (changed: string) => authoritySource.replace(record, changed)
    const rejectAuthority = async (name: string, changed: string) => {
      await t.test(`D017 refuses ${name}`, () => {
        assert.notEqual(changed, authoritySource, 'negative control must actually mutate its input')
        try {
          writeFileSync(authorityPath, changed)
          const result = run()
          assert.equal(result.status, 1, result.output)
          assert.match(result.output, /D017 authority-text DATA:|\[class 3\]/)
        } finally {
          writeFileSync(authorityPath, authoritySource)
        }
      })
    }
    await rejectAuthority(
      'full-value mutation retaining path mention',
      mutateRecord(record.replaceAll('Developer quick flags', 'developer quick flags')),
    )
    await rejectAuthority(
      'wrong migration unit',
      mutateRecord(record.replace('adopt-item.36fc26502361', 'adopt-item.wrong')),
    )
    await rejectAuthority(
      'wrong source identity',
      mutateRecord(record.replace("sourceId: 'coordinator-pattern'", "sourceId: 'wrong'")),
    )
    await rejectAuthority(
      'wrong item identity',
      mutateRecord(record.replace("itemId: 'item.36fc26502361'", "itemId: 'item.wrong'")),
    )
    await rejectAuthority(
      'wrong disposition',
      mutateRecord(record.replace("disposition: 'adopted'", "disposition: 're-valued'")),
    )
    await rejectAuthority('wrong prior', mutateRecord(record.replace('prior: null', 'prior: {}')))
    await rejectAuthority(
      'wrong rule identity',
      mutateRecord(
        record.replace("ruleId: 'rule.coordinator-pattern.36fc26502361'", "ruleId: 'rule.wrong'"),
      ),
    )
    await rejectAuthority(
      'wrong declaration name',
      authoritySource.replace(
        'export const R33_ITEM_MIGRATIONS:',
        'export const OTHER_MIGRATIONS:',
      ),
    )
    await rejectAuthority(
      'unexported declaration',
      authoritySource.replace('export const R33_ITEM_MIGRATIONS:', 'const R33_ITEM_MIGRATIONS:'),
    )
    await rejectAuthority(
      'mutable declaration',
      authoritySource.replace(
        'export const R33_ITEM_MIGRATIONS:',
        'export let R33_ITEM_MIGRATIONS:',
      ),
    )
    await rejectAuthority('nested declaration', `function nested() {\n${authoritySource}\n}\n`)
    await rejectAuthority(
      'shadow variable',
      `${authoritySource}\nfunction shadow() { const R33_ITEM_MIGRATIONS = [] }\n`,
    )
    await rejectAuthority(
      'shadow parameter',
      `${authoritySource}\nfunction shadow(R33_ITEM_MIGRATIONS: unknown) {}\n`,
    )
    await rejectAuthority(
      'shadow destructuring binding',
      `${authoritySource}\nfunction shadow() { const { R33_ITEM_MIGRATIONS } = {} }\n`,
    )
    await rejectAuthority(
      'duplicate declaration',
      `${authoritySource}\nexport const R33_ITEM_MIGRATIONS = []\n`,
    )
    await rejectAuthority('duplicate record', mutateRecord(`${record}\n${record}`))
    await rejectAuthority(
      'duplicate excerpt occurrence',
      mutateRecord(
        record.replace(
          `normalizedExcerpt:\n        ${literal},`,
          `normalizedExcerpt: ${literal}, normalizedExcerpt: ${literal},`,
        ),
      ),
    )
    await rejectAuthority(
      'duplicate statement occurrence',
      mutateRecord(
        record.replace(
          `normalizedStatement:\n          ${literal},`,
          `normalizedStatement: ${literal}, normalizedStatement: ${literal},`,
        ),
      ),
    )
    await rejectAuthority(
      'missing excerpt',
      mutateRecord(record.replace(`normalizedExcerpt:\n        ${literal},`, '')),
    )
    await rejectAuthority(
      'missing statement',
      mutateRecord(record.replace(`normalizedStatement:\n          ${literal},`, '')),
    )
    await rejectAuthority(
      'moved excerpt property',
      mutateRecord(record.replace('normalizedExcerpt:', 'differentExcerpt:')),
    )
    await rejectAuthority(
      'moved statement property',
      mutateRecord(record.replace('normalizedStatement:', 'differentStatement:')),
    )
    await rejectAuthority(
      'moved record container',
      mutateRecord(`  { wrapped: ${record.trim().slice(0, -1)} },`),
    )
    await rejectAuthority(
      'moved value to constant',
      `${mutateRecord(record.replace(literal, 'movedValue'))}\nconst movedValue = ${literal}\n`,
    )
    await rejectAuthority(
      'computed migration key',
      mutateRecord(record.replace('unit:', "['unit']:")),
    )
    await rejectAuthority(
      'computed leaf key',
      mutateRecord(record.replace('normalizedExcerpt:', "['normalizedExcerpt']:")),
    )
    await rejectAuthority(
      'spread migration record',
      mutateRecord(record.replace('    unit:', '    ...{},\n    unit:')),
    )
    await rejectAuthority(
      'spread new object',
      mutateRecord(record.replace("'new': {", "'new': { ...{},")),
    )
    await rejectAuthority(
      'spread rule object',
      mutateRecord(record.replace('newRules: [\n      {', 'newRules: [\n      { ...{},')),
    )
    await rejectAuthority(
      'spread array record',
      mutateRecord(`  ...[${record.trim().slice(0, -1)}],`),
    )
    await rejectAuthority(
      'indirect array initializer',
      authoritySource.replace(
        'export const R33_ITEM_MIGRATIONS: readonly R33ItemMigration[] = [',
        'export const R33_ITEM_MIGRATIONS = alias\nconst alias: readonly R33ItemMigration[] = [',
      ),
    )
    await rejectAuthority(
      'call array initializer',
      authoritySource.replace(
        'export const R33_ITEM_MIGRATIONS: readonly R33ItemMigration[] = [',
        'export const R33_ITEM_MIGRATIONS = make()\nconst other: readonly R33ItemMigration[] = [',
      ),
    )
    await rejectAuthority(
      'call instead of leaf',
      mutateRecord(record.replace(literal, `identity(${literal})`)),
    )
    await rejectAuthority(
      'indirect new object',
      mutateRecord(
        record
          .replace("'new': {", "'new': identity({")
          .replace('    },\n    newLocatorDigest:', '    }),\n    newLocatorDigest:'),
      ),
    )
    await rejectAuthority(
      'extra rule array occurrence',
      mutateRecord(record.replace('newRules: [', 'newRules: [{ ruleId: "extra" },')),
    )
    await rejectAuthority(
      'same value in executable resolver',
      `${authoritySource}\nresolve(${literal})\n`,
    )
    await rejectAuthority(
      'third unpinned literal',
      `${authoritySource}\nconst third = ${literal}\n`,
    )
    await t.test('D017 requires the exact file, even if identical data exists elsewhere', () => {
      const other = put('authority-registry/src/r33-lookalike.ts', authoritySource)
      rmSync(authorityPath)
      try {
        const result = run()
        assert.equal(result.status, 1, result.output)
        assert.match(result.output, /D017 authority-text DATA: required file .* is absent/)
        assert.match(result.output, /\[class 3\].*r33-lookalike/)
      } finally {
        rmSync(other)
        writeFileSync(authorityPath, authoritySource)
      }
    })
    await t.test('D017 missing file without a replacement fails mandatory reconciliation', () => {
      rmSync(authorityPath)
      try {
        const result = run()
        assert.equal(result.status, 1, result.output)
        assert.match(result.output, /D017 authority-text DATA: required file .* is absent/)
      } finally {
        writeFileSync(authorityPath, authoritySource)
      }
    })
    await t.test('D017 restored leaves report distinct one-plus-one identities', () => {
      assert.equal(readFileSync(authorityPath, 'utf8'), authoritySource)
      const result = run()
      assert.equal(result.status, 0, result.output)
      for (const slot of ['new.normalizedExcerpt', 'newRules[0].normalizedStatement']) {
        assert.ok(
          result.output.includes(
            `D017 authority-text DATA: ${authorityIdentity}#${slot}; expected=1; observed=1`,
          ),
          result.output,
        )
      }
    })

    // D028 additions are counted separately; all original CI2/D017 assertions above remain.
    const r34Identity = 'authority-registry/src/r34-migrations.ts'
    const r34Path = join(root, r34Identity)
    const r34Source = readFileSync(r34Path, 'utf8')
    const r34Leaves = [
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[0].prior.path',
        start: 51750,
        end: 51809,
        raw: "'plugins/foreman-line/docs/goals/foreman-kernel/charter.md'",
        value: 'plugins/foreman-line/docs/goals/foreman-kernel/charter.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[0].current.path',
        start: 52200,
        end: 52259,
        raw: "'plugins/foreman-line/docs/goals/foreman-kernel/charter.md'",
        value: 'plugins/foreman-line/docs/goals/foreman-kernel/charter.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[1].prior.path',
        start: 69685,
        end: 69757,
        raw: "'plugins/foreman-line/docs/goals/foreman-kernel/plan-review-findings.md'",
        value: 'plugins/foreman-line/docs/goals/foreman-kernel/plan-review-findings.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[1].current.path',
        start: 70170,
        end: 70242,
        raw: "'plugins/foreman-line/docs/goals/foreman-kernel/plan-review-findings.md'",
        value: 'plugins/foreman-line/docs/goals/foreman-kernel/plan-review-findings.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[2].prior.path',
        start: 76253,
        end: 76319,
        raw: "'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md'",
        value: 'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[2].current.path',
        start: 76717,
        end: 76783,
        raw: "'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md'",
        value: 'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[3].prior.path',
        start: 82707,
        end: 82753,
        raw: "'plugins/foreman-line/docs/SPEC-CONVENTION.md'",
        value: 'plugins/foreman-line/docs/SPEC-CONVENTION.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[3].current.path',
        start: 83161,
        end: 83207,
        raw: "'plugins/foreman-line/docs/SPEC-CONVENTION.md'",
        value: 'plugins/foreman-line/docs/SPEC-CONVENTION.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[4].prior.path',
        start: 90139,
        end: 90189,
        raw: "'plugins/foreman-line/docs/COORDINATOR-PATTERN.md'",
        value: 'plugins/foreman-line/docs/COORDINATOR-PATTERN.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[4].current.path',
        start: 90612,
        end: 90662,
        raw: "'plugins/foreman-line/docs/COORDINATOR-PATTERN.md'",
        value: 'plugins/foreman-line/docs/COORDINATOR-PATTERN.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[5].prior.path',
        start: 93745,
        end: 93788,
        raw: "'plugins/foreman-line/skills/goal/SKILL.md'",
        value: 'plugins/foreman-line/skills/goal/SKILL.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[5].current.path',
        start: 94202,
        end: 94245,
        raw: "'plugins/foreman-line/skills/goal/SKILL.md'",
        value: 'plugins/foreman-line/skills/goal/SKILL.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[6].prior.path',
        start: 96220,
        end: 96284,
        raw: "'plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md'",
        value: 'plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[6].current.path',
        start: 96696,
        end: 96760,
        raw: "'plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md'",
        value: 'plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[7].prior.path',
        start: 98297,
        end: 98361,
        raw: "'plugins/foreman-line/skills/parcel-driven-development/SKILL.md'",
        value: 'plugins/foreman-line/skills/parcel-driven-development/SKILL.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[7].current.path',
        start: 98778,
        end: 98842,
        raw: "'plugins/foreman-line/skills/parcel-driven-development/SKILL.md'",
        value: 'plugins/foreman-line/skills/parcel-driven-development/SKILL.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[8].prior.path',
        start: 123242,
        end: 123290,
        raw: "'plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md'",
        value: 'plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[8].current.path',
        start: 123697,
        end: 123745,
        raw: "'plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md'",
        value: 'plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[9].prior.path',
        start: 132602,
        end: 132643,
        raw: "'plugins/foreman-line/approval/README.md'",
        value: 'plugins/foreman-line/approval/README.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[9].current.path',
        start: 133048,
        end: 133089,
        raw: "'plugins/foreman-line/approval/README.md'",
        value: 'plugins/foreman-line/approval/README.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[10].prior.path',
        start: 135314,
        end: 135385,
        raw: "'plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json'",
        value: 'plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[10].current.path',
        start: 135804,
        end: 135875,
        raw: "'plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json'",
        value: 'plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[11].prior.path',
        start: 138912,
        end: 138962,
        raw: "'plugins/foreman-line/spec-linter/src/validate.ts'",
        value: 'plugins/foreman-line/spec-linter/src/validate.ts',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[11].current.path',
        start: 139379,
        end: 139429,
        raw: "'plugins/foreman-line/spec-linter/src/validate.ts'",
        value: 'plugins/foreman-line/spec-linter/src/validate.ts',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[12].prior.path',
        start: 141590,
        end: 141635,
        raw: "'plugins/foreman-line/spec-linter/src/cli.ts'",
        value: 'plugins/foreman-line/spec-linter/src/cli.ts',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[12].current.path',
        start: 142046,
        end: 142091,
        raw: "'plugins/foreman-line/spec-linter/src/cli.ts'",
        value: 'plugins/foreman-line/spec-linter/src/cli.ts',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[13].prior.path',
        start: 144204,
        end: 144248,
        raw: "'plugins/foreman-line/spec-linter/README.md'",
        value: 'plugins/foreman-line/spec-linter/README.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[13].current.path',
        start: 144672,
        end: 144716,
        raw: "'plugins/foreman-line/spec-linter/README.md'",
        value: 'plugins/foreman-line/spec-linter/README.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[14].prior.path',
        start: 147183,
        end: 147250,
        raw: "'plugins/foreman-line/permission-profiles/permission-profiles.yaml'",
        value: 'plugins/foreman-line/permission-profiles/permission-profiles.yaml',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[14].current.path',
        start: 147671,
        end: 147738,
        raw: "'plugins/foreman-line/permission-profiles/permission-profiles.yaml'",
        value: 'plugins/foreman-line/permission-profiles/permission-profiles.yaml',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[15].prior.path',
        start: 156504,
        end: 156559,
        raw: "'plugins/foreman-line/permission-profiles/src/types.ts'",
        value: 'plugins/foreman-line/permission-profiles/src/types.ts',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[15].current.path',
        start: 156980,
        end: 157035,
        raw: "'plugins/foreman-line/permission-profiles/src/types.ts'",
        value: 'plugins/foreman-line/permission-profiles/src/types.ts',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[16].prior.path',
        start: 157928,
        end: 157987,
        raw: "'plugins/foreman-line/permission-profiles/src/validator.ts'",
        value: 'plugins/foreman-line/permission-profiles/src/validator.ts',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[16].current.path',
        start: 158412,
        end: 158471,
        raw: "'plugins/foreman-line/permission-profiles/src/validator.ts'",
        value: 'plugins/foreman-line/permission-profiles/src/validator.ts',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[17].prior.path',
        start: 160816,
        end: 160868,
        raw: "'plugins/foreman-line/permission-profiles/README.md'",
        value: 'plugins/foreman-line/permission-profiles/README.md',
      },
      {
        declaration: 'R34_SOURCE_MIGRATIONS',
        slot: '[17].current.path',
        start: 161300,
        end: 161352,
        raw: "'plugins/foreman-line/permission-profiles/README.md'",
        value: 'plugins/foreman-line/permission-profiles/README.md',
      },
      {
        declaration: 'R34_ITEM_MIGRATIONS',
        slot: '[570].prior.normalizedExcerpt',
        start: 434367,
        end: 434661,
        raw: "'- **`risk:`** — **Required.** One of `low | standard | elevated | critical`. Declared risk level, set at shaping time, human-approved (not agent-inferred). Consumed by CI audit-trigger rules and model-routing tier selection. Values are per `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md` §6.'",
        value:
          '- **`risk:`** — **Required.** One of `low | standard | elevated | critical`. Declared risk level, set at shaping time, human-approved (not agent-inferred). Consumed by CI audit-trigger rules and model-routing tier selection. Values are per `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md` §6.',
      },
      {
        declaration: 'R34_ITEM_MIGRATIONS',
        slot: '[570].current.normalizedExcerpt',
        start: 435298,
        end: 435698,
        raw: "'- **`risk:`** — **Required.** One of `low | standard | elevated | critical`. Declared risk level, set at shaping time, approved under the applicable authority: OM-PAN-001 uses its ratified rubric and independent review floor; other goals require human approval. Consumed by CI audit-trigger rules and model-routing tier selection. Values are per `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md` §6.'",
        value:
          '- **`risk:`** — **Required.** One of `low | standard | elevated | critical`. Declared risk level, set at shaping time, approved under the applicable authority: OM-PAN-001 uses its ratified rubric and independent review floor; other goals require human approval. Consumed by CI audit-trigger rules and model-routing tier selection. Values are per `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md` §6.',
      },
      {
        declaration: 'R34_ITEM_MIGRATIONS',
        slot: '[657].prior.normalizedExcerpt',
        start: 487910,
        end: 488502,
        raw: '\'Extracted 2026-07-15 from five shipped Foreman Line parcels (W0-P1, PCC-P0, W0-P3, W0-P4, SEC-1) and ratified by Clint. This is the generalized charter for the role the carryover docs call "the Coordinator (D4)." The parcel-mechanics half of the pattern is documented in `plugins/foreman-line/skills/parcel-driven-development/`; this charter adds the pieces that methodology never formalized: the upstream ideation stage, the plan-level review, the human-gate model, and the long-running loop that holds it all together. Entry point: the `/goal` skill (`plugins/foreman-line/skills/goal/`).\'',
        value:
          'Extracted 2026-07-15 from five shipped Foreman Line parcels (W0-P1, PCC-P0, W0-P3, W0-P4, SEC-1) and ratified by Clint. This is the generalized charter for the role the carryover docs call "the Coordinator (D4)." The parcel-mechanics half of the pattern is documented in `plugins/foreman-line/skills/parcel-driven-development/`; this charter adds the pieces that methodology never formalized: the upstream ideation stage, the plan-level review, the human-gate model, and the long-running loop that holds it all together. Entry point: the `/goal` skill (`plugins/foreman-line/skills/goal/`).',
      },
      {
        declaration: 'R34_ITEM_MIGRATIONS',
        slot: '[657].current.normalizedExcerpt',
        start: 489094,
        end: 489686,
        raw: '\'Extracted 2026-07-15 from five shipped Foreman Line parcels (W0-P1, PCC-P0, W0-P3, W0-P4, SEC-1) and ratified by Clint. This is the generalized charter for the role the carryover docs call "the Coordinator (D4)." The parcel-mechanics half of the pattern is documented in `plugins/foreman-line/skills/parcel-driven-development/`; this charter adds the pieces that methodology never formalized: the upstream ideation stage, the plan-level review, the human-gate model, and the long-running loop that holds it all together. Entry point: the `/goal` skill (`plugins/foreman-line/skills/goal/`).\'',
        value:
          'Extracted 2026-07-15 from five shipped Foreman Line parcels (W0-P1, PCC-P0, W0-P3, W0-P4, SEC-1) and ratified by Clint. This is the generalized charter for the role the carryover docs call "the Coordinator (D4)." The parcel-mechanics half of the pattern is documented in `plugins/foreman-line/skills/parcel-driven-development/`; this charter adds the pieces that methodology never formalized: the upstream ideation stage, the plan-level review, the human-gate model, and the long-running loop that holds it all together. Entry point: the `/goal` skill (`plugins/foreman-line/skills/goal/`).',
      },
      {
        declaration: 'R34_ITEM_MIGRATIONS',
        slot: '[684].prior.normalizedExcerpt',
        start: 509665,
        end: 510539,
        raw: '\'Three dispatch mechanics rules, all earned: every dispatch - including rework - opens with a Step 0 restate-and-stop gate; the branch/worktree is named in the directive, never ambient; and rework directives mandate "every X," never "the listed X" - the findings are a floor, not a ceiling, and no role is exempt from the sweep, including the coordinator (lesson #16). Every builder/reviewer kickstarter includes the standing constraints by reference (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`). For architecture/risk parcels, run **two independent adversarial reviews** (lesson #12: two frontier reviews of W0-P4 agreed on every focus question and only one found the blocker). Where reviews disagree, the coordinator reproduces the disputed finding before triaging - the reproduction is the tie-breaker at triage and the closure proof at acceptance.\'',
        value:
          'Three dispatch mechanics rules, all earned: every dispatch - including rework - opens with a Step 0 restate-and-stop gate; the branch/worktree is named in the directive, never ambient; and rework directives mandate "every X," never "the listed X" - the findings are a floor, not a ceiling, and no role is exempt from the sweep, including the coordinator (lesson #16). Every builder/reviewer kickstarter includes the standing constraints by reference (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`). For architecture/risk parcels, run **two independent adversarial reviews** (lesson #12: two frontier reviews of W0-P4 agreed on every focus question and only one found the blocker). Where reviews disagree, the coordinator reproduces the disputed finding before triaging - the reproduction is the tie-breaker at triage and the closure proof at acceptance.',
      },
      {
        declaration: 'R34_ITEM_MIGRATIONS',
        slot: '[684].current.normalizedExcerpt',
        start: 511084,
        end: 512098,
        raw: '\'Three dispatch mechanics rules, all earned: every dispatch - including rework - opens with a Step 0 scope check; under OM-PAN-001 an exact admitted match proceeds on coordinator validation without a human prompt, and outside it the restate-and-stop gate remains; the branch/worktree is named in the directive, never ambient; and rework directives mandate "every X," never "the listed X" - the findings are a floor, not a ceiling, and no role is exempt from the sweep, including the coordinator (lesson #16). Every builder/reviewer kickstarter includes the standing constraints by reference (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`). For architecture/risk parcels, run **two independent adversarial reviews** (lesson #12: two frontier reviews of W0-P4 agreed on every focus question and only one found the blocker). Where reviews disagree, the coordinator reproduces the disputed finding before triaging - the reproduction is the tie-breaker at triage and the closure proof at acceptance.\'',
        value:
          'Three dispatch mechanics rules, all earned: every dispatch - including rework - opens with a Step 0 scope check; under OM-PAN-001 an exact admitted match proceeds on coordinator validation without a human prompt, and outside it the restate-and-stop gate remains; the branch/worktree is named in the directive, never ambient; and rework directives mandate "every X," never "the listed X" - the findings are a floor, not a ceiling, and no role is exempt from the sweep, including the coordinator (lesson #16). Every builder/reviewer kickstarter includes the standing constraints by reference (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`). For architecture/risk parcels, run **two independent adversarial reviews** (lesson #12: two frontier reviews of W0-P4 agreed on every focus question and only one found the blocker). Where reviews disagree, the coordinator reproduces the disputed finding before triaging - the reproduction is the tie-breaker at triage and the closure proof at acceptance.',
      },
      {
        declaration: 'R34_RULE_MIGRATIONS',
        slot: '[265].prior.normalizedStatement',
        start: 1231857,
        end: 1232151,
        raw: "'- **`risk:`** — **Required.** One of `low | standard | elevated | critical`. Declared risk level, set at shaping time, human-approved (not agent-inferred). Consumed by CI audit-trigger rules and model-routing tier selection. Values are per `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md` §6.'",
        value:
          '- **`risk:`** — **Required.** One of `low | standard | elevated | critical`. Declared risk level, set at shaping time, human-approved (not agent-inferred). Consumed by CI audit-trigger rules and model-routing tier selection. Values are per `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md` §6.',
      },
      {
        declaration: 'R34_RULE_MIGRATIONS',
        slot: '[265].current.normalizedStatement',
        start: 1234516,
        end: 1234810,
        raw: "'- **`risk:`** — **Required.** One of `low | standard | elevated | critical`. Declared risk level, set at shaping time, human-approved (not agent-inferred). Consumed by CI audit-trigger rules and model-routing tier selection. Values are per `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md` §6.'",
        value:
          '- **`risk:`** — **Required.** One of `low | standard | elevated | critical`. Declared risk level, set at shaping time, human-approved (not agent-inferred). Consumed by CI audit-trigger rules and model-routing tier selection. Values are per `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md` §6.',
      },
      {
        declaration: 'R34_RULE_MIGRATIONS',
        slot: '[315].prior.normalizedStatement',
        start: 1282687,
        end: 1283561,
        raw: '\'Three dispatch mechanics rules, all earned: every dispatch - including rework - opens with a Step 0 restate-and-stop gate; the branch/worktree is named in the directive, never ambient; and rework directives mandate "every X," never "the listed X" - the findings are a floor, not a ceiling, and no role is exempt from the sweep, including the coordinator (lesson #16). Every builder/reviewer kickstarter includes the standing constraints by reference (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`). For architecture/risk parcels, run **two independent adversarial reviews** (lesson #12: two frontier reviews of W0-P4 agreed on every focus question and only one found the blocker). Where reviews disagree, the coordinator reproduces the disputed finding before triaging - the reproduction is the tie-breaker at triage and the closure proof at acceptance.\'',
        value:
          'Three dispatch mechanics rules, all earned: every dispatch - including rework - opens with a Step 0 restate-and-stop gate; the branch/worktree is named in the directive, never ambient; and rework directives mandate "every X," never "the listed X" - the findings are a floor, not a ceiling, and no role is exempt from the sweep, including the coordinator (lesson #16). Every builder/reviewer kickstarter includes the standing constraints by reference (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`). For architecture/risk parcels, run **two independent adversarial reviews** (lesson #12: two frontier reviews of W0-P4 agreed on every focus question and only one found the blocker). Where reviews disagree, the coordinator reproduces the disputed finding before triaging - the reproduction is the tie-breaker at triage and the closure proof at acceptance.',
      },
      {
        declaration: 'R34_RULE_MIGRATIONS',
        slot: '[315].current.normalizedStatement',
        start: 1285232,
        end: 1286106,
        raw: '\'Three dispatch mechanics rules, all earned: every dispatch - including rework - opens with a Step 0 restate-and-stop gate; the branch/worktree is named in the directive, never ambient; and rework directives mandate "every X," never "the listed X" - the findings are a floor, not a ceiling, and no role is exempt from the sweep, including the coordinator (lesson #16). Every builder/reviewer kickstarter includes the standing constraints by reference (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`). For architecture/risk parcels, run **two independent adversarial reviews** (lesson #12: two frontier reviews of W0-P4 agreed on every focus question and only one found the blocker). Where reviews disagree, the coordinator reproduces the disputed finding before triaging - the reproduction is the tie-breaker at triage and the closure proof at acceptance.\'',
        value:
          'Three dispatch mechanics rules, all earned: every dispatch - including rework - opens with a Step 0 restate-and-stop gate; the branch/worktree is named in the directive, never ambient; and rework directives mandate "every X," never "the listed X" - the findings are a floor, not a ceiling, and no role is exempt from the sweep, including the coordinator (lesson #16). Every builder/reviewer kickstarter includes the standing constraints by reference (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`). For architecture/risk parcels, run **two independent adversarial reviews** (lesson #12: two frontier reviews of W0-P4 agreed on every focus question and only one found the blocker). Where reviews disagree, the coordinator reproduces the disputed finding before triaging - the reproduction is the tie-breaker at triage and the closure proof at acceptance.',
      },
      {
        declaration: 'R34_RULE_MIGRATIONS',
        slot: '[557].current.normalizedStatement',
        start: 1459903,
        end: 1460303,
        raw: "'- **`risk:`** — **Required.** One of `low | standard | elevated | critical`. Declared risk level, set at shaping time, approved under the applicable authority: OM-PAN-001 uses its ratified rubric and independent review floor; other goals require human approval. Consumed by CI audit-trigger rules and model-routing tier selection. Values are per `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md` §6.'",
        value:
          '- **`risk:`** — **Required.** One of `low | standard | elevated | critical`. Declared risk level, set at shaping time, approved under the applicable authority: OM-PAN-001 uses its ratified rubric and independent review floor; other goals require human approval. Consumed by CI audit-trigger rules and model-routing tier selection. Values are per `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md` §6.',
      },
      {
        declaration: 'R34_RULE_MIGRATIONS',
        slot: '[564].current.normalizedStatement',
        start: 1476333,
        end: 1476925,
        raw: '\'Extracted 2026-07-15 from five shipped Foreman Line parcels (W0-P1, PCC-P0, W0-P3, W0-P4, SEC-1) and ratified by Clint. This is the generalized charter for the role the carryover docs call "the Coordinator (D4)." The parcel-mechanics half of the pattern is documented in `plugins/foreman-line/skills/parcel-driven-development/`; this charter adds the pieces that methodology never formalized: the upstream ideation stage, the plan-level review, the human-gate model, and the long-running loop that holds it all together. Entry point: the `/goal` skill (`plugins/foreman-line/skills/goal/`).\'',
        value:
          'Extracted 2026-07-15 from five shipped Foreman Line parcels (W0-P1, PCC-P0, W0-P3, W0-P4, SEC-1) and ratified by Clint. This is the generalized charter for the role the carryover docs call "the Coordinator (D4)." The parcel-mechanics half of the pattern is documented in `plugins/foreman-line/skills/parcel-driven-development/`; this charter adds the pieces that methodology never formalized: the upstream ideation stage, the plan-level review, the human-gate model, and the long-running loop that holds it all together. Entry point: the `/goal` skill (`plugins/foreman-line/skills/goal/`).',
      },
      {
        declaration: 'R34_RULE_MIGRATIONS',
        slot: '[569].current.normalizedStatement',
        start: 1487658,
        end: 1488672,
        raw: '\'Three dispatch mechanics rules, all earned: every dispatch - including rework - opens with a Step 0 scope check; under OM-PAN-001 an exact admitted match proceeds on coordinator validation without a human prompt, and outside it the restate-and-stop gate remains; the branch/worktree is named in the directive, never ambient; and rework directives mandate "every X," never "the listed X" - the findings are a floor, not a ceiling, and no role is exempt from the sweep, including the coordinator (lesson #16). Every builder/reviewer kickstarter includes the standing constraints by reference (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`). For architecture/risk parcels, run **two independent adversarial reviews** (lesson #12: two frontier reviews of W0-P4 agreed on every focus question and only one found the blocker). Where reviews disagree, the coordinator reproduces the disputed finding before triaging - the reproduction is the tie-breaker at triage and the closure proof at acceptance.\'',
        value:
          'Three dispatch mechanics rules, all earned: every dispatch - including rework - opens with a Step 0 scope check; under OM-PAN-001 an exact admitted match proceeds on coordinator validation without a human prompt, and outside it the restate-and-stop gate remains; the branch/worktree is named in the directive, never ambient; and rework directives mandate "every X," never "the listed X" - the findings are a floor, not a ceiling, and no role is exempt from the sweep, including the coordinator (lesson #16). Every builder/reviewer kickstarter includes the standing constraints by reference (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`). For architecture/risk parcels, run **two independent adversarial reviews** (lesson #12: two frontier reviews of W0-P4 agreed on every focus question and only one found the blocker). Where reviews disagree, the coordinator reproduces the disputed finding before triaging - the reproduction is the tie-breaker at triage and the closure proof at acceptance.',
      },
    ]
    const replaceLeaf = (leaf: (typeof r34Leaves)[number], replacement: string) => {
      assert.equal(r34Source.slice(leaf.start, leaf.end), leaf.raw)
      return r34Source.slice(0, leaf.start) + replacement + r34Source.slice(leaf.end)
    }
    const rejectR34 = async (
      name: string,
      content: string,
      reason: RegExp = /D028 R34 DATA|\[class 3\]/,
    ) => {
      await t.test('D028 R34 ' + name, () => {
        assert.notEqual(content, r34Source)
        writeFileSync(r34Path, content)
        try {
          const result = run()
          assert.equal(result.status, 1, result.output)
          assert.match(result.output, reason)
        } finally {
          writeFileSync(r34Path, r34Source)
        }
      })
    }
    for (const leaf of r34Leaves) {
      const name = leaf.declaration + leaf.slot,
        property = leaf.slot.slice(leaf.slot.lastIndexOf('.') + 1)
      await rejectR34(name + ' missing exact leaf', replaceLeaf(leaf, 'null'))
      await rejectR34(
        name + ' changed full value',
        replaceLeaf(leaf, JSON.stringify(leaf.value + ' altered')),
      )
      await rejectR34(
        name + ' duplicate exact property',
        replaceLeaf(leaf, leaf.raw + ', ' + property + ': ' + leaf.raw),
      )
    }
    for (const declaration of [...new Set(r34Leaves.map((leaf) => leaf.declaration))]) {
      const leaf = r34Leaves.find((leaf) => leaf.declaration === declaration)
      assert.ok(leaf)
      const declarationStart = r34Source.indexOf('export const ' + declaration)
      const initializer = r34Source.indexOf(' = [', declarationStart)
      assert.ok(declarationStart >= 0 && initializer > declarationStart)
      await rejectR34(
        declaration + ' executable leaf',
        replaceLeaf(leaf, 'identity(' + leaf.raw + ')'),
      )
      await rejectR34(
        declaration + ' sibling executable use',
        r34Source + '\nresolve(' + leaf.raw + ')\n',
        /\[class 3\]/,
      )
      await rejectR34(
        declaration + ' shadow binding',
        r34Source + '\nfunction shadow() { const ' + declaration + ' = [] }\n',
      )
      await rejectR34(
        declaration + ' indirect initializer',
        r34Source.slice(0, initializer) +
          ' = identity([' +
          r34Source.slice(initializer + 4).replace('\n]\n', '\n])\n'),
      )
      await rejectR34(
        declaration + ' moved owner',
        r34Source.slice(0, declarationStart) +
          r34Source
            .slice(declarationStart)
            .replace('export const ' + declaration, 'const other' + declaration),
      )
    }
    await t.test('D028 R34 missing exact file refuses', () => {
      rmSync(r34Path)
      try {
        const result = run()
        assert.equal(result.status, 1, result.output)
        assert.match(result.output, /D028 R34 DATA: required exact file is absent/)
      } finally {
        writeFileSync(r34Path, r34Source)
      }
    })
    const validatorPath = join(root, 'authority-registry/src/validate.ts')
    const validatorSource = readFileSync(validatorPath, 'utf8')
    const gitCall =
      "runGitText(root, [\n        'cat-file',\n        'blob',\n        `${R34_PRIOR_REGISTRY_COMMIT}:plugins/foreman-line/authority-registry/authority-enforcement-registry.yaml`,\n      ])"
    assert.ok(validatorSource.includes(gitCall))
    const replaceValidator = async (name: string, content: string, reason: RegExp) => {
      await t.test('D028 mechanism ' + name, () => {
        assert.notEqual(content, validatorSource)
        writeFileSync(validatorPath, content)
        try {
          const result = run()
          assert.equal(result.status, 1, result.output)
          assert.match(result.output, reason)
        } finally {
          writeFileSync(validatorPath, validatorSource)
        }
      })
    }
    await replaceValidator(
      'Git argument change',
      validatorSource.replace(gitCall, gitCall.replace("'blob'", "'tree'")),
      /D028 R34 Git pathspec|\[class 3\]/,
    )
    await replaceValidator(
      'Git call duplicate',
      validatorSource.replace(gitCall, gitCall + ', ' + gitCall),
      /D028 R34 Git pathspec|\[class 3\]/,
    )
    await replaceValidator(
      'Git pathspec missing',
      validatorSource.replace(gitCall, "'missing'"),
      /D028 R34 Git pathspec/,
    )
    await replaceValidator(
      'Git predecessor shadow',
      validatorSource + '\nfunction shadowCommit() { const R34_PRIOR_REGISTRY_COMMIT = "fake" }\n',
      /D028 R34 Git pathspec|\[class 3\]/,
    )
    await replaceValidator(
      'Git moved owner',
      validatorSource.replace(
        'function r34RepositoryCorrespondenceViolations(',
        'function otherRepositoryCorrespondence(',
      ),
      /D028 R34 Git pathspec|\[class 3\]/,
    )
    await replaceValidator(
      'Git sibling call',
      validatorSource + '\nfunction unrelated(root: string) { return ' + gitCall + ' }\n',
      /\[class 3\]/,
    )
    await replaceValidator(
      'Git reader shadow',
      validatorSource.replace(
        gitCall,
        '(function() { const runGitText = fake; return ' + gitCall + ' })()',
      ),
      /D028 R34 Git pathspec|\[class 3\]/,
    )
    const rootCall = 'const root = resolve(repoRoot)'
    const sweepStart = validatorSource.indexOf('function sweepRegistrySubject(')
    const rootStart = validatorSource.indexOf(rootCall, sweepStart)
    assert.ok(sweepStart >= 0 && rootStart > sweepStart)
    const changeRoot = (replacement: string) =>
      validatorSource.slice(0, rootStart) +
      replacement +
      validatorSource.slice(rootStart + rootCall.length)
    await replaceValidator(
      'root argument change',
      changeRoot('const root = resolve(otherRoot)'),
      /class-5|\[class 5\]/,
    )
    await replaceValidator(
      'root duplicate',
      changeRoot(rootCall + '\n const anotherRoot = resolve(repoRoot)'),
      /class-5|\[class 5\]/,
    )
    await replaceValidator('root missing', changeRoot('const root = repoRoot'), /class-5/)
    await replaceValidator(
      'root shadow',
      changeRoot('const repoRoot = "fake"\n' + rootCall),
      /class-5|\[class 5\]/,
    )
    await replaceValidator(
      'root moved owner',
      validatorSource.replace('function sweepRegistrySubject(', 'function otherSweepSubject('),
      /class-5|\[class 5\]/,
    )
    await replaceValidator(
      'root sibling normalization',
      validatorSource + '\nfunction siblingRoot(repoRoot: string) { return resolve(repoRoot) }\n',
      /class-5|\[class 5\]/,
    )
    await replaceValidator(
      'root defaulted input',
      validatorSource.slice(0, sweepStart) +
        validatorSource.slice(sweepStart).replace('repoRoot: string,', 'repoRoot: string = ".",'),
      /class-5|\[class 5\]/,
    )
    await t.test('D028 restored 49 data leaves and both mechanisms pass', () => {
      assert.equal(readFileSync(r34Path, 'utf8'), r34Source)
      assert.equal(readFileSync(validatorPath, 'utf8'), validatorSource)
      const result = run()
      assert.equal(result.status, 0, result.output)
      for (const leaf of r34Leaves)
        assert.ok(
          result.output.includes(
            'D028 R34 DATA: ' + leaf.declaration + leaf.slot + '; expected=1; observed=1',
          ),
          result.output,
        )
    })
  } finally {
    measure()
    console.log(`CI2_FOCUSED_FIXTURE_PEAK_BYTES ${peakBytes}; budget=${fixtureBudgetBytes}`)
    rmSync(scratch, { recursive: true, force: true })
  }
})
