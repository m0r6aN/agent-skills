import {
	type CatalogEligibilityResult,
	evaluateCatalogEligibility,
	type ProviderBindingProjectionResult,
	projectProviderBindingsV1,
} from "../../routing-policy/src/index.js";

export type PmcOwnerContextAssemblyResultV1 =
	| Readonly<{ ok: true; evidenceOnly: true; context: unknown }>
	| Readonly<{
			ok: false;
			evidenceOnly: true;
			stage: "bridge";
			code:
				| "INPUT_REFUSED"
				| "BOUNDS_REFUSED"
				| "TIME_BINDING_REFUSED"
				| "IDENTITY_BINDING_REFUSED";
	  }>
	| Readonly<{
			ok: false;
			evidenceOnly: true;
			stage: "projection";
			result: Extract<ProviderBindingProjectionResult, { ok: false }>;
	  }>
	| Readonly<{
			ok: false;
			evidenceOnly: true;
			stage: "catalog";
			result: CatalogEligibilityResult;
	  }>;

type BridgeCode = Extract<
	PmcOwnerContextAssemblyResultV1,
	{ ok: false; stage: "bridge" }
>["code"];

const ENVELOPE_KEYS = [
	"policy",
	"catalogInput",
	"catalogSource",
	"ownerContext",
] as const;
const OWNER_CONTEXT_KEYS = [
	"policyDigest",
	"configDigest",
	"evaluationTimeUtc",
	"evidenceMode",
	"episode",
	"freshness",
	"independence",
	"budget",
	"bindings",
] as const;
const NODE_LIMIT = 131072;
const STRING_LIMIT = 4096;
const TOTAL_STRING_LIMIT = 2097152;
const ARRAY_LIMIT = 256;
const BYTE_LIMIT = 8 * 1024 * 1024;

const byteTagGetter = Object.getOwnPropertyDescriptor(
	Object.getPrototypeOf(Uint8Array.prototype),
	Symbol.toStringTag,
)?.get;
const byteLengthGetter = Object.getOwnPropertyDescriptor(
	Object.getPrototypeOf(Uint8Array.prototype),
	"byteLength",
)?.get;
const byteBufferGetter = Object.getOwnPropertyDescriptor(
	Object.getPrototypeOf(Uint8Array.prototype),
	"buffer",
)?.get;
const bufferLengthGetter = Object.getOwnPropertyDescriptor(
	ArrayBuffer.prototype,
	"byteLength",
)?.get;
const resizableGetter = Object.getOwnPropertyDescriptor(
	ArrayBuffer.prototype,
	"resizable",
)?.get;
const byteArray = Uint8Array;
const isView = ArrayBuffer.isView;

class CaptureFailure extends Error {
	readonly code: BridgeCode;

	constructor(code: BridgeCode) {
		super(code);
		this.code = code;
	}
}

function fail(code: BridgeCode): never {
	throw new CaptureFailure(code);
}

function reserve(
	state: CaptureState,
	amount: number,
	code: BridgeCode = "BOUNDS_REFUSED",
): void {
	if (!Number.isSafeInteger(amount) || amount < 0 || amount > state.remaining)
		fail(code);
	state.remaining -= amount;
}

function chargeString(state: CaptureState, value: string): void {
	if (value.length > STRING_LIMIT) fail("BOUNDS_REFUSED");
	state.stringUnits += value.length;
	if (state.stringUnits > TOTAL_STRING_LIMIT) fail("BOUNDS_REFUSED");
}

type OwnedObject = Record<string, unknown>;
type OwnedValue = OwnedObject | unknown[];

interface CaptureState {
	remaining: number;
	stringUnits: number;
	active: Set<object>;
	captured: Map<object, OwnedValue>;
	bytes: Set<object>;
	byteContaining: Set<object>;
	bytePaths: Map<object, readonly string[]>;
}

function copyBytes(value: object): Uint8Array {
	try {
		if (!isView(value) || byteTagGetter?.call(value) !== "Uint8Array")
			fail("INPUT_REFUSED");
		const length = byteLengthGetter?.call(value);
		if (typeof length !== "number" || length > BYTE_LIMIT)
			fail("BOUNDS_REFUSED");
		const buffer = byteBufferGetter?.call(value);
		bufferLengthGetter?.call(buffer);
		if (resizableGetter?.call(buffer)) fail("INPUT_REFUSED");
		return new byteArray(value as Uint8Array);
	} catch (error) {
		if (error instanceof CaptureFailure) throw error;
		fail("INPUT_REFUSED");
	}
}

function chargeCaptured(
	value: unknown,
	state: CaptureState,
	depth: number,
	precharged = false,
): void {
	if (depth > 20) fail("BOUNDS_REFUSED");
	if (!precharged) reserve(state, 1);
	if (typeof value === "string") {
		chargeString(state, value);
		return;
	}
	if (value === null || typeof value === "boolean" || typeof value === "number")
		return;
	if (typeof value !== "object") fail("INPUT_REFUSED");
	if (Array.isArray(value)) {
		const keys = Reflect.ownKeys(value);
		reserve(state, keys.length);
		reserve(state, value.length);
		for (const key of keys) {
			if (key === "length") {
				chargeString(state, key);
				continue;
			}
			if (typeof key !== "string") fail("INPUT_REFUSED");
			chargeString(state, key);
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			if (!descriptor || !("value" in descriptor)) fail("INPUT_REFUSED");
			chargeCaptured(descriptor.value, state, depth + 1, true);
		}
		return;
	}
	const keys = Reflect.ownKeys(value);
	reserve(state, keys.length);
	for (const key of keys) {
		if (typeof key !== "string") fail("INPUT_REFUSED");
		chargeString(state, key);
		const descriptor = Object.getOwnPropertyDescriptor(value, key);
		if (!descriptor || !("value" in descriptor)) fail("INPUT_REFUSED");
		chargeCaptured(descriptor.value, state, depth + 1);
	}
}

function copy(
	value: unknown,
	state: CaptureState,
	depth: number,
	path: readonly string[],
	precharged = false,
): unknown {
	if (depth > 20) fail("BOUNDS_REFUSED");
	if (!precharged) reserve(state, 1);
	if (typeof value === "string") {
		chargeString(state, value);
		return value;
	}
	if (value === null || typeof value === "boolean") return value;
	if (typeof value === "number") {
		if (!Number.isFinite(value)) fail("INPUT_REFUSED");
		return value;
	}
	if (
		value === undefined ||
		typeof value === "function" ||
		typeof value !== "object"
	)
		fail("INPUT_REFUSED");
	if (isView(value)) {
		if (
			path.join(".") !== "catalogInput.canonicalBytes" ||
			state.bytes.has(value)
		)
			fail("INPUT_REFUSED");
		state.bytes.add(value);
		return copyBytes(value);
	}
	if (state.active.has(value)) fail("INPUT_REFUSED");
	const prior = state.captured.get(value);
	if (prior) {
		if (state.byteContaining.has(value)) {
			const originalPath = state.bytePaths.get(value);
			if (
				!originalPath ||
				originalPath.length !== path.length ||
				originalPath.some((segment, index) => segment !== path[index])
			)
				fail("INPUT_REFUSED");
		}
		chargeCaptured(prior, state, depth, precharged);
		return prior;
	}
	state.active.add(value);
	try {
		const array = Array.isArray(value);
		const prototype = Object.getPrototypeOf(value);
		if (
			array
				? prototype !== Array.prototype
				: prototype !== Object.prototype && prototype !== null
		)
			fail("INPUT_REFUSED");
		let length = 0;
		let containsBytes = false;
		if (array) {
			const descriptor = Object.getOwnPropertyDescriptor(value, "length");
			if (
				!descriptor ||
				!("value" in descriptor) ||
				!Number.isSafeInteger(descriptor.value) ||
				descriptor.value < 0
			)
				fail("INPUT_REFUSED");
			length = descriptor.value;
			if (length > ARRAY_LIMIT) fail("BOUNDS_REFUSED");
			reserve(state, length);
		}
		const keys = Reflect.ownKeys(value);
		if (array && keys.length !== length + 1) fail("INPUT_REFUSED");
		if (!array) reserve(state, keys.length);
		else reserve(state, keys.length);
		const output: OwnedValue = array ? [] : Object.create(null);
		for (const key of keys) {
			if (array && key === "length") {
				chargeString(state, key);
				continue;
			}
			if (typeof key !== "string") fail("INPUT_REFUSED");
			chargeString(state, key);
			if (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length))
				fail("INPUT_REFUSED");
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			if (!descriptor || !("value" in descriptor) || !descriptor.enumerable)
				fail("INPUT_REFUSED");
			const child = copy(
				descriptor.value,
				state,
				depth + 1,
				[...path, key],
				array,
			);
			if (
				state.bytes.has(descriptor.value) ||
				state.byteContaining.has(descriptor.value)
			)
				containsBytes = true;
			Object.defineProperty(output, key, {
				value: child,
				enumerable: true,
				writable: true,
				configurable: true,
			});
		}
		state.captured.set(value, output);
		if (containsBytes) {
			state.byteContaining.add(value);
			state.bytePaths.set(value, path);
		}
		return output;
	} catch (error) {
		if (error instanceof CaptureFailure) throw error;
		fail("INPUT_REFUSED");
	} finally {
		state.active.delete(value);
	}
}

function capture(input: unknown): unknown {
	return copy(
		input,
		{
			remaining: NODE_LIMIT,
			stringUnits: 0,
			active: new Set(),
			captured: new Map(),
			bytes: new Set(),
			byteContaining: new Set(),
			bytePaths: new Map(),
		},
		0,
		[],
		false,
	);
}

function closedRecord(
	value: unknown,
	keys: readonly string[],
): value is OwnedObject {
	return (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value) &&
		Object.keys(value).length === keys.length &&
		keys.every((key) => Object.hasOwn(value, key))
	);
}

function freeze<T>(value: T): T {
	if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
		if (ArrayBuffer.isView(value)) return value;
		for (const child of Object.values(value)) freeze(child);
		Object.freeze(value);
	}
	return value;
}

function bridgeFailure(code: BridgeCode): PmcOwnerContextAssemblyResultV1 {
	return Object.freeze({
		ok: false,
		evidenceOnly: true,
		stage: "bridge",
		code,
	});
}

function projectionFailure(
	result: Extract<ProviderBindingProjectionResult, { ok: false }>,
): PmcOwnerContextAssemblyResultV1 {
	return Object.freeze({
		ok: false,
		evidenceOnly: true,
		stage: "projection",
		result,
	});
}

function catalogFailure(
	result: CatalogEligibilityResult,
): PmcOwnerContextAssemblyResultV1 {
	return Object.freeze({
		ok: false,
		evidenceOnly: true,
		stage: "catalog",
		result,
	});
}

export function preparePmcOwnerContextV1(
	input: unknown,
): PmcOwnerContextAssemblyResultV1 {
	let owned: unknown;
	try {
		owned = capture(input);
	} catch (error) {
		return bridgeFailure(
			error instanceof CaptureFailure ? error.code : "INPUT_REFUSED",
		);
	}
	if (!closedRecord(owned, ENVELOPE_KEYS))
		return bridgeFailure("INPUT_REFUSED");
	const ownerContext = owned.ownerContext;
	if (!closedRecord(ownerContext, OWNER_CONTEXT_KEYS))
		return bridgeFailure("INPUT_REFUSED");
	const catalogInput = owned.catalogInput;
	const catalogTime =
		typeof catalogInput === "object" && catalogInput !== null
			? (catalogInput as Record<string, unknown>).evaluationTimeUtc
			: undefined;
	if (ownerContext.evaluationTimeUtc !== catalogTime)
		return bridgeFailure("TIME_BINDING_REFUSED");

	let projection: ProviderBindingProjectionResult;
	try {
		projection = projectProviderBindingsV1(owned.policy);
	} catch {
		return bridgeFailure("INPUT_REFUSED");
	}
	if (!projection.ok) return projectionFailure(projection);

	let catalog: CatalogEligibilityResult;
	try {
		catalog = evaluateCatalogEligibility(catalogInput);
	} catch {
		return bridgeFailure("INPUT_REFUSED");
	}
	if (catalog.stage !== "projector") return catalogFailure(catalog);
	if (!catalog.result.ok) return catalogFailure(catalog);

	const bindings = projection.projection.policy.bindings;
	const seen = new Set<string>();
	const results: Array<Record<string, unknown>> = [];
	for (const row of catalog.result.results) {
		if (
			typeof row.requested.provider !== "string" ||
			typeof row.requested.id !== "string"
		)
			return bridgeFailure("IDENTITY_BINDING_REFUSED");
		const binding = bindings.find(
			(candidate) =>
				candidate.provider === row.requested.provider &&
				candidate.providerModelId === row.requested.id,
		);
		const identityKey = JSON.stringify([
			row.requested.provider,
			row.requested.id,
		]);
		if (!binding || seen.has(identityKey))
			return bridgeFailure("IDENTITY_BINDING_REFUSED");
		seen.add(identityKey);
		if (row.outcome === "facts") {
			results.push({
				provider: binding.provider,
				providerModelId: binding.providerModelId,
				outcome: "facts",
				facts: row.facts,
			});
		} else {
			results.push({
				provider: binding.provider,
				providerModelId: binding.providerModelId,
				outcome: "refused",
				codes: row.codes,
			});
		}
	}

	const context = {
		projection: projection.projection,
		policyDigest: ownerContext.policyDigest,
		configDigest: ownerContext.configDigest,
		evaluationTimeUtc: ownerContext.evaluationTimeUtc,
		evidenceMode: ownerContext.evidenceMode,
		catalog: {
			source: owned.catalogSource,
			provenance: catalog.result.provenance,
			results,
		},
		episode: ownerContext.episode,
		freshness: ownerContext.freshness,
		independence: ownerContext.independence,
		budget: ownerContext.budget,
		bindings: ownerContext.bindings,
	};
	return freeze({ ok: true, evidenceOnly: true, context: freeze(context) });
}
