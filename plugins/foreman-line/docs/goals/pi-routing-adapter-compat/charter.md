# Goal Charter — Pi Routing Adapter Compatibility

**Goal slug:** `pi-routing-adapter-compat`
**Created:** 2026-09-24
**Owner:** Clinton Morgan
**Coordinator:** this `/goal` session (Pi); ownership recorded in `loop-directive.md` after plan review
**Status:** SHIPPED — PRAC-P0 delivered 2026-09-24 (memo + probe + evidence); two-round adversarial review APPROVE WITH NITS resolved; merge `b1d3e39`; exit criterion met; loop stopped
**Mode:** repo-local documentation + evidence parcel (no routing authority, no code shipped outside the goal directory)
**Source directive:** `C:/Users/clint/Documents/Codex/2026-09-23/pl/.audit/directive.md` (3-seat council verdict on frontmatter-driven Pi model routing)

---

## Objective

Produce an **evidence-backed compatibility memo** recording the installed Pi runtime's
actual extension/hook API surface against the *rejected* cost-router middleware proposal
(`~/.pi/agent/extensions/cost-router.ts` using a `beforeLLMTurn` hook and
`ctx.session.updateModel(...)` / `ctx.session.updateThinkingLevel(...)`).

The goal closes the council's "P1 — Compatibility" finding with **facts instead of
assertion**: it states, per Pi version, which proposed APIs exist, which do not, and what
the installed runtime actually exposes for the same intent. It then records the
governance consequence under existing canon — exactly one paragraph, naming the ruling,
never re-deriving or designing anything.

The goal is **not** "make the harness pick models," "define a routing contract," "build a
resolver," or "add a budget ledger." Every one of those already exists elsewhere in this
repository (see Relationship, below). This goal only writes down what the Pi runtime
actually exposes, so that future adapter work — if any is ever authorized — starts from
ground truth rather than from the proposal's unverified API names.

## Relationship to existing goals and canon

This goal is **subordinate to and may not amend** any of the following.

- **`foreman-line-boundary-routing` (D1–D10)** is the live routing authority. Its **D7**
  (Pi auto-routing permitted only inside a Foreman-approved lane) and **D8** (coordinator,
  approval, security, verification independence, merge, and release are never delegated to
  auto-routing) are load-bearing for this memo. The memo records them; it does not touch
  them.
- **`plugins/foreman-line/routing-policy/`** (schema + validator + `routing-policy.yaml`
  v0.3) is the sole routing contract. This goal does not read it back, write it, or add a
  field to it. The memo may *cite* it as the reason no adapter is being built here.
- **`routing-currency-and-merit` (RCM, D1–D14)** already carries a point-by-point
  "Assessment of the proposed approach" that refutes this same middleware (settings.json
  authority inversion, `openrouter/auto` `-1000000` sentinel, dispatch-time price sort,
  MCP-at-dispatch, filesystem watcher). This goal does **not** restate that assessment. It
  references RCM's findings by pointer and confines itself to the API-surface question RCM
  left as "strong design input, not verified host evidence."
- **`governed-model-fleet`** owns receipt/envelope/settlement. Not touched.
- **`model-fleet-v1`** is frozen. Not touched.
- **`pi-model-configuration` (PMC, D1–D8 + Amendments 01–03)** is the authorized implementation of the
  *constrained, coordinator-owned Pi routing adapter* the source directive recommends (D1 dispatch
  route, A1 fail-closed route receipt, D3 no silent mid-turn swap, PMC-P2 resolver, PMC-P3 Pi-session
  canon). This goal does **not** overlap it: PMC owns model/config/catalogue/resolver/canon; this goal
  owns only the **extension/hook-SDK surface facts** (`beforeLLMTurn`, `pi.setModel`,
  `pi.setThinkingLevel`, provider-level hooks). The memo is registered **by pointer** as an evidence
  input to PMC-P2/P3; it grants no authority and amends no PMC decision.

**Non-duplication is a locked property of this goal.** If a parcel finds itself needing to
say anything about how routing *should* work — a contract field, a precedence rule, a
ledger schema, a fallback policy — it stops. That is RCM/boundary-routing/routing-policy
territory, not this goal's.

## Evidence baseline (design input, re-verified by the parcel)

Derived on 2026-09-24 from the installed package
`D:\nvm\v24.7.0\node_modules\@earendil-works\pi-coding-agent` (version **0.87.1**) and the
host directory `~/.pi/agent/extensions/`. These observations are **design input for the
charter, not yet the verified memo** — the parcel re-derives each one against the live
docs/examples and, where a deterministic check is possible, a read-only probe.

1. Pi version is **0.87.1** (`package.json`, `@earendil-works/pi-coding-agent`).
2. `~/.pi/agent/extensions/` **exists** and already contains one extension,
   `pi-jev-budget-guard` (dated 2026-09-21) — prior Foreman/RCM work on this exact
   boundary. This goal does not touch it.
3. *(0.86.1-epoch, superseded — see coordinator-lint L2/L3.)* The 0.86.1 `docs/extensions.md`
   named **`pi.setModel(model)`** and **`pi.setThinkingLevel()`** in prose. In 0.87.1 those
   names are absent from the prose and survive only in the shipped type declarations
   (`setModel`, `setThinkingLevel`, `setActiveTools` in `extensions/types.d.ts`).
4. No **`beforeLLMTurn`**, **`ctx.session.updateModel`**, or
   **`ctx.session.updateThinkingLevel`** API name was found in `docs/extensions.md`. The
   hook surface is provider-level (e.g. a per-provider-request hook) and session-scoped
   lifecycle hooks (`session_start`, teardown-before-session-end), not a
   "before-LLM-turn mutate-the-session-model" hook.
5. `~/.../examples/extensions/` contains a large catalog of working extension examples
   (`preset.ts`, `provider-payload.ts`, `tool-override.ts`, `subagent/`, etc.) that document
   the *actual* extension surface. These — not the proposal's names — are the ground truth
   a future adapter would have to target.

**Version-drift note (live, observed during this goal).** The pinned version was **0.86.1**
when this charter was first shaped, and the installed package updated to **0.87.1** before
Gate 1 ratification — the exact drift this goal's pin-and-hash discipline (D7, D9) exists to
guard against. All baseline observations are re-derived by PRAC-P0 against **0.87.1**.

**Provenance caveat.** Items 3–5 are read-from-docs/CLI-tree observations made while
shaping this charter. The parcel re-verifies every one against the installed docs, the
example catalog, and (where the surface is introspectable) a deterministic read-only
check. A finding that does not reproduce is discarded, not softened.

## Locked decisions

| ID | Decision | Reasoning |
|---|---|---|
| D1 | This is a **compatibility memo**, not a routing design and not an adapter. It may cite the proposal and the existing canon, but it proposes no contract field, precedence rule, ledger schema, fallback policy, model identity, or adapter. | The council's verdict is "adopt a constrained adapter *only after* contract + evidence + spike." The contract, resolver, and ledger already exist in-repo. The one thing no one has written down is what the installed Pi actually exposes. That is a fact-finding task, and fact-finding stays fact-finding. |
| D2 | The memo's routing-authority claims are **recorded by pointer, never restated or re-derived**. Anything that RCM, boundary-routing, or routing-policy already states is cited, not re-argued. | Prevents drift-of-wording (lesson #33) and near-duplicate content. A pointer cannot weaken a ratified ruling; a paraphrase can. |
| D3 | The memo is produced against a **pinned Pi version (0.87.1)** and states that version. Future Pi versions are out of scope until a new Gate 2 names them. | The council's own spike premise was "against the installed Pi version." Unpinned rows would record an API surface that drifts the day Pi updates. |
| D4 | Every API-surface assertion in the memo is **either cited to a concrete doc file + section/line, or backed by a deterministic read-only check** recorded as evidence. An assertion with neither is a refusal (the parcel may not ship it). **Absence is the weaker form and is bounded, never absolute:** an "absent" disposition means "not found in the enumerated 0.87.1 package surface (docs index + `examples/extensions/` catalog + shipped `.d.ts` type declarations), as recorded by the probe with its command and output"; it never asserts "does not exist at runtime." | "Evidence beats claims." Searching a document proves only that a string is absent *from that document*, not that an API is absent *from the runtime*. Bounding the claim to the enumerated, hashed surface is what makes an absence assertion honest. |
| D5 | The memo's one governance paragraph is **pointer-only**: it names the ruling and its source (boundary-routing D7/D8, RCM D1–D14, routing-policy) and states that **no adapter is authorized by this goal.** It makes **no forward prediction** about how a future adapter would behave and does not restate any canon's reasoning. Every real API the memo names as present (`pi.setModel`, `pi.setThinkingLevel`, provider-level hooks) is paired with the same pointer: *present, and still not an authorization to route.* | The memo must close the loop without becoming an authorization — and without handing a would-be adapter author a surface description plus an implied green light. |
| D6 | Scope of file writes is **enumerated and bounded**: (a) the goal directory `docs/goals/pi-routing-adapter-compat/`; (b) this goal's own parcel spec under `docs/specs/` only, including its active→done move at Stage F; (c) the lessons appendix under `docs/transcripts/defects_lessons.md`; and (d) the goal's one row in `docs/goals/INDEX.md` (coordinator-owned, added once). **Nothing else** — never `~/.pi/agent/extensions/`, `pi-jev-budget-guard`, `routing-policy/`, or any plugin source. A `git status` baseline is captured before dispatch and the merge is by explicit pathspec, so no unrelated uncommitted change is absorbed. | Keeps the goal inside exactly the reviewable surfaces it actually needs. Because `routing-policy/` carries uncommitted edits at review time, only a git baseline + pathspec merge can prove "no writes outside scope." Any host-file write is a stop condition and a hard refusal per boundary-routing D1. |
| D7 | The probe is **Node stdlib-only, read-only, and fail-closed.** It does **not** load Pi or register an extension (that would require writing the host extension dir, which is forbidden): it resolves the installed package, asserts `package.json` version == 0.87.1, records the absolute package root, enumerates the exact files searched (`docs/index.md`, `docs/extensions.md`, the `examples/extensions/` catalog, and shipped `.d.ts` declarations), captures SHA-256 hashes of each inspected file, greps the exported/proposed API names, and writes the result + exit status into the goal-dir evidence snapshot. It reports "absent from the enumerated shipped 0.87.1 surface", never "absent at runtime", and exits non-zero (refusal) on any missing expected path or a version mismatch. It runs in PowerShell with `node -v` first. | The runtime `pi` API exists only inside a *loaded* extension; loading one mutates the host dir. The probe must therefore prove its absence claims against the shipped, hashable surface, and fail closed rather than infer. |
| D8 | Parcel count is **one**: a single document+evidence parcel (`PRAC-P0`). Routing class `implementation/standard`, single adversarial review. | The goal is a bounded fact-finding artifact with no authority surface and no downstream parcel in this goal gated on its output. A second parcel would be ceremony, not evidence. |
| D9 | The parcel produces an **immutable evidence snapshot** at `docs/goals/pi-routing-adapter-compat/evidence/pi-0.87.1/`: the pinned version, resolved package root, enumerated inspected-file list with SHA-256 hashes, the probe's full command + captured output, and the probe exit status. The memo cites the snapshot, so a reader can reproduce the search without re-running anything. | Namespacing the evidence to the version prevents a later compatibility pass from overwriting it, and the hashes make "the runtime drifted" distinguishable from "the memo is wrong." |
| D10 | The directive's API claims that the memo "verbatim restates" are **snapshotted from their external source into the goal directory with a hash** before any restatement, so a reviewer can inspect what was restated without leaving the repo. The memo records the source path and hash. | The proposal source lives outside the repo (`C:/Users/clint/...`); a restatement whose source cannot be inspected in-repo is unauditable. |
| D11 | The memo's scope is the **extension/hook-SDK surface only** — the Pi extension/hook API names the rejected middleware depended on, and what the installed runtime actually exposes for that intent. It records no model identity, catalogue fact, fallback, resolver design, provider config, or Pi-session canon; those belong to `pi-model-configuration`. The memo carries a single pointer registering it as an **evidence input consumed by PMC-P2/P3** (zero authority). | On 2026-09-24 the owner confirmed PMC already implements the directive's "constrained adapter." This goal complements PMC on the one surface PMC does not cover, and must not drift into re-doing PMC's model/config/resolver work. |

## Wave and parcel decomposition

Dependency order. Nothing is dispatchable before Gate 1, the mandatory plan-level
adversarial review, and an explicit Gate 2 naming the parcel.

| Parcel | Scope | Risk / routing class |
|---|---|---|
| **PRAC-P0** | Produce `docs/goals/pi-routing-adapter-compat/compat-memo.md`, the `evidence/pi-0.87.1/` snapshot (D9), and the hashed directive excerpt (D10). Snapshot-then-restate the proposal's API claims; for each, assign a verified disposition in Pi 0.87.1 — **present / absent-from-enumerated-surface / unverifiable** — and name the nearest documented surface with citation; record the governance consequence by pointer (D5); record the pinned version. Includes the deterministic read-only probe (OQ1/D7) and its recorded output. | `implementation/standard` |

## Exit criterion

This goal exits only when **all** of the following hold:

1. `compat-memo.md` is landed (merged) under `docs/goals/pi-routing-adapter-compat/`.
2. Every API-surface assertion in the memo is cited to a concrete `docs/` or
   `examples/` file+section, or backed by the **recorded probe output in the evidence
   snapshot** (D9), which reproduces on the coordinator's machine in PowerShell with
   `node -v` first; the snapshot carries the enumerated-file hashes and the probe exit status.
3. The memo pins **Pi 0.87.1** (asserted, not assumed — the probe verifies `package.json`).
   Every proposal API carries a **verified disposition** — present / absent-from-enumerated-
   surface / unverifiable — not a pre-decided "absent". The three proposal API names
   (`beforeLLMTurn`, `ctx.session.updateModel`, `ctx.session.updateThinkingLevel`) record
   their disposition with the nearest documented surface named (`pi.setModel`,
   `pi.setThinkingLevel`, provider-level/session-scoped hooks) and flagged *present and still
   not an authorization to route*.
4. The memo contains **zero** routing-design content: no new contract field, precedence,
   ledger, fallback, model identity, or adapter proposal. Its governance text is pointer-only.
5. A **negative control** ships and passes: a check that proves the memo matches its
   recorded dispositions (never asserts a proposal API as *present* where the snapshot says
   otherwise), carries zero routing-design content, and uses the verbatim pointer-only
   governance template (no routing verbs or config keys beyond that template). (A doc-lint/
   grep check against the recorded disposition table is acceptable and sufficient.)
6. No file outside D6's enumerated paths was written: the merge diff is exactly the goal
   directory + the parcel spec + the lessons append + the INDEX row, verified against the
   pre-dispatch `git status` baseline.

## Standing authorizations requested (ratified at Gate 1)

- **Gate 2** — requested for the single named parcel **`PRAC-P0`** only, and no other.
- **Gate 3** — requested as a contingent "merge it" within this repo only, contingent on
  the full verification chain being green: coordinator closure check against disk,
  deterministic pass, adversarial review + triage, and rework (if any) accepted with
  tripwires silent. Any red step voids it. Merge authority does not extend to any other
  repo, to `~/.pi/agent/extensions/`, or to any Pi settings/host file.

## Stop conditions

Stop and report when: any change would amend `foreman-line-boundary-routing` D1–D10,
`routing-currency-and-merit` D1–D14, `routing-policy/`, or another frozen contract; the
parcel finds it must propose routing-design content to do its job (the non-duplication
boundary); a required API-surface fact cannot be verified and the only way forward is
assertion; the parcel would need to write outside the goal directory; a Pi host file or
existing extension would be modified; a tripwire fires twice; or a human gate is not
explicitly granted. Any need to touch the Pi runtime's own files is a hard stop.

## Out of scope

Building any adapter or middleware. Defining, extending, or amending a routing contract,
resolver, budget/settlement ledger, or receipt schema. Amending boundary-routing D1–D10,
RCM D1–D14, routing-policy, or any frozen contract. Writing to `~/.pi/agent/extensions/`
or modifying `pi-jev-budget-guard`. Restating RCM's "Assessment of the proposed approach."
Shipping anything under `routing-policy/` or plugin source. Any claim that the memo or a
harness setting can *enforce* a policy the host does not expose.

## Open questions for Gate 1

Each carries a recommendation. Propose, dispose.

**OQ1 — Deliverable form.** *Recommend*: memo **plus** a thin deterministic read-only
probe script (Node stdlib-only) whose recorded output backs the API-surface table, so the
memo's central claims are verified rather than asserted. The alternative — a citation-only
memo with no probe — is lighter but leaves "absent" claims resting on grep-from-docs,
which is exactly the unverified class this goal exists to close.

**OQ2 — Where the probe (if OQ1 = yes) lives and how its result is recorded.** *Recommend*:
the script and its captioned output live in the goal directory
(`docs/goals/pi-routing-adapter-compat/`), and the memo cites the recorded output; the
script itself is *not* published to `~/.pi/agent/extensions/` and is not a runnable
extension.

**OQ3 — Memo filename.** *Recommend*: `compat-memo.md` in the goal directory (canonical,
per your instruction), with the charter as its sibling.
