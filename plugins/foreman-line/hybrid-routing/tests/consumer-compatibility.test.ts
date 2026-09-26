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
