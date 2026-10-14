// Browser controller: DOM is a projection of state, never the source of selection truth.
import { esc, emptyHtml, paginationHtml, shellHtml, VIEWS, VIEW_COPY } from './views/shell.js'
import { countsHtml, filterParcels, reconcileRowsHtml, remoteBannerHtml } from './views/reconcile.js'
import { boardHtml, detailHtml } from './views/board.js'
import { decisionsHtml, DECISIONS_PAGE_SIZE, filterItems } from './views/decisions.js'
import { remedyHtml, remediesHtml } from './views/remedies.js'
import { actionPopoverHtml, confirmationToken, signalsHtml } from './views/signals.js'
import { readControls, spawnPanelHtml, spawnRequest } from './views/spawn-panel.js'
import { browseListHtml, fleetHtml } from './views/fleet.js'
import { trayHtml } from './views/tray.js'
import { actionSignature, applyToSelection, chooseAction, eligibleActions, reconcileSelection, selectTarget, useSuggestedSettings } from './views/selection.js'

// Shape validation only; the server remains the path/authorization authority.
const absoluteRoot = (value) => typeof value === 'string' && /^(?:\/|[A-Za-z]:[\\/]|\\\\)/.test(value)

export function startConsole(doc, fetcher = globalThis.fetch.bind(globalThis)) {
  const win = doc.defaultView
  const state = { view: 'signals', scope: '', goal: null, repoRoot: '', statuses: [], signals: [], registry: [], fleet: [], spawns: [],
    loaded: {}, loadErrors: {}, decisions: null, decisionsError: '', decisionsFilter: '', decisionsShown: new Map(), decisionsApprovals: new Map(), reconcile: null, reconcileError: '', reconcileFilter: '', reconcileOpen: new Set(), projection: null, remedies: [], queries: {}, pages: {}, selected: new Map(), suggested: true, bulk: {}, bulkResult: '', controls: {}, extra: '', browseSelection: null, launchError: '', submitting: false, launchPage: 0, highlightSession: null, revealSession: false, detailParcel: null, retryRequired: false, retryAcknowledged: false }
  let generation = 0
  let goalGeneration = 0
  let reconcileGeneration = 0
  let decisionsGeneration = 0
  let detailGeneration = 0
  let destroyed = false
  const el = (id) => doc.getElementById(id)
  const on = (node, name, fn) => node?.addEventListener(name, fn)
  async function api(path, options) {
    const response = await fetcher(path, options)
    const data = await response.json()
    if (!data || typeof data !== 'object') throw new Error('Invalid response from the console')
    if (response.ok === false || data.ok === false || data.error) throw new Error([data.reason, data.error].filter(Boolean).join(': ') || `Request failed (${response.status})`)
    return data
  }
  function status(message, error = false) {
    el('console-status').textContent = message
    el('console-status').classList.toggle('error', error)
  }
  function matches(text) { return String(text).toLowerCase().includes((state.queries[state.view] || '').toLowerCase()) }
  function scoped(root) { return !state.scope || state.scope === root }
  function pageRows(rows, view = state.view) {
    const page = Math.min(state.pages[view] || 0, Math.max(0, Math.ceil(rows.length / 200) - 1))
    state.pages[view] = page
    return { rows: rows.slice(page * 200, page * 200 + 200), pager: paginationHtml(rows.length, page) }
  }
  function setView(view, hash = true) {
    state.view = VIEWS.some(([id]) => id === view) ? view : 'signals'
    doc.querySelectorAll('main > section[data-view]').forEach((section) => { section.hidden = section.dataset.view !== state.view })
    doc.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === state.view)
      btn.setAttribute('aria-current', btn.dataset.view === state.view ? 'page' : 'false')
    })
    const label = VIEWS.find(([id]) => id === state.view)[1]
    el('view-title').textContent = label
    el('view-crumb').textContent = label
    el('view-description').textContent = VIEW_COPY[state.view]
    el('global-search').value = state.queries[state.view] || ''
    el('global-search').placeholder = `Search ${label.toLowerCase()}…`
    el('severity-filters').hidden = state.view !== 'signals'
    el('global-search').closest('label').hidden = ['audit', 'settings', 'remedies'].includes(state.view)
    if (hash && win && win.location.hash !== `#${state.view}`) win.location.hash = state.view
    renderCurrent()
    if (['board', 'remedies', 'settings'].includes(state.view)) loadGoal()
    if (state.view === 'reconcile') loadReconcile()
    if (state.view === 'decisions') loadDecisions()
  }
  function goalOptions() {
    const filter = el('goal-status').value
    const scopedGoals = state.statuses.filter((s) => scoped(s.repoRoot))
    const active = scopedGoals.filter((s) => filter === 'all' || (filter === 'active' ? s.active : !s.active))
      .sort((a, b) => (b.attention?.total || 0) - (a.attention?.total || 0))
    if (!active.some((s) => s.key === state.goal)) { state.goal = active[0]?.key || null; state.projection = null; state.detailParcel = null; ++detailGeneration; el('detail').hidden = true; state.reconcileOpen.clear(); state.reconcileFilter = '' }
    el('goal-select').innerHTML = active.length ? active.map((s) => `<option value="${esc(s.key)}">${esc(s.key)}${s.attention?.total ? ` · ${s.attention.total} need attention` : ''}</option>`).join('') : '<option value="">No goals in this scope and status</option>'
    el('goal-select').value = state.goal || ''
    el('reconcile-goal-select').innerHTML = el('goal-select').innerHTML
    el('reconcile-goal-select').value = state.goal || ''
    el('attn-summary').textContent = `${scopedGoals.filter((s) => s.active).length} active · ${scopedGoals.filter((s) => !s.active).length} inactive`
  }
  function scopeOptions() {
    const roots = new Set([...state.fleet.map((f) => f.root), ...state.signals.map((s) => s.repo), ...state.spawns.map((s) => s.repoRoot), ...state.statuses.map((s) => s.repoRoot)].filter(Boolean))
    if (state.scope) roots.add(state.scope)
    el('fleet-select').innerHTML = '<option value="">All repositories</option>' + [...roots].sort().map((root) => `<option value="${esc(root)}">${esc(root.split(/[\\/]/).pop())} · ${esc(root)}</option>`).join('')
    el('fleet-select').value = state.scope
  }
  function queueRows() {
    const severities = new Set([...doc.querySelectorAll('[data-sev]:checked')].map((n) => n.dataset.sev))
    return state.signals.filter((s) => scoped(s.repo) && severities.has(s.severity) && matches(`${s.subject} ${s.repo} ${s.class}`))
      .sort((a, b) => ['urgent', 'attention', 'info'].indexOf(a.severity) - ['urgent', 'attention', 'info'].indexOf(b.severity))
  }
  function renderCurrent() {
    if (state.view === 'signals') {
      const rows = queueRows(), page = pageRows(rows)
      el('signals-body').innerHTML = rows.length ? signalsHtml(page.rows, state.registry, { selected: state.selected, total: rows.length }) + page.pager : emptyHtml(state.signals.length ? 'No matching work' : 'No findings', 'Change filters or repository scope. Refresh to check for new findings.')
      wireSignalRows(el('signals-body'))
    }
    if (state.view === 'board') {
      const parcels = (state.projection?.parcels || []).filter((p) => matches(`${state.goal} ${p.parcel}`) && (!el('parcel-status').value || p.state === el('parcel-status').value))
      const page = pageRows(parcels)
      el('board').innerHTML = parcels.length ? boardHtml(page.rows, state.statuses.find((s) => s.key === state.goal), { signals: state.signals, registry: state.registry, selected: state.selected, total: parcels.length }) + page.pager : emptyHtml('No matching parcels', state.goal ? 'This goal has no parcels in the current search.' : 'Select a repository with an active goal. Other findings remain in Work queue.')
      wireSignalRows(el('board'))
      el('board').querySelectorAll('[data-parcel]').forEach((card) => {
        on(card, 'click', () => renderDetail(card.dataset.parcel))
        on(card, 'keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); renderDetail(card.dataset.parcel) } })
      })
    }
    if (state.view === 'fleet') {
      const rows = state.fleet.filter((f) => matches(`${f.root} ${f.identity?.remote || ''}`))
      const page = pageRows(rows)
      el('fleet-body').innerHTML = fleetHtml(page.rows) + page.pager
      wireFleet()
    }
    if (state.view === 'reconcile') {
      const data = state.reconcile && state.reconcile.goal === state.goal ? state.reconcile.data : null
      if (!state.goal) el('reconcile-body').innerHTML = emptyHtml('No active goal', 'Choose a repository with an active goal.')
      else if (!data) el('reconcile-body').innerHTML = state.reconcileError ? emptyHtml('Could not load reconciliation', `${state.reconcileError}. Use Refresh to retry.`) : emptyHtml('Loading reconciliation…', 'Comparing the record with local git and the remote. This can take a few seconds.')
      else {
        const rows = filterParcels(data.parcels, state.reconcileFilter, state.queries.reconcile), page = pageRows(rows)
        el('reconcile-body').innerHTML = remoteBannerHtml(data, { stale: state.reconcile.stale }) + countsHtml(data, state.reconcileFilter) + (rows.length ? `<div class="list-meta"><span>${rows.length} of ${data.parcels.length} parcels</span></div>` + reconcileRowsHtml(page.rows, { signals: state.signals, registry: state.registry, selected: state.selected, open: state.reconcileOpen, status: state.statuses.find((s) => s.key === state.goal) }) + page.pager : emptyHtml('No matching parcels', 'Change the filter or search.'))
        wireSignalRows(el('reconcile-body'))
        // Re-renders (refresh, filter) must not collapse what the operator is reading.
        el('reconcile-body').querySelectorAll('.rec-row').forEach((row) => on(row.querySelector('.rec-details summary'), 'click', () => queueMicrotask(() => { const details = row.querySelector('.rec-details'); if (details.open) state.reconcileOpen.add(row.dataset.recParcel); else state.reconcileOpen.delete(row.dataset.recParcel) })))
        el('reconcile-body').querySelectorAll('[data-rec-filter]').forEach((button) => on(button, 'click', () => { state.reconcileFilter = button.dataset.recFilter; state.pages.reconcile = 0; renderCurrent() }))
      }
    }
    if (state.view === 'decisions') {
      const data = state.decisions && state.decisions.scope === state.scope ? state.decisions.data : null
      if (!data) el('decisions-body').innerHTML = state.decisionsError ? emptyHtml('Could not load decisions', `${state.decisionsError}. Use Refresh to retry.`) : emptyHtml('Loading decisions…', 'Reading pull requests and gate state. This can take a few seconds.')
      else {
        const stale = state.decisions.stale ? `<div class="banner warn" role="status"><strong>Showing the last successful read</strong> (${esc(data.generatedAt)}); refreshing failed: ${esc(state.decisions.stale)}.</div>` : ''
        el('decisions-body').innerHTML = stale + decisionsHtml(data, { filter: state.decisionsFilter, query: state.queries.decisions, shown: state.decisionsShown, approvals: state.decisionsApprovals, page: Math.min(state.pages.decisions || 0, Math.max(0, Math.ceil(filterItems(data.items, state.decisionsFilter, state.queries.decisions).length / DECISIONS_PAGE_SIZE) - 1)) })
        wireDecisions(el('decisions-body'))
      }
    }
    const badge = doc.querySelector('[data-nav-badge="decisions"]')
    if (badge) badge.textContent = state.decisions?.data ? `(${(state.decisions.data.items || []).length})` : ''
    if (state.view === 'sessions') {
      const rows = state.spawns.filter((s) => scoped(s.repoRoot) && matches(`${s.sessionName} ${s.paneIndex} ${s.model} ${s.repoRoot}`))
        .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
      if (state.revealSession) {
        const index = rows.findIndex((s) => s.sessionName === state.highlightSession)
        if (index >= 0) { state.pages.sessions = Math.floor(index / 200); state.revealSession = false }
      }
      const page = pageRows(rows)
      el('sessions-body').innerHTML = rows.length ? trayHtml(rows, { page: state.pages.sessions, registry: state.registry, highlight: state.highlightSession }) : !state.spawns.length && !state.loaded.spawns ? (state.loadErrors.spawns ? emptyHtml('Could not load sessions', `${state.loadErrors.spawns}. Use Refresh to retry.`) : emptyHtml('Loading sessions…', 'Waiting for the console to report recorded launches.')) : emptyHtml(state.spawns.length ? 'No matching sessions' : 'No console-recorded launches', 'Launch selected work from Work queue, or clear filters. Sessions started elsewhere are not listed here.')
      wireSessions(el('sessions-body'))
    }
    updateSelectionBar()
  }
  async function loadDecisions() {
    const scope = state.scope, current = ++decisionsGeneration
    state.decisionsError = ''
    try {
      const data = await api(`/api/decisions${scope ? `?repo=${encodeURIComponent(scope)}` : ''}`)
      if (destroyed || current !== decisionsGeneration) return
      if (!Array.isArray(data.items) || typeof data.counts !== 'object' || data.counts === null) throw new Error('Invalid decisions response')
      state.decisions = { scope, data, stale: null }
    } catch (err) {
      if (destroyed || current !== decisionsGeneration) return
      if (!(state.decisions && state.decisions.scope === scope)) state.decisionsError = err.message
      else { state.decisions.stale = err.message; status(`Decisions are stale: ${err.message}. Use Refresh to retry.`, true) }
    }
    renderCurrent()
  }
  function wireDecisions(body) {
    body.querySelectorAll('[data-dec-filter]').forEach((button) => on(button, 'click', () => { state.decisionsFilter = button.dataset.decFilter; state.pages.decisions = 0; renderCurrent() }))
    body.querySelectorAll('[data-show-command]').forEach((button) => on(button, 'click', async () => {
      const feedback = button.parentElement.querySelector('[data-show-status]')
      try {
        const outcome = await api('/api/invoke', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ flow: button.dataset.flow, argv: JSON.parse(button.dataset.argv), mode: 'present' }) })
        if (outcome.action !== 'presented' || typeof outcome.command !== 'string' || !outcome.command) throw new Error(outcome.reason || 'The console did not present this command')
        state.decisionsShown.set(button.dataset.showCommand, outcome.command)
        renderCurrent()
        ;[...doc.querySelectorAll('[data-show-command]')].find((node) => node.dataset.showCommand === button.dataset.showCommand)?.focus()
      } catch (err) { feedback.textContent = `Not shown: ${err.message}` }
    }))
    body.querySelectorAll('[data-approval-show]').forEach((button) => on(button, 'click', async () => {
      const feedback = button.parentElement.querySelector('[data-show-status]')
      try {
        const outcome = await api('/api/invoke', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ flow: 'approval-show', argv: JSON.parse(button.dataset.argv) }) })
        state.decisionsApprovals.set(button.dataset.approvalShow, `${outcome.stdout || ''}${outcome.stderr || ''}`.trim() || `approval show exited ${outcome.exitCode}`)
        renderCurrent()
      } catch (err) { feedback.textContent = `Not shown: ${err.message}` }
    }))
    body.querySelectorAll('[data-copy]').forEach((button) => on(button, 'click', async () => {
      const feedback = button.parentElement.querySelector('[data-copy-status]')
      try { const clipboard = win?.navigator?.clipboard || globalThis.navigator?.clipboard; if (!clipboard) throw new Error(); await clipboard.writeText(button.dataset.copy); feedback.textContent = 'Copied. Run it in a terminal.' }
      catch { feedback.textContent = 'Copy manually from the command above (clipboard unavailable).' }
    }))
  }
  async function loadReconcile() {
    const goal = state.goal, current = ++reconcileGeneration
    if (!goal) { renderCurrent(); return }
    state.reconcileError = ''
    try {
      const data = await api(`/api/reconcile?goal=${encodeURIComponent(goal)}`)
      if (destroyed || current !== reconcileGeneration) return
      // The goal changed while this loaded: drop the result, but re-render so the view never
      // sits on a stale 'Loading' (the load for the new goal is already in flight).
      if (state.goal !== goal) { renderCurrent(); return }
      if (!Array.isArray(data.parcels) || typeof data.counts !== 'object' || data.counts === null) throw new Error('Invalid reconciliation response')
      state.reconcile = { goal, data, stale: null }
    } catch (err) {
      if (destroyed || current !== reconcileGeneration) return
      if (!(state.reconcile && state.reconcile.goal === goal)) state.reconcileError = err.message
      else { state.reconcile.stale = err.message; status(`Reconciliation is stale: ${err.message}. Use Refresh to retry.`, true) }
    }
    renderCurrent()
  }
  async function loadGoal() {
    const current = ++goalGeneration, goal = state.goal
    if (goal && !state.projection && state.view === 'board') el('board').innerHTML = emptyHtml('Loading goal…', 'Reading the authoritative parcel projection.')
    if (!goal) { el('alerts-body').innerHTML = emptyHtml('No active goal', 'Choose a repository with an active goal.'); el('routing-body').innerHTML = emptyHtml('No routing data', 'Select an active goal to inspect policy.'); return }
    try {
      const [projection, alerts, routing] = await Promise.all([api(`/api/parcels?goal=${encodeURIComponent(goal)}`), api(`/api/alerts?goal=${encodeURIComponent(goal)}`), api(`/api/routing?goal=${encodeURIComponent(goal)}`)])
      if (destroyed || current !== goalGeneration || state.goal !== goal) return
      if (!Array.isArray(projection.parcels) || !Array.isArray(alerts.alerts) || !Array.isArray(routing.parcels)) throw new Error('Invalid goal projection response')
      state.projection = projection
      state.remedies = alerts.remedies || []
      const goalContext = `<div class="banner row"><span>Goal: <strong>${esc(goal)}</strong> · ${esc(state.statuses.find((s) => s.key === goal)?.repoRoot || 'Repository root unavailable')}</span><button type="button" data-go-board>Change goal in Goals &amp; parcels</button></div>`
      el('alerts-body').innerHTML = goalContext + remediesHtml(alerts.alerts || [], state.remedies, alerts.notifications || [])
      el('alerts-body').querySelectorAll('[data-del]').forEach((button) => on(button, 'click', async () => {
        // Notification dismissal does not operate on goals, receipts, worktrees or PRs.
        try { await api(`/api/notifications/${encodeURIComponent(button.dataset.del)}`, { method: 'DELETE' }); loadGoal() } catch (err) { status(err.message, true) }
      }))
      const rows = (routing.parcels || []).map((p) => `<tr><td>${esc(p.parcel)}</td><td>${esc(p.routing?.routingClass)}</td><td>${esc(p.routing?.resolvedTier)}</td><td>${esc(p.routing?.resolvedModelId)}</td></tr>`).join('')
      const classes = (routing.policy?.classes || []).map((c) => `<tr><td>${esc(c.name)}</td><td>${esc(c.allowlist?.join(', '))}</td><td>${esc(c.ceilingUsd)}</td></tr>`).join('')
      const roles = (routing.policy?.roles || []).map((r) => `<tr><td>${esc(r.role)}</td><td>${esc(r.tier)}</td></tr>`).join('')
      el('routing-body').innerHTML = goalContext + `<h2>Routing classes</h2><div class="table-wrap"><table><tr><th>Class</th><th>Allowed tiers</th><th>Ceiling USD</th></tr>${classes}</table></div><h2>Role policy</h2><div class="table-wrap"><table><tr><th>Role</th><th>Tier</th></tr>${roles}</table></div><h2>Resolved parcels</h2><div class="table-wrap"><table><tr><th>Parcel</th><th>Class</th><th>Tier</th><th>Model</th></tr>${rows}</table></div>`
      renderCurrent()
      if (state.detailParcel && state.view === 'board') await renderDetail(state.detailParcel)
    } catch (err) {
      if (current === goalGeneration) {
        status(`Goal data stale: ${err.message}. Use Refresh to retry.`, true)
        if (!state.projection) el('board').innerHTML = emptyHtml('Could not load goal', `${err.message}. Use Refresh to retry.`)
        if (!el('alerts-body').textContent) el('alerts-body').innerHTML = emptyHtml('Could not load alerts', 'Use Refresh to retry.')
        if (!el('routing-body').textContent) el('routing-body').innerHTML = emptyHtml('Could not load policy', 'Use Refresh to retry.')
      }
    }
  }
  async function renderDetail(key) {
    const goal = state.goal, current = ++detailGeneration
    const p = state.projection?.parcels?.find((x) => x.parcel === key)
    if (!p) { state.detailParcel = null; el('detail').hidden = true; return }
    state.detailParcel = key
    el('detail').hidden = false
    el('detail').innerHTML = '<p role="status">Loading evidence…</p>'
    try {
      const logs = await api(`/api/parcels/${encodeURIComponent(key)}/logs?goal=${encodeURIComponent(goal)}`)
      if (current !== detailGeneration || goal !== state.goal || destroyed) return
      const root = state.statuses.find((s) => s.key === goal)?.repoRoot || ''
      el('detail').innerHTML = detailHtml(p, logs, root, state.projection.goal?.loopDirectiveRef || '', state.remedies.filter((r) => r.parcel === p.parcel).map(remedyHtml))
    } catch (err) { if (current === detailGeneration) el('detail').textContent = `Could not load evidence: ${err.message}. Select the parcel again to retry.` }
  }
  function updateTray() {
    el('tray-count').textContent = `(${new Set(state.spawns.map((s) => s.sessionName)).size} sessions · ${state.spawns.length} panes)`
    el('tray-body').innerHTML = trayHtml([...state.spawns].sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)).slice(0, 3), { registry: state.registry, compact: true }); wireSessions(el('tray-body'))
  }
  async function refresh() {
    const current = ++generation
    status('Refreshing workspace…')
    // Cheap endpoints first: the server is single-threaded, so a slow goals/signals scan
    // queues everything behind it. Each result is applied as it arrives (below) so a fast
    // answer is never held hostage by a slow one.
    const endpoints = [['registry', '/api/actions'], ['fleet', '/api/fleet'], ['spawns', '/api/spawns'], ['statuses', '/api/goals'], ['signals', '/api/signals']]
    const results = await Promise.allSettled(endpoints.map(async ([key, path]) => {
      const data = await api(path), field = { registry: 'actions', fleet: 'roots' }[key] || key
      const strings = (value) => Array.isArray(value) && value.every((part) => typeof part === 'string')
      const root = absoluteRoot
      const checks = {
        statuses: (row) => typeof row.key === 'string' && root(row.repoRoot) && typeof row.active === 'boolean',
        signals: (row) => typeof row.id === 'string' && typeof row.subject === 'string' && typeof row.class === 'string' && root(row.repo) && strings(row.actions) && strings(row.evidence) && ['urgent', 'attention', 'info'].includes(row.severity),
        registry: (row) => typeof row.verb === 'string' && strings(row.signalClasses) && ['spawn', 'present', 'execute'].includes(row.invocation) && typeof row.destructive === 'boolean' && ['full', 'partial'].includes(row.autonomy?.decisions) && ['commit', 'push', 'openPr', 'merge'].every((permission) => typeof row.autonomy?.[permission] === 'boolean'),
        fleet: (row) => root(row.root),
        spawns: () => true, // Older receipt fields may be absent: render explicit unknowns.
      }
      if (!Array.isArray(data[field]) || !data[field].every((row) => row && typeof row === 'object' && !Array.isArray(row) && checks[key](row))) throw new Error(`Invalid ${key} response`)
      return data[field]
    }).map((promise, i) => promise.then((value) => {
      if (destroyed || current !== generation) return value
      state[endpoints[i][0]] = value; state.loaded[endpoints[i][0]] = true; delete state.loadErrors[endpoints[i][0]]
      renderCurrent()
      if (endpoints[i][0] === 'spawns' || endpoints[i][0] === 'registry') updateTray()
      return value
    }, (reason) => {
      if (!destroyed && current === generation) { state.loadErrors[endpoints[i][0]] = reason.message; renderCurrent() }
      throw reason
    })))
    if (destroyed || current !== generation) return
    const failures = []
    results.forEach((result, i) => { if (result.status === 'rejected') failures.push(`${endpoints[i][0]}: ${result.reason.message}`) })
    reconcileSelection(state.selected, state.signals, state.registry)
    scopeOptions(); goalOptions(); renderCurrent()
    updateTray()
    el('clock').textContent = `Checked ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    status(failures.length ? `Some data is stale: ${failures.join('; ')}. Use Refresh to retry.` : 'Workspace up to date', failures.length > 0)
    if (['board', 'remedies', 'settings'].includes(state.view)) await loadGoal()
    if (state.view === 'reconcile') await loadReconcile()
    if (state.view === 'decisions') await loadDecisions()
  }
  const dialogOrigins = new Map()
  function openDialog(dialog) {
    if (dialog.hasAttribute('open')) return
    dialogOrigins.set(dialog.id, doc.activeElement)
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '')
    dialog.querySelector('button, input, select')?.focus()
  }
  function closeDialog(dialog) {
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open')
    const origin = dialogOrigins.get(dialog.id)
    ;(origin?.isConnected && origin !== doc.body && origin !== doc.documentElement ? origin : el('review-launch')).focus()
  }
  function updateSelectionBar() {
    updateLaunchValidity()
    el('selection-bar').hidden = state.selected.size === 0
    const blocked = [...state.selected.values()].filter((item) => item.unavailable || item.needsReview || item.bulkIssue || !item.verb).length
    el('selection-summary').textContent = `${state.selected.size} item${state.selected.size === 1 ? '' : 's'} selected${blocked ? ` · ${blocked} need review` : ''} across all views`
  }
  function launchBlocked() { return state.submitting || (state.retryRequired && !state.retryAcknowledged) || !state.selected.size || [...state.selected.values()].some((item) => !item.verb || item.unavailable || item.needsReview || item.bulkIssue) }
  function updateLaunchValidity() {
    reconcileSelection(state.selected, state.signals, state.registry)
    if (el('spawn-run')) el('spawn-run').disabled = launchBlocked()
    if (el('launch-dialog').hasAttribute('open')) {
      const problems = [...state.selected.values()].filter((item) => item.unavailable || item.needsReview)
      if (problems.length) el('spawn-result').textContent = 'Selection changed during refresh. Reopen review to resolve unavailable items or changed permission defaults.'
    }
  }
  function updateSpawnPanel() {
    const active = doc.activeElement
    const focusData = el('spawn-panel').contains(active) ? { ...active.dataset } : null
    const focusItem = active?.closest('[data-launch-item]')?.dataset.launchItem
    state.launchPage = Math.min(state.launchPage, Math.max(0, Math.ceil(state.selected.size / 200) - 1))
    el('spawn-panel').innerHTML = spawnPanelHtml({ count: state.selected.size, controls: state.controls, selections: [...state.selected.values()], registry: state.registry, extra: state.extra, error: state.launchError, page: state.launchPage, suggested: state.suggested, bulk: state.bulk, bulkResult: state.bulkResult, retryRequired: state.retryRequired, retryAcknowledged: state.retryAcknowledged })
    const form = el('spawn-form')
    el('spawn-run').disabled = launchBlocked()
    if (focusData && Object.keys(focusData).length) {
      const replacement = [...form.querySelectorAll('button, input, select')].find((node) => !node.disabled &&
        node.closest('[data-launch-item]')?.dataset.launchItem === focusItem &&
        Object.entries(focusData).every(([key, value]) => node.dataset[key] === value))
      ;(replacement || doc.querySelector('[data-close-dialog]')).focus()
    }
    function saveDraft() { state.controls = readControls(form); state.extra = form.querySelector('[name="extra"]').value }
    on(form, 'input', saveDraft)
    on(form, 'change', (event) => {
      saveDraft()
      const node = event.target, wrapper = node.closest('[data-launch-item]')
      if (node.hasAttribute('data-ack-retry')) { state.retryAcknowledged = node.checked; updateLaunchValidity(); return }
      if (node.hasAttribute('data-suggested')) {
        state.suggested = node.checked
        if (state.suggested) {
          const result = useSuggestedSettings(state.selected, state.registry)
          state.bulkResult = `Suggestions: ${result.updated} updated · ${result.skipped} skipped (manual, unchanged or flagged).`
        }
        updateSpawnPanel(); return
      }
      if (node.hasAttribute('data-bulk-verb')) state.bulk.verb = node.value
      if (node.dataset.bulkPermission) state.bulk[node.dataset.bulkPermission] = node.dataset.bulkPermission === 'decisions' ? node.value : node.checked
      const item = wrapper && state.selected.get(wrapper.dataset.launchItem)
      if (!item) return
      if (node.matches('[data-verb]')) {
        const entry = eligibleActions(item.signal, state.registry).find((e) => e.verb === node.value)
        chooseAction(item, entry, state.suggested)
        item.manualAction = true; item.needsReview = false
        updateSpawnPanel(); return
      }
      if (node.dataset.permission && node.dataset.permission !== 'merge') {
        item.autonomy[node.dataset.permission] = node.dataset.permission === 'decisions' ? node.value : node.checked
        item.manualPermissions = true
      }
      updateLaunchValidity()
    })
    on(form, 'click', (event) => {
      const node = event.target.closest('button'), wrapper = node?.closest('[data-launch-item]')
      if (!node) return
      saveDraft()
      if (node.hasAttribute('data-apply-actions') || node.hasAttribute('data-apply-permissions')) {
        if (state.submitting) return
        reconcileSelection(state.selected, state.signals, state.registry)
        if (node.hasAttribute('data-apply-actions') && !state.bulk.verb) { state.bulkResult = 'Choose an action before applying.'; updateSpawnPanel(); return }
        const settings = node.hasAttribute('data-apply-actions') ? { verb: state.bulk.verb } : { autonomy: { decisions: state.bulk.decisions || 'partial', commit: !!state.bulk.commit, push: !!state.bulk.push, openPr: !!state.bulk.openPr, merge: false } }
        const result = applyToSelection(state.selected, state.registry, settings, state.suggested)
        state.bulkResult = `${result.updated} updated · ${result.skipped} skipped. Skipped items remain flagged; review or remove them.`
        updateSpawnPanel(); return
      }
      if (node.hasAttribute('data-inspect-sessions')) { closeDialog(el('launch-dialog')); state.scope = ''; state.queries.sessions = ''; state.pages.sessions = 0; scopeOptions(); goalOptions(); setView('sessions'); return }
      if (node.hasAttribute('data-page')) { state.launchPage = Math.max(0, state.launchPage + (node.dataset.page === 'next' ? 1 : -1)); updateSpawnPanel() }
      if (node.hasAttribute('data-remove-selection')) { state.selected.delete(wrapper.dataset.launchItem); updateSelectionBar(); updateSpawnPanel(); renderCurrent() }
      if (node.hasAttribute('data-ack-review')) {
        const item = state.selected.get(wrapper.dataset.launchItem), entry = eligibleActions(item.signal, state.registry).find((e) => e.verb === item.verb)
        item.signature = actionSignature(entry); item.needsReview = false; updateSpawnPanel()
      }
    })
    on(form, 'submit', async (event) => {
      event.preventDefault(); saveDraft(); updateLaunchValidity()
      if (launchBlocked()) return
      state.submitting = true; el('spawn-run').disabled = true; el('spawn-result').textContent = 'Launching… Do not resubmit.'
      const ids = [...state.selected.keys()], selections = [...state.selected.values()]
      try {
        const result = await api('/api/spawn', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(spawnRequest(selections, state.controls, state.extra)) })
        const launched = result.launch?.launched
        if (!result.plan?.sessionName || !Array.isArray(launched) || launched.length !== ids.length || new Set(launched).size !== ids.length || !launched.every((index) => Number.isInteger(index) && index >= 0 && index < ids.length) || result.launch?.failed != null) throw new Error('Launch response did not confirm every requested pane')
        const name = result.plan.sessionName
        state.highlightSession = name
        state.launchError = ''; state.retryRequired = false; state.retryAcknowledged = false
        el('launch-outcome').innerHTML = `<div class="banner"><strong>Launched ${esc(name)}</strong><p>${result.launch.launched.length} pane${result.launch.launched.length === 1 ? '' : 's'} recorded in one session. Pane liveness is not proof that work is complete.</p><button type="button" data-go-sessions data-reveal-session>View launched session →</button></div>`
        ids.forEach((id) => state.selected.delete(id))
        doc.querySelectorAll('[data-select]').forEach((box) => { box.checked = state.selected.has(box.dataset.select) })
        updateSelectionBar(); closeDialog(el('launch-dialog')); await refresh()
      } catch (err) {
        state.launchError = `Launch not confirmed: ${err.message}. A session or worktree may have started. Inspect Sessions and refresh before deciding whether to retry; no automatic retry will occur.`
        state.retryRequired = true; state.retryAcknowledged = false
        updateSpawnPanel()
        el('launch-outcome').innerHTML = `<div class="banner"><strong>Launch not confirmed</strong><p>${esc(state.launchError)}</p><button type="button" data-go-sessions>Inspect sessions →</button></div>`
        await refresh()
      } finally { state.submitting = false; if (el('spawn-run')) el('spawn-run').disabled = launchBlocked() }
    })
  }
  function wireSignalRows(body) {
    let last = null
    const boxes = [...body.querySelectorAll('[data-select]')]
    function selectBox(box, checked) {
      box.checked = checked
      const signal = state.signals.find((s) => s.id === box.dataset.select)
      if (checked && signal && !state.selected.has(signal.id)) state.selected.set(signal.id, selectTarget(signal, state.registry))
      else if (!checked) state.selected.delete(box.dataset.select)
    }
    boxes.forEach((box, index) => {
      box.checked = state.selected.has(box.dataset.select)
      on(box, 'click', (event) => {
        const range = event.shiftKey && last !== null ? boxes.slice(Math.min(last, index), Math.max(last, index) + 1) : [box]
        for (const b of range) selectBox(b, box.checked)
        last = index; updateSelectionBar()
      })
    })
    on(body.querySelector('[data-select-visible]'), 'click', () => { boxes.forEach((b) => selectBox(b, true)); updateSelectionBar() })
    on(body.querySelector('[data-clear-visible]'), 'click', () => { boxes.forEach((b) => selectBox(b, false)); updateSelectionBar() })
    body.querySelectorAll('.action-btn').forEach((button) => on(button, 'click', () => {
      const signal = state.signals.find((s) => s.id === button.dataset.signalId)
      const entry = state.registry.find((e) => e.verb === button.dataset.verb && e.signalClasses.includes(signal?.class))
      if (!signal || !entry) return
      if (!entry.destructive && entry.invocation === 'spawn') {
        const item = state.selected.get(signal.id) || selectTarget(signal, state.registry)
        if (item.verb !== entry.verb) {
          chooseAction(item, entry, state.suggested); item.needsReview = false
          item.manualAction = true
        }
        state.selected.set(signal.id, item); updateSelectionBar(); updateSpawnPanel(); openDialog(el('launch-dialog'))
      } else showAction(signal, entry)
    }))
  }
  function showAction(signal, entry) {
    el('action-popover').innerHTML = actionPopoverHtml(signal, entry.verb, entry)
    const form = el('action-popover').querySelector('form')
    let submitting = false
    on(form.querySelector('[data-cancel]'), 'click', () => closeDialog(el('action-dialog')))
    on(form, 'submit', async (event) => {
      event.preventDefault()
      if (submitting) return
      const token = form.querySelector('[name="confirmation"]')?.value || null
      if (entry.destructive && token !== confirmationToken(signal.subject)) { form.querySelector('[data-confirm-error]').hidden = false; return }
      const autonomy = { decisions: form.querySelector('[name="decisions"]:checked').value }
      for (const name of ['commit', 'push', 'openPr', 'merge']) autonomy[name] = form.querySelector(`[name="${name}"]`).checked
      submitting = true; form.querySelector('[type="submit"]').disabled = true
      try {
        const result = await api('/api/actions/dispatch', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ verb: entry.verb, signalClass: signal.class, subject: signal.subject, autonomy: { ...autonomy, merge: false }, confirmation: token, extraText: form.querySelector('[name="extra"]').value || null }) })
        el('action-result').innerHTML = `<div class="banner"><strong>Action ${esc(result.action || 'submitted')} · ${esc(signal.subject)}</strong>${result.reason ? `<p>${esc(result.reason)}</p>` : ''}<details><summary>Action response / presented command</summary><pre>${esc(JSON.stringify(result, null, 2))}</pre></details></div>`
        if (el('action-popover').contains(form)) closeDialog(el('action-dialog'))
        await refresh()
      } catch (err) { form.querySelector('[data-confirm-error]').textContent = err.message; form.querySelector('[data-confirm-error]').hidden = false }
      finally { submitting = false; form.querySelector('[type="submit"]').disabled = false }
    })
    openDialog(el('action-dialog'))
  }
  function wireSessions(body) {
    body.querySelectorAll('[data-copy]').forEach((button) => on(button, 'click', async () => {
      const feedback = button.parentElement.querySelector('[data-copy-status]')
      try { const clipboard = win?.navigator?.clipboard || globalThis.navigator?.clipboard; if (!clipboard) throw new Error(); await clipboard.writeText(button.dataset.copy); feedback.textContent = 'Copied attach command' }
      catch { feedback.textContent = 'Copy manually from the command above (clipboard unavailable).' }
    }))
    body.querySelectorAll('[data-session-action]').forEach((button) => on(button, 'click', () => {
      const entry = state.registry.find((e) => e.verb === button.dataset.sessionAction && e.signalClasses.includes('session-state'))
      if (entry) showAction({ class: 'session-state', subject: button.dataset.subject, repo: button.dataset.repo, actions: [entry.verb] }, entry)
    }))
  }
  function wireFleet() {
    const error = (text) => { el('fleet-error').hidden = !text; el('fleet-error').textContent = text || '' }
    on(el('browse-run'), 'click', async () => {
      try { const data = await api(`/api/fs/browse?path=${encodeURIComponent(el('browse-path').value)}`); error(null); el('browse-list').innerHTML = browseListHtml(data.path, data.entries || []); el('browse-list').querySelectorAll('[data-open]').forEach((b) => on(b, 'click', () => { el('browse-path').value = b.dataset.open; el('browse-run').click() })); el('browse-list').querySelectorAll('[data-pick]').forEach((b) => on(b, 'click', () => { state.browseSelection = b.dataset.pick; el('browse-selection').textContent = `Selected: ${b.dataset.pick}`; el('fleet-add').disabled = false })) } catch (err) { error(err.message) }
    })
    on(el('fleet-add'), 'click', async () => {
      try { await api('/api/fleet/add', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ root: state.browseSelection }) }); state.browseSelection = null; await refresh() } catch (err) { error(err.message) }
    })
    el('fleet-body').querySelectorAll('[data-remove]').forEach((b) => on(b, 'click', async () => {
      try { await api('/api/fleet/remove', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ root: b.dataset.remove }) }); await refresh() } catch (err) { error(err.message) }
    }))
  }
  el('app').innerHTML = shellHtml()
  on(doc.querySelector('.skip-link'), 'click', (event) => { event.preventDefault(); el('main').focus(); el('main').scrollIntoView?.({ block: 'start' }) })
  doc.querySelectorAll('.nav-btn').forEach((b) => on(b, 'click', () => setView(b.dataset.view)))
  on(el('fleet-select'), 'change', () => { state.scope = el('fleet-select').value; state.pages = {}; if (state.view === 'decisions') loadDecisions(); ++goalGeneration; ++detailGeneration; goalOptions(); renderCurrent(); if (['board', 'remedies', 'settings'].includes(state.view)) loadGoal(); if (state.view === 'reconcile') loadReconcile() })
  on(el('goal-status'), 'change', () => { state.pages.board = 0; goalOptions(); renderCurrent(); loadGoal(); if (state.view === 'reconcile') loadReconcile() })
  on(el('parcel-status'), 'change', () => { state.pages.board = 0; renderCurrent() })
  on(el('reconcile-goal-select'), 'change', () => { state.goal = el('reconcile-goal-select').value; state.projection = null; state.detailParcel = null; ++detailGeneration; state.reconcileFilter = ''; state.reconcileOpen.clear(); state.pages.reconcile = 0; goalOptions(); renderCurrent(); loadReconcile() })
  on(el('goal-select'), 'change', () => { state.goal = el('goal-select').value; state.reconcileOpen.clear(); state.reconcileFilter = ''; state.projection = null; state.detailParcel = null; ++detailGeneration; el('detail').hidden = true; renderCurrent(); loadGoal() })
  on(el('global-search'), 'input', () => { state.queries[state.view] = el('global-search').value.trim(); state.pages[state.view] = 0; renderCurrent() })
  doc.querySelectorAll('[data-sev]').forEach((b) => on(b, 'change', () => { state.pages.signals = 0; renderCurrent() }))
  on(el('main'), 'click', (event) => { const b = event.target.closest('[data-page]'); if (b) { state.pages[state.view] = Math.max(0, (state.pages[state.view] || 0) + (b.dataset.page === 'next' ? 1 : -1)); renderCurrent() } if (event.target.closest('[data-go-board]')) setView('board')
    if (event.target.closest('[data-go-sessions]')) {
      if (event.target.closest('[data-reveal-session]')) { state.scope = ''; state.queries.sessions = ''; state.pages.sessions = 0; state.revealSession = true; scopeOptions(); goalOptions() }
      setView('sessions')
    } })
  on(el('tray-toggle'), 'click', () => { el('tray-body').hidden = !el('tray-body').hidden; el('tray-toggle').setAttribute('aria-expanded', String(!el('tray-body').hidden)) })
  on(el('clear-selection'), 'click', () => { state.selected.clear(); renderCurrent() })
  on(el('review-launch'), 'click', () => { updateSpawnPanel(); openDialog(el('launch-dialog')) })
  on(doc.querySelector('[data-close-dialog]'), 'click', () => closeDialog(el('launch-dialog')))
  on(doc.querySelector('[data-close-action]'), 'click', () => closeDialog(el('action-dialog')))
  on(el('workflow-help'), 'click', () => openDialog(el('help-dialog')))
  on(doc.querySelector('[data-launch-help]'), 'click', () => openDialog(el('help-dialog')))
  on(doc.querySelector('[data-close-help]'), 'click', () => closeDialog(el('help-dialog')))
  for (const id of ['launch-dialog', 'action-dialog', 'help-dialog']) {
    on(el(id), 'cancel', (event) => { event.preventDefault(); closeDialog(el(id)) })
    on(el(id), 'keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); closeDialog(el(id)) }
      if (event.key === 'Tab') {
        const controls = [...el(id).querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea, a[href]')]
        const first = controls[0], last = controls[controls.length - 1]
        if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    })
  }
  on(el('flow-form'), 'submit', async (event) => {
    event.preventDefault()
    try { const data = await api('/api/invoke', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ flow: el('flow-select').value, argv: [1, 2, 3, 4].map((n) => el(`flow-arg${n}`).value.trim()).filter(Boolean) }) }); el('flow-result').textContent = JSON.stringify(data, null, 2) } catch (err) { el('flow-result').textContent = err.message }
  })
  const hashChange = () => { if (win.location.hash.slice(1) !== state.view) setView(win.location.hash.slice(1), false) }
  on(win, 'hashchange', hashChange)
  setView(win?.location.hash.slice(1), false)
  async function initialize() {
    try {
      const health = await api('/api/health')
      if (health.ok !== true || !absoluteRoot(health.repoRoot)) throw new Error('Invalid health response')
      state.repoRoot = health.repoRoot
      await refresh()
    }
    catch (err) { if (!destroyed) status(`Cannot load workspace: ${err.message}. Use Refresh to retry.`, true) }
  }
  on(el('refresh'), 'click', () => state.repoRoot ? refresh() : initialize())
  const ready = initialize()
  const timer = setInterval(() => { if (!destroyed) refresh() }, 60000)
  timer?.unref?.()
  return { ready, refresh, destroy: () => { destroyed = true; ++generation; ++goalGeneration; ++detailGeneration; clearInterval(timer); win?.removeEventListener('hashchange', hashChange) } }
}
if (typeof document !== 'undefined') startConsole(document)
