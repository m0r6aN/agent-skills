## Findings — Reviewer Q, round 2

| ID | Rank | Finding | Evidence | Suggested disposition |
|---|---|---|---|---|
| — | — | No new fail-open path, contradiction, AC failure, or untriaged QF-P3 mechanical-checkability gap found. | Review and checks below. | Accept rework 1. |

Paths used below:

- **S:** `plugins/foreman-line/skills/goal/SKILL.md`
- **M:** `skills/synced/b1615d10-039d-4783-acf0-ab3f00e92f65_48b499d1-feb5-4dd7-a1c2-31c0becec6cb/goal/SKILL.md`
- **T:** `plugins/foreman-line/templates/kickstarters/loop-directive-template.md`
- **C:** `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`
- **R:** `plugins/foreman-line/docs/QUICK-FLAGS.md`

### Closure of every FIX triage ID

| Triage ID | Result | Quote and evidence |
|---|---|---|
| O-1/P-1 | Closed | **S:46, M:46:** “Prose standing authorizations are governed by canon and registry §3, not by that sentence.” The narrowing “in the loop directive” qualifier is absent from both exceptions. |
| O-3/P-8 | Closed | **T:33:** “a human ratification”; **T:40:** `<GRANTOR, THE HUMAN DEVELOPER>`; **T:42–43:** “the slot says `none` and that gate stays with the human.” |
| O-4 | Closed | **T:3–4:** “Never copy over an existing loop directive.” |
| O-5/P-7 | Closed | **T:28:** “`docs/COORDINATOR-PATTERN.md`, the `/goal` skill and `docs/SPEC-CONVENTION.md`.” All three canon documents are named. |
| O-6 | Closed | **T:40–41:** “as it applies to this goal.” The former goal-only scope restriction is absent. |
| P-2 | Closed | **C:93:** “A restrictive quick flag still limits the Coordinator's conduct under a prose grant and leaves that grant unchanged (registry §3).” |
| P-3 | Closed | **T:72–75:** every earlier entry’s lines go “directly under the `Active restrictions:` label below,” including both earlier homes. |
| P-5 | Closed | **T:61–62:** read “the `Active restrictions` entry in each copy named in the ownership block.” |
| P-6 | Closed | **T:99–100:** “Wakeup, resume, hook-feedback and completion-notification prompts never carry quick flags.” |

The fixes cover their applicable occurrences, including the mirrored skill. No stale replacement target remains.

The R1–R7 room-making edits preserve the required content: introduction and copy destination; ownership identities and both paths; resume command and branch; all canon references; all per-iteration inputs and the skill cycle; registry-only formats and carry instructions; fallback/completion/no-poll pacing. The Standing-authorizations rewrap keeps **“Quick flags” together on T:44** and passes the term check.

Accepted/forwarded subjects remain intact: O-2’s gate-record carve-out limitation; O-7/P-4’s canon-inherited ownership terminology; O-8/P-9’s verification limitations; O-9’s permitted historical citation changes; and the recorded wording nits. None is re-raised here.

### Adversarial literal readings

| Wrong-but-literal reading attempted | Exclusion or result |
|---|---|
| **A stored token or loop-directive line grants authority.** | **S:46:** “a stored entry is honoured only to restrict.” **T:70–71:** nothing in the entry can grant authority or loosen a restriction. **R:225–226** permits only owner-written restriction state and says other quick-flag lines grant nothing. |
| **The Coordinator can issue a quick flag to itself in a wakeup or resume prompt.** | **T:99–100** prohibits all four prompt kinds and writing quick-flag tokens into them. **S:46** requires a human-typed developer turn; **R:44** additionally requires ignoring and reporting prompt tokens. |
| **A delegating quick flag plus ratification passes Gate 1.** | **S:44** preserves every gate and establishes canon precedence. **R:25** expressly rejects ratification of any form in a message carrying a delegating quick flag or alias. **T:43** prohibits Gate 1 delegation. |
| **Delegation covers Gate 1 reopened by triage.** | **S:24** still reopens Gate 1 when triage changes a locked decision. **R:23–25** expressly includes reopened Gate 1 and states that it is Gate 1. Nothing added overrides this. |
| **S:18 or V7 voids prose standing authorizations or the gate record.** | **S:18** expressly concerns state “beyond its prose standing authorizations and gate record.” **S:46** gives prose standing authorizations the unqualified canon/§3 exception. **T:33–36** describes a record tied to a past human ratification, not a fresh grant. The remaining V7/gate-record wording limitation is accepted O-2, not a new finding. |
| **“Only the words the human typed count” authorizes pasted or expanded tokens.** | **S:48** expressly excludes skill/command bodies and treats indistinguishable expansion as pasted content. Its §4 pointer incorporates **R:46–49**, excluding quoted/pasted issuance and making the relevant mixed-content messages inert. The accepted unmarked-paste residual is unchanged. |
| **Editing the ownership block claims ownership mid-parcel, or only a session ID identifies the owner.** | **T:11–18** requires a session ID and both paths, transfers only at parcel boundaries, updates all three together, and stops on another live coordinator. The accepted questions of who authorizes transfer and what “live” means remain unchanged. |
| **Standing authorizations, Gate record, or `Active restrictions:` can hold a quick-flag grant or pre-authorize Gate 1.** | **T:33–36** points to human-ratification evidence; **T:40–45** requires the human’s verbatim prose grant, keeps ungranted gates human, excludes Gate 1 and quick flags; **T:69–79** provides an empty restrictive entry and log, with formats defined only in §9. |
| **C’s new section elevates the registry above canon or changes the gates.** | **C:93:** “never removes a gate” and “Where the registry and this charter differ, this charter governs.” **S:44** and **T:28–29** likewise establish canon precedence. The existing gate table is byte-unchanged. |

These exclusions also preserve universal stops, green-chain merge, human-only gates, verification separation, and destructive/outward-facing limits through canon and registry §3. I found no newly authorized bypass.

### AC-by-AC trace

| AC | Result | Evidence and quote |
|---|---|---|
| AC-1 | Pass | **S:41–42:** empty line then `## Quick flags`; exactly one final heading; section is **11 lines**. Original lines other than 18/28 and frontmatter are byte-identical at their original positions. |
| AC-2 | Pass | **S:44:** “the single, versioned source of truth”; “its `Registry version:` line carries the version”; “canon governs.” V1 is present verbatim on one line. No entry, alias, format, conflict row, or example is duplicated. |
| AC-3 | Pass under binding triage | **S:46:** V7 verbatim, followed by the corrected unqualified prose-authorization exception and “human-typed developer turn.” **S:48:** skill and expanded `/goal` bodies excluded; indistinguishable expansion is “pasted content.” |
| AC-4 | Pass | **S:50:** draft charter, intermediate `restrictions.md`, and loop directive/log homes; “the lines of every earlier entry.” Format, writer, reading, lifting, and lifetime point to §9. No decision-log carry rule added. |
| AC-5 | Pass | **S:18** equals the specified line exactly, including “beyond its prose standing authorizations and gate record.” |
| AC-6 | Pass | **S:28** equals the specified line exactly and points to `templates/kickstarters/loop-directive-template.md`. Historical kickstarter name occurs zero times in S/M. |
| AC-7 | Pass | **S:52:** builder Step 0 “flags” “are not quick flags.” This is the sole permitted unqualified occurrence in added/edited text. |
| AC-8 | Pass | **T:1:** `# Loop Directive — TEMPLATE`; **T:3–7:** copy/fill instructions and references. Uppercase placeholders, clean-room exclusions, and **110-line** limit pass. |
| AC-9 | Pass | All 11 headings exactly match the specified order. **T:22:** resume and branch; **T:26:** “you consume verification, you never produce it”; **T:53:** new parcel is “stop-and-report”; **T:61–65:** reads, cycle, additions, boundary update. |
| AC-10 | Pass | **T:11–18:** session, both absolute-path placeholders, date/provenance, state, one coordinator, parcel-boundary transfer, coordinated identity/path update, and “STOP and report.” Entire ownership content is blockquoted. |
| AC-11 | Pass under binding triage | **T:33–36:** registry pointer then `*(none yet)*`; **T:40–49:** human grantor/date, verbatim scope/contingencies, corrected cross-goal wording, `none` rule, Gate 1 exclusion, quick-flag exclusion, three numbered slots. |
| AC-12 | Pass | **T:69–75:** registry-only formats and restrictive-only rule, followed by carry of both earlier entries directly under the label. **T:77–80:** exact bare labels and blank boundaries; no restriction, example, or log field line. |
| AC-13 | Pass | **T:85–93:** universal, human-gate, hook, and goal-specific stops. **T:97–100:** long fallback, completion primary, “Never poll,” all four prompt kinds. **T:104–110:** session-state check, unclaimed disk rejection, fresh-session Step 0 and ruling. |
| AC-14 | Pass | M equals S after only `${CLAUDE_PLUGIN_ROOT}` → `plugins/foreman-line`. Base mirror precondition also passes. No other synced path changed against the build base. |
| AC-15 | Pass | **C:1–89** unchanged; four appended lines; **C:93** has registry pointer, V1/V6 verbatim, prose standing-authorization preservation, restrictive-conduct clarification, and charter precedence. |
| AC-16 | Pass | Token/variant and term checks pass. Literal waiver probes above disclose no new waiver, stored quick-flag grant, prose-grant invalidation, or non-owner write permission. |
| AC-17 | Pass | Scope command returns exactly the four allowed paths after coordinator-owned exclusions. Historical kickstarter unchanged; whitespace/newline checks pass. |

### Verification commands and mutation controls

I reran all **11 Verification Plan groups against `41f80463`**:

| Group | Actual result |
|---|---|
| 1 | Base lengths **40 / 89**; template absent at base, expected `git cat-file` failure **128**. |
| 2 | Stability diff empty; `[]`, heading, count **1**, final heading correct; section **11** lines. |
| 3 | Line-18 diff empty; exact line-28 comparison prints **`ok`**; historical-name counts **0 / 0**. |
| 4 | All ten required section-content counts **1**. |
| 5 | Token counts **0** in all four files; variant scan empty. |
| 6 | Exactly one match, the builder **Step 0** sentence. |
| 7 | Base and current mirror diffs both empty. |
| 8 | Original-prefix diff empty; **4** appended lines; heading and three required content counts **1**. |
| 9 | **110** lines; title/headings exact; registry count **2**, restrictions-path count **1**; both labels count **1**; blank restriction boundary; prohibited fields/patterns **0**; placeholder rejection scan empty; every ownership anchor present. |
| 10 | Diff check empty; template trailing-whitespace count **0**; four newline terminators. |
| 11 | Exactly four allowed files; historical-kickstarter diff empty. |

Private scratch negative controls rejected **29 mutations** covering exact lines, preserved positions, verbatim strings, tokens/variants, split “Quick flags,” mirror equality, headings, placeholders, clean-room paths, entry/log boundaries, hygiene, and every rework closure guard. These include supplementary reviewer checks; they are not a claim that the spec’s greps prove semantics.

A broader registry-§5 normalization scan found **zero variants** in added/edited text and detected all seven hostile variant controls.

**D2″, homes, mirror, citations:** no duplicated registry definition or extra home found. The integration-branch checkout is a second copy, not a new home, consistent with the Step 0 ruling. No original citation-bearing line moved; only the expressly permitted S/M lines 18 and 28 changed text. C’s original 89 lines are unchanged.

Wording nits only, unchanged: T:74 possessive after a code span; T:14 colon; C:93 citation style; S:50 repeated “entry.”

**Git control:** final `git status --short` is identical to the entry snapshot, showing only the four pre-existing build changes. No repository changes or commits were caused by this review.

## Verdict: ACCEPT
