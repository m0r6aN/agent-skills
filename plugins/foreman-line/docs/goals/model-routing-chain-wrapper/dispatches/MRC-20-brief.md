# Builder brief — MRC-20 (RB-6 catalogue bytes capture)

**Goal:** `model-routing-chain-wrapper` · **Spec:** `plugins/foreman-line/docs/specs/active/MRC-20-rb6-catalogue-bytes-capture.md`
**Authority:** G-GATE2-PMC (granted 2026-09-27); Wave A; write set = 3 new evidence files under `docs/goals/pi-model-configuration/evidence/rb6-catalogue-capture/` only.

## Coordinator rulings at dispatch (binding)

1. **STOP-1 approved:** the recorded digest `9aae0055…` (751,727 B) is unrecoverable; deliver a fresh re-derivable capture and a **hard non-claim** on the old digest (spec's design). Never fabricate bytes to match a digest.
2. **STOP-2 approved:** the capture object is the **public catalogue GET response body** per the RB-6 finding text. Host `models-store.json` and the SP18-frozen export artifact are forbidden sources — the spec's refusal stands.
3. **STOP-3 resolved:** `verification_class: equivalence-provable` has been added to the spec frontmatter (coordinator patch 2026-09-27; spec-linter v0.3 required field).
4. **BOUNDED LIVE-CALL AUTHORIZATION (this brief):** exactly **one** unauthenticated `GET https://openrouter.ai/api/v1/models` during implementation to capture the response body. No credentials, no auth headers, no other endpoints, no spend. Capture bytes verbatim, then run the redaction sweep (G1) before the evidence is considered delivered. (Record: the shaping probe already made one such GET on 2026-09-27T16:33:12Z — recorded, not repeated by shaping.) Any deviation = stop and report.

## Builder rules

Step 0 restate-and-stop FIRST (restate, confirm the evidence dir does not yet exist, pre-state greps, flags) — **no live call during Step 0**. Then implement: the single GET, the three evidence files per spec, the verification set V1/V2 + greps G1–G5. No commits/PRs. Completion claim maps acceptance criteria to the verification outputs (expect `DIGEST-COMPARISON PASS`, `RECORD-RELATION PASS`, G1 zero matches, G2 0/3, G3 4/1, G4 0, G5 empty).
