import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

test('runtime dependency set and versions are exact', () => {
  const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>
  }
  assert.deepEqual(packageJson.dependencies, {
    ajv: '8.20.0',
    typescript: '7.0.2',
    yaml: '2.9.0',
  })
})
