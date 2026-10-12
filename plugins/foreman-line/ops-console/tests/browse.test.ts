import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { type BrowseRefusalError, browseDirectory } from '../src/browse.js'

/**
 * FCA-P2 sandboxed filesystem browse: one level per call, absolute paths only,
 * symlinks never followed (entries listed as `other`, symlinked browse roots
 * refused typed), no file contents in any response shape.
 */

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'browse-'))
  mkdirSync(join(root, 'repo-a', '.git'), { recursive: true })
  mkdirSync(join(root, 'plain-dir'))
  writeFileSync(join(root, 'notes.md'), '# contents must never be returned\n')
  symlinkSync(join(root, 'plain-dir'), join(root, 'link-to-dir'))
  return root
}

function refusalOf(fn: () => unknown): BrowseRefusalError {
  try {
    fn()
  } catch (error) {
    return error as BrowseRefusalError
  }
  throw new Error('expected a typed browse refusal')
}

test('browse lists exactly one level: dirs first with git-work-tree flags, files after', () => {
  const root = fixture()
  const listing = browseDirectory(root)
  assert.equal(listing.path, root)
  assert.deepEqual(listing.entries, [
    { name: 'plain-dir', type: 'dir', gitWorkTree: false },
    { name: 'repo-a', type: 'dir', gitWorkTree: true },
    { name: 'notes.md', type: 'file', gitWorkTree: false },
    { name: 'link-to-dir', type: 'other', gitWorkTree: false },
  ])
})

test('browse entries carry names and types only — never file contents', () => {
  const root = fixture()
  for (const entry of browseDirectory(root).entries) {
    assert.deepEqual(Object.keys(entry).sort(), ['gitWorkTree', 'name', 'type'])
    assert.ok(!JSON.stringify(entry).includes('contents must never'))
  }
})

test('symlinks are never followed: symlinked entries are opaque, symlinked roots refused', () => {
  const root = fixture()
  // A symlinked directory entry lists as `other` and shows no work tree even
  // though its target is one — proof the entry was not traversed.
  const link = browseDirectory(root).entries.find((entry) => entry.name === 'link-to-dir')
  assert.equal(link?.type, 'other')
  assert.equal(link?.gitWorkTree, false)
  assert.equal(refusalOf(() => browseDirectory(join(root, 'link-to-dir'))).reason, 'path-symlink')
})

test('typed refusals: relative path, absent path, non-directory', () => {
  const root = fixture()
  assert.equal(refusalOf(() => browseDirectory('relative/path')).reason, 'path-not-absolute')
  assert.equal(refusalOf(() => browseDirectory(join(root, 'missing'))).reason, 'path-absent')
  assert.equal(refusalOf(() => browseDirectory(join(root, 'notes.md'))).reason, 'not-a-directory')
})
