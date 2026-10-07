# Scoped Gate 1 Amendment 06 — Pi-native session identities, CLI launch, and the open-weight provider lane

**Goal slug:** `pi-model-configuration`
**Raised:** 2026-10-07 by owner direction
**Status:** RATIFIED by owner direction 2026-10-07
**Scope:** supersedes Amendment 03's "no new Anthropic provider" clause and
reverses `foreman-line-boundary-routing` D9 (Fireworks removal). Amendment 02
M2–M4 and Amendment 01 A1–A8 remain in force except where N1 below is explicit.

## Evidence basis

Unlike Amendments 01–03, which reasoned from host-owner exports, this amendment
is grounded in a **first-party catalogue capture taken on the operator's own
machine**:

- Source: `~/.pi/agent/models-store.json`
- Captured: `2026-10-07T09:21:58Z` (provider `checkedAt` fields)
- Providers present: `fireworks`, `anthropic`, `openai`
- Credential readiness: `pi auth check --provider <p>` →
  `fireworks: ready`, `anthropic: ready`, `opencode: not_ready`,
  `opencode-go: not_ready`

This capture is the named source of truth for every `state: declared` value this
amendment authorizes. It establishes identity, context window, max output, cost,
and reasoning support.

**Updated 2026-10-07 by `pmc-live-availability-probe-2026-10-07.md`:** live
reachability was subsequently *measured* for all nine bindings, so `availability`
is now `declared: live-availability` sourced to that probe rather than held at
`AVAILABILITY_UNVERIFIED`. `quality` remains `unproven` — a reachability probe
is not a merit measurement. The probe also falsified this amendment's
data-classification premise; see N6.

## N1 — Pi-native session identities use DASHES

The canonical Foreman Line **session** identity is the Pi provider-local
spelling, `<provider>/<id>`, with Anthropic model ids spelled using **dashes**:

| Role tier | Pi session identity |
|---|---|
| coordinator | `anthropic/claude-opus-5-5` |
| builder / shaping | `anthropic/claude-sonnet-5-5` |
| reviewer / verifier | `anthropic/claude-fable-5-1` |

Each is confirmed present in the capture above. The superseded identities
`claude-opus-5`, `claude-sonnet-5`, and `claude-fable-5` remain real catalogue
entries but are retired from the Foreman roster (see N4).

**The OpenRouter namespace is unchanged.** `openrouter/anthropic/claude-opus-5.5`
keeps its dotted spelling: that slug is OpenRouter's identifier, recorded
verbatim, and is not the Line's to rename. Two namespaces coexist —

- Pi/first-party: dashes, e.g. `anthropic/claude-opus-5-5`
- OpenRouter: dots, e.g. `openrouter/anthropic/claude-opus-5.5`

— and Amendment 02's no-aliasing rule continues to forbid deriving one from the
other. Exact string equality within one namespace only.

## N2 — Sessions are launched by the `pi` CLI

A dispatched Foreman session is launched as a `pi` process:

```
pi --model anthropic/claude-opus-5-5
```

This supersedes the Claude-Code-only launch shape. The approved **route receipt
remains the authorizing artifact** (Amendment 01 A1): `--model` carries the
identity, it does not confer authority. The launch boundary still verifies the
receipt before inference and still fails closed when the receipt is missing,
stale, mismatched, or unsigned.

**Named residual — `MODEL_GATE_HOOK_COVERAGE`.** `hooks/model-gate.mjs` enforces
the roster through Claude Code's `SessionStart`/`PreToolUse` events. A session
launched as a bare `pi` subprocess fires neither, so the gate does not observe
it. Per owner direction the gate stays in place and is updated for the new
roster, but its coverage is now **Claude-Code-hosted sessions only**. Extending
enforcement to CLI-launched sessions is explicitly *not* closed by this
amendment and must not be claimed as covered.

## N3 — Open-weight / open-source provider lane

Foreman Line regains an open-weight lane. Two providers are named; they are **not
equivalent in evidence standing** and must not be treated as interchangeable.

### `fireworks` — ADMITTED

D9 of `foreman-line-boundary-routing` ("Removed the Fireworks routing and
worker-provider path entirely") is **reversed by owner direction**, together with
its standing acceptance gate requiring a zero-hit repository sweep. That gate is
retired, not failed; `items-7-gates-2026-09-27.md` row (g) is historical from
this date forward and must not be re-run as a live control.

Fireworks is credentialed (`ready`) and catalogued. Admitted open-weight ids
(all `reasoning: true`, costs USD per 1M tokens, from the capture):

| Model id | ctx | max out | in | out |
|---|---|---|---|---|
| `accounts/fireworks/models/gpt-oss-120b` | 131072 | 32768 | 0.15 | 0.6 |
| `accounts/fireworks/models/glm-5p3` | 1048573 | 262144 | 1.4 | 4.4 |
| `accounts/fireworks/models/glm-5p3-flash` | 1048573 | 131072 | 0.15 | 0.5 |
| `accounts/fireworks/models/kimi-k3` | 1048576 | 131072 | 3 | 15 |
| `accounts/fireworks/models/qwen3p8-max` | 262144 | 131072 | 2 | 6 |
| `accounts/fireworks/models/minimax-m3` | 512000 | 512000 | 0.3 | 1.2 |
| `accounts/fireworks/models/deepseek-v4p1-flash` | 1000000 | 384000 | 0.3 | 1.2 |
| `accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b` | 262144 | 262144 | 0.05 | 0.2 |

Note the Fireworks id grammar: a full `accounts/fireworks/models/<id>` path, with
`p` substituting for a decimal point (`glm-5p3` is GLM 5.3). This is a **third**
spelling convention and is recorded verbatim, exactly as OpenRouter's is. It is
never normalized toward the Pi or OpenRouter spellings.

Fireworks also exposes `accounts/fireworks/routers/*` aggregator entries. These
are **excluded**: a router re-dispatches to an unnamed upstream, which defeats
the executed-identity check that the receipt chain depends on.

Open-weight models are **data-class `public` only** under this amendment.
Internal/restricted eligibility requires the transport guarantees of invariant
(g) (`data_collection: deny`, `zdr: true`), which the capture does not establish
for Fireworks. Residual: `FIREWORKS_TRANSPORT_UNVERIFIED`.

### `opencode-go` — ADMITTED (updated 2026-10-07)

> This clause originally read *"NAMED BUT UNPROVEN"* with no bindings, because
> the provider was `not_ready` on the host. The owner configured it during the
> same session and it was probed; that original text is superseded here.

`opencode-go` is credentialed (`api_key`) and catalogued (29 models, captured
`2026-10-07T14:00:20Z`). Six bindings are admitted, all probed live, with routes
on L3/L4/L5 — never L1/L2, which are frontier-only. Full detail, including the
excluded models and the negative findings, is in
`pmc-live-availability-probe-2026-10-07.md` §5.

Three findings bear directly on this amendment:

- **The no-alias rule is confirmed, not relaxed (G-1).** `opencode-go/qwen3.8-flash`
  resolves; `opencode/qwen3.8-flash` does not; the `opencode` provider has no
  catalogue on this host at all. The long-standing `AC2A_ZERO_MATCH` was never a
  missing model — it was the right id looked for under the wrong provider.
  `opencode` and `opencode-go` remain distinct namespaces with no fallback
  between them.
- **Endpoint divergence is real (G-2).** Four ids are served at `/zen/go` rather
  than the registered `/zen/go/v1`. The validator refused `availability:
  declared` on `qwen3.8-flash` under H-EP, and that refusal was accepted rather
  than worked around — a live reply proves something answered, not that the
  registered endpoint did.
- **A privacy control is enforced (G-3).** `deepseek-v4-pro` is refused
  reproducibly: *"This Go model requires Global regions."* It is not bound.

`data_classes` is **`public`-only** under `OPENCODE_GO_TRANSPORT_UNVERIFIED`:
`opencode-go` is a gateway in front of third-party models, and invariant (g)
remains unmeasured for it.

## N4 — Retirements

Moved to the retired roster with reasons, so refusals explain themselves:

| Retired id | Reason |
|---|---|
| `claude-opus-5` | Superseded by `claude-opus-5-5`, which is both cheaper (4/20 vs 5/25) and carries the full thinking-level map. |
| `claude-sonnet-5` | Superseded by `claude-sonnet-5-5` at identical cost (2/10) with the full thinking-level map. |
| `claude-fable-5` | Superseded by `claude-fable-5-1`. |

## N6 — Data-classification standing of the two new providers

The catalogue capture establishes identity, context, cost, and reasoning
support. It establishes **nothing** about retention or training. Eligibility is
therefore assigned as follows, and the two providers are deliberately unequal:

### `anthropic` — PREMISE FALSIFIED BY MEASUREMENT, decision open

> **Superseded in part by `pmc-live-availability-probe-2026-10-07.md`.** This
> clause originally rested on an owner attestation that *"first-party commercial
> API traffic to Anthropic carries no gateway intermediary and is not trained
> on"*. That text is preserved in this quote as history and must not be read as
> current. Testing replaced half of it and falsified the other half.

What the probe **measured** (no longer attested):

- **No gateway intermediary** — confirmed. No proxy/CA environment is set, and
  the TLS chain to `api.anthropic.com` terminates at a publicly-trusted root
  with no locally-injected root and no re-signing hop (probe §2, T-1).
- **Live availability** — confirmed for all three Anthropic bindings (probe §3).

What the probe **falsified** (finding P-1):

- The attestation assumed **commercial API** terms. `pi auth check --provider
  anthropic --json` reports **`authType: oauth`** — a subscription login, a
  different terms regime. The premise does not describe what this host sends.

What **no probe can establish**: retention, training use, and ZDR are
contractual facts, not network facts. Invariant (g)'s `data_collection: deny` /
`zdr: true` therefore remain unverified for every provider in this contract.

**Status: the `anthropic` `data_classes` entries still declare `[public,
internal, restricted]`, and that declaration is now explicitly marked
PREMISE-FALSIFIED in `routing-policy.yaml`.** It must not be relied on for
non-public work until the owner picks one:

1. **Configure an API key** for `anthropic`, re-run probe §1, and re-attest
   against the auth mode actually in use; or
2. **Narrow the `anthropic` bindings to `public`** — the fail-closed reading,
   which makes the L1/L2 anthropic routes undispatchable for internal and
   restricted parcels.

The general lesson is recorded deliberately: an attestation was standing where a
measurement was available, and the measurement disagreed with it.

### `fireworks` — `public` only

Open-weight models are served by an inference host that is not the model's
author. Invariant (g) requires `data_collection: deny` and `zdr: true` for
non-public classes, and nothing in the capture establishes either. Fireworks
bindings are `public`-only under residual `FIREWORKS_TRANSPORT_UNVERIFIED`.

This is the practical boundary of the open-weight lane: it is admitted for
boilerplate, build-fix loops, and public analysis, and it is refused for
internal or restricted parcels until transport evidence exists.

## N5 — Fallback standing for `claude-fable-5-1`

The capture shows `claude-fable-5` carried a provider-declared
`compat.allowedFallbackModels` list; **`claude-fable-5-1` carries none**. Because
the reviewer/verifier tier is frontier and the PMC-P1 contract requires exactly
one approved fallback of comparable or higher suitability per execution
candidate, that fallback must be declared explicitly in `lane_routes` and may not
be inherited from provider metadata. No provider-side default exists to fall back
on, and none is to be invented.

## Unchanged controls

Amendment 01 A1–A8 (route receipt authorizes launch; A6 evidence envelopes),
Amendment 02 M2 (lane L6 refused/disabled) and M3–M4, the no-aliasing rule, the
data-classification gating order, human Gates 1–3, and the prohibition on
sessions writing Pi configuration all remain in force. This amendment authorizes
no spend, no merge, no release, and no default-route activation.
