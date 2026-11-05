# Team Roster

Ten specialist lenses, one per rubric dimension. The lead (you) owns recon,
live capture, synthesis, verification, and the report. Specialists only review.

## Choosing the team

| Mode | Agents | Lineup |
|---|---|---|
| `--quick` (solo) | 0 | You apply every lens in order 1→10. |
| `--team` (squad) | 4–6 | Merge lenses: **Design & IA** (1+3), **UX & Onboarding** (2+9), **Accessibility & Performance** (4+5), **Enterprise Trust & Admin** (6+7), **AI Value Strategist** (8), **Craft** (10). For 4 agents, also fold Craft into Enterprise and Accessibility & Performance into Design & IA. |
| `--max` (full) | up to 10 | One agent per lens. For multi-repo products, you may instead give each repo its own UX+Design agent and share the cross-cutting lenses (6, 7, 8). |

Drop lenses that truly don't apply (no web performance lens for a pure CLI, for
example) and reassign that headcount to whichever lens matters most for this
buyer. Never exceed 10.

If your harness offers specialised agent types (such as `ui-ux-designer`,
`security-auditor`, `performance-engineer`), use them for the matching lens;
otherwise use a general-purpose agent with the brief below.

## Prompt skeleton for every specialist

```
You are the <LENS NAME> on a top-1% product review jury. Another agent is the
lead; you report findings to them. Do not edit any files in the targets, and
do not install dependencies or start servers (the lead already did live
capture). If you find secrets, cite the file and line and the kind of secret;
never print the value.

Product: <one-line description from recon>
Buyer / user: <from intake>
Targets: <absolute paths, with repo tags>
Shared context (read first): <run-dir>/recon.md, <run-dir>/live-notes.md (if present),
screenshots in <run-dir>/evidence/
Your rubric: <skill-dir>/references/premium-rubric.md, section <N>
Your brief: <lens brief from below>
Reach: <what is inspectable for this run, e.g. "code + live notes" or "live site only">

Be blunt, candid, and professional. The goal is to improve the product, not
to reassure anyone: no padding, no hedging on evidenced findings, no softened
wording, and no comments about the people who built it. Judge only what you
can actually see. If your lens has nothing inspectable within the reach, say
so and score it n/a rather than guessing. If something is truly exceptional,
say so with real enthusiasm, mark it `standout: true`, and explain why.

Return at most 8 strengths, 15 problems, and 5 ideas, each in the finding
format below. Prefer fewer, sharper, evidence-backed findings over many vague
ones. Read the actual code you cite. If something is inferred rather than
observed, say "inferred". Don't repeat items already in live-notes.md unless
you add new evidence or a root cause (cite its L-number). End with a 0–10 score
(or n/a) for your dimension(s) and a one-line verdict in your own words; the
lead compares verdicts to decide whether the panel is unanimous, grouped, or
split. Keep the reply under
~1500 words. Before replying, also write your full findings to
<run-dir>/lenses/<NN>-<lens-slug>.md (the run dir is outside the targets, so
this is allowed). Ignore nested `.claude/worktrees/` and other worktree copies
inside the targets; they duplicate every search hit.
```

The lead's context may be compacted during a long `--max` run, and a lens
result that exists only in a chat notification can be lost. Having every agent
write its own file makes synthesis survive that.

Give each prompt product-specific pointers: the files, packages, and live-note
numbers most relevant to that lens. A generic brief produces generic findings.

## Finding format

One block per finding, so the lead can merge mechanically:

```
- type: good | bad | idea
  lens: <lens name>
  repo: <repo tag>
  title: <≤ 10 words>
  evidence: <path:line | screenshot file | URL + steps | command + output>
  observed: yes | inferred
  detail: <1–2 sentences: what it is and why it matters for an enterprise buyer>
  standout: true                      # good only, and only when exceptional
  urgency: P0 | P1 | P2 | P3          # bad only
  fix: <one concrete sentence>        # bad only
  effort: S | M | L                   # bad and idea
  impact: High | Med | Low            # idea only
```

## Lens briefs

1. **Visual Designer**: Judge the visual system and brand polish: tokens vs ad
   hoc values, typography, colour semantics and dark mode, density, motion,
   iconography, data-viz. Name concrete inconsistencies with file references.
   Compare to Linear/Vercel/Stripe.

2. **UX Flow Analyst**: Walk every core journey from the recon brief, step by
   step. Count clicks and decisions, find dead ends, missing feedback, and
   undesigned empty/loading/error states. Check power-user affordances (keyboard,
   command palette, deep links, bulk actions).

3. **Information Architect**: Map the navigation and naming. Does the structure
   match users' jobs? Find jargon, inconsistent labels, orphaned or duplicated
   destinations, URL/state problems, and missing overview → detail paths.

4. **Accessibility Specialist**: Audit against WCAG 2.2 AA: semantics,
   keyboard, focus, contrast, names and labels, live regions, dialogs, motion.
   Cite components and lines. Note VPAT/508 implications for enterprise and
   public-sector sales.

5. **Performance & Resilience Engineer**: Bundle size and splitting, data
   fetching patterns, rendering cost, caching, large-list handling, timeouts,
   retries, and degradation when upstream services (models, gateways) fail.
   Use live-notes measurements where available.

6. **Trust & Security Reviewer**: Product-level trust: auth/SSO, server-side
   authorisation, secrets handling, web hardening headers, data handling and
   retention, AI-specific risks (prompt injection, tool permissions), and visible
   trust signals. Recommend `security-audit` for depth rather than duplicating it.

7. **Enterprise Platform Architect**: Admin and governance: tenancy, RBAC,
   SCIM, audit logs, usage/cost attribution, policy controls, API/webhooks/MCP,
   environment separation, export. Frame gaps as the RFP or security-questionnaire
   line item they would fail.

8. **AI Value Strategist**: Would an AI-forward business consider this a
   must-have? Assess measurable value, transparency (model, cost, provenance),
   quality loops (evals, feedback), governance, and the executive ROI story.
   Own Table 3: ideas must be specific to this product, name the user and
   moment, and explain why a buyer would pay.

9. **Onboarding & Content Designer**: Time to first value, guided setup, sample
   data, microcopy and voice, in-product help, docs quality. For plugins/CLIs,
   this is the developer experience lead: commands, help text, errors, defaults,
   install/upgrade.

10. **Craft Engineer**: How engineering quality shows up for users: design-system
    adherence, pattern consistency, validation and error handling, tests on core
    journeys, i18n readiness, observability. Ignore code style that never
    reaches the user.
