# QF-P1 review triage, round 3 (rework 2 at b3cc8f11, HEAD 09c5031a) — 2026-10-13

**Reviews:** E and F (`qf-p1-review-E-round3-...`, `...-F-...`), independent, frontier, read-only. Both: **REQUEST CHANGES**, no BLOCKER, no path that waives a §3 item (Gate 1, universal stop conditions, green-chain merge, human-only gates, destructive/outward-facing). Git-detection control passed for both (HEAD unchanged, registry blob equals HEAD).
**Coordinator closure check before review (on disk):** 596 lines, 14 entries, 91 pairs, five-term vocabulary, V1–V6, label order, all sweep greps at 0, `git diff --check` clean; the builder-reported edit-tool incident (a sentence replaced by `x`) was verified restored.
**Agreement (both reviewers):** E-1/F-1 (HIGH), E-3/F-2 (HIGH), E-5/F-3, E-6/F-5, E-7/F-7, E-9/F-10 (active/suspended), E-12, E-13 partly. No disputes.

## Tripwire — STOP CONDITION FIRED
Round 2 found rework 1's "all instances swept" claim false (C-2/D-1, C-3/D-5, C-5, C-8/D-7, C-10). Round 3 finds rework 2's claim again missing instances (F-4, E-11: limiting prose omits `--review2` and `--resume`) and introducing two HIGH regressions. That is the **second** false-closure tripwire on QF-P1. Universal stop condition: the loop stops and reports. No rework 3 is dispatched. No parcel is merged.

## Triage (dispositions proposed; nothing applied)

| Finding(s) | Disposition | Proposed fix |
|---|---|---|
| E-1, F-1 (HIGH) | Fix | Scope the "`--ratify`-quote" requirement in §8 Terms to the `charter revision:` pin only. The drop and dependency stops fire on **any** later charter revision or Gate 1 entry, prose included (stop and ask). |
| E-3, F-2 (HIGH) | Fix | In an inert message, every revocation of a delegating or gate record suspends its target until a human answers (and the stop report and `--status` name it). Limiting prose excludes revocation instructions. State that held content is never processed later and must be re-sent. |
| E-2 | Fix | Define "red step" as a closed list; the pre-merge check scans the chain since the record's `id:` and compares the pinned branch to the current one; a hit writes the void and refuses. |
| E-4 | Fix | Any session resuming or owning the goal honours the pending question and provisional quick flags in the latest stop report; `--resume` never answers it. |
| E-5, F-3 | Fix | The canon stop exemption includes cancelling the pending wakeup (`ScheduleWakeup stop:true`), everywhere it appears. |
| E-6, F-5 | **Coordinator ruling needed** | Spec A13 K2 ("a same-message D6 loss is a refusal") contradicts §10 ("where `--dry` or `--halt` wins, the other is not refused"). Recommendation: scope K2 to `--strict` wins; `--dry`/`--halt` wins are not refusals. |
| E-7, F-7 | Fix | Define a gate-record entry format (header, `message:`, `revisions:`, `date:`, `session:`) with the §8 owner and merge guards. |
| E-8 | Fix | Pin one authoritative copy of the records: the integration branch, committed there. |
| F-4, E-11 | Fix (sweep miss) | Limiting prose also covers `--review2` (a parcel named elsewhere refuses it, honoured provisionally) and `--resume`. |
| F-6 | Fix | "a `revoked:` line **other than `"no"`** that cites no valid revocation record…". |
| E-9, F-10, F-8, F-9, E-10, F-11, F-12, F-13, E-12 | Fix (LOW) | Define "active" and "held"; `--strict` revokes suspended `--blanket` records too; `--resume` re-enters the stopped-awaiting-answer state; scope branch-change voids to records pinned to the old branch; declare the pinned-blob format; define the ordering key. |
| E-13 | Coordinator-side | Record the missing A13 ruling (A13 lists K3, K4, K6, K7, K9–K15 but describes 10). |

## Decision for the developer (why the loop stopped instead of reworking)

Every HIGH in rounds 2 and 3 sits in **persistent-grant machinery** (`--blanket`, `--dispatch-ok`, `--merge-ok` stored as records with ids, voids, revocations, suspensions, owner-by-time, pinned branches and revisions). The registry is 596 lines for 14 flags, and each rework round's new text is the next round's attack surface. Options:

1. **Rework 3 as triaged above**, with a fresh builder and Step 0, accepting that a round 4 may still find edge cases.
2. **Simplify the design (recommended; re-opens Gate 1 for D5′ and D9′):** make `--blanket`, `--dispatch-ok`, `--merge-ok` **one-shot** (they apply to the message that carries them, and the Coordinator re-asks or you re-type them), keep `--strict`, `--nopush`, `--review2` as the only persistent flags (all restrictive, so a dropped or forged record fails safe), and drop grant records, voids, revocation keys, ownership-by-time and pinned-branch/revision machinery. That removes most of the attack surface that produced the HIGHs. Cost: delegating flags must be re-typed per use, or per loop wakeup, which is the safe direction.
3. Stop the goal here and keep the registry as a draft.
