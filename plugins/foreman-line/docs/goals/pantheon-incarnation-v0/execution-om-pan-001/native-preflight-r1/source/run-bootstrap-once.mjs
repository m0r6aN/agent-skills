// Finite OM-PAN-001 native bootstrap only. Never a Runtime permit or reusable production adapter.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';import {fileURLToPath,pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const fail=code=>{throw Error(code)};
const write=(p,v)=>{const fd=fs.openSync(p,'wx',0o600);try{fs.writeFileSync(fd,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}};
const manifestSha='ca6645f02284dca74b17a9500ec0482552bb192e785f1d76ae0be1f4f9532f82';
const expectedSession='01a15424-1fd5-77a2-a73a-d92a60a5de34';
const ps='C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
const helperPath=path.join(here,'native-sender/native-sender.mjs');
const specFile=process.argv[2];
if(!specFile||process.argv.length!==3)fail('EXACT_ATTEMPT_SPEC_REQUIRED');
const configPath=path.resolve(specFile);if(path.dirname(configPath)!==path.join(here,'attempt-specs'))fail('SPEC_PATH_REFUSED');
const config=read(configPath);
if(!/^[a-z0-9-]{1,80}$/.test(config.attemptId)||!['qualification','plan-review'].includes(config.purpose))fail('ATTEMPT_PURPOSE_REFUSED');
const state=read(path.join(here,'activation.json')),receipt=read(path.join(here,'owner-ratification.json'));
if(state.status!=='RATIFIED_BOOTSTRAP_ACTIVE'||state.ownerSessionId!==expectedSession||Date.now()>=Date.parse(state.expiresAt)||!state.autoReloadOffVerified||state.packageManifestSha256!==manifestSha)fail('ACTIVATION_REFUSED');
if(receipt.packageManifestSha256!==manifestSha||receipt.ratification.sessionId!==expectedSession||receipt.ratification.line!==517)fail('RATIFICATION_REFUSED');
const ratificationRaw=fs.readFileSync(receipt.ratification.transcript,'utf8').split(/\r?\n/)[516];
if(sha(ratificationRaw)!==receipt.ratification.rawRecordSha256)fail('RATIFICATION_SOURCE_CHANGED');
const r=JSON.parse(ratificationRaw);if(r.payload?.role!=='user'||r.type!=='response_item')fail('RATIFICATION_NOT_USER');
if(sha(fs.readFileSync(path.join(here,'../autonomy-20261019/package-manifest.json')))!==manifestSha)fail('MANIFEST_CHANGED');
const account=read(path.join(here,'account-metadata-2/qualification.json'));
if(!account.metadataQualified||account.organization!=='Morgan Findings LLC'||account.workspaceId!=='wrkspc_01Ddkc7MrJwHXBnjszr5fDrk'||Date.now()-Date.parse(account.at)>3600000)fail('ACCOUNT_PREFLIGHT_STALE');
if(config.purpose==='plan-review'&&!state.accountQualified)fail('LIVE_QUALIFICATION_REQUIRED');
const owner=read(path.join(here,'bootstrap-owner.json'));if(owner.ownerSessionId!==expectedSession||fs.existsSync(path.join(here,'bootstrap-release.json')))fail('BOOTSTRAP_OWNER_REFUSED');
// Ask Windows to verify the exact PID/start identity and genuine exclusive file handle, not just a JSON flag.
const lockProbe=`$ErrorActionPreference='Stop';$o=Get-Content -LiteralPath '${path.join(here,'bootstrap-owner.json').replaceAll('\\','/')}' -Raw|ConvertFrom-Json;$p=Get-Process -Id $o.processId;if($p.StartTime.ToUniversalTime().ToString('o') -ne $o.processStartedUtc){exit 3};try{$f=[IO.File]::Open('${path.join(here,'bootstrap-owner.lock').replaceAll('\\','/')}',[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None);$f.Dispose();exit 4}catch [IO.IOException]{exit 0}`;
try{execFileSync(ps,['-NoProfile','-EncodedCommand',Buffer.from(lockProbe,'utf16le').toString('base64')],{stdio:['ignore','pipe','pipe'],windowsHide:true})}catch{fail('EXCLUSIVE_BOOTSTRAP_LOCK_ABSENT')}
const preflight=read(path.join(here,'native-preflight-check.json'));
if(preflight.status!=='PASS'||preflight.authorSessionId===expectedSession||!preflight.reportRef)fail('INDEPENDENT_NATIVE_PREFLIGHT_REQUIRED');
for(const f of preflight.files){if(sha(fs.readFileSync(path.resolve(here,f.path)))!==f.sha256)fail('PREFLIGHT_SOURCE_DRIFT')}
for(const required of ['run-bootstrap-once.mjs','key-to-curl-stdin.ps1','native-sender/native-sender.mjs'])if(!preflight.files.some(f=>f.path===required))fail('PREFLIGHT_PIN_MISSING');
const requestPath=path.resolve(here,config.requestRef);if(!requestPath.startsWith(here+path.sep))fail('REQUEST_PATH_REFUSED');
const requestBody=fs.readFileSync(requestPath,'utf8'),body=JSON.parse(requestBody);
if(sha(requestBody)!==config.requestSha256||body.model!=='claude-opus-5-5'||body.stream!==true||body.tools?.length!==0||body.max_tokens!==(config.purpose==='qualification'?4096:32768))fail('REQUEST_BINDING_REFUSED');
const {describeLiveCommand,inspectNativeCapture}=await import(pathToFileURL(helperPath));
if(typeof inspectNativeCapture!=='function')fail('CHECKED_CAPTURE_PARSER_REQUIRED');
const attemptsRoot=path.join(here,'native-sender/live-attempts');fs.mkdirSync(attemptsRoot,{recursive:true});
const sendLock=path.join(attemptsRoot,'.send-lock');const lockFd=fs.openSync(sendLock,'wx',0o600);
let attemptPath,claimed=false;
try{
 const liabilities=[];
 for(const name of fs.readdirSync(attemptsRoot)){const p=path.join(attemptsRoot,name);if(!fs.statSync(p).isDirectory())continue;const c=read(path.join(p,'claim.json'));const terminal=fs.existsSync(path.join(p,'result.json'))?read(path.join(p,'result.json')):null;liabilities.push({id:c.attemptId,exposure:terminal?.accounting?.provisionalExposureUsd??c.reservedExposureUsd,unknown:!terminal||terminal.delivery==='unknown'});}
 if(liabilities.some(x=>x.id===config.attemptId))fail('DUPLICATE_ATTEMPT');
 if(liabilities.some(x=>x.unknown))fail('UNKNOWN_DELIVERY_REQUIRES_RECONCILIATION');
 const reserved=Number((Math.ceil((1048576*4/1e6+body.max_tokens*20/1e6)*1.1*100)/100).toFixed(2));
 const exposure=liabilities.reduce((s,x)=>s+x.exposure,0);
 if(reserved>6||liabilities.length>=16||liabilities.length>=120||exposure+reserved>25||exposure+reserved>75)fail('BOOTSTRAP_BUDGET_OR_CALL_LIMIT');
 attemptPath=path.join(attemptsRoot,config.attemptId);fs.mkdirSync(attemptPath);
 write(path.join(attemptPath,'claim.json'),{schema:'pantheon.native-bootstrap-claim.v1',attemptId:config.attemptId,purpose:config.purpose,at:new Date().toISOString(),grantRef:'OM-PAN-001-RAT-001',runtimeDecisionRef:null,ownerSessionId:expectedSession,requestSha256:config.requestSha256,artifactManifestSha256:config.artifactManifestSha256,reservedExposureUsd:reserved,accountBindingRef:account.bindingName,model:body.model,maxTokens:body.max_tokens,priorUncertaintyOutsidePoolUsd:5});claimed=true;
 const bodyFile=path.join(attemptPath,'request.json');write(bodyFile,requestBody);
 const desc=describeLiveCommand({requestBody,expectedRequestSha256:config.requestSha256,expectedHelperSha256:sha(fs.readFileSync(helperPath)),model:body.model,maxTokens:body.max_tokens,sourceHead:'64fb8949bf5134f96fda02df0d4f52ac291a6138',artifactManifestSha256:config.artifactManifestSha256,accountBindingRef:account.bindingName,requestFile:bodyFile,rawOutputFile:path.join(attemptPath,'response.raw')});
 if(sha(fs.readFileSync(desc.executable))!==desc.executableSha256)fail('NATIVE_EXECUTABLE_DRIFT');
 write(path.join(attemptPath,'command.json'),desc);
 let credentialConfig;try{credentialConfig=execFileSync(ps,['-NoProfile','-File',path.join(here,'key-to-curl-stdin.ps1')],{encoding:'utf8',maxBuffer:2048,windowsHide:true,stdio:['ignore','pipe','pipe']})}catch{fail('NAMED_CREDENTIAL_RESOLUTION_FAILED')}
 if(!/^header = "x-api-key: sk-ant-[A-Za-z0-9_-]{20,300}"\r?\nheader = "anthropic-workspace-id: wrkspc_01Ddkc7MrJwHXBnjszr5fDrk"\r?\n$/.test(credentialConfig))fail('CREDENTIAL_CONFIG_REFUSED');
 const rawFd=fs.openSync(desc.rawOutputFile,'wx',0o600);
 write(path.join(attemptPath,'send-intent.json'),{at:new Date().toISOString(),requestSha256:config.requestSha256,reservationUsd:reserved,kind:'finite-native-bootstrap; not Runtime',retries:0,continuations:0});
 const started=Date.now();
 const transport=await new Promise(resolve=>{
  let child,done=false,reason=null,rawBytes=0,stderrBytes=0,stderr='',idle,cleanup;const chunks=[];
  const finish=(exitCode,signal)=>{if(done)return;done=true;clearTimeout(deadline);clearTimeout(idle);clearTimeout(cleanup);try{fs.fsyncSync(rawFd)}catch{reason='CAPTURE_WRITE_FAILED'}fs.closeSync(rawFd);const match=/NATIVE_STATUS:(\d{3}):(\d+):(\d+)/.exec(stderr);resolve({exitCode,signal,reason,rawBytes,elapsedMs:Date.now()-started,statusCode:match?Number(match[1]):null,redirects:match?Number(match[2]):null,connections:match?Number(match[3]):null,raw:Buffer.concat(chunks)})};
  const stop=code=>{if(done||reason)return;reason=code;child?.kill();cleanup=setTimeout(()=>finish(null,null),5000)};
  const resetIdle=()=>{clearTimeout(idle);idle=setTimeout(()=>stop('IDLE_TIMEOUT'),120000)};
  const deadline=setTimeout(()=>stop('DEADLINE_EXCEEDED'),600000);
  try{child=spawn(desc.executable,desc.argv,{shell:false,windowsHide:true,stdio:['pipe','pipe','pipe'],env:{SystemRoot:'C:\\Windows'}});child.on('error',()=>{reason='SPAWN_FAILED';finish(null,null)});child.on('close',finish);resetIdle();
   child.stdout.on('data',chunk=>{if(done||reason)return;resetIdle();const part=chunk.subarray(0,2097152-rawBytes);try{fs.writeFileSync(rawFd,part)}catch{stop('CAPTURE_WRITE_FAILED');return}chunks.push(part);rawBytes+=part.length;if(part.length!==chunk.length)stop('CAPTURE_LIMIT')});
   child.stderr.on('data',chunk=>{stderrBytes+=chunk.length;if(stderrBytes>16384)stop('STDERR_LIMIT');else stderr+=chunk.toString('utf8')});
   child.stdin.on('error',()=>stop('STDIN_FAILED'));child.stdin.end(credentialConfig);credentialConfig=null;
  }catch{credentialConfig=null;reason='SPAWN_FAILED';finish(null,null)}
 });
 let parsed=null,parseCode=null;try{parsed=inspectNativeCapture(transport.raw,{model:body.model,maxTokens:body.max_tokens,requiredCoverage:config.requiredCoverage})}catch(error){parseCode=/^[A-Z0-9_]+$/.test(error.message)?error.message:'CAPTURE_PARSE_FAILED'}
 const complete=transport.exitCode===0&&!transport.reason&&transport.statusCode===200&&parsed?.complete===true;
 const usage=parsed?.usage??null;
 let provisional=null;
 if(complete&&Number.isSafeInteger(usage?.input_tokens)&&Number.isSafeInteger(usage?.output_tokens)&&usage.output_tokens<=body.max_tokens){const cacheRead=usage.cache_read_input_tokens??0,cacheWrite=usage.cache_creation_input_tokens??0;provisional=Math.ceil((usage.input_tokens*4+usage.output_tokens*20+cacheRead*0.2+cacheWrite*8)/1e6*1.1*1e6)/1e6;if(provisional>reserved)provisional=null;}
 const {raw,...transportMeta}=transport;
 const result={schema:'pantheon.native-bootstrap-result.v1',attemptId:config.attemptId,at:new Date().toISOString(),transport:transportMeta,rawResponseSha256:sha(raw),parseCode,delivery:complete?'complete':'unknown',reviewAcceptance:'held-for-independent-evidence-triage',capture:parsed,accounting:{preflightEstimate:null,reservedExposureUsd:reserved,providerReportedUsage:usage,localPricingMethod:'standard first-party registry rates; 10% buffer; cache creation conservatively priced at 1h',provisionalExposureUsd:provisional,billedCost:null,invoiceReconciled:false}};
 write(path.join(attemptPath,'result.json'),result);
 if(parsed?.review)write(path.join(attemptPath,'review.json'),parsed.review);
 console.log(JSON.stringify({attemptId:config.attemptId,delivery:result.delivery,httpStatus:transport.statusCode,parseCode,providerRequestId:parsed?.requestId??null,stopReason:parsed?.stopReason??null,reviewVerdict:parsed?.review?.verdict??null,provisionalExposureUsd:provisional,reservedExposureUsd:reserved,billedCost:null},null,2));
}catch(error){if(claimed&&!fs.existsSync(path.join(attemptPath,'result.json')))write(path.join(attemptPath,'local-failure.json'),{code:/^[A-Z0-9_]+$/.test(error.message)?error.message:'LOCAL_FAILURE',at:new Date().toISOString(),retainFullReservation:true,retryAllowed:false});throw Error(/^[A-Z0-9_]+$/.test(error.message)?error.message:'BOOTSTRAP_HELD');}
finally{fs.closeSync(lockFd);fs.unlinkSync(sendLock)}
