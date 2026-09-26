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
		"catalogVersion",
		"mappingVersion",
		"policySchemaVersion",
		"roleMapVersion",
		"foremanRevision",
		"piRuntimeVersion",
	] as const) {
		const changed = proposal({
			provenance: { ...proposal().provenance, [key]: "changed" },
		});
		const result = validateMappingProposal(changed, projection(), context);
		assert.equal(result.ok, false);
		if (!result.ok) assert.equal(result.code, "provenance_mismatch");
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
