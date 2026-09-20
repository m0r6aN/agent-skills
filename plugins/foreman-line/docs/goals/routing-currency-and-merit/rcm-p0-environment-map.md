# RCM-P0 environment map — repository evidence, host acquisition blocked

Status: incomplete / blocked-secret-boundary. Observation: 2026-09-20T15:23:52.9276997Z.
Repo commit: `1ec2b1012d5290851e924cc91137ec3f09122820`; branch: `codex/rcm-p0-builder`.
The isolated root is represented as `REPO_ROOT`; the coordinator retains its exact
absolute binding from the builder assignment. No identifying host path is published.
All source paths below are repository-relative and resolved only under that bound root.

## Coordinator-release record R1 and rework release R2

This retained record binds **process authorization** to coordinator task
`01a0bf3f-559b-7291-a20e-8d8a4bbb16b3`, the ratified loop-directive commit
`96b6e39d9845f15b52057ffa5e73147fc02ae5e7` (`96b6e39`), and the exact Gate 2
phrase **“Grant Gate 2 for RCM-P0 and RCM-P1”**. The directive's ownership block
names that task; its Standing authorizations item 2 records that grant. RW02
compared the committed directive text with the unchanged disk directive and
checked the task and phrase. Its SHA-256 remains
`5ed29906d77105eb3a5b05cc9b7cbe00f102930208d93cd7ff44cb06b1c057dc`.

R1 is the coordinator execution ruling transcribed from the initial assignment:
“Coordinator Step-0 ruling: release RCM-P0 execution under the accepted spec with
these limits.” The current coordinator rework assignment explicitly confirms those
limits and directs retention of this binding. R2 is the subsequent coordinator
message: “Coordinator releases rework. Apply the four requested fixes exactly
within the four evidence files.” It follows this builder's new Step 0 restatement
and authorizes this bounded rework of the existing artifacts.

The ruling permits repository evidence and in-memory verification while safe host
source binding remains unavailable. It requires F1–F6 blocked-secret-boundary,
HAWF escalated-unresolved with downstream hold, Jev refused/disabled-lane evidence
only, and snapshot complete=false/freshness refused. Node v24.7.0 is below shaping's
>=24.11.1 floor and worktree dependencies are absent; no installation is authorized.
Only the four evidence files may change. No host/catalog/settings/auth/credential
content, guessed paths, home/environment/credential-store enumeration, Pi launch,
network, dispatch/evaluator access, host/policy/control writes, commit or merge.

Provenance class: builder-retained transcription of coordinator messages plus
repository control evidence. Exact original user-message timestamps and immutable
message IDs are unavailable; no tool identity is asserted and there is
**no independent human signature**. The original artifact's “received before
2026-09-20T15:22:22.2949213Z” is a retained initial-run receipt upper-bound claim,
not a newly verified user timestamp. Rework observation times identify command
execution only. This record neither independently authenticates a human nor
turns process authorization into host evidence, TTL approval, spec promotion,
P1 dependency release, Gate 3 delegation, or full acceptance. No control document
was amended to create this record.

## Current evidence-procedure control

Chronology limitation (open): initial Step 0 and RW01 repository reads predated
RW04's later safety-gate proof. RW02 also cannot retroactively cover those reads.
No retained evidence establishes equivalent gating for those earlier reads; the
later controls do not close that process-evidence gap. Current source reads must
use the corrected RW04 gate before metadata/content/hash access. This is not
retroactive coverage or a claim of production enforcement.

RW04 supersedes historical C06–C12 locator-based reacquisition. It is an
**evidence-procedure control; not production runtime enforcement**. The only
rework-readable source roles are S01 and S03–S13. S02/S14 remain historical
dispatch/evaluator observations and are not accessed, rehashed or freshly attested.
H01–H04 remain unbound and unread.

Before a source metadata/content/hash read, require one exact, case-sensitive
source-ID + role + full safe-locator match against the fixed approved table.
Resolve the path from that table, never from `safeLocator.Substring(5)`. Reject
unknown roles, changed locators, absolute/drive-relative/UNC/device paths, dot
segments, traversal, alternate streams and malformed separators. Canonicalize
under the coordinator-bound repository root and require root-plus-separator
containment. Only after the role/containment gate, inspect each ancestor's
attributes without traversing a reparse point; refuse any reparse point before
descending or reading source content/hash/length/mtime.

Reject credential-bearing fields and URL userinfo/query/fragment before path
resolution or metadata reads. The source-role table accepts repository locators
only, so no URL can become a readable source. Refusals emit fixed labels without
the rejected value. No host document is acquired to perform these checks: inputs
are the existing safe evidence manifest and explicitly synthetic in-memory
negative copies. This is not an extractor or permission to parse mixed host JSON.

The negative changed-locator case changes S01 to another otherwise valid repository
path while retaining S01's role. It must yield SOURCE_ROLE_REFUSED with zero
additional metadata probes. Absolute, UNC, traversal, wrong-role, credential-field,
secret-URL and forbidden-source cases also refuse before metadata. A synthetic
reparse attribute exercises the same rejection predicate used by the ancestor
walk; no junction is created. This procedure does not claim atomic protection
against concurrent filesystem substitution; source changes refuse acceptance and
require coordinator handling.

An independent section-aware policy scan verifies each of 45 classification rows
and 15 tier rows against its exact cited line, then compares all six arrays in
exact source order. Reversed economy order and a changed classification citation
must fail on in-memory copies. Counts or set equality alone cannot pass those
checks. These results establish bounded repository declarations only.

## Initial R1 transcription (retained history)

Reference: current builder task, user message beginning
"Coordinator Step-0 ruling: release RCM-P0 execution under the accepted spec with these limits."
Received before the first execution observation, 2026-09-20T15:22:22.2949213Z.
Exact message timestamp/immutable message ID remain unavailable. The task/commit/
Gate 2/process binding is now retained in the coordinator-release record above;
no independent timestamp or signature is claimed.

1. Safe-source boundary not established. No guessing paths, home/environment/store
   enumeration, mixed host JSON, Pi launch or extractor. Record blocked-secret-boundary
   and incomplete host-derived F1-F6 evidence; no positive live claims.
2. Daily cadence ratified. 86400-second freshness bound remains proposed, not an
   independently established TTL; freshness acceptance refused without binding/proof.
3. Node v24.7.0 is below shaping's engine floor; dependencies absent. No installation.
   Record limitations and exact exits; native PowerShell/repository evidence permitted.
4. HAWF/INDEX evidence in scope: escalated-unresolved, superseded charter vs stale
   awaiting-claim index, downstream hold; no INDEX write or HAWF ownership claim.
5. Jev unverified: refused/disabled-lane evidence and correction proposal only.
6. Only the four evidence files may be created; no code, host/policy/control writes,
   installation, dispatch/evaluator calls, credentials, network, commit or merge.
   Independent two-review requirement is coordinator-routed after the completion claim.

R1 releases this bounded evidence execution despite preserved draft/shaping wording
in S10 and S04. It does not promote the spec, release P1's dependencies, grant other
Gate 2 parcels, or delegate Gate 3. S04:20-25 grants only P0/P1 and preserves human
authority. Boundary D1-D10, RCM D1-D14 and GMF contracts remain unchanged.

## Source roles and owners

| Role locator | Binding / read status | Authority and owner |
|---|---|---|
| REPO_ROOT | Coordinator-supplied isolated worktree; HEAD matches spec commit; clean before execution (C01 and Step 0) | Repository policy and goal controls; coordinator |
| repo:plugins/foreman-line | Checkout source only, not an installed plugin | Repository maintainers; no installed parity inferred |
| unbound:installed-plugin (H01) | Exact installed path/version/source absent; no read | Host owner must bind; parity unknown |
| unbound:host-catalog (H02) | Exact path, safe method/export and current times absent; no read or hash | Host owner; observations cannot authorize routing |
| unbound:Pi-settings (H03) | Exact path and safe method/export absent; no read or hash | Pi/host owner; never Foreman routing authority |
| unbound:approved-configuration-authority (H04) | No approved current source bound; distinct from settings observation | Coordinator/host owner must identify authority |
| S09:29 | Repository Jev contractual endpoint only | Boundary-routing contract; not installed endpoint proof |

No host metadata was inspected: absent exact bindings prevent even a meaningful host
stability check. No Pi process/cache refresh was triggered. Templates were not used
as installation evidence. Zero acquired host rows is not a measured zero-sized catalog.

## Safe acquisition boundary

No existing reviewed field-access mechanism or owner-produced safe export was supplied.
None was invented. Only repository text and in-memory calculations on it were read.
No credential values were read, emitted, hashed or retained.

A later authorized acquisition must bind the exact source/time and safely expose only:
catalog provider key, model id/provider/public baseUrl/api/input/reasoning/contextWindow/
maxTokens, documented numeric cost units, thinkingLevelMap, checkedAt, safe field-name
inventory/counts; settings defaultProvider/defaultModel/enabledModels/defaultThinkingLevel,
provider keys and public baseUrl. Credentials/references, headers, auth files, arbitrary
compat payloads, unrelated settings, secret URLs, private endpoints and PII cannot cross
that boundary. No bulk mixed-document parsing, post-read redaction, copying or whole-file
hashing; no new extractor in P0. Publish role locators, with exact binding retained by owner.
Reacquire safe projections independently, compare byte digests and metadata, and refuse
changing sources without locking, repairing or rewriting Pi.

## Runtime and tooling

C01/C03 measured Node **v24.7.0**, PowerShell **7.6.6**, Git
**2.45.2.windows.1**, ripgrep **14.1.0**. Native version commands all exited 0.
S12:8 requires Node >=24.11.1; S13:8 requires >=22. Root, shaping and spec-linter
node_modules are absent (Step 0/C03). No dependency search outside the worktree,
installation, build, selfCheckDraft or spec-linter execution occurred.
Self-check and CLI exit codes are **not run / no exit**, not fabricated failures/passes.
Compatible preinstalled tooling and coordinator lint remain outstanding.
Step-0 source inspection confirmed --repo-root support in the CLI; selfCheckDraft takes
document text, not that CLI flag. The spec remains draft.

## Source manifest and reproducibility

Source IDs and exact SHA-256 below identify retained repository evidence.
C04/C05 are historical acquisition records only: they reported exact UTF-8 bytes,
no BOM, LF for all 14 sources and agreement of hashes, lengths and last-write
metadata at 2026-09-20T15:24:22.7814460Z. The snapshot retains those acquisition
times, formats and coverage; they are not refreshed by this rework.
For current reproduction use the corrected RW04 in rcm-p0-verification.md,
limited to S01 and S03-S13 after its exact-role/root/reparse safety gate.
Use NR01 byte controls and NR05 current sealing procedure in that document for
the four artifacts. Archived C01-C13, including C04/C05, are not current
reproduction instructions. S02/S14 remain historical-only and must not be read.
These are repository evidence hashes, never hashes of mixed host content.
Metadata stability alone is not proof of no writes; pair with the command/effect log
and final allowed-path audit. Installed/host stability remains unknown.

| ID | Safe locator under REPO_ROOT | Role | SHA-256 |
|---|---|---|---|
| S01 | `plugins/foreman-line/routing-policy/routing-policy.yaml` | repository routing policy | `578f7a8a3a4384bf5f3e0064cb0439032e068a9e869bbf42770714e1466bebb0` |
| S02 | `plugins/foreman-line/dispatch/src/routing-eval/index.ts` | repository evaluator source | `6b754fc0b2bb535198141dd18bb25aefb360ddb1d3ab436c5cbd41f556bec23f` |
| S03 | `plugins/foreman-line/docs/goals/routing-currency-and-merit/charter.md` | RCM charter / historical hypotheses | `93c536582fc893ba57c08859799d8fa72ef49866f51a639b521f1d6208965a79` |
| S04 | `plugins/foreman-line/docs/goals/routing-currency-and-merit/loop-directive.md` | RCM authority and queue | `5ed29906d77105eb3a5b05cc9b7cbe00f102930208d93cd7ff44cb06b1c057dc` |
| S05 | `plugins/foreman-line/docs/goals/routing-currency-and-merit/gate-1-reopen-proposal.md` | ratified amendments | `c661823fef414f83fa716fb52fb78061d5ece0613d159f484e2fb4e70d5621af` |
| S06 | `plugins/foreman-line/docs/goals/INDEX.md` | goal index | `d10de5af1553d2405860e2ab3efa242279fa422c72fd8dba102aba404aeb1e30` |
| S07 | `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/charter.md` | HAWF charter | `6f9cd2a813dd69b1ec061df06db34e2bfb5098156643088c344de92a10900253` |
| S08 | `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/loop-directive.md` | HAWF directive | `508fb3206520a5f4161f7f1e5076009fb56d420d1daeae924dacd75e489b4b51` |
| S09 | `plugins/foreman-line/docs/goals/foreman-line-boundary-routing/charter.md` | boundary-routing contract | `b02460686c89453cb4ca812127384d9723db6c67935f5442340dd9ea416aa567` |
| S10 | `plugins/foreman-line/docs/specs/active/RCM-P0-current-instance-recon.md` | accepted parcel spec | `20f2f6f26f32d51ef085abbfd2b30e9357c177eb5180cff04104ba21d1cf53d0` |
| S11 | `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` | standing constraints | `57e345f9294cb8fcd8c3d90325505c80903648f60522f820061a5f8f288a86ac` |
| S12 | `plugins/foreman-line/shaping/package.json` | shaping runtime manifest | `6b34e93b94db565e625393c5cd2e9c6e131e30dc649d87937e61bb69b925f569` |
| S13 | `plugins/foreman-line/spec-linter/package.json` | spec-linter runtime manifest | `6247ddaad5d93dcd1fd2fbeff98cf34a9885ca7228b10b542882cf51e6711aff` |
| S14 | `plugins/foreman-line/dispatch/src/approval-cli/index.ts` | dispatch caller source | `1eceee9253163c829bc80fd5e96f1f3810a672e2871a436f04a48eb0b876281d` |

## Freshness and handoff

Fixed evaluation time: 2026-09-20T15:23:52.9276997Z. Proposed maxAgeSeconds: 86400;
accepted maxAgeSeconds: null. Oldest required host/provider fact time: null; computed
age: null; verdict: refused. Daily cadence does not establish TTL. R1 clauses 1-2 bind
the refusal, not TTL approval. Missing/future/stale/changed source times must refuse;
historical replay at a recorded time is not current freshness acceptance.

Handoff owners: RCM coordinator for acceptance, HAWF reconciliation ruling and review
routing; host owner for any separately authorized safe export/correction; later parcels
for runtime implementation. The coordinator reports two independent frontier reviews that produced this rework.
Their reports are not independently attested by this builder; post-rework review and
coordinator acceptance remain outstanding. Nothing here releases downstream holds.
