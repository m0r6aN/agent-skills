// scripts/foreman-line-ci.mjs — CI-P2 deterministic full-sweep sharding.
//
// Contract: plugins/foreman-line/docs/specs/active/CI-P2-deterministic-sweep-sharding.md
//   AC1  dynamic discovery: direct children of plugins/foreman-line/ with a
//        parseable JSON package.json, closed-world exclusions only
//        (dependency dirs + vendored trees); unparseable manifest = typed
//        discovery error, never a silent skip; code-point sorted output.
//   AC2  assignShards: pure round-robin (index i -> shard i mod shardCount)
//        over the discovery-ordered list; shardCount integer in [1, 4];
//        out-of-range/non-integer/duplicate/unsorted input refused with the
//        typed error — never clamped, never reordered.
//   AC3  shard-outcomes seam: schema `foreman-line-ci/shard-outcomes@1`;
//        reconcile re-derives discovery+assignment and fails on omissions,
//        duplicates, foreign identities, unexpected skips, missing artifacts,
//        assignment drift, shard failures, and discovery errors.
//   AC4  per-shard barrier: every install completes before any check in the
//        shard (relative sibling imports load sibling source); the check set is
//        exactly {test, typecheck, lint} for every discovered package.
//   A2 placement 9 (waived-exclusion set): WAIVED_EXCLUSIONS pins identity +
//        location + value per waived check. Run-then-waive: checks always run;
//        a failing check is `waived` only when its captured output contains the
//        pinned markers (linear-time substring match). A green pass or a
//        different red re-gates normally — never an unconditional skip.
//
// Process boundary (runner contract, preserved): importing/testing this module
// never launches npm; every spawn is injected. npm runs as
// process.execPath + npm-cli.js with shell:false (security property).
// Untrusted text (SC #4/#5): package names, paths, and captured check output
// are untrusted — sanitized before any log/summary emission (control chars,
// `::`, bidi overrides neutralized; bounded); waiver matching uses bounded
// linear-time substring checks.

import { spawnSync } from 'node:child_process'
import { appendFileSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

export class ForemanCiError extends Error {
  constructor(message, cause) {
    super(message, { cause })
    this.name = 'ForemanCiError'
  }
}

// ─── untrusted-text sanitization (SC #4/#5) ─────────────────────────────────

// Line-based-protocol delimiters and terminal escapes live in the C0 range
// (0x00-0x1F) and DEL (0x7F); bidi overrides are U+202A-U+202E and
// U+2066-U+2069. Numeric comparisons only — no regex escapes in this file.

function isBidiOverride(c) {
  return (c >= 0x202a && c <= 0x202e) || (c >= 0x2066 && c <= 0x2069)
}

/** Fixed-shape fields (names, paths): control chars out, `::` broken, bidi
 * overrides replaced, capped. */
export function sanitizeField(value, cap = 200) {
  if (typeof value !== 'string') return ''
  let out = ''
  for (const ch of value) {
    const c = ch.codePointAt(0)
    if (c <= 31 || c === 127) {
      out += ' '
      continue
    }
    if (isBidiOverride(c)) {
      out += '?'
      continue
    }
    out += ch
    if (out.length >= cap) break
  }
  return out.split('::').join(': :')
}

/**
 * Captured output re-emitted into the job log: same stripping, newlines and
 * tabs kept as structure, `::` neutralized so output can never mint
 * annotations; bounded.
 */
export function sanitizeOutput(value, cap = 20000) {
  if (typeof value !== 'string') return ''
  let out = ''
  for (const ch of value) {
    const c = ch.codePointAt(0)
    if (c === 10 || c === 9) {
      out += ch
      continue
    }
    if (c <= 31 || c === 127) {
      out += ' '
      continue
    }
    if (isBidiOverride(c)) {
      out += '?'
      continue
    }
    out += ch
    if (out.length >= cap) break
  }
  return out.split('::').join(': :')
}

function sha256Hex(value) {
  return createHash('sha256').update(value).digest('hex')
}

// ─── AC1: dynamic discovery ─────────────────────────────────────────────────

export const DEPENDENCY_DIR_NAMES = Object.freeze(['node_modules'])
export const VENDORED_DIR_NAMES = Object.freeze(['vendor', 'third_party', 'third-party'])
export const CHECKS = Object.freeze(['test', 'typecheck', 'lint'])
export const CHECK_FIELDS = Object.freeze(['ci', 'test', 'typecheck', 'lint'])

function packageDir(root, name) {
  return join(root, 'plugins', 'foreman-line', name)
}

/**
 * The shipped discovery rule: every direct child of plugins/foreman-line/ that
 * contains a parseable JSON package.json, except dependency directories and
 * vendored trees (the closed-world exclusion set — nothing else excludes).
 * Output is code-point sorted and independent of enumeration order. An
 * unparseable manifest is a typed discovery error; a missing manifest is not a
 * package.
 */
export function discoverPackages({ root, readdir = readdirSync, readFile = readFileSync, stat = statSync } = {}) {
  if (typeof root !== 'string' || root.length === 0) {
    throw new ForemanCiError('Discovery failed: root must be a non-empty string')
  }
  const base = join(root, 'plugins', 'foreman-line')
  let entries
  try {
    entries = readdir(base)
  } catch (cause) {
    throw new ForemanCiError('Discovery failed: unreadable package tree', cause)
  }
  if (!Array.isArray(entries)) throw new ForemanCiError('Discovery failed: readdir seam must return an array')
  const names = []
  for (const raw of [...entries].sort()) {
    const entry = typeof raw === 'string' ? raw : String(raw)
    if (DEPENDENCY_DIR_NAMES.includes(entry) || VENDORED_DIR_NAMES.includes(entry)) continue
    let isDir = false
    try {
      isDir = stat(join(base, entry)).isDirectory()
    } catch (cause) {
      // R4 fail-closed: a vanished entry is not a package, but EACCES/dangling
      // junction is NOT a non-package — it is a discovery error.
      if (cause && cause.code === 'ENOENT') continue
      throw new ForemanCiError(`Discovery failed: unstatable entry ${sanitizeField(entry)}`, cause)
    }
    if (!isDir) continue
    let rawManifest
    try {
      rawManifest = readFile(join(base, entry, 'package.json'), 'utf8')
    } catch (cause) {
      if (cause && cause.code === 'ENOENT') continue // no manifest = not a package
      throw new ForemanCiError('Discovery failed: unreadable manifest', cause)
    }
    try {
      JSON.parse(rawManifest)
    } catch (cause) {
      throw new ForemanCiError(`Discovery error: unparseable manifest in ${sanitizeField(entry)}`, cause)
    }
    names.push(entry)
  }
  names.sort()
  // R4 fail-closed: an empty discovered set is a discovery error — never a
  // green vacuous pass over nothing.
  if (names.length === 0) throw new ForemanCiError('Discovery error: no packages found')
  return names
}

// ─── AC2: deterministic bounded sharding (pure) ─────────────────────────────

export const MAX_SHARDS = 4

/**
 * Pure round-robin assignment over the code-point-sorted discovery list:
 * package at sorted index i goes to shard i mod shardCount. The shard lists
 * partition the input (disjoint; union = input; sizes differ by at most 1).
 * shardCount must be an integer in [1, 4]; out-of-range, non-integer,
 * duplicate names, and unsorted input are refused with the typed error.
 */
export function assignShards(orderedNames, shardCount) {
  if (!Array.isArray(orderedNames)) {
    throw new ForemanCiError('Refusing shard assignment: names must be an array')
  }
  if (!Number.isInteger(shardCount) || shardCount < 1 || shardCount > MAX_SHARDS) {
    throw new ForemanCiError(`Refusing shard assignment: shardCount must be an integer in [1, ${MAX_SHARDS}]`)
  }
  const seen = new Set()
  let prev = null
  for (const name of orderedNames) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new ForemanCiError('Refusing shard assignment: names must be non-empty strings')
    }
    if (seen.has(name)) throw new ForemanCiError('Refusing shard assignment: duplicate name')
    seen.add(name)
    if (prev !== null && !(prev < name)) {
      throw new ForemanCiError('Refusing shard assignment: names must be code-point sorted ascending')
    }
    prev = name
  }
  const shards = Array.from({ length: shardCount }, () => [])
  orderedNames.forEach((name, index) => shards[index % shardCount].push(name))
  return shards
}

// ─── A2 placement 9: waived-exclusion set (run-then-waive, SC #13 axes) ─────

/**
 * The amended expected-skip set (A2 placement 9; value pins strengthened per
 * R2). Each entry pins identity + location + value. The VALUE binds three
 * dimensions, all from the measured signature (counts and totals measured at
 * node 24.19.0 — CI's pin — 2026-10-01, complete captured outputs):
 *   markers    — every literal must appear in the failing output;
 *   counts     — exact occurrence counts per literal (a co-occurring repeat or
 *                a new same-shape failure miscounts => never waived);
 *   failTotal  — the sum of the output's failure-summary lines (TAP `# fail N`
 *                / spec `ℹ fail N`) must equal the pinned total exactly (a
 *                co-occurring NEW failure bumps the total => never waived;
 *                0 pins outputs that declare no summaries).
 * Waiver additionally requires a clean numeric non-zero EXIT: a signalled or
 * errored spawn NEVER waives (R2). Grow-by-ratification only; dead entries
 * expire at the next runner-touching parcel's Stage-F bookkeeping.
 */
export const WAIVED_EXCLUSIONS = Object.freeze([
  Object.freeze({
    identity: 'authority-registry',
    location: 'plugins/foreman-line/authority-registry/',
    checks: Object.freeze({
      test: Object.freeze({
        markers: Object.freeze(['R31 reviewed source mapping drift: M02-note', 'MIGRATION_EVIDENCE_INVALID', 'generate.ts']),
        counts: Object.freeze({ 'R31 reviewed source mapping drift: M02-note': 3, MIGRATION_EVIDENCE_INVALID: 4 }),
        failTotal: 30,
      }),
    }),
  }),
  Object.freeze({
    identity: 'bypass-outage-harness',
    location: 'plugins/foreman-line/bypass-outage-harness/',
    checks: Object.freeze({
      test: Object.freeze({
        markers: Object.freeze(['FK-P17-bypass-outage-matrix.md', 'CHANNEL_EXEC_FAILED', 'CTL-01', 'CTL-02', 'surface-pins.test.ts']),
        counts: Object.freeze({
          'FK-P17-bypass-outage-matrix.md': 2,
          'CHANNEL_EXEC_FAILED': 2,
          'CTL-01': 3,
          'CTL-02': 2,
        }),
        failTotal: 3,
      }),
      typecheck: Object.freeze({
        markers: Object.freeze(['mutationScope', 'TS2353', 'src/channels/gate.ts']),
        counts: Object.freeze({ mutationScope: 2, TS2353: 2, 'error TS': 2 }),
        failTotal: 0,
      }),
    }),
  }),
  Object.freeze({
    identity: 'jev-decisions',
    location: 'plugins/foreman-line/jev-decisions/',
    checks: Object.freeze({
      test: Object.freeze({
        markers: Object.freeze(['LEGACY_EXECUTION_RETIRED', 'p4-boundary-scenarios.test.ts']),
        counts: Object.freeze({ LEGACY_EXECUTION_RETIRED: 6 }),
        failTotal: 6,
      }),
    }),
  }),
  Object.freeze({
    identity: 'kernel-lease',
    location: 'plugins/foreman-line/kernel-lease/',
    checks: Object.freeze({
      test: Object.freeze({
        markers: Object.freeze(['STORAGE_CONSTRAINT_VIOLATION', 'foreign-key', 'transitions.test.ts']),
        counts: Object.freeze({ STORAGE_CONSTRAINT_VIOLATION: 20, 'foreign-key': 16 }),
        failTotal: 75,
      }),
      lint: Object.freeze({
        markers: Object.freeze(['biome', 'Found 32 errors', 'state-machine.test.ts']),
        counts: Object.freeze({ biome: 1, 'Found 32 errors': 1 }),
        failTotal: 0,
      }),
    }),
  }),
])

// Skips are NEVER expected: run-then-waive means every check runs (A2 p9).
// The amendment's four entries expect `waived` statuses only; any `skipped`
// status is unexpected (AC3 #6 / AC5 "unexpected skips").
export const EXPECTED_SKIPS = Object.freeze([])

/** Exact occurrence count of a literal (linear; untrusted text is input only). */
export function countOccurrences(text, needle) {
  if (typeof text !== 'string' || typeof needle !== 'string' || needle.length === 0) return 0
  let count = 0
  let at = 0
  for (;;) {
    const found = text.indexOf(needle, at)
    if (found < 0) return count
    count += 1
    at = found + needle.length
  }
}

/**
 * Sum of the output's failure-summary lines (TAP `# fail N` and the spec
 * reporter's `ℹ fail N`); 0 when the output declares none. Malformed summary
 * lines are ignored (they can only move the sum away from a pinned total and
 * therefore fail closed).
 */
export function sumFailTotals(text) {
  if (typeof text !== 'string') return 0
  let sum = 0
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    let digits = null
    if (trimmed.startsWith('# fail ')) digits = trimmed.slice(7)
    else if (trimmed.startsWith('\u2139 fail ')) digits = trimmed.slice(7)
    if (digits !== null && /^[0-9]+$/.test(digits)) sum += Number(digits)
  }
  return sum
}

/**
 * Run-then-waive (A2 placement 9, value pins per R2): a failing check is
 * waived only when identity, location, and the full pinned value all match —
 * every marker present, every occurrence count exact, and the failure total
 * exact. Callers must not invoke this for signalled/errored spawns (only a
 * clean numeric non-zero exit may waive). Anything else returns null.
 */
export function waiverFor(identity, location, check, output, waivers = WAIVED_EXCLUSIONS) {
  for (const entry of waivers) {
    if (entry.identity !== identity) continue // identity axis
    if (entry.location !== location) continue // location axis
    const pin = entry.checks ? entry.checks[check] : undefined
    if (pin === undefined) continue // only pinned checks are waivable
    // A malformed pin is never a waiver (fail closed): a well-formed pin is
    // markers + counts object + numeric failTotal.
    if (!Array.isArray(pin.markers) || typeof pin.counts !== 'object' || pin.counts === null || typeof pin.failTotal !== 'number') {
      return null
    }
    const text = typeof output === 'string' ? output : ''
    for (const marker of pin.markers) {
      if (!text.includes(marker)) return null // value axis: marker missing => re-gate
    }
    for (const [needle, expected] of Object.entries(pin.counts)) {
      if (countOccurrences(text, needle) !== expected) return null // R2: count mismatch => re-gate
    }
    if (sumFailTotals(text) !== pin.failTotal) return null // R2: co-occurring new failures bump the total
    return {
      check,
      markers_matched: [...pin.markers],
      counts_verified: { ...pin.counts },
      fail_total: pin.failTotal,
    }
  }
  return null
}

// ─── AC3: shard-outcomes seam (schema foreman-line-ci/shard-outcomes@1) ────

export const OUTCOMES_SCHEMA = 'foreman-line-ci/shard-outcomes@1'
export const STATUS_VALUES = Object.freeze(['pass', 'fail', 'error', 'skipped', 'waived'])

/** Normalize one package outcome record (untrusted names normalized). */
export function outcomeRecord(name, checks, waivers = []) {
  return {
    name: sanitizeField(name, 120),
    location: sanitizeField(`plugins/foreman-line/${name}/`, 240),
    checks: {
      ci: checks.ci,
      test: checks.test,
      typecheck: checks.typecheck,
      lint: checks.lint,
    },
    waivers: waivers.map((w) => ({
      check: w.check,
      markers_matched: [...w.markers_matched],
      counts_verified: { ...(w.counts_verified ?? {}) },
      fail_total: w.fail_total,
      output_sha256: w.output_sha256,
    })),
  }
}

export function buildShardOutcomes({ shardIndex, shardCount, headSha, packages }) {
  return {
    schema: OUTCOMES_SCHEMA,
    shard_index: shardIndex,
    shard_count: shardCount,
    head_sha: headSha ?? null,
    packages,
  }
}

// ─── per-shard executor (AC4) ──────────────────────────────────────────────

/**
 * One shard of the sweep: install dependencies for ALL discovered packages
 * (per-shard full install), then run exactly {test, typecheck, lint} for this
 * shard's assigned packages only — every install completing before any check
 * in the shard (the sibling-import barrier, preserved per shard). A failed
 * install stops the shard's checks: the failed package records ci: fail and
 * every check records skipped (AC3 #6 attributes the cause to ci). A failing
 * check is run-then-waive verified against WAIVED_EXCLUSIONS.
 */
export function runShard({
  root,
  npmCli,
  spawn,
  shardIndex,
  shardCount,
  offline = false,
  headSha = null,
  discover = discoverPackages,
  waivers = WAIVED_EXCLUSIONS,
  echo = null,
} = {}) {
  if (typeof npmCli !== 'string' || npmCli.length === 0) {
    throw new ForemanCiError('Refusing shard run: npmCli must be a non-empty string')
  }
  if (typeof spawn !== 'function') throw new ForemanCiError('Refusing shard run: spawn seam is required')
  if (!Number.isInteger(shardCount) || shardCount < 1 || shardCount > MAX_SHARDS) {
    throw new ForemanCiError(`Refusing shard run: shardCount must be an integer in [1, ${MAX_SHARDS}]`)
  }
  if (!Number.isInteger(shardIndex) || shardIndex < 0 || shardIndex >= shardCount) {
    throw new ForemanCiError('Refusing shard run: shardIndex out of range')
  }
  const names = discover({ root })
  const mine = assignShards(names, shardCount)[shardIndex]
  const records = new Map(
    names.map((name) => [
      name,
      outcomeRecord(name, { ci: 'skipped', test: 'skipped', typecheck: 'skipped', lint: 'skipped' }),
    ]),
  )

  function invoke(name, args) {
    try {
      const result = spawn(process.execPath, [npmCli, ...args], {
        cwd: packageDir(root, name),
        encoding: 'utf8',
        shell: false,
        maxBuffer: 64 * 1024 * 1024,
      })
      // R2: failure kind is recorded — only a clean numeric non-zero exit may
      // ever be waived; signalled/errored spawns fail closed and re-gate.
      let kind = 'exit'
      if (result?.signal) kind = 'signal'
      else if (result?.error || result === undefined || result === null || typeof result.status !== 'number') kind = 'error'
      const status = kind === 'exit' && result.status === 0 ? 'pass' : 'fail'
      return { status, kind, output: `${result?.stdout ?? ''}${result?.stderr ?? ''}` }
    } catch (cause) {
      // Failure classification contract (kept): a throwing spawn fails closed
      // as `fail`; the typed error stays attached to the seam result and no
      // untrusted error text ever reaches the outcomes or the report.
      return { status: 'fail', kind: 'error', output: '', cause: new ForemanCiError('Package process failed', cause) }
    }
  }
  function echoCheck(name, check, output) {
    if (typeof echo === 'function') echo(name, check, sanitizeOutput(output))
  }

  // Phase 1: ALL installs before ANY check (per-shard barrier, AC4).
  let installsOk = true
  for (const name of names) {
    const args = ['ci', '--ignore-scripts', '--no-audit', '--no-fund', ...(offline ? ['--offline'] : [])]
    const result = invoke(name, args)
    records.get(name).checks.ci = result.status
    if (result.status !== 'pass') {
      installsOk = false
      echoCheck(name, 'ci', result.output)
    }
  }
  // Phase 2: this shard's checks only; a failed install stops every check.
  if (installsOk) {
    for (const name of mine) {
      for (const check of CHECKS) {
        const result = invoke(name, ['run', check, '--ignore-scripts'])
        if (result.status === 'pass') {
          records.get(name).checks[check] = 'pass'
          continue
        }
        // Run-then-waive (A2 placement 9; R2 value pins): only a clean numeric
        // non-zero EXIT whose output matches the FULL pinned value (markers +
        // counts + failure total) is waived. Signalled/errored spawns and any
        // other red stay normal failures and re-gate.
        const waiver = result.kind === 'exit'
          ? waiverFor(name, records.get(name).location, check, result.output, waivers)
          : null
        if (waiver !== null) {
          records.get(name).checks[check] = 'waived'
          records.get(name).waivers.push({ ...waiver, output_sha256: sha256Hex(result.output) })
          // R2: the waived output is echoed (sanitized) — an audit trail, never
          // a silent waiver.
          echoCheck(name, `${check} [waived]`, result.output)
        } else {
          records.get(name).checks[check] = 'fail'
          echoCheck(name, check, result.output)
        }
      }
    }
  }
  const packages = names.map((name) => records.get(name))
  const failed = packages.some((p) => CHECK_FIELDS.some((c) => p.checks[c] === 'fail' || p.checks[c] === 'error'))
  return {
    exitCode: failed ? 1 : 0,
    outcomes: packages,
    artifact: buildShardOutcomes({
      shardIndex,
      shardCount,
      headSha,
      packages: packages.filter((p) => mine.includes(p.name)),
    }),
  }
}

// ─── AC3: reconciliation (aggregation re-derives and compares) ─────────────

function sameSet(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
  const right = [...b].sort()
  return [...a].sort().every((v, i) => v === right[i])
}

/**
 * Reconcile discovered vs executed (AC3 1-8 + A2 placement 9). The aggregation
 * re-runs discovery and assignment on the same checkout and fails on:
 * discovery errors, schema-invalid artifacts, missing artifacts / artifact
 * count mismatch (cancellation), assignment drift, omissions, duplicates
 * (across or within artifacts), foreign identities, missing check entries,
 * shard failures (fail|error), unexpected skips (EXPECTED_SKIPS is empty —
 * run-then-waive never skips), and waived statuses that do not exactly match a
 * WAIVED_EXCLUSIONS entry on all three axes (identity + location + value).
 */
export function reconcile({ root, shardCount, artifacts, waivers = WAIVED_EXCLUSIONS, discover = discoverPackages } = {}) {
  const failures = []
  let discovered
  try {
    discovered = discover({ root })
  } catch (error) {
    return {
      ok: false,
      failures: [{ code: 'discovery-error', detail: sanitizeField(error?.message ?? String(error), 200) }],
    }
  }
  if (!Number.isInteger(shardCount) || shardCount < 1 || shardCount > MAX_SHARDS) {
    throw new ForemanCiError(`Refusing reconciliation: shardCount must be an integer in [1, ${MAX_SHARDS}]`)
  }
  // R4 fail-closed: an empty discovered set is a discovery error — never a
  // green vacuous pass (the empty-artifacts path included).
  if (!Array.isArray(discovered) || discovered.length === 0) {
    return {
      ok: false,
      failures: [{ code: 'discovery-error', detail: 'no packages discovered' }],
    }
  }
  const list = Array.isArray(artifacts) ? artifacts : []

  // AC3 #1: exactly shard_count artifacts with valid unique indices 0..k-1.
  const seenIndex = new Set()
  for (const artifact of list) {
    const valid =
      artifact !== null &&
      typeof artifact === 'object' &&
      artifact.schema === OUTCOMES_SCHEMA &&
      Number.isInteger(artifact.shard_index) &&
      artifact.shard_index >= 0 &&
      artifact.shard_index < shardCount &&
      artifact.shard_count === shardCount &&
      Array.isArray(artifact.packages)
    if (!valid) {
      failures.push({ code: 'schema-invalid', detail: 'artifact does not match shard-outcomes@1' })
      continue
    }
    if (seenIndex.has(artifact.shard_index)) {
      failures.push({ code: 'artifact-count-mismatch', detail: `duplicate artifact for shard ${artifact.shard_index}` })
    }
    seenIndex.add(artifact.shard_index)
  }
  if (list.length !== shardCount) {
    failures.push({ code: 'artifact-count-mismatch', detail: `expected ${shardCount} artifacts, got ${list.length}` })
  }
  for (let i = 0; i < shardCount; i += 1) {
    if (!seenIndex.has(i)) failures.push({ code: 'missing-artifact', detail: `shard ${i} produced no artifact` })
  }

  let expected
  try {
    expected = assignShards(discovered, shardCount)
  } catch (error) {
    return {
      ok: false,
      failures: [...failures, { code: 'discovery-error', detail: sanitizeField(error?.message ?? String(error), 200) }],
    }
  }

  const seenNames = new Map()
  for (const artifact of list) {
    if (artifact?.schema !== OUTCOMES_SCHEMA || !Array.isArray(artifact.packages)) continue
    // AC3 #2: assignment re-derivation — the artifact's package set must equal
    // the re-derived shard assignment exactly.
    const got = artifact.packages.map((p) => p?.name).filter((n) => typeof n === 'string')
    const want = expected[artifact.shard_index] ?? []
    if (!sameSet(got, want)) {
      failures.push({
        code: 'assignment-drift',
        detail: `shard ${artifact.shard_index} package set differs from re-derived assignment`,
      })
    }
    for (const pkg of artifact.packages) {
      const name = pkg?.name
      if (typeof name !== 'string' || name.length === 0) {
        failures.push({ code: 'schema-invalid', detail: 'package entry without a name' })
        continue
      }
      // AC3 #5: foreign identities.
      if (!discovered.includes(name)) {
        failures.push({ code: 'foreign-identity', detail: sanitizeField(name) })
        continue
      }
      seenNames.set(name, (seenNames.get(name) ?? 0) + 1)
      for (const field of CHECK_FIELDS) {
        const value = pkg.checks ? pkg.checks[field] : undefined
        // AC3 #7: check entries missing for an executed package fail.
        if (value === undefined || !STATUS_VALUES.includes(value)) {
          failures.push({ code: 'missing-checks', detail: `${sanitizeField(name)}/${field}` })
          continue
        }
        if (value === 'fail') failures.push({ code: 'shard-fail', detail: `${sanitizeField(name)}/${field}` })
        else if (value === 'error') failures.push({ code: 'shard-error', detail: `${sanitizeField(name)}/${field}` })
        else if (value === 'skipped') {
          // EXPECTED_SKIPS is empty: run-then-waive never skips (AC3 #6).
          failures.push({ code: 'unexpected-skip', detail: `${sanitizeField(name)}/${field}` })
        } else if (value === 'waived') {
          // Placement 9 + R2: verify run-then-waive — exact three-axis entry
          // and the recorded verification equal to the full pinned value
          // (markers + counts + failure total).
          const entry = waivers.find((w) => w.identity === name && w.location === pkg.location)
          const pin = entry?.checks ? entry.checks[field] : undefined
          const record = Array.isArray(pkg.waivers) ? pkg.waivers.find((w) => w.check === field) : undefined
          const countsMatch =
            pin !== undefined &&
            record !== undefined &&
            typeof record.counts_verified === 'object' &&
            record.counts_verified !== null &&
            sameSet(Object.keys(record.counts_verified), Object.keys(pin.counts)) &&
            Object.entries(pin.counts).every(([k, v]) => record.counts_verified[k] === v)
          const verified =
            pin !== undefined &&
            record !== undefined &&
            Array.isArray(record.markers_matched) &&
            record.output_sha256 !== undefined &&
            record.fail_total === pin.failTotal &&
            sameSet(record.markers_matched, pin.markers) &&
            countsMatch
          if (!verified) failures.push({ code: 'waiver-mismatch', detail: `${sanitizeField(name)}/${field}` })
        }
      }
    }
  }
  // AC3 #4: duplicates (across artifacts or within one).
  for (const [name, count] of seenNames) {
    if (count > 1) failures.push({ code: 'duplicate', detail: sanitizeField(name) })
  }
  // AC3 #3: omissions — every discovered package must appear exactly once.
  for (const name of discovered) {
    if (!seenNames.has(name)) failures.push({ code: 'omission', detail: sanitizeField(name) })
  }
  return { ok: failures.length === 0, failures, discovered }
}

// ─── R1: effective decision resolution + fail-closed verdict ───────────────

/**
 * R1 layer 1 — NO fallthrough. On the reuse branch the effective decision is
 * the verify step's OWN output: an empty or non-successful verify resolves to
 * `fallback`, never decide's `reuse` (a crashed/timeout/emit-failed verify can
 * never green an unverified head). `fallback` passes through; anything absent
 * or unrecognized resolves to '' (fail-closed downstream).
 */
export function effectiveDecision({ decide, verifyConclusion, verifyOutput }) {
  if (decide === 'fallback') return 'fallback'
  if (decide !== 'reuse') return ''
  if (verifyConclusion === 'success' && verifyOutput === 'reuse') return 'reuse'
  return 'fallback'
}

/**
 * R1 layer 2 — the aggregation fails closed unless the gate job succeeded:
 * any gate failure (decide/verify/resolve crash, timeout, emit failure) is a
 * red verdict BEFORE the reuse branch is trusted — a failed verify step can
 * never green the head (the pre-split propagation property, restored).
 */
export function verdict({ gateResult, decision, reconcileResult }) {
  if (gateResult !== 'success') return { ok: false, code: 'gate-failed' }
  if (decision === 'reuse') return { ok: true, code: 'reuse-verdict' }
  if (decision === 'fallback') {
    return reconcileResult?.ok
      ? { ok: true, code: 'aggregate-ok' }
      : { ok: false, code: 'aggregate-failed' }
  }
  return { ok: false, code: 'unknown-decision' }
}

// ─── reporting (fixed allowlist names + normalized statuses only) ──────────

export function buildSummary(artifacts) {
  const rows = []
  for (const artifact of artifacts) {
    if (!artifact || !Array.isArray(artifact.packages)) continue
    for (const pkg of artifact.packages) {
      rows.push(
        `| ${sanitizeField(pkg?.name, 120)} | ${pkg?.checks?.ci ?? ''} | ${pkg?.checks?.test ?? ''} | ${pkg?.checks?.typecheck ?? ''} | ${pkg?.checks?.lint ?? ''} |`,
      )
    }
  }
  return [
    '## Foreman Line Package Checks',
    '| Package | Install | Test | Typecheck | Lint |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n')
}

// ─── CLI (thin): shard and aggregate ───────────────────────────────────────

const USAGE =
  'Usage: node scripts/foreman-line-ci.mjs resolve | shard <index> <count> <npm-cli.js> [outDir] [--offline] | aggregate <count> [inDir]'

function loadArtifacts(inDir, readdir = readdirSync, readFile = readFileSync) {
  const artifacts = []
  const entries = readdir(inDir)
  for (const entry of [...entries].sort()) {
    const direct = join(inDir, entry)
    let raw
    try {
      raw = readFile(direct, 'utf8')
    } catch {
      try {
        raw = readFile(join(direct, 'shard-outcomes.json'), 'utf8')
      } catch {
        continue
      }
    }
    try {
      artifacts.push(JSON.parse(raw))
    } catch (cause) {
      throw new ForemanCiError('Aggregation failed: unparseable shard outcomes', cause)
    }
  }
  return artifacts
}

export async function runCli(argv, env = process.env, deps = {}) {
  const spawn = deps.spawn ?? spawnSync
  const writeFile = deps.writeFile ?? writeFileSync
  const makeDir = deps.mkdir ?? mkdirSync
  const appendFile = deps.appendFile ?? appendFileSync
  const stdout = deps.stdout ?? ((text) => process.stdout.write(text))
  const mode = argv[0]
  if (mode === 'resolve') {
    if (argv.length > 1) throw new ForemanCiError(USAGE)
    // R1 layer 1 + R6: one place resolves the effective decision (no || fall-
    // through anywhere) and derives the shard layout from MAX_SHARDS.
    const effective = effectiveDecision({
      decide: env.DECIDE_DECISION,
      verifyConclusion: env.VERIFY_CONCLUSION,
      verifyOutput: env.VERIFY_DECISION,
    })
    const verifyOwns = env.VERIFY_CONCLUSION === 'success' && env.VERIFY_DECISION !== undefined && env.VERIFY_DECISION !== ''
    const pick = (verifyField, decideField) => (verifyOwns ? verifyField : decideField)
    const outputs = {
      decision: effective,
      fallback_reason: pick(env.VERIFY_FALLBACK_REASON, env.DECIDE_FALLBACK_REASON) ?? '',
      base_sha: pick(env.VERIFY_BASE_SHA, env.DECIDE_BASE_SHA) ?? '',
      head_sha: pick(env.VERIFY_HEAD_SHA, env.DECIDE_HEAD_SHA) ?? '',
      evidence_record: pick(env.VERIFY_EVIDENCE_RECORD, env.DECIDE_EVIDENCE_RECORD) ?? '',
      shard_count: String(MAX_SHARDS),
      shards: JSON.stringify(Array.from({ length: MAX_SHARDS }, (_, i) => i)),
    }
    const target = env.GITHUB_OUTPUT
    if (typeof target === 'string' && target.length > 0) {
      try {
        appendFile(target, `${Object.entries(outputs).map(([k, v]) => `${k}=${v}`).join('\n')}\n`)
      } catch (cause) {
        throw new ForemanCiError('Could not write decision outputs', cause)
      }
    }
    stdout(`resolved effective decision: ${sanitizeField(effective, 20)} shards=${outputs.shards}\n`)
    return 0
  }
  if (mode === 'shard') {
    const [index, count, npmCli, outDir, ...extra] = argv.slice(1)
    const offline = extra.includes('--offline')
    const shardIndex = Number(index)
    const shardCount = Number(count)
    const result = runShard({
      root: fileURLToPath(new URL('../', import.meta.url)),
      npmCli,
      spawn,
      shardIndex,
      shardCount,
      offline,
      headSha: env.GITHUB_SHA ?? null,
      echo: (name, check, text) => stdout(`\n=== ${sanitizeField(name)} / ${sanitizeField(check, 40)} output ===\n${text}\n`),
    })
    const dir = outDir === undefined || outDir === '--offline' ? 'shard-outcomes' : outDir
    makeDir(dir, { recursive: true })
    writeFile(join(dir, 'shard-outcomes.json'), `${JSON.stringify(result.artifact, null, 2)}\n`)
    const summary = buildSummary([result.artifact])
    stdout(`${summary}\n`)
    if (env.GITHUB_STEP_SUMMARY) {
      try {
        appendFile(env.GITHUB_STEP_SUMMARY, summary)
      } catch (cause) {
        throw new ForemanCiError('Could not write package summary', cause)
      }
    }
    return result.exitCode
  }
  if (mode === 'aggregate') {
    const [count, inDir, ...extra] = argv.slice(1)
    if (extra.length) throw new ForemanCiError(USAGE)
    const shardCount = Number(count)
    const gateResult = env.GATE_RESULT ?? ''
    const decision = env.DECISION ?? ''
    // R1 layer 2: this CLI is the single verdict authority. Reuse never needs
    // artifacts; fallback reconciles them; anything else is fail-closed.
    if (decision === 'reuse') {
      const v = verdict({ gateResult, decision, reconcileResult: { ok: true } })
      stdout(`verdict: ${v.code}\n`)
      return v.ok ? 0 : 1
    }
    if (decision === 'fallback') {
      const artifacts = loadArtifacts(inDir ?? 'shard-outcomes')
      const result = reconcile({
        root: fileURLToPath(new URL('../', import.meta.url)),
        shardCount,
        artifacts,
      })
      const summary = buildSummary(artifacts)
      stdout(`${summary}\n`)
      for (const failure of result.failures) {
        stdout(`aggregation failure: ${sanitizeField(failure.code, 60)}: ${sanitizeField(failure.detail, 200)}\n`)
      }
      if (env.GITHUB_STEP_SUMMARY) {
        try {
          appendFile(env.GITHUB_STEP_SUMMARY, summary)
        } catch (cause) {
          throw new ForemanCiError('Could not write package summary', cause)
        }
      }
      const v = verdict({ gateResult, decision, reconcileResult: result })
      stdout(`verdict: ${v.code}\n`)
      return v.ok ? 0 : 1
    }
    // Absent/unknown effective decision: never green (R1).
    stdout('verdict: unknown-decision (fail closed)\n')
    return 1
  }
  throw new ForemanCiError(USAGE)
}

if (import.meta.main) {
  runCli(process.argv.slice(2)).then(
    (exitCode) => {
      process.exitCode = exitCode
    },
    () => {
      console.error('Foreman Line CI failed; inspect package output and invocation arguments.')
      process.exitCode = 1
    },
  )
}
