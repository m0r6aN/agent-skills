/**
 * D42 contract-readers registry (GSO-P2): types for a declared contract-reader
 * entry, and for the point-in-time touch set derived from a parcel spec's
 * `surfaces:` globs. See README.md for why this package is named
 * `contract-readers` and not `contract-registry` — it is deliberately distinct
 * from `plugins/foreman-line/contracts/src/registry.ts`, the pre-existing
 * registry of frozen pipeline-stage-envelope schemas. This parcel does not
 * touch that package.
 */

/** A reader declared as a concrete parcel/spec identifier plus its concrete files. */
export interface ContractReaderParcel {
  readonly parcelId: string
  readonly files: readonly string[]
}

/**
 * A single declared reader of a contract: either a bare repo-relative file
 * path, or an object naming a parcel/spec identifier plus at least one
 * concrete repository-relative file (Constraint 3). Never a directory or a
 * glob — enforced by `contractReaderEntrySchema` (see `schema.ts`).
 */
export type ContractReader = string | ContractReaderParcel

/**
 * A shared contract and its declared readers. `readers` must be non-empty and
 * every member must be a concrete identity (Constraint 3) — schema-enforced,
 * not merely documented.
 */
export interface ContractReaderEntry {
  readonly contract: string
  readonly description?: string
  readonly readers: readonly ContractReader[]
}

/**
 * A point-in-time resolution of a parcel spec's `surfaces:` globs against a
 * repo root (Constraint 4). `files` is the resolved, normalized, deduplicated,
 * sorted set of repository-relative paths. `resolvedAtCommit` and
 * `resolvedAtTimestamp` record when the resolution happened, so a `TouchSet`
 * is never mistaken for a stable enumeration — it is a snapshot.
 */
export interface TouchSet {
  readonly files: readonly string[]
  readonly resolvedAtCommit: string
  readonly resolvedAtTimestamp: string
}
