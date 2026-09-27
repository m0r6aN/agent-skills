# @foreman-line/kernel-contracts

FK-P1 kernel contracts: the versioned, provider-neutral contracts consumed by
FK-P2–FK-P21 — lifecycle events, admission shapes, the `authorizeAction`
input/output contract, the refusal-code registry, assurance claims, the
D19 read-request / D20 host-capability / D21 latency-and-cache contracts, and
golden vectors.

**Contract-only package.** No evaluator, no policy implementation, no admission
implementation, no runtime authority. The runtime modules (`src/`) have no
filesystem, network, time or process side effects; `src/generate.ts` is the one
explicit build operation. Nothing here proves runtime enforcement — fixture
vectors carry `verificationStage: contract-only` and a `laterOwner`; no golden
expected `ALLOW` asserts live permission.

Source of truth: `plugins/foreman-line/docs/specs/active/FK-P1-lifecycle-admission-decision-contracts.md`
(F05 contract field tables). Package identity: private ESM
`@foreman-line/kernel-contracts`, API `0.1.0`, Node >= 22.

## Layout

- `src/types.ts` — typed mirror of the F05 tables, closed vocabularies, the
  28-row `WIRE_CODE_RULES` registry (F05.12), the F05.13 trusted projection
  tables, the F05.5 digest domains, and the three embedded P0 reference shapes
  (`SourceRef`, `SnapshotEvidence`, `EvidenceRef`) preserved verbatim.
- `src/schemas.ts` — the eight closed draft-07 JSON Schemas. `$def` homes follow
  F05.1 exactly: each shape has exactly one home and every `$ref` resolves to a
  named `$defs` entry (`"<file>.schema.json#/$defs/<Name>"`, relative to `$id`).
- `src/canonical.ts` — the byte-total canonical encoder (F05.5 rules 1–6), the
  only hashing path for new P1 digests. Embedded upstream values are never
  retagged or recomputed with it.
- `src/validate.ts` — pure structural/semantic validators with the typed error
  taxonomy `INVALID_REQUEST` / `UNSUPPORTED_VERSION` / `PAYLOAD_LIMIT_EXCEEDED`.
- `src/generate.ts` — `npm run generate`, writes exactly the eight
  `schemas/*.schema.json` destinations, byte-identically on repeated runs.
- `tests/` — schema validation (schemas/validators agree, no drift), semantic
  boundaries (default-deny per invariant), canonical bytes (pinned vectors and
  fixture digest re-derivation), golden vectors (fixture + mutator registry),
  and P0 parity against the accepted upstream source (read-only).
- `tests/fixtures/golden-vectors.json` — the fixture-to-clause map: every case
  carries `charterClause`, producer/consumer, input trust origin, expected
  response kind/code/decision, assurance, obligations, trust-stage expectation
  and canonical digest bindings.

## Enforcement layering (normative reading, F05.1/P1-S07)

The draft-07 schemas are the structural wire contract. The validators
additionally enforce what JSON Schema draft-07 cannot express: UTF-8 byte
bounds (schema `maxLength` counts code points and is only a pre-filter),
negative zero, unpaired surrogates, the 1 MiB document bound, the depth-16
bound, and the F05.4/F05.8 cross-field rules. The two layers agree on every
rejection the schema can express (`tests/schema-validation.test.ts`).

## Golden-vector construction (coordinator-ruled 2026-09-27)

`GoldenVectorCase.request` is the closed three-shape union, so shape-invalid
documents are not literal fixture members. Each such negative case stores its
schema-valid base request plus its expected outcome; the **mutator registry**
in `tests/golden-vectors.test.ts` holds exactly one named single-dimension
mutator per negative caseId (the only place), and the tests assert the base
validates clean and the mutated document fails with exactly the case's expected
code — a no-op mutator fails loudly. Contract-expectation rows (admission
family, D19/D20 boundary refusals, latency/cache/gate/outage families) carry
their defect in-row (trust origin, binding anchors, path strings) and are
asserted via registry consistency, safe-result identity across varied states,
and shadow non-downgrade pairs. Fixture digests are bound to the stored base
requests and re-derived in `tests/canonical.test.ts` against an independent
implementation of the same encoder rules.

## Commands (run sequentially on the host)

```
node -v
npm ci            # lockfile must stay unchanged
npm run typecheck
npm run generate  # + exact generation diff/readback; second run byte-identical
npm test
npm run lint
```

The only cross-package import is the existing schema-scaffold generation
helper, through its reviewed relative export
(`../../schema-scaffold/src/generate.js`, `../../schema-scaffold/src/registry.js`,
and `../../schema-scaffold/src/test-scaffold.js` from tests). No workspace
linking, no shared lockfile, no root manifest registration.
