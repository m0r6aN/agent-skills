/**
 * Pinned read-only input surfaces (spec "Pin enforcement and the known-base
 * gap"; amended pin table, coordinator amendment 2026-09-27/28).
 *
 * Three-state discipline (tests/surface-pins.test.ts consumes these anchors):
 *   (a) live bytes match `sha256`           → PASS
 *   (b) live bytes match `knownBase.sha256` → KNOWN-GAP `blocked: <reason>`
 *   (c) anything else                       → PIN_DRIFT, fail closed
 *
 * Never re-anchor in-parcel (standing constraint #34: a pin change is a spec
 * amendment). Uncommitted sibling state is never pinnable (amendment integrity
 * rule): pins bind committed bytes only.
 *
 * CFF-P3 (D5 single plain-data source): the pin table itself lives in
 * `pins/surface-pins.json`, the single artifact consumed by both this thin
 * wrapper (readFileSync, read at module load) and `scripts/surface-pin-precheck.mjs`.
 * This module is a pure loader/re-export — it does not hold pin values.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sha256Hex } from './canonical.js'

export interface PinKnownBase {
  readonly sha256: string
  readonly gapReason: string
}

export interface PinEntry {
  readonly id: string
  /** Repo path relative to the foreman-line plugin root. */
  readonly path: string
  readonly sha256: string
  readonly binds: string
  readonly knownBase?: PinKnownBase
}

export type PinState = 'match' | 'known-base' | 'drift'

interface SurfacePinsArtifact {
  readonly specPin: {
    readonly relativePath: string
    readonly sha256: string
  }
  readonly pins: readonly PinEntry[]
}

/** Absolute path of the foreman-line plugin root (grandparent of this src dir). */
export function pluginRoot(): string {
  return dirname(dirname(dirname(fileURLToPath(import.meta.url))))
}

function surfacePinsArtifactPath(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', 'pins', 'surface-pins.json')
}

function loadSurfacePinsArtifact(): SurfacePinsArtifact {
  const raw = readFileSync(surfacePinsArtifactPath(), 'utf8')
  return JSON.parse(raw) as SurfacePinsArtifact
}

const ARTIFACT = loadSurfacePinsArtifact()

/** The dispatch pin-table amendment also re-pinned the spec itself. */
export const SPEC_RELATIVE_PATH = ARTIFACT.specPin.relativePath
export const SPEC_SHA256 = ARTIFACT.specPin.sha256

export const SURFACE_PINS: readonly PinEntry[] = ARTIFACT.pins

/** Absolute path of the pinned spec under test. */
export function specPath(): string {
  return join(pluginRoot(), SPEC_RELATIVE_PATH)
}

/** SHA-256 of a file's bytes, lowercase hex. */
export function digestFile(absolutePath: string): string {
  return sha256Hex(readFileSync(absolutePath))
}

/** Three-state classification of one pin against live bytes. */
export function classifyPin(liveDigest: string, entry: PinEntry): PinState {
  if (liveDigest === entry.sha256) return 'match'
  if (entry.knownBase !== undefined && liveDigest === entry.knownBase.sha256) return 'known-base'
  return 'drift'
}

export interface PinSnapshotRow {
  readonly id: string
  readonly path: string
  readonly liveDigest: string
  readonly pinnedDigest: string
  readonly state: PinState
  readonly gapReason: string | null
}

/** Digest every read-only input surface (all pins + the spec itself). */
export function snapshotPins(): readonly PinSnapshotRow[] {
  const rows: PinSnapshotRow[] = []
  for (const entry of SURFACE_PINS) {
    const liveDigest = digestFile(join(pluginRoot(), entry.path))
    const state = classifyPin(liveDigest, entry)
    rows.push({
      id: entry.id,
      path: entry.path,
      liveDigest,
      pinnedDigest: entry.sha256,
      state,
      gapReason: state === 'known-base' ? (entry.knownBase?.gapReason ?? null) : null,
    })
  }
  const specDigest = digestFile(specPath())
  rows.push({
    id: 'fk-p17-spec',
    path: SPEC_RELATIVE_PATH,
    liveDigest: specDigest,
    pinnedDigest: SPEC_SHA256,
    state: specDigest === SPEC_SHA256 ? 'match' : 'drift',
    gapReason: null,
  })
  return rows
}

/** FK-P2 compiled-scope reference three-state (MEAS-05). */
export type Fk2ReferenceState = 'present' | 'absent' | 'drift'

export function classifyFk2Reference(
  artifact: unknown,
  compiledScopeDigest: unknown,
): Fk2ReferenceState {
  if (
    artifact === null ||
    artifact === undefined ||
    compiledScopeDigest === null ||
    compiledScopeDigest === undefined
  ) {
    return 'absent'
  }
  if (typeof artifact !== 'object') return 'drift'
  const a = artifact as Record<string, unknown>
  const okShape =
    a.artifactVersion === '0.1.0' &&
    typeof a.compiledScopeDigest === 'string' &&
    Array.isArray(a.allowedFiles) &&
    Array.isArray(a.forbiddenSurfaces) &&
    typeof compiledScopeDigest === 'string'
  return okShape ? 'present' : 'drift'
}
