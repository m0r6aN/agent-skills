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

/** The dispatch pin-table amendment also re-pinned the spec itself. */
export const SPEC_RELATIVE_PATH = 'docs/specs/done/FK-P17-bypass-outage-matrix.md'
export const SPEC_SHA256 = '6742cc99001240dbb946029131b2cb664425f1db6aa1313ba43d0fdde52db015'

export const SURFACE_PINS: readonly PinEntry[] = [
  {
    id: 'standing-constraints',
    path: 'docs/kickstarters/STANDING-CONSTRAINTS.md',
    sha256: '57e345f9294cb8fcd8c3d90325505c80903648f60522f820061a5f8f288a86ac',
    binds: '#1, #19, #30, #31, #32, #34',
  },
  {
    id: 'charter',
    path: 'docs/goals/foreman-kernel/charter.md',
    sha256: '29a08a63b8e1c540bfa6863a0244dddb7e08b1e3889dac64d10892f87b06b693',
    binds: 'D7, D13, D20, D21; §6 Wave-4 row; §12; §15.3',
  },
  {
    id: 'dispatch-plan',
    path: 'docs/goals/foreman-kernel/fk-p1-p21-dispatch-plan.md',
    sha256: '51c410c5deb63fd7390fe712d7c77e4b06ae05c223d00821713d9216508bbacf',
    binds: 'FK-P17′ row + RS-1 annotations',
  },
  {
    id: 'rs2-reratification',
    path: 'docs/goals/foreman-kernel/fk-rs2-gate1-reratification-2026-09-27.md',
    sha256: 'bb12ccb5c279b8c32095814c4a89ec577b4e0d7aa368656cd56c91a38d16b2ea',
    binds: 'RS-2.2 measurement retarget; RS-2.3 exit honesty',
  },
  {
    id: 'rescope-rs1',
    path: 'docs/goals/foreman-kernel/fk-rescope-RS1-2026-09-27.md',
    sha256: '53251e4faeab5f7d11fe322e19bae82dc54a905d49def53ca990e9daaeb43cb1',
    binds: 'RS-1.2 retarget + must-prove [INFERENCE] row',
  },
  {
    id: 'exit-annex',
    path: 'docs/goals/foreman-kernel/fk-exit-annex-draft-2026-09-27.md',
    sha256: '67a6d52f5d9f2ccb80904c8a0773feee5926a43da048b7f199680cc1911e8f92',
    binds: 'what this parcel must NOT claim (stranded rows)',
  },
  {
    id: 'marginal-value',
    path: 'docs/goals/foreman-kernel/fk-wave3-4-marginal-value-2026-09-27.md',
    sha256: 'e7feaf8dcfafb31db7ddea4903508c812e2ef1e460cb3a07c8f493e3b5889d92',
    binds: '§2 channel list; §3 D10 defect; §5 [INFERENCE] text',
  },
  {
    id: 'spec-convention',
    path: 'docs/SPEC-CONVENTION.md',
    sha256: '70508684d2c929d1331ed0cd9a147fcc2206593a04fbf210314e22fb80cba0a8',
    binds: 'spec schema §4/§4.8 (identity pin only)',
    knownBase: {
      sha256: '7ac315005cde6ad6def848b83de1d1b644e321c5d9f6434bc925deb6daba8703',
      gapReason: 'blocked: RCM-P2 schema-v0.4 delta uncommitted',
    },
  },
  {
    id: 'fk-p1-contracts',
    path: 'docs/specs/done/FK-P1-lifecycle-admission-decision-contracts.md',
    sha256: 'ec2d892288933845c32191e587a19b8a9f650e12d31538d28c78ca54552068a2',
    binds: 'F05.8 latency-recording; F05.9 AssuranceLevel; F05.16 LatencyContract',
  },
  {
    id: 'fk-p2-spec',
    path: 'docs/specs/done/FK-P2-spec-body-compiler.md',
    sha256: 'd55247cc309f622283e9fe72e5a4fe3e7140599fc81786b5f83c0de9e02eba5a',
    binds: 'compiled-scope consumer shape; three-state gap pattern; OQ-5 skip-and-record pattern',
  },
  {
    id: 'model-gate',
    path: 'hooks/model-gate.mjs',
    // Re-pinned 2026-10-07: Amendment 06 N2 roster update (dashed Pi-native
    // ids, coverage-limit note) landed without re-pinning; harness channels
    // re-aligned to the v2 roster (APPROVED_MODEL claude-sonnet-5-5).
    sha256: '27fdbbca245a76480634e3ae4fb2750508e1e7365ed7535e9dbec52f645f39e5',
    binds:
      'IP-4 anchor file; readPayload :37, loadPolicy :48, gateDisabled :54, statePath :69, evaluate :81, main :146, pre-tool :186, fail-open catch :213',
  },
  {
    id: 'hooks-json',
    path: 'hooks/hooks.json',
    sha256: '038e6b79903ae4f170dd70a893a8da7b9b981905f9463e865d692e1286fc009a',
    binds: '2/4-event registration (SessionStart, PreToolUse)',
  },
  {
    id: 'model-gate-policy',
    path: 'hooks/model-gate.policy.json',
    // Re-pinned 2026-10-07: roster v2 (Amendment 06 N1/N4 dashed ids + retired
    // block; Amendment 08 moves the 5.6-sol id to retired, approves
    // gpt-6.1-sol).
    sha256: 'dcf07abeec7ef93f4e6eeade0dd27830b1d3189a7e3d699938b17da7fc28dff7',
    binds: 'model roster + FL_MODEL_GATE escape hatch (MB-01/MB-02 fixtures)',
  },
  {
    id: 'approval-cli',
    path: 'dispatch/src/approval-cli/index.ts',
    sha256: 'd930c0a575ed576bf08a91e3be5a3c61b0bed58aa4d6ccb6d8cfede4dc89b430',
    binds:
      'prepareDispatch def :378, preflightCheck call :419, executeDispatch def :624, postHocCheck call :666, changedPaths refusal :659–:662 (re-pinned 2026-10-06; symbol resolution authoritative, line numbers documentation)',
  },
  {
    id: 'guard',
    path: 'mutation-scope-guard/src/guard.ts',
    sha256: '43a9eaa7d64a46a28611e55cfd758d65231d8b66b88593a6195b98155e9c375d',
    binds: 'preflightCheck / postHocCheck seam',
  },
  {
    id: 'match',
    path: 'mutation-scope-guard/src/match.ts',
    sha256: 'ce4bdf4444c31096c48495ed9f2f30c55661a3d04b4db1a8e18b5fcbcda32db0',
    binds:
      'lexical, case-sensitive matching, No symlink resolution :23, matchEntry :50, isWellFormedPath :123',
  },
  {
    id: 'guard-errors',
    path: 'mutation-scope-guard/src/errors.ts',
    sha256: 'efb83529e882e1a8567ac2cfbc913f65183c287dca5747755c75155f761ca994',
    binds: 'MutationScopeError codes',
  },
  {
    id: 'spec-body-compiler',
    path: 'spec-body-compiler/src/index.ts',
    sha256: '1dfd1304be4f6a389b0b437592d4494a43e7b66897c6daef40b69aa8dbaf2f57',
    binds: 'FK-P2 output surface for MEAS-05 (three-state)',
  },
]

/** Absolute path of the foreman-line plugin root (grandparent of this src dir). */
export function pluginRoot(): string {
  return dirname(dirname(dirname(fileURLToPath(import.meta.url))))
}

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
