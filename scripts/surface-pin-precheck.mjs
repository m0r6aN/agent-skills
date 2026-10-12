// scripts/surface-pin-precheck.mjs — CFF-P3 Unit A gate-job surface-pin
// precheck.
//
// Contract: plugins/foreman-line/docs/specs/active/CFF-P3-gate-surface-pin-precheck.md
//   AC4  reads the single plain-data source
//        (plugins/foreman-line/bypass-outage-harness/pins/surface-pins.json),
//        hashes the checked-out bytes of every pinned path, covers all 18
//        pins + the FK-P17 spec pin — the exact set the package test
//        consumes, never a subset.
//   AC5  three-state output, mirroring the package test exactly: match rows
//        pass silently; known-base rows print their `gapReason` (through
//        `sanitizeField`, imported — never reimplemented) and the run still
//        exits 0; any drift row makes the run exit non-zero (fail closed).
//        KNOWN-GAP is never collapsed to a plain fail and never suppressed.
//   AC6  runs in the `gate` job, unconditional, after `setup-node` and
//        before `decide`; performs no install, no build, no test execution;
//        never greens anything and never touches the all-artifact verdict —
//        it can only surface drift red, earlier.
//
// `node:` built-ins + repo-local imports only — no npm dependency, because
// the gate job performs no install. `sanitizeField` is imported read-only
// from scripts/foreman-line-ci.mjs (CFF-P1/P2 serialize on that file; this
// script never edits it).

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sanitizeField } from './foreman-line-ci.mjs'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(SCRIPT_DIR, '..')
const HARNESS_ROOT = join(REPO_ROOT, 'plugins', 'foreman-line', 'bypass-outage-harness')
const PLUGIN_ROOT = join(REPO_ROOT, 'plugins', 'foreman-line')
const ARTIFACT_PATH = join(HARNESS_ROOT, 'pins', 'surface-pins.json')

function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function digestFile(absolutePath) {
  return sha256Hex(readFileSync(absolutePath))
}

/** Three-state classification, identical to surface-refs.ts classifyPin. */
function classifyPin(liveDigest, entry) {
  if (liveDigest === entry.sha256) return 'match'
  if (entry.knownBase !== undefined && liveDigest === entry.knownBase.sha256) return 'known-base'
  return 'drift'
}

function loadArtifact() {
  const raw = readFileSync(ARTIFACT_PATH, 'utf8')
  return JSON.parse(raw)
}

export function runPrecheck() {
  const artifact = loadArtifact()
  const driftRows = []

  for (const entry of artifact.pins) {
    const absolutePath = join(PLUGIN_ROOT, entry.path)
    const liveDigest = digestFile(absolutePath)
    const state = classifyPin(liveDigest, entry)
    if (state === 'match') {
      continue
    }
    if (state === 'known-base') {
      const reason = sanitizeField(entry.knownBase.gapReason)
      console.log(`KNOWN-GAP ${sanitizeField(entry.id)} (${sanitizeField(entry.path)}): ${reason}`)
      continue
    }
    driftRows.push({ id: entry.id, path: entry.path })
    console.error(`PIN_DRIFT ${sanitizeField(entry.id)} (${sanitizeField(entry.path)})`)
  }

  // The FK-P17 spec pin — no known-base state, pure match/drift.
  const specAbsolutePath = join(PLUGIN_ROOT, artifact.specPin.relativePath)
  const specDigest = digestFile(specAbsolutePath)
  if (specDigest !== artifact.specPin.sha256) {
    driftRows.push({ id: 'fk-p17-spec', path: artifact.specPin.relativePath })
    console.error(`PIN_DRIFT fk-p17-spec (${sanitizeField(artifact.specPin.relativePath)})`)
  }

  return driftRows
}

function main() {
  const driftRows = runPrecheck()
  if (driftRows.length > 0) {
    console.error(`surface-pin-precheck: ${driftRows.length} drifted pin(s) — failing closed.`)
    process.exitCode = 1
    return
  }
  console.log('surface-pin-precheck: all pins match or known-base; zero drift.')
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  main()
}
