# Control Center — Task List (FCA-P2–FCA-P6)

Companion to `tasks/plan.md`. Verification commands unless noted:
`cd plugins/foreman-line/ops-console && npm test && npm run typecheck && npm run lint`
(package sweep) and `node scripts/validate-*.js` at repo root (root validators).

---

## Task 1: Fleet registry model + persistence ✅ (2026-10-11)

**Description:** `fleet.ts` — declared, ordered, deduplicated fleet of absolute
repo roots with identity (remote, default branch, HEAD) and liveness
(ready/absent/invalid). Generalizes `FOC_EXTRA_ROOTS` as `FOC_FLEET`; legacy
env keeps working. Typed refusals per FCA-P2 (D1-style).

**Acceptance criteria:**
- [x] add/remove round-trips; primary root removal refused (`root-primary-immutable`)
- [x] relative/absent/non-git/duplicate roots refused typed, registry unchanged
- [x] corrupt persisted state refused typed; clean round-trip on valid state

**Verification:**
- [x] Tests pass: `tests/fleet.test.ts` (new) — 8/8
- [x] Package sweep + root validators green (259/259, typecheck, lint)
- [x] Manual: typed refusals exercised via probe fakes (root-not-absolute / root-absent / not-a-git-work-tree / duplicate-root / fleet-state-corrupt)

**Dependencies:** None
**Files likely touched:** `src/fleet.ts`, `src/config.ts`, `tests/fleet.test.ts`
**Estimated scope:** M

---

## Task 2: Fleet API (identity + liveness, add/remove) ✅ (2026-10-11)

**Description:** Wire `GET /api/fleet`, `POST /api/fleet/add|remove` through
`api.ts`/`server.ts` reusing existing request/validation patterns.

**Acceptance criteria:**
- [x] `GET /api/fleet` returns every root with identity + liveness
- [x] add/remove validate before write; refusals typed and non-mutating
- [x] Body/method handling matches existing API conventions (POST-only writes)

**Verification:**
- [x] Tests pass: `tests/fleet-api.test.ts` (new, handler-level — 6/6; kept separate from `api.test.ts` for focus)
- [ ] Package sweep green
- [x] Manual: real-repo smoke — identity `m0r6aN/agent-skills`/`main`, scratch-repo add/remove, duplicate + primary-immutable refusals

**Dependencies:** Task 1
**Files likely touched:** `src/api.ts`, `src/server.ts`, `tests/api.test.ts`
**Estimated scope:** S

---

## Task 3: Sandboxed filesystem browse + folder qualification ✅ (2026-10-11)

**Description:** `GET /api/fs/browse?path=` — one-level read-only listing
(name, type, git-worktree flag). Absolute paths only; symlink escapes refused;
no file contents ever.

**Acceptance criteria:**
- [x] One level per call; git work trees flagged (`.git` present)
- [x] relative paths and symlink escapes refused typed
- [x] no file contents returned in any response shape

**Verification:**
- [x] Tests pass: `tests/browse.test.ts` (new; symlink fixture — 4/4)
- [ ] Package sweep green
- [x] Manual: browse smoke over `/tmp/fleet-smoke` — work-tree flags + `path-not-absolute`/`path-absent` refusals

**Dependencies:** Task 2
**Files likely touched:** `src/browse.ts`, `src/api.ts`, `tests/browse.test.ts`
**Estimated scope:** M

---

## Checkpoint: Foundation
- [ ] Full sweep green (package + root validators)
- [ ] Manual: add + remove a real repo through the API
- [ ] Review with human before proceeding

---

## Task 4: Signal type, provider interface, `/api/signals` shell, parcel-state wrapper ✅ (2026-10-11)

**Description:** `signals.ts` — `Signal { id, class, severity, repo, subject,
evidence[], detectedAt, actions[] }`, closed class vocabulary, provider
interface (pure derivation on scan), query endpoint. Wrap the existing FOC-P0
parcel projection as the first provider.

**Acceptance criteria:**
- [x] signal construction refuses empty evidence or unknown class
- [x] `GET /api/signals` filters by repo/class/severity
- [x] parcel-state provider reproduces current projection output as signals

**Verification:**
- [x] Tests pass: `tests/signals.test.ts` (new — 4/4)
- [ ] Package sweep green

**Dependencies:** Task 2
**Files likely touched:** `src/signals.ts`, `src/api.ts`, `src/status.ts`, `tests/signals.test.ts`
**Estimated scope:** M

---

## Task 5: release-hygiene provider ✅ (2026-10-11)

**Description:** Detect manifest/marketplace version disagreement, stale
version references in docs, content landed under a stale version string, and
unclaimed CHANGELOG backlog vs released version (the 0.2.1 finding class).

**Acceptance criteria:**
- [x] version-drift fixture yields one signal per stale location (manifest, marketplace, README)
- [x] unclaimed-backlog signal cites the `Unreleased` section and released version
- [x] clean fixture yields zero signals

**Verification:**
- [x] Tests pass: `tests/signals-release.test.ts` (new — 3/3; real-repo smoke: 1 true backlog signal, 0 false drift)
- [ ] Package sweep green

**Dependencies:** Task 4
**Files likely touched:** `src/signals-release.ts`, `tests/signals-release.test.ts`
**Estimated scope:** M

---

## Task 6: worktree-hygiene provider + lumber-jack evidence mapping ✅ (2026-10-11)

**Description:** Detect uncommitted/untracked churn, long-lived dirty state
files, unpushed commits, stale local branches. Map lumber-jack skill findings
in as provider evidence where appropriate (owner directive).

**Acceptance criteria:**
- [x] dirty/untracked/unpushed/stale-branch fixtures each yield the right signal with paths/refs as evidence
- [x] clean repo fixture yields zero signals
- [x] lumber-jack-derived evidence is labeled as such in `evidence[]`

**Verification:**
- [x] Tests pass: `tests/signals-worktree.test.ts` (new — 6/6 incl. real-git regression test; real-repo smoke caught + fixed 2 probe bugs)
- [ ] Package sweep green

**Dependencies:** Task 4
**Files likely touched:** `src/signals-worktree.ts`, `tests/signals-worktree.test.ts`
**Estimated scope:** M

---

## Checkpoint: Signals (mid)
- [ ] Provider fixtures green; clean-repo negative cases pass
- [ ] Review with human before proceeding

---

## Task 7: scm-ci provider (`gh` read-only + graceful degradation)

**Description:** PR/CI semantics: green-but-do-not-merge, conflicting+red,
BEHIND under strict ruleset, merged missing a release event. Read-only `gh`
queries behind an injectable client (mocked in tests); `gh`/network absence
degrades to one `info` signal.

**Acceptance criteria:**
- [ ] mocked `gh` fixtures produce each named signal class correctly
- [ ] no live network in tests; injectable client seam
- [ ] `gh` absence produces exactly one `info` signal, no throw

**Verification:**
- [ ] Tests pass: `tests/signals-scm.test.ts` (new)
- [ ] Package sweep green

**Dependencies:** Task 4
**Files likely touched:** `src/signals-scm.ts`, `tests/signals-scm.test.ts`
**Estimated scope:** M

---

## Task 8: goal-hygiene provider + FCA-2 attention-count integration

**Description:** Goal records needing attention beyond parcel state (missing
ratification records, stale loop-directive states). Feed signal severities into
the FCA-2 attention counts.

**Acceptance criteria:**
- [ ] goal-hygiene fixtures yield evidence-backed signals
- [ ] FCA-2 attention counts include signal severities (updated snapshot tests)
- [ ] board `needs` treatment reflects urgent signals

**Verification:**
- [ ] Tests pass: `tests/signals-goal.test.ts` + updated derive snapshots
- [ ] Package sweep green

**Dependencies:** Task 4
**Files likely touched:** `src/signals-goal.ts`, `src/derive.ts`, `tests/signals-goal.test.ts`
**Estimated scope:** S

---

## Checkpoint: Signals (complete)
- [ ] All five classes emit evidence-backed signals; filters verified
- [ ] Review with human before proceeding

---

## Task 9: ActionSpec registry + typed refusals + audit entries

**Description:** `actions.ts` — closed registry mapping (class × verb) →
`ActionSpec { invocation, promptTemplate, autonomy, destructive }`. Baseline
verbs: investigate, remediate, explain, close-delete. Every dispatch appends an
audit entry (executed/presented/spawned/refused). `execute` registration for
mutating verbs must be impossible.

**Acceptance criteria:**
- [ ] unregistered (class, verb) pairs refused typed + audited
- [ ] `execute` cannot be registered for any mutating verb (type + runtime guard)
- [ ] audit entries cover all four outcomes with reason/argv

**Verification:**
- [ ] Tests pass: `tests/actions.test.ts` (new)
- [ ] Package sweep green

**Dependencies:** Task 4
**Files likely touched:** `src/actions.ts`, `src/invoke.ts`, `src/guards.ts`, `tests/actions.test.ts`
**Estimated scope:** M

---

## Task 10: Prompt templates + composition for baseline verbs

**Description:** Kickstarter-style plain-text templates per baseline verb:
signal evidence, restated task, boundaries (no self-graded verification),
autonomy envelope verbatim, Stage-F fail-closed sentence for merge. Optional
textbox text appended verbatim.

**Acceptance criteria:**
- [ ] composition is pure and snapshot-tested per verb
- [ ] autonomy envelope appears verbatim; merge sentence present regardless of merge toggle
- [ ] textbox text appended verbatim to every composed prompt

**Verification:**
- [ ] Tests pass: `tests/prompts.test.ts` (new)
- [ ] Package sweep green

**Dependencies:** Task 9
**Files likely touched:** `src/prompts.ts`, `tests/prompts.test.ts`
**Estimated scope:** M

---

## Task 11: Destructive guard + typed-confirmation contract

**Description:** `close-delete` (and any future destructive verb) requires an
explicit typed intent before any request is honored; never silent. Shared
contract used by the API and mirrored by the UI later.

**Acceptance criteria:**
- [ ] destructive dispatch without typed confirmation refused + audited
- [ ] confirmation token binds to the specific subject (replay of another subject refused)
- [ ] non-destructive verbs unaffected

**Verification:**
- [ ] Tests pass: `tests/guards-destructive.test.ts` (new)
- [ ] Package sweep green

**Dependencies:** Task 9
**Files likely touched:** `src/guards.ts`, `src/api.ts`, `tests/guards-destructive.test.ts`
**Estimated scope:** S

---

## Checkpoint: Actions
- [ ] Registry matrix + prompt snapshots green
- [ ] Review with human before proceeding

---

## Task 12: Spawn planner (pure) + harness argv builders + refusal matrix

**Description:** Pure planner: (ActionSpec × spawn controls) → spawn plan (one
tmux session, K panes; per-pane argv for `pi`/`claude` incl. model/thinking/
budget flags, cwd = a fresh git worktree cut from the signal's repo root
(2026-10-11 owner ruling — "hygiene is a must"; path recorded for reaping),
prompt payload). Verify real harness flags first (fail-fast spike); unsupported
combinations refused typed before any process starts.

**Acceptance criteria:**
- [ ] K selected actions → exactly 1 session, K panes; deterministic snapshot tests
- [ ] argv builders reflect verified real flags for both harnesses
- [ ] unsupported control combos refused typed in the plan stage
- [ ] each pane's cwd is a fresh worktree; the plan records its path for the spawn receipt

**Verification:**
- [ ] Tests pass: `tests/spawn-plan.test.ts` (new; argv snapshots)
- [ ] Package sweep green
- [ ] Manual: `pi --help` / `claude --help` flag verification recorded in goal transcripts

**Dependencies:** Task 10
**Files likely touched:** `src/spawn.ts`, `src/harness.ts`, `tests/spawn-plan.test.ts`
**Estimated scope:** M

---

## Task 13: tmux launcher (stub-tested) + partial-failure audit

**Description:** Thin launcher executing a spawn plan via `tmux new-session` +
`split-window` per additional pane. tmux absence → `tmux-unavailable` typed
refusal (never headless fallback). Partial failure audits the whole plan state.

**Acceptance criteria:**
- [ ] launcher passes the plan to a stubbed `tmux` binary verbatim (tests)
- [ ] `tmux-unavailable` refusal is typed; no fallback execution path exists
- [ ] partial failure records audited partial plan + typed error; no silent retries

**Verification:**
- [ ] Tests pass: `tests/spawn-launch.test.ts` (new; tmux stub)
- [ ] Package sweep green

**Dependencies:** Task 12
**Files likely touched:** `src/spawn.ts`, `src/invoke.ts`, `tests/spawn-launch.test.ts`
**Estimated scope:** M

---

## Task 14: Spawn receipts + `/api/spawns` + pane liveness

**Description:** Append-only spawn receipts (session/pane ids, harness, model,
thinking, budget, autonomy, repo root + worktree path, prompt digest) exposed
via `GET /api/spawns`; pane liveness (alive/dead/exited) projects back as
FCA-P3 `session-state` signals (class decided 2026-10-11: own closed class,
not folded into `goal-hygiene`).

**Acceptance criteria:**
- [ ] receipts round-trip via `GET /api/spawns` with liveness states
- [ ] prompt digest (sha256) stored; full prompt reproducible from audit + templates
- [ ] dead/exited panes surface as `session-state` signals

**Verification:**
- [ ] Tests pass: `tests/spawns-api.test.ts` (new)
- [ ] Package sweep green

**Dependencies:** Task 13
**Files likely touched:** `src/spawn.ts`, `src/liveness.ts`, `src/api.ts`, `tests/spawns-api.test.ts`
**Estimated scope:** M

---

## Checkpoint: Spawn
- [ ] Planner/launcher/receipt tests green
- [ ] One real-tmux manual smoke documented in goal transcripts
- [ ] Review with human before proceeding

---

## Task 15: Layout shell (full-viewport grid, rails, view nav, density baseline)

**Description:** Rebuild `ui/index.html`/`ui/app.js` shell per FCA-P6: header
(fleet switcher, posture, search), left rail (views + severity filters), dense
main grid, persistent right spawn panel slot, collapsible session tray. Views
wired to existing endpoints; no build step; ES modules OK.

**Acceptance criteria:**
- [ ] 1920×1080 shows header + rail + board + spawn panel + collapsed tray with no page scroll
- [ ] all views render against mocked fetch with zero console errors
- [ ] keyboard reachability + focus rings + aria labels on icon-only controls

**Verification:**
- [ ] Tests pass: `tests/ui-shell.test.ts` (new; mocked fetch, DOM harness devDep only)
- [ ] Package sweep green
- [ ] Manual: Firefox + Chromium smoke

**Dependencies:** Task 4
**Files likely touched:** `ui/index.html`, `ui/app.js`, `ui/views/*.js`, `tests/ui-shell.test.ts`
**Estimated scope:** M

---

## Task 16: Signals view + action buttons + bulk select + destructive confirm

**Description:** Signal rows/cards with evidence, severity treatment, registered
verb buttons (only allowed verbs render), checkboxes + Shift-select ranges,
autonomy popovers per action, typed confirmation flow for destructive verbs.

**Acceptance criteria:**
- [ ] only registered (class × verb) pairs render buttons; others absent, not disabled
- [ ] N selected rows → request carries N actions + per-action autonomy
- [ ] destructive actions require typed confirmation before any request is sent

**Verification:**
- [ ] Tests pass: `tests/ui-signals.test.ts` (new)
- [ ] Package sweep green

**Dependencies:** Tasks 9, 15
**Files likely touched:** `ui/views/signals.js`, `ui/app.js`, `tests/ui-signals.test.ts`
**Estimated scope:** M

---

## Task 17: Spawn panel (shared controls + autonomy popovers) + spawn wiring

**Description:** The four shared dropdowns (Harness, Model, Thinking, Budget
cap — presets `$1–$100`, no unlimited) + optional textbox + Spawn button with
selected count; never repeated per action. Emits one `/api/spawn` request per
FCA-P5.

**Acceptance criteria:**
- [ ] one spawn request carries K actions + the shared controls + textbox verbatim
- [ ] request composition matches FCA-P5 planner input snapshot in tests
- [ ] controls render once; no per-action duplication anywhere

**Verification:**
- [ ] Tests pass: `tests/ui-spawn-panel.test.ts` (new)
- [ ] Package sweep green

**Dependencies:** Tasks 16, 12
**Files likely touched:** `ui/views/spawn-panel.js`, `ui/app.js`, `tests/ui-spawn-panel.test.ts`
**Estimated scope:** M

---

## Task 18: Fleet view + filesystem folder picker

**Description:** Fleet tiles (identity + liveness) with add/remove; folder
picker driven by `/api/fs/browse` (keyboard navigable), qualification hints
from Task 3.

**Acceptance criteria:**
- [ ] browse → select → add completes end-to-end against mocked API in tests
- [ ] refusal reasons render inline on failed add
- [ ] remove on the primary root shows the typed refusal, not a crash

**Verification:**
- [ ] Tests pass: `tests/ui-fleet.test.ts` (new)
- [ ] Package sweep green

**Dependencies:** Tasks 3, 15
**Files likely touched:** `ui/views/fleet.js`, `ui/app.js`, `tests/ui-fleet.test.ts`
**Estimated scope:** S

---

## Task 19: Session tray + attach copy + visual checklist

**Description:** Tray of spawns (pane liveness, harness, model, repo), copyable
attach command, per-session actions via the same registry; virtualization past
200 rows; final visual checklists.

**Acceptance criteria:**
- [ ] tray renders liveness transitions from `/api/spawns` polling
- [ ] attach command copy works; per-session explain/close routed through registry
- [ ] 200+ rows virtualize without UI jank

**Verification:**
- [ ] Tests pass: `tests/ui-tray.test.ts` (new)
- [ ] Package sweep green
- [ ] Manual: visual checklist at 1920×1080 + 1366×768 in goal transcripts

**Dependencies:** Tasks 14, 15
**Files likely touched:** `ui/views/tray.js`, `ui/app.js`, `tests/ui-tray.test.ts`
**Estimated scope:** M

---

## Checkpoint: Complete
- [ ] All FCA-P2…P6 acceptance criteria met
- [ ] Visual checklists recorded; Firefox + Chromium clean
- [ ] Review with human before closing the goal slice
