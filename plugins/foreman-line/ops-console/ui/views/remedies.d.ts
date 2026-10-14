/** Type surface for the pure FCA-3 remedy renderer (no build step). */
export declare function remedyHtml(r: Record<string, unknown>): string
export declare function remediesHtml(
  alerts: unknown,
  remedies: readonly Record<string, unknown>[],
  notifications: unknown,
  onDelete?: unknown,
): string
