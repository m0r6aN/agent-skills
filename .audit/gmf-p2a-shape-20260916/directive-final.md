# GMF-P2A shaping directive — 2026-09-16

## Outcome

The P2A durable authority/accounting store-and-migration parcel has been
shaped as a **draft only**. It is not dispatched. The governing loop remains
`gmf_p1_landed_p2a_awaiting_shape`; this artifact does not flip a status,
grant Gate 2, authorize implementation, or authorize a commit, pull request,
merge, activation, deployment, or effect.

## Exact outputs

- Draft: `D:\Repos\agent-skills-worktrees\gmf-p2a-shaping-20260916\plugins\foreman-line\docs\specs\active\GMF-P2A-durable-authority-accounting-store-migration.md`
  - SHA-256: `f0c930e457e1a462677add925eaa106541ce17ff842fa5285cebd49326bdd23b`
- Shaping result: `D:\Repos\agent-skills-worktrees\gmf-p2a-shaping-20260916\plugins\foreman-line\docs\specs\active\gmf-p2a-durable-authority-accounting-store-migration.shaping-result.json`
  - SHA-256: `2fc8a1b13dff62a71e768025f9f9b8eb71876d80f68b1989bd6957fc94875594`

The shaping worktree contains only those two untracked parcel outputs. The
keon-systems working tree is clean and no product source was changed.

## Resolved review hardening

The current draft explicitly covers:

- semantic v1/v2 classification, a recoverable legacy v1 missing-index state,
  accepted-state-only WAL transition, a reclassification lock, rollback at
  every DDL and pre-version fault point, and unchanged rejection evidence;
- `foreign_keys=ON` for every relevant connection, attempt/spend equality,
  required same-attempt receipt/reservation/slot links, and pending-state
  prerequisites for terminal and settlement records; and
- append-only protection against ordinary rewrites and `REPLACE`/UPSERT bypass.

The source registration path is now a read-only anchor, and the draft
truthfully withholds any activation or authoritative-database migration
decision rather than claiming that a merged constructor could not migrate a
configured database.

## Validation

- Frozen frontmatter validation: pass.
- Shaping advisory self-check and shaping-result schema read: pass.
- Draft whitespace/diff check: pass.
- The thirteen frozen SHA pins are syntactically valid 64-character SHA-256
  values.

Earlier independent review findings are retained in the adjacent audit
transcripts and were reconciled in the current bytes. A last external
read-only reviewer invocation was bounded and stopped after it produced no
result; it is not claimed as a verdict. The draft itself requires two fresh
independent runtime/data/security reviews of an eventual exact product diff
before a builder may close P2A.

## Next safe action

Run coordinator lint on these two shaping outputs, then present the exact
P2A-only human Gate-2 decision request. Stop unless that decision is explicit.
