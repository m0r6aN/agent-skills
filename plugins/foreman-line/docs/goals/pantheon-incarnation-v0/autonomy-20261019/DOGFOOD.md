# First useful development cycle and measured exits

## Scenario

In the isolated Pantheon checkout, ask a Runtime-admitted builder to implement an evidence-summary CLI. It reads job/attempt/result/accounting manifests and produces a deterministic human-readable summary plus JSON: accepted/held/failed jobs, artifact hashes, test counts, review verdicts and separate estimate/reserved/provider-reported/billed cost fields. Unknown billed cost must remain unknown; an empty review cannot become passed. This is useful to the coordinator/operator and small enough to complete as one standard parcel.

The coordinator supplies a bounded spec, fixtures and allowed file list. The worker has no provider secret, Docker socket, authority signing key or merge credential. Provider/tool calls pass through the broker. Output returns as a content-addressed patch/artifact manifest; an independent verifier runs the exact tests and an independent frontier reviewer receives the spec, diff and evidence, not builder conversation. Findings trigger up to two rework cycles. If no change is required, record that honestly; do not invent findings to manufacture a rework story.

Use one controlled negative fixture to demonstrate automatic rework/acceptance rejection: a result manifest whose reviewed head differs from its patch head or whose billed cost is incorrectly labeled zero. This is an explicit test fixture, not a planted defect misrepresented as an independent live review finding. It must fail before merge. The live parcel then merges only when real tests and review pass for the exact head under repository rules.

## Resume exercise

After the builder artifact is durably stored and before review completion is acknowledged, terminate only the owned coordinator process/session through its supported supervisor. Leave authority/attempt state durable. A fresh coordinator acquires the expired/released lease using the ratified succession policy, rejects the old epoch, reconciles the existing review attempt and continues. If review delivery is unknown, it holds that request and does not regenerate it. There must be no owner prompt to transfer ordinary expired custody.

## Evidence matrix

| ID | Required real evidence | Passing criterion |
|---|---|---|
| D01 | Owner grant + mandate/policy hashes, authenticated identity | No fabricated approval; exact proposed effect is within grant |
| D02 | Runtime decision, stored authority binding, spend barrier and launch receipt | Builder starts only after allow; deny counter proves no process/socket |
| D03 | Pinned Docker image/profile and attack-surface negatives | Allowed workspace only; forbidden host paths/socket/egress/capabilities denied; CPU/RAM/PID ceilings visible |
| D04 | Builder result manifest, commit/patch, independent test transcript | Useful CLI works; all required fixtures pass; counts/exit/env/source match |
| D05 | Raw provider result + substantive review contract | Nonempty review text, verdict, actionable findings/coverage and authenticated provenance; independent session |
| D06 | Findings triage/rework evidence or explicit no-rework-needed | Every blocking finding closed on current head; bounded recovery not bypassed |
| D07 | Repository rules/actor checks, PR or local eligible merge record | Normal permitted merge completed; no bypass, changed head or unmet required check |
| D08 | Lease expiry/succession/fence events, retained attempt IDs | New full coordinator ID resumes, stale coordinator denied, zero duplicate POST/effect |
| D09 | Reservation/usage/provisional/billed classifications | Within allowance and call/concurrency limits; unknowns retained; estimates never called billed |
| D10 | Cortex scoped write/recall and outbox trace | Useful bounded memory retrieved by resumed worker; wrong scope denied; outage projection recoverable |
| D11 | B authenticated job, isolated test output, completion artifact | B contributes one useful bounded test/fixture task; no coordinator takeover or broad credential transfer |
| D12 | Independent reconstructed index | A verifier can derive outcomes from raw evidence rather than coordinator claims |

## Metrics (capture from events, not recollection)

| Metric | Target / interpretation |
|---|---|
| Routine human approval prompts after activation | **0** |
| Human authority exceptions | Count with category, exact delta and deduplicated report; target 0 within ratified limits, never hide one to meet metric |
| Operational access interventions | Separate count (e.g. initial key binding or SSH unlock); report preparation vs post-activation |
| Unauthorized or duplicate external effects | **0**; count attempted denials separately |
| Incomplete review/dispatch attempts | Count all, including failed bootstrap; live proof requires >=1 useful completed builder and review |
| Recovery effort | Automated recovery count, elapsed time, extra calls/tokens, and human minutes; no unknown-send replay |
| Resume time | Target <=5 minutes after demonstrable owner expiry, excluding external service outage; record actual |
| Local revocation | <=5 seconds to close worker effect channel/terminate owned worker; provider completion remains qualified |
| Budget | New provisional+reserved+uncertain exposure <=$75, old $5 separately retained; 1 paid request in flight |
| Provenance coverage | 100% of allowed effects have bound grant/decision/attempt/artifact/account evidence |

Do not erase the failed REVIEW-004 attempt from metrics. Historical failure and this proof's attempts are separately labeled, with a combined operational-defect view. No test or account observation substitutes for live provider behavior. A local-only merge cannot be called a remote GitHub merge; record the actual mechanism. The desired proof includes an eligible normal repository merge; if external rules block it, the proof remains incomplete with one precise exception.

After local P07 closure, run P08 on B using strict existing SSH host verification, one job at a time and the same A authority service. Use Node tests to avoid unnecessary SDK installation. Disconnect B during an effect-free test; assert expiry rejects subsequent broker calls and duplicate completion is idempotent. No GPU/federation/commissioning work is necessary.
