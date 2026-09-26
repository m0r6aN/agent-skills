# RCM host-cache source contract v2 — proposal

Status: proposed, unratified. This document is a review artifact only; it does
not alter the existing host export, RCM snapshot, routing policy, or runtime.

## Purpose

Define the smallest truthful source contract for a sanitized host-cache refresh
when the provider does not publish a catalog-refresh timestamp.

`checkedAtUtc` means: the UTC time at which this approved source was
successfully fetched, parsed, and bound to the exact response bytes described by
this record. It does **not** mean provider publication time, provider internal
refresh time, model release time, or evidence of current provider state after
the fetch.

Provider-declared publication/refresh/version metadata remains a separate
optional field. If the provider does not publish it, it is `null`/unknown; it
must not be inferred from HTTP `Date`, model `created`, local file mtime, or
export generation time.

## Per-source record

Each approved source record must contain:

```json
{
  "sourceProfile": "<immutable profile id/version>",
  "endpoint": "<exact https URL>",
  "method": "GET",
  "requestStartedAtUtc": "<UTC ISO timestamp>",
  "responseReceivedAtUtc": "<UTC ISO timestamp>",
  "checkedAtUtc": "<same value as responseReceivedAtUtc>",
  "status": 200,
  "responseByteLength": 0,
  "responseBytesSha256": "<SHA-256 of exact public response bytes>",
  "providerDeclaredTime": null,
  "fieldCoverage": {
    "present": [],
    "unknown": [],
    "omitted": []
  },
  "stability": {
    "repeatFetchPerformed": true,
    "repeatExactResponseDigestEqual": true
  },
  "authSent": false,
  "inferenceCalled": false
}
```

The exact-response digest is permitted here only for an unauthenticated public
metadata response held in memory during this supplemental observation. It must
never be used to hash Pi's raw `models-store`, settings, headers, auth files,
environment, or any raw mixed host document. The existing three-file
host-owner export remains projection-only and keeps its current raw-source
hash prohibition.

`checkedAtUtc` freshness bounds the age of this observation. It does not prove
provider-internal currency. A proposal must state that limitation and must
refuse if the observation is missing, malformed, older than the ratified bound,
or bound to a different endpoint/profile/digest.

## Field and authority rules

1. A source profile is exact: provider key, endpoint, protocol, and source
   schema/version are joined without aliases. `https://opencode.ai/zen/v1`
   cannot satisfy a source bound to `https://opencode.ai/zen/go/v1`.
2. Only fields actually present in the source may populate a canonical
   snapshot. Unknown context limits, modalities, reasoning support,
   max-tokens, prices, or thinking levels remain unknown and deny eligibility.
3. Documentation may corroborate protocol, model ID, or published price, but a
   documentation table is not a substitute for missing machine-readable
   capability fields unless a separate source profile explicitly ratifies its
   schema, retrieval, version, and field semantics.
4. `providerDeclaredTime` is populated only when the provider explicitly defines
   the value as catalog publication/refresh/version time. HTTP `Date`,
   `Last-Modified`, `ETag`, model `created`, source mtime, and local acquisition
   time remain separate evidence.
5. A repeated exact response digest is stability evidence for the bounded
   observation, not proof of provider uptime or future availability.
6. Public metadata is proposal-time corroboration only. It cannot authorize
   dispatch, provider spend, Pi writes, default-model changes, or automatic
   promotion.

## Current applicability

- OpenRouter `/api/v1/models` supplies machine-readable model IDs,
  capabilities/modalities, context, pricing, and supported parameters for many
  records, but the current response omits `typesafe/jev-1.13`. The required
  identity therefore remains unresolved.
- OpenCode `/zen/v1/models` and `/zen/go/v1/models` both returned model lists,
  but live records expose only `id`, `object`, `owned_by`, and `created`.
  OpenCode's public Zen documentation supplies endpoint/protocol mappings and
  published prices, but not the missing context/capability/thinking fields.
- The `/zen/v1` and `/zen/go/v1` sources are separate namespaces. No facts are
  copied from one into the other.

## Acceptance consequence

Under this proposal, a fresh successful public fetch can clear a **source
observation-age** predicate once the amendment is ratified, while
provider-internal publication time remains unknown. It cannot by itself clear
missing identity, endpoint authority, missing capability fields, or any
provider-specific eligibility refusal.

