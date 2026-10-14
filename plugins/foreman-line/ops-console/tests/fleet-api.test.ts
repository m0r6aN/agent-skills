import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { type ApiResult, handleApi } from '../src/api.js'
import type { ConsoleConfig } from '../src/config.js'
import { type Scenario, withTempRepo, withTempRepoAsync } from './support/materialize.js'

/**
 * FCA-P2 fleet API surface: `GET /api/fleet`, `POST /api/fleet/add|remove`,
 * `GET /api/fs/browse`. Writes are confined to `state/fleet.json`; refusals
 * are typed (4xx + `reason`), non-mutating, and method guards follow the
 * frozen route-table conventions.
 */
const NOW = '2026-09-26T12:00:00.000Z'
const NOW_MS = Date.parse(NOW)

function fleetScenario(): Scenario {
  return {
    name: 'fleet-api',
    now: NOW,
    goal: {
      slug: 'goal-fleet',
      queue: ['1. **P1** dispatched; silent for days.'],
      charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
    },
    specs: [],
    chains: [],
    worktrees: [{ name: 'fl-p1', branch: 'feat/p1', fresh: false }],
    expected: [],
  }
}

async function call(
  config: ConsoleConfig,
  method: string,
  pathname: string,
  body?: unknown,
): Promise<ApiResult> {
  const url = new URL(pathname, 'http://localhost')
  return handleApi(
    config,
    { method, pathname: url.pathname, query: url.searchParams, body: body ?? {} },
    NOW_MS,
  )
}

function reason(result: ApiResult): unknown {
  return (result.json as { reason?: unknown }).reason
}

test('GET /api/fleet lists the primary root with derived identity + liveness', async () => {
  await withTempRepoAsync(fleetScenario(), async ({ config }) => {
    const result = await call(config, 'GET', '/api/fleet')
    assert.equal(result.status, 200)
    const roots = (
      result.json as { roots: { root: string; liveness: string; identity: unknown }[] }
    ).roots
    assert.equal(roots.length, 1)
    assert.equal(roots[0]?.root, config.repoRoot)
    assert.equal(roots[0]?.liveness, 'ready')
    assert.notEqual(roots[0]?.identity, null)
  })
})

test('POST /api/fleet/add registers a real work tree and persists to state/fleet.json', async () => {
  await withTempRepoAsync(fleetScenario(), async ({ config }) => {
    const extra = join(config.repoRoot, 'sibling-project')
    mkdirSync(join(extra, '.git'), { recursive: true })
    const result = await call(config, 'POST', '/api/fleet/add', { root: extra })
    assert.equal(result.status, 200)
    const roots = (result.json as { roots: { root: string }[] }).roots
    assert.deepEqual(
      roots.map((entry) => entry.root),
      [config.repoRoot, extra],
    )
    // Persisted: a fresh GET sees the same registry.
    const after = await call(config, 'GET', '/api/fleet')
    assert.deepEqual(
      (after.json as { roots: { root: string }[] }).roots.map((entry) => entry.root),
      [config.repoRoot, extra],
    )
  })
})

test('POST /api/fleet/add typed refusals are non-mutating', async () => {
  await withTempRepoAsync(fleetScenario(), async ({ config }) => {
    const relative = await call(config, 'POST', '/api/fleet/add', { root: 'rel/ative' })
    assert.equal(relative.status, 400)
    assert.equal(reason(relative), 'root-not-absolute')

    const absent = await call(config, 'POST', '/api/fleet/add', { root: '/no/such/project' })
    assert.equal(reason(absent), 'root-absent')

    const plain = join(config.repoRoot, 'not-a-repo')
    mkdirSync(plain, { recursive: true })
    assert.equal(
      reason(await call(config, 'POST', '/api/fleet/add', { root: plain })),
      'not-a-git-work-tree',
    )

    const extra = join(config.repoRoot, 'sibling-project')
    mkdirSync(join(extra, '.git'), { recursive: true })
    await call(config, 'POST', '/api/fleet/add', { root: extra })
    assert.equal(
      reason(await call(config, 'POST', '/api/fleet/add', { root: extra })),
      'duplicate-root',
    )

    const after = await call(config, 'GET', '/api/fleet')
    assert.deepEqual(
      (after.json as { roots: { root: string }[] }).roots.map((entry) => entry.root),
      [config.repoRoot, extra],
    )
  })
})

test('POST /api/fleet/remove: extras removable; primary immutable; unknown is 404', async () => {
  await withTempRepoAsync(fleetScenario(), async ({ config }) => {
    const extra = join(config.repoRoot, 'sibling-project')
    mkdirSync(join(extra, '.git'), { recursive: true })
    await call(config, 'POST', '/api/fleet/add', { root: extra })

    const primary = await call(config, 'POST', '/api/fleet/remove', { root: config.repoRoot })
    assert.equal(primary.status, 400)
    assert.equal(reason(primary), 'root-primary-immutable')

    const unknown = await call(config, 'POST', '/api/fleet/remove', { root: '/no/such/project' })
    assert.equal(unknown.status, 404)
    assert.equal(reason(unknown), 'root-unknown')

    const removed = await call(config, 'POST', '/api/fleet/remove', { root: extra })
    assert.equal(removed.status, 200)
    const after = await call(config, 'GET', '/api/fleet')
    assert.deepEqual(
      (after.json as { roots: { root: string }[] }).roots.map((entry) => entry.root),
      [config.repoRoot],
    )
  })
})

test('GET /api/fs/browse lists one level and refuses bad paths typed', async () => {
  await withTempRepoAsync(fleetScenario(), async ({ config }) => {
    const ok = await call(
      config,
      'GET',
      `/api/fs/browse?path=${encodeURIComponent(config.repoRoot)}`,
    )
    assert.equal(ok.status, 200)
    const entries = (ok.json as { entries: { name: string }[] }).entries
    assert.ok(entries.some((entry) => entry.name === '.git'))

    const missing = await call(config, 'GET', '/api/fs/browse')
    assert.equal(missing.status, 400)

    const relative = await call(
      config,
      'GET',
      `/api/fs/browse?path=${encodeURIComponent('rel/ative')}`,
    )
    assert.equal(relative.status, 400)
    assert.equal(reason(relative), 'path-not-absolute')
  })
})

test('fleet + browse routes enforce method guards like the rest of the table', async () => {
  await withTempRepoAsync(fleetScenario(), async ({ config }) => {
    assert.equal((await call(config, 'POST', '/api/fleet')).status, 405)
    assert.equal((await call(config, 'GET', '/api/fleet/add')).status, 405)
    assert.equal((await call(config, 'GET', '/api/fleet/remove')).status, 405)
    assert.equal((await call(config, 'POST', '/api/fs/browse')).status, 405)
  })
})
