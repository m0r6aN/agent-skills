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

## Combined source-string budget repair — 2026-09-26

Repair release: 8d75bfde7d7010d4412bd9f8f9d39c34807915d7; accounting
clarification: 4a7e59971260b7922d80f5485ab572df22ea804a. Only the existing
producer, its test file and this report changed in this repair.

The raw materializer now charges the closed input keys and string values plus
expanded identity keys/values before parsing, and seeds the existing UTF-8 parser
with that total. Decoded response strings consume the remainder of the same
1,048,576-byte budget. Raw bytes remain independently capped at 8 MiB. The
historical parser still defaults to UTF-16 with a zero initial counter; retained
v2 API and byte fixtures are unchanged.

RED: before the producer change, the independently counted combined-boundary test
accepted its exact-limit catalog input, then failed because the one-byte-over
input returned success instead of BOUNDS_REFUSED (Node 24.19.0, test-name pattern
`raw v1 combined source budget exact`, exit 1). Preliminary fixture construction
failures were corrected before this RED and are not defect evidence. A later
four-fraction-digit timestamp control reached SOURCE_REFUSED, so it was replaced
with valid metadata/response accounting controls rather than changing timestamp
validation.

GREEN: three new tests independently calculate decoded UTF-8 bytes using Buffer,
including closed-input overhead, repeated provider/key strings, catalog and
complete-absence variants, and escaped versus literal multibyte strings. Both
captures are individually below 1 MiB in the exact/one-over paired test. Existing
scope and response aggregate boundaries now include the other capture's overhead;
256-identity multibyte exact/one-over controls remain. No production accounting
helper supplies fixture expectations.

Actual Node 24.19.0 checks after the repair:

- Focused producer suite: 168 passed, zero failed/skipped, exit 0.
- Full routing-policy suite: 964 passed, zero failed/skipped, exit 0.
- Package TypeScript check: exit 0.
- Full package Biome check: exit 0; the same existing informational literal-key
  suggestion in catalog-snapshot.test.ts remains untouched.
- Actual D19 audit: exit 0, 21 packages / 198 source files, zero unruled instances,
  fixed cardinalities reconciled. No audit changes.
- Preservation: only the two authorized code/test paths changed; raw and retained
  fixtures, canonical reader, catalog adapter, public barrel and dependencies are
  unchanged. Full producer regression retains the historical byte/hash controls.
- git diff --check: exit 0.

Commands ran from routing-policy: the pinned Node executable invoked
node_modules/tsx/dist/cli.mjs with --test tests/public-observation-producer.test.ts
and --test tests/*.test.ts, node_modules/typescript/bin/tsc --noEmit, and
node_modules/@biomejs/biome/bin/biome check . . The actual D19 CLI ran from the
repository root with the verification TSX loader and this worktree's plugin root.
Local logs: rcm-n-repair-focused.log, rcm-n-repair-full.log,
rcm-n-repair-typecheck.log, rcm-n-repair-lint.log and rcm-n-repair-d19.log in the host
TEMP directory. The genuine RED is in the builder tool transcript.

This is builder verification, not independent approval. Root and another frontier
reviewer must inspect the frozen repair; combined integration and remote gates
remain. No live provider, credentials, configuration, installation, push or merge
was used.

## Escaped fixture correction

After source review at 3a976f0cf99f6732ff3a6e3ffeeacad15d34fcd7, corrected the
combined-budget test's replacement literal to emit actual backslash-u JSON escapes.
Previously JavaScript interpreted that replacement as the same literal scalar, so
that branch did not independently exercise escaped wire representation. This is a
one-line test correction only; materializer runtime and all 168 tests are preserved.
Node 24.19.0 focused producer suite: 168 passed, zero failed/skipped, exit 0.
Package typecheck and changed-test Biome check both exited 0. Full routing and D19
were not rerun for this test-only correction; their earlier results remain attached
to the unchanged runtime source. Exactly this report and the existing test changed.

## Independent acceptance and combined integration checkpoint

Root and independent frontier D approve final runtime3a976f0 after the combined
string-budget repair. Root reran168 focused tests/typecheck, inspected complete
source/repair/preservation and ran20 additional hostile/domain controls. D reran
168/typecheck/lint and independently probed genuinely escaped combined boundaries.
D then corrected the nonblocking escaped-fixture typo in testa257e50; root inspected
that exact one-line delta and unchanged runtime. The false escaped test branch is
fixed, not carried as deferred evidence. All168 focused tests/typecheck/lint passed
on that correction. No runtime source changed after the two approvals.

Combined accepted main/controller/C-closure plus N at52b3bf passed964 routing and
53 hybrid tests. Subsequenta257e50 changes only that test literal/report;3c6ca35 adds
already-reviewed P4A design ratification. Current predecessor links follow C to
done. This checkpoint is not the final combined approval or remote CI result;
those are recorded separately before merge. Production publisher/acquisition,
admission/recovery, installed authority, provider billing bounds and live measured
HRO exit remain open. No inference, credential or host configuration operation.

## Final combined approval before PR

Independent frontier D approves combinede67bb1fab5535ee65583ca2a947f3d62e9b0f491.
Actual dispatch473, contract-readers72, mutation44 and focused N168 all pass;
all four package typechecks/lints, actual D19, both changed spec lint checks,
15 local links and whitespace checks pass. N runtime exactly matches the
root/D-approved3a976f0. Root's full964 routing and53 hybrid results remain
separately scoped above; the later changes were test-literal/docs only.
The reviewer did not count its own test correction as independent approval;
root independently checked that one-line correction and runtime preservation.
No unintended owner/API/schema/barrel/dependency changes. Remote exact-head
checks and merge remain required. No offline result is production acceptance.
