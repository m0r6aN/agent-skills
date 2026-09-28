# W0-P01R Design Revision Receipt

Status: local design-only receipt; no fixture or protected-source execution occurred.

## Inputs reconciled

- W0-P01 tripwire stop in `loop-directive.md` and `handoffs/W0-P01-A3-tripwire-stop-2026-08-17.md`.
- Ratified A1/A2/A3 custody constraints.
- Coordinator instruction received 2026-09-13: complete reviewability before an owner request; require two independent architecture/risk reviews; preserve human ratification and no protected-source reads.

## Revision result

- Design path: `parcels/W0-P01R-custody-tool-design.md`.
- The design now separates successful fixture captures from expected internal-link and path-escape stops, names exact setup/builder/reviewer write scopes, gives four exact fixture invocations and one exact conditional source-capture invocation, defines the required manifest schema, and requires two independent read-only reviews for each F/S phase.
- Setup sequencing is explicit: coordinator pre-setup records absence before worktree creation; builder F Step 0 verifies the created base/branch and untouched output roots without source enumeration; S Step 0 rechecks only output absence, digest, reviews, arguments, and prior-root preservation before coordinator ACK.
- No separate patent-custody owner was identifiable from metadata-only inspection. This does not establish that no legal, filing, or document custodian exists.

## Required owner text: F-only option

> Ratify W0-P01R-F only: create and execute the source-free synthetic fixture proof exactly as specified in `W0-P01R-custody-tool-design.md`, including two independent read-only reviews. This authorizes no protected-source read, source capture, filing-package drafting, counsel transmission, disclosure, remote action, filing, payment, or alteration of any prior partial custody root. It does not alter the existing later gate structure.

## Required owner text: combined conditional F/S option

> Ratify W0-P01R-F/S exactly as specified in `W0-P01R-custody-tool-design.md`. This permits only coordinator setup administration for the named fixture worktree, then the source-free synthetic fixture proof. No protected-source read may occur unless two independent fresh read-only reviews each accept F and freeze the complete script SHA-256. Then, and only then, execute the unchanged digest-bound source-capture mode against exactly `D:/Repos/keon-omega/keon-docs-internal/patents/` and `D:/Repos/keon-omega/keon-doctrine/`, writing only to the initially absent source-output root named in the design. Two independent fresh read-only reviews must accept S before W0 downstream work proceeds. This authorizes no source mutation, source-Git mutation, staging, commit, merge, push, fetch, pull, remote operation, package drafting, counsel transmission, disclosure, filing, payment, or alteration of any prior partial custody root. Once S accepts, existing W0–W4 standing preparation authority resumes only within its already-ratified scope.

No ratified clause located in the W0-P01 tripwire record mandates a second human approval between accepted F and S; the former separate-owner-decision wording was a design interpretation and is superseded by this proposed conditional option.
