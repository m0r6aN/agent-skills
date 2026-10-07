# U1 CONTRACT — §8 INDEPENDENT REVIEW DOSSIER (2026-10-01)

> Review input, assembled by the foreman-kernel coordinator for the §8 independent
> reviewer. This file is the exact material under review; it is recorded as part of
> the review record so the reviewed bytes are auditable.

---

## PART 0 — REVIEW DIRECTIVE (your duties; from contract §8)

You are the §8 independent reviewer of the U1 evidence contract (foreman-kernel goal).
Commissioned by the goal owner, Clinton Morgan (m0r6aN).

1. **Deliverable (§8.1):** a reasoned **ACCEPT** or **findings**. Exactly one review; findings
   are closed before FK-P18′ dispatch. No informal read substitutes for this.
2. **Identity (§8.2):** record your identity (`anthropic/claude-sonnet-5-5`) in the verdict.
   You must NOT have been the FK-P18′ builder for the reviewed work under any role label.
   The implementers were: a coordinator session (contract drafting, interface assignments),
   the same coordinator under owner authorization (Azure/GitHub provisioning, workflow
   placement, pin procedure), and subagents of that coordinator (package-matrix repairs).
   You had no hand in any of it — state this in `selfReviewStatement`.
3. **Custodian disclosure (§8.3):** disclose whether YOU administered any reviewed control.
   (Expected: no.) Undisclosed control administration voids the review.
4. **Method (§8.4):** hostile-input probing is licensed. Attempt the **naive-reading test** on
   the prose contract: construct wrong-but-literal readings and show whether the text
   excludes them. Every finding binds to a named location (§, file, field) and states the
   required change. Note method completeness in `methodNotes`.
5. **Scope of evaluation:** does the material below satisfy the contract's requirements for
   (a) the **verifier boundary** — independent protected workflow revision pinned by full
   commit SHA; candidate code treated as DATA; an isolated candidate-sandbox job with no
   secrets, untrusted output only; a producer-authored status never accepted as the
   verification decision; (b) the **selected GitHub workflow + permissions**; (c) the
   **runner identity** (hosted `ubuntu-24.04` label-level, limitation recorded); (d)
   **attestation issuance** posture (corroborator-only, never consumed); (e) the
   **trust-root/revocation** posture (repo trust root; revocation procedure is a named
   FK-P18′-dispatch live-recheck item — treat as honestly-bounded-open, not a silent gap)?
6. **Known open items** — judge whether they are honestly bounded or hidden gaps:
   INCOMPLETE-U1-15..19 live GitHub rechecks are dispatch-time acts; the immutability lock
   flip is deferred to the first real evidence cycle by explicit owner ruling (2026-09-30);
   the §8.5 evidence review comes later under the same protocol shape.
7. **Verdict format:** return STRICT JSON only, exactly this shape:

```json
{
  "verdict": "ACCEPT" | "FINDINGS",
  "reviewerIdentity": "anthropic/claude-sonnet-5-5",
  "custodianDisclosure": "<did you administer any reviewed control? state it>",
  "selfReviewStatement": "<your independence from the reviewed work>",
  "rationale": "<reasoned justification for the verdict>",
  "findings": [
    {
      "id": "F-1",
      "severity": "blocker" | "major" | "minor",
      "location": "<contract § / file / field>",
      "issue": "<what is wrong or missing>",
      "requiredChange": "<exact change that closes it>"
    }
  ],
  "naiveReadingTests": "<each wrong-but-literal reading you tested and whether the text excludes it>",
  "methodNotes": "<method completeness, limitations of this review>"
}
```

Be adversarial where the contract is vague. Do not accept on prose alone if a mechanism
is missing. A finding without a named location is not admissible.

---

## PART A — THE U1 CONTRACT (U1-contract-2026-09-29.md, sha256 8d5f849c…)

# U1 evidence contract — concrete draft (2026-09-29)

## 0. Status block

**CONTRACT DRAFT — INDEPENDENT REVIEW REQUIRED before FK-P18′ dispatch.**

This document is the concrete U1 evidence contract demanded by charter §14 ("Before FK-P18
implementation dispatch, a concrete independently reviewed contract must bind protected
verifier/workflow control, builder-input limits, credentials and runner lifecycle,
independent negative controls, evidence identities/retention, and bounded
unsupported/unavailable outcomes"). It is a **contract draft, not a review**: no independent
review verdict exists for it yet, and it cannot close the §14 dependency until the review
protocol in §8 completes with a reasoned ACCEPT.

This document **does not configure Azure or GitHub**. It creates no resource, grants no
authority, provisions no runner, changes no repository setting, and dispatches no workflow.
It makes **no enforcement, promotion, or genuineness claim** (D13 honesty, §9). It changes
no charter, parcel graph, gate, Allowed Files, or runtime capability. It supersedes the
OPEN items of `U1-evidence-contract-draft-20260907.md` only where the owner-ratified
selections (§2) or this document's interface assignments (§4) resolve them; everything else
is carried forward verbatim in intent (§10).

Coordinator rulings on the draft's open questions (OQ-U1-01…OQ-U1-08) were incorporated on
2026-09-29 (§11). The §14 dependency still stands until the §8 review completes and the §5
`INCOMPLETE` fields are recorded.

Binding audience: the FK-P18′ builder (producer contract), the FK-P18′ independent
reviewer (§8), and the eventual FK-P19/FK-P21 consumers (deferred parcels; their
obligations are bound here as evidence-chain requirements but their dispatch remains the
separate deferred-parcel decision — `fk-exit-annex-draft-2026-09-27.md`).

## 1. Scope, inputs, and pin integrity

### 1.1 What this contract binds

The six §14 scopes receive concrete clause sets in §3. The interface assignments in §4 are
the pre-dispatch item 3 of the selections record ("Assign final schema version, exact
artifact paths, canonical JSON/digest rules, invariant IDs, refusal-class IDs, and stable
reason codes in the FK-P18′ contract interface. The ratified size and depth limits above
bind those choices."). Owner/infrastructure facts that no document can supply are marked
`INCOMPLETE` in §5 and refuse promotion until recorded.

### 1.2 Pinned inputs (committed-bytes SHA-256; FK-P17 pin rule)

Every cited input is pinned by SHA-256 of its committed bytes. Uncommitted sibling state is
never pinnable. A pin change is a contract amendment (standing constraint #34), never a
silent re-anchor.

| Ref | Cited file (repo-relative) | Committed-bytes SHA-256 |
|---|---|---|
| PIN-01 | `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` | `57e345f9294cb8fcd8c3d90325505c80903648f60522f820061a5f8f288a86ac` |
| PIN-02 | `plugins/foreman-line/docs/goals/foreman-kernel/U1-contract-selections-2026-09-29.md` | `f2f0854aa17b666c05d6bbf818103bf09da1ff932b1210fba42b2f1776fe162a` |
| PIN-03 | `plugins/foreman-line/docs/goals/foreman-kernel/U1-evidence-contract-draft-20260907.md` | `9d6ca9637d1683aecd7deaffd57b3d880b0f182f4140bb97bd77e03ceb43bbb5` |
| PIN-04 | `plugins/foreman-line/docs/goals/foreman-kernel/U1-draft-review-20260907.md` | `4a7b3a85c5d74b9158b6c82177dfd4a3ca61dbddadc3fc42be8cf0721c713064` |
| PIN-05 | `plugins/foreman-line/docs/goals/foreman-kernel/U1-provider-observations-20260907.md` | `9c6bec119641323143c039acc19b2db3333adcf8088cff650228bb6f512ab61d` |
| PIN-06 | `plugins/foreman-line/docs/goals/foreman-kernel/charter.md` | `29a08a63b8e1c540bfa6863a0244dddb7e08b1e3889dac64d10892f87b06b693` |
| PIN-07 | `plugins/foreman-line/docs/goals/foreman-kernel/fk-rs2-gate1-reratification-2026-09-27.md` | `bb12ccb5c279b8c32095814c4a89ec577b4e0d7aa368656cd56c91a38d16b2ea` |
| PIN-08 | `plugins/foreman-line/docs/goals/foreman-kernel/fk-exit-annex-draft-2026-09-27.md` | `000edf930208c45b3dd62534ab4bd982a8db15941bcaaa9bf8a8e906272f7bdd` |
| PIN-09 | `plugins/foreman-line/docs/goals/foreman-kernel/fk-loop-stop-report-2026-09-29.md` | `1ca9843572e7376d4700bca5f1007bd6ae5b7b694145538e682abc41d8a616ab` |
| PIN-10 | `plugins/foreman-line/docs/specs/done/FK-P17-bypass-outage-matrix.md` | `932a0262497b5a3f5e8a75c8732b085b581ad48d54081b7bc238c29d7d97880c` |
| PIN-11 | `plugins/foreman-line/docs/specs/done/FK-P1-lifecycle-admission-decision-contracts.md` | `ec2d892288933845c32191e587a19b8a9f650e12d31538d28c78ca54552068a2` |

The untracked `U1-contract-selections-20260929.md` (pre-ratification variant of PIN-02) is
**not** an input and is never cited as authority.

### 1.3 SPEC-CONVENTION — cited for identity only, three-state

This contract pins **no grammar** of its own document format and reads no spec convention
as authority. `plugins/foreman-line/docs/SPEC-CONVENTION.md` is cited for identity only,
governed by the FK-P17 three-state rule (PIN-10, "Pin enforcement and the known-base gap"):

- committed-bytes pin: `7ac315005cde6ad6def848b83de1d1b644e321c5d9f6434bc925deb6daba8703`;
- (a) live committed bytes match the pin → PASS;
- (b) live bytes equal a **named known-base drift state** → emit a machine-readable
  KNOWN-GAP record and never claim the affected row. Named known-base state as of
  2026-09-29: uncommitted worktree extension (45 inserted lines), worktree digest
  `70508684d2c929d1331ed0cd9a147fcc2206593a04fbf210314e22fb80cba0a8` (matches FK-P2/FK-P17
  corroboration pin `sha256:70508684…cba0a8`); uncommitted sibling state is never pinnable;
- (c) any other drift → fail closed with `PIN_DRIFT`; never a silent re-anchor.

## 2. Ratified selections (binding input)

Verbatim from PIN-02 (owner-ratified 2026-09-29); where this contract concretizes a
selection, the concretization is marked **[CONCRETIZED]** and cannot contradict the
ratified text.

1. **Evidence limits:** Maximum total bundle size 64 MiB; maximum individual artifact size
   8 MiB; maximum 256 artifacts; maximum JSON nesting depth 16. Reject an over-limit bundle
   as `INVALID` with a stable reason code. **[CONCRETIZED]** the stable code is
   `U1_EVIDENCE_LIMIT_EXCEEDED` (IA-7); limits apply to the complete retained package
   (bundle document + every artifact + audit documents), enforced before expensive
   traversal.
2. **Attempt timeout:** Maximum 30 minutes per attempt. The previously adopted maximum of
   three total attempts within 24 hours, whichever limit is reached first, remains in
   force. Cancellation, timeout, interruption, or a nonreturning attempt consumes an
   attempt; the durable clock and attempt history do not reset on restart or ownership
   change. **[CONCRETIZED]** observable semantics in §3.6; attempt-record fields in IA-8.
3. **Verifier execution model:** The verifier runs from an independently protected workflow
   revision pinned by full commit SHA. Candidate code is treated as data. Any job that must
   execute candidate code is isolated, has no secrets or write credentials, and provides
   untrusted output to the verifier. A producer-authored status is never accepted as the
   verification decision. **[CONCRETIZED]** clauses in §3.1.
4. **Retention service:** Azure Blob Storage is the selected service class for retained
   evidence.

Azure retention clauses (PIN-02, "Azure retention proposal, pending resource selection and
observation"), now binding with the ratified duration:

- Dedicated private Blob container with a **locked, time-based immutability policy**. The
  minimum retention interval is **400 days from evidence creation — RATIFIED by the goal
  owner 2026-09-29** (owner directive: "Ratify 400-day duration for storage").
- TLS and Microsoft Entra ID authentication; container-scoped least privilege.
- Unique run-qualified object names (grammar in IA-9).
- A successful read-back plus SHA-256 comparison by the independent verifier before ACCEPT.
- The producer may submit new evidence objects but must not administer or shorten the
  retention policy or delete existing evidence.
- The verifier reads retained objects through an identity separate from the producer.
- Never account keys, long-lived SAS URLs, or GitHub Actions artifacts as the sole retained
  copy.

Concretization bound here **[CONCRETIZED]**: the locked immutability interval recorded at
provisioning (§5, INCOMPLETE-U1-11) must be **≥ 400 days** and measured from each object's
evidence creation time; once locked it can never be shortened (Azure locked policy
semantics), so a longer interval is permissible and its exact value is an owner
infrastructure decision (OQ-U1-05), not a builder choice.

## 3. The six §14 binding scopes — concrete clause sets

### 3.1 Protected verifier/workflow control

- 3.1.1 The verifier executes from an independently protected workflow revision pinned by
  **full commit SHA** (40-hex Git object ID), recorded at §5 (INCOMPLETE-U1-13) before
  dispatch. A branch name, tag, or mutable ref is never the pinned identity.
- 3.1.2 Candidate code is **data**: the verifier parses/inspects it; it is never sourced,
  required, imported, or executed by the verifier's own control path. Any job that must
  execute candidate code runs **isolated**, with **no secrets and no write credentials**,
  and its output reaches the verifier only as **untrusted input** (sanitized per standing
  constraint #31; parsed linear-time per #19).
- 3.1.3 A producer-authored status, verdict, check summary, runner label, or attestation
  predicate content is **never** the verification decision. The verification decision is
  produced only by the protected verifier invocation (decision authenticity boundary of
  PIN-03, carried).
- 3.1.4 The change boundary of the verifier code, workflow, action revisions, inputs,
  runner selection, expected-result oracle, and retention destination is administered by a
  **control custodian** distinct from the FK-P18′ builder (§5, INCOMPLETE-U1-14). Absence
  of recorded protection evidence → `INCOMPLETE`, refuses promotion. Prevention is never
  inferred from CODEOWNERS presence or a filename in Git (PIN-03 hostile control 4).
- 3.1.5 External actions and container inputs are pinned per the reviewed CI contract
  (INF-4, PIN-06): immutable revisions/content digests only; a mutable runner label or
  image tag is not a tested identity.
- 3.1.6 Attestations are **corroborator-only — never sole evidence** (ruling 2026-09-29,
  OQ-U1-04; the owner's own record: an attestation does not by itself establish artifact
  security). Primary evidence is the independent read-back + SHA-256 retention proof
  (§7.1).

### 3.2 Builder-input limits

- 3.2.1 The FK-P18′ builder controls only its named write surfaces (its workflow/CI
  integration points, per the FK-P18′ dispatch row). It must not control the verifier
  workflow, verifier policy, runner selection, retention policy, or deletion of retained
  evidence (PIN-02 Responsibility Boundary).
- 3.2.2 Builder-controlled inputs are enumerated in the `independence-model` artifact per
  invariant; any input that can change a required invariant's verdict is named there with
  its failure consequence. Shared parsing/utilities between producer and backstop are
  enumerated with digests; a token independent check never excuses shared blind spots
  (PIN-03, carried).
- 3.2.3 Bundle claims cannot select their own trusted signer, acceptable runner, candidate
  SHA, expected invariant set, or policy digest. The expected subject and trust policy come
  from reviewed coordinator/parcel authority (PIN-03, carried).
- 3.2.4 Over-limit input (§2 limits, code IA-7.2) is rejected before expensive traversal, as
  `INVALID`/`U1_EVIDENCE_LIMIT_EXCEEDED`; overflow is never truncation.
- 3.2.5 Secrets, raw bearer/OIDC tokens, signed download URLs, and reusable credentials are
  excluded from every artifact, digest, and log. Redaction that removes information needed
  to verify a required invariant makes the evidence **incomplete**, never accepted on
  trust (PIN-03, carried).

### 3.3 Credentials and runner lifecycle

- 3.3.1 Evidence submission authenticates with **TLS + Microsoft Entra ID**;
  container-scoped least privilege. No account keys; no long-lived SAS URLs; GitHub Actions
  artifacts are never the sole retained copy (§2, ratified).
- 3.3.2 The producer identity may **submit** new evidence objects only. It must not
  administer or shorten the retention policy or delete existing evidence (§2, ratified).
- 3.3.3 The verifier reads retained objects through an identity **separate from the
  producer** (§2, ratified). Identity separation is observed configuration (§5), not a
  naming convention.
- 3.3.4 Runner lifecycle: the hosted-runner identity (labels, provider runner IDs, group)
  is recorded per execution and rechecked at dispatch (§5, INCOMPLETE-U1-17). A mutable
  runner label is not a tested identity (INF-4). A self-hosted runner on the enforcement
  host does not satisfy backstop independence regardless of how its checks report (D8/D22
  lineage as recorded in PIN-07).
- 3.3.5 Credentials are described by capability and issuance scope; the credential itself
  is never retained. Provisioning runners, publishing images, or changing repository
  settings requires actual external-effect authority; this contract grants none
  (INF-4 carriers note).

### 3.4 Independent negative controls

- 3.4.1 Every negative control has a source-authored expected outcome, an immutable
  baseline, and an isolated mutation; direct exit status and full output are retained. A
  test that merely checks a producer-authored `pass` is insufficient (PIN-03, carried).
- 3.4.2 The control set NC-U1-01…NC-U1-13 (IA-11) is closed for this contract version.
  Dropping a required control or replacing its oracle with builder-supplied expected output
  refuses completeness; the invariant denominator never shrinks to obtain ACCEPT.
- 3.4.3 Classification honesty (D13, FK-P17 rules, PIN-10) is mandatory in every control
  and observation artifact: `mechanical | detected | unsupported` derived from observed
  signals only; `not-exercised` ≠ passed; model-membership is never scope containment;
  non-enrollment is never a refusal; a falsified hypothesis is a recorded result.
- 3.4.4 FK-P17′ evidence shapes (IA-10 mapping) are the producer's input; FK-P18′ feeds
  them into `observation` / `negative-control` artifacts without re-deriving or softening
  classifications. The inherited named gaps (file-symlink privilege case, CTRL-01, the
  `outage.ts` realpath sweep — PIN-09) are **recorded gaps, not acceptance blockers**
  (ruling 2026-09-29, OQ-U1-06): machine-readable `blocked:` gap records, named as
  FK-P18′-lane obligations in the exit annex, never counted as passed.
- 3.4.5 Required invariants (IA-5) are checked independently per invariant; each required
  invariant derives its verdict from the relevant candidate input. Reusing the hook's final
  verdict, authorization result, compiled output, or success flag without independent
  derivation is insufficient (PIN-03, carried).

### 3.5 Evidence identities/retention

- 3.5.1 Every retained object carries a unique **run-qualified** name (IA-9) in the
  dedicated private container; identity fields (subject source commit/tree, execution
  identity, verifier/workflow/action/configuration revisions and digests) are bound in the
  bundle (IA-4).
- 3.5.2 Retention: locked time-based immutability, interval ≥ 400 days from evidence
  creation (§2, ratified). Missing resource selection, authority, or observed configuration
  → `INCOMPLETE`, refuses promotion (PIN-02 rule, fields in §5).
- 3.5.3 Independent **read-back plus SHA-256 comparison** by the verifier identity precedes
  ACCEPT (§7). Retention/retrieval failure of the decision or any transitively referenced
  artifact blocks promotion even when all invariant observations pass (PIN-03, carried).
- 3.5.4 A CI job URL is a navigation pointer, never sole durable evidence (INF-4). The
  artifact inventory closes over every transitively referenced artifact in both `producer`
  and `verifier` namespaces (IA-4); a decision digest is a detached SHA-256, never a
  circular self-digest.
- 3.5.5 Loss after an earlier acceptance is a newly reported evidence failure, never
  permission to recreate historical output (PIN-03, carried).

### 3.6 Bounded unsupported/unavailable outcomes

- 3.6.1 Decision statuses are exactly `ACCEPT | INVALID | INCOMPLETE | UNSUPPORTED |
  UNAVAILABLE` (IA-7). `UNSUPPORTED` (selected provider/event/environment fundamentally
  cannot produce required evidence) is **terminal**: refuse promotion, no retry toward
  eligibility, select and review a supported path. `UNAVAILABLE` (temporarily unavailable
  for an identified external reason) permits **bounded retry only**.
- 3.6.2 Attempt budget (ratified, §2 item 2): at most **30 minutes per attempt**; at most
  **three total attempts within 24 elapsed hours** from `firstAttemptUtc`, whichever limit
  is reached first. Each attempt's enforced timeout is ≤ 30 minutes **and** ≤ the remaining
  absolute window. Cancellation, timeout, interruption, or a nonreturning attempt consumes
  its recorded attempt. A nonreturning attempt is marked timed out and refuses promotion.
- 3.6.3 The attempt clock and history are **durable** (IA-8 fields recorded before
  dispatching each attempt) and do not reset on restart or ownership change. After restart
  or ownership transfer, accounting resumes from the durable history; loading a prior
  serialized ACCEPT never recreates a trusted result (PIN-03, carried).
- 3.6.4 Budget exhaustion yields `INCOMPLETE` / `U1_AVAILABILITY_EXHAUSTED`, a stop report,
  and a named owner. No automatic host/provider change. A changed subject or execution
  selection gets a new budget only through an explicit newly recorded coordinator promotion
  request that cites and retains the old history; editing a digest never resets the budget.
- 3.6.5 Missing required evidence is `INCOMPLETE`/`U1_REQUIRED_EVIDENCE_MISSING`; missing
  owner/infrastructure configuration is `INCOMPLETE`/`U1_CONFIGURATION_INCOMPLETE`;
  missing evidence never degrades into `UNAVAILABLE` retries.

## 4. Interface assignments (pre-dispatch item 3)

All identifiers below are **closed vocabularies**. Counts of every closed set are derived by
counting the rows of the defining table — no total is hand-typed anywhere in this contract.
Numbered ID sequences are contiguous with no gaps (mechanical check at review).

### IA-1 Schema version

- Bundle/decision schema version literal: **`u1/0.1.0`** (the draft's owned version,
  PIN-03, assigned final; **confirmed by coordinator ruling 2026-09-29**, OQ-U1-02).
- Digest-preimage `apiVersion` literal: **`0.1.0`** (F05.5 rule, PIN-11).
- Version ownership: FK-P18′ owns `u1/*` schema evolution; any change to a closed
  vocabulary or grammar in IA-2…IA-10 is a contract amendment, never a silent schema
  drift. Unknown fields, unknown enum values, and missing required data fail structural
  validation (F05.1 rule, PIN-11).

### IA-2 Canonical JSON and digest rules (F05.5-consistent)

Reused verbatim from F05.5 (PIN-11): `Digest` literal is `sha256:` + exactly 64 lowercase
hex characters (F05.1); the canonical encoder is byte-total — (1) compact framing, no
insignificant whitespace, separators `,` `:`; (2) object keys sorted recursively by UTF-16
code-unit order, array order preserved; (3) strings escaped exactly as JSON.stringify
(quotation mark, reverse solidus, U+0000–U+001F as `\u00XX` lowercase hex), everything else
literal UTF-8; (4) numbers bound to `SafeInt` (0 … 2^53−1, digits-only lexeme, no sign,
leading zeros only for `0`); (5) atoms `true`/`false`/`null` bare; (6) documents hashed
through the wrapper `{domain, apiVersion, payload}` (rules 1–5), UTF-8 without BOM,
SHA-256, emitted `sha256:`-tagged. No Unicode normalization, no path case folding. The
P0 SourceRef/SnapshotEvidence/EvidenceRef triple is preserved verbatim and never retagged
(F05.5, PIN-11).

U1 digest domains (closed; every JSON document digest in this contract uses exactly one):

| Ref | Domain literal | Payload |
|---|---|---|
| IA-2.1 | `foreman-line.u1.bundle` | the validated `U1EvidenceBundle` document |
| IA-2.2 | `foreman-line.u1.promotion-request` | the immutable coordinator promotion request |
| IA-2.3 | `foreman-line.u1.decision` | the `U1VerificationDecision` document (detached digest, never self-referential) |
| IA-2.4 | `foreman-line.u1.retention-observation` | the retention-observation document (first-class required bundle artifact, IA-4) |
| IA-2.5 | `foreman-line.u1.attempt-record` | one durable attempt-accounting record |
| IA-2.6 | `foreman-line.u1.artifact-inventory` | the complete namespaced inventory document |

**Artifact byte digests** (`Artifact.digest`, `CodeInput.digest`) are SHA-256 over the exact
retained file bytes, emitted as `Digest`; they do **not** use the wrapper. Embedded upstream
digests (P0 shapes, FK-P17 manifest digests) are carried as recorded, never recomputed.

### IA-3 Artifact path grammar

```text
packagePath   := bundleDoc | auditDoc | artifactPath
bundleDoc     := "bundle.json"
auditDoc      := "audit/decision.json"
artifactPath  := "evidence/" kindSegment "/" fileSegment
kindSegment   := <one closed literal from IA-3.1, lowercase kebab-case>
fileSegment   := logicalId [ "." extension ]
logicalId     := 1*64( %x61-7A / %x30-39 / "-" / "_" )     ; [a-z0-9_-]{1,64}
extension     := 1*8( %x61-7A / %x30-39 )                  ; [a-z0-9]{1,8}
```

Rules (default-deny; each is tested independently — standing #3): ASCII only; `/` is the
sole separator; no `\`; no empty segment; no `.` or `..` segment; no leading or trailing
`/`; exactly the depths shown; case-sensitive matching; `logicalId` unique per namespace
across the whole package. Readers refuse absolute paths, traversal, duplicate
logicalIds/paths, symlink/reparse escapes, non-regular files, byte-length mismatch, and
digest mismatch (PIN-03, carried). Paths are transport-relative locations, never host read
capabilities.

**IA-3.1 Closed artifact-kind vocabulary** (bundle slot in parentheses):

| Ref | kindSegment | Bundle/decision slot |
|---|---|---|
| IA-3.1.1 | `enforcement-environment` | `enforcementEnvironmentManifest` |
| IA-3.1.2 | `producer-identity` | `producerIdentity` |
| IA-3.1.3 | `code-input` | `verifierCode[]` / `workflowCode[]` (retained bytes of source-bound code) |
| IA-3.1.4 | `action-inputs` | `actionInputs` |
| IA-3.1.5 | `toolchain` | `toolchainManifest` |
| IA-3.1.6 | `image` | `imageManifest` |
| IA-3.1.7 | `configuration` | `configurationManifest` |
| IA-3.1.8 | `independence-model` | `independenceModel` |
| IA-3.1.9 | `execution-provenance` | `executionProvenance[]` |
| IA-3.1.10 | `observation` | `observations[]` |
| IA-3.1.11 | `negative-control` | `negativeControls[]` |
| IA-3.1.12 | `retention-plan` | `retentionPlan` |
| IA-3.1.13 | `verifier-context` | decision `verifierContext` |
| IA-3.1.14 | `retrieval-check` | decision `retrievalCheck` |
| IA-3.1.15 | `retention-observation` | the required retention-observation artifact (IA-4; satisfies INCOMPLETE-U1-12) |

### IA-4 Bundle and decision closure (shapes carried from PIN-03)

`U1EvidenceBundle` (schemaVersion `u1/0.1.0`) retains the draft's closed shape verbatim:
`subject` (candidate Source, contractDigest, policyDigest, compiledScopeDigest,
enforcementEnvironmentManifest, requiredInvariantIds, promotedRefusalClassIds),
`execution` (ExecutionIdentity), `producerIdentity`, `verifierCode[]`, `workflowCode[]`,
`actionInputs`, `toolchainManifest`, `imageManifest`, `configurationManifest`,
`independenceModel`, `executionProvenance[]`, `observations[]`, `negativeControls[]`,
`retentionPlan`, `artifactInventory[]`. `Digest`, `Artifact`, `Source`, `CodeInput`,
`ExecutionIdentity` primitives retain the draft's definitions and F05.1 notation.

Closure rules (carried): `artifactInventory` lists every referenced artifact exactly once
including transitive references; absence of a component is an explicit typed reason, never
an empty tag or invented digest; the bundle is hashed externally by the consumer (no
circular self-digest). The audit `U1VerificationDecision` is a closed serialization of the
fresh in-process verifier result (never an authorization input; persisted decisions are
audit records only) with complete `producer:`/`verifier:` namespace-qualified inventory and
detached SHA-256 decision digest (IA-2.3). The **retention-observation artifact** (kind
`retention-observation`, IA-3.1.15, digest IA-2.4) is a **first-class required observation
artifact inside the U1 evidence bundle** (ruling 2026-09-29, OQ-U1-07): it satisfies the
retrieval-test evidence requirement (INCOMPLETE-U1-12), carries an inventory entry in the
bundle's evidence identity, and its own retained copy follows the same retention rules
(§3.5) — it is never "detached" from the bundle's evidence identity. It records retrieval
of the finalized decision bytes and is therefore written after the decision digest exists;
it is never referenced back into the already-hashed decision (no circularity).
Cross-namespace substitution, duplicate namespace-qualified IDs/paths, unlisted transitive
dependencies, and references resolving outside the retained package refuse evidence
completeness. Two runs of the same source/policy/image subject are not interchangeable;
exact selection equality is required (same-subject replay refused).

### IA-5 Invariant IDs (closed)

| Ref | Invariant ID | Invariant | §3.4/§3.5 lane | Refusal classes (IA-6) | FK-P17 anchors (PIN-10) |
|---|---|---|---|---|---|
| IA-5.1 | `INV-U1-01` | exact-scope: every governed mutation inside compiled Allowed Files; frozen surfaces immutable | exact-scope | `PATH_OUTSIDE_ALLOWED_FILES`, `FROZEN_SURFACE_MUTATION` | T2 CTL-01/CTL-02; V1–V4, V6 |
| IA-5.2 | `INV-U1-02` | worktree/branch identity of the governed session | exact-scope (target identity) | `WORKTREE_MISMATCH`, `BRANCH_MISMATCH` | V4 BYP-LK-03/04 |
| IA-5.3 | `INV-U1-03` | reviewer posture: no reviewer mutation; review worktree clean | dirty-reviewer | `REVIEWER_MUTATION_FORBIDDEN`, `REVIEW_WORKTREE_DIRTY` | FK-P18′ CI check |
| IA-5.4 | `INV-U1-04` | policy integrity: no policy self-modification; no mediated bypass mode | exact-scope/state | `POLICY_SELF_MODIFICATION`, `MEDIATED_BYPASS_MODE_FORBIDDEN` | V6 BYP-MB-02 |
| IA-5.5 | `INV-U1-05` | state/evidence: enrollment-bound state, lease ownership, revision currency, gate satisfaction | state/evidence | `OWNER_LEASE_MISMATCH`, `STATE_REVISION_STALE`, `GATE_NOT_SATISFIED` | V8 SST-01…03; V10 RST-01/02 |
| IA-5.6 | `INV-U1-06` | mediation-coverage detection: enrollment/heartbeat/CI detection of missing or non-loaded hooks | enrollment | none — detected-only (see IA-6 note) | V7 NRE-01…03 |

Ruling 2026-09-29 (OQ-U1-03): `INV-U1-06` is **not required for the first promotion** — it
is detected-only evidence and no enrollment detector ships today; requiring an unshipped
detector would force fabrication (D13). It becomes required when the detector ships; until
then it is a named recorded gap (the exit annex's NRE/detected-only rows).

`requiredInvariantIds` for any promotion request is a subset of IA-5 recorded by reviewed
coordinator authority; a required invariant never disappears from a result or becomes
optional because its producer failed.

### IA-6 Refusal-class IDs (closed)

Refusal-class IDs are the charter §5 initial enforceable refusal-class codes spelled
verbatim (F05.12 `WireCode` spellings, PIN-11/PIN-06) — a second vocabulary is never
created (D12). Groups are the charter §5 groups.

| Ref | Refusal-class ID | Group | Promotion target |
|---|---|---|---|
| IA-6.1 | `WORKTREE_MISMATCH` | 1 | yes |
| IA-6.2 | `BRANCH_MISMATCH` | 1 | yes |
| IA-6.3 | `PATH_OUTSIDE_ALLOWED_FILES` | 2 | yes |
| IA-6.4 | `FROZEN_SURFACE_MUTATION` | 2 | yes |
| IA-6.5 | `REVIEWER_MUTATION_FORBIDDEN` | 3 | yes |
| IA-6.6 | `REVIEW_WORKTREE_DIRTY` | 3 | yes |
| IA-6.7 | `POLICY_SELF_MODIFICATION` | 4 | yes |
| IA-6.8 | `MEDIATED_BYPASS_MODE_FORBIDDEN` | 4 | yes |
| IA-6.9 | `OWNER_LEASE_MISMATCH` | 5 | yes |
| IA-6.10 | `STATE_REVISION_STALE` | 5 | yes |
| IA-6.11 | `GATE_NOT_SATISFIED` | 5 | yes |

**Detected-only, never a refusal class and never promotable:** `SESSION_ENROLLMENT_MISSING`,
disabled hooks, ignored plugin frontmatter, launch outside the governed adapter (charter §5;
FK-P17 D13 rule 3). These may appear in observation artifacts (INV-U1-06) but MUST NOT
appear in `promotedRefusalClassIds`. A detected-only result is never reported as a hook
refusal. `promotedRefusalClassIds` is a **promotion-time parameter owned by FK-P19/the
owner** (ruling 2026-09-29, OQ-U1-08): this contract declares the full IA-6 producible
vocabulary and **never selects the promoted subset** — a producer contract selecting its
own promotion set would be a self-approval surface. The parameter is
owner/next-parcel-supplied.

### IA-7 Stable reason codes (closed) and status mapping

Each code maps to exactly one decision status. Unknown codes fail structural validation.

| Ref | Reason code | Status | Raised when |
|---|---|---|---|
| IA-7.1 | `U1_SUBJECT_MISMATCH` | `INVALID` | subject, selection, run/job/attempt/event/repository/revision, policy, or environment identity mismatch; same-subject historical replay |
| IA-7.2 | `U1_EVIDENCE_LIMIT_EXCEEDED` | `INVALID` | **over-limit bundle** (64 MiB total / 8 MiB per artifact / 256 artifacts / JSON depth 16) — the ratified stable code |
| IA-7.3 | `U1_ARTIFACT_INVALID` | `INVALID` | malformed/tampered bytes; digest or byte-length mismatch; path-grammar violation; duplicate IDs/paths; non-regular file, traversal, or link escape; inventory/closure failure |
| IA-7.4 | `U1_PROVENANCE_INVALID` | `INVALID` | falsely asserted identity; unauthentic execution evidence; producer-authored status offered as the verification decision; falsified retention claim |
| IA-7.5 | `U1_CONTROL_FAILED` | `INVALID` | a required negative control or invariant check failed to demonstrate its expected refusal/detection |
| IA-7.6 | `U1_REQUIRED_EVIDENCE_MISSING` | `INCOMPLETE` | required artifact, observation, control, or check absent; redaction removed verifiable content |
| IA-7.7 | `U1_CONFIGURATION_INCOMPLETE` | `INCOMPLETE` | **missing resource selection, authority, or observed configuration** (any §5 field unrecorded) — the ratified `INCOMPLETE` code |
| IA-7.8 | `U1_RETENTION_UNPROVEN` | `INCOMPLETE` | retention/read-back/retrieval not demonstrated (falsified claims are IA-7.4) |
| IA-7.9 | `U1_INDEPENDENCE_UNPROVEN` | `INCOMPLETE` | independence model absent or insufficient to derive a required invariant independently (falsified assertions are IA-7.4) |
| IA-7.10 | `U1_AVAILABILITY_EXHAUSTED` | `INCOMPLETE` | attempt budget exhausted (3 attempts / 24 h, whichever first); stop report + named owner — **confirmed by ruling 2026-09-29** (OQ-U1-01: fail-closed; exhausted attempts never fabricate a decision) |
| IA-7.11 | `U1_CONTEXT_UNSUPPORTED` | `UNSUPPORTED` | selected provider/event/environment fundamentally cannot produce required independent evidence — terminal |
| IA-7.12 | `U1_PROVIDER_UNAVAILABLE` | `UNAVAILABLE` | previously supported retrieval/verification temporarily unavailable for an identified external reason — bounded retry only |

`ACCEPT` carries an empty `reasonCodes` list. Per-invariant results carry exact invariant ID
(IA-5), status, and evidence digests.

### IA-8 Durable attempt-accounting record

One record per attempt, digested under IA-2.5, appended to durable history before the
attempt is dispatched; history never resets (§3.6.3):

| Ref | Field | Type | Notes |
|---|---|---|---|
| IA-8.1 | `promotionRequestId` | Id | unique per coordinator request |
| IA-8.2 | `subjectAndSelectionDigest` | Digest | exact subject + execution-selection digest |
| IA-8.3 | `firstAttemptUtc` | timestamp (UTC, ISO-8601) | fixed at first attempt; anchors the 24 h window |
| IA-8.4 | `deadlineUtc` | timestamp (UTC) | `firstAttemptUtc` + 24 h; never extended by retries |
| IA-8.5 | `attemptNumber` | SafeInt | 1-based; ≤ 3 |
| IA-8.6 | `attemptStartUtc` / `attemptDeadlineUtc` | timestamp (UTC) | `attemptDeadlineUtc` ≤ start + 30 min and ≤ `deadlineUtc` |
| IA-8.7 | `outcome` | closed: `accept \| invalid \| incomplete \| unsupported \| unavailable \| timed-out \| cancelled \| interrupted \| nonreturning` | cancellation/timeout/interruption/nonreturn all consume the attempt |

### IA-9 Azure blob object-name grammar (run-qualified)

```text
blobName := "u1/" owner "/" repo "/runs/" runId "/" attemptPos "/" packagePath
owner    := 1*39( %x61-7A / %x30-39 / "-" )      ; GitHub owner, lowercase
repo     := 1*100( %x61-7A / %x30-39 / "-" / "." / "_" )
runId    := 1*10( %x30-39 )                       ; provider run identity, decimal
attemptPos := "a" 1*2( %x30-39 )                  ; e.g. a01
packagePath := IA-3 packagePath
```

Uniqueness is per run + attempt: the same `packagePath` under a different `runId`/`attempt`
is a different object; overwriting an existing object name is refused (immutability makes
overwrite impossible; a collision is a producer bug surfaced as IA-7.3). The audit decision
is stored under the same run qualifier at `audit/decision.json`; the retention-observation
artifact is stored as a normal bundle artifact under `evidence/retention-observation/…`
(IA-3), inside the bundle's evidence identity per ruling 2026-09-29 (OQ-U1-07).

### IA-10 FK-P17 evidence-shape feed mapping

FK-P18′ consumes FK-P17′ shapes (PIN-10) as producer inputs; classifications are carried,
never re-derived:

| FK-P17 shape | U1 slot | Binding rules |
|---|---|---|
| `evidence/vectors/V1-shell.json` … `V10-restart.json` | `observation` artifacts (kind `observation`) | per-case records carry T4 signals; `mechanismPolicyClass: model-membership` rows excluded from scope-containment tallies |
| `evidence/controls.json` | `negative-control` artifacts (kind `negative-control`) | T2 controls feed NC-U1-* rows; direct exit status + full outputs retained |
| `evidence/matrix.json` | `observation` + inventory entries | first-class `exercised: yes \| gap`; `gap` rows carry gap records and are never passed |
| `evidence/summary.json`, `evidence/manifest.json` | `execution-provenance` / `configuration` evidence | manifest digests carried as recorded (IA-2 note); pin states and gap records preserved |
| `evidence/measurements.jsonl`, `measurement-summary.json` | `observation` artifacts (INF-5 coarse CI regression only) | IP-3 comparability caveat preserved verbatim; no row presents IP-3 as the D21 span |
| `HarnessErrorCode` (T7) | gap-record `reason` values | `not-exercised` semantics preserved |

### IA-11 Negative-control set (closed)

Carried from PIN-03's reviewed hostile controls, renumbered contiguously and mapped to
invariants:

| Ref | Control ID | Control (condensed) | Invariant |
|---|---|---|---|
| IA-11.1 | `NC-U1-01` | hook mediation bypassed + out-of-scope mutation; backstop detects; promotion refused | INV-U1-01 |
| IA-11.2 | `NC-U1-02` | missing/disabled enrollment, stale/mismatched state, dirty reviewer worktree each fail independently | INV-U1-02…06 |
| IA-11.3 | `NC-U1-03` | hook verdict/compiled result replaced with apparently successful value; independent derivation still detects | INV-U1-01, INV-U1-04 |
| IA-11.4 | `NC-U1-04` | verifier/workflow/action/configuration changed via builder input or mutable indirection; prevention evidenced or identity/control contract fails | INV-U1-04 |
| IA-11.5 | `NC-U1-05` | candidate/run/attempt/job/event/repo/revision/policy/environment substitution and replay, incl. same-subject different-run replay | all (selection equality) |
| IA-11.6 | `NC-U1-06` | spoofed runner label or self-attested producer verification cannot satisfy provenance method | INV-U1-01 (provenance) |
| IA-11.7 | `NC-U1-07` | deleted artifact, truncated output, falsified exit status, altered bytes, duplicate IDs, traversal, links/non-files rejected before consumption | INV-U1-01 (artifact closure) |
| IA-11.8 | `NC-U1-08` | dropped negative control or builder-supplied oracle refused, denominator preserved | INV-U1-01…06 |
| IA-11.9 | `NC-U1-09` | producer-written ACCEPT material ignored; forged ACCEPT with correct digests rejected (no serialized-verdict input, no trusted invocation result); other-request result and post-restart replay rejected | decision authenticity |
| IA-11.10 | `NC-U1-10` | unsupported event terminal; missing permissions/evidence never infinite UNAVAILABLE; attempt-budget exhaustion, nonreturning timeout, cancellation, restart, owner transfer all preserve attempts and `firstAttemptUtc` | §3.6 |
| IA-11.11 | `NC-U1-11` | retention access expiry/consumer lockout/trust-material loss reported as retention failure, CI URL never cited as durable proof | INV-U1-01 (retention) |
| IA-11.12 | `NC-U1-12` | positive control: unchanged valid subject, complete controls, successful retrieval trial → ACCEPT; still never human Gate 3 | §7 |
| IA-11.13 | `NC-U1-13` | omitted verifier artifact, duplicated namespace ID/path, changed digest, unlisted transitive reference, producer-for-verifier substitution refused; decision retention failure blocks promotion | INV-U1-01 (closure) |

## 5. Owner/infrastructure fields — `INCOMPLETE`

Every field below is **`INCOMPLETE`** as of this draft. Per the selections record: "Missing
resource selection, authority, or observed configuration yields `INCOMPLETE` and refuses
promotion." Each unrecorded field raises `U1_CONFIGURATION_INCOMPLETE` (IA-7.7) and blocks
ACCEPT. This contract cannot supply these values; they are owner/infrastructure acts.

| Ref | Field | Required record | Authority |
|---|---|---|---|
| INCOMPLETE-U1-01 | Azure tenant | tenant ID | owner/infrastructure |
| INCOMPLETE-U1-02 | Azure subscription | subscription ID | owner/infrastructure |
| INCOMPLETE-U1-03 | Azure resource group | name | owner/infrastructure |
| INCOMPLETE-U1-04 | Azure storage account | account name + SKU/redundancy — **owner-pending** (OQ-U1-05 ruling 2026-09-29: infrastructure selection; not decided by the coordinator or this contract) | owner/infrastructure |
| INCOMPLETE-U1-05 | Azure blob container | container name (dedicated, private) | owner/infrastructure |
| INCOMPLETE-U1-06 | Retention custodian | identity (Entra principal/group) + separately granted authority reference | owner |
| INCOMPLETE-U1-07 | Producer identity | Entra principal that submits evidence | owner/infrastructure |
| INCOMPLETE-U1-08 | Verifier identity | Entra principal for read-back, **separate from producer** | owner/infrastructure |
| INCOMPLETE-U1-09 | RBAC assignments | role definition + assignment per identity, container-scoped least privilege | control custodian |
| INCOMPLETE-U1-10 | Network/access configuration | TLS-only enforcement; public-network/Private Endpoint posture | control custodian |
| INCOMPLETE-U1-11 | Locked retention interval | locked time-based immutability policy: mode `locked`, interval ≥ 400 days from evidence creation, effective UTC timestamp — exact interval **owner-pending** (OQ-U1-05 ruling 2026-09-29; the ≥ 400-day minimum is already RATIFIED) | control custodian |
| INCOMPLETE-U1-12 | Retrieval-test evidence | successful independent read-back + SHA-256 comparison record | verifier identity |
| INCOMPLETE-U1-13 | Protected verifier workflow revision | workflow path + **full commit SHA** | owner (select) / control custodian (protect) |
| INCOMPLETE-U1-14 | Protected verifier control custodian | identity administering workflow-change protection | owner |
| INCOMPLETE-U1-15 | Live platform recheck — GitHub event/context selection for the evidence run | observed at dispatch | coordinator + reviewer |
| INCOMPLETE-U1-16 | Live platform recheck — effective workflow-token permissions (producer/verifier jobs) | observed at dispatch | coordinator + reviewer |
| INCOMPLETE-U1-17 | Live platform recheck — hosted-runner identity (labels, runner IDs, group) | observed at dispatch | coordinator + reviewer |
| INCOMPLETE-U1-18 | Live platform recheck — attestation issuance capability exercised for the selected event | observed at dispatch | coordinator + reviewer |
| INCOMPLETE-U1-19 | Live platform recheck — trust-root acquisition + revocation/update procedure | recorded procedure | coordinator + reviewer |

**Historical-input caveat (mandatory):** the September 7 provider observations (PIN-05) are
historical inputs, **not proof of present configuration** (§9). Every INCOMPLETE-U1-15…19
field is rechecked against the live repository/account before FK-P18′ dispatch and again
before any ACCEPT.

## 6. Responsibility Boundary (verbatim from PIN-02)

- The **independent reviewer** evaluates whether the verifier boundary, workflow
  permissions, runner lifecycle, provider evidence, negative controls, and retention
  evidence satisfy the contract. The reviewer records a reasoned ACCEPT or findings; the
  reviewer does not need to operate the Azure account or author the protected verifier.
- The **control custodian/operator** supplies observed provider and storage configuration
  and administers those controls under separately granted authority. The FK-P18′ builder
  must not control the verifier workflow, verifier policy, runner selection, retention
  policy, or deletion of retained evidence.
- To avoid self-review, the contract review and eventual evidence review must identify the
  reviewer and show that person did not act as the FK-P18′ builder for the reviewed work.
  The independent review must also disclose whether the reviewer administered the controls
  being reviewed.

## 7. Acceptance procedure

1. **Independent retrieval + digest:** the verifier identity reads each retained object
   through its own access (never the producer's), recomputes SHA-256 over the read-back
   bytes, and compares to the recorded `Digest` **before ACCEPT**. Mismatch or unreadable
   object → `INVALID`/`U1_ARTIFACT_INVALID`; absent/unproven retrieval →
   `INCOMPLETE`/`U1_RETENTION_UNPROVEN`.
2. **Limits and grammar:** IA-7.2 limits and IA-3 grammar enforced before expensive
   traversal; over-limit → `INVALID`/`U1_EVIDENCE_LIMIT_EXCEEDED`.
3. **Closure:** complete namespaced inventory (IA-4); every transitive reference listed;
   cross-namespace substitution refused. NC-U1-13 exercised.
4. **Subject/selection equality:** the immutable coordinator promotion request binds exact
   execution identity and subject; equality is required; same-subject replay refused
   (NC-U1-05).
5. **Invariants:** every ID in `requiredInvariantIds` has a per-invariant result derived
   independently (§3.4.5). Missing → `INCOMPLETE`/`U1_REQUIRED_EVIDENCE_MISSING`; failed →
   `INVALID`/`U1_CONTROL_FAILED`. Required invariants never shrink with producer failures.
6. **Negative controls:** the closed set IA-11 present with direct exit status and full
   outputs, or an explicit `not-exercised` gap record (never a pass). Dropped
   control/builder oracle → refuses completeness (NC-U1-08).
7. **Configuration:** every §5 field recorded with authority + observed configuration;
   otherwise `INCOMPLETE`/`U1_CONFIGURATION_INCOMPLETE`.
8. **Retention demonstration:** locked immutability (≥ 400 days) observed; retrieval test
   (INCOMPLETE-U1-12) passed via the required retention-observation artifact (IA-4);
   decision + retention observation retained under the same retention rules.
9. **Missing evidence refuses promotion** (charter §14). Only then may status be `ACCEPT` —
   which is a U1 input to the (deferred) FK-P19 gate, never an approval, merge, receipt, or
   human Gate 3. A positive control (NC-U1-12) passing does not satisfy any other
   prerequisite.

## 8. Review protocol

- 8.1 **Exactly one fresh independent reviewer** reviews this contract before FK-P18′
  dispatch. The deliverable is a **reasoned ACCEPT or findings**; findings are closed before
  dispatch. No number of informal reads substitutes for this review.
- 8.2 The reviewer **identity is recorded** in the review record. The reviewer **must not
  have been the FK-P18′ builder for the reviewed work**, under any role label
  (self-review prohibition).
- 8.3 The reviewer **must disclose whether they administered the reviewed controls**
  (custodian disclosure). A reviewer who administered the reviewed controls discloses that
  fact in the verdict; the disclosure is part of the record, not an automatic disqualifier
  — but undisclosed control administration voids the review.
- 8.4 Review method (standing constraints #8/#9/#11): hostile-input probing is licensed;
  for this prose contract the naive-reading test is attempted (implement the
  wrong-but-literal reading and show the text excludes it); any test claiming an invariant
  is bound to the named check. Review cycles end with an assertion of no commits/dirty
  files in the reviewer worktree (#10).
- 8.5 The same protocol shape governs the eventual evidence review (PIN-02 boundary): the
  evidence reviewer identifies themselves, is not the builder of the reviewed work, and
  discloses control administration.
- 8.6 This contract's review is **not** provisioned by review: "The reviewer verifies this
  boundary; review alone does not provision or protect it" (PIN-02).

## 9. Honesty rules and assumed boundaries (D13)

- 9.1 **No enforcement, promotion, or genuineness claim.** Nothing in this contract, its
  acceptance, or any artifact produced under it asserts enforcement, promotion, artifact
  genuineness, or containment beyond the proven row (FK-P17 D13 rules, PIN-10). ACCEPT is
  evidence-chain input, not enforcement.
- 9.2 **Assumed boundaries are stated as assumed:**
  - *Operator trust (assumed):* the control custodian and reviewer act honestly; the Azure
    tenant and GitHub account administrators are outside the threat model (the independence
    claim is resistance to declared builder/producer-controlled inputs, not to every
    administrator or host compromise — PIN-03, carried).
  - *Platform facts (assumed unless observed):* GitHub/Azure documented behavior
    (attestations, retention ranges, immutability semantics) is documentation, not
    configuration. Provider-issued provenance corroborates execution; it never replaces
    protected verifier code and independently evaluated controls (PIN-05).
  - *Isolation claims stay distinct (INF-4, PIN-06):* separate machines contribute
    isolation but are not sufficient for independent verification; a local fresh
    environment demonstrates freedom from ambient dependencies, not host-compromise
    resistance.
- 9.3 **D13 honesty carries in full:** CI lands before enforcement promotion; reviewer
  sessions fail closed on opaque mutation-capable shell; builder shell limitations are
  disclosed, never described as complete containment; a missing/non-loaded hook is detected
  through enrollment/CI and never described as refused; model-membership is never scope
  containment; not-run ≠ passed.
- 9.4 **September 7 observations are historical inputs, not proof.** PIN-05 reported that
  actual workflow protection and artifact retention were not demonstrated, no self-hosted
  runners were configured, and no existing evidence artifact was available to retrieve.
  Those are observations at 2026-09-07 14:58:11 UTC. **Recheck live settings before
  dispatch** (INCOMPLETE-U1-15…19) and before every ACCEPT.
- 9.5 **INF-8 fragment (named, never claimed):** recovery-point/recovery-time objectives
  remain unresolved numeric owner policy; the process-boundary recovery proof is stranded
  in the exit annex (PIN-07 RS-2.2). This contract neither claims recovery objectives met
  nor blocks on them; they are named at their affected gates.
- 9.6 **INF-4 fragment (named):** the retained-evidence manifest obligation
  (FK-P21/deferred) and the U1 evidence chain remain NOT-satisfied until this contract is
  independently reviewed (§8), the §5 fields are recorded, and FK-P18′ evidence passes §7
  (PIN-08 U1 row).

## 10. Carried-forward items (the draft's eight selection facts, dispositions)

| Selection fact (PIN-03) | Disposition |
|---|---|
| Evidence limits | **RESOLVED** — ratified (§2.1), concretized (IA-7.2) |
| Timeout/attempt implementation | **RESOLVED** — ratified (§2.2), observable semantics (§3.6, IA-8); enforcement mechanism is builder work under the ratified policy |
| Verifier execution model | **RESOLVED** — ratified (§2.3), clauses (§3.1) |
| Retention service | **RESOLVED** — Azure Blob (§2.4) |
| Retention duration | **RESOLVED** — 400 days minimum, RATIFIED 2026-09-29 (§2) |
| Retention custodian / resource selection | **OPEN → §5 `INCOMPLETE` fields** (owner/infrastructure act) |
| Provider/event + trust roots and workflow-protection evidence | **OPEN → §5 `INCOMPLETE` fields + live recheck** (observation at dispatch) |
| Schema/paths/invariants/refusal-classes/reason codes | **RESOLVED by §4** (this contract's interface assignments; bound by the ratified limits) |
| Independent P19 review context | **RESOLVED in shape** by §6 (reviewer separation + custodian disclosure required); the review act itself is §8 |

Consumer-interface shapes (`produceEvidence` / `evaluatePromotion` / `retainEvidence`) and
the decision-authenticity boundary from PIN-03 are carried unchanged; FK-P19 and FK-P21
remain deferred parcels whose dispatch is a separate owner decision (PIN-08), never
implied by this contract.

## 11. Open questions — coordinator rulings incorporated (2026-09-29)

The eight questions below were answered by coordinator ruling on 2026-09-29 and are
incorporated at their binding points (§3, §4, §5, §7). Where a ruling routes a decision to
the owner, it is recorded **owner-pending** and is not decided by the coordinator or by
this contract.

| Ref | Question | Disposition (ruling 2026-09-29) |
|---|---|---|
| OQ-U1-01 | `U1_AVAILABILITY_EXHAUSTED` → `INCOMPLETE` (carried default) or `INVALID`? | **RULED** — surfaces as `INCOMPLETE`, fail-closed (exhausted attempts never fabricate a decision). Default stands (IA-7.10). |
| OQ-U1-02 | Schema literal `u1/0.1.0` as assigned? | **RULED** — confirmed; apiVersion `0.1.0` in the F05.5 preimages (IA-1). |
| OQ-U1-03 | Is `INV-U1-06` required for the first promotion (no enrollment detector ships today)? | **RULED** — not required for the first promotion; detected-only evidence; requiring an unshipped detector would force fabrication (D13). Becomes required when the detector ships; until then a named recorded gap (IA-5). |
| OQ-U1-04 | Attestation required or corroborator-only? | **RULED** — corroborator-only, never sole evidence (an attestation does not by itself establish artifact security). Primary evidence = independent read-back + SHA-256 retention proof (§3.1.6). |
| OQ-U1-05 | Azure SKU/redundancy and exact locked interval (≥ 400 days ratified)? | **OWNER-PENDING** — infrastructure selections routed to the owner; not decided here. Recorded in §5 (INCOMPLETE-U1-04, INCOMPLETE-U1-11). |
| OQ-U1-06 | Inherited FK-P18′ gaps blockers or recorded gaps? | **RULED** — recorded gaps, not blockers (machine-readable `blocked:` records, named FK-P18′-lane obligations in the exit annex, never counted as passed) (§3.4.4). |
| OQ-U1-07 | Retention-observation placement? | **RULED** — first-class required observation artifact inside the U1 evidence bundle (satisfying INCOMPLETE-U1-12), its retained copy under the same retention rules; never "detached" from the bundle's evidence identity (IA-4, IA-9). |
| OQ-U1-08 | `promotedRefusalClassIds` full set or selected subset? | **RULED** — promotion-time parameter owned by FK-P19/the owner; the contract declares the full IA-6 producible vocabulary and never selects the promoted subset (self-approval surface). Parameter owner/next-parcel-supplied (IA-6). |

Owner-pending items recorded (not decided here): the OQ-U1-05 selections and the OQ-U1-08
promotion-set parameter. After incorporation the contract awaits (a) the owner's
INCOMPLETE-field acts (§5, esp. OQ-U1-05), and (b) the one fresh independent review per §8
before FK-P18′ dispatch. None of the owner-pending items is silently resolved by a builder
default.


---

## PART B — OWNER-RATIFIED SELECTIONS (U1-contract-selections-2026-09-29.md)

# U1 contract selections — 2026-09-29

Status: **COORDINATOR DECISION RECORD / CONTRACT STILL INCOMPLETE**. This records selections ratified by the goal owner on 2026-09-29. It supplements, and does not edit or replace, `U1-evidence-contract-draft-20260907.md` or its review. It is not the independent review required before FK-P18′ dispatch, and it does not configure Azure or GitHub infrastructure.

## Ratified selections

1. **Evidence limits:** Maximum total bundle size 64 MiB; maximum individual artifact size 8 MiB; maximum 256 artifacts; maximum JSON nesting depth 16. Reject an over-limit bundle as `INVALID` with a stable reason code.
2. **Attempt timeout:** Maximum 30 minutes per attempt. The previously adopted maximum of three total attempts within 24 hours, whichever limit is reached first, remains in force. Cancellation, timeout, interruption, or a nonreturning attempt consumes an attempt; the durable clock and attempt history do not reset on restart or ownership change.
3. **Verifier execution model:** The verifier runs from an independently protected workflow revision pinned by full commit SHA. Candidate code is treated as data. Any job that must execute candidate code is isolated, has no secrets or write credentials, and provides untrusted output to the verifier. A producer-authored status is never accepted as the verification decision.
4. **Retention service:** Azure Blob Storage is the selected service class for retained evidence.

## Responsibility boundary

- The **independent reviewer** evaluates whether the verifier boundary, workflow permissions, runner lifecycle, provider evidence, negative controls, and retention evidence satisfy the contract. The reviewer records a reasoned ACCEPT or findings; the reviewer does not need to operate the Azure account or author the protected verifier.
- The **control custodian/operator** supplies observed provider and storage configuration and administers those controls under separately granted authority. The FK-P18′ builder must not control the verifier workflow, verifier policy, runner selection, retention policy, or deletion of retained evidence.
- To avoid self-review, the contract review and eventual evidence review must identify the reviewer and show that person did not act as the FK-P18′ builder for the reviewed work. The independent review must also disclose whether the reviewer administered the controls being reviewed.

## Azure retention proposal, pending resource selection and observation

Use a dedicated private Blob container with a locked, time-based immutability policy. The minimum retention interval is **400 days from evidence creation — RATIFIED by the goal owner 2026-09-29** (owner directive: "Ratify 400-day duration for storage"). Require TLS and Microsoft Entra ID authentication, container-scoped least privilege, unique run-qualified object names, and a successful read-back plus SHA-256 comparison by the independent verifier before ACCEPT. The producer may submit new evidence objects but must not administer or shorten the retention policy or delete existing evidence. The verifier reads retained objects through an identity separate from the producer. Do not use account keys, long-lived SAS URLs, or GitHub Actions artifacts as the sole retained copy.

Before this becomes a binding concrete contract, record the Azure tenant/subscription, resource group, storage account, container, custodian, producer and verifier identities, RBAC assignments, network/access configuration, locked retention interval, and retrieval-test evidence. Missing resource selection, authority, or observed configuration yields `INCOMPLETE` and refuses promotion.

## Remaining pre-dispatch work

- Select and record the actual protected verifier workflow/code revision and its independent control custodian. The reviewer verifies this boundary; review alone does not provision or protect it.
- Verify the selected GitHub event, permissions, hosted-runner identity, attestation issuance, and trust-root/revocation procedure against the live repository and account.
- Assign final schema version, exact artifact paths, canonical JSON/digest rules, invariant IDs, refusal-class IDs, and stable reason codes in the FK-P18′ contract interface. The ratified size and depth limits above bind those choices.
- Select and configure the Azure resource details above under actual infrastructure authority, then demonstrate independent retrieval and digest validation.
- Have one fresh independent reviewer review the completed contract and close findings before FK-P18′ implementation dispatch.

## Current platform facts to recheck at dispatch

The repository's September 7 provider observations reported that actual workflow protection and artifact retention were not demonstrated, no self-hosted runners were configured, and no existing evidence artifact was available to retrieve. These observations are historical inputs, not proof of present configuration. Recheck live settings before dispatch.

GitHub documents artifact attestations as provenance evidence tied to repository, commit, workflow, and event, while warning that an attestation does not by itself establish artifact security. GitHub-hosted artifact retention for public repositories is capped at 90 days, so it is not the selected long-term evidence store. Azure documents locked time-based Blob immutability as preventing modification and deletion during the retention period; actual account/container policy and access roles still require observation.

References: [GitHub artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations), [GitHub retention settings](https://docs.github.com/en/organizations/managing-organization-settings/configuring-the-retention-period-for-github-actions-artifacts-and-logs-in-your-organization?apiVersion=2022-11-28), [Azure immutable Blob Storage overview](https://learn.microsoft.com/en-us/azure/storage/blobs/immutable-storage-overview).

## Coordinator receipt (2026-09-29)

Recorded verbatim from the owner's directive. Coordinator status of the eight open selection facts: **evidence limits — RESOLVED (ratified)**; **timeout/attempt implementation — RESOLVED (ratified; durable clock + attempt history)**; **verifier execution model — RESOLVED (ratified; pinned workflow SHA, candidate-as-data, isolated jobs, producer status never the decision)**; **retention service — RESOLVED (Azure Blob)**; **retention duration — RESOLVED (400 days, RATIFIED by owner 2026-09-29: "Ratify 400-day duration for storage")**; **retention custodian / resource selection — OPEN (owner/infrastructure act)**; **provider/event + trust roots and workflow-protection evidence — OPEN (live-platform observation at dispatch)**; **schema/paths/invariants/refusal-classes/reason codes — OPEN (FK-P18′ contract interface work; bound by the ratified limits)**; **independent P19 review context — resolved in shape by the Responsibility Boundary above (reviewer separation + custodian disclosure required)**.

---

## PART C — OBSERVED PROVISIONING, PROTECTION, AND PIN STATE (U1-observations-2026-09-30.md)

# U1 observation record — Azure storage account — 2026-09-30

**Role:** the custodian-supplied observed configuration for the U1 concrete contract (`U1-contract-2026-09-29.md`, SHA `8d5f849c…`), per its Responsibility Boundary ("The control custodian/operator supplies observed provider and storage configuration"). Recorded verbatim from the owner's delivery; the coordinator's analysis follows and is not itself observation.

## Observed configuration (verbatim facts)

| Field | Observed value | Fills |
|---|---|---|
| Subscription | `909e0322-c3c0-4bce-ae53-b3d2ed735bd4` | INCOMPLETE-U1-02 |
| Resource group | `biostack-rg` | INCOMPLETE-U1-03 |
| Storage account | `bs2jhgwvduljfdwdp` (Microsoft.Storage/storageAccounts, StorageV2) | INCOMPLETE-U1-04 (account) |
| SKU | `Standard_LRS` (tier Standard) | INCOMPLETE-U1-04 (SKU — OQ-U1-05 partially) |
| Location | `eastus` (primary, available) | — |
| Minimum TLS | `TLS1_2`; HTTPS-only enforced | ✓ satisfies the contract's TLS clause |
| Public blob access | `allowBlobPublicAccess: false` | ✓ |
| Shared key access | `allowSharedKeyAccess: false`; `defaultToOAuthAuthentication: true` | ✓ satisfies "no account keys / long-lived SAS" clause at the account level |
| Encryption | Microsoft-managed keys (`keySource: Microsoft.Storage`), blob+file service encryption enabled | ✓ at-rest |
| Cross-tenant replication | disabled | ✓ |
| Private endpoints | none | ⚠ see network below |
| Network ACLs | `defaultAction: Allow`, no VNet rules, no IP rules, bypass None | ⚠ open network posture — INCOMPLETE-U1-10 (observed, not yet decided) |
| Provisioning | `Succeeded`; created 2026-08-28 | — |

## NOT yet observed / not yet existing (the remaining INCOMPLETE set)

- **INCOMPLETE-U1-01 tenant ID** (not in the delivered payload).
- **INCOMPLETE-U1-05 the evidence container** — does not exist yet (to be created; name + immutability policy are open decisions).
- **INCOMPLETE-U1-06 retention custodian + authority** — unnamed.
- **INCOMPLETE-U1-07 producer identity / INCOMPLETE-U1-08 verifier identity** (must be separate) — unnamed.
- **INCOMPLETE-U1-09 RBAC assignments** — unobserved.
- **INCOMPLETE-U1-11 locked retention interval** — policy not yet set (≥400-day minimum RATIFIED 2026-09-29).
- **INCOMPLETE-U1-12 retrieval-test evidence** — not yet performed.
- **INCOMPLETE-U1-13/14 protected verifier workflow revision + control custodian** — unnamed.
- **INCOMPLETE-U1-15..19 live GitHub rechecks** (event/permissions/runner/attestation/trust-root) — not yet performed.

## Provisioning execution record (2026-09-30, coordinator under owner authorization "I run az CLI now")

| Item | Result | Fills |
|---|---|---|
| Tenant ID | `ac08e2fd-34bf-4c87-a34f-c8c853ffc5e2` | INCOMPLETE-U1-01 ✓ |
| Custodian identity | `morganclint76@gmail.com` / object-id `461a4112-8e91-41cb-afef-6889b8f48ff0` (owner) | INCOMPLETE-U1-06 ✓ |
| Evidence container | `u1-evidence` created (private; blob public access off at account) | INCOMPLETE-U1-05 ✓ |
| Immutability policy | `…/containers/u1-evidence/immutabilityPolicies/default` — **400 days, state Unlocked** (owner ruling: unlock → lock after test) | INCOMPLETE-U1-11 (interval set; LOCK flip pending) |
| RBAC | `Storage Blob Data Contributor` granted to the custodian identity at the account scope (created 2026-09-30T10:18:11Z; ~45s data-plane propagation observed) | INCOMPLETE-U1-09 (partial — producer/verifier identities remain) |
| **Retrieval test** | object `retrieval-test/2026-09-30/coordinator-readback.txt` uploaded + downloaded over OAuth (no shared keys); SHA-256 **identical both sides**: `802d413ae32f2905a56388e178b59c642f7e61f5cd7f30be5cfbef605c9aa530` | INCOMPLETE-U1-12 ✓ (initial custodian-identity evidence) |

Operational notes: `az` on this host is the Windows.cmd wrapper (long arg lists need PowerShell or no `--assignee-type`); role-assignment by email fails Graph resolution — use `--assignee-object-id`; data-plane RBAC takes ~45s to propagate after creation.

## Identity provisioning record (2026-09-30, owner ruling "Provision both now"; separate identities per the contract's producer≠verifier clause)

| Identity | IDs | Federated credential | RBAC (container `u1-evidence` scope) |
|---|---|---|---|
| **Verifier** `u1-verifier-mi` | clientId `ec2d02e3-904c-4ce2-9771-cd518d711e3f`; principalId `9f31b12b-520d-4352-aa71-6b9208a662c4` | `u1-verifier-fc` — issuer `https://token.actions.githubusercontent.com`, subject `repo:m0r6aN/agent-skills:environment:u1-verifier`, audience `api://AzureADTokenExchange` | **Storage Blob Data Reader** (created 2026-09-30T10:37:43Z) |
| **Producer** `u1-producer-mi` | clientId `dc152b9d-c74e-4af1-aeeb-c23b95c68ab2`; principalId `f15d13b7-5d76-4b41-9804-f07802b6b3c0` | `u1-producer-fc` — same issuer, subject `repo:m0r6aN/agent-skills:environment:u1-producer`, same audience | **Storage Blob Data Contributor** (created 2026-09-30T10:37:47Z) — its delete/write-shorten attempts are physically blocked by the immutability policy while it exists |

Design notes: environment-scoped OIDC subjects mean the FK-P18′/verifier workflows MUST run from GitHub environments named `u1-producer` / `u1-verifier` (the workflow drafts bind to them); the verifier's read-only role + the independent read-back/SHA-256 ACCEPT procedure are the contract's separation of powers; producer data-contributor breadth is bounded by immutability (delete of committed evidence fails), with a create-only custom role noted as optional hardening.

**Lock flip (owner ruling "Lock after first real evidence"):** the container's immutability policy stays `Unlocked` until the verifier pipeline writes and independently reads back its FIRST real evidence bundle; then the coordinator flips `state: locked` (one-way) and records the policy etag.

## Verifier decision-write role (2026-09-30, ruling OQ-6.2: stored decision authorship = the verifier identity itself)

The contract's "a producer-authored status is never accepted as the verification decision" makes the stored decision's authorship load-bearing — producer-transported bytes are still producer-written. Provisioned a **create-only custom role** at the `u1-evidence` container scope:

- **`u1-verifier-evidence-creator`** (roleDefId `c2e8b1ab-cef8-4a4f-ae44-37cc74aaccdd`; renamed in place from `U1 Verifier Decision Writer` to match the workflow design's spec — same GUID, so the assignment carries over): DataActions `blobs/read` + `blobs/add/action` (create new / append), NotDataActions `blobs/write` + `blobs/delete` + `blobs/permanentDelete/action`. Assigned to `u1-verifier-mi` (principalId `9f31b12b-…`, created 2026-09-30T11:32:45Z).
- Semantics (verified against Azure provider-operations/ABAC references): `add/action` creates new blobs; excluding `blobs/write` prevents overwriting any existing blob; WORM time-based retention is the write-once backstop for everything committed. The verifier identity can therefore create decision/observation objects and never modify or delete evidence.
- Lane summary: verifier = read-all + create-decisions-only; producer = create/write new evidence (delete attempts physically fail under retention); custodian = administers controls.

## GitHub protection evidence (2026-09-30, owner-authorized gh/API acts — design §6.1–6.3)

| Control | Configured | Evidence |
|---|---|---|
| Ruleset `agent-skills-default` (branch, `~DEFAULT_BRANCH`, active) | `pull_request` required (PR flow for all changes to `main`), `dismiss_stale_reviews_on_push=true`; `deletion` + `non_fast_forward` blocked; owner's pre-existing `code_scanning`/`code_quality`/`copilot_code_review` rules preserved; bypass = `m0r6aN` only (sole bypass actor, `always`) | ruleset id 24257508, PUT 2026-09-30. **Deviation from design §6.2 row 1 (owner-reported, 2026-09-30):** `required_approving_review_count=0`, `require_code_owner_review=false`, `require_extra_approval_for_unattributed_changes=false` — GitHub never lets PR authors approve their own PRs, and a one-person repository has no second write-access reviewer, so the ≥1-approval gate was structurally unsatisfiable and blocked every PR (the unattributed-extra-approval flag compounded it for tooling pushes). Restore the approval fields when a second write-access identity exists (e.g., the FK-P18′ builder identity under contract §3.2.1 separation). |
| Ruleset `u1-verifier-pin` (tag, `refs/tags/u1-verifier-pin`, active) | `update` + `deletion` restricted; bypass = `m0r6aN` only | ruleset id 24258920, created 2026-09-30 |
| Environment `u1-verifier` (attended) | RequiredReviewers = `m0r6aN` (protection_rules confirmed via GET); `prevent_self_review=false` (solo-operator necessity — the owner dispatches and approves); deployment refs = `main` + `u1-verifier-pin` (custom policies 61546414/61546415); no secrets | environment GET/PUT 2026-09-30 |
| Environment `u1-producer` (unattended) | no reviewers, `protected_branches` deployment policy (protected refs only); no secrets | environment PUT 2026-09-30 |
| CODEOWNERS | `.github/CODEOWNERS` covers both U1 workflows + `U1-verifier-pin.json` + `promotion-requests/` → `@m0r6aN` (design §6.3 verbatim). Path-scoped *enforcement* requires `require_code_owner_review` (currently off per the solo-repo deviation above) — until then CODEOWNERS is the ownership annotation, and the ruleset's tag/branch restrictions + the pin byte-checks carry the enforcement | committed 2026-09-30 |

Operational notes: the repo rulesets API `update` rule is parameterless (allow-list = ruleset bypass actors, not rule params); `reviewers` on environments appear under `protection_rules` in GET responses; the design §6.2's "path-scoped ruleset" is enforced as CODEOWNERS + required code-owner review (GitHub rulesets target refs, not paths). Still owner-pending: `U1-verifier-pin.json` pin record + pointing the `u1-verifier-pin` tag at the pinned commit (both AFTER the workflows are placed and their commit SHA exists).

| Ruleset `main-pr-gate` (branch, `~DEFAULT_BRANCH`, active) | pre-existing ruleset requiring status checks `test` + `integration-report` (`strict_required_status_checks_policy`), pre-existing `pull_request` rule (count 0, thread resolution) — **bypass was EMPTY**, so every merge was blocked while those checks are red | id 22369510, PUT 2026-09-30: added sole bypass actor `m0r6aN` (`always`) per the solo-repo deviation ruling; rules unchanged. Context: `test` = the foreman-line 20-package matrix, red on `main` since 2026-09-28 (pre-existing baseline: 12/20 packages fail Test/Typecheck, e.g. TS2353 `projectKey` type drift); `integration-report` mirrors `test`'s outcome. Required checks gate again for any non-bypass actor once the baseline is green. |

## Package-matrix repair (2026-09-30, owner-directed fix order; PR #123 branch `u1-workflow-placement`, commit `6793317`)

The `test` job's 498 failures decomposed into five root causes (owner's triage named three; two more surfaced in execution):

| # | Root cause | Fix | Verified |
|---|---|---|---|
| 1 | D19 audit refuses extension-less `Dockerfile` (`jev-decisions/container/Dockerfile`) | `BUILD_DEFINITION_BASENAMES` registered in `verification/src/d19-audit.ts` (ports the JEV-P3 fix from the goal tree) | audit suites unblocked |
| 2 | `routing-policy` contract surface missing (6 exports + 2 shape extensions: `transport_requirements`, `shadow_routes`) | types/schemas restored to the shape its own fixtures, validator, and testing samples demand; schema artifacts regenerated | **940/940 tests + clean typecheck locally** |
| 3 | `pluginRoot` missing from input bags | added to `HarnessInput`, `ReviewDispatchInput`, `DispatchOptions`, + discovered `RoutingOptions`; `evaluateRouting` resolves the policy from the explicit plugin root and carries `transportRequirements` into result + receipt | dispatch typecheck clean |
| 4 | Stale barrels (owner's "stale barrel exports" class, larger than reported): `routing-policy` missing17 re-exports (pmc-launch/catalog/observation consumers), `dispatch` missing the shadow-routing surface | barrels restored; `executeShadowRoute` identity-stable across all three import paths (test asserts identity) | typecheck clean |
| 5 | `dispatch` imports `@earendil-works/pi-ai`/`pi-coding-agent` undeclared (type-only) | pinned `0.99.2` in devDependencies — outside the runtime dependency allowlist (`dependency-allowlist.test.ts` governs `dependencies` only) | module resolution clean |

**Environment note (evidence-bound):** the `pmc-*` suites pin `process.version === 'v24.19.0'` (`intent-custody.ts` `SETTINGS_REFUSED`) and CI pins `node-version: 24.19.0` exactly — the local v24.7.0 workstation cannot exercise them; CI's matrix is the authoritative verification for those suites. Local verification: routing-policy suite green, all touched packages typecheck clean, schema parity artifacts regenerated via `generate.ts`.

**Toolchain split (recorded 2026-09-30, deferred owner decision):** the 27 on-disk packages carry two devDependency camps — 15 at `@biomejs/biome 2.5.3` / `@types/node 26.1.1` / `tsx 4.23.1` / `typescript 7.0.2`, 11 at `2.5.14` / `26.6.2` / `4.23.15` / `7.0.2`, `jev-decisions` none. A `SHARED_DEV_DEPENDENCIES` golden pinning the Camp-B values entered via recovery-merge `6843cb4` and never matched its own target pair (verification+dispatch, both Camp A since introduction); the golden was corrected to the pair's Camp-A values with a citing comment (test = sibling agreement of that pair only). **Unifying the camps is a separate toolchain decision (Option B: bump the 15 Camp-A packages vs downgrade the 11)** — reserved for the owner; not this campaign's scope.

**CLOSURE (2026-09-30/10-01): package matrix GREEN.** CI run `36812944266` on `u1-workflow-placement@db3c463` = `test` + `integration-report` SUCCESS — all 20 packages pass Install/Test/Typecheck/Lint on the CI toolchain (Node 24.19.0). Campaign shape: five parallel repair waves + one ratification wave (roots: stale barrels, tests-ahead-of-src parameterization + root-discipline, merge-regression path shapes, undeclared type deps, stale goldens/adjudication lists, D19 ruling/pin reconciliation of 93 instances, 6-package STANDING-#34 ratification). Three parcel-time git-diff freezes retired under the established A6/STANDING-CONSTRAINTS-#12 precedent (projection AC3, shaping AC8, verification AC-1) — each with the citing comment; every substantive pin kept. Remaining for the U1 lane: owner merges PR #123 → `U1-verifier-pin.json` + `u1-verifier-pin` tag → §8 independent review → FK-P18′ dispatchable → lock flip on first real evidence.

## U1 pin procedure COMPLETE (2026-10-01, design §6.4 steps 1-2; PR #123 merged as `be3e3de3dfcf6159d4ffb265aa39847aac5f0814`)

- `U1-verifier-pin.json` committed to `main` (`75d718b`, custodian push): `workflowCommit = be3e3de3dfcf6159d4ffb265aa39847aac5f0814`, `workflowFileSha256 = sha256:b7952e1e52f0144e7632fc73d8d04e9564184dfcf4c5af978c71592514cc4bbe` (u1-verify.yml bytes at that commit).
- Protected tag `refs/tags/u1-verifier-pin` → `be3e3de3…` (pushed; tag ruleset 24258920 restricts its update/deletion to the custodian).
- End-to-end verified: the workflow's own read path (`raw.githubusercontent.com/.../main/plugins/foreman-line/docs/goals/foreman-kernel/U1-verifier-pin.json`) serves both fields exactly as the in-run pin check consumes them (`sha256:`-prefixed digest comparison); `git ls-remote` confirms the tag. In-run enforcement (manual path: ref+SHA+byte-digest; event-driven: byte-equality + ruleset) is live for all future runs. **Remaining: §8 independent review (owner commissions) → FK-P18′ dispatchable → immutability lock flip on first real evidence.**

## Workflow placement (2026-09-30, owner direction "proceed")

- Extracted **byte-exact** from the design's fenced blocks (design sha `0d8816eb…`): `u1-produce.yml` = doc lines 160–584 (425 lines), `u1-verify.yml` = doc lines 604–1489 (886 lines) — fence content untouched by the §6.6 prose edit; YAML parse PASS both files.
- Placed in an isolated worktree off `origin/main` (`D:/Repos/agent-skills-worktrees/u1-workflow-placement`, branch `u1-workflow-placement`, base `e5dce4d`) alongside `.github/CODEOWNERS` — the ambient `dev` checkout's user-owned dirty state untouched.
- **PR #123** (`m0r6aN/agent-skills`, `u1-workflow-placement` → `main`) opened 2026-09-30 — first live exercise of the new ruleset gate. Owner merge is the remaining mechanical step; then the §6.4 pin procedure (pin record + `u1-verifier-pin` tag at the merge SHA).

## Coordinator posture notes (analysis, not observation)

- The account already satisfies three of the contract's hard clauses: TLS1.2+, no shared-key/SAS root of trust (OAuth/Entra only), no anonymous blob access. The Azure side's integrity story is good at the account level.
- The open network posture (`defaultAction: Allow`) is workable for GitHub-hosted runner egress but is the weakest observed row — tightening options are a decision (see the coordinator's questions to the owner).
- `Standard_LRS` durability = 3 replicas within one region. The contract's integrity control is the immutability policy + independent read-back; redundancy is a disaster-tolerance choice (OQ-U1-05).
- The immutability policy's `state` (unlocked → extendable only, vs locked → irreversible even by support) is a significant, irreversible-if-locked decision — surfaced to the owner before provisioning.

---

## PART D — THE VERIFIER PIN RECORD (U1-verifier-pin.json, on main at 75d718b)

```json
{
  "schema": "u1-verifier-pin/v1",
  "workflow": ".github/workflows/u1-verify.yml",
  "workflowCommit": "be3e3de3dfcf6159d4ffb265aa39847aac5f0814",
  "workflowFileSha256": "sha256:b7952e1e52f0144e7632fc73d8d04e9564184dfcf4c5af978c71592514cc4bbe",
  "tag": "refs/tags/u1-verifier-pin",
  "producerWorkflow": ".github/workflows/u1-produce.yml",
  "custodian": {
    "login": "m0r6aN",
    "objectId": "461a4112-8e91-41cb-afef-6889b8f48ff0"
  },
  "recordedAt": "2026-10-01T00:00:00Z",
  "note": "workflowCommit is the protected verifier revision's full commit SHA (contract 3.1.1 - identity is the commit, never a branch/tag name); workflowFileSha256 pins the u1-verify.yml bytes at that commit. In-run enforcement: manual path checks run-ref == refs/tags/u1-verifier-pin, run-SHA == workflowCommit, and running-workflow bytes == workflowFileSha256; the event-driven path binds by workflow-file byte equality plus the ruleset. Any pin change is a contract amendment (standing #34) recorded in the review trail."
}

```

---

END OF DOSSIER. Return only the JSON verdict.
