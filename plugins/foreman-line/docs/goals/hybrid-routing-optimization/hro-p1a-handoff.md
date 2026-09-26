# HRO-P1a implementation handoff

Branch: `codex/hro-p1a-20260926`
Base: coordinator commit `772dc42f3489ac4518c95bc021fe1d2f983f1c4d`
Spec: `HRO-P1a-mapping-contract.md`

This parcel implements only the HRO-local proposal-envelope validator and
synthetic static-conformance fixtures. The validator consumes injected frozen
evidence and returns `evidenceOnly: true`. It is not a PMC binding schema, a
resolver, a registry, an availability check, a route, or authorization.

Changed paths are limited to the eight files in the active spec's Allowed
Files list. No provider, host-file, network, credential, configuration,
receipt, dispatch, routing-policy, PMC, or RCM surface is touched.

## Verification record

- Node `v24.19.0`; package dependencies installed with `npm ci --ignore-scripts
  --no-audit --no-fund --offline`.
- `npm test`: 16 focused tests passed, 0 failed after independent review
  rework; the added cases cover hostile proxies, array shape, aggregate limits,
  multi-node cycles, tuple collisions, all provenance fields, mutation, exact
  256/257 binding bounds, exact 8192/+1 visited values, and exact
  262144/+1 aggregate string units.
- `npm run typecheck`: passed.
- `npm run lint`: passed; 5 package files checked.
- Unchanged routing-policy regression: 69 passed, 0 failed under Node 24.19.0.
- CI runner contract tests: 17 passed, 0 failed after adding the 20th package,
  60 checks, 80 subprocess calls, corrected failure offsets, and explicit
  hybrid-routing failure propagation.
- Scope proof: the tracked implementation set is exactly the eight Allowed Files
  above plus the three A1 CI files; `node_modules/` is ignored and no other
  source tree was modified.
- Import proof: the HRO source imports only its own local module and has no
  imports from PMC, RCM, routing-policy, dispatch, receipts, Jev, host files,
  network libraries, or configuration surfaces.
- The package checks were executed with Node 24.19.0 and the repository-matched
  pinned `tsx`, TypeScript and Biome binaries from the already-installed local
  Foreman toolchain. An initial direct npm-script attempt correctly failed closed
  before package-local dev binaries were available; no source result was taken
  from that attempt.
- An accidental first pass used relative patch paths and created duplicate
  untracked HRO files in the original planning worktree. Only those newly
  created duplicates were removed after verification; the original planning
  records were preserved.
- Review A/B requested changes to the original implementation; `b2b1060`
  contains the bounded owned-graph parser repair and expanded coverage.
- The final P2 repair moves array length preflight ahead of `ownKeys`, checks
  remaining shared value capacity before allocation and each descriptor read,
  and preserves prohibited-operation sentinels for oversized arrays.
- Local commits: `a60fa52` contains the package implementation;
  `7ac871e` contains the coordinator-ratified A1 spec amendment; the final
  local CI/handoff commit is `2708c3d`; repair commits `b2b1060` and the
  current P2 boundary repair are the review head.

Independent architecture/risk reviews remain required before merge.
