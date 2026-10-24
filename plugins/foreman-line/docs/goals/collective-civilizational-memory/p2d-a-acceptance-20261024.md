# P2D-A Git object snapshot — accepted October24

[Cortex PR96](https://github.com/Keon-Systems/keon-cortex/pull/96) merged reviewed source `9fce7a97e0efedd77ce133274689ef8928774a51` as `0aec0e24af450032100c292de0e3e2879708a266`.
All16exact-head checks passed across the push/PR workflows,
both attempt2 on the unchanged reviewed commit. Merged-main
[CI](https://github.com/Keon-Systems/keon-cortex/actions/runs/40113781053) and [deployment workflow](https://github.com/Keon-Systems/keon-cortex/actions/runs/40113781015) succeeded
on the exact merge. Reviewed/committed/merged trees and all3file hashes agree;
428existing entries preserved,431total. Workorder status-only archived to done/.

This delivers the first Git acquisition dependency: a pure bounded validator
for caller-materialized raw Git objects of ONE exact SHA-1 commit. It verifies
all supplied object hashes, walks committed binary trees to bind file paths,
preserves complete file bytes/author/committer metadata and explicitly excludes
symlinks/submodules without following them. No Git, filesystem, network,
credential, source execution, persistence or trust-promotion effect occurs.
SHA-1 is candidate integrity evidence, not authenticated producer admission.
Authenticated high-trust producer coverage remainsZERO before legacy backfill.

Local evidence:153focused PASS;3342full PASS/137skip. All3189previous passes and
137skip dispositions retained. Fixed prebuild byte/hash/path/author oracle,
Black/isort/mypyPASS;14missing-slot negative cases fail against old source and
pass against corrected source. Source CI also passed Python3.10/3.11/3.12.
All owned local test containers were removed. Two fresh final architecture and
security Sol contexts PASS/PASS, same-family limitation disclosed. Initial
findings, two scoped operator corrections and exact offline source-envelope
recovery remain in the preserved evidence; no new source/review request here.

GitHubActions original billing failures remain historical evidence. After the
owner reported the issue resolved, both original workflows were rerun once;
green exact-head checks restored the conditional standing merge authority.
No billing setting, workflow, model route or source byte changed; no admin/
bypass used. The main deployment workflow passed, without claiming a Git
acquisition adapter or ingestion route is deployed.

This continuation used **zero additional GenSpark model calls or credits**.
The closed original ledger stays byte-identical:146.3reported credits and
198.475750conservatively booked of300, including the full110source booking.
Every earlier reservation, including120/150, remains held. Affected/native/
private-Pi routes remainHELD; no new budget envelope or uncertainty release.

StageFclosed. Source worktree is clean and its pushed branch retained for
recovery/follow-on; no destructive cleanup, competing coordinator or monitor.
The next parcel is P2D-B: separately qualify restricted operator-authorized
local bare-repository acquisition at one exact commit, bounded object reads,
no hooks/filters/source execution, and resource/cleanup evidence. No actual
repository or personal corpus acquired by P2D-A. Civic mapping/extractor engine,
P3-P8 and integration/storage/privacy/crypto/benchmark/recovery/import gates
remainopen. Full Context and mass ingestion are NOT ready.

Evidence: p2d-a-stage-f-closure-20261024.json, p2d-a-gate3-20261024.json,
p2d-a-ci-resumption-closure-20261024.json, original final-ledger/review-triage/
shape-oracle-sensitivity/validation records. Historical CI-held report is
superseded only by this verified acceptance record, not overwritten.
