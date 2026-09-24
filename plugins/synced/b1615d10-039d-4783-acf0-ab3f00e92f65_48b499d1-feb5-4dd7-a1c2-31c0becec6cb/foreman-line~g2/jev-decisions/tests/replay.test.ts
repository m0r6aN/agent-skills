import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { replayFixture, type CompleteFixture, type ManifestReceipt } from "../src/index.ts";

const complete = JSON.parse(readFileSync(new URL("./fixtures/complete.json", import.meta.url), "utf8")) as CompleteFixture;
const refusal = JSON.parse(readFileSync(new URL("./fixtures/refused.json", import.meta.url), "utf8"));
const hold = JSON.parse(readFileSync(new URL("./fixtures/hold.json", import.meta.url), "utf8"));

const receipt: ManifestReceipt = {
  receipt_schema_version: "jev-manifest-receipt/v1",
  authority: "coordinator-manifest-resolver-v1",
  receipt_id: "mreceipt-99999999999999999999999999999999",
  resolution: "resolved",
  manifest_id: complete.manifest_id,
  fixture_id: complete.fixture_id,
  repository: complete.repository,
  ref: complete.ref,
  path: complete.path,
  commit: complete.commit,
  tree: complete.tree,
  request_digest: complete.request_digest,
  response_digest: complete.response_digest,
  provenance_digest: complete.provenance_digest,
  resolved_at_utc: "2026-09-21T12:01:00.000Z",
};

test("replays complete, refused, and hold fixtures", () => {
  const result = replayFixture(complete, receipt);
  assert.equal(result.ok, true);
  assert.deepEqual(replayFixture(refusal, null), { ok: true, value: refusal });
  assert.deepEqual(replayFixture(hold, null), { ok: true, value: hold });
});

test("requires an independent receipt and rejects receipt mutations", () => {
  assert.deepEqual(replayFixture(complete, null), { ok: false, status: "hold", reason: "R19" });
  const extra = { ...receipt, unexpected: true };
  assert.deepEqual(replayFixture(complete, extra), { ok: false, status: "refused", reason: "R23" });
  assert.deepEqual(replayFixture(complete, { ...receipt, commit: "2222222222222222222222222222222222222222" }), { ok: false, status: "refused", reason: "R20" });
});

test("fails closed for response identity, digest, extra-field, and unsafe-reason mutations", () => {
  const responseId = structuredClone(complete) as CompleteFixture;
  (responseId.response.served_identity as Record<string, unknown>).response_id = "r-002";
  assert.deepEqual(replayFixture(responseId, receipt), { ok: false, status: "refused", reason: "R23" });

  const digest = structuredClone(complete) as Record<string, unknown>;
  digest.response_digest = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  assert.deepEqual(replayFixture(digest, receipt), { ok: false, status: "refused", reason: "R17" });

  const forged = structuredClone(complete) as Record<string, unknown>;
  const forgedDigest = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  forged.response_digest = forgedDigest;
  (forged.manifest_entry as Record<string, unknown>).response_digest = forgedDigest;
  const forgedReceipt = { ...receipt, response_digest: forgedDigest };
  assert.deepEqual(replayFixture(forged, forgedReceipt), { ok: false, status: "refused", reason: "R17" });

  const extra = { ...hold, extra: true };
  assert.deepEqual(replayFixture(extra, null), { ok: false, status: "refused", reason: "R23" });

  const unsafe = { ...refusal, reason_code: "operator supplied secret" };
  assert.deepEqual(replayFixture(unsafe, null), { ok: false, status: "refused", reason: "R22" });
});

test("replay is deterministic and does not return rejected input", () => {
  const first = replayFixture(complete, receipt);
  const second = replayFixture(complete, receipt);
  assert.deepEqual(first, second);
  const rejected = replayFixture({ evidence_class: "unknown", secret: "must not echo" }, null);
  assert.deepEqual(rejected, { ok: false, status: "refused", reason: "R23" });
  assert.equal(JSON.stringify(rejected).includes("must not echo"), false);
});
