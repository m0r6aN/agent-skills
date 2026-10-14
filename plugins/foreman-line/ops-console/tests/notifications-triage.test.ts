import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { acknowledge, alertFingerprint } from '../src/acknowledgements.js'
import type { Alert } from '../src/alerts.js'
import { deleteNotification, syncAlerts } from '../src/notifications.js'

const alert: Alert = {
  id: 'goal-a:parcel-1:hung',
  kind: 'hung',
  goal: 'goal-a',
  parcel: 'parcel-1',
  rule: 'rule-a',
  detail: 'hung',
  observedAt: '2026-01-01T00:00:00.000Z',
}

test('a deleted notification stays dismissed while its alert evidence is unchanged', () => {
  const stateDir = mkdtempSync(join(tmpdir(), 'foc-triage-'))
  try {
    const first = syncAlerts(stateDir, [alert], Date.parse(alert.observedAt))
    assert.equal(first.length, 1)
    acknowledge(
      stateDir,
      { id: alert.id, fingerprint: alertFingerprint(alert), at: '', note: 'dismiss' },
      Date.parse(alert.observedAt),
    )
    assert.equal(deleteNotification(stateDir, first[0]?.id ?? ''), true)
    assert.deepEqual(syncAlerts(stateDir, [alert], Date.parse(alert.observedAt) + 86_400_000), [])
    const changed = { ...alert, rule: 'rule-b' }
    assert.equal(
      syncAlerts(stateDir, [changed], Date.parse(alert.observedAt) + 2 * 86_400_000).length,
      1,
    )
  } finally {
    rmSync(stateDir, { recursive: true, force: true })
  }
})
