// Independent R2 safety evidence: pure parsers/guards and the explicitly authorized read-only lock probe only.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as guards from '../bootstrap-guards.mjs';
import {inspectNativeCapture} from '../native-sender/native-sender.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(here);
const bytes=ref=>fs.readFileSync(path.resolve(root,ref));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const json=ref=>JSON.parse(bytes(ref).toString('utf8').replace(/^\uFEFF/,''));
const now=Date.now();
assert.equal(hash(bytes('rework1-verification.json')),'55c1c2124cc2c3e34ccb81e58d9d944e91e06ff9745ab5b4848a4c8e4d6d1cad');
const built=json('rework1-verification.json');
for(const item of built.files)assert.equal(hash(bytes(item.path)),item.sha256,item.path);
for(const item of built.preservedOriginals)assert.equal(hash(bytes(item.path)),item.sha256,item.path);
const codeRefs=[...new Set([...guards.CHECKED_CODE,...Object.keys(guards.PINS)])];
const blobs=Object.fromEntries(codeRefs.map(ref=>[ref,bytes(ref)]));
for(const[ref,expected]of Object.entries(guards.PINS))assert.equal(hash(blobs[ref]),expected,ref);
const seal=json('../autonomy-20261019/package-manifest.json'),members={};
for(const item of seal.files){const b=bytes('../autonomy-20261019/'+item.path);assert.equal(b.length,item.bytes);assert.equal(hash(b),item.sha256,item.path);members[item.path]=b;}
const packet=json('amended-plan-review-r2/manifest.json'),sources={};
for(const item of packet.files){const b=fs.readFileSync(item.file);assert.equal(b.length,item.bytes);assert.equal(hash(b),item.sha256,item.label);sources[item.file]=b;}
assert.equal(guards.verifyPinnedBundle(blobs,members,sources),true);
const rat=json('owner-ratification.json');
const rawRecord=fs.readFileSync(rat.ratification.transcript,'utf8').split(/\r?\n/)[rat.ratification.line-1];
assert.equal(guards.verifyRatification(bytes('owner-ratification.json'),rawRecord),true);
const rate=guards.validateRates(bytes('bootstrap-rate-evidence.json'),bytes('../autonomy-20261019/model-registry.json'),now);
const attempts={};
for(const ref of ['attempt-specs/qualification-r2.json','attempt-specs/plan-review-r2.json']){
 const cfg=json(ref),bound=guards.validateAttemptInput(ref,bytes(ref),bytes(cfg.requestRef));
 const parsed=inspectNativeCapture(Buffer.alloc(0),bound.expected);
 assert.equal(parsed.error,'HTTP_HEADERS_INCOMPLETE'); // Expectations accepted before any hypothetical send.
 attempts[cfg.purpose]={requiredCoverage:bound.expected.requiredCoverage.length,reservation:guards.assessBudget(cfg,[],rate).reservedExposureUsd};
}
assert.equal(attempts['plan-review'].requiredCoverage,14);
assert.equal(attempts.qualification.reservation,4.71);assert.equal(attempts['plan-review'].reservation,5.34);
const active=json('activation.json'),owner=json('bootstrap-owner.json'),account=json(active.accountMetadataRef),accountRoot=path.dirname(active.accountMetadataRef);
assert.equal(account.credentialBindingCiphertextSha256,'fcae35dc9300adce2ae37a38e5d8a0cb3184e489064b074138d78ef11c611d12');
const metadataEvidence={transportBytes:bytes(accountRoot+'/transport.json'),organizationBytes:bytes(accountRoot+'/organization.json'),modelsBytes:bytes(accountRoot+'/models.json')};
const held=execFileSync('C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',['-NoProfile','-File',path.join(root,'bootstrap-lock-check.ps1'),'-OwnerFile',path.join(root,'bootstrap-owner.json'),'-LockFile',path.join(root,'bootstrap-owner.lock')],{encoding:'utf8',timeout:3000,maxBuffer:1024,windowsHide:true});
assert.equal(held,'HELD');
const authority={state:active,owner,account,metadataEvidence,lockHeld:true,nowMs:now,purpose:'qualification',releaseExists:fs.existsSync(path.join(root,'bootstrap-release.json')),revocationExists:fs.existsSync(path.join(root,'bootstrap-revocation.json'))||fs.existsSync(path.join(root,'revocation.json')),closedExists:fs.existsSync(path.join(root,'bootstrap-closed.json'))};
assert.ok(guards.validateAuthority(authority).expiryMs>now);
assert.throws(()=>guards.validateAuthority({...authority,purpose:'plan-review'}),/LIVE_QUALIFICATION_REQUIRED/);
const expected={model:'claude-opus-5-5',maxTokens:4096,requiredCoverage:['synthetic-transport']};
const event=(type,fields={})=>`event: ${type}\ndata: ${JSON.stringify({type,...fields})}\n\n`;
const review={reviewText:'This independent fabricated response verifies bounded transport parsing and conservative usage accounting. It contains no live-provider observations and does not review any implementation or grant authority.',verdict:'pass',findings:[],coverage:['synthetic-transport'],limitations:['Independent synthetic case only.']};
const capture=({text=JSON.stringify(review),tail='',final={output_tokens:200}}={})=>Buffer.from('HTTP/1.1 200 OK\r\ncontent-type: text/event-stream\r\nrequest-id: req_independent_r2\r\n\r\n'+event('message_start',{message:{type:'message',role:'assistant',id:'msg_r2',model:expected.model,content:[],usage:{input_tokens:90,output_tokens:1}}})+event('content_block_start',{index:0,content_block:{type:'text',text:''}})+event('content_block_delta',{index:0,delta:{type:'text_delta',text}})+event('content_block_stop',{index:0})+event('message_delta',{delta:{stop_reason:'end_turn'},usage:final})+event('message_stop')+tail);
const transport={exitCode:0,reason:null,statusCode:200,redirects:0,connections:1};
const cases=[];
for(const [id,options,trust,usable]of [
 ['strict-valid',{},true,true],
 ['trailing-malformed',{tail:'event: ping\ndata: not-json\n\n'},false,false],
 ['missing-terminal-usage',{final:{}},false,true],
 ['invalid-review',{text:'{}'},true,false],
 ['contradictory-usage',{final:{output_tokens:0}},false,false],
]){
 const parsed=inspectNativeCapture(capture(options),expected),phase=guards.classifyCapture(transport,parsed,null,expected,rate,4.71);
 assert.equal(phase.finalUsageTrusted,trust,id);assert.equal(phase.reviewUsable,usable,id);assert.equal(parsed.reviewAccepted,false,id);
 if(!trust){assert.equal(phase.provisionalExposureUsd,null,id);assert.equal(phase.retainFullReservation,true,id);}
 cases.push({id,...phase});
}
const scope={liveProviderCalls:0,credentialLookups:0,dpapiReads:0,liveWrapperImports:0,metadataCollectorExecutions:0,network:'none in this script; separate 77-test regression loopback fixtures only'};
const evidence={schema:'pantheon.native-independent-recheck.v1',authorSessionId:'/root/foreman_rules',recordedAt:new Date().toISOString(),verdict:'evidence-only; final report separate',scope,
 exactCodeAndDataPins:codeRefs.length,verifiedBuilderFiles:built.files.length,preservedOriginals:built.preservedOriginals.length,sealedMembers:seal.files.length,packetSources:packet.files.length,ratificationEvidenceVerified:true,
 actualOwnerProbe:{status:held,processId:owner.processId,processStartedUtc:owner.processStartedUtc,at:new Date().toISOString()},metadata:{ref:active.accountMetadataRef,at:account.at,qualificationSha256:hash(bytes(active.accountMetadataRef)),credentialCiphertextDigestMatchesDeclared:true,collectorSourceSha256:hash(bytes('qualify-account-metadata-r3.ps1'))},attempts,cases};
fs.writeFileSync(path.join(here,'independent-recheck.json'),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({codeAndDataPins:codeRefs.length,sealedMembers:seal.files.length,packetSources:packet.files.length,actualLock:held,cases:cases.length,liveCalls:0},null,2));
