import pathlib,subprocess,hashlib,json,datetime,time
out=pathlib.Path(__file__).parent
script=out/'probe-repository.mjs'
argv=['D:/nodejs_symlinks/node.exe','--import','tsx','--input-type=module']
cwd='D:/Repos/agent-skills-worktrees/fk-p0-r31-source-adoption-20260907/plugins/foreman-line/authority-registry'
start=datetime.datetime.now(datetime.timezone.utc);t=time.monotonic()
r=subprocess.run(argv,cwd=cwd,input=script.read_bytes(),capture_output=True)
end=datetime.datetime.now(datetime.timezone.utc)
(out/'probe-repository.stdout.log').write_bytes(r.stdout);(out/'probe-repository.stderr.log').write_bytes(r.stderr)
m=dict(argv=argv,cwd=cwd,startUtc=start.isoformat(),endUtc=end.isoformat(),elapsedSeconds=time.monotonic()-t,directExit=r.returncode,scriptSha256=hashlib.sha256(script.read_bytes()).hexdigest(),stdoutSha256=hashlib.sha256(r.stdout).hexdigest(),stderrSha256=hashlib.sha256(r.stderr).hexdigest())
(out/'probe-repository.metadata.json').write_text(json.dumps(m,indent=2)+'\n',encoding='utf8');print(json.dumps(m));print(r.stdout.decode('utf8'));print(r.stderr.decode('utf8'));raise SystemExit(r.returncode)
