exec((__import__('pathlib').Path(__file__).parent/'data-check.py').read_text(encoding='utf-8-sig'))
from collections import Counter
coverage=json.loads((e/'final-test-coverage.json').read_bytes())
base=json.loads(git('show','c35ff72:plugins/foreman-line/docs/goals/foreman-kernel/evidence/20260907/r30/final-test-coverage.json'))['names']
names=re.findall(r'^ok \d+ - (.+)$',log,re.M);names=[n.strip() for n in names]
assert len(names)==751 and len(base)==686
remaining=Counter(names)
for name in base:
 mapped=coverage['titleMigrations'].get(name,name);assert remaining[mapped]>0;remaining[mapped]-=1
assert sum(remaining.values())==65 and all(k.startswith('R31 ') for k,n in remaining.items() if n)
assert re.search(r'DIRECT_EXIT=0\s*$',log)
record=full['reconciliations'][-1]
for ev in record['observedEvidence']:
 if ev['kind']=='git-commit':assert git('cat-file','-t',ev['reference']).strip()==b'commit' and sha(git('cat-file','-p',ev['reference']))==ev['digest']
 else:assert sha(ev['reference'].encode())==ev['digest']
blob=git('cat-file','blob',full['sourceSnapshotCommit']+':'+proposal['decisionPath']);assert sha(blob)==proposal['decisionBlobSha256']
assert b'106fd5893b1d81480cb208ae19109dfd9771bd42' in blob
assert sha(proposal['decisionInputCanonicalJson'].encode())==proposal['decisionInputDigest']
for number in [40,41]:
 m=json.loads(next(e.glob(str(number)+'-*.metadata.json')).read_bytes());assert m['before']==m['after'] and m['artifactAndLockBytesUnchanged']
summary=dict(decisionBlobSha256=sha(blob),gitObjectEvidenceMatched=2,diagnosticTupleMatched=True,priorNamedControls=686,newNamedControls=65,completePassMarkers=751,idempotencePasses=2,clean=git('status','--porcelain')==b'')
(out/'supplemental-check.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf8');print(json.dumps(summary))
