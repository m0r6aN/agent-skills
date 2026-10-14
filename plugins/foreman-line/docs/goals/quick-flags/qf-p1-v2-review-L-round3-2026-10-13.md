# Reviewer L: QF-P1 v2 round 3 review of `plugins/foreman-line/docs/QUICK-FLAGS.md` at `7f2fc9d7` (builder commit `dc38aaad`)

**Verdict: REQUEST CHANGES.** I found one MEDIUM, seven LOW and no BLOCKER or HIGH. No quick flag, alone or combined, waives Gate 1, the universal stop conditions, green-chain merge, human-only gates or the destructive/outward-facing limits. The MEDIUM is a restriction that can be silently lost: the registry tells the Coordinator to write a stored restriction in one place but never requires a session to read it there.

## Verification Plan (run read-only; bases `521f774a` and the rework base `f9aa4f42`)

| # | Result |
|---|---|
| 1 | `1`; 346 lines (cap 370) |
| 2 | `14`, and the awk check prints `0` |
| 3 | Exactly the 14 rows of the AC-2 table; closed list `7` |
| 4 | V1–V7: `1` each |
| 5 | `1`; only ``Aliases: `--blanke` `` |
| 6 | Byte-identical (`diff`) to the 21 pinned rows plus `rows 55 ok` |
| 7 | `0` |
| 8 | Only L35; "flagged" = 0 |
| 9 | Only `QUICK-FLAGS.md` changed against both bases; no untracked files; `--check` clean |

**Mutation tests:**
- Changing the Winner of `--halt`×`--resume` is caught.
- Deleting the non-owner refusal from `--merge-ok` passes every check. This is the known G-11/H-9 gap and is not re-raised.

**Checks by hand:**
- The first rule ID matches AC-21 on all 21 pinned rows and the 17 pinned independent rows.
- Every entry's Conflicts line agrees with its table rows.
- 91 − 55 = 36 observer pairs.
- No `\|` appears in any cell.
- The removal sweep found no remnant of the old stored-grant design. The only hits are `ID`/`IDs`, "no id", "shaping", "goal/gate record", "revoked" (V6), "revokes nothing" and "voids" (V5).

## Closure of round-2 findings and rulings 3a–3k

| Item | Status | Evidence |
|---|---|---|
| I-2, J-1 | Closed | L122/L131 "Every other check reads the goal's records as they stood before this message … a `--ratify` in this message satisfies none of them"; GATES L276; both ratify rows |
| I-1, J-3, J-9 | Closed (see L-4) | L111(a) "at Gate 1, the charter's decision list and Parcels table"; L122/L131 "…whose shown parts included the Parcels table or that row (an entry naming no revision ties none)" |
| I-4 | Closed | "(a pending re-open is not granted)" no longer appears anywhere; the "open scoped Gate 1 re-open blocks any named parcel" clause is kept |
| J-2 | Closed | L122/L131 "in the checkout of the ratified charter's Branch and in every other copy the session reads (the owner's working copy included)… if in any copy…" |
| J-4 | Closed (over-broad in GATES, L-2) | Non-owner refusals at L95, L104, L122, L131; §7 rows "in the goal owner's session"; D4′ row; Reading L226 "or dispatches, merges or acts outward for it" |
| I-3, J-8 | Closed (see L-6) | L228 "once carried, the draft charter's entry is no longer a copy and is not read"; L225 "removes it from every copy of the entry it can reach… with the same scope, or in a copy the session cannot reach, the restriction stays" |
| I-6, J-6 | Closed | `independent` definition L250 "except where a Rule names a restriction that applies from message arrival"; L183; L185; R18 rule ID; `--merge-ok`×`--review2` row; L122 "A `--review2` in this message binds before it (R18)" |
| I-5, J-10 | Mostly closed (L-3 residue) | L37 "Words are delimited only by ASCII space, tab and newline"; L60 non-delimiter White_Space/Cf deletion, dash set extended, dash-only rule |
| I-7 | Closed | L228 "the owner is the session that started `/goal <concept>` for the slug" |
| I-8 | Closed | "last" used in L120, L122 and L131; Branch-named checkout; "the repository's trunk (`main`)" ×2 |
| I-9, J-12 | Closed | L216 field order, backticked first field, "up to the first line not starting with `- `" |
| J-5 | Closed | L225 items (1)–(4) |
| J-7 | Closed | L39 "A token named in a lift has no span and is not subject to argument refusal" |
| J-11 | Closed | L45 "where they cannot, it is pasted content" |
| Nit (scoping of the prose-ratification bar) | Closed | L31 new sentence |
| 3a | Closed | L131 "not merged into the integration branch before this message"; `--merge-ok`×`--dispatch-ok` row |
| 3b | Closed | L111(a); L122/L131 |
| 3c | Disclosed consequence; not raised | — |
| 3d | Applied, but the case-insensitive comparison was omitted | L-3 |
| 3e | Closed | L225 "in the checkout or not"; "copy the session cannot reach… stays" |
| 3f | Applied in the entries; contradicted by the GATES text | L-2 |
| 3g | Applied | L120 (see L-4) |
| 3h–3k | Accepted as documented | Version stays 1 |

## AC trace (all 24 pass as amended by the rulings; one gap in intent)

| AC | Where it is satisfied |
|---|---|
| AC-1 | L3; L7; L9; L11-13; T5 at L9 and L346 |
| AC-2, AC-3 | VP2 and VP3; §7 L70-82 "no other value is valid" |
| AC-4 | L86 "One-shot quick flags have no stored form"; VP7 = 0 |
| AC-5 | L21 (V1); L23 (V2, "applies to every quick flag"); L25; L27 |
| AC-6 | L29 (V3, V4) |
| AC-7 | L31 (V6) |
| AC-8 | L41-50 (V7) |
| AC-9 | L37-39 |
| AC-10 | L54-60 |
| AC-11 | L64-68 |
| AC-12 | L93 and L95 |
| AC-13 | L102 and L104 |
| AC-14 | L110-113 |
| AC-15 | L118-131 (as amended by C4, I-1, I-2, J-2, 3a and 3b) |
| AC-16 | L163-167 |
| AC-17 | L138-158 |
| AC-18 | L174 "(provisional included)"; L210; L183-185 |
| AC-19 | L216-230. Its intent ("any session owning or resuming the goal honours every line") fails at L-1. |
| AC-20 | L231-244 |
| AC-21 | §10, with VP6 identical |
| AC-22 | L342-346 |
| AC-23 | L17 |
| AC-24 | VP9 |

## Waiver probes (all blocked)

Each of these attempts is excluded by the text:

- **Tokens outside typed text:** a token in a file, the loop directive, a pasted or quoted block, a code span or subagent output (L44-49).
- **Skill bodies:** a token inside an expanded skill body (L45).
- **Spoofed tokens:** aliases, near-miss spellings, and variants made with NBSP, U+02D7, U+2796 or `-- dry` (L60; I checked these with a literal implementation).
- **Combined gate flags:** `--asrec --ratify`, `--blanket --ratify`, and a prose ratification beside either one (L25, R6).
- **Same-message ratification feeding a gate flag:** `--ratify` followed by `--merge-ok`/`--dispatch-ok` in one message (L122/L131).
- **Re-opened Gate 1:** `--blanket` against a Gate 1 re-opened by triage (L23).
- **Stop reports:** `--asrec` answering a stop-report or gate prompt (L102).
- **`--resume`:** with the wrong slug, or against a live owner (L163-167).
- **`--dry`/`--halt`:** a stop still makes the stop writes and cancels the wakeup (L138, L156).
- **Inert messages:** a lift in an inert message, and provisional honouring (L64-68).
- **Forged or edited `Active restrictions` line:** it grants nothing (L226), and an edit can at most drop a restriction (the accepted residual).
- **Delegating flags against `--strict`:** a delegating flag lifting `--strict` (T2).
- **Merge targets:** `--merge-ok` to `main`, a PR or a remote (L120).

## Findings

| ID | Sev | Class | Finding and evidence | Suggested disposition |
|---|---|---|---|---|
| L-1 | **MEDIUM** | Fail-open: a stored restriction is lost; partly a rework-2 regression | **The mismatch.**<br>• The Writer puts lines "only… in the checkout of the ratified charter's Branch" (L225).<br>• Reading honours lines "in any copy **it reads**" (L226). Nothing requires a session to read the copy the Writer writes. GATES, by contrast, must read the Branch checkout and the owner's working copy (L122/L131).<br>• Refusal of `--blanket`/`--asrec` depends on "a `--strict` line … in force" (L95, L104, L174).<br><br>**The path.**<br>• Session S1 issues `--strict`, and the line is written in the Branch checkout.<br>• Session S2 runs `/goal resume` from its own working copy (`skills/goal/SKILL.md:13`). It sees no `--strict` line, so `--blanket` is accepted.<br>• `--nopush` fails the same way against a push covered by a standing authorization, because an outward action never reads the Branch checkout.<br><br>**This goal already shows it.** `feat/foreman-line-quick-flags` has no worktree, and the live directive is on `qf-p1` and differs from it (`git diff --stat`: 16 lines).<br><br>**The regression.** "Ratified charter" is defined only at L120, and "an entry naming no revision ties none". A goal ratified only in prose (canon's default, SKILL:20; ruling 3b) therefore has no ratified charter, and L225 gives no place to write a line at all.<br><br>**One more gap.** Nothing names a write location for the window between Gate 1 (the end of Stage Zero) and creation of the loop directive (L225, L228). | Require Reading to include the entry at the Writer's location and in the owner's working copy, as GATES does. Define the write location without the revision tie, for example the loop directive in the checkout of the integration branch the loop directive names. Name the location for the post-Gate-1, pre-directive window. |
| L-2 | LOW | Contradiction (fails closed) | GATES (L276) says "each gate quick flag is the human's own act, refused in a session that is not the goal's owner". L27 uses "gate quick flag" in a way that includes `--ratify`. But `--ratify` has no owner refusal (L113), and ruling 3f says "no change for `--ratify` in a non-owner session". | In the GATES text, name `--dispatch-ok` and `--merge-ok` instead of "each gate quick flag". |
| L-3 | LOW | Fail-open for restrictive quick flags (I-5/J-10 residue) | The dash-only rule at L60 ("whose result equals…") drops the "compared case-insensitively" of the sentence before it.<br>• A literal implementation does not treat `-- Dry`, `— HALT` or `-- Halt.` as variants.<br>• So `-- Dry --merge-ok QF-P1` merges, and `-- Dry merge it` merges under the human's prose Gate 3.<br>• `(-- halt)` also escapes, because `(--` is not "only dashes". | Make the dash-only comparison case-insensitive, and apply the strip step to the dash-only word before testing it. The fix adds no lines. |
| L-4 | LOW | Contradiction (the I-1 scope mismatch, now on the merge target) | A Parcels row counts as ratified only with a tie "whose shown parts included the Parcels table or that row" (L122/L131). The target Branch (L120) uses the bare revision tie. Gate 1's presented text (L111(a): "decision list and Parcels table") never includes the Branch line. So the target is "ratified" by a whole-revision tie, the reading I-1 ruled out. The effect is bounded: the target must also equal the loop directive's integration branch, is never trunk, and the merge is local. | Accept as documented in one sentence, or add the Branch line to the parts presented at Gate 1. |
| L-5 | LOW | Contradiction that depends on processing order | The `--ratify`×`--strict` and `--ratify`×`--nopush` rows are `independent` ("neither changes the other"). But at Stage Zero the restriction line is written into `charter.md` (L225, L228), the same file that `--ratify` (b) requires to be "unchanged since that turn" (L111).<br>• **Line written first:** `--ratify` is refused and the message is inert. A non-provisional line has already been written, although §6 allows only stop writes.<br>• **`--ratify` processed first:** it passes. | Evaluate (b) as of message arrival, or exclude the `Active restrictions` entry from (b). |
| L-6 | LOW | Tension with canon | A lift removes the line "from every copy … it can reach, in the checkout or not" (L225). Read literally, that includes copies on live parcel branches and in builder worktrees, against SPEC-CONVENTION §8 item 1 (no shared working state) and the CP:73 ownership incident. "Can reach" is not the same as "may write". If the Coordinator declines to write there, the result fails closed, but the text does not say which happens. | Define a reachable copy as one the owner may write under canon. Other copies are reported, which the "restriction stays" clause already covers. |
| L-7 | LOW | Mechanical gap | Several terms are undefined or defined in the wrong place:<br>• "the ratified charter" is defined only inside the `--merge-ok` Expansion (L120) but used at L131 and L225.<br>• The ordering behind "last" is undefined: gate-record entry order or commit order? A `git hash-object` blob has no order and may not be in the object store, so "its text in" that revision cannot be recovered.<br>• "gate quick flag" is never defined.<br><br>GATES fails closed through "Any doubt: refuse". The Writer has no such fallback (L-1). | Add one definition sentence in §3 or §9. |
| L-8 | LOW | V7 tension, never given a disposition (I-1(2)) | The GATES evidence is a gate-record entry written by the Coordinator. Editing that entry turns a refusal into a pass, which sits against V7 (L41). The round-2 triage ruled on what counts as evidence but did not record a disposition for this point. | Accept as documented: the gate record is evidence, and the human's typed gate quick flag is the act. |

**Wording nits:**
- The `--halt` text "starts no… decision" (L156) still depends on the `--ratify`×`--halt` row for C1.
- L111(a) "at Gate 1… otherwise the amendment text" sits against "A Gate 1 re-opened by triage is Gate 1" (L23).
- The lift test "with the same scope" can disagree with Reading's "restricts as each" when a malformed line has another scope, so nothing gets reported.
- §6 and STOP require updating "the ownership block" at Stage Zero, where none exists.
- `--dispatch-ok QF-P2 --review2` binds `--review2` to a parcel that is merged but not yet closed.
- AC-2's "only" still clashes with the extra text in some Conflicts lines (raised in earlier rounds).

**Git control:** `git status --short` is empty, HEAD is still `7f2fc9d7`, and `git diff --stat HEAD` is empty. I worked only in a private `mktemp -d` directory, now removed, and changed nothing in the repo.

**Verdict: REQUEST CHANGES**, for L-1.
