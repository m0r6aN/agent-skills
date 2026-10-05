# U1 §8 CLOSURE RE-REVIEW DOSSIER, ROUND 2 (2026-10-02)

> Closes findings G-1..G-14 of `U1-8-closure-verdict-2026-10-02.json` (anthropic/claude-sonnet-5-5,
> `FURTHER_FINDINGS`) under the owner-ratified amendments A-U1.8.17..27
> (`U1-8-closure2-amendments-2026-10-02.md`). Everything below was executed on 2026-10-02 under the owner's
> "All five steps ratified as written. Proceed with full authority".

---

## PART 0 - CLOSURE-REVIEW DIRECTIVE AND INDEPENDENCE DISCLOSURE

1. **Deliverable:** a reasoned **ACCEPT** or **further findings** over this package, in the strict JSON shape of
   the first closure review (`verdict` ACCEPT | FURTHER_FINDINGS, `reviewerIdentity`, `custodianDisclosure`,
   `selfReviewStatement`, `rationale`, `closureByFinding[]` for G-1..G-14 with CLOSED | PARTIAL | OPEN,
   `findings[]`, `naiveReadingTests`, `methodNotes`). Earlier findings F-1..F-18 and G-1..G-14 stand as the record.
2. **Independence (read this first).** The ratified step 5 says the package returns to "the same reviewer". That
   identity - `anthropic/claude-sonnet-5-5` - **built this closure round**: it executed the live changes
   (rulesets 24378879, 22369510, 24257508; environment policy 61546414; role assignments; federated
   credentials), rewrote `u1-verify.yml`/`u1-produce.yml`, wrote the fixture feed and sandbox entrypoint, cut the
   pin record, ran the dry runs, and operated the owner-delegated environment approvals. Under §8.2/8.3 a reviewer
   reviews nothing it built; that identity built the closure of every one of G-1..G-14.
   **Recommendation: issue the closure verdict from a different reviewer identity (different
   model or provider, or a human), with no access to this session's reasoning.** If the owner overrules and
   routes it to the same identity, that identity's `selfReviewStatement` must record this disclosure; an
   ACCEPT from it should not be treated as the independent §8 verdict.
3. **Method (§8.4):** hostile-input probing is licensed. Re-run your naive-reading tests against the closed text
   and the stored artifacts, say for each of G-1..G-14 whether it is now excluded **by construction**, and flag any
   closure that weakens a guarantee. Every new finding binds to a named location.
4. **Special scrutiny:** (a) the five defects the dry runs found (Part A.3) were fixed at the right layer?
   (b) the temporary pull-request-only bypass on two rulesets (Part A.4) - was it bounded honestly?
   (c) the checklist's `recorded` rows are coordinator self-attestations - is the gate still honest?
5. **Known remaining gaps (evaluate honesty of bounding):** Part A.5.

---

## PART A - CLOSURE REPORT

### A.1 Closure map G-1..G-14

| Finding | Severity | Closed by | Evidence (mechanism, not prose) |
|---|---|---|---|
| G-1 tag ruleset gone | blocker | live ruleset **24378879** (tag `refs/tags/u1-verifier-pin`; update, deletion, non_fast_forward; bypass custodian only) + A-U1.8.17 clause 2 | pin-check requires an active tag ruleset with those rules before any attempt; observed ruleset recorded in every verifier-context (`tagRulesetObservation`: id 24378879, `ok:true`). Live GET in `U1-live-changes-2026-10-02.md`. |
| G-2 `main` policy / authority label | major | policy 61546414 deleted (only tag policy 61684968 remains); `evaluate` job has no environment and authenticates as read-only `u1-reader-mi`; `persist`/`claim`/`retention`/`close` are the only writers, under environment `u1-verifier`, authoritative runs only (A-U1.8.22) | environment GET: one policy, type tag. Verifier-context shows `evaluatorIdentity.oidcClaims.sub = repo:...:ref:refs/tags/u1-verifier-pin` (reader) and `verifierClaimIdentity.sub = repo:...:environment:u1-verifier` (writer), each observed from the job's own OIDC token. `workflow_run` lane: earlier run 37048240491 failed closed with PIN_DRIFT; the reader credential for that lane (`u1-reader-run-fc`, ref `refs/heads/main`) was **not** exercised end-to-end. |
| G-3 (a)(b)(c) request-bound oracle, trust-policy cycle, 9-key execution | blocker | A-U1.8.18/.19: per-request oracle read at the request commit; trust-policy digest = IA-2.11 projection of the one pin record read at the executed commit R; execution equality on exactly the 7 contract fields; dead `pin-record.json` branch deleted | negative decisions in Part C: oracle id mismatch and trust-policy mismatch and execution-field mismatch each refused `INVALID/U1_SUBJECT_MISMATCH`; the positive decision has none of them. |
| G-4 probe classifier | major | A-U1.8.23: HTTP status + `x-ms-error-code`; two verifier probes in `claim-attempt`, two producer probes in a `producer-probe` job packaged in the bundle | positive decisions carry no probe note; stored probe records show 403 `AuthorizationPermissionMismatch` (create), 403 `UnauthorizedBlobOverwrite` (overwrite), 403 `AuthorizationPermissionMismatch` (producer create under verifications/), 409 `BlobImmutableDueToPolicy` (producer delete). **Deviation:** the overwrite denial code was found empirically and added to the amendment (A-U1.8.23 clause 4, R2). The producer delete is refused by the immutability policy, not RBAC (the producer ABAC allows delete under `runs/*`). |
| G-5 sandbox "consumed" is a flag | blocker | A-U1.8.20: the sandbox result (`u1-sandbox-result/v1`) is parsed as untrusted data and compared row by row with the producer rows and the oracle; "cleared" only when `ran`, `rowsCompared >= rowsExpected` and `>= oracle floor`, no mismatch | positive context: `sandboxComparison {ran:true, rowsCompared:18, rowsExpected:18, oracleFloor:5, mismatches:[]}`; sandbox-mismatch negative: `INVALID/U1_CONTROL_FAILED` naming NC-U1-02 (sandbox exit 0 vs producer 1). The sandbox entrypoint is a **coordinator fixture** (derives from the committed fixture rows; refuses non-fixture request ids). The real harness is FK-P18' work. |
| G-6 provenance existence-only | major | A-U1.8.20 clause 4/6: committed-source rows are fetched at the cited commit, digest-checked, matched to the cited entry by canonical bytes, and the commit must be in default-branch history; github-run rows additionally need workflow allowlist, head_sha == subject commit, and an artifact whose bytes contain the row | exercised for committed-source on all 18 fixture rows (no provenance note). The github-run branch is implemented and **not exercised** (the fixture feed is committed-source only). |
| G-7 seal without status | major | A-U1.8.21: seal carries `decisionStatus`, `reasonCodes`, `executedCommit`; consumer rule requires ACCEPT + empty reason codes + authoritative + match + revocation check; `u1-fixture-` seals never consumable | stored seals: INCOMPLETE/INVALID statuses present. The FK-P19 **consumer-gate fixture set is not built** (A-U1.8.21 clause 3 makes it an FK-P19 precondition). |
| G-8 request authority | major | A-U1.8.24: request commit must be identical to or an ancestor of the default-branch head (compare API) before anything is read | run 37065583439: `resolve-request` refused `U1_PROVENANCE_INVALID ... not in the default-branch history (compare status behind)`; no decision, no attempt. |
| G-9 unratified F-19 | major | A-U1.8.17 ratified (D-1) and implemented: tag target == run commit == dispatch input, workflowCommit R-or-ancestor, bytes at R | `executedCommit` is recorded in verifier-context, decision, retention observation and seal; each dry-run state it. |
| G-10 ImageOS/ImageVersion | major | both workflows read `ImageOS`/`ImageVersion`; the verifier refuses an empty value in the six compensating fields (verifier and producer toolchain records) | stored toolchain `imageOS: ubuntu24`, `imageVersion: 20260927.320.1`. The refusal-on-empty branch is **not exercised**. |
| G-11 bypass preconditions | major | `main-pr-gate` bypass removed; `agent-skills-default` bypass removed (step 1); temporary PR-only re-add and removal recorded (A.4) | final ruleset GETs (Part D): both rulesets list no bypass actor. INCOMPLETE-U1-14 (builder identity and token scope) is still **unrecorded**; P2/P3 depend on a second identity that does not exist. |
| G-12 actionlint / self-test | minor | `u1-lint` workflow (pinned actionlint 1.7.12, sha256-verified, embedded-python syntax + pyflakes); the pin-check self-test extracts the shared blocks from the workflow's own text, requires identical copies, and drives the real `compare_classes` | lint runs 37044777174 (73ad47a), 37062860174 (workflowCommit 88da567): success. Self-test passed in every dry run. |
| G-13 record integrity | minor | real UTC timestamps; U1-13 refreshed to the IA-2.11 digest; `supersedes` chains 16a7e0fb -> dc561792 -> be3e3de3; contract and both amendment documents on `main`; ledger rows parsed strictly; checklist without `trustPolicyDigest` | pin record at the final tag (Part B); amendment hashes below. |
| G-14 revocation writer / federated subject | minor | verifier role ABAC condition gains `revocations/*`; `federatedSubject` literals replaced by claims observed from the job's own GitHub OIDC token | role assignment 04dff4c8 condition (live GET); observed claims in context, observation and seal. A revocation write was **not exercised**. |

### A.2 Executed commits (every cited run)

| Item | Commit |
|---|---|
| workflowCommit (introduces the pinned `u1-verify.yml` bytes) | `88da567530e7924ebea7246e9a372db2e819bdb2` |
| candidate pin commit (dry runs 37062999919, 37064078616, 37064527871, 37064834479, 37065130461, 37065583439) | `1e3baf20a43748bffab24c5855a9e0eca4c0574a` |
| **final tag target R** (`refs/tags/u1-verifier-pin`; smoke run 37065869917) | `ed848ba0595f7c8f6e01c1655babc725a73c2ef2` |
| fixture producer run 37048104083 | `77e0d9e34f8f2530828e526e78a6adb13131ea91` |
| non-ancestor request commit (branch `u1-neg-commit`, unmerged) | `5457d9d51cb3d9c62eab99094e555e7e4b2d6df5` |

Hashes at R, full sha256 (computed from `git show R:<path>`): `u1-verify.yml` `sha256:11e021e3e37408f361f62ef8b9ff1ef987bfc50e4cad1806fa20487bd79c0c26` (equals the pin record
`workflowFileSha256`); `u1-produce.yml` `sha256:40a837cf4573701fd78cb59cf9f9a7d6f0c15e2eca209f1a74e1fd0e43a5f685`; `u1-lint.yml` `sha256:61de3edca641b47763dea7eb40eac34a8df0ffb0b9593ba3aed88f21f4f3b28f`; pin record `sha256:861c196cf5defabdf8f9d8fbf7076d2354548799a634d5e209ddba3e09909ef1`; checklist `sha256:97b43dd9c09d4021ed657a7b7926e2092dff4260ff2fd679d6ab8301d0b1ff43`
(equals `configurationChecklistSha256`); amendments round 2 `sha256:3fb0a3466fc8520b2a7ca732d827d7892c19dedab4d77ee2e0999c63d8be6fb9`; amendments round 1 `sha256:895fbe0e6de1cd8966e309cc834eb5f580b4cbda5bb7866d3121b39a398360e1`; contract `sha256:8d5f849cf22f6662f17c2502142e354d82f8f5604d64b511250abc72157df9d5`;
`u1-sandbox.mjs` `sha256:a98e40052b5e24723996c807506208a1a82bd484b49b8f1c5d9f59a7e4acea26`. Trust-policy digest (IA-2.11 projection of the pin record) `sha256:262e82c33a269bad5d14925bb6a320ee2ef62b11afa89e49bae2f00206257637`.

### A.3 Defects found by the dry runs, and where each was fixed

1. Probe-record job output contained the masked `azure/login` client id; GitHub dropped the output; evaluate saw an
   empty record (run 37048507764). Fixed in the workflow (fcb5afdf).
2. Azure answers `403 UnauthorizedBlobOverwrite` for a create-only role overwriting an existing blob; the classifier
   rejected a genuine denial (run 37060187040). Fixed in the workflow and the amendment (88da567).
3. The fixture request builder replaced the whole `selectedExecution` for the execution-field case, so that
   negative tested a missing selection (run 37062023366). Fixed in coordinator tooling; the r3 request is correct.
4. `scripts/validate-versions.js` and its test used `git describe --tags`, which resolves to `u1-verifier-pin` once
   the pin tag is an ancestor of `main`; fixed to match semver tags only (PR #130).
5. The `main-pr-gate` required checks (`test`, `integration-report`) were already red on `main` at ebebea1 (run
   37033700779, unrelated suites) and `agent-skills-default` requires code-scanning results while code scanning is
   not configured; both made `main` unmergeable after step 1 (A.4).

### A.4 Temporary pull-request-only bypass (A-U1.8.11 clause 3: red baseline + sunset record)

Re-added for the owner (user 35229880) in mode `pull_request` on rulesets 22369510 and 24257508 to merge PRs
#130-#133 and #135-#137 of this sequence; removed again after the final tag move. The sunset record and the removal GETs are in
`U1-live-changes-2026-10-02.md` Addenda B and C. The repository's own CI on those PRs: `actionlint`, `gate`,
`Validate *`, `Test plugin installation` pass; `test`/`integration-report` fail on unrelated suites exactly as on
`main`. Every merge used `--admin`; none was a direct push.

### A.5 Not exercised / not done (named, not hidden)

- The **real** NC-U1-01..13 and invariant rows: the feed is a committed **fixture** and the sandbox entrypoint is a
  fixture; FK-P18' builds the real ones. A fixture request can never be consumed (A-U1.8.21 clause 4) and ends
  `INCOMPLETE` while the lock is unrecorded.
- The checklist `recorded` rows (U1-01,02,03,05,06,07,08,12,13,18) are coordinator self-attestations; nine rows
  remain `unrecorded` (U1-04,09,10,11,14,15,16,17,19) and gate every ACCEPT.
- The `workflow_run` (event-driven) lane through `evaluate` with `u1-reader-run-fc`; the `github-run` provenance
  branch; the empty-runner-field refusal; a revocation record write; the FK-P19 consumer-gate fixtures.
- Reader federated credentials bind to the run ref, not to the workflow (OIDC subject customization would break the
  other credentials); the producer delete is refused by the immutability policy (Unlocked), not by RBAC.
- **Deleted credential with a downstream user:** step 1 deleted `u1-reader-fc` (subject
  `repo:m0r6aN/agent-skills:pull_request`) from `u1-reader-mi`. That credential had been provisioned on 2026-10-02 as
  OQ-6 for the FK-P18' CI backstops (`FK-P18-prime-ci-backstops.md`: seal/revocation reads from CI on pull
  requests). Its deletion was recommended on the ground that it admitted any same-repository pull-request workflow
  to the evidence container, and the verifier does not use it; the FK-P18' spec does. FK-P18' must obtain a reader
  binding that is not a bare `pull_request` subject (for example an environment- or ref-bound credential) before it
  is built; this is a design input, not a closed item.
- Account Contributor service principals (059e4070..., 89a63f46...) and the subscription Owner can still change the
  Unlocked policy or re-enable shared-key access (INCOMPLETE-U1-09/10 unrecorded).
- The immutability lock is still deferred by owner ruling to the first real evidence cycle.
- `agent-skills-default` still requires code-scanning results that cannot exist (code scanning not configured), so
  with no bypass **no** PR can merge to `main` until code scanning is configured or the rule is changed.

---

## PART B - THE FINAL PIN RECORD (verbatim, `main` at ed848ba0)

```json
{
  "schema": "u1-verifier-pin/v3",
  "workflow": ".github/workflows/u1-verify.yml",
  "workflowCommit": "88da567530e7924ebea7246e9a372db2e819bdb2",
  "workflowFileSha256": "sha256:11e021e3e37408f361f62ef8b9ff1ef987bfc50e4cad1806fa20487bd79c0c26",
  "tag": "refs/tags/u1-verifier-pin",
  "producerWorkflow": ".github/workflows/u1-produce.yml",
  "custodian": {
    "login": "m0r6aN",
    "objectId": "461a4112-8e91-41cb-afef-6889b8f48ff0"
  },
  "tagRulesetId": 24378879,
  "supersedes": {
    "workflowCommit": "16a7e0fb0a5713bdfc7722e3227def6e6128cade",
    "workflowFileSha256": "sha256:3301a0e4bb95a272c5110907b6bfe6e9d3c3c6111f321f4ce285c1ac085e4c10",
    "reason": "closure review round 2 (G-1..G-14): U1-8-closure2-amendments-2026-10-02.md A-U1.8.17..27",
    "supersedes": {
      "workflowCommit": "dc5617924379a5a574fddb2c71cce1647a74ba04",
      "workflowFileSha256": "sha256:8329f858ec5de48d6a55cb7254c16c871d40875fc01b0ae4f4409e025ed2a661",
      "reason": "four az-download --file - sites fixed to temp-file reads (shakedown-found)",
      "supersedes": {
        "workflowCommit": "be3e3de3dfcf6159d4ffb265aa39847aac5f0814",
        "workflowFileSha256": "sha256:b7952e1e52f0144e7632fc73d8d04e9564184dfcf4c5af978c71592514cc4bbe",
        "reason": "U1-8 closure amendments A-U1.8.01..16 (F-1, F-2, F-3, F-5, F-16, F-17)"
      }
    }
  },
  "amendment": "U1-8-closure2-amendments-2026-10-02.md",
  "configurationChecklistSha256": "sha256:97b43dd9c09d4021ed657a7b7926e2092dff4260ff2fd679d6ab8301d0b1ff43",
  "actionlint": {
    "result": "pass",
    "version": "1.7.12",
    "runId": "37062860174",
    "commit": "88da567530e7924ebea7246e9a372db2e819bdb2",
    "workflow": ".github/workflows/u1-lint.yml"
  },
  "recordedAt": "2026-10-02T21:16:09Z",
  "note": "workflowCommit is the commit that INTRODUCED the pinned bytes (a record cannot embed its own commit SHA). An authoritative run executes at commit R = tag target = dispatch input, with workflowCommit R or an ancestor, workflow bytes at R equal to workflowFileSha256, and an active tag ruleset (A-U1.8.17). The trust-policy digest (IA-2.11) projects only workflow, workflowCommit, workflowFileSha256, tag, producerWorkflow and custodian, so record-only edits (dryRun, actionlint, recordedAt, note, supersedes) never move it. configurationChecklistSha256 is the checklist BYTE digest. The oracle is per request (A-U1.8.19), not in this record.",
  "dryRun": {
    "recordedAt": "2026-10-02T21:16:09Z",
    "executedCommit": "1e3baf20a43748bffab24c5855a9e0eca4c0574a",
    "producerRun": {
      "runId": "37048104083",
      "headSha": "77e0d9e34f8f2530828e526e78a6adb13131ea91",
      "evidenceDir": "plugins/foreman-line/bypass-outage-harness/u1-fixture/evidence",
      "note": "fixture feed; producer probes both denied (403 AuthorizationPermissionMismatch; 409 BlobImmutableDueToPolicy); imageOS/imageVersion recorded"
    },
    "runs": [
      {
        "case": "positive",
        "promotionRequestId": "u1-fixture-positive-r3",
        "runId": "37062999919",
        "outcome": "INCOMPLETE [U1_CONFIGURATION_INCOMPLETE] (notes: immutability Unlocked + unrecorded checklist rows only)",
        "sealDecisionDigest": "sha256:f96f3ec27c889c9336690f6d98906298d33bb4906210220913d86a857a974970",
        "sealDigest": "sha256:15fa6324dd62878542003343e3c2aba1f2f5370fc4f4cd11c629c6728696786b"
      },
      {
        "case": "negative-oracle-id",
        "promotionRequestId": "u1-fixture-neg-oracle-id-r3",
        "runId": "37064078616",
        "outcome": "INVALID/U1_SUBJECT_MISMATCH (oracle promotionRequestId mismatch)",
        "sealDecisionDigest": "sha256:321246662d1436a875683522a0905dee617c09d2e21221e82f095564521cb20a",
        "sealDigest": "sha256:efb850d243f8aab8ecbc2ae3d0ff10d8b539f997b598c45aaa0acaaaef35aae8"
      },
      {
        "case": "negative-trust-policy",
        "promotionRequestId": "u1-fixture-neg-trust-policy-r3",
        "runId": "37064527871",
        "outcome": "INVALID/U1_SUBJECT_MISMATCH (trustPolicyDigest != recomputed IA-2.11 digest)",
        "sealDecisionDigest": "sha256:988bacfbd4b2d6e0d553eca7c3409864f86a400f8af47204255bf4cf55bb8752",
        "sealDigest": "sha256:59f3d8853e86e0a0a10567b401834e8008da7d97e7ddb4b3c6f0e7a32db30f71"
      },
      {
        "case": "negative-execution-field",
        "promotionRequestId": "u1-fixture-neg-execution-r3",
        "runId": "37064834479",
        "outcome": "INVALID/U1_SUBJECT_MISMATCH (execution identity, 7 fields)",
        "sealDecisionDigest": "sha256:58cfdb14bd864aeb720bb58f8a4f5d978bda81320a5512e177ba41d7ade1fd18",
        "sealDigest": "sha256:239fb2050758cfa6a681c70663d1d75037212cca4d2bde46e28da3d6b9627fd8"
      },
      {
        "case": "negative-sandbox-mismatch",
        "promotionRequestId": "u1-fixture-neg-sandbox-mismatch-r3",
        "runId": "37065130461",
        "outcome": "INVALID/U1_CONTROL_FAILED (sandbox NC-U1-02 exit 0 != producer 1)",
        "sealDecisionDigest": "sha256:e9c3d75cdf42dc82be1ba913db5c0b047c77cd6713c950fc917b114d018f00c0",
        "sealDigest": "sha256:eee9875cd155116a0325217ce75ddd2f15bae9795301ac4481a5765be2501c96"
      },
      {
        "case": "negative-request-commit",
        "promotionRequestId": "u1-fixture-neg-commit-r3",
        "runId": "37065583439",
        "outcome": "resolve-request refusal U1_PROVENANCE_INVALID (request commit 5457d9d5 not in default-branch history, compare status behind); no decision, no attempt"
      }
    ],
    "defectsFoundAndFixed": [
      {
        "defect": "claim job probe-record output contained the masked azure/login client id; GitHub dropped the output; evaluate saw an empty verifier probe record",
        "foundBy": "run 37048507764 (positive, candidate 03263dfe)",
        "fixedBy": "fcb5afdf (PR #132)"
      },
      {
        "defect": "Azure returns 403 UnauthorizedBlobOverwrite (not AuthorizationPermissionMismatch) when a create-only role overwrites an existing blob; the probe classifier rejected a genuine denial",
        "foundBy": "run 37060187040 (positive r2, candidate 13d29b13)",
        "fixedBy": "88da5675 (PR #135); A-U1.8.23 clause 4 extended"
      },
      {
        "defect": "fixture request builder replaced the whole selectedExecution for the execution-field case, so that negative tested a missing selection, not a field mismatch",
        "foundBy": "run 37062023366 (negative r1)",
        "fixedBy": "coordinator tooling; r3 request regenerated before the final run"
      }
    ],
    "note": "Runs execute at the candidate pin commit executedCommit; the tag moves to the later commit that carries this dryRun record. dryRun/recordedAt are outside the IA-2.11 trust-policy projection, so requests and the checklist stay valid. The first-round runs (positive 37048507764 at 03263dfe; r2 runs at 13d29b13, workflowCommit fcb5afdf) were superseded by the workflow fixes above and are listed here, not re-claimed."
  }
}
```

---

## PART C - STORED DECISIONS (read-only; verbatim `notes[]`)

Store: `u1/m0r6an/agent-skills/verifications/<request-id>/a<K>/{audit/decision.json, seal.json, evidence/...}`;
ledger rows `u1/m0r6an/agent-skills/attempt-ledger/<request-id>/`; producer bundle
`u1/m0r6an/agent-skills/runs/37048104083/p01/`.

#### positive path (executed commit 1e3baf20 = candidate pin commit)

request `u1-fixture-positive-r3`, attempt 01, run 37062999919: status `INCOMPLETE`, reasonCodes `["U1_CONFIGURATION_INCOMPLETE"]`, authoritative true, executedCommit `1e3baf20a43748bffab24c5855a9e0eca4c0574a`, decision doc digest recorded in the seal.

notes[] verbatim:

```text
immutability policy not Locked >= 400d: state=Unlocked interval=400
checklist row not recorded: INCOMPLETE-U1-04
checklist row not recorded: INCOMPLETE-U1-09
checklist row not recorded: INCOMPLETE-U1-10
checklist row not recorded: INCOMPLETE-U1-11
checklist row not recorded: INCOMPLETE-U1-14
checklist row not recorded: INCOMPLETE-U1-15
checklist row not recorded: INCOMPLETE-U1-16
checklist row not recorded: INCOMPLETE-U1-17
checklist row not recorded: INCOMPLETE-U1-19
```

#### final-tag smoke (executed commit ed848ba0 = final tag target)

request `u1-fixture-positive-r3`, attempt 02, run 37065869917: status `INCOMPLETE`, reasonCodes `["U1_CONFIGURATION_INCOMPLETE"]`, authoritative true, executedCommit `ed848ba0595f7c8f6e01c1655babc725a73c2ef2`, decision doc digest recorded in the seal.

notes[] verbatim:

```text
immutability policy not Locked >= 400d: state=Unlocked interval=400
checklist row not recorded: INCOMPLETE-U1-04
checklist row not recorded: INCOMPLETE-U1-09
checklist row not recorded: INCOMPLETE-U1-10
checklist row not recorded: INCOMPLETE-U1-11
checklist row not recorded: INCOMPLETE-U1-14
checklist row not recorded: INCOMPLETE-U1-15
checklist row not recorded: INCOMPLETE-U1-16
checklist row not recorded: INCOMPLETE-U1-17
checklist row not recorded: INCOMPLETE-U1-19
```

#### negative: oracle id mismatch

request `u1-fixture-neg-oracle-id-r3`, attempt 01, run 37064078616: status `INVALID`, reasonCodes `["U1_CONFIGURATION_INCOMPLETE","U1_SUBJECT_MISMATCH"]`, authoritative true, executedCommit `1e3baf20a43748bffab24c5855a9e0eca4c0574a`, decision doc digest recorded in the seal.

notes[] verbatim:

```text
oracle promotionRequestId mismatch
immutability policy not Locked >= 400d: state=Unlocked interval=400
checklist row not recorded: INCOMPLETE-U1-04
checklist row not recorded: INCOMPLETE-U1-09
checklist row not recorded: INCOMPLETE-U1-10
checklist row not recorded: INCOMPLETE-U1-11
checklist row not recorded: INCOMPLETE-U1-14
checklist row not recorded: INCOMPLETE-U1-15
checklist row not recorded: INCOMPLETE-U1-16
checklist row not recorded: INCOMPLETE-U1-17
checklist row not recorded: INCOMPLETE-U1-19
```

#### negative: trust-policy mismatch

request `u1-fixture-neg-trust-policy-r3`, attempt 01, run 37064527871: status `INVALID`, reasonCodes `["U1_CONFIGURATION_INCOMPLETE","U1_SUBJECT_MISMATCH"]`, authoritative true, executedCommit `1e3baf20a43748bffab24c5855a9e0eca4c0574a`, decision doc digest recorded in the seal.

notes[] verbatim:

```text
trustPolicyDigest sha256:c31c98126a2521bc50f55b2a8ab0116dfcd2c3c074029445f80783ad81918d87 != recomputed trust-policy digest sha256:262e82c33a269bad5d14925bb6a320ee2ef62b11afa89e49bae2f00206257637
immutability policy not Locked >= 400d: state=Unlocked interval=400
checklist row not recorded: INCOMPLETE-U1-04
checklist row not recorded: INCOMPLETE-U1-09
checklist row not recorded: INCOMPLETE-U1-10
checklist row not recorded: INCOMPLETE-U1-11
checklist row not recorded: INCOMPLETE-U1-14
checklist row not recorded: INCOMPLETE-U1-15
checklist row not recorded: INCOMPLETE-U1-16
checklist row not recorded: INCOMPLETE-U1-17
checklist row not recorded: INCOMPLETE-U1-19
```

#### negative: execution-field mismatch

request `u1-fixture-neg-execution-r3`, attempt 01, run 37064834479: status `INVALID`, reasonCodes `["U1_CONFIGURATION_INCOMPLETE","U1_SUBJECT_MISMATCH"]`, authoritative true, executedCommit `1e3baf20a43748bffab24c5855a9e0eca4c0574a`, decision doc digest recorded in the seal.

notes[] verbatim:

```text
execution identity (7 fields) != promotion-request selection
immutability policy not Locked >= 400d: state=Unlocked interval=400
checklist row not recorded: INCOMPLETE-U1-04
checklist row not recorded: INCOMPLETE-U1-09
checklist row not recorded: INCOMPLETE-U1-10
checklist row not recorded: INCOMPLETE-U1-11
checklist row not recorded: INCOMPLETE-U1-14
checklist row not recorded: INCOMPLETE-U1-15
checklist row not recorded: INCOMPLETE-U1-16
checklist row not recorded: INCOMPLETE-U1-17
checklist row not recorded: INCOMPLETE-U1-19
```

#### negative: sandbox/producer mismatch

request `u1-fixture-neg-sandbox-mismatch-r3`, attempt 01, run 37065130461: status `INVALID`, reasonCodes `["U1_CONFIGURATION_INCOMPLETE","U1_CONTROL_FAILED"]`, authoritative true, executedCommit `1e3baf20a43748bffab24c5855a9e0eca4c0574a`, decision doc digest recorded in the seal.

notes[] verbatim:

```text
sandbox/producer mismatch: control NC-U1-02: sandbox exit/result 0/mechanical != producer 1/mechanical
immutability policy not Locked >= 400d: state=Unlocked interval=400
checklist row not recorded: INCOMPLETE-U1-04
checklist row not recorded: INCOMPLETE-U1-09
checklist row not recorded: INCOMPLETE-U1-10
checklist row not recorded: INCOMPLETE-U1-11
checklist row not recorded: INCOMPLETE-U1-14
checklist row not recorded: INCOMPLETE-U1-15
checklist row not recorded: INCOMPLETE-U1-16
checklist row not recorded: INCOMPLETE-U1-17
checklist row not recorded: INCOMPLETE-U1-19
```

#### negative: request commit not in default-branch history

run 37065583439 (request `u1-fixture-neg-commit-r3`, request commit 5457d9d5 on branch `u1-neg-commit`):
`resolve-request` failed with `U1_PROVENANCE_INVALID: promotion request commit 5457d9d5... is not in the
default-branch history (compare status behind)`; `claim-attempt` .. `close-attempt` skipped; no decision, no
attempt consumed.

---

## PART D - WHERE TO VERIFY

- Workflows at R: `git show ed848ba0595f7c8f6e01c1655babc725a73c2ef2:.github/workflows/u1-verify.yml` (hashes to the pin
  record's `workflowFileSha256`), `u1-produce.yml`, `u1-lint.yml`; fixture feed
  `plugins/foreman-line/bypass-outage-harness/u1-fixture/` and `u1-sandbox.mjs`.
- Live state to re-read: rulesets 22369510, 24257508 (no bypass), 24378879 (tag; bypass custodian only); environment
  `u1-verifier` deployment policies (tag only); `u1-reader-mi` federated credentials (`u1-reader-run-fc`,
  `u1-reader-tag-fc`) and role assignments (container Storage Blob Data Reader; account Reader); verifier role
  assignment 04dff4c8 condition; tag target.
- GitHub runs: producer 37048104083; verifier 37062999919, 37064078616, 37064527871, 37064834479, 37065130461,
  37065583439, 37065869917; earlier superseded rounds 37048507764, 37060187040, 37061196299, 37061669077,
  37062023366, 37062278353.

Return only the JSON verdict.
