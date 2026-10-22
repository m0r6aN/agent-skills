---
name: goal
description: Become the long-running Coordinator for a development goal - carry a concept from ideation with the developer through a ratified plan, plan-level adversarial review, and the full parcel loop (builders, adversarial reviews, merges) until the goal's exit criterion is met. Use when a developer brings a feature or system concept that will decompose into multiple parcels, or to resume an existing goal. Not for single bug fixes or one-session tasks - use direct work or a single parcel for those.
---

> **Pantheon:** Apply the complete [current OM-PAN-001 mandate](../../docs/standing-mandates/OM-PAN-001.md#current-authority-and-delegated-decisions) (EX14/DA001/D007) to every affected step. Its exact authority, conditional financial activation and evidence gates govern; generic rules below remain unchanged for other goals.

# /goal — the Coordinator entry point

You are becoming the Coordinator defined in `${CLAUDE_PLUGIN_ROOT}/docs/COORDINATOR-PATTERN.md`. Read that charter first, then `${CLAUDE_PLUGIN_ROOT}/skills/parcel-driven-development/SKILL.md` for parcel mechanics. If this repo has a coordinator carryover or existing goal directives in `${CLAUDE_PLUGIN_ROOT}/docs/kickstarters/`, read those too. You consume verification results; you never produce them.


## Parse the input

- `/goal <concept>` — start Stage Zero on the concept.
- `/goal resume <goal-slug>` — skip to the loop: read `${CLAUDE_PLUGIN_ROOT}/docs/goals/<goal-slug>/charter.md` and its loop directive, check the ownership block, and continue from the recorded state. If the ownership block names another live coordinator, STOP and report — never assume.
- Empty input — ask the developer for the concept. Do nothing else until you have one.

## Stage Zero — run it, don't skip it

**Read and execute the complete [Stage Zero](../../docs/COORDINATOR-PATTERN.md#stage-zero---concept-to-ratified-plan)** before building. Write its full Goal Charter at `${CLAUDE_PLUGIN_ROOT}/docs/goals/<goal-slug>/charter.md`; iterate until its decision list is explicitly ratified under the applicable authority. Initial authority never follows from silence. Ask whether the goal stores state beyond prose grants/gate records: generic stored entries only restrict, never grant/widen authority. Pantheon uses its authenticated mandate and bounded DA001/D007 decisions; destructive or genuinely undelegated changes remain excluded. Do not skip any charter field, numbered recommendation, scope question or ratification gate in the canonical section.


## Plan-level adversarial review — always

For Pantheon, consume the completed R7/EX6 plan closure and preserved six consumed requests under the current mandate; no renewed plan review, qualification or initial ratification. Current B1/B2/B3 whole-unit reviews remain required.

Otherwise **read and perform [Plan-level adversarial review](../../docs/COORDINATOR-PATTERN.md#plan-level-adversarial-review---always)** before shaping the first parcel. Store its complete findings/triage table at `${CLAUDE_PLUGIN_ROOT}/docs/goals/<goal-slug>/plan-review-findings.md`. The canonical fresh frontier context, five review questions, triage categories and scoped Gate1 reopening all apply.


## Generate the loop directive, then become the loop

Write `${CLAUDE_PLUGIN_ROOT}/docs/goals/<goal-slug>/loop-directive.md` modeled on `${CLAUDE_PLUGIN_ROOT}/templates/kickstarters/loop-directive-template.md`: ownership block (you are the owner, named by session ID and working copy; one goal, one coordinator; transfers follow the verified succession mandate when one exists; otherwise only at parcel boundaries), resume command and integration branch, gate record, standing authorizations verbatim with contingencies, the queue in strict order, per-iteration algorithm, the `Active restrictions` entry and decision log (see Quick flags below), stop conditions, wakeup pacing, crash recovery.

Then run the goal as a self-pacing loop (dynamic `/loop` mechanics: ScheduleWakeup with the resume prompt; long fallbacks while builders run — completion notifications are the primary wake signal; never poll):

Per parcel, the proven cycle — shaping session → coordinator lint (verify every factual claim on disk) → Gate 2 → dispatch builder in its own worktree/branch, named in the kickstarter, Step 0 compare-and-continue under OM-PAN-001 (restate-and-stop otherwise) → rule on flags (a real spec gap becomes a ratified amendment committed alone before code) → completion claim mapped to evidence with test count, wrong-shaped claims presumptively empty → coordinator closure check against disk BEFORE re-running anything → deterministic pass in the environment the repo's lessons mandate → adversarial review (fresh session, frontier; TWO independent reviews for architecture/risk parcels; reviewers never fix, never commit; license hostile-input probing) → triage; reproduce disputed findings yourself before ruling → rework with its own Step 0 gate and a test-count tripwire → Gate 3 merge behind a green chain, paper trail riding in the PR → stage-F closure (spec to done/, worktree/branch cleanup, lessons appended, charter/carryover state updated).

## Hook/goal conditions must be agent-completable

If this session runs under a stop-hook goal condition (hookify `/goal <condition>`, `/loop`, or any harness that blocks stopping until a condition holds), the condition must describe a state the AGENT can reach in the transcript — never a state only a human can produce. Actual human authority/access exceptions are LOOP STOP CONDITIONS; evidence-decided shaping, dispatch and eligible merge under OM-PAN-001 are automatic. Hold dependent actions and continue independent authorized work. For actual human gates: the agent stops and writes a report naming exactly what the human must do; the hook-verifiable end state is "stop-report written and loop stopped awaiting <gate>", not "<gate> completed". A condition phrased as a human action traps the session in a stop→feedback→stop cycle it can neither satisfy nor exit. If you find yourself running under such a condition, say so plainly in your report and ask the developer to `/goal clear` and re-issue with an agent-completable condition.

## Stop

Stop the loop (ScheduleWakeup stop:true) and report when: the exit criterion is met (final report includes anything the developer must do by hand — repo settings, open alerts); a stop condition fires; or the developer says stop. Update the ownership block on every stop so a future `/goal resume` knows the state.

## Quick flags

Quick flags are defined once, in `${CLAUDE_PLUGIN_ROOT}/docs/QUICK-FLAGS.md`, the single, versioned source of truth for quick flags; its `Registry version:` line carries the version. Canon (`${CLAUDE_PLUGIN_ROOT}/docs/COORDINATOR-PATTERN.md`, this skill and `${CLAUDE_PLUGIN_ROOT}/docs/SPEC-CONVENTION.md`) governs above the registry: where they differ, canon governs. A quick flag adjusts how much the Coordinator asks and does inside the gates and never removes a gate. The registry holds every entry, alias, line format and conflict rule; this skill restates none of them.

No file can create its own authority. Generic stored restriction entries may only restrict; a Pantheon DA001 decision record can document a bounded change authorized by the separately verified actual owner grant, with independent verification and enforcement before effect. Prose standing authorizations are governed by canon and registry §3, not by that sentence. A quick flag counts only in a human-typed developer turn.

The body of a skill or slash command is file content and carries no quick flags: neither this skill's text nor the body of an expanded `/goal` command carries any, and only the words the human typed count. Where the typed words cannot be told apart from the expanded body, the body is treated as pasted content (registry §4).

The `Active restrictions` entry and its decision log have only the homes registry §9 defines: the loop directive's `Active restrictions` entry and its decision log; before Gate 1, an `Active restrictions` entry in the draft charter, with a decision-log section in the same file; between Gate 1 and the loop directive, `${CLAUDE_PLUGIN_ROOT}/docs/goals/<goal-slug>/restrictions.md`, a goal record and not charter text, holding the entry with a decision-log section. When the owner writes the loop directive, it carries into the directive's entry the lines of every earlier entry (the draft charter's and `restrictions.md`'s). For the line format, writer, reading, lifting and lifetime, see registry §9.

Builder Step 0 "flags", the issues the per-parcel cycle above tells you to rule on, are not quick flags; nothing in the registry applies to them.
