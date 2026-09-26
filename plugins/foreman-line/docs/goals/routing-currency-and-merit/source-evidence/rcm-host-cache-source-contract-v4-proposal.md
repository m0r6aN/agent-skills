# RCM host-cache source contract v4 — sealed conservative projection

Status: proposed, unratified. This version preserves v1–v3 artifacts and only
corrects their interpretation; it does not change the repository, canonical RCM
reader, Pi configuration, or runtime.

## Correction map

- `anthropic/claude-haiku-4.5` has `projectedRcmV1: null` and
  `REASONING_UNKNOWN_REFUSED`. Unknown reasoning is never encoded as
  `reasoning: false`.
- `reasoning: true` for the other six rows is a reviewed mapping-profile
  inference from a nonempty live `supported_efforts` array. It is not claimed
  to be a documented per-model schema field.
- The sealed projection records exact source locators for `context_length` and
  `top_provider.max_completion_tokens`, and is bound to the source response
  digest and mapping profile.
- AC2 accounting is **12 successful catalogue resolutions + 1 documented
  binding-7 catalogue refusal + 2 owner-attested bindings = 15**. The binding-7
  refusal is not counted as a successful resolution.

## Sealed projection

The companion file
`openrouter-rcm-v1-conservative-projection-20260926.json` contains six
projected rows and one explicit Haiku refusal. Its digest is recorded in the v4
evidence manifest. The projection is not a routing authority or an execution
configuration.

Input projection remains conservative:

```text
rcmInputModalities = sourceInputModalities ∩ {text, image}
```

All source residuals (`file`, `audio`, `video`) remain in the projection. Their
absence from the RCM fact list is an intentional narrowing, not a claim that
the provider lacks those capabilities.

## Reasoning and Pi compatibility

The RCM `thinkingLevelMap` is a catalog fact map only; it is not Pi config. The
profile maps exact provider values `max`, `xhigh`, `high`, `medium`, and `low`
to the same levels, and exact `none` to policy `off`. It does not invent
`minimal`. A level not present in the map must be denied explicitly; no
clamping or defaulting is allowed. If reasoning is mandatory, `off` is refused.

Pinned compatibility limitation: Pi 0.87.1 may treat omitted levels as
supported and may send `none` for omitted `off`. The production bridge must not
use that behavior as evidence of support, and must not rely on it to repair a
missing map.

OpenRouter's official API documents `reasoning` configuration and the
`reasoning_effort` enum, while the per-model live catalog supplies the exact
`supported_efforts` values used by this reviewed profile:

- https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties
- https://openrouter.ai/docs/api/api-reference/chat/create-a-chat-completion

