# HRO offline consumer compatibility

This package validates an HRO-local mapping proposal against separately
injected, pinned static evidence, then checks an injected eligibility snapshot
and offline evaluator envelope. `validateConsumerCompatibility` accepts only
the closed P1b request shape and returns an owned, frozen
`evidenceOnly: true` proposal/result pair. Every adapter result is treated as
unknown; malformed, stale, refused, throwing, or thenable values fail closed.

The compatibility harness never authorizes, selects, executes, or discovers a
route. It does not read host files, call providers, use ambient time, write
receipts or configuration, or import PMC/RCM internals. Dispatch access is
type-only and the production evaluator is never called.

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

