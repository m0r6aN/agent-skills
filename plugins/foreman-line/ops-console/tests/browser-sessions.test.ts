import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { buildHandler } from '../src/server.js'
import { chromiumBinary, launchBrowser } from './support/cdp.js'
import { materialize, type Scenario } from './support/materialize.js'

/**
 * FCA-P7 AC9 in a REAL browser. Reported defect: after clicking "View
 * sessions" nothing seemed to happen. Root cause (reproduced against the live
 * console): the workspace waited for every endpoint before showing any, the
 * slow goals/signals scans queued /api/spawns behind them, and Sessions claimed
 * "No console-recorded launches" for ~10 s. This test reproduces that timing
 * deterministically by delaying goals/signals, and asserts the corrected
 * behaviour in actual Chromium (real click delegation, real timing).
 */
const SCENARIO: Scenario = {
  name: 'browser-sessions',
  now: '2026-10-13T12:00:00.000Z',
  goal: {
    slug: 'g',
    queue: ['1. **P1** dispatched; quiet.'],
    charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
  },
  specs: [],
  chains: [],
  worktrees: [],
  expected: [],
}

const receipt = (n: number) => ({
  id: `foc-b-p${n}`,
  sessionName: 'foc-b',
  paneIndex: n,
  harness: 'pi',
  model: 'anthropic/claude-sonnet-5-5',
  thinking: 'high',
  budget: '$1',
  autonomy: { decisions: 'partial', commit: false, push: false, openPr: false, merge: false },
  repoRoot: '/nonexistent/repo',
  worktreePath: `/nonexistent/repo-worktrees/b${n}`,
  promptDigest: 'd',
  argv: ['pi'],
  createdAt: '2026-10-13T11:59:00.000Z',
})

const binary = chromiumBinary()
const skip = binary === null ? 'no chromium binary available' : false

test('AC9: "View sessions" opens a populated Sessions view even while slow endpoints are pending', {
  skip,
}, async () => {
  const root = mkdtempSync(join(tmpdir(), 'browser-sessions-'))
  const { config } = materialize(join(root, 'console'), SCENARIO)
  mkdirSync(config.stateDir, { recursive: true })
  writeFileSync(
    join(config.stateDir, 'spawns.json'),
    JSON.stringify({ schema: 'foc-spawns/v1', receipts: [receipt(0), receipt(1)] }),
  )
  const handler = buildHandler(config, () => Date.parse(SCENARIO.now))
  // Slow scans, as on the live console (~5 s there; shortened but still >> spawns).
  const server = createServer((req, res) => {
    const slow = /^\/api\/(goals|signals)/.test(req.url ?? '')
    if (slow) setTimeout(() => handler(req, res), 1500)
    else handler(req, res)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
  const browser = await launchBrowser(binary as string)
  try {
    await browser.navigate(url)
    await browser.waitFor(`document.querySelector('.session-summary [data-go-sessions]')`)
    const t0 = Date.now()
    await browser.evaluate(`document.querySelector('.session-summary [data-go-sessions]').click()`)
    assert.equal(
      await browser.evaluate(
        `!document.querySelector('main > section[data-view="sessions"]').hidden`,
      ),
      true,
      'Sessions view opened',
    )

    // Sample the view throughout the slow window: it must never claim emptiness.
    const seen = new Set<string>()
    while (Date.now() - t0 < 2500) {
      seen.add(await browser.evaluate<string>(`document.getElementById('sessions-body').innerText`))
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    for (const text of seen)
      assert.ok(
        !text.includes('No console-recorded launches'),
        `false emptiness shown: ${text.slice(0, 80)}`,
      )
    assert.equal(
      await browser.evaluate(`document.querySelectorAll('#sessions-body .tray-row').length`),
      2,
    )
    assert.match(
      await browser.evaluate<string>(`document.getElementById('console-status').textContent`),
      /up to date/,
    )

    // "View launched session": the launch banner lives in <main>; its button must
    // route to Sessions from another view.
    await browser.evaluate(`document.querySelector('.nav-btn[data-view="signals"]').click()`)
    assert.equal(
      await browser.evaluate(
        `document.querySelector('main > section[data-view="sessions"]').hidden`,
      ),
      true,
    )
    await browser.evaluate(
      `document.getElementById('launch-outcome').innerHTML = '<div class="banner"><button type="button" data-go-sessions data-reveal-session>View launched session →</button></div>'`,
    )
    await browser.evaluate(`document.querySelector('#launch-outcome [data-go-sessions]').click()`)
    assert.equal(
      await browser.evaluate(
        `!document.querySelector('main > section[data-view="sessions"]').hidden`,
      ),
      true,
      'View launched session opened Sessions',
    )
    assert.equal(
      await browser.evaluate(`document.querySelectorAll('#sessions-body .tray-row').length`),
      2,
    )

    assert.deepEqual(browser.logs, [], 'no console errors or exceptions')
  } finally {
    browser.close()
    server.close()
    rmSync(root, { recursive: true, force: true })
  }
})
