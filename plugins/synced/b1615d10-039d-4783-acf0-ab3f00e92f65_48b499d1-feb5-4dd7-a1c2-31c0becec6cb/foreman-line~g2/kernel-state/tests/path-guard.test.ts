/**
 * C7 path/symlink escape (AC7): all 18 rows refuse with
 * `STORAGE_PATH_REFUSED` + their named reasonCode, in-root links included.
 * Privilege rule (FK-P2 OQ-5 pattern): junction cases MUST execute (the chain
 * hard-fails otherwise); file-symlink cases may skip only as machine-readable
 * `blocked: <privilege reason>` gap records, never counted as passed.
 */
import assert from 'node:assert/strict'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { driverCodeOf, StorageError } from '../src/errors.js'
import {
  type CheckedTarget,
  checkTarget,
  formRefusalReason,
  verifyOpenedTarget,
} from '../src/path-guard.js'

const HERE = dirname(fileURLToPath(import.meta.url))

interface PathRecord {
  id: string
  input:
    | string
    | string[]
    | { scenario: string; tree?: unknown; open?: string; substitute?: string }
  expectedCode: string
  expectedReasonCode: string | string[]
}

interface LinkRecord {
  id: string
  input: {
    scenario: string
    tree: {
      dirs?: string[]
      files?: string[]
      links?: { path: string; target: string; kind: string }[]
    }
    open: string
    substitute?: string
  }
  expectedCode: string
  expectedReasonCode: string
}

const PATHS = JSON.parse(readFileSync(join(HERE, 'fixtures', 'hostile', 'paths.json'), 'utf8')) as {
  records: PathRecord[]
}
const LINKS = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'hostile', 'link-trees.json'), 'utf8'),
) as {
  records: LinkRecord[]
}

function pathRecord(id: string): PathRecord {
  const found = PATHS.records.find((candidate) => candidate.id === id)
  assert.ok(found, `${id} missing from paths.json`)
  return found
}

function linkRecord(id: string): LinkRecord {
  const found = LINKS.records.find((candidate) => candidate.id === id)
  assert.ok(found, `${id} missing from link-trees.json`)
  return found
}

function expectPathRefusal(fn: () => unknown, reasonCode: string): void {
  try {
    fn()
  } catch (error) {
    assert.ok(error instanceof StorageError, `expected StorageError, got ${String(error)}`)
    assert.equal(error.code, 'STORAGE_PATH_REFUSED')
    assert.equal(error.diagnostic.reasonCode, reasonCode)
    return
  }
  throw new Error(`expected STORAGE_PATH_REFUSED(${reasonCode})`)
}

test('PATH-01..13: every form dimension refuses with its named reasonCode', () => {
  const formRows = PATHS.records.filter((candidate) => candidate.id.startsWith('PATH-'))
  assert.equal(formRows.length, 13)
  for (const row of formRows) {
    assert.equal(row.expectedCode, 'STORAGE_PATH_REFUSED', row.id)
    const inputs = Array.isArray(row.input) ? row.input : [row.input as string]
    const reasons = Array.isArray(row.expectedReasonCode)
      ? row.expectedReasonCode
      : [row.expectedReasonCode]
    assert.equal(inputs.length, reasons.length, `${row.id}: sample/reason alignment`)
    for (let i = 0; i < inputs.length; i += 1) {
      const sample = inputs[i] as string
      const reason = reasons[i] as string
      assert.equal(formRefusalReason(sample), reason, `${row.id} sample ${i}`)
      // And the same refusal crosses the API boundary as a typed error.
      expectPathRefusal(() => checkTarget({ rootAbs: tmpdir(), relative: sample }), reason)
    }
  }
})

test('PATH-14: final file symlink target refuses (skip-and-record on privilege)', () => {
  const row = linkRecord('PATH-14')
  assert.equal(row.expectedCode, 'STORAGE_PATH_REFUSED')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-link14-'))
  writeFileSync(join(root, 'target.db'), 'target bytes')
  try {
    symlinkSync(join(root, 'target.db'), join(root, 'state.db'))
  } catch (error) {
    // Machine-readable gap record — never counted as passed (FK-P2 OQ-5).
    const reason = driverCodeOf(error) ?? 'unknown'
    console.log(
      JSON.stringify({
        gap: true,
        id: row.id,
        blocked: `privilege: file-symlink creation denied (${reason})`,
      }),
    )
    rmSync(root, { recursive: true, force: true })
    return
  }
  expectPathRefusal(
    () => checkTarget({ rootAbs: root, relative: row.input.open }),
    row.expectedReasonCode,
  )
  rmSync(root, { recursive: true, force: true })
})

test('PATH-15: out-of-root junction component refuses with outside-root (must execute)', () => {
  const row = linkRecord('PATH-15')
  assert.equal(row.expectedReasonCode, 'outside-root')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-link15-'))
  const outside = mkdtempSync(join(tmpdir(), 'fkp9-link15o-'))
  writeFileSync(join(outside, 'state.db'), 'outside')
  // Junction creation is unprivileged on Windows: this case MUST execute.
  symlinkSync(outside, join(root, 'sub'), 'junction')
  expectPathRefusal(
    () => checkTarget({ rootAbs: root, relative: row.input.open }),
    row.expectedReasonCode,
  )
  rmSync(root, { recursive: true, force: true })
  rmSync(outside, { recursive: true, force: true })
})

test('PATH-16: in-root junction component refuses with link-component (must execute)', () => {
  const row = linkRecord('PATH-16')
  assert.equal(row.expectedReasonCode, 'link-component')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-link16-'))
  mkdirSync(join(root, 'real'))
  writeFileSync(join(root, 'real', 'state.db'), 'real')
  symlinkSync(join(root, 'real'), join(root, 'sub'), 'junction')
  expectPathRefusal(
    () => checkTarget({ rootAbs: root, relative: row.input.open }),
    row.expectedReasonCode,
  )
  rmSync(root, { recursive: true, force: true })
})

test('PATH-17: final target that is a directory refuses with not-regular', () => {
  const row = linkRecord('PATH-17')
  assert.equal(row.expectedReasonCode, 'not-regular')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-link17-'))
  mkdirSync(join(root, 'state.db'))
  expectPathRefusal(
    () => checkTarget({ rootAbs: root, relative: row.input.open }),
    row.expectedReasonCode,
  )
  rmSync(root, { recursive: true, force: true })
})

test('PATH-18: opened-target substitution race is caught by the re-verify contract', () => {
  const row = linkRecord('PATH-18')
  assert.equal(row.expectedReasonCode, 'link-target')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-link18-'))
  writeFileSync(join(root, 'state.db'), 'original target')
  const checked: CheckedTarget = checkTarget({ rootAbs: root, relative: row.input.open })
  // Substitute the checked target between check and open.
  unlinkSync(join(root, 'state.db'))
  writeFileSync(join(root, 'state.db'), 'substituted target with different bytes')
  expectPathRefusal(() => verifyOpenedTarget(checked), row.expectedReasonCode)
  rmSync(root, { recursive: true, force: true })
})

test('precedence edges: the documented first-failure order is what fires', () => {
  // 1 unpaired-surrogate beats 2 control-char.
  assert.equal(
    formRefusalReason(`${String.fromCharCode(0xd800)}${String.fromCharCode(1)}x`),
    'unpaired-surrogate',
  )
  // 2 control-char beats 3 format-char.
  assert.equal(
    formRefusalReason(`${String.fromCharCode(1)}${String.fromCharCode(0x202e)}x`),
    'control-char',
  )
  // 4 absolute (drive) beats 5 backslash.
  assert.equal(formRefusalReason(`C:${String.fromCharCode(92)}x`), 'absolute')
  // 5 backslash beats 8 traversal.
  assert.equal(formRefusalReason(`..${String.fromCharCode(92)}x`), 'backslash')
  // 6 encoded-escape beats 7 ads-colon (colon at position 0 is not a drive form).
  assert.equal(formRefusalReason(':x%2e'), 'encoded-escape')
  // 9 reserved-name beats 10 short-name (first segment first).
  assert.equal(formRefusalReason('CON/x~'), 'reserved-name')
  // 11 trailing-dot-space beats 12 non-nfc within one segment.
  assert.equal(formRefusalReason(`x${String.fromCharCode(0x0301)}.`), 'trailing-dot-space')
})

test('non-nfc forms refuse with non-nfc (machine gap: none of the 18 rows names it)', () => {
  const nfd = `e${String.fromCharCode(0x0301)}`
  assert.equal(formRefusalReason(`${nfd}/state.db`), 'non-nfc')
  expectPathRefusal(
    () => checkTarget({ rootAbs: tmpdir(), relative: `${nfd}/state.db` }),
    'non-nfc',
  )
})

test('all 16 reason literals are exercised across the dimension set', () => {
  const exercised = new Set<string>()
  for (const row of PATHS.records) {
    const reasons = Array.isArray(row.expectedReasonCode)
      ? row.expectedReasonCode
      : [row.expectedReasonCode]
    for (const reason of reasons) exercised.add(reason)
  }
  for (const row of LINKS.records) exercised.add(row.expectedReasonCode)
  exercised.add('non-nfc')
  assert.deepEqual([...exercised].sort(), [
    'absolute',
    'ads-colon',
    'backslash',
    'control-char',
    'encoded-escape',
    'format-char',
    'link-component',
    'link-target',
    'non-nfc',
    'not-regular',
    'outside-root',
    'reserved-name',
    'short-name',
    'trailing-dot-space',
    'traversal',
    'unpaired-surrogate',
  ])
})

test('failing-when-broken: refusals bind to their named dimension (#32)', () => {
  // Mutate the fixture input in the named dimension and the refusal vanishes.
  assert.equal(formRefusalReason(pathRecord('PATH-01').input as string), 'traversal')
  assert.equal(formRefusalReason('escape/state.db'), null, 'traversal must be the firing dimension')
  assert.equal(formRefusalReason(pathRecord('PATH-06').input as string), 'backslash')
  assert.equal(formRefusalReason('data/state.db'), null, 'backslash must be the firing dimension')
  assert.equal(formRefusalReason(pathRecord('PATH-10').input as string), 'trailing-dot-space')
  assert.equal(formRefusalReason('state.db'), null, 'trailing dot must be the firing dimension')
  assert.equal(formRefusalReason(pathRecord('PATH-11').input as string), 'encoded-escape')
  assert.equal(
    formRefusalReason('2e2e/state.db'),
    null,
    'percent escape must be the firing dimension',
  )
})
