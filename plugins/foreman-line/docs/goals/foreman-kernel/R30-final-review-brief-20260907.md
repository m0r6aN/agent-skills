# R30 final independent review brief

Dispatch this review only after the complete deterministic chain has a direct successful exit and evidence is published. At preparation time the chain is still running; this document is not a review verdict.

Implementation checkpoint:446700d47c2e162fcfa575d5a46b9247241a59c1 on codex/fk-p0-r30-adoption-20260907. Adopted source:65c471416e4a3916695815e951ffbe389288560e. Baseline implementation:0ee165720f8d1e3a91eb283cb770400b23f61bf5; prior registry-changing commit:66a514d35a384f901486e7b814580eb6fb7de6ea. Final evidence commit is supplied at dispatch and must preserve this code or explicitly identify a tested replacement.

Two fresh independent reviewers each inspect the complete nine-file implementation delta, current R30.1-R30.9 contract, exact source mapping and final evidence. Reviewer one emphasizes source/authority semantics; reviewer two emphasizes identity/history/migration and bypass. Both retain whole-change responsibility. Prior plan/source/mapping approvals are provenance, not final implementation reviews.

Review the nine changed package files: README; generated registry and pass fixture; src/generate.ts, registry.ts, validate.ts; tests/corpus-sweep.test.ts, parity.test.ts, semantic-invariants.test.ts. Preserve exact28 Allowed Files and unchanged supporting packages, dependency lock, schema and operationAuthority. Inspect the full source-level delta from baseline, not just tests or generated totals.

Check independently that:

- All adopted normative source units are covered with correct meaning, authority basis, sourceRefs, scope and assurance; nine event/permission facts remain noncontrolling provenance and cannot grant authority.
- All72 reserved shapes and exact expected sets fail closed on substitution/removal or any changed axis, including repaired incidental digests. No legacy fallback admits reserved mismatches. Curation correspondence is finite per approved edge, not generic paraphrase matching; corroboration never replaces basis.
- All67 reciprocal citation links exist with exact expected membership. Their presence does not elevate L4/L5 provenance into controlling authority. Single-component suffix exceptions bind exact item/rule shape; unrelated legacy rules retain ordinary checks.
- Original19 reconciliations remain canonically identical, only the reviewed migration is appended, pins and required head survive future demotion, and orphan/fork/cycle/deletion/Git-reference/second-unregistered-append attacks refuse.
- Governed mutation still fails while only declared operational changes survive masking; source-derived IDs remain stable and no new clause can be laundered into a volatile region.
- Full baseline coverage remains meaningful. Expected686tests=597baseline+79semantic+10corpus; count alone proves nothing. Inspect weakened assertions, fixture substitutions and negative controls independently. Complete logs/direct exits/source and generated hashes are required.

Reviewers do not edit candidate code or source documents, commit, push, merge, install dependencies or run long suites. Any bounded in-memory Node probe must be explicitly serialized by coordinator after the builder chain; output the command and direct result. Avoid writer access to candidate files. Report exact reviewed code/evidence SHAs, substantive findings with paths/lines/reproductions, unavailable proof, verdict and whether your read-only scope was preserved. Do not manufacture a pass from the earlier baseline, focused suite or this brief. Human Gate3 remains separate.
