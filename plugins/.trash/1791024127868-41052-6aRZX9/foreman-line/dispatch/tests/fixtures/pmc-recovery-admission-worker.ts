import { DatabaseSync } from 'node:sqlite'
import { createOfflineRecoveryAdmissionV1 } from '../../src/pmc-launch/recovery-admission.js'

const input = JSON.parse(process.argv[2] ?? '')
if (input.mode === 'race') {
  process.stdout.write(`${JSON.stringify(createOfflineRecoveryAdmissionV1(input.input))}\n`)
  process.exit(0)
}
if (input.mode === 'fault') {
  const original = DatabaseSync.prototype.exec
  let commits = 0
  DatabaseSync.prototype.exec = function (sql: string) {
    if (sql === 'COMMIT') {
      commits++
      const target = input.phase === 'b1' ? 1 : 2
      if (commits === target) {
        if (input.after) original.call(this, sql)
        throw new Error('injected commit acknowledgement loss')
      }
    }
    return original.call(this, sql)
  }
  try {
    process.stdout.write(`${JSON.stringify(createOfflineRecoveryAdmissionV1(input.input))}\n`)
  } finally {
    DatabaseSync.prototype.exec = original
  }
  process.exit(0)
}
throw new Error('Unknown recovery admission worker mode')
