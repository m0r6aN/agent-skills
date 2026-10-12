/** Type surface for the pure fleet view module (no build step). */
export declare function fleetHtml(roots: readonly Record<string, unknown>[]): string
export declare function browseListHtml(
  path: string,
  entries: readonly { name: string; type: string; gitWorkTree: boolean }[],
): string
