import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse, stringify } from 'yaml'
import type { AuthorityEnforcementRegistry, AuthorityRule } from '../src/types.js'
import { bindingDigestFor, parseRegistry, sha256, validateRegistry } from '../src/validate.js'
import { ok } from './support/assert-ok.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const fixtures = join(packageRoot, 'tests', 'fixtures')
const tsxCli = join(packageRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs')

function load(name: string): unknown {
  return parse(readFileSync(join(fixtures, name), 'utf8'))
}

test('accepts the minimal contract fixture', () => {
  assert.equal(validateRegistry(load('pass-minimal.yaml')).valid, true)
})

test('schema admits empty principal sets for explicitly unavailable operations', () => {
  const document = load('pass-minimal.yaml') as AuthorityEnforcementRegistry
  const mutated = structuredClone(document)
  for (const operationId of ['receipt.mint-generic', 'external.write']) {
    const row = mutated.operationAuthority.find(
      (candidate) => candidate.operationId === operationId,
    )
    ok(row)
    ;(row.allowedPrincipals as string[]).splice(0)
  }
  assert.equal(
    validateRegistry(mutated).violations.some((violation) => violation.code === 'SCHEMA_INVALID'),
    false,
  )
})

test('parseRegistry distinguishes parse failures from validation failures', () => {
  assert.equal(parseRegistry('not: [valid').violations[0]?.code, 'PARSE_ERROR')
  assert.equal(parseRegistry('{}').violations[0]?.code, 'SCHEMA_INVALID')
})

function runCli(args: readonly string[]): {
  status: number | null
  stdout: string
  stderr: string
} {
  const result = spawnSync(process.execPath, [tsxCli, 'src/cli.ts', ...args], {
    cwd: packageRoot,
    encoding: 'utf8',
  })
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

test('CLI validate and sweep return exit 0 with machine-readable summaries', () => {
  const validate = runCli(['validate', 'authority-enforcement-registry.yaml'])
  assert.equal(validate.status, 0, validate.stderr || validate.stdout)
  assert.equal(JSON.parse(validate.stdout).valid, true)

  const sweep = runCli(['sweep', 'authority-enforcement-registry.yaml', '--repo-root', '../../..'])
  assert.equal(sweep.status, 0, sweep.stderr || sweep.stdout)
  assert.equal(JSON.parse(sweep.stdout).summary.sourceCount, 18)
})

test('CLI bad invocation and unreadable input return exit 2', () => {
  assert.equal(runCli(['validate']).status, 2)
  assert.equal(runCli(['unknown', 'authority-enforcement-registry.yaml']).status, 2)
  assert.equal(runCli(['sweep', 'authority-enforcement-registry.yaml']).status, 2)
  assert.equal(runCli(['validate', join(fixtures, 'does-not-exist.yaml')]).status, 2)
})

test('R3 sweep with a missing repository root returns operational exit 2', () => {
  const result = runCli([
    'sweep',
    'authority-enforcement-registry.yaml',
    '--repo-root',
    join(packageRoot, 'tests', 'fixtures', 'missing-repository-root'),
  ])
  assert.equal(result.status, 2, result.stderr || result.stdout)
  ok(
    JSON.parse(result.stdout).violations.some(
      (violation: { code: string }) => violation.code === 'IO_ERROR',
    ),
  )
})

/**
 * R14 fix 15 - the seven reject fixtures are GENERATED here, not committed.
 *
 * They used to be seven committed ~39,897-line YAML files, each a full copy of the shipped registry
 * carrying one small mutation: about 245,000 lines encoding roughly 100 lines of intent, and a
 * standing drift channel, because nothing asserted that the copies still matched the registry they
 * were derived from.
 *
 * Deriving them at test time from the shipped registry removes the bulk and kills the drift channel
 * outright - there is no second copy left to drift. Each mutation is a named function and each test
 * asserts the exact violation code that mutation is named for, so a fixture cannot quietly stop
 * testing its invariant. Fixtures that also trip unrelated violations do not weaken the assertion,
 * because the assertion is on the NAMED code rather than on mere invalidity.
 */
/**
 * `[name, code, mutate, messageFragment?]`.
 *
 * The fourth element exists because a code alone does not always bind a fixture to its named axis.
 * `stale-binding-digest` and `identity-mutation` differ only in whether the rule's own binding
 * digest is re-derived, and BOTH report LOCATOR_DIGEST_MISMATCH plus MIGRATION_EVIDENCE_INVALID -
 * so asserting the code would have let the stale-digest fixture pass without ever exercising the
 * stale-digest check. Where a fragment is given, the fixture is pinned to the exact violation it
 * is named for.
 */
const rejectMutations: readonly (readonly [
  string,
  string,
  (document: AuthorityEnforcementRegistry) => void,
  string?,
])[] = [
  [
    // Names the RULE-IDENTITY axis and now actually constructs it. It used to re-derive
    // `bindingDigest` on the last line, which defused the axis it was named for and left it a
    // second copy of `location-mutation`: the stale-`bindingDigest` check at validate.ts's
    // 'rule bindingDigest is stale' was named by this fixture and exercised by nothing.
    // Re-deriving is exactly what a tamperer would do, so NOT re-deriving is what tests the guard.
    'stale-binding-digest',
    'MIGRATION_EVIDENCE_INVALID',
    (document) => {
      const rule = document.rules[0]
      ok(rule)
      const before = rule.bindingDigest
      ;(rule.sourceRefs[0] as { locatorDigest: string }).locatorDigest = '0'.repeat(64)
      // The rule's own binding digest is deliberately left stale, so the mutation is refused on the
      // identity axis rather than only on the locator one.
      assert.equal(rule.bindingDigest, before, 'the binding digest must be left stale')
    },
    'rule bindingDigest is stale',
  ],
  [
    // The same edit WITH the binding digest re-derived, which is the locator axis on the rule side.
    // Kept distinct from `location-mutation`, which breaks the locator from the INVENTORY side.
    'identity-mutation',
    'LOCATOR_DIGEST_MISMATCH',
    (document) => {
      const rule = document.rules[0]
      ok(rule)
      ;(rule.sourceRefs[0] as { locatorDigest: string }).locatorDigest = '0'.repeat(64)
      ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
    },
  ],
  [
    'location-mutation',
    'LOCATOR_DIGEST_MISMATCH',
    (document) => {
      const item = document.sources[0]?.inventoryItems[0]
      ok(item)
      ;(item.locator as { anchor: string }).anchor += '-moved'
    },
  ],
  [
    'value-mutation',
    'VALUE_DIGEST_MISMATCH',
    (document) => {
      const item = document.sources[0]?.inventoryItems[0]
      ok(item)
      ;(item as { normalizedExcerpt: string }).normalizedExcerpt += ' changed'
    },
  ],
  [
    // Renamed from `stale-source`, which claimed the FILESYSTEM-DRIFT axis and never touched the
    // filesystem: it desynchronises the recorded value digests from the operative text on both the
    // inventory and rule sides, which is the same in-document check `value-mutation` reaches from
    // the other direction. The genuine filesystem-drift axis is the sweep-level comparison in
    // `sweepRegistrySources`, which needs a real corpus on disk and is deferred rather than
    // pretended at here.
    'desynchronised-value-digest',
    'VALUE_DIGEST_MISMATCH',
    (document) => {
      const item = document.sources[0]?.inventoryItems[0]
      const rule = document.rules[0]
      ok(item && rule)
      ;(item as { valueDigest: string }).valueDigest = 'f'.repeat(64)
      ;(rule.sourceRefs[0] as { valueDigest: string }).valueDigest = 'f'.repeat(64)
      ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
    },
  ],
  [
    'duplicate-rule',
    'RULE_DUPLICATE',
    (document) => {
      const rule = document.rules[0]
      ok(rule)
      ;(document.rules as AuthorityRule[]).push(structuredClone(rule))
    },
  ],
  [
    'contradictory-authority',
    'RULE_CONFLICT',
    (document) => {
      const original = document.rules.find((rule) => rule.ruleId === 'rule.fk-charter.d3')
      ok(original)
      const base = {
        ...structuredClone(original),
        ruleId: 'rule.fk-charter.d3-contradiction',
        authorityClaim: 'state-changes-need-no-separate-admission',
        normalizedStatement: 'Contradictory shipped statement for the negative fixture.',
      }
      const conflicting = { ...base, bindingDigest: bindingDigestFor(base) }
      ;(document.rules as AuthorityRule[]).push(conflicting)
      const item = document.sources
        .find((source) => source.sourceId === 'fk-charter')
        ?.inventoryItems.find((candidate) => candidate.itemId === 'item.d3')
      ok(item)
      ;(item.ruleIds as string[]).push(conflicting.ruleId)
    },
  ],
  [
    'missing-source',
    'RULE_SOURCE_MISSING',
    (document) => {
      const rule = document.rules[0]
      ok(rule)
      ;(rule.sourceRefs[0] as { sourceId: string }).sourceId = 'missing-source'
      ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
    },
  ],
]

function rejectDocument(mutate: (document: AuthorityEnforcementRegistry) => void) {
  const document = parse(
    readFileSync(join(packageRoot, 'authority-enforcement-registry.yaml'), 'utf8'),
  ) as AuthorityEnforcementRegistry
  mutate(document)
  return document
}

for (const [name, code, mutate, messageFragment] of rejectMutations) {
  test(`reject-${name} rejects with ${code}`, () => {
    const result = validateRegistry(rejectDocument(mutate))
    assert.equal(result.valid, false)
    ok(
      result.violations.some((violation) => violation.code === code),
      `expected ${code}; observed ${result.violations.map((v) => v.code).join(',')}`,
    )
    if (messageFragment !== undefined) {
      ok(
        result.violations.some((violation) => violation.message.includes(messageFragment)),
        `expected a violation mentioning '${messageFragment}'; observed ${result.violations
          .map((v) => v.message)
          .join(' | ')}`,
      )
    }
  })
}

for (const [name, code, mutate, messageFragment] of rejectMutations) {
  test(`CLI reject-${name} returns exit 1 with ${code}`, () => {
    // R20 fix - per-run unique. The former fixed name was truncated and `rmSync`-ed by whichever
    // concurrent run finished first, producing IO_ERROR and exit 2 against `assert.equal(status, 1)`.
    const directory = mkdtempSync(join(tmpdir(), 'fk-p0-reject-'))
    const path = join(directory, `${name}.yaml`)
    try {
      writeFileSync(path, stringify(rejectDocument(mutate)), 'utf8')
      const result = runCli(['validate', path])
      assert.equal(result.status, 1, result.stderr || result.stdout)
      const output = JSON.parse(result.stdout) as {
        valid: boolean
        violations: { code: string; message: string }[]
      }
      assert.equal(output.valid, false)
      ok(
        output.violations.some((violation) => violation.code === code),
        `expected ${code}; observed ${output.violations.map((v) => v.code).join(',')}`,
      )
      if (messageFragment !== undefined) {
        ok(
          output.violations.some((violation) => violation.message.includes(messageFragment)),
          `expected a violation mentioning '${messageFragment}'; observed ${output.violations
            .map((v) => v.message)
            .join(' | ')}`,
        )
      }
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })
}

// The drift channel the committed copies created: `pass-minimal.yaml` is byte-identical to the
// shipped registry by construction, and nothing asserted it. This is not a "whole-file byte pin"
// of the kind Standing Constraint #12 forbids - it does not freeze a moving external file, it
// asserts that two artifacts THIS package regenerates together have not drifted apart.
test('the positive fixture has not drifted from the registry it is derived from', () => {
  assert.equal(
    sha256(readFileSync(join(packageRoot, 'tests', 'fixtures', 'pass-minimal.yaml'))),
    sha256(readFileSync(join(packageRoot, 'authority-enforcement-registry.yaml'))),
    'pass-minimal.yaml has drifted from authority-enforcement-registry.yaml; run `npm run generate`',
  )
})
