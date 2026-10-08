# CFF-P0 — Waiver input-contract map (AC4)

**Spec:** `plugins/foreman-line/docs/specs/active/CFF-P0-recon-and-baseline.md`
(SHA-256 `e529dedc7b4d035f4e3447e623c9ad0e1d364bda30388d8a2e4409812fb15ab8`), AC4.
**Measured at:** worktree HEAD `f9788222c9b18087600d2a247dce1005af2c7943`,
`scripts/foreman-line-ci.mjs` last changed at
`145da132a3c2268025764558270e4ff553c6877c` — all line citations below are
re-cited against this commit (the spec's shaping-time citations were "as of
`14b2501a`"; re-verified unchanged at build).

## 1. What `evaluateWaiver` and `reconcile` consume

### The invoke seam: per-(package, check) captured output text

`runShard`'s `invoke(name, args)` (`:869-883`) spawns one `npmCli` subprocess
per `(package, check)` pair and returns:
```js
return { status, kind, output: `${result?.stdout ?? ''}${result?.stderr ?? ''}` }
```
(`:882` in this file's single-process `invoke`; the `runShard`-path `invoke`
returning the same concatenation is at `:882`). `output` is the **single
input** `evaluateWaiver` consumes for a
given `(package, check)` — a concatenated `stdout+stderr` string, captured
whole, not streamed or chunked by the contract.

### The parse surface

`evaluateWaiver(identity, location, check, output, kind, waivers)`
(`:697-742`) derives everything it checks from that one `output` string via:

- **`failingTestNames(output)`** (`:647-664`) — parses TAP `not ok … - <name>`
  lines and the spec reporter's `✖ <name>` lines; returns the
  de-duplicated, **sorted** set of failing test names (sanitized, 200-char
  cap per name via `sanitizeField`).
- **markers** — `pin.markers` is a list of stable literal substrings; every
  one must appear via `text.includes(marker)` (`:721-723`) for the waiver to
  survive the `marker-missing` layer.
- **counts** — `pin.counts` maps a literal to an exact occurrence count,
  checked via `countOccurrences(text, needle)` (`:724-727`, implementation at
  `:628-635`), a linear bounded scan.
- **`failTotal` range** — `sumFailTotals(text)` (`:673-682`) sums every TAP
  `# fail N` and spec-reporter `ℹ fail N` line; the observed sum must fall
  inside the pinned `[min, max]` inclusive range (`:728-730`).
- **R11 equality** — "whenever failing names parse, the declared failure
  total equals the number of DISTINCT failing names"
  (`names.length > 0 && observedTotal !== names.length` at `:743-744`); where
  no names parse (tsc/biome checks declare none), the range check alone
  guards.

### The kind gate — `exit` only

`evaluateWaiver`'s very first branch (`:701`):
```js
if (kind !== 'exit') return pack('kind-gate', { kind }, { kind: 'exit' })
```
A signalled or errored spawn (`kind: 'signal'` or `kind: 'error'`, set by
`invoke` at `:875-878` from `result.signal`/`result.error`/malformed `result`)
**never** reaches the marker/count/range/set/equality layers — it is refused
at the gate, unconditionally. Only a clean numeric non-zero `exit` status may
ever be waived.

### Every rejection layer, enumerated by name

In evaluation order (`evaluateWaiver`, `:697-759`; the docstring at `:688-696`
names them as the full set):

1. `kind-gate` — non-`exit` kind (`:701`)
2. `no-pin` — no `WAIVED_EXCLUSIONS` entry matches `identity` + `location` +
   `check` (`:706`, and the loop-fallthrough return at end of function)
3. `malformed-pin` — the matched pin fails its own shape invariant (`:720`,
   guard built at `:709-719`)
4. `marker-missing` — a pinned marker literal is absent from `output`
   (`:722`)
5. `count-mismatch` — an occurrence count differs from the pinned exact value
   (`:726`)
6. `range` — the summed fail total falls outside `[min, max]` (`:729-730`)
7. `set-subset` — an observed failing name is **not** in the pinned universe
   (`pin.failingSet ∪ pin.flaky`) — an "intruder" (`:735-736`)
8. `set-supersede` — a pinned deterministic `failingSet` member is **absent**
   from the observed names (`:737-738`)
9. `equality` — R11's sum-equals-distinct-count invariant fails (`:743-744`)

Any output that clears all nine layers returns `{ layer: null, record: {...} }`
(`:746-753`) — the only path that may waive.

## 2. Order-independence — proved from source

All set comparisons in the contract go through the single `sameSet` helper
(`:962-966`):
```js
function sameSet(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
  const right = [...b].sort()
  return [...a].sort().every((v, i) => v === right[i])
}
```
Re-cited call sites at the measured-at commit (spec's shaping-time citations
`~962, ~1047, ~1089, ~1108` reproduce exactly):

- **`:962`** — the `sameSet` definition itself.
- **`:1047`** — `reconcile`'s assignment-drift check: `sameSet(got, want)`
  compares an artifact's package-name set against the re-derived shard
  assignment.
- **`:1089`** — `reconcile`'s waived-counts verification:
  `sameSet(Object.keys(record.counts_verified), Object.keys(pin.counts))`.
- **`:1108`** — `reconcile`'s waived-markers verification:
  `sameSet(record.markers_matched, pin.markers)`.

Additionally, `evaluateWaiver`'s own set-layer checks (`:733-738`) use
`Array#filter`/`.has()` against a `Set` built from the pinned arrays — also
membership-only, never index- or order-sensitive — and
`failingTestNames` (`:647-664`) returns its result **pre-sorted**
(`return [...names].sort()` at `:664`) before it ever reaches a comparison.
**Every comparison point in the contract is set-membership or a sort-then-compare
helper; output ordering is invisible to the contract**, confirmed by reading
every call site, not asserted.

## 3. D3 anchor for CFF-P1

CFF-P1 (change-proximity check ordering, D3: "per-package output capture
contract preserved") may reorder *which package's checks run when within a
shard*. For that reordering to be safe against this contract, CFF-P1 must
conform to:

1. **Reordered output remains per-package captured** — each `(package,
   check)` invocation still produces its own `invoke()` call and its own
   `output` string; the contract has no cross-package aggregation step
   anywhere in `evaluateWaiver`/`reconcile`.
2. **Same stream concatenation** — `output` stays `stdout+stderr` as a single
   concatenated string (`:882`); a reordering that interleaves two packages'
   stdout into one buffer would break every marker/count/range check, since
   those checks assume one package's own output.
3. **Same per-(package, check) granularity** — the unit of capture, parse,
   and waiver evaluation is one `(package, check)` pair; CFF-P1 must not
   batch multiple checks' output into one `evaluateWaiver` call.
4. **Same waiver parsing** — `failingTestNames`, `sumFailTotals`,
   `countOccurrences`, and the nine-layer evaluation order are untouched by
   check ordering; CFF-P1 changes *when* a check runs, never *what its output
   means*.
5. **`output_sha256` is recorded per-run, never pinned** — `outcomeRecord`
   (`:808`) passes through `output_sha256: w.output_sha256`, populated at the
   call site in `runShard`'s waiver-acceptance branch
   (`records.get(name).waivers.push({ ...evaluation.record, output_sha256:
   sha256Hex(result.output) })` at `:921`) and re-checked for presence-only
   (never value-pinned) in `reconcile` at `:1107`; this hash rides the
   artifact as a per-run audit trail and is **not** part of any
   `WAIVED_EXCLUSIONS` pin — reordering checks changes nothing a pin depends
   on.
6. **Interleaving per-package output is a charter stop condition** — if a
   reordering ever caused two packages' subprocess output to interleave
   within one captured `output` string (e.g. concurrent execution writing to
   a shared buffer), the marker/count/set/equality layers above would
   silently evaluate mixed-identity text. This is named here as the boundary
   CFF-P1 must not cross; per D3 and this parcel's constraints, CFF-P0 does
   not grant that boundary a repair — it only names it as the anchor.

**Reproduction:** all citations above are `grep -n` line numbers against
`scripts/foreman-line-ci.mjs` at HEAD `f9788222c9b18087600d2a247dce1005af2c7943`:
```
grep -n "function sameSet\|sameSet(" scripts/foreman-line-ci.mjs
grep -n "^export function evaluateWaiver\|^export function failingTestNames\|^export function sumFailTotals\|^export function countOccurrences" scripts/foreman-line-ci.mjs
```
