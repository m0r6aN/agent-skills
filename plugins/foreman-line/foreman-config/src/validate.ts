/**
 * `validateForemanConfig`: the one exported validation entry point for a
 * `foreman/config.yaml` DOCUMENT. Every invariant (four required closed
 * groups, the conditional `stack:` shape, nullable-but-required identity
 * keys, capability value shape, the risk enum) is schema-enforced — no
 * hand-written semantic layer.
 *
 * Boundary discipline (spec Constraint 8): this is a document validator. It
 * takes an already-read document (or, via `parseForemanConfigYaml`, raw
 * text a CALLER read from an EXPLICITLY supplied path). It never resolves a
 * config location itself — no `process.cwd()`, no `__dirname` walking — and
 * it never stats the filesystem for declared layout paths (D28b disk
 * semantics are P4's).
 */
import { Ajv, type SchemaObject } from 'ajv'
import { parse } from 'yaml'
import { foremanConfigSchema } from './schemas.js'

export interface ValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}

const ajv = new Ajv({ allErrors: true })
const validateStructure = ajv.compile(foremanConfigSchema as SchemaObject)

export function validateForemanConfig(doc: unknown): ValidationResult {
  const errors: string[] = []

  const structurallyValid = validateStructure(doc)
  if (!structurallyValid) {
    for (const err of validateStructure.errors ?? []) {
      const path = err.instancePath.length > 0 ? err.instancePath : '(root)'
      // ajv's default additionalProperties message omits the offending key;
      // name it, so an unknown-key rejection tells the reader WHICH key.
      const unknownKey =
        err.keyword === 'additionalProperties' && typeof err.params.additionalProperty === 'string'
          ? ` ('${err.params.additionalProperty}')`
          : ''
      errors.push(`${path} ${err.message ?? 'is invalid'}${unknownKey}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Parses a `foreman/config.yaml` document with duplicate-key rejection
 * explicitly configured (mirrors skill-injection). Throws `YAMLParseError`
 * on invalid input; callers (the CLI) decide the exit code. The raw text
 * arrives from the caller — this function does no path resolution or I/O.
 */
export function parseForemanConfigYaml(raw: string): unknown {
  return parse(raw, { uniqueKeys: true })
}
