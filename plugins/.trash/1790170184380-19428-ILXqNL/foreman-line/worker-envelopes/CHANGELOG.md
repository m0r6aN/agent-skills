# Changelog -- @foreman-line/worker-envelopes

## v1 (initial release, 2026-09-01, WF-P2)

Initial `worker.kaseya/v1` task envelope and `worker-result.kaseya/v1` result
envelope, formalizing charter Section 7 and Section 8. Built against:

- `role-authority` (WF-P1) commit `24c4587` (this branch's rebase point) --
  `role` and `riskClass` vocabulary imported by reference. No machine-checked
  pin exists yet for this dependency version (open finding, see README.md
  "Versioning"); this line is the prose record until a repo-wide convention
  lands.
- `schema-scaffold` (SCAF-P1/SCAF-P2) -- `generate`/`serialize`/
  `registerNoDriftTests` machinery, no local copy.

No prior version exists to flag for re-check under D26.

### Namespace rename, 2026-09-03 (no version bump)

The namespace token was renamed `keon` -> `kaseya`, so the identifiers above read
`worker.kaseya/v1` and `worker-result.kaseya/v1` where the released artifacts of
2026-09-01 read `worker.keon/v1` and `worker-result.keon/v1`.

**No version bump was taken, deliberately.** The `/v1` segment denotes the envelope
*shape*, and the shape did not change -- same fields, same `required` set, same enums.
A bump to `/v2` would assert that a `worker.kaseya/v1` existed and was superseded; it
never existed, and a reader would look for it and find nothing.

The rename is recorded here rather than left silent because the edit rewrote this
entry in place, which would otherwise imply v1 was always `kaseya`. It was not. The
rename landed before the envelopes had any consumer outside this repository: no
persisted receipt embeds the envelope `apiVersion`, and every occurrence of the old
token was internal (schemas, sources, fixtures, package metadata, specs, kickstarters).

Anything outside this repository that pinned the old namespace string must be
updated to the new token. Consumers validate against these schemas by value, so
they fail closed rather than silently, which is the correct behavior.
