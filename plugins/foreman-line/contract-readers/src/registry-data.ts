/**
 * Real-contract population (Constraint 6) — scoped to this repo, exactly two
 * contracts, no further. Populating a downstream repo's registry (e.g.
 * `agenttask`) is separate, later work and explicitly out of scope here.
 *
 * Both entries' reader lists were verified against disk at authoring time
 * (`tests/touch-set.test.ts`'s AC5 reconciliation re-verifies this forward
 * direction on every run, plus prints a mechanical sweep for other on-disk
 * references as evidence — see that file for the sweep's stated scope and
 * limit).
 *
 * Amendment A2(c) (BL2): the corrected AC5 sweep (A2(b), `tests/touch-set.test.ts`)
 * surfaced three further genuine vocabulary consumers per contract, adjudicated
 * and added below — `types.ts` (restates the full enum array; also a Contract A
 * consumer via `VERIFICATION_CLASSES`), and
 * `spec-frontmatter.schema.json` (a `.json` restatement, out of the sweep's
 * `*.ts` glob by construction but in scope for adjudication per A2(b)(4)).
 * Contract B additionally gains the barrel re-export `spec-linter/src/index.ts`,
 * which re-exports the `ROUTING_CLASSES` identifier and is invisible to a
 * `routing_class` field-name grep (surfaced only by the value signal). Every
 * other file the sweep surfaced was adjudicated and ruled NOT a genuine
 * consumer — see the ruling table in `tests/touch-set.test.ts`.
 *
 * Amendment A3(a) (BLOCKER-1, SUPERSEDED BY A4(a)): `testing.ts` was declared
 * this rework, for both contracts, on the basis that it "hardcodes the current
 * literal enum values as canonical sample data" — a single sample member, not
 * an enumeration, a validation, or an index. Under A3(a)'s three-verb
 * criterion, `testing.ts` was UNDECLARED for both contracts, and the four
 * package-local `tests/helpers.ts` files (shaping, approval, registration,
 * projection) — each hardcoding the identical sample-frontmatter pair — were
 * ruled NOT readers and never added.
 *
 * Amendment A4(a) — THE GOVERNING CRITERION IS NOW THE LOCKSTEP TEST: a file
 * is a reader of a contract if and only if it must CHANGE when the contract
 * changes. Amendment A5(a) fixes this test's granularity and direction,
 * which A4(a) itself left unstated: "the contract changes" means one member
 * is ADDED to the contract's set (a new `verification_class` value for
 * Contract A, a new `classes` key for Contract B) — removal and rename are
 * NOT the test, because they couple sample data and fixtures that A3(a)
 * already ruled are not readers. A file is a reader iff the ADDITIVE
 * counterfactual forces it to change. A3(a)'s three verbs (enumerates/validates-against/indexes-by)
 * survive only as INDICATORS, never as the test itself — they proved
 * under-determined on first adversarial contact, because they could not
 * distinguish *embodying* a validation (couples you) from *invoking* a
 * validator (propagates; does not couple). That ambiguity produced opposite
 * rulings for two files doing the identical thing:
 * `shaping/src/self-check.ts` and `spec-linter/src/cli.ts` both do nothing
 * but `parseFrontmatter` then `validateSpecFrontmatter` (verified at
 * `self-check.ts:169,177` against `cli.ts:156,167`) — `cli.ts` was correctly
 * never declared, but `self-check.ts` was kept declared on a "transitive
 * consumption" basis that does not survive the lockstep test: add a field to
 * the contract and `validateSpecFrontmatter` absorbs it; `self-check.ts`
 * changes nothing. A4(a) therefore UNDECLARES `shaping/src/self-check.ts`
 * from Contract A (below) and removes the `sweepBlind` ruling that existed
 * only to excuse it (`tests/touch-set.test.ts`) — Contract A's allowlist ends
 * up empty, like Contract B's.
 *
 * A4(a) also UNDECLARES `foreman-config/tests/vocabulary-membership.test.ts`
 * from Contract A. This test's A3(a) basis ("it exercises the frontmatter
 * SCHEMA, not the vocabulary") does not answer the lockstep question either:
 * changing the vocabulary's *members* does not require this test to change,
 * because its assertions are about `involves` warnings, not about any
 * specific enum value. This edits Constraint 6's original declared list, not
 * merely a rework addition — ratified in A4(a).
 *
 * A4(a) also UNDECLARES `spec-linter/src/index.ts` from Contract B: a barrel
 * re-export forwards the `ROUTING_CLASSES` identifier; it does not change
 * when the vocabulary's members change (only its own re-export line would,
 * and only if the identifier itself were renamed — a different contract).
 *
 * Amendment A5(b) (review E B1 — the BLOCKER against A4's own text): two
 * further LOCKSTEP survivors failed A4's counterfactual under the reading
 * A4 itself used to rule out `cli.ts` and `index.ts`, because A4(a) never
 * fixed the granularity/direction A5(a) now states. A5(b) therefore
 * UNDECLARES `spec-linter/src/validate.ts` from Contract A (it compiles the
 * schema **imported** from `schemas.ts` and holds no enum member of its
 * own — adding a member does not change it) and UNDECLARES
 * `dispatch/src/routing-eval/index.ts` from Contract B (it imports
 * `CLASS_NAMES` from the home package and holds no class literal — adding a
 * member does not change it either). Both contracts now read exactly
 * `schemas.ts`, `types.ts`, `spec-frontmatter.schema.json`. This edits
 * Constraint 6's original declared list, as A4(a) did — ratified in A5(b).
 *
 * Every remaining declared reader is re-adjudicated against the ADDITIVE
 * lockstep test below and in `tests/touch-set.test.ts`'s ruling tables, each
 * with its basis stated — a declaration with no stated basis is the next
 * round's defect (A4(a), sharpened by A5(a)).
 */
import type { ContractReaderEntry } from './types.js'

/** Contract A — the spec-frontmatter schema (SPEC-CONVENTION §4). */
export const contractA: ContractReaderEntry = {
  contract: 'SPEC-CONVENTION.md §4 spec-frontmatter schema',
  description:
    'The spec-frontmatter schema (plugins/foreman-line/docs/SPEC-CONVENTION.md §4) and its ' +
    'typed/generated instantiation.',
  readers: [
    // LOCKSTEP (additive, A5(a)): restates the enum literally in the ajv
    // schema. ADD a class and this file must change or the schema silently
    // rejects it.
    'plugins/foreman-line/spec-linter/src/schemas.ts',
    // LOCKSTEP (additive): restates VERIFICATION_CLASSES (the full enum
    // array) in the typed source. ADD a class and this file must change.
    'plugins/foreman-line/spec-linter/src/types.ts',
    // LOCKSTEP (additive): the .json restatement of the same schema (out of
    // the sweep's *.ts glob by construction, adjudicated per A2(b)(4)). ADD
    // a class and this file's enum literal must change.
    'plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json',
  ],
}

/** Contract B — the routing-class vocabulary (routing-policy.yaml `classes` map keys). */
export const contractB: ContractReaderEntry = {
  contract: 'routing-policy.yaml classes map keys (routing-class vocabulary)',
  description:
    'plugins/foreman-line/routing-policy/routing-policy.yaml `classes` map keys — the ' +
    'routing_class enum vocabulary.',
  readers: [
    // LOCKSTEP (additive, A5(a)): restates the enum literally in the ajv
    // schema. ADD a class and this file must change.
    'plugins/foreman-line/spec-linter/src/schemas.ts',
    // LOCKSTEP (additive): restates ROUTING_CLASSES (the full enum array) in
    // the typed source; also a Contract A reader (VERIFICATION_CLASSES). ADD
    // a class and this file must change.
    'plugins/foreman-line/spec-linter/src/types.ts',
    // LOCKSTEP (additive): validates routing_class against the complete local
    // vocabulary. ADD a class and this consumer's membership set must change.
    'plugins/foreman-line/hybrid-routing/src/consumer-compatibility.ts',
    // LOCKSTEP (additive): the .json restatement of the same vocabulary. ADD
    // a class and this file's enum literal must change.
    'plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json',
  ],
}

/** Every real contract-reader entry populated by this parcel. */
export const registry: readonly ContractReaderEntry[] = [contractA, contractB]
