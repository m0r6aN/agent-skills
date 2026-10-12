// Board rendering (moved from app.js; behavior preserved, pure now).
import { needsFor } from '../needs.js'
import { esc, fileLink } from './shell.js'

const STATES = ['running', 'hung', 'awaiting-gate', 'failed', 'complete']

export function gatePill(gate) {
  return `<span class="pill ${esc(gate.status)}">${esc(gate.gate)} ${esc(gate.status)}</span> ${esc(gate.detail)}`
}

const EMPTY_ATTENTION = {
  hung: 0,
  failed: 0,
  awaitingGate: 0,
  ratificationPending: 0,
  signals: { info: 0, attention: 0, urgent: 0 },
  total: 0,
}

export function boardHtml(parcels, status) {
  const attention = (status && status.attention) || EMPTY_ATTENTION
  // FCA-2: the board leads with what needs the human — a banner above the
  // columns and a "needs" treatment on the cards that carry the attention.
  const banner = attention.total > 0
    ? `<div class="banner">needs attention — ${[
        attention.hung ? `${attention.hung} hung` : '',
        attention.failed ? `${attention.failed} failed` : '',
        attention.awaitingGate ? `${attention.awaitingGate} awaiting gate` : '',
        attention.ratificationPending ? 'goal charter awaiting ratification' : '',
        (attention.signals && attention.signals.urgent) ? `${attention.signals.urgent} urgent signal(s)` : '',
        (attention.signals && attention.signals.attention) ? `${attention.signals.attention} attention signal(s)` : '',
      ].filter(Boolean).join(' · ')}</div>`
    : ''
  return banner + STATES.map((col) => {
    const cards = parcels.filter((p) => p.state === col).map((p) => {
      const urgent = ((status && status.urgentSubjects) || []).some((s) => s.endsWith(`/${p.parcel}`))
      const needs = needsFor(p.state, urgent)
      const chip = needs ? `<span class="chip ${needs.includes('red') ? 'chip-red' : 'chip-amber'}">${p.state === 'awaiting-gate' ? 'gate' : 'needs attention'}</span>` : ''
      return `
      <div class="card ${needs}" data-parcel="${esc(p.parcel)}" tabindex="0" role="button"
        aria-label="parcel ${esc(p.parcel)}, ${esc(p.state)}">
        <div class="key">${esc(p.parcel)} ${chip}</div>
        <div class="meta">rule ${esc(p.rule)} · chain ${esc(p.chainEvidence)}</div>
        <div class="meta">progress ${esc(p.heartbeat.lastProgressAt || 'never')} · liveness ${p.liveness.live ? 'live' : 'none'}</div>
        ${p.failure ? `<div class="flags">${esc(p.failure.code)}</div>` : ''}
        ${p.flags.length ? `<div class="flags">${esc(p.flags.join(', '))}</div>` : ''}
      </div>`
    }).join('')
    return `<div class="col ${col}"><h2>${esc(col)} (${parcels.filter((p) => p.state === col).length})</h2>${cards || '<div class="muted">—</div>'}</div>`
  }).join('')
}

export function detailHtml(p, chainDocs, repoRoot, loopDirectiveRef, remedies) {
  const chainRows = (p.chain ? p.chain.members : []).map((m) => `
    <tr><td>${esc(m.sequence)}</td><td>${esc(m.stage)}</td><td>${esc(m.subjectKind)}</td>
    <td>${esc(m.timestamp)}</td><td><code>${esc(m.hash.slice(0, 16))}…</code></td><td>${fileLink(repoRoot, m.locator)}</td></tr>`).join('')
  const logDocs = (chainDocs.chainDocuments || []).map((d) =>
    `<pre>${esc(d.locator)}\n${esc(JSON.stringify(d.json != null ? d.json : d, null, 2))}</pre>`).join('')
  const audit = (chainDocs.invocationAudit || []).map((e) =>
    `<tr><td>${esc(e.timestamp)}</td><td>${esc(e.flow)}</td><td>${esc(e.action)}</td><td><code>${esc(e.command)}</code></td><td>${esc(e.exitCode == null ? '' : e.exitCode)}</td></tr>`).join('')
  return `
    <h2>${esc(p.parcel)} — ${esc(p.state)} <span class="muted">(rule ${esc(p.rule)})</span></h2>
    <div class="row">
      <span>spec: ${fileLink(repoRoot, p.specRef)} <span class="muted">[${esc(p.specLocation)}]</span></span>
      <span>chain: ${p.chain ? fileLink(repoRoot, p.chain.locator) : 'absent'} ${p.chain && !p.chain.valid ? '<span class="flags">INVALID</span>' : ''}</span>
      <span>goal record: ${fileLink(repoRoot, loopDirectiveRef)}</span>
    </div>
    <p>${gatePill(p.gates.G1)} · ${gatePill(p.gates.G2)} · ${gatePill(p.gates.G3)}</p>
    ${remedies.length ? `<h2>How to unblock</h2>${remedies.map((r) => r).join('')}` : ''}
    <h2>Receipt chain walk</h2>
    <table><tr><th>seq</th><th>stage</th><th>subject</th><th>timestamp</th><th>hash</th><th>locator</th></tr>${chainRows || '<tr><td colspan="6" class="muted">no chain</td></tr>'}</table>
    ${p.chain && p.chain.sidecars.length ? `<p class="muted">sidecars: ${p.chain.sidecars.map((s) => fileLink(repoRoot, s)).join(' · ')}</p>` : ''}
    <h2>Logs</h2>
    <h3 class="muted">chain documents (members + sidecars)</h3>${logDocs || '<div class="muted">—</div>'}
    <h3 class="muted">invocation audit</h3>
    <table><tr><th>time</th><th>flow</th><th>action</th><th>command</th><th>exit</th></tr>${audit || '<tr><td colspan="5" class="muted">no invocations yet</td></tr>'}</table>
    <h3 class="muted">goal loop-directive state lines</h3>
    <pre>${esc((chainDocs.stateLines || []).join('\n'))}</pre>`
}
