import { type ChildProcess, execFileSync, spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * Minimal Chrome DevTools Protocol driver (no dependencies): launches a real
 * headless Chromium and exposes evaluate/navigate/screenshot. Used by browser
 * tests that must exercise real click delegation, layout and timing that jsdom
 * cannot. Tests skip when no Chromium binary is present.
 */
export function chromiumBinary(): string | null {
  for (const name of ['chromium', 'chromium-browser', 'google-chrome']) {
    try {
      execFileSync(name, ['--version'], { stdio: 'ignore' })
      return name
    } catch {
      // try the next candidate
    }
  }
  return null
}

/** A CDP message; protocol payloads are untyped JSON by nature. */
interface CdpMessage {
  id?: number
  method?: string
  params?: {
    type?: string
    args?: { value?: string; description?: string }[]
    exceptionDetails?: { text: string; exception?: { description?: string } }
  }
  result?: {
    data?: string
    result?: { value?: unknown }
    exceptionDetails?: { text: string }
  }
}

export interface Browser {
  readonly logs: string[]
  navigate(url: string): Promise<void>
  evaluate<T = unknown>(expression: string): Promise<T>
  waitFor(expression: string, ms?: number): Promise<void>
  resize(width: number, height: number): Promise<void>
  screenshot(): Promise<Buffer>
  close(): void
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function launchBrowser(binary: string): Promise<Browser> {
  const port = 9400 + Math.floor(Math.random() * 400)
  const profile = mkdtempSync(join(tmpdir(), 'cdp-'))
  const chrome: ChildProcess = spawn(
    binary,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--window-size=1366,900',
      'about:blank',
    ],
    { stdio: 'ignore' },
  )
  let target: { webSocketDebuggerUrl: string } | undefined
  for (let attempt = 0; attempt < 100 && target === undefined; attempt++) {
    try {
      const list = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as {
        type: string
        webSocketDebuggerUrl: string
      }[]
      target = list.find((entry) => entry.type === 'page')
    } catch {
      await sleep(100)
    }
  }
  if (target === undefined) {
    chrome.kill('SIGKILL')
    throw new Error('chromium did not expose a DevTools page')
  }
  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise<void>((resolve) => {
    socket.onopen = () => resolve()
  })
  let nextId = 0
  const pending = new Map<number, (message: CdpMessage) => void>()
  const logs: string[] = []
  socket.onmessage = (event) => {
    const message = JSON.parse(String(event.data)) as CdpMessage
    if (typeof message.id === 'number' && pending.has(message.id)) {
      pending.get(message.id)?.(message)
      pending.delete(message.id)
    } else if (message.method === 'Runtime.exceptionThrown') {
      logs.push(
        `exception: ${message.params?.exceptionDetails?.exception?.description ?? message.params?.exceptionDetails?.text}`,
      )
    } else if (message.method === 'Runtime.consoleAPICalled' && message.params?.type === 'error') {
      logs.push(
        `console.error: ${(message.params?.args ?? []).map((arg) => arg.value ?? arg.description).join(' ')}`,
      )
    }
  }
  const send = (method: string, params: Record<string, unknown> = {}) =>
    new Promise<CdpMessage>((resolve) => {
      const id = ++nextId
      pending.set(id, resolve)
      socket.send(JSON.stringify({ id, method, params }))
    })
  await send('Runtime.enable')
  await send('Page.enable')
  const evaluate = async <T>(expression: string): Promise<T> => {
    const reply = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (reply.result?.exceptionDetails)
      throw new Error(`evaluate failed: ${reply.result.exceptionDetails.text}`)
    return reply.result?.result?.value as T
  }
  return {
    logs,
    navigate: async (url) => {
      await send('Page.navigate', { url })
      await sleep(300)
    },
    evaluate,
    waitFor: async (expression, ms = 8000) => {
      const end = Date.now() + ms
      while (Date.now() < end) {
        if (await evaluate<boolean>(`Boolean(${expression})`)) return
        await sleep(40)
      }
      throw new Error(`timed out waiting for: ${expression}`)
    },
    resize: async (width, height) => {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 600,
      })
    },
    screenshot: async () =>
      Buffer.from(
        (await send('Page.captureScreenshot', { format: 'png' })).result?.data ?? '',
        'base64',
      ),
    close: () => {
      try {
        socket.close()
      } catch {
        // already closed
      }
      chrome.kill('SIGKILL')
      rmSync(profile, { recursive: true, force: true })
    },
  }
}
