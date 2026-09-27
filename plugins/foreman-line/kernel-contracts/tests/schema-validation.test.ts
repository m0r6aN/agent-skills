/**
 * Schema validation: the eight closed draft-07 schemas compile with their
 * cross-file `$ref`s, accept their canonical samples, reject hostile shapes in
 * agreement with the TS validators, and the committed `schemas/*.schema.json`
 * files are byte-identical to the typed source (no drift).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { serialize } from '../../schema-scaffold/src/generate.js'
import AjvModule, { type Ajv as AjvType, type SchemaObject } from '../node_modules/ajv/dist/ajv.js'
import { allSchemaFiles } from '../src/schemas.js'
import {
  validateAuthorizeActionInput,
  validateDecisionEnvelope,
  validateGoldenVectorCase,
  validateLifecycleEvent,
  validateReadRequest,
} from '../src/validate.js'

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(here, '..')
const schemasDir = join(packageRoot, 'schemas')

// ajv's CJS surface is constructable only through its class export shape
// (same pattern as authority-registry tests).
const Ajv = AjvModule as unknown as typeof AjvType

// --- canonical samples (schema-valid documents) ----------------------------

const digestA = `sha256:${'a'.repeat(64)}` as string
const digestB = `sha256:${'b'.repeat(64)}` as string
const digestC = `sha256:${'c'.repeat(64)}` as string

const sampleLifecycleEvent = {
  event: 'preToolUse',
  apiVersion: '0.1.0',
  eventId: 'evt-pre-0001',
  sessionRef: 'sess-0001',
  hostAdapterRef: 'host-claude-win-docker',
  claimedRepositoryRef: 'repo-main',
  claimedWorktreeRef: 'wt-0001',
  actionRef: 'act-0001',
  claimedActionClass: 'read-only',
  payload: {
    toolRef: 'tool-read',
    proposedPaths: [{ rawPath: 'D:\\work\\repo\\src\\a.ts', pathForm: 'windows-drive' }],
  },
}

const sampleAdmittedContext = {
  principalKind: 'authenticated',
  principalRef: 'principal-builder-1',
  principalClass: 'builder',
  capabilityRef: 'cap-control-1',
  capabilityGeneration: 3,
  capabilityValidUntilMicros: 2000,
  capabilityRevocationRef: null,
  admissionIssuerRef: 'issuer-p13',
  admittedEndpoint: 'control',
  boundRepositoryRef: 'repo-main',
  boundWorktreeRef: 'wt-0001',
  boundSessionRef: 'sess-0001',
  permittedOperationIds: ['op-transition-1'],
  roleSelection: 'builder',
  stageSelection: 'build',
  provenanceRef: {
    provenanceId: 'prov-0001',
    hostAdapterRef: 'host-claude-win-docker',
    provenanceDigest: digestA,
  },
}

const sampleAuthorizeActionInput = {
  callerInputs: { lifecycleEvent: sampleLifecycleEvent },
  trustedBindings: {
    admittedContext: sampleAdmittedContext,
    lifecycleProvenance: {
      provenanceId: 'prov-0001',
      hostAdapterRef: 'host-claude-win-docker',
      provenanceDigest: digestA,
    },
    effectiveActionClass: 'governed-mutation',
    repositoryIdentity: { repositoryRef: 'repo-main', worktreeRef: 'wt-0001' },
    policyDigest: digestB,
    scopeDigest: digestC,
    goalRevision: 7,
    leaseState: {
      leaseId: 'lease-1',
      leaseOwnerPrincipalRef: 'principal-builder-1',
      casRevision: 4,
      leaseExpiresAtMicros: 3000,
    },
    gateEvidenceRefs: [
      { evidenceKind: 'commit-ref', gitIdentity: 'refs/heads/main', digest: digestA },
    ],
    mode: 'enforcing',
    observedEffects: [{ effectKind: 'file-write', descriptor: 'src/a.ts', digest: digestA }],
    idempotencyKey: null,
  },
}

const sampleDecisionEnvelope = {
  resultKind: 'policy-result',
  apiVersion: '0.1.0',
  toolVersion: 'kernel-contracts-0.1.0',
  decision: 'REFUSE',
  code: 'PATH_OUTSIDE_ALLOWED_FILES',
  violations: [
    { code: 'PATH_OUTSIDE_ALLOWED_FILES', invariantId: 'inv-path-scope', path: 'relativePath' },
  ],
  requestDigest: digestA,
  inputDigest: digestB,
  policyDigest: digestC,
  principal: { principalClass: 'builder', principalRef: 'principal-builder-1' },
  assurance: {
    assuranceLevel: 'mediated',
    evidence: [{ runId: 'run-1', hostAdapterRef: 'host-claude-win-docker', runDigest: digestA }],
    missingAssuranceReason: null,
  },
  obligations: [
    {
      obligationId: 'ob-1',
      kind: 'latency-recording',
      payload: { span: 'kernelDecisionLatency', elapsedMicros: 42, budgetMicros: 5000 },
    },
  ],
  goalRevision: 7,
  policyEvidence: null,
  mode: 'enforcing',
}

const sampleProtocolError = {
  resultKind: 'protocol-error',
  protocolCode: 'INVALID_REQUEST',
  safeDiagnostic: 'field path only',
  correlationRef: 'corr-1',
  apiVersion: '0.1.0',
  toolVersion: 'kernel-contracts-0.1.0',
}

const sampleReadRequest = {
  readKind: 'content-only',
  content: 'submitted content',
  contentEncoding: 'utf-8',
}

const sampleHostCapability = {
  hostAdapterRef: 'host-claude-win-docker',
  hostPostureClaim: 'claude-windows-docker-loaded',
  platformProbe: { probeName: 'windows-docker-probe', probeVersion: '1.0.0' },
  rawHostPaths: [{ rawPath: 'D:\\work\\repo\\src\\a.ts', pathForm: 'windows-drive' }],
  normalizationEvidence: {
    normalizationRef: 'norm-1',
    normalizerParcel: 'FK-P16',
    digest: digestA,
  },
}

const sampleLatencyContract = {
  spans: {
    kernelDecisionLatency: {
      start: 'decision-surface-request-received',
      end: 'response-written',
      clock: 'kernel-monotonic',
    },
    mediatedActionLatency: {
      start: 'host-lifecycle-entry',
      end: 'hook-exit',
      clock: 'adapter-monotonic',
    },
    firstCallObservation: {
      start: 'initial-lifecycle-invocation',
      end: 'hook-exit',
      clock: 'adapter-monotonic',
      includesStartup: true,
    },
  },
  budgetsMicros: {
    kernelWarmP50: 5000,
    kernelWarmP95: 20000,
    kernelWarmP99: 50000,
    mediatedP99: 150000,
    firstCallMax: 2000000,
  },
  decisionDeadlineMicros: 1000000,
  deadlineDisposition: 'evaluate-completed-response-at-or-under-deadline',
  lateResponsePolicy: 'ignore-terminal-outcome',
  warmPopulation:
    'completed-governed-mutation-decision-attempts-after-readiness-and-initial-invocation',
  exclusionReporting: 'failed-deadline-and-excluded-attempts-reported-separately',
  percentileMethod: 'nearest-rank',
  cache: {
    authorizationCache: 'disabled',
    bindings: ['goalRevision', 'policyDigest', 'compiledScopeDigest'],
    matchSufficiency: 'necessary-not-sufficient',
    freshnessRevalidation: [
      'effective-action-request',
      'principal-capability-generation',
      'repository-worktree',
      'lease-gate-freshness',
    ],
    ttlAuthority: 'none',
    latencyEligibility: 'none-granted',
  },
}

const sampleGoldenVectorCase = {
  caseId: 'vec-sample-1',
  charterClause: 'D17',
  producerParcel: 'FK-P13',
  consumerParcel: 'FK-P12',
  inputTrustOrigin: 'admitted-internal',
  request: sampleAuthorizeActionInput,
  expectedResponseKind: 'protocol-error',
  expectedCode: 'INVALID_REQUEST',
  expectedDecision: null,
  expectedWouldDecision: null,
  expectedAssuranceLevel: 'structural',
  expectedObligations: [],
  trustStageExpectation: 'protocol-stop',
  expectedRequestDigest: null,
  expectedInputDigest: digestB,
  verificationStage: 'contract-only',
  laterOwner: 'FK-P13',
}

// --- generation no-drift, dependency allowlist, canonical samples ----------

test('runtime dependencies are exactly {ajv}', () => {
  const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>
  }
  assert.deepEqual(Object.keys(pkg.dependencies ?? {}).sort(), ['ajv'])
})

for (const file of allSchemaFiles) {
  test(`no drift: ${file.name}.schema.json matches typed source`, () => {
    const committed = readFileSync(join(schemasDir, `${file.name}.schema.json`), 'utf8')
    assert.equal(committed, serialize(file.schema))
  })
}

const samplesByName: Readonly<Record<string, unknown>> = {
  'lifecycle-event': sampleLifecycleEvent,
  'admitted-context': sampleAdmittedContext,
  'authorize-action-input': sampleAuthorizeActionInput,
  'decision-envelope': sampleDecisionEnvelope,
  'repository-read-request': sampleReadRequest,
  'host-capability': sampleHostCapability,
  'latency-contract': sampleLatencyContract,
  'golden-vector': sampleGoldenVectorCase,
}

for (const file of allSchemaFiles) {
  test(`canonical sample validates: ${file.name}`, () => {
    const sample = samplesByName[file.name]
    assert.ok(sample !== undefined, `no canonical sample registered for '${file.name}'`)
    const ajv = new Ajv({ allErrors: true, strict: false })
    for (const other of allSchemaFiles) ajv.addSchema(other.schema as SchemaObject)
    const validate = ajv.compile(file.schema as SchemaObject)
    assert.ok(validate(sample), JSON.stringify(validate.errors))
  })
}

// --- agreement tests ------------------------------------------------------

function compileAll(): AjvType {
  const ajv = new Ajv({ allErrors: true, strict: false })
  for (const file of allSchemaFiles) ajv.addSchema(file.schema as SchemaObject)
  return ajv
}

function schemaValidator(ajv: AjvType, file: string, def: string): (doc: unknown) => boolean {
  const validate = ajv.getSchema(
    `https://foreman-line.local/schemas/kernel-contracts/${file}.schema.json#/$defs/${def}`,
  )
  assert.ok(validate !== undefined, `schema ${file}#${def} must compile`)
  return (doc: unknown) => validate(doc) === true
}

test('all eight schemas compile with cross-file refs and fixed file order', () => {
  compileAll()
  assert.deepEqual(
    allSchemaFiles.map((file) => file.name),
    [
      'lifecycle-event',
      'admitted-context',
      'authorize-action-input',
      'decision-envelope',
      'repository-read-request',
      'host-capability',
      'latency-contract',
      'golden-vector',
    ],
  )
})

test('every committed schema file is closed draft-07 with the pinned $id', () => {
  for (const file of allSchemaFiles) {
    const raw = JSON.parse(readFileSync(join(schemasDir, `${file.name}.schema.json`), 'utf8')) as {
      $schema?: string
      $id?: string
    }
    assert.equal(raw.$schema, 'http://json-schema.org/draft-07/schema#')
    assert.equal(
      raw.$id,
      `https://foreman-line.local/schemas/kernel-contracts/${file.name}.schema.json`,
    )
  }
})

test('unknown members fail the schemas in agreement with the TS validators', () => {
  const ajv = compileAll()
  const lifecycle = schemaValidator(ajv, 'lifecycle-event', 'LifecycleEvent')
  const read = schemaValidator(ajv, 'repository-read-request', 'ReadRequest')
  const input = schemaValidator(ajv, 'authorize-action-input', 'AuthorizeActionInput')

  const eventWithExtra = { ...sampleLifecycleEvent, injectedTrust: true }
  assert.equal(lifecycle(eventWithExtra), false)
  assert.ok(validateLifecycleEvent(eventWithExtra).some((i) => i.code === 'INVALID_REQUEST'))

  const readWithExtra = { ...sampleReadRequest, hostPath: '/etc/passwd' }
  assert.equal(read(readWithExtra), false)
  assert.ok(validateReadRequest(readWithExtra).some((i) => i.code === 'INVALID_REQUEST'))

  const inputWithExtra = {
    ...sampleAuthorizeActionInput,
    trustedBindings: { ...sampleAuthorizeActionInput.trustedBindings, trustedTimeMicros: 5 },
  }
  assert.equal(input(inputWithExtra), false)
  assert.ok(validateAuthorizeActionInput(inputWithExtra).some((i) => i.code === 'INVALID_REQUEST'))
})

test('missing required members fail the schemas and the TS validators', () => {
  const ajv = compileAll()
  const lifecycle = schemaValidator(ajv, 'lifecycle-event', 'LifecycleEvent')
  const incomplete: Record<string, unknown> = { ...sampleLifecycleEvent }
  delete incomplete.actionRef
  assert.equal(lifecycle(incomplete), false)
  assert.ok(validateLifecycleEvent(incomplete).some((i) => i.code === 'INVALID_REQUEST'))
})

test('unknown enum values fail the schemas and the TS validators', () => {
  const ajv = compileAll()
  const lifecycle = schemaValidator(ajv, 'lifecycle-event', 'LifecycleEvent')
  const badEnum = { ...sampleLifecycleEvent, claimedActionClass: 'totally-read-only' }
  assert.equal(lifecycle(badEnum), false)
  assert.ok(validateLifecycleEvent(badEnum).some((i) => i.code === 'INVALID_REQUEST'))
})

test('over-limit members fail the schemas and the TS validators with PAYLOAD_LIMIT_EXCEEDED', () => {
  const ajv = compileAll()
  const input = schemaValidator(ajv, 'authorize-action-input', 'AuthorizeActionInput')
  const tooMany = {
    ...sampleAuthorizeActionInput,
    trustedBindings: {
      ...sampleAuthorizeActionInput.trustedBindings,
      gateEvidenceRefs: Array.from({ length: 65 }, () => ({
        evidenceKind: 'commit-ref',
        gitIdentity: 'refs/heads/main',
        digest: digestA,
      })),
    },
  }
  assert.equal(input(tooMany), false)
  assert.ok(validateAuthorizeActionInput(tooMany).some((i) => i.code === 'PAYLOAD_LIMIT_EXCEEDED'))
})

test('apiVersion mismatch fails the schema literal and yields UNSUPPORTED_VERSION', () => {
  const ajv = compileAll()
  const lifecycle = schemaValidator(ajv, 'lifecycle-event', 'LifecycleEvent')
  const wrongVersion = { ...sampleLifecycleEvent, apiVersion: '0.2.0' }
  assert.equal(lifecycle(wrongVersion), false)
  assert.ok(validateLifecycleEvent(wrongVersion).some((i) => i.code === 'UNSUPPORTED_VERSION'))
})

test('result schemas accept their samples and reject cross-variant confusion', () => {
  const ajv = compileAll()
  const envelope = schemaValidator(ajv, 'decision-envelope', 'DecisionEnvelope')
  const protocolError = schemaValidator(ajv, 'decision-envelope', 'ProtocolError')
  assert.equal(envelope(sampleDecisionEnvelope), true)
  assert.equal(protocolError(sampleProtocolError), true)
  assert.equal(envelope(sampleProtocolError), false)
  assert.ok(validateDecisionEnvelope(sampleProtocolError).length > 0)
})

test('golden-vector case: schema rejects unknown enums; validator rejects registry-inconsistent expectations', () => {
  const ajv = compileAll()
  const caseSchema = schemaValidator(ajv, 'golden-vector', 'GoldenVectorCase')
  assert.equal(caseSchema(sampleGoldenVectorCase), true)
  const badKind = { ...sampleGoldenVectorCase, expectedResponseKind: 'not-a-kind' }
  assert.equal(caseSchema(badKind), false)
  assert.ok(validateGoldenVectorCase(badKind).length > 0)
  const registryInconsistent = { ...sampleGoldenVectorCase, expectedDecision: 'ALLOW' }
  assert.ok(
    validateGoldenVectorCase(registryInconsistent).some((i) => i.path === '$.expectedDecision'),
    'cross-field registry consistency is the validator layer',
  )
})
