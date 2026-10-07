# Live availability and transport probe — 2026-10-07

**Goal slug:** `pi-model-configuration`
**Run by:** owner direction, 2026-10-07, on the operator's own host
**Purpose:** replace Amendment 06's unmeasured claims with measurements, and
record what measurement *cannot* settle.

This record exists because an attestation was being used where a test was
available. Everything below is an observation from this host on this date. It
establishes **live availability** and **transport shape**. It does **not**
establish retention or training policy — see §4.

---

## 1. Credential readiness (`pi auth check --provider <p> --json`)

Run without `--credentials`; no secret was read or printed.

| Provider | status | authType / reason |
|---|---|---|
| `anthropic` | `ready` | **`oauth`** |
| `fireworks` | `ready` | `api_key` |
| `opencode` | `not_ready` → **`ready` (`api_key`) after the owner configured it; see §6** | |
| `opencode-go` | `not_ready` → **`ready` (`api_key`) after the owner configured it mid-session; see §5** | |
| `openrouter` | `not_ready` | `credentials_not_configured` |

**Finding P-1 (material).** The `anthropic` credential is **OAuth**, not an API
key. Amendment 06 N6's attestation was written on the premise of "first-party
commercial API traffic". That premise is **not what this host is configured to
send**. OAuth is a subscription login and a different terms regime from a
commercial API key. The attestation is therefore not merely unverified — its
stated basis is falsified. See §4.

**Finding P-2.** `openrouter` is `not_ready` on this host. The pre-existing
`openrouter/...` bindings — the majority of the shipped contract — are therefore
**not executable here** either. This is recorded as an observation about this
host, not a claim about the bindings' correctness.

---

## 2. Transport shape (`anthropic`)

- Proxy/CA environment: **none set** (`HTTP(S)_PROXY`, `SSL_CERT_*`,
  `NODE_EXTRA_CA_CERTS` all absent). No configured intermediary.
- DNS: `api.anthropic.com` → `2607:6bc0::10`.
- TLS chain, `openssl s_client`:
  - `0 s:CN=api.anthropic.com`
  - `1 s:C=US, O=Google Trust Services, CN=WE1`
  - `2 s:C=US, O=Google Trust Services LLC, CN=GTS Root R4`
  - `Verify return code: 0 (ok)`
- Leaf validity: `Sep 21 2026` – `Dec 20 2026`.

**Finding T-1.** The chain terminates at a publicly-trusted CA with no
locally-injected root and no re-signing intermediary. The "no gateway
intermediary" half of N6 is now **measured**, not attested. (Google Trust
Services is Anthropic's public CA here; it is not a proxy.)

---

## 3. Live availability

Probe: `pi --model <id> --no-session -p "Reply with exactly the word PONG and
nothing else."` — a trivial, non-sensitive prompt. All returned `PONG`.

| Binding | result |
|---|---|
| `anthropic/claude-opus-5-5` | **live** |
| `anthropic/claude-sonnet-5-5` | **live** |
| `anthropic/claude-fable-5-1` | **live** |
| `fireworks/accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b` | **live** |
| `fireworks/accounts/fireworks/models/glm-5p3-flash` | **live** |
| `fireworks/accounts/fireworks/models/qwen3p8-max` | **live** |
| `fireworks/accounts/fireworks/models/glm-5p3` | **live** |
| `fireworks/accounts/fireworks/models/kimi-k3` | **live** |
| `fireworks/accounts/fireworks/models/gpt-oss-120b` | **live** |

All nine Amendment 06 bindings move `availability` from
`{ state: unproven, residual: AVAILABILITY_UNVERIFIED }` to
`{ state: declared, value: live-availability, source: <this record> }`.

`quality` stays `{ state: unproven, residual: QUALITY_UNRECORDED }`. A model
answering `PONG` is evidence of reachability, not of merit — this probe says
nothing about R7 and must not be read as a quality score.

### Negative controls (the refusals are real, not assumed)

- **`opencode-go/claude-opus-5-5`** → refuses, prompting for login
  (`credentials_not_configured`). The `OPENCODE_GO_CATALOGUE_UNFETCHED` residual
  is a measured fact, not a guess.
- **`anthropic/claude-opus-5-5[1m]`** → pi warns `Model "...[1m]" not found for
  provider "anthropic"`, then the provider returns
  `404 not_found_error: model: claude-opus-5-5[1m]`. The D69(b) `[1m]` rule the
  model gate enforces is **corroborated by the provider itself**: the id does not
  exist. The gate is a fast local refusal for something that would fail anyway.

---

## 4. What this probe CANNOT establish — and the open decision

Retention and training are **contractual facts, not network facts**. No probe
from this host can observe them. Specifically unestablished:

- whether inputs are retained, and for how long;
- whether inputs are used for training;
- whether ZDR applies.

So invariant (g)'s requirements (`data_collection: deny`, `zdr: true`) remain
**unverified for every provider in this contract**, including `anthropic`.

Finding P-1 makes this sharper rather than softer. The N6 attestation justified
`internal`/`restricted` eligibility on commercial-API terms, and this host sends
OAuth. **The declared eligibility currently rests on a premise measurement has
contradicted.** Two honest resolutions, owner's choice:

1. **Configure an API key** for `anthropic` (commercial terms), re-run §1, and
   re-attest N6 against the auth mode actually in use; or
2. **Narrow `anthropic` bindings to `public`** until (1) is done — which makes
   the L1/L2 anthropic routes undispatchable for internal/restricted parcels, the
   fail-closed reading.

Until one is chosen, N6 is marked **PREMISE-FALSIFIED** and the `anthropic`
`data_classes` entries carry that pointer rather than a clean attestation.

`fireworks` is unaffected: it was already `public`-only under
`FIREWORKS_TRANSPORT_UNVERIFIED`, and this probe does not widen it.

---

## 5. `opencode-go` — credentialed mid-session, catalogue captured

The owner configured `opencode-go` during this session. Re-probed:

- `pi auth check --provider opencode-go --json` → `{"status":"ready","authType":"api_key"}`
- `pi update` populated the catalogue: **29 models**, captured
  `2026-10-07T14:00:20Z`, base `https://opencode.ai/zen/go/v1`.

`OPENCODE_GO_CATALOGUE_UNFETCHED` is **resolved on this host**. The residual
stays in the vocabulary because it remains the correct refusal on any host that
has not configured the provider.

### G-1 (major) — the AC2a zero-match is CONFIRMED, and `opencode` is absent entirely

| Probe | Result |
|---|---|
| `pi --model opencode-go/qwen3.8-flash` | **PONG** |
| `pi --model opencode/qwen3.8-flash` | refuses — provider not configured |
| `opencode` key in `models-store.json` | **absent** |

This is the long-standing `AC2A_ZERO_MATCH` for `opencode/qwen3.8-flash`
reproduced from the other direction: the id is real and reachable, but **only in
the `opencode-go` namespace**. It confirms the no-alias rule rather than
relaxing it — the two providers are not interchangeable, and the id was never
missing, only looked for under the wrong provider.

Further: the `opencode` provider has **no catalogue entry at all** on this host,
so *every* `opencode/...` binding in the contract is unresolvable here. Those
bindings and their L1–L5 routes are **left exactly as they are** — this is a fact
about one host's configuration, not about the contract's correctness.

### G-2 — endpoint divergence is real and measured

Most `opencode-go` records sit at `https://opencode.ai/zen/go/v1`, but four
(`qwen3.8-flash`, `qwen3.8-max`, `qwen3.7-plus`, `minimax-m3`) are served at
`https://opencode.ai/zen/go`. The registered provider endpoint is `/zen/go/v1`.

For `opencode-go/qwen3.8-flash` the binding therefore records
`alignment: divergent`, and **the validator refused `availability: declared`**
with `ENDPOINT_DIVERGENCE_REFUSED` (H-EP). That refusal was accepted rather than
worked around: the probe proves *something* answered, not that the **registered**
endpoint did. Its availability stays `unproven/AVAILABILITY_UNVERIFIED` even
though it returned `PONG`.

### G-3 — `deepseek-v4-pro` is refused by a privacy control, reproducibly

```
400 {"type":"server_error","message":"Upstream request failed: This Go model
requires Global regions. Select Global in your workspace's Privacy settings to
use it."}
```

Reproduced on retry — a configured data-residency restriction refusing, not an
outage. `deepseek-v4-pro` is therefore **not bound** under `opencode-go`.
Binding it would mean either a route that always fails, or loosening a region
restriction; both are owner decisions, not registry edits. Note this cuts the
other way on data handling: the workspace is currently in a *more* restrictive
region posture than Global.

### G-4 — admitted bindings (all probed live)

| Binding | $in/$out | result |
|---|---|---|
| `opencode-go/qwen3.8-flash` | 0.15 / 0.47 | live (availability withheld per G-2) |
| `opencode-go/glm-5.3-flash` | 0.15 / 0.5 | live |
| `opencode-go/glm-5.3` | 1.4 / 4.4 | live |
| `opencode-go/grok-4.6` | 2 / 6 | live |
| `opencode-go/kimi-k3` | 3 / 15 | live |
| `opencode-go/gpt-5.6-luna` | 0.2 / 1.2 | live |

Routes added: L3 (`grok-4.6` → `kimi-k3`), L4 (`glm-5.3` → `grok-4.6`),
L5 (`qwen3.8-flash` → `glm-5.3-flash`). No L1/L2: frontier-only.

**Excluded deliberately:** `muse-spark-1.2/1.3-contributor` (contributor tier —
the policy's standing position is that contributor models may train on submitted
data) and `longcat-2.5-preview-free` ($0/$0 free tier — the same `:free`
reasoning the policy already applies: quota exhaustion fails the task outright).

### G-5 — data classification

`opencode-go` bindings are **`public`-only**, residual
`OPENCODE_GO_TRANSPORT_UNVERIFIED`. It is a gateway in front of third-party
models; its catalogue establishes identity, cost, context, and modality, but
invariant (g)'s `data_collection: deny` / `zdr: true` remain unmeasured. G-3
shows a region control exists and is enforced, which is encouraging but is not
the same fact.


---

## 6. `opencode` — configured, and it overturns two prior findings

The owner configured what they described as "opencode-zen". **`opencode-zen` is
not a pi provider id** (`pi auth check --provider opencode-zen` →
`provider_not_found`); the credential registered under the provider key
**`opencode`**. OpenCode Zen *is* `opencode` in pi's vocabulary. Catalogue:
**84 models**, captured `2026-10-07T14:19:18Z`.

### O-1 (major) — `AC2A_ZERO_MATCH` is contested by measurement

`qwen3.8-flash` **is present under provider `opencode`**, and
`pi --model opencode/qwen3.8-flash` answers `PONG`.

This retracts §5's finding G-1, which concluded the id lived only under
`opencode-go`. G-1 was measured on a host where `opencode` was **not configured
at all** — absence of a provider was misread as absence of the id. Recorded as a
correction rather than edited away: the earlier reading was wrong, and the
reason it was wrong matters.

The no-alias rule is untouched either way. The id was found under `opencode`
itself; nothing was resolved by aliasing. Note the two namespaces share **18
exact ids**, confirming the RCM-P0 drift correction that "disjoint" was false —
which is precisely why aliasing them would be unsafe.

**Status: the hold is RETAINED, not lifted.** Lifting it would convert a
fail-closed L5 stop into a live route and supersede ratified Amendment 04 D-b1.
Two contract tests pin the current behaviour (`fallback-contract.test.ts`
expects `identity.state === 'zero-match'`; `pi-resolver.test.ts` expects the L5
stop receipt to name `AC2A_ZERO_MATCH`), which is evidence the hold is
load-bearing rather than decorative. **Owner disposition required.**

### O-2 — `opencode/gpt-5.6-sol` is access-disabled

```
403 {"type":"server_error","message":"Upstream request failed: Model access is disabled"}
```

Reproduced. This matters more than a single dead id: `gpt-5.6-sol` is the
**preferred verifier** in `selection_order.frontier` and the L3 opencode
primary. On this host it is unusable under `opencode`, and its OpenRouter
binding is unusable too (`openrouter` is `not_ready`, §1 P-2). The declared
verifier route is currently unexecutable here by either path.

### O-3 — the F5 endpoint mismatch is confirmed and still encoded

The contract records `opencode` bindings as `registered:
https://opencode.ai/zen/go/v1` — the **Go** endpoint — transcribed from the F5
host snapshot. The live `opencode` catalogue serves at `https://opencode.ai/zen`
and `https://opencode.ai/zen/v1`. Neither matches the registered value, which is
the original F5 finding ("the configured pairing matches neither") reproduced
against a current catalogue.

These `registered` values were **not rewritten**. `registered` means "what the
host registers", and this probe measures the catalogue, not a settings
registration; pi's `settings.json` carries no provider block to read. Correcting
them needs a settings-projection source, not an inference from this capture.

### O-4 — live probes under `opencode`

| Binding | result |
|---|---|
| `opencode/qwen3.8-flash` | live (hold retained per O-1) |
| `opencode/glm-5.3-flash` | live |
| `opencode/claude-opus-5-5` | live |
| `opencode/gpt-6-astra` | live |
| `opencode/claude-sonnet-5` | live |
| `opencode/gpt-5.6-terra` | live |
| `opencode/deepseek-v4-pro` | live |
| `opencode/gpt-5.6-sol` | **403 access disabled** (O-2) |

No `opencode` binding's `availability` was promoted in this pass. Every one of
these ids is served at `/zen` or `/zen/v1` against a registered `/zen/go/v1`
(O-3), so H-EP withholds attestation exactly as it did for
`opencode-go/qwen3.8-flash` in §5. The probes are recorded as evidence; the
endpoint question gates the attestation.

---

## 7. `opencode` follow-up — Amendment 07 bindings probed, endpoint question RESOLVED for the OpenAI-API family

**Run:** 2026-10-07T16:0xZ, owner direction ("try opencode now"), same host.

### 7.1 — auth and catalogue state

- `pi auth check --provider opencode --json` → `{"status":"ready","provider":"opencode","authType":"api_key"}`
- `~/.pi/agent/models-store.json` now carries an `opencode` key: **84 models**,
  `checkedAt` **2026-10-07T14:19:18Z**. G-1's "`opencode` key absent" is
  superseded on this host. All four Amendment-07 legs are present in the
  catalogue: `gpt-6.1-sol`, `gpt-6-luna`, `claude-sonnet-5-5`, `claude-opus-5-5`.

### 7.2 — the O-3 endpoint question is answered by first-party code

O-3 withheld the `registered` correction for want of a settings-projection
source. Two facts it did not have:

1. `pi`'s `settings.json` carries **no provider block** (O-3's own finding), so
   the `opencode` provider on this host comes from the installed extension
   **`pi-opencode-direct`**, whose source registers it at
   `BASE_URL = "https://opencode.ai/zen/v1"`
   (`~/.pi/agent/npm/node_modules/pi-opencode-direct/src/provider.ts:16,617`).
2. The models-store capture corroborates per-model: OpenAI-API models carry
   `baseUrl: https://opencode.ai/zen/v1`; Anthropic-API models carry
   `baseUrl: https://opencode.ai/zen` (a per-model override).

The F5-transcribed `registered: https://opencode.ai/zen/go/v1` on `opencode`
bindings is therefore **stale** — it describes the Go provider's endpoint, not
this host's `opencode` registration. Amendment 07 bindings record
`registered: https://opencode.ai/zen/v1` sourced to the extension source. The
other pre-existing `opencode` bindings are deliberately **not** rewritten here;
they await the same re-baseline as a batch (owner decision).

### 7.3 — live probes (same trivial PONG method as §3)

| Binding | result | endpoint alignment | availability disposition |
|---|---|---|---|
| `opencode/gpt-6.1-sol` | **PONG** | aligned (`/zen/v1` == `/zen/v1`) | **declared: live-availability** |
| `opencode/gpt-6-luna` | **PONG** | aligned | **declared: live-availability** |
| `opencode/claude-sonnet-5-5` | **PONG** | **divergent** (registered `/zen/v1`, served `/zen`) | stays `unproven/AVAILABILITY_UNVERIFIED` (H-EP, exactly as §5 G-2) |
| `opencode/claude-opus-5-5` | PONG (§6 O-4) | **divergent** | stays `unproven/AVAILABILITY_UNVERIFIED` (H-EP) |

H-EP is applied, not worked around: for the Anthropic-API pair the probe proves
*something* answered at the catalogue endpoint, not that the registered one
did. Resolving that divergence is a provider-side question (per-model override
is the catalogue's own data), recorded here, not normalized away.

### 7.4 — what the on-host catalogue establishes (Amendment 06 precedent: strongest identity evidence)

| id | contextWindow | maxTokens | cost (in/out) | input | thinkingLevelMap keys |
|---|---|---|---|---|---|
| `gpt-6.1-sol` | 1,050,000 | 128,000 | $2 / $10 | text, image | off, minimal, low, medium, high, xhigh, max |
| `gpt-6-luna` | 1,050,000 | 128,000 | $0.10 / $0.50 | text, image | off, minimal, low, medium, high, xhigh, max |
| `claude-sonnet-5-5` | 1,000,000 | 128,000 | $2 / $10 | text, image | xhigh, max |
| `claude-opus-5-5` | 1,000,000 | 128,000 | $4 / $20 | text, image | xhigh, max |

Costs match the models.dev public capture (amendment-07 evidence) exactly —
two independent sources agree. `thinking_levels` follow the Amendment 06
convention: the map's keys, including null-valued ones.

### 7.5 — still unestablished

- **`data_classes` stays `DATA_CLASS_UNKNOWN` on every `opencode` binding.**
  §4's reasoning is untouched: retention and training are contractual facts,
  and no probe or catalogue from this host can observe them. Dispatch
  eligibility under A5.2 remains blocked until Zen's terms are evidenced.
- `capabilities` stay `unverified`; `quality` stays `QUALITY_UNRECORDED`
  (a PONG is not a merit measurement).
- O-2 stands: `opencode/gpt-5.6-sol` is **403 access-disabled** on this host —
  relevant to the L3 `opencode` route, whose primary is that id.

### 7.6 — G-3 re-probe after owner's privacy-settings change (2026-10-07T16:4xZ)

The owner reported the workspace privacy/region issue resolved. Re-probed:

| Binding | result | vs. earlier today |
|---|---|---|
| `opencode-go/deepseek-v4-pro` | **still 400** — identical "This Go model requires Global regions" message, reproduced on retry | unchanged: G-3 stands |
| `opencode/deepseek-v4-pro` | **403 "Model access is disabled"** | **regressed** — was live at §6 O-4 |
| `fireworks/accounts/fireworks/models/glm-5p3` (control) | PONG | unchanged |

Reading: whatever setting changed did NOT lift the Go-tier region restriction,
and the `opencode` (Zen) workspace's access posture for `deepseek-v4-pro`
moved from live to disabled — the same refusal class as O-2's
`opencode/gpt-5.6-sol` 403. Fireworks first-party is unaffected.

Operational consequence (host fact, not contract defect): the L3 and L4
`opencode` route primaries — `gpt-5.6-sol` (O-2) and `deepseek-v4-pro`
(this section) — both refuse on this host as of 16:4xZ. No binding or route
was changed in response; per G-3, loosening restrictions or re-routing are
owner decisions, never registry edits.

### 7.7 — owner re-enabled `deepseek-v4-pro` and added `deepseek-v4.1-flash` (2026-10-07T16:5xZ)

Owner direction: both ids re-added to the enabled opencode models. Probed:

| Binding | result | note |
|---|---|---|
| `opencode/deepseek-v4-pro` | **PONG** | §7.6's 403 regression is resolved; L4 `opencode` primary is live again |
| `opencode/deepseek-v4.1-flash` | **PONG** | new to the roster; catalogue-established (store capture 14:19:18Z) |

Both carry per-model `baseUrl: https://opencode.ai/zen/v1` — **aligned** with
the §7.2-registered endpoint — so H-EP does not withhold attestation and
`availability: declared live-availability` is recorded for both. Catalogue
facts (store capture):

| id | contextWindow | maxTokens | cost (in/out) | input | thinkingLevelMap keys |
|---|---|---|---|---|---|
| `deepseek-v4-pro` | 1,000,000 | 384,000 | $1.74 / $3.84 | text | off, minimal, low, medium, high, xhigh, max |
| `deepseek-v4.1-flash` | 1,000,000 | 384,000 | $0.30 / $1.20 | text, image | off, minimal, low, medium, high, xhigh, max |

The v4-pro row agrees with the binding's pre-existing AC5 transcription — two
independent sources. G-3 is unaffected: `opencode-go/deepseek-v4-pro` remains
400 region-refused; no `opencode-go` binding for it is admitted. The L3
`opencode` primary (`gpt-5.6-sol`, O-2) remains 403 access-disabled.

### 7.8 — G-3 RESOLVED: Global regions enabled (2026-10-07T17:0xZ)

Owner direction: "global is now enabled." Re-probed
`opencode-go/deepseek-v4-pro` → **PONG**. The §5 G-3 refusal
(400 Global-regions) no longer reproduces; the owner decision G-3 said binding
was gated on has been taken. `opencode-go/deepseek-v4-pro` is admitted:

- Catalogue (opencode-go capture, `checkedAt` 2026-10-07T14:00:20Z):
  `baseUrl https://opencode.ai/zen/go/v1` — **aligned** with the registered Go
  endpoint — contextWindow 1,000,000, maxTokens 384,000, cost **$0.66/$1.98**
  (notably below the Zen `opencode` binding's $1.74/$3.84), input `[text]`,
  thinkingLevelMap keys `minimal, low, medium, high, max`.
- Availability `declared: live-availability` (PONG, aligned endpoint).
- Data classes stay `public`-only under `OPENCODE_GO_TRANSPORT_UNVERIFIED`
  (G-5 unchanged — enabling a region control is not a retention/ZDR
  measurement).
- Also present in the Go catalogue, noted for the record:
  `deepseek-v4.1-flash` at $0.15/$0.60 (half the Zen price). Not bound — the
  owner enabled that id on the `opencode` workspace, and a Go binding would be
  a separate decision.

### 7.9 — `opencode-go/deepseek-v4.1-flash` probe + Zen privacy terms captured (2026-10-07T17:2xZ)

- `opencode-go/deepseek-v4.1-flash` → **PONG** (owner-enabled; Go catalogue
  $0.15/$0.60, 1M ctx, 384k max output, text+image, baseUrl `/zen/go/v1` —
  aligned). Admitted under Amendment 08, public-only per G-5.
- **Zen privacy terms captured** (owner asked where Zen's terms could be
  evidenced): `https://opencode.ai/docs/zen/` §Privacy, saved at
  `evidence/zen-docs-20261007.html` (109,235 bytes, sha256
  `e67f3c27e430a72ecb95dc7dacb05bbf1ade082bcb34e2bcdc830d7e064b9477`).
  Key text: "All our models are hosted in the US and EU. Our providers follow
  a zero-retention policy and do not use your data for model training, with
  the following exceptions" — the exceptions being free/stealth models
  (Big Pickle, Exo Free, Fledge Alpha Free, MiMo-V2.6-Flash Free,
  Ling 3.0 Flash Fin Free), the NVIDIA free endpoints (logged), Muse Spark
  1.3 Contributor Free (trains), and 30-day retention for requests served by
  **OpenAI APIs** and **Anthropic APIs** per those vendors' data policies.

  What this supports, and what it does not: a dated first-party statement of
  zero-retention/no-training is exactly the evidence class `DATA_CLASS_UNKNOWN`
  was waiting on, and it is sufficient to declare `data_classes: [public]` on
  the Zen (`opencode`) bindings. For `internal`/`restricted`, the 30-day
  OpenAI/Anthropic upstream retention is NOT zero-retention, and invariant (g)
  is stated in terms of gateway controls (`data_collection: deny`, `zdr: true`)
  which Zen does not expose per-request — so widening beyond `public` is an
  owner-attestation decision (Amendment 06 N6 pattern), not a transcription.
  Amendment 08 records the capture; the data-classes change itself is left
  for owner ratification.
