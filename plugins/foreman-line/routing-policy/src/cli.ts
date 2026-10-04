/**
 * `routing-policy validate <path>` — thin wrapper over `validatePolicy`.
 * Exit-code contract (frozen by this parcel, no workflow wiring):
 *   0  valid
 *   1  schema or semantic-invariant violation (every violation on stderr)
 *   2  usage error (missing/unreadable path, bad invocation)
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import {
  buildDiagnosticsReport,
  type DiagnosticsBatchInput,
  dedupeRendered,
  resolveRenderOptions,
} from './recovery-diagnostics.js'
import { createPlatformNotificationSink } from './recovery-notify.js'
import { validatePolicy } from './validator.js'

function run(argv: readonly string[]): number {
  const [command, path] = argv
  if (command === 'diagnostics') {
    return runDiagnostics(argv.slice(1))
  }
  if (command !== 'validate' || path === undefined) {
    process.stderr.write('usage: routing-policy validate <path>\n')
    return 2
  }

  let raw: string
  try {
    raw = readFileSync(path, 'utf8')
  } catch (err) {
    process.stderr.write(`error: cannot read '${path}': ${(err as Error).message}\n`)
    return 2
  }

  let doc: unknown
  try {
    doc = parse(raw)
  } catch (err) {
    process.stderr.write(`error: cannot parse '${path}' as YAML: ${(err as Error).message}\n`)
    return 2
  }

  const result = validatePolicy(doc)
  if (!result.valid) {
    for (const message of result.errors) {
      process.stderr.write(`${message}\n`)
    }
    return 1
  }
  return 0
}

// ---------------------------------------------------------------------------
// Typed guards for the `diagnostics` input document (C2.5/C8.1): malformed
// shapes are rejected at the CLI boundary with violations listed on stderr.
// Every field the derivation table consumes is type-checked; opaque evidence
// envelopes the renderer never reads are admitted as data.
// ---------------------------------------------------------------------------

type GuardResult =
  | { readonly ok: true; readonly batch: DiagnosticsBatchInput }
  | { readonly ok: false; readonly violations: readonly string[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function expectString(value: unknown, path: string, violations: string[]): void {
  if (typeof value !== 'string') violations.push(`violation: ${path}: expected string`)
}

function expectNullableString(value: unknown, path: string, violations: string[]): void {
  if (value !== null && typeof value !== 'string') {
    violations.push(`violation: ${path}: expected string or null`)
  }
}

function expectEnum(
  value: unknown,
  allowed: readonly string[],
  path: string,
  violations: string[],
): void {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    violations.push(`violation: ${path}: expected one of ${allowed.join(' | ')}`)
  }
}

function expectLiteral(
  value: unknown,
  expected: unknown,
  path: string,
  violations: string[],
): void {
  if (value !== expected) {
    violations.push(`violation: ${path}: expected ${JSON.stringify(expected)}`)
  }
}

function expectRefusals(value: unknown, path: string, violations: string[]): void {
  if (!Array.isArray(value)) {
    violations.push(`violation: ${path}: expected RefusalEntry array`)
    return
  }
  for (const [index, entry] of value.entries()) {
    const entryPath = `${path}[${index}]`
    if (!isRecord(entry)) {
      violations.push(`violation: ${entryPath}: expected RefusalEntry object`)
      continue
    }
    expectString(entry.name, `${entryPath}.name`, violations)
    expectString(entry.detail, `${entryPath}.detail`, violations)
  }
}

function expectIdentity(value: unknown, path: string, violations: string[]): void {
  if (!isRecord(value)) {
    violations.push(`violation: ${path}: expected identity object`)
    return
  }
  expectNullableString(value.registry_key, `${path}.registry_key`, violations)
  expectNullableString(value.provider, `${path}.provider`, violations)
  expectNullableString(value.model, `${path}.model`, violations)
}

function expectAttempt(value: unknown, path: string, violations: string[]): void {
  if (!isRecord(value)) {
    violations.push(`violation: ${path}: expected AttemptRecord object`)
    return
  }
  expectString(value.identity, `${path}.identity`, violations)
  expectEnum(value.role, ['requested', 'fallback', 'cross-provider'], `${path}.role`, violations)
  if (typeof value.attempt !== 'number') {
    violations.push(`violation: ${path}.attempt: expected number`)
  }
  expectEnum(value.outcome, ['approved', 'refused', 'skipped'], `${path}.outcome`, violations)
  expectRefusals(value.refusals, `${path}.refusals`, violations)
}

function expectRecovery(value: unknown, path: string, violations: string[]): void {
  if (!isRecord(value)) {
    violations.push(`violation: ${path}: expected RecoveryEpisodeRecord object`)
    return
  }
  expectLiteral(value.kind, 'recovery-episode-record', `${path}.kind`, violations)
  expectLiteral(value.schema_version, 1, `${path}.schema_version`, violations)
  expectString(value.episode_id, `${path}.episode_id`, violations)
  if (!Array.isArray(value.attempted)) {
    violations.push(`violation: ${path}.attempted: expected AttemptRecord array`)
  } else {
    for (const [index, entry] of value.attempted.entries()) {
      expectAttempt(entry, `${path}.attempted[${index}]`, violations)
    }
  }
  const refresh = value.refresh
  if (!isRecord(refresh)) {
    violations.push(`violation: ${path}.refresh: expected RefreshProvenance object`)
  } else {
    expectEnum(
      refresh.result,
      ['refreshed', 'unavailable', 'negative-cached', 'not-permitted', 'deadline-exceeded'],
      `${path}.refresh.result`,
      violations,
    )
    if (typeof refresh.coalesced !== 'boolean') {
      violations.push(`violation: ${path}.refresh.coalesced: expected boolean`)
    }
    expectNullableString(refresh.requested_key, `${path}.refresh.requested_key`, violations)
    expectNullableString(refresh.evidence_version, `${path}.refresh.evidence_version`, violations)
    const provenance = refresh.provenance
    if (provenance !== null && !isRecord(provenance)) {
      violations.push(`violation: ${path}.refresh.provenance: expected evidence envelope or null`)
    }
    if (!Array.isArray(refresh.discovered)) {
      violations.push(`violation: ${path}.refresh.discovered: expected string array`)
    }
    expectNullableString(refresh.reason, `${path}.refresh.reason`, violations)
  }
  const fallback = value.chosen_fallback
  if (fallback !== null) {
    if (!isRecord(fallback)) {
      violations.push(`violation: ${path}.chosen_fallback: expected object or null`)
    } else {
      expectString(fallback.identity, `${path}.chosen_fallback.identity`, violations)
      expectEnum(
        fallback.role,
        ['fallback', 'cross-provider'],
        `${path}.chosen_fallback.role`,
        violations,
      )
      if (fallback.handoff !== null && !isRecord(fallback.handoff)) {
        violations.push(`violation: ${path}.chosen_fallback.handoff: expected record or null`)
      }
    }
  }
  const freshness = value.freshness
  if (!isRecord(freshness)) {
    violations.push(`violation: ${path}.freshness: expected freshness object`)
  } else {
    expectEnum(
      freshness.verdict,
      ['fresh', 'stale', 'unknown'],
      `${path}.freshness.verdict`,
      violations,
    )
    if (freshness.age_ms !== null && typeof freshness.age_ms !== 'number') {
      violations.push(`violation: ${path}.freshness.age_ms: expected number or null`)
    }
    if (freshness.tolerance_ms !== null && typeof freshness.tolerance_ms !== 'number') {
      violations.push(`violation: ${path}.freshness.tolerance_ms: expected number or null`)
    }
  }
  const terminal = value.terminal
  if (terminal !== null) expectTerminal(terminal, `${path}.terminal`, violations)
}

function expectTerminal(value: unknown, path: string, violations: string[]): void {
  if (!isRecord(value)) {
    violations.push(`violation: ${path}: expected RouteUnavailableOutcome object`)
    return
  }
  expectLiteral(value.code, 'ROUTE_UNAVAILABLE', `${path}.code`, violations)
  expectString(value.parcelRef, `${path}.parcelRef`, violations)
  const requested = value.requested
  if (!isRecord(requested)) {
    violations.push(`violation: ${path}.requested: expected object`)
  } else {
    expectString(requested.lane, `${path}.requested.lane`, violations)
    expectNullableString(requested.registry_key, `${path}.requested.registry_key`, violations)
  }
  if (!Array.isArray(value.attempted)) {
    violations.push(`violation: ${path}.attempted: expected array`)
  } else {
    for (const [index, entry] of value.attempted.entries()) {
      const entryPath = `${path}.attempted[${index}]`
      if (!isRecord(entry)) {
        violations.push(`violation: ${entryPath}: expected object`)
        continue
      }
      expectString(entry.identity, `${entryPath}.identity`, violations)
      expectRefusals(entry.refusals, `${entryPath}.refusals`, violations)
    }
  }
  expectRefusals(value.refusals, `${path}.refusals`, violations)
  expectString(value.reason, `${path}.reason`, violations)
  expectLiteral(value.hold, 'parcel-held', `${path}.hold`, violations)
}

function expectProposal(value: unknown, path: string, violations: string[]): void {
  if (!isRecord(value)) {
    violations.push(`violation: ${path}: expected ConfigRepairProposal object`)
    return
  }
  expectLiteral(value.kind, 'pi-config-repair-proposal', `${path}.kind`, violations)
  expectLiteral(value.status, 'PROPOSED-NOT-WRITTEN', `${path}.status`, violations)
  expectLiteral(value.schema_version, 1, `${path}.schema_version`, violations)
  const target = value.target
  if (!isRecord(target)) {
    violations.push(`violation: ${path}.target: expected object`)
  } else {
    if (!Array.isArray(target.documents)) {
      violations.push(`violation: ${path}.target.documents: expected DocumentRole array`)
    }
    expectString(target.write_policy, `${path}.target.write_policy`, violations)
    expectString(target.scope_preference, `${path}.target.scope_preference`, violations)
  }
  if (!Array.isArray(value.source_state)) {
    violations.push(`violation: ${path}.source_state: expected array`)
  }
  if (!Array.isArray(value.changes)) {
    violations.push(`violation: ${path}.changes: expected array`)
  }
  const provenance = value.mapping_provenance
  if (!isRecord(provenance)) {
    violations.push(`violation: ${path}.mapping_provenance: expected object`)
  } else {
    expectString(provenance.registry_key, `${path}.mapping_provenance.registry_key`, violations)
  }
  const evidence = value.evidence
  if (!isRecord(evidence)) {
    violations.push(`violation: ${path}.evidence: expected object`)
  } else if (!isRecord(evidence.trigger)) {
    violations.push(`violation: ${path}.evidence.trigger: expected object`)
  } else {
    expectString(
      evidence.trigger.source_refusal,
      `${path}.evidence.trigger.source_refusal`,
      violations,
    )
  }
  const applyContract = value.apply_contract
  if (!isRecord(applyContract)) {
    violations.push(`violation: ${path}.apply_contract: expected object`)
  } else {
    expectString(applyContract.writer, `${path}.apply_contract.writer`, violations)
  }
  const summary = value.redacted_summary
  if (!isRecord(summary)) {
    violations.push(`violation: ${path}.redacted_summary: expected RedactedSummary object`)
  } else {
    const model = summary.model
    if (!isRecord(model)) {
      violations.push(`violation: ${path}.redacted_summary.model: expected object`)
    } else {
      expectString(model.registry_key, `${path}.redacted_summary.model.registry_key`, violations)
      expectString(model.host_spelling, `${path}.redacted_summary.model.host_spelling`, violations)
    }
    if (!Array.isArray(summary.documents)) {
      violations.push(`violation: ${path}.redacted_summary.documents: expected DocumentRole array`)
    }
    if (typeof summary.change_count !== 'number') {
      violations.push(`violation: ${path}.redacted_summary.change_count: expected number`)
    }
    if (!Array.isArray(summary.source_hashes)) {
      violations.push(`violation: ${path}.redacted_summary.source_hashes: expected array`)
    }
  }
  expectString(value.proposal_digest, `${path}.proposal_digest`, violations)
}

function guardBatchInput(doc: unknown): GuardResult {
  const violations: string[] = []
  if (!isRecord(doc)) {
    return { ok: false, violations: ['violation: $: expected { inputs: [...] } object'] }
  }
  const inputs = doc.inputs
  if (!Array.isArray(inputs)) {
    return { ok: false, violations: ['violation: $.inputs: expected DiagnosticInput array'] }
  }
  for (const [index, input] of inputs.entries()) {
    const path = `$.inputs[${index}]`
    if (!isRecord(input)) {
      violations.push(`violation: ${path}: expected DiagnosticInput object`)
      continue
    }
    if (input.parcel_ref !== undefined) {
      expectNullableString(input.parcel_ref, `${path}.parcel_ref`, violations)
    }
    if (input.correlation_id !== undefined) {
      expectNullableString(input.correlation_id, `${path}.correlation_id`, violations)
    }
    if (input.requested !== undefined)
      expectIdentity(input.requested, `${path}.requested`, violations)
    if (input.selected !== undefined) expectIdentity(input.selected, `${path}.selected`, violations)
    if (input.recovery !== undefined) expectRecovery(input.recovery, `${path}.recovery`, violations)
    if (input.proposal !== undefined) expectProposal(input.proposal, `${path}.proposal`, violations)
  }
  return violations.length === 0
    ? { ok: true, batch: doc as unknown as DiagnosticsBatchInput }
    : { ok: false, violations }
}

const DIAGNOSTICS_USAGE =
  'usage: routing-policy diagnostics <path> [--no-color] [--non-interactive] [--notify]\n'

function runDiagnostics(args: readonly string[]): number {
  let path: string | undefined
  let noColorFlag = false
  let nonInteractiveFlag = false
  let notify = false
  for (const arg of args) {
    if (arg === '--no-color') noColorFlag = true
    else if (arg === '--non-interactive') nonInteractiveFlag = true
    else if (arg === '--notify') notify = true
    else if (path === undefined && !arg.startsWith('--')) path = arg
    else {
      process.stderr.write(DIAGNOSTICS_USAGE)
      return 2
    }
  }
  if (path === undefined) {
    process.stderr.write(DIAGNOSTICS_USAGE)
    return 2
  }

  let raw: string
  try {
    raw = readFileSync(path, 'utf8')
  } catch (err) {
    process.stderr.write(`error: cannot read '${path}': ${(err as Error).message}\n`)
    return 2
  }
  let doc: unknown
  try {
    doc = JSON.parse(raw)
  } catch (err) {
    process.stderr.write(`error: cannot parse '${path}' as JSON: ${(err as Error).message}\n`)
    return 2
  }
  const guarded = guardBatchInput(doc)
  if (!guarded.ok) {
    for (const violation of guarded.violations) {
      process.stderr.write(`${violation}\n`)
    }
    return 1
  }

  const report = buildDiagnosticsReport(guarded.batch)
  const options = resolveRenderOptions({
    noColorFlag,
    nonInteractiveFlag,
    noColorEnv: process.env.NO_COLOR,
    isTTY: process.stderr.isTTY === true,
  })
  const rendered = dedupeRendered(report.events, options)
  for (const entry of rendered) {
    process.stderr.write(`${entry.line}\n`)
  }
  // The report is written in one call, fully built before any write; the
  // optional notification actuator runs after, so even a throwing sink can
  // never change the machine bytes or the exit code (C7.4).
  process.stdout.write(`${JSON.stringify(report)}\n`)
  if (notify) {
    const sink = createPlatformNotificationSink({ platform: process.platform, spawnSync })
    for (const entry of rendered) {
      const event = report.events[entry.event_indexes[0] ?? 0]
      if (event === undefined || event.severity === 'notice') continue
      sink({ severity: event.severity, line: entry.line })
    }
  }
  return 0
}

process.exitCode = run(process.argv.slice(2))
