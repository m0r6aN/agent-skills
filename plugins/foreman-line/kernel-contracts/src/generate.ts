/**
 * CLI generation entry (`npm run generate`) — an explicit build operation.
 *
 * Writes exactly the eight schema destinations listed in the F05 Allowed
 * Files ceiling (`schemas/<name>.schema.json`), byte-identically on repeated
 * runs. The only cross-package import is the existing schema-scaffold
 * generation helper, through its reviewed relative export (source-time ESM
 * relative import; no workspace linking).
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generate } from '../../schema-scaffold/src/generate.js'
import { allSchemaFiles } from './schemas.js'

const here = dirname(fileURLToPath(import.meta.url))
generate(allSchemaFiles, join(here, '..', 'schemas'))
