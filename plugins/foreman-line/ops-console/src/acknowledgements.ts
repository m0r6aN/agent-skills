import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { stateFilePath } from './config.js'

export interface Acknowledgement {
  readonly id: string
  readonly goal?: string
  readonly fingerprint: string
  readonly at: string
  readonly note?: string
}
export interface AcknowledgementEvent {
  readonly action: 'acknowledge' | 'unacknowledge'
  readonly id: string
  readonly at: string
  readonly note?: string
}
interface Store {
  readonly schema: 'foc-acknowledgements/v1'
  readonly acks: Acknowledgement[]
  readonly events: AcknowledgementEvent[]
}
const EMPTY: Store = { schema: 'foc-acknowledgements/v1', acks: [], events: [] }
const NAME = 'acknowledgements.json'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function load(stateDir: string): Store {
  try {
    const raw: unknown = JSON.parse(readFileSync(stateFilePath(stateDir, NAME), 'utf8'))
    if (
      typeof raw !== 'object' ||
      raw === null ||
      !('acks' in raw) ||
      !Array.isArray(raw.acks) ||
      !('events' in raw) ||
      !Array.isArray(raw.events) ||
      !raw.acks.every(
        (entry) =>
          isRecord(entry) &&
          typeof entry.id === 'string' &&
          typeof entry.fingerprint === 'string' &&
          typeof entry.at === 'string',
      ) ||
      !raw.events.every(
        (entry) =>
          isRecord(entry) &&
          (entry.action === 'acknowledge' || entry.action === 'unacknowledge') &&
          typeof entry.id === 'string' &&
          typeof entry.at === 'string',
      )
    )
      return EMPTY
    return {
      schema: 'foc-acknowledgements/v1',
      acks: raw.acks as Acknowledgement[],
      events: raw.events as AcknowledgementEvent[],
    }
  } catch {
    return EMPTY
  }
}
function save(stateDir: string, store: Store): void {
  const path = stateFilePath(stateDir, NAME)
  mkdirSync(dirname(path), { recursive: true })
  const temp = `${path}.${process.pid}.tmp`
  writeFileSync(temp, `${JSON.stringify(store, null, 2)}\n`, 'utf8')
  renameSync(temp, path)
}
export function signalFingerprint(signal: {
  class: string
  repo: string
  subject: string
  evidence: readonly string[]
  severity: string
}): string {
  return createHash('sha256')
    .update(
      JSON.stringify([
        signal.class,
        signal.severity,
        signal.repo,
        signal.subject,
        ...signal.evidence,
      ]),
    )
    .digest('hex')
}
export function alertFingerprint(alert: {
  kind: string
  rule: string
  failureCode?: string
  goal: string
}): string {
  return createHash('sha256')
    .update(JSON.stringify([alert.goal, alert.kind, alert.rule, alert.failureCode]))
    .digest('hex')
}
export function listAcknowledgements(stateDir: string): Acknowledgement[] {
  return load(stateDir).acks
}
export function acknowledge(stateDir: string, ack: Acknowledgement, now: number): void {
  const store = load(stateDir)
  const at = new Date(now).toISOString()
  const acks = [
    ...store.acks.filter((entry) => entry.id !== ack.id || entry.goal !== ack.goal),
    { ...ack, at },
  ]
  const event: AcknowledgementEvent = {
    action: 'acknowledge',
    id: ack.id,
    at,
    ...(ack.note === undefined ? {} : { note: ack.note }),
  }
  save(stateDir, { schema: 'foc-acknowledgements/v1', acks, events: [...store.events, event] })
}
export function unacknowledge(stateDir: string, id: string, now: number): boolean {
  const store = load(stateDir)
  if (!store.acks.some((entry) => entry.id === id)) return false
  const at = new Date(now).toISOString()
  save(stateDir, {
    schema: 'foc-acknowledgements/v1',
    acks: store.acks.filter((entry) => entry.id !== id),
    events: [...store.events, { action: 'unacknowledge', id, at }],
  })
  return true
}
export function isAlertAcknowledged(
  stateDir: string,
  alert: { id: string; kind: string; rule: string; goal: string },
): boolean {
  const fingerprint = alertFingerprint(alert)
  return load(stateDir).acks.some(
    (entry) =>
      entry.id === alert.id && entry.goal === alert.goal && entry.fingerprint === fingerprint,
  )
}
