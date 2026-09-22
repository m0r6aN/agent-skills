/**
 * RCM-P1 AC11: purity. A static scan of both new source files for forbidden
 * constructs and permitted imports, plus a runtime probe that replaces
 * ambient clock/randomness/network/process globals with throwing stubs and
 * confirms `readCatalogSnapshot`/`projectEligibility` are unaffected.
 *
 * Builder judgment call (flagged in the completion claim): the Constraints
 * section says these two new modules may import only `node:crypto` and
 * type-only imports. Taken as a strict per-file rule that would make the
 * spec's own instruction that `eligibility.ts` "re-exports the reader
 * surface" impossible, since a value re-export of `readCatalogSnapshot`
 * necessarily requires a value import from its sibling module. This test
 * therefore allows exactly one additional specifier for `eligibility.ts`:
 * a relative import/re-export of `./catalog-snapshot.js`, its own sibling
 * inside this same two-file parcel — no other external, ambient, or
 * cross-package import is permitted in either file.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { readCatalogSnapshot } from '../src/catalog-snapshot.js'
import { projectEligibility } from '../src/eligibility.js'

const here = dirname(fileURLToPath(import.meta.url))
const srcDir = join(here, '..', 'src')
const catalogSnapshotSource = readFileSync(join(srcDir, 'catalog-snapshot.ts'), 'utf8')
const eligibilitySource = readFileSync(join(srcDir, 'eligibility.ts'), 'utf8')

const SOURCES: { name: string; text: string }[] = [
  { name: 'catalog-snapshot.ts', text: catalogSnapshotSource },
  { name: 'eligibility.ts', text: eligibilitySource },
]

// ---------------------------------------------------------------------------
// Permitted imports
// ---------------------------------------------------------------------------

/** Every `import ... from '...'` / `export { ... } from '...'` module specifier, in order. */
function moduleSpecifiers(source: string): string[] {
  const specifiers: string[] = []
  const lines = source.split('\n')
  let collecting = false
  const startPattern = /^(import\s|import\{)|^export\s+(type\s+)?\{/
  for (const line of lines) {
    const trimmed = line.trim()
    if (!collecting && startPattern.test(trimmed)) {
      collecting = true
    }
    if (collecting) {
      const match = /from\s+['"]([^'"]+)['"]/.exec(line)
      if (match?.[1] !== undefined) {
        specifiers.push(match[1])
        collecting = false
      }
    }
  }
  return specifiers
}

test('AC11: catalog-snapshot.ts imports only node:crypto', () => {
  assert.deepEqual(moduleSpecifiers(catalogSnapshotSource), ['node:crypto'])
})

test('AC11: eligibility.ts imports only its sibling ./catalog-snapshot.js', () => {
  assert.deepEqual(moduleSpecifiers(eligibilitySource), ['./catalog-snapshot.js'])
})

// ---------------------------------------------------------------------------
// Forbidden constructs
// ---------------------------------------------------------------------------

const FORBIDDEN_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'Date.now()', pattern: /\bDate\.now\s*\(/ },
  { name: 'argument-less new Date()', pattern: /new\s+Date\s*\(\s*\)/ },
  { name: 'performance.now()', pattern: /\bperformance\s*\.\s*now\s*\(/ },
  { name: 'Math.random()', pattern: /\bMath\.random\s*\(/ },
  { name: 'setTimeout', pattern: /\bsetTimeout\s*\(/ },
  { name: 'setInterval', pattern: /\bsetInterval\s*\(/ },
  { name: 'process member access', pattern: /\bprocess\s*[.[]/ },
  { name: 'fetch(', pattern: /\bfetch\s*\(/ },
  { name: 'XMLHttpRequest', pattern: /\bXMLHttpRequest\b/ },
  { name: 'require(', pattern: /\brequire\s*\(/ },
  { name: 'dynamic import(', pattern: /\bimport\s*\(/ },
  { name: 'node:fs', pattern: /node:fs/ },
  { name: 'node:http(s)', pattern: /node:https?\b/ },
  { name: 'node:net', pattern: /node:net\b/ },
  { name: 'node:dns', pattern: /node:dns\b/ },
  { name: 'node:child_process', pattern: /node:child_process/ },
  { name: 'MCP', pattern: /\bMCP\b/ },
  { name: 'models-store.json', pattern: /models-store\.json/ },
  { name: 'settings.json', pattern: /\bsettings\.json\b/ },
  { name: 'pi-openrouter-routing.json', pattern: /pi-openrouter-routing\.json/ },
  { name: 'PI_OPENROUTER_ROUTING', pattern: /PI_OPENROUTER_ROUTING/ },
  { name: '.sort(', pattern: /\.sort\s*\(/ },
  { name: '.toSorted(', pattern: /\.toSorted\s*\(/ },
  { name: '.localeCompare(', pattern: /\.localeCompare\s*\(/ },
]

for (const forbidden of FORBIDDEN_PATTERNS) {
  for (const source of SOURCES) {
    test(`AC11: ${source.name} contains no "${forbidden.name}"`, () => {
      assert.equal(forbidden.pattern.test(source.text), false)
    })
  }
}

// ---------------------------------------------------------------------------
// Runtime hostile-stub probe
// ---------------------------------------------------------------------------

test('AC11: read and project still succeed and are deep-equal on repeated calls with fetch/Date.now/Math.random throwing and process.env trapped', () => {
  const fixturePath = join(here, 'fixtures', 'catalog-snapshot', 'baseline.v1.json')
  const fixtureBytes = readFileSync(fixturePath)

  // Independent digest, computed before any global is touched.
  // (node:crypto import lives in this test file only, not the scanned modules.)
  const digest = createHash('sha256').update(fixtureBytes).digest('hex')

  const originalFetch = globalThis.fetch
  const originalDateNow = Date.now
  const originalMathRandom = Math.random
  const originalEnv = Object.getOwnPropertyDescriptor(process, 'env')

  function throwingFetch(): never {
    throw new Error('purity probe: fetch must never be called')
  }
  function throwingDateNow(): never {
    throw new Error('purity probe: Date.now must never be called')
  }
  function throwingRandom(): never {
    throw new Error('purity probe: Math.random must never be called')
  }
  const throwingEnv = new Proxy(
    {},
    {
      get(): never {
        throw new Error('purity probe: process.env must never be read')
      },
    },
  )

  try {
    // biome-ignore lint/suspicious/noExplicitAny: replacing a global with a throwing stub for the duration of this probe
    ;(globalThis as any).fetch = throwingFetch
    Date.now = throwingDateNow
    Math.random = throwingRandom
    Object.defineProperty(process, 'env', { value: throwingEnv, configurable: true })

    const readResultA = readCatalogSnapshot(fixtureBytes, digest)
    assert.equal(readResultA.ok, true)
    if (!readResultA.ok) throw new Error('unreachable')

    const request = {
      snapshot: readResultA.snapshot,
      approvedConfig: {
        authorityRef: 'purity-probe',
        endpoints: [{ provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1' }],
      },
      evaluationTimeUtc: '2026-09-21T13:00:00.000Z',
      identities: [{ provider: 'openrouter', id: 'z-ai/glm-5.3' }],
    }

    const projectionA = projectEligibility(request)
    assert.equal(projectionA.ok, true)

    // Repeat both calls; results must be deep-equal (pure, no hidden state).
    const readResultB = readCatalogSnapshot(fixtureBytes, digest)
    const projectionB = projectEligibility(request)

    assert.deepEqual(readResultB, readResultA)
    assert.deepEqual(projectionB, projectionA)
  } finally {
    if (originalFetch === undefined) {
      // biome-ignore lint/suspicious/noExplicitAny: restoring a global after the probe
      delete (globalThis as any).fetch
    } else {
      globalThis.fetch = originalFetch
    }
    Date.now = originalDateNow
    Math.random = originalMathRandom
    if (originalEnv) {
      Object.defineProperty(process, 'env', originalEnv)
    }
  }
})
