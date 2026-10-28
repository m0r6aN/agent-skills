# Parser host and recovered Cortex readiness

Independent review follow-through: the single formal harness repair is recorded
in evidence/parser-host-mechanism-repair-20261023.json. It derives the canonical
3.13.15 identity from the observed matching image, runs the timeout on that image,
asserts exact runtime versions, matches hand-derived declaration tuples, tracks
unique run-labelled container names before mutation, confirms removal within a
bounded poll, and makes failed cleanup unsuccessful. Root writes must fail EROFS
in a directory otherwise writable by the nonroot user; root/tmp mount flags are
read in-container. The memory canary is expressly RLIMIT_AS-only, not an OOM test.
Earlier results remain historical; closure reviews are separate evidence.
The selected3.13 parser uses best-effort feature_version=(3,10), not an exact
3.10 recognizer. Fixed grammar observations do not prove full language equivalence.

Status: bounded synthetic host mechanisms PASS; production adapter and independent
review pending. No source implementation, affected-route release or model call.

## Usable checkout

D:/Repos/ccm-cortex-readiness-20261023 is a fresh clean detached checkout of
Keon-Systems/keon-cortex at91c57778804a4f1097b07049176c1af533c840e2. Both actual
main workflows passed: CI39818888827 and auto-deploy39818888799. All four accepted
P2B Git-blob hashes match; all three proposed P2C paths are absent. Historical
broken worktrees were untouched. See evidence/cortex-checkout-recovery-20261023.json.
An actual complete prebuild baseline/pin set remains required before dispatch.

The missing local canonical AGENTS reference was read via authenticated GitHub
contents API: Keon-Systems/keon-systems-web/AGENTS.md, blob
1acbb5722166d8bb2850d6b2064c6d9320cf5197. General scope/origin-main rules apply;
web/page requirements do not turn this parser task into web work. Direct owner
ordinary-shell instructions override the inherited RTK preference.

## Mechanisms actually tested

Locally present pinned images ran Python3.10.22,3.12.15,3.13.15. Each named,
auto-removed container had network none, no host mounts, read-only root,
uid/gid65534, capabilities dropped, no-new-privileges,128MiB memory/no swap,
0.5CPU,16-process cgroup ceiling and1MiB noexec/nosuid temporary filesystem.
Python isolated mode set96MiB address space, process creation limit0, core dumps0
and1MiB file-size limit. No host credentials entered the containers; official
image GPG_KEY is public release-verification material, not a provider credential.

Cgroup settings were observed inside each container. Bounded canaries denied a
root write, external network connection and one child-process attempt. A2MiB
allocation under a temporarily tightened address limit raised MemoryError, after
which the96MiB limit was restored. No OOM/fork/allocation flood was used. A fixed
sleep timed out after0.5s and its owned container was killed/removed.

Eleven source fixtures plus three invalid fixtures ran per host without executing
supplied source. Declaration metadata digests matched across all three. Peak RSS
was24520/29536/28708KiB; maximum fixture time32.084/87.805/114.773ms respectively.
All final-run containers are absent. Evidence:
evidence/parser-host-mechanism-qualification-20261023.json.
These are modest-corpus and mechanism observations, not production acceptance,
an SLO, a dependency vulnerability audit or a complete adversarial proof.

## Runtime and contract corrections

The Unicode fixture yielded20 tokens on3.10 and19 on3.12/3.13, while declaration
metadata matched. Preserve the failed cross-version equality assumption in
evidence/parser-host-cross-version-token-disagreement-20261023.json. Source grammar
selection does not pin tokenizer/Unicode/runtime behavior; pin the interpreter.

Supersede the initial3.10 candidate with the already tested Python3.13.15 local
image ID sha256:b2bb53ac7b6fbe78a48c95b7c15130ea21de1674fc683fbc93158b0c23826823,
requesting3.10 source grammar. Python's official table marks3.10 end-of-life from
October1,2026;3.13 remains security-maintained: https://devguide.python.org/versions/ .
The image pin does not prove every dependency is vulnerability-free. Actual3.10
testing remains compatibility evidence, not selection as the hostile-input host.
Cross-host distribution must retain an approved immutable image identity.

The original multiline2048-declaration fixture had20482 tokens, hitting the20000
guard first. The replacement one-line2048-declaration fixture has14338 tokens,
making the declaration limit independently reachable without increasing budget.

## Selected implementation/review profile

Existing delegated design authority selects these values:

| Boundary | Value |
| --- | --- |
| Original input / JSON response payload |262144 /1048576bytes |
| Canonical-runtime tokenizer tokens |20000 |
| Bracket nesting / lexical declaration ancestors |64 /64 |
| Declarations |2048 |
| Container memory / swap / Python address space |128MiB /0 /96MiB |
| CPU / cgroup processes / Python child creation |0.5CPU /16 /0 |
| Temporary filesystem / file-size limit |1MiB /1MiB |
| Attached parser-instance deadline |5seconds |
| Overall create/start/validate/cleanup envelope |15seconds |

These are contract values supported by bounded mechanism checks and observed
footprint, not a guarantee every allowed source succeeds. Resource failures must
reject atomically without partial results or automatic limit increases/retries.
The0.5s sleep canary tests timeout/cleanup mechanics, not an implemented5s adapter.
Protocol framing, response limits and parsing-result validation still need code
and independent architecture/security review. Windows-native isolation is not
qualified; select this Linux-container boundary from the Windows workstation.

## Routing and remaining work

Use exactly opencode-go/kimi-k3.1-pro in Pi when the route and credential-isolated
worker admission clear. Its status here is owner-requested, not configured,
entitled, available or invoked. No incident-affected key may be used by implication;
no provider probe, fallback, new budget or paid dispatch occurred.

Next: review the bounded test host, establish the actual prebuild baseline and
worker clearance, then build/review the compact library. Complete the production
adapter and composition review afterward, before hostile production admission.
See p2c-noncircular-admission-sequence-20261023.md; do not require an adapter that
imports the unfinished library before allowing the library build. Preserve
existing credential holds, source/main CI and dated finite cost controls.

Preparation failures remain explicit: initial helper escape syntax failed before
container actions; image env checking falsely flagged public GPG_KEY and left an
unstarted owned container, subsequently identified and removed; misplaced -i
caused a pre-execution launch failure. Cleanup now handles both created and
running owned containers. Earlier failure records are retained. No unrelated
container, checkout or machine configuration was removed or reset.
