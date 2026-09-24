/**
 * P2b-i AC7 (R5) — gate.ts survivor proven by RELOCATION, never by comment.
 *
 * The copied-tree proof: `gate.ts` + `types.ts` + `config/project-allowlist.json`
 * are COPIED to a different absolute path, the copied allowlist is given a
 * sentinel key the real allowlist has never contained, and the copied module
 * is imported by a real subprocess whose cwd is a FOREIGN directory. If
 * `ALLOWLIST_PATH` derived from anything but the module's own location (cwd,
 * a repo root, the original tree), the sentinel would not appear.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const tsxCli = join(PACKAGE_ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs')

test('P2b-AC7 (R5): gate.ts resolves its OWN copied allowlist from a copied tree run at a foreign cwd', () => {
  // The copy lives under the package root so the subprocess can resolve
  // devDependencies via ancestor node_modules — its ABSOLUTE PATH and the
  // subprocess cwd are both different from the original module's.
  const copyRoot = mkdtempSync(join(PACKAGE_ROOT, 'reloc-'))
  const foreignCwd = mkdtempSync(join(tmpdir(), 'foreign-cwd-'))
  try {
    mkdirSync(join(copyRoot, 'src'), { recursive: true })
    mkdirSync(join(copyRoot, 'config'), { recursive: true })
    cpSync(join(PACKAGE_ROOT, 'src', 'gate.ts'), join(copyRoot, 'src', 'gate.ts'))
    cpSync(join(PACKAGE_ROOT, 'src', 'types.ts'), join(copyRoot, 'src', 'types.ts'))
    const allowlist = JSON.parse(
      readFileSync(join(PACKAGE_ROOT, 'config', 'project-allowlist.json'), 'utf8'),
    ) as { allowedProjectKeys: string[] }
    // Sentinel the REAL allowlist has never contained.
    allowlist.allowedProjectKeys.push('RELOCPROOF')
    writeFileSync(
      join(copyRoot, 'config', 'project-allowlist.json'),
      JSON.stringify(allowlist, null, 2),
      'utf8',
    )
    const probe = join(copyRoot, 'probe.ts')
    writeFileSync(
      probe,
      `import { ALLOWED_PROJECT_KEYS } from './src/gate.js'\nconsole.log([...ALLOWED_PROJECT_KEYS].join(','))\n`,
      'utf8',
    )
    const result = spawnSync(process.execPath, [tsxCli, probe], {
      cwd: foreignCwd, // FOREIGN cwd — nothing here resembles a repo
      encoding: 'utf8',
    })
    assert.equal(result.status, 0, result.stderr)
    assert.ok(
      result.stdout.includes('RELOCPROOF'),
      "the gate must load the COPIED tree's own allowlist (module self-location), not the original or anything cwd-derived",
    )
  } finally {
    rmSync(copyRoot, { recursive: true, force: true })
    rmSync(foreignCwd, { recursive: true, force: true })
  }
})
