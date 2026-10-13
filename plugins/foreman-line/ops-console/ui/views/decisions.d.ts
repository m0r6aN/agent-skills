/** Type surface for the pure decisions renderer (no build step — the .js ships as-is). */
export declare const DECISION_FILTERS: readonly (readonly [string, string])[]
export declare const DECISIONS_PAGE_SIZE: number
export declare function itemKey(item: Record<string, unknown>): string
export declare function filterItems<T extends Record<string, unknown>>(
  items: readonly T[],
  filter: string,
  query: string,
): T[]
export declare function bannersHtml(data: Record<string, unknown>): string
export declare function countsHtml(data: Record<string, unknown>, active: string): string
export declare function decisionsRowsHtml(items: readonly Record<string, unknown>[], page?: number): string
export declare function decisionsHtml(
  data: Record<string, unknown>,
  options?: { filter?: string; query?: string; page?: number },
): string
