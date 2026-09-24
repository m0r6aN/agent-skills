# D13 alpha-eligibility ruling brief

## Context

The Routing Currency and Merit goal uses a versioned local catalog projection for
replayable routing. Ratified D13 requires every `provider:id` pair to resolve against
exactly one enumerated provider key with a matching approved `baseUrl`; zero or
ambiguous resolution is a refusal. The current P0 evidence package is incomplete and
does not authorize P1 or downstream routing.

## Inventory

- Requested identity: `openrouter / typesafe/jev-1.13`.
- Supplied host-owner catalog projection: chat/completions-oriented model records; the
  requested identity has zero matches.
- Supplied settings projection enables `openrouter:typesafe/jev-1.13`.
- Exact projector result: `MISSING_MODEL_REFUSED`.
- One coordinator-authorized POST was made to
  `https://openrouter.ai/api/alpha/decisions` with the requested model.
- Response: HTTP 200, JSON, response model `typesafe/jev-1.13-20260917`, provider
  `TypeSafe`, response ID `gen-dec-1789928401-sPUpnAUmu5pVtk95zfsT`.
- Server response time from that ID: `2026-09-20T18:20:01Z`; client observation:
  `2026-09-20T18:20:11.038Z`.
- Provider-reported usage cost: `0.000017934`; currency was not specified.
- The same `OPENROUTER_API_KEY` was accepted for this alpha call. Chat/completions
  key coverage was not tested.
- No retry or second call was made. No key value or request header was recorded.
- HAWF remains exactly `escalated-unresolved / downstream hold`; P1 remains held.
- Current evidence records alpha servability but leaves D13 routing acceptance
  unresolved; no Gate 1 amendment has been ratified.

## Your task

Recommend one governance disposition:

1. Keep D13 unchanged and treat alpha Decisions as external servability evidence only;
2. Reopen Gate 1 and amend D13 to define alpha Decisions as a distinct eligibility
   surface; or
3. Identify a third disposition that preserves replayability, exact identity, and the
   no-silent-substitution rule.

Judge the minimum safe next step, whether P1 may proceed, and what evidence an amended
eligibility surface would require.

## Output contract

Deliver EXACTLY: `TOP 5 BRUTAL FINDINGS` (numbered, one line each), then `TOP 5 MOVES`
(numbered, one line each, implementation-ready). Plain text only, max 350 words.
