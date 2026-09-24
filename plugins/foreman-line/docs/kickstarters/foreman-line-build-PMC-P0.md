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
| G3 | Spec SHA-256 | `133a7690b865d460586e77fb3ee5440116513272db299eceb52b09f8f81b72eb` at `plugins/foreman-line/docs/specs/active/PMC-P0-pi-capability-and-catalogue-baseline.md`, with `status: active` (re-promoted under Amendment 04) |
| G4 | Worktree state | clean (`git status --short` empty) before you start |

Also confirm this brief is **present** at
`plugins/foreman-line/docs/kickstarters/foreman-line-build-PMC-P0.md` and report
its observed SHA-256 and byte size. Do not compare that digest against a value
quoted inside this file: a document cannot carry its own hash. The authoritative
brief digest is recorded in the coordinator's dispatch record
(`docs/goals/pi-model-configuration/loop-directive.md`), and the coordinator
verifies it. If the brief is absent, stop — that was a real defect once already.

**Informational, not a gate:** the branch was created from
`2f6c79446a2eeb9f766f22c759721cb91ffa6e67`; the spec was first promoted at
`96a24bf7ab3669b79ff7d0b004466846051c6d71` and **re-promoted under Amendment 04**
(the digest in G3 above is the current authoritative one). Record the tip SHA you
observe via `git rev-parse HEAD` and report it. Do **not** refuse on it, and do
**not** advance, rebase, reset, or amend it.

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
- **No goal-file edits:** charter, amendments 01–04, coordinator lint, loop
  directive, `docs/goals/INDEX.md`, the RCM tree, the PRAC tree, HAWF, GMF, or
  boundary-routing.

## The traps in this parcel

Read these twice; the first two have already caused a stop in this goal, and the
third and fourth are the Amendment 04 clarifications that end the binding-7 and
endpoint-divergence stops.

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
3. **AC2a binding 7 is a documented refusal, not a failure (Amendment 04, D-b1).**
   Twelve of the thirteen AC2a bindings resolve to exactly one catalogue record.
   Binding 7 (`opencode/qwen3.8-flash`) returns **zero matches** because the
   `qwen3.8-flash` id lives only under providers `opencode-go` and
   `qwen-token-plan`, never `opencode`. That zero match is the **expected,
   acceptable AC2a evidence outcome**: record the named refusal `AC2A_ZERO_MATCH`
   with the raw query; do **not** alias `opencode-go`→`opencode`, do **not**
   reclassify it as owner-attested, and do **not** treat it as a stop or count it
   against the thirteen as a pass. Its L5/L6 roles are held to A6 and PMC-P2.
4. **Endpoint divergence is a finding, not a refusal (Amendment 04, D-a1).** A
   catalogue `baseUrl` that differs from a `settings-projection.json` registered
   provider `baseUrl` or from `routing-policy/src/pi-openrouter.ts` is a
   `static-conformance` **finding for PMC-P1/PMC-P2**, never an AC2a refusal and
   never an availability/absence claim. Do **not** stop on it. "URL mismatch"
   refuses **only** when the same literal `provider`+`id` resolves to duplicate
   or inconsistent `baseUrl` values **within the catalogue**.

## Completion claim shape

Return, mapped **AC by AC** (AC1–AC8):

- the evidence supporting each criterion, by artifact path and section;
- exact commands with **raw output and exit codes**, untruncated;
- the three export digests you recomputed, against the three pinned values;
- counts stated as `13` attempted under AC2a (`12` literal resolutions + `1`
  documented `AC2A_ZERO_MATCH` refusal for binding 7, per Amendment 04 D-b1) and
  `2` under AC2b, and enablement as `n of 15`;
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
multi-match identity; endpoint mismatch **within a single literal identity** (a
catalogue-internal inconsistent `baseUrl` — a catalogue-vs-settings/contract
divergence is a recorded static-conformance finding per Amendment 04 D-a1, not a
stop); a ranking input that cannot be populated without a provider call; an
unauthorized write or effect; a file collision with RCM, PRAC, or another live
goal; pressure to freeze the role map, promote the spec, reconcile the Jev gap,
or install dependencies; or evidence contradicting Amendment 01, 02 M2–M4, 03, or
04 — **excluding** the expected AC2b stale-export result, the expected binding 7
`AC2A_ZERO_MATCH` refusal (acceptable evidence per Amendment 04 D-b1), and
catalogue-vs-settings/contract endpoint divergences (static-conformance findings
per Amendment 04 D-a1). Record safe refusal detail only; never quote a suspect
payload. No repeated attempt may bypass a refusal.
