# RCM publication prerequisite shaping

Draft only; no implementation or provider call. Base
`45b50e66be7d3a4a29519063aeae87c1270ce8b8`, isolated branch
`codex/hro-rcm-publication-shaping-20260926`.

## Inspected source and decisions

Actual producer blob `20af5e8f3fc0c857ce5569ebdcb28ad504c0aed8` and adapter blob
`39347c4018a3dbf1c0cd9abf0a6e2e9da262bdf8` are unchanged. Accepted C bootstrap
design/release inspected at `c55bd6d960e92ddefe1c321c9ff79ba0d8aa6759`; its acquire
is synchronous and includes authority beyond catalog facts. P4A repaired base
requires authentic complete scoped absence and distinguishes B1 terminal reopen
from broker restart refusal. This prerequisite does not alter those owners.

The existing producer only validates retained manifest/projection artifacts.
Its historical filename/baseline/refusal-binding checks cannot honestly describe
arbitrary fresh fetches. Root therefore selected an additive versioned raw-response
materializer in the existing RCM owner, preserving the retained API and its
evidenceOnly result. New artifacts must derive from freshly captured bytes with
original acquisition time and separately installed profile authority, not edited
historical labels or self-asserted acceptance pins.

Root also selected private single-process bounded immutable generations with
atomic pointer CAS. No durable publication store is proposed. Restart discards
publisher authority; durable workflow admission remains another prerequisite.
An empty restarted cache does not create a fresh recovery budget.

## Official documentation observation

Read the [official models reference](https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties)
on 2026-09-26. It documents GET /api/v1/models, full-list behavior when offset and
limit are omitted, and default text output filtering. Its authentication section
lists bearer authorization. The retained source observation recorded credential-free
success; neither source is a guarantee of current public availability. Root permits
a later genuine installed credential-free attempt, refusing actual authentication
requirements/errors without reading keys. No endpoint was called in this task.

The proposed fixed no-query acquisition is consequently scoped to public text
metadata. It cannot establish provider-wide, account-specific or nontext absence.
Complete body receipt plus reviewed domain/schema validation is required; partial,
ambiguous, continued or changed-domain responses hold without negative evidence.
No follow-up endpoint, pagination, search or arbitrary URL is smuggled into the
single refresh operation. New documentation/profile changes require fresh review.

## Decomposition and limits

The [draft specification](../../specs/active/RCM-HRO-authenticated-catalog-publication.md)
proposes normalization checkpoint N in routing-policy and private publication
checkpoint P in dispatch, each with named future source/test paths. Those paths
are proposals only; independent review must freeze raw schema, exact extraction
rules and real terminal transport ownership before implementation release.
Keep existing canonical validation/decimal conversion under RCM ownership.

Proposed limits align with P4A/producer: 10-second operation, four active fetches,
8 MiB body, 256 requested identities, 10,000 response rows, 128 publication scopes,
one current generation per scope and bounded candidate retention. Original receipt
time caps catalog validity at 24 hours and absence at 30 seconds. A stricter caller
deadline/expiry wins. No queue, redirect, retry, credential fallback or restart
authority exists. Missing quality, billing completeness, account entitlement,
runtime and policy approval remain unknown and continue to block launch.

## Review and handoff

Eight acceptance groups distinguish pure materialization, authentic installed
acquisition, exact-domain absence, CAS races, cancellation, private handles,
restart and C integration. Network-incapable tests cannot establish production
authenticity; enabling genuine metadata acquisition is a separate reviewed claim,
and cannot establish a live inference or complete HRO exit.

Only this note and the draft spec are authorized. Root retains ratification,
independent design reviews and future implementation release. No extra shaping
artifact, source, charter, owner contract, dependency or configuration is changed.

Validation passed under Node 24.19.0: frozen spec-linter from the existing B1
integration checkout with its read-only dependencies, required body sections and
all relative Markdown links. The official documentation link was read directly.
The exact two-file staged diff must pass whitespace checks before local commit.
No runtime tests were claimed for this documentation-only shape.
