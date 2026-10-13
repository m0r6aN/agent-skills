# p3b-review-R5-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE

## TEST RUN
```
git diff --stat 7a8d7a2..f67d8c6
  tests/gravity/test_projection_fixtures.py | 99 +++++++++++++----  (1 file — no production code)

.venv/Scripts/python.exe -m pytest tests/gravity -q -p no:cacheprovider
  153 passed in 0.44s   (Windows head f67d8c6 — tolerance branch of G-9 exercised)

docker run --rm -v <temp copy @ base 2930958>:/src:ro python:3.12-slim python /src/probe_g9.py
  gravity/1.0.0 scored on Linux x86_64 / CPython 3.12.15 — output compared to the in-repo
  _G9_GOLDEN: dict equal: True, bytes equal: True, repr-exact per-float: True

docker run --rm -v <temp copy @ head f67d8c6>:/src:ro ... python -m pytest tests/gravity/test_projection_fixtures.py -q
  19 passed  (Linux — exact byte-identity branch of G-9 taken)

two-run byte stability (fixture_outputs, Windows): sha256 92393df0…4480 == 92393df0…4480  BYTE-STABLE
```

## TRIAGE VERIFICATION
- **P3b-T7 — verified.** I independently recomputed the `gravity/1.0.0` golden in `python:3.12-slim` Docker against a read-only temp copy of the repo at base `2930958` (pre-P3b code, not head): the result is byte-identical and repr-exact-per-float to the `_G9_GOLDEN` pinned in the test, including the two triaged ULP values (`occurrence …5301`, `recall …3946`) and the function hash `cb8a2fb7…046c`. So the golden really is the 1.0.0 output on the deployment platform, not re-derived from head. The head test on Linux takes the exact branch (byte-identical `json.dumps`) and passes; on Windows the tolerance branch passes. The non-Linux path cannot mask a semantic change of consequence: `_assert_golden_close` enforces identical key sets recursively and exact equality for every non-float (so `gravity_version`, `gravity_function_hash`, `computed_at_epoch` id/level/root, `memory_id` are exact), the hash itself covers version + canonical params so any param/version smuggling fails exactly, floats use `rel_tol=1e-12, abs_tol=0.0` (zero-golden vs nonzero-actual fails closed), and the deployment platform (Linux CI) remains byte-exact regardless. The limitation is stated honestly in the module docstring ("replay determinism is PER PLATFORM", owner-visible D12 note) matching the ruling.
- **P3b-T8 — verified.** The `fromisoformat` oracle is replaced by `_epoch_oracle` using `strptime` with explicit `%z`/UTC-naive formats, identical semantics on CPython 3.10–3.12; it fails closed (`AssertionError`) on unparseable input, and the production `epoch_seconds` is untouched (diff is test-only). CI at head is green on 3.10/3.11/3.12.
- **Scope — verified.** `git diff 7a8d7a2..f67d8c6` touches only `tests/gravity/test_projection_fixtures.py` (+86/−13); worktree clean at `f67d8c6`.

## FINDINGS
### F-1 [info] Non-Linux tolerance (1e-12) is ~10⁴ ULPs wider than actual libm drift
- Where: `tests/gravity/test_projection_fixtures.py`, `_assert_golden_close` (`rel_tol=1e-12`)
- Evidence: observed Windows↔Linux drift is last-ULP (~1e-16 relative, e.g. `…5301` vs `…5302`); the tolerance admits changes up to 1e-12 relative on non-Linux dev boxes.
- Why it matters: a deliberate sub-1e-12 math tweak would pass locally on Windows; however it would still be caught byte-exactly on Linux CI (the deployment gate) and any param/version change is caught exactly via the function hash on all platforms — so no integrity hole, just a wider-than-necessary local window, as the P3b-T7 ruling itself prescribed.
- Required disposition: informational
