import pathlib, subprocess, json, hashlib, yaml, re, datetime
root=pathlib.Path('D:/Repos/agent-skills-worktrees/fk-p0-r31-source-adoption-20260907')
out=pathlib.Path('D:/Repos/agent-skills-worktrees/foreman-kernel-unattended-20260907/plugins/foreman-line/docs/goals/foreman-kernel/evidence/20260907/r31-final-review-identity')
p='plugins/foreman-line/authority-registry/'
e=root/'plugins/foreman-line/docs/goals/foreman-kernel/evidence/20260907/r31'
def git(*a): return subprocess.check_output(['git',*a],cwd=root)
def sha(b): return hashlib.sha256(b).hexdigest()
def canon(o): return json.dumps(o,sort_keys=True,separators=(',',':'),ensure_ascii=False)
head=git('rev-parse','HEAD').decode().strip(); assert head=='1747c1df7dfa4677d345390ac673c3d15c82b980'
assert git('status','--porcelain')==b''
full=yaml.safe_load((root/p/'authority-enforcement-registry.yaml').read_bytes())
old=yaml.safe_load(git('show','c35ff72ef45fb19d647cede6acf5a13636911db7:'+p+'authority-enforcement-registry.yaml'))
assert (root/p/'authority-enforcement-registry.yaml').read_bytes()==(root/p/'tests/fixtures/pass-minimal.yaml').read_bytes()
manifest=json.loads((e/'evidence-manifest.json').read_bytes())
for f in manifest['files']:
 assert sha((root/f['path']).read_bytes())==f['workingByteSha256'],f['path']
 assert sha(git('show',head+':'+f['path']))==f['gitBlobByteSha256'],f['path']
files=git('diff','--name-only','c35ff72',head,'--',p).decode().splitlines(); assert len(files)==9
assert git('diff','2fc39405988df4d7073f20d69b65a276329be83d',head,'--',p)==b''
changed=[]
for s,prev in zip(full['sources'],old['sources']):
 assert s['sourceId']==prev['sourceId'] and s['path']==prev['path']
 b=git('show',full['sourceSnapshotCommit']+':'+s['path'])
 assert b==(root/s['path']).read_bytes() and sha(b)==s['snapshotEvidence']['fullFileSha256']
 if b!=git('show',old['sourceSnapshotCommit']+':'+s['path']): changed.append(s['sourceId'])
 for k in s:
  if k not in ['inventoryItems','snapshotEvidence']: assert s[k]==prev[k],(s['sourceId'],k)
assert changed==['standing-constraints','foreman-line-plan']
assert full['operationAuthority']==old['operationAuthority'] and full['volatileRegions']==old['volatileRegions']
assert full['reconciliations'][:20]==old['reconciliations'] and len(full['reconciliations'])==21
proposal=json.loads((e/'09-exact-migration-proposal.json').read_bytes()); assert full['reconciliations'][20]==proposal['record']
assert sha(canon(full['reconciliations'][20]).encode())==proposal['proposedRecordCanonicalSha256']
contract=json.loads((e/'04-step0-proposed-contract.json').read_bytes())
assert full['normativeMarkdownAudit']==old['normativeMarkdownAudit']+contract['audit']
rows=json.loads((e/'06-complete-item-correspondence.json').read_bytes())['rows']; assert len(rows)==176
rowmap={(r['sourceId'],r['itemId']):r for r in rows}
olditems={(s['sourceId'],i['itemId']):i for s in old['sources'] for i in s['inventoryItems']}
items={(s['sourceId'],i['itemId']):i for s in full['sources'] for i in s['inventoryItems']}; assert len(items)==1585 and len(olditems)==1583
semanticChanges=[]; nav=0
for key,item in items.items():
 expected=rowmap[key]['expectedAfter'] if key in rowmap else olditems[key]
 for field in ['locator','normalizedExcerpt','valueDigest','ruleIds','exclusionDisposition']: assert item[field]==expected[field],(key,field)
 if key in olditems:
  before=olditems[key]
  if before['locator']!=item['locator']:nav+=1
  a=json.loads(canon(before)); b=json.loads(canon(item)); a['locator'].pop('lineHint',None);b['locator'].pop('lineHint',None)
  if a!=b: semanticChanges.append(key)
assert set(olditems)<=set(items)
assert semanticChanges==[('foreman-line-plan','item.two-gate-thesis'),('foreman-line-plan','item.483a4914f57e')]
def edges(d):return {(s['sourceId'],i['itemId'],r) for s in d['sources'] for i in s['inventoryItems'] for r in i['ruleIds']}
assert edges(full)==edges(old)|{('standing-constraints','item.constraint-14','rule.standing-constraints.constraint-14')}
refs={(ref['sourceId'],ref['itemId'],r['ruleId']) for r in full['rules'] for ref in r['sourceRefs']}; assert refs==edges(full)
for s in full['sources']:
 anchors=[(i['locator']['kind'],i['locator']['anchor']) for i in s['inventoryItems']]; assert len(anchors)==len(set(anchors)),s['sourceId']
oldrules={r['ruleId']:r for r in old['rules']}; rules={r['ruleId']:r for r in full['rules']}
assert set(rules)-set(oldrules)=={'rule.standing-constraints.constraint-14'}
assert [k for k in oldrules if oldrules[k]!=rules[k]]==['rule.foreman-line-plan.two-gate-thesis']
assert rules[contract['newRule']['ruleId']]==contract['newRule'] and rules[contract['thesisAfter']['ruleId']]==contract['thesisAfter']
for i in range(34,48):
 f=list(e.glob(f'{i}-*.metadata.json')); assert len(f)==1 and json.loads(f[0].read_bytes())['directExit']==0
log=(e/'36-full-test.log').read_text(encoding='utf-8-sig'); counts={k:sum(map(int,re.findall(r'^# '+k+r' (\d+)',log,re.M))) for k in ['tests','pass','fail','cancelled','skipped','todo']}; assert counts==dict(tests=751,pass_=751) if False else counts=={'tests':751,'pass':751,'fail':0,'cancelled':0,'skipped':0,'todo':0}
assert json.loads((e/'28-full-test.metadata.json').read_bytes())['directExit']==1
result=dict(head=head,utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),manifestEntries=len(manifest['files']),manifestSha256=sha((e/'evidence-manifest.json').read_bytes()),changedPackageFiles=files,sourceBytesMatched=18,changedSources=changed,items=len(items),affectedRows=len(rows),semanticChanges=semanticChanges,navigationOrLocatorChanges=nav,reciprocalEdges=len(refs),historicalPins=[dict(id=r['reconciliationId'],sha256=sha(canon(r).encode())) for r in old['reconciliations']],fullRunCounts=counts,clean=True)
(out/'independent-data-check.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8');print(json.dumps(result,indent=2))
