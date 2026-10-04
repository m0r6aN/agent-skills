/**
 * MRC-12 (HRO-P4c) — D10's recovery-diagnostics renderer controls (C1–C8),
 * the vocabulary-reconciliation enumeration, and the equivalence pins.
 * Named fixtures per label; falsifiability pairs asserted, never bare absence;
 * refusal/label NAMES asserted. Synthetic fixtures only; the notification
 * actuator runs through injected seams so the suite stays silent.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  D10_REASON_RECONCILIATION,
  REASON_VOCABULARY,
  REASON_VOCABULARY_VERSION,
} from '../../receipts/src/index.js'
import type { ConfigRepairProposal } from '../src/config-repair-proposal.js'
import {
  boundIdentifierText,
  buildDiagnosticsReport,
  type DiagnosticEvent,
  type DiagnosticIdentity,
  type DiagnosticInput,
  type DiagnosticLabel,
  dedupeRendered,
  deriveDiagnosticEvents,
  type NotificationRequest,
  renderHumanLine,
  resolveRenderOptions,
  sanitizeForTerminal,
} from '../src/recovery-diagnostics.js'
import {
  createPlatformNotificationSink,
  notificationCommand,
  type SpawnSyncLike,
} from '../src/recovery-notify.js'
import type { RecoveryEpisodeRecord, RouteUnavailableOutcome } from '../src/route-receipt.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const tsxCli = join(packageRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs')
const NO_COLOR = { color: false, interactive: false }

// ---------------------------------------------------------------------------
// Named fixtures. Record shapes are the landed MRC-08/MRC-10 types, built as
// data — the renderer is consumed read-only exactly as a caller would.
// ---------------------------------------------------------------------------

const requestedIdentity: DiagnosticIdentity = {
  registry_key: 'openrouter/x',
  provider: 'openrouter',
  model: 'x',
}

function makeEpisode(overrides: {
  chosen_fallback?: RecoveryEpisodeRecord['chosen_fallback']
  terminal?: RecoveryEpisodeRecord['terminal']
  refresh?: RecoveryEpisodeRecord['refresh']
  attempted?: RecoveryEpisodeRecord['attempted']
}): RecoveryEpisodeRecord {
  return {
    kind: 'recovery-episode-record',
    schema_version: 1,
    episode_id: 'ep-1',
    attempted: overrides.attempted ?? [],
    refresh: overrides.refresh ?? {
      result: 'refreshed',
      coalesced: false,
      requested_key: null,
      evidence_version: null,
      provenance: null,
      discovered: [],
      reason: null,
    },
    chosen_fallback: overrides.chosen_fallback ?? null,
    freshness: { verdict: 'fresh', age_ms: 0, tolerance_ms: 60000 },
    terminal: overrides.terminal ?? null,
  }
}

function makeTerminal(
  reason = 'fallback walk exhausted; catalog refresh then retry',
): RouteUnavailableOutcome {
  return {
    code: 'ROUTE_UNAVAILABLE',
    parcelRef: 'p1',
    requested: { lane: 'L1', registry_key: 'openrouter/x' },
    attempted: [],
    refusals: [],
    reason,
    hold: 'parcel-held',
  }
}

function fallbackChangeInput(): DiagnosticInput {
  return {
    parcel_ref: 'p1',
    correlation_id: 'c1',
    requested: requestedIdentity,
    recovery: makeEpisode({
      chosen_fallback: { identity: 'openrouter/y', role: 'fallback', handoff: null },
    }),
  }
}

function heldInput(): DiagnosticInput {
  return {
    parcel_ref: 'p1',
    correlation_id: 'c1',
    requested: requestedIdentity,
    recovery: makeEpisode({ terminal: makeTerminal() }),
  }
}

function refreshFailedInput(): DiagnosticInput {
  return {
    parcel_ref: 'p1',
    correlation_id: 'c1',
    requested: requestedIdentity,
    recovery: makeEpisode({
      refresh: {
        result: 'unavailable',
        coalesced: false,
        requested_key: 'openrouter/x',
        evidence_version: null,
        provenance: null,
        discovered: [],
        reason: 'catalog refresh unavailable in window',
      },
    }),
  }
}

/** The derivation-table parenthetical path: failure reason, no refreshed provenance. */
function refreshReasonInput(): DiagnosticInput {
  return {
    parcel_ref: 'p1',
    correlation_id: 'c1',
    requested: requestedIdentity,
    recovery: makeEpisode({
      refresh: {
        result: 'negative-cached',
        coalesced: true,
        requested_key: 'openrouter/x',
        evidence_version: null,
        provenance: null,
        discovered: [],
        reason: 'prior unavailability cached in window',
      },
    }),
  }
}

function mappingMissingInput(): DiagnosticInput {
  return {
    parcel_ref: 'p1',
    correlation_id: 'c1',
    requested: requestedIdentity,
    recovery: makeEpisode({
      attempted: [
        {
          identity: 'openrouter/x',
          role: 'requested',
          attempt: 1,
          outcome: 'refused',
          refusals: [{ name: 'MAPPING_MISSING_REFUSED', detail: 'no declared mapping exists' }],
        },
        {
          identity: 'openrouter/x',
          role: 'fallback',
          attempt: 2,
          outcome: 'refused',
          refusals: [
            { name: 'MAPPING_INCOMPLETE_REFUSED', detail: 'mapping lacks explicit values' },
          ],
        },
      ],
    }),
  }
}

const SECRET_CANARY = 'CANARY-SECRET-VALUE-9f2c'
const CREDENTIAL_CANARY = 'CANARY-CREDENTIAL-TOKEN-77aa'

function makeProposal(): ConfigRepairProposal {
  return {
    kind: 'pi-config-repair-proposal',
    status: 'PROPOSED-NOT-WRITTEN',
    schema_version: 1,
    target: {
      documents: ['pi-settings'],
      write_policy: 'content-hash | lock',
      scope_preference: 'session',
    },
    source_state: [
      {
        role: 'pi-settings',
        text: `models declaration bytes ${SECRET_CANARY} ${CREDENTIAL_CANARY}`,
        content_hash: 'hash-1',
        observed_at: '2026-09-28T00:00:00.000Z',
      },
    ],
    changes: [
      {
        path: 'modelsDeclaration.providers.openrouter.models.x',
        op: 'add',
        value: { secret: SECRET_CANARY, token: CREDENTIAL_CANARY },
        reason: 'verified model missing from local configuration',
        provenance: [{ source: 'catalog', locator: 'models/x' }],
      },
    ],
    mapping_provenance: {
      registry_key: 'openrouter/x',
      opencode_id: null,
      provider_local_id: null,
      protocol: 'openai-completions',
      mapping_source: { source: 'policy-mapping', locator: 'mappings.openrouter/x' },
    },
    evidence: {
      catalog: null,
      freshness: 'fresh',
      availability: {
        available: true,
        observed_via: 'metadata-refresh',
        provenance: { source: 'catalog', locator: 'models/x' },
      },
      trigger: { source_refusal: 'MAPPING_MISSING_REFUSED', episode_ref: 'ep-1' },
    },
    apply_contract: {
      authority: 'pi-model-configuration',
      writer: 'pi-model-configuration authorized writer',
      concurrency: 'content-hash | lock',
      checklist: [],
    },
    residual_dispositions: [],
    redacted_summary: {
      model: { registry_key: 'openrouter/x', host_spelling: 'x' },
      documents: ['pi-settings'],
      change_count: 1,
      source_hashes: [{ role: 'pi-settings', content_hash: 'hash-1' }],
    },
    credentials: { policy: 'credential references preserved', contains_credential_value: false },
    proposal_digest: 'digest-1',
  }
}

function proposalInput(): DiagnosticInput {
  return { parcel_ref: 'p1', correlation_id: 'c1', proposal: makeProposal() }
}

function captureStderr(run: () => void): string[] {
  const writes: string[] = []
  const original = process.stderr.write
  process.stderr.write = ((chunk: string | Uint8Array): boolean => {
    writes.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'))
    return true
  }) as typeof process.stderr.write
  try {
    run()
  } finally {
    process.stderr.write = original
  }
  return writes
}

function runCli(
  args: readonly string[],
  extraEnv?: Record<string, string>,
): { status: number | null; stderr: string; stdout: string } {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && key.toUpperCase() !== 'PATH') env[key] = value
  }
  Object.assign(env, extraEnv ?? {})
  const result = spawnSync(process.execPath, [tsxCli, 'src/cli.ts', ...args], {
    cwd: packageRoot,
    encoding: 'utf8',
    env,
  })
  return { status: result.status, stderr: result.stderr, stdout: result.stdout }
}

/** Observable fire markers: suppression lines + terminal-bell bytes. */
function fireMarkers(stderr: string): number {
  const bells = stderr.split('\x07').length - 1
  return bells + suppressionLines(stderr).length
}

function suppressionLines(stderr: string): readonly string[] {
  return stderr.split('\n').filter((line) => line.startsWith('warning: notification suppressed'))
}

// ---------------------------------------------------------------------------
// C1 — label -> vocabulary reconciliation (enumeration + closed surface).
// ---------------------------------------------------------------------------

test('C1: each D10 label is produced by exactly one named fixture and resolves through the landed map', () => {
  const fixtures: ReadonlyArray<{ label: DiagnosticLabel; input: DiagnosticInput }> = [
    { label: 'approved_fallback_selected', input: fallbackChangeInput() },
    { label: 'route_unavailable', input: heldInput() },
    { label: 'catalog_refresh_failed', input: refreshFailedInput() },
    { label: 'mapping_missing', input: mappingMissingInput() },
    { label: 'config_update_proposed', input: proposalInput() },
  ]
  const emittedLabels = new Set<string>()
  const emittedReasons = new Set<string>()
  for (const fixture of fixtures) {
    const emitted = deriveDiagnosticEvents(fixture.input)
    const matching = emitted.filter((event) => event.label === fixture.label)
    assert.equal(matching.length, 1, `expected exactly one '${fixture.label}' event`)
    const event = matching[0]
    assert.ok(event)
    assert.equal(event.reason, D10_REASON_RECONCILIATION[fixture.label])
    assert.equal(event.kind, REASON_VOCABULARY[event.reason].kind)
    assert.equal(event.outcome, REASON_VOCABULARY[event.reason].outcome)
    for (const derived of emitted) {
      emittedLabels.add(derived.label)
      emittedReasons.add(derived.reason)
    }
  }
  // Closed surface, derived from every EMITTED event across the fixtures (not
  // from the authored fixture list): exactly five labels, and the emitted
  // reason set equals the map's range — if the derivation ever fabricated a
  // label or a code, these equalities turn red.
  assert.equal(Object.keys(D10_REASON_RECONCILIATION).length, 5)
  assert.deepEqual([...emittedLabels].sort(), Object.keys(D10_REASON_RECONCILIATION).sort())
  assert.deepEqual(
    [...emittedReasons].sort(),
    [...new Set(Object.values(D10_REASON_RECONCILIATION))].sort(),
  )
})

test('C1: the machine report carries vocabulary_version and complete events regardless of dedup', () => {
  const input = fallbackChangeInput()
  const report = buildDiagnosticsReport({ inputs: [input, input, heldInput()] })
  assert.equal(report.kind, 'recovery-diagnostics')
  assert.equal(report.schema_version, 1)
  assert.equal(report.vocabulary_version, REASON_VOCABULARY_VERSION)
  assert.equal(report.events.length, 3)
})

// ---------------------------------------------------------------------------
// C3.1/C5 — warning rule and dedup counts.
// ---------------------------------------------------------------------------

test('C3.1+C5: one warning per changed-route fallback; identity-equal fallback renders none; duplicates collapse to (x2) while events stay complete', () => {
  const input = fallbackChangeInput()
  const events = deriveDiagnosticEvents(input)
  assert.equal(events.length, 1)
  const first = events[0]
  assert.ok(first)
  const line = renderHumanLine(first, NO_COLOR)
  assert.ok(line.startsWith('warning: '), line)
  assert.ok(line.includes('approved fallback changed route p1/c1'), line)
  assert.ok(line.includes('requested openrouter/x'), line)
  assert.ok(line.includes('-> selected openrouter/y'), line)
  assert.ok(line.includes('[reason=APPROVED_FALLBACK_SELECTED]'), line)
  // Falsifiability pair: identity-equal fallback turns the warning green by absence.
  const equalInput: DiagnosticInput = {
    ...input,
    recovery: makeEpisode({
      chosen_fallback: { identity: 'openrouter/x', role: 'fallback', handoff: null },
    }),
  }
  const equalEvents = deriveDiagnosticEvents(equalInput)
  assert.equal(
    equalEvents.filter((event) => event.label === 'approved_fallback_selected').length,
    0,
  )
  // Dedup: identical events collapse to one rendered line with a visible count;
  // events[] retains every complete record with its index.
  const report = buildDiagnosticsReport({ inputs: [input, input] })
  assert.equal(report.events.length, 2)
  assert.equal(report.rendered.length, 1)
  const rendered = report.rendered[0]
  assert.ok(rendered)
  assert.equal(rendered.occurrences, 2)
  assert.deepEqual([...rendered.event_indexes], [0, 1])
  assert.ok(rendered.line.endsWith(' (x2)'), rendered.line)
})

// ---------------------------------------------------------------------------
// C3.2 — actionable error on a held parcel.
// ---------------------------------------------------------------------------

test('C3.2: a held parcel renders one actionable error with IDs, requested identity, reason, and next: terminal.reason', () => {
  const events = deriveDiagnosticEvents(heldInput())
  const errors = events.filter((event) => event.severity === 'error')
  assert.equal(errors.length, 1)
  const first = errors[0]
  assert.ok(first)
  const line = renderHumanLine(first, NO_COLOR)
  assert.ok(line.startsWith('error: '), line)
  assert.ok(line.includes('parcel held p1/c1'), line)
  assert.ok(line.includes('requested openrouter/x'), line)
  assert.ok(line.includes('[reason=ROUTE_UNAVAILABLE]'), line)
  assert.ok(line.includes('next: fallback walk exhausted; catalog refresh then retry'), line)
  // Field rule: a recorded selected identity appears on the error line too.
  const both = deriveDiagnosticEvents({
    ...heldInput(),
    recovery: makeEpisode({
      chosen_fallback: { identity: 'openrouter/y', role: 'fallback', handoff: null },
      terminal: makeTerminal(),
    }),
  })
  const bothError = both.find((event) => event.label === 'route_unavailable')
  assert.ok(bothError)
  assert.ok(renderHumanLine(bothError, NO_COLOR).includes('-> selected openrouter/y'))
  // Falsifiability pair: an episode without a terminal renders no error.
  const openErrors = deriveDiagnosticEvents(fallbackChangeInput()).filter(
    (event) => event.severity === 'error',
  )
  assert.equal(openErrors.length, 0)
})

// ---------------------------------------------------------------------------
// C3.3 — notices and D9 redaction.
// ---------------------------------------------------------------------------

test('C3.3: mapping_missing / catalog_refresh_failed / config_update_proposed each render one notice; proposal values and credentials never surface', () => {
  const mapping = deriveDiagnosticEvents(mappingMissingInput())
  assert.equal(mapping.length, 1)
  const mappingFirst = mapping[0]
  assert.ok(mappingFirst)
  const mappingLine = renderHumanLine(mappingFirst, NO_COLOR)
  assert.ok(mappingLine.startsWith('notice: mapping_missing p1/c1'), mappingLine)
  assert.ok(mappingLine.includes('[reason=MAPPING_INCOMPLETE_REFUSED]'), mappingLine)
  assert.ok(mappingLine.includes('MAPPING_MISSING_REFUSED'), mappingLine)
  assert.ok(mappingLine.includes('MAPPING_INCOMPLETE_REFUSED'), mappingLine)

  const refresh = deriveDiagnosticEvents(refreshFailedInput())
  assert.equal(refresh.length, 1)
  const refreshFirst = refresh[0]
  assert.ok(refreshFirst)
  const refreshLine = renderHumanLine(refreshFirst, NO_COLOR)
  assert.ok(refreshLine.startsWith('notice: catalog_refresh_failed p1/c1'), refreshLine)
  assert.ok(refreshLine.includes('[reason=CATALOG_REFRESH_FAILED]'), refreshLine)
  assert.ok(refreshLine.includes('refresh:unavailable'), refreshLine)

  const proposalEvents = deriveDiagnosticEvents(proposalInput())
  assert.equal(proposalEvents.length, 1)
  const proposalFirst = proposalEvents[0]
  assert.ok(proposalFirst)
  const proposalLine = renderHumanLine(proposalFirst, NO_COLOR)
  assert.ok(proposalLine.startsWith('notice: config_update_proposed'), proposalLine)
  assert.ok(proposalLine.includes('[reason=CONFIG_UPDATE_PROPOSED]'), proposalLine)
  assert.ok(proposalLine.includes('changes=1'), proposalLine)
  assert.ok(
    proposalLine.includes('next: apply via pi-model-configuration authorized writer'),
    proposalLine,
  )
  // Canary scan: no changes[].value content, source bytes, or credential text
  // on the rendered line or anywhere in the machine report.
  const machineBytes = JSON.stringify(buildDiagnosticsReport({ inputs: [proposalInput()] }))
  for (const surface of [proposalLine, machineBytes]) {
    assert.ok(!surface.includes(SECRET_CANARY), 'proposal value leaked')
    assert.ok(!surface.includes(CREDENTIAL_CANARY), 'credential text leaked')
    assert.ok(!surface.includes('models declaration bytes'), 'source bytes leaked')
  }
})

// ---------------------------------------------------------------------------
// C4 — sanitization and bounding.
// ---------------------------------------------------------------------------

function hasControlBytes(text: string): boolean {
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0
    if (code === 10) continue // the write transport's line separator
    if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) return true
  }
  return false
}

test('C4: ANSI and control bytes are stripped from lines, identifiers bound at 96 with the marker, machine events keep complete values', () => {
  const dirtyRaw = `a\x1b[31mb${String.fromCharCode(0)}c\nd${String.fromCharCode(127)}e`
  assert.equal(sanitizeForTerminal(dirtyRaw), 'abcde')
  const longKey = 'z'.repeat(500)
  const bounded = boundIdentifierText(longKey)
  assert.equal(bounded, `${'z'.repeat(96)}…`)
  assert.equal(bounded.length, 97)
  const dirty: DiagnosticInput = {
    parcel_ref: 'p1\x1b[31m',
    correlation_id: `c${String.fromCharCode(0)}1`,
    requested: { registry_key: longKey, provider: null, model: null },
    recovery: makeEpisode({ terminal: makeTerminal() }),
  }
  const events = deriveDiagnosticEvents(dirty)
  const first = events[0]
  assert.ok(first)
  const line = renderHumanLine(first, NO_COLOR)
  assert.equal(hasControlBytes(line), false, line)
  assert.equal(line.includes(String.fromCharCode(10)), false, 'rendered lines stay single-line')
  assert.ok(line.includes(`${'z'.repeat(96)}…`), line)
  // The machine report retains the complete validated field values.
  assert.equal(first.requested.registry_key, longKey)
  assert.equal(first.parcel_ref, 'p1\x1b[31m')
  assert.equal(first.correlation_id, `c${String.fromCharCode(0)}1`)
})

// ---------------------------------------------------------------------------
// C6 — non-interactive output and no-color.
// ---------------------------------------------------------------------------

test('C6: each of --no-color, NO_COLOR, --non-interactive, and non-TTY forces zero ANSI; color only on TTY without flags', () => {
  const on = resolveRenderOptions({
    noColorFlag: false,
    nonInteractiveFlag: false,
    noColorEnv: undefined,
    isTTY: true,
  })
  assert.deepEqual(on, { color: true, interactive: true })
  const offFacts = [
    { noColorFlag: true, nonInteractiveFlag: false, noColorEnv: undefined, isTTY: true },
    { noColorFlag: false, nonInteractiveFlag: false, noColorEnv: '1', isTTY: true },
    { noColorFlag: false, nonInteractiveFlag: true, noColorEnv: undefined, isTTY: true },
    { noColorFlag: false, nonInteractiveFlag: false, noColorEnv: undefined, isTTY: false },
  ]
  const events = deriveDiagnosticEvents(fallbackChangeInput())
  const first = events[0]
  assert.ok(first)
  for (const facts of offFacts) {
    const options = resolveRenderOptions(facts)
    assert.equal(options.color, false, JSON.stringify(facts))
    assert.equal(renderHumanLine(first, options).includes('\x1b'), false)
    assert.equal(
      dedupeRendered(events, options).some((entry) => entry.line.includes('\x1b')),
      false,
    )
  }
  // The dedup machine view carries zero ANSI even when color is enabled.
  assert.equal(
    dedupeRendered(events).some((entry) => entry.line.includes('\x1b')),
    false,
  )
  // Color mode may carry ANSI on the severity prefix (and nothing else).
  const colored = renderHumanLine(first, on)
  assert.ok(colored.startsWith('\x1b['), colored)
  assert.ok(colored.includes('\x1b[0m'), colored)
  // Non-interactive adds no interactive affordances: rendering is one-shot.
  assert.equal(
    resolveRenderOptions({
      noColorFlag: false,
      nonInteractiveFlag: true,
      noColorEnv: undefined,
      isTTY: true,
    }).interactive,
    false,
  )
})

// ---------------------------------------------------------------------------
// C7 — optional notifications: planner argvs and the guarded sink executor.
// ---------------------------------------------------------------------------

const warnRequest: NotificationRequest = { severity: 'warning', line: 'warning: x' }
const errorRequest: NotificationRequest = { severity: 'error', line: 'error: y' }

test('C7: notificationCommand is platform-aware — powershell argv on win32, osascript on darwin, bell fallback never throws', () => {
  const win = notificationCommand('win32', warnRequest)
  assert.equal(win.kind, 'spawn')
  assert.ok(win.kind === 'spawn')
  assert.equal(win.command, 'powershell.exe')
  assert.deepEqual(win.args.slice(0, 3), ['-NoProfile', '-NonInteractive', '-Command'])
  assert.ok(
    win.args.some((arg) => arg.includes('[console]::beep')),
    JSON.stringify(win.args),
  )
  // The Windows branch never shells to a POSIX tool (falsifiability pair).
  assert.ok(!['sh', 'bash', 'osascript'].includes(win.command))
  const mac = notificationCommand('darwin', errorRequest)
  assert.ok(mac.kind === 'spawn')
  assert.equal(mac.kind === 'spawn' ? mac.command : '', 'osascript')
  assert.deepEqual(mac.kind === 'spawn' ? mac.args : [], ['-e', 'beep 1'])
  for (const platform of ['linux', 'freebsd', 'sunos', 'unsupported-platform']) {
    assert.equal(notificationCommand(platform, warnRequest).kind, 'bell')
    assert.equal(notificationCommand(platform, errorRequest).kind, 'bell')
  }
})

test('C7: the guarded sink fires once per request on success, suppresses at most once on failure, and never propagates', () => {
  // Success seam: N requests -> N spawns, zero stderr output.
  const calls: string[] = []
  const counting: SpawnSyncLike = (command, args) => {
    calls.push(`${command} ${args.join(' ')}`)
    return { status: 0 }
  }
  const sink = createPlatformNotificationSink({ platform: 'darwin', spawnSync: counting })
  const successWrites = captureStderr(() => {
    sink(warnRequest)
    sink(errorRequest)
    sink(warnRequest)
  })
  assert.equal(calls.length, 3)
  assert.deepEqual(successWrites, [])

  // Throwing seam: no propagation, exactly one suppression line, then retire.
  let attempts = 0
  const throwing: SpawnSyncLike = () => {
    attempts += 1
    throw new Error(`boom${String.fromCharCode(27)}[31m`)
  }
  const throwingSink = createPlatformNotificationSink({ platform: 'win32', spawnSync: throwing })
  const thrownWrites = captureStderr(() => {
    throwingSink(warnRequest)
    throwingSink(errorRequest)
    throwingSink(warnRequest)
  })
  assert.equal(attempts, 1, 'the sink retires after the first failure')
  assert.equal(thrownWrites.length, 1)
  const suppressedLine = thrownWrites[0]
  assert.ok(suppressedLine)
  assert.ok(suppressedLine.startsWith('warning: notification suppressed ('), suppressedLine)
  assert.equal(hasControlBytes(suppressedLine), false)

  // Spawn-error seam (the ENOENT path): same one-line suppression.
  const errorSink = createPlatformNotificationSink({
    platform: 'win32',
    spawnSync: () => ({ error: new Error('spawnSync powershell.exe ENOENT') }),
  })
  const errorWrites = captureStderr(() => errorSink(warnRequest))
  assert.equal(errorWrites.length, 1)
  const spawnErrorLine = errorWrites[0]
  assert.ok(spawnErrorLine)
  assert.ok(spawnErrorLine.includes('notification suppressed'))

  // Bell fallback: one bell byte per fire, zero spawns.
  let spawns = 0
  const bellWrites = captureStderr(() => {
    const bellSink = createPlatformNotificationSink({
      platform: 'linux',
      spawnSync: () => {
        spawns += 1
        return { status: 0 }
      },
    })
    bellSink(warnRequest)
  })
  assert.equal(spawns, 0)
  assert.deepEqual(bellWrites, [String.fromCharCode(7)])
})

test('C7: static no-background-service control over the new modules', () => {
  const banned =
    /\b(setInterval|setImmediate|setTimeout|watch|watchFile|connect|Socket|createServer|dgram|worker_threads)\b/
  for (const relative of ['src/recovery-diagnostics.ts', 'src/recovery-notify.ts', 'src/cli.ts']) {
    const source = readFileSync(join(packageRoot, relative), 'utf8')
    assert.equal(banned.test(source), false, relative)
  }
})

test('C7: CLI notification isolation — counter-0 without --notify, notices never notify, failing sink leaves bytes and exit code unchanged', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mrc12-notify-'))
  try {
    const batchPath = join(dir, 'batch.json')
    writeFileSync(
      batchPath,
      JSON.stringify({ inputs: [fallbackChangeInput(), fallbackChangeInput(), proposalInput()] }),
    )
    const noticesPath = join(dir, 'notices.json')
    writeFileSync(noticesPath, JSON.stringify({ inputs: [proposalInput()] }))
    const quietEnv = { PATH: '' }
    const base = runCli(['diagnostics', batchPath])
    const firing = runCli(['diagnostics', batchPath, '--notify'], quietEnv)
    const notices = runCli(['diagnostics', noticesPath, '--notify'], quietEnv)
    // Counter-0: without --notify the sink is never invoked. Observable because
    // a fired sink under this env MUST leave a marker (suppressed line or bell
    // byte) — the --notify run below is the falsifiability pair proving it.
    assert.equal(fireMarkers(base.stderr), 0, base.stderr)
    assert.ok(fireMarkers(firing.stderr) > 0, firing.stderr)
    // Notices never notify: the marker stays at zero even with --notify.
    assert.equal(fireMarkers(notices.stderr), 0, notices.stderr)
    // Byte-equality: machine report identical across sink-free and failing-sink
    // runs; the exit code is unchanged; at most one suppression line.
    assert.equal(firing.stdout, base.stdout)
    assert.equal(base.status, 0)
    assert.equal(firing.status, 0)
    assert.ok(suppressionLines(firing.stderr).length <= 1, firing.stderr)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// C8 — the CLI seam (subprocess, the tests/cli.test.ts style). The shipped
// `validate` verb is equivalence evidence by its own suite passing with zero
// edits (Required Test 9) and is not re-tested here.
// ---------------------------------------------------------------------------

test('C8: diagnostics verb — one JSON document on stdout, human lines on stderr, exit codes 0/1/2 pinned', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mrc12-cli-'))
  try {
    // Five-label fixture: fallback change + hold + refresh failure + mapping
    // refusals in one episode, plus the proposal input.
    const fullEpisode = makeEpisode({
      chosen_fallback: { identity: 'openrouter/y', role: 'fallback', handoff: null },
      terminal: makeTerminal(),
      refresh: {
        result: 'deadline-exceeded',
        coalesced: false,
        requested_key: 'openrouter/x',
        evidence_version: null,
        provenance: null,
        discovered: [],
        reason: 'episode deadline expired',
      },
      attempted: mappingMissingInput().recovery?.attempted ?? [],
    })
    const batchPath = join(dir, 'batch.json')
    writeFileSync(
      batchPath,
      JSON.stringify({
        inputs: [{ ...heldInput(), recovery: fullEpisode }, proposalInput()],
      }),
    )
    const ok = runCli(['diagnostics', batchPath])
    assert.equal(ok.status, 0, ok.stderr)
    const report = JSON.parse(ok.stdout) as {
      kind: string
      schema_version: number
      vocabulary_version: string
      events: DiagnosticEvent[]
      rendered: { line: string; occurrences: number }[]
    }
    assert.equal(report.kind, 'recovery-diagnostics')
    assert.equal(report.schema_version, 1)
    assert.equal(report.vocabulary_version, REASON_VOCABULARY_VERSION)
    assert.equal(report.events.length, 5)
    assert.deepEqual(
      [...new Set(report.events.map((event) => event.label))].sort(),
      Object.keys(D10_REASON_RECONCILIATION).sort(),
    )
    // Stdout is exactly one JSON document; every human line lives on stderr.
    assert.equal(ok.stdout.trimEnd().split('\n').length, 1)
    assert.ok(ok.stdout.trimStart().startsWith('{'))
    assert.ok(ok.stderr.includes('warning: approved fallback changed route'), ok.stderr)
    assert.ok(ok.stderr.includes('error: parcel held p1/c1'), ok.stderr)
    assert.ok(ok.stderr.includes('notice: catalog_refresh_failed'), ok.stderr)
    assert.ok(ok.stderr.includes('notice: mapping_missing'), ok.stderr)
    assert.ok(ok.stderr.includes('notice: config_update_proposed'), ok.stderr)

    // Invalid input document -> exit 1, typed violations listed, empty stdout.
    const invalidPath = join(dir, 'invalid.json')
    writeFileSync(invalidPath, JSON.stringify({ inputs: [{ recovery: { kind: 'wrong' } }] }))
    const invalid = runCli(['diagnostics', invalidPath])
    assert.equal(invalid.status, 1)
    assert.equal(invalid.stdout, '')
    assert.ok(invalid.stderr.includes('violation:'), invalid.stderr)
    assert.ok(invalid.stderr.includes('$.inputs[0].recovery.kind'), invalid.stderr)

    // Usage class -> exit 2 (missing argument, missing file, unparseable, bad flag).
    assert.equal(runCli(['diagnostics']).status, 2)
    assert.equal(runCli(['diagnostics', join(dir, 'absent.json')]).status, 2)
    const brokenPath = join(dir, 'broken.json')
    writeFileSync(brokenPath, '{not json')
    assert.equal(runCli(['diagnostics', brokenPath]).status, 2)
    assert.equal(runCli(['diagnostics', batchPath, '--bogus']).status, 2)

    // Non-TTY subprocess: zero ANSI anywhere, with or without --no-color.
    for (const args of [
      ['diagnostics', batchPath],
      ['diagnostics', batchPath, '--no-color'],
    ]) {
      const plain = runCli(args)
      assert.equal(hasControlBytes(plain.stdout), false)
      assert.equal(hasControlBytes(plain.stderr), false)
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Rework controls (review findings F-01/F-02 live probes).
// ---------------------------------------------------------------------------

function hasLoneSurrogate(text: string): boolean {
  for (let index = 0; index < text.length; index += 1) {
    const unit = text.charCodeAt(index)
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = text.charCodeAt(index + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        index += 1
        continue
      }
      return true
    }
    if (unit >= 0xdc00 && unit <= 0xdfff) return true
  }
  return false
}

test('R1: a non-envelope refresh.provenance is rejected by the typed guard (live-probe control)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mrc12-probe-'))
  try {
    const malformed = JSON.parse(JSON.stringify({ inputs: [refreshReasonInput()] })) as {
      inputs: [{ recovery: { refresh: { provenance: unknown } } }]
    }
    malformed.inputs[0].recovery.refresh.provenance = 5
    const badPath = join(dir, 'bad.json')
    writeFileSync(badPath, JSON.stringify(malformed))
    const bad = runCli(['diagnostics', badPath])
    assert.equal(bad.status, 1, bad.stderr)
    assert.equal(bad.stdout, '')
    assert.ok(bad.stderr.includes('$.inputs[0].recovery.refresh.provenance'), bad.stderr)
    // Typed twin: provenance null with a failure reason derives exactly one
    // catalog_refresh_failed notice (the derivation-table parenthetical path).
    const twin = deriveDiagnosticEvents(refreshReasonInput())
    assert.equal(twin.length, 1)
    const first = twin[0]
    assert.ok(first)
    assert.equal(first.label, 'catalog_refresh_failed')
    assert.equal(first.reason, 'CATALOG_REFRESH_FAILED')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('R2: bounding never splits a surrogate pair; no lone surrogate reaches any output surface', () => {
  const astral = String.fromCodePoint(0x1f600)
  // A pair straddling the 96-unit bound: truncation lands on a code-point
  // boundary and the trailing unpaired high surrogate is dropped.
  const straddling = 'z'.repeat(95) + astral.repeat(50)
  const bounded = boundIdentifierText(straddling)
  assert.equal(hasLoneSurrogate(bounded), false)
  assert.equal(bounded, `${'z'.repeat(95)}…`)
  // Short inputs with intact pairs pass through unbound and unsplit.
  const shortPair = `key-${astral}`
  assert.equal(boundIdentifierText(shortPair), shortPair)
  assert.equal(hasLoneSurrogate(shortPair), false)
  // And a rendered line carrying an astral identity has no lone surrogate.
  const events = deriveDiagnosticEvents({
    requested: { registry_key: straddling, provider: null, model: null },
    recovery: makeEpisode({ terminal: makeTerminal() }),
  })
  const first = events[0]
  assert.ok(first)
  assert.equal(hasLoneSurrogate(renderHumanLine(first, NO_COLOR)), false)
})
