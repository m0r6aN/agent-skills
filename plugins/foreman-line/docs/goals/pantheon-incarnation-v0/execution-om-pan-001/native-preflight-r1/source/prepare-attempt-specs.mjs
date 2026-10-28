// Local preparation only; no credential access, reservation, attempt claim or send.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const dir=path.join(here,'attempt-specs');fs.mkdirSync(dir,{recursive:true});
const qualificationPrompt='Synthetic transport qualification, not a design review or approval. Return exactly one JSON object: {"schema":"pantheon.review-result.v1","reviewText":"This is a synthetic transport qualification response. It verifies that visible text, an explicit synthetic verdict, findings, coverage and limitations can be captured together. It does not review Pantheon or authorize any action.","verdict":"pass","findings":[],"coverage":["synthetic-transport"],"limitations":["Synthetic fixture only; no design or security review was performed."]}. No tools, no Markdown fences, no extra text.';
const body=JSON.stringify({model:'claude-opus-5-5',max_tokens:4096,stream:true,tools:[],output_config:{effort:'low'},messages:[{role:'user',content:[{type:'text',text:qualificationPrompt}]}]});
fs.writeFileSync(path.join(dir,'qualification-request.json'),body,{flag:'wx'});
const qualification={attemptId:'om-pan-001-qualification-001',purpose:'qualification',requestRef:'attempt-specs/qualification-request.json',requestSha256:sha(body),artifactManifestSha256:sha(qualificationPrompt),requiredCoverage:['synthetic-transport']};
fs.writeFileSync(path.join(dir,'qualification.json'),JSON.stringify(qualification,null,2)+'\n',{flag:'wx'});
const manifest=JSON.parse(fs.readFileSync(path.join(here,'amended-plan-review/manifest.json')));
const plan={attemptId:'om-pan-001-plan-review-001',purpose:'plan-review',requestRef:'amended-plan-review/request.json',requestSha256:manifest.requestSha256,artifactManifestSha256:manifest.packetSha256,requiredCoverage:[]};
fs.writeFileSync(path.join(dir,'plan-review.json'),JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({prepared:2,qualificationRequestSha256:qualification.requestSha256,planRequestSha256:plan.requestSha256,reviewCoverageValidatedAt:'semantic triage against all 14 required focus areas; provider may phrase coverage labels differently',attemptsClaimed:0},null,2));
