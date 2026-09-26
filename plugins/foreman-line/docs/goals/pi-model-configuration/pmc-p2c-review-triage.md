# PMC-P2C source review and repair

Frozen reviewed source: d38b42d139b3ad4f71314518f9bfd204f85e9d81.
Independent reviews: coordinator and hro_p1c_review_a. Both ran86 focused tests,
typecheck and full dispatch-package lint successfully under Node24.19.0; passing
fixtures did not detect the following contract defect. Source acceptance is held.

| Finding | Disposition | Evidence |
|---|---|---|
| Final WireV1.body inherits payloadJson UTF16 and ordinary aggregate bounds | Fix; separate body UTF8 budget, preserve key/value-node and all ordinary metadata/request bounds | Real owner/controller/ledger TEMP probe:260000 chars verifies2/sends1/succeeds;262145 chars verifies0/sends0/WIRE_REFUSED. Root reproduced. Independent TEMP cap-only mutation:1044480 bytes succeeds,1048576 bytes refuses due aggregate coupling. |
| Controller's genuine routing vocabulary reader absent from Contract B inventory | Separate enrollment after source approval; no runtime validation evasion | Unchanged touch-set.test.ts:588 detects additionalcontroller.ts. Existing D19 passes before registry addition; any consequent registry DATA pin change needs narrow authorization. |

Reviewer also ran four real-store begin/cancellation before/after fault probes.
Real R1/R2, request evidence, bootstrap/selection/completion custody, final checks,
consume/send ordering and reconciliation were inspected; no other blocker found.
Header-order repair remains accepted with its independent literal regression.
Predecessor sources and type-only barrel boundary remain intact. No production
conformance, physical-power-loss test or live billing claim is made.

Repair scope is exactly three existing files, from the original five-file release:
- plugins/foreman-line/dispatch/src/pmc-launch/controller.ts
- plugins/foreman-line/dispatch/tests/pmc-controller.test.ts
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2c-verification.md

Builder must inspect actual files, restate and STOP before separate release.
Use genuine RED/GREEN and preserve86/442 baseline tests. Review findings are a
floor: sweep every final-body capture/accounting path without altering ordinary
limits, owners, digest material, effects order, registry or dependencies.

## Final source acceptance — 93f8021, 2026-09-26

Coordinator and independent hro_p1c_review_a approve the exact three-file repair
93f8021ae710e3481318904f125e2ac7a8e61c71. Both independently ran95 focused tests,
typecheck and full-package lint successfully. Original86 cases remain, plus9
body/metadata controls; builder full dispatch451 also passes. Reviewer independently
probed four-byte Unicode at1048576 and1048577 bytes: success verifies twice/sends
once; one-over refuses before verification/send and retains no liability.

Only final WireV1.body text receives the separate UTF8 budget. Its key and node,
ordinary metadata and original request limits remain bounded. Earlier owner,
proof, ordering and header-digest findings remain closed. No production claim.

Integration92b965f combines source93f8021 with reviewed E1 source/audit32b5cd6,
accepted P1c/main and StageF e1e7d40 without source conflicts. E1 still awaits
combined/remote acceptance; this stack must not merge before its prerequisite.
Nineteen absent dependency directories were linked to a matched-lock donor,
read-only by convention; no dependency installation or lockfile change occurred.
