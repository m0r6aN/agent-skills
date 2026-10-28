// P00 R2 preparation only. Original frozen bytes and every source section remain unchanged.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import{fileURLToPath}from'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const coverage=['intent preservation','first-proof isolation','independent verification','Runtime authority/enforcement','credential/identity boundary','cumulative budget and unknown sends','crash/succession/fencing','Cortex versus transactional state','bootstrap dependency and limits','merge rules','two-machine scope','human interruptions','missing dependencies','unnecessary complexity'];
const prior=path.join(here,'amended-plan-review'),out=path.join(here,'amended-plan-review-r2');if(fs.existsSync(out))throw Error('R2_ALREADY_FROZEN');
const oldManifest=JSON.parse(fs.readFileSync(path.join(prior,'manifest.json'))),oldPacket=fs.readFileSync(path.join(prior,'packet.md'),'utf8'),oldRequest=fs.readFileSync(path.join(prior,'request.json'),'utf8');
if(sha(oldPacket)!==oldManifest.packetSha256||sha(oldRequest)!==oldManifest.requestSha256)throw Error('R1_DRIFT');
const offset=oldPacket.indexOf('\n---\n## Artifact ');if(offset<0)throw Error('SOURCE_SECTIONS_ABSENT');const sections=oldPacket.slice(offset);
for(const member of oldManifest.files){const bytes=fs.readFileSync(member.file);if(sha(bytes)!==member.sha256||bytes.length!==member.bytes)throw Error('SOURCE_MEMBER_DRIFT');}
const header=oldPacket.slice(0,offset).replace(/Required coverage:[^\n]*\n/,`Required coverage: ${coverage.join('; ')}.\nReturn each coverage label exactly as listed; treat missing dependencies and unnecessary complexity as separate focuses.\n`);
const packet=header+sections,body=JSON.parse(oldRequest);body.messages[0].content[0].text=packet;body.service_tier='standard_only';body.inference_geo='global';const request=JSON.stringify(body);
const manifest={...oldManifest,id:'OM-PAN-001-PLAN-R2',createdAt:new Date().toISOString(),supersedes:'OM-PAN-001-PLAN-R1',requiredCoverage:coverage,originalPacketSha256:oldManifest.packetSha256,sourceSectionsSha256:sha(sections),packetSha256:sha(packet),packetBytes:Buffer.byteLength(packet),requestSha256:sha(request),requestBytes:Buffer.byteLength(request),attemptCreated:false};
fs.mkdirSync(out);for(const[name,bytes]of[['packet.md',packet],['request.json',request],['manifest.json',JSON.stringify(manifest,null,2)+'\n']])fs.writeFileSync(path.join(out,name),bytes,{flag:'wx'});
console.log(JSON.stringify({created:'amended-plan-review-r2',coverageLabels:coverage.length,sourceSectionsUnchanged:true,providerCalls:0}));
