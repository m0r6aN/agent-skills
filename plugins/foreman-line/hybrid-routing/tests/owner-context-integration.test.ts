// biome-ignore-all lint/suspicious/noExplicitAny: JSON fixture assertions use structural test data.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
	evaluateCatalogEligibility,
	producePublicObservationSnapshot,
	projectProviderBindingsV1,
	resolvePmcRouteV1,
	validateProviderBindingPolicyV1,
} from "../../routing-policy/src/index.js";
import {
	preparePmcOwnerContextV1,
	validateConsumerCompatibility,
} from "../src/index.js";

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

function retainedCatalog(ids: readonly string[] = retainedIds) {
	const input = {
		manifestBytes: new Uint8Array(manifestBytes),
		projectionBytes: new Uint8Array(projectionBytes),
		requestedIdentities: ids.map((id) => ({
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

function retainedResolverPolicy(ids: readonly string[]) {
	const policy = structuredClone(fixture.context.projection.policy);
	for (const [index, id] of ids.entries()) {
		const binding = policy.bindings[index + 2] as AnyRecord;
		binding.provider = "openrouter";
		binding.providerModelId = id;
		binding.piHostModelId = `openrouter/${id}`;
	}
	policy.laneBindings = policy.laneBindings
		.filter((entry: AnyRecord) => entry.lane !== "L4")
		.concat(
			ids.map((id, index) => ({
				lane: "L4",
				bindingId: `binding-${index + 2}`,
				matrixRole: index === 0 ? "primary" : "fallback",
				fallbackBindingId: index === 0 ? "binding-3" : null,
			})),
		);
	return policy;
}

function retainedResolverCase() {
	const ids = retainedIds.slice(0, 2);
	const { input, production } = retainedCatalog(ids);
	if (!production.ok) throw new Error("retained producer fixture refused");
	const document = JSON.parse(new TextDecoder().decode(production.canonicalBytes)) as AnyRecord;
	const sourceTimeUtc = document.providers[0].checkedAtUtc as string;
	const endTimeUtc = new Date(Date.parse(input.evaluationTimeUtc) + 3600000).toISOString();
	const baseline = refreshedOwnerContext();
	const ownerContext = baseline.ownerContext;
	ownerContext.evaluationTimeUtc = input.evaluationTimeUtc;
	ownerContext.bindings = ownerContext.bindings.filter((binding: AnyRecord) =>
		ids.some((_, index) => binding.bindingId === `binding-${index + 2}`),
	);
	const refresh = (value: unknown): void => {
		if (value === null || typeof value !== "object") return;
		const record = value as AnyRecord;
		if (Object.hasOwn(record, "observedAtUtc")) record.observedAtUtc = sourceTimeUtc;
		if (Object.hasOwn(record, "expiresAtUtc")) record.expiresAtUtc = endTimeUtc;
		for (const child of Object.values(record)) refresh(child);
	};
	refresh(ownerContext);
	const models = document.models as AnyRecord[];
	for (const [index, binding] of ownerContext.bindings.entries()) {
		const model = models[index] as AnyRecord;
		binding.protocol.value = model.api;
		binding.catalogBaseUrl.value = model.baseUrl;
		binding.family.value = `retained-family-${index}`;
		binding.instanceId.value = `retained-instance-${index}`;
		binding.cost.value.sourceProfileId = production.acceptedSource.profileId;
		binding.cost.value.sourceProfileVersion = production.acceptedSource.profileVersion;
		binding.cost.value.sourceProfileDigest = "a".repeat(64);
	}
	const catalogSource = structuredClone(baseline.catalogSource);
	refresh(catalogSource);
	catalogSource.value.profileId = production.acceptedSource.profileId;
	catalogSource.value.profileVersion = production.acceptedSource.profileVersion;
	catalogSource.value.profileDigest = "a".repeat(64);
	catalogSource.value.snapshotDigest = production.digestSha256;
	catalogSource.value.configAuthorityRef = "retained-test-config";
	catalogSource.evidence.sourceRef = production.acceptedSource.sourceEvidenceRef;
	catalogSource.evidence.sourceDigest = production.acceptedSource.sourceEvidenceSha256;
	const baseUrl = models[0]!.baseUrl as string;
	const catalogInput = {
		canonicalBytes: production.canonicalBytes,
		expectedSha256: production.digestSha256,
		approvedConfig: {
			authorityRef: "retained-test-config",
			endpoints: [{ provider: "openrouter", baseUrl }],
		},
		evaluationTimeUtc: input.evaluationTimeUtc,
		identities: input.requestedIdentities,
		acceptedSource: production.acceptedSource,
	};
	return {
		policy: retainedResolverPolicy(ids),
		catalogInput,
		catalogSource,
		ownerContext,
		request: structuredClone(fixture.request),
	};
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

test("retained producer bytes traverse the real bridge and resolver", () => {
	const retained = retainedResolverCase();
	const assembled = preparePmcOwnerContextV1({
		policy: retained.policy,
		catalogInput: retained.catalogInput,
		catalogSource: retained.catalogSource,
		ownerContext: retained.ownerContext,
	});
	assert.equal(assembled.ok, true);
	if (!assembled.ok) return;
	const decision = resolvePmcRouteV1(retained.request, assembled.context);
	assert.equal(decision.ok, true);
	if (decision.ok) {
		assert.equal(decision.decision.authority, "selection-only");
		assert.equal(decision.decision.provider, "openrouter");
		assert.equal(decision.decision.providerModelId, retained.catalogInput.identities[0]!.id);
	}
});

test("P1b oracle consumes real RCM projector rows while its v0 evaluator stays fixture-only", () => {
	const ids = retainedIds.slice(0, 1);
	const { input, production } = retainedCatalog(ids);
	assert.equal(production.ok, true);
	if (!production.ok) return;
	const catalogInput = {
		canonicalBytes: production.canonicalBytes,
		expectedSha256: production.digestSha256,
		approvedConfig: {
			authorityRef: "p1b-oracle-config",
			endpoints: [
				{ provider: "openrouter", baseUrl: "https://openrouter.ai/api/v1" },
			],
		},
		evaluationTimeUtc: input.evaluationTimeUtc,
		identities: input.requestedIdentities,
		acceptedSource: production.acceptedSource,
	};
	const proposal = {
		schema: "hro-mapping-proposal/v1" as const,
		logicalCandidateId: "retained-candidate-0",
		bindingId: "retained-binding-0",
		provider: "openrouter",
		providerModelId: ids[0],
		protocol: "openai-completions",
		piHostModelId: `openrouter/${ids[0]}`,
		lane: "frontier",
		roleFamily: "coordinator",
		fallbackBindingId: null,
		provenance: {
			source: "fixture-only",
			retrievedAt: input.evaluationTimeUtc,
			contentSha256: "a".repeat(64),
			catalogVersion: "catalog/v1",
			mappingVersion: "mapping/v1",
			policySchemaVersion: "policy/v1",
			roleMapVersion: "roles/v1",
			foremanRevision: "foreman/test",
			piRuntimeVersion: "pi/test",
			approvalEvidenceState: "static-conformance" as const,
		},
	};
	const eligibility = evaluateCatalogEligibility(catalogInput);
	assert.equal(eligibility.stage, "projector");
	if (eligibility.stage !== "projector" || !eligibility.result.ok) return;
	const expectedEligibility = {
		digestSha256: eligibility.result.provenance.digestSha256,
		sourceRef: eligibility.result.provenance.sourceRef,
		approvedConfigRef: eligibility.result.provenance.approvedConfigRef,
		maxAgeMs: eligibility.result.provenance.maxAgeMs,
	};
	const request = {
		proposal,
		projection: {
			schema: "hro-binding-projection-draft/v1" as const,
			evidenceRef: "fixture://hro-p1a/static-v1",
			bindings: [{ proposal, conformance: "allowed" as const }],
		},
		context: {
			evaluationTimeUtc: input.evaluationTimeUtc,
			maxEvidenceAgeMs: expectedEligibility.maxAgeMs,
			expectedEvidenceRef: "fixture://hro-p1a/static-v1",
			expectedContentSha256: "a".repeat(64),
		},
		routingInput: {
			routing_class: "architecture/risk",
			data_classification: "internal",
			workflowId: "wf-retained",
		},
		expectedEligibility,
	};
	const routing = {
		ok: true as const,
		result: {
			resolvedModelId: proposal.logicalCandidateId,
			resolvedTier: "frontier",
			transportRequirements: { data_collection: "deny" as const, zdr: true },
			routingDecisionRef: "offline/retained-p1b",
		},
	};
	const result = validateConsumerCompatibility(request, {
		eligibilityOracle: (oracleRequest) => {
			const real = evaluateCatalogEligibility(catalogInput);
			if (real.stage !== "projector" || !real.result.ok) return real;
			const row = real.result.results[0];
			const sourceTimeUtc = new Date(
				Date.parse(real.result.provenance.sourceTimeUtc),
			).toISOString();
			const ageMs =
				Date.parse(real.result.provenance.evaluationTimeUtc) -
				Date.parse(sourceTimeUtc);
			if (row?.outcome === "facts") {
				return {
					ok: true,
					provenance: {
						digestSha256: real.result.provenance.digestSha256,
						sourceRef: real.result.provenance.sourceRef,
						sourceTimeUtc,
						evaluationTimeUtc: real.result.provenance.evaluationTimeUtc,
						ageMs,
						maxAgeMs: real.result.provenance.maxAgeMs,
						approvedConfigRef: real.result.provenance.approvedConfigRef,
					},
					results: [
						{
							requested: { provider: row.requested.provider, id: row.requested.id },
							outcome: "facts",
							facts: {
								provider: row.facts.provider,
								id: row.facts.id,
								baseUrl: row.facts.baseUrl,
								api: row.facts.api,
								reasoning: row.facts.reasoning,
								contextWindow: row.facts.contextWindow,
								maxTokens: row.facts.maxTokens,
								inputModalities: [...row.facts.inputModalities],
								rates: {
									input: { ...row.facts.rates.input },
									output: { ...row.facts.rates.output },
								},
								thinkingLevels:
									row.facts.thinkingLevels.status === "declared"
										? {
												status: "declared",
												levels: row.facts.thinkingLevels.levels.map((level: AnyRecord) => ({
													level: level.level,
													providerValue: level.providerValue,
												})),
										  }
										: { status: "unknown" },
							},
						},
					],
				};
			}
			return {
				ok: true,
				provenance: {
					digestSha256: real.result.provenance.digestSha256,
					sourceRef: real.result.provenance.sourceRef,
					sourceTimeUtc,
					evaluationTimeUtc: real.result.provenance.evaluationTimeUtc,
					ageMs,
					maxAgeMs: real.result.provenance.maxAgeMs,
					approvedConfigRef: real.result.provenance.approvedConfigRef,
				},
				results: [
					{
						requested: {
							provider: row?.requested.provider ?? "openrouter",
							id: row?.requested.id ?? ids[0],
						},
						outcome: "refused",
						codes: row?.codes ?? ["UNKNOWN"],
					},
				],
			};
		},
		evaluateOffline: () => routing,
	});
	assert.equal(result.ok, true);
});

test("P1a, P1b, projection, selection, and permit-shaped values never substitute into owner slots", () => {
	const baseline = refreshedOwnerContext();
	const base = {
		policy: fixture.context.projection.policy,
		catalogInput: baseline.catalog,
		catalogSource: baseline.catalogSource,
		ownerContext: baseline.ownerContext,
	};
	const p1a = validateProviderBindingPolicyV1(base.policy);
	assert.equal(p1a.valid, true);
	const p1b = projectProviderBindingsV1(base.policy);
	assert.equal(p1b.ok, true);
	const projection = {
		schemaVersion: "pmc-provider-binding-projection/v1",
		evidenceOnly: true,
		policy: base.policy,
	};
	const assembled = preparePmcOwnerContextV1(base);
	assert.equal(assembled.ok, true);
	if (!assembled.ok) return;
	const selection = resolvePmcRouteV1(fixture.request, assembled.context);
	assert.equal(selection.ok, true);
	const permit = {
		permit: "serialized-owner-permit-shaped-value",
		authority: "selection-only",
		launch: true,
	};
	const substitutions = [p1a, p1b, projection, selection, permit];
	for (const slot of ["policy", "catalogInput", "catalogSource", "ownerContext"] as const) {
		for (const value of substitutions) {
			const candidate = { ...base, [slot]: value };
			const result = preparePmcOwnerContextV1(candidate);
			const selected = result.ok && resolvePmcRouteV1(fixture.request, result.context).ok;
			assert.equal(selected, false, `${slot} accepted a substitution as a selection`);
		}
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
