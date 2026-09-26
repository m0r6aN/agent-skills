# HRO-P1b final acceptance record

Coordinator integration record, 2026-09-26. Full goal remains active.

Source frozen at 5ea6c7a53c5cdbb2f45c38c2011c302e1daacf3e on
codex/hro-p1b-20260926. Final source spec Git blob is
92b05d6e8f0b9b4ce022578a894efb99ea808cda. The last repair changes only permanent
behavior tests and handoff documentation; production source was unchanged.

Independent final reviewer A approved the exact source head without findings.
Observed 35 HRO tests/typecheck/lint passed, 159 independent hostile-input cases
including 48 boundaries passed, and all six current mutation controls failed
their intended committed regression. The review checked array preflight before
child descriptors, callback capture/phase refusal, evidence pins, privacy and
owned frozen outputs, then confirmed unchanged HEAD and clean worktree.

Separate integration workspace is hro-p1b-integration-20260926 on branch
codex/hro-p1b-integration-20260926. Commit
42abab71ce238259c28e101deec2c86d3f21046a merges accepted main
60a62b1cccf06e6a23bfe2294beb758799d5e317 into the frozen source. The complete HRO
package diff from the source is empty. HRO spec changes only the already-shipped
P1a reference from active to done; all accepted PMC/RCM source is preserved.

Dependency setup used read-only directory junctions only for absent targets and
only after exact package-lock SHA-256 equality. Most dependencies reuse the
hro-pmc-p1b-20260926 package trees; hybrid-routing reuses hro-p1a-20260926;
verification and mutation-scope-guard reuse hro-coordination-20260926. No
manifest/lock/dependency installation changed, and no shared dependency may be
mutated. Integration checks must execute this target's source, not donor source.

Second independent review, actual combined-tree checks and full remote CI remain
pending. RCM producer PR #58 separately awaits its narrow D19 provenance-data
repair. This offline consumer parcel does not activate or depend on that pending
producer at runtime, so the two independent merge gates need not block each
other. Neither can merge without its own completed review and green CI.

No live routing, provider availability, configuration mutation, cache benefit or
full HRO exit is claimed by this record.

## Final reviews and predecessor reconciliation

Reviewer B independently approved consumer integration9e902a4:35 HRO,505
routing,126 dispatch tests/typechecks, HRO lint and D19 passed;159 hostile-input
cases (48 boundaries),12 additional probes and six mutation controls passed.
Full CI then exposed the separately recorded Contract B inventory omission.

Both independent final correction reviewers approved7252f8e without findings.
They reproduced the genuine additive reader classification, preserved prior
rulings, independently computed all nine literal occurrences and the exact
digest, and confirmed HRO production/tests unchanged. Checks included70 reader,
44 mutation-guard and35 HRO tests/typechecks/lints; reviewer B also ran153
verification tests. Independent deletion/duplication/value/location controls
failed as intended. This acceptance does not extend to unseen source changes.

RCM producer PR58 merged as326e958 after its two final repair approvals and
complete green CI. Integration63fc68262e9f1e5927c6b93ed329aa6c8a56d435
merges that actual main into this HRO branch. HRO/contract-reader package diffs
from7252f8e and routing-policy diff fromea4027a are empty. D19 combines the
approved RCM predicate and HRO registry count/digest. Combined-tree independent
checks and refreshed full CI are the remaining PR59 merge gates. This record
also carries the already-merged producer's Stage F documentation closure.

## Contract B reader-inventory repair

The bounded integration repair adds the genuine additive lockstep reader
`plugins/foreman-line/hybrid-routing/src/consumer-compatibility.ts` to
`contractB`. The consumer repeats the routing-class vocabulary and validates
membership, so adding a class requires changing its local membership set. The
permanent sweep records this rationale and includes a deletion negative control
that detects removal of the declared reader from the registry.

The D19 registry DATA pin is recomputed from the actual sorted observed values:
cardinality 9 and SHA-256(JSON.stringify(sorted values))
`d5a4c056a28824b3417e0dfa37e0191c437cc16a1fdc83dcd85ffa9467d565cd`. The
structural predicate and all prior negative reader rulings are unchanged.
