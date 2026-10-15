import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { clearDecisionCaches } from '../src/decisions-remote.js'
import { listAuditEntries } from '../src/invoke.js'
import { buildHandler } from '../src/server.js'
import { chromiumBinary, launchBrowser } from './support/cdp.js'
import { createFakeBin, prependToPath } from './support/fake-bin.js'
import { materialize, type Scenario } from './support/materialize.js'

/**
 * FCA-P9 stages 2-3 in a REAL browser: a real server over a real temp git repo, a fixture
 * `gh` on PATH (read-only; it exits 2 for anything but `pr list`), and headless Chromium.
 * The command is hidden until "Show command"; the press is exactly one `presented` audit
 * entry; nothing is merged, approved or dispatched.
 */
const SCENARIO: Scenario = {
  name: 'browser-decisions',
  now: '2026-09-26T12:00:00.000Z',
  goal: {
    slug: 'goal-dec',
    queue: ['1. **P1** shaped; awaiting approval.'],
    charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
  },
  specs: [{ name: 'P1-alpha.md', location: 'active', updated: '2026-09-01' }],
  sidecars: [{ kind: 'projected', spec: 'P1-alpha.md' }],
  chains: [],
  expected: [],
}
const PRS = JSON.stringify([
  {
    number: 218,
    title: 'feat: session ledger',
    url: 'https://github.com/o/r/pull/218',
    headRefName: 'feat/x',
    headRefOid: 'a'.repeat(40),
    baseRefName: 'main',
    isDraft: false,
    mergeable: 'MERGEABLE',
    mergeStateStatus: 'BLOCKED',
    reviewDecision: '',
    latestReviews: [],
    statusCheckRollup: [],
    createdAt: '2026-10-13T10:00:00Z',
    updatedAt: '2026-10-13T11:00:00Z',
  },
])

const binary = chromiumBinary()
const skip = binary === null ? 'no chromium binary available' : false

test('Decisions: Show command presents (one audited `presented`), reveals a copyable command, and fits 320 px — in real Chromium', {
  skip,
}, async () => {
  clearDecisionCaches()
  const root = mkdtempSync(join(tmpdir(), 'browser-decisions-'))
  const consoleRoot = join(root, 'console')
  const { config } = materialize(consoleRoot, SCENARIO)
  execFileSync('git', ['init', '-q', '-b', 'main', consoleRoot])
  const bin = join(root, 'bin')
  mkdirSync(bin)
  writeFileSync(join(root, 'prs.json'), PRS)

  // FCA-P16: Portable fake gh using Node.js script
  const escapedPrsJson = join(root, 'prs.json').replace(/\\/g, '\\\\')
  createFakeBin({
    binDir: bin,
    name: 'gh',
    script: `
const fs = require('fs');
const args = process.argv.slice(2);
const cmd = args.slice(0, 2).join(' ');
if (cmd === 'pr list') {
  process.stdout.write(fs.readFileSync('${escapedPrsJson}', 'utf8'));
  process.exit(0);
}
process.exit(2);
`,
  })

  const savedPath = process.env.PATH
  process.env.PATH = prependToPath(bin, savedPath)
  const handler = buildHandler(config, () => Date.parse(SCENARIO.now))
  const server = createServer((req, res) => handler(req, res))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
  const browser = await launchBrowser(binary as string)
  const text = () => browser.evaluate<string>(`document.getElementById('decisions-body').innerText`)
  try {
    await browser.navigate(url)
    await browser.waitFor(`document.querySelector('.nav-btn[data-view="decisions"]')`)
    await browser.evaluate(`document.querySelector('.nav-btn[data-view="decisions"]').click()`)
    await browser.waitFor(`document.querySelector('#decisions-body .dec-row [data-show-command]')`)

    assert.doesNotMatch(await text(), /gh pr merge/, 'command hidden before the press')
    assert.equal(listAuditEntries(config.stateDir).length, 0, 'rendering audits nothing')

    // Keyboard path: focus the button and activate it as a key press would.
    await browser.evaluate(
      `document.querySelector('[data-kind="merge"] [data-show-command]').focus()`,
    )
    await browser.evaluate(`document.activeElement.click()`)
    await browser.waitFor(`document.querySelector('[data-kind="merge"] .dec-command code')`)
    assert.match(await text(), /cd ".*" && gh pr merge 218/)
    assert.match(await text(), /The console will not run it/)
    assert.equal(
      await browser.evaluate(`document.activeElement.dataset.showCommand !== undefined`),
      true,
      'focus stays on the button after the reveal',
    )
    const audit = listAuditEntries(config.stateDir)
    assert.equal(audit.length, 1)
    assert.equal(audit[0]?.action, 'presented')
    assert.equal(audit[0]?.flow, 'pr-merge')
    assert.match(readFileSync(join(consoleRoot, '.git', 'HEAD'), 'utf8'), /main/)

    // A gate item offers approve and reject.
    const gateText = await browser.evaluate<string>(
      `document.querySelector('[data-kind="gate"]').innerText`,
    )
    assert.match(gateText, /Show approve command/)
    assert.match(gateText, /Show reject command/)

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
    clearDecisionCaches()
    rmSync(root, { recursive: true, force: true })
  }
})
