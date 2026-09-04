# WF-P0 Build Report — Topology and Authority Inventory

**Parcel:** WF-P0 — topology and authority inventory
**Goal:** `heterogeneous-agent-worker-fabric`
**Builder:** Claude Code builder session, 2026-09-04
**Branch:** `claude/hwf-wf-p0-20260904`
**Worktree:** `D:\Repos\agent-skills-worktrees\hwf-wf-p0-20260904`
**Base commit:** `b9f4e1ac7bcd109f64e001695836c02ac2cee5ab`
**Contract:** `plugins/foreman-line/docs/specs/active/WF-P0-topology-and-authority-inventory.md`
**Deliverable:** `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/topology-and-authority-inventory.md`

This file exists because the completion claim exceeded the message transport's
length. The coordinator granted it as a fourth Allowed File for this purpose on
2026-09-04 — a coordinator-ratified widening of this parcel's mutation authority,
recorded here and in the commit that adds it.

---

## 1. Step 0 gate

| Item | Result |
|---|---|
| Base gate | `git merge-base --is-ancestor 096adfbffebbaf1a783801a2b286f86d10f94a17 HEAD` → **exit 0, PASS** |
| Corroboration | `routing-policy.yaml:1` reads v0.3; `:169` reads `shadow_routes: {}` |
| `origin/main` at dispatch | `5ce6ddc7f996d764e506b6b421779fbf3ece689a` |
| Clean tree at Step 0 | `git status --porcelain` empty |
| Allowed Files listed | Three, from the `## Allowed Files` section rather than the then-stale Step 0 sentence |
| Live test count | **Not applicable, and separately not runnable.** Documentation parcel producing no code. No package in this worktree has `node_modules` (checked `spec-linter`, `routing-policy`, `permission-profiles`, `dispatch`, `verification`; none anywhere in the worktree). `node -v` = v24.7.0. Zero-runnable, not zero-existing — see F-4 |

**Deviation recorded at Step 0:** the dispatch directive
(`docs/kickstarters/heterogeneous-agent-worker-fabric-build-WF-P0.md`) is absent from this
parcel's base. It was read read-only from the coordinator worktree. Coordinator has since
confirmed the root cause: it was committed to the coordinator branch while dispatch was
from the shaping branch.

---

## 2. AC-by-AC evidence mapping

| AC | Status | Evidence |
|---|---|---|
| **AC1** — four evidence classes, exactly one per entry | **Discharged** | Map §1 defines exactly the four classes and no others. Every table row across §2.3, §3.1, §3.2, §4, §5, §6, §7.2–§7.5, §8.3, §8.4, §9, §10, §11 carries exactly one. |
| **AC2** — base and version header | **Discharged** | Header carries `map_version: 0.1.0`, `base_commit: b9f4e1ac…`, `taken_at: 2026-09-04T00:20:55Z`, and `## Revision log` with its first row. All 29 fully-qualified `path:line` citations machine-verified to resolve to an existing file and an in-range span. |
| **AC3** — three roles from the registry; vocabulary conflict recorded, not resolved | **Discharged** | §2.1 cites `routing-policy.yaml:113-116` and `routing-policy.schema.json:168-190` (`additionalProperties: false` `:170`, `required` `:171-175`) — range verified directly. §2.2 records the dispatch table (`COORDINATOR-PATTERN.md:61-67`, five rows, four roles) and the six profiles (`permission-profiles/src/types.ts:83-90`). §2.3 is the three-column mapping table; every equation labelled. The `verifier` = adversarial-reviewer = `reviewer-readonly` equation is `asserted`, with the reason: `verification/src/adversarial/index.ts:254` hardcodes the profile and never reads `roles.verifier`. No winner picked; charter phrasing unamended. |
| **AC4** — role-authority table, three roles and six profiles | **Discharged** | §3.1 and §3.2. Frontier pin cited to the rejecting function `routing-policy/src/validator.ts:106-110` and `:111-115`, plus its test `tests/semantic-invariants.test.ts:85-90`. Recorded honestly rather than fabricated: **no profile pins a model or tier** — `PermissionProfile` is `{description, envelope}` (`permission-profiles/src/types.ts:58-61`), so every model-tier cell is `documentation-only`. |
| **AC5** — four named negative findings, each cited | **Discharged; all four hold** | §4.1 (a), §4.2 (b), §4.3 (c), §4.4 (d). No contradiction found, so the spec's stop-and-report branch was not triggered. **(a) holds more strongly than the spec states** — recorded, not smoothed. See §4 below. |
| **AC6** — envelope stated at real strength, not above it | **Discharged** | §5.1–§5.5, each quoted verbatim from `permission-profiles/README.md:97-101`, `:103-107`, `:108-109`, `:90-95`, `:110-114` and `PROBE.md:28-31`, `:32-39`, `:41-42` — every range verified directly. Paired detection control labelled `documentation-only` after searching for code that runs it and finding none. |
| **AC7** — emission sites with invocation reality | **Discharged** | §6: three sites with exact output-path expressions (`permission-profiles/src/emitter.ts:231`, `dispatch/src/approval-cli/index.ts:410-428`, `verification/src/adversarial/index.ts:839`), projected JSON shape (`emitter.ts:42-51`), and reachability. Sites 2 and 3 stated plainly as library code with no shipped entry point, backed by the `bin` inventory and a caller search returning only tests. |
| **AC8** — fifteen directories, 8 + 7, arithmetic stated, CI counted separately | **Discharged** | §7.1 states the sum in a blockquote; §7.2 the eight; §7.4 the seven, each carrying the literal label; CI in §4.3 counted separately. Verified: 16 directories total, minus `docs/` = 15; `skills/` holds exactly 8 files, all listed in §7.3. No row reads "all Foreman Line packages". §6 additionally reconciles 14 `package.json` manifests + `skills/` = 15 so the two counts cannot drift. |
| **AC9** — rollback mapped, test obligation assigned and unsatisfied | **Discharged** | §8.1 quotes charter exit item 1 **byte-identically** (machine-verified against `charter.md:102`, semicolon included). §8.2 states WF-P0 discharges `mapped` only and names WF-P16 (`charter.md:80`, deliverable "exercised rollback path") cross-referenced to exit item 9 (`charter.md:118`). §8.3 gives the rollback target, ten elements cited. §8.4 gives the obligation, a four-part falsifiable pass condition, required evidence, and an `asserted` label. Verified the map nowhere claims exit item 1 is satisfied, and that "documented/mapped rollback path" appears only inside the explicit disclaimer. |
| **AC10** — reconciliation-ledger deltas recorded | **Discharged, with the cause pinned** | §9. The known Cerebras delta is confirmed **and explained**: `reconciliation.md:5` records base `24378419243e1098e57f72407fadbeedfdad2e85`, which `git merge-base` proves predates `096adfb`; at that base `routing-policy.yaml` lines 56-58 carried a populated `cerebras-shadow`. The ledger's claim was true of its own base and is false on this one. Delta 2 records the ledger's internal inconsistency (`:22` knows about v0.3 while `:20` does not). Delta 3 records the `foreman-kernel` coordinator claim as unresolvable. `reconciliation.md` **not edited**. |
| **AC11** — cross-goal interfaces, no co-ownership | **Discharged** | §10.1: `foreman-kernel` **does not exist on this base** (search returned zero paths; `docs/goals/INDEX.md:23-24` says so) — recorded as its on-disk status, with no interface specifiable against an absent artifact. §10.2: sidecars is `PROPOSED — not ratified` (`charter.md:6`), so charter D7's "consume ratified contracts" is currently vacuous. No file of either goal modified. |
| **AC12** — scope and cleanliness | **Discharged** (see note) | Under the amended wording (`ae95a9c`): `git diff --name-only b9f4e1ac..HEAD` is a strict subset of `## Allowed Files`; `git diff --check` clean; no package source, schema, `routing-policy.yaml`, `permission-profiles.yaml`, contract, validator, or test file touched — all eight protected files and all three schema directories verified **byte-identical to `origin/main`**. **Note:** under the *original* wording this AC was unsatisfiable by any builder on this base; that is F-22, ruled and corrected by the coordinator. Its surviving sibling at spec `:304-306` is F-23 and remains open. |
| **AC13** — two independent adversarial reviews return PASS | **NOT DISCHARGED — not the builder's to discharge** | The coordinator dispatches these. Reported as not discharged rather than assumed. |

**Verification Plan step 4 (spec-linter run): NOT PERFORMED by the builder.** Dependencies
are absent (F-4) and installing them is a network fetch barred by the parcel's discovery-only
constraint. This is a coordinator deterministic-pass step on the coordinator's machine; the
coordinator has confirmed they will `npm ci` on their side. Not silently skipped.

---

## 3. Findings register — F-1 through F-23

Full text with citations is in the map's §11. Condensed here to ID, statement, and class.

| ID | Statement | Class |
|---|---|---|
| F-1 | `roles.builder` is read by **no code at all**, including the validator — stronger than the claim it was checked against. The literal `'per-class'` is pinned by neither schema nor semantic validator, only a TS type and one test assertion. | `documentation-only` |
| F-2 | Role does not reach dispatch-time route selection. A role-aware router is new behaviour, not a repair. | `enforced-mechanically` |
| F-3 | No CI workflow runs any Foreman Line validator. Every registry and profile invariant is enforced only on manual or test invocation. | `documentation-only` |
| F-4 | **No package in this worktree has `node_modules`.** No validator, evaluator, or test suite can execute here without an install step, which the discovery-only constraint bars. | `enforced-mechanically` |
| F-5 | `## Allowed Files` is enforced by no validator. Its declared mechanism is a human ritual (`SPEC-CONVENTION.md:207`). | `documentation-only` |
| F-6 | The spec's citation `spec-linter/src/validate.ts:142-156` resolves and is accurate but incomplete — that range is `parseFrontmatter`, not the validator. "Reads frontmatter only" also needs `:75-134`. | `enforced-mechanically` |
| F-7 | `allow` carries no restrictive meaning and is never projected. `shaping-agent` is therefore **not** restricted *to* `docs/**` by anything that ships; only its deny rules reach the emitted file. | `enforced-mechanically` |
| F-8 | The paired detection control (coordinator `git status` in the reviewer worktree) is unenforced — no code runs it. `PROBE.md` is a manual runbook hardcoding absolute paths from another machine, so it is not runnable as written here. | `documentation-only` |
| F-9 | Parcel-driven-development's three templates exist on disk but are referenced nowhere in its `SKILL.md`. | `enforced-mechanically` |
| F-10 | `docs/goals/w4-ci-integration/charter.md` contradicts itself: `:1` reads `*(DRAFT — pending Gate 1)*` while `:6` reads FULLY RATIFIED with W4-P0 shipped. | `enforced-mechanically` |
| F-11 | Only 4 of 11 goal charters declare an `Owner:`. Six of the remaining seven name the coordinator as "this session", which resolves to no identifiable agent from disk. | `enforced-mechanically` |
| F-12 | `plugins/foreman-line/docs/specs/INDEX.md` does not exist though SPEC-CONVENTION §2 mandates it. Out of scope by contract; gap recorded. Not to be confused with `docs/goals/INDEX.md`, which does exist. | `enforced-mechanically` |
| F-13 | `docs/transcripts/defects_lessons.md` does not exist anywhere in this repository, though it is cited across the canon as the provenance ledger for every numbered lesson. The lesson-#33 rule itself **is** on disk twice (`charter.md:129-131`, `COORDINATOR-PATTERN.md:81`); the ledger backing every other citation is not. | `enforced-mechanically` |
| F-14 | `ai-council` dispatches four external model CLIs (`grok`, `codex`, `claude`, `gemini`) that no entry in `routing-policy.yaml` registers, governs, or bounds. Current-state fact, not a WF-P0 defect. | `documentation-only` |
| F-15 | The two emission sites a coordinator would use to dispatch a builder or reviewer (`dispatch`, `verification`) have **no shipped entry point**. Only the `permission-profiles` CLI is invocable. | `enforced-mechanically` |
| F-16 | `ai-council/references/seats.md` — the live seat roster the skill reads — does not exist here; only the template does. Documented as machine-local and git-ignored, so expected; recorded so the template is not mistaken for the roster. | `documentation-only` |
| F-17 | The registry pins `verifier`'s **tier** but explicitly not its distinct-instance-from-coordinator property (`routing-policy.yaml:115` inline comment defers it to dispatch time). Verifier independence is not registry-enforced today. | `documentation-only` |
| F-18 | No registered permission profile fits a docs-only builder in this monorepo layout. `shaping-agent` describes the work but denies `Edit`/`Write` on `plugins/**` while allow-narrowing to `docs/**`, and this repo's specs and goal docs live under `plugins/foreman-line/docs/`. Belongs to the `permission-profile-registry` goal. | `enforced-mechanically` |
| F-19 | The dispatch routing receipt (`routing-decision.json`) is a plain JSON side-file with no `prevHash`, no correlation context, and no canonicalization — unlike the hash-chained Stage receipts. Relevant to WF-P17/WF-P18, which own digest binding. | `enforced-mechanically` |
| F-20 | The spec-linter does not validate `data_classification` membership while `evaluateRouting` throws `UNKNOWN_DATA_CLASSIFICATION` at dispatch. A spec can pass the linter and fail at dispatch. | `enforced-mechanically` |
| F-21 | **The WF-P0 spec cites a file that does not exist** — `wf-p0-shaping-lint.md`, at spec `:368-370`. Absent on this base. Coordinator has confirmed it lives on the coordinator branch. Left standing at the coordinator's instruction; not created, citation not removed. | `enforced-mechanically` |
| F-22 | **AC12's diff base was stale, and the staleness is itself the warned-of failure mode.** Original AC12 named `origin/main`; that diff returns nine paths, six inherited and never authored here, so the criterion read as unsatisfiable while the parcel was clean. Root cause: the ratified base amendment updated the Constraints "Base" bullet and left AC12 unchanged. Ruled and corrected by the coordinator (`ae95a9c`). | `enforced-mechanically` |
| F-23 | **The amended fact had a surviving sibling. RULED AND CLOSED.** Verification Plan step 3 carried the `origin/main...HEAD` diff base that `ae95a9c` had just corrected in AC12. Flagged not fixed by the builder (§11 property 1 reserves replacement text to the coordinator). The coordinator swept all nine `origin/main` occurrences rather than fixing the one reported, and ratified the correction (`03830ed`; step 3 now spec `:304-306`). Two sweep results matter later: step 3 was the only stale instance, and **spec `:340` is correct and deliberately retained** — the reviewer focus question asks for byte-identity to `origin/main`, the right reference for "did the parcel leave the shipped state alone". Not a fourth instance; must not be "fixed". | `enforced-mechanically` |
| F-24 | **A `consistent-but-incomplete` claim — the variant a stated total cannot catch.** (Coordinator's label: F-A.) §3.2's `shaping-agent` write-scope cell read "8 deny rules over 4 distinct prefixes"; on disk the set is **10 rules over 5 prefixes** (`permission-profiles.yaml:133-142`), with `.claude/**` (`:133-134`) missing from both the enumeration and the count. It **understated** enforcement — the opposite direction from AC6's guard and still wrong, since WF-P4 and WF-P5 read this table and would have believed envelope self-edit is permitted when it is not. `Edit`/`Write(.claude/**)` is the self-modification guard, required on every profile by `permission-profiles/src/validator.ts:80-101` and tested at `tests/semantic-invariants.test.ts:54-59`, so the omission hid an `enforced-mechanically` invariant. Corrected, along with two citation ranges and four `allow` ranges the same re-derivation exposed. Mechanism in §3.2 below. | `enforced-mechanically` |
| F-25 | **A line-number citation into a living document is a measurement, not an invariant — a third distinct variant.** Placing the two spec amendments shifted the spec's numbering under this parcel's own citations into it: F-23's `spec :299` (three occurrences), F-21's `Spec :362-364` (which had come to point at **blank lines**), and this report's `Spec :288` all went stale in one cascade, becoming `:304-306`, `:368-370`, and `:293`. None was wrong when written; all were invalidated by an edit to the *cited* file. Sweeping every instance cures the stale-sibling mode and re-deriving from disk cures consistent-but-incomplete, but neither helps when the citation was right and the target moved. It has teeth: Verification Plan step 5 makes an unresolvable citation a Blocker, so a citation on a blank line would have failed the deterministic pass. **Countermeasure, generalizing invariant-over-measurement:** cite a still-being-amended document by stable anchor (section, criterion ID, quoted phrase) and reserve `path:line` for frozen files — every code, schema, and test citation in the map points at files this parcel never touches and was never at risk. | `enforced-mechanically` |

### 3.1 On F-22's framing

Recorded at the coordinator's explicit direction and not softened on their behalf: AC12's
diff base was stale because the base amendment corrected the fact in one place and left it
standing at its other instance. The coordinator committed that defect, in this goal's own
canon, one turn after writing the warning against exactly that failure mode into the same
document. It belongs in the record as evidence that **the countermeasure has to be structural
rather than a reminder to be careful.** F-23 is the same mode recurring inside the correction
itself.

The builder is not exempt from this. Three claims in the map went stale because of commits
the builder made *after* writing it — the `origin/main` path count (eight → nine), the scope
row's "This file only", and the register intro's "WF-P0 fixes none of them". All three were
caught by a mechanical re-audit rather than by care, which is the same conclusion from the
other direction. Fixed in `eed922d`; the scope row is now phrased as an invariant rather than
a count so it cannot go stale again.

### 3.2 On F-24 — the variant the loud-failing form does not catch

The three drifted counts above were **stale siblings**: one instance updated, its twin left
behind. F-24 is a different and harder variant, and the distinction is worth carrying forward.

The `shaping-agent` cell was *examined* by the count audit. It is one of the three the audit
reconciled, where the conflation of rules with prefixes was correctly caught and both numbers
restated. **But the audit checked the cell's internal consistency — do the rule count and the
prefix count agree with each other? — and never its completeness against disk.** Both numbers
were derived from a set the verification grep had already truncated: the pattern hardcoded the
four prefixes already believed in (`plugins|skills|apps|config`), so it was structurally
incapable of returning `.claude`. 8 and 4 agreed perfectly with one another, and both were
wrong.

**A stated total only fails loudly when one side drifts. It says nothing when both sides
derive from the same incomplete set.** So the loud-failing arithmetic form — the right
countermeasure for the stale-sibling variant — is blind to this one.

**The countermeasure for `consistent-but-incomplete` is re-deriving the set from disk, not
re-checking the sum**, and in particular not re-checking it with a filter built from the
belief under test. The corrected pass enumerated every `deny` and `allow` rule for all six
profiles with no prefix filter, which is how the omission, two off-by-one citation ranges
(`coordinator` `:17-21`→`:18-21`, `builder-architecture` `:74-77`→`:75-78`), and four
inconsistent `allow` ranges all surfaced together.

A related trap this pass also hit and had to undo: correcting one `allow` range to point at
rule lines while leaving five others pointing at the block created a *fresh* inconsistency —
the stale-sibling mode, generated by the act of fixing the completeness mode. All six were
then made uniform.

---

## 4. Contradictions encountered

**One**, and it favours the spec rather than contradicting it.

AC5(a) asserts that `roles.builder: per-class` is read by no code *outside the policy
validator*. On this base it is read by **no code at all — including the validator**:
`checkRolePinning` (`routing-policy/src/validator.ts:101-117`) dereferences only
`roles.coordinator` (`:106`) and `roles.verifier` (`:111`). Further, `role-assignment.schema.json:18-21`
and `routing-policy.schema.json:185-188` type `builder` as any non-empty string, so the
literal `'per-class'` is pinned by neither schema nor semantic validator — only by
`routing-policy/src/types.ts:81` (compile-time) and `tests/schema-validation.test.ts:37`.

The claim therefore **holds and is understated**. Because it is not false, the spec's
stop-and-report branch for a falsified AC5 row did not trigger. The precision is recorded as
F-1 rather than transcribed as written or quietly softened.

No other AC5 row was contradicted. No ruled Open Question was found to be wrong.

---

## 5. Labelled rather than resolved

Reported explicitly as a positive signal. In the map at §11.1.

1. **Every cross-vocabulary role equation** (§2.3) — `asserted`. The `verifier` =
   adversarial-reviewer = `reviewer-readonly` chain in particular, since it is the equation
   downstream parcels are most likely to assume is enforced.
2. **`builder` = two dispatch-table tiers** — `asserted`. One registry key, two table rows,
   nothing linking them.
3. **`foreman-kernel`'s current status and any interface it offers** — `asserted`. Not
   determinable from an absent goal; status was not imported from the sidecars charter's
   intake-time prose.
4. **Whether `builder-standard` is the right dispatch default for any given parcel** —
   `asserted`. The default mechanically applies (`dispatch/src/approval-cli/index.ts:408`);
   its per-parcel correctness is established by nothing on disk.
5. **The rollback test obligation** (§8.4) — `asserted`. Specified here, enforced by nothing.
6. **Whether any consumer outside this worktree reads `roles.builder`** — **not determined.**
   All searches were confined to this worktree, so F-1 holds for this worktree only. Not
   generalized.
7. **`dispatch/src/routing-eval/shadow.ts`** (877 lines) — **not audited field by field.**
   Established only that nothing in `dispatch/src` reads the policy's `roles` block. Its
   input/output shapes and receipt behaviour are marked `not inventoried`.

Two further items of builder uncertainty, recorded here rather than in the map because they
concern process rather than the inventory:

8. **Two `Edit` calls failed with "File has not been read yet"** — a harness read-state
   artifact after a context boundary, **not** the coordinator's "modified since read" stop
   condition. Each was handled by re-reading the target region and confirming the content
   unchanged before writing, rather than retrying blindly. Reported because the two failure
   messages look adjacent and only one is a stop.
9. **Twice during the count audit the builder's own grep expectation was wrong rather than the
   map** (§7.4's label count included the prose definition; a `**`-anchored pattern missed
   §7.1's total). Each mismatch was checked against disk instead of assumed to be a map
   defect. "My check was wrong" is a different outcome from "the document was right", and
   only one of them is evidence.

---

## 6. Evidence bearing on the open Gate 1 matters

Consolidated at the coordinator's direction, because it is going to the developer.

### 6.1 What "the current three-role path" denotes operationally

**It is close to nominal.** Five findings converge, all from §2, §4, and §6 of the map:

- **Nothing resolves `verifier`.** `verification/src/adversarial/index.ts:254` hardcodes
  `const REVIEWER_PROFILE = 'reviewer-readonly'` and never reads `roles.verifier`. The word
  "verifier" does not appear in that decision.
- **The registry pins `verifier`'s tier and explicitly disclaims its independence** —
  `routing-policy.yaml:115`'s own inline comment defers distinct-instance-from-coordinator to
  dispatch time. The property that makes a verifier a verifier is registry-unenforced (F-17).
- **Role never reaches route selection.** `roles:` is gated once at policy load
  (`dispatch/src/routing-eval/index.ts:140` → `routing-policy/src/validator.ts:302`) and never
  consulted again. `RoutingInput` (`:71-78`) has no role field (F-2).
- **`roles.builder` is read by no code whatsoever** (F-1).
- **Both dispatch paths that would bind a builder or reviewer have no shipped entry point**
  (F-15).

So what exists today is a tier pin checked once at policy load, plus one hardcoded profile
string in library code for which nothing ships a CLI. If the developer is deciding what "the
current three-role path" means for rollback purposes, that is the concrete answer, and it
materially affects what WF-P16 would have to exercise.

### 6.2 Ownership of exit item 1's "tested" clause

The evidence **supports** the coordinator's ruling rather than challenging it.
`charter.md:80` gives WF-P16 the deliverable "exercised rollback path", and the obligation is
not merely unexercised but currently **unexecutable in this worktree** — no `node_modules`,
so neither validator nor evaluator can run (F-4, map §8.4).

---

## 7. Commits

| SHA | Message | Scope |
|---|---|---|
| `ebaeab3` | `docs(wf-p0): topology and authority inventory map v0.1.0` | The map (Allowed File #1) |
| `4cd50ce` | `docs(specs): WF-P0 Allowed Files count amendment (coordinator-ratified)` | Spec `:293`, one word. Standalone |
| `4f8fcf7` | `docs(wf-p0): reconcile three drifted count claims in the inventory map` | The map |
| `ae95a9c` | `docs(specs): WF-P0 AC12 diff-base amendment (coordinator-ratified)` | Spec AC12 only. Standalone |
| `eed922d` | `docs(wf-p0): refresh map claims invalidated by this parcel's own commits` | The map |

**A sixth commit exists and is necessarily absent from the table above: the one that adds
this report.** A file cannot cite the SHA of the commit that creates it. Stated explicitly
rather than left as a table that undercounts by one — a reviewer running `git log` will find
six commits against five rows, and this is why. Its message identifies it as the build report
and records the coordinator's Allowed-Files widening. `git log --oneline -6` on
`claude/hwf-wf-p0-20260904` is the authoritative list.

Every commit message ends with the required `Co-Authored-By` trailer. No merge, no PR, no
push — Gate 3 is not delegated (`charter.md:142`).

**§11 ordering deviation, recorded rather than concealed.** SPEC-CONVENTION §11 property 2
requires an amendment commit to land *before* the implementing work. `4cd50ce` did not: the
map commit `ebaeab3` had already landed when that ruling arrived. The commit is standalone as
§11 also requires, and §11's stated rationale for the ordering — that the amendment must not
depend on the implementation landing successfully — is not defeated, since the implementation
had already landed green. `ae95a9c` has the same ordering property for the same reason.

---

## 8. Scope and cleanliness

```
$ git diff --name-only b9f4e1ac7bcd109f64e001695836c02ac2cee5ab..HEAD
plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/topology-and-authority-inventory.md
plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/wf-p0-build-report.md
plugins/foreman-line/docs/specs/active/WF-P0-topology-and-authority-inventory.md
```

Three paths, all in `## Allowed Files` as widened by the coordinator's grant of this file — a
**strict subset**, since the parcel never wrote `wf-p0-shaping-report.md`.

```
$ git status --short
(empty)

$ git diff --check
(no output, exit 0)
```

| Protected surface | Result |
|---|---|
| `routing-policy.yaml`, `permission-profiles.yaml` | Byte-identical to `origin/main` |
| `routing-policy/src/validator.ts`, `permission-profiles/src/validator.ts`, `permission-profiles/src/emitter.ts` | Byte-identical |
| `dispatch/src/routing-eval/index.ts`, `verification/src/adversarial/index.ts`, `spec-linter/src/validate.ts` | Byte-identical |
| `routing-policy/schemas/`, `permission-profiles/schemas/`, `contracts/schemas/` | Byte-identical |
| Every test file | Unchanged |
| `wf-p0-shaping-report.md` | Byte-identical to base; never opened for writing |
| `foreman-kernel`, `hierarchical-coordination-sidecars` | Untouched (charter D7) |
| Provider calls, spend, secret access, credential-value reads | None. Credentials referenced by name only (charter D5) |

---

## 9. Open items for the coordinator

1. **AC13** — two independent adversarial reviews. Not dispatched by the builder.
2. **Verification Plan step 4** — spec-linter run, pending `npm ci` on the coordinator's machine (F-4).
3. **F-23** — Verification Plan step 3's stale `origin/main` diff base needs a ruling and replacement text.
4. **F-21** — the absent `wf-p0-shaping-lint.md`; resolves when the coordinator consolidates branch lineages.
5. **F-12** — `docs/specs/INDEX.md` mandated by SPEC-CONVENTION §2 and absent; a separate chartered change.
6. **§6.1 above** — evidence bearing on the open Gate 1 question of what "the current three-role path" denotes.
