import type { RoutingInput, RoutingResult } from "../../dispatch/src/index.js";
import type {
	MappingProposalResult,
	MappingProposalV1,
} from "./mapping-proposal.js";
import { validateMappingProposal } from "./mapping-proposal.js";

export type ConsumerDependencies = Readonly<{
	eligibilityOracle: (
		request: Readonly<{
			evaluationTimeUtc: string;
			identities: readonly Readonly<{ provider: string; id: string }>[];
		}>,
	) => unknown;
	evaluateOffline: (input: Readonly<RoutingInput>) => unknown;
}>;

export type ConsumerRejectionCode =
	| "input_invalid"
	| "input_limit_exceeded"
	| "adapter_invalid"
	| "mapping_refused"
	| "eligibility_refused"
	| "eligibility_invalid"
	| "eligibility_mismatch"
	| "eligibility_stale"
	| "evaluator_refused"
	| "evaluator_invalid"
	| "route_mismatch";

export type ConsumerCompatibilityResult =
	| Readonly<{
			ok: true;
			evidenceOnly: true;
			proposal: MappingProposalV1;
			routing: RoutingResult;
	  }>
	| Readonly<{
			ok: false;
			evidenceOnly: true;
			code: ConsumerRejectionCode;
			upstreamCode?: string;
	  }>;

type RecordValue = Record<string, unknown>;
type Budget = {
	active: WeakSet<object>;
	seen: WeakMap<object, unknown>;
	values: number;
	strings: number;
};
const MAX_STRING = 2048;
const MAX_STRINGS = 262144;
const MAX_VALUES = 8192;
const MAX_ARRAY = 256;
const DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const HASH = /^[0-9a-f]{64}$/;
const LIMIT = Symbol("capture-limit");
const ROUTING_CLASSES = new Set([
	"boilerplate",
	"standard-feature",
	"architecture/risk",
	"implementation/standard",
]);
const DATA_CLASSES = new Set(["public", "internal", "restricted"]);

function fail(
	code: ConsumerRejectionCode,
	upstreamCode?: string,
): ConsumerCompatibilityResult {
	return upstreamCode === undefined
		? { ok: false, evidenceOnly: true, code }
		: { ok: false, evidenceOnly: true, code, upstreamCode };
}
function record(value: unknown): value is RecordValue {
	if (value === null || typeof value !== "object" || Array.isArray(value))
		return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}
function exact(value: RecordValue, keys: readonly string[]): boolean {
	const own = Reflect.ownKeys(value);
	return (
		own.length === keys.length &&
		own.every((key) => typeof key === "string" && keys.includes(key))
	);
}
function data(value: object, key: string): unknown {
	const descriptor = Object.getOwnPropertyDescriptor(value, key);
	if (!descriptor || !("value" in descriptor)) throw new Error("accessor");
	return descriptor.value;
}
function capture(value: unknown, depth: number, budget: Budget): unknown {
	if (++budget.values > MAX_VALUES) throw LIMIT;
	if (typeof value === "string") {
		budget.strings += value.length;
		if (value.length > MAX_STRING || budget.strings > MAX_STRINGS) throw LIMIT;
		return value;
	}
	if (
		value === null ||
		typeof value === "boolean" ||
		typeof value === "number"
	) {
		if (typeof value === "number" && !Number.isFinite(value))
			throw new Error("invalid");
		return value;
	}
	if (typeof value !== "object" || depth > 8 || budget.active.has(value))
		throw new Error("invalid");
	const prior = budget.seen.get(value);
	if (prior !== undefined) return prior;
	budget.active.add(value);
	try {
		if (Array.isArray(value)) {
			const length = data(value, "length");
			if (
				typeof length !== "number" ||
				!Number.isSafeInteger(length) ||
				length > MAX_ARRAY
			)
				throw LIMIT;
			if (Object.getPrototypeOf(value) !== Array.prototype)
				throw new Error("invalid");
			const keys = Reflect.ownKeys(value);
			if (keys.length !== length + 1 || !keys.includes("length"))
				throw new Error("invalid");
			for (let i = 0; i < length; i++)
				if (!keys.includes(String(i))) throw new Error("invalid");
			for (const key of keys)
				if (
					typeof key !== "string" ||
					(key !== "length" &&
						(String(Number(key)) !== key ||
							Number(key) < 0 ||
							Number(key) >= length))
				)
					throw new Error("invalid");
			if (budget.values > MAX_VALUES - length) throw LIMIT;
			const result: unknown[] = new Array(length);
			budget.seen.set(value, result);
			for (let i = 0; i < length; i++)
				result[i] = capture(data(value, String(i)), depth + 1, budget);
			return result;
		}
		if (!record(value)) throw new Error("invalid");
		const keys = Reflect.ownKeys(value);
		if (
			budget.values > MAX_VALUES - keys.length ||
			keys.some((key) => typeof key !== "string")
		)
			throw LIMIT;
		const result = Object.create(null) as RecordValue;
		budget.seen.set(value, result);
		for (const key of keys as string[])
			result[key] = capture(data(value, key), depth + 1, budget);
		return result;
	} finally {
		budget.active.delete(value);
	}
}
function owned(value: unknown): unknown {
	return capture(value, 0, {
		active: new WeakSet(),
		seen: new WeakMap(),
		values: 0,
		strings: 0,
	});
}
function string(value: unknown): value is string {
	return (
		typeof value === "string" &&
		value.length > 0 &&
		value.length <= MAX_STRING &&
		value.trim() === value
	);
}
function date(value: unknown): value is string {
	if (!string(value) || !DATE.test(value)) return false;
	const d = new Date(value);
	return !Number.isNaN(d.valueOf()) && d.toISOString() === value;
}
function hash(value: unknown): value is string {
	return typeof value === "string" && HASH.test(value);
}
function safeCode(value: unknown): value is string {
	return string(value) && value.length <= 2048;
}

function dependencies(value: unknown): ConsumerDependencies | null {
	try {
		if (
			!record(value) ||
			!exact(value, ["eligibilityOracle", "evaluateOffline"])
		)
			return null;
		const oracle = data(value, "eligibilityOracle");
		const evaluator = data(value, "evaluateOffline");
		return typeof oracle === "function" && typeof evaluator === "function"
			? {
					eligibilityOracle:
						oracle as ConsumerDependencies["eligibilityOracle"],
					evaluateOffline: evaluator as ConsumerDependencies["evaluateOffline"],
				}
			: null;
	} catch {
		return null;
	}
}
function routing(value: unknown): RoutingInput | null {
	if (
		!record(value) ||
		!exact(value, ["routing_class", "data_classification", "workflowId"])
	)
		return null;
	return string(value.routing_class) &&
		ROUTING_CLASSES.has(value.routing_class) &&
		string(value.data_classification) &&
		DATA_CLASSES.has(value.data_classification) &&
		string(value.workflowId)
		? (value as unknown as RoutingInput)
		: null;
}
function expected(value: unknown): {
	digestSha256: string;
	sourceRef: string;
	approvedConfigRef: string;
	maxAgeMs: number;
} | null {
	if (
		!record(value) ||
		!exact(value, [
			"digestSha256",
			"sourceRef",
			"approvedConfigRef",
			"maxAgeMs",
		])
	)
		return null;
	return hash(value.digestSha256) &&
		string(value.sourceRef) &&
		string(value.approvedConfigRef) &&
		typeof value.maxAgeMs === "number" &&
		Number.isInteger(value.maxAgeMs) &&
		value.maxAgeMs >= 0 &&
		value.maxAgeMs <= 86400000
		? (value as never)
		: null;
}
function refusal(value: RecordValue): string | null {
	return value.ok === false &&
		(value.level === "snapshot" ||
			value.level === "authority" ||
			value.level === "request") &&
		safeCode(value.code)
		? value.code
		: null;
}
function frozen<T>(value: T): T {
	if (value && typeof value === "object" && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const child of Object.values(value as RecordValue)) frozen(child);
	}
	return value;
}

export function validateConsumerCompatibility(
	request: unknown,
	deps: ConsumerDependencies,
): ConsumerCompatibilityResult {
	let input: RecordValue;
	try {
		input = owned(request) as RecordValue;
	} catch (error) {
		return error === LIMIT
			? fail("input_limit_exceeded")
			: fail("input_invalid");
	}
	try {
		const adapters = dependencies(deps);
		if (!adapters) return fail("adapter_invalid");
		if (
			!record(input) ||
			!exact(input, [
				"proposal",
				"projection",
				"context",
				"routingInput",
				"expectedEligibility",
			])
		)
			return fail("input_invalid");
		const route = routing(input.routingInput);
		const pins = expected(input.expectedEligibility);
		if (!route || !pins) return fail("input_invalid");
		const mapping: MappingProposalResult = validateMappingProposal(
			input.proposal,
			input.projection,
			input.context,
		);
		if (!mapping.ok) return fail("mapping_refused", mapping.code);
		const proposal = mapping.proposal;
		const evaluationTimeUtc = (input.context as RecordValue).evaluationTimeUtc;
		if (!date(evaluationTimeUtc)) return fail("input_invalid");
		const oracleRequest = frozen({
			evaluationTimeUtc,
			identities: [
				frozen({ provider: proposal.provider, id: proposal.providerModelId }),
			],
		});
		let rawOracle: unknown;
		try {
			rawOracle = adapters.eligibilityOracle(oracleRequest);
		} catch {
			return fail("eligibility_invalid");
		}
		let oracle: RecordValue;
		try {
			oracle = owned(rawOracle) as RecordValue;
		} catch {
			return fail("eligibility_invalid");
		}
		if (!record(oracle)) return fail("eligibility_invalid");
		const code = refusal(oracle);
		if (code !== null) return fail("eligibility_refused", code);
		if (
			oracle.ok !== true ||
			!record(oracle.provenance) ||
			!Array.isArray(oracle.results)
		)
			return fail("eligibility_invalid");
		const provenance = oracle.provenance;
		const pkeys = [
			"digestSha256",
			"sourceRef",
			"sourceTimeUtc",
			"evaluationTimeUtc",
			"ageMs",
			"maxAgeMs",
			"approvedConfigRef",
		];
		if (
			!exact(provenance, pkeys) ||
			!hash(provenance.digestSha256) ||
			!string(provenance.sourceRef) ||
			!date(provenance.sourceTimeUtc) ||
			!date(provenance.evaluationTimeUtc) ||
			typeof provenance.ageMs !== "number" ||
			!Number.isInteger(provenance.ageMs) ||
			typeof provenance.maxAgeMs !== "number" ||
			!Number.isInteger(provenance.maxAgeMs) ||
			!string(provenance.approvedConfigRef) ||
			oracle.results.length !== 1
		)
			return fail("eligibility_invalid");
		if (
			provenance.digestSha256 !== pins.digestSha256 ||
			provenance.sourceRef !== pins.sourceRef ||
			provenance.approvedConfigRef !== pins.approvedConfigRef
		)
			return fail("eligibility_mismatch");
		const age =
			Date.parse(provenance.evaluationTimeUtc) -
			Date.parse(provenance.sourceTimeUtc);
		if (
			provenance.evaluationTimeUtc !==
				(input.context as RecordValue).evaluationTimeUtc ||
			provenance.ageMs !== age ||
			provenance.maxAgeMs !== pins.maxAgeMs ||
			age < 0 ||
			age > pins.maxAgeMs
		)
			return fail("eligibility_stale");
		const result = oracle.results[0];
		if (
			!record(result) ||
			!record(result.requested) ||
			result.requested.provider !== proposal.provider ||
			result.requested.id !== proposal.providerModelId
		)
			return fail("eligibility_mismatch");
		if (result.outcome === "refused")
			return fail(
				"eligibility_refused",
				Array.isArray(result.codes) && safeCode(result.codes[0])
					? result.codes[0]
					: undefined,
			);
		if (result.outcome !== "facts" || !record(result.facts))
			return fail("eligibility_invalid");
		const facts = result.facts;
		if (
			facts.provider !== proposal.provider ||
			facts.id !== proposal.providerModelId ||
			facts.api !== proposal.protocol
		)
			return fail("eligibility_mismatch");
		if (
			!string(facts.baseUrl) ||
			typeof facts.reasoning !== "boolean" ||
			typeof facts.contextWindow !== "number" ||
			!Number.isSafeInteger(facts.contextWindow) ||
			facts.contextWindow <= 0 ||
			typeof facts.maxTokens !== "number" ||
			!Number.isSafeInteger(facts.maxTokens) ||
			facts.maxTokens <= 0 ||
			!Array.isArray(facts.inputModalities) ||
			facts.inputModalities.length === 0 ||
			new Set(facts.inputModalities).size !== facts.inputModalities.length ||
			facts.inputModalities.some((x) => x !== "text" && x !== "image") ||
			!record(facts.rates) ||
			!record(facts.thinkingLevels)
		)
			return fail("eligibility_invalid");
		const levels = facts.thinkingLevels;
		if (levels.status !== "unknown" && levels.status !== "declared")
			return fail("eligibility_invalid");
		if (
			levels.status === "declared" &&
			(!Array.isArray(levels.levels) || levels.levels.length > 32)
		)
			return fail("eligibility_invalid");
		let rawEval: unknown;
		try {
			rawEval = adapters.evaluateOffline(frozen({ ...route }));
		} catch {
			return fail("evaluator_refused");
		}
		let evaluated: RecordValue;
		try {
			evaluated = owned(rawEval) as RecordValue;
		} catch {
			return fail("evaluator_invalid");
		}
		if (evaluated.ok === false && safeCode(evaluated.code))
			return fail("evaluator_refused", evaluated.code);
		if (evaluated.ok !== true || !record(evaluated.result))
			return fail("evaluator_invalid");
		const routingResult = evaluated.result;
		if (
			!exact(routingResult, [
				"resolvedModelId",
				"resolvedTier",
				"transportRequirements",
				"routingDecisionRef",
			]) ||
			!string(routingResult.resolvedModelId) ||
			!string(routingResult.resolvedTier) ||
			!string(routingResult.routingDecisionRef) ||
			!record(routingResult.transportRequirements) ||
			!exact(routingResult.transportRequirements, ["data_collection", "zdr"]) ||
			(routingResult.transportRequirements.data_collection !== "allow" &&
				routingResult.transportRequirements.data_collection !== "deny") ||
			typeof routingResult.transportRequirements.zdr !== "boolean" ||
			(route.data_classification !== "public" &&
				(routingResult.transportRequirements.data_collection !== "deny" ||
					routingResult.transportRequirements.zdr !== true))
		)
			return fail("evaluator_invalid");
		if (routingResult.resolvedModelId !== proposal.logicalCandidateId)
			return fail("route_mismatch");
		return frozen({
			ok: true,
			evidenceOnly: true,
			proposal,
			routing: routingResult as unknown as RoutingResult,
		});
	} catch {
		return fail("input_invalid");
	}
}
