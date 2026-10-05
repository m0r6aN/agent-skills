---
ticket: MRC-12
title: HRO-P4c structured recovery diagnostics — D10's renderer over the existing reason/outcome vocabulary (sanitized, deduplicated stderr diagnostics; machine JSON on stdout; optional disabled-by-default platform-aware notifications with failure isolation)
status: active
owner: clinton.morgan
created: 2026-09-28
updated: 2026-09-28
risk: standard
surfaces:
  - plugins/foreman-line/routing-policy/src/recovery-diagnostics.ts
  - plugins/foreman-line/routing-policy/src/recovery-notify.ts
  - plugins/foreman-line/routing-policy/src/cli.ts
  - plugins/foreman-line/routing-policy/src/index.ts
  - plugins/foreman-line/routing-policy/tests/recovery-diagnostics.test.ts
routing_class: implementation/standard
verification_class: equivalence-provable
---

# MRC-12 — HRO-P4c: structured recovery diagnostics

## Goal

Close the `hybrid-routing-optimization` charter's **HRO-P4c** row (`docs/goals/hybrid-routing-optimization/charter.md:124`) — *"Render D10's structured recovery events as concise, deduplicated diagnostics; verify machine-readable output, terminal sanitization, non-interactive behavior, and optional notification failure isolation."* — after MRC-08 and MRC-10, per the wrapper row (`docs/goals/model-routing-chain-wrapper/charter.md:65`) and the chain row (`docs/goals/goal-status-report-2026-09-27.md:113`: *"structured recovery diagnostics (sanitized, deduplicated; stdout JSON)"*).

The deliverable is **D10's renderer** (`charter.md:105-109`): the reason/outcome diagnostics surface **over the existing event vocabulary — NO parallel event format** (*"These are proposed semantic labels to reconcile with existing schemas during P0, not an instruction to invent a parallel event format"*, `:107`). The reconciliation already landed with MRC-02: `REASON_VOCABULARY` and `D10_REASON_RECONCILIATION` (`receipts/src/types.ts:101-118,:121-127`). This parcel **consumes that map as landed** and derives the renderer's events from the structured records MRC-08 and MRC-10 produce — *"`mapping_missing`, `catalog_refresh_failed`, `approved_fallback_selected`, `config_update_proposed`, and `route_unavailable`"* (`:107`) are the five keys of `D10_REASON_RECONCILIATION`, and every rendered event carries their `ReasonCode` plus `REASON_VOCABULARY`'s `kind`/`outcome` — never a new event kind, code, or schema.

Rendering rules are D10's exactly (`:109`): *"Show one concise warning when an approved fallback changes the requested route, and an actionable error when a parcel is held. Include parcel/correlation ID, requested and selected provider/model, reason, and next action where appropriate. Sanitize control characters and bound untrusted identifier text before terminal rendering. Deduplicate repeated warnings while retaining complete events and occurrence counts. Honor non-interactive output and no-color preferences. Audible/desktop notifications are optional, off by default, and platform-aware, including Windows; notification failure must not change routing outcomes. Do not introduce a background alert service for this feature."* CLI machine output remains valid JSON on stdout; human diagnostics go to stderr (`:107`) — the existing `routing-policy/src/cli.ts` / `receipts/src/cli.ts` convention, extended with one `diagnostics` verb.

This closes charter verification bullet 9 (`charter.md:139`) — *"Fallback and hold events report requested/actual routes accurately. Stdout remains parseable JSON, stderr diagnostics are sanitized and deduplicated, and disabled/failed optional notifications cannot alter routing. Cover Windows and non-interactive output behavior."* — and contributes to bullet 11 (`:142`, package tests/typechecks/lint) and bullet 10 (`:140`, no partial stdout on failure). Per `:107`, tests inspect validated event fields, never grep output or inferred strings.

`verification_class: equivalence-provable` — every behavior is bounded to a named contract item with deterministic, falsifiable controls; every consumed seam (the MRC-08 record types, the MRC-10 proposal artifact, the MRC-02 vocabulary, the `validate` CLI verb) is proven unchanged by its own suites passing with zero edits.

## Dependencies

- **Authority:** HRO charter D10 (`charter.md:105-109`) and the HRO-P4c row (`:124`); wrapper D3/D4/D6/D7 (`docs/goals/model-routing-chain-wrapper/charter.md:31,:32,:34,:35`) — Lane G serialization, **one** independent review (`:65`: *standard | implementation/standard | 1*), full parcel mechanics. D9's redaction rule binds here for proposal rendering (*"Keep config contents and secrets out of alerts and diffs exposed to logs"*, `charter.md:103`).
- **Gate receipts:** **G-GATE2-HRO ✓ GRANTED** for MRC-12 (`docs/goals/model-routing-chain-wrapper/charter.md:92`: *"for MRC-02, 06, 08, 10, 12, 17, 18, 19"*; `dispatch-table.md:30` *"Lane G slot 10"*; `loop-directive.md:46`: *"12. MRC-12 — slot 10 (G-GATE2-HRO)"*).
- **Consumed named outputs (read-only; never re-specified or re-implemented):**
  - **MRC-08 (landed and reworked; observed on disk 2026-09-28):** `RECOVERY_REFUSALS` / `RecoveryRefusalName` (`routing-policy/src/types.ts:549-566`), `RefusalEntry` (`routing-policy/src/route-receipt.ts:56-59`), `FreshnessVerdict` (`:195`), `AttemptRecord` (`:198-213`), `RefreshProvenance` (`:216-237`), `RouteUnavailableOutcome` (`:240-251`), `RecoveryEpisodeRecord` (`:258-279`), and the additive `RouteReceipt.recovery?` field (`:304-308`).
  - **MRC-10 (building at observation time — consumed by name and shape from its spec, never by line number):** `ConfigRepairProposal` (`kind: 'pi-config-repair-proposal'`, `status: 'PROPOSED-NOT-WRITTEN'`, `mapping_provenance`, `evidence`, `redacted_summary`, `proposal_digest`; its C2, `docs/specs/active/MRC-10-hro-p4b-config-repair-proposals.md`) and `CONFIG_REPAIR_REFUSALS` (its C6.1). Its redaction discipline (its C3.4) is the rendering boundary for `config_update_proposed`.
  - **MRC-02 (landed):** `REASON_VOCABULARY_VERSION` (`receipts/src/types.ts:59`), `ReasonCode` (`:72-95`), `REASON_VOCABULARY` (`:101-118`), `D10_REASON_RECONCILIATION` (`:121-127`) — consumed through the package barrel (`receipts/src/index.ts:31-37`).
  - **CLI conventions (landed):** `routing-policy/src/cli.ts:1-45` (the frozen `validate` exit-code contract 0/1/2, `process.stderr.write` human text, stdout silent on failure) and `receipts/src/cli.ts:1-80` (same family; directory/file input handling) — cited and extended, never replaced.
- **Second-writer rule binds this parcel at Step 0:** `docs/goals/model-routing-chain-wrapper/loop-directive.md:8` (single-writer windows in the live working tree; *"rebase-equivalent = re-read + full-suite re-run"*). MRC-08's and MRC-10's windows land ahead of this parcel (slot 10) on shared surfaces — see C0 and Stop-and-Report #2.
- **Downstream:** MRC-18 (cost/quality baseline) and MRC-19 consume these diagnostics (`goal-status-report-2026-09-27.md:119-120`); the HRO-P4c acceptance record rides an MRC-01-class Stage-F record act (Evidence Required #7).

## Allowed Files (EXACT)

Exact paths relative to `plugins/foreman-line/`. Every other path is forbidden. Per SPEC-CONVENTION §4.8 (`docs/SPEC-CONVENTION.md:127-140`): *"If implementation requires a path not listed in `Allowed Files`, work stops until the coordinator ratifies a spec amendment."*

| Path | Change |
|---|---|
| `routing-policy/src/recovery-diagnostics.ts` | create — the pure renderer: `deriveDiagnosticEvents`, `buildDiagnosticsReport`, `renderHumanLine`, `dedupeRendered`, `sanitizeForTerminal`, `boundIdentifierText`, `resolveRenderOptions`, and the typed `DiagnosticInput`/`DiagnosticsBatchInput`/`DiagnosticIdentity`/`DiagnosticEvent`/`RenderedDiagnostic`/`DiagnosticsReport`/`DiagnosticLabel`/`DiagnosticSeverity`/`RenderOptions`/`NotificationRequest`/`NotificationSink` (C1–C6) |
| `routing-policy/src/recovery-notify.ts` | create — the effectful notification actuator only: `notificationCommand` (pure platform planner) and `createPlatformNotificationSink` (guarded executor) (C7) |
| `routing-policy/src/cli.ts` | edit — the additive `diagnostics <path>` verb (machine JSON on stdout, human lines on stderr, `--no-color` / `--non-interactive` / `--notify` flags) beside the untouched `validate` verb (C8) |
| `routing-policy/src/index.ts` | edit — **additive** re-exports of the renderer's public names (the supported-surface wiring; existing exports untouched — HRO-P1's barrel precedent) |
| `routing-policy/tests/recovery-diagnostics.test.ts` | create — the C1–C8 controls, the vocabulary-reconciliation enumeration, and the equivalence pins (Required Tests) |

## Forbidden

- Any path not listed in Allowed Files. In particular: `receipts/**` (the vocabulary is imported, never edited — no new `ReasonCode`, no vocabulary-version bump), `dispatch/**`, `contracts/**`, `routing-policy/src/{pi-resolver,route-receipt,pi-openrouter,types,config-repair-proposal,host-settings-proposal,validator,schemas}.ts` (consumed seams — imported, never edited), `routing-policy/routing-policy.yaml` (SP16 user-owned, `docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md:205`), `routing-policy/{schemas,templates}/**`, `templates/**`, goal records, and every existing test file (the shipped suites pass with **zero edits**).
- **No parallel event format — ever.** D10 (`charter.md:107`): the labels are *"to reconcile with existing schemas"*, *"not an instruction to invent a parallel event format"*. No new `ReasonCode`, `EventKind`, `ReasonOutcome`, label key, or event schema; every `DiagnosticEvent.reason` is a `REASON_VOCABULARY` entry resolved through `D10_REASON_RECONCILIATION` as landed. The machine report is a read-only **diagnostics view** of already-produced records; it is never appended to the receipt chain, never emitted through the event path, and never written to any record.
- **No identity guessing or decomposition.** Requested/selected provider/model strings ride verbatim from record fields; an opaque registry key is never split into provider/model parts, never normalized, never aliased (`charter.md:48`; the 2026-09-22 ruling, `docs/goals/routing-currency-and-merit/rcm-p2-scope-reconciliation-2026-09-27.md:76`). Where a record carries only a registry key, the rendered provider/model slots stay null.
- **No config contents or secrets on any rendered or machine surface** drawn from proposals (`charter.md:103`; MRC-10's C3.4 redaction): `config_update_proposed` lines carry the redacted summary and identity names only — never `changes[].value`, source-document bytes, or credential material.
- **No control characters and no unbounded identifier text in terminal output** (C4). No raw record text reaches stderr unsanitized.
- **No notification default-on, no background alert service** (`charter.md:109`): no timers, daemons, watchers, sockets, or long-lived handles in any new module; notification fires once per distinct rendered warning/error at most, only behind `--notify`, and its failure never changes the machine report, the exit code, or any routing outcome.
- **No routing behavior of any kind.** The renderer reads records and renders; it cannot select, refuse, retry, hold, or release anything. Routing outcomes are upstream and immutable here (C7.3).
- No new npm dependency (`routing-policy/tests/dependency-allowlist.test.ts` stays untouched; the `receipts` import is a relative workspace path, the `generate.ts:3` precedent); no engines edits; no weakening, renaming, or re-pinning of existing controls; no formatting sweeps beyond the listed files; no host Pi configuration read/write (ruling D, `goal-status-report-2026-09-27.md:83`).

## Out of Scope

- **Production caller wiring** — who feeds live `RecoveryEpisodeRecord`/`ConfigRepairProposal` documents into `routing-policy diagnostics` at runtime (batch runner, ops console, entry module). This parcel delivers and proves the renderer and its CLI seam; the wiring boundary is surfaced at Stop-and-Report #8 (the MRC-08/MRC-10 precedent), never resolved unilaterally.
- **Any vocabulary extension** — a sixth label, a new reason code, or a re-mapping of `D10_REASON_RECONCILIATION`. If a record fact cannot be expressed through the five landed labels, that is a Stop-and-Report, not a new label.
- **Event/receipt emission** (MRC-02's path) and **record production** (MRC-08's ladder, MRC-10's proposal builder): consumed as data; the renderer never writes them and never re-derives their fields.
- **Desktop-notification integrations beyond the shipped audible actuator** (toast libraries, notification centers): the `NotificationSink` seam permits injection; no desktop dependency is added. A desktop sink is a caller's act.
- **Terminal rendering outside this CLI verb** (Pi session output, ops-console views) — those consume the machine report if they wish; nothing here renders into them.
- **Goal-record writes** (the HRO-P4c acceptance record is an MRC-01-class Stage-F act) and **live smoke** (G-LIVE; MRC-13/MRC-17).
- **`receipts/src/cli.ts` and `receipts/**`** — cited as conventions only.

## Contract

Authority quotes are verbatim. Every seam below is anchored **as observed on disk 2026-09-28** and is subject to mandatory Step-0 re-attestation (C0); where a seam is an in-flight MRC-10 output, the contract consumes its **named contract item**, never a line number.

### C0 — Anchor inventory and the anchor-drift rule (Step 0, mandatory)

Every anchor below was observed in the live tree on 2026-09-28 **while MRC-10's window is landing**. **At build Step 0 every anchor is re-attested against the then-current tree; any anchor that moved, was renamed, or changed shape triggers Stop-and-Report #2 (corrected anchors + behavioral delta reported before work proceeds).**

| Seam | Anchor (observed 2026-09-28) | Used for |
|---|---|---|
| MRC-02 vocabulary | `REASON_VOCABULARY_VERSION` `receipts/src/types.ts:59`; `ReasonCode` `:72-95`; `REASON_VOCABULARY` `:101-118`; `D10_REASON_RECONCILIATION` `:121-127`; barrel `receipts/src/index.ts:31-37` | C1 label reconciliation |
| MRC-08 records | `RefusalEntry` `routing-policy/src/route-receipt.ts:56-59`; `FreshnessVerdict` `:195`; `AttemptRecord` `:198-213`; `RefreshProvenance` `:216-237`; `RouteUnavailableOutcome` `:240-251`; `RecoveryEpisodeRecord` `:258-279`; `RouteReceipt.recovery?` `:304-308`; `RECOVERY_REFUSALS` `routing-policy/src/types.ts:549-566` | C1/C3 derivation inputs |
| MRC-08 refusal family | `ADAPTER_REFUSALS` incl. `MAPPING_MISSING_REFUSED`/`MAPPING_INCOMPLETE_REFUSED` `routing-policy/src/types.ts:527-536` | the `mapping_missing` trigger |
| MRC-10 proposal (named, in flight) | `ConfigRepairProposal` `kind`/`status: 'PROPOSED-NOT-WRITTEN'`/`redacted_summary`/`proposal_digest` (its C2); `CONFIG_REPAIR_REFUSALS` (its C6.1); redaction discipline (its C3.4) | the `config_update_proposed` trigger |
| CLI conventions | `routing-policy/src/cli.ts:1-45` (contract text `:1-5`, usage `:15`, stderr writes `:23,:31,:38`); `receipts/src/cli.ts:1-80` (contract `:1-7`, `reportErrors` `:24-29`) | C8 verb design |
| Authority | D10 `charter.md:105-109`; HRO-P4c row `:124`; bullet 9 `:139`; bullet 10 `:140`; D9 redaction `:103`; wrapper D3/D4/D6/D7 `docs/goals/model-routing-chain-wrapper/charter.md:31,:32,:34,:35`; review count `:65` | scope |
| Cross-package import precedent | `routing-policy/src/generate.ts:3,6` imports `../../schema-scaffold/src/generate.js` | the `../../receipts/src/index.js` import shape (C1.2) |

### C1 — The diagnostics surface over the existing vocabulary (the label reconciliation)

1. **Five labels, consumed map, closed surface.** `DiagnosticLabel` is exactly `keyof typeof D10_REASON_RECONCILIATION` — `mapping_missing | catalog_refresh_failed | approved_fallback_selected | config_update_proposed | route_unavailable`. For every emitted event: `reason === D10_REASON_RECONCILIATION[label]` and `{ kind, outcome } === REASON_VOCABULARY[reason]` — asserted by control, never re-derived or re-typed. `REASON_VOCABULARY_VERSION` is carried on the machine report as `vocabulary_version`.
2. **The renderer imports the vocabulary** from `../../receipts/src/index.js` (the `generate.ts:3` cross-package precedent) and the record types from `./route-receipt.js` and `./config-repair-proposal.js`. `receipts/**` is read-only here (Forbidden).
3. **Derivation table — record facts to labels (this is the reconciliation MRC-08/MRC-10 deferred to MRC-12).** Each row fires **at most one** event per input record; `detail` carries the underlying typed names (e.g. a `MAPPING_MISSING_REFUSED` refusal name) as data — the reason code stays the map's value even when the underlying refusal name differs:

| Record fact (consumed field) | Label | `reason` (via the map) | Severity |
|---|---|---|---|
| `recovery.chosen_fallback` non-null and its identity differs from the requested identity | `approved_fallback_selected` | `APPROVED_FALLBACK_SELECTED` | `warning` |
| `recovery.terminal` non-null (`hold: 'parcel-held'`) | `route_unavailable` | `ROUTE_UNAVAILABLE` | `error` |
| `recovery.refresh.result` ∈ `unavailable`/`deadline-exceeded` (or `refresh.reason` non-null with no refreshed provenance) | `catalog_refresh_failed` | `CATALOG_REFRESH_FAILED` | `notice` |
| `recovery.attempted[].refusals[].name` ∋ `MAPPING_MISSING_REFUSED`/`MAPPING_INCOMPLETE_REFUSED` | `mapping_missing` | `MAPPING_INCOMPLETE_REFUSED` | `notice` |
| `proposal` present with `status: 'PROPOSED-NOT-WRITTEN'` | `config_update_proposed` | `CONFIG_UPDATE_PROPOSED` | `notice` |

Severity is a **presentation field** owned by this renderer (D10's warning/error rules, `charter.md:109`); `kind`/`outcome` always come from `REASON_VOCABULARY`. Severity rule: `warning` iff the first row fires (a real route change), `error` iff the second fires (a hold), else `notice`.
4. **`DiagnosticInput`** = `{ parcel_ref?: string | null; correlation_id?: string | null; requested?: DiagnosticIdentity; selected?: DiagnosticIdentity; recovery?: RecoveryEpisodeRecord; proposal?: ConfigRepairProposal }` where `DiagnosticIdentity = { registry_key: string | null; provider: string | null; model: string | null }` — carried as data (the MRC-06 C2 input-seam pattern). `DiagnosticsBatchInput = { inputs: readonly DiagnosticInput[] }`. When the caller omits identities, the renderer falls back to record fields (`terminal.requested.registry_key`, `chosen_fallback.identity`) as `registry_key` and leaves `provider`/`model` **null** — never derived (Forbidden).
5. **Pure module.** `recovery-diagnostics.ts` performs no I/O, no clock reads, no process access (the resolver-purity pattern, `pi-resolver.ts:3-8`). `resolveRenderOptions` takes its facts as plain arguments.

### C2 — Renderer API

1. `deriveDiagnosticEvents(input: DiagnosticInput): readonly DiagnosticEvent[]` — applies the C1.3 table in row order per input, then input order across the batch.
2. `buildDiagnosticsReport(batch: DiagnosticsBatchInput): DiagnosticsReport` — the machine document: `{ kind: 'recovery-diagnostics'; schema_version: 1; vocabulary_version: string; events: readonly DiagnosticEvent[]; rendered: readonly RenderedDiagnostic[] }`. `events` is **complete** (one entry per derived event, in order); `rendered` is the deduplicated view (C5).
3. `DiagnosticEvent` = `{ label: DiagnosticLabel; reason: ReasonCode; kind: EventKind; outcome: ReasonOutcome; severity: DiagnosticSeverity; parcel_ref: string | null; correlation_id: string | null; requested: DiagnosticIdentity; selected: DiagnosticIdentity; detail: string; next_action: string | null }`. `next_action` is carried where the record supplies one — for `route_unavailable` it is `terminal.reason` verbatim (MRC-08 C5.1 made that field actionable: *"reason is actionable (names the exhaustion condition and the next action)"*); for `config_update_proposed` it is composed from `proposal.apply_contract.writer`; otherwise null (*"where appropriate"*, `charter.md:109`).
4. `renderHumanLine(event, options): string` and `dedupeRendered(events): readonly RenderedDiagnostic[]` — the terminal view (C3–C5). `RenderedDiagnostic = { line: string; occurrences: number; event_indexes: readonly number[] }`.
5. Results are returned, never thrown (the MRC-06/MRC-08 typed-result convention); malformed input shapes are rejected by typed guards at the CLI boundary (C8).

### C3 — Rendering rules (D10 `:109`, in order)

1. **One concise warning when an approved fallback changes the requested route.** Exactly one rendered line per distinct fallback-change event (template: `warning: approved fallback changed route <parcel>/<correlation>: requested <req> -> selected <sel> [reason=APPROVED_FALLBACK_SELECTED]`). A `chosen_fallback` whose identity equals the requested identity renders **no** warning (falsifiability pair). Nothing else is ever rendered at `warning`.
2. **An actionable error when a parcel is held.** For every `route_unavailable` event: `error: parcel held <parcel>/<correlation>: requested <req> [reason=ROUTE_UNAVAILABLE] next: <next_action>`. The error line names the parcel/correlation ID, the requested identity, the reason, and the next action.
3. **Notices.** `mapping_missing`, `catalog_refresh_failed`, and `config_update_proposed` render one concise `notice:` line each, carrying the label, parcel/correlation ID where present, requested/selected where present, `[reason=<code>]`, and the typed detail. The `config_update_proposed` line never carries config contents or secrets (Forbidden; D9 `charter.md:103`).
4. **Field rule.** Every warning and error line includes parcel/correlation ID, requested and selected provider/model (as recorded), reason, and next action where the record supplies one.

### C4 — Sanitization and bounding (before terminal rendering)

1. `sanitizeForTerminal(text)` strips ANSI escape sequences and **all** Unicode control characters (C0 `U+0000–U+001F`, DEL/C1 `U+007F–U+009F`) from every value interpolated into a human line. Rendered lines are single-line; no ESC byte and no control byte survives (control).
2. `boundIdentifierText(text)` bounds untrusted identifier text (parcel/correlation IDs, registry keys, provider/model strings, detail text) to **96 characters** with a `…` marker on truncation. The bound is a renderer presentation constant, not a policy value.
3. Sanitization and bounding apply to the **terminal rendering only**; the machine report retains the complete validated field values (JSON-escaped by serialization), satisfying *"retaining complete events"* (`charter.md:109`).

### C5 — Deduplication with occurrence counts

1. The dedup key is the canonical tuple `(label, reason, severity, parcel_ref, correlation_id, requested, selected, detail, next_action)`. Identical derived events collapse into **one** rendered line carrying `occurrences: N` (rendered as `(xN)` when `N > 1`) and the full `event_indexes` list.
2. `DiagnosticsReport.events` retains **every** complete event regardless of dedup (*"Deduplicate repeated warnings while retaining complete events and occurrence counts"*, `charter.md:109`); only the `rendered` view and the human output collapse. Repeats are never hidden — the count is always visible.

### C6 — Non-interactive output and no-color

1. `resolveRenderOptions({ noColorFlag, nonInteractiveFlag, noColorEnv, isTTY }): RenderOptions` — `color = isTTY && !noColorFlag && !noColorEnv && !nonInteractiveFlag`; `interactive = isTTY && !nonInteractiveFlag`.
2. `NO_COLOR` set to any value disables color (the no-color.org convention); `--no-color` and `--non-interactive` flags force the same. When `color` is false the rendered output contains **zero** ANSI sequences (control); when interactive and color-enabled, severity prefixes may carry ANSI.
3. Non-interactive mode adds no interactive affordances — the renderer is one-shot and never prompts.

### C7 — Optional notifications: disabled by default, platform-aware, failure-isolated

1. **The seam.** `NotificationRequest = { severity: DiagnosticSeverity; line: string }` (already sanitized and bounded) and `NotificationSink = (request: NotificationRequest) => void` — injected. The pure planner `notificationCommand(platform, request)` returns the platform argv; `createPlatformNotificationSink({ platform, spawnSync })` returns a sink that executes it inside a guard.
2. **Disabled by default.** The CLI wires a sink only when `--notify` is passed; without it the sink is never invoked (call counter zero). Even when enabled, only `warning` and `error` lines notify (one fire per distinct rendered line, after dedup) — notices never notify. This is the whole notification surface: **no background alert service** (`charter.md:109`) — no timers, daemons, watchers, or sockets; the CLI process runs to completion (static control).
3. **Platform-aware, including Windows.** `notificationCommand('win32', …)` returns a PowerShell audible invocation (`powershell.exe -NoProfile -NonInteractive -Command` with a `[console]::beep` — never a POSIX tool); `darwin` returns `osascript -e 'beep 1'`; every other platform (including unsupported ones) returns the terminal-bell fallback (`\x07` to stderr, no spawn) and never throws. A desktop sink may be injected by the caller (Out of Scope).
4. **Failure isolation — notification failure must not change routing outcomes** (`charter.md:109`). Sink invocation is wrapped (try/catch plus spawn error handling); any failure surfaces as at most one stderr line `warning: notification suppressed (<sanitized reason>)` and changes **nothing else**: the machine report is byte-identical to a sink-free run, the exit code is unchanged, and no routing outcome is touched — the renderer is read-only over already-produced records, so routing outcomes cannot change by construction, and the byte-equality is a falsifiable control.

### C8 — The CLI seam: `routing-policy diagnostics <path>`

1. **One additive verb** beside the untouched `validate` verb (`routing-policy/src/cli.ts:1-45`): `routing-policy diagnostics <path> [--no-color] [--non-interactive] [--notify]`. `<path>` is a JSON file containing `DiagnosticsBatchInput`; argv values are data only (charter bullet 10, `charter.md:140`).
2. **Stdout machine output.** On success, stdout carries exactly one JSON document — the `DiagnosticsReport` (valid JSON, parseable). On any failure stdout stays **empty** (no partial output).
3. **Stderr human output.** The deduplicated rendered lines (C3–C6) go to stderr via `process.stderr.write`, the existing convention (`cli.ts:23,:31,:38`; `receipts/src/cli.ts:24-29`).
4. **Exit codes mirror the frozen family** (`cli.ts:1-5`): `0` rendered; `1` input document invalid (typed violations listed on stderr); `2` usage error (missing/unreadable path, bad invocation). Exit codes describe the CLI operation only — routing outcomes live in the JSON and are inspected as validated fields (`charter.md:107`), never inferred from exit codes or grep.
5. **`validate` stays byte-identical.** Its behavior, exit codes, and messages are equivalence evidence (shipped `tests/cli.test.ts` passes with zero edits).

### C9 — Data class, spend, rollback; review and acceptance

**Data class:** internal — the renderer carries repo-internal routing metadata, identity names, and typed refusal strings; no credentials, no host paths, no config contents on any surface (C3.3). **Spend:** zero — no provider call, network call, or paid experiment is made or implied. **Rollback:** delete `recovery-diagnostics.ts`, `recovery-notify.ts`, and the new test file, and revert the additive hunks in `cli.ts` and `index.ts`; every consumed seam is untouched, so pre-parcel behavior is restored exactly. **Review:** one independent review (wrapper D6 `:34`; MRC-12 row `:65`); the reviewer never fixes or commits.

## Existing Patterns To Follow

| Pattern | Source | How this parcel follows it |
|---|---|---|
| Reason/outcome vocabulary consumed, never forked | `REASON_VOCABULARY`/`D10_REASON_RECONCILIATION` (`receipts/src/types.ts:101-127`) | every event resolves label → code → kind/outcome through the landed map; enumeration control (RB-5 style) |
| Typed discriminated results, returned never thrown | `RecoveryResolution` (MRC-08 C1.4); `RouteUnavailableOutcome` (MRC-06/MRC-08); `ConfigRepairResult` (MRC-10) | `DiagnosticsReport`/`DiagnosticEvent`; input guards reject with typed violations at the CLI boundary |
| Injected-effect seam beside a pure core | `ResolveOptions.issued_at`/`now` (MRC-08 C1.2); `ConfigWriteSeam` (MRC-10 C5.2) | `NotificationSink` injected; `recovery-diagnostics.ts` stays pure; only `recovery-notify.ts` executes |
| CLI exit-code family + stderr human text | `routing-policy/src/cli.ts:1-45`; `receipts/src/cli.ts:1-80` | the `diagnostics` verb mirrors 0/1/2; `validate` untouched |
| Guard-first, failure leaves no partial output | `writeConfigRepairAtomically`'s rollback discipline (MRC-10 C5.2); charter bullet 10 (`charter.md:140`) | stdout empty on failure; report built fully before one write |
| Named-negative-control test style | `routing-policy/tests/pi-resolver-recovery.test.ts` (MRC-08); `rcm-predicates.test.ts:26-38` | refusal/label **names** asserted, falsifiability pairs, never bare non-selection |
| Additive barrel re-export | HRO-P1's `index.ts` hunk precedent | additive exports only; existing export list untouched |
| Redacted rendering of proposals | MRC-10 C3.4; D9 (`charter.md:103`) | `config_update_proposed` lines carry redacted summary + identity names only |

## Required Tests / Verification

Exact commands (from `plugins/foreman-line/routing-policy/`): `npm test`, `npm run typecheck`, `npm run lint`, `node --version`, and the scoped `npx tsx --test tests/recovery-diagnostics.test.ts`. Per the second-writer rule (`loop-directive.md:8`), Step 0 and completion each require a **full-suite re-run** after re-reading the post-MRC-08/MRC-10 tree. Toolchain failure is recorded verbatim as a STOP flag (Stop-and-Report #9).

Test content (permanent, all in `routing-policy/tests/recovery-diagnostics.test.ts`):

1. **Label→vocabulary reconciliation (C1):** each of the five `D10_REASON_RECONCILIATION` labels is produced by exactly one named fixture (from the C1.3 table); for every emitted event, `reason === D10_REASON_RECONCILIATION[label]` and `REASON_VOCABULARY[reason]` equals the event's `kind`/`outcome`; the emitted reason-code set equals exactly the map's range; a fabricated label is never rendered (falsifiability pair).
2. **Warning rule (C3.1):** a changed-route `chosen_fallback` renders exactly one `warning:` line including parcel/correlation ID, requested → selected, and `reason=APPROVED_FALLBACK_SELECTED`; an identity-equal fallback renders none; a second identical input collapses to one line with `occurrences: 2` while `events.length === 2` (complete retained).
3. **Error rule (C3.2):** a `terminal` with `hold: 'parcel-held'` renders one actionable `error:` line with parcel/correlation ID, requested identity, reason, and `next: <terminal.reason>`; an episode without a terminal renders no error.
4. **Notice + redaction (C3.3):** `mapping_missing` (via `MAPPING_MISSING_REFUSED`/`MAPPING_INCOMPLETE_REFUSED` refusals), `catalog_refresh_failed` (via `refresh.result` `unavailable`/`deadline-exceeded`), and `config_update_proposed` (via a `PROPOSED-NOT-WRITTEN` proposal) each render exactly one `notice:` line; the proposal-derived line and the machine report contain no `changes[].value` content and no credential text (scan control with canary strings).
5. **Sanitization + bounding (C4):** identifiers carrying ANSI escapes, NUL, newlines, and C1 bytes render with zero control/ESC bytes in the output lines; a 500-char identifier renders truncated at the bound with the `…` marker; the machine `events` retain the complete values.
6. **Non-interactive + no-color (C6):** `resolveRenderOptions` — each of `--no-color`, `NO_COLOR`, `--non-interactive`, and non-TTY forces `color: false` and zero ANSI in rendered output; color appears only when TTY and neither flag/env is set.
7. **Notification isolation (C7):** without `--notify` the sink is never invoked (counter 0); with `--notify` and a throwing sink the machine report is byte-identical to a sink-free run and the exit code is unchanged, with at most one `notification suppressed` stderr line; `notificationCommand('win32', …)` returns a `powershell.exe` argv (Windows branch never shells to POSIX), `darwin` an `osascript` argv, and the fallback never throws; the static no-background-service control (no `setInterval`/`setTimeout`/`watch`/`createServer` in the new modules).
8. **CLI seam (C8, subprocess in the `tests/cli.test.ts` style):** `diagnostics <fixture>` exits `0` with stdout parsing as JSON (`kind: 'recovery-diagnostics'`, `vocabulary_version` present) and all human lines only on stderr; an invalid input document exits `1` with typed violations and empty stdout; a missing path exits `2`; the shipped `validate` behaviors reproduce unchanged (equivalence).
9. **Equivalence evidence — everything else green UNCHANGED:** `routing-policy/tests/{pi-resolver,pi-resolver-recovery,pi-openrouter,rcm-predicates,fallback-contract,parity,semantic-invariants,schema-validation,launch-boundary,host-settings-proposal,expertise-vocabulary,cli,entrypoint,dependency-allowlist}.test.ts` pass with **zero edits**; no consumed source seam is edited.

## Acceptance Criteria

1. **Existing vocabulary only (D10 `:107`):** every diagnostic event carries a `ReasonCode`/`kind`/`outcome` resolved through `D10_REASON_RECONCILIATION`/`REASON_VOCABULARY` as landed; the machine report is a read-only view — no parallel event format, no new label or code, no write to any record or receipt chain.
2. **Warning + error rendering (D10 `:109`):** exactly one concise warning per distinct approved-fallback route change and exactly one actionable error per held parcel, each including parcel/correlation ID, requested and selected provider/model as recorded, reason, and next action where the record supplies one.
3. **Sanitization + bounding (D10 `:109`):** no control characters and no unbounded identifier text reach the terminal; machine output retains complete events.
4. **Dedup with counts (D10 `:109`):** repeated warnings collapse to one line with visible occurrence counts; complete events are retained.
5. **Non-interactive + no-color honored (D10 `:109`):** `--no-color`, `NO_COLOR`, `--non-interactive`, and non-TTY each produce zero-ANSI output.
6. **Optional notifications (D10 `:109`):** off by default; behind `--notify`; platform-aware including Windows; a failing notification leaves the machine report and exit code unchanged and can never alter routing outcomes; no background alert service exists.
7. **CLI contract (charter `:139`):** stdout remains parseable JSON, human diagnostics on stderr, exit codes 0/1/2 as pinned; failed runs leave no partial stdout; the `validate` verb is byte-identical.
8. The Verification block passes on `routing-policy` (or a toolchain failure is recorded verbatim as a STOP flag — recorded, not resolved); the diff is exactly the Allowed Files entries; every shipped suite passes with zero edits.
9. One independent review completed and triaged (C9); the reviewer never fixed or committed.

## Evidence Required

1. Command output for `npm test`, `npm run typecheck`, `npm run lint`, `node --version`, and the scoped `tests/recovery-diagnostics.test.ts` run from `plugins/foreman-line/routing-policy/`.
2. **Step-0 anchor re-attestation (mandatory):** every C0 anchor re-verified against the post-MRC-08/MRC-10 tree before work proceeds; the in-flight MRC-10 named outputs (`ConfigRepairProposal`, `CONFIG_REPAIR_REFUSALS`, `redacted_summary`) attested by **name and shape**, any delta reported with corrected anchors before proceeding. The second-writer rule additionally requires the full-suite re-run (`loop-directive.md:8`).
3. Control inventory: the final test names per Required Tests 1–8 with the falsifiability pairs (identity-equal fallback turns the warning green-by-absence; removing the reconciliation assertion turns the label control red; a throwing sink keeps the report bytes identical; `--notify` absent keeps the sink counter at zero).
4. One rendered transcript in the completion report: the machine `DiagnosticsReport` JSON plus the stderr lines for a fixture batch covering all five labels, including a deduplicated `(xN)` warning and a held-parcel error.
5. Notification isolation evidence: byte-equality proof of the machine report across sink-disabled / sink-succeeding / sink-throwing runs, and the `win32`/`darwin`/fallback command argvs.
6. Review record: **1 independent review** (wrapper D6 `:34`; MRC-12 row `:65`) with the coordinator's triage notes.
7. **HRO-P4c acceptance record (required for closure, not performed by this parcel):** this spec's C0 inventory + control list written into the `hybrid-routing-optimization` goal record via an MRC-01-class Stage-F record act.

## Collision Risk (Lane G slot 10)

Write set $W$ = the 5 Allowed Files, all inside `routing-policy/`. Disjointness proof vs the report §7 lanes (`docs/goals/goal-status-report-2026-09-27.md:93-96`, task rows `:102-126`, strict order `:143`) and the HCS collision map (`docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md`):

- **SP8 (`routing-policy/`, `:197`) — Lane G slot 10.** Wrapper D4 (`docs/goals/model-routing-chain-wrapper/charter.md:32`) and the §7 strict order (*"… → MRC-10 → MRC-11 → MRC-12 → MRC-13"*, `goal-status-report-2026-09-27.md:143`) permit this parcel only after MRC-11's window closes. $W$ touches **no `dispatch/` file at all** (SP9 `:198` not in contact).
- **File-level overlap with the slot-6/8 writer is exactly one file, by design:** $W \cap W_{\text{MRC-08}} = W \cap W_{\text{MRC-10}} = \{$`routing-policy/src/index.ts`$\}$ (MRC-08's 5-file set, `docs/specs/active/MRC-08-hro-p4a-recovery-ladder.md:9-14`; MRC-10's 3-file set, `docs/specs/active/MRC-10-hro-p4b-config-repair-proposals.md:9-13`). Safety is **sequencing plus named-output consumption**: the record/proposal shapes are consumed as named exports (never re-derived), `route-receipt.ts`/`types.ts`/`config-repair-proposal.ts` are deliberately **not** in $W$, and the second-writer rule requires re-read + full-suite re-run at Step 0.
- **`routing-policy/src/cli.ts` is a fresh claim in this chain** — no MRC-02…11 write set includes it (checked against the MRC-08/MRC-10 specs and the report rows). The shipped `tests/cli.test.ts` is equivalence evidence and stays read-only; the `validate` verb is pinned byte-identical.
- **MRC-11 (slot 9, RCM-P7) and MRC-07/MRC-09:** their landed surfaces are unknown at shaping time; the strict order serializes them before this parcel and **Step 0 must diff their landed surfaces against $W$** and report any overlap before work proceeds (the MRC-08/MRC-10 precedent; Stop-and-Report #2).
- **SP13 (`:202`, serialization-point family incl. barrel exports):** $W$ touches exactly one family member — `routing-policy/src/index.ts` — as the **single active claimant within its window** (HRO-P1/MRC-08/MRC-10 additive-hunk precedent; serialized by Lane G). Verdict **wait** if a second claim appears mid-window; **escalate** rather than co-write (wrapper D10).
- **SP17 (`:206`, shared `routing-policy/tests/`):** $W$ adds one **new** file and edits none — file-disjoint (the MRC-03/MRC-08/MRC-10 new-test precedent). **SP11 (`:200`, `templates/`) and SP16 (`:205`, user-owned `routing-policy.yaml`):** not in contact.
- **Lane P-A / P-R / X / GMF** (`goal-status-report-2026-09-27.md:94-96`): MRC-01/04/20/21 write records/canon/external rows; MRC-14/15/16 read receipt evidence; MRC-17–19 consume diagnostics; GMF is separate Keon repos — none writes $W$, and $W$ writes no records (Evidence #7 is outside $W$).
- **Checked non-contact:** `receipts/**` (imported read-only via the relative-workspace path, the `generate.ts:3` precedent — no receipt file in $W$), `dispatch/**`, `contracts/**`, `routing-policy/schemas/**`, `routing-policy/tests/dependency-allowlist.test.ts` (no new npm dependency).
- **Standing caveat (wrapper D10, `charter.md:38`):** `routing-policy/` remains contested with the FK-P2/FK-P3 ownership negotiation (HCS O5, `escalated-unresolved`). A real collision with a non-chain writer is a stop-and-escalate event, never a co-write.

**Verdict: dispatchable in Lane G slot 10 after MRC-11's window closes. One intentional overlap with MRC-08/MRC-10 (the `index.ts` barrel) carried by Lane G sequencing + named-output consumption + Step-0 re-attestation; `cli.ts` is a fresh claim pinned by the shipped CLI suite; file-disjoint from every other §7 writer; single claimant on the touched SP13 barrel and the new SP17 test file. Anchor drift from the in-flight MRC-10 named outputs is the principal risk — carried by C0's re-attestation and the STOP rules below.**

## Stop-and-Report Rule

Stop the affected work and report the exact blocker (coordinator resolves; never conceal through fallback, weakened controls, or a fabricated receipt) when any of the following occurs:

1. Implementation requires any path outside Allowed Files — including any `receipts/**` edit (even a vocabulary addition), `dispatch/**`, `contracts/**`, `route-receipt.ts`/`types.ts`/`config-repair-proposal.ts`, `routing-policy.yaml`, or any goal record — await a coordinator-ratified spec amendment per SPEC-CONVENTION §4.8 (`docs/SPEC-CONVENTION.md:127-140`).
2. **Any C0 anchor does not reproduce at implementation time** (MRC-10's window is landing; MRC-07/MRC-09/MRC-11 land ahead of this parcel) — e.g. `D10_REASON_RECONCILIATION` renamed or reshaped, MRC-08's record types moved, MRC-10's `ConfigRepairProposal`/`CONFIG_REPAIR_REFUSALS` named differently, or MRC-07/MRC-09/MRC-11's landed surfaces overlapping $W$. Surface the corrected anchors and the behavioral delta before proceeding; the second-writer rule binds Step 0 regardless.
3. Any requirement would add a label, reason code, or event schema outside `D10_REASON_RECONCILIATION`/`REASON_VOCABULARY`, re-map the reconciliation, or emit diagnostics through the receipt/event path — never; if a record fact cannot be expressed through the five landed labels, stop and report the fact.
4. Any requirement would decompose or normalize an opaque registry key into provider/model, render config contents or secrets (D9 `charter.md:103`), emit control characters or unbounded identifier text on the terminal, or derive identity from a host id — never.
5. Notification would default on, spawn a background service, or a notification failure would change the machine report, the exit code, or any routing outcome — stop; isolation is the acceptance criterion, not a nicety.
6. A control can only pass by weakening, renaming, or re-pinning an existing control — stop; a weakened control is never the fallback.
7. A live write claim by another parcel is observed on `routing-policy/**` (SP8/SP13/SP17) — the map's verdicts are `wait`/`escalate`, never co-write.
8. **Authority ambiguity on the caller-wiring boundary:** whether "render D10's structured recovery events" (`charter.md:124`) includes wiring production callers (batch runner, entry module, ops-console verbs) to feed the renderer within this parcel (reading A: the row's proof targets are all seam-provable and the renderer + CLI verb are the complete named seam) or whether that wiring is a separate named carry (reading B: MRC-08/MRC-10's pre-ruled STOP-8 analogues treated runtime wiring as another surface's act). Surface the question with the two readings at dispatch time; never resolve charter ambiguity unilaterally.
9. `routing-policy` checks fail on the toolchain (node/tsx/typescript/biome) — record the exact output as a STOP flag; engines and dependencies are never edited.
10. Authority text is ambiguous on scope this spec resolves by reading — e.g. whether the `diagnostics` verb's exit code should reflect a held parcel (this spec reads D10 as pinning exit codes to CLI operation only, `:107`: inspect validated event fields, not process state), whether notices should also notify (this spec reads D10's notification sentence as covering the warning/error classes), or whether the machine report may carry notification state (this spec reads failure isolation as byte-equality, so it does not) — surface the question with the two readings; never pick one silently.
