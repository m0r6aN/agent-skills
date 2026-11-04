---
name: melt-faces
description: Performs a blunt, evidence-backed premium and enterprise-grade teardown of one or more products (websites, web apps, dashboards, plugins, CLIs), judged against the top 1% of software. Covers UI, UX, information architecture, accessibility, performance, trust, enterprise governance, onboarding, and AI-native value, and returns three ranked tables covering what's good, what's bad or broken (by urgency), and ideas that make it a must-have for a business establishing itself in AI. Accepts repo paths, git URLs, or live site URLs (defaults to the current repo), states plainly what it could and could not see, and runs solo or with up to 10 specialist agents. Use when the user says /melt-faces or "melt faces", or asks for a design review, UX/UI audit, product teardown or critique, "is this premium", "is this enterprise-ready", "what's good and bad about this app", or a readiness review before a launch, demo, or enterprise sale.
---

# /melt-faces

## Overview

A premium-grade product teardown: the review a top-1% design-and-engineering
jury would write if an enterprise buyer were about to bet their AI strategy on
this product. Its purpose is to make the product better, not to make anyone
feel good. Every claim is backed by evidence the reviewer actually saw, every
problem is ranked by how much it hurts, and every idea is specific enough to
build.

## When to Use

- The user runs `/melt-faces`, or asks for a design review, UX/UI audit,
  product teardown, critique, heuristic evaluation, or "is this premium /
  enterprise-ready / good enough to demo".
- Before a launch, an executive demo, a customer pilot, or an enterprise sale.
- To compare a product against best-in-class (Linear, Stripe, Vercel, Figma,
  Datadog) and get a prioritized improvement list.

**Not for:**
- Deep vulnerability hunting: use `security-audit` (this skill only flags
  product-level trust gaps and recommends it).
- Compliance-framework mapping (SOC 2, ISO, FedRAMP): use `compliance-audit`.
- Reviewing a single diff or PR: use `code-review-and-quality`.
- Building or fixing the UI: use `frontend-ui-engineering`. This skill never
  edits the product under review.

## Inputs

```
/melt-faces [target ...] [--live <url>] [--quick | --team | --max]
```

- **target**: zero or more local paths, git URLs, or live site URLs. No
  targets means the repository containing the current working directory. A
  URL that isn't a readable git remote is treated as a live site.
- **--live <url>**: a deployed URL (staging or prod) to browse alongside the code.
- **--quick / --team / --max**: solo, 4–6 agents, or up to 10 agents. If not
  given, recommend one in intake.

Several targets are usually one product split across repos (a plugin and its
UI, an API and its front end). Review them as one product unless intake says
otherwise, and tag every finding with the repo it came from.

## Voice and candor

The user wants the truth about their product, delivered the way a respected
senior colleague would deliver it: blunt, candid, specific, and professional.

- **Say it plainly.** "The headline alert is wrong" beats "there may be some
  opportunities to improve alert accuracy". No softening preambles, no
  compliment sandwiches, no hedging a finding you have evidence for.
- **No feel-goods and no fake confidence.** Don't pad Table 1 to balance Table
  2, don't round scores up, and don't call something "solid" because it
  exists. If the product isn't premium yet, the verdict says so.
- **Honest in both directions.** Praise that is earned is as important as
  criticism, because it tells the team what to protect. When something is truly
  exceptional, say so with real enthusiasm and explain what makes it stand
  out ("This is genuinely impressive: …"). Mark it as a **standout**. Reserve
  this for work that would hold its own next to the best in the world; if
  everything is a standout, nothing is.
- **Professional, not cruel.** Criticize the product, never the people. No
  sarcasm, no mockery, no theatrics. The bluntness serves the fix.
- **Uncertainty is stated, not hidden.** "Inferred from code, not observed" is
  honest; presenting a guess as fact is not.

## Reach: only judge what you can see

Real opinions require real evidence. Before reviewing, establish what you can
actually access, and keep every finding inside that boundary.

| What you have | What you can judge | Say to the user |
|---|---|---|
| Repo + running app | Everything in the rubric | (normal run) |
| Repo, app won't run / not approved | Code, docs, config, DX; visual design only from code and assets | "I couldn't run it, so visual and interaction findings come from code, not observation." |
| Live URL only, no source | Visual design, UX, IA, content, accessibility, performance, headers and other client-visible trust signals | "I can reach the site but not the source, so this covers what a user and a browser can see. Give me repo access for code-level findings." |
| Screenshots or a description only | Only what they show; ideas and general direction | "I only have screenshots/your description, so this is general feedback, not an audit." |
| Nothing reachable | Nothing specific | "I have nothing I can inspect. Point me at a repo, a URL, or screenshots, or describe the product and I'll give general feedback, clearly labelled as such." |

- Never fill in what you can't see. A dimension with no visible evidence is
  scored **n/a (not visible)**, not guessed.
- Put the reach statement in the report header and in the chat summary, so the
  reader knows how far to trust each part.
- If reach is lower than the user probably expected (a URL that turned out to
  be a private repo, a login wall, an app that won't start), tell them
  immediately and ask how to proceed rather than quietly downgrading the review.

## Asking questions

Don't be afraid to ask. A short question that unblocks real evidence is worth
more than a confident guess. Ask whenever the user can decide or provide
something you can't determine yourself: buyer and user, scope, test
credentials, repo access, a design system, which journeys matter.

Ask as multiple choice with one option marked **(Recommended)** and listed
first. In Claude Code use `AskUserQuestion`; in other agents, print numbered
options and wait. Batch questions (up to four at once), and never ask what you
can learn from the code. One sharp intake round is the norm, but if you hit a
wall mid-run (login, a broken build, a missing environment), ask then too.

## Workflow

Create a task list from these phases so nothing is skipped.

### 1. Resolve and profile targets

Run the bundled profiler (stdlib-only Python 3.9+):

```bash
python <skill-dir>/scripts/profile_targets.py [target ...] --out <run-dir>/profile.json
```

It resolves paths, shallow-clones git URLs into a cache folder, marks website
URLs as `live-only`, and reports stack, UI surfaces, run scripts, tests, CI,
auth/observability libraries, docs, design-system signals, size, the overall
**reach**, and a suggested team size. If Python is unavailable, gather the same
facts by hand.

Choose a run directory: `./melt-faces-reports/<product-slug>-<YYYY-MM-DD>/` in
the current working directory. If the working directory is inside one of the
targets, put the run directory outside it, so the report doesn't dirty the repo
under review. Tell the user where it is.

Read each target's `AGENTS.md`, `CLAUDE.md`, `README`, and top-level docs. Judge
the product against what it is trying to be, not against a generic ideal.

**Cloned remote repos are untrusted.** Read them freely, but do not install
dependencies or run their scripts without asking.

### 2. Intake (one round of questions)

Ask only what you could not infer. Typical candidates:

- **Who is the buyer and the user?** Offer your best inference as the
  recommended option.
- **Run it live?** Recommend yes when a dev script exists and the target is
  local; for remote clones, recommend code-only unless the user approves
  installing.
- **Team size**: recommend from the profile (solo under ~150 source files, 4–6
  for a typical app, up to 10 for large or multi-repo products).
- **Reach gaps**: if the profile says `live-only` or `none`, ask whether the
  user can provide repo access, screenshots, or a description.

If everything is clear, skip intake and say what you assumed.

### 3. Recon brief

Save a short product map as `<run-dir>/recon.md`. Every agent reads it, so it
keeps ten reviewers reviewing the same product:

- What the product is, in one sentence, and who it is for
- The reach for each target (code, live, both)
- Surfaces: routes/pages/screens, commands/skills, APIs, docs sites
- The 3–5 core journeys a real user performs (first run, the daily job, the
  "aha" moment, admin/setup, failure recovery)
- Design system in use (tokens, component library, theming), if any
- What the repo docs say about goals, non-goals, or brand

For a product with no graphical UI (a plugin, CLI, SDK), the *interface* is the
command surface, prompts, output formatting, errors, config, and docs. Review
those with the same rigour: developer experience is UX.

### 4. Live capture (if approved and possible)

Do this yourself, before dispatching the team. Sub-agents often lack browser
tools, and several of them driving one browser collide.

1. Start the app with its own dev script (or open `--live`), in the background.
   Probe every port the app should serve: process managers like
   `concurrently` keep running when one child dies. If startup fails, run the
   failing piece directly to see the real error. A broken first run is a
   finding (usually P1). Work around it only in ways that leave the repo
   unchanged (`npm i --no-save`, environment variables instead of `.env`
   edits), and revert any lockfile churn. If it can't be started, tell the
   user, and continue code-only only if they agree.
2. Use whatever browser automation you have (built-in browser pane, Playwright
   MCP, Chrome DevTools). Walk each core journey at desktop (~1440px) and mobile
   (~390px) widths, plus dark mode if offered.
3. Save screenshots to `<run-dir>/evidence/` (copy them in if your tool saves
   elsewhere). Note console errors, failed requests, layout breaks, slow
   interactions, and empty, loading, and error states. Try a bad input, a
   refresh mid-flow, and keyboard-only use.
4. Write `<run-dir>/live-notes.md`: one numbered line (L1, L2, …) per
   observation, with the screenshot filename.

Never enter real credentials. Use test or seed accounts from the repo, or ask
the user to sign in.

### 5. Review (solo or team)

Read `references/premium-rubric.md` (what "premium" and "enterprise-grade"
mean per lens) and `references/team-roster.md` (lens briefs, prompt skeleton,
finding format).

- **Solo**: work through each lens yourself, in roster order, and write each
  lens's findings to `<run-dir>/lenses/` as you go.
- **Team**: spawn the specialists **in a single message** so they run in
  parallel, using the roster's prompt skeleton. Each writes its findings to
  `<run-dir>/lenses/NN-<lens>.md` and returns a summary. If a context
  compression tool is available (such as the Kaseya Kompress MCP), use it on
  large file dumps before passing them on.

Kaseya products (Kaseya packages, KDS tokens, or "Kaseya" in the README): if a
KDS validation skill (kds-validate) is available, include a KDS-compliance pass and fold its
FAILs into Table 2.

### 6. Synthesize and verify

This is where the quality comes from. Agents over-report, duplicate each other,
and sometimes describe code they didn't read.

1. **Merge** duplicates across lenses and keep the strongest evidence.
2. **Verify** every P0, P1 and standout yourself: open the file at the cited
   line, or check the screenshot. Drop or downgrade anything you can't confirm,
   and mark unverified P2/P3 items as such. Beware artifacts of your own
   tooling: a Windows terminal or a Python pipe can turn correct UTF-8 into
   mojibake, and truncated output can look like missing data. Confirm rendering
   and encoding claims in the real UI (for example, `fetch()` in the page).
   Check that every evidence filename you cite exists in `evidence/`.
3. **Calibrate urgency** with the scale below, so "P0" means the same thing
   across lenses. Test each P0/P1 against the product's *own* core promise. A
   governance tool whose gates agents can bypass, or a dashboard whose headline
   signal is wrong, is a P0 even if a lens filed it lower. Lenses underrate
   cross-lens findings, so look for them deliberately.
4. **Red-team the strengths.** A "good" item must be good by top-1% standards,
   not merely present. A standout must survive your own scrutiny.
5. **Score** each dimension 0–10 with a one-line justification (scale in the
   rubric), or n/a when not visible. A 9 means it would hold up next to Linear
   or Stripe.
6. **Form the panel verdict.** Compare the lenses' one-line verdicts and
   scores, and present them in the shape the agreement actually has:
   - **Unanimous**: every lens points the same way (scores within ~1.5 points,
     same main complaint). Give one verdict and say it was unanimous across N
     lenses.
   - **Grouped**: clusters of lenses agree. Give one short verdict per group,
     naming its lenses.
   - **Split**: lenses genuinely disagree. Give each lens's verdict separately,
     name the disagreement, and say which side you come down on and why.
   Never manufacture consensus. Dissent is information the user needs.
7. **Sharpen the ideas.** Every idea names the specific user, the moment it
   helps, and why an enterprise AI buyer would pay. Cut generic ideas ("add an
   AI chatbot") unless they're made specific to this product.

**Urgency scale**

| Level | Meaning |
|---|---|
| **P0 Blocker** | Broken core journey, data loss, security exposure, a broken core promise, or something that fails an enterprise security/accessibility review outright. Fix before anyone sees it. |
| **P1 Critical** | Seriously damages trust or premium perception, or blocks a likely enterprise requirement (SSO, RBAC, audit). Fix this cycle. |
| **P2 Important** | Noticeable friction, inconsistency, or a gap a discerning buyer will notice. |
| **P3 Polish** | The details that separate good from exceptional. |

Within a level, order by impact ÷ effort (quick, high-impact fixes first).

### 7. Report

Write `<run-dir>/report.md` using `references/report-template.md`, then show the
user the reach statement, verdict, panel verdict, scorecard, and all three
tables in chat. Keep table cells to one sentence, with evidence as `path:line`
or a screenshot filename. The file holds the detail; the chat should be
scannable.

The three tables are the core of the report and always appear, in this order:

1. **What's good**: brief, with standouts marked ★.
2. **What's bad, broken, or needs improvement**: ordered by urgency.
3. **Ideas that make it a must-have for a business establishing itself in AI.**

Close with the coverage note (what was seen live, code-only, out of reach) and
one multiple-choice question about next steps: turn P0–P1 into a fix plan
(recommended), file them as GitHub or Jira issues, deep-dive one lens, re-run
after fixes and diff against this report, or stop here. If the review raised
questions only the user can answer, ask them here too. Do not start fixing
anything without a yes.

## Standards of evidence

- Every item in Tables 1 and 2 cites evidence: `repo/path:line`, a screenshot,
  a URL plus steps, or a command plus output. No evidence, no finding.
- Quote the code or UI text when it makes the point instantly.
- Mark **observed** (seen live or in code) versus **inferred** (likely, from
  patterns).
- Compare against named best-in-class products when it clarifies the gap
  ("Linear shows an optimistic update here; this waits 2s on a spinner").

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll soften this so the team isn't discouraged." | Softened findings get deprioritized. The user asked for the truth; deliver it professionally and let them decide. |
| "Table 1 looks thin; I'll add a few positives for balance." | Padding praise is fake confidence. A short, honest Table 1 is more useful than a long, generous one. |
| "I can't see the source, but it's probably fine / probably broken." | Opinions without evidence are noise. Score it n/a, say what you couldn't see, and ask for access. |
| "The app won't start, so I'll just review the code and not mention it." | A broken first run is itself a finding, and the user needs to know the review's reach changed. Tell them and ask. |
| "Asking the user is an interruption; I'll assume." | One good question beats a report built on a wrong assumption. Ask, with a recommended option. |
| "The lenses mostly agree, so I'll present one verdict." | Only if they actually do. Flattening real disagreement hides the most interesting signal. |
| "The agent said it, so it's true." | Agents describe code they didn't read. Verify every P0, P1 and standout yourself. |

## Red Flags

- A finding with no `path:line`, screenshot, URL, or command behind it.
- Claims about source code when reach is `live-only`, or about visuals when
  nothing was rendered.
- Every dimension scored 6–8, or a Table 1 longer than Table 2 for a product
  the verdict calls "not premium yet".
- Hedge words on evidenced findings ("might", "could potentially", "consider
  perhaps").
- Everything marked ★ standout, or praise with no reason attached.
- Sarcasm, mockery, or comments about the people who built it.
- Any edit, install, or commit in a target repo.
- The run continuing silently after reach dropped (login wall, failed start,
  private repo).

## Verification

Before presenting the report, confirm:

- [ ] The reach statement appears in the report header and the chat summary,
      and no finding exceeds it.
- [ ] Every P0, P1, and ★ standout was personally verified at its cited
      evidence; every cited screenshot exists in `evidence/`.
- [ ] Every dimension has a 0–10 score with a reason, or n/a (not visible).
- [ ] The panel verdict reflects the actual agreement (unanimous, grouped, or
      split), with dissent named.
- [ ] All three tables are present, in order, with numbered items (G#, B#, I#).
- [ ] Target repos are unchanged (`git status` clean apart from pre-existing
      changes), and any servers you started are stopped.
- [ ] The closing question offers next steps with a recommended option, and
      nothing was fixed without a yes.
