// Pure P00 decisions and a bounded watcher. No filesystem, process, credential or network execution.
import {createHash} from 'node:crypto';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const deny = code => { throw Error(code); };
export const OWNER_SESSION='01a15424-1fd5-77a2-a73a-d92a60a5de34';
export const PACKAGE_SHA='ca6645f02284dca74b17a9500ec0482552bb192e785f1d76ae0be1f4f9532f82';
export const PLAN_COVERAGE=Object.freeze(['intent preservation','first-proof isolation','independent verification','Runtime authority/enforcement','credential/identity boundary','cumulative budget and unknown sends','crash/succession/fencing','Cortex versus transactional state','bootstrap dependency and limits','merge rules','two-machine scope','human interruptions','missing dependencies','unnecessary complexity']);
export const PINS=Object.freeze({
 'attempt-specs/qualification-r2.json':'47dd1be9d7096a8ab0abb580787df11480b47bed2f4ed0d03a828e4e8b13698f',
 'attempt-specs/qualification-r2-request.json':'b4bbc5bbcf3f6a2138c2c66846027e4e06dad4652161bcd77b3a8ee4d37a415b',
 'attempt-specs/plan-review-r2.json':'025bc298715fba42012d217f35c8fe5794c3f4cf8ecb0f72bbb9b4b95227d017',
 'amended-plan-review-r2/manifest.json':'807c1093487f8937d2f58e181fd3079295471c8983d2743ea8ed44f48277246c',
 'amended-plan-review-r2/request.json':'5483950685f254aa400303c9adf5e072f7abd89f6642eca466175e151a89ba47',
 'amended-plan-review-r2/packet.md':'9e8f01b195af7d733eb371dbabb7d63d954cc63a5826de387e6e46fa7bf1aae9',
 'bootstrap-rate-evidence.json':'df697966e8ac703e78865c7d96e1fcd85192b329cc4923aadec908e628841fe0',
 'owner-ratification.json':'05e2fb7d929d360f77e278a9faef8c0edea1c2e7ab4082caea0614bab11c6b15',
 '../autonomy-20261019/package-manifest.json':PACKAGE_SHA,
 '../autonomy-20261019/model-registry.json':'a365b77ed760b95f3ec439b3291200bf2290075d53b3b46ed390b9fa3f9211e2',
});
export const CHECKED_CODE=Object.freeze(['run-bootstrap-once.mjs','bootstrap-guards.mjs','bootstrap-lock-check.ps1',
 'key-to-curl-stdin.ps1','native-sender/native-sender.mjs','prepare-amended-plan-packet.mjs','prepare-attempt-specs.mjs']);
export function decode(bytes){try{return JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));}catch{deny('JSON_REFUSED');}}
function pinned(ref,bytes){if(!Buffer.isBuffer(bytes)||!PINS[ref]||sha256(bytes)!==PINS[ref])deny('PIN_DRIFT');}
export function parseInstant(value){
 if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{1,7}(Z|\+00:00)$/.test(value))deny('TIMESTAMP_REFUSED');
 const n=Date.parse(value);if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,19)!==value.slice(0,19))deny('TIMESTAMP_REFUSED');return n;
}
export function metadataRef(state){
 const ref=state?.accountMetadataRef;if(typeof ref!=='string'||!/^account-metadata-(?:[2-9]|[1-9][0-9]+)\/qualification\.json$/.test(ref))deny('METADATA_REF_REFUSED');return ref;
}
export function credentialDigest(account){
 const digest=account?.credentialBindingCiphertextSha256;if(typeof digest!=='string'||!/^[a-f0-9]{64}$/.test(digest))deny('CREDENTIAL_DIGEST_REQUIRED');return digest;
}
export function assertCredentialContinuity(expectedDigest,account){
 if(credentialDigest({credentialBindingCiphertextSha256:expectedDigest})!==credentialDigest(account))deny('CREDENTIAL_BINDING_CHANGED');return true;
}
export function verifyMetadataEvidence(account,evidence,nowMs){
 if(!evidence||!Number.isFinite(nowMs))deny('METADATA_EVIDENCE_REQUIRED');
 for(const key of ['transportBytes','organizationBytes','modelsBytes'])if(!Buffer.isBuffer(evidence[key])||evidence[key].length>1048576)deny('METADATA_EVIDENCE_REFUSED');
 const transport=decode(evidence.transportBytes),organization=decode(evidence.organizationBytes),models=decode(evidence.modelsBytes),qualified=parseInstant(account.at);
 if(!Array.isArray(transport)||transport.length!==2)deny('METADATA_GET_PROVENANCE_REFUSED');
 for(const route of ['organization','models']){const records=transport.filter(r=>r.route===route);if(records.length!==1)deny('METADATA_GET_PROVENANCE_REFUSED');
  const r=records[0],at=parseInstant(r.recordedAtUtc);if(r.method!=='GET'||r.httpStatus!=='200'||r.curlExitCode!==0||r.stderrPresent!==false||
   at>qualified||at>nowMs||nowMs-at>3600000||sha256(evidence[route==='organization'?'organizationBytes':'modelsBytes'])!==r.responseSha256)deny('METADATA_GET_PROVENANCE_REFUSED');}
 if(organization.type!=='organization'||organization.id!=='49582c99-6fa8-4c45-9875-c21ca0ea4267'||organization.name!=='Morgan Findings LLC'||
  !Array.isArray(models.data)||models.has_more!==false)deny('METADATA_IDENTITY_REFUSED');
 for(const id of ['claude-opus-5-5','claude-sonnet-5-5']){const found=models.data.filter(m=>m.id===id);if(found.length!==1||found[0].type!=='model'||found[0].lifecycle!=='active'||found[0].max_input_tokens!==1000000||found[0].max_tokens!==128000)deny('METADATA_MODEL_REFUSED');}
 return true;
}
export function validateAttemptInput(ref,configBytes,requestBytes){
 if(!['attempt-specs/qualification-r2.json','attempt-specs/plan-review-r2.json'].includes(ref))deny('ATTEMPT_NOT_ALLOWLISTED');
 pinned(ref,configBytes);const config=decode(configBytes);pinned(config.requestRef,requestBytes);
 if(requestBytes.length>1048576||sha256(requestBytes)!==config.requestSha256||config.parcelId!=='P00')deny('REQUEST_BOUND_REFUSED');
 const body=decode(requestBytes),plan=config.purpose==='plan-review';
 const expectedCoverage=plan?PLAN_COVERAGE:['synthetic-transport'];
 if(JSON.stringify(config.requiredCoverage)!==JSON.stringify(expectedCoverage))deny('COVERAGE_REFUSED');
 const expectedKeys=['inference_geo','max_tokens','messages','model','output_config','service_tier','stream','tools'];
 if(JSON.stringify(Object.keys(body).sort())!==JSON.stringify(expectedKeys)||body.model!=='claude-opus-5-5'||body.stream!==true||
  body.service_tier!=='standard_only'||body.inference_geo!=='global'||!Array.isArray(body.tools)||body.tools.length||
  body.max_tokens!==(plan?32768:4096)||JSON.stringify(body.output_config)!==JSON.stringify({effort:plan?'high':'low'})||
  body.messages?.length!==1||body.messages[0].role!=='user'||body.messages[0].content?.length!==1||
  Object.keys(body.messages[0].content[0]).sort().join(',')!=='text,type'||body.messages[0].content[0].type!=='text')deny('REQUEST_SEMANTICS_REFUSED');
 if(!plan&&sha256(body.messages[0].content[0].text)!==config.artifactManifestSha256)deny('QUALIFICATION_CONTENT_DRIFT');
 return {config,body,expected:{model:body.model,maxTokens:body.max_tokens,requiredCoverage:[...expectedCoverage]}};
}
export function verifyPinnedBundle(blobs,packageMembers,sourceMembers){
 for(const[ref]of Object.entries(PINS))pinned(ref,blobs[ref]);
 const seal=decode(blobs['../autonomy-20261019/package-manifest.json']);
 if(!Array.isArray(seal.files)||seal.files.length!==33)deny('PACKAGE_MEMBER_SET_REFUSED');
 const seen=new Set();for(const member of seal.files){if(seen.has(member.path)||!/^[-A-Za-z0-9_./]+$/.test(member.path)||member.path.split('/').includes('..'))deny('PACKAGE_MEMBER_REFUSED');seen.add(member.path);
  const bytes=packageMembers[member.path];if(!Buffer.isBuffer(bytes)||bytes.length!==member.bytes||sha256(bytes)!==member.sha256)deny('PACKAGE_MEMBER_DRIFT');}
 const manifest=decode(blobs['amended-plan-review-r2/manifest.json']),packet=blobs['amended-plan-review-r2/packet.md'],request=blobs['amended-plan-review-r2/request.json'];
 if(manifest.packetSha256!==sha256(packet)||manifest.packetBytes!==packet.length||manifest.requestSha256!==sha256(request)||manifest.requestBytes!==request.length||
  manifest.mandateManifestSha256!==PACKAGE_SHA||JSON.stringify(manifest.requiredCoverage)!==JSON.stringify(PLAN_COVERAGE))deny('PACKET_MANIFEST_REFUSED');
 const text=packet.toString('utf8'),offset=text.indexOf('\n---\n## Artifact ');
 if(offset<0||sha256(text.slice(offset))!==manifest.sourceSectionsSha256||decode(request).messages[0].content[0].text!==text)deny('PACKET_BINDING_REFUSED');
 const labels=new Set();for(const member of manifest.files){const bytes=sourceMembers[member.file];if(labels.has(member.label)||!Buffer.isBuffer(bytes)||bytes.length!==member.bytes||sha256(bytes)!==member.sha256)deny('SOURCE_MEMBER_DRIFT');labels.add(member.label);
  if(!text.includes(`\n## Artifact ${member.label}\nSHA-256: ${member.sha256}; bytes: ${member.bytes}\n\n${bytes.toString('utf8')}\n`))deny('SOURCE_SECTION_DRIFT');}
 return true;
}
export function verifyIndependentPins(preflight,codeBlobs){
 if(preflight?.status!=='PASS'||preflight.authorSessionId===OWNER_SESSION||!preflight.authorSessionId||!preflight.reportRef||!Array.isArray(preflight.files))deny('INDEPENDENT_PREFLIGHT_REQUIRED');
 for(const ref of [...CHECKED_CODE,...Object.keys(PINS)]){const pins=preflight.files.filter(f=>f.path===ref);if(pins.length!==1||!Buffer.isBuffer(codeBlobs[ref])||sha256(codeBlobs[ref])!==pins[0].sha256)deny('INDEPENDENT_PIN_DRIFT');}
 return true;
}
export function verifyRatification(receiptBytes,rawRecord){
 pinned('owner-ratification.json',receiptBytes);const receipt=decode(receiptBytes),r=receipt.ratification;
 if(typeof rawRecord!=='string'||sha256(rawRecord)!==r.rawRecordSha256||r.rawRecordSha256!=='c0027582bd9c2642527a39e4c1bf6afe954feed729d205ac8dda8f675922bd1b')deny('RATIFICATION_SOURCE_DRIFT');
 const event=decode(Buffer.from(rawRecord)),message=(event.payload?.content??[]).map(c=>c.text??'').join('');
 if(event.type!=='response_item'||event.payload?.role!=='user'||sha256(message)!==r.messageSha256||message!==r.verbatim||r.sessionId!==OWNER_SESSION||r.line!==517||receipt.packageManifestSha256!==PACKAGE_SHA)deny('RATIFICATION_MESSAGE_REFUSED');
 return true;
}
export function validateAuthority({state,owner,account,metadataEvidence,releaseExists=false,revocationExists=false,closedExists=false,lockHeld,nowMs,purpose}){
 if(!Number.isFinite(nowMs))deny('CLOCK_REFUSED');const activated=parseInstant(state.activatedAt),expiry=parseInstant(state.expiresAt),qualified=parseInstant(account.at),started=parseInstant(owner.processStartedUtc),acquired=parseInstant(owner.acquiredAtUtc);
 if(state.status!=='RATIFIED_BOOTSTRAP_ACTIVE'||state.ownerSessionId!==OWNER_SESSION||state.packageManifestSha256!==PACKAGE_SHA||
  state.runtimeReady!==false||state.bootstrapClosed===true||state.currentParcel!=='P00'||state.autoReloadOffVerified!==true||state.accountMetadataQualified!==true||
  activated>nowMs||expiry<=nowMs||expiry<=activated||expiry>activated+14*86400000||releaseExists||revocationExists||closedExists)deny('BOOTSTRAP_AUTHORITY_INACTIVE');
 if(owner.ownerSessionId!==OWNER_SESSION||owner.host!=='M0R6AN'||!Number.isSafeInteger(owner.processId)||owner.processId<=0||started>acquired||acquired>nowMs||lockHeld!==true)deny('EXCLUSIVE_OWNER_REFUSED');
 metadataRef(state);credentialDigest(account);verifyMetadataEvidence(account,metadataEvidence,nowMs);
 if(account.schema!=='pantheon.account-metadata-qualification.v1'||account.metadataQualified!==true||account.organization!=='Morgan Findings LLC'||account.organizationId!=='49582c99-6fa8-4c45-9875-c21ca0ea4267'||account.workspaceName!=='Default'||account.workspaceId!=='wrkspc_01Ddkc7MrJwHXBnjszr5fDrk'||
  account.bindingName!=='pantheon-om-pan-001-anthropic-default'||state.credentialBindingRef!==account.bindingName||
  JSON.stringify(account.approvedModels)!==JSON.stringify(['claude-opus-5-5','claude-sonnet-5-5'])||qualified>nowMs||nowMs-qualified>3600000)deny('ACCOUNT_PREFLIGHT_STALE');
 if(purpose==='plan-review'&&state.accountQualified!==true)deny('LIVE_QUALIFICATION_REQUIRED');return {expiryMs:expiry};
}
export function validateRates(rateBytes,registryBytes,nowMs){
 if(!Number.isFinite(nowMs))deny('CLOCK_REFUSED');
 pinned('bootstrap-rate-evidence.json',rateBytes);pinned('../autonomy-20261019/model-registry.json',registryBytes);
 const rate=decode(rateBytes),registry=decode(registryBytes),model=registry.models.find(m=>m.id==='claude-opus-5-5'),at=parseInstant(rate.observedAt);
 if(at>nowMs||nowMs-at>86400000||rate.inputUsdPerMillion!==4||rate.outputUsdPerMillion!==20||rate.inputReservationTokens!==1048576||
  rate.explicitRequestTier!=='standard_only'||rate.explicitInferenceGeo!=='global'||rate.cacheControl!=='forbidden'||rate.discrepancyBufferPercent!==10||
  model?.pricing?.input!==4||model.pricing.output!==20||model.contextTokens!==1000000||!model.outputSemantics.includes.includes('reasoning')||!model.outputSemantics.includes.includes('visible text'))deny('RATE_CONTRACT_REFUSED');return rate;
}
export function assessBudget(config,liabilities,rate){
 if(config.parcelId!=='P00'||!['P00-synthetic-qualification','P00-amended-plan-R2'].includes(config.artifactId)||!Array.isArray(liabilities))deny('BUDGET_SCOPE_REFUSED');
 const reserved=Math.ceil((rate.inputReservationTokens*rate.inputUsdPerMillion+(config.purpose==='qualification'?4096:32768)*rate.outputUsdPerMillion)*110/1e6)/100;
 // Integer micro-USD for accumulation/caps; only canonical <=6-decimal monetary inputs qualify.
 const micros=value=>{const n=Math.round(value*1e6);if(!Number.isSafeInteger(n)||n/1e6!==value)deny('LIABILITY_PRECISION_REFUSED');return n;};
 const reservedMicros=micros(reserved);let total=0,parcel=0,artifactAttempts=0;const ids=new Set();
 for(const l of liabilities){if(!l||typeof l.id!=='string'||!l.id||ids.has(l.id)||typeof l.unknown!=='boolean'||!Number.isFinite(l.exposure)||l.exposure<0||l.exposure>6||!Number.isFinite(l.reserved)||l.reserved<=0||l.reserved>6||l.exposure>l.reserved||typeof l.artifactId!=='string'||typeof l.parcelId!=='string')deny('LIABILITY_RECORD_REFUSED');ids.add(l.id);
  micros(l.reserved);const exposureMicros=micros(l.exposure);
  if(l.id===config.attemptId)deny('DUPLICATE_ATTEMPT');if(l.unknown)deny('UNKNOWN_EXPOSURE_REQUIRES_RECONCILIATION');total+=exposureMicros;if(l.parcelId===config.parcelId)parcel+=exposureMicros;if(l.artifactId===config.artifactId)artifactAttempts++;}
 if(artifactAttempts>=2)deny('ARTIFACT_ATTEMPT_LIMIT');if(parcel+reservedMicros>15000000)deny('PARCEL_EXPOSURE_LIMIT');
 if(reservedMicros>6000000||liabilities.length>=16||total+reservedMicros>25000000)deny('BOOTSTRAP_BUDGET_OR_CALL_LIMIT');return {reservedExposureUsd:reserved,parcelId:config.parcelId,artifactId:config.artifactId};
}
export function classifyCapture(transport,parsed,thrownCode,expected,rate,reserved){
 const nativeComplete=transport.exitCode===0&&!transport.reason&&transport.statusCode===200&&transport.redirects===0&&transport.connections===1;
 const streamValid=nativeComplete&&parsed?.streamValid===true;
 const u=parsed?.usage??null;
 const trustedFinalUsage=streamValid&&parsed?.finalUsageValid===true&&Number.isSafeInteger(u?.input_tokens)&&u.input_tokens>=0&&u.input_tokens<=rate.inputReservationTokens&&
  Number.isSafeInteger(u.output_tokens)&&u.output_tokens>=0&&u.output_tokens<=expected.maxTokens&&
  (u.cache_read_input_tokens??0)===0&&(u.cache_creation_input_tokens??0)===0&&
  (parsed.reportedTier==null||['standard','standard_only'].includes(parsed.reportedTier))&&(parsed.reportedGeo==null||parsed.reportedGeo==='global');
 let provisional=null;if(trustedFinalUsage){provisional=Math.ceil((u.input_tokens*rate.inputUsdPerMillion+u.output_tokens*rate.outputUsdPerMillion)*110/100)/1e6;if(provisional>reserved)provisional=null;}
 const trusted=trustedFinalUsage&&provisional!==null,reviewUsable=streamValid&&parsed?.reviewUsable===true;
 return {nativeTransferComplete:nativeComplete,strictStreamValid:streamValid,finalUsageTrusted:trusted,reviewUsable,
  parseCode:thrownCode??parsed?.error??null,reviewStatus:reviewUsable?'held-for-independent-semantic-triage':'failed',
  delivery:trusted?'complete':'unknown',provisionalExposureUsd:provisional,retainFullReservation:!trusted,
  reportedTier:parsed?.reportedTier??null,pricingBasis:'pinned requested standard_only/global rates; missing response tier is not measured pricing'};
}
export function startAuthorityWatch({check,cancel,intervalMs=250,checkTimeoutMs=1000}){
 if(typeof check!=='function'||typeof cancel!=='function'||intervalMs<10||intervalMs>500||checkTimeoutMs<10||checkTimeoutMs>1000)deny('WATCH_BOUNDS_REFUSED');
 let stopped=false,timer=null,pendingTimer=null;
 const tick=async()=>{if(stopped)return;try{await Promise.race([Promise.resolve().then(check),new Promise((_,reject)=>{pendingTimer=setTimeout(()=>reject(Error('AUTHORITY_CHECK_TIMEOUT')),checkTimeoutMs);})]);}
  catch(error){if(!stopped){stopped=true;cancel(/^[A-Z0-9_]+$/.test(error.message)?error.message:'AUTHORITY_REVOKED');}}
  finally{clearTimeout(pendingTimer);if(!stopped)timer=setTimeout(tick,intervalMs);}};
 timer=setTimeout(tick,0);return()=>{stopped=true;clearTimeout(timer);clearTimeout(pendingTimer);};
}
