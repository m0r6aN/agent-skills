import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const destination = path.join(root, 'runtime-baseline-3da1a87');
const repository = 'D:/Repos/keon-omega/keon-systems';
const commit = '3da1a87f1519e1661b26059bfc773a446cc763f4';
const paths = [
  'src/Keon.Runtime.Api/LaunchReadiness.cs',
  'src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs',
  'src/Keon.Verify/AtomicEffectSpendTransaction.cs',
  'src/Keon.Runtime/Observability/Persistence/DependencyInjection/ReceiptPersistenceServiceCollectionExtensions.cs',
];
fs.mkdirSync(destination, { recursive: true });
const files = paths.map(source => {
  const bytes = execFileSync('git', ['show', `${commit}:${source}`], { cwd: repository, maxBuffer: 1048576, timeout: 30000, windowsHide: true });
  const output = path.join(destination, path.basename(source));
  fs.writeFileSync(output, bytes, { flag: 'wx' });
  return { source, commit, path: output.replaceAll('\\', '/'), bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
});
fs.writeFileSync(path.join(destination, 'manifest.json'), JSON.stringify({ schema: 'pantheon.source-snapshot.v1', observedAt: new Date().toISOString(), repository, commit, source: 'git show exact remote-observed commit; no working-tree checkout change', files }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ commit, files: files.length, bytes: files.reduce((n, f) => n + f.bytes, 0) }));
