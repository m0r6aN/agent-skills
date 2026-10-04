# W0-P01R-R1 Design Freeze Receipt

Status: **proposed design bytes frozen for owner review; unratified; no execution authorized.**

## Frozen inputs

- Proposed amendment: `amendments/W0-P01R-R1-source-free-attempt-recovery.md`
  - SHA-256: `9DA60F2FA6BC7EB14CCCECC3A1145A1AA791A9AFBC749BE5B7C0B8D0375B7A5B`
- Ended-invalid receipt: `handoffs/W0-P01R-F-ended-invalid-receipt-2026-09-13.md`
  - SHA-256: `DE532CA9E5B621EE727CD7AB962C494FCA62ADD37477215071DDAF1DBE1E1BC2`

## Scope delta from the earlier failed F attempt

- Proposes, but does not authorize, a new named R1 worktree and three maximum fresh source-free attempt roots.
- Preserves the rejected R0 script and failed synthetic fixture unchanged; R1 never reuses them.
- Binds any later S invocation to the one accepted R1 `attempt-NN/script-snapshot.ps1` (`NN` only `01`, `02`, or `03`) and the identical SHA-256 in both F reviewer `ACCEPT`s; it never invokes R0.
- Separates coordinator setup/checkpoints, dispatched builder evidence production, and independent read-only review. The coordinator's R0 rejection is repair input, not either required F `ACCEPT`.
- Adds immutable per-attempt harness/snapshot/receipt requirements, pre-mutation validation, and complete F/S evidence requirements. No extra human gate is inferred for a compatible routing-policy refresh or an ordinary bounded synthetic failure.

## Preservation method

The two frozen hashes were calculated by direct reads of the two documentation files only. This freeze did not enumerate, recurse through, hash, alter, or follow either synthetic fixture reparse point; it did not touch the ended-invalid fixture root, any prior partial root, a protected source, source Git metadata, or the conditional S output root. No setup, retry, source read, staging, commit, remote operation, filing, payment, disclosure, or counsel action occurred.
