# Amendment W0-P01-A2: PowerShell-Compatible Retry

Status: ratified 2026-08-17 by Clinton Morgan.

W0-P01 may use the newly named, initially absent output root `D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260817-w0-p01-custody-snapshot-retry-01/` and a Windows PowerShell-compatible relative-path implementation. Every W0-P01-A1 constraint remains unchanged.

The prior partial roots remain preserved and must not be reused, changed, or cleaned:

- `D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260813-w0-p01-custody-snapshot/`
- `D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260813-w0-p01-custody-snapshot-retry-20260813-01/`

The replacement implementation must derive relative paths without `[IO.Path]::GetRelativePath`, must reject paths outside each exact source root, and must retain all copy-only, exclusion, opaque-link, internal-link-stop, manifest, no-remote, and no-source/Git-mutation requirements.
