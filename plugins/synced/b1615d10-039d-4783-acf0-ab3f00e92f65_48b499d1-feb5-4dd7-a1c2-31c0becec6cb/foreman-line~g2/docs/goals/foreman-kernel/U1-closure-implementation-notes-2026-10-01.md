# U1-8 closure — implementation notes (2026-10-01)

Branch `u1-closure-workflows` (worktree `u1-workflow-placement`). Implements the binding
"Mechanism notes" of the ratified amendments **A-U1.8.01..A-U1.8.16**
(`U1-8-closure-amendments-2026-10-01.md`, owner decision batch 2026-10-01) against findings
**F-1..F-18** (`U1-8-review-verdict-2026-10-01.json`). Ratified choices implemented as
selected: F-3 = option (b) non-authoritative event runs; F-8 = ABAC prefix namespaces
`runs/*` (producer) vs `verifications/*` + `attempt-ledger/*` (verifier-create-only);
F-14 = named gap "not issued by the selected workflows", never status-affecting; F-18 =
network Allow + hardening + shared-key detection folded into verification.

Deliverables: `.github/workflows/u1-verify.yml` (full rewrite), `.github/workflows/u1-produce.yml`
(full rewrite), `U1-expected-outcome-oracle.json` (IA-2.8), `U1-configuration-checklist.json`
(IA-2.9), this note.

## F -> file/line closure map

Line numbers: `V` = `.github/workflows/u1-verify.yml`, `P` = `.github/workflows/u1-produce.yml`,
`O` = `U1-expected-outcome-oracle.json`, `C` = `U1-configuration-checklist.json`.

| F | Closure evidence |
|---|---|
| F-1 (blocker) | Job-level `outputs:` maps on every producer and consumer job: V:73 (pin-check), V:273 (resolve-request), V:528 (claim-attempt), V:675 (verify), V:1692 (retention-observation), V:1962 (close-attempt); every `needs.*.outputs.*` reference is step-mapped and every mapped name is written to `GITHUB_OUTPUT` (machine-checked, see Validation). |
| F-2 (blocker) | Two digest classes declared V:6-10; conflation regression self-test V:163-213 (fails if byte == wrapper digest, or canonicalization is non-deterministic); decision candidate records BOTH `decision-doc-digest` (IA-2.3 wrapper) and `decision-byte-digest` (exact retained bytes) V:1597-1604; retention-observation recomputes BOTH from read-back bytes and compares each counterpart V:1837-1861; seal carries `decisionDigest` + `decisionByteDigest` V:1909-1913; inventory entries carry `byteDigest` always and `docDigest`/`docDomain` for domain-bearing documents V:1509-1534. |
| F-3 (blocker) | Pin record fetched by commit SHA through the contents API (never the main head) V:113-121; authority classification (dispatch from `refs/tags/u1-verifier-pin` at the pinned commit = authoritative; `workflow_run` = non-authoritative) V:141-156, header V:17-27; PIN_DRIFT hard-fails in `pin-check` BEFORE `resolve-request`/`claim-attempt` (job order V:73, 273, 528); a non-authoritative run claims no attempt (claim-attempt `if:` V:532) and writes no ledger row (close-attempt `if:` V:1966); non-authoritative decisions carry `authoritative: false` and can never ACCEPT (ACCEPT demotion V:1558-1561; decision field V:1564; seal field V:1915); INCOMPLETE-U1-15 record extension (event, authority class, pin-record read path) V:1513-1516. |
| F-4 (blocker) | Live management-plane immutability GET in the verify job (state/interval/etag/observedAt/source; the old hard-coded literal is gone) V:1406-1433 and again in retention-observation V:1863-1884; ACCEPT requires `Locked` and interval >= 400 V:1434-1436; configuration checklist fetched at the pinned commit, byte-bound to the pin record and document-bound to the promotion request (PIN_DRIFT on binding mismatch) V:970-1002; checklist completeness gate (all 19 rows `recorded`, immutabilityExpectation locked/400) V:1437-1455; producer-authored `intervalDays` is never read as an observation (P retention-plan records "producer-authored plan only" P:468). |
| F-5 (blocker) | Coordinator oracle fetched at the pinned commit and digest-bound (self digest + request binding + contractDigest + promotionRequestId) V:948-968; controls compared to the oracle: `exitStatus == expectedExitStatus` (value, not presence), `observedResult` present and equal to both the T4 signal derivation and `expectedClassification`, `requiredSignals[]` present in the retained output, `demonstratedRefusalClassIds` includes the expected class V:1285-1342; missing `exitStatus`/`observedResult` -> `INVALID/U1_CONTROL_FAILED` V:1314-1317 (controls) and V:1366-1369 (invariant rows); gap rows admitted only for the three PIN-09 gaps (`permitted_gap`, V:1251-1263: BYP-LK-01 file-symlink privilege case, CTRL-01, the outage.ts realpath sweep) with any other gap -> `INCOMPLETE/U1_REQUIRED_EVIDENCE_MISSING` V:1302-1305, V:1374-1377; all-gap control/invariant never ACCEPT V:1333-1336, V:1403-1405; producer `expected` field is never read as an oracle anywhere; NC-U1-08 is enforced by the verifier itself (denominator + producer-oracle rejection = its exercised signal) and is never a gap row; per-invariant ACCEPT requires >= `minExercisedRows` qualifying exercised rows showing the expected refusal class (INV-U1-06 empty-class rows must show detection evidence) V:1345-1405. |
| F-6 (major) | Resolver rejects `requiredInvariantIds` absent/empty/below the INV-U1-01..05 first-promotion minimum and rejects `promotedRefusalClassIds` absent/empty or with a class not covered by a required invariant (IA-5 column-5 map) V:313-322, V:455-475; the same checks evaluate against the request at the decision point V:1161-1169. |
| F-7 (major) | Closed `U1PromotionRequest` shape (15 mandatory fields, unknown fields refused) V:323-332, V:404-421; `promotionRequestId` grammar `[a-z0-9-]{1,64}` validated at the resolver V:379-383 and defensively at every shell-writing consumer V:556-559, V:904-906, V:1819-1821, V:2023-2025; fetch by recorded commit SHA (dispatch input `promotion-request-commit-sha`), never the main head V:386-396; zero matches -> `INCOMPLETE/U1_REQUIRED_EVIDENCE_MISSING`, multiple matches -> `INVALID/U1_SUBJECT_MISMATCH` V:434-442; every consumer recomputes the detached IA-2.2 digest over the fetched bytes (verify V:922-933; retention-observation V:1823-1834); subject/selection equality ALWAYS runs (no `if expected_subject`), plus `policyDigest`/`compiledScopeDigest`/`trustPolicyDigest` comparisons V:1148-1169, V:1003-1013. |
| F-8 (major) | Producer objects only under `runs/<runId>/p<NN>/` (P:607-617, path refusal P:614); verifier objects only under `verifications/<promotionRequestId>/a<K>/` and ledger rows under `attempt-ledger/<promotionRequestId>/` (V:906, V:1786, V:663-671, V:2031-2045); the attempt ledger is written ONLY by the verifier identity (claim-attempt/close-attempt run under environment `u1-verifier` + u1-verifier-mi, V:532-541, V:1966-1975) — never by the builder-reachable producer identity; F-8 self-probe: an out-of-prefix verifier create is attempted and its denial recorded as `{operation, principal, targetPrefix, expectedDenial, observedStatus, observedError, timestamp}` (V:1452-1469), and a write that is ALLOWED (or a denial without an ABAC error) refuses ACCEPT with `U1_INDEPENDENCE_UNPROVEN` V:1470-1477. |
| F-9 (major) | Disjoint namespaces per A-U1.8.08 grammar: producer `.../runs/<runId>/p<NN>/<packagePath>`, verifier `.../verifications/<promotionRequestId>/a<K>/...`; a retry lists only its own prefixes (verify lists `producer_prefix` V:1077-1084; seal lists only `verifications/.../a<K>/` V:1879-1901), so prior-attempt verifier objects can never appear as "unlisted files" of the producer package; producer-package grammar refuses `audit/decision.json` and verifier kinds (P:185-190); producer inventory excludes the verifier namespace entirely (P bundle assembly P:489-505; decision inventory namespace-qualified V:1509-1534). |
| F-10 (major) | Verifier-authored `seal.json` written LAST, create-only, after both read-backs (producer package read-back in verify V:1071-1138; decision-candidate read-back V:1837-1861; seal write is the final upload V:1919-1924); closed seal shape (`u1-seal/v1`) + verifier-namespace inventory V:1903-1918; `retentionObservationResult` not `match` refuses consumption (observe step exits non-zero V:1928-1931 and seals `mismatch`/`unreadable`); FK-P19 consumes only the seal (decision alone is never consumable; header V:28-31). |
| F-11 (major) | Every negative-control and observation row must carry `executionProvenance[]` (runId, jobId, workflowRef, headSha, event, conclusion, artifact byte digest); the verifier confirms each identity through the GitHub API (runs + jobs endpoints) and raises `INVALID/U1_PROVENANCE_INVALID` on absence or mismatch (V:1195-1249); committed-source entries (`evidenceOrigin: fk-p17-committed`) are confirmed by API blob fetch at the recorded commit with byte-digest equality (V:1233-1242); the producer records the TRUE origin literal (`fk-p17-committed` | `ci-run-generated`) from git state per feed file, refuses a mixed feed, and stamps per-row provenance without re-deriving or softening classifications (P:227-252, P:323-343); the candidate-sandbox output is downloaded and consumed as untrusted data in the derivation path (V:1040-1056) and its absence raises `INCOMPLETE/U1_INDEPENDENCE_UNPROVEN` (IA-7.9 reachability, V:1057-1059); sandbox artifact name is per-run unique random (V:117-123 in candidate-sandbox job, name `u1-sandbox-<run_id>-<random>`) and verifier audit copies use unique names too. |
| F-12 (major) | Record side only here (provisioning acts are separate): checklist rows U1-14 and INCOMPLETE-U1-09 name the missing builder-identity/token-scope record and the `main-pr-gate` bypass-sunset evidence as unrecorded (C entries), enforced by the checklist gate V:1437-1455. Dispatch precondition enforcement of P1/P2/P3 lives in the provisioning record (open item below). |
| F-13 (major) | Six runner/toolchain values (`imageOS`, `imageVersion`, `runnerName`, `runnerOs`, `runnerArch`, `azCliVersion`) recorded in the verifier's `verifier-context` (V:1480-1485) and in the producer's `toolchain.json` (P:416-425) with the reasoned INF-4 exception and INCOMPLETE-U1-17 closure criterion (P:426-431); the hosted-runner limitation is cited in every decision's `limitations` list (V:1487-1491, V:1579). |
| F-14 (minor) | Named gap, never status-affecting: no attestation permission or step anywhere in either workflow; `verifier-context.attestation` records `attestationIssued: false`, `issuer: none` and the gap literal (V:1524-1526); the producer's configuration manifest records `attestation.requested: false` (P:437-438); decision logic reads no attestation state in either direction. |
| F-15 (major) | Checklist U1-19 (trust-root acquisition + revocation/update procedure, `repository_id` + `job_workflow_ref` federated subjects) is an enforced `U1_CONFIGURATION_INCOMPLETE` row (C entry; gate V:1437-1455); trust-policy binding compares `trustPolicyDigest` to the reviewed trust-root record digest (pin record bytes at the pinned commit, per A-U1.8.14 clause 4) V:1003-1013. The `revocations/` prefix consumer gate (FK-P19 side) and the revocation-record writer are FK-P19/compromise-act scope, not these workflows (open item). |
| F-16 (minor) | Size/count limits enforced from blob-list `contentLength` metadata BEFORE any download (V:1073-1089); parsing is depth-limited (16, iterative pre-scan so a hostile nesting cannot crash the interpreter), duplicate-key-rejecting and NaN/Infinity-rejecting (`strict_loads`, V:825-847 and P:149-171); every parse failure maps to `INVALID/U1_ARTIFACT_INVALID` or `INVALID/U1_EVIDENCE_LIMIT_EXCEEDED`; the whole evaluation is wrapped so a decision is always produced post-claim (V:1683-1708) — never an uncaught crash, never a burned attempt without a decision. |
| F-17 (minor) | `promotionRequestId` validated against `[a-z0-9-]{1,64}` at the resolver (V:379-383) and before every shell/blob-name use (V:556, V:904, V:1819, V:2023); ALL values reach `run:` blocks through `env:` — zero `${{ }}` expressions inside any `run:` string (machine-checked); summary text uses `$VAR` expansion with no backticks anywhere in echo strings. |
| F-18 (minor) | Ledger rows digested under IA-2.5 (detached `recordDigest` per row: dispatch/stop/timed-out rows V:628-665, final row V:2036-2038) with the stored-row byte digests carried by the `-final` row (`dispatchRowByteDigest`/`dispatchRowDocDigest`, V:2034-2035) and by job outputs; `retrieval-check.digestMismatches[]` entries carry `{objectName, recordedDigest, observedDigest}` with full blob names and `sha256:`-tagged digests (V:1135-1138, V:1502-1505) — note indexes refused; RBAC principal inventory, network-posture record and shared-key prevention/detection are checklist rows U1-09/U1-10 enforced as `U1_CONFIGURATION_INCOMPLETE` until recorded (C entries; gate V:1437-1455); the verifier-side observation of network/shared-key state is folded into the live management-plane reads (V:1406-1433). |

## Concretizations and readings (documented choices)

1. **`a00` namespace for non-authoritative runs.** A-U1.8.02 option (b) runs write decision/
   verifier-context/retention-observation/seal with `authoritative: false` but consume no
   attempt and write no ledger row, so their verifier namespace cannot be a ledger attempt
   number. They write under `verifications/<id>/a00/` — grammatically valid (`a` 1*2DIGIT),
   collision-free with real attempts (`a01..a03`), and never consumable by FK-P19.
2. **Detached digest rule.** `requestDigest`, `oracleDigest`, `checklistDigest`, `sealDigest`
   and ledger `recordDigest` are IA-2 wrapper digests computed over the canonical document
   WITH THE DETACHED-DIGEST FIELD OMITTED. Documented in O (`oracleDigestNote`) and used
   identically by both workflows (cross-implementation determinism tested, see Validation).
3. **"Document" = IA-2 domain-row document.** A-U1.8.01/7.1 document-digest checks apply to
   JSON documents with an assigned closed IA-2 domain row (bundle IA-2.1, request IA-2.2,
   decision IA-2.3, retention-observation IA-2.4, attempt rows IA-2.5, seal IA-2.7, oracle
   IA-2.8, checklist IA-2.9). Plain artifact JSON (toolchain, controls, ...) is byte-class
   only; inventory entries carry `byteDigest` always and `docDigest`+`docDomain` for
   domain-bearing documents. No new domain literal is introduced.
4. **Trust-policy digest concretization.** The reviewed trust policy is the A-U1.8.14 trust
   root: the pin record read at the pinned commit plus the protected tag ruleset. The
   checklist records `trustPolicyDigest` = committed-bytes SHA-256 of `U1-verifier-pin.json`;
   the promotion request MUST carry the same value.
5. **`executionProvenance[]` kinds.** `github-run` entries (confirmed via the runs/jobs API,
   including `conclusion`) and `committed-source` entries for honestly labelled
   `fk-p17-committed` rows (confirmed by API blob fetch at the recorded commit). Rows with no
   confirmable identity are `INVALID/U1_PROVENANCE_INVALID`.
6. **NC-U1-12 derivation.** T4 is defined for mutation cases; the positive control
   (PIN-03 #12) derives `mechanical` from `acceptDemonstrated: true` + exitStatus 0.
7. **Ledger byte digests.** A stored row cannot carry the byte digest of its own exact bytes
   (circular); the `-final` row and job outputs carry the stored-row byte digests, the rows
   carry their detached IA-2.5 document digest.
8. **Record-shape extensions required by the deliverables:** O adds `permittedGaps[]` (the
   three PIN-09 gaps must be machine-readable for 7.6) and `oracleDigestNote`; C adds
   `evidenceLocation`, `unrecordedReason` per entry and `trustPolicyDigest`. The verifier's
   structural checks know these fields.
9. **Oracle expectations** are coordinator assignments from the PIN-03 control definitions
   (exit-status convention: demonstrated refusal = 1, unrefused/allow = 0, NC-U1-12 = 0 as
   ratified); see `oracleDigestNote` for the full reading.

## Validation (run 2026-10-01, recorded)

- PyYAML parse: both workflows parse (`yaml.safe_load`); 7 jobs in u1-verify, 2 in u1-produce.
- Outputs wiring self-check: every `needs.<job>.outputs.<name>` reference has a job-level
  `outputs:` entry mapped to a step that exists and writes `<name>=` to `GITHUB_OUTPUT` —
  **0 problems** (script run over both files).
- Interpolation hygiene: zero `${{ }}` occurrences inside any `run:` string; all actions
  pinned by full 40-hex SHA — **0 problems**.
- Embedded Python: all 9 heredoc blocks parse (`ast.parse`) — 8 in u1-verify, 1 in u1-produce.
- Digest determinism: the JS canonicalizer used to author O/C and the Python canonicalizer
  embedded in the workflows produce identical detached digests (`oracleDigest`
  `sha256:ca3d30bd…`, `checklistDigest` `sha256:39c966ce…` MATCH on recomputation from
  Python); byte digests are distinct from wrapper digests (conflation smoke proof).
- Embedded self-tests and hostile-input smoke run (scripts extracted from the workflow bytes
  and executed): conflation self-test PASS, grammar self-test PASS; `strict_loads` refuses
  duplicate keys, NaN/Infinity/-Infinity literals, depth 20 nesting, trailing junk and bad
  UTF-8 while parsing benign/depth-16/unicode input. This smoke run caught a real defect:
  Python `$` anchors accept a trailing newline, so an id like `fk-p18-prime-r1\n` passed the
  `[a-z0-9-]{1,64}` checks; all validation regexes were hardened to `\Z` anchors and the
  grammar self-test now pins that regression (`a\n`, `fk-p18-prime-r1\n` in its reject list).
- **actionlint: UNAVAILABLE** on this machine (no binary, no npm package, no Go toolchain).
  The A-U1.8.16 re-pin precondition runs actionlint in the recorded act; nothing here claims
  an actionlint pass.

## Not closed here (recorded, with reasons)

1. **A-U1.8.16 re-pin record + dry-run** — a recorded act after merge (owner/custodian
   authority): actionlint run, one full dry-run against the unlocked container (record run id,
   outcome, dates), conflation + grammar self-test results, new `workflowCommit`/
   `workflowFileSha256`, `supersedes` block, `configurationChecklistSha256`
   (`sha256:f6ce0633…` of C's committed bytes), tag move. FK-P18-prime must NOT dispatch on
   `be3e3de3…`. The pin record itself is untouched here (deliberately).
2. **Checklist refresh at re-pin.** C binds the pin record and workflow byte digests
   (`U1-verifier-pin.json` `sha256:c1b66138…`, `u1-produce.yml` `sha256:8bd33a0b…`,
   `u1-verify.yml` `sha256:b78e405e…`); the re-pin changes the pin record bytes, so the
   re-pin act re-authors C's U1-06/U1-13 entries and recomputes `checklistDigest`.
3. **Provisioning prerequisites (owner/infrastructure authority).** Verifier management-plane
   Reader on the container for the immutability GET; ABAC prefix conditions exactly
   `runs/*` producer vs `verifications/*` + `attempt-ledger/*` verifier-create-only (stated
   as provisioned in the ratified F-8); a ledger writer = the verifier identity as
   implemented; Storage diagnostic logging with requester identity; FIC custom claim
   templates (`repository_id` + `job_workflow_ref`); the four denied-operation probes of
   A-U1.8.07 (only the verifier out-of-prefix probe is automated here); the `main-pr-gate`
   bypass sunset and approval-gate restoration (A-U1.8.11 P1/P2/P3 dispatch preconditions).
4. **§5 rows currently unrecorded** (C): U1-04 (SKU/redundancy owner-pending), U1-09, U1-10,
   U1-11 (lock flip pending — first cycle is a non-ACCEPT shakedown by definition), U1-14,
   U1-15..17, U1-19. ACCEPT is impossible until these are recorded and C is re-authored.
5. **Evidence-lane gaps expected at the shakedown run.** The committed FK-P17 rows carry no
   `exitStatus` and no `NC-U1-*` control ids (the FK-P18-prime control suite does not exist
   yet), so rows fail `INVALID/U1_CONTROL_FAILED` and the 13 controls report
   `INCOMPLETE/U1_REQUIRED_EVIDENCE_MISSING` — the honest state the §8 review recorded
   ("no negative control NC-U1-01..13 has any executed evidence"). The workflows enforce the
   contract; the FK-P18-prime lane must emit contract-complete rows (controlId/invariantId,
   exitStatus, outputs, observedResult, demonstratedRefusalClassIds, executionProvenance).
6. **PIN-09 gap fingerprints.** `permittedGaps` matches the three named gaps by case id /
   gap-record text (`BYP-LK-01` + "file-symlink privilege" obligation, `CTRL-01`, "realpath
   sweep"). The exact PIN-09 gap-record strings should be reconciled against
   `fk-loop-stop-report-2026-09-29.md` at the re-pin review; the matching is fail-closed
   (anything unmatched is refused, never admitted).
7. **`promotionRequestId` binding.** O serves request id `fk-p18-prime-r1` (its
   `oracleDigestNote`); any other id requires re-authoring O under that id as a recorded act.
8. **Revocation-record writer and `revocations/` consumer gate** (A-U1.8.14) belong to the
   FK-P19 consumer and the compromise procedure; not part of these two workflows.
9. **`plugins/foreman-line/CHANGELOG.md` untouched** — the file carries pre-existing edits
   not made by this work; the A-U1.8.16 recorded act should land the changelog entry with the
   re-pin.
