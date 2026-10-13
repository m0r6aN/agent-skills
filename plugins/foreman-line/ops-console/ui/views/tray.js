// Receipt-backed session history. Liveness is not completion and caps are not spend.
import { esc, emptyHtml, paginationHtml } from './shell.js'
export const TRAY_ROW_CAP = 200
export function attachCommand(sessionName) {
  const name = /^[\w-]+$/.test(sessionName) ? sessionName : `'${String(sessionName).replace(/'/g, "'\\''")}'`
  return `tmux attach -t ${name}`
}
export function livenessLabel(value) {
  return value === 'alive' ? 'Running' : value === 'exited' ? 'Not running (exited)' : value === 'dead' ? 'Not running (dead)' : 'Unknown'
}
const LIFECYCLE = {
  launching: ['Starting', 'neutral'],
  running: ['Running', 'green'],
  'exited-clean': ['Exited cleanly — not proof the work is complete', 'neutral'],
  'exited-error': ['Failed — pane exited with an error', 'red'],
  'no-transcript': ['Ended — no transcript', 'red'],
  vanished: ['Vanished — tmux session is gone', 'red'],
  unknown: ['Unknown', 'neutral'],
}
const NOT_EXCHANGED = ['exited-error', 'no-transcript', 'vanished']
const num = (value, format) => (typeof value === 'number' && Number.isFinite(value) ? format(value) : 'Unavailable')
function gitText(git) {
  if (!git || git.worktree === 'unknown') return 'Git: unavailable'
  if (git.worktree === 'missing') return 'Git: worktree removed'
  const pushed = git.pushed === true ? 'pushed (as of last fetch)' : git.pushed === false ? 'not pushed' : 'push state unavailable'
  const ahead = num(git.commitsAhead, (n) => `${n} commit${n === 1 ? '' : 's'} ahead`)
  const changed = num(git.dirtyFiles, (n) => `${n} changed file${n === 1 ? '' : 's'}`)
  return `Git: ${ahead === 'Unavailable' ? 'commits ahead unavailable' : ahead} · ${changed === 'Unavailable' ? 'changed files unavailable' : changed} · ${pushed}`
}
/** Ledger (FCA-P7): observed facts only; every unknown reads as unavailable, never zero. */
export function ledgerHtml(ledger) {
  if (!ledger || typeof ledger !== 'object') return ''
  const [label, tone] = LIFECYCLE[ledger.state] || LIFECYCLE.unknown
  const t = ledger.transcript || {}
  const out = ledger.output || {}
  const exit = ledger.exit || {}
  const notExchanged = NOT_EXCHANGED.includes(ledger.state) && (t.link === 'none' || t.messages === 0)
  const evidence = Array.isArray(ledger.evidence) ? ledger.evidence : []
  const tail = Array.isArray(out.tail) ? out.tail : []
  return `<div class="ledger" data-ledger-state="${esc(ledger.state)}">
    <span class="chip chip-${tone}">${esc(label)}</span>
    ${notExchanged ? '<span class="meta ledger-warning"><strong>No transcript — the prompt was never exchanged.</strong></span>' : ''}
    ${out.providerError ? `<span class="meta ledger-error"><code>${esc(out.providerError)}</code></span>` : ''}
    <span class="meta">Exit status: ${exit.signal != null ? `signal ${esc(exit.signal)}` : num(exit.status, String)} · Messages: ${num(t.messages, String)} · Cost: ${num(t.costUsd, (n) => `$${n.toFixed(2)}`)}</span>
    <span class="meta">${esc(gitText(ledger.git))}</span>
    ${ledger.ledger === 'absent' ? '<span class="meta">Recorded before the session ledger: outcome facts unavailable.</span>' : ''}
    ${ledger.orphanClean ? '<span class="meta">Orphan worktree: no commits, no changes, no live pane.</span>' : ''}
    <details><summary>Evidence and last output</summary>${evidence.length ? `<ul>${evidence.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>` : '<p class="muted">No evidence recorded.</p>'}${tail.length ? `<pre class="ledger-tail">${esc(tail.join('\n'))}</pre>` : '<p class="muted">No captured output.</p>'}${out.truncated ? '<p class="muted">Older output was removed by retention.</p>' : ''}</details>
  </div>`
}
const fact = (value) => value == null || value === '' ? 'Unavailable' : esc(value)
function createdTime(value) {
  const date = typeof value === 'string' ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return fact(value)
  return `<time datetime="${esc(value)}">${date.toISOString().slice(0, 19).replace('T', ' ')} UTC</time>`
}
export function trayHtml(spawns, { page = 0, registry = [], highlight = null, compact = false } = {}) {
  if (!spawns.length) return emptyHtml('No console-recorded launches', 'Select work from Work queue to launch a session. Sessions started elsewhere are not listed here.')
  page = Math.min(Math.max(0, page), Math.ceil(spawns.length / TRAY_ROW_CAP) - 1)
  const sessionNames = new Set(spawns.map((s) => s.sessionName).filter(Boolean))
  const running = spawns.filter((s) => s.liveness === 'alive').length
  const unknown = spawns.filter((s) => !['alive', 'exited', 'dead'].includes(s.liveness)).length
  const rows = spawns.slice(page * TRAY_ROW_CAP, (page + 1) * TRAY_ROW_CAP).map((spawn) => {
    const identified = typeof spawn.sessionName === 'string' && spawn.sessionName.length > 0 && Number.isInteger(spawn.paneIndex) && spawn.paneIndex >= 0
    const subject = identified ? `${spawn.sessionName}-p${spawn.paneIndex}` : null
    const command = identified ? attachCommand(spawn.sessionName) : null
    const actions = identified ? ['explain', 'close-delete'].filter((verb) => registry.some((entry) => entry.verb === verb && entry.signalClasses.includes('session-state'))).map((verb) => `<button type="button" ${verb === 'close-delete' ? 'class="danger"' : ''} data-session-action="${verb}" data-subject="${esc(subject)}" data-repo="${esc(spawn.repoRoot || '')}">${verb === 'close-delete' ? 'Close / delete…' : 'Explain'}</button>`).join('') : ''
    return `<tr class="tray-row" data-session="${esc(spawn.sessionName || '')}" data-subject="${esc(subject || '')}" data-receipt="${esc(spawn.id || '')}" ${highlight === spawn.sessionName ? 'data-highlight' : ''}>
      <td data-label="Session / pane"><span class="subject">${fact(spawn.sessionName)}</span><span class="meta">Pane ${fact(spawn.paneIndex)}</span><span class="meta session-created">${createdTime(spawn.createdAt)}</span>
        <details><summary>Launch receipt</summary><dl class="receipt-facts"><dt>Receipt ID</dt><dd>${fact(spawn.id)}</dd><dt>Repository</dt><dd><code>${fact(spawn.repoRoot)}</code></dd><dt>Worktree</dt><dd><code>${fact(spawn.worktreePath)}</code></dd><dt>Prompt digest</dt><dd><code>${fact(spawn.promptDigest)}</code></dd></dl><pre>${esc(JSON.stringify(spawn, null, 2))}</pre></details></td>
      <td data-label="Liveness"><span class="chip chip-${spawn.liveness === 'alive' ? 'green' : ['dead', 'exited'].includes(spawn.liveness) ? 'red' : 'neutral'}">${livenessLabel(spawn.liveness)}</span>${compact ? '' : ledgerHtml(spawn.ledger)}</td>
      <td data-label="Launch configuration / repository"><strong>${fact(spawn.harness)}</strong> · ${fact(spawn.model)}<span class="meta">Thinking: ${fact(spawn.thinking)}<br>Configured cap: ${fact(spawn.budget)}</span><span class="meta">${fact(spawn.repoRoot)}</span></td>
      <td data-label="Terminal attach">${command ? `<code class="attach">${esc(command)}</code><button type="button" data-copy="${esc(command)}" aria-label="Copy attach command for ${esc(spawn.sessionName)}">Copy attach command</button><span class="meta" data-copy-status aria-live="polite"></span>` : '<span class="muted">Attach unavailable: session or pane identity missing.</span>'}</td>
      <td class="actions" data-label="Actions"><div class="session-actions-group">${actions || '<span class="muted">No registered action</span>'}</div></td></tr>`
  }).join('')
  const summary = compact ? '<p class="muted">Recent pane receipts. Open Sessions for full history.</p>' : `<div class="session-metrics"><div><strong>${sessionNames.size}</strong> <span>recorded session${sessionNames.size === 1 ? '' : 's'}</span></div><div><strong>${spawns.length}</strong> <span>panes</span></div><div><strong>${running}</strong> <span>Running panes</span></div><div><strong>${unknown}</strong> <span>Unknown liveness</span></div></div><p class="muted">Console-recorded launches only. Not running does not mean completed; budget caps are configuration, not measured spending.</p>`
  return `${summary}<div class="table-wrap session-table-wrap"><table class="tray-table"><thead><tr><th scope="col">Session / pane</th><th scope="col">Liveness</th><th scope="col">Launch configuration / repository</th><th scope="col">Terminal attach</th><th scope="col">Actions</th></tr></thead><tbody>${rows}</tbody></table></div>${compact ? '' : paginationHtml(spawns.length, page, TRAY_ROW_CAP)}`
}
