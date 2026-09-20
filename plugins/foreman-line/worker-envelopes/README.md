# @foreman-line/worker-envelopes

Provider-neutral task and result envelopes for governed delegated work. The
envelopes define role, risk, budget, routing metadata, evidence, usage, and
changed-surface fields without hard-coding a provider or concrete model.

`TaskEnvelope` and `ResultEnvelope` each have hand-authored TypeScript and JSON
Schema sources. `tests/parity.test.ts` checks generated-schema parity, while
the full-population and required-field tests protect requiredness and optional
field coverage.

Concrete model selection is an opaque registry key. The active harness may
route within the approved policy, but it cannot change role authority or
mutation scope.

```bash
npm run typecheck
npm run generate
npm run test
npm run lint
```
