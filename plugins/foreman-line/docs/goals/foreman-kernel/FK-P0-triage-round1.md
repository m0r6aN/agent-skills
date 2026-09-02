# FK-P0 — Coordinator Triage, Review Round 1 (this owner)

**Reviews:** two independent, both completed (AC15 satisfied).
**Reviewer A** (contract/authority): **REWORK REQUIRED** — 2 BLOCKER, 8 SHOULD-FIX, 6 INFO.
**Reviewer B** (test teeth/hostile input): **SHIP WITH FOLLOW-UPS** — 1 BLOCKER, 5 SHOULD-FIX, 7 INFO.

**COORDINATOR RULING: REWORK REQUIRED.** Rework round 1 of a maximum 2.

## The reviewers converged on facts and split on severity

This is the healthy shape, not a conflict. Four findings were made independently by both sessions
with no contact between them:

| Finding | Reviewer A | Reviewer B | Convergent? |
|---|---|---|---|
| Manifest pin dominates every result | **B1 (BLOCKER)** | I2 (INFORMATIONAL, "defensible anti-tamper") | Same fact, 2-level severity split |
| Forged retirement evidence passes `validate` | **B2 (BLOCKER)** | S2 (SHOULD-FIX) | Same fact, 1-level split |
| `resolveAuthority` throws on nullish query | S4 (SHOULD-FIX) | **B1 (BLOCKER)** | Same fact, 1-level split — inverted |
| Seven CLI negative tests are inert | I1 (INFO) | S1 (SHOULD-FIX) | Same fact |

Two independent sessions finding the same four defects is strong evidence all four are real.
Where they split on severity, the coordinator rules.

## The tie-breaker on the pin — neither reviewer cited it

Reviewer A ranked the pin BLOCKER but recorded a counter-reading: AC7's literal words forbid a
byte pin *in the suite*, and this pin lives in `src/`, so A could not rule out that it was an
intended immutability design ("I could not find a design note explaining the pin's scope").
Reviewer B accepted that counter-reading and demoted it to INFORMATIONAL.

**Both missed that the spec forbids it directly, twice.** Coordinator-verified on disk:

- **Spec Constraints, line 97:** the starting commit's "full-file hashes and changed-file proof are
  parcel-time evidence only, **not a permanent shipped freeze**."
- **AC3:** "Full-file hashes at `51857a3a…` are captured only as parcel-time evidence and **are not
  a shipped validation predicate**."
- **`src/validate.ts:715-741`:** `registryBindingManifestDigest` includes
  `snapshotEvidence: source.snapshotEvidence` — the object carrying `fullFileSha256`.
- **`src/validate.ts:2402`:** that digest is an unconditional predicate of every validation.

The full-file hashes are therefore both a permanent shipped freeze and a shipped validation
predicate. **This is a spec-conformance failure, not a design preference**, and it removes the only
ground on which the finding could be accepted-as-documented. Ruling goes to Reviewer A.

## Disposition table

Legend: **FIX** = must close in rework · **DOC** = accept as documented · **INFO** = recorded only.

| # | Finding | Source | Disposition | Rationale |
|---|---|---|---|---|
| 1 | Manifest pin is a shipped validation predicate over full-file hashes | A-B1 / B-I2 | **FIX — BLOCKER** | Direct AC3 + Constraints violation (above). Replace with a ratified-migration predicate that admits correctly re-digested registries. |
| 2 | Registry source-bound to the superseded charter `a69b19d6…` | Coordinator C1 | **FIX — BLOCKER** | Regenerate against the current charter `c1935937…` (A1/D21). Same defect as #1 from the data side. |
| 3 | Forged retirement evidence accepted by `validate` | A-B2 / B-S2 | **FIX — BLOCKER** | AC10 says "digest-verified" unqualified. Masked by #1 today; live the moment #1 is fixed. Move digest resolution into `validateRegistry` or narrow AC10 + README. |
| 4 | `resolveAuthority` throws `TypeError` on nullish query | A-S4 / B-B1 | **FIX — BLOCKER** | Standing Constraint #1 admits no exemption; exported API of a `risk: critical` parcel. `validate.ts:851` already anticipates nullish and then passes it through unguarded. |
| 5 | Seven CLI negative tests assert no code | A-I1 / B-S1 | **FIX** | AC11 requires failure "for their named invariant." B proved inertness by relabelling all five codes to junk — all seven stayed green. Cheap: reuse the `[name, code]` table at `:39-47`. |
| 6 | `CONFLICT` outcome unreachable | A-S1 | **FIX (honesty)** | AC5 and `README.md:153-156` both claim it; 372-query survey returned 0. Either delete the variant and correct the claims, or demote `RULE_CONFLICT`. |
| 7 | Hardcoded rule-ID exclusion at `validate.ts:795` | A-S2 | **FIX** | Contradicts AC5 ("historical/generic rules remain visible") and README:200-202. Deleting it changes `consideredRuleIds` only, never a decision. |
| 8 | Three resolver tests assert nothing they are named for | A-S3 | **FIX** | Lesson #32 class, `semantic-invariants.test.ts:899/:913/:933`. |
| 9 | Non-string `authoritySubject` coerced by `RegExp.test` | A-S5 | **FIX** | Fail-closed only by accident of cross-type comparison. Add `typeof === 'string'` + test. |
| 10 | `sweep` returns exit 1 for operator misconfiguration | B-S3 | **FIX** | Exit 1 means "the registry is invalid" — a false accusation against canon. Only the nonexistent-root case is classified operational; existing-but-wrong root is not. |
| 11 | README does not state the sweep's non-authority over unregistered files | B-S4 | **FIX** | AC14 explicitly requires documenting non-authority. B proved a new unregistered `.md` asserting merge authority is undetected. |
| 12 | AC12's "unrelated bytes" claim is false for prose | B-S5 | **FIX + SPEC AMENDMENT** | Behaviour is correct and deliberate; the *claim* and the test are wrong. Requires AC12 rewording — coordinator-ratified, committed alone before code. |
| 13 | `AuthorityResolution` omits classification/assurance/enforcementOwner/severity | A-S7 | **FIX** | Coordinator ruling requested and given: the parcel's stated purpose is honest representation of where enforcement is real. A structural `REFUSE` from a kernel that does not exist must not be indistinguishable from a mediated one. Additive and optional; cheaper now than after FK-P1 consumes the shape. |
| 14 | `R12_GATE2_ALLOW_RULE_IDS` is a name-only waiver | A-S8 | **FIX** | Standing Constraint #13 requires identity + location + value. Not exploitable today only because a second table stays in sync. |
| 15 | No test asserts `pass-minimal.yaml` == shipped registry | B-I4 | **FIX** | Latent drift channel: the manifest covers neither `reconciliations` nor `operationAuthority`. Subsumed by #1 — once the pin goes, build a genuinely minimal fixture. |
| 16 | `validateStructure` called twice on one input | B-I6 | **FIX** | Trivial; doubles schema cost on the path `resolveAuthority` invokes per query. |
| 17 | Fixture bloat: ~279k lines encoding ~117 lines of intent | Coordinator C2 | **FIX** | Root cause is #1 (no smaller positive fixture can validate while the manifest is pinned). Fixing #1 unblocks it. Target: one base fixture + seven programmatic mutations. |
| 18 | `resolveAuthority` costs 133 ms/query | A-S6 | **DOC + forward risk** | Not an FK-P0 defect; D21 is not binding here. But D21 budgets p95 ≤ 20 ms / p99 ≤ 50 ms, so this exceeds the ratified kernel budget by ~6.6×. Recorded as a live risk **owned by FK-P1**, which must not inherit per-query full revalidation. |
| 19 | Three grep-style self-tests decoupled from behaviour | B-I5 | **DOC** | Real limitation, cheap to state. Must not be counted as R10 evidence; `assert.doesNotMatch` over source text is a lint rule, not a behavioural test. |
| 20 | Seven named axes exercise five distinct predicates | B-I3 | **DOC** | Rows 1/2 and 3/4 pair up. Downstream parcels must not over-read the coverage as seven independent guarantees. |
| 21 | NTFS alternate-data-stream paths unverified | B-gap 4 | **FIX (probe)** | `pathProblem` filters `\`, `*`, `?`, leading drive letters but not an interior `:`. Segment-wise `realpathSync` makes escape unlikely; unverified is not safe. Probe and pin. |
| 22 | 14 of 32 `MIGRATION_EVIDENCE_INVALID` tests unclassified | A-gap 1 | **FIX (re-census)** | Once #1 lands, re-run the census: any test that goes green is an invariant that was only ever hash-backed. |

## What must be preserved through rework

Both reviewers independently confirmed these hold **independently of the manifest pin**. The rework
must not regress them, and the test-count tripwire covers them:

- **Operation matrix (AC6)** — seven authority-escalation probes all refused with
  `AUTHORITY_ESCALATION`, with and without the pin. Exactly one `ALLOW` across 372 queries: the
  bounded Gate 2 dispatch grant, as AC5's final clause requires.
- **Source sweep sensitivity (AC12 detection half)** — unregistered paragraph →
  `SOURCE_ITEM_UNCOVERED`; changed operative value → `VALUE_DIGEST_MISMATCH`; renamed heading → 9
  violations; unrelated file → clean.
- **All seven negative axes are load-bearing at `schema-validation.test.ts:48-52`** — Reviewer B
  neutered each bound predicate one at a time and each flipped exactly the expected fixtures and no
  others. **AC11 holds at that layer.** This is the single most valuable result of the round and it
  had never been checked in twelve prior rounds.
- **Path handling** — `pathProblem` + `resolveRegularFile` defeat symlink, junction, and
  TOCTOU-style component swaps via segment-wise `lstatSync` refusal and `realpathSync` containment.
- **No ReDoS** — measured flat ~63-79 ms from 2 KB to 120 KB of adversarial input.
- **`REFUSE → ALLOW` downgrade caught independently of the pin.**

## Rework-round accounting

Round 1 of a maximum 2 under this owner's reinstated tripwire. Test-count tripwire: the round
opens at the count the deterministic pass establishes; a rework that lands with fewer tests than it
started with stops the loop regardless of green.
