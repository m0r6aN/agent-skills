/** Unbuilt browser controller. An explicit mount supports isolated DOM testing. */
export declare function startConsole(document: Document, fetcher?: (path: string, options?: RequestInit) => Promise<{ ok?: boolean; status?: number; json(): Promise<unknown> }>): {
  ready: Promise<void>
  refresh(): Promise<void>
  destroy(): void
}
