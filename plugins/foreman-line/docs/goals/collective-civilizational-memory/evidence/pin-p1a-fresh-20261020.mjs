// Offline readiness capture; no tests, inference, external registration or worktree creation.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='D:/Repos/agent-skills', cortex='D:/Repos/keon-omega/keon-cortex';
const out=path.join(root,'plugins/foreman-line/docs/goals/collective-civilizational-memory/evidence/p1a-pins-fresh-20261020.json');
if(fs.existsSync(out)) throw Error('Capture already exists; do not overwrite');
const git=(repo,args,options={})=>execFileSync('git',['-c','core.fsmonitor=false','-C',repo,...args],{timeout:15000,...options});
const text=(repo,args)=>git(repo,args).toString().trim();
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const base=text(cortex,['rev-parse','origin/main']);
if(base!=='684785f220c066e8686e160eec2611c727582a00') throw Error('Base drift: reconcile before accepting');
const paths=['pyproject.toml','conftest.py','src/keon/cortex/envelope/taxonomy.py','src/keon/cortex/ingress/models.py','tests/test_ingress_models.py','tests/inheritance/test_inheritance.py','tests/gravity/test_contracts.py','tests/gravity/test_projection_fixtures.py','tests/test_evidence_envelope.py','tests/test_shards_v1_1.py'];
const tracked=text(cortex,['ls-tree','-r','--name-only',base]).split('\n');
paths.push(...tracked.filter(p=>p.startsWith('tests/fixtures/')||p.startsWith('src/keon/cortex/gravity/')));
const sources=[...new Set(paths)].sort().map(p=>{const b=git(cortex,['show',`${base}:${p}`]);return {path:p,gitBlob:text(cortex,['rev-parse',`${base}:${p}`]),bytes:b.length,sha256:sha(b),workingCopyMatches:fs.existsSync(path.join(cortex,p))&&sha(fs.readFileSync(path.join(cortex,p)))===sha(b)};});
const prefix='plugins/foreman-line/';
const docs=['docs/specs/active/CCM-P1A-memory-graph-contracts.md','docs/specs/active/CCM-P1B-gravity-v2-fixtures.md','docs/specs/active/CCM-P1C-collective-wire-compatibility.md','docs/specs/active/CCM-P1D-postgres-capability-check.md'].map(p=>prefix+p);
const canonical=['D:/Repos/Pantheon/docs/CONTEXT-SHAPING-DECISIONS.md','D:/Repos/Pantheon/docs/CONTEXT-SPEC-V4.txt','D:/Repos/Pantheon/docs/CONTEXT-SHAPING-HANDOFF.md'].map(p=>{const b=fs.readFileSync(p);return {path:p,bytes:b.length,sha256:sha(b)};});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ccm-index-'));
const env={...process.env,GIT_INDEX_FILE:path.join(tmp,'index')};
const parent=text(root,['rev-parse','HEAD']);
const ref='refs/heads/docs/ccm-readiness-20261020-fresh-01';
try {git(root,['show-ref','--verify','--quiet',ref]);throw Error('Readiness ref already exists');} catch(e){if(e.status!==1)throw e;}
git(root,['read-tree',parent],{env});
for(const p of docs){const blob=git(root,['hash-object','-w','--stdin'],{input:fs.readFileSync(path.join(root,p))}).toString().trim();git(root,['update-index','--add','--cacheinfo',`100644,${blob},${p}`],{env});}
const tree=git(root,['write-tree'],{env}).toString().trim();
const commit=git(root,['commit-tree',tree,'-p',parent,'-m','docs(ccm): pin bounded R06 corrected draft work orders (coordinator readiness; not Gate 2)']).toString().trim();
git(root,['update-ref',ref,commit,'0000000000000000000000000000000000000000']);
const result={observedAt:new Date().toISOString(),coordinator:'ccm-coordinator-20261020-fresh-01',scope:'Offline identities and local docs-only snapshot; not implementation/test/registration/admission evidence',cortex:{repo:cortex,acceptedLocalBase:base,baseSource:'local origin/main tracking ref; remote freshness not queried',head:text(cortex,['rev-parse','HEAD']),sources},workOrder:{repo:root,ref,commit,parent,changedPaths:text(root,['diff-tree','--no-commit-id','--name-only','-r',commit]).split('\n'),specs:docs.map(p=>({path:p,sha256:sha(fs.readFileSync(path.join(root,p)))})),status:'draft; registration/promotion requires a new pinned approved revision'},canonical,testExecution:'NOT RUN; pre-P1A baseline outputs still required',rootIndexAndCheckout:'not modified; temporary alternate index only',worktree:'D:/Repos/ccm-worktrees/cortex-p1a (reserved name only; not created)',branch:'feat/ccm-p1a-contracts (not created)'};
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({output:out,commit,base,sourceCount:sources.length,allWorkingCopyMatches:sources.every(s=>s.workingCopyMatches),changedPaths:result.workOrder.changedPaths},null,2));
