from pathlib import Path
import subprocess,json,hashlib,datetime,time
p=Path(__file__).parent
script=p/'probe.mjs'
argv=['D:/nodejs_symlinks/node.exe','--import','tsx','--input-type=module']
cwd='D:/Repos/agent-skills-worktrees/fk-p0-r31-source-adoption-20260907/plugins/foreman-line/authority-registry'
start=datetime.datetime.now(datetime.timezone.utc); t=time.monotonic()
r=subprocess.run(argv,input=script.read_bytes(),cwd=cwd,capture_output=True)
end=datetime.datetime.now(datetime.timezone.utc)
(p/'stdout.json').write_bytes(r.stdout);(p/'stderr.log').write_bytes(r.stderr)
m=dict(argv=argv,cwd=cwd,start=start.isoformat(),end=end.isoformat(),elapsedSeconds=time.monotonic()-t,directExit=r.returncode,scriptSha256=hashlib.sha256(script.read_bytes()).hexdigest(),stdoutSha256=hashlib.sha256(r.stdout).hexdigest(),stderrSha256=hashlib.sha256(r.stderr).hexdigest())
(p/'metadata.json').write_text(json.dumps(m,indent=2)+'\n',encoding='utf-8');print(json.dumps(m));print(r.stderr.decode(errors='replace'))
