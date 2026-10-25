# Canonical admission and Plane A/B writers — accepted October24 NY

[Cortex PR102](https://github.com/Keon-Systems/keon-cortex/pull/102) source `c8560b5bedd334f5c9296c9ab90b7c6b32dffe6c` merged as `43323f535df458543c0161ca501f8f974650008e`.
All16 exact-head checks and exact merged-main [CI](https://github.com/Keon-Systems/keon-cortex/actions/runs/40145847139) and
[deployment workflow](https://github.com/Keon-Systems/keon-cortex/actions/runs/40145847180) pass. All6 reviewed/staged/committed/
merged file hashes agree;452prior entries retained,458total. Workorder archived
with status-only change. Existing accepted source and identities remain unchanged.

An internal trusted-carriage service integrates authoritative P3A staging with
the existing canonical shard/spine stores and frozen Plane-A graph tables. One
owned transaction checks payload identities, caller binding and current lease,
writes own-role-private unverified candidates, nodes, typed backing, DOCUMENTS
edges and matching Observations, then acknowledges the outbox. Duplicate imports
preserve first canonical metadata/time/provenance, edge wire identity and event;
pending extraction remains durable across pool restart. No labels grant trust.
Canonical persistence is not authenticated producer or execution-receipt admission.

The five frozen table bodies token-match the accepted contract except explicit
IF NOT EXISTS and edge valid_from_wire. Deferred authoritative backing checks
recompute scoped shard IDs and reject receipt proofs; immutable history, finite
interval containment, replacement and endpoint-closure rules are enforced.
FORCE RLS is tested using a non-superuser/non-bypass table owner, with integrity
functions retaining bootstrap ownership/fixed paths. Four read-scope classes
remain supported; new service mutations are own-role-private only.

Privacy: strict original1MiB envelope guard precedes transformations. Structured
keys/values remain decoded through scrubbing. Exact marker continuity uses a
collision-checked in-memory namespace, never grants trust and rejects literal
known-secret overlap across marker boundaries. Source format cannot change during
canonical scrubbing. Oversized node metadata is withheld from the client. Loaded
malformed state returns nondisclosing unavailable; cancellation/SQL faults roll
back canonical, graph, event and queue effects. No keys/raw source digests persist.

Validation: **61focused PASS;4023full PASS/208skip**; all3954prior passes/151skips,
all4022pre-final-control passes/207skips and all452baseline files retained.
**65actual PostgreSQL16/guard cases PASS**;57newDBcases skip without DSN and are
executed separately on the synthetic isolated host. Tests cover duplicate first
write/restart, conflicting and matching Observations, registered identity and
receipt substitutions, metadata transfer withholding, nested malformed state,
rollback/cancellation, generation/expiry/fences, marker privacy and SQL parameters,
both direct edge/endpoint closure race orders, finite replacement and cycle/reopen/
retarget rejection. Black/isort/mypy and independent identity/scrub oracle pass.
All execution containers/networks are absent; no production account was exercised.

Independent full-production architecture/security review chains found five
distinct material defects, then one format-control defect. Nine verified old DB
regression failures and the original-envelope unit failure reproduce the first
round; the old format test actually fails to raise after fixture correction.
Earlier invalid-root and import/column/literal fixture errors remain recorded
separately and are not counted as source reproductions. Source fixes pass all
regressions. Two fresh independent source supplements review the complete changed
admission module, exact delta, complete unit module and new DB regression. Writer,
schema and docs are byte-identical to the preceding full reviews. Both supplements
PASS; this is an explicit review chain, not a claim that prior CHANGES verdicts
were overwritten or that focused supplements were new full-runtime reviews.
Same-model-family limitation and per-seat omissions remain disclosed. Reviewers'
pending AC20 evidence findings are now closed by the exacthead/merge/main chain.

Financial phase closed: **933.9known reported credits;
2420.896125conservative booking/2600**. All old and failed-call
reservations remain held; two SSL outcomes remain unknown. One deterministic
pre-send size rejection made zero inference POSTs; its unchanged reservation
covers the checked submission once. 22transport attempts,
20HTTP responses, no automatic retry/fallback. Balances are not
exclusive billing attribution. Unused phase capacity closed, not new spend authority.

This completes P3B, not full P3 or bulk readiness. No HTTP/Gateway activation,
authenticated high-trust producer, receipt/role-generation backing, production DB
installation/qualification or real-corpus import is claimed. Global graph locks/
scans are conservative integrity mechanisms requiring load qualification. Remaining
P3 governed shred/retract and minimal descendant invalidation must cover existing
candidate copies plus canonical shards/provenance, artifact metadata, registries,
edges and spine references. Independent external key-destruction qualification
remains open. Later P4-P8 and privacy/backup/recovery/import gates remain binding.
