# RCM-P1 review triage

## First review: `cf20fd8` (2026-09-22)

**Reviewer:** one fresh frontier session, zero builder context, read-only, in a
detached worktree. The parcel is standard risk, so one review is required.

**Verdict:** REQUEST CHANGES.

**Coordinator closure check before review:** the builder's diff matched the
Allowed Files. The tests, typecheck, lint, whitespace check, and both scope
searches passed in PowerShell on Node v24.7.0. Test count was 228 of 228: 69
existing and 159 new.

**Coordinator reproduction:** a separate coordinator probe confirmed F1, F3, and
F5. A snapshot mutated after reading produced facts with `contextWindow: -1` and
an input rate of `NaN`, and the snapshot was not frozen. A `__proto__`
thinking-map key projected as `{status:'declared', levels:[]}`. Null bytes, a
null snapshot, and a throwing identity getter all threw. F2 was confirmed by
reading the code: identity fields are read more than once.

| Finding | Severity | Summary | Disposition |
|---|---|---|---|
| F1 | P1 | A forged or post-read-mutated snapshot yields facts carrying the original digest | Fix. Amendment A2 adds `SNAPSHOT_UNVERIFIED_REFUSED`, a frozen snapshot, and a membership check |
| F2 | P2 | Identity fields are read several times, so a getter can split `requested` from the facts and defeat the duplicate check | Fix under A2: read each field once |
| F3 | P2 | A `__proto__` thinking-map key is dropped | Fix under A2: keep it verbatim |
| F4 | P2 | The purity scan misses 14 of 17 bypasses, and the runtime stubs miss `new Date()` and `performance.now` | Fix under A2: positive controls and wider stubs |
| F5 | P2 | Hostile inputs throw instead of refusing | Fix under A2: a never-throw rule with a code mapping |
| F6 | P3 | An empty query, fragment, or userinfo in a `baseUrl` is accepted | Fix under A2 |
| F7 | P3 | Closed-shape checks use `in`, so an inherited `endpoints` is accepted | Fix under A2: own-property checks |
| F8 | P3 | Test gaps in AC3, AC7, AC8, AC10, and AC15 | Fix: add every listed test |
| F9 | P3 | The `isValidBaseUrl` export is extra | Accept as documented. It is an internal helper shared by the two sibling modules and adds no capability |

The reviewer confirmed that endpoint equality is exact, the freshness boundaries
are correct, the canonical-bytes check is sound, refusals do not echo catalog
strings, and the fixture derives from P0.

Amendment A2 was committed alone as `b01b6c7`, before any rework code. The
rework was dispatched to the builder with a Step-0 gate, a test-count tripwire
of at least 228 with no deletions, and an instruction to sweep every instance of
each defect class.
