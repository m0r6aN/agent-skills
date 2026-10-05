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
