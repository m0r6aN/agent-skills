import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
const root = resolve(process.cwd(), '../../..')
const packagePrefix = 'plugins/foreman-line/authority-registry/'
const goalPrefix = 'plugins/foreman-line/docs/goals/foreman-kernel/'
const evidencePrefix = goalPrefix + 'evidence/20260907/r31/'
const manifestPath = evidencePrefix + 'evidence-manifest.json'
const git = (...args) => execFileSync('git', args, {cwd:root,maxBuffer:64*1024*1024})
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const integrity = JSON.parse(readFileSync(join(root,evidencePrefix,'final-integrity.json'),'utf8'))
const paths = git('ls-files','--',packagePrefix,evidencePrefix,goalPrefix+'R31*',goalPrefix+'FK-P0-amendment-R31.md').toString('utf8').trim().split('\n')
paths.push(...integrity.sourceFiles.map(row=>row.path))
const files = [...new Set(paths)].filter(path=>path && path!==manifestPath).sort().map(path=>{
  const working = readFileSync(join(root,path))
  const staged = git('show', ':'+path)
  return {path,workingByteSha256:digest(working),gitBlobByteSha256:digest(staged),workingBytes:working.length,gitBlobBytes:staged.length}
})
const manifest = {codeCheckpoint:integrity.codeCheckpoint,sourceSnapshot:integrity.sourceCommit,semantics:'SHA256 of exact raw working bytes and staged Git blob bytes, separately. Covers all package files, eighteen sources, R31 metadata and complete R31 evidence. Excludes this manifest to avoid self-reference. Windows CRLF logs remain raw; Git text normalization is separately represented.',files}
writeFileSync(join(root,manifestPath),JSON.stringify(manifest,null,2)+'\n')
process.stdout.write(JSON.stringify({files:files.length,manifestWorkingSha256:digest(readFileSync(join(root,manifestPath)))})+'\n')