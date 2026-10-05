/**
 * Closed error registry (default-deny #30): the registry is exactly the 35
 * named codes, every code is exercised by a named fixture or inline test, and
 * every rejection carries exactly one code with its entry index where the
 * failure is entry-scoped. No partial artifact is ever emitted on rejection.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  compileScope,
  SCOPE_COMPILE_ERROR_CODES,
  ScopeCompileError,
  ScopeIoError,
} from '../src/index.js'

const COVERAGE: Record<string, string> = {
  SPEC_SECTION_MISSING: 'authority.json AUTH-02…AUTH-06',
  SPEC_SECTION_EMPTY: 'authority.json AUTH-07…AUTH-11',
  SPEC_SECTION_DUPLICATE: 'ambiguity.json AMBIG-01, AMBIG-02',
  MISSING_AUTHORITY: 'authority.json AUTH-01, AUTH-12',
  BODY_NOT_UTF8: 'unicode.json UNI-09',
  BODY_TOO_LARGE: 'limits.json LIMIT-01',
  MALFORMED_ENTRY: 'ambiguity.json AMBIG-11, AMBIG-12 (+ ambiguity.test.ts probes)',
  ENTRY_EMPTY: 'ambiguity.json AMBIG-08',
  ENTRY_WHITESPACE: 'ambiguity.json AMBIG-09, AMBIG-10',
  GLOB_ENTRY: 'ambiguity.json AMBIG-03…AMBIG-07',
  ENTRY_ABSOLUTE: 'traversal.json TRAV-13; windows.json WIN-01…WIN-06',
  ENTRY_BACKSLASH: 'separators.json SEP-01, SEP-02, SEP-06; equivalent.json EQUIV-06',
  ENTRY_EMPTY_SEGMENT: 'separators.json SEP-03…SEP-05',
  PATH_TRAVERSAL: 'traversal.json TRAV-01…TRAV-07',
  ENTRY_ENCODED_ESCAPE: 'traversal.json TRAV-08…TRAV-12',
  ENTRY_ADS_COLON: 'windows.json WIN-07, WIN-08 (+ WIN-02 repaired)',
  ENTRY_SHORT_NAME: 'windows.json WIN-13, WIN-14',
  ENTRY_RESERVED_NAME: 'windows.json WIN-12, WIN-15…WIN-18 (+ WIN-06 repaired)',
  ENTRY_TRAILING_DOT_SPACE: 'windows.json WIN-09…WIN-11; equivalent.json EQUIV-03, EQUIV-04',
  ENTRY_NULL_BYTE: 'unicode.json UNI-05',
  ENTRY_CONTROL_CHAR: 'unicode.json UNI-06, UNI-07',
  ENTRY_FORMAT_CHAR: 'unicode.json UNI-02…UNI-04',
  ENTRY_UNPAIRED_SURROGATE: 'unicode.json UNI-08',
  ENTRY_NON_NFC: 'unicode.json UNI-01; equivalent.json EQUIV-02',
  ENTRY_DUPLICATE: 'equivalent.json EQUIV-05 (+ EQUIV-02/03/04 repaired)',
  ENTRY_EQUIVALENT: 'equivalent.json EQUIV-01, EQUIV-07',
  ENTRY_TOO_LONG: 'limits.json LIMIT-02',
  SEGMENT_TOO_LONG: 'limits.json LIMIT-03',
  TOO_MANY_SEGMENTS: 'limits.json LIMIT-04',
  TOO_MANY_ENTRIES: 'limits.json LIMIT-05',
  LINK_ESCAPE: 'link-trees.json LINK-01, LINK-05, LINK-07',
  LINK_IN_ROOT: 'link-trees.json LINK-03, LINK-04, LINK-06',
  LINK_TARGET_RACE: 'link-trees.json LINK-08',
  ENTRY_CONFLICTS_WITH_FORBIDDEN: 'conflicts.json CONF-01, CONF-02',
  GRAMMAR_PIN_MISMATCH: 'grammar-pin.test.ts (inline)',
}

test('registry is closed and exactly 35 named codes', () => {
  assert.equal(SCOPE_COMPILE_ERROR_CODES.length, 35)
  const sorted = [...SCOPE_COMPILE_ERROR_CODES].sort()
  assert.deepEqual(sorted, [...new Set(sorted)])
  assert.deepEqual(Object.keys(COVERAGE).sort(), [...SCOPE_COMPILE_ERROR_CODES].sort())
})

test('every registry code has named fixture or test coverage', () => {
  for (const code of SCOPE_COMPILE_ERROR_CODES) {
    const where = COVERAGE[code]
    assert.ok(typeof where === 'string' && where.length > 0, `uncovered code ${code}`)
  }
})

test('ScopeCompileError carries exactly one registry code and entry coordinates', () => {
  const err = new ScopeCompileError('PATH_TRAVERSAL', 'dot segment', {
    entryIndex: 3,
    entryList: 'allowed',
  })
  assert.ok(SCOPE_COMPILE_ERROR_CODES.includes(err.code))
  assert.equal(err.name, 'ScopeCompileError')
  assert.equal(err.entryIndex, 3)
  assert.equal(err.entryList, 'allowed')
  const bodyLevel = new ScopeCompileError('TOO_MANY_ENTRIES', 'count')
  assert.equal(bodyLevel.entryIndex, null)
  assert.equal(bodyLevel.entryList, null)
})

test('rejection emits no partial artifact (compileScope returns nothing on failure)', () => {
  const spec = [
    '---',
    'ticket: FK-T0',
    'status: active',
    '---',
    '',
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
    '- src/../escape.ts',
    '',
  ].join('\n')
  let returned: unknown = 'unset'
  assert.throws(
    () => {
      returned = compileScope(spec, { specPath: 'docs/specs/x.md' })
    },
    (error: unknown) => {
      assert.ok(error instanceof ScopeCompileError)
      assert.equal(error.code, 'PATH_TRAVERSAL')
      return true
    },
  )
  assert.equal(returned, 'unset')
})

test('ScopeIoError is seam-infrastructure typing, not a registry code', () => {
  const err = new ScopeIoError('disk failed', new Error('EIO'))
  assert.ok(!(err instanceof ScopeCompileError))
  assert.equal(err.name, 'ScopeIoError')
})
