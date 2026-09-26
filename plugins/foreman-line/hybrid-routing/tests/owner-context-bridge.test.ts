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

function instrumentedCounts(value: Record<string, unknown>): {
	stage: string;
	projection: number;
	catalog: number;
} {
	const target = new URL(
		"../../routing-policy/src/index.ts",
		import.meta.url,
	).href;
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
			...(value.catalogInput as Record<string, unknown>),
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
console.log("__COUNTS__" + JSON.stringify({
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
	const subclass = new Uint8Array(
		catalogInput().canonicalBytes,
	) as Uint8Array & {
		[Symbol.iterator]: () => IterableIterator<number>;
	};
	subclass[Symbol.iterator] = () => {
		throw new Error("must not iterate");
	};
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
	(catalogSourceAlias as any).catalogSource = (catalogSourceAlias as any).catalogInput;
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
