# AST extraction: coordinator contract and source plan

October23 update: parser-host-profile-20261023.md supersedes provisional numeric
and host choices below. A fresh usable Cortex checkout and actual3.10.22/3.12.15/
3.13.15 bounded host observations now exist. Production parsing selects pinned
3.13.15 with3.10 grammar; token guards are runtime-specific. Production adapter,
independent review and prebuild baseline/admission remain open. Exact owner Pi
preference is opencode-go/kimi-k3.1-pro when cleared; no paid dispatch occurred.

Status: planning decisions under the owner's existing non-destructive authority.
Not a dispatchable parcel, Gate 2, parser safety qualification or implementation.
The affected secret-key routes and new credential-bearing worker hold remain.
Oversight retains gateway investigation and rotation-guidance custody.

## Narrow deliverable and downstream sequence

First deliver a Python declaration extractor over caller-supplied bytes. Git
acquisition, civic mapping and engine orchestration are separate parcels, in that
order after their own interface qualification. Keep each packet small enough for
one cheap builder; do not require a builder to infer the whole Context design.
No filesystem walker, Git execution, source import, semantic inference, storage,
provider call or producer authentication belongs in the pure AST slice.

Read-only git ls-tree on accepted merge
3a7c30b5cab7198b3ad6e7ff3b881bead8af823d confirms the pipeline package contains
__init__.py and ccm_text.py. Preserve both as accepted pins. Candidate NEW files:
src/keon/cortex/pipeline/ccm_python.py, tests/test_ccm_python.py and
docs/specs/ccm-python-symbols-v1.md. These are a proposed three-file source scope;
recheck absence on the eventual clean base before freezing Allowed Files. Do not
edit package exports, accepted parsers/scrubber, CI or dependency manifests.

## Interface decisions for the draft

Use extract_python_symbols(content: bytes) -> PythonExtraction, imported directly
from pipeline.ccm_python. Accept exact built-in bytes, rejecting subclasses
without invoking their methods. Omit relative_path from this pure API: acquisition
must attach and validate repository/source/scope metadata separately. A supplied
path or commit label is not authenticated provenance.

PythonExtraction is a frozen slots value with content_sha256 (lowercase SHA-256
of ALL original bytes) and symbols (tuple of frozen slots PythonSymbol values).
Each symbol has kind (class, function, async_function), lexical_name (tuple of
parsed identifier strings), start_byte and end_byte. Offsets are zero-based,
half-open ranges into the original bytes. Duplicate names remain separate rows;
source fingerprint plus byte range distinguishes occurrences, without claiming
global or tenant-authorized identity. No bodies, docstrings, defaults, annotations,
base expressions, decorators or arbitrary literals are returned.

Names follow Python parser identifier semantics, including NFKC normalization;
they do not purport to preserve identifier spelling. The source digest and byte
ranges preserve the link to original bytes. Never normalize source before hashing.
Lexical ancestry contains enclosing class/function/async-function declarations;
control-flow blocks add no scope component. Retain declarations beneath control
flow without evaluating reachability. Do not synthesize lambda/comprehension
names. Sort results by start_byte ascending. Declaration spans begin at the class,
def or async keyword, excluding decorators, and end at the parser end position,
excluding trailing comments/newlines outside that position. Parent spans may
contain child spans; they are not a partition of the file.

Strict UTF-8 only; accept one initial UTF-8 BOM, stripping it only for parsing and
adding its three bytes back to source positions. Preserve LF, CRLF, decomposed
Unicode and all other source bytes for hashing/offsets. Establish an explicit
encoding-cookie rule: only absent cookies or UTF-8/utf8 spellings (case-insensitive)
are accepted; other declarations fail closed, even when their bytes happen to be
valid UTF-8. This narrow policy must be documented rather than delegated silently
to differing parser entry points. Never report a parsed name/path as scrubbed.

## Grammar and resource admission

The subsequent planning decision in ast-parser-execution-boundary-20261022.md
selects a separately qualified bounded subprocess for hostile-source admission.
The alternative of admitting hostile input in-process is no longer the selected
plan. Numeric ceilings and actual host isolation/resource proof remain open.

Target Python 3.10 source grammar, requested explicitly through the supported AST
feature-version interface. Preserve the repository's Python 3.10 compatibility.
Actual matching fixtures on every claimed host runtime are prerequisites for a
compatibility claim; the prior Python 3.13.7 observations alone do not qualify it.
No claim of all-language repository coverage or 500-files/min performance follows.

Follow-through: the known local Programs/Python directory contains Python313 and
Launcher only; this is not an exhaustive system runtime inventory. Twelve fixed
synthetic fixtures passed on Python 3.13.7 with requested feature_version=(3,10),
using an isolated-mode child with only four OS environment names. They cover
nested lexical scopes, duplicate declarations, control blocks, decorated async,
NFKC/NFD identifiers, multiline signatures, parse-only raise, malformed UTF-8,
truncated syntax and except-star rejection. Evidence:
evidence/ast-expanded-fixture-observations-20261022.json. Raw AST accepted the
ASCII latin-1-cookie fixture, confirming the need for explicit cookie-policy
prevalidation. These observations qualify neither an actual Python 3.10 host nor
parser resource containment. A private Unicode fixture encoding mistake was
corrected before this evidence was saved; no production source changed.

Carry forward candidate 256 KiB source, 20,000 emitted tokenizer tokens, bracket
depth 64 and 2,048 declarations as PROVISIONAL guard values. Define the token count
to include every token yielded, including ENCODING/ENDMARKER when emitted; bracket
depth counts only operator delimiters outside comments/strings. These semantic
definitions remove builder guesswork but do not qualify the numeric limits.
Tokenizer guards must run before AST parsing; declaration limits apply atomically
before returning any accepted result. Finite byte size is not proof of a safe
parser memory, stack or wall-clock bound. AST traversal should be iterative.

Do not admit hostile/untrusted production input solely on these guards. Resolve
and verify the parser execution boundary before Gate 2: either evidence supports
the deliberately limited in-process profile, or a separate bounded host adapter
must enforce time/memory/process cleanup with platform-specific proof. Do not
quietly add such an adapter to the three-file pure-library scope. OS-only child
environment filtering is not filesystem/registry isolation or a memory sandbox.
No resource-flood tests are authorized by this planning document.

Closed PythonExtractionError codes proposed: invalid_content_type, resource_limit,
invalid_utf8, unsupported_encoding, invalid_syntax. Apply that validation order
where applicable; tokenizer failure maps to invalid_syntax unless a defined limit
was crossed first. Raise sanitized errors outside caught parser/decoder/tokenizer
exception contexts. str/repr/args/cause/context must expose no source text,
filename, parser detail or raw exception. Public result reprs must omit names and
symbol payloads because identifiers themselves can contain sensitive data. No
logging, partial result, timeout-as-success or silent skipped declaration.

## Frozen small oracle before builder output

The following offsets are hand-derived expectations, not measured parser results.
Independent fixed parent PowerShell/.NET byte computation verified all six spans
and froze their exact byte SHA-256 values in
evidence/ast-small-byte-oracle-20261022.json. No supplied Python was parsed or
executed. This verifies byte arithmetic only, not grammar or parser safety; do not
generate the remaining oracle from the eventual implementation.

| Literal source bytes | Expected declaration | Original span |
| --- | --- | --- |
| b"" | none | none |
| b"def f():\n    pass\n" | function, (f,) | [0,17) |
| b"async def f():\n    pass\n" | async_function, (f,) | [0,23) |
| b"\xef\xbb\xbfdef f():\n    pass\n" | function, (f,) | [3,20) |
| b"def f():\r\n    pass\r\n" | function, (f,) | [0,18) |
| b"@d\ndef f():\n    pass\n" | function, (f,) | [3,20) |

Extend this small oracle with nested/repeated names, decorated async declarations,
Unicode/NFKC spelling differences, multiline signatures and unsupported grammar.
Pin further SHA-256 values only after independent bounded byte computation. Include
closed-error sentinels and a parse-only source containing a side-effect canary;
never execute supplied code. At-limit resource cases await the admitted execution
boundary. Expected wrapper and individual symbol reprs must hide sentinel names.
Keep raw fixture inputs private when they contain synthetic secret-like text.

## Builder and reviewer packet boundaries

The future builder receives only the exact draft, accepted package interfaces,
three-file Allowed Files, frozen oracle and relevant formatting/test commands.
One fresh low-cost builder, one implementation and at most one formal repair;
no environment dump, credential store inspection, provider access or incident
transcript. Selection and spend require fresh date/account/foreign-hold controls;
this document reserves no credits and launches no worker or reviewer.

Independent architecture/security review must answer: are original byte spans
correct; are normalized names explicitly documented; can error/repr paths disclose
source; are resource assertions actually enforced; can downstream code confuse
fingerprints with trust; and are accepted source pins unchanged? Complete reviews,
baseline identities, exact-head CI and merged-main CI remain closure requirements.
The extractor is only one P2 capability, not readiness for ingestion.

P3 must scrub all returned textual fields immediately before durable enqueue.
Git acquisition later binds actual source/scope/commit evidence without executing
repository hooks or granting trust to labels; civic mapping consumes declarations
without inventing executed behavior; the engine composes these contracts and
records unsupported/pending work rather than silently dropping files. Detailed
Git/mapping/engine workorders remain future scoped artifacts.

## Remaining finite readiness work

1. Compare the independently frozen tiny oracle and expanded grammar fixtures
   against parser results on actual claimed runtimes; byte arithmetic is complete.
2. Resolve numeric guard limits and qualify the parser execution boundary.
3. Recheck exact new-file absence and clean accepted-base pins.
4. Produce the formal draft plus advisory/schema-valid shaping handoff.
5. Admit a worker only after the credential/isolation disposition and fresh budget
   checks; retain independent reviews and normal implementation gates.

No new owner feature approval is needed for these decisions under existing
authority. None of these readiness items is silently marked complete here.
