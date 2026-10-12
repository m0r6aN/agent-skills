/** Type surface for the pure board renderer (no build step — the .js ships as-is). */
export declare function gatePill(gate: { gate: string; status: string; detail: string }): string
export declare function boardHtml(parcels: readonly unknown[], status: unknown): string
export declare function detailHtml(
  p: Record<string, unknown>,
  chainDocs: Record<string, unknown>,
  repoRoot: string,
  loopDirectiveRef: string,
  remedies: readonly string[],
): string
