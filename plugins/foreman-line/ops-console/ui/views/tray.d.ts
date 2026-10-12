/** Receipt-only presentation; unknown fields remain explicitly unavailable. */
export declare const TRAY_ROW_CAP: number
export declare function attachCommand(sessionName: string): string
export declare function livenessLabel(value: unknown): string
export declare function trayHtml(spawns: readonly Record<string, unknown>[], options?: {
  page?: number
  registry?: readonly { verb: string; signalClasses: readonly string[] }[]
  highlight?: string | null
  compact?: boolean
}): string
