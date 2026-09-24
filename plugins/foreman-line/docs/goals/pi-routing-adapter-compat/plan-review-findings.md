# Plan-Level Adversarial Review — `pi-routing-adapter-compat`

**Reviewed:** `charter.md` (ratified Gate 1, 2026-09-24)
**Method:** fresh adversarial seats, zero coordinator context beyond the brief + repo canon.
**Seats:** orchestrator (this session), Claude CLI 2.1.280, Codex CLI 0.153.4. Grok/Gemini
not run this round (2026-09-23 audit found Grok headless-unavailable and Gemini auth-tier
blocked). Quorum = 2 seats + orchestrator: **met.**

**Post-script (2026-09-24, at Gate 1 re-ratification):** the pinned Pi version drifted
**0.86.1 → 0.87.1** between this review and ratification (the installed package updated),
live-confirming finding #9. The charter's version pin was re-anchored to 0.87.1 at
ratification.
**Brief:** `plan-review/plan-review-brief.md` · **seat outputs:** `plan-review/{own,claude,codex}-out.txt`

## Findings and triage

| # | Finding | Seats | Triage |
|---|---|---|---|
| 1 | **Absence ≠ evidence-of-absence, and exit-3 presets the answer.** Searching docs/examples can only prove "not found in the documented surface," not "does not exist"; pre-deciding the three APIs are "absent" rewards confirmation, so the gate is satisfied even while a real hook exists elsewhere. | orchestrator F1 · Claude F1/F2 · Codex F2 (**convergent, 3/3**) | **FIX** |
| 2 | **The probe as scoped is not executable.** The `pi` API exists only inside a *loaded* extension; loading one requires writing `~/.pi/agent/extensions/` (forbidden by D6), and a stdlib-only Node script cannot load TypeScript. As written it collapses to a docs grep — the exact class of unverified evidence OQ1 chose the probe to close. | Claude F2 · Codex F1 (**convergent, 2/3**) | **FIX** — respec the probe |
| 3 | **Missing work: an immutable runtime-evidence snapshot.** Nothing pins the resolved package root, version, inspected-file list + hashes, or probe exit status, so an npm/global update silently changes the thing the memo purports to describe. | Codex F3 · Claude F4 (**convergent, 2/3**) | **FIX** |
| 4 | **Write-scope contradictions / out-of-dir hazards.** The parcel spec lives under `docs/specs/active` and moves to `done/`; lessons append under `docs/transcripts/`; the coordinator adds an `INDEX.md` row — three paths outside the goal dir that D6/exit-6 do not enumerate. Worse, `routing-policy/` carries **uncommitted edits** a goal merge would absorb, making "no writes outside goal dir" unprovable without a git baseline. | Claude F3 · orchestrator F3 · Codex F5 (**convergent, 3/3**) | **FIX** |
| 5 | **"Real equivalents named" silently invites design.** `pi.setModel` / `pi.setThinkingLevel` are documented calls, not demonstrated semantic equivalents of a `beforeLLMTurn` session hook; calling them "equivalents" can authorize the rejected adapter by implication. | Codex F4 · Claude F5 · orchestrator F5 (**convergent, 3/3**) | **FIX** |
| 6 | **D5 makes a forward routing claim; D2's pointer-only rule is at risk.** "A future adapter would run inside D7/D8 under routing-policy" predicts a future design; "equivalent surface" is a D1-forbidden intent judgment; grep cannot distinguish a quoted API name from an asserted one. | Claude F5 (**unique, reproduced against charter wording**) | **FIX** |
| 7 | **The proposal source is outside the repo.** A "verbatim restate" of `C:/Users/clint/.../directive.md` is unreviewable in-repo — a reviewer cannot see what was restated. | Claude F4 (**unique, verified: source is external**) | **FIX** — snapshot excerpt + hash |
| 8 | **The memo has no discoverability, and unreserved evidence filenames can collide** with a later compatibility pass. | orchestrator F2 · Codex F5 (**convergent, 2/3**) | **FIX** — versioned evidence dir + INDEX pointer |
| 9 | **D3 pins a version string but no content hash**, so "0.86.1" can drift under its own path. | Claude F4 (**unique, verified**) | **FIX** — fold into snapshot |
| 10 | **`pi-jev-budget-guard` is walled off even from reading**, though it is the best real-surface evidence. | Claude F4 (**unique**) | **Accept-as-documented** — keep the mutation wall-off (safest); the memo may cite the extension's *existence* (already-public host state) but not read its internals. |
| 11 | **Single parcel + memo-only shape is exactly right** for a fact-finding goal with no authority surface. | Codex F1 · orchestrator · Claude (agreement) | **Informational** — confirms D8 |

## Triage outcome

Nine FIX items, one accept-as-documented, one informational. The FIX items **refine** D4, D5,
D6, D7 and the exit criterion and **add** D9/D10; they do **not** change the ratified scope
(memo-only, one parcel, goal-directory-only writes, no adapter, no contract/resolver/ledger).
No locked decision is reversed; none of the amendments reopen the *objective*, only the
wording/mechanism of the affected decisions.

## Amendment list (folded into `charter.md`)

- **D4** — add a bounded absence-evidence rule: "absent" means "not found in the enumerated
  0.86.1 package surface (docs index + examples catalog + shipped `.d.ts`), as recorded by
  the probe," never "does not exist at runtime."
- **D5** — pointer-only, no forward prediction, no restated reasoning; every real API named
  as present is explicitly paired with "present, and still not an authorization to route."
- **D6** — enumerate in-scope writes: goal dir; parcel spec (`docs/specs/`, incl. active→done
  move); lessons append; the one `INDEX.md` row. Require a pre-dispatch `git status` baseline
  and pathspec-scoped merge.
- **D7** — respec the probe: read-only package resolver + version assert + inspected-file
  hashes + name grep over docs/examples/shipped types; reports "absent from the enumerated
  shipped 0.86.1 surface"; exits non-zero on missing path or version mismatch; does **not**
  load Pi or register an extension.
- **D9 (new)** — immutable evidence snapshot at `evidence/pi-0.86.1/` (version, package root,
  enumerated hashes, probe command + output + exit status).
- **D10 (new)** — the directive's restated API claims are snapshotted into the goal dir with a
  hash before restatement, so they are reviewable in-repo.
- **Exit criterion 2** — require the recorded probe output + hashes + exit status.
- **Exit criterion 3** — each proposal API gets a *verified disposition* (present /
  absent-from-enumerated-surface / unverifiable), not a pre-decided "absent"; nearest
  documented surface named and flagged not-an-authorization.
- **Exit criterion 5** — negative control checks recorded dispositions, zero routing-design
  content, and verbatim pointer-only governance template.
- **Exit criterion 6** — merge diff is exactly D6's enumerated paths, verified against the
  git baseline.
