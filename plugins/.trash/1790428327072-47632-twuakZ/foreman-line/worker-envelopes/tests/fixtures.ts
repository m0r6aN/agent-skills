/**
 * Shared canonical fixtures used across this package's tests. Both fixtures
 * populate EVERY field, including every optional one -- this is the basis
 * of `full-population.test.ts`'s substitute guarantee for the "typed source
 * cannot drift from its schema" claim (see that file's doc-comment for why).
 */

import type { ResultEnvelope } from '../src/result-envelope.js'
import type { TaskEnvelope } from '../src/task-envelope.js'

export const fullTaskEnvelope: TaskEnvelope = {
  apiVersion: 'worker.kaseya/v1',
  taskId: 'task-0001',
  goalId: 'heterogeneous-agent-worker-fabric',
  parcelId: 'WF-P2',
  parentTaskId: 'task-0000',
  role: 'builder',
  taskType: 'implementation',
  riskClass: 'R3',
  requiredCapabilities: ['typescript'],
  requiredModality: ['text'],
  allowedTools: ['bash', 'edit'],
  allowedFiles: ['plugins/foreman-line/worker-envelopes/**'],
  forbiddenSurfaces: ['plugins/foreman-line/role-authority/**'],
  inputRefs: ['docs/specs/active/WF-P2-task-result-envelopes.md'],
  inputDigest: 'sha256:'.padEnd(71, '0'),
  acceptanceCriteria: ['AC1', 'AC2'],
  verificationPlan: 'npx tsc --noEmit && npx tsx --test tests/*.test.ts',
  evidenceRequirements: ['exit codes for tsc/test/biome'],
  budget: {
    maxInputTokens: 500000,
    maxOutputTokens: 64000,
    maxWallTimeSeconds: 3600,
    maxCostUsd: 5,
    maxParallelChildren: 0,
  },
  routing: {
    preferredModel: 'claude-sonnet-5',
    fallbackModels: ['claude-opus-5'],
    diversityRequired: true,
    escalationTarget: 'coordinator',
  },
}

export const fullResultEnvelope: ResultEnvelope = {
  apiVersion: 'worker-result.kaseya/v1',
  taskId: 'task-0001',
  role: 'builder',
  modelRef: 'claude-sonnet-5',
  status: 'COMPLETED',
  summary: 'Built worker-envelopes package per WF-P2 contract.',
  requirements: {
    satisfied: ['AC1', 'AC2'],
    unsatisfied: [],
    uncertain: [],
  },
  changedSurfaces: ['plugins/foreman-line/worker-envelopes/src/index.ts'],
  commandsExecuted: ['npm test'],
  tests: {
    passed: ['parity.test.ts'],
    failed: [],
    notRun: [],
  },
  evidence: ['npm test exit 0'],
  uncertainties: ['none'],
  confidenceSignal: 'high',
  recommendedEscalation: 'none',
  usage: {
    inputTokens: 12000,
    outputTokens: 3400,
    wallTimeMs: 45000,
    estimatedCostUsd: 0.42,
  },
  outputDigest: 'sha256:'.padEnd(71, '1'),
}
