// Local evidence pinning only. Does not sign, ratify, admit, send or mutate source.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const f='D:/Repos/agent-skills/plugins/foreman-line';
const r='D:/Repos/keon-omega/keon-systems';
const sources=[
 `${f}/docs/goals/pantheon-incarnation-v0/charter.md`,`${f}/docs/goals/pantheon-incarnation-v0/amendment-01-early-development-device-PROPOSED.md`,
 `${f}/docs/goals/pantheon-incarnation-v0/RESUME.md`,`${f}/docs/goals/pantheon-incarnation-v0/gate-record.md`,`${f}/docs/goals/pantheon-incarnation-v0/resume-20261019-01a15394.md`,
 `${f}/docs/COORDINATOR-PATTERN.md`,`${f}/docs/SPEC-CONVENTION.md`,`${f}/approval/src/cli.ts`,
 `${f}/dispatch/src/pmc-launch/pi-runtime-port.ts`,`${f}/dispatch/src/pmc-launch/recovery-admission.ts`,`${f}/dispatch/src/pmc-launch/ledger.ts`,
 `${f}/kernel-state/README.md`,`${f}/kernel-lease/README.md`,
 `${r}/src/Keon.Runtime.Api/LaunchReadiness.cs`,`${r}/src/Keon.Runtime.Api/Program.cs`,
 `${r}/src/Keon.Runtime/Execution/ExecutionDispatcher.cs`,`${r}/src/Keon.Contracts/Authority/AuthorityBinding.cs`,
 'D:/Repos/keon-omega/keon-mcp-gateway/src/Keon.McpGateway/Backends/CortexClient.cs',
 'D:/Repos/keon-omega/keon-cortex/src/keon/cortex/api.py'
];
const sourceManifest={recordedAt:new Date().toISOString(),kind:'source-byte-pins-not-clean-release-attestation',files:sources.map(p=>{const b=fs.readFileSync(p);return{path:p,bytes:b.length,sha256:sha(b)}})};
fs.writeFileSync(path.join(dir,'evidence/source-manifest.json'),JSON.stringify(sourceManifest,null,2)+'\n');
const files=[];
function walk(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const full=path.join(p,e.name);if(e.isDirectory())walk(full);else if(e.isFile()){const rel=path.relative(dir,full).replaceAll('\\','/');if(['package-manifest.json','package-manifest.sha256'].includes(rel))continue;const b=fs.readFileSync(full);files.push({path:rel,bytes:b.length,sha256:sha(b)})}}}
walk(dir);files.sort((a,b)=>a.path.localeCompare(b.path));
const manifest={schema:'pantheon.execution-package-manifest.v1',id:'OM-PAN-001',status:'PROPOSED',recordedAt:new Date().toISOString(),ratificationRef:null,files};
const bytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(path.join(dir,'package-manifest.json'),bytes);fs.writeFileSync(path.join(dir,'package-manifest.sha256'),sha(bytes)+'\n');
console.log(JSON.stringify({files:files.length,sourcePins:sources.length,manifestSha256:sha(bytes),ratified:false},null,2));
