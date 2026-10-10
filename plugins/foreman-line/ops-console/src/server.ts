import { readFileSync } from 'node:fs'
import {
  createServer,
  type IncomingMessage,
  type RequestListener,
  type Server,
  type ServerResponse,
} from 'node:http'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleApi } from './api.js'
import {
  assertAbsoluteRoot,
  type ConsoleConfig,
  ConsoleRootUnresolvedError,
  defaultConfig,
  packageRoot,
} from './config.js'

/**
 * FOC-P2 server (charter D6): binds `127.0.0.1` at port 8081 by default and
 * refuses any non-loopback bind unless `FOC_CONTAINER=1` (container-internal
 * `0.0.0.0`, published only as `-p 127.0.0.1:8081:8080`). No auth, same
 * posture as the Automations hub. Never exposed beyond loopback — non-loopback
 * publication is a charter stop condition, not a configuration option.
 */
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])

export interface BindTarget {
  readonly host: string
  readonly port: number
}

export interface BindEnv {
  readonly FOC_HOST?: string | undefined
  readonly PORT?: string | undefined
  readonly FOC_CONTAINER?: string | undefined
}

export function resolveBind(env: BindEnv): BindTarget {
  const host = env.FOC_HOST ?? '127.0.0.1'
  const port = env.PORT === undefined || env.PORT === '' ? 8081 : Number(env.PORT)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer in 1..65535, got ${JSON.stringify(env.PORT)}`)
  }
  if (!LOOPBACK_HOSTS.has(host) && env.FOC_CONTAINER !== '1') {
    throw new Error(
      `refusing non-loopback bind ${host}: the console is localhost-only (D6); ` +
        'non-loopback binding is container-internal and requires FOC_CONTAINER=1',
    )
  }
  return { host, port }
}

function readBody(request: IncomingMessage): Promise<unknown> {
  const { promise, resolve } = Promise.withResolvers<unknown>()
  const chunks: Buffer[] = []
  request.on('data', (chunk: Buffer) => chunks.push(chunk))
  request.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8')
    if (raw.length === 0) {
      resolve({})
      return
    }
    try {
      resolve(JSON.parse(raw))
    } catch {
      resolve(null)
    }
  })
  request.on('error', () => resolve(null))
  return promise
}

function sendJson(response: ServerResponse, status: number, json: unknown): void {
  const payload = JSON.stringify(json, null, 2)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  response.end(payload)
}

function sendUi(response: ServerResponse, file: string, contentType: string): void {
  try {
    const body = readFileSync(join(packageRoot(), 'ui', file), 'utf8')
    response.writeHead(200, { 'content-type': contentType, 'cache-control': 'no-store' })
    response.end(body)
  } catch (err) {
    sendJson(response, 500, { error: (err as Error).message })
  }
}

export function buildHandler(config: ConsoleConfig, now: () => number): RequestListener {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    const url = new URL(request.url ?? '/', 'http://localhost')
    const { pathname } = url
    const method = request.method ?? 'GET'
    if (pathname === '/' || pathname === '/index.html') {
      sendUi(response, 'index.html', 'text/html; charset=utf-8')
      return
    }
    if (pathname === '/app.js') {
      sendUi(response, 'app.js', 'text/javascript; charset=utf-8')
      return
    }
    const body = method === 'POST' ? await readBody(request) : undefined
    const result = handleApi(
      config,
      { method, pathname, query: url.searchParams, body: body ?? {} },
      now(),
    )
    sendJson(response, result.status, result.json)
  }
}

export function createConsoleServer(config: ConsoleConfig): Server {
  return createServer(buildHandler(config, () => Date.now()))
}

/**
 * Required explicit repo root (D1 / P2b-i): `FOC_REPO_ROOT` is an
 * absolute-or-refused input. The console never derives the repo root from the
 * process working directory or its own module location — absent
 * (`root-absent`) and relative (`root-not-absolute`) values are refused typed
 * before any configuration or socket exists.
 */
export function resolveRepoRoot(env: { readonly FOC_REPO_ROOT?: string | undefined }): string {
  const root = env.FOC_REPO_ROOT
  if (root === undefined || root === '') {
    throw new ConsoleRootUnresolvedError(
      'root-absent',
      'FOC_REPO_ROOT is required and must be absolute: the console never derives the repo root from the working directory or module location (D1); set FOC_REPO_ROOT to the repo root',
    )
  }
  assertAbsoluteRoot(root, 'FOC_REPO_ROOT')
  return root
}

// R4 self-identification (invokedDirectly): the entry path compared against
// `import.meta.url` BARE — zero path derivation, zero normalization.
const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  const bind = resolveBind({
    FOC_HOST: process.env.FOC_HOST,
    PORT: process.env.PORT,
    FOC_CONTAINER: process.env.FOC_CONTAINER,
  })
  let config: ConsoleConfig
  try {
    // FCA-1: optional additional roots (`FOC_EXTRA_ROOTS`, colon-separated
    // absolute paths) project their own goal trees (e.g. agent-task's
    // docs/goals). Each entry is asserted absolute exactly like the primary.
    const extraRoots = (process.env.FOC_EXTRA_ROOTS ?? '')
      .split(':')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
    config = defaultConfig(resolveRepoRoot(process.env), process.env.FOC_STATE_DIR, extraRoots)
  } catch (err) {
    if (!(err instanceof ConsoleRootUnresolvedError)) throw err
    process.stderr.write(`error: [${err.reason}] ${err.message}\n`)
    process.exit(err.code)
  }
  const server = createConsoleServer(config)
  server.listen(bind.port, bind.host, () => {
    process.stdout.write(`foreman ops console listening on http://${bind.host}:${bind.port}/\n`)
    process.stdout.write(`repo root: ${config.repoRoot}\n`)
    for (const tree of config.trees ?? []) {
      process.stdout.write(`goal tree: ${tree.key ?? '(primary)'} → ${tree.goalsDir}\n`)
    }
  })
}
