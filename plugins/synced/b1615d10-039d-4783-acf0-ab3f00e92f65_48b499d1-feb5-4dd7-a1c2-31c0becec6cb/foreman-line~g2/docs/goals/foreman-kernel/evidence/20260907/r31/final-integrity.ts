import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { parse } from '../../../../../../authority-registry/node_modules/yaml/dist/index.js'
import { canonicalJson, sha256, registryBindingManifestDigest } from '../../../../../../authority-registry/src/validate.js'
import type { AuthorityEnforcementRegistry } from '../../../../../../authority-registry/src/types.js'
const pkg = process.cwd()
const root = resolve(pkg, '../../..')
const evidence = resolve(pkg, '../docs/goals/foreman-kernel/evidence/20260907/r31')
const checkpoint = process.argv[2]
assert.match(checkpoint ?? '', /^[a-f0-9]{40}$/)
const sourceCommit = '8d500704c9e3d6d8b652bbe838aa3623f88203fc'
const prefix = 'plugins/foreman-line/authority-registry/'
const git = (...args: string[]) => execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 })
const full = parse(readFileSync(join(pkg, 'authority-enforcement-registry.yaml'), 'utf8')) as AuthorityEnforcementRegistry
const prior = parse(git('show', '446700d47c2e162fcfa575d5a46b9247241a59c1:' + prefix + 'authority-enforcement-registry.yaml').toString('utf8')) as AuthorityEnforcementRegistry
const oracle = JSON.parse(readFileSync(join(evidence, '09-exact-migration-proposal.json'), 'utf8'))
assert.deepEqual([full.sources.length, full.sources.reduce((n,s)=>n+s.inventoryItems.length,0), full.rules.length,full.normativeMarkdownAudit.length,full.reconciliations.length], [18,1585,542,202,21])
assert.equal(full.sourceSnapshotCommit, sourceCommit)
assert.equal(registryBindingManifestDigest(full), oracle.newManifest)
assert.equal(sha256(canonicalJson(full.reconciliations[20])), oracle.proposedRecordCanonicalSha256)
assert.equal(canonicalJson(full.reconciliations.slice(0,20)), canonicalJson(prior.reconciliations))
const sourceFiles = full.sources.map(source => {
  const workingSha256 = sha256(readFileSync(join(root,source.path)))
  const committedSha256 = sha256(git('show',sourceCommit+':'+source.path))
  assert.equal(workingSha256, committedSha256, source.path)
  assert.equal(workingSha256, source.snapshotEvidence.fullFileSha256,source.path)
  return {path:source.path,workingSha256,committedSha256}
})
const allowed = ['README.md','src/generate.ts','src/registry.ts','src/validate.ts','authority-enforcement-registry.yaml','tests/fixtures/pass-minimal.yaml','tests/semantic-invariants.test.ts','tests/corpus-sweep.test.ts','tests/parity.test.ts']
const packagePaths = git('ls-tree','-r','--name-only',checkpoint,'--',prefix).toString('utf8').trim().split('\n')
const packageFiles = packagePaths.map(path => {
  const workingSha256=sha256(readFileSync(join(root,path)))
  const testedCommitSha256=sha256(git('show',checkpoint+':'+path))
  assert.equal(workingSha256,testedCommitSha256,path)
  if(!allowed.includes(path.slice(prefix.length))) assert.equal(workingSha256,sha256(git('show','2ed7569afae2ea23e77c4279b5cee86709814595:'+path)),path)
  return {path,workingSha256,testedCommitSha256}
})
const generated = ['README.md','authority-enforcement-registry.yaml','tests/fixtures/pass-minimal.yaml'].map(path=>({path,sha256:sha256(readFileSync(join(pkg,path)))}))
const result = {sourceCommit,codeCheckpoint:checkpoint,counts:oracle.counts,bindingManifest:oracle.newManifest,reconciliationPin:oracle.proposedRecordCanonicalSha256,historicalRecordPins:prior.reconciliations.map(record=>({id:record.reconciliationId,sha256:sha256(canonicalJson(record))})),sourceFiles,packageFiles,generated,scope:'Only nine approved package paths; all other package and eighteen source bytes preserved'}
writeFileSync(join(evidence,'final-integrity.json'),JSON.stringify(result,null,2)+'\n')
process.stdout.write(JSON.stringify(result,null,2)+'\n')