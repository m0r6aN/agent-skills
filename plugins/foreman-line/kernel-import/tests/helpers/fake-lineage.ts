/**
 * The injected lineage test seam (T-seam rule 5): an in-memory commit graph
 * and blob table over which the operator-trust assumption IS recorded — for
 * injected-seam test runs only, never for the shipped reader (OQ-8).
 *
 * Also the two deliberately nonconforming seams that prove the gateway's
 * typed-normalization refusals (#28) and the ERR-01 harness pass-through.
 */
import { BLOB_ABSENT, type BlobResult, type SourceLineageReader } from '../../src/lineage.js'

function blobKey(commitId: string, sourcePath: string): string {
  return `${commitId}\n${sourcePath}`
}

/** In-memory commit graph + blobs conforming to `SourceLineageReader`. */
export class FakeLineage implements SourceLineageReader {
  #parents = new Map<string, string[]>()
  #blobs = new Map<string, BlobResult>()

  constructor(seed?: {
    commits?: { id: string; parents: string[] }[]
    blobs?: { commitId: string; sourcePath: string; text: string }[]
  }) {
    for (const commit of seed?.commits ?? []) {
      this.addCommit(commit.id, commit.parents)
    }
    for (const blob of seed?.blobs ?? []) {
      this.addBlob(blob.commitId, blob.sourcePath, new TextEncoder().encode(blob.text))
    }
  }

  addCommit(id: string, parents: string[]): void {
    this.#parents.set(id, [...parents])
  }

  addBlob(commitId: string, sourcePath: string, bytes: Uint8Array): void {
    this.#blobs.set(blobKey(commitId, sourcePath), bytes)
  }

  addAbsent(commitId: string, sourcePath: string): void {
    this.#blobs.set(blobKey(commitId, sourcePath), BLOB_ABSENT)
  }

  commitExists(commitId: string): boolean {
    return this.#parents.has(commitId)
  }

  /** Inclusive ancestry closure over parents: a commit is its own ancestor. */
  isAncestor(ancestor: string, descendant: string): boolean {
    if (!this.#parents.has(descendant)) return false
    const seen = new Set<string>()
    const frontier = [descendant]
    while (frontier.length > 0) {
      const current = frontier.pop()
      if (current === undefined || seen.has(current)) continue
      seen.add(current)
      if (current === ancestor) return true
      const parents = this.#parents.get(current)
      if (parents !== undefined) frontier.push(...parents)
    }
    return false
  }

  readCommittedBlob(commitId: string, sourcePath: string): BlobResult {
    return this.#blobs.get(blobKey(commitId, sourcePath)) ?? BLOB_ABSENT
  }
}

/** Wrong-typed seam returns across the three methods (strings, numbers, null, 42, …). */
const NONCONFORMING_RETURNS: readonly unknown[] = ['nonconforming', 1, null, 42, { absent: false }]

/** Seam returning wrong-typed values — proves the typed refusals (#28). */
export function nonconformingReader(): SourceLineageReader {
  let call = 0
  return {
    commitExists(): unknown {
      call += 1
      return NONCONFORMING_RETURNS[call % NONCONFORMING_RETURNS.length]
    },
    isAncestor(): unknown {
      call += 1
      return NONCONFORMING_RETURNS[call % NONCONFORMING_RETURNS.length]
    },
    readCommittedBlob(): unknown {
      call += 1
      return NONCONFORMING_RETURNS[call % NONCONFORMING_RETURNS.length]
    },
  }
}

/** Seam throwing HARNESS_ failures — proves ERR-01 (never laundered, same object). */
export function harnessFailureReader(): SourceLineageReader {
  const fault = Object.assign(new Error('boom'), { code: 'HARNESS_TEST_FAULT' })
  return {
    commitExists(): unknown {
      throw fault
    },
    isAncestor(): unknown {
      throw fault
    },
    readCommittedBlob(): unknown {
      throw fault
    },
  }
}
