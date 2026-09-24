# Builder dispatch — PMC-P0 (Pi capability and catalogue baseline)

**Gate 2:** granted by Clinton Morgan on 2026-09-24 for **PMC-P0 only**.
**Role:** builder. You are not the coordinator, not a reviewer, not the owner.
**Session shape:** fresh session, this brief plus the pinned spec only.

## Pinned execution context — verify before anything else

| Field | Required value |
|---|---|
**Refusal gates — all four must hold, or stop and report.** These are content
identities, deliberately not a commit SHA: coordinator bookkeeping commits on
this branch legitimately move the tip, and a stale SHA pin would force a false
refusal.

| # | Gate | Required value |
|---|---|---|
| G1 | Worktree path | `D:/Repos/wt-pmc-p0` — do **not** work in `D:/Repos/agent-skills` |
| G2 | Branch | `codex/pmc-p0-evidence` |
| G3 | Spec SHA-256 | `82d7819c63e59626ff57495ca84c0d386e091f5f9e4c6076c476a253f30b5b71` at `plugins/foreman-line/docs/specs/active/PMC-P0-pi-capability-and-catalogue-baseline.md`, with `status: active` |
| G4 | Worktree state | clean (`git status --short` empty) before you start |

Also confirm this brief is **present** at
`plugins/foreman-line/docs/kickstarters/foreman-line-build-PMC-P0.md` and report
its observed SHA-256 and byte size. Do not compare that digest against a value
quoted inside this file: a document cannot carry its own hash. The authoritative
brief digest is recorded in the coordinator's dispatch record
(`docs/goals/pi-model-configuration/loop-directive.md`), and the coordinator
verifies it. If the brief is absent, stop — that was a real defect once already.

**Informational, not a gate:** the branch was created from
`2f6c79446a2eeb9f766f22c759721cb91ffa6e67`; the spec was promoted at
`96a24bf7ab3669b79ff7d0b004466846051c6d71`. Record the tip SHA you observe via
`git rev-parse HEAD` and report it. Do **not** refuse on it, and do **not**
advance, rebase, reset, or amend it.

**Do not use** `codex/refresh-actions-and-packages`. That branch is shared, has
advanced to unrelated PRAC work, and a second live session writes to it; the
main checkout has since moved to another branch entirely.

If G1–G4 or the brief check fails, **stop and report**. Do not "fix" it.

## Step 0 — restate and STOP

Before reading further into the repo and before any write, produce:

1. The four exact file paths you are authorized to create or edit.
2. The eleven-word-or-less statement of what this parcel produces.
3. Your confirmation of the pinned HEAD, branch, and spec digest, each as the
   command you ran and its raw output.
4. The two AC2 classes, by count, and what an AC2b zero match means.
5. Every prohibition you believe applies, including read prohibitions.
6. Any flag: a spec gap, contradiction, missing source, or instruction you
   cannot satisfy without exceeding scope.

**Then stop and wait for the coordinator's ruling.** Do not begin evidence
collection in the same turn. A real spec gap becomes a ratified amendment
committed alone before any evidence work; you never patch the spec yourself.

## Your authority, in full

You may create or edit **only** these four files:

- `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-capability-baseline.md`
- `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-suitability-rubric.md`
- `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-role-lane-map.md`
- `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p0-verification.md`

Everything else in the repository is a forbidden write, **including the spec
itself** — its frontmatter, its `status`, and its acceptance checkboxes.

## Prohibitions — all remain in force

- **No provider calls.** No network request, no inference, no spend, no
  availability probe of any kind.
- **No credential or host reads.** Not host `settings.json`, not
  `models-store.json`, not auth files, not credential stores, not `headers`
  fields, not any secret-bearing URL. Do not guess home directories, enumerate
  environment variables, or launch Pi (it may refresh or write its cache).
- **No export modification.** Do not modify, regenerate, move, or publish a
  replacement host-owner export or hash. Locally recomputing SHA-256 solely to
  verify the three pinned digests **is required**.
- **No settings, policy, schema, template, test, or source changes.** Including
  `routing-policy.yaml`, `src/validator.ts`, `KNOWN_FRONTIER_MODELS`, and the
  Jev policy/test gap the spec tells you to *record*, not fix.
- **No model enablement** and no presenting a settings edit as executed.
- **No RCM coordination action.** Do not contact, notify, or act on the RCM
  coordinator, and do not send, edit, or cite the unsent RCM sequencing draft.
- **No dependency installation.** The fresh worktree has no `node_modules`; the
  spec's verification commands deliberately need only `git`, `node -v`,
  `Get-FileHash`, and `Select-String`. If something appears to need `npm
  install`, that is a flag, not a task.
- **No promotion, commit of the spec, merge, release, receipt, kickstarter,
  `ShapingResult`, or dispatch** of reviewers or other builders.
- **No goal-file edits:** charter, amendments 01–03, coordinator lint, loop
  directive, `docs/goals/INDEX.md`, the RCM tree, the PRAC tree, HAWF, GMF, or
  boundary-routing.

## The two traps in this parcel

Read these twice; both have already caused a stop in this goal.

1. **AC2b is not a resolution failure.** Bindings 1
   (`opencode/claude-opus-5-5`) and 10 (`openrouter/anthropic/claude-opus-5.5`)
   are **owner-attested** under Amendment 03. The frozen catalogue **predates**
   that amendment. Running the literal query and getting **zero matches is the
   expected, correct outcome.** Record
   `OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY`, report the raw result marked
   non-authoritative, mark unavailable capability fields `unknown`, and do
   **not** call it a refusal, a failure, a contradiction of Amendment 03, or
   count it against the AC2a thirteen. Reporting it as a contradiction is a
   wrong-shaped claim.
2. **The export is never an availability oracle.** It is `static-conformance`
   evidence only, with freshness **not accepted** and known stale on the Opus
   identity. Catalogue presence is not uptime. An absent record is not a
   verified absence. Every live, reachability, and quality claim is held for A6.

## Completion claim shape

Return, mapped **AC by AC** (AC1–AC8):

- the evidence supporting each criterion, by artifact path and section;
- exact commands with **raw output and exit codes**, untruncated;
- the three export digests you recomputed, against the three pinned values;
- counts stated as `13` AC2a and `2` AC2b, and enablement as `n of 15`;
- every refusal, `unknown`, `capability-unverified`, and held claim, by name;
- tool versions;
- `git status --short` before and after, plus an allowed-path audit proving the
  diff is exactly the four files;
- your open flags.

A claim not in this shape is presumptively empty. A documented blocked or
refused result is **not** a clean pass, and it is an acceptable outcome — an
honest refusal beats a manufactured success. You do not verify your own work:
the coordinator plus **two** independent frontier adversarial reviews decide
acceptance.

## Stop conditions

Stop and report on: a pinned-value mismatch; a digest mismatch or missing export
file; any route that would read a credential; ambiguous, duplicate, or
multi-match identity; endpoint mismatch; a ranking input that cannot be
populated without a provider call; an unauthorized write or effect; a file
collision with RCM, PRAC, or another live goal; pressure to freeze the role map,
promote the spec, reconcile the Jev gap, or install dependencies; or evidence
contradicting Amendment 01, 02 M2–M4, or 03 — **excluding** the expected AC2b
stale-export result. Record safe refusal detail only; never quote a suspect
payload. No repeated attempt may bypass a refusal.
