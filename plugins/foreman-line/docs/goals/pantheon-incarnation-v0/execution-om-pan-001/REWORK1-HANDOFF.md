# P00 sender rework cycle 1

Status: **implementation and deterministic checks complete; independent recheck required before live use**. This is the same native builder session 1/8. No new session allowance, provider call, paid review, consumed packet replay, credential lookup, DPAPI operation, live wrapper import/execution, commit or push occurred.

Workspace: `D:/Repos/Pantheon/work/foreman-om-pan-001-p00`, branch `codex/om-pan-001-p00`, unchanged HEAD `64fb8949bf5134f96fda02df0d4f52ac291a6138`. The coordinator authorized the rework scope and later authorized the two R2 requests, explicit standard/global rates, the copied rate evidence, refreshed metadata seam, and fixed-path ciphertext comparison in the key bridge. The parent’s workflow amendments elsewhere in this worktree were preserved.

## Repairs and evidence

| Finding | Bounded repair | Regression evidence |
|---|---|---|
| NP-01 | New R2 plan packet preserves every original source section and adds all 14 exact coverage labels, splitting missing dependencies from unnecessary complexity. Parser expectations and exact request bindings validate before claim/credential/send. Original packets remain unchanged. | Actual R2 packet/source equivalence; exact coverage; empty-coverage and arbitrary config rejection. |
| NP-02 | Native completion, strict stream validity, trustworthy final usage, and usable review are separate. Trailing/malformed/order-invalid streams and missing terminal counters retain full reservation. Valid stream plus invalid review remains failed review even when final counters are usable. | Trailing malformed/truncated/order-invalid frames; missing and contradictory usage; max-token exhaustion; malformed/empty/short review; native failure and cancellation. |
| NP-03 | Only qualification-r2 and plan-review-r2 exact config/request bytes are eligible. Preflight must bind changed code plus every required data pin; all 33 sealed members, current packet source bytes, source sections, rates and original ratification binding validate before send. No P01-P05 route. Metadata must retain exact identity and successful GET provenance; its ciphertext digest must match the bytes the fixed-path bridge decrypts. | Mutation of every required pin, package/source members, arbitrary self-hashed request, missing/duplicate preflight pins, fabricated receipt/record, identity/provenance/digest mismatch. |
| NP-04 | Read-only lock probe requires existing file, exact live PID/start identity, and Win32 sharing/lock violation 32 or 33. Missing, unheld, stale and other failures refuse authority. | Actual fake-owner PowerShell exclusive FileStream accepted; present-unheld exit 13, missing exit 10, stale start exit 12. No real coordinator lock was probed. |
| NP-05 | Finite nonfuture timestamps, 14-day activation ceiling, one-hour metadata age, active owner/scope and fresh successful GET evidence are mandatory. Valid seven-digit UTC fractions with Z or +00:00 are accepted. | Separate missing/malformed field tests, impossible/future/expired dates, excessive duration, nonfinite clock, metadata stale/future and provenance timestamp failures. |
| NP-06 | Full-context input reservation 1,048,576 tokens, exact requested output, standard_only/global/no cache/no speed, pinned 4/20 USD per million and a 10% uncertainty buffer. Per call <=6 USD, artifact <=2 attempts, parcel <=15 USD, bootstrap <=25 USD and <=16 calls. Integer micro-USD accumulation; unknown sends block recovery automatically. | Qualification reserve 4.71 USD; plan reserve 5.34 USD; artifact/call/parcel/aggregate caps, exact cap and +1 micro-USD, malformed liabilities, unknown sends, tier/geo/cache/extra usage fields. |
| NP-07 | Fresh authority after credential resolution and immediately before spawn. Watcher checks at <=500 ms intervals with <=1 s check timeout, cancels the owned worker on lost/revoked/expired authority, Runtime readiness, closure, or changed qualified credential. | Fake owned subprocess cancellation under five seconds; bounded check-timeout cancellation; release/revocation/expiry/Runtime/closure guard checks; stopped watcher behavior. |

## Final validation

Run from the worktree:

```powershell
node --test plugins/foreman-line/docs/goals/pantheon-incarnation-v0/execution-om-pan-001/native-sender/native-sender.test.mjs plugins/foreman-line/docs/goals/pantheon-incarnation-v0/execution-om-pan-001/bootstrap-guards.test.mjs
```

Final result: **77 tests passed, zero failed, cancelled, skipped or todo**, duration **9849.1182 ms**: all 41 original native tests plus 36 new guard tests. Node v24.7.0 and the pinned Windows curl 8.21.0 were used. The executable hash remains `73d24149ff289afc49ec41f08918ef9faa727d39ad993e929757dc2ddafab805`. Native calls were exclusively numeric loopback with the fixed fake marker. Fake PowerShell/Node children were owned, bounded and cleaned up. No test imports the live CLI or executes the key bridge.

`node --check` passed for the final wrapper and guards. PowerShell AST parsing passed for the lock checker and revised key bridge, without invoking either bridge or DPAPI. Red checks reproduced the missing metadata scope selector, initial-counter-as-final bug, nonfinite rate clock and missing credential-continuity check before their fixes. Integer arithmetic eliminated floating-point rounding drift without relaxing expected costs.

Tests use a fixed clock with saved nonsecret `account-metadata-3` GET artifacts. They prove validation behavior, not current live account freshness or inference success. They also verify the exact existing sealed proposal and current source artifacts read-only. The 33 sealed member files stay byte-exact; their historical external source manifest is preserved and is not relabeled as current source state.

## Promotion boundary and remaining limits

The independent checker must recheck this directory and bind every `CHECKED_CODE` and `PINS` member in a fresh PASS preflight/report before the coordinator can invoke either exact R2 attempt. The old preflight cannot authorize changed source. No authority record or PASS receipt was created by this builder.

The key bridge change is limited to one required lowercase 64-hex digest, comparing exact fixed-path ciphertext bytes before decrypting the same buffer. Its source was syntax checked; actual DPAPI/key handling remains unexecuted by this builder. Synthetic tests cover missing/malformed/different digest and post-resolution continuity. The coordinator refreshed same-account metadata separately; this handoff neither qualifies credentials nor attests to provider execution.

The wrapper reads the activation-selected `account-metadata-N/qualification.json` (N >=2) and the three sibling GET evidence files, preserving exact organization, workspace, binding and approved models. A fresh same-account record is allowed; another identity, missing ciphertext digest, changed digest, stale or unsuccessful GET is held. Claims/send intents bind the selected metadata reference, qualification hash and ciphertext digest without exposing key values.

The wrapper remains finite P00 bootstrap code, not a Runtime adapter. Its local held lock and exclusive attempt claim are not cross-machine fencing or transactional accounting. It provides no automatic retry or continuation; another request/config requires independently reviewed pins within existing authority. Any unknown delivery retains the full reserve and requires reconciliation. Process termination cannot confirm remote provider cancellation. OS-wide stalls, malicious local administrators, filesystem rollback and cryptographic authentication of local evidence remain outside this bootstrap boundary.

Provider usage, locally estimated usage, provisional exposure and billed cost remain separate. `billedCost` is null. Absent response tier is never presented as measured pricing. Unknown usage semantics or unexpected tier/geo/cache fields hold the full reserve conservatively. Structurally usable reviews remain held for independent substantive/source/identity triage and cannot approve themselves.

Only the allowed execution-package files were changed. Original qualification and plan packets/configs were preserved; the new R2 files have distinct paths. The exact changed and preserved file hashes, source report references and test commands are recorded in `rework1-verification.json`. No canonical execution file or frozen proposal member was written.
