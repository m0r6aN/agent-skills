/**
 * Deterministic routing-decision cache (HRO-P2, hybrid-routing-optimization
 * charter D4): indexed exact reuse of prior decisions for identical routing
 * inputs under an identical policy.
 *
 * Invariants (charter D4; violations are design errors, not options):
 * - A cached decision NEVER grants authority. It is a reusable CHOICE, not an
 *   execution event (D5): every recall re-checks the policy digest and the
 *   caller's dynamic inputs before the record may be used.
 * - Cache keys cover every input that changes eligibility or ranking:
 *   schema version, policy content digest, task class, and data
 *   classification. Key separation is tested.
 * - Records are validated on read. Corrupt, incompatible, expired, or
 *   digest-mismatched records are TYPED MISSES with diagnostic events — never
 *   errors and never partial answers.
 * - Store failures (unavailable, concurrently opened, unwritable) degrade to
 *   the same deterministic policy evaluator path via typed misses. The cache
 *   can never make routing weaker, only faster.
 *
 * Storage (charter D6: check the existing runtime and persistence
 * abstractions; a new dependency needs concrete justification): the plugin's
 * established persistence convention is validated JSON documents written
 * atomically (tmp + rename), as `receipts/` and the routing receipts do. Node
 * 24's built-in `node:sqlite` is still flagged experimental on the pinned
 * runtime (24.7.0), so the shipped store is a bounded JSON store that
 * delivers D4's safety properties structurally: exact-key lookup (bounded
 * queries), map-keyed records (uniqueness by construction), tmp+rename
 * upserts (atomicity), an explicit lockfile (concurrency), an explicit
 * open/close lifecycle, and a max-entries bound (bounded growth). Any store
 * honoring {@link RoutingCacheStore} can replace it — including a SQLite one
 * if the runtime stabilizes.
 */
import { createHash } from 'node:crypto'
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname } from 'node:path'
import { Ajv, type ValidateFunction } from 'ajv'
import type { TransportRequirements } from '../../routing-policy/src/index.js'
import type {
  ExpertiseArea,
  InputModality,
  ThinkingLevelName,
} from '../../routing-policy/src/types.js'
import { INPUT_MODALITIES } from '../../routing-policy/src/types.js'
import type { DispatchCandidateEvaluation } from './routing-eval/index.js'

// ─── Records and diagnostics ─────────────────────────────────────────────────

/** Bumped when the record shape changes; mismatched records are typed misses.
 * MRC-05 (C3.5): bumped for the effective-requirements key parts. */
export const ROUTING_CACHE_SCHEMA_VERSION = 2

export interface RoutingCacheRecord {
  /** Canonical key: sha256 over the canonical key parts (see canonicalRoutingCacheKey). */
  readonly key: string
  readonly schemaVersion: number
  /** sha256 of the exact policy YAML bytes the decision was made under. */
  readonly policyDigest: string
  readonly createdAtUtc: string
  readonly expiresAtUtc: string
  readonly resolvedModelId: string
  readonly resolvedTier: string
  readonly transportRequirements: TransportRequirements
  /**
   * RCM-P4A R2 (C3.4/D7): the cold walk's route explanation, stored so a warm
   * hit can replay it into its receipt — D7 binds every decision's evidence,
   * cache-enabled callers included (ruling C: the cache is a memo of the
   * evaluator's own output, `evaluations` included). Optional so pre-R2
   * records still validate.
   */
  readonly evaluations?: readonly DispatchCandidateEvaluation[]
  /**
   * Content seal: sha256 over the canonical record fields (see
   * computeRoutingCacheRecordSeal). Detects corruption and record-mixing on
   * read; it is not a secret-keyed MAC and does not claim adversarial
   * tamper-resistance (no local mechanism can against a hostile store).
   */
  readonly seal: string
}

export type CacheDiagnosticKind =
  | 'hit'
  | 'miss'
  | 'expired'
  | 'corrupt-record'
  | 'policy-changed'
  | 'schema-changed'
  | 'store-unavailable'
  | 'store-conflict'
  | 'invalidated'
  | 'evicted'
  | 'remembered'

export interface CacheDiagnostic {
  readonly kind: CacheDiagnosticKind
  readonly key: string
  readonly detail?: string
}

// ─── Store contract ──────────────────────────────────────────────────────────

/**
 * D4's storage semantics: bounded exact queries, atomic upserts, uniqueness by
 * key, explicit lifecycle. Implementations MUST throw on infrastructure
 * failure (the facade converts every throw into a typed miss) and MUST NOT
 * return partially written or unvalidated records.
 */
export interface RoutingCacheStore {
  get(key: string): RoutingCacheRecord | undefined
  upsert(record: RoutingCacheRecord): void
  invalidateAll(): void
  close(): void
}

interface StoreDocument {
  readonly version: number
  readonly records: Record<string, RoutingCacheRecord>
}

const MAX_ENTRIES_DEFAULT = 1024

/**
 * Thrown by {@link FileRoutingCacheStore} when another store instance holds
 * the lockfile. Explicit concurrency handling (D4): one writer per cache file,
 * never silent concurrent read-modify-write.
 */
export class CacheStoreConflictError extends Error {
  constructor(path: string) {
    super(`routing cache store is already open elsewhere: ${path}`)
    this.name = 'CacheStoreConflictError'
  }
}

/**
 * Boundary validator for persisted/reused record bytes (single schema, single
 * compilation; validated outputs are consumed as {@link RoutingCacheRecord}).
 */
const cacheRecordSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'key',
    'schemaVersion',
    'policyDigest',
    'createdAtUtc',
    'expiresAtUtc',
    'resolvedModelId',
    'resolvedTier',
    'transportRequirements',
    'seal',
  ],
  properties: {
    key: { type: 'string' },
    schemaVersion: { type: 'integer' },
    policyDigest: { type: 'string' },
    createdAtUtc: { type: 'string' },
    expiresAtUtc: { type: 'string' },
    resolvedModelId: { type: 'string' },
    resolvedTier: { type: 'string' },
    seal: { type: 'string' },
    // R2: optional (pre-R2 records still validate); closed-world otherwise.
    evaluations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['model', 'eligible', 'refusals'],
        properties: {
          model: { type: 'string' },
          eligible: { type: 'boolean' },
          refusals: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'detail'],
              properties: {
                name: { type: 'string' },
                detail: { type: 'string' },
              },
            },
          },
        },
      },
    },
    transportRequirements: {
      type: 'object',
      additionalProperties: false,
      required: ['data_collection', 'zdr'],
      properties: {
        data_collection: { enum: ['allow', 'deny'] },
        zdr: { type: 'boolean' },
      },
    },
  },
} as const

const validateCacheRecord: ValidateFunction = new Ajv({ allErrors: true }).compile(
  cacheRecordSchema,
)

/**
 * Bounded JSON store: map-keyed records (uniqueness by construction), atomic
 * tmp+rename upserts, lockfile lifecycle. A missing or unreadable document is
 * an empty store; a corrupt document is quarantined to `<path>.corrupt` and
 * treated as empty — the cache never trusts unparseable bytes.
 */
export class FileRoutingCacheStore implements RoutingCacheStore {
  readonly path: string
  readonly maxEntries: number
  #lockPath: string
  #lockFd: number | undefined
  #records: Map<string, RoutingCacheRecord>
  #closed = false

  constructor(path: string, options: { maxEntries?: number } = {}) {
    this.path = path
    this.maxEntries = options.maxEntries ?? MAX_ENTRIES_DEFAULT
    this.#lockPath = `${path}.lock`
    mkdirSync(dirname(path), { recursive: true })
    try {
      this.#lockFd = openSync(this.#lockPath, 'wx')
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new CacheStoreConflictError(path)
      }
      throw err
    }
    this.#records = new Map()
    this.#load()
  }

  #load(): void {
    if (!existsSync(this.path)) return
    let doc: unknown
    try {
      doc = JSON.parse(readFileSync(this.path, 'utf8'))
    } catch {
      // Corrupt document: quarantine the bytes (kept for diagnosis) and start
      // empty. D4: corrupt records are misses, never trusted content.
      try {
        renameSync(this.path, `${this.path}.corrupt`)
      } catch {
        // Best effort; the stale bytes stay unread and untrusted.
      }
      return
    }
    if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) return
    const parsed = doc as Partial<StoreDocument>
    if (parsed.version !== ROUTING_CACHE_SCHEMA_VERSION) return
    const records = parsed.records
    if (typeof records !== 'object' || records === null || Array.isArray(records)) return
    for (const [key, value] of Object.entries(records)) {
      if (validateCacheRecord(value) && (value as RoutingCacheRecord).key === key) {
        this.#records.set(key, value as RoutingCacheRecord)
      }
    }
  }

  #persist(): void {
    if (this.#closed) throw new Error('routing cache store is closed')
    const doc: StoreDocument = {
      version: ROUTING_CACHE_SCHEMA_VERSION,
      records: Object.fromEntries(this.#records),
    }
    const tmp = `${this.path}.tmp-${process.pid}-${Date.now()}`
    writeFileSync(tmp, JSON.stringify(doc), 'utf8')
    renameSync(tmp, this.path)
  }

  get(key: string): RoutingCacheRecord | undefined {
    if (this.#closed) throw new Error('routing cache store is closed')
    return this.#records.get(key)
  }

  upsert(record: RoutingCacheRecord): void {
    if (this.#closed) throw new Error('routing cache store is closed')
    this.#records.set(record.key, record)
    // D4 bounded growth: evict oldest-created entries beyond the bound.
    while (this.#records.size > this.maxEntries) {
      let oldestKey: string | undefined
      let oldestCreated = Number.POSITIVE_INFINITY
      for (const [key, value] of this.#records) {
        const created = Date.parse(value.createdAtUtc)
        if (created < oldestCreated) {
          oldestCreated = created
          oldestKey = key
        }
      }
      if (oldestKey === undefined) break
      this.#records.delete(oldestKey)
    }
    this.#persist()
  }

  invalidateAll(): void {
    if (this.#closed) throw new Error('routing cache store is closed')
    this.#records.clear()
    this.#persist()
  }

  close(): void {
    if (this.#closed) return
    this.#closed = true
    if (this.#lockFd !== undefined) {
      closeSync(this.#lockFd)
      this.#lockFd = undefined
    }
    try {
      unlinkSync(this.#lockPath)
    } catch {
      // Lock already gone; nothing to release.
    }
  }
}

// ─── Canonical keys (D4: canonical encoding, tested key separation) ──────────

export interface RoutingCacheKeyParts {
  readonly schemaVersion: number
  readonly policyDigest: string
  readonly routing_class: string
  readonly data_classification: string
  /**
   * MRC-05 (C3.5): the effective requirements — the decision is a function of
   * them, so they participate in the canonical key in canonical form
   * (`required_inputs` in the fixed `INPUT_MODALITIES` order;
   * `canonicalRoutingCacheKey` sorts). A value produced under different
   * requirements can never be recalled into a different request.
   */
  readonly required_inputs?: readonly InputModality[]
  readonly required_thinking_level?: ThinkingLevelName
  readonly required_context_tokens?: number
  readonly expertise?: ExpertiseArea
}

/** Canonical JSON (sorted object keys) → sha256 hex. */
export function canonicalRoutingCacheKey(parts: RoutingCacheKeyParts): string {
  const canonicalInputs =
    parts.required_inputs === undefined
      ? undefined
      : [...parts.required_inputs].sort(
          (a, b) => INPUT_MODALITIES.indexOf(a) - INPUT_MODALITIES.indexOf(b),
        )
  return createHash('sha256')
    .update(
      JSON.stringify({
        data_classification: parts.data_classification,
        expertise: parts.expertise,
        policyDigest: parts.policyDigest,
        required_context_tokens: parts.required_context_tokens,
        required_inputs: canonicalInputs,
        required_thinking_level: parts.required_thinking_level,
        routing_class: parts.routing_class,
        schemaVersion: parts.schemaVersion,
      }),
      'utf8',
    )
    .digest('hex')
}

/**
 * Content seal over the canonical record fields (everything except the seal
 * itself). Formula pin: sha256 of canonical JSON with sorted keys.
 */
export function computeRoutingCacheRecordSeal(
  record: Omit<RoutingCacheRecord, 'seal'> & { seal?: string },
): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        createdAtUtc: record.createdAtUtc,
        evaluations: record.evaluations,
        expiresAtUtc: record.expiresAtUtc,
        key: record.key,
        policyDigest: record.policyDigest,
        resolvedModelId: record.resolvedModelId,
        resolvedTier: record.resolvedTier,
        schemaVersion: record.schemaVersion,
        transportRequirements: {
          data_collection: record.transportRequirements.data_collection,
          zdr: record.transportRequirements.zdr,
        },
      }),
      'utf8',
    )
    .digest('hex')
}

// ─── Facade ─────────────────────────────────────────────────────────────────

export interface RoutingDecisionCacheOptions {
  /** Time-to-live for a record, in seconds. Required; there is no immortal record. */
  readonly ttlSeconds: number
  /** Injectable clock for deterministic expiry tests. */
  readonly now?: () => Date
}

interface RecallOutcome {
  readonly kind: CacheDiagnosticKind
  readonly record?: RoutingCacheRecord
  readonly detail?: string
}

/**
 * The evaluator-facing facade. Every lookup revalidates: schema version,
 * policy digest, record shape (ajv), and TTL — then re-checks the caller's
 * dynamic inputs before the record may be used (the caller re-runs its own
 * dynamic gates; the cache never vouches for them). All store failures become
 * typed misses with diagnostics; `recall` never throws.
 */
export class RoutingDecisionCache {
  readonly diagnostics: CacheDiagnostic[] = []
  #store: RoutingCacheStore
  #ttlSeconds: number
  #now: () => Date

  constructor(store: RoutingCacheStore, options: RoutingDecisionCacheOptions) {
    if (!(options.ttlSeconds > 0)) throw new Error('ttlSeconds must be > 0')
    this.#store = store
    this.#ttlSeconds = options.ttlSeconds
    this.#now = options.now ?? (() => new Date())
  }

  /** Exact recall with full revalidation; every outcome is a recorded typed event. */
  recall(parts: RoutingCacheKeyParts): RoutingCacheRecord | undefined {
    const key = canonicalRoutingCacheKey(parts)
    let outcome: RecallOutcome = { kind: 'miss' }
    if (parts.schemaVersion !== ROUTING_CACHE_SCHEMA_VERSION) {
      outcome = { kind: 'schema-changed' }
    } else {
      let stored: RoutingCacheRecord | undefined
      let storeError: unknown
      try {
        stored = this.#store.get(key)
      } catch (err) {
        storeError = err
      }
      const expiresAt = stored === undefined ? Number.NaN : Date.parse(stored.expiresAtUtc)
      if (storeError !== undefined) {
        outcome = { kind: 'store-unavailable', detail: String(storeError) }
      } else if (stored === undefined) {
        outcome = { kind: 'miss' }
      } else if (!validateCacheRecord(stored)) {
        outcome = {
          kind: 'corrupt-record',
          detail: `schema-invalid: ${JSON.stringify(validateCacheRecord.errors ?? [])}`,
        }
      } else if (stored.key !== key) {
        outcome = { kind: 'corrupt-record', detail: 'key-mismatch' }
      } else if (computeRoutingCacheRecordSeal(stored) !== stored.seal) {
        outcome = { kind: 'corrupt-record', detail: 'seal-mismatch' }
      } else if (stored.schemaVersion !== ROUTING_CACHE_SCHEMA_VERSION) {
        outcome = { kind: 'schema-changed' }
      } else if (stored.policyDigest !== parts.policyDigest) {
        outcome = { kind: 'policy-changed' }
      } else if (!Number.isFinite(expiresAt) || expiresAt <= this.#now().getTime()) {
        outcome = { kind: 'expired' }
      } else {
        outcome = { kind: 'hit', record: stored }
      }
    }
    this.diagnostics.push(
      outcome.detail === undefined
        ? { kind: outcome.kind, key }
        : { kind: outcome.kind, key, detail: outcome.detail },
    )
    return outcome.record
  }

  /** Best-effort write; store failures are diagnostics, never errors. */
  remember(
    decision: {
      readonly resolvedModelId: string
      readonly resolvedTier: string
      readonly transportRequirements: TransportRequirements
      readonly evaluations?: readonly DispatchCandidateEvaluation[]
    },
    parts: RoutingCacheKeyParts,
  ): void {
    const key = canonicalRoutingCacheKey(parts)
    const now = this.#now().getTime()
    const unsealed = {
      key,
      schemaVersion: ROUTING_CACHE_SCHEMA_VERSION,
      policyDigest: parts.policyDigest,
      createdAtUtc: new Date(now).toISOString(),
      expiresAtUtc: new Date(now + this.#ttlSeconds * 1000).toISOString(),
      resolvedModelId: decision.resolvedModelId,
      resolvedTier: decision.resolvedTier,
      transportRequirements: decision.transportRequirements,
      ...(decision.evaluations !== undefined ? { evaluations: decision.evaluations } : {}),
    }
    const record: RoutingCacheRecord = {
      ...unsealed,
      seal: computeRoutingCacheRecordSeal(unsealed),
    }
    try {
      this.#store.upsert(record)
      this.diagnostics.push({ kind: 'remembered', key })
    } catch (err) {
      this.diagnostics.push({ kind: 'store-unavailable', key, detail: String(err) })
    }
  }

  /** Best-effort full invalidation (e.g. after an explicit policy cutover). */
  invalidateAll(): void {
    try {
      this.#store.invalidateAll()
      this.diagnostics.push({ kind: 'invalidated', key: '*' })
    } catch (err) {
      this.diagnostics.push({ kind: 'store-unavailable', key: '*', detail: String(err) })
    }
  }
}
