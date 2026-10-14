// Reconciliation (FCA-P8): per parcel, what the LOCAL record says versus local git and
// the REMOTE, with a closed discrepancy vocabulary. Facts carry sources and ages; unknown
// stays unknown; every string from disk, git, or GitHub is escaped.
import { esc } from './shell.js'
import { eligibleActions } from './selection.js'

export const DISCREPANCY_LABELS = {
  'shipped-unrecorded': 'Shipped, record behind',
  'recorded-unshipped': 'Record says closed, no remote trace',
  'unmerged-work': 'Unmerged work exists',
  'orphan-worktree': 'Orphan worktree',
  'never-started': 'No linked trace',
  'local-remote-divergence': 'Local and remote differ',
  'stale-abandoned': 'No delivery or in-flight work linked',
}
export const DISCREPANCY_TONE = {
  'shipped-unrecorded': 'amber', 'recorded-unshipped': 'red', 'unmerged-work': 'amber', 'orphan-worktree': 'neutral',
  'never-started': 'neutral', 'local-remote-divergence': 'amber', 'stale-abandoned': 'red',
}

const when = (value) => {
  const date = typeof value === 'string' ? new Date(value) : null
  return !date || Number.isNaN(date.getTime()) ? 'unknown time' : `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}
const asOf = (value) => (value ? `as of ${when(value)}` : 'age unknown')
const list = (items) => (items.length ? `<ul class="rec-list">${items.map((item) => `<li>${item}</li>`).join('')}</ul>` : '')

const DAY_MS = 86_400_000
export function remoteBannerHtml(data, options = {}) {
  const prs = data.prs || {}
  const repo = data.repo || {}
  const divergence = repo.defaultDivergence
  const parts = [
    `Compared against <code>${esc(repo.defaultRef || 'no default branch found')}</code> (refs ${esc(asOf(repo.refsAsOf))}; checked-out branch <code>${esc(repo.checkedOutBranch || 'detached HEAD')}</code>)`,
    prs.available ? `GitHub PRs ${esc(asOf(prs.asOf))}` : '',
    divergence && (divergence.ahead || divergence.behind) ? `local default branch is ${esc(divergence.ahead)} ahead / ${esc(divergence.behind)} behind its remote` : '',
    data.generatedAt ? `generated ${esc(when(data.generatedAt))}` : '',
  ].filter(Boolean)
  const warn = (html) => `<div class="banner warn" role="status">${html}</div>`
  const stale = options.stale ? warn(`<strong>Showing the last successful reconciliation</strong> (${esc(when(data.generatedAt))}); refreshing failed: ${esc(options.stale)}.`) : ''
  const unavailable = prs.available ? '' : warn(`<strong>GitHub unavailable:</strong> ${esc(prs.reason || 'unknown reason')}. Findings that depend on the remote are withheld rather than guessed; local facts are still shown.`)
  const noRef = repo.defaultRef ? '' : warn('<strong>No default branch found:</strong> remote comparison is not possible for this repository.')
  // Remote refs are only as fresh as the last fetch; the console never fetches for you.
  const generated = Date.parse(data.generatedAt || '')
  const fetched = Date.parse(repo.refsAsOf || '')
  const oldRefs = repo.defaultRef && (Number.isNaN(fetched) || (!Number.isNaN(generated) && generated - fetched > DAY_MS))
    ? warn(`<strong>Remote refs may be stale:</strong> ${repo.refsAsOf ? `last fetch ${esc(when(repo.refsAsOf))}` : 'no fetch is recorded for this repository'}. Fetch before acting on findings that depend on what the remote contains.`)
    : ''
  // Reasons that already have their own banner are not repeated.
  const limits = (data.assessment?.limits || []).filter((limit) => !String(limit).startsWith('GitHub unavailable') && limit !== 'no default branch was found')
  const limited = limits.length ? warn(`<strong>Findings that say something does not exist are withheld</strong> because ${limits.map(esc).join('; ')}.`) : ''
  return `${stale}<div class="banner">${parts.join(' · ')}</div>${unavailable}${noRef}${oldRefs}${limited}`
}

export function countsHtml(data, active) {
  const by = data.counts?.byCode || {}
  const total = data.counts?.parcels ?? 0
  const none = (data.parcels || []).filter((p) => !(p.discrepancies || []).length).length
  const chip = (value, label, count) => `<button type="button" class="chip-filter ${active === value ? 'active' : ''}" data-rec-filter="${esc(value)}" aria-pressed="${active === value}">${esc(label)} <strong>${esc(count)}</strong></button>`
  return `<div class="filters rec-filters" role="group" aria-label="Filter by discrepancy">${chip('', 'All', total)}${Object.keys(DISCREPANCY_LABELS).filter((code) => by[code]).map((code) => chip(code, DISCREPANCY_LABELS[code], by[code])).join('')}${chip('none', 'No discrepancy', none)}</div>`
}

function localHtml(p) {
  const l = p.local || {}
  const lines = [
    `Spec: <strong>${esc(l.specLocation || 'unknown')}</strong>${l.specLocation === 'none' ? '' : '/'}`,
    `Record: closed marker ${l.recordMarksClosed ? 'present' : 'absent'}${l.chainSealed === null || l.chainSealed === undefined ? ' · no receipt chain' : l.chainSealed ? ' · chain sealed' : ' · chain open'}`,
    ...(l.branches || []).map((b) => `Branch <code>${esc(b.ref)}</code> — ${esc(b.detail)}`),
    ...(l.worktrees || []).map((w) => `Worktree <code>${esc(w.ref.split('/').pop())}</code> — ${esc(w.detail)}`),
    ...(l.sessions || []).map((s) => `Session <code>${esc(s.ref)}</code> — ${esc(s.detail)}`),
    ...(l.stateMentions || []).map((line) => `Goal state line: ${esc(line)}`),
  ]
  return list(lines)
}

function remoteHtml(p) {
  const r = p.remote || {}
  const prLine = (pr) => `PR <code>${esc(pr.ref)}</code> — ${esc(pr.detail)}`
  const lines = [
    r.prs?.available ? `PRs ${esc(asOf(r.prs.asOf))}` : `PRs unavailable (${esc(r.prs?.reason || 'unknown')})`,
    ...(r.mergedPrs || []).map(prLine),
    ...(r.otherPrs || []).map(prLine),
    r.specLocation === 'unknown' ? 'Spec on default branch: unknown' : `Spec on default branch: ${esc(r.specLocation)}${r.specLocation === 'none' ? '' : '/'}`,
    (r.commits || []).length ? `${esc(r.commits.length)} commit${r.commits.length === 1 ? '' : 's'} on the default branch name this parcel` : '',
    ...(r.branches || []).map((b) => `Remote branch <code>${esc(b.ref)}</code> — ${esc(b.detail)}`),
  ].filter(Boolean)
  return list(lines)
}

// A finding with only weak traces is a prompt to verify, never a verdict: it is worded and
// coloured as uncertain, because the work may have shipped under another identity.
export const WEAK_LABEL = 'Unclear — weak traces only, verify'
function discrepancyChips(p) {
  const found = p.discrepancies || []
  if (!found.length) return '<span class="muted">None asserted</span>'
  return found.map((d) => {
    const weak = d.confidence === 'weak-traces'
    return `<span class="chip chip-${weak ? 'amber' : DISCREPANCY_TONE[d.code] || 'neutral'}" title="${esc(d.summary)}" ${weak ? 'data-confidence="weak-traces"' : ''}>${esc(weak ? WEAK_LABEL : DISCREPANCY_LABELS[d.code] || d.code)}</span>`
  }).join(' ')
}

function detailsHtml(p, open) {
  const hung = p.hung ? `<h4>Why this is “hung”</h4>${list(p.hung.lines.map(esc))}${p.hung.note ? `<p class="meta"><strong>${esc(p.hung.note)}</strong></p>` : ''}` : ''
  const found = (p.discrepancies || []).map((d) => `<section class="rec-finding"><h4>${esc(DISCREPANCY_LABELS[d.code] || d.code)}${d.confidence === 'weak-traces' ? ' <span class="muted">(weak traces only)</span>' : ''}</h4><p>${esc(d.summary)}</p>
    <p class="meta">Evidence</p>${list(d.evidence.map(esc))}
    <p><strong>${esc(d.question)}</strong></p>
    <ol class="rec-options">${d.options.map((o) => `<li><strong>${esc(o.answer)}</strong><br>${esc(o.recommendation)}${o.act ? `<button type="button" data-prepare-session data-parcel="${esc(p.parcel)}" data-verb="${esc(o.act.verb)}" data-instruction="${esc(o.act.instruction)}">Prepare session</button>` : `<p class="meta">Needs ${d.code === 'shipped-unrecorded' ? 'closure-proposal' : 'hygiene-actions'} (not yet available)</p>`}${o.commands.length ? `<div>${o.commands.map((c) => `<code class="rec-cmd">${esc(c)}</code>`).join('')}</div>` : ''}</li>`).join('')}</ol></section>`).join('')
  const shown = (p.history || []).length
  const truncated = Number.isInteger(p.historyTotal) && p.historyTotal > shown ? `<p class="meta">Showing the newest ${esc(shown)} of ${esc(p.historyTotal)} events.</p>` : ''
  const history = (p.history || []).length
    ? `<h4>History</h4>${truncated}<ol class="rec-history">${p.history.map((e) => `<li><time datetime="${esc(e.at || '')}">${esc(when(e.at))}</time> <span class="chip chip-neutral">${esc(e.source)}</span> ${esc(e.label)}${e.ref ? ` <code>${esc(e.ref)}</code>` : ''}</li>`).join('')}</ol>`
    : '<h4>History</h4><p class="muted">No history events found.</p>'
  const absent = (p.absentSources || []).length ? `<p class="meta">Sources with no events: ${esc(p.absentSources.join(', '))}</p>` : ''
  const ambiguous = (p.ambiguous || []).length ? `<h4>Ambiguous links (not used)</h4><p class="meta">These match more than one parcel key, so they are shown but never used to assert anything.</p>${list(p.ambiguous.map((a) => `${esc(a.kind)} <code>${esc(a.ref)}</code> — ${esc(a.detail)}`))}` : ''
  return `<details class="rec-details" ${open ? 'open' : ''}><summary>Explain and what to do</summary>${hung}${found}${history}${absent}${ambiguous}</details>`
}

export function reconcileRowsHtml(parcels, options = {}) {
  const { signals = [], registry = [], selected = new Map(), status = null, open = new Set() } = options
  const rows = parcels.map((p) => {
    const signal = status ? signals.find((s) => s.class === 'parcel-state' && s.subject === `${status.key}/${p.parcel}` && s.repo === status.repoRoot && eligibleActions(s, registry).length) : null
    const select = signal ? `<input type="checkbox" data-select="${esc(signal.id)}" ${selected.has(signal.id) ? 'checked' : ''} aria-label="Select parcel ${esc(p.parcel)} for an investigation session">` : '<span class="muted" title="No supported action for this parcel">—</span>'
    return `<tr class="rec-row" data-rec-parcel="${esc(p.parcel)}"><td data-label="Select">${select}</td>
      <td data-label="Parcel"><strong>${esc(p.parcel)}</strong><span class="meta"><span class="chip chip-${p.state === 'complete' || p.state === 'running' || p.state === 'not-started' ? 'green' : 'neutral'}">${p.state === 'not-started' ? 'Not started' : esc(p.state || 'unknown')}</span> rule ${esc(p.rule || '—')}</span></td>
      <td data-label="Local">${localHtml(p)}</td><td data-label="Remote">${remoteHtml(p)}</td>
      <td data-label="Discrepancy">${discrepancyChips(p)}${detailsHtml(p, open.has(p.parcel))}</td></tr>`
  }).join('')
  return `<div class="table-wrap"><table class="rec-table"><thead><tr><th scope="col">Select</th><th scope="col">Parcel</th><th scope="col">Local</th><th scope="col">Remote</th><th scope="col">Discrepancy</th></tr></thead><tbody>${rows}</tbody></table></div>`
}

/** Filter + search. `filter`: '' (all), 'none' (no discrepancy), or a discrepancy code. */
export function filterParcels(parcels, filter, query) {
  const needle = String(query || '').toLowerCase()
  return parcels.filter((p) => {
    const found = p.discrepancies || []
    if (filter === 'none' && found.length) return false
    if (filter && filter !== 'none' && !found.some((d) => d.code === filter)) return false
    return !needle || `${p.parcel} ${p.state} ${found.map((d) => d.code).join(' ')}`.toLowerCase().includes(needle)
  })
}
