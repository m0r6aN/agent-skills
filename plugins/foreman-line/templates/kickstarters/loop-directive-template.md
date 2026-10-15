# Loop Directive — TEMPLATE

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
> Ownership transfers only at parcel boundaries, by editing this block; a
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
stays with the human. Gate 1 is never delegable and never appears here.
Quick flags are not standing authorizations: none is written here; none widens,
reinterprets or revokes one (registry §3).

1. **Gate 2 (dispatch):** `<GATE-2-GRANT-VERBATIM>`
2. **Gate 3 (merge):** `<GATE-3-GRANT-VERBATIM>`
3. **Not granted:** `<WHAT-IS-NOT-GRANTED>`

## Queue (strict order)

In the charter's dependency order. A new parcel idea is stop-and-report.

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
decision-log entry format, are defined only in registry §9. Nothing in the
entry can grant authority or loosen a restriction (registry §4). When this
file is first written, the owner carries the lines of every earlier entry
directly under the `Active restrictions:` label below: the draft charter's
(written before Gate 1) and `docs/goals/<GOAL-SLUG>/restrictions.md`'s
(written after it) (registry §9).

Active restrictions:

Decision log:

## Stop conditions

Stop the loop and write a report naming exactly what the human must do when:

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

On any wake (scheduled, a completion notice, or a human nudge) while expecting
a builder or reviewer result, first check whether that session is still
running. No completion claim from a session that is not running means process
death, not completion: its work is unclaimed even if it survives on disk, and
unclaimed disk state is never accepted as done. Recover with a fresh session
whose Step 0 restates the original directive, inventories what exists on disk
against it, and stops for your ruling; then continue the loop.
