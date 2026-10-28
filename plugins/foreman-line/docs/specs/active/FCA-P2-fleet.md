---
ticket: FCA-P2
title: Fleet registry and filesystem browse (multi-repo control scope)
status: active
owner: clinton.morgan
created: 2026-10-11
updated: 2026-10-11
supersedes: null
superseded_by: null
risk: standard
surfaces:
  - plugins/foreman-line/ops-console/src/project.ts
  - plugins/foreman-line/ops-console/src/config.ts
  - plugins/foreman-line/ops-console/src/api.ts
  - plugins/foreman-line/ops-console/src/server.ts
routing_class: standard-feature
verification_class: equivalence-provable
permission_profile: builder-standard
data_classification: internal
---

# FCA-P2 — Fleet registry and filesystem browse

## 1. Purpose

The console serves one repo root (`FOC_REPO_ROOT`, plus FCA-1
`FOC_EXTRA_ROOTS` for goal-tree projection). The owner mandate is a master
control center "for all foreman line processes, running across all local
repos". This spec turns root handling into a **fleet**: a declared, editable
set of repositories, each with identity and liveness, editable in the console
via filesystem browse + folder selection.

## 2. Owner directive (2026-10-11)

Fleet membership is "editable in the console via filesystem browse + folder
selection"; ratifies fleet-wide control-center scope (charter amendment
`AMENDMENT-2026-10-11-control-center.md`).

## 3. Additive surface (the ONLY changes)

- `fleet.ts` (new): fleet registry model — persisted, ordered, deduplicated
  absolute roots; per-root identity (remote URL, default branch, HEAD) and
  liveness (reachable/absent/invalid, typed refusals preserved).
- `project.ts` / `config.ts`: `FOC_FLEET` (declared list) generalizes
  `FOC_EXTRA_ROOTS`; legacy env keeps working. D1-style assertions unchanged:
  relative or absent roots are refused typed (`root-not-absolute`,
  `root-absent`), never coerced.
- `api.ts`: `GET /api/fleet` (registry + identity + liveness),
  `POST /api/fleet/add|remove` (absolute path only; validation before write),
  `GET /api/fs/browse?path=` (read-only directory listing: name, type, has
  manifest; sandboxed — listing is refused outside absolute paths and never
  follows symlinks out of the browsed root).

## 4. Contracts

- **Registry is the single source of fleet truth.** `FOC_REPO_ROOT` remains the
  primary root (first entry). FCA-1 tree projection keys extend per fleet root.
- **Browse is read-only and shallow.** One directory level per call; no file
  contents; no writes. A folder qualifies for the fleet when it is absolute,
  exists, and is a git work tree (`.git` present) — qualification is advisory
  in browse output, enforced at `add`.
- **Persistence** follows existing state-file conventions (typed loads,
  corrupt-state refusal), no new storage dependencies.

## 5. Acceptance criteria

1. `GET /api/fleet` lists every registered root with identity + liveness.
2. Adding a root via the API requires an absolute path + git work tree; all
   refusals are typed and leave the registry unchanged.
3. `GET /api/fs/browse` lists one level, marks git work trees, and refuses
   relative/symlink-escaping paths.
4. Removing the primary root is refused (`root-primary-immutable`).
5. `FOC_EXTRA_ROOTS` behavior (FCA-1) is preserved for non-fleet callers.

## 6. Verification

Deterministic tests in `ops-console/tests/`: registry add/remove/refusal
matrices, browse sandboxing (including symlink escape), env-compat for
`FOC_EXTRA_ROOTS`, persistence round-trip. Full package sweep green
(`npm test`, `npm run typecheck`, `npm run lint`).
