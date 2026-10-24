---
ticket: CCM-P2D-A
title: Bounded Git object snapshot validation
status: active
owner: clinton.morgan
created: '2026-10-24'
updated: '2026-10-24'
risk: elevated
surfaces:
  - src/keon/cortex/pipeline/ccm_git.py
  - tests/test_ccm_git.py
  - docs/specs/ccm-git-snapshot-v1.md
routing_class: implementation/standard
verification_class: judgment-required
permission_profile: builder-standard
expertise: engineering
inputs: [text]
thinking_level: low
---

## Intent

Deliver the first Git acquisition dependency: a pure bounded validator over
caller-supplied uncompressed Git objects for ONE exact SHA-1 commit. It resolves
committed file paths from hash-verified binary trees, preserves author metadata,
and never invokes Git, reads a repository or executes source. P2D-B must qualify
the local bare-repository acquisition adapter separately. Remote fetch, real
repository access, ingestion and trust admission remain outside this parcel.

## Constraints

- Python3.10+, standard library only. Three NEW allowed files; no existing-source
  edits. No imports with I/O, subprocess, shell, AST/source execution, network,
  filesystem, environment/credential/config reads, persistence or model calls.
- Public API: validate_git_snapshot(commit_oid: str,
  objects: tuple[GitObject, ...]) -> GitSnapshot. Exact built-in str/tuple and
  exact GitObject elements; reject subclasses without calling supplied methods.
  GitObject is frozen slots dataclass, fields oid:str, kind:str, data:bytes;
  field types must be exact built-ins too. All public value dataclasses repr=False.
- Only lowercase40hex SHA-1 object IDs. This is a bounded integrity profile,
  NOT authenticated provenance or collision-resistant identity. Recompute every
  supplied object's SHA-1 over ASCII kind + space + decimal byte length + NUL +
  ALL original bytes; use hashlib.sha1(..., usedforsecurity=False). Kind must be
  commit/tree/blob. Reject duplicate OIDs, mismatched hashes, unknown kinds,
  missing referenced required objects and extraneous unused objects. A root
  commit, each reachable tree and regular blob must be provided exactly once.
  Parent commits, symlink target blobs and submodule commits must NOT be fetched
  or included solely for those references. A blob needed by a regular file may
  coincidentally also be a symlink target. No partial success or silent truncation.
- Bounds checked before hashing/parsing: <=512 objects, <=2097152 total supplied
  data bytes, commit/tree each<=65536, blob<=262144. Reject oversize regardless
  of reachability. Each walk visits <=256 tree entries TOTAL across expanded
  paths (including directories/exclusions), <=32 directory components, <=1024
  UTF-8 path bytes. Reused tree DAGs count on every expansion; cycle detection
  and depth/entry bounds prevent amplification. Input objects are already
  materialized: no allocation/CPU sandbox claim and no stream acquisition claim.
- Commit raw bytes require header/message separator LF LF; exactly one tree,
  author and committer header, zero or more parent headers preserving order.
  Tree/parent values exact lowercase40hex. Identity grammar:
  UTF-8 name + ASCII ' <' + UTF-8 email + ASCII '> ' + signed decimal seconds
  + space + [+-]HHMM. Name nonempty, email may be empty; each <=1024 bytes,
  neither contains angle brackets or control characters (U+0000..001F,007F).
  Seconds optional '-' then1..12 ASCII digits; no '+'. HH<=23,MM<=59.
  GitIdentity fields name:str,email:str,seconds:int,timezone:str,raw:bytes,
  preserving complete exact original identity header VALUE in raw.
  Optional encoding header exactly UTF-8 (ASCII case-insensitive), at most once.
  Unknown ASCII [A-Za-z0-9-]+ headers and space-prefixed continuations allowed;
  continuations only for unknown headers, never tree/parent/author/committer/
  encoding. Reject malformed/duplicate known headers. Message is opaque bytes,
  never decoded/executed/returned; original commit SHA-256 covers all bytes.
- Tree raw records are canonical ASCII mode + space + raw filename + NUL +20
  binary OID bytes. Closed modes:40000 directory,100644/100755 regular blob,
  120000 symlink,160000 submodule. Verify record termination/length, unique names
  and canonical Git order (compare filename plus slash for directories, NUL for
  others). Path components strict UTF-8,1..255 bytes; reject '.', '..', casefold
  '.git', slash/backslash, U+0000..001F and007F; preserve Unicode/case/original
  bytes otherwise. No Unicode normalization or host filesystem interpretation.
  Symlinks/submodules become GitExcluded(path:str,git_oid:str,reason:str) with
  closed reasons symlink/submodule; never resolve targets or require target
  objects. Unknown modes fail, never treated as regular files.
- GitFile fields path:str,mode:str,git_oid:str,content_sha256:str,content:bytes.
  GitSnapshot fields commit_oid:str,tree_oid:str,commit_sha256:str,
  author:GitIdentity,committer:GitIdentity,parents:tuple[str,...],
  files:tuple[GitFile,...],excluded:tuple[GitExcluded,...]. Sort files/excluded
  separately by path.encode('utf-8'), preserve every committed file byte,
  including binary/non-UTF8 blobs and executable mode without execution.
  Empty trees/files and shared blobs are valid. No repo/scope/source_kind/trust
  field: caller labels cannot become authenticated author or producer evidence.
- GitSnapshotError exposes ONLY closed code via str/repr, args empty, cause and
  context cleared even under ambient caller exceptions. Codes: invalid_input,
  resource_limit, invalid_object, invalid_commit, invalid_tree, missing_object,
  unsupported_path. No raw bytes, paths, names or diagnostics in public errors.
  Precedence: shape/types/oid syntax -> size caps -> object integrity/duplicates
  -> required root kind/commit syntax -> tree walk/missing objects -> extras.
  Missing root/reference -> missing_object; wrong required kind/hash/duplicate/
  extras -> invalid_object; unsupported path -> unsupported_path; structural
  tree errors/modes/order -> invalid_tree. Raise outside raw handlers and clear
  fresh error cause/context explicitly, following accepted Python error pattern.
- Git metadata and hashes are candidate evidence only; concrete authenticated
  producer coverage remains ZERO before legacy high-trust backfill. All returned
  identity/path/content text must be scrubbed at the FUTURE actual durable P3
  boundary. No outbox/import or claim of full Context readiness in this parcel.
- Controlled GenSpark Sol/low no-tools supplied-code proposals only, cheapest
  currently qualified private-code route. Native/private Pi and affected routes
  held; Kimi remains unqualified for private code, MiMo qualification failed.
  All existing reservations retained. Each paid call requires current account,
  catalog/credential-isolation and foreign-ledger guard. No retries/fallback.

## Acceptance Criteria

1. Exact pure API and immutable payloads satisfy the complete contract; all
   supplied object bytes verified before use, no unauthenticated path listing.
2. Independent synthetic Git-format fixtures fix SHA-1/SHA-256/path/mode/author
   expected values; cover nested/shared/empty trees and binary/empty blobs,
   symlink/submodule exclusions with missing target objects, opaque message,
   unknown signature headers, parent order, Unicode and timezone boundaries.
3. Table tests exercise each type/closed code, hash mismatch/wrong kind/duplicate/
   extra/missing, malformed commit/identity/encoding/continuation, truncated tree,
   unknown mode/order/name/path/depth/entry amplification, every size at/above
   bound, hostile subclasses without invoked methods, and ambient-error hygiene.
   Invalid envelope must otherwise be valid for the predicate under test; use
   independently encoded fixtures, not implementation helpers to manufacture
   the only oracle. No supplied source execution in any fixture.
4. Restricted OS-only test environment, exact unchanged base tree pins and
   full baseline case/disposition preservation. Focused/full tests, formatting,
   import sorting and mypy PASS. Two fresh architecture/security reviews;
   disclosed same-family independence limitation if both use Sol.
5. One implementation, at most one focused repair under existing owner authority;
   new capability/scope changes require separate parcel. Exact reviewed head CI,
   green merge/main checks and status-only StageF archival before acceptance.

## Out of Scope

Git CLI/Docker adapter, filesystem/loose/packed object reads, clone/fetch/network,
credentials, hooks/filters/mailmap, checkout/symlink traversal, SHA-256 Git repos,
commit-signature verification, history import, AST composition/civic mapping/
extractor engine, throughput claims, storage, trust promotion and bulk import.

## Allowed Files

- src/keon/cortex/pipeline/ccm_git.py
- tests/test_ccm_git.py
- docs/specs/ccm-git-snapshot-v1.md

## Context & References

- Existing S01-S12 and charter remain binding; Gate1 is not reopened.
- ast-source-contract-plan-20261022.md: Git precedes civic/engine composition.
- Accepted P2C/P2C-RUNTIME establish pure-library then restricted-adapter pattern.
- Git object format: https://git-scm.com/book/en/v2/Git-Internals-Git-Objects
- Git security: https://git-scm.com/docs/git#_security
- Git SHA-1 is explicitly not authenticated producer admission (C02-D1).

## Verification Plan

Freeze exact workorder/base/budget and Step0 disposition before source GO.
Use synthetic uncompressed objects only; no real repository acquisition or
Git process needed. Reuse accepted3189PASS/137skip baseline only after complete
source-tree correspondence, run focused/full new candidate in restricted pinned
test image. Independently inspect output/error and forbidden-effect imports.
Obtain two fresh source-only reviews, triage without reviewer edits, allow only
one bounded focused repair if needed; exact-head and merged-main CI then StageF.


## Delegated Gate2 — October24

Owner next-parcel plus standing non-destructive approval authority admits ONE
controlled GenSpark Sol/low source proposal over this exact workorder. Step0
restate accepted with no flags. Allowed three new files only, basef05f209.
Frozen independent object oracle precedes source. Parent only applies source
after static inspection; restricted tests and two independent frontier reviews
remain mandatory. No Git adapter, actual acquisition, trust admission or held
route release. One focused repair maximum, all old holds retained.


## October24 bounded ARCH-01 corrective amendment

The first test-only correction remains recorded. Under the owner standing blanket
non-destructive decision/approval authority, coordinator approves ONE additional
local correction limited to ARCH-01: missing exact GitObject slots must return
invalid_input during shape checking, with seven incomplete-slot combinations and
shape-before-oversize tests. This explicitly supersedes the one-repair stop only
for this named correction, not a general loop. No other behavior/docs changes,
new source model request or phase ceiling increase. Initial PASS/security and
CHANGES_REQUIRED/architecture retained. Independently reproduced invalid_object
with empty args/context/cause. Two fresh final reviews mandatory; stop on any
remaining material finding. All reservations and affected routes remain held.
