/**
 * `foreman-config validate <path>` — thin wrapper over
 * `validateForemanConfig`. The config path arrives as an EXPLICIT argument
 * — there is no default, no `process.cwd()` fallback, no `__dirname`
 * walking (spec Constraint 8 / D19 discipline).
 *
 * Exit-code contract (PCC-P0):
 *   0  valid document
 *   1  validation failure (every violation on stderr, not just the first)
 *   2  usage error (missing path argument, unreadable path, unknown
 *      command, or unparsable YAML — including duplicate keys; mirrors the
 *      sibling skill-injection/spec-linter CLIs)
 */
import { readFileSync } from 'node:fs'
import { parseForemanConfigYaml, validateForemanConfig } from './validate.js'

function run(argv: readonly string[]): number {
  const [command, path] = argv
  if (command !== 'validate' || path === undefined) {
    process.stderr.write('usage: foreman-config validate <path>\n')
    return 2
  }

  let raw: string
  try {
    raw = readFileSync(path, 'utf8')
  } catch (err) {
    process.stderr.write(`error: cannot read '${path}': ${(err as Error).message}\n`)
    return 2
  }

  let doc: unknown
  try {
    doc = parseForemanConfigYaml(raw)
  } catch (err) {
    process.stderr.write(`error: cannot parse '${path}' as YAML: ${(err as Error).message}\n`)
    return 2
  }

  const result = validateForemanConfig(doc)
  if (!result.valid) {
    for (const message of result.errors) {
      process.stderr.write(`${message}\n`)
    }
    return 1
  }
  return 0
}

process.exitCode = run(process.argv.slice(2))
