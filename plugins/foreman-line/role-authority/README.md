# @foreman-line/role-authority

Provider-neutral role, risk, authority, data-classification, and serialization
contracts for Foreman Line. Concrete model names are deliberately not part of
this package; model selection belongs to `routing-policy/` and the active
client or harness.

The TypeScript shapes and committed JSON Schemas are kept in parity by
`tests/parity.test.ts`. The committed instance files are checked against their
typed sources by `tests/instances.test.ts`.

This package declares authority. Runtime enforcement is performed by dispatch,
the worker-envelope boundary, and the mutation-scope guard.

| Decision | Contract |
| --- | --- |
| D1 | Explicit repository and plugin roots |
| D2 | Report-only integration boundaries |
| D3 | Adversarial review isolation |
| D4 | Independent reviewer context |
| D5 | Receipt-chain lineage |
| D6 | Typed boundary errors |
| D7 | No implicit authority escalation |
| D8 | Human promotion gates |
| D9 | Provider-neutral role identity |
| D10 | Structured routing decisions |
| D11 | Mutation-scope enforcement |
| D12 | Read-only reviewer profile |
| D13 | Explicit registration identity |
| D14 | Schema-generated contracts |
| D15 | Generated-schema parity |
| D16 | Mutually exclusive role categories |
| D17 | Data-classification eligibility |
| D18 | Serialization ownership |
| D19 | Root-resolution audit |
| D20 | Judge-only critical closure |
| D21 | Model-family diversity |
| D22 | Cross-package import discipline |
| D23 | Chain-tip validation |
| D24 | Exclusive receipt writes |
| D25 | Worktree-first dispatch |
| D26 | No-clobber settings projection |
| D27 | Review findings quarantine |
| D28 | Report-only CI hooks |
| D29 | Explicit client installation |
| D30 | No credential exposure |
| D31 | OpenRouter base URL pinning |
| D32 | Jev routing/classification scope |
| D33 | Self-declaration ownership |
| D34 | Template/source parity |
| D35 | Version and changelog consistency |
| D36 | Serial verification and release evidence |

```bash
npm run typecheck
npm run generate
npm run generate:instances
npm run test
npm run lint
```
