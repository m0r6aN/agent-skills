// biome-ignore-all lint/suspicious/noExplicitAny: JSON fixture assertions use structural test data.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { CatalogEligibilityInput } from "../../routing-policy/src/index.js";
import {
	evaluateCatalogEligibility,
	projectProviderBindingsV1,
} from "../../routing-policy/src/index.js";
import { preparePmcOwnerContextV1 } from "../src/index.js";

type Fixture = { context: Record<string, any> };
const fixture = JSON.parse(
	readFileSync(
		new URL(
			"../../routing-policy/tests/fixtures/pmc-resolver-v1.json",
			import.meta.url,
		),
		"utf8",
	),
) as Fixture;
const policy = structuredClone(fixture.context.projection.policy);
const evaluationTimeUtc = "2026-09-26T13:00:00.000Z";

function catalogInput(
	overrides: Partial<CatalogEligibilityInput> = {},
): CatalogEligibilityInput {
	const document = {
		formatVersion: "rcm-catalog-snapshot/v1",
		sourceRef: "bridge-test-source",
		providers: [
			{ providerKey: "openrouter", checkedAtUtc: "2026-09-26T12:00:00.000Z" },
		],
		models: [
			{
				provider: "openrouter",
				id: "model-2",
				baseUrl: "https://synthetic.invalid/v1",
				api: "openai-completions",
				input: ["text"],
				reasoning: true,
				contextWindow: 10000,
				maxTokens: 2000,
				cost: {
					input: { unit: "USD per 1M tokens", value: 1 },
					output: { unit: "USD per 1M tokens", value: 2 },
				},
			},
		],
	};
	const canonicalBytes = new TextEncoder().encode(
		`${JSON.stringify(document, null, 2)}\n`,
	);
	const digest = createHash("sha256").update(canonicalBytes).digest("hex");
	return {
		canonicalBytes,
		expectedSha256: digest,
		approvedConfig: {
			authorityRef: "bridge-test-authority",
			endpoints: [
				{ provider: "openrouter", baseUrl: "https://synthetic.invalid/v1" },
			],
		},
		evaluationTimeUtc,
		identities: [{ provider: "openrouter", id: "model-2" }],
		acceptedSource: {
			profileId: "bridge-test-profile",
			profileVersion: "v1",
			canonicalSha256: digest,
			sourceEvidenceRef: document.sourceRef,
			sourceEvidenceSha256: "a".repeat(64),
			requestedIdentities: [{ provider: "openrouter", id: "model-2" }],
		},
		...overrides,
	};
}

function input(overrides: Record<string, unknown> = {}) {
	return {
		policy: structuredClone(policy),
		catalogInput: catalogInput(),
		catalogSource: { status: "unknown" },
		ownerContext: {
			policyDigest: "a".repeat(64),
			configDigest: "b".repeat(64),
			evaluationTimeUtc,
			evidenceMode: "synthetic-offline",
			episode: { status: "unknown" },
			freshness: { status: "unknown" },
			independence: { status: "unknown" },
			budget: { status: "unknown" },
			bindings: [],
		},
		...overrides,
	};
}

function stringUnits(value: unknown): number {
	if (typeof value === "string") return value.length;
	if (value === null || typeof value !== "object") return 0;
	if (ArrayBuffer.isView(value)) return 0;
	let total = 0;
	for (const key of Reflect.ownKeys(value)) {
		if (typeof key !== "string") continue;
		total += key.length;
		const descriptor = Object.getOwnPropertyDescriptor(value, key);
		if (descriptor && "value" in descriptor)
			total += stringUnits(descriptor.value);
	}
	return total;
}

function aggregateStringInput(overBy: number): Record<string, unknown> {
	const value = input() as any;
	value.catalogSource = {};
	const keyCount = 513;
	const keys = Array.from(
		{ length: keyCount },
		(_, index) => `aggregate-${index}`,
	);
	const keyUnits = keys.reduce((total, key) => total + key.length, 0);
	let remaining = 2097152 - stringUnits(value) - keyUnits + overBy;
	value.catalogSource = Object.fromEntries(
		keys.map((key) => {
			const length = Math.min(4096, Math.max(0, remaining));
			remaining -= length;
			return [key, "x".repeat(length)];
		}),
	);
	assert.equal(remaining, 0);
	return value;
}

function expandedOrdinaryNodes(value: unknown, precharged = false): number {
	if (typeof value === "string") return precharged ? 0 : 1;
	if (value === null || typeof value !== "object") return precharged ? 0 : 1;
	if (ArrayBuffer.isView(value)) return precharged ? 0 : 1;
	if (Array.isArray(value)) {
		let total = precharged ? 0 : 1;
		total += value.length + Reflect.ownKeys(value).length;
		for (const key of Reflect.ownKeys(value)) {
			if (key === "length") continue;
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			if (descriptor && "value" in descriptor)
				total += expandedOrdinaryNodes(descriptor.value, true);
		}
		return total;
	}
	let total = precharged ? 0 : 1;
	for (const key of Reflect.ownKeys(value)) {
		total += 1;
		const descriptor = Object.getOwnPropertyDescriptor(value, key);
		if (descriptor && "value" in descriptor)
			total += expandedOrdinaryNodes(descriptor.value);
	}
	return total;
}

const CONTRACT_NODE_LIMIT = 131072;

function arithmeticOrdinaryInput(target: number): Record<string, unknown> {
	const value = input() as any;
	value.catalogSource = {};
	const base = expandedOrdinaryNodes(value);
	const remaining = target - base + 1;
	assert.ok(remaining >= 3);
	const entries = Math.floor((remaining - 1) / 2);
	const useArrayTail = remaining - (1 + entries * 2) === 1;
	const source = Object.fromEntries(
		Array.from({ length: entries }, (_, index) => [
			`node-${index}`,
			useArrayTail && index === 0 ? [] : null,
		]),
	);
	value.catalogSource = source;
	assert.equal(expandedOrdinaryNodes(value), target);
	return value;
}

function arithmeticAliasInput(target: number): Record<string, unknown> {
	const value = input() as any;
	value.catalogSource = {};
	value.ownerContext.bindings = {};
	const base = expandedOrdinaryNodes(value);
	const aliasCount = 256;
	const remaining = target - base;
	const sharedEntries = Math.max(
		1,
		Math.floor((remaining - aliasCount * 2) / (aliasCount * 2)),
	);
	const aliasDelta = aliasCount * (2 + sharedEntries * 2);
	const filler = remaining - aliasDelta;
	assert.ok(filler >= 0);
	const fillerEntries = Math.floor(filler / 2);
	const useArrayTail = filler - fillerEntries * 2 === 1;
	value.catalogSource = Object.fromEntries(
		Array.from({ length: fillerEntries }, (_, index) => [
			`filler-${index}`,
			useArrayTail && index === 0 ? [] : null,
		]),
	);
	const shared = Object.fromEntries(
		Array.from({ length: sharedEntries }, (_, index) => [
			`alias-${index}`,
			null,
		]),
	);
	value.ownerContext.bindings = Object.fromEntries(
		Array.from({ length: aliasCount }, (_, index) => [`slot-${index}`, shared]),
	);
	assert.equal(expandedOrdinaryNodes(value), target);
	return value;
}

function ordinaryBoundaryBuilder(value: Record<string, unknown>): string {
	const source = value.catalogSource as Record<string, unknown>;
	const entries = Object.keys(source).length;
	const arrayTail = Array.isArray(source[Object.keys(source)[0] ?? ""]);
	const tail = arrayTail ? "index === 0 ? [] : null" : "null";
	return `(value) => { value.catalogSource = Object.fromEntries(Array.from({ length: ${entries} }, (_, index) => [\`node-\${index}\`, ${tail}])); return value; }`;
}

function aliasBoundaryBuilder(value: Record<string, unknown>): string {
	const source = value.catalogSource as Record<string, unknown>;
	const bindings = (value.ownerContext as Record<string, unknown>)
		.bindings as Record<string, Record<string, unknown>>;
	const shared = Object.values(bindings)[0] ?? {};
	const fillerEntries = Object.keys(source).length;
	const sharedEntries = Object.keys(shared).length;
	const fillerArrayTail = Array.isArray(source[Object.keys(source)[0] ?? ""]);
	const fillerTail = fillerArrayTail ? "index === 0 ? [] : null" : "null";
	return `(value) => { value.catalogSource = Object.fromEntries(Array.from({ length: ${fillerEntries} }, (_, index) => [\`filler-\${index}\`, ${fillerTail}])); const shared = Object.fromEntries(Array.from({ length: ${sharedEntries} }, (_, index) => [\`alias-\${index}\`, null])); value.ownerContext.bindings = Object.fromEntries(Array.from({ length: 256 }, (_, index) => [\`slot-\${index}\`, shared])); return value; }`;
}

function aggregateBoundaryBuilder(overBy: number): string {
	const value = input() as Record<string, unknown>;
	value.catalogSource = {};
	const keys = Array.from({ length: 513 }, (_, index) => `aggregate-${index}`);
	const remaining =
		2097152 -
		stringUnits(value) -
		keys.reduce((total, key) => total + key.length, 0) +
		overBy;
	return `(value) => { const keys = Array.from({ length: 513 }, (_, index) => \`aggregate-\${index}\`); let remaining = ${remaining}; value.catalogSource = Object.fromEntries(keys.map((key) => { const length = Math.min(4096, Math.max(0, remaining)); remaining -= length; return [key, "x".repeat(length)]; })); return value; }`;
}

function nestedObject(count: number): unknown {
	let value: unknown = null;
	for (let index = 0; index < count; index++) value = { child: value };
	return value;
}

function isBounds(value: unknown): boolean {
	return (
		typeof value === "object" &&
		value !== null &&
		(value as Record<string, unknown>).ok === false &&
		(value as Record<string, unknown>).stage === "bridge" &&
		(value as Record<string, unknown>).code === "BOUNDS_REFUSED"
	);
}

function instrumentedCounts(value: Record<string, unknown>): {
	stage: string;
	projection: number;
	catalog: number;
} {
	const target = new URL("../../routing-policy/src/index.ts", import.meta.url)
		.href;
	const loader = `
const target = ${JSON.stringify(target)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.includes("/routing-policy/src/index.") && !specifier.startsWith(target)) {
    const source = \
      \`import * as actual from \${JSON.stringify(target)};\n\
globalThis.__counts ??= { projection: 0, catalog: 0 };\n\
export const projectProviderBindingsV1 = (...args) => {\n\
  globalThis.__counts.projection++;\n\
  return actual.projectProviderBindingsV1(...args);\n\
};\n\
export const evaluateCatalogEligibility = (...args) => {\n\
  globalThis.__counts.catalog++;\n\
  return actual.evaluateCatalogEligibility(...args);\n\
};\`;
    return { url: "data:text/javascript," + encodeURIComponent(source), shortCircuit: true };
  }
  return nextResolve(specifier, context, nextResolve);
}
export async function load(url, context, nextLoad) {
  if (url.startsWith("data:text/javascript,")) return {
    format: "module",
    source: decodeURIComponent(url.slice("data:text/javascript,".length)),
    shortCircuit: true,
  };
  return nextLoad(url, context, nextLoad);
}
`;
	const serialized = JSON.stringify({
		...value,
		catalogInput: {
			...(value.catalogInput as unknown as Record<string, unknown>),
			canonicalBytes: Array.from(
				(value.catalogInput as any).canonicalBytes as Uint8Array,
			),
		},
	});
	const script = `
import { preparePmcOwnerContextV1 } from "./src/index.ts";
const input = ${serialized};
input.catalogInput.canonicalBytes = Uint8Array.from(input.catalogInput.canonicalBytes);
const result = preparePmcOwnerContextV1(input);
process.stdout.write("__COUNTS__" + JSON.stringify({
  stage: result.ok ? "success" : result.stage,
  counts: globalThis.__counts,
}));
`;
	const child = spawnSync(
		process.execPath,
		[
			"--import",
			"tsx/esm",
			"--loader",
			`data:text/javascript,${encodeURIComponent(loader)}`,
			"--input-type=module",
			"--eval",
			script,
		],
		{ cwd: process.cwd(), encoding: "utf8" },
	);
	assert.equal(child.status, 0, child.stderr);
	const line = child.stdout
		.split(/\r?\n/)
		.find((entry) => entry.startsWith("__COUNTS__"));
	assert.ok(line, child.stdout);
	const parsed = JSON.parse(line.slice("__COUNTS__".length)) as {
		stage: string;
		counts: { projection: number; catalog: number };
	};
	return { stage: parsed.stage, ...parsed.counts };
}

function instrumentedBuilder(builder: string): {
	stage: string;
	code?: string;
	projection: number;
	catalog: number;
} {
	const target = new URL("../../routing-policy/src/index.ts", import.meta.url)
		.href;
	const loader = `
const target = ${JSON.stringify(target)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier.includes("/routing-policy/src/index.") && !specifier.startsWith(target)) {
    const source = \
      \`import * as actual from \${JSON.stringify(target)};\\n\
globalThis.__counts ??= { projection: 0, catalog: 0 };\\n\
export const projectProviderBindingsV1 = (...args) => {\\n\
  globalThis.__counts.projection++;\\n\
  return actual.projectProviderBindingsV1(...args);\\n\
};\\n\
export const evaluateCatalogEligibility = (...args) => {\\n\
  globalThis.__counts.catalog++;\\n\
  return actual.evaluateCatalogEligibility(...args);\\n\
};\`;
    return { url: "data:text/javascript," + encodeURIComponent(source), shortCircuit: true };
  }
  return nextResolve(specifier, context, nextResolve);
}
export async function load(url, context, nextLoad) {
  if (url.startsWith("data:text/javascript,")) return {
    format: "module",
    source: decodeURIComponent(url.slice("data:text/javascript,".length)),
    shortCircuit: true,
  };
  return nextLoad(url, context, nextLoad);
}
`;
	const value = input();
	const serialized = JSON.stringify({
		...value,
		catalogInput: {
			...(value.catalogInput as unknown as Record<string, unknown>),
			canonicalBytes: Array.from(
				(value.catalogInput as any).canonicalBytes as Uint8Array,
			),
		},
	});
	const script = `
import { preparePmcOwnerContextV1 } from "./src/index.ts";
const seed = ${serialized};
seed.catalogInput.canonicalBytes = Uint8Array.from(seed.catalogInput.canonicalBytes);
const input = (${builder})(seed);
const result = preparePmcOwnerContextV1(input);
process.stdout.write("__COUNTS__" + JSON.stringify({
  stage: result.ok ? "success" : result.stage,
  code: result.ok || result.stage !== "bridge" ? null : result.code,
  counts: globalThis.__counts,
}));
`;
	const child = spawnSync(
		process.execPath,
		[
			"--import",
			"tsx/esm",
			"--loader",
			`data:text/javascript,${encodeURIComponent(loader)}`,
			"--input-type=module",
			"--eval",
			script,
		],
		{ cwd: process.cwd(), encoding: "utf8" },
	);
	assert.equal(child.status, 0, child.stderr);
	const line = child.stdout
		.split(/\r?\n/)
		.find((entry) => entry.startsWith("__COUNTS__"));
	assert.ok(line, child.stdout);
	const parsed = JSON.parse(line.slice("__COUNTS__".length)) as {
		stage: string;
		code: string | null;
		counts: { projection: number; catalog: number };
	};
	return {
		stage: parsed.stage,
		...(parsed.code === null ? {} : { code: parsed.code }),
		...parsed.counts,
	};
}

test("assembles real projection and catalog rows without validating owner claims", () => {
	const value = input();
	const policyBeforeCapture = structuredClone(value.policy);
	const result = preparePmcOwnerContextV1(value);
	assert.equal(result.ok, true);
	if (!result.ok) return;
	(value.policy.bindings[0] as any).providerModelId = "caller-mutated";
	(value.ownerContext.episode as any).status = "caller-mutated";
	assert.equal(result.evidenceOnly, true);
	assert.deepEqual(
		(result.context as any).projection.policy,
		policyBeforeCapture,
	);
	assert.equal((result.context as any).episode.status, "unknown");
	assert.equal((result.context as any).catalog.source.status, "unknown");
	assert.equal(
		(result.context as any).catalog.provenance.evaluationTimeUtc,
		evaluationTimeUtc,
	);
	const catalog = evaluateCatalogEligibility(value.catalogInput);
	assert.equal(catalog.stage, "projector");
	if (catalog.stage !== "projector" || !catalog.result.ok) return;
	assert.deepEqual((result.context as any).catalog.results[0], {
		provider: "openrouter",
		providerModelId: "model-2",
		outcome: "facts",
		facts:
			catalog.result.results[0]?.outcome === "facts"
				? catalog.result.results[0].facts
				: null,
	});
	assert.equal(Object.isFrozen(result), true);
	assert.equal(Object.isFrozen(result.context), true);
	assert.equal(Object.isFrozen((result.context as any).catalog), true);
	assert.equal(Object.isFrozen((result.context as any).catalog.results), true);
});

test("preserves exact projection and catalog refusals and phase order", () => {
	const projectionRefusal = preparePmcOwnerContextV1({
		...input(),
		policy: {},
	});
	assert.deepEqual(projectionRefusal, {
		ok: false,
		evidenceOnly: true,
		stage: "projection",
		result: projectProviderBindingsV1({}),
	});

	const badDigest = catalogInput({ expectedSha256: "0".repeat(64) });
	const catalogRefusal = preparePmcOwnerContextV1({
		...input(),
		catalogInput: badDigest,
	});
	assert.deepEqual(catalogRefusal, {
		ok: false,
		evidenceOnly: true,
		stage: "catalog",
		result: evaluateCatalogEligibility(badDigest),
	});

	assert.deepEqual(
		preparePmcOwnerContextV1({
			...input(),
			ownerContext: { ...input().ownerContext, evaluationTimeUtc: "other" },
		}),
		{
			ok: false,
			evidenceOnly: true,
			stage: "bridge",
			code: "TIME_BINDING_REFUSED",
		},
	);

	const endpointRefusal = catalogInput({
		approvedConfig: {
			authorityRef: "bridge-test-authority",
			endpoints: [
				{ provider: "openrouter", baseUrl: "https://other.invalid/v1" },
			],
		},
	});
	const endpointResult = preparePmcOwnerContextV1({
		...input(),
		catalogInput: endpointRefusal,
	});
	assert.equal(endpointResult.ok, true);
	if (endpointResult.ok) {
		assert.deepEqual((endpointResult.context as any).catalog.results[0], {
			provider: "openrouter",
			providerModelId: "model-2",
			outcome: "refused",
			codes: ["ENDPOINT_MISMATCH_REFUSED"],
		});
	}

	const mismatchPolicy = structuredClone(policy);
	mismatchPolicy.bindings[2].providerModelId = "other-model";
	mismatchPolicy.bindings[2].piHostModelId = "openrouter/other-model";
	assert.deepEqual(
		preparePmcOwnerContextV1({ ...input(), policy: mismatchPolicy }),
		{
			ok: false,
			evidenceOnly: true,
			stage: "bridge",
			code: "IDENTITY_BINDING_REFUSED",
		},
	);
});

test("isolated instrumentation verifies first refusal and zero later owner calls", () => {
	assert.deepEqual(instrumentedCounts(input()), {
		stage: "success",
		projection: 1,
		catalog: 1,
	});
	assert.deepEqual(instrumentedCounts({ ...input(), policy: {} }), {
		stage: "projection",
		projection: 1,
		catalog: 0,
	});
	const badCatalog = input();
	(badCatalog.catalogInput as any).expectedSha256 = "0".repeat(64);
	assert.deepEqual(instrumentedCounts(badCatalog), {
		stage: "catalog",
		projection: 1,
		catalog: 1,
	});
	assert.deepEqual(instrumentedCounts({ ...input(), extra: true }), {
		stage: "bridge",
		projection: 0,
		catalog: 0,
	});
	const captureBoundaryCases = [
		(() => {
			const value = input();
			(value.ownerContext as any).bindings = new Array(257).fill(null);
			return value;
		})(),
		(() => {
			const value = input();
			(value.ownerContext as any).episode = nestedObject(19);
			return value;
		})(),
	];
	for (const value of captureBoundaryCases) {
		assert.deepEqual(instrumentedCounts(value), {
			stage: "bridge",
			projection: 0,
			catalog: 0,
		});
	}

	const invalidOrdinaryShapes = [
		"(value) => { value.ownerContext.episode = Symbol('invalid'); return value; }",
		"(value) => { Object.defineProperty(value.ownerContext, 'hidden', { value: null, enumerable: false }); return value; }",
		"(value) => { Object.defineProperty(value.ownerContext, 'episode', { get() { return null; }, enumerable: true }); return value; }",
		"(value) => { value.ownerContext.episode = () => null; return value; }",
		"(value) => { value.ownerContext.episode = Promise.resolve(null); return value; }",
		"(value) => { value.ownerContext.episode = new Date(); return value; }",
		"(value) => { value.ownerContext.episode = value.ownerContext; return value; }",
		"(value) => { value.ownerContext.episode = undefined; return value; }",
		"(value) => { value.ownerContext.episode = NaN; return value; }",
		"(value) => { value.ownerContext.bindings = new Array(1); return value; }",
		"(value) => { value.ownerContext.bindings = [null]; Object.defineProperty(value.ownerContext.bindings, 'extra', { value: null, enumerable: true }); return value; }",
	];
	for (const builder of invalidOrdinaryShapes) {
		assert.deepEqual(instrumentedBuilder(builder), {
			stage: "bridge",
			code: "INPUT_REFUSED",
			projection: 0,
			catalog: 0,
		});
	}

	const ordinaryAtLimit = arithmeticOrdinaryInput(CONTRACT_NODE_LIMIT);
	assert.deepEqual(
		instrumentedBuilder(ordinaryBoundaryBuilder(ordinaryAtLimit)),
		{
			stage: "success",
			projection: 1,
			catalog: 1,
		},
	);
	assert.deepEqual(
		instrumentedBuilder(
			ordinaryBoundaryBuilder(arithmeticOrdinaryInput(CONTRACT_NODE_LIMIT + 1)),
		),
		{ stage: "bridge", code: "BOUNDS_REFUSED", projection: 0, catalog: 0 },
	);
	const aliasAtLimit = arithmeticAliasInput(CONTRACT_NODE_LIMIT);
	assert.deepEqual(instrumentedBuilder(aliasBoundaryBuilder(aliasAtLimit)), {
		stage: "success",
		projection: 1,
		catalog: 1,
	});
	assert.deepEqual(
		instrumentedBuilder(
			aliasBoundaryBuilder(arithmeticAliasInput(CONTRACT_NODE_LIMIT + 1)),
		),
		{ stage: "bridge", code: "BOUNDS_REFUSED", projection: 0, catalog: 0 },
	);

	const exactLimits = [
		{
			builder:
				"(value) => { let nested = null; for (let index = 0; index < 18; index++) nested = { child: nested }; value.ownerContext.episode = nested; return value; }",
		},
		{
			builder:
				"(value) => { value.ownerContext.bindings = new Array(256).fill(null); return value; }",
		},
		{
			builder:
				'(value) => { value.ownerContext.policyDigest = "x".repeat(4096); return value; }',
		},
		{ builder: aggregateBoundaryBuilder(0) },
		{
			builder:
				"(value) => { value.catalogInput.canonicalBytes = new Uint8Array(8 * 1024 * 1024); return value; }",
		},
	];
	for (const { builder } of exactLimits) {
		const result = instrumentedBuilder(builder);
		assert.equal(result.stage === "bridge", false);
		assert.deepEqual(
			{ projection: result.projection, catalog: result.catalog },
			{ projection: 1, catalog: 1 },
		);
	}
	const overLimits = [
		{
			builder:
				"(value) => { let nested = null; for (let index = 0; index < 19; index++) nested = { child: nested }; value.ownerContext.episode = nested; return value; }",
		},
		{
			builder:
				"(value) => { value.ownerContext.bindings = new Array(257).fill(null); return value; }",
		},
		{
			builder:
				'(value) => { value.ownerContext.policyDigest = "x".repeat(4097); return value; }',
		},
		{ builder: aggregateBoundaryBuilder(1) },
		{
			builder:
				"(value) => { value.catalogInput.canonicalBytes = new Uint8Array(8 * 1024 * 1024 + 1); return value; }",
		},
	];
	for (const { builder } of overLimits) {
		assert.deepEqual(instrumentedBuilder(builder), {
			stage: "bridge",
			code: "BOUNDS_REFUSED",
			projection: 0,
			catalog: 0,
		});
	}
});

test("rejects wrong envelopes, accessors, aliases, and hostile bytes before owner calls", () => {
	assert.equal(preparePmcOwnerContextV1({ ...input(), extra: true }).ok, false);
	assert.deepEqual(
		preparePmcOwnerContextV1({
			...input(),
			ownerContext: { ...input().ownerContext, extra: true },
		}),
		{ ok: false, evidenceOnly: true, stage: "bridge", code: "INPUT_REFUSED" },
	);
	const accessor = input();
	Object.defineProperty(accessor, "policy", {
		get: () => policy,
		enumerable: true,
	});
	assert.deepEqual(preparePmcOwnerContextV1(accessor), {
		ok: false,
		evidenceOnly: true,
		stage: "bridge",
		code: "INPUT_REFUSED",
	});
	const throwing = new Proxy(input(), {
		getOwnPropertyDescriptor: () => {
			throw new Error("trap");
		},
	});
	assert.deepEqual(preparePmcOwnerContextV1(throwing), {
		ok: false,
		evidenceOnly: true,
		stage: "bridge",
		code: "INPUT_REFUSED",
	});
	const mutating = input();
	const originalBytes = (mutating.catalogInput as any)
		.canonicalBytes as Uint8Array;
	(mutating as any).catalogInput = new Proxy(mutating.catalogInput, {
		getOwnPropertyDescriptor(target, key) {
			if (key === "canonicalBytes")
				originalBytes[0] = (originalBytes[0] ?? 0) ^ 1;
			return Reflect.getOwnPropertyDescriptor(target, key);
		},
	});
	const mutationResult = preparePmcOwnerContextV1(mutating);
	assert.equal(mutationResult.ok, false);
	if (!mutationResult.ok) assert.equal(mutationResult.stage, "catalog");
	const aliased = input();
	(aliased.ownerContext as any).bindings = [
		(aliased.ownerContext as any).episode,
		(aliased.ownerContext as any).episode,
	];
	assert.equal(preparePmcOwnerContextV1(aliased).ok, true);
	const sparse = input();
	(sparse.ownerContext as any).bindings = [];
	Object.defineProperty((sparse.ownerContext as any).bindings, "1", {
		value: null,
		enumerable: true,
	});
	Object.defineProperty((sparse.ownerContext as any).bindings, "length", {
		value: 2,
	});
	assert.deepEqual(preparePmcOwnerContextV1(sparse), {
		ok: false,
		evidenceOnly: true,
		stage: "bridge",
		code: "INPUT_REFUSED",
	});
	class IterationHostileBytes extends Uint8Array {
		override [Symbol.iterator](): ReturnType<Uint8Array["values"]> {
			throw new Error("must not iterate");
		}
	}
	const subclass = new IterationHostileBytes(catalogInput().canonicalBytes);
	const bytes = input();
	(bytes.catalogInput as any).canonicalBytes = subclass;
	const subclassResult = preparePmcOwnerContextV1(bytes);
	assert.ok(subclassResult.ok || subclassResult.stage !== "bridge");
	if (typeof SharedArrayBuffer !== "undefined") {
		const shared = input();
		(shared.catalogInput as any).canonicalBytes = new Uint8Array(
			new SharedArrayBuffer(4),
		);
		assert.deepEqual(preparePmcOwnerContextV1(shared), {
			ok: false,
			evidenceOnly: true,
			stage: "bridge",
			code: "INPUT_REFUSED",
		});
	}
	if (typeof ArrayBuffer !== "undefined") {
		const resizable = input();
		(resizable.catalogInput as any).canonicalBytes = new Uint8Array(
			new (ArrayBuffer as any)(4, { maxByteLength: 8 }),
		);
		assert.deepEqual(preparePmcOwnerContextV1(resizable), {
			ok: false,
			evidenceOnly: true,
			stage: "bridge",
			code: "INPUT_REFUSED",
		});
	}
});

test("rejects byte-containing ancestor aliases in every traversal order", () => {
	const catalogSourceAlias = input();
	(catalogSourceAlias as any).catalogSource = (
		catalogSourceAlias as any
	).catalogInput;
	assert.deepEqual(preparePmcOwnerContextV1(catalogSourceAlias), {
		ok: false,
		evidenceOnly: true,
		stage: "bridge",
		code: "INPUT_REFUSED",
	});

	const nestedAlias = input();
	(nestedAlias.ownerContext as any).episode = (nestedAlias as any).catalogInput;
	assert.deepEqual(preparePmcOwnerContextV1(nestedAlias), {
		ok: false,
		evidenceOnly: true,
		stage: "bridge",
		code: "INPUT_REFUSED",
	});

	const reordered = input();
	const reorderedInput = (reordered as any).catalogInput;
	const reorderedEnvelope = {
		policy: (reordered as any).policy,
		catalogSource: reorderedInput,
		ownerContext: (reordered as any).ownerContext,
		catalogInput: reorderedInput,
	};
	assert.deepEqual(preparePmcOwnerContextV1(reorderedEnvelope), {
		ok: false,
		evidenceOnly: true,
		stage: "bridge",
		code: "INPUT_REFUSED",
	});
});

test("keeps the canonical byte budget independent from ordinary nodes", () => {
	const large = input();
	const document = JSON.parse(
		new TextDecoder().decode((large.catalogInput as any).canonicalBytes),
	) as any;
	document.models[0].thinkingLevelMap = Object.fromEntries(
		Array.from({ length: 9000 }, (_, index) => [`level-${index}`, "HIGH"]),
	);
	const canonicalBytes = new TextEncoder().encode(
		`${JSON.stringify(document, null, 2)}\n`,
	);
	assert.ok(canonicalBytes.byteLength > 131072);
	const digest = createHash("sha256").update(canonicalBytes).digest("hex");
	(large as any).catalogInput = {
		...(large as any).catalogInput,
		canonicalBytes,
		expectedSha256: digest,
		acceptedSource: {
			...(large as any).catalogInput.acceptedSource,
			canonicalSha256: digest,
		},
	};
	const result = preparePmcOwnerContextV1(large);
	assert.equal(
		result.ok === false &&
			result.stage === "bridge" &&
			result.code === "BOUNDS_REFUSED",
		false,
	);
});

test("enforces aggregate strings and expanded aliases independently of byte size", () => {
	const exactBytes = input();
	const canonicalBytes = new Uint8Array(8 * 1024 * 1024);
	const digest = createHash("sha256").update(canonicalBytes).digest("hex");
	(exactBytes as any).catalogInput = {
		...(exactBytes as any).catalogInput,
		canonicalBytes,
		expectedSha256: digest,
		acceptedSource: {
			...(exactBytes as any).catalogInput.acceptedSource,
			canonicalSha256: digest,
		},
	};
	const exactBytesResult = preparePmcOwnerContextV1(exactBytes);
	assert.equal(
		exactBytesResult.ok === false &&
			exactBytesResult.stage === "bridge" &&
			exactBytesResult.code === "BOUNDS_REFUSED",
		false,
	);

	const aggregate = input();
	(aggregate as any).catalogSource = Object.fromEntries(
		Array.from({ length: 513 }, (_, index) => [
			`source-${index}`,
			"x".repeat(4096),
		]),
	);
	assert.deepEqual(preparePmcOwnerContextV1(aggregate), {
		ok: false,
		evidenceOnly: true,
		stage: "bridge",
		code: "BOUNDS_REFUSED",
	});

	const shared = Object.fromEntries(
		Array.from({ length: 1024 }, (_, index) => [`claim-${index}`, index]),
	);
	const expandedAliases = input();
	(expandedAliases.ownerContext as any).bindings = Array.from(
		{ length: 256 },
		() => shared,
	);
	assert.deepEqual(preparePmcOwnerContextV1(expandedAliases), {
		ok: false,
		evidenceOnly: true,
		stage: "bridge",
		code: "BOUNDS_REFUSED",
	});
});

test("accepts exact depth, ordinary-node, string, and aggregate limits before one-over refusal", () => {
	const depthAtLimit = input();
	(depthAtLimit.ownerContext as any).episode = nestedObject(18);
	assert.equal(isBounds(preparePmcOwnerContextV1(depthAtLimit)), false);
	const depthOver = input();
	(depthOver.ownerContext as any).episode = nestedObject(19);
	assert.equal(isBounds(preparePmcOwnerContextV1(depthOver)), true);

	const ordinaryExact = arithmeticOrdinaryInput(CONTRACT_NODE_LIMIT);
	assert.equal(expandedOrdinaryNodes(ordinaryExact), CONTRACT_NODE_LIMIT);
	assert.equal(isBounds(preparePmcOwnerContextV1(ordinaryExact)), false);
	assert.deepEqual(
		preparePmcOwnerContextV1(arithmeticOrdinaryInput(CONTRACT_NODE_LIMIT + 1)),
		{
			ok: false,
			evidenceOnly: true,
			stage: "bridge",
			code: "BOUNDS_REFUSED",
		},
	);

	const stringAtLimit = input();
	(stringAtLimit.ownerContext as any).policyDigest = "x".repeat(4096);
	assert.equal(isBounds(preparePmcOwnerContextV1(stringAtLimit)), false);
	const stringOver = input();
	(stringOver.ownerContext as any).policyDigest = "x".repeat(4097);
	assert.equal(isBounds(preparePmcOwnerContextV1(stringOver)), true);
	assert.equal(
		isBounds(preparePmcOwnerContextV1(aggregateStringInput(0))),
		false,
	);
	assert.equal(
		isBounds(preparePmcOwnerContextV1(aggregateStringInput(1))),
		true,
	);

	const aliasExact = arithmeticAliasInput(CONTRACT_NODE_LIMIT);
	assert.equal(expandedOrdinaryNodes(aliasExact), CONTRACT_NODE_LIMIT);
	assert.equal(isBounds(preparePmcOwnerContextV1(aliasExact)), false);
	assert.deepEqual(
		preparePmcOwnerContextV1(arithmeticAliasInput(CONTRACT_NODE_LIMIT + 1)),
		{
			ok: false,
			evidenceOnly: true,
			stage: "bridge",
			code: "BOUNDS_REFUSED",
		},
	);
});

test("refuses oversized arrays and bytes before allocation or descent", () => {
	const array = input();
	(array.ownerContext as any).bindings = new Array(257).fill(null);
	assert.deepEqual(preparePmcOwnerContextV1(array), {
		ok: false,
		evidenceOnly: true,
		stage: "bridge",
		code: "BOUNDS_REFUSED",
	});
	const bytes = input();
	(bytes.catalogInput as any).canonicalBytes = new Uint8Array(
		8 * 1024 * 1024 + 1,
	);
	assert.deepEqual(preparePmcOwnerContextV1(bytes), {
		ok: false,
		evidenceOnly: true,
		stage: "bridge",
		code: "BOUNDS_REFUSED",
	});
	const string = input();
	(string.ownerContext as any).policyDigest = "x".repeat(4097);
	assert.deepEqual(preparePmcOwnerContextV1(string), {
		ok: false,
		evidenceOnly: true,
		stage: "bridge",
		code: "BOUNDS_REFUSED",
	});
	const depth = input();
	let nested: any = null;
	for (let index = 0; index < 22; index++) nested = { child: nested };
	(depth.ownerContext as any).episode = nested;
	assert.deepEqual(preparePmcOwnerContextV1(depth), {
		ok: false,
		evidenceOnly: true,
		stage: "bridge",
		code: "BOUNDS_REFUSED",
	});
	const nodes = input();
	(nodes.ownerContext as any).bindings = Array.from({ length: 256 }, () =>
		Array.from({ length: 256 }, () => null),
	);
	assert.deepEqual(preparePmcOwnerContextV1(nodes), {
		ok: false,
		evidenceOnly: true,
		stage: "bridge",
		code: "BOUNDS_REFUSED",
	});
});
