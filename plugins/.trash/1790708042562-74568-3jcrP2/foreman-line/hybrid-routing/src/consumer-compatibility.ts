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
		own.every((key) => {
			if (typeof key !== "string" || !keys.includes(key)) return false;
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			return descriptor?.enumerable === true && "value" in descriptor;
		})
	);
}
function exactValues(
	value: RecordValue,
	keys: readonly string[],
): RecordValue | null {
	const own = Reflect.ownKeys(value);
	if (own.length !== keys.length) return null;
	const result = Object.create(null) as RecordValue;
	for (const key of own) {
		if (typeof key !== "string" || !keys.includes(key)) return null;
		const descriptor = Object.getOwnPropertyDescriptor(value, key);
		if (!descriptor?.enumerable || !("value" in descriptor)) return null;
		result[key] = descriptor.value;
	}
	return result;
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
	if (prior !== undefined) {
		charge(prior, depth, budget, new WeakSet<object>(), false);
		return prior;
	}
	budget.active.add(value);
	try {
		if (Array.isArray(value)) {
			const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
			const length =
				lengthDescriptor && "value" in lengthDescriptor
					? lengthDescriptor.value
					: undefined;
			if (
				typeof length !== "number" ||
				!Number.isSafeInteger(length) ||
				length > MAX_ARRAY
			)
				throw LIMIT;
			if (budget.values > MAX_VALUES - length) throw LIMIT;
			if (Object.getPrototypeOf(value) !== Array.prototype)
				throw new Error("invalid");
			const keys = Reflect.ownKeys(value);
			if (keys.length !== length + 1 || !keys.includes("length"))
				throw new Error("invalid");
			const descriptors = new Map<string, PropertyDescriptor>();
			for (let i = 0; i < length; i++) {
				if (!keys.includes(String(i))) throw new Error("invalid");
				const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
				if (!descriptor?.enumerable || !("value" in descriptor))
					throw new Error("invalid");
				descriptors.set(String(i), descriptor);
			}
			for (const key of keys)
				if (
					typeof key !== "string" ||
					(key !== "length" &&
						(String(Number(key)) !== key ||
							Number(key) < 0 ||
							Number(key) >= length))
				)
					throw new Error("invalid");
			for (const key of keys) {
				if (typeof key !== "string" || key.length > MAX_STRING) throw LIMIT;
				budget.strings += key.length;
				if (budget.strings > MAX_STRINGS) throw LIMIT;
			}
			const result: unknown[] = new Array(length);
			budget.seen.set(value, result);
			for (let i = 0; i < length; i++)
				result[i] = capture(
					descriptors.get(String(i))?.value,
					depth + 1,
					budget,
				);
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
		for (const key of keys as string[]) {
			if (key.length > MAX_STRING) throw LIMIT;
			budget.strings += key.length;
			if (budget.strings > MAX_STRINGS) throw LIMIT;
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			if (!descriptor?.enumerable || !("value" in descriptor))
				throw new Error("accessor");
			result[key] = capture(descriptor.value, depth + 1, budget);
		}
		return result;
	} finally {
		budget.active.delete(value);
	}
}
function charge(
	value: unknown,
	depth: number,
	budget: Budget,
	active: WeakSet<object>,
	countRoot = true,
): void {
	if (countRoot && ++budget.values > MAX_VALUES) throw LIMIT;
	if (typeof value === "string") {
		budget.strings += value.length;
		if (value.length > MAX_STRING || budget.strings > MAX_STRINGS) throw LIMIT;
		return;
	}
	if (value === null || typeof value === "boolean" || typeof value === "number")
		return;
	if (typeof value !== "object" || depth > 8 || active.has(value))
		throw new Error("invalid");
	active.add(value);
	try {
		if (Array.isArray(value)) {
			if (value.length > MAX_ARRAY || budget.values > MAX_VALUES - value.length)
				throw LIMIT;
			budget.strings += 6;
			for (let i = 0; i < value.length; i++) budget.strings += String(i).length;
			if (budget.strings > MAX_STRINGS) throw LIMIT;
			for (let i = 0; i < value.length; i++)
				charge(value[i], depth + 1, budget, active);
			return;
		}
		for (const [key, child] of Object.entries(value)) {
			if (key.length > MAX_STRING) throw LIMIT;
			budget.strings += key.length;
			if (budget.strings > MAX_STRINGS) throw LIMIT;
			charge(child, depth + 1, budget, active);
		}
	} finally {
		active.delete(value);
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
		if (!record(value)) return null;
		const captured = exactValues(value, [
			"eligibilityOracle",
			"evaluateOffline",
		]);
		if (!captured) return null;
		const oracle = captured.eligibilityOracle;
		const evaluator = captured.evaluateOffline;
		if (typeof oracle !== "function" || typeof evaluator !== "function")
			return null;
		return {
			eligibilityOracle: oracle as ConsumerDependencies["eligibilityOracle"],
			evaluateOffline: evaluator as ConsumerDependencies["evaluateOffline"],
		};
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
	return exact(value, ["ok", "level", "code"]) &&
		value.ok === false &&
		(value.level === "snapshot" ||
			value.level === "authority" ||
			value.level === "request") &&
		safeCode(value.code)
		? value.code
		: null;
}
function codes(value: unknown): value is string[] {
	return (
		Array.isArray(value) &&
		value.length >= 1 &&
		value.length <= 32 &&
		value.every((item) => safeCode(item)) &&
		new Set(value).size === value.length
	);
}
function rates(value: unknown): boolean {
	if (!record(value) || !exact(value, ["input", "output"])) return false;
	for (const side of [value.input, value.output]) {
		if (
			!record(side) ||
			!exact(side, ["value", "unit"]) ||
			typeof side.value !== "number" ||
			!Number.isFinite(side.value) ||
			side.value < 0 ||
			side.unit !== "USD per 1M tokens"
		)
			return false;
	}
	return true;
}
function thinking(value: unknown): boolean {
	if (!record(value)) return false;
	if (exact(value, ["status"]) && value.status === "unknown") return true;
	if (
		!exact(value, ["status", "levels"]) ||
		value.status !== "declared" ||
		!Array.isArray(value.levels) ||
		value.levels.length > 32
	)
		return false;
	const seen = new Set<string>();
	return value.levels.every((entry) => {
		if (
			!record(entry) ||
			!exact(entry, ["level", "providerValue"]) ||
			!string(entry.level) ||
			(entry.providerValue !== null && !string(entry.providerValue)) ||
			seen.has(entry.level)
		)
			return false;
		seen.add(entry.level);
		return true;
	});
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
			!exact(oracle, ["ok", "provenance", "results"]) ||
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
			!exact(result.requested, ["provider", "id"])
		)
			return fail("eligibility_invalid");
		if (
			result.requested.provider !== proposal.provider ||
			result.requested.id !== proposal.providerModelId
		)
			return fail("eligibility_mismatch");
		if (result.outcome === "refused")
			return exact(result, ["requested", "outcome", "codes"]) &&
				codes(result.codes)
				? fail("eligibility_refused", result.codes[0])
				: fail("eligibility_invalid");
		if (
			result.outcome !== "facts" ||
			!exact(result, ["requested", "outcome", "facts"]) ||
			!record(result.facts)
		)
			return fail("eligibility_invalid");
		const facts = result.facts;
		if (
			!exact(facts, [
				"provider",
				"id",
				"baseUrl",
				"api",
				"reasoning",
				"contextWindow",
				"maxTokens",
				"inputModalities",
				"rates",
				"thinkingLevels",
			])
		)
			return fail("eligibility_invalid");
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
			!rates(facts.rates) ||
			!thinking(facts.thinkingLevels)
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
		if (!record(evaluated)) return fail("evaluator_invalid");
		if (evaluated.ok === false)
			return exact(evaluated, ["ok", "code"]) && safeCode(evaluated.code)
				? fail("evaluator_refused", evaluated.code)
				: fail("evaluator_invalid");
		if (
			evaluated.ok !== true ||
			!exact(evaluated, ["ok", "result"]) ||
			!record(evaluated.result)
		)
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
