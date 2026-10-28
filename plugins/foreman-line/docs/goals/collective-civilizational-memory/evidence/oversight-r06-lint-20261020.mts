// Local review harness only. No implementation, promotion, projection or receipts.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { join, resolve, relative, isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = 'D:/Repos/agent-skills'
const mirror = 'C:/Users/clint/AppData/Local/Temp/ccm-shaping-01a155c3'
const runner = 'C:/Users/clint/AppData/Local/npm-cache/_npx/fd45a72a545557e9/node_modules/tsx/dist/cli.mjs'
const evidence = join(root, 'plugins/foreman-line/docs/goals/collective-civilizational-memory/evidence')
const input = join(root, 'plugins/foreman-line/docs/specs/active/collective-civilizational-memory-foundation-2026-10-19-01a155c3.shaping-result.json')
let sourceFilesCompared = 0
function compareTree(ref: string) {
  for (const entry of readdirSync(join(root, ref), { withFileTypes: true })) {
    const child = `${ref}/${entry.name}`
    if (entry.isDirectory()) compareTree(child)
    else {
      assert.deepEqual(readFileSync(join(root, child)), readFileSync(join(mirror, child)), child)
      sourceFilesCompared++
    }
  }
}
for (const pkg of ['shaping', 'contracts', 'spec-linter', 'permission-profiles', 'schema-scaffold']) {
  compareTree(`plugins/foreman-line/${pkg}/src`)
}
const { readShapingResult, checkBodySections } = await import(pathToFileURL(join(mirror, 'plugins/foreman-line/shaping/src/index.ts')).href)
const { parseFrontmatter } = await import(pathToFileURL(join(mirror, 'plugins/foreman-line/spec-linter/src/index.ts')).href)
const original = readFileSync(input)
const payload = readShapingResult(input)
assert.equal(payload.parcelSpecRefs.length, 4)
assert.deepEqual(payload.epics, [])
assert.equal(new Set(payload.parcelSpecRefs).size, 4)
const results = []
const owned = new Map<string, string>()
for (const ref of payload.parcelSpecRefs) {
  assert.ok(!ref.includes('\\') && !isAbsolute(ref))
  const path = resolve(root, ref)
  assert.ok(!relative(root, path).startsWith('..'))
  const text = readFileSync(path, 'utf8')
  const fm = parseFrontmatter(text) as Record<string, unknown>
  assert.equal(fm.status, 'draft')
  const cli = spawnSync(process.execPath, [runner, join(mirror, 'plugins/foreman-line/spec-linter/src/cli.ts'), 'validate', '--repo-root', root, path], { encoding: 'utf8', timeout: 30000 })
  const body = checkBodySections(text)
  const section = text.split('## Allowed Files\n')[1]?.split('\n## ')[0] ?? ''
  const paths = [...section.matchAll(/^- `([^`]+)`/gm)].map(m => m[1])
  assert.ok(paths.length > 0)
  const repo = String(fm.ticket) === 'CCM-P1C' ? 'D:/Repos/keon-omega/keon.collective' : 'D:/Repos/keon-omega/keon-cortex'
  for (const file of paths) {
    assert.ok(!isAbsolute(file) && !file.includes('..') && !/[?*{}]/.test(file), file)
    const key = `${repo}/${file}`
    assert.equal(owned.has(key), false, `collision ${key}`)
    owned.set(key, String(fm.ticket))
  }
  assert.equal(cli.status, 0, cli.stderr)
  assert.equal(body.valid, true, JSON.stringify(body))
  results.push({ ref, ticket: fm.ticket, cliExit: cli.status, cliStdout: cli.stdout, cliStderr: cli.stderr, body, bytes: Buffer.byteLength(text), allowedFiles: paths.map(file => ({ file, existsAtReview: existsSync(join(repo, file)) })), status: fm.status, risk: fm.risk, routingClass: fm.routing_class })
}
assert.deepEqual(readFileSync(input), original)
const sourceObservations = [root, 'D:/Repos/keon-omega/keon-cortex', 'D:/Repos/keon-omega/keon.collective'].map(repo => {
  function git(args: string[]) {
    const result = spawnSync('git', ['-C', repo, '-c', 'core.fsmonitor=false', ...args], { encoding: 'utf8', timeout: 30000 })
    assert.equal(result.status, 0, result.stderr)
    return result.stdout.trimEnd()
  }
  return { repo, head: git(['rev-parse', 'HEAD']), branch: git(['branch', '--show-current']), status: git(['status', '--short', '--untracked-files=normal']) }
})
const report = {
  observedAt: new Date().toISOString(), node: process.version,
  scope: 'Mechanical coordinator checks only; not independent review, Gate 1/2 approval or implementation acceptance',
  sourceFilesCompared, mirrorSourceByteIdentical: true, sourceObservations,
  dependencyMode: 'Existing isolated dependency mirror; no installs or checkout node_modules mutations',
  shapingResult: { path: input, schemaValid: true, refs: 4, epics: 0, inputUnchanged: true },
  exactAllowedFileCount: owned.size, interParcelMutationCollisions: [], results,
}
const evidenceName = 'oversight-r06-lint-20261020.json'
writeFileSync(join(evidence, evidenceName), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ observedAt: report.observedAt, sourceFilesCompared: report.sourceFilesCompared, mirrorSourceByteIdentical: report.mirrorSourceByteIdentical, exactAllowedFileCount: report.exactAllowedFileCount, interParcelMutationCollisions: report.interParcelMutationCollisions, results: report.results.map(r => ({ticket:r.ticket,cliExit:r.cliExit,body:r.body,status:r.status})) }, null, 2))
