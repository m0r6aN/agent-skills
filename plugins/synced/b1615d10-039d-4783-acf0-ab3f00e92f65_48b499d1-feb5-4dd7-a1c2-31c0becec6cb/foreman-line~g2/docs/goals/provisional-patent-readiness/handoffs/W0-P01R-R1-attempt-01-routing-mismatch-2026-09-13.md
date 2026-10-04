# W0-P01R-R1 Attempt-01 Routing Mismatch

Status: **control-lane observation; attempt-01 remains stopped and preserved.** This record does not alter the attempt, ratified R1 bytes, or routing policy.

The company coordinator inspected actual turn metadata for the builder dispatch at `2026-09-13T13:41:19.864Z`: the parent task ran `gpt-5.6-terra` at `high` effort, and the `r1_attempt01_builder` spawn used `model=null` with `fork_turns=all`. The child therefore inherited that standard-tier model. A read of `D:/Repos/agent-skills` main routing policy, blob `83370d6142ae381fa068469f01e3ddc86edd031a`, did not prove an actual frontier dispatch. The root independently revalidated that policy blob unchanged.

The prior builder's Step 0 and synthetic attempt are preserved as observed evidence, but they must not be represented as satisfying the controlling frontier routing requirement. This defect is separate from the missing outcome receipt, volume-root path cycle, and inherited-contract omissions. It does not supply an F `ACCEPT` or S authority.

Any later architecture/risk builder and each independent reviewer must have actual eligible native frontier dispatch metadata, including model and reasoning effort, recorded before work is counted. A fresh bounded context with explicit frontier model selection avoids the previous full-history model inheritance. Reading the policy is still required, but it does not substitute for dispatch metadata. No Cerebras, external CLI/provider, sensitive-data, tool, or effect authority follows from this record.
