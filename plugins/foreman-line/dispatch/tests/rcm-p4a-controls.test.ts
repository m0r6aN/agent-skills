/**
 * RCM-P4A control suite (MRC-05 — model-routing-chain-wrapper dispatch
 * integration parcel). ONE end-to-end control suite, each test named after its
 * contract item, exercising the landed behavior through the REAL
 * prepareDispatch/executeDispatch seam:
 *
 *   C1  coexistence — routing event entries and the Stage-C DispatchOrder live
 *       on ONE chain (contiguous sequences, prevHash pointers, shared
 *       correlation), DispatchOrder at the tip, tip-derived slot/locator; plus
 *       the no-events legacy control (byte-identical 000002 slot at the
 *       Stage-B tip).
 *   C2  requirement carry — schema-v0.4 frontmatter fields (inputs,
 *       thinking_level, min_context, expertise) bind into replayBindings and
 *       the RoutingDecisionEvent bindings, surface in the step-0 restatement;
 *       D8 omission defaults; malformed values refuse SPEC_INVALID_FRONTMATTER.
 *   C3  F1/F2 gates end-to-end — input-modality, thinking-level, context-floor
 *       and expertise narrowing gates over a fixture whose defect positions are
 *       pinned LITERALLY (economy#1 = nvidia/nemotron-3.5-lightning,
 *       standard#4 = z-ai/glm-5.3), so a reorder-based "fix" is impossible and
 *       only the requirement-scoped gate can pass these controls.
 *   C4  reconciliation-through-the-record — verifyExecutedIdentity over the
 *       written routing-decision.json.
 *
 * The routing policy below is a SYNTHETIC CONTROL FIXTURE (see the YAML
 * banner) — never the shipped policy. Every declared fact carries
 * `source: synthetic`.
 *
 * Harness conventions copied from approval-cli.test.ts / w4-p0-correlation-
 * lineage.test.ts / routing-eval.test.ts: temp repoRoot per test, injected
 * compressFn + dispatchWorktreeFn (no MCP, no git), chain fixtures seeded
 * before prepareDispatch.
 */

import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import type {
  ReceiptDocument,
  ReplayBindings,
  RoutingDecisionSubject,
} from '../../receipts/src/index.js'
import { validateChain, verifyExecutedIdentity } from '../../receipts/src/index.js'
import type {
  CandidateRecord,
  DispatchInput,
  DispatchOptions,
  DispatchPackage,
  DispatchWorktreeOutput,
  KompressCallResult,
  KompressFn,
} from '../src/index.js'
import { DispatchError, executeDispatch, prepareDispatch } from '../src/index.js'
import { canonicalRoutingCacheKey } from '../src/routing-cache.js'

// ─── Shared constants ────────────────────────────────────────────────────────

const HERE = dirname(fileURLToPath(import.meta.url))
const REAL_SKILL_INJECTION = join(HERE, '..', '..', 'skill-injection', 'skill-injection.yaml')

const HASH_A = '1'.repeat(64)
const HASH_B = '2'.repeat(64)
const CORRELATION_ID = 'c0dec0de-0000-4000-8000-000000000001'
const SESSION_ID = 'a1a1a1a1-0000-4000-8000-000000000002'
const RUN_ID = 'a2a2a2a2-0000-4000-8000-000000000003'

// ─── SYNTHETIC fixture policy (NOT the shipped policy) ───────────────────────
//
// Structure mirrors routing-policy/routing-policy.yaml (legacy blocks + the
// five PMC-P1 representation blocks + the RCM expertise_bindings block, as the
// NO_MODEL_POLICY fixture mirrors the legacy-only shape). ALL model-side facts
// are invented for control testing and marked `source: synthetic`. It passes
// validatePolicy through the real evaluateRouting flow.
//
// DEFECT POSITIONS PINNED LITERALLY — a reorder-based "fix" is impossible:
//   economy tier position 1  = nvidia/nemotron-3.5-lightning
//   standard tier position 4 = z-ai/glm-5.3
// Each carries a DECLARED text-only `inputs` fact; the vision-capable
// alternative (openai/gpt-5.6-luna) sits in a selectable position at
// economy#2 with a DECLARED ['text','image'] fact.

interface FactSpec {
  /** Declared input modalities; omitted = unknown (never guessed). */
  readonly inputs?: readonly string[]
  /** Declared thinking-level support; omitted = unknown. */
  readonly thinking?: readonly string[]
  /** Declared context_window_tokens / max_output_tokens pair; omitted = unknown. */
  readonly context?: { readonly window: number; readonly maxOutput: number }
  /** Declared cost quote (walk order is the selection rule — cost is commentary). */
  readonly cost?: { readonly input: number; readonly output: number }
}

type FactTable = Readonly<Record<string, FactSpec>>

interface FixtureModel {
  readonly model: string
  readonly family: string
  readonly facts: FactSpec
}

const FIXTURE_MODELS: readonly FixtureModel[] = [
  {
    model: 'nvidia/nemotron-3.5-lightning',
    family: 'nvidia',
    facts: {
      inputs: ['text'],
      context: { window: 200000, maxOutput: 64000 },
      cost: { input: 0.065, output: 0.18 },
    },
  },
  {
    model: 'openai/gpt-5.6-luna',
    family: 'openai',
    facts: {
      inputs: ['text', 'image'],
      cost: { input: 0.01, output: 0.02 },
    },
  },
  {
    model: 'google/gemini-3.1-flash-lite',
    family: 'google',
    facts: {
      inputs: ['text', 'image'],
      context: { window: 1048576, maxOutput: 65536 },
      cost: { input: 0.25, output: 1.5 },
    },
  },
  {
    model: 'anthropic/claude-haiku-4.5',
    family: 'anthropic',
    facts: {
      inputs: ['text'],
      cost: { input: 1, output: 5 },
    },
  },
  {
    model: 'anthropic/claude-sonnet-5',
    family: 'anthropic',
    facts: {
      inputs: ['text', 'image'],
      context: { window: 1000000, maxOutput: 128000 },
      cost: { input: 2, output: 10 },
    },
  },
  {
    model: 'z-ai/glm-5.3',
    family: 'z-ai',
    facts: {
      inputs: ['text'],
      cost: { input: 1.4, output: 4.4 },
    },
  },
  // CUTOVER-P4 fixture migration: the walk's remaining positions carry no
  // model-side facts (exactly their pre-cutover effective facts — an absent
  // binding was unknown-everything), so the gate verdicts are unchanged.
  // `anthropic/claude-opus-5.5` is the synthetic frontier anchor the old
  // `model_tiers.frontier` entry carried; it is now a candidate.
  {
    model: 'anthropic/claude-opus-5.5',
    family: 'anthropic',
    facts: {},
  },
  {
    model: 'google/gemini-3.8-flash',
    family: 'google',
    facts: {},
  },
  {
    model: 'openai/gpt-5.6-terra',
    family: 'openai',
    facts: {},
  },
]

const BASE_FACTS: FactTable = Object.fromEntries(FIXTURE_MODELS.map((m) => [m.model, m.facts]))

function factsTable(map: (model: string, facts: FactSpec) => FactSpec): FactTable {
  return Object.fromEntries(FIXTURE_MODELS.map((m) => [m.model, map(m.model, m.facts)]))
}

/** C3(iii) variant — every candidate declares text-only inputs: no capable candidate. */
const ALL_TEXT_FACTS: FactTable = factsTable((_model, facts) => ({ ...facts, inputs: ['text'] }))

/** C3(iii) variant — candidates carry NO model-side facts at all (all unknown). */
const NO_FACTS: FactTable = factsTable(() => ({}))

/** C3(v) variant — nemotron declares thinking support missing the resolved level. */
const THINKING_UNSUPPORTED_FACTS: FactTable = factsTable((model, facts) =>
  model === 'nvidia/nemotron-3.5-lightning'
    ? { ...facts, thinking: ['off', 'minimal', 'low', 'medium'] }
    : facts,
)

function bindingYaml(model: string, family: string, facts: FactSpec): string {
  const lines = [
    `      - id: openrouter/${model}`,
    `        provider: openrouter`,
    `        model: ${model}`,
    `        family: ${family}`,
    `        identity: { state: resolved, source: synthetic }`,
    `        endpoint: { registered: https://openrouter.ai/api/v1, catalogue: null, alignment: unknown }`,
    `        data_classes: { state: declared, value: [public, internal, restricted], source: synthetic }`,
    `        capabilities: { tool-use: unverified, structured-output: unverified }`,
    facts.context !== undefined
      ? `        context_window_tokens: { state: declared, value: ${facts.context.window}, source: synthetic }`
      : `        context_window_tokens: { state: unknown, residual: CONTEXT_UNKNOWN }`,
    facts.context !== undefined
      ? `        max_output_tokens: { state: declared, value: ${facts.context.maxOutput}, source: synthetic }`
      : `        max_output_tokens: { state: unknown, residual: CONTEXT_UNKNOWN }`,
    facts.cost !== undefined
      ? `        cost: { state: declared, value: { unit: usd_per_mtok, input: ${facts.cost.input}, output: ${facts.cost.output} }, source: synthetic }`
      : `        cost: { state: unknown, residual: COST_UNKNOWN }`,
    `        availability: { state: unproven, residual: AVAILABILITY_UNVERIFIED }`,
    `        quality: { state: unproven, residual: QUALITY_UNRECORDED }`,
  ]
  if (facts.inputs !== undefined) {
    lines.push(
      `        inputs: { state: declared, value: [${facts.inputs.join(', ')}], source: synthetic }`,
    )
  }
  if (facts.thinking !== undefined) {
    lines.push(
      `        thinking_levels: { state: declared, value: [${facts.thinking.join(', ')}], source: synthetic }`,
    )
  }
  return lines.join('\n')
}

function candidatesYaml(facts: FactTable): string {
  return FIXTURE_MODELS.map((m) => {
    const key = m.model.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()
    return [
      `  ${key}:`,
      `    family: ${m.family}`,
      `    bindings:`,
      bindingYaml(m.model, m.family, facts[m.model] ?? {}),
    ].join('\n')
  }).join('\n')
}

// The fixed policy head (legacy blocks + representation blocks). The five
// PMC-P1 blocks appear together (A5.5); lane_routes is empty because these
// controls exercise the dispatch walk, not lane routing. The lane_map is the
// frozen map (validator pins); content is structural fixture support only.
const POLICY_HEAD = `# ─────────────────────────────────────────────────────────────────────────
# SYNTHETIC CONTROL FIXTURE (RCM-P4A controls) — NOT the shipped policy.
# Structure mirrors routing-policy/routing-policy.yaml; ALL content is invented
# for control testing (every declared fact carries source: synthetic). It
# passes validatePolicy.
#
# DEFECT POSITIONS PINNED LITERALLY (a reorder-based "fix" is impossible):
#   economy tier position 1  = nvidia/nemotron-3.5-lightning
#   standard tier position 4 = z-ai/glm-5.3
# ─────────────────────────────────────────────────────────────────────────
classes:
  boilerplate:
    # Synthetic allowlist spanning economy AND standard so one walk's
    # evaluations cover BOTH pinned defect positions in a single decision.
    allowlist: [economy, standard]
    ceiling_usd: 0.50
  standard-feature:
    allowlist: [standard]
    ceiling_usd: 5.00
  architecture/risk:
    allowlist: [frontier]
    ceiling_usd: 25.00
  implementation/standard:
    allowlist: [standard]
    ceiling_usd: 5.00

data_classification:
  public:
    transport_requirements:
      data_collection: allow
      zdr: false
  internal:
    transport_requirements:
      data_collection: deny
      zdr: true
  restricted:
    transport_requirements:
      data_collection: deny
      zdr: true

# Ordered selection source (C5.2, migrated at CUTOVER-P4 from the removed
# model_tiers block): provider-neutral candidate keys, order preserved
# exactly (the keys are the candidatesYaml spellings).
selection_order:
  frontier:
    - anthropic-claude-opus-5-5 # synthetic anchor in KNOWN_FRONTIER_MODELS
  standard:
    # Positions 1-4 mirror the shipped tier; position 4 is pinned verbatim:
    - anthropic-claude-sonnet-5 # $2 / $10
    - google-gemini-3-8-flash # $0.75 / $3.75
    - openai-gpt-5-6-terra # $2 / $12
    - z-ai-glm-5-3 # SHIPPED DEFECT POSITION 4 (pinned literally) — $1.40 / $4.40
  economy:
    - nvidia-nemotron-3-5-lightning # SHIPPED DEFECT POSITION 1 (pinned literally) — $0.065 / $0.18
    - openai-gpt-5-6-luna # $0.01 / $0.02 — CHEAPER than the entry above; must never jump ahead (C3/viii)
    - google-gemini-3-1-flash-lite # $0.25 / $1.50
    - anthropic-claude-haiku-4-5 # $1 / $5

shadow_routes: {}

# PMC-P1 representation blocks (the five appear together — A5.5).
compatibility:
  representation: provider-neutral-fallback-contract
  version: 1
  legacy_representation:
    blocks: [model_tiers, roles, data_classification.eligible_models]
    id_vocabulary: openrouter-slug-only
    status: deprecated
    removal_serialized_into: PMC-P4

ranking_contract:
  inputs:
    R1: data-class eligibility
    R2: required capability
    R3: independence obligation
    R4: available context
    R5: remaining budget
    R6: verified availability
    R7: recorded quality score
  eligibility_filters: [R1, R2, R3, R4, R6]
  budget_ordering_lane: L5
  quality_ordering_key: R7
  stable_order: [declared-matrix-role, provider, model-id]
  evidence_threshold:
    rankable_requires: R1-R6-definite-true-from-a-named-source-and-R7-recorded-for-this-lane
    on_unknown: refuse
  attested_states: [static-conformance, live-availability, model-quality]

lane_map:
  L1:
    role_family: coordinator
    subroles: [coordinator, shaper, architect]
    routing_classes: [architecture/risk]
    authority_cap: [coordinate, shape, propose-amendment]
    authority_prohibited: [ratify, grant-gate, merge, release, self-verify]
    frontier_only: true
    independence: coordinator-is-never-its-own-verifier
    human_gates: [gate-1, gate-2, gate-3, break-glass-owner-only]
    provider_rule:
      kind: pinned-provider
      pinned_provider: { state: unavailable, residual: L1_PINNED_PROVIDER_UNSET }
    quality_tolerance: { state: unavailable, residual: DELTA_L_UNSET }
  L2:
    role_family: verifier
    subroles: [adversarial-reviewer, verifier, security-auditor]
    routing_classes: [architecture/risk, review/security]
    authority_cap: [verdict, findings-recommendation]
    authority_prohibited: [approve, merge, release, edit-artifact, accept-own-findings]
    frontier_only: true
    independence: independent-family-from-builder-applies-to-primary-and-fallback
    human_gates: [coordinator-acceptance, gate-3]
    provider_rule:
      kind: pinned-provider
      pinned_provider: { state: unavailable, residual: L2_PINNED_PROVIDER_UNSET }
    quality_tolerance: { state: unavailable, residual: DELTA_L_UNSET }
  L3:
    role_family: builder
    subroles: [builder-complex]
    routing_classes: [implementation/complex]
    authority_cap: [execution-within-allowed-files]
    authority_prohibited: [approve, merge, release, policy-bypass, self-review]
    frontier_only: false
    independence: reviewer-must-be-independent-family
    human_gates: [gate-2]
    provider_rule:
      kind: declared-preference
      preference: { state: unavailable, residual: L3_PROVIDER_PREFERENCE_UNSET }
    quality_tolerance: { state: unavailable, residual: DELTA_L_UNSET }
  L4:
    role_family: builder
    subroles: [builder-standard]
    routing_classes: [standard-feature, implementation/standard]
    authority_cap: [execution-within-allowed-files]
    authority_prohibited: [approve, merge, release, policy-bypass, self-review]
    frontier_only: false
    independence: reviewer-independent-where-parcel-risk-requires
    human_gates: [gate-2]
    provider_rule:
      kind: declared-preference
      preference: { state: unavailable, residual: L4_PROVIDER_PREFERENCE_UNSET }
    quality_tolerance: { state: unavailable, residual: DELTA_L_UNSET }
  L5:
    role_family: builder
    subroles: [builder-economy]
    routing_classes: [boilerplate]
    authority_cap: [execution-within-allowed-files]
    authority_prohibited: [security, approve, merge, release, final-verification]
    frontier_only: false
    independence: never-a-verifier
    human_gates: [gate-2]
    provider_rule:
      kind: cheapest-eligible
    quality_tolerance: { state: unavailable, residual: DELTA_L_UNSET }
  L6:
    role_family: classifier
    subroles: [routing-classifier]
    routing_classes: [routing/classification]
    authority_cap: [recommend-only]
    authority_prohibited: [prose, implementation, review, approve, merge, release, verification, control-plane, cross-provider-fallback]
    frontier_only: false
    independence: not-applicable
    human_gates: [reattestation-by-ratified-amendment]
    provider_rule:
      kind: none
      refusal: LANE_DISABLED_REFUSED
    quality_tolerance: { state: unavailable, residual: DELTA_L_UNSET }
    status: disabled-refused
    re_enablement: ratified-amendment-required
    re_enablement_candidates: [opencode/qwen3.8-flash, opencode/glm-5.3-flash]

lane_routes: []
`

// RCM-P4A expertise bindings — SYNTHETIC content (the shipped policy ships []
// because binding content is RCM-P9's). Non-shadow entries narrow the eligible
// set; the shadow entry is evidence-only and never narrows (RCM-P9).
const EXPERTISE_BINDINGS_YAML = `expertise_bindings:
  - routing_class: boilerplate
    expertise: engineering
    shadow: false
    bindings: [{ type: binding, ref: openrouter/anthropic/claude-haiku-4.5 }]
    evidence: { source: synthetic, date: 2026-09-27, admissibility: synthetic fixture entry for control testing }
  - routing_class: boilerplate
    expertise: writing
    shadow: false
    bindings: [{ type: binding, ref: openrouter/anthropic/claude-sonnet-5 }]
    evidence: { source: synthetic, date: 2026-09-27, admissibility: synthetic fixture entry for control testing }
  - routing_class: boilerplate
    expertise: data
    shadow: false
    bindings: [{ type: binding, ref: openrouter/z-ai/glm-5.3 }]
    evidence: { source: synthetic, date: 2026-09-27, admissibility: synthetic fixture entry for control testing }
  - routing_class: boilerplate
    expertise: research
    shadow: true
    bindings: [{ type: binding, ref: openrouter/z-ai/glm-5.3 }]
    evidence: { source: synthetic, date: 2026-09-27, admissibility: shadow evidence-only entry; never narrows at dispatch }
`

function makePolicyYaml(facts: FactTable): string {
  return `${POLICY_HEAD}\ncandidates:\n${candidatesYaml(facts)}\n\n${EXPERTISE_BINDINGS_YAML}`
}

const SYNTHETIC_POLICY = makePolicyYaml(BASE_FACTS)

// ─── Harness helpers (approval-cli.test.ts / w4-p0 / routing-eval conventions) ─

function makeTempRepoRoot(policyYaml: string): string {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'rcm-p4a-test-'))
  const routingDir = join(tmpRoot, 'plugins', 'foreman-line', 'routing-policy')
  mkdirSync(routingDir, { recursive: true })
  writeFileSync(join(routingDir, 'routing-policy.yaml'), policyYaml)
  const skillDir = join(tmpRoot, 'plugins', 'foreman-line', 'skill-injection')
  mkdirSync(skillDir, { recursive: true })
  writeFileSync(join(skillDir, 'skill-injection.yaml'), readFileSync(REAL_SKILL_INJECTION, 'utf8'))
  return tmpRoot
}

function optionsFor(repoRoot: string): DispatchOptions {
  return {
    repoRoot,
    pluginRoot: join(repoRoot, 'plugins', 'foreman-line'),
    dispatchWorktreeFn: successWorktreeFn,
  }
}

function writeSpecFile(
  repoRoot: string,
  frontmatter: Record<string, unknown>,
  name = 'test-spec.md',
): string {
  const specDir = join(repoRoot, 'specs')
  mkdirSync(specDir, { recursive: true })
  const fmLines = Object.entries(frontmatter)
    .map(([k, v]) => {
      if (Array.isArray(v)) return `${k}: [${(v as string[]).map((s) => `'${s}'`).join(', ')}]`
      return `${k}: ${String(v)}`
    })
    .join('\n')
  const specPath = join(specDir, name)
  writeFileSync(specPath, `---\n${fmLines}\n---\n\n# Spec body\nSome content.`)
  return specPath
}

const BASE_FRONTMATTER = {
  routing_class: 'boilerplate',
  data_classification: 'public',
  surfaces: ['plugins/foreman-line/dispatch/'],
  permission_profile: 'builder-standard',
}

let workflowCounter = 0
function nextWorkflowId(): string {
  workflowCounter += 1
  return `11111111-2222-4333-8444-${String(workflowCounter).padStart(12, '0')}`
}

const successWorktreeFn = (): DispatchWorktreeOutput => ({
  code: 0,
  stdout: 'profile: builder-standard\nbranch: feat/test\n',
  stderr: '',
})

function makeMockCompressFn(overrides?: Partial<KompressCallResult>): KompressFn {
  return async (_content: string) => ({
    compressed: 'compressed-spec-text',
    hash: 'mock-artifact-id-xyz',
    originalTokens: 200,
    compressedTokens: 50,
    tokensSaved: 150,
    transforms: ['semantic-dedup'],
    ...overrides,
  })
}

function makeCandidate(overrides?: Partial<CandidateRecord>): CandidateRecord {
  return {
    ticketKey: 'KONE-9999',
    summary: 'RCM-P4A control parcel',
    priority: 'Medium',
    status: 'To Do',
    workflowId: null,
    priorReceiptLocator: null,
    ...overrides,
  }
}

function makeChainDoc(args: {
  stage: 'A' | 'B'
  sequence: number
  prevHash: string | null
  hash: string
  workflowId: string
  correlationId: string
  subjectKind: string
}): ReceiptDocument {
  return {
    schemaVersion: '1',
    kind: 'stage',
    stage: args.stage,
    claimRef: null,
    correlation: {
      correlationId: args.correlationId,
      sessionId: SESSION_ID,
      workflowId: args.workflowId,
      runId: RUN_ID,
    },
    sequence: args.sequence,
    prevHash: args.prevHash,
    timestamp: '2026-09-27T00:00:00.000Z',
    subjectKind: args.subjectKind,
    subject: {},
    signature: null,
    hash: args.hash,
  } as unknown as ReceiptDocument
}

/** Seeds ONLY the Stage-B receipt (legacy control: no genesis, no events). */
function seedStageBOnly(
  repoRoot: string,
  workflowId: string,
): { locator: string; hash: string; correlationId: string } {
  const dir = join(repoRoot, 'docs', 'receipts', workflowId)
  mkdirSync(dir, { recursive: true })
  const doc = makeChainDoc({
    stage: 'B',
    sequence: 1,
    prevHash: HASH_A,
    hash: HASH_B,
    workflowId,
    correlationId: CORRELATION_ID,
    subjectKind: 'StageBRecord',
  })
  writeFileSync(join(dir, '000001-B-stage-b-record.json'), JSON.stringify(doc, null, 2))
  return {
    locator: `docs/receipts/${workflowId}/000001-B-stage-b-record.json`,
    hash: HASH_B,
    correlationId: CORRELATION_ID,
  }
}

/** Seeds a fixture-isolated A(0) -> B(1) chain sharing one correlationId. */
function seedChain(
  repoRoot: string,
  workflowId: string,
): { locator: string; hash: string; correlationId: string } {
  const dir = join(repoRoot, 'docs', 'receipts', workflowId)
  mkdirSync(dir, { recursive: true })
  const docA = makeChainDoc({
    stage: 'A',
    sequence: 0,
    prevHash: null,
    hash: HASH_A,
    workflowId,
    correlationId: CORRELATION_ID,
    subjectKind: 'GenesisRecord',
  })
  writeFileSync(join(dir, '000000-A-genesis-record.json'), JSON.stringify(docA, null, 2))
  return seedStageBOnly(repoRoot, workflowId)
}

function chainDocs(repoRoot: string, workflowId: string): ReceiptDocument[] {
  const dir = join(repoRoot, 'docs', 'receipts', workflowId)
  return readdirSync(dir)
    .filter((name) => /^\d{6}-[A-F]-/.test(name))
    .sort()
    .map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')) as ReceiptDocument)
}

interface Evaluation {
  readonly model: string
  readonly eligible: boolean
  readonly refusals: readonly { name: string; detail: string }[]
}

interface DecisionSummary {
  readonly resolvedModelId: string
  readonly resolvedTier: string
  readonly replayBindings: ReplayBindings
  readonly evaluations: readonly Evaluation[]
}

function readDecision(repoRoot: string, workflowId: string): DecisionSummary {
  return JSON.parse(
    readFileSync(join(repoRoot, 'docs', 'receipts', workflowId, 'routing-decision.json'), 'utf8'),
  ) as DecisionSummary
}

function evalFor(evaluations: readonly Evaluation[], model: string): Evaluation {
  const entry = evaluations.find((e) => e.model === model)
  assert.ok(entry, `expected an evaluations entry for '${model}'`)
  return entry
}

function decisionEventOf(chain: readonly ReceiptDocument[]): RoutingDecisionSubject {
  const doc = chain.find((entry) => entry.subjectKind === 'RoutingDecisionEvent')
  assert.ok(doc, 'expected a RoutingDecisionEvent chain entry')
  return doc.subject as unknown as RoutingDecisionSubject
}

/** seed chain + write spec + prepareDispatch in one step. */
async function prepareOn(args: {
  repoRoot: string
  frontmatter: Record<string, unknown>
  specName?: string
  seed?: 'chain' | 'stage-b-only'
}): Promise<{ pkg: DispatchPackage; workflowId: string }> {
  const workflowId = nextWorkflowId()
  const seeded =
    args.seed === 'stage-b-only'
      ? seedStageBOnly(args.repoRoot, workflowId)
      : seedChain(args.repoRoot, workflowId)
  const specPath = writeSpecFile(args.repoRoot, args.frontmatter, args.specName ?? 'test-spec.md')
  const input: DispatchInput = {
    candidate: makeCandidate({
      workflowId,
      priorReceiptLocator: seeded.locator,
    }),
    specPath,
    compressFn: makeMockCompressFn(),
    worktreePath: join(args.repoRoot, 'worktrees', 'wt'),
  }
  const pkg = await prepareDispatch(input, optionsFor(args.repoRoot))
  return { pkg, workflowId }
}

// ─── C1: coexistence — one chain, contiguous, tip-derived DispatchOrder ──────

test('C1 coexistence: prepareDispatch+executeDispatch land A→B→events→DispatchOrder on ONE contiguous hash-linked chain with the DispatchOrder at the tip and a tip-derived receiptLocator', async () => {
  const repoRoot = makeTempRepoRoot(SYNTHETIC_POLICY)
  try {
    const { pkg, workflowId } = await prepareOn({
      repoRoot,
      frontmatter: BASE_FRONTMATTER,
    })
    const result = await executeDispatch(
      pkg,
      join(repoRoot, 'worktrees', 'wt'),
      optionsFor(repoRoot),
    )

    const chain = chainDocs(repoRoot, workflowId)
    // A -> B -> RoutingDecisionEvent -> RoutingAttemptEvent -> DispatchOrder
    assert.deepEqual(
      chain.map((doc) => doc.subjectKind),
      [
        'GenesisRecord',
        'StageBRecord',
        'RoutingDecisionEvent',
        'RoutingAttemptEvent',
        'DispatchOrder',
      ],
    )
    // sequence values exactly 0..M-1 — contiguous, no duplicates
    assert.deepEqual(
      chain.map((doc) => doc.sequence),
      [0, 1, 2, 3, 4],
    )
    assert.equal(new Set(chain.map((doc) => doc.sequence)).size, chain.length)
    // each prevHash points at the immediate predecessor's hash
    for (let i = 1; i < chain.length; i++) {
      const prev = chain[i - 1]
      const doc = chain[i]
      assert.ok(prev !== undefined && doc !== undefined)
      assert.equal(
        doc.prevHash,
        prev.hash,
        `receipts[${i}].prevHash must be receipts[${i - 1}].hash`,
      )
    }
    // shared workflowId / correlationId across the whole chain
    for (const doc of chain) {
      assert.equal(doc.correlation.workflowId, workflowId)
      assert.equal(doc.correlation.correlationId, CORRELATION_ID)
    }
    const chainResult = validateChain(chain)
    assert.equal(chainResult.valid, true, `chain must be valid: ${chainResult.errors.join('; ')}`)

    // the DispatchOrder is the tip entry
    const tip = chain[chain.length - 1]
    assert.ok(tip !== undefined)
    assert.equal(tip.subjectKind, 'DispatchOrder')
    assert.equal(tip.sequence, 4)

    // result.receiptLocator names the receipt actually written (tip-derived slot)
    assert.equal(result.receiptLocator, `docs/receipts/${workflowId}/000004-C-dispatch-order.json`)
    const written = JSON.parse(
      readFileSync(join(repoRoot, ...result.receiptLocator.split('/')), 'utf8'),
    ) as ReceiptDocument
    assert.equal(written.hash, tip.hash)
    assert.equal(written.sequence, 4)
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C1 legacy: a direct DispatchPackage over the Stage-B-only chain writes the byte-identical 000002-C-dispatch-order.json slot (sequence 2, prevHash = Stage-B hash)', async () => {
  const repoRoot = makeTempRepoRoot(SYNTHETIC_POLICY)
  try {
    const workflowId = nextWorkflowId()
    const stageB = seedStageBOnly(repoRoot, workflowId)
    // No prepareDispatch — the package is built directly (no events land).
    const pkg: DispatchPackage = {
      candidate: makeCandidate({ workflowId, priorReceiptLocator: stageB.locator }),
      specFrontmatter: {
        routing_class: 'boilerplate',
        data_classification: 'public',
        surfaces: ['plugins/foreman-line/dispatch/'],
      },
      specText: '# Spec body\nSome content.',
      routingResult: {
        resolvedModelId: 'nvidia/nemotron-3.5-lightning',
        resolvedTier: 'economy',
        transportRequirements: { data_collection: 'allow', zdr: false },
        routingDecisionRef: `docs/receipts/${workflowId}/routing-decision.json`,
      },
      skillResult: {
        injectedSkills: [],
        injectionReceiptRef: `docs/receipts/${workflowId}/skill-injection.json`,
      },
      kompressResult: {
        artifactId: 'mock-artifact-id-xyz',
        compressedText: 'compressed-spec-text',
        originalTokens: 200,
        compressedTokens: 50,
        tokensSaved: 150,
        transforms: ['semantic-dedup'],
        kompressReceiptRef: `docs/receipts/${workflowId}/kompress.json`,
      },
      order: {
        parcelRef: 'KONE-9999',
        stepZeroRestatement: 'Parcel: KONE-9999',
        routingDecisionRef: `docs/receipts/${workflowId}/routing-decision.json`,
        injectedSkills: [],
      },
      prevHash: stageB.hash,
      priorCorrelationId: stageB.correlationId as DispatchPackage['priorCorrelationId'],
    }

    const result = await executeDispatch(
      pkg,
      join(repoRoot, 'worktrees', 'wt'),
      optionsFor(repoRoot),
    )
    assert.equal(result.receiptLocator, `docs/receipts/${workflowId}/000002-C-dispatch-order.json`)
    const written = JSON.parse(
      readFileSync(join(repoRoot, ...result.receiptLocator.split('/')), 'utf8'),
    ) as ReceiptDocument
    // byte-identical legacy slot at the Stage-B tip
    assert.equal(written.sequence, 2)
    assert.equal(written.prevHash, HASH_B)
    assert.equal(written.subjectKind, 'DispatchOrder')
    // the chain holds exactly Stage-B + the Stage-C order — no events, no gaps
    assert.deepEqual(
      chainDocs(repoRoot, workflowId).map((doc) => doc.sequence),
      [1, 2],
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── C2: requirement carry ───────────────────────────────────────────────────

test('C2 carry: declared inputs/thinking_level/min_context/expertise bind into replayBindings, the RoutingDecisionEvent bindings, and the step-0 restatement', async () => {
  const repoRoot = makeTempRepoRoot(SYNTHETIC_POLICY)
  try {
    const { pkg, workflowId } = await prepareOn({
      repoRoot,
      frontmatter: {
        ...BASE_FRONTMATTER,
        inputs: ['text', 'image'],
        thinking_level: 'high',
        min_context: 500000,
        expertise: 'security',
      },
    })

    // Resolved thinking level surfaced in the step-0 restatement
    assert.ok(
      pkg.order.stepZeroRestatement.includes('Resolved thinking level: high'),
      pkg.order.stepZeroRestatement,
    )

    const summary = readDecision(repoRoot, workflowId)
    const effective = summary.replayBindings.effective_requirements
    // required_inputs bound in canonical text-then-image order
    assert.deepEqual([...(effective.required_inputs ?? [])], ['text', 'image'])
    assert.equal(effective.required_thinking_level, 'high')
    assert.equal(effective.expertise, 'security')
    assert.equal(summary.replayBindings.derived_context_floor.required_context_tokens, 500000)

    // the same bindings ride the chain's RoutingDecisionEvent
    const chain = chainDocs(repoRoot, workflowId)
    const decision = decisionEventOf(chain)
    assert.deepEqual(decision.bindings, summary.replayBindings)
    assert.deepEqual(
      [...(decision.bindings.effective_requirements.required_inputs ?? [])],
      ['text', 'image'],
    )
    assert.equal(decision.bindings.effective_requirements.required_thinking_level, 'high')
    assert.equal(decision.bindings.effective_requirements.expertise, 'security')
    assert.equal(decision.bindings.derived_context_floor.required_context_tokens, 500000)
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C2 defaults: omitted requirement fields bind [text], the class thinking default, a null context floor, and no expertise key', async () => {
  const repoRoot = makeTempRepoRoot(SYNTHETIC_POLICY)
  try {
    // class defaults (THINKING_DEFAULT_BY_CLASS): boilerplate 'minimal',
    // standard-feature 'low', implementation/standard 'low'
    const cases: readonly { routing_class: string; level: string }[] = [
      { routing_class: 'boilerplate', level: 'minimal' },
      { routing_class: 'standard-feature', level: 'low' },
      { routing_class: 'implementation/standard', level: 'low' },
    ]
    for (const { routing_class, level } of cases) {
      const { workflowId } = await prepareOn({
        repoRoot,
        frontmatter: { ...BASE_FRONTMATTER, routing_class },
        specName: `spec-${routing_class.replace('/', '-')}.md`,
      })
      const summary = readDecision(repoRoot, workflowId)
      const effective = summary.replayBindings.effective_requirements
      assert.deepEqual([...(effective.required_inputs ?? [])], ['text'], routing_class)
      assert.equal(effective.required_thinking_level, level, routing_class)
      assert.equal(summary.replayBindings.derived_context_floor.required_context_tokens, null)
      assert.equal(
        Object.hasOwn(effective, 'expertise'),
        false,
        `${routing_class}: expertise must not be bound when not declared`,
      )
    }
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C2 malformed: inputs [video] / thinking_level turbo / min_context -5 / expertise astrology each throw SPEC_INVALID_FRONTMATTER', async () => {
  const repoRoot = makeTempRepoRoot(SYNTHETIC_POLICY)
  try {
    const malformed: readonly Record<string, unknown>[] = [
      { inputs: ['video'] },
      { thinking_level: 'turbo' },
      { min_context: -5 },
      { expertise: 'astrology' },
    ]
    for (const [index, field] of malformed.entries()) {
      await assert.rejects(
        () =>
          prepareOn({
            repoRoot,
            frontmatter: { ...BASE_FRONTMATTER, ...field },
            specName: `malformed-${index}.md`,
          }),
        (err: unknown) => {
          assert.ok(err instanceof DispatchError, `expected DispatchError, got ${String(err)}`)
          assert.equal(err.code, 'SPEC_INVALID_FRONTMATTER')
          return true
        },
      )
    }
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C2 reversed-order equivalence: inputs: [image, text] binds [text, image] — same bindings and same cache key as the canonical spelling', async () => {
  const repoRoot = makeTempRepoRoot(SYNTHETIC_POLICY)
  try {
    // R1: a permuted declaration is canonicalized at the single derivation
    // point — it can never fork replay comparisons or cache keys.
    const reversed = await prepareOn({
      repoRoot,
      frontmatter: { ...BASE_FRONTMATTER, inputs: ['image', 'text'] },
      specName: 'reversed-spec.md',
    })
    const reversedSummary = readDecision(repoRoot, reversed.workflowId)
    assert.deepEqual(
      [...(reversedSummary.replayBindings.effective_requirements.required_inputs ?? [])],
      ['text', 'image'],
    )

    const canonical = await prepareOn({
      repoRoot,
      frontmatter: { ...BASE_FRONTMATTER, inputs: ['text', 'image'] },
      specName: 'canonical-spec.md',
    })
    const canonicalSummary = readDecision(repoRoot, canonical.workflowId)
    // same-bindings as the canonical spelling
    assert.deepEqual(canonicalSummary.replayBindings, reversedSummary.replayBindings)
    // same-key as the canonical spelling (the comparator canonicalRoutingCacheKey applies)
    assert.equal(
      canonicalRoutingCacheKey({
        schemaVersion: 1,
        policyDigest: 'p',
        routing_class: 'boilerplate',
        data_classification: 'public',
        required_inputs: ['image', 'text'],
      }),
      canonicalRoutingCacheKey({
        schemaVersion: 1,
        policyDigest: 'p',
        routing_class: 'boilerplate',
        data_classification: 'public',
        required_inputs: ['text', 'image'],
      }),
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── C3: F1/F2 gates end-to-end over the pinned-defect fixture ───────────────

const NEMOTRON = 'nvidia/nemotron-3.5-lightning'
const GLM = 'z-ai/glm-5.3'
const LUNA = 'openai/gpt-5.6-luna'
const GEMINI_LITE = 'google/gemini-3.1-flash-lite'
const HAIKU = 'anthropic/claude-haiku-4.5'
const SONNET = 'anthropic/claude-sonnet-5'

test('C3(i)/(ii): the image-bearing spec resolves to the vision-capable alternative — never the pinned text-only defect ids (INPUTS_INSUFFICIENT named in evaluations)', async () => {
  const repoRoot = makeTempRepoRoot(SYNTHETIC_POLICY)
  try {
    const { pkg, workflowId } = await prepareOn({
      repoRoot,
      frontmatter: { ...BASE_FRONTMATTER, inputs: ['text', 'image'] },
    })
    await executeDispatch(pkg, join(repoRoot, 'worktrees', 'wt'), optionsFor(repoRoot))

    const summary = readDecision(repoRoot, workflowId)
    // (i) resolves to NEITHER literal id ...
    assert.notEqual(summary.resolvedModelId, NEMOTRON)
    assert.notEqual(summary.resolvedModelId, GLM)
    // (ii) the vision-capable alternative in a selectable position IS resolved
    assert.equal(summary.resolvedModelId, LUNA)

    // (i) both pinned defect entries carry a refusal NAMED exactly
    // INPUTS_INSUFFICIENT (the name, not bare non-selection)
    for (const model of [NEMOTRON, GLM]) {
      const entry = evalFor(summary.evaluations, model)
      assert.equal(entry.eligible, false, model)
      assert.ok(
        entry.refusals.some((r) => r.name === 'INPUTS_INSUFFICIENT'),
        `${model} must carry an INPUTS_INSUFFICIENT refusal; got ${JSON.stringify(entry.refusals)}`,
      )
    }
    // (ii) positive half — the alternative passed the gate at its visit
    assert.equal(evalFor(summary.evaluations, LUNA).eligible, true)
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C3(iii): no capable candidate refuses REQUIREMENTS_UNSATISFIABLE naming INPUTS_INSUFFICIENT; no-facts candidates name INPUTS_UNKNOWN', async () => {
  // (a) every candidate declares text-only inputs — nobody can serve [text, image]
  const repoRootAllText = makeTempRepoRoot(makePolicyYaml(ALL_TEXT_FACTS))
  // (b) candidates carry NO model-side facts — unknown never guesses
  const repoRootNoFacts = makeTempRepoRoot(makePolicyYaml(NO_FACTS))
  try {
    await assert.rejects(
      () =>
        prepareOn({
          repoRoot: repoRootAllText,
          frontmatter: { ...BASE_FRONTMATTER, inputs: ['text', 'image'] },
        }),
      (err: unknown) => {
        assert.ok(err instanceof DispatchError)
        assert.equal(err.code, 'REQUIREMENTS_UNSATISFIABLE')
        assert.ok(
          err.message.includes('INPUTS_INSUFFICIENT'),
          `message must name INPUTS_INSUFFICIENT: ${err.message}`,
        )
        return true
      },
    )
    await assert.rejects(
      () =>
        prepareOn({
          repoRoot: repoRootNoFacts,
          frontmatter: { ...BASE_FRONTMATTER, inputs: ['text', 'image'] },
        }),
      (err: unknown) => {
        assert.ok(err instanceof DispatchError)
        assert.equal(err.code, 'REQUIREMENTS_UNSATISFIABLE')
        assert.ok(
          err.message.includes('INPUTS_UNKNOWN'),
          `message must name INPUTS_UNKNOWN: ${err.message}`,
        )
        return true
      },
    )
  } finally {
    rmSync(repoRootAllText, { recursive: true, force: true })
    rmSync(repoRootNoFacts, { recursive: true, force: true })
  }
})

test('C3(iv) falsifiability: the pinned fixture under a text-default spec still resolves the first-eligible nemotron — the gate is requirement-scoped, never a reorder', async () => {
  const repoRoot = makeTempRepoRoot(SYNTHETIC_POLICY)
  try {
    // The SAME defect-position fixture (economy#1 = nemotron, standard#4 = glm)
    // under a spec with NO inputs field (baseline ['text'] makes no modality
    // claim): the order rule is intact and the gate stays closed.
    const { pkg, workflowId } = await prepareOn({
      repoRoot,
      frontmatter: BASE_FRONTMATTER,
    })
    assert.equal(pkg.routingResult.resolvedModelId, NEMOTRON)
    const summary = readDecision(repoRoot, workflowId)
    assert.equal(summary.resolvedModelId, NEMOTRON)
    assert.equal(evalFor(summary.evaluations, NEMOTRON).eligible, true)
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C3(v) thinking where-supported: declared support missing the resolved level filters THINKING_LEVEL_UNSUPPORTED; unknown support is selected with the level carried', async () => {
  const repoRoot = makeTempRepoRoot(makePolicyYaml(THINKING_UNSUPPORTED_FACTS))
  try {
    const { pkg, workflowId } = await prepareOn({
      repoRoot,
      frontmatter: { ...BASE_FRONTMATTER, thinking_level: 'high' },
    })

    // nemotron declares thinking_levels [off, minimal, low, medium] — 'high'
    // is missing: filtered by name, not selected
    const summary = readDecision(repoRoot, workflowId)
    const entry = evalFor(summary.evaluations, NEMOTRON)
    assert.equal(entry.eligible, false)
    assert.ok(
      entry.refusals.some((r) => r.name === 'THINKING_LEVEL_UNSUPPORTED'),
      `expected THINKING_LEVEL_UNSUPPORTED; got ${JSON.stringify(entry.refusals)}`,
    )
    assert.notEqual(summary.resolvedModelId, NEMOTRON)

    // the unknown-support candidate IS selected (unknown support is never
    // filtered), with the resolved level carried
    assert.equal(summary.resolvedModelId, LUNA)
    assert.equal(summary.replayBindings.effective_requirements.required_thinking_level, 'high')
    assert.ok(
      pkg.order.stepZeroRestatement.includes('Resolved thinking level: high'),
      pkg.order.stepZeroRestatement,
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C3(vi) context floor: below-floor filters CONTEXT_INSUFFICIENT and unknown facts CONTEXT_UNKNOWN; an omitted floor adds no context_floor predicate', async () => {
  const repoRoot = makeTempRepoRoot(SYNTHETIC_POLICY)
  try {
    // (a) declared floor 500000: nemotron declares window 200000 (below floor),
    // luna has unknown context facts, gemini-lite declares 1048576 (sufficient)
    const { workflowId: flooredId } = await prepareOn({
      repoRoot,
      frontmatter: { ...BASE_FRONTMATTER, min_context: 500000 },
      specName: 'spec-floor.md',
    })
    const floored = readDecision(repoRoot, flooredId)
    const belowFloor = evalFor(floored.evaluations, NEMOTRON)
    assert.equal(belowFloor.eligible, false)
    assert.ok(
      belowFloor.refusals.some((r) => r.name === 'CONTEXT_INSUFFICIENT'),
      `expected CONTEXT_INSUFFICIENT; got ${JSON.stringify(belowFloor.refusals)}`,
    )
    const unknownFacts = evalFor(floored.evaluations, LUNA)
    assert.equal(unknownFacts.eligible, false)
    assert.ok(
      unknownFacts.refusals.some((r) => r.name === 'CONTEXT_UNKNOWN'),
      `expected CONTEXT_UNKNOWN; got ${JSON.stringify(unknownFacts.refusals)}`,
    )
    assert.equal(floored.resolvedModelId, GEMINI_LITE)
    assert.deepEqual(
      [...floored.replayBindings.predicate_set],
      ['class_allowlist', 'data_class_eligible_models', 'capability_predicate', 'context_floor'],
    )

    // (b) omitted floor: the same fixture is unchanged — no context predicate
    const { workflowId: unflooredId } = await prepareOn({
      repoRoot,
      frontmatter: BASE_FRONTMATTER,
      specName: 'spec-no-floor.md',
    })
    const unfloored = readDecision(repoRoot, unflooredId)
    assert.equal(unfloored.resolvedModelId, NEMOTRON)
    assert.equal(unfloored.replayBindings.derived_context_floor.required_context_tokens, null)
    assert.deepEqual(
      [...unfloored.replayBindings.predicate_set],
      ['class_allowlist', 'data_class_eligible_models', 'capability_predicate'],
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C3(vii) expertise: non-shadow narrowing preserves walk order; an unsatisfiable binding refuses EXPERTISE_BINDING_UNSATISFIABLE; a shadow entry never narrows', async () => {
  const repoRoot = makeTempRepoRoot(SYNTHETIC_POLICY)
  try {
    // (a) (boilerplate, engineering) narrows to haiku — economy#4 selected over
    // the earlier candidates, each excluded by name from the gate outcome
    const { workflowId: engineeringId } = await prepareOn({
      repoRoot,
      frontmatter: { ...BASE_FRONTMATTER, expertise: 'engineering' },
      specName: 'spec-engineering.md',
    })
    const engineering = readDecision(repoRoot, engineeringId)
    assert.equal(engineering.resolvedModelId, HAIKU)
    assert.equal(evalFor(engineering.evaluations, HAIKU).eligible, true)
    const excluded = evalFor(engineering.evaluations, NEMOTRON)
    assert.equal(excluded.eligible, false)
    assert.ok(
      excluded.refusals.some((r) => r.name === 'EXPERTISE_NARROWED_OUT'),
      `expected EXPERTISE_NARROWED_OUT; got ${JSON.stringify(excluded.refusals)}`,
    )

    // (a') (boilerplate, writing) narrows to a LATER-TIER candidate (sonnet) —
    // selected over the earlier, excluded economy entries
    const { workflowId: writingId } = await prepareOn({
      repoRoot,
      frontmatter: { ...BASE_FRONTMATTER, expertise: 'writing' },
      specName: 'spec-writing.md',
    })
    const writing = readDecision(repoRoot, writingId)
    assert.equal(writing.resolvedModelId, SONNET)
    assert.ok(
      evalFor(writing.evaluations, LUNA).refusals.some((r) => r.name === 'EXPERTISE_NARROWED_OUT'),
    )

    // (b) (boilerplate, data) narrows to glm — under the image requirement glm
    // is gate-refused, so the narrowed set has NO selectable member
    await assert.rejects(
      () =>
        prepareOn({
          repoRoot,
          frontmatter: { ...BASE_FRONTMATTER, inputs: ['text', 'image'], expertise: 'data' },
          specName: 'spec-data.md',
        }),
      (err: unknown) => {
        assert.ok(err instanceof DispatchError)
        assert.equal(err.code, 'REQUIREMENTS_UNSATISFIABLE')
        assert.ok(
          err.message.includes('EXPERTISE_BINDING_UNSATISFIABLE'),
          `message must name EXPERTISE_BINDING_UNSATISFIABLE: ${err.message}`,
        )
        return true
      },
    )

    // (c) (boilerplate, research) is a SHADOW entry — it never narrows:
    // selection is exactly the un-narrowed first-eligible
    const { workflowId: shadowId } = await prepareOn({
      repoRoot,
      frontmatter: { ...BASE_FRONTMATTER, expertise: 'research' },
      specName: 'spec-research.md',
    })
    const shadow = readDecision(repoRoot, shadowId)
    assert.equal(shadow.resolvedModelId, NEMOTRON)
    assert.equal(evalFor(shadow.evaluations, NEMOTRON).eligible, true)
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C3(viii) order rule: the first selectable in walk order wins — a cheaper later candidate never jumps ahead', async () => {
  const repoRoot = makeTempRepoRoot(SYNTHETIC_POLICY)
  try {
    const { pkg, workflowId } = await prepareOn({
      repoRoot,
      frontmatter: BASE_FRONTMATTER,
    })
    const summary = readDecision(repoRoot, workflowId)
    // nemotron ($0.065/$0.18) is first-eligible and survives the gate; the
    // cheaper later candidate (luna, $0.01/$0.02) must NEVER jump ahead
    assert.equal(summary.resolvedModelId, NEMOTRON)
    assert.equal(pkg.routingResult.resolvedModelId, NEMOTRON)
    // the walk order itself is untouched: evaluations follow the tier order
    assert.deepEqual(
      summary.evaluations.map((e) => e.model),
      [
        NEMOTRON,
        LUNA,
        GEMINI_LITE,
        HAIKU,
        SONNET,
        'google/gemini-3.8-flash',
        'openai/gpt-5.6-terra',
        GLM,
      ],
    )
    assert.equal(summary.evaluations[0]?.model, NEMOTRON)
    assert.equal(summary.evaluations[1]?.model, LUNA)
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── C4: reconciliation through the record ──────────────────────────────────

test('C4 reconciliation: verifyExecutedIdentity reproduces the recorded selection and refuses a foreign model on selected_identity', async () => {
  const repoRoot = makeTempRepoRoot(SYNTHETIC_POLICY)
  try {
    const { pkg, workflowId } = await prepareOn({
      repoRoot,
      frontmatter: BASE_FRONTMATTER,
    })
    await executeDispatch(pkg, join(repoRoot, 'worktrees', 'wt'), optionsFor(repoRoot))

    const summary = readDecision(repoRoot, workflowId)
    const reproduced = verifyExecutedIdentity(summary.replayBindings, summary.resolvedModelId)
    assert.equal(reproduced.status, 'reproduced')

    const refused = verifyExecutedIdentity(summary.replayBindings, 'some/other-model')
    assert.equal(refused.status, 'refused')
    assert.ok(refused.status === 'refused')
    assert.equal(refused.refusal.code, 'REPLAY_REFUSED')
    assert.equal(refused.refusal.binding, 'selected_identity')
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})
