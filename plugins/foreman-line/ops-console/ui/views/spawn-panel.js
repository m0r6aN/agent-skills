// FCA-P6 spawn panel (Task 17): the SHARED spawn controls — Harness, Model,
// Thinking level, Budget cap — plus the optional extra-direction textbox and
// the Spawn button with its selected-action count. Per the owner-ratified
// contract these controls are defined ONCE and applied to every selected
// action; they are never repeated per action. Budget presets are the owner's
// hard max-USD set ($1-$100) — the Unlimited option is withdrawn.
import { esc, paginationHtml } from './shell.js'
import { selectionToActions } from './signals.js'
import { eligibleActions } from './selection.js'

export function launchItemHtml(item, registry) {
  const choices = eligibleActions(item.signal, registry)
  return `<div class="launch-item" data-launch-item="${esc(item.signal.id)}"><div class="row"><div><strong>${esc(item.signal.subject)}</strong><span class="meta">${esc(item.signal.repo)} · ${esc(item.signal.class)}</span></div><button type="button" data-remove-selection aria-label="Remove ${esc(item.signal.subject)} from selection">Remove</button></div>
    <label class="stack-label">Action<select data-verb aria-label="Action for ${esc(item.signal.subject)}"><option value="">Choose an action</option>${choices.map((e) => `<option value="${esc(e.verb)}" ${e.verb === item.verb ? 'selected' : ''}>${esc(e.verb)}</option>`).join('')}</select></label>
    <div class="permissions"><label>Decisions<select data-permission="decisions" aria-label="Decisions for ${esc(item.signal.subject)}"><option value="partial" ${item.autonomy.decisions === 'partial' ? 'selected' : ''}>Partial</option><option value="full" ${item.autonomy.decisions === 'full' ? 'selected' : ''}>Full</option></select></label>${['commit', 'push', 'openPr', 'merge'].map((name) => `<label><input type="checkbox" data-permission="${name}" ${item.autonomy[name] ? 'checked' : ''} ${name === 'merge' ? 'disabled' : ''}>${name === 'openPr' ? 'Open PR' : name === 'merge' ? 'Merge (human-owned)' : name[0].toUpperCase() + name.slice(1)}</label>`).join('')}</div>
    ${item.bulkIssue ? `<p class="flags" role="status">${esc(item.bulkIssue)}</p>` : ''}
    ${item.unavailable ? `<p class="flags" role="status">${esc(item.unavailable)}</p>` : ''}
    ${item.needsReview ? '<p class="flags">Action defaults changed. Your permissions were preserved. Review them again.</p><button type="button" data-ack-review>I reviewed these permissions</button>' : ''}
  </div>`
}

export const HARNESS_OPTIONS = ['pi', 'claude']
export const THINKING_OPTIONS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']
export const BUDGET_PRESETS = ['$1', '$5', '$10', '$20', '$50', '$100']
export const MODEL_SUGGESTIONS = [
  'claude-sonnet-5-5',
  'claude-opus-5-5',
  'gpt-6-luna',
  'gpt-6.1-sol',
  'deepseek-v4-pro',
]

export function spawnPanelHtml({ count = 0, controls = {}, selections = [], registry = [], extra = '', error = '', page = 0, retryRequired = false, retryAcknowledged = false, suggested = true, bulk = {}, bulkResult = '' } = {}) {
  const blocked = (retryRequired && !retryAcknowledged) || selections.some((item) => !item.verb || item.unavailable || item.needsReview || item.bulkIssue)
  const harness = controls.harness || 'pi'
  const model = controls.model || MODEL_SUGGESTIONS[0]
  const thinking = controls.thinking || 'high'
  const budget = controls.budget || '$20'
  return `
    <form id="spawn-form" aria-label="spawn controls">
      <p class="muted">One tmux session · ${count} pane${count === 1 ? '' : 's'} · one fresh worktree per selected action. Review each target and its permissions.</p>
      <fieldset class="bulk-settings"><legend>Settings for all ${count} selected items</legend>
        <label><input type="checkbox" data-suggested ${suggested ? 'checked' : ''} aria-describedby="suggested-help">Use suggested settings</label>
        <p id="suggested-help" class="meta">On by default for untouched fields: registered Investigate and conservative permission defaults. Manual choices are preserved; suggestions never widen existing permissions. Turning off keeps current settings. Changed defaults still require review.</p>
        <p class="meta">Apply explicitly replaces the corresponding manual choices on every compatible selected item, including other pages and repositories. Unavailable, incompatible or pending-review items are skipped and stay flagged.</p>
        <div class="row"><label class="stack-label">Action for all selected<select data-bulk-verb><option value="">Choose an action</option>${[...new Set(registry.filter((e) => e.invocation === 'spawn' && !e.destructive).map((e) => e.verb))].map((verb) => `<option value="${esc(verb)}" ${bulk.verb === verb ? 'selected' : ''}>${esc(verb)}</option>`).join('')}</select></label><button type="button" data-apply-actions>Apply to all selected — action</button></div>
        <div class="permissions"><label class="stack-label">Decisions for all selected<select data-bulk-permission="decisions"><option value="partial" ${bulk.decisions !== 'full' ? 'selected' : ''}>Partial</option><option value="full" ${bulk.decisions === 'full' ? 'selected' : ''}>Full</option></select></label>${['commit', 'push', 'openPr'].map((name) => `<label><input type="checkbox" data-bulk-permission="${name}" ${bulk[name] ? 'checked' : ''}>${name === 'openPr' ? 'Open PR' : name[0].toUpperCase() + name.slice(1)}</label>`).join('')}<span class="meta">Merge stays human-owned.</span></div>
        <button type="button" data-apply-permissions>Apply to all selected — permissions</button>
        <p id="bulk-result" role="status" aria-live="polite">${esc(bulkResult)}</p>
      </fieldset>
      <div id="launch-items">${selections.slice(page * 200, page * 200 + 200).map((item) => launchItemHtml(item, registry)).join('')}</div>${paginationHtml(selections.length, page)}
      <fieldset>
        <legend>Shared launch configuration</legend><div class="control-grid">
        <label>harness
          <select name="harness" aria-label="harness">
            ${HARNESS_OPTIONS.map((id) => `<option value="${esc(id)}" ${id === harness ? 'selected' : ''}>${esc(id)}</option>`).join('')}
          </select>
        </label>
        <label>model
          <input name="model" list="model-options" value="${esc(model)}" aria-label="model" required>
          <datalist id="model-options">
            ${MODEL_SUGGESTIONS.map((id) => `<option value="${esc(id)}"></option>`).join('')}
          </datalist>
        </label>
        <label>thinking
          <select name="thinking" aria-label="thinking level">
            ${THINKING_OPTIONS.map((level) => `<option value="${esc(level)}" ${level === thinking ? 'selected' : ''}>${esc(level)}</option>`).join('')}
          </select>
        </label>
        <label>budget (hard max-USD cap)
          <select name="budget" aria-label="budget cap">
            ${BUDGET_PRESETS.map((cap) => `<option value="${esc(cap)}" ${cap === budget ? 'selected' : ''}>${esc(cap)}</option>`).join('')}
          </select>
        </label></div>
        <p class="meta">Budget is a configured cap passed to each action—not measured spending. The chosen harness must support the requested controls.</p>
      </fieldset>
      <label class="stack-label">Extra direction (optional — appended verbatim to every prompt)
        <textarea name="extra" rows="3" aria-label="extra direction">${esc(extra)}</textarea>
      </label>
      <div id="spawn-result" class="flags" aria-live="polite">${esc(error)}${retryRequired ? '<p><button type="button" data-inspect-sessions>Inspect all recorded sessions</button></p>' : ''}</div>
      ${retryRequired ? `<label class="permissions"><input type="checkbox" data-ack-retry ${retryAcknowledged ? 'checked' : ''}>I inspected Sessions. Allow one explicit retry; this may duplicate work.</label>` : ''}
      <div class="launch-footer"><span class="muted">${blocked ? 'Resolve unavailable items and review permissions before launch.' : 'Approvals and server guards still apply.'}</span><button type="submit" class="primary" id="spawn-run" ${count === 0 || blocked ? 'disabled' : ''}>Launch 1 session · ${count} pane${count === 1 ? '' : 's'}</button></div>
    </form>`
}

/** Read the shared controls off the panel form (single source of truth). */
export function readControls(form) {
  return {
    harness: form.querySelector('[name="harness"]').value,
    model: form.querySelector('[name="model"]').value,
    thinking: form.querySelector('[name="thinking"]').value,
    budget: form.querySelector('[name="budget"]').value,
  }
}

/**
 * Compose the spawn request: shared controls + shared extra direction applied
 * verbatim to every selected action. The shape feeds planSpawn exactly
 * (FCA-P5): { controls, actions: [{..., extraText}] }.
 */
export function spawnRequest(selectionPayloads, controls, extraText) {
  const actions = selectionToActions(selectionPayloads).map((action) => ({
    ...action,
    extraText: extraText == null || extraText === '' ? action.extraText : extraText,
  }))
  return { controls: { ...controls }, actions }
}
