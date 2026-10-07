/**
 * Trusted lease time (FK-P10 T5). Every lease-time decision — grant, expiry
 * check, renewal extension, takeover stamping — reads time exactly once per
 * operation through the injected FK-P9 `Clock` seam wrapped by `TrustedClock`.
 * No exported API parameter carries a caller timestamp, duration origin, or
 * `now`; no ambient time read exists in the package (production injects
 * FK-P9's `systemClock()`; tests inject `fixedClock`).
 *
 * Readings must be nonnegative safe integers and non-decreasing across the
 * engine instance: a regression refuses (`CLOCK_REGRESSION`), a malformed
 * reading refuses (`CLOCK_UNTRUSTED`) — the operation never proceeds on
 * untrusted time.
 *
 * Monotonic measurement (`elapsedMicros`) uses `process.hrtime.bigint()` and
 * is only ever used for measurement spans (T11 contention records), never for
 * lease expiry. Lease expiry is stamped and compared in absolute shared
 * micros (multi-process comparability).
 */
import type { Clock } from '@foreman-line/kernel-state'
import { engineError } from './errors.js'

/** Wrapper enforcing the T5 trusted-time discipline over an injected seam. */
export class TrustedClock {
  readonly #seam: Clock
  #lastMicros: number | null = null
  #seamReads = 0

  constructor(seam: Clock) {
    if (seam === null || typeof seam !== 'object' || typeof seam.nowMicros !== 'function') {
      throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: 'clock' })
    }
    this.#seam = seam
  }

  /** Exactly one seam read per call; the only time source in the engine. */
  nowMicros(): number {
    let value: unknown
    try {
      value = this.#seam.nowMicros()
    } catch {
      throw engineError('CLOCK_UNTRUSTED', {})
    }
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
      throw engineError('CLOCK_UNTRUSTED', {})
    }
    if (this.#lastMicros !== null && value < this.#lastMicros) {
      throw engineError('CLOCK_REGRESSION', {})
    }
    this.#lastMicros = value
    this.#seamReads += 1
    return value
  }

  /** Seam-read counter (test observability for the single-read rule, AC4). */
  get seamReads(): number {
    return this.#seamReads
  }
}

/** Monotonic span origin (measurement spans only — never lease expiry). */
export function monotonicStartMicros(): bigint {
  return process.hrtime.bigint()
}

/**
 * Elapsed microseconds on a monotonic source (T5). Only measurement spans
 * (T11) may consume this; lease expiry never does.
 */
export function elapsedMicros(startMono: bigint): number {
  const delta = process.hrtime.bigint() - startMono
  const micros = delta / 1000n
  return micros > BigInt(Number.MAX_SAFE_INTEGER) ? Number.MAX_SAFE_INTEGER : Number(micros)
}
