---
ticket: QF-P3
title: Quick-flags structural conformance check
status: active
owner: clinton.morgan
created: 2026-10-14
updated: 2026-10-14
supersedes: null
superseded_by: null
risk: standard
surfaces:
  - plugins/foreman-line/spec-linter/tests/quick-flags-conformance.ts
  - plugins/foreman-line/spec-linter/tests/quick-flags-conformance.test.ts
routing_class: implementation/standard
verification_class: judgment-required
permission_profile: builder-standard
data_classification: internal
---

# QF-P3 — Quick-flags structural conformance check

## Intent

Add a read-only, structural conformance check to the existing `spec-linter` test suite so drift in the quick-flag registry, its integration pointers and the loop-directive structure fails mechanically. Cover the structural gaps forwarded from QF-P1 and QF-P2 with independently failing mutations, without interpreting natural-language authority or executing quick flags. QF-P3 depends on QF-P1 and QF-P2; its Standard routing calls for a mid-tier builder and one fresh independent adversarial review, subject to the goal's recorded route substitution. This parcel supplies the structural-check component of the charter's exit criterion, not the exit dry-read walkthrough or the whole goal exit.

## Constraints

- **Host: `plugins/foreman-line/spec-linter/`.** It already validates document structure; `verification/package.json` instead describes the Stage-D execution/evidence harness. Keep the checker test-private: the helper may export to its test, but neither file joins the package's public surface. Do not change the frozen frontmatter schema, validator, CLI, exports, manifests or dependencies.
- **CI reachability (QF-R10).** `scripts/foreman-line-ci.mjs` discovers direct-child directories with parseable `package.json` files (`discoverPackages`) and runs `test`, `typecheck`, `lint` (`CHECKS`, `runShard`). `spec-linter/package.json` runs `tsx --test tests/*.test.ts`; `tsconfig.json` and `biome.json` include `tests/**/*.ts`. The host already appears in the runner's frozen legacy list and `COST_TABLE`, and not in `WAIVED_EXCLUSIONS`. `.github/workflows/foreman-line-ci.yml` invokes the shard runner on fallback/full sweep; evidence reuse is unchanged. A new test therefore joins that existing path, not a new package or cost-table amendment. These are inspection facts, not execution evidence.
- **Structure, not meaning (D1, QF-R11).** Pin field names, identifier sets, enumerated assignments, paths, headings, delimiters and lexical forms. Do not pin expansion sentences, explanatory table prose, gate/stop wording, or prose bytes to infer meaning. Mirror equality is a relation to the current source, not a historical snapshot. A version bump alone does not relax any structural pin.
- **Read-only inputs.** Read the registry, skill, mirror, template, COORDINATOR-PATTERN and selected live directives; never repair them. Mutations and fixtures are in memory in the two Allowed Files. No generated files or scratch fixtures.
- **Standing constraints apply:** `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`, especially #3/#11 independent mutations, #5 linear parsing, #12 no moving-base byte pins, and #13 exception identity/location/value. Fail on missing/unreadable required inputs or discovery errors, never skip or substitute empty text. Diagnostics identify repo-relative file, line and invariant; sanitize external text before line-protocol emission (#4). External I/O reachable through the test helper's exported surface follows #1 with a checker-owned typed error; pure validation remains usable on in-memory text.
- **Builder Step 0:** restate this spec, both Allowed Files, branch `qf-p3`, worktree `/home/cmorgan76/Repos/agent-skills-qf-p3`, build base supplied by dispatch, and the read-only corpus; then STOP for rulings before implementation. No checkout of another branch, main-tree edits, git add/commit, push or remote operations. No route receipt; direct invocation per loop-directive ruling 2026-10-13, with the 2026-10-14 route deviation where applicable. No model identity in frontmatter.

## Acceptance Criteria

### AC-1 — Existing-suite execution and input loading

- [ ] The unchanged `npm test` command loads `quick-flags-conformance.test.ts` and checks the actual on-disk corpus below; package `test`, `typecheck` and `lint` pass. Required checks have no skips, todos or unconditional success paths.
- [ ] Resolve repository inputs from the module location using Node path/URL APIs, not `process.cwd()`, git, shell commands or remote state. Invocation from the repository root and the package directory produces the same corpus and verdict. Discovery and reading are deterministically ordered and read-only; missing/unreadable required files and directory-enumeration failures produce a failing diagnostic.

Sources: QF-R10; host scripts/configuration and CI discovery cited in Constraints.

### AC-2 — Registry identity and exactly fourteen entries

- [ ] The numbered registry sections used here (§§1/5/7/8/9/10) are present exactly once with their shipped headings; absent, duplicate or fence-hidden sections fail rather than producing empty successful checks. Exactly one column-zero `Registry version: <positive integer>` line; the version-history table has header `Version | Date | Change`, unique positive version IDs and nonempty cells, with the current version equal to its highest version. Do not require version 1 forever or infer whether a prose change deserved a bump.
- [ ] In registry §8, exactly fourteen unique canonical entry headings, one per charter D8 name: `--blanket`, `--asrec`, `--ratify`, `--merge-ok`, `--dispatch-ok`, `--dry`, `--status`, `--halt`, `--resume`, `--strict`, `--review2`, `--explain`, `--brief`, `--nopush`. Deferred, alias, duplicate and unknown entry headings fail. The heading form is a column-zero level-three heading containing only the backticked canonical token.
- [ ] Directly after each heading, exactly seven nonempty column-zero `Label: value` lines, consecutive and ordered: `Canonical:`, `Aliases:`, `Persistence:`, `Arguments:`, `Expansion:`, `Gate interplay:`, `Conflicts and lifting:`. `Canonical:` equals its heading token. From the seventh line to the next entry/section heading only blank lines are permitted: reject an eighth label, duplicate/unknown label, non-label continuation or displaced field, even after a blank. No blank after the heading or between fields; no bold/indented labels.

Sources: registry §§1/8; QF-P1 AC-1/2 and builder Step 0 rulings; G-11/H-9.

### AC-3 — Closed gate-interplay, persistence and alias contracts

- [ ] Registry §7 contains exactly seven distinct data rows, headed `Value | Meaning`: `none`, `restricts`, `delegates-within-ratified-scope`, `gate-2-one-shot`, `gate-3-one-shot-green-chain`, `gate-1-human-only`, `loop-control`. Meanings must be nonempty but are not compared. Reject missing, duplicate and extra rows, including an eighth unknown row.
- [ ] Entry values are bare members of the three-value persistence set (`one-shot`, `persistent`, `persistent (current parcel)`) and the seven-value gate-interplay set, with these assignments:

  | Entries | Persistence | Gate interplay |
  |---|---|---|
  | blanket, asrec | one-shot | delegates-within-ratified-scope |
  | ratify | one-shot | gate-1-human-only |
  | dispatch-ok | one-shot | gate-2-one-shot |
  | merge-ok | one-shot | gate-3-one-shot-green-chain |
  | resume | one-shot | loop-control |
  | dry | one-shot | restricts |
  | status, explain, brief, halt | one-shot | none |
  | strict, nopush | persistent | restricts |
  | review2 | persistent (current parcel) | restricts |

  Names in this table stand for their `--` tokens; the assignments are pins, not derived from prose.
- [ ] The §5 alias table, headed `Alias | Canonical`, has exactly one row, backticked `--blanke` to `--blanket`. Entry `Aliases:` values are `none` or backticked aliases separated by `, `; cross-check both directions, rejecting duplicate, unknown or reassigned aliases.
- [ ] Every registry table checked by this spec has its required header, separator, row width and row count. Cells and §8 labelled values contain no internal `|`, including `\|`; every pipe in those tables must be a column delimiter. The separate §9 restriction-message escape grammar is not subject to this prohibition. Recognize whole table blocks so malformed extra rows cannot disappear from a selective row regex.

Sources: registry §§5/7/8; QF-P1 AC-2/3/10 and cell constraint; G-11/H-9.

### AC-4 — Conflict-table identifiers and assignments

- [ ] In §10, resolution and rule-ID definition tables contain exactly the five resolution IDs and fifteen rule IDs in QF-P1 AC-21: resolutions `independent`, `restrictive-wins`, `ratify-refused`, `asrec-refused`, `dry-stores-nothing`; IDs `D4′`, `D5″`, `D6`, `D10′`, `R6`, `R18`, `T1`, `T2`, `BIND`, `STOP`, `DRY`, `OBS`, `GATES`, `SEQ`, `SUBJ`. Definitions are nonempty, not sentence-matched.
- [ ] The table headed `A | B | Resolution | Winner | Rule` has exactly 55 distinct unordered pairs from the eleven non-observer canonical tokens (exclude status/explain/brief). Reject self-pairs, aliases, unknown tokens and reversed duplicates. Resolution/winner/first-ID assignments for the 21 non-independent pairs match QF-P1 AC-21's pinned matrix, including STOP first for dry×halt. All other 34 pairs have `independent` and Winner `none`.
- [ ] Each Rule cell starts with one or more closed-set IDs separated by `, `, then `: ` and nonempty explanation. Pin first IDs on these seventeen independent pairs; no comparison of the explanation:

  | Pairs (unordered; names denote `--` tokens) | First ID |
  |---|---|
  | ratify × dispatch-ok, merge-ok | GATES |
  | nopush × merge-ok | D10′ |
  | review2 × blanket | R18 |
  | strict × dispatch-ok, merge-ok, nopush, review2 | D5″ |
  | resume × blanket, dispatch-ok, merge-ok, strict, nopush, review2 | SEQ |
  | halt × strict, nopush, review2 | SEQ |

  The last three follow the accepted QF-P1 builder Step 0 `--halt`-row ruling; together with the fourteen explicitly listed in AC-21 they make the forwarded seventeen. Other independent rows' first IDs need only be legal, not historically byte-pinned. Table row ordering and A/B orientation do not matter.

Sources: registry §10; QF-P1 AC-21 and Coordinator rulings after builder Step 0; G-11/H-9. The prose-only OBS statement is not sentence-matched.

### AC-5 — Registry §9 example formats

- [ ] Locate the two §9 fenced examples structurally, not by explanatory prose. The restriction example has the bare label and the two demonstrated restriction lines; parse their fields as `quick flag | scope | since | session | [provisional |] message`. Validate canonical restrictive token, matching goal/parcel scope, `YYYY-MM-DD` shape and nonempty values, optional bare `provisional` only immediately before terminal `message:`. No version/id/extra fields. Example placeholders such as `<session ID>` are valid here and are not template placeholders.
- [ ] The message tail accepts only the defined backslash escapes (`\\`, `\|`, `\n`); unescaped pipes, invalid escapes, dangling backslash and raw line breaks in a value fail. Test encoded messages with literal backslash-n, escaped pipe and newline escapes as distinct cases. Do not parse message content as fields, restrictions or authority.
- [ ] The decision-log example has exactly eight ordered nonempty field lines: `date:`, `session:`, `quick flag:`, `message:`, `question:`, `decision:`, `recommended option:`, `reversibility:`. Values are opaque; no interpretation of a decision, reversibility or issued quick flag.

Sources: registry §9; QF-P1 AC-19/20 as amended (provisional before message, escaping, terminal message).

### AC-6 — Skill, mirror and integration pointers

- [ ] Source and mirror each have exactly one final `## Quick flags` section, with the registry pointer as a backticked path: source `${CLAUDE_PLUGIN_ROOT}/docs/QUICK-FLAGS.md`, mirror `plugins/foreman-line/docs/QUICK-FLAGS.md`. Reject wrong-root/path forms, even where the basename still matches. The loop-directive-model paragraph preserves its backticked template pointer with the same source/mirror root substitution; the retired historical kickstarter basename is absent.
- [ ] The mirror equals the current source after replacing every literal `${CLAUDE_PLUGIN_ROOT}` with `plugins/foreman-line`, and contains no unsubstituted root marker. This is relational synchronization, not a parcel-time byte freeze.
- [ ] COORDINATOR-PATTERN has one final `## Quick flags` section containing backticked `plugins/foreman-line/docs/QUICK-FLAGS.md`. The template introductory quote and Who-you-are section contain backticked `docs/QUICK-FLAGS.md`. Do not test what pointer-bearing sentences mean.

Sources: QF-P2 AC-1/2/6/8/14/15; O-8/P-9 mirror-path gap.

### AC-7 — Template skeleton, quotes and placeholders

- [ ] Template title is `# Loop Directive — TEMPLATE`. Its actual level-two headings are exactly the eleven QF-P2 AC-9 headings, in order, from `COORDINATOR OWNERSHIP — read before dispatching anything` through `Crash recovery`. Missing, extra, duplicate and reordered headings fail with expected/actual heading-list diagnostics. Fenced or quoted heading text must not masquerade as a document heading.
- [ ] The introduction after the title and the ownership-section content are block quotes: every nonblank line of those blocks begins with `> ` at column zero. Ownership contains each required placeholder from QF-P2 AC-10: `<OWNER-SESSION-ID>`, `<OWNER-WORKING-COPY>`, `<INTEGRATION-BRANCH-CHECKOUT>`, `<CLAIM-DATE>`, `<CLAIM-PROVENANCE>`, `<STATE>`. Check form and placeholder presence, not ownership semantics or whether a coordinator is live.
- [ ] Every angle-bracket placeholder follows QF-P2's uppercase grammar: `<[A-Z0-9][A-Z0-9 _/,.:;()-]*>`, wholly on one physical line. Scan across lines to detect a split placeholder (including block-quote prefixes); reject unmatched angle delimiters, lowercase placeholders and embedded line breaks. Ordinary hard-wrapped prose remains valid. Preserve the resume/branch placeholders `<GOAL-SLUG>` and `<INTEGRATION-BRANCH>` in their section.

Sources: QF-P2 AC-8/9/10; O-8/P-9 heading-list, quote-form and wrapped-placeholder gaps.

### AC-8 — Empty template slots and boundaries

- [ ] Template contains exactly one bare column-zero `Active restrictions:` and one bare column-zero `Decision log:`, in that order within `## Active restrictions and decision log`. Reject indented, bold, duplicated, suffixed or displaced labels. Inline code mentions are not labels.
- [ ] From the restriction label to the decision-log label, and from the decision-log label to the next heading, all lines are empty. There is an empty physical line immediately after each label. No example/restriction bullet, log field, prose or comment occupies those slots; no `- ` line occurs earlier in this section. Entry and log parsing never overlap.

Sources: QF-P2 AC-12; registry §9 boundary; O-8/P-9; P-3.

### AC-9 — Scoped lexical integration hygiene

- [ ] Apply lexical checking only to: the skill's Quick-flags section, its Stage-Zero interrogation and loop-directive-model paragraphs (the shipped edits at lines 18/28), mirrored equivalents, COORDINATOR-PATTERN's Quick-flags section, and the entire template. Select paragraphs by their structural locations, not by meaning or a blanket historical-prose scan; missing/ambiguous locations fail.
- [ ] Reject `--` immediately followed by an ASCII letter, and every canonical/alias variant under the shipped registry §5 algorithm: ASCII space/tab/newline word delimiters; separator-comma handling; delete non-delimiter Unicode White_Space and Cf inside words; normalize Unicode Dash plus U+2212/U+02D7/U+2043/U+2796; strip non-letter/digit/dash ends; case-insensitive canonical/alias containment and single-dash forms; dash-only word plus following word equal to or beginning with a name without `--`. This is lexical detection only, not a quick-flag interpreter. No NFKC or homoglyph extension.
- [ ] Reject standalone `flagged` and bare `flag`/`flags` in prose unless preceded by `quick ` or `quick-` (case-insensitive). Only the final paragraph of the source and mirror Quick-flags sections may contain bare quoted `flags`, with this exact exception value: `Builder Step 0 "flags", the issues the per-parcel cycle above tells you to rule on, are not quick flags; nothing in the registry applies to them.` Pin sentence, file identity and paragraph location, not merely a line containing `Step 0`; this exception is a lexical allowlist, not a test of sentence meaning. Mutation controls must refuse changed value, displaced location and foreign-file identity independently. Do not exempt a whole line/section from other lexical checks.

Sources: registry §§4/5; QF-P2 token/term constraints and AC-7/16; O-8/P-9; standing constraint #13. This does not re-test semantic V1/V6/V7 wording.

### AC-10 — Selected live-directive entry contiguity

- [ ] Always require `plugins/foreman-line/docs/goals/quick-flags/loop-directive.md`. Additionally enumerate direct-child `plugins/foreman-line/docs/goals/*/loop-directive.md` files and select those exposing the restrictions/log section heading or column-zero restrictions/log labels (including malformed label suffixes). No recursive historical-copy scan or narrative liveness inference. Marker-free historical directives need not adopt the template heading list. Selection controls prove another marked direct-child file is checked and an unmarked file is not; unreadable present candidates fail rather than being silently excluded.
- [ ] Selected directives have exactly one restrictions label and one subsequent decision-log label in the restrictions/log section. Accept bare labels, and the shipped `Active restrictions: *(none)*` / `Decision log: *(none yet)*` only while their respective slots are empty. A marker plus content fails.
- [ ] Restriction bullets are contiguous immediately beneath the restrictions label, ending at the first physical line not starting with `- `; detect a stranded `- ` restriction bullet after that boundary and before the log label. No decision-log field line is part of that bullet block. The decision log begins after its label and ends at the next document heading; restriction-shaped bullets there are diagnosed as misplaced, never included in the entry. For this boundary diagnostic, a restriction-shaped bullet is a column-zero `- ` line containing a canonical persistent token or a `| scope:`, `| since:` or `| session:` field before any `message:` tail; this lexical shape does not validate its fields or infer its authority. Tokens mentioned in log values or later stop reports are not scanned as active restrictions. No requirement to sentence-match or validate the meaning of live log values.
- [ ] Empty slots may use blank lines; populated logs have no empty marker. The checker diagnoses structural mistakes only: its result never changes registry §9's fail-safe Reading obligations or grants/lifts authority. It neither validates nor repairs real live restriction-field values in this parcel.

Sources: registry §9; O-8/P-9 and P-3; Step 0 rulings 5/6.

### AC-11 — Mutation evidence and bounded parsing

- [ ] Each named invariant above has a valid control and independently failing, single-dimension negative mutations through the same checker used on disk. Assert the named diagnostic, not merely any failure, so an unrelated check cannot mask an unenforced invariant. Use table-driven cases where useful; derive mutations from a valid corpus but pin expected sets/assignments independently of the document under test.
- [ ] Include missing/duplicate/extra headings, labels and rows; eighth label/non-label continuation; every enumerated assignment and each pinned first-ID row; bare and escaped internal pipes; field-order/escape errors; pointer-root and mirror drift; missing/extra/reordered headings; stripped quote prefixes; lowercase/unclosed/wrapped placeholders; empty-marker/content combinations; stranded bullets; both entry/log boundaries; and missing/unreadable/discovery failures. Lexical fixtures cover every §5 variant family, every canonical name and alias, dash-only two-word forms, Cf/non-delimiter whitespace, casing, punctuation, markdown wrappers and suffix forms beyond the old VP5 PCRE, plus `flagged` and each exception axis.
- [ ] Positive controls include prose-only paraphrases in unpinned expansions/definitions/explanations, reordered unordered table rows, a higher matching registry/history version, source/mirror prose edited together, ordinary template prose wrapping and tokens mentioned in opaque log/message values. They must pass when no named structural contract changes.
- [ ] Parse in linear passes with bounded fixed-set comparisons, no nested backtracking regex or repeated growing-string copying. Hostile long words/dash runs, angle-delimiter runs, escaped message tails and malformed table rows have named tests with a finite test timeout; reviewer inspection verifies the algorithm, not timing alone. No network, subprocess or filesystem write in the shipped checker/tests.

Sources: standing constraints #3/#5/#11/#12/#13; all forwarded structural gaps.

## Out of Scope

- New packages; CI runner/workflow/discovery, shard, waiver, dependency-graph or cost-table changes.
- Edits to the registry, goal skill, mirror, template, COORDINATOR-PATTERN, live directives, charter or any other checked canon. A red corpus is stop-and-report, not permission to fix it.
- Semantic/natural-language conformance, sentence/phrase matching for waiver meaning, authority interpretation, message execution, provenance inference, gate granting, restriction lifting or ownership/liveness decisions.
- **Reviewer-only forwarded concern:** QF-P1 AC-2's “only” versus gate-interplay text in two `Conflicts and lifting:` lines. Record/review the meaning; do not turn it into a sentence comparison or banned-phrase check.
- Parcel-time byte/append-only freezes against a moving git base; blanket historical-prose scans; NFKC/fullwidth/Cyrillic homoglyph expansion beyond registry version 1.
- The exit-step fresh-reviewer dry-read walkthrough, QF-P0 authority-registry amendment, receipts, Epic/Story filling, registration, status promotion, push/PR/remote operations, git add/commit or branch changes.

## Context & References

- [Goal charter — D-rows, QF-P3 row, exit criterion](../../goals/quick-flags/charter.md)
- [Loop directive — rulings and Stage F forwarded inputs](../../goals/quick-flags/loop-directive.md)
- [Plan review — QF-R10/R11 and triage](../../goals/quick-flags/plan-review-findings.md)
- [Registry — §§1/5/7/8/9/10](../../QUICK-FLAGS.md)
- [QF-P1 — AC-1/2/3/10/19/20/21 and Coordinator rulings after builder Step 0](../done/QF-P1-quick-flags-registry.md)
- [QF-P1 G findings — G-11](../../goals/quick-flags/qf-p1-v2-review-G-findings-2026-10-13.md)
- [QF-P1 H findings — H-9](../../goals/quick-flags/qf-p1-v2-review-H-findings-2026-10-13.md)
- [QF-P2 — AC-1/2/6/7/8/9/10/12/14/15 and verification-plan gaps](../done/QF-P2-quick-flags-integration.md)
- [Goal skill](../../../skills/goal/SKILL.md)
- [Synced goal skill](../../../../../skills/synced/b1615d10-039d-4783-acf0-ab3f00e92f65_48b499d1-feb5-4dd7-a1c2-31c0becec6cb/goal/SKILL.md)
- [Loop-directive template](../../../templates/kickstarters/loop-directive-template.md)
- [Coordinator canon](../../COORDINATOR-PATTERN.md)
- [Spec convention — §4 and §4.8](../../SPEC-CONVENTION.md)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)
- [Host manifest](../../../spec-linter/package.json), [TypeScript configuration](../../../spec-linter/tsconfig.json), [Biome configuration](../../../spec-linter/biome.json)
- [Alternative host manifest](../../../verification/package.json)
- [CI discovery/shard runner](../../../../../scripts/foreman-line-ci.mjs), [CI workflow](../../../../../.github/workflows/foreman-line-ci.yml)
- [Shaping self-check](../../../shaping/src/self-check.ts), [slug/emitter](../../../shaping/src/emit.ts), [artifact reader](../../../shaping/src/read.ts)

## Verification Plan

On the coordinator machine after build, from the named parcel worktree root:

1. `npm --prefix plugins/foreman-line/spec-linter test` — all old and new tests green; report total and new test counts, failures/cancellations/skips/todos, and map each AC to named tests and mutation diagnostics.
2. `npm --prefix plugins/foreman-line/spec-linter run typecheck` and `npm --prefix plugins/foreman-line/spec-linter run lint` — exit 0, no errors.
3. `plugins/foreman-line/spec-linter/node_modules/.bin/tsx --test plugins/foreman-line/spec-linter/tests/quick-flags-conformance.test.ts`, then `(cd plugins/foreman-line/spec-linter && ./node_modules/.bin/tsx --test tests/quick-flags-conformance.test.ts)` — both pass against identical resolved inputs; this also exercises the no-cwd assumption.
4. Inspect the CI discovery and host glob/configuration cited above. Confirm the new test is exercised by the unchanged host test command, not only by a one-off verification script. No CI edits or full remote run is authorized/required here.
5. Against `B=<build base from dispatch>`, coordinator checks `git diff --name-only "$B"` and `git ls-files --others --exclude-standard`: the builder's changed/new files are exactly the two Allowed Files; shaping-owned spec/artifact/index-row edits are separately accounted for, not a general docs exemption. `git diff --check "$B"` is clean. Read-only corpus paths have no changes. This parcel-time scope check does not ship as a test.

Then one fresh independent adversarial review, read-only, with standing constraints #8–#11. Mandated reviewer focus questions:

- Does each forwarded gap have a mutation that fails on its own named diagnostic, especially the eighth line, extra closed-list row, escaped pipe and all seventeen independent-row first IDs?
- Can table/heading/label extraction silently omit malformed or fenced extra content? Are structural expectations independent of the current document, rather than derived from the same faulty input?
- Does any test interpret or sentence-match meaning, especially the two Conflicts-line “only” concerns, OBS prose, gate/stop clauses or authority? Are valid prose-only edits accepted?
- Does the §5 implementation cover the full shipped lexical algorithm without broadened normalization? Are exception identity, location and value enforced independently, with no whole-line bypass?
- Can a wrapped placeholder or unquoted ownership continuation escape detection? Does a heading-list diff expose missing/extra/reordered headings?
- Can a gap strand a restriction line, an empty marker hide content, or log/stop-report text be read as an entry? Does the diagnostic leave canon's fail-safe obligations unchanged?
- Is module-relative disk loading exercised, including error seams and selected direct-child discovery, on the unchanged suite path? Are parsing and diagnostic emission linear and safe under hostile input?

## Allowed Files

The builder may create exactly these two new test-private files:

- `plugins/foreman-line/spec-linter/tests/quick-flags-conformance.ts`
- `plugins/foreman-line/spec-linter/tests/quick-flags-conformance.test.ts`

No glob, directory, related source, manifest, fixture, generated file or temporary artifact grants mutation authority. This spec, its shaping-result artifact and its INDEX row are shaping-owned and read-only to the builder. Stop for a coordinator-ratified amendment if another file is needed.

## Shaping Provenance and Pending Validation

- Shaped for worktree `/home/cmorgan76/Repos/agent-skills-qf-p3`, branch `qf-p3`, on 2026-10-14. Model named at Step 0: `openai/gpt-6.1-sol`, the dispatch note's recorded substitution after Claude retry failed (400/usage). No route receipt; direct invocation per loop-directive ruling 2026-10-13, extended 2026-10-14. No shaping-session ID is inferred from the coordinator's ID.
- Coordinator answers supplied in this session: coordinator `01a139ff-f7bc-725c-808d-120548a55ef1`, 2026-10-14. Rulings 1–6 accepted the proposed host/files, §9/§10 scope, reviewer-only meaning concern, scoped full §5 coverage, direct-child corpus discovery and separate template/live boundary rules. No open design question was resolved by the shaper.
- Ruling 7 delegates executable `spec-linter`, `selfCheckDraft` and `deriveSessionSlug` validation to coordinator lint (QF-P2/QF-P0 precedent). This session has no process runner. Frontmatter/required-section review and JSON preparation are manual; **no executable self-check, slug derivation, emitter or artifact-reader validation has run here, and no passing result is claimed**. Required sections are present in order; Out of Scope is nonempty; frontmatter uses only fields/enums present in `spec-linter/src/schemas.ts`.
- Raw slug input proposed for coordinator `deriveSessionSlug`: `QF-P3 quick-flags conformance check`. Prepared artifact: `plugins/foreman-line/docs/specs/active/qf-p3-quick-flags-conformance-check.shaping-result.json`, containing one POSIX draft reference and `epics: []`, with the bare-payload shape in `contracts/src/stages/a-intake.ts`. It was manually written, not emitter-produced; validate its slug/schema/payload at lint without overwriting an existing artifact through the collision-refusing emitter.
- Coordinator lint must run the frontmatter CLI and two-layer advisory self-check on this draft, verify the proposed slug with `deriveSessionSlug`, validate the explicit artifact with `readShapingResult`, and spot-check the factual claims above before any promotion. **Coordinator lint is the sole promotion authority. Status remains `draft`; this handoff is not dispatch approval.**
- **Coordinator lint 2026-10-14 (session `01a139ff-f7bc-725c-808d-120548a55ef1`).** `selfCheckDraft` executed on the coordinator machine: valid, no errors or warnings. `deriveSessionSlug('QF-P3 quick-flags conformance check')` → `qf-p3-quick-flags-conformance-check`, matching the artifact name; artifact `{parcelSpecRefs, epics: []}` confirmed. On-disk spot checks: all 15 rule IDs present in the registry; 55 conflict rows + 1 alias row (56 `| \`--` lines); §10 header at :282; §8 seven-label entry structure; §7 seven data rows; CI discovery (foreman-line-ci.mjs:209,249), spec-linter in the frozen list (:53) and cost table (:316), absent from WAIVED_EXCLUSIONS; only this goal's loop-directive.md exposes the Active restrictions markers. Promoted `draft` → `active`; Gate 2 dispatch of QF-P3 is covered by the standing authorization (loop-directive item 1) contingent on this lint, which passed.
