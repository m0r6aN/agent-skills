# p1b-review-R3-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE

## TEST RUN
`.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider` → `2046 passed, 110 skipped, 2 warnings in 44.75s` (matches expected R3 counts 2046/110; R2 base was 2017/110, delta adds 29 tests, no regressions).

## TRIAGE VERIFICATION
- **T-36 (Cortex half): IMPLEMENTED** — both anchored patterns rewritten anchor-free and matched exclusively via `re.fullmatch` (`src/keon/cortex/tenancy/scope.py:87`, `:92-96`); module docstring codifies "`$` is never used as a terminal anchor"; no `$` anchor or `.match(` remains anywhere in `scope.py`. No trimming: the last remaining `.strip()` in scope code (`operator_profile_id`) was removed — the env value is now used verbatim and a padded configuration fails closed (test `test_T36_operator_profile_env_value_is_not_trimmed`). My exact R2 probes all now fail closed: `is_valid_identifier("role_a\n") → False`, `"a"*128+"\n" → False`, `is_valid_grant_scope("role:p:r\n") → False`, `parse_grant_scopes("op:legacy\n") → PermissionError`, `parse_grant_scopes("\trole:p:r\r\n") → PermissionError`, whitespace-only id → False.
- **P1b-T6: IMPLEMENTED** — per the ruling's two test obligations: (1) terminal-LF/CR per carriage header at served-HTTP level: parametrized 403 test covers all six headers plus grants (`tests/test_scope_http.py::test_T36_terminal_newline_rejected_in_each_carriage_header`, 9 rows, `SpyDocumentStore.calls == []` asserted); (2) stored stamps: a `role_id="role_a\n"` stamp is reclassified from my R2 probe's `role_private` to `scope_class=None` (re-probed: invisible to the matching clean caller **and** to the operator — `is_record_visible → False/False`; HTTP test asserts 404 for both). Unit parametrizations add `\n`/`\r`/`\r\n` tails for identifiers, grants, and advisory headers.
- **P1b-T7: IMPLEMENTED** — new `require_consistent_carriage` (`scope.py:219-240`) raises `PermissionError` when `op:legacy` is carried under a non-operator profile; wired into `_caller_scope` after construction (`api.py:186-194`) so it surfaces as 403 before any store access. Re-probed directly: loud for `live-application`. The silent `discard` in `effective_scopes` is retained only as documented defense-in-depth for direct algebra callers — acceptable, since every served path passes through the loud gate first. Unit + HTTP tests present (`test_P1b_T7_*`), including the consistent operator-profile case.

## FINDINGS

### F-1 [minor] `X-Actor-Id` is still trimmed before use — pre-existing, outside the T-36 fix surface
- Where: `src/keon/cortex/api.py:154-156` (`_context`: `actor.strip()`), similarly `:502-522` (decision receipt / idempotency header `.strip()`)
- Evidence: unchanged by the delta (`git diff 9801999..38ff14a -- api.py` touches no `.strip()`); actor id is an identity value trimmed into the binding rather than validated verbatim, contra T-36's letter. Not scope-affecting (actor is provenance/context only, never an authorization input in the P1b algebra), not a fail-open, and not a delta regression — the T-36 rework correctly removed every strip on the scope path.
- Disposition: carry-forward to P2 (apply T-36 to actor/receipt/idempotency values when those paths are touched); "informational" severity for this parcel's close.

No other findings. The delta is tightly scoped (2 source files, 2 test files), both R2-identified defects are closed with regression tests that reproduce the original probes, and no regression was introduced.
