# C02 — bounded producer/authentication investigation

> **Current disposition, 2026-10-20:** owner approved C02-D1 **as written**;
> scoped AC6 and charter/dependency amendment applied. R03 is closed for P1A's
> contract-only scope. Concrete authenticated producer qualification remains
> mandatory before high-trust legacy backfill; **zero positive producer coverage**
> is established. See [exact approval](owner-c02-rlp-disposition-2026-10-20.md)
> and [current checklist](p1a-readiness-checklist.md). The original investigation
> and proposed/alternative wording below are retained as history, not pending
> approval or current AC6 timing.

Recorded: 2026-10-20 UTC; Pi `01a15670-07d5-705a-9168-0803b9f394ae`.  
Result: **investigation complete for the named local surfaces; C02 remains open**.  
No implementation, provider/auth/account access, live data, database query or paid dispatch.

## Question and required proof

P1A AC6 requires concrete trusted legacy migration source-kind allowlists from
existing governance/system producers. A qualifying row needs **all** of:
producer identity/version, exact emitted token, authenticated admission binding,
payload/subject/scope binding and trustworthy evidence for legacy records.
Neither a plausible label nor permission to write a memory proves the source's
truth/standing. Receipt reference syntax is not receipt verification.

## Revisions and finite search boundary

[Machine evidence](evidence/readiness-verification-01a15670.json) records source
HEADs/status and raw/newline-normalized comparisons against the exact Git blobs:

- Cortex root `684785f220c066e8686e160eec2611c727582a00` (dirty worktree-link/skill
  assets preserved), plus accepted P4b worktree `360a3d6e63c8762a6fb10cd39d071ef5dff6e89d`
  (clean). Root includes accepted merge `69cd4f8` by local ancestry check.
- Accepted Gateway P5a preparation worktree `b3a4b1b529ea0b804c07c681c69de8d4e2aebfdf`
  (clean), **not just the older original Gateway root** `d6376fd024d43be7ff458af675c646ae93c52492`.
- Collective root `461e2767a046418b098766090723e0cc34d9edc7` (clean).
- Bridge source `D:/Repos/keon-cortex-mcp-bridge/src/keon_cortex_bridge/` inspected
  as an unversioned source workspace; no accepted-base claim.

Searched the named roots' source for `source_kind`, `sourceKind`,
`CandidateProvenance`, `MemoryShardCandidate` and `CivicMemoryAnchorSet`, then
traced the actual writer/ingress/event/reference validators below. This does not
prove that no qualified producer exists in any other repository, deployment,
private branch or external evidence system. No further ecosystem-wide search
is needed without a concrete additional producer/reference from its owner.

## Evidence chain

Paths below are relative to their named repository/worktree.

| Surface / locator | What it actually establishes | Why it does not close C02 |
|---|---|---|
| Gateway accepted H1/P5a `Tools/Cortex/CortexMemoryWriteHandler.cs:38–147` | User arguments include `content`/`source`; Runtime decides `cortex_write`; approved writes pass `decision.ReceiptId` to Cortex. | This is write-effect governance, not an authenticated claim that content is a deterministic system event. `source` remains a caller argument. |
| Same Gateway `Backends/CortexClient.cs:29–42,96–126` | Typed ingest request has no structured source-kind; JSON contains content/source/type and `issuedBy = keon-mcp-gateway`. | It emits **no `provenance.source_kind`**. Hardcoding issuedBy identifies the transport producer, not the content's evidentiary origin. No trusted source-kind token can be inferred from this writer. |
| Cortex `ingress/models.py:197–260,329` | CandidateProvenance source_kind is optional and syntax-validated using the bounded identifier rule; candidate accepts optional provenance. | No closed authenticated producer registry or protected source-kind assignment is present at this seam. |
| Cortex `api.py:456–473,677–730,1157–1270` | Gateway service authentication; trusted caller scope; receipt-header presence/token format; candidate source_kind copied into persisted Provenance. `_receipt_ref` explicitly anchors an opaque ID, hashing the ID rather than remotely verifying a receipt payload. | Service authentication/scoping is not semantic source authentication. Candidate labels can survive unchanged; the attached pointer is not a verified source attestation. This is not an allegation that deployed v1 currently assigns v2 numeric trust. |
| Cortex `services/memory_events.py:1–59`; `api.py:1630–1670` (also checked in accepted P4b) | Reference existence/visibility, idempotent event accounting; `supported` attribution rejected with `supported_attribution_unavailable`; outcomes remain self_reported, evidence refs unverified. | A persisted Outcome/Correction/spine event does not become a verified successful outcome or deterministic truth about its payload merely because logging was deterministic. Do not bypass OPMEM's explicit hold. |
| Collective `Society/CivicMemoryContracts.cs:34–77` | CivicMemoryAnchorSet requires nonempty canonical evidence/artifact references and validates IDs. | It supplies shape/reference requirements, not a Cortex migration producer/authentication mapping. |
| Collective `Cognition/EvidenceSourceKinds.cs:14–34` and Core `Cognition/EvidenceAnchorValidator.cs:1–16,67–90` | Closed tokens `cortex:influence-receipt`, `cortex:temporal-receipt`, `cortex:shard`; pure grammar checking, no file/network verification. | These are **reference kinds**, not CandidateProvenance source-kind producer admissions. Similar names cannot be transplanted as a high-trust allowlist. |
| Bridge `models.py:95–120`, `service.py:54–95`, `http_port.py:11–17,61–62` | SourceRef kind is agent/user/tool/artifact/import; service adds configured identity and forwards a proposed append payload. | Different proposed append contract, no proved translation to the accepted Cortex shards ingress or authenticated high-trust legacy source admission. A local source label alone cannot qualify. |
| Cortex `services/fact_routing.py:1–28,36–74` | Deterministic duplicate/reinforcement/evolution routing with tenant checks. | Deterministic processing of a claim is not proof of the originating claim's standing. |

**Concrete currently evidenced high-trust migration producer rows: zero.** This is
an evidence result, not a decision to delete the positive migration requirement
or automatically accept an empty allowlist as P1A completion.

## Proposed contract negatives (not implemented tests)

The eventual P1A admission fixtures should explicitly distinguish:

1. Same token from an unbound producer vs a genuinely authenticated source.
2. Gateway-issued/approved memory write vs verified content-origin attestation.
3. Receipt pointer, ID hash or grammar-valid reference vs verified issuer/payload.
4. Self_reported outcome vs supported execution outcome; no reinforcement shortcut.
5. Authentic proof for a different tenant/role/profile/payload vs matching evidence.
6. Missing/unknown/extractor labels and bridge source kinds: no implicit .85 upgrade.

This names needed fixture semantics; it does not invent accepted producer tokens,
run receipt verification, or grant new fixture/source mutation authority.

## One unresolved disposition — C02-D1

**Recommended:** explicitly split concrete producer admission from this foundation
increment, preserving the trust rules and a fail-closed migration gate. This is
a **proposed scoped amendment**, NOT an implementation or a waiver already made.
It affects P1A AC6 and the concrete-allowlist timing in charter D12 only; no
repeat ratification of Gate 1/S01–S12 is requested.

Proposed replacement for P1A AC6, if the owner approves this scope change:

> Define the versioned legacy provenance-admission contract and fixtures. A
> high-trust migration requires an exact producer/version/source-kind mapping
> plus authenticated admission bound to the original record, content identity
> and authorized scope; source_kind membership, issuedBy and receipt_ref presence
> alone never confer trust. Record that no concrete high-trust producer is yet
> qualified from inspected evidence. Missing, unknown or unauthenticated legacy
> sources remain unverified_candidate; do not invent a positive allowlist or claim
> positive producer coverage. Concrete producer allowlist freeze and independent
> authentication evidence are a prerequisite of the later bounded ingestion/
> migration contract before P3 may run a high-trust legacy backfill. P1A may close
> its contract-only deliverable with this dependency explicitly open; that is not
> acceptance of a trusted migration, a live verifier or overall P1/Wave-1 readiness.

Also carry that exact later gate into D12/dependency records; no changes to numeric
trust formulas, kinds, allowed source files, v1 behavior or runtime admission.
P2/P3 must shape the exact bounded admission seam before implementation; this note
does not create or authorize another parcel. Refresh the review packet once if
this amendment is accepted; the reviewer must see the actual accepted disposition.

**Alternative if preserving current AC6 timing:** keep P1A blocked and have the
existing source owner provide one exact producer repository/revision/path plus
its authenticated payload-bound proof contract. Inspect only that named lead;
do not guess tokens, expand to a broad platform audit, or reopen unrelated law.

Until the owner disposes C02-D1, **current P1A/charter text and blocker remain**.
