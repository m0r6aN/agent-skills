import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Alert } from './alerts.js'
import { type StateFile, stateFilePath } from './config.js'
import { isRecord } from './guards.js'

/**
 * FOC-P3 console-local notification store (OQ3): `state/notifications.json`,
 * format `foc-notifications/v1`. Sole writer of that file in the package (X1).
 * Goal directories stay coordinator-owned; the console never writes into them
 * (D2) — this store is one of exactly two writable paths in the package.
 */
export interface Notification {
  readonly id: string
  readonly alertId: string
  readonly kind: string
  readonly goal: string
  readonly parcel: string
  readonly message: string
  readonly createdAt: string
}

interface NotificationStore {
  readonly schema: 'foc-notifications/v1'
  readonly notifications: Notification[]
}

const STORE_NAME: StateFile = 'notifications.json'

function loadStore(stateDir: string): NotificationStore {
  const empty: NotificationStore = { schema: 'foc-notifications/v1', notifications: [] }
  try {
    const raw: unknown = JSON.parse(readFileSync(stateFilePath(stateDir, STORE_NAME), 'utf8'))
    if (typeof raw !== 'object' || raw === null || !('notifications' in raw)) return empty
    const entries = raw.notifications
    if (!Array.isArray(entries)) return empty
    const notifications: Notification[] = []
    for (const entry of entries) {
      if (!isRecord(entry)) continue
      if (
        typeof entry.id === 'string' &&
        typeof entry.alertId === 'string' &&
        typeof entry.kind === 'string' &&
        typeof entry.goal === 'string' &&
        typeof entry.parcel === 'string' &&
        typeof entry.message === 'string' &&
        typeof entry.createdAt === 'string'
      ) {
        notifications.push({
          id: entry.id,
          alertId: entry.alertId,
          kind: entry.kind,
          goal: entry.goal,
          parcel: entry.parcel,
          message: entry.message,
          createdAt: entry.createdAt,
        })
      }
    }
    return { schema: 'foc-notifications/v1', notifications }
  } catch {
    // Absent or unreadable store starts empty; never a write outside state/.
    return empty
  }
}

function saveStore(stateDir: string, store: NotificationStore): void {
  const path = stateFilePath(stateDir, STORE_NAME)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(store, null, 2)}\n`, 'utf8')
}

/**
 * "Alerts fire" for hung/failed/tripwire parcels: each distinct alert id is
 * recorded once in the console-local store (firing is idempotent per alert id;
 * `observedAt` refreshes the alert computation, not the recorded firing).
 */
export function syncAlerts(
  stateDir: string,
  alerts: readonly Alert[],
  now: number,
): Notification[] {
  const store = loadStore(stateDir)
  const known = new Set(store.notifications.map((entry) => entry.alertId))
  const added: Notification[] = []
  for (const alert of alerts) {
    if (known.has(alert.id)) continue
    known.add(alert.id)
    added.push({
      id: `ntf-${alert.id}`,
      alertId: alert.id,
      kind: alert.kind,
      goal: alert.goal,
      parcel: alert.parcel,
      message: alert.detail,
      createdAt: new Date(now).toISOString(),
    })
  }
  if (added.length > 0) {
    saveStore(stateDir, {
      schema: 'foc-notifications/v1',
      notifications: [...store.notifications, ...added],
    })
  }
  return loadStore(stateDir).notifications
}

export function listNotifications(stateDir: string): Notification[] {
  return loadStore(stateDir).notifications
}

export function deleteNotification(stateDir: string, id: string): boolean {
  const store = loadStore(stateDir)
  const remaining = store.notifications.filter((entry) => entry.id !== id)
  if (remaining.length === store.notifications.length) return false
  saveStore(stateDir, { schema: 'foc-notifications/v1', notifications: remaining })
  return true
}
