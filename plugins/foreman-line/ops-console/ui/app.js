// Foreman Ops Console frontend (copied UX shape from the Automations hub:
// board + approvals + notifications + logs + models view, adapted to parcel
// lifecycle). No build step, no dependencies: this file is served as-is.
'use strict'

const STATES = ['running', 'hung', 'awaiting-gate', 'failed', 'complete']
const state = { goal: null, goals: [], statuses: [], remedies: [], projection: null, repoRoot: '' }

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c])
}

function fileLink(ref) {
  if (!ref) return '—'
  return `<a href="file:///${esc(state.repoRoot)}/${esc(ref)}" title="open on disk">${esc(ref)}</a>`
}

async function api(path, options) {
  const res = await fetch(path, options)
  return res.json()
}

function renderBoard() {
  const board = document.getElementById('board')
  const parcels = (state.projection && state.projection.parcels) || []
  const status = (state.statuses || []).find((s) => s.key === state.goal) || null
  const attention = (status && status.attention) || { hung: 0, failed: 0, awaitingGate: 0, ratificationPending: 0, total: 0 }
  // FCA-2: the board leads with what needs the human — a banner above the
  // columns and a "needs" treatment on the cards that carry the attention.
  const banner = attention.total > 0
    ? `<div class="banner">needs attention — ${[
        attention.hung ? `${attention.hung} hung` : '',
        attention.failed ? `${attention.failed} failed` : '',
        attention.awaitingGate ? `${attention.awaitingGate} awaiting gate` : '',
        attention.ratificationPending ? 'goal charter awaiting ratification' : '',
      ].filter(Boolean).join(' · ')}</div>`
    : ''
  board.innerHTML = banner + STATES.map((col) => {
    const cards = parcels.filter((p) => p.state === col).map((p) => {
      const needs = p.state === 'hung' || p.state === 'failed' ? 'needs needs-red'
        : p.state === 'awaiting-gate' ? 'needs needs-amber' : ''
      const chip = needs ? `<span class="chip ${needs.includes('red') ? 'chip-red' : 'chip-amber'}">${p.state === 'awaiting-gate' ? 'gate' : 'needs attention'}</span>` : ''
      return `
      <div class="card ${needs}" data-parcel="${esc(p.parcel)}">
        <div class="key">${esc(p.parcel)} ${chip}</div>
        <div class="meta">rule ${esc(p.rule)} · chain ${esc(p.chainEvidence)}</div>
        <div class="meta">progress ${esc(p.heartbeat.lastProgressAt || 'never')} · liveness ${p.liveness.live ? 'live' : 'none'}</div>
        ${p.failure ? `<div class="flags">${esc(p.failure.code)}</div>` : ''}
        ${p.flags.length ? `<div class="flags">${esc(p.flags.join(', '))}</div>` : ''}
      </div>`
    }).join('')
    return `<div class="col ${col}"><h2>${col} (${parcels.filter((p) => p.state === col).length})</h2>${cards || '<div class="muted">—</div>'}</div>`
  }).join('')
  board.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => renderDetail(card.dataset.parcel))
  })
}

function gatePill(gate) {
  return `<span class="pill ${esc(gate.status)}">${esc(gate.gate)} ${esc(gate.status)}</span> ${esc(gate.detail)}`
}

// FCA-3: triage question + answer-branch recommendations. Presentation only
// — every command is copy-pasteable and the console never executes it.
function remedyHtml(r) {
  return `<details class="remedy" open>
    <summary>${esc(r.parcel || r.goal)} — ${esc(r.cause)}</summary>
    <div class="remedy-q">${esc(r.question)}</div>
    ${r.options.map((o) => `
      <div class="remedy-opt">
        <div class="remedy-a">${esc(o.answer)}</div>
        <div>${esc(o.recommendation)}</div>
        ${(o.commands || []).map((c) => `<pre class="cmd">${esc(c)}</pre>`).join('')}
      </div>`).join('')}
    <div class="muted">presented only — the console never executes these; options are ordered preserve-and-complete first</div>
  </details>`
}

async function renderDetail(key) {
  const p = ((state.projection && state.projection.parcels) || []).find((x) => x.parcel === key)
  const section = document.getElementById('detail')
  if (!p) { section.innerHTML = '<div class="muted">parcel not found</div>'; return }
  const chainRows = (p.chain ? p.chain.members : []).map((m) => `
    <tr><td>${esc(m.sequence)}</td><td>${esc(m.stage)}</td><td>${esc(m.subjectKind)}</td>
    <td>${esc(m.timestamp)}</td><td><code>${esc(m.hash.slice(0, 16))}…</code></td><td>${fileLink(m.locator)}</td></tr>`).join('')
  const chainDocs = await api(`/api/parcels/${encodeURIComponent(key)}/logs?goal=${encodeURIComponent(state.goal)}`)
  const logDocs = (chainDocs.chainDocuments || []).map((d) =>
    `<pre>${esc(d.locator)}\n${esc(JSON.stringify(d.json != null ? d.json : d, null, 2))}</pre>`).join('')
  const audit = (chainDocs.invocationAudit || []).map((e) =>
    `<tr><td>${esc(e.timestamp)}</td><td>${esc(e.flow)}</td><td>${esc(e.action)}</td><td><code>${esc(e.command)}</code></td><td>${esc(e.exitCode == null ? '' : e.exitCode)}</td></tr>`).join('')
  section.innerHTML = `
    <h2>${esc(p.parcel)} — ${esc(p.state)} <span class="muted">(rule ${esc(p.rule)})</span></h2>
    <div class="row">
      <span>spec: ${fileLink(p.specRef)} <span class="muted">[${esc(p.specLocation)}]</span></span>
      <span>chain: ${p.chain ? fileLink(p.chain.locator) : 'absent'} ${p.chain && !p.chain.valid ? '<span class="flags">INVALID</span>' : ''}</span>
      <span>goal record: ${fileLink((state.projection && state.projection.goal && state.projection.goal.loopDirectiveRef) || '')}</span>
    </div>
    <p>${gatePill(p.gates.G1)} · ${gatePill(p.gates.G2)} · ${gatePill(p.gates.G3)}</p>
    ${(() => {
      const mine = (state.remedies || []).filter((r) => r.parcel === p.parcel)
      return mine.length ? `<h2>How to unblock</h2>${mine.map(remedyHtml).join('')}` : ''
    })()}
    <h2>Receipt chain walk</h2>
    <table><tr><th>seq</th><th>stage</th><th>subject</th><th>timestamp</th><th>hash</th><th>locator</th></tr>${chainRows || '<tr><td colspan="6" class="muted">no chain</td></tr>'}</table>
    ${p.chain && p.chain.sidecars.length ? `<p class="muted">sidecars: ${p.chain.sidecars.map(fileLink).join(' · ')}</p>` : ''}
    <h2>Logs</h2>
    <h3 class="muted">chain documents (members + sidecars)</h3>${logDocs || '<div class="muted">—</div>'}
    <h3 class="muted">invocation audit</h3>
    <table><tr><th>time</th><th>flow</th><th>action</th><th>command</th><th>exit</th></tr>${audit || '<tr><td colspan="5" class="muted">no invocations yet</td></tr>'}</table>
    <h3 class="muted">goal loop-directive state lines</h3>
    <pre>${esc((chainDocs.stateLines || []).join('\n'))}</pre>`
}

async function renderAlerts() {
  const data = await api(`/api/alerts?goal=${encodeURIComponent(state.goal)}`)
  state.remedies = data.remedies || []
  const remedyCards = state.remedies.map(remedyHtml).join('')
  const alertRows = (data.alerts || []).map((a) =>
    `<tr><td>${esc(a.kind)}</td><td>${esc(a.parcel)}</td><td>${esc(a.detail)}</td><td>${esc(a.observedAt)}</td></tr>`).join('')
  const notifRows = (data.notifications || []).map((n) => `
    <tr><td>${esc(n.createdAt)}</td><td>${esc(n.kind)}</td><td>${esc(n.goal)}/${esc(n.parcel)}</td>
    <td>${esc(n.message)}</td>
    <td><button data-del="${esc(n.id)}">delete</button></td></tr>`).join('')
  document.getElementById('alerts-body').innerHTML = `
    ${remedyCards ? `<h3 class="muted">how to unblock — questions &amp; recommendations (ordered preserve-and-complete first)</h3>${remedyCards}` : ''}
    <table><tr><th>kind</th><th>parcel</th><th>detail</th><th>observed</th></tr>${alertRows || '<tr><td colspan="4" class="muted">no alerts</td></tr>'}</table>
    <h3 class="muted">console-local notification store (state/notifications.json)</h3>
    <table><tr><th>created</th><th>kind</th><th>scope</th><th>message</th><th></th></tr>${notifRows || '<tr><td colspan="5" class="muted">empty</td></tr>'}</table>`
  document.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    await api(`/api/notifications/${encodeURIComponent(b.dataset.del)}`, { method: 'DELETE' })
    renderAlerts()
  }))
}

async function renderRouting() {
  const data = await api(`/api/routing?goal=${encodeURIComponent(state.goal)}`)
  const classRows = (data.policy && data.policy.classes || []).map((c) =>
    `<tr><td>${esc(c.name)}</td><td>${esc(c.allowlist.join(', '))}</td><td>${esc(c.ceilingUsd)}</td></tr>`).join('')
  const roleRows = (data.policy && data.policy.roles || []).map((r) =>
    `<tr><td>${esc(r.role)}</td><td>${esc(r.tier)}</td></tr>`).join('')
  const parcelRows = (data.parcels || []).map((p) =>
    `<tr><td>${esc(p.parcel)}</td><td>${esc(p.routing.routingClass)}</td><td>${esc(p.routing.resolvedTier)}</td><td>${esc(p.routing.resolvedModelId)}</td></tr>`).join('')
  document.getElementById('routing-body').innerHTML = `
    <table><tr><th>class</th><th>allowlist (tiers)</th><th>ceiling USD</th></tr>${classRows}</table>
    <table><tr><th>role</th><th>tier</th></tr>${roleRows}</table>
    <table><tr><th>parcel</th><th>routing class</th><th>resolved tier</th><th>resolved model</th></tr>${parcelRows}</table>`
}

async function refresh() {
  document.getElementById('clock').textContent = new Date().toISOString()
  if (!state.goal) return
  state.projection = await api(`/api/parcels?goal=${encodeURIComponent(state.goal)}`)
  if (state.projection && state.projection.goal) state.repoRoot = state.repoRoot || ''
  renderBoard()
  renderAlerts()
  renderRouting()
}

async function init() {
  const health = await api('/api/health')
  state.repoRoot = health.repoRoot || ''
  const goals = await api('/api/goals')
  state.goals = goals.goals || []
  // FCA-2: the picker lists ACTIVE goals only (a fully shipped goal with an
  // empty queue drops out), grouped per goal tree, attention first.
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
  select.innerHTML = [...groups.entries()].map(([label, list]) =>
    `<optgroup label="${esc(label)}">${list.map((s) => {
      const marker = s.attention.total > 0 ? ` ● ${s.attention.total}` : ''
      return `<option value="${esc(s.key)}">${esc(s.key)}${marker}</option>`
    }).join('')}</optgroup>`,
  ).join('') || '<option value="">no active goals</option>'
  state.goal = active.length ? active[0].key : null
  const attnGoals = state.statuses.filter((s) => s.active && s.attention.total > 0).length
  const summary = document.getElementById('attn-summary')
  if (summary) {
    summary.textContent = attnGoals > 0 ? `⚠ ${attnGoals} goal${attnGoals === 1 ? '' : 's'} need attention` : ''
    summary.className = attnGoals > 0 ? 'banner-inline' : 'muted'
  }
  select.addEventListener('change', () => { state.goal = select.value; refresh() })
  document.getElementById('refresh').addEventListener('click', refresh)
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
  await refresh()
  // OQ2: poll on page load + 60s background refresh.
  setInterval(refresh, 60000)
}

init().catch((err) => {
  document.getElementById('detail').innerHTML = `<div class="flags">${esc(err.message)}</div>`
})
