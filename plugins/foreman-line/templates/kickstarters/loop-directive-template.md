# Loop Directive — TEMPLATE

> **Pantheon current authority:** Read the complete [OM-PAN-001 current mandate](../../docs/standing-mandates/OM-PAN-001.md#current-authority-and-delegated-decisions) before applying this document. Actual EX14 and DA001 supersede only Pantheon's obsolete owner-only amendment gates, revision limits and native-response meter. The authentic initial owner grant remains distinct; non-destructive coordinator decisions need no new human prompt but must be bounded, recorded, independently verified and enforced before effect. Exact Step0 comparison is automatic; source/review/security/repository gates still hold on missing evidence. No fake Human/Runtime receipts, worker scope expansion or destructive authority. The generic gates below apply to other goals; Pantheon uses the linked current mandate for every affected step.

> Reusable shell for a goal's loop directive. Never copy over an existing loop
> directive. Copy this file to `docs/goals/<GOAL-SLUG>/loop-directive.md` and
> fill every `<PLACEHOLDER>`. The `/goal` skill says when to write it,
> `docs/COORDINATOR-PATTERN.md` is its charter, and quick flags are defined
> only in the registry `docs/QUICK-FLAGS.md`; this file restates none of them.

## COORDINATOR OWNERSHIP — read before dispatching anything

> **Owner:** session `<OWNER-SESSION-ID>`, working copy `<OWNER-WORKING-COPY>`
> (an absolute path), integration-branch checkout
> `<INTEGRATION-BRANCH-CHECKOUT>` (an absolute path, or the same as the
> working copy). Claimed `<CLAIM-DATE>`: `<CLAIM-PROVENANCE>`.
> **State:** `<STATE>` (updated on every stop). One goal, one coordinator.
> With a verified succession mandate, transfers use its lease/CAS/fencing procedure and reconcile pending effects. Otherwise ownership transfers only at parcel boundaries, by editing this block; a
> transfer updates the session ID and both paths together. If this block names
> another live coordinator, STOP and report; never assume.

## Resume and integration branch

Resume: `/goal resume <GOAL-SLUG>`. Integration branch: `<INTEGRATION-BRANCH>`.

## Who you are

The Coordinator for `<GOAL-SLUG>`: you consume verification, you never produce
it. Charter: `charter.md`. Plan review: `plan-review-findings.md`. Canon:
`docs/COORDINATOR-PATTERN.md`, the `/goal` skill and `docs/SPEC-CONVENTION.md`.
Quick flags are defined only in `docs/QUICK-FLAGS.md`; canon governs above it.

## Gate record

For what an entry must name to tie a charter revision to a human ratification,
see registry §3 and §8.

*(none yet)*

## Standing authorizations

Granted by `<GRANTOR, THE HUMAN DEVELOPER>` on `<GRANT-DATE>`, as it applies
to this goal. Each is the grant's verbatim prose with its scope and
contingencies. Where nothing was granted, the slot says `none` and that gate
stays with the human. Outside Pantheon, Gate 1 is never delegable and never appears here. Pantheon records its already authentic initial grant separately and subsequent DA001 decisions as delegated decisions, never new Human ratifications.
Quick flags are not standing authorizations: none is written here; none widens,
reinterprets or revokes one (registry §3).

1. **Gate 2 (dispatch):** `<GATE-2-GRANT-VERBATIM>`
2. **Gate 3 (merge):** `<GATE-3-GRANT-VERBATIM>`
3. **Not granted:** `<WHAT-IS-NOT-GRANTED>`

## Queue (strict order)

In the charter's dependency order. Under OM-PAN-001, the coordinator may split/refine parcels and decide non-destructive amendments through DA001; dependent effects hold until the exact decision, specification and enforcement are independently verified. Other new parcel ideas are stop-and-report.

1. `<PARCEL-1-ID>`: `<ONE-LINER, RISK, ROUTING CLASS>`
2. `<PARCEL-2-ID>`: `<ONE-LINER, RISK, ROUTING CLASS>`
3. `<FURTHER PARCELS, IN DEPENDENCY ORDER>`

## Per-iteration algorithm

1. Read the ownership block, the gate record, the `Active restrictions` entry
   in each copy named in the ownership block, and `charter.md`.
2. Run the `/goal` skill's per-parcel cycle for the active parcel and its step.
3. `<GOAL-SPECIFIC ADDITIONS>`
4. Update the state line in the ownership block at every parcel boundary.

## Active restrictions and decision log

The entry's line format, writer, reading, lifting and lifetime, and the
decision-log entry format, are defined only in registry §9. Generic entries cannot grant authority or loosen a restriction (registry §4). Pantheon bounded DA001 decisions derive authority from the separately verified actual owner grant, not from a stored entry; record and independently verify changed enforcement before effect. When this
file is first written, the owner carries the lines of every earlier entry
directly under the `Active restrictions:` label below: the draft charter's
(written before Gate 1) and `docs/goals/<GOAL-SLUG>/restrictions.md`'s
(written after it) (registry §9).

Active restrictions:

Decision log:

## Stop conditions

Under verified OM-PAN-001, use its automatic hold/recovery and precise exception policy; independent authorized work continues, and an empty queue is not proof closure. Outside that scope, stop the loop and write a report naming exactly what the human must do when:

1. A frozen contract needs modification.
2. A tripwire fires twice on one parcel.
3. A security finding cannot close in-parcel.
4. Anything outward-facing goes beyond the standing authorizations above.
5. Queue empty or exit criterion met: the final report names the human steps.
6. Any human gate: human gates are loop stop conditions.
7. A hook or goal condition is phrased as a human action: say so, and ask the
   developer to re-issue it as agent-completable.
8. `<GOAL-SPECIFIC STOP CONDITIONS FROM THE CHARTER>`

## Wakeup pacing

Blocked only on a running session: schedule a long fallback wakeup and yield.
Completion is the primary wake signal; the wakeup is insurance. Never poll.
Wakeup, resume, hook-feedback and completion-notification prompts never carry
quick flags; the Coordinator writes no quick-flag token into one (registry §4).

## Crash recovery

For OM-PAN-001, apply the current EX14/DA001 succession, native-start and session-floor rules in `docs/standing-mandates/OM-PAN-001.md` before any recovery dispatch. No generic fresh session bypasses the eight-session ceiling, single reserved checker successor, author exclusions or builder deadline. After permanent cutover, native recovery never reopens automatically; persist the deduplicated post-cutover repair exception and continue read-only reconstruction.

On any wake (scheduled, a completion notice, or a human nudge) while expecting
a builder or reviewer result, first check whether that session is still
running. No completion claim from a session that is not running means process
death, not completion: its work is unclaimed even if it survives on disk, and
unclaimed disk state is never accepted as done. Where the applicable mandate permits it, recover with a fresh session
whose Step 0 restates the original directive, inventories what exists on disk
against it, and stops for your ruling; then continue the loop.
