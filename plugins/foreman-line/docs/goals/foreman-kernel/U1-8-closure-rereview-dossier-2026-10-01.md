# U1 §8 CLOSURE RE-REVIEW DOSSIER (2026-10-01)

> Prepared for the SAME reviewer identity that issued the §8 FINDINGS verdict
> (U1-8-review-verdict-2026-10-01.json): **anthropic/claude-sonnet-5-5**. This is the
> A-U1.8.16 "re-submit for review" step. Your earlier 18 findings (F-1..F-18) were the
> floor; verify whether each is now CLOSED with mechanism, not prose.

---

## PART 0 — CLOSURE-REVIEW DIRECTIVE

1. **Deliverable:** a reasoned **ACCEPT** or **further findings** over the closure package.
   Your prior findings stand as the record; this verdict adjudicates closure.
2. **Identity / independence / custodian disclosure (§8.2/8.3):** record your identity;
   you reviewed nothing you built (the closure was executed by the coordinator session and
   its subagents under owner authority — same separation as before); disclose control
   administration (expected: none — you executed nothing; the shakedown runs were triggered
   by the coordinator under owner-delegated credentials, and the per-job environment
   approvals were executed via the delegated custodian credential).
3. **Method (§8.4):** hostile-input probing licensed; re-attempt your naive-reading tests
   (N1..Nn from your first review) against the CLOSED text/mechanism and say whether each is
   now excluded by construction. Every new finding binds to a named location. Note whether
   any of your original findings remains open or was closed by weakening (a closure that
   weakens a guarantee is NOT a closure).
4. **Special scrutiny (shakedown-evidenced):** the shakedown (run 36944407315) recorded
   status INVALID / authoritative:true with reasonCodes including U1_CONFIGURATION_INCOMPLETE
   — judge whether the recorded non-ACCEPT is the F-4 gate working as ratified (lock
   Unlocked + §5 fields unrecorded) or a masked defect. Also judge the five
   shakedown-found integration defects (F-19, checklist-digest conflation, az-download
   stdout x4, env deployment-policy typing, request schema literal) — were they fixed at
   the right layer?
5. **Known remaining gaps (evaluate honesty of bounding):** candidate-sandbox invariant
   exercise NOT run (candidate-reexec=false); NC-U1-01..13 real rows not exercised
   (synthetic/committed feed — U1_CONTROL_FAILED + U1_INDEPENDENCE_UNPROVEN recorded for
   exactly this); the immutability LOCK remains deferred by owner ruling to the first real
   evidence cycle; FK-P19 consumption contract (seal-only) is written but untested.
6. **Verdict format:** strict JSON:

```json
{
  "verdict": "ACCEPT" | "FURTHER_FINDINGS",
  "reviewerIdentity": "anthropic/claude-sonnet-5-5",
  "custodianDisclosure": "<string>",
  "selfReviewStatement": "<string>",
  "rationale": "<string>",
  "closureByFinding": [{ "findingId": "F-1", "closure": "CLOSED" | "PARTIAL" | "OPEN", "evidence": "<string>" }],
  "findings": [{ "id": "G-1", "severity": "blocker"|"major"|"minor", "location": "<string>", "issue": "<string>", "requiredChange": "<string>" }],
  "naiveReadingTests": "<string>",
  "methodNotes": "<string>"
}
```

---

## PART A — CLOSURE REPORT (verbatim)

# U1 §8 CLOSURE REPORT — F-1..F-18 (2026-10-01)

**Requested by:** §8.1 ("findings are closed before FK-P18′ dispatch").
**Scope:** the 18 findings of `U1-8-review-verdict-2026-10-01.json` (anthropic/claude-sonnet-5-5),
closed under the owner-ratified amendments `U1-8-closure-amendments-2026-10-01.md`
(A-U1.8.01..16; authority bases stamped with the 2026-10-01 decision batch).

## 1. Closure map

| Finding | Severity | Closed by | Evidence |
|---|---|---|---|
| F-1 job outputs | blocker | A-U1.8.16 + rewrite | 7 job-level `outputs:` maps, machine-checked against every `needs.*.outputs.*` consumer |
| F-2 digest conflation | blocker | A-U1.8.01 | two digest classes declared; byte read-back + wrapper document identity; conflation regression self-test in `pin-check`; retained in seal (byte + doc digests) |
| F-3 event-driven pinning | blocker | A-U1.8.02 **option (b), owner-elected** | event runs classified `non-authoritative`, claim no attempt, can never ACCEPT; pin record fetched by immutable commit SHA; PIN_DRIFT before resolve/claim |
| F-4 lock/INCOMPLETE gating | blocker | A-U1.8.03 + provisioning | live management-plane immutability read (state/interval/etag/observedAt); digest-pinned `U1-configuration-checklist.json` gating ACCEPT; verifier granted account-plane Reader (2026-10-01T16:31:47Z); lock-deferral ruling adopted into contract text |
| F-5 fail-open rows / producer oracle | blocker | A-U1.8.04 | coordinator-owned `U1-expected-outcome-oracle.json` (digest-bound); only the 3 PIN-09 gaps admitted as gap rows; exitStatus VALUE checks; missing expected/observedResult = failure; per-invariant minExercisedRows |
| F-6 vacuous sets | major | A-U1.8.05 | first-promotion minimum INV-U1-01..05; promotedRefusalClassIds non-empty + IA-5 column-5 coverage enforced at resolver and decision |
| F-7 open request shape | major | A-U1.8.06 | closed 15-field U1PromotionRequest, unknown fields refused, `[a-z0-9-]{1,64}` grammar, fetch-by-commit-SHA, digest recomputed at every consumer, zero/multiple match refused |
| F-8 separation enforcement | major | A-U1.8.07 + provisioning | ABAC namespace conditions (producer `u1/m0r6an/agent-skills/runs/*`; verifier create-only `verifications/*` + `attempt-ledger/*`, list-aware clauses); ledger written only by verifier identity; diagnostic logging to `u1-evidence-audit`; separation-probe evidence recorded at `a02/evidence/separation-probe/` |
| F-9 namespace collision | major | A-U1.8.08 | disjoint producer `pNN` / verifier `aK` namespaces; retries read only their own prefixes |
| F-10 seal / OQ-U1-07 | major | A-U1.8.09 | `seal.json` written LAST create-only, closed shape, byte+doc digests + verifier inventory; FK-P19 consumes only the seal |
| F-11 provenance | major | A-U1.8.10 | executionProvenance[] per row confirmed via GitHub API; true `evidenceOrigin` literals; sandbox output consumed as untrusted data (unique artifact names) |
| F-12 custodian concentration | major | A-U1.8.11 | builder identity + token scope recorded at INCOMPLETE-U1-14; dispatch preconditions P1-P3 (builder credential must hold no bypass/admin/env rights; restore ≥1 approval + code-owner review when the builder identity exists); `main-pr-gate` bypass sunset tied to green baseline |
| F-13 runner identity | major | A-U1.8.12 | reasoned `ubuntu-24.04` label-level exception recorded as a §9 assumed boundary; ImageOS/ImageVersion/RUNNER_*/az CLI version recorded in producer and verifier contexts |
| F-14 attestation | minor | A-U1.8.13 **option (a), owner-elected** | named gap "not issued by the selected workflows"; absence never changes decision status |
| F-15 trust-root/revocation | major | A-U1.8.14 | revocation procedure written into the contract (disable FICs/roles, re-pin by amendment, revocation records at `u1/<owner>/<repo>/revocations/`, compromise-window decisions revoked never recreated); U1-19 unrecorded is an enforced IA-7.7 condition |
| F-16 limits/parsing | minor | A-U1.8.16 + rewrite | list-metadata early limits; depth/duplicate-key/NaN-rejecting parser; typed INVALID/U1_EVIDENCE_LIMIT_EXCEEDED / U1_ARTIFACT_INVALID mappings |
| F-17 injection hygiene | minor | A-U1.8.16 + rewrite | request-id grammar at every consumer; all file-derived values via `env:`; backticks escaped; zero raw expression interpolation (grep-verified) |
| F-18 ledger digest / shared account | minor | A-U1.8.15 | ledger rows digested under IA-2.5; retrieval-check entries carry {objectName, recordedDigest, observedDigest}; full RBAC principal inventory recorded (incl. `silent-apply-deploy` subscription Contributor + `biostack-github-actions` RG Contributor); network decision: **Allow + hardening + shared-key detection** (owner, 2026-10-01) folded into every verification |

## 2. Shakedown-found integration defects (closed during the A-U1.8.16 dry-run)

| Defect | Found by | Fix |
|---|---|---|
| F-19: pin identity self-reference paradox (record cannot embed its own commit SHA; `git merge-base` also false-refuses on shallow clones) | dry-run attempt 1 | transitive binding: byte-equality at the run commit (immutable fetch) + recorded-commit ancestor-of run commit via the **compare API** + protected-tag ref + dispatch input |
| checklist digest conflation (`configurationChecklistSha256` carried the document digest; verifier compares byte digests) | dry-run attempt 2 | record field corrected to the byte digest; F-2 semantics noted in the record |
| `az storage blob download --file -` is not stdout — 4 sites (ledger get, claim check, evidence read-back, seal inventory) parsed/hashed EMPTY bytes | dry-run attempts 3-4 | all four sites download to temp files and read bytes; typed U1_ARTIFACT_INVALID on empty objects |
| environment deployment policy typed `branch` could not match the tag ref | dry-run attempt 3 | tag-type deployment policy `u1-verifier-pin` created (id 61684968) |
| request `schema` literal mismatch (`u1-promotion-request/v1`) | dry-run attempt 2 | literal corrected + detached digest recomputed |

## 3. The A-U1.8.16 dry-run record (authoritative shakedown)

- **Producer:** run `36926434897` SUCCESS (assemble+submit) against the UNLOCKED container;
  bundle at `u1/m0r6an/agent-skills/runs/36926434897/p01/`;
  `expectedSubjectDigest = sha256:f03722878fbcf459c37e936a2e76f6b07420b9d7a3d5a78e0faa31a5a6dfcf3b`.
- **Verifier:** run `36944407315` — full pipeline SUCCESS across pin-check, resolve-request,
  claim-attempt, verify, retention-observation, close-attempt (candidate-sandbox skipped
  as designed; `candidate-reexec=false`). Attempt observer consumed the crashed earlier
  attempt 1 as `timed-out` (IA-8.2 semantics).
- **Recorded decision:** `status: INVALID`, `authoritative: true`, reason codes
  `[U1_CONFIGURATION_INCOMPLETE, U1_CONTROL_FAILED, U1_INDEPENDENCE_UNPROVEN,
  U1_REQUIRED_EVIDENCE_MISSING, U1_SUBJECT_MISMATCH]` — **non-ACCEPT as designed**: the
  F-4 gate refused ACCEPT while the immutability policy is Unlocked and §5 fields are
  unrecorded. `seal.json` written last with byte+doc digests and the full verifier
  inventory (`a02/`: decision.json, retention-observation, retrieval-check,
  separation-probe, verifier-context, seal.json).
- **Artifacts:** `u1/m0r6an/agent-skills/verifications/u1-shakedown-2026-10-01/a02/…`.

## 4. What the shakedown did NOT exercise (named, not hidden)

- The candidate-sandbox invariant exercise (`candidate-reexec=false`; the shakedown used the
  committed FK-P17 rows as data, not a live candidate execution).
- NC-U1-01..13 real negative-control rows: the shakedown's `U1_CONTROL_FAILED` +
  `U1_INDEPENDENCE_UNPROVEN` reflect the synthetic/committed feed, exactly what A-U1.8.10's
  provenance confirmation is built to catch. The first REAL evidence cycle (FK-P18′) must
  exercise them against live rows.
- The lock flip: still deferred by owner ruling (2026-09-30) to the first real evidence
  cycle; the F-4 gate made the deferral EXPLOIT-PROOF in the meantime (ACCEPT impossible).

## 5. Re-review submission

Per A-U1.8.16 ("re-submit for review"), the closure package — this report, the ratified
amendments, the re-cut pin record, the shakedown decision/seal, and the workflows at the
pinned revision — is submitted to the same §8 reviewer (anthropic/claude-sonnet-5-5) for a
closure verdict: ACCEPT or further findings.


---

## PART B — THE RE-CUT PIN RECORD (verbatim, on main at 27323ec)

```json
{
  "schema": "u1-verifier-pin/v2",
  "workflow": ".github/workflows/u1-verify.yml",
  "workflowCommit": "16a7e0fb0a5713bdfc7722e3227def6e6128cade",
  "workflowFileSha256": "sha256:3301a0e4bb95a272c5110907b6bfe6e9d3c3c6111f321f4ce285c1ac085e4c10",
  "tag": "refs/tags/u1-verifier-pin",
  "producerWorkflow": ".github/workflows/u1-produce.yml",
  "supersedes": {
    "workflowCommit": "dc5617924379a5a574fddb2c71cce1647a74ba04",
    "workflowFileSha256": "sha256:8329f858ec5de48d6a55cb7254c16c871d40875fc01b0ae4f4409e025ed2a661",
    "reason": "four az-download --file - sites fixed to temp-file reads (stdout streaming is a no-op; shakedown-found)"
  },
  "actionlint": "not-available-on-ci-or-workstation; substituted: PyYAML parse PASS both workflows + machine-checked outputs wiring (7/7 job maps) + zero raw expression interpolation of file-derived values (recorded in U1-closure-implementation-notes-2026-10-01.md)",
  "dryRun": {
    "producer": "run 36926434897 SUCCESS against the UNLOCKED container; bundle at u1/m0r6an/agent-skills/runs/36926434897/p01/",
    "verifier": "run 36944407315 full-pipeline SUCCESS; recorded decision status INVALID authoritative:true with reasonCodes [U1_CONFIGURATION_INCOMPLETE, U1_CONTROL_FAILED, U1_INDEPENDENCE_UNPROVEN, U1_REQUIRED_EVIDENCE_MISSING, U1_SUBJECT_MISMATCH]; seal.json written last (a02/) — non-ACCEPT as designed per A-U1.8.03",
    "note": "shakedown-found defects F-19/checklist-digest/az-download x4/env-policy/schema-literal all fixed and recorded in U1-8-closure-report-2026-10-01.md"
  },
  "configurationChecklistSha256": "sha256:f6ce063326c79e70633e29bc1a3d3a87dea271708427cd6362f6fbcb8d0a1998",
  "oracleDigest": "sha256:ca3d30bdf07d6bc37dbb24b882c35ed0235f1b83a2e3b4536aa33a28eb6d20e3",
  "custodian": {
    "login": "m0r6aN",
    "objectId": "461a4112-8e91-41cb-afef-6889b8f48ff0"
  },
  "recordedAt": "2026-10-01T21:15:00Z",
  "note": "workflowCommit is the commit that INTRODUCED the pinned bytes (F-19: a record cannot embed its own commit's SHA). The run-time binding is transitive and fail-closed: byte-equality at the run commit (immutable API fetch) + recorded-commit ancestor-of run-commit + protected-tag ref + dispatch pinned-commit-sha input. Any pin change is a contract amendment (standing #34) recorded in the review trail. configurationChecklistSha256 is the checklist BYTE digest (F-2 class semantics: byte digests for stored bytes, document digests for identities); the earlier document-digest value was a shakedown-found conflation."
}

```

---

## PART C — RATIFIED AMENDMENTS (verbatim, complete; authority bases filled)

The full document `plugins/foreman-line/docs/goals/foreman-kernel/U1-8-closure-amendments-2026-10-01.md`
on main, reproduced verbatim below (committed bytes sha256:895fbe0e6de1cd8966e309cc834eb5f580b4cbda5bb7866d3121b39a398360e1): §0 reading rules,
A-U1.8.01 … A-U1.8.16, implementation-side closure notes (F-1/F-16/F-17), closure matrix.

# U1-8 closure amendments — contract-side closure of the §8 review findings (2026-10-01)

**Instrument:** U1-8 closure amendments **A-U1.8.01 … A-U1.8.16**, the contract-side delta set
that closes the §8 review findings F-1 … F-18 (`U1-8-review-verdict-2026-10-01.json`).
**Base document amended:** `U1-contract-2026-09-29.md` (committed-bytes sha256 `8d5f849c…`,
as reproduced in dossier Part A). Supporting inputs: `U1-contract-selections-2026-09-29.md`
(PIN-02), `U1-8-review-dossier-2026-10-01.md` (Parts 0/A/B/C/D).
**Status:** RATIFIED — owner decision batch 2026-10-01 filled every authority basis below
(verbatim batch record). Deltas bind; implementation-side acts proceed under them.
**Write boundary:** this document only. It edits no workflow, no code, no provisioning, and
no existing file. The contract file is not transcribed by this document; transcription is a
mechanical recorded act after ratification and never re-decides a delta.
**Pin consequence (standing constraint #34):** closing F-1, F-2, F-3 and F-5 changes the
pinned verifier bytes, so closure is a re-pin and therefore a contract amendment. The
re-pin is drafted as **A-U1.8.16**. FK-P18′ (FK-P18-prime) MUST NOT be dispatched on
`be3e3de3dfcf6159d4ffb265aa39847aac5f0814`.

## 0. How to read this document

- Every amendment names its **finding id + severity**, a one-line restatement, the exact
  **contract location** it edits, a **Ratified delta** (the precise clause text being added
  or replaced, in ratifiable prose), and **Mechanism notes** (binding requirements on the
  workflow rewrite and provisioning acts — stated as requirements, never as code).
- The findings' `requiredChange` texts are the **floor**. No delta weakens a contract
  guarantee to make an implementation pass; deltas are equal or stronger.
- Refusal codes are the contract's closed IA-7 vocabulary only:
  `U1_SUBJECT_MISMATCH`, `U1_EVIDENCE_LIMIT_EXCEEDED`, `U1_ARTIFACT_INVALID`,
  `U1_PROVENANCE_INVALID`, `U1_CONTROL_FAILED`, `U1_REQUIRED_EVIDENCE_MISSING`,
  `U1_CONFIGURATION_INCOMPLETE`, `U1_RETENTION_UNPROVEN`, `U1_INDEPENDENCE_UNPROVEN`,
  `U1_AVAILABILITY_EXHAUSTED`, `U1_CONTEXT_UNSUPPORTED`; plus `INVALID` /
  `PIN_DRIFT` spellings already used at §1.3/§2. A delta never introduces a new code.
- **Owner-ratification rule (closure matrix column 5):** `yes` = the delta resolves an owner
  decision block, adopts an owner-pending act, or changes owner-ratified selection
  semantics or §9 assumed boundaries. `no` = the delta only concretizes or strengthens
  existing clauses inside coordinator closure authority; the provisioning acts under it
  still require their own owner/infrastructure authority. Both kinds carry an
  authority-basis placeholder that must be filled before the delta binds.
- New closed artifacts introduced here (exact shapes in their amendments):
  expected-outcome oracle record (A-U1.8.04), configuration checklist record
  (A-U1.8.03), verifier seal document (A-U1.8.09), revocation record (A-U1.8.14),
  closed `U1PromotionRequest` shape (A-U1.8.06), disjoint blob namespaces and ledger
  grammar (A-U1.8.07 / A-U1.8.08), re-pin record (A-U1.8.16).
- New IA-2 digest domains added (each at its amendment): IA-2.7 `foreman-line.u1.seal`,
  IA-2.8 `foreman-line.u1.expected-outcomes`, IA-2.9 `foreman-line.u1.configuration-record`,
  IA-2.10 `foreman-line.u1.revocation-record`. All use the existing IA-2 wrapper rule
  `{domain, apiVersion, payload}` with `apiVersion` literal `0.1.0` (IA-1).

---

## A-U1.8.01 — F-2 (blocker): read-back compares byte digests; document identity compares wrapper digests

**Finding (F-2, blocker).** The recorded decision digest is the IA-2.3 domain-wrapped digest
while retention read-back compares the plain byte digest of stored bytes; the two can never
be equal, so every run records `mismatch`/`invalid` and the independent decision read-back
can never succeed.

**Contract location edited:** IA-2 (artifact-byte-digest paragraph), IA-4 (closure rules),
§7.1.

**Ratified delta.**

1. **IA-2, appended after the artifact-byte-digest paragraph:** Two digest classes exist and
   are never conflated. (a) **Byte digest** — `sha256:` + SHA-256 over the exact retained
   file bytes of a stored object, without the wrapper; this is the digest `Artifact.digest`
   and `CodeInput.digest` carry and the digest §7.1 read-back compares. (b) **Document
   digest** — the IA-2 wrapper digest `sha256:` + SHA-256 over the canonical
   `{domain, apiVersion, payload}` serialization of a parsed document; this is the digest
   IA-2.1…IA-2.10 emit and the digest cross-references between documents cite (e.g. the
   seal's `decisionDigest` is the IA-2.3 document digest). A document object's byte digest
   and its document digest are distinct values; comparing one against the other is a
   failure, never a pass.
2. **§7.1, replaced:** "**Independent retrieval + digest:** the verifier identity reads each
   retained object through its own access (never the producer's). For every object it
   recomputes the SHA-256 over the exact read-back bytes and compares it to the recorded
   **byte digest**; for every JSON document it additionally parses the read-back bytes,
   canonicalizes per IA-2, recomputes the **IA-2 document digest** (its own domain row), and
   compares it to the recorded document digest. Both comparisons must pass **before ACCEPT**.
   Byte mismatch or unreadable object → `INVALID`/`U1_ARTIFACT_INVALID`; document-digest
   mismatch or unparsable document → `INVALID`/`U1_ARTIFACT_INVALID`; absent or unproven
   retrieval → `INCOMPLETE`/`U1_RETENTION_UNPROVEN`."
3. **IA-4 closure rules, appended:** the decision's detached digest (IA-2.3) is a document
   digest; the retained decision object's byte digest is recorded separately (in the seal,
   IA-2.7 per A-U1.8.09). Inventory entries for JSON documents carry **both** values
   (`byteDigest`, `docDigest`).

**Mechanism notes (workflow rewrite; binding requirements).**

- The verify job records for the decision candidate both `docDigest = doc_digest('foreman-line.u1.decision', decision)`
  and `byteDigest = sha256(retained bytes)`; the retention-observation job computes both
  values from the read-back bytes and compares each to its recorded counterpart.
- The workflow test surface must include a regression test that **fails** when a byte digest
  is compared to a wrapper digest (conflation test); the test result is recorded in the
  dry-run record of A-U1.8.16.
- No other comparison site may use the wrong class: ledger rows (IA-2.5, A-U1.8.15),
  inventory entries (IA-2.6), and the seal (IA-2.7) each record the class they cite.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## A-U1.8.02 — F-3 (blocker): the event-driven path is never the authoritative decision path — owner decision block

**Finding (F-3, blocker).** The `workflow_run` path executes the default-branch copy of the
workflow, not the pinned SHA; its pin check is self-computed byte equality a modified
workflow can simply omit; the pin record is read from mutable `main`; this violates §3.1.1
"executes from an independently protected workflow revision pinned by full commit SHA".

**Contract location edited:** §3.1.1, §2 item 3 (verifier execution model), §5
(INCOMPLETE-U1-15), IA-4 decision/seal `authoritative` flag (A-U1.8.09).

**Ratified delta — single decision block; the owner chooses exactly one option.**

> **F-3 decision (owner).** Option (a) — **strict posture.** Remove the `workflow_run`
> trigger from the verifier. Only a dispatch that executes from `refs/tags/u1-verifier-pin`
> at the pinned full commit SHA may produce a decision; no other run path exists.
>
> Option (b) — **preserves the designed event-driven flow.** Event-driven runs may execute
> but are **non-authoritative by construction**: every such run MUST record
> `authoritative: false` in its verifier-context and in its decision document and seal
> (A-U1.8.09); its decision status is never `ACCEPT` — when all checks pass it records
> `INCOMPLETE`/`U1_REQUIRED_EVIDENCE_MISSING` (the authoritative pinned invocation evidence
> is absent), and any real failure raises its own `INVALID`/`INCOMPLETE` code unchanged;
> FK-P19 consumes nothing from a non-authoritative run.
>
> **Recommendation: option (b).** It preserves the designed event-driven flow as a signal
> channel while making the authority boundary mechanical; option (a) is the stricter posture
> and removes the signal channel entirely. The contract floor is that no event-driven run can
> ever yield ACCEPT.

**Binding on both options.**

1. **§3.1.1, appended:** "An authoritative decision requires all three: (i) the run executes
   the workflow file at the pinned full commit SHA recorded at §5 (INCOMPLETE-U1-13) /
   `U1-verifier-pin.json`; (ii) the run ref is `refs/tags/u1-verifier-pin`; (iii) the pin
   record is read **at the pinned commit or by the API at that SHA** — never from the `main`
   head. A run that fails any of the three is fail-closed with `PIN_DRIFT` (§1.3 rule) and
   produces no decision."
2. **Pin check ordering (new clause in §3.1.1):** the pin and `PIN_DRIFT` check runs
   **before** `resolve-request` and `claim-attempt`. A drifted or non-authoritative run
   creates no IA-8 attempt record and consumes no attempt (§3.6.2); attempt accounting
   begins only after the pin check passes.
3. **INCOMPLETE-U1-15 (§5 row) required record extended:** the selected GitHub event for the
   evidence run, its authority class (`authoritative | non-authoritative`, per the chosen
   option), and the pin-record read path (pinned commit / API-by-SHA) — observed at dispatch.

**Mechanism notes (workflow rewrite; binding requirements).**

- If option (a): delete the `workflow_run` trigger; the dispatch path alone remains.
- If option (b): the event path sets and persists `authoritative: false` in every decision
  artifact and can never emit `ACCEPT`; the dispatch path verifies ref, run SHA and byte
  digest before any ledger write.
- In both: the pin record fetch is by pinned commit or API-by-SHA; the pin/PIN_DRIFT gate
  precedes claim-attempt and resolve-request; a failed gate writes no attempt row.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## A-U1.8.03 — F-4 (blocker): configuration and immutability are observed, checked, and enforced; the lock deferral is bounded in the contract

**Finding (F-4, blocker).** The refusal "every unrecorded §5 field raises
U1_CONFIGURATION_INCOMPLETE and blocks ACCEPT" is prose only; the verifier never queries the
immutability policy state, the retention-observation "observed state" is a hard-coded string
literal, and the lock deferral lives only in Part C — so the verifier can emit ACCEPT while
the policy is Unlocked, contradicting §7.8 and INCOMPLETE-U1-11.

**Contract location edited:** §5 (header rule + INCOMPLETE-U1-11 + INCOMPLETE-U1-15…19),
§7.7, §7.8, IA-2 (new domain row), IA-4 (configuration checklist record), §3.6 (budget
interaction).

**Ratified delta.**

1. **§5 header rule, replaced:** "Every field below is `INCOMPLETE` until **recorded and
   observed**. Each unrecorded or unobserved field raises `U1_CONFIGURATION_INCOMPLETE`
   (IA-7.7) and blocks ACCEPT. Enforcement is mechanical: ACCEPT requires the
   **configuration checklist record** (IA-4 addition below) to be present, digest-matched,
   and to show every §5 field `recorded`, plus a **live management-plane read** of the
   container immutability policy at verification time."
2. **New IA-2 domain row IA-2.9:** `foreman-line.u1.configuration-record` — the configuration
   checklist document.
3. **New IA-4 artifact — configuration checklist record (`U1-configuration-checklist.json`).**
   Verifier-held digest-pinned record; MUST be present before ACCEPT is possible.
   - **Location:** committed at
     `plugins/foreman-line/docs/goals/foreman-kernel/U1-configuration-checklist.json`; its
     committed-bytes SHA-256 is recorded in `U1-verifier-pin.json` as
     `configurationChecklistSha256` and in the promotion request as
     `configurationChecklistDigest` (A-U1.8.06). The verifier reads it at the pinned commit
     and verifies both bindings; a binding mismatch is `PIN_DRIFT`.
   - **Shape (closed):** `schema` literal `u1-configuration-checklist/v1`; `contractDigest`
     (byte digest of the contract version in force); `entries[]` — exactly one row per §5
     reference INCOMPLETE-U1-01 … INCOMPLETE-U1-19 with fields `ref`, `state`
     (`recorded | unrecorded`), `recordDigest` (byte digest of the recording artifact),
     `observedAt` (UTC ISO-8601), `observer` (identity that observed it); plus
     `immutabilityExpectation` {`mode` literal `locked`, `minIntervalDays` SafeInt `400`}
     and `checklistDigest` (detached IA-2.9 document digest).
   - **Refusal:** absent checklist, unbound digest, any `state != recorded`, or missing §5
     row → `INCOMPLETE`/`U1_CONFIGURATION_INCOMPLETE`.
4. **§7.7, replaced:** "**Configuration:** every §5 field recorded with authority **and**
   observed configuration, evidenced by the configuration checklist record's `entries[]` and
   a live management-plane GET of the container immutability policy recorded in the
   retention-observation artifact: `immutabilityState`, `intervalDays`, `policyEtag`,
   `observedAt`, `source`. ACCEPT additionally requires `immutabilityState == Locked` and
   `intervalDays >= 400`. Anything else → `INCOMPLETE`/`U1_CONFIGURATION_INCOMPLETE`."
5. **§7.8, replaced:** "**Retention demonstration:** locked immutability (≥ 400 days)
   **observed by the verifier through a management-plane read at verification time** (never
   a producer-authored assertion, never a string literal); retrieval test (INCOMPLETE-U1-12)
   passed via the required retention-observation artifact; decision + retention observation
   + seal retained under the same retention rules."
6. **Owner ruling 2026-09-30 adopted into contract text (lock deferral bounded):** The first
   evidence cycle is a **non-ACCEPT shakedown** by definition: it runs under its own
   promotion request and its own attempt budget (IA-8, §3.6.2), and its outcome is
   `INCOMPLETE`/`U1_CONFIGURATION_INCOMPLETE` (the policy is Unlocked) regardless of all
   other results. After the shakedown's first successful write and independent read-back of
   a real evidence bundle, the custodian performs the one-way lock flip and records it at
   INCOMPLETE-U1-11 as `state: locked`, `policyEtag` (post-flip etag), and effective UTC
   timestamp. Post-flip verification runs under a **new promotion request** (new
   `promotionRequestId`, new 3-attempt/24 h budget, §3.6.4) that cites and retains the
   shakedown history; the budget never resets by editing a digest. Until the flip is
   recorded, ACCEPT is impossible; after it, ACCEPT requires §7.7 to observe `Locked`.
   (The alternative "documented budget rule" is closed in favor of the new-promotion-request
   path; §3.6.4's durable-history rule is unchanged.)
7. **INCOMPLETE-U1-11 (§5 row), replaced:** "Locked retention interval — locked time-based
   immutability policy: `mode locked`, interval ≥ 400 days from evidence creation, effective
   UTC timestamp, and **post-flip policy `etag`** — exact interval owner-pending
   (OQ-U1-05); the ≥ 400-day minimum is RATIFIED. `state` must read `Locked`; an `Unlocked`
   policy never satisfies this row."
8. **INCOMPLETE-U1-15…19 enforcement:** each row's `recorded` state is checked from the
   configuration checklist record; an unrecorded row (including U1-19, per A-U1.8.14) is an
   enforced IA-7.7 condition, never a dispatch-time footnote.

**Mechanism notes (workflow rewrite + provisioning; binding requirements).**

- The verifier job receives a management-plane **Reader** role on the container (provisioning
  act under owner/infrastructure authority) and performs a real immutability-policy GET;
  the hard-coded "observed state" literal is deleted and replaced by the read's fields.
- The retention-observation artifact carries `immutabilityState`, `intervalDays`,
  `policyEtag`, `observedAt`, `source` from that read.
- The verifier refuses ACCEPT unless the checklist record is present, digest-matched and
  complete; no code path may treat a producer-authored `intervalDays` as an observation.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## A-U1.8.04 — F-5 (blocker): gap rows are limited to the three PIN-09 gaps; the control oracle is coordinator-owned and digest-pinned

**Finding (F-5, blocker).** "Not-exercised" passes: gap rows skip evaluation, all 13 controls
can be gap rows and still yield ACCEPT, the control oracle is the producer's own `expected`
compared to its own `observedResult` (skipped when either is missing), and only the presence
of `exitStatus` is checked — exactly the "merely checks a producer-authored pass"
construction §3.4.1 calls insufficient and §3.4.2 forbids.

**Contract location edited:** §3.4.1, §3.4.2, §3.4.4, §7.6, IA-4 (expected-outcome oracle),
IA-2 (new domain row), IA-11 note (NC-U1-08 disposition).

**Ratified delta.**

1. **§7.6, replaced:** "**Negative controls:** the closed set IA-11 present with direct exit
   status and full outputs. **Only the three named PIN-09 inherited gaps** (file-symlink
   privilege case, CTRL-01, the `outage.ts` realpath sweep) may appear as
   `not-exercised` gap rows; each such row is a machine-readable `blocked:` gap record,
   never a pass. **Any other gap or not-exercised row makes its control or invariant
   `INCOMPLETE`/`U1_REQUIRED_EVIDENCE_MISSING`.** A control or invariant whose rows are all
   gap rows is never ACCEPT. Dropped control or builder-supplied oracle → refuses
   completeness (NC-U1-08)."
2. **§3.4.4, amended:** the parenthetical "recorded gaps, not acceptance blockers (ruling
   2026-09-29, OQ-U1-06)" is scoped to **exactly the three named PIN-09 inherited gaps**;
   OQ-U1-06 grants no other gap row non-blocker status.
3. **§3.4.1, amended:** "source-authored expected outcome" is **defined** as the
   **coordinator-owned expected-outcome oracle record** (IA-4 addition below), never
   producer-authored fields. The producer's `expected` field is ignored as an oracle and is
   never compared to anything; retained control rows MUST carry `observedResult` and
   `exitStatus`, and a row missing either is `INVALID`/`U1_CONTROL_FAILED` (a failed
   demonstration). Comparison order: verifier compares retained `observedResult` /
   `exitStatus` / signals **against the oracle record**.
4. **§3.4.2, amended:** replacing the oracle with builder-supplied expected output, or
   shrinking the IA-11 denominator, refuses completeness (`INCOMPLETE`/
   `U1_REQUIRED_EVIDENCE_MISSING`); the denominator is the closed IA-11 set.
5. **New IA-2 domain row IA-2.8:** `foreman-line.u1.expected-outcomes` — the expected-outcome
   oracle document.
6. **New IA-4 artifact — expected-outcome oracle record (`U1-expected-outcome-oracle.json`).**
   Coordinator-owned, digest-pinned; referenced from the promotion request (`oracleDigest`,
   A-U1.8.06) and bound to the trust material.
   - **Location:** `promotion-requests/<promotionRequestId>/expected-outcome-oracle.json`
     (the `promotion-requests/` tree is CODEOWNERS-covered coordinator write surface).
   - **Shape (closed):** `schema` literal `u1-expected-outcome-oracle/v1`; `contractDigest`;
     `promotionRequestId`; `controlExpectations[]` — exactly one row per
     NC-U1-01 … NC-U1-13 with fields `controlId`, `expectedExitStatus` (SafeInt; assigned by
     coordinator authority from the PIN-03 control definitions — NC-U1-12, the positive
     control, carries `0`), `expectedRefusalClassId` (exactly one IA-6 id or the literal
     `none`), `expectedClassification` (`mechanical | detected | unsupported`),
     `requiredSignals[]` (string literals the retained output must contain);
     `invariantExpectations[]` — one row per INV-U1-01 … INV-U1-06 with `invariantId`,
     `expectedRefusalClassIds[]` (IA-5 column-5 mapping), `minExercisedRows` (SafeInt ≥ 1);
     `oracleDigest` (detached IA-2.8 document digest).
   - **Verification rule:** per control, `exitStatus == expectedExitStatus`,
     `observedResult` present and matching `expectedClassification` derivation from
     signals, and `requiredSignals[]` present in retained output; per invariant, at least
     `minExercisedRows` **exercised** rows whose signals demonstrate the expected refusal
     class (IA-5/IA-6 mapping). Mismatch → `INVALID`/`U1_CONTROL_FAILED`; missing row fields
     → `INVALID`/`U1_CONTROL_FAILED`; gap/not-exercised outside the three PIN-09 gaps →
     `INCOMPLETE`/`U1_REQUIRED_EVIDENCE_MISSING`.
7. **NC-U1-08 disposition (IA-11 note, added):** NC-U1-08 ("dropped negative control or
   builder-supplied oracle refused, denominator preserved") is either **implemented and
   exercised** (the verifier enforces the IA-11 denominator and rejects producer-supplied
   oracles; its row records that enforcement as the exercised signal) or **explicitly
   declared unsupported** in the promotion request — in which case the decision is
   `UNSUPPORTED`/`U1_CONTEXT_UNSUPPORTED` and refuses promotion (§3.6.1 terminal). NC-U1-08
   is never a gap row and never a pass.

**Mechanism notes (workflow rewrite + record; binding requirements).**

- The verifier fetches the oracle record by `oracleDigest` from the promotion request; it
  never reads `expected` from producer rows as an oracle.
- Per-invariant ACCEPT requires ≥ 1 exercised row showing the expected refusal class; the
  derivation check compares against the oracle, not producer-vs-producer fields.
- `exitStatus` values are compared to `expectedExitStatus`; presence-only checks are removed.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## A-U1.8.05 — F-6 (major): no vacuous ACCEPT — minimum invariant set and promotion-class coverage

**Finding (F-6, major).** An empty `requiredInvariantIds` is a "subset of IA-5", §7.5 is
vacuously true, and a request with empty invariant and refusal-class sets yields ACCEPT with
zero invariant evaluation.

**Contract location edited:** IA-5 (final paragraph), IA-6 (OQ-U1-08 paragraph), §7.5.

**Ratified delta.**

1. **IA-5 final paragraph, replaced:** "`requiredInvariantIds` for any promotion request is
   a subset of IA-5 recorded by reviewed coordinator authority, and for the **first
   promotion MUST contain at least `INV-U1-01`, `INV-U1-02`, `INV-U1-03`, `INV-U1-04`,
   `INV-U1-05`** (the first-promotion minimum; `INV-U1-06` remains detected-only per
   OQ-U1-03). A required invariant never disappears from a result or becomes optional
   because its producer failed. The verifier rejects a request whose `requiredInvariantIds`
   is absent, empty, or smaller than this minimum with
   `INCOMPLETE`/`U1_REQUIRED_EVIDENCE_MISSING`."
2. **IA-6 OQ-U1-08 paragraph, appended:** "Every id in `promotedRefusalClassIds` MUST map to
   at least one **required** invariant through the IA-5 column-5 mapping. The verifier
   rejects a request that promotes an uncovered class — or whose `promotedRefusalClassIds`
   is absent or empty (a promotion request that promotes nothing supplies no §7.4 subject of
   promotion) — with `INCOMPLETE`/`U1_REQUIRED_EVIDENCE_MISSING`. The contract still never
   selects the promoted subset; it only refuses subsets that are unproducible or uncovered."
3. **§7.5, replaced:** "**Invariants:** every ID in `requiredInvariantIds` — which is never
   smaller than the IA-5 first-promotion minimum — has a per-invariant result derived
   independently (§3.4.5), with at least one exercised row per A-U1.8.04. Missing →
   `INCOMPLETE`/`U1_REQUIRED_EVIDENCE_MISSING`; failed → `INVALID`/`U1_CONTROL_FAILED`.
   Required invariants never shrink with producer failures; `promotedRefusalClassIds` is
   non-empty and every member maps to a required invariant."

**Mechanism notes (workflow rewrite; binding requirements).**

- The resolver/verify jobs enforce the minimum set and the coverage mapping before any
  evaluation; the refusal codes above are emitted, never skipped.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## A-U1.8.06 — F-7 (major): closed PromotionRequest shape, fetched by SHA, digest-recomputed at every consumer

**Finding (F-7, major).** The "immutable coordinator promotion request" has no closed schema;
subject-equality silently skips when `expected_subject` is absent, `trustPolicyDigest` is
never compared, the request is fetched from mutable `main`, consumers do not recompute the
resolver's digest, and multiple matches resolve silently.

**Contract location edited:** IA-2.2, IA-4 (new PromotionRequest shape), §3.2.3, §7.4.

**Ratified delta.**

1. **IA-4, new closed shape `U1PromotionRequest` (document digest domain IA-2.2):**
   `schema` literal `u1-promotion-request/v1`; `promotionRequestId`
   (**grammar `[a-z0-9-]{1,64}`** — closed; any other spelling is refused);
   `createdUtc`; `author` (coordinator authority identity + authority-basis reference);
   `contractDigest`; `expectedSubjectDigest` (Digest); `selectedExecution`
   (`ExecutionIdentity`); `trustPolicyDigest` (Digest); `policyDigest` (Digest);
   `compiledScopeDigest` (Digest); `requiredInvariantIds[]`; `promotedRefusalClassIds[]`;
   `oracleDigest` (IA-2.8 digest of the expected-outcome oracle record);
   `configurationChecklistDigest` (IA-2.9 digest of the configuration checklist record);
   `requestDigest` (detached IA-2.2 document digest). **All fields are mandatory.** A
   missing field is `INCOMPLETE`/`U1_REQUIRED_EVIDENCE_MISSING` — never skipped, never
   defaulted, never conditionally checked.
2. **§3.2.3, appended:** "The expected subject, trust policy, policy and compiled-scope
   digests, expected invariant set, promoted refusal-class set, and oracle digest all come
   from the promotion request as reviewed coordinator/parcel authority; the bundle's
   `subject.policyDigest` / `compiledScopeDigest` are compared to the request's values, and
   `trustPolicyDigest` is compared to the reviewed trust-policy digest recorded in the
   configuration checklist record. Any comparison that cannot run because a value is absent
   is a refusal, never a pass."
3. **§7.4, replaced:** "**Subject/selection equality:** the immutable coordinator promotion
   request binds exact execution identity and subject; the equality check **always runs**
   (never conditional on field presence). Mismatch → `INVALID`/`U1_SUBJECT_MISMATCH`;
   same-subject replay refused (NC-U1-05)."
4. **Fetch and recompute rule (new clause under IA-4):** the request is fetched **by commit
   SHA or blob SHA recorded in the dispatch input** — never from the `main` head. Every job
   that consumes the request recomputes its IA-2.2 digest over the fetched bytes and
   compares it to the dispatch-recorded `requestDigest` (or passes one verified artifact
   between jobs). Digest mismatch or unparsable request → `INVALID`/`U1_ARTIFACT_INVALID`;
   **zero** matching requests → `INCOMPLETE`/`U1_REQUIRED_EVIDENCE_MISSING`; **multiple**
   matching requests → `INVALID`/`U1_SUBJECT_MISMATCH` (ambiguous selection identity;
   silently taking the last match is forbidden).

**Mechanism notes (workflow rewrite; binding requirements).**

- The resolver validates `promotionRequestId` against `[a-z0-9-]{1,64}` at intake (also
  closing F-17's injection surface; see A-U1.8.16 notes).
- All mandatory fields are checked before evaluation; `if expected_subject`-style
  conditionals are removed; `trustPolicyDigest`, `policyDigest`, `compiledScopeDigest` are
  actually compared to reviewed authority values.
- The request is fetched by recorded SHA; every consumer job recomputes and compares the
  IA-2.2 digest.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## A-U1.8.07 — F-8 (major): separation of powers enforced at the storage layer

**Finding (F-8, major).** Separation of powers is asserted in comments, not enforced: both
Entra roles are container-scope without ABAC prefix conditions, the builder-reachable
producer identity can pre-create decision/ledger objects, the same producer identity writes
the attempt ledger, the ledger's location/writer/immutability are unspecified, and the
create-only claim rests on documentation review with no probes.

**Contract location edited:** §3.3.2, §3.3.3, §3.1.3, IA-8 (ledger location + writer), IA-9
(ledger grammar), §5 (INCOMPLETE-U1-09 required record extended).

**Ratified delta.**

1. **§3.3.2, replaced:** "The producer identity may submit new **evidence** objects only —
   under the producer namespace (A-U1.8.08). It must not administer or shorten the retention
   policy, delete existing evidence, write under the decision/ledger/verification
   namespaces, or overwrite any object. These limits are **observed configuration** (§5):
   enforced by separate containers or ABAC `startsWith` condition-scoped role assignments
   for the evidence, ledger and decision/verification namespaces, not by naming convention."
2. **§3.3.3, replaced:** "The verifier reads retained objects through an identity separate
   from the producer; the attempt ledger is written **only** by the verifier identity or a
   dedicated ledger-writer identity that is not federated to any builder-reachable workflow
   environment. Federated credential subjects are bound to the **pinned workflow and the
   immutable repository id** via a custom OIDC claim template carrying `job_workflow_ref`
   and `repository_id` (never a repository-name subject alone; see A-U1.8.14). Storage
   diagnostic logging with requester identity is enabled and retained **outside** the
   evidence container. Identity separation is observed configuration (§5), never a naming
   convention."
3. **§3.1.3, appended:** "Stored decision authorship is load-bearing: the decision and seal
   objects are created **only** by the verifier identity's create-only role
   (`blobs/add/action`, never `blobs/write`); a producer-created object at a decision path
   is `INVALID`/`U1_PROVENANCE_INVALID` and never a decision."
4. **IA-8, ledger location and writer (new clause):** the durable attempt history is the
   **attempt ledger** at `u1/<owner>/<repo>/attempt-ledger/<promotionRequestId>/…` (grammar
   below), written **before** the attempt is dispatched (§3.6.3), append-only via create-only
   data actions, by the ledger writer (this clause). Ledger rows are never producer-written.
5. **IA-9, new ledger grammar (closed):**
   ```text
   ledgerName := "u1/" owner "/" repo "/attempt-ledger/" promotionRequestId "/" ledgerRow
   ledgerRow  := ( "a" 1*2DIGIT ( "-dispatch" | "-final" ) | "stop-report" ) ".json"
   ```
   (the `-final` row of an attempt and the `stop-report` row at budget exhaustion per §3.6.4;
   a builder-reachable identity creating or forging any ledger row is
   `INVALID`/`U1_PROVENANCE_INVALID` and exhausts nothing — the durable history is the
   ledger writer's rows only.)
6. **§5 INCOMPLETE-U1-09 required record extended:** the RBAC record MUST attach the role
   definition JSON(s) (including the create-only verifier role), `az role assignment list`
   output at **container, account, resource-group and subscription scope**, and **recorded
   denied-operation probes**: producer delete, producer write under `audit/`/verification
   namespace, verifier overwrite of an existing object, verifier out-of-prefix write — each
   probe recorded as {operation, principal, target prefix, expected denial, observed
   status/error code, timestamp}. Unproven separation → `INCOMPLETE`/
   `U1_INDEPENDENCE_UNPROVEN`; unrecorded §5 rows → `INCOMPLETE`/
   `U1_CONFIGURATION_INCOMPLETE`.

**Mechanism notes (provisioning + workflow rewrite; binding requirements).**

- Provisioning (owner/infrastructure authority): separate containers **or** ABAC
  `startsWith` conditions binding producer writes to `runs/…/pNN/…`, ledger writes to
  `attempt-ledger/…`, verifier creates to `verifications/…`; a ledger-writer identity
  separate from the producer; FIC custom claim templates with `job_workflow_ref` +
  `repository_id`; Storage diagnostic settings shipping requester identity to a sink outside
  the container; the four denied-operation probes executed and recorded.
- The verifier workflow's header claims ("ONLY the attempt-ledger prefix", "decision/
  observation prefixes ONLY") become enforced claims only via the above; until the probes
  are recorded, the claims are unproven and ACCEPT is refused.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## A-U1.8.08 — F-9 (major): disjoint producer and verifier namespaces; retries never poison themselves

**Finding (F-9, major).** `attemptPos` collides the producer's `GITHUB_RUN_ATTEMPT` with the
verifier's ledger attempt number; decision/verifier objects land in the producer's `aNN`
prefix; the next verification attempt finds them "unlisted" and fails
`INVALID`/`U1_ARTIFACT_INVALID` — the first retry poisons itself.

**Contract location edited:** IA-9 (blob-name grammar), IA-4 (audit placement), IA-8.5
(attemptNumber semantics), §3.5.4 (inventory closure namespaces).

**Ratified delta.**

1. **IA-9 grammar, replaced (closed):**
   ```text
   producerBlobName := "u1/" owner "/" repo "/runs/" runId "/p" producerAttempt "/" packagePath
   verifierBlobName := "u1/" owner "/" repo "/verifications/" promotionRequestId "/a" verificationAttempt "/" verifierPath
   producerAttempt  := 1*2DIGIT                    ; provider GITHUB_RUN_ATTEMPT, e.g. 01
   verificationAttempt := 1*2DIGIT                 ; IA-8.5 ledger attemptNumber K, e.g. 01
   verifierPath     := "seal.json" | "audit/decision.json" | "evidence/" ( "verifier-context" | "retrieval-check" | "retention-observation" ) "/" fileSegment
   ```
   `packagePath` remains the IA-3 grammar unchanged. The two namespaces are **disjoint**;
   `ledgerName` (A-U1.8.07) and `revocationName` (A-U1.8.14) are separate again.
2. **IA-4 audit-placement clause, replaced:** "the audit `U1VerificationDecision` is stored
   under the **verifier** namespace at
   `…/verifications/<promotionRequestId>/a<K>/audit/decision.json`; the retention-observation
   artifact at `…/a<K>/evidence/retention-observation/…`; the seal at `…/a<K>/seal.json`
   (A-U1.8.09). Audit and verifier objects are **never part of the producer package**."
3. **IA-8.5 note, appended:** `attemptNumber` is the verifier's ledger attempt count K and is
   used only in the verifier namespace; `producerAttempt` is the provider's run attempt and
   is used only in the producer namespace. The two are never interchangeable.
4. **§3.5.4, replaced:** "…the artifact inventory closes over every transitively referenced
   artifact in both namespaces: the **producer package inventory** (`bundle.json`'s
   `artifactInventory`) lists exactly the objects of its own `pNN` prefix — excluding the
   verifier namespace entirely; the **seal** (A-U1.8.09) lists the verifier namespace's
   objects. Unlisted objects inside a package's own prefix refuse closure
   (`INVALID`/`U1_ARTIFACT_INVALID`); objects of other attempts or other namespaces are
   never read as package content."

**Mechanism notes (workflow rewrite + record; binding requirements).**

- Producer uploads to `runs/<runId>/p<NN>/…` only; verifier writes to
  `verifications/<promotionRequestId>/a<K>/…` only; a retry lists only its own prefixes and
  cannot see prior-attempt objects as unlisted files.
- The existing IA-9 collision/overwrite rule is retained per namespace.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## A-U1.8.09 — F-10 (major): verifier-authored seal is the only consumable record

**Finding (F-10, major).** The OQ-U1-07 ruling is self-contradictory (retention-observation
must carry a bundle inventory entry yet is written after the decision digest exists and never
referenced back), the decision blob is persisted before the read-back that must precede
ACCEPT, and a consumer reading only `audit/decision.json` sees ACCEPT even when the
observation says mismatch.

**Contract location edited:** IA-4 (OQ-U1-07 paragraph, rewritten), IA-2 (new domain row),
§3.5.3, §7.8 (consumption rule), IA-9 (verifier path, per A-U1.8.08).

**Ratified delta.**

1. **New IA-2 domain row IA-2.7:** `foreman-line.u1.seal` — the verifier seal document.
2. **New verifier-authored seal document (`seal.json`), written LAST** at
   `…/verifications/<promotionRequestId>/a<K>/seal.json`. Shape (closed): `schema` literal
   `u1-seal/v1`; `promotionRequestId`; `attemptNumber` (SafeInt K); `decisionDigest`
   (IA-2.3 **document** digest of the decision); `decisionByteDigest` (byte digest of the
   retained decision object); `retentionObservationDigest` (IA-2.4 document digest);
   `retentionObservationResult` (`match | mismatch | unreadable`); `verifierIdentity`;
   `authoritative` (bool, A-U1.8.02); `sealedAt` (UTC ISO-8601); `sealDigest` (detached
   IA-2.7 document digest). The seal lists its verifier-namespace inventory (A-U1.8.08).
3. **Consumption rule (§3.5.3, appended; §7.8 last sentence replaced):** "The seal is
   written only after the read-back comparisons of the producer package **and** the decision
   candidate bytes have completed. **FK-P19 (and any consumer) consumes only the seal**; the
   decision document alone is never a consumable record, and a decision without a matching
   seal is never evidence of ACCEPT. A seal whose `retentionObservationResult` is not
   `match`, or whose decision digest does not match the sealed decision, refuses promotion."
4. **IA-4 OQ-U1-07 paragraph, rewritten (non-contradictory form):** "The retention-observation
   artifact (kind `retention-observation`, IA-3.1.15, digest IA-2.4) is a **first-class
   required verification artifact in the verifier namespace** (ruling 2026-09-29, OQ-U1-07,
   as amended for consistency): it satisfies the retrieval-test evidence requirement
   (INCOMPLETE-U1-12), is listed in the **seal's** verifier-namespace inventory so it is
   never detached from the run's evidence identity (§3.5.4 closes over both namespaces), and
   its retained copy follows the same retention rules (§3.5). It records retrieval of the
   finalized decision bytes and is therefore written after the decision digest exists; the
   decision is written first as a **candidate**, never consumed before sealing (no
   circularity: the decision never references the observation; the seal references both)."
5. **§7.1 ordering, made explicit:** read-back of the producer package and of the decision
   candidate bytes precedes sealing; sealing precedes any consumption; a persisted but
   unsealed decision is an audit record only (IA-4's "persisted decisions are audit records
   only" carries).

**Mechanism notes (workflow rewrite; binding requirements).**

- The retention-observation job computes its result, then the final step writes `seal.json`
  create-only; FK-P19's consumer gate reads the seal first and the seal only.
- The "unlisted object" failure caused by the old co-location is removed by A-U1.8.08's
  namespace split; the seal lists all verifier-namespace objects.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## A-U1.8.10 — F-11 (major): every control and observation row is bound to a confirmed execution identity

**Finding (F-11, major).** The "independent" evidence is committed static FK-P17 JSON merely
repackaged in CI; `producer-identity` mislabels the CI run as `evidenceOrigin`; the
candidate-sandbox output is uploaded but never consumed; the verifier never confirms run
identities through the GitHub API, so IA-7.4/IA-7.9 are unreachable and laptop-generated
JSON is admitted.

**Contract location edited:** §3.1.2, §3.4.1, §3.4.5, IA-7.4, IA-7.9 (reachability clauses),
NC-U1-05/06/09 notes.

**Ratified delta.**

1. **§3.4.1, appended:** "Every negative-control row and observation row **records the
   execution identity that produced it** — `runId`, `jobId`, `workflowRef`, `headSha`,
   `event`, `conclusion`, and the row's artifact byte digest — carried in
   `executionProvenance[]`. A row whose producing execution identity is absent, or not
   confirmed by the verifier **through the GitHub API** (run exists; run/workflow/head SHA/
   event/conclusion match), is `INVALID`/`U1_PROVENANCE_INVALID` (IA-7.4)."
2. **§3.4.5, replaced:** "Required invariants (IA-5) are checked independently per invariant;
   each required invariant derives its verdict from the relevant candidate input, where the
   **candidate-sandbox output is consumed by the verifier as untrusted data** for the
   independent derivation (§3.1.2: sanitized, parsed linear-time). Re-reading producer rows,
   or reusing the hook's final verdict, authorization result, compiled output, or success
   flag without independent derivation, is insufficient. Until the sandbox output is
   consumed, the affected invariants are not exercised →
   `INCOMPLETE`/`U1_REQUIRED_EVIDENCE_MISSING` (or, at the promotion request's explicit
   declaration, the affected lane is `UNSUPPORTED`/`U1_CONTEXT_UNSUPPORTED` — terminal per
   §3.6.1). Neither path yields ACCEPT."
3. **`evidenceOrigin` semantics (§3.1.2 note, added):** `evidenceOrigin` names the **true
   origin** of the evidence, closed literals `fk-p17-committed` (bytes committed at the
   recorded commit SHA) and `ci-run-generated` (bytes generated in the recorded CI run).
   A CI run that only repackages committed JSON MUST record `fk-p17-committed`; labelling
   such a run `ci-run-generated` is a falsely asserted identity →
   `INVALID`/`U1_PROVENANCE_INVALID`.
4. **IA-7.9 reachability clause (added):** `U1_INDEPENDENCE_UNPROVEN` is raised whenever the
   independence model or the execution-identity confirmation needed to derive a required
   invariant independently is absent or insufficient — including the sandbox-not-consumed
   case.
5. **Sandbox artifact naming (§3.1.2, appended):** candidate-sandbox output is uploaded
   under a per-run unique random artifact name (e.g. `u1-sandbox-<random>`); fixed names
   shared with verifier artifacts (`u1-verifier-decision`, `u1-verifier-observation`) are
   forbidden so candidate pre-creation cannot collide with verifier uploads.

**Mechanism notes (workflow rewrite; binding requirements).**

- The verifier downloads the sandbox output (untrusted) and uses it in the derivation path;
  every control/observation row carries the producing execution identity; the verify job
  calls the GitHub run API to confirm each identity and raises IA-7.4/7.9 as specified.
- `producer-identity`'s `evidenceOrigin` is corrected to the true origin literal.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## A-U1.8.11 — F-12 (major): builder-identity separation is a dispatch precondition; the `main-pr-gate` bypass has a sunset

**Finding (F-12, major).** A control custodian distinct from the builder is not evidenced:
one person is owner, custodian, sole bypass actor on all rulesets, sole environment
approver with `prevent_self_review=false`, and the authority behind the coordinator's
`gh`/`az` acts; CODEOWNERS is annotation while `required_approving_review_count=0`; a bypass
added to `main-pr-gate` has no sunset; nothing makes builder separation a dispatch
precondition.

**Contract location edited:** §3.1.4, §3.2.1, §5 (INCOMPLETE-U1-14 required record
extended), §9.2 (operator-trust assumption scoped).

**Ratified delta.**

1. **INCOMPLETE-U1-14 required record extended:** the builder identity is recorded before
   dispatch: FK-P18′ builder login + object id **and the token/credential scope the builder
   session runs under** (permissions inventory). A builder session running under the owner's
   or custodian's credential voids the separation claim: the review records
   `INCOMPLETE`/`U1_INDEPENDENCE_UNPROVEN`.
2. **New dispatch preconditions (§3.2.1, appended; §3.1.4 "before dispatch" made
   mechanical):**
   - (P1) The builder credential holds **no** bypass-actor right on any ruleset (24257508
     `agent-skills-default`, 22369510 `main-pr-gate`, 24258920 `u1-verifier-pin`), no
     admin/maintain repository role, no environment-approval right on `u1-verifier`, and no
     tag-ruleset update right. Recorded as API evidence (ruleset bypass lists, environment
     protection rules, actor roles) at INCOMPLETE-U1-14/-15.
   - (P2) As soon as a second write-access identity exists (e.g. the FK-P18′ builder
     identity), `required_approving_review_count >= 1` **and**
     `require_code_owner_review = true` are restored on `agent-skills-default` and
     `main-pr-gate`, and this restoration is a **dispatch precondition** — recorded ruleset
     GET evidence at INCOMPLETE-U1-15.
   - (P3) `prevent_self_review` on environment `u1-verifier` is set `true` once a second
     approver identity exists; until then the solo-operator deviation is named in §9.2.
3. **`main-pr-gate` bypass sunset/revert criterion (new clause, §3.1.4):** the bypass actor
   added to ruleset 22369510 on 2026-09-30 (sole bypass `m0r6aN`, `always`) exists **only
   while the `test` + `integration-report` baseline is red on `main`**. The baseline is
   recorded green (CI run `36812944266`, Part C CLOSURE 2026-09-30/10-01), so the bypass
   removal is **due now and is a precondition of FK-P18′ dispatch**. Revert is recorded as
   ruleset GET evidence showing an empty bypass list at INCOMPLETE-U1-14/-15; any future
   re-addition requires the same red-baseline condition and its own sunset record.
4. **§9.2 operator-trust assumption, scoped:** "Operator trust (assumed)" covers the
   custodian and reviewer acting honestly **in their own identities**; it does not extend to
   a builder sharing the operator's credentials. A builder session that runs with the
   owner's/custodian's token is a declared independence failure
   (`INCOMPLETE`/`U1_INDEPENDENCE_UNPROVEN`), not an assumed-boundary silence.

**Mechanism notes (provisioning + record; binding requirements).**

- Provisioning acts: remove the `main-pr-gate` bypass; record builder identity + token
  scope; restore ≥1 approval + code-owner review once a second identity exists; set
  `prevent_self_review` when a second approver exists. All recorded as §5 evidence.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## A-U1.8.12 — F-13 (major): hosted-runner label exception recorded, reasoned, and bounded

**Finding (F-13, major).** §3.1.5/§3.3.4 say "a mutable runner label is not a tested
identity" while the selected runner is exactly a mutable label (`ubuntu-24.04`); the
"limitation recorded" exists only in producer-generated `toolchain.json` at run time; the
verifier records no runner identity at all.

**Contract location edited:** §3.1.5, §3.3.4, §9 (assumed boundaries), §5
(INCOMPLETE-U1-17 closure criterion).

**Ratified delta.**

1. **§3.3.4, replaced:** "Runner lifecycle: the hosted-runner identity (labels, provider
   runner IDs, group) is recorded per execution and rechecked at dispatch (§5,
   INCOMPLETE-U1-17). A mutable runner label is not a tested identity (INF-4) — **with one
   explicit, reasoned exception**: the GitHub-hosted `ubuntu-24.04` runner is accepted at
   **label level** because the hosted image digest is not exposed to jobs. The compensating
   records are mandatory in **both** producer and verifier jobs (producer `toolchain.json`;
   verifier `verifier-context`): `imageOS`, `imageVersion`, `runnerName`, `runnerOs`,
   `runnerArch`, `azCliVersion`. This limitation is recorded as a §9 assumed boundary and is
   cited in every decision's limitations list. A self-hosted runner on the enforcement host
   does not satisfy backstop independence regardless of how its checks report (D8/D22
   lineage, PIN-07)."
2. **§9 assumed boundaries, new bullet:** "*Hosted-runner identity (assumed, bounded):*
   GitHub-hosted runner images are identified at label + `ImageOS`/`ImageVersion` level
   only; image digests are unavailable to jobs. This is an accepted limitation of
   INCOMPLETE-U1-17, not a tested identity (INF-4 exception per §3.3.4)."
3. **INCOMPLETE-U1-17 closure criterion (§5 row note, added):** the row closes at dispatch
   when (a) the runner labels and provider runner IDs are observed and recorded, (b) the
   per-execution records carry the six values above in **both** producer and verifier jobs,
   and (c) the limitation is cited in the decision's limitations list. The label alone never
   closes this row; absence of the six records leaves it `INCOMPLETE`
   (`U1_CONFIGURATION_INCOMPLETE`).

**Mechanism notes (workflow rewrite; binding requirements).**

- The verifier's `verifier-context` records the six runner/toolchain values (it currently
  records no runner identity); the producer's `toolchain.json` records the same set with
  `ImageOS`/`ImageVersion` taken from the environment, not described as unavailable.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## A-U1.8.13 — F-14 (minor): attestation posture — 'not issued' is a named gap that never changes status

**Finding (F-14, minor).** The corroborator-only posture is coherent but unreachable:
neither workflow requests `attestations: write`, so INCOMPLETE-U1-18 cannot be satisfied,
and the contract says nothing about what U1-18 yields when no attestation is issued.

**Contract location edited:** §3.1.6, §5 (INCOMPLETE-U1-18), OQ-U1-04 note.

**Ratified delta — default; the alternative is drafted for owner election.**

> **Default (drafted as the contract text):** INCOMPLETE-U1-18 is recorded as **"not issued
> by the selected workflows" — a named gap**. Absence of an attestation **never changes the
> decision status**: it neither blocks nor supports ACCEPT, and a present attestation remains
> corroborator-only (OQ-U1-04 stands unchanged). The verifier-context records
> `attestationIssued: false`, `issuer: none`, and the gap literal
> `INCOMPLETE-U1-18 not issued by the selected workflows`. §3.1.6 is unchanged: primary
> evidence is the independent read-back + SHA-256 retention proof (§7.1).
>
> **Alternative (owner may elect by ratification instead of the default):** add
> `attestations: write` plus an attest step to the producer workflow through a recorded
> workflow amendment (the producer workflow is outside the verifier pin; any addition is a
> builder change requiring its own recorded amendment and review), exercise issuance for the
> selected event, and record the issued attestation's identity at INCOMPLETE-U1-18. The
> corroborator-only rule of §3.1.6 is unchanged under this option.

**Mechanism notes (workflow rewrite; binding requirements).**

- Under the default: no attest step is added; the verifier-context records the named gap;
  decision logic reads no attestation state in either direction.
- Under the alternative: the issuance step, its permission block, and the recorded issuance
  evidence land via the recorded workflow amendment, never silently.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## A-U1.8.14 — F-15 (major): trust-root binding, revocation records, and U1-19 enforcement

**Finding (F-15, major).** The trust-root/revocation item is honestly named but unbounded:
U1-19 unrecorded blocks nothing, no revocation semantics exist for accepted decisions, the
federated subjects bind to a repository name (rename/transfer/recreate takes over the trust
root), and the trust root is the builder-writable repo.

**Contract location edited:** §3.5.5, §5 (INCOMPLETE-U1-19 required record), §9.2 (platform
facts), IA-9 (revocation grammar), IA-2 (new domain row), §7.8 (consumption gate, with
A-U1.8.09).

**Ratified delta.**

1. **Minimum revocation procedure (new clause under §3.5.5):** on a confirmed compromise —
   (a) delete or disable the federated credentials (`u1-verifier-fc`, `u1-producer-fc`) and
   remove the role assignments (recorded by assignment id); (b) **re-pin by amendment**
   (A-U1.8.16 shape; standing #34) with new `workflowCommit`/`workflowFileSha256` and tag
   move; (c) **append a verifier-authored revocation record** (shape below) that FK-P19 MUST
   check before consuming any seal; (d) decisions issued during the compromise window are
   enumerated by that record and are **revoked, never recreated**: they refuse promotion,
   their failure is a newly reported evidence failure (§3.5.5 carries), and recovery
   proceeds only through new evidence under the new pin. (e) Rotation after compromise:
   new federated credentials and role assignments under the new pin, recorded at
   INCOMPLETE-U1-09/-19; the old trust material is never re-activated.
2. **New IA-2 domain row IA-2.10:** `foreman-line.u1.revocation-record`.
3. **Revocation record (closed shape + prefix):**
   - **Prefix/grammar:** `revocationName := "u1/" owner "/" repo "/revocations/" revocationId ".json"`,
     `revocationId := [a-z0-9-]{1,64}`. Records are create-only by the verifier identity.
   - **Shape:** `schema` literal `u1-revocation-record/v1`; `revocationId`; `issuedBy`
     (verifier identity); `issuedAt` (UTC ISO-8601); `reason`; `revokedDecisionDigests[]`
     (IA-2.3 document digests) and/or `revocationWindow` {`fromUtc`, `toUtc`};
     `compromisedTrustMaterial[]` (federated credential ids, role assignment ids, pin
     record it supersedes); `recordDigest` (detached IA-2.10 document digest).
   - **Consumer rule (§7.8, appended):** FK-P19 (and any consumer) MUST enumerate the
     `revocations/` prefix before consuming a seal; a seal whose `decisionDigest` appears in
     a revocation record, or whose `sealedAt` falls inside a `revocationWindow`, is never
     consumable. A consumer that does not check the prefix cannot claim the U1 chain.
4. **Federated subject binding (INCOMPLETE-U1-19 required record, replaced/extended):**
   "Trust-root acquisition + revocation/update procedure — recorded procedure **and** the
   federated credential subjects bound to the **immutable `repository_id` and
   `job_workflow_ref`** (custom OIDC claim template; exact subject strings recorded). A
   repository-name-only subject is never recorded as the trust root. The trust root is the
   pin record **read at the pinned commit or by API-by-SHA** (A-U1.8.02) plus the protected
   tag ruleset — never the mutable `main` copy alone."
5. **U1-19 enforcement (cross-reference, made explicit here):** "U1-19 unrecorded" is an
   enforced IA-7.7 condition — the verifier refuses ACCEPT with
   `INCOMPLETE`/`U1_CONFIGURATION_INCOMPLETE` whenever the configuration checklist record
   (A-U1.8.03) shows INCOMPLETE-U1-19 unrecorded.

**Mechanism notes (provisioning + record; binding requirements).**

- Provisioning: FIC custom claim templates with `repository_id` + `job_workflow_ref`;
  recorded revocation procedure text at INCOMPLETE-U1-19; the revocation prefix is
  enumerated by the FK-P19 consumer gate.
- The verifier can create revocation records create-only; the record is part of the durable
  evidence identity and follows §3.5 retention.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## A-U1.8.15 — F-18 (minor): ledger digests under IA-2.5, real retrieval-check entries, RBAC principal inventory, network-posture owner decision

**Finding (F-18, minor).** Ledger rows are hashed with a bare byte digest instead of IA-2.5;
`retrieval-check.digestMismatches` emits note indexes instead of object names/digests; no
record shows which principals hold write/Authorization/Owner at account, RG or subscription
scope over the shared `biostack-rg` account; the `defaultAction: Allow` posture is recorded
but undecided; shared-key re-enablement is neither prevented nor detected.

**Contract location edited:** IA-8 (digest rule), IA-4 (retrieval-check shape), §3.3.3,
§5 (INCOMPLETE-U1-04/-09/-10 required records).

**Ratified delta.**

1. **IA-8 digest rule, replaced:** "One record per attempt, digested under **IA-2.5** (the
   attempt-record document digest is the IA-2.5 wrapper digest; the stored row also carries
   its **byte digest** per A-U1.8.01), appended to durable history before the attempt is
   dispatched…". A bare byte digest alone never satisfies IA-8.
2. **`retrieval-check` shape (IA-4, made exact):** `digestMismatches[]` entries MUST carry
   `{objectName, recordedDigest, observedDigest}` (full blob names and `sha256:`-tagged
   digests) — note indexes or prose pointers are refused as
   `INVALID`/`U1_ARTIFACT_INVALID`.
3. **RBAC principal inventory (INCOMPLETE-U1-09 required record, extended):** record **all**
   principals holding write, delete, or role-assignment/authorization rights at **account
   (`bs2jhgwvduljfdwdp`), resource group (`biostack-rg`), and subscription
   (`909e0322-c3c0-4bce-ae53-b3d2ed735bd4`) scope**, as `rbacPrincipalInventory[]`
   `{principalId, roleDefinitionId, scope, assignmentId, createdUtc}`. The record MUST name
   the custodian's account-scope `Storage Blob Data Contributor` breadth (covers every
   container in the shared account) and every principal that could change the immutability
   policy while it is Unlocked or re-enable shared-key access. Unrecorded inventory →
   `INCOMPLETE`/`U1_CONFIGURATION_INCOMPLETE`.
4. **Network posture and shared-key detection (INCOMPLETE-U1-04/-10) — OWNER DECISION
   BLOCK:**

   > **F-18 network decision (owner).** Option A — **keep `defaultAction: Allow`** with
   > documented hardening: named allowed egress (GitHub-hosted runner ranges), TLS1.2+
   > enforcement (observed), public blob access off (observed), and **shared-key
   > re-enablement detection**: `allowSharedKeyAccess` is currently `false` (observed);
   > prevention/detection is recorded as an Azure Policy deny assignment on
   > `allowSharedKeyAccess` **or** a periodic/Alert-triggered management-plane read of the
   > account's `allowSharedKeyAccess` + network ACLs, with any change reported as a new
   > evidence failure and `INCOMPLETE`/`U1_CONFIGURATION_INCOMPLETE` until re-observed.
   > Option B — **tighten** to service tags / private endpoint for the `u1-evidence`
   > container's account, keeping runner egress working, with the same shared-key detection.
   >
   > Both options require the RBAC principal inventory (clause 3) and the shared-key
   > prevention/detection record before ACCEPT. The choice, its hardening record, and the
   > detection mechanism are recorded at INCOMPLETE-U1-10 (and the SKU/redundancy tail of
   > OQ-U1-05 at INCOMPLETE-U1-04 remains owner-pending).

**Mechanism notes (workflow rewrite + provisioning; binding requirements).**

- The claim-attempt/close-attempt ledger writes compute the IA-2.5 document digest per row;
  the retrieval-check records real object names and both digests.
- Provisioning: the principal inventory export (`az role assignment list` at the three
  scopes), the owner's network election, and the shared-key prevention/detection mechanism
  are recorded as §5 evidence before any ACCEPT.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## A-U1.8.16 — workflow re-pin record (standing #34): supersedes the `be3e3de3…` pin

**Finding support:** closes the pin half of **F-1**, and carries the byte-change consequences
of every workflow-side delta above; it is the "workflow re-pin amendment" referenced by the
implementation-side closure of F-1, F-16, F-17.

**Contract location edited:** §1.2 (pin rule application), §5 (INCOMPLETE-U1-13 record),
`U1-verifier-pin.json` (dossier Part D record).

**Ratified delta.**

1. The pin `workflowCommit = be3e3de3dfcf6159d4ffb265aa39847aac5f0814`,
   `workflowFileSha256 = sha256:b7952e1e52f0144e7632fc73d8d04e9564184dfcf4c5af978c71592514cc4bbe`
   is **superseded and must not be dispatched against** (F-1: the pinned verifier cannot
   reach a correct decision).
2. **Re-pin procedure (recorded amendment under standing #34), preconditions before the
   re-pin record is cut:** the rewritten `u1-verify.yml` (and `u1-produce.yml` where its
   deltas apply) implements the mechanism requirements of A-U1.8.01…A-U1.8.15; **actionlint
   is clean**; **one full dry-run against the unlocked container** completes and its result
   (run id, outcome, dates) is recorded; the conflation regression test (A-U1.8.01) and the
   resolver grammar test (A-U1.8.06) pass.
3. **New `U1-verifier-pin.json` record shape (closed; supersedes Part D):** existing fields
   `schema`, `workflow`, `workflowCommit` (new full SHA), `workflowFileSha256` (new digest),
   `tag`, `producerWorkflow`, `custodian`, `recordedAt`, `note` — **plus**:
   `supersedes` {`workflowCommit`: `be3e3de3dfcf6159d4ffb265aa39847aac5f0814`,
   `workflowFileSha256`: `sha256:b7952e1e52f0144e7632fc73d8d04e9564184dfcf4c5af978c71592514cc4bbe`,
   `reason`: `U1-8 closure amendments (F-1, F-2, F-3, F-5, F-16, F-17)`},
   `amendment`: `U1-8-closure-amendments-2026-10-01.md`, `configurationChecklistSha256`
   (A-U1.8.03), `actionlint`: {`result`, `recordedAt`}, `dryRun`: {`runId`, `outcome`,
   `recordedAt`}. The tag `refs/tags/u1-verifier-pin` is moved to the new `workflowCommit`
   by the custodian (tag ruleset 24258920 unchanged).
4. After the re-pin, the material is **re-submitted for §8-style review** (F-1
   `requiredChange`); findings F-1…F-18 close only on ratification + implementation +
   re-pin + that re-review, and FK-P18′ dispatch follows the closed set, never the old pin.

**Mechanism notes (workflow rewrite + record; binding requirements).**

- All workflow-affecting deltas (F-1 outputs maps, F-2 digest classes, F-3 pin path/ordering,
  F-4 live reads, F-5 oracle logic, F-6 set checks, F-7 request verification, F-8/F-9
  namespaces, F-10 seal, F-11 provenance checks, F-13 runner records, F-16 parser
  hardening, F-17 quoting/env-passing) land in the **same** re-pinned revision.
- No dispatch on `be3e3de3…`; the re-pin record is the only current pin.

**Authority basis:** [RATIFIED — owner decision batch 2026-10-01 (recorded verbatim by the
coordinator): F-3 = option (b) "Non-authoritative event runs"; F-8 = "ABAC prefix conditions
now"; F-14 = option (a) "Named gap, never status-affecting"; F-18 = "Allow + hardening +
shared-key detection"; all remaining amendments "Ratify all as drafted". Owner: Clinton
Morgan (m0r6aN). Ledger row: U1-8 closure batch, 2026-10-01. This delta binds.]

---

## Implementation-side closure notes (F-1, F-16, F-17)

These findings close on the workflow rewrite plus the re-pin record; no standalone contract
delta is needed beyond those already drafted above.

- **F-1 (blocker) — closure is implementation-side.** The pinned `u1-verify.yml@be3e3de3…`
  declares no job-level `outputs:` maps, so every `needs.*.outputs.*` consumer evaluates to
  empty strings and the run cannot reach a correct decision. The workflow rewrite MUST add
  `outputs:` maps to `resolve-request`, `claim-attempt`, `verify` and `retention-observation`;
  actionlint + one recorded dry-run are re-pin preconditions (A-U1.8.16). The byte change is
  a pin change → **A-U1.8.16** is the contract-side record.
- **F-16 (minor) — closure is implementation-side.** Size/count limits are applied after
  download and unguarded parsing crashes on hostile input. The workflow rewrite MUST check
  artifact count and total size from blob list metadata (`contentLength`) **before any
  download** and reject over-limit as `INVALID`/`U1_EVIDENCE_LIMIT_EXCEEDED`; parsing MUST be
  depth-limited (16), duplicate-key-rejecting and NaN/Infinity-rejecting, with every parse
  failure mapped to `INVALID`/`U1_ARTIFACT_INVALID` (never an uncaught crash, never a burned
  attempt without a decision). The byte change lands in the **A-U1.8.16** re-pin.
- **F-17 (minor) — closure is implementation-side.** Unvalidated request ids are interpolated
  into shell and used unsanitized in blob names/API paths; backticks inside double-quoted
  `echo` strings are command substitution. The workflow rewrite MUST validate
  `promotionRequestId` against the closed grammar `[a-z0-9-]{1,64}` at the resolver (grammar
  now contract-side at A-U1.8.06), pass values via `env:` instead of expression interpolation
  into shell, and use escaped or single-quoted backticks. The byte change lands in the
  **A-U1.8.16** re-pin.

---

## Closure matrix

Rule for column 5 stated at §0: `yes` = owner decision block / owner-pending adoption /
owner-ratified semantics or assumed boundaries change; `no` = concretization or
strengthening inside coordinator closure authority (provisioning acts still need their own
owner/infrastructure authority).

| F-id | Amendment id | Contract location | Side | Owner-ratification required |
|---|---|---|---|---|
| F-1 (blocker) | A-U1.8.16 + implementation | §1.2, §5 INCOMPLETE-U1-13, `U1-verifier-pin.json` | workflow + record | no |
| F-2 (blocker) | A-U1.8.01 | IA-2, IA-4, §7.1 | contract + workflow | no |
| F-3 (blocker) | A-U1.8.02 | §3.1.1, §2 item 3, §5 INCOMPLETE-U1-15 | contract + workflow | **yes** (option a/b) |
| F-4 (blocker) | A-U1.8.03 | §5, §7.7, §7.8, INCOMPLETE-U1-11/-15..19, IA-2.9, IA-4 | contract + workflow + provisioning | **yes** (lock ruling adopted) |
| F-5 (blocker) | A-U1.8.04 | §3.4.1, §3.4.2, §3.4.4, §7.6, IA-2.8, IA-4, IA-11 | contract + record + workflow | **yes** |
| F-6 (major) | A-U1.8.05 | IA-5, IA-6, §7.5 | contract + workflow | **yes** |
| F-7 (major) | A-U1.8.06 | IA-2.2, IA-4, §3.2.3, §7.4 | contract + workflow | no |
| F-8 (major) | A-U1.8.07 | §3.3.2, §3.3.3, §3.1.3, IA-8, IA-9, §5 INCOMPLETE-U1-09 | contract + provisioning + workflow | no |
| F-9 (major) | A-U1.8.08 | IA-9, IA-4, IA-8.5, §3.5.4 | contract + workflow | no |
| F-10 (major) | A-U1.8.09 | IA-4 (OQ-U1-07), IA-2.7, §3.5.3, §7.8 | contract + workflow | no |
| F-11 (major) | A-U1.8.10 | §3.1.2, §3.4.1, §3.4.5, IA-7.4, IA-7.9 | contract + workflow | no |
| F-12 (major) | A-U1.8.11 | §3.1.4, §3.2.1, §5 INCOMPLETE-U1-14, §9.2 | contract + provisioning + record | **yes** (gate restoration) |
| F-13 (major) | A-U1.8.12 | §3.1.5, §3.3.4, §9, §5 INCOMPLETE-U1-17 | contract + workflow | **yes** (INF-4 exception) |
| F-14 (minor) | A-U1.8.13 | §3.1.6, §5 INCOMPLETE-U1-18, OQ-U1-04 | contract (+ workflow if elected) | **yes** (default/alternative) |
| F-15 (major) | A-U1.8.14 | §3.5.5, §5 INCOMPLETE-U1-19, §9.2, IA-2.10, IA-9 | contract + provisioning + record | **yes** (revocation semantics) |
| F-16 (minor) | A-U1.8.16 + implementation | §2 item 1 enforcement (IA-7.2), workflow | workflow + record | no |
| F-17 (minor) | A-U1.8.16 + implementation (grammar at A-U1.8.06) | IA-4 promotionRequestId grammar, workflow | workflow + contract | no |
| F-18 (minor) | A-U1.8.15 | IA-8, IA-4 retrieval-check, §3.3.3, §5 INCOMPLETE-U1-04/-09/-10 | contract + provisioning + record | **yes** (network decision) |

**Owner decision blocks to choose on ratification:** F-3 (option a or b; recommendation b),
F-14 (default named gap or issuance alternative), F-18 (network option A or B + shared-key
mechanism). **Owner adoptions to confirm:** F-4 (2026-09-30 lock-flip ruling into contract
text + new-promotion-request budget path), F-12 (approval-gate restoration + bypass
sunset), F-13 (INF-4 runner-label exception), F-5/F-6/F-15 (promotion-acceptance
semantics). Everything else records the coordinator closure authority basis.

Until every authority-basis placeholder is filled, every workflow delta is implemented and
re-pinned per A-U1.8.16, and the re-submitted review returns ACCEPT, the §8 findings remain
open and FK-P18′ remains undispatchable.

---

## PART D — WHERE TO VERIFY (read from git at the pinned revision)

- Pinned workflow bytes: `git show 16a7e0fb0a5713bdfc7722e3227def6e6128cade:.github/workflows/u1-verify.yml`
  (must hash to the pin record's workflowFileSha256) and `u1-produce.yml`.
- Shakedown evidence in the store (read-only): `u1/m0r6an/agent-skills/verifications/u1-shakedown-2026-10-01/a02/`
  (decision.json, seal.json, retrieval-check, separation-probe, verifier-context,
  retention-observation) and the producer bundle at `u1/m0r6an/agent-skills/runs/36926434897/p01/`.
- GitHub run 36944407315 (verifier), 36926434897 (producer).

Return only the JSON verdict.
