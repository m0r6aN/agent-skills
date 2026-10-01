// scripts/ci-reuse.mjs — CI-P1 evidence-based reuse decision: pure core + decide/verify CLI.
//
// Contract: plugins/foreman-line/docs/specs/active/CI-P1-docs-only-push-reuse.md
//   C1  evidence = GitHub Actions API conclusions of a prior run of this workflow
//   C2  hashes derive from git object bytes at the API-attested head_sha; the
//       emitted record is audit-only and is never parsed back into a decision
//       (verify consumes decide's record ONLY through the C12 step-output
//       channel and then re-validates every fact from API + git).
//   C3  this file holds the decision core + thin CLI; injected spawn/fetch
//       seams return `unknown` and are normalized at the boundary (SC #2);
//       every external boundary is wrapped in a typed try-catch (SC #1).
//   C8  untrusted text is sanitized before any emission (SC #4/#5); parsing
//       is linear-time with bounded scans (SC #5, OQ4 cap = 10).
//
// CLI (C12):
//   node scripts/ci-reuse.mjs decide
//   node scripts/ci-reuse.mjs verify [--sweep <command> [<args>...]]
// decide exits 0 in both modes and exposes step outputs `decision`,
// `fallback_reason`, `base_sha`, `head_sha`, `evidence_record`. verify emits the
// effective post-verify decision under the same output names BEFORE any sweep
// work; it invokes the fallback sweep itself only when a sweep source is
// supplied and a flip occurs (CI-P1 wiring supplies it), exiting with the
// sweep's exit code.

import { spawnSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

// ─── typed errors (SC #1) ────────────────────────────────────────────────────

export class CiReuseError extends Error {
  constructor(reason, message, cause) {
    super(message, { cause })
    this.name = 'CiReuseError'
    this.reason = reason
  }
}

// ─── pinned vocabulary (A1-E3; every emitted reason is exactly one of these) ─

export const REASON_TEMPLATES = Object.freeze({
  NO_PRIOR_RUN: 'no-prior-run',
  PRIOR_RUN_INCONCLUSIVE: 'prior-run-inconclusive:', // + <conclusion>|null
  HASH_MISMATCH: 'hash-mismatch:', // + code|specifications|workflow|dependency_inputs
  MERGE_CONTEXT_MISMATCH: 'merge-context-mismatch',
  MERGE_BASE_MISMATCH: 'merge-base-mismatch',
  NOT_ANCESTOR: 'not-ancestor',
  SOURCE_HEAD_UNREACHABLE: 'source-head-unreachable',
  CANDIDATE_CAP_TRUNCATION: 'candidate-cap-truncation',
  EVENT_CLASS_INELIGIBLE: 'event-class-ineligible',
  TEST_RELEVANT_CHANGE: 'test-relevant-change',
  UNKNOWN_PATH: 'unknown-path',
  UNSUPPORTED_ENTRY: 'unsupported-entry',
  CLASSIFICATION_ERROR: 'classification-error',
  API_ERROR: 'api-error',
  EVIDENCE_UNVERIFIABLE: 'evidence-unverifiable',
})

const HASH_MISMATCH_CLASSES = Object.freeze(['code', 'specifications', 'workflow', 'dependency_inputs'])
const CONCLUSION_ALLOWLIST = Object.freeze([
  'success', 'failure', 'cancelled', 'timed_out', 'action_required', 'neutral', 'skipped', 'stale',
])

/** Membership check against the pinned vocabulary (schema-test row). */
export function isPinnedReason(reason) {
  if (typeof reason !== 'string') return false
  const t = REASON_TEMPLATES
  if (reason.startsWith(t.HASH_MISMATCH)) {
    return HASH_MISMATCH_CLASSES.includes(reason.slice(t.HASH_MISMATCH.length))
  }
  if (reason.startsWith(t.PRIOR_RUN_INCONCLUSIVE)) {
    const suffix = reason.slice(t.PRIOR_RUN_INCONCLUSIVE.length)
    return suffix === 'null' || CONCLUSION_ALLOWLIST.includes(suffix)
  }
  return Object.values(t).includes(reason)
}

// ─── untrusted-text sanitization (C8, SC #4/#5) ──────────────────────────────

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g
const BIDI_OVERRIDES = /[\u202A-\u202E\u2066-\u2069]/g
const MAX_UNTRUSTED = 200

/**
 * Strip/replace the line-based-protocol delimiters (newline, CR, ESC/NUL via the
 * control-class, `::`) and bidi overrides; length-cap. Linear-time only.
 */
export function sanitizeUntrusted(value, cap = MAX_UNTRUSTED) {
  if (typeof value !== 'string') return ''
  let out = value.replace(CONTROL_CHARS, ' ')
  out = out.replace(BIDI_OVERRIDES, '')
  out = out.split('::').join(': :')
  if (out.length > cap) out = out.slice(0, cap)
  return out
}

// ─── classification (AC2 table + A1-E1; first match wins) ────────────────────

export const CLASS = Object.freeze({
  WORKFLOW: 'workflow',
  DEPENDENCY_INPUTS: 'dependency_inputs',
  SPECIFICATIONS: 'specifications',
  ORDINARY: 'ordinary_documentation',
  CODE: 'code',
})

const DEPENDENCY_BASENAMES = Object.freeze(['package.json', 'package-lock.json', 'npm-shrinkwrap.json', '.npmrc'])
const ORDINARY_BASENAMES = Object.freeze(['README.md', 'AGENTS.md'])
const ENUMERATED_CODE_PREFIXES = Object.freeze(['plugins/foreman-line/', 'scripts/'])
const ENUMERATED_CODE_BASENAMES = Object.freeze(['tsconfig.json', 'biome.json'])

/**
 * A3 measured read-sweep reader set: every path that any check of the frozen-20
 * sweep (or the runner/harness) reads inside the ordinary-documentation shapes.
 * Measured, not asserted (A3-C9); pinned by regression fixtures. Exact
 * repo-relative paths; a trailing '/' marks an excluded subtree. Such paths are
 * never ordinary (A3-R1) and always fall back (`test-relevant-change`, E2).
 * Shrink-only under CI-P2: new readers are added, never removed (C9).
 */
export const READER_SET = Object.freeze([
  'plugins/foreman-line/approval/README.md',
  'plugins/foreman-line/contract-readers/README.md',
  'plugins/foreman-line/contracts/README.md',
  'plugins/foreman-line/dispatch/README.md',
  'plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-catalog-snapshot.v1.json',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit/source-evidence/openrouter-rcm-v1-conservative-projection-20260926.json',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit/source-evidence/pmc-binding-coverage-openrouter-20260926-v4.json',
  'plugins/foreman-line/docs/kickstarters/foreman-shaping-template.md',
  'plugins/foreman-line/foreman-config/README.md',
  'plugins/foreman-line/hybrid-routing/README.md',
  'plugins/foreman-line/permission-profiles/README.md',
  'plugins/foreman-line/projection/README.md',
  'plugins/foreman-line/receipts/README.md',
  'plugins/foreman-line/registration/README.md',
  'plugins/foreman-line/role-authority/README.md',
  'plugins/foreman-line/routing-policy/README.md',
  'plugins/foreman-line/schema-scaffold/README.md',
  'plugins/foreman-line/shaping/README.md',
  'plugins/foreman-line/skill-injection/README.md',
  'plugins/foreman-line/skills/foreman-shaping/SKILL.md',
  'plugins/foreman-line/spec-linter/README.md',
  'plugins/foreman-line/worker-envelopes/README.md',
])

function inReaderSet(path, readers = READER_SET) {
  for (const entry of readers) {
    if (entry.endsWith('/')) {
      if (path.startsWith(entry)) return true
    } else if (path === entry) {
      return true
    }
  }
  return false
}

/**
 * Repo-relative path -> exactly one class. Unknown paths classify `code`
 * (default-deny). Paths are byte strings (latin1-preserving); rules are ASCII.
 * AC2 table as amended by A3: only `*.md` paths may be ordinary, never
 * README/AGENTS inside `plugins/foreman-line/**` or `skills/**`, and never a
 * path in the measured reader set (A3-R1).
 */
export function classifyPath(path, readers = READER_SET) {
  if (typeof path !== 'string' || path.length === 0) return CLASS.CODE
  const segs = path.split('/')
  const base = segs[segs.length - 1]
  // 1 workflow: .github/**
  if (segs[0] === '.github' && segs.length > 1) return CLASS.WORKFLOW
  // 2 dependency_inputs: manifests / lockfiles / npm config
  if (DEPENDENCY_BASENAMES.includes(base)) return CLASS.DEPENDENCY_INPUTS
  // 3 specifications: **/docs/specs/** (segment-pair match, never substring)
  for (let i = 0; i + 1 < segs.length; i += 1) {
    if (segs[i] === 'docs' && segs[i + 1] === 'specs') return CLASS.SPECIFICATIONS
  }
  // 4 ordinary_documentation (rules 4a-4d as amended by A3)
  // reader-set exclusion first (A3-R1): measured readers fall to `code` no
  // matter which ordinary rule would have claimed them (safe direction)
  if (inReaderSet(path, readers)) return CLASS.CODE
  // 4a: README/AGENTS NOT under plugins/foreman-line/** and NOT under skills/**
  if (ORDINARY_BASENAMES.includes(base) &&
      !path.startsWith('plugins/foreman-line/') && !path.startsWith('skills/')) {
    return CLASS.ORDINARY
  }
  // 4b/4c/4d: Markdown-only (A3-R1); every non-Markdown path falls to `code`
  if (path.endsWith('.md')) {
    if (path.startsWith('plugins/foreman-line/docs/goals/')) return CLASS.ORDINARY
    if (path.startsWith('plugins/foreman-line/docs/transcripts/')) return CLASS.ORDINARY
    if (segs[0] === 'docs' && segs.length > 1 && !segs[1].startsWith('specs')) return CLASS.ORDINARY
  }
  // 5 code: default-deny bucket, including unknown paths
  return CLASS.CODE
}

/**
 * True for `code`-bucket paths the amended table names explicitly (A3 rule
 * cell fall-throughs + the pre-existing enumerated shapes). E2 split: these
 * get `test-relevant-change`; unenumerated code paths get `unknown-path`.
 */
function isNamedCodeShape(path, segs, base, readers = READER_SET) {
  if (ENUMERATED_CODE_PREFIXES.some((prefix) => path.startsWith(prefix))) return true
  if (ENUMERATED_CODE_BASENAMES.includes(base)) return true
  if (inReaderSet(path, readers)) return true // A3-R1 excluded-reader
  if (ORDINARY_BASENAMES.includes(base) && segs[0] === 'skills') return true // A3 row 5 named shape
  const underOrdinaryRule =
    path.startsWith('plugins/foreman-line/docs/goals/') ||
    path.startsWith('plugins/foreman-line/docs/transcripts/') ||
    (segs[0] === 'docs' && segs.length > 1 && !segs[1].startsWith('specs'))
  if (underOrdinaryRule && !path.endsWith('.md')) return true // A3-R1 non-Markdown fall-through
  if (segs[0] === 'docs' && segs.length > 1 && segs[1].startsWith('specs')) return true // A1-E1 near-miss
  return false
}

/**
 * Fallback reason for a changed path (E2 split inside the `code` bucket);
 * null when the path is ordinary documentation.
 */
export function deltaFallbackReason(path, readers = READER_SET) {
  const cls = classifyPath(path, readers)
  if (cls === CLASS.ORDINARY) return null
  if (cls !== CLASS.CODE) return REASON_TEMPLATES.TEST_RELEVANT_CHANGE
  const segs = path.split('/')
  const base = segs[segs.length - 1]
  return isNamedCodeShape(path, segs, base, readers)
    ? REASON_TEMPLATES.TEST_RELEVANT_CHANGE
    : REASON_TEMPLATES.UNKNOWN_PATH
}

// ─── canonical hashing (AC2 equivalence table) ───────────────────────────────

export const EMPTY_CLASS_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
const REGULAR_MODES = Object.freeze(['100644', '100755', '120000'])
const OID_RE = /^[0-9a-f]{40}$|^[0-9a-f]{64}$/
const HEX40_RE = /^[0-9a-f]{40}$/

function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function toBuffer(unknownBytes, what) {
  if (Buffer.isBuffer(unknownBytes)) return unknownBytes
  if (unknownBytes instanceof Uint8Array) return Buffer.from(unknownBytes)
  if (typeof unknownBytes === 'string') return Buffer.from(unknownBytes, 'latin1')
  throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, `${what} is not byte output`)
}

/** Parse `git ls-tree -r -z` output: `MODE SP TYPE SP OID TAB PATH NUL` per entry. */
export function parseLsTreeZ(raw) {
  const buf = toBuffer(raw, 'ls-tree output')
  const entries = []
  let start = 0
  for (let i = 0; i <= buf.length; i += 1) {
    if (i < buf.length && buf[i] !== 0) continue
    const record = buf.subarray(start, i)
    start = i + 1
    if (record.length === 0) continue
    const sp1 = record.indexOf(0x20)
    const sp2 = sp1 < 0 ? -1 : record.indexOf(0x20, sp1 + 1)
    const tab = sp2 < 0 ? -1 : record.indexOf(0x09, sp2 + 1)
    if (sp1 <= 0 || sp2 <= sp1 + 1 || tab <= sp2 + 1 || tab + 1 >= record.length) {
      throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'malformed ls-tree record')
    }
    const mode = record.toString('latin1', 0, sp1)
    const type = record.toString('latin1', sp1 + 1, sp2)
    const oid = record.toString('latin1', sp2 + 1, tab)
    const path = Buffer.from(record.subarray(tab + 1))
    if (!REGULAR_MODES.includes(mode)) {
      throw new CiReuseError(REASON_TEMPLATES.UNSUPPORTED_ENTRY, `unsupported entry mode ${sanitizeUntrusted(mode, 32)}`)
    }
    if (type !== 'blob' || !OID_RE.test(oid)) {
      throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'malformed ls-tree entry')
    }
    entries.push({ mode, oid, path })
  }
  return entries
}

/**
 * Parse `git cat-file --batch` output linearly: `<oid> SP <type> SP <size> LF
 * <bytes> LF` per requested object (or `<oid> missing LF`).
 */
export function parseCatFileBatchZ(raw) {
  const buf = toBuffer(raw, 'cat-file output')
  const blobs = new Map()
  let pos = 0
  while (pos < buf.length) {
    let eol = buf.indexOf(0x0A, pos)
    if (eol < 0) throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'malformed cat-file header')
    const header = buf.toString('latin1', pos, eol)
    pos = eol + 1
    const sp1 = header.indexOf(' ')
    const sp2 = sp1 < 0 ? -1 : header.indexOf(' ', sp1 + 1)
    if (sp1 <= 0 || sp2 <= sp1 + 1) {
      throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'malformed cat-file record')
    }
    const oid = header.slice(0, sp1)
    const type = header.slice(sp1 + 1, sp2)
    const sizeText = header.slice(sp2 + 1)
    if (type === 'missing' && sizeText === '') {
      throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, `missing git object ${sanitizeUntrusted(oid, 80)}`)
    }
    if (!/^\d+$/.test(sizeText)) {
      throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'malformed cat-file size')
    }
    const size = Number(sizeText)
    if (!Number.isSafeInteger(size) || size < 0 || pos + size + 1 > buf.length) {
      throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'truncated cat-file payload')
    }
    blobs.set(oid, Buffer.from(buf.subarray(pos, pos + size)))
    pos += size + 1
  }
  return blobs
}

/**
 * Class-hash serialization: entries sorted by path bytes, one line each
 * `hex(SHA-256(blob bytes)) + ' ' + <mode> + ' ' + <path> + '\n'`; the empty
 * class hashes the empty serialization (pinned constant).
 */
export function classSerialization(entries) {
  const sorted = [...entries].sort((a, b) => Buffer.compare(a.path, b.path))
  const chunks = []
  for (const entry of sorted) {
    chunks.push(Buffer.from(`${sha256Hex(entry.blob)} ${entry.mode} `, 'latin1'))
    chunks.push(entry.path)
    chunks.push(Buffer.from('\n', 'latin1'))
  }
  return Buffer.concat(chunks)
}

// ─── merge_context (C6 + E9) ─────────────────────────────────────────────────

/** `SHA-256(base_branch + '\0' + base_sha)`; absent/unvalidated => `null\0null`. */
export function mergeContextHash(baseBranch, baseSha) {
  const branch = typeof baseBranch === 'string' && baseBranch.length > 0 ? baseBranch : 'null'
  const sha = typeof baseSha === 'string' && HEX40_RE.test(baseSha) ? baseSha : 'null'
  return sha256Hex(Buffer.concat([Buffer.from(branch, 'utf8'), Buffer.from([0]), Buffer.from(sha, 'utf8')]))
}

// ─── git seam boundary ───────────────────────────────────────────────────────

function gitBytes(git, args, opts) {
  let result
  try {
    result = git(args, opts)
  } catch (cause) {
    throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, `git ${args[0]} failed`, cause)
  }
  const status = result?.status
  const stdout = result?.stdout
  if (!Number.isInteger(status)) {
    throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'git seam returned no status')
  }
  return { status, stdout: toBuffer(stdout, 'git stdout') }
}

/**
 * Tree-walk at `sha` -> the four tree class hashes (ordinary_documentation is
 * excluded from hashing by design). Unsupported modes => `unsupported-entry`.
 */
export function computeTreeClassHashes(git, sha) {
  const tree = gitBytes(git, ['ls-tree', '-r', '-z', sha])
  if (tree.status !== 0) {
    throw new CiReuseError(REASON_TEMPLATES.SOURCE_HEAD_UNREACHABLE, `git ls-tree failed for ${sanitizeUntrusted(sha, 80)}`)
  }
  const entries = parseLsTreeZ(tree.stdout)
  const byClass = new Map([[CLASS.CODE, []], [CLASS.SPECIFICATIONS, []], [CLASS.WORKFLOW, []], [CLASS.DEPENDENCY_INPUTS, []]])
  const oids = new Set()
  for (const entry of entries) {
    const cls = classifyPath(entry.path.toString('latin1'))
    if (cls === CLASS.ORDINARY) continue
    byClass.get(cls).push({ mode: entry.mode, path: entry.path, oid: entry.oid })
    oids.add(entry.oid)
  }
  const oidList = [...oids]
  const blobs = new Map()
  if (oidList.length > 0) {
    const batch = gitBytes(git, ['cat-file', '--batch'], {
      input: Buffer.from(`${oidList.join('\n')}\n`, 'latin1'),
    })
    if (batch.status !== 0) {
      throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'git cat-file failed')
    }
    for (const [oid, bytes] of parseCatFileBatchZ(batch.stdout)) blobs.set(oid, bytes)
    for (const oid of oidList) {
      if (!blobs.has(oid)) {
        throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, `missing blob ${sanitizeUntrusted(oid, 80)}`)
      }
    }
  }
  const hashes = {}
  for (const [cls, list] of byClass) {
    const withBlobs = list.map((entry) => ({ ...entry, blob: blobs.get(entry.oid) }))
    hashes[cls] = withBlobs.length === 0 ? EMPTY_CLASS_HASH : sha256Hex(classSerialization(withBlobs))
  }
  return {
    code: hashes[CLASS.CODE],
    specifications: hashes[CLASS.SPECIFICATIONS],
    workflow: hashes[CLASS.WORKFLOW],
    dependency_inputs: hashes[CLASS.DEPENDENCY_INPUTS],
  }
}

/** Parse `git diff --name-status -z`: `STATUS NUL PATH NUL [PATH NUL]` per record. */
export function parseNameStatusZ(raw) {
  const buf = toBuffer(raw, 'diff output')
  const records = []
  let pos = 0
  const nextToken = () => {
    const end = buf.indexOf(0x00, pos)
    if (end < 0) throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'malformed diff record')
    const token = Buffer.from(buf.subarray(pos, end))
    pos = end + 1
    return token
  }
  while (pos < buf.length) {
    const status = nextToken().toString('latin1')
    if (!/^[A-Z][0-9]*$/.test(status)) {
      throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'malformed diff status')
    }
    const paths = [nextToken()]
    if (status[0] === 'R' || status[0] === 'C') paths.push(nextToken())
    records.push({ status, paths })
  }
  return records
}

// ─── API seam boundary (fetch-shaped: url, init -> { status, text }) ──────────

async function apiGet(api, url) {
  let response
  try {
    response = await api(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
  } catch (cause) {
    throw new CiReuseError(REASON_TEMPLATES.API_ERROR, 'API request failed', cause)
  }
  const status = response?.status
  const text = response?.text
  if (!Number.isInteger(status) || typeof text !== 'string') {
    throw new CiReuseError(REASON_TEMPLATES.API_ERROR, 'API seam returned an unvalidated response')
  }
  if (status < 200 || status >= 300) {
    throw new CiReuseError(REASON_TEMPLATES.API_ERROR, `API responded ${status}`)
  }
  try {
    return JSON.parse(text)
  } catch (cause) {
    throw new CiReuseError(REASON_TEMPLATES.API_ERROR, 'API returned malformed JSON', cause)
  }
}

function asRecord(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new CiReuseError(REASON_TEMPLATES.API_ERROR, 'API body is not an object')
  }
  return value
}

function asInt(value, field) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new CiReuseError(REASON_TEMPLATES.API_ERROR, `API field ${field} is not an integer`)
  }
  return value
}

function asString(value, field) {
  if (typeof value !== 'string') {
    throw new CiReuseError(REASON_TEMPLATES.API_ERROR, `API field ${field} is not a string`)
  }
  return value
}

function asHex40(value, field) {
  if (typeof value !== 'string' || !HEX40_RE.test(value)) {
    throw new CiReuseError(REASON_TEMPLATES.API_ERROR, `API field ${field} is not a hex40 SHA`)
  }
  return value
}

/** Validate one workflow-run entry (allowlist-validated conclusion). */
export function validateRunEntry(raw) {
  const run = asRecord(raw)
  const conclusion = run.conclusion === null ? null : asString(run.conclusion, 'conclusion')
  if (conclusion !== null && !CONCLUSION_ALLOWLIST.includes(conclusion)) {
    throw new CiReuseError(REASON_TEMPLATES.API_ERROR, 'API conclusion is not allowlisted')
  }
  const pullRequestsRaw = run.pull_requests === undefined ? [] : run.pull_requests
  if (!Array.isArray(pullRequestsRaw)) {
    throw new CiReuseError(REASON_TEMPLATES.API_ERROR, 'API field pull_requests is not an array')
  }
  const pullRequests = pullRequestsRaw.map((rawPr) => {
    const pr = asRecord(rawPr)
    const base = pr.base === undefined || pr.base === null ? null : asRecord(pr.base)
    return {
      number: asInt(pr.number, 'pull_requests[].number'),
      baseRef: base === null ? null : asString(base.ref, 'pull_requests[].base.ref'),
      baseSha: base === null ? null : asHex40(base.sha, 'pull_requests[].base.sha'),
    }
  })
  const repoFullName = run.head_repository === undefined || run.head_repository === null
    ? null
    : asString(asRecord(run.head_repository).full_name, 'head_repository.full_name')
  return {
    id: asInt(run.id, 'id'),
    headSha: asHex40(run.head_sha, 'head_sha'),
    headBranch: asString(run.head_branch, 'head_branch'),
    event: asString(run.event, 'event'),
    status: asString(run.status, 'status'),
    conclusion,
    workflowId: asInt(run.workflow_id, 'workflow_id'),
    pullRequests,
    repoFullName,
  }
}

// ─── evidence record (AC0 shape; pinned field names, no others at top level) ─

const INPUT_HASH_FIELDS = Object.freeze(['code', 'specifications', 'workflow', 'dependency_inputs', 'merge_context'])
const EMPTY_INPUT_HASHES = Object.freeze({
  code: null, specifications: null, workflow: null, dependency_inputs: null, merge_context: null,
})

function validateInputHashes(raw, field) {
  const hashes = asRecordShape(raw, field)
  const out = {}
  for (const key of INPUT_HASH_FIELDS) {
    const value = hashes[key]
    if (value !== null && (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value))) {
      throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, `${field}.${key} is not hex64`)
    }
    out[key] = value ?? null
  }
  return out
}

function asRecordShape(value, what) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, `${what} is not an object`)
  }
  return value
}

/** Build the evidence record with the pinned AC0 field order. */
export function buildRecord({ decision, baseSha, headSha, inputHashes, sourceRun, fallbackReason }) {
  if (decision !== 'reuse' && decision !== 'fallback') {
    throw new CiReuseError(REASON_TEMPLATES.CLASSIFICATION_ERROR, 'invalid decision value')
  }
  if (decision === 'reuse' && fallbackReason !== null) {
    throw new CiReuseError(REASON_TEMPLATES.CLASSIFICATION_ERROR, 'reuse record must carry a null fallback_reason')
  }
  if (decision === 'fallback' && !isPinnedReason(fallbackReason)) {
    throw new CiReuseError(REASON_TEMPLATES.CLASSIFICATION_ERROR, 'fallback record must carry a pinned reason')
  }
  const safeReason = fallbackReason === null ? null : sanitizeUntrusted(fallbackReason)
  return {
    decision,
    base_sha: baseSha ?? null,
    head_sha: headSha ?? null,
    input_hashes: {
      code: inputHashes?.code ?? null,
      specifications: inputHashes?.specifications ?? null,
      workflow: inputHashes?.workflow ?? null,
      dependency_inputs: inputHashes?.dependency_inputs ?? null,
      merge_context: inputHashes?.merge_context ?? null,
    },
    source_run: sourceRun ?? null,
    fallback_reason: safeReason,
  }
}

// ─── emission (record -> log + GITHUB_STEP_SUMMARY text; audit-only) ─────────

export function buildEmission(record) {
  const json = JSON.stringify(record)
  const line = `CI_REUSE_EVIDENCE ${json}`
  const reason = record.fallback_reason === null ? 'null' : record.fallback_reason
  const logText = [
    `ci-reuse decision=${record.decision} fallback_reason=${reason}`,
    `ci-reuse head_sha=${record.head_sha ?? 'null'} base_sha=${record.base_sha ?? 'null'}`,
    `ci-reuse source_run=${record.source_run === null ? 'null' : String(record.source_run.run_id)}`,
    line,
  ].join('\n') + '\n'
  const summaryText = [
    '## CI Reuse Decision',
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| decision | ${record.decision} |`,
    `| fallback_reason | ${reason} |`,
    `| head_sha | ${record.head_sha ?? 'null'} |`,
    `| base_sha | ${record.base_sha ?? 'null'} |`,
    `| source_run | ${record.source_run === null ? 'null' : String(record.source_run.run_id)} |`,
    '',
    '```json',
    json,
    '```',
    '',
  ].join('\n') + '\n'
  return { json, line, logText, summaryText }
}

// ─── decision chain (AC3 rules 0-6; first failing rule wins its reason) ──────

function normalizeEvent(eventName, rawEvent) {
  const event = asEventShape(rawEvent)
  if (eventName !== 'pull_request') {
    const after = event.after
    return {
      prNumber: null,
      baseRef: null,
      baseSha: null,
      headSha: typeof after === 'string' && HEX40_RE.test(after) ? after : null,
    }
  }
  const pr = asEventShape(event.pull_request)
  const head = asEventShape(pr.head)
  const headSha = head.sha
  if (typeof headSha !== 'string' || !HEX40_RE.test(headSha)) {
    throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'pull_request.head.sha is not hex40')
  }
  const number = pr.number
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'pull_request.number is not an integer')
  }
  let baseRef = null
  let baseSha = null
  if (pr.base !== undefined && pr.base !== null) {
    const base = asEventShape(pr.base)
    if (typeof base.ref === 'string' && base.ref.length > 0 && typeof base.sha === 'string' && HEX40_RE.test(base.sha)) {
      baseRef = base.ref
      baseSha = base.sha
    }
    // unvalidated base data falls to the null/null pair (A3)
  }
  return { prNumber: number, baseRef, baseSha, headSha }
}

function asEventShape(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'event payload is not an object')
  }
  return value
}

function lineage(candidate, { repo, workflowId, headBranch, prNumber }) {
  if (candidate.workflowId !== workflowId) return false
  if (candidate.headBranch !== headBranch) return false
  if (candidate.event !== 'pull_request') return false // A1: source is PR-class only
  if (candidate.repoFullName !== null && candidate.repoFullName !== repo) return false
  if (prNumber !== null && !candidate.pullRequests.some((pr) => pr.number === prNumber)) return false
  return true
}

function sourceMergeContext(candidate, prNumber) {
  const match = prNumber === null
    ? null
    : candidate.pullRequests.find((pr) => pr.number === prNumber) ?? null
  return match === null ? mergeContextHash(null, null) : mergeContextHash(match.baseRef, match.baseSha)
}

function compareInputHashes(current, source) {
  for (const key of HASH_MISMATCH_CLASSES) {
    if (current[key] !== source[key]) return `${REASON_TEMPLATES.HASH_MISMATCH}${key}`
  }
  if (current.merge_context !== source.merge_context) return REASON_TEMPLATES.MERGE_CONTEXT_MISMATCH
  return null
}

function failFallback(reason, headSha, baseSha, inputHashes) {
  return buildRecord({
    decision: 'fallback',
    baseSha,
    headSha,
    inputHashes: inputHashes ?? EMPTY_INPUT_HASHES,
    sourceRun: null,
    fallbackReason: reason,
  })
}

function reasonOf(error) {
  if (error instanceof CiReuseError && isPinnedReason(error.reason)) return error.reason
  return REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE
}

/**
 * Audit-only richness: early fallbacks still carry the current head's hashes
 * when they are computable (AC0 shape); computation failures never change the
 * decision or its reason (C2/C7).
 */
function withBestEffortHashes(ctx, record) {
  if (record.input_hashes.code !== null || record.head_sha === null) return record
  try {
    const hashes = computeTreeClassHashes(ctx.git, record.head_sha)
    let mergeHash = mergeContextHash(null, null)
    try {
      const ev = normalizeEvent(ctx.eventName, ctx.event)
      mergeHash = mergeContextHash(ev.baseRef, ev.baseSha)
    } catch { /* keep the null-pair hash */ }
    return buildRecord({
      decision: record.decision,
      baseSha: record.base_sha,
      headSha: record.head_sha,
      inputHashes: { ...hashes, merge_context: mergeHash },
      sourceRun: null,
      fallbackReason: record.fallback_reason,
    })
  } catch {
    return record
  }
}

/**
 * The decision chain. Returns the record plus the best-effort current-head
 * hashes; every error maps to `decision: fallback` with a pinned reason (C7).
 */
async function evaluateChain(ctx, pinnedSourceRunId) {
  const { api, git, eventName, event, runId, repo, apiBase } = ctx
  const recordInputHashes = { ...EMPTY_INPUT_HASHES }
  const hashOnce = (sha, baseRef, baseSha) => {
    const hashes = computeTreeClassHashes(git, sha)
    recordInputHashes.code = hashes.code
    recordInputHashes.specifications = hashes.specifications
    recordInputHashes.workflow = hashes.workflow
    recordInputHashes.dependency_inputs = hashes.dependency_inputs
    recordInputHashes.merge_context = mergeContextHash(baseRef, baseSha)
    return { ...recordInputHashes }
  }

  // rule 0 (A1): only pull_request-class runs are ever eligible; this refusal
  // is answerable from the event NAME alone, before any payload parsing
  if (eventName !== 'pull_request') {
    let headSha = ctx.headShaFallback ?? null
    try {
      const pushed = normalizeEvent(eventName, event)
      headSha = pushed.headSha ?? headSha
    } catch { /* display-only fields stay best-effort */ }
    try { if (headSha) hashOnce(headSha, null, null) } catch { /* best-effort record hashes */ }
    return { record: failFallback(REASON_TEMPLATES.EVENT_CLASS_INELIGIBLE, headSha, null, recordInputHashes), sourceRun: null }
  }

  const ev = normalizeEvent(eventName, event)
  const baseSha = ev.baseSha

  const headSha = ev.headSha
  const currentRun = validateRunEntry(await apiGet(api, `${apiBase}/repos/${repo}/actions/runs/${runId}`))
  // E8 tightening: the payload head must equal this run's own API-attested head
  if (currentRun.headSha !== headSha) {
    return { record: failFallback(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, headSha, baseSha, recordInputHashes), sourceRun: null }
  }
  if (currentRun.event !== eventName || currentRun.workflowId < 0) {
    return { record: failFallback(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, headSha, baseSha, recordInputHashes), sourceRun: null }
  }

  const lineageFilter = {
    repo,
    workflowId: currentRun.workflowId,
    headBranch: currentRun.headBranch,
    prNumber: ev.prNumber,
  }

  let candidate = null
  if (pinnedSourceRunId !== undefined) {
    // verify path: re-fetch the named source run directly (AC4)
    candidate = validateRunEntry(await apiGet(api, `${apiBase}/repos/${repo}/actions/runs/${pinnedSourceRunId}`))
    if (candidate.id !== pinnedSourceRunId) {
      return { record: failFallback(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, headSha, baseSha, recordInputHashes), sourceRun: null }
    }
    if (!lineage(candidate, lineageFilter)) {
      return { record: failFallback(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, headSha, baseSha, recordInputHashes), sourceRun: null }
    }
  } else {
    const listing = asRecord(await apiGet(
      api,
      `${apiBase}/repos/${repo}/actions/workflows/${currentRun.workflowId}/runs?branch=${encodeURIComponent(currentRun.headBranch)}&per_page=50`,
    ))
    const runs = listing.workflow_runs
    if (!Array.isArray(runs)) {
      throw new CiReuseError(REASON_TEMPLATES.API_ERROR, 'API field workflow_runs is not an array')
    }
    let scanned = 0
    let index = 0
    for (; index < runs.length && scanned < 10; index += 1) {
      scanned += 1
      const entry = validateRunEntry(runs[index]) // examined entries are strictly validated
      if (entry.id === runId) continue // never our own run
      if (!lineage(entry, lineageFilter)) continue // non-lineage entries are skipped while scanning
      candidate = entry
      break
    }
    if (candidate === null) {
      const truncated = scanned >= 10 && index < runs.length
      return {
        record: failFallback(truncated ? REASON_TEMPLATES.CANDIDATE_CAP_TRUNCATION : REASON_TEMPLATES.NO_PRIOR_RUN, headSha, baseSha, recordInputHashes),
        sourceRun: null,
      }
    }
  }

  // rule 2: conclusion — completed + success, allowlist-validated
  if (candidate.status !== 'completed' || candidate.conclusion !== 'success') {
    const suffix = candidate.conclusion === null ? 'null' : candidate.conclusion
    return {
      record: failFallback(`${REASON_TEMPLATES.PRIOR_RUN_INCONCLUSIVE}${suffix}`, headSha, baseSha, recordInputHashes),
      sourceRun: null,
    }
  }

  // rule 3: ancestry (force-push / side history => fallback)
  const ancestry = gitBytes(git, ['merge-base', '--is-ancestor', candidate.headSha, headSha])
  if (ancestry.status === 1) {
    return { record: failFallback(REASON_TEMPLATES.NOT_ANCESTOR, headSha, baseSha, recordInputHashes), sourceRun: null }
  }
  if (ancestry.status !== 0) {
    return { record: failFallback(REASON_TEMPLATES.SOURCE_HEAD_UNREACHABLE, headSha, baseSha, recordInputHashes), sourceRun: null }
  }

  // rule 4: docs-only delta from the source head (both sides of renames)
  const diff = gitBytes(git, ['diff', '--name-status', '-z', candidate.headSha, headSha])
  if (diff.status !== 0) {
    return { record: failFallback(REASON_TEMPLATES.SOURCE_HEAD_UNREACHABLE, headSha, baseSha, recordInputHashes), sourceRun: null }
  }
  for (const change of parseNameStatusZ(diff.stdout)) {
    for (const path of change.paths) {
      const reason = deltaFallbackReason(path.toString('latin1'))
      if (reason !== null) {
        return { record: failFallback(reason, headSha, baseSha, recordInputHashes), sourceRun: null }
      }
    }
  }

  // rule 5: five-class equivalence from git bytes at the attested SHAs
  const currentHashes = hashOnce(headSha, ev.baseRef, ev.baseSha)
  const sourceHashes = {
    ...computeTreeClassHashes(git, candidate.headSha),
    merge_context: sourceMergeContext(candidate, ev.prNumber),
  }
  const mismatch = compareInputHashes(currentHashes, sourceHashes)
  if (mismatch !== null) {
    return { record: failFallback(mismatch, headSha, baseSha, recordInputHashes), sourceRun: null }
  }

  // rule 6 (A1): merge-base strengthening with the base branch
  if (ev.baseRef === null) {
    return { record: failFallback(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, headSha, baseSha, recordInputHashes), sourceRun: null }
  }
  const baseRefSpec = `origin/${ev.baseRef}`
  const mbHead = gitBytes(git, ['merge-base', headSha, baseRefSpec])
  const mbSource = gitBytes(git, ['merge-base', candidate.headSha, baseRefSpec])
  if (mbHead.status !== 0 || mbSource.status !== 0) {
    return { record: failFallback(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, headSha, baseSha, recordInputHashes), sourceRun: null }
  }
  const mbHeadSha = mbHead.stdout.toString('latin1').trim()
  const mbSourceSha = mbSource.stdout.toString('latin1').trim()
  if (!HEX40_RE.test(mbHeadSha) || !HEX40_RE.test(mbSourceSha)) {
    return { record: failFallback(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, headSha, baseSha, recordInputHashes), sourceRun: null }
  }
  if (mbHeadSha !== mbSourceSha) {
    return { record: failFallback(REASON_TEMPLATES.MERGE_BASE_MISMATCH, headSha, baseSha, recordInputHashes), sourceRun: null }
  }

  const sourceRun = {
    run_id: candidate.id,
    conclusion: 'success',
    input_hashes: sourceHashes,
  }
  return {
    record: buildRecord({
      decision: 'reuse',
      baseSha,
      headSha,
      inputHashes: currentHashes,
      sourceRun,
      fallbackReason: null,
    }),
    sourceRun,
    currentHashes,
    ev,
  }
}

/** decide (C12): exits 0 in both modes; errors map to fallback (C7). */
export async function decideCore(ctx) {
  let record
  try {
    ;({ record } = await evaluateChain(ctx, undefined))
  } catch (error) {
    record = failFallback(reasonOf(error), ctx.headShaFallback ?? null, null, null)
  }
  record = withBestEffortHashes(ctx, record)
  const emission = buildEmission(record)
  // R2: all emission writes complete before any sweep work (AC0 "on every run")
  if (typeof ctx.emit === 'function') ctx.emit(record, emission)
  return { record, exitCode: 0, ...emission }
}

// ─── verification (AC4) ──────────────────────────────────────────────────────

/** Parse decide's evidence record from the C12 output channel (never a log). */
export function parseEvidenceRecord(raw) {
  if (typeof raw !== 'string' || raw.length === 0) {
    throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'missing evidence record')
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (cause) {
    throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'evidence record is not JSON', cause)
  }
  const record = asRecordShape(parsed, 'evidence record')
  const required = ['decision', 'base_sha', 'head_sha', 'input_hashes', 'source_run', 'fallback_reason']
  if (Object.keys(record).length !== required.length || required.some((key) => !(key in record))) {
    throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'evidence record field names do not match AC0')
  }
  if (record.decision !== 'reuse' || record.fallback_reason !== null) {
    throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'evidence record is not a reuse record')
  }
  if (typeof record.head_sha !== 'string' || !HEX40_RE.test(record.head_sha)) {
    throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'evidence record head_sha is not hex40')
  }
  if (record.base_sha !== null && (typeof record.base_sha !== 'string' || !HEX40_RE.test(record.base_sha))) {
    throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'evidence record base_sha is not hex40|null')
  }
  const inputHashes = validateInputHashes(record.input_hashes, 'input_hashes')
  const sourceRun = asRecordShape(record.source_run, 'source_run')
  if (!Number.isSafeInteger(sourceRun.run_id) || sourceRun.run_id < 0 || sourceRun.conclusion !== 'success') {
    throw new CiReuseError(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, 'evidence record source_run is invalid')
  }
  const sourceHashes = validateInputHashes(sourceRun.input_hashes, 'source_run.input_hashes')
  return {
    decision: 'reuse',
    base_sha: record.base_sha,
    head_sha: record.head_sha,
    input_hashes: inputHashes,
    source_run: { run_id: sourceRun.run_id, conclusion: 'success', input_hashes: sourceHashes },
    fallback_reason: null,
  }
}

/**
 * verify (AC4): re-fetch the source run's conclusion and recompute both heads'
 * input_hashes at verification time; any unverifiable condition emits
 * `decision: fallback` and — when a sweep source is supplied — runs the full
 * sweep in its place, exiting with the sweep's exit code (AC5). Without a sweep
 * source the flip exits 0 and the effective decision is consumed downstream.
 */
export async function verifyCore(ctx) {
  let record
  try {
    const record0 = parseEvidenceRecord(ctx.evidence)
    // R6 (D-P3): candidate selection is re-derived through the same E4
    // newest-first scan the decide path uses; the channel's pinned run_id is
    // cross-checked against the derived source, never trusted to select it
    const derived = await evaluateChain(ctx, undefined)
    record = derived.record
    if (record.decision === 'reuse' && record.source_run.run_id !== record0.source_run.run_id) {
      record = failFallback(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, record.head_sha, record.base_sha, record.input_hashes)
    } else if (record.decision === 'reuse') {
      // pins agree: re-validate the pinned facts themselves from primary
      // sources (AC4 defense in depth — the pinned chain re-fetches the
      // source run's conclusion and recomputes both heads' input_hashes)
      const revalidated = await evaluateChain(ctx, record0.source_run.run_id)
      record = revalidated.record
      if (record.decision === 'reuse') {
        // the recomputed current head must also match the record it verifies
        const mismatch = compareInputHashes(record.input_hashes, record0.input_hashes)
        if (mismatch !== null) {
          record = failFallback(mismatch, record0.head_sha, record0.base_sha, record.input_hashes)
        } else if (record.head_sha !== record0.head_sha || record.base_sha !== record0.base_sha) {
          record = failFallback(REASON_TEMPLATES.EVIDENCE_UNVERIFIABLE, record.head_sha, record.base_sha, record.input_hashes)
        }
      }
    }
    // a derived fallback keeps the DERIVED reason (R6 mapping)
  } catch (error) {
    record = failFallback(reasonOf(error), ctx.headShaFallback ?? null, null, null)
  }
  record = withBestEffortHashes(ctx, record)
  const emission = buildEmission(record)
  // R2: the effective decision's emission — stdout record, GITHUB_STEP_SUMMARY,
  // and ALL GITHUB_OUTPUT writes — completes BEFORE the fallback-sweep spawn
  // (AC0 "on every run"; C12 seam ordering)
  if (typeof ctx.emit === 'function') ctx.emit(record, emission)
  const sweep = ctx.sweep ?? null
  if (record.decision === 'fallback' && sweep !== null) {
    let exitCode = 1
    try {
      const result = ctx.spawn(sweep.cmd, sweep.args, { stdio: 'inherit', shell: false })
      const status = result?.status
      exitCode = Number.isInteger(status) ? status : 1
    } catch {
      exitCode = 1 // sweep could not run: red the head visibly (C7)
    }
    return { record, exitCode, ...emission }
  }
  return { record, exitCode: 0, ...emission }
}

// ─── CLI (thin) ──────────────────────────────────────────────────────────────

const USAGE = 'Usage: node scripts/ci-reuse.mjs decide | verify [--sweep <command> [<args>...]]'

function parseArgs(argv) {
  const [verb, ...rest] = argv
  if (verb === 'decide' && rest.length === 0) return { verb, sweep: null }
  if (verb === 'verify') {
    if (rest.length === 0) return { verb, sweep: null }
    const [flag, ...sweepArgs] = rest
    if (flag === '--sweep' && sweepArgs.length > 0) return { verb, sweep: { cmd: sweepArgs[0], args: sweepArgs.slice(1) } }
  }
  throw new CiReuseError(REASON_TEMPLATES.CLASSIFICATION_ERROR, USAGE)
}

function envString(env, name) {
  const value = env[name]
  return typeof value === 'string' ? value : ''
}

/**
 * Real emission side (audit-only): stdout record line, GITHUB_STEP_SUMMARY,
 * and the step outputs — in that order, all of it (R2). Write failures are
 * configuration failures and red the head visibly (C7).
 */
function realEmitter(env, stdoutWrite, appendFile) {
  return (record, emission) => {
    try {
      stdoutWrite(emission.logText)
      const summaryPath = envString(env, 'GITHUB_STEP_SUMMARY')
      const outputPath = envString(env, 'GITHUB_OUTPUT')
      if (summaryPath) appendFile(summaryPath, emission.summaryText)
      if (outputPath) {
        appendFile(outputPath, [
          `decision=${record.decision}`,
          `fallback_reason=${record.fallback_reason ?? ''}`,
          `base_sha=${record.base_sha ?? ''}`,
          `head_sha=${record.head_sha ?? ''}`,
          `evidence_record=${emission.json}`,
          '',
        ].join('\n'))
      }
    } catch (cause) {
      throw new CiReuseError(REASON_TEMPLATES.CLASSIFICATION_ERROR, 'could not write decision outputs', cause)
    }
  }
}

/**
 * Thin CLI boundary (C12): `decide` and `verify` share one wiring path. Every
 * external effect flows through an injected seam (`deps`), normalized at this
 * boundary (SC #1/#2); production defaults use fetch/spawnSync/node:fs.
 */
export async function runCli(argv, env, deps = {}) {
  const { verb, sweep } = parseArgs(argv)
  // R3: inside Actions a missing output channel is a configuration failure —
  // refuse loudly (C7) instead of silently green-lighting unvalidated heads.
  // Standalone runs keep working without the channel.
  if (envString(env, 'GITHUB_ACTIONS') === 'true' && !envString(env, 'GITHUB_OUTPUT')) {
    throw new CiReuseError(REASON_TEMPLATES.CLASSIFICATION_ERROR, 'GITHUB_ACTIONS is set but GITHUB_OUTPUT is missing')
  }
  const repo = envString(env, 'GITHUB_REPOSITORY')
  const runIdText = envString(env, 'GITHUB_RUN_ID')
  const eventName = envString(env, 'GITHUB_EVENT_NAME')
  const headShaFallback = envString(env, 'GITHUB_SHA')
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo) || !/^\d+$/.test(runIdText)) {
    throw new CiReuseError(REASON_TEMPLATES.CLASSIFICATION_ERROR, 'missing GITHUB_REPOSITORY / GITHUB_RUN_ID')
  }
  let event
  try {
    const read = deps.readFile ?? readFileSync
    event = JSON.parse(read(envString(env, 'GITHUB_EVENT_PATH'), 'utf8'))
  } catch (cause) {
    event = null // decided as evidence-unverifiable downstream
    void cause
  }
  const token = envString(env, 'GITHUB_TOKEN')
  const apiBase = envString(env, 'GITHUB_API_URL') || 'https://api.github.com'
  const api = deps.api ?? (async (url, init) => {
    const response = await fetch(url, {
      ...init,
      headers: { ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      signal: AbortSignal.timeout(15000),
    })
    return { status: response.status, text: await response.text() }
  })
  const root = fileURLToPath(new URL('../', import.meta.url))
  const git = deps.git ?? ((args, opts) => spawnSync('git', args, {
    cwd: root, encoding: 'buffer', maxBuffer: 1 << 28, input: opts?.input,
  }))
  const ctx = {
    api, git, eventName, event,
    runId: Number(runIdText), repo, apiBase,
    headShaFallback: HEX40_RE.test(headShaFallback) ? headShaFallback : null,
    sweep,
    spawn: deps.spawn ?? ((cmd, args, opts) => spawnSync(cmd, args, { ...opts, cwd: root })),
    emit: deps.emit ?? realEmitter(
      env,
      deps.stdoutWrite ?? ((text) => process.stdout.write(text)),
      deps.appendFile ?? appendFileSync,
    ),
    // E10: verify re-validates the decide step's evidence_record output
    // (C12-sanctioned channel; never logs)
    evidence: envString(env, 'CI_REUSE_EVIDENCE'),
  }
  return verb === 'decide' ? await decideCore(ctx) : await verifyCore(ctx)
}

if (import.meta.main) {
  runCli(process.argv.slice(2), process.env).then((result) => {
    process.exitCode = result.exitCode
  }).catch((error) => {
    const reason = error instanceof CiReuseError ? error.reason : 'error'
    console.error(`ci-reuse failed (${sanitizeUntrusted(String(reason), 64)}); inspect the decision inputs and invocation arguments.`)
    process.exitCode = 1
  })
}
