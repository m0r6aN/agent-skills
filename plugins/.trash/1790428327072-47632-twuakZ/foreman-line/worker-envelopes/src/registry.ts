/**
 * Central registry of the two top-level envelope schemas (WF-P2 spec: "one
 * parcel, two schema pairs, co-versioned"). `generate.ts` serializes these
 * to `schemas/*.json`; the parity test proves the committed files never
 * drift from these typed sources.
 */
import type { SchemaFile } from '../../schema-scaffold/src/registry.js'
import { resultEnvelopeSchema } from './result-envelope.js'
import { taskEnvelopeSchema } from './task-envelope.js'

export type { SchemaFile }

/** The two top-level envelopes -- one schema file each. */
export const allSchemaFiles: readonly SchemaFile[] = [
  { name: 'task', schema: taskEnvelopeSchema },
  { name: 'result', schema: resultEnvelopeSchema },
]
