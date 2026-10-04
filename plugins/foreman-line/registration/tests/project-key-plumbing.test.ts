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
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import type { ForemanConfig } from '../../foreman-config/src/index.js'
import { preview, register } from '../src/register.js'
import { RegistrationError, RegistrationGateError } from '../src/types.js'
import { FakeAdapter, singleStoryFixture } from './helpers.js'

const TS = '2026-08-18T12:00:00Z'

/**
 * D2/D3 identity wiring: the durable home of the project key is
 * `foreman/config.yaml`'s `identity:` block. Build a validated-shape config
 * carrying exactly the identity under test (queue explicitly null).
 */
function configIdentity(projectKey: string | null): ForemanConfig {
  return {
    identity: {
      project_key: projectKey,
      base_branch: 'main',
      branch_prefix: 'feat/',
      worktree_root: '../worktrees',
      dispatch_queue: null,
    },
    stack: { profile: 'none' },
    capabilities: {},
    policy: { audit: { require_security_audit_at: [] } },
  }
}

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

// ─── D2/D3: repository identity is injected from foreman/config.yaml ─────────

test('D2: preview() takes the project key from foreman/config.yaml identity when projectKey is omitted', () => {
  const fx = singleStoryFixture()
  const adapter = new FakeAdapter()
  const result = preview({
    slug: fx.slug,
    foremanConfig: configIdentity('ACME'),
    repoRoot: fx.repoRoot,
    adapter,
  })
  assert.equal(result.epicPayload.fields.project.key, 'ACME')
  for (const payload of result.storyPayloads) {
    assert.equal(payload.fields.project.key, 'ACME')
  }
  const searchActions = result.plannedActions.filter((a) => a.includes('search'))
  assert.equal(
    searchActions.length > 0 && searchActions.every((a) => a.includes('ACME')),
    true,
    'every planned search action must name the config-declared key',
  )
  assert.equal(adapter.createCalls.length, 0)
})

test('D2: a projectKey that contradicts foreman/config.yaml identity is a typed refusal', () => {
  // The refusal fires in resolveProjectKey, before any filesystem use.
  const root = join(tmpdir(), 'foreman-line-identity-contradiction')
  assert.throws(
    () =>
      preview({
        slug: 'x',
        projectKey: 'KONE',
        foremanConfig: configIdentity('ACME'),
        repoRoot: root,
      }),
    (err: unknown) => err instanceof RegistrationError && /does not match/.test(err.message),
  )
})

test('D2: identity.project_key: null refuses registration (explicit no-tracker declaration)', () => {
  const root = join(tmpdir(), 'foreman-line-identity-null')
  assert.throws(
    () => preview({ slug: 'x', foremanConfig: configIdentity(null), repoRoot: root }),
    (err: unknown) =>
      err instanceof RegistrationError && /registration is not available/.test(err.message),
  )
})

test('D2: register() refuses a contradicted config identity before any adapter call', async () => {
  const adapter = new FakeAdapter()
  await assert.rejects(
    () =>
      register({
        slug: 'x',
        projectKey: 'KONE',
        foremanConfig: configIdentity('ACME'),
        repoRoot: join(tmpdir(), 'foreman-line-identity-contradiction'),
        adapter,
        timestamp: TS,
      }),
    (err: unknown) => err instanceof RegistrationError && /does not match/.test(err.message),
  )
  assert.equal(adapter.searchCalls.length, 0)
  assert.equal(adapter.createCalls.length, 0)
  assert.equal(adapter.updateCalls.length, 0)
})
