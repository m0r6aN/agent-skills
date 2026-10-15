import assert from "node:assert/strict";
import { test } from "node:test";

test("extension module loads and exports its extension factory", async () => {
	const extension = await import("./index.ts");
	assert.equal(typeof extension.default, "function");
});
