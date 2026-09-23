# Coordinator Lint — PMC-P0 shaping attempt

**Date:** 2026-09-23
**Coordinator:** claimed this session (see `loop-directive.md` ownership block)
**Purpose:** verify every factual claim in `charter.md` on disk before shaping PMC-P0
**Outcome:** **SHAPING STOPPED — Gate 1 re-open required on model identity**

Shaping did not proceed to a spec draft. Four load-bearing charter claims are
contradicted by the best available safe evidence on disk, including one inside
the Gate 1 record that Amendment 01 explicitly did **not** re-open.

## Evidence source and its standing

All model/settings facts below come from the credential-free host-owner export
landed by the Routing Currency and Merit goal:

| Field | Value |
|---|---|
| Path | `plugins/foreman-line/docs/goals/routing-currency-and-merit/host-owner-export/` |
| `catalog-projection.json` SHA-256 | `b0c2dc8cf1412773b4ed4f17fcba10634a997f3b2b2b960d6dca200bdbb171fe` |
| `settings-projection.json` SHA-256 | `1024154d7245a52fb3cb82b3c8105a2249d5406daee03498f99cbed8ed137d1e` |
| `export-manifest.json` SHA-256 | `aa9b03faff555c6f5e98fd06b0f6e940269a5393f846877f57af562d1df692c3` |
| `generatedAtUtc` | `2026-09-20T17:01:26.485Z` |
| Source last-write times | `2026-09-20T14:25:18.753Z`, `2026-09-20T14:36:02.955Z` |

**Standing caveat, stated up front.** This export is *not* accepted evidence.
Its own manifest records `freshnessBound: "not-accepted-by-coordinator"`,
`liveEvidence: "not-yet-accepted"`, `sideEffectsAuthorized: false`, and
`downstreamAuthority: "existing complete:false snapshot remains authoritative
until fresh verification passes"`. RCM-P0 closed **incomplete** with F1–F6 at
`blocked-secret-boundary`.

That caveat weakens any *positive* claim but not the findings below. The
charter asserts catalogue **verification**; the only safe catalogue evidence in
the repo contradicts it. A contradicted verification claim is falsified
regardless of whether the contradicting snapshot is ratified. No new live
discovery, provider call, or credential read was performed for this lint.

## Findings

### L1 — `claude-opus-5.5` does not exist in the catalogue (blocks a ratified decision)

The charter's Gate 1 record states: *"Local Pi catalogue discovery verified
`opencode/claude-opus-5-5` and `openrouter/anthropic/claude-opus-5.5`."*

Both identifiers are **absent** from the catalogue projection — zero
occurrences of `claude-opus-5-5`, `claude-opus-5.5`, or any `5.5` Opus spelling.
The complete set of Opus identities present is:

```
anthropic/claude-opus-4      anthropic/claude-opus-4.1
anthropic/claude-opus-4.5    anthropic/claude-opus-4.6
anthropic/claude-opus-4.7    anthropic/claude-opus-4.8
anthropic/claude-opus-5      anthropic/claude-opus-latest
claude-opus-4-5   claude-opus-4-6   claude-opus-4-7
claude-opus-4-8   claude-opus-5
```

The highest Opus available is **`claude-opus-5`** (both the bare OpenCode-style
dash spelling and the `anthropic/`-prefixed OpenRouter spelling). The charter's
dash convention for OpenCode ids is correct in *form*; the **version does not
exist**.

Consequence: Amendment 01 A7/Q5 directs PMC-P1 to add Opus 5.5 to
`KNOWN_FRONTIER_MODELS` in `routing-policy/src/validator.ts`. Executing that
instruction would insert a **non-existent model into the frontier registry** —
the exact reviewed constant whose purpose is to prevent unverified frontier
claims. Both the frontier-coordination and adversarial-review matrix rows
depend on this identity.

### L2 — `typesafe/jev-1.13` is enabled but absent from the catalogue

`export-manifest.json` lists `typesafe/jev-1.13` under
`openrouterMissingRequiredIdentities`, while `settings-projection.json` lists
`openrouter:typesafe/jev-1.13` in `enabledModels`. Enabled but uncatalogued
resolves to a missing-model refusal, which is how RCM already dispositioned it.

The charter's typed routing/classification row names
`openrouter/typesafe/jev-1.13` as the **OpenRouter primary**. That lane has no
resolvable primary today.

### L3 — not one matrix model is currently enabled

`settings-projection.json` `enabledModels` is, in full:

```
opencode:qwen/qwen-2.5-coder-32b
opencode:deepseek/deepseek-r1-distill-qwen-32b
openrouter:anthropic/claude-3.5-sonnet
openrouter:openai/gpt-4o-mini
openrouter:typesafe/jev-1.13
```

**Zero of the twelve** matrix primaries and fallbacks appear. The charter's
"existing Pi settings enable only a small subset of these providers' current
catalogues" understates this: the enabled set and the matrix set are
**disjoint**. Exit criterion 2 ("every matrix primary and fallback is enabled")
is further from satisfied than the baseline implies, and this is configuration
work nobody currently owns a Gate 2 for.

### L4 — D6's stated interactive default does not match the host

D6 names the recovery default `opencode/qwen3.8-flash` at minimal thinking.
Observed: `defaultProvider: "opencode"`, `defaultModel:
"qwen/qwen-2.5-coder-32b"`, `defaultThinkingLevel: "minimal"`.

Provider and thinking level match; the **model does not**. D6 was not re-opened
by Amendment 01, so this is either a stale claim or an undeclared intent to
change the host default — and changing a host default is not authorized by this
charter.

### L5 — confirmed sound (no action)

| Claim | Status |
|---|---|
| D2: only `opencode` + `openrouter` registered, with those exact `baseUrl`s | **confirmed** — `settings-projection.json` `providers` matches exactly |
| Charter model IDs other than Opus 5.5 / Jev | **present** — `gpt-6-astra`, `gpt-5.6-sol`, `gpt-5.6-terra`, `deepseek-v4-pro`, `qwen3.8-flash`, `glm-5.3-flash`, `gemini-3.8-flash`, `claude-haiku-4.5`, `claude-sonnet-5` all appear |
| Pi version `0.86.1` | **confirmed** via `pi --version` |
| Routing policy is OpenRouter-slug-only, no runtime fallback | **confirmed** (prior lint, commit `39f53b2`) |

## Collision and sequencing risk

The **Routing Currency and Merit** goal is live and owned by Claude Code
coordinator session `e45b4d47-8455-49e9-9629-31c713c1b356`, state
`RCM-P0-closed-incomplete`, with **RCM-P1 held**. RCM owns:

- `routing-policy/` surfaces that PMC-P1 and PMC-P2 must change; and
- the `host-owner-export/` artifacts this lint consumed as evidence.

PMC-P0 as chartered is evidence-only and writes only inside
`docs/goals/pi-model-configuration/`, so **P0 itself does not collide on
files**. PMC-P1 and PMC-P2 **do**. The charter's stop condition "an existing
goal coordinator claims overlapping source/configuration files" is therefore
live for Wave 1 and must be sequenced with the RCM coordinator before Gate 2
for P1 — never co-owned.

Separately, RCM-P0's `blocked-secret-boundary` outcome is direct precedent:
PMC-P0 plans the same class of Pi catalogue/settings discovery that already
failed once on safe-access grounds. PMC-P0 must consume the host-owner export
through the established safe boundary rather than re-attempting host reads, and
must treat freshness as unratified.

## Why shaping stopped

Writing a PMC-P0 spec now would embed a matrix containing one non-existent
model and one unresolvable primary, and would hand a builder an A7 instruction
to register a fictional frontier model. Per the coordinator pattern, a lint
finding that invalidates a locked decision re-opens Gate 1 for that decision
only — it is not a shaping decision to quietly substitute `claude-opus-5` for
`claude-opus-5.5`.

## Requested Gate 1 re-open (model identity only)

| Item | Affected | Requested owner decision |
|---|---|---|
| M1 | Gate 1 record, matrix rows 1–2, A7/Q5 | Correct the Opus identity to `claude-opus-5` / `anthropic/claude-opus-5`, or name a different frontier model, or hold pending live verification |
| M2 | Matrix row 6 | Rule the Jev routing/classification lane refused/disabled, or name an available typed-output primary |
| M3 | D6 | Correct the stated default to the observed `qwen/qwen-2.5-coder-32b`, or declare an authorized intent to change the host default |
| M4 | Exit criterion 2, scope | Decide who owns enabling twelve currently-disabled models, and under which gate |

Not re-opened by this lint: D2, and A1–A8 other than the A7 Opus clause.

No implementation, provider call, credential inspection, host change, or Gate 2
dispatch is authorized while this re-open is open.
