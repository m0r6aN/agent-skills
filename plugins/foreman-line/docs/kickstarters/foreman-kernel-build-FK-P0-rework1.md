# FK-P0 Rework Directive — Round 1 (of a maximum 2)

## Standing constraints
Apply `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` in full. You are a builder,
not a reviewer: you fix and commit, but you never grade your own work.

## STEP 0 — RESTATE AND STOP. NO CODE BEFORE COORDINATOR CONFIRMATION.

Your first action is to restate, and then stop and wait:

1. The scope of this rework in your own words.
2. The exact Allowed Files (they are unchanged from the spec — enumerate them).
3. Your branch and worktree (below).
4. Dependencies and the base commit you are working from.
5. The contract you must not break.
6. How you will verify.
7. Every item you believe is out of scope.
8. Every flag: anything you think the spec gets wrong, anything you cannot do inside Allowed
   Files, anything that looks like it needs a spec or charter amendment.

**Write nothing to any file until the coordinator confirms.** A flag that touches a locked charter
decision (D1–D21), an external-effect boundary, a security boundary, or the exact Allowed Files
requires a ratified amendment before code — raise it at Step 0, do not work around it.

## Worktree and branch — named, not ambient

- **Worktree:** `D:/Repos/agent-skills-worktrees/fk-p0-canon-authority-enforcement-registry`
- **Branch:** `codex/fk-p0-canon-authority-enforcement-registry`
- **Base commit:** `a703941` (merge bringing the current charter + round-1 paper trail onto this branch, on top of the coordinator-ratified R14 amendment `df639f1`)

Never touch the ambient `D:/Repos/agent-skills` checkout. Never touch another worktree. The
ambient checkout has a user-owned change at `plugins/foreman-line/routing-policy/routing-policy.yaml`
— do not absorb, revert, or reference it.

There is a `stash@{0}` on this worktree from the dead prior session. **Leave it alone.** It is
superseded R11 state, already dispositioned by the coordinator. Do not apply, drop, or inspect-and-act on it.

## Read first

- `plugins/foreman-line/docs/specs/active/FK-P0-canon-authority-enforcement-registry.md`
  — **as amended by R14**. AC5 and AC12 changed. Read them as they now stand, not from memory.
- `plugins/foreman-line/docs/goals/foreman-kernel/FK-P0-amendment-R14.md` — what changed and why.
- `plugins/foreman-line/docs/goals/foreman-kernel/FK-P0-triage-round1.md` — the disposition table.
- `plugins/foreman-line/docs/goals/foreman-kernel/FK-P0-review-A-findings.md` — full findings.

## The sweep mandate — read this twice

Fix **every instance of each defect class below, not only the listed instances.** The findings are
a floor, not a ceiling. If a class has three more occurrences the reviewers did not find, all three
are yours. No role is exempt from the sweep, including where the fix touches code the reviewers
praised.

## What must be fixed — 4 BLOCKERs first, in this order

**The first two are one defect and must be fixed together.**

### BLOCKER 1 — the manifest pin is a shipped validation predicate, which the spec forbids

`src/validate.ts:444` defines `SHIPPED_BINDING_MANIFEST_DIGEST`; `:2402` makes it an unconditional
predicate of every validation, and `registryBindingManifestDigest` (`:715-741`) includes
`snapshotEvidence`, which carries `fullFileSha256`.

The spec forbids this **twice**:
- Constraints (line ~97): the starting commit's full-file hashes are "parcel-time evidence only,
  **not a permanent shipped freeze**."
- **AC3**: those hashes "are captured only as parcel-time evidence and **are not a shipped
  validation predicate**."

Consequence today: exactly one registry document can ever be `valid`. A fully self-consistent,
correctly re-digested registry is rejected with the single objection `MIGRATION_EVIDENCE_INVALID`.
`npm run generate` cannot produce a validatable artifact, because `src/generate.ts` contains **zero**
references to the pin — verify that yourself.

**Fix:** replace the global frozen-manifest equality with a predicate that enforces the *migration
chain the spec actually defines* — identity, locator, and normalized-value bindings, plus the typed
migration records required when an operative value or locator changes — and that **admits a
correctly re-digested registry**. Anti-tamper must come from the per-rule and per-item digest
bindings that already exist and already work, not from one hardcoded whole-corpus constant.

Preserve every escalation refusal: Reviewer A proved seven authority-escalation probes are refused
**independently of the pin**, and Reviewer B proved `REFUSE → ALLOW` downgrade is caught
independently of it. Those must still be caught after your change. If any of them turns out to have
depended on the pin, that is a finding — stop and report it, do not paper over it.

### BLOCKER 2 — the registry is source-bound to a charter that no longer exists

The registry binds `charter.md` at `fullFileSha256: a69b19d69106243a918b2b228b29b8a85d854c8966e3d578ed1036105c90cc84`.
That is the **superseded 405-line charter**. The current charter is
`c19359374480b03c39ce04316f94007fbb87e3be2b5be39bca8dd4072164234d` (435 lines), carrying ratified
amendment A1 / decision D21.

**RESOLVED BY THE COORDINATOR before your dispatch.** The goal branch has been merged into this
one (`a703941`), so the current 435-line charter is now physically present at
`plugins/foreman-line/docs/goals/foreman-kernel/charter.md` on this branch. Verify that yourself
before regenerating:

```
sha256sum plugins/foreman-line/docs/goals/foreman-kernel/charter.md
# expect c19359374480b03c39ce04316f94007fbb87e3be2b5be39bca8dd4072164234d
```

Regenerate the registry's source bindings against the corpus **as it now stands on this branch**.
Do not hand-edit digests to make validation pass — regenerate them, and if the regeneration path
cannot produce a validatable artifact, that is BLOCKER 1 and it must be fixed first.

Note that the merge also brought the round-1 paper trail onto this branch. Those documents are
**canon sources the registry may need to inventory** — check whether the eighteen-source set is
still correct, and flag it if adding them is required, since the source set is contract-bound.

### BLOCKER 3 — `validate` accepts forged retirement evidence

`src/validate.ts:1728-1777` checks four non-null slots, correct `kind`, four distinct `path`
strings, and the `standing-constraints` refusal. It never resolves a path, never verifies a
`digest`, never opens an artifact, never checks `record.ruleId`. Digest verification exists only in
`sweepRegistrySources` (`:3398-3492`), and **neither `resolveAuthority` nor the `validate` CLI ever
calls sweep.**

Proven: four correctly-typed artifacts at four real paths with all-zero digests are **accepted** by
`validateRegistry` and **refused** by `sweep`. AC10 says "digest-verified" without qualification.

**Fix:** make retirement evidence genuinely digest-verified on the predicate that gates authority
resolution. AC10 was deliberately **not** narrowed — the claim stays, the code rises to it.

Design note, and a flag you should raise at Step 0 if you disagree: `validate` is currently pure
(document-only) while `sweep` takes a `repoRoot`. Verifying digests needs filesystem access. The
coordinator's expectation is that `validate` gains an **optional** repo root, and that **without
one it must not silently accept** retirement evidence it cannot verify — it should report an
explicit unverified/refused outcome rather than passing. Fail-closed, not fail-quiet. If that
requires a new violation code, flag it at Step 0.

### BLOCKER 4 — `resolveAuthority` throws instead of failing closed

`src/validate.ts:851` already anticipates a nullish query (`typeof query?.authoritySubject === 'string' ? … : 'invalid.query'`)
and then passes the nullish value straight through to `queryIsValid` (`:751`), which dereferences
it unguarded. `resolveAuthority(document, null)` and `(document, undefined)` both throw `TypeError`.

Standing Constraint #1 admits no exemption, and this is an exported API (`src/index.ts:10`) of a
`risk: critical` parcel. A caller with a broad `catch` turns a fail-closed gate into a fail-open one.

**Fix:** return the existing `REQUIRE_HUMAN` / `INVALID_QUERY_SCOPE` shape. Add tests for `null`,
`undefined`, and non-object queries — there are 26 `resolveAuthority(` call sites in the suite and
**none** covers these.

## Then these — all of them

| # | Fix | Where |
|---|---|---|
| 5 | Seven CLI negative tests assert only `status===1` and `violations.length>0`. Assert the **named code** per fixture, reusing the `[name, code]` table already at `:39-47`. Proven inert: relabelling all five codes to junk left all seven green. | `tests/schema-validation.test.ts:82-97` |
| 6 | Delete the unreachable `CONFLICT` outcome from the resolution type and align code + README to amended AC5. | `src/validate.ts:827-839`, `src/types.ts`, `README.md:153-156` |
| 7 | Delete the hardcoded rule-ID exclusion. It contradicts AC5 and README:200-202, and only strips `consideredRuleIds` — never a decision. Then fix the test it props up (`semantic-invariants.test.ts:2860`) to assert the rule **is** considered but **not** controlling; its other four assertions already prove the non-grant. | `src/validate.ts:795` |
| 8 | Three tests are named for invariants they never assert — all three check only `REQUIRE_HUMAN/REGISTRY_INVALID` and never inspect `consideredRuleIds`/`controllingRuleIds`. Make them assert the named property on a **valid** registry. | `semantic-invariants.test.ts:899`, `:913`, `:933` |
| 9 | `RegExp.test` coerces, so `authoritySubject: 1` matches. Add an explicit `typeof === 'string'` guard + test. | `src/validate.ts:751` |
| 10 | `sweep` returns exit 1 (= "the registry is invalid") for operator misconfiguration. A `--repo-root` that exists but is not a real Git worktree root must be exit 2, matching the nonexistent-root case. Amended AC12 now requires this. | `src/cli.ts:69-82`, `src/validate.ts:3060-3084` |
| 11 | README must state the sweep's non-authority: it verifies the 18 declared sources and **cannot** detect binding canon introduced in an undeclared file. Proven: a new unregistered `.md` asserting merge authority is undetected. AC14 requires documenting non-authority. | `README.md` |
| 12 | Assert the **prose** case is detected (`SOURCE_ITEM_UNCOVERED`), not only the four inert shapes. Amended AC12 now requires this. | `tests/corpus-sweep.test.ts:295-315` |
| 13 | Expose `classification`, `assurance`, `enforcementOwner`, `severity` on a resolved result, so a structural refusal from a kernel that does not exist cannot read as a mediated one. 254 of 466 rules are `pre-action-refusal` forced to `kernel-policy`/`structural`. Amended AC5 now requires this. | `src/types.ts:260-268`, `src/validate.ts` |
| 14 | `R12_GATE2_ALLOW_RULE_IDS` is a name-only waiver; Standing Constraint #13 requires identity **+ location + value**. Follow the correct pattern already in `src/registry.ts:215-308`. | `src/validate.ts:254-258` |
| 15 | Once BLOCKER 1 lands, build a **genuinely minimal** positive fixture and rebuild the seven reject fixtures as small programmatic mutations of one base. Today all eight are ~39,897-line copies (`pass-minimal.yaml` is **byte-identical** to the shipped registry) — ~279,000 lines encoding ~117 lines of intent, and a suite that takes ~38 minutes. Add the byte-equality or equivalent test that closes the drift channel (the manifest covers neither `reconciliations` nor `operationAuthority`). | `src/generate.ts:12350-12352`, `tests/fixtures/*` |
| 16 | `validateStructure` is called twice on the same input. | `src/validate.ts:2416`, `:2427` |
| 17 | Probe NTFS alternate-data-stream paths (interior `:`, e.g. `docs/foo.md:$DATA`). `pathProblem` filters `\`, `*`, `?`, and leading drive letters but not an interior colon. Segment-wise `realpathSync` makes escape unlikely — **prove it, then pin it with a test.** | `src/validate.ts:2975-2989` |
| 18 | Re-run the negative-suite mutation census after BLOCKER 1 lands. Reviewer A classified 25 of ~197 tests in `semantic-invariants.test.ts`; **14 tests asserting `MIGRATION_EVIDENCE_INVALID` are unclassified** (`:287`, `:297`, `:306`, `:315`, `:495`, `:534`, `:626`, `:1213`, `:1323`, `:2091`, `:2421`, `:3007`, `:3040`, `:3544`). Any that go green once the pin is gone were only ever hash-backed — each is a real invariant with no implementation. Report them; fix them if they fall inside Allowed Files. | suite-wide |
| 19 | Document, do not "fix": three grep-style self-tests (`corpus-sweep.test.ts:1106-1112`, `:1114-1120`, `:1302`) are `assert.doesNotMatch` over source **text** — lint rules, not behavioural tests, defeated by `source['sourceId']`. State plainly they are not R10 evidence. Also state that the seven named axes exercise **five** distinct predicates (rows 1/2 and 3/4 pair up), so downstream parcels do not over-read the coverage. | tests + README |
| 20 | **The suite reports failures opaquely.** `package.json` runs the default `spec` reporter, which buffers a file's entire output to completion — so when `semantic-invariants.test.ts` dies, everything is lost and the result is a bare `'test failed'` naming no invariant. Switch to a streaming reporter (TAP) or otherwise guarantee per-test output survives a crash. A verification gate that cannot say *what* failed is not a gate. | `package.json` |
| 21 | **The suite is not reliably runnable — treat as a BLOCKER.** See the section below. Reduce the memory footprint so the file completes reliably: ~118 `structuredClone` calls over a 39,897-line / 1,510-item / 466-rule document, in one process. Fix 15 (genuinely minimal fixtures) is expected to do most of this; verify it does. | `tests/semantic-invariants.test.ts`, fixtures |

## Explicitly NOT in scope

- Any FK-P1–FK-P21 behaviour: no hooks, no MCP server, no SQLite, no Docker, no `authorizeAction`,
  no enforcement promotion, no receipt minting.
- Per-query performance work. `resolveAuthority` costs ~133 ms because it fully revalidates; that
  is recorded as a forward risk **owned by FK-P1**, not an FK-P0 defect. Do not add a cache — a
  caching design here would be unratified.
- Editing the charter, loop directive, plan review, SPEC-CONVENTION, standing constraints, routing
  policy, or any package outside `plugins/foreman-line/authority-registry/`.
- Editing the spec. R14 is already ratified and committed; if you need more, flag at Step 0.

## Verification — run it yourself before claiming done

Sequentially, in PowerShell, from `plugins/foreman-line/authority-registry`, capturing **complete**
output before trusting any exit code:

```
node -v                      # must be >= 22
npx tsc --noEmit
npx biome check .
npm test
npx tsx src/cli.ts validate authority-enforcement-registry.yaml
npx tsx src/cli.ts sweep authority-enforcement-registry.yaml --repo-root <repo root>
```

### YOUR FIRST TASK AFTER STEP 0 — settle whether the suite actually passes

**This is genuinely open, and the coordinator will not pretend otherwise.** Evidence to date:

- One full `npm test` run by the coordinator returned **exit 0** (whole suite green).
- **Four** other full runs — two by Reviewer A (including an unmutated **pristine control**), one by
  Reviewer B, one by the coordinator — all died the same way: `tests/semantic-invariants.test.ts`
  reported as a **single failing test**, `pass 0 / fail 1`, `'test failed'`, no per-test output,
  after 23–38 minutes.
- Every one of those four ran while other heavy node processes were live on the machine. The green
  run did not have exclusive use of the box either, so contention is a hypothesis, not a conclusion.
- Reviewer B established the file is **not environment-sensitive**: it imports only `node:fs`,
  `node:path`, `node:test`, `node:url`, `yaml`, and the package's own `src/` — no `repoRoot`, no
  `execFileSync`, no git.
- **No CI has ever run this package**, so AC13's `npm test` gate has only ever been met by hand.

So, before any fix: **run `npm test` alone on an otherwise idle machine, with a streaming reporter,
and capture complete untruncated output.** Then report which it is:

- **(a) It passes.** Record the true full-suite count — that becomes the tripwire baseline.
- **(b) A real assertion fails.** Then AC13 is red and that failure outranks everything else on
  this list. Report it and stop for a coordinator ruling before fixing anything else.
- **(c) The process dies (heap exhaustion or similar).** Then fix 21 is a BLOCKER and comes before
  the numbered fixes, because nothing below can be verified until the suite can be run twice.

Do not guess between these. Do not start fixing on the assumption of (a).

**Test-count tripwire.** The baseline is **not yet established** — that is your first task above.
What is known: **133 tests pass across the five files other than `semantic-invariants.test.ts`**,
and that file declares 168 top-level tests plus 29 inside loops, so a genuine full-suite figure
should land near ~330, not 133. **Do not treat 133 as the baseline.** Establish the real number,
state it explicitly, and if your rework lands with fewer passing tests than that, stop and report —
even if everything is green.

If you rebuild the fixtures (fix 15), the suite should get dramatically faster. Report the runtime;
a large drop is expected and good, but the **count must not fall**.

## Completion claim — the shape matters

A wrongly-shaped claim is treated as empty. When done, report:

1. The committed SHA. Never claim completion on uncommitted work.
2. Exact final test count and the full `npm test` summary line.
3. Each of the 4 BLOCKERs and 15 numbered fixes: closed / not closed / not applicable, with the
   file:line where you closed it.
4. Every additional instance you found via the sweep mandate that was not on the list.
5. Everything you could **not** close, and why. An honest gap beats a confident overclaim — this
   parcel exists to represent honestly where enforcement is real, so overclaiming inside it is a
   category error.
6. Anything you believe the coordinator got wrong.
