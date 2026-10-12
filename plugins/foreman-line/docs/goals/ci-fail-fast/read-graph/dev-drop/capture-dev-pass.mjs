#!/usr/bin/env node
// capture-dev-pass.mjs — CFF-P0 AC5.3 supplementary dev-Windows read-graph pass.
//
// TOOLING ONLY. This script never contains, invents, or edits capture data:
// it runs the real sweep under the real probe on the host it is executed on,
// and reduces what that host actually observed.
//
// What it does (see README.md in this directory for the human runcard):
//   1. Preflight: repo root (cwd), Windows host, Node features the runner
//      needs, npm CLI seam, probe byte-identity (SHA-256 pin), clean work area.
//   2. Runs the SAME four shard invocations as the primary vehicle, one after
//      another:  node scripts/foreman-line-ci.mjs shard <i> 4 "<npmCli>"
//      read-graph-shard-outcomes  — with NODE_OPTIONS=--require=<probe> and
//      READGRAPH_CAPTURE_DIR=<repo>/read-graph-capture set for that child only.
//      A red shard never stops the run; each exit code is recorded.
//   3. Streams every per-pid .jsonl line through the five filters pinned in
//      read-graph/measurement-log.md (same order, first match wins) and
//      collapses the kept lines to distinct (package, repo-relative path) pairs.
//   4. Writes dev-drop/dev-pass-raw.json (schema
//      foreman-line-ci/read-graph-raw-capture@1), environment naming this host.
//
// Dependency-free; Node built-ins only. Cross-platform code, but a full run
// refuses on anything other than win32 (no silent host substitution).

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  copyFileSync, cpSync, createReadStream, existsSync, mkdirSync, readFileSync, readdirSync,
  renameSync, rmSync, writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath, pathToFileURL } from 'node:url'

// ─── pins ──────────────────────────────────────────────────────────────────
export const SCHEMA = 'foreman-line-ci/read-graph-raw-capture@1'
export const PROBE_SHA256 = '3105d304b94a12b1282267c1b950e0027f47d0f93abcedda659fed20878d07f0'
export const PROBE_SOURCE = 'git object 2d81d9264ba69df92e96fe331b227cc103eb3e8a:tools/cff-p0-read-graph-probe.mjs'
export const SHARD_COUNT = 4
export const OUTCOMES_DIR_ARG = 'read-graph-shard-outcomes' // identical to the vehicle's argument
export const CAPTURE_DIR_NAME = 'read-graph-capture' // identical to the vehicle's <repo>\read-graph-capture
export const WORK_DIR_NAME = 'read-graph-dev-pass' // per-shard archive of raw capture + outcomes (repo root, never committed)
const DEV_DROP_REL = 'plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/dev-drop'
const OUTPUT_NAME = 'dev-pass-raw.json'

const SELF_PATH = fileURLToPath(import.meta.url)
const DEV_DROP_DIR = path.dirname(SELF_PATH)
const PROBE_PATH = path.join(DEV_DROP_DIR, 'probe', 'cff-p0-read-graph-probe.mjs')
// dev-drop/ sits seven directories below the repository root.
const DERIVED_ROOT = path.resolve(DEV_DROP_DIR, '..', '..', '..', '..', '..', '..', '..')

// The primary fixture's own filter_methodology text (fixtures/ci-pass-raw.json
// on feat/foreman-line-cff-p0), reproduced verbatim for the three filters it
// names, plus the two the measurement log pins (filters 4 and 5) in the log's
// own words. probe_self_excluded additionally names where the byte-identical
// copy lives for this pass.
export const FILTER_METHODOLOGY = Object.freeze({
  install_phase_excluded: "records whose argv1 is npm's own npm-cli.js bootstrap process (ci install / npm's internal workspace package.json walk) are excluded — AC5.1 scopes the capture to what a CHECK (test/typecheck/lint) opens, not npm's own install-time bookkeeping, which is identical for every package and uninformative",
  node_modules_excluded: 'dependency tree reads are excluded — same per-package node_modules churn on every install, not a repo-tracked coupling the pin needs to express',
  probe_self_excluded: `the measurement vehicle's own instrumentation file (tools/cff-p0-read-graph-probe.mjs) is excluded — a NODE_OPTIONS --require/loader load of the probe by every spawned Node process is an artifact of HOW the observation happened, never a production coupling. For this dev pass the byte-identical copy (sha256 ${PROBE_SHA256}) lives at ${DEV_DROP_REL}/probe/cff-p0-read-graph-probe.mjs and that path is the one excluded`,
  external_excluded: "paths outside the repository checkout (Node's own built-in modules resolved to node:-prefixed specifiers with no on-disk file, the global npm cache, temp directories, etc.) are excluded — not repo-tracked paths the pin can express a coupling to. Containment is tested on absolute filesystem paths only (case-insensitive on win32, normalised, recorded casing kept in the output); cwd-relative targets (e.g. a builtin require recorded as bare 'fs') and file:-URL-form targets are never resolved and land here — reduction_diagnostics splits this bucket by form",
  unattributed_excluded: "reads by the outer scripts/foreman-line-ci.mjs / scripts/ci-reuse.mjs orchestrator process itself (cwd = repo root, not inside any package directory) are excluded — the runner's own reads of its own source, not a package's check-time read; out of scope for a package-keyed pin",
  kept: 'every repo-tracked path (own-package and cross-package) any check process (test/typecheck/lint, including child worker/subprocess actors it itself spawns) opened via fs reads, CJS require, or ESM resolve/load — over-approximation-only, nothing further filtered',
  filter_order: 'mutually exclusive, first match wins, in measurement-log order: 1 install_phase, 2 node_modules, 3 probe_self, 4 external, 5 unattributed; remaining lines are check_time_edges, collapsed to distinct (package, repo-relative path) pairs',
})

// ─── path helpers (pure; parametrised so Windows semantics are testable) ────
function hostPathApi(platform = process.platform) {
  return platform === 'win32' ? path.win32 : path.posix
}

function slash(p) {
  return p.replace(/\\/g, '/')
}

// A non-filesystem specifier such as node:fs, data:..., or https://... — a
// scheme of two or more characters. (A one-letter "scheme" is a Windows drive.)
const SCHEME = /^[A-Za-z][A-Za-z0-9+.-]+:/

/**
 * Classify the form of a recorded target and, for an absolute filesystem
 * path, return it normalised. Only absolute paths can be repo-tracked edges:
 * the primary fixture contains no entry a cwd-relative resolution would have
 * produced (e.g. a bare builtin name such as "fs" recorded by cjs.require
 * resolves to "<cwd>/fs"; the 3,044 primary pairs contain none), so relative
 * targets and URL-form targets are "outside-repo paths" here exactly as a
 * string-prefix containment test treats them. Nothing is resolved against cwd.
 */
export function targetForm(target, { pathApi }) {
  if (typeof target !== 'string' || target.length === 0) return { form: 'non_filesystem', abs: null }
  if (target.startsWith('file:')) return { form: 'file_url', abs: null }
  if (SCHEME.test(target)) return { form: 'non_filesystem', abs: null }
  if (!pathApi.isAbsolute(target)) return { form: 'relative', abs: null }
  return { form: 'absolute', abs: pathApi.normalize(target) }
}

/**
 * Repo-relative, forward-slash path for `abs` if it lies strictly inside
 * `root`; '' for the root itself; null when outside. Containment is compared
 * case-insensitively on case-insensitive hosts (win32); the returned relative
 * path keeps the recorded casing (the primary fixture carries entries such as
 * "PLUGINS/FOREMAN-LINE/APPROVAL").
 */
export function repoRelative(abs, root, { caseInsensitive }) {
  const a = slash(abs).replace(/\/+$/, '')
  const r = slash(root).replace(/\/+$/, '')
  const cmpA = caseInsensitive ? a.toLowerCase() : a
  const cmpR = caseInsensitive ? r.toLowerCase() : r
  if (cmpA === cmpR) return ''
  if (!cmpA.startsWith(`${cmpR}/`)) return null
  return a.slice(r.length + 1)
}

function isNpmCliArgv1(argv1, { caseInsensitive }) {
  if (typeof argv1 !== 'string' || argv1.length === 0) return false
  const base = slash(argv1).split('/').pop()
  return (caseInsensitive ? base.toLowerCase() : base) === 'npm-cli.js'
}

/**
 * The five pinned filters, applied to one parsed record. Returns
 * { bucket } or { bucket: 'kept', pkg, rel }. `ctx` carries root, probe path,
 * discovered package names, and path semantics.
 */
export function classifyRecord(rec, ctx) {
  const { root, probePath, packages, pathApi, caseInsensitive } = ctx
  // 1. install phase: the record was written by npm's own npm-cli.js process.
  if (isNpmCliArgv1(rec.argv1, ctx)) return { bucket: 'install_phase' }
  const { form, abs } = targetForm(rec.path, { pathApi })
  const norm = abs === null ? (typeof rec.path === 'string' ? slash(rec.path) : '') : slash(abs)
  // 2. node_modules/ reads.
  if ((caseInsensitive ? norm.toLowerCase() : norm).includes('node_modules/')) return { bucket: 'node_modules' }
  // 3. the probe's own file.
  if (abs !== null && repoRelative(abs, probePath, { caseInsensitive }) === '') return { bucket: 'probe_self' }
  // 4. outside the repository checkout (incl. non-filesystem specifiers).
  const rel = abs === null ? null : repoRelative(abs, root, { caseInsensitive })
  if (rel === null) return { bucket: 'external', detail: abs === null ? form : 'outside_root' }
  if (rel === '') return { bucket: 'external', detail: 'repo_root_itself' }
  // 5. unattributed: the reading process's cwd is not inside a package dir.
  const cwdAbs = typeof rec.cwd === 'string' && rec.cwd.length > 0 ? pathApi.resolve(rec.cwd) : null
  const cwdRel = cwdAbs === null ? null : repoRelative(cwdAbs, root, { caseInsensitive })
  const pkg = packageForCwd(cwdRel, packages, caseInsensitive)
  if (pkg === null) return { bucket: 'unattributed', detail: cwdRel === '' ? 'root_cwd' : 'other_cwd' }
  return { bucket: 'kept', pkg, rel }
}

function packageForCwd(cwdRel, packages, caseInsensitive) {
  if (typeof cwdRel !== 'string' || cwdRel === '') return null
  const parts = cwdRel.split('/')
  if (parts.length < 3) return null
  const eq = (x, y) => (caseInsensitive ? x.toLowerCase() === y.toLowerCase() : x === y)
  if (!eq(parts[0], 'plugins') || !eq(parts[1], 'foreman-line')) return null
  return packages.find((name) => eq(name, parts[2])) ?? null
}

export function emptyStats() {
  return {
    total_lines: 0,
    install_phase_lines: 0,
    node_modules_lines: 0,
    external_lines: 0,
    unattributed_lines: 0,
    probe_self_lines: 0,
    check_time_edges: 0,
  }
}

export function emptyDiagnostics() {
  return {
    malformed_lines: 0,
    external_non_filesystem_lines: 0,
    external_relative_lines: 0,
    external_file_url_lines: 0,
    external_outside_root_lines: 0,
    external_repo_root_itself_lines: 0,
    unattributed_root_cwd_lines: 0,
    unattributed_other_cwd_lines: 0,
    distinct_package_path_pairs: 0,
  }
}

/**
 * Stream one per-pid .jsonl file line by line (never the whole capture in
 * memory) and fold each record into `edges` (Map<pkg, Set<rel>>).
 */
export async function reduceFile(file, ctx, edges, stats, diag) {
  const rl = createInterface({ input: createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity })
  for await (const line of rl) {
    if (line.length === 0) continue
    let rec
    try {
      rec = JSON.parse(line)
    } catch {
      // e.g. a line cut short when a process was killed mid-append. Counted,
      // never guessed at; it is not part of total_lines' filter partition.
      diag.malformed_lines += 1
      continue
    }
    if (rec === null || typeof rec !== 'object') {
      diag.malformed_lines += 1
      continue
    }
    stats.total_lines += 1
    const c = classifyRecord(rec, ctx)
    switch (c.bucket) {
      case 'install_phase': stats.install_phase_lines += 1; break
      case 'node_modules': stats.node_modules_lines += 1; break
      case 'probe_self': stats.probe_self_lines += 1; break
      case 'external':
        stats.external_lines += 1
        if (c.detail === 'non_filesystem') diag.external_non_filesystem_lines += 1
        else if (c.detail === 'relative') diag.external_relative_lines += 1
        else if (c.detail === 'file_url') diag.external_file_url_lines += 1
        else if (c.detail === 'repo_root_itself') diag.external_repo_root_itself_lines += 1
        else diag.external_outside_root_lines += 1
        break
      case 'unattributed':
        stats.unattributed_lines += 1
        if (c.detail === 'root_cwd') diag.unattributed_root_cwd_lines += 1
        else diag.unattributed_other_cwd_lines += 1
        break
      default: {
        stats.check_time_edges += 1
        let set = edges.get(c.pkg)
        if (!set) edges.set(c.pkg, (set = new Set()))
        set.add(c.rel)
      }
    }
  }
}

/** Reduce every shard's archived capture under `workDir`. */
export async function reduceWorkDir(workDir, ctx, log = () => {}) {
  const stats = emptyStats()
  const diag = emptyDiagnostics()
  const edges = new Map()
  const shardFileCounts = {}
  for (let i = 0; i < SHARD_COUNT; i += 1) {
    const dir = path.join(workDir, `shard-${i}`, 'capture')
    const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.jsonl')).sort() : []
    shardFileCounts[String(i)] = files.length
    log(`reducing shard ${i}: ${files.length} per-pid files`)
    for (const f of files) await reduceFile(path.join(dir, f), ctx, edges, stats, diag)
  }
  const packages = {}
  for (const name of [...edges.keys()].sort()) packages[name] = [...edges.get(name)].sort()
  diag.distinct_package_path_pairs = Object.values(packages).reduce((n, list) => n + list.length, 0)
  return { stats, diag, packages, shardFileCounts }
}

// ─── host + repo facts ──────────────────────────────────────────────────────
export function hostFingerprint() {
  return {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    os_release: os.release(),
    os_type: os.type(),
    node_release_lts: process.release?.lts ?? null,
    exec_path: process.execPath,
  }
}

function sha256File(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

function git(root, args) {
  try {
    const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', shell: false })
    return r.status === 0 ? r.stdout.trim() : null
  } catch {
    return null
  }
}

function samePath(a, b) {
  const ci = process.platform === 'win32' || process.platform === 'darwin'
  const x = slash(path.resolve(a)).replace(/\/+$/, '')
  const y = slash(path.resolve(b)).replace(/\/+$/, '')
  return ci ? x.toLowerCase() === y.toLowerCase() : x === y
}

function nodeOptionsRequire(probe) {
  // NODE_OPTIONS splits on spaces and treats backslash as an escape inside
  // double quotes, so a path containing whitespace is quoted with forward
  // slashes (Windows accepts them). Otherwise the vehicle's exact form.
  return /\s/.test(probe) ? `--require="${slash(probe)}"` : `--require=${probe}`
}

/** Every precondition, evaluated without side effects. */
export function preflight({ cwd = process.cwd(), runningAsMain = true } = {}) {
  const checks = []
  const add = (name, ok, detail) => checks.push({ name, ok, detail })
  const runner = path.join(DERIVED_ROOT, 'scripts', 'foreman-line-ci.mjs')
  add('cwd is the repository root', samePath(cwd, DERIVED_ROOT) && existsSync(runner),
    `cwd=${cwd}; expected=${DERIVED_ROOT} (must contain scripts/foreman-line-ci.mjs)`)
  add('host is Windows (win32)', process.platform === 'win32',
    `platform=${process.platform} — this pass is the dev-WINDOWS variance pass; no host substitution`)
  add('Node supports import.meta.main (runner CLI guard; Node >= 24.2)', !runningAsMain || import.meta.main === true,
    `node=${process.version}; without it scripts/foreman-line-ci.mjs silently runs nothing`)
  add('Node supports require(esm) (probe is loaded via --require)', process.features?.require_module === true,
    `process.features.require_module=${String(process.features?.require_module)}`)
  const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
  add('npm CLI seam <node-dir>/node_modules/npm/bin/npm-cli.js exists', existsSync(npmCli), npmCli)
  let probeHash = null
  try {
    probeHash = sha256File(PROBE_PATH)
  } catch {
    // reported below
  }
  add('probe bytes match the SHA-256 pin', probeHash === PROBE_SHA256,
    `observed=${probeHash ?? 'unreadable'} pinned=${PROBE_SHA256} (CRLF checkout? see README step 1)`)
  const capture = path.join(DERIVED_ROOT, CAPTURE_DIR_NAME)
  const work = path.join(DERIVED_ROOT, WORK_DIR_NAME)
  const output = path.join(DEV_DROP_DIR, OUTPUT_NAME)
  add(`no stale ${CAPTURE_DIR_NAME}/ at repo root`, !existsSync(capture), capture)
  add(`no stale ${WORK_DIR_NAME}/ at repo root`, !existsSync(work), work)
  const outcomesDir = path.join(DERIVED_ROOT, OUTCOMES_DIR_ARG)
  add(`no stale ${OUTCOMES_DIR_ARG}/ at repo root`, !existsSync(outcomesDir), outcomesDir)
  add(`no existing ${OUTPUT_NAME} (a drop is never overwritten)`, !existsSync(output), output)
  return { checks, ok: checks.every((c) => c.ok), npmCli, probeHash, capture, work, output }
}

// ─── CLI ────────────────────────────────────────────────────────────────────
const HELP = `capture-dev-pass.mjs — CFF-P0 AC5.3 supplementary dev-Windows read-graph pass

Usage (from the repository root, on the developer's Windows machine):
  node ${DEV_DROP_REL}/capture-dev-pass.mjs            full run (~60-90 min)
  node ${DEV_DROP_REL}/capture-dev-pass.mjs --dry-run  preflight + plan only; runs nothing
  node ${DEV_DROP_REL}/capture-dev-pass.mjs --reduce-only
                       re-reduce an existing ${WORK_DIR_NAME}/ (after a reducer crash)
  node ${DEV_DROP_REL}/capture-dev-pass.mjs --help

Runs, sequentially, for i in 0..3:
  node scripts/foreman-line-ci.mjs shard <i> 4 "<npmCli>" ${OUTCOMES_DIR_ARG}
with NODE_OPTIONS=--require=<probe> and READGRAPH_CAPTURE_DIR=<repo>/${CAPTURE_DIR_NAME}
for that child only. Red shards are expected and never stop the run.
Writes ${DEV_DROP_REL}/${OUTPUT_NAME}.
Exit: 0 = ${OUTPUT_NAME} written (shard colours are recorded inside it, not
signalled here); 2 = preflight refused (nothing run); 1 = run/reduce error.`

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

/**
 * Move this shard's capture dir aside so the next shard starts empty. Windows
 * can briefly hold handles (lingering workers, AV scanners), so retry; fall back
 * to copy+remove. Returns an error string (recorded in shard_runs) or null.
 */
function archiveCapture(from, to) {
  if (!existsSync(from)) return 'no capture directory was produced'
  let last = null
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      renameSync(from, to)
      return null
    } catch (error) {
      last = error
      sleepMs(3000)
    }
  }
  try {
    cpSync(from, to, { recursive: true })
    rmSync(from, { recursive: true, force: true, maxRetries: 10, retryDelay: 1000 })
    return `rename failed (${last?.code ?? last}); archived by copy+remove`
  } catch (error) {
    return `rename failed (${last?.code ?? last}); copy/remove failed (${error?.code ?? error}) — later shards may share files with this one`
  }
}

function printChecks(checks) {
  for (const c of checks) console.log(`  [${c.ok ? ' ok ' : 'FAIL'}] ${c.name}\n         ${c.detail}`)
}

async function reduceAndWrite({ work, output, meta }) {
  const { discoverPackages } = await import(pathToFileURL(path.join(DERIVED_ROOT, 'scripts', 'foreman-line-ci.mjs')).href)
  const packages = discoverPackages({ root: DERIVED_ROOT })
  const ctx = {
    root: DERIVED_ROOT,
    probePath: PROBE_PATH,
    packages,
    pathApi: hostPathApi(),
    platform: process.platform,
    caseInsensitive: process.platform === 'win32',
  }
  const r = await reduceWorkDir(work, ctx, (m) => console.log(`[dev-pass] ${m}`))
  const host = hostFingerprint()
  const doc = {
    schema: SCHEMA,
    environment: `dev-${host.platform === 'win32' ? 'windows' : host.platform} (developer host), Node ${host.node} (measured; not the pinned CI value)`,
    vehicle_branch: git(DERIVED_ROOT, ['rev-parse', '--abbrev-ref', 'HEAD']),
    vehicle_commit: git(DERIVED_ROOT, ['rev-parse', 'HEAD']),
    workflow_run_id: null,
    shard_file_counts: r.shardFileCounts,
    filter_methodology: FILTER_METHODOLOGY,
    stats: r.stats,
    packages: r.packages,
    // Dev-pass additions (not in the primary): provenance for the R15 variance narrative.
    host,
    probe: { path: `${DEV_DROP_REL}/probe/cff-p0-read-graph-probe.mjs`, sha256: sha256File(PROBE_PATH), pinned_sha256: PROBE_SHA256, source: PROBE_SOURCE },
    shard_runs: meta.shardRuns,
    discovered_packages: packages,
    reduction_diagnostics: r.diag,
    started_at: meta.startedAt,
    finished_at: new Date().toISOString(),
  }
  // The reduced document is small (distinct pairs only, ~200KB for the primary);
  // the raw capture itself was only ever streamed, never stringified.
  writeFileSync(output, `${JSON.stringify(doc, null, 2)}\n`)
  return { doc, r }
}

export async function main(argv) {
  const flags = new Set(argv)
  const known = new Set(['--help', '-h', '--dry-run', '--reduce-only'])
  const unknown = argv.filter((a) => !known.has(a))
  if (flags.has('--help') || flags.has('-h')) {
    console.log(HELP)
    return 0
  }
  if (unknown.length > 0) {
    console.error(`Refusing: unknown argument(s) ${unknown.join(' ')}\n\n${HELP}`)
    return 2
  }
  const pf = preflight()
  const reduceOnly = flags.has('--reduce-only')
  if (reduceOnly) {
    // Re-reduce: the archived work dir must exist; everything else as normal.
    const relevant = pf.checks.filter((c) => !c.name.startsWith('no stale '))
    console.log('[dev-pass] preflight (--reduce-only):')
    printChecks(relevant)
    if (!relevant.every((c) => c.ok) || !existsSync(pf.work)) {
      console.error(`[dev-pass] REFUSED: preflight failed${existsSync(pf.work) ? '' : ` (no ${WORK_DIR_NAME}/ to reduce)`}; nothing reduced.`)
      return 2
    }
    let shardRuns = null
    try {
      shardRuns = JSON.parse(readFileSync(path.join(pf.work, 'shard-runs.json'), 'utf8'))
    } catch {
      shardRuns = null
    }
    await reduceAndWrite({ work: pf.work, output: pf.output, meta: { shardRuns, startedAt: shardRuns?.started_at ?? null } })
    console.log(`[dev-pass] wrote ${pf.output}`)
    return 0
  }
  console.log('[dev-pass] host:', JSON.stringify(hostFingerprint()))
  console.log('[dev-pass] preflight:')
  printChecks(pf.checks)
  console.log('[dev-pass] plan (sequential; red shards never stop the run):')
  for (let i = 0; i < SHARD_COUNT; i += 1) {
    console.log(`  shard ${i}: (cwd ${DERIVED_ROOT}) ${process.execPath} scripts/foreman-line-ci.mjs shard ${i} ${SHARD_COUNT} "${pf.npmCli}" ${OUTCOMES_DIR_ARG}`)
  }
  console.log(`  child env: NODE_OPTIONS=${nodeOptionsRequire(PROBE_PATH)}  READGRAPH_CAPTURE_DIR=${pf.capture}`)
  console.log(`  then: stream-reduce ${WORK_DIR_NAME}/shard-*/capture/*.jsonl -> ${pf.output}`)
  if (!pf.ok) {
    console.error('[dev-pass] REFUSED: preflight failed (see FAIL lines above). Nothing was run or written.')
    return 2
  }
  if (flags.has('--dry-run')) {
    console.log('[dev-pass] dry run: preflight passed; nothing was run or written.')
    return 0
  }

  if (process.env.NODE_OPTIONS) {
    console.log(`[dev-pass] note: your NODE_OPTIONS (${process.env.NODE_OPTIONS}) is replaced for the shard children, exactly as the vehicle set it.`)
  }
  const startedAt = new Date().toISOString()
  mkdirSync(pf.work, { recursive: true })
  const shardRuns = { started_at: startedAt, runs: [] }
  const saveRuns = () => writeFileSync(path.join(pf.work, 'shard-runs.json'), `${JSON.stringify(shardRuns, null, 2)}\n`)
  saveRuns()
  for (let i = 0; i < SHARD_COUNT; i += 1) {
    const shardDir = path.join(pf.work, `shard-${i}`)
    mkdirSync(shardDir, { recursive: true })
    mkdirSync(pf.capture, { recursive: true })
    const outcomesFile = path.join(DERIVED_ROOT, OUTCOMES_DIR_ARG, 'shard-outcomes.json')
    // Our own previous shard's file: removed so a shard that writes none is never credited with another's.
    rmSync(outcomesFile, { force: true })
    const t0 = Date.now()
    console.log(`\n[dev-pass] ===== shard ${i}/${SHARD_COUNT - 1} start ${new Date(t0).toISOString()} =====`)
    let res
    try {
      res = spawnSync(process.execPath, [
        path.join('scripts', 'foreman-line-ci.mjs'), 'shard', String(i), String(SHARD_COUNT), pf.npmCli, OUTCOMES_DIR_ARG,
      ], {
        cwd: DERIVED_ROOT,
        stdio: 'inherit',
        shell: false,
        env: { ...process.env, NODE_OPTIONS: nodeOptionsRequire(PROBE_PATH), READGRAPH_CAPTURE_DIR: pf.capture },
      })
    } catch (error) {
      res = { status: null, signal: null, error }
    }
    const run = {
      shard: i,
      exit_code: typeof res.status === 'number' ? res.status : null,
      signal: res.signal ?? null,
      spawn_error: res.error ? String(res.error.message ?? res.error) : null,
      duration_ms: Date.now() - t0,
      outcomes: null,
    }
    // Archive this shard's raw capture and outcomes before the next shard reuses the names.
    const archiveErr = archiveCapture(pf.capture, path.join(shardDir, 'capture'))
    if (archiveErr) run.capture_archive_error = archiveErr
    if (existsSync(outcomesFile)) {
      try {
        copyFileSync(outcomesFile, path.join(shardDir, 'shard-outcomes.json'))
        run.outcomes = JSON.parse(readFileSync(outcomesFile, 'utf8'))
      } catch (error) {
        run.outcomes_error = String(error.message ?? error)
      }
    } else {
      run.outcomes_error = 'shard-outcomes.json not produced'
    }
    shardRuns.runs.push(run)
    saveRuns()
    console.log(`[dev-pass] ===== shard ${i} done: exit=${run.exit_code} signal=${run.signal} (observational; continuing) =====`)
  }

  console.log('\n[dev-pass] all shards attempted; reducing (streaming)...')
  try {
    const { r } = await reduceAndWrite({ work: pf.work, output: pf.output, meta: { shardRuns, startedAt } })
    console.log('[dev-pass] stats:', JSON.stringify(r.stats))
    console.log('[dev-pass] diagnostics:', JSON.stringify(r.diag))
    const attributed = Object.keys(r.packages).length
    if (r.stats.check_time_edges === 0 || attributed < 25) {
      console.log(`[dev-pass] WARNING: only ${attributed} package(s) carry edges (primary: 28 of 30 had external edges, all 30 had own edges).`)
      console.log('[dev-pass] WARNING: if recorded paths do not share the repo root spelling (junction/symlink, 8.3 short names),')
      console.log('[dev-pass] WARNING: they land in external_lines. Drop the file AND the console log anyway; never edit the JSON.')
    }
  } catch (error) {
    console.error(`[dev-pass] REDUCE FAILED: ${error?.stack ?? error}`)
    console.error(`[dev-pass] raw capture kept in ${pf.work}; retry with --reduce-only, or drop the console log as-is.`)
    return 1
  }
  console.log(`[dev-pass] shard exits: ${shardRuns.runs.map((x) => `${x.shard}=${x.exit_code ?? x.signal ?? 'error'}`).join(' ')}`)
  console.log(`[dev-pass] DONE. Wrote ${pf.output}`)
  console.log('[dev-pass] Do not edit it. Drop it as-is (see README).')
  return 0
}

const invokedAsMain = (() => {
  try {
    return process.argv[1] !== undefined && samePath(process.argv[1], SELF_PATH)
  } catch {
    return false
  }
})()

if (invokedAsMain) {
  main(process.argv.slice(2)).then(
    (code) => { process.exitCode = code },
    (error) => {
      console.error(`[dev-pass] unexpected error: ${error?.stack ?? error}`)
      process.exitCode = 1
    },
  )
}
