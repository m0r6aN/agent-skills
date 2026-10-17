---
name: synced
description: Inspect and maintain the synced skill snapshot under skills/synced - the versioned bucket the skill-sync tooling writes when it mirrors installed skills into this repository. Use when reconciling or reviewing that mirror, comparing a captured copy against its source skill, or investigating snapshot or manifest churn.
---

# Synced

Use this skill to treat `skills/synced/` as what it is: generated sync state
that mirrors installed skills, not a place where skills are authored.

## Overview

`skills/synced/` is the skill-sync snapshot. Its parts:

- `.bucket-<bucket>_<version>` — the bucket marker identifying the sync
  generation that owns the snapshot.
- `<bucket>_<version>/` — one versioned directory containing mirrored copies of
  the skills the sync run captured (each with its own `SKILL.md`, `references/`,
  `scripts/`, and so on).
- `<bucket>_<version>/manifest.json` — the capture manifest: each mirrored
  skill's `skillId`, `name`, and `description`, plus the run's `lastUpdated`.

The snapshot is tracked in this repository so the mirror can be reviewed
alongside authored skills. Authored skills live in `skills/<name>/` and the
plugin skill directories; the mirror only reflects them.

## When to Use

Use when reconciling or reviewing the synced mirror: checking which skills the
last sync captured, verifying a mirrored copy against its source skill,
explaining why a sync run created, changed, or removed snapshot files, or
diagnosing CI validation results that involve the snapshot. Use after a sync
run to confirm the manifest and directory set agree.

Do not use it to author or edit skills — authoring belongs at the source skill,
then a sync run refreshes the mirror.

## Common Rationalizations

- **"Fix the content directly in the mirrored copy."** The mirror is generated
  state; the next sync overwrites hand edits. Fix the source skill.
- **"The manifest is the canonical skill list."** It records what one sync run
  captured at `lastUpdated`; the repository's authored skills are canonical.
- **"Fold snapshot churn into a feature commit."** Snapshot updates belong in
  their own commits so reviewers can separate generated state from authored
  changes.
- **"Delete a stale-looking snapshot directory to tidy up."** Directory set and
  bucket marker are owned by the sync tooling; reconcile through a sync run, not
  manual deletion.

## Red Flags

- Hand edits inside the snapshot directory that no sync run produced.
- A `manifest.json` entry whose `name` has no matching subdirectory, or a
  subdirectory absent from the manifest.
- Mirrored content that diverges from its source skill without a later source
  edit to explain it.
- The bucket marker missing or renamed while the sync tooling still expects it.
- Snapshot files being staged by a broad `git add` in an unrelated commit.

## Verification

- Every `manifest.json` `name` resolves to a subdirectory of the snapshot, and
  every subdirectory is listed in the manifest.
- Each mirrored `SKILL.md` matches its source skill's bytes, or the difference
  is explained by a source edit newer than `lastUpdated`.
- `node scripts/validate-skills.js` passes with this `SKILL.md` in place.
- Snapshot changes land in a dedicated commit whose message names the sync run
  or reconciliation that produced them.
