# OPMEM handoff: start a fresh coordinator session here

**Goal:** `operator-developer-cortex-memory` (OPMEM). The goal is to give short-lived Pi agents durable, selectively recalled memory that belongs to long-lived roles. The path is Pi extension → local adapter → Azure MCP Gateway → Azure Cortex → Neon Postgres.
**Written:** 2026-10-13 08:00 EDT by coordinator Pi `01a131a9-5c16-724a-a016-3353a124592d` (anthropic/claude-opus-5-5). The handoff happens at a parcel boundary, right after P4b merged.
**Accountable human:** Clinton Morgan.
**Authority:** the owner's 2026-10-12 blanket grant, quoted verbatim in `ownership-transfer-2026-10-12-01a131a9.md`. It covers every decision for this goal and every non-destructive action, and it says not to pause at human gates unless something destructive comes up. Under the coordinator's recorded interpretation, the following count as destructive and must stop for the owner:
- merging or promoting to `main` in `keon-cortex` or `keon-mcp-gateway`, because both auto-deploy to Azure production
- any cloud, Neon or credential change
- deleting other people's branches or worktrees

A new session becomes coordinator only through an explicit owner direction like `/foreman-line:goal resume operator-developer-cortex-memory`. When that happens, update the ownership block in `loop-directive.md`.

---

## 1. Where things stand

| Parcel | State | Where it landed |
|---|---|---|
| P0 (contract baseline, 7 documents) | accepted after 4 dual-review rounds | agent-skills #199 (spec in `docs/specs/done/`) |
| P1a (Gateway role binding, verified actor, admin-read isolation, spine hardening) | merged | Keon-Systems/keon-mcp-gateway#49 → `opmem/integration` `1b81a1a` |
| P1b (Cortex served-path scope enforcement) | merged | keon-cortex#61 |
| P2a (shards/1.1, scoped identity, input hardening, `/health` readiness) | merged | keon-cortex#62 |
| P2b (`/v1/recall`: recall events, verified selection, retry binding, access rows) | merged | keon-cortex#63 |
| P3a (`/v1/memory-events` ingest) | merged | keon-cortex#64 |
| P3b (occurrence classes, served `gravity/1.1.0`, projection, recall ordering) | merged | keon-cortex#65 |
| P4a (handoff scope class, curation proposals/dispositions, OD-23) | merged | keon-cortex#66 |
| P4b (evidence links + `POST /v1/evidence/verify`) | merged | keon-cortex#67 → `opmem/integration` **`69cd4f8`** |
| **P5a** (Gateway canonical protocol) | **next** | keon-mcp-gateway, base = `opmem/integration` head `1b81a1a` |
| P5b (bridge import repo + adapter conformance) | queued | OD-1: new private repo `Keon-Systems/keon-cortex-mcp-bridge`; import `D:/Repos/keon-cortex-mcp-bridge` into a **fresh clone**, never in place |
| P6 (adapter outbox) | queued | bridge repo |
| P7 (Pi extension) | queued | new repo named at shaping (standard risk, 1 review) |
| P8 (Azure/Neon deploy, key and secret provisioning) | **owner stop** | needs cloud, credential and spend authority |
| P9 (end-to-end validation) | owner stop | depends on P8 |
| P10 (14-day, three-machine pilot) | owner stop | runs on real work; needs owner acceptance |

**Nothing is in production.** All code sits on non-deploying `opmem/integration` branches. `main` is untouched in both Keon repos.

**Spend under `01a131a9`:** USD 191.10 in total. P0 19.50, P1 36.22, P2a 18.86, P2b 26.72, P3a 10.73, P3b 30.52, P4a 34.17, P4b 14.38. Guards are USD 45 per architecture parcel and USD 400 cumulative (raised from 300, rationale in `p4a-closure-2026-10-13.md`). Raw per-run costs are in `D:/Repos/opmem-dispatch-01a131a9/*.jsonl` and can be read with `node extract.cjs <file>.jsonl`.

---

## 2. Read first, in this order

1. This file.
2. `loop-directive.md` (ownership block and state line) and `owner-delegated-decisions-2026-10-12-01a131a9.md`. The second holds the OD dispositions, route policy, merge boundary, and the later rulings T-37, T-38, OD-23 and the D12 note.
3. `follow-on-parcel-manifests.md` §P5a–P10. This is the spec. Manifests carry exact Allowed Files and T-row amendments.
4. `p0-triage-2026-10-12.md` (rulings T-1…T-34) and `p1-triage-2026-10-12.md` (T-35/T-36 identifier and scope grammar, binding on everything).
5. The closures `p1-closure`, `p2a`/`p2b`/`p3a`/`p3b`/`p4a`/`p4b-closure-2026-10-13.md`, especially their **carry-forward** sections listed in §4 below.
6. The latest kickstarters (`p4a-build-kickstarter.md`, `p4b-build-kickstarter.md`). They are the template for writing new ones.

All of these live in `agent-skills:plugins/foreman-line/docs/goals/operator-developer-cortex-memory/`.

---

## 3. Working pattern (proven over 9 parcels)

1. **Worktree:** `git -C D:/Repos/keon-omega/<repo> fetch origin` and then `git worktree add D:/Repos/opmem-worktrees/<name> -b feat/opmem-<parcel>-… origin/opmem/integration`.
   - Never touch the dirty main checkouts in `D:/Repos/keon-omega/*`.
   - For Cortex, create a venv: `uv venv .venv --python 3.12 && uv pip install --python .venv/Scripts/python.exe -e ".[dev]"`.
   - Record the suite baseline at the base before dispatch (rule T-20).
2. **Kickstarter** `pNx-build-kickstarter.md` should contain:
   - workspace and base SHA
   - baseline counts
   - contract pointers
   - numbered coordinator rulings (design decisions, so the builder never invents them)
   - exact Allowed Files
   - a Step 0 restate-and-stop section
   - a report format that requires `black`/`isort --check` output

   Commit it on a `coord/opmem-…` branch of agent-skills and open a tracking issue (parent #200).
3. **Builder:** `pi -p --mode json --session-dir D:/Repos/opmem-dispatch-01a131a9/sessions --session-id <uuid> --model openrouter/moonshotai/kimi-k3 --thinking high --no-extensions --no-mcp --no-skills "<prompt>"`.
   - The `opencode-go` budget is exhausted (HTTP 429), so use openrouter.
   - Wrap the call in a retry loop. The provider sometimes errors mid-run; check `stopReason` and resume the same session with "check git status/diff and continue".
   - Run Step 0 first, append rulings to the kickstarter, then send GO.
4. **Closure check on disk:**
   - re-run the full suite yourself
   - run the env-gated PG tests
   - run `black --check` / `isort --check-only` on the changed files (one builder misreported this once)
   - diff the files actually touched against Allowed Files
5. **Dual review**, using read-only tools `--tools read,grep,find,ls,bash` with probes allowed only in the system temp directory:
   - **Seat A:** `anthropic/claude-fable-5` (architecture lens).
   - **Seat B:** `openai/gpt-6.1-sol`. Phrase its prompt as an "authorized pre-merge defensive review of our own repository"; otherwise OpenAI may refuse it as a cybersecurity risk.
   - Write the brief file before dispatch.
   - Store verdicts verbatim as `pNx-review-R<k>-seat<A|B>.md`.
6. **Triage:**
   - Reproduce disputed findings before ruling.
   - Append an "R<k> triage" table to the kickstarter.
   - Rework in the same builder session.
   - Re-review: both seats, or only the seat that owns a narrow finding.
   - **Convergence rule:** residuals that only appear through fault injection or cross-thread races in the in-memory dev store become informational carry-forwards. PostgreSQL-path defects still force rework.
7. **Gate 3:** push, open a PR to `opmem/integration`, wait for CI, comment with the evidence, merge with `--merge`. Then write the closure record (spend included), close the issue, update the `loop-directive.md` state, and open and merge a docs PR to agent-skills `main`.

**Environment facts:**
- GitHub Actions on `m0r6aN/agent-skills` does not run because of an account billing failure. Docs PRs are merged on local validators: `node scripts/validate-skills.js`, `validate-commands.js`, `validate-artifact-paths.js`, `surface-pin-precheck.mjs`.
- keon-cortex CI does run on `feat/**` pushes and on PRs.
  - `Lint + Type Check` is red at baseline: 61 pre-existing black files. Confirm your PR adds none.
  - `tests/temporal/test_benchmark.py::…receipt_overhead_bounded[50]` is a flaky timing test. Rerun failed jobs.
- keon-mcp-gateway has no CI for PRs into `opmem/integration`, so local `dotnet test tests/Keon.McpGateway.Tests` is the evidence. The baseline at `1b81a1a` is 421 passed.
- Local PostgreSQL 16 runs in Docker as `opmem-pg` at `127.0.0.1:55432` (user `postgres`, password `opmem`, database `cortex`; disposable). Tests use a temporary database per run via `KEON_TEST_DATABASE_URL`. Never run DDL against `cortex`.
- Docker `python:3.12-slim` / `python:3.10-slim` are used for Linux parity. Gravity goldens are pinned for Linux.

---

## 4. Carry-forwards that bind the next parcels

**P5a (Gateway, `keon-mcp-gateway`).** The manifest plus T-8/T-11/T-13/T-15/T-18/T-21/T-24/T-27/T-32/T-34 apply. In addition:
- Add the Gateway half of the T-35 grammar extension: `handoff:{profile}:{role}` and `cap:curation.approve` tokens. Emit `cap:` only from enrolled or issuer-validated grants.
- Add `access` to the `keon.cortex.memory.event.v1` mapping, idempotent per `(operation_id, record_id)`.
- Freeze the invocation→target→execution→result receipt chain (OD-22), with the `decide_only`, completed-failure-reported-as-success, and receipt-replay-against-another-target fixtures. Until then everything stays `self_reported`.
- Map the new Cortex routes to Gateway tools:
  - `/v1/recall` and `/v1/memory-events`
  - `/v1/curation/{proposals,dispositions}`
  - `/v1/evidence/verify` → `keon.cortex.evidence.verify.v1`
  - `memory.get.v1` (T-24)
  - `capabilities.v1` reading `/health` `schema_version`/`protocol`
- Thread `X-Keon-Operation-Id` and the binding explicitly instead of through the ambient accessor.
- Use a Runtime test double, labelled as test evidence (OD-21).
- Correct the T-28 locator `Program.cs:224`.
- Treat a 409 on curation operations as "replay the identical request once" before declaring it terminal.

**P5b/P6 (bridge).**
- Run the OD-1 import first.
- `server.py`, `port.py` and the readiness check go through `capabilities.v1`, fail closed.
- The outbox implements O-1…O-9 and mints `operation_id` per logical operation.
- Apply the same 409-replay rule.

**Cortex follow-ups (no parcel yet, informational).** These can be folded into a hygiene parcel:
- a protocol-level locked-bundle API on `InMemoryRecordStore` to remove cross-store private access
- an indexed, scope-aware candidate query (P2b-T7)
- `epoch_seconds` grammar leniency
- the dead `superseded` proposal status
- the P4b "unknown" test-matrix case
- `_replay_value_hash` assumes `extractor_version="v1"`
- existing shards have occurrence 0 under 1.1.0 (no back-fill)

**P8 (owner):**
- secret custody, rotation and isolation for `X-Keon-Cortex-Secret` (OD-20)
- Runtime binding (OD-21)
- provisioning of `CORTEX_EVIDENCE_TRUSTED_KEYS` (the Cortex evidence key's canonical id is `sha256(pub)[:16]`)
- mandatory enrollment for API keys
- OD-23: receipt verification path, which unlocks support levels above `provisional`
- OD-11 numeric ceilings after 7 pilot days

---

## 5. Owner-visible items (include in any stop report)

1. **Security issues in the currently deployed Gateway (`main`).** The deployed Gateway still has three issues; the fixes are on `opmem/integration` (#49) and not deployed:
   - client headers and API keys can assert any actor
   - the admin ingress read is tenant-less
   - correlation-id path traversal in the spine file fallback

   Promoting to `main` deploys them; that is the owner's decision.
2. **Deploy notes for any `main` promotion of keon-cortex:**
   - additive DDL (recall, memory-event, curation, spine tables; generated scope columns)
   - pre-P2a idempotency reservations will return 409 to post-P2a retries
   - pre-P2a readers reject shards/1.1 rows
   - gravity replay determinism is **per platform**; Linux is the golden
3. **GitHub Actions billing** for `m0r6aN` is failing. Nothing runs on agent-skills.
4. **Spend.** The opencode-go subscription budget is exhausted, so builders now run pay-per-token on openrouter.
5. P8–P10 cannot start without owner-granted cloud, credential and spend authority, and the 14-day pilot needs real calendar time.

---

## 6. Housekeeping state

- **Worktrees** under `D:/Repos/opmem-worktrees/`: `gateway-p1a` and `cortex-p1b`, `p2`, `p2b`, `p3a`, `p3b`, `p4a`, `p4b`. All are merged and safe to remove with `git worktree remove` from their parent repos. Their feature branches are merged; deleting the remote branches is optional (they are our own).
- Agent-skills worktrees `opmem-p0-20261012-01a12f95` and `opmem-coord-20261012-01a131a9` are ours. The coord worktree is on branch `coord/opmem-p4b-20261013-01a131a9`; check it is merged before reuse.
- Dispatch scratch is `D:/Repos/opmem-dispatch-01a131a9`: prompts, jsonl transcripts, `extract.cjs`, `spend-*.txt`, proof bundles. It sits outside every repository.
- Tracking: parent issue #200 stays open; parcel issues #201, #202, #204, #205, #207, #209, #211, #213 are closed.

**Suggested next action:** after the explicit resume direction, write `p5a-build-kickstarter.md` from manifest §P5a plus §4 above. Create worktree `gateway-p5a` from `origin/opmem/integration` (`1b81a1a`) and record the baseline of 421 passed. Then dispatch Step 0.
