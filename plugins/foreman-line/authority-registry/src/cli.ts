import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import type { ValidationResult } from './types.js'
import { sweepRegistrySources, validateRegistry } from './validate.js'

function emit(result: ValidationResult): void {
  process.stdout.write(`${JSON.stringify(result)}\n`)
}

function usage(message?: string): number {
  emit({
    valid: false,
    violations: [
      {
        code: 'USAGE_ERROR',
        message:
          message ??
          'usage: foreman-authority-registry validate <registry-path> | sweep <registry-path> --repo-root <path>',
      },
    ],
    summary: null,
  })
  return 2
}

function readDocument(path: string): { document?: unknown; result?: ValidationResult } {
  let content: string
  try {
    content = readFileSync(path, 'utf8')
  } catch (error) {
    return {
      result: {
        valid: false,
        violations: [
          { code: 'IO_ERROR', message: `cannot read '${path}': ${(error as Error).message}` },
        ],
        summary: null,
      },
    }
  }
  try {
    return { document: parse(content) as unknown }
  } catch (error) {
    return {
      result: {
        valid: false,
        violations: [
          { code: 'PARSE_ERROR', message: `cannot parse '${path}': ${(error as Error).message}` },
        ],
        summary: null,
      },
    }
  }
}

function run(argv: readonly string[]): number {
  const [command, registryPath, option, repoRoot, ...rest] = argv
  if (registryPath === undefined || rest.length > 0) return usage()
  if (command !== 'validate' && command !== 'sweep') return usage()
  if (command === 'validate' && (option !== undefined || repoRoot !== undefined)) return usage()
  if (command === 'sweep' && (option !== '--repo-root' || repoRoot === undefined)) return usage()
  const loaded = readDocument(registryPath)
  if (loaded.result !== undefined) {
    emit(loaded.result)
    return 2
  }
  const result =
    command === 'validate'
      ? validateRegistry(loaded.document)
      : sweepRegistrySources(loaded.document, repoRoot as string)
  emit(result)
  if (result.valid) return 0
  return result.violations.some(
    (violation) =>
      violation.code === 'IO_ERROR' ||
      violation.code === 'PARSE_ERROR' ||
      violation.code === 'USAGE_ERROR',
  )
    ? 2
    : 1
}

process.exitCode = run(process.argv.slice(2))
