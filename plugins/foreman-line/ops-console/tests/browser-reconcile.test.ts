import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { clearPrCache } from '../src/reconcile-remote.js'
import { buildHandler } from '../src/server.js'
import { chromiumBinary, launchBrowser } from './support/cdp.js'
import { materialize, type Scenario } from './support/materialize.js'

/**
 * FCA-P8 AC6 in a REAL browser: a real server over a real temp git repo (with a
 * bare remote), a fixture `gh` on PATH, and headless Chromium over CDP. Checks
 * the discrepancy a human cares about renders, filters work, the explanation
 * opens and survives a refresh, and the page stays usable at 320 px.
 */
const SCENARIO: Scenario = {
  name: 'browser-reconcile',
  now: '2026-10-13T12:00:00.000Z',
  goal: {
    slug: 'g',
    queue: ['1. **SYN-P1** dispatched; quiet.', '2. **SYN-P2** next.'],
    charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
  },
  specs: [],
  chains: [],
  worktrees: [],
  expected: [],
}
const PRS = JSON.stringify([
  {
    number: 7,
    title: 'feat(foreman-line): SYN-P1 projection',
    headRefName: 'feat/x',
    baseRefName: 'main',
    state: 'MERGED',
    createdAt: '2026-10-01T00:00:00Z',
    mergedAt: '2026-10-02T00:00:00Z',
    closedAt: '2026-10-02T00:00:00Z',
    url: 'https://example.invalid/pull/7',
  },
])

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', ['-C', cwd, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
    stdio: 'ignore',
  })
}

const binary = chromiumBinary()
const skip = binary === null ? 'no chromium binary available' : false

test('AC6: Reconciliation renders findings, filters, explains, survives refresh, and fits 320 px — in real Chromium', {
  skip,
}, async () => {
  clearPrCache()
  const root = mkdtempSync(join(tmpdir(), 'browser-reconcile-'))
  const consoleRoot = join(root, 'console')
  const { config } = materialize(consoleRoot, SCENARIO)
  const bare = join(root, 'remote.git')
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', bare])
  execFileSync('git', ['init', '-q', '-b', 'main', consoleRoot])
  git(consoleRoot, 'add', '.')
  git(consoleRoot, 'commit', '-q', '-m', 'base')
  git(consoleRoot, 'remote', 'add', 'origin', bare)
  git(consoleRoot, 'push', '-q', 'origin', 'main')
  git(consoleRoot, 'remote', 'set-head', 'origin', 'main')
  const bin = join(root, 'bin')
  mkdirSync(bin)
  writeFileSync(join(root, 'prs.json'), PRS)
  writeFileSync(
    join(bin, 'gh'),
    `#!/bin/sh\nif [ "$1 $2" = "pr list" ]; then cat '${join(root, 'prs.json')}'; exit 0; fi\nexit 2\n`,
  )
  chmodSync(join(bin, 'gh'), 0o755)
  const savedPath = process.env.PATH
  process.env.PATH = `${bin}:${savedPath}`
  const handler = buildHandler(config, () => Date.parse(SCENARIO.now))
  const server = createServer((req, res) => handler(req, res))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
  const browser = await launchBrowser(binary as string)
  const rows = () =>
    browser.evaluate<string[]>(
      `[...document.querySelectorAll('#reconcile-body .rec-row')].map(r => r.dataset.recParcel)`,
    )
  try {
    await browser.navigate(url)
    await browser.waitFor(`document.querySelector('.nav-btn[data-view="reconcile"]')`)
    await browser.evaluate(`document.querySelector('.nav-btn[data-view="reconcile"]').click()`)
    await browser.waitFor(`document.querySelector('#reconcile-body .rec-row')`)

    assert.deepEqual(await rows(), ['SYN-P1', 'SYN-P2'])
    const banner = await browser.evaluate<string>(
      `document.querySelector('#reconcile-body .banner').innerText`,
    )
    assert.match(banner, /Compared against origin\/main/)
    assert.match(banner, /GitHub PRs as of/)
    const chips = await browser.evaluate<string>(
      `document.querySelector('[data-rec-parcel="SYN-P1"] .chip[title]').innerText`,
    )
    assert.equal(chips, 'Shipped, record behind')
    assert.equal(
      await browser.evaluate(
        `document.querySelector('[data-rec-parcel="SYN-P2"] .chip[title]').innerText`,
      ),
      'No trace of a start',
    )

    await browser.evaluate(`document.querySelector('[data-rec-filter="never-started"]').click()`)
    assert.deepEqual(await rows(), ['SYN-P2'])
    await browser.evaluate(`document.querySelector('[data-rec-filter=""]').click()`)

    // Explanation: a real click on the native disclosure, then a refresh must not collapse it.
    await browser.evaluate(
      `document.querySelector('[data-rec-parcel="SYN-P1"] details summary').click()`,
    )
    await browser.waitFor(`document.querySelector('[data-rec-parcel="SYN-P1"] details').open`)
    const explained = await browser.evaluate<string>(
      `document.querySelector('[data-rec-parcel="SYN-P1"] details').innerText`,
    )
    assert.match(explained, /PR #7 MERGED/)
    assert.match(explained, /Complete the record instead of redoing the work/)
    assert.match(explained, /Why this is “hung”/)
    await browser.evaluate(`document.getElementById('refresh').click()`)
    await browser.waitFor(
      `document.getElementById('console-status').textContent.includes('up to date')`,
    )
    assert.equal(
      await browser.evaluate(`document.querySelector('[data-rec-parcel="SYN-P1"] details').open`),
      true,
      'explanation survives a refresh',
    )

    for (const width of [1366, 320]) {
      await browser.resize(width, 900)
      assert.equal(
        await browser.evaluate(`document.documentElement.scrollWidth <= window.innerWidth + 1`),
        true,
        `no horizontal page overflow at ${width}px`,
      )
    }
    assert.deepEqual(browser.logs, [], 'no console errors or exceptions')
  } finally {
    browser.close()
    server.close()
    process.env.PATH = savedPath
    clearPrCache()
    rmSync(root, { recursive: true, force: true })
  }
})
