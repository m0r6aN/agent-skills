# U1-8 closure amendments, round 2 — contract-side closure of the closure-review findings (2026-10-02)

**Instrument:** amendments **A-U1.8.17 … A-U1.8.27**, closing findings G-1 … G-14 of
`U1-8-closure-verdict-2026-10-02.json` (anthropic/claude-sonnet-5-5, `FURTHER_FINDINGS`).
Triage and coordinator reproduction: `U1-8-closure-verdict-triage-2026-10-02.md`.
**Base documents amended:** `U1-contract-2026-09-29.md` as amended by
`U1-8-closure-amendments-2026-10-01.md` (A-U1.8.01 … A-U1.8.16, committed bytes `895fbe0e…`).
**Status:** RATIFIED — owner, 2026-10-02: "All five steps ratified as written. Proceed with full
authority" (steps: revise this draft with the reviewer's two wording fixes, ratify
A-U1.8.17…27, single re-pin, re-submit). Rulings D-1 … D-4 (2026-10-02) are recorded at their
amendments. **Revision R1 (2026-10-02, reviewer, within the ratified step 2):** items marked
"R1" below correct wording the reviewer flagged or that implementation showed to be impossible
as first drafted; each R1 correction is listed in the closure matrix note.
**Write boundary:** this document only. No workflow, code, provisioning, or existing file is
edited by it.
**Pin consequence (standing #34):** G-3, G-4, G-5, G-6, G-7, G-8, G-10, G-12 and the code
side of G-14 change the pinned verifier bytes — they land in **one** re-pin, A-U1.8.27.
FK-P18′ MUST NOT be dispatched on `16a7e0fb0a5713bdfc7722e3227def6e6128cade`.

## 0. Reading rules

The rules of `U1-8-closure-amendments-2026-10-01.md` §0 carry unchanged: findings'
`requiredChange` texts are the floor; no delta weakens a guarantee; refusal codes are the closed
IA-7 vocabulary plus `INVALID`/`PIN_DRIFT`; no delta introduces a new code. New IA-2 domain
introduced here: IA-2.11 `foreman-line.u1.trust-policy` (A-U1.8.18), same `{domain,
apiVersion, payload}` wrapper, `apiVersion` `0.1.0`.

**Withdrawn statements.** The closure report's "the F-4 gate made the deferral EXPLOIT-PROOF"
(§4) and A-U1.8.16 clause 3's "(tag ruleset 24258920 unchanged)" are withdrawn: at
2026-10-02 the tag ruleset did not exist (G-1, reproduced) and main-head code could obtain
the verifier identity (G-2, reproduced). F-12 is restated as "contract closed; dispatch
preconditions pending" (G-11).

---

## A-U1.8.17 — G-9 (major) + G-1 (blocker): transitive pin binding, protected by an observed tag ruleset

**Finding (G-9).** The F-19 shakedown fix replaced A-U1.8.02 clause 1(i) ("the run executes
the workflow file at the pinned full commit SHA") with descendant-plus-byte-equality without an
amendment. **(G-1)** Tag ruleset 24258920 no longer exists, so the tag anchoring the
transitive rule is unprotected.

**Owner ruling D-1 (2026-10-02):** "Ratify transitive binding as A-U1.8.17".

**Contract location edited:** §3.1.1 (A-U1.8.02 binding clause 1), §5 INCOMPLETE-U1-13/-15,
A-U1.8.11 P1, A-U1.8.16 clause 3.

**Delta.**

1. **A-U1.8.02 binding clause 1(i), replaced:** "(i) the run executes at a commit `R` such
   that **all** of: (a) the workflow file bytes at `R`, fetched through the contents API by
   SHA `R`, hash to the pin record's `workflowFileSha256`; (b) the pin record's
   `workflowCommit` is `R` or an ancestor of `R` (compare API status `identical` or
   `ahead`; no local `git merge-base`); (c) `R` equals the target of
   `refs/tags/u1-verifier-pin` at run start **and** the dispatch input `pinned-commit-sha`;
   (d) the tag ref is protected at run start (clause 2). A record cannot carry its own commit
   SHA, so `workflowCommit` names the commit that introduced the pinned bytes; `R` is the
   commit that carries the pin record naming them."
2. **Tag protection observed, not assumed (new clause, §3.1.1) — R1:** pin-check reads the
   repository rulesets through the API at run start (list, then GET each tag-target ruleset;
   public repository, no admin scope required) and requires an **active** ruleset whose target
   is `tag`, whose `ref_name.include` contains `refs/tags/u1-verifier-pin`, and whose rules
   include `update`, `deletion` and `non_fast_forward`. Absent, disabled, or any of these
   missing → `PIN_DRIFT`, no decision, no attempt consumed. The bypass list is **not** a runtime
   gate (`bypass_actors` is not returned to unauthenticated or `contents: read` callers); when the
   response does include it and it names an actor other than the custodian, the run records the
   deviation in verifier-context and `PIN_DRIFT`s. The ruleset id, enforcement, rule types and
   the bypass list as seen by the owner (admin GET) are recorded at INCOMPLETE-U1-15, never
   assumed by the runtime check.
3. **Executed SHA recorded:** verifier-context, decision and seal carry `executedCommit`
   (= `R`); every re-review dossier states `R` for each cited run.
4. **INCOMPLETE-U1-15 required record extended:** the tag ruleset GET (id, target,
   conditions, rules, bypass list, enforcement) and the tag target SHA. **A-U1.8.11 P1** cites
   the restored ruleset's id in place of 24258920.
5. **Provisioning act (executed 2026-10-02 under owner blanket authority):** ruleset **24378879**
   `u1-verifier-pin` (target tag, active, rules `update`/`deletion`/`non_fast_forward`, bypass
   custodian only) replaces the vanished 24258920; evidence at
   `U1-live-changes-2026-10-02.md`. Clause 2 is fail-closed if it is ever removed.

**Authority basis:** [D-1 RULED 2026-10-02 (owner, verbatim above); delta text RATIFIED
2026-10-02 (owner, "All five steps ratified as written").]

---

## A-U1.8.18 — G-3(b)+(c) (blocker): trust-policy identity without a hash cycle; one pin record; 7-field execution equality

**Finding.** The request's `trustPolicyDigest` (`c1b66138…`, byte digest of the v1 pin record
at 75d718b) is compared with the byte digest of the pin record at the run commit
(`a8f986cd…` at 95ee74e; `dbfacbcb…` at 27323ec): every record-only edit moves the target,
so no request can stay valid across a re-cut. The verifier reads a second, dead
`pin-record.json` path (u1-verify.yml@27323ec L121, L967-968, L1027-1028). The producer's
`bundle.execution` carries 9 keys; the verifier demands exact dict equality with 7
(L1192-1196), so a conforming bundle cannot pass §7.4.

**Contract location edited:** IA-2 (new row IA-2.11), IA-4 PromotionRequest
`trustPolicyDigest` (A-U1.8.06), §7.4.

**Delta.**

1. **IA-2.11 `foreman-line.u1.trust-policy`:** the trust-policy document is the closed
   projection of the pin record `{workflow, workflowCommit, workflowFileSha256, tag,
   producerWorkflow, custodian}`; its document digest is the **trust-policy digest**. Fields
   outside the projection (`recordedAt`, `note`, `dryRun`, `actionlint`, `supersedes`,
   checklist/oracle digests) never enter it, so record-only edits do not move it.
2. **PromotionRequest `trustPolicyDigest`, redefined:** the IA-2.11 document digest of the
   trust policy the request was authored against. The verifier recomputes it from **the one**
   pin record it reads (at `R`, by API — A-U1.8.17) and compares; mismatch →
   `INVALID`/`U1_SUBJECT_MISMATCH`. The checklist carries no `trustPolicyDigest`.
3. **One pin record:** every pin comparison in every job uses the pin record fetched by API at
   `R` in pin-check and passed by job output; the `pin-record.json` file branch is deleted.
4. **§7.4 execution equality, made exact:** the verifier compares `bundle.execution` to the
   request's `selectedExecution` on exactly the seven fields `provider`, `repositoryId`,
   `workflowId`, `runId`, `attempt`, `jobId`, `event`; each must be present in both and equal.
   Extra producer keys are recorded, never compared, never trusted.

**Authority basis:** [RATIFIED 2026-10-02 (owner, "All five steps ratified as written") —
coordinator closure authority (concretization of A-U1.8.06 / §7.4).]

---

## A-U1.8.19 — G-3(a) (blocker): the oracle is per request, as A-U1.8.04 clause 6 already ratified

**Finding.** The oracle sits at `docs/goals/foreman-kernel/U1-expected-outcome-oracle.json`,
is read at the pinned commit (u1-verify.yml@27323ec L974), carries `promotionRequestId`
`fk-p18-prime-r1`, and its digest lives in the pin record — so every new request needs a
re-pin, and the shakedown request was refused ("oracle promotionRequestId mismatch").

**Owner ruling D-3 (2026-10-02):** "Per-request oracle".

**Contract location edited:** none new — implementation conforms to A-U1.8.04 clause 6;
A-U1.8.16 clause 3 pin-record shape (field removed).

**Delta.**

1. The oracle is read **only** from
   `plugins/foreman-line/docs/goals/foreman-kernel/promotion-requests/<promotionRequestId>/expected-outcome-oracle.json`
   at the request commit (A-U1.8.24 ancestry applies), its IA-2.8 document digest must equal
   the request's `oracleDigest`, and its `promotionRequestId` must equal the request's;
   mismatch → `INVALID`/`U1_SUBJECT_MISMATCH`; absent → `INCOMPLETE`/
   `U1_REQUIRED_EVIDENCE_MISSING`.
2. `oracleDigest` is removed from the pin record shape; the pin does not change per request.
3. The promotion request moves to
   `promotion-requests/<promotionRequestId>/promotion-request.json` beside its oracle (one
   directory per request, CODEOWNERS-covered).

**Authority basis:** [D-3 RULED 2026-10-02 (owner, verbatim above); delta text RATIFIED
2026-10-02 (owner, "All five steps ratified as written").]

---

## A-U1.8.20 — G-5 (blocker) + G-6 (major): independent derivation is a comparison, and provenance binds bytes, not existence

**Finding (G-5).** `sandbox_consumed=True` (u1-verify.yml@27323ec L1066-1088) only clears
the `U1_INDEPENDENCE_UNPROVEN` note; sandbox results feed no comparison; the sandbox step masks
failure (`cp … || true`, `npm test … || echo $?`). **(G-6)** `executionProvenance`
confirmation proves a run or file exists with self-asserted identifiers, not that it produced
the row.

**Owner ruling D-4 (2026-10-02):** "Implement derivation in this re-pin".

**Contract location edited:** §3.4.5 (A-U1.8.10 clause 2), §3.4.1 (A-U1.8.10 clause 1),
IA-7.4, IA-7.9, IA-4 (new sandbox-result shape).

**Delta.**

1. **Sandbox result (closed shape, IA-4):** `schema` `u1-sandbox-result/v1`;
   `harnessExitStatus` (SafeInt); `candidateCommit`; `invariantResults[]`
   {`invariantId`, `rowId`, `exitStatus`, `observedResult`, `signals[]`};
   `controlResults[]` {`controlId`, `exitStatus`, `observedResult`, `signals[]`}. The
   sandbox step never masks a failure: copy or harness failure is recorded as a non-zero
   `harnessExitStatus`, never swallowed.
2. **§3.4.5, appended (derivation rule):** the verifier parses the sandbox result as untrusted
   data (strict parser, F-16 limits) and compares it **row by row** with the producer rows and
   with the oracle: for every required invariant row and every control, `exitStatus` and
   `observedResult` must equal the producer row's, and the sandbox `signals[]` must contain
   the oracle's `requiredSignals[]`. Any mismatch → `INVALID`/`U1_CONTROL_FAILED`. Missing,
   empty, unparsable result, non-zero `harnessExitStatus`, or `candidateCommit` ≠ subject
   commit → `INCOMPLETE`/`U1_REQUIRED_EVIDENCE_MISSING` **and** `U1_INDEPENDENCE_UNPROVEN`.
   `candidate-reexec=false` → `U1_INDEPENDENCE_UNPROVEN`, never cleared.
3. **Consumption claimed only on comparison:** verifier-context records `sandboxComparison`
   {`ran`, `rowsCompared`, `mismatches[]`}; `U1_INDEPENDENCE_UNPROVEN` is cleared only when
   `ran = true`, `rowsCompared` ≥ the oracle's required row count, and `mismatches` is empty.
4. **§3.4.1 provenance, replaced (A-U1.8.10 clause 1):** "Identity confirmation alone is not
   provenance. For `github-run` rows: the run's `path` is in the closed allowlist
   {`.github/workflows/u1-produce.yml`} at the protected default branch, `head_sha` equals the
   subject commit, `conclusion` is `success`, and an artifact of that run, downloaded by the
   verifier, has byte digest equal to the row's `artifactByteDigest` and contains the row by
   canonical bytes. For `committed-source` rows: the cited file fetched at the cited commit
   hashes to the claimed digest, the row equals the corresponding entry by canonical bytes, and
   the commit is an ancestor of the protected default branch (compare API). Any failure →
   `INVALID`/`U1_PROVENANCE_INVALID`."

5. **Sandbox mechanics (R1):** the `candidate-sandbox` job runs after `resolve-request`, checks
   out the candidate commit — the `head_sha` of the selected producer run, read through the
   API — and runs the fixed entrypoint
   `plugins/foreman-line/bypass-outage-harness/u1-sandbox.mjs` under a wrapper that writes the
   harness exit status to `harness-exit.txt`. The wrapper's value is authoritative; the result's
   own `harnessExitStatus` must equal it, else `INCOMPLETE`/`U1_REQUIRED_EVIDENCE_MISSING` and
   `U1_INDEPENDENCE_UNPROVEN`. The job has no environment and no Azure login. The verifier checks
   the result's `candidateCommit` against the producer bundle's `subject.candidate.commit`.
6. **Committed-source row equality (R1):** the row, with its `executionProvenance` member
   removed, must equal by canonical bytes the entry of the cited file located by `controlId`
   (controls) or `caseId` (observation rows). The producer adds only `executionProvenance`
   when the committed entry already carries `observedResult` and `invariantIds`; feeds MUST
   carry both in the committed entry.
7. **Fixture requests (R1, reviewer fix 1):** a promotion request whose id begins `u1-fixture-`
   is a coordinator test request: its rows cite `committed-source` provenance on the protected
   default branch and its sandbox entrypoint is a coordinator-owned fixture harness. Fixture
   decisions are produced and sealed like any other but are never consumable
   (A-U1.8.21 clause 4). While the lock is unrecorded, the expected fixture outcome is
   `INCOMPLETE` with reason codes exactly `[U1_CONFIGURATION_INCOMPLETE]`.

**Authority basis:** [D-4 RULED 2026-10-02 (owner, verbatim above); delta text RATIFIED
2026-10-02 (owner, "All five steps ratified as written").]

---

## A-U1.8.21 — G-7 (major): the seal carries the decision status; consumption requires ACCEPT

**Finding.** The seal has no status; the consumer rule refuses only on retention mismatch or
digest mismatch, so the stored shakedown seal (`authoritative:true`, `match`) over an
`INVALID` decision satisfies "consume only the seal".

**Contract location edited:** A-U1.8.09 clauses 2-3 (seal shape, §3.5.3/§7.8 consumption
rule), A-U1.8.14 clause 3 consumer rule.

**Delta.**

1. **Seal shape, extended:** `decisionStatus` (`ACCEPT | INVALID | INCOMPLETE | UNSUPPORTED`)
   and `reasonCodes[]` copied from the sealed decision; `executedCommit` (A-U1.8.17).
2. **Consumer rule, replaced:** a seal is consumable **only if all** hold: `decisionStatus ==
   ACCEPT`; `reasonCodes` empty; `authoritative == true`; `retentionObservationResult ==
   match`; the sealed decision's document and byte digests match `decisionDigest` /
   `decisionByteDigest`; `sealDigest` verifies; no revocation record names the decision digest
   or covers `sealedAt` (A-U1.8.14). Anything else refuses promotion.
3. **Consumer-gate fixture (FK-P19 precondition):** a fixture set with an INVALID seal, a
   non-authoritative seal, a `mismatch` seal, a revoked-digest seal and a status/decision
   disagreement, each refused, exists and passes before FK-P19 consumes any seal.

4. **Fixture seals (R1):** a seal whose `promotionRequestId` begins `u1-fixture-` is never
   consumable, whatever its status.

**Authority basis:** [RATIFIED 2026-10-02 (owner, "All five steps ratified as written") —
coordinator closure authority (strengthening of A-U1.8.09).]

---

## A-U1.8.22 — G-2 (major): the verifier identity is reachable only from the protected tag

**Finding.** Environment `u1-verifier` carries a `main` branch policy (61546414) beside the tag
policy (61684968): main-head code obtains `u1-verifier-mi` (create rights under
`verifications/*`, `attempt-ledger/*`) and can write a seal labelled `authoritative:true`.

**Owner ruling D-2 (2026-10-02):** "Read-only u1-reader-mi".

**Contract location edited:** A-U1.8.02 option (b) mechanism notes, §3.3.3, INCOMPLETE-U1-15
/-19.

**Delta.**

1. Environment `u1-verifier` admits **only** the tag policy on `refs/tags/u1-verifier-pin`;
   the `main` policy is deleted (provisioning act, owner authority — not yet authorized).
2. The `workflow_run` lane never enters `u1-verifier`. It authenticates, if at all, as
   `u1-reader-mi` (container-scoped `Storage Blob Data Reader`) through a federated credential
   bound to the default-branch workflow, writes **no** blob, records its non-authoritative
   decision only as a workflow artifact, and can therefore produce no seal.
3. pin-check refuses (`PIN_DRIFT`) any run whose ref is not the tag before any Azure login in
   the authoritative lane; the environment GET (policies) is recorded at INCOMPLETE-U1-15 and
   the federated credential subjects at INCOMPLETE-U1-19.

4. **Structure (R1):** the `evaluate` job holds no environment and no write role. It
   authenticates as `u1-reader-mi` (container data Reader plus Reader at account scope for the
   immutability GET) through credentials bound to the run ref — the default branch for the
   `workflow_run` lane, `refs/tags/u1-verifier-pin` for the dispatch lane. Writes happen only in
   the `claim-attempt`, `persist`, `retention-observation` and `close-attempt` jobs, all under
   environment `u1-verifier` (tag only) and only for authoritative runs.
5. **Binding limitation (R1, reviewer fix 3):** the reader credentials bind to the ref, not to
   the workflow. Binding to `job_workflow_ref` and `repository_id` needs GitHub OIDC subject
   customization, which changes the subject of every workflow in the repository and breaks the
   existing federated credentials. Accepted: the reader is read-only on one container and Reader
   on the account.
6. **Provisioning executed 2026-10-02 (owner blanket authority):** `u1-reader-run-fc` (default
   branch), `u1-reader-tag-fc` (tag), account-scope Reader on `u1-reader-mi`; the earlier
   `u1-reader-fc` (subject `pull_request`) deleted; environment policy 61546414 deleted.

**Authority basis:** [D-2 RULED 2026-10-02 (owner, verbatim above); delta text RATIFIED
2026-10-02 (owner, "All five steps ratified as written").]

---

## A-U1.8.23 — G-4 (major): denials are classified by HTTP status and error code; all four probes recorded

**Finding.** The out-of-prefix probe accepts a denial only on the stderr tokens
`AuthorizationPermissionMismatch`/`AuthorizationFailure` (u1-verify.yml@27323ec L1507); the CLI
printed "You do not have the required permissions…" for a real denial, so the probe can never
succeed. Only 1 of A-U1.8.07 clause 6's 4 probes exists.

**Contract location edited:** A-U1.8.07 clause 6 (probe record), INCOMPLETE-U1-09.

**Delta.**

1. Each probe issues the request so that the HTTP status and `x-ms-error-code` are observed
   (REST call or `--debug` parse); a denial is `status == 403` with error code
   `AuthorizationPermissionMismatch` or `AuthorizationFailure`. Any success, or any other
   status/code, is recorded verbatim and → `INCOMPLETE`/`U1_INDEPENDENCE_UNPROVEN`. The
   probe record adds `observedHttpStatus` and `observedErrorCode`.
2. Probe targets use the reserved name `u1/<owner>/<repo>/runs/probe-<runId>-<random>.json`,
   which cannot match the producer grammar `runs/<runId>/pNN/…`.
3. The four probes: verifier out-of-prefix create and verifier overwrite of an existing object
   (run in the verifier job); producer delete and producer create under `verifications/`
   (run in the producer job, recorded in its bundle). All four recorded at INCOMPLETE-U1-09.

4. **Denial classes (R1, extended R2 by the first positive-path dry run):** for a create the denial is
   HTTP 403 with `AuthorizationPermissionMismatch` or `AuthorizationFailure`. For a delete or overwrite
   of an existing object, HTTP 403 `UnauthorizedBlobOverwrite` (the role has `add` but no `write`;
   observed from Azure Storage in run 37060187040) and HTTP 409 with `BlobImmutableDueToPolicy` or
   `BlobImmutableDueToLegalHold` (the immutability policy, not RBAC, refuses) are also denials.
   Anything else is recorded verbatim and is not a denial.
5. **Producer probes in the bundle (R1):** a `producer-probe` job (environment `u1-producer`)
   runs before `assemble`; its record is packaged as
   `evidence/separation-probe/producer-probes.json` (kind `separation-probe`) and checked by the
   verifier. It is a producer-authored corroborating record; the owner's admin-side probes remain
   the INCOMPLETE-U1-09 evidence.

**Authority basis:** [RATIFIED 2026-10-02 (owner, "All five steps ratified as written") —
coordinator closure authority (concretization of A-U1.8.07 clause 6).]

---

## A-U1.8.24 — G-8 (major): the promotion request comes from protected history

**Finding.** The request is fetched at any dispatcher-supplied SHA (u1-verify.yml@27323ec
resolve-request, ~L413-433) with no check that the commit is in protected history.

**Contract location edited:** A-U1.8.06 clause 4, §3.2.3.

**Delta.** resolve-request requires the request commit to be identical to or an ancestor of the
protected default branch head (compare API, as pin-check does for `R`); otherwise
`INVALID`/`U1_PROVENANCE_INVALID`. The `promotion-requests/` tree stays CODEOWNERS-covered;
the P2 review settings of A-U1.8.11 apply when a second identity exists.

**Authority basis:** [RATIFIED 2026-10-02 (owner, "All five steps ratified as written") —
coordinator closure authority.]

---

## A-U1.8.25 — G-10 (major): runner image identity is read correctly and required

**Finding.** Both workflows read `IMAGEOS`/`IMAGEVERSION` (u1-produce.yml@27323ec L416-417,
L444-445; u1-verify.yml@27323ec L1519-1520); Linux runners set `ImageOS`/`ImageVersion`, so
both are stored as empty strings, and nothing fails on empty values.

**Contract location edited:** A-U1.8.12 clause 3(b), INCOMPLETE-U1-17.

**Delta.** Both workflows read `ImageOS` and `ImageVersion`. An empty value in any of the six
compensating runner fields, in the producer toolchain record or the verifier-context, →
`INCOMPLETE`/`U1_CONFIGURATION_INCOMPLETE`. The producer change is recorded as a builder
amendment of `u1-produce.yml` (outside the verifier pin).

**Authority basis:** [RATIFIED 2026-10-02 (owner, "All five steps ratified as written") —
coordinator closure authority.]

---

## A-U1.8.26 — G-11, G-12, G-13, G-14: dispatch preconditions, tooling, records, revocation writer

1. **G-11 (major).** A-U1.8.11 clause 3 stands: removing the `main-pr-gate` (22369510)
   bypass is a precondition of FK-P18′ dispatch. Provisioning act — owner authority, not yet
   authorized (2026-10-02). The builder login, object id and token scope are recorded at
   INCOMPLETE-U1-14 before dispatch.
2. **G-12 (minor).** actionlint runs in CI on the re-pin commit; its version and result are
   recorded in the pin record (`actionlint` {`result`, `version`, `runId`}). The conflation
   self-test calls the real comparison function with a byte digest offered as a document
   digest (and the reverse) and requires a refusal.
3. **G-13 (minor).** Records carry real UTC timestamps (no `T00:00:00Z` placeholders;
   `recordedAt` after every fact it records); INCOMPLETE-U1-13 is refreshed at the re-pin;
   `supersedes` is a chain back to `be3e3de3dfcf6159d4ffb265aa39847aac5f0814`; the checklist
   carries only its ratified fields (`evidenceLocation`/`unrecordedReason` are added to its
   shape here, `trustPolicyDigest` is removed per A-U1.8.18); every stored JSON, including
   ledger rows, is parsed with the strict parser. The contract and both amendment documents are
   committed to the protected default branch before the re-pin.
4. **G-14 (minor).** The verifier role's ABAC condition gains a create-only clause for
   `u1/m0r6an/agent-skills/revocations/*` (provisioning act — owner authority, not yet
   authorized); `federatedSubject` in verifier-context, observation and seal is taken from the
   observed OIDC token claims (`sub`, `repository_id`, `job_workflow_ref`), never a literal.

**Execution note (R1):** G-11 executed 2026-10-02 (owner blanket authority): `main-pr-gate`
(22369510) bypass removed, and the `agent-skills-default` (24257508) bypass removed at the
reviewer's step-1 recommendation. G-14 executed 2026-10-02: `revocations/*` create clause added
to the verifier role condition. Evidence: `U1-live-changes-2026-10-02.md`.

**Authority basis:** [RATIFIED 2026-10-02 (owner, "All five steps ratified as written") —
coordinator closure authority; provisioning acts in items 1 and 4 executed under the owner's
blanket authority of 2026-10-02.]

---

## A-U1.8.27 — re-pin record (standing #34): supersedes the `16a7e0fb…` pin

1. The pin `workflowCommit 16a7e0fb0a5713bdfc7722e3227def6e6128cade`, `workflowFileSha256
   sha256:3301a0e4bb95a272c5110907b6bfe6e9d3c3c6111f321f4ce285c1ac085e4c10` is superseded and
   must not be dispatched against.
2. **Preconditions before the re-pin record is cut:** `u1-verify.yml` implements A-U1.8.17
   … A-U1.8.26; `u1-produce.yml` implements its A-U1.8.20/.23/.25 parts; actionlint clean in
   CI (A-U1.8.26 item 2); the tag ruleset (A-U1.8.17 clause 2) and the `u1-verifier`
   tag-only policy (A-U1.8.22) exist; and two dry runs against the Unlocked container are
   recorded:
   - **negative path:** one request per refusal cause — oracle id mismatch, trust-policy
     mismatch, execution-field mismatch, sandbox/producer mismatch, non-ancestor request
     commit — each refused with its specified code;
   - **positive path:** a fully conforming request and bundle whose decision is
     `INCOMPLETE` with reason codes exactly `[U1_CONFIGURATION_INCOMPLETE]` and notes limited
     to the lock state and unrecorded checklist rows — proof that the F-4 gate is the only
     remaining barrier to ACCEPT (A-U1.8.03 clause 6).
3. **Pin record shape:** A-U1.8.16 clause 3 minus `oracleDigest` (A-U1.8.19), plus
   `tagTarget` (the SHA the tag points at), `tagRulesetId`, and `supersedes` chained to
   `be3e3de3…`.
4. After the re-pin the closure package is re-submitted to the same reviewer, with every stored
   decision's `notes[]` verbatim and the executed commit of every run. FK-P18′ stays
   undispatchable until that review returns ACCEPT and the A-U1.8.11/A-U1.8.26 dispatch
   preconditions are recorded.

**R1 corrections to this amendment:**

- **Clause 3 (R1):** `tagTarget` cannot be a pin-record field: the record is part of the commit
  the tag points at, so the record would have to contain its own commit SHA. The pin record
  carries `tagRulesetId` instead; the tag target is `executedCommit` in verifier-context,
  decision and seal and in the INCOMPLETE-U1-15 evidence.
- **Clause 2, positive path (R1):** uses a fixture request (A-U1.8.20 clause 7); decision
  `INCOMPLETE`, reason codes exactly `[U1_CONFIGURATION_INCOMPLETE]`, notes limited to the
  immutability not-Locked note and unrecorded-checklist-row notes.
- **Clause 2, negative path (R1):** five requests, each with its own budget. Oracle id mismatch,
  trust-policy mismatch and execution-field mismatch each → recorded decision `INVALID`/
  `U1_SUBJECT_MISMATCH`; sandbox/producer mismatch → `INVALID`/`U1_CONTROL_FAILED`; request
  commit not an ancestor of the default branch → `resolve-request` refusal
  `U1_PROVENANCE_INVALID`, no decision, no attempt.
- **Sequencing (R1):** dry runs execute at a candidate pin commit; the final pin record adds the
  dry-run results in a later commit and the tag moves to it. The trust-policy digest
  (A-U1.8.18) excludes those fields, so requests stay valid. Every dossier states the executed
  commit of each run.

**Authority basis:** [RATIFIED 2026-10-02 (owner, "All five steps ratified as written").]

---

## Closure matrix

| G-id | Sev | Amendment | Side | Owner act |
|---|---|---|---|---|
| G-1 | blocker | A-U1.8.17 | workflow + provisioning + record | ruleset create (pending) |
| G-2 | major | A-U1.8.22 | workflow + provisioning + record | D-2 ruled; policy delete + reader FIC (pending) |
| G-3 | blocker | A-U1.8.18, A-U1.8.19 | workflow + record | D-3 ruled |
| G-4 | major | A-U1.8.23 | workflow (both) + record | — |
| G-5 | blocker | A-U1.8.20 | workflow (both) + contract | D-4 ruled |
| G-6 | major | A-U1.8.20 | workflow + contract | — |
| G-7 | major | A-U1.8.21 | workflow + contract + FK-P19 fixture | — |
| G-8 | major | A-U1.8.24 | workflow | — |
| G-9 | major | A-U1.8.17 | contract + workflow | D-1 ruled |
| G-10 | major | A-U1.8.25 | workflow (both) | — |
| G-11 | major | A-U1.8.26 item 1 | provisioning + record | bypass removal (pending) |
| G-12 | minor | A-U1.8.26 item 2 | CI + workflow | — |
| G-13 | minor | A-U1.8.26 item 3 | records | — |
| G-14 | minor | A-U1.8.26 item 4 | provisioning + workflow | ABAC clause (pending) |
