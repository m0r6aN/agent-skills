import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalDigest,
  canonicalize,
  validateRequest,
  validateResponse,
  type RequestEnvelope,
  type ResponseEnvelope,
} from "../src/index.ts";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/complete.json", import.meta.url), "utf8")) as {
  request: RequestEnvelope;
  response: ResponseEnvelope;
};

test("reproduces both frozen P0 JCS vectors", () => {
  assert.equal(canonicalize({ b: [true, "x"], a: 1 }), '{"a":1,"b":[true,"x"]}');
  assert.equal(canonicalDigest({ b: [true, "x"], a: 1 }), "63e8063d9dc6f0fd5a24b4706818a165fd57c3531b74466cf5dea62bff09b0b6");
  const vector = { model: "typesafe/jev-1.13", response_id: "r-001", schema_version: "jev-decisions/v1" };
  assert.equal(canonicalize(vector), '{"model":"typesafe/jev-1.13","response_id":"r-001","schema_version":"jev-decisions/v1"}');
  assert.equal(canonicalDigest(vector), "dab820809e40697f1bdcc99736067d9d282090766ae72d0e65137daf3cf6bca2");
});

test("accepts the closed request and response envelopes", () => {
  const request = validateRequest(fixture.request);
  assert.equal(request.ok, true);
  if (!request.ok) return;
  const response = validateResponse(request.value, fixture.response);
  assert.equal(response.ok, true);
});

test("rejects request metadata changes and free-text state", () => {
  const extra = structuredClone(fixture.request) as Record<string, unknown>;
  extra.extra = true;
  assert.deepEqual(validateRequest(extra), { ok: false, status: "refused", reason: "R10" });

  const unsafe = structuredClone(fixture.request) as RequestEnvelope;
  (unsafe.state.values as Record<string, unknown>).transcript = "secret";
  assert.deepEqual(validateRequest(unsafe), { ok: false, status: "refused", reason: "R10" });

  const reordered = structuredClone(fixture.request) as RequestEnvelope;
  (reordered as Record<string, unknown>).questions = [...reordered.questions].reverse() as RequestEnvelope["questions"];
  assert.deepEqual(validateRequest(reordered), { ok: false, status: "refused", reason: "R10" });
});

test("rejects malformed, incomplete, and split-brain answers", () => {
  const request = validateRequest(fixture.request);
  assert.equal(request.ok, true);
  if (!request.ok) return;

  const extra = structuredClone(fixture.response) as Record<string, unknown>;
  extra.extra = true;
  assert.deepEqual(validateResponse(request.value, extra), { ok: false, status: "refused", reason: "R10" });

  const missingMetadata = structuredClone(fixture.response) as Record<string, unknown>;
  delete missingMetadata.server_timestamp_utc;
  assert.deepEqual(validateResponse(request.value, missingMetadata), { ok: false, status: "hold", reason: "R12" });

  const badIdentity = structuredClone(fixture.response) as ResponseEnvelope;
  (badIdentity.served_identity as Record<string, unknown>).response_id = "r-002";
  assert.deepEqual(validateResponse(request.value, badIdentity), { ok: false, status: "refused", reason: "R09" });

  const badDistribution = structuredClone(fixture.response) as ResponseEnvelope;
  (badDistribution.answers[1] as Record<string, unknown>).distribution = { billing: 0.5, technical: 0.5, sales: 0.5 };
  assert.deepEqual(validateResponse(request.value, badDistribution), { ok: false, status: "refused", reason: "R10" });
});
