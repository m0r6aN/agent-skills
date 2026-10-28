// P00 R2 preparation only; never executes requests, resolves credentials or changes originals.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import{fileURLToPath}from'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),dir=path.join(here,'attempt-specs'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const old=JSON.parse(fs.readFileSync(path.join(dir,'qualification.json'))),oldBytes=fs.readFileSync(path.join(dir,'qualification-request.json'),'utf8');if(sha(oldBytes)!==old.requestSha256)throw Error('QUALIFICATION_R1_DRIFT');
const body=JSON.parse(oldBytes);body.service_tier='standard_only';body.inference_geo='global';const request=JSON.stringify(body);
const q={...old,attemptId:'om-pan-001-qualification-r2-001',parcelId:'P00',artifactId:'P00-synthetic-qualification',requestRef:'attempt-specs/qualification-r2-request.json',requestSha256:sha(request)};
const manifestBytes=fs.readFileSync(path.join(here,'amended-plan-review-r2/manifest.json')),manifest=JSON.parse(manifestBytes);
const p={attemptId:'om-pan-001-plan-review-r2-001',purpose:'plan-review',parcelId:'P00',artifactId:'P00-amended-plan-R2',requestRef:'amended-plan-review-r2/request.json',requestSha256:manifest.requestSha256,manifestRef:'amended-plan-review-r2/manifest.json',artifactManifestSha256:sha(manifestBytes),packetRef:'amended-plan-review-r2/packet.md',packetSha256:manifest.packetSha256,requiredCoverage:manifest.requiredCoverage};
for(const[name,value]of[['qualification-r2-request.json',request],['qualification-r2.json',JSON.stringify(q,null,2)+'\n'],['plan-review-r2.json',JSON.stringify(p,null,2)+'\n']])fs.writeFileSync(path.join(dir,name),value,{flag:'wx'});
console.log(JSON.stringify({prepared:['qualification-r2.json','plan-review-r2.json'],providerCalls:0,claimsCreated:0}));
