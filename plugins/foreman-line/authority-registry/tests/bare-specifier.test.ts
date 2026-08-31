import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function filesUnder(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name)
    return entry.isDirectory() ? filesUnder(child) : [child]
  })
}

test('source uses no bare Foreman package specifier or workspace linkage', () => {
  for (const path of filesUnder(join(packageRoot, 'src')).filter(
    (item) => extname(item) === '.ts',
  )) {
    const content = readFileSync(path, 'utf8')
    assert.doesNotMatch(content, /from\s+['"]@foreman-line\//, path)
  }
  const packageJson = readFileSync(join(packageRoot, 'package.json'), 'utf8')
  assert.doesNotMatch(packageJson, /workspace:|file:/)
})
