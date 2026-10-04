import type { ParcelProjection } from './types.js'

/**
 * FOC-P3 alert rules: hung / failed / tripwire over the derived projection.
 * Alerts are computed, never stored as parcel state; the console-local
 * notification store (OQ3) records that an alert fired, not delivery state.
 */
export type AlertKind = 'hung' | 'failed' | 'tripwire'

export interface Alert {
  readonly id: string
  readonly kind: AlertKind
  readonly goal: string
  readonly parcel: string
  readonly rule: string
  readonly detail: string
  readonly observedAt: string
}

export function deriveAlerts(parcels: readonly ParcelProjection[], now: number): Alert[] {
  const observedAt = new Date(now).toISOString()
  const alerts: Alert[] = []
  for (const parcel of parcels) {
    if (parcel.state === 'hung') {
      alerts.push({
        id: `${parcel.goal}:${parcel.parcel}:hung`,
        kind: 'hung',
        goal: parcel.goal,
        parcel: parcel.parcel,
        rule: parcel.rule,
        detail: `hung: no receipt progress beyond ${parcel.heartbeat.thresholdMs}ms and no live worktree (${parcel.liveness.reason})`,
        observedAt,
      })
      continue
    }
    if (parcel.failure === null) continue
    const kind: AlertKind = parcel.failure.code === 'tripwire' ? 'tripwire' : 'failed'
    alerts.push({
      id: `${parcel.goal}:${parcel.parcel}:${kind}`,
      kind,
      goal: parcel.goal,
      parcel: parcel.parcel,
      rule: parcel.rule,
      detail: `${parcel.failure.code}: ${parcel.failure.detail}`,
      observedAt,
    })
  }
  return alerts
}
