/**
 * RCM-P1 AC11 + review amendment A2 / F4: purity. A static scan of both new
 * source files for forbidden constructs and permitted imports, plus a
 * runtime probe that replaces ambient clock/randomness/network/timer/process
 * globals with throwing stubs and confirms `readCatalogSnapshot`/
 * `projectEligibility` are unaffected.
 *
 * F4 rework: the original scanner blocked specific call *shapes*
 * (`Date.now(`, `Math.random(`, ...), which the adversarial review defeated
 * with aliasing (`const D = Date; D.now()`), computed/bracket access
 * (`Date['now']()`, `globalThis['Da'+'te']`), `Reflect`-based indirection,
 * and bare/wildcard imports the old scanner never looked at
 * (`import 'fs'`, `export * from 'node:os'`, an extra `randomBytes` import
 * riding next to the permitted `createHash`). This version instead:
 *   1. strips comments first, so prose mentioning these words can't
 *      false-positive and hostile code hidden in a comment can't
 *      false-negative (comments never execute anyway);
 *   2. bans a closed set of dangerous globals as bare identifiers, matched
 *      anywhere in the code regardless of how they're invoked (aliasing,
 *      computed access, and indirection through `Reflect` all still contain
 *      the bare name somewhere);
 *   3. special-cases `Date`: the only allowed shapes are `Date.parse(...)`
 *      and `new Date(<non-empty, non-spread argument>)` — every other
 *      appearance of the bare word `Date` (bracket access, aliasing,
 *      argument-less construction, `new Date(...spread)`) is forbidden;
 *   4. extends the import/export scanner to catch bare `import 'x'` and
 *      `export * from 'x'`, and to check the *exact* named bindings pulled
 *      from each permitted specifier, not just the specifier string.
 *
 * Builder judgment call (flagged in the completion claim, as in the prior
 * round): the Constraints text says these two new modules may import only
 * `node:crypto` and type-only imports, which taken strictly per-file would
 * make the spec's own "eligibility.ts re-exports the reader surface"
 * instruction impossible. This scanner allows exactly one additional
 * specifier for `eligibility.ts`: a relative import/re-export of its own
 * sibling `./catalog-snapshot.js`, with its named bindings checked against
 * an exact expected set — no other external, ambient, or cross-package
 * import is permitted in either file.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { isReaderIssuedSnapshot, readCatalogSnapshot } from '../src/catalog-snapshot.js'
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
// Comment stripping — applied before every other check
// ---------------------------------------------------------------------------

/**
 * Removes `/* ... *\/` block comments and `// ...` line comments. Not a full
 * tokenizer (a `//` or `/*` inside a string literal would be mishandled),
 * but sufficient for these two specific, reviewed source files, which
 * contain no such string content.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

// ---------------------------------------------------------------------------
// Import/export specifier scan, with per-specifier named-binding allowlists
// ---------------------------------------------------------------------------

interface ImportClause {
  readonly specifier: string
  /** Names inside `{ ... }`, or `['*']` for a bare/wildcard clause with no braces. */
  readonly bindings: readonly string[]
}

/**
 * Finds every `import`/`export ... from` clause, including forms the
 * original scanner missed: a bare side-effect `import 'x'` (no `from`, no
 * bindings) and `export * from 'x'` (wildcard re-export). Handles clauses
 * that span multiple lines (a multi-line named-import list) by collecting
 * lines until a `from '...'` is found.
 */
function findImportClauses(source: string): ImportClause[] {
  const clauses: ImportClause[] = []
  const lines = source.split('\n')

  const bareImport = /^import\s+['"]([^'"]+)['"]/
  const exportStar = /^export\s+\*(?:\s+as\s+[A-Za-z_$][\w$]*)?\s+from\s+['"]([^'"]+)['"]/
  const clauseStart = /^import\b|^export\s+(type\s+)?\{|^export\s+\*/

  let buffer: string | null = null
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (buffer === null) {
      const bare = bareImport.exec(line)
      if (bare?.[1] && !line.includes(' from ')) {
        clauses.push({ specifier: bare[1], bindings: ['*'] })
        continue
      }
      const star = exportStar.exec(line)
      if (star?.[1]) {
        clauses.push({ specifier: star[1], bindings: ['*'] })
        continue
      }
      if (clauseStart.test(line)) {
        buffer = line
      } else {
        continue
      }
    } else {
      buffer = `${buffer}\n${line}`
    }

    const fromMatch = /from\s+['"]([^'"]+)['"]/.exec(buffer)
    if (fromMatch?.[1]) {
      const braceStart = buffer.indexOf('{')
      const braceEnd = buffer.lastIndexOf('}')
      const bindings =
        braceStart >= 0 && braceEnd > braceStart
          ? buffer
              .slice(braceStart + 1, braceEnd)
              .split(',')
              .map((entry) => entry.trim().replace(/^type\s+/, ''))
              .map((entry) => entry.split(/\s+as\s+/)[0]?.trim() ?? entry)
              .filter((entry) => entry.length > 0)
          : ['*']
      clauses.push({ specifier: fromMatch[1], bindings })
      buffer = null
    }
  }
  return clauses
}

test('AC11: catalog-snapshot.ts imports only node:crypto, and only createHash from it', () => {
  const clauses = findImportClauses(catalogSnapshotSource)
  assert.deepEqual(
    clauses.map((c) => c.specifier),
    ['node:crypto'],
  )
  assert.deepEqual(clauses[0]?.bindings, ['createHash'])
})

test('AC11: eligibility.ts imports only its sibling ./catalog-snapshot.js, and only the expected re-export surface', () => {
  const clauses = findImportClauses(eligibilitySource)
  assert.deepEqual(
    clauses.map((c) => c.specifier),
    ['./catalog-snapshot.js'],
  )
  assert.deepEqual(
    [...(clauses[0]?.bindings ?? [])].sort(),
    [
      'CatalogSnapshot',
      'ModelRecord',
      'ProviderRecord',
      'SnapshotReadResult',
      'SnapshotRefusalCode',
      'isReaderIssuedSnapshot',
      'isValidBaseUrl',
      'readCatalogSnapshot',
    ].sort(),
  )
})

// F4 positive controls: bare/wildcard import forms the prior scanner missed entirely.
test('F4 positive control: a bare side-effect import (e.g. import "fs") is detected as an extra specifier', () => {
  const hostile = `import 'fs'\nimport { createHash } from 'node:crypto'`
  const clauses = findImportClauses(hostile)
  assert.deepEqual(clauses.map((c) => c.specifier).sort(), ['fs', 'node:crypto'])
})

test('F4 positive control: export * from an unauthorized module is detected as an extra specifier', () => {
  const hostile = `import { createHash } from 'node:crypto'\nexport * from 'node:os'`
  const clauses = findImportClauses(hostile)
  assert.deepEqual(clauses.map((c) => c.specifier).sort(), ['node:crypto', 'node:os'])
})

test('F4 positive control: an extra named binding (randomBytes) riding next to createHash is detected', () => {
  const hostile = `import { createHash, randomBytes } from 'node:crypto'`
  const clauses = findImportClauses(hostile)
  assert.deepEqual(clauses[0]?.bindings, ['createHash', 'randomBytes'])
  assert.notDeepEqual(clauses[0]?.bindings, ['createHash'])
})

// ---------------------------------------------------------------------------
// Bare dangerous-global bans (F4): matched anywhere, regardless of how the
// name is invoked -- aliasing, computed/bracket access, and Reflect-based
// indirection all still contain the bare identifier somewhere in the text.
// ---------------------------------------------------------------------------

const BANNED_BARE_IDENTIFIERS: readonly string[] = [
  // capitalized
  'Math',
  'Reflect',
  'Function',
  'Proxy',
  // lowercase
  'process',
  'global',
  'globalThis',
  'fetch',
  'XMLHttpRequest',
  'require',
  'eval',
  'setTimeout',
  'setInterval',
  'setImmediate',
  'queueMicrotask',
  'performance',
  'module',
  'exports',
  '__dirname',
  '__filename',
  // coordinator closure-check follow-up: other clock/randomness/ambient
  // sources the original list omitted
  'Intl',
  'Temporal',
  'navigator',
  'WebAssembly',
  'Atomics',
  'SharedArrayBuffer',
  'structuredClone',
  'Worker',
]

function bareIdentifierPattern(name: string): RegExp {
  return new RegExp(`\\b${name}\\b`)
}

for (const identifier of BANNED_BARE_IDENTIFIERS) {
  for (const source of SOURCES) {
    test(`AC11: ${source.name} never references the bare identifier ${identifier}`, () => {
      assert.equal(bareIdentifierPattern(identifier).test(stripComments(source.text)), false)
    })
  }
}

/**
 * The global `crypto` (Web Crypto: `crypto.getRandomValues`,
 * `crypto.randomUUID`) is a distinct ambient-randomness source from the
 * `node:crypto` module this parcel legitimately imports `createHash` from.
 * A plain `\bcrypto\b` ban would also match the "crypto" inside the string
 * `'node:crypto'`, so this uses a negative lookbehind to exclude only that
 * exact "node:crypto" occurrence -- a bare `crypto` reference anywhere else
 * (including right next to a real node:crypto import) is still caught.
 */
const GLOBAL_CRYPTO_PATTERN = /(?<!node:)\bcrypto\b/

/** `import.meta` needs its own pattern: `\b` around a literal `.` needs care, and it is not a simple identifier. */
const IMPORT_META_PATTERN = /\bimport\s*\.\s*meta\b/

for (const source of SOURCES) {
  test(`AC11: ${source.name} never references the global crypto (only node:crypto import)`, () => {
    assert.equal(GLOBAL_CRYPTO_PATTERN.test(stripComments(source.text)), false)
  })
  test(`AC11: ${source.name} never references import.meta`, () => {
    assert.equal(IMPORT_META_PATTERN.test(stripComments(source.text)), false)
  })
}

/**
 * `Date.parse(...)` (any argument count) and `new Date(<non-empty,
 * non-spread argument>)` are the only allowed appearances of `Date`. Strips
 * both from the text, then checks whether the bare word `Date` still
 * appears anywhere. `new Date()` (empty) and `new Date(...x)` (spread first
 * argument) are deliberately NOT stripped, so they remain caught.
 */
function hasDisallowedDateReference(code: string): boolean {
  let stripped = code.replace(/\bDate\.parse\s*\([^)]*\)/g, '')
  stripped = stripped.replace(/\bnew\s+Date\s*\(\s*([^.)][^)]*)\)/g, '')
  return /\bDate\b/.test(stripped)
}

// F4 positive controls: every construct the review named, shown as caught
// (or, for the one explicitly-allowed shape, shown as NOT caught).
const DATE_PROBE_CASES: { name: string; code: string; shouldCatch: boolean }[] = [
  { name: 'Date.now()', code: 'const t = Date.now()', shouldCatch: true },
  {
    name: "globalThis['Da'+'te'].now()",
    code: "const t = globalThis['Da' + 'te'].now()",
    shouldCatch: true,
  },
  { name: "Date['now']()", code: "const t = Date['now']()", shouldCatch: true },
  {
    name: 'aliased const D = Date; D.now()',
    code: 'const D = Date\nconst t = D.now()',
    shouldCatch: true,
  },
  {
    name: "Reflect.get(Date, 'now')",
    code: "const t = Reflect.get(Date, 'now').call(Date)",
    shouldCatch: true,
  },
  { name: 'new Date without parentheses', code: 'const t = new Date', shouldCatch: true },
  { name: 'argument-less new Date()', code: 'const t = new Date()', shouldCatch: true },
  { name: 'new Date(...[]) spread', code: 'const t = new Date(...[])', shouldCatch: true },
  {
    name: 'new Date(...args) spread',
    code: 'const args: number[] = []\nconst t = new Date(...args)',
    shouldCatch: true,
  },
  { name: 'performance.now()', code: 'const t = performance.now()', shouldCatch: true },
  { name: "performance['now']()", code: "const t = performance['now']()", shouldCatch: true },
  { name: 'setTimeout(', code: 'setTimeout(() => {}, 0)', shouldCatch: true },
  { name: 'setInterval(', code: 'setInterval(() => {}, 0)', shouldCatch: true },
  { name: 'setImmediate(', code: 'setImmediate(() => {})', shouldCatch: true },
  { name: 'queueMicrotask(', code: 'queueMicrotask(() => {})', shouldCatch: true },
  {
    name: "new Function('return Date.now()')",
    code: "const f = new Function('return Date.now()')",
    shouldCatch: true,
  },
  {
    name: "env via globalThis['proc'+'ess']",
    code: "const e = globalThis['proc' + 'ess'].env",
    shouldCatch: true,
  },
  {
    name: 'randomBytes import from node:crypto',
    code: "import { createHash, randomBytes } from 'node:crypto'",
    shouldCatch: true,
  },
  { name: "export * from 'node:os'", code: "export * from 'node:os'", shouldCatch: true },
  { name: "bare import 'fs'", code: "import 'fs'", shouldCatch: true },
  { name: '[3,1] bracket sort', code: "const s = [3, 1]['sort']()", shouldCatch: true },
  { name: '.sort(', code: 'const s = [3, 1].sort()', shouldCatch: true },
  { name: '.toSorted(', code: 'const s = [3, 1].toSorted()', shouldCatch: true },
  { name: '.localeCompare(', code: "const c = 'a'.localeCompare('b')", shouldCatch: true },
  // Negative control (team-lead flag-1 ruling): a non-empty, non-spread
  // argument to `new Date(` is explicitly allowed and must NOT be flagged.
  {
    name: 'new Date(undefined as any) -- allowed, not a clock read',
    code: 'const t = new Date(undefined as any)',
    shouldCatch: false,
  },
  { name: 'Date.parse(value) -- allowed', code: 'const t = Date.parse(value)', shouldCatch: false },
  { name: 'new Date(ms) -- allowed', code: 'const t = new Date(ms)', shouldCatch: false },
  // Coordinator closure-check follow-up: other clock/randomness/ambient sources.
  {
    name: 'Intl.DateTimeFormat().format() reads the clock with no argument',
    code: 'const t = new Intl.DateTimeFormat().format()',
    shouldCatch: true,
  },
  { name: 'Temporal.Now.instant()', code: 'const t = Temporal.Now.instant()', shouldCatch: true },
  {
    name: 'global crypto.getRandomValues()',
    code: 'const r = crypto.getRandomValues(new Uint8Array(4))',
    shouldCatch: true,
  },
  { name: 'global crypto.randomUUID()', code: 'const id = crypto.randomUUID()', shouldCatch: true },
  { name: 'navigator', code: 'const ua = navigator.userAgent', shouldCatch: true },
  { name: 'WebAssembly', code: 'const m = WebAssembly.Module', shouldCatch: true },
  { name: 'Atomics', code: 'const v = Atomics.load(x, 0)', shouldCatch: true },
  { name: 'SharedArrayBuffer', code: 'const b = new SharedArrayBuffer(8)', shouldCatch: true },
  { name: 'structuredClone', code: 'const c = structuredClone(x)', shouldCatch: true },
  { name: 'Worker', code: 'const w = new Worker(url)', shouldCatch: true },
  { name: 'import.meta', code: 'const u = import.meta.url', shouldCatch: true },
  // Negative control: the legitimate node:crypto import must NOT be flagged
  // as a global crypto reference (the lookbehind exclusion works).
  {
    name: "import { createHash } from 'node:crypto' -- allowed, not the global crypto",
    code: "import { createHash } from 'node:crypto'",
    shouldCatch: false,
  },
]

/** Every check this file runs against real source, applied to one code snippet. */
function scanSnippetForForbiddenConstructs(code: string): boolean {
  const stripped = stripComments(code)
  for (const identifier of BANNED_BARE_IDENTIFIERS) {
    if (bareIdentifierPattern(identifier).test(stripped)) return true
  }
  if (hasDisallowedDateReference(stripped)) return true
  if (GLOBAL_CRYPTO_PATTERN.test(stripped)) return true
  if (IMPORT_META_PATTERN.test(stripped)) return true
  if (/\.sort\s*\(/.test(stripped)) return true
  if (/\.toSorted\s*\(/.test(stripped)) return true
  if (/\.localeCompare\s*\(/.test(stripped)) return true
  if (/\[\s*['"]sort['"]\s*\]/.test(stripped)) return true
  if (/\[\s*['"]toSorted['"]\s*\]/.test(stripped)) return true
  if (/\[\s*['"]localeCompare['"]\s*\]/.test(stripped)) return true
  const clauses = findImportClauses(stripped)
  for (const clause of clauses) {
    if (clause.specifier === 'node:crypto') {
      if (clause.bindings.length !== 1 || clause.bindings[0] !== 'createHash') return true
    } else if (clause.specifier === './catalog-snapshot.js') {
      // specifier itself is fine; a real extra-binding check runs against the actual file above
    } else {
      return true // any other specifier at all is forbidden
    }
  }
  return false
}

for (const probeCase of DATE_PROBE_CASES) {
  test(`F4 positive control: ${probeCase.name} is ${probeCase.shouldCatch ? 'caught' : 'allowed'}`, () => {
    assert.equal(scanSnippetForForbiddenConstructs(probeCase.code), probeCase.shouldCatch)
  })
}

test('AC11: catalog-snapshot.ts has no disallowed Date reference', () => {
  assert.equal(hasDisallowedDateReference(stripComments(catalogSnapshotSource)), false)
})

test('AC11: eligibility.ts has no disallowed Date reference', () => {
  assert.equal(hasDisallowedDateReference(stripComments(eligibilitySource)), false)
})

test('F4: Date.parse() with no argument cannot read the clock (returns NaN)', () => {
  // biome-ignore lint/suspicious/noExplicitAny: intentionally calling with zero arguments to prove it cannot read the clock
  const result = (Date.parse as any)()
  assert.equal(Number.isNaN(result), true)
})

// ---------------------------------------------------------------------------
// Other forbidden literal strings (host files / default config)
// ---------------------------------------------------------------------------

const FORBIDDEN_LITERAL_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'MCP', pattern: /\bMCP\b/ },
  { name: 'models-store.json', pattern: /models-store\.json/ },
  { name: 'settings.json', pattern: /\bsettings\.json\b/ },
  { name: 'pi-openrouter-routing.json', pattern: /pi-openrouter-routing\.json/ },
  { name: 'PI_OPENROUTER_ROUTING', pattern: /PI_OPENROUTER_ROUTING/ },
]

for (const forbidden of FORBIDDEN_LITERAL_PATTERNS) {
  for (const source of SOURCES) {
    test(`AC11: ${source.name} contains no "${forbidden.name}"`, () => {
      assert.equal(forbidden.pattern.test(stripComments(source.text)), false)
    })
  }
}

for (const source of SOURCES) {
  test(`AC11: ${source.name} has no .sort/.toSorted/.localeCompare (dot or bracket form)`, () => {
    const stripped = stripComments(source.text)
    assert.equal(/\.sort\s*\(/.test(stripped), false)
    assert.equal(/\.toSorted\s*\(/.test(stripped), false)
    assert.equal(/\.localeCompare\s*\(/.test(stripped), false)
    assert.equal(/\[\s*['"]sort['"]\s*\]/.test(stripped), false)
    assert.equal(/\[\s*['"]toSorted['"]\s*\]/.test(stripped), false)
    assert.equal(/\[\s*['"]localeCompare['"]\s*\]/.test(stripped), false)
  })
}

// ---------------------------------------------------------------------------
// Runtime hostile-stub probe (A2 extends the stub set)
// ---------------------------------------------------------------------------

test('AC11 / A2: read and project still succeed and are deep-equal on repeated calls with fetch/Date/Math.random/performance.now/setTimeout/setInterval/setImmediate throwing and process.env trapped', () => {
  const fixturePath = join(here, 'fixtures', 'catalog-snapshot', 'baseline.v1.json')
  const fixtureBytes = readFileSync(fixturePath)

  // Independent digest, computed before any global is touched.
  const digest = createHash('sha256').update(fixtureBytes).digest('hex')

  const originalFetch = globalThis.fetch
  const originalDate = globalThis.Date
  const originalMathRandom = Math.random
  const originalPerformanceNow = globalThis.performance?.now
  const originalSetTimeout = globalThis.setTimeout
  const originalSetInterval = globalThis.setInterval
  const originalSetImmediate = globalThis.setImmediate
  const originalEnv = Object.getOwnPropertyDescriptor(process, 'env')

  function throwingFetch(): never {
    throw new Error('purity probe: fetch must never be called')
  }
  // Only blocks the two ambient-clock-reading shapes (Date.now, and
  // argument-less `new Date()`). Date.parse(explicitArg) and
  // `new Date(explicitArg)` are inherited unchanged from the real Date and
  // still work -- they cannot read the ambient clock (proven separately
  // above), and this file's own source code legitimately calls both.
  class ThrowingDate extends originalDate {
    // biome-ignore lint/suspicious/noExplicitAny: variadic passthrough to the real Date constructor
    constructor(...args: any[]) {
      if (args.length === 0) {
        throw new Error('purity probe: argument-less Date construction must never happen')
      }
      super(...(args as []))
    }
    static override now(): never {
      throw new Error('purity probe: Date.now must never be called')
    }
  }
  function throwingRandom(): never {
    throw new Error('purity probe: Math.random must never be called')
  }
  function throwingTimer(): never {
    throw new Error('purity probe: a timer function must never be called')
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
    // biome-ignore lint/suspicious/noExplicitAny: replacing globals with throwing stubs for the duration of this probe
    ;(globalThis as any).fetch = throwingFetch
    // biome-ignore lint/suspicious/noExplicitAny: replacing globals with throwing stubs for the duration of this probe
    ;(globalThis as any).Date = ThrowingDate
    Math.random = throwingRandom
    if (globalThis.performance) {
      // biome-ignore lint/suspicious/noExplicitAny: replacing globals with throwing stubs for the duration of this probe
      ;(globalThis.performance as any).now = throwingTimer
    }
    // biome-ignore lint/suspicious/noExplicitAny: replacing globals with throwing stubs for the duration of this probe
    ;(globalThis as any).setTimeout = throwingTimer
    // biome-ignore lint/suspicious/noExplicitAny: replacing globals with throwing stubs for the duration of this probe
    ;(globalThis as any).setInterval = throwingTimer
    // biome-ignore lint/suspicious/noExplicitAny: replacing globals with throwing stubs for the duration of this probe
    ;(globalThis as any).setImmediate = throwingTimer
    Object.defineProperty(process, 'env', { value: throwingEnv, configurable: true })

    const readResultA = readCatalogSnapshot(fixtureBytes, digest)
    assert.equal(readResultA.ok, true)
    if (!readResultA.ok) throw new Error('unreachable')
    assert.equal(isReaderIssuedSnapshot(readResultA.snapshot), true)

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
    globalThis.Date = originalDate
    Math.random = originalMathRandom
    if (globalThis.performance && originalPerformanceNow) {
      globalThis.performance.now = originalPerformanceNow
    }
    globalThis.setTimeout = originalSetTimeout
    globalThis.setInterval = originalSetInterval
    globalThis.setImmediate = originalSetImmediate
    if (originalEnv) {
      Object.defineProperty(process, 'env', originalEnv)
    }
  }
})
