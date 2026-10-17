# Reviewer K: QF-P1 v2 round 3, `plugins/foreman-line/docs/QUICK-FLAGS.md` at HEAD `7f2fc9d7` (rework commit `dc38aaad`)

**Verdict: REQUEST CHANGES.** I found 1 MEDIUM and 6 LOW, with no BLOCKER and no HIGH.

No quick flag, alone or combined, waives any §3 item. That covers Gate 1 and a re-opened Gate 1, the universal stops, green-chain merge, human-only gates, and destructive or outward-facing actions. I probed tokens in files, pasted or quoted text and code spans; aliases, variants and repeats; mention versus issue; limiting prose; argument spans; `--ratify` beside `--asrec`/`--blanket` in one message and across messages; `--resume` and ownership; `--dry`/`--halt` and the pending wakeup; inert messages; forged `Active restrictions` lines; lifts; and stop-report answers.

The MEDIUM is a fail-open for persistent restrictions. The Writer stores lines in one checkout, but the Reading rule never requires a session to read that checkout.

## Verification Plan (B=`521f774a`; also clean against `f9aa4f42`)

| # | Result |
|---|---|
| 1 | `1`; 346 lines (cap 370) |
| 2 | `14`, awk prints `0` |
| 3 | The 14 rows equal the AC-2 table exactly; `7` |
| 4 | V1–V7: `1` each |
| 5 | `1`; only ``Aliases: `--blanke` `` |
| 6 | Identical to the spec's 21 pinned rows by `diff`, then `rows 55 ok` |
| 7 | `0` |
| 8 | Only L35; "flagged" count 0 |
| 9 | Only `QUICK-FLAGS.md` changed; no untracked files; `--check` clean |

**Mutations on scratch copies:**
- **Caught:**
  - a swapped pinned Winner;
  - a deleted row (`rows 54`);
  - swapped label order (awk prints `1`).
- **Not caught (expected, already accepted):**
  - re-citing `--blanket`×`--review2` as `SUBJ:`, the known G-11/H-9 gap;
  - deleting the Branch-checkout clause at L122, because no check binds prose.

**Other checks:**
- GATES text is byte-identical in L122 and L131.
- Every phrase the round-2 rulings removed now greps to 0: "currently granted", "pending re-open is not granted", "whitespace-like", "integration-branch checkout", "never `main`", "shows ratified", "after the current step", "whitespace-delimited", "not yet merged".
- Removal sweep: no leftover record, void, revocation, pin, blob or id machinery.

## Round-2 closure and rulings 3a–3k

| ID / ruling | Status | Evidence |
|---|---|---|
| I-2, J-1 | Closed | L122/L131 "Every other check reads the goal's records as they stood before this message… a `--ratify` in this message satisfies none of them"; L276; rows L303–304 |
| I-1, J-3, J-9, 3b | Closed | L111 "(at Gate 1, the charter's decision list and Parcels table…)"; L122/L131 "…whose shown parts included the Parcels table or that row (an entry naming no revision ties none)". The L120 Branch has a residue, K-6 |
| I-4 | Closed | Parenthetical gone (0 hits) |
| J-2 | Closed for GATES | L122/L131 "in every other copy the session reads (the owner's working copy included)". The same principle was not carried to Reading, K-1 |
| J-4, 3f | Closed | Owner refusal in L95, L104, L122, L131; §7 L78–80; D4′ L264; Reading L226 "or dispatches, merges or acts outward for it". GATES text over-reaches onto `--ratify`, K-3 |
| I-3, J-8, 3e | Closed | L228 "once carried… no longer a copy and is not read"; L225 "removes it from every copy… it can reach"; "with the same scope". Residue in K-5 and K-7 |
| I-6, J-6 | Closed | L183, L185, L122, L251, L270, L316 |
| I-5, J-10, 3d | Closed as ruled | L37 "delimited only by ASCII space, tab and newline"; L60 dash set and dash-only rule. Residue in K-4 |
| I-7 | Closed | L228 "the owner is the session that started `/goal <concept>`" |
| I-8, 3g | Closed | L120 "last…"; "checkout of the ratified charter's Branch"; "repository's trunk (`main`)" (twice) |
| I-9, J-12 | Closed | L216 field order, backticked first field, entry end |
| J-5 | Closed | L225 clauses (1)–(4) |
| J-7 | Closed | L39 "A token named in a lift has no span…" |
| J-11 | Closed | L45 "where they cannot, it is pasted content" |
| Nit (L31 scope) | Closed | L31 "The §3 bar… is an effect of those tokens on their own message…" |
| 3a | Closed | L131 "not merged into the integration branch before this message"; L311 |
| 3c, 3h–3k | Accepted as documented | No text required |

**AC trace:**
- All 24 ACs pass once the binding rulings are applied, and V1–V7 are verbatim at L21, L23, L29 (twice), L120, L31 and L41.
- All 55 rows match their entries' Conflicts lines. 91 − 55 = 36 OBS pairs.
- No temporal deadlock is fail-open.
- None of the findings below is a missed instance of a cited round-2 ID, so I do not count a false closure. K-1 extends J-2's principle beyond GATES; the coordinator should judge the tripwire.

## Findings

| ID | Sev | Class | Finding and evidence | Suggested disposition |
|---|---|---|---|---|
| K-1 | MEDIUM | Fail-open (a persistent restriction is silently lost) and an internal contradiction | **The rules:**<br>• Writer, L225: "only the owning Coordinator, in the checkout of the ratified charter's Branch".<br>• Reading, L226: lines are honoured "in any copy it reads". Nothing requires a session to read the Writer's checkout.<br>• GATES, in contrast, does require it (L122/L131/L276: "in the checkout of the ratified charter's Branch and in every other copy").<br>**This goal's layout:** `git worktree list` shows no checkout of `feat/foreman-line-quick-flags`. The live loop directive is on `qf-p1`. `/goal resume` reads `${CLAUDE_PLUGIN_ROOT}/docs/goals/<slug>/` (SKILL.md:13), which may be yet another copy.<br>**Path:**<br>1. `--strict` is written to the Branch checkout.<br>2. A resumed owner reads its own working copy and finds no line.<br>3. A later `--blanket` passes "while a `--strict` line is in force" (L95, L174, T2).<br>The same happens to `--nopush` against a standing-authorized push.<br>**Second gap:** "ratified charter" is defined only inside `--merge-ok` (L120) and requires a gate-record entry naming a revision. Without one, the Writer has no location and no "any doubt" fallback.<br>**Why it is not the accepted residual:** the line is not dropped. It is written where the Reading rule does not look. | In Reading, add "in the checkout of the ratified charter's Branch and in every other copy it reads" (mirroring GATES). Have the Writer write to every copy of the entry it can reach (mirroring the lift rule), falling back to the owner's working copy when no Branch is defined. |
| K-2 | LOW | Contradiction, and one reading fails open | **The window:** after Gate 1 and before the loop directive exists, which is the plan-level review (SKILL.md:22–28).<br>• Stage Zero has ended (CP:30, CP:51 "Stage Zero exit").<br>• The Writer's "(at Stage Zero, in the draft charter)" (L225) no longer applies.<br>• No loop directive exists, but L228 ("Before the loop directive exists… in the draft charter") still applies, and the charter is now ratified.<br>**Two readings:**<br>• **Literal:** there is nowhere to write, so `--strict` is never "in force" and `--blanket` triage of the plan review is accepted.<br>• **Loose:** the line goes into the ratified `charter.md`. That is an unratified mutation (CP:28) that also breaks a later `--ratify` condition (b). | Say that until the loop directive exists, lines go in `charter.md`'s `Active restrictions` entry as a goal record, not charter text, and that the starting session stays the owner until then. |
| K-3 | LOW | Contradiction with ruling 3f | L276 GATES says "Gates 1, 2 and 3 are separate gates, and each gate quick flag is the human's own act, refused in a session that is not the goal's owner". That literally includes `--ratify`. The `--ratify` entry (L113) and 3f have no owner refusal, and GATES is cited on rows `--ratify`×`--merge-ok`/`--dispatch-ok` (L303–304). | Use "`--dispatch-ok` and `--merge-ok` are refused in a session that is not the goal's owner". |
| K-4 | LOW | Fail-open for an intended restrictive quick flag (I-5 residue) | The dash-only rule (L60) says "equals", and its comparison is not case-insensitive, unlike the main rule ("compared case-insensitively, contains").<br>A literal implementation run on scratch input classifies these as neither token nor variant: `-- Dry`, `— HALT`, `-- dry-run`.<br>So in `-- Dry --merge-ok QF-P1` the merge proceeds. The accepted em-dash cost is the false-inert direction; this is the opposite direction. | Use "whose result, compared case-insensitively, equals or begins with a canonical name or alias without its `--`". |
| K-5 | LOW | Contradiction between Reading and the lift rule | **(a) Collateral removal:** Reading says a line "restricts as each" restrictive name it holds (L226). A lift removes every line whose first field is the lifted quick flag (L225). So lifting X removes a malformed X-line that also restricts as Y, and Y is lost without a lift naming Y (T3).<br>**(b) Silent persistence:** the "still appears… with the same scope" test lets a lift of X "complete" without a report while a different-scope line still restricts as X. This direction fails closed. | A lift removes a line only if, outside `message:`, it names no other restrictive quick flag. Count "still appears" over every line Reading would honour as X, in any scope. |
| K-6 | LOW | Scope mismatch (I-1 pattern at L120) | `--ratify` ratifies "only the text presented" (L111), which at Gate 1 is the decision list and Parcels table. The `--merge-ok` target, though, is "the Branch in the ratified charter (the last charter revision that a gate-record entry ties…)" (L120), with no shown-parts condition.<br>The `**Branch:**` header (charter.md:13) is never presented, so the "ratified" Branch is text the Coordinator wrote and the human never ratified. The damage is bounded: at worst a local merge into the wrong local branch, never `main`. | Accept as documented and reword to "the Branch in the charter revision…", or require the Branch line among the shown parts. |
| K-7 | LOW | Undefined term; conflicts with ownership canon | L225 "every copy of the entry it can reach, in the checkout or not" can be read as editing or committing on other live parcel branches or worktrees (the 491fb80 hazard, CP:73). Also, "a copy the session cannot reach" cannot be known, so whether a lift succeeded cannot be decided. This fails closed. | Define reachable copies as the checkouts the owner itself writes. Report any other copy instead of editing it. |

**Wording nits:**
- §3 says "a Gate 1 re-opened by triage is Gate 1", so L111 "(at Gate 1…; otherwise the amendment text)" literally makes a re-open ratification present the decision list and Parcels table too. It fails closed, but needs one word to fix.
- The labels `scope:`/`session:`/`message:` and the session-value format are defined only by example (L216–221).
- "ratified charter" is defined inside one entry (L120) but used in L131 and L225.

**Git control:**
- `git status --short` is empty, and HEAD is unchanged (`7f2fc9d7`).
- The private `mktemp -d` scratch directory has been removed.
- I wrote, edited or committed nothing in the repo.

**Verdict: REQUEST CHANGES** (K-1).
