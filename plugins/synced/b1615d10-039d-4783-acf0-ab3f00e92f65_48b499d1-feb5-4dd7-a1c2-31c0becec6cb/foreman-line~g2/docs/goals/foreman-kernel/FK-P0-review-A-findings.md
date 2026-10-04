# FK-P0 Adversarial Review — Reviewer A (contract and authority soundness)

**Round:** 1 under this owner (inherited R2–R13 findings are unrecoverable and uncredited).
**Subject:** `codex/fk-p0-canon-authority-enforcement-registry` @ `df8155a`.
**Emphasis:** authority soundness, `resolveAuthority` precedence, overclaim, retirement gating.
**Method:** read-only inspection; every mutation experiment run against scratch copies. Post-review
git-detection control: worktree `git status --short` empty, `HEAD` unchanged at `df8155a`, no
commits from the review session.

**VERDICT: REWORK REQUIRED** — 2 BLOCKER, 8 SHOULD-FIX, 6 INFORMATIONAL.

---

## Coordinator reproduction of the pivotal finding

Per the standing rule that the coordinator reproduces disputed or decisive findings before
ruling, **B1 was independently verified on disk before any triage decision**:

| B1 sub-claim | Coordinator check | Result |
|---|---|---|
| The manifest pin is an unconditional predicate of every validation | `src/validate.ts:2402` | **TRUE** — `if (registryBindingManifestDigest(document) !== SHIPPED_BINDING_MANIFEST_DIGEST)` guarded by nothing |
| `generate.ts` cannot update the pin | `grep -c SHIPPED_BINDING_MANIFEST_DIGEST src/generate.ts` | **TRUE** — 0 occurrences (`validate.ts` has 3) |
| `buildMinimal` returns an identical clone | `src/generate.ts:12350-12352` | **TRUE** — `return structuredClone(full)` |
| `pass-minimal.yaml` is byte-identical to the shipped registry | `sha256sum` both | **TRUE** — both `48b6ba79f0003d2f67d8f6dfa155ecc4f7d8783b123fdc2896242c26f4a95ea4` |
| The pinned corpus is already stale | charter hash comparison | **TRUE, and worse than reported** — see below |

**Compounding with coordinator finding C1.** The registry binds `charter.md` at
`fullFileSha256: a69b19d69106243a918b2b228b29b8a85d854c8966e3d578ed1036105c90cc84`. That is
exactly the **stale 405-line charter carried on FK-P0's own branch**, superseded by the current
435-line charter (`c19359374480b03c39ce04316f94007fbb87e3be2b5be39bca8dd4072164234d`) which
carries ratified amendment A1 / D21.

So FK-P0 would ship a registry source-bound to a charter that no longer exists, with a validator
that cannot accept any regenerated replacement. B1 and C1 are one defect seen from two sides, and
neither is fixable without the other.

---

## BLOCKER

### B1 — `validateRegistry` is a hash-equality check against one frozen document, not a validator

`src/validate.ts:444-445` defines `SHIPPED_BINDING_MANIFEST_DIGEST`; `src/validate.ts:2402-2409`
makes it an unconditional predicate of every validation. `registryBindingManifestDigest`
(`:715-741`) covers `sourceSnapshotCommit`, every source's id/path/kind/tier/effect/scope/
snapshotEvidence, every inventory item's id/locatorDigest/valueDigest/ruleIds/exclusionDisposition,
every rule's id + `bindingDigest`, and the whole `normativeMarkdownAudit`. Net effect: **exactly one
registry content can ever be `valid`.**

Probe — minimal benign amendment, run against pristine and pin-disabled builds:

| mutation | pin present | pin disabled |
|---|---|---|
| change only `locator.lineHint` on one inventory item | `valid=true` | `valid=true` |
| change one rule's `severity` critical to high, `bindingDigest` correctly recomputed | `valid=false`, **exactly 1 violation**: `MIGRATION_EVIDENCE_INVALID` | `valid=true`, 0 violations |

A fully self-consistent, correctly re-digested registry is rejected, and the sole objection is
"you are not the shipped bytes."

Verified consequences:

1. **`pass-minimal.yaml` is byte-identical to the shipped registry** — forced by design at
   `src/generate.ts:12350-12352`. It cannot be otherwise while B1 stands.
2. **The documented regeneration workflow cannot produce a validatable artifact.** `README.md:224-226`
   presents `npm run generate` as the way to regenerate from the pinned corpus, but `generate.ts`
   references neither the pin nor `validate.ts`. Concrete failure: edit `charter.md`, run
   `npm run generate`, run `validate` produces exit 1 `MIGRATION_EVIDENCE_INVALID` until a human
   hand-edits the constant.
3. **The pinned snapshot is already stale** (see coordinator reproduction above).
4. **`resolveAuthority` is unusable against any amended registry.** `src/validate.ts:850-863`
   short-circuits to `REQUIRE_HUMAN / REGISTRY_INVALID` whenever `validateRegistry` fails, so every
   FK-P1+ query against a legitimately updated registry returns `REGISTRY_INVALID`.
5. **It is the sole enforcement behind real authority invariants** — see B2 and I2.

**Reviewer's counter-reading, recorded:** AC7's literal words are "the shipped suite contains no
whole-file **byte** pin". This pin lives in `src/validate.ts`, not the suite, and is content-scoped
rather than byte-scoped. If the intent was "immutable until a superseding parcel replaces it", B1 is
a design choice rather than an AC failure. Ranked BLOCKER on the strength of (2)+(3) — the artifact
cannot be advanced by its own tooling and the corpus has already moved — and (5).

### B2 — `validateRegistry` accepts forged retirement evidence; AC10 is enforced only by `sweep`, which the resolver never calls

`src/validate.ts:1728-1777` checks only that four slots are non-null with the right `kind`, four
distinct `path` strings, and a hardcoded refusal for `standing-constraints` rules. It never resolves
paths, never verifies `digest`, never opens the artifact, never checks `record.ruleId`. Digest
verification exists only in `sweepRegistrySources` (`:3398-3492`), while `resolveAuthority`
(`:850-863`) and the `validate` CLI (`src/cli.ts:67-70`) gate on `validateRegistry` alone.

Probe, mutating `rule.fk-charter.d3` (the charter's read/control admission-separation refusal) to
`retired-from-agent-reading` with four fabricated evidence artifacts that do not exist on disk,
`bindingDigest` recomputed:

| | before | after |
|---|---|---|
| `validateRegistry` (pin disabled) | `valid=true` | **`valid=true`, 0 violations** |
| `resolveAuthority(kernel.surface-admission-separation, ...)` | `RESOLVED / REFUSE / ['rule.fk-charter.d3']` | **`REQUIRE_HUMAN / NO_APPLICABLE_AUTHORITY`** |
| `sweepRegistrySources(..., repoRoot)` | `valid=true` | `valid=false`, `RETIREMENT_EVIDENCE_INCOMPLETE` |

Zero-evidence and four-slots-one-path retirement *are* caught, and the `standing-constraints` block
holds. Three of AC10's four sub-claims are real; **"digest-verified" is not**, on the predicate that
actually gates authority resolution.

**Severity note (reviewer's, and the coordinator concurs):** the failure direction is safe. Across
13 shipped queries where a lower-tier rule sits behind a controlling one, forging retirement of every
controlling rule produced **0 decision flips** — every case degraded to `REQUIRE_HUMAN /
NO_APPLICABLE_AUTHORITY`. No forged retirement manufactured an `ALLOW`. What it does is silently
delete canon (`gate3.merge-authority`, `verification.issue-authority`, `spec.mutation-authority`, six
`goal.stop.*` refusals) while `validate` reports green. Masked today by B1; **live the moment B1 is
addressed**, which is why the two must be fixed together.

## SHOULD-FIX

- **S1 — the `CONFLICT` outcome is unreachable**, though AC5 and `README.md:153-156` claim it.
  `RULE_CONFLICT` (`:1780-1807`) invalidates the document before `resolveAuthority` can reach the
  `CONFLICT` branch (`:827-839`). Both shapes AC5/README name were probed with and without the pin;
  both returned `REQUIRE_HUMAN / REGISTRY_INVALID`. A 372-query survey returned 0 `CONFLICT`. The
  suite's only mention is `semantic-invariants.test.ts:2365`, an `assert.notEqual`. Fix by deleting
  the variant and correcting AC5/README, or by demoting `RULE_CONFLICT` so the resolver can report
  it per-query. Behaviour remains fail-closed, so this is honesty/dead-code.
- **S2 — a hardcoded rule ID hides a real competing Gate-2 canon statement.** `src/validate.ts:795`,
  uncommented: `if (rule.ruleId === 'rule.coordinator-pattern.91dd60b00fd6') return false`. That rule
  is already excluded from `candidates` twice over by `isActiveAuthorityRule`; the hardcode's only
  effect is to strip it from `consideredRuleIds`, contradicting AC5 ("historical/generic rules remain
  visible") and `README.md:200-202`. Deleting the line changes `consideredRuleIds` only, never
  `controllingRuleIds` or `decision`. It exists to satisfy `semantic-invariants.test.ts:2860`, whose
  other four assertions already prove the non-grant.
- **S3 — three resolver tests are named for invariants they never assert** (lesson #32 class):
  `semantic-invariants.test.ts:899`, `:913`, `:933` all assert only `REQUIRE_HUMAN / REGISTRY_INVALID`
  and never inspect `consideredRuleIds`/`controllingRuleIds`. They pass because the mutation
  invalidates the registry, not because the named precedence property holds.
- **S4 — `resolveAuthority` throws on a null/undefined query instead of failing closed.**
  `:851` guards `query?.authoritySubject` only on the invalid-registry path; on a valid registry
  `:783` then `:751` dereferences unguarded. Probed: `null` and `undefined` throw `TypeError`; empty
  object, array, proto-polluted, newline-injected and 100k-char subjects all correctly return
  `INVALID_QUERY_SCOPE` (no ReDoS, 113 ms). A caller with a broad `catch` turns a fail-closed API
  into a fail-open one.
- **S5 — non-string `authoritySubject` slips past `queryIsValid`.** `:751` uses `RegExp.test`, which
  coerces; `authoritySubject: 1` becomes `"1"` and matches, yielding `NO_APPLICABLE_AUTHORITY` rather
  than `INVALID_QUERY_SCOPE`. Fail-closed only by accident of cross-type comparison.
- **S6 — `resolveAuthority` re-validates the entire registry on every query.** Measured:
  `validateRegistry` 107 ms cold / 79 ms warm; `resolveAuthority` 133 ms — re-running AJV over a
  39,897-line document, recomputing 466 `bindingDigest`s, and an O(n^2) conflict scan (108,345 pairs).
  `README.md:148-151` frames this as deliberate fail-closed design, which is defensible; the concern
  is FK-P1+ calling it per action. **Coordinator note: D21 budgets p95 under 20 ms and p99 under 50 ms
  for the kernel decision span. 133 ms exceeds it by roughly 6.6x.** D21 is not binding on FK-P0 and
  the reviewer correctly declined to score it as a defect, but it is a live forward risk for
  FK-P1/FK-P17.
- **S7 — `AuthorityResolution` drops `classification`/`assurance`/`enforcementOwner`/`severity`**
  (`src/types.ts:260-268`), so a structural, unimplemented `REFUSE` is indistinguishable from a
  mediated one. 254 of 466 rules are `pre-action-refusal` forced to `enforcementOwner: kernel-policy`
  / `assurance: structural` (`:1571-1573`) while no kernel exists. Reviewer explicitly uncertain
  whether this is a defect or intended future-state posture, and confirms AC8's specific claims *are*
  met. Coordinator ruling requested on the resolution result shape.
- **S8 — `R12_GATE2_ALLOW_RULE_IDS` is a name-only waiver** (`:254-258`, used at `:1566-1567`),
  violating Standing Constraint #13's identity+location+value pinning. Probed and **not exploitable
  today** — `SEMANTIC_EQUIVALENCE` (`:448-521`) independently pins the rule ID to its subject/claim —
  but its safety depends on a second table staying in sync.

## INFORMATIONAL

- **I1 — fixture duplication, correctness consequences** (the coordinator's specific question).
  `pass-minimal.yaml` is **byte-identical**, not a near-copy. Of the three failure modes asked about:
  *silent drift / fixture no longer testing its named invariant* — **none found**; all seven carry
  exactly the mutation their name claims and `schema-validation.test.ts:39-53` asserts the specific
  code per fixture. *Assertions passing for the wrong reason* — **yes, seven**:
  `schema-validation.test.ts:82-98` asserts only `status === 1` and `violations.length > 0`, which
  B1's single hash check satisfies for all seven regardless of any other validator behaviour. These
  seven are inert. *The positive fixture is a tautology* — `:19-21` asserts a byte-identical copy
  validates, which `:72-80` already asserts of the original. **Root cause is B1, not laziness:** while
  the manifest is pinned, no smaller positive fixture can exist. Fixing B1 is a precondition for
  fixing the bloat.
- **I2 — negative-suite mutation census.** 25-test subset run against pristine and pin-disabled
  builds: 25 pass / 0 fail becomes 20 pass / 5 fail. The five with no enforcement other than the hash:
  `semantic-invariants.test.ts:808`, `:817`, `:826`, `:835` (applicability/retirement/subject/claim
  replacement) and `:1366` (**source baseline manifest rejects a recomputed snapshot hash mutation** —
  the one that matters most for source-digest binding; `sweep` still catches it). The other twenty,
  including all four `R11 protected normative blocks` tests, have genuine independent checks. **The
  negative suite is not uniformly inert — it is inert exactly where the invariant was never
  implemented and the hash was allowed to stand in.**
- **I3 — the operation matrix (AC6) genuinely holds, independently of the pin.** Seven escalation
  attempts (merge agent-callable, merge principals, verification principals, closure operational-state,
  generic receipt minting, missing-evidence decision, Gate-1 tool-issued evidence) were all refused
  with `AUTHORITY_ESCALATION` **with and without** the pin. Row deletion caught by `:971-977`,
  addition/reordering by `:995-1003`, per-row protections at `:1004-1105`. Across 372 queries the
  shipped registry yields exactly **one** `ALLOW` — the bounded Gate 2 dispatch grant, as AC5's final
  clause requires — against 228 `REFUSE`, 70 `ADVISORY`, 9 `REQUIRE_HUMAN`. **This is the strongest
  part of the package and must be preserved through rework.**
- **I4 — the sweep has real teeth (AC12 source-binding half).** From a clean `git clone --local` at
  `df8155a`: baseline green; unrelated-file edit green; unregistered paragraph gives
  `SOURCE_ITEM_UNCOVERED`; changed operative value gives `VALUE_DIGEST_MISMATCH`; renamed heading gives
  9 violations. All 18 declared source paths resolve. AC12's sensitivity claim is verified.
- **I5 — resolver precedence survey.** 372 in-scope queries: 308 `RESOLVED`, 64
  `NO_APPLICABLE_AUTHORITY`, 0 `CONFLICT`. 13 resolved queries correctly carry considered-but-not-
  controlling lower-tier rules. Tier comes only from `authorityBasisRef` to source `authorityTier`
  (`:816-822`), as AC5 requires. The machinery is sound; S2 is a hand-placed exception to it.
- **I6 — repository hygiene.** A pre-existing stash exists on the FK-P0 worktree:
  `stash@{0}: On codex/fk-p0-canon-authority-enforcement-registry: fk-p0-r11-partial-before-profile-count-amendment`.
  Not created by the reviewer; provenance unestablished. **Coordinator: confirmed present.** It is
  abandoned R11 partial state from the dead Codex session and must be dispositioned before merge.

## What Reviewer A could not check

1. **A full run of `tests/semantic-invariants.test.ts`.** Two complete runs were started and both were
   still executing with zero output **more than 70 minutes later** (processes alive, not hung). The
   census therefore covers **25 of roughly 197 tests** in that file; of 32 tests asserting
   `MIGRATION_EVIDENCE_INVALID`, 18 were classified and **14 left unclassified** (`:287`, `:297`,
   `:306`, `:315`, `:495`, `:534`, `:626`, `:1213`, `:1323`, `:2091`, `:2421`, `:3007`, `:3040`,
   `:3544`). A single shipped test file exceeding 70 minutes is itself flagged for coordinator
   attention.
2. `tsc --noEmit`, `biome check`, full `npm test` (AC13) — mandate forbade the full suite; the
   coordinator ran all three independently (tsc 0, biome 0).
3. **`npm run generate` determinism (AC2).** Not executed; B1(2) rests on reading `generate.ts`, not
   on running it.
4. AC1 / AC7 parcel-time diff proof — coordinator-owned, and completed (see closure check).
5. **AC3 completeness of the 1,510-item inventory.** Source paths, sweep sensitivity and four
   experiments verified, but no audit of whether every rule-bearing corpus statement is inventoried.
   `README.md:28-30` concedes this is not provable by a self-authored manifest.
6. **Whether B1 is intended.** No design note found explaining the pin's scope.
