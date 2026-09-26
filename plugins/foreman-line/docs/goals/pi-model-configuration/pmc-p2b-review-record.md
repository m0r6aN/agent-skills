# PMC-P2B independent acceptance record

Coordinator record, 2026-09-26. Frozen implementation:
835a6dd82ee4e50652362e7201a79b7451bbd221, including exact-money slice
115d2a4925c9afa4d2c6cc01bbc91e1de8ea1d0e. Base:
13449def0c8e321c102ff9b1f679d3e56ac28300. Frozen spec Git blob:
b8b6061f86239196f208467e849c845754d0d2a6. Exactly five implementation files
changed; no public barrel, dependency, resolver, transport or host changes.

Independent reviewer A approved without blocking findings after reading the
complete spec, governing P2A value contract, implementation and permanent tests.
It verified exact arithmetic/domain correspondence, the three-table schema,
existing-file opens, transactional state transitions, proof replay, conservative
uncertainty, atomic over-bound freeze and connection cleanup.

Observed checks: dispatch182 and routing505 passed; typecheck/lint exit0.
Additional temporary independent probes passed: 1,000 rational-cost vectors,
4,096-unit escaped proof reference, current/prior cross-request proof reuse
refusal, and over-bound freeze with continued reconciliation. Final source head,
spec blob and clean checkout matched the review pins; reviewer made no changes.

Second independent review, predecessor reconciliation and full remote CI remain
pending. Windows-local process-crash tests do not prove hardware power-loss
durability. P2C authenticates composition and episode custody; this module does
not grant a permit, prove live availability, initialize production funds or
authorize activation. Full HRO exit remains open.
