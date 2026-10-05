# E6-R1 implementation review B findings

**Date:** 2026-09-06  
**Reviewer role:** independent read-only hostile/evidence-integrity reviewer  
**Target SHA:** `c4b05ed38fd0c1c9d543cf6618e4c1e8d57fcf86`  
**Base SHA:** `a766bbe4465ef3edf64ae3455c7b38ca46c831ba`  
**Verdict:** **HOLD**

## Findings

### E6R1-IRB1 — HIGH — helper-level observable-binding claim

The reviewer observed that `runStageE` validates PR-reference syntax and
embedded/supplied SHA equality but does not call GitHub, while `runStageF`
accepts the supplied closure record. Synthetic test values can therefore reach
the pure emitters.

**Citations:** `plugins/foreman-line/integration/src/exit-vehicle.ts:329-346`,
`plugins/foreman-line/integration/src/exit-vehicle.ts:363-370`,
`plugins/foreman-line/contracts/schemas/closure-record.schema.json:13-16`.

**Coordinator reproduction and triage:** the code observation is true, but the
blocking interpretation is rejected. The ratified E6-R1 design explicitly
keeps frozen emitters unchanged and places observation at the coordinator
boundary: read-only GitHub evidence is captured and equality-checked before E
or F is called, then cross-checked again in the deterministic exit. The helper
is intentionally pure and cannot itself establish whether a credential-backed
GitHub event occurred. Requiring a network call inside it would violate the
frozen-emitter/out-of-scope decision. E6-R1B nevertheless makes this existing
process-level invariant explicit so the mandated review question cannot be read
as a new helper-level requirement.

### E6R1-IRB2 — MEDIUM — named full-capture test does not bind full structure

The test named `every merge-gating ruleset has a full captured response`
compares only captured IDs with IDs observed in branch rules. Replacing each
capture in memory with `{id, bypass_actors: []}` leaves that named test green.
The present fixture is a truthful full capture, but the test does not bind its
own named structural invariant.

**Citation:**
`plugins/foreman-line/integration/tests/effective-rules.test.ts:94-115`.

```adversarial-findings
[
  {
    "summary": "Stage E and F helpers accept caller-supplied PR, head, and merge values without calling GitHub; the coordinator must enforce the ratified observable-binding pre-emission boundary.",
    "citation": "plugins/foreman-line/integration/src/exit-vehicle.ts:329-346; plugins/foreman-line/integration/src/exit-vehicle.ts:363-370; plugins/foreman-line/contracts/schemas/closure-record.schema.json:13-16",
    "severity": "high"
  },
  {
    "summary": "The test named every merge-gating ruleset has a full captured response checks only capture IDs; stripping captures to id and bypass_actors leaves it green.",
    "citation": "plugins/foreman-line/integration/tests/effective-rules.test.ts:94-115",
    "severity": "medium"
  }
]
```

## Independent evidence

- Exact 45-path scope, 42/79-to-zero identity migration, annotations,
  migration records, Stage-B observability, and authority boundaries passed.
- Fresh authenticated GitHub recapture matched all stored evidence exactly.
- Integration: 250 pass / 0 fail; typecheck, Biome, and spec lint exit 0.
- Mutation probes deleting a ruleset and adding a bypass actor turned their
  respective assertions red. Stripping full captures to minimal objects left
  the named full-response assertion green, proving E6R1-IRB2.
- Final reviewer worktree status was clean; the reviewer made no repository or
  external mutation.
