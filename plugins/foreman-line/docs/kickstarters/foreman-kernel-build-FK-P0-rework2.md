# FK-P0 rework round 2 — builder kickstarter

## Standing constraints
Apply `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` in full.

## Step 0 — restate and stop
**Write nothing until the coordinator confirms.** Restate: every item below in your own words, what
you think each remedy is, which you disagree with, and anything you think is missing. Flag a spec gap
rather than inventing around it — a real gap becomes a ratified amendment committed alone before any
dependent code. Two amendments already landed that way this round; a third is not a problem.

## Subject
- Branch `codex/fk-p0-canon-authority-enforcement-registry`, worktree
  `D:/Repos/agent-skills-worktrees/fk-p0-canon-authority-enforcement-registry`
- Package `plugins/foreman-line/authority-registry/`
- HEAD `8c23c29`. Last code commit `0ad7ee3`; `63fe955`, `957e901`, `8c23c29` are coordinator spec work.
- Spec as amended by **R14–R20**. Read `FK-P0-amendment-R19.md` and `FK-P0-amendment-R20.md` first —
  they are new, they are why this round exists, and they carry the reproductions.

## This is the last rework round
The ratified loop directive allows this owner **two** rework rounds. This is the second. If it does
not land clean, I stop and hand the parcel to the developer with the state as it stands. That is not
a threat, it is a scope constraint: **tell me at Step 0 if the list below cannot be landed properly
in one round**, and I will cut it rather than let you rush it. A partial round done honestly is worth
more than a complete one done fast — R16 was rushed hardening and it is the reason we are here.

---

## BLOCKER 1 — R19 conformance: the chain head has no floor

Two independent reviewers found the R16 head exemption admits a tampered registry that validates
green, by two different routes. **I reproduced both.** Full detail and exact reproductions are in
`FK-P0-amendment-R19.md`; the short form:

- **Route A.** `chainLinkFor` (`src/validate.ts:829-853`) picks each chain command with
  `Array.prototype.find`. `unshift` one extra `command-result` onto the head's `observedEvidence`
  declaring the manifest of a tampered document → `valid: true`, 0 violations. Payload used: flip all
  seven `gate3.merge-authority` rules to `historical-only`, i.e. silently delete the rules saying
  merges are human-owned. `resolveAuthority` goes `RESOLVED/REFUSE/critical` → `REQUIRE_HUMAN` with no
  controlling rules.
- **Route B.** Delete the head record; the previously pinned record is promoted into the exemption and
  out of its byte pin. Repoint it at the live manifest and a falsified
  `sources[0].snapshotEvidence.fullFileSha256` validates clean.

**R19 adds four obligations to AC4.** Implement all four:
1. **Exactly one chain link per record** — filter, require length 1, reject otherwise. `.find` is the defect.
2. **A pinned record is never the head** — a record with a `RECONCILIATION_RECORD_DIGESTS` entry is
   invalid as head. Deleting the head must invalidate, never promote.
3. **The head has a required shape** — `superseded-by-amendment` + non-null superseding evidence; ≥1
   `git-commit` evidence whose reference is 40-char lowercase hex; command evidence with this tool's
   name, `actorClass: coordinator`, `exitCode: 0`.
4. **Evidence digests bind their references** — `src/validate.ts:2688-2690` currently compares a
   `git-commit` digest *to itself* (`/^[0-9a-f]{64}$/.test(d) ? d : null`). Reviewer A repointed the
   head's git reference to an arbitrary 40-hex value with zero violations. Digest must be SHA-256 of
   the reference, for every evidence kind.

**Two consequences to handle, not discover:**
- `rechain()` (`tests/semantic-invariants.test.ts:100`) builds a replacement head. Under obligation 3
  it must now also carry `superseded-by-amendment`, non-null superseding evidence and a `git-commit`
  entry. Four tests depend on it.
- The **shipped** head must satisfy the new shape. Check it; if the generator must emit more, the
  generator changes and the registry is regenerated.

**Do not** reintroduce a corpus-dependent constant. None of the four obligations needs one, which is
exactly why they are safe — the shipped-manifest freeze R16 removed must not come back.

**Not in scope, do not "fix":** the accepted residual limit that someone who can already edit the file
can append a genuinely well-formed, correctly chained head. R19 makes "well-formed" checkable. It does
not close that, and it should not.

## BLOCKER 2 — R20 conformance: the suite must be hermetic and must be able to fail

1. **A failing bare `assert.ok` hangs the runner.** 274 of them in `semantic-invariants.test.ts`, plus
   120 in `corpus-sweep.test.ts`, 12 in `schema-validation.test.ts`, 6 in `parity.test.ts`. Node
   re-parses the file with acorn to build the message and never finishes. **Sweep the whole class in
   every test file, not just the file that hung.** Whether you give every call a message or route
   through a helper is yours to choose.
2. **Fixed temp paths.** `tests/schema-validation.test.ts:211`, `tests/semantic-invariants.test.ts:45`,
   `tests/corpus-sweep.test.ts:37` and both progress logs. Per-run unique, `mkdtempSync`-style, as
   `corpus-sweep` already does for fixture roots.
3. **`src/generate.ts:458-479` runs `execFileSync('git', …)` at module scope**, and
   `tests/corpus-sweep.test.ts:18` imports it for one pure helper, so that file cannot load outside a
   Git worktree. Make it lazy. This is why both reviewers could not run the suite.

**R20 requires a positive demonstration**: inject a deliberate failure into **each** test file and show
it reported within seconds. Report the observed output. Fix 20's first implementation typechecked,
read correctly, was approved by me, and emitted nothing — do not let that happen twice in the same fix
class.

## BLOCKER 3 — `validate --repo-root <bad path>` exits 1, not 2

`src/validate.ts:3488-3510` puts the `REPO_ROOT_INVALID` guard only in `sweepRegistrySources`.
`validateRegistry(document, { repoRoot })` accepts any path. Reviewer B: a registry with one retired
rule and `repoRoot: 'C:/definitely/not/a/repo/xyz'` → 4 × `RETIREMENT_EVIDENCE_INCOMPLETE` → exit **1**.
AC12 as amended by R14 says operator misconfiguration is exit **2, never exit 1** — exit 1 asserts canon
is invalid, which is a false accusation from a typo. `sweep` is already correct; fix the `validate` path.

## BLOCKER 4 — ten real test failures

`semantic-invariants.test.ts` is **405 tests, 395 pass, 10 fail**. Line numbers are worktree lines.

**Class A — the ratified amendments moved and the tests did not. I rule these: the code is right.**
Confirm each individually rather than assuming my ruling generalises.

| Test | Line | Asserts | Superseded by |
|---|---|---|---|
| classification counts | `:186` | totals 466 | D21 curation + scenario 14 — the registry has **469**, which I counted independently |
| `R10 coordinator Gate 2 prose…` | `:2495` | ADVISORY rule **absent** from `consideredRuleIds` | **R14** AC5: present "without exception or hand-placed exclusion" |
| `rework migration binds the prior…` | `:709` | commit `7e7dc7d…` | **R16/R17**: `51857a3a…` = `LEGACY_SOURCE_SNAPSHOT_COMMIT` |
| `R4 missing-path evidence…` | `:1397` | same | same |
| `R5 missing provenance evidence…` | `:1526` | same | same |

**Class B — genuinely open. Do not assume the test is the wrong side.**
- `:400` — removing a reconciliation no longer yields `RECONCILIATION_MISSING`.
- `:1328` — a test that calls `rechain()` specifically to stay VALID gets `MIGRATION_EVIDENCE_INVALID`
  + `RULE_ORPHANED`. `rechain()` is **not** broadly broken (4 call sites, 3 pass); this is specific to
  pushing a corroborating `sourceRef`, and the code may be right to refuse.
- `:3311` ×3 — `R10 source-derived registry-rework loop rejects {append,remove,duplicate}`. **The test
  is right and the code is missing the guard**; both reviewers said so unprompted. BLOCKER 1 closes it.
  Do not relax this test.

**How to get a failure list fast:** copy the package to scratch, junction `node_modules`, and shim
`assert.ok` to throw a plain `Error` — that bypasses node's message generator and turns every hang into
a reported failure. The whole file then runs in ~9 minutes. That is a diagnostic harness; it lands
nowhere.

## SHOULD-FIX — fixtures named for axes they do not construct

`tests/schema-validation.test.ts:103-188`: `identity-mutation` (`:108-117`) names the rule-identity axis
but re-derives `bindingDigest` at `:115`, defusing it — it is a second locator fixture. `stale-source`
(`:136-147`) names filesystem drift but never touches the filesystem and hits the same check as
`value-mutation`. Net 7 fixtures over 5 axes; the stale-`bindingDigest` axis and the sweep-level drift
check (`src/validate.ts:3602`) are named but unexercised. Every fixture does assert its specific code, so
this is mislabelling rather than inertness — but in *this* parcel, a fixture claiming to test an axis it
does not test is the exact defect the parcel exists to prevent.

Also dead: `tests/semantic-invariants.test.ts:2581` `assert.notEqual(result.outcome, 'CONFLICT')` is a
tautology — no `CONFLICT` variant survives R14.

---

## Deferred to FK-P1 — do NOT fix these here, and do not report them as open
Each is recorded with a named stop condition. Touching them widens this round past what it can land.

- **Retirement and the resolver are mutually exclusive.** `resolveAuthority` (`src/validate.ts:1173`)
  calls `validateRegistry(document)` with no options, so `repoRoot` is always undefined, so any
  `retired-from-agent-reading` rule yields `RETIREMENT_EVIDENCE_UNVERIFIED` and the resolver returns
  `REGISTRY_INVALID` forever. Both reviewers found it. Latent — **0** rules are currently retired — and
  fail-closed. Fixing it is a contract decision on `resolveAuthority`, with a genuine AC5/AC10 conflict
  underneath, and rushing a resolver-contract change into the last rework round is precisely how R16
  got its hole.
- `historical-only` requires no evidence while `retired-from-agent-reading` requires four. BLOCKER 1
  removes the delivery route; the asymmetry remains.
- `classification`/`enforcementOwner` report from `controlling[0]` while `assurance`/`severity` use
  `weakestBy`, contradicting the comment above them. Reviewer A could not construct a validating
  document that exhibits divergence.
- `inventoryItem.rationale` and `locator.lineHint` are outside every digest.
- Residual path aliases: trailing dot/space, leading space, NUL, NEL, NBSP, BOM, RLO, fullwidth colon,
  Windows device names. Low reachability — sources are pinned to 18 exact paths.
- The `MIGRATION_EVIDENCE_INVALID` message misattributes a *deleted record* as a corpus binding drift.

## Allowed Files
The package `plugins/foreman-line/authority-registry/` — permission ceiling, not a manifest (R18).
**Nothing outside it.** `src/validate.ts`, `src/generate.ts` and the regenerated registry are all
expected to change this round; that is a change from round 1's test-only scope and it is deliberate.

## Verification and the tripwire
`npx tsc --noEmit`, `npx biome check .`, `npm test`, full-registry `validate`, pinned-source `sweep`.

- **`semantic-invariants.test.ts` must COMPLETE.** A hang is a failure, not a timeout.
- **Total test count ≥ 546** (141 + 405 today; baseline was 518). A round landing with fewer tests
  stops the loop.
- **Zero failures**, and say so only from output you have actually seen. The progress log counts
  *completions* and carries no pass/fail signal — I accepted a "169 passed, 0 failures" derived from it
  earlier this round and it was not true; six failures were already behind it.
- Report the per-file counts separately, and the injected-failure demonstration from R20.
- Run nothing concurrently with a suite run in the same worktree. Tell me before killing any process
  that is not yours; I broke that rule myself this round and it cost 23 minutes.
