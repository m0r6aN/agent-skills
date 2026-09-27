# Independent final history and migration review: FK-P0 R30

Verdict: APPROVE R30 for the explicitly adopted `65c4714` source snapshot. No P0, P1, or P2 findings. This is an independent final code-review verdict, not human Gate 3 approval, merge authorization, or current-main integration acceptance.

Reviewer: `/root/r30_final_history_review`.

Reviewed identities:

- Final candidate/evidence: `c35ff72ef45fb19d647cede6acf5a13636911db7`
- Tested package checkpoint: `f8093410cead451f204d08ae25f3a70b34208213`
- Test-source checkpoint: `9b4de111e78bd6682cf7c2d64989bd4adf803dce`
- Runtime checkpoint: `446700d47c2e162fcfa575d5a46b9247241a59c1`
- Adopted sources: `65c471416e4a3916695815e951ffbe389288560e`
- Review baseline: `0ee165720f8d1e3a91eb283cb770400b23f61bf5`
- Prior registry: `66a514d35a384f901486e7b814580eb6fb7de6ea`

I inspected the complete nine-file package delta, current R30.1-R30.9 contract and corrections, source expectations/mapping, coordinator review brief, final handoff, adoption delta, manifest, complete run39 stream, and metadata. Package diff from tested checkpoint to final HEAD is empty.

The generator's preservation strategy is sound: it reads the exact committed prior registry, clones its reconciliations, and appends one adoption record. Independent Python/YAML comparison confirmed all 19 old records remain identical in complete canonical structure. The former head's canonical SHA256 is `307a1b563240107c5a12610e18b340e66f3be0621e6bc30b438ae79af91b4bfd`; the new head's is `6d39f17f70b25ce44030e729c62d975b45a8597b99af8c22f19c6a3cbfba92d7`. Both agree with their validator pins. The former head is required and historical; the new head is required and gains its canonical pin upon demotion.

Independent comparisons also confirmed:

- All 18 working source files exactly match the adopted snapshot's Git blobs.
- `operationAuthority` and `volatileRegions` remain structurally unchanged.
- Exactly 58 added inventory items; no removed items or changed locator identities.
- Exactly two changed legacy inventory values: `fk-charter:item.d21` and `fk-charter:item.131a7863b940`.
- A separate Markdown parser recovered all 53 reviewed source-unit pins and checked all 72 designated bases and ordered reference sets against generated YAML. All 67 corroborating links were reciprocal.
- Reserved rules require complete exact shapes; mismatches cannot regain acceptance through legacy assurance or statement correspondence. The new correspondence remains conditional on the actual pinned inventory item, recomputed excerpt/locator digests, and reciprocal membership.
- Existing volatility controls continue exercising the adopted sample. The new continuation clauses remain outside the three unchanged volatile extents. Historical R28/R29 assertions now explicitly read their committed subject; legacy rules on the current sample retain strict literal/corroboration expectations.

All 96 evidence files independently matched both their working-byte and HEAD Git-blob SHA256 manifest entries. Parsing all six file summaries in the full run39 stream yielded 686 tests, 686 passes, and zero failures, cancellations, skips, or todos. The stream terminates with `DIRECT_EXIT=0`; metadata independently records direct exit zero. Failed run26 and canceled run33 remain failure/cancellation evidence.

The coordinator granted one exclusive Node window. I ran one bounded, in-memory stdin probe using existing dependencies. Its exact original executable JavaScript body is preserved in `probe.mjs`; its original raw captured output is in `probe-output.log`. The original command was a PowerShell single-quoted here-string containing that body, piped to the following invocation, then an immediate direct-exit capture:

```powershell
'@ | & 'D:/nodejs_symlinks/node.exe' --import tsx --input-type=module -
Write-Output "DIRECT_EXIT=$LASTEXITCODE"
```

The complete original command, including the opening here-string and full body, is recorded in `metadata.json` as `actualCommand`. The body was executed through stdin from `D:/Repos/agent-skills-worktrees/fk-p0-r30-adoption-20260907/plugins/foreman-line/authority-registry`; it was not executed from its later evidence-storage location. No probe was rerun during evidence persistence.

Direct results, measured by the command tool: 2.8047375 seconds.

| Probe | Result |
|---|---|
| Shipped positive control | Valid, zero violations |
| Delete former head | Refused: required `registry-rework-40394be` missing |
| Rewrite former head | Refused: canonical record manifest mismatch |
| Delete current head and reanchor promoted record | Refused: historical pinned record cannot become chain head |
| Fabricate unbound current-head Git reference | Refused: reference neither prior-command-bound nor current snapshot |
| Current-head self-cycle | Refused: chain contains a cycle |
| Fork from same predecessor | Refused: chain forks |
| Single well-formed successor | Valid, zero violations |
| Rewrite R30 shipped head after future demotion | Refused: canonical record manifest mismatch |
| Second unregistered successor | Refused: first unregistered successor lacks canonical record binding |

Terminal output: `INDEPENDENT_PROBES=10 PASS` and `DIRECT_EXIT=0`. The Node window was explicitly released afterward. Exact UTC probe start/end were not captured; the persistence timestamp must not be interpreted as probe time.

The limitations remain the documented contract boundaries. The hermetic validator does not independently authenticate the current head's Git commit-object digest. A single properly formed successor can describe an amended registry; that admission is deliberate and preserves history, while a second unregistered successor is refused. Git custody, actual authorization, independent review, and human gates remain external obligations. Nine event/permission records remain noncontrolling provenance; their stored ADVISORY values do not create resolver grants.

Current main `476b8df` changes governed source bytes, including standing constraint 14. This review supplies no compatibility proof for those later sources. R31/current-main reconciliation remains a separate integration dependency.

Final candidate integrity after probes: HEAD remained `c35ff72ef45fb19d647cede6acf5a13636911db7`, porcelain status was empty, tested-to-final package diff remained empty, and all 96 evidence working hashes remained unchanged. I made no candidate/source/evidence edits, report writes, commits, pushes, merges, installations, or long-suite executions during review. After delivering the verdict, the coordinator explicitly authorized persistence of this complete report and original probe body/output into this coordinator-owned evidence directory only. That later persistence does not change the read-only candidate review scope.
