# Next AST component: safe preparation

Status: proposal and fixture plan only. No source implementation, parcel approval,
paid request or worker dispatch. P2A and P2B acceptance remains unchanged.

Follow-through under renewed owner instruction is saved in
[AST contract/source plan](ast-source-contract-plan-20261022.md): concrete pure
API, declaration/offset/Unicode/error decisions, proposed three-new-file scope,
and six independently verified small byte fixtures. Resource limits and parser
execution-boundary qualification remain open before a formal workorder. The later
plan supersedes undecided interface alternatives below, without claiming build
admission or changing credential holds.

The accepted v4 D8/P2 outline requires deterministic AST/git symbol extraction,
structured civic mapping and an extractor engine. Keep these as small components
that a cheap builder can implement and a reviewer can assess independently.

## Proposed next slice

Start with a caller-supplied Python source item on the canonical `pipeline/**`
surface. It performs no filesystem reads, Git commands, imports or execution of
the supplied program. Git acquisition and authenticated source admission remain
separate. Python-only coverage must be explicit; other languages are not silently
counted toward repository coverage or the 500-files/min target.

A proposed API is `extract_python_symbols(source: bytes, *, relative_path: str)`.
Return an immutable sequence of declarations: class, function and async function,
with qualified lexical name, kind, original UTF-8 byte range and full source-byte
SHA-256 fingerprint. Exact field names and treatment of decorators, nested scopes,
duplicate declarations and anonymous scopes require ratification before shaping
closes. Do not add source bodies, docstrings or arbitrary literals merely because
the parser can return them.

Every returned name and path remains untrusted content. P3 must invoke P2A after
parsing and immediately before durable enqueue. A deterministic parser, source
hash, relative path, commit label or fixture filename does not authenticate a
producer, confer provenance tier, exempt credentials or widen execution authority.
P1A's positive authenticated legacy-producer coverage remains zero.

## Decisions to resolve before a workorder

- Pin the Python grammar and supported host versions. A parser setting is not a
  substitute for matching retained fixtures across the actual supported CI hosts.
- Preserve source bytes and line endings for hashing and offsets. Define UTF-8
  BOM handling and the mapping from parser line/column positions to original byte
  spans, including non-ASCII identifiers and CRLF. Decide whether names represent
  raw spelling or Python's identifier semantics; do not silently normalize them.
- Propose finite source, token, nesting and declaration limits. Candidate starting
  limits are 256 KiB, 20,000 tokens, depth64 and2,048 declarations; these numbers
  are **not ratified**. Determine whether a guarded in-process parser suffices or
  a bounded subprocess is necessary. Token/bracket limits alone do not prove the
  parser cannot exhaust stack or memory on unusual expressions.
- Define atomic, content-free errors with no raw SyntaxError/UnicodeDecodeError
  cause, context, source line or filename in diagnostics. No partial accepted
  declaration set after malformed input or a limit failure.
- Confirm exact new filenames and existing pipeline boundaries on the accepted
  base. P2B's new package exists now; its files are accepted pins, not edit scope.
  Avoid adding another package or a parallel extraction framework.

## Independent fixture matrix

Freeze expected source hashes, original byte offsets and declaration ordering
before consuming builder output. Include:

1. Plain functions, async functions, classes, nested methods and nested functions.
2. Multiple declarations with the same spelling in different and repeated scopes.
3. Decorators, multiline definitions, comments and docstrings, with an explicit
   rule about which bytes belong to a declaration span.
4. UTF-8 BOM, LF/CRLF, non-ASCII identifiers, decomposed text and an identifier
   whose Python spelling semantics differ from its original source bytes.
5. Malformed/truncated UTF-8, malformed syntax, an encoding-cookie mismatch and
   syntax outside the ratified grammar.
6. Dense declarations and nested or long-expression inputs at and above each
   admitted resource boundary; no aggressive or live fuzzing.
7. A program containing calls that would write a sentinel if executed. Parsing
   must not execute it or import its dependencies.
8. Secret-like names, paths and literals: no fixture/path exemption, no logging,
   and no claim that parser output has already been scrubbed or authenticated.

The reference oracle and hostile checks should be fixed and bounded. Do not
prove source behavior only by calling the implementation under test twice.

## Future admission

After credential disposition permits workers, use one fresh small builder,
exact allowed files, a clean accepted-base baseline, retained identities/pins,
one implementation and at most one formal repair. Require completed independent
architecture/security reviews and actual exact-head plus merged-main CI.
Prefer compact completed review verdicts. A new paid phase still requires fresh
account, date, foreign-hold and finite-budget checks; no budget is inferred here.

Until then, bounded parent validation may use the verified OS-only subprocess
environment. That boundary does not admit a native worker whose tool process
still inherits credentials or prevent same-user registry/file access.

## Bounded local observations

Eight synthetic cases passed in a fixed OS-only parent subprocess on Python
3.13.7, with zero provider requests and no execution of supplied source. Cases
cover plain declarations, BOM/CRLF, Unicode and decomposed identifiers, decorators
and nested async declarations, an encoding-cookie conflict, syntax outside the
requested grammar, and a parsed top-level raise canary that was never executed.
Evidence: `evidence/ast-preparation-observations-20261022.json`.

The observations make two contract decisions concrete: Python's parsed names can
differ from original identifier spelling (Kelvin-sign identifier becomes K;
decomposed spelling becomes the composed name), and a BOM needs explicit handling
when mapping first-line parser positions to original bytes. These are current
runtime observations, not a ratified cross-version parser or safety profile.
Supported CI runtime comparison and adversarial resource bounds remain open.
