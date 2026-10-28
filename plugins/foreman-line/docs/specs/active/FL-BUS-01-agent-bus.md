---
ticket: FL-BUS-01
title: Agent bus — reliable inter-agent message layer built on per-agent sidecars, with first-class Grok Bot participation (umbrella; decomposes into BUS-P0..P10, P4 = P4a + P4b)
status: draft
owner: clinton.morgan
created: 2026-10-27
updated: 2026-10-27
supersedes: null
superseded_by: null
risk: elevated
surfaces: [plugins/foreman-line/agent-bus/, plugins/foreman-line/docs/goals/agent-bus/, plugins/foreman-line/docs/specs/active/]
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
expertise: architecture
thinking_level: high
verification_class: judgment-required
---

## Intent

Give foreman-line a durable, ordered, acknowledged message layer ("agent bus") between a coordinator and its
workers while a parcel runs: questions, answers, steering, typed heartbeats and results. Today the worker
envelopes (`worker.kaseya/v1`, `worker-result.kaseya/v1`) cover dispatch and the final hand-back, but nothing
guarantees delivery of the messages in between, so a stalled or restarted agent can silently lose a question or
a redirect. v1 runs entirely on Clint's PC in local Docker: Redis plus **one bus sidecar per local agent**
(the sidecar holds the agent's signing key, speaks Redis Streams, and gives the agent local MCP tools), and still
includes his cloud-hosted, turn-based Grok Bot agents through one **Grok bridge sidecar**, outbound webhook wakes
and a git mailbox repo. The replayable
stream becomes audit evidence for receipt chains and, later, the feed for agent-memory checkpoint events.

> **Shaping note.** Umbrella draft at Stage A. It exceeds SPEC-CONVENTION §6's ~3–4k-token budget on purpose
> so Gate 1 can ratify D1–D25 in one place. On ratification it splits into `docs/goals/agent-bus/charter.md`
> plus one spec per parcel (BUS-P0..P10), each within budget. Not dispatchable (`status: draft`).
>
> **Revision 2026-10-27c (sidecar architecture, Clint msg t24u):** every local agent gets its own bus sidecar
> (D18, D19); the Grok team is served by a single bridge sidecar and identity is explicitly mediated there (D20);
> the Keon MCP Gateway becomes an optional front end for sidecars in BUS-P8, not a central bus server (D21); the
> recommended defaults are decided (D22–D25); former Open Questions 1–5 are resolved (see Open Questions).
> D1, D5, D8, D9, D13, D14 and D15 are amended in place (amendments are marked and the prior wording is kept as
> "was:"); BUS-P4 splits into P4a/P4b; AC-22..AC-29 are new and AC-2, AC-5, AC-14, AC-15, AC-21 are amended.
> History is in Context §I.
>
> **Revision 2026-10-27b (Clint's answers):** mailbox repo `m0r6aN/agent-bus-mailbox` exists and is scaffolded
> (commit `0377bfa`); cryptographic per-agent identity is required in v1 (D15, E.10); Grok agents are
> workers/reviewers/specialists only in v1, Grok coordinator deferred to BUS-P10 (D17); timing and retention
> parameters are decided (D16).
>
> **Revision 2026-10-27 (Clint's ruling):** v1 hosting is local Docker Redis on the PC only. Hosted Redis
> (Upstash + Azure Container Apps) and the Grok-facing bus MCP server move to BUS-P8 as the upgrade path.

## Constraints

**Proposed locked decisions D1–D25 (for Gate 1 ratification; D15–D17 answered by Clint 2026-10-27; D18–D25 follow his sidecar approval, msg t24u, and his acceptance of the recommended defaults):**

- **D1 — Transport is Redis Streams with consumer groups**, never plain pub/sub. One stream per parcel run,
  `fl:run:<runId>` (`runId` from `CorrelationContext`, `contracts/src/correlation.ts`). `XADD` to produce,
  `XREADGROUP` per participant group, `XACK` after processing, `XPENDING`/`XAUTOCLAIM` for recovery.
  At-least-once delivery; exactly-once *processing* via dedupe (D6). *Amended 2026-10-27c (D18):* the stream
  commands are issued only by sidecars (and the operator CLI); agents never issue them.
- **D2 — Contract `bus-message.kaseya/v1` extends, never forks, the worker envelopes.** Reuses `taskId`,
  `goalId`, `parcelId`, `role` (`role-authority` `ROLE_IDS`) and a full `correlation: CorrelationContext`.
  `task`/`result` payloads *are* `TaskEnvelope`/`ResultEnvelope` (or a `ReceiptRef` to one), validated by the
  `worker-envelopes` schemas imported by reference. `ResultStatus` stays the only result vocabulary.
- **D3 — Message types (closed set, v1):** `task`, `question`, `answer`, `steer`, `cancel`, `heartbeat`,
  `result`, `release`, `ack`, `observation`. `heartbeat.phase` ∈ `investigating | implementing | reviewing |
  waiting`. `ack` exists for participants that cannot `XACK` directly (Grok agents, D13): the bridge turns it
  into an `XACK` of the referenced entry on the sender's group and keeps the `ack` entry as audit.
  `memory_checkpoint` is reserved for BUS-P9 and rejected by v1 validators.
- **D4 — Evidence before action (from Orca, `skill-guides/orchestration/references/recovery-and-cleanup.md`).**
  Silence, an expired heartbeat window, an empty wait, an idle pending entry, a quiet mailbox, or a timeout are
  *checkpoints*: they may emit `observation{kind: stall_suspected}` and wake a human, never cancel, reassign,
  retry, release, or a foreign `XAUTOCLAIM`. Only positive evidence acts: the worker's own `result`/`release`,
  a runtime liveness verdict of `exited`, or a recorded human decision. Heartbeat = liveness, never completion.
  `XADD`, a webhook 2xx, or a mailbox commit = delivery, never "read".
- **D5 — `XAUTOCLAIM` is same-identity recovery only** (a restarted consumer or bridge reclaiming its own
  pending entries). Cross-agent reassignment goes through D4. *Amended 2026-10-27c:* the consumer is the sidecar.
  A restarted sidecar reclaims its own pending entries under the same consumer name (`<agentId>`) via
  `XAUTOCLAIM`, and may redeliver them to its own agent after an idle threshold (proposed default 5 min, set in
  BUS-P0). Redelivery to the same agent is recovery, not an action on silence (D4).
- **D6 — Idempotency.** Every message has `messageId` (UUID) and `idempotencyKey`
  (`<runId>:<type>:<from>:<seq>`, alphabet `[A-Za-z0-9_.:-]`). Consumers run
  `SET fl:seen:<agentId>:<messageId> 1 NX EX <ttl>` before side effects; Grok agents dedupe against their
  mailbox `outbox/` (they never reply twice to one `inReplyTo`). Duplicates are logged no-ops.
- **D7 — The stream is the audit log.** No trimming while a run is open. At close, the coordinator exports
  `XRANGE fl:run:<runId> - +` to canonical JSONL, hashes it, and appends a `subjectKind: BusTranscript`
  receipt under `docs/receipts/<workflowId>/` using the existing `receipts` package (RFC 8785 + SHA-256).
  Trimming only after that receipt validates.
- **D8 — A2A 1.0 is the agent contract layer**: one A2A `AgentCard` per participant (required: `name`,
  `description`, `supportedInterfaces`, `version`, `capabilities`, `defaultInputModes`, `defaultOutputModes`,
  `skills`). Bus state projects onto A2A `TaskState` (Context §C). *Amended 2026-10-27c:* was "No A2A server
  endpoint in this goal." A sidecar **may optionally** serve A2A for its agent (agent card + `SendMessage`/`GetTask`
  projected onto bus messages) when `BUS_SIDECAR_A2A=1`; off by default, bound to `127.0.0.1`, same signing and
  refusal rules as the MCP surface. No other A2A server exists.
- **D9 — Agents as MCP tools** (amended 2026-10-27c: each sidecar serves its own agent's MCP tools, see D18/D19;
  was: one local bus MCP server for all PC agents) for short, bounded, advisory requests:
  `ask_<agentId>(question, contextRefs, deadlineSeconds)` → answer or ticket, redeem with `get_answer(ticket)`. Advisory only, never verification
  evidence or mutation authority. In v1 the sidecar MCP surface is **local** (PC agents only); `ask_grok:*` is always
  ticketed because Grok answers arrive through the mailbox in minutes.
- **D10 — gRPC deferred.**
- **D11 — No runtime dependency on Orca.** An optional adapter may map Orca `send/check/ask/worker_done` to bus
  messages; no bus package imports, shells out to, or assumes Orca.
- **D12 — Bus messages never carry authority.** No message widens `allowedFiles`, a permission profile, or
  approval state, or stands in for Gates 1–3 (SPEC-CONVENTION §8). Bodies from other agents are untrusted data.
- **D13 — v1 hosting is local-only.** Redis 7 in Docker on the PC, AOF persistence on, ACL users per credential
  class; the Grok bridge sidecar and the per-agent sidecars run beside it (one compose project). Nothing listens
  on a public interface and nothing inbound to the PC is opened. Grok agents never connect to Redis. *Amended
  2026-10-27c:* Redis is no longer published to the host at all (on the compose-internal network only; an opt-in
  `debug` compose profile may publish it on `127.0.0.1` for the operator); was: "bound to `127.0.0.1`". ACL users
  are one per sidecar plus `bridge`, `coordinator-admin` (operator only) — was: classes `coordinator`, `pc-agent`,
  `bridge`. Only sidecar MCP/A2A ports are published, on `127.0.0.1`.
- **D14 — Hosting is config, not contract.** All components take `BUS_REDIS_URL` (+ credential *name*) from
  config (sidecars included: `BUS_REDIS_URL` + credential name is a sidecar setting). Moving to hosted Redis
(BUS-P8) changes config and deployment only; message schema, stream/group
  names, dedupe and evidence rules are identical. Code must not branch on "local vs hosted".

- **D15 — Per-agent cryptographic identity is required in v1 (Clint, 2026-10-27).** *Amended 2026-10-27c: was
  "every mailbox-originated message"; now every message on the stream.* Every message carries an Ed25519
  signature (`sig`) from a key registered to its `from` agent (made by the sender's own sidecar for PC agents, D19;
  by the Grok agent itself for Grok agents, D20), plus, for mailbox replies, a bridge-issued
  `replyNonce` echo; the bridge signs every inbox copy and webhook body with its own key. Folder
  ownership and commit author are consistency checks, never identity. `result`, `release` and `ack` without a
  valid signature and nonce are rejected, never downgraded. Receiving sidecars re-verify every signature they
  read, so Redis is never a trust boundary. Design and limits: Context §E.10.
- **D16 — Operating parameters (decided, Clint 2026-10-27):** Grok heartbeat window 45 min; Grok cron poll
  15 min; bridge mailbox poll 60 s; mailbox cleanup 14 days after a run's `BusTranscript` receipt validates, by
  normal commits (history never rewritten); streams trimmed only after that receipt validates. Changing any of
  these is a spec amendment.
- **D17 — v1 roles (decided, Clint 2026-10-27):** Grok agents participate as workers, reviewers, scouts and
  specialists only; the registry refuses `role: coordinator` for any `liveness: turn-based` agent. A Grok run
  coordinator is BUS-P10, after BUS-P8 lowers latency.

- **D18 — Per-agent sidecar architecture (Clint, 2026-10-27, msg t24u).** Every *local* agent (Claude Code, Codex,
  ChatGPT, Gemini, Pi, Orca workers, the coordinator) gets its own bus sidecar: one process/container per agent
  id, local Docker in v1. The sidecar is the agent's only path to the bus. It speaks Redis Streams with consumer
  groups (`XREADGROUP`/`XACK`/`XPENDING`/`XAUTOCLAIM`), does retries, heartbeats and typed reply codes, and exposes
  the bus to its agent as local MCP tools (D9), optionally A2A (D8). Agents never see Redis, streams, consumer
  groups or signing keys. One sidecar image, configured per agent by environment and a registry entry (Context
  §H). Orca workers use pre-registered pool identities (e.g. `orca-w1..w4`); per-run ephemeral key issuance is out
  of v1 scope.
- **D19 — The sidecar holds the key and does the signing.** The agent's Ed25519 private key is mounted into its own
  sidecar only (compose file-secret from the PC secret store, read-only, never in an image, repo, log, env dump or
  tool result). The sidecar assigns `from` (its own agent id), `role`, `messageId`, `idempotencyKey`, `sentAt`
  and `sig` (RFC 8785 canonical JSON, Context §E.10); an agent can supply only `type`, `to`, `inReplyTo`, `payload`
  or `payloadRef`. **The sidecar refuses to send an unsigned message**, refuses client-supplied
  `from`/`sig`/`messageId`/`sentAt`/`role`, and without its key it does not start sending (`KEY_UNAVAILABLE`).
  Redis therefore only ever stores signed envelopes; receiving sidecars verify each against the registry before
  delivering to their agent. Honest limit: local agents run as Clint's OS user, so one agent could read another
  agent's MCP token or a mounted-secret path on the host if Clint places them there; v1 claims protection against
  outsiders and accidental misattribution for PC agents, and relies on per-sidecar MCP tokens (AC-26) plus
  container-only secret mounts (AC-23) to make deliberate cross-agent impersonation require an explicit breach.
- **D20 — Grok team: one bridge sidecar, identity mediated at that boundary.** Grok Bot agents run in turns on one
  shared computer and cannot host persistent sidecars, so the Grok side stays as specced in E.4–E.6: mailbox repo
  `m0r6aN/agent-bus-mailbox`, inbox commits plus a signed webhook POST into routine triggers, outbox polling every
  60 s (D16), per-bot keys in bot secrets (D22), Grok agents signing their own outbox files in their turn. A single
  **Grok bridge sidecar** (the sidecar image plus the Grok-channel module) relays for the whole team: it verifies
  each bot's signature, nonce and folder, then republishes onto the stream with a bridge-signed `relay`
  attestation (Context §A). **Identity for Grok agents is mediated at this boundary:** consumers can re-verify the
  agent's own signature end to end, but admission, nonce binding, custody labelling and transport are the
  bridge's judgement, and the Grok team's per-agent identity is only as strong as the verified custody in force
  (D23). The P0 shared-secrets test (AC-21) remains the deciding check for that custody.
- **D21 — The Keon MCP Gateway is an optional front end for sidecars in BUS-P8, not a central bus server.**
  Resolves former Open Question 1. When hosted (P8), the gateway may front sidecar MCP endpoints (JWT/API-key
  auth, usage accounting) with gateway-compatible tool names; each sidecar still holds its own key and signs. No
  component depends on the gateway, and v1 has none.
- **D22 — Key provisioning (decided).** Clint generates each agent's Ed25519 keypair on his PC with
  `foreman-bus keygen`. For a Grok bot he pastes **only the private half (seed)** into that bot's own secrets; for
  a PC agent the seed goes only to that agent's sidecar secret file. The public half goes into the registry via a
  reviewed commit. No agent generates its own key and no seed passes through a repo, message, memory record or
  agent chat. Resolves former Open Question 4.
- **D23 — Custody fallback (decided).** If the AC-21 probe shows Grok bots can read each other's secrets (or the
  shared filesystem exposes them), v1 still accepts their signed messages, with every result labelled "signed,
  custody box-shared" (E.10 L1). That protects against outsiders and misattribution, not deliberate
  co-resident impersonation, and the label says so. Not a blocker for Grok `result`s; keys-off-box is
  revisited in BUS-P8. Resolves former Open Question 3.
- **D24 — Per-agent GitHub accounts (L4) are deferred to BUS-P8.** Signatures are the identity until then.
  Resolves former Open Question 5.
- **D25 — A2A mapping accepted.** Context §C is accepted as written, including `PARTIAL` → `COMPLETED` with
  `metadata.foremanStatus=PARTIAL` and `BLOCKED` → `FAILED` with `metadata.foremanStatus=BLOCKED`. Foreman
  `ResultStatus` stays authoritative. Resolves former Open Question 2.

**Security (SPEC-CONVENTION §7):** no credentials, connection strings, webhook URLs, sender keys, signing seeds,
sidecar MCP tokens or tokens in any repo, spec, image layer, message, mailbox file, agent-memory record, receipt
or log; secrets are referenced by *name* and resolved from the PC's secret store (HAWF carry-over D5) into
per-container file secrets. Entries ≤ 16 KB; larger content travels by `ReceiptRef` or
`repo@sha:path`. No customer data or PII on the bus or in the mailbox repo.

**Standing constraints:** `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`; one coordinator per
goal; Gate 3 human-owned.

## Acceptance Criteria

Goal-level exit criteria; each names the evidence a verifier checks. Per-parcel ACs keep the same rule.

- **AC-1 Contract.** `plugins/foreman-line/agent-bus/schemas/bus-message.schema.json` exists; `npm test` in
  `plugins/foreman-line/agent-bus/` passes `tests/parity.test.ts` and `tests/envelope-alignment.test.ts`
  (every `task`/`result` fixture validates against `taskEnvelopeSchema`/`resultEnvelopeSchema`; unknown types
  incl. `memory_checkpoint` are rejected). Evidence: runner output with test count.
- **AC-2 Ordering, ack, redelivery.** `tests/integration/redelivery.test.ts` (disposable `redis:7`
  container, run through a sidecar's MCP tools, never raw Redis) kills the consumer after read and before `XACK`,
  restarts it under the same identity, and shows original-order re-read, one processing (dedupe hit logged),
  `XPENDING` 0 at end. Evidence: output + captured `XPENDING` before/after. (Amended 2026-10-27c: was a bare
  consumer; the sidecar-restart case is AC-24.)
- **AC-3 Silence is not evidence.** `tests/negative/silence-is-not-evidence.test.ts`: an expired heartbeat
  window (including a quiet mailbox for a Grok worker) yields one `observation{stall_suspected}` and zero
  `cancel`/`release`/reassign/foreign `XAUTOCLAIM` calls on an injected Redis spy; an injected `exited` verdict
  permits reassign. Reverting the guard fails the test.
- **AC-4 Replay → receipt.** `foreman-bus export --run <runId>` writes the JSONL transcript and a receipt under
  `docs/receipts/<workflowId>/`; `receipts validate` exits 0 and `sha256(transcript.jsonl)` matches the receipt
  subject. Evidence: command output.
- **AC-5 Local-only binding.** `docker compose ps` / `docker port` output shows Redis **not published to the
  host** (default profile) and every published port (sidecar MCP/A2A) bound to `127.0.0.1` only;
  `scripts/acl-probe.sh` prints allowed/denied per credential (each sidecar user and `bridge` denied `FLUSHALL`,
  `CONFIG`, `XGROUP DESTROY`, `DEL`, keys outside `fl:*`; a sidecar user cannot read another sidecar's
  `w.<agentId>` group); after `docker compose restart` the run stream and pending lists are intact (AOF). Evidence:
  committed probe output. (Amended 2026-10-27c: was "Redis published on `127.0.0.1` only" with classes
  `pc-agent`/`bridge`.)
- **AC-6 Grok inbound wake (live probe).** A `question` addressed to `grok:<id>` makes the Grok bridge sidecar POST the
  agent's routine webhook; the routine run's `<webhook_event>` block contains the full message (or the message
  minus a `payloadRef`); the agent answers and acks via the mailbox (AC-8). Evidence:
  `docs/goals/agent-bus/evidence/grok-inbound-<date>.md` with messageId, bridge HTTP status, the inbox mirror
  path + SHA, and `XPENDING` for `w.grok:<id>` = 1 before / 0 after the bridge ingests the `ack`.
- **AC-7 Grok duplicate wake.** The same wake is delivered twice; the second turn finds its existing `answer`
  in `outbox/` and writes nothing. Evidence: two wake log lines, one `answer` entry in `XRANGE`, one outbox file.
- **AC-8 Grok outbound via mailbox.** A Grok agent commits `heartbeat` (with `phase`, `nextCheckInBy`),
  `answer`, `ack` and `result` files to `outbox/`; the bridge republishes each onto `fl:run:<runId>` with the
  same `messageId`, in `channelSeq` order, writes a `consumed/` marker containing the stream entry id, and the
  `result` passes `resultEnvelopeSchema`. Evidence: `XRANGE` excerpt, mailbox commit SHAs, bridge log in
  `docs/goals/agent-bus/evidence/grok-outbound-<date>.md`.
- **AC-9 Mailbox ingest is idempotent and ordered.** `tests/mailbox/ingest.test.ts` (local bare git repo
  fixture): re-running ingest over the same commits publishes nothing new; files with `channelSeq` 1,3,2 are
  published 1,2,3; a gap (1,3 only) holds 3 for the configured polls, then publishes it with
  `observation{seq_gap}`; a late 2 is still published once. Evidence: test output.
- **AC-10 Mailbox validation and quarantine.** Same suite: a file whose `from` ≠ its `outbox/<agentId>/`
  folder, an unknown agent, a schema-invalid body (against
  `m0r6aN/agent-bus-mailbox/schemas/mailbox-message.schema.json`), an oversize body, or a secret-pattern hit is
  **not** published; the bridge writes `rejected/<agentId>/<messageId>.json` with a typed reason. Evidence: test output
  listing each refusal code.
- **AC-11 Cron fallback.** With webhook delivery disabled, the agent's cron routine reads `inbox/<agentId>/`,
  processes the message, and its outbox `ack` is ingested within two cron periods plus one bridge poll.
  Evidence: enqueue, cron-wake, outbox-commit and `XACK` timestamps (America/New_York and UTC) in the evidence
  file.
- **AC-12 Retention.** `foreman-bus mailbox gc --dry-run` lists exactly the inbox/outbox/consumed files of runs
  whose transcript receipt validated more than the retention window ago; the non-dry run commits their removal
  and never touches open runs. Evidence: dry-run and commit output.
- **AC-13 No secrets, no Orca coupling.** `gitleaks detect` over `plugins/foreman-line/agent-bus` and over the
  mailbox repo reports 0 findings; `rg -i orca plugins/foreman-line/agent-bus/src` is empty and `package.json`
  has no Orca dependency. Evidence: command output.
- **AC-14 Agent cards.** Every `agent-bus/registry/agents/*.json` validates against the pinned A2A 1.0
  `AgentCard` schema (`tests/a2a-card.test.ts`); each running sidecar's MCP `tools/list` shows the `bus.*` tools
  plus one `ask_<agentId>` per other card with the `ask` skill. Evidence: test output + a `tools/list` JSON per
  sidecar. (Amended 2026-10-27c: was a single local MCP server.)
- **AC-15 Hosting is config-only.** The integration suite (AC-2, AC-3, AC-9, AC-24) passes unchanged against two
  `BUS_REDIS_URL`s (plain local and a TLS-enabled container) with the same sidecar image, and `rg` finds no
  branch on hosting mode in `src/`. Evidence: two runner outputs + `rg` output. (Hosted-provider run itself is BUS-P8.)
- **AC-17 Spoofed sender rejected.** `tests/identity/spoofed-sender.test.ts` (bare-repo fixture, test keys
  generated per run): a file in `outbox/grok-a/` claiming `from: grok:a` but signed with `grok:b`'s key, a file
  in `outbox/grok-a/` claiming `from: grok:b`, and an unsigned `result` are each **not** published; each yields a
  `rejected/` file with code `KEY_AGENT_MISMATCH`, `FOLDER_MISMATCH` or `SIG_MISSING` and an
  `observation{mailbox_rejected}` entry. Evidence: test output with codes + `XRANGE` showing no published entry.
- **AC-18 Signature and nonce integrity.** Same suite: one flipped byte in any signed field → `SIG_INVALID`; a
  `result` whose `replyNonce` was issued to another agent → `NONCE_AGENT_MISMATCH`; a second `result` reusing a
  nonce → `NONCE_REUSED`; a replayed file from an earlier run → `NONCE_UNKNOWN`; a valid file → published with
  `sigVerified: true` recorded in its `consumed/` marker. Canonicalization is proven by a committed test vector
  (`tests/fixtures/sig-vector.json`: message, JCS bytes hex, public key, signature) that both the bridge and the
  Grok-side signer script reproduce. Evidence: test output + vector check output from both implementations.
- **AC-19 Rotation and revocation.** `tests/identity/key-lifecycle.test.ts`: during an overlap window both old
  and new keys verify; after `retiredAt` the old key verifies only messages with `sentAt` before it; after
  `revokedAt` every message signed by that key is rejected `KEY_REVOKED` and an `observation{key_revoked}` is
  published to each open run where the agent holds a task. Evidence: test output.
- **AC-20 Grok agents verify the bridge.** A Grok worker given an inbox copy with a bad bridge signature refuses
  to act and writes an `observation{bridge_sig_invalid}` instead of a reply. Evidence: BUS-P5 live-probe file
  `docs/goals/agent-bus/evidence/grok-bridge-sig-<date>.md` with the inbox path and the agent's observation file.
- **AC-21 Key custody probe (BUS-P0) — the deciding check for Grok custody (D20, D23).** Evidence file
  `docs/goals/agent-bus/evidence/key-custody-<date>.md` records, for two different Grok bots: whether a secret
  saved to bot A is visible in bot B's shell environment, whether it is visible on the shared box filesystem, and
  whether it can be used in a shell during a turn without being printed. The result sets each Grok agent's
  registry `keyCustody` (`per-bot-secret` or `box-shared`); under D23 either result lets v1 proceed, and
  `box-shared` turns on the result label.
- **AC-22 Sidecar refuses unsigned or forged-origin sends.** `tests/sidecar/refusal.test.ts` drives one sidecar's
  MCP tools: `bus.publish` with a client-supplied `sig`, `from`, `messageId`, `sentAt` or `role` returns
  `CLIENT_FIELD_FORBIDDEN`; with the key secret absent the sidecar returns `KEY_UNAVAILABLE`; for each refusal
  `XLEN fl:run:<runId>` is unchanged. A normal publish returns `OK` and the entry verifies against the registry.
  Evidence: test output with reply codes + `XLEN` before/after.
- **AC-23 Key material never leaves the sidecar.** `tests/sidecar/key-custody.test.ts`: the test key seed does not
  appear in any `tools/call` or `tools/list` response, sidecar stdout/stderr, `docker inspect` env, the Redis AOF
  file or `XRANGE` output, or any other container's mounts/env (0 hits for the base64url seed and its hex);
  `docker inspect` shows the secret mounted into exactly one container; the image layers contain no key
  (`docker history` + `gitleaks`). Evidence: scan output (hit counts) + mount listing.
- **AC-24 Sidecar restart resumes pending messages.** `tests/integration/sidecar-restart.test.ts`: `docker kill`
  a sidecar after its `XREADGROUP` and before the agent's `bus.ack`; restart it; it reclaims its own pending
  entries with `XAUTOCLAIM` under the same consumer name, redelivers them in original order, processing happens
  once (dedupe hit logged), and `XPENDING` is 0 after `bus.ack`. A different sidecar's attempt to
  `XAUTOCLAIM` that group is denied by ACL. Evidence: output + `XPENDING` before kill / after restart / after ack.
- **AC-25 Redis sees only signed envelopes.** After the integration suite, `foreman-bus verify --run <runId>` over
  `XRANGE fl:run:<runId> - +` verifies every entry's signature and exits 0 with a count equal to `XLEN`.
  `tests/sidecar/raw-inject.test.ts` injects an unsigned entry and a wrong-key entry directly via `redis-cli`
  with a test credential: the addressed sidecar delivers neither to its agent, publishes
  `observation{sig_rejected, code}` (itself signed) and `XACK`s the injected entry after recording the rejection.
  Evidence: verify output + test output with codes `SIG_MISSING` / `SIG_INVALID` / `KEY_AGENT_MISMATCH`.
- **AC-26 Sidecar surface isolation.** Each sidecar requires its own MCP bearer token (`AUTH_FAILED` for another
  sidecar's token, checked pairwise for all configured sidecars); the agents' own environments contain no
  `BUS_REDIS_URL`, Redis credential or signing key (`env` capture of each agent launcher); no agent container or
  process has a network path to Redis (connection attempt from the agent's network namespace fails). Evidence:
  pairwise result matrix + env/network captures.
- **AC-27 Retries, spool, heartbeats and reply codes.** `tests/sidecar/reliability.test.ts`: with Redis stopped,
  `bus.publish` returns `QUEUED_SPOOLED` and the signed message sits in the sidecar's spool volume; after Redis
  returns it appears once, in order, and survives a sidecar restart in between; a duplicate `idempotencyKey`
  returns `DUPLICATE`; an oversize body returns `TOO_LARGE`; a body matching a secret pattern returns
  `SECRET_PATTERN`; an unknown run returns `UNKNOWN_RUN`. The sidecar's automatic heartbeat carries
  `hbSource: sidecar` and never extends an agent's work window; only agent-called `bus.heartbeat` (`hbSource:
  agent`, with `phase`) does (D4). Evidence: test output listing each code + spool/`XRANGE` excerpts.
- **AC-28 Grok mediation is stated and visible.** The registry marks every `grok:*` agent `mediation: grok-bridge`
  and records `keyCustody`; every stream entry that originated in the mailbox carries a bridge-signed `relay`
  attestation (`via`, `sigVerified`, `custody`, `ingestedAt`, `sha256` of `m`); the coordinator view and the
  `BusTranscript` receipt show "via grok-bridge" and the custody label on each such `result`; a sidecar rejects
  a mailbox-origin entry with a missing or invalid `relay` (`RELAY_MISSING` / `RELAY_INVALID`). Evidence: test
  output + a rendered coordinator result line.
- **AC-29 Optional A2A surface.** With `BUS_SIDECAR_A2A=1` the sidecar serves its agent card at the A2A
  well-known path and an A2A `SendMessage` becomes a signed bus message from that sidecar's agent id (an A2A
  caller cannot choose `from`); with the flag off nothing listens; the port is bound to `127.0.0.1`; the
  `PARTIAL`/`BLOCKED` projection matches D25. Evidence: `docker port` output with flag on/off + test output.
- **AC-16 Specs lint.** At split time `spec-linter` exits 0 on every parcel spec, and every AC in them names a
  test, command output, or artifact. Evidence: linter output.

## Out of Scope

- Hosted Redis, any cloud deployment, and a Grok-reachable bus MCP server in v1 (BUS-P8 only).
- gRPC/protobuf (D10); an A2A server other than the optional per-sidecar, local-only surface (D8, AC-29).
- A persistent sidecar for any Grok Bot agent (they cannot host one, D20); a central, shared bus server (D18).
- Per-run ephemeral key issuance for dynamically spawned workers (D18: fixed pool identities in v1).
- Protecting one PC agent from another running as the same OS user beyond AC-23/AC-26 (D19 limit).
- Changing `worker-envelopes`, `contracts`, `receipts` or `role-authority` schemas (separate §11 amendment if
  needed).
- Any change to Orca, the Keon MCP Gateway (its P8 fronting is a Keon-side parcel), keon-cortex, or the agent-memory
  repo; the mailbox is a separate repo.
- Building the Cortex importer (BUS-P9 only defines the event).
- Parcel claim/lease/ordering (`parcel-queue-and-claim` owns it); the bus never claims, merges or verifies.
- Grok Bot's built-in agent-to-agent send as a bus transport.
- A Grok run coordinator (BUS-P10, after BUS-P8) (D17).
- Per-agent GitHub machine accounts or a GitHub App for commit identity (E.10 layer L4, deferred to BUS-P8, D24).
- Putting the Keon MCP Gateway in v1 (optional P8 front end, D21).
- Opening any inbound port, tunnel, or public listener on Clint's PC.
- Multi-tenant operation; tenant is `clint`.

## Context & References

- Worker envelopes: `plugins/foreman-line/worker-envelopes/src/task-envelope.ts`, `.../result-envelope.ts`
- Correlation + `ReceiptRef`: `plugins/foreman-line/contracts/src/correlation.ts`, `.../envelope.ts`
- Receipts: `plugins/foreman-line/receipts/README.md`; roles: `plugins/foreman-line/role-authority/src/roles.ts`
- Neighbour goal: `plugins/foreman-line/docs/goals/parcel-queue-and-claim/charter.md`
- Orca (reference only, `/workspace/orca-review` HEAD `dc735050`):
  `skill-guides/orchestration/references/{messaging-and-gates,worker-contract,recovery-and-cleanup}.md`
- A2A Protocol Specification 1.0.0 (patch 1.0.1, 2026-05-28): https://a2a-protocol.org/latest/specification/ ,
  https://github.com/a2aproject/A2A/blob/v1.0.0/specification/a2a.proto
- Redis Streams commands (BUS-P8 provider reference): https://upstash.com/docs/redis/commands/streams/overview
- agent-memory `GROK.md`, `CONVENTIONS.md` §4 (key alphabet), §7 (git etiquette reused for the mailbox), §8
  (Cortex import); `shared/agents.md` (agent ids reused as bus `agentId`s)
- Keon MCP Gateway (per `/workspace/keon/KEON-SYSTEMS-ARCHITECTURE.md` §4.2, 2026-10-24): Streamable HTTP
  `POST /mcp`, JWT/API-key auth, fixed tool families routed to Keon backends (optional P8 front end for sidecars, D21)

### A. Message shape (`bus-message.kaseya/v1`; stream entry field `m` = canonical JSON)

| Field | Req | Notes |
|---|---|---|
| `apiVersion` | yes | `bus-message.kaseya/v1` |
| `messageId` | yes | UUID; dedupe key (D6) |
| `idempotencyKey` | yes | `<runId>:<type>:<from>:<seq>` |
| `type` | yes | D3 closed set |
| `from`, `to` | yes | `agentId`s (`coordinator` or registry id); no group/wildcard targets for lifecycle types |
| `correlation` | yes | full `CorrelationContext` |
| `taskId`, `goalId`, `parcelId` | yes | as `TaskEnvelope` |
| `role` | yes | sender's `RoleId` |
| `sentAt` | yes | ISO UTC (`ISO_UTC_PATTERN`) |
| `inReplyTo` | `answer`, `ack` | `messageId` being answered/acked |
| `ackOf` | `ack` | stream entry id being acked (from the wake/inbox copy) |
| `phase` | `heartbeat` | `investigating\|implementing\|reviewing\|waiting` |
| `nextCheckInBy` | `heartbeat` (turn-based: required) | ISO UTC; the sender's own promise |
| `hbSource` | `heartbeat` | `sidecar` (automatic liveness of the sidecar only) or `agent` (agent-called, carries `phase`); only `agent` extends a work window (AC-27) |
| `replyNonce` | `answer`, `ack`, `result`, `release`, `heartbeat` from mailbox | echo of the bridge-issued nonce on the message being replied to (E.10) |
| `sig` | **every message** (amended 2026-10-27c: was mailbox-originated and bridge inbox copies only); made by the sender's sidecar (PC) or the Grok agent itself (mailbox) | `{alg: "Ed25519", keyId, value}` — same shape as receipts' `Signature` (E.10) |
| `channel`, `channelSeq` | mailbox-originated only | `mailbox`; per-(agent, run) monotonic integer from 1 |
| `relay` | mailbox-originated, stream entry field beside `m` (not inside the signed bytes) | bridge-signed attestation `{via: "grok-bridge", keyId, sigVerified, custody, ingestedAt, sha256: <of m>, sig}` (D20, AC-28) |
| `payload` / `payloadRef` | per type | `task`→`TaskEnvelope`, `result`→`ResultEnvelope`; large → `ReceiptRef` or `repo@sha:path` |

### B. Streams and groups (local Redis, unchanged under BUS-P8)

`fl:run:<runId>` — the run's single ordered log; groups `coordinator`, `w.<agentId>` per worker (consumer name =
the agent's sidecar, `<agentId>`; incl. `w.grok:<id>`, whose acks the Grok bridge sidecar performs on the agent's
behalf), `bridge.grok`, optional `audit`. Readers
ack entries not addressed to them with no side effect. `fl:runs` — run open/close registry the bridge watches.
`fl:ask:<agentId>` — D9 tickets. `fl:memory` — reserved for BUS-P9.

### C. A2A TaskState projection (accepted, D25)

`task` enqueued → `SUBMITTED`; first `heartbeat` → `WORKING`; open `question` → `INPUT_REQUIRED`; `result`
`COMPLETED` → `COMPLETED`; `PARTIAL` → `COMPLETED` + `metadata.foremanStatus=PARTIAL`; `FAILED`/`BLOCKED` →
`FAILED` + `metadata.foremanStatus`; `REFUSED` → `REJECTED`; `cancel` + worker `release` → `CANCELED`.
Foreman `ResultStatus` stays authoritative.

### D. Hosting and architecture

```
 PC (Docker, one compose project; Redis on the internal network only)
 ┌────────────┐ MCP/127.0.0.1 ┌──────────────────┐        ┌────────────────────┐
 │ Claude Code├──────────────►│ sidecar claude   │        │                    │
 │ Codex …    │ (own token)   │ key · sign · XADD├───────►│ redis:7  (AOF,ACL) │
 │ Orca w1..  ├──────────────►│ XREADGROUP/XACK  │◄───────┤ fl:run:<runId> …   │
 └────────────┘               │ XAUTOCLAIM spool │        │ only signed        │
   agents never see           └──────────────────┘        │ envelopes          │
   Redis or keys              ┌──────────────────┐        │                    │
                              │ Grok bridge      ├───────►│                    │
 mailbox repo ◄── git poll 60s│ sidecar: verify  │◄───────┤                    │
 (agent-bus-mailbox)  ──────► │ bot sigs, nonces,│        └────────────────────┘
 webhook POST ◄───────────────┤ relay attestation│   Grok Bot agents (cloud, turn-based)
                              └──────────────────┘   sign their own outbox files; no Redis
```

**v1 (D13, D18): local Docker on the PC.** One compose project: `redis:7` (internal network, `appendonly yes`,
ACL users one per sidecar plus `bridge`), one `sidecar-<agentId>` service per local agent generated from the
registry (same image, own key secret, own MCP token, own published `127.0.0.1` port or stdio via `docker exec`;
transport chosen in BUS-P0/P4a), and `bridge` (Grok bridge sidecar: wake sender + mailbox ingester + relay
attestor). Local CLIs (Claude Code, Codex, Gemini, Pi) talk only to their own sidecar over localhost. Properties:
zero cloud cost, no data leaves the PC except Grok-addressed messages, no inbound path. Accepted cost: **the bus is
down whenever the PC is off or asleep.** Grok replies then queue safely in the mailbox repo and are ingested on
resume; wakes to Grok agents pause; sidecars spool signed outbound messages across Redis outages and restarts.

**Upgrade path (BUS-P8): hosted Redis with TLS (Upstash recommended) + sidecar/bridge containers on Azure
Container Apps.** Adds a Grok-reachable bus MCP surface (`bus.publish/read/ack/pending/heartbeat`, `ask_*`) served
by sidecars, optionally fronted by the Keon MCP Gateway (D21; not a central bus server), removes the PC-uptime
dependency, and lets Grok agents publish directly with minute-scale latency replaced by turn latency only.
Config-only per D14; the mailbox channel remains as fallback. Rejected for now: a tunnel to the PC (new inbound
path, PC-uptime-bound) and Redis on the shared box (process persistence unverified; every Grok agent can reach the
raw store).

### E. Grok Bot participation (essential)

**E.0 Boundary (D20).** Grok agents are the one participant class with no sidecar of their own. A single Grok
bridge sidecar stands in for the team: it relays inbound wakes and outbound mailbox files and verifies each bot's
signature, nonce and folder. Identity for Grok agents is **mediated at this boundary**; it is not the end-to-end
sidecar-held key model that PC agents have. Receiving sidecars still re-verify the agent's own signature, but the
custody behind it is whatever AC-21 establishes and is labelled on every result (D23).

**E.1 Facts relied on (verified; nothing else assumed).** Grok agents run in the cloud on one shared Linux box
(shared filesystem; `gh` logged in as `m0r6aN`); outbound internet; turn-based, not listening between turns;
the PC cannot reach the box and the box cannot reach the PC. Routines wake an agent on: a webhook (per-routine
URL, POSTed with a sender key; **the POST body is delivered to the routine's run in a `<webhook_event>`
block**), GitHub repo/PR events, Linear, email, Slack, or cron (≥ 5 min). A wake runs a saved prompt. During a
turn agents can run git, gh, curl and python. They can call remote MCP servers by URL (used only in BUS-P8). Each bot can hold its own saved secrets exposed
to it as environment variables (`process.env`); whether another bot or the shared filesystem can read them is
**unverified** and is a BUS-P0 probe (AC-21).

**E.2 Participant class `turn-based`.** Registry `liveness: continuous | turn-based`. For Grok agents the
coordinator expects reply latency = wake-to-turn + turn length + `git push` + bridge poll — **minutes, not
seconds** (design target: p50 ≤ 5 min, p95 ≤ 20 min while the PC is awake; P0 measures it). Heartbeat window =
`max(nextCheckInBy + grace, 2 × cron period + max turn + 2 × bridge poll)`, set to 45 min (D16, decided); question SLA 30–60
min. Under D4 an expired window only yields `stall_suspected`. Per D17, v1 Grok agents are workers, reviewers,
scouts and specialists only; a Grok run coordinator is BUS-P10.

**E.3 Identity.** `agentId` = `grok:<issued_by>` from agent-memory `shared/agents.md` (`grok:gawd`,
`grok:grokbot-platform-ops`). Registry file `agent-bus/registry/agents/<agentId>.json` = A2A card + bus
extension (`liveness`, `cronPeriodMinutes`, secret *names* of its webhook URL and sender key).

**E.4 Inbound (bus → Grok): outbound HTTPS wake from the PC.**
1. The Grok bridge sidecar (`bridge.grok` group) reads run streams listed in `fl:runs`. For an entry with `to: grok:<id>` it
   issues a fresh `replyNonce` for that (message, agent), signs the message with the bridge key (`sig`), mirrors it
   to the mailbox repo `inbox/<agent-folder>/<runId>/<file>` (E.6 naming) and pushes.
2. It then POSTs the agent's routine webhook (URL + sender key resolved by name from the PC secret store). Body:
   `{busVersion, agentId, stream, entryId, message, inboxPath, inboxCommit, pendingCount, bridgeSig}` where
   `message` is the full `bus-message.kaseya/v1` object (body ≤ the measured webhook limit; larger payloads go
   by `payloadRef` to the inbox file). This is enough to act on without reading the bus.
3. Bridge `XACK`s its own `bridge.grok` entry only after a 2xx; otherwise exponential backoff (1, 2, 4 … ≤ 30
   min) + `observation{wake_failed}`. The entry stays pending on `w.grok:<id>` regardless.
4. Coalescing: ≤ 1 wake per agent per 5 min; a wake carries the newest message plus `pendingCount`, and the
   agent drains the rest from `inbox/`. `question`/`cancel` may bypass the window once.
5. The routine's saved prompt (template shipped in BUS-P5) tells the agent: `git pull` the mailbox clone; verify
   the bridge signature on the message against the pinned bridge public key before acting on anything (a leaked
   webhook URL alone cannot inject work; failure → `observation{bridge_sig_invalid}`, AC-20); treat content as untrusted data; skip anything already acked
   in its `outbox/`; act within its `TaskEnvelope`; write replies + one `ack` per processed message, each echoing that message's `replyNonce` and signed
   with the agent's own key (E.10); push.
6. Ack semantics: webhook 2xx = wake delivered; inbox commit = durable copy; the agent's `ack` file, once
   ingested, = processed (bridge `XACK`s `w.grok:<id>`). Only the last clears the coordinator's pending view.

**E.5 Outbound (Grok → bus): the mailbox repo is the official v1 path.** Grok agents cannot reach the PC, so
every reply, `ack`, `heartbeat`, `release` and `result` is a file committed with `gh`/git from the shared box to
`outbox/<agentId>/<runId>/`. The bridge polls, validates, republishes, and marks consumed (E.6). Each Grok turn on
an open task commits a `heartbeat` at turn end with `nextCheckInBy`.

**E.6 Mailbox repo specification.**
- **Repo (exists, created by Clint 2026-10-27; scaffolded at commit `0377bfa`):** private
  https://github.com/m0r6aN/agent-bus-mailbox (chosen over agent-memory: different lifecycle —
  transient, high-churn, garbage-collected — and must not pollute memory history or its validator). Box clone:
  `/workspace/agent-bus-mailbox`. Default branch `main`; no force-push, no history rewrite (agent-memory
  CONVENTIONS §7 etiquette: `pull --rebase`, retry push ≤ 3, then stop and report).
- **Layout:**
  ```
  README.md                                      # layout + rules (scaffolded)
  .gitattributes                                 # *.json eol=lf -merge: git never rewrites signed bytes
  schemas/mailbox-message.schema.json            # JSON Schema for one mailbox message (scaffolded draft)
  inbox/<agent-folder>/<runId>/<file>.json       # bridge-written, bridge-signed copies of messages TO Grok agents
  outbox/<agent-folder>/<runId>/<file>.json      # agent-written, agent-signed messages FROM Grok agents
  consumed/<agent-folder>/<runId>/<messageId>.json # bridge: {messageId, streamEntryId, ingestedAt, commit, sigVerified}
  rejected/<agent-folder>/<runId>/<messageId>.json # bridge: {messageId, reason, detectedAt}
  ```
  `<agent-folder>` is the `agentId` with `:` replaced by `-` (`grok:gawd` → `grok-gawd`; colons are unsafe in
  Windows paths). Agents write only `outbox/<own folder>/`; the bridge writes everything else. Folder ownership
  is a consistency check; identity is the signature (D15). The authoritative key registry lives on the PC, not
  here (E.10).
- **File name:** `<channelSeq, 6-digit>-<YYYYMMDDTHHMMSSZ>-<type>-<messageId>.json`; `channelSeq` is
  per-(agent, run), starting at 1, computed as max existing outbox seq + 1 after `git pull`. Inbox files use the
  stream entry id in place of `channelSeq`.
- **Body:** exactly one `bus-message.kaseya/v1` object, plus `channel: "mailbox"` and `channelSeq`. No wrapper;
  the bridge republishes it byte-identical. `idempotencyKey` uses `channelSeq` as
  `<seq>`.
- **Ingest (bridge):** poll `git fetch` every **60 s** (D16; polling is the only mechanism, the PC receives no
  GitHub events). For each new outbox file: validate schema, `from` == folder agent, agent in registry, size
  ≤ 16 KB, secret-pattern scan, then signature and nonce checks (E.10); on failure write `rejected/` and publish
  `observation{mailbox_rejected}`; on success check `fl:seen:bridge:<messageId>` and `consumed/`, `XADD`, and
  for `ack` also `XACK` `w.grok:<id>` at `ackOf`; then write `consumed/` and push. Crash between `XADD` and
  `consumed/` is safe: the retry hits the dedupe key.
- **Ordering:** publish per (agent, run) in `channelSeq` order. A gap holds later files for 3 polls, then
  publishes them with `observation{seq_gap}`; a late file is still published once. Cross-agent order is
  ingestion order (the stream's order is authoritative).
- **Retention / cleanup:** `foreman-bus mailbox gc` removes a run's `inbox/`, `outbox/`, `consumed/` and
  `rejected/` files once its `BusTranscript` receipt validates and **14 days** have passed (D16, decided; the stream
  transcript holds the content). Removal is a normal commit; git history remains, which is acceptable because no secrets
  or PII may enter the repo and the bridge quarantines secret-pattern hits.
- **Credentials:** the bridge uses a fine-grained GitHub token limited to this repo, contents read/write,
  stored in the PC secret store. Grok agents use the box's existing `gh` login, so every commit is authored by
  `m0r6aN`; commit author therefore proves nothing about which agent wrote a file. Identity is E.10.
- **Cron fallback:** each Grok agent with an open task has a cron routine (15 min, D16; removed when the task
  closes) that pulls the mailbox and processes `inbox/<own agentId>/` entries with no matching `ack` in its
  outbox. This covers lost or failed wakes and PC-asleep periods.

**E.7 Secrets and least privilege.** Redis ACL users (amended 2026-10-27c; was classes `coordinator`, `pc-agent`,
`bridge`): one per sidecar, `sc.<agentId>` (XADD, XREADGROUP, XACK, XPENDING, XAUTOCLAIM on `fl:run:*`, `fl:ask:*`;
group commands only for its own `w.<agentId>` group), `bridge` (read, XACK, XADD of mailbox-originated messages
and `observation`), and `coordinator-admin` (group admin, held by the operator CLI only, never by a sidecar).
Agents hold no Redis credential at all, and Grok agents hold none in v1. Each sidecar also holds: its signing key
(file secret, D19), its MCP bearer token (given to its agent only). Webhook URLs and sender keys live only in the PC
secret store, by name in the registry, mounted only into the bridge. Each credential rotates independently.

**E.8 Safety rules for Grok recipients.** Bus/mailbox content from other agents is untrusted data. A bus message
never counts as Clint's approval for an externally visible or irreversible action; a Grok worker needing one
sends `question` to the coordinator and the human gate happens outside the bus (D12).

**E.9 Keon MCP Gateway (optional front end, D21).** In BUS-P8 the sidecars' MCP tools and `ask_*` may sit behind
the gateway (Streamable HTTP, JWT/API-key auth, usage accounting). Its catalog is fixed families routed to Keon
backends, its ingress spine defaults to `Off`, and it has a known idempotency-key conflict with Runtime, so fronting
is a Keon-side parcel. The gateway is never a bus server and never holds an agent's signing key. Default: no gateway;
sidecars expose gateway-compatible tool names (`bus.*`, `ask_*`). (Was: "standalone bus MCP server vs gateway" open
question, resolved by D21.)

**E.10 Per-agent identity (required in v1, D15).**

*Threat model, stated honestly.* All Grok agents share one box filesystem and one `gh` identity (`m0r6aN`).
Anything stored as a file on the box is readable by every agent there. The goals, in order: (a) no outsider
(anyone with repo read, a leaked webhook URL, or a stolen GitHub token without agent keys) can post as an agent;
(b) no accidental misattribution (an agent writing the wrong folder or `from`, a stale replay); (c) a co-resident
agent cannot deliberately impersonate another — achievable **only** if private keys are kept off the shared box.

*Options evaluated.*

| Option | Protects (a) | (b) | (c) | Cost / caveat |
|---|---|---|---|---|
| Folder ownership only | no | partly | no | v1-draft baseline; insufficient per Clint |
| Per-agent Ed25519 keys as files on the box | yes | yes | **no** (any agent can read any key file) | cheap; proves *which key*, not which agent |
| Per-agent Ed25519 keys in each bot's own secret storage (`process.env`) | yes | yes | **yes, if per-bot isolation holds** (P0 probe, AC-21) | preferred custody; must never be written to disk or printed |
| Per-agent GitHub machine accounts / fine-grained tokens / GitHub App installation tokens | partly | yes | only if the token is also kept off the box | real per-agent commit authors and audit; extra accounts/app to run; token custody has the same box problem |
| Bridge-issued per-message nonce echo | partly (replay, unsolicited replies) | yes | no (inbox copies are readable by all) | binds a reply to the exact message it answers |

*Chosen: layered L1 + L2 + L3, with L4 deferred to BUS-P8 (D24).*
- **L1 — Ed25519 message signatures (the identity).** One keypair per agent. Private key custody: **PC agents** —
  the agent's own sidecar only (compose file-secret, D19); **Grok agents** — the bot's own secret storage (env var
  `BUS_SIGNING_KEY`, base64url 32-byte seed). Never in a repo, image, file on a shared path, memory record,
  message, or command output. Registry `keyCustody` records `per-bot-secret` once AC-21 proves isolation, else
  `box-shared`. While an agent is `box-shared`, its messages still need valid signatures, and the coordinator
  shows its `result`s as "signed, custody box-shared" so a human knows (c) is not guaranteed.
- **L2 — Bridge-issued nonces.** For each message the bridge sends to a Grok agent it mints a 128-bit random
  `replyNonce` bound to (`messageId`, recipient `agentId`, `runId`) and stores it in Redis
  (`fl:nonce:<runId>:<nonce>`). Replies (`answer`, `ack`, `release`, `result`) and the agent's `heartbeat`s
  echo the nonce of the message they relate to (for `result`/`heartbeat`, the `task` message). Each nonce is
  single-use per reply type (`answer`, `ack`, `result`, `release`); `heartbeat` may reuse it with increasing
  `channelSeq`. Unsolicited agent-initiated `question`/`observation` carry the `task` nonce.
- **L3 — Bridge signing.** The bridge signs every inbox copy and webhook body with its own Ed25519 key (kept in
  the PC secret store). Its public key is pinned in each Grok agent's routine prompt and in the mailbox README
  when BUS-P5 creates it. Agents act on nothing whose bridge signature fails (AC-20).
- **L4 — Per-agent commit authors (deferred to BUS-P8, D24).** GitHub machine accounts or a GitHub App would give
  distinct commit authors, but the token would sit in the same custody as the signing key and add little over L1.
  Reconsider in BUS-P8. Until then agents set `git -c user.name=<agentId>` for readability only; it is never trusted.

*Who signs.* PC agents: their sidecar signs every outbound message (D19); receiving sidecars verify before delivery.
Grok agents: the agent signs its own outbox file in its turn; the Grok bridge sidecar verifies and adds the signed
`relay` attestation (D20); the bridge signs inbox copies (L3). All signing uses the same canonicalization below.

*Signature envelope.* `sig = {alg: "Ed25519", keyId: "<agentId>#<YYYYMMDD>-<n>", value}` (same shape as the
receipts package's `Signature`). Signed bytes = RFC 8785 (JCS) canonical UTF-8 of the whole message with
`sig.value` removed (`sig.alg` and `sig.keyId` stay inside, so the key choice is signed). This covers `from`,
`to`, `correlation`, `inReplyTo`, `replyNonce`, `channelSeq`, `sentAt` and the payload. Ed25519 per RFC 8032
(pure, no prehash); `value` = base64url, no padding (86 chars). The same JCS implementation the receipts package
cites is used; a shared test vector pins it (AC-18). The file on disk is the JCS bytes, so `.gitattributes`
forbids line-ending or merge rewrites.

*Key registration.* Authoritative registry: `plugins/foreman-line/agent-bus/registry/agents/<agentId>.json` on
the PC (`keys: [{keyId, publicKey, status: active|retired|revoked, createdAt, retiredAt?, revokedAt?}]`,
`keyCustody`). A key becomes active only when Clint approves the registry change (a reviewed commit on the PC).
agent-memory `shared/agents.md` gets a mirrored `keyId` + public-key fingerprint column for discoverability;
because every agent can edit agent-memory, the bridge never trusts it. Provisioning (decided, D22; was: generated in the bot's turn
or on the PC): Clint generates the keypair on the PC with `foreman-bus keygen`, pastes only the private half into
that bot's secrets (or, for a PC agent, into that sidecar's secret file), and only the public key enters the
registry. The BUS-P0 probe still checks how and whether a bot's secret can be used in a turn without printing it.

*Rotation.* New key registered `active` → overlap window 7 days where both verify → old key `retired` (verifies
only messages with `sentAt` < `retiredAt`) → removed from the bot's secrets. Bridge key rotates the same way, with
the new public key pinned in routine prompts before the old one retires.

*Revocation.* Set `status: revoked`, `revokedAt` in the PC registry (immediate, no overlap). The bridge rejects
every later file signed by that key with `KEY_REVOKED`, publishes `observation{key_revoked}` to each open run where
the agent holds a task, and never re-admits already-rejected files. Suspected compromise of a box-shared key →
revoke all box-shared keys.

*Bridge verification order and rejection codes.* schema → `FOLDER_MISMATCH` (`from` vs folder) → `SIG_MISSING` →
`KEY_UNKNOWN` → `KEY_AGENT_MISMATCH` (`keyId` prefix ≠ `from`) → `KEY_REVOKED` / `KEY_RETIRED` → `SIG_INVALID` →
`NONCE_UNKNOWN` / `NONCE_AGENT_MISMATCH` / `NONCE_REUSED` → secret scan. First failure wins; the bridge writes
`rejected/…` with the code, publishes `observation{mailbox_rejected, code}`, and publishes nothing else. A failed
signature is never downgraded to "unsigned but accepted".

### F. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| PC off/asleep | bus down; no wakes to Grok | Grok replies queue in mailbox; cron fallback; BUS-P8 removes dependency |
| Minute-scale Grok latency | slow loops, stall false alarms | turn-based windows (E.2); D4 forbids acting on silence |
| Shared box and `m0r6aN` identity | an agent could post as another | Ed25519 signatures + nonces + bridge signing (E.10); keys in per-bot secrets; `box-shared` custody shown on results |
| Per-bot secret isolation does not hold | (c) of E.10 not guaranteed | AC-21 probe decides `keyCustody`; accepted with a label (D23); revisit keys-off-box in P8 |
| Key leak or loss | forged or blocked messages | immediate revocation (E.10), rotation with overlap, rejection codes audited |
| Leaked webhook URL | forged wakes | sender key; agents verify the bridge signature before acting (AC-20) |
| Secret pasted into a message | leak to GitHub | bridge secret scan → quarantine; gitleaks in AC-13; small payloads by reference |
| GitHub outage / push conflicts | delayed replies | distinct files never conflict; retry ≤ 3 then handoff; bridge retries poll |
| Mailbox growth | repo bloat | 14-day gc; ≤ 16 KB files |
| Local Redis data loss | broken audit | AOF on; transcript receipt at close (D7) |
| A sidecar is down | its agent cannot send or receive | outbound spool survives (AC-27); pending entries stay put and resume via `XAUTOCLAIM` on restart (AC-24); D4 forbids acting on the silence |
| Sidecar compromise | holder of one agent's key and Redis user | per-sidecar ACL user, file-secret in one container only (AC-23), revocation (E.10), receiving sidecars re-verify (AC-25) |
| Co-resident PC agent uses another agent's sidecar | impersonation on the PC | per-sidecar MCP tokens (AC-26); stated D19 limit (same OS user is not defended against) |
| Grok bridge is a single point of mediation | admission and custody labelling rest on it | relay attestation + end-to-end agent signature (AC-28); bridge key pinned in prompts; AC-21 sets custody |
| Sidecar sprawl (one per agent) | resource use, config drift | one image, compose generated from the registry; fixed Orca worker pool (D18) |

### G. Parcel breakdown (dependency order; amended 2026-10-27c: P2–P6 and P8 changed, P4 split into P4a/P4b)

| Parcel | Outcome | Risk / routing | Depends on |
|---|---|---|---|
| BUS-P0 — Recon and probes | Reconcile with worker-envelopes/receipts/correlation; measure webhook body size limit and wake latency; box `gh` push concurrency across agents; Docker Redis AOF/ACL on Windows; sidecar MCP transport choice (127.0.0.1 HTTP vs stdio via `docker exec`) and host-to-container networking on Windows; per-bot secret isolation (AC-21, the deciding check for D20/D23). Evidence report only. | elevated / architecture-risk | — |
| BUS-P1 — Message contract | `bus-message.kaseya/v1` incl. `ack`, `hbSource`, mailbox fields and the `relay` attestation; fixtures; A2A projection (AC-1). | elevated / architecture-risk | P0 |
| BUS-P2 — Stream engine library + operator CLI | Library (consumed by sidecars) + `foreman-bus` operator CLI (publish/read/ack/pending/claim/export/verify/keygen), dedupe, redelivery (AC-2, AC-4, AC-15, AC-25 verify). | elevated / architecture-risk | P1 |
| BUS-P3 — Coordinator integration | Liveness-class windows, question/answer, steer/cancel/release, evidence-before-action guard (AC-3); the coordinator talks to the bus only through its sidecar's tools. | critical / architecture-risk | P2, P4a |
| BUS-P4a — Sidecar core | The sidecar process: key load + RFC 8785 signing, client-field refusal, verify-on-read against the registry, consumer group + `XAUTOCLAIM` recovery, spool/retry, automatic `hbSource: sidecar` heartbeat, typed reply codes, MCP tools (`bus.publish/read/ack/pending/heartbeat/status`, `ask_*`), per-sidecar MCP token, optional A2A flag (AC-22, AC-23, AC-24, AC-25, AC-26, AC-27, AC-29). | critical / architecture-risk | P2 |
| BUS-P4b — Sidecar packaging and local runtime | Sidecar Docker image; compose generator from the registry (one service per local agent, file-secret mounts from the PC secret store, internal-only Redis, per-sidecar ACL users, `debug` profile, healthchecks); `acl-probe.sh`; agent-side MCP config snippets (AC-5, AC-26 environment/network checks). | elevated / architecture-risk | P4a |
| BUS-P5 — Grok bridge sidecar and channel | The bridge as a sidecar-image variant: webhook wake sender, inbox mirror on the existing mailbox repo, bridge signing + nonces + `relay` attestation, Grok-side signer script, key registry + rotation/revocation (AC-17–AC-20, AC-28), outbox ingest, consumed/rejected markers, gc, routine prompt + cron template (AC-6–AC-12). | critical / architecture-risk | P3, P4b |
| BUS-P6 — Agent cards + agents-as-tools | Registry, A2A cards, per-sidecar `ask_<agent>`/`get_answer` (Grok asks ticketed via mailbox) (AC-14). | elevated / architecture-risk | P4a, P5 |
| BUS-P7 — Negative controls + exit evidence | Forged wake, spoofed signer, revoked key mid-run, wrong-folder file, duplicate wake, seq gap, PC sleep mid-run, bridge crash between XADD and marker, silence-only stall, secret in message, raw unsigned `XADD`, sidecar kill mid-processing, cross-sidecar token use; evidence manifest (AC-13, AC-16). | critical / architecture-risk | P5, P6 |
| BUS-P8 — Hosted upgrade (later) | Upstash TLS Redis + ACA containers for sidecars/bridge; Grok-facing bus MCP surface served by sidecars (per-agent auth; verify how Grok Bot scopes a custom MCP credential); optional Keon gateway fronting (D21); per-agent GitHub accounts re-evaluated (D24); keys-off-box for Grok. Config-only for the contract (D14). | critical / architecture-risk | P7 |
| BUS-P9 — Memory checkpoint events (later) | `memory_checkpoint` `{key, path, commitSha, record_kind}` on `fl:memory` after agent-memory push; `cortex-importer` group reserved. | standard / architecture-risk | P7 |
| BUS-P10 — Grok run coordinator (later) | Lift D17: a `turn-based` agent may coordinate a run once BUS-P8's hosted bus and Grok-facing MCP tools bring loop latency to turn latency; coordinator-specific windows, wake-on-every-worker-message, and Gate-ownership rules. | critical / architecture-risk | P8 |

### H. Sidecar specification (D18, D19)

- **Process model.** One image `foreman-line/bus-sidecar`; one container per agent id. Configuration by environment
  (names only): `BUS_AGENT_ID`, `BUS_REDIS_URL`, `BUS_REDIS_CREDENTIAL` (name), `BUS_SIGNING_KEY_FILE` (path of the
  mounted file secret), `BUS_MCP_TOKEN_FILE`, `BUS_SIDECAR_A2A` (default 0), `BUS_RECLAIM_IDLE_MS`, spool volume
  path. Consumer name = `BUS_AGENT_ID` (D5).
- **Tools (gateway-compatible names).** `bus.publish(type, to, runId, payload|payloadRef, inReplyTo?)`,
  `bus.read(runId?, max, blockMs)` (verified messages only; delivered, not acked), `bus.ack(entryId)`,
  `bus.pending()`, `bus.heartbeat(phase, nextCheckInBy?)`, `bus.status()`, `ask_<agentId>` / `get_answer(ticket)`.
  No tool returns key material, raw stream access, or arbitrary Redis commands.
- **Reply codes (closed set, v1).** `OK`, `DUPLICATE`, `QUEUED_SPOOLED`, `SCHEMA_INVALID`,
  `CLIENT_FIELD_FORBIDDEN`, `KEY_UNAVAILABLE`, `TOO_LARGE`, `SECRET_PATTERN`, `UNKNOWN_RUN`, `NOT_ADDRESSEE`,
  `AUTH_FAILED`; receive-side rejections reuse E.10 codes plus `RELAY_MISSING` / `RELAY_INVALID`.
- **Send path.** validate → assign `from`/`role`/`messageId`/`idempotencyKey`/`sentAt` → canonicalize (JCS) →
  sign → spool (signed bytes, durable volume) → `XADD` → drop from spool on success. Retry with backoff (1, 2, 4 …
  ≤ 30 s) while Redis is unavailable; the spool is replayed in order after a restart.
- **Receive path.** `XREADGROUP` on `w.<agentId>` (and `coordinator` for the coordinator's sidecar) → verify
  signature, key status and (for mailbox-origin) `relay` → dedupe (D6) → expose via `bus.read` → `XACK` only on
  `bus.ack`. Entries not addressed to this agent are acked with no side effect. Rejected entries are recorded as
  `observation{sig_rejected}` and acked (AC-25).
- **Heartbeats.** The sidecar emits `hbSource: sidecar` heartbeats for its own liveness only. Agent work liveness is
  only what the agent reports via `bus.heartbeat` (D4).

### I. Decision history (2026-10-27c)

| Decision | Change | Prior wording / state |
|---|---|---|
| D1, D5, D8, D9, D13, D14, D15 | amended in place (sidecar is the consumer/signer; A2A optional per sidecar; Redis internal; signatures on every message) | kept inline as "was:" or "Amended 2026-10-27c" |
| D18 | new — per-agent sidecar architecture | single local bridge + single local bus MCP server |
| D19 | new — sidecar holds key, signs, refuses unsigned | agents/bridge held signing concern separately; PC agents had `pc-agent` ACL class and raw Redis access |
| D20 | new — one Grok bridge sidecar; identity mediated at that boundary; AC-21 deciding | "bridge" was a local component with no stated mediation |
| D21 | new — Keon gateway optional front end for sidecars (P8) | Open Question 1 |
| D22 | new — Clint generates keys; only the private half is pasted into bot secrets | Open Question 4 |
| D23 | new — box-shared custody accepted with labelled results | Open Question 3 |
| D24 | new — per-agent GitHub accounts deferred to P8 | Open Question 5 |
| D25 | new — A2A mapping accepted | Open Question 2 / §C "(proposed)" |
| D2–D4, D6, D7, D10–D12, D16, D17 | unchanged | — |
| BUS-P4 | split into P4a/P4b; P2, P3, P5, P6, P8 reworded | single "Local runtime" parcel |
| AC-22..AC-29 | new; AC-2, AC-5, AC-14, AC-15, AC-21 amended | see inline "Amended" notes |

## Allowed Files

This umbrella draft authorizes only its own split at Gate 1:

- plugins/foreman-line/docs/goals/agent-bus/charter.md
- plugins/foreman-line/docs/goals/agent-bus/plan-review-findings.md
- plugins/foreman-line/docs/specs/active/FL-BUS-01-agent-bus.md
- plugins/foreman-line/docs/specs/INDEX.md

Sidecar parcels will own, at split time (exact lists per spec): `plugins/foreman-line/agent-bus/src/sidecar/**`,
`.../agent-bus/tests/sidecar/**`, `.../agent-bus/docker/Dockerfile.sidecar`, `.../agent-bus/docker/compose.generate.ts`,
`.../agent-bus/docker/compose.yaml` (generated, no secrets), `.../agent-bus/scripts/acl-probe.sh`, and a
`.gitignore` entry for the PC-local `secrets/` mount directory (the directory itself is never committed).

Each BUS-Pn spec lists its own exact files (e.g. BUS-P1: `plugins/foreman-line/agent-bus/package.json`,
`.../src/bus-message.ts`, `.../schemas/bus-message.schema.json`, `.../tests/parity.test.ts`,
`.../tests/envelope-alignment.test.ts`, `.../tests/fixtures.ts`). The mailbox repo
`m0r6aN/agent-bus-mailbox` already exists (Clint, 2026-10-27) and was scaffolded at commit `0377bfa` (README,
`.gitattributes`, `schemas/mailbox-message.schema.json`, empty `inbox/ outbox/ consumed/ rejected/`); BUS-P5 owns
any further change to it.

## Open Questions

Answered 2026-10-27 and folded in: mailbox repo (exists), identity (D15/E.10), Grok roles (D17), timing and
retention (D16). Resolved 2026-10-27c with Clint's sidecar approval and acceptance of the recommended defaults
(history kept):

1. ~~Keon MCP Gateway: front the bus tools, or standalone?~~ → optional front end for sidecars in P8, not a central
   bus server (D21).
2. ~~A2A mapping of `PARTIAL`/`BLOCKED`~~ → accepted (D25).
3. ~~If per-bot secret isolation fails (AC-21)~~ → accept signatures with labelled `box-shared` results in v1 (D23).
4. ~~Key provisioning~~ → Clint generates on the PC and pastes only the private half into each bot's secrets (D22).
5. ~~L4 commit identity~~ → deferred to BUS-P8 (D24).

Still open (for BUS-P0, not Gate 1 blockers):

6. Sidecar MCP transport per agent tool: `127.0.0.1` HTTP with bearer token vs stdio through `docker exec -i`, and
   Windows host-to-container networking behaviour.
7. Pool size and naming for Orca worker identities (D18) and how a worker's MCP config selects its sidecar.

## Verification Plan

Two independent adversarial reviews (architecture/risk). Mandated reviewer focus questions:

- Can silence, a timeout, an idle pending entry, or a quiet mailbox ever lead to cancel/reassign/release
  without positive evidence (D4/D5)?
- Does `bus-message.kaseya/v1` duplicate or drift from any `worker-envelopes`/`contracts` field or status
  vocabulary (D2)?
- Does any v1 path assume Grok agents can reach the PC or Redis, hold a connection, or respond in seconds, or
  rely on a Grok Bot capability not in E.1?
- Is mailbox ingest truly idempotent across a bridge crash at every step, and is per-(agent, run) order kept?
- Can a forged or replayed webhook, or a file in the wrong `outbox/` folder, get treated as authoritative work
  or approval (E.4, E.6, E.8, D12)?
- Is the local-to-hosted move really config-only, with no hosting-mode branch in code (D14)?
- Does any component import or require Orca (D11)?
- Can any mailbox message reach the stream without a valid signature from a key registered to its `from`
  agent, or with a reused or foreign nonce? Is there any path that downgrades a failed signature (D15, E.10)?
- Does the design anywhere claim co-resident-agent protection that the key custody actually in force does not
  provide (E.10 threat model)?
- Can an agent make its sidecar send a message with a different `from`, an unsigned message, or any key material
  in a response, log or mount (D19, AC-22, AC-23)?
- Can anything reach an agent's sidecar surface or Redis other than that agent (AC-26), and does a raw `XADD`
  to Redis ever reach an agent without a valid signature (AC-25)?
- Does a sidecar restart or crash at any step lose, duplicate or reorder a message (AC-24, AC-27)?
- Does the design state, wherever it matters, that Grok identity is mediated at the bridge and only as strong as the
  custody AC-21 shows (D20, D23, AC-28)?
