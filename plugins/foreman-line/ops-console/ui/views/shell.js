// Task-oriented shell. All capabilities remain reachable; technical tools are secondary.
export const VIEWS = [
  ['signals', 'Work queue'], ['decisions', 'Decisions'], ['board', 'Goals & parcels'],
  ['sessions', 'Sessions'], ['fleet', 'Repositories'],
  ['reconcile', 'Reconciliation'], ['remedies', 'Alerts & guidance'], ['audit', 'Flow tools'], ['settings', 'Routing policy'],
]
export const SEVERITIES = ['urgent', 'attention', 'info']
export const VIEW_COPY = {
  signals: 'Find what needs attention. Select work, choose an action, and launch a session.',
  decisions: 'Merges, ratifications and dispatches waiting for you, with the facts the console can see. The console presents; you decide and run any command yourself.',
  board: 'Follow a goal’s progress. Inspect evidence or select supported parcel actions.',
  reconcile: 'Compare what the record says with local git and the remote, per parcel. Explains why a parcel is hung and what to do. Read-only.',
  sessions: 'Console-recorded launches and their terminal panes—not every agent on this machine.',
  fleet: 'Manage the repositories this console monitors. Removing a registration does not delete a repository.',
  remedies: 'Alerts and suggested steps to unblock the selected goal.',
  audit: 'Invoke registered flows. Human approvals are presented for a real terminal, never auto-approved.',
  settings: 'Read-only routing policy and resolved parcel models. These are not editable settings.',
}
export function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c])
}
export function fileLink(repoRoot, ref) {
  if (!ref) return '—'
  if (!repoRoot) return `<code>${esc(ref)}</code> (repository root unavailable)`
  const path = repoRoot.replace(/\\/g, '/')
  const absolute = /^[A-Za-z]:\//.test(path) ? `/${path}` : path
  const scheme = absolute.startsWith('//') ? 'file:' : 'file://'
  return `<a href="${scheme}${esc(absolute)}/${esc(ref)}" title="Path on disk; browser access may be restricted">${esc(ref)}</a>`
}
export function emptyHtml(title, message) {
  return `<div class="empty-state" role="status"><strong>${esc(title)}</strong><p>${esc(message)}</p></div>`
}
export function paginationHtml(total, page = 0, size = 200) {
  if (total <= size) return ''
  const pages = Math.ceil(total / size)
  return `<div class="pagination" aria-label="Pagination"><span>${page * size + 1}–${Math.min((page + 1) * size, total)} of ${total}</span>
    <button type="button" data-page="prev" ${page === 0 ? 'disabled' : ''}>Previous</button>
    <span>Page ${page + 1} of ${pages}</span><button type="button" data-page="next" ${page + 1 >= pages ? 'disabled' : ''}>Next</button></div>`
}
export function navHtml(active) {
  return `<nav class="rail" aria-label="Workspace"><div class="nav-caption">Workspace</div>
    ${VIEWS.map(([id, label]) => `${id === 'reconcile' ? '<div class="nav-caption tools-caption">Tools</div>' : ''}
      <button type="button" class="nav-btn${id === active ? ' active' : ''}" data-view="${id}" ${['reconcile', 'remedies', 'audit', 'settings'].includes(id) ? '' : 'data-primary'}
        aria-current="${id === active ? 'page' : 'false'}" title="${esc(VIEW_COPY[id])}">${esc(label)}${id === 'decisions' ? ' <span class="nav-badge" data-nav-badge="decisions"></span>' : ''}</button>`).join('')}
    <div class="rail-note"><span class="live-dot"></span> Local workspace<br><span>Approvals stay with you.</span></div></nav>`
}
export function shellHtml({ posture = '', activeView = 'signals' } = {}) {
  return `<a class="skip-link" href="#main">Skip to content</a>
  <header class="app-header"><div class="brand"><span class="brand-mark" aria-hidden="true">F<span>↗</span></span><div><strong>Foreman Line</strong><span>Operations workspace</span></div></div>
    <label class="scope-label">Repository scope<select id="fleet-select" aria-label="Repository scope"><option value="">All repositories</option></select></label>
    <span class="local-badge" title="${esc(posture)}"><span class="live-dot"></span> Local only</span>
    <button type="button" id="workflow-help" aria-haspopup="dialog" aria-controls="help-dialog">Help</button>
    <button type="button" id="refresh">Refresh</button></header>
  ${navHtml(activeView)}
  <main id="main" tabindex="-1">
    <div class="page-heading"><div><div class="eyebrow">Your workspace / <span id="view-crumb">Work queue</span></div><h1 id="view-title">Work queue</h1><p id="view-description">${esc(VIEW_COPY[activeView])}</p></div><span id="clock" class="muted"></span></div>
    <div id="console-status" class="status-line" role="status" aria-live="polite">Loading workspace…</div>
    <div class="view-toolbar"><label class="search-field"><span>Search this view</span><input id="global-search" type="search" aria-label="Search this view" placeholder="Search work items…"></label>
      <div id="severity-filters" class="filters" aria-label="Priority filters">${SEVERITIES.map((s) => `<label><input type="checkbox" data-sev="${s}" checked>${s === 'attention' ? 'Needs attention' : s === 'info' ? 'Informational' : 'Urgent'}</label>`).join('')}</div>
    </div>
    ${VIEWS.map(([id]) => `<section data-view="${id}" ${id === activeView ? '' : 'hidden'}>
      ${id === 'signals' ? '<div id="signals-body"></div>' : ''}
      ${id === 'board' ? '<div class="row goal-toolbar"><label>Goal <select id="goal-select" aria-label="Goal"></select></label><label>Show goals<select id="goal-status" aria-label="Goal status"><option value="active">Active</option><option value="all">All</option><option value="inactive">Inactive</option></select></label><label>Parcel status<select id="parcel-status" aria-label="Parcel status"><option value="">All statuses</option><option>running</option><option>hung</option><option>awaiting-gate</option><option>failed</option><option>complete</option></select></label><span id="attn-summary" class="muted"></span></div><div id="board" class="board"></div><section id="detail" hidden aria-live="polite"></section>' : ''}
      ${id === 'reconcile' ? '<div class="row goal-toolbar"><label>Goal <select id="reconcile-goal-select" aria-label="Goal"></select></label></div><div id="reconcile-body"></div>' : ''}
      ${id === 'decisions' ? '<div id="decisions-body"></div>' : ''}
      ${id === 'sessions' ? '<div id="sessions-body"></div>' : ''}
      ${id === 'fleet' ? '<div id="fleet-body"></div>' : ''}
      ${id === 'remedies' ? '<div id="alerts-body"></div>' : ''}
      ${id === 'settings' ? '<div id="routing-body"></div>' : ''}
      ${id === 'audit' ? `<form id="flow-form" class="tool-panel"><h2>Registered flow</h2><div class="row"><label>Flow<select id="flow-select" aria-label="Flow">${['approval-show', 'approval-approve', 'approval-reject', 'dispatch-execute', 'receipts-validate'].map((f) => `<option value="${f}">${f}${['approval-approve', 'approval-reject', 'dispatch-execute'].includes(f) ? ' (presented)' : ''}</option>`).join('')}</select></label>${[1, 2, 3, 4].map((n) => `<label>Argument ${n}<input id="flow-arg${n}" aria-label="Flow argument ${n}" placeholder="Optional argument"></label>`).join('')}<button id="flow-run" type="submit">Run flow</button></div><pre id="flow-result" aria-live="polite">No flow invoked.</pre></form>` : ''}
    </section>`).join('')}
    <div id="action-result" class="status-line" aria-live="polite"></div>
    <div id="launch-outcome" aria-live="polite"></div>
    <div id="selection-bar" class="selection-bar" hidden><span id="selection-summary"></span><div class="row"><button type="button" id="clear-selection">Clear selection</button><button type="button" class="primary" id="review-launch">Review launch <span aria-hidden="true">→</span></button></div></div>
    <footer class="session-summary"><button id="tray-toggle" type="button" aria-expanded="false" aria-controls="tray-body">Recorded sessions <span id="tray-count"></span></button><button type="button" data-go-sessions>View sessions →</button><div id="tray-body" hidden></div></footer>
  </main>
  <dialog id="launch-dialog" class="launch-dialog" aria-labelledby="launch-title"><div class="dialog-heading"><div><div class="eyebrow">Session launch</div><h2 id="launch-title">Review selected work</h2></div><div class="row"><button type="button" data-launch-help aria-haspopup="dialog" aria-controls="help-dialog">Help</button><button type="button" data-close-dialog aria-label="Close launch review">✕</button></div></div><div id="spawn-panel"></div></dialog>
  <dialog id="action-dialog" aria-labelledby="action-title"><div class="dialog-heading"><h2 id="action-title">Review action</h2><button type="button" data-close-action aria-label="Close action review">✕</button></div><div id="action-popover"></div></dialog>
  <dialog id="help-dialog" class="help-dialog" aria-labelledby="help-title"><div class="dialog-heading"><h2 id="help-title">How launching work works</h2><button type="button" data-close-help aria-label="Close workflow help">✕</button></div>
    <p>Find work → select targets → review actions and permissions → launch → inspect Sessions. Opening review or changing settings does not launch anything.</p>
    <dl class="help-topics">
      <dt>Work queue vs Goals &amp; parcels</dt><dd>Work queue shows authoritative findings across registered repositories. Goals &amp; parcels shows a selected goal’s projected progress, gates and evidence. Only parcels with a matching registered finding can be selected for launch.</dd>
      <dt>Full vs Partial decisions</dt><dd>Full requests agent judgment within the task’s boundaries; Partial requests more human involvement in decisions. These values are prompt guidance passed verbatim, not a backend-enforced decision sandbox or approval bypass. Use extra direction to specify which decisions need you. Independent verification and human gates still apply.</dd>
      <dt>Separate Git permissions</dt><dd>Decisions does not grant Git authority. Commit, Push and Open PR are separate Git permissions sent in each action’s prompt. They do not imply one another. Merge is disabled here and stays human-owned; no Full setting or suggestion grants merge authority.</dd>
      <dt>Suggested vs manual settings</dt><dd>Suggestions use registered conservative defaults for untouched fields and preserve manual choices. Explicit Apply replaces the corresponding settings across all compatible selected items, not just this page; skipped items stay flagged. Review every permission before launch.</dd>
      <dt>One session, N panes</dt><dd>N selected actions launch one tmux session with N panes and one fresh worktree per action, using the shared configuration and extra direction. Sessions lists console-recorded launches, not every agent on this machine. A pane that is not running is not proof of completed work. Budget is configuration, not measured spending or a console-enforced spend limit.</dd>
    </dl>
  </dialog>`
}
