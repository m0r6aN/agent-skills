# W0-P01R-R1 Attempt-01 Control-Lane Diagnosis

Status: **read-only diagnosis; R1 remains stopped; no F acceptance or S authority.** No candidate, harness, source, fixture, or prior evidence was modified to prepare this record.

## Exact contract provenance

The distinct builder reports these are the only local contract inputs it actually read:

| Input | Direct builder observation |
|---|---|
| `amendments/W0-P01R-R1-source-free-attempt-recovery.md` | Read in full with `Get-Content -Raw`; SHA-256 `9DA60F2FA6BC7EB14CCCECC3A1145A1AA791A9AFBC749BE5B7C0B8D0375B7A5B`. |
| Current main routing policy | Read through `git -C D:/Repos/agent-skills show HEAD:plugins/foreman-line/routing-policy/routing-policy.yaml`; blob `83370d6142ae381fa068469f01e3ddc86edd031a`. |
| Parent/coordinator messages | Read, including ratification and checkpoint instructions; messages are not a disk contract artifact. |
| R1 freeze receipt, R1 ratification receipt, predecessor W0-P01R design, A1/A2/A3 amendments | **Not read by the builder from disk.** |
| Protected/prior sources or source Git | **Not directly read.** |

For this diagnosis, the control lane separately read these inherited contract sources, without accessing protected sources:

| Source | SHA-256 |
|---|---|
| `parcels/W0-P01R-custody-tool-design.md` | `F2805EBBE6362C62FC5E8FCA2147B5DFBB72DB673D2E9422919E7E690C50A0DB` |
| `amendments/W0-P01-A1-reparse-point-custody.md` | `EB9FBB04A1D2B155763EAAC2A79EE8931F37568A81D467604803303C7F4633C3` |
| `amendments/W0-P01-A2-powershell-compatible-retry.md` | `3CEFF6E8E86E2D8BF0C1CC1C6B4F9A067B5C4633DDAD5CD9D274820D3FF73A4C` |
| `amendments/W0-P01-A3-payload-hash-initialization.md` | `78D8E48FAFAD70E0E9CD0769E283CC415600269654714D7335E67E362059EC66` |
| `parcels/W0-P01-custody-snapshot.md` | `74DF881AB53395F07419BC7D4B71752605C9729F2887C0370AC1052B8F65F8C2` |

## Observed attempt state

The external stop receipt records the exact candidate invocation and its incomplete tool result. Direct non-recursive checks confirm no `captures/success-a/`, `failure-receipt.json`, or `success-receipt.json` exists. The harness has only `Initialize` and `Finalize` phases; it has no child-candidate execution wrapper, no `try`/`catch`, and no failure-receipt writer. Thus the missing receipt is an implementation omission, not merely an uncertain interpretation of the empty tool result.

The distinct builder wrote only the allowed R1 worktree script and the permitted attempt-01 regular artifacts/synthetic fixture. It did not access protected sources, source Git, R0, prior partial roots, or a remote; it did not stage or commit. The coordinator did not build or invoke the candidate.

## Root cause and static defects

1. `Assert-OutputPath` trims volume root `D:/` to `D:`. `GetParent('D:')` is drive-current-directory dependent. A bounded in-memory probe observed `D:/synthetic-proof -> D: -> D:/Repos -> D:` and a cycle at step 4. The probe did not invoke the candidate or fixture.
2. The harness initializes evidence but never executes, bounds, captures, catches, or finalizes the four child candidate processes. No outcome receipt can be guaranteed on child failure, tool interruption, or a missing tool exit status.
3. The candidate's build-ephemera exclusion list diverges from ratified A1: it adds `.cache`, `__pycache__`, `.pytest_cache`, and `build`, while omitting ratified `.next`, `.artifacts`, `.vs`, `packages`, `.turbo`, `.nuget`, and `TestResults`. The original W0-P01 parcel separately prohibits copying `.git`; obeying that separate rule is not the defect.
4. The candidate replaces the required entry and stop envelope with reduced `kind`/`sha256` records. It does not preserve the full required manifest fields, including entry type, classification, traversal state, byte length, source/payload hashes, copy result, and applicable exclusion/link metadata.
5. The success fixture lacks the required external junction; the alleged internal-link case uses an external referent rather than an in-source target.
6. Prospective S does not bind selected attempt identity and the two F review-record digests. Its local Git status path lacks `GIT_OPTIONAL_LOCKS=0` protection.
7. The builder did not read the original W0-P01 parcel, A1/A2/A3, or W0-P01R design from disk before implementation. Its candidate therefore cannot be treated as having been checked against the inherited contract bundle.
8. The actual builder dispatch inherited `gpt-5.6-terra high` from a `gpt-5.6-terra high` parent through `model=null` and `fork_turns=all`. The separate routing-mismatch receipt records the source task's turn-metadata observation. Reading a frontier allowlist did not establish an actual frontier builder.

## Consequence

R1 is stopped and preserved. The first candidate result is not certified as a timeout, termination, or successful process completion because the tool returned no exit code or session ID. The missing durable outcome record, independent of that uncertainty, prevents acceptance. Repair requires a new, complete, owner-reviewed recovery decision; no retry or candidate edit is authorized by this diagnosis.
