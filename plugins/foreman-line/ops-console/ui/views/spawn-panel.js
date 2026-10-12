// FCA-P6 spawn panel (Task 17): the SHARED spawn controls — Harness, Model,
// Thinking level, Budget cap — plus the optional extra-direction textbox and
// the Spawn button with its selected-action count. Per the owner-ratified
// contract these controls are defined ONCE and applied to every selected
// action; they are never repeated per action. Budget presets are the owner's
// hard max-USD set ($1-$100) — the Unlimited option is withdrawn.
import { esc } from './shell.js'
import { selectionToActions } from './signals.js'

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

export function spawnPanelHtml({ count = 0, controls = {} } = {}) {
  const harness = controls.harness || 'pi'
  const model = controls.model || MODEL_SUGGESTIONS[0]
  const thinking = controls.thinking || 'high'
  const budget = controls.budget || '$20'
  return `
    <form id="spawn-form" aria-label="spawn controls">
      <fieldset>
        <legend>spawn controls (shared — applied to every selected action)</legend>
        <label>harness
          <select name="harness" aria-label="harness">
            ${HARNESS_OPTIONS.map((id) => `<option value="${esc(id)}" ${id === harness ? 'selected' : ''}>${esc(id)}</option>`).join('')}
          </select>
        </label>
        <label>model
          <input name="model" list="model-options" value="${esc(model)}" aria-label="model">
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
        </label>
      </fieldset>
      <label>extra direction (optional — appended verbatim to every prompt)
        <textarea name="extra" rows="3" aria-label="extra direction"></textarea>
      </label>
      <button type="submit" id="spawn-run" ${count === 0 ? 'disabled' : ''}>
        spawn ${count} session${count === 1 ? '' : 's'}
      </button>
    </form>
    <div id="spawn-result" aria-live="polite"></div>`
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
