/**
 * PMC-P2 launch-boundary suite — charter A1: the receipt is verified before any
 * inference and the boundary fails closed when it is missing, stale, mismatched
 * against the requested lane, or unsigned by the resolver. The break-glass
 * owner override is owner-only per use and emits a distinctly marked exception
 * receipt naming the bypassed checks.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  issueBreakGlassException,
  LAUNCH_REFUSALS,
  type LaunchVerdict,
  verifyLaunch,
} from '../src/launch-boundary.js'
import { resolveRoute } from '../src/pi-resolver.js'
import { documentDigest, type RouteReceipt, signReceipt } from '../src/route-receipt.js'
import {
  FIXED_ISSUED_AT,
  loadShippedPolicy,
  makeDeclaredPolicy,
  makeRequest,
} from './pi-fixtures.js'

const CONTEXT = { requested_lane: 'L5' as const, at: FIXED_ISSUED_AT, max_age_ms: 60_000 }

function approvedReceipt(): RouteReceipt {
  return resolveRoute(makeDeclaredPolicy(), makeRequest(), { issued_at: FIXED_ISSUED_AT })
}

function refusalNames(verdict: LaunchVerdict): string[] {
  return verdict.refusals.map((refusal) => refusal.name)
}

test('an approved signed receipt passes the launch boundary', () => {
  const verdict = verifyLaunch(approvedReceipt(), CONTEXT)
  assert.equal(verdict.ok, true)
  assert.equal(verdict.mode, 'route')
  assert.deepEqual(verdict.refusals, [])
})

test('missing receipt refuses (A1)', () => {
  for (const absent of [null, undefined, 'receipt', 42, []]) {
    const verdict = verifyLaunch(absent, CONTEXT)
    assert.equal(verdict.ok, false)
    assert.deepEqual(refusalNames(verdict), ['RECEIPT_MISSING_REFUSED'])
  }
})

test('a stop receipt is never launchable (A1: only an approved route receipt)', () => {
  const stopped = resolveRoute(
    loadShippedPolicy(),
    makeRequest({ lane: 'L1', routing_class: 'architecture/risk' }),
    { issued_at: FIXED_ISSUED_AT },
  )
  const verdict = verifyLaunch(stopped, CONTEXT)
  assert.equal(verdict.ok, false)
  assert.ok(refusalNames(verdict).includes('RECEIPT_STATUS_REFUSED'))
})

test('unsigned and tampered receipts refuse (A1)', () => {
  const receipt = approvedReceipt()
  const unsigned: Record<string, unknown> = { ...receipt }
  delete unsigned.signature
  const unsignedVerdict = verifyLaunch(unsigned, CONTEXT)
  assert.equal(unsignedVerdict.ok, false)
  assert.deepEqual(refusalNames(unsignedVerdict), ['RECEIPT_UNSIGNED_REFUSED'])

  const tampered = {
    ...receipt,
    route: { ...receipt.route, primary: { binding_id: 'swapped', model: 'swapped' } },
  }
  const tamperedVerdict = verifyLaunch(tampered, CONTEXT)
  assert.equal(tamperedVerdict.ok, false)
  assert.deepEqual(refusalNames(tamperedVerdict), ['DIGEST_MISMATCH_REFUSED'])
})

test('lane mismatch refuses (A1: mismatched against the requested lane)', () => {
  const verdict = verifyLaunch(approvedReceipt(), { ...CONTEXT, requested_lane: 'L4' })
  assert.equal(verdict.ok, false)
  assert.deepEqual(refusalNames(verdict), ['RECEIPT_LANE_MISMATCH_REFUSED'])
})

test('stale and future receipts refuse against the owner-accepted freshness bound', () => {
  const receipt = approvedReceipt()

  const stale = verifyLaunch(receipt, {
    ...CONTEXT,
    at: '2026-09-26T12:02:00.000Z',
    max_age_ms: 60_000,
  })
  assert.deepEqual(refusalNames(stale), ['FRESHNESS_STALE_REFUSED'])

  const future = verifyLaunch(receipt, { ...CONTEXT, at: '2026-09-26T11:59:00.000Z' })
  assert.deepEqual(refusalNames(future), ['FRESHNESS_FUTURE_REFUSED'])

  const noBound = verifyLaunch(receipt, { ...CONTEXT, max_age_ms: 0 })
  assert.deepEqual(refusalNames(noBound), ['FRESHNESS_STALE_REFUSED'])

  // Re-signed so only the malformed timestamp is under test.
  const badClock = verifyLaunch(signReceipt({ ...receipt, issued_at: 'not-a-timestamp' }), CONTEXT)
  assert.deepEqual(refusalNames(badClock), ['RECEIPT_STATUS_REFUSED'])
})

test('break-glass: owner-only per use, distinctly marked, naming the bypassed checks', () => {
  const issued = issueBreakGlassException({
    requested_by: 'owner',
    owner_authorization: {
      per_use_statement: 'owner authorizes this single bypass of the resolver',
    },
    requested_lane: 'L5',
    bypassed_checks: ['RECEIPT_UNSIGNED_REFUSED', 'FRESHNESS_STALE_REFUSED'],
    reason: 'resolver is broken; parcel must launch under owner override',
    issued_at: FIXED_ISSUED_AT,
  })
  assert.equal(issued.ok, true)
  assert.ok(issued.ok)
  assert.equal(issued.receipt.marking, 'BREAK-GLASS-EXCEPTION')
  assert.deepEqual(issued.receipt.bypassed_checks, [
    'RECEIPT_UNSIGNED_REFUSED',
    'FRESHNESS_STALE_REFUSED',
  ])

  const verdict = verifyLaunch(issued.receipt, CONTEXT)
  assert.equal(verdict.ok, true)
  assert.equal(verdict.mode, 'break-glass')
  // The verdict reports every check this launch skipped — the named ones plus
  // the route-receipt family the exception stands in for (A1: never
  // under-reported).
  assert.deepEqual(verdict.bypassed_checks, [
    'DIGEST_MISMATCH_REFUSED',
    'EVIDENCE_STATE_UNATTESTED',
    'FRESHNESS_STALE_REFUSED',
    'RECEIPT_MISSING_REFUSED',
    'RECEIPT_STATUS_REFUSED',
    'RECEIPT_UNSIGNED_REFUSED',
  ])
})

test('break-glass negatives: never for a coordinator, builder, reviewer, or automated retry', () => {
  for (const requested_by of ['coordinator', 'builder', 'reviewer', 'automated-retry'] as const) {
    const denied = issueBreakGlassException({
      requested_by,
      owner_authorization: { per_use_statement: 'claimed authorization' },
      requested_lane: 'L5',
      bypassed_checks: ['RECEIPT_UNSIGNED_REFUSED'],
      reason: 'attempted override',
      issued_at: FIXED_ISSUED_AT,
    })
    assert.equal(denied.ok, false)
    assert.ok(!denied.ok)
    assert.deepEqual(
      refusalNames({
        ok: false,
        mode: 'break-glass',
        refusals: denied.refusals,
        bypassed_checks: [],
      }),
      ['BREAK_GLASS_DENIED_REFUSED'],
    )
  }

  const noAuthorization = issueBreakGlassException({
    requested_by: 'owner',
    owner_authorization: null,
    requested_lane: 'L5',
    bypassed_checks: ['RECEIPT_UNSIGNED_REFUSED'],
    reason: 'override',
    issued_at: FIXED_ISSUED_AT,
  })
  assert.equal(noAuthorization.ok, false)

  const noChecks = issueBreakGlassException({
    requested_by: 'owner',
    owner_authorization: { per_use_statement: 'owner authorizes' },
    requested_lane: 'L5',
    bypassed_checks: [],
    reason: 'override',
    issued_at: FIXED_ISSUED_AT,
  })
  assert.equal(noChecks.ok, false)

  const noReason = issueBreakGlassException({
    requested_by: 'owner',
    owner_authorization: { per_use_statement: 'owner authorizes' },
    requested_lane: 'L5',
    bypassed_checks: ['RECEIPT_UNSIGNED_REFUSED'],
    reason: '',
    issued_at: FIXED_ISSUED_AT,
  })
  assert.equal(noReason.ok, false)
})

test('break-glass verification negatives: tampered exceptions and smuggled requesters refuse', () => {
  const issued = issueBreakGlassException({
    requested_by: 'owner',
    owner_authorization: { per_use_statement: 'owner authorizes this single bypass' },
    requested_lane: 'L5',
    bypassed_checks: ['RECEIPT_UNSIGNED_REFUSED'],
    reason: 'resolver broken',
    issued_at: FIXED_ISSUED_AT,
  })
  assert.ok(issued.ok)

  const tampered = verifyLaunch({ ...issued.receipt, reason: 'tampered' }, CONTEXT)
  assert.deepEqual(refusalNames(tampered), ['DIGEST_MISMATCH_REFUSED'])

  // Defense in depth: an exception that carries a prohibited requester is
  // refused at verification even when correctly signed.
  const smuggledUnsigned = {
    kind: 'break-glass-exception',
    schema_version: 1,
    resolver: 'break-glass-owner-override@1',
    status: 'exception-approved',
    marking: 'BREAK-GLASS-EXCEPTION',
    requested_by: 'automated-retry',
    owner_authorization: { per_use_statement: 'claimed' },
    requested_lane: 'L5',
    bypassed_checks: ['RECEIPT_UNSIGNED_REFUSED'],
    reason: 'smuggled',
    issued_at: FIXED_ISSUED_AT,
  }
  const smuggled = { ...smuggledUnsigned, signature: documentDigest(smuggledUnsigned) }
  const smuggledVerdict = verifyLaunch(smuggled, CONTEXT)
  assert.equal(smuggledVerdict.ok, false)
  assert.deepEqual(refusalNames(smuggledVerdict), ['BREAK_GLASS_DENIED_REFUSED'])
})

test('the launch boundary never re-opens evidence claims (A6): status is static-conformance only', () => {
  const receipt = approvedReceipt()
  assert.equal(receipt.attested_state, 'static-conformance')
  // The verdict carries no availability/quality claim of its own.
  const verdict = verifyLaunch(receipt, CONTEXT)
  assert.deepEqual(verdict, { ok: true, mode: 'route', refusals: [], bypassed_checks: [] })
  // A policy mutation cannot smuggle an attested state past the receipt.
  const smuggled = { ...receipt, attested_state: 'live-availability' }
  const smuggledVerdict = verifyLaunch(smuggled, { ...CONTEXT, requested_lane: 'L5' })
  assert.equal(smuggledVerdict.ok, false)
  assert.deepEqual(refusalNames(smuggledVerdict), [
    'EVIDENCE_STATE_UNATTESTED',
    'DIGEST_MISMATCH_REFUSED',
  ])
})

test('F7: a re-signed smuggled attested state is refused at the boundary (never implies an unattested state)', () => {
  const receipt = approvedReceipt()
  // A from-scratch document with a fresh, valid digest previously passed: the
  // boundary examined only the signature. A6 forbids the implication outright.
  const reSigned = signReceipt({ ...receipt, attested_state: 'live-availability' })
  const verdict = verifyLaunch(reSigned, CONTEXT)
  assert.equal(verdict.ok, false)
  assert.deepEqual(refusalNames(verdict), ['EVIDENCE_STATE_UNATTESTED'])
})

// ---------------------------------------------------------------------------
// Post-review regression controls (review A F6/F7; review B RB-2/RB-5).
// ---------------------------------------------------------------------------

function issueScopedException(bypassed_checks: readonly string[]) {
  return issueBreakGlassException({
    requested_by: 'owner',
    owner_authorization: { per_use_statement: 'owner authorizes this single bypass' },
    requested_lane: 'L5',
    bypassed_checks,
    reason: 'resolver is broken; parcel must launch under owner override',
    issued_at: FIXED_ISSUED_AT,
  })
}

test('F6/RB-2: break-glass verification enforces lane and freshness unless the checks are named', () => {
  const issued = issueScopedException(['RECEIPT_UNSIGNED_REFUSED'])
  assert.ok(issued.ok)

  // Cross-lane reuse (review B S5): refused unless the lane check is named.
  const crossLane = verifyLaunch(issued.receipt, { ...CONTEXT, requested_lane: 'L6' })
  assert.equal(crossLane.ok, false)
  assert.deepEqual(refusalNames(crossLane), ['RECEIPT_LANE_MISMATCH_REFUSED'])

  // Stale and future reuse: refused unless the freshness check is named.
  const stale = verifyLaunch(issued.receipt, { ...CONTEXT, at: '2027-01-01T00:00:00.000Z' })
  assert.equal(stale.ok, false)
  assert.deepEqual(refusalNames(stale), ['FRESHNESS_STALE_REFUSED'])

  const future = verifyLaunch(issued.receipt, { ...CONTEXT, at: '2026-09-26T11:00:00.000Z' })
  assert.equal(future.ok, false)
  assert.deepEqual(refusalNames(future), ['FRESHNESS_FUTURE_REFUSED'])
})

test('F6/RB-2: a named bypass authorizes exactly its named check — and is reported', () => {
  const issued = issueScopedException(['RECEIPT_LANE_MISMATCH_REFUSED', 'FRESHNESS_STALE_REFUSED'])
  assert.ok(issued.ok)

  const verdict = verifyLaunch(issued.receipt, {
    requested_lane: 'L6',
    at: '2027-01-01T00:00:00.000Z',
    max_age_ms: 60_000,
  })
  assert.equal(verdict.ok, true)
  assert.equal(verdict.mode, 'break-glass')
  assert.ok(verdict.bypassed_checks.includes('RECEIPT_LANE_MISMATCH_REFUSED'))
  assert.ok(verdict.bypassed_checks.includes('FRESHNESS_STALE_REFUSED'))
})

test('RB-2: break-glass bypass names must come from the LAUNCH_REFUSALS vocabulary', () => {
  // Issue side: a spelling like 'signature' names no launch check (A1).
  const badIssue = issueScopedException(['signature'])
  assert.equal(badIssue.ok, false)
  assert.ok(!badIssue.ok)
  assert.deepEqual(
    refusalNames({
      ok: false,
      mode: 'break-glass',
      refusals: badIssue.refusals,
      bypassed_checks: [],
    }),
    ['BREAK_GLASS_DENIED_REFUSED'],
  )

  // Verify side: a forged, correctly signed exception with unknown names refuses.
  const forgedUnsigned = {
    kind: 'break-glass-exception',
    schema_version: 1,
    resolver: 'break-glass-owner-override@1',
    status: 'exception-approved',
    marking: 'BREAK-GLASS-EXCEPTION',
    requested_by: 'owner',
    owner_authorization: { per_use_statement: 'claimed' },
    requested_lane: 'L5',
    bypassed_checks: ['signature'],
    reason: 'forged',
    issued_at: FIXED_ISSUED_AT,
  }
  const forged = { ...forgedUnsigned, signature: documentDigest(forgedUnsigned) }
  assert.deepEqual(refusalNames(verifyLaunch(forged, CONTEXT)), ['BREAK_GLASS_DENIED_REFUSED'])

  // The exception's own gate is never bypassable.
  const selfBypass = issueScopedException(['BREAK_GLASS_DENIED_REFUSED'])
  assert.equal(selfBypass.ok, false)
})

test('F6/RB-2: the break-glass verdict reports every skipped check — no unnamed bypass', () => {
  const issued = issueScopedException(['RECEIPT_UNSIGNED_REFUSED'])
  assert.ok(issued.ok)

  const verdict = verifyLaunch(issued.receipt, CONTEXT)
  assert.equal(verdict.ok, true)
  // Lane and freshness were enforced (same lane, fresh); the route-receipt
  // family the exception stands in for is skipped — and fully reported even
  // though the declaration named only one of them.
  assert.deepEqual(verdict.bypassed_checks, [
    'DIGEST_MISMATCH_REFUSED',
    'EVIDENCE_STATE_UNATTESTED',
    'RECEIPT_MISSING_REFUSED',
    'RECEIPT_STATUS_REFUSED',
    'RECEIPT_UNSIGNED_REFUSED',
  ])
})

test('RB-5: LAUNCH_REFUSALS covers every refusal name the boundary can emit', () => {
  const stopped = resolveRoute(
    loadShippedPolicy(),
    makeRequest({ lane: 'L1', routing_class: 'architecture/risk' }),
    { issued_at: FIXED_ISSUED_AT },
  )
  const unsigned: Record<string, unknown> = { ...approvedReceipt() }
  delete unsigned.signature
  const reSignedSmuggle = signReceipt({
    ...approvedReceipt(),
    attested_state: 'live-availability',
  })
  const forgedUnsigned = {
    kind: 'break-glass-exception',
    schema_version: 1,
    resolver: 'break-glass-owner-override@1',
    status: 'exception-approved',
    marking: 'BREAK-GLASS-EXCEPTION',
    requested_by: 'owner',
    owner_authorization: { per_use_statement: 'claimed' },
    requested_lane: 'L5',
    bypassed_checks: ['signature'],
    reason: 'forged',
    issued_at: FIXED_ISSUED_AT,
  }
  const verdicts: readonly LaunchVerdict[] = [
    verifyLaunch(null, CONTEXT),
    verifyLaunch(stopped, CONTEXT),
    verifyLaunch(unsigned, CONTEXT),
    verifyLaunch({ ...approvedReceipt(), lane: 'L4' }, CONTEXT),
    verifyLaunch(approvedReceipt(), { ...CONTEXT, at: '2026-09-26T12:02:00.000Z' }),
    verifyLaunch(approvedReceipt(), { ...CONTEXT, at: '2026-09-26T11:59:00.000Z' }),
    verifyLaunch(approvedReceipt(), { ...CONTEXT, max_age_ms: 0 }),
    verifyLaunch(signReceipt({ ...approvedReceipt(), issued_at: 'not-a-timestamp' }), CONTEXT),
    verifyLaunch(reSignedSmuggle, CONTEXT),
    verifyLaunch({ ...forgedUnsigned, signature: documentDigest(forgedUnsigned) }, CONTEXT),
    verifyLaunch(
      { ...forgedUnsigned, signature: documentDigest(forgedUnsigned) },
      {
        ...CONTEXT,
        requested_lane: 'L6',
      },
    ),
    verifyLaunch(forgedUnsigned, CONTEXT),
  ]
  let seenRefusals = 0
  for (const verdict of verdicts) {
    for (const refusal of verdict.refusals) {
      seenRefusals += 1
      assert.ok(
        LAUNCH_REFUSALS.includes(refusal.name),
        `'${refusal.name}' is emitted by the boundary but absent from LAUNCH_REFUSALS`,
      )
    }
  }
  assert.ok(seenRefusals >= 12, 'every named boundary refusal path is exercised here')
})
