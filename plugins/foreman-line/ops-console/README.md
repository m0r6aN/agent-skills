# Foreman Ops Console (`ops-console`)

Local-only, **read-only** observer + human-gate presentation over the Foreman
Line's existing truth sources (receipt chains, parcel specs, goal records). It
answers "what is running, hung, awaiting a gate, failed, or complete?" at a
glance. It consumes verification produced by others; it never produces it
(charter D2/D4; FOC-P0 contract).

- **Port 8081 on loopback (`127.0.0.1`) only — no authentication.** The
  container binds `0.0.0.0` inside itself only when `FOC_CONTAINER=1` and must
  be published as `-p 127.0.0.1:8081:8080`. Never expose this console beyond
  localhost: non-loopback publication is a charter stop condition (D6), not a
  configuration option.
- Every parcel state is **derived from disk on every request** (frozen FOC-P0
  rules R1–R5) — there is no stored status anywhere.
- The console writes exactly two console-local files:
  `state/notifications.json` (`foc-notifications/v1`) and
  `state/invocation-audit.json` (`foc-invocation-audit/v1`, append-only). It
  never writes to `contracts/`, `docs/specs/`, `docs/receipts/`, or
  `docs/goals/` — proven by the negative control in
  `tests/read-only.test.ts`.
- Every action offered goes through an allowlisted pre-existing CLI
  (`approval`, `receipts`) or is presented as a copy-pasteable command for a
  real interactive terminal. Human-gate mutating flows are **present-mode
  only** — the console never fabricates a TTY, never pipes a confirmation
  phrase, never auto-approves, and records no gate decision itself.

## Run (local)

```powershell
cd plugins\foreman-line\ops-console
npm install
$env:FOC_REPO_ROOT = "D:\Repos\agent-skills"   # REQUIRED — absolute repo root
npm start            # http://127.0.0.1:8081/ — board over goal w4-closeout
```

Environment:

| Variable | Default | Meaning |
|---|---|---|
| `FOC_REPO_ROOT` | **required — no default** | Absolute root whose `docs/receipts/` and `plugins/foreman-line/docs/` are projected. Absent (`root-absent`) or relative (`root-not-absolute`) values are refused before startup with a typed `ConsoleRootUnresolvedError` (exit 2) — the console never derives the repo root from the working directory or its own module location (D1) |
| `FOC_STATE_DIR` | `ops-console/state` | The ONLY writable directory (two fixed files) |
| `FOC_EXTRA_ROOTS` | *(empty)* | FCA-1: colon-separated absolute roots whose goal trees project too (`docs/goals`, `docs/INITIATIVES`, `plugins/foreman-line/docs/goals` per root). Goal keys qualify as `alias.slug` (alias = root directory name); bare slugs keep resolving to the primary root. |
| `PORT` | `8081` | Listen port (`8080` inside the container) |
| `FOC_HOST` | `127.0.0.1` | Loopback only; non-loopback requires `FOC_CONTAINER=1` and is refused otherwise |
| `FOC_CONTAINER` | unset | `1` permits container-internal `0.0.0.0`; publication must still pin loopback |

## Run (Docker — `foreman-hub`)

Build context is `plugins/foreman-line/` (the console's relative ESM imports
reach the shipped `receipts/` + `contracts/` packages — copied, never coupled):

```powershell
docker build -t foreman-hub -f plugins\foreman-line\ops-console\Dockerfile plugins\foreman-line
docker run -d --name foreman-hub --restart unless-stopped `
  -p 127.0.0.1:8081:8080 `
  -v "D:\Repos\agent-skills:/data:ro" `
  -v "D:\Repos\agent-skills\plugins\foreman-line\ops-console\state:/app/plugins/foreman-line/ops-console/state" `
  foreman-hub
```

> The truth-source mount is **read-only**. The writable mount is for the
> console's own notification/audit store only (OQ3/A1). The image sets the
> required `FOC_REPO_ROOT` to the mount point (`/data`); a container without
> it refuses at startup exactly like the local run. Open
> http://127.0.0.1:8081/ — no login, loopback only.

## API (frozen route table — FOC-P0 X1)

| Route | Effect |
|---|---|
| `GET /api/health` | posture + repo root |
| `GET /api/goals`, `GET /api/goals/:slug` | goal records (queue items, state lines, ratification text) |
| `GET /api/parcels?goal=` | `ParcelProjection[]` (state, rule, gates, routing, liveness, heartbeat) + unmapped chains |
| `GET /api/parcels/:parcel/chain?goal=` | chain summary (members, sidecars, validity, seal) |
| `GET /api/parcels/:parcel/logs?goal=` | exactly: chain documents (members + sidecars), invocation audit log, loop-directive state lines |
| `GET /api/gates?goal=` | G1/G2/G3 proxies + goal ratification, read-only |
| `GET /api/alerts?goal=` | hung/failed/tripwire alerts; firing records console-local notifications |
| `GET /api/routing?goal=` | read-only policy class×ceiling + per-parcel routing |
| `GET /api/notifications`, `DELETE /api/notifications/:id` | console-local notification store |
| `POST /api/invoke` | closed flow registry below; every request audited |

### Invocation flow registry (M1/A1 — closed set)

| Flow | Mode | Frozen argv | Writes (via the pre-existing flow, never by the console) |
|---|---|---|---|
| `approval-show` | execute | `show <slug> --repo-root <abs>` | nothing |
| `approval-approve` | **present only** | `approve <slug> --repo-root <abs>` | approval sidecar + genesis A receipt (+ projected artifact) |
| `approval-reject` | **present only** | `reject <slug> --repo-root <abs>` | rejection sidecar (+ projected artifact) |
| `dispatch-execute` | **present only** | `executeDispatch <slug> --repo-root <abs>` | builder worktree + Stage-C receipt and sidecars (no invokable bin exists on disk — present-only in Phase 1) |
| `receipts-validate` | execute | `validate <path>` | nothing (exit 1 invalid chain, 2 usage) |

Arguments are passed as arrays (never shell strings); each must match its
frozen pattern (UUID, 6-digit sequence, `^[a-z0-9-]+$` slug, absolute
`--repo-root` equal to the configured repo root). Anything else is refused
before any spawn, and refusals are audited like executions. Spawns use a
frozen minimal environment (no caller-env passthrough) and the configured
repo root as working directory.

## Architecture (FOC-P1–FOC-P4)

- `src/chain.ts` — receipt-chain walk (receiptPath membership, filename
  ordering, delegation to the shipped `receipts` validator for contiguity +
  hash linkage + shared correlation; `isSealed`).
- `src/scan.ts` — spec/sidecar/goal discovery (queue keys, `hung-threshold`
  override parse, state lines, ratification text).
- `src/liveness.ts` — D-LOAD worktree liveness composite (disk truth only).
- `src/gates.ts` — C3 gate proxies (OQ5): presentation of what disk proves.
- `src/derive.ts` — the frozen derivation rules R1–R5 (first match wins).
- `src/project.ts` — the single projection authority (charter D4).
- `src/alerts.ts`, `src/notifications.ts` — hung/failed/tripwire rules and the
  console-local store (FOC-P3).
- `src/invoke.ts` — the ONLY exec-capable module; M1 boundary + A1 audit log.
- `src/api.ts`, `src/server.ts` — frozen route table + localhost binding (D6).
- `ui/` — dependency-free board/chain/gates/alerts/logs/models view (copied
  UX shape from the Automations hub, not imported from it; D1).

Test coverage: `tests/corpus.test.ts` (the frozen FOC-P0 fixture corpus, 100%
conformance incl. both confusion cases and the heartbeat override),
`tests/chain-walk.test.ts`, `tests/derive.test.ts`, `tests/gates.test.ts`,
`tests/invoke.test.ts`, `tests/read-only.test.ts` (D2 negative control),
`tests/api.test.ts`, and `tests/live-goal.test.ts` (FOC-P4 exit proof against
the real `w4-closeout` goal and the real `a5b1975a…` chain — zero fixtures).

## Contract conformance notes

- **`chainEvidence` marker (R2):** carried non-optionally on every
  `ParcelProjection` (`'present' | 'absent'`), per R2's "carried as
  `chainEvidence: 'absent'`" and the contract's reviewer question 3.
- **G1 reconciliation:** the contract's C3 "evidenced" cell ("approval sidecar
  joins, or the chain has its A receipt") and R3's "chain tip is A and … no
  A-receipt-backed approval" coexist only if the A receipt counts as the
  approval record when it carries `subject.approvedHash` — which matches A2
  (the approval flow mints the genesis A receipt with the approved hash).
  Implemented exactly that way; see `src/gates.ts`.
- **Framework deviations (recorded, not silent):** the FOC-P2 one-liner named
  "Express" and "React"; the frozen contract binds the route table and
  behavior, not frameworks. The console serves `node:http` + a
  dependency-free `ui/` so the package keeps zero new runtime dependencies
  (the assignment's dependency gate) and installs offline-safe. Hub component
  shapes are reused by copy of the UX patterns (board, approvals,
  notifications, logs, models view), never by import (D1).
