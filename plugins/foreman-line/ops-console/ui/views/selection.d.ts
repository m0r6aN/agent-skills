import type { AutonomyEnvelope } from '../../src/actions.js'
export interface RegistryEntry {
  verb: string
  invocation: string
  destructive: boolean
  signalClasses: readonly string[]
  promptTemplate?: string
  autonomy: AutonomyEnvelope
}
export interface TargetSignal {
  id: string
  repo: string
  class: string
  subject: string
  actions: readonly string[]
  evidence: readonly string[]
}
export interface SelectedTarget {
  signal: TargetSignal
  verb: string | null
  autonomy: AutonomyEnvelope
  signature: string
  unavailable: string | null
  needsReview: boolean
  manualAction: boolean
  manualPermissions: boolean
  bulkIssue: string | null
}
export declare function eligibleActions(signal: Pick<TargetSignal, 'actions' | 'class'>, registry: readonly RegistryEntry[]): RegistryEntry[]
export declare function actionSignature(entry: RegistryEntry | undefined): string
export declare function selectTarget(signal: TargetSignal, registry: readonly RegistryEntry[]): SelectedTarget
export declare function chooseAction(item: SelectedTarget, entry: RegistryEntry | undefined, suggested?: boolean): void
export declare function applyToSelection(selected: Map<string, SelectedTarget>, registry: readonly RegistryEntry[], settings: { verb?: string; autonomy?: AutonomyEnvelope }, suggested?: boolean): { updated: number; skipped: number }
export declare function useSuggestedSettings(selected: Map<string, SelectedTarget>, registry: readonly RegistryEntry[]): { updated: number; skipped: number }
export declare function reconcileSelection(selected: Map<string, SelectedTarget>, signals: readonly TargetSignal[], registry: readonly RegistryEntry[]): void
