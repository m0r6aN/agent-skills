/**
 * P1b rework REQUIRED 1 (reviewer finding): prove the caller-supplied
 * `projectKey` is USED, not merely accepted. Every other test passes
 * `projectKey: 'KONE'`, so a mutant that ignores the parameter and hardcodes
 * 'KONE' is value-indistinguishable from the real thing — a regression back to
 * a hardcoded KONE would be invisible. These tests register/preview with a
 * NON-KONE key ('ACME') and assert that value reaches the JQL and payloads.
 *
 * Gate note (checked first, per the coordinator's instruction): the committed
 * allowlist admits ONLY 'KONE', and weakening it to make this test convenient
 * is prohibited. So:
 *  - `preview()` is the gate-free full-fidelity path (zero adapter calls) —
 *    payloads and planned actions are asserted end-to-end with 'ACME'.
 *  - `register()` is asserted UP TO the gate: the idempotency search JQL
 *    (issued before any gated create) must carry 'ACME', and the run must then
 *    refuse at the gate with a RegistrationGateError naming 'ACME' — which
 *    doubles as evidence the gate's independent enforcement is untouched.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { preview, register } from '../src/register.js'
import { RegistrationGateError } from '../src/types.js'
import { FakeAdapter, singleStoryFixture } from './helpers.js'

const TS = '2026-08-18T12:00:00Z'

test('preview(): a non-KONE projectKey reaches every payload and planned action', () => {
  const fx = singleStoryFixture()
  const adapter = new FakeAdapter()

  const result = preview({ slug: fx.slug, projectKey: 'ACME', repoRoot: fx.repoRoot, adapter })

  assert.equal(result.epicPayload.fields.project.key, 'ACME')
  for (const story of result.storyPayloads) {
    assert.equal(story.fields.project.key, 'ACME')
  }
  const searchActions = result.plannedActions.filter((a) => a.includes('search ACME for stable id'))
  assert.equal(searchActions.length, 2, 'epic + story planned searches must both name ACME')
  assert.equal(
    result.plannedActions.some((a) => a.includes('KONE')),
    false,
    'no planned action may fabricate KONE when the caller declared ACME',
  )
  // preview stays adapter-free even with a non-allowlisted key.
  assert.equal(adapter.searchCalls.length, 0)
  assert.equal(adapter.createCalls.length, 0)
})

test('register(): a non-KONE projectKey reaches the search JQL; the untouched gate then refuses it', async () => {
  const fx = singleStoryFixture()
  const adapter = new FakeAdapter()

  await assert.rejects(
    register({ slug: fx.slug, projectKey: 'ACME', repoRoot: fx.repoRoot, adapter, timestamp: TS }),
    (err: unknown) =>
      err instanceof RegistrationGateError &&
      err.message.includes('"ACME"') &&
      err.message.includes('not in the allowlist'),
  )

  // The caller's key reached the JQL boundary BEFORE the gate refusal:
  // the idempotency search is ungated (read-only) and must carry ACME.
  assert.equal(adapter.searchCalls.length, 1)
  assert.ok(
    adapter.searchCalls[0]?.includes('project = ACME'),
    `idempotency JQL must use the caller's key, got: ${adapter.searchCalls[0]}`,
  )
  assert.equal(
    adapter.searchCalls[0]?.includes('KONE'),
    false,
    'the search JQL must not fabricate KONE',
  )
  // Nothing gated ever ran with the refused key.
  assert.equal(adapter.createCalls.length, 0)
  assert.equal(adapter.updateCalls.length, 0)
})
