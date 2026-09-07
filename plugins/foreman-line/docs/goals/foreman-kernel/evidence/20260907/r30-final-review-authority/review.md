# Independent final authority review: FK-P0 R30

Verdict: **APPROVE the R30 candidate against its adopted source snapshot. No P0, P1 or P2 findings identified.** This is an independent code-review verdict; current-main integration and human Gate3 remain outstanding.

Reviewed subjects:

- Final candidate/evidence HEAD: `c35ff72ef45fb19d647cede6acf5a13636911db7`.
- Tested package subject: `f8093410cead451f204d08ae25f3a70b34208213`; verified no package diff from that commit to HEAD.
- Test checkpoint: `9b4de111e78bd6682cf7c2d64989bd4adf803dce`.
- Runtime checkpoint: `446700d47c2e162fcfa575d5a46b9247241a59c1`.
- Adopted governed source: `65c471416e4a3916695815e951ffbe389288560e`.
- Full delta baseline: `0ee165720f8d1e3a91eb283cb770400b23f61bf5`.
- Prior registry-changing commit used for historical preservation: `66a514d35a384f901486e7b814580eb6fb7de6ea`.

I applied the repository's `code-review-and-quality` skill. Review covered all nine changed package files, R30.1-R30.9, implementation rulings, the source-authored mapping and expectation documents, actual charter/loop source, final handoff, adoption delta and final verification evidence. Prior review approvals were treated as provenance.

The implementation's finite trusted mapping is consistent with the reviewed source meaning. The new INF duties preserve platform proof, storage placement, antivirus/operator authority, verification independence, both latency spans and the hard deadline, honest measurement, exhaustive corpus treatment, recovery ownership and affected-parcel dependencies. The nine event/permission components are expressly noncontrolling provenance. No added ALLOW or protected-operation authority change was found.

The critical enforcement path is sound on inspection:

- `src/validate.ts:2267` checks required reserved identities independently of their complete shape.
- `src/validate.ts:2280` checks pinned source values, recomputed normalized excerpts, locators and exact reciprocal membership.
- `src/validate.ts:2312` compares each reserved rule's full shape. A changed reserved entry produces an authority-semantic violation even when ordinary assurance would otherwise be acceptable.
- The basis/reference correspondence paths remain conditional on exact rule and actual pinned item matches. Their exceptions do not replace the designated basis with corroboration or grant unrelated legacy rules paraphrase/suffix exceptions.
- Resolver eligibility at `src/validate.ts:1410` excludes narrative provenance; controlling tier selection uses `authorityBasisRef`, not the highest corroborating reference.
- `src/generate.ts:12960` copies the prior reconciliation sequence canonically and appends the named adoption record. Former-head history and future-demotion pins are retained.

I found meaningful preservation of legacy coverage. The changed historical tests explicitly load committed baseline data while retaining current legacy checks. The changed head tests follow the new shipped identity and preserve the old records. The independent Markdown-derived oracle checks all 72 complete shapes and exact basis/reference tuples; reciprocal membership is compared against historical links plus the independently specified additions. The existing negative controls are supplemented rather than replaced by a count assertion.

Independent verification performed during this review:

| Check | Direct result |
|---|---|
| Candidate status before and after review | Clean |
| Working source bytes versus actual `65c` Git blobs | All 18 equal |
| Evidence manifest working-byte hashes | All 96 equal |
| Evidence manifest hashes versus actual HEAD Git blobs | All 96 equal |
| Complete run39 log parsing | 686 tests, 686 pass, zero fail/cancel/skip/TODO; no `not ok` |
| Run39 completion | Terminal `DIRECT_EXIT=0` and metadata `directExit: 0` |
| Final install/typecheck/Biome/validate/sweep/two generation metadata | Direct exits 0 |
| Markdown oracle versus adoption-delta statements/subjects/claims | All 72 equal |
| Bounded Node validation | Valid |
| Canonical old reconciliation sequence | All 19 preserved |
| Protected-operation matrix and complete ALLOW set | Unchanged |
| Repaired stronger-assurance mutations | All 72 refused with reserved-R30 `AUTHORITY_ESCALATION` |
| Applicable isolated provenance queries | All 9 returned `NO_APPLICABLE_AUTHORITY`, no controlling rules |

The independent delta check confirmed 58 added items, no removed items, two changed item values, 72 added rules and 53 added audits. Inspection of the reference oracle and generated membership supports the 67 corroboration edges: 57 to L5, nine to D21 and one to L4.

The captured bounded Node probe ran from `D:/Repos/agent-skills-worktrees/fk-p0-r30-adoption-20260907/plugins/foreman-line/authority-registry`. Its exact stdin body is persisted in `probe.mjs`. The actual PowerShell command was a single-quoted here-string containing exactly that body, piped into `& 'D:/nodejs_symlinks/node.exe' --import tsx --input-type=module`, followed by `Write-Output "DIRECT_EXIT=$LASTEXITCODE"`. The complete expanded command is recorded in `metadata.json`; the raw captured text is in `probe-output.log`. Imports resolve against the package working directory through stdin; do not execute the evidence-directory file directly as though its relative imports resolve there.

Captured result, exec session `97101`:

```text
{"valid":true,"history":19,"protectedAuthorityUnchanged":true,"allowSetUnchanged":true,"repairedAssuranceRefusals":72,"noncontrollingProvenance":9}
DIRECT_EXIT=0
```

The Node window was released to the coordinator immediately after this captured completion. An earlier bounded invocation's completion output was not retained by my wrapper; I do not count it as verification evidence. The reported Node result comes from the subsequent explicitly captured invocation.

Read-only candidate scope was preserved: no candidate/source/evidence edits, installs, generation, long suites, commits, pushes or merges during review. I did not independently rerun the full deterministic chain; its complete committed logs, direct exits and byte custody were reviewed and independently checked. The review establishes R30 correctness within the adopted `65c` subject. It does not establish compatibility with main `476b8df6efe6c9974879957147449f61c34cd9a0`, whose governed-source changes require the separate R31/integration work, and it does not authorize merge or satisfy human Gate3.

Persistence note: after returning the review, the coordinator explicitly authorized writing this report, exact probe body, copied captured output and metadata only into its separate `evidence/20260907/r30-final-review-authority/` directory. No probe was rerun for persistence. No candidate file was changed. Persistence time is distinct from the probe observation time, whose exact UTC timestamps were not retained. The preserved output is a copy of tool-captured text, not a newly obtained result or an original redirected byte stream.
