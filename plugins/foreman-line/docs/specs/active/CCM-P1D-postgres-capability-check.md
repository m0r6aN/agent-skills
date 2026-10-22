---
ticket: CCM-P1D
title: Read-only PostgreSQL capability check and evidence
status: active
owner: clinton.morgan
created: '2026-10-19'
updated: '2026-10-19'
risk: standard
surfaces: [scripts/ccm_check_postgres.py, tests/test_ccm_postgres_capabilities.py, docs/specs/ccm-postgres-profile.md]
routing_class: implementation/standard
verification_class: equivalence-provable
expertise: engineering
inputs: [text]
permission_profile: builder-standard
data_classification: internal
thinking_level: low
---

# CCM-P1D — Database capability evidence, not provisioning

## Intent

Produce a credential-safe, bounded, read-only capability command with a machine-readable report for the PostgreSQL profile that future CCM storage/retrieval needs. This is an executable prerequisite check, not permission to access Neon, install extensions, change a database or certify recall performance.

## Constraints

- Sole repository: `D:/Repos/keon-omega/keon-cortex`; observed source HEAD `684785f220c066e8686e160eec2611c727582a00`. Pin an accepted clean dispatch base and P1A schema/DDL version. No dependency on P1B/P1C or live cloud permission. Same-repository worktrees must remain isolated and mutations disjoint.
- Required capabilities: PostgreSQL server with installed pgvector extension version >=0.8.0, iterative HNSW support, pg_trgm installed and built-in tsvector/ts_rank_cd behavior. Use the repository's existing PostgreSQL driver, not a new dependency. If its supported connection API is unavailable, return that precise blocker instead of replacing the stack.
- Connection secret comes from a named environment variable (`CCM_CHECK_DATABASE_URL`), never an argv value or committed example DSN. CLI optional `--output` selects a report path outside source by default stdout. No secret/env/hostname/connection-string/error-payload echo in success or failure. No network connection unless the named variable is explicitly supplied in an authorized test environment.
- Execute catalog/feature queries in a read-only transaction with statement_timeout <=5000ms and bounded connect timeout. No CREATE EXTENSION, DDL, index creation, writes or production benchmark. Reading server version/catalog capabilities is not proof of deployed scope enforcement or SLOs.
- Version comparison parses numeric major/minor/patch (0.10.0 exceeds 0.8.0); unrecognized/prerelease formats are reported unsupported/unknown, not lexically compared or guessed. Do not report iterative HNSW supported merely from a successful database connection.

### Report and exit contract

Output one versioned JSON object with `schema_version: ccm-postgres-capabilities/1.0`, P1A contract version, sanitized observation time, postgres version, installed extension versions, feature booleans, overall status and closed error codes. Status values: pass, unsupported, unavailable. Include no database endpoint/user/tenant data. Missing required extension/version/feature yields unsupported and exit2; absent configuration/connection/query failure yields unavailable and exit3; all supported yields pass and exit0. Invalid command arguments follow argparse usage behavior without exposing supplied secrets.

Check `pg_extension` for installed vector/pg_trgm, server built-in FTS with a constant literal input (no user document), and iterative-scan setting via a supported read-only feature probe after loading/recognizing vector capability. If a setting requires unsafe mutation or cannot be established under read-only constraints, mark unsupported with `iterative_scan_unproved`, never manufacture a pass. Stable sanitized codes distinguish missing extension, too-old version, unknown version, missing feature, timeout and unavailable connection.

## Acceptance Criteria

1. New command implements the exact report/exit contract using current driver facilities, numeric version parsing, bounded read-only queries and safe exceptions. No database/env contents appear in reports or test evidence. Output-file write failure returns unavailable with a sanitized code; no accidental default source-tree artifact.
2. Worked positive profile: vector0.8.0, pg_trgm installed, iterative setting and FTS supported ->pass/0. Boundary profiles vector0.7.4 ->unsupported/2; vector0.10.0 passes its version check; missing config ->unavailable/3 without connecting; vector missing or unknown version cannot pass.
3. Deterministic unit cases cover each status, numeric comparison and sanitization of an exception deliberately containing a planted synthetic DSN/password. Query construction tests verify read-only transaction/timeout settings and lack of DDL. These unit tests alone are not database evidence.
4. On a separately authorized disposable real PostgreSQL instance, run the command and retain sanitized JSON, server/extension versions, probe outcomes, exact tool version/base and execution environment label. Use the existing real database test configuration; no mocks for this capability evidence. If unavailable, explicitly report the unmet environment gate rather than skip it or claim P1 complete.
5. A named target-profile verification is still required before P4 enables its pgvector path. Local proof does not certify Neon. Any actual Neon/remote access is a separate approved operational action; no credential lookup, rotation, cloud deployment or extension install is authorized by this packet.
6. Profile documentation states unsupported behavior and the later benchmark envelope: fixed hardware/DB configuration, graph fan-out, shard/document sizes, tenant/scope selectivity, cache condition, concurrency, repetitions, retrieval quality and end-to-end timing. Preserve <=150ms recall at100k shards/500k nodes, <=300ms briefing and >=500 repo files/min as unmeasured targets, not achievements. Prose documents need separate declared format/capacity throughput. Later import readiness needs bounded-memory resume/replay, full item accounting, storage/backlog visibility, privacy and recovery/deletion evidence.

## Out of Scope

Provisioning/installing PostgreSQL or extensions, Docker/config/package changes, Neon/production access, credentials, migrations, index builds, performance tuning, SLO measurements, connector implementation, actual personal-data imports and route-policy edits. No weakening required pgvector version to obtain a pass. No new generalized health service.

## Context & References

- [P1A normative database/graph contract](CCM-P1A-memory-graph-contracts.md)
- [Accepted decisions](D:/Repos/Pantheon/docs/CONTEXT-SHAPING-DECISIONS.md)
- [Readiness handoff](D:/Repos/Pantheon/docs/CONTEXT-SHAPING-HANDOFF.md)
- [v4 D14/D15](D:/Repos/Pantheon/docs/CONTEXT-SPEC-V4.txt)
- [Existing project dependencies](D:/Repos/keon-omega/keon-cortex/pyproject.toml)

## Allowed Files

Exact paths relative to the sole Cortex repository:

- `scripts/ccm_check_postgres.py` (new)
- `tests/test_ccm_postgres_capabilities.py` (new)
- `docs/specs/ccm-postgres-profile.md` (new)

No provisioning/dependency/config edits. Missing required additional paths stop for amendment.

## Verification Plan

From the admitted worktree/environment:

```text
python -m pytest -q tests/test_ccm_postgres_capabilities.py
python scripts/ccm_check_postgres.py
```

The second command without configuration must return unavailable/3 without network access. Repeat it with CCM_CHECK_DATABASE_URL set by the authorized operator/test harness for a disposable real database; capture output in an approved evidence directory, not a committed raw environment dump. Explicitly distinguish deterministic unit results, authorized real-local evidence and still-pending target-profile evidence. No live check is executed during shaping.

Mandatory reviewer questions: Can an error leak connection secrets? Is numeric version comparison correct? Can missing/unproved iterative-scan support pass? Does a local result falsely certify Neon or a scale SLO? Are all statements read-only and bounded? Applicable independent acceptance remains required even though this verification class is equivalence-provable.

## Dispatch Envelope and Completion

Target <=~16k initial supplied tokens: this spec, P1A capability contract, driver API excerpts, fixtures and exact commands. Omit blanket context override; derive real model capacity. Pin clean exact base/dependencies, existing baseline and cheapest qualified exact route/fallback with data/tool permission. No model identity belongs in frontmatter and no existing session model changes implicitly.

At most one implementation plus one focused repair, then a reproducible blocker. No numeric spending/time/tool/token budget exists here: authorize and record the whole dispatch/review/retry envelope and runtime enforcement limitations before paid launch. Real DB/remote authorization is separate. Completion reports changed files, test/evidence results, sanitized capability JSON, source/profile versions, limitations, actual usage and estimated/unknown cost; never self-approval, promotion, merge or deployment readiness.
