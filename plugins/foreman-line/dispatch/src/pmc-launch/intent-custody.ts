import { randomUUID } from 'node:crypto'
import { closeSync, lstatSync, openSync, readdirSync, realpathSync } from 'node:fs'
import { dirname, isAbsolute, join, normalize, parse, resolve } from 'node:path'
import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { pathToFileURL } from 'node:url'
import type { Claim, EvidenceRef } from '../../../routing-policy/src/index.js'
import type {
  BeginProposal,
  IdentityProjection,
  IntentAuthority,
  IntentOwnerV1,
  OwnerCode,
  OwnerIdentity,
  OwnerPorts,
  ProofRecord,
  Result,
  RetainedState,
  Selection,
  Slot,
} from './intent-custody-types.js'

type Data = Record<string, unknown>
type Row = Record<string, string | number | bigint | Uint8Array | null>
type Stored = {
  authority: IntentAuthority
  state: RetainedState
  revision: number
  identity: IdentityProjection
}
const FILE = 'pmc-intent-v1.sqlite'
const FILE_LIMIT = 134217728
const codes = new Set<unknown>([
  'INPUT_REFUSED',
  'BOUNDS_REFUSED',
  'AUTHORITY_REFUSED',
  'PATH_REFUSED',
  'ALREADY_EXISTS',
  'STORAGE_MISSING',
  'STORAGE_INVALID',
  'IDENTITY_MISMATCH',
  'SETTINGS_REFUSED',
  'CAPACITY_REFUSED',
  'BUSY',
  'IO_FAILED',
  'COMMIT_UNCERTAIN',
  'INTENT_REFUSED',
  'STATE_REFUSED',
  'PROOF_REFUSED',
])
function fail(code: OwnerCode): never {
  throw code
}
function result<T>(fn: () => T): Result<T> {
  try {
    return Object.freeze({ ok: true, value: fn() })
  } catch (error) {
    return Object.freeze({
      ok: false,
      code: codes.has(error) ? (error as OwnerCode) : 'INPUT_REFUSED',
    })
  }
}
function nativeCode(error: unknown): unknown {
  try {
    if (error && typeof error === 'object') {
      const d = Object.getOwnPropertyDescriptors(error)
      return d.errcode?.value ?? d.code?.value
    }
  } catch {
    /* Do not inspect thrown values further. */
  }
  return undefined
}
function io<T>(fn: () => T): T {
  try {
    return fn()
  } catch (error) {
    if (codes.has(error)) throw error
    const code = nativeCode(error)
    if (code === 5 || code === 6) fail('BUSY')
    if (code === 13) fail('CAPACITY_REFUSED')
    if (code === 11 || code === 26) fail('STORAGE_INVALID')
    if (code === 'EEXIST') fail('ALREADY_EXISTS')
    if (code === 'ENOENT' || code === 14) fail('STORAGE_MISSING')
    fail('IO_FAILED')
  }
}
// Capture only own enumerable ordinary data. Aliases pay their full expanded cost.
function capture(input: unknown): unknown {
  let visits = 0,
    units = 0
  const active = new Set<object>()
  function copy(value: unknown, depth: number): unknown {
    if (++visits > 65536 || depth > 16) fail('BOUNDS_REFUSED')
    if (typeof value === 'string') {
      units += value.length
      if (value.length > 2048 || units > 1048576) fail('BOUNDS_REFUSED')
      return value
    }
    if (
      value === null ||
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value))
    )
      return value
    if (!value || typeof value !== 'object' || active.has(value)) fail('INPUT_REFUSED')
    const array = Array.isArray(value)
    if (Object.getPrototypeOf(value) !== (array ? Array.prototype : Object.prototype))
      fail('INPUT_REFUSED')
    // Read only the array length before enumeration. Each child costs both a key
    // visit and a value visit, including every occurrence of an alias.
    const lengthDescriptor = array ? Object.getOwnPropertyDescriptor(value, 'length') : undefined
    const length = lengthDescriptor?.value
    if (
      array &&
      (!lengthDescriptor ||
        !('value' in lengthDescriptor) ||
        !Number.isSafeInteger(length) ||
        length < 0)
    )
      fail('INPUT_REFUSED')
    if (array && visits + 2 * length > 65536) fail('BOUNDS_REFUSED')
    const names = Reflect.ownKeys(value)
    if (visits + 2 * (names.length - (array ? 1 : 0)) > 65536) fail('BOUNDS_REFUSED')
    let index = 0
    for (const key of names) {
      if (typeof key !== 'string') fail('INPUT_REFUSED')
      if (array && key === 'length') continue
      if (array && key !== String(index++)) fail('INPUT_REFUSED')
      units += key.length
      if (units > 1048576 || key.length > 2048) fail('BOUNDS_REFUSED')
    }
    if (array && (names.length !== length + 1 || index !== length)) fail('INPUT_REFUSED')
    active.add(value)
    const owned: Data = {}
    for (const key of names) {
      if (typeof key !== 'string') fail('INPUT_REFUSED')
      if (array && key === 'length') continue
      visits++
      const d = Object.getOwnPropertyDescriptor(value, key)
      if (!d || !('value' in d) || !d.enumerable || key === 'then') fail('INPUT_REFUSED')
      Object.defineProperty(owned, key, { value: copy(d.value, depth + 1), enumerable: true })
    }
    active.delete(value)
    if (!array) return Object.freeze(owned)
    if (
      typeof length !== 'number' ||
      names.length !== length + 1 ||
      Object.keys(owned).some((k, i) => k !== String(i))
    )
      fail('INPUT_REFUSED')
    return Object.freeze(Object.values(owned))
  }
  return copy(input, 0)
}
function plain(v: unknown, keys: readonly string[]): Data {
  if (
    !v ||
    typeof v !== 'object' ||
    Array.isArray(v) ||
    Object.keys(v).length !== keys.length ||
    keys.some((k) => !Object.hasOwn(v, k))
  )
    fail('INPUT_REFUSED')
  return v as Data
}
function str(v: unknown, kind: 'id' | 'digest' | 'text' = 'text'): string {
  if (
    typeof v !== 'string' ||
    !v.length ||
    v.length > 2048 ||
    (kind === 'id' && !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v)) ||
    (kind === 'digest' && !/^[a-f0-9]{64}$/.test(v))
  )
    fail('INPUT_REFUSED')
  return v
}
function uint(v: unknown): number {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) fail('INPUT_REFUSED')
  return v
}
function utc(v: unknown): string {
  const s = str(v)
  if (
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s) ||
    !Number.isFinite(Date.parse(s)) ||
    new Date(s).toISOString() !== s
  )
    fail('INPUT_REFUSED')
  return s
}
function one<T extends string | boolean | number>(v: unknown, values: readonly T[]): T {
  if (!values.includes(v as T)) fail('INPUT_REFUSED')
  return v as T
}
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`
  if (v && typeof v === 'object')
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical((v as Data)[k])}`)
      .join(',')}}`
  return JSON.stringify(v)
}
function equal(a: unknown, b: unknown): boolean {
  return canonical(a) === canonical(b)
}
function identity(v: unknown): OwnerIdentity {
  const r = plain(v, [
    'storeId',
    'ledgerId',
    'epoch',
    'initializationAuthorityDigest',
    'schemaVersion',
  ])
  str(r.storeId, 'id')
  str(r.ledgerId, 'id')
  str(r.epoch, 'id')
  str(r.initializationAuthorityDigest, 'digest')
  one(r.schemaVersion, [1])
  return r as OwnerIdentity
}
function template(v: unknown): IntentAuthority['routeTemplate'] {
  const r = plain(v, [
    'version',
    'workflowId',
    'taskId',
    'lane',
    'subRole',
    'routingClass',
    'dataClass',
    'requirements',
  ])
  one(r.version, ['pmc/v1'])
  str(r.workflowId, 'id')
  str(r.taskId, 'id')
  one(r.lane, ['L3', 'L4', 'L5'])
  one(r.dataClass, ['public'])
  one(r.subRole, [
    'coordinator',
    'shaper',
    'architect',
    'adversarial-reviewer',
    'verifier',
    'security-auditor',
    'builder-complex',
    'builder-standard',
    'builder-economy',
    'routing-classifier',
  ])
  one(r.routingClass, [
    'architecture/risk',
    'review/security',
    'implementation/complex',
    'standard-feature',
    'implementation/standard',
    'boilerplate',
    'routing/classification',
  ])
  const n = plain(r.requirements, [
    'toolUse',
    'structuredOutput',
    'reasoning',
    'thinkingLevel',
    'inputModalities',
    'requiredContextTokens',
    'requiredOutputTokens',
    'maximumInputTokens',
    'maximumOutputTokens',
    'rankingTokens',
  ])
  for (const k of ['toolUse', 'structuredOutput', 'reasoning']) one(n[k], [true, false])
  one(n.thinkingLevel, ['off', 'minimal', 'low', 'medium', 'high', 'xhigh'])
  if (!Array.isArray(n.inputModalities) || n.inputModalities.length > 2) fail('INPUT_REFUSED')
  for (const m of n.inputModalities) one(m, ['text', 'image'])
  for (const k of [
    'requiredContextTokens',
    'requiredOutputTokens',
    'maximumInputTokens',
    'maximumOutputTokens',
  ])
    uint(n[k])
  if (n.rankingTokens !== null) {
    const x = plain(n.rankingTokens, ['input', 'output'])
    uint(x.input)
    uint(x.output)
  }
  return r as IntentAuthority['routeTemplate']
}
function authority(v: unknown): IntentAuthority {
  const r = plain(v, [
    'intentRef',
    'businessAuthorityRef',
    'businessAuthorityDigest',
    'originId',
    'routeTemplate',
    'policyDigest',
    'configDigest',
    'scope',
    'authorityObservedAtUtc',
    'authorityExpiresAtUtc',
    'fallbackAllowed',
  ])
  for (const k of ['intentRef', 'businessAuthorityRef', 'originId']) str(r[k], 'id')
  for (const k of ['businessAuthorityDigest', 'policyDigest', 'configDigest']) str(r[k], 'digest')
  const t = template(r.routeTemplate),
    s = plain(r.scope, [
      'scopeId',
      'authorityDigest',
      'currency',
      'authorizedLimitMicroUsd',
      'workflowId',
      'accountId',
      'routingClass',
    ])
  for (const k of ['scopeId', 'workflowId', 'accountId']) str(s[k], 'id')
  str(s.authorityDigest, 'digest')
  one(s.currency, ['USD'])
  uint(s.authorizedLimitMicroUsd)
  str(s.routingClass)
  if (s.workflowId !== t.workflowId || s.routingClass !== t.routingClass) fail('AUTHORITY_REFUSED')
  if (utc(r.authorityObservedAtUtc) > utc(r.authorityExpiresAtUtc)) fail('AUTHORITY_REFUSED')
  one(r.fallbackAllowed, [true, false])
  return r as IntentAuthority
}
function portRecord(v: unknown, names: string[]): Data {
  if (!v || typeof v !== 'object' || Object.getPrototypeOf(v) !== Object.prototype)
    fail('INPUT_REFUSED')
  const d = Object.getOwnPropertyDescriptors(v)
  if (Reflect.ownKeys(d).length !== names.length) fail('INPUT_REFUSED')
  const owned: Data = {}
  for (const k of names) {
    const p = d[k]
    if (!p?.enumerable || !('value' in p) || typeof p.value !== 'function') fail('INPUT_REFUSED')
    owned[k] = p.value
  }
  return Object.freeze(owned)
}
function callback(fn: () => unknown, code: OwnerCode = 'AUTHORITY_REFUSED'): unknown {
  try {
    return capture(fn())
  } catch {
    return fail(code)
  }
}
function accepted(v: unknown, keys: string[], code: OwnerCode): Data {
  const r = v as Data
  if (r?.accepted !== true) fail(code)
  return plain(r, ['accepted', ...keys])
}
function evidence(
  v: unknown,
  a: IntentAuthority,
  requestDigest: string,
  bindingId: string | null,
  now?: string,
): EvidenceRef {
  const r = plain(v, [
    'receiptId',
    'receiptDigest',
    'sourceRef',
    'sourceDigest',
    'policyDigest',
    'configDigest',
    'requestDigest',
    'lane',
    'bindingId',
    'evidenceState',
    'observedAtUtc',
    'expiresAtUtc',
  ])
  str(r.receiptId, 'id')
  str(r.receiptDigest, 'digest')
  str(r.sourceRef)
  str(r.sourceDigest, 'digest')
  one(r.evidenceState, ['static-conformance', 'live-availability', 'model-quality'])
  const observed = utc(r.observedAtUtc),
    expires = utc(r.expiresAtUtc)
  if (
    r.policyDigest !== a.policyDigest ||
    r.configDigest !== a.configDigest ||
    r.requestDigest !== requestDigest ||
    r.lane !== a.routeTemplate.lane ||
    r.bindingId !== bindingId ||
    observed > expires ||
    expires > a.authorityExpiresAtUtc ||
    (now !== undefined &&
      (observed > now ||
        expires < now ||
        now < a.authorityObservedAtUtc ||
        now > a.authorityExpiresAtUtc))
  )
    fail('AUTHORITY_REFUSED')
  return r as EvidenceRef
}
function quality(
  v: unknown,
  a: IntentAuthority,
  requestDigest: string,
  bindingId: string,
  now?: string,
): Claim<number> {
  if (v && typeof v === 'object' && (v as Data).status === 'unknown') {
    plain(v, ['status'])
    return v as Claim<number>
  }
  const r = plain(v, ['status', 'value', 'evidence'])
  one(r.status, ['supplied'])
  if (typeof r.value !== 'number' || !Number.isFinite(r.value)) fail('INPUT_REFUSED')
  const e = evidence(r.evidence, a, requestDigest, bindingId, now)
  if (e.evidenceState !== 'model-quality') fail('AUTHORITY_REFUSED')
  return r as Claim<number>
}
function selection(
  v: unknown,
  a: IntentAuthority,
  requestDigest: string,
  slot: number,
  now?: string,
): Selection {
  const r = plain(v, [
    'decisionDigest',
    'wireDigest',
    'bindingId',
    'provider',
    'matrixRole',
    'primaryQuality',
    'scopeId',
    'costValueDigest',
    'maximumMicroUsd',
  ])
  for (const k of ['decisionDigest', 'wireDigest', 'costValueDigest']) str(r[k], 'digest')
  const binding = str(r.bindingId)
  one(r.provider, ['opencode', 'openrouter'])
  one(r.matrixRole, ['primary', 'fallback'])
  quality(r.primaryQuality, a, requestDigest, binding, now)
  uint(r.maximumMicroUsd)
  if (r.scopeId !== a.scope.scopeId || (slot === 1 && r.matrixRole !== 'fallback'))
    fail('PROOF_REFUSED')
  return r as Selection
}
function proof(
  v: unknown,
  a: IntentAuthority,
  ids: IdentityProjection,
  expected: OwnerIdentity,
  index: number,
  slot: Exclude<Slot, { state: 'unused' }>,
  kind: string,
): ProofRecord {
  const r = plain(v, ['proofRef', 'proofDigest', 'ledger'])
  str(r.proofRef, 'id')
  str(r.proofDigest, 'digest')
  const selected = 'selected' in slot ? slot.selected : null
  if (r.ledger === null) {
    if (kind !== 'closed-refused' && kind !== 'terminal-no-send') fail('PROOF_REFUSED')
    return r as ProofRecord
  }
  if (!selected || kind === 'closed-refused') fail('PROOF_REFUSED')
  const l = plain(r.ledger, [
    'ledgerId',
    'epoch',
    'requestId',
    'scopeId',
    'requestDigest',
    'costValueDigest',
    'maximumMicroUsd',
    'state',
    'actualMicroUsd',
    'proofRef',
    'proofDigest',
    'createdAtUtc',
    'updatedAtUtc',
  ])
  if (
    l.ledgerId !== expected.ledgerId ||
    l.epoch !== expected.epoch ||
    l.requestId !== ids.requestIds[index] ||
    l.scopeId !== a.scope.scopeId ||
    l.requestDigest !== slot.requestDigest ||
    l.costValueDigest !== selected.costValueDigest ||
    l.maximumMicroUsd !== selected.maximumMicroUsd
  )
    fail('PROOF_REFUSED')
  const state =
    kind === 'terminal-no-send' ? 'cancelled' : kind === 'uncertain' ? 'uncertain' : 'settled'
  if (l.state !== state) fail('PROOF_REFUSED')
  if (state === 'settled') uint(l.actualMicroUsd)
  else if (l.actualMicroUsd !== null) fail('PROOF_REFUSED')
  str(l.proofRef, 'id')
  str(l.proofDigest, 'digest')
  if (utc(l.createdAtUtc) > utc(l.updatedAtUtc)) fail('PROOF_REFUSED')
  return r as ProofRecord
}
function validateState(
  state: unknown,
  a: IntentAuthority,
  ids: IdentityProjection,
  expected: OwnerIdentity,
  revision: number,
): RetainedState {
  const r = plain(state, ['slots'])
  if (!Array.isArray(r.slots) || r.slots.length !== 2) fail('STORAGE_INVALID')
  let mutations = 0
  r.slots.forEach((v: unknown, index: number) => {
    if (!v || typeof v !== 'object') fail('STORAGE_INVALID')
    const s = v as Data
    if (s.state === 'unused') {
      plain(s, ['state'])
      return
    }
    str(s.requestDigest, 'digest')
    if (s.state === 'pending' || s.state === 'held') {
      plain(
        s,
        s.state === 'pending'
          ? ['state', 'requestDigest', 'selected']
          : ['state', 'requestDigest', 'selected', 'reason'],
      )
      if (s.selected !== null) selection(s.selected, a, s.requestDigest as string, index)
      if (s.state === 'held')
        one(s.reason, ['proof-refused', 'reconciliation-incomplete', 'controller-failure'])
      mutations += 1 + (s.selected === null ? 0 : 1) + (s.state === 'held' ? 1 : 0)
    } else if (s.state === 'closed-refused') {
      plain(s, ['state', 'requestDigest', 'proof'])
      proof(
        s.proof,
        a,
        ids,
        expected,
        index,
        s as Exclude<Slot, { state: 'unused' }>,
        'closed-refused',
      )
      mutations += 2
    } else {
      one(s.state, ['terminal-no-send', 'terminal-failed-settled', 'succeeded', 'uncertain'])
      plain(s, ['state', 'requestDigest', 'selected', 'proof'])
      selection(s.selected, a, s.requestDigest as string, index)
      proof(
        s.proof,
        a,
        ids,
        expected,
        index,
        s as Exclude<Slot, { state: 'unused' }>,
        s.state as string,
      )
      mutations += 3
    }
  })
  const [first, second] = r.slots as [Slot, Slot]
  if (second.state !== 'unused' && (!a.fallbackAllowed || !eligiblePrior(first)))
    fail('STORAGE_INVALID')
  if (revision !== mutations) fail('STORAGE_INVALID')
  return r as RetainedState
}
function eligiblePrior(
  slot: Slot,
): slot is Extract<
  Slot,
  { state: 'terminal-no-send' | 'terminal-failed-settled' | 'succeeded' | 'uncertain' }
> {
  return (
    (slot.state === 'terminal-no-send' || slot.state === 'terminal-failed-settled') &&
    slot.selected.matrixRole === 'primary'
  )
}
function beginRequest(
  v: unknown,
  r: Stored,
  now: string,
): { proposal: BeginProposal; index: 0 | 1 } {
  const p = plain(v, ['intentRef', 'request', 'computedRequestDigest']),
    q = plain(p.request, [
      'version',
      'workflowId',
      'taskId',
      'episodeId',
      'requestId',
      'requestDigest',
      'lane',
      'subRole',
      'routingClass',
      'dataClass',
      'requirements',
      'attempt',
    ])
  const { episodeId, requestId, requestDigest, attempt, ...t } = q
  template(t)
  str(requestDigest, 'digest')
  str(p.computedRequestDigest, 'digest')
  if (
    p.intentRef !== r.authority.intentRef ||
    episodeId !== r.identity.episodeId ||
    requestDigest !== p.computedRequestDigest ||
    !equal(t, r.authority.routeTemplate)
  )
    fail('INTENT_REFUSED')
  const index = r.identity.requestIds.indexOf(requestId as string)
  if (
    index < 0 ||
    r.state.slots.some((s) =>
      ['pending', 'held', 'uncertain', 'closed-refused', 'succeeded'].includes(s.state),
    ) ||
    r.state.slots.some((s) => 'selected' in s && s.selected?.matrixRole === 'fallback')
  )
    fail('STATE_REFUSED')
  if (index === 0) {
    if (r.state.slots.some((s) => s.state !== 'unused')) fail('STATE_REFUSED')
    const a = plain(attempt, ['kind'])
    one(a.kind, ['initial'])
  } else {
    const prior = r.state.slots[0]
    if (
      !r.authority.fallbackAllowed ||
      !eligiblePrior(prior) ||
      r.state.slots[1].state !== 'unused'
    )
      fail('STATE_REFUSED')
    const a = plain(attempt, [
      'kind',
      'priorRequestId',
      'priorDecisionDigest',
      'priorRequestDigest',
      'primaryBindingId',
      'priorDisposition',
      'primaryQuality',
    ])
    one(a.kind, ['fallback'])
    if (
      a.priorRequestId !== r.identity.requestIds[0] ||
      a.priorDecisionDigest !== prior.selected.decisionDigest ||
      a.priorRequestDigest !== prior.requestDigest ||
      a.primaryBindingId !== prior.selected.bindingId ||
      !equal(a.primaryQuality, prior.selected.primaryQuality)
    )
      fail('PROOF_REFUSED')
    const disposition = plain(a.priorDisposition, ['status', 'value', 'evidence'])
    one(disposition.status, ['supplied'])
    if (disposition.value !== prior.state) fail('PROOF_REFUSED')
    evidence(disposition.evidence, r.authority, prior.requestDigest, prior.selected.bindingId, now)
    if (
      quality(a.primaryQuality, r.authority, prior.requestDigest, prior.selected.bindingId, now)
        .status !== 'supplied'
    )
      fail('PROOF_REFUSED')
  }
  return { proposal: p as BeginProposal, index: index === 0 ? 0 : 1 }
}
function path(root: string, initialize: boolean): string {
  if (
    !isAbsolute(root) ||
    root.startsWith('\\\\') ||
    root.startsWith('//') ||
    root.includes('\0') ||
    /(^|[\\/])\.\.?([\\/]|$)/.test(root) ||
    (process.platform === 'win32' && (!/^[A-Za-z]:[\\/]/.test(root) || root.slice(2).includes(':')))
  )
    fail('PATH_REFUSED')
  return io(() => {
    if (normalize(root) !== resolve(root)) fail('PATH_REFUSED')
    let current = resolve(root)
    while (true) {
      const st = lstatSync(current)
      if (!st.isDirectory() || st.isSymbolicLink()) fail('PATH_REFUSED')
      if (current === parse(current).root) break
      current = dirname(current)
    }
    if (normalize(realpathSync(root)) !== normalize(resolve(root))) fail('PATH_REFUSED')
    const filename = join(root, FILE)
    for (const name of readdirSync(root)) {
      if (!name.startsWith(FILE)) continue
      if (name !== FILE && name !== `${FILE}-journal`) fail('STORAGE_INVALID')
      const st = lstatSync(join(root, name))
      if (!st.isFile() || st.isSymbolicLink() || st.nlink !== 1) fail('PATH_REFUSED')
      if (initialize) fail('ALREADY_EXISTS')
      if (st.size > FILE_LIMIT + (name.endsWith('-journal') ? 1048576 : 0)) fail('CAPACITY_REFUSED')
    }
    if (!initialize && lstatSync(filename).size < 100) fail('STORAGE_INVALID')
    return filename
  })
}
const schema = [
  'CREATE TABLE owner_meta (singleton INTEGER PRIMARY KEY CHECK(singleton=1), schemaVersion INTEGER NOT NULL CHECK(schemaVersion=1), storeId TEXT NOT NULL, ledgerId TEXT NOT NULL, epoch TEXT NOT NULL, initializationAuthorityDigest TEXT NOT NULL) STRICT',
  'CREATE TABLE intents (intentRef TEXT PRIMARY KEY NOT NULL, businessAuthorityRef TEXT NOT NULL UNIQUE, episodeId TEXT NOT NULL UNIQUE, request1 TEXT NOT NULL UNIQUE, request2 TEXT NOT NULL UNIQUE, revision INTEGER NOT NULL CHECK(revision BETWEEN 0 AND 8), authorityJson TEXT NOT NULL CHECK(length(CAST(authorityJson AS BLOB))<=65536), stateJson TEXT NOT NULL CHECK(length(CAST(stateJson AS BLOB))<=524288), CHECK(request1<>request2)) STRICT',
]
function rows(db: DatabaseSync, sql: string, ...args: SQLInputValue[]): Row[] {
  const s = db.prepare(sql)
  s.setReadBigInts(true)
  return s.all(...args)
}
function settings(db: DatabaseSync, fresh: boolean): void {
  if (fresh) db.exec('PRAGMA page_size=4096')
  db.exec(
    'PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA; PRAGMA busy_timeout=1000; PRAGMA foreign_keys=ON; PRAGMA trusted_schema=OFF; PRAGMA max_page_count=32768',
  )
  for (const [name, value] of [
    ['journal_mode', 'delete'],
    ['synchronous', 3n],
    ['busy_timeout', 1000n],
    ['foreign_keys', 1n],
    ['trusted_schema', 0n],
    ['page_size', 4096n],
    ['max_page_count', 32768n],
  ] as const) {
    if (rows(db, `PRAGMA ${name}`)[0]?.[name === 'busy_timeout' ? 'timeout' : name] !== value)
      fail('SETTINGS_REFUSED')
  }
}
function connect<T>(root: string, fn: (db: DatabaseSync) => T, write = false): T {
  return io(() => {
    if (process.version !== 'v24.19.0') fail('SETTINGS_REFUSED')
    const url = pathToFileURL(path(root, false))
    url.search = 'mode=rw'
    const db = new DatabaseSync(url.href, {
      defensive: true,
      allowExtension: false,
      enableForeignKeyConstraints: true,
      enableDoubleQuotedStringLiterals: false,
      timeout: 1000,
    })
    let succeeded = false
    try {
      settings(db, false)
      const value = fn(db)
      succeeded = true
      return value
    } finally {
      try {
        db.close()
      } catch {
        if (succeeded) fail(write ? 'COMMIT_UNCERTAIN' : 'IO_FAILED')
      }
    }
  })
}
function transaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE')
  try {
    const value = fn()
    try {
      db.exec('COMMIT')
    } catch {
      fail('COMMIT_UNCERTAIN')
    }
    return value
  } finally {
    if (db.isTransaction) {
      try {
        db.exec('ROLLBACK')
      } catch {
        /* Retain original refusal. */
      }
    }
  }
}
function boundedJson(value: unknown, cap: number): string {
  const s = canonical(value)
  if (Buffer.byteLength(s) > cap) fail('BOUNDS_REFUSED')
  return s
}
function uniqueBatch(records: Stored[]): void {
  const ids = new Set<string>(),
    refs = new Set<string>(),
    tuples = new Set<string>()
  for (const r of records) {
    const a = r.authority,
      t = a.routeTemplate,
      tuple = canonical([a.originId, t.workflowId, t.taskId, t.lane])
    if (refs.has(a.businessAuthorityRef) || tuples.has(tuple)) fail('AUTHORITY_REFUSED')
    refs.add(a.businessAuthorityRef)
    tuples.add(tuple)
    for (const id of [a.intentRef, r.identity.episodeId, ...r.identity.requestIds]) {
      if (ids.has(id)) fail('AUTHORITY_REFUSED')
      ids.add(id)
    }
  }
}
function stored(row: Row, expected: OwnerIdentity): Stored {
  if (
    typeof row.authorityJson !== 'string' ||
    Buffer.byteLength(row.authorityJson) > 65536 ||
    typeof row.stateJson !== 'string' ||
    Buffer.byteLength(row.stateJson) > 524288 ||
    typeof row.revision !== 'bigint' ||
    row.revision < 0n ||
    row.revision > 8n
  )
    fail('STORAGE_INVALID')
  const a = authority(capture(JSON.parse(row.authorityJson)))
  if (a.intentRef !== row.intentRef || a.businessAuthorityRef !== row.businessAuthorityRef)
    fail('STORAGE_INVALID')
  const ids = Object.freeze({
    intentRef: a.intentRef,
    episodeId: str(row.episodeId, 'id'),
    requestIds: Object.freeze([str(row.request1, 'id'), str(row.request2, 'id')]) as readonly [
      string,
      string,
    ],
  })
  const s = validateState(
    capture(JSON.parse(row.stateJson)),
    a,
    ids,
    expected,
    Number(row.revision),
  )
  if (row.authorityJson !== canonical(a) || row.stateJson !== canonical(s)) fail('STORAGE_INVALID')
  return { authority: a, state: s, revision: Number(row.revision), identity: ids }
}
function validate(db: DatabaseSync, expected: OwnerIdentity): Stored[] {
  try {
    const actual = rows(db, 'SELECT name,type,sql FROM sqlite_schema ORDER BY name LIMIT 8')
    const tables = actual.filter((r) => r.type === 'table')
    if (
      actual.length !== 7 ||
      tables.length !== 2 ||
      schema.some((s) => !tables.some((r) => r.sql === s)) ||
      actual.some(
        (r) =>
          r.type !== 'table' &&
          (r.type !== 'index' ||
            typeof r.name !== 'string' ||
            !r.name.startsWith('sqlite_autoindex_intents_') ||
            r.sql !== null),
      )
    )
      fail('STORAGE_INVALID')
    const indexes = rows(db, 'PRAGMA index_list(intents)')
    if (indexes.length !== 5 || indexes.some((r) => r.unique !== 1n || r.partial !== 0n))
      fail('STORAGE_INVALID')
    for (const [i, column] of [
      'intentRef',
      'businessAuthorityRef',
      'episodeId',
      'request1',
      'request2',
    ].entries()) {
      const name = `sqlite_autoindex_intents_${i + 1}`
      const index = indexes.find((r) => r.name === name)
      if (index?.origin !== (i === 0 ? 'pk' : 'u')) fail('STORAGE_INVALID')
      const fields = rows(db, `PRAGMA index_info(${name})`)
      if (
        fields.length !== 1 ||
        fields[0]?.seqno !== 0n ||
        fields[0]?.cid !== BigInt(i) ||
        fields[0]?.name !== column
      )
        fail('STORAGE_INVALID')
    }
    for (const name of ['owner_meta', 'intents']) {
      const info = rows(db, `PRAGMA table_info(${name})`)
      const names =
        name === 'owner_meta'
          ? [
              'singleton',
              'schemaVersion',
              'storeId',
              'ledgerId',
              'epoch',
              'initializationAuthorityDigest',
            ]
          : [
              'intentRef',
              'businessAuthorityRef',
              'episodeId',
              'request1',
              'request2',
              'revision',
              'authorityJson',
              'stateJson',
            ]
      if (
        info.length !== names.length ||
        info.some(
          (r, i) =>
            r.name !== names[i] ||
            r.cid !== BigInt(i) ||
            r.pk !== (i === 0 ? 1n : 0n) ||
            r.dflt_value !== null ||
            r.notnull !== (name === 'owner_meta' && i === 0 ? 0n : 1n) ||
            r.type !==
              ((name === 'owner_meta' && i < 2) || (name === 'intents' && i === 5)
                ? 'INTEGER'
                : 'TEXT'),
        )
      )
        fail('STORAGE_INVALID')
    }
    if (rows(db, 'PRAGMA quick_check(1)')[0]?.quick_check !== 'ok') fail('STORAGE_INVALID')
    const meta = rows(db, 'SELECT * FROM owner_meta LIMIT 2')
    if (meta.length !== 1 || meta[0]?.singleton !== 1n || meta[0].schemaVersion !== 1n)
      fail('STORAGE_INVALID')
    for (const k of ['storeId', 'ledgerId', 'epoch', 'initializationAuthorityDigest'] as const)
      if (meta[0][k] !== expected[k]) fail('IDENTITY_MISMATCH')
    const records = rows(
      db,
      `SELECT intentRef,businessAuthorityRef,episodeId,request1,request2,revision,
      CASE WHEN length(CAST(authorityJson AS BLOB))<=65536 THEN authorityJson ELSE NULL END AS authorityJson,
      CASE WHEN length(CAST(stateJson AS BLOB))<=524288 THEN stateJson ELSE NULL END AS stateJson
      FROM intents ORDER BY intentRef LIMIT 129`,
    ).map((r) => stored(r, expected))
    if (records.length < 1 || records.length > 128) fail('STORAGE_INVALID')
    uniqueBatch(records)
    return records
  } catch (e) {
    if (e === 'IDENTITY_MISMATCH' || e === 'BUSY') throw e
    fail('STORAGE_INVALID')
  }
}
const initializing = new Set<string>()
export function initializeIntentOwnerV1(
  input: unknown,
  setupPorts: unknown,
): Result<readonly IdentityProjection[]> {
  let guard: string | undefined
  try {
    return result(() => {
      const r = plain(capture(input), ['root', 'identity', 'intents']),
        root = str(r.root),
        expected = identity(r.identity)
      if (initializing.has(root)) fail('STATE_REFUSED')
      initializing.add(root)
      guard = root
      const p = portRecord(setupPorts, ['authenticateSetup']) as {
        authenticateSetup: (proposal: unknown) => unknown
      }
      if (!Array.isArray(r.intents) || r.intents.length < 1 || r.intents.length > 128)
        fail('CAPACITY_REFUSED')
      const authorities = r.intents.map(authority)
      accepted(
        callback(() => p.authenticateSetup(r)),
        [],
        'AUTHORITY_REFUSED',
      )
      const records = authorities.map((a) => ({
        authority: a,
        state: { slots: [{ state: 'unused' }, { state: 'unused' }] } as RetainedState,
        revision: 0,
        identity: {
          intentRef: a.intentRef,
          episodeId: io(() => randomUUID()),
          requestIds: [io(() => randomUUID()), io(() => randomUUID())] as readonly [string, string],
        },
      }))
      uniqueBatch(records)
      const file = path(root, true)
      io(() => {
        const fd = openSync(file, 'wx', 0o600)
        closeSync(fd)
      })
      // The file is exclusively ours but empty until the first SQLite connection.
      io(() => {
        if (process.version !== 'v24.19.0') fail('SETTINGS_REFUSED')
        const url = pathToFileURL(file)
        url.search = 'mode=rw'
        const db = new DatabaseSync(url.href, {
          defensive: true,
          allowExtension: false,
          enableForeignKeyConstraints: true,
          enableDoubleQuotedStringLiterals: false,
          timeout: 1000,
        })
        let committed = false
        try {
          settings(db, true)
          transaction(db, () => {
            for (const sql of schema) db.exec(sql)
            db.prepare('INSERT INTO owner_meta VALUES (1,1,?,?,?,?)').run(
              expected.storeId,
              expected.ledgerId,
              expected.epoch,
              expected.initializationAuthorityDigest,
            )
            for (const x of records)
              db.prepare('INSERT INTO intents VALUES (?,?,?,?,?,0,?,?)').run(
                x.authority.intentRef,
                x.authority.businessAuthorityRef,
                x.identity.episodeId,
                ...x.identity.requestIds,
                boundedJson(x.authority, 65536),
                boundedJson(x.state, 524288),
              )
            validate(db, expected)
          })
          committed = true
        } finally {
          try {
            db.close()
          } catch {
            if (committed) fail('COMMIT_UNCERTAIN')
          }
        }
      })
      return capture(records.map((r) => r.identity)) as readonly IdentityProjection[]
    })
  } finally {
    if (guard !== undefined) initializing.delete(guard)
  }
}
const lifecycle = new WeakMap<object, () => void>()
export function openIntentOwnerV1(
  input: unknown,
  trustedPorts: unknown,
): Result<{ owner: IntentOwnerV1; identities: readonly IdentityProjection[] }> {
  return result(() => {
    const r = plain(capture(input), ['root', 'expectedIdentity']),
      root = str(r.root),
      expected = identity(r.expectedIdentity)
    const ports = portRecord(trustedPorts, [
      'clock',
      'authenticateOrigin',
      'authenticateSelection',
      'authenticateCompletion',
    ]) as OwnerPorts
    const records = connect(root, (db) => validate(db, expected))
    type ClaimState = { row: Stored; index: 0 | 1 }
    const claims = new WeakMap<object, ClaimState>(),
      consumed = new WeakSet<object>(),
      active = new Set<string>(),
      quarantine = new Set<string>()
    let closed = false
    function guarded<T>(id: string, fn: () => T): T {
      if (closed || active.has(id) || quarantine.has(id)) fail('STATE_REFUSED')
      active.add(id)
      try {
        return fn()
      } catch (e) {
        if (e === 'COMMIT_UNCERTAIN') quarantine.add(id)
        throw e
      } finally {
        active.delete(id)
      }
    }
    function time(): string {
      try {
        return utc(callback(() => ports.clock()))
      } catch {
        return fail('AUTHORITY_REFUSED')
      }
    }
    function read(id: string): Stored {
      const row = connect(root, (db) =>
        validate(db, expected).find((x) => x.authority.intentRef === id),
      )
      if (!row) fail('INTENT_REFUSED')
      return row
    }
    function write(before: Stored, state: RetainedState): Stored {
      if (closed) fail('STATE_REFUSED')
      const revision = before.revision + 1
      validateState(state, before.authority, before.identity, expected, revision)
      connect(
        root,
        (db) =>
          transaction(db, () => {
            const current = validate(db, expected).find(
              (x) => x.authority.intentRef === before.authority.intentRef,
            )
            if (!current || !equal(current, before)) fail('STATE_REFUSED')
            const changes = db
              .prepare(
                'UPDATE intents SET stateJson=?, revision=? WHERE intentRef=? AND revision=?',
              )
              .run(
                boundedJson(state, 524288),
                revision,
                before.authority.intentRef,
                before.revision,
              ).changes
            if (changes !== 1 && changes !== 1n) fail('STATE_REFUSED')
          }),
        true,
      )
      return { ...before, state: capture(state) as RetainedState, revision }
    }
    function withSlot(row: Stored, index: 0 | 1, slot: Slot): RetainedState {
      return { slots: row.state.slots.map((s, i) => (i === index ? slot : s)) as [Slot, Slot] }
    }
    function mutate(claim: object, capability: object, finish: boolean): Result<null> {
      return result(() => {
        const c = claims.get(claim)
        if (!c || !capability || typeof capability !== 'object' || consumed.has(capability))
          fail('PROOF_REFUSED')
        return guarded(c.row.authority.intentRef, () => {
          const row = read(c.row.authority.intentRef),
            slot = row.state.slots[c.index]
          if (!equal(row, c.row) || slot.state !== 'pending' || (!finish && slot.selected !== null))
            fail('STATE_REFUSED')
          const now = time()
          if (
            now < row.authority.authorityObservedAtUtc ||
            now > row.authority.authorityExpiresAtUtc
          )
            fail('AUTHORITY_REFUSED')
          let next: Slot
          if (!finish) {
            const answer = accepted(
              callback(
                () => ports.authenticateSelection(row.authority, slot.requestDigest, capability),
                'PROOF_REFUSED',
              ),
              ['selection'],
              'PROOF_REFUSED',
            )
            next = {
              ...slot,
              selected: selection(
                answer.selection,
                row.authority,
                slot.requestDigest,
                c.index,
                now,
              ),
            }
          } else {
            const answer = accepted(
              callback(
                () => ports.authenticateCompletion(row.authority, slot, capability),
                'PROOF_REFUSED',
              ),
              ['kind', 'proof', 'reason'],
              'PROOF_REFUSED',
            )
            const kind = one(answer.kind, [
              'closed-refused',
              'terminal-no-send',
              'terminal-failed-settled',
              'succeeded',
              'uncertain',
              'held',
            ])
            if (kind === 'held') {
              if (answer.proof !== null) fail('PROOF_REFUSED')
              next = {
                ...slot,
                state: 'held',
                reason: one(answer.reason, [
                  'proof-refused',
                  'reconciliation-incomplete',
                  'controller-failure',
                ]),
              }
            } else {
              if (
                answer.reason !== null ||
                (slot.selected === null ? kind !== 'closed-refused' : kind === 'closed-refused')
              )
                fail('PROOF_REFUSED')
              const p = proof(
                answer.proof,
                row.authority,
                row.identity,
                expected,
                c.index,
                slot,
                kind,
              )
              if (kind === 'closed-refused')
                next = { state: kind, requestDigest: slot.requestDigest, proof: p }
              else {
                if (slot.selected === null) fail('PROOF_REFUSED')
                next = {
                  state: kind,
                  requestDigest: slot.requestDigest,
                  selected: slot.selected,
                  proof: p,
                }
              }
            }
          }
          try {
            c.row = write(row, withSlot(row, c.index, next))
            consumed.add(capability)
            if (finish) claims.delete(claim)
            return null
          } catch (e) {
            if (e === 'COMMIT_UNCERTAIN') {
              consumed.add(capability)
              claims.delete(claim)
            }
            throw e
          }
        })
      })
    }
    const owner: IntentOwnerV1 = Object.freeze({
      begin: (input: unknown, originCapability: object) =>
        result(() => {
          const inputOwned = capture(input),
            initial = plain(inputOwned, ['intentRef', 'request', 'computedRequestDigest']),
            id = str(initial.intentRef, 'id')
          return guarded(id, () => {
            if (!originCapability || typeof originCapability !== 'object') fail('AUTHORITY_REFUSED')
            const row = read(id),
              now = time(),
              { proposal, index } = beginRequest(inputOwned, row, now)
            const answer = accepted(
              callback(() =>
                ports.authenticateOrigin(row.authority, row.state, proposal, originCapability),
              ),
              ['episodeEvidence', 'budgetEvidence', 'priorDisposition', 'primaryQuality'],
              'AUTHORITY_REFUSED',
            )
            const episodeEvidence = evidence(
                answer.episodeEvidence,
                row.authority,
                proposal.request.requestDigest,
                null,
                now,
              ),
              budgetEvidence = evidence(
                answer.budgetEvidence,
                row.authority,
                proposal.request.requestDigest,
                null,
                now,
              )
            if (index === 0) {
              if (answer.priorDisposition !== null || answer.primaryQuality !== null)
                fail('AUTHORITY_REFUSED')
            } else if (
              proposal.request.attempt.kind !== 'fallback' ||
              !equal(answer.priorDisposition, proposal.request.attempt.priorDisposition) ||
              !equal(answer.primaryQuality, proposal.request.attempt.primaryQuality)
            )
              fail('AUTHORITY_REFUSED')
            const attempts = row.state.slots.flatMap((s, i) =>
              eligiblePrior(s)
                ? [
                    {
                      requestId: row.identity.requestIds[i === 0 ? 0 : 1],
                      requestDigest: s.requestDigest,
                      decisionDigest: s.selected.decisionDigest,
                      bindingId: s.selected.bindingId,
                      provider: s.selected.provider,
                      matrixRole: s.selected.matrixRole,
                      disposition: s.state,
                    },
                  ]
                : [],
            )
            const episode = capture({
              status: 'supplied',
              value: {
                episodeId: row.identity.episodeId,
                workflowId: row.authority.routeTemplate.workflowId,
                taskId: row.authority.routeTemplate.taskId,
                lane: row.authority.routeTemplate.lane,
                version: 'pmc/v1',
                policyDigest: row.authority.policyDigest,
                configDigest: row.authority.configDigest,
                attempts,
              },
              evidence: episodeEvidence,
            }) as Extract<ReturnType<IntentOwnerV1['begin']>, { ok: true }>['value']['episode']
            const next = write(
                row,
                withSlot(row, index, {
                  state: 'pending',
                  requestDigest: proposal.request.requestDigest,
                  selected: null,
                }),
              ),
              claim = Object.freeze({})
            claims.set(claim, { row: next, index })
            return Object.freeze({
              claim,
              request: proposal.request,
              episode,
              budgetEvidence,
              scope: row.authority.scope,
            })
          })
        }),
      recordDecision: (claim: object, cap: object) => mutate(claim, cap, false),
      finish: (claim: object, cap: object) => mutate(claim, cap, true),
    })
    lifecycle.set(owner, () => {
      closed = true
    })
    return Object.freeze({
      owner,
      identities: capture(records.map((r) => r.identity)) as readonly IdentityProjection[],
    })
  })
}
export function closeIntentOwnerV1(owner: object): Result<null> {
  return result(() => {
    const close = lifecycle.get(owner)
    if (!close) fail('STATE_REFUSED')
    close()
    lifecycle.delete(owner)
    return null
  })
}
