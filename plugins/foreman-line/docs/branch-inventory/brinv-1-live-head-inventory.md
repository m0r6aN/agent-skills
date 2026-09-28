# BRINV-1 live-head inventory (build-time 2026-09-16, no fetch)

- Base HEAD: `main` = `origin/main` = `c06c1d5` (`git rev-parse main`, `git rev-parse origin/main`)
- Builder head: `codex/brinv-1-inventory-20260916` = `872d68a` (`git rev-parse HEAD`)
- Enumeration sources (all re-run without fetch): `git branch -a`, `git for-each-ref refs/heads`,
  `git for-each-ref refs/remotes`, `git worktree list --porcelain`, `git ls-remote --heads origin`,
  `git branch --no-merged main`, `git branch --merged main`
- Per-head facts via: `git merge-base main <ref>`, `git diff --shortstat <mb>..<ref>`,
  `git rev-list --left-right --count main...<ref>` (left = main-only/behind, right = head-only/ahead),
  `git log -1 --format` , `git diff --name-only <mb>..<ref>` for surfaces
- CI column is `UNKNOWN` for every head: no per-head CI store exists locally and network
  probes are prohibited by the parcel spec, so `UNKNOWN` is recorded with reason, never probed.
- Coordinator ruling 2026-09-16: PROCEED with refreshed live lists; shaping-time vs build-time
  counts are recorded side-by-side below with the delta attributed to authorized session activity.

## Shaping-time vs build-time counts

| Observation | Shaping (spec baseline, base `4d6407e`) | Build (this file, base `c06c1d5`) | Delta attribution |
|---|---|---|---|
| Local branches (`git branch` count) | 53 (54 with shaping branch) | 59 | Session shaping/builder branches (BRINV-1 shaping + builder, EVAL-1 green-gate + coverage-shaping, SUPERCHARGE-P3 design + phase3-shaping, GMF-P2A shaping) |
| Unmerged into `main` (`git branch --no-merged main`) | 32 | 38 | Same session branches (all unmerged by construction) |
| Live remote heads (`git ls-remote --heads origin`) | 10 incl `main` | 14 incl `main` | 4 new: `codex/branch-inventory-shaping-20260916`, `codex/eval-coverage-shaping-20260916`, `codex/gmf-p1-shaping-20260916`, `codex/supercharge-phase3-shaping-20260916` |
| Worktrees (`git worktree list` count) | 68 incl main checkout | 74 | Parcel worktrees for the same session branches |
| Base HEAD | `4d6407e` (PR #30) | `c06c1d5` (PR #34) | Landed PRs #31-#34 |

Stale-tracking rule applied throughout: a local `remotes/origin/*` ref absent from live
`ls-remote` is labeled STALE and never treated as live remote truth. Verified this run:
every live `ls-remote` head has a same-named tracking ref (no live-only-without-tracking
head except via SHA identity, see H60); 30 tracking refs are STALE (listed at the end).

## Live heads (73 rows: 59 local + 1 live-remote-only + 13 detached SHAs)

### H01. `add-accomplish-skill` — ABANDON
- FQ ref: `refs/heads/add-accomplish-skill` (`53a8bae`)
- Presence: local Y | tracking Y (`remotes/origin/add-accomplish-skill`, STALE — absent from live ls-remote) | live-remote N | worktree: none
- Merge-base: `53a8bae` (tip itself)
- Diffstat vs merge-base: empty (0 files)
- Ahead/behind vs main: behind 363 / ahead 0
- Last commit: `53a8bae` | Clint Morgan | 2026-06-16 (92d) | Add /accomplish skill
- Unmerged into main: no (in `git branch --merged main`)
- CI: UNKNOWN (no local per-head CI evidence; probing prohibited)
- Verdict ABANDON: tip is an ancestor of main (0 ahead, empty diff); already in mainline.

### H02. `agent/kpp-001-a-foreman-r3` — ABANDON
- FQ ref: `refs/heads/agent/kpp-001-a-foreman-r3` (`63a3a88`)
- Presence: local Y | tracking Y (STALE) | live-remote N | worktree: `D:/Repos/agent-skills-kpp-001-a-r3`
- Merge-base: `63a3a88` (tip itself)
- Diffstat vs merge-base: empty
- Ahead/behind: behind 341 / ahead 0
- Last commit: `63a3a88` | Clint Morgan | 2026-08-05 (42d) | docs(foreman): ratify KPP-001-A revision 3
- Unmerged: no
- CI: UNKNOWN (as H01)
- Verdict ABANDON: already in main; worktree retention/removal is a human Gate action, not authorized here.

### H03. `backup/cerebras-pre-rebase-20260830` — NEEDS-OWNER-CALL
- FQ ref: `refs/heads/backup/cerebras-pre-rebase-20260830` (tip `2b07a69`)
- Presence: local Y | tracking N | live-remote N (same-name) | worktree: none
- Merge-base: `ec8b6e9`
- Diffstat vs merge-base: 29 files changed, +2812 −24
- Ahead/behind: behind 340 / ahead 2
- Last commit: `2b07a69` | Clint Morgan | 2026-08-30 (17d) | feat(foreman): execute governed Cerebras shadow routing
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict NEEDS-OWNER-CALL: tip SHA `2b07a69` is byte-identical to the live remote head
  `codex/foreman-routing-cerebras-shadow-20260830` (`git ls-remote` = `2b07a69`, identical
  29-file/2812+/24− shortstat). Owner question: keep this local backup, the live remote
  head, or both — builder must not invent backup-retention policy. See H24, collision C6.

### H04. `blackboxai/update-gitignore-runtime-artifacts` — ABANDON
- FQ ref: `refs/heads/blackboxai/update-gitignore-runtime-artifacts` (`7ab32e5`)
- Presence: local Y | tracking Y (STALE) | live-remote N | worktree: none
- Merge-base: `7ab32e5` (tip itself)
- Diffstat: empty
- Ahead/behind: behind 329 / ahead 0
- Last commit: `7ab32e5` | Clint Morgan | 2026-08-30 (17d) | feat: Add GTM-P0A kickstarter and closure records
- Unmerged: no
- CI: UNKNOWN (as H01)
- Verdict ABANDON: ancestor of main; already in mainline.

### H05. `claude/heterogeneous-agent-worker-fabric-coordinator-20260903` — NEEDS-OWNER-CALL
- FQ ref: `refs/heads/claude/heterogeneous-agent-worker-fabric-coordinator-20260903` (tip `4dd2e08`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/heterogeneous-agent-worker-fabric-coordinator-claude-20260903`
- Merge-base: `5ce6ddc`
- Diffstat vs merge-base: 8 files changed, +854 −91
- Ahead/behind: behind 324 / ahead 15
- Last commit: `4dd2e08` | Clint Morgan | 2026-09-03 (13d) | docs(foreman): record 'verify the verifier'
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict NEEDS-OWNER-CALL: sibling of the `claude/hwf-wf-p0` stack tip (H06) on the same
  surface (`plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/` + kickstarters,
  6 shared files) but neither is the other's ancestor (`git merge-base --is-ancestor` = false).
  Owner question: which worker-fabric record survives / in what merge order — possible
  duplicate intent the builder must not resolve. See collision C2.

### H06. `claude/hwf-wf-p0-20260904` — MERGE-CANDIDATE
- FQ ref: `refs/heads/claude/hwf-wf-p0-20260904` (tip `7af103c`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/hwf-wf-p0-20260904`
- Merge-base: `5ce6ddc`
- Diffstat vs merge-base: 10 files changed, +2503 −91
- Ahead/behind: behind 324 / ahead 26
- Last commit: `7af103c` | Clint Morgan | 2026-09-03 (13d) | docs(wf-p0): close F-23, fix the citation cascade, record F-25
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict MERGE-CANDIDATE: stack tip (`claude/hwf-wf-p0-shaping-20260903` H07 is a proven
  ancestor) with unique review-worthy delta: WF-P0 F-23 close + F-25 record on
  `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/` (10 files, none in
  main). Worth human Gate-3 review. Review queue position: 2 of 4.

### H07. `claude/hwf-wf-p0-shaping-20260903` — ABANDON
- FQ ref: `refs/heads/claude/hwf-wf-p0-shaping-20260903` (tip `b9f4e1a`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/hwf-wf-p0-shaping-20260903`
- Merge-base: `5ce6ddc`
- Diffstat vs merge-base: 8 files changed, +1436 −91
- Ahead/behind: behind 324 / ahead 16
- Last commit: `b9f4e1a` | Clint Morgan | 2026-09-03 (13d) | docs(specs): fix self-reference in WF-P0 base amendment
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: proven ancestor of H06 stack tip (`git merge-base --is-ancestor` true);
  superseded by H06. Human deletes only.

### H08. `codex/branch-inventory-shaping-20260916` — ABANDON
- FQ ref: `refs/heads/codex/branch-inventory-shaping-20260916` (tip `872d68a`)
- Presence: local Y | tracking Y (`remotes/origin/codex/branch-inventory-shaping-20260916`) | live-remote Y (`872d68a`) | worktree: `D:/Repos/agent-skills-worktrees/branch-inventory-shaping-20260916`
- Merge-base: `c06c1d5`
- Diffstat vs merge-base: 2 files changed, +126 −0 (`BRINV-1-branch-inventory.md`, `brinv-1-branch-inventory.shaping-result.json`)
- Ahead/behind: behind 0 / ahead 1
- Last commit: `872d68a` | Clint Morgan | 2026-09-16 (0d) | docs: BRINV-1 shaped spec (draft) + Gate-2 re-pin
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: exact-duplicate tip SHA with the builder branch H09; shaping session
  superseded by the builder parcel. Human deletes only (never the builder).

### H09. `codex/brinv-1-inventory-20260916` (this parcel's branch) — NEEDS-OWNER-CALL
- FQ ref: `refs/heads/codex/brinv-1-inventory-20260916` (tip `872d68a`)
- Presence: local Y (current `*` checkout) | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/brinv-1-inventory-20260916`
- Merge-base: `c06c1d5`
- Diffstat vs merge-base: 2 files changed, +126 −0 (pre-output; grows by exactly the two files this parcel creates)
- Ahead/behind: behind 0 / ahead 1
- Last commit: `872d68a` | Clint Morgan | 2026-09-16 (0d) | docs: BRINV-1 shaped spec (draft) + Gate-2 re-pin
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict NEEDS-OWNER-CALL: active parcel branch; disposition (land vs abandon) belongs to
  the BRINV-1 Gate-3 human decision, which this parcel must not pre-empt.

### H10. `codex/eval-1-green-gate-20260916` — NEEDS-OWNER-CALL
- FQ ref: `refs/heads/codex/eval-1-green-gate-20260916` (tip `c961fcd`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/eval-1-green-gate-20260916`
- Merge-base: `c06c1d5`
- Diffstat vs merge-base: 2 files changed, +194 −0 (`EVAL-1-eval-coverage-green-gate.md` + shaping-result JSON)
- Ahead/behind: behind 0 / ahead 1
- Last commit: `c961fcd` | Clint Morgan | 2026-09-16 (0d) | docs: EVAL-1 shaped spec (draft) + Gate-2 re-pin
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict NEEDS-OWNER-CALL: active EVAL-1 parcel branch with an exact-duplicate sibling
  (H11); canonical-name/disposition decision belongs to EVAL-1's owner, not this builder.
  See collision C1.

### H11. `codex/eval-coverage-shaping-20260916` — ABANDON
- FQ ref: `refs/heads/codex/eval-coverage-shaping-20260916` (tip `c961fcd`)
- Presence: local Y | tracking Y | live-remote Y (`c961fcd`) | worktree: `D:/Repos/agent-skills-worktrees/eval-coverage-shaping-20260916`
- Merge-base: `c06c1d5`; diffstat: 2 files, +194 −0; ahead/behind: 0/1
- Last commit: `c961fcd` | Clint Morgan | 2026-09-16 (0d) | docs: EVAL-1 shaped spec (draft) + Gate-2 re-pin
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: exact-duplicate tip SHA of H10; shaping sibling superseded by the
  EVAL-1 parcel branch. Human deletes only.

### H12. `codex/fk-p0-canon-authority-enforcement-registry` — ABANDON
- FQ ref: `refs/heads/codex/fk-p0-canon-authority-enforcement-registry` (tip `0ee1657`)
- Presence: local Y | tracking Y | live-remote Y (`0ee1657`) | worktree: `D:/Repos/agent-skills-worktrees/fk-p0-canon-authority-enforcement-registry`
- Merge-base: `354940e`
- Diffstat vs merge-base: 66 files changed, +121445 −0 (all `plugins/`, `foreman-line/docs` + `authority-registry`)
- Ahead/behind: behind 328 / ahead 140
- Last commit: `0ee1657` | Clint Morgan | 2026-09-04 (12d) | wip(fk-p0): align round-6 semantic expectations
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: proven ancestor of the R30→R31 stack (`git merge-base --is-ancestor`
  `0ee1657`→`c35ff72` true; `c35ff72`→`1747c1d` true); superseded by H14. Exact-duplicate
  siblings H16/H46 also ABANDON. See collisions C1, C3.

### H13. `codex/fk-p0-r30-adoption-20260907` — ABANDON
- FQ ref: `refs/heads/codex/fk-p0-r30-adoption-20260907` (tip `c35ff72`)
- Presence: local Y | tracking Y | live-remote Y (`c35ff72`) | worktree: `D:/Repos/agent-skills-worktrees/fk-p0-r30-adoption-20260907`
- Merge-base: `354940e`
- Diffstat vs merge-base: 243 files changed, +184298 −0
- Ahead/behind: behind 328 / ahead 154
- Last commit: `c35ff72` | Clint Morgan | 2026-09-07 (9d) | docs(foreman-kernel): record complete R30 verification and handoff
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: proven ancestor of the R31 tip H14 on the same surface; superseded by
  H14. Human deletes only.

### H14. `codex/fk-p0-r31-source-adoption-20260907` — NEEDS-OWNER-CALL
- FQ ref: `refs/heads/codex/fk-p0-r31-source-adoption-20260907` (tip `1747c1d`)
- Presence: local Y | tracking Y | live-remote Y (`1747c1d`) | worktree: `D:/Repos/agent-skills-worktrees/fk-p0-r31-source-adoption-20260907`
- Merge-base: `354940e`
- Diffstat vs merge-base: 377 files changed, +221263 −1 (`plugins/foreman-line/docs`: 355, `authority-registry`: 22)
- Ahead/behind: behind 328 / ahead 164
- Last commit: `1747c1d` | Clint Morgan | 2026-09-07 (9d) | Record complete green R31 verification and evidence custody
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict NEEDS-OWNER-CALL: stack tip of the canon→R30→R31 line, but three sibling heads
  (H18 resume, H21 unattended, H47 handoff) overlap 57–364 files on the same
  `plugins/foreman-line/docs` surface with neither ancestor of the other (R31→resume
  `--is-ancestor` = false). Picking the canonical FK-P0 survivor is an ownership decision
  the builder must not invent. Owner question in closure evidence.

### H15. `codex/fk-p0-rework6-unclaimed-20260903` — NEEDS-OWNER-CALL
- FQ ref: `refs/heads/codex/fk-p0-rework6-unclaimed-20260903` (tip `b0518f8`)
- Presence: local Y | tracking Y | live-remote Y (`b0518f8`) | worktree: none
- Merge-base: `354940e`
- Diffstat vs merge-base: 64 files changed, +119964 −0
- Ahead/behind: behind 328 / ahead 126
- Last commit: `b0518f8` | Clint Morgan | 2026-09-03 (13d) | UNCLAIMED WORK — round-6 builder died mid-edit. NOT a completion claim.
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict NEEDS-OWNER-CALL: tip message explicitly disclaims completion, so MERGE-CANDIDATE
  is excluded; but 119964 unique insertions may be salvageable, so ABANDON (delete
  recommendation) would invent a destruction decision. Owner question: salvage any delta
  vs H12/H14, or delete.

### H16. `codex/fk-p0-recovery-20260907` — ABANDON
- FQ ref: `refs/heads/codex/fk-p0-recovery-20260907` (tip `0ee1657`)
- Presence: local Y | tracking Y | live-remote Y (`0ee1657`) | worktree: `D:/Repos/agent-skills-worktrees/fk-p0-recovery-20260907`
- Merge-base: `354940e`; diffstat: 66 files, +121445 −0; ahead/behind: 328/140
- Last commit: `0ee1657` | Clint Morgan | 2026-09-04 (12d) | wip(fk-p0): align round-6 semantic expectations
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: exact-duplicate tip SHA of H12 (and H46); duplicated. Human deletes only.

### H17. `codex/foreman-kernel-resume-20260908` — NEEDS-OWNER-CALL
- FQ ref: `refs/heads/codex/foreman-kernel-resume-20260908` (tip `947e6f1`)
- Presence: local Y | tracking Y | live-remote Y (`947e6f1`) | worktree: `D:/Repos/agent-skills-worktrees/foreman-kernel-resume-20260908`
- Merge-base: `354940e`
- Diffstat vs merge-base: 364 files changed, +116636 −0 (all `plugins/foreman-line/docs`)
- Ahead/behind: behind 328 / ahead 155
- Last commit: `947e6f1` | Clint Morgan | 2026-09-08 (8d) | Publish manifest for isolated September 8 R31 Gate 3 preparation
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict NEEDS-OWNER-CALL: FK-P0 survivor candidate, sibling-overlapping H14/H21/H47 on
  the same docs surface (see H14 evidence). Owner picks the canonical survivor.

### H18. `codex/foreman-kernel-stage0-20260830` — ABANDON
- FQ ref: `refs/heads/codex/foreman-kernel-stage0-20260830` (tip `d0e87ce`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/foreman-kernel-stage0-20260830`
- Merge-base: `354940e`
- Diffstat vs merge-base: 36 files changed, +9466 −0
- Ahead/behind: behind 328 / ahead 70
- Last commit: `d0e87ce` | Clint Morgan | 2026-09-04 (12d) | docs(foreman-kernel): rule Round 6 recovery Step 0
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: Step-0 ruling record superseded by the subsequent R30/R31 round line on
  the same surface; scratch with nothing unique vs H13/H14.

### H19. `codex/foreman-kernel-unattended-20260907` — NEEDS-OWNER-CALL
- FQ ref: `refs/heads/codex/foreman-kernel-unattended-20260907` (tip `865e16c`)
- Presence: local Y | tracking Y | live-remote Y (`865e16c`) | worktree: `D:/Repos/agent-skills-worktrees/foreman-kernel-unattended-20260907`
- Merge-base: `354940e`
- Diffstat vs merge-base: 358 files changed, +109789 −0 (all `plugins/foreman-line/docs`)
- Ahead/behind: behind 328 / ahead 153
- Last commit: `865e16c` | Clint Morgan | 2026-09-07 (9d) | Capture final R31 resume, reviews and integration proof manifest
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict NEEDS-OWNER-CALL: FK-P0 survivor candidate, sibling-overlapping H14/H17/H47 (see
  H14 evidence). Owner picks the canonical survivor.

### H20. `codex/foreman-line-bootstrap` — ABANDON
- FQ ref: `refs/heads/codex/foreman-line-bootstrap` (tip `f187441`)
- Presence: local Y | tracking Y (STALE) | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/foreman-line-bootstrap-20260731`
- Merge-base: `260d1eb`
- Diffstat vs merge-base: 655 files changed, +86534 −0
- Ahead/behind: behind 360 / ahead 3
- Last commit: `f187441` | Clint Morgan | 2026-08-01 (46d) | docs: record Foreman bootstrap reviews
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: Aug-1 bootstrap record superseded by the bootstrap-closeout record (H21)
  and 360 mainline commits since its base; scratch with nothing unique vs mainline.

### H21. `codex/foreman-line-bootstrap-closeout` — ABANDON
- FQ ref: `refs/heads/codex/foreman-line-bootstrap-closeout` (tip `5f16577`)
- Presence: local Y | tracking Y (STALE) | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/foreman-line-postmerge-20260731`
- Merge-base: `48d1db7`
- Diffstat vs merge-base: 2 files changed, +21 −2 (`specs/done/WGT-P0BOOT-tracked-foreman-bootstrap.md`, `transcripts/build-WGT-P0BOOT-tracked-bootstrap.md`)
- Ahead/behind: behind 359 / ahead 1
- Last commit: `5f16577` | Clint Morgan | 2026-08-01 (46d) | docs: close Foreman bootstrap parcel
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: closed-parcel closeout note from Aug 1; superseded historical record with
  no actionable delta vs mainline.

### H22. `codex/foreman-line-bootstrap-r1` — ABANDON
- FQ ref: `refs/heads/codex/foreman-line-bootstrap-r1` (tip `6032bee`)
- Presence: local Y | tracking Y (STALE) | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/foreman-line-bootstrap-r1-20260731`
- Merge-base: `61120ba`
- Diffstat vs merge-base: 1 file changed, +2 −0 (`.gitignore`)
- Ahead/behind: behind 362 / ahead 1
- Last commit: `6032bee` | Clint Morgan | 2026-07-31 (47d) | fix: protect Claude local settings for Foreman bootstrap
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: single-file Jul-31 settings tweak, superseded by mainline `.gitignore`
  evolution over 362 commits; nothing unique.

### H23. `codex/foreman-routing-cerebras-shadow-20260830` — NEEDS-OWNER-CALL
- FQ ref: `refs/heads/codex/foreman-routing-cerebras-shadow-20260830` — DIVERGED: local tip `f04fb49` vs tracking/live-remote tip `2b07a69`
- Presence: local Y (`f04fb49`) | tracking Y (`remotes/origin/codex/foreman-routing-cerebras-shadow-20260830` = `2b07a69`) | live-remote Y (`2b07a69`) | worktree: none on this name (the `foreman-routing-cerebras-shadow` worktree is attached to H24)
- Local tip: merge-base `f04fb49` (itself); diffstat empty; behind 335 / ahead 0 → merged ancestor
- Live tip: merge-base `ec8b6e9`; diffstat 29 files, +2812 −24; behind 340 / ahead 2 (identical to H03 evidence)
- Last commits: local `f04fb49` | Clint Morgan | 2026-08-30 (17d) | feat(foreman): execute governed Cerebras shadow routing; live `2b07a69` same subject/date
- Unmerged (local branch): no; live head content: unmerged (2 ahead)
- CI: UNKNOWN (as H01)
- Verdict NEEDS-OWNER-CALL: same ref name carries two contents — a merged local tip and a
  live pre-rebase tip identical to the H03 backup. Reconciling (keep live, reset local
  pointer, or delete live) is an ownership decision; any reset/delete wording here would
  exceed recommendations-only authority. See collision C6.

### H24. `codex/foreman-routing-cerebras-shadow-v2-20260830` — ABANDON
- FQ ref: `refs/heads/codex/foreman-routing-cerebras-shadow-v2-20260830` (tip `f04fb49`)
- Presence: local Y | tracking Y (STALE) | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/foreman-routing-cerebras-shadow`
- Merge-base: `f04fb49` (itself); diffstat empty; behind 335 / ahead 0
- Last commit: `f04fb49` | Clint Morgan | 2026-08-30 (17d) | feat(foreman): execute governed Cerebras shadow routing
- Unmerged: no
- CI: UNKNOWN (as H01)
- Verdict ABANDON: exact-duplicate tip of the merged local H23 tip; already in mainline
  and duplicated. Human deletes only.

### H25. `codex/gmf-p2a-shaping-20260916` — ABANDON
- FQ ref: `refs/heads/codex/gmf-p2a-shaping-20260916` (tip `c06c1d5` = base itself)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/gmf-p2a-shaping-20260916`
- Merge-base: `c06c1d5`; diffstat empty; behind 0 / ahead 0
- Last commit: `c06c1d5` | m0r6aN | 2026-09-16 (0d) | Merge pull request #34
- Unmerged: no (in `git branch --merged main`)
- CI: UNKNOWN (as H01)
- Verdict ABANDON: empty pointer at base; scratch with nothing unique. (If GMF-P2A shaping
  is still wanted, its owner re-parcels; nothing here to merge.)

### H26. `codex/goal-intake-hierarchical-worker-fabric-20260903` — ABANDON
- FQ ref: `refs/heads/codex/goal-intake-hierarchical-worker-fabric-20260903` (tip `a7ca8a8`)
- Presence: local Y | tracking Y (STALE) | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/goal-intake-hierarchical-worker-fabric-20260903`
- Merge-base: `a7ca8a8` (itself); diffstat empty; behind 327 / ahead 0
- Last commit: `a7ca8a8` | Clint Morgan | 2026-09-03 (13d) | docs(foreman-line): queue coordination and worker-fabric goals
- Unmerged: no
- CI: UNKNOWN (as H01)
- Verdict ABANDON: ancestor of main; already in mainline.

### H27. `codex/heterogeneous-agent-worker-fabric-coordinator-20260903` — ABANDON
- FQ ref: `refs/heads/codex/heterogeneous-agent-worker-fabric-coordinator-20260903` (tip `cba257e`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/heterogeneous-agent-worker-fabric-coordinator-20260903`
- Merge-base: `2437841`
- Diffstat vs merge-base: 5 files changed, +162 −33 (all 5 under `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/` + INDEX)
- Ahead/behind: behind 326 / ahead 4
- Last commit: `cba257e` | Clint Morgan | 2026-09-03 (13d) | docs(foreman): triage worker-fabric plan review
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: same surface as the later, fuller claude WF-P0 line (H05/H06 cover all 5
  files plus more, 10 hours newer); superseded triage note with nothing unique.

### H28. `codex/hierarchical-coordination-sidecars-20260903` — MERGE-CANDIDATE
- FQ ref: `refs/heads/codex/hierarchical-coordination-sidecars-20260903` (tip `7bc050b`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/hierarchical-coordination-sidecars-20260903`
- Merge-base: `2437841`
- Diffstat vs merge-base: 1 file changed, +37 −5 (`plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/loop-directive.md`)
- Ahead/behind: behind 326 / ahead 1
- Last commit: `7bc050b` | Clint Morgan | 2026-09-03 (13d) | docs(goal): record sidecar coordination stop boundary
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict MERGE-CANDIDATE: unique surface (no other head touches
  `goals/hierarchical-coordination-sidecars/`), small, review-worthy stop-boundary record.
  Review queue position: 3 of 4.

### H29. `codex/operation-receipt-remediation-20260812` — MERGE-CANDIDATE
- FQ ref: `refs/heads/codex/operation-receipt-remediation-20260812` (tip `756aa4d`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/operation-receipt-remediation-20260812`
- Merge-base: `ec8b6e9`
- Diffstat vs merge-base: 10 files changed, +834 −0 (unique surface: `goals/operation-receipt-remediation/`, `kickstarters/operation-receipt-*`, `specs/active/OR-P01*`, `OR-P02*`)
- Ahead/behind: behind 340 / ahead 15
- Last commit: `756aa4d` | Clint Morgan | 2026-08-13 (34d) | docs(foreman): record OR-P02 proxy failure
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict MERGE-CANDIDATE: unique surface no other live head touches (OR-P01/OR-P02 specs
  exist only here); failure-record delta worth human Gate-3 review despite age.
  Review queue position: 4 of 4.

### H30. `codex/parcel-compiler-bootstrap` — NEEDS-OWNER-CALL
- FQ ref: `refs/heads/codex/parcel-compiler-bootstrap` (tip `72dfd45`)
- Presence: local Y | tracking Y (STALE) | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/parcel-compiler-bootstrap-20260731`
- Merge-base: `d74f1b0`
- Diffstat vs merge-base: 21 files changed, +2260 −0 (unique surface `skills/parcel-compiler/`: SKILL.md, kickstarters, PCC-P0 spec, transcripts, tool src + tests)
- Ahead/behind: behind 361 / ahead 1
- Last commit: `72dfd45` | Clint Morgan | 2026-07-31 (47d) | chore: track parcel compiler prerequisite
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict NEEDS-OWNER-CALL: unique surface, but a 47-day-old prereq tracker whose consumer
  (PCC-P0) status the builder cannot determine read-only. Owner question: is the parcel
  compiler still wanted (then Gate-3 review) or is this stale scaffolding (then delete).

### H31. `codex/provisional-patent-readiness-20260813` — NEEDS-OWNER-CALL
- FQ ref: `refs/heads/codex/provisional-patent-readiness-20260813` (tip `afbbcbd`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/provisional-patent-readiness-20260813`
- Merge-base: `a5f0b17`
- Diffstat vs merge-base: 17 files changed, +831 −0 (same goal dir as H33: charter, amendments, handoffs incl. W0-P01R design-revision receipt)
- Ahead/behind: behind 364 / ahead 22
- Last commit: `afbbcbd` | Clint Morgan | 2026-09-13 (3d) | docs(foreman): clarify custody setup sequence
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict NEEDS-OWNER-CALL: sibling of the fixture line tip H33 on the same 17-file surface
  with neither ancestor of the other (`afbbcbd`→`cced8e2` `--is-ancestor` = false; both
  Sep-13). Possible duplicate intent; owner picks the canonical custody-settlement head.
  See collision C4.

### H32. `codex/supercharge-p3-design-20260916` — NEEDS-OWNER-CALL
- FQ ref: `refs/heads/codex/supercharge-p3-design-20260916` (tip `6952d63`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/supercharge-phase3-design-20260916`
- Merge-base: `c06c1d5`
- Diffstat vs merge-base: 2 files changed, +131 −0 (`SUPERCHARGE-P3-phase3-design.md` + shaping-result JSON)
- Ahead/behind: behind 0 / ahead 1
- Last commit: `6952d63` | Clint Morgan | 2026-09-16 (0d) | docs: SUPERCHARGE-P3 shaped spec (draft) + Gate-2 re-pin
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict NEEDS-OWNER-CALL: active SUPERCHARGE-P3 parcel branch with an exact-duplicate
  sibling (H33x/H-next); disposition belongs to that parcel's owner. See collision C1.

### H33. `codex/supercharge-phase3-shaping-20260916` — ABANDON
- FQ ref: `refs/heads/codex/supercharge-phase3-shaping-20260916` (tip `6952d63`)
- Presence: local Y | tracking Y | live-remote Y (`6952d63`) | worktree: `D:/Repos/agent-skills-worktrees/supercharge-phase3-shaping-20260916`
- Merge-base: `c06c1d5`; diffstat: 2 files, +131 −0; ahead/behind: 0/1
- Last commit: `6952d63` | Clint Morgan | 2026-09-16 (0d) | docs: SUPERCHARGE-P3 shaped spec (draft) + Gate-2 re-pin
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: exact-duplicate tip SHA of H32; shaping sibling superseded by the
  design parcel branch. Human deletes only.

### H34. `codex/w0-p01-custody-retry-20260813` — ABANDON
- FQ ref: `refs/heads/codex/w0-p01-custody-retry-20260813` (tip `314a17f`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01-retry-20260813`
- Merge-base: `a5f0b17`
- Diffstat vs merge-base: 10 files changed, +570 −0
- Ahead/behind: behind 364 / ahead 12
- Last commit: `314a17f` | Clint Morgan | 2026-08-13 (34d) | docs(foreman): accept OR-P23R and amend W0 retry
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: mid-stack snapshot of the custody-retry chain whose tip (H38, `cced8e2`)
  descends from its successor (a3→fixture `--is-ancestor` true); superseded by H38.

### H35. `codex/w0-p01-custody-retry-20260817` — ABANDON
- FQ ref: `refs/heads/codex/w0-p01-custody-retry-20260817` (tip `6e134c5`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01-retry-20260817`
- Merge-base: `a5f0b17`; diffstat: 12 files, +599 −0; behind 364 / ahead 14
- Last commit: `6e134c5` | Clint Morgan | 2026-08-17 (30d) | docs(foreman): ratify PowerShell-compatible custody retry
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: mid-stack snapshot superseded by the H38 fixture tip (same chain).
  Human deletes only.

### H36. `codex/w0-p01-custody-retry-a3-20260817` — ABANDON
- FQ ref: `refs/heads/codex/w0-p01-custody-retry-a3-20260817` (tip `e29a4d6`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01-retry-a3-20260817`
- Merge-base: `a5f0b17`; diffstat: 14 files, +622 −0; behind 364 / ahead 16
- Last commit: `e29a4d6` | Clint Morgan | 2026-08-17 (30d) | docs(foreman): ratify payload hash custody retry
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: proven ancestor of the H38 fixture tip; superseded by H38.
  Human deletes only.

### H37. `codex/w0-p01-custody-snapshot-20260813` — ABANDON
- FQ ref: `refs/heads/codex/w0-p01-custody-snapshot-20260813` (tip `3519e8c`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01-20260813`
- Merge-base: `a5f0b17`; diffstat: 4 files, +352 −0; behind 364 / ahead 6
- Last commit: `3519e8c` | Clint Morgan | 2026-08-13 (34d) | docs(foreman): shape W0 custody snapshot
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: stack base superseded by the H38 fixture tip on the same surface.
  Human deletes only.

### H38. `codex/w0-p01r-fixture-20260913` — NEEDS-OWNER-CALL
- FQ ref: `refs/heads/codex/w0-p01r-fixture-20260913` (tip `cced8e2`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01r-fixture-20260913`
- Merge-base: `a5f0b17`
- Diffstat vs merge-base: 17 files changed, +815 −0 (charter, amendments, handoffs, design-revision receipt)
- Ahead/behind: behind 364 / ahead 20
- Last commit: `cced8e2` | Clint Morgan | 2026-09-13 (3d) | docs(foreman): shape conditional custody proof and capture
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict NEEDS-OWNER-CALL: tip of the custody-retry stack, but shares its exact tip SHA
  with four sibling heads (H39–H42) and overlaps H31's sibling line on all 17 files.
  Owner questions: canonical name among the five identical heads; H31 vs this line.
  See collisions C1, C4.

### H39. `codex/w0-p01r-r1-fixture-20260913` — ABANDON
- FQ ref: `refs/heads/codex/w0-p01r-r1-fixture-20260913` (tip `cced8e2`, identical to H38)
- Presence: local Y | tracking N | live-remote N | worktree: `.../provisional-patent-readiness-w0-p01r-r1-fixture-20260913`
- Merge-base: `a5f0b17`; diffstat: 17 files, +815 −0; behind 364 / ahead 20
- Last commit: `cced8e2` | Clint Morgan | 2026-09-13 (3d) | docs(foreman): shape conditional custody proof and capture
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: exact-duplicate tip SHA of H38; duplicated. Human deletes only.

### H40. `codex/w0-p01r-r2-fixture-20260913` — ABANDON
- Same evidence shape as H39 (tip `cced8e2`; worktree `.../r2-fixture-20260913`).
- Verdict ABANDON: exact-duplicate tip SHA of H38; duplicated. Human deletes only.

### H41. `codex/w0-p01r-r3-fixture-20260913` — ABANDON
- Same evidence shape as H39 (tip `cced8e2`; worktree `.../r3-fixture-20260913`).
- Verdict ABANDON: exact-duplicate tip SHA of H38; duplicated. Human deletes only.

### H42. `codex/w0-p01r-r4-fixture-20260914` — ABANDON
- Same evidence shape as H39 (tip `cced8e2`; worktree `.../r4-fixture-20260914`).
- Verdict ABANDON: exact-duplicate tip SHA of H38; duplicated. Human deletes only.

### H43. `codex/wgt-p0a-foreman-reconciliation-20260801` — ABANDON
- FQ ref: `refs/heads/codex/wgt-p0a-foreman-reconciliation-20260801` (tip `ec4e02d`)
- Presence: local Y | tracking Y (STALE) | live-remote N | worktree: none (the similarly-named worktree is attached to H44)
- Merge-base: `ec4e02d` (itself); diffstat empty; behind 350 / ahead 0
- Last commit: `ec4e02d` | Clint Morgan | 2026-08-01 (46d) | docs: clarify WGT-P0A review binding
- Unmerged: no
- CI: UNKNOWN (as H01)
- Verdict ABANDON: ancestor of main; already in mainline.

### H44. `codex/wgt-p0a-stage-f-archive-20260801` — ABANDON
- FQ ref: `refs/heads/codex/wgt-p0a-stage-f-archive-20260801` (tip `d5328aa`)
- Presence: local Y | tracking Y (STALE) | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/wgt-p0a-foreman-reconciliation-20260801`
- Merge-base: `d5328aa` (itself); diffstat empty; behind 348 / ahead 0
- Last commit: `d5328aa` | Clint Morgan | 2026-08-01 (46d) | docs: archive WGT-P0A parcel
- Unmerged: no
- CI: UNKNOWN (as H01)
- Verdict ABANDON: ancestor of main; already in mainline. (H45, the merge of this head's
  line via PR #7, is likewise already in main.)

### H45. `codex/wgt-p2a-foreman-queue-reconciliation-20260802` — ABANDON
- FQ ref: `refs/heads/codex/wgt-p2a-foreman-queue-reconciliation-20260802` (tip `1ada3cc`, PR #7 merge)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/wgt-p2a-foreman-queue-reconciliation-20260802`
- Merge-base: `1ada3cc` (itself); diffstat empty; behind 347 / ahead 0
- Last commit: `1ada3cc` | m0r6aN | 2026-08-01 (46d) | Merge pull request #7
- Unmerged: no
- CI: UNKNOWN (as H01)
- Verdict ABANDON: merged PR branch; already in mainline.

### H46. `feat/foreman-line-FL-FK-V0-20260905` — ABANDON
- FQ ref: `refs/heads/feat/foreman-line-FL-FK-V0-20260905` (tip `0ee1657`, identical to H12/H16)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/fl-fk-v0-verification-20260905`
- Merge-base: `354940e`; diffstat: 66 files, +121445 −0; behind 328 / ahead 140
- Last commit: `0ee1657` | Clint Morgan | 2026-09-04 (12d) | wip(fk-p0): align round-6 semantic expectations
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict ABANDON: exact-duplicate tip SHA of H12; duplicated (and superseded via H12→H14).
  Human deletes only.

### H47. `feat/foreman-line-FL-ASSEMBLY-20260905` — ABANDON
- FQ ref: `refs/heads/feat/foreman-line-FL-ASSEMBLY-20260905` (tip `e62ba0a`)
- Presence: local Y | tracking Y (STALE) | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/fl-assembly-20260905`
- Merge-base: `e62ba0a` (itself); diffstat empty; behind 322 / ahead 0
- Last commit: `e62ba0a` | Clint Morgan | 2026-09-05 (11d) | fix(ci): preserve LF bytes on Windows checkout
- Unmerged: no
- CI: UNKNOWN (as H01)
- Verdict ABANDON: ancestor of main; already in mainline.

### H48. `feat/foreman-line-FL-R1-20260905` — ABANDON
- FQ ref: `refs/heads/feat/foreman-line-FL-R1-20260905` (tip `5ce6ddc`, PR #15 merge)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/fl-r1-terminal-seal-20260905`
- Merge-base: `5ce6ddc` (itself); diffstat empty; behind 324 / ahead 0
- Last commit: `5ce6ddc` | m0r6aN | 2026-09-03 (13d) | Merge pull request #15
- Unmerged: no
- CI: UNKNOWN (as H01)
- Verdict ABANDON: merged PR branch; already in mainline.

### H49. `feat/foreman-line-FL-R2-20260905` — ABANDON
- Same evidence shape as H48 (tip `5ce6ddc`; worktree `.../fl-r2-audit-loader-20260905`).
- Verdict ABANDON: exact-duplicate tip of merged H48; already in mainline and duplicated.

### H50. `feat/foreman-line-FL-R3-20260905` — ABANDON
- Same evidence shape as H48 (tip `5ce6ddc`; worktree `.../fl-r3-pr-push-20260905`).
- Verdict ABANDON: exact-duplicate tip of merged H48; already in mainline and duplicated.

### H51. `feat/foreman-line-FL-R4-20260905` — ABANDON
- Same evidence shape as H48 (tip `5ce6ddc`; worktree `.../fl-r4-package-ci-20260905`).
- Verdict ABANDON: exact-duplicate tip of merged H48; already in mainline and duplicated.

### H52. `fix/skill-doc-required-sections` — ABANDON
- FQ ref: `refs/heads/fix/skill-doc-required-sections` (tip `a4864a4`)
- Presence: local Y | tracking Y (STALE) | live-remote N | worktree: none
- Merge-base: `a4864a4` (itself); diffstat empty; behind 323 / ahead 0
- Last commit: `a4864a4` | Clint Morgan | 2026-09-06 (10d) | docs(skills): add required sections to fix validate-skills CI check
- Unmerged: no
- CI: UNKNOWN (as H01)
- Verdict ABANDON: ancestor of main; already in mainline.

### H53. `goal/keon-full-platform-gtm-readiness-20260818` — MERGE-CANDIDATE
- FQ ref: `refs/heads/goal/keon-full-platform-gtm-readiness-20260818` (tip `e515bff`)
- Presence: local Y | tracking N | live-remote N | worktree: `D:/Repos/agent-skills-worktrees/keon-full-platform-gtm-readiness-20260818`
- Merge-base: `e56c2cb`
- Diffstat vs merge-base: 5 files changed, +1130 −0 (unique surface `plugins/foreman-line/docs/goals/keon-full-platform-gtm-readiness/`: charter, discovery, amendment-r1, loop-directive, plan-review-findings)
- Ahead/behind: behind 337 / ahead 2
- Last commit: `e515bff` | Clint Morgan | 2026-08-18 (29d) | docs(gtm): pin full-platform GTM control plane
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict MERGE-CANDIDATE: unique surface no other live head touches; control-plane delta
  worth human Gate-3 review despite age. Review queue position: 1 of 4.

### H54. `handoff/foreman-kernel-live-20260907` — NEEDS-OWNER-CALL
- FQ ref: `refs/heads/handoff/foreman-kernel-live-20260907` (tip `fe31042`)
- Presence: local Y | tracking Y | live-remote Y (`fe31042`) | worktree: `D:/Repos/agent-skills-worktrees/foreman-kernel-handoff-20260907`
- Merge-base: `354940e`
- Diffstat vs merge-base: 57 files changed, +16897 −0 (all `plugins/foreman-line/docs`)
- Ahead/behind: behind 328 / ahead 71
- Last commit: `fe31042` | Clint Morgan | 2026-09-07 (9d) | docs(foreman-kernel): publish reconciled live-state handoff
- Unmerged: yes
- CI: UNKNOWN (as H01)
- Verdict NEEDS-OWNER-CALL: fourth FK-P0 survivor candidate on the shared docs surface (see
  H14 evidence). Owner picks the canonical survivor; handoff-vs-evidence framing is an
  ownership call.

### H55. `main` (base) — ABANDON
- FQ ref: `refs/heads/main` (tip `c06c1d5`)
- Presence: local Y | tracking Y | live-remote Y | worktree: `D:/Repos/agent-skills`
- Merge-base with itself: `c06c1d5`; diffstat empty; behind 0 / ahead 0
- Last commit: `c06c1d5` | m0r6aN | 2026-09-16 (0d) | Merge pull request #34
- Unmerged: no
- CI: UNKNOWN (not applicable to base; recorded for schema uniformity)
- Verdict ABANDON: is the base itself; nothing to merge. Recorded so the enumeration is
  exhaustive over `git branch -a`.

### H56. `opencode/foreman-routing-policy-openrouter-v0.3-20260903` — ABANDON
- FQ ref: `refs/heads/opencode/foreman-routing-policy-openrouter-v0.3-20260903` (tip `096adfb`)
- Presence: local Y | tracking Y (STALE) | live-remote N | worktree: none
- Merge-base: `096adfb` (itself); diffstat empty; behind 325 / ahead 0
- Last commit: `096adfb` | Clint Morgan | 2026-09-03 (13d) | feat(foreman): retarget routing policy to OpenRouter (v0.3)
- Unmerged: no
- CI: UNKNOWN (as H01)
- Verdict ABANDON: ancestor of main (landed via PR #15 line per H48 subject); already in mainline.

### H57. `pr-19` — ABANDON
- FQ ref: `refs/heads/pr-19` (tip `d1bf93f`)
- Presence: local Y | tracking N | live-remote N | worktree: none
- Merge-base: `d1bf93f` (itself); diffstat empty; behind 303 / ahead 0
- Last commit: `d1bf93f` | Clint Morgan | 2026-09-06 (10d) | docs(foreman-line): mint E6-R1 Stage D verdict
- Unmerged: no
- CI: UNKNOWN (as H01)
- Verdict ABANDON: ancestor of main; already in mainline.

### H58. `temp/plugin-bu,p` — ABANDON
- FQ ref: `refs/heads/temp/plugin-bu,p` (tip `3a769f0`; note literal comma in name)
- Presence: local Y | tracking N | live-remote N | worktree: none
- Merge-base: `3a769f0` (itself); diffstat empty; behind 323 / ahead 0
- Last commit: `3a769f0` | Clint Morgan | 2026-09-06 (10d) | feat(audit-suite, foreman-line): update author details and version to 0.2.0
- Unmerged: no
- CI: UNKNOWN (as H01)
- Verdict ABANDON: ancestor of main (likely a typo-name scratch whose content landed via
  the correctly-named `temp/plugin-bump` line); already in mainline.

### H59. `temp/plugin-bump` — ABANDON
- FQ ref: `refs/heads/temp/plugin-bump` (tip `8b3733b`)
- Presence: local Y | tracking Y (STALE — tracking `5259358` differs from local `8b3733b`, and neither is live) | live-remote N | worktree: none
- Merge-base: `8b3733b` (itself); diffstat empty; behind 74 / ahead 0
- Last commit: `8b3733b` | Clint Morgan | 2026-09-14 (2d) | docs(foreman-line): consolidate foreman-kernel charter and add supercharge carryover
- Unmerged: no
- CI: UNKNOWN (as H01)
- Verdict ABANDON: ancestor of main; already in mainline. (Local tip differs from its stale
  tracking ref; both are non-live and merged, so no divergence question arises.)

### H60. live-remote-only `codex/gmf-p1-shaping-20260916` — ABANDON
- FQ ref: live `refs/heads/codex/gmf-p1-shaping-20260916` (tip `74005ae`; no local branch)
- Presence: local N | tracking Y (`remotes/origin/codex/gmf-p1-shaping-20260916`) | live-remote Y (`74005ae`) | worktree: none
- Merge-base with main: `74005ae` (tip itself = ancestor of main)
- Diffstat vs merge-base: empty; ahead/behind (`git rev-list --left-right --count main...74005ae`): behind 9 / ahead 0
- Last commit: `74005ae` | Clint Morgan | 2026-09-16 (0d) | docs(foreman-line): GMF-P1 shaped spec (draft) + Gate-2 re-pin
- Unmerged: no (0 ahead; content landed via the PR #34 mainline)
- CI: UNKNOWN (as H01)
- Verdict ABANDON: tip is an ancestor of main; shaping content already landed. Remote-head
  deletion is a human Gate action, never the builder's.

### Detached-HEAD worktree groups (13 unique SHAs, 26 worktrees, all FK-P0 round snapshots)

All share merge-base `354940e` with main; all behind 328; each ahead 6–32 with a 32-file
`+200290`–`+457914` diffstat (one at +347116). Surfaces all under `plugins/` (FK-P0
authority-registry round lineage continued by the H12→H13→H14 stack on the same base).
Per-SHA facts via `git merge-base main <sha>`, `git diff --shortstat <mb>..<sha>`,
`git rev-list --left-right --count main...<sha>`, `git log -1 <sha>`:

| ID | SHA | Ahead | Insertions | Last-commit subject/date | Worktree paths (2 each) | Verdict |
|---|---|---|---|---|---|---|
| D01 | `4666ea1` | 6 | +30633 | add FK authority registry / 08-31 | `fk-p0-review-authority-20260831`, `fk-p0-review-coverage-20260831` | ABANDON |
| D02 | `08ebfc6` | 8 | +49068 | harden FK authority registry / 08-31 | `fk-p0-r2-authority-20260831`, `fk-p0-r2-coverage-20260831` | ABANDON |
| D03 | `87237a8` | 11 | +340599 | enforce FK authority semantics / 08-31 | `fk-p0-r3-authority-20260831`, `fk-p0-r3-coverage-20260831` | ABANDON |
| D04 | `f73a384` | 13 | +457914 | enforce FK-P0 R4 authority contract / 08-31 | `fk-p0-r4-authority-20260831`, `fk-p0-r4-coverage-20260831` | ABANDON |
| D05 | `a61eb08` | 15 | +406567 | harden FK authority registry R5 / 08-31 | `fk-p0-r5-contract-20260831`, `fk-p0-r5-coverage-20260831` | ABANDON |
| D06 | `6123474` | 17 | +200290 | enforce curated authority registry R6 / 08-31 | `fk-p0-r6-contract-20260831`, `fk-p0-r6-coverage-20260831` | ABANDON |
| D07 | `5d7ca99` | 19 | +248508 | harden R7 corpus semantics / 08-31 | `fk-p0-r7-contract-20260831`, `fk-p0-r7-coverage-20260831` | ABANDON |
| D08 | `84d5c7c` | 21 | +264815 | complete FK-P0 R8 authority registry / 08-31 | `fk-p0-r8-contract-20260831`, `fk-p0-r8-coverage-20260831` | ABANDON |
| D09 | `89d7e48` | 23 | +265323 | complete FK-P0 R9 authority curation / 08-31 | `fk-p0-r9-contract-20260831`, `fk-p0-r9-coverage-20260831` | ABANDON |
| D10 | `f3366be` | 25 | +347116 | enforce FK-P0 R10 authority registry / 09-01 | `fk-p0-r10-contract-20260901`, `fk-p0-r10-coverage-20260901` | ABANDON |
| D11 | `9059bb2` | 28 | +340303 | enforce R11 authority registry semantics / 09-01 | `fk-p0-r11-contract-20260901`, `fk-p0-r11-coverage-security-20260901` | ABANDON |
| D12 | `0683bc0` | 30 | +326247 | enforce R12 structural canon bindings / 09-01 | `fk-p0-r12-contract-20260901`, `fk-p0-r12-coverage-security-20260901` | ABANDON |
| D13 | `df8155a` | 32 | +386406 | enforce R13 canon audit / 09-01 | `fk-p0-r13-contract-20260901`, `fk-p0-r13-coverage-security-20260901` | ABANDON |

Verdict ABANDON for all D01–D13: superseded round snapshots; their lineage continues through
the H12→H13→H14 stack and the surviving FK-P0 candidates (H14/H17/H19/H54) on the same
surface. Worktree removal is a human Gate action. CI: UNKNOWN (as H01) for all.

## Stale remote-tracking refs (30; labeled STALE, never live truth)

Live `ls-remote` = 14 heads; every live head has a same-named tracking ref. The following
local `remotes/origin/*` refs are absent from live `ls-remote` (owner cleaned the remote
without a local fetch) and are therefore STALE — evidenced by
`Compare-Object (refs/remotes/origin) vs (ls-remote --heads origin)`:

`add-accomplish-skill`, `agent/kpp-001-a-foreman-r3`, `blackboxai/update-gitignore-runtime-artifacts`,
`codex/foreman-line-bootstrap`, `codex/foreman-line-bootstrap-closeout`, `codex/foreman-line-bootstrap-r1`,
`codex/foreman-routing-cerebras-shadow-v2-20260830`, `codex/gmf-p0-discovery-20260904`,
`codex/gmf-p1-contracts-20260916`, `codex/goal-intake-hierarchical-worker-fabric-20260903`,
`codex/parcel-compiler-bootstrap`, `codex/w4-closeout-e6-r1-control`, `codex/w4-closeout-e6-r1-goal-complete`,
`codex/wgt-p0a-foreman-reconciliation-20260801`, `codex/wgt-p0a-stage-f-archive-20260801`,
`docs/foreman-w4-closeout-d4-r1`, `docs/gmf-p1-landed-state`, `docs/ops-console-gate1-grants`,
`docs/p0-stagef-lessons`, `docs/p1-designation-record`, `feat/foreman-line-FL-ASSEMBLY-20260905`,
`feat/foreman-line-supercharge`, `feat/foreman-ops-console-charter`, `feat/nemotron-economy`,
`feat/supercharge-p2`, `fix/marketplace-plugin-versions-069`, `fix/skill-doc-required-sections`,
`fix/skill-validator-green`, `opencode/foreman-routing-policy-openrouter-v0.3-20260903`, `temp/plugin-bump`.

## Collision and dependency notes

- C1 exact-duplicate tip groups (same SHA, from `git for-each-ref` + `git ls-remote`):
  `872d68a` H08/H09; `c961fcd` H10/H11; `0ee1657` H12/H16/H46; `f04fb49` H23-local/H24;
  `5ce6ddc` H48/H49/H50/H51; `6952d63` H32/H33; `cced8e2` H38/H39/H40/H41/H42;
  `c06c1d5` H25/H55; live `2b07a69` = H03 tip = H23-live.
- C2 worker-fabric overlap: H05, H06, H07, H27 share
  `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/` (+ INDEX/kickstarters);
  H07 ancestor of H06 (stack); H05 sibling-overlaps H06 (neither ancestor); H27 older/smaller,
  superseded. H28 (`goals/hierarchical-coordination-sidecars/`) is disjoint — no collision.
- C3 FK-P0 shared surface: H12–H19, H46, H47?, H54, D01–D13 all derive from merge-base
  `354940e` and overlap `plugins/foreman-line/docs` (57–377 files) with H12/H13/H46 also
  touching `plugins/foreman-line/authority-registry` (22 files each for H13/H14-line).
  Stacks: H12→H13→H14 proven by `--is-ancestor`; H18/H19/H54 are siblings (R31→resume false).
- C4 custody overlap: H34/H35/H36/H37 stack into H38 (a3→fixture `--is-ancestor` true, growing
  4→17 files on `goals/provisional-patent-readiness/`); H31 sibling-overlaps H38's 17 files
  (neither ancestor); H39–H42 exact duplicates of H38.
- C5 session-parcel stacks: each `*-shaping` head is either an exact duplicate of its parcel
  branch (H08/H09, H10/H11, H32/H33) or a landed ancestor (H60); no cross-parcel file overlap
  (BRINV-1, EVAL-1, SUPERCHARGE-P3 touch disjoint spec files, evidenced by `git diff --name-only`).
- C6 diverged same-name: H23 local (`f04fb49`, merged) vs live (`2b07a69`, = H03 backup content);
  H59 local vs stale-tracking SHAs differ but both merged — no live question.
- C7 stacked-on-head (not on main): H06 on H07; H13 on H12; H14 on H13; H36→H38 chain.
  Gate-3 must review stack tips only, never mid-stack heads.

## Verdict tallies

- MERGE-CANDIDATE (4): H06, H28, H29, H53
- NEEDS-OWNER-CALL (14): H03, H05, H09, H10, H14, H15, H17, H19, H23, H30, H31, H32, H38, H54
- ABANDON (55): all other rows (41 local + H60 live-only + 13 detached SHAs)
- Total rows: 73. No head carries more or fewer than one verdict.

## Commands run (all read-only, no fetch)

`git status --short --branch`, `git rev-parse HEAD|main|origin/main`,
`git branch -a`, `git for-each-ref refs/heads`, `git for-each-ref refs/remotes`,
`git worktree list --porcelain`, `git ls-remote --heads origin`,
`git branch --no-merged main`, `git branch --merged main`,
per-ref `git merge-base main <ref>`, `git diff --shortstat <mb>..<ref>`,
`git rev-list --left-right --count main...<ref>`, `git log -1 --format`,
`git diff --name-only <mb>..<ref>`, `git merge-base --is-ancestor` (stack proofs),
`git diff --name-only <base>..<tip>` for parcel surfaces.
No checkout/switch/restore-mutating, no fetch/pull/merge/rebase/push/delete/tag/stash/reset/clean,
no worktree add/move/remove, no provider/MCP/network calls. Secret-gated content: none encountered.
