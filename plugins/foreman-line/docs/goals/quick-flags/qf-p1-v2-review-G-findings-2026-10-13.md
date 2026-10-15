# QF-P1 v2 review, Reviewer G: `plugins/foreman-line/docs/QUICK-FLAGS.md` at `fddec092`, registry version 1

**Verdict: REQUEST CHANGES.** There is no BLOCKER or HIGH finding. No quick flag can waive Gate 1, the universal stop conditions, green-chain merge, human-only gates or the destructive/outward-facing limits by any direct route I tried. All 24 ACs and V1–V7 are satisfied as written, and all nine Verification Plan commands give the stated outputs. The changes are needed for 7 MEDIUM findings: one restriction can lapse without a human lift, a few checks rely on file evidence the registry never defines, and the `Active restrictions` reading and lift rules contradict each other.

## 1. Verification Plan, run against build base `B=521f774a`

| # | Result |
|---|---|
| 1 | `1`, and `346` lines |
| 2 | `14` headings; the label check prints `0` |
| 3 | Exactly the 14 rows of the AC-2 table; `7` closed-list rows |
| 4 | V1–V7 each match once (`grep -cF` → `1` ×7) |
| 5 | `1`; only `` Aliases: `--blanke` `` is printed |
| 6 | The 21 pinned rows, byte-identical to the spec, then `rows 55 ok` |
| 7 | `0` |
| 8 | Only line 35, the builder Step 0 disambiguation sentence; "flagged" count is 0 |
| 9 | Only `QUICK-FLAGS.md` changed outside excluded paths; no untracked files; `git diff --check` is clean |

I also checked by hand what check 6 does not test:
- **Pinned rows:** every one of the 21 has the first rule ID AC-21 requires.
- **Independent rows:** every one of the 17 rows AC-21 pins cites the required ID (GATES, D10′, R18, D5″ ×4, SEQ ×6).
- **OBS rule:** it covers 91 − 55 = 36 observer pairs, as stated.
- **Conflicts lines:** each entry's `Conflicts and lifting:` line matches its table rows.

## 2. AC trace (all PASS)

| AC | Registry text that satisfies it |
|---|---|
| AC-1 | `Registry version: 1` (L3); "single source of truth… 'Documented once' excludes goal records" (L7); editorial classes and "Any edit to an `Expansion:` line bumps" (L9); version table; T5 (L9, L346) |
| AC-2 and AC-3 | Checks 2 and 3 above; §7 table (L74-82) |
| AC-4 | Check 7 = 0; no record, id, void or pin remnants (I grepped for revok, void, record, pin, held: only V5, V6 and "gate record" remain, as AC-14 requires) |
| AC-5 | V1 (L21), V2 with the required introduction (L23), "applies to every quick flag" (L25), stop-report human decision (L27) |
| AC-6 | V3 (L29), V4, `COORDINATOR-PATTERN.md:73`, "The local merge that `--merge-ok` covers is neither" |
| AC-7 | V6 and the prose-grant paragraph (L31) |
| AC-8 | V7 (L41) and its bullets (L43-50) |
| AC-9 | One-shot scope, tokens, all-or-nothing arguments, limiting prose including `--review2` and `--resume` (L37-39) |
| AC-10 | §5 (L52-60) |
| AC-11 | §6 (L62-68), including OQ-2 ("exempt from `--dry`") |
| AC-12 to AC-18 | Entries L84-213; each clause in the spec is present, and the post-Step 0 rulings are applied: refusal for words after a no-argument quick flag (L39), answers to stop reports (L27, L66), unlinted parcels "nothing is dispatched for any named parcel… not a refusal" (L129) |
| AC-19 and AC-20 | §9 (L214-246), including the multi-name ruling (L226) and OQ-3 |
| AC-21 and AC-22 | §10 and §11 |
| AC-23 | §2 (L17-19) |
| AC-24 | Check 9 |

## 3. Findings

| ID | Sev | Class | Finding and evidence | Suggested disposition |
|---|---|---|---|---|
| G-1 | MEDIUM | Fail-open (a restriction loosens without a human); contradicts the charter | §9 says "`--strict` and `--nopush` lines last until lifted **or goal exit**" (QF:227). Elsewhere these lines are "removed only by a human-typed plain-language lift (T3)" (QF:176, 212). D5″ says "only a human-typed instruction lifts it" (charter:35), and V7 says nothing stored in a file can "loosen any restriction" (QF:41). Goal exit is decided by the Coordinator and recorded in files (charter status, final report), so a mistaken or forged "exit" ends `--nopush`/`--strict` with no human lift. This text is mandated by AC-19, so the defect is in the spec too. | Coordinator ruling: delete "or goal exit", or make exit end restrictions only by a human-typed act. |
| G-2 | MEDIUM | Contradiction; deadlock over time | The §9 reading rule honours "every line, **in any copy of the loop directive**, that contains `--strict`, `--nopush` or `--review2`… whatever else the line holds", and the lift rule keeps a restriction "if the lifted name still appears on another line" (QF:225-226). Three consequences:<br>(a) A `message:` field is verbatim. If one message issues `--strict --nopush`, each line contains both names, so neither can be lifted alone.<br>(b) A `--strict` line whose message merely mentions `--review2` makes `--review2` restrict every parcel in progress for the whole goal, since no parcel can be read. That contradicts "persistent (current parcel)" and the "spent" state (QF:183).<br>(c) Read literally, the rule covers stop reports, which §6 requires to name each provisionally honoured quick flag; this goal writes its stop reports into `loop-directive.md`. It also covers decision-log `message:` lines and QF-P2 template prose. So §6's "removes it by a lift" (QF:68) can never succeed. | Limit the reading rule to lines of the `Active restrictions` entry. Exclude `message:` text from the "still appears" lift test, or escape quick-flag names inside `message:`. |
| G-3 | MEDIUM | Fail-open of a GATES check through a file; not mechanically checkable | GATES refuses if "Gate 1 was not granted… (in any form, prose included)" or if a Parcels row comes from "charter text still awaiting Gate 1" (QF:121, 130). No evidence source is defined: the gate record "has no format" (QF:111), and V7 says files grant nothing. "The Coordinator's checkout" is not fixed either (this goal commits coordinator docs on `qf-p1`). In practice the check reads mutable files. An edited gate record ("ratified at `<newer sha>`") makes a Parcels row that never passed Gate 1 pass, and `--dispatch-ok <that ID>` then dispatches it. | Define the evidence: a row is ratified only if it is byte-identical in a charter revision that a gate-record entry quoting a human message cites, and that revision is on the integration branch. Any doubt means stop and report. |
| G-4 | MEDIUM | Fail-open against a scoped Gate 1 re-open | GATES does not refuse a gate quick flag for a parcel that an **open** scoped re-open blocks (CP:75; the re-open record "blocks QF-P1 (reshape and rebuild)"). During such a re-open, `--merge-ok QF-P1` passes every listed check: Gate 1 "was granted" and the row is unchanged. §3 says no quick flag removes "Gate 1 (including one re-opened by triage)". | Add: refused if any named parcel is blocked by an open Gate 1 re-open. |
| G-5 | MEDIUM | Fail-open at Gate 2 | `--asrec` "takes that step" (QF:102), and its only gate bar is "never grants a gate **by answering a gate prompt**". Gate 2 is not in the §3 list (QF:23); merge is covered there by "green-chain-contingent merge", dispatch is not. Literal case: the previous turn says "Next step (recommended): dispatch QF-P2", with no standing Gate 2. `--asrec` then dispatches. Only the D4′ rule-ID gloss in §10 (QF:264) forbids this, outside the entry. | In the `--asrec` Expansion and the §7 row, say that a step needing Gate 2 or 3 not covered by a standing authorization is not covered; the Coordinator stops there. |
| G-6 | MEDIUM | Scope of a Gate 1 act | `--ratify` ratifies "the text shown" (the decision list or amendment text) but records "the revisions shown" of whole files (QF:111). `charter.md` also holds the Parcels table and "Standing authorizations requested" (charter:86). Showing only the decision list plus a SHA yields a gate-record entry that a later reader takes as covering the whole revision: rows never shown pass GATES, and the requested Gate 2/3 authorizations look granted. Also, if the amendment text exists only in chat, condition (a) is met by `charter.md`'s revision alone, and nothing ties the text later written to what was shown. | State that `--ratify` ratifies only the presented text and grants no standing authorization that was not presented; the gate record names the parts shown. Require amendment text to sit in a file at a shown revision. |
| G-7 | MEDIUM | V7 tension; the gap left by removing the pinned branch | `--merge-ok` merges into "the integration branch named in the goal's loop directive" (QF:120). That name comes from a mutable file and from an unspecified copy (§9 accepts "any copy"). An edited directive redirects the human's one-shot Gate 3 to another local branch. If it names `main`, the entry contradicts itself ("into the integration branch" vs "a merge reaching… `main` stays human"). | Take the target from the ratified charter (`charter.md:13`), require it to match the integration-branch copy of the directive and never be `main`; a mismatch means stop and report. |
| G-8 | LOW | Contradiction (fails closed) | Read literally, V7 ("Nothing stored in a file can grant authority", QF:41) cancels the prose standing authorizations that V6 (QF:31), §3 (QF:29) and CP:55 honour. | Add a scoping sentence after V7, e.g. "…as a quick flag; prose standing authorizations are governed by canon and §3." This follows the round-1 A-9/A-17 sweep pattern. |
| G-9 | LOW | Fail-open, narrow | A non-owner session keeps provisional restrictions as conduct only (QF:64, 225). Example: a fresh session receives `--resume quick-flags --asrec --strict`, which is inert. If the same session then becomes owner through a clean `--resume`, nothing makes it write the provisional `--strict` line. `--blanket` checks only for a line (QF:95), so it is accepted, although §6 says the restriction holds "until" confirmed or lifted. Stage Zero conduct-only restrictions also lapse across sessions (QF:228), unlike the Stage Zero decision log, which goes into the draft charter (QF:244). | A session that becomes owner writes every provisional restriction it is honouring. At Stage Zero, record restrictions in the draft charter. |
| G-10 | LOW | Mechanical gap | In the restriction-line grammar, `message:` is free verbatim text with only newlines escaped, yet `\| provisional` comes after it (QF:216-224). A message containing ` \| provisional`, ` \| scope: …`, or a literal `\n` cannot be parsed back. The reading rule keeps this fail-safe, but it is not checkable (STANDING-CONSTRAINTS #4). | Make `message:` the last field and escape `\` and `\|` in it. |
| G-11 | LOW | Mechanical gap (Verification Plan; relevant to QF-P3) | Mutations on scratch copies that passed undetected:<br>(M1) an extra non-label line inside an entry: check 2 still prints `0`.<br>(M2) an 8th row added to the §7 closed list: check 3 still counts `7`.<br>(M3) a `\|` inside a Rule cell: check 6 still prints `rows 55 ok`.<br>(M5) `--dispatch-ok × --dry` re-cited as `SUBJ:`: check 6 output identical.<br>The AC-21 first-ID pins and the "no `\|` in cells" constraint are checked only by hand (they hold today). | Extend Verification Plan check 6 to print the first rule ID of each pinned row; have QF-P3 add the closed-row, extra-line and pipe checks. |
| G-12 | LOW | Mechanical gap | "Dependency order" (QF:130) is undefined: Parcels-table row order, or explicit "Depends on" text? QF-P0 says only "Sequenced after QF-P2" (charter:74). Under the explicit-text reading, `--dispatch-ok QF-P0` passes while QF-P2 is unmerged. | Define it as table row order (fails closed). |
| G-13 | LOW | Ambiguity | In the `--halt` rows (QF:289-329), "nothing is merged/dispatched **after the current step**" leaves open whether the act the message itself requests is "the current step". Compare `--ratify × --halt` (QF:306), where ratification is processed. | Define the current atomic step as the one in progress when the message arrived; nothing the message requests is started. |
| G-14 | LOW | Gaps | (a) A repeated quick flag in one message (`--merge-ok QF-P1 --merge-ok QF-P2`, `--ratify a --ratify b`) is not addressed, and "names one of **its** parcels outside its span" (QF:39) is ambiguous.<br>(b) Single-dash near-misses such as `-dry-run` or `-no-push` are neither tokens nor variants (QF:60), so a restriction the human meant is processed as prose.<br>(c) A slash-command or skill expansion inside a human turn could be read as file content (ignored, QF:44) or as pasted content (inert, QF:45). Once QF-P2 names the tokens in SKILL.md, the literal reading makes every `/goal resume` inert. | (a) A repeated quick flag refuses it. (b) Treat a word that, minus a leading `-`, contains a canonical name as a variant. (c) Classify skill expansion explicitly, and forward this to QF-P2. |

**Wording nits (one line):**
- §6's "takes no write…" sits right before the required stop writes (QF:64); say "other than the stop writes".
- The Winner column names the non-refused flag in rows whose message is inert, so nothing applies.
- `loop-directive.md:21` is a goal-specific citation inside a generic registry (QF:121, 130).
- At Stage Zero, "inside the ratified scope" covers nothing, so "draft work only" is redundant (QF:78).

## 4. Probes that held (text blocks the wrong reading)

| Route | Blocking text |
|---|---|
| Token in a file or the loop directive | L44 |
| Token in a wakeup or resume prompt | L43 |
| `--asrec`/`--blanket` with `--ratify` in one message, or `--ratify` beside an alias | R6 (L111, 286, 296) |
| `--blanket` covering a re-opened Gate 1 | L23, L25 |
| Forged line naming `--blanket` | L226: "grants nothing" |
| Forged line with extra fields | Still restricts (L226) |
| Lift found in a file or in quoted content | L47 |
| `--asrec` choosing an option that lifts a restriction | "No quick flag lifts anything" (L225) |
| Variant or Unicode-dash tricks | Message becomes inert (L60) |
| Pasted content beside a gate quick flag | L49 |
| `--dry` + `--halt` and the pending wakeup | STOP (L273) |
| `--merge-ok` beside `--nopush` | Local only (L120) |
| `--review2` named in a lift | "A lift instruction is not limiting prose" (L39) |

**Git control:** `git status --short` is empty, and the registry blob equals HEAD (`d218129d…`) at `fddec092`. My scratch work was in `mktemp -d` and was removed. One probe briefly wrote `/tmp/g6.out` instead; that file is outside the repo and was deleted. I made no repo changes.

**Verdict: REQUEST CHANGES** for G-1 to G-7. G-1 and G-6 need a spec or coordinator ruling, because their text comes from AC-19 and AC-14.
