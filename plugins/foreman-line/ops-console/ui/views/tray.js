// FCA-P6 session tray (Task 19): spawn receipts with derived pane liveness,
// copyable attach commands, and per-session actions routed through the SAME
// action registry as signals (explain is non-destructive and dispatches
// immediately; close is destructive and demands the typed confirmation).
// Virtualization: the tray renders a capped window (200 rows) with a summary,
// so 200+ spawns never jank the UI.
import { esc } from './shell.js'

export const TRAY_ROW_CAP = 200

export function attachCommand(sessionName) {
  return `tmux attach -t ${sessionName}`
}

export function trayHtml(spawns) {
  const windowed = spawns.slice(0, TRAY_ROW_CAP)
  const rows = windowed.map((spawn) => {
    const id = `${spawn.sessionName}-p${spawn.paneIndex}`
    return `<tr class="tray-row" data-session="${esc(spawn.sessionName)}" data-subject="${esc(id)}">
      <td><code>${esc(id)}</code></td>
      <td><span class="chip chip-${spawn.liveness === 'alive' ? 'amber' : 'red'}">${esc(spawn.liveness)}</span></td>
      <td>${esc(spawn.harness)} · ${esc(spawn.model)} · ${esc(spawn.budget)}</td>
      <td><code class="attach">${esc(attachCommand(spawn.sessionName))}</code>
        <button type="button" data-copy="${esc(attachCommand(spawn.sessionName))}"
          aria-label="copy attach command for ${esc(spawn.sessionName)}">copy</button></td>
      <td>
        <button type="button" data-session-action="explain" data-subject="${esc(id)}"
          aria-label="explain ${esc(id)}">explain</button>
        <button type="button" data-session-action="close-delete" data-subject="${esc(id)}"
          aria-label="close ${esc(id)}">close</button>
      </td>
    </tr>`
  }).join('')
  const summary = spawns.length > TRAY_ROW_CAP
    ? `<div class="muted">showing ${TRAY_ROW_CAP} of ${spawns.length} sessions (windowed)</div>`
    : ''
  return `${summary}<table class="tray-table">
    <tr><th>pane</th><th>liveness</th><th>spawn controls</th><th>attach</th><th>actions</th></tr>
    ${rows || '<tr><td colspan="5" class="muted">no spawn receipts yet</td></tr>'}
  </table>`
}
