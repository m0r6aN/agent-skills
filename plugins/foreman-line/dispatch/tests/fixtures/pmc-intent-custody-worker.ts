// Offline process fixture only. These issuers are never production authority.

import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { openIntentOwnerV1 } from '../../src/pmc-launch/intent-custody.js'

const argument = process.argv[2]
if (!argument) throw new Error('Missing worker fixture input')
const input = JSON.parse(argument)
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`
  if (v && typeof v === 'object')
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`)
      .join(',')}}`
  return JSON.stringify(v)
}
if (input.mode === 'cas') {
  const db = new DatabaseSync(join(input.root, 'pmc-intent-v1.sqlite'), { timeout: 1000 })
  try {
    db.exec('BEGIN IMMEDIATE')
    const changes = db
      .prepare(
        'UPDATE intents SET stateJson=?, revision=revision+1 WHERE intentRef=? AND revision=?',
      )
      .run(canonical(input.state), 'intent', input.revision).changes
    db.exec('COMMIT')
    process.stdout.write(JSON.stringify({ changes: Number(changes) }))
  } finally {
    db.close()
  }
} else if (input.mode === 'crash') {
  const origin = Object.freeze({}),
    selected = Object.freeze({}),
    completion = Object.freeze({})
  const opened = openIntentOwnerV1(
    { root: input.root, expectedIdentity: input.identity },
    {
      clock: () => input.now,
      authenticateOrigin: (_a: unknown, _s: unknown, _p: unknown, cap: object) =>
        cap === origin ? input.originAnswer : { accepted: false },
      authenticateSelection: (_a: unknown, _d: unknown, cap: object) =>
        cap === selected ? { accepted: true, selection: input.selection } : { accepted: false },
      authenticateCompletion: (_a: unknown, _s: unknown, cap: object) =>
        cap === completion
          ? {
              accepted: true,
              kind: 'terminal-no-send',
              proof: { proofRef: 'proof', proofDigest: 'e'.repeat(64), ledger: null },
              reason: null,
            }
          : { accepted: false },
    },
  )
  if (!opened.ok) throw new Error('Worker open refused')
  const fault = () => {
    const original = DatabaseSync.prototype.exec
    DatabaseSync.prototype.exec = function (sql: string) {
      if (sql === 'COMMIT') {
        if (input.after) original.call(this, sql)
        process.exit(71)
      }
      return original.call(this, sql)
    }
  }
  if (input.phase === 'begin') fault()
  const b = opened.value.owner.begin(input.proposal, origin)
  if (!b.ok) throw new Error('Worker begin refused')
  if (input.phase === 'selection') fault()
  if (!opened.value.owner.recordDecision(b.value.claim, selected).ok)
    throw new Error('Worker selection refused')
  if (input.phase === 'finish') fault()
  opened.value.owner.finish(b.value.claim, completion)
  throw new Error('Crash point was not reached')
} else {
  const capability = Object.freeze({})
  const opened = openIntentOwnerV1(
    { root: input.root, expectedIdentity: input.identity },
    {
      clock: () => input.now,
      authenticateOrigin: (_a: unknown, _s: unknown, _p: unknown, cap: object) =>
        cap === capability ? input.originAnswer : { accepted: false },
      authenticateSelection: () => ({ accepted: false }),
      authenticateCompletion: () => ({ accepted: false }),
    },
  )
  if (!opened.ok) throw new Error('Worker open refused')
  process.stdout.write('READY\n')
  process.stdin.once('data', () => {
    process.stdout.write(
      `${JSON.stringify(opened.value.owner.begin(input.proposal, capability))}\n`,
    )
    process.stdin.destroy()
  })
}
