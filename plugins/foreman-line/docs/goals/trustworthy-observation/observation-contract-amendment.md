# TO-P0 observation contract amendment

Proposed companion amendment, documentation only; independent re-review pending. [TO-P0 scope](../../specs/active/TO-P0-observation-contract-amendment.md#constraints), [charter D1–D8/A2](charter.md#locked-decisions), and [rework rulings](to-p0-rework-rulings.md) govern. Source clauses below are paraphrased, not quotations. Amendments retain loopback observation, existing routes, five parcel states and R1→R5 precedence, two console-local writable files, and present-only human gates. No authority authentication, crypto verification, historical-record rewriting, or new executable rights.

## RAT — current ratification grammar

Amends [FOC-P0 C3](../../specs/active/FOC-P0-projection-contract-and-discovery-inventory.md#c3-gate-proxy-rules-oq5-read-only-the-console-records-no-gate-decision): its broad Status/Gate-1 text proxy becomes this bounded reader ([R1](to-p0-rework-rulings.md)). Sources are selected-tree `charter.md` and `loop-directive.md` only, zero link recursion. Preserve reference locators for explanation only.

Process Markdown records in document order, excluding fences, blockquotes, tables, quoted text, and sections marked historical/archive/example/instruction/superseded by their heading (until a heading of equal/higher level). A standalone historical-note marker suppresses following records until the next heading. Labels/headings/value tokens match case-insensitively; uppercase literals below name the supported tokens. Remove balanced `**` delimiters spanning the label/value (including multiline value emphasis), preserving their text; unmatched emphasis is unsupported. B accepts a `-`, `*`, or `+` bullet or a bold label line. Quoted spans never become tokens. Heading exclusions use whole-word markers, case-insensitively; historical-note markers allow bold delimiters.

| Dialect | Supported current record | Outcome |
|---|---|---|
| A | First eligible top-metadata `Status:` before first level-two heading; leading value `RATIFIED` or `FULLY RATIFIED` | granted |
| A | Current anchored `Status:` label with immediately following `PENDING`, `DRAFT`, `UNRATIFIED`, `NOT RATIFIED`, `NOT GRANTED`; negative evidence is collected even after the first metadata record | pending |
| B | Heading exactly `Gate 1 record` or `Gates and standing authorizations`, optionally followed by dash and description; standalone bullet/bold `Gate 1:` with immediately following `GRANTED`/`RATIFIED` | granted |
| B | Same form with `PENDING`/`NOT GRANTED`/`NOT RATIFIED` | pending |

Tokens require word boundaries; unrelated dates/prose do not supply approval. First-record/top-metadata eligibility restricts positive grant establishment only. After the same Markdown exclusions, every current anchored goal `Status:` or `Gate 1:` label with immediately following `PENDING`, `DRAFT`, `UNRATIFIED`, `NOT RATIFIED`, or `NOT GRANTED` is negative conflict evidence regardless of positive position or B-heading eligibility. These labels must occupy a standalone record line (optional bullet/bold normalization), not quoted/incidental text. One supported current grant plus any such current denial yields unknown across either source; unsupported standalone current goal-Gate-1 revocation or conditional evidence also yields unknown. No token-only scan: negation about plan review, Gate 2/3 or scoped parcel states does not negate goal Gate 1. A leading positive token qualified by `if`, `provided`, `conditional` or unresolved/revoked goal-Gate-1 text yields unknown; unsupported qualification targeting that grant is unknown. Decision-table approvals are unnecessary. Collect eligible supported records in both sources; conflicting outcomes, conditional/unresolved/revoked statements about the current grant, or unsupported supersession produce unknown with source diagnostics. Explicit historical scope alone excludes older records; no timestamp winner or directive override. No supported evidence means unknown. Missing/unreadable sources prevent a trustworthy reconciliation and yield unknown. Current w4 first Status and trustworthy-observation/foreman-ops-console metadata work; historical w4 metadata and quoted owner instructions confer nothing. [Positive RAT-P](observation-scenarios.md#rat-p), [negative RAT-N](observation-scenarios.md#rat-n).

## ATT — unknown attention and remedy

Amends [FCA-P0 §3](../../specs/active/FCA-P0-ops-console-multi-root-and-status-index.md#3-status-index-derivation-fca-2) and [FCA-P1 §3/AC1](../../specs/active/FCA-P1-remediation-advisor.md#3-additive-surface-the-only-changes), which count pending ratification and expose goal remedies. Add `attention.ratificationUnknown: 0|1`, retain `ratificationPending`; `total = hung + failed + awaitingGate + ratificationPending + ratificationUnknown`. Unknown forces active even with empty/all-complete queue or closed narrative. Exactly one unknown goal-level remedy: existing Remedy shape, `parcel:null`, `cause:'ratification-evidence'`; inspect/reconcile actual sources first, ask owner if unresolved next, park last (≥2 branches). Never recommend rewriting historical evidence to fit the parser. [ATT-P](observation-scenarios.md#att-p), [ATT-N](observation-scenarios.md#att-n).

## EVD — isolation and accessible diagnostics

Amends [FOC-P0 C1/C2](../../specs/active/FOC-P0-projection-contract-and-discovery-inventory.md#c1-parcel-identity-and-discovery), which retain unmapped chains and invalidate malformed members. `evidenceDiagnostics` uses:

```ts
type Locator = {root:string, relativePath:string};
type EvidenceDiagnostic =
 | {kind:'workflow', root:string, workflowId:string,
    memberLocator:Locator|null, code:string, message:string}
 | {kind:'goal', root:string, goalKey:string,
    documentLocator:Locator, code:string, message:string};
```

Retain every existing response field. Goal detail adds `evidenceDiagnostics` and `unmappedChains:ChainSummary[]`; parcels retains its existing unmappedChains and adds diagnostics. Mapped parcel chain response adds only that parcel's diagnostics. Goal-selection UI exposes a goal evidence section without requiring a parcel, including unmapped root/workflow/member and missing/unreadable document evidence. Invalid genesis never fabricates a parcel; unreadable goals never fabricate workflows. Isolate failures per document/workflow/goal; unrelated records survive.

Discovery remains directive-dependent ([scan](../../../ops-console/src/scan.ts)): a known entry with unreadable directive is not a fabricated discoverable goal; additive `/api/goals.evidenceDiagnostics` carries its goal diagnostic, detail remains explicit 404. Missing optional charter leaves an otherwise discoverable goal unknown. Malformed/escaping goal keys must be rejected before file access, retain existing error response, never converted into paths. No new route. [EVD-P](observation-scenarios.md#evd-p), [EVD-N](observation-scenarios.md#evd-n).

## MEM — shared membership and CLI exits

Reaffirms [FOC-P0 C2.2–4](../../specs/active/FOC-P0-projection-contract-and-discovery-inventory.md#c2-receipt-chain-walk-semantics); amends [receipts directory CLI](../../../receipts/src/cli.ts)'s all-JSON selection. TO-P3 introduces one receipts-owned helper, exported via index and consumed by console/CLI. Members match exactly `^[0-9]{6}-([A-F])-[a-z0-9-]+\.json$`, lexical filename order. ALL nonmatches, including `notes.json`, `000001-Z-foo.json`, are excluded. Matching sidecars are members. Matching malformed/unreadable/nonobject evidence is invalid or unavailable, never skipped. Existing schema, sequence/gap, linkage/correlation validation and structural seal remain; no cryptographic claim.

Directory CLI: empty matching set →2; matching unreadable/unparseable →2; parsed null/primitive/array/schema/link/gap/correlation failure →1; valid members plus arbitrary nonmatching sidecars →0. Per-file behavior unchanged. [MEM-P](observation-scenarios.md#mem-p), [MEM-N](observation-scenarios.md#mem-n).

## DOC — designated documents and locators

Amends [FCA-P0 §2 refs](../../specs/active/FCA-P0-ops-console-multi-root-and-status-index.md#2-additive-surface-the-only-changes), [FOC-P0 Constraints C1/X1](../../specs/active/FOC-P0-projection-contract-and-discovery-inventory.md#constraints): log inputs previously exactly chain documents, invocation audit and directive state lines. Explicitly extend that input set with selected spec content; retain route table.

Goal detail retains GoalRecord and adds `documents:SourceDocument[]` for charter/directive only. Existing parcel logs retains `goal`, `parcel`, `chainDocuments`, `invocationAudit`, `stateLines`, and adds documents for the existing join's selected spec only. No selected spec: documents empty plus explicit unavailable evidence diagnostic; no invented locator.

```ts
type SourceDocument = {
 kind:'charter'|'directive'|'spec', locator:Locator,
 status:'ok'|'missing'|'error'|'withheld', content:string|null,
 diagnostic:{code:string,message:string}|null
};
```

`ok`: UTF-8 content and null diagnostic. Every other status: null content and non-null diagnostic. Bound reads to 1 MiB; larger content withheld. No client path or directory-listing surface. Preserve legacy string refs; additive locators resolve against selected configured root/layout, never aliases or another root.

| Layout ([config](../../../ops-console/src/config.ts)) | Goal documents | Spec |
|---|---|---|
| plugin | `plugins/foreman-line/docs/goals/<slug>/{charter,loop-directive}.md` | `plugins/foreman-line/docs/specs/{active,done}/<file>` |
| native | `docs/goals/<slug>/{charter,loop-directive}.md` | `docs/specs/{active,done}/<file>` |
| initiative | `docs/INITIATIVES/<slug>/{charter,loop-directive}.md` | `docs/specs/{active,done}/<file>` |

Lexical and realpath containment (including symlinks) must pass before read. Escapes/unconfigured roots/undesignated paths are withheld with reason; unavailable designated sources stay visible. Directive discovery constraints are EVD. [DOC-P](observation-scenarios.md#doc-p), [DOC-N](observation-scenarios.md#doc-n).

## INV — truthful grounded handoffs

Amends [FOC-P0 M1/A2](../../specs/active/FOC-P0-projection-contract-and-discovery-inventory.md#constraints) and [FCA-P1 §3](../../specs/active/FCA-P1-remediation-advisor.md#3-additive-surface-the-only-changes). Registry remains exactly approval-show, approval-approve, approval-reject, dispatch-execute, receipts-validate. Frozen argv: approval verbs `[verb,slug,'--repo-root',root]`; dispatch verb `executeDispatch` same slots; validation `['validate',path]`. Only primary root may execute nonminting flows; mutators and all extra-root handoffs remain presentation. Advisor executes nothing; audit/write boundaries unchanged.

Approval slug is unique matching actual projected filename `<slug>.projected.shaping-result.json` basename with frozen lowercase pattern, never parcel case conversion. Missing/malformed/duplicate/unsupported artifact → withhold reason. [Actual resolver](../../../approval/src/resolve-input.ts) can project when absent: approval-show is eligible only for an existing readable unique artifact resolvable by frozen argv. CLI defaults `docs/specs/active`; `--repo-root` does not select plugin specsDir. Home plugin artifact therefore cannot resolve via frozen slug argv: withhold, do not fake a runnable command or add arbitrary-path args. TO-P5 needs separately reviewed existing adapter amendment or continued withholding. Approval requires owner `--approver`/TTY/confirmation; rejection reason is an owner input (CLI permits omission). Frozen console args cannot capture these: explain requirements, never forge inputs or claim an incomplete command is executable. Dispatch has no bin: withhold runnable handoff.

When supported, validation targets exact uniquely mapped workflow directory. Duplicate chains retain lexicographic display winner/flag but handoff withheld; unmapped has no invented target. Commands use shipped Node/tsx/CLI binding from [invoke](../../../ops-console/src/invoke.ts), absolute code paths, selected-root cwd, structured subprocess argv, never shell execution. Copy strings quote EVERY argument: bash/zsh/fish single quotes, embedded quote via close/double-quoted-single-quote/reopen; PowerShell single quotes with doubled quotes. cmd.exe copy string withheld, structured argv retained. Preserve/reconcile/resume before destructive redispatch/park. [INV-P](observation-scenarios.md#inv-p), [INV-N](observation-scenarios.md#inv-n).

## REF — selection-keyed settled refresh

Amends [FCA-P0 §2 UI](../../specs/active/FCA-P0-ops-console-multi-root-and-status-index.md#2-additive-surface-the-only-changes) and [FOC refresh constraint](../foreman-ops-console/charter.md#open-questions-for-gate-1-recommendation-attached-to-each). One generation requests list/status counts, board, alerts/remedies, routing, selected detail/chain/logs/docs; wait for all current requests to settle. Commit only current generation/selection. Cache each scoped panel by goalKey and parcelKey where relevant; global counts separately. Metadata: `lastSuccess`, `error`, `freshness:'current'|'stale'|'unavailable'`. First-load failure has data/lastSuccess null; later failure retains ONLY same-key prior success visibly stale; success clears error. No A-data under B-key, uniform-freshness assertion, or atomic filesystem snapshot claim.

Goal change immediately clears all prior goal board/alerts/routing/detail/docs. Successful board missing selected parcel clears it. Successful authoritative `/api/goals.goals` absence clears goal with missing notice; inactive status requires deliberate clear with inactive notice (picker filters active but goals retains inactive). List failure retains selection explicitly stale, never falsely vanished. Preserve valid active selection. Reaffirm R1→R5 and five states; mtime/worktree composite cannot prove liveness, unmatched builders/queued work can appear hung. [REF-P](observation-scenarios.md#ref-p), [REF-N](observation-scenarios.md#ref-n).
