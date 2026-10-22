import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
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
import { fileURLToPath } from 'node:url'
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
    if (observeReads) args.push('--import', join(scratch, 'observe.mjs'))
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
  } finally {
    measure()
    console.log(`CI2_FOCUSED_FIXTURE_PEAK_BYTES ${peakBytes}; budget=${fixtureBudgetBytes}`)
    rmSync(scratch, { recursive: true, force: true })
  }
})
