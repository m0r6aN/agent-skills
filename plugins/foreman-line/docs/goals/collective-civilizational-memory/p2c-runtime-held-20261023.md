# P2C runtime adapter — held after independent composition review

Recorded 2026-10-23T23:55:48.340209+00:00. The production adapter candidate is implemented in the isolated
`D:/Repos/ccm-worktrees/cortex-p2c-runtime` worktree on
`feat/foreman-line-ccm-p2c-runtime`, accepted base
`5cb07ba47f7f52dc85c228e06dc3d1bfe3ec4d04`. The six new files remain
uncommitted and are additionally snapshotted privately with exact hashes.
No source PR, merge, acceptance or production/import admission is claimed.

Actual verification: 59 focused tests pass; full suite 3,046 passed /137 skipped,
all3,124 prebuild case identities/dispositions and422accepted tree pins retained.
Black/isort pass. Mypy fails at runtime.py:128: optional subprocess pipe tuple
reuses a local previously inferred as a nonoptional pipe. No checks waived.

The actual rebuilt image is
`sha256:a6a75dbc102b44c309be0fa8315e94e183de21557decb7da63b6f4aed20ba42c`.
Seven actual Windows client/Docker Desktop Linux worker cases match the accepted
library, including Unicode, invalid syntax/UTF8 and resource failure. The actual
worker profile probe confirms Python3.13.15, matching module hashes, CPU2s hard
limit,96MiB address space and NPROC0 under the fixed cgroups. Five fixed trusted
fault images demonstrate closed rejection of exit71 after valid reply, stderr,
malformed/oversized reply and late response. Every created container is confirmed
absent. These observations do not qualify Linux-client hosts, real daemon-outage
cleanup, arbitrary images, deployment or bulk ingestion.

Two fresh independent Sol architecture/security contexts both return
**CHANGES_REQUIRED**. Same-family limitation is disclosed; no multi-family
council is claimed. Confirmed blockers:

1. Resolve the actual mypy error without suppressions or transport changes.
2. Add ordinary deterministic tests retaining the real ownership/cleanup paths:
   uncertain create with/without known ID, label/ID mismatch with zero mutation,
   kill/remove/absence sequencing and daemon-error/timeout/interruption/pending
   behavior. Test nonblocking partial/would-block I/O and teardown/reap failure.
   Current lifecycle tests mock `_owned` and `_cleanup`; actual successful Docker
   cleanup does not replace those failure-path tests.

The one formal repair is used. This finite phase is **closed to further source
changes or provider dispatch**; no second repair or blind source-C replay is
authorized by this record. The next move is one explicit scoped disposition of
these measured blockers, followed by exact-source verification and fresh review;
existing blanket owner authority remains recorded, but this pass does not silently
expand its own frozen stop condition. Until resolved, Gate3/merge stays held.

Cost: known reported 249.7000 credits; conservative phase booking
414.656875 of800, including the new150-credit unknown source-C outcome and full
10-credit unsuccessful MiMo allowance. Original120-credit failed P2C reservation
and all carried unknowns remain intact. No retry or fallback. Sol was the cheapest
approved capable elevated-risk route; smaller-model qualification did not produce
a usable completed answer and was not repeated. See held-ledger JSON for fresh
account observation and exact per-call receipts; account deltas are not task billing.
All affected credential/native/private-Pi routes remain held. No personal data,
bulk import, live DB, unrelated container, ACL or credential changes occurred.

Evidence: `evidence/p2c-runtime-repair-local-validation-20261023.json`,
`evidence/p2c-runtime-actual-composition-20261023.json`,
`evidence/p2c-runtime-actual-faults-20261023.json`,
`evidence/p2c-runtime-composition-review-triage-20261023.json`, and
`evidence/p2c-runtime-held-ledger-20261023.json`.
