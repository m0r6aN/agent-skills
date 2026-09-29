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

echo "seeded: $SIBLING/reporting (uncommitted), $SIBLING/exporter (unpushed commit), origin at $REMOTE, no dev branch" >&2
