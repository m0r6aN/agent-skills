# Foreman Kernel Authority Registry

`@foreman-line/authority-registry` is the source-bound FK-P0 model of which inventoried Foreman
rules are operative, whose authority they express, and what enforcement posture can be claimed.
It is a curated registry, schema, deterministic validator, and read-only source sweep.
It is not a runtime policy engine, hook, admission service, receipt issuer, or authorization API.

## Authority hierarchy

The registry preserves this scope-aware order, highest first: explicit developer ratification;
the Foreman Kernel goal charter; ratified Foreman contracts and `SPEC-CONVENTION.md`;
`COORDINATOR-PATTERN.md` and the `goal` skill; parcel specs; standing constraints and role
kickstarters; generated projections, caches, and advisory documents. A higher active FK-specific
rule controls an in-scope conflict without deleting a lower generic rule outside that scope.
Applicability is compared across goal, role, stage, operation, and host; historical, stale,
superseded, advisory, and retired readings do not become active authority. An unlisted equal-tier
active contradiction fails closed as `RULE_CONFLICT`.

Git remains authoritative for ratified canon, reviews, human gates, merge evidence, and committed
proof. Registry records, checksums, validator output, profiles, admission capabilities, control
state, MCP responses, hooks, and receipt-shaped objects cannot create or replace that authority.

## Contract and source binding

`authority-enforcement-registry.yaml` has a closed draft-07 shape with schema version `0.1.0`.
Every source records its exact repo-relative path, kind, tier, effect, scope, parcel-time snapshot
evidence, and an ordered curated inventory. Every registered inventory item either maps one or
more rule IDs or has one explicit exclusion disposition. The sweep proves that declared locators
remain bound; completeness of the natural-language inventory still requires two independent
reviews and is not proved by a self-authored manifest.

The closed top-level `normativeMarkdownAudit` contains exactly 145 source-authored Markdown
candidate dispositions. Each record binds the exact source/item/value triple and either the
complete published rule set or one item-specific exclusion code and rationale. The validator
rejects additions, omissions, duplicates, substituted values, changed dispositions, changed rule
sets, and changed rationales as `RULE_SEMANTICS_UNCURATED`.

Each rule independently binds:

- stable identity (`sourceId` plus `itemId`);
- typed location (`locatorDigest` over canonical JSON of `{ anchor, kind }`); and
- normalized semantic value (`valueDigest` over `normalizeRuleText` output).

`normalizeRuleText` applies Unicode NFC, normalizes CRLF/CR to LF, trims every line, discards empty
lines, joins remaining lines with one ASCII space, and collapses remaining Unicode whitespace.
`lineHint` is review assistance only and is excluded from identity and digests.

The rule `bindingDigest` covers the complete normative record: subject, claim, statement, the
single source-contained `authorityBasisRef`, source references, applicability, severity,
classification, decision, refusal code, owner, assurance,
paired rules, retirement state, and retirement evidence, as well as the rule ID.
Canonical JSON uses NFC strings, recursively sorted object keys, preserved array order, and no
insignificant whitespace. These digests are integrity checks only—not receipts, signatures,
approval, verification verdicts, merge authorization, or closure evidence.

The complete exact 18-source ID/path set, full-file SHA-256 values, and `sourceSnapshotCommit`
record the FK-P0 dispatch baseline. The sweep resolves every declared snapshot path from that
commit and compares its bytes with the declared hash. It does not require the current worktree's
whole-file hash to remain frozen: unrelated local bytes outside discovered/inventoried constructs
remain valid, while a missing/moved locator or changed normalized operative value fails and
requires a typed migration chain. This is the Standing Constraint 12 boundary.

## Rule classifications

Every rule has exactly one primary classification. The generator assigns it through an explicit
per-item curation entry; source-wide, keyword-derived, default, and terminal fallbacks are not
permitted:

- `pre-action-refusal`: the pre-action policy layer. Ordinary denials use `REFUSE` and a stable
  refusal code. Only `rule.fk-charter.15a44cf50bc6`,
  `rule.fk-loop-directive.47a75730afd6`, and `rule.fk-loop-directive.bfffee6d7c1f` may use
  `ALLOW`, with a null refusal code; no permission-profile allow entry or corroborating
  coordinator-pattern statement becomes authorization.
  `structural` versus `mediated` assurance states what the registered source actually proves.
- `post-action-detection`: evidence that detects a violation after mutation or execution.
- `ci-static-check`: deterministic static or CI evidence; it is not human authority.
- `independent-review-human-judgment`: a fresh mechanically distinct reviewer/verifier decision.
- `narrative-provenance`: mapped context or authority provenance without mechanical enforcement.
- `unsupported`: an honest host, enrollment, bypass, or residual-capability limitation.

Loaded permission-profile denial is host-adapter-owned and `mediated` only when the emitted
worktree-local settings were loaded.
Unenrolled/bypass cases are unsupported, and reviewer residual shell capability is checked by
post-review Git detection. Missing enrollment is never described as a refusal.
All 52 configured deny entries and both restrictive `network.egress: denied` entries have their
own literal classification and five-axis applicability record for the exact profile role on
`claude-windows-docker-loaded`. The 49 allow leaves and the builder-deps egress/notes leaves are
51 nonbinding narrative rules; no permission-YAML item is classified as a CI rule. The structural
inventory contains exactly 34 path-keyed YAML containers, and all six empty `ask` arrays are
excluded as schema containers. The six legacy profile mapping headers remain compatibility-only
structural records with no rules. In particular,
`builder-architecture:` is not the reviewer Git-commit denial; that denial binds only the literal
`yaml-rule:reviewer-readonly:deny:"Bash(git commit*)"` item.

## Protected operation matrix

- Gate 1 ratification/amendment is human-developer only and returns `REQUIRE_HUMAN` without the
  required Git evidence. It is never agent-callable, state-satisfiable, or tool-issued.
- Gate 2 dispatch admits only the coordinator and is agent-callable only after exact
  charter-scoped Git authorization exists.
  State may record consumption but cannot mint the grant.
- FK Gate 3 merge is nondelegated and human-developer owned.
- Verification evidence requires an independent-reviewer principal; builders and coordinators
  cannot verify their own work.
- Closure records admit only the coordinator after a real human merge and its prerequisites;
  they cannot authorize those prerequisites.
- Generic receipt minting is absent/refused in this release and admits zero principals.
- External writes—including Jira, SCM, cloud, signing, deployment, publication, billing,
  credentials, Docker socket, and repository settings—admit zero principals and remain
  unauthorized by this goal.

Principal identity is admission-derived and never caller-self-asserted. The semantic validator
rejects operation-row mutations that promote protected operations into ordinary control state.

## Reconciliation and migration

Six required typed records reconcile without rewriting historical sources:

1. historical two-gate/stage vocabulary versus the FK Gate 1/2/3 namespace;
2. generic contingent Gate 3 delegation versus FK's human-only merge;
3. the live six-profile linter enum versus stale deferred-registry prose;
4. routing-only `surfaces:` metadata versus exact body-level Allowed Files;
5. loaded permission-profile mediation versus unenrolled/bypass and residual shell cases; and
6. the absent `plugins/foreman-line/docs/transcripts/defects_lessons.md` provenance target.

`resolved-for-fk` means downstream FK consumers have one scoped rule; it does not mean older canon
was edited or globally invalidated. The missing provenance record stays `open`, preserves all
the historical thirteen standing rules, and prevents their retirement. R31 current coverage includes fourteen; the historical reconciliation text remains unchanged.

Eleven additional `superseded-by-amendment` records bind the R2 and R4-R13 reworks to their prior
registry commits, the pinned source snapshot, prior binding-manifest digests, superseding
manifests, and complete controlling `SourceRef` values. The R10 migration starts from exact R9
commit `89d7e4853a8fb0af3db68e9262e38833062fba77`; the R11 migration starts from exact R10
commit `f3366be12175acb4fd4aeb32c301c845b906a5da`; the R12 migration starts from exact R11
commit `9059bb249f75805b34a68397d53dfa5608fd6ad4`; and the R13 migration starts from exact rejected
R12 commit `0683bc059ec54a8652624fd2b7be72fe157cac14`. R13 preserves every R1-R12 record unchanged and
adds its own typed prior-to-new evidence. A future coordinated identity/location/value change must
ship another coordinator-ratified typed migration; rewriting internally consistent YAML is not
enough.

A rule can become `retired-from-agent-reading` only when all four correctly typed evidence
references resolve to distinct digest-bound JSON artifacts: predicate contract, negative-refusal
test, corpus sweep, and an independent-reviewer bypass attempt. Rationale and provenance remain
mapped after retirement. Those digests are verified against the filesystem, and a retirement that
cannot be verified makes the registry invalid rather than quietly taking effect.

### The binding-manifest migration chain

Registry-wide identity is bound by a **chain**, not by a frozen copy of one document. A single
genesis digest is pinned in `src/validate.ts`; every migration record declares the manifest it
supersedes from and the manifest it supersedes to; and the chain head — the one record from which
no other record chains — is bound to the manifest recomputed live from the document it sits in.

Binding is therefore established either by a pinned constant or by structural position: every
record except the head is bound to its pinned digest, and the head is bound to the live corpus.
That is a stricter assertion than a constant, not an exemption from one — a constant says only
"these are the bytes I remember", while the live recomputation says "this record accurately
describes the document containing it". A document is invalid if it has zero chain heads, more than
one head (a fork), a cycle, or a migration record that does not lie on the single genesis-to-head
path.

The practical consequence is that a correctly re-digested registry is **admitted** as long as it
appends a properly chained migration record, and refused when it does not. A change to any bound
value therefore requires a typed prior-to-new record — which is the migration discipline the spec
defines, now enforced rather than approximated by a hardcoded whole-corpus constant.

**The head's floor (AC4 obligations 1-7, amendments R19, R21, R22 and R23).** "Well-formed" is a checked
property, not a hopeful adjective. A chain record declares **exactly one** prior and **exactly one**
superseding binding-manifest command, so a second superseding command cannot fork the chain *inside*
a record where across-record fork detection cannot see it. A record whose id appears in the shipped
record-digest table is **never** the head, so head position is not selectable by deletion — keyed on
id presence rather than byte-match, because byte-match would let a tamperer break a pinned record's
own match first and then promote it. The head has a **required shape**: `superseded-by-amendment`
with non-null superseding evidence, at least one forty-character lowercase hex `git-commit`, and
**both** binding-manifest chain commands issued by this tool with `actorClass` `coordinator` and
`exitCode` `0` — checked on the chain commands themselves, never by `.some()` over every command on
the record, because a single decoy entry otherwise excused two gutted chain commands. Evidence
**references are bound by a digest computed over them**, and no digest is ever verified by comparison
with itself. A chain record carries **exactly two** `git-commit` entries, **distinct by reference
alone** — distinctness by kind, reference and digest together was defeated by varying the digest.
And on the head specifically, every `git-commit` reference is either **bound by its prior chain
command's `inputDigest`** or is **exactly `document.sourceSnapshotCommit`**, because two *distinct*
fabricated forty-hex values otherwise satisfy count and distinctness while the attacker recomputes
`inputDigest` to keep obligation 4 self-consistent.

**The shipped chain head is bound through channels that do not depend on its being the head
(obligation 6).** This is the defect R22 exists to close. `RECONCILIATION_RECORD_DIGESTS`,
`RECONCILIATION_CONTRACT`, `RECONCILIATION_PROSE` and `REQUIRED_REWORK_MIGRATIONS` held the same set
and the head was in none of them, while obligation 2 says *pinned ⇒ not head* and the record-manifest
check says *not head ⇒ pinned* — together making `head ⟺ unpinned`, so the unpinned slot was a free
slot for whoever claimed it. Three attacks are now refused independently: **deleting** the head,
**deleting and substituting** a structural copy under any other id, and **rewriting it in place**
under the same id. The third is the one that defeats a presence-only rule, because the head never
departs. The head's id is deliberately *not* added to the record-digest table: obligation 2 keys on
presence there, so adding it would declare the shipped head ineligible to be the head — measured, it
invalidates the shipped registry *and* still admits the substitution, because a pin binds only a
record that is still present.

**A properly chained new head is admitted (obligation 7), and its scope is narrower than it first
read.** The demoted former head stays bound as a historical record, so for **the shipped head** the
residual is **append-only and history-preserving**: erasing its attestation is refused while
extending past it is admitted.

**That guarantee does not extend to successors, and the earlier wording that implied it was false.**
An *appended* head has no presence binding of its own, so it can simply be deleted — which
re-promotes `registry-rework-40394be` and restores a valid document with the appended attestation
gone. Measured: append, then delete the successor and re-anchor, and the result validates with zero
violations at nineteen reconciliations. So for a successor, erasing is file-only while extending
needs a `src/validate.ts` edit — the exact inverse of the property this obligation claims.

**Why that is not fixed here, and is not a scheduling decision.** A stateless validator comparing a
document to itself **cannot detect a deletion at all**. Presence is assertable only against something
outside the document — a constant, Git history, or a signature. A per-head constant is therefore not
a shortcut somebody took; it is the only in-band option, and obligation 6 cannot be made to travel
without an out-of-band anchor. The obvious in-band attempt — keying obligation 2 on the head's own
record-digest lookup rather than the raw pin table — would declare the shipped head ineligible to be
the head and **invalidate the shipped registry**. Generalising presence to successors is an FK-P1
obligation with a stop condition on it, not a cleanup-round change.

The one head obligation that *does* travel is the obligation-5 Git binder, because it is structural
and names no id.

**But "Git history or a signature" is not future infrastructure here — one of those anchors already
ships.** `sweep` already has repository access and already uses it, so successor presence is
assertable **today**, in the sweep rather than in `validate`: *every migration record present at the
previous registry commit is still present in this one*. That is a `git show <prev>:<registry>` away
and needs no signing, no new format and no new constant. Its cost is that it is **non-hermetic** —
it cannot run in `validate`, which is deliberately file-only — so it belongs to the sweep's
out-of-band tier alongside the commit checks above. This makes the FK-P1 stop condition **cheap to
discharge rather than blocked**, and it is the reason the successor gap is a scoping decision rather
than a missing capability.

That extension is **one deep**, and the limit is stated here rather than discovered later. Appending
one properly chained head is admitted with zero violations. A *second* append demotes the first
appended record, which then has no record-digest binding of its own and is refused with a single
`MIGRATION_EVIDENCE_INVALID` until it is pinned in `src/validate.ts`. That is the same discipline
every past rework round followed — it is why the eleven historical records carry pins at all — and it
means a file-only editor can extend the chain once, not indefinitely.

**That limit is not on the regeneration path.** `npm run generate` does not append a migration
record and does not demote the head: it re-emits the *same* head id with its superseding manifest
recomputed live (`src/generate.ts`), so a corpus change produces nineteen reconciliations in and
nineteen out, with `registry-rework-40394be` still the head. Confirmed by construction — amend a
bound value, re-emit the head as the generator does, and the result validates with **zero
violations and no `src/validate.ts` edit**. The append-depth limit therefore constrains the *manual*
path only: a party hand-editing the file who chooses to extend the chain rather than re-anchor the
head. This is the answer to the question left open in round 2 — whether a corpus change can still be
regenerated into a valid artifact — and it is **yes**, so the regeneration problem the migration
chain replaced a frozen whole-corpus constant to solve is solved rather than partly solved.

**Where a binding does not exist, this says so rather than implying one.** `source-ref`,
`command-result` and `missing-path` digests are the SHA-256 of their own reference and are checked
as such. A `git-commit` digest is not: it attests the commit *object body*
(`sha256(git cat-file -p <commit>)`), which no hermetic validator can recompute. What binds a
`git-commit` entry is the record it sits on — the prior-binding-manifest command's `inputDigest` is
the SHA-256 of a `git-commit` reference on that same record, so repointing or deleting that evidence
breaks the binding.

**The residual, stated exactly — and scoped to `validate` run hermetically.** Everything in this
section describes `foreman-authority-registry validate`, which reads only the file it is given. The
`sweep` subcommand is a different matter and is stated at the end, because it changes the answer.

Four head-only `git-commit` edits refuse: deleting the unbound second entry, adding a fabricated
third, repeating the bound reference under a differing digest, and repointing the unbound reference
to an arbitrary commit.

**Fabricating the head's whole Git provenance is *narrowed*, not closed.** Obligation 5 binds the
head's unbound reference to `document.sourceSnapshotCommit` — but that field is itself **in-band and
attacker-controlled**, so the binder rebinds the reference from *nothing* to *another field in the
same file*. An editor who also rewrites the snapshot commit defeats it. Measured, with and without a
payload retiring every rule asserting that Gate 3 merges are human-owned:

```
sourceSnapshotCommit -> 0000…0001, and all 18 sources[].snapshotEvidence.commit
head git references  -> [feedface…, 0000…0001], prior inputDigest recomputed to match
validate (hermetic)  -> valid: true, 0 violations
```

What obligation 5 buys is **cost**, not impossibility: the edit goes from a four-entry evidence swap
to a coherent twenty-field rewrite. That is a real gain and it is not the same thing as a refusal.

**Two entries carry residual, not one.** Neither `git-commit` digest on the head is independently
verifiable — each attests a commit *object body*, `sha256(git cat-file -p <commit>)`, which no
hermetic validator can recompute — and the obligation-4-bound entry's **reference** is additionally
fabricable, because the attacker controls both sides of that binding. So:

| entry | digest | reference |
|---|---|---|
| obligation-4-bound | not verifiable hermetically | fabricable (both sides attacker-controlled) |
| snapshot-anchored | not verifiable hermetically | pinned to `sourceSnapshotCommit`, which is itself editable |

**`sweep` closes all of it, and the tool already ships it.** `sweepRegistrySources` — `validate`'s
sibling, run as `sweep <registry> --repo-root <path>` — performs exactly the out-of-band check this
section says is required: it resolves every declared commit with `git cat-file -t` and recomputes
`sha256(git cat-file -p <ref>)` against the recorded digest. Measured against this registry:

```
CONTROL   shipped registry            -> valid: true,  0 violations, exit 0
TAMPERED  the twenty-field fabrication -> valid: false, exit 1, 20 violations
             18 x declared source snapshot cannot be resolved: git cat-file -t 0000…0001
              2 x Git object evidence cannot be resolved
FACE A    bound entry's digest rewritten, reference intact
             hermetic validate: valid true, 0 -> sweep: exit 1, "Git object evidence digest changed"
FACE B    snapshot entry's digest rewritten, reference intact
             hermetic validate: valid true, 0 -> sweep: exit 1, "Git object evidence digest changed"
```

So the honest statement is not "the head's Git provenance is unverifiable by this tool." It is
**unverifiable by `validate` alone, and verifiable by `sweep`, which is one command away and part of
this package.** An earlier version of this section said the former. That understated the deliverable,
and a limit stated *narrower* than the truth is the same defect as one stated wider — this is simply
the first time in this parcel the error ran in our favour, and it is corrected on the same terms as
the ones that did not.

**A correction, recorded rather than quietly applied.** The unbound second reference was once
documented as an irreducible residual, on the ground that binding it to `sourceSnapshotCommit` was
"not free" — measured at **13 of 24**. That census was taken at **all-records** scope while the defect
is **head-only**. At head scope the binder is free: the head's unbound reference *is*
`document.sourceSnapshotCommit`, while the other eleven records carry a *historical* snapshot, which
is exactly why the wide version failed and the narrow one does not. Neither measurement was wrong —
the scope was.

Unlike every other head obligation, this binder is **structural rather than id-keyed**: it names no
reconciliation id, so it applies to whatever record is the head. It is the first head obligation that
generalises to successors, verified on a record named nowhere in `src/validate.ts`.

On every other record these edits break the record's pin. Every refusal above is pinned by test, and
each new one was verified to **fail when its guard is removed** — passing is not evidence;
failing-when-broken is.

**The honest limit, stated at its true width.** This makes silent substitution *detectable*, not
impossible. A party who can edit the registry file has **two** ways past the chain, not one:

1. **append** a genuinely well-formed, correctly chained new head declaring the manifest of a
   tampered registry; or
2. **re-anchor the existing head in place** — leave its id, topic, contract fields and prose exactly
   as they are, and move only its superseding manifest to match the tampered corpus.

Both validate clean. The second is worth naming precisely because it is **the generator's own
legitimate operation**: `npm run generate` after a corpus change re-emits the same head id with a
recomputed manifest, which is byte-for-byte the same edit. The validator cannot distinguish the
honest regeneration from the dishonest one, and no obligation here claims it can.

**What is refused** is the third move, and it is the one that matters for review: the head's
attestation may not be **hollowed**. Its topic, status, source references, rule ids and prose are
contract-bound, so an editor cannot retire the rules asserting that merges are human-owned *and*
rewrite the record's account of itself to match. Deleting the head is refused; substituting a copy
under another id is refused; rewriting its prose is refused. What survives is exactly the pair above.

This paragraph previously claimed a tamper "must **add** to the record rather than rewrite it." That
was **false** — an in-place re-anchor is a rewrite — and it understated what an editor can do. It is
recorded here rather than quietly corrected, because a limit stated *narrower* than the truth is the
same defect as one stated wider: both are wrong, and both fail in the direction that flatters the
implementation. The registry is a contract, not a trust root. Real anti-tamper is Git history plus
human review — and every one of these edits is visible in a `git diff`, which is the property the
residual actually leans on. The chain's job is to make an undeclared change fail loudly, not to make
a declared-but-illegitimate one impossible.

### Bound sources change, and that is a deliberate act

Every one of the eighteen sources is digest-bound, so changing one requires regenerating the
registry. This is the mechanism working, not a defect in it: a source-bound registry *should*
require that amending canon is a deliberate, reviewed step.

`loop-directive.md` changes most often, because it carries the coordinator ownership block and a
"current state" section that is updated at every stop or parcel closure. A regeneration triggered
only by those blocks is a mechanical re-digest rather than a canon change — but it is still a
deliberate, reviewed act, and the sweep will refuse the registry until it happens. Note also that
adding ordinary narrative prose to a Markdown source is reported as `SOURCE_ITEM_UNCOVERED`: new
prose in a governed document requires disposition rather than silent acceptance.

## Authority resolution

`resolveAuthority(document, query)` is a pure, read-only registry lookup. It first runs complete
schema and semantic validation over the raw document. Any invalid registry fails closed as
`REQUIRE_HUMAN / REGISTRY_INVALID` with empty controlling and considered rule sets; query
resolution never runs against partially trusted registry data. Queries are concrete;
`any` and `all-foreman-goals` are invalid query values. It filters non-controlling source effects
and classifications, applies exact scope matching, selects the highest applicable tier, and
returns an uppercase `RESOLVED` or `REQUIRE_HUMAN` outcome with sorted rule IDs.
`RESOLVED` includes the controlling decision together with the classification, assurance, and
enforcement owner behind it, so a structural refusal from a kernel that does not exist cannot be
read as a mediated one.

**There is no `CONFLICT` outcome, because no input can reach one.** A highest-tier claim or
decision split is exactly the `RULE_CONFLICT` predicate, which is validity-blocking, and resolution
never runs against an invalid registry — so such a contradiction surfaces as
`REQUIRE_HUMAN / REGISTRY_INVALID` with `RULE_CONFLICT` among the violations, not as a per-query
outcome. Historical and generic rules remain visible in `consideredRuleIds` without exception or
hand-placed exclusion; being considered is not being controlling.
It does not authorize actions or replace Git evidence. No applicable candidate returns
`REQUIRE_HUMAN / NO_APPLICABLE_AUTHORITY`.

## CLI

From this package:

```powershell
npx tsx src/cli.ts validate authority-enforcement-registry.yaml
npx tsx src/cli.ts validate authority-enforcement-registry.yaml --repo-root ../../../
npx tsx src/cli.ts sweep authority-enforcement-registry.yaml --repo-root ../../../
```

Both commands emit one deterministic JSON result to stdout and perform no writes. Exit codes are:

- `0`: structurally, semantically, and—when sweeping—source-bound valid;
- `1`: schema, semantic, conflict, or corpus violation — that is, **the registry is invalid**; and
- `2`: usage, I/O, parse failure, or operator misconfiguration.

Exit `1` is reserved for "the registry is invalid" and is never returned for operator error. A
`--repo-root` that does not exist returns `IO_ERROR`, and one that exists but is not the root of a
real Git worktree returns `REPO_ROOT_INVALID`; both are exit `2`, because returning exit `1` for a
mistyped path would be a false accusation against canon.

`--repo-root` is optional on `validate` and required on `sweep`. It is what lets `validate`
digest-verify D11 retirement evidence against the filesystem. Without it, a registry containing a
`retired-from-agent-reading` rule is **invalid** with `RETIREMENT_EVIDENCE_UNVERIFIED` rather than
silently accepted: retirement removes enforcement, so an unverifiable retirement must not take
effect. `resolveAuthority` never performs I/O and therefore never honours an unverified retirement,
because it only ever resolves against a validated registry.

Violations are returned together and ordered by source path, locator, rule ID, then stable code.

## What the sweep does NOT establish

The corpus sweep verifies that the registry's declared bindings still match the eighteen sources
it names. It establishes nothing about any file it does not name.

- **It cannot detect binding canon introduced in an undeclared file.** A new, unregistered
  Markdown document asserting merge authority is invisible to the sweep and the registry alike.
  Completeness of the declared source set is a human and independent-review obligation, not a
  mechanical one. The sweep proves registry-to-source binding; it does not prove that the registry
  author noticed every rule-bearing statement in the repository, nor that the eighteen sources are
  the right eighteen.
- **A passing sweep is not gate evidence.** It is not Gate 1, 2, or 3 evidence, not a receipt, not
  a signature, and not independent verification. A validator result is control state, and control
  state can never substitute for the Git-canon and human authority the registry itself records.
- **A green suite is not proof that a rule is enforced.** 254 of the rules are `pre-action-refusal`
  attributed to `kernel-policy` / `structural` assurance while no kernel exists to perform the
  refusal. That is why a resolved result exposes classification, assurance, and enforcement owner:
  so a consumer can tell a structural claim from a mediated one.

### Limits of specific tests, stated plainly

- Three self-tests in `tests/corpus-sweep.test.ts` (around the `sourceId`-allowlist and
  `additionalAnchors` checks) are `assert.doesNotMatch` over the **source text** of this package.
  They are lint rules, not behavioural tests: they are defeated by trivial rewrites such as
  `source['sourceId']`, and they must **not** be counted as R10 evidence.
- The named negative axes in `tests/schema-validation.test.ts` are now pinned to the violation each
  one is named for, not merely to a violation code. Two fixtures previously claimed axes they did
  not construct: `identity-mutation` re-derived `bindingDigest` on its last line, which defused the
  rule-identity axis and left it a second locator fixture, and `stale-source` named filesystem drift
  while never touching the filesystem. The first is split — `stale-binding-digest` leaves the digest
  stale and is pinned to the `rule bindingDigest is stale` message, recovering a check that was
  named by a fixture and exercised by none — and the second is renamed
  `desynchronised-value-digest`, which is what it actually does.
- **The genuine filesystem-drift axis remains unexercised by fixture.** It is the sweep-level
  comparison in `sweepRegistrySources`, which needs a real corpus on disk; it is deferred rather
  than approximated here. Downstream parcels must not read the fixture set as covering it.
- **Two tests in `tests/corpus-sweep.test.ts` still require Git at run time.** No module performs
  repository I/O at *import* time any more, so every test file loads outside a Git worktree — that
  was what prevented reviewers from running the suite at all. But the two tests calling
  `markdownIdentityProjectionForTesting` consult the frozen-identity map, which is derived from two
  historical registries read out of Git, so they need a worktree when they execute. A reviewer
  working in a scratch copy can load every file and skip those two by name.
The sweep accepts only exact repo-relative source paths below the supplied root and refuses
absolute/traversal paths, containment escape, duplicate normalized paths, symlink/reparse targets,
non-regular files, missing or duplicate locators, and changed normalized values. It does not use
the clock, randomness, network, environment-derived identity, or Git mutation.
Git-backed reconciliation evidence additionally requires the exact root of a real worktree,
commit-typed objects, and commit-bound canonical missing-path evidence. Every Markdown source in
the 18-source corpus uses the same complete paragraph/list/table discovery with structural,
content-independent locators. Paragraphs and list items use
`md-block:<heading-path>:<paragraph|list-item>:<one-based-ordinal>`; table rows use the stable
first-column key instead of mutable row text. Locator anchors contain no content hash, first-line
excerpt, or list-marker value. Changing text or renumbering an ordered marker at the same
structural position therefore retains the locator and fails as `VALUE_DIGEST_MISMATCH`, while
moving the block is a separate location mutation. There is no raw Markdown additional-anchor
escape or source, section, heading, or keyword allowlist.
Duplicate keyed table rows retain the same structural anchor, increment its occurrence count, and
fail as `LOCATOR_DUPLICATE`; duplicate text never creates a secondary ordinal or bypasses coverage.
Properly paired HTML comments and CommonMark-compatible fence boundaries are the only Markdown
spans suppressed by that discovery; visible text around comments, unmatched comments, mixed fence
delimiters, four-space pseudo-fences, and backtick-fence info strings containing a backtick remain
visible. Fence validity is determined from the raw line before HTML-comment masking, and the same
fence map suppresses numbered standing-constraint discovery inside valid fenced blocks. All nine
goal exits, all seventeen charter stop bullets, all fourteen integration scenarios, all five
refusal-class rows, all twenty-two parcel contracts, and the five literal Wave 0–4 exit contracts
are published individually; loop completion and gate bodies are separate operative rules where
the source states them. Goal-skill and coordinator-pattern rules have item-specific, basis-honest
classification, identity, and five-axis applicability; their corroborating basis remains visible
to resolution without being promoted into binding authority. Gate 2 dispatch, Gate 3 merge, and
verification custody use shared cross-source authority subjects with role-, stage-, operation-,
and host-specific applicability. FK Gate 3 agent-side refusals apply only to coordinator merge
repo mutations and state transitions; builder runtime external writes and CI reads remain outside
that rule scope.
The compound coordinator-loop paragraph publishes six independently curated rules—ownership
transfer, frozen-contract, repeated-tripwire, in-parcel security, outward capability, and empty
queue—while retaining one complete source block as their common basis. The complete Allowed Files
and stop/no-self-expansion blocks in `SPEC-CONVENTION.md`, and the approved-contract and mandatory
handoff blocks in the PDD skill, are protected published units rather than first-line substitutes.
Inventoried TypeScript sources use the
TypeScript 7 compiler syntax tree for operative top-level statements, runtime value and side-effect
imports, and nested callable bodies. Compiler-recognized ambient and type-only declarations or
imports are intentionally non-operative, and import order is ignored only when the canonical
runtime module/binding set is unchanged. JSON schema leaves and every permission-profile `allow`,
`ask`, `deny`, and `network` entry have source-aware inventories. These are bounded source-specific
claims, not a general Markdown policy compiler.

Stable codes are closed to those exported by `RESULT_CODES` in `src/types.ts`.

## Generation and verification

`npm run generate` deterministically regenerates the committed schema, curated source-bound
registry, and named mutation fixtures from the pinned local corpus. It is an authoring command,
not part of the read-only validator/CLI surface. Runtime dependencies are exactly `ajv@8.20.0`,
`typescript@7.0.2`, and `yaml@2.9.0`;
the only sibling boundary is the exact relative source-time `schema-scaffold` import.

Run the parcel verification sequentially:

```powershell
node -v
npm ci
npx tsc --noEmit
npm test
npx biome check .
npx tsx src/cli.ts validate authority-enforcement-registry.yaml
npx tsx src/cli.ts sweep authority-enforcement-registry.yaml --repo-root ../../../
```

Green deterministic checks and checksums remain evidence inputs only. Two independent fresh
architecture/risk reviews and the human Gate 3 decision remain outside this package.

## R30 September 7 corpus adoption

The accepted R30 registry binds eighteen source files at `65c471416e4a3916695815e951ffbe389288560e`. Its source-reviewed denominator is 1,583 items, 541 rules and 198 audit entries. R30 adds 72 exact shapes (37 independent-review, 21 pre-action-refusal, five post-action-detection and nine narrative-provenance) and appends one migration after 19 canonically preserved historical reconciliations. The predecessor registry is the last YAML-changing commit `66a514d35a384f901486e7b814580eb6fb7de6ea`; Round 6 verification at `0ee165720f8d1e3a91eb283cb770400b23f61bf5` remains a separate historical baseline.

R30 rules carry `human-ratified` source intent only. A finite trusted-code mapping binds every field and each exact source identity, locator and normalized value. Reserved entries cannot fall through to legacy validation after alteration, removal or assurance reversion. Reviewed paraphrases require an exact trusted correspondence to their designated basis; corroborating references remain pinned, reciprocal references and never substitute for that basis. Neither this mapping nor successful validation proves runtime enforcement, completed review, gate satisfaction or authority to execute an operation.

The nine event/permission records are stored as narrative-provenance / ADVISORY / provenance-only / human-ratified. Existing resolver eligibility excludes them: an isolated query yields NO_APPLICABLE_AUTHORITY with no controlling rules, not an informational ADVISORY resolution. Actual coordinator authorization comes from the recorded developer instruction; the protected-operation matrix remains unchanged.

Current-state and owner-state bodies and the queue State column retain their existing exact volatile extents. New continuation paragraphs and INF carrier duties remain governed. The generator retains prior anchor identities and derives fresh loop identities from the existing masked projection; lineHint is navigation in that projection, not raw-source identity authority. Old R28/R29 count assertions remain tests of committed baseline data; general protection tests exercise the adopted sample.

## R31 finite upstream source adoption

The live registry binds the same eighteen source paths at `8d500704c9e3d6d8b652bbe838aa3623f88203fc`, with 1,585 items, 542 rules, 202 audit entries and 21 reconciliations. Only the standing constraints and historical master plan source blobs change. All twenty prior reconciliation records retain their original canonical bytes; the new record binds prior implementation `446700d47c2e162fcfa575d5a46b9247241a59c1` to this source adoption.

Constraint 14 preserves the complete conditional plugin/marketplace duty: each living install identifier must resolve through the declared marketplace entry to an existing plugin source whose nested manifest name equals the requested plugin. A normalized repository URL is insufficient. Its exact reserved shape uses independent review and `human-ratified` source intent, without granting installation or satisfying a gate. Unknown or changed shapes retain refusal behavior.

The historical repository annotation has a distinct excluded identity. The unchanged historical thesis retains its item, rule and noncontrolling provenance effect at paragraph 2. The historical library-name correction retains its item and exclusion. These finite source-version, locator and value mappings precede privileged and frozen identity lookup; they do not introduce a general historical regeneration mode.

The new migration's supporting decision diagnostic is exact and independently pinned. Repository-aware validation also reads the actual decision Git blob at the adopted source commit. That historical decision ratifies the finite source plan only; mapping approval and implementation dispatch have separate recorded authority. Diagnostic evidence does not itself grant authority.