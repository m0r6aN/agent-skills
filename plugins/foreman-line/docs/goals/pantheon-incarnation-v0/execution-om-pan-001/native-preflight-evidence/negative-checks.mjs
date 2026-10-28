// Independent no-secret pure-parser checks. Does not import or execute the live wrapper.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {inspectNativeCapture} from '../native-sender/native-sender.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.dirname(here);
const model='claude-opus-5-5';
const expected={model,maxTokens:32768,requiredCoverage:['synthetic-transport']};
const event=(type,fields={})=>`event: ${type}\ndata: ${JSON.stringify({type,...fields})}\n\n`;
const review={reviewText:'Independent fabricated transport fixture with deliberately long visible review text. This exercises parser state without any provider, credential, account, or network interaction and cannot establish live execution.',verdict:'pass',findings:[],coverage:['synthetic-transport'],limitations:['Fabricated offline fixture.']};
const raw=(payload=review,extra='')=>Buffer.from('HTTP/1.1 200 OK\r\ncontent-type: text/event-stream\r\nrequest-id: req_independent_fixture\r\n\r\n'+
event('message_start',{message:{type:'message',role:'assistant',id:'msg_fixture',model,content:[],usage:{input_tokens:90,output_tokens:1}}})+
event('content_block_start',{index:0,content_block:{type:'text',text:''}})+
event('content_block_delta',{index:0,delta:{type:'text_delta',text:JSON.stringify(payload)}})+
event('content_block_stop',{index:0})+
event('message_delta',{delta:{stop_reason:'end_turn'},usage:{output_tokens:200}})+event('message_stop')+extra);
const cases=[];
const plan=JSON.parse(fs.readFileSync(path.join(root,'attempt-specs/plan-review.json'),'utf8'));
let emptyError;try{inspectNativeCapture(raw(),{...expected,requiredCoverage:plan.requiredCoverage})}catch(e){emptyError=e.message}
assert.equal(emptyError,'CAPTURE_EXPECTATIONS_REFUSED');
cases.push({id:'N01',finding:'NP-01',observed:emptyError,meaning:'Current plan spec fails the actual parser interface.'});
const malformed=inspectNativeCapture(raw(review,'event: ping\ndata: not-json\n\n'),expected);
assert.equal(malformed.complete,true);assert.equal(malformed.error,'SSE_MALFORMED');
const wrapperComplete=(p)=>0===0&&!null&&200===200&&p?.complete===true;
assert.equal(wrapperComplete(malformed),true);
cases.push({id:'N02',finding:'NP-02',observed:{complete:malformed.complete,error:malformed.error,wrapperComplete:wrapperComplete(malformed),usage:malformed.usage},meaning:'Malformed trailing stream is classified complete by the wrapper and its retained counters are eligible for provisional exposure reduction.'});
const empty=inspectNativeCapture(raw({...review,reviewText:''}),expected);
assert.equal(empty.complete,true);assert.equal(empty.error,'REVIEW_CONTRACT_INVALID');assert.equal(empty.review,null);
cases.push({id:'N03',finding:'NP-02',observed:{complete:empty.complete,error:empty.error,wrapperComplete:wrapperComplete(empty),review:empty.review},meaning:'A complete but unusable review is not explicitly failed by the wrapper; parseCode would remain null.'});
const now=Date.now();assert.equal(now>=Date.parse('invalid'),false);assert.equal(now-Date.parse('invalid')>3600000,false);
cases.push({id:'N04',finding:'NP-05',observed:{invalidActivationExpiryDenied:now>=Date.parse('invalid'),invalidAccountFreshnessDenied:now-Date.parse('invalid')>3600000},meaning:'NaN timestamps fail open in the existing wrapper freshness expressions.'});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const record=JSON.parse(fs.readFileSync(path.join(root,'owner-ratification.json'),'utf8'));
const rawRecord=fs.readFileSync(record.ratification.transcript,'utf8').split(/\r?\n/)[record.ratification.line-1];
const parsed=JSON.parse(rawRecord);
assert.equal(sha(rawRecord),record.ratification.rawRecordSha256);assert.equal(parsed.type,'response_item');assert.equal(parsed.payload.role,'user');
const manifestPath=path.join(root,'../autonomy-20261019/package-manifest.json');
assert.equal(sha(fs.readFileSync(manifestPath)),record.packageManifestSha256);
const helperVerification=JSON.parse(fs.readFileSync(path.join(root,'native-sender/verification.json'),'utf8'));
const helperPins=helperVerification.files.map(f=>({path:f.path,match:sha(fs.readFileSync(path.join(root,'native-sender',f.path)))===f.sha256}));
assert.ok(helperPins.every(x=>x.match));
const result={schema:'pantheon.independent-native-negative-checks.v1',authorSessionId:'/root/foreman_rules',at:new Date().toISOString(),liveCalls:0,credentialLookups:0,networkCalls:0,liveWrapperExecuted:false,cases,ratificationRawPinVerified:true,userRoleVerified:true,sealedPackageManifestPinVerified:true,helperReportedFilesVerified:helperPins,builderReportedTests:{passed:helperVerification.test.passed,runByThisReviewer:false}};
fs.writeFileSync(path.join(here,'negative-checks.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
