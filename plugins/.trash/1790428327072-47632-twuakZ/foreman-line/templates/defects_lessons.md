# Lesson Learned

> **Disposition convention.** No agent reads this ledger as operating instructions — it is provenance, demo material, and coordinator memory. Each lesson carries a disposition line routing its distilled rule into the narrowest artifact already in the reading path of the agent the rule governs. States: **operationalized** — rule installed, artifact named; **open** — rule not yet installed, candidate artifact named; **narrative** — story/rationale only, no rule to install. Appending a lesson at parcel closure (the pipeline stage where a finished unit of work is reconciled and recorded before merge) includes writing its disposition (wherever this repo's own coordinator procedure records it); an *open* disposition is a standing debt the coordinator routes the next time the candidate artifact is touched. The litmus test for a disposition: *which agent, at which moment, would have avoided the defect?* — put one sentence there.

## Lesson entry format

Each lesson appended below this line follows this minimal skeleton:

```
### #<N> — <one-line name for the defect>

**What happened:** <one or two sentences, the concrete failure — not the abstract rule.>
**Disposition:** <operationalized | open | narrative> — <artifact the rule was installed into, or the candidate artifact, or "narrative" with no artifact.>
```

Lessons are appended in ascending `#N` order and are never edited in place
once appended — a correction is a new lesson referencing the one it corrects,
matching this ledger's own append-only convention.
