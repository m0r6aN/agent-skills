/**
 * PMC-P2 — launch boundary and break-glass path (charter A1).
 *
 * A dispatched Pi session is authorized only by an approved route receipt
 * emitted by the resolver. Before any inference this boundary verifies that
 * receipt and fails closed when it is missing, stale, mismatched against the
 * requested lane, or unsigned by the resolver. Only the checks A1 names are
 * enforced here: evidence state is the receipt's own honest declaration (A6),
 * never a launch-time implication — and the boundary refuses any receipt whose
 * `attested_state` is not `static-conformance` (A6: it may never imply
 * `live-availability` or `model-quality`).
 *
 * The break-glass owner override exists for the case where the resolver itself
 * is broken. It requires explicit owner authorization per use and emits a
 * distinctly marked exception receipt naming the bypassed checks (their
 * `LAUNCH_REFUSALS` names; unknown or never-bypassable names are refused). It
 * is never available to a coordinator, builder, reviewer, or automated retry
 * (A1), and the denial is re-checked at verification time (defense in depth).
 * The exception's own integrity (marking, owner, per-use statement, signature)
 * is never bypassable; the lane match and the `at`/`max_age_ms` freshness bound
 * are enforced exactly like the route path unless the corresponding check is
 * named in `bypassed_checks`. The verdict never under-reports: it names every
 * check the launch actually skipped (review A F6 / review B RB-2).
 *
 * Trust boundary (review A F7): the exception fields are label-checked over a
 * recomputable content digest — tamper-evident, not authenticity-bearing. The
 * owner's identity and the per-use nature of an exception are the owner's own
 * attestation; this stateless boundary cannot machine-enforce single use.
 */

import {
  documentDigest,
  LAUNCH_REFUSALS,
  type RefusalEntry,
  type RouteReceipt,
  verifyReceiptSignature,
} from './route-receipt.js'
import type { LaneId } from './types.js'

export type BreakGlassRequester =
  | 'owner'
  | 'coordinator'
  | 'builder'
  | 'reviewer'
  | 'automated-retry'

export interface BreakGlassAuthorization {
  /** The owner's explicit per-use authorization statement (A1). */
  readonly per_use_statement: string
}

export interface BreakGlassIssueRequest {
  readonly requested_by: BreakGlassRequester
  readonly owner_authorization: BreakGlassAuthorization | null | undefined
  readonly requested_lane: LaneId
  /** The launch checks this exception bypasses; must name each one (A1). */
  readonly bypassed_checks: readonly string[]
  readonly reason: string
  readonly issued_at: string
}

export interface ExceptionReceipt {
  readonly kind: 'break-glass-exception'
  readonly schema_version: 1
  readonly resolver: string
  readonly status: 'exception-approved'
  readonly marking: 'BREAK-GLASS-EXCEPTION'
  readonly requested_by: BreakGlassRequester
  readonly owner_authorization: BreakGlassAuthorization
  readonly requested_lane: LaneId
  readonly bypassed_checks: readonly string[]
  readonly reason: string
  readonly issued_at: string
  readonly signature: string
}

export interface LaunchContext {
  readonly requested_lane: LaneId
  /** Injected clock (ISO-8601). The boundary performs no time reads. */
  readonly at: string
  /** The owner-accepted freshness bound for this launch (rubric R6 wording). */
  readonly max_age_ms: number
}

export interface LaunchVerdict {
  readonly ok: boolean
  readonly mode: 'route' | 'break-glass'
  readonly refusals: readonly RefusalEntry[]
  /** For break-glass launches: the checks the exception bypassed (A1). */
  readonly bypassed_checks: readonly string[]
}

function timestampMs(value: unknown): number {
  return typeof value === 'string' ? Date.parse(value) : Number.NaN
}

/**
 * The route-receipt checks a break-glass exception stands in for (A1): no route
 * receipt is presented or verified on this path. They are always skipped and
 * therefore always reported in the verdict's `bypassed_checks` — a launch never
 * under-reports an unnamed bypass (review A F6 / review B RB-2).
 */
const BREAK_GLASS_STRUCTURAL_SKIPS: readonly string[] = [
  'RECEIPT_MISSING_REFUSED',
  'RECEIPT_STATUS_REFUSED',
  'RECEIPT_UNSIGNED_REFUSED',
  'DIGEST_MISMATCH_REFUSED',
  'EVIDENCE_STATE_UNATTESTED',
]

/**
 * A break-glass exception names its bypassed checks from `LAUNCH_REFUSALS`
 * (A1: "naming the bypassed check"). `BREAK_GLASS_DENIED_REFUSED` names the
 * exception's own gate, which is never bypassable.
 */
function isBypassableCheckName(name: unknown): name is string {
  return (
    typeof name === 'string' &&
    LAUNCH_REFUSALS.includes(name) &&
    name !== 'BREAK_GLASS_DENIED_REFUSED'
  )
}

/** The declared bypassed-check list: non-empty strings (A1). */
function declaredBypassedChecks(receipt: { readonly bypassed_checks?: unknown }): {
  readonly names: readonly string[]
  readonly shapeOk: boolean
} {
  const raw = receipt.bypassed_checks
  const shapeOk =
    Array.isArray(raw) &&
    raw.length > 0 &&
    raw.every((check) => typeof check === 'string' && check.length > 0)
  return { names: shapeOk ? (raw as readonly string[]) : [], shapeOk }
}

/**
 * The A1 freshness check against the injected clock. Identical dispatch to the
 * route path; `bypassed` names skip their own check (a named bypass is the
 * owner's explicit scope, and is reported in the verdict).
 */
function freshnessRefusals(
  issuedAtRaw: unknown,
  context: LaunchContext,
  bypassed: ReadonlySet<string>,
): RefusalEntry[] {
  const refusals: RefusalEntry[] = []
  const push = (name: string, detail: string): void => {
    if (bypassed.has(name)) return
    refusals.push({ name, detail })
  }
  const issuedAt = timestampMs(issuedAtRaw)
  const at = timestampMs(context.at)
  if (!Number.isFinite(issuedAt)) {
    push(
      'RECEIPT_STATUS_REFUSED',
      `issued_at '${String(issuedAtRaw)}' is not a parseable ISO-8601 timestamp`,
    )
  } else if (!Number.isFinite(at)) {
    push(
      'FRESHNESS_STALE_REFUSED',
      'launch context carries no parseable clock; the receipt cannot be proven fresh — fail closed',
    )
  } else if (issuedAt > at) {
    push('FRESHNESS_FUTURE_REFUSED', 'receipt is timestamped after the launch attempt')
  } else if (!Number.isFinite(context.max_age_ms) || context.max_age_ms <= 0) {
    push(
      'FRESHNESS_STALE_REFUSED',
      'no valid owner-accepted freshness bound; the receipt cannot be proven fresh — fail closed',
    )
  } else if (at - issuedAt > context.max_age_ms) {
    push(
      'FRESHNESS_STALE_REFUSED',
      `receipt is older than the owner-accepted freshness bound (${context.max_age_ms} ms)`,
    )
  }
  return refusals
}

function breakGlassVerdict(receipt: ExceptionReceipt, context: LaunchContext): LaunchVerdict {
  const refusals: RefusalEntry[] = []
  const { signature, ...unsigned } = receipt
  if (
    receipt.marking !== 'BREAK-GLASS-EXCEPTION' ||
    receipt.status !== 'exception-approved' ||
    receipt.kind !== 'break-glass-exception'
  ) {
    refusals.push({
      name: 'BREAK_GLASS_DENIED_REFUSED',
      detail:
        'exception receipt is not distinctly marked BREAK-GLASS-EXCEPTION / exception-approved',
    })
  }
  if (receipt.requested_by !== 'owner') {
    refusals.push({
      name: 'BREAK_GLASS_DENIED_REFUSED',
      detail: `break-glass is never available to '${String(receipt.requested_by)}' (A1: not to a coordinator, builder, reviewer, or automated retry)`,
    })
  }
  const statement = receipt.owner_authorization?.per_use_statement
  if (typeof statement !== 'string' || statement.length === 0) {
    refusals.push({
      name: 'BREAK_GLASS_DENIED_REFUSED',
      detail: 'break-glass requires explicit owner authorization per use (A1)',
    })
  }
  const declared = declaredBypassedChecks(receipt)
  if (!declared.shapeOk) {
    refusals.push({
      name: 'BREAK_GLASS_DENIED_REFUSED',
      detail: 'a break-glass exception receipt must name the bypassed check (A1)',
    })
  } else {
    for (const check of declared.names) {
      if (!isBypassableCheckName(check)) {
        refusals.push({
          name: 'BREAK_GLASS_DENIED_REFUSED',
          detail: `bypassed check '${check}' is not a LAUNCH_REFUSALS name, or names the break-glass gate itself, which is never bypassable (A1)`,
        })
      }
    }
  }
  if (typeof signature !== 'string' || signature.length === 0) {
    refusals.push({ name: 'RECEIPT_UNSIGNED_REFUSED', detail: 'exception receipt is unsigned' })
  } else if (signature !== documentDigest(unsigned)) {
    refusals.push({
      name: 'DIGEST_MISMATCH_REFUSED',
      detail: 'exception receipt content does not match its signature',
    })
  }
  // A1 scope (review A F6 / review B RB-2): the lane match and the freshness
  // bound are enforced like the route path unless their checks are named.
  const bypassed = new Set(declared.names.filter(isBypassableCheckName))
  if (
    receipt.requested_lane !== context.requested_lane &&
    !bypassed.has('RECEIPT_LANE_MISMATCH_REFUSED')
  ) {
    refusals.push({
      name: 'RECEIPT_LANE_MISMATCH_REFUSED',
      detail: `exception lane '${String(receipt.requested_lane)}' is mismatched against requested lane '${context.requested_lane}' (A1), and the lane check is not named bypassed`,
    })
  }
  refusals.push(...freshnessRefusals(receipt.issued_at, context, bypassed))
  const ok = refusals.length === 0
  return {
    ok,
    mode: 'break-glass',
    refusals,
    // Never under-report: every check this launch skipped is named (the
    // declared bypasses plus the route-receipt family the exception replaces).
    bypassed_checks: ok
      ? [
          ...new Set([
            ...declared.names.filter(isBypassableCheckName),
            ...BREAK_GLASS_STRUCTURAL_SKIPS,
          ]),
        ].sort()
      : [],
  }
}

/**
 * Verifies a receipt before inference (A1). Fails closed on every named
 * condition; returns the launch verdict with the refused checks named.
 */
export function verifyLaunch(receipt: unknown, context: LaunchContext): LaunchVerdict {
  if (receipt === null || typeof receipt !== 'object' || Array.isArray(receipt)) {
    return {
      ok: false,
      mode: 'route',
      refusals: [
        {
          name: 'RECEIPT_MISSING_REFUSED',
          detail: 'no route receipt presented at the launch boundary',
        },
      ],
      bypassed_checks: [],
    }
  }
  const document = receipt as { kind?: unknown; status?: unknown }
  if (document.kind === 'break-glass-exception') {
    return breakGlassVerdict(receipt as ExceptionReceipt, context)
  }
  const refusals: RefusalEntry[] = []
  if (document.kind !== 'pi-route-receipt' || document.status !== 'approved') {
    refusals.push({
      name: 'RECEIPT_STATUS_REFUSED',
      detail: `only an approved pi-route-receipt authorizes a session (A1); got kind '${String(document.kind)}' status '${String(document.status)}'`,
    })
  }
  const typed = receipt as RouteReceipt
  if (typed.attested_state !== 'static-conformance') {
    refusals.push({
      name: 'EVIDENCE_STATE_UNATTESTED',
      detail: `receipt attested_state '${String(typed.attested_state)}' is not the A6 static-conformance attestation; the boundary never re-opens evidence claims`,
    })
  }
  if (typeof typed.signature !== 'string' || typed.signature.length === 0) {
    refusals.push({
      name: 'RECEIPT_UNSIGNED_REFUSED',
      detail: 'receipt is unsigned by the resolver (A1)',
    })
  } else if (!verifyReceiptSignature(typed)) {
    refusals.push({
      name: 'DIGEST_MISMATCH_REFUSED',
      detail: 'receipt content does not match its resolver signature',
    })
  }
  if (typed.lane !== context.requested_lane) {
    refusals.push({
      name: 'RECEIPT_LANE_MISMATCH_REFUSED',
      detail: `receipt lane '${String(typed.lane)}' is mismatched against requested lane '${context.requested_lane}' (A1)`,
    })
  }
  refusals.push(...freshnessRefusals(typed.issued_at, context, new Set<string>()))
  return { ok: refusals.length === 0, mode: 'route', refusals, bypassed_checks: [] }
}

export type BreakGlassIssueResult =
  | { readonly ok: true; readonly receipt: ExceptionReceipt }
  | { readonly ok: false; readonly refusals: readonly RefusalEntry[] }

/**
 * Issues the distinctly marked break-glass exception receipt (A1). Owner-only,
 * per use; refused for every other requester even when an authorization is
 * claimed.
 */
export function issueBreakGlassException(request: BreakGlassIssueRequest): BreakGlassIssueResult {
  const refusals: RefusalEntry[] = []
  if (request.requested_by !== 'owner') {
    refusals.push({
      name: 'BREAK_GLASS_DENIED_REFUSED',
      detail: `break-glass is never available to '${String(request.requested_by)}' (A1: not to a coordinator, builder, reviewer, or automated retry)`,
    })
  }
  const statement = request.owner_authorization?.per_use_statement
  if (typeof statement !== 'string' || statement.length === 0) {
    refusals.push({
      name: 'BREAK_GLASS_DENIED_REFUSED',
      detail: 'break-glass requires explicit owner authorization per use (A1)',
    })
  }
  const declared = declaredBypassedChecks(request)
  if (!declared.shapeOk) {
    refusals.push({
      name: 'BREAK_GLASS_DENIED_REFUSED',
      detail: 'a break-glass exception receipt must name the bypassed check (A1)',
    })
  } else {
    for (const check of declared.names) {
      if (!isBypassableCheckName(check)) {
        refusals.push({
          name: 'BREAK_GLASS_DENIED_REFUSED',
          detail: `bypassed check '${check}' is not a LAUNCH_REFUSALS name, or names the break-glass gate itself, which is never bypassable (A1)`,
        })
      }
    }
  }
  if (typeof request.reason !== 'string' || request.reason.length === 0) {
    refusals.push({
      name: 'BREAK_GLASS_DENIED_REFUSED',
      detail: 'a break-glass exception receipt must state why the override is used (A1)',
    })
  }
  if (refusals.length > 0) return { ok: false, refusals }
  const unsigned: Omit<ExceptionReceipt, 'signature'> = {
    kind: 'break-glass-exception',
    schema_version: 1,
    resolver: 'break-glass-owner-override@1',
    status: 'exception-approved',
    marking: 'BREAK-GLASS-EXCEPTION',
    requested_by: request.requested_by,
    owner_authorization: request.owner_authorization as BreakGlassAuthorization,
    requested_lane: request.requested_lane,
    bypassed_checks: request.bypassed_checks,
    reason: request.reason,
    issued_at: request.issued_at,
  }
  return { ok: true, receipt: { ...unsigned, signature: documentDigest(unsigned) } }
}

/** Re-exported so launch-domain consumers need one import. */
export { LAUNCH_REFUSALS }
