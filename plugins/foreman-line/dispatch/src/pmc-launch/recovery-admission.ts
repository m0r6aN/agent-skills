import { createHash } from 'node:crypto'
import { closeSync, lstatSync, openSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, isAbsolute, join, parse, resolve } from 'node:path'
import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { pathToFileURL } from 'node:url'
import { initializeIntentOwnerV1 } from './intent-custody.js'
import type { IdentityProjection, IntentAuthority, OwnerIdentity } from './intent-custody-types.js'
import type {
  AdmissionV1,
  CodeV1,
  EpisodeV1,
  OfflineInputV1,
  RegistrationV1,
  ResultV1,
} from './recovery-admission-types.js'

type Data = Record<string, unknown>
type Row = Record<string, string | number | bigint | Uint8Array | null>
type RootInfo = { root: string; key: string; dev: bigint; ino: bigint }
type AdmissionRecord = {
  meta: RegistrationV1
  episodes: readonly EpisodeV1[]
}

const B1_FILE = 'pmc-intent-v1.sqlite'
const ADMISSION_FILE = 'hro-recovery-admission-v1.sqlite'
const DB_LIMIT = 4 * 1024 * 1024
const JOURNAL_LIMIT = 1024 * 1024
const CAPTURE_LIMIT = 256 * 1024
const PAYLOAD_LIMIT = 262144
const NODE_LIMIT = 65536
const DEPTH_LIMIT = 16
const STRING_LIMIT = 2048
const PATH_LIMIT = 1024
const INSTALLATION_LIMIT = 32
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const DIGEST_RE = /^[a-f0-9]{64}$/
const FIXTURE_RE = /^[A-Za-z0-9-]{1,64}$/
const codes = new Set<CodeV1>([
  'INPUT_REFUSED',
  'BOUNDS_REFUSED',
  'PATH_REFUSED',
  'PREREQUISITE_UNAVAILABLE',
  'AUTHORITY_REFUSED',
  'B1_REFUSED',
  'ALREADY_ADMITTED',
  'STORAGE_INVALID',
  'BUSY',
  'IO_FAILED',
  'COMMIT_UNCERTAIN',
  'SESSION_REFUSED',
])

function fail(code: CodeV1): never {
  throw code
}

function nativeCode(error: unknown): unknown {
  try {
    if (error && typeof error === 'object') {
      const descriptors = Object.getOwnPropertyDescriptors(error)
      return descriptors.errcode?.value ?? descriptors.code?.value
    }
  } catch {
    // Thrown values are untrusted and are not inspected further.
  }
  return undefined
}

function mapError(error: unknown): CodeV1 {
  if (typeof error === 'string' && codes.has(error as CodeV1)) return error as CodeV1
  const code = nativeCode(error)
  if (code === 5 || code === 6) return 'BUSY'
  if (code === 13) return 'BOUNDS_REFUSED'
  if (code === 'ELOOP' || code === 'EACCES' || code === 'EPERM') return 'PATH_REFUSED'
  if (code === 'ENOENT') return 'PATH_REFUSED'
  if (code === 14) return 'IO_FAILED'
  return 'IO_FAILED'
}

function result<T>(fn: () => T): ResultV1<T> {
  try {
    return Object.freeze({ ok: true, value: fn() })
  } catch (error) {
    return Object.freeze({ ok: false, code: mapError(error) })
  }
}

function charge(bytes: { value: number }, value: string, limit = CAPTURE_LIMIT): void {
  const size = Buffer.byteLength(value, 'utf8')
  if (!Number.isSafeInteger(size) || bytes.value > limit - size) fail('BOUNDS_REFUSED')
  bytes.value += size
}

function capture(input: unknown, options: { payload?: boolean } = {}): unknown {
  const bytes = { value: 0 }
  const active = new Set<object>()
  let nodes = 0
  function copy(value: unknown, depth: number, key: string | null): unknown {
    if (++nodes > NODE_LIMIT || depth > DEPTH_LIMIT) fail('BOUNDS_REFUSED')
    if (typeof value === 'string') {
      const limit = options.payload && key === 'payloadJson' ? PAYLOAD_LIMIT : STRING_LIMIT
      if (value.length > limit) fail('BOUNDS_REFUSED')
      charge(bytes, JSON.stringify(value))
      return value
    }
    if (
      value === null ||
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value))
    ) {
      charge(bytes, JSON.stringify(value))
      return value
    }
    if (!value || typeof value !== 'object' || active.has(value)) fail('INPUT_REFUSED')
    const array = Array.isArray(value)
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== (array ? Array.prototype : Object.prototype)) fail('INPUT_REFUSED')
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
    const names = Reflect.ownKeys(value)
    if (
      array &&
      (names.length !== length + 1 ||
        !names.includes('length') ||
        names.some(
          (name) =>
            name !== 'length' &&
            (typeof name !== 'string' || !/^\d+$/.test(name) || Number(name) >= length),
        ))
    )
      fail('INPUT_REFUSED')
    if (nodes + names.length * 2 > NODE_LIMIT) fail('BOUNDS_REFUSED')
    charge(bytes, array ? '[' : '{')
    active.add(value)
    const owned: Data = {}
    let index = 0
    let count = 0
    try {
      for (const name of names) {
        if (name === 'length' && array) continue
        if (typeof name !== 'string' || (array && name !== String(index++))) fail('INPUT_REFUSED')
        if (name === 'then') fail('INPUT_REFUSED')
        const descriptor = Object.getOwnPropertyDescriptor(value, name)
        if (!descriptor?.enumerable || !('value' in descriptor)) fail('INPUT_REFUSED')
        if (count++ > 0) charge(bytes, ',')
        charge(bytes, JSON.stringify(name))
        if (!array) charge(bytes, ':')
        nodes++
        const child = copy(descriptor.value, depth + 1, name)
        if (array) Object.defineProperty(owned, name, { value: child, enumerable: true })
        else Object.defineProperty(owned, name, { value: child, enumerable: true })
      }
    } finally {
      active.delete(value)
    }
    charge(bytes, array ? ']' : '}')
    return Object.freeze(array ? Object.values(owned) : owned)
  }
  try {
    return copy(input, 0, null)
  } catch (error) {
    if (typeof error === 'string' && codes.has(error as CodeV1)) throw error
    fail('INPUT_REFUSED')
  }
}

function plain(value: unknown, keys: readonly string[]): Data {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== keys.length ||
    keys.some((key) => !Object.hasOwn(value, key))
  )
    fail('INPUT_REFUSED')
  return value as Data
}

function string(value: unknown, kind: 'id' | 'digest' | 'text' = 'text'): string {
  if (
    typeof value !== 'string' ||
    !value.length ||
    value.length > STRING_LIMIT ||
    (kind === 'id' && !ID_RE.test(value)) ||
    (kind === 'digest' && !DIGEST_RE.test(value))
  )
    fail('INPUT_REFUSED')
  return value
}

function identity(value: unknown): OwnerIdentity {
  const record = plain(value, [
    'storeId',
    'ledgerId',
    'epoch',
    'initializationAuthorityDigest',
    'schemaVersion',
  ])
  string(record.storeId, 'id')
  string(record.ledgerId, 'id')
  string(record.epoch, 'id')
  string(record.initializationAuthorityDigest, 'digest')
  if (record.schemaVersion !== 1) fail('INPUT_REFUSED')
  return record as OwnerIdentity
}

function id(value: unknown): string {
  return string(value, 'id')
}

function digest(value: unknown): string {
  return string(value, 'digest')
}

function caseKey(value: string): string {
  return process.platform === 'win32' ? value.toLowerCase() : value
}

function checkDirectoryParts(root: string): void {
  let current = root
  while (true) {
    const stats = lstatSync(current)
    if (!stats.isDirectory() || stats.isSymbolicLink()) fail('PATH_REFUSED')
    if (current === parse(current).root) break
    current = dirname(current)
  }
}

function artifact(root: string, file: string, missing: CodeV1): void {
  try {
    const stats = lstatSync(join(root, file))
    if (!stats.isFile() || stats.isSymbolicLink() || stats.nlink !== 1) fail('PATH_REFUSED')
    if (stats.size > DB_LIMIT + JOURNAL_LIMIT) fail('STORAGE_INVALID')
  } catch (error) {
    if (nativeCode(error) === 'ENOENT') fail(missing)
    throw error
  }
}

function inspectFreshArtifacts(root: string): void {
  for (const name of readdirSync(root)) {
    if (name === B1_FILE) {
      artifact(root, name, 'B1_REFUSED')
      fail('B1_REFUSED')
    }
    if (name === ADMISSION_FILE) {
      artifact(root, name, 'ALREADY_ADMITTED')
      fail('ALREADY_ADMITTED')
    }
    if (name.startsWith(B1_FILE) || name.startsWith(ADMISSION_FILE)) {
      if (name !== `${B1_FILE}-journal` && name !== `${ADMISSION_FILE}-journal`)
        fail('STORAGE_INVALID')
      artifact(root, name, 'STORAGE_INVALID')
      fail(name.startsWith(B1_FILE) ? 'B1_REFUSED' : 'ALREADY_ADMITTED')
    }
  }
}

function rootInfo(raw: string, fixtureId: string, workflowId: string): RootInfo {
  if (
    !isAbsolute(raw) ||
    raw.length > PATH_LIMIT ||
    raw.includes('\0') ||
    raw.startsWith('\\\\') ||
    raw.startsWith('//') ||
    /(^|[\\/])\.\.?([\\/]|$)/.test(raw) ||
    (process.platform === 'win32' && (!/^[A-Za-z]:[\\/]/.test(raw) || raw.slice(2).includes(':')))
  )
    fail('PATH_REFUSED')
  const resolved = resolve(raw)
  const real = realpathSync(resolved)
  checkDirectoryParts(real)
  const temp = realpathSync(tmpdir())
  if (caseKey(dirname(real)) !== caseKey(temp)) fail('PATH_REFUSED')
  if (caseKey(basename(real)) !== caseKey(`hro-p4a1-fixture-${fixtureId}`)) fail('PATH_REFUSED')
  const stats = lstatSync(real, { bigint: true })
  if (!stats.isDirectory() || stats.isSymbolicLink() || stats.dev === 0n || stats.ino === 0n)
    fail('PATH_REFUSED')
  return {
    root: real,
    key: JSON.stringify([stats.dev.toString(), stats.ino.toString(), workflowId]),
    dev: stats.dev,
    ino: stats.ino,
  }
}

function payload(value: unknown): string {
  if (typeof value !== 'string' || value.length > PAYLOAD_LIMIT) fail('BOUNDS_REFUSED')
  try {
    JSON.parse(value)
  } catch {
    fail('INPUT_REFUSED')
  }
  return value
}

function validateTop(input: unknown): {
  value: OfflineInputV1
  root: RootInfo
  identity: OwnerIdentity
  authorities: readonly IntentAuthority[]
  payloads: readonly string[]
} {
  const captured = capture(input, { payload: true })
  const record = plain(captured, [
    'domain',
    'fixtureId',
    'root',
    'workflowId',
    'generationId',
    'identity',
    'intents',
  ])
  if (record.domain !== 'offline-fixture/v1') fail('INPUT_REFUSED')
  const fixtureId = string(record.fixtureId)
  if (!FIXTURE_RE.test(fixtureId)) fail('INPUT_REFUSED')
  const workflowId = id(record.workflowId)
  id(record.generationId)
  const rawRoot = string(record.root)
  const identityValue = identity(record.identity)
  const root = rootInfo(rawRoot, fixtureId, workflowId)
  if (!Array.isArray(record.intents) || record.intents.length < 1 || record.intents.length > 128)
    fail('BOUNDS_REFUSED')
  const authorities: IntentAuthority[] = []
  const payloads: string[] = []
  for (const item of record.intents) {
    const intent = plain(item, ['authority', 'payloadJson'])
    const authority = intent.authority as IntentAuthority
    if (!authority || typeof authority !== 'object') fail('INPUT_REFUSED')
    const scope = authority.scope as Data
    const route = authority.routeTemplate as Data
    if (!scope || !route || scope.workflowId !== workflowId || route.workflowId !== workflowId)
      fail('AUTHORITY_REFUSED')
    authorities.push(authority)
    payloads.push(payload(intent.payloadJson))
  }
  return {
    value: captured as OfflineInputV1,
    root,
    identity: identityValue,
    authorities: Object.freeze(authorities),
    payloads: Object.freeze(payloads),
  }
}

function fixedSetup(expected: unknown): { authenticateSetup: (proposal: unknown) => unknown } {
  const expectedJson = JSON.stringify(expected)
  return {
    authenticateSetup(proposal: unknown) {
      if (JSON.stringify(proposal) !== expectedJson) return { accepted: false }
      return { accepted: true }
    },
  }
}

function mapB1(code: unknown): CodeV1 {
  if (code === 'COMMIT_UNCERTAIN') return 'COMMIT_UNCERTAIN'
  if (code === 'BUSY') return 'BUSY'
  if (code === 'IO_FAILED') return 'IO_FAILED'
  if (code === 'PATH_REFUSED') return 'PATH_REFUSED'
  if (
    code === 'STORAGE_INVALID' ||
    code === 'STORAGE_MISSING' ||
    code === 'IDENTITY_MISMATCH' ||
    code === 'SETTINGS_REFUSED'
  )
    return 'STORAGE_INVALID'
  return 'B1_REFUSED'
}

function projection(value: unknown, authority: IntentAuthority): IdentityProjection {
  const record = plain(value, ['intentRef', 'episodeId', 'requestIds'])
  if (
    record.intentRef !== authority.intentRef ||
    !Array.isArray(record.requestIds) ||
    record.requestIds.length !== 2
  )
    fail('B1_REFUSED')
  const first = id(record.requestIds[0])
  const second = id(record.requestIds[1])
  if (first === second) fail('B1_REFUSED')
  return Object.freeze({
    intentRef: authority.intentRef,
    episodeId: id(record.episodeId),
    requestIds: Object.freeze([first, second]) as readonly [string, string],
  })
}

function requestDigest(
  authority: IntentAuthority,
  projectionValue: IdentityProjection,
  payloadJson: string,
): string {
  const template = authority.routeTemplate
  const route = {
    version: template.version,
    workflowId: template.workflowId,
    taskId: template.taskId,
    episodeId: projectionValue.episodeId,
    requestId: projectionValue.requestIds[0],
    lane: template.lane,
    subRole: template.subRole,
    routingClass: template.routingClass,
    dataClass: template.dataClass,
    requirements: {
      toolUse: template.requirements.toolUse,
      structuredOutput: template.requirements.structuredOutput,
      reasoning: template.requirements.reasoning,
      thinkingLevel: template.requirements.thinkingLevel,
      inputModalities: template.requirements.inputModalities,
      requiredContextTokens: template.requirements.requiredContextTokens,
      requiredOutputTokens: template.requirements.requiredOutputTokens,
      maximumInputTokens: template.requirements.maximumInputTokens,
      maximumOutputTokens: template.requirements.maximumOutputTokens,
      rankingTokens: template.requirements.rankingTokens,
    },
    attempt: { kind: 'initial' },
  }
  return createHash('sha256')
    .update(JSON.stringify(['pmc-request/v1', authority.intentRef, route, payloadJson]), 'utf8')
    .digest('hex')
}

const schema = [
  `CREATE TABLE admission_meta (singleton INTEGER PRIMARY KEY CHECK(singleton=1), schemaVersion INTEGER NOT NULL CHECK(schemaVersion=1), root TEXT NOT NULL, domain TEXT NOT NULL CHECK(domain='offline-fixture/v1'), fixtureId TEXT NOT NULL, workflowId TEXT NOT NULL, generationId TEXT NOT NULL, storeId TEXT NOT NULL, ledgerId TEXT NOT NULL, epoch TEXT NOT NULL, initializationAuthorityDigest TEXT NOT NULL, state TEXT NOT NULL CHECK(state='admitted')) STRICT`,
  `CREATE TABLE episodes (intentRef TEXT PRIMARY KEY NOT NULL, businessAuthorityRef TEXT NOT NULL UNIQUE, businessAuthorityDigest TEXT NOT NULL, episodeId TEXT NOT NULL UNIQUE, request1 TEXT NOT NULL UNIQUE, request2 TEXT NOT NULL UNIQUE, originalRequestDigest TEXT NOT NULL, policyDigest TEXT NOT NULL, configDigest TEXT NOT NULL, CHECK(request1<>request2)) STRICT`,
]

function rows(db: DatabaseSync, sql: string, ...args: SQLInputValue[]): Row[] {
  const statement = db.prepare(sql)
  statement.setReadBigInts(true)
  return statement.all(...args)
}

function settings(db: DatabaseSync, fresh: boolean): void {
  if (fresh) db.exec('PRAGMA page_size=4096')
  db.exec(
    'PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA; PRAGMA busy_timeout=1000; PRAGMA foreign_keys=ON; PRAGMA trusted_schema=OFF; PRAGMA max_page_count=1024',
  )
  const expected: readonly [string, string | bigint][] = [
    ['journal_mode', 'delete'],
    ['synchronous', 3n],
    ['busy_timeout', 1000n],
    ['foreign_keys', 1n],
    ['trusted_schema', 0n],
    ['page_size', 4096n],
    ['max_page_count', 1024n],
  ]
  for (const [name, value] of expected) {
    const column = name === 'busy_timeout' ? 'timeout' : name
    if (rows(db, `PRAGMA ${name}`)[0]?.[column] !== value) fail('STORAGE_INVALID')
  }
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
        /* Preserve original refusal. */
      }
    }
  }
}

function expectedMeta(registration: RegistrationV1): Data {
  return {
    singleton: 1,
    schemaVersion: 1,
    root: registration.root,
    domain: registration.domain,
    fixtureId: registration.fixtureId,
    workflowId: registration.workflowId,
    generationId: registration.generationId,
    storeId: registration.identity.storeId,
    ledgerId: registration.identity.ledgerId,
    epoch: registration.identity.epoch,
    initializationAuthorityDigest: registration.identity.initializationAuthorityDigest,
    state: 'admitted',
  }
}

function validateSchema(db: DatabaseSync): void {
  const actual = rows(
    db,
    "SELECT name,type,sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name",
  )
  if (
    actual.length !== 2 ||
    actual.some((row) => row.type !== 'table') ||
    schema.some((sql) => !actual.some((row) => row.sql === sql))
  )
    fail('STORAGE_INVALID')
  const indexes = rows(db, 'PRAGMA index_list(episodes)')
  if (indexes.length !== 5 || indexes.some((index) => index.unique !== 1n || index.partial !== 0n))
    fail('STORAGE_INVALID')
  const columns: readonly [number, string][] = [
    [0, 'intentRef'],
    [1, 'businessAuthorityRef'],
    [3, 'episodeId'],
    [4, 'request1'],
    [5, 'request2'],
  ]
  for (const [index, [cid, name]] of columns.entries()) {
    const actualIndex = indexes.find(
      (value) => value.name === `sqlite_autoindex_episodes_${index + 1}`,
    )
    const fields = rows(db, `PRAGMA index_info(sqlite_autoindex_episodes_${index + 1})`)
    if (
      !actualIndex ||
      fields.length !== 1 ||
      fields[0]?.cid !== BigInt(cid) ||
      fields[0]?.name !== name
    )
      fail('STORAGE_INVALID')
  }
  if (rows(db, 'PRAGMA quick_check(1)')[0]?.quick_check !== 'ok') fail('STORAGE_INVALID')
}

function validateRows(db: DatabaseSync, record: AdmissionRecord): void {
  validateSchema(db)
  const meta = rows(db, 'SELECT * FROM admission_meta LIMIT 2')
  if (meta.length !== 1 || meta[0]?.singleton !== 1n || meta[0]?.schemaVersion !== 1n)
    fail('STORAGE_INVALID')
  const expected = expectedMeta(record.meta)
  for (const key of Object.keys(expected)) {
    const actual = meta[0]?.[key]
    const desired = expected[key]
    if (typeof desired === 'number' ? actual !== BigInt(desired) : actual !== desired)
      fail('STORAGE_INVALID')
  }
  const episodeRows = rows(db, 'SELECT * FROM episodes ORDER BY intentRef LIMIT 129')
  if (episodeRows.length !== record.episodes.length) fail('STORAGE_INVALID')
  const ids = new Set<string>()
  for (const row of episodeRows) {
    for (const key of [
      'intentRef',
      'businessAuthorityRef',
      'episodeId',
      'request1',
      'request2',
      'originalRequestDigest',
      'policyDigest',
      'configDigest',
    ])
      if (typeof row[key] !== 'string') fail('STORAGE_INVALID')
    const values = [
      row.intentRef,
      row.businessAuthorityRef,
      row.episodeId,
      row.request1,
      row.request2,
    ]
    for (const value of values) {
      if (typeof value !== 'string' || ids.has(value)) fail('STORAGE_INVALID')
      ids.add(value)
    }
    if (
      row.request1 === row.request2 ||
      !DIGEST_RE.test(row.businessAuthorityDigest as string) ||
      !DIGEST_RE.test(row.originalRequestDigest as string) ||
      !DIGEST_RE.test(row.policyDigest as string) ||
      !DIGEST_RE.test(row.configDigest as string)
    )
      fail('STORAGE_INVALID')
  }
  const expectedRows = new Map(record.episodes.map((episode) => [episode.intentRef, episode]))
  for (const row of episodeRows) {
    const expectedEpisode = expectedRows.get(row.intentRef as string)
    if (
      !expectedEpisode ||
      row.businessAuthorityRef !== expectedEpisode.businessAuthorityRef ||
      row.episodeId !== expectedEpisode.episodeId ||
      row.request1 !== expectedEpisode.requestIds[0] ||
      row.request2 !== expectedEpisode.requestIds[1] ||
      row.originalRequestDigest !== expectedEpisode.originalRequestDigest ||
      row.businessAuthorityDigest !== expectedEpisode.businessAuthorityDigest ||
      row.policyDigest !== expectedEpisode.policyDigest ||
      row.configDigest !== expectedEpisode.configDigest
    )
      fail('STORAGE_INVALID')
  }
}

function boundedRegistration(registration: RegistrationV1): RegistrationV1 {
  const owned = capture(registration) as RegistrationV1
  return owned
}

function writeAdmission(record: AdmissionRecord): void {
  const file = join(record.meta.root, ADMISSION_FILE)
  let fd: number | undefined
  try {
    fd = openSync(file, 'wx', 0o600)
    closeSync(fd)
    fd = undefined
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
        const meta = expectedMeta(record.meta)
        db.prepare('INSERT INTO admission_meta VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(
          ...(Object.values(meta) as SQLInputValue[]),
        )
        for (const episode of record.episodes)
          db.prepare('INSERT INTO episodes VALUES (?,?,?,?,?,?,?,?,?)').run(
            episode.intentRef,
            episode.businessAuthorityRef,
            episode.businessAuthorityDigest,
            episode.episodeId,
            episode.requestIds[0],
            episode.requestIds[1],
            episode.originalRequestDigest,
            episode.policyDigest,
            episode.configDigest,
          )
        validateRows(db, record)
      })
      committed = true
      validateRows(db, record)
      const pageCount = rows(db, 'PRAGMA page_count')[0]?.page_count
      let size: number
      try {
        size = statSync(file).size
      } catch {
        fail('COMMIT_UNCERTAIN')
      }
      if (typeof pageCount !== 'bigint' || pageCount > 1024n || size > DB_LIMIT + JOURNAL_LIMIT)
        fail('BOUNDS_REFUSED')
    } finally {
      try {
        db.close()
      } catch {
        if (committed) fail('COMMIT_UNCERTAIN')
        fail('IO_FAILED')
      }
    }
  } catch (error) {
    if (nativeCode(error) === 'EEXIST') fail('ALREADY_ADMITTED')
    if (fd !== undefined) {
      try {
        closeSync(fd)
      } catch {
        /* Keep the original result. */
      }
    }
    throw error
  }
}

const installations = new Map<string, 'held' | 'admitted'>()

function registration(
  input: OfflineInputV1,
  root: RootInfo,
  projections: readonly IdentityProjection[],
  payloads: readonly string[],
): RegistrationV1 {
  if (projections.length !== input.intents.length) fail('B1_REFUSED')
  const episodes: EpisodeV1[] = []
  const ids = new Set<string>()
  for (const [index, projectionValue] of projections.entries()) {
    const authority = input.intents[index]?.authority
    const payloadJson = payloads[index]
    if (!authority || payloadJson === undefined) fail('B1_REFUSED')
    const p = projection(projectionValue, authority)
    const episode: EpisodeV1 = {
      intentRef: id(authority.intentRef),
      businessAuthorityRef: id(authority.businessAuthorityRef),
      businessAuthorityDigest: digest(authority.businessAuthorityDigest),
      episodeId: id(p.episodeId),
      requestIds: Object.freeze([p.requestIds[0], p.requestIds[1]]) as readonly [string, string],
      originalRequestDigest: requestDigest(authority, p, payloadJson),
      policyDigest: digest(authority.policyDigest),
      configDigest: digest(authority.configDigest),
    }
    for (const value of [
      episode.intentRef,
      episode.businessAuthorityRef,
      episode.episodeId,
      ...episode.requestIds,
    ]) {
      if (ids.has(value)) fail('B1_REFUSED')
      ids.add(value)
    }
    episodes.push(Object.freeze(episode))
  }
  const out: RegistrationV1 = {
    version: 'hro-recovery-admission/v1',
    domain: input.domain,
    fixtureId: input.fixtureId,
    root: root.root,
    workflowId: input.workflowId,
    generationId: input.generationId,
    identity: input.identity,
    episodes: Object.freeze(episodes),
  }
  return boundedRegistration(out)
}

export function createProductionRecoveryAdmissionV1(_input: unknown): {
  ok: false
  code: 'PREREQUISITE_UNAVAILABLE'
} {
  return { ok: false, code: 'PREREQUISITE_UNAVAILABLE' }
}

export function createOfflineRecoveryAdmissionV1(input: unknown): ResultV1<AdmissionV1> {
  let key: string | undefined
  return result(() => {
    const validated = validateTop(input)
    key = validated.root.key
    if (installations.has(key)) fail('ALREADY_ADMITTED')
    if (installations.size >= INSTALLATION_LIMIT) fail('BOUNDS_REFUSED')
    inspectFreshArtifacts(validated.root.root)
    const b1Input = Object.freeze({
      root: validated.root.root,
      identity: validated.identity,
      intents: validated.authorities,
    })
    installations.set(key, 'held')
    const initialized = initializeIntentOwnerV1(b1Input, fixedSetup(b1Input))
    if (!initialized.ok) fail(mapB1(initialized.code))
    const projections = initialized.value
    const reg = registration(validated.value, validated.root, projections, validated.payloads)
    writeAdmission({ meta: reg, episodes: reg.episodes })
    installations.set(key, 'admitted')
    return Object.freeze({ domain: reg.domain, registration: reg, claimBrokerV1: claim(reg) })
  })
}

function claim(registrationValue: RegistrationV1): () => ResultV1<object> {
  let spent = false
  const token = Object.freeze({})
  return () => {
    if (spent) return Object.freeze({ ok: false, code: 'SESSION_REFUSED' as const })
    spent = true
    void registrationValue
    return Object.freeze({ ok: true, value: token })
  }
}
