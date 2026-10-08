# dev-drop — supplementary read-graph capture drop spot

**Goal:** `ci-fail-fast` · **Parcel:** CFF-P0, AC5 supplementary pass (R15 variance-edge naming)
**Owner of the drop:** the developer (human input act). **Consumer:** the CFF-P0 builder, into `read-graph/fixtures/dev-pass-raw.json` (its own Allowed Files).

## Contract

1. **What runs:** the CFF-P0 measurement probe (`scripts/read-graph-probe.mjs` — the same single-pass instrumentation that produced the primary `windows-latest`/Node `24.19.0` capture), executed locally on this Windows machine. The exact command package ships with the CFF-P0 AC5 completion; it will be of the shape:

   ```
   node scripts/read-graph-probe.mjs --env dev-win --out dev-pass-raw.json
   ```

   (Exact flags and the probe file will be named in `read-graph/measurement-log.md` when the primary capture lands. The probe observes file opens only — it does not modify the runner.)

2. **What to drop here:** the produced `dev-pass-raw.json`, verbatim and unedited. Optional: a one-line note of `node -v` and the machine alias if you want the variance narrative labeled.

3. **What happens next:** the builder derives the supplementary projection from this file **merged with the same single-pass discipline** — local-only edges join the map as **named variance edges that always affect, never exclude** (R15). This file never becomes a second pin and never produces a second projection set.

4. **If unreachable/undone:** nothing breaks; the capture stays a named pending input and all cross-environment edges degrade to always-affect (safe, noisier ordering).
