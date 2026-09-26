# DIRECTIVE — HRO-P1 shape (2-seat council + Luna)

**Evidence:** hro-p1-brief.md, luna-verdict.txt, claude-out.txt. Grok failed to
produce output after two launch attempts; Gemini produced no usable output.

## Verdict

The HRO-P1 goal is sound, but the original draft is too broad for one
architecture parcel. Its contract boundary must be separated from evaluator and
receipt wiring, and active-owner handoffs must precede any shared-file edit.

## Convergent Findings

- P0: shared routing-policy and dispatch ownership blocks direct implementation.
- P0: the current evaluator returns a single model ID and throws fixed errors;
  mapping output and typed rejection require an explicit compatibility contract.
- P1: freshness, endpoint availability, and fallback rejection are not all
  offline-testable and must not be smuggled into this parcel.
- P1: Node 24.7.0 is below the packages' declared 24.11.1 minimum.
- P1: Jev authority, receipt format, and global configuration must remain
  separate boundaries.

## Execution Plan

1. Keep HRO-P1 as the umbrella draft and split execution into P1a (mapping
   contract/fixtures) and P1b (consumer integration).
2. P1a defines exact mapping fields, provenance/version semantics, near-miss
   rejection fixtures, and compatibility with existing OpenRouter behavior.
3. P1b wires the existing evaluator only after P1a and owner handoffs; it
   defines whether compatibility uses typed results or a versioned error
   extension without silently changing callers.
4. Defer endpoint availability, catalog refresh, fallback, receipts, Jev,
   config writes, and live verification to their charter parcels.
5. Verify under Node >=24.11.1 before treating package results as authoritative.

## Rules of Engagement

- One owner per shared file; no parallel edits to policy, schemas, exports, or
  dispatch evaluator.
- No new standalone router, regex identity inference, provider call, fallback,
  global Pi config mutation, or receipt schema.
- Every parcel stops on contract change or missing handoff.
- Independent review is evidence, not implementation authority.
