// Finite P00 CLI only. Never import this live entry in tests. Pure decisions are in bootstrap-guards.mjs.
// No P01-P05 request is allowed; an independent recheck must pin every changed input before use.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {spawn,execFile,execFileSync}from'node:child_process';import{fileURLToPath,pathToFileURL}from'node:url';
import {StringDecoder} from 'node:string_decoder';
const here=path.dirname(fileURLToPath(import.meta.url)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const fail=code=>{throw Error(code)},code=e=>/^[A-Z0-9_]+$/.test(e?.message)?e.message:'BOOTSTRAP_HELD';
const ps='C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
const ownerSession='01a15424-1fd5-77a2-a73a-d92a60a5de34';
const write=(p,v)=>{const fd=fs.openSync(p,'wx',0o600);try{fs.writeFileSync(fd,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}};
const fixedRefs=['run-bootstrap-once.mjs','bootstrap-guards.mjs','bootstrap-lock-check.ps1','key-to-curl-stdin.ps1','native-sender/native-sender.mjs',
 'prepare-amended-plan-packet.mjs','prepare-attempt-specs.mjs','attempt-specs/qualification-r2.json','attempt-specs/qualification-r2-request.json',
 'attempt-specs/plan-review-r2.json','amended-plan-review-r2/manifest.json','amended-plan-review-r2/request.json','amended-plan-review-r2/packet.md',
 'bootstrap-rate-evidence.json','owner-ratification.json','../autonomy-20261019/package-manifest.json','../autonomy-20261019/model-registry.json'];
function checkedPreflight(){
 const p=read(path.join(here,'native-preflight-check.json'));
 if(p.status!=='PASS'||!p.authorSessionId||p.authorSessionId===ownerSession||!Array.isArray(p.files)||
  typeof p.reportRef!=='string'||!/^[-A-Za-z0-9_./]+$/.test(p.reportRef)||p.reportRef.split('/').includes('..'))fail('INDEPENDENT_PREFLIGHT_REQUIRED');
 if(sha(fs.readFileSync(path.join(here,p.reportRef)))!==p.reportSha256)fail('PREFLIGHT_REPORT_DRIFT');
 const blobs={};for(const ref of fixedRefs){const pins=p.files.filter(f=>f.path===ref);if(pins.length!==1)fail('PREFLIGHT_PIN_MISSING');
  blobs[ref]=fs.readFileSync(path.resolve(here,ref));if(sha(blobs[ref])!==pins[0].sha256)fail('PREFLIGHT_SOURCE_DRIFT');}
 return {preflight:p,blobs};
}
function namedRecord(transcript,line){
 if(!Number.isSafeInteger(line)||line!==517)fail('RATIFICATION_LINE_REFUSED');
 const fd=fs.openSync(transcript,'r'),buffer=Buffer.alloc(65536),decoder=new StringDecoder('utf8');let text='',seen=0;
 try{for(;;){const n=fs.readSync(fd,buffer);if(!n)break;text+=decoder.write(buffer.subarray(0,n));let pos;
  while((pos=text.indexOf('\n'))>=0){const current=text.slice(0,pos).replace(/\r$/,'');text=text.slice(pos+1);if(++seen===line)return current;}
 }}finally{fs.closeSync(fd);}fail('RATIFICATION_RECORD_MISSING');
}
async function main(){
 if(process.argv.length!==3)fail('EXACT_ATTEMPT_SPEC_REQUIRED');
 const configPath=path.resolve(process.argv[2]);const ref=path.relative(here,configPath).replaceAll('\\','/');
 if(!['attempt-specs/qualification-r2.json','attempt-specs/plan-review-r2.json'].includes(ref))fail('ATTEMPT_NOT_ALLOWLISTED');
 // Validate source pins before importing either reviewed module.
 let checked=checkedPreflight();
 const guards=await import(pathToFileURL(path.join(here,'bootstrap-guards.mjs')));
 const {describeLiveCommand,inspectNativeCapture}=await import(pathToFileURL(path.join(here,'native-sender/native-sender.mjs')));
 function inputs(){
  checked=checkedPreflight();guards.verifyIndependentPins(checked.preflight,checked.blobs);
  const seal=guards.decode(checked.blobs['../autonomy-20261019/package-manifest.json']),members={};
  if(sha(checked.blobs['../autonomy-20261019/package-manifest.json'])!==guards.PACKAGE_SHA)fail('PACKAGE_MANIFEST_DRIFT');
  for(const m of seal.files){if(!/^[-A-Za-z0-9_./]+$/.test(m.path)||m.path.split('/').includes('..'))fail('PACKAGE_PATH_REFUSED');members[m.path]=fs.readFileSync(path.resolve(here,'../autonomy-20261019',m.path));}
  const manifest=guards.decode(checked.blobs['amended-plan-review-r2/manifest.json']),sources={};
  if(sha(checked.blobs['amended-plan-review-r2/manifest.json'])!==guards.PINS['amended-plan-review-r2/manifest.json'])fail('PACKET_MANIFEST_DRIFT');
  for(const m of manifest.files)sources[m.file]=fs.readFileSync(m.file);
  guards.verifyPinnedBundle(checked.blobs,members,sources);
  const receipt=guards.decode(checked.blobs['owner-ratification.json']);
  guards.verifyRatification(checked.blobs['owner-ratification.json'],namedRecord(receipt.ratification.transcript,receipt.ratification.line));
  const config=guards.decode(checked.blobs[ref]);const bound=guards.validateAttemptInput(ref,checked.blobs[ref],checked.blobs[config.requestRef]);
  // Validate parser expectations before any claim or credential resolution, even for qualification.
  inspectNativeCapture(Buffer.alloc(0),bound.expected);
  const rate=guards.validateRates(checked.blobs['bootstrap-rate-evidence.json'],checked.blobs['../autonomy-20261019/model-registry.json'],Date.now());
  return {...bound,rate,requestBody:checked.blobs[config.requestRef].toString('utf8')};
 }
 let input=inputs();const {config,body,expected,rate,requestBody}=input;
 function snapshot(){const state=read(path.join(here,'activation.json')),accountPath=path.join(here,guards.metadataRef(state)),metadataRoot=path.dirname(accountPath),qualificationBytes=fs.readFileSync(accountPath);
  return {state,owner:read(path.join(here,'bootstrap-owner.json')),account:guards.decode(qualificationBytes),accountQualificationSha256:sha(qualificationBytes),
  metadataEvidence:{transportBytes:fs.readFileSync(path.join(metadataRoot,'transport.json')),organizationBytes:fs.readFileSync(path.join(metadataRoot,'organization.json')),modelsBytes:fs.readFileSync(path.join(metadataRoot,'models.json'))},releaseExists:fs.existsSync(path.join(here,'bootstrap-release.json')),
  revocationExists:fs.existsSync(path.join(here,'bootstrap-revocation.json'))||fs.existsSync(path.join(here,'revocation.json')),
  closedExists:fs.existsSync(path.join(here,'bootstrap-closed.json')),purpose:config.purpose,nowMs:Date.now()};}
 async function authority(expectedCredentialDigest){
  const before=snapshot();guards.validateAuthority({...before,lockHeld:true});
  const output=await new Promise((resolve,reject)=>execFile(ps,['-NoProfile','-File',path.join(here,'bootstrap-lock-check.ps1'),
   '-OwnerFile',path.join(here,'bootstrap-owner.json'),'-LockFile',path.join(here,'bootstrap-owner.lock')],
   {windowsHide:true,timeout:1000,maxBuffer:1024,encoding:'utf8'},(error,stdout)=>error?reject(Error('EXCLUSIVE_LOCK_REFUSED')):resolve(stdout)));
  const after=snapshot();if(JSON.stringify(before.owner)!==JSON.stringify(after.owner)||output!=='HELD')fail('EXCLUSIVE_OWNER_CHANGED');
  guards.validateAuthority({...after,lockHeld:true});if(expectedCredentialDigest!==undefined)guards.assertCredentialContinuity(expectedCredentialDigest,after.account);return after;
 }
 let active=await authority();
 const attemptsRoot=path.join(here,'native-sender/live-attempts');fs.mkdirSync(attemptsRoot,{recursive:true});
 const sendLock=path.join(attemptsRoot,'.send-lock'),lockFd=fs.openSync(sendLock,'wx',0o600);
 let attemptPath,claimed=false;
 try{
  const liabilities=[];for(const name of fs.readdirSync(attemptsRoot)){const p=path.join(attemptsRoot,name);if(!fs.statSync(p).isDirectory())continue;
   const c=read(path.join(p,'claim.json')),r=fs.existsSync(path.join(p,'result.json'))?read(path.join(p,'result.json')):null;
   const trusted=r?.accounting?.finalUsageTrusted===true&&r.delivery==='complete';
   liabilities.push({id:c.attemptId,parcelId:c.parcelId,artifactId:c.artifactId,reserved:c.reservedExposureUsd,
    exposure:trusted?r.accounting.provisionalExposureUsd:c.reservedExposureUsd,unknown:!trusted});}
  const reservation=guards.assessBudget(config,liabilities,rate),reserved=reservation.reservedExposureUsd;
  attemptPath=path.join(attemptsRoot,config.attemptId);fs.mkdirSync(attemptPath);
  write(path.join(attemptPath,'claim.json'),{schema:'pantheon.native-bootstrap-claim.v2',attemptId:config.attemptId,purpose:config.purpose,
   ...reservation,at:new Date().toISOString(),grantRef:'OM-PAN-001-RAT-001',runtimeDecisionRef:null,ownerSessionId:ownerSession,
   requestSha256:config.requestSha256,artifactManifestSha256:config.artifactManifestSha256,accountBindingRef:active.account.bindingName,
   accountMetadataRef:active.state.accountMetadataRef,accountQualificationSha256:active.accountQualificationSha256,credentialBindingCiphertextSha256:guards.credentialDigest(active.account),
   model:body.model,maxTokens:body.max_tokens,inputReservationTokens:rate.inputReservationTokens,inputRequestByteLimit:1048576,
   rateEvidenceSha256:guards.PINS['bootstrap-rate-evidence.json'],priorUncertaintyOutsidePoolUsd:5});claimed=true;
  const bodyFile=path.join(attemptPath,'request.json');write(bodyFile,requestBody);
  const desc=describeLiveCommand({requestBody,expectedRequestSha256:config.requestSha256,expectedHelperSha256:sha(checked.blobs['native-sender/native-sender.mjs']),
   model:body.model,maxTokens:body.max_tokens,sourceHead:'64fb8949bf5134f96fda02df0d4f52ac291a6138',artifactManifestSha256:config.artifactManifestSha256,
   accountBindingRef:active.account.bindingName,requestFile:bodyFile,rawOutputFile:path.join(attemptPath,'response.raw')});
  if(sha(fs.readFileSync(desc.executable))!==desc.executableSha256)fail('NATIVE_EXECUTABLE_DRIFT');write(path.join(attemptPath,'command.json'),desc);
  const expectedCredentialDigest=guards.credentialDigest(active.account);
  let credentialConfig;try{credentialConfig=execFileSync(ps,['-NoProfile','-File',path.join(here,'key-to-curl-stdin.ps1'),'-ExpectedCiphertextSha256',expectedCredentialDigest],
   {encoding:'utf8',maxBuffer:2048,timeout:15000,windowsHide:true,stdio:['ignore','pipe','pipe']});}catch{fail('NAMED_CREDENTIAL_RESOLUTION_FAILED');}
  try{
   if(!/^header = "x-api-key: sk-ant-[A-Za-z0-9_-]{20,300}"\r?\nheader = "anthropic-workspace-id: wrkspc_01Ddkc7MrJwHXBnjszr5fDrk"\r?\n$/.test(credentialConfig))fail('CREDENTIAL_CONFIG_REFUSED');
   // Revalidate after credential resolution, immediately before the effect. No old snapshot grants a send.
   inputs();active=await authority(expectedCredentialDigest);
   if(sha(fs.readFileSync(bodyFile))!==config.requestSha256||sha(fs.readFileSync(desc.executable))!==desc.executableSha256)fail('PRE_EFFECT_DRIFT');
   const rawFd=fs.openSync(desc.rawOutputFile,'wx',0o600);
   write(path.join(attemptPath,'send-intent.json'),{at:new Date().toISOString(),requestSha256:config.requestSha256,reservationUsd:reserved,retries:0,continuations:0,authorityRevalidated:true,
    accountMetadataRef:active.state.accountMetadataRef,accountQualificationSha256:active.accountQualificationSha256,credentialBindingCiphertextSha256:expectedCredentialDigest});
   const started=Date.now();
   const transport=await new Promise(resolve=>{
    let child,done=false,reason=null,rawBytes=0,stderrBytes=0,stderr='',idle,cleanup,unwatch=()=>{};const chunks=[];
    const finish=(exitCode,signal)=>{if(done)return;done=true;clearTimeout(deadline);clearTimeout(idle);clearTimeout(cleanup);unwatch();
     try{fs.fsyncSync(rawFd);}catch{reason='CAPTURE_WRITE_FAILED';}fs.closeSync(rawFd);const m=/NATIVE_STATUS:(\d{3}):(\d+):(\d+)/.exec(stderr);
     resolve({exitCode,signal,reason,rawBytes,elapsedMs:Date.now()-started,statusCode:m?Number(m[1]):null,redirects:m?Number(m[2]):null,connections:m?Number(m[3]):null,raw:Buffer.concat(chunks)});};
    const stop=why=>{if(done||reason)return;reason=why;child?.kill();cleanup=setTimeout(()=>{reason='OWNED_CLEANUP_UNCONFIRMED';finish(null,null);},5000);};
    const resetIdle=()=>{clearTimeout(idle);idle=setTimeout(()=>stop('IDLE_TIMEOUT'),120000);};
    const deadline=setTimeout(()=>stop('DEADLINE_EXCEEDED'),600000);
    try{
     const last=snapshot();if(JSON.stringify(last.owner)!==JSON.stringify(active.owner))fail('EXCLUSIVE_OWNER_CHANGED');guards.validateAuthority({...last,lockHeld:true});guards.assertCredentialContinuity(expectedCredentialDigest,last.account);
     child=spawn(desc.executable,desc.argv,{shell:false,windowsHide:true,stdio:['pipe','pipe','pipe'],env:{SystemRoot:'C:\\Windows'}});
     child.on('error',()=>{reason='SPAWN_FAILED';finish(null,null);});child.on('close',finish);
     unwatch=guards.startAuthorityWatch({check:()=>authority(expectedCredentialDigest),cancel:()=>stop('AUTHORITY_REVOKED_OR_UNAVAILABLE')});
     child.stdout.on('data',chunk=>{if(done||reason)return;resetIdle();const part=chunk.subarray(0,2097152-rawBytes);try{fs.writeFileSync(rawFd,part);}catch{stop('CAPTURE_WRITE_FAILED');return;}chunks.push(part);rawBytes+=part.length;if(part.length!==chunk.length)stop('CAPTURE_LIMIT');});
     child.stderr.on('data',chunk=>{stderrBytes+=chunk.length;if(stderrBytes>16384)stop('STDERR_LIMIT');else stderr+=chunk.toString('utf8');});
     child.stdin.on('error',()=>stop('STDIN_FAILED'));child.stdin.end(credentialConfig);credentialConfig=null;
    }catch(error){reason=code(error);finish(null,null);}
   });
   let parsed=null,parseCode=null;try{parsed=inspectNativeCapture(transport.raw,expected);}catch(error){parseCode=code(error);}
   const phases=guards.classifyCapture(transport,parsed,parseCode,expected,rate,reserved),{raw,...transportMeta}=transport;
   const result={schema:'pantheon.native-bootstrap-result.v2',attemptId:config.attemptId,parcelId:config.parcelId,artifactId:config.artifactId,
    at:new Date().toISOString(),transport:transportMeta,rawResponseSha256:sha(raw),...phases,reviewAcceptance:'never-automatic; independent semantic triage required',capture:parsed,
    accounting:{preflightEstimate:null,reservedExposureUsd:reserved,finalUsageTrusted:phases.finalUsageTrusted,providerReportedUsage:parsed?.usage??null,
     locallyEstimatedUsage:null,provisionalExposureUsd:phases.provisionalExposureUsd,billedCost:null,invoiceReconciled:false,rateEvidenceSha256:guards.PINS['bootstrap-rate-evidence.json']}};
   write(path.join(attemptPath,'result.json'),result);if(phases.reviewUsable)write(path.join(attemptPath,'review.json'),parsed.review);
   console.log(JSON.stringify({attemptId:config.attemptId,delivery:result.delivery,parseCode:result.parseCode,reviewStatus:result.reviewStatus,
    providerRequestId:parsed?.requestId??null,reservedExposureUsd:reserved,provisionalExposureUsd:phases.provisionalExposureUsd,billedCost:null}));
  }finally{credentialConfig=null;}
 }catch(error){if(claimed&&!fs.existsSync(path.join(attemptPath,'result.json')))write(path.join(attemptPath,'local-failure.json'),
  {code:code(error),at:new Date().toISOString(),retainFullReservation:true,retryAllowed:false});throw Error(code(error));}
 finally{fs.closeSync(lockFd);fs.unlinkSync(sendLock);}
}
main().catch(error=>{console.error(JSON.stringify({status:'held',code:code(error)}));process.exitCode=1;});
