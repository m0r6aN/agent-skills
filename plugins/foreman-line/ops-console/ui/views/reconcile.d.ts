/** Type surface for the pure reconciliation renderer (no build step — the .js ships as-is). */
export declare const DISCREPANCY_LABELS: Record<string, string>
export declare const DISCREPANCY_TONE: Record<string, string>
export declare function remoteBannerHtml(data: Record<string, unknown>): string
export declare function countsHtml(data: Record<string, unknown>, active: string): string
export declare function reconcileRowsHtml(
  parcels: readonly Record<string, unknown>[],
  options?: {
    signals?: readonly import('./selection.js').TargetSignal[]
    registry?: readonly import('./selection.js').RegistryEntry[]
    selected?: Map<string, import('./selection.js').SelectedTarget>
    status?: { key: string; repoRoot: string } | null
    open?: ReadonlySet<string>
  },
): string
export declare function filterParcels<T extends Record<string, unknown>>(
  parcels: readonly T[],
  filter: string,
  query: string,
): T[]

export declare const WEAK_LABEL: string
