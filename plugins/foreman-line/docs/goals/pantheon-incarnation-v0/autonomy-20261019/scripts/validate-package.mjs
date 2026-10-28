import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
const m=read('mandate.json'),r=read('model-registry.json'),q=read('queue.json');
assert.equal(m.status,'PROPOSED');assert.equal(m.ratificationRef,null);assert.equal(m.authorityGrantRef,null);
assert.equal(m.spending.newAllowance+m.spending.priorUncertaintyHold,m.spending.totalExposureEnvelope);
assert(m.spending.bootstrapAllowance<=m.spending.newAllowance);assert.equal(m.concurrency.paidRequests,1);assert.equal(m.limits.transportRetries,0);assert.equal(m.limits.reviewContinuations,0);
const seen=new Set();for(const p of q.parcels){assert(!seen.has(p.id));for(const d of p.dependsOn)assert(seen.has(d),`${p.id} dependency ${d}`);assert.equal(p.status,'pending');assert.equal(p.specRef,null);seen.add(p.id);}
for(const model of r.models){assert(model.source.startsWith('https://'));assert(model.observedAtUtc);assert(model.contextTokens>model.maxOutputTokens);assert(model.pricing.input>0&&model.pricing.output>0);assert(model.usageLimitations.length);}
assert(r.accounts.every(a=>!a.approved&&!a.qualification.apiCredentialBound&&!a.qualification.liveQualified));
const required=['README.md','RATIFICATION.md','EVIDENCE.md','MANDATE.md','CHARTER.md','WORKFLOW-AMENDMENTS.md','RUNTIME-PATH.md','OWNERSHIP.md','MODEL-ACCOUNTING.md','QUEUE.md','LOOP.md','DOGFOOD.md','BOOTSTRAP.md'];
for(const file of required){const txt=fs.readFileSync(path.join(dir,file),'utf8');assert(txt.length>200,file);for(const match of txt.matchAll(/\]\(([^)]+)\)/g)){const target=match[1];if(/^(https?:|[A-Z]:|#)/.test(target))continue;const clean=target.split('#')[0];assert(fs.existsSync(path.resolve(dir,clean)),`${file}: broken local link ${target}`);}}
const prototype=read('prototypes/direct-review/verification.json');assert.equal(prototype.externalProviderRequests,0);assert.equal(prototype.observedResult.failed,0);
for(const f of prototype.sourceFiles){const b=fs.readFileSync(path.join(dir,'prototypes/direct-review',f.path));assert.equal(b.length,f.bytes);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),f.sha256);}
console.log(JSON.stringify({status:'PASS',kind:'offline-package-integrity',queueParcels:q.parcels.length,models:r.models.length,prototypeTestsRecorded:prototype.observedResult.passed,liveExecutionVerified:false,ratified:false},null,2));
