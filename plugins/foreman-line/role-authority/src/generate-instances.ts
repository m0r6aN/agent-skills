/**
 * Serializes the ratified F3 instance data (`src/instances.ts`) to
 * `instances/*.json`, mirroring `generate.ts`'s schema-serialization pattern
 * but for committed instance data rather than JSON Schemas. Reuses
 * `schema-scaffold`'s `serialize` (plain `JSON.stringify(x, null, 2) + '\n'`)
 * since that helper is generic over any JSON-serializable value, not
 * specific to schemas.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export { serialize } from '../../schema-scaffold/src/generate.js'

import { serialize } from '../../schema-scaffold/src/generate.js'
import {
  familyDiversityRules,
  roleAuthorityByRole,
  selfSerializationPointOwnership,
} from './instances.js'

const here = dirname(fileURLToPath(import.meta.url))
const instancesDir = join(here, '..', 'instances')

function generateInstances(): void {
  mkdirSync(instancesDir, { recursive: true })
  writeFileSync(
    join(instancesDir, 'role-authority-by-role.json'),
    serialize(roleAuthorityByRole),
    'utf8',
  )
  writeFileSync(
    join(instancesDir, 'family-diversity-rules.json'),
    serialize(familyDiversityRules),
    'utf8',
  )
  writeFileSync(
    join(instancesDir, 'serialization-point-ownership.json'),
    serialize(selfSerializationPointOwnership),
    'utf8',
  )
  console.log(`generated 3 instance files in ${instancesDir}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateInstances()
}

export { generateInstances }
