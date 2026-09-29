from pathlib import Path
import subprocess,json,hashlib,yaml,re,datetime
out=Path(__file__).parent
root=Path('D:/Repos/agent-skills-worktrees/fk-p0-r31-source-adoption-20260907')
pkg='plugins/foreman-line/authority-registry'
e=root/'plugins/foreman-line/docs/goals/foreman-kernel/evidence/20260907/r31'
git=lambda *a:subprocess.check_output(['git',*a],cwd=root)
sha=lambda b:hashlib.sha256(b).hexdigest()
head=git('rev-parse','HEAD').decode().strip();assert head=='1747c1df7dfa4677d345390ac673c3d15c82b980'
assert not git('status','--porcelain')
m=json.loads((e/'evidence-manifest.json').read_bytes())
for f in m['files']:
 b=(root/f['path']).read_bytes();g=git('show',head+':'+f['path']);assert sha(b)==f['workingByteSha256'];assert sha(g)==f['gitBlobByteSha256'];assert len(b)==f['workingBytes'];assert len(g)==f['gitBlobBytes']
assert sha((e/'evidence-manifest.json').read_bytes())=='ac3a1e42e9a6706eca632533f496a199fa75b3bf4040bd1a4354824f5495adb3'
assert not git('diff','2fc39405988df4d7073f20d69b65a276329be83d','HEAD','--',pkg)
changed=git('diff','--name-only','c35ff72','HEAD','--',pkg).decode().splitlines();assert len(changed)==9
a=yaml.safe_load((root/pkg/'authority-enforcement-registry.yaml').read_bytes());b=yaml.safe_load(git('show','c35ff72:'+pkg+'/authority-enforcement-registry.yaml'))
assert (root/pkg/'authority-enforcement-registry.yaml').read_bytes()==(root/pkg/'tests/fixtures/pass-minimal.yaml').read_bytes()
contract=json.loads((e/'04-step0-proposed-contract.json').read_bytes());correspond=json.loads((e/'06-complete-item-correspondence.json').read_bytes());migration=json.loads((e/'09-exact-migration-proposal.json').read_bytes())
assert a['reconciliations'][:20]==b['reconciliations'];assert a['reconciliations'][20]==migration['record']
assert a['normativeMarkdownAudit']==b['normativeMarkdownAudit']+contract['audit']
oldrules={r['ruleId']:r for r in b['rules']};newrules={r['ruleId']:r for r in a['rules']}
assert set(newrules)-set(oldrules)=={contract['newRule']['ruleId']};assert not set(oldrules)-set(newrules)
assert newrules[contract['newRule']['ruleId']]==contract['newRule'];assert newrules[contract['thesisAfter']['ruleId']]==contract['thesisAfter']
assert [k for k in oldrules if oldrules[k]!=newrules[k]]==[contract['thesisAfter']['ruleId']]
rows={(r['sourceId'],r['itemId']):r for r in correspond['rows']};assert len(rows)==176
olditems={(s['sourceId'],i['itemId']):i for s in b['sources'] for i in s['inventoryItems']}
newitems={(s['sourceId'],i['itemId']):i for s in a['sources'] for i in s['inventoryItems']}
assert len(newitems)==1585;assert set(olditems)<=set(newitems)
for k,i in newitems.items():
 expected=rows[k]['expectedAfter'] if k in rows else olditems[k]
 for field in ['locator','normalizedExcerpt','valueDigest','ruleIds','exclusionDisposition']:assert i[field]==expected[field],(k,field)
sourcechanges=[]
for s in a['sources']:
 raw=git('show',a['sourceSnapshotCommit']+':'+s['path']);assert raw==(root/s['path']).read_bytes();assert sha(raw)==s['snapshotEvidence']['fullFileSha256']
 if raw!=git('show',b['sourceSnapshotCommit']+':'+s['path']):sourcechanges.append(s['sourceId'])
assert sorted(sourcechanges)==['foreman-line-plan','standing-constraints']
for f in ['operationAuthority','volatileRegions']:assert a[f]==b[f]
for s in a['sources']:
 prior=next(x for x in b['sources'] if x['sourceId']==s['sourceId'])
 assert s['authorityEffect']==prior['authorityEffect']
checks=[]
for n in range(34,48):
 f=next(e.glob(f'{n:02d}-*.metadata.json'));d=json.loads(f.read_bytes());assert d['directExit']==0;checks.append({'file':f.name,'metadata':d})
assert json.loads((e/'28-full-test.metadata.json').read_bytes())['directExit']==1
log=(e/'36-full-test.log').read_text(encoding='utf-8-sig');counts={}
for key in ['tests','pass','fail','cancelled','skipped','todo']:
 values=[int(x) for x in re.findall(r'^.*?'+key+r' (\d+)\s*$',log,re.M)];counts[key]=values
assert sum(counts['tests'])==751;assert sum(counts['pass'])==751
for k in ['fail','cancelled','skipped','todo']:assert sum(counts[k])==0
assert not git('status','--porcelain')
result=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),head=head,clean=True,manifestFiles=len(m['files']),manifestSha256=sha((e/'evidence-manifest.json').read_bytes()),changedPackageFiles=changed,sourceChanges=sourcechanges,itemCount=len(newitems),correspondenceRows=len(rows),preservedOtherItems=len(newitems)-len(rows),rules=len(newrules),audit=len(a['normativeMarkdownAudit']),historicalRecords=20,counts=counts,checks=checks)
(out/'verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
