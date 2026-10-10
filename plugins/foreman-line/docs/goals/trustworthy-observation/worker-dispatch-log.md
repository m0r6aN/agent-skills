# Worker dispatch log

No Jev/Drex classifier has run; the available Jev launcher is synthetic and
the installed model catalog has neither classifier. Ratified risk and role
requirements are the screening source for the dispatches below.

## TO-P0 shaping attempt 1

- Requested preference: opencode-go/MiMo-v2.6-pro.
- Actual discovered host: opencode-go/mimo-v2.6-pro via installed Pi.
- Role: public-source documentation shaping, no tools/extensions/MCP/session.
- Bound: coordinator timeout 240 seconds; low thinking; requested output <4K tokens.
- Outcome: runtime reported `Stream ended without finish_reason` then hit the
  240-second timeout; partial output
  is not a completed shaping handoff and is not promoted or accepted.
- Usage/cost: unknown. The failed runtime's zero usage counters do not establish
  zero billing. No retry/re-dispatch is recorded as success.

## TO-P0 shaping attempt 2

- Requested second preference: fireworks/ember-1.
- Actual discovered host: fireworks/accounts/fireworks/models/ember-1 via Pi.
- Reason: explicitly recorded first-worker transport failure; second preferred
  worker, no unannounced identity substitution.
- Role: same public-source drafting boundary; no tools/extensions/MCP/session.
- Bound: 180 seconds, thinking off, requested output <=1800 words.
- Coordinator clarifications supplied: use existing goal-detail response for
  designated documents on parcel-less goals; spec lint applies to the parcel
  spec, not arbitrary companion prose. No new route or authority.
- Outcome: exit 0, terminal stop reason `stop`; complete shaping draft captured.
- Runtime accounting: 9,700 input and 1,303 output tokens; estimated USD
  0.048645. This is provider-runtime reporting, not a settled billing audit.
- Coordinator corrections: paths/links, supersession metadata and literal lint
  command; recorded in the materialized spec. No acceptance claim.
