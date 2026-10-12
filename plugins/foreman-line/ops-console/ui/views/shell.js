// FCA-P6 control-center shell (Task 15): pure HTML renderers for the
// full-viewport layout — header (fleet switcher, search, posture), left rail
// (view nav + severity filters), dense main grid, persistent spawn panel
// (right rail), collapsible session tray (footer). No build step, no
// dependencies; app.js owns data + events and renders these strings.
//
// Every legacy id from the pre-control-center UI is preserved here so no
// existing capability is dropped (owner: "useful functionality should not be
// omitted for the sake of simplicity").

export const VIEWS = [
  ['board', 'Board'],
  ['signals', 'Signals'],
  ['fleet', 'Fleet'],
  ['sessions', 'Sessions'],
  ['remedies', 'Remedies'],
  ['audit', 'Audit'],
  ['settings', 'Settings'],
]

export const SEVERITIES = ['urgent', 'attention', 'info']

export function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c])
}

export function fileLink(repoRoot, ref) {
  if (!ref) return '—'
  return `<a href="file:///${esc(repoRoot)}/${esc(ref)}" title="open on disk">${esc(ref)}</a>`
}

export function navHtml(active) {
  return `<nav class="rail" aria-label="views">
    ${VIEWS.map(([id, label]) => `
      <button type="button" class="nav-btn${id === active ? ' active' : ''}" data-view="${id}"
        aria-current="${id === active ? 'page' : 'false'}">${esc(label)}</button>`).join('')}
    <h2 class="rail-title">severity</h2>
    ${SEVERITIES.map((sev) => `
      <label class="filter"><input type="checkbox" data-sev="${sev}" checked> ${esc(sev)}</label>`).join('')}
  </nav>`
}

export function shellHtml({ posture = '', activeView = 'board' } = {}) {
  return `
  <header>
    <h1>Foreman Ops Console</h1>
    <label class="fleet-switch">fleet
      <select id="fleet-select" aria-label="fleet repository">
        <option value="">loading…</option>
      </select>
    </label>
    <input id="global-search" type="search" aria-label="global search" placeholder="search signals, parcels, goals">
    <span class="posture">${esc(posture)}</span>
    <span id="clock" class="muted" aria-label="console clock"></span>
  </header>
  ${navHtml(activeView)}
  <main id="main" tabindex="-1">
    <section data-view="board" ${activeView === 'board' ? '' : 'hidden'}>
      <div class="row">
        <label>goal <select id="goal-select" aria-label="goal"></select></label>
        <button type="button" id="refresh">refresh</button>
        <span id="attn-summary" class="muted"></span>
      </div>
      <div id="board" class="board"></div>
      <section id="detail" aria-live="polite"></section>
    </section>
    <section data-view="signals" ${activeView === 'signals' ? '' : 'hidden'}>
      <div id="signals-body"></div>
    </section>
    <section data-view="fleet" ${activeView === 'fleet' ? '' : 'hidden'}>
      <div id="fleet-body"></div>
    </section>
    <section data-view="sessions" ${activeView === 'sessions' ? '' : 'hidden'}>
      <div id="sessions-body"></div>
    </section>
    <section data-view="remedies" ${activeView === 'remedies' ? '' : 'hidden'}>
      <div id="alerts-body"></div>
    </section>
    <section data-view="audit" ${activeView === 'audit' ? '' : 'hidden'}>
      <h2>invoke a frozen flow (presented or executed per the flow registry)</h2>
      <div class="row">
        <select id="flow-select" aria-label="flow">
          <option value="approval-show">approval-show</option>
          <option value="approval-approve">approval-approve (presented)</option>
          <option value="approval-reject">approval-reject (presented)</option>
          <option value="dispatch-execute">dispatch-execute (presented)</option>
          <option value="receipts-validate">receipts-validate</option>
        </select>
        <input id="flow-arg1" aria-label="flow argument 1" placeholder="arg 1">
        <input id="flow-arg2" aria-label="flow argument 2" placeholder="arg 2">
        <input id="flow-arg3" aria-label="flow argument 3" placeholder="arg 3">
        <input id="flow-arg4" aria-label="flow argument 4" placeholder="arg 4">
        <button type="button" id="flow-run">run</button>
      </div>
      <pre id="flow-result" aria-live="polite"></pre>
    </section>
    <section data-view="settings" ${activeView === 'settings' ? '' : 'hidden'}>
      <div id="routing-body"></div>
    </section>
  </main>
  <aside class="spawn" aria-label="spawn panel">
    <h2>spawn</h2>
    <div id="spawn-panel"><p class="muted">select actions to configure a spawn (Task 17)</p></div>
  </aside>
  <footer class="tray" id="tray">
    <button type="button" id="tray-toggle" aria-expanded="false" aria-controls="tray-body">
      sessions <span id="tray-count" class="muted"></span>
    </button>
    <div id="tray-body" hidden></div>
  </footer>`
}
