import { esc } from './shell.js'
import { eligibleActions } from './selection.js'

export function allowedVerbs(signal, registry) {
  return (signal.actions || []).filter((verb) => registry.some((entry) => entry.verb === verb && entry.signalClasses.includes(signal.class)))
}
export function signalsHtml(signals, registry, options = {}) {
  const selected = options.selected || new Map()
  const rows = signals.slice(0, 200).map((signal) => {
    const selectable = eligibleActions(signal, registry).length > 0
    const actions = allowedVerbs(signal, registry).map((verb) => {
      const entry = registry.find((e) => e.verb === verb && e.signalClasses.includes(signal.class))
      return `<button type="button" class="action-btn${entry.destructive ? ' danger' : ''}" data-signal-id="${esc(signal.id)}" data-subject="${esc(signal.subject)}" data-class="${esc(signal.class)}" data-verb="${esc(verb)}" ${entry.destructive ? 'data-destructive="true"' : ''}>${verb === 'close-delete' ? 'Close / delete…' : esc(verb[0].toUpperCase() + verb.slice(1))}</button>`
    }).join('')
    return `<tr class="signal-row" data-id="${esc(signal.id)}" data-class="${esc(signal.class)}">
      <td>${selectable ? `<input type="checkbox" data-select="${esc(signal.id)}" ${selected.has(signal.id) ? 'checked' : ''} aria-label="Select ${esc(signal.subject)} in ${esc(signal.repo)}">` : '<span class="muted" title="No supported bulk-launch action">—</span>'}</td>
      <td><span class="subject">${esc(signal.subject)}</span><span class="meta">${esc(signal.class)}</span></td>
      <td><span class="chip chip-${signal.severity === 'urgent' ? 'red' : signal.severity === 'attention' ? 'amber' : 'neutral'}">${esc(signal.severity === 'attention' ? 'needs attention' : signal.severity)}</span></td>
      <td><code>${esc(signal.repo)}</code></td>
      <td><details><summary>${signal.evidence?.length || 0} evidence reference${signal.evidence?.length === 1 ? '' : 's'}</summary><ul>${(signal.evidence || []).map((e) => `<li><code>${esc(e)}</code></li>`).join('')}</ul></details></td>
      <td class="actions">${actions || '<span class="muted">No registered action</span>'}</td></tr>`
  }).join('')
  return `<div class="list-meta"><span>${options.total ?? signals.length} finding${(options.total ?? signals.length) === 1 ? '' : 's'} in this view</span><div class="row"><button type="button" data-select-visible>Select visible page</button><button type="button" data-clear-visible>Clear visible page</button></div></div>
    <div class="table-wrap"><table class="signals-table"><thead><tr><th aria-label="Selection"></th><th>Work item</th><th>Priority</th><th>Repository</th><th>Evidence</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`
}
export function selectionToActions(selections) {
  return selections.map((selection) => ({ verb: selection.verb, signalClass: selection.signal.class,
    subject: selection.signal.subject, evidence: [...selection.signal.evidence], repoRoot: selection.signal.repo,
    autonomy: { ...selection.autonomy }, extraText: selection.extraText ?? null }))
}
export function confirmationToken(subject) { return `confirm delete ${subject}` }
export function autonomyHtml(autonomy, subject = '', disabledMerge = false) {
  return `<fieldset class="autonomy"><legend>Permission envelope${subject ? ` · ${esc(subject)}` : ''}</legend>
    <div class="permissions"><label><input type="radio" name="decisions" value="full" ${autonomy.decisions === 'full' ? 'checked' : ''}>Full decisions</label><label><input type="radio" name="decisions" value="partial" ${autonomy.decisions !== 'full' ? 'checked' : ''}>Partial decisions</label></div>
    <div class="permissions">${['commit', 'push', 'openPr', 'merge'].map((name) => `<label><input type="checkbox" name="${name}" ${autonomy[name] ? 'checked' : ''} ${name === 'merge' && disabledMerge ? 'disabled' : ''}>${name === 'openPr' ? 'Open PR' : name === 'merge' ? 'Merge (human-owned)' : name[0].toUpperCase() + name.slice(1)}</label>`).join('')}</div></fieldset>`
}
export function actionPopoverHtml(signal, verb, entry) {
  const destructive = !!entry.destructive, token = confirmationToken(signal.subject)
  return `<form class="action-popover" data-verb="${esc(verb)}" data-class="${esc(signal.class)}" data-subject="${esc(signal.subject)}" ${destructive ? 'data-destructive="true"' : ''}>
    <h3>${destructive ? 'Close / delete' : esc(verb)} · ${esc(signal.subject)}</h3><p class="muted">Repository: ${esc(signal.repo || 'See session receipt')}<br>Invocation: ${esc(entry.invocation)}. Server guards remain authoritative.</p>
    ${autonomyHtml(entry.autonomy, signal.subject, true)}
    <label class="stack-label">Extra direction (optional)<textarea name="extra" aria-label="extra direction"></textarea></label>
    ${destructive ? `<p class="flags">This can close or delete work. Review the target before continuing.</p><label class="stack-label">Type <code>${esc(token)}</code><input name="confirmation" aria-label="typed confirmation" autocomplete="off"></label>` : ''}
    <div class="flags" data-confirm-error hidden>Confirmation must match exactly.</div><div class="row"><button type="submit" class="${destructive ? 'danger' : 'primary'}">${destructive ? 'Confirm close / delete' : 'Submit action'}</button><button type="button" data-cancel>Cancel</button></div></form>`
}
