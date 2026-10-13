# p1b-review-R2-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES
## TEST RUN
`.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider`
`2017 passed, 110 skipped, 2 warnings in 38.39s`
## TRIAGE VERIFICATION
- P1b-T1: PARTIAL — delimiter collisions are closed, but terminal newline characters pass identifier and grant validation. Malformed stored stamps containing terminal newlines also remain visible.
## FINDINGS
### F-1 [major] Terminal newlines bypass T-35’s strict validation
- Where: `src/keon/cortex/tenancy/scope.py:79-99`
- Evidence: Both validators use `.match()` with `$`, which permits matching immediately before a final newline. Probes confirmed `is_valid_identifier("role_a\n")` and `is_valid_grant_scope("role:profile_a:role_a\n")` return `True`. Through FastAPI TestClient, terminal-newline values in each identifier carriage header and the grant header returned 200 rather than 403. Ingest persisted `"role_a\n"`; a subsequent request with the malformed matching grant retrieved it. A seeded profile-shared record whose stored role ended in a newline was also returned to a normal caller.
- Why it matters: T-35 requires rejection of every control-character violation, and P1b-T1 requires out-of-alphabet stored stamps to be invisible. Both requirements remain unenforced for terminal LF. These are application-level reproductions, not evidence that LF traverses a production HTTP parser or bypasses Gateway-secret authentication.
- Required disposition: fix in rework — use full-string matching for identifiers and grant tokens, and add terminal-LF regression tests covering carriage rejection and stored-stamp invisibility.
## SEAM NOTE
Conformant P1a emissions compose correctly with P1b: space-delimited claim scopes become sorted comma-joined carriage, scope components match the agreed grammar, and Cortex authenticates the Gateway secret before accepting carriage. Missing role/profile fails before store access; foreign-role/profile reads fail closed. One producer/consumer discrepancy remains: P1a’s scope canonicalizer trims entries before validating, while P1b rejects raw whitespace-bearing tokens; producer-side rewriting warrants P1a verification against T-35’s no-rewrite rule. The carried-forward P2 identity, persistence-test, and scope-stamping items are not re-raised here.
