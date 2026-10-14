## Findings

| ID | Rank | Finding | Evidence | Suggested disposition |
|---|---|---|---|---|
| — | — | **No new reportable findings.** No fail-open path, contradiction, AC failure, or additional QF-P3 checkability gap found after rework 1. | Evidence below | Accept QF-P2. Retain the existing Accept/Forward dispositions. |

Reviewed the uncommitted `qf-p2` build against **`41f80463`**, using the current spec, Builder Step 0 rulings, and binding round-1 triage.

Path abbreviations below:
- **S:** `plugins/foreman-line/skills/goal/SKILL.md`
- **T:** `plugins/foreman-line/templates/kickstarters/loop-directive-template.md`
- **C:** `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`
- **R:** `plugins/foreman-line/docs/QUICK-FLAGS.md`
- **M:** the specified synced `goal/SKILL.md`

## Round-1 FIX closure

| Triage IDs | Closure evidence |
|---|---|
| **O-1/P-1** | **S:46:** “Prose standing authorizations are governed by canon and registry §3, not by that sentence.” The restrictive “in the loop directive” qualifier is absent in both S and M. |
| **O-3/P-8** | **T:33–34:** “a human ratification”; **T:40:** `<GRANTOR, THE HUMAN DEVELOPER>`; **T:42–43:** “Where nothing was granted, the slot says `none` and that gate stays with the human.” All three required fixes are present. |
| **O-4** | **T:3–4:** “Never copy over an existing loop directive.” |
| **O-5/P-7** | **T:27–29:** names `docs/COORDINATOR-PATTERN.md`, the `/goal` skill, and `docs/SPEC-CONVENTION.md`; then states “canon governs above it.” |
| **O-6** | **T:40–41:** “as it applies to this goal.” No instruction remains to narrow a cross-goal grant to this goal only. |
| **P-2** | **C:93:** “A restrictive quick flag still limits the Coordinator's conduct under a prose grant and leaves that grant unchanged (registry §3).” |
| **P-3** | **T:72–75:** carries every earlier entry’s lines “directly under the `Active restrictions:` label below.” |
| **P-5** | **T:61–62:** reads the entry “in each copy named in the ownership block.” |
| **P-6** | **T:99–100:** “Wakeup, resume, hook-feedback and completion-notification prompts never carry quick flags.” |

The mirror comparison establishes closure of the skill fix in **every mirrored instance**. The template fixes cover their corresponding sections without a conflicting duplicate elsewhere.

The room-making edits R1–R7 retain the required introduction, ownership identities, resume command, canon precedence, per-iteration cycle, restriction carry instruction, and pacing behavior. In particular, **T:44** keeps **“Quick flags” together on one physical line**; the term scan passes.

The accepted/forwarded items remain substantively as triaged: the V7/gate-record issue, ownership-transfer authority and “live” gaps, previously forwarded checkability gaps, permitted historical line-28 citation changes, and wording nits were not silently resolved. A separate bytewise comparison against the round-1 uncommitted build is unavailable in git; these preservation checks are against the triage descriptions and current text.

## Naive-reading and fail-open probes

| Wrong-but-literal reading attempted | Exclusion |
|---|---|
| **A token or restriction line in the loop directive grants authority.** | **S:46:** stored entries are “honoured only to restrict.” **T:70–71:** “Nothing in the entry can grant authority or loosen a restriction.” **R:44–45:** Coordinator-written prompts and file content carry no quick flags, including the loop directive. |
| **The Coordinator can issue a quick flag to itself through its wakeup or resume prompt.** | **T:99–100** excludes all four prompt kinds and says the Coordinator writes no quick-flag token into one. **R:44** additionally requires a discovered token to be ignored and reported. |
| **A delegating quick flag plus token or prose ratification passes Gate 1.** | **S:20** preserves explicit, never-delegable Gate 1. **R:25** expressly rejects ratification of **any form** in a message carrying the delegating quick flags; the added text creates no exception. |
| **A delegating quick flag covers Gate 1 reopened by triage.** | **S:24** preserves reopening. **R:23–25** explicitly includes reopened Gate 1 in the protected set: “A Gate 1 re-opened by triage is Gate 1.” |
| **Line 18 or V7 voids existing prose authorizations or the gate record.** | **S:18** explicitly excludes “its prose standing authorizations and gate record” from the additional stored-state rule. **S:46** excludes prose standing authorizations from V7’s interpretation. The remaining gate-record wording issue is the already accepted **O-2**, not a new finding. |
| **“Only the words the human typed count” makes pasted or expanded material operative.** | **S:48** explicitly says expanded bodies carry no quick flags and ambiguous expansion boundaries become pasted content. **R:45–50** excludes quoted/pasted content and defines the inert-message response. This does not enlarge the accepted unmarked-paste residual. |
| **A session can claim ownership by editing the block mid-parcel, or ownership means only a session ID.** | **T:11–18** requires the session ID and both checkout paths, permits transfers **only at parcel boundaries**, updates all three together, and requires STOP/report for another live Coordinator. Transfer-authority ambiguity remains the previously forwarded item. |
| **Standing-authorizations placeholders, the gate record, or the restrictions label are grants or pre-authorize Gate 1.** | **T:33–36** points to evidence of a human ratification and contains no entry. **T:40–49** requires an actual human grant’s verbatim prose, uses `none` when absent, and excludes Gate 1 and quick flags. **T:69–79** defines no stored grant. |
| **The appended Coordinator section elevates the registry above canon or changes the gate model.** | **C:93:** “Where the registry and this charter differ, this charter governs,” alongside V1 and V6. The original gates, green-chain contingency, universal stops, and ownership rules are unchanged. |

No added text authorizes bypassing the universal stop conditions, human-only gates, destructive/outward-facing limits, or green-chain merge. Those boundaries remain governed by canon and **R §3**.

## AC-1 through AC-17 trace

All pass **with the binding rework triage applied**.

| AC | Evidence |
|---|---|
| **AC-1** | Base/current comparison preserves lines 1–40 except 18/28. **S:41** is empty; **S:42** is the unique, last `## Quick flags` heading. Section length: **11 lines**. Frontmatter unchanged. |
| **AC-2** | **S:44:** “single, versioned source of truth,” version carried by `Registry version:`, and canon governs above it. V1 is exact: **“A quick flag adjusts how much the Coordinator asks and does inside the gates and never removes a gate.”** |
| **AC-3** | **S:46** contains exact V7: **“Nothing stored in a file can grant authority or loosen any restriction: a stored entry is honoured only to restrict.”** Its follow-up preserves prose authorizations. **S:46,48** require human-typed provenance and exclude expanded bodies. |
| **AC-4** | **S:50** names the loop directive, pre-Gate-1 draft charter, and intervening `restrictions.md`; carries “every earlier entry”; points to §9 for format/writer/reading/lifting/lifetime. |
| **AC-5** | **S:18** is byte-exact to the AC-5 replacement, including “beyond its prose standing authorizations and gate record.” |
| **AC-6** | **S:28** is byte-exact to AC-6 and points to `templates/kickstarters/loop-directive-template.md`. Historical-template reference count is **0** in S and M. |
| **AC-7** | **S:52:** “Builder Step 0 ‘flags’ … are not quick flags.” Exactly one permitted bare-term match; no other violation. |
| **AC-8** | **T:1:** `# Loop Directive — TEMPLATE`; **T:3–7** gives copy/fill instructions and required references. Uppercase placeholders and clean-room checks pass. **110 lines**. |
| **AC-9** | All **11 headings** exactly match the specified order. **T:22** contains the resume command/integration branch; **T:26–29:** “you consume verification, you never produce it”; **T:53:** “A new parcel idea is stop-and-report”; **T:61–65** preserves the cycle and boundary state update. |
| **AC-10** | **T:11–18** is a block quote containing all six ownership/state placeholders, absolute-path requirements, “One goal, one coordinator,” and boundary-only transfer rules. |
| **AC-11** | **T:33–36** contains only the registry pointer and `*(none yet)*`. **T:40–49** preserves verbatim human grants, contingencies, `none` handling, and “Gate 1 is never delegable and never appears here.” |
| **AC-12** | **T:69–75:** format defined “only in registry §9,” no authority grant, and carry from **both** earlier homes. **T:77–80** contains bare labels with the required empty boundaries; no example or field lines. |
| **AC-13** | **T:83–93** includes all required stop conditions; **T:97–100:** long fallback, completion primary, “Never poll,” and prompt provenance; **T:104–110:** “unclaimed disk state is never accepted as done,” followed by fresh-session Step 0 recovery. |
| **AC-14** | M equals S after **only** `${CLAUDE_PLUGIN_ROOT}` → `plugins/foreman-line`. Base precondition also passes. Snapshot metadata is unchanged. |
| **AC-15** | **C:1–89** unchanged; **4 lines** appended. **C:93** contains V1 and exact V6: **“QUICK-FLAGS governs quick flag tokens only. Existing prose grants are neither reinterpreted nor revoked.”** Registry pointer and canon precedence are present. |
| **AC-16** | Token/variant and term checks pass. The hostile readings above reveal no new waiver, stored grant, widened prose grant, or non-owner write authority. |
| **AC-17** | Scope output is exactly the four allowed build surfaces after specified coordinator exclusions. Historical kickstarter unchanged; whitespace checks pass; all four files end in newline. |

### “Documented once,” homes, and citation stability

- No added surface restates a registry entry, alias, restriction-line format, conflict-table row, or example line. Operational locations and carry behavior point to **§9**.
- S’s named homes agree with §9. The integration-branch checkout is an additional **copy**, not another home, consistent with Builder Step 0 ruling D.
- Existing citations into S and C remain stable outside the two expressly permitted S:18/S:28 changes. C’s original 89 lines and all other original skill lines retain bytes and positions. The accepted historical line-28 citation issue is not re-raised.

## Verification performed

Ran all **11 Verification Plan command groups** with `B=41f80463`:

| VP | Observed result |
|---|---|
| **1** | Base shapes **40/89**; template absent at base, expected `cat-file` failure. |
| **2** | Stability diff empty; `[]`, heading correct; count **1**; section **11** lines. |
| **3** | Line-18 diff empty; exact AC-6 comparison **`ok`**; historical references **0/0**. |
| **4** | Every required content grep returned **1**. |
| **5** | Token counts **0** for all four files; variant grep empty. |
| **6** | Exactly one match, containing **Step 0**. |
| **7** | Base and current mirror diffs empty. |
| **8** | Stability diff empty; **4** appended lines; heading/V1/V6/path counts all **1**. |
| **9** | **110** lines; exact heading list; registry/restriction references **2/1**; labels **1/1**; empty entry boundary; format/placeholder/clean-room checks pass; ownership anchors present. |
| **10** | Diff check empty; template trailing whitespace **0**; four terminal newlines. |
| **11** | Exactly four allowed paths; historical kickstarter diff empty. |

Supplemental checks confirmed the decision-log boundary, ownership block-quote form, intact backticks/placeholders/paths, absence of `flagged`, and broader normalized variants. Private scratch mutations were rejected for line stability, caps, headings, boundaries, placeholder casing, clean-room text, tokens/variants, term-prefix wrapping, mirror equality, whitespace/newlines, exact AC-5/6 operands, verbatim strings, and ownership anchors. Previously forwarded checker gaps remain forwarded, not claimed closed.

**Reviewer control:** final `git status --short` is identical to entry; HEAD and the four build-surface SHA-256 hashes are unchanged. **No repository changes or commits were caused by this review.**

Pure wording nits: unchanged triaged possessive, claim-date colon, CP cross-reference wording, and repeated “entry”; no new nits.

## Verdict: ACCEPT
