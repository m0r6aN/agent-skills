import assert from 'node:assert/strict'
import test from 'node:test'
import { alertFingerprint, signalFingerprint } from '../src/acknowledgements.js'

test('signal acknowledgement fingerprint is stable for identical evidence and changes for every evidence field', () => {
  const signal = {
    class: 'session-state',
    repo: '/repo',
    subject: 'session-1',
    evidence: ['exit:1'],
  }
  const fingerprint = signalFingerprint(signal)
  assert.equal(signalFingerprint({ ...signal }), fingerprint)
  for (const changed of [
    { ...signal, class: 'other' },
    { ...signal, repo: '/other' },
    { ...signal, subject: 'session-2' },
    { ...signal, evidence: ['exit:2'] },
  ])
    assert.notEqual(signalFingerprint(changed), fingerprint)
})

test('alert fingerprint changes when kind, rule, or failure code changes but ignores elapsed time', () => {
  const alert = { kind: 'failed', rule: 'R1', failureCode: 'exit-1' }
  const fingerprint = alertFingerprint(alert)
  assert.equal(alertFingerprint({ ...alert }), fingerprint)
  assert.notEqual(alertFingerprint({ ...alert, kind: 'hung' }), fingerprint)
  assert.notEqual(alertFingerprint({ ...alert, rule: 'R2' }), fingerprint)
  assert.notEqual(alertFingerprint({ ...alert, failureCode: 'exit-2' }), fingerprint)
})
