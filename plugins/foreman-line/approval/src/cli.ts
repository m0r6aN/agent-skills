/**
 * `approval <show|approve|reject> <slug|path>` - the CLI surface (coordinator
 * ruling Q6, matching the shipped `routing-policy`/`receipts` precedent):
 * `process.argv` parsing, `process.exitCode`, exit codes `0` success / `1`
 * semantic-or-validation failure / `2` usage error (missing/unreadable path,
 * bad invocation, non-TTY approve).
 *
 * `show` - renders the tree, read-only, mints nothing; safe in CI / non-TTY.
 * `approve` - renders the tree, then requires BOTH an interactive TTY and a
 * matching typed confirmation (the exact slug, ruling F2) before minting the
 * genesis/Stage-A receipt and writing the approval record. There is NO
 * `--yes`/`--force`/auto-approve flag of any kind (Q6) - a non-TTY `approve`
 * refuses with exit code 2 and writes nothing (no receipt, no approval
 * record - checked BEFORE any mint/write is attempted, so the human-gate
 * checks are the only path to the mint/write step below).
 * `reject` - records a rejection with a reason but mints no receipt and
 * produces no `approvedHash` binding.
 *
 * `--repo-root <path>` (REQUIRED, all three verbs — P2b-i/R3, extending
 * P2a/D19): the absolute target repo root every library call below resolves
 * paths against. Absent or relative → typed exit-2 refusal (PCC-P0 usage),
 * nothing written. Purely a filesystem-location input - it never touches
 * approval authorization, the TTY check, or the confirmation check.
 *
 * `--specs-dir <dir>` (optional, all three verbs — P2b-i/R2): the specs
 * `active/` directory relative to `--repo-root`. Defaults to the foreign-repo
 * value `docs/specs/active`; the home repo passes
 * `plugins/foreman-line/docs/specs/active` explicitly. A relative path within
 * a caller-supplied root — not a root fallback (A1.3).
 */
import { performApproval } from './approve-flow.js'
import { confirmationMatches, isInteractiveTty, promptForConfirmation } from './confirm.js'
import { ApprovalRootUnresolvedError, assertAbsoluteRoot } from './errors.js'
import { type RejectionRecord, writeRejectionRecord } from './rejection-record.js'
import { renderTree } from './render.js'
import { resolveArtifact } from './resolve-input.js'
import { computeApprovalSubject } from './subject.js'

interface Flags {
  readonly [name: string]: string | undefined
}

function parseFlags(args: readonly string[]): Flags {
  const flags: Record<string, string> = {}
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === undefined || !a.startsWith('--')) continue
    const name = a.slice(2)
    const next = args[i + 1]
    if (next === undefined || next.startsWith('--')) {
      flags[name] = ''
      continue
    }
    flags[name] = next
    i++
  }
  return flags
}

async function runShow(
  arg: string,
  flags: Flags,
  repoRoot: string,
  specsDir: string | undefined,
): Promise<number> {
  try {
    const resolved = resolveArtifact(arg, {
      epicTitle: flags['epic-title'],
      repoRoot,
      specsDir,
    })
    process.stdout.write(`${renderTree(resolved.projectedResult)}\n`)
    return 0
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n`)
    return 2
  }
}

async function runApprove(
  arg: string,
  flags: Flags,
  repoRoot: string,
  specsDir: string | undefined,
): Promise<number> {
  let resolved: ReturnType<typeof resolveArtifact>
  try {
    resolved = resolveArtifact(arg, { epicTitle: flags['epic-title'], repoRoot, specsDir })
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n`)
    return 2
  }

  process.stdout.write(`${renderTree(resolved.projectedResult)}\n`)

  const approver = flags.approver
  if (approver === undefined || approver.trim().length === 0) {
    process.stderr.write('error: approve requires --approver <name>\n')
    return 2
  }

  // Human-gate check 1 of 2 (Q6/AC8): a live interactive TTY. No flag, no
  // environment variable can substitute. Refuses BEFORE any mint/write.
  if (!isInteractiveTty()) {
    process.stderr.write(
      'error: approve requires an interactive TTY; refusing (no receipt, no approval record written)\n',
    )
    return 2
  }

  // Human-gate check 2 of 2 (Q6/AC8/F2): a typed confirmation matching the
  // exact slug, linear-time exact-string comparison. Still before any write.
  const typed = await promptForConfirmation(resolved.slug)
  if (!confirmationMatches(typed, resolved.slug)) {
    process.stderr.write(
      'error: typed confirmation did not match the slug; refusing (no receipt, no approval record written)\n',
    )
    return 1
  }

  // Both human-gate checks passed - this is the ONLY call site in the
  // package that reaches receipt-mint + approval-record write (via
  // `performApproval`, which also owns the record-before-receipt durability
  // ordering and refuse-to-overwrite check).
  try {
    const { record, receiptPath } = performApproval(resolved, approver, repoRoot, specsDir)
    process.stdout.write(
      `approved: ${resolved.slug}\n  approvedHash: ${record.approvedHash}\n  receipt: ${receiptPath}\n`,
    )
    return 0
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n`)
    return 1
  }
}

async function runReject(
  arg: string,
  flags: Flags,
  repoRoot: string,
  specsDir: string | undefined,
): Promise<number> {
  let resolved: ReturnType<typeof resolveArtifact>
  try {
    resolved = resolveArtifact(arg, { epicTitle: flags['epic-title'], repoRoot, specsDir })
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n`)
    return 2
  }

  process.stdout.write(`${renderTree(resolved.projectedResult)}\n`)

  const { approvedHash } = computeApprovalSubject(resolved.projectedResult, repoRoot)
  const reason = flags.reason === undefined ? null : flags.reason
  const timestamp = new Date().toISOString()
  const record: RejectionRecord = {
    decision: 'rejected',
    reason,
    timestamp,
    referenceHash: approvedHash,
  }
  writeRejectionRecord(resolved.slug, record, repoRoot, specsDir)
  process.stdout.write(`rejected: ${resolved.slug}\n`)
  return 0
}

async function main(argv: readonly string[]): Promise<number> {
  const [command, arg, ...rest] = argv
  if (arg === undefined || (command !== 'show' && command !== 'approve' && command !== 'reject')) {
    process.stderr.write(
      'usage: approval <show|approve|reject> <slug|path> --repo-root <path> [--specs-dir <dir>] [--epic-title <title>] [--approver <name>] [--reason <text>]\n',
    )
    return 2
  }

  const flags = parseFlags(rest)

  // CLI/entry seam (P2b-i/R3, P2a Q3 shape): the root is user-supplied and
  // REQUIRED. Absent or non-absolute → typed exit-2 refusal (PCC-P0 usage)
  // before any filesystem work; nothing is written.
  const repoRootFlag = flags['repo-root']
  try {
    if (repoRootFlag === undefined || repoRootFlag.trim().length === 0) {
      throw new ApprovalRootUnresolvedError(
        'root-absent',
        'approval: --repo-root <path> is required (P2b-i/D19: the target repo root is never derived from this tool’s own location or the process cwd)',
      )
    }
    assertAbsoluteRoot(repoRootFlag, 'approval --repo-root')
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n`)
    return 2
  }
  const repoRoot = repoRootFlag
  const specsDir = flags['specs-dir']

  if (command === 'show') return runShow(arg, flags, repoRoot, specsDir)
  if (command === 'approve') return runApprove(arg, flags, repoRoot, specsDir)
  return runReject(arg, flags, repoRoot, specsDir)
}

process.exitCode = await main(process.argv.slice(2))
