/** Type surface for the pure spawn-panel module (no build step). */
export declare const HARNESS_OPTIONS: readonly string[]
export declare const THINKING_OPTIONS: readonly string[]
export declare const BUDGET_PRESETS: readonly string[]
export declare const MODEL_SUGGESTIONS: readonly string[]
export declare function spawnPanelHtml(options?: {
  count?: number
  controls?: Record<string, string>
  selections?: import('./selection.js').SelectedTarget[]
  registry?: import('./selection.js').RegistryEntry[]
  extra?: string
  error?: string
  page?: number
  retryRequired?: boolean
  retryAcknowledged?: boolean
}): string
export declare function launchItemHtml(item: import('./selection.js').SelectedTarget, registry: import('./selection.js').RegistryEntry[]): string
export declare function readControls(form: {
  querySelector: (sel: string) => { value: string } | null
}): { harness: string; model: string; thinking: string; budget: string }
export declare function spawnRequest(
  selectionPayloads: readonly Record<string, unknown>[],
  controls: Record<string, string>,
  extraText: string | null,
): { controls: Record<string, string>; actions: Array<Record<string, unknown>> }
