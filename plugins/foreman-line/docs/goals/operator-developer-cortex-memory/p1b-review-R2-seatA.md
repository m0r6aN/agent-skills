# p1b-review-R2-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE-WITH-FIXES

## TEST RUN
`.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider` → `2017 passed, 110 skipped, 2 warnings in 42.85s` (matches the expected R2 counts 2017/110; R1 base was 1928/110, so the rework added tests with no regressions).

## TRIAGE VERIFICATION
- **T-35 (Cortex half):** PARTIAL — alphabet + grammar enforced on all six carriage headers (`require_scope_headers`, new `require_advisory_header`, loud `parse_grant_scopes` → 403 via `_caller_scope`), stored out-of-alphabet stamps fail closed in `record_scope`, no silent strip/rewrite (the old `.strip()` calls were removed), and HTTP tests verify 403 with zero store calls per header and per route. However the shared regexes anchor with `$`, which in Python also matches before a single trailing `\n`, so a value ending in one newline passes the "no control characters" alphabet (see F-1). Everything else verified against the ruling text.
- **P1b-T1:** PARTIAL — for the same single reason (F-1). The ruling's three operative clauses are otherwise all implemented and tested: `require_scope_headers` 403s on `:`/`,`/whitespace/control/overlong/129-char values; grant parsing is loud (malformed token ⇒ PermissionError ⇒ 403, incl. empty segments, trailing commas, whitespace, unknown forms, `OP:LEGACY` case tricks — never silently dropped); `record_scope` returns the invisible-to-everyone scope for out-of-alphabet stored stamps including the R1 probe values (`role_id="b:c"`, `profile_id="a"`); injectivity regression test present; tests cover `:`/`,`/whitespace/control chars in each header at both unit and served-HTTP level with `SpyDocumentStore` proving no store access.
- P1b-T2/T3/T5: carried forward to P2 per the brief — not re-examined beyond confirming no regression; P1b-T4: informational, not re-raised.

## FINDINGS

### F-1 [minor] T-35 regexes use `$`, which accepts a single trailing newline
- Where: `src/keon/cortex/tenancy/scope.py:81` (`_IDENTIFIER_RE`) and `scope.py:85-89` (`_GRANT_SCOPE_RE`)
- Evidence: probe in the parcel venv: `is_valid_identifier("role_a\n") → True`, `is_valid_identifier("a"*128+"\n") → True` (129 bytes accepted), `is_valid_grant_scope("role:p:r\n") → True`, `parse_grant_scopes("op:legacy\n") → frozenset({'op:legacy\n'})`, and `record_scope` classifies a stored stamp with `role_id="role_a\n"` as a *valid* `role_private` stamp instead of the invisible fail-closed scope the P1b-T1 ruling requires for out-of-alphabet ids. The unit tests cover `\n`/`\t`/NUL only mid-string, missing exactly this Python `$`-anchor pitfall.
- Why it matters: the implemented alphabet is effectively `^[A-Za-z0-9_.-]{1,128}\n?$`, violating the T-35 letter ("no control characters", ≤128). Exploitability is nil on the served path (HTTP/1.1 stacks — h11/httpx — reject bare LF in header values, so the value cannot transit), and the stored-stamp direction is fail-closed (a `\n`-tailed scope id never string-equals any legitimately carried scope id, confirmed `is_record_visible → False` for a clean caller). But any future non-HTTP caller of these validators (P2 write paths, bridge, direct SDK use) inherits the hole, and the scope-id injectivity argument relies on the alphabet being exact.
- Required disposition: fix in rework — replace `_RE.match(...)` with `re.fullmatch` or anchor with `\A…\Z` in both regexes, plus trailing-`\n` cases in the unit parametrizations. One-line fix; no behavioral change for any conformant value.

### F-2 [info] Well-formed `op:legacy` grant under a non-operator profile is silently discarded, not loud
- Where: `src/keon/cortex/tenancy/scope.py:196-200` (`CallerScope.effective_scopes`: `scopes.discard(LEGACY_SCOPE_ID)`)
- Evidence: a carriage of `X-Keon-Grant-Scopes: op:legacy` with `X-Keon-Profile-Id: live-application` passes `parse_grant_scopes` (grammatically valid) and is then silently dropped. Contrast: every malformed token is a loud 403, and empty advisory headers are loud, per the rework's own "never silently drop" doctrine.
- Why it matters: the direction is strictly fail-closed (never widens; live profiles still cannot see legacy rows — covered by `test_N20`/legacy tests), so no bypass. But the Gateway should never emit this combination; a silent discard masks a Gateway-side binding fault that the T-35 philosophy would prefer surfaced. Consistency question only — the T-35 ruling's loudness mandate covers grammar violations, which this is not.
- Required disposition: informational (coordinator may fold a "semantically inconsistent carriage ⇒ loud" rule into a later parcel if desired).

## SEAM NOTE
The two sides now share one T-35 alphabet and grammar by construction: P1a rejects out-of-alphabet ids/grants at binding resolution (JWT + enrollment), P1b independently re-rejects at carriage with 403 before any store access (verified per-route with a spying store), so a Gateway regression cannot fail open on the Cortex side. Matching is exact-string and order-insensitive (`frozenset`), so P1a's "canonical sorted comma-joined" emission composes with P1b's parser even if ordering ever drifts; the colon-free alphabet makes `role:{profile}:{role}` construction injective on both sides (25/25 distinct-id probe in the tests). Residual seam wrinkles are both fail-closed: the F-1 trailing-newline edge is identical on both validators' obligations but untransmittable over HTTP headers, and a P1a bug that emitted `op:legacy` for a live profile would be silently narrowed rather than flagged (F-2). An empty `X-Keon-Grant-Scopes` value and an absent header both parse to the empty grant set, so either P1a emission convention for "no grants" composes safely.
