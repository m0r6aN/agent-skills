# QF-P2 adversarial review, Reviewer O, round 1

**Verdict: REQUEST CHANGES.** I found no fail-open path and no BLOCKER or HIGH finding. There is one MEDIUM: a contradiction that literally fails AC-16, and it can be fixed within AC-3 as written. Everything else is LOW.

## Verification Plan, run against build base `41f80463`

All 11 commands give the outputs the spec states:
- **1.** The base has 40 and 89 lines, and the template does not exist at the base.
- **2.** No diff; line 41 is `[]` and line 42 is `## Quick flags`; there is exactly one such heading and it is the last; the section is 11 lines (cap 14).
- **3.** No diff for line 18; line 28 prints `ok`; `foreman-line-coordinator-loop` occurs 0 times in both files.
- **4.** Every grep returns 1.
- **5.** 0 matches in all four files, and the variant grep prints nothing.
- **6.** Exactly one line, and it contains `Step 0`.
- **7.** The base precondition holds and the mirror matches.
- **8.** No diff; 4 lines appended; one heading; V1, V6 and the registry path each found once.
- **9.** 110 lines; the headings match AC-9 exactly; both `Active restrictions:` and `Decision log:` are found exactly once; the line after `Active restrictions:` is `[]`; 0 field lines; no non-upper-case placeholders; 0 clean-room hits; all 7 ownership anchors present.
- **10.** Clean, with four `\n` endings.
- **11.** Exactly the four Allowed Files, and the historical directive is untouched.

I also ran three extra probes:
- **Variant scan.** I wrote my own implementation of registry §5's variant definition (Cf characters, the full Dash set, both clauses) and ran it over all added text. It found no variants.
- **Hard wraps.** No line in the template has an odd number of backticks, so no backticked span is split.
- **Mirror.** The synced copy differs from the source only by the `${CLAUDE_PLUGIN_ROOT}` substitution. `manifest.json`, `.last-complete-round` and the bucket marker are unchanged.

## Findings

| # | Rank | Class | Finding and evidence | Suggested disposition |
|---|---|---|---|---|
| O-1 | **MEDIUM** | Contradiction; AC-16 literal failure (fail-closed, not fail-open) | **The skill's V7 carve-out is narrower than the registry's, so it reads as revoking prose grants stored outside loop directives.**<br>• `goal/SKILL.md:46` reads: "Nothing stored in a file can grant authority… Prose standing authorizations **in the loop directive** are governed by canon and registry §3, not by that sentence."<br>• The registry has no such qualifier: `QUICK-FLAGS.md:41` says "Prose standing authorizations are governed by canon and §3". `QUICK-FLAGS.md:31` names grants "in a loop directive **or a goal's authority file**".<br>• Literal reading: a live prose grant in a file other than a loop directive is "stored in a file", is not carved out, and so can grant nothing. Real examples are `goals/ops-console-roadmap-authority.md:10-21` (a cross-goal blanket grant, including merges and pushes), the FK amendment and ruling files, and the charter's standing authorizations at `SKILL.md:19`.<br>• That reading contradicts V6, which this parcel just put into canon (`COORDINATOR-PATTERN.md:93`: "Existing prose grants are neither reinterpreted nor revoked"). It also fails AC-16's "revoking a prose grant".<br>• It is inconsistent inside the skill: line 18 exempts "**its** prose standing authorizations and gate record" (any location, and the gate record too), while line 46 exempts only loop-directive standing authorizations and not the gate record. | Rework inside AC-3: delete "in the loop directive" so line 46 matches `QUICK-FLAGS.md:41`. A broader sentence still "says" what AC-3 requires about loop-directive grants, so no spec amendment is needed. Re-run VP 4 and 6. |
| O-2 | LOW | Naive reading (b)/(e) | **Line 18's carve-out invites the inverse reading "the gate record may grant or widen authority".** V7 at line 46 excludes that reading, since it gives the gate record no carve-out. But the template's Gate record section (`template:33-38`) only points to registry §3 and §8. It never says an entry records a past human act and grants nothing, which `QUICK-FLAGS.md:111` states only for `--ratify` entries. | Optionally add "An entry records a past human act and confers nothing." This is not a format definition, so AC-11 permits it. Otherwise accept as documented. |
| O-3 | LOW | Template mis-fill (mandate 7) | **The Standing authorizations slots invite a grant that was never given.**<br>• `template:42` reads "Granted by `<GRANTOR>`": nothing says the grantor must be the human developer.<br>• Items 1–2 are pre-numbered Gate 2 and Gate 3 grant slots, with no instruction to write `none` (gate stays human) when no grant was given. A copier filling "every `<PLACEHOLDER>`" (`template:4`) is pushed to put text in every slot.<br>• A single `<GRANT-DATE>` misstates provenance for grants given "at ratification or later" (`COORDINATOR-PATTERN.md:52`). | Add "(the human developer)" to the grantor placeholder, and a line saying "where nothing was granted, write `none`; that gate stays with the human". The template is at its 110-line cap, so make room by rewording. |
| O-4 | LOW | Template mis-fill (restriction loss) | **Nothing stops a re-copy over an existing loop directive.** `template:3-4` says "Copy this file to `docs/goals/<GOAL-SLUG>/loop-directive.md`". There is no guard against copying over an existing directive, which would wipe the `Active restrictions` lines and the gate record. The carry sentence covers only "When this file is first written" (`template:73`). A dropped line loses a restriction, and this template opens a new route to it beyond §9's accepted residual. | Add "Never copy over an existing loop directive." Otherwise accept as documented. |
| O-5 | LOW | Contradiction between surfaces | **The template names only two canon documents.** `template:29-31` says "Canon: `docs/COORDINATOR-PATTERN.md` and the `/goal` skill… canon governs above it". The skill (`SKILL.md:44`) and registry §2 list three canon documents, including `SPEC-CONVENTION.md`. A naive reader could rank the registry above `SPEC-CONVENTION.md`. The practical risk is low, because `--merge-ok` defers to SPEC-CONVENTION §8 item 4. | Name all three, or write "Canon (see the `/goal` skill)". |
| O-6 | LOW | Contradiction (fail-closed) | **"Scoped to this goal only" re-scopes cross-goal prose grants.** `template:42` says every standing authorization is "scoped to this goal only". The ops-console record "persists across all three roadmap goals" and tells coordinators to carry it into their directives. Restating it under this header narrows (reinterprets) its scope, against V6 and AC-16. | Write "as it applies to this goal" instead, or accept. |
| O-7 | LOW | Ownership transfer (canon-inherited) | **Who may transfer ownership is unstated.** The two mandate readings fail: `template:16-18` rules out a mid-parcel claim ("only at parcel boundaries") and requires naming the session ID and both paths. But neither the template nor canon says who may make a transfer; the live directive records "on the developer's instruction". `<CLAIM-PROVENANCE>` is unconstrained. | Forward to the goal's exit report. This is distinct from M-1/N-1. |
| O-8 | LOW | Checkability gaps for QF-P3 | VP 5 does not implement registry §5. Proven by mutation:<br>• `-\u200Bnopush`, `\uFF0Dnopush` and `\uFE63strict` are all missed.<br>• VP 6 misses "flagged", which the spec says to avoid.<br>• VP 9's placeholder check works line by line, so a placeholder wrapped across lines escapes it.<br>• Removing the `> ` markers from the ownership section still passes VP 9, so AC-10's block-quote form is unchecked.<br>• Hard wraps split anchor phrases a structural check would grep for: "Gate 1 is never / delegable" (43-44), "never produce / it" (28-29), "Nothing in the / entry can grant authority" (70-71). | Forward to QF-P3. The current text is clean under my full §5 scan. |
| O-9 | LOW (informational) | Citation stability | Two existing citations now point at changed text: `plan-review-findings.md:32` (R8 cites `GS:28`) and `qf-p1-review-F-round3:34` (`GS:28-30`). Both are historical review records describing what this parcel fixes, and ruling Q1 permits the line 18 and 28 edits. Every other cited line (GS:13,32,36,40 and CP:7,30,51-53,55,69,73) is byte-identical (VP 2 and VP 8). The authority-registry excerpts are Q12, already accepted. | Accept as documented. |

## Naive readings (mandate 2): each excluded except where a finding says otherwise

- **(a) Route 1, a token or line in the loop directive grants authority.** Excluded:
  - `template:44-45` says no quick flag is written in Standing authorizations;
  - `template:70-71` says the entry grants nothing;
  - `SKILL.md:46` (V7) covers stored text in general.
- **(a) Route 2, the Coordinator puts a quick flag in its own wakeup or resume prompt.** Excluded:
  - `SKILL.md:46` makes a quick flag count only in a human-typed turn;
  - `template:99-100` forbids writing one into those prompts;
  - per ruling F, the rule is not repeated at `SKILL.md:30`.
- **(a) Route 3, a delegating quick flag plus ratification passes Gate 1.** Excluded by `SKILL.md:20` (unchanged), V1, the canon-governs sentence at `SKILL.md:44`, and `template:43-44`.
- **(a) Route 4, a delegating quick flag covers a triage-reopened Gate 1.** Excluded by `SKILL.md:24` together with line 20, and `template:90` (human gates are stop conditions).
- **(b)** O-1 (a contradiction that fails AC-16 literally) and O-2.
- **(c) Pasted or expanded text carries a quick flag.** Excluded: "counts only in" (line 46) is a necessary condition, not a sufficient one, and line 48 treats an expanded body that cannot be told apart as pasted content under §4.
- **(d)** Excluded; see O-7.
- **(e)** O-2 and O-3; the `Active restrictions:` line itself is clean.
- **(f) Registry above canon, or a gate added or removed.** Excluded: `COORDINATOR-PATTERN.md:93` ends "this charter governs", and V1 says a quick flag never removes a gate.

## Other mandate items

- **AC trace (mandate 3).** I traced AC-1 to AC-17 against the text. All pass except AC-16, which fails literally because of O-1.
- **"Documented once" (mandate 4).** No added text restates an entry, line format, conflict row or example line. The locations the skill names (`SKILL.md:50`) match §9's homes exactly; the Writer's second copy is a copy, not a home (ruling D).

**Wording nits:** "the charter it serves" (`template:5-6`) collides with the goal's `charter.md`. "this file restates none of them" (`template:7`) sits beside paraphrased registry rules. The template's `*(none yet)*` gate-record default is already stale when the loop directive is written, which happens after Gate 1 (fail-closed; related to F-1).

**Verdict: REQUEST CHANGES** (O-1). Once O-1 is fixed, ACCEPT with the LOW items as listed.

`git status --short` shows the same four build paths as at the start. I made no repo changes, and my scratch directory in `/tmp` has been removed.
