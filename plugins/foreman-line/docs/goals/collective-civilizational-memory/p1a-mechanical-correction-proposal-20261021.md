# P1A mechanical CI correction — prepared, not applied

The complete five-path candidate passes328required tests, retaining238original
identities. Its frozen code fails Black/isort in models_v2 and the new tests, and
mypy reports16modelsv2errors. Original candidate and all four owner-frozen hashes
remain unchanged in the admitted worktree; no source commit/PR or acceptance.

Prepared private patch: `C:\Users\clint\AppData\Local\CCM-RLP-01-A1-private-01a15670\openai-api-document-20261021-01\mechanical-fix-proposed.patch`
SHA256 `fa8cdab381ff2bff4529e2bb032e0b042d125ab10249b484ccdca1b03dac3ef2`.
Only two files change: src/keon/cortex/ingress/models_v2.py and
 tests/test_ccm_contracts_v2.py. Add explicit validator/return annotations and a
typed model dispatch map; run the existing Black/isort formatters. No fixture,
document, classification/trust/state rule or new dependency changes. Taxonomy
and canonical fixture hashes stay fixed. Original four artifacts remain preserved.

A private copy with this patch passes Black,isort,mypy and328tests, including all
238oldidentities. This is diagnostic proof of the proposed patch, not independent
review or acceptance. No additional model request or cost was needed. Applying
it to admitted code would change two frozen source hashes, so it is not silently
applied under the document-only instruction. Owner may authorize that exact
mechanical correction; no new API budget is requested.

Separately, reviewerA failed: all2304tokens thinking/no verdict,37320input above
26500operational bound,127.6reportedcredits above100percall. ReviewerB remains
unsent. Local token estimators plus20percent were insufficient; no defensible
preventive percall bound or reasoning-off mapping is established for this route.
Do not retry/raisecaps or claim two reviews exist. Future paidreview requires a
concrete qualified bounded route/control, not another blind call. This proposal
contains no such new review authorization, providerhunt or infrastructuretask.
