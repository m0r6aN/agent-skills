/**
 * Model-gate tests.  Run:  node --test plugins/foreman-line/hooks/
 *
 * Deliberately dependency-free and NOT an npm package - see README.md, "Why
 * this is not a package". Every case drives the real script as a subprocess,
 * because the thing under test is its EXIT CODE: 2 is the only value that
 * blocks a tool call, and asserting on anything else would prove nothing.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(HERE, 'model-gate.mjs')

/** Returns { code, stdout, stderr } - never throws on a non-zero exit. */
function run(mode, payload, env = {}) {
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT, mode], {
      input: JSON.stringify(payload),
      encoding: 'utf8',
      env: { ...process.env, FL_MODEL_GATE: '', ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { code: 0, stdout, stderr: '' }
  } catch (err) {
    return { code: err.status ?? 1, stdout: err.stdout ?? '', stderr: err.stderr ?? '' }
  }
}

/** Drive both events for one session id, returning the pre-tool exit code. */
function gate(sessionId, model, env = {}) {
  run('session-start', model === undefined ? { session_id: sessionId } : { session_id: sessionId, model }, env)
  return run('pre-tool', { session_id: sessionId }, env)
}

test('an approved model allows tool calls', () => {
  for (const m of ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-fable-5-1', 'gpt-6.1-sol']) {
    assert.equal(gate(`ok-${m}`, m).code, 0, `${m} should be allowed`)
  }
})

test('the 1M-context variant is BLOCKED, and named as such', () => {
  const r = gate('blk-1m', 'claude-opus-5-5[1m]')
  assert.equal(r.code, 2, 'must block')
  assert.match(r.stderr, /1M-context/i)
  // The remedy must be the non-1m base model, not a generic default, and it
  // must be a runnable `pi` launch line (Amendment 06 N2).
  assert.match(r.stderr, /pi --model anthropic\/claude-opus-5-5\b/)
})

test('byte-exact matching is what rejects [1m] - not a special case', () => {
  // Proves the mechanism: any suffix fails membership on its own.
  assert.equal(gate('blk-suffix', 'claude-opus-5-5-preview').code, 2)
})

test('AMENDMENT 04: the superseded ids are retired, and say what replaced them', () => {
  // The rename is the whole point of Amendment 06 N4. If an old id were
  // merely dropped rather than retired, the block message would say "not on the
  // approved roster" and a developer would have no idea what to run instead.
  for (const [old, next] of [
    ['claude-opus-5', 'claude-opus-5-5'],
    ['claude-sonnet-5', 'claude-sonnet-5-5'],
    ['claude-fable-5', 'claude-fable-5-1'],
  ]) {
    const r = gate(`blk-superseded-${old}`, old)
    assert.equal(r.code, 2, `${old} must no longer be approved`)
    assert.match(r.stderr, new RegExp(`Superseded by ${next}`), `${old} must name ${next}`)
  }
})

test('AMENDMENT 04: OpenRouter dotted slugs are a different namespace and never match', () => {
  // N1 keeps two namespaces and forbids deriving one from the other. The
  // dotted OpenRouter spelling is not a session identity; if it ever started
  // matching here, the gate would have grown an alias.
  assert.equal(gate('blk-dotted', 'claude-opus-5.5').code, 2)
  assert.equal(gate('blk-or-prefixed', 'openrouter/anthropic/claude-opus-5.5').code, 2)
})

test('a retired model is BLOCKED with its reason', () => {
  const r = gate('blk-retired', 'claude-sonnet-4-6')
  assert.equal(r.code, 2)
  assert.match(r.stderr, /below grade/i)
})

test('an unknown model is BLOCKED', () => {
  assert.equal(gate('blk-unknown', 'gpt-6').code, 2)
})

test('FAIL CLOSED: an absent model field blocks', () => {
  const r = gate('blk-absent', undefined)
  assert.equal(r.code, 2, 'unverified must not pass')
  assert.match(r.stderr, /did not report a model/i)
})

test('the escape hatch releases a blocked session', () => {
  for (const v of ['off', 'OFF', '0', 'false']) {
    assert.equal(gate(`hatch-${v}`, 'claude-opus-5[1m]', { FL_MODEL_GATE: v }).code, 0, v)
  }
})

test('a session with no recorded verdict is allowed, not bricked', () => {
  // Sessions predating the hook must keep working, or the gate gets switched off.
  assert.equal(run('pre-tool', { session_id: `unseen-${Date.now()}` }).code, 0)
})

test('SessionStart never blocks, whatever the verdict', () => {
  assert.equal(run('session-start', { session_id: 's1', model: 'claude-sonnet-4-6' }).code, 0)
  assert.equal(run('session-start', { session_id: 's2', model: 'claude-opus-5[1m]' }).code, 0)
})

test('SessionStart explains a block on stdout, so it reaches the session', () => {
  const r = run('session-start', { session_id: 's3', model: 'claude-opus-5[1m]' })
  assert.match(r.stdout, /MODEL GATE - BLOCKED/)
  assert.match(r.stdout, /Tool calls are denied/)
})

test('REGRESSION: an unidentifiable session cannot poison another session', () => {
  // Found by this suite on first run. Sessions with no session_id all shared one
  // "unknown" state key, so a BLOCK verdict written by one was read back by the
  // next and blocked it - a gate firing on the wrong session. Verdicts are now
  // keyed only when the session can actually be identified.
  const blocked = run('session-start', { model: 'claude-opus-5[1m]' }) // no session_id
  assert.equal(blocked.code, 0, 'session-start still must not block')

  // A different unidentifiable session must be unaffected...
  assert.notEqual(run('pre-tool', {}).code, 2, 'shared-key contamination has returned')

  // ...and so must an identifiable one that was never evaluated.
  assert.equal(run('pre-tool', { session_id: `clean-${Date.now()}` }).code, 0)
})

test('malformed input never traps a developer', () => {
  // A governance hook that crashes-closed is worse than the drift it prevents.
  for (const mode of ['pre-tool', 'session-start', 'nonsense-mode']) {
    const r = run(mode, {})
    assert.notEqual(r.code, 2, `${mode} must not block on empty payload`)
  }
})

test('D6 THINNESS: the policy is session-roster data only - no routing, provider, fallback, or approval keys', () => {
  // D6: hooks report or block a host-visible violation; they must never become
  // a second routing or approval engine. If a steering key ever appears in
  // this policy, the hook has grown a surface that belongs to routing-policy
  // (and a fallbackModels-style key would also be the hidden fallback path D9
  // forbids). Refuse that growth mechanically rather than by review memory.
  const policy = JSON.parse(readFileSync(join(HERE, 'model-gate.policy.json'), 'utf8'))
  assert.ok(
    Object.keys(policy.approved ?? {}).length > 0,
    'membership pin: the scan must see a real roster, not an emptied document',
  )
  const banned =
    /^(routing|route|routes|lane|lanes|fallback|fallbacks|fallbackModels|provider|providers|approval|approvals|approve|budget)$/i
  const offenders = []
  const walk = (node, path) => {
    if (Array.isArray(node)) {
      node.forEach((value, i) => walk(value, `${path}[${i}]`))
      return
    }
    if (node !== null && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        if (banned.test(key)) offenders.push(`${path}.${key}`)
        walk(value, `${path}.${key}`)
      }
    }
  }
  walk(policy, '$')
  assert.deepEqual(offenders, [], `policy carries steering keys: ${offenders.join(', ')}`)
})
