# Report Template

Use this structure for `<run-dir>/report.md`. In chat, show sections 1–5 and the
closing question; the coverage notes and appendix can stay in the file.

```markdown
# /melt-faces: <Product name>

**Targets:** <repo tags and paths/URLs> · **Date:** <YYYY-MM-DD> · **Mode:** <solo | squad of N | team of N>
**Buyer / user:** <from intake>
**Reach:** <what was actually inspected, e.g. "repo + running app (desktop, mobile)" | "live site only, no source" | "screenshots only". Name anything expected but not reachable.>

## 1. Verdict

<Three sentences at most: what this product is today, the single biggest thing
holding it back from premium/enterprise grade, and the single biggest
opportunity. Plain and direct; write it so an executive could forward it.>

**Premium score: <x.x> / 10** <weighted; dimensions scored n/a are excluded and listed>

### Panel verdict (<unanimous | grouped | split>)

<Unanimous: one line, "Unanimous across N lenses: …".
Grouped: one line per group, "Design, IA, A11y (3): …".
Split: one line per lens, then "Where they disagree: … I side with … because …".
Solo runs: omit this subsection.>

## 2. Scorecard

| Dimension | Score | Why |
|---|---|---|
| Visual design & brand | 7 | <one line> |
| <dimension with no visible evidence> | n/a | Not visible: <why, e.g. no source access> |
| Interaction & UX flows | | |
| Information architecture | | |
| Accessibility | | |
| Performance & resilience | | |
| Trust, security & privacy | | |
| Enterprise admin & governance | | |
| AI-native value | | |
| Onboarding, content & docs | | |
| Engineering craft | | |

## 3. What's good

| # | Area | Strength | Evidence |
|---|---|---|---|
| G1 | <lens> | <one sentence> | `repo/path:line` |
| G2 ★ | <lens> | **Standout.** <what makes it exceptional, and why it impressed the panel> | `repo/path:line` |

<★ marks a standout: work that would hold its own next to the best in the
world. Use sparingly and always say why.>

## 4. What's bad, broken, or needs improvement (by urgency)

| # | Urgency | Area | Issue | Evidence | Fix | Effort |
|---|---|---|---|---|---|---|
| B1 | P0 | <lens> | <what's wrong, and why an enterprise buyer cares> | `repo/path:line` / `evidence/x.png` | <concrete fix> | S |

**Quick wins:** <B-numbers that are P0–P2 with effort S, so the team can start today>

## 5. Ideas that make it a must-have for an AI business

| # | Idea | What it is | Why it makes this a must-have | Impact | Effort |
|---|---|---|---|---|---|
| I1 | <name> | <1–2 sentences, specific to this product> | <the user, the moment, the business value> | High | M |

## 6. Coverage notes

- Checked live: <journeys, viewports, themes>
- Code-only: <areas>
- Not covered / out of reach: <and why>
- Unverified items: <B-numbers marked inferred>

## Appendix: per-lens detail

<Optional: longer notes from each lens, screenshots, and measurements.>

---
This is the way.
```

## Writing guidance

- Blunt, candid, professional. State findings plainly, without hedging,
  softening, or padding. Criticize the product, never the people.
- Number items (G1, B1, I1) so the user can reference them in follow-ups.
- Lead table cells with the point; no filler like "It is worth noting that".
- An issue cell should make the user wince a little. A strength cell should
  explain why it's good, not just that it exists.
- If one finding has several locations, cite the clearest one and add
  "(+N more)".
