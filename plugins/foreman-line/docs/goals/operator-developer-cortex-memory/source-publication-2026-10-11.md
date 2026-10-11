# G5 source publication and immutable input checkpoint

**Coordinator / selected G10 technical owner:** Pi `01a12a83-24d6-7641-b3ac-52563eeb86fb`  
**Authority:** `owner-rulings-g5-g12-2026-10-11.md`  
**Kind:** actual GitHub publication and local preservation observations; NOT independent review, release acceptance, coordinator lint or a Foreman route/approval receipt

## Actual remote evaluation commits

All three repositories were confirmed PRIVATE through authenticated GitHub metadata. Each new branch is **`wip/opmem-evaluation-20261011`**, created without overwriting an existing ref. Post-create API readback matched the actual commit SHA.

| Source | Published evaluation commit | Snapshot parent | Captured work |
|---|---|---|---|
| [Cortex](https://github.com/Keon-Systems/keon-cortex/commit/d9dd57afcf7fe64771e09635f5f55405a5bfc2ae) | `d9dd57afcf7fe64771e09635f5f55405a5bfc2ae` | `ba33bb9f7ebb1ff39a1420377feeca2c6ccccfd5` | Five tracked `.claude/worktrees/*` gitlink removals |
| [Gateway](https://github.com/Keon-Systems/keon-mcp-gateway/commit/69a42221d518138dffb6c26f12ff8e2fafcdddab) | `69a42221d518138dffb6c26f12ff8e2fafcdddab` | `9916d6a0c8a019f8851be5b326bf6d11088d2ad0` | Five dirty metadata/GA-document paths plus net local-only LICENSE change |
| [Docs](https://github.com/Keon-Systems/keon-docs/commit/1b1a967fe47ea312822ec7fbfb4ed05da47e2a8b) | `1b1a967fe47ea312822ec7fbfb4ed05da47e2a8b` | `ddcf3e6d0e4fd23569ce3a8528360cecd13b6fe5` | Eleven dirty text paths: metadata, Runtime canon, claims and content |

Native Git remote access failed, including an ephemeral authenticated-HTTPS preflight; its underlying cause was not fully diagnosed. No credential file or global/repository auth config was modified. The existing authenticated `gh` CLI's supported Git Data API created actual blob/tree/commit/ref objects instead. This is real remote publication, not a fabricated push log. File-blob and complete tree identities were compared with locally built temporary-index trees before publication. No force update, main/develop push, PR or merge occurred.

Gateway local HEAD `d6376fd024d43be7ff458af675c646ae93c52492` and its preceding LICENSE-only commit `17243016f8e8f606de929769593b3c989d008e80` were absent from GitHub. Their net LICENSE content is included in the new evaluation snapshot on their already-published ancestor. Their original local identities/history are untouched; this snapshot does NOT recreate their ancestry or approve their licensing decisions.

These snapshots capture working bytes, not merely the prior staged subsets. Raw bytes are intentionally preserved. They are **unreviewed, untested evaluation artifacts**, not source-of-truth release pins or ready-to-merge implementations. A bounded secret-pattern scan is not comprehensive security certification.

### Original checkout preservation

Before/after capture compared exact active HEAD, symbolic branch, porcelain status, original index-file SHA-256 and every dirty regular file's SHA-256, including the held media. All matched. Original branches remain `main`; cached remote refs, staged/unstaged splits and original files are retained. Temporary indexes/Git objects do not imply an OPMEM execution worktree.

| Source | Preserved original index SHA-256 |
|---|---|
| Cortex | `0528f7310e87745347f565e349d3d1970c65c228d41a3166e1a533c7eed4dd5b` |
| Gateway | `e73b5b4be8c09c8c94430ecacb07619cfa07461f0acfd662bb5efc58a988e1a4` |
| Docs | `20d299c355b528f4e3b2c19751aefd3dfcf84fe50b3cc582a156405968adca62` |

**Held:** untracked `keon-docs:engagements/hf_20260824_123830_15986c6b-64b0-4d2d-9d80-3ff1af747dd2.mp4`. Unknown media content was not uploaded. Goal/internal packet artifacts and original draft/handoff remain local/untracked: agent-skills is PUBLIC, and broad Git authority is not silent public reclassification of internal payloads. A suitable private publication destination or explicit data-disposition evidence is required before uploading that packet publicly.

## Clean immutable current-upstream inputs

Current `main` refs were queried from GitHub, then their exact commit identities were read. No dirty checkout was fetched, reset, rebased or used as the clean source export.

**G10 source-owner disposition:** accept the following exact revisions as **initial P0 reconnaissance inputs**, using the owner's explicit delegation to this coordinator. This is a bounded source-input decision, not a claim of independently verified correctness, production-supported/deployed release truth, approval of WIP changes, or completed numerical/API/canon contracts. Relevant frozen-contract/edition decisions and initial independent review still govern P0 baseline approval. Do not borrow release acceptance from ADMIN metadata or from a mutable branch name.

| Input | Immutable current-main commit | Local form |
|---|---|---|
| Cortex | `50c5f42d297848148123519cb1607c079782ba43` | Complete clean source archive |
| Gateway | `c92e42afeb84a5f425c282cfc9c7637f3e058fd4` | Complete clean source archive |
| Docs | `b6211f8a202e9f21b6356d79028fb1f58b26ae69` | Explicit five-file sparse source snapshot, NOT complete checkout/archive |

Storage: **`D:/Repos/opmem-source-snapshots-20261011/`**, outside the public agent-skills checkout. Cortex/Gateway archives passed GNU tar integrity listing (`--force-local`, required for native Windows drive-colon paths). Each saved payload's Windows `IsReadOnly` was read back as `true`. This is a filesystem read-only attribute plus read-only usage policy, **not** a sandbox/ACL guarantee against its owner changing attributes.

### Archive identities

- Cortex: `cortex/50c5f42d297848148123519cb1607c079782ba43/source.tar.gz`; 581,201 bytes; 441 entries; SHA-256 `32617ab976f1ffa53e59e7ca657030ff0a170ca40328fe7f7005d1ef8c541e7b`.
- Gateway: `gateway/c92e42afeb84a5f425c282cfc9c7637f3e058fd4/source.tar.gz`; 315,303 bytes; 219 entries; SHA-256 `54f2d3d64f6132bec83245b017d66353b580af280ed1efab12a52567e794ee26`.
- Docs actual root tree, from commit metadata: `8a57efd15e658d58389f88ab6ea2fada810ba8e6`. Recursive tree response included 3,189 entries without truncation. The tree endpoint queried by commit returned that query identifier in its top-level `sha`; do not mistake it for the root tree identity.

### Docs sparse contents

Path prefix: `docs/b6211f8a202e9f21b6356d79028fb1f58b26ae69/sparse/`. Bytes retrieved through immutable Git blob endpoints; blob identity was independently recomputed locally before saving. This is deterministic integrity checking, not adversarial review.

| Path | Git blob | SHA-256 |
|---|---|---|
| `AGENTS.md` | `e7095d2d5c7ae816c56197efdebfd74dc7a76ea1` | `05755a240a2e7d42ecf66305aaccbca5bfeb032697fe55ebdf5a7d96d5cd4449` |
| `README.md` | `9d44b2a0f2788e75179c42b820e9870d304e0436` | `805ea98a4ed7f87bcfeec65b1bbd6b5936e8733fdf684261aadd8d3191449384` |
| `canon/keon_cortex_canon_v1_locked.json` | `265a2351716c276994e5e27b531ab78c041349f1` | `adf806f8c1abbcd3b45a3acc1bbc87ed5332b70405c4aea93f1f16fbef060a84` |
| `canon/keon_runtime_canon_v1_locked.json` | `2d57848b8305c81fa3df125306d55b46a52dc795` | `e34a1f2407e71f80bd6ad13d3922f9215b862c7d4c30cee7bc640fa9413d3dba` |
| `canon/claims/CAPABILITY_REGISTRY.yaml` | `8fa0d11467985969535f543f33b2368826cdbf2c` | `9e5e0714160783faf00d507e8fa958def12d632ef3e775416740edb718d6db12` |

Sparse total: 138,819 bytes. Requested `canon/keon_governance_canon_v1_locked.json` is **absent** at this pin; no authority or file contents were invented for that path. Other needed source surfaces must be retrieved at the same immutable pin or by explicit input-revision change; absence from this subset is not absence from the repository.

The full docs archive timed out at the bounded 60-second download after writing **1,557,037,056 bytes**. It was incomplete, never integrity-certified or used as source truth. The exact newly created partial file was removed after canonical-parent/size checks to protect disk/primary delivery; no original source data was removed and no automatic large retry was made. Use the explicit sparse input rather than claiming a complete docs clone.

## Public tracking action

Created and read back OPEN: **[m0r6aN/agent-skills #174](https://github.com/m0r6aN/agent-skills/issues/174)** — repository-wide removal of the owner-named corporate references and a real GitHub-only delivery-tracking path. Stable body marker `opmem-corporate-reference-removal-20261011` had no existing match before creation. Public issue contains no private source payloads. Its existence does not satisfy frozen-contract amendment, W1 approval, live registrar receipt or cleanup implementation.

## Original OPMEM inputs preserved

Current SHA-256 readback:

- Original narrative plan: `342315dae66b4d396c71db40f771dc03a49fbd60b5272587cdd4dcb1da479d68`.
- Original Stage A advisory JSON: `fdb7382de127958887006935b95c4fe1e08ba3e8cbbfed0268a70ae9b661eacf`.
- Original P0 draft: `2731d720bb5718f1fe8821917f2d53a2004db8912aca96df8789b354dc6d9062`.
- Original shaping JSON: `b178c9d498be1c63e30c483d293b1d374f822e5540817ac74d18485ac46e7aa1`.

These observations do not promote the draft or mint an approval. No P0 deliverable, independent plan review, package suite, W1 projection/approval/registration, builder/reviewer launch, new delegate/probe inference, PR/merge, cloud/Neon operation, installation or background worker occurred. Existing interactive-session billing was not inspected; no zero-total-cost or remaining-balance certification is made.

Final administrative closure readback passed: all three remote evaluation refs match the published SHAs; original dependency HEAD/main branch/index identities match; all four original OPMEM input hashes match; all seven P0 outputs remain absent; issue #174 remains OPEN; agent-skills HEAD remains `0df276e6c7c440093ebc3f836372d8c2bc92ba9e`. This is deterministic preservation/publication checking, not independent review, package test coverage or goal completion.
