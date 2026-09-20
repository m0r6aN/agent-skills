# RCM-P0 review triage

## Disposition

**Accepted as an incomplete evidence handoff only.** This is not full RCM-P0
acceptance, not downstream release, and not authorization to consume the catalog
snapshot for routing, dispatch, merit, or live authority.

The handoff remains in the builder worktree and is not merged:

- Worktree: `C:\Repos\foreman-line-routing-currency-merit-rcm-p0-builder`
- Branch: `codex/rcm-p0-builder`
- Baseline: `1ec2b1012d5290851e924cc91137ec3f09122820`
- Scope: exactly the four RCM-P0 evidence files named by the spec; no commit was
  created and no tracked files changed.

## Review record

Two fresh, independent post-rework frontier reviews were completed after NR00–NR05.
Both were read-only and independently checked the artifacts, governing documents,
bytes, hashes, and current control excerpts.

### Review A

- Blocking: none.
- Should-fix: none.
- Nit: two narrative references say NR01/NR05 are “below” even though the sections
  precede the cited text. This is a navigation defect only; the archived-procedure
  warning is explicit and current reproduction points to RW04/NR01/NR05.

### Review B

- Blocking: none for the bounded handoff; full completion remains blocked by the
  disclosed host/evidence holds.
- Should-fix: none.
- Nit: the archived section still calls itself an “Exact command ledger” although
  its BOM predicates are explicitly corrected/non-verbatim; the same navigation
  wording points the wrong way. No current acquisition path is enabled by this.

## Rework closure

The prior blocking BOM finding was reproduced directly: all four artifacts are
strict UTF-8 without BOM, LF-only, and zero CRLF. NR00–NR05 corrected the claims,
used byte/ordinal BOM predicates, added synthetic BOM/no-BOM controls, and marked
the historical C08/C09 actual-BOM diagnosis unsupported/misdiagnosed. Current
reproduction guidance marks archived C04/C05 as historical and points to RW04,
NR01, and NR05. The earlier-read/safety-gate chronology limitation remains
disclosed rather than retroactively claimed closed.

Coordinator closure verified:

- RW04: 185 checks, shell exit 0, seven native exits 0.
- NR01 and NR01b: 28 checks each, shell exit 0.
- NR02/NR03: 185 checks each, shell exit 0, seven native exits 0.
- NR04: 7 checks, expected refusal, shell exit 1.
- NR05: 34 checks, shell exit 0, four native exits 0.
- Node: `v24.7.0`; the documented shaping/lint engine requirement remains
  `>=24.11.1`, so coordinator lint is still outstanding.
- Final bytes: all four files UTF-8 without BOM, LF-only, zero CRLF.

Final SHA-256 values:

| Artifact | SHA-256 |
|---|---|
| `rcm-p0-drift-report.md` | `56183f98db34615d211c8dfffb0f13478356b278f4dd31bee3cd0c096aa9527f` |
| `rcm-p0-catalog-snapshot.v1.json` | `246a37dde67f3bd0663e40afeb739bdfbcab97ee7b669655acbe1d2e893b2917` |
| `rcm-p0-environment-map.md` | `b736fb0765145044c008500451568bdce78a164db8a7c09865437b4f1f9905db` |
| `rcm-p0-verification.md` | `1f0829f4b9baff0f5a7e14559fcbedc236bd04b1c40694fa06cb0c0082b77c31` |

## Holds and next gate

F1–F6 remain `blocked-secret-boundary`; the snapshot is `complete:false` with
freshness refused and no observed providers/models; HAWF remains
`escalated-unresolved` with downstream hold; Jev remains refused/disabled-lane
evidence only; installed parity, endpoint identity joins, accepted TTL/source
times, and host measurements remain unavailable; C06/C13 and the earlier-read
gate limitation remain retained.

Do not dispatch RCM-P1, promote routing, write Pi settings, discover credentials,
call the network, spend with a provider, or merge the builder branch under the
current directive. The next required decision is human Gate 3 for the bounded
RCM-P0 evidence handoff. A later Gate 2 decision is required before any parcel
outside the explicitly granted initial set is dispatched.
