# CFF-P1 — Stage-F disposition of the four dead `WAIVED_EXCLUSIONS` entries (AC4)

**Spec:** `plugins/foreman-line/docs/specs/active/CFF-P1-change-proximity-ordering-and-early-red.md`
(SHA-256 `ed40b2c4d05616711f4f3e7b5c0e9dd7cf2808d81936b98c9201aa55459ebf83`), AC4.
**Charter routing:** D10: waiver-set expiry is this goal's bookkeeping, routed
to the next runner-touching parcel's Stage F. CFF-P1 is that parcel.
**Baseline:** `cff-p0-assignment-and-waivers.md` §waivers (the four identities
and their three-axis pins), `cff-p0-waiver-input-contract.md` §1 (the
kind-gate and the nine-layer evaluation).
**Written at:** branch `feat/foreman-line-CFF-P1`, 2026-10-08, on top of the
CFF-P1 build commits (`WAIVED_EXCLUSIONS` byte-unchanged since `145da132`).

## This record changes no pin

**No `WAIVED_EXCLUSIONS` edit is made by CFF-P1.** Changing a pin value is a
hard stop for this parcel. This file only records dispositions. Any removal
it recommends is **future work that needs its own ratified spec amendment**.
Standing constraint #13 (identity + location + value, tested per axis) binds
that future change, not this one. Verify with
`git diff 41b927de -- scripts/foreman-line-ci.mjs`: no hunk touches
`WAIVED_EXCLUSIONS`, `KERNEL_LEASE_TEST_FAILING`,
`AUTHORITY_REGISTRY_TEST_FAILING`, or `AUTHORITY_REGISTRY_TEST_FLAKY`.

## Evidence the four entries are dead (re-verified at this parcel's build)

**Primary: run `37674775022` @ `fb25630`.** This is CFF-P0's cited green
`main` run on the pinned workflow. Re-checked on 2026-10-08 with
`gh run view` and `gh run download -p "shard-outcomes-*"`:

```
{"conclusion":"success","createdAt":"2026-10-07T19:28:41Z","headSha":"fb25630c36541dad6da1f0c3a90642d64e625db3"}
shard-outcomes-0/shard-outcomes.json fb25630c kernel-lease {"ci":"pass","test":"pass","typecheck":"pass","lint":"pass"} waivers=0 rejected={}
shard-outcomes-1/shard-outcomes.json fb25630c authority-registry {"ci":"pass","test":"pass","typecheck":"pass","lint":"pass"} waivers=0 rejected={}
shard-outcomes-1/shard-outcomes.json fb25630c jev-decisions {"ci":"pass","test":"pass","typecheck":"pass","lint":"pass"} waivers=0 rejected={}
shard-outcomes-2/shard-outcomes.json fb25630c bypass-outage-harness {"ci":"pass","test":"pass","typecheck":"pass","lint":"pass"} waivers=0 rejected={}
```

**Corroborating: run `37768165017` @ `2d81d926`.** This is CFF-P0's D7
capture-of-record measurement vehicle. It ran on windows-latest with Node
24.19.0 and the runner unmodified, but it is **not** the pinned
`foreman-line-ci.yml` workflow. Its shard-outcomes artifacts show the same
result for all four identities: every check is `pass` and `waivers=0`. The
vehicle is cited here as a second observation in the pinned environment, not
as the primary record.

## Why a dead entry is liability, not protection (measured)

Run-then-waive means a passing check never consults a pin
(`cff-p0-assignment-and-waivers.md` §waivers.3). A failing check reaches
`evaluateWaiver` and passes the kind-gate (`cff-p0-waiver-input-contract.md`
§1) only when its exit is a clean numeric non-zero code. So for an identity
that is green on `main`, its pin can do only one thing: waive a regression
whose output matches the **whole** recorded failure shape. It cannot absorb
the flaky members the pins name. The flaky lists exist only as
present-or-absent tolerance alongside the full deterministic set, which is
always required. Checked against the live pins on 2026-10-08:

```
kernel-lease lone flake -> range | full pinned regression -> WAIVED
authority-registry lone flake -> marker-missing | full pinned regression -> WAIVED
```

So no dead entry protects the line against flakiness. Each one could only
re-green a regression back into a known-bad state that is already fixed on
`main`. Since CFF-P1 AC5 landed, such a waive would at least emit a
`::warning` annotation, so it would be visible in the log. It would still
turn the verdict green. That is the D10 sense of "pure liability until
re-measured."

## Dispositions

| # | Identity | Pinned checks | Disposition |
|---|---|---|---|
| 1 | `bypass-outage-harness` | `test` (FK-P17 matrix markers, `failTotal [3,3]`, 3 names); `typecheck` (`mutationScope`/`TS2353`, `error TS` ×2) | **Propose removal (future ratified amendment)** |
| 2 | `jev-decisions` | `test` (`LEGACY_EXECUTION_RETIRED`, `failTotal [6,6]`, 6 names) | **Propose removal (future ratified amendment)** |
| 3 | `kernel-lease` | `test` (75 deterministic names + CN-01..CN-05 flaky, `failTotal [75,80]`, no markers per R15); `lint` (`Found 32 errors` ×1) | **Propose removal (future ratified amendment), pending a flake-rate re-measurement first** |
| 4 | `authority-registry` | `test` (30 names + 2 R31 CI-environment flaky, `failTotal [30,32]`, M02-note drift marker) | **Propose removal (future ratified amendment), pending a git-sensitivity re-measurement first** |

### Reasoning per identity

1. **`bypass-outage-harness`.** Both pinned failure shapes come from a missing
   feature. The `test` pin covers the FK-P17 outage-matrix controls that
   refused `mutationScope`. The `typecheck` pin covers TS2353 on the same
   `mutationScope` property. Both checks pass on green `main` (`fb25630`) and
   in the pinned environment (`2d81d926`). Since the cause has been
   implemented, a recurrence of exactly that shape would be a real regression.
   It should go red, not be waived. The removal amendment should cite these
   runs and drop both checks' pins together.
2. **`jev-decisions`.** The pin encodes the six legacy-execution tests that
   failed with `LEGACY_EXECUTION_RETIRED`. They pass on green `main` and in
   the pinned environment. A run that matches the pin would mean the
   retired-execution path broke again, and the waiver would hide that. The
   disposition is removal. The amendment should verify there is no ≥10-run
   variance before dropping it (lesson #46, measured not asserted).
3. **`kernel-lease`.** This is the largest pin: 75 deterministic names plus
   the five CN race members. It was measured in the era when the
   CI-environment harness hit barrier timeouts. The live check above shows it
   cannot absorb a lone CN flake, so keeping it gives no flake protection.
   The disposition is removal, with one precondition for the amendment:
   re-measure the CN-01..CN-05 flake rate on windows-latest/Node 24.19.0 over
   ≥10 consecutive green runs (the R7/R19 discipline). If the races still
   flake, the correct instrument is a narrow, separately ratified flake pin
   sized to what was measured, not this obsolete 75-name shape.
   **Side observation, out of scope for AC4:** `COST_TABLE['kernel-lease'] = 67.0`
   reflects the failing era. The CFF-P1 capture-window measurement saw about
   24 s (completion record, AC3 calibration table). That value is outside
   this parcel's Allowed File changes; AC3 leaves the existing 27 entries
   untouched. It is flagged for the next D10 cost re-measurement.
4. **`authority-registry`.** This pins 30 deterministic names plus two R31
   corpus tests. The two R31 tests are git-sensitive and appeared only in the
   CI environment (R18/R19, run `37011944112`). They pass on green `main` and
   in the pinned environment. Like kernel-lease, the pin cannot absorb a lone
   R31 flake (the `marker-missing` result above). The disposition is removal.
   Precondition for the amendment: confirm across ≥10 runs that the R31 tests
   stay green under the workflow's `fetch-depth: 0` checkout. That checkout
   setting is the git-history condition their earlier CI failures depended on.

## What the future amendment must carry (named, not done here)

- One ratified spec amendment. It removes the chosen entries from
  `WAIVED_EXCLUSIONS` and, for kernel-lease and authority-registry, the
  backing name-list constants (`KERNEL_LEASE_TEST_FAILING`,
  `AUTHORITY_REGISTRY_TEST_FAILING`, `AUTHORITY_REGISTRY_TEST_FLAKY`).
- Retargets of the golden and R19 tests that read those constants
  (`R19: authority 2-member era…`, `R19: the 5-flake kernel closure…`). Each
  retarget must be a named event in that parcel's tripwire.
- Per-axis tests per standing constraint #13 covering the removal: identity,
  location, and value. A removed identity's failure must now go red with
  `no-pin`.
- The ≥10-run re-measurements named in rows 3 and 4, recorded where they ran
  (lesson #48).
