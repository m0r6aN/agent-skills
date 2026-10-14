# Foreman Ops Console

Acknowledgement API: `GET /api/acknowledgements`, `POST /api/acknowledgements`
(with `id`, 64-hex `fingerprint`, and optional `note`), and
`DELETE /api/acknowledgements/:id`. Acknowledgements are stored in the
console-local `state/acknowledgements.json` file and lapse when evidence changes. (`ops-console`)

Local-only, **read-only** observer + human-gate presentation over the Foreman
Line's existing truth sources (receipt chains, parcel specs, goal records). It
answers "what is running, hung, awaiting a gate, failed, complete, or not
started?" at a glance. It consumes verification produced by others; it never produces it
(charter D2/D4; FOC-P0 contract).

- **Port 8081 on loopback (`127.0.0.1`) only — no authentication.** The
  container binds `0.0.0.0` inside itself only when `FOC_CONTAINER=1` and must
  be published as `-p 127.0.0.1:8081:8080`. Never expose this console beyond
  localhost: non-loopback publication is a charter stop condition (D6), not a
  configuration option.
- Every parcel state is **derived from disk on every request** (frozen FOC-P0
  rules R1–R5) — there is no stored status anywhere.
- The console writes exactly two console-local files:
  `state/notifications.json` (`foc-notifications/v1`),
  `state/invocation-audit.json` (`foc-invocation-audit/v1`, append-only), and
  `state/acknowledgements.json` (`foc-acknowledgements/v1`, evidence-bound with
  append-only acknowledge/unacknowledge events). It
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
| `FOC_STATE_DIR` | `ops-console/state` | The ONLY writable directory (three fixed files) |
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

## Reconciliation follow-through (FCA-P11)

Reconciliation findings may offer **Prepare session** for explicitly mapped
options. This only selects the parcel, sets its per-item instruction, and opens
the existing launch-review dialog; it never starts a session or performs a
write. Instructions are bounded to 2,000 characters with the safety footer
preserved. Options without an authorized action remain disabled and show
copyable commands. See `docs/specs/active/FCA-P11-reconciliation-followthrough.md`.

## API (frozen route table — FOC-P0 X1)

| Route | Effect |
|---|---|
| `GET /api/health` | posture + repo root |
| `GET /api/goals`, `GET /api/goals/:slug` | goal records (queue items, state lines, ratification text) |
| `GET /api/parcels?goal=` | `ParcelProjection[]` (state, rule, gates, routing, liveness, heartbeat) + unmapped chains |
| `GET /api/parcels/:parcel/chain?goal=` | chain summary (members, sidecars, validity, seal) |
| `GET /api/parcels/:parcel/logs?goal=` | exactly: chain documents (members + sidecars), invocation audit log, loop-directive state lines |
| `GET /api/reconcile?goal=` | FCA-P8 (owner-ratified addition 2026-10-13): per parcel, local record vs local git vs remote; closed discrepancy vocabulary with evidence and ages, hung explanation, merged history. Read-only: one batch of git reads and one cached `gh pr list` per request; remote facts carry their age and degrade to *unavailable*, never inferred |
| `GET /api/decisions[?repo=]` | FCA-P9 (owner-ratified addition 2026-10-13): every human gate act waiting - open PRs (Gate 3) and R3 awaiting-gate parcels (Gates 1/2) - with verbatim facts, ages and the billing cause from the check-run annotation. Read-only; read-only `gh` allowlist (`pr list`/`pr view`, one annotation GET); never says an item is ready |
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

## Selected-action launch review

Each selected finding has its own editable optional extra direction in the launch
panel. It is sent with that finding's spawn action and appended verbatim to only
that action's prompt; editing one item does not change another. Harness, model,
thinking level, and budget remain shared launch controls.

## Session ledger (FCA-P7)

Every launched pane leaves an evidence-backed record, derived on each read from
observed facts (never stored as status):

- **tmux hardening** — panes are created with `remain-on-exit` and `pipe-pane`,
  so a pane that dies at startup stays attachable with its exit status and its
  output is appended to `state/sessions/<receipt-id>/pane.log` (retention: 5 MB
  per pane, 200 panes; truncation is marked, never silent).
- **Lifecycle** (closed): `launching`, `running`, `exited-clean`,
  `exited-error`, `no-transcript`, `vanished`, `unknown`. `exited-clean` means
  exit status 0, **not** that the work is complete.
- **Joins** — pi transcript by worktree path (header `cwd` must agree); git
  outcome (commits ahead of `baseCommit`, changed files, pushed against the
  last-fetched `origin/<branch>`). Zero or several transcript candidates read
  `none` / `ambiguous`, never a guess.
- **API** — `GET /api/spawns` gains an additive `ledger` object per receipt.
  Receipts written before the ledger read as unknown and never raise attention.
- **pi models must be `provider/model`** — a bare id is ambiguous across
  authenticated providers and pi exits at startup; planning refuses it before
  any worktree or process exists.

## Decisions (FCA-P9)

**Decisions** lists what only you can do: merge an open PR (Gate 3), ratify a parcel
(Gate 1), dispatch a registered parcel (Gate 2). It shows the facts the console can
see (merge state, review decision, checks, stack order) with their age, and **never
says an item is ready**. `mergeable: UNKNOWN` stays unknown.

- **Presents, never performs.** Each row has a "Show command" button. Pressing it is one
  `/api/invoke` presentation, audited `presented`; only then is the exact command revealed
  for you to run in a terminal. Gate 1 shows approve and reject (`approval-approve`,
  `approval-reject`), Gate 2 shows `dispatch-execute`, Gate 3 shows
  `cd "<root>" && gh pr merge <N>` (flow `pr-merge`, present-only, no strategy flag, so `gh`
  asks you). Gate commands are offered for the console's primary root only; other roots say
  so. `pr-merge` refuses (audited `refused`) a bad PR number, a relative, undeclared or
  quote/`$`/backtick/control-character root, extra argv, and any mode other than `present`.
  The console never merges, approves or dispatches.
- **"Actions not starting" is evidence, not inference.** The banner appears only when
  a failing check-run's annotation carries GitHub's billing wording, quoted verbatim.
  A failed check without that annotation reads "Failed, cause unknown".
- **Read-only `gh`:** `gh pr list`, `gh pr view`, and a GET of one check-run's
  annotations; any other argv is refused before a process is spawned
  (`decisions-remote.ts`, pinned by `tests/decisions-remote.test.ts`).
- If GitHub is unavailable the PR list is withheld with the reason; local gate items
  still show. If a refresh fails the last good read stays, labelled with its own age.

## Reconciliation (FCA-P8)

Tools → **Reconciliation** compares, per parcel, what the *record* says with what
*local git* and the *remote* show, and explains why a parcel is `hung`.

- **Discrepancy vocabulary (closed):** `shipped-unrecorded`, `recorded-unshipped`,
  `unmerged-work`, `orphan-worktree`, `never-started`, `local-remote-divergence`,
  `stale-abandoned`. Each carries its evidence and preserve-first options
  (recover/complete first; close/defer last and labelled last resort).
- **Strong shipping evidence** is a merged PR into the default branch whose title is
  `feat`/`fix`/`perf`/`refactor`. `docs`/`chore`/`ci`/untyped PRs, commit subjects,
  specs on the default branch and goal state lines are **weak traces**: shown, never
  asserted from. A finding that rests only on weak traces is worded and coloured as
  *Unclear — verify* (`confidence: weak-traces`), because work often ships bundled or
  under another identity.
- **Linking** is by exact parcel key as a delimited token (`FOC-P1` never links
  `foc-p10`); a candidate matching two keys is *ambiguous* — listed, never used.
  `FOC-P1–FOC-P4` ranges in state lines are expanded; nothing else is guessed.
- **Assessment, not guesswork.** Findings that say something *exists* need only the
  sources they name. Findings that say something does *not* exist (`never-started`,
  `recorded-unshipped`, `stale-abandoned`) need **every** source complete: GitHub
  reachable, the PR list and commit log under their limits (1000 PRs / 50,000 commits), the
  spec, branch, worktree and merge-state reads successful. A failed or truncated read is *unknown*,
  never "empty"; the response's `assessment.limits` and the banner say what is missing.
- **Squash/rebase merges** are recognised by a MERGED PR (into the default branch) that
  carried the branch's exact tip (`headRefOid`). Ancestry alone would call every shipped
  branch unmerged, and matching by name would call a reused name shipped. Title hedges
  (`revert`, `follow-up`, `partial`, `wip`) are never delivery evidence.
- **Keys inside longer slugs** (`TO-P1` in `add-to-p1-schema`) cannot be told apart by any
  deterministic token rule; the real branch `foreman-to-p1-ratification` is legitimately
  TO-P1's. Findings show their linked evidence so a wrong link is visible. Keys of the
  repository's other goals are indexed so a candidate matching two goals is *ambiguous*.
- **Remote unavailable** (no `gh`, not logged in, offline): remote-dependent findings
  are withheld and the banner says so; local facts remain. A failing `gh` is retried at
  most every 5 minutes (each attempt can block for its 10 s timeout).
- **Remote-ref age** is the last `FETCH_HEAD` (any fetch). The banner warns when refs are
  older than a day or no fetch is recorded. The console never fetches.
- **Read-only:** `git` is limited to `symbolic-ref`, `rev-parse`, `for-each-ref`, `log`,
  `ls-tree`, `rev-list`, `status`, `worktree list`, `merge-base --is-ancestor`; `gh` to
  `pr list`. Nothing fetches, pushes, merges, or closes. Remote-ref age is the last
  fetch (`FETCH_HEAD`); the console never fetches for you.
- `state`/`rule` are echoed for display and are never an input.

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
