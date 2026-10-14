<!-- opmem-corporate-reference-removal-20261011 -->

## Owner-directed outcome

Jira will not be used for this goal. Remove **all references to `KONE`, `Kaseya`, and `kaseya.one`** from the current repository tree and establish a supported GitHub Issues delivery-tracking path instead of the corporate Jira workflow.

This issue is the requested tracked work item, not a claim that cleanup, a new registrar, or a process-contract amendment has already shipped.

## Scope

- Whole repository, not only the Foreman plugin: source, configuration, CLI/adapters, repository/agent instructions, documentation, templates, scripts, workflows, dependency metadata, tests, fixtures, examples, filenames and materialized current-tree evidence artifacts.
- Case-insensitive literal matching, including embedded variants such as the corporate product-name spelling and domain/site selectors.
- Remove corporate-specific project allowlists, schema constants, site discovery assumptions, credentials/account instructions and placeholder identifiers; replace them with repository-owned, validated equivalents where the functionality remains needed.
- Reconcile the Jira-only spec convention, registration/query/human-gate surfaces and frozen contracts for GitHub Issues. Preserve explicit approval, idempotency, preview-before-write, issue-to-spec SHA-permalink links, lineage, partial-failure reporting and real receipt/verification evidence. Never invent a Jira key or claim a fixture is a live GitHub integration.

An initial local inventory at `0df276e6c7c440093ebc3f836372d8c2bc92ba9e` found matching content in 268 tracked files across the repository. This is a discovery count, not a reviewed manifest or current remote count; refresh against the approved implementation base before shaping.

## Required planning before implementation

1. Produce an exhaustive current-tree/filename inventory and classify executable contracts, ordinary documentation, fixtures and historical proof artifacts.
2. Obtain explicit reviewed contract/version/lifecycle amendments for the GitHub-only path; do not silently change an active or locked contract.
3. Split the work into independently reviewable parcels with exact mutation authority, dependencies, named branches/worktrees, tests and rollback. Do not give a builder an unrestricted repository-wide replacement grant.
4. Decide how current-tree historical artifacts are redacted/replaced while preserving honest provenance, and regenerate any derived hashes through their actual producers. Do not edit a hashed artifact and continue to claim its old receipt verifies it.
5. Establish GitHub authentication/account scope and a real sandbox/issue namespace without altering repository protections to bypass review.

## Acceptance criteria

- An exhaustive case-insensitive literal scan of the current tracked tree and filenames finds no remaining targeted references, including committed/generated fixtures and historical documents retained in the tree. Any scanner that enforces the rule must not reintroduce the forbidden literals into scanned content itself.
- GitHub-only work can be approved, registered, queried and linked to an exact spec commit through the supported workflow, with repeat execution proving idempotency and real issue links/evidence.
- Current contracts, instructions and templates no longer require the corporate Jira project/site/schema or claim Jira is the required delivery system.
- Relevant package suites, schema/frontmatter/body checks, typechecks, boundary negative controls, and independent architecture/risk reviews pass on the final integrated head. Real external-boundary validation is separately authorized and recorded; mocks are not reported as live proof.
- No secrets, customer data or private project payloads are published as part of the cleanup or issue evidence. No automatic deletion of external issues, OAuth revocation, credential migration or protection changes.

## Boundaries

- **No Git history rewrite** is requested. Current-tree cleanup and explicit treatment of retained historical evidence must not silently erase or falsify past commits/receipts.
- This issue does not authorize unrelated feature work, production deployment, routing/model-policy repair or bypass of independent verification.
- Existing evidence and locked contracts require deliberate migration; broad text substitution is insufficient.

## Goal relationship

This is a process prerequisite for `operator-developer-cortex-memory`: its owner explicitly rejected Jira tracking. The current Jira-shaped registration contract must be reconciled before the coordinator claims GitHub-native registration is complete or dispatches through a fabricated replacement chain.
