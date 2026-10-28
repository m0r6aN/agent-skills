# Synthetic local container probe, no provider calls, pulls, mounts or host changes.
$ErrorActionPreference = 'Stop'
$probeName = 'pantheon-isolation-probe-01a15424-' + (Get-Date -AsUTC -Format yyyyMMddHHmmss)
$alreadyThere = docker ps -a --filter "name=^/$probeName$" --format '{{.Names}}'
if ($alreadyThere) { throw 'Probe name collision; no container removed.' }
$imageId = docker image inspect node:24-bookworm-slim --format '{{.Id}}'
if ($LASTEXITCODE -ne 0) { throw 'Pinned local image unavailable; no pull.' }
$probe = @'
const fs=require('fs');const assert=require('assert/strict');
const status=fs.readFileSync('/proc/self/status','utf8');
const checks={nonroot:process.getuid()===65534,capabilitiesDropped:/CapEff:\s+0+\n/.test(status),
 noNewPrivileges:/NoNewPrivs:\s+1/.test(status),seccomp:/Seccomp:\s+2/.test(status),
 noDockerSocket:!fs.existsSync('/var/run/docker.sock'),noHostWorkspace:!fs.existsSync('/host')&&!fs.existsSync('/mnt/c'),
 networkIsLoopbackOnly:fs.readdirSync('/sys/class/net').every(x=>x==='lo'),
 pidsLimited:fs.readFileSync('/sys/fs/cgroup/pids.max','utf8').trim()==='64',
 memoryLimited:fs.readFileSync('/sys/fs/cgroup/memory.max','utf8').trim()==='134217728'};
try{fs.writeFileSync('/root-write-test','denied');checks.rootReadOnly=false}catch(e){checks.rootReadOnly=['EROFS','EACCES'].includes(e.code)}
fs.writeFileSync('/tmp/probe','ok');checks.tmpfsWritable=fs.readFileSync('/tmp/probe','utf8')==='ok';
console.log(JSON.stringify({kind:'synthetic-container-boundary-probe',checks},null,2));
assert(Object.values(checks).every(Boolean));
'@
$probe | docker run --rm --pull never --name $probeName --label managed-by=local-agent --label purpose=pantheon-isolation-probe --network none --read-only --user 65534:65534 --cap-drop ALL --security-opt no-new-privileges:true --pids-limit 64 --memory 128m --cpus 0.5 --tmpfs /tmp:rw,noexec,nosuid,size=8m -i $imageId node -
if ($LASTEXITCODE -ne 0) { throw 'Isolation probe failed.' }
[PSCustomObject]@{name=$probeName;image=$imageId;recordedAt=(Get-Date -AsUTC -Format o);limitations='No kernel-escape, malicious-host, VM isolation, Runtime admission or production proof.'} | ConvertTo-Json
