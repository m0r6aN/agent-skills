import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generate } from '../../schema-scaffold/src/generate.js'
import type { SchemaFile } from '../../schema-scaffold/src/registry.js'
import { contractReaderEntrySchema } from './schema.js'

export { serialize } from '../../schema-scaffold/src/generate.js'

/** This package's one committed schema — the contract-reader-entry shape. */
export const allSchemaFiles: readonly SchemaFile[] = [
  { name: 'contract-reader-entry', schema: contractReaderEntrySchema },
]

const here = dirname(fileURLToPath(import.meta.url))
const schemasDir = join(here, '..', 'schemas')

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generate(allSchemaFiles, schemasDir)
}
