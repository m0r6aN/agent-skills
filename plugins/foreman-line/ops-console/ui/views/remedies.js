// FCA-3 remediation advisor rendering (moved from app.js unchanged in
// behavior): triage question + answer-branch recommendations. Presentation
// only — every command is copy-pasteable and the console never executes it.
import { esc } from './shell.js'

export function remedyHtml(r) {
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

export function remediesHtml(alerts, remedies, notifications, onDelete) {
  const remedyCards = remedies.map(remedyHtml).join('')
  const alertRows = (alerts || []).map((a) =>
    `<tr><td>${esc(a.kind)}</td><td>${esc(a.parcel)}</td><td>${esc(a.detail)}</td><td>${esc(a.observedAt)}</td></tr>`).join('')
  const notifRows = (notifications || []).map((n) => `
    <tr><td>${esc(n.createdAt)}</td><td>${esc(n.kind)}</td><td>${esc(n.goal)}/${esc(n.parcel)}</td>
    <td>${esc(n.message)}</td>
    <td><button type="button" data-del="${esc(n.id)}">delete</button></td></tr>`).join('')
  return `
    ${remedyCards ? `<h3 class="muted">how to unblock — questions &amp; recommendations (ordered preserve-and-complete first)</h3>${remedyCards}` : ''}
    <table><tr><th>kind</th><th>parcel</th><th>detail</th><th>observed</th></tr>${alertRows || '<tr><td colspan="4" class="muted">no alerts</td></tr>'}</table>
    <h3 class="muted">console-local notification store (state/notifications.json)</h3>
    <table><tr><th>created</th><th>kind</th><th>scope</th><th>message</th><th></th></tr>${notifRows || '<tr><td colspan="5" class="muted">empty</td></tr>'}</table>`
}
