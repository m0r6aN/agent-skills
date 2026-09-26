// biome-ignore-all lint/suspicious/noExplicitAny: JSON fixture assertions use structural test data.
import assert from "node:assert/strict";
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
