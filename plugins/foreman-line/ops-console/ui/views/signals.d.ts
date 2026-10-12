/** Type surface for the pure signals view module (no build step). */
export declare function confirmationToken(subject: string): string
export declare function allowedVerbs(
  signal: { class: string; actions: readonly string[] },
  registry: readonly { verb: string; signalClasses: readonly string[] }[],
): string[]
export declare function signalsHtml(
  signals: readonly Record<string, unknown>[],
  registry: readonly import('./selection.js').RegistryEntry[],
  options?: { selected?: Map<string, import('./selection.js').SelectedTarget>; total?: number },
): string
export declare function autonomyHtml(autonomy: import('../../src/actions.js').AutonomyEnvelope, subject?: string, disabledMerge?: boolean): string
export declare function actionPopoverHtml(
  signal: Record<string, unknown>,
  verb: string,
  entry: Record<string, unknown>,
): string
export declare function selectionToActions(
  selections: readonly Record<string, unknown>[],
): Array<Record<string, unknown>>
