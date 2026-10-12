/** Type surface for the pure browser shell module (no build step — the .js ships as-is). */
export declare const VIEWS: readonly (readonly [string, string])[]
export declare const SEVERITIES: readonly string[]
export declare function esc(value: unknown): string
export declare function fileLink(repoRoot: string, ref: string | null | undefined): string
export declare function navHtml(active: string): string
export declare function shellHtml(options?: { posture?: string; activeView?: string }): string
