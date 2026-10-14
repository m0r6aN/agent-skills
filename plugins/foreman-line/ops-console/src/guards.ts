/**
 * The package's single canonical runtime guard (no shared type-guard module
 * exists in the dependency set and the frozen packages are read-only inputs).
 * Call sites consume named shapes via the typed boundary helpers below; they
 * never recreate guards.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Sidecar JSON boundary shape (approval/rejection/projected sidecars). */
export interface SidecarDoc {
  readonly decision: string | null
  readonly artifactRef: string | null
  readonly specRefs: readonly string[]
}

/** Parse a sidecar JSON document once at the boundary into its named shape. */
export function parseSidecarDoc(raw: unknown): SidecarDoc {
  const doc = isRecord(raw) ? raw : {}
  const specRefs: string[] = []
  const subject = doc.subject
  if (isRecord(subject)) {
    const specSet = subject.specSet
    if (Array.isArray(specSet)) {
      for (const entry of specSet) {
        if (isRecord(entry) && typeof entry.ref === 'string') specRefs.push(entry.ref)
      }
    }
    const projected = subject.projectedResult
    if (isRecord(projected)) {
      const refs = projected.parcelSpecRefs
      if (Array.isArray(refs)) {
        for (const ref of refs) {
          if (typeof ref === 'string') specRefs.push(ref)
        }
      }
    }
  }
  return {
    decision: typeof doc.decision === 'string' ? doc.decision : null,
    artifactRef: typeof doc.artifactRef === 'string' ? doc.artifactRef : null,
    specRefs,
  }
}

/**
 * FCA-P4 destructive-confirmation contract: destructive actions require an
 * explicit typed intent bound to the specific subject — never silent, never
 * replayable across subjects. Shared by the dispatch path and the API surface
 * (the UI mirrors the same contract).
 */
export type ConfirmationRefusalReason = 'confirmation-required' | 'confirmation-mismatch'

export class ConfirmationRefusalError extends Error {
  readonly code = 2 as const
  readonly reason: ConfirmationRefusalReason

  constructor(reason: ConfirmationRefusalReason, message: string) {
    super(message)
    this.name = 'ConfirmationRefusalError'
    this.reason = reason
  }
}

/** The exact phrase a human must type for a destructive action on `subject`. */
export function destructiveConfirmationToken(subject: string): string {
  return `confirm delete ${subject}`
}

export function verifyDestructiveConfirmation(subject: string, provided: string | null): void {
  if (provided === null || provided === '') {
    throw new ConfirmationRefusalError(
      'confirmation-required',
      `destructive action on ${subject} requires typed confirmation`,
    )
  }
  if (provided !== destructiveConfirmationToken(subject)) {
    throw new ConfirmationRefusalError(
      'confirmation-mismatch',
      `confirmation does not match the typed intent for ${subject}`,
    )
  }
}
