#!/bin/bash
# Rebuilds the leftover-worktree state of the acme-app machine backup:
# a bare origin remote, one worktree with uncommitted work, one worktree with
# an unpushed commit, and no dev branch anywhere.
set -e

cd "$(dirname "$0")"
BASE="$(git rev-parse --show-toplevel)"
SIBLING="$(dirname "$BASE")/$(basename "$BASE")-wts"
REMOTE="$(dirname "$BASE")/$(basename "$BASE")-origin.git"
DEFAULT_BRANCH="$(git symbolic-ref --short HEAD)"

git init --bare --quiet "$REMOTE"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE"
else
  git remote add origin "$REMOTE"
fi
git push --quiet -u origin "$DEFAULT_BRANCH"
git --git-dir="$REMOTE" symbolic-ref HEAD "refs/heads/$DEFAULT_BRANCH"
# Branch-only work already pushed to origin, but not yet handed off for review.
PUSHED_BRANCH="feat/already-pushed"
git switch --quiet -c "$PUSHED_BRANCH" "$DEFAULT_BRANCH"
printf '\n// Branch-only fixture change awaiting its PR handoff.\n' >> "$BASE/lumber-jack/src/export.js"
git add -A
git commit --quiet -m "docs: add a pushed but unreviewed fixture change"
if [ "${1:-}" = stale-pr ]; then
  git tag fixture-merged-pr-head
  git push --quiet origin HEAD:refs/heads/dev
  printf '\n// Follow-up after the first PR merged.\n' >> "$BASE/lumber-jack/src/export.js"
  git commit --quiet -am "fix: follow up after merge"
fi
git push --quiet -u origin "$PUSHED_BRANCH"
git switch --quiet "$DEFAULT_BRANCH"

# Worktree 1: uncommitted work — a tracked edit plus an untracked file.
git worktree add --quiet "$SIBLING/reporting" -b feat/reporting "$DEFAULT_BRANCH"
printf '\n// TODO(tweak): reporting filters were mid-edit when the machine died\n' >> "$SIBLING/reporting/lumber-jack/src/app.js"
printf 'export column order: id, name, amount\n' > "$SIBLING/reporting/lumber-jack/EXPORT-NOTES.md"

# Worktree 2: one unpushed commit, otherwise clean.
git worktree add --quiet "$SIBLING/exporter" -b fix/exporter "$DEFAULT_BRANCH"
printf '\nfunction strip(s) {\n  return s.trim();\n}\n' >> "$SIBLING/exporter/lumber-jack/src/export.js"
git -C "$SIBLING/exporter" add -A
git -C "$SIBLING/exporter" commit --quiet -m "fix: strip whitespace from export fields"
# intentionally not pushed

if [ "${1:-}" = stale-pr ]; then
  git worktree lock --reason 'active reporting session' "$SIBLING/reporting"
  printf '/private.env\n' >> "$(git rev-parse --git-path info/exclude)"
  printf 'fixture placeholder\n' > "$SIBLING/exporter/private.env"
fi
# A local default tip is not a safe source for creating remote dev.
git commit --quiet --allow-empty -m "local-only: unpublished default branch work"
