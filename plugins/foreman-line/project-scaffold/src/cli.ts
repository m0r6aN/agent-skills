#!/usr/bin/env node
/**
 * `project-scaffold [plan|apply] --project-name <name> --slug <slug>
 *   --base-branch <branch> --branch-prefix <prefix> --worktree-root <path>
 *   --target <dir> --templates <dir> [--preset <name>]
 *   [--project-key <key>] [--dispatch-queue <id>]`
 *
 * `plan` (the default — dry-run is the default in preflight, charter §4.3)
 * prints what a run would do and writes nothing. `apply` executes the same
 * plan and reports every path as created / skipped-existing / block-appended /
 * block-replaced / block-unchanged.
 *
 * Exit-code contract (frozen by PCC-P0):
 *   0  success
 *   1  validation failure (EQUIVALENT_LAYOUT_CONFLICT, UNREPLACED_PLACEHOLDER,
 *      MANAGED_BLOCK_MALFORMED, PATH_TYPE_CONFLICT, VALUE_REFUSED)
 *   2  usage error (USAGE)
 *   3  trust-invariant violation (CREDENTIAL_INPUT_REFUSED)
 *   4  environment error (ENVIRONMENT)
 *
 * All output passes through redact() so credential-shaped values can never
 * reach a log.
 */
import { parseScaffoldArgs, redact, type ScaffoldArgs } from './args.js'
import { ScaffoldError } from './errors.js'
import { applyScaffold, type FileAction, planScaffold } from './generator.js'

const USAGE =
  'usage: project-scaffold [plan|apply] --project-name <name> --slug <slug> --base-branch <branch> --branch-prefix <prefix> --worktree-root <path> --target <dir> --templates <dir> [--preset <name>] [--project-key <key>] [--dispatch-queue <id>]\n'

const ACTION_LABELS: Record<FileAction, string> = {
  create: 'create',
  'skip-existing': 'skip-existing',
  'block-append': 'block-append',
  'block-replace': 'block-replace',
  'block-unchanged': 'block-unchanged',
}

async function run(argv: readonly string[]): Promise<number> {
  let args: ScaffoldArgs
  try {
    args = parseScaffoldArgs(argv)
  } catch (err) {
    if (err instanceof ScaffoldError) {
      process.stderr.write(
        err.code === 'USAGE'
          ? `${redact(err.message)}\n${USAGE}`
          : `error: [${err.code}] ${redact(err.message)}\n`,
      )
      return err.exitCode
    }
    process.stderr.write('error: [ENVIRONMENT] unexpected failure while parsing arguments\n')
    return 4
  }

  try {
    const plan = planScaffold(args)
    const report = args.mode === 'apply' ? applyScaffold(plan) : plan.files
    for (const file of report) {
      process.stdout.write(`${ACTION_LABELS[file.action]}\t${file.target}\n`)
    }
    if (args.mode === 'plan') {
      process.stdout.write(
        `plan: ${report.length} path(s), ${plan.dirs.length} director(ies); nothing written (dry-run)\n`,
      )
    } else {
      process.stdout.write(
        `applied: ${report.length} path(s), ${plan.dirs.length} director(ies) created\n`,
      )
    }
    return 0
  } catch (err) {
    if (err instanceof ScaffoldError) {
      process.stderr.write(`error: [${err.code}] ${redact(err.message)}\n`)
      for (const path of err.paths) {
        process.stderr.write(`  path: ${redact(path)}\n`)
      }
      return err.exitCode
    }
    process.stderr.write(
      `error: [ENVIRONMENT] unexpected failure: ${redact(err instanceof Error ? err.message : String(err))}\n`,
    )
    return 4
  }
}

// Top-level await: the exit code is assigned before the module finishes
// evaluating, so the process never exits with an unset code.
process.exitCode = await run(process.argv.slice(2))
