# Durable ingestion candidate storage — accepted October24

[Cortex PR101](https://github.com/Keon-Systems/keon-cortex/pull/101) source `b6a4ebaffa1ef3224dbce82ffedd69efb2d369a9` merged as `fd0f478cc3d21d7ef4eb9f518f61487b010e296e`.
All16 exact-head checks and exact merged-main [CI](https://github.com/Keon-Systems/keon-cortex/actions/runs/40139486349) and
[deployment workflow](https://github.com/Keon-Systems/keon-cortex/actions/runs/40139486284) pass. Five reviewed/staged/committed/
merged files agree,447prior entries retained,452total. Workorder status-only done.

An internal callable service prepares accepted extractor DTOs using the accepted
scrubber BEFORE pool acquisition, then transactionally commits PostgreSQL batch,
source-candidate and outbox records. All source outcomes persist, including
pending extraction. Closing/reopening the pool preserves pending work; outbox
completion publishes locally without falsely completing extraction. Tenant/scope
IDs and sanitized source identities remain distinct; capacity includes retained
batches, and generation/owner/expiry fences reject stale workers. A minimal batch
fence stops replay/publication/visibility without deleting retained payloads.

Privacy: Python/civic JSON remains decoded through whole-envelope scrubbing and
is encoded afterward. Metadata keys/values, source/artifact text and pending
material are scrubbed; routing/control changes fail closed. Raw engine digest
fields are validation-only. Opaque text uses the accepted literal/catalog scrub
profile; no universal encoding-decoder guarantee. No HMAC key is persisted.

Validation: **46focused PASS;3954full PASS/151skip**, all3905prior passes/137skips
and all3948pre-review passes/145skips retained.14DBcases skip without a DSN;
**17actual PostgreSQL16/guard cases PASS** separately (14DB+3pre-acquisition).
Actual tests cover true pool close/reopen, insert/publication rollback, concurrent
count/byte capacity, locked final-expiry SKIPLOCKED, stale/expired/final-dead leases,
scope isolation and controlled publication/fence orderings. Black/isort/mypy and
independent scrub/pending/hash oracle PASS. Synthetic containers/network absent.

Initial independent reviews found blocking cleanup and reversible JSON secret
leakage plus missing transaction/interleaving assertions. Actual reproductions
and original failed tests remain preserved. One source/test repair exposed a
double-scrub representation issue and a non-NFC fixture assumption; one separately
admitted narrow correction fixed those. Fresh architecture/security PASS/PASS,
no remaining material findings. Same-model-family limitation remains. Coverage
gaps include no cancellation-after-write injection and no controlled initially-open
fence-first enqueue interleaving; source review accepted the transaction structure
and existing cancellation/post-fence tests without claiming those cases ran.

Original source CI found a Python3.10 test-only cancellation object-identity
assumption across asyncio.run's task boundary. Parent moved the unchanged identity
assertion INSIDE the awaited service coroutine. All4otherfiles/production remain
byte-identical to the full final reviews and actualPG run. Two additional fresh
independent focused architecture/security delta reviews PASS; this supplements,
and does not claim to replace/repeat, those full reviews. Local full suite passed
again on the final test bytes; new exact-head matrix is green. Original CI failures
and earlier head remain preserved. ActualPG tests were not redundantly rerun;
their code and every production dependency remained exact reviewed bytes.

Parent mechanical work: frozen docs, test-only valid HMAC fixture and original
pool close/reopen correction, import-order-equivalent formatting, one test append
tail disambiguation. Model proposals:4source slices,2bounded repairs,4reviews,
1Step0 plus2focused compatibility reviews;13POSTs, no transport retry/fallback.
The separately admitted120-credit compatibility envelope remained within the
original700 parcel cap. Initial PostgreSQL temporary socket
readiness race was diagnosed and harness fixed to final TCP readiness, with no
production change. All initial evidence and alternate-source normalization retained.

Financial phase closed: **443.3reported credits;
449.695125conservative booking /700**. All old reservations and all
affected/native/private-Pi routes HELD. Unused phase capacity closed, not new call
authority. Clean pushed source branch retained; no monitor/worker.

This completes P3A, not full P3. Service is unwired to live HTTP/application;
candidate tables are not canonical ShardRecord admission or finished PlaneA/B
writers. Remaining P3 governed shred/retract, minimal descendant invalidation,
canonical writer/admission and independently qualified external key destruction
remain open. Later P4-P8 retrieval/graph/lifecycle/inheritance/connectors and
targetDB/privacy/backup/capacity/recovery/import gates remain. No real corpus or
authenticated high-trust producer, no full Context/bulk-import readiness.

New copy inventory for subsequent deletion work: ccm_ingest_batches.payload and
ccm_ingest_sources.payload hold scrubbed candidate copies; ccm_ingest_outbox
contains identity/hash/count/lease metadata only. Fencing hides/blocks these via
this service but does not delete copies, clear external reads, or prove erasure.
