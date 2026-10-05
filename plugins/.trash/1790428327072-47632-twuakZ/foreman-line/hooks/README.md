# Foreman Line hooks — the model gate

Makes the model-grade rule **mechanical**. Before this, D69(b)'s `[1m]` ruling
lived entirely in markdown: a `claude-opus-5[1m]` session passed every check in
the repo. That is not hypothetical — a `[1m]` session authored the D69 amendment
that disqualifies it, and another claimed the worker-fabric queue.

## What it does

A session whose model is not on the approved roster has **every tool call
denied**, with a message naming the running model, the reason, and the exact
relaunch command.

| Model | Roles |
|---|---|
| `claude-opus-5` | coordinator |
| `claude-sonnet-5` | builder, shaping |
| `claude-fable-5` | reviewer, verifier |
| `gpt-5.6-sol` | coordinator, reviewer, verifier |
| `gpt-5.6-terra` | builder, shaping |
| `gpt-5.6-luna` | builder, shaping |

The roster is data — `model-gate.policy.json` — not code.

## Why two events

Neither can do the job alone, and this is a harness constraint, not a choice:

- **`SessionStart`** is the only event carrying the model id, and it **cannot
  block**. It evaluates and records the verdict.
- **`PreToolUse`** *can* block (exit 2) but never sees the model. It reads what
  SessionStart recorded.

Verdicts are keyed by `session_id` under a temp directory.

## Design rules, and why each one is there

**Byte-exact matching.** `claude-opus-5[1m]` fails because it is not the string
`claude-opus-5`. There is no variant-detection rule doing the work — the `[1m]`
markers in the policy exist *only* to turn "unknown model" into a message that
names the real problem. This is D69(b) ruling (ii) implemented literally.

**Fail closed on an absent model.** The `model` field is optional and is not
always sent. Unverified is treated as mismatch, consistent with the Line's rule
that a check which did not run reports `not-evaluated` and fails, rather than
passing quietly.

**Fail *open* on anything unexpected.** A corrupt policy file, malformed stdin,
an unknown mode, an unwritable temp dir — all allow, and say so on stderr. A
governance hook that crashes closed blocks every tool call in every repo, gets
switched off in anger, and then protects nothing.

**A session with no recorded verdict is allowed.** Sessions predating the hook
must keep working, or the gate gets disabled on contact.

**Unidentifiable sessions get no state key.** Found by the test suite on its
first run: sessions lacking `session_id` all shared one `unknown` key, so a
BLOCK written by one was read back by the next and blocked it. A gate that fires
on the *wrong* session is worse than one that misses an unidentifiable session.

## Escape hatch

```
FL_MODEL_GATE=off
```

Deliberately trivial. A control that can lock a developer out of their own
machine is a control that gets removed.

## Tests

```
node --test plugins/foreman-line/hooks/model-gate.test.mjs
```

12 cases, no dependencies. They drive the real script as a subprocess and assert
on **exit codes**, because 2 is the only value that actually blocks a tool call.

## Why this is not a package

Every other unit under `plugins/foreman-line/` is an npm package with
`package.json`, `src/`, and `tests/`. This one deliberately is not.

CI discovers packages with `find plugins skills -maxdepth 4 -name package.json`
and installs and tests each one. Adding a `package.json` here would enrol these
files in the D19 audit's pinned cardinality, `ratified-packages`, and the
dependency-allowlist tests — the exact class of silent, elsewhere-enrolment that
lesson #74 records (twelve reviewers across nine rounds missed it because a
diff-scoped reviewer structurally cannot see it; CI found it after review
passed).

A hook is not a library. **The tests therefore do not run in CI yet** — wiring
them in is a real decision with that enrolment cost attached, and it is called
out here rather than left for CI to discover.

## Known limit

A session that never reports `session_id` is not gated. Real hook payloads
always carry one; this only affects malformed input, where the documented
behaviour is to allow rather than trap. Stated plainly because an absence-proving
check must say what it cannot see.

## Related

- `plugins/foreman-line/routing-policy/routing-policy.yaml` — per-role model
  binding at **dispatch** time. This gate covers the **session**, which is a
  launch property the routing policy explicitly does not own.
- D69(b) ruling (ii) — `docs/goals/governed-scale-out/amendment-d69-claude-runtime-profile.md`
