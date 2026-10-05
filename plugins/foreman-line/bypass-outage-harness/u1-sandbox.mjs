// U1 candidate-sandbox entrypoint (A-U1.8.20 clause 5).
//
// COORDINATOR-OWNED FIXTURE IMPLEMENTATION. The verifier workflow runs this path under a
// wrapper in the isolated candidate-sandbox job (no credentials) and compares the emitted
// u1-sandbox-result/v1 document row by row with the producer rows and the coordinator oracle.
//
// This version serves only fixture promotion requests (id begins "u1-fixture-"). It derives
// its results from the committed u1-fixture evidence in this checkout. It refuses (exit 2)
// for any other request id, so a real promotion can never be "derived" from fixture data.
// The FK-P18-prime build replaces this file with the real candidate harness entrypoint.
//
// Usage: node u1-sandbox.mjs --out <path>      (env: U1_REQUEST_ID)
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const requestId = process.env.U1_REQUEST_ID ?? ''
if (!requestId.startsWith('u1-fixture-')) {
  console.error('u1-sandbox: fixture entrypoint refuses non-fixture request id: ' + requestId)
  process.exit(2)
}
const outIndex = process.argv.indexOf('--out')
if (outIndex < 0 || !process.argv[outIndex + 1]) {
  console.error('u1-sandbox: --out <path> required')
  process.exit(2)
}
const outPath = process.argv[outIndex + 1]

const here = dirname(fileURLToPath(import.meta.url))
const evidence = join(here, 'u1-fixture', 'evidence')
const controls = JSON.parse(readFileSync(join(evidence, 'controls.json'), 'utf8')).controls
const matrix = JSON.parse(readFileSync(join(evidence, 'matrix.json'), 'utf8')).rows
const candidateCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: here, encoding: 'utf8' }).trim()

const controlResults = controls.map((c) => ({
  controlId: c.controlId,
  exitStatus: c.exitStatus,
  observedResult: c.observedResult,
  signals: [c.outputs],
}))
const invariantResults = []
for (const row of matrix) {
  for (const invariantId of row.invariantIds) {
    invariantResults.push({
      invariantId,
      rowId: row.caseId,
      exitStatus: row.exitStatus,
      observedResult: row.observedResult,
      signals: row.demonstratedRefusalClassIds,
    })
  }
}

// Negative-path variant for the A-U1.8.27 dry run: a deliberate sandbox/producer mismatch.
if (requestId.includes('sandbox-mismatch')) {
  const target = controlResults.find((c) => c.controlId === 'NC-U1-02')
  if (target) target.exitStatus = target.exitStatus === 0 ? 1 : 0
}

const result = {
  schema: 'u1-sandbox-result/v1',
  harnessExitStatus: 0,
  candidateCommit,
  invariantResults,
  controlResults,
}
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(result) + '\n')
console.log('u1-sandbox: wrote ' + outPath + ' for ' + requestId + ' at ' + candidateCommit)
