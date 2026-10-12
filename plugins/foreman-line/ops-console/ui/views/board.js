// Board rendering (moved from app.js; behavior preserved, pure now).
import { needsFor } from '../needs.js'
import { esc, fileLink } from './shell.js'
import { eligibleActions } from './selection.js'

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

export function boardHtml(parcels, status, options = {}) {
  const attention = (status && status.attention) || EMPTY_ATTENTION
  // FCA-2: the board leads with what needs the human — a banner above the
  // columns and a "needs" treatment on the cards that carry the attention.
  const parts = [
    attention.hung ? `${attention.hung} hung` : '',
    attention.failed ? `${attention.failed} failed` : '',
    attention.awaitingGate ? `${attention.awaitingGate} awaiting gate` : '',
    attention.ratificationPending ? 'goal charter awaiting ratification' : '',
    attention.ratificationUnknown ? 'ratification record unknown' : '',
    (attention.signals && attention.signals.urgent) ? `${attention.signals.urgent} urgent signal(s)` : '',
    (attention.signals && attention.signals.attention) ? `${attention.signals.attention} attention signal(s)` : '',
  ].filter(Boolean)
  const banner = attention.total > 0
    ? `<div class="banner">needs attention${parts.length ? ` — ${parts.join(' · ')}` : ''}</div>`
    : ''
  const rows = STATES.flatMap((col) => {
    return parcels.filter((p) => p.state === col).map((p) => {
      const signal = (options.signals || []).find((s) => s.class === 'parcel-state' && s.subject === `${status?.key}/${p.parcel}` && s.repo === status?.repoRoot && eligibleActions(s, options.registry || []).length)
      const select = signal ? `<input type="checkbox" data-select="${esc(signal.id)}" ${options.selected?.has(signal.id) ? 'checked' : ''} aria-label="Select parcel ${esc(p.parcel)} in ${esc(status.repoRoot)}">` : '<span class="meta">No supported action</span>'
      const urgent = ((status && status.urgentSubjects) || []).some((s) => s.endsWith(`/${p.parcel}`))
      const needs = needsFor(p.state, urgent)
      const chip = needs ? `<span class="chip ${needs.includes('red') ? 'chip-red' : 'chip-amber'}">${p.state === 'awaiting-gate' ? 'gate' : 'needs attention'}</span>` : ''
      return `<tr class="parcel-row ${needs}"><td>${select}</td>
      <td><button class="detail-btn" type="button" data-parcel="${esc(p.parcel)}" aria-label="Inspect parcel ${esc(p.parcel)}">${esc(p.parcel)}</button><span class="meta">rule ${esc(p.rule)} · chain ${esc(p.chainEvidence)}</span></td>
      <td><span class="chip chip-${p.state === 'complete' || p.state === 'running' ? 'green' : 'neutral'}">${esc(p.state)}</span> ${chip}</td>
      <td><span class="meta">${esc(p.heartbeat?.lastProgressAt || 'No progress timestamp')}<br>${p.liveness?.live ? 'Live worktree evidence' : 'No live worktree evidence'}</span>${p.failure ? `<div class="flags">${esc(p.failure.code)}</div>` : ''}${p.flags?.length ? `<div class="flags">${esc(p.flags.join(', '))}</div>` : ''}</td>
      <td><button type="button" data-parcel="${esc(p.parcel)}">Inspect evidence</button></td></tr>`
    })
  }).join('')
  return banner + `<div class="list-meta"><span>${options.total ?? parcels.length} parcels</span><div class="row"><button type="button" data-select-visible>Select visible page</button><button type="button" data-clear-visible>Clear visible page</button></div></div><div class="table-wrap"><table><thead><tr><th aria-label="Selection"></th><th>Parcel</th><th>Status</th><th>Progress evidence</th><th>Details</th></tr></thead><tbody>${rows}</tbody></table></div>`
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
    <p class="muted">G1: ratify the spec · G2: authorize dispatch · G3: human merge approval. The console does not grant these gates.</p>
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
