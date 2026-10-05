# HCS-P0 — Adversarial Review A — findings — 2026-09-26

**Reviewer:** Review A (fresh frontier adversarial review; zero builder context; reviewer writes only this file).
**Scope reviewed:** `hcs-p0-authority-and-collision-map.md` + `hcs-p0-verification.md` against the binding spec `docs/specs/active/HCS-P0-authority-and-collision-reconnaissance.md` (AC1–AC8).
**Method:** every AC content requirement checked against the spec text; citations re-measured live (all 8 A3 re-anchoring rows, all 7 Stage Zero §3.3 stale-assumption rows, all 12 source pins recomputed, ~20 further locator spot-checks); FK-state claims cross-read against `../foreman-kernel/fk-reconciliation-2026-09-26.md`, `fk-p0-canon-authority-enforcement-registry.md`, `fk-p1-p21-dispatch-plan.md`, and the live FK charter; scope checked via `git status --porcelain` and `git diff`.
**Pin state at review time (2026-09-26):** all 13 recorded digests recomputed and matching (`94d974b8…` FK charter, `a5d9196c…` A3, `bd748566…`/`d628f98e…`/`13d8a20a…` FK records, `5748c70d…`/`92f61629…`/`4e82276f…`/`21ea644d…` HCS records, `46e54386…`/`7ac31500…`/`ed17361c…`, map `bccf9594…`). FK charter line count re-measured `wc -l` = 807 (X1 handling confirmed correct, not harmonized).

## Per-AC verdicts

| AC | Verdict | Basis |
|---|---|---|
| AC1 — Ownership map | **PASS** (with F2) | O1–O9 cover every required item (FK owner-of-record + row-16 handoff, branch/worktree family + active loci, the 2026-09-26 HCS claim, and all five contested surfaces); unresolved rows are `escalated-unresolved`, never closed. Spot-verified: `fk-reconciliation:28,30,43`, `goal-status-report:12,66`, `foreman-ops-console/charter.md:55,92,96`, `plugin-packaging-and-scaffolder/charter.md:98,266`, `foreman-line-boundary-routing/charter.md:67` — all say what is quoted. |
| AC2 — Kernel-contract map | **PASS** (with F3) | K1–K15 name the constraint classes, the 14-row operation authority matrix, D1–D20, INF-1–INF-8, and every FK-P1/P2/P9–P13/P15/P18/P21 seam from Stage Zero §4, with `live`/`Gate-3-pending`/`unstarted` verdicts. Registry content verified; five registry locators wrong (F3). |
| AC3 — State-authority map | **PASS** | SA1–SA5 map FK D2/D9/D14, FK-P9/P10 lease/transition, FK-P11 projection authority with the three required consequence columns (scheduler frozen input / roll-up reference / fail-closed) plus a boundary statement. C16 re-run: no tracked `.sqlite`/`.db` (map SA2's "no live provider" claim holds). |
| AC4 — Queue-mechanics map | **PASS** (with F5/F6) | Side-by-side current-vs-D24 table + gap list G1–G9, all `unstarted`; "no target property is present today" stated and honored (mandated focus question 5 passes). Two COORDINATOR-PATTERN locators and the INF-8 locator drift (F5/F6). |
| AC5 — Serialization-point inventory | **PASS** (with F10) | SP1–SP12 cover the spec's named list end to end with owner, collision rule, fail-closed vocabulary (refuse/wait/escalate), and FK-rule citations where they exist; SP5/SP6 honestly record "no FK rule (goal-level canon)". Exhaustiveness claim over "every active serialization point" is unbounded vs FK charter §12 (F10). |
| AC6 — Exact landing target for A3 | **PASS** | All eight A3 rows (A3.1–A3.8) verified against the live FK charter at the cited lines (see table below); dispositions `re-anchor`/`transcribe-after-safe-sequence` used; preconditions (a)–(d) exactly match the spec's four named preconditions; A3.8 re-anchored to §17 per Stage Zero §3.3 row 4; A3.8's own developer-ratification gate correctly separated from the coordinator receipt; no FK file edited by this slice (`git diff` on the FK charter shows only the pre-existing coordinating-wave edits, outside the C19 slice window). |
| AC7 — Evidence discipline | **PARTIAL** | Strong: [M]/[D]/[I] vocabulary, contradiction ledger X1–X6 with the 807/808 discrepancy recorded rather than harmonized, all 7 Stage Zero §3.3 rows re-verified (none deferred), every C5–C11 raw output reproduces exactly against the live FK charter. Defects: three cited sources never pinned or command-captured (F2), six wrong FK-registry locators (F3), one wrong reconciliation locator (F4), drifted COORDINATOR-PATTERN/INF-8 locators (F5/F6), loop-directive locators that resolve only against an unrecoverable pre-update pin (F7), the S2 uncommitted-edit characterization contradicting S3 (F8), and the label-exhaustiveness overclaim (F9). |
| AC8 — Independent verification | **PASS as builder deliverable** | Commands C1–C22 with raw output + exit codes, tool versions (C22), artifact digests (§2; all re-computed and matching), before/after repo status with honest sibling attribution (§4), allowed-path audit (§4), verification-time divergence check (§5), AC-by-AC mapping (§6), remaining holds H1–H8 (§7), and two scheduled pending frontier review receipts (§8) including the required security-focused review scope. The record correctly states the gate is released by coordinator acceptance, not the builder. The D-1 write is disclosed in the audit but is a scope violation (F1). |

## Sampled citation verifications (re-measured 2026-09-26)

### A. Every A3 re-anchoring claim (map §6)

| Row | Cited anchor | Live re-measurement | Result |
|---|---|---|---|
| A3.1 | `## 4. Locked decisions` `charter.md:88`; rows `:101–120`; D20 last at `:120`; no D21 row | `grep -nE '^#{1,3} '` + `sed 88,122p`: heading at 88, D1 at 101, D20 at 120, rows exactly D1–D20 | PASS |
| A3.2 | same §4 table, append after the row A3.1 places | A3's own target "Append after D23" (`source-proposed-amendment-A3.md:72`); live table end at `:120` | PASS |
| A3.3 | same, append after D24 row | A3 `:110` "Append after D24"; consistent | PASS |
| A3.4 | `## 5.` at `:122`; table `:124–133`; `### Common decision envelope` at `:135` | `sed 122,136p`: all three match exactly | PASS |
| A3.5 | `## 7.` at `:244`; bullet ends `:257`; closing paragraph `:259` | `sed 244,262p`: bullet at 257, paragraph at 259–260 | PASS |
| A3.6 | `## 11.` at `:346`; final queue-empty item at `:372` | `sed 346,374p`: item at 372 | PASS |
| A3.7 | `## 13.` at `:398`; items `:402–415`; item 7 `:411`; item 8 `:412` | `sed 398,424p`: all match; A3's renumber instruction (insert after item 7, 8–11 → 9–12) confirmed at A3 `:194` | PASS |
| A3.8 | no `§4.1` heading; ledger `## 17` at `:781`; table `:785–789`, 5 dated rows, none for A3 | `sed 781,792p`: matches; rows 2026-08-31 ×2, 2026-09-01, 2026-09-07 ×2 | PASS |

### B. Every Stage Zero §3.3 stale-assumption verdict (map §7.2)

| Row | Verdict in map | Re-measurement | Result |
|---|---|---|---|
| 1 | 808-lines claim stale; 807 measured at identical digest; X1 recorded | `sha256sum` = `94d974b8…` matches both records; `wc -l` = 807; Stage Zero `:126` says "808 lines" | PASS (X1 honest) |
| 2 | D1–D20 only; "D21" is recovered-A1 text at `charter.md:521`, `fk-reconciliation:47,57` | all three lines verified verbatim; no decision row after D20 | PASS |
| 3 | stage0 worktree stale as locus; active set `codex/fk-p0-*`/unattended/resume (+handoff) | `fk-reconciliation:28` matches; C15 branch list in record enumerates 8 branches incl. `d0e87ce`, `1747c1d`, `947e6f1`, `fe31042` | PASS |
| 4 | "§4.1 Ratification ledger" stale; live ledger §17 | verified (A3.8 row above) | PASS |
| 5 | loop-directive FK claim stale as current state; no `loop-directive.md` in live FK dir | `ls docs/goals/foreman-kernel/` = ADR-001, charter, fk-p0 registry, fk-p1-p21 plan, fk-reconciliation; `fk-reconciliation:37` (row 10) agrees | PASS |
| 6 | "FK-P0–FK-P21 remain unchanged" corroborated | FK charter §6 waves at `:176–228` intact; registry §9 GD-3 at `:230` defers FK-P1+; A3 `:205–206` itself says no parcel/graph change | PASS |
| 7 | A3 "PROPOSED — not ratified"; ledger unfilled | A3 `:5`, `:251` verified; no A3 row in FK §17 | PASS |

### C. Further spot-checked citations

| Claim | Cited | Result |
|---|---|---|
| All 12 source pins (C18) + A3 + map digests | §0 table / §2 | PASS — every digest re-computed and identical |
| D2/D9/D14 state-authority quotes | `charter.md:102,109,114` | PASS — verbatim match |
| §11 stop item "a parcel needs a file outside its exact Allowed Files" | `charter.md:357` | PASS |
| §13 item 7/8 wording | `charter.md:411,412` | PASS |
| FK-P0 row-16 handoff quote "observed idle, not transferred …" | `fk-reconciliation:43` | PASS |
| R31 `1747c1d` 751/751, PR `947e6f1` unsubmitted | registry §8 (`:209–215`) | PASS content / FAIL locator (F3) |
| `contracts/` frozen-loop-stop + console writes nothing | `foreman-ops-console/charter.md:92,55` | PASS |
| scaffolder canon / boundary-routing template claims | `plugin-packaging-and-scaffolder/charter.md:98,266`; `foreman-line-boundary-routing/charter.md:67` | PASS content / FAIL pin (F2) |
| "first agent … only long-running one"; "outputs are decisions and dispatches" | `COORDINATOR-PATTERN.md:7` | PASS |
| 11-step loop / GATE 2 / GATE 3 lifecycle | `COORDINATOR-PATTERN.md:11–19` | PASS |
| "Broad, incl. push/PR/merge" envelope | `COORDINATOR-PATTERN.md:63` | PASS |
| "ownership transfers only at parcel boundaries … 491fb80" | `COORDINATOR-PATTERN.md:73` | PASS |
| "deterministic passes run on the coordinator's machine" | `COORDINATOR-PATTERN.md:79` | PASS |
| FK-P3 contested / FK-P9 "State migrations / storage package exports (serialization owner)" quotes | `fk-p1-p21-dispatch-plan.md` rows `:30`, `:36` | PASS |
| pre-dispatch item 4 "isolated named worktree from a verified base SHA" | `fk-p1-p21-dispatch-plan.md:22` | PASS |
| C13 FK dir listing; C16 no tracked sqlite/db; C21 only `role-authority` | re-run | PASS |
| C12a note "HCS goal dir D21–D25 = 34 lines at measurement time" | re-run on pre-record files = 1+3+7+23 = 34 | PASS |

## Findings

### F1 — BLOCKER — Slice wrote outside the spec's two Allowed Files (`loop-directive.md` state line)
- **Claim quoted (verification record):** "W3 | `…/hierarchical-coordination-sidecars/loop-directive.md` (state line only, §14 area) … **named deviation D-1**" and "Owner direction supersedes the spec's forbidden-writes list for this one named line".
- **Evidence:** `hcs-p0-verification.md:576,589–599`; spec "Forbidden Files and Effects": "Every path outside Allowed Files is a forbidden write. Specifically forbidden: … the goal's … `loop-directive.md`"; spec Security Gate: "any situation where correctness would require an FK or out-of-Allowed-Files write (escalate instead)". `git diff -- …/loop-directive.md` confirms a working-tree edit beyond the pre-update pin `a80f827b…` (delivered `21ea644d…`). The spec's Allowed Files note authorizes a `loop-directive.md` claim/state update only for the 2026-09-26 *shaping* wave; the owner assignment the deviation cites ("Update `loop-directive.md` state line…") is quoted only inside this record and is not carried by any repo artifact.
- **Impact:** the slice's write set is not the spec's Allowed Files; per the AC8 allowed-path audit the deviation is disclosed but not ratified, and the spec required escalation before the write, not a recorded write afterwards.
- **Recommendation:** coordinator disposition closes this in one step — either an exact-path spec amendment ratifying the single state-line write under owner authority (and re-scoping the Forbidden Files entry), or revert W3 and carry "p0_records_produced" only inside the two evidence records. Record the disposition in `hcs-p0-verification.md` §4.

### F2 — MAJOR — Three cited sources are neither pinned in §0 nor covered by any recorded command
- **Claim quoted (map):** "All sources were pinned before reading (digest or commit first, then read)" (§0) and "Acquisition digests for every source are pinned in §0 (C2/C3/C18)" (§7.1).
- **Evidence:** O6 (`map:75`) cites `foreman-ops-console/charter.md:96`; O7 cites `foreman-ops-console/charter.md:55,92`; O8 (`map:77`) cites `plugin-packaging-and-scaffolder/charter.md:98,266` and `foreman-line-boundary-routing/charter.md:67`; SP10/SP11 repeat them. None of the three files appears in the S1–S12 pin table (`map:43–55`), in C18's `sha256sum` list, or in any C-command raw output (C17b's raw output contains none of these lines). The quoted lines themselves are accurate (re-verified: ops-console `:55,92,96`, scaffolder `:98,266`, boundary-routing `:67`) — the evidence-discipline claim, not the content, is unearned.
- **Impact:** AC7 requires source path + locator + acquisition digest + repeatable command per factual claim; three ownership verdicts (O6/O7/O8, SP10/SP11) rest on unpinned, uncaptured reads, and the map's "every source is pinned" statement is false as written.
- **Recommendation:** add the three charters to §0 with SHA-256 pins and one C-command with raw output (e.g. `sha256sum` + `sed -n` of the cited lines), or relabel the affected rows as unverified with the pin gap named.

### F3 — MAJOR — Six citation locators do not resolve at the cited lines in the pinned FK registry
- **Claim quoted (map):** "`fk-p0-…-registry.md:208` (§8: 'FK-P1 Stage A shaped but unimplemented')" (K5, `map:92`); "`fk-p0-…-registry.md:208`" for "R31 accepted 751/751 on 2026-09-07/08" (`map:219`); "D13 destination `fk-p0-…-registry.md:113`" (K13, `map:100`); "`fk-p0-…-registry.md:73` (§3 legacy routing/skill recorders row…)" (O6 `map:75`, SP9 `map:177`); "`fk-p0-…-registry.md:225` (GD-2)" (SP8 `map:176`); "`fk-p0-…-registry.md:23` ('Gate 3 merge \| Human-owned, not delegated')" (`map:267`).
- **Evidence (registry at pinned digest `d628f98e…`, unchanged):** `grep -n` places "FK-P1 Stage A shaped but unimplemented" at `:215`, "run 36 passed 751/751" at `:210`, the D13 enforcement-destination row at `:118` (`:113` is D8's row), the legacy routing/skill recorders row at `:72`, GD-2 at `:229` (`:225` is the table header), and the Gate-3-human-owned row at `:26` (`:23` is the plan-review-triage row). §7.2 row 6's range `:224–229` likewise misses GD-3 at `:230`.
- **Impact:** the map is declared "the single seam reference HCS-P1–HCS-P7 cite"; a consumer following these anchors lands on the wrong decision/authority rows — including the Gate-3 authority citation in the map's own gate table.
- **Recommendation:** correct each locator to the measured lines (`:215`, `:209–210`, `:118`, `:72`, `:229`, `:26`, GD-3 `:230`) and re-run the sweep over all `fk-p0-…-registry.md:<line>` citations.

### F4 — MINOR — O5/SP8 mis-anchor the contested-surfaces seam quote in the FK reconciliation
- **Claim quoted (map):** "`fk-reconciliation-2026-09-26.md:66–68` (§3): 'Seams recorded, not edited: `routing-policy/`, `dispatch/`, `contracts/`, `templates/` remain owned by their active goals…'" (`map:74`, `map:176`).
- **Evidence:** the quoted text is at `fk-reconciliation-2026-09-26.md:79–83` (§3 "Contested surfaces" bullet); `:66–68` is §2 A1-reconciliation text ("superseded-by-ratification… / 4. **Open INF-5 work:** FK-P1 owns…"). Quote itself accurate.
- **Recommendation:** re-anchor to `:79–83`.

### F5 — MINOR — Three COORDINATOR-PATTERN locators drift by two lines
- **Claim quoted (map):** "standing authorizations written into loop directives verbatim (`:53`)" (`map:144`); "every dispatch opens with Step 0 restate-and-stop (`:67`)" and SP4's "'the branch/worktree is named in the directive, never ambient' (`COORDINATOR-PATTERN.md:67`)" (`map:141,172`); "Universal stop conditions + tripwires (`COORDINATOR-PATTERN.md:75`)" (`map:145`).
- **Evidence:** the verbatim-standing-authorizations sentence is at `COORDINATOR-PATTERN.md:55` (`:53` is the Gate-3 table row); the Step-0 / never-ambient dispatch-rules sentence is at `:69` (`:67` is the shaping-agent table row); "Universal stop conditions: … a tripwire fires twice on one parcel" is at `:73` (`:75` is the Gate-1 re-open paragraph). All quoted phrases exist.
- **Recommendation:** re-anchor to `:55`, `:69`, `:73`.

### F6 — MINOR — INF-8 contention claim cites the wrong FK charter paragraph
- **Claim quoted (map):** "FK INF-8 revisits contention (`charter.md:605–607`)" (AC4 contention row, `map:145`).
- **Evidence:** `:605–607` is the recovery-point/recovery-time objectives paragraph; the contention/revisit-trigger sentence ("…sustained queue delay, writer contention… Revisit triggers do not automatically choose Azure, authorize spend, or widen D20.") is at `charter.md:611–614`.
- **Recommendation:** re-anchor to `:611–614`.

### F7 — MINOR — Loop-directive locators resolve only against an unrecoverable pre-update pin
- **Claim quoted (map):** S9 pin "`a80f827b…` (C18, pre-update)" with locators "intake queue (36–50), current authority (52–63), stop conditions (65–67)"; X6 cites "`loop-directive.md:54–56`" and "`:60–63`" (`map:249`); SP6 cites "`loop-directive.md:3,67`"; G1 cites "`loop-directive.md:38–50`".
- **Evidence:** these resolve against the pre-update bytes only. The delivered file (post-W3, `21ea644d…`) grows the `**State:**` block by 3 lines below line 14, so every locator below it shifts: "Gate 2 is not granted." is at live `:59` (cited 54–56), "Gate 2 remains not granted" at live `:65` (cited 60–63), intake queue at live `:41–53` (cited 38–50), stop conditions at live `:68–72`. The pre-update state exists nowhere now: HEAD predates the claim block, and the working tree carries the post-W3 state. `hcs-p0-verification.md:586` records the digest change but not this locator consequence.
- **Impact:** any consumer re-resolving the map's loop-directive anchors against the live tree lands 3 lines off, and the pinned bytes cannot be re-measured at all.
- **Recommendation:** re-anchor all loop-directive citations to post-update lines (or mark each "pre-update `a80f827b…`" explicitly) and note in the verification record that the pre-update bytes are unrecoverable in the shared tree.

### F8 — MINOR — S2's uncommitted-edit description contradicts its own pinned source S3
- **Claim quoted (map):** S2 status "live (carries one uncommitted 2026-09-26 audit edit, `git status` line ` M` — FK reconciliation preamble)" (`map:46`).
- **Evidence:** `git diff -- docs/goals/foreman-kernel/charter.md` shows two distinct uncommitted edits: (i) a `**Status:**` header rewrite referencing the reconciliation record, and (ii) the INF-1 paragraph HAWF-record deletion. The map's own source S3 describes the edit as "(INF-1 paragraph, HAWF record deletion)" (`fk-reconciliation-2026-09-26.md:20–21`) — no "reconciliation preamble" and not "one" edit at pin time.
- **Impact:** the map mischaracterizes working-tree delta on the very file its anchors are measured against (anchors themselves are safe: digest `94d974b8…` matches current bytes).
- **Recommendation:** describe both edits, or quote S3's wording.

### F9 — NIT — Label-exhaustiveness claim overreaches
- **Claim quoted (map):** "Every claim below carries exactly one label: [M] … [D] … [I]" (`map:27`).
- **Evidence:** most map rows carry no label at all — all of §2 (K1–K15), §3 (SA1–SA5), §5 (SP1–SP12), and §6 rows are unlabeled; §4 labels only some rows. §7.1's narrower rule ("every [M] claim names a repeatable command") is met where [M] appears.
- **Recommendation:** either label the remaining rows or restate the header ("claims carry labels where shown; unlabeled rows are measured facts citing a source locator").

### F10 — NIT — "Every active serialization point" claim omits the FK charter §12 list
- **Claim quoted (map):** "Every active serialization point with owner and collision rule." (`map:163`).
- **Evidence:** FK charter §12 (`charter.md:374–397`) names additional active serialization points with parcel owners — plugin manifests, marketplace metadata, root workflow files, shared package manifests, receipt schemas, `SPEC-CONVENTION.md`, barrel exports ("assigned to only one active parcel at a time") — none appears in SP1–SP12 and no exclusion reason is recorded. AC5's own named list is fully covered.
- **Recommendation:** bound the claim to the spec's enumerated list, or add a row/footnote disposing of the §12 items.

### F11 — NIT — O9 mislabels the decision it cites
- **Claim quoted (map):** "FK charter D2 (S2 `charter.md:101`, D1: packaging/scaffolder owns distribution/canon scaffolding, FK owns runtime contracts)" (`map:78`).
- **Evidence:** `charter.md:101` is D1's row (the quoted ownership split is D1's text); D2 is at `:102`. The label "FK charter D2" attached to a D1 locator invites a wrong re-anchor in downstream records.
- **Recommendation:** cite "D1 (`charter.md:101`)" and, if D2 is intended, add `:102` separately.

## Verdict

**REQUEST CHANGES** — 1 blocker, 2 major, 5 minor, 3 nit. AC6 and the stale-assumption re-verification are fully earned (every anchor re-measured correct); AC7's evidence-discipline claims are not ("every source pinned" is false, and the uncommanded citations are precisely the ones with wrong locators); the only out-of-Allowed-Files write (F1) needs a coordinator-side ratification or a revert before the AC8 gate closes. Nothing found reads as authorizing an FK edit, a merge, or the FK-P10 lease decision (mandated focus question 4 passes), and no seam row assumes the R31 package or FK-P10 is merged (focus question 2 passes).

---

# Delta re-review (Review A) — 2026-09-26 (post-rework)

**Trigger:** coordinator DELTA RE-REVIEW request (Main, 2026-09-26) after the P0 records were reworked against F1–F11 and Review B's B-01…B-09.
**Method:** every F1–F11 disposition re-verified at the corrected locators against the live tree (pins re-measured this pass: FK charter `94d974b8…`, registry `d628f98e…`, fk-reconciliation `bd748566…`, COORDINATOR-PATTERN `46e54386…` all unchanged; loop-directive now `f3fbb129…` after the state-block-only rework edit); the three newly pinned charter digests recomputed; the F1 disposition text compared against the coordinator's quoted text; scope re-checked via `git status` / `git diff` and the records' §4 rework write audit.

## Finding-by-finding disposition verification

| ID | Claimed | Re-review verification | Verdict |
|---|---|---|---|
| F1 (blocker) | FIXED (coordinator disposition) | Disposition recorded in the spec's Allowed Files note (`HCS-P0-…-reconnaissance.md:138–152`) and in `hcs-p0-verification.md` §4 (D-1 — RATIFIED block). Operative language ("RATIFIED as an exact-path exception… Ratified scope is EXACTLY the state-line/claim-block maintenance, nothing else… No other out-of-Allowed-Files write is permitted.") is verbatim. Scope: W3 + the rework W5 state-block update are both inside the ratified state-line/claim-block scope (C25 hunk proof, 7↔7 lines); rework write audit W4–W7 exhaustive and consistent — W4 (spec Allowed Files note) is authorized by the disposition's own recording instruction. Independent check: the newly dirty `docs/goals/foreman-ops-console/loop-directive.md` is sibling FOC-wave content (FOC-P0–P4 implementation note), not this slice. **No other out-of-Allowed-Files write found.** Nit F12 below on the "verbatim" claim. | **CLOSED** |
| F2 (major) | FIXED | Map §0 adds S13–S18 with digest pins; the three previously unpinned charters re-measured this pass and matching: `foreman-ops-console/charter.md` `fc24bae4…`, `plugin-packaging-and-scaffolder/charter.md` `81d85418…`, `foreman-line-boundary-routing/charter.md` `b0246068…`. C23a records the pin command with raw output; C23b captures every cited line (ops-console `:55,:92,:96`; scaffolder `:98,:266`; boundary-routing `:22,:23,:67`). §7.1 updated to "(C2/C3/C18/C23)". | **FIXED — verified** |
| F3 (major) | FIXED | Corrected in the map body, not just the log: K5 `registry.md:215` (map:106), K13 `:118` (map:114), O6/SP9 `:72` (map:89,198), SP8 `:229` (map:197), gate table `:26` (map:298), §7.2 GD-3 range `:224–230`. Re-resolved live at the unchanged pin: `:26` Gate-3-human-owned row ✓, `:72` legacy recorders ✓, `:118` D13 ✓, `:210` 751/751 ✓, `:215` FK-P1-shaped ✓, `:229` GD-2 ✓, `:230` GD-3 ✓. No live citation retains `:208`/`:113`/`:73`/`:225`/`:23` (remaining old values occur only in the §9 correction log's "Was" column). | **FIXED — verified** |
| F4 (minor) | FIXED | O5/SP8 re-anchored to `fk-reconciliation:79–83` (quote span `:80–82`); re-read live ✓. Inter-review delta (F4 vs B-04) resolved correctly: the §3 bullet spans `:79–83`, the quoted seam sentence `:80–82`. | **FIXED — verified** |
| F5 (minor) | FIXED | COORDINATOR-PATTERN `:55` (standing authorizations verbatim ✓), `:69` (Step-0 / never-ambient ✓), `:73` (universal stop conditions + tripwires ✓) re-read live at the unchanged pin. | **FIXED — verified** |
| F6 (minor) | FIXED | INF-8 contention now `charter.md:611–614`; re-read live ✓ ("…writer contention… Revisit triggers do not automatically choose Azure…"). | **FIXED — verified** |
| F7 (minor) | FIXED | All loop-directive citations re-anchored to post-update numbering and spot-verified against the current file: `:14` State block ✓, `:41` intake item 1 ✓, `:50–53` triage/gate ✓, `:59` "Gate 2 is not granted." ✓, `:65–66` "Gate 2 remains not granted" ✓, `:70–72` stop conditions ✓. S9 now records both numbering schemes and states the pre-update bytes (`a80f827b…`) are unrecoverable; §4/C25 record the honest limit of the W3 scope proof instead of the digest-only claim. | **FIXED — verified** |
| F8 (minor) | FIXED | Map §0 S2 now names both uncommitted edit sites (Status-header rewrite + INF-1/HAWF deletion), quotes S3's wording, and records "none by HCS" — matching my `git diff` re-measurement. | **FIXED — verified** |
| F9 (nit) | FIXED | Label claim narrowed ("Labels are carried where shown; an unlabeled table row is a measured fact [M] whose source path + locator is cited in the row itself") — map header + §7.1. | **FIXED — verified** |
| F10 (nit) | FIXED | §5 claim bounded ("Every active serialization point **known from the swept record set**", with the prior unbounded wording explicitly retired as [I]) and the FK charter §12 list is now inventoried: SP13 (§12 shared file family), SP14 (§12 parcel-owned points, `charter.md:383–387`), SP15 (shared exports/lockfiles/migrations/manifests), SP16 (ambient user-owned `routing-policy.yaml`). C24 confirms `:380` and `:387`. | **FIXED — verified** |
| F11 (nit) | FIXED | O9 now reads "FK charter **D1** (S2 `charter.md:101` … D2 is at `:102`…)" (map:92) ✓. | **FIXED — verified** |

**Corrected-locator spot sample (≥6 required; 18 re-resolved):** `fk-p0-…-registry.md:26,72,118,210,215,229,230`; `fk-reconciliation-2026-09-26.md:79–83`; `COORDINATOR-PATTERN.md:55,69,73`; `foreman-kernel/charter.md:101,387,611`; `foreman-line-boundary-routing/charter.md:22–23`; `loop-directive.md:14,41,50,59,65,70`. **Three newly pinned charter digests (F2) re-measured and matching** (`fc24bae4…`, `81d85418…`, `b0246068…`).

## New finding (delta pass)

### F12 — NIT — "recorded verbatim" claim has two insertions vs the coordinator's quoted text
- **Claim quoted (verification §4 / spec note):** "F1 disposition (recorded verbatim on coordinator direction; identical text is in the spec's Allowed Files note)".
- **Evidence:** the spec copy and the verification copy are identical to each other and carry the coordinator's operative sentences verbatim, but both add two fragments absent from the coordinator's quoted text: the parenthetical "('Update loop-directive.md state line')" inside basis (a), and the sentence "Record this disposition in the spec's Allowed Files note and in the verification record §4." between "…nothing else." and "No other out-of-Allowed-Files write is permitted."
- **Impact:** none on scope — the additions name the directive text and the recording instruction the disposition itself mandates; the dispositive limits ("EXACTLY the state-line/claim-block maintenance, nothing else", "No other out-of-Allowed-Files write is permitted") are verbatim in all three copies.
- **Recommendation:** coordinator confirms the recorded superset is his text (or trim to the exact quote); optionally soften "verbatim" to "verbatim plus the recording instruction".

## Delta verdict

**APPROVE WITH NITS** — F1–F11 all correctly dispositioned and re-verified at corrected locators; F1 is closed by the recorded coordinator disposition and no other out-of-Allowed-Files write exists; 1 nit (F12, non-substantive). Zero unfixed findings.
