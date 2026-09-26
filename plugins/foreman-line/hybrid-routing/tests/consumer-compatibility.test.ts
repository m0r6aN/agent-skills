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

test("captures records, arrays, and callbacks through one descriptor read", () => {
	const oneRead = <T extends object>(value: T, reads: Record<string, number>) =>
		new Proxy(value, {
			getOwnPropertyDescriptor(target, key) {
				const name = String(key);
				reads[name] = (reads[name] ?? 0) + 1;
				if (reads[name] > 1) throw new Error("descriptor reread");
				return Reflect.getOwnPropertyDescriptor(target, key);
			},
		});

	const routingReads: Record<string, number> = {};
	const routingResult = validateConsumerCompatibility(
		{ ...request, routingInput: oneRead({ ...routingInput }, routingReads) },
		deps,
	);
	assert.equal(routingResult.ok, true);
	assert.deepEqual(routingReads, {
		routing_class: 1,
		data_classification: 1,
		workflowId: 1,
	});

	const modalityReads: Record<string, number> = {};
	const oracleResult = validateConsumerCompatibility(request, {
		...deps,
		eligibilityOracle: () => ({
			...oracle,
			results: [
				{
					...oracle.results[0],
					facts: {
						...facts,
						inputModalities: oneRead(["text"], modalityReads),
					},
				},
			],
		}),
	});
	assert.equal(oracleResult.ok, true);
	assert.equal(modalityReads["0"], 1);
	assert.equal(modalityReads.length, 1);

	const dependencyReads: Record<string, number> = {};
	const dependencyResult = validateConsumerCompatibility(
		request,
		oneRead(deps, dependencyReads),
	);
	assert.equal(dependencyResult.ok, true);
	assert.deepEqual(dependencyReads, {
		eligibilityOracle: 1,
		evaluateOffline: 1,
	});
});

test("charges each shared expanded occurrence once at the exact value boundary", () => {
	const shared = Array(256).fill(0);
	const exactShared = [...Array(31).fill(shared), Array(223).fill(0)];
	const exactCopied = exactShared.map((value) => [...value]);
	const exactSharedResult = validateConsumerCompatibility(exactShared, deps);
	const exactCopiedResult = validateConsumerCompatibility(exactCopied, deps);
	assert.equal(exactSharedResult.ok, false);
	assert.equal(exactCopiedResult.ok, false);
	if (!exactSharedResult.ok)
		assert.equal(exactSharedResult.code, "input_invalid");
	if (!exactCopiedResult.ok)
		assert.equal(exactCopiedResult.code, "input_invalid");

	const over = [...exactCopied.slice(0, -1), Array(224).fill(0)];
	const overResult = validateConsumerCompatibility(over, deps);
	assert.equal(overResult.ok, false);
	if (!overResult.ok) assert.equal(overResult.code, "input_limit_exceeded");
});

test("rejects an oversized key before touching its descriptor", () => {
	let descriptorReads = 0;
	const key = "x".repeat(2049);
	const hostile = new Proxy(
		{ [key]: 0 },
		{
			getOwnPropertyDescriptor() {
				descriptorReads++;
				throw new Error("descriptor should not be read");
			},
		},
	);
	const result = validateConsumerCompatibility(hostile, deps);
	assert.equal(result.ok, false);
	if (!result.ok) assert.equal(result.code, "input_limit_exceeded");
	assert.equal(descriptorReads, 0);
});

test("preflights minimum remaining array values before child descriptors", () => {
	let descriptorReads = 0;
	const throwing = new Proxy(Array(224).fill(0), {
		getOwnPropertyDescriptor(target, key) {
			if (key === "0") {
				descriptorReads++;
				throw new Error("descriptor should not be read");
			}
			return Reflect.getOwnPropertyDescriptor(target, key);
		},
	});
	const oversized = [
		...Array.from({ length: 31 }, () => Array(256).fill(0)),
		throwing,
	];

	const result = validateConsumerCompatibility(oversized, deps);
	assert.equal(result.ok, false);
	if (!result.ok) assert.equal(result.code, "input_limit_exceeded");
	assert.equal(descriptorReads, 0);
});

test("acceptance matrix: forged eligibility pins refuse before evaluation", () => {
	for (const [field, forged] of [
		["digestSha256", "c".repeat(64)],
		["sourceRef", "forged/source"],
		["approvedConfigRef", "forged/config"],
	] as const) {
		let evaluatorCalls = 0;
		const result = validateConsumerCompatibility(request, {
			eligibilityOracle: () => {
				const response = structuredClone(oracle);
				response.provenance[field] = forged;
				return response;
			},
			evaluateOffline: () => {
				evaluatorCalls++;
				return routing;
			},
		});
		assert.equal(result.ok, false);
		if (!result.ok) assert.equal(result.code, "eligibility_mismatch");
		assert.equal(evaluatorCalls, 0);
	}
});

test("acceptance matrix: future, stale, exact, and zero-age evidence boundaries", () => {
	const cases = [
		{
			name: "forged clock",
			evaluationTimeUtc: "2026-09-26T12:29:00.000Z",
			sourceTimeUtc: "2026-09-26T12:00:00.000Z",
			ageMs: 1740000,
			maxAgeMs: 1800000,
			code: "eligibility_stale" as const,
		},
		{
			name: "future",
			evaluationTimeUtc: "2026-09-26T12:30:00.000Z",
			sourceTimeUtc: "2026-09-26T12:31:00.000Z",
			ageMs: -60000,
			maxAgeMs: 1800000,
			code: "eligibility_stale" as const,
		},
		{
			name: "stale",
			evaluationTimeUtc: "2026-09-26T12:30:00.000Z",
			sourceTimeUtc: "2026-09-26T11:59:00.000Z",
			ageMs: 1860000,
			maxAgeMs: 1800000,
			code: "eligibility_stale" as const,
		},
		{
			name: "exact",
			evaluationTimeUtc: "2026-09-26T12:30:00.000Z",
			sourceTimeUtc: "2026-09-26T12:00:00.000Z",
			ageMs: 1800000,
			maxAgeMs: 1800000,
			code: null,
		},
		{
			name: "zero-age",
			evaluationTimeUtc: "2026-09-26T12:30:00.000Z",
			sourceTimeUtc: "2026-09-26T12:30:00.000Z",
			ageMs: 0,
			maxAgeMs: 0,
			code: null,
		},
	];

	for (const scenario of cases) {
		const localRequest = structuredClone(request);
		localRequest.expectedEligibility.maxAgeMs = scenario.maxAgeMs;
		const localOracle = structuredClone(oracle);
		localOracle.provenance.evaluationTimeUtc = scenario.evaluationTimeUtc;
		localOracle.provenance.sourceTimeUtc = scenario.sourceTimeUtc;
		localOracle.provenance.ageMs = scenario.ageMs;
		localOracle.provenance.maxAgeMs = scenario.maxAgeMs;
		let evaluatorCalls = 0;
		const result = validateConsumerCompatibility(localRequest, {
			eligibilityOracle: () => localOracle,
			evaluateOffline: () => {
				evaluatorCalls++;
				return routing;
			},
		});
		assert.equal(result.ok, scenario.code === null, scenario.name);
		if (scenario.code !== null && !result.ok)
			assert.equal(result.code, scenario.code, scenario.name);
		assert.equal(evaluatorCalls, scenario.code === null ? 1 : 0, scenario.name);
	}
});

test("acceptance matrix: requested and facts identities require one exact match", () => {
	const cases = [
		{
			name: "missing result",
			mutate: (response: typeof oracle) => {
				response.results = [];
			},
			code: "eligibility_invalid" as const,
		},
		{
			name: "duplicate result",
			mutate: (response: typeof oracle) => {
				const first = response.results[0];
				if (!first) throw new Error("missing fixture result");
				response.results = [structuredClone(first), structuredClone(first)];
			},
			code: "eligibility_invalid" as const,
		},
		{
			name: "wrong requested identity",
			mutate: (response: typeof oracle) => {
				const first = response.results[0];
				if (!first) throw new Error("missing fixture result");
				first.requested.provider = "other-provider";
			},
			code: "eligibility_mismatch" as const,
		},
		{
			name: "wrong facts identity",
			mutate: (response: typeof oracle) => {
				const first = response.results[0];
				if (!first) throw new Error("missing fixture result");
				first.facts.provider = "other-provider";
			},
			code: "eligibility_mismatch" as const,
		},
	] as const;

	for (const scenario of cases) {
		let evaluatorCalls = 0;
		const result = validateConsumerCompatibility(request, {
			eligibilityOracle: () => {
				const response = structuredClone(oracle);
				scenario.mutate(response);
				return response;
			},
			evaluateOffline: () => {
				evaluatorCalls++;
				return routing;
			},
		});
		assert.equal(result.ok, false, scenario.name);
		if (!result.ok) assert.equal(result.code, scenario.code, scenario.name);
		assert.equal(evaluatorCalls, 0, scenario.name);
	}
});

test("acceptance matrix: facts protocol and modalities are exact", () => {
	const cases = [
		{
			name: "wrong protocol",
			mutate: (response: typeof oracle) => {
				const first = response.results[0];
				if (!first) throw new Error("missing fixture result");
				first.facts.api = "other-protocol";
			},
			code: "eligibility_mismatch" as const,
		},
		{
			name: "empty modalities",
			mutate: (response: typeof oracle) => {
				const first = response.results[0];
				if (!first) throw new Error("missing fixture result");
				first.facts.inputModalities = [];
			},
			code: "eligibility_invalid" as const,
		},
		{
			name: "duplicate modalities",
			mutate: (response: typeof oracle) => {
				const first = response.results[0];
				if (!first) throw new Error("missing fixture result");
				first.facts.inputModalities = ["text", "text"];
			},
			code: "eligibility_invalid" as const,
		},
		{
			name: "unsupported modality",
			mutate: (response: typeof oracle) => {
				const first = response.results[0];
				if (!first) throw new Error("missing fixture result");
				(
					first.facts as unknown as { inputModalities: unknown }
				).inputModalities = ["audio"];
			},
			code: "eligibility_invalid" as const,
		},
		{
			name: "non-string modality",
			mutate: (response: typeof oracle) => {
				const first = response.results[0];
				if (!first) throw new Error("missing fixture result");
				(
					first.facts as unknown as { inputModalities: unknown }
				).inputModalities = [42];
			},
			code: "eligibility_invalid" as const,
		},
	] as const;

	for (const scenario of cases) {
		let evaluatorCalls = 0;
		const result = validateConsumerCompatibility(request, {
			eligibilityOracle: () => {
				const response = structuredClone(oracle);
				scenario.mutate(response);
				return response;
			},
			evaluateOffline: () => {
				evaluatorCalls++;
				return routing;
			},
		});
		assert.equal(result.ok, false, scenario.name);
		if (!result.ok) assert.equal(result.code, scenario.code, scenario.name);
		assert.equal(evaluatorCalls, 0, scenario.name);
	}
});

function assertDeepFrozen(value: unknown): void {
	if (value === null || typeof value !== "object") return;
	assert.equal(Object.isFrozen(value), true);
	for (const child of Object.values(value)) assertDeepFrozen(child);
}

test("acceptance matrix: oracle and evaluator inputs are deeply frozen and caller mutations do not leak", () => {
	const localRequest = structuredClone(request);
	const localOracle = structuredClone(oracle);
	const localRouting = structuredClone(routing);
	let oracleInput: unknown;
	let evaluatorInput: unknown;
	const result = validateConsumerCompatibility(localRequest, {
		eligibilityOracle: (input) => {
			oracleInput = input;
			assertDeepFrozen(input);
			assert.deepEqual(Object.keys(input).sort(), [
				"evaluationTimeUtc",
				"identities",
			]);
			const identity = input.identities[0];
			if (!identity) throw new Error("missing frozen identity");
			assert.deepEqual(Object.keys(identity).sort(), ["id", "provider"]);
			return localOracle;
		},
		evaluateOffline: (input) => {
			evaluatorInput = input;
			assertDeepFrozen(input);
			assert.deepEqual(input, localRequest.routingInput);
			return localRouting;
		},
	});
	assert.equal(result.ok, true);
	assertDeepFrozen(oracleInput);
	assertDeepFrozen(evaluatorInput);

	localRequest.proposal.logicalCandidateId = "caller-mutated";
	localOracle.provenance.sourceRef = "caller-mutated/source";
	localRouting.result.resolvedModelId = "caller-mutated/model";
	if (result.ok) {
		assert.equal(
			result.proposal.logicalCandidateId,
			proposal.logicalCandidateId,
		);
		assert.equal(
			result.routing.routingDecisionRef,
			routing.result.routingDecisionRef,
		);
		assert.equal(
			result.routing.resolvedModelId,
			routing.result.resolvedModelId,
		);
	}
});

test("acceptance matrix: phase codes stop downstream callbacks after prerequisite failure", () => {
	const cases = [
		{
			name: "mapping refusal",
			request: { ...request, proposal: { ...proposal, provider: "other" } },
			deps,
			code: "mapping_refused" as const,
			oracleCalls: 0,
			evaluatorCalls: 0,
		},
		{
			name: "input invalid",
			request: { ...request, routingInput: { ...routingInput, extra: true } },
			deps,
			code: "input_invalid" as const,
			oracleCalls: 0,
			evaluatorCalls: 0,
		},
		{
			name: "adapter invalid",
			request,
			deps: { ...deps, eligibilityOracle: undefined as never },
			code: "adapter_invalid" as const,
			oracleCalls: 0,
			evaluatorCalls: 0,
		},
		{
			name: "eligibility refusal",
			request,
			deps: {
				eligibilityOracle: () => ({
					ok: false,
					level: "authority",
					code: "DENIED",
				}),
				evaluateOffline: () => routing,
			},
			code: "eligibility_refused" as const,
			oracleCalls: 1,
			evaluatorCalls: 0,
		},
		{
			name: "eligibility mismatch",
			request,
			deps: {
				eligibilityOracle: () => {
					const response = structuredClone(oracle);
					const first = response.results[0];
					if (!first) throw new Error("missing fixture result");
					first.facts.api = "other-protocol";
					return response;
				},
				evaluateOffline: () => routing,
			},
			code: "eligibility_mismatch" as const,
			oracleCalls: 1,
			evaluatorCalls: 0,
		},
		{
			name: "evaluator refusal",
			request,
			deps: {
				eligibilityOracle: () => oracle,
				evaluateOffline: () => ({ ok: false, code: "NO_ROUTE" }),
			},
			code: "evaluator_refused" as const,
			oracleCalls: 1,
			evaluatorCalls: 1,
		},
		{
			name: "evaluator invalid",
			request,
			deps: {
				eligibilityOracle: () => oracle,
				evaluateOffline: () => null,
			},
			code: "evaluator_invalid" as const,
			oracleCalls: 1,
			evaluatorCalls: 1,
		},
		{
			name: "route mismatch",
			request,
			deps: {
				eligibilityOracle: () => oracle,
				evaluateOffline: () => ({
					ok: true,
					result: { ...routing.result, resolvedModelId: "other" },
				}),
			},
			code: "route_mismatch" as const,
			oracleCalls: 1,
			evaluatorCalls: 1,
		},
	] as const;

	for (const scenario of cases) {
		if (typeof scenario.deps.eligibilityOracle !== "function") {
			const result = validateConsumerCompatibility(
				scenario.request,
				scenario.deps as never,
			);
			assert.equal(result.ok, false, scenario.name);
			if (!result.ok) assert.equal(result.code, scenario.code, scenario.name);
			assert.equal(scenario.oracleCalls, 0, scenario.name);
			assert.equal(scenario.evaluatorCalls, 0, scenario.name);
			continue;
		}
		let oracleCalls = 0;
		let evaluatorCalls = 0;
		const result = validateConsumerCompatibility(scenario.request, {
			eligibilityOracle: (_input) => {
				oracleCalls++;
				return scenario.deps.eligibilityOracle();
			},
			evaluateOffline: (_input) => {
				evaluatorCalls++;
				return scenario.deps.evaluateOffline();
			},
		});
		assert.equal(result.ok, false, scenario.name);
		if (!result.ok) assert.equal(result.code, scenario.code, scenario.name);
		assert.equal(oracleCalls, scenario.oracleCalls, scenario.name);
		assert.equal(evaluatorCalls, scenario.evaluatorCalls, scenario.name);
	}
});
