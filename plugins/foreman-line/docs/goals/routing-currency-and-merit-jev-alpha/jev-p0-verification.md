# JEV-P0 — Second rework verification record

## Scope

This record verifies the second JEV-P0 contract/evidence-boundary rework only.
It does not authorize JEV-P1 or later, provider calls, runtime use, spend,
credential access, dispatch, promotion, or Gate 3. The only mutation authority
is:

- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md`

Every other path and effect is forbidden. The exact pre-rework base is
`8be1cca7681e08ca4a9f585e1927140ea9e2abc5`.

## Rework closure checklist

The three allowed documents explicitly close these findings:

1. Cost is a finite, non-negative JSON number with exact literal currency
   `USD`, amount `<= 0.01`; strings, NaN, Infinity, negatives, non-USD, and
   over-cap values refuse.
2. Provenance is a closed canonical object; `provenance_digest` is SHA-256 of
   its RFC 8785/JCS UTF-8 bytes; fixture IDs resolve to exact committed
   manifest entries at verified commit/tree custody.
3. Scope proof uses an explicit two-commit comparison from the exact base to
   the resulting commit, not a clean-worktree claim.
4. Endpoint, method, headers, body policy, and redirects are capability-owned;
   caller-controlled `Host`, `:authority`, `Authorization`, content/transfer
   headers, body, endpoint, and redirects refuse; transmitted bytes and final
   TLS origin are checked.
5. Replay custody requires exact repository, ref, path, commit, tree, manifest
   entry, fixture ID, paired digests, and verified immutable custody; mutable
   or self-recomputed fixtures refuse.
6. Run authority uses coordinator-issued IDs, CAS/create-if-absent durable
   leases, immutable capability/version/request binding, pre-call reservation,
   provider/account hard-budget enforcement or acknowledgement, typed cost, and
   append-only terminal transitions without retry/reopen.
7. Privacy uses an allowlisted input schema, pre-send minimization/redaction,
   unsafe-input refusal, no PII in digests/metadata/source references, bounded
   retention, and zero raw-payload retention.

## Dependency-free verification commands

Run from `C:\Repos\foreman-line-jev-p0` in PowerShell. No dependency
installation is part of this parcel.

### 1. Environment probe

```powershell
node -v
```

Record the exact version. The shaping package declares `>=24.11.1`; a lower
version is an environment limitation, not a contract pass.

### 2. Reproducible base-to-head scope and whitespace proof

Run after the resulting rework commit exists:

```powershell
$base = '8be1cca7681e08ca4a9f585e1927140ea9e2abc5'
$head = git rev-parse HEAD
$allowed = @(
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md'
)
$changed = @(git diff --name-only "$base..$head" -- $allowed)
if ($changed.Count -ne 3) { throw "expected exactly three base-to-head changed files; got $($changed.Count)" }
if (@($changed | Where-Object { $_ -notin $allowed }).Count -ne 0) { throw 'base-to-head includes a forbidden path' }
git diff --check "$base..$head" -- $allowed
git diff --name-status "$base..$head" -- $allowed
Write-Output "base=$base"
Write-Output "head=$head"
Write-Output 'base_to_head_scope_and_whitespace=passed'
```

This is the authoritative scope proof. It compares the exact pre-rework base
to the resulting commit and does not use a clean-worktree assertion.

### 3. Targeted active-spec tooling limitation

The frontmatter linter and shaping advisory self-check, if coordinator-run,
target only the active spec below; they do not lint these three goal documents:

```text
plugins/foreman-line/docs/specs/active/JEV-P0-alpha-decisions-contract-and-evidence-boundary.md
```

The exact commands are:

```powershell
Set-Location plugins/foreman-line/spec-linter
npx --no-install tsx src/cli.ts validate ../docs/specs/active/JEV-P0-alpha-decisions-contract-and-evidence-boundary.md
Set-Location ../../..
Set-Location plugins/foreman-line/shaping
npx --no-install tsx -e "import { readFileSync } from 'node:fs'; import { selfCheckDraft } from './src/index.ts'; const p = '../docs/specs/active/JEV-P0-alpha-decisions-contract-and-evidence-boundary.md'; const r = selfCheckDraft(readFileSync(p, 'utf8')); console.log(JSON.stringify(r)); if (!r.valid) process.exit(1)"
Set-Location ../../..
```

In this worktree, both commands are environment-blocked before validation by
missing local `ajv`; no dependency installation is authorized. The observed
Node version is also below the shaping package engine floor. Neither failure
is represented as a validation result for the three goal documents.

## Field-by-field review

Review the three allowed documents and confirm:

- cost type, exact USD currency, non-negative finite value, and cap;
- canonical provenance object, JCS provenance digest, exact manifest custody,
  and no mutable/self-recomputed fixture acceptance;
- immutable transport authority, forbidden caller headers/body/endpoint,
  measured transmitted bytes, redirect refusal, and final TLS origin;
- coordinator-issued run/lease, CAS/create-if-absent claim, immutable binding,
  provider/account budget acknowledgement, and append-only terminal state;
- allowlisted privacy-safe input, minimization/redaction/refusal, PII-free
  metadata and references, bounded retention, and zero raw-payload retention;
- existing identity, schema, answer, JCS, size, recommendation, and refusal
  requirements from the first rework remain intact.

## Parent-surface negative proof

The final base-to-head diff must show no change outside the three allowed goal
documents, including parent RCM D13/charter/directive, boundary-routing D10,
routing registry/policy, Pi, host, credentials, HAWF, Helmholtz, GMF, code,
schemas, tests, fixtures, receipts, Jira, worktrees, installed plugins, or
downstream JEV surfaces.

## Independent review gate

Two independent fresh frontier reviews remain required before Gate 3. Reviewers
must be read-only and independent of the author and each other, and must assess
cost/provenance/custody, transport authority, transmitted-byte measurement,
atomic lease/budget/terminal guarantees, privacy/retention, identity binding,
refusal completeness, recommendation authorization, and parent-surface
collision. The builder does not self-approve or merge.

## Execution record

| Check | Result | Evidence |
|---|---|---|
| Starting branch/base | `codex/jev-p0-contract`, base `8be1cca7681e08ca4a9f585e1927140ea9e2abc5` | Confirmed before edits. |
| `node -v` | To be recorded during final verification | Dependency-free environment probe. |
| Base-to-head scope comparison | To be recorded after resulting commit | Exact command in section 2. |
| Base-to-head `git diff --check` | To be recorded after resulting commit | Exact command in section 2. |
| Targeted active-spec linter/self-check | Environment limitation: local `ajv` missing; no install | These tools do not lint the three goal documents. |
| Field-by-field second-rework review | To be recorded during final verification | Checklist above. |
| Independent frontier reviews | Coordinator-owned; not performed by builder | Required before Gate 3. |
| Gate 3 / merge | Not granted; human-owned | No self-approval or merge. |

## Completion boundary

The second rework is document-complete when all seven findings are explicit and
testable in the three allowed documents, the dependency-free base-to-head scope
and whitespace commands pass, and environment limitations are accurately
recorded. It is not Gate 3-ready until the two independent fresh frontier
reviews are complete and coordinator-triaged.
