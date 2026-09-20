# RCM-P0 drift report — incomplete reconnaissance

Status: **blocked evidence delivered; no positive live claims; not accepted for downstream consumption**.
Repository commit: `1ec2b1012d5290851e924cc91137ec3f09122820`.
Repository observations: 2026-09-20T15:23:52.9276997Z; independent reacquisition: 2026-09-20T15:24:22.7814460Z.
Authority: coordinator execution release R1, transcribed in `rcm-p0-environment-map.md`.
Source IDs resolve to exact repository paths, timestamps, byte formats and SHA-256 in
`rcm-p0-catalog-snapshot.v1.json#/sourceRefs`. Repeatable commands are in
`rcm-p0-verification.md`; host source IDs H01-H04 are explicitly unbound.

## Rework qualification

R1/R2 process authorization is explicitly bound in the environment map and
verification record to task `01a0bf3f-559b-7291-a20e-8d8a4bbb16b3`, ratified
directive commit `96b6e39`, and “Grant Gate 2 for RCM-P0 and RCM-P1”.
It supplies no host-source evidence or downstream release.

RW02 completed 167 fresh pre-edit repository/evidence checks. RW04 documents
the corrected verification: exact approved-role/root containment before source
metadata/hash access, reparse/credential/URL rejection, 45 classification cited-line
checks, 15 tier cited-line checks, and all six arrays compared in exact policy order.
Changed-locator and reversed-economy negative controls refuse in memory.
These are evidence-procedure controls, not production runtime enforcement.

Fresh rework source access is limited to S01 and S03–S13. Prior S02/S14 evaluator/
dispatch observations below are retained historical evidence; neither source is
read, rehashed or newly attested during rework. All bounded repository observations
remain separate from blocked host claims. Original acquisition times are preserved.

## F1–F6

All six overall verdicts are `blocked`, specifically `blocked-secret-boundary`.
Repository-only subfindings below do not validate historical host hypotheses.
No blocked hypothesis is classified as reproduced or not-reproduced; no locked
decision is invalidated by absence of evidence.

| Finding / charter hypothesis | Current observation and calculation | Verdict, comparison and accountable next action |
|---|---|---|
| F1 — economy first pick is text-only (S03:104) | S01:18-20 selects economy for boilerplate. S01:191 puts Nemotron first; it appears in public/internal/restricted at 91/114/137. S02:74-78 exposes class, classification and workflow ID; S02:204,210-224 selects the first classification-eligible tier entry with no modality predicate. Static repository selection therefore exposes Nemotron for all three classifications, conditional on this policy being loaded. Catalog exact match, input modalities, approved host endpoint and installed policy parity are unknown. | **blocked**. Policy order and static omission are observed; text-only/image-bearing runtime failure is not reproduced. Coordinator/host owner must establish safe acquisition; P4/P4A own actual execution proof. No evaluator was called. |
| F2 — GLM text-only at standard position four (S03:105) | S01:174-181 gives GLM position **4 of 6**, after Sonnet, Gemini Flash and GPT Terra; all three predecessors and GLM appear in each classification. With the current repository classification lists, GLM is not the selected primary. First-eligible logic could expose it only if all three predecessors become ineligible; no health/quota fallback is implemented by the observed loop. GLM catalog capabilities remain unknown. | **blocked**. Fourth position reproduced as a repository fact only. Text-only claim and execution effect unverified. P4/P4A own runtime closure. |
| F3 — Nemotron price drift (S03:106) | S01:13-14 dates comments to 2026-09-03, per 1M input/output tokens; S01:191 records USD 0.065 / 0.18. Historical comparison operands 0.08 / 0.20 yield 23.076923% input and 11.111111% output, separately, using (new-old)/old*100 (C04). Those newer operands are charter history, not acquired catalog rates. Current numeric rates and units are unavailable. | **blocked**; current price comparison refused. Never compare token rates with per-parcel ceiling_usd. Unknown units/prices or a zero denominator refuse. Safe measurement belongs to a later authorized acquisition; P6 owns proposal work. |
| F4 — enabled/default phantom references (S03:107) | Host enabled/default references, inventory counts, exact match counts and endpoints are all unknown. Missing/total = unknown/unknown, not 4/5, not 0/0. Empty snapshot arrays mean unobserved, not absent. Jev disposition below. | **blocked**. Cannot enumerate any current enabled/default list safely. Host owner must supply a bound safe export; correction requires separate human authorization, with P7 owning projection work. |
| F5 — opencode/opencode-go namespace mismatch (S03:108) | Configured opencode key/endpoint: unknown. Configured opencode-go key/endpoint: unknown. Each corresponding catalog namespace/endpoint: unknown. Approved current configuration authority: unavailable. Both comparisons independently refuse. | **blocked**; historical mismatches neither reproduced nor dismissed. Equal endpoints never permit provider aliasing. Cached endpoints cannot approve themselves. Coordinator/host owner own authority and safe-source prerequisites; later resolver/projector parcels own enforcement. |
| F6 — all 15 policy IDs current (S03:109) | Independent repository derivations C04/C05 yield frontier 5 + standard 6 + economy 4 = 15 entries, 15 distinct IDs, zero duplicate tier IDs; each classification has the same 15 distinct IDs and no references outside tiers. Every catalog join in the table below is blocked. Present/total = **unknown/15**; catalog duplicates, absent and mismatched rows are unknown. | **blocked**. Historical 15/15 is not current evidence. No uptime, exact installed endpoint, or provider availability claim. P1 may consume only coordinator-accepted evidence and must preserve refusals. |

## Exact-ID join inventory

Order below is repository tier order, never price or merit order. Required provider is
`openrouter`; no approved current installed endpoint source was acquired. The repository
D10 endpoint is contractual evidence for Jev, not proof of a host configuration.
No case folding, alias substitution, dot/dash conversion, suffix removal, or URL trimming.

| Tier | Position | Exact repository ID | Source | Catalog join |
|---|---:|---|---|---|
| frontier | 1 | `anthropic/claude-opus-5` | S01:166 | blocked-secret-boundary; match count unknown |
| frontier | 2 | `openai/gpt-5.6-sol` | S01:167 | blocked-secret-boundary; match count unknown |
| frontier | 3 | `google/gemini-3.1-pro-preview` | S01:168 | blocked-secret-boundary; match count unknown |
| frontier | 4 | `anthropic/claude-fable-5.1` | S01:169 | blocked-secret-boundary; match count unknown |
| frontier | 5 | `openai/gpt-6-astra` | S01:170 | blocked-secret-boundary; match count unknown |
| standard | 1 | `anthropic/claude-sonnet-5` | S01:174 | blocked-secret-boundary; match count unknown |
| standard | 2 | `google/gemini-3.8-flash` | S01:175 | blocked-secret-boundary; match count unknown |
| standard | 3 | `openai/gpt-5.6-terra` | S01:176 | blocked-secret-boundary; match count unknown |
| standard | 4 | `z-ai/glm-5.3` | S01:179 | blocked-secret-boundary; match count unknown |
| standard | 5 | `x-ai/grok-4.6` | S01:180 | blocked-secret-boundary; match count unknown |
| standard | 6 | `meta/muse-spark-1.3` | S01:181 | blocked-secret-boundary; match count unknown |
| economy | 1 | `nvidia/nemotron-3.5-lightning` | S01:191 | blocked-secret-boundary; match count unknown |
| economy | 2 | `openai/gpt-5.6-luna` | S01:192 | blocked-secret-boundary; match count unknown |
| economy | 3 | `google/gemini-3.1-flash-lite` | S01:193 | blocked-secret-boundary; match count unknown |
| economy | 4 | `anthropic/claude-haiku-4.5` | S01:194 | blocked-secret-boundary; match count unknown |

Classification outside-tier IDs: none in each of public, internal and restricted
(S01:73-137; C04/C05). Catalog-side duplicates/absence/mismatches are unmeasured.

## Supporting charter observations

S03:64-98 labels the old snapshot as design input. Provider/model counts, schema/key
inventory, modality values, output-modality absence, reasoning coverage, context ranges,
thinking-map coverage, provider refresh times and default thinking level are all
`blocked-secret-boundary` now. Historical 13/608/341 and similar values receive no
current evidentiary credit. No visible quality-field absence or merit conclusion is made.

Sentinel prices, meta-router IDs and model variant IDs in the host catalog are unobserved.
S01:157-161 documents variant restrictions, and S03:137-149 discusses historical
sentinel/meta-router examples; these are hypotheses/contract context, never new candidates.
Credential-bearing fields are deliberately excluded; safe schema coverage itself is
unavailable. Deliberate credential exclusion is not a missing required routing fact.

## HAWF/INDEX disposition

**escalated-unresolved; downstream hold remains.**

- S07:6 says HAWF is SUPERSEDED, historical and non-dispatchable.
- S06:12 still advertises awaiting_coordinator_claim in the pickup queue;
  S06:50-52 requires stop-and-reconcile on conflicting goal/index state.
- S08:5,10 still says UNCLAIMED / awaiting_coordinator_claim.
- R1 clause 4 explicitly permits this evidence and requires escalated-unresolved.
  R1 was received before 2026-09-20T15:22:22.2949213Z; its exact message timestamp
  is not exposed. This is a receipt upper bound, not an invented ruling time.

Proposed reconciliation: the RCM coordinator should route correction of the stale
pickup row and stale HAWF directive state to the superseded/non-dispatchable disposition,
preserving historical provenance and respecting HAWF authority. The RCM coordinator
owns this ruling/escalation, **not HAWF ownership**. No INDEX, charter or directive was
corrected. Escalation satisfies reporting only; unresolved authority blocks P1 and
affected downstream dispatch. Exact control hashes: S06/S07/S08 in the snapshot manifest.

## Jev disposition and correction proposal

Required tuple: **openrouter / typesafe/jev-1.13 / https://openrouter.ai/api/v1**.
S09:29,58,68-69 confines it to recommend-only routing/classification; never prose,
implementation, approval, merge, release or policy bypass.

Current identity/membership/capabilities: **unverified**. Evidence disposition:
**refused/disabled-lane**, per R1 clause 5; this is not a claim of runtime disablement.

Proposal: a separately authorized host owner supplies a current credential-free,
source-bound catalog/settings projection plus approved endpoint authority. Verify
exactly one case-sensitive tuple and every default/enabled reference. Keep the lane
refused while unavailable, ambiguous, mismatched or stale. A human separately authorizes
any host correction; P7 may later propose a governed projection. No substitute identity,
host patch, installation or live change is performed here.

## Consumption and remaining holds

The snapshot is incomplete evidence only. Refuse positive consumption on missing,
partial, stale, changing, digest-mismatched or namespace-mismatched input. Daily cadence
is ratified; 86400 seconds is only a proposed TTL. No required host time or accepted
freshness bound exists, so freshness acceptance is refused. Repository rereads cannot
renew cache age. No snapshot is installed as routing authority, an availability
guarantee, a GMF execution receipt, or permission to dispatch.

Holds: safe source/authority acquisition; host identities and F1-F6 measurements;
freshness TTL and source times; installed parity; HAWF ownership reconciliation;
Jev lane; compatible preinstalled lint tooling; post-rework coordinator-routed frontier
review (including security focus); coordinator acceptance. The coordinator reports two
prior frontier reviews that requested this rework; their full reports were not acquired
by this builder. P0 neither amends frozen
contracts nor adds inputs/min_context/thinking_level/expertise schema fields.
