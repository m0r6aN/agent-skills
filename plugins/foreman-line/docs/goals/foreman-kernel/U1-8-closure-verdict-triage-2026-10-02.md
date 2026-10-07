# U1 §8 closure verdict — coordinator triage (2026-10-02)

**Verdict:** `U1-8-closure-verdict-2026-10-02.json` — `FURTHER_FINDINGS`, reviewer
`anthropic/claude-sonnet-5-5`, over dossier `U1-8-closure-rereview-dossier-2026-10-01.md`
(sha256 `8a6cbbfa…`). FK-P18′ is **not dispatchable**.

**Closure tally (from the JSON, not the relayed prose):** CLOSED 10 — F-1, F-2, F-4, F-6, F-7,
F-9, F-10, F-14, F-16, F-17. PARTIAL 8 — F-3, F-5, F-8, F-11, F-12, F-13, F-15, F-18. OPEN 0.
New findings 14 — blocker 3 (G-1, G-3, G-5), major 8 (G-2, G-4, G-6, G-7, G-8, G-9, G-10,
G-11), minor 3 (G-12, G-13, G-14). The relayed summary's "9 CLOSED / 9 PARTIAL" is a
miscount; the JSON is the record.

## 1. Coordinator reproduction (read-only, 2026-10-02, owner CLI login)

| Finding | Reproduced | Observation |
|---|---|---|
| G-1 | **yes** | `rulesets?includes_parents=true` → 24257508 agent-skills-default, 17746056 main (disabled), 22369510 main-pr-gate; `GET rulesets/24258920` → 404; tag `u1-verifier-pin` → `27323ec87880c53e300418ee24b1497e94f2261f`. Removal actor/time unknown (no repo audit log for user-owned repos). |
| G-2 | **yes** | `u1-verifier` deployment policies: 61546414 `main` (branch), 61684968 `u1-verifier-pin` (tag). |
| G-3 | **yes** | Stored a02 decision notes: "oracle promotionRequestId mismatch"; "trustPolicyDigest sha256:c1b66138… != reviewed trust-root record digest sha256:a8f986cd…"; "execution identity != promotion-request selection". Pin-record byte digests: 75d718b `c1b66138…` (v1), 95ee74e `a8f986cd…` (dry-run commit), 27323ec `dbfacbcb…` (current tag) — the comparison target moves with every re-cut (hash cycle). |
| G-4 | **yes** | Stored separation-probe: observedStatus 1, stderr "You do not have the required permissions…" (a real denial), classified "unexpected error". |
| G-7 | **yes** | Stored seal keys: attemptNumber, authoritative, decisionByteDigest, decisionDigest, inventory, promotionRequestId, retentionObservationDigest, retentionObservationResult, schema, sealDigest, sealedAt, verifierIdentity — no status / reason codes over an `INVALID` decision. |
| G-10 | **yes** | `u1-produce.yml@27323ec` L416-417, L444-445 and `u1-verify.yml@27323ec` L1519-1520 read `IMAGEOS`/`IMAGEVERSION`; stored verifier-context `"imageOS":"","imageVersion":""`. |
| G-11 | **yes** | main-pr-gate (22369510) and agent-skills-default (24257508) bypass `[{actor_id 35229880, User, always}]`; main-pr-gate `required_approving_review_count 0`, `require_code_owner_review false`, required checks `test` + `integration-report` (strict). |
| G-5, G-6, G-8, G-9, G-12, G-13, G-14 | not disputed | Code-reading findings bound to named lines at 27323ec; accepted on the reviewer's evidence and fixed in the re-pin. |

The closure report's F-4 claim stands only partly: the F-4 gate *did* fire (9 unrecorded rows,
Unlocked), but the recorded `INVALID` is driven by the G-3 defects, not the gate — A-U1.8.03
clause 6 expected `INCOMPLETE`. The "EXPLOIT-PROOF" statement (closure report §4) and
"ruleset unchanged" (A-U1.8.16 clause 3 as reported) are withdrawn.

## 2. Triage

| ID | Sev | Ruling | Lane | Owner decision |
|---|---|---|---|---|
| G-1 | blocker | fix | provisioning: restore tag ruleset (restrict update/deletion/non-fast-forward; bypass custodian only) + record at U1-15 + dispatch-precondition re-check | authorize act |
| G-2 | major | fix | provisioning (delete 61546414) + re-pin (event-lane identity) + record U1-15/-19 | **D-2** |
| G-3 | blocker | fix | re-pin: oracle binding, trust-policy identity without hash cycle, 7-field execution equality; re-cut request/checklist/oracle; negative + positive dry runs | **D-3** |
| G-4 | major | fix | re-pin: classify denial by HTTP status/ErrorCode; add the 3 missing probes; non-colliding probe name | — |
| G-5 | blocker | fix | re-pin + amendment | **D-4** |
| G-6 | major | fix | re-pin rider: bind rows to source bytes (allowlisted workflowRef, head_sha == subject, artifact digest; committed-source row equality + protected ancestry) | — |
| G-7 | major | fix | amendment to A-U1.8.09 (seal carries status + reason codes; consumer rule requires ACCEPT ∧ authoritative ∧ match ∧ digest ∧ not revoked) + re-pin + consumer-gate negative fixture before FK-P19 | — |
| G-8 | major | fix | re-pin rider: request commit must be ancestor of the protected default branch (compare API) | — |
| G-9 | major | fix | amendment A-U1.8.17 or exact-SHA restoration; dossier states executed SHA per run | **D-1** |
| G-10 | major | fix | re-pin: read `ImageOS`/`ImageVersion`; empty compensating field → U1_CONFIGURATION_INCOMPLETE; producer fix via recorded builder amendment | — |
| G-11 | major | fix | provisioning: remove main-pr-gate bypass; record builder identity/token scope at U1-14; F-12 restated "contract closed; dispatch preconditions pending" | authorize act |
| G-12 | minor | fix | re-pin: actionlint run in CI and recorded; conflation self-test drives the real comparison function | — |
| G-13 | minor | fix | records: real UTC timestamps, U1-13 refreshed, supersedes chained to be3e3de3, checklist shape amended or trimmed, all stored JSON via strict_loads | — |
| G-14 | minor | fix | provisioning (verifier ABAC `revocations/*` create clause) + re-pin (federatedSubject from token claims, or dropped until U1-19) | authorize act |

All re-pin items (G-3, G-4, G-5, G-6, G-7, G-8, G-10, G-12, G-14 code side) land in **one**
re-pin under standing #34, after D-1…D-4 are ruled, followed by a negative-path and a
positive-path dry run. The next re-review dossier includes the stored decision notes verbatim
and the executed commit SHA of every run.

## 3. Owner rulings (2026-10-02)

- **D-1 (G-9) pin binding:** "Ratify transitive binding as A-U1.8.17".
- **D-2 (G-2) event-driven lane:** "Read-only u1-reader-mi".
- **D-3 (G-3a) oracle binding:** "Per-request oracle" (conforms to A-U1.8.04 clause 6 as already ratified).
- **D-4 (G-5) independent derivation:** "Implement derivation in this re-pin".
- **Provisioning authorizations:** none granted (G-1 tag ruleset, G-11 bypass removal, G-2
  policy deletion, G-14 ABAC clause all pending). No live GitHub/Azure state was changed.

Drafted deltas: `U1-8-closure2-amendments-2026-10-02.md` (A-U1.8.17 … A-U1.8.27), pending
owner ratification of the text before any workflow change.
