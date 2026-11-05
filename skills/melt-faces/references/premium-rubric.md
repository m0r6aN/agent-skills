# Premium + Enterprise Rubric

What "premium" and "enterprise-grade" mean, lens by lens. Each section has the
questions a top-1% reviewer asks, and the tells that separate good from
exceptional. These are prompts for judgement, not a checkbox exercise: skip what
doesn't apply to this product and go deep where it matters.

## Contents

0. Scoring scale
1. Visual design & brand
2. Interaction & UX flows
3. Information architecture & navigation
4. Accessibility
5. Performance & resilience
6. Trust, security & privacy
7. Enterprise administration & governance
8. AI-native value
9. Onboarding, content & docs (including developer experience)
10. Engineering craft

---

## 0. Scoring scale (per dimension, 0–10)

| Score | Meaning |
|---|---|
| 9–10 | Best in class. Would hold up side by side with Linear, Stripe, Vercel, Figma. |
| 7–8 | Strong and professional, with a few gaps a discerning buyer would notice. |
| 5–6 | Competent but generic. Works, doesn't impress. |
| 3–4 | Visible problems that undermine trust or slow users down. |
| 0–2 | Broken, missing, or actively harmful. |
| n/a | Not visible within this run's reach (no source, no running app, login wall). Never guess a number. |

The overall score is the weighted mean. Default weights: AI-native value,
trust/security, and UX flows ×1.5; the rest ×1. Adjust the weights if intake
showed a different buyer priority, and say so. Dimensions scored n/a are left
out of the mean and listed next to the overall score, so a live-only review
never looks more complete than it was.

---

## 1. Visual design & brand

- Is there a coherent visual system: a type scale, a spacing scale, a colour
  palette with semantic roles, radii, elevation? Or are values ad hoc
  (`margin: 13px`, five greys)?
- Typography: hierarchy obvious at a glance, comfortable line length (45–90
  characters), tabular numerals in data, no orphaned font weights.
- Colour: purposeful, consistent semantic use (success, warning, danger, info),
  contrast holds in both light and dark themes, colour never the only signal.
- Density appropriate to the job: data-heavy tools earn compact density;
  marketing pages earn air. Premium enterprise tools feel calm, not cramped.
- Motion: subtle, fast (150–250ms), meaningful (shows cause and effect),
  respects `prefers-reduced-motion`.
- Iconography: one family, consistent stroke and size, labelled where ambiguous.
- Data visualisation: honest axes, readable labels, accessible palettes,
  sensible empty states.
- Brand: does it feel like a company you would trust with your AI strategy? Is
  there a point of view, or is it a default template?
- Tells of excellence: pixel alignment, consistent corner radii, considered
  favicon/title/OG image, polished dark mode, no layout shift.

## 2. Interaction & UX flows

- Can a first-time user complete each core journey without help? Count steps
  and decisions; premium products remove both.
- Every async action has immediate feedback: optimistic update, progress, or
  skeleton. No dead clicks, no double-submit.
- Empty, loading, error, partial, and offline states are designed, not
  defaulted. Errors say what happened, why, and what to do next.
- Destructive actions are confirmed or, better, undoable.
- Forms: inline validation, sensible defaults, autofocus, preserved input on
  error, clear required/optional marking.
- Power-user affordances: keyboard shortcuts, command palette (Cmd/Ctrl-K),
  bulk actions, saved views, deep-linkable state (filters in the URL).
- Consistency: the same action looks and behaves the same everywhere.
- Responsiveness: usable on a laptop at 1280px and on a phone, or deliberately
  and gracefully desktop-only.
- Tells of excellence: things feel instant; the product anticipates the next
  step; nothing makes you wait without telling you why.

## 3. Information architecture & navigation

- Does the navigation reflect the user's mental model (jobs to be done), or the
  org chart/codebase?
- Labels: plain, specific, consistent. No internal jargon or codenames in the UI
  unless the audience shares them.
- Hierarchy: primary vs secondary destinations clear; depth ≤ 3 for common tasks.
- Wayfinding: active state, breadcrumbs or titles, the browser back button works,
  and every important view has a shareable URL.
- Search and filtering where the content volume demands it.
- Overview → detail: a home/dashboard that answers "what needs my attention?"
- Tells of excellence: you can guess where anything lives; nothing is orphaned;
  related things link to each other.

## 4. Accessibility (WCAG 2.2 AA as the floor)

- Semantic HTML and landmarks; headings in order; buttons are buttons.
- Full keyboard operation with a visible focus ring, logical tab order, no traps,
  and skip links on content-heavy pages.
- Contrast ≥ 4.5:1 for text, ≥ 3:1 for UI components and focus indicators.
- Accessible names for icon-only controls, form labels tied to inputs, errors
  announced (`aria-live`), dialogs that manage focus.
- Target size ≥ 24×24px; zoom to 200% without loss; respects reduced motion.
- Charts and data have text or table alternatives.
- Why enterprise cares: Section 508, EN 301 549, and procurement questionnaires
  (VPAT/ACR). Failing here loses public-sector and large-enterprise deals.

## 5. Performance & resilience

- Core Web Vitals targets: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- Bundle discipline: code-splitting, no giant client-side dependencies for small
  jobs, images sized and modern-format, fonts subset and preloaded.
- Data fetching: caching, pagination or virtualisation for large lists, no
  waterfalls, no N+1 calls from the client.
- Resilience: timeouts, retries with backoff, graceful degradation when a
  dependency (model API, gateway) is slow or down, clear status messaging.
- Real-time features: reconnect logic, stale-data indicators.
- Tells of excellence: perceived speed; skeletons match final layout; nothing
  janks when data arrives.

## 6. Trust, security & privacy

- Authentication: SSO (SAML/OIDC) available or planned, MFA, sensible session
  handling. Secrets never in client bundles or the repo.
- Authorisation: server-side enforcement, not just hidden buttons. Least
  privilege by default.
- Web hardening: CSP, HSTS, secure cookies, CSRF protection, input
  validation/output encoding, dependency hygiene.
- Data: what is collected, where it lives, retention, encryption at rest and in
  transit, PII handling, and (for AI) whether prompts and outputs are used for
  training.
- AI-specific: prompt-injection defences, tool/permission boundaries, output
  filtering, human approval for consequential actions.
- Visible trust: status page, security/trust centre, privacy policy, changelog,
  clear ownership/contact.
- Keep this lens product-level. For a deep technical security audit, recommend
  the `security-audit` skill rather than duplicating it.

## 7. Enterprise administration & governance

- Multi-tenancy and workspaces/orgs; tenant isolation is clear.
- Roles and permissions (RBAC, ideally custom roles); SCIM or directory sync for
  provisioning.
- Audit log: who did what, when, from where; exportable; immutable.
- Usage and cost visibility per team/user/project, budgets, and alerts.
- Policy controls: allowed models/tools, data residency, retention settings.
- Integrations and extensibility: public API, webhooks, MCP/CLI, SIEM export,
  Slack/Teams notifications.
- Supportability: environment separation (dev/staging/prod), feature flags,
  versioned APIs, migration paths, admin-facing health views.
- Data portability: export everything in open formats.
- Why it matters: these are the line items on every enterprise RFP and security
  questionnaire. Missing ones are deal-blockers no matter how beautiful the UI.

## 8. AI-native value

The question: would a business trying to establish itself in AI consider this a
must-have, or a nice dashboard?

- Does the product make AI *work* measurably better, cheaper, safer, or faster,
  and does it show that with numbers (cost saved, latency, quality, adoption)?
- Transparency: which model, which version, what it cost, why it decided what it
  decided. Provenance and citations for generated content.
- Quality loop: evaluations, feedback capture, regression detection, A/B or
  champion/challenger comparisons.
- Governance: guardrails, policy enforcement, approval gates, red-team results,
  incident trails.
- Human-in-the-loop done well: clear handoffs, confidence signals, easy
  override and correction.
- Leverage: does AI in the product remove work (automation, agents, natural
  language queries), or only describe it?
- Executive story: can a VP get a one-screen answer to "is our AI investment
  paying off, and is it safe?"
- Ecosystem fit: works with the stack AI teams use (OpenAI/Anthropic/Azure,
  LiteLLM, Langfuse, OpenTelemetry, MCP).

## 9. Onboarding, content & docs (and developer experience)

- Time to first value: how many minutes and steps from install/sign-up to the
  "aha" moment? Is there a guided path, sample data, or a demo mode?
- Microcopy: clear, human, consistent voice; action-oriented buttons ("Create
  policy", not "Submit"); no lorem ipsum, TODOs, or placeholder text shipped.
- In-product help: tooltips for jargon, contextual docs links, "what's new".
- Docs: README gets someone running in under five minutes; concepts,
  how-tos, and reference are separated; examples are copy-pasteable and correct.
- For plugins, CLIs, and SDKs: discoverable commands, `--help` that helps,
  predictable flags, actionable error messages with a fix, consistent output
  formatting, sensible defaults, idempotent operations, clear install/upgrade
  path, and a changelog.
- Tells of excellence: the product teaches itself; docs answer the question
  you were about to ask.

## 10. Engineering craft (as it shows up in the product)

- Design system adherence: shared components and tokens instead of one-off
  styling; one way to build a button.
- Consistency of patterns across pages (tables, forms, modals, toasts).
- Type safety and validation at boundaries; errors handled, not swallowed.
- Tests that protect the core journeys (unit, integration, end-to-end); CI that
  runs them.
- Internationalisation readiness: strings externalised, locale-aware dates,
  numbers, and currency, layouts that survive longer text.
- Observability: errors reported (Sentry/OTel), key product events tracked.
- Dead code, stale TODOs, duplicated logic, and inconsistent naming. Mention them
  only when they leak into the user experience or slow the team's ability to
  polish.
