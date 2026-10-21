# Builder Kickstarter — TEMPLATE

> Reusable dispatch shell for a Foreman Line **builder session**. Copy this
> file, fill every `<PLACEHOLDER>`, and dispatch. This template describes the
> builder **role**, not any one parcel.

**Goal:** `<GOAL-SLUG>` · **Parcel:** `<PARCEL-ID>`
**Dispatched:** `<DATE>` · **risk:** `<risk-level>` · **routing_class:** `<routing-class>`

**Dispatched Pi session** — approved route receipt `<PATH-TO-ROUTE-RECEIPT>`
(not asserted — **minted** by the resolver): route `<PROVIDER/MODEL-ROUTE>` →
declared fallback `<FALLBACK-ROUTE>`, thinking level `<LEVEL>`, role `<ROLE>`,
routing class `<CLASS>`, data class `<DATA-CLASS>`, budget `<BUDGET>`, task
envelope `<PATH>`, evidence requirements `<LIST>`. A Step 0 restatement that
does not name the approved route (provider/model route and its declared
fallback), with its version, is a dispatch failure — say so and STOP. The
dispatch is authorized only by that approved route receipt: the launch boundary
verifies it before any inference and fails closed when it is missing, stale,
mismatched against the requested lane, or unsigned by the resolver, and the
route, fallback chain, thinking level, role, routing class, data class, budget,
task envelope, and evidence requirements are fixed before inference begins. Pi's
interactive `defaultProvider`/`defaultModel` default is a recovery-friendly
convenience outside Foreman work and is never a Foreman-dispatched route.
Automatic routing is an execution convenience, not a new approval or
coordination authority.

**Fallback and model IDs:** Every execution candidate declares **exactly one approved fallback of comparable or higher suitability**, carried as explicit
fallback metadata in the `provider-neutral-fallback-contract` representation
(`lane_routes` each carry exactly one typed fallback). A fallback is used only
after preflight establishes that it is enabled, available, eligible for the data
class, compatible with required tools/structured output, and within the
remaining budget. In-provider OpenRouter failover may use Pi's per-model
`openRouterRouting` controls; cross-provider failover is a new, recorded attempt
started from a durable handoff — it never silently continues a coordinator,
review, approval, merge, release, or security decision mid-turn. A degraded or
unavailable primary routes only to its declared fallback; if both fail, the
parcel stops and reports. Fallbacks are declared in the approved route and
recorded in the route receipt — never invented in a template, never silently
substituted, never credential-bearing.

**Model IDs and how the session is launched.** A dispatched session is started
by the Pi CLI, naming the approved route's identity:

```
pi --model <provider>/<model-id>        # e.g. pi --model anthropic/claude-opus-5-5
```

`--model` carries the *identity*; it confers no authority. The approved route
receipt remains the authorizing artifact, and the launch boundary still verifies
it before inference. A bare `pi` with no approved route is a direct invocation
and is not a Foreman execution path.

Model IDs are first-class in **four** provider spellings, each recorded verbatim
and never normalized toward another — exact string equality within one namespace
only (Amendment 06 N1/N3):

| Provider | Spelling | Example |
|---|---|---|
| `anthropic` (first-party) | **dashes** | `anthropic/claude-opus-5-5` |
| `opencode` / `opencode-go` | dashes, no vendor | `opencode/<id>` |
| `openrouter` | **dots**, vendor-prefixed | `openrouter/anthropic/claude-opus-5.5` |
| `fireworks` (open-weight) | full path, `p` for a dot | `fireworks/accounts/fireworks/models/glm-5p3` |

An OpenRouter slug is one spelling of a model ID, not the model vocabulary.
`anthropic/claude-opus-5-5` and `openrouter/anthropic/claude-opus-5.5` are two
namespaces describing two routes, not one id with two spellings — never derive
or alias one from the other. Provider-neutral task/result envelopes are
preserved throughout.

**Open-weight lane.** `fireworks` models are eligible for **`public` data only**
(residual `FIREWORKS_TRANSPORT_UNVERIFIED`): the invariant-(g) transport
guarantees are unmeasured for an inference host that is not the model's author.
An internal or restricted parcel never routes there. `opencode-go` is a declared
provider with no bindings until its catalogue is captured
(`OPENCODE_GO_CATALOGUE_UNFETCHED`) — it is never aliased to `opencode`.

Standing constraints apply — `docs/kickstarters/STANDING-CONSTRAINTS.md`.
`<NAME ANY RULES THIS PARCEL BOTH OBEYS AND SPECIFICALLY EXERCISES, IF ANY.>`

## Your working root

Everything you touch is inside the worktree at **`<PATH-TO-WORKTREE>`**, branch
`<BRANCH-NAME>`. **Do not read or write anything under `<PATH-TO-MAIN-CHECKOUT>`**
— that is the coordinator's checkout.

- `<ENVIRONMENT NOTES — OS, shell, toolchain and minimum version, and any known
  shell-resolution traps in THIS repo (e.g. a version manager shadowing the
  system toolchain in one shell but not another). The dispatching coordinator
  fills this from their own environment; do not carry another repo's
  environment forward as a default, and do not leave it blank.>`
- If the packages you touch are not a single workspace, install dependencies
  **per package** before running that package's tests — a relative
  cross-package import can resolve a bare dependency from a sibling package's
  own installed dependencies, silently masking a missing dependency of your
  own.

## Your contract

**`<PATH-TO-SPEC>`**, `status: active`. It has passed coordinator lint. Its
Constraints and Acceptance Criteria are the contract and are **not yours to
renegotiate** — if you believe one is wrong, stop and flag it rather than
reinterpreting. Read it in full before touching anything.
`<NAME ANY PRIOR SPEC(S) WHOSE RULINGS THIS PARCEL APPLIES VERBATIM, AND WHICH
OF THEIR RULINGS APPLY.>`

A genuine spec *gap* is a flag to raise at Step 0 or the moment you hit it; the
coordinator rules and, if needed, ratifies an amendment before further work.
Silently designing around a gap is the failure this gate exists to prevent.

For Pantheon under a verified, active OM-PAN-001 grant, apply `docs/standing-mandates/OM-PAN-001.md`; this exception does not apply to other goals or create Runtime authority. Step 0 waits for the coordinator's evidence comparison; an exact match requires no human confirmation. Any later rework uses the same rule. The native bootstrap grant is explicitly separate from a Runtime/resolver receipt; do not fabricate one.

## Step 0 — restate and STOP (mandatory gate)

Before writing any code or artifact:

1. **State the approved route you are running on and confirm it matches the
   approved route receipt, or the exact actual OM-PAN-001 bounded native dispatch when operating before cutover. Native dispatch is not a Runtime receipt. A mismatch holds this worker.**
2. Restate the deliverables in your own words, and state what is explicitly
   **out of scope** per the spec.
3. **Inventory the current state on disk against the spec** — what exists,
   what does not, and any counts (test counts, rule counts, line counts) the
   spec asks you to carry forward. State those counts explicitly; they are
   your tripwire baseline.
4. Name your implementation order and any item you believe is ambiguous or
   unachievable as written.
5. List clarifying questions in small numbered batches, each with a
   recommended default.
6. **STOP and wait** for the coordinator's rulings. Do not begin implementation
   in the same turn.

## Hard boundaries — crossing one is a loop-stop, not a judgment call

`<ENUMERATE THIS PARCEL'S FROZEN PATHS, OUT-OF-SCOPE PACKAGES, AND ANY DECISION
THAT MUST NEVER BE RE-DECIDED BY THE BUILDER (e.g. a locked schema, a package
owned by a sibling parcel, a policy invariant the parcel must not weaken). If
crossing a boundary seems required to satisfy an AC, STOP and report — do not
work around it.>`

## The traps this parcel is built out of

`<NAME EVERY KNOWN FAILURE SHAPE THIS PARCEL'S SPEC OR PRIOR PARCELS SURFACED
— e.g. a structural guarantee that must hold at every depth, a check whose
coverage is a literal set rather than a class, a verification command that
must be re-run rather than trusted from a prior session. Each trap names the
concrete command or inspection that catches it, not just the risk.>`

## Evidence discipline

- **Report only command results you actually ran.** Paste the literal
  invocation and its literal output. Where you have reasoning rather than a
  measured result, write **"reasoning, not verified"** and name what would
  verify it — that is a finished answer, not a weakness (Standing Constraint
  #22).
- **Read counts with `grep -c`, invoking the binary by its explicit absolute
  path, never a bare `grep` and never `grep -o | wc -l`** (Standing Constraint
  #24). A bare `grep` can silently resolve to a different binary depending on
  shell configuration, and the piped form has separately returned spurious
  counts — treat every count as suspect until you have verified which tool
  you actually ran. If you cite a count, cite the exact command that produced
  it, and where a count is load-bearing evidence, pair it with a mutation
  that proves the check binds (e.g. break the thing being counted and watch
  the count move).
- **Passing is not evidence.** Every accept behavior needs its reject twin
  demonstrated failing. Do not ship a guard you have not watched bite.
- Run every validation command the spec names before claiming done, and report
  its exit code — never read an exit code through a truncating pipeline.

## Definition of done

- Every Acceptance Criterion satisfied with pasted evidence.
- `<NAME ANY ENUMERATION THIS PARCEL MUST RECONCILE IN BOTH DIRECTIONS AGAINST
  A LIVE FILE OR DISK STATE.>`
- `<NAME ANY LIVE FILE(S) THAT MUST REMAIN BYTE-UNCHANGED, PROVEN WITH `git
  diff`.>`
- `git status` clean apart from your intended files.

## STOP boundary

Commit to `<BRANCH-NAME>`. **Do not open a PR. Do not merge.** Gate 3 belongs to the coordinator only where verified standing authority delegates it; otherwise it remains human. The builder receives no merge authority. Report back with your evidence; the coordinator then
dispatches adversarial review.

## Completion report

End with: the AC-by-AC evidence map, every command you ran with its exit code,
anything you could not complete and why, any flag you raised, and the
judgement calls a reviewer should look at hardest. An adversarial review
follows — it will re-run your checks and probe with hostile input, so do not
overstate.

For Pantheon only, actual EX11 in the [standing mandate](../../docs/standing-mandates/OM-PAN-001.md) governs all current obligations; other goals retain their gates. Keep $75 total/$65 bootstrap/$20.25 P00/$25 each P01–P05/B1–B3/$6/request; 29 inclusive bootstrap/120 goal claims. Retain both holds: older $5 counts once against total outside bootstrap/unit sums; $5.34 stays in bootstrap. Preserve mandatory unfinished claim/money floors, including $6 sole validation until a narrower exact profile is independently verified. Billed cost remains null until genuine reconciliation; allowances promise neither every recovery nor exact invoices.

B1 review revision3 is final: no revision4; B2/B3 retain0–2. Inherited timeRevision2 balances are P01 2111/P02 1786 seconds, each at most two remaining segments against the same2700-second/three-segment parent and original135-minute cap; actual ledgers govern later balances. Only two inherited independent source-check windows remain across B1, at most60 minutes each. Retain EX9 operational counters (three60-minute windows per purpose plus actual attempt/source-revision/proposal identity), original12-model-call/eight-session limits (four sessions consumed), two semantic attempts per seat/subject, one paid request globally, one worker per host/two globally, existing accounts/hosts/access and expiry2026-11-02T13:38:02.935Z. No label/head/chat resets counters; failures count.

Pin each segment's original identity, head/spec/allowlist, host/profile/tools/network, immutable start/deadline; exact Step0 matching proceeds automatically. Charge ceil dispatch-through-pinned-effect-free-freeze/explicit-release time, including setup/waiting/checks/reporting. No pause/backdate; missing/disputed/late freeze spends the allocation and holds. Further dispatch requires verified release, checker release, a concrete same-scope correction and remaining balance. Each segment counts; full timeout+cleanup must fit before preparation and launch. Initial windows stay closed; builders cannot amend committed specs or perform forbidden effects listed in the mandate.

Correction requires two conclusive predecessor results including substantive changes_required, or one such material-source result plus qualified independent checker retirement of the never-started stale other seat. The mandate's complete history/subject/heads/result/disposition/identity/successor pins, create-only record and permanently fenced attempt ID under exclusive admission, and pre-effect recheck are mandatory. No coordinator self-retirement, started/unknown retirement, fake pass/claim/refund or new successor. Every changed final subject needs two fresh independent substantive passing whole-unit reviews on identical complete source; changes invalidate both. Tests/retirement grant no admission. All45 B1 files, current specs and complete operative EX11 must fit1MiB; preserve exact lossless fixtures and exclude prior reviewer narrative/triage from fresh context while retaining local evidence. Preserve EX7/EX8 history, separate cycle11 acceptance and closed old P00 cycles; no plan/qualification rerun. Human-required policies, Runtime admission, protected merge, supported package loading and permanent native cutover retain their separate gates.
