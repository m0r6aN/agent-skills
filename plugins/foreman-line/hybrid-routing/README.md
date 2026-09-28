# HRO mapping proposal validator

This package validates an HRO-local mapping proposal against separately
injected, pinned static evidence. It returns an owned, frozen proposal marked
`evidenceOnly: true`; it never authorizes, selects, executes, or discovers a
route. It does not read host files, call providers, use ambient time, write
configuration, or import PMC/RCM internals.

## Verification

With Node 24.19.0 (satisfying the package minimum):

```text
npm ci --ignore-scripts
npm test
npm run typecheck
npm run lint
```

The package has no runtime dependencies. Fixtures in the test suite are
synthetic and are not production catalog or route authority.


