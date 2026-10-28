import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';
import * as guards from './bootstrap-guards.mjs';
import {inspectNativeCapture} from './native-sender/native-sender.mjs';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {once} from 'node:events';
const here=path.dirname(fileURLToPath(import.meta.url));
test('only the two exact P00 R2 config/request bindings are accepted',()=>{
 for(const ref of ['attempt-specs/qualification-r2.json','attempt-specs/plan-review-r2.json']){
  const configBytes=fs.readFileSync(path.join(here,ref)),config=JSON.parse(configBytes),requestBytes=fs.readFileSync(path.join(here,config.requestRef));
  const result=guards.validateAttemptInput(ref,configBytes,requestBytes);assert.equal(result.config.parcelId,'P00');assert.ok(result.expected.requiredCoverage.length);
  assert.throws(()=>guards.validateAttemptInput('attempt-specs/unapproved.json',configBytes,requestBytes));
  assert.throws(()=>guards.validateAttemptInput(ref,Buffer.from(configBytes.toString().replace(config.attemptId,'new-attempt')),requestBytes));
  assert.throws(()=>guards.validateAttemptInput(ref,configBytes,Buffer.from(requestBytes.toString()+' ')));
 }
});
test('canonical timestamps reject NaN and impossible dates',()=>{
 for(const value of ['bad','2026-02-31T00:00:00.000Z','2026-10-19','2026-10-19T13:00:00+02:00'])assert.throws(()=>guards.parseInstant(value));
 assert.equal(guards.parseInstant('2026-10-19T13:00:00.1234567+00:00'),Date.parse('2026-10-19T13:00:00.123Z'));
});
test('metadata refresh accepts only activation-named qualification records in numbered account scopes',()=>{
 assert.equal(guards.metadataRef({accountMetadataRef:'account-metadata-2/qualification.json'}),'account-metadata-2/qualification.json');
 assert.equal(guards.metadataRef({accountMetadataRef:'account-metadata-3/qualification.json'}),'account-metadata-3/qualification.json');
 for(const ref of [undefined,'account-metadata-1/qualification.json','../account-metadata-2/qualification.json','account-metadata-2/other.json','D:/outside.json'])
  assert.throws(()=>guards.metadataRef({accountMetadataRef:ref}));
});
const event=(type,fields={})=>`event: ${type}\ndata: ${JSON.stringify({type,...fields})}\n\n`;
const expected={model:'claude-opus-5-5',maxTokens:4096,requiredCoverage:['synthetic-transport']};
const goodReview={reviewText:'I inspected this synthetic transport fixture and its exact request boundary. The single response is structurally complete. Source and identity validation remain separate from this fixture, and independent semantic triage is still required.',verdict:'pass',findings:[],coverage:['synthetic-transport'],limitations:['Synthetic only; no provider call.']};
function capture({text=JSON.stringify(goodReview),usage={input_tokens:90,output_tokens:1},finalUsage={output_tokens:200},stop='end_turn',tail=''}={}){
 return Buffer.from('HTTP/1.1 200 OK\r\ncontent-type: text/event-stream\r\nrequest-id: req_fixture\r\n\r\n'+
  event('message_start',{message:{type:'message',role:'assistant',id:'msg_fixture',model:expected.model,content:[],usage}})+
  event('content_block_start',{index:0,content_block:{type:'text',text:''}})+event('content_block_delta',{index:0,delta:{type:'text_delta',text}})+
  event('content_block_stop',{index:0})+event('message_delta',{delta:{stop_reason:stop},usage:finalUsage})+event('message_stop')+tail);
}
test('missing terminal usage never promotes initial output snapshot to final measured usage',()=>{
 const parsed=inspectNativeCapture(capture({finalUsage:null}),expected);assert.equal(parsed.finalUsageValid,false);
 const missing=inspectNativeCapture(capture({finalUsage:{}}),expected);
 assert.equal(missing.streamValid,true);assert.equal(missing.finalUsageValid,false);
});
const canonical='D:/Repos/agent-skills/plugins/foreman-line/docs/goals/pantheon-incarnation-v0/execution-om-pan-001';
const bytes=ref=>fs.readFileSync(fs.existsSync(path.resolve(here,ref))?path.resolve(here,ref):path.resolve(canonical,ref));
const json=ref=>guards.decode(bytes(ref));
const encode=value=>Buffer.from(JSON.stringify(value));
const clock=Date.parse('2026-10-19T14:30:00.000Z');
const qConfig=json('attempt-specs/qualification-r2.json'),pConfig=json('attempt-specs/plan-review-r2.json');
const rate=guards.validateRates(bytes('bootstrap-rate-evidence.json'),bytes('../autonomy-20261019/model-registry.json'),clock);
function authorityFixture(){
 const state={status:'RATIFIED_BOOTSTRAP_ACTIVE',ownerSessionId:guards.OWNER_SESSION,packageManifestSha256:guards.PACKAGE_SHA,
  activatedAt:'2026-10-19T13:38:02.935Z',expiresAt:'2026-11-02T13:38:02.935Z',runtimeReady:false,currentParcel:'P00',
  autoReloadOffVerified:true,accountMetadataQualified:true,accountQualified:true,accountMetadataRef:'account-metadata-3/qualification.json',credentialBindingRef:'pantheon-om-pan-001-anthropic-default'};
 const owner={ownerSessionId:guards.OWNER_SESSION,host:'M0R6AN',processId:12345,processStartedUtc:'2026-10-19T13:37:41.8116339Z',acquiredAtUtc:'2026-10-19T13:37:42.3263299+00:00'};
 const account=json('account-metadata-3/qualification.json');
 const metadataEvidence={transportBytes:bytes('account-metadata-3/transport.json'),organizationBytes:bytes('account-metadata-3/organization.json'),modelsBytes:bytes('account-metadata-3/models.json')};
 return{state,owner,account,metadataEvidence,lockHeld:true,nowMs:clock,purpose:'qualification'};
}
function bundleFixture(){
 const blobs=Object.fromEntries(Object.keys(guards.PINS).map(ref=>[ref,bytes(ref)])),packageMembers={},sourceMembers={};
 for(const m of guards.decode(blobs['../autonomy-20261019/package-manifest.json']).files)packageMembers[m.path]=bytes('../autonomy-20261019/'+m.path);
 for(const m of guards.decode(blobs['amended-plan-review-r2/manifest.json']).files)sourceMembers[m.file]=fs.readFileSync(m.file);
 return{blobs,packageMembers,sourceMembers};
}
test('R2 keeps original source sections and synthetic content while adding exact 14-label coverage and standard/global scope',()=>{
 const original=bytes('amended-plan-review/packet.md').toString(),r2=bytes('amended-plan-review-r2/packet.md').toString();
 assert.equal(r2.slice(r2.indexOf('\n---\n## Artifact ')),original.slice(original.indexOf('\n---\n## Artifact ')));
 assert.equal(guards.PLAN_COVERAGE.length,14);assert.deepEqual(pConfig.requiredCoverage,guards.PLAN_COVERAGE);
 const originalQ=json('attempt-specs/qualification-request.json'),revisedQ=json(qConfig.requestRef);
 assert.deepEqual(revisedQ.messages,originalQ.messages);assert.equal(revisedQ.max_tokens,originalQ.max_tokens);
 for(const ref of [qConfig.requestRef,pConfig.requestRef]){const body=json(ref);assert.equal(body.service_tier,'standard_only');assert.equal(body.inference_geo,'global');assert.equal(body.speed,undefined);assert.equal(body.max_tokens,ref===qConfig.requestRef?4096:32768);}
});
test('self-consistent arbitrary request hashes, tools, output, tier, geo, speed and oversized body cannot expand the exact allowlist',()=>{
 const ref='attempt-specs/qualification-r2.json',body=json(qConfig.requestRef);
 for(const mutation of [{max_tokens:65536},{tools:[{name:'network'}]},{service_tier:'auto'},{inference_geo:'us'},{speed:'fast'},
  {messages:[{role:'user',content:[{type:'text',text:'x'.repeat(1048577)}]}]}]){
  const changed=encode({...body,...mutation}),config=encode({...qConfig,requestSha256:guards.sha256(changed)});
  assert.throws(()=>guards.validateAttemptInput(ref,config,changed));
 }
 for(const ref of ['attempt-specs/qualification.json','attempt-specs/plan-review.json','attempt-specs/P01.json'])assert.throws(()=>guards.validateAttemptInput(ref,bytes('attempt-specs/qualification-r2.json'),bytes(qConfig.requestRef)),/ATTEMPT_NOT_ALLOWLISTED/);
 assert.throws(()=>guards.validateAttemptInput('attempt-specs/plan-review-r2.json',encode({...pConfig,requiredCoverage:[]}),bytes(pConfig.requestRef)),/PIN_DRIFT/);
});
test('sealed 33 members and actual packet sources bind exactly without dereferencing historical external source pins',()=>{
 const f=bundleFixture();assert.equal(Object.keys(f.packageMembers).length,33);assert.equal(guards.verifyPinnedBundle(f.blobs,f.packageMembers,f.sourceMembers),true);
 for(const ref of Object.keys(guards.PINS)){const changed={...f.blobs,[ref]:Buffer.concat([f.blobs[ref],Buffer.from(' ')])};assert.throws(()=>guards.verifyPinnedBundle(changed,f.packageMembers,f.sourceMembers),/PIN_DRIFT/);}
 const firstMember=Object.keys(f.packageMembers)[0];assert.throws(()=>guards.verifyPinnedBundle(f.blobs,{...f.packageMembers,[firstMember]:Buffer.from('drift')},f.sourceMembers),/PACKAGE_MEMBER_DRIFT/);
 const firstSource=Object.keys(f.sourceMembers)[0];assert.throws(()=>guards.verifyPinnedBundle(f.blobs,f.packageMembers,{...f.sourceMembers,[firstSource]:Buffer.from('drift')}),/SOURCE_MEMBER_DRIFT/);
});
test('independent preflight must include each exact code and data pin once',()=>{
 const blobs=Object.fromEntries([...guards.CHECKED_CODE,...Object.keys(guards.PINS)].map(ref=>[ref,bytes(ref)]));
 const preflight={status:'PASS',authorSessionId:'synthetic-independent-fixture',reportRef:'synthetic-only.md',files:Object.entries(blobs).map(([ref,value])=>({path:ref,sha256:guards.sha256(value)}))};
 assert.equal(guards.verifyIndependentPins(preflight,blobs),true);
 assert.throws(()=>guards.verifyIndependentPins({...preflight,authorSessionId:guards.OWNER_SESSION},blobs));
 for(const ref of Object.keys(blobs)){assert.throws(()=>guards.verifyIndependentPins({...preflight,files:preflight.files.filter(f=>f.path!==ref)},blobs));assert.throws(()=>guards.verifyIndependentPins(preflight,{...blobs,[ref]:Buffer.from('drift')}));}
 assert.throws(()=>guards.verifyIndependentPins({...preflight,files:[...preflight.files,preflight.files[0]]},blobs));
});
test('ratification does not accept a fabricated user receipt or arbitrary transcript line',()=>{
 assert.throws(()=>guards.verifyRatification(encode({ratification:{role:'user'}}),'fabricated'));
 assert.throws(()=>guards.verifyRatification(bytes('owner-ratification.json'),JSON.stringify({type:'response_item',payload:{role:'user',content:[{text:'Ratify'}]}})),/RATIFICATION_SOURCE_DRIFT/);
});
test('current account fixture and exact UTC timestamp forms validate without authority writes',()=>{
 assert.ok(guards.validateAuthority(authorityFixture()).expiryMs>clock);
 for(const timestamp of ['2026-10-19T13:00:00.1234567Z','2026-10-19T13:00:00.1234567+00:00','2026-10-19T13:00:00.000Z'])assert.ok(Number.isFinite(guards.parseInstant(timestamp)));
});
for(const[group,key]of [['state','activatedAt'],['state','expiresAt'],['owner','processStartedUtc'],['owner','acquiredAtUtc'],['account','at']]){
 test(`missing or malformed ${group}.${key} refuses authority`,()=>{
  for(const value of [undefined,null,'not-a-date','2026-02-31T13:00:00.000Z',NaN]){const f=authorityFixture();f[group][key]=value;assert.throws(()=>guards.validateAuthority(f),/TIMESTAMP_REFUSED/);}
 });
}
test('future, expired and overlong authority dates cannot open admission',()=>{
 for(const[group,key,value]of [['state','activatedAt','2026-10-20T00:00:00.000Z'],['state','expiresAt','2026-10-19T14:19:59.999Z'],
  ['state','expiresAt','2026-11-03T13:38:02.935Z'],['owner','processStartedUtc','2026-10-20T00:00:00.000Z'],
  ['owner','acquiredAtUtc','2026-10-20T00:00:00.000Z'],['account','at','2026-10-20T00:00:00.000Z'],['account','at','2026-10-19T12:00:00.000Z']]){
  const f=authorityFixture();f[group][key]=value;assert.throws(()=>guards.validateAuthority(f));
 }
 assert.throws(()=>guards.validateAuthority({...authorityFixture(),nowMs:NaN}),/CLOCK_REFUSED/);
 assert.throws(()=>guards.validateRates(bytes('bootstrap-rate-evidence.json'),bytes('../autonomy-20261019/model-registry.json'),NaN),/CLOCK_REFUSED/);
});
test('release, revocation, closure, Runtime readiness, stale owner and unqualified review all hold',()=>{
 for(const change of [{releaseExists:true},{revocationExists:true},{closedExists:true},{lockHeld:false}])assert.throws(()=>guards.validateAuthority({...authorityFixture(),...change}));
 for(const change of [{runtimeReady:true},{bootstrapClosed:true},{currentParcel:'P01'},{ownerSessionId:'stale'},{autoReloadOffVerified:false}]){
  const f=authorityFixture();Object.assign(f.state,change);assert.throws(()=>guards.validateAuthority(f));
 }
 for(const change of [{ownerSessionId:'stale'},{processId:NaN},{processId:-1},{host:'other'}]){const f=authorityFixture();Object.assign(f.owner,change);assert.throws(()=>guards.validateAuthority(f));}
 const f=authorityFixture();f.purpose='plan-review';f.state.accountQualified=false;assert.throws(()=>guards.validateAuthority(f),/LIVE_QUALIFICATION_REQUIRED/);
});
test('refresh retains same account/model identity and successful GET response provenance',()=>{
 const f=authorityFixture();f.state.accountMetadataRef='account-metadata-4/qualification.json';assert.ok(guards.validateAuthority(f));
 for(const change of [{organization:'Other'},{organizationId:'other'},{workspaceId:'other'},{workspaceName:'Other'},
  {bindingName:'unapproved'},{approvedModels:['claude-opus-5-5','other']},{metadataQualified:false}]){const x=authorityFixture();Object.assign(x.account,change);assert.throws(()=>guards.validateAuthority(x));}
 for(const change of [{method:'POST'},{httpStatus:'401'},{curlExitCode:28},{stderrPresent:true},{recordedAtUtc:'bad'},
  {recordedAtUtc:'2026-10-20T00:00:00.000Z'},{recordedAtUtc:'2026-10-19T12:00:00.000Z'},{responseSha256:'0'.repeat(64)}]){
  const x=authorityFixture(),transport=guards.decode(x.metadataEvidence.transportBytes);Object.assign(transport[0],change);x.metadataEvidence.transportBytes=encode(transport);assert.throws(()=>guards.validateAuthority(x));
 }
 for(const key of ['transportBytes','organizationBytes','modelsBytes']){const x=authorityFixture();x.metadataEvidence[key]=Buffer.from('{}');assert.throws(()=>guards.validateAuthority(x));}
});
test('credential ciphertext digest is required and a different qualified binding cannot replace resolved credentials',()=>{
 const first=guards.sha256(Buffer.from('fake ciphertext A')),second=guards.sha256(Buffer.from('fake ciphertext B'));
 assert.equal(guards.assertCredentialContinuity(first,{credentialBindingCiphertextSha256:first}),true);
 assert.throws(()=>guards.assertCredentialContinuity(first,{credentialBindingCiphertextSha256:second}),/CREDENTIAL_BINDING_CHANGED/);
 for(const value of [undefined,null,'bad','0'.repeat(63),'A'.repeat(64)]){const f=authorityFixture();f.account.credentialBindingCiphertextSha256=value;assert.throws(()=>guards.validateAuthority(f),/CREDENTIAL_DIGEST_REQUIRED/);}
});
const liability=(id,extra={})=>({id,reserved:6,exposure:1,parcelId:'P00',artifactId:'other-fixture',unknown:false,...extra});
test('conservative reservations include full context, requested reasoning/output and 10 percent uncertainty',()=>{
 assert.equal(guards.assessBudget(qConfig,[],rate).reservedExposureUsd,4.71);
 assert.equal(guards.assessBudget(pConfig,[],rate).reservedExposureUsd,5.34);
 assert.ok(rate.inputReservationTokens>1000000);
 assert.throws(()=>guards.validateRates(bytes('bootstrap-rate-evidence.json'),bytes('../autonomy-20261019/model-registry.json'),clock+86400000),/RATE_CONTRACT_REFUSED/);
});
test('per-artifact two-attempt cap cannot be bypassed with a changed attempt ID',()=>{
 const attempts=[liability('prior-1',{artifactId:qConfig.artifactId}),liability('prior-2',{artifactId:qConfig.artifactId})];
 assert.throws(()=>guards.assessBudget(qConfig,attempts,rate),/ARTIFACT_ATTEMPT_LIMIT/);
 assert.throws(()=>guards.assessBudget(qConfig,[liability(qConfig.attemptId)],rate),/DUPLICATE_ATTEMPT/);
});
test('parcel 15-dollar cap is separate from bootstrap 25-dollar and 16-call caps',()=>{
 assert.throws(()=>guards.assessBudget(pConfig,[liability('a',{exposure:6}),liability('b',{exposure:6})],rate),/PARCEL_EXPOSURE_LIMIT/);
 assert.throws(()=>guards.assessBudget(qConfig,Array.from({length:4},(_,i)=>liability('p'+i,{parcelId:'other',exposure:6})),rate),/BOOTSTRAP_BUDGET_OR_CALL_LIMIT/);
 assert.throws(()=>guards.assessBudget(qConfig,Array.from({length:16},(_,i)=>liability('p'+i,{parcelId:'other',exposure:0})),rate),/BOOTSTRAP_BUDGET_OR_CALL_LIMIT/);
});
test('unknown sends, malformed exposures and missing reconciliation state retain a hold',()=>{
 assert.throws(()=>guards.assessBudget(qConfig,[liability('a',{unknown:true})],rate),/UNKNOWN_EXPOSURE/);
 for(const extra of [{unknown:undefined},{reserved:NaN},{exposure:NaN},{exposure:-1},{reserved:7},{exposure:7},{id:undefined}])assert.throws(()=>guards.assessBudget(qConfig,[liability('a',extra)],rate),/LIABILITY_RECORD_REFUSED/);
 assert.throws(()=>guards.assessBudget(qConfig,[liability('a'),liability('a')],rate),/LIABILITY_RECORD_REFUSED/);
});
test('micro-USD cap boundary admits exactly 15 dollars and refuses one additional microdollar',()=>{
 const prior=[liability('a',{exposure:6}),liability('b',{exposure:4.29})];assert.equal(guards.assessBudget(qConfig,prior,rate).reservedExposureUsd,4.71);
 assert.throws(()=>guards.assessBudget(qConfig,[prior[0],{...prior[1],exposure:4.290001}],rate),/PARCEL_EXPOSURE_LIMIT/);
 assert.throws(()=>guards.assessBudget(qConfig,[liability('a',{exposure:0.0000001})],rate),/LIABILITY_PRECISION_REFUSED/);
});
const transport={exitCode:0,reason:null,statusCode:200,redirects:0,connections:1};
const classify=(raw,overrides={})=>{const parsed=inspectNativeCapture(raw,expected);return{parsed,phases:guards.classifyCapture({...transport,...overrides},parsed,null,expected,rate,4.71)};};
test('valid native transfer and strict stream permit provisional usage while review stays held',()=>{
 const{parsed,phases}=classify(capture());assert.equal(parsed.complete,true);assert.equal(phases.strictStreamValid,true);assert.equal(phases.finalUsageTrusted,true);
 assert.equal(parsed.usage.output_tokens,200);assert.equal(phases.provisionalExposureUsd,0.004796);assert.equal(phases.reviewUsable,true);
 assert.equal(phases.reviewStatus,'held-for-independent-semantic-triage');assert.equal(parsed.reviewAccepted,false);assert.equal(phases.reportedTier,null);
});
test('NP-02 terminal-looking streams with trailing malformed/order-invalid/truncated frames keep full reservation',()=>{
 for(const tail of ['event: ping\ndata: {bad}\n\n',event('ping'),'event: ping\ndata: {}']){
  const{parsed,phases}=classify(capture({tail}));assert.equal(parsed.streamValid,false);assert.equal(phases.finalUsageTrusted,false);assert.equal(phases.retainFullReservation,true);assert.equal(phases.delivery,'unknown');assert.equal(phases.reviewUsable,false);
 }
});
test('valid stream with invalid or empty review is failed review with separately trusted usage',()=>{
 for(const text of ['', 'not JSON',JSON.stringify({...goodReview,coverage:[]}),JSON.stringify({...goodReview,reviewText:'short'})]){
  const{phases}=classify(capture({text}));assert.equal(phases.strictStreamValid,true);assert.equal(phases.finalUsageTrusted,true);assert.equal(phases.reviewUsable,false);assert.equal(phases.reviewStatus,'failed');assert.equal(phases.delivery,'complete');
 }
});
test('max-token exhaustion remains failed review while final usage is independently classified',()=>{
 const{parsed,phases}=classify(capture({stop:'max_tokens',finalUsage:{output_tokens:4096}}));assert.equal(parsed.error,'OUTPUT_LIMIT_REACHED');assert.equal(phases.reviewUsable,false);assert.equal(phases.finalUsageTrusted,true);
});
test('missing or contradictory counters, unknown usage fields and premiums cannot release the full reserve',()=>{
 for(const args of [{usage:{}},{finalUsage:{}},{finalUsage:{output_tokens:0}},{finalUsage:{output_tokens:4097}},
  {finalUsage:{output_tokens:200,cache_read_input_tokens:2}},{finalUsage:{output_tokens:200,server_tool_use:{}}},
  {finalUsage:{output_tokens:200,service_tier:'priority'}},{finalUsage:{output_tokens:200,inference_geo:'us'}},
  {usage:{input_tokens:1048577,output_tokens:1}}]){const{phases}=classify(capture(args));assert.equal(phases.finalUsageTrusted,false);assert.equal(phases.retainFullReservation,true);}
});
test('HTTP failure, partial transfer, cancellation, redirect, extra connection or parser throw never release the reserve',()=>{
 for(const changed of [{exitCode:18},{statusCode:500},{reason:'AUTHORITY_REVOKED_OR_UNAVAILABLE'},{redirects:1},{connections:2}]){
  const{phases}=classify(capture(),changed);assert.equal(phases.nativeTransferComplete,false);assert.equal(phases.finalUsageTrusted,false);assert.equal(phases.reviewUsable,false);
 }
 const phases=guards.classifyCapture(transport,null,'RAW_CAPTURE_REFUSED',expected,rate,4.71);assert.equal(phases.parseCode,'RAW_CAPTURE_REFUSED');assert.equal(phases.retainFullReservation,true);
});
const ps='C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
const execFileAsync=promisify(execFile),runs=path.join(here,'native-sender/.test-runs');
async function fakeOwner(t,held){
 fs.mkdirSync(runs,{recursive:true});const dir=fs.mkdtempSync(path.join(runs,'lock-')),lockFile=path.join(dir,'owner.lock'),ownerFile=path.join(dir,'owner.json');
 fs.writeFileSync(lockFile,'fixture lock');
 const script=`$ErrorActionPreference='Stop'; ${held?`$fixtureHandle=[IO.File]::Open('${lockFile.replaceAll("'","''")}',[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None);`:''} [Console]::Out.WriteLine((@{processId=$PID;processStartedUtc=([Diagnostics.Process]::GetCurrentProcess().StartTime.ToUniversalTime().ToString('o'));ownerSessionId='${guards.OWNER_SESSION}';host='M0R6AN'}|ConvertTo-Json -Compress)); [Console]::In.ReadLine()|Out-Null; ${held?'$fixtureHandle.Dispose();':''}`;
 const child=spawn(ps,['-NoProfile','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true,stdio:['pipe','pipe','pipe']});
 const closed=once(child,'close');
 t.after(async()=>{child.kill();await closed;assert.ok(path.resolve(dir).startsWith(path.resolve(runs)+path.sep));fs.rmSync(dir,{recursive:true,force:true});});
 const owner=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('FAKE_OWNER_TIMEOUT')),5000);
  child.once('error',reject);child.stdout.on('data',chunk=>{out+=chunk;if(out.includes('\n')){clearTimeout(timer);try{resolve(JSON.parse(out.split('\n')[0]));}catch(error){reject(error);}}});child.once('exit',code=>{if(!out.includes('\n')){clearTimeout(timer);reject(Error('FAKE_OWNER_EXIT_'+code));}});});
 fs.writeFileSync(ownerFile,JSON.stringify(owner));return{child,closed,owner,ownerFile,lockFile};
}
async function probe(f){try{const r=await execFileAsync(ps,['-NoProfile','-File',path.join(here,'bootstrap-lock-check.ps1'),'-OwnerFile',f.ownerFile,'-LockFile',f.lockFile],{windowsHide:true,timeout:3000,maxBuffer:1024});return{code:0,stdout:r.stdout};}catch(error){return{code:error.code,stdout:error.stdout};}}
test('real fake-owner exclusive FileStream is recognized by the read-only lock probe',async t=>{const f=await fakeOwner(t,true);assert.deepEqual(await probe(f),{code:0,stdout:'HELD'});});
test('present but unheld lock is refused separately from missing lock',async t=>{const f=await fakeOwner(t,false);const r=await probe(f);assert.equal(r.code,13);assert.equal(r.stdout,'');});
test('missing lock is refused even while the recorded fake owner process remains alive',async t=>{const f=await fakeOwner(t,false);fs.unlinkSync(f.lockFile);const r=await probe(f);assert.equal(r.code,10);assert.equal(r.stdout,'');});
test('held lock with stale owner start identity is refused',async t=>{const f=await fakeOwner(t,true);fs.writeFileSync(f.ownerFile,JSON.stringify({...f.owner,processStartedUtc:'2026-01-01T00:00:00.0000000Z'}));const r=await probe(f);assert.equal(r.code,12);assert.equal(r.stdout,'');});
test('in-flight watcher cancels an owned fake subprocess within five seconds of revocation',async t=>{
 const child=spawn(process.execPath,['-e','process.stdout.write("READY\\n");setInterval(()=>{},1000)'],{windowsHide:true,stdio:['ignore','pipe','ignore']});const closed=once(child,'close');
 t.after(()=>child.kill());await once(child.stdout,'data');let revoked=false,cancelledAt=null;const started=Date.now();
 const stop=guards.startAuthorityWatch({check:()=>{if(revoked)throw Error('REVOKED');},cancel:()=>{cancelledAt=Date.now();child.kill();},intervalMs:20,checkTimeoutMs:100});
 t.after(stop);setTimeout(()=>{revoked=true;},30);await closed;assert.ok(cancelledAt-started<5000);assert.ok(cancelledAt!==null);
});
test('authority-check timeout cancels and a stopped watcher never dispatches cancellation',async()=>{
 let cancellations=0;await new Promise(resolve=>{guards.startAuthorityWatch({check:()=>new Promise(()=>{}),cancel:code=>{assert.equal(code,'AUTHORITY_CHECK_TIMEOUT');cancellations++;resolve();},intervalMs:10,checkTimeoutMs:30});});
 assert.equal(cancellations,1);const stop=guards.startAuthorityWatch({check:()=>{throw Error('REVOKED');},cancel:()=>cancellations++,intervalMs:10,checkTimeoutMs:30});stop();await new Promise(resolve=>setTimeout(resolve,40));assert.equal(cancellations,1);
});
