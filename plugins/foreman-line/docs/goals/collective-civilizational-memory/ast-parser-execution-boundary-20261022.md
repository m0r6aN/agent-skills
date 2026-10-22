# AST execution-boundary planning decision

Coordinator decision under existing owner authority: do not admit hostile source
to an in-process parser on byte/token guards alone. Select a separately qualified
bounded parser subprocess as the target production boundary. This is a design
decision, not an implemented adapter, approved runtime or resource-safety proof.

Keep the pure declaration contract in ast-source-contract-plan-20261022.md.
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
