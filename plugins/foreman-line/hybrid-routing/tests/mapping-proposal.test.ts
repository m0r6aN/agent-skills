import assert from "node:assert/strict";
import { test } from "node:test";
import {
	type HroBindingProjectionDraftV1,
	type MappingProposalV1,
	type MappingValidationContext,
	validateMappingProposal,
} from "../src/index.js";

const retrieval = "2026-09-26T12:00:00.000Z";
const context: MappingValidationContext = {
	evaluationTimeUtc: "2026-09-26T12:30:00.000Z",
	maxEvidenceAgeMs: 86400000,
	expectedEvidenceRef: "fixture://hro-p1a/static-v1",
	expectedContentSha256: "a".repeat(64),
};
function proposal(
	overrides: Partial<MappingProposalV1> = {},
): MappingProposalV1 {
	return {
		schema: "hro-mapping-proposal/v1",
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
			retrievedAt: retrieval,
			contentSha256: "a".repeat(64),
			catalogVersion: "catalog/v1",
			mappingVersion: "mapping/v1",
			policySchemaVersion: "policy/v1",
			roleMapVersion: "roles/v1",
			foremanRevision: "foreman/test",
			piRuntimeVersion: "pi/test",
			approvalEvidenceState: "static-conformance",
		},
		...overrides,
	};
}
function projection(
	bindings: Array<{
		proposal: MappingProposalV1;
		conformance: "allowed" | "disabled";
	}> = [{ proposal: proposal(), conformance: "allowed" }],
): HroBindingProjectionDraftV1 {
	return {
		schema: "hro-binding-projection-draft/v1",
		evidenceRef: context.expectedEvidenceRef,
		bindings,
	};
}
test("accepts exact static proposal and returns an owned frozen copy", () => {
	const input = proposal();
	const result = validateMappingProposal(input, projection(), context);
	assert.equal(result.ok, true);
	if (result.ok) {
		assert.equal(result.evidenceOnly, true);
		assert.notEqual(result.proposal, input);
		assert(Object.isFrozen(result.proposal));
		assert(Object.isFrozen(result.proposal.provenance));
		assert.throws(() => {
			(result.proposal as { provider: string }).provider = "evil";
		}, TypeError);
	}
});

test("does not retain caller-owned mutation after the validation boundary", () => {
	const input = proposal();
	const evidence = projection();
	const result = validateMappingProposal(input, evidence, context);
	(input as unknown as { provider: string }).provider = "changed";
	const evidenceBinding = evidence.bindings[0];
	assert.ok(evidenceBinding);
	(evidenceBinding.proposal as unknown as { provider: string }).provider =
		"changed";
	assert.equal(result.ok, true);
	if (result.ok) assert.equal(result.proposal.provider, "openrouter");
});
test("rejects identity and provenance near-misses without inference", () => {
	const fields: Array<[keyof MappingProposalV1, unknown, string]> = [
		["logicalCandidateId", "candidate-opus-v2", "mapping_mismatch"],
		["provider", "OpenRouter", "provider_model_mismatch"],
		["providerModelId", "anthropic/claude-opus-5-5", "provider_model_mismatch"],
		["protocol", "responses", "protocol_unsupported"],
		[
			"piHostModelId",
			"openrouter/anthropic/claude-opus-5-5",
			"mapping_mismatch",
		],
		["lane", "backup", "mapping_mismatch"],
		["roleFamily", "builder", "mapping_mismatch"],
		["fallbackBindingId", "binding-other", "fallback_undeclared"],
	];
	for (const [key, value, code] of fields) {
		const changed = proposal({ [key]: value } as Partial<MappingProposalV1>);
		const result = validateMappingProposal(changed, projection(), context);
		assert.equal(result.ok, false);
		if (!result.ok) assert.equal(result.code, code);
	}
	for (const key of [
		"source",
		"retrievedAt",
		"contentSha256",
		"catalogVersion",
		"mappingVersion",
		"policySchemaVersion",
		"roleMapVersion",
		"foremanRevision",
		"piRuntimeVersion",
		"approvalEvidenceState",
	] as const) {
		const changedValue =
			key === "retrievedAt"
				? "2026-09-26T12:01:00.000Z"
				: key === "contentSha256"
					? "b".repeat(64)
					: key === "approvalEvidenceState"
						? "wrong"
						: "changed";
		const changed = proposal({
			provenance: { ...proposal().provenance, [key]: changedValue },
		});
		const result = validateMappingProposal(changed, projection(), context);
		assert.equal(result.ok, false);
	}
});
test("rejects malformed shapes, accessors, cycles, and nonfinite values", () => {
	const extra = { ...proposal(), extra: true };
	assert.equal(validateMappingProposal(extra, projection(), context).ok, false);
	const accessor = { ...proposal() } as Record<string, unknown>;
	Object.defineProperty(accessor, "provider", { get: () => "openrouter" });
	assert.equal(
		validateMappingProposal(accessor, projection(), context).ok,
		false,
	);
	const cycle = { ...proposal() } as Record<string, unknown>;
	cycle.provenance = { ...proposal().provenance, cycle };
	const cyclic = validateMappingProposal(cycle, projection(), context);
	assert.equal(cyclic.ok, false);
	if (!cyclic.ok) assert.equal(cyclic.code, "input_invalid");
	assert.equal(
		validateMappingProposal(
			{ ...proposal(), provider: Number.NaN },
			projection(),
			context,
		).ok,
		false,
	);
});

test("does not collapse opaque tuple components at delimiters", () => {
	const first = proposal({
		logicalCandidateId: "a\u0000b",
		provider: "c",
		providerModelId: "d",
		protocol: "e",
		lane: "f",
		roleFamily: "g",
	});
	const second = proposal({
		bindingId: "binding-second",
		logicalCandidateId: "a",
		provider: "b\u0000c",
		providerModelId: "d",
		protocol: "e",
		lane: "f",
		roleFamily: "g",
	});
	const result = validateMappingProposal(
		first,
		projection([
			{ proposal: first, conformance: "allowed" },
			{ proposal: second, conformance: "allowed" },
		]),
		context,
	);
	assert.equal(result.ok, true);
});

test("snapshots hostile proxies without invoking iterators or leaking late throws", () => {
	const disabled = projection([
		{ proposal: proposal(), conformance: "disabled" },
	]);
	const iteratorTrap = new Proxy(disabled.bindings, {
		get(target, property, receiver) {
			if (property === Symbol.iterator) {
				return function* () {
					yield { proposal: proposal(), conformance: "allowed" };
				};
			}
			return Reflect.get(target, property, receiver);
		},
	});
	const iteratorResult = validateMappingProposal(
		proposal(),
		{ ...disabled, bindings: iteratorTrap },
		context,
	);
	assert.equal(iteratorResult.ok, false);
	if (!iteratorResult.ok) assert.equal(iteratorResult.code, "lane_disabled");

	let descriptorReads = 0;
	const delayedThrow = new Proxy(proposal(), {
		getOwnPropertyDescriptor(target, property) {
			if (++descriptorReads > 5) throw new Error("late descriptor failure");
			return Reflect.getOwnPropertyDescriptor(target, property);
		},
	});
	const delayedResult = validateMappingProposal(
		delayedThrow,
		projection(),
		context,
	);
	assert.equal(delayedResult.ok, false);
	if (!delayedResult.ok) assert.equal(delayedResult.code, "input_invalid");

	const customPrototype = [...disabled.bindings];
	Object.setPrototypeOf(customPrototype, {
		[Symbol.iterator]: function* () {
			yield { proposal: proposal(), conformance: "allowed" };
		},
	});
	const prototypeResult = validateMappingProposal(
		proposal(),
		{ ...disabled, bindings: customPrototype },
		context,
	);
	assert.equal(prototypeResult.ok, false);
	if (!prototypeResult.ok) assert.equal(prototypeResult.code, "input_invalid");
	let ownKeysCalled = false;
	const huge = new Proxy(new Array(1_000_000), {
		ownKeys() {
			ownKeysCalled = true;
			throw new Error("ownKeys must not run");
		},
	});
	const hugeResult = validateMappingProposal(huge, projection(), context);
	assert.equal(hugeResult.ok, false);
	if (!hugeResult.ok) assert.equal(hugeResult.code, "input_limit_exceeded");
	assert.equal(ownKeysCalled, false);
});

test("enforces structural array bounds and counts primitive values across all inputs", () => {
	const exactBindings = Array.from({ length: 256 }, (_, index) => ({
		proposal: proposal({
			bindingId: `exact-${index}`,
			providerModelId: `model-${index}`,
		}),
		conformance: "allowed" as const,
	}));
	const firstExact = exactBindings[0];
	assert.ok(firstExact);
	const exactResult = validateMappingProposal(
		firstExact.proposal,
		projection(exactBindings),
		context,
	);
	assert.equal(exactResult.ok, true);
	const tooManyBindings = Array.from({ length: 257 }, () => ({
		proposal: proposal(),
		conformance: "allowed",
	}));
	const boundResult = validateMappingProposal(
		proposal(),
		projection(tooManyBindings as never),
		context,
	);
	assert.equal(boundResult.ok, false);
	if (!boundResult.ok) assert.equal(boundResult.code, "input_limit_exceeded");

	const noncanonical = [projection().bindings[0]] as Array<unknown>;
	Object.defineProperty(noncanonical, "01", {
		value: projection().bindings[0],
	});
	const keyResult = validateMappingProposal(
		proposal(),
		{ ...projection(), bindings: noncanonical },
		context,
	);
	assert.equal(keyResult.ok, false);
	if (!keyResult.ok) assert.equal(keyResult.code, "input_invalid");

	const primitiveFlood = { ...proposal() } as Record<string, unknown>;
	for (let index = 0; index < 8200; index += 1)
		primitiveFlood[`noise${index}`] = index;
	const floodResult = validateMappingProposal(
		primitiveFlood,
		projection(),
		context,
	);
	assert.equal(floodResult.ok, false);
	if (!floodResult.ok) assert.equal(floodResult.code, "input_limit_exceeded");
});

test("distinguishes the exact visited-value limit from one value over", () => {
	const base = { ...proposal(), padding: [] as unknown[] };
	const valueCount = (value: unknown): number => {
		if (value === null || typeof value !== "object") return 1;
		if (Array.isArray(value))
			return 1 + value.reduce((total, item) => total + valueCount(item), 0);
		return (
			1 +
			Object.values(value).reduce((total, item) => total + valueCount(item), 0)
		);
	};
	let remaining =
		8192 - valueCount(base) - valueCount(projection()) - valueCount(context);
	while (remaining > 0) {
		if (remaining === 1) {
			base.padding.push(0);
			remaining = 0;
		} else {
			const length = Math.min(255, remaining - 1);
			base.padding.push(Array.from({ length }, () => 0));
			remaining -= length + 1;
		}
	}
	const exact = validateMappingProposal(base, projection(), context);
	assert.equal(exact.ok, false);
	if (!exact.ok) assert.equal(exact.code, "input_invalid");
	const over = { ...base, padding: [...base.padding, 0] };
	const overLimit = validateMappingProposal(over, projection(), context);
	assert.equal(overLimit.ok, false);
	if (!overLimit.ok) assert.equal(overLimit.code, "input_limit_exceeded");
});

test("uses one aggregate string budget across proposal, projection, and context", () => {
	const largeProposal = proposal({
		logicalCandidateId: "x".repeat(2048),
		bindingId: "b".repeat(2048),
		provider: "p".repeat(2048),
		providerModelId: "m".repeat(2048),
		protocol: "q".repeat(2048),
		piHostModelId: "h".repeat(2048),
		lane: "l".repeat(2048),
		roleFamily: "r".repeat(2048),
		provenance: Object.fromEntries(
			Object.entries(proposal().provenance).map(([key, value]) => [
				key,
				key === "approvalEvidenceState" ? value : "v".repeat(2048),
			]),
		) as MappingProposalV1["provenance"],
	});
	const many = Array.from({ length: 110 }, (_, index) => ({
		proposal: proposal({
			bindingId: `b${index}`,
			provenance: { ...proposal().provenance, source: "s".repeat(2000) },
		}),
		conformance: "allowed" as const,
	}));
	const result = validateMappingProposal(
		largeProposal,
		projection(many),
		context,
	);
	assert.equal(result.ok, false);
	if (!result.ok) assert.equal(result.code, "input_limit_exceeded");
});

test("accepts a string exactly at the per-string limit", () => {
	const boundary = proposal({ provider: "x".repeat(2048) });
	const result = validateMappingProposal(
		boundary,
		projection([{ proposal: boundary, conformance: "allowed" }]),
		context,
	);
	assert.equal(result.ok, true);
});

test("distinguishes the exact aggregate string limit from one byte over", () => {
	const base = { ...proposal(), padding: [] as string[] };
	const stringUnits = (value: unknown): number => {
		if (typeof value === "string") return value.length;
		if (Array.isArray(value))
			return value.reduce((total, item) => total + stringUnits(item), 0);
		if (value && typeof value === "object")
			return Object.values(value).reduce(
				(total, item) => total + stringUnits(item),
				0,
			);
		return 0;
	};
	let remaining =
		262144 -
		stringUnits(base) -
		stringUnits(projection()) -
		stringUnits(context);
	while (remaining > 2048) {
		base.padding.push("x".repeat(2048));
		remaining -= 2048;
	}
	if (remaining > 0) base.padding.push("x".repeat(remaining));
	const exact = validateMappingProposal(base, projection(), context);
	assert.equal(exact.ok, false);
	if (!exact.ok) assert.equal(exact.code, "input_invalid");
	const over = { ...base, padding: [...base.padding, "x"] };
	const overLimit = validateMappingProposal(over, projection(), context);
	assert.equal(overLimit.ok, false);
	if (!overLimit.ok) assert.equal(overLimit.code, "input_limit_exceeded");
});

test("rejects invalid dates and hashes while accepting exact age boundary", () => {
	const exact = proposal({
		provenance: {
			...proposal().provenance,
			retrievedAt: "2026-09-25T12:30:00.000Z",
		},
	});
	assert.equal(
		validateMappingProposal(
			exact,
			projection([{ proposal: exact, conformance: "allowed" }]),
			context,
		).ok,
		true,
	);
	const future = proposal({
		provenance: {
			...proposal().provenance,
			retrievedAt: "2026-09-26T12:30:00.001Z",
		},
	});
	const stale = validateMappingProposal(
		future,
		projection([{ proposal: future, conformance: "allowed" }]),
		context,
	);
	assert.equal(stale.ok, false);
	if (!stale.ok) assert.equal(stale.code, "provenance_stale");
	const badDate = proposal({
		provenance: {
			...proposal().provenance,
			retrievedAt: "2026-02-29T12:00:00.000Z",
		},
	});
	assert.equal(
		validateMappingProposal(
			badDate,
			projection([{ proposal: badDate, conformance: "allowed" }]),
			context,
		).ok,
		false,
	);
	const badHash = proposal({
		provenance: { ...proposal().provenance, contentSha256: "A".repeat(64) },
	});
	assert.equal(
		validateMappingProposal(
			badHash,
			projection([{ proposal: badHash, conformance: "allowed" }]),
			context,
		).ok,
		false,
	);
});
test("rejects pins, duplicates, disabled lanes, and invalid fallback graphs", () => {
	const wrongPin = validateMappingProposal(
		proposal(),
		{ ...projection(), evidenceRef: "fixture://other" },
		context,
	);
	assert.equal(wrongPin.ok, false);
	if (!wrongPin.ok) assert.equal(wrongPin.code, "provenance_mismatch");
	const duplicate = validateMappingProposal(
		proposal(),
		projection([
			{ proposal: proposal(), conformance: "allowed" },
			{
				proposal: proposal({ bindingId: "binding-2" }),
				conformance: "allowed",
			},
		]),
		context,
	);
	assert.equal(duplicate.ok, false);
	if (!duplicate.ok) assert.equal(duplicate.code, "duplicate_binding");
	const disabled = validateMappingProposal(
		proposal(),
		projection([{ proposal: proposal(), conformance: "disabled" }]),
		context,
	);
	assert.equal(disabled.ok, false);
	if (!disabled.ok) assert.equal(disabled.code, "lane_disabled");
	const dangling = proposal({ fallbackBindingId: "missing" });
	const danglingResult = validateMappingProposal(
		dangling,
		projection([{ proposal: dangling, conformance: "allowed" }]),
		context,
	);
	assert.equal(danglingResult.ok, false);
	if (!danglingResult.ok) assert.equal(danglingResult.code, "fallback_cycle");
	const self = proposal({ fallbackBindingId: "binding-opus-primary" });
	const selfResult = validateMappingProposal(
		self,
		projection([{ proposal: self, conformance: "allowed" }]),
		context,
	);
	assert.equal(selfResult.ok, false);
	if (!selfResult.ok) assert.equal(selfResult.code, "fallback_cycle");
	const cycleA = proposal({
		bindingId: "cycle-a",
		fallbackBindingId: "cycle-b",
	});
	const cycleB = proposal({
		bindingId: "cycle-b",
		lane: "backup",
		fallbackBindingId: "cycle-c",
	});
	const cycleC = proposal({
		bindingId: "cycle-c",
		lane: "recovery",
		fallbackBindingId: "cycle-a",
	});
	const multiCycle = validateMappingProposal(
		cycleA,
		projection([
			{ proposal: cycleA, conformance: "allowed" },
			{ proposal: cycleB, conformance: "allowed" },
			{ proposal: cycleC, conformance: "allowed" },
		]),
		context,
	);
	assert.equal(multiCycle.ok, false);
	if (!multiCycle.ok) assert.equal(multiCycle.code, "fallback_cycle");
});
test("preserves declared fallback but never selects it", () => {
	const fallback = proposal({ bindingId: "binding-fallback", lane: "backup" });
	const primary = proposal({ fallbackBindingId: fallback.bindingId });
	const result = validateMappingProposal(
		primary,
		projection([
			{ proposal: primary, conformance: "allowed" },
			{ proposal: fallback, conformance: "allowed" },
		]),
		context,
	);
	assert.equal(result.ok, true);
	if (result.ok)
		assert.equal(result.proposal.fallbackBindingId, fallback.bindingId);
});

test("rejects a fallback that points at a disabled evidence binding", () => {
	const disabled = proposal({ bindingId: "binding-disabled", lane: "backup" });
	const primary = proposal({ fallbackBindingId: disabled.bindingId });
	const result = validateMappingProposal(
		primary,
		projection([
			{ proposal: primary, conformance: "allowed" },
			{ proposal: disabled, conformance: "disabled" },
		]),
		context,
	);
	assert.equal(result.ok, false);
	if (!result.ok) assert.equal(result.code, "lane_disabled");
});

test("rejects limits and does not allow untrusted context to replace pins", () => {
	const oversized = proposal({ provider: "x".repeat(2049) });
	const tooLarge = validateMappingProposal(oversized, projection(), context);
	assert.equal(tooLarge.ok, false);
	if (!tooLarge.ok) assert.equal(tooLarge.code, "input_limit_exceeded");
	const contextMismatch = validateMappingProposal(proposal(), projection(), {
		...context,
		expectedContentSha256: "b".repeat(64),
	});
	assert.equal(contextMismatch.ok, false);
	if (!contextMismatch.ok)
		assert.equal(contextMismatch.code, "provenance_mismatch");
});
