# FK-P0 Round 6 unchanged-candidate verification handoff

The sequential baseline chain PASSED on 2026-09-07 at exact candidate `0ee165720f8d1e3a91eb283cb770400b23f61bf5`. This is deterministic builder evidence, not independent-review acceptance or Gate 3.

- Execution worktree: `D:/Repos/agent-skills-worktrees/fk-p0-recovery-20260907`.
- Branch: `codex/fk-p0-recovery-20260907`.
- Starting and ending HEAD: `0ee165720f8d1e3a91eb283cb770400b23f61bf5`.
- Authority: coordinator execution ruling at `622c934`, with the exact 28-path package ceiling and separate evidence-only authority for this directory.
- No repair, candidate edit, source-snapshot update, source integration, commit, push, merge, or process termination occurred. Installation created ignored dependencies only. This run did not consume the newer September 7 charter/source bytes.

## Direct command results

Every row has complete separate `<step>.stdout.log` and `<step>.stderr.log`, `<step>.metadata.json` containing command, exact HEAD, timestamps, measured elapsed time, direct exit and stream hashes, plus `<step>.exit.txt` containing the direct completion marker. `run-command.ps1` is the exact capture wrapper. Its invocation uses native `npm.cmd`/`npx.cmd` under PowerShell.

| Step | Command | Direct exit | Elapsed ms |
|---|---|---:|---:|
| 01-node | node -v | 0 | 245 |
| 02-install | npm ci | 0 | 13436 |
| 03-typecheck | npx tsc --noEmit | 0 | 2194 |
| 04-test | npm test | 0 | 1310645 |
| 05-biome | npx biome check . | 0 | 1421 |
| 06-validate | npx tsx src/cli.ts validate authority-enforcement-registry.yaml | 0 | 2136 |
| 07-sweep | npx tsx src/cli.ts sweep authority-enforcement-registry.yaml --repo-root ../../../ | 0 | 10455 |
| 08-generate | npm run generate | 0 | 6268 |
| 09-status | git status --porcelain=v1 | 0 | 130 |
| 10-scope | git diff --name-only 51857a3a7796b393c0c0a68712f98c06e7015d79...HEAD | 0 | 1359 |

Node was v24.7.0. Installation reported 15 packages added, 16 audited and zero vulnerabilities. Biome checked 15 files, applied no fixes, and returned 5 informational diagnostics; full diagnostics are preserved.

## Full suite and required controls

`04-test.totals.json` aggregates every per-file TAP summary: **597 tests, 597 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo, zero not-ok lines**. The direct suite exit is 0. Total wall time was 21 minutes 50.645 seconds.

| File, serial execution order | Tests/pass | Fail |
|---|---:|---:|
| bare-specifier.test.ts | 1 | 0 |
| corpus-sweep.test.ts | 127 | 0 |
| dependency-allowlist.test.ts | 1 | 0 |
| parity.test.ts | 5 | 0 |
| schema-validation.test.ts | 23 | 0 |
| semantic-invariants.test.ts | 440 | 0 |

The 597 total is the historical 583 baseline plus 14 named corpus tests: 3 R29 assertions and 11 R27 control/probe tests. `04-test.added-test-names.txt` preserves their names from the candidate diff against recovery baseline `249903529d2f25aa99617de370a0e3738dab02cf`. This exceeds the recovery floor of 596 without removing tests.

Evidence locations below refer to `04-test.stdout.log` line numbers:

| Obligation | Explicit passing evidence |
|---|---|
| R29.3 all curation surfaces anchor-keyed, no item-ID fallback | 701 |
| R29.4 authorization 8 exact pre-action refusal contract, 469 rules | 707 |
| R28/R29 surviving identity and locator invariants, one removal/addition, one ownership value change | 713 |
| (a) volatile mutation/non-displacement; declaration deletion | 719, 725 |
| (b) governed ownership VALUE_DIGEST_MISMATCH; binding deletion | 731, 737 |
| (c) anti-laundering overlap refusal | 743 |
| (d) independent region audit; production predicate forced false | 749, 755 |
| (e) generator bytes identical under every-region mutation | 761 |
| (f) zero/duplicate heading exact refusal messages | 767, 773 |
| (g) eight curated pre-excision prose rationales | 779 |
| CLI validate/sweep exit 0 | 869 |
| CLI bad invocation and unreadable input exit 2 | 875 |
| Named negative CLI fixtures exit 1 with specific codes | 935, 941, 947, 953, 959, 965, 971, 977 |

Negative fixture codes observed through those passing assertions: stale binding/MIGRATION_EVIDENCE_INVALID; identity and location/LOCATOR_DIGEST_MISMATCH; value and desynchronised value/VALUE_DIGEST_MISMATCH; duplicate/RULE_DUPLICATE; contradiction/RULE_CONFLICT; missing source/RULE_SOURCE_MISSING. No duplicate focused run was necessary.

## Registry and generator evidence

Both `06-validate.stdout.log` and `07-sweep.stdout.log` report valid=true, zero violations, source snapshot `5f9cf65eec98f5496202639007205da81ef1c34d`, 18 sources, 1525 items, 469 rules, and zero unresolved active conflicts. Classification counts are 255 pre-action-refusal, 8 post-action-detection, 78 ci-static-check, 15 independent-review-human-judgment, 100 narrative-provenance and 13 unsupported. The pre-existing `missing-provenance-reference` reconciliation remains explicitly open; other scoped resolutions and migration statuses are listed in the complete JSON. No retirement or provenance closure is claimed.

The generator exited 0 and all three generated artifacts remained byte-identical, as recorded by `08-generate.before-sha256.csv` and `08-generate.after-sha256.csv`:

- Registry YAML and pass-minimal.yaml: `E1A5B9B0C2CB3C92B7591C5F4E24B233E8402FD91848256E83ADBF2C2CC5DD13`.
- Schema JSON: `B679A496254DCAA88DA68A884ABFE0AC436F6481B2B7C59AA0E1DB133120D31C`.

The temporary volatile-mutation generation control also passed independently as a suite case.

## Exact scope and preservation

`baseline-tracked-sha256.csv` and `final-tracked-sha256.csv` cover 991 tracked files. Every final hash equals its initial hash, including governed sources and package-lock. `final-integrity.json` records zero changed tracked hashes, unchanged HEAD, three identical generated artifacts and empty final status. `09-status.stdout.log` is empty.

The raw historical diff is preserved without filtering in `10-scope.stdout.log`: 65 paths, comprising 22 inherited package paths and 43 inherited coordinator/repository paths. `10-scope.provenance.csv` separates those categories. These are inherited changes already present at candidate HEAD, not mutations performed by this baseline run and not an assertion that all 65 fall within builder Allowed Files. Existing tracked `tests/support/assert-ok.ts` remains outside the 28-file editing ceiling and was untouched. No tracked mutation inside or outside the ceiling was introduced by this run.

## Capture behavior and timing

The wrapper redirects native stdout/stderr to separate files and records the immediate process exit before any subsequent native command. During the first long file, PowerShell/native and Node per-file TAP buffering left stdout at zero bytes; after corpus completion the stream flushed to 32768 bytes and ultimately all 3646 lines were captured. Complete output and a direct exit are now present; no green result was inferred from interim logs.

Per-run OS-temp progress logs were copied to evidence during execution. They record attempted completion in a finally block, not passing status. Corpus finished in 667501.5218 ms; semantic-invariants in 600154.2644 ms. The unrestricted five-axis hard-rule-10 test caused a multi-minute interval without a completed-test update, then advanced normally. No known fast-fail crash, timeout, retry or kill occurred. Historical progress snapshots may stop before the final attempt; the final `04-test.corpus-progress.log` and `04-test.semantic-progress.log` copies and complete TAP are authoritative for this run's captured progress/output. The `.running.json` files are immutable start records, superseded by `.metadata.json` and `.exit.txt`, and do not mean a process remains active.

## Next action and limits

The unchanged baseline is ready for coordinator consumption and two fresh independent reviews. It is not a finding disposition for any newer source/charter integration and cannot transfer green evidence to changed inputs. Any later integration must receive its own scope ruling and measured verification. No source-authority, Gate 3, acceptance, or merge decision is supplied by this report.

Evidence files are not committed by the builder; the coordinator owns staging/publication. No repair was required and no failure remains from this deterministic baseline chain.
