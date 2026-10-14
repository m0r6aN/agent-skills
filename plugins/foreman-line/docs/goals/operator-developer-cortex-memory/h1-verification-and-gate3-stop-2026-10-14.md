# OPMEM-H1 — historical verified candidate / pre-merge Gate3 stop

**Source hold superseded:** actual human integration merge#51 verified atb3a4b1b; see `h1-closure-2026-10-14.md`. This is retained pre-merge evidence, not the current queue state. Separate #227 record CI remains red, tracked upstream#230; no deployment claim.

**Recorded:** 2026-10-14 UTC. Sole coordinator `01a1358d-711a-7345-8874-901c5e2b50e3` retains ownership. User authorized separate narrow remediation; no waiver of technical gates. **H1 is locally verified, NOT merged/Stage-F accepted/deployed; P5a remains undispatched.** No worker/poll/wakeup running.

## Exact candidate / scope

Gateway base `0e0878a5938ada21409e6e95ab8d2ea260c2f6b5`; reviewed candidate `bfd21823b1c8419ba320961591583b476e9df58e`, branch `feat/opmem-h1-sqlite-01a1358d`, worktree `D:/Repos/opmem-worktrees/gateway-h1-01a1358d` clean. Exactly two manifest version-string-only changes (Microsoft.Data.Sqlite10.0.0→10.0.13) and one added native-version Fact. Original manifest bytes/BOM/EOL unchanged otherwise; IntegrationTests manifest byte-identical to base. No other tracked path, feed/config/audit suppression or behavior change. Spec remains active pending actual Gate3/Stage F.

Approved contract and authorization frozen separately at agent-skills `2ffc60b3`. Agent-skills main contained committed merge-conflict markers in charter/directive; isolated repair `a43b4ec8` restored the exact accepted successor #220 record without changing decisions. Original dirty checkouts untouched; bridge root remains non-Git and unchanged. #220 externally merged; no merge by this session.

## Acceptance map / primary evidence

Durable selected logs, scripts, exact reviewer verdicts, selected isolation inspection and hash/usage inventory are adjacent under `h1-evidence-2026-10-14/`. Full raw transcripts, TRX, source archives and native binaries retained in `D:/Repos/opmem-dispatch-01a1358d/`, inventoried by SHA256. Binaries/archives are intentionally not committed into documentation. Retained command scripts are `.txt` copies; run only after reconstructing owned scratch paths and immutable source. The copied checker expects the original evidence root with full TRX, not this selected-log folder.

| AC | Observed evidence |
|---|---|
|1 exact scope|Committed diff2M+1A only; byte replacement proof `h1-shape-proof.log`; both reviewers independently checked bytes|
|2 audit|Fresh force-evaluate/no-cache solution restore; no NU vulnerability/downgrade warning; Windows/Linux solution audits each enumerate all3 projects without known vulnerable packages at collection time|
|3 graph|All3 graphs independently inspected on both OSes: Microsoft.Data.Sqlite/Core10.0.13; SQLitePCLRaw bundle/core/provider/native2.1.13, no2.1.11|
|4 Tests identity/count|Original421 passed baseline; Windows422/0/0 and Linux422/0/0; all421 names/classes/methods/outcomes preserved, exactly1 added Fact; reviews compared full identities rather than count only|
|5 runtime/mutation|New Fact prints3.53.3 on each OS, strict entire3-component ASCII-digit numeric parse with checked overflow. Owned disposable copy floor99.0.0 fails exactly1 named test; not build/discovery failure; parcel source never mutated|
|6 Windows publish|win-x64 publish succeeds; BCL-only NativeLibrary.Load absolute published e_sqlite3.dll; export sqlite3_libversion returns3.53.3; exact asset SHA below|
|7 Linux publish|Pinned local image, verified2 mounts/read-only input, no extra ports/devices/privilege/secrets/services; source archive/head byte verification; Linux422 pass, linux-x64 publish, absolute libe_sqlite3.so returns3.53.3; exact SHA below|
|8 dual review/closure|Fresh independent Anthropic and OpenAI reviewers, family-independent of Moonshot builder; both final PASS at exact unchanged candidate, notes fixed/rechecked; coordinator deterministic reproduction and evidence checks pass|

Native floor for CVE-2025-6965 / GHSA-2m69-gcr7-jv3q is3.50.2. Measured Windows and Linux **3.53.3**:

- Windows SHA256 `b7385d722c83fb52142a00477a726723745916d22a555711ee89834c1111fb2e`.
- Linux SHA256 `b0f5c48026fedcf9f05cf31c6fadf9e1e001ca59cd85aa68b8b6814e52c18a07`.
- SDK image `sha256:9087b2e7762d148ff39cbf3766cd7fffe608dbd9990c8673c2cbb77f6eacd82f`.
- Windows native proof UTC01:16:10; independently repeated Linux proof UTC01:24:52 on2026-10-14. Linux pre-start selective inspection and exited0 state agree with launch/run timestamps and container cleanup.

Audit is collection-time known-advisory evidence, not a permanent all-vulnerabilities guarantee. Vulnerable dependency presence was established at baseline; remote exploitability was not. No exploit or live probing performed. No production deployed-fix claim.

## Review findings and disposition

A `OPMEM-H1-code-A-01a1358d`, requested/observed `anthropic/claude-fable-5`; B `OPMEM-H1-code-B-01a1358d`, requested/observed `openai/gpt-6.1-sol`. Metadata from actual message_end plus follow-up PI_PROVIDER/PI_MODEL, not model narrative guesses. A's first report generic “claude-code harness” description was incorrect; follow-up explicitly corroborates native Pi Anthropic metadata. Lane labels A/B refer to distinct sessions, never a model contradiction or shared verdict.

|Finding|Disposition|
|---|---|
|A/B LOW: empty container stdout did not retain actual isolation configuration|FIXED in evidence only; saved actual docker-create launcher and pre-start selected inspect, exactly readonly /input + owned writable /evidence, no other mounts/ports/devices/privilege; full Linux reproduction; both reviewers closed|
|A LOW: hardcoded sourcecommit label not measured|FIXED in evidence only; archiveSHA measured inside container, matching hostSHA and git get-tar-commit-id; both independently verified archive content against exact head|
|A INFO: quick parallel chronology|Accepted-as-documented: actual TRX/proof times consistent with concurrent Windows/Linux runs|
|A INFO: Windows machine fallback NuGet source|No parcel feed change; stock SDK fallback plus official nuget.org; Linux only official nuget.org and matching graph/artifacts|
|Baseline compiler nullable warnings|Out of scope, not suppressed/fixed; source RoleBinding/test warning code unchanged|

## Explicit unresolved integration limitation

Sanitized Windows IntegrationTests on unchanged base and candidate: **3 passed / 5 failed / 2 skipped**, all10 identities/outcomes unchanged, failure diagnostics also independently compared. Existing failures are Cortex authorization expectations, not introduced by this dependency change. Two actual provider tests deliberately skip; no real Collective/inference/key used. Linux integration excluded, no compatibility claim. These are broader release/P5+ assessment carry-forwards, not a green whole-repository chain. Do not fix them by weakening authorization or expanding H1.

## Spend / safety / custody

H1 all10 native model calls: usage/catalog-reported **USD3.857473**; predecessor recorded191.10; known subtotal **USD194.957473**. USD45 per architecture parcel / USD400 cumulative guards preserved. Unknown older spend remains unknown; this is not a reconciled invoice or full remaining-balance claim. Exact per-call metadata/raw hashes in inventory; no model/provider credential config changed. All workers settled; no surviving Docker proof container (owned instance removed only), no services changed.

## Gate3 stop and exact next human action

`SPEC-CONVENTION.md §8` requires distinct agent Git identity/effective bypass proof. Current authenticated identity is human `m0r6aN`; Gateway effective integration rules return[], main ruleset15567296 bypass actors[], current user bypass never. No distinct agent exists in this observed chain. Owner merge consent is preserved, not re-requested; missing actual identity admission cannot be fabricated or replaced with human-token automation.

**Human action:** merge the reviewed Gateway feature PR **only into `opmem/integration`**, at candidate `bfd21823b1c8419ba320961591583b476e9df58e`; do not promote to main/develop. Also merge the separate agent-skills evidence/state PR using normal human controls. PR URLs are recorded in `h1-publication-2026-10-14.md` after publication. This is a real technical Gate3 handoff, not another requirements/scope approval request. Goal loop is stopped awaiting merge; sole ownership retained.

After merge notification/resume: verify actual refs, merge topology and exact source delta; no new work hidden in a squash; re-run affected exact-head chain if necessary; then Stage F spec→done/lessons/state tracking, close S-1 for the integrated non-deploying baseline only, and freshly shape P5a from accepted manifests. External main promotions Gateway#50/Cortex#68 observed, deployment/health still unverified. Cortex integration ref restoration/freshness remains a later explicit non-deploying step. Overall goal incomplete; no P5a/P8/P9 or live rollout claim.
