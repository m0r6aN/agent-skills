---
ticket: CCM-P2C
title: Deterministic Python declaration extraction library
status: done
owner: clinton.morgan
created: '2026-10-23'
updated: '2026-10-23'
risk: elevated
surfaces:
  - src/keon/cortex/pipeline/ccm_python.py
  - tests/test_ccm_python.py
  - docs/specs/ccm-python-symbols-v1.md
routing_class: implementation/standard
verification_class: judgment-required
permission_profile: builder-standard
expertise: engineering
inputs: [text]
thinking_level: low
---

## Intent

Add one pure standard-library Python declaration extractor over caller-supplied
UTF-8 bytes. This is a narrow P2 capability for later Git acquisition, civic
mapping and extraction orchestration. It does not execute source, acquire files,
authenticate producers or admit hostile input into an unbounded host process.
One small implementation packet should be sufficient for an eligible low-cost
builder, with independently frozen fixtures and separate architecture/security
reviews. This draft does not authorize dispatch or change credential holds.

## Constraints

- Exact API: extract_python_symbols(content: bytes) -> PythonExtraction, directly
  imported from pipeline.ccm_python. Reject non-exact built-in bytes, including
  subclasses, without invoking their methods. No path/format/commit/trust argument.
- PythonExtraction and PythonSymbol are frozen slots values. Extraction fields:
  content_sha256 (lowercase full SHA-256 of ALL original bytes) and symbols
  (tuple). Symbol fields: kind (class/function/async_function), lexical_name
  (tuple of parsed identifier strings), start_byte and end_byte (exact ints).
  Reprs omit all names and symbol payloads. No source body/literal/docstring,
  decorators, annotations, base expressions or arbitrary user metadata returned.
- Names use Python parsed identifier semantics, including NFKC. Source bytes are
  never normalized. Lexical ancestry contains enclosing class/function/async
  declarations; control blocks add no component. Include unreachable declarations
  without evaluating reachability. No synthetic lambda/comprehension names.
  Keep duplicate declarations; sort by original start_byte ascending.
- Byte offsets are zero-based half-open ranges into original bytes. Start at
  class/def/async keyword, excluding decorators; end at parser end position,
  excluding later comments/newlines. Parent/child ranges may overlap. Empty valid
  source returns no symbols and its exact digest.
- Strict UTF-8 with one optional initial UTF-8 BOM. Remove BOM only for parsing;
  map parser UTF-8 byte columns back to original byte starts, including the BOM
  adjustment on the first source line. Preserve CRLF/LF, Unicode form and bytes
  for digest/ranges. Follow tokenizer first/two-line effective coding-cookie
  recognition, but accept only case-insensitive utf-8 or utf8 spellings. Other
  effective cookie declarations fail closed, including ASCII latin-1 sources.
- Request best-effort Python3.10 feature parsing explicitly and preserve Python3.10 library source
  compatibility. Select the pinned Python3.13.15 Linux image in
  parser-host-profile-20261023.md for production parsing. Actual3.10.22,3.12.15
  and3.13.15 observations now exist; tests of this future library remain required.
  Token counts are canonical-runtime-specific, not invariant across interpreters.
  feature_version is best-effort: this is not an exact Python3.10 recognizer.
- Coordinator-selected implementation/review limits:262144 input bytes,20000 emitted tokenize.tokenize tokens
  (including ENCODING/ENDMARKER),64 bracket nesting levels,64 lexical declaration
  ancestors and2048 declarations. Count brackets only as operator tokens outside
  strings/comments. Validate byte size before decode; strict decode and cookie
  policy before tokenization; tokenize before AST parse; check declaration limits
  before returning. Selected host mechanisms now pass bounded canaries; bounded
  test-host review and worker admission remain required before Gate2. Production
  adapter implementation/composition review precede hostile production input. Scalar
  guards are not time/memory sandbox guarantees.
- Use iterative AST traversal. SyntaxError/tokenizer failures become invalid_syntax;
  resource guard, MemoryError or RecursionError becomes resource_limit. Closed
  PythonExtractionError codes: invalid_content_type, resource_limit, invalid_utf8,
  unsupported_encoding, invalid_syntax. Apply validations in the order above; a
  later token limit does not supersede an earlier decode failure. No partial result.
- Errors expose only the closed code through str/repr; args empty and no raw
  cause/context/source/filename retained. Raise sanitized failures outside caught
  exception contexts. Do not log inputs, names, parser output or diagnostics.
- No imports/execution of supplied code, filesystem/network/Git access, subprocess,
  storage, queue, live model, environment/credential inspection or hidden global
  mutable state. This library does not provide its own process/sandbox boundary.
- Preserve accepted P2A/P2B files and package exports. Source hashes, offsets and
  public result constructors are fingerprints/data, not trust attestations.
  P3 must scrub returned text immediately before actual durable enqueue.

## Acceptance Criteria

1. The three allowed new files define and implement the exact API, immutable
   types, field semantics, validation order, draft-qualified limits and errors.
2. Focused tests use independently frozen expected names/order/digests/ranges,
   including the six byte-oracle cases and twelve expanded fixture observations.
   Cover nested/repeated declarations, control flow, async/decorators, multiline
   signatures, BOM/CRLF, Kelvin/NFD identifier semantics and exact source bytes.
3. Tests reject malformed/truncated UTF-8 and syntax, unsupported effective
   encoding cookies and the frozen unsupported-syntax fixtures, including except*.
   Do not claim exact3.10 language recognition. Verify empty input and a
   parse-only side-effect canary without executing it. Cover type subclasses
   whose methods raise if called; no subclass callback may run.
4. Error str/repr/args/cause/context and result reprs disclose no unique sentinel
   source/name. Resource failures return no partial symbol set. No raw traceback
   or exception reaches the public interface. No file/network/source effects.
5. At/above-bound guard cases run only under a separately qualified restricted
   parser host. Independent review must verify bounded memory/time/process/input/
   output controls; byte/token checks alone cannot satisfy this prerequisite.
   No dangerous stress test or hostile-input production admission in this parcel.
6. Actual supported-host fixture comparisons, focused/full suites, Black/isort/
   mypy and exact-head CI pass with prior accepted identities/pins/skips retained.
   Existing failures/skips require evidence-based triage, not threshold relaxation.
7. One implementation and at most one formal repair; two completed independent
   architecture/security reviews plus exact-head and merged-main green CI before
   acceptance. Draft advisory success alone never authorizes implementation.

## Out of Scope

- Restricted runtime adapter, pipe protocol implementation, Windows Job Objects,
  Linux isolation controls or general sandbox/launcher development.
- Git acquisition, repository walking, module imports, source execution, semantic
  inference, civic mapping, extractor engine, storage or ingestion orchestration.
- Producer qualification, provenance promotion, P3 enqueue integration, personal
  data import, capacity/throughput benchmarks or all-language coverage claims.
- Existing package files, exports, accepted parsers/scrubber, dependencies, CI,
  gateway/client configuration or any credential handling.

## Allowed Files

Exactly these NEW paths in the sole Cortex implementation repository:

- src/keon/cortex/pipeline/ccm_python.py
- tests/test_ccm_python.py
- docs/specs/ccm-python-symbols-v1.md

No existing file edits. Fresh clean checkout D:/Repos/ccm-cortex-readiness-20261023
at91c57778804a4f1097b07049176c1af533c840e2 has matching accepted P2B blobs and no
proposed P2C paths. Recheck before dispatch and establish the actual complete
prebuild baseline/pins. Historical broken worktrees are untouched.

## Context & References

- docs/goals/collective-civilizational-memory/ast-source-contract-plan-20261022.md
- docs/goals/collective-civilizational-memory/ast-parser-execution-boundary-20261022.md
- docs/goals/collective-civilizational-memory/evidence/ast-small-byte-oracle-20261022.json
- docs/goals/collective-civilizational-memory/evidence/ast-expanded-fixture-observations-20261022.json
- docs/goals/collective-civilizational-memory/loop-directive.md
- docs/CONTEXT-SPEC-V4.txt and accepted S01-S12/C02-D1 boundaries.

## Verification Plan

Oct23 readiness follow-through: fixed test-host snapshot received independent
PASS/PASS after one repair. Actual baseline2975PASS137SKIP0fail/error retains all
3047 accepted identities plus65new and419tracked pins. See
p2c-readiness-result-20261023.md for residuals. This does not clear a source worker:
Cortex is PRIVATE; current Kimi L3 qualification is public/no-tools only. The
single Kimi advisory attempt returned length/empty and was not retried. Spec stays
draft; source/worker admission remains held, not another owner permission request.

Before Gate2: retain/recheck the recovered checkout, establish the actual prebuild
baseline/pins, independently review the bounded test host and clear worker/route
admission. Build this library with fixed fixtures; complete the production adapter
and combined review afterward, before hostile-input admission. Compare the actual
library on supported runtimes. See p2c-noncircular-admission-sequence-20261023.md.
Mechanism/profile
evidence is in parser-host-profile-20261023.md. Credential-bearing
workers remain held; no implicit route release follows from refreshed gateway
state. Fresh dated cost/account/foreign-hold admission precedes any paid phase;
October22 allowances are not rolled into October23.

The future compact builder packet contains this draft, exact accepted package
interfaces, fixed fixture oracles and relevant test commands only. Prefer exactly
opencode-go/kimi-k3.1-pro in an eligible isolated Pi session per owner direction;
no automatic frontier escalation, retry/provider hunt
or incident transcripts. Reviews independently assess Unicode byte mapping,
resource/error behavior, non-execution, trust boundaries and scope preservation.
No budget, paid dispatch, receipt, Jira registration or active status is created.

## Delegated Gate 2 — October 23

Owner explicitly authorized private worker qualification and AST build. Controlled
GenSpark gpt-6.1-sol/low supplied-artifact proposal only; no tools or credential
access. Step0 accepted; fixed test-host closure PASS/PASS and complete clean
baseline verified. Parent applies exactly the three new files on
feat/foreman-line-ccm-p2c at the recorded base. Existing draft-era hold wording
above is historical readiness context, superseded only for this admitted source
proposal. Native Pi/private-shell and affected provider routes remain held.
One implementation, at most one separately admitted formal repair, independent
architecture/security reviews and exact-head/merged-main CI remain mandatory.
