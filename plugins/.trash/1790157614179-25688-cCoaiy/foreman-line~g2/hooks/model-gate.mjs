#!/usr/bin/env node
/**
 * Foreman Line model gate.
 *
 * Enforces that a session runs on an approved model, mechanically, instead of
 * asking an agent to read a loop directive and behave. Before this existed the
 * D69(b) `[1m]` rule lived entirely in markdown: a `claude-opus-5[1m]` session
 * passed every check in the repo, which is how one came to author the D69
 * amendment and claim the worker-fabric queue.
 *
 * Two events, because neither can do the job alone:
 *
 *   session-start  SessionStart is the ONLY event carrying the model id, and it
 *                  cannot block. So it records the verdict and explains it.
 *   pre-tool       PreToolUse CAN block (exit 2) but never sees the model. So it
 *                  reads what session-start recorded and denies every tool call
 *                  while the verdict is BLOCK.
 *
 * Fail closed: SessionStart's `model` field is optional and is not always sent.
 * An absent model is "not verified", and not verified is a refusal - the same
 * rule the Line applies to every other absent check (a check that did not run
 * reports not-evaluated and fails, it does not pass quietly).
 *
 * Never throws. A crashing governance hook that blocks every tool call is worse
 * than the drift it prevents, so unexpected failures allow and say so on stderr.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const STATE_DIR = join(tmpdir(), 'foreman-line-model-gate')

/** Read the hook payload from stdin. Returns {} rather than throwing. */
function readPayload() {
  try {
    const raw = readFileSync(0, 'utf8')
    if (!raw.trim()) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function loadPolicy() {
  const path = join(HERE, 'model-gate.policy.json')
  return JSON.parse(readFileSync(path, 'utf8'))
}

/** Escape hatch. Checked before anything else so a broken policy cannot trap anyone. */
function gateDisabled(policy) {
  const name = policy?.escapeHatch?.env ?? 'FL_MODEL_GATE'
  const off = policy?.escapeHatch?.offValues ?? ['off']
  const value = process.env[name]
  return typeof value === 'string' && off.includes(value.trim().toLowerCase())
}

/**
 * Verdicts are keyed by session id. A session we cannot identify gets NO key -
 * never a shared "unknown" bucket. Caught by model-gate.test.mjs: with a shared
 * bucket, one unidentifiable session's BLOCK verdict was read back by a later,
 * unrelated session and blocked it. A gate that blocks the wrong session is a
 * worse failure than one that misses an unidentifiable one, and the miss is
 * bounded - real hook payloads always carry session_id (README, "Known limit").
 */
function statePath(sessionId) {
  if (typeof sessionId !== 'string' || sessionId.trim() === '') return null
  const safe = sessionId.replace(/[^A-Za-z0-9_-]/g, '_')
  if (safe === '') return null
  return join(STATE_DIR, `${safe}.json`)
}

/**
 * Decide. Byte-exact membership - that alone rejects `claude-opus-5[1m]`,
 * because it is not the string `claude-opus-5`. The marker and retired lookups
 * below never change the verdict; they only make the message actionable.
 */
function evaluate(model, policy) {
  if (typeof model !== 'string' || model.trim() === '') {
    return {
      verdict: 'BLOCK',
      model: null,
      reason:
        'This session did not report a model, so its grade cannot be verified. ' +
        'An unverified model is treated as a mismatch rather than allowed.',
    }
  }

  const actual = model.trim()
  const approved = policy.approved ?? {}
  if (Object.hasOwn(approved, actual)) {
    return { verdict: 'ALLOW', model: actual, roles: approved[actual] }
  }

  const markers = policy.oneMillionContext?.markers ?? []
  const lower = actual.toLowerCase()
  if (markers.some((m) => lower.includes(String(m).toLowerCase()))) {
    const base = actual.replace(/\[?[_-]?1m\]?$/i, '')
    return {
      verdict: 'BLOCK',
      model: actual,
      reason: policy.oneMillionContext?.message ?? 'A 1M-context session is not approved.',
      suggest: Object.hasOwn(approved, base) ? base : 'claude-opus-5',
    }
  }

  const retired = policy.retired ?? {}
  if (Object.hasOwn(retired, actual)) {
    return { verdict: 'BLOCK', model: actual, reason: retired[actual] }
  }

  return {
    verdict: 'BLOCK',
    model: actual,
    reason: 'This model is not on the approved roster for any Foreman Line role.',
  }
}

function renderBlock(result, policy) {
  const approved = Object.entries(policy.approved ?? {}).map(
    ([id, roles]) => `    ${id}  (${roles.join(', ')})`,
  )
  const envName = policy?.escapeHatch?.env ?? 'FL_MODEL_GATE'
  return [
    'FOREMAN LINE MODEL GATE - BLOCKED',
    '',
    `  running : ${result.model ?? '(not reported)'}`,
    `  why     : ${result.reason}`,
    '',
    '  Approved session models:',
    ...approved,
    '',
    '  Relaunch on an approved model:',
    `    claude --model ${result.suggest ?? 'claude-opus-5'}`,
    '',
    `  Durable fix - set "model" in ~/.claude/settings.json (it overrides the`,
    '  org default, so this needs no administrator).',
    '',
    `  Bypass for this session:  set ${envName}=off`,
  ].join('\n')
}

function main() {
  const mode = process.argv[2]
  let policy
  try {
    policy = loadPolicy()
  } catch (err) {
    process.stderr.write(`[model-gate] policy unreadable, allowing: ${err.message}\n`)
    process.exit(0)
  }

  if (gateDisabled(policy)) process.exit(0)

  const payload = readPayload()
  const sessionId = payload.session_id ?? payload.sessionId
  const path = statePath(sessionId)

  if (mode === 'session-start') {
    const result = evaluate(payload.model, policy)
    if (path === null) {
      // Unidentifiable session: record nothing rather than poison a shared key.
      process.stderr.write('[model-gate] no session_id; verdict not recorded\n')
    } else {
      try {
        mkdirSync(STATE_DIR, { recursive: true })
        writeFileSync(path, JSON.stringify({ ...result, at: Date.now() }), 'utf8')
      } catch (err) {
        // Cannot record => pre-tool cannot enforce. Say so rather than pretend.
        process.stderr.write(`[model-gate] could not record verdict: ${err.message}\n`)
      }
    }
    if (result.verdict === 'BLOCK') {
      // SessionStart cannot block; stdout becomes session context.
      process.stdout.write(
        `${renderBlock(result, policy)}\n\n` +
          'Tool calls are denied until this is resolved. Report this to the developer and stop.\n',
      )
    }
    process.exit(0)
  }

  if (mode === 'pre-tool') {
    // No id => nothing to correlate to. Allow rather than read a shared key.
    if (path === null) process.exit(0)

    let state = null
    try {
      if (existsSync(path)) state = JSON.parse(readFileSync(path, 'utf8'))
    } catch {
      state = null
    }

    // No record => SessionStart never ran for this session (older session,
    // hook newly installed). Allowing is right: refusing here would brick every
    // session that predates the gate, and the gate would be switched off.
    if (state === null) process.exit(0)

    if (state.verdict === 'BLOCK') {
      process.stderr.write(`${renderBlock(state, policy)}\n`)
      process.exit(2)
    }
    process.exit(0)
  }

  process.stderr.write(`[model-gate] unknown mode ${JSON.stringify(mode)}, allowing\n`)
  process.exit(0)
}

try {
  main()
} catch (err) {
  process.stderr.write(`[model-gate] unexpected failure, allowing: ${err?.message ?? err}\n`)
  process.exit(0)
}
