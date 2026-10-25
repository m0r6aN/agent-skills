# P3C2 accepted — independent deletion authorization and scoped copy tracking

[PR104](https://github.com/Keon-Systems/keon-cortex/pull/104) source `a8ab5bb35975c735c49b0dde92352b58db447fe7`, merge `a96cc851aad6f98b8dc4695ddd0e7c4c15e18175`. All 16 exact-head
checks and exact merged-main CI/deployment passed on their first attempts,
including Python3.10/3.11/3.12. Seven reviewed/staged/committed/merged hashes
match; 461 prior entries retained except two exact Allowed Files,466total.
100 focused cases; 5,187 full passes and 248 skips, all initial 5,398 case identities
and accepted dispositions retained. 165 actual isolated PostgreSQL16 cases pass,
including all 65 accepted canonical cases. Black/isort/mypy,3.10 grammar and the
independent source-position oracle pass. Optional local 3.10 host lacked pytest;
that host is unsuccessful, not a source failure or runtime qualification.

Governed authorization checks a detached Ed25519 decision against exact subject,
scope, target, effect, version, fence, idempotency and current independent
decision/key/operator rows. Decision→key→operator share locks remain until the
owning transaction ends. Entry/normal-exit sampling is not arbitrary later-commit
expiry assurance. Empty default issuer admission; internal contract is new and
does not claim compatibility with Runtime. Trusted provisioning/deployment and
production issuer/mirroring adapters remain unqualified.

OSS tracking preserves every staged source/artifact occurrence and actual
canonical shard/node/edge association despite first-wins deduplication. Scoped
immutable membership and explicit batch markers commit before current-lease ACK
in the same transaction. Zero-item, pending-only and unsupported markers are
tested. Pending stays pending; old batches without markers are unreconciled,
not inferred empty or complete. Structural association is not independent
content proof and introduces no global inventory reader/backfill.

Both initial reviews requested stronger actual database failure tests; malformed
scope acceptance was reproduced then fixed before SQL. One bounded append-only
test repair preserved original tests. Four subsequent actual-PG failures were
test assumptions about fixture cardinality and the existing unavailable return
contract; corrected without production changes. Added omitted zero-mapping tests.
Fresh complete-production/new-test/changed-fixture architecture/security reviews
PASS/PASS. Same-family limitation, omitted dependencies and original failures
remain explicit. Late fence tests inject within owning transaction; no false
independent concurrent race claim. No reviewer execution claim.

Financial: 500.5 known reported credits; 505.65075 historical phase book, finite 1,200
cap closed. Actual closure balance 9,191.7; all prior future holds 7,220.21925 plus
5.15075 estimate excess = 7,225.37 future exposure reserve, leaving 1,966.33 after
reserves and 966.33 above floor 1,000. Historical total 9,966.57 is separate from new
exposure. No top-up needed. Every failed/unknown/explicit reservation retained,
including prior 94.6/120/150/193.232; API unknown $0.17192 remains separate. Affected,
native/privatePi and oversized routes HELD. No billing-settlement claim.

Full P3C remains open: qualified Runtime/provisioner adapter, protected terminal
graph transitions and tombstones, canonical/staging replay fences, reader
exclusion before identity/ranking/counts, durable bounded descendant jobs,
external index/copy/key and backup/replica verification. No real deletion,
crypto-erasure or bulk Context/import readiness is claimed.
