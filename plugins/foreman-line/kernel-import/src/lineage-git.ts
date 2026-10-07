/**
 * OQ-8 shipped lineage reader over a real git repository — strictly read-only.
 *
 * (a) Read-only plumbing discipline: every git invocation is `execFileSync`
 *     with an ARGV ARRAY (`shell: false` — never a shell string), and every
 *     subcommand routes through the single internal invocation method below,
 *     which rejects anything outside the exported `GIT_READ_ONLY_SUBCOMMANDS`
 *     allowlist. No mutation subcommand is ever reachable through this reader.
 * (b) The operator-trust assumption recorded for injected-seam test runs is
 *     never granted to this shipped reader: it accepts no operator-supplied
 *     commands, callbacks, or argv (OQ-8 ruling).
 *
 * Failure discipline: operational failures throw
 * `Object.assign(new Error('lineage-reader-failure'), { code })` with `code`
 * from the closed set `git-missing` (git binary not found on spawn),
 * `git-invocation-failure` (spawn failure or signal kill), `git-nonzero-exit`
 * (an unexpected git exit). The message is never a product diagnostic — the
 * seam gateway carries only the code literal.
 *
 * Exit mapping (git plumbing is authoritative):
 * - `rev-parse --verify --quiet <rev>^{commit}`: 0 known / 1 unknown. The
 *   `--quiet` flag is what makes an unknown revision exit 1 instead of the
 *   `fatal: Needed a single revision` 128, which is what the reader contract's
 *   "exit 1 = unknown" mapping requires.
 * - `merge-base --is-ancestor <a> <b>`: 0 yes / 1 no (inclusive — a commit is
 *   its own ancestor).
 * - `cat-file blob <rev>:<path>`: 0 committed bytes. Git reports "no blob at
 *   this revision/path" both as exit 1 and as a `fatal` 128, so the failure
 *   path re-verifies the revision (clean 0/1 semantics): typed absence when
 *   the answer is "no such blob", `git-nonzero-exit` when the repository
 *   itself failed (e.g. not a git repository).
 */
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { BLOB_ABSENT, type BlobResult, type SourceLineageReader } from './lineage.js'

/** The closed set of git plumbing subcommands this reader may ever invoke. */
export const GIT_READ_ONLY_SUBCOMMANDS = ['cat-file', 'merge-base', 'rev-parse'] as const

type GitReadOnlySubcommand = (typeof GIT_READ_ONLY_SUBCOMMANDS)[number]

/** Closed failure-code literals carried on reader-thrown errors. */
type GitLineageFailureCode = 'git-missing' | 'git-invocation-failure' | 'git-nonzero-exit'

const MAX_GIT_OUTPUT_BYTES = 64 * 1024 * 1024

interface GitOutcome {
  readonly status: number
  readonly stdout: Buffer
}

function isGitReadOnlySubcommand(value: string): value is GitReadOnlySubcommand {
  return (GIT_READ_ONLY_SUBCOMMANDS as readonly string[]).includes(value)
}

function gitFailure(code: GitLineageFailureCode): never {
  throw Object.assign(new Error('lineage-reader-failure'), { code })
}

/**
 * Normalizes the REQUIRED repo-root constructor input once (D19-FK class-5
 * ruled site: required-input normalization, never a discovered or defaulted
 * root). The seam is fail-closed on a wrong root: every invocation runs
 * read-only git plumbing against the resolved root, and a wrong or non-git
 * root surfaces as a typed lineage-reader failure (`git-invocation-failure` /
 * `git-nonzero-exit`) or typed lineage absence — both refuse the import.
 */
function normalizeRepoRoot(repoRoot: string): string {
  return resolve(repoRoot)
}

/** Shipped read-only `SourceLineageReader` over the named revisions of a git repo. */
export class GitLineageReader implements SourceLineageReader {
  #repoRoot: string

  constructor(repoRoot: string) {
    this.#repoRoot = normalizeRepoRoot(repoRoot)
  }

  /** `rev-parse --verify --quiet <commitId>^{commit}` — exit 0 known, 1 unknown. */
  commitExists(commitId: string): boolean {
    const outcome = this.#invoke('rev-parse', ['--verify', '--quiet', `${commitId}^{commit}`])
    if (outcome.status === 0) return true
    if (outcome.status === 1) return false
    return gitFailure('git-nonzero-exit')
  }

  /** `merge-base --is-ancestor <ancestor> <descendant>` — 0 yes, 1 no (inclusive). */
  isAncestor(ancestor: string, descendant: string): boolean {
    const outcome = this.#invoke('merge-base', ['--is-ancestor', ancestor, descendant])
    if (outcome.status === 0) return true
    if (outcome.status === 1) return false
    return gitFailure('git-nonzero-exit')
  }

  /**
   * `cat-file blob <commitId>:<sourcePath>` — committed bytes as `Uint8Array`
   * (never a string), or typed absence for a bad object/path.
   */
  readCommittedBlob(commitId: string, sourcePath: string): BlobResult {
    const outcome = this.#invoke('cat-file', ['blob', `${commitId}:${sourcePath}`])
    if (outcome.status === 0) return new Uint8Array(outcome.stdout)
    if (outcome.status === 1) return BLOB_ABSENT
    if (outcome.status !== 128) return gitFailure('git-nonzero-exit')
    // 128 covers both "no blob at this revision/path" and a repository-level
    // fatal. Re-verifying the revision separates the two with clean exit codes.
    const revision = this.#invoke('rev-parse', ['--verify', '--quiet', `${commitId}^{commit}`])
    if (revision.status === 0 || revision.status === 1) return BLOB_ABSENT
    return gitFailure('git-nonzero-exit')
  }

  #invoke(subcommand: string, args: readonly string[]): GitOutcome {
    if (!isGitReadOnlySubcommand(subcommand)) {
      gitFailure('git-invocation-failure')
    }
    try {
      const stdout = execFileSync('git', [subcommand, ...args], {
        cwd: this.#repoRoot,
        maxBuffer: MAX_GIT_OUTPUT_BYTES,
        encoding: 'buffer',
        shell: false,
      })
      return { status: 0, stdout }
    } catch (value) {
      if (
        value !== null &&
        typeof value === 'object' &&
        'code' in value &&
        value.code === 'ENOENT'
      ) {
        gitFailure('git-missing')
      }
      if (
        value !== null &&
        typeof value === 'object' &&
        'status' in value &&
        typeof value.status === 'number'
      ) {
        return { status: value.status, stdout: Buffer.alloc(0) }
      }
      return gitFailure('git-invocation-failure')
    }
  }
}
