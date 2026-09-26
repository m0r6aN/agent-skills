# Preliminary PMC governed caller inventory

Read-only repository discovery on bb5a6e7 (2026-09-26); repeat on the accepted
P2D integration base before P2E dispatch. This is source discovery, not runtime
coverage or activation evidence. No host process/configuration was changed.

| Surface | Observed role | Required disposition |
|---|---|---|
| dispatch/src/approval-cli/index.ts prepareDispatch | Reads parcel and performs legacy routing/skills/compression; assembles order | Preserve existing preparation behavior; explicit governed inference must not be implied by prepare |
| dispatch/src/approval-cli/index.ts executeDispatch | Creates builder worktree through injected/default permission emitter, then Stage-C receipt | Worktree/receipt only; cannot count as Pi launch or inference receipt |
| dispatch/src/index.ts | Public exports for prepareDispatch/executeDispatch | New governed entry must be explicit and versioned; do not change old call semantics |
| permission-profiles/src/emitter.ts | Sole discovered child process here is git worktree add | Outside inference transport; do not retrofit a hidden send |
| routing-policy/src/pi-openrouter.ts and templates/pi-openrouter-routing.json | Static declarations and schema registry, not Pi SDK transport | Preserve v0 compatibility; registry presence is no launch permission |
| root dockerfile.pi | Installs unpinned Pi globally in image and ENTRYPOINT pi | Generic interactive launcher, outside current governed boundary; never claim it is governed or version-pinned by P2E |
| docs/goals/pi-routing-adapter-compat/probe/check-api-surface.mjs | Local API inspection probe with installed source root | Evidence tooling, not runtime inference caller |

Tracked source search found no createAgentSession/streamSimple inference caller
and no pi-bundle-parcel.sh. The pasted pipeline cannot be treated as an existing
repository call site. Searches covered the plugin and repository source, including
hidden tracked surfaces, excluding dependencies, git metadata, documentation and
fixture/test text when looking for actual callers. Recheck call sites after P2D
adds real transport; absence in this inventory does not prove host-wide absence.

P2E's phrase "update approval-cli's explicit governed-inference handoff" must not
be interpreted as an already existing handoff. The implementation needs an
explicit opt-in additive handoff, scoped in the concrete P2E contract, while old
prepare/execute semantics remain unchanged. Full HRO-P4 must expose and exercise
an actual parcel/Pi path, with exact caller files and runtime tests, before the
live acceptance claim. A new unused exported function alone is not migration.
Additional discovered governed scripts require an explicit scoped parcel; generic
interactive Pi cannot be silently promoted into the governed trust boundary.

Search evidence: repository references to createAgentSession, streamSimple,
pi-bundle-parcel, executeDispatch and pi-openrouter; inspection of approval-cli's
imports, public inputs and execute body; process/network search in dispatch and
permission-profiles. No provider calls, installations or runtime tests were used.