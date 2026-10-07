import type { SchemaObject } from 'ajv'

/**
 * D33 (Amendment 1): registry and envelope schemas are serialization points --
 * exactly one parcel writes to a given surface at a time, and any parcel
 * intending to extend it must be named explicitly rather than assumed. This
 * package self-declares itself as one such point (AC5): `role-authority/src/*`,
 * `role-authority/schemas/*`, and `role-authority/tests/*` are owned solely by
 * this parcel for the duration of Wave 0; no other in-flight parcel's
 * `surfaces:` may claim a `role-authority/` path without amending this record.
 * The ratified self-declaration instance lives in `src/instances.ts`
 * (coordinator amendment F3): this package's own surface, owned solely by
 * WF-P1 for Wave 0, so the README's reference to a `SerializationPointOwnership`
 * record resolves to a real committed artifact rather than an empty shape.
 */
export interface SerializationPointOwnership {
  /** Repo-relative glob naming the owned surface. */
  readonly path: string
  /** The parcel ticket that owns writes to `path`. */
  readonly owner: string
  /** `'sole'` = no other parcel may write without an amendment; `'shared'` = extension is pre-authorized per-wave. */
  readonly extensionPolicy: 'sole' | 'shared'
  /** Named only when `extensionPolicy` is `'shared'`; the parcel(s) pre-authorized to extend. */
  readonly authorizedExtenders?: readonly string[]
}

export const serializationPointOwnershipSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['path', 'owner', 'extensionPolicy'],
  properties: {
    path: { type: 'string', minLength: 1 },
    owner: { type: 'string', minLength: 1 },
    extensionPolicy: { type: 'string', enum: ['sole', 'shared'] },
    authorizedExtenders: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
    },
  },
}
