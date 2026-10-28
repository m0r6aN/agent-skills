// Preparation only. No authority, credential, network, or send operation.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = filename => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const prior = path.join(here, 'amended-plan-review-r2');
const output = path.join(here, 'amended-plan-review-r3');
if (fs.existsSync(output)) throw Error('R3_ALREADY_FROZEN');
const old = read(path.join(prior, 'manifest.json'));
const oldPacket = fs.readFileSync(path.join(prior, 'packet.md'));
const oldRequest = fs.readFileSync(path.join(prior, 'request.json'));
if (sha(oldPacket) !== old.packetSha256 || sha(oldRequest) !== old.requestSha256) throw Error('R2_DRIFT');
const snapshot = read(path.join(here, 'runtime-baseline-3da1a87/manifest.json'));
if (snapshot.commit !== '3da1a87f1519e1661b26059bfc773a446cc763f4') throw Error('BASE_REFUSED');
const additions = [{ label: 'CURRENT-BASELINE-AMENDMENT.md', file: path.join(here, 'CURRENT-BASELINE-AMENDMENT.md') },
  ...snapshot.files.map(file => ({ label: `current-runtime/${file.source}`, file: file.path, expected: file }))];
let sections = '';
const files = [...old.files];
for (const item of old.files) {
  const bytes = fs.readFileSync(item.file);
  if (sha(bytes) !== item.sha256 || bytes.length !== item.bytes) throw Error('OLD_MEMBER_DRIFT');
}
for (const item of additions) {
  const bytes = fs.readFileSync(item.file);
  if (item.expected && (sha(bytes) !== item.expected.sha256 || bytes.length !== item.expected.bytes)) throw Error('SNAPSHOT_DRIFT');
  const member = { label: item.label, file: item.file, bytes: bytes.length, sha256: sha(bytes) };
  files.push(member);
  sections += `\n---\n## Artifact ${member.label}\nSHA-256: ${member.sha256}; bytes: ${member.bytes}\n\n${bytes.toString('utf8')}\n`;
}
const text = oldPacket.toString('utf8');
const offset = text.indexOf('\n---\n## Artifact ');
if (offset < 0) throw Error('OLD_SOURCE_SECTIONS_MISSING');
const header = text.slice(0, offset) + '\nRevision R3 current-source precedence: the original local Runtime source and sealed implementation-gap descriptions are historical. CURRENT-BASELINE-AMENDMENT.md and the current-runtime source snapshots supersede those descriptions. Evaluate the refined P02/P03 reuse plan against remote-observed Runtime commit 3da1a87f1519e1661b26059bfc773a446cc763f4. The ratified authority, spending limits, preserved charter decisions and remaining proof criteria are unchanged. No R1/R2 plan request was sent.\n';
const packet = header + text.slice(offset) + sections;
const body = JSON.parse(oldRequest);
body.messages[0].content[0].text = packet;
const request = JSON.stringify(body);
const manifest = { ...old, id: 'OM-PAN-001-PLAN-R3', createdAt: new Date().toISOString(), supersedes: old.id,
  runtimeBase: snapshot.commit, previousPacketSha256: old.packetSha256, files,
  sourceSectionsSha256: sha(packet.slice(packet.indexOf('\n---\n## Artifact '))),
  packetSha256: sha(packet), packetBytes: Buffer.byteLength(packet), requestSha256: sha(request), requestBytes: Buffer.byteLength(request), attemptCreated: false };
fs.mkdirSync(output);
for (const [name, bytes] of [['packet.md', packet], ['request.json', request], ['manifest.json', JSON.stringify(manifest, null, 2) + '\n']]) fs.writeFileSync(path.join(output, name), bytes, { flag: 'wx' });
const oldConfig = read(path.join(here, 'attempt-specs/plan-review-r2.json'));
const config = { ...oldConfig, attemptId: 'om-pan-001-plan-review-r3-001', requestRef: 'amended-plan-review-r3/request.json', requestSha256: manifest.requestSha256, artifactManifestSha256: sha(fs.readFileSync(path.join(output, 'manifest.json'))) };
fs.writeFileSync(path.join(here, 'attempt-specs/plan-review-r3.json'), JSON.stringify(config, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ created: 'amended-plan-review-r3', sources: files.length, packetBytes: manifest.packetBytes, requestBytes: manifest.requestBytes, requestSha256: manifest.requestSha256, providerCalls: 0 }));
