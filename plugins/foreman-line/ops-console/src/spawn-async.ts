import { spawn } from 'node:child_process'

/**
 * FCA-P14: Async exec wrapper. Replaces blocking `execFileSync` calls with
 * non-blocking `spawn` + Promise. Honours existing timeout, maxBuffer, and
 * encoding conventions. Error shapes match `execFileSync` (ENOENT, timeout
 * SIGKILL).
 *
 * Callers pass their existing constants (GIT_TIMEOUT_MS, GH_TIMEOUT_MS,
 * OUTPUT_CAP); nothing is module-level.
 */

export interface ExecAsyncResult {
  readonly stdout: string
  readonly stderr: string
  readonly exitCode: number | null
}

export interface ExecAsyncOptions {
  readonly cwd?: string
  readonly timeout?: number
  readonly maxBuffer?: number
  readonly env?: NodeJS.ProcessEnv
}

/** Error thrown when exec times out (like execFileSync with timeout). */
export class ExecTimeoutError extends Error {
  readonly signal = 'SIGKILL' as const
  readonly killed = true as const
  constructor(bin: string, timeout: number) {
    super(`Command timed out after ${timeout}ms: ${bin}`)
    this.name = 'ExecTimeoutError'
  }
}

/** Error thrown when exec fails to spawn (like ENOENT from execFileSync). */
export class ExecSpawnError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'ExecSpawnError'
    this.code = code
  }
}

/**
 * Async replacement for `execFileSync(bin, args, opts)`.
 * Returns `{ stdout, stderr, exitCode }` on completion.
 * Throws `ExecSpawnError` for ENOENT, `ExecTimeoutError` on timeout.
 */
export function execFileAsync(
  bin: string,
  args: readonly string[],
  options: ExecAsyncOptions = {},
): Promise<ExecAsyncResult> {
  return new Promise((resolve, reject) => {
    const { cwd, timeout, maxBuffer = 1024 * 1024, env } = options

    const child = spawn(bin, [...args], {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let stdoutOverflow = false
    let stderrOverflow = false
    let timedOut = false
    let timer: ReturnType<typeof setTimeout> | undefined

    if (timeout !== undefined && timeout > 0) {
      timer = setTimeout(() => {
        timedOut = true
        child.kill('SIGKILL')
      }, timeout)
    }

    child.stdout.on('data', (chunk: Buffer) => {
      if (stdoutOverflow) return
      stdout += chunk.toString('utf8')
      if (stdout.length > maxBuffer) {
        stdoutOverflow = true
        stdout = stdout.slice(0, maxBuffer)
      }
    })

    child.stderr.on('data', (chunk: Buffer) => {
      if (stderrOverflow) return
      stderr += chunk.toString('utf8')
      if (stderr.length > maxBuffer) {
        stderrOverflow = true
        stderr = stderr.slice(0, maxBuffer)
      }
    })

    child.on('error', (error: NodeJS.ErrnoException) => {
      if (timer !== undefined) clearTimeout(timer)
      reject(new ExecSpawnError(error.code ?? 'UNKNOWN', error.message))
    })

    child.on('close', (code: number | null, _signal: NodeJS.Signals | null) => {
      if (timer !== undefined) clearTimeout(timer)
      if (timedOut && timeout !== undefined) {
        reject(new ExecTimeoutError(bin, timeout))
        return
      }
      resolve({ stdout, stderr, exitCode: code })
    })
  })
}

/**
 * Run helper matching the sync `run()` pattern in signals-scm.ts but async.
 * Returns trimmed stdout; throws on spawn error or non-zero exit.
 */
export async function runAsync(
  bin: string,
  args: readonly string[],
  cwd: string | undefined,
  timeout?: number,
): Promise<string> {
  const result = await execFileAsync(bin, args, { cwd, timeout })
  if (result.exitCode !== 0) {
    const error = new Error(`${bin} exited with code ${result.exitCode}`)
    ;(error as { exitCode?: number }).exitCode = result.exitCode ?? undefined
    throw error
  }
  return result.stdout.replace(/\s+$/, '')
}

/**
 * Git runner matching defaultGitRunner signature but async.
 * Returns null on any error (degrade to unknown), trimmed stdout on success.
 */
export async function gitRunnerAsync(
  cwd: string,
  args: readonly string[],
  timeout: number,
  maxBuffer: number,
  env?: NodeJS.ProcessEnv,
): Promise<string | null> {
  try {
    const result = await execFileAsync('git', ['-C', cwd, '-c', 'core.fsmonitor=false', ...args], {
      cwd,
      timeout,
      maxBuffer,
      env: { ...process.env, ...env, GIT_OPTIONAL_LOCKS: '0' },
    })
    if (result.exitCode !== 0) return null
    return result.stdout.replace(/\s+$/, '')
  } catch {
    return null
  }
}

/**
 * GH runner matching GhRunner signature but async.
 * Returns stdout on success; throws on error (preserving error shape).
 */
export async function ghRunnerAsync(
  cwd: string,
  args: readonly string[],
  timeout: number,
  maxBuffer: number,
): Promise<string> {
  const result = await execFileAsync('gh', [...args], { cwd, timeout, maxBuffer })
  if (result.exitCode !== 0) {
    const error = new Error(result.stderr || `gh exited with code ${result.exitCode}`)
    ;(error as { exitCode?: number }).exitCode = result.exitCode ?? undefined
    ;(error as { stderr?: string }).stderr = result.stderr
    throw error
  }
  return result.stdout
}

/**
 * tmux runner matching tmuxRunnerFor signature but async.
 * Returns stdout on success; throws on error.
 */
export async function tmuxRunnerAsync(
  cwd: string,
  args: readonly string[],
  timeout = 5000,
): Promise<string> {
  const result = await execFileAsync('tmux', args, { cwd, timeout })
  if (result.exitCode !== 0) {
    const error = new Error(result.stderr || `tmux exited with code ${result.exitCode}`)
    ;(error as { exitCode?: number }).exitCode = result.exitCode ?? undefined
    ;(error as { stderr?: string }).stderr = result.stderr
    throw error
  }
  return result.stdout
}
