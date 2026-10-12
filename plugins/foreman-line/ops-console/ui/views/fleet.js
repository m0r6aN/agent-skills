// FCA-P6 fleet view (Task 18): fleet tiles (identity + liveness) with
// add/remove, and the filesystem folder picker driven by /api/fs/browse —
// one level at a time, keyboard-navigable buttons, qualification hints from
// the FCA-P2 browse contract. Refusal reasons render inline; nothing crashes.
import { esc } from './shell.js'

export function fleetHtml(roots) {
  const tiles = roots.map((entry) => {
    const identity = entry.identity || {}
    const liveness = entry.liveness || 'unknown'
    return `<div class="fleet-tile" data-root="${esc(entry.root)}">
      <div class="key">${esc(entry.root)}</div>
      <div class="meta">
        <span class="chip chip-${liveness === 'ready' ? 'amber' : 'red'}">${esc(liveness)}</span>
        ${esc(identity.remote || 'no remote')} · ${esc(identity.defaultBranch || '?')} @ ${esc((identity.head || '?').slice(0, 8))}
      </div>
      <button type="button" data-remove="${esc(entry.root)}" aria-label="remove ${esc(entry.root)}">remove</button>
    </div>`
  }).join('')
  return `
    <h2>fleet (${roots.length} repo${roots.length === 1 ? '' : 's'})</h2>
    <div class="fleet-grid">${tiles || '<div class="muted">no repos registered</div>'}</div>
    <h2>add a repository (filesystem browse — folders only are selectable)</h2>
    <div class="row">
      <input id="browse-path" aria-label="browse path" placeholder="/absolute/path">
      <button type="button" id="browse-run">browse</button>
      <span class="muted" id="browse-selection">no folder selected</span>
      <button type="button" id="fleet-add" disabled>add selected folder</button>
    </div>
    <div id="fleet-error" class="flags" hidden></div>
    <div id="browse-list"></div>`
}

export function browseListHtml(path, entries) {
  const rows = entries.map((entry) => {
    const full = `${path.replace(/\/+$/, '')}/${entry.name}`
    const selectable = entry.type === 'dir'
    return `<tr>
      <td><code>${esc(entry.name)}</code>${entry.gitWorkTree ? ' <span class="chip chip-amber">git</span>' : ''}</td>
      <td>${esc(entry.type)}</td>
      <td>
        ${selectable ? `<button type="button" data-open="${esc(full)}">open</button>
        <button type="button" data-pick="${esc(full)}">select</button>` : '<span class="muted">not selectable</span>'}
      </td>
    </tr>`
  }).join('')
  return `<table class="browse-table">
    <tr><th>name</th><th>type</th><th></th></tr>
    ${rows || '<tr><td colspan="3" class="muted">empty directory</td></tr>'}
  </table>`
}
