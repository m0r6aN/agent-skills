import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
// Test-only tools live outside the product dependency graph.
const require = createRequire(resolve(process.env.FOC_BROWSER_TOOL_ROOT || '/tmp/foreman-ux-browser', 'package.json'))
const { chromium, firefox } = require('playwright')
const AxeBuilder = require('@axe-core/playwright').default
const root = resolve(process.argv[2] || process.cwd(), 'ui')
const out = resolve(process.env.FOC_BROWSER_EVIDENCE_DIR || '/tmp/foreman-ux-browser/evidence')
await mkdir(out, { recursive: true })
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname
  if (path === '/favicon.ico') { res.writeHead(204); res.end(); return }
  try {
    const file = resolve(root, path === '/' ? 'index.html' : path.slice(1))
    if (!file.startsWith(root + '/')) throw new Error('outside fixture root')
    res.setHeader('content-type', file.endsWith('.html') ? 'text/html' : 'text/javascript')
    res.end(await readFile(file))
  } catch { res.writeHead(404); res.end('not found') }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`
const roots = ['/workspace/foreman', '/workspace/other/foreman']
const noWrite = { decisions: 'partial', commit: false, push: false, openPr: false, merge: false }
const registry = ['investigate', 'explain', 'remediate', 'close-delete'].map((verb) => ({ verb, signalClasses: ['parcel-state', 'scm-ci', 'goal-hygiene', 'worktree-hygiene', 'session-state'], invocation: 'spawn', promptTemplate: verb, destructive: verb === 'close-delete', autonomy: { ...noWrite, commit: verb === 'remediate' } }))
const signals = [
  ['urgent', 'parcel-state', 'ops-console/P1', 'docs/goals/ops-console/loop-directive.md'],
  ['attention', 'scm-ci', 'pr/142/checks-failing', 'gh: checks failed for PR #142'],
  ['attention', 'worktree-hygiene', 'worktrees/agent-review', 'Branch has unpushed commits'],
  ['info', 'goal-hygiene', 'ops-console', 'docs/goals/ops-console/charter.md'],
].map(([severity, cls, subject, evidence], i) => ({ id: `s${i}`, severity, class: cls, subject, evidence: [evidence], repo: roots[0], actions: ['investigate', 'remediate', 'explain', 'close-delete'] }))
signals.push({ ...signals[0], id: 'other-root', repo: roots[1], subject: 'research/P1' })
const gates = Object.fromEntries(['G1', 'G2', 'G3'].map((gate) => [gate, { gate, status: gate === 'G1' ? 'evidenced' : 'pending', detail: gate === 'G1' ? 'Ratified spec' : 'Awaiting human decision' }]))
const parcels = ['hung', 'running', 'awaiting-gate', 'complete'].map((state, i) => ({ parcel: `P${i + 1}`, state, rule: `R${i + 1}`, chainEvidence: i ? 'absent' : 'verified', flags: [], failure: null, liveness: { live: state === 'running' }, heartbeat: { lastProgressAt: '2026-10-12T11:00:00Z' }, gates, specRef: 'docs/specs/active/FCA-U1-workspace-navigation.md', specLocation: 'active', chain: null }))
const receipt = (sessionName, paneIndex, liveness = 'alive') => ({ id: `${sessionName}-p${paneIndex}`, sessionName, paneIndex, liveness, harness: 'pi', model: 'claude-sonnet-5-5', thinking: 'high', budget: '$20', repoRoot: roots[0], worktreePath: `/workspace/foreman-worktrees/${sessionName}-${paneIndex}`, promptDigest: 'sha256:fixture-not-real', autonomy: noWrite, createdAt: '2026-10-12T12:00:00Z', argv: ['pi', '--model', 'claude-sonnet-5-5'] })
function fixtures() { return {
  '/api/health': { ok: true, repoRoot: roots[0], posture: 'localhost-only' },
  '/api/goals': { goals: [], statuses: [ { key: 'ops-console', repoRoot: roots[0], active: true, tree: null, attention: { total: 2, hung: 1, awaitingGate: 1 }, urgentSubjects: ['ops-console/P1'] }, { key: 'other.research', repoRoot: roots[1], active: true, tree: 'other', attention: { total: 1 }, urgentSubjects: [] }] },
  '/api/signals': { signals: structuredClone(signals) }, '/api/actions': { actions: structuredClone(registry) },
  '/api/fleet': { roots: roots.map((root) => ({ root, liveness: 'ready', identity: { remote: 'https://example.invalid/foreman', defaultBranch: 'main', head: '6a68cfc5' } })) },
  '/api/spawns': { spawns: [receipt('foc-20261013t111955z', 0), receipt('foc-20261013t111955z', 1), { ...receipt('foc-20261012t225424z', 0, 'exited'), model: 'provider/model-with-a-long-realistic-name', repoRoot: '/workspace/checkouts/agent-skills-long-repository-name', worktreePath: '/workspace/checkouts/agent-skills-worktrees/foreman-ops-console-foc-p1-20261012t225424z' }, receipt('foc-legacy', 0, 'unknown')] },
  '/api/parcels': { goal: { slug: 'ops-console', loopDirectiveRef: 'docs/goals/ops-console/loop-directive.md' }, parcels },
  '/api/alerts': { alerts: [], remedies: [], notifications: [] }, '/api/routing': { policy: { classes: [], roles: [] }, parcels: [] },
  '/api/parcels/P1/logs': { chainDocuments: [], invocationAudit: [], stateLines: ['P1 awaits verification'] },
  '/api/actions/dispatch': { action: 'presented', command: 'Human-reviewed terminal command', reason: null },
} }
const report = []
let currentBrowser
try {
  for (const [name, driver, opts] of [['chromium', chromium, { executablePath: process.env.FOC_CHROMIUM || '/usr/bin/chromium' }], ['firefox', firefox, {}]]) {
    const browser = await driver.launch({ headless: true, ...opts })
    currentBrowser = browser
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } })
    const page = await context.newPage()
    const data = fixtures(), posts = [], errors = []
    let holdHealth = false, releaseHealth = () => {}
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/health' && holdHealth) await new Promise((resolve) => { releaseHealth = resolve })
      if (route.request().method() !== 'GET') posts.push({ path, body: route.request().postDataJSON() })
      if (path === '/api/spawn') { data['/api/spawns'].spawns.push(receipt('foc-new', 0), receipt('foc-new', 1)); return route.fulfill({ json: { ok: true, plan: { sessionName: 'foc-new' }, launch: { launched: [0, 1] } } }) }
      if (data[path]?.offline) return route.fulfill({ status: 503, json: { error: 'Fixture offline' } })
      await route.fulfill({ json: data[path] || {} })
    })
    await page.goto(base)
    await page.locator('#console-status').filter({ hasText: 'up to date' }).waitFor()
    const checks = [], axe = []
    for (const width of [320, 768, 1024, 1366, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      for (const view of ['signals', 'board', 'sessions', 'fleet']) {
        await page.locator(`.nav-btn[data-view="${view}"]`).click()
        if (view === 'board') await page.locator('#board [data-parcel="P1"]').first().waitFor()
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} ${width} ${view} page overflow`)
        if (width === 320 && view === 'signals') assert.ok(await page.locator('.signal-row td:nth-child(2)').first().evaluate((node) => node.clientWidth >= 140), 'mobile work item text must have readable width')
        await page.screenshot({ path: `${out}/${name}-${view}-${width}.png`, fullPage: true })
        if (view === 'sessions') {
          const row = page.locator('#sessions-body .tray-row').first()
          assert.ok(await row.locator('td').first().evaluate((node) => node.clientWidth >= 180), `${name} ${width}px session identity must have readable width (not squeezed columns)`)
          const config = row.locator('td').nth(2)
          assert.ok(await config.evaluate((node) => node.clientWidth >= 180), `${name} ${width}px session configuration must have readable width`)
          checks.push(`${width}px sessions: realistic identity/configuration remain at least 180px wide`)
          if (width === 1366) {
            await row.locator('summary').click()
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'desktop expanded receipt must not overflow the page')
            assert.ok(await row.locator('td').first().evaluate((node) => node.clientWidth >= 180), 'desktop expanded receipt preserves column width')
            await row.locator('summary').click()
          }
          if (width === 1024) {
            await row.locator('summary').focus()
            await page.keyboard.press('Enter')
            assert.equal(await row.locator('details').getAttribute('open'), '')
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'expanded receipt must not overflow the page')
            await page.screenshot({ path: `${out}/${name}-sessions-receipt-1024.png`, fullPage: true })
            await page.keyboard.press('Enter')
            await row.locator('[data-copy]').focus()
            await page.keyboard.press('Tab')
            assert.equal(await page.evaluate(() => document.activeElement.dataset.sessionAction), 'explain')
            await page.keyboard.press('Tab')
            assert.equal(await page.evaluate(() => document.activeElement.dataset.sessionAction), 'close-delete')
            const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
            axe.push({ view: 'sessions-1024', violations: result.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) })) })
          }
        }
        checks.push(`${width}px ${view}: no page overflow`)
        if (width === 320) {
          const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
          axe.push({ view: `${view}-320`, violations: result.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) })) })
        }
      }
    }
    await page.setViewportSize({ width: 1366, height: 900 })
    for (const view of ['signals', 'board', 'sessions', 'fleet', 'remedies', 'audit', 'settings']) {
      await page.locator(`.nav-btn[data-view="${view}"]`).click()
      if (view === 'board') await page.locator('#board [data-parcel="P1"]').first().waitFor()
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      axe.push({ view, violations: result.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) })) })
    }
    await page.locator('.nav-btn[data-view="signals"]').click()
    await page.locator('#fleet-select').selectOption(roots[1])
    assert.equal(await page.locator('#signals-body .signal-row').count(), 1)
    await page.locator('#fleet-select').selectOption(roots[0])
    assert.equal(await page.locator('#signals-body .signal-row').count(), 4)
    await page.locator('#signals-body [data-select="s0"]').check()
    await page.locator('#signals-body [data-select="s1"]').click({ modifiers: ['Shift'] })
    assert.equal(await page.locator('#signals-body [data-select]:checked').count(), 2)
    await page.locator('#review-launch').click()
    await page.locator('[name="extra"]').fill('Preserve existing work. This is a mocked verification launch.')
    await page.locator('#spawn-run').focus()
    await page.keyboard.press('Tab')
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-launch-help')), true)
    await page.keyboard.press('Shift+Tab')
    assert.equal(await page.evaluate(() => document.activeElement.id), 'spawn-run')
    await page.locator('[data-bulk-verb]').selectOption('explain')
    await page.locator('[data-apply-actions]').click()
    await page.locator('#bulk-result').filter({ hasText: '2 updated · 0 skipped' }).waitFor()
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-apply-actions')), true)
    await page.locator('[data-bulk-permission="push"]').check()
    await page.locator('[data-apply-permissions]').click()
    await page.locator('[data-suggested]').uncheck()
    await page.locator('[data-suggested]').check()
    assert.equal(await page.locator('#launch-items [data-permission="push"]:checked').count(), 2)
    assert.equal(await page.locator('#launch-items [data-verb]').first().inputValue(), 'explain')
    await page.locator('[data-launch-help]').focus()
    await page.keyboard.press('Enter')
    await page.locator('#help-dialog[open]').waitFor()
    await page.keyboard.press('Tab')
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-close-help')), true)
    await page.keyboard.press('Shift+Tab')
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-close-help')), true)
    const helpAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    axe.push({ view: 'workflow-help', violations: helpAxe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) })) })
    await page.screenshot({ path: `${out}/${name}-help-1366.png` })
    await page.keyboard.press('Escape')
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-launch-help')), true)
    assert.equal(await page.locator('[name="extra"]').inputValue(), 'Preserve existing work. This is a mocked verification launch.')
    checks.push('bulk action and explicit permissions: 2 updated/0 skipped; suggested toggle preserves manual settings; Apply focus retained; nested help Tab/Shift+Tab/Escape returns to opener without draft loss')
    const drawerAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    axe.push({ view: 'launch-review', violations: drawerAxe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) })) })
    await page.screenshot({ path: `${out}/${name}-review-1366.png` })
    await page.locator('.launch-config').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${out}/${name}-configuration-1366.png` })
    await page.setViewportSize({ width: 320, height: 900 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile dialog overflow')
    await page.screenshot({ path: `${out}/${name}-review-320.png`, fullPage: true })
    await page.locator('.launch-config').scrollIntoViewIfNeeded()
    assert.ok(await page.locator('[name="model"]').evaluate((node) => node.getBoundingClientRect().right <= innerWidth), 'mobile configuration fits viewport')
    await page.screenshot({ path: `${out}/${name}-configuration-320.png`, fullPage: true })
    await page.locator('[data-launch-help]').click()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile help overflow')
    const mobileHelpAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    axe.push({ view: 'workflow-help-320', violations: mobileHelpAxe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) })) })
    await page.screenshot({ path: `${out}/${name}-help-320.png`, fullPage: true })
    await page.keyboard.press('Escape')
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-launch-help')), true)
    await page.keyboard.press('Escape')
    assert.equal(await page.evaluate(() => document.activeElement.id), 'review-launch')
    await page.locator('#refresh').click()
    await page.locator('#console-status').filter({ hasText: 'up to date' }).waitFor()
    assert.equal(await page.locator('#signals-body [data-select]:checked').count(), 2)
    await page.locator('#review-launch').click()
    assert.equal(await page.locator('[name="extra"]').inputValue(), 'Preserve existing work. This is a mocked verification launch.')
    await page.locator('#spawn-run').click()
    await page.locator('#launch-outcome').filter({ hasText: 'Launched foc-new' }).waitFor()
    await page.locator('#launch-outcome [data-go-sessions]').click()
    await page.locator('#sessions-body [data-session="foc-new"][data-highlight]').first().waitFor()
    assert.equal(posts.filter((p) => p.path === '/api/spawn').length, 1)
    assert.equal(posts[0].body.actions.length, 2)
    assert.ok(posts[0].body.actions.every((a) => a.verb === 'explain' && a.autonomy.push && !a.autonomy.merge))
    await page.setViewportSize({ width: 1366, height: 900 })
    await page.screenshot({ path: `${out}/${name}-launch-handoff.png`, fullPage: true })
    await page.locator('#sessions-body [data-session="foc-new"] [data-session-action="close-delete"]').first().click()
    await page.locator('[name="confirmation"]').fill('wrong')
    await page.locator('.action-popover [type="submit"]').click()
    assert.equal(posts.filter((p) => p.path === '/api/actions/dispatch').length, 0)
    await page.keyboard.press('Escape')
    await page.locator('.nav-btn[data-view="signals"]').click()
    await page.locator('#global-search').fill('nothing-matches')
    await page.screenshot({ path: `${out}/${name}-empty.png`, fullPage: true })
    await page.locator('#global-search').fill('')
    data['/api/signals'] = { offline: true }
    await page.locator('#refresh').click()
    await page.locator('#console-status').filter({ hasText: 'stale' }).waitFor()
    await page.screenshot({ path: `${out}/${name}-stale.png`, fullPage: true })
    data['/api/signals'] = { signals: structuredClone(signals) }
    await page.locator('#refresh').click()
    await page.locator('#console-status').filter({ hasText: 'up to date' }).waitFor()
    // 200% browser zoom at a 1366x900 window has a 683x450 CSS layout viewport.
    // Emulate that effective viewport; do not claim an actual browser UI zoom gesture.
    await page.setViewportSize({ width: 683, height: 450 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '200% equivalent viewport overflow')
    await page.locator('#signals-body [data-select="s0"]').check()
    await page.locator('#review-launch').click()
    await page.locator('#spawn-run').scrollIntoViewIfNeeded()
    const launchBox = await page.locator('#spawn-run').boundingBox()
    assert.ok(launchBox.x >= 0 && launchBox.x + launchBox.width <= 683 && launchBox.y >= 0 && launchBox.y + launchBox.height <= 450, '200% launch button reachable')
    await page.screenshot({ path: `${out}/${name}-zoom-200.png` })
    await page.keyboard.press('Escape')
    checks.push('200% equivalent 683x450 CSS viewport: no overflow, launch reachable by scrolling; not a browser UI zoom gesture')
    checks.push('keyboard Tab/Shift+Tab trap, Escape focus return; Shift selection; refresh persistence; one mocked POST, two actions; session highlight; wrong destructive confirmation sends no request')
    const health = data['/api/health']
    data['/api/health'] = { offline: true }
    await page.reload()
    await page.locator('#console-status').filter({ hasText: 'Cannot load workspace' }).waitFor()
    await page.screenshot({ path: `${out}/${name}-initial-error.png`, fullPage: true })
    data['/api/health'] = health
    holdHealth = true
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('#console-status').filter({ hasText: 'Loading workspace' }).waitFor()
    await page.screenshot({ path: `${out}/${name}-loading.png`, fullPage: true })
    holdHealth = false; releaseHealth()
    await page.locator('#console-status').filter({ hasText: 'up to date' }).waitFor()
    checks.push('initialization error, delayed-health loading and recovery: meaningful shell, refresh available')
    assert.ok(errors.every((text) => text.includes('503')), 'no unexpected console or page exceptions')
    assert.ok(axe.every((entry) => !entry.violations.length), 'zero tested WCAG A/AA axe violations')
    report.push({ browser: name, version: browser.version(), checks, axe, errors, posts, screenshotCount: 33 })
    await context.close(); await browser.close()
  }
} finally {
  await currentBrowser?.close()
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2))
  await new Promise((r) => server.close(r))
}
console.log(JSON.stringify(report.map((r) => ({ browser: r.browser, version: r.version, checks: r.checks.length, axeViolations: r.axe.filter((a) => a.violations.length), errors: r.errors, posts: r.posts.length })), null, 2))
