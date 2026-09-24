# Pi Extension/Hook API Surface — Compatibility Memo

**Goal:** `pi-routing-adapter-compat` · **Parcel:** PRAC-P0 · **Date:** 2026-09-24
**Pin:** `@earendil-works/pi-coding-agent` **0.87.1** (asserted by probe, not assumed)
**Status:** draft — this memo is fact-finding only; it proposes no routing design and
authorizes no adapter.

## 1. What this memo is, and is not

This memo records what the installed Pi runtime actually exposes on its extension/hook
surface, tested against the API names a rejected middleware proposal asserted. It is an
evidence-bound, version-pinned compatibility fact sheet. It does **not** define a routing
contract, resolver, fallback, budget ledger, or model identity; it does **not** propose an
adapter; it does **not** restate the reasons the proposal was rejected. Those live in
`routing-currency-and-merit` (D1–D14 "Assessment of the proposed approach") and the adapter
work lives in `pi-model-configuration`. Absence language is bounded: "absent" always means
*absent from the enumerated, hashed 0.87.1 package surface* — never "does not exist at
runtime."

## 2. Claims under review

Snapshotted verbatim from the external source into
`evidence/pi-0.87.1/directive-excerpt.md`
(SHA-256 `0975965d2d369abfd2fd9614c6e9c1b60a985bc2df126d23fa45e9f38630cf36`), which names
two source locations: `foreman-router-brief.md:10` (the API-name claims) and
`directive.md:15` (the P1 compatibility finding). The four API claims under test:

| # | Proposed API | Claim |
|---|---|---|
| 1 | `beforeLLMTurn` | a hook that fires before an LLM turn |
| 2 | `ctx.session.updateModel(...)` | session method to change the model |
| 3 | `ctx.session.updateThinkingLevel(...)` | session method to change the thinking level |
| 4 | `~/.pi/agent/extensions/cost-router.ts` | proposed middleware location (path only) |

## 3. Method — the read-only probe

`probe/check-api-surface.mjs` (Node stdlib only, never loads Pi, never registers an
extension, writes only into the evidence dir):

- Resolves the package root and **asserts `package.json` version == 0.87.1** (fails closed
  otherwise).
- Enumerates and **SHA-256-hashes** every inspected shipped file: `docs/index.md`,
  `docs/extensions.md`, the `examples/extensions/` catalog, and every `dist/**/*.d.ts`
  (329 files; full list + hashes in `evidence/pi-0.87.1/snapshot.json`).
- Searches each API name across three surfaces — docs prose, examples, shipped type
  declarations — and captures the exact `.d.ts` signature lines for the session-control
  methods.

Run (from the goal directory): `node probe/check-api-surface.mjs` under `node v24.7.0` —
**exit 0**, `versionMatch: true`. Raw output: `evidence/pi-0.87.1/probe-output.txt`.
The negative control `probe/negative-control.mjs` (below) asserts the memo against the
snapshot.

## 4. Findings

### 4.1 Proposal APIs — disposition

| Proposed API | Disposition (enumerated 0.87.1 surface) | Detail |
|---|---|---|
| `beforeLLMTurn` | **absent-from-enumerated-surface** | 0 occurrences in docs prose, examples, or shipped types. |
| `ctx.session.updateModel` | **absent-from-enumerated-surface** | The exact name occurs 0 times. The bare token `updateModel` occurs in shipped types only as `dist/core/model-runtime.d.ts:58` `private updateModelSnapshot;` (a private field) and `dist/modes/interactive/components/scoped-models-selector.d.ts:36` `updateModels(models: readonly Model<any>[], …)` (a UI component, plural name) — neither is a session model-mutation API. |
| `ctx.session.updateThinkingLevel` | **absent-from-enumerated-surface** | 0 occurrences of the exact name and of the bare `updateThinkingLevel` anywhere. |
| `~/.pi/agent/extensions/cost-router.ts` | *(location — not an API)* | The host dir `~/.pi/agent/extensions/` exists *(coordinator observation of the host, not probe-backed — the probe inspects the shipped package only)*. This memo does not create or register anything there. |

### 4.2 Nearest actual surface (what Pi 0.87.1 really exposes)

| Intent | Actual API | Where | Docs prose? | Flag |
|---|---|---|---|---|
| Change model | `setModel(model: Model<any>): Promise<boolean>` | `dist/core/extensions/types.d.ts:1081` | No (0 in 0.87.1 prose) | present — **still not an authorization to route** |
| Change model (internal) | `setModel(model: Model<any>, options?): Promise<void>` | `dist/core/agent-session.d.ts:518` | No | present — internal, differs from the extension signature — **still not an authorization to route** |
| Change thinking level | `setThinkingLevel(level: ThinkingLevel): void` | `dist/core/extensions/types.d.ts:1088` | No | present — **still not an authorization to route** |
| Change active tools | `setActiveTools(toolNames: string[]): void` | `dist/core/extensions/types.d.ts:1074` | **Yes** — `docs/extensions.md:142` | present — **still not an authorization to route** |
| "Before a turn" lifecycle | `TurnStartEvent` / `TurnEndEvent` / `BeforeAgentStartEvent` / `AgentStartEvent` / `AgentBeforeSettleEvent` | `dist/core/extensions/types.d.ts` (event & handler declarations) | No (by name) — referenced generically as "events" | present — **still not an authorization to route** |
| Before a provider request | `BeforeProviderRequestEvent` / `AfterProviderResponseEvent` | `dist/core/extensions/types.d.ts` | No (by name) | present — **still not an authorization to route** |

Occurrence detail (from `snapshot.json`): `setModel`, `setThinkingLevel`, and `setActiveTools`
also occur in the `examples/extensions/` catalog (3, 3, and 8 times respectively). A separate
RPC surface, distinct from the session/extension surface, exists in
`dist/modes/rpc/rpc-client.d.ts` (`setModel(provider: string, modelId: string)` at :101,
`setThinkingLevel(level: ThinkingLevel): Promise<void>` at :123); it is recorded only to
prevent conflation, and is **not** the extension surface.

Key consequence: **the name `beforeLLMTurn` is absent from the enumerated 0.87.1 surface**, so
a hook by that exact name cannot be located in the shipped package. The enumerated surface
instead contains the session-control methods and turn/provider events in the table above.
This memo asserts nothing beyond what those enumerations record, and it proposes no mapping
of these APIs onto the rejected proposal.

### 4.3 Version drift observed

Pi upgraded **0.86.1 → 0.87.1** during this goal's shaping (recorded in the charter and plan
review). The statement that the 0.86.1 `docs/extensions.md` named `pi.setModel` /
`pi.setThinkingLevel` in prose is a **dated observation from that shaping** (see
`plan-review/own-out.txt` and the charter's version-drift note); no 0.86.1 package remains on
disk to re-verify it. In **0.87.1 the prose no longer names them** (probe: `docsProse: 0`),
and the methods survive only in shipped type declarations. This is the exact drift a version
pin + hashed surface exists to catch.

## 5. Governance consequence (pointer-only; no adapter is authorized)

Governance is recorded by pointer, not restated. Governing rulings: `foreman-line-boundary-
routing` D7/D8; `routing-policy/` (the sole routing contract); `routing-currency-and-merit`
D1–D14; `pi-model-configuration` D1, A1, D3, PMC-P0/P1/P2/P3. The text of those rulings is
authoritative and is not reproduced here. Every real API named present above is **present
and still not an authorization to route.** No adapter is authorized by this memo or by the
`pi-routing-adapter-compat` goal.

## 6. Reproduction

In PowerShell, from `plugins/foreman-line/docs/goals/pi-routing-adapter-compat/`:

```powershell
node -v                                   # expect v24.7.0
node probe/check-api-surface.mjs          # expect exit 0
node probe/negative-control.mjs           # expect exit 0
Get-FileHash evidence/pi-0.87.1/directive-excerpt.md -Algorithm SHA256
```

Expect `snapshot.json` `versionMatch: true` and its hashes to match the inspected files on
disk; a version mismatch or a missing `docs/index.md` / `docs/extensions.md` exits non-zero
(refusal). The directive-excerpt SHA-256 must be (case-insensitive)
`0975965d2d369abfd2fd9614c6e9c1b60a985bc2df126d23fa45e9f38630cf36`.

## 7. Non-claims

This memo does **not** assert that any API "does not exist at runtime" — only that it is
absent from the enumerated, hashed 0.87.1 surface. It does **not** assert live provider or
model availability. It does **not** select, recommend, or authorize any model, provider,
route, or fallback. It does **not** modify the `pi-model-configuration`,
`foreman-line-boundary-routing`, or `routing-currency-and-merit` charters.
