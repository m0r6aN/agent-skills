import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { browseListHtml, fleetHtml } from '../ui/views/fleet.js'

/**
 * FCA-P6 fleet view (Task 18): fleet tiles with identity + liveness and
 * add/remove, plus the filesystem folder picker — browse -> select -> add
 * completes end-to-end against a mocked API; refusal reasons render inline
 * (including the primary-root immutable refusal, which is expected UI and
 * never a crash).
 */

const ROOTS = [
  {
    root: '/repos/agent-skills',
    liveness: 'ready',
    identity: {
      remote: 'https://example.invalid/a.git',
      defaultBranch: 'main',
      head: 'abc12345def',
    },
  },
  {
    root: '/repos/other',
    liveness: 'absent',
    identity: null,
  },
]

test('fleet tiles carry identity + liveness; browse rows gate selectability', () => {
  const dom = new JSDOM(`<div>${fleetHtml(ROOTS)}</div>`)
  const doc = dom.window.document
  assert.equal(doc.querySelectorAll('.fleet-tile').length, 2)
  const tile = doc.querySelector('[data-root="/repos/agent-skills"]') as unknown as {
    textContent: string
  } | null
  assert.ok(tile !== null)
  assert.ok(tile.textContent.includes('main @ abc12345'))
  assert.equal(doc.querySelectorAll('[data-remove]').length, 2)
  const addButton = doc.getElementById('fleet-add') as unknown as { disabled: boolean } | null
  assert.ok(addButton !== null)
  assert.equal(addButton.disabled, true, 'nothing selected yet')

  const list = new JSDOM(
    `<div>${browseListHtml('/repos', [
      { name: 'agent-skills', type: 'dir', gitWorkTree: true },
      { name: 'notes.md', type: 'file', gitWorkTree: false },
      { name: 'link', type: 'other', gitWorkTree: false },
    ])}</div>`,
  )
  const rows = list.window.document.querySelectorAll('tr')
  assert.equal(rows.length, 4, 'header + 3 entries')
  assert.ok(list.window.document.querySelector('[data-pick="/repos/agent-skills"]') !== null)
  assert.ok(
    list.window.document.querySelector('[data-pick="/repos/notes.md"]') === null,
    'files are not selectable',
  )
  assert.ok(
    list.window.document.querySelector('[data-pick="/repos/link"]') === null,
    'symlinks stay opaque',
  )
  assert.ok(list.window.document.querySelector('.chip-amber') !== null, 'git work tree badge')
})

test('browse -> select -> add completes end-to-end; refusals render inline; primary removal is safe', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    url: 'http://localhost/',
  })
  const doc = dom.window.document
  const posts: Array<{ kind: string; body: Record<string, unknown> }> = []
  const routes = {
    '/api/health': { ok: true, repoRoot: '/repos/agent-skills', posture: 'test' },
    '/api/goals': { goals: [], statuses: [] },
    '/api/parcels': {
      goal: { slug: 'g', loopDirectiveRef: 'x.md' },
      parcels: [],
      unmappedChains: [],
    },
    '/api/alerts': { alerts: [], remedies: [], notifications: [] },
    '/api/routing': { policy: { classes: [], roles: [] }, parcels: [] },
  }
  let fleetState = [ROOTS[0]]
  let addFailure: { reason: string; error: string } | null = null
  const errors: unknown[][] = []
  const origError = console.error
  const origFetch = globalThis.fetch
  const globals = globalThis as unknown as Record<string, unknown>
  const origDocument = globals.document
  console.error = (...args: unknown[]) => {
    errors.push(args)
  }
  globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
    const path = String(input)
    if (path.startsWith('/api/fs/browse')) {
      return {
        json: async () => ({
          path: '/repos',
          entries: [
            { name: 'new-project', type: 'dir', gitWorkTree: true },
            { name: 'notes.md', type: 'file', gitWorkTree: false },
          ],
        }),
      }
    }
    if (path.startsWith('/api/fleet/add')) {
      const body = JSON.parse(String(init?.body))
      posts.push({ kind: 'add', body })
      if (addFailure !== null) {
        const failure: { reason: string; error: string } = addFailure
        return { json: async () => ({ ok: false, ...failure }) }
      }
      fleetState = [...fleetState, { root: body.root, liveness: 'ready', identity: null }]
      return { json: async () => ({ ok: true, roots: fleetState }) }
    }
    if (path.startsWith('/api/fleet/remove')) {
      const body = JSON.parse(String(init?.body))
      posts.push({ kind: 'remove', body })
      return {
        json: async () => ({
          ok: false,
          reason: 'root-primary-immutable',
          error: `fleet root refused: ${body.root} is the primary root and cannot be removed`,
        }),
      }
    }
    if (path.startsWith('/api/fleet')) return { json: async () => ({ roots: fleetState }) }
    const key = Object.keys(routes)
      .filter((candidate) => path.startsWith(candidate))
      .sort((a, b) => b.length - a.length)[0]
    return { json: async () => (key === undefined ? {} : (routes as Record<string, unknown>)[key]) }
  }) as typeof globalThis.fetch
  globals.document = doc
  try {
    await import('../ui/app.js')
    await new Promise((resolve) => setTimeout(resolve, 50))
    ;(doc.querySelector('.nav-btn[data-view="fleet"]') as unknown as { click: () => void }).click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.ok(doc.querySelector('[data-root="/repos/agent-skills"]') !== null, 'tile renders')

    // browse -> select -> add
    const pathInput = doc.getElementById('browse-path') as unknown as { value: string }
    pathInput.value = '/repos'
    ;(doc.getElementById('browse-run') as unknown as { click: () => void }).click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    const pick = doc.querySelector('[data-pick="/repos/new-project"]') as unknown as {
      click: () => void
    }
    assert.ok(pick !== null, 'selectable dir row rendered')
    pick.click()
    ;(doc.getElementById('fleet-add') as unknown as { click: () => void }).click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.equal(posts.length, 1)
    const firstPost = posts[0] as (typeof posts)[number]
    assert.deepEqual(firstPost.body, { root: '/repos/new-project' })
    assert.ok(doc.querySelector('[data-root="/repos/new-project"]') !== null, 'new tile after add')

    // failed add -> inline refusal, no crash (a successful add re-renders the
    // view, so browse again first)
    addFailure = {
      reason: 'not-a-git-work-tree',
      error: 'fleet root refused: /repos/x is not a git work tree',
    }
    const pathInput2 = doc.getElementById('browse-path') as unknown as { value: string }
    pathInput2.value = '/repos'
    ;(doc.getElementById('browse-run') as unknown as { click: () => void }).click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    const pick2 = doc.querySelector('[data-pick="/repos/new-project"]') as unknown as {
      click: () => void
    }
    assert.ok(pick2 !== null, 'browse list refreshed after add')
    pick2.click()
    ;(doc.getElementById('fleet-add') as unknown as { click: () => void }).click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    const errorSlot = doc.getElementById('fleet-error') as unknown as {
      hidden: boolean
      textContent: string
    }
    assert.equal(errorSlot.hidden, false, 'refusal is visible')
    assert.ok(errorSlot.textContent.includes('not-a-git-work-tree'))

    // removing the primary root -> typed refusal inline, tile intact
    ;(
      doc.querySelector('[data-remove="/repos/agent-skills"]') as unknown as { click: () => void }
    ).click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.ok(errorSlot.textContent.includes('root-primary-immutable'))
    assert.ok(
      doc.querySelector('[data-root="/repos/agent-skills"]') !== null,
      'primary tile survives',
    )
    assert.deepEqual(errors, [], 'zero console errors')
  } finally {
    console.error = origError
    globalThis.fetch = origFetch
    globals.document = origDocument
  }
})
