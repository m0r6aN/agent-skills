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
type Failure = "input_invalid" | "input_limit_exceeded";
type Budget = { active: WeakSet<object>; values: number; strings: number };

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

function isPlainRecord(value: unknown): value is PlainRecord {
	if (value === null || typeof value !== "object" || Array.isArray(value))
		return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

function hasExactly(value: PlainRecord, expected: readonly string[]): boolean {
	const keys = Reflect.ownKeys(value);
	return (
		keys.length === expected.length &&
		keys.every((key) => typeof key === "string" && expected.includes(key))
	);
}

function valueDescriptor(value: object, key: string): PropertyDescriptor {
	const descriptor = Object.getOwnPropertyDescriptor(value, key);
	if (!descriptor || !("value" in descriptor)) throw new Error("accessor");
	return descriptor;
}

function ownSnapshot(value: unknown, depth: number, budget: Budget): unknown {
	if (++budget.values > MAX_VALUES) throw new Error("limit");
	if (typeof value === "string") {
		budget.strings += value.length;
		if (value.length > MAX_STRING || budget.strings > MAX_STRINGS)
			throw new Error("limit");
		return value;
	}
	if (value === null || typeof value === "boolean") return value;
	if (typeof value === "number") {
		if (!Number.isFinite(value)) throw new Error("invalid");
		return value;
	}
	if (typeof value !== "object") throw new Error("invalid");
	if (depth > MAX_DEPTH || budget.active.has(value)) throw new Error("invalid");
	budget.active.add(value);
	try {
		if (Array.isArray(value)) {
			const length = valueDescriptor(value, "length").value;
			if (
				typeof length !== "number" ||
				!Number.isSafeInteger(length) ||
				length < 0 ||
				length > MAX_BINDINGS
			)
				throw new Error("limit");
			if (budget.values > MAX_VALUES - length) throw new Error("limit");
			if (Object.getPrototypeOf(value) !== Array.prototype)
				throw new Error("invalid");
			const keys = Reflect.ownKeys(value);
			if (keys.length !== length + 1 || !keys.includes("length"))
				throw new Error("invalid");
			for (let index = 0; index < length; index += 1) {
				const key = String(index);
				if (!keys.includes(key)) throw new Error("invalid");
			}
			for (const key of keys) {
				if (typeof key !== "string" || key === "length") continue;
				const index = Number(key);
				if (
					!Number.isSafeInteger(index) ||
					index < 0 ||
					index >= length ||
					String(index) !== key
				)
					throw new Error("invalid");
			}
			const result: unknown[] = new Array(length);
			for (let index = 0; index < length; index += 1) {
				if (budget.values >= MAX_VALUES) throw new Error("limit");
				result[index] = ownSnapshot(
					valueDescriptor(value, String(index)).value,
					depth + 1,
					budget,
				);
			}
			return result;
		}
		if (!isPlainRecord(value)) throw new Error("invalid");
		const keys = Reflect.ownKeys(value);
		if (budget.values > MAX_VALUES - keys.length) throw new Error("limit");
		const result = Object.create(null) as PlainRecord;
		for (const key of keys) {
			if (typeof key !== "string") throw new Error("invalid");
			if (budget.values >= MAX_VALUES) throw new Error("limit");
			result[key] = ownSnapshot(
				valueDescriptor(value, key).value,
				depth + 1,
				budget,
			);
		}
		return result;
	} finally {
		budget.active.delete(value);
	}
}

function snapshotInputs(
	proposal: unknown,
	projection: unknown,
	context: unknown,
): [unknown, unknown, unknown] | Failure {
	try {
		const budget: Budget = { active: new WeakSet(), values: 0, strings: 0 };
		return [
			ownSnapshot(proposal, 0, budget),
			ownSnapshot(projection, 0, budget),
			ownSnapshot(context, 0, budget),
		];
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
	if (!isPlainRecord(value) || !hasExactly(value, PROVENANCE_KEYS)) return null;
	if (
		!string(value.source) ||
		!exactDate(value.retrievedAt) ||
		!hash(value.contentSha256)
	)
		return null;
	for (const key of [
		"catalogVersion",
		"mappingVersion",
		"policySchemaVersion",
		"roleMapVersion",
		"foremanRevision",
		"piRuntimeVersion",
	] as const)
		if (!string(value[key])) return null;
	if (value.approvalEvidenceState !== "static-conformance") return null;
	return value as ProposalProvenance;
}

function parseProposal(value: unknown): MappingProposalV1 | null {
	if (!isPlainRecord(value) || !hasExactly(value, PROPOSAL_KEYS)) return null;
	if (value.schema !== "hro-mapping-proposal/v1") return null;
	for (const key of [
		"logicalCandidateId",
		"bindingId",
		"provider",
		"providerModelId",
		"protocol",
		"piHostModelId",
		"lane",
		"roleFamily",
	] as const)
		if (!string(value[key])) return null;
	if (value.fallbackBindingId !== null && !string(value.fallbackBindingId))
		return null;
	const provenance = parseProvenance(value.provenance);
	return provenance ? ({ ...value, provenance } as MappingProposalV1) : null;
}

function parseProjection(value: unknown): HroBindingProjectionDraftV1 | null {
	if (
		!isPlainRecord(value) ||
		!hasExactly(value, PROJECTION_KEYS) ||
		value.schema !== "hro-binding-projection-draft/v1"
	)
		return null;
	if (
		!string(value.evidenceRef) ||
		!Array.isArray(value.bindings) ||
		value.bindings.length > MAX_BINDINGS
	)
		return null;
	const bindings: {
		proposal: MappingProposalV1;
		conformance: "allowed" | "disabled";
	}[] = [];
	for (let index = 0; index < value.bindings.length; index += 1) {
		const binding = value.bindings[index];
		if (!isPlainRecord(binding) || !hasExactly(binding, BINDING_KEYS))
			return null;
		const proposal = parseProposal(binding.proposal);
		if (
			!proposal ||
			(binding.conformance !== "allowed" && binding.conformance !== "disabled")
		)
			return null;
		bindings.push({ proposal, conformance: binding.conformance });
	}
	return {
		schema: "hro-binding-projection-draft/v1",
		evidenceRef: value.evidenceRef,
		bindings,
	};
}

function parseContext(value: unknown): MappingValidationContext | null {
	if (!isPlainRecord(value) || !hasExactly(value, CONTEXT_KEYS)) return null;
	if (
		!exactDate(value.evaluationTimeUtc) ||
		typeof value.maxEvidenceAgeMs !== "number" ||
		!Number.isInteger(value.maxEvidenceAgeMs) ||
		value.maxEvidenceAgeMs < 0 ||
		value.maxEvidenceAgeMs > 86400000 ||
		!string(value.expectedEvidenceRef) ||
		!hash(value.expectedContentSha256)
	)
		return null;
	return value as MappingValidationContext;
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
	return JSON.stringify([
		proposal.logicalCandidateId,
		proposal.provider,
		proposal.providerModelId,
		proposal.protocol,
		proposal.lane,
		proposal.roleFamily,
	]);
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
	try {
		const snapshot = snapshotInputs(proposal, projection, context);
		if (typeof snapshot === "string") return fail(snapshot);
		const [ownedProposal, ownedProjection, ownedContext] = snapshot;
		const parsedProposal = parseProposal(ownedProposal);
		const parsedProjection = parseProjection(ownedProjection);
		const parsedContext = parseContext(ownedContext);
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
			if (fallback !== null && !byId.has(fallback))
				return fail("fallback_cycle");
			if (fallback !== null && byId.get(fallback)?.conformance === "disabled")
				return fail("lane_disabled");
			if (fallback === binding.proposal.bindingId)
				return fail("fallback_cycle");
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
			if (expected[key] !== parsedProposal[key])
				return fail("mapping_mismatch");
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
	} catch {
		return fail("input_invalid");
	}
}
