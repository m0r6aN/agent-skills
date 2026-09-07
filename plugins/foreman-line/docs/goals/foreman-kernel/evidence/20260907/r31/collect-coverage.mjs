import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
const evidence = resolve(process.cwd(), '../docs/goals/foreman-kernel/evidence/20260907/r31')
const log = readFileSync(join(evidence,'36-full-test.log'),'utf8')
const metadata = JSON.parse(readFileSync(join(evidence,'36-full-test.metadata.json'),'utf8'))
assert.equal(metadata.directExit,0)
assert.match(log,/DIRECT_EXIT=0\s*$/)
const actual = Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(key=>[key,[...log.matchAll(new RegExp('^# '+key+' (\\d+)\\s*$','gm'))].reduce((sum,match)=>sum+Number(match[1]),0)]))
assert.deepEqual(actual,{tests:751,pass:751,fail:0,cancelled:0,skipped:0,todo:0})
const names = [...log.matchAll(/^ok \d+ - (.+)\r?$/gm)].map(match=>match[1].trim())
assert.equal(names.length,751)
const baseline = JSON.parse(readFileSync(resolve(evidence,'../r30/final-test-coverage.json'),'utf8')).names
assert.equal(baseline.length,686)
const titleMigrations = {
  'standing constraints inventory contains all thirteen atomic numbered rules':'standing constraints inventory contains all fourteen atomic numbered rules',
  'AC4 O4 residual, stated and not disguised: a head git-commit digest is not independently checkable':'AC4 O4 hermetic residual remains explicit for a generic nonreserved successor Git digest',
}
const remaining=[...names]
for(const name of baseline){const migrated=titleMigrations[name]??name;const index=remaining.indexOf(migrated);assert.notEqual(index,-1,'missing prior control: '+name);remaining.splice(index,1)}
assert.equal(remaining.length,65)
assert(remaining.every(name=>name.startsWith('R31 ')))
const result={codeCheckpoint:metadata.checkpoint,acceptedRun:'36-full-test.log',retainedFailure:'28-full-test.log',expected:{baseline:686,semanticAdditions:54,corpusAdditions:11,total:751},actual,titleMigrations,baselineMeaning:'All prior named controls retained, with the two documented title migrations and the exact test-subject preservation reviewed in R31 ruling. Shared live helpers remain live.',names,newControlNames:remaining}
writeFileSync(join(evidence,'final-test-coverage.json'),JSON.stringify(result,null,2)+'\n')
process.stdout.write(JSON.stringify({actual,retainedBaseline:686,newControls:65})+'\n')