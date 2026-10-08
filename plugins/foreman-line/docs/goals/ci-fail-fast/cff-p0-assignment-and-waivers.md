# CFF-P0 — Assignment fallback and dead-waiver inventory (AC2 + AC3)

**Spec:** `plugins/foreman-line/docs/specs/active/CFF-P0-recon-and-baseline.md`
(SHA-256 `e529dedc7b4d035f4e3447e623c9ad0e1d364bda30388d8a2e4409812fb15ab8`), AC2
(`§fallback`), AC3 (`§waivers`).
**Measured at:** worktree HEAD `f9788222c9b18087600d2a247dce1005af2c7943`,
`scripts/foreman-line-ci.mjs` last changed at
`145da132a3c2268025764558270e4ff553c6877c`.
**Environment fingerprint:** commands below are pure Node.js source
evaluation (`discoverPackages`/`assignShards` are platform-independent; no
subprocess spawn, no CI execution) — run on `linux`, Node `v26.8.2`, this
session; the artifact-download reproduction for AC3.2 uses `gh` CLI `2.102.0`
against GitHub's API (platform-independent).

## §fallback (AC2)

### 1. The 30/27 gap, reproduced by committed command at the measured-at SHA

```
node -e "
import('./scripts/foreman-line-ci.mjs').then(async (m) => {
  const names = m.discoverPackages({ root: process.cwd() });
  console.log('discovered:', names.length);
  console.log(JSON.stringify(names));
  const unknown = names.filter(n => !(n in m.COST_TABLE));
  console.log('cost-unknown:', JSON.stringify(unknown));
  console.log('COST_TABLE size:', Object.keys(m.COST_TABLE).length);
});
"
```

Measured output:
```
discovered: 30
["approval","authority-registry","bypass-outage-harness","contract-readers","contracts","dispatch","foreman-config","hybrid-routing","integration","jev-decisions","kernel-contracts","kernel-import","kernel-lease","kernel-state","mutation-scope-guard","ops-console","permission-profiles","project-scaffold","projection","receipts","registration","role-authority","routing-policy","schema-scaffold","shaping","skill-injection","spec-body-compiler","spec-linter","verification","worker-envelopes"]
cost-unknown: ["kernel-import","ops-console","project-scaffold"]
COST_TABLE size: 27
```

**30 discovered, 27 pinned in `COST_TABLE` (`:277`) — reproduced exactly.**
The three cost-unknown names are exactly `kernel-import`, `ops-console`,
`project-scaffold`, matching AC2.1 verbatim.

### 2. The mechanism, read from source (not asserted)

`assignShards`' `costKnown` gate (`:335-340`):
```js
const costKnown =
  costTable !== null &&
  typeof costTable === 'object' &&
  Object.keys(costTable).length > 0 &&
  orderedNames.every((name) => Number.isFinite(costTable[name]))
```
This is **all-or-nothing**: `.every(...)` over the full 30-name discovered
list fails the moment *any one* name is absent from `costTable`, regardless
of how many of the other 29 are priced. One unknown name (there are three)
silently degrades the **entire** assignment to round-robin
(`orderedNames.forEach((name, index) => shards[index % shardCount].push(name))`,
`:342-343`).

### 3. The live assignment at `shardCount 4` matches pure round-robin — shown

```
node -e "
import('./scripts/foreman-line-ci.mjs').then(async (m) => {
  const names = m.discoverPackages({ root: process.cwd() });
  const shards = m.assignShards(names, 4);
  shards.forEach((s,i)=>console.log('shard',i,'count',s.length, JSON.stringify(s)));
  const rr = Array.from({length:4},()=>[]);
  names.forEach((n,i)=>rr[i%4].push(n));
  console.log('matches pure round robin:', JSON.stringify(shards) === JSON.stringify(rr));
});
"
```

Measured output:
```
shard 0 count 8 ["approval","contracts","integration","kernel-lease","permission-profiles","registration","shaping","verification"]
shard 1 count 8 ["authority-registry","dispatch","jev-decisions","kernel-state","project-scaffold","role-authority","skill-injection","worker-envelopes"]
shard 2 count 7 ["bypass-outage-harness","foreman-config","kernel-contracts","mutation-scope-guard","projection","routing-policy","spec-body-compiler"]
shard 3 count 7 ["contract-readers","hybrid-routing","kernel-import","ops-console","receipts","schema-scaffold","spec-linter"]
matches pure round robin: true
```

`8/8/7/7` over the code-point-sorted discovered names at `shardCount 4` —
reproduces AC2.2's pinned shape exactly, and the output is byte-identical to
an independently-built pure round-robin partition of the same ordered list
(`matches pure round robin: true`), confirming the assignment is not merely
*shaped like* round-robin but *is* the round-robin branch, measured.

### 4. Nothing signals the fallback — states the routing

Grepped at the measured-at SHA:
```
grep -n "fallback_reason\|costKnown\|cost-unknown\|cost_unknown" scripts/foreman-line-ci.mjs
```
`costKnown` is a local boolean inside `assignShards` — it is never returned,
logged, or placed on the `shard-outcomes@1` schema (`buildShardOutcomes` at
`:803-810` emits only `schema, shard_index, shard_count, head_sha, packages`;
`outcomeRecord` at `:778-800` emits only `name, location, checks, waivers,
waiver_rejected` per package). No step-summary field (`buildSummary`'s inputs
are the same artifact shape), no shard-outcomes field, no log line anywhere
names the round-robin degradation. **Confirmed by absence**, not assumed.

**Routing (stated verbatim, per D10 and the spec's AC2.3):** the loudness
surface for this silent fallback is **CFF-P1's** (charter D10(c): "Cost-table
coverage loudness is routed to CFF-P1: any discovered name absent from the
table is surfaced in the step summary and the shard-outcomes artifact (named
field) — before and after the re-pin, never silent."). The 30-package re-pin
that restores cost-aware assignment is **CFF-P1's** (charter D10: "CFF-P1
carries the 30-package cost-table re-pin as a re-measurement that restores
the ratified cost-aware assignment"). **This parcel (CFF-P0) records only —
it adds no loudness surface and re-pins nothing.**

## §waivers (AC3)

### 1. All four `WAIVED_EXCLUSIONS` entries, three-axis pins cited from source

`WAIVED_EXCLUSIONS` (`:517-619`; `EXPECTED_SKIPS` empty array at `:623`), per
standing constraint #13 (identity + location + value class):

| Identity | Location | Checks pinned (value axis) |
|---|---|---|
| `bypass-outage-harness` | `plugins/foreman-line/bypass-outage-harness/` | `test` (markers `['FK-P17-bypass-outage-matrix.md','CHANNEL_EXEC_FAILED']`, `failTotal [3,3]`, 3-name `failingSet`); `typecheck` (markers `['mutationScope','TS2353']`, `counts {'error TS':2}`, `failTotal [0,0]`) — **no `lint` entry** (§fallback and AC1 §3 of `cff-p0-sweep-anatomy.md` both rely on this absence) |
| `jev-decisions` | `plugins/foreman-line/jev-decisions/` | `test` (marker `['LEGACY_EXECUTION_RETIRED']`, `failTotal [6,6]`, 6-name `failingSet`) |
| `kernel-lease` | `plugins/foreman-line/kernel-lease/` | `test` (markers `[]` — R15 cross-environment drop, documented in-source comment adjacent to `:555-559`; `failTotal [75,80]`; `failingSet` = 75 named deterministic failures via `KERNEL_LEASE_TEST_FAILING` at `:399-479`; `flaky` = 5 named CN-01..CN-05 race members); `lint` (markers `['biome','Found 32 errors']`, `counts {'Found 32 errors':1}`, `failTotal [0,0]`) |
| `authority-registry` | `plugins/foreman-line/authority-registry/` | `test` (marker `['R31 reviewed source mapping drift: M02-note']`, `failTotal [30,32]`, `failingSet` = 30 names via `AUTHORITY_REGISTRY_TEST_FAILING` at `:480-511`, `flaky` = 2 named R31 members via `AUTHORITY_REGISTRY_TEST_FLAKY` at `:512-516`) |

**Reproduction:**
```
node -e "import('./scripts/foreman-line-ci.mjs').then(m => console.log(JSON.stringify(m.WAIVED_EXCLUSIONS, null, 1)))"
```

### 2. Green-run evidence that each is dead — run `37674775022` @ `fb25630`

```
gh run view 37674775022 --repo m0r6aN/agent-skills --json headSha,conclusion,createdAt
# -> {"conclusion":"success","createdAt":"2026-10-07T19:28:41Z","headSha":"fb25630c36541dad6da1f0c3a90642d64e625db3"}
gh run download 37674775022 --repo m0r6aN/agent-skills -p "shard-outcomes-*"
```

Artifact filenames: `shard-outcomes-0/shard-outcomes.json`,
`shard-outcomes-1/shard-outcomes.json`, `shard-outcomes-2/shard-outcomes.json`,
`shard-outcomes-3/shard-outcomes.json` — each carries
`"head_sha": "fb25630c36541dad6da1f0c3a90642d64e625db3"`. Per-identity
measured records (`python3 -c "..."` filtering each artifact's `packages[]`
for the four identities):

```
shard-outcomes-0/shard-outcomes.json kernel-lease          {checks: {ci: pass, test: pass, typecheck: pass, lint: pass}, waivers: [], waiver_rejected: {}}
shard-outcomes-1/shard-outcomes.json authority-registry    {checks: {ci: pass, test: pass, typecheck: pass, lint: pass}, waivers: [], waiver_rejected: {}}
shard-outcomes-1/shard-outcomes.json jev-decisions         {checks: {ci: pass, test: pass, typecheck: pass, lint: pass}, waivers: [], waiver_rejected: {}}
shard-outcomes-2/shard-outcomes.json bypass-outage-harness {checks: {ci: pass, test: pass, typecheck: pass, lint: pass}, waivers: [], waiver_rejected: {}}
```

All four identities: **every check `pass`, `waivers: []`, `waiver_rejected: {}`**
— reproduces AC3.2 exactly (artifact filenames and head SHA recorded above).

### 3. Safety argument and routing

Run-then-waive (`runShard` at `:908-947`, `evaluateWaiver` at `:697-742`):
every check always runs first; `waiverFor`/`evaluateWaiver` is consulted only
when a check's raw exit is non-zero (`result.status === 'pass'` short-circuits
waiver evaluation entirely — see `:933-936`). A **green pass never consults a
waiver pin** (the green-run evidence above shows `waivers: []` precisely
because nothing failed to need evaluating), and **any regression that
produces a different failure shape re-gates red** — `evaluateWaiver`'s
layered checks (`marker-missing`, `count-mismatch`, `range`, `set-subset`,
`set-supersede`, `equality`, all before `:742`) refuse the waiver the moment
observed output diverges from the pinned value on any axis, which is exactly
what cycles 1–3 of PR #155 demonstrate (`cff-p0-sweep-anatomy.md` §3): the
four pins are stale relative to the then-current code, and every divergence
fail-closed to red rather than silently waiving.

**Routing (stated verbatim):** expiry/disposition of these four dead
waivers is deferred to **CFF-P1's Stage-F bookkeeping** (charter D10: "CFF-P0
records the live assignment fallback and all four dead waivers; CFF-P1
carries the 30-package cost-table re-pin..."; D10's general rule: "Waiver-set
expiry and cost-table re-measurement are this goal's bookkeeping [routed] to
the next runner-touching parcel"). **This parcel removes nothing** — the four
`WAIVED_EXCLUSIONS` entries above are unmodified in this worktree; no waiver
pin was added, removed, or re-pinned.
