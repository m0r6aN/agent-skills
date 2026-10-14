---
ticket: FCA-P16
title: Windows portability for ops-console tests and the UNSAFE_ROOT_PATTERN guard
status: draft
owner: clinton.morgan
created: 2026-10-15
updated: 2026-10-15
risk: elevated
surfaces: [plugins/foreman-line/ops-console/src/invoke.ts, plugins/foreman-line/ops-console/src/server.ts, plugins/foreman-line/ops-console/tests/]
routing_class: architecture/risk
---

# FCA-P16: Windows portability for ops-console tests and the UNSAFE_ROOT_PATTERN guard

## Intent

The ops-console test suite (14 failures) and the product code it pins fail on the Windows CI runner introduced by #229. The failures expose:

1. **A real product bug**: `UNSAFE_ROOT_PATTERN` in `src/invoke.ts` refuses any root path containing a backslash — every Windows path (`D:\...`). Legitimate Windows paths are rejected.
2. **POSIX assumptions in tests**: shell-script fake binaries, `:` PATH separator, `chmod 0600` semantics, symlink availability, `gh auth` message text, and hardcoded forward-slash path expectations.

This parcel delivers a Windows-portable ops-console that passes its test/typecheck/lint on Windows CI **and** retains the full 583-test Linux baseline (no silent skip regressions).

## Constraints

1. **No local Windows machine.** The only Windows verifier is CI. The iteration loop is: push branch → read CI log → iterate.
2. **Backslash is a legitimate path separator on Windows.** The guard must allow it on `win32` while still refusing shell metacharacters on both platforms.
3. **Platform skips are explicit and counted.** No silent skips; each skip needs a named reason and, where the behaviour exists on Windows, a Windows-equivalent assertion.
4. **Typecheck and lint must also pass on Windows.** They were skipped due to early test-exit; this parcel must prove them green.

## Acceptance Criteria

| # | Criterion |
|---|---|
| AC1 | `UNSAFE_ROOT_PATTERN` allows `\` on `win32`, keeps refusing it on POSIX; quotes, `$`, backtick, `%`, `^`, and `\u0000–\u001f\u007f` remain refused on both platforms. |
| AC2 | `renderCommand` (pr-merge) quotes and escapes the root correctly for the platform's shell (`cmd.exe`/PowerShell vs `sh`). |
| AC3 | ops-console/test passes on Windows (runner: `windows-latest`); failures are ≤ 0. |
| AC4 | ops-console/typecheck and ops-console/lint pass on Windows. |
| AC5 | Full CI matrix (Linux shards) remains green (baseline 583 passing). |
| AC6 | Every platform-skip is explicit (`test.skip` with a reason annotation), named in this spec's skip-manifest, and counted. |
| AC7 | Port-held error message suggests `netstat -aon` on Windows instead of `ss -ltnp`. |

## Out of Scope

- **pi-package**: no test script; report-only (no CI failure cascade).
- **mutation-scope-guard**: separate package/goal; report-only (separate parcel if needed).
- **Cross-platform spawn execution**: tmux is POSIX-only; the spawn planner tests run on Windows but actual spawn would require WSL or skip.
- **Symlink creation in tests**: if Windows lacks symlink privilege, skip with reason.

## Failure Root-Cause Table

| # | Test name (abbrev.) | Root cause | Fix class |
|---|---|---|---|
| 1 | `FCA-P9: pr-merge is present-only` | UNSAFE_ROOT_PATTERN rejects `D:\...` | **Product bug** |
| 2 | `FCA-P9: pr-merge accepts a root declared in fleet state` | Same | **Product bug** |
| 3 | `FCA-P9: presentCommand validates with same guards` | Same | **Product bug** |
| 4 | `merge items carry cd "<root>" && gh pr merge <N>` | Same | **Product bug** |
| 5 | `gh failing degrades visibly` | Regex expects `"not logged in"`, GH Actions runner returns GH_TOKEN message | **Test env assumption** |
| 6 | `end to end through the real runner` | Fake git/gh shell scripts (`#!/bin/sh`), `:` PATH sep, chmod | **Test env assumption** |
| 7 | `review #3: git probes never take index locks` | Shell-script wrapper for env-var probe, `:` PATH sep | **Test env assumption** |
| 8 | `review #8/#9: retention ignores symlinks... files are owner-only` | Symlink may not be available; `mode & 0o777` has no meaning on Windows | **Test env assumption** |
| 9 | `K selected actions -> exactly one session with K panes (pi argv snapshot)` | `path.join` on Windows produces backslashes; snapshot expects `/` | **Test env assumption** |
| 10 | `gatherRepoFacts reads default ref...` | Fake git shell script | **Test env assumption** |
| 11 | `GET /api/reconcile: shape, counts...` | Fake git/gh shell scripts | **Test env assumption** |
| 12 | `AC7: gh unavailable degrades visibly` | Fake gh shell script | **Test env assumption** |
| 13 | `AC9 negative control: every git/gh subprocess is read-only` | Fake git/gh shell scripts | **Test env assumption** |
| 14 | `entry path refuses a held port typed` | Uses `ss -ltnp` in error msg (Linux-only) — likely a test match or product msg | **Test env assumption** |

### Additional (not in dossier, but skipped on CI)

- **ops-console/typecheck**: skipped because test failed first
- **ops-console/lint**: skipped because test failed first

## Product Bug: UNSAFE_ROOT_PATTERN

**Current pattern** (`src/invoke.ts` line ~86):
```typescript
const UNSAFE_ROOT_PATTERN = /["$`\\\u0000-\u001f\u007f]/
```

**Problem**: refuses backslash universally, so every Windows path is refused.

**Fix design**:
1. Create a platform-aware guard function `isUnsafeRoot(value: string): boolean`.
2. On `process.platform === 'win32'`: refuse `"`, `$`, `` ` ``, `%`, `^`, control characters — keep backslash allowed.
3. On POSIX: current behaviour (backslash refused).
4. Rationale: backslash is a path separator on Windows and safe in that context. `%` and `^` are cmd/PowerShell metacharacters and must be refused on Windows to prevent injection.

**Quoting in `renderCommand`**:
- POSIX: `cd "<root>" && gh pr merge <N>` (current; double-quote safe because shell-dangerous chars are refused by the guard).
- Windows: same quoting works in PowerShell and cmd (double-quote paths are valid). No escaping change needed *if* the guard rejects `%` and `^`.

## Test Environment Fixes

### 1. Shell-script fake binaries (git/gh wrappers)

Tests create `#!/bin/sh` scripts and prepend their directory to PATH. Windows has no `/bin/sh`.

**Fix options** (choose per test):
- **Option A**: Use Node.js script with shebang `#!/usr/bin/env node` (works on Windows with correct PATH).
- **Option B**: Skip test on Windows with explicit reason; add Windows-equivalent assertion if behaviour can be tested another way.
- **Option C**: Use `process.platform` to generate `.cmd` / `.ps1` alongside the `.sh` when on Windows.

Recommendation: **Option A** for tests that verify read-only subprocess behaviour; **Option B** for tests tightly coupled to shell semantics (e.g., env-var passthrough via shell script).

### 2. PATH separator

```typescript
process.env.PATH = `${bin}:${savedPath}`  // fails on Windows
```

**Fix**: use `path.delimiter`:
```typescript
import { delimiter } from 'node:path'
process.env.PATH = `${bin}${delimiter}${savedPath}`
```

### 3. GIT_OPTIONAL_LOCKS env-var test

The test wraps git in a shell script to echo `$GIT_OPTIONAL_LOCKS`. This won't work on Windows.

**Fix**: Skip on Windows with reason "shell-script env-var probe unavailable"; the product code (`ledger-git.ts`) sets the env var unconditionally so behaviour is still assured.

### 4. gh auth message regex

Current: `/not logged in/`
GH Actions: `"To use GitHub CLI in a GitHub Actions workflow, set the GH_TOKEN environment variable."`

**Fix**: broaden regex:
```typescript
/not logged in|GH_TOKEN/
```

### 5. chmod and permission assertions

Windows has no POSIX permission bits. `statSync(...).mode & 0o777` returns platform-specific values.

**Fix**: Skip permission-bit assertions on Windows with reason "POSIX permission bits unavailable on Windows"; the product code may call `chmodSync` (no-op on Windows) so it remains harmless.

### 6. Symlink tests

Symlink creation may require admin or Developer Mode on Windows.

**Fix**: wrap symlink-dependent tests in `try/catch` around `symlinkSync`; if `EPERM` or `ENOTSUP`, skip test with reason "symlink privilege unavailable".

### 7. pi argv snapshot path separators

Test expects forward-slash paths; `path.join` on Windows uses backslash.

**Fix**: normalize expected paths using `path.normalize` or compare after `.replace(/\\/g, '/')`.

### 8. Port-held error message (`ss -ltnp`)

Product code suggests `ss -ltnp` in error message. Windows should suggest `netstat -aon`.

**Fix**: make the remedy string platform-aware in `src/server.ts`.

## Skip Manifest (Projected)

| Test file | Skip reason | Windows-equivalent assertion |
|---|---|---|
| `ledger.test.ts` (`review #3`) | Shell-script env-var probe | None (product code unconditional) |
| `ledger.test.ts` (`review #8/#9` permission check) | POSIX bits unavailable | Skip only the `mode & 0o777` assertions |
| `browse.test.ts` (`symlinks never followed`) | Symlink privilege may be unavailable | Detect and skip if `EPERM` |
| `decisions-read-only.test.ts` (end-to-end) | Shell-script wrappers | Convert to Node.js scripts or skip |
| `reconcile-read-only.test.ts` | Shell-script wrappers | Same |

Final skip count will be tallied after implementation.

## Iteration Loop

1. Push branch `fix/fca-p16-windows` to origin.
2. Open draft PR; CI triggers Windows runner.
3. Read Windows job log; identify next failure.
4. Fix locally; push; repeat until AC3–AC5 green.
5. Promote PR to ready-for-review.

## Verification Plan

| Check | Method |
|---|---|
| AC1 | Unit test `UNSAFE_ROOT_PATTERN` / `isUnsafeRoot` on both platforms (mock `process.platform`). |
| AC2 | Snapshot test for `renderCommand` output per platform. |
| AC3 | CI Windows job green (0 failures). |
| AC4 | CI Windows job green for typecheck + lint. |
| AC5 | CI Linux matrix green (583 total, no decrease). |
| AC6 | `git grep 'test\.skip'` in ops-console/tests counts match this spec's manifest. |
| AC7 | Search for `netstat` in error path on Windows. |

### Mandated Reviewer Focus Questions

1. Does `isUnsafeRoot` on `win32` still refuse all cmd/PowerShell metacharacters (`%`, `^`, `"`, etc.) that could allow command injection?
2. Are any skips silent (no reason string, no manifest row)?
3. Does the Linux baseline remain 583 (no regression)?
4. Is `renderCommand` output copy-paste-safe on both cmd.exe and PowerShell?

## Context & References

- Failure dossier: `plugins/foreman-line/docs/goals/foreman-ops-console/ux-redesign/tasks/FCA-P16-windows-failure-dossier.md`
- `invoke.ts` UNSAFE_ROOT_PATTERN: line ~86
- SPEC-CONVENTION §4: `surfaces`, `routing_class`

## Assumptions

1. `windows-latest` runner in CI provides Git and Node.js.
2. `gh` CLI is installed on the Windows runner (GitHub-hosted runners include it).
3. The product never spawns tmux on Windows (spawn tests are plan-only; execution is out of scope).

## Open Questions

1. **OQ1**: Should the Windows quoting use PowerShell-native quoting (`'...'`) instead of double quotes? Decision: use double quotes (works in both cmd and PowerShell for paths with spaces; the guard already refuses all shell-dangerous characters).
2. **OQ2**: Should we add a CI job running the full test suite under WSL to verify POSIX behaviour on a Windows host? Decision: out of scope for this parcel; consider as follow-up.

## Allowed Files

- `plugins/foreman-line/ops-console/src/invoke.ts`
- `plugins/foreman-line/ops-console/src/server.ts`
- `plugins/foreman-line/ops-console/tests/browse.test.ts`
- `plugins/foreman-line/ops-console/tests/browser-decisions.test.ts`
- `plugins/foreman-line/ops-console/tests/browser-reconcile.test.ts`
- `plugins/foreman-line/ops-console/tests/decisions.test.ts`
- `plugins/foreman-line/ops-console/tests/decisions-read-only.test.ts`
- `plugins/foreman-line/ops-console/tests/invoke.test.ts`
- `plugins/foreman-line/ops-console/tests/ledger.test.ts`
- `plugins/foreman-line/ops-console/tests/ledger-tmux.test.ts`
- `plugins/foreman-line/ops-console/tests/reconcile-read-only.test.ts`
- `plugins/foreman-line/ops-console/tests/reconcile-sources.test.ts`
- `plugins/foreman-line/ops-console/tests/server-bind.test.ts`
- `plugins/foreman-line/ops-console/tests/spawn-plan.test.ts`
- `plugins/foreman-line/ops-console/tests/support/materialize.ts`
