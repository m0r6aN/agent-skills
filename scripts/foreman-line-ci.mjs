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
import { appendFileSync, lstatSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
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
 * annotations. Bounded at 200k chars — wide enough that a full suite's
 * failing evidence reaches the log (the 20k cap truncated run 36993326583's
 * authority evidence and cost a full diagnosis cycle).
 */
export function sanitizeOutput(value, cap = 200000) {
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
export function discoverPackages({ root, readdir = readdirSync, readFile = readFileSync, stat = statSync, lstat = lstatSync } = {}) {
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
    // R10 (contract match): lstat first. A vanished entry (ENOENT at lstat) is
    // not a package; once an entry lstats, ANY stat failure is a discovery
    // error — a dangling junction lstats but cannot be statted.
    try {
      lstat(join(base, entry))
    } catch (cause) {
      if (cause && cause.code === 'ENOENT') continue
      throw new ForemanCiError(`Discovery failed: unstatable entry ${sanitizeField(entry)}`, cause)
    }
    let isDir = false
    try {
      isDir = stat(join(base, entry)).isDirectory()
    } catch (cause) {
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
 * A2 placement 11b: the pinned MEASURED cost table (seconds of check wall per
 * package — test + typecheck + lint) from the AC1 pre-flight baseline, with
 * the AC6 cap corrections where a check was cap-killed in measurement
 * (authority-registry = completion mean of the 10 measured runs at node
 * 24.19.0; dispatch = the live completion values). Pinned data — golden-tested
 * like the waiver pins. The assignment is deterministic in this table.
 */
export const COST_TABLE = Object.freeze({
  'approval': 14.3,
  'authority-registry': 1407.8,
  'bypass-outage-harness': 36.9,
  'contract-readers': 7.7,
  'contracts': 3.2,
  'dispatch': 33.6,
  'foreman-config': 9.5,
  'hybrid-routing': 17.2,
  'integration': 7.8,
  'jev-decisions': 1.6,
  'kernel-contracts': 3.8,
  'kernel-lease': 67.0,
  'kernel-state': 8.1,
  'mutation-scope-guard': 33.9,
  'permission-profiles': 13.7,
  'projection': 4.8,
  'receipts': 12.4,
  'registration': 18.0,
  'role-authority': 3.6,
  'routing-policy': 17.2,
  'schema-scaffold': 2.8,
  'shaping': 4.2,
  'skill-injection': 13.9,
  'spec-body-compiler': 3.4,
  'spec-linter': 19.8,
  'verification': 375.2,
  'worker-envelopes': 3.2,
})

/**
 * Deterministic cost-aware assignment (A2 placement 11b): candidates are the
 * code-point-sorted discovered list; each is assigned in order of MEASURED
 * cost (descending — the pinned cost table, tie-break: package name ascending)
 * to the currently least-loaded shard (tie-break: lowest shard index). Pure —
 * a function of (names, shardCount, costTable) only. The shard lists partition
 * the input; shardCount must be an integer in [1, 4]; out-of-range,
 * non-integer, duplicate names, and unsorted input are refused typed.
 * Round-robin (i mod shardCount) is the documented fallback when no cost table
 * is pinned OR the inputs are cost-unknown (any name absent from the table) —
 * the function stays total. Output shard lists are name-sorted (stable).
 */
export function assignShards(orderedNames, shardCount, costTable = COST_TABLE) {
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
  const costKnown =
    costTable !== null &&
    typeof costTable === 'object' &&
    Object.keys(costTable).length > 0 &&
    orderedNames.every((name) => Number.isFinite(costTable[name]))
  const shards = Array.from({ length: shardCount }, () => [])
  if (!costKnown) {
    // documented fallback: round-robin (cost-unknown inputs / no pinned table)
    orderedNames.forEach((name, index) => shards[index % shardCount].push(name))
    return shards
  }
  const candidates = [...orderedNames].sort((a, b) => {
    const delta = costTable[b] - costTable[a]
    if (delta !== 0) return delta // MEASURED cost, descending
    return a < b ? -1 : a > b ? 1 : 0 // tie-break: package name ascending
  })
  const loads = new Array(shardCount).fill(0)
  for (const name of candidates) {
    let best = 0
    for (let shard = 1; shard < shardCount; shard += 1) {
      if (loads[shard] < loads[best]) best = shard // tie-break: lowest shard index
    }
    shards[best].push(name)
    loads[best] += costTable[name]
  }
  for (const shard of shards) shard.sort()
  return shards
}

// ─── A2 placement 9: waived-exclusion set (run-then-waive, SC #13 axes) ─────

/**
 * The amended expected-skip set (A2 placement 9; value semantics per R7 and
 * the placement-10 alignment). Each entry pins identity + location + value.
 * The VALUE binds the DETERMINISTIC FAILURE IDENTITY across four layers, all
 * measured over >=10 consecutive runs at node 24.19.0 (CI's pin):
 *   markers    — stable literals only (error codes, tool-declared totals);
 *                each proven constant across every measured run, else dropped;
 *   counts     — exact occurrence counts for literals proven constant;
 *   failTotal  — [min, max] = the measured variance of the failure-summary sum
 *                (accepts exactly the measured variance and nothing more);
 *   failingSet — deterministic failing test names (always required present);
 *   flaky      — named measured-variance failures (CN-02/CN-06 class),
 *                tolerated present-or-absent.
 * A failing test outside failingSet+flaky NEVER waives (the set subsumes
 * counts and catches new failures totals would hide). R11: whenever failing
 * names parse, the declared failure total must equal the number of DISTINCT
 * failing names (the measured invariant — closes the duplicate-title /
 * marker-named-test / control-char-variant slack). Where NO failing names
 * parse (tsc/biome checks declare none), the pinned total range is the sole
 * guard and is kept tight to measurement. Waiver additionally requires a clean
 * numeric non-zero EXIT: signalled/errored spawns never waive. Waived output
 * is echoed (sanitized) — the run-then-waive audit trail. Grow-by-ratification
 * only; dead entries expire at the next runner-touching parcel's Stage-F
 * bookkeeping.
 */
// R7 measured data (>=10 consecutive runs at node 24.19.0, 2026-10-01; CN-06
// deterministic-present per 16/16 combined runs — 10 local + 6 reviewer): the
// deterministic failing identity of kernel-lease/test. The single named flaky
// member (CN-02) is NOT here — it lives in the entry's `flaky`.
const KERNEL_LEASE_TEST_FAILING = Object.freeze([
  'AC6 residual statement is present and no genuineness claim exists in shipped text',
  'AC9: every emitted effect validates against schemas/effect-result.schema.json',
  'CN-06 stale-CAS apply race: one applies, the peer STATE_REVISION_STALE',
  'CN-07 pending-request race: one pending transition wins, the peer TRANSITION_PENDING_EXISTS',
  "CR-01 kill at 'INSERT INTO events' leaves state fully-absent; retry applies",
  "CR-02 kill at 'UPDATE goals' leaves state fully-absent; retry applies",
  "CR-03 kill at 'INSERT INTO idempotency_keys' leaves state fully-absent; retry applies",
  "CR-04 kill at 'COMMIT' leaves state fully-applied; retry replays",
  "CR-05 kill at 'UPDATE goals' leaves state fully-absent; retry applies",
  "CR-06 kill at 'INSERT INTO leases' leaves state fully-absent; retry applies",
  'CTL-01 legal edge L1 applies',
  'CTL-02 legal edge L2 applies',
  'CTL-03 legal edge L3 applies',
  'CTL-04 legal edge L4 applies',
  'CTL-05 legal edge L5 applies',
  'CTL-06 legal edge L6 applies',
  'CTL-07 legal edge L7 applies',
  'GTW-01 refuses exactly GATE_STATE_NOT_WRITABLE',
  'GTW-02 refuses exactly GATE_STATE_NOT_WRITABLE',
  'GTW-03 refuses exactly GATE_STATE_NOT_WRITABLE',
  'GTW-04 refuses exactly GATE_STATE_NOT_WRITABLE',
  'GTW-05 refuses exactly GATE_EVIDENCE_REQUIRED',
  'GTW-06 refuses exactly GATE_EVIDENCE_REQUIRED',
  'GTW-07 refuses exactly ENGINE_ARGUMENT_INVALID',
  'GTW-08 refuses exactly ENGINE_ARGUMENT_INVALID',
  'GTW-09 refuses exactly ENGINE_ARGUMENT_INVALID',
  'GTW-10 substrate-seeded gate-ish status refuses on read (defense in depth)',
  'GTW-12 refuses exactly GATE_EVIDENCE_REQUIRED',
  'IDP precedence: same-key/different-payload conflicts even for an in-flight record shape',
  'IDP-01 refuses exactly IDEMPOTENCY_CONFLICT',
  'IDP-02 refuses exactly IDEMPOTENCY_CONFLICT',
  'IDP-03 refuses exactly IDEMPOTENCY_CONFLICT',
  'IDP-04 refuses exactly IDEMPOTENCY_CONFLICT',
  'IDP-05 refuses exactly IDEMPOTENCY_CONFLICT',
  'IDP-06 refuses exactly IDEMPOTENCY_CONFLICT',
  'IDP-07 replay returns the recorded EffectResult verbatim with zero deltas',
  'IDP-08 replay returns the recorded EffectResult verbatim with zero deltas',
  'IDP-09 replay returns the recorded EffectResult verbatim with zero deltas',
  'IDP-10 replay returns the recorded EffectResult verbatim with zero deltas',
  'IDP-11 replay returns the recorded EffectResult verbatim with zero deltas',
  'IDP-12 replay returns the recorded EffectResult verbatim with zero deltas',
  'IDP-13 refuses exactly IDEMPOTENCY_IN_FLIGHT',
  'L3 record: a transition toward awaiting-human carries the F05.8 stop-report obligation shape',
  'LSE-03 refuses exactly LEASE_EXPIRED',
  'TR-01 refuses exactly STATE_REVISION_STALE',
  'TR-02 refuses exactly STATE_REVISION_STALE',
  'TR-03 refuses exactly STATE_REVISION_STALE',
  'TR-04 refuses exactly TRANSITION_ALREADY_DECIDED',
  'TR-05 refuses exactly TRANSITION_PENDING_EXISTS',
  'TR-06 refuses exactly TRANSITION_NOT_PENDING',
  'TR-07 refuses exactly GOAL_ABSENT',
  'TR-08 refuses exactly TRANSITION_ABSENT',
  'TR-09 refuses exactly TRANSITION_STATUS_UNKNOWN',
  'X01 illegal edge refuses ILLEGAL_TRANSITION',
  'X02 illegal edge refuses ILLEGAL_TRANSITION',
  'X03 illegal edge refuses ILLEGAL_TRANSITION',
  'X04 illegal edge refuses ILLEGAL_TRANSITION',
  'X05 illegal edge refuses ILLEGAL_TRANSITION',
  'X06 illegal edge refuses ILLEGAL_TRANSITION',
  'X07 illegal edge refuses ILLEGAL_TRANSITION',
  'X08 illegal edge refuses ILLEGAL_TRANSITION',
  'X09 illegal edge refuses ILLEGAL_TRANSITION',
  'X10 illegal edge refuses ILLEGAL_TRANSITION',
  'X11 illegal edge refuses ILLEGAL_TRANSITION',
  'X12 illegal edge refuses ILLEGAL_TRANSITION',
  'X13 illegal edge refuses ILLEGAL_TRANSITION',
  'X14 illegal edge refuses ILLEGAL_TRANSITION',
  'X15 illegal edge refuses ILLEGAL_TRANSITION',
  'X16 illegal edge refuses ILLEGAL_TRANSITION',
  'X17 illegal edge refuses ILLEGAL_TRANSITION',
  'X18 illegal edge refuses ILLEGAL_TRANSITION',
  'decide re-validates the edge from the CURRENT status at decide time (scenario-7 shape)',
  'decide reject records transition.rejected and leaves status unchanged',
  'one tested refusal per code (fault-injection matrix)',
  'safe diagnostics carry only declared shapes (ids/revision/field paths — no free text)',
])

// R7 measured data for authority-registry/test (>=10 consecutive runs at node
// 24.19.0, 2026-10-01: identical in all 10 runs — 30 names, sum 30 every run;
// no flaky members observed): deterministic failing identity.
const AUTHORITY_REGISTRY_TEST_FAILING = Object.freeze([
  'CLI validate and sweep return exit 0 with machine-readable summaries',
  'R14 an added heading stays inert while a paragraph beneath it does not',
  'R27 control (a) volatile appends and byte changes preserve the sweep and governed siblings',
  'R27 control (e) generator output is byte-identical under mutation of every volatile region',
  'R31 actual M01 source rejects URL insufficiency mutation',
  'R31 actual M01 source rejects living identifier mutation',
  'R31 actual M01 source rejects marketplace entry mutation',
  'R31 actual M01 source rejects nested manifest equality mutation',
  'R31 actual M01 source rejects parcel condition mutation',
  'R31 actual M01 source rejects source existence mutation',
  'R31 approved annotation and thesis have distinct source-bound identities',
  'R31 source-bound aliases reject displaced or substituted historical note and thesis',
  'R5 Markdown numbered-item locators survive physical line wrapping',
  'R5 TypeScript semantic inventory ignores benign comment changes',
  'R5 TypeScript semantic inventory ignores benign import-order changes',
  'R5 TypeScript semantic inventory ignores benign whitespace changes',
  'R5 fenced Markdown prose cannot impersonate a live authority binding',
  'R6 additive TypeScript type-only import remains non-operative',
  'R6 comment-only Markdown remains non-operative',
  'R7 ambient declarations remain non-operative',
  'R7 mixed fence delimiters do not close a correctly paired fence',
  'R7 mixed type and value import order is semantically stable',
  'R8 valid fenced D row is ignored by every Markdown discovery layer',
  'R8 valid fenced R row is ignored by every Markdown discovery layer',
  'R8 valid fenced heading is ignored by every Markdown discovery layer',
  'R8 valid fenced numbered hard rule is ignored by every Markdown discovery layer',
  'R9 valid fenced standing-constraint number is ignored by the shared Markdown map',
  'multiple corpus violations are deterministically ordered by path, locator, rule, then code',
  'shipped registry sweeps the complete pinned corpus with no gaps or conflicts',
  'unrelated bytes outside every registered locator stay green',
])
const AUTHORITY_REGISTRY_TEST_FLAKY = Object.freeze([])

export const WAIVED_EXCLUSIONS = Object.freeze([
  Object.freeze({
    identity: 'bypass-outage-harness',
    location: 'plugins/foreman-line/bypass-outage-harness/',
    checks: Object.freeze({
      test: Object.freeze({
        markers: Object.freeze(['FK-P17-bypass-outage-matrix.md', 'CHANNEL_EXEC_FAILED']),
        counts: Object.freeze({}),
        failTotal: Object.freeze([3, 3]),
        failingSet: Object.freeze([
          'CTL-01: out-of-scope mutationScope refused by shipped preflight before worktree creation',
          'CTL-02: out-of-scope changed path refused by shipped post-hoc before the Stage-C receipt',
          'live worktree pins: zero drift; SPEC-CONVENTION is the named known-base KNOWN-GAP',
        ]),
        flaky: Object.freeze([]),
      }),
      typecheck: Object.freeze({
        markers: Object.freeze(['mutationScope', 'TS2353']),
        counts: Object.freeze({ 'error TS': 2 }),
        failTotal: Object.freeze([0, 0]),
        failingSet: Object.freeze([]),
        flaky: Object.freeze([]),
      }),
    }),
  }),
  Object.freeze({
    identity: 'jev-decisions',
    location: 'plugins/foreman-line/jev-decisions/',
    checks: Object.freeze({
      test: Object.freeze({
        markers: Object.freeze(['LEGACY_EXECUTION_RETIRED']),
        counts: Object.freeze({}),
        failTotal: Object.freeze([6, 6]),
        failingSet: Object.freeze([
          'malformed provider and transport results fail closed',
          'missing credential refuses before the synthetic transport opens',
          'provider cost above the hard cap becomes a bounded hold',
          'redirect and unverified TLS authorities are rejected',
          'synthetic success returns a redacted observation and never discloses the credential',
          'timeout and lease refusal never permit a live call',
        ]),
        flaky: Object.freeze([]),
      }),
    }),
  }),
  Object.freeze({
    identity: 'kernel-lease',
    location: 'plugins/foreman-line/kernel-lease/',
    checks: Object.freeze({
      test: Object.freeze({
        // R15/variance-base correction: the error-text markers
        // (STORAGE_CONSTRAINT_VIOLATION / foreign-key) are LOCAL-only evidence —
        // the CI environment fails these same tests with a different error class
        // (EPERM / HARNESS_FAULT barrier timeouts). Not proven constant across
        // environments => dropped (determinism anchor); the failing-set identity,
        // the equality and the range carry the value axis here.
        markers: Object.freeze([]),
        counts: Object.freeze({}),
        failTotal: Object.freeze([75, 78]),
        failingSet: KERNEL_LEASE_TEST_FAILING,
        flaky: Object.freeze([
          'CN-01 two-process claim race: exactly one winner, one event, one binding, one bump; loser LEASE_HELD',
          'CN-02 claim/release race: exactly the two named serializations; never two active leases',
          'CN-05 same-key different-binding apply race: one applies, the peer IDEMPOTENCY_CONFLICT',
        ]),
      }),
      lint: Object.freeze({
        markers: Object.freeze(['biome', 'Found 32 errors']),
        counts: Object.freeze({ 'Found 32 errors': 1 }),
        failTotal: Object.freeze([0, 0]),
        failingSet: Object.freeze([]),
        flaky: Object.freeze([]),
      }),
    }),
  }),
  Object.freeze({
    identity: 'authority-registry',
    location: 'plugins/foreman-line/authority-registry/',
    checks: Object.freeze({
      test: Object.freeze({
        // R15: R31's drift error is present in BOTH environments (CI prefix of
        // run 36993326583 and all 10 local runs) — kept. MIGRATION_EVIDENCE_INVALID
        // is not proven constant across environments (its region was beyond the
        // truncated CI echo) => dropped (determinism anchor). The 30-name set +
        // equality + [30,30] carry the identity.
        markers: Object.freeze(['R31 reviewed source mapping drift: M02-note']),
        counts: Object.freeze({}),
        failTotal: Object.freeze([30, 30]),
        failingSet: AUTHORITY_REGISTRY_TEST_FAILING,
        flaky: AUTHORITY_REGISTRY_TEST_FLAKY,
      }),
    }),
  }),
])

// Skips are NEVER expected: run-then-waive means every check runs (A2 p9).
// The amendment's four entries expect `waived` statuses only; any `skipped`
// status is unexpected (AC3 #6 / AC5 "unexpected skips").
export const EXPECTED_SKIPS = Object.freeze([])

/**
 * Exact occurrence count of a literal (linear; untrusted text is input only).
 */
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
 * R7: the failing-test identity of a captured output. Parses TAP
 * `not ok … - <name>` lines and the spec reporter's `✖ <name>` lines; names are
 * untrusted (sanitized per SC #4/#5), scanning is linear, and the spec
 * reporter's `failing tests:` section marker is not a name. Returns the
 * de-duplicated sorted set.
 */
export function failingTestNames(output) {
  const names = new Set()
  if (typeof output !== 'string') return []
  for (const line of output.split('\n')) {
    const trimmed = line.trim()
    let raw = null
    if (trimmed.startsWith('not ok ')) {
      const dash = trimmed.indexOf(' - ')
      raw = dash >= 0 ? trimmed.slice(dash + 3) : trimmed.slice(7)
    } else if (trimmed.startsWith('\u2716 ')) {
      raw = trimmed.slice(2).replace(/ \([0-9.]+m?s\)$/, '')
    }
    if (raw === null) continue
    const name = sanitizeField(raw, 200)
    if (name.length === 0 || name === 'failing tests:' || name === 'failing test:') continue
    names.add(name)
  }
  return [...names].sort()
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
 * R16/R18: the full value evaluation with its rejection layer and evidence.
 * Returns `{ layer, record, evidence }` — `layer: null` with a populated
 * `record` when the pinned value matches (the check may waive); otherwise
 * `layer` names the FIRST failing layer (`kind-gate`, `no-pin`, `malformed-pin`,
 * `marker-missing`, `count-mismatch`, `range`, `set-subset`, `set-supersede`,
 * `equality`) and `evidence` carries `{ observed, expected, names }` — the
 * layer's actual compared values, the pinned side, and every observed failing
 * name (the surface-and-ratify loop's data channel). All evidence is built
 * linear-time and is sanitized by the caller before emission (SC #4/#5).
 */
export function evaluateWaiver(identity, location, check, output, kind = 'exit', waivers = WAIVED_EXCLUSIONS) {
  const text = typeof output === 'string' ? output : ''
  const names = failingTestNames(text)
  const pack = (layer, observed, expected) => ({ layer, record: null, evidence: { observed, expected, names } })
  if (kind !== 'exit') return pack('kind-gate', { kind }, { kind: 'exit' }) // signalled/errored spawns never waive
  for (const entry of waivers) {
    if (entry.identity !== identity) continue // identity axis
    if (entry.location !== location) continue // location axis
    const pin = entry.checks ? entry.checks[check] : undefined
    if (pin === undefined) return pack('no-pin', { identity, location, check }, { pinned: 'waived identity + check' })
    // A malformed pin is never a waiver (fail closed). Markers may be empty
    // only when the failing-set identity carries the value axis (R15).
    const pinOk =
      Array.isArray(pin.markers) &&
      typeof pin.counts === 'object' &&
      pin.counts !== null &&
      Array.isArray(pin.failingSet) &&
      Array.isArray(pin.flaky) &&
      Array.isArray(pin.failTotal) &&
      pin.failTotal.length === 2 &&
      pin.failTotal.every((n) => Number.isInteger(n) && n >= 0) &&
      pin.failTotal[0] <= pin.failTotal[1] &&
      (pin.markers.length > 0 || pin.failingSet.length + pin.flaky.length > 0)
    if (!pinOk) return pack('malformed-pin', { shape: 'invalid pin' }, { shape: 'markers|names + counts + [min,max]' })
    for (const marker of pin.markers) {
      if (!text.includes(marker)) return pack('marker-missing', { missing: marker }, { markers: [...pin.markers] })
    }
    for (const [needle, expected] of Object.entries(pin.counts)) {
      const found = countOccurrences(text, needle)
      if (found !== expected) return pack('count-mismatch', { literal: needle, found }, { literal: needle, count: expected })
    }
    const observedTotal = sumFailTotals(text)
    if (observedTotal < pin.failTotal[0] || observedTotal > pin.failTotal[1]) {
      return pack('range', { sum: observedTotal }, { failTotal: [...pin.failTotal] })
    }
    // R7: the failing-test SET is the deterministic failure identity.
    const observedSet = new Set(names)
    const universe = new Set([...pin.failingSet, ...pin.flaky])
    const intruders = names.filter((n) => !universe.has(n))
    if (intruders.length > 0) return pack('set-subset', { intruders }, { failingSet: pin.failingSet.length, flaky: pin.flaky.length })
    const missing = pin.failingSet.filter((n) => !observedSet.has(n))
    if (missing.length > 0) return pack('set-supersede', { missing }, { failingSet: pin.failingSet.length })
    // R11: the measured invariant — whenever failing names parse, the declared
    // failure total equals the number of DISTINCT failing names (closes the
    // slack exploit). Where NO names parse (tsc/biome checks declare none),
    // the pinned total range is the sole guard and is kept tight to measurement.
    if (names.length > 0 && observedTotal !== names.length) {
      return pack('equality', { sum: observedTotal, distinct: names.length }, { rule: 'sum === |distinct failing names|' })
    }
    return {
      layer: null,
      record: {
        check,
        markers_matched: [...pin.markers],
        counts_verified: { ...pin.counts },
        fail_total: observedTotal,
        failing_set: names,
      },
      evidence: null,
    }
  }
  return pack('no-pin', { identity, location, check }, { pinned: 'waived identity + check' })
}

/** R16: the rejection layer for a refused waiver (null when it would waive). */
export function waiverRejectionLayer(identity, location, check, output, kind = 'exit', waivers = WAIVED_EXCLUSIONS) {
  return evaluateWaiver(identity, location, check, output, kind, waivers).layer
}

/**
 * Run-then-waive (A2 placement 9; R7 value axis): a failing check is waived
 * only when identity, location, and the FULL pinned value all match —
 *   · every stable marker present and every deterministic occurrence count
 *     exact (markers proven constant across >=10 measured runs AND across
 *     environments only),
 *   · the failure-summary sum inside the pinned [min, max] (the measured
 *     variance — accepts exactly the measured variance and nothing more),
 *   · the failing-test SET: every observed failure is a member of the pinned
 *     universe (deterministic set + named flaky members) and every
 *     deterministic member is present; named flaky members are tolerated
 *     present-or-absent. A failure outside the set NEVER waives,
 *   · the R11 measured equality whenever names parse.
 * Callers must not invoke this for signalled/errored spawns (only a clean
 * numeric non-zero exit may waive). Anything else returns null.
 */
export function waiverFor(identity, location, check, output, waivers = WAIVED_EXCLUSIONS) {
  return evaluateWaiver(identity, location, check, output, 'exit', waivers).record
}

// ─── AC3: shard-outcomes seam (schema foreman-line-ci/shard-outcomes@1) ────

export const OUTCOMES_SCHEMA = 'foreman-line-ci/shard-outcomes@1'
export const STATUS_VALUES = Object.freeze(['pass', 'fail', 'error', 'skipped', 'waived'])

/** Normalize one package outcome record (untrusted names normalized). */
export function outcomeRecord(name, checks, waivers = [], rejections = {}) {
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
      failing_set: [...(w.failing_set ?? [])],
      output_sha256: w.output_sha256,
    })),
    // R16: for every non-waived check on a waived identity, the exact layer
    // that refused the waiver — a failed check is never a silent rejection.
    waiver_rejected: { ...rejections },
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
        // Run-then-waive (A2 placement 9; R2/R7/R11/R16): only a clean numeric
        // non-zero EXIT whose output matches the FULL pinned value (markers +
        // counts + total range + failing-set identity + measured equality) is
        // waived. Every refusal is recorded with its exact layer and echoed.
        const evaluation = evaluateWaiver(name, records.get(name).location, check, result.output, result.kind, waivers)
        if (evaluation.record !== null) {
          records.get(name).checks[check] = 'waived'
          records.get(name).waivers.push({ ...evaluation.record, output_sha256: sha256Hex(result.output) })
          // R2: the waived output is echoed (sanitized) — an audit trail, never
          // a silent waiver.
          echoCheck(name, `${check} [waived]`, result.output)
        } else {
          records.get(name).checks[check] = 'fail'
          // R18: the exact layer with its compared values and the observed
          // failing names — the surface-and-ratify loop's data channel. The
          // payload rides the outcome record and the echo (sanitized).
          records.get(name).waiver_rejected[check] = {
            layer: evaluation.layer,
            observed: evaluation.evidence.observed,
            expected: evaluation.evidence.expected,
            names: evaluation.evidence.names,
          }
          const payload = sanitizeField(JSON.stringify(records.get(name).waiver_rejected[check]), 8000)
          echoCheck(name, `${check} [rejected: ${payload}]`, result.output)
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
          // Placement 9 + R7: verify run-then-waive — exact three-axis entry
          // and the recorded verification equal to the full pinned value
          // (markers + counts + measured-variance total + failing-set rules).
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
          const universe = pin !== undefined ? new Set([...pin.failingSet, ...pin.flaky]) : new Set()
          const observed = Array.isArray(record?.failing_set) ? record.failing_set : null
          const setMatch =
            pin !== undefined &&
            observed !== null &&
            observed.every((n) => universe.has(n)) &&
            pin.failingSet.every((n) => observed.includes(n))
          const totalMatch =
            pin !== undefined &&
            typeof record?.fail_total === 'number' &&
            record.fail_total >= pin.failTotal[0] &&
            record.fail_total <= pin.failTotal[1]
          const verified =
            pin !== undefined &&
            record !== undefined &&
            Array.isArray(record.markers_matched) &&
            record.output_sha256 !== undefined &&
            sameSet(record.markers_matched, pin.markers) &&
            countsMatch &&
            setMatch &&
            totalMatch
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
