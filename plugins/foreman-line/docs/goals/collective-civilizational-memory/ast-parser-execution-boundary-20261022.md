# AST execution-boundary planning decision

October23 follow-through: selected Linux-container profile and numeric ceilings
are now documented in parser-host-profile-20261023.md with actual3.10/3.12/3.13
mechanism and fixture observations. Python3.13.15 is the canonical host with3.10
grammar, following lifecycle verification and observed token-count differences.
This supersedes unchosen numeric/host alternatives below. The production adapter,
protocol enforcement and independent review are still open; Windows-native Job
Object isolation is not claimed. No worker or route admission follows from tests.

Coordinator decision under existing owner authority: do not admit hostile source
to an in-process parser on byte/token guards alone. Select a separately qualified
bounded parser subprocess as the target production boundary. This is a design
decision, not an implemented adapter, approved runtime or resource-safety proof.

Keep the pure declaration contract in ast-source-contract-plan-20261022.md.

## Minimal pipe protocol planning

Select one source item per child lifetime. Request framing is a four-byte unsigned
big-endian byte count followed by exactly that many original source bytes and
EOF. No path, command, module name, parser option or shell expression is supplied
by the caller. Reject trailing bytes, premature EOF and oversized length before
source decoding/allocation. Exact byte limits remain provisional pending evidence.

Response framing uses the same length-prefix scheme around strict UTF-8 JSON.
Use a closed version1 envelope: either success with content_sha256 and symbols
matching the pure contract, or failure with one closed code and no message/detail
field. Reject unknown envelope fields, mixed success/error, duplicate JSON keys,
wrong scalar types, invalid digest/ranges/order and trailing frames. Bound response
bytes before JSON decoding and validate every returned range against input length.
Never consume a result if the process times out, exits unsuccessfully, or fails
cleanup even when a partial or apparently valid response arrived first.

No raw content or diagnostics on stderr; no source in arguments, environment or
temporary files. This is the selected protocol for later shaping, not implemented
serialization, a frozen numeric resource profile or an authenticity attestation.

## Qualification remains required
The AST library and runtime adapter are separate reviewable slices; do not expand
the proposed three-file library scope silently. Neither slice may claim untrusted
production admission until their composition is verified.

The adapter contract must establish:

- A fixed executable/module and closed request schema over a bounded pipe, no
  shell evaluation, source filenames, imports or supplied-code execution.
- A cleared environment with explicit OS essentials and no provider/database/
  gateway credentials. That filter is not filesystem/registry isolation; qualify
  an actual restricted execution boundary before hostile-input admission.
- Enforced wall-clock, memory, process-count, input and output ceilings with
  platform evidence. Specify and verify Windows Job Object or equivalent host
  controls and the actual Linux mechanism separately; do not pretend subprocess
  timeout alone bounds memory or child cleanup.
- Atomic content-free failures on timeout, malformed/oversized replies, process
  failure or resource exhaustion. No partial declaration result or raw traceback
  is accepted, persisted or enqueued.
- Process-tree cleanup and closed-pipe behavior on completion and cancellation;
  no surviving parser descendants. The parser library must not spawn them.
- The existing pure API's exact byte fingerprints and spans survive serialization
  unchanged. Returned text still passes P2A at the real P3 persistence boundary.

Choose numeric runtime ceilings only after small bounded baseline measurements
and independent review; the earlier256KiB/20k-token/depth64/2048-declaration values
remain provisional. Do not run allocation floods or install sandbox machinery
merely to turn these planning items green. No new dependency, package, worker,
provider call, source implementation or machine configuration change is made here.

Readiness sequence: freeze adapter fields/limits and host mechanisms, qualify
the restricted runner with fixed synthetic canaries, compare fixtures on actual
claimed Python hosts, then shape the separately scoped workorders. Existing
credential holds and independent architecture/security reviews remain binding.
