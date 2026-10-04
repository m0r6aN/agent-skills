# CI-P1 — live demo log (AC6, post-merge demo PR)

**Context:** PR #124 merged to `main` @ `91d708b` (base GREEN — three consecutive successful `main` runs after the package-matrix fixes). AC6's live demos run on this demo PR (`demo/ci-p1-reuse-evidence`, base `main`) as the faithful substitute for the merged parcel PR: same workflow, same lineage mechanics.

**Already captured from the parcel PR lineage (see `ci-p1-completion-record-2026-09-30.md`):** `no-prior-run` + `event-class-ineligible` (head `4819c0ac`), `prior-run-inconclusive:failure` ×2 (heads `801c379`, `cce81e0` — the `801c379` record's input hashes are byte-identical to the seed record's, proving a docs-only delta was refused purely on the failed candidate).

**This demo PR's plan:**
1. Push 1 (this commit, docs-only on a fresh lineage) → expected `no-prior-run`, sweep runs and goes GREEN (seed).
2. Push 2 (docs-only) → expected **`decision: reuse`** with `source_run` = push 1's green run, sweep NOT executed, both required contexts green. Push-class twin: `event-class-ineligible` (canary, detection-only per A-Q3).
3. Push 3 (touches `docs/specs/**` — the `specifications` class) → expected `test-relevant-change`, sweep runs.
4. Push 4 (docs-only after push 3's green run) → expected `reuse` again (source = push 3's run) — plus the full evidence addendum and Stage F closure docs.

`merge-context-mismatch` (case 5) fires organically if `main` advances between a green run and the following docs-only push — captured as evidence if it happens; force-push case 6 is authorization-blocked (standing authorization #4 forbids force pushes) and remains unit-covered (suite tests pin `source-head-unreachable`/`not-ancestor`).

## Results

- **Push 1 (seed, `adf2ff2`):** run `36904893417` (pull_request) — `decision: fallback`, expected `no-prior-run`; full sweep executed and **GREEN** (test job 10m41s, `integration-report` ✓). Seed planted. (Push twin `36904883714` = `event-class-ineligible` canary.)
- **Push 2 (this commit):** expected `decision: reuse`, `source_run` = `36904893417`, five-class hashes equal (this delta touches only `plugins/foreman-line/docs/goals/ci-optimization/**`), sweep NOT executed, both contexts green.
- **Push 2 result (`5eeef34`, run `36906342345`):** **`decision: reuse`, `fallback_reason: null`**, `source_run` = `{run_id: 36904893417, conclusion: success}` with five-class hashes equal; sweep step **skipped**; verify step consumed the `CI_REUSE_EVIDENCE` channel and re-verified from API+git (S1 live end-to-end); `test` + `integration-report` both green. ~2 min vs 10m41s seed. **AC6(a) satisfied.**
- **Push 3 (`dad0e0d`, run `36907397272`):** `decision: fallback`, `fallback_reason: test-relevant-change` — `specifications` hash `e1665fb9→65c69b24`, all other classes byte-equal (class isolation live). The sweep caught the incomplete Stage F move (spec-linter done-corpus pins) — exactly why specs are test-relevant. **AC6(c) satisfied.**
- **Push 4 (`59c774e`, run `36910068334`):** Stage F completion (`verification_class: equivalence-provable` added — not grandfathered into the historical waiver, SC #13); sweep **GREEN** (14m34s).
- **Push 5 (this commit):** expected `decision: reuse` of `36910068334` (docs-only delta over a green run) — or `merge-context-mismatch` if `main` advanced under us (case-5 evidence either way).
