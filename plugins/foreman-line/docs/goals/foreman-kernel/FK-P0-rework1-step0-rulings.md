# FK-P0 Rework Round 1 — Coordinator Rulings on Step 0 Flags F1–F10

**Ruled:** 2026-09-02. Every factual claim below was verified on disk before ruling.

## Verification of the builder's claims

| Claim | Check | Result |
|---|---|---|
| F2: `loop-directive.md` also drifted | branch-to-branch sha256 | **TRUE** — `b7dd2ee3…` → `f2e9c89a…`. The coordinator's own closure check recorded this and the directive still under-scoped BLOCKER 2 to one file. |
| F8a: a third use of the pin at `:2249` | `grep -n` | **TRUE** — `444` (definition), `2249` (R13 migration record `resultDigest`), `2402` (global predicate). |
| F7: no rules currently retired | `grep -o retirementState` | **TRUE** — 449 `active-reading`, 17 `historical-only`, **0** `retired-from-agent-reading`. |
| F9: the spec claims 504 tests | spec line 1085 | **TRUE** — "504 tests". |

The builder is accurate on every checkable claim. Two of them correct the coordinator.

---

## F1 — Base commit. CONFIRMED.

Proceed from `1cd25b1`. The directive named `a703941`; `1cd25b1` is its docs-only child. Benign.

## F2 — Two drifted sources, not one. CONFIRMED, and the directive was wrong.

Fix both `charter.md` and `loop-directive.md`. **This is a coordinator error, not a builder
discovery gap:** the closure check at `FK-P0-coordinator-closure-check.md` already recorded
`loop-directive.md … DIFFER`, and BLOCKER 2 was still written as though the charter were the only
drifted source. Good catch. It is exactly the sweep mandate working as intended — the listed
instances were a floor, and you found the ceiling.

## F3 — The bound document the coordinator must mutate routinely. RULED: accept and document.

Your recommendation is adopted, with one addition that removes the immediate breakage.

**Accept it as a known operational property.** A source-bound registry *should* require that
changing a bound source is a deliberate act with a regeneration step — that is the mechanism, not a
bug in it. `loop-directive.md` is unusual only in how often it changes.

**Do not exclude the volatile block.** You were right to refuse. A hand-placed exclusion is defect
class #7, and a typed `exclusionDisposition` over a whole section would create precisely the hiding
place the A2 reviews spent three rounds killing.

**Coordinator commitment, so your regeneration is not stale on arrival:** this coordinator will not
mutate `loop-directive.md` between your regeneration and the Gate 3 merge. Round-1 state will be
recorded in the goal directory's other documents instead. Regenerate against today's bytes.

**Document it in the README** (fix 11's neighbourhood): bound sources that change require
regeneration; `loop-directive.md` changes most often; a regeneration triggered only by its
ownership/state blocks is a mechanical re-digest rather than a canon change, and must still be a
deliberate, reviewed act.

**Recorded as an open design question, not settled:** whether operational-state documents belong in
a digest-bound corpus at all is a real question this ruling does not answer. It is logged for
FK-P0's successor or a later amendment. Do not attempt to settle it in this round.

## F4 — `sourceSnapshotCommit`. RULED: option (a), update it. No amendment required.

Update `sourceSnapshotCommit` and every per-source `snapshotEvidence.commit` to the actual commit
whose bytes you hashed. Option (b) is unacceptable and you were right to say so — a binding that
asserts a commit whose bytes were not hashed is a knowingly false statement, in a parcel whose
purpose is honest representation.

**No spec amendment is needed, because the spec already authorizes this.** Constraints line 96-97:
the initial construction commit's "full-file hashes and changed-file proof are parcel-time evidence
only, **not a permanent shipped freeze**." AC3 says the same. A spec that calls something "not a
permanent freeze" cannot also require it be frozen. The literal `51857a3…` in Constraints is
descriptive of the initial dispatch, not a binding target.

**You raised the spec's Step 0 stop correctly** ("source drift is a stop, not an automatic
source-snapshot update"). This ruling is the answer to that stop. Record the advance as a typed
migration record — that is what the chain is for, and it is what makes the update auditable rather
than silent.

## F5 — Keep 18 sources. CONFIRMED.

Do not add the round-1 paper trail to the source set. Your reading is correct on all three grounds:
the corpus is contract-bound, AC4 requires the "exact eighteen-source set", and the suite carries a
negative control that rejects a nineteenth source.

The substantive reason: those documents are **findings about canon, not canon**. A triage record
and a review-findings document govern nothing. Binding them would make the registry's own paper
trail part of the corpus it audits, which is circular.

## F6 — "D1-D20" descriptive staleness. CONFIRMED.

Your reading is right. AC3's general obligation governs; inventory D21 and the A1 content. Treat
the "D1-D20" phrase as descriptive staleness. **Report it in your completion claim** as a spec
staleness instance rather than fixing it silently — it is the same claim-versus-reality class this
round is about, and the coordinator will route it.

## F7 — New violation code and API change. APPROVED WITH A CHANGE. Do not make `resolveAuthority` filesystem-capable.

**Approved:** `validateRegistry(document, options?: { repoRoot?: string })`, back-compatible and
additive; and the new `RETIREMENT_EVIDENCE_UNVERIFIED` result code.

**Changed:** your proposal to give `resolveAuthority` the same treatment is **rejected**, for two
reasons. It would widen an exported API to filesystem capability on the path FK-P1 calls per
governed action; and D21 budgets that path at p95 ≤ 20 ms / p99 ≤ 50 ms, which a per-query
filesystem stat cannot respect. Reviewer A already measured 133 ms without any I/O.

**Use this instead — it needs no filesystem access and is fail-closed by construction.** Retirement
*removes* enforcement. Therefore the fail-closed direction is that an **unverified retirement does
not take effect**: the rule stays `active` and keeps controlling. So:

- `validateRegistry` **without** a repo root: a `retired-from-agent-reading` rule yields
  `RETIREMENT_EVIDENCE_UNVERIFIED`, and the rule is treated as **not retired**.
- `validateRegistry` **with** a repo root: digests are resolved and verified; a verified retirement
  takes effect.
- `resolveAuthority`: unchanged signature, no I/O. It simply never honours an unverified
  retirement, so a forged or unverifiable retirement cannot delete a rule from resolution — which
  is exactly the B2 failure mode, closed without widening the API.

This is strictly stronger than what the directive asked for and costs the shipped artifact nothing,
since there are 0 retired rules today.

## F8 — The pin. Design APPROVED with one required correction, plus a scope ruling.

### (a) The third use — CONFIRMED and in scope

Verified at `:2249`. Removing only `:2402` would leave the pin half-alive. Both uses are yours.
The migration-record check must reference the chain, not a hardcoded constant.

### (b) Your chained-migration-record design — APPROVED, but it is self-authorizing as stated

The design is right and it is the mechanism the spec defines. **But as written it has a hole you
must close:** if the predicate is "the manifest digest equals what the document's own newest
migration record declares," then anyone editing the file appends a record declaring their own
digest and self-authorizes. `reconciliations` are not covered by `registryBindingManifestDigest`,
which is what makes your design non-circular — and also what makes it forgeable.

**Required:** anchor the chain. A **genesis** migration record whose digest is pinned, with every
subsequent record chaining to its predecessor's digest — the same `prevHash` linkage this
repository's receipt chain already uses (see `SCAF-P3`, the receipt-chain walker: genesis → sequence
→ `prevHash`). Follow that existing shape rather than inventing one.

This does **not** reintroduce the AC3 violation. AC3 forbids the *current corpus state* being a
frozen shipped predicate. A genesis anchor pins **history**, not the present, and admits any
correctly re-digested registry that appends a properly chained record. That is the whole difference
between a freeze and a chain.

**State the honest limit in the README** (AC14): this makes silent substitution *detectable*, not
impossible. Anyone who can edit the file can append a well-formed record. The registry is a
contract, not a trust root; real anti-tamper is Git history plus human review. Say so plainly.

### (c) How far to unwind — RULED: do not delete the corpus-exact predicates

Confirmed, and your reasoning is accepted in full. `SEMANTIC_EQUIVALENCE`,
`R11_PROTECTED_NORMATIVE_ITEMS`, `R12_GATE2_ALLOW_RULE_IDS` and the exact-cardinality assertions are
**real teeth and Required-Tests-mandated**. Do not delete them. Do **not** invent a "shipped
corpus?" conditional bypass — you correctly identified that it would be the pin wearing a new hat
and would collide with AC4's no-cardinality-conditioned-bypass clause.

Report the true achieved size. `pass-minimal.yaml` staying large is an honest outcome; overclaiming
fix 15 as closed is not.

### (c-2) But fix 15's real win is still available — take it

The ~279,000 committed fixture lines are not required by any predicate. **Generate the seven reject
fixtures at test time** from the shipped registry plus a named mutation function, instead of
committing eight ~39,897-line files. Fix 5 makes each test assert its *named* code, which holds even
when a generated fixture also trips unrelated cardinality violations — so nothing weakens.

That removes the bulk, kills the drift channel outright (there is no second copy to drift), and
should cut the runtime that is causing the crashes. If a fixture genuinely must stay on disk, say
which and why.

## F9 — 504 versus the measured count. CONFIRMED.

Do not reconcile silently. Establish the measured number in your first task; report it explicitly;
and report the spec's 504 as an **unmet historical claim**, not as a target you failed. Verified at
spec line 1085.

This is another instance of the claim-versus-reality class that produced this entire round, and it
belongs in the record next to the others.

## F10 — Fix 18 findings that need spec decisions. CONFIRMED.

Report every one. Implement a missing invariant when it lives in `src/validate.ts` and the
invariant's content is unambiguous. **Stop and report** the moment closing one requires deciding
*what the invariant should be* — that is a coordinator ruling, not a builder judgment call.

---

## Standing instruction for the rest of this round

Your first action remains the pristine `npm test` run, alone, with the TAP reporter, before any
edit. Your plan to run it via the command line rather than editing `package.json` first is correct
and is adopted — it keeps the control genuinely zero-write.

Report (a) / (b) / (c) before touching a file. On (b), stop for a ruling.
