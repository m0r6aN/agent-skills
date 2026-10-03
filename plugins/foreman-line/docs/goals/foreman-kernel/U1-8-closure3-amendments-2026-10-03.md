# U1-8 closure amendments, round 3 — closure of the round-2 review findings (2026-10-03)

**Instrument:** amendments **A-U1.8.28 … A-U1.8.38**, closing H-1 … H-15 of
`U1-8-closure2-verdict-2026-10-03.json` and re-opening the PARTIAL G-3 … G-8, G-11 residuals
it names. Triage and coordinator reproduction: `U1-8-closure2-verdict-triage-2026-10-03.md`.
**Base documents amended:** `U1-contract-2026-09-29.md` as amended by A-U1.8.01 … A-U1.8.27
(`U1-8-closure-amendments-2026-10-01.md`, `U1-8-closure2-amendments-2026-10-02.md`).
**Status:** DRAFT — owner rulings R-1 … R-5 (2026-10-03) are recorded at their amendments;
the text of every delta binds only after owner ratification of this document.
**Write boundary:** this document only.
**Pin consequence (standing #34):** every workflow delta below lands in **one** re-pin,
A-U1.8.38, superseding `workflowCommit 88da567530e7924ebea7246e9a372db2e819bdb2`
(`workflowFileSha256 sha256:11e021e3…0c26`, tag at `ed848ba`). FK-P18′ MUST NOT be dispatched
on it.

## 0. Reading rules

§0 of the round-1 and round-2 documents carries unchanged. Two additions:

1. **Role separation (binding on round 3 and every later round):** the identity that issues the
   §8 closure verdict builds nothing — no workflow edit, record, pin, provisioning act, dry run
   or environment approval. A session that built any part of a round is never that round's
   reviewer, and a verdict from such a session is recorded as non-independent and closes
   nothing (round-2 verdict precedent, triage §0).
2. **Hostile-input floor:** every refusal path introduced or touched in round 3 is exercised by
   a dry run with the hostile input named at its amendment; "read, not executed" is not a
   closure for round-3 items.

---

## A-U1.8.28 — H-1 (blocker): request fields are grammar-checked before any output; step outputs cannot carry structure

**Finding.** `selectedExecution.runId`, `oracleDigest` and `configurationChecklistDigest` reach
`$GITHUB_OUTPUT` unchecked (u1-verify.yml@ed848ba L652, L655-656, L2177); a CR/LF in a value
appends later `status=` / `request-commit-sha=` lines.

**Delta.**

1. **Request field grammar (IA-4 PromotionRequest, appended):** `selectedExecution.runId`,
   `.attempt`, `.jobId`, `.workflowId`, `.repositoryId` match `^[0-9]{1,20}$`;
   `.provider` and `.event` are closed literals; every digest field matches
   `^sha256:[0-9a-f]{64}$`; every commit field `^[0-9a-f]{40}$`. resolve-request validates the
   whole request against this grammar **before** writing any output; any violation →
   `INVALID`/`U1_ARTIFACT_INVALID`, no attempt consumed.
2. **One output writer:** every job writes step outputs through one shared function that refuses
   (fails the step) on any value containing CR or LF or `=` in the key, and every output
   consumer re-validates the grammar of what it reads. Hand-rolled `f.write("k=%s\n")` is
   removed.
3. **Seal fields from the read-back decision:** retention-observation takes `decisionStatus`,
   `reasonCodes`, `executedCommit` and `authoritative` from the parsed read-back decision
   (strict parser, enum and list validated) and sets `retentionObservationResult = mismatch`
   when any differs from the corresponding job output.
4. **Hostile input:** a dry-run request whose `runId` carries `"\nstatus=ACCEPT"` is refused at
   resolve-request with `U1_ARTIFACT_INVALID`, no decision, no attempt.

**Authority basis:** [PENDING ratification.]

---

## A-U1.8.29 — H-2 (major): permitted gaps are exact triples in the oracle

**Finding.** `permitted_gap` (L1668-1682) admits any row whose producer-authored reason starts
with `blocked:` and contains `realpath sweep`, and any `CTRL-01` row; gap rows skip every check.

**Delta.** The per-request oracle (A-U1.8.19) gains `permittedGaps[]`, each
`{id, caseId, obligation}`, closed to the three PIN-09 gaps. A gap row is permitted only when
its `(id, caseId, obligation)` equals one entry exactly; any other gap or `not-exercised` row
→ `INVALID`/`U1_ARTIFACT_INVALID`. Producer-authored reason text is never matched.
**Hostile input:** a fixture bundle that relabels a failing row as a gap is refused.

**Authority basis:** [PENDING ratification.]

---

## A-U1.8.30 — H-3 (major): every inventory entry is digest-bound

**Finding.** `compare_classes(raw, None, None, …)` returns `match` (L1122-1136); inventory
entries without digests pass; duplicate `relativePath` entries overwrite each other (L1441).

**Delta.** Every bundle inventory entry carries `byteDigest` matching `^sha256:[0-9a-f]{64}$`
(and `docDigest` for JSON documents); a missing or malformed digest, or a duplicate
`relativePath`, → `INVALID`/`U1_ARTIFACT_INVALID`. `compare_classes` returns `unbound` when both
recorded digests are absent, and `unbound` is a failure at every call site; the pin-check
self-test includes that case. **Hostile input:** a fixture bundle with one digest-less entry is
refused.

**Authority basis:** [PENDING ratification.]

---

## A-U1.8.31 — H-4 (major): the derivation harness is verifier-owned

**Finding.** candidate-sandbox checks out the producer run's `head_sha` and runs that checkout's
`u1-sandbox.mjs` (L322-372); the candidate authors its own result, exit status and
`candidateCommit`; the shipped harness echoes the committed rows.

**Owner ruling R-1 (2026-10-03):** "Verifier-owned harness from R".

**Contract location edited:** A-U1.8.20 clauses 2 and 5 (R1), §3.4.5, §3.1.2.

**Delta.**

1. **Harness provenance:** the derivation harness is read from the pin commit `R` (path named in
   the pin record as `sandboxHarness` with its byte digest, inside the trust-policy projection
   IA-2.11); the candidate tree is checked out read-only into a separate directory as **input**;
   no file from the candidate tree is executed as the harness.
2. **Trusted commit observation:** a step that runs before any candidate-influenced code records
   `git rev-parse HEAD` of the candidate checkout and the producer run's `head_sha` (read
   through the API) as job outputs; evaluate receives both and requires
   HEAD == `head_sha` == subject commit. The harness's self-reported `candidateCommit` is
   recorded, never trusted.
3. **Derivation, not echo:** the harness re-executes each NC-U1 control and each required
   invariant row against the candidate input and emits `u1-sandbox-result/v1` (A-U1.8.20
   clause 1) from its own execution; reading `exitStatus` / `observedResult` from committed
   evidence files is forbidden. A control or row the harness cannot re-execute is reported
   `not-exercised` and is subject to A-U1.8.29.
4. **Isolation:** the sandbox result is uploaded by a job that never executed candidate code
   (a collector job downloads the sandbox job's raw output by unique artifact name and
   digest-binds it); the sandbox job's own conclusion is checked. The fixture
   sandbox-mismatch hook fails loudly when its target control is absent.
5. **Hostile input:** a candidate whose committed rows claim a pass that re-execution fails is
   refused with `INVALID`/`U1_CONTROL_FAILED`.

**Authority basis:** [R-1 RULED 2026-10-03 (owner, verbatim above); delta text PENDING
ratification.]

---

## A-U1.8.32 — H-5 + H-6 (major): github-run provenance binds run, branch, workflow and bytes; committed-source refs are SHAs

**Findings.** The github-run branch (L1584-1628) is unexercised, unsatisfiable by the shipped
producer (artifact digest ≠ cited source digest) and binds neither branch, repository,
workflow bytes nor selected run id; `headSha`, `committedPath`, `runId` are unvalidated and
interpolated into API paths (H-6).

**Owner ruling R-2 (2026-10-03):** "Fix both ends and exercise".

**Delta.**

1. **Producer:** for every `github-run` row the producer uploads the unmodified source file as
   its own artifact (unique name) and cites that artifact's byte digest in
   `artifactByteDigest`; re-canonicalized copies are never cited.
2. **Verifier (github-run):** `run.repository.id == run.head_repository.id ==` the repository
   id; `run.head_branch` == the default branch name read from the API; `run.path` ==
   the pin record's `producerWorkflow`; the workflow file bytes at `run.head_sha` equal the
   default-branch copy at the subject commit; `run.id` == the request's
   `selectedExecution.runId`; `run.head_sha` == subject commit, and the subject commit is in
   default-branch history; the cited artifact downloaded by the verifier has the cited byte
   digest and contains the row by canonical bytes. Runs are fetched once and cached; listing
   is paginated and size-bounded (F-16 limits).
3. **Verifier (committed-source):** `headSha` matches `^[0-9a-f]{40}$`; `committedPath`
   matches a path grammar (no `?`, `#`, `..`, leading `/`, backslash); refs are passed as
   `-f ref=` query parameters, never concatenated; the cited commit equals the subject commit
   or is its ancestor.
4. **Default branch:** every ancestry check resolves the default branch from the API; the
   literal `main` is removed.
5. **Exercise:** the round-3 dry runs include a producer run that emits at least one
   `github-run` row confirmed end-to-end, plus negatives: wrong branch, wrong `runId`,
   artifact digest mismatch, non-SHA `headSha`.

**Authority basis:** [R-2 RULED 2026-10-03 (owner, verbatim above); delta text PENDING
ratification.]

---

## A-U1.8.33 — H-7 + H-8 (major): retention result requires a proven lock read; the terminal ledger row never borrows evaluate's outcome

**Delta.**

1. `retentionObservationResult` is `match` only when the digest read-back matches **and** the
   immutability read at sealing time succeeded (non-zero `az` exit fails the step) and shows
   `Locked` with `intervalDays >= 400` for the container the run used; otherwise `unproven`
   (new literal in the seal enum) — never `match`.
2. The seal inventory is the exact set of persisted verifier-namespace objects; each is checked
   against `decision.artifactInventory` by both digest classes.
3. Seals for `u1-fixture-` requests carry `consumable: false`, set by the workflow from the
   request id prefix (never from request content); the A-U1.8.21 consumer rule refuses
   `consumable: false`.
4. close-attempt's terminal outcome is the retention-observation output or `interrupted`; the
   evaluate fallback is removed (H-8).

**Authority basis:** [PENDING ratification.]

---

## A-U1.8.34 — H-9 (major): one-identity operation is a named deviation with a sunset before FK-P19

**Owner ruling R-3 (2026-10-03):** "Named deviation now, 2nd identity before FK-P19".

**Delta.**

1. **Recorded facts (INCOMPLETE-U1-06/-14):** builder login, object id and token scope per
   round; custodian; sole environment reviewer and `prevent_self_review=false`;
   `can_admins_bypass=true`; sole collaborator/admin; CODEOWNER; tag-ruleset bypass actor; the
   approver of every cited run's environment deployment (from the deployment API).
2. **Contract statement (§9.2, appended; FK-P19 consumer rule, appended):** "While builder,
   custodian, environment approver, CODEOWNER and tag-bypass actor are one identity, a U1 seal
   attests that the pinned verifier ran on the cited inputs; it is **not** an independent
   attestation that no party in that identity altered them."
3. **Sunset:** before FK-P19 consumes any seal, a second identity holds the `u1-verifier`
   environment reviewer role, `prevent_self_review = true`, and A-U1.8.11 P2/P3 are restored —
   each recorded as a live GET. FK-P19 dispatch is refused until then.

**Authority basis:** [R-3 RULED 2026-10-03 (owner, verbatim above); delta text PENDING
ratification.]

---

## A-U1.8.35 — H-10 (major): an observed ACCEPT, in a locked non-consumable fixture container

**Owner ruling R-4 (2026-10-03):** "Locked fixture container".

**Delta.**

1. **Provisioning (owner-ruled; irreversible):** container `u1-fixture` in account
   `bs2jhgwvduljfdwdp` with a **Locked** time-based immutability policy of 400 days
   (blobs cannot be deleted or overwritten until expiry; the container cannot be deleted while
   they exist). Producer and verifier role assignments are re-created on `u1-fixture` with the
   same ABAC conditions as `u1-evidence`.
2. **Container binding:** the container is chosen by the workflow from the request id prefix —
   `u1-fixture-` → `u1-fixture`, otherwise `u1-evidence` — never from request content; the
   immutability read, the probes and the retention observation all target that container, and
   the decision, verifier-context and seal record it.
3. **Positive path, replaced (A-U1.8.27 clause 2):** a fully conforming fixture request in
   `u1-fixture` reaches **`ACCEPT`** with empty reason codes, a seal with
   `consumable: false`, and a retention result `match` over a Locked read. The A-U1.8.27
   `INCOMPLETE` positive run remains the production-container control.
4. **Negative coverage, extended:** the hostile inputs of A-U1.8.28 … A-U1.8.33 run in
   `u1-fixture`, plus a seal/decision disagreement case and the FK-P19 consumer-gate fixture
   (A-U1.8.21 clause 3), which must refuse the `consumable: false` ACCEPT seal.

**Authority basis:** [R-4 RULED 2026-10-03 (owner, verbatim above); provisioning is the ruled
act; delta text PENDING ratification.]

---

## A-U1.8.36 — H-11, H-12, H-14 (minor): probe, ruleset and comparison hygiene

1. **Probes (H-11):** overwrite and delete probes require `setupHttpStatus == 201`; a verifier
   delete probe is added; probe object names are recorded and their absence re-checked;
   `AuthorizationFailure` counts as a denial only with a positive control that proves the
   identity can reach the account; `oidcClaims` absent or differing from the expected
   `sub`/`ref`/`environment` → `INCOMPLETE`/`U1_INDEPENDENCE_UNPROVEN`.
2. **Ruleset (H-12):** the tag counts as protected only if no `ref_name.exclude` pattern
   matches it; bypass entries compare `actor_type == "User"` and `actor_id`; the admin-side
   ruleset GET (bypass visible) is re-recorded at every dispatch precondition.
3. **Comparisons (H-14):** every equality checks type and presence (no `True == 1`,
   `1.0 == 1`, `None == None`); an authoritative run with attempt number 0 fails; per-invariant
   status is computed from structured failure records, not note substrings; sandbox signals
   are matched against the oracle's `requiredSignals`; oracle-digest mismatch raises
   `U1_SUBJECT_MISMATCH` as A-U1.8.19 states; unused variables are removed; the sandbox job
   result is checked.

**Authority basis:** [PENDING ratification.]

---

## A-U1.8.37 — H-13, H-15 (minor): records on protected history; producer and lint hygiene

1. **H-13:** `U1-live-changes-2026-10-02.md` Addendum C and the round-2 A-U1.8.23 clause-4
   extension (`UnauthorizedBlobOverwrite`) land on the default branch through a PR; the
   extension is ratified by the owner as part of this document (item marked here).
   Checklist rows gain `reobservedBy` naming a non-builder identity or `none`.
2. **H-15:** producer `enrich_row`/ANCHORS enrichment is removed (committed rows carry their
   fields, A-U1.8.20 clause 6); `evidence-dir` must be a relative path under the repository
   with no `..`; `submit` uses an allowlist and re-verifies every package digest before
   upload, and refuses to upload an attempt package already submitted; `measurements.jsonl`
   is digest-bound; the verifier cross-checks producer `imageOS`/`imageVersion` grammar;
   `u1-lint` enforces shared-block identity, action SHA pinning and the producer FORBIDDEN list
   and runs on `push` to the default branch as well as `pull_request`.

**Authority basis:** [PENDING ratification.]

---

## A-U1.8.38 — re-pin record (standing #34): supersedes the `88da5675…` pin

1. `workflowCommit 88da567530e7924ebea7246e9a372db2e819bdb2`, `workflowFileSha256
   sha256:11e021e3e37408f361f62ef8b9ff1ef987bfc50e4cad1806fa20487bd79c0c26` is superseded and
   must not be dispatched against.
2. **Preconditions:** `u1-verify.yml` and `u1-produce.yml` implement A-U1.8.28 … A-U1.8.37;
   actionlint and the extended `u1-lint` pass in CI; `u1-fixture` is provisioned (A-U1.8.35);
   the dry runs record: the production-container INCOMPLETE control; the fixture ACCEPT
   (A-U1.8.35 clause 3); every hostile input named at A-U1.8.28 … A-U1.8.33 refused with its
   code; the FK-P19 consumer-gate fixture refusing each negative seal.
3. **Pin record shape:** v3 plus `sandboxHarness` {`path`, `byteDigest`} inside the IA-2.11
   projection (A-U1.8.31), `supersedes` chained to `88da5675…`, and per run the executed commit.
4. **Re-review:** the closure package goes to a reviewer of a **different provider** that built
   nothing in rounds 1-3 (R-5), with every stored decision's `notes[]` verbatim. FK-P18′ stays
   undispatchable until that verdict is ACCEPT and the A-U1.8.11 / A-U1.8.26 dispatch
   preconditions are recorded.

**Owner ruling R-5 (2026-10-03):** "Different provider model".

**Authority basis:** [R-5 RULED 2026-10-03; delta text PENDING ratification.]

---

## Closure matrix

| Finding | Sev | Amendment | Side | Owner act |
|---|---|---|---|---|
| H-1 | blocker | A-U1.8.28 | workflow | — |
| H-2 | major | A-U1.8.29 | workflow + oracle | — |
| H-3 | major | A-U1.8.30 | workflow + producer | — |
| H-4 | major | A-U1.8.31 | workflow + harness + pin record | R-1 ruled |
| H-5 | major | A-U1.8.32 | workflow + producer | R-2 ruled |
| H-6 | major | A-U1.8.32 | workflow | — |
| H-7 | major | A-U1.8.33 | workflow + contract | — |
| H-8 | major | A-U1.8.33 | workflow | — |
| H-9 | major | A-U1.8.34 | records + contract + FK-P19 gate | R-3 ruled; second identity before FK-P19 |
| H-10 | major | A-U1.8.35 | provisioning + dry runs | R-4 ruled; `u1-fixture` Locked (irreversible) |
| H-11 | minor | A-U1.8.36 | workflow (both) | — |
| H-12 | minor | A-U1.8.36 | workflow + record | — |
| H-13 | minor | A-U1.8.37 | records + ratification | ratify clause-4 extension |
| H-14 | minor | A-U1.8.36 | workflow | — |
| H-15 | minor | A-U1.8.37 | producer + lint | — |
| review | — | A-U1.8.38 | process | R-5 ruled |
