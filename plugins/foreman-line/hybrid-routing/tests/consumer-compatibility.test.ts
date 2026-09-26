import assert from "node:assert/strict";
import { test } from "node:test";
import { validateConsumerCompatibility } from "../src/index.js";

const proposal = {
	schema: "hro-mapping-proposal/v1" as const,
	logicalCandidateId: "candidate-opus",
	bindingId: "binding-opus-primary",
	provider: "openrouter",
	providerModelId: "anthropic/claude-opus-5.5",
	protocol: "openai-chat-completions",
	piHostModelId: "openrouter/anthropic/claude-opus-5.5",
	lane: "frontier",
	roleFamily: "coordinator",
	fallbackBindingId: null,
	provenance: {
		source: "fixture-only",
		retrievedAt: "2026-09-26T12:00:00.000Z",
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
const context = {
	evaluationTimeUtc: "2026-09-26T12:30:00.000Z",
	maxEvidenceAgeMs: 86400000,
	expectedEvidenceRef: "fixture://hro-p1a/static-v1",
	expectedContentSha256: "a".repeat(64),
};
const projection = {
	schema: "hro-binding-projection-draft/v1" as const,
	evidenceRef: context.expectedEvidenceRef,
	bindings: [{ proposal, conformance: "allowed" as const }],
};
const routingInput = {
	routing_class: "architecture/risk",
	data_classification: "internal",
	workflowId: "wf-1",
};
const request = {
	proposal,
	projection,
	context,
	routingInput,
	expectedEligibility: {
		digestSha256: "b".repeat(64),
		sourceRef: "snapshot/v1",
		approvedConfigRef: "config/v1",
		maxAgeMs: 1800000,
	},
};
const facts = {
	provider: proposal.provider,
	id: proposal.providerModelId,
	baseUrl: "https://example.invalid",
	api: proposal.protocol,
	reasoning: true,
	contextWindow: 200000,
	maxTokens: 4096,
	inputModalities: ["text"],
	rates: {
		input: { value: 1, unit: "USD per 1M tokens" },
		output: { value: 2, unit: "USD per 1M tokens" },
	},
	thinkingLevels: { status: "unknown" },
};
const oracle = {
	ok: true as const,
	provenance: {
		digestSha256: request.expectedEligibility.digestSha256,
		sourceRef: request.expectedEligibility.sourceRef,
		sourceTimeUtc: "2026-09-26T12:00:00.000Z",
		evaluationTimeUtc: context.evaluationTimeUtc,
		ageMs: 1800000,
		maxAgeMs: request.expectedEligibility.maxAgeMs,
		approvedConfigRef: request.expectedEligibility.approvedConfigRef,
	},
	results: [
		{
			requested: { provider: proposal.provider, id: proposal.providerModelId },
			outcome: "facts" as const,
			facts,
		},
	],
};
const routing = {
	ok: true as const,
	result: {
		resolvedModelId: proposal.logicalCandidateId,
		resolvedTier: "frontier",
		transportRequirements: { data_collection: "deny" as const, zdr: true },
		routingDecisionRef: "offline/decision-1",
	},
};
const deps = {
	eligibilityOracle: () => oracle,
	evaluateOffline: () => routing,
};

test("accepts exact offline evidence and invokes each adapter once", () => {
	let oracleCalls = 0;
	let evaluatorCalls = 0;
	const result = validateConsumerCompatibility(request, {
		eligibilityOracle: (input) => {
			oracleCalls++;
			assert(Object.isFrozen(input));
			return oracle;
		},
		evaluateOffline: (input) => {
			evaluatorCalls++;
			assert(Object.isFrozen(input));
			return routing;
		},
	});
	assert.equal(result.ok, true);
	assert.equal(oracleCalls, 1);
	assert.equal(evaluatorCalls, 1);
	if (result.ok) {
		assert.equal(result.evidenceOnly, true);
		assert(Object.isFrozen(result.proposal));
		assert(Object.isFrozen(result.routing));
	}
});

test("fails closed before downstream callbacks when mapping is refused", () => {
	let calls = 0;
	const result = validateConsumerCompatibility(
		{ ...request, proposal: { ...proposal, provider: "other" } },
		{
			eligibilityOracle: () => {
				calls++;
				return oracle;
			},
			evaluateOffline: () => {
				calls++;
				return routing;
			},
		},
	);
	assert.equal(result.ok, false);
	if (!result.ok) assert.equal(result.code, "mapping_refused");
	assert.equal(calls, 0);
});

test("rejects malformed, throwing, thenable, and adapter inputs", () => {
	let calls = 0;
	const invalid = validateConsumerCompatibility(
		{
			...request,
			expectedEligibility: {
				...request.expectedEligibility,
				digestSha256: "B".repeat(64),
			},
		},
		deps,
	);
	assert.equal(invalid.ok, false);
	const thrown = validateConsumerCompatibility(request, {
		eligibilityOracle: () => {
			throw 7;
		},
		evaluateOffline: () => {
			calls++;
			return routing;
		},
	});
	assert.equal(thrown.ok, false);
	if (!thrown.ok) assert.equal(thrown.code, "eligibility_invalid");
	assert.equal(calls, 0);
	const thenable = validateConsumerCompatibility(request, {
		eligibilityOracle: () =>
			Object.defineProperty({}, ["t", "hen"].join(""), {
				value: () => undefined,
			}),
		evaluateOffline: () => routing,
	});
	assert.equal(thenable.ok, false);
	if (!thenable.ok) assert.equal(thenable.code, "eligibility_invalid");
	const badAdapter = validateConsumerCompatibility(request, {
		eligibilityOracle: undefined as never,
		evaluateOffline: undefined as never,
	});
	assert.equal(badAdapter.ok, false);
	if (!badAdapter.ok) assert.equal(badAdapter.code, "adapter_invalid");
});

test("rejects route identity and weak restricted transport", () => {
	const mismatch = validateConsumerCompatibility(request, {
		...deps,
		evaluateOffline: () => ({
			ok: true,
			result: { ...routing.result, resolvedModelId: "other" },
		}),
	});
	assert.equal(mismatch.ok, false);
	if (!mismatch.ok) assert.equal(mismatch.code, "route_mismatch");
	const weak = validateConsumerCompatibility(
		{
			...request,
			routingInput: { ...routingInput, data_classification: "restricted" },
		},
		{
			...deps,
			evaluateOffline: () => ({
				ok: true,
				result: {
					...routing.result,
					transportRequirements: { data_collection: "allow", zdr: false },
				},
			}),
		},
	);
	assert.equal(weak.ok, false);
	if (!weak.ok) assert.equal(weak.code, "evaluator_invalid");
});

test("rejects incomplete rates and malformed declared thinking levels", () => {
	const emptyRates = validateConsumerCompatibility(request, {
		...deps,
		eligibilityOracle: () => ({
			...oracle,
			results: [{ ...oracle.results[0], facts: { ...facts, rates: {} } }],
		}),
	});
	assert.equal(emptyRates.ok, false);
	const badLevels = validateConsumerCompatibility(request, {
		...deps,
		eligibilityOracle: () => ({
			...oracle,
			results: [
				{
					...oracle.results[0],
					facts: {
						...facts,
						thinkingLevels: { status: "declared", levels: [null, 42] },
					},
				},
			],
		}),
	});
	assert.equal(badLevels.ok, false);
});

test("rejects open envelopes, hidden properties, and oversized shared descendants", () => {
	const extra = validateConsumerCompatibility(request, {
		...deps,
		eligibilityOracle: () => ({ ...oracle, unexpected: true }),
	});
	assert.equal(extra.ok, false);
	const hidden = {} as Record<string, unknown>;
	Object.defineProperties(hidden, {
		eligibilityOracle: { value: deps.eligibilityOracle },
		evaluateOffline: { value: deps.evaluateOffline },
	});
	const hiddenResult = validateConsumerCompatibility(request, hidden as never);
	assert.equal(hiddenResult.ok, false);
	const shared = Array(64).fill("x".repeat(2048));
	const overBudget = validateConsumerCompatibility(request, {
		...deps,
		eligibilityOracle: () => ({ ...oracle, extra: Array(256).fill(shared) }),
	});
	assert.equal(overBudget.ok, false);
});

test("rejects malformed refusal arrays and classifies null evaluator output", () => {
	const refusal = validateConsumerCompatibility(request, {
		...deps,
		eligibilityOracle: () => ({
			...oracle,
			results: [
				{
					requested: oracle.results[0]?.requested,
					outcome: "refused",
					codes: [],
				},
			],
		}),
	});
	assert.equal(refusal.ok, false);
	const nullEvaluator = validateConsumerCompatibility(request, {
		...deps,
		evaluateOffline: () => null,
	});
	assert.equal(nullEvaluator.ok, false);
	if (!nullEvaluator.ok) assert.equal(nullEvaluator.code, "evaluator_invalid");
});

test("validates every rate, thinking entry, and closed success/failure envelope", () => {
	for (const changedRates of [
		{
			input: { value: Number.NaN, unit: "USD per 1M tokens" },
			output: facts.rates.output,
		},
		{ input: { value: 1, unit: "EUR" }, output: facts.rates.output },
		{
			input: { value: -1, unit: "USD per 1M tokens" },
			output: facts.rates.output,
		},
		{
			input: facts.rates.input,
			output: { value: 2, unit: "USD per 1M tokens", extra: true },
		},
	]) {
		const result = validateConsumerCompatibility(request, {
			...deps,
			eligibilityOracle: () => ({
				...oracle,
				results: [
					{ ...oracle.results[0], facts: { ...facts, rates: changedRates } },
				],
			}),
		});
		assert.equal(result.ok, false);
	}
	for (const levels of [
		{
			status: "declared",
			levels: [
				{ level: "low", providerValue: null },
				{ level: "low", providerValue: "LOW" },
			],
		},
		{
			status: "declared",
			levels: Array.from({ length: 33 }, (_, i) => ({
				level: `l${i}`,
				providerValue: null,
			})),
		},
		{ status: "declared", levels: [{ level: "low", providerValue: 1 }] },
	]) {
		const result = validateConsumerCompatibility(request, {
			...deps,
			eligibilityOracle: () => ({
				...oracle,
				results: [
					{ ...oracle.results[0], facts: { ...facts, thinkingLevels: levels } },
				],
			}),
		});
		assert.equal(result.ok, false);
	}
	const extraEvaluator = validateConsumerCompatibility(request, {
		...deps,
		evaluateOffline: () => ({ ...routing, extra: true }),
	});
	assert.equal(extraEvaluator.ok, false);
	const malformedFailure = validateConsumerCompatibility(request, {
		...deps,
		evaluateOffline: () => ({ ok: false, code: "NO", extra: true }),
	});
	assert.equal(malformedFailure.ok, false);
});

test("charges shared expansions, keys, and depth while preserving batch continuation", () => {
	const shared = Array(64).fill("x".repeat(2048));
	const tooManyStrings = validateConsumerCompatibility(request, {
		...deps,
		eligibilityOracle: () => ({ ...oracle, extra: Array(256).fill(shared) }),
	});
	assert.equal(tooManyStrings.ok, false);
	const hugeKey = validateConsumerCompatibility(
		{ ...request, ["x".repeat(300000)]: 1 },
		deps,
	);
	assert.equal(hugeKey.ok, false);
	const depth = {
		x: { x: { x: { x: { x: { x: { x: { x: { x: 1 } } } } } } } },
	};
	const tooDeep = validateConsumerCompatibility(
		{ ...request, extra: depth },
		deps,
	);
	assert.equal(tooDeep.ok, false);
	const results = [
		tooManyStrings,
		validateConsumerCompatibility(request, deps),
	];
	assert.equal(results[0]?.ok, false);
	assert.equal(results[1]?.ok, true);
});
