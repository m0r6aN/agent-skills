/**
 * Typed CLI arguments for the scaffolder (charter §4.3).
 *
 * Every argument is a closed, typed field with its own default-deny charset
 * allowlist. User-supplied values are NEVER interpolated into executable
 * JavaScript anywhere in this package — they flow only into enumerated
 * template placeholder positions (see render.ts), and the allowlists make it
 * impossible for a value to reach a placeholder, marker, or path position
 * carrying syntax of its own. A value that fails its allowlist is refused
 * (`VALUE_REFUSED`); a credential-shaped value is refused outright
 * (`CREDENTIAL_INPUT_REFUSED`) so credentials never reach logs, report keys,
 * or artifacts. `--target` and `--templates` are explicit ABSOLUTE roots (D1):
 * a relative or absent root is refused (`USAGE`, exit 2) — never resolved
 * against the process cwd, never defaulted from module location.
 */
import { resolve } from 'node:path'
import { assertAbsoluteRoot, ScaffoldError } from './errors.js'

export interface ScaffoldArgs {
  readonly mode: 'plan' | 'apply'
  readonly projectName: string
  readonly slug: string
  readonly baseBranch: string
  readonly branchPrefix: string
  readonly worktreeRoot: string
  readonly targetRoot: string
  readonly templatesDir: string
  readonly preset?: string
  readonly projectKey?: string
  readonly dispatchQueue?: string
}

/** Token-shaped values: project keys, slugs, preset names. */
const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/
/** Display names: letters, digits, spaces, dot, underscore, dash. */
const DISPLAY_NAME = /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,63}$/
/** Branch names and prefixes: token plus `/` (never a leading dot). */
const BRANCH = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/
/** Relative directory roots (`.worktrees` is the canonical value). */
const RELATIVE_DIR = /^[A-Za-z0-9._][A-Za-z0-9._/-]{0,127}$/
/** Dispatch queue identity: account-id form (`557058:uuid`) or email-shaped. */
const DISPATCH_QUEUE = /^[A-Za-z0-9][A-Za-z0-9._:@+-]{0,127}$/

/**
 * Credential shapes refused at the input boundary. Independent patterns so a
 * change to one cannot silently widen another (STANDING-CONSTRAINTS #3
 * posture: each refusal axis is its own gate).
 */
const CREDENTIAL_PATTERNS: readonly RegExp[] = [
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}/,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{10,}/i,
  /\b(?:api[_-]?key|secret|password|passwd|token|credential)\s*[:=]\s*\S+/i,
]

const REDACTED = '[REDACTED]'

/** Masks any credential-shaped substring before it can reach a log or report. */
export function redact(text: string): string {
  let out = text
  for (const pattern of CREDENTIAL_PATTERNS) {
    out = out.replace(pattern, REDACTED)
  }
  return out
}

function assertNoCredential(fieldName: string, value: string): void {
  for (const pattern of CREDENTIAL_PATTERNS) {
    if (pattern.test(value)) {
      // The message names the field only — the value never appears anywhere.
      throw new ScaffoldError(
        'CREDENTIAL_INPUT_REFUSED',
        `argument --${fieldName} carries a credential-shaped value; credentials are refused at the input boundary (they must never reach logs, keys, or artifacts)`,
        [],
      )
    }
  }
}

function assertCharset(fieldName: string, value: string, allowed: RegExp): void {
  if (!allowed.test(value) || value.includes('..')) {
    throw new ScaffoldError(
      'VALUE_REFUSED',
      `argument --${fieldName} is outside its declared character allowlist and is refused`,
      [],
    )
  }
}

const VALUE_FLAGS = [
  'project-name',
  'slug',
  'base-branch',
  'branch-prefix',
  'worktree-root',
  'target',
  'templates',
  'preset',
  'project-key',
  'dispatch-queue',
] as const
type ValueFlag = (typeof VALUE_FLAGS)[number]

function isValueFlag(name: string): name is ValueFlag {
  return (VALUE_FLAGS as readonly string[]).includes(name)
}

/**
 * Parses argv (already stripped of node/script) into typed arguments.
 * Unknown flags, unknown positionals, missing values, and missing required
 * inputs are usage errors (exit 2) — a missing required input is a usage
 * error, never a guess. `--target` and `--templates` are required ABSOLUTE
 * roots (D1): relative or absent roots are refused typed, never resolved
 * against the process cwd or defaulted from module location.
 */
export function parseScaffoldArgs(argv: readonly string[]): ScaffoldArgs {
  let mode: 'plan' | 'apply' = 'plan'
  let modeSeen = false
  const values = new Map<ValueFlag, string>()

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string
    if (arg === 'plan' || arg === 'apply') {
      if (modeSeen) {
        throw new ScaffoldError(
          'USAGE',
          'usage: project-scaffold [plan|apply] --project-name <name> --slug <slug> --base-branch <branch> --branch-prefix <prefix> --worktree-root <path> --target <dir> --templates <dir> [--preset <name>] [--project-key <key>] [--dispatch-queue <id>]',
        )
      }
      mode = arg
      modeSeen = true
      continue
    }
    if (!arg.startsWith('--')) {
      throw new ScaffoldError(
        'USAGE',
        `unexpected argument '${redact(arg)}'; expected 'plan', 'apply', or a --flag`,
      )
    }
    const flag = arg.slice(2)
    if (!isValueFlag(flag)) {
      throw new ScaffoldError('USAGE', `unknown flag --${redact(flag)}`)
    }
    const value = argv[i + 1]
    if (value === undefined || value.startsWith('--')) {
      throw new ScaffoldError('USAGE', `flag --${flag} requires a value`)
    }
    if (values.has(flag)) {
      throw new ScaffoldError('USAGE', `flag --${flag} was supplied more than once`)
    }
    values.set(flag, value)
    i++
  }

  for (const [flag, value] of values) {
    assertNoCredential(flag, value)
  }

  const require = (flag: ValueFlag): string => {
    const value = values.get(flag)
    if (value === undefined) {
      throw new ScaffoldError('USAGE', `missing required argument --${flag}`)
    }
    return value
  }

  const projectName = require('project-name')
  const slug = require('slug')
  const baseBranch = require('base-branch')
  const branchPrefix = require('branch-prefix')
  const worktreeRoot = require('worktree-root')
  const targetArg = require('target')
  const templatesArg = require('templates')

  assertCharset('project-name', projectName, DISPLAY_NAME)
  assertCharset('slug', slug, TOKEN)
  assertCharset('base-branch', baseBranch, BRANCH)
  assertCharset('branch-prefix', branchPrefix, BRANCH)
  assertCharset('worktree-root', worktreeRoot, RELATIVE_DIR)

  // D1 explicit roots (P2b-i / D19 classes 1/5): --target and --templates are
  // absolute-or-refused inputs. A relative root would silently anchor every
  // derived path to the process cwd, and no root is ever defaulted from module
  // location — both are refused typed before any path is derived
  // (shaping/approval post-item-1 posture).
  assertAbsoluteRoot(targetArg, '--target')
  const targetRoot = resolve(targetArg)
  assertAbsoluteRoot(templatesArg, '--templates')
  const templatesDir = resolve(templatesArg)

  const preset = values.get('preset')
  if (preset !== undefined) assertCharset('preset', preset, TOKEN)
  const projectKey = values.get('project-key')
  if (projectKey !== undefined) assertCharset('project-key', projectKey, TOKEN)
  const dispatchQueue = values.get('dispatch-queue')
  if (dispatchQueue !== undefined) assertCharset('dispatch-queue', dispatchQueue, DISPATCH_QUEUE)

  return {
    mode,
    projectName,
    slug,
    baseBranch,
    branchPrefix,
    worktreeRoot,
    targetRoot,
    templatesDir,
    preset,
    projectKey,
    dispatchQueue,
  }
}
