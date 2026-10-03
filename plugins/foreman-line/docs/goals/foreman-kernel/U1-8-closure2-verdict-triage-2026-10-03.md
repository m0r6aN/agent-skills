# U1 §8 closure round 2 verdict — coordinator triage (2026-10-03)

**Verdict:** `U1-8-closure2-verdict-2026-10-03.json` — `FURTHER_FINDINGS`, identity
`anthropic/claude-sonnet-5-5`, over the round-2 closure pinned at
`R = ed848ba0595f7c8f6e01c1655babc725a73c2ef2` (tag `u1-verifier-pin`, PR #137).
FK-P18′ remains **undispatchable**.

**Tally (JSON):** CLOSED 7 — G-1, G-2, G-9, G-10, G-12, G-13, G-14. PARTIAL 7 — G-3, G-4,
G-5, G-6, G-7, G-8, G-11. New H-1 … H-15: blocker 1 (H-1), major 9 (H-2 … H-10), minor 5
(H-11 … H-15).

## 0. Independence — this verdict is not the §8 verdict

The verdict's `selfReviewStatement` records that the same identity built the round-2 closure
(live changes, both workflow rewrites, fixture feed, sandbox entrypoint, pin record, dry
runs, environment approvals — `U1-live-changes-2026-10-02.md`: "Executed by the reviewer
session (anthropic/claude-sonnet-5-5)"). The goal skill's rule "reviewers never fix, never
commit" was broken for round 2. Ruling:

- Its **findings stand** as evidence (findings need no independence; every one is
  line-cited, and H-1/H-3/H-8 are reproduced below).
- Its **closure judgments** (G-1/2/9/10/12/13/14 CLOSED) are recorded as non-independent:
  they are re-adjudicated by the next independent review, not banked.
- The next closure review MUST come from an identity that built nothing in rounds 1-3 (owner
  decision R-5). The round-3 builder MUST NOT be that reviewer.

## 1. Coordinator reproduction (read-only, 2026-10-03)

| Finding | Reproduced | Observation at `ed848ba:.github/workflows/u1-verify.yml` |
|---|---|---|
| H-1 | **yes (construction)** | resolve-request checks only that `selectedExecution` is an object (L632-637), then writes `request-commit-sha` (L651) **before** `producer-run-id=%s` from `str(sel.get("runId"))` (L652); evaluate writes `status=` (L2174) before `producer-run-id` (L2177). A newline in `runId` appends a later `status`/`request-commit-sha` line. Last-wins resolution of duplicate output names is [INFERENCE: runner file-command semantics], not executed here. |
| H-3 | **yes** | `compare_classes` (L1122-1136) returns `"match"` when both recorded digests are `None`; inventory entries are read with `.get` (L1450-1452); the only residual guard is the producer-authored `byteLength`. |
| H-8 | **yes** | L2706 `ATTEMPT_OUTCOME: retention-observation.outputs.attempt-outcome \|\| evaluate.outputs.attempt-outcome \|\| 'interrupted'`. |
| others | not re-run | Line-cited; accepted on the reviewer's evidence. H-5 producer-side, H-6 endpoint effect, H-11 producer probe, H-14/H-15 details are subagent findings the reviewer did not re-verify — the round-3 builder confirms each at Step 0 before changing it. |

## 2. Triage

| ID | Sev | Ruling | Lane | Decision |
|---|---|---|---|---|
| H-1 | blocker | fix | re-pin: grammar-validate every request field before any output (runId/attempt `^[0-9]{1,20}$`, digests `^sha256:[0-9a-f]{64}$`, commits `^[0-9a-f]{40}$`); single output writer refusing CR/LF; retention-observation derives status/reasonCodes/executedCommit/authoritative from the read-back decision; negative dry run with newline `runId` | — |
| H-2 | major | fix | re-pin + oracle shape: permitted gaps listed as exact (id, caseId, obligation) triples in the per-request oracle; any other gap row `INVALID`/`U1_ARTIFACT_INVALID`; negative dry run with a relabelled failing row | — |
| H-3 | major | fix | re-pin: mandatory `byteDigest` grammar per entry, duplicate `relativePath` refused, `compare_classes` returns `unbound` when both digests are absent, self-test case added | — |
| H-4 | major | fix | re-pin | **R-1** |
| H-5 | major | fix | re-pin (verifier + producer) | **R-2** |
| H-6 | major | fix | re-pin: 40-hex `headSha`, path grammar for `committedPath`, `runId` grammar, `-f ref=`, default branch from the API, cited commit = or ancestor of subject | — |
| H-7 | major | fix | re-pin: `result=unproven` unless the immutability read succeeded (non-zero az exit fails); seal fields from the read-back decision; enum/list validation; `consumable:false` for `u1-fixture-` ids; exact seal inventory | — |
| H-8 | major | fix | re-pin: drop the evaluate fallback | — |
| H-9 | major | fix | records + contract | **R-3** |
| H-10 | major | fix | dry-run design | **R-4** |
| H-11 | minor | fix | re-pin: setup 201 required, verifier delete probe, probe object names, `AuthorizationFailure` paired with a positive control, OIDC claims required and compared | — |
| H-12 | minor | fix | re-pin: honour `ref_name.exclude`, `actor_type == User`; admin ruleset GET re-observed at every dispatch precondition | — |
| H-13 | minor | fix | records: Addendum C + A-U1.8.23 clause-4 extension land on main with owner ratification of the extension; checklist marks which `recorded` rows were re-observed by a non-builder | — |
| H-14 | minor | fix | re-pin: typed equality, K=0 fails authoritative runs, structured per-invariant status, code/amendment alignment | — |
| H-15 | minor | fix | producer + lint: drop ANCHORS enrichment, constrain evidence-dir, allowlist + digest re-check in submit, u1-lint enforces the claimed checks | — |

Every re-pin item lands in **one** re-pin (round 3) under standing #34, after R-1 … R-5 are
ruled and their deltas ratified.

## 3. Owner rulings (2026-10-03)

- **R-1 (H-4):** "Verifier-owned harness from R".
- **R-2 (H-5):** "Fix both ends and exercise" — FK-P18′'s NC-U1 live rows are CI-generated
  (spec OQ-9), so they need the github-run lane.
- **R-3 (H-9):** "Named deviation now, 2nd identity before FK-P19".
- **R-4 (H-10):** "Locked fixture container" — irreversible 400-day lock on a new `u1-fixture`
  container; not yet provisioned.
- **R-5 (independence):** "Different provider model" for the next closure review.

Drafted deltas: `U1-8-closure3-amendments-2026-10-03.md` (A-U1.8.28 … A-U1.8.38), pending
owner ratification. No live GitHub/Azure state was changed by the coordinator.
