# Checkpoint N raw-response materializer verification

Implementation base: c96569e9b8695a4cdfb120110f95cc45f582bde2.
Design amendment 8dca233ce21d9083cc0368cabff5b7104d932f85 received two independent
approvals; ratification dd0425852c0b7d5a2af9660aa1fe992c27da5599 and fresh Step0
preceded the explicit four-file source release. Node used: 24.19.0.

## Delivered scope

Exactly four files: existing public-observation-producer.ts and its test, new
tests/fixtures/public-model-response-v1.json, and this report. The additive
materializePublicModelResponseV1 and four reviewed type exports remain module-local,
with no barrel change. The function performs pure, bounded evidence transformation.
It neither authenticates acquisition nor publishes, fetches or grants authority.

The parser has an explicit UTF-8 string mode for raw v1; historical UTF-16 parsing
is unchanged. Shared decimal-rate and effort-map helpers preserve old behavior.
Raw v1 maps only observed positive efforts; none-only and malformed reasoning
remain incomplete. Retained v2 still maps observed none to off.

Both raw success variants require the strict complete envelope and every response
row's unique identity and explicit text-domain membership. Catalog output includes
the exact requested complete scope; mixed absence keeps all requested identities
and only actually absent rows in its absent set. Missing required facts do not
become absence. The sole actual reader validates generated canonical bytes.

The new profile's source reference and source hash bind exact raw bytes; canonical
checkedAtUtc is completeReceivedAtUtc. The future publisher must retain those raw
bytes with acquisition custody. No synthetic historical manifest or extra result
field was introduced. Provider/account/quality/billing/approval facts remain unknown.

## RED/GREEN and checks

- Initial RED: focused package test command exited 1 because the new named export
  did not exist. This was the intended missing implementation failure.
- GREEN after implementation: focused producer suite passed; final focused run
  passed 165 tests, including 17 new raw-profile groups and unchanged retained tests.
- Full routing package suite: 961 tests passed, zero failed/skipped/cancelled;
  native exit 0. This includes actual canonical reader, adapter and purity checks.
- Package typecheck: native exit 0. Initial new-code declaration incompatibilities
  were corrected locally without changing compiler/package configuration.
- Package lint: native exit 0; one pre-existing informational diagnostic in
  catalog-snapshot.test.ts remains unchanged. Formatting touched only allowed code/tests.
- Actual D19 audit: native exit 0, 21 packages / 198 source files, zero unruled
  instances, all fixed pin cardinalities reconciled. No audit file edits or waivers.
- Source-preservation diff against the release base is empty for the public barrel,
  canonical reader, catalog adapter, retained profile fixture and historical
  source-evidence directory. No dependency/package/lock changes.

Existing 19 package dependency directories were absent and received read-only
same-package junctions to the E1 integration donor only after exact lock SHA-256
comparison. No install was run and no donor dependency file was changed.

## Test evidence matrix

| Contract | Exercised evidence |
|---|---|
| Exact representation | Independently written literal canonical JSON, source reference, profile/version, rates, ordered map and digest; actual reader and adapter consume the result. |
| Complete coverage | Catalog/absence paired negatives for envelope/link/count keys, duplicate/unclassifiable IDs and invalid/missing/text-absent modalities; complete empty response positive. |
| Unknown versus absent | Mixed facts/incomplete/multiple absent rows retain exact ordered scope and absent set; incomplete-only refuses. |
| Effort and rate semantics | Positive levels, none residual/no off, none-only/unknown/duplicate/missing failures; exact decimal zero and small rates, precision/format refusal; no request-fee invention. |
| Provenance | Raw-byte mutation changes raw/canonical digest; timestamp mutation changes canonical digest without changing raw hash; owned frozen inventory and independent output-byte copies. |
| Bounds | Exact/one-over body, scope count, response rows, depth, expanded nodes, aggregate UTF-8 strings, individual UTF-8 strings including escapes/astral scalars, scope UTF-8 budget and modality/fact collections. |
| Hostile input | Getters, revoked/throwing proxies, unknown keys, sparse/duplicate scope, shared/resizable/detached/proxied byte storage, malformed UTF-8/JSON and lone surrogates; no-descent 70,000-element scope refusal. |
| Purity and compatibility | Ambient fetch/time/random traps; unchanged import allowlist and no host acquisition; paired new UTF-8 versus old UTF-16 behavior; retained six-row canonical byte/hash fixture and existing source accounting tests. |

Synthetic raw fixture SHA-256:
94453fc7a3d2691dc31c1cad724e5d81a546a25094f9df23d5e299edd3e75ab0.
Literal expected canonical SHA-256:
92968910ac5b383f0393e45cfb218f0ad111d34e59369b6fa2a55e3a13f45270.
Retained v2 canonical fixture remains 4,359 bytes with SHA-256
5901c16ed192870d53952375392710b514f37b18a5451da6c4a5966aa7e916bb.

Local complete logs are retained under the host temporary directory as
rcm-n-red.log, rcm-n-focused-final.log, rcm-n-full.log, rcm-n-typecheck.log,
rcm-n-lint.log and rcm-n-d19.log. Logs are local evidence, not committed artifacts.

## Limits and remaining gates

All raw fixtures are synthetic and network-incapable. Strict profile compatibility
with a real current endpoint is unproven. The pure function accepts supplied
acquisition declarations as evidenceOnly; successful JSON/digests are not custody.
Checkpoint P's transport/publication/acquisition, genuine profile installation,
durable workflow admission, downstream launch composition and live HRO exit are
not implemented or completed here. Two independent source reviews, combined
integration and required remote checks still precede merge. No provider/Pi,
credential, configuration, production SQLite, push or merge activity occurred.
