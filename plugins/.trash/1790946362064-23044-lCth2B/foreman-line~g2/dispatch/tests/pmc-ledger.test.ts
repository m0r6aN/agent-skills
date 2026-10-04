import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { type TestContext, test } from 'node:test'
import type {
  AttemptV1,
  BudgetScopeV1,
  LocalPmcLedger,
  PmcLedgerTrustedPortsV1,
} from '../src/pmc-launch/ledger.js'
import { createLocalPmcLedger, initializeLocalPmcLedger } from '../src/pmc-launch/ledger.js'
import { computePmcCostV1 } from '../src/pmc-launch/money.js'

const digest = 'a'.repeat(64)
const clock = () => '2026-09-26T12:00:00.000Z'
const scope = {
  scopeId: 'scope',
  authorityDigest: digest,
  currency: 'USD' as const,
  authorizedLimitMicroUsd: 10,
  workflowId: 'workflow',
  accountId: 'account',
  routingClass: 'implementation/standard',
}
const cost = () =>
  computePmcCostV1({
    version: 'pmc-price/v1',
    currency: 'USD',
    requestDigest: digest,
    identity: { bindingId: 'binding', provider: 'openrouter', providerModelId: 'model' },
    sourceProfileId: 'profile',
    sourceProfileVersion: '1',
    sourceProfileDigest: digest,
    tariffDigest: digest,
    priceEvidenceDigest: digest,
    inputRate: { value: '0.000006', unit: 'USD per token' },
    outputRate: { value: '0', unit: 'USD per token' },
    perRequestFeeUsd: '0',
    otherFees: 'none-attested',
    maximumInputTokens: 1,
    maximumOutputTokens: 0,
    rankingTokens: { input: 1, output: 0 },
  })

function temporary(t: TestContext): string {
  const root = mkdtempSync(join(tmpdir(), 'pmc-ledger-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return root
}
function init(root: string, scopes: readonly BudgetScopeV1[] = [scope]) {
  return initializeLocalPmcLedger(
    { root, ledgerId: 'ledger', epoch: 'epoch', initializationAuthorityDigest: digest, scopes },
    {
      clock,
      authenticateInitialization: (request) => ({
        accepted: true,
        ledgerId: request.ledgerId,
        epoch: request.epoch,
        initializationAuthorityDigest: request.initializationAuthorityDigest,
        scopesDigest: createHash('sha256').update(JSON.stringify(request.scopes)).digest('hex'),
      }),
    },
  )
}
const openRequest = (root: string) => ({
  root,
  expectedLedgerId: 'ledger',
  expectedEpoch: 'epoch',
  expectedInitializationAuthorityDigest: digest,
})
const trusted: PmcLedgerTrustedPortsV1 = {
  clock,
  authenticateSettlement: (_context, observation) => observation,
  authenticateNoSendProof: (_context, proof) => proof,
}
function open(root: string, ports = trusted): LocalPmcLedger {
  const r = createLocalPmcLedger(openRequest(root), ports)
  assert(r.ok, JSON.stringify(r))
  return r.value
}
function fixture(t: TestContext, scopes: readonly BudgetScopeV1[] = [scope]) {
  const root = temporary(t)
  const initialized = init(root, scopes)
  assert(initialized.ok, JSON.stringify(initialized))
  return { root, ledger: open(root) }
}
function reservation(requestId = 'request', scopeId = 'scope') {
  const c = cost()
  assert(c.ok)
  return {
    requestId,
    scopeId,
    requestDigest: digest,
    costValue: c.value,
    priceEvidence: c.priceEvidence,
  }
}
const request = (requestId = 'request') => ({ requestId, requestDigest: digest })
function proof(
  kind: 'unknown' | 'known' | 'no-send',
  proofRef = 'proof',
  actualMicroUsd = 3,
  requestId = 'request',
) {
  return {
    accepted: true,
    ledgerId: 'ledger',
    epoch: 'epoch',
    requestId,
    requestDigest: digest,
    scopeId: 'scope',
    proofRef,
    proofDigest: createHash('sha256')
      .update(JSON.stringify([kind, proofRef, actualMicroUsd, requestId]))
      .digest('hex'),
    ...(kind === 'no-send'
      ? { noSend: true }
      : { outcome: kind === 'known' ? { kind, actualMicroUsd } : { kind } }),
  }
}
function sql(root: string, fn: (db: DatabaseSync) => void): void {
  const db = new DatabaseSync(join(root, 'pmc-budget-v1.sqlite'))
  try {
    fn(db)
  } finally {
    db.close()
  }
}
function reserved(ledger: LocalPmcLedger): AttemptV1 {
  const r = ledger.reserve(reservation())
  assert(r.ok, JSON.stringify(r))
  return r.value
}

test('AC3: only trusted exact proofs reconcile unknown liability; superseded unknown stays private', (t) => {
  const { root, ledger } = fixture(t)
  reserved(ledger)
  assert(ledger.consume(request()).ok)
  const unknown = proof('unknown', 'unknown')
  const first = ledger.settle({ ...request(), observation: unknown })
  assert(first.ok)
  assert.equal(first.value.state, 'uncertain')
  assert.deepEqual(ledger.settle({ ...request(), observation: unknown }), first)
  assert.deepEqual(ledger.settle({ ...request(), observation: proof('unknown', 'new-unknown') }), {
    ok: false,
    code: 'LEDGER_STATE_REFUSED',
  })
  assert.deepEqual(
    ledger.settle({
      ...request(),
      observation: { ...unknown, outcome: { kind: 'known', actualMicroUsd: 0 } },
    }),
    { ok: false, code: 'LEDGER_PROOF_REFUSED' },
  )
  const known = proof('known', 'terminal', 3)
  const terminal = ledger.settle({ ...request(), observation: known })
  assert(terminal.ok)
  assert.equal(terminal.value.actualMicroUsd, 3)
  assert.deepEqual(ledger.settle({ ...request(), observation: known }), terminal)
  assert.deepEqual(ledger.settle({ ...request(), observation: unknown }), {
    ok: false,
    code: 'LEDGER_STATE_REFUSED',
  })
  assert.deepEqual(ledger.cancelWithNoSendProof({ ...request(), proof: proof('no-send') }), {
    ok: false,
    code: 'LEDGER_STATE_REFUSED',
  })
  sql(root, (db) => {
    const r = db
      .prepare('SELECT priorUnknownProofRef,priorUnknownProofDigest,priceEvidence FROM attempts')
      .get()
    assert.equal(r?.priorUnknownProofRef, 'unknown')
    assert.equal(r?.priorUnknownProofDigest, unknown.proofDigest)
    assert.deepEqual(JSON.parse(r?.priceEvidence as string), reservation().priceEvidence)
  })
  const s = open(root).snapshot({ scopeId: 'scope' })
  assert(s.ok)
  assert.equal(s.value.settledMicroUsd, 3)
  assert.equal(s.value.outstandingMicroUsd, 0)
  assert.equal(s.value.remainingMicroUsd, 7)
})

for (const state of ['reserved', 'consumed', 'uncertain'] as const) {
  test(`AC3: authenticated no-send cancels ${state}; timeout and caller assertions do not`, (t) => {
    const { root, ledger } = fixture(t)
    reserved(ledger)
    if (state !== 'reserved') assert(ledger.consume(request()).ok)
    if (state === 'uncertain')
      assert(ledger.settle({ ...request(), observation: proof('unknown', 'prior') }).ok)
    for (const bad of [
      { timeout: true },
      { aborted: true },
      { accepted: false },
      { noSend: true },
      { ...proof('no-send'), epoch: 'wrong' },
      { ...proof('no-send'), scopeId: 'wrong' },
      { ...proof('no-send'), requestDigest: 'b'.repeat(64) },
    ]) {
      assert.deepEqual(ledger.cancelWithNoSendProof({ ...request(), proof: bad }), {
        ok: false,
        code: 'LEDGER_PROOF_REFUSED',
      })
    }
    const p = proof('no-send', 'terminal')
    const cancelled = ledger.cancelWithNoSendProof({ ...request(), proof: p })
    assert(cancelled.ok)
    assert.equal(cancelled.value.state, 'cancelled')
    assert.deepEqual(open(root).cancelWithNoSendProof({ ...request(), proof: p }), cancelled)
    assert.deepEqual(ledger.reserve(reservation()), { ok: false, code: 'LEDGER_REQUEST_EXISTS' })
    const s = ledger.snapshot({ scopeId: 'scope' })
    assert(s.ok)
    assert.equal(s.value.remainingMicroUsd, 10)
  })
}

test('AC3: over-bound authenticated charge freezes atomically and survives restart; reconciliation remains usable', (t) => {
  const { root, ledger } = fixture(t, [{ ...scope, authorizedLimitMicroUsd: 20 }])
  reserved(ledger)
  assert(ledger.reserve(reservation('second')).ok)
  assert(ledger.consume(request()).ok)
  const settlement = ledger.settle({ ...request(), observation: proof('known', 'over', 12) })
  assert(settlement.ok)
  const reopened = open(root)
  const s = reopened.snapshot({ scopeId: 'scope' })
  assert(s.ok)
  assert.equal(s.value.frozen, true)
  assert.equal(s.value.freezeReason, 'over-bound')
  assert.equal(s.value.settledMicroUsd, 12)
  assert.equal(s.value.outstandingMicroUsd, 6)
  assert.deepEqual(reopened.reserve(reservation('third')), {
    ok: false,
    code: 'LEDGER_SCOPE_FROZEN',
  })
  assert(
    reopened.cancelWithNoSendProof({
      ...request('second'),
      proof: proof('no-send', 'second-no-send', 0, 'second'),
    }).ok,
  )
})

test('AC3/5: request identity, fixed scopes, exact money consistency and one-use state are enforced', (t) => {
  const { ledger } = fixture(t)
  reserved(ledger)
  assert.deepEqual(ledger.reserve(reservation()), { ok: false, code: 'LEDGER_REQUEST_EXISTS' })
  assert.deepEqual(ledger.reserve({ ...reservation(), scopeId: 'other' }), {
    ok: false,
    code: 'LEDGER_REQUEST_CONFLICT',
  })
  assert.deepEqual(ledger.reserve(reservation('other', 'new-class')), {
    ok: false,
    code: 'LEDGER_SCOPE_UNKNOWN',
  })
  assert.deepEqual(ledger.consume({ ...request(), requestDigest: 'b'.repeat(64) }), {
    ok: false,
    code: 'LEDGER_REQUEST_CONFLICT',
  })
  assert.deepEqual(ledger.consume(request('absent')), { ok: false, code: 'LEDGER_REQUEST_UNKNOWN' })
  assert.deepEqual(ledger.settle({ ...request(), observation: proof('known') }), {
    ok: false,
    code: 'LEDGER_STATE_REFUSED',
  })
  const r = reservation('other')
  assert.deepEqual(ledger.reserve({ ...r, costValue: { ...r.costValue, maximumMicroUsd: 0 } }), {
    ok: false,
    code: 'LEDGER_COST_REFUSED',
  })
  assert.deepEqual(ledger.reserve({ ...r, requestDigest: 'b'.repeat(64) }), {
    ok: false,
    code: 'LEDGER_COST_REFUSED',
  })
  assert.deepEqual(ledger.reserve(r), { ok: false, code: 'LEDGER_BUDGET_EXCEEDED' })
})

test('AC3/5: callbacks see frozen copies before transaction; throws/thenables/getters cannot grant authority', (t) => {
  const { root, ledger } = fixture(t)
  reserved(ledger)
  assert(ledger.consume(request()).ok)
  let calls = 0
  const observed = open(root, {
    ...trusted,
    authenticateSettlement: (context, observation) => {
      calls++
      assert(Object.isFrozen(context))
      assert(Object.isFrozen(observation))
      // A separate write transaction succeeds because callback executes outside the mutation transaction.
      sql(root, (db) => {
        db.exec('BEGIN IMMEDIATE')
        db.exec('ROLLBACK')
      })
      return observation
    },
  })
  assert(observed.settle({ ...request(), observation: proof('known') }).ok)
  assert.equal(calls, 1)
  for (const fn of [
    () => Promise.resolve(proof('known')),
    () => {
      throw new Proxy(
        {},
        {
          get() {
            throw 'must not inspect'
          },
        },
      )
    },
    () => ({
      get accepted() {
        calls++
        return true
      },
    }),
  ]) {
    const failed = open(root, { ...trusted, authenticateSettlement: fn }).settle({
      ...request(),
      observation: null,
    })
    assert.deepEqual(failed, { ok: false, code: 'LEDGER_PROOF_REFUSED' })
  }
  assert.equal(calls, 1)
  const invalidPorts = {
    ...trusted,
    get clock() {
      calls++
      return clock
    },
  }
  assert.deepEqual(createLocalPmcLedger(openRequest(root), invalidPorts), {
    ok: false,
    code: 'LEDGER_INPUT_INVALID',
  })
  assert.equal(calls, 1)
  assert.equal(Object.isFrozen(trusted.clock), false)
})

test('AC2: missing, empty, corrupt and truncated stores never recreate or reinitialize', (t) => {
  const root = temporary(t)
  assert.deepEqual(createLocalPmcLedger(openRequest(root), trusted), {
    ok: false,
    code: 'LEDGER_STORAGE_MISSING',
  })
  writeFileSync(join(root, 'pmc-budget-v1.sqlite'), '')
  assert.deepEqual(createLocalPmcLedger(openRequest(root), trusted), {
    ok: false,
    code: 'LEDGER_STORAGE_INVALID',
  })
  assert.deepEqual(init(root), { ok: false, code: 'LEDGER_ALREADY_EXISTS' })
  writeFileSync(join(root, 'pmc-budget-v1.sqlite'), 'x'.repeat(1024))
  assert.deepEqual(createLocalPmcLedger(openRequest(root), trusted), {
    ok: false,
    code: 'LEDGER_STORAGE_INVALID',
  })
  const live = fixture(t)
  reserved(live.ledger)
  const file = join(live.root, 'pmc-budget-v1.sqlite')
  const bytes = readFileSync(file)
  writeFileSync(file, bytes.subarray(0, 100))
  assert.deepEqual(createLocalPmcLedger(openRequest(live.root), trusted), {
    ok: false,
    code: 'LEDGER_STORAGE_INVALID',
  })
})

test('AC2/5: wrong identities and unsupported schema refuse before persistent settings change', (t) => {
  const { root } = fixture(t)
  for (const patch of [
    { expectedEpoch: 'other' },
    { expectedLedgerId: 'other' },
    { expectedInitializationAuthorityDigest: 'b'.repeat(64) },
  ])
    assert.deepEqual(createLocalPmcLedger({ ...openRequest(root), ...patch }, trusted), {
      ok: false,
      code: 'LEDGER_IDENTITY_MISMATCH',
    })
  sql(root, (db) =>
    db.exec('PRAGMA ignore_check_constraints=ON; UPDATE ledger_meta SET schemaVersion=2'),
  )
  assert.deepEqual(createLocalPmcLedger(openRequest(root), trusted), {
    ok: false,
    code: 'LEDGER_SCHEMA_UNSUPPORTED',
  })
})

test('AC3: path traversal, database/journal/root links and request path fragments refuse', (t) => {
  const { root, ledger } = fixture(t)
  for (const changed of ['relative', `${root}/../other`, '//server/share', '\\\\server\\share'])
    assert.deepEqual(createLocalPmcLedger(openRequest(changed), trusted), {
      ok: false,
      code: 'LEDGER_PATH_REFUSED',
    })
  assert.deepEqual(ledger.reserve(reservation('../request')), {
    ok: false,
    code: 'LEDGER_INPUT_INVALID',
  })
  const linkRoot = temporary(t)
  const link = join(linkRoot, 'link')
  symlinkSync(root, link, process.platform === 'win32' ? 'junction' : 'dir')
  assert.deepEqual(createLocalPmcLedger(openRequest(link), trusted), {
    ok: false,
    code: 'LEDGER_PATH_REFUSED',
  })
  const journal = join(root, 'pmc-budget-v1.sqlite-journal')
  // Directory junctions require no Windows symlink privilege and must also be refused.
  symlinkSync(linkRoot, journal, process.platform === 'win32' ? 'junction' : 'dir')
  assert.deepEqual(createLocalPmcLedger(openRequest(root), trusted), {
    ok: false,
    code: 'LEDGER_PATH_REFUSED',
  })
})

test('AC5: injected clock rejects invalid, throwing and record-regressing updates without changing liability', (t) => {
  const { root, ledger } = fixture(t)
  reserved(ledger)
  for (const badClock of [
    () => '2026-09-25T12:00:00.000Z',
    () => 'invalid',
    () => Promise.resolve(clock()),
    () => {
      throw null
    },
  ]) {
    assert.deepEqual(open(root, { ...trusted, clock: badClock }).consume(request()), {
      ok: false,
      code: 'LEDGER_CLOCK_REFUSED',
    })
  }
  assert(ledger.consume(request()).ok)
  const s = ledger.snapshot({ scopeId: 'scope' })
  assert(s.ok)
  assert.equal(s.value.outstandingMicroUsd, 6)
})

test('AC2: real SQLite reserve and durable one-use consume retain all liability after reopen', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'pmc-ledger-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const initialized = initializeLocalPmcLedger(
    {
      root,
      ledgerId: 'ledger',
      epoch: 'epoch',
      initializationAuthorityDigest: digest,
      scopes: [scope],
    },
    {
      clock,
      authenticateInitialization: (request) => ({
        accepted: true,
        ledgerId: request.ledgerId,
        epoch: request.epoch,
        initializationAuthorityDigest: request.initializationAuthorityDigest,
        scopesDigest: createHash('sha256').update(JSON.stringify(request.scopes)).digest('hex'),
      }),
    },
  )
  assert.equal(initialized.ok, true)
  const open = () =>
    createLocalPmcLedger(
      {
        root,
        expectedLedgerId: 'ledger',
        expectedEpoch: 'epoch',
        expectedInitializationAuthorityDigest: digest,
      },
      {
        clock,
        authenticateSettlement: () => ({ accepted: false }),
        authenticateNoSendProof: () => ({ accepted: false }),
      },
    )
  const ledger = open()
  assert.equal(ledger.ok, true)
  if (!ledger.ok) return
  const c = cost()
  assert.equal(c.ok, true)
  if (!c.ok) return
  assert.equal(
    ledger.value.reserve({
      requestId: 'request',
      scopeId: 'scope',
      requestDigest: digest,
      costValue: c.value,
      priceEvidence: c.priceEvidence,
    }).ok,
    true,
  )
  assert.equal(ledger.value.consume({ requestId: 'request', requestDigest: digest }).ok, true)
  const reopened = open()
  assert.equal(reopened.ok, true)
  if (!reopened.ok) return
  assert.deepEqual(reopened.value.consume({ requestId: 'request', requestDigest: digest }), {
    ok: false,
    code: 'LEDGER_STATE_REFUSED',
  })
  const snapshot = reopened.value.snapshot({ scopeId: 'scope' })
  assert.equal(snapshot.ok, true)
  if (!snapshot.ok) return
  assert.equal(snapshot.value.outstandingMicroUsd, 6)
  assert.equal(snapshot.value.remainingMicroUsd, 4)
})

test('AC5: real effective settings, STRICT schema, foreign keys and checked API options', (t) => {
  const { root, ledger } = fixture(t)
  const original = DatabaseSync.prototype.prepare
  let checked = 0
  t.mock.method(
    DatabaseSync.prototype,
    'prepare',
    function (this: DatabaseSync, statement: string) {
      if (statement.startsWith('SELECT * FROM attempts WHERE scopeId=')) {
        checked++
        for (const [pragma, field, expected] of [
          ['journal_mode', 'journal_mode', 'delete'],
          ['synchronous', 'synchronous', 3],
          ['busy_timeout', 'timeout', 1000],
          ['foreign_keys', 'foreign_keys', 1],
        ] as const)
          assert.equal(original.call(this, `PRAGMA ${pragma}`).get()?.[field], expected)
        assert.throws(() => original.call(this, 'SELECT "not-a-column"'))
        assert.throws(() => this.enableLoadExtension(true))
        // defensive:true is enforced by pinned Node's checked sqlite3_db_config option.
        assert.throws(() => original.call(this, 'DELETE FROM sqlite_schema').run())
      }
      return original.call(this, statement)
    },
  )
  assert(ledger.snapshot({ scopeId: 'scope' }).ok)
  assert(checked > 0)
  t.mock.restoreAll()
  sql(root, (db) => {
    assert.equal(
      db
        .prepare(
          "SELECT count(*) AS n FROM pragma_table_list WHERE name IN ('ledger_meta','budget_scopes','attempts') AND strict=1",
        )
        .get()?.n,
      3,
    )
    assert.throws(() => db.exec("UPDATE budget_scopes SET authorizedLimitMicroUsd='bad'"))
    assert.throws(() => db.exec('UPDATE budget_scopes SET authorizedLimitMicroUsd=-1'))
  })
})

test('AC2/5: commit acknowledgement lost retains durable consume and closes its connection', (t) => {
  const { root, ledger } = fixture(t)
  reserved(ledger)
  const exec = DatabaseSync.prototype.exec
  const close = DatabaseSync.prototype.close
  let closes = 0
  t.mock.method(DatabaseSync.prototype, 'close', function (this: DatabaseSync) {
    closes++
    return close.call(this)
  })
  t.mock.method(DatabaseSync.prototype, 'exec', function (this: DatabaseSync, statement: string) {
    const value = exec.call(this, statement)
    if (statement === 'COMMIT')
      throw new Error('synthetic lost acknowledgement; no details may escape')
    return value
  })
  assert.deepEqual(ledger.consume(request()), { ok: false, code: 'LEDGER_COMMIT_UNCERTAIN' })
  assert.equal(closes, 1)
  t.mock.restoreAll()
  assert.deepEqual(open(root).consume(request()), { ok: false, code: 'LEDGER_STATE_REFUSED' })
  const s = open(root).snapshot({ scopeId: 'scope' })
  assert(s.ok)
  assert.equal(s.value.outstandingMicroUsd, 6)
})

test('AC2: commit failure before write rollback preserves reserved liability; cleanup cannot mask failure', (t) => {
  const { ledger } = fixture(t)
  reserved(ledger)
  const exec = DatabaseSync.prototype.exec
  const close = DatabaseSync.prototype.close
  let rolledBack = 0
  let closed = 0
  t.mock.method(DatabaseSync.prototype, 'exec', function (this: DatabaseSync, statement: string) {
    if (statement === 'COMMIT') throw new Error('commit not acknowledged')
    const value = exec.call(this, statement)
    if (statement === 'ROLLBACK') {
      rolledBack++
      throw new Error('cleanup error after rollback')
    }
    return value
  })
  t.mock.method(DatabaseSync.prototype, 'close', function (this: DatabaseSync) {
    closed++
    close.call(this)
    throw new Error('cleanup error after close')
  })
  assert.deepEqual(ledger.consume(request()), { ok: false, code: 'LEDGER_COMMIT_UNCERTAIN' })
  assert.equal(rolledBack, 1)
  assert(closed >= 1)
  t.mock.restoreAll()
  assert(ledger.consume(request()).ok)
})

test('AC2: real SQLite SQLITE_FULL rolls back reservation; existing liabilities stay intact', (t) => {
  const { root, ledger } = fixture(t, [{ ...scope, authorizedLimitMicroUsd: 100 }])
  reserved(ledger)
  const exec = DatabaseSync.prototype.exec
  t.mock.method(DatabaseSync.prototype, 'exec', function (this: DatabaseSync, statement: string) {
    const value = exec.call(this, statement)
    if (statement === 'BEGIN IMMEDIATE') {
      const pages = this.prepare('PRAGMA page_count').get()?.page_count
      assert.equal(typeof pages, 'number')
      exec.call(this, `PRAGMA max_page_count=${pages}`)
    }
    return value
  })
  const r = reservation('full')
  const evidence = {
    ...r.priceEvidence,
    identity: { ...r.priceEvidence.identity, providerModelId: 'x'.repeat(4096) },
    sourceProfileId: 'x'.repeat(2048),
    sourceProfileVersion: 'x'.repeat(2048),
  }
  const c = computePmcCostV1(evidence)
  assert(c.ok)
  assert.deepEqual(ledger.reserve({ ...r, priceEvidence: c.priceEvidence, costValue: c.value }), {
    ok: false,
    code: 'LEDGER_IO_FAILED',
  })
  t.mock.restoreAll()
  const s = open(root).snapshot({ scopeId: 'scope' })
  assert(s.ok)
  assert.equal(s.value.outstandingMicroUsd, 6)
  assert.deepEqual(ledger.consume(request('full')), { ok: false, code: 'LEDGER_REQUEST_UNKNOWN' })
})

test('AC2/5: read and write IO failures close connections and never leak diagnostic paths', (t) => {
  const { ledger } = fixture(t)
  reserved(ledger)
  const exec = DatabaseSync.prototype.exec
  const close = DatabaseSync.prototype.close
  let closed = 0
  t.mock.method(DatabaseSync.prototype, 'exec', function (this: DatabaseSync, statement: string) {
    if (statement === 'BEGIN IMMEDIATE')
      throw Object.assign(new Error('sensitive SQL and path'), { errcode: 10 })
    return exec.call(this, statement)
  })
  t.mock.method(DatabaseSync.prototype, 'close', function (this: DatabaseSync) {
    closed++
    return close.call(this)
  })
  assert.deepEqual(ledger.consume(request()), { ok: false, code: 'LEDGER_IO_FAILED' })
  assert.equal(closed, 1)
})

test('AC5: 256 fixed scopes accepted, 257 refused; allocation aliases and authority replay refused', (t) => {
  const scopes = Array.from({ length: 256 }, (_, n) => ({
    ...scope,
    scopeId: `s${n}`,
    workflowId: `w${n}`,
  }))
  const root = temporary(t)
  assert(init(root, scopes).ok)
  const s = open(root).snapshot({ scopeId: 's255' })
  assert(s.ok)
  assert.deepEqual(init(root), { ok: false, code: 'LEDGER_ALREADY_EXISTS' })
  assert.deepEqual(init(temporary(t), [...scopes, { ...scope, scopeId: 'extra' }]), {
    ok: false,
    code: 'LEDGER_LIMIT_EXCEEDED',
  })
  assert.deepEqual(init(temporary(t), [scope, { ...scope, scopeId: 'alias' }]), {
    ok: false,
    code: 'LEDGER_INPUT_INVALID',
  })
  assert.deepEqual(init(temporary(t), [scope, { ...scope, workflowId: 'other' }]), {
    ok: false,
    code: 'LEDGER_INPUT_INVALID',
  })
  const refusedRoot = temporary(t)
  assert.deepEqual(
    initializeLocalPmcLedger(
      {
        root: refusedRoot,
        ledgerId: 'ledger',
        epoch: 'epoch',
        initializationAuthorityDigest: digest,
        scopes: [scope],
      },
      { clock, authenticateInitialization: () => ({ accepted: false }) },
    ),
    { ok: false, code: 'LEDGER_AUTHORITY_REFUSED' },
  )
  assert(init(refusedRoot).ok)
})

function seedAttempts(root: string, groups: number, perScope: number): void {
  sql(root, (db) => {
    db.exec('BEGIN IMMEDIATE')
    const insert = db.prepare(
      "INSERT INTO attempts SELECT ?,?,requestDigest,costValueDigest,priceEvidence,maximumMicroUsd,state,actualMicroUsd,proofRef,proofDigest,proofContent,priorUnknownProofRef,priorUnknownProofDigest,createdAtUtc,updatedAtUtc FROM attempts WHERE requestId='request'",
    )
    for (let group = 0; group < groups; group++)
      for (let n = group === 0 ? 1 : 0; n < perScope; n++)
        insert.run(`r${group}-${n}`, group === 0 ? 'scope' : `scope${group}`)
    db.exec('COMMIT')
  })
}

test('AC5: 1000 attempts/scope and 10000/epoch are enforced without deleting replay IDs; full scopes reconcile', (t) => {
  const scopes = Array.from({ length: 11 }, (_, n) => ({
    ...scope,
    scopeId: n === 0 ? 'scope' : `scope${n}`,
    workflowId: `w${n}`,
    authorizedLimitMicroUsd: Number.MAX_SAFE_INTEGER,
  }))
  const { root, ledger } = fixture(t, scopes)
  reserved(ledger)
  seedAttempts(root, 10, 1000)
  assert.deepEqual(ledger.reserve(reservation('extra')), {
    ok: false,
    code: 'LEDGER_CAPACITY_EXCEEDED',
  })
  assert.deepEqual(ledger.reserve(reservation('extra', 'scope10')), {
    ok: false,
    code: 'LEDGER_CAPACITY_EXCEEDED',
  })
  assert(ledger.cancelWithNoSendProof({ ...request(), proof: proof('no-send') }).ok)
  assert.deepEqual(ledger.reserve(reservation('extra')), {
    ok: false,
    code: 'LEDGER_CAPACITY_EXCEEDED',
  })
  assert.deepEqual(ledger.reserve(reservation()), { ok: false, code: 'LEDGER_REQUEST_EXISTS' })
})

test('AC5: exact aggregate overflow refuses snapshots and new spend without losing authenticated observations', (t) => {
  const { root, ledger } = fixture(t, [
    { ...scope, authorizedLimitMicroUsd: Number.MAX_SAFE_INTEGER },
  ])
  reserved(ledger)
  assert(ledger.reserve(reservation('second')).ok)
  assert(ledger.consume(request()).ok)
  assert(ledger.consume(request('second')).ok)
  assert(
    ledger.settle({ ...request(), observation: proof('known', 'huge1', Number.MAX_SAFE_INTEGER) })
      .ok,
  )
  assert(
    ledger.settle({
      ...request('second'),
      observation: proof('known', 'huge2', Number.MAX_SAFE_INTEGER, 'second'),
    }).ok,
  )
  assert.deepEqual(open(root).snapshot({ scopeId: 'scope' }), {
    ok: false,
    code: 'LEDGER_OVERFLOW',
  })
  assert.equal(ledger.reserve(reservation('third')).ok, false)
  sql(root, (db) => {
    const stmt = db.prepare('SELECT actualMicroUsd FROM attempts')
    stmt.setReadBigInts(true)
    assert.deepEqual(
      stmt.all().map((r) => r.actualMicroUsd),
      [9007199254740991n, 9007199254740991n],
    )
  })
})

test('AC5: isolated per-scope capacity accepts attempt 1000 and refuses 1001 below global capacity', (t) => {
  const { root, ledger } = fixture(t, [
    { ...scope, authorizedLimitMicroUsd: Number.MAX_SAFE_INTEGER },
  ])
  reserved(ledger)
  seedAttempts(root, 1, 999)
  assert(ledger.reserve(reservation('thousandth')).ok)
  assert.deepEqual(ledger.reserve(reservation('one-too-many')), {
    ok: false,
    code: 'LEDGER_CAPACITY_EXCEEDED',
  })
})

test('AC5: graph/field/evidence limits and deep ownership refuse before storage', (t) => {
  const { ledger } = fixture(t)
  const r = reservation('x'.repeat(128))
  assert(ledger.reserve(r).ok)
  assert.deepEqual(ledger.reserve(reservation('x'.repeat(129))), {
    ok: false,
    code: 'LEDGER_LIMIT_EXCEEDED',
  })
  let calls = 0
  assert.deepEqual(
    ledger.consume({
      get requestId() {
        calls++
        return 'request'
      },
      requestDigest: digest,
    }),
    { ok: false, code: 'LEDGER_INPUT_INVALID' },
  )
  assert.equal(calls, 0)
  let deep: unknown = 0
  for (let n = 0; n < 17; n++) deep = { a: deep }
  assert.deepEqual(ledger.settle({ ...request(), observation: deep }), {
    ok: false,
    code: 'LEDGER_LIMIT_EXCEEDED',
  })
  const alias = Array.from({ length: 300 }, () => 'x'.repeat(4096))
  assert.deepEqual(ledger.settle({ ...request(), observation: alias }), {
    ok: false,
    code: 'LEDGER_LIMIT_EXCEEDED',
  })
  assert.deepEqual(
    ledger.settle({ ...request(), observation: Array.from({ length: 40000 }, () => 0) }),
    { ok: false, code: 'LEDGER_LIMIT_EXCEEDED' },
  )
  const huge = reservation('huge')
  const priceEvidence = {
    ...huge.priceEvidence,
    identity: { ...huge.priceEvidence.identity, providerModelId: '界'.repeat(4096) },
    sourceProfileId: '界'.repeat(2048),
    sourceProfileVersion: '界'.repeat(2048),
  }
  assert.deepEqual(ledger.reserve({ ...huge, priceEvidence }), {
    ok: false,
    code: 'LEDGER_LIMIT_EXCEEDED',
  })
  const s = ledger.snapshot({ scopeId: 'scope' })
  assert(s.ok)
  assert(Object.isFrozen(s.value))
  assert(Object.isFrozen(s.value.scope))
  assert(Object.isFrozen(ledger))
  assert.deepEqual(Object.keys(ledger).sort(), [
    'cancelWithNoSendProof',
    'consume',
    'reserve',
    'settle',
    'snapshot',
  ])
})

const ledgerModule = new URL('../src/pmc-launch/ledger.ts', import.meta.url).href

test('AC2: an existing SQLite file with unrelated schema is invalid, never initialized implicitly', (t) => {
  const root = temporary(t)
  sql(root, (db) => db.exec('CREATE TABLE unrelated (value TEXT) STRICT'))
  assert.deepEqual(createLocalPmcLedger(openRequest(root), trusted), {
    ok: false,
    code: 'LEDGER_STORAGE_INVALID',
  })
})

test('AC2: encoded local file URI preserves spaces, percent signs and hash characters', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'pmc #% ledger-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  assert(init(root).ok)
  reserved(open(root))
  assert(open(root).consume(request()).ok)
  rmSync(join(root, 'pmc-budget-v1.sqlite'))
  assert.deepEqual(createLocalPmcLedger(openRequest(root), trusted), {
    ok: false,
    code: 'LEDGER_STORAGE_MISSING',
  })
})

test('AC5: effective setting mismatch refuses rather than accepting a weaker connection', (t) => {
  const { ledger } = fixture(t)
  reserved(ledger)
  const exec = DatabaseSync.prototype.exec
  t.mock.method(DatabaseSync.prototype, 'exec', function (this: DatabaseSync, statement: string) {
    const value = exec.call(this, statement)
    if (statement.startsWith('PRAGMA journal_mode=DELETE;'))
      exec.call(this, 'PRAGMA synchronous=NORMAL')
    return value
  })
  assert.deepEqual(ledger.consume(request()), { ok: false, code: 'LEDGER_SETTINGS_REFUSED' })
})

test('AC4: initialization scopes and snapshot digests use the literal declared field order', (t) => {
  assert.equal(
    createHash('sha256')
      .update(JSON.stringify([scope]))
      .digest('hex'),
    '46c123b4f2bb959d2c4aa7b663bc3a2bc319d21619900598e92cd268b65cda1d',
  )
  const { ledger } = fixture(t)
  const s = ledger.snapshot({ scopeId: 'scope' })
  assert(s.ok)
  assert.equal(
    s.value.snapshotDigest,
    '0bf7f051c291717706736f26801e8a955fa8df711979c8c47499f8352697e828',
  )
})

test('AC5: bounded proof text accepts 4096 units, rejects 4097, and remains private in diagnostics', (t) => {
  const { ledger } = fixture(t)
  reserved(ledger)
  assert.deepEqual(
    ledger.cancelWithNoSendProof({ ...request(), proof: proof('no-send', 'p'.repeat(4097)) }),
    { ok: false, code: 'LEDGER_LIMIT_EXCEEDED' },
  )
  const accepted = ledger.cancelWithNoSendProof({
    ...request(),
    proof: proof('no-send', 'p'.repeat(4096)),
  })
  assert(accepted.ok)
  assert.equal(accepted.value.proofRef?.length, 4096)
})

test('AC5: close failure after a durable mutation refuses success and does not permit duplicate consume', (t) => {
  const { root, ledger } = fixture(t)
  reserved(ledger)
  const close = DatabaseSync.prototype.close
  t.mock.method(DatabaseSync.prototype, 'close', function (this: DatabaseSync) {
    close.call(this)
    throw new Error('close failure')
  })
  assert.deepEqual(ledger.consume(request()), { ok: false, code: 'LEDGER_IO_FAILED' })
  t.mock.restoreAll()
  assert.deepEqual(open(root).consume(request()), { ok: false, code: 'LEDGER_STATE_REFUSED' })
})

test('AC2/5: changed durable money evidence is unverifiable and cannot lower outstanding liability', (t) => {
  const { root, ledger } = fixture(t)
  reserved(ledger)
  sql(root, (db) => db.exec('UPDATE attempts SET maximumMicroUsd=0'))
  assert.deepEqual(ledger.snapshot({ scopeId: 'scope' }), {
    ok: false,
    code: 'LEDGER_STORAGE_INVALID',
  })
  assert.deepEqual(ledger.consume(request()), { ok: false, code: 'LEDGER_STORAGE_INVALID' })
  assert.equal(ledger.reserve(reservation('new')).ok, false)
})

test('AC3: authentication callback state races are rechecked inside the write transaction', (t) => {
  const { root, ledger } = fixture(t)
  reserved(ledger)
  assert(ledger.consume(request()).ok)
  const concurrent = open(root, {
    ...trusted,
    authenticateSettlement: (_context, observation) => {
      assert(ledger.cancelWithNoSendProof({ ...request(), proof: proof('no-send', 'winner') }).ok)
      return observation
    },
  })
  assert.deepEqual(concurrent.settle({ ...request(), observation: proof('known', 'loser') }), {
    ok: false,
    code: 'LEDGER_STATE_REFUSED',
  })
  const s = ledger.snapshot({ scopeId: 'scope' })
  assert(s.ok)
  assert.equal(s.value.remainingMicroUsd, 10)
})

test('AC2: durable capability cannot recreate its database after deletion', (t) => {
  const { root, ledger } = fixture(t)
  reserved(ledger)
  rmSync(join(root, 'pmc-budget-v1.sqlite'))
  assert.deepEqual(ledger.consume(request()), { ok: false, code: 'LEDGER_STORAGE_MISSING' })
  assert.deepEqual(ledger.snapshot({ scopeId: 'scope' }), {
    ok: false,
    code: 'LEDGER_STORAGE_MISSING',
  })
})

const childPrelude = `import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { initializeLocalPmcLedger, createLocalPmcLedger } from ${JSON.stringify(ledgerModule)};
const clock=()=>${JSON.stringify(clock())};
const ports={clock,authenticateSettlement:(_c,o)=>o,authenticateNoSendProof:(_c,p)=>p};`
function child(t: TestContext, code: string) {
  const proc = spawn(
    process.execPath,
    ['--import', 'tsx', '--input-type=module', '-e', childPrelude + code],
    {
      cwd: new URL('..', import.meta.url),
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      windowsHide: true,
    },
  )
  let stderr = ''
  proc.stderr?.on('data', (d) => {
    stderr += String(d)
  })
  const exit = once(proc, 'exit')
  t.after(() => {
    if (proc.exitCode === null) proc.kill('SIGKILL')
  })
  return { proc, exit, stderr: () => stderr }
}
function message(
  proc: ReturnType<typeof spawn>,
  predicate: (v: unknown) => boolean,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const onMessage = (value: unknown) => {
      if (!predicate(value)) return
      proc.off('message', onMessage)
      proc.off('exit', onExit)
      resolve(value)
    }
    const onExit = () => {
      proc.off('message', onMessage)
      reject(new Error('child exited before expected message'))
    }
    proc.on('message', onMessage)
    proc.once('exit', onExit)
  })
}

test('AC2: independent processes cannot oversubscribe one real SQLite scope', {
  timeout: 20000,
}, async (t) => {
  const { root, ledger } = fixture(t)
  const workers = Array.from({ length: 4 }, (_, n) =>
    child(
      t,
      `
    const opened=createLocalPmcLedger(${JSON.stringify(openRequest(root))},ports);
    if(!opened.ok)throw new Error(JSON.stringify(opened));
    process.on('message',()=>{process.send(opened.value.reserve(${JSON.stringify(reservation(`parallel${n}`))}));process.disconnect();});
    process.send('ready');`,
    ),
  )
  await Promise.all(workers.map((w) => message(w.proc, (v) => v === 'ready')))
  const outcomes = workers.map((w) =>
    message(w.proc, (v) => typeof v === 'object' && v !== null && 'ok' in v),
  )
  workers.forEach((w) => {
    w.proc.send('go')
  })
  const results = (await Promise.all(outcomes)).map(
    (value) => value as { ok: boolean; code?: string },
  )
  await Promise.all(workers.map((w) => w.exit))
  assert.equal(results.filter((r) => r.ok).length, 1)
  for (const failure of results.filter((r) => !r.ok))
    assert.equal(failure.code, 'LEDGER_BUDGET_EXCEEDED')
  const s = ledger.snapshot({ scopeId: 'scope' })
  assert(s.ok)
  assert.equal(s.value.outstandingMicroUsd, 6)
})

test('AC2: real lock contention times out, killed writer recovers, and old liability remains', {
  timeout: 20000,
}, async (t) => {
  const { root, ledger } = fixture(t)
  reserved(ledger)
  const worker = child(
    t,
    `const db=new DatabaseSync(${JSON.stringify(join(root, 'pmc-budget-v1.sqlite'))});
    db.exec('BEGIN IMMEDIATE');db.exec("UPDATE attempts SET state='consumed'");
    process.send('locked');setInterval(()=>{ if(!db.isOpen)process.exit(98); },1000);`,
  )
  await message(worker.proc, (v) => v === 'locked')
  const start = performance.now()
  assert.deepEqual(ledger.consume(request()), { ok: false, code: 'LEDGER_BUSY' })
  const elapsed = performance.now() - start
  assert(elapsed >= 800 && elapsed < 5000, `busy wait ${elapsed}`)
  worker.proc.kill('SIGKILL')
  await worker.exit
  assert(open(root).consume(request()).ok)
  const s = ledger.snapshot({ scopeId: 'scope' })
  assert(s.ok)
  assert.equal(s.value.outstandingMicroUsd, 6)
})

for (const race of ['initialize', 'consume'] as const) {
  test(`AC2: parallel process ${race} has exactly one durable winner`, {
    timeout: 20000,
  }, async (t) => {
    const root = temporary(t)
    if (race === 'consume') {
      assert(init(root).ok)
      reserved(open(root))
    }
    const initRequest = {
      root,
      ledgerId: 'ledger',
      epoch: 'epoch',
      initializationAuthorityDigest: digest,
      scopes: [scope],
    }
    const action =
      race === 'consume'
        ? `createLocalPmcLedger(${JSON.stringify(openRequest(root))},ports).value.consume(${JSON.stringify(request())})`
        : `initializeLocalPmcLedger(${JSON.stringify(initRequest)},{clock,authenticateInitialization:r=>({accepted:true,ledgerId:r.ledgerId,epoch:r.epoch,initializationAuthorityDigest:r.initializationAuthorityDigest,scopesDigest:createHash('sha256').update(JSON.stringify(r.scopes)).digest('hex')})})`
    const workers = Array.from({ length: 3 }, () =>
      child(
        t,
        `process.on('message',()=>{process.send(${action});process.disconnect();});process.send('ready');`,
      ),
    )
    await Promise.all(workers.map((w) => message(w.proc, (v) => v === 'ready')))
    const outcomes = workers.map((w) =>
      message(w.proc, (v) => !!v && typeof v === 'object' && 'ok' in v),
    )
    for (const w of workers) w.proc.send('go')
    const results = (await Promise.all(outcomes)) as { ok: boolean; code?: string }[]
    await Promise.all(workers.map((w) => w.exit))
    assert.equal(results.filter((r) => r.ok).length, 1)
    for (const r of results.filter((r) => !r.ok))
      assert.equal(r.code, race === 'consume' ? 'LEDGER_STATE_REFUSED' : 'LEDGER_ALREADY_EXISTS')
    const s = open(root).snapshot({ scopeId: 'scope' })
    assert(s.ok)
    assert.equal(s.value.outstandingMicroUsd, race === 'consume' ? 6 : 0)
  })
}

for (const operation of [
  'initialize',
  'reserve',
  'consume',
  'unknown',
  'settle',
  'cancel',
  'snapshot',
] as const) {
  for (const boundary of ['before', 'after'] as const) {
    test(`AC2: process crash ${boundary} ${operation} commit preserves durable state`, {
      timeout: 15000,
    }, async (t) => {
      const root = temporary(t)
      if (operation !== 'initialize') {
        assert(init(root).ok)
        const ledger = open(root)
        if (operation !== 'reserve') reserved(ledger)
        if (
          operation === 'settle' ||
          operation === 'cancel' ||
          operation === 'unknown' ||
          operation === 'snapshot'
        )
          assert(ledger.consume(request()).ok)
      }
      const initialize = `{root:${JSON.stringify(root)},ledgerId:'ledger',epoch:'epoch',initializationAuthorityDigest:${JSON.stringify(digest)},scopes:${JSON.stringify([scope])}}`
      const action =
        operation === 'initialize'
          ? `initializeLocalPmcLedger(${initialize},{clock,authenticateInitialization:r=>({accepted:true,ledgerId:r.ledgerId,epoch:r.epoch,initializationAuthorityDigest:r.initializationAuthorityDigest,scopesDigest:createHash('sha256').update(JSON.stringify(r.scopes)).digest('hex')})})`
          : operation === 'reserve'
            ? `ledger.reserve(${JSON.stringify(reservation())})`
            : operation === 'consume'
              ? `ledger.consume(${JSON.stringify(request())})`
              : operation === 'snapshot'
                ? `ledger.snapshot({scopeId:'scope'})`
                : operation === 'unknown'
                  ? `ledger.settle(${JSON.stringify({ ...request(), observation: proof('unknown') })})`
                  : operation === 'settle'
                    ? `ledger.settle(${JSON.stringify({ ...request(), observation: proof('known') })})`
                    : `ledger.cancelWithNoSendProof(${JSON.stringify({ ...request(), proof: proof('no-send') })})`
      const worker = child(
        t,
        `
        ${operation === 'initialize' ? '' : `const opened=createLocalPmcLedger(${JSON.stringify(openRequest(root))},ports);if(!opened.ok)throw 0;const ledger=opened.value;`}
        const exec=DatabaseSync.prototype.exec;let writing=false;
        DatabaseSync.prototype.exec=function(s){if(s==='BEGIN IMMEDIATE'${operation === 'snapshot' ? "||s==='BEGIN'" : ''})writing=true;
          if(s==='COMMIT'&&writing){${boundary === 'before' ? "process.kill(process.pid,'SIGKILL');" : ''}
            const value=exec.call(this,s);${boundary === 'after' ? "process.kill(process.pid,'SIGKILL');" : ''}return value;}
          return exec.call(this,s);};
        ${action};process.exit(99);`,
      )
      const [code] = await worker.exit
      assert.notEqual(code, 99, worker.stderr())
      if (operation === 'initialize' && boundary === 'before') {
        assert.equal(createLocalPmcLedger(openRequest(root), trusted).ok, false)
        assert.deepEqual(init(root), { ok: false, code: 'LEDGER_ALREADY_EXISTS' })
        return
      }
      const ledger = open(root)
      const s = ledger.snapshot({ scopeId: 'scope' })
      assert(s.ok)
      const expectedOutstanding =
        operation === 'initialize' ||
        (operation === 'reserve' && boundary === 'before') ||
        ((operation === 'settle' || operation === 'cancel') && boundary === 'after')
          ? 0
          : 6
      assert.equal(s.value.outstandingMicroUsd, expectedOutstanding)
      assert.equal(s.value.settledMicroUsd, operation === 'settle' && boundary === 'after' ? 3 : 0)
      if (operation === 'consume' && boundary === 'after')
        assert.deepEqual(ledger.consume(request()), { ok: false, code: 'LEDGER_STATE_REFUSED' })
      if (operation === 'settle' || operation === 'cancel')
        assert.equal(ledger.consume(request()).ok, false)
    })
  }
}
