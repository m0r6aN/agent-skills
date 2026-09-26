export type ProposalProvenance = Readonly<{
	source: string;
	retrievedAt: string;
	contentSha256: string;
	catalogVersion: string;
	mappingVersion: string;
	policySchemaVersion: string;
	roleMapVersion: string;
	foremanRevision: string;
	piRuntimeVersion: string;
	approvalEvidenceState: "static-conformance";
}>;
export type MappingProposalV1 = Readonly<{
	schema: "hro-mapping-proposal/v1";
	logicalCandidateId: string;
	bindingId: string;
	provider: string;
	providerModelId: string;
	protocol: string;
	piHostModelId: string;
	lane: string;
	roleFamily: string;
	fallbackBindingId: string | null;
	provenance: ProposalProvenance;
}>;
export type HroBindingProjectionDraftV1 = Readonly<{
	schema: "hro-binding-projection-draft/v1";
	evidenceRef: string;
	bindings: readonly Readonly<{
		proposal: MappingProposalV1;
		conformance: "allowed" | "disabled";
	}>[];
}>;
export type MappingValidationContext = Readonly<{
	evaluationTimeUtc: string;
	maxEvidenceAgeMs: number;
	expectedEvidenceRef: string;
	expectedContentSha256: string;
}>;
export type MappingRejectionCode =
	| "input_invalid"
	| "input_limit_exceeded"
	| "mapping_missing"
	| "provider_model_mismatch"
	| "protocol_unsupported"
	| "mapping_mismatch"
	| "provenance_stale"
	| "provenance_mismatch"
	| "fallback_undeclared"
	| "duplicate_binding"
	| "fallback_cycle"
	| "lane_disabled";
export type MappingProposalResult =
	| Readonly<{ ok: true; evidenceOnly: true; proposal: MappingProposalV1 }>
	| Readonly<{ ok: false; evidenceOnly: true; code: MappingRejectionCode }>;

type PlainRecord = Record<string, unknown>;
type ParseState = {
	active: WeakSet<object>;
	visited: WeakSet<object>;
	count: number;
	strings: number;
};
type ParseFailure = "input_invalid" | "input_limit_exceeded";
const PROVENANCE_KEYS = [
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
] as const;
const PROPOSAL_KEYS = [
	"schema",
	"logicalCandidateId",
	"bindingId",
	"provider",
	"providerModelId",
	"protocol",
	"piHostModelId",
	"lane",
	"roleFamily",
	"fallbackBindingId",
	"provenance",
] as const;
const BINDING_KEYS = ["proposal", "conformance"] as const;
const PROJECTION_KEYS = ["schema", "evidenceRef", "bindings"] as const;
const CONTEXT_KEYS = [
	"evaluationTimeUtc",
	"maxEvidenceAgeMs",
	"expectedEvidenceRef",
	"expectedContentSha256",
] as const;
const MAX_STRING = 2048;
const MAX_STRINGS = 262144;
const MAX_BINDINGS = 256;
const MAX_DEPTH = 8;
const MAX_VALUES = 8192;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const HASH_PATTERN = /^[0-9a-f]{64}$/;

function fail(code: MappingRejectionCode): MappingProposalResult {
	return { ok: false, evidenceOnly: true, code };
}
function isRecord(value: unknown): value is PlainRecord {
	if (value === null || typeof value !== "object" || Array.isArray(value))
		return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}
function keysExactly(value: PlainRecord, expected: readonly string[]): boolean {
	const keys = Reflect.ownKeys(value);
	return (
		keys.length === expected.length &&
		keys.every((key) => typeof key === "string" && expected.includes(key))
	);
}
function read(value: PlainRecord, key: string): unknown {
	const descriptor = Object.getOwnPropertyDescriptor(value, key);
	if (!descriptor || !("value" in descriptor)) throw new Error("accessor");
	return descriptor.value;
}
function scan(value: unknown, depth: number, state: ParseState): void {
	if (typeof value === "string") {
		state.strings += value.length;
		if (value.length > MAX_STRING || state.strings > MAX_STRINGS)
			throw new Error("limit");
		return;
	}
	if (value === null || typeof value === "boolean") return;
	if (typeof value === "number") {
		if (!Number.isFinite(value)) throw new Error("invalid");
		return;
	}
	if (typeof value !== "object") throw new Error("invalid");
	if (depth > MAX_DEPTH || ++state.count > MAX_VALUES) throw new Error("limit");
	if (state.active.has(value)) throw new Error("invalid");
	if (state.visited.has(value)) return;
	state.visited.add(value);
	state.active.add(value);
	try {
		if (Array.isArray(value)) {
			const keys = Reflect.ownKeys(value);
			if (
				keys.some(
					(key) =>
						typeof key !== "string" || (key !== "length" && !/^\d+$/.test(key)),
				)
			)
				throw new Error("invalid");
			const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
			if (
				!lengthDescriptor ||
				!("value" in lengthDescriptor) ||
				typeof lengthDescriptor.value !== "number"
			)
				throw new Error("invalid");
			for (let index = 0; index < lengthDescriptor.value; index += 1) {
				if (!Object.hasOwn(value, index)) throw new Error("invalid");
				const descriptor = Object.getOwnPropertyDescriptor(
					value,
					String(index),
				);
				if (!descriptor || !("value" in descriptor))
					throw new Error("accessor");
				scan(descriptor.value, depth + 1, state);
			}
		} else if (isRecord(value)) {
			for (const key of Reflect.ownKeys(value)) {
				if (typeof key !== "string") throw new Error("invalid");
				scan(read(value, key), depth + 1, state);
			}
		} else throw new Error("invalid");
	} finally {
		state.active.delete(value);
	}
}
function scanInput(value: unknown): ParseFailure | null {
	try {
		scan(value, 0, {
			active: new WeakSet(),
			visited: new WeakSet(),
			count: 0,
			strings: 0,
		});
		return null;
	} catch (error) {
		return error instanceof Error && error.message === "limit"
			? "input_limit_exceeded"
			: "input_invalid";
	}
}
function string(value: unknown): value is string {
	return (
		typeof value === "string" && value.length > 0 && value.trim() === value
	);
}
function exactDate(value: unknown): value is string {
	if (!string(value) || !DATE_PATTERN.test(value)) return false;
	const date = new Date(value);
	return !Number.isNaN(date.valueOf()) && date.toISOString() === value;
}
function hash(value: unknown): value is string {
	return typeof value === "string" && HASH_PATTERN.test(value);
}
function parseProvenance(value: unknown): ProposalProvenance | null {
	if (!isRecord(value) || !keysExactly(value, PROVENANCE_KEYS)) return null;
	const result = Object.fromEntries(
		PROVENANCE_KEYS.map((key) => [key, read(value, key)]),
	) as PlainRecord;
	if (
		!string(result.source) ||
		!exactDate(result.retrievedAt) ||
		!hash(result.contentSha256)
	)
		return null;
	for (const key of [
		"catalogVersion",
		"mappingVersion",
		"policySchemaVersion",
		"roleMapVersion",
		"foremanRevision",
		"piRuntimeVersion",
	])
		if (!string(result[key])) return null;
	if (result.approvalEvidenceState !== "static-conformance") return null;
	return result as unknown as ProposalProvenance;
}
function parseProposal(value: unknown): MappingProposalV1 | null {
	if (!isRecord(value) || !keysExactly(value, PROPOSAL_KEYS)) return null;
	const result = Object.fromEntries(
		PROPOSAL_KEYS.map((key) => [key, read(value, key)]),
	) as PlainRecord;
	if (result.schema !== "hro-mapping-proposal/v1") return null;
	for (const key of [
		"logicalCandidateId",
		"bindingId",
		"provider",
		"providerModelId",
		"protocol",
		"piHostModelId",
		"lane",
		"roleFamily",
	])
		if (!string(result[key])) return null;
	if (result.fallbackBindingId !== null && !string(result.fallbackBindingId))
		return null;
	const provenance = parseProvenance(result.provenance);
	if (!provenance) return null;
	return { ...result, provenance } as unknown as MappingProposalV1;
}
function parseProjection(value: unknown): HroBindingProjectionDraftV1 | null {
	if (!isRecord(value) || !keysExactly(value, PROJECTION_KEYS)) return null;
	const evidenceRef = read(value, "evidenceRef");
	const bindings = read(value, "bindings");
	if (
		!string(evidenceRef) ||
		!Array.isArray(bindings) ||
		bindings.length > MAX_BINDINGS
	)
		return null;
	const parsed: {
		proposal: MappingProposalV1;
		conformance: "allowed" | "disabled";
	}[] = [];
	for (const binding of bindings) {
		if (!isRecord(binding) || !keysExactly(binding, BINDING_KEYS)) return null;
		const proposal = parseProposal(read(binding, "proposal"));
		const conformance = read(binding, "conformance");
		if (!proposal || (conformance !== "allowed" && conformance !== "disabled"))
			return null;
		parsed.push({ proposal, conformance });
	}
	if (read(value, "schema") !== "hro-binding-projection-draft/v1") return null;
	return {
		schema: "hro-binding-projection-draft/v1",
		evidenceRef,
		bindings: parsed,
	};
}
function parseContext(value: unknown): MappingValidationContext | null {
	if (!isRecord(value) || !keysExactly(value, CONTEXT_KEYS)) return null;
	const evaluationTimeUtc = read(value, "evaluationTimeUtc");
	const maxEvidenceAgeMs = read(value, "maxEvidenceAgeMs");
	const expectedEvidenceRef = read(value, "expectedEvidenceRef");
	const expectedContentSha256 = read(value, "expectedContentSha256");
	if (
		!exactDate(evaluationTimeUtc) ||
		typeof maxEvidenceAgeMs !== "number" ||
		!Number.isInteger(maxEvidenceAgeMs) ||
		maxEvidenceAgeMs < 0 ||
		maxEvidenceAgeMs > 86400000 ||
		!string(expectedEvidenceRef) ||
		!hash(expectedContentSha256)
	)
		return null;
	return {
		evaluationTimeUtc,
		maxEvidenceAgeMs,
		expectedEvidenceRef,
		expectedContentSha256,
	};
}
function freeze<T>(value: T): T {
	if (value && typeof value === "object" && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const child of Object.values(value as Record<string, unknown>))
			freeze(child);
	}
	return value;
}
function tuple(proposal: MappingProposalV1): string {
	return [
		proposal.logicalCandidateId,
		proposal.provider,
		proposal.providerModelId,
		proposal.protocol,
		proposal.lane,
		proposal.roleFamily,
	].join("\u0000");
}
function ageIsStale(
	proposal: MappingProposalV1,
	context: MappingValidationContext,
): boolean {
	const age =
		Date.parse(context.evaluationTimeUtc) -
		Date.parse(proposal.provenance.retrievedAt);
	return age < 0 || age > context.maxEvidenceAgeMs;
}

export function validateMappingProposal(
	proposal: unknown,
	projection: unknown,
	context: unknown,
): MappingProposalResult {
	const failures = [
		scanInput(proposal),
		scanInput(projection),
		scanInput(context),
	];
	const failure = failures.find(Boolean);
	if (failure) return fail(failure);
	const parsedProposal = parseProposal(proposal);
	const parsedProjection = parseProjection(projection);
	const parsedContext = parseContext(context);
	if (!parsedProposal || !parsedProjection || !parsedContext)
		return fail("input_invalid");
	if (parsedProjection.evidenceRef !== parsedContext.expectedEvidenceRef)
		return fail("provenance_mismatch");
	const byId = new Map<
		string,
		{ proposal: MappingProposalV1; conformance: "allowed" | "disabled" }
	>();
	const tuples = new Set<string>();
	for (const binding of parsedProjection.bindings) {
		if (
			byId.has(binding.proposal.bindingId) ||
			tuples.has(tuple(binding.proposal))
		)
			return fail("duplicate_binding");
		byId.set(binding.proposal.bindingId, binding);
		tuples.add(tuple(binding.proposal));
		if (
			binding.proposal.provenance.contentSha256 !==
			parsedContext.expectedContentSha256
		)
			return fail("provenance_mismatch");
		if (ageIsStale(binding.proposal, parsedContext))
			return fail("provenance_stale");
	}
	for (const binding of parsedProjection.bindings) {
		const fallback = binding.proposal.fallbackBindingId;
		if (fallback !== null && !byId.has(fallback)) return fail("fallback_cycle");
		if (fallback !== null && byId.get(fallback)?.conformance === "disabled")
			return fail("lane_disabled");
		if (fallback === binding.proposal.bindingId) return fail("fallback_cycle");
	}
	for (const binding of parsedProjection.bindings) {
		const seen = new Set<string>();
		let current: string | null = binding.proposal.bindingId;
		while (current !== null) {
			if (seen.has(current)) return fail("fallback_cycle");
			seen.add(current);
			current = byId.get(current)?.proposal.fallbackBindingId ?? null;
		}
	}
	const selected = byId.get(parsedProposal.bindingId);
	if (!selected) return fail("mapping_missing");
	if (selected.conformance === "disabled") return fail("lane_disabled");
	const expected = selected.proposal;
	if (
		expected.provider !== parsedProposal.provider ||
		expected.providerModelId !== parsedProposal.providerModelId
	)
		return fail("provider_model_mismatch");
	if (expected.protocol !== parsedProposal.protocol)
		return fail("protocol_unsupported");
	for (const key of [
		"logicalCandidateId",
		"piHostModelId",
		"lane",
		"roleFamily",
	] as const)
		if (expected[key] !== parsedProposal[key]) return fail("mapping_mismatch");
	if (expected.fallbackBindingId !== parsedProposal.fallbackBindingId)
		return fail("fallback_undeclared");
	for (const key of PROVENANCE_KEYS)
		if (expected.provenance[key] !== parsedProposal.provenance[key])
			return fail("provenance_mismatch");
	return freeze({
		ok: true,
		evidenceOnly: true,
		proposal: structuredClone(parsedProposal),
	});
}
