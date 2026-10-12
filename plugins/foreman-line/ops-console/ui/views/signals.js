// FCA-P6 signals view (Task 16): pure renderers for signal rows, registered
// verb buttons, the per-action autonomy popover, and the destructive typed
// confirmation contract. The button matrix is the INTERSECTION of what a
// signal offers and what the action registry allows — unregistered
// (class x verb) pairs are absent, never disabled.
import { esc } from './shell.js'

/**
 * Mirror of guards.ts `destructiveConfirmationToken` (FCA-P4 shared
 * contract, "mirrored by the UI later" — this is that mirror). The server
 * re-verifies independently; this copy only gates the request locally.
 */
export function confirmationToken(subject) {
  return `confirm delete ${subject}`
}

export function allowedVerbs(signal, registry) {
  const verbs = []
  for (const entry of registry) {
    if (entry.signalClasses.includes(signal.class) && signal.actions.includes(entry.verb)) {
      verbs.push(entry.verb)
    }
  }
  return verbs
}

function registryEntry(registry, signalClass, verb) {
  return registry.find((entry) => entry.verb === verb && entry.signalClasses.includes(signalClass)) || null
}

export function signalsHtml(signals, registry) {
  const rows = signals.map((signal) => {
    const verbs = allowedVerbs(signal, registry)
    const buttons = verbs.map((verb) => {
      const entry = registryEntry(registry, signal.class, verb)
      const destructive = entry != null && entry.destructive
      return `<button type="button" class="action-btn" data-verb="${esc(verb)}"
        data-class="${esc(signal.class)}" data-subject="${esc(signal.subject)}"
        ${destructive ? 'data-destructive="true"' : ''}
        aria-label="${esc(verb)} ${esc(signal.subject)}">${esc(verb)}</button>`
    }).join(' ')
    return `<tr class="signal-row" data-signal-id="${esc(signal.id)}" data-severity="${esc(signal.severity)}"
      data-class="${esc(signal.class)}" data-subject="${esc(signal.subject)}">
      <td><input type="checkbox" data-select="${esc(signal.id)}" aria-label="select ${esc(signal.subject)}"></td>
      <td><span class="chip chip-${esc(signal.severity === 'info' ? 'amber' : signal.severity === 'attention' ? 'amber' : 'red')}">${esc(signal.severity)}</span></td>
      <td>${esc(signal.class)}</td>
      <td>${esc(signal.subject)}</td>
      <td><details><summary>evidence (${signal.evidence.length})</summary>
        <ul>${signal.evidence.map((item) => `<li><code>${esc(item)}</code></li>`).join('')}</ul>
      </details></td>
      <td class="actions">${buttons || '<span class="muted">no actions</span>'}</td>
    </tr>`
  }).join('')
  return `
    <div id="action-popover"></div>
    <pre id="action-result" aria-live="polite"></pre>
    <table class="signals-table">
      <tr><th></th><th>severity</th><th>class</th><th>subject</th><th>evidence</th><th>actions</th></tr>
      ${rows || '<tr><td colspan="6" class="muted">no signals</td></tr>'}
    </table>`
}

export function actionPopoverHtml(signal, verb, entry) {
  const envelope = entry.autonomy
  const destructive = entry.destructive
  const token = confirmationToken(signal.subject)
  return `
    <form class="action-popover" data-verb="${esc(verb)}" data-class="${esc(signal.class)}"
      data-subject="${esc(signal.subject)}" ${destructive ? 'data-destructive="true"' : ''}>
      <h3>${esc(verb)} — ${esc(signal.subject)}</h3>
      <fieldset>
        <legend>autonomy envelope (per action)</legend>
        <label><input type="radio" name="decisions" value="partial" ${envelope.decisions === 'partial' ? 'checked' : ''}> decisions: partial</label>
        <label><input type="radio" name="decisions" value="full" ${envelope.decisions === 'full' ? 'checked' : ''}> decisions: full</label>
        <label><input type="checkbox" name="commit" ${envelope.commit ? 'checked' : ''}> commit</label>
        <label><input type="checkbox" name="push" ${envelope.push ? 'checked' : ''}> push</label>
        <label><input type="checkbox" name="openPr" ${envelope.openPr ? 'checked' : ''}> open PR</label>
        <label><input type="checkbox" name="merge" ${envelope.merge ? 'checked' : ''}> merge (Stage-F fail-closed still applies)</label>
      </fieldset>
      <label>extra direction (optional)
        <textarea name="extra" rows="2" aria-label="extra direction"></textarea>
      </label>
      ${destructive ? `
        <label>destructive: type <code>${esc(token)}</code> to confirm
          <input name="confirmation" autocomplete="off" aria-label="typed confirmation">
        </label>
        <p class="flags" data-confirm-error hidden>confirmation does not match — no request was sent</p>` : ''}
      <div class="row">
        <button type="submit">run ${esc(verb)}</button>
        <button type="button" data-cancel>cancel</button>
      </div>
    </form>`
}

/**
 * Selection -> request payload: N checked rows carry N actions, each with its
 * own autonomy envelope (owner contract: shared spawn controls, per-action
 * autonomy).
 */
export function selectionToActions(selections) {
  return selections.map((selection) => ({
    verb: selection.verb,
    signalClass: selection.signal.class,
    subject: selection.signal.subject,
    evidence: [...selection.signal.evidence],
    repoRoot: selection.signal.repo,
    autonomy: { ...selection.autonomy },
    extraText: selection.extraText == null ? null : selection.extraText,
  }))
}
