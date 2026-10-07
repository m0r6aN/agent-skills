# U1-8 closure round 3 — errata A-U1.8.39 (implementation-found corrections) — 2026-10-04

**Instrument:** amendment **A-U1.8.39**, correcting and completing A-U1.8.28 … A-U1.8.38 of
`U1-8-closure3-amendments-2026-10-03.md` (ratified 2026-10-03). Source: the round-3 builder's
Step 0 restatement (flags F1-F15), triaged by the coordinator against the shipped bytes at
`ed848ba`; no clause below was invented by the builder.
**Status:** **RATIFIED 2026-10-04** by the owner, answering the coordinator's five-question batch:
conformance = "Approve all four as drafted"; harness = "(a)+(b): derive from raw observed
signals, amend text, name the limit"; github-run = "Approve (i)+(ii)+(iii)"; container =
"Approve as proposed"; extras = "Remove enrichment, refuse un-enriched feeds; implement the 4
extras".
**Write boundary:** this document only. Where a clause here and a clause of A-U1.8.28 … .38
disagree, this document wins; every clause not named here is unchanged.
**Pin consequence (standing #34):** E-2 and E-3 add `sandboxHarness` and
`producerWorkflowFileSha256` to the IA-2.11 trust-policy projection, which moves
`trustPolicyDigest` for every request. They land in the single A-U1.8.38 re-pin; no pin record is
edited in Phase A.

---

## E-1 — conformance with shipped bytes (F4, F5, F7, F9)

1. **A-U1.8.28 cl.1 field grammar, replaced** (the shipped requests use names and an integer
   attempt; the original `^[0-9]{1,20}$` for all five fields refuses every shipped request):
   - `selectedExecution.runId`: `^[0-9]{1,20}$` (decimal string, no sign, no whitespace);
   - `.attempt`: JSON integer, `1 <= n <= 2^53-1` (SafeInt); booleans, floats and strings refused;
   - `.repositoryId`: `<owner>/<repo>` with `owner` `[A-Za-z0-9-]{1,39}` and `repo`
     `[A-Za-z0-9._-]{1,100}`; `.workflowId` and `.jobId`: `[A-Za-z0-9._-]{1,100}`;
   - `.provider`: closed literal `github-actions`; `.event`: closed literal `workflow_dispatch`
     (A-U1.8.32 additionally binds the event to the API-reported run event);
   - digests `^sha256:[0-9a-f]{64}$`, commits `^[0-9a-f]{40}$` (unchanged). Python patterns use
     `fullmatch`/`\Z`, never a trailing `$` (a trailing `$` admits a final `\n`). Every other
     clause of A-U1.8.28 is unchanged.
2. **A-U1.8.29 `permittedGaps[]` — the three exact triples `{id, caseId, obligation}`:**

   | id | caseId | obligation (exact) |
   |---|---|---|
   | `file-symlink-privilege-case` | `BYP-LK-01` | `FK-P18′ lane: file-symlink privilege evidence obligation (V4)` (verbatim from `bypass-outage-harness/src/channels/bypass.ts:586`) |
   | `ctrl-01` | `CTRL-01` | `FK-P18′ lane: CTRL-01 real non-WAL filesystem refusal evidence obligation` |
   | `outage-ts-realpath-sweep` | `OUTAGE-REALPATH-SWEEP` | `FK-P18′ lane: outage.ts realpath sweep evidence obligation` |

   Rows 2 and 3 are **authored here by the coordinator** because no shipped surface defines their
   gap wording (the FK-P17 harness emits only the first; the outage sweep is a `known-gap` state,
   not a case row). They bind forward: FK-P18′'s producer MUST emit exactly these strings, and
   any other gap or `not-exercised` row is `INVALID`/`U1_ARTIFACT_INVALID` (A-U1.8.29), so a
   wording mismatch fails closed. The oracle's superseded `{gapId, caseIds[], reasonPrefix,
   obligationContains, description}` shape is replaced; substring matching is removed.
3. **A-U1.8.30 `docDigest`:** `byteDigest` is mandatory on every inventory entry; `docDigest` is
   mandatory exactly when the entry carries a `docDomain`, and then must match its IA-2 domain
   digest. An entry with neither digest is `unbound` (a failure). Duplicate `relativePath` is
   refused.
4. **Request records (F9):** `permittedGaps` changes `oracleDigest`/`requestDigest`; `reobservedBy`
   changes the checklist self-digest, the byte digest `configurationChecklistSha256` and every
   request's `configurationChecklistDigest`. Phase A edits only the six `-r3` request directories
   (`u1-fixture-positive-r3` and the five `u1-fixture-neg-*-r3`) and adds
   `u1-fixture-neg-runid-newline`; `-r1`/`-r2` directories stay historical and unedited. Any new or
   edited request carries a **provisional** `trustPolicyDigest`, regenerated in Phase B.

## E-2 — A-U1.8.31 harness semantics (F1, F2, F3; owner chose (a)+(b))

1. **Clause 3 replaced:** the verifier-owned harness (read from pin commit `R`, A-U1.8.31 cl.1)
   re-derives each NC-U1 control row and each required-invariant row **from the row's raw
   `observed` signals under verifier-owned classification rules** — it never reads
   `exitStatus`, `observedResult` or a status from the committed row as an answer. Controls
   NC-U1-05 … NC-U1-13 are properties of the verifier infrastructure (replay, forged ACCEPT,
   retention expiry, …) and are **not re-executed** by the sandbox; they are reported as
   `derived-from-signals`. A harness-reported `not-exercised` row is governed by A-U1.8.29.
2. **Named limitation (contract §9.2, appended; same standing as A-U1.8.34 cl.2):** "A fixture
   ACCEPT rests on signals supplied by the candidate, classified by verifier-owned rules. It is a
   derivation, not an independent observation or re-execution, and attests nothing about NC-U1-05
   … NC-U1-13 beyond signal consistency." The text lands with the Phase B contract transcription.
3. **Clause 4 (collector), confirmed reading:** only the sandbox job can upload its raw output.
   The sandbox job uploads under a name chosen by a trusted job; a **collector job** (no
   credentials, no environment, never executes candidate code) downloads it, digest-binds every
   file, and re-uploads under a **collector-generated** name; evaluate downloads the collector
   artifact and re-verifies the digests. The sandbox job's own conclusion is checked.
4. **IA-2.11:** `sandboxHarness` `{path, byteDigest}` enters the trust-policy projection (see the
   pin consequence above).

## E-3 — A-U1.8.32 github-run lane (F6)

1. **Clause 2, workflow-bytes check replaced:** the producer workflow bytes at `run.head_sha`
   equal the bytes of `producerWorkflow` at the pin commit `R`. The pin record gains
   `producerWorkflowFileSha256`, included in the IA-2.11 projection with `sandboxHarness`. (The
   original comparison — "default-branch copy at the subject commit" — is vacuous because
   `run.head_sha` equals the subject commit.) All other binding checks of clause 2 are unchanged.
2. **Clause 1 realized as:** one artifact per producer run containing one member per source file;
   the cited `artifactByteDigest` is the digest of that member's unmodified bytes, which is what
   the verifier hashes (u1-verify.yml@ed848ba L1614-1618). Re-canonicalized copies are never
   cited.
3. **Clause 5 generator:** a producer step, **active only when `container-class = fixture`**
   (E-4), generates feed rows at run time into an untracked directory, so they classify as
   `github-run`. The generator is inline in the workflow; it emits no production evidence.
   Because `run.head_branch` must equal the default branch (clause 2), the exercise runs on merged
   bytes — Phase B.

## E-4 — A-U1.8.35 cl.2/3 container binding (F11, F10)

1. The producer gains a closed input `container-class` ∈ `{evidence, fixture}`. The verifier
   derives **one shared `CONTAINER`** from the dispatch input request id, never from request
   content, used by the ledger, probes, persist, immutability read, retention observation, close
   and seal: prefix `u1-fixture-` → `u1-fixture`; prefix `u1-control-` → `u1-evidence`; any other
   id → `u1-evidence`. In the `workflow_run` lane the request content id must equal its directory
   name.
2. **New closed prefix `u1-control-`:** maps to `u1-evidence`, seals carry `consumable: false`
   (set from the id prefix by the workflow, A-U1.8.33 cl.3), and the pinned harness accepts it as
   a control request. It realizes the A-U1.8.27/A-U1.8.38 "production-container INCOMPLETE
   control", which was irreproducible as written (a non-`u1-fixture-` id was refused by the
   harness). Its oracle pins the expected reason-code **set** actually observed; "exactly
   `[U1_CONFIGURATION_INCOMPLETE]`" is not required of it.
3. **No fixture exemption:** the checklist gate is unchanged. A fixture ACCEPT requires all 19
   checklist rows recorded; nine are `unrecorded` at `ed848ba` (U1-04, 09, 10, 11, 14, 15, 16, 17,
   19 — live facts), so the A-U1.8.35 cl.3 fixture ACCEPT is a **Phase B blocker** independent of
   the held `u1-fixture` provisioning. The builder confirmed the base workflow reaches ACCEPT
   locally under shims once all 19 rows are recorded and the policy is Locked.

## E-5 — A-U1.8.37 cl.2 additions (F14, F12)

1. Producer enrichment (`enrich_row`/ANCHORS) is removed; the producer **refuses** any feed row
   lacking `invariantIds`, `observedResult` or `exitStatus`, with a named error. Consequence: only
   the fixture evidence directory works until FK-P18′ supplies an enriched real feed (outside
   this build).
2. Four additional hardening items, now in scope: (a) persist verifies every persisted object
   against `decision.artifactInventory` (H-7(e)), not only `decision.json`; (b) close-attempt
   writes non-empty dispatch digests (never null); (c) attempt/package numbering handles ≥100
   (the `a%02d`/`p%02d` sort becomes numeric); (d) an exhausted second run fails with a named
   outcome, not a traceback.

## E-6 — builder rulings carried as binding implementation defaults (F13, F12 housekeeping)

Recorded so the closure reviewer sees them: `consumable` is always present (`false` for
`u1-fixture-`/`u1-control-` ids, otherwise `true`, meaning only "not prefix-excluded");
`unproven` ranks below `mismatch`/`unreadable`; a non-zero `az` exit writes the observation and
seal, then fails the step; K=0 on an authoritative run is `INVALID`/`U1_SUBJECT_MISMATCH`; the
L1282 self-digest mismatch stays `U1_ARTIFACT_INVALID` and only the request-binding mismatch
becomes `U1_SUBJECT_MISMATCH`; `committedPath` is allowlist-style (`[A-Za-z0-9._-]` segments,
no `.`/`..`); expected `oidcClaims` are the verifier `sub` environment + tag `ref`, the reader
`sub` tag ref, the producer `sub` environment `u1-producer` with `ref` from the selected run's
`head_branch`; `imageOS` equality and `imageVersion` grammar only; `ref_name.exclude` uses a
linear-time glob matcher with `~ALL`; `u1-lint` `push` filter stays the literal `main`.
**Evaluate-step shell:** actionlint 1.7.12 deadlocks on `run:` scripts over ~64 KiB when
shellcheck/pyflakes are enabled; the evaluate step therefore uses `shell: python3 {0}`, and
`u1-lint`'s embedded-python compile + pyflakes check is extended to cover that form (a mutation
that removes the step from the check must fail the lint). Any new bash-heredoc step stays under
64 KiB.
