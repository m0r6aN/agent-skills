# FK-P2B / FK-P3 window request — 2026-09-27

**Goal:** `foreman-kernel`
**Instrument:** coordination record (RS-2.4 item 2/3; no authority granted by this document)
**Status:** REQUEST PREPARED — **no window is granted**. FK-P2B and FK-P3 remain un-dispatchable until a window is recorded by the owning sequencing authorities.

## Why

RS-2.4 narrowed FK-P2 to the compiler package + hostile fixtures on FK-owned surfaces. The `mutation-scope-guard` / `dispatch/src/approval-cli` rewiring (the D10 defect fix — consuming compiled spec bodies instead of `surfaces:`) is deferred to **FK-P2B**, and FK-P3's pure-dispatch-decisions split needs `dispatch/` / routing / `skill-injection/` writes. The binding PMC↔RCM window order (`../pi-model-configuration/rcm-sequencing-decision-2026-09-26.md`) contains no FK slot; §15.2 review findings C-01/C-02/C-07 established the stop condition ("an existing goal owns a required serialization point and no safe sequence is ratified").

## Requested windows

| Parcel | Surfaces sought | Current holders | Proposed shape |
|---|---|---|---|
| FK-P2B | `mutation-scope-guard/**` input-contract seam; `dispatch/src/approval-cli` preflight seam (read compiled scope instead of `surfaces:`) | `foreman-line-boundary-routing` (shipped/owns `mutation-scope-guard`); `routing-currency-and-merit` (Window R single-writer over `dispatch/**`) | Either (a) a sequenced slot after the RCM Window-R chain merges, or (b) a narrow single-parcel write window with named exact files, fenced by the boundary-routing owner's seam review |
| FK-P3 | `dispatch/**` recorder adapters; routing/skill-resolution split surfaces; `skill-injection/` | RCM (Window R + RCM-P4A "actual dispatch integration" queued); `foreman-line-boundary-routing` (routing authority D7/D8/D10); `plugin-packaging-and-scaffolder` (P4 `skill-injection/` rename) | Sequenced AFTER RCM-P4A; negotiated with all three holders; HCS SP8/SP9 window record required |

## Counterparties (each must record agreement in their own goal record)

1. `routing-currency-and-merit` coordinator — Window R discipline ("no co-ownership at any time"); RCM-P4A sequencing.
2. `foreman-line-boundary-routing` owner — `mutation-scope-guard/` input-contract change + routing/skill-split review (its D10 Jev-line amendment and remaining nits stay on its own track).
3. `plugin-packaging-and-scaffolder` owner — `skill-injection/` rename identity (P4 residual).

## Conditions (binding on any future grant)

- Exact allowed-files lists per parcel, named in the window record; no implied neighboring-path permission (SPEC-CONVENTION §4.8).
- One writer at a time on each surface (HCS SP8/SP9); FK-P2B's seam change gets boundary-routing's seam review as part of its two-review load.
- `surfaces:` keeps its canon meaning for audit-trigger CI and skill-injection-matrix consumers (C-08/C-09); the rewiring changes ONLY what `mutation-scope-guard` treats as mutation authority.
- FK-P3 preserves boundary-routing D7/D8/D10 and the D16 split rule (pure decisions + separately authorized recorders; no receipt-chain directory sharing).

## What is NOT requested here

- No write to `routing-policy/**` (PMC/HRO/RCM lanes).
- No template/manifest/workflow surfaces.
- No relaxation of the Lane-G single-writer discipline used by sibling goals.
