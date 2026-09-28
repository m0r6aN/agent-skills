# W0-P01R-R2 pre-setup absence and preservation receipt

Recorded at: 2026-09-13 17:28 UTC, **before** any R2 worktree-add command.

Authority: the separate actual human-ratification receipt `W0-P01R-R2-ratification-receipt-2026-09-13.md`, SHA-256 `29CB6A8AA96AC8F59EE0CCA6308D0EAE346D316D660EA3114331812D6B02D275`, binds the frozen R2 packet SHA-256 `0346B9CD68B05D302F226092DA211D076C6F06EBEA5A4A78A5A5A1109ED45694`. No packet bytes were changed for setup.

## Exact read-only pre-setup observations

| Check | Observation |
|---|---|
| Local pinned base `cced8e20c8deb2eb21fb5ac242e65cebd3b2c322` | `git cat-file -t` returned `commit`. |
| `refs/heads/codex/w0-p01r-r2-fixture-20260913` | Absent (`git show-ref --verify --quiet`). |
| `D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01r-r2-fixture-20260913/` | Absent on disk and absent from `git worktree list --porcelain`. |
| `D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r2-fixture-proof-20260913/` | Absent. |
| Conditional S root `D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260913-w0-p01r-source-capture-01/` | Absent. |
| Parents `D:/Repos/agent-skills-worktrees/` and `D:/Repos/keon-omega-preserve/` | Existing, neither has the reparse-point attribute. No target was resolved or traversed. |
| R1 worktree | Still branch `codex/w0-p01r-r1-fixture-20260913`, HEAD `cced8e20c8deb2eb21fb5ac242e65cebd3b2c322`, status only `?? tools/w0-p01r-fixture.ps1`. |
| R1 frozen evidence | Direct `Get-FileHash -LiteralPath` rechecked 29 specifically named regular artifacts from R1 attempts 01/02/03 against recorded SHA-256 baselines: **29 matched, 0 mismatches**. No recursive enumeration or junction traversal was used. Key attempt-03 hashes remain snapshot `4567E48C273510FE243A17524154544C6BE6FDC7884DE484061FD14277A7189A`, harness `4A38FB51B5689284B3F2FD0AC592BA9B1EA05BDA03FDD2332EC8E3A3A28FFFE8`, success receipt `B388A5C69BB7F488B3FFDB1EEBA091DC4C2CAD56761CD03587F5E9A9F569B0B6`. |
| Final two R1 F verdicts | Preserved local verbatim-verdict file SHA-256 `9AC72E0BFD15AE148AD77C6539D0216652DDC7CE7E2E87E95C117748F3BFD288`; one ACCEPT and one REJECT, not two accepts. |
| Fixed R1 and R2 F-accept JSON paths | Both A/B pairs absent; no review ACCEPT transcriptions exist. |
| Current routing policy | `D:/Repos/agent-skills` **main** policy blob `83370d6142ae381fa068469f01e3ddc86edd031a`; read-only policy check, not builder dispatch evidence. |

This check did **not** enumerate or read the protected patent/doctrine source roots or their `.git` metadata. It did not inspect R0 or earlier partial roots: those are forbidden to this F control lane and are preserved by no-write scope plus their earlier receipts, not by a fresh direct byte claim here. No source, prior-root, Git, remote, filing, or payment mutation occurred. The above observations are sufficient only for the narrow ratified R2 local worktree setup; they do not constitute F/S acceptance, source capture, or filing readiness.

## Sole next authorized setup command

Only after this create-once receipt is persisted and rehashed may the Coordinator run the packet's exact local Git administrative command:

```powershell
git -C "D:/Repos/agent-skills-worktrees/provisional-patent-readiness-20260813" worktree add -b "codex/w0-p01r-r2-fixture-20260913" "D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01r-r2-fixture-20260913" "cced8e20c8deb2eb21fb5ac242e65cebd3b2c322"
```

No R2 fixture root or attempt may be created during setup. After successful setup, a **new distinct** actual-frontier builder performs only read-only R2 Step 0 and stops for a separate Coordinator attempt-01 checkpoint before any candidate edit or attempt-root materialization.
