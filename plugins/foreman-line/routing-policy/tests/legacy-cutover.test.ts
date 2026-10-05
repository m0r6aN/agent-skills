/**
 * MRC-13 — CUTOVER-P4 controls: the window-end rules (C4), the typed
 * legacy-block refusals (C6), the ordered source's referential integrity
 * (C5.2), the selection-equivalence migration oracle (C5.1), and the
 * provenance/inventory discipline (C3.4/C7). Every control here is
 * no-provider-call (`static-conformance` only).
 *
 * The equivalence corpus is additionally enforced at evaluator level by
 * `dispatch/tests/routing-eval.test.ts`'s expectation matrix, which passes
 * with fixture-migration-only edits (C5.3 — every assertion unchanged).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { CONTRACT_REFUSALS, validatePolicy } from '../src/index.js'

const here = dirname(fileURLToPath(import.meta.url))
const policyPath = join(here, '..', 'routing-policy.yaml')
const foremanRoot = join(here, '..', '..')

const validPolicy = parse(readFileSync(policyPath, 'utf8'))

interface MutableBinding {
  provider: string
  model: string
  data_classes: Record<string, unknown>
  [key: string]: unknown
}

interface MutableCandidate {
  family: string
  bindings: MutableBinding[]
  [key: string]: unknown
}

interface MutableDoc {
  [key: string]: unknown
  classes: Record<string, { allowlist: string[]; ceiling_usd: number }>
  selection_order: Record<string, string[]>
  candidates: Record<string, MutableCandidate>
}

function docWith(mutate: (doc: MutableDoc) => void): unknown {
  const doc = structuredClone(validPolicy) as MutableDoc
  mutate(doc)
  return doc
}

function assertRefusal(doc: unknown, token: string, blockName?: string): void {
  const result = validatePolicy(doc)
  assert.equal(result.valid, false, `expected '${token}' to refuse the document`)
  const hits = result.errors.filter(
    (error) => error.includes(token) && (blockName === undefined || error.includes(blockName)),
  )
  assert.ok(
    hits.length > 0,
    `expected an error carrying '${token}'${blockName === undefined ? '' : ` naming '${blockName}'`}, got: ${JSON.stringify(result.errors)}`,
  )
}

// Required Tests 1 + C6 — cutover refusal controls (C4.1) -------------------

test('C6: LEGACY_REPRESENTATION_REFUSED is in the typed contract refusal vocabulary', () => {
  assert.ok(CONTRACT_REFUSALS.includes('LEGACY_REPRESENTATION_REFUSED'))
})

test('C4.1: a document carrying `model_tiers` is refused by name — the block is never silently ignored', () => {
  assertRefusal(
    docWith((doc) => {
      doc.model_tiers = { frontier: ['anthropic/claude-opus-5.5'] }
    }),
    'LEGACY_REPRESENTATION_REFUSED',
    "'model_tiers'",
  )
})

test('C4.1: a document carrying `roles` is refused by name', () => {
  assertRefusal(
    docWith((doc) => {
      doc.roles = { coordinator: 'frontier', verifier: 'frontier', builder: 'per-class' }
    }),
    'LEGACY_REPRESENTATION_REFUSED',
    "'roles'",
  )
})

test('C4.1: a document carrying `data_classification.<tier>.eligible_models` is refused by name, per tier', () => {
  for (const tier of ['public', 'internal', 'restricted'] as const) {
    assertRefusal(
      docWith((doc) => {
        const rule = (
          doc.data_classification as unknown as Record<string, Record<string, unknown>>
        )[tier]
        assert.ok(rule, `fixture requires the ${tier} rule`)
        rule.eligible_models = ['anthropic/claude-opus-5.5']
      }),
      'LEGACY_REPRESENTATION_REFUSED',
      `'data_classification.${tier}.eligible_models'`,
    )
  }
})

test('C4.3: a dual document must drop the legacy blocks — keeping any is the named refusal', () => {
  assertRefusal(
    docWith((doc) => {
      doc.model_tiers = { frontier: ['anthropic/claude-opus-5.5'] }
    }),
    'LEGACY_REPRESENTATION_REFUSED',
    "'model_tiers'",
  )
})

// Required Tests 2 — window-end inversion (C4.2) ----------------------------

test('a legacy-only document is refused once CUTOVER-P4 ends the deprecation window', () => {
  // The named inverse of the deleted fallback-contract.test.ts:577-585 control
  // ("a legacy-only document stays valid through the deprecation window").
  const doc = docWith((d) => {
    Reflect.deleteProperty(d, 'compatibility')
    Reflect.deleteProperty(d, 'ranking_contract')
    Reflect.deleteProperty(d, 'lane_map')
    Reflect.deleteProperty(d, 'candidates')
    Reflect.deleteProperty(d, 'lane_routes')
    d.model_tiers = { frontier: ['anthropic/claude-opus-5.5'] }
    d.roles = { coordinator: 'frontier', verifier: 'frontier', builder: 'per-class' }
    const rule = (d.data_classification as unknown as Record<string, Record<string, unknown>>)
      .public
    assert.ok(rule, 'fixture requires the public rule')
    rule.eligible_models = ['anthropic/claude-opus-5.5']
  })
  const result = validatePolicy(doc)
  assert.equal(result.valid, false, 'a legacy-only document must refuse at window end')
  assert.ok(
    result.errors.some((e) => e.includes('LEGACY_REPRESENTATION_REFUSED')),
    `expected the typed legacy refusal, got: ${JSON.stringify(result.errors)}`,
  )
  // The five PMC-P1 blocks are now required (C4.4) — the other leg of the
  // window-end rule.
  assert.ok(
    result.errors.some(
      (e) =>
        e.includes("must have required property 'compatibility'") ||
        e.includes("must have required property 'lane_routes'"),
    ),
    `expected the five blocks to be required, got: ${JSON.stringify(result.errors)}`,
  )
})

// Required Tests 1 (tail) — five-block required-ness + falsifiability pair ----

test('C4.4: a partial five-block set is refused (REPRESENTATION_INCOMPLETE_REFUSED, retained)', () => {
  assertRefusal(
    docWith((doc) => {
      Reflect.deleteProperty(doc, 'lane_routes')
    }),
    'REPRESENTATION_INCOMPLETE_REFUSED',
  )
})

test('falsifiability pair: a new-only document validates with zero errors; adding any legacy block turns it red', () => {
  assert.deepEqual(validatePolicy(validPolicy).errors, [])
  for (const mutate of [
    (doc: MutableDoc) => {
      doc.model_tiers = { frontier: ['anthropic/claude-opus-5.5'] }
    },
    (doc: MutableDoc) => {
      doc.roles = { coordinator: 'frontier', verifier: 'frontier', builder: 'per-class' }
    },
    (doc: MutableDoc) => {
      const rule = (doc.data_classification as unknown as Record<string, Record<string, unknown>>)
        .public
      assert.ok(rule, 'fixture requires the public rule')
      rule.eligible_models = ['anthropic/claude-opus-5.5']
    },
  ]) {
    const result = validatePolicy(docWith(mutate))
    assert.equal(result.valid, false, 'adding any legacy block must turn a new-only document red')
    assert.ok(result.errors.some((e) => e.includes('LEGACY_REPRESENTATION_REFUSED')))
  }
})

// Required Tests 5 — ordered-source referential integrity (C5.2) ------------

test('C5.2: an ordered-source entry naming a missing candidate is refused (dangling)', () => {
  assertRefusal(
    docWith((doc) => {
      doc.selection_order.economy = ['not-a-declared-candidate']
    }),
    'FALLBACK_DANGLING_REFERENCE',
  )
})

test('C5.2: a self-referential ordered-source entry is refused', () => {
  assertRefusal(
    docWith((doc) => {
      doc.selection_order.economy = ['economy']
    }),
    'FALLBACK_SELF_REFERENCE',
  )
})

// Required Tests 3 — selection equivalence corpus (C5.1) --------------------

/**
 * The migration oracle: the recorded PRE-cutover selection for every
 * (routing_class × data_classification), captured by running the pre-cutover
 * evaluator over the shipped policy (default requirements) before the cutover
 * edits landed. `candidate` is the logical candidate of the selected model.
 */
const MIGRATION_ORACLE: ReadonlyArray<{
  routing_class: string
  data_classification: string
  model: string
  group: string
  candidate: string
}> = [
  ...(['public', 'internal', 'restricted'] as const).flatMap((data_classification) => [
    {
      routing_class: 'boilerplate',
      data_classification,
      model: 'nvidia/nemotron-3.5-lightning',
      group: 'economy',
      candidate: 'nemotron-3.5-lightning',
    },
    {
      routing_class: 'standard-feature',
      data_classification,
      model: 'anthropic/claude-sonnet-5',
      group: 'standard',
      candidate: 'claude-sonnet-5',
    },
    {
      routing_class: 'architecture/risk',
      data_classification,
      model: 'anthropic/claude-opus-5.5',
      group: 'frontier',
      candidate: 'claude-opus-5-5',
    },
    {
      routing_class: 'implementation/standard',
      data_classification,
      model: 'anthropic/claude-sonnet-5',
      group: 'standard',
      candidate: 'claude-sonnet-5',
    },
  ]),
]

/**
 * The post-cutover selection walk over the policy data — first-eligible within
 * fixed group order, exactly the evaluator's walk semantics for default
 * requirements (the C3 gate filters unknown-facts candidates only under
 * non-baseline requirements, which the oracle does not exercise).
 */
function walkSelection(
  doc: MutableDoc,
  routingClass: string,
  dataClassification: string,
): { candidate: string; model: string; group: string } | null {
  const classEntry = doc.classes[routingClass]
  if (classEntry === undefined) return null
  for (const group of classEntry.allowlist) {
    for (const candidateKey of doc.selection_order[group] ?? []) {
      const candidate = doc.candidates[candidateKey]
      if (candidate === undefined) continue
      const binding = candidate.bindings.find((entry) => entry.provider === 'openrouter')
      if (binding === undefined) continue
      const dataClasses = binding.data_classes
      const eligible =
        dataClasses.state === 'declared' &&
        (dataClasses.value as readonly string[]).includes(dataClassification)
      if (!eligible) continue
      return { candidate: candidateKey, model: binding.model, group }
    }
  }
  return null
}

test('C5.1: the post-cutover walk reproduces the recorded pre-cutover oracle for the full (routing_class × data_classification) matrix', () => {
  const doc = structuredClone(validPolicy) as MutableDoc
  for (const row of MIGRATION_ORACLE) {
    const selected = walkSelection(doc, row.routing_class, row.data_classification)
    assert.deepEqual(
      selected,
      { candidate: row.candidate, model: row.model, group: row.group },
      `${row.routing_class} × ${row.data_classification} must select the recorded pre-cutover choice`,
    )
  }
})

test('C5.1 falsifiability: the walk still filters without reordering — a later selectable candidate never jumps ahead', () => {
  const doc = structuredClone(validPolicy) as MutableDoc
  // Make the first economy entry ineligible under public; the NEXT entry in
  // fixed order wins — and it wins by position, never by any derived order.
  const nemotron = doc.candidates['nemotron-3.5-lightning']
  assert.ok(nemotron, 'fixture requires the nemotron candidate')
  const firstBinding = nemotron.bindings[0]
  assert.ok(firstBinding, 'fixture requires the nemotron binding')
  firstBinding.data_classes = {
    state: 'unknown',
    residual: 'DATA_CLASS_UNKNOWN',
  }
  const selected = walkSelection(doc, 'boilerplate', 'public')
  assert.deepEqual(selected?.model, 'openai/gpt-5.6-luna')
  assert.deepEqual(selected?.group, 'economy')
  const economy = doc.selection_order.economy
  assert.ok(economy, 'fixture requires the economy group')
  assert.deepEqual(economy[0], 'nemotron-3.5-lightning', 'order is preserved, never rewritten')
  assert.ok(
    economy.indexOf('gpt-5.6-luna') < economy.indexOf('gemini-3.1-flash-lite'),
    'the winner is the first selectable entry in fixed order',
  )
})

// Required Tests 6 — provenance discipline (C3.4) ---------------------------

test('C3.4: no evidence envelope names a removed block as its current source', () => {
  const removed = ['model_tiers', 'roles', 'data_classification.eligible_models']
  const offenders: string[] = []
  const visit = (value: unknown, path: string): void => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        visit(entry, `${path}[${index}]`)
      })
      return
    }
    if (value === null || typeof value !== 'object') return
    for (const [key, entry] of Object.entries(value)) {
      if (key === 'source' && typeof entry === 'string') {
        for (const block of removed) {
          if (entry.includes(block)) offenders.push(`${path}.source = '${entry}'`)
        }
      }
      visit(entry, `${path}.${key}`)
    }
  }
  visit(validPolicy, '$')
  assert.deepEqual(offenders, [], 'every evidence envelope must name a living source (C3.4)')
})

// Required Tests 10 — migration inventory control (C7) ----------------------

/**
 * The PMC-P1 §5 consumer inventory (the migration inventory source of truth,
 * `docs/goals/pi-model-configuration/pmc-p1-fallback-contract-2026-09-26.md`
 * §5) — every consumer carries exactly one disposition, its owner, and its
 * fail-loud mode (post-cutover failure behavior; never a silent wrong output).
 * The coverage control below fails on any record-present/table-absent consumer.
 */
interface ConsumerRow {
  readonly path: string
  readonly disposition:
    | 'migrated'
    | 'proven-non-reader'
    | 'named-lagging-consumer'
    | 'owner-carried-inventoried'
    | 'inventoried-out-of-scope'
    | 'prose-quote-non-reader'
  readonly owner: string
  readonly failLoud: string
  /** Pinned token state (drift detection); undefined = not pinned (migrated code). */
  readonly carriesLegacyTokens?: boolean
}

const CONSUMER_INVENTORY: readonly ConsumerRow[] = [
  // Migrated in this packet (A-set / B-set) — now reading only the new
  // representation; their behavior proof is the green suite + the C4/C5 controls.
  {
    path: 'routing-policy/**',
    disposition: 'migrated',
    owner: 'MRC-13 A-set (PMC-P4 removal authority; SP16 user-owned baseline preserved)',
    failLoud:
      'any legacy block reintroduced anywhere refuses typed LEGACY_REPRESENTATION_REFUSED naming the block (schema + validator)',
  },
  {
    path: 'dispatch/src/routing-eval/index.ts',
    disposition: 'migrated',
    owner: 'MRC-13 B-set (fixture-migration + walk migration; C5 equivalence)',
    failLoud:
      'a legacy document at the evaluator seam throws POLICY_INVALID carrying the typed refusals (its validatePolicy gate)',
  },
  {
    path: 'dispatch/src/routing-eval/shadow.ts',
    disposition: 'migrated',
    owner: 'MRC-13 B-set surface (untouched: reads shadow_routes only; zero legacy reads)',
    failLoud:
      'a legacy document at its seam throws POLICY_INVALID carrying the typed refusals (its validatePolicy gate)',
  },
  {
    path: 'dispatch/tests/routing-eval.test.ts',
    disposition: 'migrated',
    owner: 'MRC-13 B-set (fixture-migration ONLY; every assertion unchanged)',
    failLoud: 'n/a (test consumer — its unchanged oracle pins fail loud on any selection drift)',
  },
  {
    path: 'dispatch/tests/rcm-p4a-controls.test.ts',
    disposition: 'migrated',
    owner: 'MRC-13 B-set (fixture-migration ONLY; every assertion unchanged)',
    failLoud: 'n/a (test consumer — its pinned defect positions fail loud on any reorder)',
  },
  // Unedited dispatch suites — consumed the evaluator/policy seams all along,
  // carry zero legacy tokens, and stay green over the post-cutover policy.
  ...[
    'w4-p0-correlation-lineage.test.ts',
    'approval-cli.test.ts',
    'pi-entry-preservation.test.ts',
    'pi-entry.test.ts',
    'routing-cache.test.ts',
    'mutation-scope.test.ts',
    'root-guards.test.ts',
    'skill-resolver.test.ts',
    'shadow-routing.test.ts',
    'query.test.ts',
    'kompress-adapter.test.ts',
    'dependency-allowlist.test.ts',
  ].map((file) => ({
    path: `dispatch/tests/${file}`,
    disposition: 'proven-non-reader' as const,
    owner: 'unmodified suite (zero edits by this packet)',
    failLoud: 'n/a (test consumer — any regression fails loud in the 241-test suite)',
    carriesLegacyTokens: false,
  })),
  // PMC-P1 §5 session/consumer modules — grep-proven zero read sites of the
  // three removed blocks (the proven-non-reader disposition).
  ...[
    'role-authority/src/roles.ts',
    'role-authority/src/data-classification.ts',
    'worker-envelopes/src/routing.ts',
    'worker-envelopes/src/result-envelope.ts',
    'ops-console/src/routing.ts',
    'ops-console/src/config.ts',
    'approval/src/cli.ts',
    'approval/src/index.ts',
    'contract-readers/src/registry-data.ts',
    'hooks/model-gate.policy.json',
    'skill-injection/src/cli.ts',
    'spec-linter/src/grandfather.ts',
    'verification/src/d19-audit.ts',
    'verification/src/ratified-packages.ts',
    'project-scaffold/src/manifest.ts',
    'permission-profiles/README.md',
  ].map((path) => ({
    path,
    disposition: 'proven-non-reader' as const,
    owner: 'owning module (never a policy reader; grep-proven)',
    failLoud:
      'n/a (zero read sites — nothing to fail; any future read surfaces here as a token-state drift)',
    carriesLegacyTokens: false,
  })),
  // Record-listed template family — owner-migrated carry, never edited here.
  {
    path: 'templates/foreman-routing-policy.yaml',
    disposition: 'named-lagging-consumer',
    owner: 'plugin-packaging-and-scaffolder (excluded-six; SP11-escalated; coordinator ruling 2)',
    failLoud:
      'its legacy skeleton refuses typed LEGACY_REPRESENTATION_REFUSED naming the block whenever a scaffolded copy is validated post-cutover — fail-loud, never silent; owner-migrated',
    carriesLegacyTokens: true,
  },
  {
    path: 'templates/pi-openrouter-routing.json',
    disposition: 'inventoried-out-of-scope',
    owner: 'boundary-routing/HRO mapping canon (SP11/O8 escalated; coordinator ruling 2)',
    failLoud:
      'NOT part of the deprecated representation (the P2/HRO mapping contract); unknown mappings refuse typed MAPPING_MISSING_REFUSED at the adapter',
    carriesLegacyTokens: false,
  },
  ...[
    'templates/foreman-config.yaml',
    'templates/AGENTS.md',
    'templates/STANDING-CONSTRAINTS.md',
    'templates/spec-index.md',
    'templates/foreman-skill-injection.yaml',
  ].map((path) => ({
    path,
    disposition: 'owner-carried-inventoried' as const,
    owner: 'plugin-packaging-and-scaffolder (excluded-six; SP11-escalated)',
    failLoud:
      'record-listed, owner-migrated carry; a legacy-carrying copy refuses typed when validated (fail-loud, never silent); never edited here',
    carriesLegacyTokens: false,
  })),
  // The record's prose clause — "the docs/kickstarters that quote the policy
  // vocabulary" — realized as concrete rows: historical quotes, never reads.
  ...[
    'docs/kickstarters/adversarial-review-W0-P3.md',
    'docs/kickstarters/foreman-line-parcel-W0-P3-rework.md',
    'docs/kickstarters/foreman-line-supercharge-carryover.md',
    'docs/kickstarters/foreman-line-supercharge-phase2-findings.md',
  ].map((path) => ({
    path,
    disposition: 'prose-quote-non-reader' as const,
    owner: 'docs/kickstarters (historical record prose; docs-owner maintained)',
    failLoud:
      'historical quotes carrying the forbidden tokens — grep-proven zero code reads; post-cutover wording is a docs-owner act, never silently edited here',
    carriesLegacyTokens: true,
  })),
]

test('C7: every inventoried consumer carries its disposition — owner + fail-loud mode recorded; token states pinned (non-readers hold zero; carriers pin their evidence)', () => {
  const legacyTokens = /model_tiers|eligible_models|roleAssignment|RoleAssignment/
  for (const consumer of CONSUMER_INVENTORY) {
    assert.ok(consumer.owner.length > 0, `${consumer.path} must record its owner`)
    assert.ok(consumer.failLoud.length > 0, `${consumer.path} must record its fail-loud mode`)
    if (consumer.path.includes('*') || consumer.carriesLegacyTokens === undefined) continue
    const text = readFileSync(join(foremanRoot, consumer.path), 'utf8')
    assert.equal(
      legacyTokens.test(text),
      consumer.carriesLegacyTokens,
      `${consumer.path} token state drifted (disposition '${consumer.disposition}')`,
    )
  }
})

/** A row covers a record consumer: exact, row-glob, or token-glob containment. */
function coversConsumer(rowPath: string, token: string): boolean {
  const globMatch = (pattern: string, value: string): boolean => {
    if (pattern.endsWith('/**')) return value.startsWith(pattern.slice(0, -2))
    if (pattern.endsWith('/*')) return value.startsWith(pattern.slice(0, -1))
    return pattern === value
  }
  return globMatch(rowPath, token) || globMatch(token, rowPath)
}

test('C7 coverage: every consumer present in the PMC-P1 §5 record has a dispositioned row (record-present/table-absent FAILS)', () => {
  const recordPath = join(
    foremanRoot,
    'docs',
    'goals',
    'pi-model-configuration',
    'pmc-p1-fallback-contract-2026-09-26.md',
  )
  const record = readFileSync(recordPath, 'utf8')
  const section5 = record.split('## 5. Migration inventory')[1]?.split('## 6.')[0] ?? ''
  assert.ok(section5.length > 0, 'the §5 migration-inventory section must exist')

  // Every backticked repo-path consumer in §5 must have a dispositioned row.
  const recordConsumers = [...section5.matchAll(/`([^`]+)`/g)]
    .map((match) => match[1] ?? '')
    .filter((token) => /^(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.\-*]+$/.test(token))
    .filter(
      (token) =>
        /\.(?:ts|json|yaml|md)$/.test(token) || token.endsWith('/*') || token.endsWith('/**'),
    )
  assert.ok(recordConsumers.length > 0, 'the §5 record must enumerate its consumers')
  const missing = recordConsumers.filter(
    (token) => !CONSUMER_INVENTORY.some((row) => coversConsumer(row.path, token)),
  )
  assert.deepEqual(
    missing,
    [],
    'record-present/table-absent consumers fail this control — every §5 consumer needs exactly one dispositioned row',
  )

  // The record's prose clause ("the docs/kickstarters that quote the policy
  // vocabulary") maps to concrete rows too.
  assert.ok(
    section5.includes('docs/kickstarters'),
    'the §5 prose clause must still name the kickstarters',
  )
  assert.ok(
    CONSUMER_INVENTORY.some((row) => row.path.startsWith('docs/kickstarters/')),
    'the §5 kickstarter prose clause must be covered by concrete rows',
  )
})
