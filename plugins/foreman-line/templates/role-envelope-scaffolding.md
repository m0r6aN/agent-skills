# Role and Envelope Scaffolding — TEMPLATE

> Reusable, **client-neutral** scaffolding for the Foreman Line **role
> identity** and the **task/result envelopes** it dispatches and collects. Copy
> this file, fill every `<PLACEHOLDER>`, and validate the filled document
> against the shipped contracts before use. This file is scaffolding, not
> policy (charter D6): the committed JSON Schemas are the authority (D4), and
> where this file and a schema disagree, **the schema wins** — report the
> discrepancy rather than following this file.

**Client neutrality.** Nothing below names a host client, hook, channel, or
session command. The same envelope JSON is valid whether the worker runs under
Claude Code, Codex, the Pi harness, a plain CLI, or CI. Host adapters stay
thin: `hooks/` may report or block a host-visible violation and never becomes a
second routing or approval engine (D6).

## Where the authority lives

| Contract | Validate against (authority) | Typed source |
|---|---|---|
| Role identity | `role-authority/schemas/role-identity.schema.json` | `role-authority/src/` |
| Task envelope | `worker-envelopes/schemas/task.schema.json` | `worker-envelopes/src/task-envelope.ts` |
| Result envelope | `worker-envelopes/schemas/result.schema.json` | `worker-envelopes/src/result-envelope.ts` |

Project identity (project key, dispatch queue) is never invented inside an
envelope: it is injected from the repository's `foreman/config.yaml`
(D2/D3 — its template ships as `templates/foreman-config.yaml`). Every schema
is strict (`additionalProperties: false`): **unknown keys are refused — never
invent fields.**

## 1. Role identity scaffold

A task envelope carries its `role` inline; this standalone shape is for role
registries and role-authority records (`role-authority/schemas/`).

```json
{
  "role": "<ROLE>",
  "category": "<CATEGORY>",
  "registryKey": "<OPTIONAL: OPAQUE REGISTRY KEY>",
  "modelFamily": "<OPTIONAL: MODEL FAMILY LABEL>"
}
```

- `role` vocabulary (D4): `judge`, `coordinator`, `integrator`, `builder`,
  `operator`, `scout`, `verifier`, `deepAnalyst`, `multimodal`,
  `documentExtractor`, `utilityFallback`.
- `category` vocabulary (D4): `build`, `verify`, `integrate`, `accept`.
- `registryKey` / `modelFamily` are optional. A concrete model is an **opaque
  registry key** — never a provider URL, provider alias, provider credential
  name, or model-qualified route (D4, D9).
- Role authority is not routable: the harness may route within the approved
  policy, but it cannot change role authority or mutation scope (D7/D8).

## 2. Task envelope scaffold

`apiVersion` is exactly `"worker.kaseya/v1"`. Fields marked **required** are in
the schema's `required` array and cannot be omitted; the rest are optional.

```json
{
  "apiVersion": "worker.kaseya/v1",
  "taskId": "<TASK-ID>",
  "goalId": "<GOAL-ID>",
  "parcelId": "<PARCEL-ID>",
  "parentTaskId": "<OPTIONAL: PARENT TASK-ID>",
  "role": "<ROLE — SEE §1>",
  "taskType": "<TASK-TYPE>",
  "riskClass": "<R0 | R1 | R2 | R3>",
  "requiredCapabilities": ["<OPTIONAL CAPABILITY>"],
  "requiredModality": ["<OPTIONAL MODALITY>"],
  "allowedTools": ["<OPTIONAL TOOL>"],
  "allowedFiles": ["<REPO-RELATIVE PATH OR GLOB>"],
  "forbiddenSurfaces": ["<REPO-RELATIVE PATH OR GLOB>"],
  "inputRefs": ["<OPTIONAL INPUT REF>"],
  "inputDigest": "<DIGEST OF THE INPUT SET>",
  "acceptanceCriteria": ["<ACCEPTANCE CRITERION>"],
  "verificationPlan": "<OPTIONAL VERIFICATION PLAN>",
  "evidenceRequirements": ["<EVIDENCE REQUIREMENT>"],
  "budget": {
    "maxInputTokens": 0,
    "maxOutputTokens": 0,
    "maxWallTimeSeconds": 0,
    "maxCostUsd": 0,
    "maxParallelChildren": 0
  },
  "routing": {
    "diversityRequired": false,
    "preferredModel": "<OPTIONAL: OPAQUE REGISTRY KEY>",
    "fallbackModels": ["<OPTIONAL: OPAQUE REGISTRY KEY>"],
    "escalationTarget": "<OPTIONAL: OPAQUE REGISTRY KEY>"
  }
}
```

Required: `apiVersion`, `taskId`, `goalId`, `parcelId`, `role`, `taskType`,
`riskClass`, `allowedFiles`, `forbiddenSurfaces`, `inputDigest`,
`acceptanceCriteria`, `evidenceRequirements`, `budget` (all five fields
required), `routing` (`diversityRequired` required). Optional: `parentTaskId`,
`requiredCapabilities`, `requiredModality`, `allowedTools`, `inputRefs`,
`verificationPlan`, and `routing`'s `preferredModel`, `fallbackModels`,
`escalationTarget`.

Rules:

- **Mutation scope (D5):** `allowedFiles` + `forbiddenSurfaces` are the scope
  envelope. They are checked against the spec's `surfaces:` **before** dispatch
  and against adapter-reported changed paths **before** any completion receipt.
  Paths are opaque non-empty repo-relative strings here; well-formedness
  (no `.`/`..` segments, no denormalized spellings) is refused at the
  enforcement boundary, not by this schema.
- **Routing is bounded Foreman input (D7/D8):** Foreman supplies role, risk,
  data classification, independence, approval status, scope, and budget before
  any route is chosen. Coordinator, approval, security-review,
  verifier-independence, merge, and release work never rides automatic routing.
- Budget caps are the attempt/cost ceiling the route must respect, not hints.

## 3. Result envelope scaffold

`apiVersion` is exactly `"worker-result.kaseya/v1"`.

```json
{
  "apiVersion": "worker-result.kaseya/v1",
  "taskId": "<TASK-ID FROM THE TASK ENVELOPE>",
  "role": "<ROLE — SEE §1>",
  "modelRef": "<OPAQUE REGISTRY KEY OF THE MODEL ACTUALLY USED>",
  "status": "<COMPLETED | PARTIAL | BLOCKED | REFUSED | FAILED>",
  "summary": "<ONE-PARAGRAPH SUMMARY>",
  "requirements": {
    "satisfied": ["<ACCEPTANCE CRITERION>"],
    "unsatisfied": ["<ACCEPTANCE CRITERION>"],
    "uncertain": ["<ACCEPTANCE CRITERION>"]
  },
  "changedSurfaces": ["<REPO-RELATIVE PATH OR GLOB ACTUALLY CHANGED>"],
  "commandsExecuted": ["<LITERAL COMMAND>"],
  "tests": {
    "passed": ["<TEST>"],
    "failed": ["<TEST>"],
    "notRun": ["<TEST>"]
  },
  "evidence": ["<EVIDENCE REF — INCLUDING THE ROUTE EXPLANATION>"],
  "uncertainties": ["<OPTIONAL UNCERTAINTY>"],
  "confidenceSignal": "<OPTIONAL CONFIDENCE SIGNAL>",
  "recommendedEscalation": "<OPTIONAL ESCALATION TARGET>",
  "usage": {
    "inputTokens": 0,
    "outputTokens": 0,
    "wallTimeMs": 0,
    "estimatedCostUsd": 0
  },
  "outputDigest": "<DIGEST OF THE OUTPUT>"
}
```

Required: `apiVersion`, `taskId`, `role`, `modelRef`, `status`, `summary`,
`requirements` (all three arrays), `changedSurfaces`, `commandsExecuted`,
`tests` (all three arrays), `evidence`, `usage` (all four fields),
`outputDigest`. Optional: `uncertainties`, `confidenceSignal`,
`recommendedEscalation`.

Rules:

- **`modelRef` + route evidence (D7):** record the model actually used (opaque
  registry key) and keep the route explanation in `evidence`. Nothing here
  approves, merges, or releases anything — those decisions stay explicit and
  human-held (D8).
- **`changedSurfaces` is load-bearing (D5):** it is the post-hoc mutation-scope
  evidence checked against `allowedFiles`/`forbiddenSurfaces` before any
  completion receipt is written. A result with missing changed-path evidence is
  a **refusal**, not a completed task.
- Report only what ran: `commandsExecuted` and `tests` carry literal commands
  and test names; a check that did not run belongs in `notRun`, never in
  `passed`.
