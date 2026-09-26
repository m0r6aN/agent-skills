// biome-ignore-all lint/suspicious/noExplicitAny: JSON fixture assertions use structural test data.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
	producePublicObservationSnapshot,
	resolvePmcRouteV1,
} from "../../routing-policy/src/index.js";
import { preparePmcOwnerContextV1 } from "../src/index.js";

type AnyRecord = Record<string, any>;
const fixture = JSON.parse(
	readFileSync(
		new URL(
			"../../routing-policy/tests/fixtures/pmc-resolver-v1.json",
			import.meta.url,
		),
		"utf8",
	),
) as { request: AnyRecord; context: AnyRecord };
const evidence = new URL(
	"../../docs/goals/routing-currency-and-merit/source-evidence/",
	import.meta.url,
);
const manifestBytes = readFileSync(
	new URL("pmc-binding-coverage-openrouter-20260926-v4.json", evidence),
);
const projectionBytes = readFileSync(
	new URL("openrouter-rcm-v1-conservative-projection-20260926.json", evidence),
);
const pins = JSON.parse(
	readFileSync(
		new URL(
			"../../routing-policy/tests/fixtures/public-observation-profiles.json",
			import.meta.url,
		),
		"utf8",
	),
);
const retainedIds = [
	"openai/gpt-6-astra",
	"anthropic/claude-opus-5.5",
	"anthropic/claude-sonnet-5",
	"openai/gpt-5.6-sol",
	"openai/gpt-5.6-terra",
	"google/gemini-3.8-flash",
];

function retainedCatalog() {
	const input = {
		manifestBytes: new Uint8Array(manifestBytes),
		projectionBytes: new Uint8Array(projectionBytes),
		requestedIdentities: retainedIds.map((id) => ({
			provider: "openrouter",
			id,
		})),
		evaluationTimeUtc: "2026-09-26T15:00:00.000Z",
	};
	const production = producePublicObservationSnapshot(input, pins);
	assert.equal(production.ok, true);
	if (!production.ok) throw new Error("retained producer fixture refused");
	return { input, production };
}

function expandedPolicy(ids: readonly string[]) {
	const policy = structuredClone(fixture.context.projection.policy);
	policy.bindings = policy.bindings.map((binding: AnyRecord, index: number) =>
		index < 2
			? {
					...binding,
					provider: "openrouter",
					providerModelId: ids[index],
					piHostModelId: `openrouter/${ids[index]}`,
				}
			: binding,
	);
	for (let index = 2; index < ids.length; index++) {
		const source = policy.bindings[2] as AnyRecord;
		policy.candidates.push({
			logicalCandidateId: `retained-candidate-${index}`,
			family: { status: "unknown", reason: "synthetic offline" },
		});
		policy.bindings.push({
			...source,
			bindingId: `retained-binding-${index}`,
			logicalCandidateId: `retained-candidate-${index}`,
			provider: "openrouter",
			providerModelId: ids[index],
			piHostModelId: `openrouter/${ids[index]}`,
		});
	}
	return policy;
}

function syntheticCatalog() {
	const document = {
		formatVersion: "rcm-catalog-snapshot/v1",
		sourceRef: "synthetic-offline-only",
		providers: [
			{ providerKey: "opencode", checkedAtUtc: "2026-09-26T12:00:00.000Z" },
			{ providerKey: "openrouter", checkedAtUtc: "2026-09-26T12:00:00.000Z" },
		],
		models: ["model-0", "model-1", "model-2", "model-3"].map((id, index) => ({
			provider: index < 2 ? "opencode" : "openrouter",
			id,
			baseUrl: "https://synthetic.invalid/v1",
			api: "openai-completions",
			input: ["text", "image"],
			reasoning: true,
			contextWindow: 10000,
			maxTokens: 2000,
			thinkingLevelMap: { off: "none", high: "high" },
			cost: {
				input: { unit: "USD per 1M tokens", value: 1 },
				output: { unit: "USD per 1M tokens", value: 2 },
			},
		})),
	};
	const canonicalBytes = new TextEncoder().encode(
		`${JSON.stringify(document, null, 2)}\n`,
	);
	const digest = createHash("sha256").update(canonicalBytes).digest("hex");
	return {
		canonicalBytes,
		expectedSha256: digest,
		approvedConfig: {
			authorityRef: "synthetic-config",
			endpoints: [
				{ provider: "opencode", baseUrl: "https://synthetic.invalid/v1" },
				{ provider: "openrouter", baseUrl: "https://synthetic.invalid/v1" },
			],
		},
		evaluationTimeUtc: "2026-09-26T13:00:00.000Z",
		identities: ["model-0", "model-1", "model-2", "model-3"].map(
			(id, index) => ({
				provider: index < 2 ? "opencode" : "openrouter",
				id,
			}),
		),
		acceptedSource: {
			profileId: "synthetic-profile",
			profileVersion: "v1",
			canonicalSha256: digest,
			sourceEvidenceRef: document.sourceRef,
			sourceEvidenceSha256: "a".repeat(64),
			requestedIdentities: ["model-0", "model-1", "model-2", "model-3"].map(
				(id, index) => ({
					provider: index < 2 ? "opencode" : "openrouter",
					id,
				}),
			),
		},
	};
}

function refreshedOwnerContext() {
	const context = structuredClone(fixture.context);
	const evaluationTimeUtc = "2026-09-26T13:00:00.000Z";
	const observedAtUtc = "2026-09-26T12:00:00.000Z";
	context.evaluationTimeUtc = evaluationTimeUtc;
	context.freshness.value.maximumAgeMs = 86400000;
	const refresh = (value: unknown): void => {
		if (value === null || typeof value !== "object") return;
		const record = value as AnyRecord;
		if (Object.hasOwn(record, "observedAtUtc"))
			record.observedAtUtc = observedAtUtc;
		if (Object.hasOwn(record, "expiresAtUtc"))
			record.expiresAtUtc = "2026-09-26T14:00:00.000Z";
		for (const child of Object.values(record)) refresh(child);
	};
	refresh(context);
	const catalog = syntheticCatalog();
	context.catalog.source.value.snapshotDigest = catalog.expectedSha256;
	context.catalog.source.value.configAuthorityRef =
		catalog.approvedConfig.authorityRef;
	context.catalog.provenance = undefined;
	const {
		projection: _projection,
		catalog: _catalog,
		...ownerContext
	} = context;
	return { ownerContext, catalogSource: context.catalog.source, catalog };
}

test("retained producer evidence assembles six real rows and preserves synthetic dynamic unknowns", () => {
	const { input, production } = retainedCatalog();
	const result = preparePmcOwnerContextV1({
		policy: expandedPolicy(retainedIds),
		catalogInput: {
			canonicalBytes: production.canonicalBytes,
			expectedSha256: production.digestSha256,
			approvedConfig: {
				authorityRef: "SYNTHETIC-test-only-endpoint-authority",
				endpoints: [
					{ provider: "openrouter", baseUrl: "https://openrouter.ai/api/v1" },
				],
			},
			evaluationTimeUtc: input.evaluationTimeUtc,
			identities: input.requestedIdentities,
			acceptedSource: production.acceptedSource,
		},
		catalogSource: { status: "unknown" },
		ownerContext: {
			policyDigest: "a".repeat(64),
			configDigest: "a".repeat(64),
			evaluationTimeUtc: input.evaluationTimeUtc,
			evidenceMode: "synthetic-offline",
			episode: { status: "unknown" },
			freshness: { status: "unknown" },
			independence: { status: "unknown" },
			budget: { status: "unknown" },
			bindings: [],
		},
	});
	assert.equal(result.ok, true);
	if (!result.ok) return;
	const context = result.context as AnyRecord;
	assert.deepEqual(
		context.catalog.results.map((row: AnyRecord) => [
			row.provider,
			row.providerModelId,
		]),
		input.requestedIdentities.map((identity) => [
			identity.provider,
			identity.id,
		]),
	);
	assert.equal(
		context.catalog.provenance.evaluationTimeUtc,
		input.evaluationTimeUtc,
	);
	assert.equal(context.catalog.results.length, 6);
});

test("real adapter and resolver integration selects only with synthetic dynamic claims", () => {
	const { ownerContext, catalogSource, catalog } = refreshedOwnerContext();
	const result = preparePmcOwnerContextV1({
		policy: fixture.context.projection.policy,
		catalogInput: catalog,
		catalogSource,
		ownerContext,
	});
	assert.equal(result.ok, true);
	if (!result.ok) return;
	const request = structuredClone(fixture.request);
	const context = result.context as AnyRecord;
	const decision = resolvePmcRouteV1(request, context);
	assert.equal(decision.ok, true);
	if (decision.ok) {
		assert.equal(decision.decision.authority, "selection-only");
		assert.equal(decision.decision.providerModelId, "model-2");
	}
});

test("cross-owner bindings stop at their owning boundary", () => {
	const { ownerContext, catalogSource, catalog } = refreshedOwnerContext();
	const digestBroken = { ...catalog, expectedSha256: "0".repeat(64) };
	const digestResult = preparePmcOwnerContextV1({
		policy: fixture.context.projection.policy,
		catalogInput: digestBroken,
		catalogSource,
		ownerContext,
	});
	assert.equal(digestResult.ok, false);
	if (!digestResult.ok) assert.equal(digestResult.stage, "catalog");

	const timeBroken = {
		...catalog,
		evaluationTimeUtc: "2026-09-26T13:00:00.001Z",
	};
	const timeResult = preparePmcOwnerContextV1({
		policy: fixture.context.projection.policy,
		catalogInput: timeBroken,
		catalogSource,
		ownerContext,
	});
	assert.deepEqual(timeResult, {
		ok: false,
		evidenceOnly: true,
		stage: "bridge",
		code: "TIME_BINDING_REFUSED",
	});

	const sourceBroken = structuredClone(catalogSource);
	sourceBroken.value.configAuthorityRef = "different-config";
	const sourceResult = preparePmcOwnerContextV1({
		policy: fixture.context.projection.policy,
		catalogInput: catalog,
		catalogSource: sourceBroken,
		ownerContext,
	});
	assert.equal(sourceResult.ok, true);
	if (sourceResult.ok) {
		const refused = resolvePmcRouteV1(fixture.request, sourceResult.context);
		assert.equal(refused.ok, false);
		if (!refused.ok) assert.equal(refused.code, "CONTEXT_BINDING_REFUSED");
	}

	const sourceDigestBroken = structuredClone(catalogSource);
	sourceDigestBroken.value.snapshotDigest = "0".repeat(64);
	const sourceDigestResult = preparePmcOwnerContextV1({
		policy: fixture.context.projection.policy,
		catalogInput: catalog,
		catalogSource: sourceDigestBroken,
		ownerContext,
	});
	assert.equal(sourceDigestResult.ok, true);
	if (sourceDigestResult.ok) {
		const refused = resolvePmcRouteV1(
			fixture.request,
			sourceDigestResult.context,
		);
		assert.equal(refused.ok, false);
		if (!refused.ok) assert.equal(refused.code, "CONTEXT_BINDING_REFUSED");
	}

	const identityBroken = structuredClone(catalog);
	identityBroken.identities = identityBroken.identities.slice(0, 3);
	const identityResult = preparePmcOwnerContextV1({
		policy: fixture.context.projection.policy,
		catalogInput: identityBroken,
		catalogSource,
		ownerContext,
	});
	assert.deepEqual(identityResult, {
		ok: false,
		evidenceOnly: true,
		stage: "catalog",
		result: { stage: "adapter", ok: false, code: "SCOPE_REFUSED" },
	});

	const requestBindingBroken = structuredClone(ownerContext);
	requestBindingBroken.budget.evidence.requestDigest = "b".repeat(64);
	const requestBindingResult = preparePmcOwnerContextV1({
		policy: fixture.context.projection.policy,
		catalogInput: catalog,
		catalogSource,
		ownerContext: requestBindingBroken,
	});
	assert.equal(requestBindingResult.ok, true);
	if (requestBindingResult.ok) {
		const refused = resolvePmcRouteV1(
			fixture.request,
			requestBindingResult.context,
		);
		assert.equal(refused.ok, false);
		if (!refused.ok) assert.equal(refused.code, "CONTEXT_BINDING_REFUSED");
	}
});

test("real resolver freshness, budget, availability, independence, and history gates remain owner-owned", () => {
	const baseline = refreshedOwnerContext();
	const resolve = (ownerContext: AnyRecord) => {
		const assembled = preparePmcOwnerContextV1({
			policy: fixture.context.projection.policy,
			catalogInput: baseline.catalog,
			catalogSource: baseline.catalogSource,
			ownerContext,
		});
		assert.equal(assembled.ok, true);
		if (!assembled.ok) throw new Error("baseline owner context refused");
		return resolvePmcRouteV1(fixture.request, assembled.context);
	};

	const staleSource = structuredClone(baseline.catalogSource);
	staleSource.evidence.expiresAtUtc = "2026-09-26T12:59:59.999Z";
	const staleAssembly = preparePmcOwnerContextV1({
		policy: fixture.context.projection.policy,
		catalogInput: baseline.catalog,
		catalogSource: staleSource,
		ownerContext: baseline.ownerContext,
	});
	assert.equal(staleAssembly.ok, true);
	if (staleAssembly.ok) {
		const refused = resolvePmcRouteV1(fixture.request, staleAssembly.context);
		assert.equal(refused.ok, false);
		if (!refused.ok) assert.equal(refused.code, "FRESHNESS_STALE_REFUSED");
	}

	const futureSource = structuredClone(baseline.catalogSource);
	futureSource.evidence.observedAtUtc = "2026-09-26T14:00:00.000Z";
	futureSource.evidence.expiresAtUtc = "2026-09-26T15:00:00.000Z";
	const futureAssembly = preparePmcOwnerContextV1({
		policy: fixture.context.projection.policy,
		catalogInput: baseline.catalog,
		catalogSource: futureSource,
		ownerContext: baseline.ownerContext,
	});
	assert.equal(futureAssembly.ok, true);
	if (futureAssembly.ok) {
		const refused = resolvePmcRouteV1(fixture.request, futureAssembly.context);
		assert.equal(refused.ok, false);
		if (!refused.ok) assert.equal(refused.code, "FRESHNESS_FUTURE_REFUSED");
	}

	const budget = structuredClone(baseline.ownerContext);
	budget.budget.value.settledMicroUsd = 10_000_001;
	const budgetDecision = resolve(budget);
	assert.equal(budgetDecision.ok, false);
	if (!budgetDecision.ok) assert.equal(budgetDecision.code, "BUDGET_EXCEEDED");

	const unavailable = structuredClone(baseline.ownerContext);
	for (const binding of unavailable.bindings) {
		binding.available.value = false;
	}
	const availabilityDecision = resolve(unavailable);
	assert.equal(availabilityDecision.ok, false);
	if (!availabilityDecision.ok) {
		assert.equal(availabilityDecision.code, "NO_ELIGIBLE_BINDING");
		assert.ok(
			availabilityDecision.audit.candidates.every((candidate) =>
				candidate.refusals.includes("AVAILABILITY_UNVERIFIED"),
			),
		);
	}

	const independence = structuredClone(baseline.ownerContext);
	independence.independence.value.determination.value.differentFamilyRequired = true;
	for (const binding of independence.bindings) {
		binding.family = { status: "unknown" };
	}
	const independenceDecision = resolve(independence);
	assert.equal(independenceDecision.ok, false);
	if (!independenceDecision.ok) {
		assert.equal(independenceDecision.code, "NO_ELIGIBLE_BINDING");
		assert.ok(
			independenceDecision.audit.candidates.every((candidate) =>
				candidate.refusals.includes("INDEPENDENCE_UNPROVEN"),
			),
		);
	}

	const uncertain = structuredClone(baseline.ownerContext);
	uncertain.episode.value.attempts = [
		{
			requestId: "prior-request",
			requestDigest: "c".repeat(64),
			decisionDigest: "d".repeat(64),
			bindingId: "binding-2",
			provider: "openrouter",
			matrixRole: "primary",
			disposition: "uncertain",
		},
	];
	const uncertainDecision = resolve(uncertain);
	assert.equal(uncertainDecision.ok, false);
	if (!uncertainDecision.ok)
		assert.equal(uncertainDecision.code, "PRIOR_ATTEMPT_UNCERTAIN");
});

test("unknown dynamic claim data cannot become a selection or permit", () => {
	const { ownerContext, catalogSource, catalog } = refreshedOwnerContext();
	for (const key of [
		"episode",
		"freshness",
		"independence",
		"budget",
	] as const) {
		const result = preparePmcOwnerContextV1({
			policy: fixture.context.projection.policy,
			catalogInput: catalog,
			catalogSource,
			ownerContext: { ...ownerContext, [key]: { status: "unknown" } },
		});
		assert.equal(result.ok, true);
		if (result.ok) {
			const decision = resolvePmcRouteV1(fixture.request, result.context);
			assert.equal(decision.ok, false);
			if (!decision.ok) assert.equal(decision.code, "GLOBAL_EVIDENCE_UNPROVEN");
		}
	}
});
