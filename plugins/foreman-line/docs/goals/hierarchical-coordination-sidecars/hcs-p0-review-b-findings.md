# HCS-P0 — Review B findings (independent adversarial review) — 2026-09-26

**Reviewer:** `HCS-P0-AR-B` (independent slice; did not read `hcs-p0-review-a-findings.md`)
**Records reviewed:** `hcs-p0-authority-and-collision-map.md`, `hcs-p0-verification.md`
**Contract:** `plugins/foreman-line/docs/specs/active/HCS-P0-authority-and-collision-reconnaissance.md`
**Focus:** evidence discipline and collision-inventory claims; independent
serialization-point derivation; A3 re-anchor verification; Allowed-Files vs git status.
**Method:** every cited locator re-opened and re-measured against the live tree on
2026-09-26; all source digests re-computed and matched to the records' C2/C3/C18 pins
(FK charter `94d974b8…`, A3 `a5d9196c…`, goal charter `5748c70d…`, loop-directive post
`21ea644d…`, fk-reconciliation `bd748566…`, registry `d628f98e…`, dispatch plan
`13d8a20a…`, goal-status `ed17361c…`, COORDINATOR-PATTERN `46e54386…`) — so every
locator discrepancy below is a defect in the records, not concurrent drift.

---

## Independent serialization-point diff (AC5 completeness)

Derived from the live charters named in the review mandate, then diffed against map §5
(SP1–SP12).

| # | Serialization point derived from live source | Source (path:line) | Collision rule stated in source | In map §5? |
|---|---|---|---|---|
| D1 | Plugin manifests, marketplace metadata, root workflow files, shared package manifests, receipt schemas, `SPEC-CONVENTION.md`, barrel exports | `docs/goals/foreman-kernel/charter.md:380-382` (§12) | "are serialization points and are assigned to only one active parcel at a time" | **NO — missing** (B-02) |
| D2 | Parcel-owned serialization points: FK-P6 read-only server package manifest; FK-P7 stateless Docker/launcher files; FK-P9 state migrations/storage exports; FK-P14 stateful Docker/launcher composition; FK-P16 Claude hook registration + Claude manifest; FK-P18 CI files; FK-P20 Codex manifest | `foreman-kernel/charter.md:383-386` (§12); `fk-p1-p21-dispatch-plan.md:33-47` (rows tagged "(serialization owner)") | one named owner per point; "Other parcels emit fragments/fixtures and do not edit those serialization points" | **NO — missing** (B-02) |
| D3 | Shared exports, lockfiles, migrations, manifests (parallel-lane constraint) | `foreman-kernel/charter.md:710-717` (§15.4) | "shared exports, lockfiles, migrations, and manifests remain serialized under section 12" | **NO — missing** (B-02) |
| D4 | `routing-policy/**` + `dispatch/**` write windows | `docs/goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md:1-5,27-70` (BINDING, 2026-09-26) | one writer at a time (Window P → Window R), "No co-ownership at any time" (:58), second writer rebases + re-runs the full `routing-policy` suite (:65) | **PARTIAL — SP8/SP9 carry only "observe and record, never co-edit"; the binding order is uncited** (B-03) |
| D5 | Shared `routing-policy/tests/` directory (RCM-P1 footprint) | `rcm-sequencing-decision-2026-09-26.md:96-103` | collides only at directory level, "in file-disjoint subdirectories"; frozen-branch merge sequenced via §2.5 | **NO — missing** (B-03) |
| D6 | `host-owner-export/` digest-pinned evidence (3 files) | `rcm-sequencing-decision-2026-09-26.md:21-24` | read-only for PMC; regeneration invalidates PMC-P0 evidence and forces re-pinning | **NO — missing** (B-03) |
| D7 | `docs/goals/INDEX.md` (goal queue/ownership index) | `docs/goals/routing-currency-and-merit/charter.md:50-54` | "a conflict between index state and goal-local ownership is a **stop-and-reconcile condition**" | **NO — missing** (B-07; SP7 covers only `docs/specs/`) |
| D8 | `foreman-config` configuration document shape | `docs/goals/foreman-line-boundary-routing/charter.md:23` (D3) | `foreman-config` owns the shape; linting/dispatch/registration all consume it; invalid declarations refuse | **NO — missing** (B-07) |
| D9 | Role/task-envelope contract parity family (TS sources, JSON Schemas, generated artifacts, fixtures) | `foreman-line-boundary-routing/charter.md:24` (D4) | "must remain in parity" — an edit to any member constrains all | **NO — missing** (B-07) |
| D10 | Ambient dirty checkout `routing-policy/routing-policy.yaml` (user-owned) | `foreman-kernel/charter.md:376-378` (§12) | "it is user-owned and excluded from this goal unless the developer separately authorizes its incorporation" | **NO — missing** (folded into B-02) |
| D11 | Shared-file discipline rule "If both goals claim the same file, both stop until sequenced" | `routing-currency-and-merit/charter.md:58-59` | both stop until sequenced | **NO** (folded into B-03) |
| — | SQLite ledger / Git canon / projections / worktree identity / goal worktree creation / loop-directive state / specs dir / `routing-policy/` / `dispatch/` / `contracts/` / `templates/` / `foreman-kernel/` | — | — | YES (SP1–SP12) |

Diff result: **10 derived serialization points/rules absent from the inventory**, and 2
present rows (SP8/SP9) whose collision rule is weaker than the live binding record's.

## Anchor verifications

### A3 re-anchoring claims (AC6) — all verified, none fabricated

| Map row | Claim | Independent measurement | Result |
|---|---|---|---|
| A3.1 | `## 4. Locked decisions` `charter.md:88`; rows `:101-120`; last row D20 at `:120`; no D21 row; no live "Append after D21" counterpart | `grep -nE '^\| D[0-9]+ '` → exactly D1–D20 at 101–120; D20 text at 120 matches quoted row; C12a sweep re-run: only recovered-A1 D21 refs at `charter.md:521`, `fk-reconciliation…:47,57` (both re-opened and confirmed) | **VERIFIED** |
| A3.2/A3.3 | append-after-D23/D24 follow the same §4 table | same measurement | **VERIFIED** |
| A3.4 | `## 5.` `:122`; table `:124-133`; `### Common decision envelope` at `:135` | headings re-measured at 122 and 135 | **VERIFIED** |
| A3.5 | `## 7.` `:244`; last bullet `:257` ("deleting the lessons/provenance record…"); closing paragraph `:259` ("The receipt-custody and stage-specific append service…") | `sed -n '244,261p'` re-read | **VERIFIED** |
| A3.6 | `## 11.` `:346`; queue-empty item `:372` | `sed -n '346,373p'` re-read | **VERIFIED** |
| A3.7 | `## 13.` `:398`; items `:402-415`; item 7 `:411`; item 8 `:412`–item 11 `:415` | `sed` re-read | **VERIFIED** |
| A3.8 | no `§4.1` heading anywhere; live ledger `## 17.` `:781`; 5 dated rows `:785-789`, none for A3 | `grep -c '4\.1'` → 0; ledger rows re-read (2026-08-31 ×2, 2026-09-01, 2026-09-07 ×2) | **VERIFIED** |
| X2/X3/X4/X5 | A3's own stale anchors ("through ratified D21" `:26`; "Append after D21" `:54`; "§4.1 Ratification ledger" `:209`; 435-line `c1935937…` stage0-worktree target `:12-13,24-25`; `loop-directive.md` claim `:28`) quoted as stale | each re-read in `source-proposed-amendment-A3.md`; quotes exact | **VERIFIED** |

The A3 landing-target table (map §6) is the strongest part of the record: every row
resolves at its measured locator and the stale A3 anchors appear only as recorded
contradictions.

### Other anchors spot-verified correct

FK charter D2/D9/D14 (`:102,:109,:114`), stop item (`:357`), §14/INF locators
(`:425,:435,:596`); registry §1–§4c/§7/§8/§9 headings (`:18,:36,:57,:102,:127,:187,
:201,:224`), class rows A–J (`:46-55`), op rows (`:63,:66,:67,:68,:71`); fk-reconciliation
rows 1/3/16 (`:28,:30,:43`) and `:47,:57`; goal-status `:12,:66`; ops-console charter
`:55,:92,:96`; scaffolder charter `:98,:266`; boundary-routing `:67`; dispatch-plan FK
rows and pre-dispatch item 4 (`:22`); COORDINATOR-PATTERN `:7,:11-19,:43,:63,:73,:79`;
loop-directive `:3,:5-14`; C6 (D1–D20), C8, C9, C10, C11 offsets all reproduce.

---

## Findings

### B-01 — MAJOR — `contracts/` owner negative is asserted [M] but contradicted by its own raw output
**Claim (map:76, O7 [M]; map:178, SP10; verification:445):** "No live record names an
owner-of-record for `contracts/` (search command C17b, raw output in verification record)"
/ "**no owner-of-record named for `plugins/foreman-line/contracts/`** in the swept goal docs".
**Evidence:** the C17b raw output printed in the verification record itself contains three
owner-claim rows: `docs/goals/routing-currency-and-merit/charter.md:56`
("`governed-model-fleet` owns receipt, envelope, and settlement contracts (P0/P1 landed)"
— re-read at :56) and `docs/goals/hybrid-routing-optimization/hro-p0-integration-contract.md:68,104`
("**Settlement — owner: EXTERNAL (governed model fleet, Keon initiative)** | \"receipt,
envelope, and settlement ownership\"" / "Cross-goal external owner: **governed-model-fleet**
(Keon repos) owns receipt/envelope/settlement contracts"). The swept package
`plugins/foreman-line/contracts/src/` contains `envelope.ts` and the stage receipt contracts
(`stages/a-intake.ts` … `f-closure.ts`), i.e. the named contract families. The record neither
reconciles nor excludes these rows before asserting the negative. The sweep covered only
`docs/goals` with one keyword pattern — a bounded grep cannot establish "no live record".
**Recommendation:** restate O7/SP10 as an inference: the C17b output names
`governed-model-fleet` (external) as owner of receipt/envelope/settlement contracts; state
explicitly whether that claim covers `plugins/foreman-line/contracts/`, and record the
reconciliation (or keep `escalated-unresolved` with the candidate owner named in the Owner
cell).

### B-02 — MAJOR — AC5 inventory omits the FK charter's own named serialization points
**Claim (map:161-162, §5):** "Every active serialization point with owner and collision
rule" — SP1–SP12.
**Evidence:** `docs/goals/foreman-kernel/charter.md:380-382` (§12): "Plugin manifests,
marketplace metadata, root workflow files, shared package manifests, receipt schemas,
`SPEC-CONVENTION.md`, and barrel exports **are serialization points** and are assigned to
only one active parcel at a time"; `:383-386` names the per-parcel owners (FK-P6 server
package manifest, FK-P7 Docker/launcher, FK-P9 state migrations/storage exports, FK-P14
stateful composition, FK-P16 Claude hook registration + manifest, FK-P18 CI files, FK-P20
Codex manifest — each row tagged "(serialization owner)" in
`fk-p1-p21-dispatch-plan.md:33-47`, which map K7 itself quotes); `:710-717` (§15.4):
"shared exports, lockfiles, migrations, and manifests remain serialized under section 12";
`:376-378`: the ambient `routing-policy.yaml` is "user-owned and excluded". None of these
appear in SP1–SP12 or anywhere else in the map (re-grepped: no "manifest"/"barrel"/
"marketplace"/"15.4" hits outside K14's unrelated "evidence manifest"). The spec's AC5
requires "Every active serialization point … citing the FK rule where one exists" — these
are exactly the rows with an FK rule.
**Recommendation:** add rows for the §12 file family (one row per file family is enough),
the §12/§15.4 parcel-owned points (or one consolidated row naming the seven owners), and
the §15.4 shared-exports/lockfiles/migrations/manifests rule; cite `charter.md:374-397,
710-717`.

### B-03 — MAJOR — SP8/SP9 miss the live BINDING serialization order on `routing-policy/**`/`dispatch/**`
**Claim (map:176, SP8):** collision rule "Observe and record, never co-edit"; (map:177,
SP9) "Ownership negotiated before any FK-P3 dispatch; no co-edit" — **escalate**.
**Evidence:** `docs/goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md`
(dated 2026-09-26, "Status: **BINDING serialization order**", coordinator decision under
owner blanket authority) fixes the operative collision rule for exactly these surfaces:
one writer at a time — Window P (PMC-P1 then PMC-P2) first, Window R (RCM-P2+) second
(:27-45); "**No co-ownership at any time**" (:58-61); second writer "rebases onto the first
and re-runs the full `routing-policy` test suite … before its own Gate 3" (:65-66); shared
`routing-policy/tests/` collides only "in file-disjoint subdirectories" (:96-103); RCM's
frozen additive-only RCM-P1 merge is sequenced around it (:100-107);
`host-owner-export/` evidence is digest-frozen (:21-24). This record is absent from the
map's S1–S12 pin table and is never cited anywhere in either record (re-grepped), despite
being dated the same day and governing two of the map's own SP rows. `routing-currency-and-merit/charter.md:58-59`
states the underlying rule ("If both goals claim the same file, both stop until sequenced")
— also uncited.
**Recommendation:** pin and cite the sequencing decision; rewrite SP8/SP9's collision-rule
cells to the binding one-writer windows + second-writer rebase rule; add the
`routing-policy/tests/` file-disjoint row and the `host-owner-export/` digest-freeze note.

### B-04 — MAJOR — nine citation locators land on the wrong lines (content real, anchors wrong)
**Claim:** map rows present these as measured `path:line` locators (map §7.1: every [M]
claim names "source path + locator").
**Evidence (all sources re-hashed and digest-matched to the C18 pins, so the anchors were
already wrong when written):**
1. map:267 (§8) — `fk-p0-…-registry.md:23` for "Gate 3 merge | Human-owned, not delegated" → quote is at **:26** (:23 is the plan-review-triage row).
2. map:218 (§7.1) and map:92 (K5) — `:208` used for "R31 accepted 751/751" (actually **:210**) and for "FK-P1 Stage A shaped but unimplemented" (actually **:215**; :208 reads "686/686, two fresh final APPROVE reviews.").
3. map:100 (K13) — `:113` for the "D13 destination" row → D13 is at **:118** (:113 is the D8 row).
4. map:75 (O6) and map:177 (SP9) — `:73` for the "Legacy routing/skill recorders … FK-P3 (seam: `dispatch/`, `routing-policy/` contested)" row → row is at **:72**.
5. map:74 (O5) and map:176 (SP8) — `fk-reconciliation-2026-09-26.md:66–68` for "Seams recorded, not edited: `routing-policy/`, `dispatch/`, `contracts/`, `templates/` remain owned by their active goals…" → the quoted paragraph is at **:80-82** (§3 heading at :75); :66-68 contain the "superseded-by-ratification" and "Open INF-5 work" text.
6. map:144 (§4 Scope ceiling) — `COORDINATOR-PATTERN.md:53` for "standing authorizations written into loop directives verbatim" → sentence is at **:55** (:53 is the Gate-3 merge table row).
7. map:141 (§4), map:172 (SP4), map:173 (SP5) — `:67` for "every dispatch opens with Step 0 restate-and-stop" / "the branch/worktree is named in the directive, never ambient" → text is at **:69** (:67 is the Shaping-agent row).
8. map:145 (§4) — `:75` for "Universal stop conditions + tripwires" → text is at **:73** (:75 is the Gate-1-reopen paragraph).
Each quote's content exists, so conclusions survive, but the map is contractually a
"single seam reference" whose locators consumers re-run; nine misses across three files is
systematic mis-anchoring.
**Recommendation:** re-measure every `path:line` in map §1–§8 against the pinned bytes and
correct the nine locators above (and re-sweep the rest the same way).

### B-05 — MINOR — loop-directive locators are stale after the builder's own W3 edit
**Claim (map:52 S9 pin "intake queue (36–50), current authority (52–63), stop conditions
(65–67)"; map:139 "loop-directive.md:38–50 intake queue items 1–7"; map:249 X6
":54–56"/":60–63"; map:173 SP6 ":3,67").**
**Evidence:** against the delivered file (post-update digest `21ea644d…`, which the
verification record §2 itself pins): intake items 1–7 are at **41–53**, "Gate 2 is not
granted." at **59**, "Gate 2 remains not granted" at **65**, stop conditions at **68–72**.
Reconstruction via `git diff` shows W3 grew the `**State:**` block (14–20) by 3 lines —
the cited numbers fit the pre-update numbering (a80f827b…), which the map pins in C18 but
never re-measured after its own companion edit. Consumers citing `loop-directive.md:38–50`
today land 3 lines off.
**Recommendation:** re-measure the loop-directive locators against `21ea644d…` in both
records (or state the pin each locator was measured against inline).

### B-06 — MINOR — "Every claim below carries exactly one label" is false for most of the map
**Claim (map:27-31):** "**Label vocabulary (AC7).** Every claim below carries exactly one
label: [M] … [D] … [I] …".
**Evidence:** a full scan of the map shows `[M]/[D]/[I]` tags only in §0/§1, four §4 cells,
and §7.1/X1/X6. The entire K1–K15 (map:83-101), SA1–SA5 (map:119-128), SP1–SP12
(map:167-180), A3.1–A3.8 (map:192-205), §7.2 and §7.4 tables carry **no label at all**.
AC7 requires "Dated observations, measured facts, and inferences are labeled distinctly" —
for an unlabeled row a consumer cannot tell which class it is, and the record's own
categorical claim is contradicted by its body.
**Recommendation:** either tag every row (most are [M]) or narrow the map:27 claim to the
rows actually labeled and state the default class for evidence-cited rows.

### B-07 — MINOR — sibling-charter serialization points absent from AC5
**Claim (map:161-162, §5 "Every active serialization point").**
**Evidence:** `docs/goals/routing-currency-and-merit/charter.md:50-54`: `docs/goals/INDEX.md`
state vs goal-local ownership "is a **stop-and-reconcile condition**" (a serialized shared
surface — and one the spec's Forbidden Files singles out); `docs/goals/foreman-line-boundary-routing/charter.md:23`
(D3): "`foreman-config` owns the configuration document shape, validation, and capability
vocabulary" consumed by linting, dispatch, and registration (the spec's Forbidden Files
also list `foreman-config/`); `:24` (D4): the role/envelope contract family (TS sources,
JSON Schemas, generated artifacts, fixtures) "must remain in parity". None appear in
SP1–SP12.
**Recommendation:** add a `docs/goals/INDEX.md` row (stop-and-reconcile on conflict), a
`foreman-config` row (single shape owner, three consuming packages), and note the D4
parity family as a cross-file edit constraint under SP10/SP11.

### B-08 — NIT — C17a raw output not recorded
**Claim (verification:418):** C17a is logged with "(file list; COORDINATOR-PATTERN.md among
20 hits)" in place of its output.
**Evidence:** AC8/verification-record §3 promise "exact commands, raw output, exit codes"
for every command; C17a's `grep … -l` file list is never printed, so the "20 hits" figure
is unrepeatable from the record. (Related: the C12a annotation's "34 lines" figure is
likewise uncommanded — this reviewer re-derived it as the four prior records' D21–D25
occurrences (1+3+7+23), so the number checks out once self-referential rows are excluded.)
**Recommendation:** paste C17a's raw listing (or drop the unprinted claim).

### B-09 — NIT — D-1 cites a digest change as verification of a line-scope claim
**Claim (verification, §4/D-1):** "W3 changed only the `**State:**` line, verified by the
digest change `a80f827b…` → `21ea644d…`".
**Evidence:** a digest change proves bytes differ, not which lines; "No other line of
`loop-directive.md` changed" is asserted, not demonstrated by the cited evidence. (The
claim itself survives `git diff` + the pre-update anchor reconstruction — see B-05 — so
this is an evidence-quality defect, not a false claim.)
**Recommendation:** cite the state-line-only diff hunk instead of the digest as the scope
proof.

---

## Allowed-Files vs git status (spec frontmatter check)

- Spec Allowed Files = exactly the two records; spec Forbidden Files explicitly lists the
  goal's `loop-directive.md`.
- Live `git status` in `docs/goals/hierarchical-coordination-sidecars/`: ` M loop-directive.md`,
  `?? hcs-p0-authority-and-collision-map.md`, `?? hcs-p0-verification.md`, plus the two
  shaping-wave records (`?? gate-1-ratification-2026-09-26.md`, `?? hcs-stage-zero-2026-09-26.md`)
  — and nothing else. The records' W1–W3 audit matches this exactly; no code file touched;
  `charter.md` and `source-proposed-amendment-A3.md` unmodified (digests match pins).
- W3 (`loop-directive.md`) is outside Allowed Files but disclosed as named deviation D-1
  with an owner-direction authority claim and corroborated by the spec's own Allowed Files
  note that the wave authorized "the `loop-directive.md` claim/state update". Deliberate
  and disclosed — not raised as a violation; only the evidence-quality nit B-09 applies.
- **Result: no unearned Allowed-Files claim found.**

---

## Verdict

**REQUEST CHANGES** — 0 blocker, 4 major (B-01…B-04), 3 minor (B-05…B-07), 2 nit (B-08, B-09).

The AC6 landing-target table and the Stage Zero §3.3 re-verification are sound and fully
reproduce; the required changes are (1) reconcile or re-label the `contracts/` ownership
negative (B-01), (2) complete the AC5 inventory from FK charter §12/§15.4 and the binding
RCM/PMC sequencing record (B-02, B-03), and (3) re-measure the nine wrong `path:line`
locators (B-04). None of the findings weaken the A3 re-anchoring or authorize any FK edit.

---

# Delta re-review — 2026-09-26 (HCS-P0-AR-B, post-rework)

**Scope:** reworked `hcs-p0-authority-and-collision-map.md` (346 lines, `f3c6bf60…`) and
`hcs-p0-verification.md` (991 lines, `0d3ed551…`) after `HcsP0Rework` dispositioned
B-01–B-09 (and Review A's F1–F11). Method: every disposition re-opened at the cited
locators; one serialization-point family independently re-derived from the live charters;
19 corrected locators spot-verified against live bytes (FK charter still `94d974b8…`;
all C18/C23 pins re-matched).

## 1. Disposition verification — B-01 … B-09

| ID | Claimed | Re-verified | Verdict |
|---|---|---|---|
| B-01 | FIXED | O7 (map:90) and SP10 (map:199) now name the candidate owner `governed-model-fleet` (external) with the exact owner-claim rows (`routing-currency-and-merit/charter.md:56`, `hro-p0-integration-contract.md:68,104` — both re-opened and exact), cite C26's package-family listing (`contracts/src/envelope.ts`, `stages/a-intake.ts`…`f-closure.ts`), state the coverage question is unanswerable [I], and **withdraw** the prior negative as an over-claim [I]. Verification C17b conclusion (verification:484–495) withdraws the old claim in place. This is a reconciled named-candidate statement, not an over-claim. | **CORRECTLY DISPOSITIONED** |
| B-02 | FIXED | SP13 (`charter.md:380–382` file family), SP14 (`:383–387` parcel-owned points + "Other parcels emit fragments/fixtures"), SP15 (`:710–717` §15.4 shared exports/lockfiles/migrations/manifests + reconcile-before-dispatch), SP16 (`:376–378` ambient user-owned `routing-policy.yaml`). All four spans re-opened and exact — including their correction of my own `:383–386` → `:383–387` (line 387 carries the fragments/fixtures rule; their fix is right). | **CORRECTLY DISPOSITIONED** |
| B-03 | FIXED | SP8 (map:197) / SP9 (map:198) now carry the S16 binding order with measured spans (`:40–47`, `:48–53`, `:54–57`, `:58–61`, `:62–64`, `:85–90`) — `:58–61` and `:85–90` re-opened and exact; SP17 (`routing-policy/tests/` file-disjoint, S16 `:100–102,104–107`) and SP18 (`host-owner-export/` digest freeze, S16 `:33–36`) added; the "both stop until sequenced" rule is quoted via S16 `:58–61`; SP9's self-bounding note ("no literal 'single-writer slot' phrase exists in the tree") is honest. RCM loop-directive corroboration (`routing-currency-and-merit/loop-directive.md:34–42`) re-opened and exact. | **CORRECTLY DISPOSITIONED** |
| B-04 | FIXED | Map §9 rows 1–12 correct all nine locators. Independently spot-verified at live bytes: registry `:26` (Gate-3 row ✓), `:72` (recorders row ✓), `:118` (D13 row ✓), `:209–210` (R31 accepted / 751-751 ✓), `:215` ("FK-P1 Stage A shaped but unimplemented" ✓), `:229` (GD-2 ✓); `fk-reconciliation…:79–83` bullet with quote at `:80–82` ✓; `COORDINATOR-PATTERN.md:55/:69/:73` ✓ (re-matched earlier this session at exact text); boundary-routing `:22/:23` ✓ (their correction of my B-07 `:23`/`:24` is right — D3 is at `:22`, D4 at `:23`; my finding's own citations were off by one). C24's awk sample is real raw output consistent with every manual check. | **CORRECTLY DISPOSITIONED** |
| B-05 | FIXED | Map §9 rows 13–21 re-anchor the loop-directive family to post-update numbering (`:41–53`, `:14–20`, `:50–53`, `:59`, `:65–66`, `:5–20`, `:3,11–12,70–72`, `:70–72`, S9 pin 41–53/55–66/68–72) — every one matches my independently measured lines from the pre-rework review. | **CORRECTLY DISPOSITIONED** |
| B-06 | FIXED | Map:31–34 replaces the false universal claim with "Labels are carried where shown; an unlabeled table row is a measured fact [M] whose source path + locator is cited in the row itself"; the prior over-reach is acknowledged in place. | **CORRECTLY DISPOSITIONED** |
| B-07 | FIXED | SP19 (`docs/goals/INDEX.md` stop-and-reconcile, `routing-currency-and-merit/charter.md:49–54`, quote `:51–53` — re-opened ✓), SP20 (`foreman-config` shape owner, D3 `:22`), SP21 (D4 parity family `:23`) added with fail-closed cells. | **CORRECTLY DISPOSITIONED** |
| B-08 | FIXED | C17a's raw file listing is now pasted (23 files, honest "20 hits … superseded" note); the C12a "34 lines" figure is command-backed with the 1+3+7+23 derivation (which matches my own re-count). | **CORRECTLY DISPOSITIONED** |
| B-09 | FIXED | Scope proof moved from digest to hunk: C25 records the state-block-only diff (7↔7) for the rework edit, and the W3 claim now rests on my B-05 reconstruction + C24 with the digest recorded "as byte evidence, no longer as the scope proof" — exactly the requested reframe; the unrecoverable pre-update bytes are stated honestly. | **CORRECTLY DISPOSITIONED** |

Result: **9 of 9 correctly dispositioned; none disputed; none regressed.** The rework also
corrected two errors in my own review (B-07's D3/D4 `:23`/`:24` → `:22`/`:23`; B-02's
`:383–386` → `:383–387`) — both re-verified as correct corrections.

## 2. Independent serialization-point family re-derivation (mandate item 2)

Family chosen: **FK charter §12 + §15.4** (re-derived fresh from live
`foreman-kernel/charter.md:374–390, 710–717`, without consulting the map's rows first):

| Element (live text) | Locator | Covered by |
|---|---|---|
| Ambient `routing-policy/routing-policy.yaml` is user-owned and excluded unless the developer authorizes incorporation | `:376–378` | **SP16** ✓ (owner, rule, fail-closed `refuse`) |
| "All goal work uses isolated worktrees created from a verified base" | `:379` | **SP5** ✓ |
| "Plugin manifests, marketplace metadata, root workflow files, shared package manifests, receipt schemas, `SPEC-CONVENTION.md`, and barrel exports are serialization points and are assigned to only one active parcel at a time" | `:380–382` | **SP13** ✓ — all seven file families carried verbatim |
| FK-P6/P7/P9/P14/P16/P18/P20 parcel-owned points + "Other parcels emit fragments/fixtures and do not edit those serialization points" | `:383–387` | **SP14** ✓ — all seven owners + the fragments/fixtures rule |
| "shared exports, lockfiles, migrations, and manifests remain serialized under section 12"; "Reconcile the exact file sets before dispatch" | `:712–717` | **SP15** ✓ — both the four classes and the reconcile rule |
| "Before any manifest or packaging edit, the coordinator reconciles that goal's live status and ownership" | `:388–389` | not carried as its own rule (adjacent to SP13/SP11) — remark only, below |

**Family coverage confirmed:** every named serialization point of the FK §12/§15.4 family
now has an AC5 row with owner, collision rule, and fail-closed behavior. The only uncarried
element is the `:388–389` packaging-edit reconciliation precondition (a sub-rule of the
SP13/SP11 surfaces, not a distinct serialization point) — recorded here as a remark, not a
finding.

## 3. Corrected-locator spot checks (mandate item 3)

19 corrected locators re-opened at live bytes; all resolve at the corrected line with the
quoted content: registry `:26`, `:72`, `:118`, `:209–210`, `:215`, `:229`; fk-reconciliation
`:79–83`/`:80–82`; COORDINATOR-PATTERN `:55`, `:69`, `:73`; boundary-routing `:22`, `:23`;
FK charter `:376–378`, `:380–382`, `:383–387`, `:611–614`, `:710–717`; loop-directive
`:41–53`, `:59`, `:65–66`, `:70–72`; rcm-sequencing `:58–61`, `:85–90` (≥5 required; 24
checks performed across the family). No mis-anchored correction found.

## 4. New nit (rework-introduced)

### RB-01 — NIT — `items-1-2-status-2026-09-26.md` cited in SP9 but not pinned
**Claim (map:31–32, §7.1):** "Acquisition digests for every source are pinned in §0
(C2/C3/C18/C23)"; (verification:968, F2 row) "map §7.1 'every source pinned' now true as
written".
**Evidence:** SP9 (map:198) cites `foreman-line-boundary-routing/items-1-2-status-2026-09-26.md:244–246`
for the boundary item-4 dispatch-path slot. That file appears nowhere in map §0 (S1–S18),
is not hashed in C23a (which pins seven files, incl. the RCM loop-directive), and its cited
lines are not captured in C23b. Lesser variant: the RCM loop-directive
(`routing-currency-and-merit/loop-directive.md`) is digest-pinned only inside C23a's raw
output (`7b97a6df…`) and referenced "via S16's corroborating note" rather than as a §0
S-row, so "pinned in §0" is imprecise for it too. The F2-class slip the rework closed is
therefore reintroduced for one (arguably two) cited source(s).
**Recommendation:** add an S-row (or a §0 note) for `items-1-2-status-2026-09-26.md` with
its digest + a C23b-style captured line, and carry the RCM loop-directive digest into the
§0 table.

## 5. Fresh verdict (delta re-review, 2026-09-26)

**APPROVE WITH NITS** — 0 blocker, 0 major, 0 minor, 1 nit (RB-01). All nine B findings are
correctly dispositioned with re-verified evidence; the independent FK §12/§15.4 family
re-derivation confirms full AC5 coverage (SP13–SP16 + SP5/SP11); 24 corrected-locator spot
checks all resolve. No unfixed finding remains; RB-01 is a pin-table housekeeping nit.
