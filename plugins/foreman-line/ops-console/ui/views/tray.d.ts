/** Type surface for the pure session-tray module (no build step). */
export declare const TRAY_ROW_CAP: number
export declare function attachCommand(sessionName: string): string
export declare function trayHtml(spawns: readonly Record<string, unknown>[]): string
