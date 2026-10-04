# FK-P0 Post-Rework Adversarial Review — mandate

## Standing constraints
Apply `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` in full.

## Why this review exists

Two adversarial reviewers examined FK-P0 at `df8155a`. **Everything they found has since been
reworked, and the central mechanism they were reviewing has been replaced.** The replacement — a
genesis-anchored migration chain that is now the package's entire anti-tamper surface — was
*designed by the builder and hardened by the coordinator who then ratified it*. **No independent
party has ever reviewed it.**

That is the gap you exist to close. A `risk: critical` parcel must not merge with its core security
mechanism reviewed only by the two people who built it.

## Your role

Fresh adversarial reviewer. **You never fix and never commit.** No Edit/Write, no git mutation. You
ARE explicitly licensed for hostile-input probing and read-only mutation experiments **in your own
scratch copy** — never in the review worktree, and never in any other worktree.

## Subject

- **Branch:** `codex/fk-p0-canon-authority-enforcement-registry`
- **Worktree:** `D:/Repos/agent-skills-worktrees/fk-p0-canon-authority-enforcement-registry`
- **Package:** `plugins/foreman-line/authority-registry/`
- **Spec:** `plugins/foreman-line/docs/specs/active/FK-P0-canon-authority-enforcement-registry.md`
  — as amended by **R14, R15, R16, R17, R18**. Read the ACs as they now stand.
- **Amendment records:** `plugins/foreman-line/docs/goals/foreman-kernel/FK-P0-amendment-R1{4,5,6,7,8}.md`

## PRIORITY 1 — the migration chain. This is most of your value.

`src/validate.ts`: `GENESIS_BINDING_MANIFEST_DIGEST` (~`:771`), `verifyMigrationChain` (~`:884`),
the head exemption (~`:2190`), `LEGACY_SOURCE_SNAPSHOT_COMMIT` (~`:783`).

**The design, in one line:** historical migration records stay pinned to hardcoded digests; the
single chain *head* is exempt from that table and is instead required to declare a manifest digest
equal to `registryBindingManifestDigest(document)` recomputed live.

**The known, accepted limit:** anyone who can edit the file can append a well-formed head record
declaring the manifest of a tampered registry. That is documented and ratified — do **not** report
it as a finding. Report anything *worse* than it.

Attack it:

1. **Forge a head.** The accepted limit assumes forging requires a *well-formed, correctly chained*
   record. Can you get a tampered registry accepted with less than that — a malformed record, a
   record chaining to the wrong predecessor, a duplicated head, a record whose declared digest is
   right but whose own content is wrong?
2. **Break the topology guards.** R16/R17 require: exactly one head; zero heads (cycle) invalid;
   two heads (fork) invalid; no migration-chain record off the single genesis-to-head path. **Probe
   each of the four independently.** Construct a fork. Construct a cycle. Construct an orphan.
3. **Attack the head/historical boundary.** A record is "historical" iff another record chains from
   it. Can you make a record that *should* be pinned get treated as the head, escaping its constant?
   Can you make the head look historical so nothing checks it live?
4. **The `registry-rework-` scoping (R17).** Non-chain records are outside the path requirement.
   Can a chain-relevant record be smuggled in under a name that dodges the prefix, or a non-chain
   record be made to poison the walk?
5. **`LEGACY_SOURCE_SNAPSHOT_COMMIT`.** Twelve historical assertions were decoupled from the live
   snapshot. Did that decoupling weaken any of the twelve, or admit a state it previously refused?
6. **Is the chain actually load-bearing?** Neuter `verifyMigrationChain` in a scratch copy and see
   which tests go red. If few or none do, the chain is enforced by nothing and that is a BLOCKER.

## PRIORITY 2 — did the rework break what the reviewers vouched for?

Both prior reviewers independently confirmed these hold **independently of the old pin**. They must
still hold. Re-probe rather than trust:

- **The operation matrix (AC6).** Seven authority-escalation shapes: merge agent-callable, merge
  principals, verification principals, closure operational-state, generic receipt minting,
  missing-evidence decision, Gate-1 tool-issued evidence. All must be refused with
  `AUTHORITY_ESCALATION`. **Note a trap the builder hit:** a probe that sets a field to its *shipped*
  value is a no-op and reads as "allowed". Verify your probe actually mutates something.
- **`REFUSE → ALLOW` downgrade** must still be caught.
- **Source sweep sensitivity (AC12 as amended by R14):** unregistered paragraph →
  `SOURCE_ITEM_UNCOVERED`; changed operative value → `VALUE_DIGEST_MISMATCH`; comments, blank lines,
  fenced blocks and headings inert; operator misconfiguration → **exit 2, never exit 1**.
- **Path handling**, including fix 17's new interior-colon rejection (~`:3399`).

## PRIORITY 3 — the new refusal semantics

`RETIREMENT_EVIDENCE_UNVERIFIED` (`types.ts:375`) is **validity-blocking**: an unverified retirement
invalidates the registry rather than being ignored. `validate` gained an optional `--repo-root`;
`resolveAuthority` deliberately does **no** I/O and keeps its signature.

Probe: can a retirement take effect without verified evidence? Can `resolveAuthority` be made to
honour an unverified retirement? Does `validate` without `--repo-root` ever return exit 0 over a
registry that retires something?

## PRIORITY 4 — the generated fixtures

Fix 15 deleted seven committed reject fixtures; they are now generated at test time via
`rejectDocument(mutate)` into `tmpdir()`. R18 ratifies that Allowed Files is a permission ceiling,
not a required-artifact manifest — do **not** report the deletion as a scope violation.

Do report: whether each generated fixture still constructs its **named** axis, whether each test
still asserts the **specific** code that axis produces, and whether generation can silently produce
a fixture that fails for the wrong reason.

## Explicitly NOT findings

- The accepted append-a-head limit (above).
- The deleted fixtures as a scope violation (R18).
- `pass-minimal.yaml` still being ~2.1 MB — corpus-exact predicates make a minimal positive fixture
  unreachable; this is documented.
- Per-query performance. It is fenced to FK-P1 by directive and there is an open coordinator probe.
- The 81 leaked git daemons — already cleared, and fixed at source.

## Deliverable

BLOCKER / SHOULD-FIX / INFORMATIONAL, each with `file:line`, a concrete failure scenario (specific
inputs → wrong result), and for every probe the exact mutation and observed before/after. Explicit
verdict: SHIP / SHIP WITH FOLLOW-UPS / REWORK REQUIRED.

**State what you could not check and why.** An honest gap beats a confident guess — this parcel
exists to represent honestly where enforcement is real, so overclaiming inside a review of it is a
category error.

## Operational

The full suite takes **well over an hour** and one file (`semantic-invariants.test.ts`) has
historically stalled. **Do not run the whole suite.** Run single files with a timeout, or better,
targeted probes. **Never run tests inside the review worktree** — copy to your own scratch directory
under the session scratchpad. A concurrent run in the parcel worktree has already corrupted evidence
once in this round.
