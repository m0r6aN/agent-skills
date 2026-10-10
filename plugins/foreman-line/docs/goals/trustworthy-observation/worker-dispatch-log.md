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

## TO-P0 builder

- Exact host: fireworks/accounts/fireworks/models/ember-1, tool-free Pi.
- Worktree: /home/cmorgan76/Work/foreman-to-p0, docs/foreman-to-p0.
- Bound: 180 seconds; completed exit 0 in 117.2 seconds, terminal stop.
- Runtime accounting: 15,046 input + 9,441 output tokens; estimate USD 0.186753,
  not settled billing. The requested prose length was exceeded; next prompts
  should use tighter per-document/output bounds.
- Step 0 scope matched three Allowed Files; no new semantic conflict flagged;
  unknown external live evidence remains pending. Coordinator accepts scope
  under standing dispatch authority before any materialization.
- Output transport: missing final outer JSON brace and repeated identical
  scenarios field. Coordinator added the brace, verified duplicate bytes equal,
  and enforced exact three-path whitelist. No document prose changed.
- Three documents materialized; two fresh independent architecture reviewers
  dispatched. No acceptance or implementation completion is claimed.

## TO-P0 rework and scoped reasoning escalation

- Ember rework1 ended stop with only an acknowledgement (17,616 input, 26
  output tokens; runtime estimate $0.053238). No handoff accepted/materialized.
- Deeper contract synthesis required after dual review; fresh Codex inherited
  reasoning builder /root/to_p0_contract_rework_builder edited only three docs.
  This was execution/synthesis, never Jev/Drex classification. Runtime/model
  billing not reported by this agent interface; no external host alias invented.
- Fresh dual reviewers evaluated d4e73028: one accepted, one required a precise
  negative-position correction. Coordinator reproduced/rule recorded separately.
- Bounded correction returned to Ember: first patch12.3s estimate $0.026403
  (4,731input/814output) was not materialized because negative-token scope was
  too broad and exact hostileexample absent. Second corrected patch12.7s,
  $0.018429 (1,703input/888output); exact two-file string whitelist applied.
- Both independent reviewers accept final019ab92c documentation contract.
  Independent docs verifier: spec lint0,71links/41anchors/30targets/0failures,
  seven paired scenario rules, zero behavioral tests. Coordinator review record
  is separate from the builder's three AllowedFiles; no code accepted.

## TO-P1 prerequisite-window shaping draft

- Requested preference fireworks/ember-1; actual host
  fireworks/accounts/fireworks/models/ember-1 via tool-free Pi.
- Role: bounded public-source shaping draft while TO-P0/TO-B0 wait on CI;
  no classifier ran and no execution authority activated.
- Completed 24.3s, terminal stop; runtime 12,640 input+1,809 output tokens,
  estimated USD 0.065055, not settled billing.
- Coordinator corrected required headings, exact B-positive heading constraint,
  kept EVD out of scope, corrected package name and an invented source-hash
  verification phrase. Source authority remains accepted TO-P0 grammar.
- Materialized only goal/to-p1-shaping-draft.md, outside active/ specs; no
  emitted shaping result, receipt, Gate-2 activation or builder dispatch.
- Actual spec-linter validate with observation --repo-root passes. First attempt
  against /tmp correctly refused outside-root input; no validation was claimed
  for that attempt. The in-repo draft passes structurally; implementation review
  and behavioral verification remain future work after both parents land.
