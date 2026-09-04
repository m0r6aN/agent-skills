# Topology and Authority Inventory — Heterogeneous Agent Worker Fabric

    map_version: 0.1.0
    base_commit: b9f4e1ac7bcd109f64e001695836c02ac2cee5ab
    taken_at:    2026-09-04T00:20:55Z

**Parcel:** WF-P0 — topology and authority inventory
**Contract:** `plugins/foreman-line/docs/specs/active/WF-P0-topology-and-authority-inventory.md`
**Scope:** current-state discovery from Git evidence only. No code, no provider call, no
spend, no credential read.

Every path citation in this map resolves against `base_commit` above and nowhere else. A
citation that does not resolve on that commit is a defect in this map, not a stale reading.
`base_commit` contains `096adfbffebbaf1a783801a2b286f86d10f94a17` ("retarget routing policy
to OpenRouter (v0.3)"), verified by `git merge-base --is-ancestor`, so
`routing-policy.yaml` reads v0.3 throughout.

## Revision log

| map_version | base_commit | taken_at | Author | Change |
|---|---|---|---|---|
| 0.1.0 | `b9f4e1ac7bcd109f64e001695836c02ac2cee5ab` | 2026-09-04T00:20:55Z | WF-P0 builder session | Initial inventory. |

---

## 1. How to read this map — evidence classes

Every entry in every table below carries **exactly one** of these four labels, and no
others. Everything except `asserted` carries a `path:line-range` citation.

| Label | Meaning |
|---|---|
| `enforced-mechanically` | A schema, validator, or test fails closed on this property. Cited to the code that fails **and** the test that proves it. |
| `enforced-conditionally` | Enforcement holds only under a stated precondition. The precondition is named in the entry. |
| `documentation-only` | An artifact declares an intent that nothing enforces at a process boundary. |
| `asserted` | Prose only. No artifact establishes it. |

**Distinguish verified from asserted by reading the label and following the citation, not by
trusting the sentence.** This is the map's whole value. Where this map was unsure, it
labelled rather than smoothed; those labels are listed together in §11.

`enforced-conditionally` is the load-bearing class. Without it, permission envelopes get
filed as enforcement and this map would overstate the system — see §5.

---

## 2. The three-role path, and the vocabulary conflict

### 2.1 The registry's three roles

The current three-role path is **`coordinator`, `verifier`, `builder`**.

| Entry | Evidence | Class |
|---|---|---|
| `roles:` map declares exactly three keys | `plugins/foreman-line/routing-policy/routing-policy.yaml:113-116` | `enforced-mechanically` |
| Schema requires all three and admits no fourth (`additionalProperties: false`, `required: [coordinator, verifier, builder]`) | `plugins/foreman-line/routing-policy/schemas/routing-policy.schema.json:168-190` (`additionalProperties: false` at `:170`; `required` at `:171-175`); standalone twin at `plugins/foreman-line/routing-policy/schemas/role-assignment.schema.json:3-8` | `enforced-mechanically` |
| Test proving the shipped policy's role values | `plugins/foreman-line/routing-policy/tests/schema-validation.test.ts:35-37` | `enforced-mechanically` |

Verbatim, `routing-policy.yaml:113-116`:

```yaml
roles:
  coordinator: frontier # always; D4
  verifier: frontier # always; distinct-instance-from-coordinator is a dispatch-time property (W2-P3/W3), not expressed here
  builder: per-class
```

`routing-policy/` is the sole model-registry and data-classification authority under charter
D4 (`plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/charter.md:49`).
WF-P2 is the only parcel that may extend it. This map reads it and changes nothing.

### 2.2 Two other role vocabularies exist on disk

Neither outranks the registry. `COORDINATOR-PATTERN.md` says so itself at
`plugins/foreman-line/docs/COORDINATOR-PATTERN.md:59`: *"Per-role routing is governed by the
shipped routing policy (`plugins/foreman-line/routing-policy/`); this table is the
operational summary."*

- **The dispatch table** — `plugins/foreman-line/docs/COORDINATOR-PATTERN.md:61-67`: five
  data rows (`:63`–`:67`), four distinct roles, because "builder" appears at two tiers:
  `Coordinator` (`:63`), `Builder (standard risk)` (`:64`), `Builder (architecture/risk)`
  (`:65`), `Adversarial reviewer` (`:66`), `Shaping agent` (`:67`).
- **The six permission profiles** — `plugins/foreman-line/permission-profiles/src/types.ts:83-90`
  (`PROFILE_NAMES`), type union at `:69-75`: `coordinator`, `builder-standard`,
  `builder-architecture`, `reviewer-readonly`, `shaping-agent`, `builder-deps`.

### 2.3 Cross-vocabulary mapping — every equation labelled

**Nothing in code links a registry role to a dispatch-table row or to a profile name.** The
three vocabularies are three separate documents with overlapping words. Each equation below
is an equation *this map found asserted somewhere*, labelled by what actually establishes it.

| Registry role (`routing-policy.yaml:113-116`) | Dispatch table (`COORDINATOR-PATTERN.md:61-67`) | Permission profile (`types.ts:83-90`) | Class | Basis |
|---|---|---|---|---|
| `coordinator` (`:114`, pinned `frontier`) | `Coordinator` (`:63`, "Frontier, always (policy invariant)") | `coordinator` (`types.ts:84`) | `asserted` | Name coincidence plus a matching tier word. No code maps the registry key to the profile name or to the table row. |
| `verifier` (`:115`, pinned `frontier`) | `Adversarial reviewer` (`:66`, "Frontier, always") | `reviewer-readonly` (`types.ts:87`) | `asserted` | **No code links them.** The one place a reviewer profile is chosen hardcodes the profile string and never consults `roles.verifier`: `plugins/foreman-line/verification/src/adversarial/index.ts:254` — `const REVIEWER_PROFILE = 'reviewer-readonly'`. The word "verifier" does not appear in that decision. |
| `builder` (`:116`, `per-class`) | `Builder (standard risk)` (`:64`) + `Builder (architecture/risk)` (`:65`) — two rows, one registry key | `builder-standard` (`types.ts:85`), `builder-architecture` (`types.ts:86`) | `asserted` | The registry expresses "per-class" as an uninterpreted string; the two-tier split lives only in the table and the profile names. See §4.1 — no code reads `roles.builder` at all. |
| — (no registry role) | `Shaping agent` (`:67`) | `shaping-agent` (`types.ts:88`) | `documentation-only` | A role in two vocabularies with **no registry entry**. The schema's `additionalProperties: false` (`routing-policy.schema.json:170`) means it cannot be added to `roles:` without a schema change. |
| — (no registry role) | — (no table row) | `builder-deps` (`types.ts:89`) | `documentation-only` | A profile with neither a registry role nor a dispatch-table row. |

**The `verifier` = "adversarial reviewer" = `reviewer-readonly` equation is `asserted`.** It
is the equation seventeen downstream parcels are most likely to assume is enforced. It is
not. This map records the conflict and does not resolve it; the charter's phrasing is
unamended and no winner is picked.

### 2.4 The contrast this map exists to show

Set side by side:

- The role vocabulary **agents actually read** lives in unenforced prose. Every entry drawn
  from `plugins/foreman-line/skills/` is `documentation-only` or `asserted` (§7.3) — a
  `SKILL.md` enforces nothing at any process boundary.
- The registry's three roles live in a schema with `additionalProperties: false`
  (`routing-policy.schema.json:170`) and a validator that fails the policy load
  (`plugins/foreman-line/routing-policy/src/validator.ts:100-117`).

A reader who takes the dispatch table or a `SKILL.md` as authority is reading the
unenforced half of the system.

---

## 3. Role-authority table

### 3.1 The three registry roles

| Role | Model-tier pin | Validator enforces the pin? | Write scope | Shell | `network.egress` | Tool set | Enforcement condition |
|---|---|---|---|---|---|---|---|
| `coordinator` | `frontier` (`routing-policy.yaml:114`) | **Yes** — `checkRolePinning` rejects any non-`frontier` value: `plugins/foreman-line/routing-policy/src/validator.ts:106-110`; test `plugins/foreman-line/routing-policy/tests/semantic-invariants.test.ts:85-90` (rejects a non-frontier coordinator, asserts the error names `roles.coordinator`). Class: `enforced-mechanically` | Not expressed in the registry | Not expressed in the registry | Not expressed in the registry | Not expressed in the registry | Fails the **policy load** — never consulted at route selection (§4.2) |
| `verifier` | `frontier` (`routing-policy.yaml:115`) | **Yes** — same function, `validator.ts:111-115`. Class: `enforced-mechanically`. Note the pin is on the *tier*; the distinct-instance-from-coordinator property is explicitly **not** expressed here (`routing-policy.yaml:115` inline comment) | Not expressed in the registry | Not expressed in the registry | Not expressed in the registry | Not expressed in the registry | Fails the policy load |
| `builder` | `per-class` (`routing-policy.yaml:116`) | **No.** `checkRolePinning` never dereferences `roles.builder` (`validator.ts:101-117` — only `.coordinator` at `:106` and `.verifier` at `:111`). The schema types `builder` as any non-empty string (`role-assignment.schema.json:18-21`; `routing-policy.schema.json:185-188`). The literal `'per-class'` is held only by the TS type (`plugins/foreman-line/routing-policy/src/types.ts:81`) and one test assertion (`tests/schema-validation.test.ts:37`). Class: `documentation-only` | Not expressed in the registry | Not expressed in the registry | Not expressed in the registry | Not expressed in the registry | Nothing fails on this value |

The frontier tier itself is anchored separately: every id in `model_tiers.frontier` must be
in `KNOWN_FRONTIER_MODELS` (`validator.ts:47`, check at `:154-165`), tested at
`tests/semantic-invariants.test.ts:140-150`. Class: `enforced-mechanically`. This is what
stops "frontier" being redefined by a policy-file edit.

**The registry expresses tier and nothing else.** Write scope, shell access, egress, and
tool set are not registry concepts — they live in `permission-profiles`, which has no role
field. The two vocabularies do not meet in code.

### 3.2 The six permission profiles

All citations into `plugins/foreman-line/permission-profiles/permission-profiles.yaml`
unless noted. **No profile pins a model or a tier:** `PermissionProfile` is
`{ description, envelope }` (`src/types.ts:58-61`) and `PermissionEnvelope`
(`src/types.ts:49-56`) has no model field. Class for every "model-tier pin" cell below:
`documentation-only` — the only model-tier words in the package are prose in a
`description` (`permission-profiles.yaml:72`) and in `README.md:64`.

| Profile | Model-tier pin | Write scope | Shell | `network.egress` | Tool set (`allow`) | Enforcement condition |
|---|---|---|---|---|---|---|
| `coordinator` (`:12-43`) | none | `Edit`/`Write` allowed bare (`:27-28`); denies only `Edit(.claude/**)` `:22`, `Write(.claude/**)` `:23` | `Bash` `:29`, `PowerShell` `:30` allowed bare; deny enumerates 4 force-push forms `:17-21` | **absent** | 18 tools `:25-43` | `enforced-conditionally` — §5 |
| `builder-standard` (`:45-67`) | none | bare `Edit` `:60`, `Write` `:61`; deny `.claude/**` `:55-56` | bare `Bash` `:62`, `PowerShell` `:63`; 4 force-push denies `:51-54` | `denied` (`:66-67`) — `documentation-only` | 7 tools `:58-65` | `enforced-conditionally` |
| `builder-architecture` (`:69-91`) | none | bare `Edit` `:84`, `Write` `:85`; deny `.claude/**` `:79-80` | bare `Bash` `:86`, `PowerShell` `:87`; 4 force-push denies `:74-77` | `denied` (`:90-91`) — `documentation-only` | 7 tools `:82-89` | `enforced-conditionally` |
| `reviewer-readonly` (`:93-121`) | none | `Edit` and `Write` denied **bare** (`:101-102`) plus `.claude/**` forms (`:103-104`) | **Shell retained deliberately:** bare `Bash` `:120`, `PowerShell` `:121` in `allow`. Deny **enumerates 10 specific git commands** (`:105-114`), not a blanket shell deny | **absent** | `Read, Glob, Grep, Bash, PowerShell` `:116-121` | `enforced-conditionally` — and **reduced, not eliminated**; see §5.4 |
| `shaping-agent` (`:123-149`) | none | Denies 8 write-surface prefixes incl. `Edit(plugins/**)` `:135` and `Write(plugins/**)` `:136`; allow-narrows to `Edit(docs/**)` `:148`, `Write(docs/**)` `:149` | **No `Bash`/`PowerShell` in `allow`** (`:145-149`); no shell deny beyond the 4 force-push forms `:129-132` | **absent** | `Read, Glob, Grep, Edit(docs/**), Write(docs/**)` `:145-149` | `enforced-conditionally` — but see the `allow` caveat below and Finding F-7 |
| `builder-deps` (`:151-176`) | none | bare `Edit` `:166`, `Write` `:167`; deny `.claude/**` `:161-162` | bare `Bash` `:168`, `PowerShell` `:169`; 4 force-push denies `:157-160` | `allowlist` (`:172-176`), self-labelled in the YAML `:174-176` as "DOCUMENTATION-ONLY in this goal - not proven to gate at the process boundary" — `documentation-only` | 7 tools `:164-171` | `enforced-conditionally` |

Two caveats that change how the `allow` column reads:

1. **`allow` carries no restrictive meaning.** `src/types.ts:44-48`: *"`deny`/`ask` are the
   restriction mechanism (D9); `allow` is validated for well-formedness only and carries no
   restrictive meaning anywhere in this package."* It is **never projected** into the emitted
   settings file (`src/emitter.ts:36-40`, `:60-79`; test `tests/emitter.test.ts:89-90`
   asserts `allow` and `network` must not be projected). Class: `enforced-mechanically`
   (that the *omission* holds).
   **Consequence:** `shaping-agent` is not restricted *to* `docs/**` by anything that ships.
   Only its eight prefix **denies** reach the emitted artifact.
2. **`network.egress` is documentation-only by declaration**, not by oversight —
   `src/types.ts:29-38`: *"DOCUMENTATION-ONLY (charter D4/F-L). This goal ships no probe that
   a network rule gates at the process boundary."* Modeled as its own field precisely so its
   status is structurally visible. Class: `documentation-only`.

**What the registry does fail closed on** (all `enforced-mechanically`,
`plugins/foreman-line/permission-profiles/src/validator.ts`): profile-set completeness
`:50-73` (test `tests/semantic-invariants.test.ts:30-46`); self-modification guard `:80-101`
(test `:54-59`); no self-nullifying mode `:108-123` (test `:67-72`) — `bypassPermissions` is
refused at the type level, `src/types.ts:22-27`; reviewer restriction completeness `:130-161`
(tests `:80-89`, `:91-141`); reviewer shell-access **preservation** `:169-188` (test
`:149-154`) — a future parcel cannot "harden away" the reviewer's shell. Verdict is
`valid: errors.length === 0` (`:209`); there is no warn-and-pass branch. Resolution is gated
on validation (`src/emitter.ts:115-118`), and `dispatchWorktree` aborts before any git
mutation (`:186-193`).

---

## 4. The four named negative findings

Each was treated as a claim to verify against `base_commit`, not a fact to transcribe. **All
four hold.** One holds more strongly than stated; that is recorded, not smoothed.

### 4.1 (a) `roles.builder: per-class` is read by no code outside the policy validator

**Holds — and is understated.** `roles.builder` is read by **no code at all, including the
validator.** `checkRolePinning` (`plugins/foreman-line/routing-policy/src/validator.ts:101-117`)
dereferences only `roles.coordinator` (`:106`) and `roles.verifier` (`:111`).

Every non-test reference to the value on `base_commit`:

| Site | Nature | Class |
|---|---|---|
| `routing-policy/routing-policy.yaml:116` | The declaration | `documentation-only` |
| `routing-policy/src/types.ts:81` | TS type literal `readonly builder: 'per-class'` — compile-time only | `documentation-only` |
| `routing-policy/schemas/role-assignment.schema.json:18-21`; `schemas/routing-policy.schema.json:185-188` | Typed as any non-empty string — **does not pin the literal** | `enforced-mechanically` (that a string is required; not that it equals `per-class`) |
| `routing-policy/tests/schema-validation.test.ts:37` | The only executable assertion on the value anywhere | `enforced-mechanically` |

Near-miss recorded so a later reader does not mistake it for a consumer:
`plugins/foreman-line/dispatch/src/skill-resolver/index.ts:141` writes `role: 'builder'` into
a receipt as a **hardcoded string literal**, not a read of `policy.roles.builder`. Class:
`enforced-mechanically` (the literal is in the emitter).

### 4.2 (b) The dispatch-time routing evaluator takes no role as input

**Holds.** Input is exactly three fields — `plugins/foreman-line/dispatch/src/routing-eval/index.ts:71-78`:

```ts
export interface RoutingInput {
  /** String from spec frontmatter; validated at runtime against CLASS_NAMES. */
  readonly routing_class: string
  /** String from spec frontmatter; validated at runtime against DATA_CLASSIFICATION_TIERS. */
  readonly data_classification: string
  /** Unique identifier for this workflow; used as the receipt directory name. */
  readonly workflowId: string
}
```

Signature `:114`. Options (`:99-106`) carry only `repoRoot?`. Selection path `:149-211`:
validate class `:150-156`, validate classification `:159-165`, eligible set from
`data_classification[...].eligible_models` `:180-187`, first-match tier walk `:193-196`.
`policy.roles` is never referenced in the file. Class: `enforced-mechanically`.

`roles:` is gated **once, at policy load** — the evaluator calls `validatePolicy` at
`routing-eval/index.ts:140`, which dispatches `checkRolePinning` at
`routing-policy/src/validator.ts:302`. After that it is never consulted in route selection.
Class: `enforced-mechanically`.

The policy file states the same selection rule itself at `routing-policy.yaml:125-129`:
*"ORDER IS THE SELECTION RULE… picks the FIRST model that is eligible under the task's data
classification."*

**Consequence for WF-P5/WF-P6:** role does not reach route selection today. A role-aware
router is new behaviour, not a repair.

### 4.3 (c) No CI workflow runs any `plugins/foreman-line` validator

**Holds.** `.github/` contains exactly one file — `.github/workflows/test-plugin-install.yml`
(57 lines). No composite actions, no `CODEOWNERS`, no `dependabot.yml`, no reusable
workflows.

| Job | Lines | Runs | Validates |
|---|---|---|---|
| `validate-skills` | `:9-21` | `node scripts/validate-skills.js` (`:20-21`) | Root `skills/` only — `scripts/validate-skills.js:27` sets `SKILLS_DIR` to `<repo>/skills` |
| `validate` | `:23-34` | `claude plugin validate .` (`:33-34`) | Plugin packaging |
| `test-install` | `:36-57` | marketplace add/list/install (`:50`, `:53`, `:56`) | Install path |

Class: `enforced-mechanically` (these three jobs do run and do fail); and
`documentation-only` for every `plugins/foreman-line` validator, which **no** job invokes.
Corroborated by the spec-linter's own header —
`plugins/foreman-line/spec-linter/src/cli.ts:4`: *"Exit-code contract (frozen by this
parcel, no CI wiring)"*.

**Consequence:** every Foreman Line invariant in §3.2 and §2.1 is enforced only when a human
or a test run invokes it. Nothing in continuous integration does.

### 4.4 (d) `## Allowed Files` is enforced by no validator

**Holds.** No code in the worktree parses the string. Searched all
`*.{ts,js,mjs,cjs,json,sh,py,yaml,yml}` for `Allowed Files`, `allowed_files`,
`allowedFiles`, `allowed-files`: **zero matches.** No parser, no schema field, no test.

Every reference is prose: `plugins/foreman-line/docs/SPEC-CONVENTION.md:122` (§4.8 heading),
`:124` (the requirement), `:128-133` (distinguishes `surfaces:` routing from `Allowed Files`
mutation authority), `:207` (names the **human dispatch ritual** as the mechanism);
`skills/parcel-compiler/SKILL.md:24`, `:44`.

The spec-linter reads frontmatter only. Its cited range
`plugins/foreman-line/spec-linter/src/validate.ts:142-156` **resolves and is accurate** —
that is `parseFrontmatter`, which slices the block between the leading `---` and the next
`---` and discards the body markdown. Class: `enforced-mechanically` (that the body is
discarded).

**Citation precision recorded (Finding F-6):** `:142-156` proves the body is discarded but is
*not* the validator. Validation lives at `:75-134` (`validateSpecFrontmatter`), which only
ever sees the parsed frontmatter object. A reader wanting "reads frontmatter only" needs both
ranges. The spec's own Constraints bullet cites `:142-156` alone — accurate but incomplete.

**Out of scope, per contract:** making `## Allowed Files` machine-enforced is WF-P4.

---

## 5. Permission-envelope enforcement, at its real strength

**A permission envelope in this repository is `enforced-conditionally`, and the precondition
is narrow.** The four limits below are the package's own documented statements, not this
map's inference. If any sentence in this map left a reader believing a reviewer *cannot*
mutate, §5.4 is the correction.

### 5.1 It constrains only a session that loads the emitted file

`plugins/foreman-line/permission-profiles/README.md:97-101`:

> ## Session-start-load bound — with its failure modes (F-H)
>
> A profile only constrains a session that actually **loads** the emitted
> `.claude/settings.local.json`. Not merely "a self-edit takes effect after relaunch" — the
> real failure modes:

`PROBE.md:28-29`: *"The envelope is only loaded by a **top-level `claude` CLI session started
in the worktree in normal (non-bypass) mode**."* Class: `enforced-conditionally`;
precondition = a top-level CLI session that loads the file.

### 5.2 It is inert for an Agent/Task-tool subagent

`README.md:103-107`:

> - **Not-loaded under a subagent:** an Agent/Task-tool background subagent shares the
>   parent's already-loaded settings and never reloads a worktree-local
>   `settings.local.json` — the envelope is inert for it (why charter D9-amendment(a)
>   forbids that dispatch shape for P3's builder/reviewer specifically).

`PROBE.md:29-31` states the same, and `PROBE.md:46-47` requires *"a **top-level `claude`
CLI process** … **not** an Agent/Task-tool background subagent"*. Class:
`documentation-only` — no code detects or refuses the subagent dispatch shape; the charter
forbids it in prose.

### 5.3 It is void under bypass mode

`README.md:108-109`:

> - **Void under bypass mode:** `--dangerously-skip-permissions` skips deny rules entirely.

`PROBE.md:50-52` requires normal mode. `bypassPermissions` is refused at the type level
(`src/types.ts:22-27`) and must never appear in an emitted artifact (test
`tests/emitter.test.ts:93`) — but that prevents the *profile* declaring bypass, **not** a
session being launched in it. Class: `enforced-mechanically` for the artifact;
`documentation-only` for the launch mode.

One place does check at runtime: `plugins/foreman-line/verification/src/adversarial/index.ts:909-918`
rejects bypass markers in a generated reviewer launch command, error text at `:914`, markers
at `:264`. Class: `enforced-mechanically`, scoped to that one generated command.

### 5.4 For a shell-capable profile, fix/commit capability is reduced, not eliminated

`README.md:90-95`:

> **Honest limitation:** the enumerable git-mutation deny list is not exhaustive against a
> determined shell session — it reduces, not eliminates, `reviewer-readonly`'s ability to
> mutate files or commit via other idioms (`echo > file`, `sed -i`, etc.). This package
> cannot close that gap; the paired mitigation is the standing detection control below, not
> this package's job to enforce.

`PROBE.md:32-39`:

> - The deny list enumerates git-mutation *commands*; it does **not** deny the unbounded set
>   of shell write idioms. A non-enumerated idiom such as `echo x > file`, `sed -i`, `tee`,
>   or `python -c "open(...,'w')"` is **NOT denied**. `reviewer-readonly`'s fix/commit
>   capability is **reduced, not eliminated** — and bare `Bash`/`PowerShell` are deliberately
>   retained for hostile-input probing (lesson #12; P1 invariant 5).

`PROBE.md:41-42`: *"Evidence that reads \"reviewer is fully read-only, full stop\" is a
**defect** against this parcel's deliberately-hedged objective."*

Class: `enforced-conditionally` — the ten enumerated git commands (`permission-profiles.yaml:105-114`)
are denied; the unbounded set of other write idioms is not. The retained shell is deliberate
and validator-protected (`src/validator.ts:169-188`), so no future parcel may remove it.

### 5.5 The paired detection control

`README.md:110-114`:

> - **Bash/PowerShell residual:** reduced, not eliminated, fix/commit capability for
>   shell-capable profiles (see Honest limitation above). Paired mitigation: the coordinator
>   runs `git status` in the reviewer's worktree at triage closure and requires it clean — a
>   standing detection control, not anything this package enforces.

Runbook step: `PROBE.md:124-137`, command at `:128-130`, load-bearing assertion at
`:134-137`. **Class: `documentation-only`.** This map searched for code that runs it and
found none — the control is a human step in a runbook. `PROBE.md` is itself a manual runbook
(`:1-10`, `:164-176`), not an executed test, and it hardcodes absolute paths from a different
machine (`C:\Repos\foreman-line-P3`, `PROBE.md:59`, `:142-144`), so it is not runnable
as written in this worktree (Finding F-8).

---

## 6. Emission sites for `.claude/settings.local.json`

Three code paths construct and write that path on `base_commit`. Projected JSON shape is
identical in all three because all three call `projectEnvelope`.

**Projected shape** — `plugins/foreman-line/permission-profiles/src/emitter.ts:42-51`:
`{ permissions: { deny, ask, defaultMode?, additionalDirectories? } }`. Because no shipped
profile sets `defaultMode` or `additionalDirectories`, the emitted file for every one of the
six profiles is exactly `{"permissions":{"deny":[...],"ask":[]}}`. `allow` and `network` are
deliberately not projected (`:36-40`, `:60-79`; test `tests/emitter.test.ts:89-90`).

| # | Site | Output-path expression (verbatim) | Reachable from a shipped entry point? | Class |
|---|---|---|---|---|
| 1 | `plugins/foreman-line/permission-profiles/src/emitter.ts:231`; write at `:243-244`; no-clobber guard `:230-238` | `const settingsPath = join(path, '.claude', 'settings.local.json')` | **Yes.** `permission-profiles/package.json:13-15` declares `"bin": { "permission-profiles": "./src/cli.ts" }`; `src/cli.ts:24` imports `dispatchWorktree`, calls it `:105-112`, verb routed `:127-129`, exit code `:138` | `enforced-mechanically` |
| 2 | `plugins/foreman-line/dispatch/src/approval-cli/index.ts:410-428` (delegates to site 1; import at `:29`) | Delegated — `dispatchWorktree` seam at `:411`, invoked `:414-419` | **No.** `dispatch/package.json` declares no `bin` (only `exports`). `executeDispatch` is exported (`dispatch/src/index.ts:28`) but every caller in the worktree is a test (`dispatch/tests/approval-cli.test.ts:389, 426, 460, 503, 738, 769`; `dispatch/tests/w4-p0-correlation-lineage.test.ts:323, 364, 409`) | `documentation-only` — library code with no shipped entry point |
| 3 | `plugins/foreman-line/verification/src/adversarial/index.ts:839`; write at `:855-856`; no-clobber guard `:840-845` | `const settingsPath = join(input.worktreePath, '.claude', 'settings.local.json')` | **No.** `verification/package.json` declares no `bin`. `dispatchReview` is exported (`verification/src/index.ts:32`) but every caller in the worktree is a test (`verification/tests/adversarial-dispatch.test.ts:195, 236, 250, 258, 276, 294, 304, 330`; `adversarial-rework.test.ts:104, 129, 136, 149, 273`; `adversarial-collect.test.ts:223, 257`) | `documentation-only` — library code with no shipped entry point |

Profile selection at each site:

- Site 2: `dispatch/src/approval-cli/index.ts:408` — `const profile = pkg.specFrontmatter.permission_profile ?? 'builder-standard'`. The default is `builder-standard`, and the spec-linter treats a **missing** `permission_profile` as an advisory warning only (`spec-linter/src/validate.ts:112-117`). Class: `enforced-mechanically` (the default applies); the *correctness* of that default for any given parcel is `asserted`.
- Site 3: hardcoded `REVIEWER_PROFILE` (`verification/src/adversarial/index.ts:254`), resolved `:846`, recorded into the Stage-D receipt subject `:892`. Class: `enforced-mechanically`.

**Recorded:** the two paths that a coordinator would actually use to dispatch a builder or a
reviewer (sites 2 and 3) have **no shipped entry point** on this commit. Only the
`permission-profiles` CLI (site 1) is invocable. Class: `enforced-mechanically` (verified
from the `bin` fields and a caller search). This is a fact about the current base, not a
defect claim.

Bin inventory backing the reachability verdicts — packages declaring a `bin`: `approval`
(`package.json:13-15`), `permission-profiles` (`:13-15`), `receipts` (`:13-15`),
`routing-policy` (`:13-15`), `skill-injection` (`:13-15`), `spec-linter` (`:13-15`). No
`bin`: `contracts`, `dispatch`, `integration`, `projection`, `registration`,
`schema-scaffold`, `shaping`, `verification`.

---

## 7. Package inventory

### 7.1 The boundary, and its arithmetic

`plugins/foreman-line/` contains **fifteen** directories excluding `docs/`. Of those,
**eight** are inventoried below with role/authority-relevant descriptions and citations, and
**seven** are excluded with one line each.

> **8 inventoried + 7 excluded = 15 directories under `plugins/foreman-line/` excluding
> `docs/`.**

**Repository CI (`.github/workflows/`) is inventoried in addition and counted separately** —
it is not a package under `plugins/foreman-line/`. See §4.3.

A reviewer holding `ls plugins/foreman-line` can reconcile this in one pass. No row in this
map reads "all Foreman Line packages" or equivalent.

### 7.2 The eight inventoried packages

| Package | Role/authority-relevant surface | Class |
|---|---|---|
| `routing-policy` | The sole model-registry and data-classification authority (charter D4, `charter.md:49`). Roles `:113-116`; four `routing_class` values `:17-32`; three classifications `public`/`internal`/`restricted` `:65-111`; tiers `:118-155`; `shadow_routes: {}` `:169`. Validator's enforced invariants: role pinning `src/validator.ts:100-117`, frontier anchoring `:154-165` against `KNOWN_FRONTIER_MODELS` `:47`, security override `:119-152`. Entry: `validatePolicy` `:289-311`. | `enforced-mechanically` |
| `permission-profiles` | The six profiles (`permission-profiles.yaml:12-176`), `PROFILE_NAMES` (`src/types.ts:83-90`) — declared the single authoritative artifact the spec-linter enum binds to by import (`src/types.ts:63-68`), five schemas (`src/index.ts:1-7`), the emitter (`src/emitter.ts`), and the session-start-load bound (`README.md:97-121`). See §3.2, §5, §6. | `enforced-mechanically` for the registry invariants; `enforced-conditionally` for the envelope |
| `dispatch` | Routing-evaluation engine: input `src/routing-eval/index.ts:71-78`, signature `:114`, output `:80-97`, error codes `:53-67`, policy path constant `:110`, selection `:170-211`. Receipt: dir `:215`, object `:221-230`, written `:233` to `routing-decision.json`, ref `:245`. **Recorded:** that receipt is a plain JSON side-file — no `prevHash`, no correlation, no canonicalization — unlike the Stage receipts in §7.2/`receipts`. Approval-CLI dispatch path: `src/approval-cli/index.ts`, `prepareDispatch` `:227-230`, `executeDispatch` `:399-403`, profile default `:408`, Stage-C receipt `:430-483`. | `enforced-mechanically` for the evaluator; `documentation-only` for the approval-CLI's invocability (§6) |
| `verification` | Adversarial-review dispatch path: `dispatchReview` `src/adversarial/index.ts:784-787`; input `ReviewDispatchInput` `:113-126`, whose doc comment `:108-112` states the zero-coordinator-context invariant is enforced at the type level (no field for harness results, coordinator triage, or prior findings). Profile choice: `REVIEWER_PROFILE = 'reviewer-readonly'` `:254`, hardcoded — **not** read from `roles.verifier` (§2.3). Bypass-marker refusal `:909-918`. Sole mutation `git worktree add` `:828`. | `enforced-mechanically` for the type-level invariant and the bypass check; `asserted` for the verifier↔reviewer equation |
| `spec-linter` | Validates frontmatter only. Enforces: `status` enum, `risk` enum, `routing_class` enum, `permission_profile` enum (**optional** — absence is an advisory warning, `src/validate.ts:112-117`), non-empty `surfaces`, and the `status: superseded` ⇒ `superseded_by` invariant (`:66-73`, dispatched `:110`). Schema `schemas/spec-frontmatter.schema.json` (`additionalProperties: false` `:3`; required `:4-14`). Body markdown, including `## Allowed Files`, is discarded (`:142-156`). **Does not** validate `data_classification` membership (schema `:95-98` accepts any non-whitespace string, and the field is not required), surface-path existence, ticket/date formats, or cross-file consistency. No CI caller (§4.3). | `enforced-mechanically` for what it checks; `documentation-only` for what it does not |
| `contracts` | The stage-envelope and correlation surface, named and cited, not described field by field. Envelope: `src/envelope.ts` — `StageId`/`STAGE_IDS` `:5-7`, `StageInput<T>` `:59-65`, `StageOutput<T>` `:71-77`, composers `:98-105`. Correlation: `src/correlation.ts` — branded ids `:21-29`, `CorrelationContext` `:37-43`, schema `:45-56`. Registry of generated schemas: `src/registry.ts:51-62` (10 standalone), `:77-112` (7 composed `stage-envelope.*`). | `enforced-mechanically` |
| `receipts` | Chain path convention: `receiptPath(workflowId, sequence, stage, subjectKind)` `src/paths.ts:28-55`, path expression `:53-54` — `` `docs/receipts/${workflowId}/${paddedSequence}-${stage}-${slug}.json` ``, guards `:34-52` all throwing `RangeError`. Hash domain: **no algorithm prefix or domain-separation string** — `src/schemas.ts:15-16`, `HASH_PATTERN = '^[0-9a-f]{64}$'`; what is hashed, `src/types.ts:45` — `sha256Hex(canonicalize(this document with the 'hash' key excluded))`; frozen prose `README.md:36-48`. Canonicalization is **not shipped here** — cited by reference to `skills/parcel-compiler/tool/src/receipts/canonical.ts`, never imported or vendored (`src/types.ts:7-10`). | `enforced-mechanically` |
| `skills` | Eight files, all accounted for in §7.3. The prose role definitions. | `documentation-only` / `asserted` — see §7.3 |

### 7.3 `skills/` — the prose role definitions

All **eight** files under `plugins/foreman-line/skills/` are accounted for:

1. `ai-council/SKILL.md`
2. `ai-council/references/seats.template.md`
3. `foreman-shaping/SKILL.md`
4. `goal/SKILL.md`
5. `parcel-driven-development/SKILL.md`
6. `parcel-driven-development/templates/CONTRACT_AMENDMENT.md`
7. `parcel-driven-development/templates/PARCEL.md`
8. `parcel-driven-development/templates/PARCEL_INDEX.md`

**Every entry drawn from this directory is `documentation-only` or `asserted`. A `SKILL.md`
enforces nothing at any process boundary.** That labelling is the point — see §2.4.

| File | Role-relevant content | Class |
|---|---|---|
| `goal/SKILL.md` | The `/goal` coordinator entry point. Role definition `:8` — *"You are becoming the Coordinator defined in `${CLAUDE_PLUGIN_ROOT}/docs/COORDINATOR-PATTERN.md`… You consume verification results; you never produce them."* Lifecycle: input parse `:10-14`, Stage Zero `:16-20`, plan-level adversarial review `:22-24`, loop entry `:26-32`. Gates: Gate 1 `:20` (*"never delegable and never inferred from silence"*), Gates 2 and 3 `:19`, `:32`. Human gates are loop **stop conditions**, not agent-completable states, `:36`. Role nouns: Coordinator `:6, :8, :13`; developer `:12, :14, :18, :20, :36, :40`; builder `:32`; adversarial session `:24, :32`; shaping session `:32`; reviewers `:32` (*"reviewers never fix, never commit"*). | `documentation-only` |
| `foreman-shaping/SKILL.md` | The Stage A shaping role. `:8-9` — *"You run the **interactive-shaping role**: turn a raw idea into one or more parcel **spec drafts** and a schema-valid `ShapingResult`, then STOP."* `:9-10` — produces the artifact; does not promote, register, or mint a receipt. Coordinator lint is the sole authority `:52`, `:59-61`. STOP boundary `:50-55`. | `documentation-only` |
| `parcel-driven-development/SKILL.md` | The densest role-vocabulary surface in the package (1072 lines). Distinct role nouns: coordinator `:8, :14, :20`; agents/workers `:14`; parcel agents `:528, :534, :825`; parcel owner / tech lead / feature owner / initiative owner `:20` (explicitly substitutable); product owner `:929`; reviewer `:47, :165, :628`; security review `:27, :524`; external stakeholders `:48`; humans `:185`; agent/session owner `:368`; contract owner `:312`; UAT `:185, :192`. Authority note `:20` — *"This skill uses \"coordinator\" deliberately. The role is operational, not purely architectural… Teams may substitute their own term."* **PDD does not define an "adversarial reviewer" role** — that vocabulary is `COORDINATOR-PATTERN.md`'s. Its three templates are the three files listed above. | `documentation-only` for the role vocabulary; `asserted` for any equation to a registry role |
| `ai-council/SKILL.md` + `references/seats.template.md` | Defines a **multi-model dispatch path over external model CLIs**. `SKILL.md:3` — *"Convene an independent multi-model council (Grok, Codex, Claude, Gemini CLIs)"*; `:8`; seat roster `:55-60`; parallel headless launch `:71-98`; quorum "2 seats + you" `:93-94`. The CLIs invoked, `references/seats.template.md`: `grok` `:14`, `codex` `:21`, `claude` `:27`, `gemini` `:34`. **Recorded observation (not a defect for WF-P0 to fix):** no entry in `routing-policy.yaml` registers, governs, or bounds any of these CLIs. `routing-policy.yaml:113-116` declares three roles; `model_tiers` `:118-155` lists only OpenRouter model **ids**; `shadow_routes: {}` `:169`, and `:157-160` bars shadow routes from filling "coordinator, verifier, approval, gate, tool, or effect roles". The only linkage to shipped machinery is the skill-injection matrix, `plugins/foreman-line/skill-injection/skill-injection.yaml:20` — `'contracts/*': [code-review, ai-council]`. `SKILL.md:79-82` states the live seat file is `references/seats.md`, machine-local and git-ignored; **it does not exist in this worktree** — only the template does. | `documentation-only` for the dispatch path; `enforced-mechanically` for the absence of any routing-policy entry (verified by search) |

**Recorded discrepancy (Finding F-9):** none of PDD's three template filenames is referenced
anywhere in `parcel-driven-development/SKILL.md` (searched for `PARCEL.md`, `PARCEL_INDEX`,
`CONTRACT_AMENDMENT`, `templates/` — zero hits). The sections that would use them
(`:581`, `:823`) point at the `initiative-coordination` skill's templates instead. The three
files exist on disk and are unlinked from the skill body. Class: `enforced-mechanically`
(the absence of any reference is verified). Not resolved here — recording only.

### 7.4 The seven excluded packages

Each is labelled **`not inventoried — out of WF-P0 scope`**. One line each; a later parcel
may extend this map. WF-P0 draws the line here so a reader knows where the map stops.

| Package | One line | Label |
|---|---|---|
| `approval` | W1-P3 interactive human-approval CLI binding approval to an RFC 8785 canonical hash of the approved spec-set and minting the genesis/Stage-A receipt (`approval/package.json:6`; bin `:13-15`). | `not inventoried — out of WF-P0 scope` |
| `integration` | W4-P1 Stage-E capability: PR-automation planning, branch-protection posture verification, and the Stage-E receipt emitter (`integration/package.json:6`; no `bin`). | `not inventoried — out of WF-P0 scope` |
| `projection` | W1-P2 Stage A→B seam projecting a two-level Epic/Story tree into a shipped `ShapingResult` (`projection/package.json:6`; no `bin`). | `not inventoried — out of WF-P0 scope` |
| `registration` | W1-P4 Stage B Jira MCP registration behind a default-deny sandbox gate, with hash refusal and the Stage-B receipt (`registration/package.json:6`; no `bin`). | `not inventoried — out of WF-P0 scope` |
| `schema-scaffold` | SCAF-P1 shared schema-serialization scaffolding (`SchemaFile`, `generate(files, outDir)`) extracted from duplicated copies (`schema-scaffold/package.json:6`; no `bin`). | `not inventoried — out of WF-P0 scope` |
| `shaping` | W1-P1 Stage A emitter/reader for the bare `ShapingResult` plus a two-layer advisory self-check (`shaping/package.json:6`; no `bin`). | `not inventoried — out of WF-P0 scope` |
| `skill-injection` | W0-P5 skill-injection matrix schema, v0 matrix, and validator — which skills are injected at which pipeline role (`skill-injection/package.json:6`; bin `:13-15`). | `not inventoried — out of WF-P0 scope` |

### 7.5 Goals

All goal directories under `plugins/foreman-line/docs/goals/`, with charter-declared status
and owner. `INDEX.md:3-5` is explicit that it is a discovery projection and *"Never infer
authority from an index row."*

| Goal | Charter-declared status | Charter-declared owner | Class |
|---|---|---|---|
| `heterogeneous-agent-worker-fabric` | `charter.md:6` — Gate 1 closed incl. A1; Gate 2 granted for WF-P0 only | `charter.md:5` — Clinton Morgan; coordinator `:7-9` | `documentation-only` |
| `hierarchical-coordination-sidecars` | `charter.md:6` — PROPOSED, not ratified | `charter.md:5` — Clinton Morgan; coordinator `:7` unassigned | `documentation-only` |
| `keon-full-platform-gtm-readiness` | `charter.md:3` — RATIFIED 2026-08-18 | `charter.md:4` — Clint Morgan (decision owner) | `documentation-only` |
| `keon-proof-led-portfolio-priority` | `charter.md:3` — RATIFIED, Gate 1 closed 2026-07-29 | **No `Owner:` line**; coordinator only, `charter.md:4` | `documentation-only` |
| `permission-profile-registry` | `charter.md:3` — Gate 1 ratified 2026-07-16; all four parcels shipped, goal complete | **No `Owner:` line**; `charter.md:4` reads "this session" | `documentation-only` |
| `plugin-packaging-and-scaffolder` | `charter.md:5` — ratified and amended | `charter.md:4` — Clinton Morgan | `documentation-only` |
| `w1-intake-registration` | `charter.md:6` — RATIFIED 2026-07-22 | **No `Owner:` line**; `charter.md:4` | `documentation-only` |
| `w2-dispatch` | `charter.md:6` — RATIFIED 2026-07-23 | **No `Owner:` line**; `charter.md:4` | `documentation-only` |
| `w3-verification` | `charter.md:6` — RATIFIED 2026-07-23 | **No `Owner:` line**; `charter.md:4` | `documentation-only` |
| `w4-ci-integration` | `charter.md:6` — FULLY RATIFIED; W4-P0 shipped. **Contradiction: `charter.md:1` still reads `*(DRAFT — pending Gate 1)*`** | **No `Owner:` line**; `charter.md:4` | `documentation-only`; the contradiction is Finding F-10 |
| `w4-closeout` | `charter.md:3` — FULLY RATIFIED 2026-07-28 | **No `Owner:` line**; `charter.md:4` | `documentation-only` |
| `foreman-kernel` | **No directory on `base_commit`** — see §9 | n/a | `enforced-mechanically` (absence verified by search) |

**Recorded (Finding F-11):** only 4 of 11 existing goal charters carry an `Owner:` /
`Decision owner:` line. Seven declare a `Coordinator:` only, and six of those say "this
session" — a reference that resolves to no identifiable agent from disk. This map does not
infer an owner from ratification prose.

---

## 8. Rollback path, and its unsatisfied test obligation

### 8.1 Charter exit item 1, quoted verbatim

`plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/charter.md:102`:

> the current three-role path is mapped and remains a tested rollback path;

(The leading `1. ` enumerator and the trailing `;` are the charter's list punctuation.)

### 8.2 What WF-P0 discharges, and what it does not

**WF-P0 discharges `mapped` only. WF-P0 does not satisfy charter exit item 1.**

The `tested` half belongs to **WF-P16 — observability and rollout operations**, whose
charter-declared deliverable includes an *"exercised rollback path"* —
`charter.md:80`. It is cross-referenced to exit item 9, `charter.md:118`:

> rollback and model/version upgrade gates are exercised; and

This map does not implement, run, or claim a rollback exercise. **Nowhere in this map does
"documented rollback path" or "mapped rollback path" stand in for "tested rollback path."**
A future reader encountering §8 should read it as a map, not as a claim.

The rule this section was written against, stated inline because its usual ledger
(`docs/transcripts/defects_lessons.md`, cited across this repo's canon as lesson #33) does
not exist in this repository — but the rule itself is on disk twice:
`charter.md:129-131` and `plugins/foreman-line/docs/COORDINATOR-PATTERN.md:81`:

> when a parcel spec restates a goal exit criterion, diff the two texts word by word… A
> criterion naming a *produced artifact* … is satisfied only by that artifact; a fixture
> imitating it is a self-graded claim.

### 8.3 The rollback target — the exact state a rollback must restore

| Element | Exact state to restore | Citation | Class |
|---|---|---|---|
| Registry role set | Exactly three keys: `coordinator`, `verifier`, `builder`; no fourth admitted | `routing-policy.yaml:113-116`; `routing-policy.schema.json:168-190` (`additionalProperties: false` `:170`) | `enforced-mechanically` |
| `coordinator` pin | `frontier` | `routing-policy.yaml:114`; enforced `routing-policy/src/validator.ts:106-110` | `enforced-mechanically` |
| `verifier` pin | `frontier` | `routing-policy.yaml:115`; enforced `validator.ts:111-115` | `enforced-mechanically` |
| `builder` pin | `per-class` — restored as a **string only**; nothing fails if it differs (§4.1) | `routing-policy.yaml:116`; `src/types.ts:81` | `documentation-only` |
| Frontier tier membership | Every `model_tiers.frontier` id in `KNOWN_FRONTIER_MODELS` | `routing-policy.yaml:136-143`; anchor `validator.ts:47`, `:154-165` | `enforced-mechanically` |
| Dispatch behaviour | Route selection from `routing_class` + `data_classification` only, no role input; first-eligible tier walk | `dispatch/src/routing-eval/index.ts:71-78`, `:114`, `:193-196` | `enforced-mechanically` |
| Policy-load gating | `roles:` gated once at load via `validatePolicy` | `routing-eval/index.ts:140`; `routing-policy/src/validator.ts:302` | `enforced-mechanically` |
| Shadow routes | `shadow_routes: {}` — empty | `routing-policy.yaml:169` | `enforced-mechanically` |
| Reviewer profile binding | `reviewer-readonly`, hardcoded | `verification/src/adversarial/index.ts:254` | `enforced-mechanically` |
| Builder profile default | `builder-standard` when frontmatter omits `permission_profile` | `dispatch/src/approval-cli/index.ts:408` | `enforced-mechanically` |

### 8.4 The rollback test obligation — assigned and unsatisfied

**Owner: WF-P16.** **Status on `base_commit`: unsatisfied. WF-P0 does not implement or run
it.**

| Field | Content |
|---|---|
| **What must be exercised** | A reversion from a fabric-enabled state to the §8.3 state, followed by a dispatch that completes end to end through the three-role path. |
| **Falsifiable pass condition** | After reversion: (1) `validatePolicy` returns `valid: true` on the restored `routing-policy.yaml` with `roles.coordinator === 'frontier'` and `roles.verifier === 'frontier'`; (2) `evaluateRouting` on a known `(routing_class, data_classification)` pair returns the same `resolvedModelId` and `resolvedTier` as recorded in §8.3's cited state; (3) no role value is required as input to reach that result; (4) `shadow_routes` is empty. Any of the four failing fails the rollback. |
| **Required evidence** | A recorded run, on a named commit, of the restored policy through `validatePolicy` and `evaluateRouting`, with the emitted `docs/receipts/<workflowId>/routing-decision.json` (`dispatch/src/routing-eval/index.ts:233`, `:245`) attached as the produced artifact. Per the lesson quoted in §8.2, a fixture imitating that receipt does not satisfy this. |
| **Class** | `asserted` — this obligation is specified here and enforced by nothing on `base_commit`. |

A blocking precondition WF-P16 will meet: **no package in this worktree has
`node_modules` installed**, so neither validator nor evaluator can be executed here without
an install step (Finding F-4).

---

## 9. Reconciliation-ledger deltas

Source: `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/reconciliation.md`.
**This map records deltas and does not edit that file.**

The root cause of the delta below is recorded first because it explains it precisely: the
ledger's own recorded base predates the commit that changed the fact.

| Element | Value | Citation |
|---|---|---|
| Ledger's recorded base commit | `24378419243e1098e57f72407fadbeedfdad2e85` | `reconciliation.md:5` |
| Does that base contain `096adfb` (v0.3)? | **No.** `git merge-base --is-ancestor 096adfb 2437841` fails; the reverse succeeds — `2437841` predates `096adfb` | Verified against `base_commit` |
| `shadow_routes` at the ledger's base | Populated: `shadow_routes:` / `cerebras-shadow:` / `adapter_id: cerebras-shadow` at lines 56-58 of the then-current policy | `git show 2437841:plugins/foreman-line/routing-policy/routing-policy.yaml` |

### Delta 1 — the Cerebras shadow boundary

| | |
|---|---|
| **Ledger claim** | `reconciliation.md:20` classifies "Foreman Line stage contracts, receipts, permission profiles, routing policy, dispatch routing evaluation, and **the public-only Cerebras shadow boundary**" as `verified_current`, with evidence *"The Cerebras route is candidate-only, public-only, with host-injected discovery and invocation."* |
| **State on `base_commit`** | `routing-policy.yaml:169` — `shadow_routes: {}`. Empty. `:161-168` states v0.3 ships none and explains the removal: *"The former `cerebras-shadow` entry had no adapter, no credential, and no production caller behind it."* |
| **Delta** | The claim was **true of the ledger's own recorded base (`2437841`) and is false on `base_commit`.** There is no Cerebras shadow boundary to verify; there is no shadow route of any kind. |
| **Class** | `enforced-mechanically` — the empty map is on disk and the ancestry is verifiable by `git merge-base`. |
| **Consequence** | Any downstream parcel treating a public-only shadow boundary as existing canon (WF-P13 is the likely consumer) is building on a removed artifact. The dispatch API `executeShadowRoute` and its invariants are retained (`routing-policy.yaml:166-168`; exported at `dispatch/src/index.ts:61-68`), so the *shape* survives while the *route* does not. |

### Delta 2 — internal inconsistency within the ledger

`reconciliation.md:22` **does** record the v0.3 landing correctly, naming `096adfb`, PR #15,
and *"`routing-policy.yaml` is v0.3 with four `routing_class` values"*. So the ledger
simultaneously knows the policy is v0.3 (row `:22`) and asserts the Cerebras shadow boundary
is `verified_current` (row `:20`). Class: `enforced-mechanically` (both rows are on disk).
Recorded as a delta; not edited.

### Delta 3 — `foreman-kernel` coordinator claim

`reconciliation.md:23` classifies "Foreman Kernel and hierarchical-sidecars goals" as
`verified_current` as separately owned, with evidence *"Foreman Kernel names a live Claude
Code coordinator."* On `base_commit` **no `foreman-kernel` directory exists** (§10), so no
charter on this branch names any coordinator for it. The ledger's underlying point — that the
goals are separately owned and must not be co-owned — is consistent with
`docs/goals/INDEX.md:23-24`. Class: `asserted` (the "names a live coordinator" evidence is
not resolvable on this commit). Recorded, not edited.

---

## 10. Cross-goal interfaces

Charter D7 (`charter.md:52`) binds: this goal *"must consume any ratified
hierarchical-coordination and sidecar contracts that apply, but this goal cannot amend
another live goal's charter or co-own its serialization points."*

**No file belonging to either goal was modified by this parcel, and no serialization point of
theirs is claimed.** See §11's `git diff --name-only` evidence.

### 10.1 `foreman-kernel`

| Element | Finding | Class |
|---|---|---|
| On-disk status on `base_commit` | **Does not exist.** No path matching `*foreman-kernel*` anywhere in the worktree. | `enforced-mechanically` (verified by search) |
| Index acknowledgement | `docs/goals/INDEX.md:23-24` — *"`foreman-kernel` (present in a separate active goal worktree at intake time, not on this branch's base);"* | `documentation-only` |
| Corroborating prose references | `docs/goals/hierarchical-coordination-sidecars/charter.md:29-32` — at intake the live `foreman-kernel` goal was owned by another coordinator and FK-P0 was at human Gate 3 in a separate worktree; `source-proposed-amendment-A3.md:12-13` names the target path in worktree `codex/foreman-kernel-stage0-20260830` | `asserted` — no artifact on this commit establishes current status |
| Interface WF-P1…WF-P18 would consume | **None identifiable on `base_commit`**, because no charter, contract, or schema for it is present. A consumer cannot be specified against an absent artifact. | `asserted` |

### 10.2 `hierarchical-coordination-sidecars`

| Element | Finding | Class |
|---|---|---|
| On-disk status | Directory exists with exactly three files: `charter.md`, `loop-directive.md`, `source-proposed-amendment-A3.md`. No `plan-review-findings.md`. | `enforced-mechanically` |
| Charter-declared status | `charter.md:6` — *"**Status:** PROPOSED — queued for current-instance Stage Zero and Gate 1; not ratified"* | `documentation-only` |
| Owner / coordinator | `charter.md:5` — Clinton Morgan; `charter.md:7` — *"**Coordinator:** unassigned — claim through `loop-directive.md`"* | `documentation-only` |
| Index row | `docs/goals/INDEX.md:11` — `awaiting_coordinator_claim`; *"Gate 1/2 absent; Gate 3 human"* | `documentation-only` |
| Its own D23–D25 authority | `charter.md:26-27` — *"Its D23–D25 text is a proposal, not current authority."* | `documentation-only` |
| Interface WF-P1…WF-P18 would consume | **None ratified.** D7 requires consuming *ratified* contracts; this goal's decisions are explicitly proposals and Gate 1 is absent. There is no ratified hierarchical-coordination contract on `base_commit` for any WF parcel to consume. | `enforced-mechanically` (the "not ratified" status is on disk) |

**Consequence for the graph:** D7's "consume any ratified … contracts that apply" is
currently vacuous — nothing is ratified to consume. Recorded as current state, not as a
defect. `docs/goals/INDEX.md:14-16` additionally binds: *"Shared serialization points are
sequenced, never co-owned."*

---

## 11. Findings register

Every finding this map recorded, including the gaps it found in its own contract's
surroundings. Findings are recorded for the coordinator; WF-P0 fixes none of them.

| ID | Finding | Evidence | Class |
|---|---|---|---|
| F-1 | `roles.builder` is read by **no code at all**, including the validator — stronger than the claim it was checked against. The literal `'per-class'` is pinned by neither schema nor semantic validator. | §4.1 | `documentation-only` |
| F-2 | Role does not reach dispatch-time route selection. A role-aware router is new behaviour, not a repair. | §4.2 | `enforced-mechanically` |
| F-3 | No CI runs any Foreman Line validator. Every invariant in §2.1 and §3.2 is enforced only on manual or test invocation. | §4.3 | `documentation-only` |
| F-4 | **No package in this worktree has `node_modules` installed.** No validator, evaluator, or test suite can execute here without an install step, which would be an external effect this parcel is barred from. Consequence: the Verification Plan's spec-linter step could not be run by the builder; it is a coordinator deterministic-pass step. | Verified across `spec-linter`, `routing-policy`, `permission-profiles`, `dispatch`, `verification`; no `node_modules` anywhere in the worktree. `node -v` = v24.7.0 | `enforced-mechanically` |
| F-5 | `## Allowed Files` is enforced by no validator. Its declared mechanism is a human ritual — `SPEC-CONVENTION.md:207`. | §4.4 | `documentation-only` |
| F-6 | The spec's citation `spec-linter/src/validate.ts:142-156` resolves and is accurate but incomplete: that range is `parseFrontmatter`, not the validator. The claim "reads frontmatter only" needs `:75-134` as well. | §4.4 | `enforced-mechanically` |
| F-7 | `allow` carries no restrictive meaning and is never projected. `shaping-agent` is therefore **not** restricted *to* `docs/**` by anything that ships; only its eight prefix denies reach the emitted file. | §3.2 caveat 1 | `enforced-mechanically` |
| F-8 | The paired detection control (coordinator `git status` in the reviewer worktree) is `documentation-only` — no code runs it. `PROBE.md` is a manual runbook that hardcodes absolute paths from another machine (`PROBE.md:59`, `:142-144`) and is not runnable as written here. | §5.5 | `documentation-only` |
| F-9 | PDD's three templates exist on disk but are referenced nowhere in `parcel-driven-development/SKILL.md`. | §7.3 | `enforced-mechanically` |
| F-10 | `docs/goals/w4-ci-integration/charter.md` contradicts itself: `:1` reads `*(DRAFT — pending Gate 1)*` while `:6` reads FULLY RATIFIED with W4-P0 shipped. | `w4-ci-integration/charter.md:1` vs `:6` | `enforced-mechanically` |
| F-11 | Only 4 of 11 goal charters declare an `Owner:`. Six of the remaining seven name the coordinator as "this session", which resolves to no identifiable agent from disk. | §7.5 | `enforced-mechanically` |
| F-12 | **`plugins/foreman-line/docs/specs/INDEX.md` does not exist**, though `SPEC-CONVENTION.md` §2 mandates it. Creating it is out of scope for WF-P0 by contract; the gap is recorded. (Do not conflate with `docs/goals/INDEX.md`, which does exist.) | Path checked and absent | `enforced-mechanically` |
| F-13 | **`docs/transcripts/defects_lessons.md` does not exist anywhere in this repository**, though it is cited across the canon as the provenance ledger for every numbered lesson (`STANDING-CONSTRAINTS.md:3` links every rule to it; code comments cite lesson numbers at `dispatch/src/approval-cli/index.ts:12`, `:15` and `dispatch/src/routing-eval/index.ts:12`). The lesson-#33 rule itself **is** on disk twice — `charter.md:129-131` and `COORDINATOR-PATTERN.md:81` — so that rule is recoverable; the numbered ledger backing every other citation is not. | Searched for `defects_lessons*`: zero results. `docs/transcripts/` exists with 19 other files | `enforced-mechanically` |
| F-14 | `ai-council` dispatches four external model CLIs (`grok`, `codex`, `claude`, `gemini`) that no entry in `routing-policy.yaml` registers, governs, or bounds. Recorded as current-state fact, not a defect for WF-P0. | §7.3 | `documentation-only` |
| F-15 | The two emission sites a coordinator would use to dispatch a builder or reviewer (`dispatch`, `verification`) have **no shipped entry point** on `base_commit`. Only the `permission-profiles` CLI is invocable. | §6 | `enforced-mechanically` |
| F-16 | `ai-council/references/seats.md` — the live seat file the skill says it reads — does not exist in this worktree; only `seats.template.md` does. It is documented as machine-local and git-ignored, so this is expected, and is recorded so a reader does not treat the template as the live roster. | §7.3 | `documentation-only` |
| F-17 | The registry pins the `verifier` **tier** but explicitly not its distinct-instance-from-coordinator property (`routing-policy.yaml:115` inline comment defers it to dispatch time). Independence of the verifier is therefore not a registry-enforced property today. | §3.1 | `documentation-only` |
| F-18 | The permission-profile registry has **no profile fitting a docs-only builder in this monorepo layout**. `shaping-agent` describes the work but denies `Edit(plugins/**)`/`Write(plugins/**)` (`permission-profiles.yaml:135-136`) while allow-narrowing to `docs/**` (`:148-149`) — and this repository's specs and goal docs live *under* `plugins/foreman-line/docs/`. This parcel was dispatched under `builder-architecture` by coordinator ruling (spec Open Question 7). Fixing the registry belongs to the `permission-profile-registry` goal. | §3.2 | `enforced-mechanically` |
| F-19 | The `dispatch` routing receipt (`routing-decision.json`) is a plain JSON side-file with no `prevHash`, no correlation context, and no canonicalization — unlike the hash-chained Stage receipts in the `receipts` package. Recorded because WF-P17/WF-P18 own digest binding and will need to know which receipts are chained. | §7.2 (`dispatch` row); `dispatch/src/routing-eval/index.ts:221-230` | `enforced-mechanically` |
| F-20 | The spec-linter does not validate `data_classification` membership (schema accepts any non-whitespace string, field not required), while `evaluateRouting` throws `UNKNOWN_DATA_CLASSIFICATION` at dispatch. A spec can pass the linter and fail at dispatch. | `spec-linter/schemas/spec-frontmatter.schema.json:95-98`; `dispatch/src/routing-eval/index.ts:159-165` | `enforced-mechanically` |
| F-21 | **The WF-P0 spec cites a file that does not exist.** Its Open Questions preamble states *"The full lint is at `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/wf-p0-shaping-lint.md`"* — that path is absent on `base_commit`. The goal directory contains only `charter.md`, `historical-charter-source.md`, `loop-directive.md`, `plan-review-findings.md`, `reconciliation.md`, and `wf-p0-shaping-report.md`. The shaping report, cited in the same sentence, does exist. This map does not edit the spec's Open Questions; the coordinator's rulings are recorded there and bind regardless of whether the lint document was committed. | Spec `:362-364`; path checked and absent | `enforced-mechanically` |
| F-22 | **AC12's first clause cannot be satisfied as literally written by any builder on this base.** `git diff --name-only origin/main...HEAD` returns eight paths, of which only two are in `## Allowed Files`; the other six (`docs/goals/INDEX.md`, the goal's `charter.md`, `loop-directive.md`, `plan-review-findings.md`, `reconciliation.md`, and `docs/kickstarters/heterogeneous-agent-worker-fabric-shaping-WF-P0.md`) are the coordinator's and shaping session's own commits, inherited with the base and untouched by this parcel. The base is the shaping-branch tip by coordinator-ratified amendment (spec Constraints, "Base"), so that inheritance is intended — but AC12's diff base was not updated to match. The parcel-scoped check, which the dispatch directive itself specifies, is `git diff --name-only <base_commit>..HEAD`; that one is a strict subset of `## Allowed Files`. Recorded rather than reinterpreted. | See §12 and the parcel's completion claim | `enforced-mechanically` |

### 11.1 Labelled rather than resolved

These are the places this map declined to smooth. Each is labelled in situ above.

1. **Every cross-vocabulary role equation** (§2.3) is `asserted`. The
   `verifier` = adversarial-reviewer = `reviewer-readonly` chain in particular is the one
   downstream parcels are most likely to assume; no code links it.
2. **`builder` = two dispatch-table tiers** (§2.3) — the one-key-to-two-rows split is
   `asserted`.
3. **`foreman-kernel`'s current status and any interface it offers** (§10.1) — `asserted`.
   Not determinable from `base_commit`; the goal is absent from this branch.
4. **The correctness of `builder-standard` as the dispatch default** for any given parcel
   (§6) — `asserted`. The default mechanically applies; whether it is right per parcel is
   not established by anything on disk.
5. **The rollback test obligation** (§8.4) — `asserted`. Specified here, enforced by nothing.
6. **Whether any consumer outside this worktree reads `roles.builder`** — not determined.
   All searches were confined to `base_commit` in this worktree, so F-1 holds for this
   worktree only.
7. **`dispatch/src/routing-eval/shadow.ts`** (877 lines) was not audited field by field. This
   map established only that nothing in `dispatch/src` reads the policy's `roles` block, so
   the shadow path does not consult role fields either. Its input/output shapes and receipt
   behaviour are `not inventoried` beyond that.

---

## 12. Scope and cleanliness

| Check | Result |
|---|---|
| `git merge-base --is-ancestor 096adfbffebbaf1a783801a2b286f86d10f94a17 HEAD` | Passes — `base_commit` contains v0.3 |
| Files created or edited by this parcel | This file only. `git diff --name-only b9f4e1ac7bcd109f64e001695836c02ac2cee5ab..HEAD` is a strict subset of `## Allowed Files` |
| `git diff --name-only origin/main...HEAD` | Eight paths, six of them inherited with the base and untouched here — see Finding F-22. AC12's literal clause is not satisfiable on this base; the parcel-scoped check above is |
| `routing-policy.yaml`, `permission-profiles.yaml`, every contract, schema, validator, and test | Untouched. Read-only throughout. |
| Provider calls, spend, secret access, credential-value reads | None. Credentials referenced by name only, per charter D5 (`charter.md:50`). |
| Merge, PR, push | None. Gate 3 is not delegated (`charter.md:142`). |
| `foreman-kernel` / `hierarchical-coordination-sidecars` files | Untouched (charter D7, `charter.md:52`). |
