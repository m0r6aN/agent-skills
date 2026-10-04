# RCM-P0 host-owner sanitized export request

**Selected route:** host-owner sanitized export  
**Purpose:** supply current, credential-free evidence for F1–F6 without giving
Foreman access to raw mixed host documents, credentials, or Pi-owned files.

## Deliverables

The host owner should provide three files from one bounded observation:

1. `catalog-projection.json` — a projection of the current models catalog.
2. `settings-projection.json` — a projection of the current Pi settings facts.
3. `export-manifest.json` — source binding, method, timestamps, digests, stability,
   and field-coverage metadata for both projections.

The files must be UTF-8 without BOM, use stable serialization, and be hashed exactly
as delivered. Do not provide the raw catalog, raw settings file, headers, auth files,
environment dumps, or a redacted copy of a raw mixed document.

## Allowlisted projection fields

### Catalog projection

For each provider/model record, include only provider key and model ID; provider,
public `baseUrl`, and public `api`; `input`, `reasoning`, `contextWindow`, and
`maxTokens`; numeric input/output cost rates with explicit documented units;
`thinkingLevelMap` when present; provider `checkedAt`; and safe field-name inventory
and counts.

### Settings projection

Include only `defaultProvider`, `defaultModel`, `enabledModels`,
`defaultThinkingLevel`, provider keys, and public `baseUrl` values.

Exclude headers, credentials and credential references, auth-file data, arbitrary
`compat` payloads, private endpoints, URL userinfo/query/fragment, unrelated UI
settings, and PII. Exclusion must happen in the host-owner export method before the
projection crosses the host boundary.

## Manifest requirements

For each projection, record source role (`H02` host catalog or `H03` Pi settings),
owner, a non-secret safe locator label, the exact source binding retained by the
owner and supplied privately to the coordinator when needed, acquisition time in
UTC, source/provider `checkedAt` values, extraction method/version, field coverage,
explicit omissions, projection byte length/encoding/line endings, SHA-256 of the
exact projection bytes, and source-stability evidence.

The manifest must explicitly state that no credential values, secret URLs, or raw
mixed-document bytes were exported or hashed. Hash sanitized projection bytes only;
never hash the raw source document.

## Acceptance gates after delivery

The coordinator will not treat the export as live evidence until a fresh P0
continuation verifies manifest-to-file digests, encoding, length and serialization;
allowlist and exclusion compliance; exact provider/model/baseUrl joins and duplicate
or ambiguous identity refusal; source-time and stability consistency; F1–F6
derivations; HAWF/Jev dispositions; and fresh deterministic verification plus
adversarial review. Freshness must still refuse until its bound is explicitly
accepted.

Until those checks pass, the existing `complete:false` snapshot and all current
`blocked-secret-boundary`/downstream holds remain authoritative. The export does
not authorize host correction, Pi writes, network calls, provider spend, or P1
dispatch by itself.
