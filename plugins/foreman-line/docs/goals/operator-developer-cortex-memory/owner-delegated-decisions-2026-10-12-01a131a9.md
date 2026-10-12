# Owner-delegated decisions — 2026-10-12, coordinator `01a131a9`

Authority: owner blanket grant recorded verbatim in `ownership-transfer-2026-10-12-01a131a9.md`. Each ruling below is an **owner-delegated coordinator decision**, not a human receipt. Rulings take the recommended option recorded in `open-decisions.md` unless stated; evidence was re-checked on disk where noted.

## OD dispositions

| ID | Ruling | Evidence / reasoning |
|---|---|---|
| OD-1 | **(a)** Create a new **private** repository `Keon-Systems/keon-cortex-mcp-bridge`; initial commit = byte-for-byte import of `D:/Repos/keon-cortex-mcp-bridge` (excluding `dist/` build artifacts only if `.gitignore` already excludes them); the import commit SHA becomes the P5b/P6 base. Executed when P5b is shaped, not before. The original directory is **not** initialised in place (import happens in a fresh clone path) so the unversioned original stays untouched. | Non-destructive; gives P5b/P6 a review/rollback chain. |
| OD-2 | **(a)** Ratify the snapshot pins as P1–P5 bases. | Re-checked 2026-10-12 15:58 EDT after `git fetch` (remote refs only; dirty working trees untouched): `keon-cortex` `origin/main` = `50c5f42d…` and `keon-mcp-gateway` `origin/main` = `c92e42af…`, i.e. the pins ARE current remote main. The earlier "not an object" observation was a stale local clone. |
| OD-3 | **(b)** Proceed with the verification canon + `CORTEX_INVARIANTS.md`; product-canon capability semantics are out of scope for P1–P7 and every spec must say so. | Searched `keon-docs` `origin/main` (`b6211f8`) and local Keon worktrees: no `keon_cortex_canon_v2_locked.json` exists anywhere on disk; inventing it is not possible. |
| OD-4 | **(a)** `shards/1` wire is canonical; bridge tool names are the semantic layer. | Implemented path wins; avoids a dual store surface. |
| OD-5 | **(a) as amended by R0 F-1**: §4.1 role binding PLUS verified actor binding — client headers `X-Keon-Tenant-Id`/`X-Keon-Actor-Id` may never override authenticated claims; API-key/machine-credential principals carry an enrollment-bound actor/role, never a client-asserted one. P1a manifest gains `Auth/ApiKeyValidator.cs` and `Mcp/McpCallerContextResolver.cs`. | R0 F-1 reproduced against `keon-mcp-gateway@c92e42af` by prior coordinator. |
| OD-6 | **(a)** pin from existing behaviour with a fixture at P2. | — |
| OD-7 | **(a)** measured defaults at P6 shaping. | — |
| OD-8 | **(a)** harness tokenizer, fallback bytes/4, recorded per delivery; ≥95 % within budget. | — |
| OD-9 | **(a)** canonical remote identity; path is provenance hint only. | — |
| OD-10 | **(a)** P3 ships report-only (feedback recorded, no score effect). Any numeric rule is a later owner amendment. | Preserves D12 frozen math. |
| OD-11 | **(a)** freeze ceilings after 7 measured pilot days. | — |
| OD-12 | **(a)** deferred docs-owner task; non-blocking for P1–P7 (tooling must resolve the v1-named file explicitly). | Touching `keon-docs` canon is a frozen-canon action outside OPMEM. |
| OD-13 | Informational; OPMEM does not repoint registry rows. | Registry's own rule. |
| OD-14 | Required evidence at P2 (unchanged). | — |
| OD-15 | GitHub tracking: one parent issue for OPMEM plus one issue per dispatched parcel in `m0r6aN/agent-skills`, titled with the stable local parcel ID. The unimplemented W1-P4 registrar is **accepted-as-documented**: these issues are tracking links, not registration receipts. | Owner rejected Jira; #174 migration is a separate task. |
| OD-16 | Review routes, see below. | — |
| New (R0 missing) | Readiness/schema-version signal owner → **P2** (Cortex `/health` gains a `schema_version`/protocol field; adapter fails closed on mismatch). Event-time-window anchoring → frozen in P0 rework (window frozen at first delivery). | R0 "missing piece" and OPEN-DECISION QUALITY. |

## Review-route policy (OD-16) — family independence is mandatory

| Role | Route | Why |
|---|---|---|
| P0 rework builder | `opencode-go/kimi-k3` (Moonshot family) | Distinct from author (Xiaomi mimo) and from both reviewers. |
| Review seat A — architecture/decomposition + plan-level adversarial review | `anthropic/claude-fable-5` | Frontier; family ≠ builder/author. Also carries the charter's never-run plan-level review mandate (see deviation D-1). |
| Review seat B — adversarial security/evidence | `openai/gpt-6.1-sol` | Frontier; family ≠ builder/author/seat A. |
| Unavailable | `google/*` | API key invalid on 2026-10-12 probe; not used. |

Code parcels (P1+): builder and the two reviewers must be three distinct families; the coordinator records the route per dispatch.

Spend: every dispatch runs `pi --mode json`; cost is read from per-message `usage.cost.total` and accumulated in the parcel's evidence record. P0 cap USD 25 aggregate (incl. USD 5 first review subcap) retained. Pre-transfer spend by `01a12f95` is unknown (no json mode was used) — recorded as an unknown, not zero.

## Merge / deployment boundary (destructive-action rule)

`keon-cortex` `main` push triggers `keon-cortex-AutoDeployTrigger-*.yml` (Azure deploy); `keon-mcp-gateway` `main` triggers `deploy-production.yml` and `develop` triggers `deploy-staging.yml` (verified in pinned workflows). Therefore:

- Code parcels P1–P5a land via Gate 3 into a non-deploying integration branch `opmem/integration` created from the pinned base in each repo. That is reversible and does not touch running services.
- Promotion of `opmem/integration` to `main` (= production deploy) is **outside this blanket grant** and is a stop-for-owner item, together with P8 cloud work.
- `agent-skills` merges (goal records, P0) proceed under G9.

## Process deviations accepted-as-documented

- **D-1** The charter's plan-level adversarial review never ran before P0 drafting. It is folded into review seat A's mandate (decomposition coherence, missing parcel, load-bearing decision, silent collisions) against charter + P0 manifests. A deviation, not a retroactive pass.
- **D-2** W1-P3 live human TTY approval is replaced by this owner-delegated approval record under the 2026-10-12 blanket grant.
- **D-3** R0 Seat 2 ran on the author's family; it is evidence for rework but not one of the two required reviews.
