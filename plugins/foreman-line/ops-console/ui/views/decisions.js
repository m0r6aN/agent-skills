// Decisions (FCA-P9): every human gate act that is waiting, with its evidence. The view
// PRESENTS facts; it never performs, confirms or recommends a gate act, and it never says an
// item is "ready". Every string from GitHub, disk or git is escaped; unknown stays unknown.
import { esc, emptyHtml, paginationHtml } from './shell.js'

export const DECISION_FILTERS = [['', 'All'], ['merge', 'Merge (Gate 3)'], ['G1', 'Ratify (Gate 1)'], ['G2', 'Dispatch (Gate 2)'], ['goal-ratification', 'Goal ratification']]
export const DECISIONS_PAGE_SIZE = 200

const when = (value) => {
  const date = typeof value === 'string' ? new Date(value) : null
  return !date || Number.isNaN(date.getTime()) ? 'unknown time' : `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}
const asOf = (value) => (value ? `as of ${when(value)}` : 'age unknown')
const warn = (html) => `<div class="banner warn" role="status">${html}</div>`
const SAFE_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+$/
const link = (url, text) => (SAFE_URL.test(url || '') ? `<a href="${esc(url)}" rel="noreferrer noopener">${esc(text)}</a>` : esc(text))

/** The kind key an item filters under: merge, G1, G2 or goal-ratification. */
export const itemKey = (item) => (item.kind === 'gate' ? item.gate : item.kind)

export function filterItems(items, filter, query) {
  const needle = String(query || '').trim().toLowerCase()
  return items.filter((item) => {
    if (filter && itemKey(item) !== filter) return false
    if (!needle) return true
    const text = item.kind === 'merge' ? `#${item.number} ${item.title} ${item.headRef} ${item.baseRef} ${item.repoRoot}`
      : item.kind === 'gate' ? `${item.goal} ${item.parcel} ${item.gate} ${item.repoRoot} ${item.evidence}`
        : `${item.goal} ${item.repoRoot} ${item.detail}`
    return text.toLowerCase().includes(needle)
  })
}

export function bannersHtml(data) {
  const out = []
  for (const repo of data.repos || []) {
    const name = `<code>${esc(repo.repoRoot)}</code>`
    if (!repo.remote?.available) out.push(warn(`<strong>GitHub unavailable for ${name}:</strong> ${esc(repo.remote?.reason || 'unknown reason')}. Pull requests are not listed; local gate items are still shown.`))
    else if (repo.remote.stale) out.push(warn(`<strong>Pull requests for ${name} are earlier facts</strong> (${esc(asOf(repo.remote.asOf))}); the refresh failed: ${esc(repo.remote.reason || 'unknown reason')}.`))
    if (repo.remote?.truncated) out.push(warn(`<strong>${name}: the open pull-request list reached its limit.</strong> Further pull requests are not shown.`))
    if (repo.actions?.state === 'not-starting') {
      out.push(warn(`<strong>GitHub Actions is not starting jobs in ${name}</strong> (${esc(asOf(repo.actions.asOf))}). GitHub's check-run annotation says: ${(repo.actions.evidence || []).map((line) => `<q>${esc(line)}</q>`).join(' ')} Checks that failed this way did not run; a red check here is not a test result.`))
    }
  }
  return out.join('')
}

export function countsHtml(data, active) {
  const counts = data.counts || {}
  const total = (counts.merge || 0) + (counts.G1 || 0) + (counts.G2 || 0) + (counts.goalRatification || 0)
  const n = { '': total, merge: counts.merge || 0, G1: counts.G1 || 0, G2: counts.G2 || 0, 'goal-ratification': counts.goalRatification || 0 }
  return `<div class="filters rec-filters" role="group" aria-label="Filter decisions">${DECISION_FILTERS.map(([value, label]) => `<button type="button" class="chip-filter ${active === value ? 'active' : ''}" data-dec-filter="${esc(value)}" aria-pressed="${active === value}">${esc(label)} <strong>${esc(n[value])}</strong></button>`).join('')}</div>`
}

function checksText(checks) {
  const state = checks?.state
  if (state === 'none') return 'No checks reported'
  if (state === 'unknown') return `Check state unknown (${esc(checks.unrecognised)} unrecognised)`
  return `${esc(checks.passed)} passed · ${esc(checks.failed)} failed · ${esc(checks.pending)} pending`
}

function causeText(item) {
  const cause = item.cause || {}
  if (cause.code === 'billing-blocked') return `<span class="chip chip-amber">Not started: account billing</span><span class="meta">GitHub annotation (${esc(asOf(cause.asOf))}): <q>${esc(cause.annotation || '')}</q></span>`
  if (cause.code === 'failed-unknown') return `<span class="chip chip-red">Failed, cause unknown</span>${cause.note ? `<span class="meta">${esc(cause.note)}</span>` : ''}`
  return ''
}

function mergeRow(item, ctx) {
  const stacked = item.stack?.baseIsDefault === false
  const stack = item.stack?.baseIsDefault === null ? '<span class="meta">Default branch unknown: stack not assessed.</span>'
    : stacked ? `<span class="meta">Stacked on <code>${esc(item.baseRef)}</code>${item.stack.waitsOn ? `: waits on #${esc(item.stack.waitsOn)}; after it merges this PR must be retargeted to the default branch.` : ': that branch has no open pull request.'}</span>` : ''
  return `<tr class="dec-row" data-decision="${esc(item.id)}" data-kind="merge">
    <td data-label="Item"><strong>${link(item.url, `#${item.number}`)}</strong> ${esc(item.title)}${item.isDraft ? ' <span class="chip chip-neutral">Draft</span>' : ''}<span class="meta"><code>${esc(item.headRef)}</code> → <code>${esc(item.baseRef)}</code></span>${stack}<span class="meta">${esc(item.repoRoot)}</span></td>
    <td data-label="Facts"><dl class="receipt-facts"><dt>Mergeable</dt><dd>${esc(item.mergeable)}</dd><dt>Merge state</dt><dd>${esc(item.mergeStateStatus)}</dd><dt>Review decision</dt><dd>${esc(item.reviewDecision || 'none required / none given')}</dd><dt>Reviews</dt><dd>${esc(item.reviews?.approved)} approved · ${esc(item.reviews?.changesRequested)} changes requested · ${esc(item.reviews?.commented)} commented</dd><dt>Checks</dt><dd>${checksText(item.checks)}</dd></dl>${causeText(item)}</td>
    <td data-label="Gate 3 (merge)"><span class="chip chip-neutral">Your decision</span><span class="meta">${esc(asOf(item.asOf))}</span>${commandHtml(item, ctx.shown, ctx.approvals)}</td></tr>`
}

function gateRow(item, ctx) {
  return `<tr class="dec-row" data-decision="${esc(item.id)}" data-kind="gate">
    <td data-label="Item"><strong>${esc(item.parcel)}</strong> <span class="chip chip-neutral">${esc(item.gate === 'G1' ? 'Gate 1: ratify' : 'Gate 2: dispatch')}</span><span class="meta">Goal ${esc(item.goal)} · rule ${esc(item.rule)}${item.tipStage ? ` · chain tip ${esc(item.tipStage)}` : ''}</span><span class="meta">${esc(item.repoRoot)}</span></td>
    <td data-label="Facts">${esc(item.evidence)}<span class="meta">Spec: ${item.specRef ? `<code>${esc(item.specRef)}</code>` : 'none'}${item.chainLocator ? ` · chain <code>${esc(item.chainLocator)}</code>` : ''}</span></td>
    <td data-label="Gate"><span class="chip chip-neutral">Your decision</span><span class="meta">${esc(asOf(item.asOf))}</span>${commandHtml(item, ctx.shown, ctx.approvals)}</td></tr>`
}

function goalRow(item) {
  return `<tr class="dec-row" data-decision="${esc(item.id)}" data-kind="goal-ratification">
    <td data-label="Item"><strong>${esc(item.goal)}</strong> <span class="chip chip-neutral">Goal ratification: ${esc(item.status)}</span><span class="meta">${esc(item.repoRoot)}</span></td>
    <td data-label="Facts">${esc(item.detail)}<span class="meta">${esc(item.note)}</span></td>
    <td data-label="Gate"><span class="chip chip-neutral">State only</span><span class="meta">${esc(asOf(item.asOf))}</span></td></tr>`
}

// Commands are presented text only (copy, never run). A command stays hidden until the human
// presses "Show command": that press is one /api/invoke presentation, audited `presented`, and the
// revealed text is the server's own rendering from that outcome (`shown` maps `<id>|<slot>` to it).
const COPY_NOTE = 'Run this in a terminal. The console will not run it.'
function oneCommandHtml(item, slot, command, label, shown) {
  const key = `${item.id}|${slot}`
  const text = shown && typeof shown.get === 'function' ? shown.get(key) : null
  const reveal = typeof text === 'string'
    ? `<div class="dec-command"><code class="attach">${esc(text)}</code><button type="button" data-copy="${esc(text)}" aria-label="Copy ${esc(label.toLowerCase())} for ${esc(item.id)}">Copy command</button><span class="meta" data-copy-status aria-live="polite"></span><span class="meta">${COPY_NOTE}</span></div>`
    : ''
  return `<div class="dec-command-slot"><button type="button" data-show-command="${esc(key)}" data-flow="${esc(command.flow)}" data-argv="${esc(JSON.stringify(command.argv))}" aria-expanded="${typeof text === 'string'}">${esc(label)}</button><span class="meta" data-show-status role="status"></span>${reveal}</div>`
}
function commandHtml(item, shown, approvals) {
  const parts = []
  if (item.command) parts.push(oneCommandHtml(item, 'main', item.command, item.kind === 'gate' ? (item.gate === 'G1' ? 'Show approve command' : 'Show dispatch command') : 'Show command', shown))
  if (item.altCommand) parts.push(oneCommandHtml(item, 'alt', item.altCommand, 'Show reject command', shown))
  if (!item.command && item.commandNote) parts.push(`<span class="meta">${esc(item.commandNote)}</span>`)
  if (item.approvalShow && item.slug) {
    const argv = ['show', item.slug, '--repo-root', item.repoRoot]
    const out = approvals && typeof approvals.get === 'function' ? approvals.get(item.id) : null
    parts.push(`<div class="dec-command-slot"><button type="button" data-approval-show="${esc(item.id)}" data-argv="${esc(JSON.stringify(argv))}">Show approval details</button><span class="meta" data-show-status role="status"></span>${typeof out === 'string' ? `<pre class="attach">${esc(out)}</pre>` : ''}</div>`)
  }
  return parts.join('')
}

export function decisionsRowsHtml(items, page = 0, ctx = {}) {
  const rows = items.slice(page * DECISIONS_PAGE_SIZE, (page + 1) * DECISIONS_PAGE_SIZE).map((item) => (item.kind === 'merge' ? mergeRow(item, ctx) : item.kind === 'gate' ? gateRow(item, ctx) : goalRow(item))).join('')
  return `<div class="table-wrap"><table class="dec-table"><thead><tr><th scope="col">Item</th><th scope="col">Facts the console can see</th><th scope="col">Decision</th></tr></thead><tbody>${rows}</tbody></table></div>${paginationHtml(items.length, page, DECISIONS_PAGE_SIZE)}`
}

export function decisionsHtml(data, { filter = '', query = '', page = 0, shown = null, approvals = null } = {}) {
  const items = filterItems(data.items || [], filter, query)
  const body = items.length ? `<div class="list-meta"><span>${items.length} of ${(data.items || []).length} decisions</span></div>${decisionsRowsHtml(items, page, { shown, approvals })}` : emptyHtml((data.items || []).length ? 'No matching decisions' : 'Nothing is waiting for you', (data.items || []).length ? 'Change the filter or search.' : 'No open pull requests or pending gates were found in the repositories this console can read.')
  return `${bannersHtml(data)}${countsHtml(data, filter)}${body}`
}
