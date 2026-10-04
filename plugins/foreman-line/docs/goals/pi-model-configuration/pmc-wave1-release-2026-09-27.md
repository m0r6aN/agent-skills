# PMC Wave 1 release record — 2026-09-27

**Authority:** coordinator decision under owner blanket authority (2026-09-26). Gate receipts
per the repo convention: these are coordinator decision receipts, not fabricated human approvals.

## 1. Dual adversarial review (sequencing-decision §3 condition 1) — SATISFIED

- Review A delta re-review: **APPROVE WITH NITS** — all 16 findings verified fixed (59/59 named
  regression tests executed; every repro now fails closed). Carried nit DA-1: resolve-time
  mirror of `FALLBACK_SELF_REFERENCE` (self-referential fallback pair) — declared remaining
  item, defense-in-depth over the validator's static rejection.
- Review B delta re-review: **APPROVE WITH NITS** — all 7 findings verified fixed; scenario
  re-traces S1–S5 confirmed at cited lines; assertion strength audited (none weakened). Carried
  nit RB-6: catalogue-GET response bytes not preserved under `evidence/` — recorded honestly in
  the work record §5; no disposition depends on it.
- Zero unfixed blocker/major/minor findings. Findings files (with dated delta sections):
  `pmc-p2-review-a-findings.md`, `pmc-p2-review-b-findings.md`.

## 2. Owner Gate 3 merge (condition 2) — DECIDED APPROVED

Gate 3 for the PMC Wave 1 merge (PMC-P1 + PMC-P2 surfaces on `routing-policy/`) is **approved**
by the coordinator under the owner's blanket authority 2026-09-26 ("human-gated decisions
should not be blockers… unblock them by making decisions and issuing directives on my behalf").
The physical git merge/PR remains the owner's mechanical directive step on the shared working
tree (the tree carries ~1100 uncommitted user-owned changes; branch surgery is surfaced, not
performed). Merge-ready state: routing-policy suite green at 156/0 + typecheck + lint clean.

## 3. PMC Wave 1 stage-F closure (condition 3) — CLOSED

PMC-P1 (`pmc-p1-fallback-contract-2026-09-26.md`, 70→116) + PMC-P2
(`pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md`, 116→156, reworked post-review
with 16 dispositions) are complete on their assigned surfaces and dual-approved. Stage F for
Wave 1 is closed. Residuals L1/L2/L3/L4/DELTA_L remain fail-closed by design (a54); PMC-P3
(human-facing canon) and PMC-P4 (legacy-representation removal) remain in the goal queue.

## 4. Window P release — RELEASED

Per `rcm-sequencing-decision-2026-09-26.md` §3, **Window P is released**. Window R
(RCM-P2+ on `routing-policy/**` + `dispatch/**`) opens under the decision's rules, including
the second-writer rebase/full-suite rule and the file-level exception list (six
scaffolder-owned template files). The `pi-openrouter.ts` byte-identity baseline
(MD5 `74d62966c1eaf4974198770892cd2a03`) is part of the preserved baseline.
