/**
 * R20 fix - a failing assertion must REPORT, not hang.
 *
 * `assert.ok(value)` with no message makes node reconstruct the expression text by re-parsing the
 * whole test file with acorn (`getErrMessage` -> `findColumn` -> `parseCode`). On a 3,966-line file
 * that does not terminate in any useful time, and because node BUFFERS a file's reporter output
 * until the file completes, every result for the file is then lost. That consumed a 110-minute run
 * in this round and hid nine further failures behind the first.
 *
 * `ok` below throws a plain typed Error instead. No source is re-read, so the failure is reported in
 * milliseconds. The message defaults rather than being required because the stack frame already
 * names the file and line, and the runner already names the failing test - together those localize
 * a failure more precisely than the reconstructed expression text ever did. Call sites that carry a
 * useful message keep it.
 *
 * The narrowing signature (`asserts value`) is deliberate: it is what `assert.ok` provided and what
 * several hundred call sites depend on for subsequent property access.
 */
export class TestAssertionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TestAssertionError'
  }
}

export function ok(value: unknown, message?: string): asserts value {
  if (value) return
  throw new TestAssertionError(
    message ?? 'expected a truthy value (see the stack frame below for the exact assertion)',
  )
}
