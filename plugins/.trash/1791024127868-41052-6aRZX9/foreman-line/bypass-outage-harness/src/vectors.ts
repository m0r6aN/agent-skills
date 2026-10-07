/**
 * Closed case registry (spec AC1, standing constraint #30 default-deny).
 *
 * Case records live in fixture files (one fixture record per case):
 *   tests/fixtures/vectors/v1-shell.json … v10-restart.json  (26 vector cases)
 *   tests/fixtures/controls/dispatch-cli-controls.json        (3 controls)
 *   tests/fixtures/measurement/plan.json                      (5 measurement cases)
 *
 * A fixture row that lacks case identity, a hypothesis, or required signals is
 * `VECTOR_FIXTURE_MALFORMED`. A missing or duplicate case fails
 * tests/vector-registry.test.ts (and `loadRegistry` itself, so `npm run matrix`
 * cannot emit a matrix over an open registry).
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HarnessError } from './errors.js'

export type Classification = 'mechanical' | 'detected' | 'unsupported'
export type CaseKind = 'vector' | 'control' | 'measurement'

export interface Hypothesis {
  readonly classification: Classification | null
  readonly basis: string
}

export interface CaseRow {
  readonly id: string
  readonly kind: CaseKind
  readonly vectorClass: string | null
  readonly className: string | null
  readonly channel: string
  readonly scenario: string
  readonly hypothesis: Hypothesis
  readonly requiredSignals: readonly string[]
  /** Scenario parameters consumed by the channel runners. */
  readonly params: Readonly<Record<string, unknown>>
  readonly notes: string
}

export interface VectorClassFixture {
  readonly vectorClass: string
  readonly className: string
  readonly channel: string
  readonly channelSurface: string
  /** Evidence artifact base name (from the fixture file name, e.g. v3-mcp-tool.json → mcp-tool). */
  readonly artifactBase: string
  readonly cases: readonly CaseRow[]
}

export interface Registry {
  readonly vectorClasses: readonly VectorClassFixture[]
  readonly controls: readonly CaseRow[]
  readonly measurement: readonly CaseRow[]
  readonly all: readonly CaseRow[]
}

export const EXPECTED_COUNTS = {
  vectorClasses: 10,
  vectorCases: 26,
  controls: 3,
  measurementCases: 5,
  totalCases: 34,
} as const

export const VECTOR_FIXTURE_FILES = [
  'v1-shell.json',
  'v2-subprocess.json',
  'v3-mcp-tool.json',
  'v4-symlink-reparse.json',
  'v5-subagent.json',
  'v6-mediated-bypass.json',
  'v7-non-enrollment.json',
  'v8-stale-state.json',
  'v9-service-timeout.json',
  'v10-restart.json',
] as const

const KINDS: readonly CaseKind[] = ['vector', 'control', 'measurement']
const CLASSIFICATIONS: readonly (Classification | null)[] = [
  'mechanical',
  'detected',
  'unsupported',
  null,
]

function malformed(reason: string, details: Record<string, unknown> = {}): never {
  throw new HarnessError('VECTOR_FIXTURE_MALFORMED', reason, details)
}

/** Validate one raw fixture row (test seam: mutated rows must fail here). */
export function validateCaseRow(raw: unknown, context: string): CaseRow {
  if (typeof raw !== 'object' || raw === null) malformed(`${context}: row is not an object`)
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || r.id.trim() === '') malformed(`${context}: missing case id`)
  if (typeof r.kind !== 'string' || !KINDS.includes(r.kind as CaseKind)) {
    malformed(`${context} ${r.id}: invalid kind`, { id: r.id })
  }
  if (typeof r.channel !== 'string' || r.channel === '')
    malformed(`${context} ${r.id}: missing channel`)
  if (typeof r.scenario !== 'string' || r.scenario === '') {
    malformed(`${context} ${r.id}: missing scenario`)
  }
  const h = r.hypothesis
  if (typeof h !== 'object' || h === null) malformed(`${context} ${r.id}: missing hypothesis`)
  const hypothesis = h as Record<string, unknown>
  if (!('classification' in hypothesis)) {
    malformed(`${context} ${r.id}: hypothesis lacks classification`)
  }
  if (!CLASSIFICATIONS.includes(hypothesis.classification as Classification | null)) {
    malformed(`${context} ${r.id}: hypothesis classification off-vocabulary`)
  }
  if (typeof hypothesis.basis !== 'string' || hypothesis.basis.trim() === '') {
    malformed(`${context} ${r.id}: hypothesis lacks basis`)
  }
  if (!Array.isArray(r.requiredSignals) || r.requiredSignals.length === 0) {
    malformed(`${context} ${r.id}: missing required signals`)
  }
  for (const s of r.requiredSignals) {
    if (typeof s !== 'string' || s === '') malformed(`${context} ${r.id}: bad signal entry`)
  }
  return {
    id: r.id,
    kind: r.kind as CaseKind,
    vectorClass: typeof r.vectorClass === 'string' ? r.vectorClass : null,
    className: typeof r.className === 'string' ? r.className : null,
    channel: r.channel,
    scenario: r.scenario,
    hypothesis: {
      classification: hypothesis.classification as Classification | null,
      basis: hypothesis.basis,
    },
    requiredSignals: r.requiredSignals as readonly string[],
    params:
      typeof r.params === 'object' && r.params !== null
        ? (r.params as Record<string, unknown>)
        : {},
    notes: typeof r.notes === 'string' ? r.notes : '',
  }
}

/**
 * Build the registry from raw parsed fixture payloads. Enforces the closed
 * shape: exact counts, unique ids, one fixture record per case (AC1).
 */
export function buildRegistry(
  vectorFixtures: readonly { file: string; raw: unknown }[],
  controlsRaw: unknown,
  measurementRaw: unknown,
): Registry {
  const vectorClasses: VectorClassFixture[] = []
  const all: CaseRow[] = []
  const seen = new Set<string>()

  const addRow = (row: CaseRow, context: string): void => {
    if (seen.has(row.id)) malformed(`${context}: duplicate case id ${row.id}`, { id: row.id })
    seen.add(row.id)
    all.push(row)
  }

  for (const { file, raw } of vectorFixtures) {
    if (typeof raw !== 'object' || raw === null) malformed(`${file}: fixture is not an object`)
    const f = raw as Record<string, unknown>
    if (
      typeof f.vectorClass !== 'string' ||
      typeof f.className !== 'string' ||
      typeof f.channel !== 'string'
    ) {
      malformed(`${file}: missing vectorClass/className/channel`)
    }
    if (!Array.isArray(f.cases) || f.cases.length === 0) malformed(`${file}: no cases`)
    const rows: CaseRow[] = []
    for (const rawRow of f.cases) {
      const row = validateCaseRow(rawRow, file)
      if (row.kind !== 'vector')
        malformed(`${file} ${row.id}: vector fixture row must have kind 'vector'`)
      if (row.vectorClass !== f.vectorClass) malformed(`${file} ${row.id}: vectorClass mismatch`)
      addRow(row, file)
      rows.push(row)
    }
    const fileBase = file.split('-').slice(1).join('-')
    vectorClasses.push({
      vectorClass: f.vectorClass,
      className: f.className,
      channel: f.channel,
      channelSurface: typeof f.channelSurface === 'string' ? f.channelSurface : '',
      artifactBase: fileBase.endsWith('.json') ? fileBase.slice(0, -'.json'.length) : fileBase,
      cases: rows,
    })
  }

  const controls: CaseRow[] = []
  const controlList = (controlsRaw as Record<string, unknown> | null)?.cases
  if (!Array.isArray(controlList)) malformed('controls fixture: missing cases')
  for (const rawRow of controlList) {
    const row = validateCaseRow(rawRow, 'controls')
    if (row.kind !== 'control') malformed(`controls ${row.id}: must have kind 'control'`)
    addRow(row, 'controls')
    controls.push(row)
  }

  const measurement: CaseRow[] = []
  const measList = (measurementRaw as Record<string, unknown> | null)?.cases
  if (!Array.isArray(measList)) malformed('measurement plan: missing cases')
  for (const rawRow of measList) {
    const row = validateCaseRow(rawRow, 'measurement')
    if (row.kind !== 'measurement') malformed(`measurement ${row.id}: must have kind 'measurement'`)
    addRow(row, 'measurement')
    measurement.push(row)
  }

  const vectorCaseCount = vectorClasses.reduce((n, v) => n + v.cases.length, 0)
  if (
    vectorClasses.length !== EXPECTED_COUNTS.vectorClasses ||
    vectorCaseCount !== EXPECTED_COUNTS.vectorCases ||
    controls.length !== EXPECTED_COUNTS.controls ||
    measurement.length !== EXPECTED_COUNTS.measurementCases ||
    all.length !== EXPECTED_COUNTS.totalCases
  ) {
    malformed('registry counts deviate from the closed 10/26/3/5 shape', {
      vectorClasses: vectorClasses.length,
      vectorCases: vectorCaseCount,
      controls: controls.length,
      measurementCases: measurement.length,
      total: all.length,
    })
  }
  return { vectorClasses, controls, measurement, all }
}

function fixtureDir(): string {
  return join(dirname(dirname(fileURLToPath(import.meta.url))), 'tests', 'fixtures')
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (err) {
    throw new HarnessError(
      'VECTOR_FIXTURE_MALFORMED',
      `fixture unreadable at ${path}: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
}

/** Load the registry from the package's fixture files. */
export function loadRegistry(): Registry {
  const base = fixtureDir()
  const vectorFixtures = VECTOR_FIXTURE_FILES.map((file) => ({
    file,
    raw: readJson(join(base, 'vectors', file)),
  }))
  return buildRegistry(
    vectorFixtures,
    readJson(join(base, 'controls', 'dispatch-cli-controls.json')),
    readJson(join(base, 'measurement', 'plan.json')),
  )
}
