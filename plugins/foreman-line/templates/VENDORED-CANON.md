# Vendored Canon Manifest

> This file tracks every artifact in this repo that was **vendored** — copied
> in from the Foreman Line plugin (or another external source) at a specific
> point in time, rather than resolved live from the installed plugin at
> run time. It ships empty at scaffold time; entries are added only when this
> repo actually vendors something.

## Never-edit-locally rule

**A vendored file listed below must never be hand-edited in this repo.** If it
needs to change, the change is made upstream (in the source this manifest
names), re-vendored, and this manifest's entry is updated to match — see
"Re-vendor procedure" below. A hand-edit to a vendored file is exactly the
drift this manifest exists to catch; the drift check below detects it, but
does not prevent it, so the rule is stated here as the actual control.

## Manifest fields

Each vendored artifact gets one entry with these fields:

- **`path`** — the artifact's path in this repo.
- **`source`** — its upstream source path (a path within the plugin, or an
  external source it was vendored from).
- **`vendored_at_commit`** — the commit hash of the source, at the point of
  vendoring.
- **`content_hash`** — **SHA-256, hex-encoded**, computed over the vendored
  body with its provenance/header block stripped first (see the precise strip
  rule below). This is the drift check's entire mechanism (see below).
- **`never_edit_locally`** — always `true` for an entry in this manifest.

### Worked example entry (placeholder values — for illustration only; add real entries under "Entries" below)

```yaml
- path: docs/kickstarters/STANDING-CONSTRAINTS.md
  source: <PLUGIN-ROOT>/templates/STANDING-CONSTRAINTS.md
  vendored_at_commit: <PLACEHOLDER-COMMIT-SHA>
  content_hash: <PLACEHOLDER-CONTENT-HASH>
  never_edit_locally: true
```

`source` names where the plugin's own copy lives, not a path in this repo —
write it rooted at `<PLUGIN-ROOT>` (the installed Foreman Line plugin's own
root) explicitly, never as a bare relative path, which would read as local to
this repo instead.

## Entries

`<THIS REPO'S ACTUAL VENDORED ARTIFACTS GO HERE, ONE MANIFEST ENTRY EACH, IN
THE SHAPE SHOWN ABOVE. EMPTY AT SCAFFOLD TIME — THE DRIFT CHECK REPORTS
`NOT-EVALUATED` UNTIL AT LEAST ONE ENTRY EXISTS.>`

## Not-vendored list

`<ENUMERATE, WITH A ONE-LINE REASON EACH, EVERY ARTIFACT THIS REPO DELIBERATELY
DOES NOT VENDOR — e.g. a capability resolved live from the installed plugin at
run time instead of copied in. Placeholder example:>`

- `<CAPABILITY-OR-CHECK-NAME>` — resolved live from the installed plugin at
  run time; not copied into this repo, so it is not tracked here.

## The strip rule (precise, reproducible)

Some vendored files carry a provenance/header block that is expected to
change on every re-vendor (e.g. a comment naming the commit it was copied
from) and must not itself count as drift. The rule for what gets stripped
before hashing:

- **A provenance/header block is a contiguous run of lines at the very start
  of the file, each beginning with the file's comment-leader for its type**
  (e.g. `#` for YAML/Markdown-with-frontmatter-comments, `//` for TS/JS),
  **ending at the first line that is not such a comment** (including the
  first blank line).
- **If no such run exists at the start of the file, nothing is stripped** —
  the hash is computed over the entire file body as-is. A file with no
  provenance block is not an error; it simply has nothing to strip.
- The hash is computed over the **remaining bytes exactly as they stand**
  (no re-encoding, no whitespace normalization) after that leading run is
  removed.

## Re-vendor procedure

1. Confirm the change upstream is intentional and complete.
2. Copy the updated body into this repo at the `path` recorded below.
3. Recompute `content_hash` (SHA-256, hex-encoded) over the body with its
   provenance/header block stripped per the rule above, and update
   `vendored_at_commit` to the upstream commit just copied.
4. Commit the updated file and its manifest entry together — a manifest entry
   updated without its file, or a file updated without its manifest entry, is
   itself a drift the check below will catch on the next run.

## Drift check — executable behavior

- **The check folds into `.github/workflows/spec-lint.yml`** — the workflow
  this repo receives as part of its Foreman Line scaffold — rather than a
  separate workflow file.
- **The check compares a content hash recorded at vendor time.** It never
  performs a live fetch of upstream at check time.
- **The check's stated limit, shipped as literal text with the check's own
  output, not only in a document that explains it elsewhere:** this check
  detects a **local edit** to a vendored body — a mismatch between the
  recorded `content_hash` and the file's current content. **It does not
  detect that upstream has moved on.** A vendored copy can be byte-identical
  to what was vendored and be a year stale, and this check reports `pass`.
  This is not a defect of the hash choice — comparing against
  upstream-at-the-recorded-commit has the identical blind spot, since neither
  approach re-evaluates against upstream's current state. The check is
  tamper-evident, not tamper-proof.
- **An empty or absent manifest reports `not-evaluated`, never `pass`.** A
  check that ran over zero entries has not verified anything, and reporting
  `pass` on zero matches would be indistinguishable from a real, clean sweep.
