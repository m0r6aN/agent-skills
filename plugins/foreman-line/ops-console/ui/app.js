// Foreman Ops Console frontend — control-center shell (FCA-P6 Task 15).
// No build step, no dependencies: ES modules served as-is. Data + events live
// here; pure rendering lives in ui/views/*.
import { needsFor } from './needs.js'
import { esc, shellHtml } from './views/shell.js'
import { boardHtml, detailHtml } from './views/board.js'
import { remedyHtml, remediesHtml } from './views/remedies.js'
import {
  actionPopoverHtml,
  confirmationToken,
  selectionToActions,
  signalsHtml,
} from './views/signals.js'

const state = {
  view: 'board',
  goal: null,
  goals: [],
  statuses: [],
  remedies: [],
  projection: null,
  repoRoot: '',
  posture: '',
  signals: [],
  registry: [],
  selected: new Map(),
}

async function api(path, options) {
  const res = await fetch(path, options)
  return res.json()
}

function setView(view) {
  state.view = view
  document.querySelectorAll('main > section[data-view]').forEach((section) => {
    section.hidden = section.dataset.view !== view
  })
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    const active = btn.dataset.view === view
    btn.classList.toggle('active', active)
    btn.setAttribute('aria-current', active ? 'page' : 'false')
  })
  if (view === 'signals') renderSignals()
}

function renderBoard() {
  const board = document.getElementById('board')
  if (board === null) return
  const parcels = (state.projection && state.projection.parcels) || []
  const status = (state.statuses || []).find((s) => s.key === state.goal) || null
  board.innerHTML = boardHtml(parcels, status)
  board.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => renderDetail(card.dataset.parcel))
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') renderDetail(card.dataset.parcel)
    })
  })
}

async function renderDetail(key) {
  const p = ((state.projection && state.projection.parcels) || []).find((x) => x.parcel === key)
  const section = document.getElementById('detail')
  if (!p) {
    section.innerHTML = '<div class="muted">parcel not found</div>'
    return
  }
  const chainDocs = await api(`/api/parcels/${encodeURIComponent(key)}/logs?goal=${encodeURIComponent(state.goal)}`)
  const mine = (state.remedies || [])
    .filter((r) => r.parcel === p.parcel)
    .map((r) => remedyHtml(r))
  section.innerHTML = detailHtml(
    p,
    chainDocs,
    state.repoRoot,
    (state.projection && state.projection.goal && state.projection.goal.loopDirectiveRef) || '',
    mine,
  )
}

async function renderAlerts() {
  const data = await api(`/api/alerts?goal=${encodeURIComponent(state.goal)}`)
  state.remedies = data.remedies || []
  const body = document.getElementById('alerts-body')
  body.innerHTML = remediesHtml(data.alerts, state.remedies, data.notifications)
  body.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await api(`/api/notifications/${encodeURIComponent(btn.dataset.del)}`, { method: 'DELETE' })
      renderAlerts()
    })
  })
}

async function renderSignals() {
  const [signalsData, actionsData] = await Promise.all([api('/api/signals'), api('/api/actions')])
  state.signals = signalsData.signals || []
  state.registry = actionsData.actions || []
  const body = document.getElementById('signals-body')
  body.innerHTML = signalsHtml(state.signals, state.registry)
  wireSignalRows(body)
  applySeverityFilters()
  updateSpawnPanel()
}

function applySeverityFilters() {
  const on = new Set(
    [...document.querySelectorAll('input[data-sev]:checked')].map((input) => input.dataset.sev),
  )
  document.querySelectorAll('.signal-row').forEach((row) => {
    row.style.display = on.has(row.dataset.severity) ? '' : 'none'
  })
}

function selectionPayloads() {
  return [...state.selected.values()].map((signal) => {
    const verbs = (signal.actions || []).filter((verb) =>
      state.registry.some((entry) => entry.verb === verb && entry.signalClasses.includes(signal.class)))
    const verb = verbs[0] || 'investigate'
    const entry = state.registry.find(
      (candidate) => candidate.verb === verb && candidate.signalClasses.includes(signal.class),
    )
    return { signal, verb, autonomy: (entry && entry.autonomy) || {}, extraText: null }
  })
}

function updateSpawnPanel() {
  const panel = document.getElementById('spawn-panel')
  if (panel === null) return
  const actions = selectionToActions(selectionPayloads())
  panel.innerHTML = actions.length === 0
    ? '<p class="muted">select signal rows to configure a spawn (Task 17)</p>'
    : `<p>${actions.length} action(s) queued</p><pre>${esc(JSON.stringify(actions, null, 2))}</pre>`
}

function wireSignalRows(body) {
  let lastChecked = null
  const boxes = [...body.querySelectorAll('[data-select]')]
  boxes.forEach((box, index) => {
    box.addEventListener('click', (event) => {
      if (event.shiftKey && lastChecked !== null) {
        const lo = Math.min(lastChecked, index)
        const hi = Math.max(lastChecked, index)
        for (let i = lo; i <= hi; i += 1) boxes[i].checked = box.checked
      }
      lastChecked = index
      state.selected = new Map(
        boxes
          .filter((candidate) => candidate.checked)
          .map((candidate) => [candidate.dataset.select, state.signals.find((s) => s.id === candidate.dataset.select)]),
      )
      updateSpawnPanel()
    })
  })
  body.querySelectorAll('.action-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const signal = state.signals.find(
        (s) => s.subject === btn.dataset.subject && s.class === btn.dataset.class,
      )
      const entry = state.registry.find(
        (candidate) => candidate.verb === btn.dataset.verb && candidate.signalClasses.includes(btn.dataset.class),
      )
      if (!signal || !entry) return
      const popover = document.getElementById('action-popover')
      popover.innerHTML = actionPopoverHtml(signal, entry.verb, entry)
      wirePopover(popover.querySelector('form'), signal, entry)
    })
  })
}

function wirePopover(form, signal, entry) {
  form.querySelector('[data-cancel]').addEventListener('click', () => {
    form.remove()
  })
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const checked = (name) => {
      const el = form.querySelector(`[name="${name}"]`)
      return el !== null && el.checked === true
    }
    const decisions = form.querySelector('[name="decisions"]:checked').value
    const confirmationEl = form.querySelector('[name="confirmation"]')
    const confirmation = confirmationEl === null ? null : confirmationEl.value
    // Destructive gate (FCA-P4 contract mirrored): no request is EVER sent
    // without the exact typed intent for this subject.
    if (form.dataset.destructive === 'true' && confirmation !== confirmationToken(signal.subject)) {
      form.querySelector('[data-confirm-error]').hidden = false
      return
    }
    const outcome = await api('/api/actions/dispatch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        verb: entry.verb,
        signalClass: signal.class,
        subject: signal.subject,
        autonomy: {
          decisions,
          commit: checked('commit'),
          push: checked('push'),
          openPr: checked('openPr'),
          merge: checked('merge'),
        },
        confirmation,
      }),
    })
    document.getElementById('action-result').textContent = JSON.stringify(outcome, null, 2)
    form.remove()
    renderAlerts()
  })
}

async function renderRouting() {
  const data = await api(`/api/routing?goal=${encodeURIComponent(state.goal)}`)
  const classRows = ((data.policy && data.policy.classes) || []).map((c) =>
    `<tr><td>${esc(c.name)}</td><td>${esc(c.allowlist.join(', '))}</td><td>${esc(c.ceilingUsd)}</td></tr>`).join('')
  const roleRows = ((data.policy && data.policy.roles) || []).map((r) =>
    `<tr><td>${esc(r.role)}</td><td>${esc(r.tier)}</td></tr>`).join('')
  const parcelRows = (data.parcels || []).map((p) =>
    `<tr><td>${esc(p.parcel)}</td><td>${esc(p.routing.routingClass)}</td><td>${esc(p.routing.resolvedTier)}</td><td>${esc(p.routing.resolvedModelId)}</td></tr>`).join('')
  document.getElementById('routing-body').innerHTML = `
    <table><tr><th>class</th><th>allowlist (tiers)</th><th>ceiling USD</th></tr>${classRows}</table>
    <table><tr><th>role</th><th>tier</th></tr>${roleRows}</table>
    <table><tr><th>parcel</th><th>routing class</th><th>resolved tier</th><th>resolved model</th></tr>${parcelRows}</table>`
}

async function refresh() {
  const clock = document.getElementById('clock')
  if (clock !== null) clock.textContent = new Date().toISOString()
  if (!state.goal) return
  state.projection = await api(`/api/parcels?goal=${encodeURIComponent(state.goal)}`)
  renderBoard()
  renderAlerts()
  renderRouting()
  if (state.view === 'signals') await renderSignals()
}

function wireEvents() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => setView(btn.dataset.view))
  })
  const select = document.getElementById('goal-select')
  select.addEventListener('change', () => {
    state.goal = select.value
    refresh()
  })
  document.getElementById('refresh').addEventListener('click', refresh)

  const trayToggle = document.getElementById('tray-toggle')
  trayToggle.addEventListener('click', () => {
    const body = document.getElementById('tray-body')
    const opening = body.hidden
    body.hidden = !opening
    trayToggle.setAttribute('aria-expanded', String(opening))
  })

  document.getElementById('flow-run').addEventListener('click', async () => {
    const flow = document.getElementById('flow-select').value
    const argv = ['flow-arg1', 'flow-arg2', 'flow-arg3', 'flow-arg4']
      .map((id) => document.getElementById(id).value.trim())
      .filter((v) => v.length > 0)
    const result = await api('/api/invoke', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ flow, argv }),
    })
    document.getElementById('flow-result').textContent = JSON.stringify(result, null, 2)
    renderAlerts()
  })

  const search = document.getElementById('global-search')
  search.addEventListener('input', () => {
    const needle = search.value.trim().toLowerCase()
    document.querySelectorAll('#board .card').forEach((card) => {
      card.style.display = needle === '' || card.textContent.toLowerCase().includes(needle) ? '' : 'none'
    })
  })
  document.querySelectorAll('input[data-sev]').forEach((input) => {
    input.addEventListener('change', applySeverityFilters)
  })
}

async function init() {
  const app = document.getElementById('app')
  const health = await api('/api/health')
  state.repoRoot = health.repoRoot || ''
  state.posture = health.posture || ''
  app.innerHTML = shellHtml({ posture: state.posture, activeView: state.view })

  const goals = await api('/api/goals')
  state.goals = goals.goals || []
  // FCA-2: the picker lists ACTIVE goals only, grouped per goal tree,
  // attention first.
  state.statuses = goals.statuses
    || state.goals.map((g) => ({ key: g.slug, tree: null, active: true, attention: { total: 0 } }))
  const active = state.statuses.filter((s) => s.active)
  active.sort((a, b) => (b.attention.total > 0) - (a.attention.total > 0))
  const groups = new Map()
  for (const status of active) {
    const label = status.tree === null ? 'foreman-line' : status.tree
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(status)
  }
  const select = document.getElementById('goal-select')
  select.innerHTML = [...groups].map(([label, list]) =>
    `<optgroup label="${esc(label)}">${list.map((s) => {
      const marker = s.attention.total > 0 ? ` ● ${s.attention.total}` : ''
      return `<option value="${esc(s.key)}">${esc(s.key)}${marker}</option>`
    }).join('')}</optgroup>`).join('') || '<option value="">no active goals</option>'
  state.goal = active.length ? active[0].key : null
  select.value = state.goal ?? ''
  const attnGoals = state.statuses.filter((s) => s.active && s.attention.total > 0).length
  const summary = document.getElementById('attn-summary')
  if (summary !== null) {
    summary.textContent = attnGoals > 0 ? `⚠ ${attnGoals} goal${attnGoals === 1 ? '' : 's'} need attention` : ''
    summary.className = attnGoals > 0 ? 'banner-inline' : 'muted'
  }

  wireEvents()
  await refresh()
  // OQ2: poll on page load + 60s background refresh (unref keeps node test
  // runs from hanging on the timer).
  const timer = setInterval(refresh, 60000)
  if (typeof timer === 'object' && timer !== null && typeof timer.unref === 'function') timer.unref()
}

init().catch((err) => {
  const detail = document.getElementById('detail')
  if (detail !== null) detail.innerHTML = `<div class="flags">${esc(err.message)}</div>`
})
