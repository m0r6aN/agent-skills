# RCM-P1B producer review and repair

Frozen implementation eb73f2c59c9b8f02be85178bdad87914431c3bbb.
Spec blob 11fee5e09e1710edbe3ab41478750046126859f8; unchanged five-file scope.
Builder119 focused/617 full pass, typecheck/lint/spec pass,75->84 public exports.

Independent review A requests changes for one P2 defect. integer() converts a
retained exact JSON number token to Number before proving integrality, allowing
fractional tokens to round to integers. Independently repinned context value
1050000.00000000001, HTTP status200.000000000000001, sealed byte length
13348.0000000000001 and requested count7.00000000000000001 all incorrectly
succeed with the original canonical digest. Reviewer119 focused tests/typecheck/
lint passed and scope/digests matched; tests did not cover these cases.

Coordinator accepts the finding without changing the frozen contract. Repair
must prove exact mathematical integrality and safe range before conversion for
every integer() consumer, preserving mathematically integral JSON decimal and
exponent spellings. Bound exponent/coefficient processing before allocation;
never fix by discarding digits or widening safe limits. Add repinned negative
cases across fact and custody/count fields, plus positive integral encodings,
exact safe boundaries and underflow/overflow cases. First demonstrate RED, then
GREEN;119 focused/617 full is the test-count tripwire.

Fresh repair builder restates clean head/spec at Step0 and waits for release.
Only the original five allowed implementation files may change. Coordinator
owns this review record. No reader/projector/wrapper/schema/source-evidence
changes, provider calls, configuration changes or pushes. Integration still
follows accepted PMC-P1b. Two fresh independent frontier reviews must accept the
repaired head before merge. Keep the six-row canonical result4,359bytes SHA256
5901c16ed192870d53952375392710b514f37b18a5451da6c4a5966aa7e916bb unless a
reviewed contract change is explicitly necessary; no such change is now needed.