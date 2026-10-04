/**
 * Injected `Clock` seam (FK-P9: "Timestamps come only from an injected `Clock`
 * seam (micros); no ambient time reads"). Timestamp-carrying columns are
 * stamped from the handle's clock when the caller omits them; tests inject
 * fixed clocks, which is what makes export determinism testable.
 */

/** Microsecond time source injected into every `Storage` handle. */
export interface Clock {
  /** Current time in nonnegative integer microseconds. */
  nowMicros(): number
}

/** A clock frozen at a fixed micros value (or advancing by a fixed step per read). */
export function fixedClock(micros: number, stepMicros = 0): Clock {
  if (!Number.isSafeInteger(micros) || micros < 0) {
    throw new Error('fixedClock: micros must be a nonnegative safe integer')
  }
  if (!Number.isSafeInteger(stepMicros) || stepMicros < 0) {
    throw new Error('fixedClock: stepMicros must be a nonnegative safe integer')
  }
  let current = micros
  return {
    nowMicros(): number {
      const value = current
      current += stepMicros
      return value
    },
  }
}

/**
 * The single ambient-time reader in the package. Nothing outside this function
 * may read wall-clock time; everything else receives time through the seam.
 */
export function systemClock(): Clock {
  return {
    nowMicros(): number {
      return Math.floor(Date.now() * 1000)
    },
  }
}
