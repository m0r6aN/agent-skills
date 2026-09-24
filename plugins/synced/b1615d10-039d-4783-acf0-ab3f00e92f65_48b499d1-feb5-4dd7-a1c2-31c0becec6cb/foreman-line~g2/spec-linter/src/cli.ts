/**
 * `spec-linter validate [--no-permission-profile-warning] [--config <path>] [--repo-root <path>] <path>`
 *
 * Exit-code contract (frozen by this parcel, no CI wiring):
 *   0  all specs valid (advisory warnings do not affect exit code)
 *   1  at least one schema or semantic-invariant violation (every violation on stderr)
 *   2  usage error: missing/unreadable path, bad invocation, or directory with no .md files
 *
 * Advisory warnings (stderr, exit 0 unchanged):
 *   - permission_profile absent in a spec
 *   - surfaces entry does not begin with a known SPEC-CONVENTION §4 vocabulary prefix
 *   - involves entry outside the known §4.8 capability vocabulary (P1a)
 *
 * --no-permission-profile-warning  fully suppresses the absent-permission-profile advisory
 * --config <path>  EXPLICIT path to a foreman/config.yaml whose `capabilities:`
 *   keys extend the §4.8 involves vocabulary (resolution order, step 2). The
 *   flag is the ONLY way a config reaches the linter — there is no implicit
 *   lookup from process.cwd() or anywhere else (D19 discipline). The document
 *   is parsed and validated by foreman-config (single ownership of the config
 *   contract, D15 reasoning): a config that fails ITS schema is a usage error
 *   (exit 2) — a bad ARGUMENT, distinct from D14's rule that an unknown or
 *   unresolvable `involves:` VALUE can never change an exit code.
 */
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { parseFrontmatter, validateSpecFrontmatter } from './validate.js'

const ANSI_ESCAPE = String.fromCharCode(0x1b)

/** Removes line-protocol and terminal-control bytes from externally supplied stderr data. */
function sanitizeStderrValue(value: unknown): string {
  try {
    return String(value).replaceAll('\r', ' ').replaceAll('\n', ' ').replaceAll(ANSI_ESCAPE, ' ')
  } catch {
    return '<unprintable>'
  }
}

function sanitizeErrorMessage(error: unknown): string {
  return sanitizeStderrValue(error instanceof Error ? error.message : error)
}

/** Recursively collects every .md file under `dir`. */
function collectMdFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectMdFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath)
    }
  }
  return results
}

/**
 * Reads, parses, and schema-validates the EXPLICITLY supplied config path,
 * returning the `capabilities:` key list. Returns `undefined` on failure
 * (after writing the reason to stderr) — every failure here is a usage
 * error (exit 2): the caller handed the linter a bad argument.
 */
async function loadCapabilityExtensions(
  configPath: string,
): Promise<readonly string[] | undefined> {
  // A4.3: the typed try/catch covers the WHOLE config-load path, not only the
  // foreman-config import. A reviewer proved a lazy sibling import placed
  // AFTER the successful foreman-config import escaped the narrower catch as
  // an untyped non-2 crash — exactly what AC2 exists to prevent. Nothing
  // inside this function can now exit as anything but a typed refusal
  // (undefined return -> the caller's exit-2 path).
  try {
    // foreman-config is loaded DYNAMICALLY, and only here (finding B2,
    // P2b-ii): without --config the CLI never touches the sibling package, so
    // a tree where foreman-config's dependencies are not installed can still
    // run every no-config invocation. ANY failure of this import (ruling A1.2
    // — never narrowed to one error code) is a typed usage-environment
    // refusal: the caller handed the linter a --config it cannot honor in
    // this tree, so the undefined return lands on the existing exit-2 path.
    let foremanConfig: typeof import('../../foreman-config/src/validate.js')
    try {
      foremanConfig = await import('../../foreman-config/src/validate.js')
    } catch (err) {
      process.stderr.write(
        `error: cannot load foreman-config from '../../foreman-config/src/validate.js': ${sanitizeErrorMessage(err)}\n`,
      )
      // The remedy names the sibling package WITHOUT a repo-shaped path
      // prefix: a repo-shaped literal here is a D19 class-3 violation (the
      // audit flagged the first spelling of this line).
      process.stderr.write("remedy: run 'npm install' in the sibling foreman-config package\n")
      return undefined
    }
    const { parseForemanConfigYaml, validateForemanConfig } = foremanConfig
    let raw: string
    try {
      raw = readFileSync(configPath, 'utf8')
    } catch (err) {
      process.stderr.write(
        `error: cannot read config '${sanitizeStderrValue(configPath)}': ${sanitizeErrorMessage(err)}\n`,
      )
      return undefined
    }
    let doc: unknown
    try {
      doc = parseForemanConfigYaml(raw)
    } catch (err) {
      process.stderr.write(
        `error: cannot parse config '${sanitizeStderrValue(configPath)}' as YAML: ${sanitizeErrorMessage(err)}\n`,
      )
      return undefined
    }
    const result = validateForemanConfig(doc)
    if (!result.valid) {
      process.stderr.write(
        `error: config '${sanitizeStderrValue(configPath)}' is not a valid foreman/config.yaml:\n`,
      )
      for (const message of result.errors) {
        process.stderr.write(`  ${sanitizeStderrValue(message)}\n`)
      }
      return undefined
    }
    const capabilities = (doc as { capabilities: Record<string, unknown> }).capabilities
    return Object.keys(capabilities)
  } catch (err) {
    // A4.3 catch-all: any OTHER failure anywhere on the config-load path — a
    // later sibling import, a throw inside foreman-config's own execution —
    // is the same typed refusal, never an untyped crash with a non-2 exit.
    process.stderr.write(
      `error: cannot honor --config '${sanitizeStderrValue(configPath)}': ${sanitizeErrorMessage(err)}\n`,
    )
    return undefined
  }
}

/**
 * Validates a single .md file.
 * Returns exit code 0 (valid), 1 (violation), or 2 (IO error).
 * Writes all errors and warnings to stderr prefixed with the file path.
 */
function validateFile(
  filePath: string,
  noPermissionProfileWarning: boolean,
  capabilityExtensions?: readonly string[],
  repoRoot?: string,
): number {
  let content: string
  try {
    content = readFileSync(filePath, 'utf8')
  } catch (err) {
    process.stderr.write(
      `error: cannot read '${sanitizeStderrValue(filePath)}': ${sanitizeErrorMessage(err)}\n`,
    )
    return 2
  }

  const doc = parseFrontmatter(content)
  if (doc === null) {
    process.stderr.write(
      `${sanitizeStderrValue(filePath)}: error: no valid YAML frontmatter found\n`,
    )
    return 1
  }

  const documentRef = repoRoot === undefined ? undefined : toDocumentRef(repoRoot, filePath)
  if (repoRoot !== undefined && documentRef === undefined) return 2

  const result = validateSpecFrontmatter(doc, {
    noPermissionProfileWarning,
    basename: basename(filePath),
    // Grandfather waivers are scoped to files whose parent directory is
    // `done` (CLOSE-P2 rework R1a) — validation checks this signal.
    parentDirName: basename(dirname(filePath)),
    capabilityExtensions,
    documentRef,
  })

  for (const warning of result.warnings) {
    process.stderr.write(`${sanitizeStderrValue(filePath)}: ${sanitizeStderrValue(warning)}\n`)
  }
  if (!result.valid) {
    for (const error of result.errors) {
      process.stderr.write(`${sanitizeStderrValue(filePath)}: ${sanitizeStderrValue(error)}\n`)
    }
    return 1
  }
  return 0
}

function isAtOrBelow(repoRoot: string, candidatePath: string): boolean {
  const candidateRelative = relative(repoRoot, candidatePath)
  return (
    candidateRelative === '' ||
    (!isAbsolute(candidateRelative) &&
      candidateRelative !== '..' &&
      !candidateRelative.startsWith(`..${sep}`))
  )
}

/**
 * Converts one actual candidate file to the only identity form accepted by the
 * new missing-verification_class waiver. Both paths are resolved explicitly;
 * there is no inferred repository root.
 */
function toDocumentRef(repoRoot: string, filePath: string): string | undefined {
  let resolvedFile: string
  try {
    resolvedFile = realpathSync(filePath)
  } catch (err) {
    process.stderr.write(
      `error: cannot resolve '${sanitizeStderrValue(filePath)}': ${sanitizeErrorMessage(err)}\n`,
    )
    return undefined
  }
  if (!isAtOrBelow(repoRoot, resolvedFile)) {
    process.stderr.write(
      `error: '${sanitizeStderrValue(filePath)}' is outside the supplied --repo-root\n`,
    )
    return undefined
  }
  return relative(repoRoot, resolvedFile).split(sep).join('/')
}

function resolveRepoRoot(repoRootPath: string): string | undefined {
  try {
    const resolvedRoot = realpathSync(resolve(repoRootPath))
    if (!statSync(resolvedRoot).isDirectory()) {
      process.stderr.write(
        `error: --repo-root '${sanitizeStderrValue(repoRootPath)}' is not a directory\n`,
      )
      return undefined
    }
    return resolvedRoot
  } catch (err) {
    process.stderr.write(
      `error: cannot resolve --repo-root '${sanitizeStderrValue(repoRootPath)}': ${sanitizeErrorMessage(err)}\n`,
    )
    return undefined
  }
}

const USAGE =
  'usage: spec-linter validate [--no-permission-profile-warning] [--config <path>] [--repo-root <path>] <path>\n'

async function run(argv: readonly string[]): Promise<number> {
  const noPermissionProfileWarning = argv.includes('--no-permission-profile-warning')
  const withoutFlags = argv.filter((a) => a !== '--no-permission-profile-warning')

  let configPath: string | undefined
  let repoRootPath: string | undefined
  const filtered: string[] = []
  for (let i = 0; i < withoutFlags.length; i++) {
    if (withoutFlags[i] === '--config') {
      if (configPath !== undefined) {
        process.stderr.write(USAGE)
        return 2
      }
      configPath = withoutFlags[i + 1]
      if (configPath === undefined) {
        process.stderr.write(USAGE)
        return 2
      }
      i++
    } else if (withoutFlags[i] === '--repo-root') {
      if (repoRootPath !== undefined) {
        process.stderr.write(USAGE)
        return 2
      }
      repoRootPath = withoutFlags[i + 1]
      if (repoRootPath === undefined) {
        process.stderr.write(USAGE)
        return 2
      }
      if (repoRootPath.trim().length === 0) {
        process.stderr.write('error: --repo-root must not be empty or whitespace-only\n')
        return 2
      }
      i++
    } else {
      filtered.push(withoutFlags[i] as string)
    }
  }
  const [command, targetPath] = filtered

  if (command !== 'validate' || targetPath === undefined || filtered.length !== 2) {
    process.stderr.write(USAGE)
    return 2
  }

  let capabilityExtensions: readonly string[] | undefined
  if (configPath !== undefined) {
    capabilityExtensions = await loadCapabilityExtensions(configPath)
    if (capabilityExtensions === undefined) return 2
  }

  const repoRoot = repoRootPath === undefined ? undefined : resolveRepoRoot(repoRootPath)
  if (repoRootPath !== undefined && repoRoot === undefined) return 2

  let isDirectory: boolean
  try {
    isDirectory = statSync(targetPath).isDirectory()
  } catch (err) {
    process.stderr.write(
      `error: cannot access '${sanitizeStderrValue(targetPath)}': ${sanitizeErrorMessage(err)}\n`,
    )
    return 2
  }

  if (repoRoot !== undefined) {
    let resolvedTarget: string
    try {
      resolvedTarget = realpathSync(targetPath)
    } catch (err) {
      process.stderr.write(
        `error: cannot resolve '${sanitizeStderrValue(targetPath)}': ${sanitizeErrorMessage(err)}\n`,
      )
      return 2
    }
    if (!isAtOrBelow(repoRoot, resolvedTarget)) {
      process.stderr.write(
        `error: '${sanitizeStderrValue(targetPath)}' is outside the supplied --repo-root\n`,
      )
      return 2
    }
  }

  if (!isDirectory) {
    return validateFile(targetPath, noPermissionProfileWarning, capabilityExtensions, repoRoot)
  }

  // Directory mode: collect all .md files recursively
  let mdFiles: string[]
  try {
    mdFiles = collectMdFiles(targetPath)
  } catch (err) {
    process.stderr.write(
      `error: cannot read directory '${sanitizeStderrValue(targetPath)}': ${sanitizeErrorMessage(err)}\n`,
    )
    return 2
  }

  if (mdFiles.length === 0) {
    process.stderr.write(`error: '${sanitizeStderrValue(targetPath)}' contains no .md files\n`)
    return 2
  }

  let anyViolations = false
  for (const file of mdFiles.sort()) {
    const code = validateFile(file, noPermissionProfileWarning, capabilityExtensions, repoRoot)
    if (code === 1) anyViolations = true
    if (code === 2) return 2
  }
  return anyViolations ? 1 : 0
}

// Top-level await (ratified Q4): the exit code is assigned before the module
// finishes evaluating, so the process never exits with an unset code.
process.exitCode = await run(process.argv.slice(2))
