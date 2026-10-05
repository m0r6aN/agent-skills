import { isAbsolute } from 'node:path'

/**
 * Typed error class for the `integration` package (W4-P1), mirroring
 * `DispatchError`'s shape (`dispatch/src/approval-cli/index.ts:42-60`).
 */
export class IntegrationError extends Error {
  readonly code:
    | 'PRIOR_CORRELATION_MISSING'
    | 'RECEIPT_WRITE_FAILED'
    | 'PLAN_INVALID'
    | 'POSTURE_INVALID'
    | 'PUSH_FAILED'
    | 'ROOT_NOT_ABSOLUTE'

  constructor(code: IntegrationError['code'], message: string) {
    super(message)
    this.name = 'IntegrationError'
    this.code = code
  }
}

/**
 * Typed root refusal (P2b-i / D19): every target-repository / installed-plugin
 * root is supplied explicitly and MUST be absolute — a relative root would
 * silently anchor to the process cwd and is refused. Called as the first
 * statement of every exported root-consuming seam, before any fs/subprocess/
 * path use.
 */
export function assertAbsoluteRoot(root: string, name: string): void {
  if (!isAbsolute(root)) {
    throw new IntegrationError(
      'ROOT_NOT_ABSOLUTE',
      `${name} '${root}' is not an absolute path; a relative root would silently anchor to the process cwd and is refused (P2b-i / D19)`,
    )
  }
}
