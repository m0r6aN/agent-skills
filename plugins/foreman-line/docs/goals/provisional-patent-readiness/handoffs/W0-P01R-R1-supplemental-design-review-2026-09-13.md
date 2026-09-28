# W0-P01R-R1 Supplemental Design Review

Status: **control-lane design review complete for owner decision; not ratification, F acceptance, S acceptance, or filing readiness.**

## Reviewed bytes and authority

- Proposed supplemental ruling: `amendments/W0-P01R-R1-supplemental-recovery-ruling-draft.md`, SHA-256 `1DB7203CD6CE0A0DC0DF9E7E44B3B8BFD2B478CEF8B031363A3C081223FB54CA`.
- Ratified R1 base contract: `amendments/W0-P01R-R1-source-free-attempt-recovery.md`, SHA-256 `9DA60F2FA6BC7EB14CCCECC3A1145A1AA791A9AFBC749BE5B7C0B8D0375B7A5B`.
- Inherited source contracts reviewed in full: original W0-P01 parcel (`74DF881AB53395F07419BC7D4B71752605C9729F2887C0370AC1052B8F65F8C2`), A1 (`EB9FBB04A1D2B155763EAAC2A79EE8931F37568A81D467604803303C7F4633C3`), A2 (`3CEFF6E8E86E2D8BF0C1CC1C6B4F9A067B5C4633DDAD5CD9D274820D3FF73A4C`), A3 (`78D8E48FAFAD70E0E9CD0769E283CC415600269654714D7335E67E362059EC66`), and replacement W0-P01R design (`F2805EBBE6362C62FC5E8FCA2147B5DFBB72DB673D2E9422919E7E690C50A0DB`).
- Observed attempt/runtime evidence: external stop receipt, control-lane diagnosis, separate routing-mismatch record, and append-only runtime correction. The runtime correction SHA-256 is `F345DE3F5EC1D78B03583364F43F419B1089F2E21BBB42CC388F366705ECBD0C`.

## Review result

The narrow proposal uses only existing R1 attempt-02/03 names and the existing worktree/fixture/source-output roots. It explicitly counts attempt-01 as failed without rewriting its evidence or inventing a harness receipt. Its fallback receipt applies only when a wholly synthetic harness failure prevents the harness's own receipt; it cannot clear a source, scope, authority, security, or S stop.

The correction map covers the observed volume-root cycle; full child-process result propagation and bounded owned-child handling; parser/schema preflight; fixture-subroot absence; exact A1 12-name exclusions; separate `.git` omission; full ordered entry and stop envelope; external/internal synthetic junction topology; common F/S core; deterministic manifest/sidecar comparison; original copy-only inventory, Git-classification, ACL, count, and hash evidence; and conditional S review-record binding. The exact R1 S command retains its two source roots, output root, and arguments. The path-escape command's `CaptureRoot` is interpreted as the stem for the inherited `expected/path-escape-stop.json` result.

The proposal records the actual standard-tier inheritance on attempt-01 and requires verified native frontier model/effort metadata for any later builder and both fresh F reviewers. Merely reading current routing policy is insufficient. A static review of these proposed corrections is not either of the two later F `ACCEPT`s.

## Remaining decision and handoff

The supplemental ruling is unratified. R1 stays stopped, attempt-01 stays preserved, F has zero acceptances, and S has no authority. The next safe action is company-coordinator review of the exact proposed SHA-256 followed by an owner decision on that exact text. Only a ratified ruling could permit a new Step 0 for existing attempt-02; a distinct builder must stop for its coordinator checkpoint. Do not modify attempt-01, R0, any earlier partial root, protected sources, source Git, or the conditional S output root.

This review read control-lane contracts and receipts only. It did not invoke the candidate, run a fixture, inspect protected-source content, or contact a remote.
