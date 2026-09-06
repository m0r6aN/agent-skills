/**
 * AC5: chain-level semantic invariants via `validateChain`, each with a
 * passing and a rejecting fixture. AC6: `isSealed`.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import type { ReceiptDocument } from '../src/types.js'
import { isSealed, validateChain } from '../src/validator.js'

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

function loadChain(dirName: string): ReceiptDocument[] {
  const dir = join(fixturesDir, dirName)
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')) as ReceiptDocument)
}

test('accepts the valid sealed chain fixture', () => {
  const result = validateChain(loadChain('chain-sealed'))
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

test('accepts the valid unsealed chain fixture', () => {
  const result = validateChain(loadChain('chain-unsealed'))
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

// AC5a: sequence values are exactly 0..N-1, contiguous, no gaps or duplicates.
test('AC5a: rejects a chain with a sequence gap', () => {
  const result = validateChain(loadChain('chain-reject-sequence-gap'))
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('sequence values must be exactly')))
})

// AC5b: receipts[i].prevHash === receipts[i-1].hash.
test('AC5b: rejects a chain with a prevHash pointer mismatch', () => {
  const result = validateChain(loadChain('chain-reject-prevhash-mismatch'))
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('does not match')))
})

// AC5c: every receipt shares an identical workflowId and correlationId.
test('AC5c: rejects a chain with a correlation mismatch', () => {
  const result = validateChain(loadChain('chain-reject-correlation-mismatch'))
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('diverges')))
})

// AC5d (rework amendment): validateChain never throws on malformed members;
// they are excluded per-comparison and reported via their schema violations.
test('AC5d: a scalar-JSON member does not throw — reported via schema violations, no spurious chain violations', () => {
  const result = validateChain(loadChain('chain-reject-scalar-member'))
  assert.equal(result.valid, false)
  assert.ok(
    result.errors.some((e) => e.includes('receipts[2]') && e.includes('must be object')),
    JSON.stringify(result.errors),
  )
  // The valid members must not be blamed: no contiguity/prevHash/correlation noise.
  assert.ok(!result.errors.some((e) => e.includes('sequence values must be exactly')))
  assert.ok(!result.errors.some((e) => e.includes('does not match')))
  assert.ok(!result.errors.some((e) => e.includes('diverges')))
})

test('AC5d: a null-correlation member does not throw — reported via schema violations', () => {
  const result = validateChain(loadChain('chain-reject-null-correlation'))
  assert.equal(result.valid, false)
  assert.ok(
    result.errors.some((e) => e.includes('/correlation') && e.includes('must be object')),
    JSON.stringify(result.errors),
  )
  // It still participates in the comparisons its present fields support.
  assert.ok(!result.errors.some((e) => e.includes('diverges')))
})

// AC5d (rework amendment): the library verdict for an empty chain is invalid,
// matching the ratified CLI semantics (the CLI's exit-2 usage error pre-empts
// this path for directory input; this protects direct consumers like W3).
test('AC5d: validateChain([]) is invalid — chain contains no receipts', () => {
  const result = validateChain([])
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('chain contains no receipts')))
})

// AC6, tightened by FL-R1-A1: structural validity and terminal closure identity.
test('AC6: isSealed is true for a valid terminal stage-F ClosureRecord', () => {
  assert.equal(isSealed(loadChain('chain-sealed')), true)
})

test('AC6: isSealed is false when the highest-sequence receipt is not stage F', () => {
  assert.equal(isSealed(loadChain('chain-unsealed')), false)
})

test('FL-R1 AC-1: an empty chain is unsealed', () => {
  assert.equal(isSealed([]), false)
})

const nonSealingTips: readonly [string, Partial<ReceiptDocument>][] = [
  [
    'half-closed claim',
    { kind: 'claim', claimRef: 'stage-f-half-closed', subjectKind: 'HalfClosedClosure' },
  ],
  ['wrong kind with ClosureRecord subject', { kind: 'claim', claimRef: 'closure-claim' }],
  ['stage receipt with HalfClosedClosure subject', { subjectKind: 'HalfClosedClosure' }],
  ['stage receipt with another subject', { subjectKind: 'IntegrationResult' }],
  ['ClosureRecord outside stage F', { stage: 'E' }],
]

for (const [name, overrides] of nonSealingTips) {
  test(`FL-R1 AC-2: a structurally valid ${name} is unsealed`, () => {
    const chain = loadChain('chain-sealed')
    const tip = chain.pop()
    assert.ok(tip)
    chain.push({ ...tip, ...overrides })
    const validation = validateChain(chain)
    assert.equal(validation.valid, true, JSON.stringify(validation.errors))
    assert.equal(isSealed(chain), false)
  })
}

const invalidPrefixes: readonly [string, Partial<ReceiptDocument>, string][] = [
  ['duplicate sequence', { sequence: 0 }, 'sequence values must be exactly'],
  ['pointer mismatch', { prevHash: '0'.repeat(64) }, 'does not match'],
  ['schema violation', { timestamp: 'invalid' }, '/timestamp'],
  ['claimRef invariant violation', { claimRef: 'not-null' }, 'claimRef must be null'],
]

for (const [name, overrides, error] of invalidPrefixes) {
  test(`FL-R1 AC-3: appending ClosureRecord cannot seal a ${name}`, () => {
    const chain = loadChain('chain-sealed')
    const prior = chain[1]
    assert.ok(prior)
    chain[1] = { ...prior, ...overrides }
    const validation = validateChain(chain)
    assert.equal(validation.valid, false)
    assert.ok(validation.errors.some((message) => message.includes(error)))
    assert.equal(isSealed(chain), false)
  })
}

test('FL-R1 AC-3: a terminal ClosureRecord with a sequence gap cannot seal', () => {
  const chain = loadChain('chain-sealed')
  const tip = chain.pop()
  assert.ok(tip)
  chain.push({ ...tip, sequence: tip.sequence + 1 })
  const validation = validateChain(chain)
  assert.equal(validation.valid, false)
  assert.ok(
    validation.errors.some((message) => message.includes('sequence values must be exactly')),
  )
  assert.equal(isSealed(chain), false)
})

for (const key of ['workflowId', 'correlationId'] as const) {
  test(`FL-R1 AC-3: appending ClosureRecord cannot seal a divergent ${key}`, () => {
    const chain = loadChain('chain-sealed')
    const prior = chain[1]
    assert.ok(prior)
    chain[1] = {
      ...prior,
      correlation: { ...prior.correlation, [key]: '99999999-9999-9999-9999-999999999999' },
    }
    const validation = validateChain(chain)
    assert.equal(validation.valid, false)
    assert.ok(validation.errors.some((message) => message.includes('diverges')))
    assert.equal(isSealed(chain), false)
  })
}

for (const malformed of [null, 42, { correlation: null }]) {
  test(`FL-R1 AC-3: malformed member ${JSON.stringify(malformed)} cannot be sealed by F`, () => {
    const chain = loadChain('chain-sealed')
    chain[1] = malformed as unknown as ReceiptDocument
    assert.equal(validateChain(chain).valid, false)
    assert.equal(isSealed(chain), false)
  })
}

test('FL-R1 AC-4: half-closed retries seal only when a terminal ClosureRecord is appended', () => {
  const chain = loadChain('chain-sealed')
  const closure = chain.pop()
  assert.ok(closure)
  const halfClosed: ReceiptDocument = {
    ...closure,
    kind: 'claim',
    claimRef: 'stage-f-half-closed',
    subjectKind: 'HalfClosedClosure',
  }
  const retry: ReceiptDocument = {
    ...halfClosed,
    sequence: halfClosed.sequence + 1,
    prevHash: halfClosed.hash,
    hash: 'd'.repeat(64),
  }
  for (const claim of [halfClosed, retry]) {
    chain.push(claim)
    const validation = validateChain(chain)
    assert.equal(validation.valid, true, JSON.stringify(validation.errors))
    assert.equal(isSealed(chain), false)
  }
  chain.push({
    ...closure,
    sequence: retry.sequence + 1,
    prevHash: retry.hash,
    hash: 'e'.repeat(64),
  })
  const validation = validateChain(chain)
  assert.equal(validation.valid, true, JSON.stringify(validation.errors))
  assert.equal(isSealed(chain), true)
})

test('FL-R1 AC-1: an earlier ClosureRecord does not seal a nonterminal tip', () => {
  const chain = loadChain('chain-sealed')
  const closure = chain[chain.length - 1]
  assert.ok(closure)
  chain.push({ ...closure, stage: 'E', sequence: closure.sequence + 1, prevHash: closure.hash })
  const validation = validateChain(chain)
  assert.equal(validation.valid, true, JSON.stringify(validation.errors))
  assert.equal(isSealed(chain), false)
})

// Step 0 ratification: single-file directory validates as a trivial chain.
test('a single-file chain is valid iff the lone receipt is a genesis', () => {
  const validGenesis = validateChain(loadChain('chain-single-genesis'))
  assert.equal(validGenesis.valid, true, JSON.stringify(validGenesis.errors))

  const invalidNonGenesis = validateChain(loadChain('chain-single-nongenesis'))
  assert.equal(invalidNonGenesis.valid, false)
})
