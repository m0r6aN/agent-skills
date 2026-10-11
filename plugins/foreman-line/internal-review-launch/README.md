# IR-B01 offline admission/schema prototype

**Unregistered, unaccepted experimental work. NOT a launch gate, receipt issuer or independent review.**

Parent contract: `../docs/contracts/internal-review-launch-v1.md`, whole IR-A01 ratified by Clinton Morgan at `f5ec6cac7736ffb3ef24a0091bf0b56ea9136034`. Current ratification/construction evidence is in `../docs/goals/internal-frontier-review-admission/ir-p1-offline-construction-evidence.md`; historical pending markers in the sealed parent are not edited. The approved directive patch remains unapplied.

## What this does

`assessOfflinePolicy(input: unknown, nowEpochMs: number)` checks a closed JSON envelope and declared cross-field policy using existing Ajv. The clock is explicit for deterministic tests. Required identity/packet/authority/native-installation/account-policy/model-capability/accounting/custody groups reject absent, null, unknown-version and extra fields. Types expose the same fixture shape. The committed draft-07 JSON is rendered from `src/schemas.ts` with the shared schema-scaffold serializer; the frozen correlation UUID primitive is reused read-only.

A positive result is **`fixture-compatible`**, not `admitted`. Every result contains:

- `provenance: 'untrusted-offline-declarations'`
- `mayInvokeProvider: false`
- `runtimeStatus: 'held'`
- mandatory external runtime holds, even for a perfect synthetic fixture.

Evidence statuses/refs, installation digests, native mappings, usage and account balances are CALLER DECLARATIONS. They are not authenticated/measured by this package. All tests use fictional refs and digests, never real credentials, invoices, provider capabilities or an actual installation. Repeated assessments do not claim/consume permits: the `consumed` negative tests only a declared replay condition, not atomic replay enforcement. Digest comparisons check declared consistency only; no files are read, hashed or authenticated by admission.

Known policy violations are `refused`; missing/changed/expired declared evidence and uncertain capability/account/usage facts are `held`. Schema failures report only a fixed shape locator, never untrusted payloads. Successful policy compatibility does not close any mandatory runtime hold.

## Narrow policy represented

Only internal, owner's own credential-free initial OPMEM plan review; L2 verifier/adversarial-reviewer, architecture/risk, Anthropic `claude-fable-5-1` then sole `claude-opus-5-5` fallback, excluded OpenAI family, frontier/context >=200,000 and exactly `read_evidence`. Both exact native reasoning mappings must declare their supported highest setting. Unknown/default mappings hold; a declared highest `high` is not rejected solely because it is not `xhigh`. Claims of mapping verification remain unauthenticated.

Accepted Pro/native-Pi OAuth/settings and purpose-bound non-ZDR retention policy are represented separately from provider-use permission and runtime proof. No ZDR requirement is smuggled back in. Customer/client/restricted/regulated/credential material, feedback uploads, training/paid-extra changes and separate brokers refuse. The legacy/global/public-v1 policy is neither imported nor modified.

Cumulative per-attempt limits <=48,000 input / <=8,000 ALL output/reasoning, <=8 requests / <=30 minutes; <=60 minutes total; at most one primary and one original-packet fallback after unusable reconciled primary. Cached/repeated/tool input and reasoning belong in declared cumulative totals; this package does NOT measure them.

Incremental review <=500 cents inside parent <=2,500 cents, reconciled parent/subcap identities/spent/reservations and proposed exposure, quota separate; already-paid subscription fee excluded. No extra-usage/API/upgrade transition, invented zero balance, API estimate presented as invoice or uncertain additional exposure. Exact lower declared bounds are enforced too. Balances and quota evidence are synthetic, not a billing mechanism. Finite custody shape/refs are declarations, not result custody or platform isolation.

## Local commands (no installation in this scope)

Node >=24.19.0 supports the `.ts` source directly; TypeScript is for separate strict no-emit checking. Dependency declarations describe the existing local tools; **this scope grants no `npm install`, `npx` download or new lockfile**. Missing local tools are a stop. No package is registered/exported into production.

Ordinary already-resolved local environment:

```sh
npm test
npm run typecheck
npm run schema:print
```

Construction used read-only tools already present outside this worktree. From this package in the current Windows/Git Bash environment:

```sh
export NODE_PATH=D:/Repos/agent-skills/plugins/foreman-line/contracts/node_modules
D:/nvm/v24.19.0/node.exe --test tests/*.test.ts
D:/nvm/v24.19.0/node.exe \
  D:/Repos/agent-skills-pr170-assist/plugins/foreman-line/approval/node_modules/typescript/bin/tsc \
  --noEmit --project tsconfig.json \
  --typeRoots D:/Repos/agent-skills-pr170-assist/plugins/foreman-line/approval/node_modules/@types
```

`createRequire` uses normal Node dependency resolution (`NODE_PATH` above supplies the existing Ajv 8.20.0). This is validation-tool plumbing, not native Pi provider/auth selection. No dependency/junction files were added to this worktree or the supplying checkouts. Tests read only the approved local schemas/package/source for parity/import guards; admission has no filesystem, SDK, credential or network integration.

The source can be rendered to the one approved schema path with the existing shared helper:

```sh
node --input-type=module -e "import { generate } from '../schema-scaffold/src/generate.ts'; import { internalReviewLaunchSchema } from './src/schemas.ts'; generate([{name:'internal-review-launch-v1',schema:internalReviewLaunchSchema}], './schemas');"
```

## Explicitly NOT implemented or proved

Trusted authority/installation/provider-use permission, exact native model availability or reasoning capabilities, atomic single-use issuer/permit/request claims, revocation store, evidence filesystem/path/link/encoding confinement, actual resource/process/network isolation, native Pi invocation/token/time gates, durable hierarchical reservations/quota/billing/cancellation reconciliation, observed execution identity, worker findings transport/custody, rollback liabilities or production registration. Source import guards and synthetic negatives are NOT live security/isolation proof. No provider/worker/SDK/auth imports or calls, dependency installation, source repair, delegated review or new probe spend occurred.

A later native integration requires a separately authorized exact manifest, trusted external authority/control seams, genuine evidence and independent architecture/security/process gates. Local green tests or human prototype disposition cannot certify the launcher or the OPMEM plan. GitHub billing messages are left alone; local validation cannot replace unavailable CI or authorize merge.
