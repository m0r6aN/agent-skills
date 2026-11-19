---
ticket: CTX-M5
title: Retrieval quality gates and regression/scale benchmark harness (M5a landed; M5b remaining)
status: draft
owner: clinton.morgan
created: 2026-10-30
updated: 2026-10-30
supersedes: null
superseded_by: null
risk: standard
surfaces:
  - src/keon/cortex/benchmark/semantic_benchmark.py
  - src/keon/cortex/benchmark/quality_gate.py
  - src/keon/cortex/benchmark/runner.py
  - src/keon/cortex/benchmark/report.py
  - src/keon/cortex/benchmark/fake_provider.py
  - src/keon/cortex/benchmark/provider_adapter.py
routing_class: implementation/standard
permission_profile: builder-standard
data_classification: internal
verification_class: judgment-required
expertise: data
thinking_level: medium
---

## Intent

Build the honest quality-floor and measurement harness that makes "useful continuity" a measured claim: useful-retrieval gates that an empty provider cannot pass (F6 regression: today an empty provider marks 21/21 semantic cases passed and QualityGate passes with six warnings), a three-way comparison (memory-off vs plain retrieval vs Cortex), repeated-determinism checks, and reproducible scale measurements at 100 / 1,000 / 20,000 shards. The harness freezes its quantitative contract **before** any optimization: dataset, query distribution, model/version, prompt/context budget, scoring rubric, trial count, hardware/provider topology and limits are pinned, thresholds are proposed from the measured baseline and owner-approved (charter §8.2), and may not be moved quietly afterwards.

**Scope split (review F-E disposition, CD-5b):** **M5a** = the F6 useful-retrieval floor, verdict separation, determinism-as-failure, and the frozen contract record — landed 2026-10-30. **M5b** = the measured-baseline run and owner-approved frozen latency/token/percentile thresholds (CD-7), the 100/1k/20k scale measurements, and the 10k-event export budget — remaining. Claims must say M5a until M5b lands.

## Constraints

Dependencies: P0 baseline (the recorded prior suite and known-skip inventory); standalone quality-floor work can start immediately (charter §5 M5). Isolation verdicts stay separate from usefulness verdicts: the useful-retrieval gate failing for an empty provider must not be conflated with an isolation/perf verdict. Frozen gravity mathematics and pinned scoring versions are untouched; M5 measures, it does not retune ranking. The evaluation corpus may not be tuned to make a demonstration pass; any corpus change after freeze is a recorded amendment.

Threshold governance (CD-7, proposed default **pending disposition Q4**): the builder measures the baseline and **proposes** frozen quality/latency/token thresholds; the owner approves them before the candidate implementation runs against them. The builder never lowers a threshold to pass. Benchmark sizes follow the charter proposal (100 / 1,000 / 20,000 shards with varied eligible fraction and history depth) and report recall p50/p95/p99, ingest throughput, DB round trips, peak memory and context tokens.

Real-provider CI behavior: fails for missing required configuration or skipped required cases — a local suite with skips is explicitly incomplete (charter §8.1). No new model calls are added to Cortex core; benchmark model invocations stay inside the benchmark harness with declared provider identity.

## Allowed Files

- src/keon/cortex/benchmark/semantic_benchmark.py
- src/keon/cortex/benchmark/quality_gate.py
- src/keon/cortex/benchmark/runner.py
- src/keon/cortex/benchmark/report.py
- src/keon/cortex/benchmark/fake_provider.py
- src/keon/cortex/benchmark/provider_adapter.py
- tests/benchmark/test_quality_gate.py
- tests/benchmark/test_semantic_benchmark.py
- tests/benchmark/test_determinism_and_thresholds.py

## Migration & Compatibility

Existing benchmark CLI/report consumers keep their interfaces; report output gains explicit isolation-vs-usefulness verdict separation and pinned-threshold provenance (which frozen threshold set version produced this run). Existing quality-gate warnings that masked F6 become failures per the frozen gate semantics; that behavioral tightening is recorded in the runbook/report documentation inside the allowed surfaces.

## Acceptance Criteria

AC-1 (F6 regression): the deliberately empty provider fails the useful-retrieval gate (every category asserts useful expected behavior), while the isolation verdict remains separately reported; the current pass-with-warnings behavior is a failing regression test first.
AC-2 (M5): memory-off vs plain retrieval vs Cortex run as a controlled comparison with the same frozen dataset and query distribution.
AC-3 (M5): repeated-determinism check actually re-runs the same case and asserts identical outcomes (or records nondeterminism as a failure).
AC-4 (M5): reproducible 100 / 1,000 / 20,000-shard measurements with varied candidate density, history depth and concurrency, reporting recall p50/p95/p99, ingest throughput, DB round trips, peak memory and context tokens.
AC-5 (§8.2): the quantitative contract (dataset, query distribution, model/version, budget, rubric, trial count, topology, limits) is frozen in a versioned record before optimization; threshold values are proposed from the measured baseline and carry owner approval; moving a threshold requires a recorded amendment.
AC-6: correctness zero-skip; real-provider CI fails on missing required configuration or skipped required cases.
AC-7: the existing benchmark suites pass; no change to ranking/gravity code.

## Out of Scope

Any optimization of recall quality, ranking or tokenization (M4 owns retrieval changes); lifecycle semantics (M1); the demo agent loop (M6); the 1M/10M Earn-the-Claims benchmark program (retains its original ownership); threshold adjudication authority (owner, per §8.2); production model-fleet or spend decisions.

## Reviewer Questions

1. Can any fixture or category let an empty or useless provider pass the useful-retrieval gate?
2. Are usefulness and isolation verdicts cleanly separated in every output surface?
3. Is the frozen quantitative contract complete enough that a re-run is genuinely reproducible?
4. Did any threshold move without an owner-approved recorded change?

## Context & References

- Charter §5 M5 row, §2.2 finding F6, §8.2 quantitative acceptance; S1 principles (Earn the Claims: proof means real infra)
- keon-cortex src/keon/cortex/benchmark/ (semantic_benchmark.py, quality_gate.py, runner.py, report.py, fake_provider.py, provider_adapter.py); tests/benchmark/
- P0 baseline record (prior suite: 5,787 passed / 271 skipped inventory) — inputs to the freeze record

## Verification Plan

Dedicated `tests/benchmark/test_determinism_and_thresholds.py` (empty-provider regression, determinism repeat, frozen-contract hash check) plus existing benchmark suites; a disposable-DB scale run at each pinned size with the report artifact retained. Review focus: any green path for a useless provider? Any hidden threshold drift? Receipt per charter §8.3 maps ACs to commands, records the frozen contract version and the proposed-vs-approved threshold state.
