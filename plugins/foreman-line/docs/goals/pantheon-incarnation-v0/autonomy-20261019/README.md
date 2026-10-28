# Pantheon autonomy package — OM-PAN-001

Prepared 2026-10-19 by Codex `01a15424-1fd5-77a2-a73a-d92a60a5de34`.
Status: **PROPOSED — awaiting one owner ratification. No execution authority is minted by these files.**

The proposed first proof is one real development cycle in a constrained Docker environment under Keon Runtime, followed by a minimal second-laptop worker demonstration. The existing identity/incarnation roadmap is preserved as follow-on work. A complete set of documents is not completion of either proof.

Read [RATIFICATION.md](RATIFICATION.md) for the single decision bundle. Supporting artifacts:

| Artifact | Purpose |
|---|---|
| [EVIDENCE.md](EVIDENCE.md) | Reconciled starting point, failed review diagnosis, account observations, source anchors and limitations |
| [MANDATE.md](MANDATE.md) / [mandate.json](mandate.json) | Proposed standing authority and numerical limits; machine-readable configuration is not a signed grant |
| [CHARTER.md](CHARTER.md) | Revised first objective, preserved decisions, explicit material amendments and deferred work |
| [WORKFLOW-AMENDMENTS.md](WORKFLOW-AMENDMENTS.md) | Exact replacement rules, installation targets and safe activation sequence |
| [RUNTIME-PATH.md](RUNTIME-PATH.md) | Existing contracts, missing host integrations, enforcement and failure boundaries |
| [OWNERSHIP.md](OWNERSHIP.md) | Full session lineage, initial succession, durable lease/fencing policy |
| [MODEL-ACCOUNTING.md](MODEL-ACCOUNTING.md) / [model-registry.json](model-registry.json) | Reusable model facts, account applicability, refresh and distinct accounting categories |
| [QUEUE.md](QUEUE.md) / [queue.json](queue.json) | Dependency-ordered bounded parcels, owners, allowed surfaces and acceptance evidence |
| [LOOP.md](LOOP.md) / [coordinator-loop.mjs](coordinator-loop.mjs) | Executable decision loop for supported `/goal` coordination; execution ports remain deliberately unbound |
| [DOGFOOD.md](DOGFOOD.md) | Real development scenario, negative cases, resume exercise and measurable exit criteria |
| [BOOTSTRAP.md](BOOTSTRAP.md) | Finite independent bootstrap, account qualification, direct-sender and review-result acceptance |
| [evidence/](evidence/) / [scripts/](scripts/) | Local deterministic evidence and repeatable read-only checks |
| [prototypes/direct-review/](prototypes/direct-review/) | Offline-only sender preparation; no live entry point or Runtime authority |

Canonical Foreman source is `D:/Repos/agent-skills/plugins/foreman-line`. The original `charter.md`, Amendment 01, gate history, consumed attempt and fixed review packet remain frozen. This package is an append-only proposal beside them, not a competing live owner record. `D:/Repos/Pantheon` currently has no Git metadata. Do not initialize it over the existing audit files: the proposed execution checkout is `D:/Repos/Pantheon/work/pantheon26` after remote reconciliation.

Run local package checks with `node coordinator-loop.mjs --check` and `node scripts/validate-package.mjs`. They cannot dispatch or approve anything. The first command evaluates the initial queue and reports admission holds; that is a runnable coordinator decision surface, not a claim that the missing Runtime adapters are implemented.

After ratification: append the exact human message reference and package digest to the canonical gate record; activate the scoped workflow amendments; perform custody transfer; complete finite bootstrap; enter the supported `/foreman-line:goal resume pantheon-incarnation-v0` workflow using LOOP.md. Do not wait for another routine approval. Only the defined material exceptions stop dependent execution.
