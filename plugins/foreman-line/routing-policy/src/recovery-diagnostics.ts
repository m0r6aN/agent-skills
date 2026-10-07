/**
 * MRC-12 (HRO-P4c) — D10's structured recovery diagnostics renderer over the
 * landed reason/outcome vocabulary (`charter.md:105-109`). Pure module: no
 * I/O, no clock reads, no process access (the pi-resolver purity pattern);
 * `resolveRenderOptions` takes its facts as plain arguments. The machine
 * report is a read-only diagnostics VIEW of already-produced records (MRC-08
 * recovery episodes, MRC-10 config-repair proposals): it is never appended to
 * the receipt chain, never emitted through the event path, never written to
 * any record, and this module can never select, refuse, retry, hold, or
 * release anything.
 */
import {
  D10_REASON_RECONCILIATION,
  type EventKind,
  REASON_VOCABULARY,
  REASON_VOCABULARY_VERSION,
  type ReasonCode,
  type ReasonOutcome,
} from '../../receipts/src/index.js'
import type { ConfigRepairProposal } from './config-repair-proposal.js'
import type { RecoveryEpisodeRecord } from './route-receipt.js'

// ---------------------------------------------------------------------------
// The diagnostics surface (C1–C7). DiagnosticLabel is the five-key literal
// union of `D10_REASON_RECONCILIATION`'s runtime keys — no sixth label, no
// new reason code, no event schema (Stop #3). The runtime-key equality is
// pinned by the label-reconciliation control in the test suite.
// ---------------------------------------------------------------------------

/** Exactly the keys of `D10_REASON_RECONCILIATION` (closed surface). */
export type DiagnosticLabel =
  | 'mapping_missing'
  | 'catalog_refresh_failed'
  | 'approved_fallback_selected'
  | 'config_update_proposed'
  | 'route_unavailable'

export type DiagnosticSeverity = 'warning' | 'error' | 'notice'

/** Identity strings ride verbatim as data; provider/model are never derived. */
export interface DiagnosticIdentity {
  readonly registry_key: string | null
  readonly provider: string | null
  readonly model: string | null
}

export interface DiagnosticInput {
  readonly parcel_ref?: string | null
  readonly correlation_id?: string | null
  readonly requested?: DiagnosticIdentity
  readonly selected?: DiagnosticIdentity
  readonly recovery?: RecoveryEpisodeRecord
  readonly proposal?: ConfigRepairProposal
}

export interface DiagnosticsBatchInput {
  readonly inputs: readonly DiagnosticInput[]
}

export interface DiagnosticEvent {
  readonly label: DiagnosticLabel
  readonly reason: ReasonCode
  readonly kind: EventKind
  readonly outcome: ReasonOutcome
  readonly severity: DiagnosticSeverity
  readonly parcel_ref: string | null
  readonly correlation_id: string | null
  readonly requested: DiagnosticIdentity
  readonly selected: DiagnosticIdentity
  readonly detail: string
  readonly next_action: string | null
}

export interface RenderedDiagnostic {
  readonly line: string
  readonly occurrences: number
  readonly event_indexes: readonly number[]
}

export interface DiagnosticsReport {
  readonly kind: 'recovery-diagnostics'
  readonly schema_version: 1
  readonly vocabulary_version: string
  readonly events: readonly DiagnosticEvent[]
  readonly rendered: readonly RenderedDiagnostic[]
}

export interface RenderOptions {
  readonly color: boolean
  readonly interactive: boolean
}

export interface NotificationRequest {
  readonly severity: DiagnosticSeverity
  readonly line: string
}

export type NotificationSink = (request: NotificationRequest) => void

// ---------------------------------------------------------------------------
// C4 — sanitization and bounding (terminal rendering only; the machine report
// retains the complete validated field values).
// ---------------------------------------------------------------------------

/** Renderer presentation constant, not a policy value (C4.2). */
const IDENTIFIER_BOUND = 96

const ESC = 0x1b
const BEL = 0x07

/**
 * Strips ANSI escape sequences (CSI, OSC, two-char escapes) and all Unicode
 * control characters (C0 `U+0000–U+001F`, DEL/C1 `U+007F–U+009F`) from one
 * interpolated value. Rendered lines stay single-line: no ESC byte and no
 * control byte survives. A char-code scan, because regex literals carrying
 * control characters are lint-disallowed in this package.
 */
export function sanitizeForTerminal(text: string): string {
  let out = ''
  let index = 0
  while (index < text.length) {
    const code = text.charCodeAt(index)
    if (code === ESC) {
      const next = text.charCodeAt(index + 1)
      if (next === 0x5b) {
        index += 2
        while (index < text.length) {
          const cursor = text.charCodeAt(index)
          index += 1
          if (cursor >= 0x40 && cursor <= 0x7e) break
        }
        continue
      }
      if (next === 0x5d) {
        index += 2
        while (index < text.length && text.charCodeAt(index) !== BEL) {
          if (text.charCodeAt(index) === ESC && text.charCodeAt(index + 1) === 0x5c) break
          index += 1
        }
        index += text.charCodeAt(index) === BEL ? 1 : 2
        continue
      }
      index += 2
      continue
    }
    if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) {
      index += 1
      continue
    }
    out += text.charAt(index)
    index += 1
  }
  return out
}

/**
 * Bounds untrusted identifier text to 96 characters, appending a `…` marker
 * on truncation. Applied to every identifier interpolated into a human line.
 */
export function boundIdentifierText(text: string): string {
  if (text.length <= IDENTIFIER_BOUND) return text
  let cut = IDENTIFIER_BOUND
  // Never split a surrogate pair across the bound: a trailing unpaired high
  // surrogate is dropped before the marker so no lone surrogate reaches any
  // output surface (F-02).
  const lastUnit = text.charCodeAt(cut - 1)
  if (lastUnit >= 0xd800 && lastUnit <= 0xdbff) cut -= 1
  return `${text.slice(0, cut)}…`
}

const shown = (value: string): string => boundIdentifierText(sanitizeForTerminal(value))

// ---------------------------------------------------------------------------
// C6 — non-interactive output and no-color.
// ---------------------------------------------------------------------------

/**
 * `color = isTTY && !noColorFlag && !noColorEnv && !nonInteractiveFlag`;
 * `interactive = isTTY && !nonInteractiveFlag`. `NO_COLOR` follows the
 * no-color.org presence convention through the `!noColorEnv` term of the
 * pinned formula. Facts are plain arguments — this module reads no process.
 */
export function resolveRenderOptions(facts: {
  readonly noColorFlag: boolean
  readonly nonInteractiveFlag: boolean
  readonly noColorEnv: string | undefined
  readonly isTTY: boolean
}): RenderOptions {
  return {
    color: facts.isTTY && !facts.noColorFlag && !facts.noColorEnv && !facts.nonInteractiveFlag,
    interactive: facts.isTTY && !facts.nonInteractiveFlag,
  }
}

// ---------------------------------------------------------------------------
// Identity handling (C1.4, Forbidden: no identity guessing or decomposition).
// ---------------------------------------------------------------------------

function identityKey(id: DiagnosticIdentity): string | null {
  if (id.registry_key !== null) return id.registry_key
  const parts = [id.provider, id.model].filter((part): part is string => part !== null)
  return parts.length > 0 ? parts.join('/') : null
}

/** Placeholder for an identity slot with nothing recorded (never derived). */
const UNRECORDED_IDENTITY = '?'

// ---------------------------------------------------------------------------
// C1.3 — the derivation table (record facts to labels). Each row fires at most
// one event per input record; rows apply in table order per input, then input
// order across the batch (C2.1). The reason code stays the map's value even
// when the underlying typed name differs; the typed names ride in `detail`.
// ---------------------------------------------------------------------------

const MAPPING_REFUSAL_NAMES: Readonly<Record<string, true>> = {
  MAPPING_MISSING_REFUSED: true,
  MAPPING_INCOMPLETE_REFUSED: true,
}

function distinctMappingRefusals(attempted: RecoveryEpisodeRecord['attempted']): readonly string[] {
  const names: string[] = []
  for (const attempt of attempted) {
    for (const refusal of attempt.refusals) {
      if (MAPPING_REFUSAL_NAMES[refusal.name] === true && !names.includes(refusal.name)) {
        names.push(refusal.name)
      }
    }
  }
  return names
}

/** D9-safe proposal detail: redacted-summary identity names and counts only. */
function proposalDetail(proposal: ConfigRepairProposal): string {
  const summary = proposal.redacted_summary
  return [
    `proposal:${proposal.status}`,
    `model=${summary.model.host_spelling}`,
    `key=${summary.model.registry_key}`,
    `changes=${summary.change_count}`,
    `docs=${summary.documents.join('+')}`,
  ].join('; ')
}

export function deriveDiagnosticEvents(input: DiagnosticInput): readonly DiagnosticEvent[] {
  const events: DiagnosticEvent[] = []
  const recovery = input.recovery
  // C1.4 identity fallbacks: record fields ride as `registry_key`; provider and
  // model stay null — never derived from an opaque key or a host id.
  const requested = input.requested ?? {
    registry_key: recovery?.terminal?.requested.registry_key ?? null,
    provider: null,
    model: null,
  }
  const selected = input.selected ?? {
    registry_key: recovery?.chosen_fallback?.identity ?? null,
    provider: null,
    model: null,
  }
  const parcelRef = input.parcel_ref ?? recovery?.terminal?.parcelRef ?? null
  const correlationId = input.correlation_id ?? null

  const emit = (
    label: DiagnosticLabel,
    severity: DiagnosticSeverity,
    detail: string,
    nextAction: string | null,
  ): void => {
    // C1.1: reason/kind/outcome resolve through the landed reconciliation map
    // and vocabulary — asserted by control, never re-derived or re-typed.
    const reason = D10_REASON_RECONCILIATION[label] as ReasonCode
    const entry = REASON_VOCABULARY[reason]
    events.push({
      label,
      reason,
      kind: entry.kind,
      outcome: entry.outcome,
      severity,
      parcel_ref: parcelRef,
      correlation_id: correlationId,
      requested,
      selected,
      detail,
      next_action: nextAction,
    })
  }

  if (recovery !== undefined) {
    // Row 1 — approved fallback changing the requested route -> warning.
    const fallback = recovery.chosen_fallback
    if (fallback !== null && identityKey(requested) !== fallback.identity) {
      emit('approved_fallback_selected', 'warning', `chosen_fallback:${fallback.role}`, null)
    }
    // Row 2 — terminal hold -> error; `terminal.reason` is the actionable next step.
    const terminal = recovery.terminal
    if (terminal !== null) {
      emit('route_unavailable', 'error', `hold:${terminal.hold}`, terminal.reason)
    }
    // Row 3 — catalog refresh failure -> notice.
    const refresh = recovery.refresh
    if (
      refresh.result === 'unavailable' ||
      refresh.result === 'deadline-exceeded' ||
      (refresh.reason !== null && refresh.provenance === null)
    ) {
      emit('catalog_refresh_failed', 'notice', `refresh:${refresh.result}`, null)
    }
    // Row 4 — mapping refusal names -> notice (the typed names as data).
    const mappingRefusals = distinctMappingRefusals(recovery.attempted)
    if (mappingRefusals.length > 0) {
      emit('mapping_missing', 'notice', mappingRefusals.join(', '), null)
    }
  }
  // Row 5 — a proposal that is PROPOSED-NOT-WRITTEN -> notice.
  const proposal = input.proposal
  if (proposal !== undefined && proposal.status === 'PROPOSED-NOT-WRITTEN') {
    emit(
      'config_update_proposed',
      'notice',
      proposalDetail(proposal),
      `apply via ${proposal.apply_contract.writer}`,
    )
  }
  return events
}

// ---------------------------------------------------------------------------
// C3–C5 — terminal rendering and deduplication.
// ---------------------------------------------------------------------------

const SEVERITY_ANSI: Readonly<Record<DiagnosticSeverity, string>> = {
  warning: '\x1b[33m',
  error: '\x1b[31m',
  notice: '\x1b[36m',
}

function severityPrefix(severity: DiagnosticSeverity, options: RenderOptions): string {
  const prefix = `${severity}: `
  return options.color ? `${SEVERITY_ANSI[severity]}${prefix}\x1b[0m` : prefix
}

/**
 * One human line per event (C3). Every interpolated identifier is sanitized
 * and bounded first (C4); the machine report keeps the complete values.
 */
export function renderHumanLine(event: DiagnosticEvent, options: RenderOptions): string {
  const prefix = severityPrefix(event.severity, options)
  const idPresent = event.parcel_ref !== null || event.correlation_id !== null
  const id = `${event.parcel_ref === null ? '?' : shown(event.parcel_ref)}/${
    event.correlation_id === null ? '?' : shown(event.correlation_id)
  }`
  const requestedKey = identityKey(event.requested)
  const selectedKey = identityKey(event.selected)
  const req = shown(requestedKey ?? UNRECORDED_IDENTITY)
  const sel = shown(selectedKey ?? UNRECORDED_IDENTITY)
  const reason = shown(event.reason)
  const detail = shown(event.detail)
  const nextPart = event.next_action === null ? '' : ` next: ${shown(event.next_action)}`

  if (event.label === 'approved_fallback_selected') {
    return `${prefix}approved fallback changed route ${id}: requested ${req} -> selected ${sel} [reason=${reason}]`
  }
  if (event.label === 'route_unavailable') {
    const selectedPart = selectedKey !== null ? ` -> selected ${sel}` : ''
    return `${prefix}parcel held ${id}: requested ${req}${selectedPart} [reason=${reason}]${nextPart}`
  }
  const idPart = idPresent ? ` ${id}` : ''
  const identitySegments: string[] = []
  if (requestedKey !== null) identitySegments.push(`requested ${req}`)
  if (selectedKey !== null) identitySegments.push(`selected ${sel}`)
  const identityPart = identitySegments.length > 0 ? `: ${identitySegments.join(' -> ')}` : ''
  return `${prefix}${event.label}${idPart}${identityPart} [reason=${reason}] ${detail}${nextPart}`
}

/** Canonical dedup key (C5.1): the full event tuple, field-order independent. */
function canonicalEventKey(event: DiagnosticEvent): string {
  return JSON.stringify([
    event.label,
    event.reason,
    event.severity,
    event.parcel_ref,
    event.correlation_id,
    event.requested.registry_key,
    event.requested.provider,
    event.requested.model,
    event.selected.registry_key,
    event.selected.provider,
    event.selected.model,
    event.detail,
    event.next_action,
  ])
}

/**
 * The deduplicated terminal view (C5): identical derived events collapse into
 * one line carrying `(xN)` when `N > 1` and the full `event_indexes` list.
 * `DiagnosticsReport.events` keeps every complete event regardless. Without
 * explicit options the rendered lines carry zero ANSI (the machine view).
 */
export function dedupeRendered(
  events: readonly DiagnosticEvent[],
  options?: RenderOptions,
): readonly RenderedDiagnostic[] {
  const render = options ?? { color: false, interactive: false }
  const groups = new Map<string, { line: string; occurrences: number; event_indexes: number[] }>()
  for (const [index, event] of events.entries()) {
    const key = canonicalEventKey(event)
    const group = groups.get(key)
    if (group === undefined) {
      groups.set(key, {
        line: renderHumanLine(event, render),
        occurrences: 1,
        event_indexes: [index],
      })
    } else {
      group.occurrences += 1
      group.event_indexes.push(index)
    }
  }
  return [...groups.values()].map((group) => ({
    line: group.occurrences > 1 ? `${group.line} (x${group.occurrences})` : group.line,
    occurrences: group.occurrences,
    event_indexes: group.event_indexes,
  }))
}

// ---------------------------------------------------------------------------
// C2 — the machine document.
// ---------------------------------------------------------------------------

export function buildDiagnosticsReport(batch: DiagnosticsBatchInput): DiagnosticsReport {
  const events = batch.inputs.flatMap((input) => deriveDiagnosticEvents(input))
  return {
    kind: 'recovery-diagnostics',
    schema_version: 1,
    vocabulary_version: REASON_VOCABULARY_VERSION,
    events,
    rendered: dedupeRendered(events),
  }
}
