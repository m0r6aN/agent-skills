/**
 * FK-P17′ bypass + outage matrix harness — CLI entry.
 *
 *   npm run matrix   runs the 26 matrix cases + 3 controls against the shipped
 *                    surfaces and emits the classification evidence set.
 *   npm run measure  runs the measurement populations (MEAS-01…05) and emits
 *                    the T6 measurement artifacts, then refreshes the five
 *                    measurement rows in matrix.json and the manifest so the
 *                    final artifact set carries one coherent disposition.
 *
 * Evidence emission rules (spec T5/T6 + D13):
 *  - every record validates against its schema before write
 *    (EVIDENCE_WRITE_FAILED otherwise);
 *  - `exercised: yes | gap` is first-class on every matrix row; no row
 *    defaults to exercised (OQ-1);
 *  - a not-exercised row is never counted passed and never dropped;
 *  - the banned-claim scan covers every emitted byte except the scan block of
 *    summary.json itself (self-reference); summary.json records the result.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Ajv } from 'ajv'
import { canonicalJson, sha256Hex } from './canonical.js'
import { BYPASS_RUNNERS, runLinkCase } from './channels/bypass.js'
import {
  runCtl01,
  runCtl02,
  runCtl03,
  runV6Mb01,
  runV6Mb02,
  runV6Mb03,
  runV8Sst01,
  runV8Sst02,
  runV8Sst03,
} from './channels/gate.js'
import {
  type Meas05Result,
  OUTAGE_RUNNERS,
  runMeas01,
  runMeas02,
  runMeas03,
  runMeas04,
  runMeas05,
} from './channels/outage.js'
import { HarnessError } from './errors.js'
import { captureHostFacts, type HostFacts, hostFactsDigest } from './host-facts.js'
import {
  IP3_COMPARABILITY_CAVEAT,
  type MeasurementRecord,
  type PopulationStatus,
  percentilesFor,
  populationStatus,
  type SpanSummary,
} from './measure.js'
import {
  BANNED_CLAIM_PHRASES,
  buildCaseRecord,
  type CaseEvidenceRecord,
  type CaseOutcome,
  scanBannedClaims,
} from './record.js'
import { type PinSnapshotRow, snapshotPins } from './surface-refs.js'
import { type CaseRow, type Classification, loadRegistry, type Registry } from './vectors.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const evidenceDir = join(packageRoot, 'evidence')

const ajv = new Ajv({ allErrors: true })
const validateEvidenceRecord = ajv.compile(
  JSON.parse(readFileSync(join(packageRoot, 'schemas', 'evidence-record.schema.json'), 'utf8')),
)
const validateMeasurementRecord = ajv.compile(
  JSON.parse(readFileSync(join(packageRoot, 'schemas', 'measurement-record.schema.json'), 'utf8')),
)

type CaseRunner = (row: CaseRow) => Promise<CaseOutcome>

const RUNNERS: Record<string, CaseRunner> = {
  ...BYPASS_RUNNERS,
  'BYP-LK-01': runLinkCase,
  'BYP-LK-02': runLinkCase,
  'BYP-LK-03': runLinkCase,
  'BYP-LK-04': runLinkCase,
  'BYP-MB-01': runV6Mb01,
  'BYP-MB-02': runV6Mb02,
  'BYP-MB-03': runV6Mb03,
  'SST-01': runV8Sst01,
  'SST-02': runV8Sst02,
  'SST-03': runV8Sst03,
  ...OUTAGE_RUNNERS,
  'CTL-01': runCtl01,
  'CTL-02': runCtl02,
  'CTL-03': runCtl03,
}

export interface MatrixRow {
  readonly caseId: string
  readonly kind: 'vector' | 'control' | 'measurement'
  readonly vectorClass: string | null
  readonly exercised: 'yes' | 'gap'
  readonly status: 'exercised' | 'not-exercised'
  readonly classification: Classification | null
  readonly collateral: boolean
  readonly mechanismPolicyClass: 'model-membership' | 'scope' | 'none'
  readonly artifact: string
  readonly hypothesisFalsified: boolean
  readonly gapRecord: CaseEvidenceRecord['gapRecord']
  readonly dispositionNote: string
}

interface ClassificationRun {
  readonly vectorByClass: Map<string, CaseEvidenceRecord[]>
  readonly controls: CaseEvidenceRecord[]
}

async function runClassification(registry: Registry): Promise<ClassificationRun> {
  const vectorByClass = new Map<string, CaseEvidenceRecord[]>()
  for (const vectorClass of registry.vectorClasses) {
    const records: CaseEvidenceRecord[] = []
    for (const row of vectorClass.cases) {
      const runner = RUNNERS[row.id]
      if (runner === undefined) {
        throw new HarnessError('VECTOR_FIXTURE_MALFORMED', `no runner registered for ${row.id}`)
      }
      const outcome = await runner(row)
      records.push(buildCaseRecord(row, outcome))
    }
    vectorByClass.set(vectorClass.vectorClass, records)
  }
  const controls: CaseEvidenceRecord[] = []
  for (const row of registry.controls) {
    const runner = RUNNERS[row.id]
    if (runner === undefined) {
      throw new HarnessError('VECTOR_FIXTURE_MALFORMED', `no runner registered for ${row.id}`)
    }
    controls.push(buildCaseRecord(row, await runner(row)))
  }
  return { vectorByClass, controls }
}

interface MeasurementDisposition {
  readonly state: 'pending' | 'complete' | 'refused'
  readonly perCase: Record<string, 'yes' | 'gap'>
  readonly populationStatus: readonly PopulationStatus[]
  readonly meas05: Meas05Result | null
}

const MEAS_CASE_IDS = ['MEAS-01', 'MEAS-02', 'MEAS-03', 'MEAS-04', 'MEAS-05'] as const

function measurementMatrixRows(disposition: MeasurementDisposition): MatrixRow[] {
  return MEAS_CASE_IDS.map((caseId) => {
    const exercised = disposition.perCase[caseId] ?? 'gap'
    return {
      caseId,
      kind: 'measurement' as const,
      vectorClass: null,
      exercised,
      status: exercised === 'yes' ? ('exercised' as const) : ('not-exercised' as const),
      classification: null,
      collateral: false,
      mechanismPolicyClass: 'none' as const,
      artifact:
        caseId === 'MEAS-05'
          ? 'evidence/measurement-summary.json#meas05'
          : 'evidence/measurements.jsonl',
      hypothesisFalsified: false,
      gapRecord:
        exercised === 'yes'
          ? null
          : {
              code: 'not-exercised',
              reason:
                disposition.state === 'pending'
                  ? 'measurement populations are executed by npm run measure (T6)'
                  : 'measurement population minimum not met (MEASUREMENT_INCOMPLETE: claim refused, records retained)',
              obligation:
                'FK-P18′ lane: measurement population evidence (bound in measurement-summary.json)',
            },
      dispositionNote:
        'measurement carrier (T3): classification vocabulary applies to matrix/control rows; disposition bound in evidence/measurement-summary.json',
    }
  })
}

function buildMatrixRows(
  run: ClassificationRun,
  registry: Registry,
  disposition: MeasurementDisposition,
): MatrixRow[] {
  const rows: MatrixRow[] = []
  for (const vectorClass of registry.vectorClasses) {
    for (const record of run.vectorByClass.get(vectorClass.vectorClass) ?? []) {
      rows.push(
        recordToRow(
          record,
          `evidence/vectors/V${vectorClass.vectorClass.slice(1)}-${vectorClass.artifactBase}.json#${record.caseId}`,
        ),
      )
    }
  }
  for (const record of run.controls) {
    rows.push(recordToRow(record, `evidence/controls.json#${record.caseId}`))
  }
  rows.push(...measurementMatrixRows(disposition))
  return rows
}

function recordToRow(record: CaseEvidenceRecord, artifact: string): MatrixRow {
  return {
    caseId: record.caseId,
    kind: record.kind,
    vectorClass: record.vectorClass,
    exercised: record.exercised,
    status: record.status,
    classification: record.classification,
    collateral: record.collateral,
    mechanismPolicyClass: record.mechanismPolicyClass,
    artifact,
    hypothesisFalsified: record.hypothesisFalsified,
    gapRecord: record.gapRecord,
    dispositionNote: record.classificationBasis,
  }
}

interface Tallies {
  readonly scopeContainmentMechanical: string[]
  readonly modelMembershipRefusals: string[]
  readonly unsupportedWithEffectEvidence: string[]
  readonly falsifiedHypotheses: string[]
  readonly notExercised: string[]
}

function computeTallies(rows: readonly MatrixRow[], run: ClassificationRun): Tallies {
  const scopeContainmentMechanical: string[] = []
  const modelMembershipRefusals: string[] = []
  const unsupportedWithEffectEvidence: string[] = []
  const falsifiedHypotheses: string[] = []
  const notExercised: string[] = []
  const all = [...run.controls, ...[...run.vectorByClass.values()].flat()]
  for (const record of all) {
    if (record.status === 'not-exercised') {
      notExercised.push(record.caseId)
      continue
    }
    if (record.classification === 'mechanical' && record.mechanismPolicyClass === 'scope') {
      scopeContainmentMechanical.push(record.caseId)
    }
    if (
      record.classification === 'mechanical' &&
      record.mechanismPolicyClass === 'model-membership'
    ) {
      modelMembershipRefusals.push(record.caseId)
    }
    if (record.classification === 'unsupported' && record.observed?.effectLanded === true) {
      unsupportedWithEffectEvidence.push(record.caseId)
    }
    if (record.hypothesisFalsified) falsifiedHypotheses.push(record.caseId)
  }
  for (const row of rows) {
    if (row.status === 'not-exercised' && !notExercised.includes(row.caseId)) {
      notExercised.push(row.caseId)
    }
  }
  return {
    scopeContainmentMechanical,
    modelMembershipRefusals,
    unsupportedWithEffectEvidence,
    falsifiedHypotheses,
    notExercised,
  }
}

function writeArtifact(relativePath: string, bytes: string): { path: string; sha256: string } {
  const absolute = join(evidenceDir, relativePath.replace(/^evidence\//, ''))
  mkdirSync(join(absolute, '..'), { recursive: true })
  try {
    writeFileSync(absolute, bytes, 'utf8')
  } catch (err) {
    throw new HarnessError(
      'EVIDENCE_WRITE_FAILED',
      `cannot write ${relativePath}: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
  return { path: relativePath, sha256: sha256Hex(bytes) }
}

function validateRecord(record: CaseEvidenceRecord): void {
  // The Ajv callable is a type guard; binding to a boolean first keeps
  // `record` usable in the failure branch (guard narrowing would void it).
  const ok: boolean = validateEvidenceRecord(record)
  if (!ok) {
    throw new HarnessError(
      'EVIDENCE_WRITE_FAILED',
      `evidence record fails schema: ${record.caseId}`,
      {
        errors: validateEvidenceRecord.errors,
      },
    )
  }
}

function validateMeasurement(rec: MeasurementRecord): void {
  const ok: boolean = validateMeasurementRecord(rec)
  if (!ok) {
    throw new HarnessError(
      'EVIDENCE_WRITE_FAILED',
      `measurement record fails schema: ${rec.caseId}`,
      {
        errors: validateMeasurementRecord.errors,
      },
    )
  }
}

interface SummaryScan {
  readonly scannedArtifacts: number
  readonly phrasesChecked: number
  readonly violations: string[]
  readonly result: 'clean'
  readonly scanScope: string
}

function emitClassificationArtifacts(
  run: ClassificationRun,
  registry: Registry,
  disposition: MeasurementDisposition,
  facts: HostFacts,
  pins: readonly PinSnapshotRow[],
): void {
  const written: Array<{ path: string; sha256: string }> = []
  for (const vectorClass of registry.vectorClasses) {
    const records = run.vectorByClass.get(vectorClass.vectorClass) ?? []
    for (const record of records) validateRecord(record)
    const fileName = `evidence/vectors/V${vectorClass.vectorClass.slice(1)}-${vectorClass.artifactBase}.json`
    written.push(
      writeArtifact(
        fileName,
        JSON.stringify(
          {
            vectorClass: vectorClass.vectorClass,
            className: vectorClass.className,
            channel: vectorClass.channel,
            channelSurface: vectorClass.channelSurface,
            cases: records,
          },
          null,
          2,
        ),
      ),
    )
  }
  for (const record of run.controls) validateRecord(record)
  written.push(
    writeArtifact('evidence/controls.json', JSON.stringify({ cases: run.controls }, null, 2)),
  )
  const rows = buildMatrixRows(run, registry, disposition)
  written.push(writeArtifact('evidence/matrix.json', JSON.stringify({ rows }, null, 2)))

  const tallies = computeTallies(rows, run)
  const gapRecords = rows.flatMap((r) =>
    r.gapRecord === null ? [] : [{ caseId: r.caseId, ...r.gapRecord }],
  )
  const summaryWithoutScan = {
    run: {
      command: 'matrix',
      hostFacts: facts,
      hostFactsDigest: hostFactsDigest(facts),
    },
    pinStates: pins.map((p) => ({
      id: p.id,
      path: p.path,
      state: p.state,
      gapReason: p.gapReason,
    })),
    gapRecords,
    tallies,
    measurement:
      disposition.state === 'pending'
        ? { state: 'pending', note: 'measurement dispositions are bound by npm run measure (T6)' }
        : {
            state: disposition.state,
            populationStatus: disposition.populationStatus,
            meas05: disposition.meas05,
          },
  }
  const summaryBytesWithoutScan = JSON.stringify(summaryWithoutScan, null, 2)
  const violations = [...scanBannedClaims(summaryBytesWithoutScan)]
  for (const artifact of written) {
    const text = readFileSync(join(evidenceDir, artifact.path.replace(/^evidence\//, '')), 'utf8')
    for (const phrase of scanBannedClaims(text)) violations.push(`${artifact.path}: ${phrase}`)
  }
  if (violations.length > 0) {
    throw new HarnessError(
      'EVIDENCE_WRITE_FAILED',
      `banned claim vocabulary in emitted bytes: ${violations.join('; ')}`,
    )
  }
  const scan: SummaryScan = {
    scannedArtifacts: written.length,
    phrasesChecked: BANNED_CLAIM_PHRASES.length,
    violations: [],
    result: 'clean',
    scanScope: 'all emitted artifacts; summary.json scanned minus this scan block (self-reference)',
  }
  const summary = { ...summaryWithoutScan, bannedClaimScan: scan }
  written.push(writeArtifact('evidence/summary.json', JSON.stringify(summary, null, 2)))

  const manifest = {
    artifacts: written.map((w) => ({ path: w.path, sha256: w.sha256 })),
    readOnlyInputSurfaces: pins.map((p) => ({
      id: p.id,
      path: p.path,
      preDigest: p.liveDigest,
      pinnedDigest: p.pinnedDigest,
      state: p.state,
    })),
    hostFactsDigest: hostFactsDigest(facts),
    note: 'manifest.json binds every emitted artifact except itself (self-hash impossible)',
  }
  writeArtifact('evidence/manifest.json', JSON.stringify(manifest, null, 2))
}

function assertNoPinDrift(pins: readonly PinSnapshotRow[]): void {
  const drifted = pins.filter((p) => p.state === 'drift')
  if (drifted.length > 0) {
    throw new HarnessError(
      'PIN_DRIFT',
      `read-only input surface drift (fail closed): ${drifted.map((p) => p.path).join(', ')}`,
      { drifted },
    )
  }
}

function assertNoReadOnlyViolation(
  before: readonly PinSnapshotRow[],
  after: readonly PinSnapshotRow[],
): void {
  for (const pre of before) {
    const post = after.find((p) => p.id === pre.id)
    if (post === undefined || post.liveDigest !== pre.liveDigest) {
      throw new HarnessError(
        'READ_ONLY_SURFACE_VIOLATION',
        `read-only input surface changed during the run: ${pre.path}`,
      )
    }
  }
}

// ─── measurement emission ────────────────────────────────────────────────────

function buildMeasurementSummary(
  records: readonly MeasurementRecord[],
  disposition: MeasurementDisposition,
  facts: HostFacts,
): Record<string, unknown> {
  const cells: SpanSummary[] = []
  const combos: Array<
    [
      'mediatedActionLatency' | 'firstCallObservation' | 'kernelDecisionLatency',
      'warm' | 'cold' | 'deadline',
    ]
  > = [
    ['mediatedActionLatency', 'warm'],
    ['firstCallObservation', 'cold'],
    ['kernelDecisionLatency', 'warm'],
    ['mediatedActionLatency', 'deadline'],
  ]
  for (const [span, population] of combos) {
    const cellRecords = records.filter((r) => r.span === span && r.population === population)
    if (cellRecords.length > 0) cells.push(percentilesFor(cellRecords, span, population))
  }
  const obligations: Array<Record<string, unknown>> = []
  for (const cell of cells) {
    if (cell.budgetMiss) {
      obligations.push({
        span: cell.span,
        population: cell.population,
        rule:
          cell.span === 'firstCallObservation'
            ? `max <= ${String(cell.budgetMicros)}`
            : `p99 <= ${String(cell.budgetMicros)}`,
        observed: cell.span === 'firstCallObservation' ? cell.max : cell.p99,
        budgetMicros: cell.budgetMicros,
        kind: 'budget-miss-obligation',
      })
    }
  }
  const deadlineRecords = records.filter((r) => r.population === 'deadline')
  return {
    ip3ComparabilityCaveat: IP3_COMPARABILITY_CAVEAT,
    instrumentPoints: [
      { id: 'IP-1', status: 'established', clock: 'adapter-monotonic' },
      { id: 'IP-2', status: 'established', clock: 'adapter-monotonic' },
      {
        id: 'IP-3',
        status: 'established',
        clock: 'kernel-monotonic-analog',
        note: 'guard-seam analog (FK-P12 decision boundary unbuilt — recorded as such)',
      },
      {
        id: 'IP-4',
        status: 'gap',
        code: 'INSTRUMENT_UNREACHABLE',
        note: 'hook-internal decision (evaluate :81) unreachable without modifying the hook; never estimated',
      },
    ],
    spans: cells,
    firstCallObservation: {
      reportedSeparately: true,
      foldedIntoWarm: false,
    },
    deadlineCases: {
      repeatsPerCase: 3,
      ridesCases: ['TMO-01', 'TMO-02'],
      deadlineDispositionSamples: deadlineRecords.map((r) => r.deadlineDisposition),
      lateResponseIgnoredSamples: deadlineRecords.map((r) => r.lateResponseIgnored),
      policy: 'lateResponsePolicy: ignore-terminal-outcome — enforced by the record shape',
    },
    d8OutagePostureInheritance: {
      disposition: 'not-proven',
      note: 'the shipped surfaces implement no deadline or outage posture; inheritance recorded not-proven, never claimed',
    },
    populations: disposition.populationStatus,
    claim: disposition.state === 'complete' ? 'made' : 'refused',
    obligations,
    meas05: disposition.meas05,
    hostFactsDigest: hostFactsDigest(facts),
    recordCount: records.length,
  }
}

function writeMeasurements(records: readonly MeasurementRecord[]): void {
  let bytes = ''
  for (const record of records) {
    validateMeasurement(record)
    bytes += `${canonicalJson(record)}\n`
  }
  writeArtifact('evidence/measurements.jsonl', bytes)
}

function refreshMeasurementRows(disposition: MeasurementDisposition): void {
  const matrixPath = join(evidenceDir, 'matrix.json')
  if (!existsSync(matrixPath)) return
  const parsed = JSON.parse(readFileSync(matrixPath, 'utf8')) as { rows: MatrixRow[] }
  const refreshed = parsed.rows.map((row) => {
    if (row.kind !== 'measurement') return row
    const exercised = disposition.perCase[row.caseId] ?? 'gap'
    return {
      ...row,
      exercised,
      status: exercised === 'yes' ? ('exercised' as const) : ('not-exercised' as const),
      gapRecord:
        exercised === 'yes'
          ? null
          : {
              code: 'not-exercised',
              reason:
                'measurement population minimum not met (MEASUREMENT_INCOMPLETE: claim refused, records retained)',
              obligation:
                'FK-P18′ lane: measurement population evidence (bound in measurement-summary.json)',
            },
    }
  })
  writeArtifact('evidence/matrix.json', JSON.stringify({ rows: refreshed }, null, 2))
  const summaryPath = join(evidenceDir, 'summary.json')
  if (existsSync(summaryPath)) {
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8')) as Record<string, unknown>
    const priorTallies = summary.tallies as { notExercised?: string[] } | undefined
    const nowExercised = new Set<string>(
      MEAS_CASE_IDS.filter((id) => disposition.perCase[id] === 'yes'),
    )
    const updated = {
      ...summary,
      tallies: {
        ...(summary.tallies as Record<string, unknown>),
        notExercised: (priorTallies?.notExercised ?? []).filter((id) => !nowExercised.has(id)),
      },
      measurement: {
        state: disposition.state,
        populationStatus: disposition.populationStatus,
        meas05: disposition.meas05,
      },
    }
    writeArtifact('evidence/summary.json', JSON.stringify(updated, null, 2))
  }
  const manifestPath = join(evidenceDir, 'manifest.json')
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      artifacts: Array<{ path: string; sha256: string }>
    }
    const refreshedArtifacts = manifest.artifacts.map((artifact) => {
      const absolute = join(evidenceDir, artifact.path.replace(/^evidence\//, ''))
      return existsSync(absolute)
        ? { path: artifact.path, sha256: sha256Hex(readFileSync(absolute)) }
        : artifact
    })
    // The T6 artifacts are emitted by this command; bind them too (AC3:
    // the manifest binds SHA-256 of every emitted artifact).
    for (const path of ['evidence/measurements.jsonl', 'evidence/measurement-summary.json']) {
      const absolute = join(evidenceDir, path.replace(/^evidence\//, ''))
      if (!existsSync(absolute)) continue
      const sha256 = sha256Hex(readFileSync(absolute))
      const existing = refreshedArtifacts.findIndex((a) => a.path === path)
      if (existing >= 0) {
        refreshedArtifacts[existing] = { path, sha256 }
      } else {
        refreshedArtifacts.push({ path, sha256 })
      }
    }
    writeArtifact(
      'evidence/manifest.json',
      JSON.stringify({ ...manifest, artifacts: refreshedArtifacts }, null, 2),
    )
  }
}

// ─── commands ────────────────────────────────────────────────────────────────

async function runMatrixCommand(): Promise<void> {
  const facts = captureHostFacts()
  const pins = snapshotPins()
  assertNoPinDrift(pins)
  const registry = loadRegistry()
  const run = await runClassification(registry)
  const pending: MeasurementDisposition = {
    state: 'pending',
    perCase: Object.fromEntries(MEAS_CASE_IDS.map((id) => [id, 'gap' as const])),
    populationStatus: [],
    meas05: null,
  }
  emitClassificationArtifacts(run, registry, pending, facts, pins)
  const after = snapshotPins()
  assertNoReadOnlyViolation(pins, after)
  process.stdout.write('matrix: evidence emitted\n')
}

async function runMeasureCommand(): Promise<void> {
  const facts = captureHostFacts()
  const pins = snapshotPins()
  assertNoPinDrift(pins)
  loadRegistry() // fixture integrity gate
  const warm = await runMeas01(hostFactsDigest(facts))
  const cold = await runMeas02(hostFactsDigest(facts))
  const guardSeam = runMeas03(hostFactsDigest(facts))
  const deadline = await runMeas04(hostFactsDigest(facts))
  const records = [...warm.records, ...cold.records, ...guardSeam.records, ...deadline.records]
  const statuses = populationStatus(records)
  const incomplete = statuses.filter((s) => !s.complete)
  const meas05 = await runMeas05()
  const perCase: Record<string, 'yes' | 'gap'> = {
    'MEAS-01': incomplete.some((s) => s.population === 'warm') ? 'gap' : 'yes',
    'MEAS-02': incomplete.some((s) => s.population === 'cold') ? 'gap' : 'yes',
    'MEAS-03': incomplete.some((s) => s.population === 'warm') ? 'gap' : 'yes',
    'MEAS-04': incomplete.some((s) => s.population === 'deadline') ? 'gap' : 'yes',
    'MEAS-05': meas05.state === 'measured' ? 'yes' : 'gap',
  }
  const disposition: MeasurementDisposition = {
    state: incomplete.length > 0 ? 'refused' : 'complete',
    perCase,
    populationStatus: statuses,
    meas05,
  }
  writeMeasurements(records)
  const summaryBytes = JSON.stringify(buildMeasurementSummary(records, disposition, facts), null, 2)
  // Banned-claim scan covers the T6 emitted bytes too (AC5).
  const measurementsBytes = readFileSync(join(evidenceDir, 'measurements.jsonl'), 'utf8')
  const violations = [...scanBannedClaims(summaryBytes), ...scanBannedClaims(measurementsBytes)]
  if (violations.length > 0) {
    throw new HarnessError(
      'EVIDENCE_WRITE_FAILED',
      `banned claim vocabulary in emitted measurement bytes: ${violations.join('; ')}`,
    )
  }
  writeArtifact('evidence/measurement-summary.json', summaryBytes)
  refreshMeasurementRows(disposition)
  const after = snapshotPins()
  assertNoReadOnlyViolation(pins, after)
  if (incomplete.length > 0) {
    process.stderr.write(
      `MEASUREMENT_INCOMPLETE: population minimums not met (${incomplete
        .map((s) => `${s.population} ${s.observed}/${s.required}`)
        .join(', ')}); claim refused, records retained\n`,
    )
    process.exitCode = 2
    return
  }
  process.stdout.write('measure: measurements emitted, claim made\n')
}

async function main(): Promise<void> {
  const command = process.argv[2]
  if (command === 'matrix') {
    await runMatrixCommand()
    return
  }
  if (command === 'measure') {
    await runMeasureCommand()
    return
  }
  process.stderr.write('usage: tsx src/index.ts <matrix|measure>\n')
  process.exitCode = 64
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
