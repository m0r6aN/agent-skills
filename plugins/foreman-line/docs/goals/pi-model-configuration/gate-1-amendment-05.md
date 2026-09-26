# Amendment 05: versioned resolver and bounded local launch

Status: accepted coordinator review rulings, recorded 2026-09-26 under the user's
authorized prerequisite work. This is the current implementation/shaping canon;
it is not evidence of implementation, provider availability or activation. The
coordinator accepted the independent P2 design review and directed these exact
corrections. Historical gate records remain history, not a demand to re-ask for
already granted preparation authority. No new user ratification is invented.

## V1: explicit version boundary, effective before P2A dispatch

Legacy v0 RCM D3/D4 selection remains classification, capability, declared tier
order with no runtime sorting/price ranking. Explicit PMC v1 requests instead use
the ratified PMC map/rubric and L5 cheapest-eligible ranking. This is a versioned
exception to RCM D3's ranking prohibition, not a rewrite of v0 behavior. Both keep
classification/capability hard filters, RCM D1 policy authority, D10/D11 offline
fresh catalog facts and D13 exact endpoint matching. No implicit version upgrade,
mixed comparator, cross-version fallback or second HRO resolver is permitted.
This amendment is recorded in both owning charters now, before P2A dispatch.

## V2: amends A1 authentication for the initial local boundary

The initial issuer and consumer run in the same controlled process. Authorization
is a nonserializable opaque branded one-use permit whose identity and immutable
claims are held in a private module-owned registry. No public mint/sign API,
JSON field, TypeScript cast, copied object or serialized receipt conveys authority.
Only the trusted controller invokes the owner resolver, validates current evidence
and reserves budget before minting. A descriptive audit receipt is NOT the signed
authority required by old A1 wording: that requirement is explicitly replaced for
this initial same-process boundary by the registry-authenticated permit.

Restart invalidates every permit; durable reserved/consumed/uncertain liabilities
survive. Loading a receipt or restarting never permits replay. HMAC, persisted
signatures, key provisioning and IPC authorization are deferred until an actual
IPC requirement is separately specified. Do not implement both auth mechanisms.
Same-process code possessing private trusted ports is in the trusted computing
base; untrusted tasks/extensions never receive mint, ledger or sender access.

## V3: terminal consume and exact send

Finish all permitted hooks/payload transformations, own and freeze the final wire
payload and bound descriptor, and verify their digest and all authenticated fields.
Durably consume immediately before the sole controlled sender can perform the
exact HTTP operation. No hook or mutable reference remains after validation.
Any subsequent error is uncertain unless the owned sender proves no-send; a
timeout, missing response, abort or restart is not no-send proof. No hidden retries,
redirect-following, auxiliary requests, cache warming or compaction inference.
Every later request needs its own reservation/permit and preserves budget scope.
Hook exceptions are not gates: Pi 0.87.1 catches before_provider_request errors.

## V4: exact budget arithmetic and durable liabilities

Limits, settlements and reservations are integer micro-USD, nonnegative safe
integers. Parse authenticated provider decimal rate lexemes as exact rational
values with at most 18 fractional digits. Multiply by bounded token/charge
counts, sum all conservative charge components exactly, then ceil the TOTAL to
micro-USD; never round rates downward or calculate through binary floating point.
Reject unknown charges/rate units, excess precision, unsafe magnitudes and missing
conservative input/output bounds. A binary numeric projection alone cannot
authenticate the original decimal rate lexeme. Exact price evidence binds source/
profile digest and per-send tariff/bounds; mismatched or unbounded pricing refuses.
Numeric facts used for ranking do not become billed-price authority. Provider
actual charges are separate from conservatively rounded ledger liabilities.

Remaining budget subtracts settled spend AND all reserved/consumed/uncertain
liabilities from the authorized scope limit, atomically across processes. A class
ceiling is not a remaining ledger. Unknown liabilities remain reserved; corrupted
or missing initialized storage refuses, never resets spending. No duplicate send
on replay/restart; reconcile only authenticated settlement or sender no-send proof.

## V5: smallest transport and honest milestones

Initially support only explicit OpenRouter OpenAI Chat Completions transport
(Pi API tag openai-completions), one controlled stream owning its exact HTTP
operation. Unsupported protocol/provider refuses; do not delegate to a hidden
built-in sender. Disable extension discovery, warming, automatic compaction,
automatic retry and other inference until each is proven through the same gate.
The initial controlled entry accepts public classification only; internal and
restricted refuse even when a declared policy would otherwise allow them. No
family, quality, capability, privacy, availability or endpoint fact is fabricated.

Milestone 1 is public synthetic OFFLINE conformance with a fake transport that
cannot reach the network. Its test-only construction is non-exported and cannot
enable production authority. Milestone 2 is separately evidenced actual public
activation under the existing applicable authorization and required live/quality/
capability/privacy evidence. Neither milestone satisfies unsupported nonpublic,
other-provider or full HRO live exit claims. Those goals remain open until their
original requirements are proved. L1/L2 pinned opencode requests therefore refuse
this initial OpenRouter-only transport; never silently move them to OpenRouter.

## V6: L6 and break-glass

Exact thinking-level authorization is enforced before launch and on final wire
payload. Sparse RCM catalog maps are facts only, not Pi model configuration:
installed Pi 0.87.1 treats omitted off/minimal/low/medium/high as supported and
OpenAI chat may emit none for omitted off. Deny unobserved/unsupported levels
explicitly (null in Pi configuration plus final guard, or proven equivalent),
reject automatic clamping/substitution, and refuse off when reasoning is required.
Pin runtime behavior; an SDK claim of support cannot widen source-profile facts.

Every governed legacy/v1 entry refuses disabled L6 and routing/classification
aliases before Pi initialization, discovery or inference. Missing legacy intent
refuses rather than defaulting to builder. Preserving v0 structure does not keep
its old Jev lane executable. Break-glass bypass set is EMPTY: every override
request refuses in this initial implementation. Old A1's bypass availability is
deferred, not implemented with guessed authority or allowed checks.

## V7: smaller implementation parcels

P2A pure v1 resolver -> P2B durable ledger -> P2C same-process launch controller ->
P2D one-protocol terminal transport -> P2E configuration plan/caller migration.
Each has exact file authority, a fresh base handoff and two independent reviews.
P2A is candidate-ready only after P1 acceptance and API freeze; all drafts remain
non-dispatchable until their own readiness conditions are met. A fake transport
pass cannot close P2D terminal coverage or P2E actual caller/activation evidence.
