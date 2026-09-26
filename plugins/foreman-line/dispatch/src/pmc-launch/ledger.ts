import { createHash } from 'node:crypto'
import { closeSync, lstatSync, openSync, readdirSync, realpathSync } from 'node:fs'
import { dirname, isAbsolute, join, normalize, parse, resolve } from 'node:path'
import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { pathToFileURL } from 'node:url'
import { computePmcCostV1 } from './money.js'

export type LedgerCode =
  | 'LEDGER_INPUT_INVALID'
  | 'LEDGER_LIMIT_EXCEEDED'
  | 'LEDGER_AUTHORITY_REFUSED'
  | 'LEDGER_PATH_REFUSED'
  | 'LEDGER_ALREADY_EXISTS'
  | 'LEDGER_STORAGE_MISSING'
  | 'LEDGER_IDENTITY_MISMATCH'
  | 'LEDGER_SCHEMA_UNSUPPORTED'
  | 'LEDGER_STORAGE_INVALID'
  | 'LEDGER_SETTINGS_REFUSED'
  | 'LEDGER_BUSY'
  | 'LEDGER_IO_FAILED'
  | 'LEDGER_COMMIT_UNCERTAIN'
  | 'LEDGER_SCOPE_UNKNOWN'
  | 'LEDGER_SCOPE_FROZEN'
  | 'LEDGER_REQUEST_EXISTS'
  | 'LEDGER_REQUEST_UNKNOWN'
  | 'LEDGER_REQUEST_CONFLICT'
  | 'LEDGER_STATE_REFUSED'
  | 'LEDGER_BUDGET_EXCEEDED'
  | 'LEDGER_CAPACITY_EXCEEDED'
  | 'LEDGER_OVERFLOW'
  | 'LEDGER_COST_REFUSED'
  | 'LEDGER_PROOF_REFUSED'
  | 'LEDGER_CLOCK_REFUSED'
export type LedgerResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; code: LedgerCode }>
export type BudgetScopeV1 = Readonly<{
  scopeId: string
  authorityDigest: string
  currency: 'USD'
  authorizedLimitMicroUsd: number
  workflowId: string
  accountId: string
  routingClass: string
}>
export type LedgerIdentity = Readonly<{
  ledgerId: string
  epoch: string
  initializationAuthorityDigest: string
  schemaVersion: 1
}>
export type AttemptV1 = Readonly<{
  ledgerId: string
  epoch: string
  requestId: string
  scopeId: string
  requestDigest: string
  costValueDigest: string
  maximumMicroUsd: number
  state: 'reserved' | 'consumed' | 'uncertain' | 'settled' | 'cancelled'
  actualMicroUsd: number | null
  proofRef: string | null
  proofDigest: string | null
  createdAtUtc: string
  updatedAtUtc: string
}>
export type BudgetSnapshotV1 = Readonly<{
  ledgerId: string
  epoch: string
  scope: BudgetScopeV1
  settledMicroUsd: number
  outstandingMicroUsd: number
  remainingMicroUsd: number
  frozen: boolean
  freezeReason: null | 'over-bound'
  observedAtUtc: string
  snapshotDigest: string
}>
export type PmcLedgerInitializeRequestV1 = Readonly<{
  root: string
  ledgerId: string
  epoch: string
  initializationAuthorityDigest: string
  scopes: readonly BudgetScopeV1[]
}>
export type PmcLedgerOpenRequestV1 = Readonly<{
  root: string
  expectedLedgerId: string
  expectedEpoch: string
  expectedInitializationAuthorityDigest: string
}>
export type PmcLedgerOwnerPortsV1 = Readonly<{
  clock: () => unknown
  authenticateInitialization: (request: PmcLedgerInitializeRequestV1) => unknown
}>
export type PmcLedgerTrustedPortsV1 = Readonly<{
  clock: () => unknown
  authenticateSettlement: (context: AttemptV1, observation: unknown) => unknown
  authenticateNoSendProof: (context: AttemptV1, proof: unknown) => unknown
}>
export type LocalPmcLedger = Readonly<{
  snapshot: (request: unknown) => LedgerResult<BudgetSnapshotV1>
  reserve: (request: unknown) => LedgerResult<AttemptV1>
  consume: (request: unknown) => LedgerResult<AttemptV1>
  settle: (request: unknown) => LedgerResult<AttemptV1>
  cancelWithNoSendProof: (request: unknown) => LedgerResult<AttemptV1>
}>
type Data = Record<string, unknown>
type Row = Record<string, string | number | bigint | Uint8Array | null>
const MAX = BigInt(Number.MAX_SAFE_INTEGER)
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const DIGEST = /^[a-f0-9]{64}$/
const FILE = 'pmc-budget-v1.sqlite'
const failureCodes = new Set<unknown>([
  'LEDGER_INPUT_INVALID',
  'LEDGER_LIMIT_EXCEEDED',
  'LEDGER_AUTHORITY_REFUSED',
  'LEDGER_PATH_REFUSED',
  'LEDGER_ALREADY_EXISTS',
  'LEDGER_STORAGE_MISSING',
  'LEDGER_IDENTITY_MISMATCH',
  'LEDGER_SCHEMA_UNSUPPORTED',
  'LEDGER_STORAGE_INVALID',
  'LEDGER_SETTINGS_REFUSED',
  'LEDGER_BUSY',
  'LEDGER_IO_FAILED',
  'LEDGER_COMMIT_UNCERTAIN',
  'LEDGER_SCOPE_UNKNOWN',
  'LEDGER_SCOPE_FROZEN',
  'LEDGER_REQUEST_EXISTS',
  'LEDGER_REQUEST_UNKNOWN',
  'LEDGER_REQUEST_CONFLICT',
  'LEDGER_STATE_REFUSED',
  'LEDGER_BUDGET_EXCEEDED',
  'LEDGER_CAPACITY_EXCEEDED',
  'LEDGER_OVERFLOW',
  'LEDGER_COST_REFUSED',
  'LEDGER_PROOF_REFUSED',
  'LEDGER_CLOCK_REFUSED',
])
function fail(code: LedgerCode): never {
  throw code
}
function result<T>(fn: () => T): LedgerResult<T> {
  try {
    return Object.freeze({ ok: true, value: fn() })
  } catch (e) {
    return Object.freeze({
      ok: false,
      code: failureCodes.has(e) ? (e as LedgerCode) : 'LEDGER_INPUT_INVALID',
    })
  }
}
function hash(v: unknown): string {
  return createHash('sha256').update(JSON.stringify(v)).digest('hex')
}
function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (
    !a ||
    !b ||
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    Array.isArray(a) !== Array.isArray(b)
  )
    return false
  const ak = Object.keys(a)
  const bk = Object.keys(b)
  return (
    ak.length === bk.length &&
    ak.every((k) => Object.hasOwn(b, k) && equal((a as Data)[k], (b as Data)[k]))
  )
}
function plain(v: unknown, keys: readonly string[]): Data {
  if (
    !v ||
    typeof v !== 'object' ||
    Array.isArray(v) ||
    Object.keys(v).length !== keys.length ||
    keys.some((k) => !Object.hasOwn(v, k))
  )
    fail('LEDGER_INPUT_INVALID')
  return v as Data
}
function string(v: unknown, kind: 'id' | 'digest' | 'text' = 'text'): string {
  if (typeof v !== 'string' || !v.length) fail('LEDGER_INPUT_INVALID')
  if (v.length > (kind === 'id' ? 128 : 4096)) fail('LEDGER_LIMIT_EXCEEDED')
  if ((kind === 'id' && !ID.test(v)) || (kind === 'digest' && !DIGEST.test(v)))
    fail('LEDGER_INPUT_INVALID')
  return v
}
function micro(v: unknown): number {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) fail('LEDGER_INPUT_INVALID')
  return v
}
function publicMicro(v: bigint): number {
  if (v < 0n || v > MAX) fail('LEDGER_OVERFLOW')
  return Number(v)
}
function utc(v: unknown): string {
  if (
    typeof v !== 'string' ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) ||
    !Number.isFinite(Date.parse(v)) ||
    new Date(v).toISOString() !== v
  )
    fail('LEDGER_CLOCK_REFUSED')
  return v
}
// Trusted functions are captured separately; ordinary data never carries callbacks.
function capture(input: unknown): unknown {
  let visits = 0
  let units = 0
  const active = new Set<object>()
  function copy(v: unknown, depth: number): unknown {
    if (++visits > 65536 || depth > 16) fail('LEDGER_LIMIT_EXCEEDED')
    if (typeof v === 'string') {
      units += v.length
      if (v.length > 4096 || units > 1048576) fail('LEDGER_LIMIT_EXCEEDED')
      return v
    }
    if (v === null || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)))
      return v
    if (typeof v !== 'object' || active.has(v)) fail('LEDGER_INPUT_INVALID')
    const array = Array.isArray(v)
    if (Object.getPrototypeOf(v) !== (array ? Array.prototype : Object.prototype))
      fail('LEDGER_INPUT_INVALID')
    const descriptors = Object.getOwnPropertyDescriptors(v)
    const names = Reflect.ownKeys(descriptors)
    if (visits + names.length > 65536) fail('LEDGER_LIMIT_EXCEEDED')
    active.add(v)
    const owned: Data = {}
    for (const key of names) {
      if (typeof key !== 'string') fail('LEDGER_INPUT_INVALID')
      if (array && key === 'length') continue
      visits++
      units += key.length
      if (units > 1048576 || key.length > 4096) fail('LEDGER_LIMIT_EXCEEDED')
      const d = descriptors[key]
      if (!d || !('value' in d) || !d.enumerable || key === 'then') fail('LEDGER_INPUT_INVALID')
      Object.defineProperty(owned, key, { value: copy(d.value, depth + 1), enumerable: true })
    }
    active.delete(v)
    if (!array) return Object.freeze(owned)
    const length = descriptors.length?.value
    if (
      typeof length !== 'number' ||
      names.length !== length + 1 ||
      Object.keys(owned).some((k, i) => k !== String(i))
    )
      fail('LEDGER_INPUT_INVALID')
    return Object.freeze(Object.values(owned))
  }
  return copy(input, 0)
}
function ports<T>(v: unknown, names: readonly string[]): T {
  if (!v || typeof v !== 'object' || Object.getPrototypeOf(v) !== Object.prototype)
    fail('LEDGER_INPUT_INVALID')
  const desc = Object.getOwnPropertyDescriptors(v)
  if (Reflect.ownKeys(desc).length !== names.length) fail('LEDGER_INPUT_INVALID')
  const owned: Data = {}
  for (const name of names) {
    const d = desc[name]
    if (!d?.enumerable || !('value' in d) || typeof d.value !== 'function')
      fail('LEDGER_INPUT_INVALID')
    owned[name] = d.value
  }
  return Object.freeze(owned) as T
}
function call(fn: () => unknown, code: LedgerCode): unknown {
  try {
    return capture(fn())
  } catch {
    return fail(code)
  }
}
function clock(fn: () => unknown): string {
  return utc(call(fn, 'LEDGER_CLOCK_REFUSED'))
}
function scope(v: unknown): BudgetScopeV1 {
  const r = plain(v, [
    'scopeId',
    'authorityDigest',
    'currency',
    'authorizedLimitMicroUsd',
    'workflowId',
    'accountId',
    'routingClass',
  ])
  if (r.currency !== 'USD') fail('LEDGER_INPUT_INVALID')
  return Object.freeze({
    scopeId: string(r.scopeId, 'id'),
    authorityDigest: string(r.authorityDigest, 'digest'),
    currency: 'USD',
    authorizedLimitMicroUsd: micro(r.authorizedLimitMicroUsd),
    workflowId: string(r.workflowId, 'id'),
    accountId: string(r.accountId, 'id'),
    routingClass: string(r.routingClass),
  })
}
function nativeCode(error: unknown): string | number | undefined {
  // Only native filesystem/SQLite failures reach this narrow boundary. Never format them.
  try {
    if (!error || typeof error !== 'object') return undefined
    const d = Object.getOwnPropertyDescriptors(error)
    const value = d.errcode?.value ?? d.code?.value
    return typeof value === 'string' || typeof value === 'number' ? value : undefined
  } catch {
    return undefined
  }
}
function storageError(error: unknown): never {
  if (failureCodes.has(error)) throw error
  const code = nativeCode(error)
  if (code === 5 || code === 6) fail('LEDGER_BUSY')
  if (code === 11 || code === 26) fail('LEDGER_STORAGE_INVALID')
  if (code === 'ENOENT' || code === 14) fail('LEDGER_STORAGE_MISSING')
  fail('LEDGER_IO_FAILED')
}
function path(root: string, initialization: boolean): string {
  if (
    !isAbsolute(root) ||
    root.startsWith('\\\\') ||
    root.startsWith('//') ||
    root.includes('\0') ||
    /(^|[\\/])\.\.?([\\/]|$)/.test(root) ||
    (process.platform === 'win32' && (!/^[A-Za-z]:[\\/]/.test(root) || root.slice(2).includes(':')))
  )
    fail('LEDGER_PATH_REFUSED')
  try {
    let current = resolve(root)
    while (true) {
      const stat = lstatSync(current)
      if (stat.isSymbolicLink() || !stat.isDirectory()) fail('LEDGER_PATH_REFUSED')
      if (current === parse(current).root) break
      current = dirname(current)
    }
    if (normalize(realpathSync(root)).toLowerCase() !== normalize(resolve(root)).toLowerCase())
      fail('LEDGER_PATH_REFUSED')
    const filename = join(root, FILE)
    for (const file of [filename, `${filename}-journal`, `${filename}-wal`, `${filename}-shm`]) {
      try {
        const st = lstatSync(file)
        if (st.isSymbolicLink() || !st.isFile() || st.nlink !== 1) fail('LEDGER_PATH_REFUSED')
        if (file.endsWith('-wal') || file.endsWith('-shm')) fail('LEDGER_STORAGE_INVALID')
        if (initialization) fail('LEDGER_ALREADY_EXISTS')
      } catch (e) {
        if (nativeCode(e) !== 'ENOENT') throw e
      }
    }
    if (initialization) {
      if (readdirSync(root).length) fail('LEDGER_ALREADY_EXISTS')
    } else {
      const st = lstatSync(filename)
      if (st.size < 100) fail('LEDGER_STORAGE_INVALID')
    }
    return filename
  } catch (e) {
    return storageError(e)
  }
}
const schema = [
  `CREATE TABLE ledger_meta (singleton INTEGER PRIMARY KEY CHECK(singleton=1), schemaVersion INTEGER NOT NULL CHECK(schemaVersion=1), ledgerId TEXT NOT NULL, epoch TEXT NOT NULL, initializationAuthorityDigest TEXT NOT NULL) STRICT`,
  `CREATE TABLE budget_scopes (scopeId TEXT PRIMARY KEY NOT NULL, authorityDigest TEXT NOT NULL, currency TEXT NOT NULL CHECK(currency='USD'), authorizedLimitMicroUsd INTEGER NOT NULL CHECK(authorizedLimitMicroUsd BETWEEN 0 AND 9007199254740991), workflowId TEXT NOT NULL, accountId TEXT NOT NULL, routingClass TEXT NOT NULL, frozen INTEGER NOT NULL CHECK(frozen IN (0,1)), freezeReason TEXT CHECK((frozen=0 AND freezeReason IS NULL) OR (frozen=1 AND freezeReason IS NOT NULL AND freezeReason='over-bound')), UNIQUE(workflowId,accountId,routingClass)) STRICT`,
  `CREATE TABLE attempts (requestId TEXT PRIMARY KEY NOT NULL, scopeId TEXT NOT NULL REFERENCES budget_scopes(scopeId), requestDigest TEXT NOT NULL, costValueDigest TEXT NOT NULL, priceEvidence TEXT NOT NULL, maximumMicroUsd INTEGER NOT NULL CHECK(maximumMicroUsd BETWEEN 0 AND 9007199254740991), state TEXT NOT NULL CHECK(state IN ('reserved','consumed','uncertain','settled','cancelled')), actualMicroUsd INTEGER CHECK(actualMicroUsd BETWEEN 0 AND 9007199254740991), proofRef TEXT, proofDigest TEXT, proofContent TEXT, priorUnknownProofRef TEXT, priorUnknownProofDigest TEXT, createdAtUtc TEXT NOT NULL, updatedAtUtc TEXT NOT NULL, CHECK((state='settled' AND actualMicroUsd IS NOT NULL) OR (state<>'settled' AND actualMicroUsd IS NULL)), CHECK((proofRef IS NULL AND proofDigest IS NULL AND proofContent IS NULL) OR (proofRef IS NOT NULL AND proofDigest IS NOT NULL AND proofContent IS NOT NULL))) STRICT`,
  'CREATE INDEX attempts_scope ON attempts(scopeId)',
]
function rows(db: DatabaseSync, sql: string, ...args: SQLInputValue[]): Row[] {
  const stmt = db.prepare(sql)
  stmt.setReadBigInts(true)
  return stmt.all(...args)
}
function first(db: DatabaseSync, sql: string, ...args: SQLInputValue[]): Row | undefined {
  return rows(db, sql, ...args)[0]
}
function settings(db: DatabaseSync): void {
  db.exec(
    'PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA; PRAGMA busy_timeout=1000; PRAGMA foreign_keys=ON',
  )
  for (const [name, value] of [
    ['journal_mode', 'delete'],
    ['synchronous', 3n],
    ['busy_timeout', 1000n],
    ['foreign_keys', 1n],
  ] as const) {
    if (first(db, `PRAGMA ${name}`)?.[name === 'busy_timeout' ? 'timeout' : name] !== value)
      fail('LEDGER_SETTINGS_REFUSED')
  }
}
function identity(db: DatabaseSync, expected: LedgerIdentity): void {
  if (
    !first(db, "SELECT name FROM sqlite_schema WHERE type='table' AND name='ledger_meta' LIMIT 1")
  )
    fail('LEDGER_STORAGE_INVALID')
  const meta = first(db, 'SELECT * FROM ledger_meta LIMIT 2')
  if (!meta) fail('LEDGER_STORAGE_INVALID')
  if (meta.schemaVersion !== 1n) fail('LEDGER_SCHEMA_UNSUPPORTED')
  if (
    meta.ledgerId !== expected.ledgerId ||
    meta.epoch !== expected.epoch ||
    meta.initializationAuthorityDigest !== expected.initializationAuthorityDigest
  )
    fail('LEDGER_IDENTITY_MISMATCH')
  const actual = rows(
    db,
    "SELECT sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name LIMIT 5",
  )
  if (actual.length !== schema.length || schema.some((s) => !actual.some((r) => r.sql === s)))
    fail('LEDGER_STORAGE_INVALID')
  if (first(db, 'SELECT COUNT(*) AS n FROM ledger_meta')?.n !== 1n) fail('LEDGER_STORAGE_INVALID')
  const scopes = first(db, 'SELECT COUNT(*) AS n FROM budget_scopes')?.n
  const attempts = first(db, 'SELECT COUNT(*) AS n FROM attempts')?.n
  if (
    typeof scopes !== 'bigint' ||
    scopes < 1n ||
    scopes > 256n ||
    typeof attempts !== 'bigint' ||
    attempts > 10000n
  )
    fail('LEDGER_STORAGE_INVALID')
}
function connection<T>(root: string, expected: LedgerIdentity, fn: (db: DatabaseSync) => T): T {
  let db: DatabaseSync | undefined
  let succeeded = false
  try {
    if (process.version !== 'v24.19.0') fail('LEDGER_SETTINGS_REFUSED')
    const uri = pathToFileURL(path(root, false))
    uri.search = 'mode=rw'
    db = new DatabaseSync(uri.href, {
      timeout: 1000,
      defensive: true,
      allowExtension: false,
      enableForeignKeyConstraints: true,
      enableDoubleQuotedStringLiterals: false,
    })
    identity(db, expected)
    if (first(db, 'PRAGMA quick_check(1)')?.quick_check !== 'ok') fail('LEDGER_STORAGE_INVALID')
    settings(db)
    const value = fn(db)
    succeeded = true
    return value
  } catch (e) {
    return storageError(e)
  } finally {
    if (db) {
      try {
        db.close()
      } catch {
        // Retry cleanup, but never convert failed closure into an acknowledged operation.
        try {
          db.close()
        } catch {
          /* Preserve the original failure. */
        }
        if (succeeded) fail('LEDGER_IO_FAILED')
      }
    }
  }
}
function transaction<T>(
  db: DatabaseSync,
  expected: LedgerIdentity,
  write: boolean,
  fn: () => T,
): T {
  let began = false
  try {
    db.exec(write ? 'BEGIN IMMEDIATE' : 'BEGIN')
    began = true
    identity(db, expected)
    const value = fn()
    try {
      db.exec('COMMIT')
    } catch {
      fail('LEDGER_COMMIT_UNCERTAIN')
    }
    began = false
    return value
  } finally {
    if (began) {
      try {
        db.exec('ROLLBACK')
      } catch {
        /* Commit may already have succeeded. */
      }
    }
  }
}
function getScope(db: DatabaseSync, scopeId: string): { scope: BudgetScopeV1; frozen: boolean } {
  const row = first(db, 'SELECT * FROM budget_scopes WHERE scopeId=?', scopeId)
  if (!row) fail('LEDGER_SCOPE_UNKNOWN')
  try {
    return {
      scope: scope({
        scopeId: row.scopeId,
        authorityDigest: row.authorityDigest,
        currency: row.currency,
        authorizedLimitMicroUsd: publicMicro(row.authorizedLimitMicroUsd as bigint),
        workflowId: row.workflowId,
        accountId: row.accountId,
        routingClass: row.routingClass,
      }),
      frozen: row.frozen === 1n,
    }
  } catch {
    return fail('LEDGER_STORAGE_INVALID')
  }
}
function attempt(row: Row, owner: LedgerIdentity): AttemptV1 {
  try {
    for (const field of ['requestId', 'scopeId']) string(row[field], 'id')
    for (const field of ['requestDigest', 'costValueDigest']) string(row[field], 'digest')
    if (
      typeof row.priceEvidence !== 'string' ||
      Buffer.byteLength(row.priceEvidence, 'utf8') > 16384
    )
      fail('LEDGER_STORAGE_INVALID')
    const money = computePmcCostV1(JSON.parse(row.priceEvidence))
    if (
      !money.ok ||
      money.priceEvidence.requestDigest !== row.requestDigest ||
      money.value.costValueDigest !== row.costValueDigest ||
      BigInt(money.value.maximumMicroUsd) !== row.maximumMicroUsd
    )
      fail('LEDGER_STORAGE_INVALID')
    utc(row.createdAtUtc)
    utc(row.updatedAtUtc)
    if ((row.createdAtUtc as string) > (row.updatedAtUtc as string)) fail('LEDGER_STORAGE_INVALID')
    if (row.state === 'reserved' || row.state === 'consumed') {
      if (
        row.proofRef !== null ||
        row.proofDigest !== null ||
        row.proofContent !== null ||
        row.actualMicroUsd !== null
      )
        fail('LEDGER_STORAGE_INVALID')
    } else {
      string(row.proofRef)
      string(row.proofDigest, 'digest')
      if (typeof row.proofContent !== 'string' || row.proofContent.length > 32768)
        fail('LEDGER_STORAGE_INVALID')
      const noSend = row.state === 'cancelled'
      const p = plain(capture(JSON.parse(row.proofContent)), [
        'accepted',
        'ledgerId',
        'epoch',
        'requestId',
        'requestDigest',
        'scopeId',
        'proofRef',
        'proofDigest',
        noSend ? 'noSend' : 'outcome',
      ])
      if (
        p.accepted !== true ||
        p.ledgerId !== owner.ledgerId ||
        p.epoch !== owner.epoch ||
        p.requestId !== row.requestId ||
        p.requestDigest !== row.requestDigest ||
        p.scopeId !== row.scopeId ||
        p.proofRef !== row.proofRef ||
        p.proofDigest !== row.proofDigest
      )
        fail('LEDGER_STORAGE_INVALID')
      if (noSend) {
        if (p.noSend !== true || row.actualMicroUsd !== null) fail('LEDGER_STORAGE_INVALID')
      } else {
        const known = row.state === 'settled'
        const o = plain(p.outcome, known ? ['kind', 'actualMicroUsd'] : ['kind'])
        if (
          known
            ? o.kind !== 'known' || BigInt(micro(o.actualMicroUsd)) !== row.actualMicroUsd
            : row.state !== 'uncertain' || o.kind !== 'unknown' || row.actualMicroUsd !== null
        )
          fail('LEDGER_STORAGE_INVALID')
      }
    }
    if (row.priorUnknownProofRef !== null || row.priorUnknownProofDigest !== null) {
      string(row.priorUnknownProofRef)
      string(row.priorUnknownProofDigest, 'digest')
      if (row.state !== 'settled' && row.state !== 'cancelled') fail('LEDGER_STORAGE_INVALID')
    }
  } catch {
    fail('LEDGER_STORAGE_INVALID')
  }
  return Object.freeze({
    ledgerId: owner.ledgerId,
    epoch: owner.epoch,
    requestId: row.requestId as string,
    scopeId: row.scopeId as string,
    requestDigest: row.requestDigest as string,
    costValueDigest: row.costValueDigest as string,
    maximumMicroUsd: publicMicro(row.maximumMicroUsd as bigint),
    state: row.state as AttemptV1['state'],
    actualMicroUsd: row.actualMicroUsd === null ? null : publicMicro(row.actualMicroUsd as bigint),
    proofRef: row.proofRef as string | null,
    proofDigest: row.proofDigest as string | null,
    createdAtUtc: row.createdAtUtc as string,
    updatedAtUtc: row.updatedAtUtc as string,
  })
}
function getAttempt(db: DatabaseSync, requestId: string, requestDigest: string): Row {
  const r = first(db, 'SELECT * FROM attempts WHERE requestId=?', requestId)
  if (!r) fail('LEDGER_REQUEST_UNKNOWN')
  if (r.requestDigest !== requestDigest) fail('LEDGER_REQUEST_CONFLICT')
  return r
}
function snapshot(
  db: DatabaseSync,
  owner: LedgerIdentity,
  scopeId: string,
  now: string,
): BudgetSnapshotV1 {
  const s = getScope(db, scopeId)
  const records = rows(db, 'SELECT * FROM attempts WHERE scopeId=? LIMIT 1001', scopeId)
  if (records.length > 1000) fail('LEDGER_STORAGE_INVALID')
  let settled = 0n
  let outstanding = 0n
  for (const r of records) {
    attempt(r, owner)
    if (r.state === 'settled') settled += r.actualMicroUsd as bigint
    else if (r.state !== 'cancelled') outstanding += r.maximumMicroUsd as bigint
  }
  const remaining = BigInt(s.scope.authorizedLimitMicroUsd) - settled - outstanding
  const fields = {
    ledgerId: owner.ledgerId,
    epoch: owner.epoch,
    scope: s.scope,
    settledMicroUsd: publicMicro(settled),
    outstandingMicroUsd: publicMicro(outstanding),
    remainingMicroUsd: publicMicro(remaining > 0n ? remaining : 0n),
    frozen: s.frozen,
    freezeReason: s.frozen ? ('over-bound' as const) : null,
    observedAtUtc: now,
  }
  return Object.freeze({ ...fields, snapshotDigest: hash(fields) })
}

export function initializeLocalPmcLedger(
  input: unknown,
  suppliedPorts: PmcLedgerOwnerPortsV1,
): LedgerResult<LedgerIdentity> {
  return result(() => {
    const r = plain(capture(input), [
      'root',
      'ledgerId',
      'epoch',
      'initializationAuthorityDigest',
      'scopes',
    ])
    const p = ports<PmcLedgerOwnerPortsV1>(suppliedPorts, ['clock', 'authenticateInitialization'])
    if (!Array.isArray(r.scopes) || !r.scopes.length || r.scopes.length > 256)
      fail('LEDGER_LIMIT_EXCEEDED')
    const scopes = Object.freeze(r.scopes.map(scope))
    if (
      new Set(scopes.map((s) => s.scopeId)).size !== scopes.length ||
      new Set(scopes.map((s) => JSON.stringify([s.workflowId, s.accountId, s.routingClass])))
        .size !== scopes.length
    )
      fail('LEDGER_INPUT_INVALID')
    const request = Object.freeze({
      root: string(r.root),
      ledgerId: string(r.ledgerId, 'id'),
      epoch: string(r.epoch, 'id'),
      initializationAuthorityDigest: string(r.initializationAuthorityDigest, 'digest'),
      scopes,
    })
    const owner: LedgerIdentity = Object.freeze({
      ledgerId: request.ledgerId,
      epoch: request.epoch,
      initializationAuthorityDigest: request.initializationAuthorityDigest,
      schemaVersion: 1,
    })
    clock(p.clock)
    const proof = call(() => p.authenticateInitialization(request), 'LEDGER_AUTHORITY_REFUSED')
    try {
      const a = plain(proof, [
        'accepted',
        'ledgerId',
        'epoch',
        'initializationAuthorityDigest',
        'scopesDigest',
      ])
      if (
        a.accepted !== true ||
        a.ledgerId !== owner.ledgerId ||
        a.epoch !== owner.epoch ||
        a.initializationAuthorityDigest !== owner.initializationAuthorityDigest ||
        a.scopesDigest !== hash(scopes)
      )
        fail('LEDGER_AUTHORITY_REFUSED')
    } catch {
      fail('LEDGER_AUTHORITY_REFUSED')
    }
    let db: DatabaseSync | undefined
    let began = false
    let succeeded = false
    try {
      if (process.version !== 'v24.19.0') fail('LEDGER_SETTINGS_REFUSED')
      const filename = path(request.root, true)
      try {
        closeSync(openSync(filename, 'wx', 0o600))
      } catch (e) {
        if (nativeCode(e) === 'EEXIST') fail('LEDGER_ALREADY_EXISTS')
        throw e
      }
      const uri = pathToFileURL(filename)
      uri.search = 'mode=rw'
      db = new DatabaseSync(uri.href, {
        timeout: 1000,
        defensive: true,
        allowExtension: false,
        enableForeignKeyConstraints: true,
        enableDoubleQuotedStringLiterals: false,
      })
      settings(db)
      db.exec('BEGIN IMMEDIATE')
      began = true
      for (const sql of schema) db.exec(sql)
      db.prepare('INSERT INTO ledger_meta VALUES (1,1,?,?,?)').run(
        owner.ledgerId,
        owner.epoch,
        owner.initializationAuthorityDigest,
      )
      const insert = db.prepare('INSERT INTO budget_scopes VALUES (?,?,?,?,?,?,?,0,NULL)')
      for (const s of scopes)
        insert.run(
          s.scopeId,
          s.authorityDigest,
          s.currency,
          s.authorizedLimitMicroUsd,
          s.workflowId,
          s.accountId,
          s.routingClass,
        )
      try {
        db.exec('COMMIT')
      } catch {
        fail('LEDGER_COMMIT_UNCERTAIN')
      }
      began = false
      succeeded = true
      return owner
    } catch (e) {
      return storageError(e)
    } finally {
      if (began && db) {
        try {
          db.exec('ROLLBACK')
        } catch {
          /* Never repair or delete an interrupted initialization. */
        }
      }
      if (db) {
        try {
          db.close()
        } catch {
          try {
            db.close()
          } catch {
            /* Preserve the original failure. */
          }
          if (succeeded) fail('LEDGER_IO_FAILED')
        }
      }
    }
  })
}

export function createLocalPmcLedger(
  input: unknown,
  suppliedPorts: PmcLedgerTrustedPortsV1,
): LedgerResult<LocalPmcLedger> {
  return result(() => {
    const r = plain(capture(input), [
      'root',
      'expectedLedgerId',
      'expectedEpoch',
      'expectedInitializationAuthorityDigest',
    ])
    const root = string(r.root)
    const owner: LedgerIdentity = Object.freeze({
      ledgerId: string(r.expectedLedgerId, 'id'),
      epoch: string(r.expectedEpoch, 'id'),
      initializationAuthorityDigest: string(r.expectedInitializationAuthorityDigest, 'digest'),
      schemaVersion: 1,
    })
    const p = ports<PmcLedgerTrustedPortsV1>(suppliedPorts, [
      'clock',
      'authenticateSettlement',
      'authenticateNoSendProof',
    ])
    connection(root, owner, () => undefined)
    const run = <T>(write: boolean, fn: (db: DatabaseSync) => T): T =>
      connection(root, owner, (db) => transaction(db, owner, write, () => fn(db)))
    const reconcile = (input: unknown, noSend: boolean): LedgerResult<AttemptV1> =>
      result(() => {
        const q = plain(capture(input), [
          'requestId',
          'requestDigest',
          noSend ? 'proof' : 'observation',
        ])
        const requestId = string(q.requestId, 'id')
        const requestDigest = string(q.requestDigest, 'digest')
        const context = run(false, (db) => attempt(getAttempt(db, requestId, requestDigest), owner))
        const raw = call(
          () =>
            noSend
              ? p.authenticateNoSendProof(context, q.proof)
              : p.authenticateSettlement(context, q.observation),
          'LEDGER_PROOF_REFUSED',
        )
        let proof: Data
        let actual: number | null = null
        let kind: 'unknown' | 'known' | 'no-send' = 'no-send'
        try {
          const a = plain(raw, [
            'accepted',
            'ledgerId',
            'epoch',
            'requestId',
            'requestDigest',
            'scopeId',
            'proofRef',
            'proofDigest',
            noSend ? 'noSend' : 'outcome',
          ])
          if (
            a.accepted !== true ||
            a.ledgerId !== owner.ledgerId ||
            a.epoch !== owner.epoch ||
            a.requestId !== requestId ||
            a.requestDigest !== requestDigest ||
            a.scopeId !== context.scopeId
          )
            fail('LEDGER_PROOF_REFUSED')
          proof = {
            accepted: true,
            ledgerId: owner.ledgerId,
            epoch: owner.epoch,
            requestId,
            requestDigest,
            scopeId: context.scopeId,
            proofRef: string(a.proofRef),
            proofDigest: string(a.proofDigest, 'digest'),
          }
          if (noSend) {
            if (a.noSend !== true) fail('LEDGER_PROOF_REFUSED')
            proof.noSend = true
          } else {
            if (!a.outcome || typeof a.outcome !== 'object') fail('LEDGER_PROOF_REFUSED')
            const o = plain(
              a.outcome,
              (a.outcome as Data).kind === 'known' ? ['kind', 'actualMicroUsd'] : ['kind'],
            )
            if (o.kind !== 'known' && o.kind !== 'unknown') fail('LEDGER_PROOF_REFUSED')
            kind = o.kind
            actual = kind === 'known' ? micro(o.actualMicroUsd) : null
            proof.outcome = kind === 'known' ? { kind, actualMicroUsd: actual } : { kind }
          }
        } catch {
          return fail('LEDGER_PROOF_REFUSED')
        }
        const content = JSON.stringify(proof)
        const now = clock(p.clock)
        return run(true, (db) => {
          const row = getAttempt(db, requestId, requestDigest)
          if (
            row.scopeId !== context.scopeId ||
            row.costValueDigest !== context.costValueDigest ||
            row.maximumMicroUsd !== BigInt(context.maximumMicroUsd)
          )
            fail('LEDGER_REQUEST_CONFLICT')
          if (now < (row.updatedAtUtc as string)) fail('LEDGER_CLOCK_REFUSED')
          if (row.proofRef === proof.proofRef || row.proofDigest === proof.proofDigest) {
            if (row.proofContent === content) return attempt(row, owner)
            fail('LEDGER_PROOF_REFUSED')
          }
          if (
            row.priorUnknownProofRef === proof.proofRef ||
            row.priorUnknownProofDigest === proof.proofDigest
          )
            fail('LEDGER_STATE_REFUSED')
          const used = first(
            db,
            'SELECT requestId FROM attempts WHERE (proofRef=? OR proofDigest=? OR priorUnknownProofRef=? OR priorUnknownProofDigest=?) AND requestId<>? LIMIT 1',
            proof.proofRef as string,
            proof.proofDigest as string,
            proof.proofRef as string,
            proof.proofDigest as string,
            requestId,
          )
          if (used) fail('LEDGER_PROOF_REFUSED')
          if (
            row.state === 'settled' ||
            row.state === 'cancelled' ||
            (!noSend && row.state === 'reserved') ||
            (kind === 'unknown' && row.state === 'uncertain')
          )
            fail('LEDGER_STATE_REFUSED')
          const state = noSend ? 'cancelled' : kind === 'known' ? 'settled' : 'uncertain'
          const priorRef = row.state === 'uncertain' ? row.proofRef : row.priorUnknownProofRef
          const priorDigest =
            row.state === 'uncertain' ? row.proofDigest : row.priorUnknownProofDigest
          db.prepare(
            'UPDATE attempts SET state=?,actualMicroUsd=?,proofRef=?,proofDigest=?,proofContent=?,priorUnknownProofRef=?,priorUnknownProofDigest=?,updatedAtUtc=? WHERE requestId=? AND state=?',
          ).run(
            state,
            actual,
            proof.proofRef as string,
            proof.proofDigest as string,
            content,
            priorRef as string | null,
            priorDigest as string | null,
            now,
            requestId,
            row.state as string,
          )
          if (actual !== null && BigInt(actual) > (row.maximumMicroUsd as bigint))
            db.prepare(
              "UPDATE budget_scopes SET frozen=1,freezeReason='over-bound' WHERE scopeId=?",
            ).run(row.scopeId as string)
          return attempt(getAttempt(db, requestId, requestDigest), owner)
        })
      })
    return Object.freeze({
      snapshot: (request: unknown) =>
        result(() => {
          const q = plain(capture(request), ['scopeId'])
          const scopeId = string(q.scopeId, 'id')
          const now = clock(p.clock)
          return run(false, (db) => snapshot(db, owner, scopeId, now))
        }),
      reserve: (request: unknown) =>
        result(() => {
          const q = plain(capture(request), [
            'requestId',
            'scopeId',
            'requestDigest',
            'costValue',
            'priceEvidence',
          ])
          const requestId = string(q.requestId, 'id')
          const scopeId = string(q.scopeId, 'id')
          const requestDigest = string(q.requestDigest, 'digest')
          if (Buffer.byteLength(JSON.stringify(q.priceEvidence), 'utf8') > 16384)
            fail('LEDGER_LIMIT_EXCEEDED')
          const cost = computePmcCostV1(q.priceEvidence)
          if (
            !cost.ok ||
            cost.priceEvidence.requestDigest !== requestDigest ||
            !equal(q.costValue, cost.value)
          )
            fail('LEDGER_COST_REFUSED')
          const now = clock(p.clock)
          return run(true, (db) => {
            const existing = first(
              db,
              'SELECT requestDigest,costValueDigest,scopeId FROM attempts WHERE requestId=?',
              requestId,
            )
            if (existing)
              fail(
                existing.requestDigest !== requestDigest ||
                  existing.costValueDigest !== cost.value.costValueDigest ||
                  existing.scopeId !== scopeId
                  ? 'LEDGER_REQUEST_CONFLICT'
                  : 'LEDGER_REQUEST_EXISTS',
              )
            const s = snapshot(db, owner, scopeId, now)
            if (s.frozen) fail('LEDGER_SCOPE_FROZEN')
            if (
              BigInt(s.settledMicroUsd) +
                BigInt(s.outstandingMicroUsd) +
                BigInt(cost.value.maximumMicroUsd) >
              BigInt(s.scope.authorizedLimitMicroUsd)
            )
              fail('LEDGER_BUDGET_EXCEEDED')
            const total = first(db, 'SELECT COUNT(*) AS n FROM attempts')?.n as bigint
            const count = first(db, 'SELECT COUNT(*) AS n FROM attempts WHERE scopeId=?', scopeId)
              ?.n as bigint
            if (total >= 10000n || count >= 1000n) fail('LEDGER_CAPACITY_EXCEEDED')
            db.prepare(
              "INSERT INTO attempts VALUES (?,?,?,?,?,?,'reserved',NULL,NULL,NULL,NULL,NULL,NULL,?,?)",
            ).run(
              requestId,
              scopeId,
              requestDigest,
              cost.value.costValueDigest,
              JSON.stringify(cost.priceEvidence),
              cost.value.maximumMicroUsd,
              now,
              now,
            )
            return attempt(getAttempt(db, requestId, requestDigest), owner)
          })
        }),
      consume: (request: unknown) =>
        result(() => {
          const q = plain(capture(request), ['requestId', 'requestDigest'])
          const requestId = string(q.requestId, 'id')
          const requestDigest = string(q.requestDigest, 'digest')
          const now = clock(p.clock)
          return run(true, (db) => {
            const row = getAttempt(db, requestId, requestDigest)
            if (row.state !== 'reserved') fail('LEDGER_STATE_REFUSED')
            if (getScope(db, row.scopeId as string).frozen) fail('LEDGER_SCOPE_FROZEN')
            // A frozen/overspent scope cannot turn a previously reserved amount into send authority.
            const s = snapshot(db, owner, row.scopeId as string, now)
            if (
              BigInt(s.settledMicroUsd) + BigInt(s.outstandingMicroUsd) >
              BigInt(s.scope.authorizedLimitMicroUsd)
            )
              fail('LEDGER_BUDGET_EXCEEDED')
            if (now < (row.updatedAtUtc as string)) fail('LEDGER_CLOCK_REFUSED')
            db.prepare(
              "UPDATE attempts SET state='consumed',updatedAtUtc=? WHERE requestId=? AND state='reserved'",
            ).run(now, requestId)
            return attempt(getAttempt(db, requestId, requestDigest), owner)
          })
        }),
      settle: (request: unknown) => reconcile(request, false),
      cancelWithNoSendProof: (request: unknown) => reconcile(request, true),
    })
  })
}
