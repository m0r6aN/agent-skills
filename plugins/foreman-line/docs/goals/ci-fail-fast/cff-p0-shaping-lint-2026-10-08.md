# CFF-P0 shaping lint (coordinator) — 2026-10-08

**Coordinator session:** the `/goal resume` session (2026-10-08, developer directive "resume coordination of CI improvements").
**Artifact linted:** `plugins/foreman-line/docs/specs/active/CFF-P0-recon-and-baseline.md` (status: draft) + `cff-p0-recon-and-baseline.shaping-result.json`, uncommitted on `feat/foreman-line-cff-p0` @ `14b2501a` (worktree `../foreman-line-cff-p0`).
**Method:** every factual claim in the spec re-measured or re-read on disk at the lint SHA before acceptance (lint host: Linux, node v26.8.2 — verification-of-claims only; the spec's own provenance disclaimer holds and the build re-measures everything under the pinned environments).

## Claim-by-claim verification

| Spec claim | Disk check | Result |
|---|---|---|
| 30 packages discovered vs 27 pinned in `COST_TABLE`; cost-unknown names exactly `kernel-import`, `ops-console`, `project-scaffold` (AC2.1) | `discoverPackages({root})` at `14b2501a` → 30 names; `Object.keys(COST_TABLE)` → 27; delta = the three named packages, exact | **CONFIRMED** |
| `assignShards` `costKnown` all-or-nothing → silent round-robin fallback; nothing signals it (AC2.2–2.3) | `assignShards` :319 gate reads `COST_TABLE`; no summary/log field names the fallback (grep of `scripts/foreman-line-ci.mjs`) | **CONFIRMED** (live 8/8/7/7 shape = build-time measurement, not linted) |
| Four `WAIVED_EXCLUSIONS` entries: `bypass-outage-harness`, `kernel-lease`, `authority-registry`, `jev-decisions` (AC3.1) | `WAIVED_EXCLUSIONS` :517 → exactly 4 entries, identities match | **CONFIRMED** |
| No `local` CLI mode; CLI is `resolve \| shard \| aggregate` only (AC1.5) | usage :1185 + mode dispatch :1218/:1249/:1280 | **CONFIRMED** |
| Rule 0 refuses every non-`pull_request` event at `ci-reuse.mjs:623` (charter D11) | line 623 present and is that gate | **CONFIRMED** |
| `GITHUB_EVENT_PATH` seam at `ci-reuse.mjs:1086` (charter D11) | line 1086 reads exactly that env seam | **CONFIRMED** |
| Classification safety property: `classifyPath('.../read-graph/read-graph.json')` → `code`; the Markdown records → `ordinary_documentation` (AC5.6) | live call: `read-graph.json` → `code`; `measurement-log.md` → `ordinary_documentation`; control `docs/guide.md` → `ordinary_documentation` | **CONFIRMED** — any pin edit forces a full sweep (safe direction) |
| `sameSet` is the only comparison surface (order-independence, AC4.2) | 4 references, all in `scripts/foreman-line-ci.mjs` | **CONFIRMED** (line re-citation at build, per spec) |
| Waiver contract = three-axis pin, run-then-waive, kind gate `exit` (AC4.1) | `evaluateWaiver` :697, `waiverRejectionLayer` :762, `waiverFor` :782 consistent with the map's shape | **CONFIRMED** |

## AC ↔ charter diff (lesson #33: strengthen never weaken)

- AC1 ↔ Stage Zero reconciliation #1 + exit criteria 4/7: consistent; strengthened with the validate-versions red-base datum (channel gap, run `37700880571`) — strengthening is permitted and is charter-relevant (exit criterion 4's signal classes).
- AC2/AC3 ↔ reconciliation #2/#3: consistent, all numbers now coordinator-measured (above).
- AC4 ↔ reconciliation #5 + D3: the D3 anchor wording matches the ratified text verbatim in substance (per-package captured, same stream concatenation, same granularity, same waiver parsing, `output_sha256` per-run never pinned, interleaving = stop condition). No weakening.
- AC5 ↔ D7: one-pass/two-projections, over-approximation-only structural (schema can express positive coverage only), R15 variance edges, criticality grading for P1/P2, two independent reviews (plan-review 6b) — all present. AC5.2's loop-stop on unrunnable `windows-latest` matches the charter's platform-skip stop condition.
- AC6 ↔ D7 re-proof over the post-CI-P2 cohort (`kernel-import`, `ops-console`, `project-scaffold`): consistent; the Stage Zero grep is explicitly demoted to hint, not evidence (matches #46).
- Out-of-scope list ↔ D1/D2/D10/D11 + stop conditions: consistent; read-only boundary intact (Allowed Files are all `docs/` paths).

## Notes (non-blocking)

1. Spec frontmatter `status: draft` is correct at lint; the build/Gate-2 transition and the Stage-F `done/` move follow SPEC-CONVENTION lifecycle rules (R20/lesson #50 applies at that end, not here).
2. Spec's line citations (`:319`, `:517`, …) are marked "as of `14b2501a`; re-cite at build" — accepted; the builder must honor the re-citation.
3. Shaping output was delivered uncommitted. Committed docs-only by the coordinator as paper trail (this record names the commit). No builder dispatch has occurred, so no builder worktree carried a stale paper trail.

**Verdict: PASS.** CFF-P0 is lint-clean and ready for Gate 2 build dispatch under the standing grant. CFF-P3 shaping is undelivered (no output in its worktree) and must be re-dispatched or re-issued before its build can proceed — see the resume report.
