import assert from 'node:assert/strict';
import fs from 'node:fs';
import cp from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {parse} from 'yaml';
import {validateRegistry,canonicalJson,sha256,bindingDigestFor,registryBindingManifestDigest} from './src/validate.ts';
const root='D:/Repos/agent-skills-worktrees/fk-p0-r31-source-adoption-20260907';
const full=parse(fs.readFileSync('authority-enforcement-registry.yaml','utf8'));
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,maxBuffer:32*1024*1024});
const old=parse(git('show','c35ff72ef45fb19d647cede6acf5a13636911db7:plugins/foreman-line/authority-registry/authority-enforcement-registry.yaml').toString());
const results=[];
assert.equal(canonicalJson(full.reconciliations.slice(0,20)),canonicalJson(old.reconciliations));
assert.deepEqual(full.operationAuthority,old.operationAuthority);
assert.deepEqual(full.volatileRegions,old.volatileRegions);
assert.deepEqual(full.rules.filter(x=>x.decision==='ALLOW'),old.rules.filter(x=>x.decision==='ALLOW'));
assert.equal(registryBindingManifestDigest(full),'605f9c370c62cdbf619d1f65583a2404311d69cfc8c0fcc7c7867959b4adf4d5');
assert.equal(sha256(canonicalJson(full.reconciliations.at(-1))),'73b921477e09f2bcf20c4cf27d182221746c6cd85e2948a82f573e465177bf33');
for(const s of full.sources) assert.equal(sha256(git('show',`${full.sourceSnapshotCommit}:${s.path}`)),s.snapshotEvidence.fullFileSha256);
const base=validateRegistry(full,{repoRoot:root});assert.equal(base.valid,true,JSON.stringify(base.violations));results.push({name:'actual repository baseline and 18 source blobs',valid:base.valid});
function repair(d){for(const r of d.rules)r.bindingDigest=bindingDigestFor(r);for(const e of d.reconciliations.at(-1).observedEvidence){if(e.kind!=='command-result')continue;const c=JSON.parse(e.reference);if(c.commandId.startsWith('superseding-binding-manifest')){c.resultDigest=registryBindingManifestDigest(d);e.reference=canonicalJson(c);e.digest=sha256(e.reference);}}}
function reject(name,mutate,code,pattern){const d=structuredClone(full);mutate(d);repair(d);const r=validateRegistry(d);assert.equal(r.valid,false,name);assert.ok(r.violations.some(x=>x.code===code&&pattern.test(x.message)),name+JSON.stringify(r.violations));results.push({name,violations:r.violations});}
for(const [a,b] of [['Plugin/marketplace parcels','All parcels'],['each living install identifier','one install identifier'],['declared marketplace entry','repository URL'],['existing plugin source','possible plugin source'],['nested manifest name equals the requested plugin','nested manifest name resembles the requested plugin'],['does not prove','proves']])reject('repaired M01 '+a,d=>{const i=d.sources.find(s=>s.sourceId==='standing-constraints').inventoryItems.find(i=>i.itemId==='item.constraint-14');const r=d.rules.find(r=>r.ruleId==='rule.standing-constraints.constraint-14');i.normalizedExcerpt=i.normalizedExcerpt.replace(a,b);i.valueDigest=sha256(i.normalizedExcerpt);r.normalizedStatement=i.normalizedExcerpt;r.sourceRefs[0].valueDigest=i.valueDigest;r.authorityBasisRef.valueDigest=i.valueDigest;},'AUTHORITY_ESCALATION',/R31/);
for(const k of ['commandId','inputDigest','resultDigest','actorClass','tool','toolVersion','exitCode'])reject('repaired diagnostic '+k,d=>{const e=d.reconciliations.at(-1).observedEvidence.find(e=>e.kind==='command-result'&&JSON.parse(e.reference).commandId==='r31-plan-decision-git-blob');const c=JSON.parse(e.reference);c[k]=k==='exitCode'?1:k.endsWith('Digest')?'f'.repeat(64):'substituted';e.reference=canonicalJson(c);e.digest=sha256(e.reference);},'MIGRATION_EVIDENCE_INVALID',/R31/);
for(const mode of ['missing','duplicate'])reject(mode+' diagnostic',d=>{const h=d.reconciliations.at(-1);const e=h.observedEvidence.find(e=>e.kind==='command-result'&&JSON.parse(e.reference).commandId==='r31-plan-decision-git-blob');h.observedEvidence=mode==='missing'?h.observedEvidence.filter(x=>x!==e):[...h.observedEvidence,structuredClone(e)];},'MIGRATION_EVIDENCE_INVALID',/R31/);
reject('assurance fallback',d=>{d.rules.find(r=>r.ruleId==='rule.standing-constraints.constraint-14').assurance='independently-verified';},'AUTHORITY_ESCALATION',/R31/);
// Read-only in-memory transport fault: actual Git replacement is covered by inspected corpus test.
const original=cp.execFileSync;let hits=0;cp.execFileSync=function(command,args,options){if(command==='git'&&args[0]==='cat-file'&&args[1]==='blob'&&String(args[2]).endsWith('R31-coordinator-decision-20260907.md')){hits++;return Buffer.from('substituted decision bytes');}return original(command,args,options);};syncBuiltinESMExports();
try{const r=validateRegistry(full,{repoRoot:root});assert.equal(hits,1);assert.ok(r.violations.some(x=>x.code==='MIGRATION_EVIDENCE_INVALID'&&/R31 plan decision actual Git-blob/.test(x.message)));results.push({name:'in-memory Git blob transport substitution with untouched diagnostic',hits,violations:r.violations});}finally{cp.execFileSync=original;syncBuiltinESMExports();}
console.log(JSON.stringify({node:process.version,checks:results.length,results},null,2));
