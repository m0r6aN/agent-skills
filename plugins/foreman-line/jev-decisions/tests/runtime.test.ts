import test from "node:test";
import assert from "node:assert/strict";
import { canonicalDigest } from "../src/index.ts";
import { DECISIONS_ENDPOINT, executeDecision, type BudgetAcknowledgement, type LeasePort, type RuntimeInput, type TransportPort } from "../src/runtime.ts";
import { QUESTIONS, REQUESTED_IDENTITY } from "../src/validator.ts";

const times = ["2026-09-21T12:00:00.000Z", "2026-09-21T12:00:01.000Z", "2026-09-21T12:00:02.000Z", "2026-09-21T12:00:03.000Z", "2026-09-21T12:00:04.000Z", "2026-09-21T12:00:05.000Z"];
const lease = { lease_id: "lease-11111111111111111111111111111111", run_id: "run-22222222222222222222222222222222", capability: "openrouter-alpha-decisions" as const, decision_schema_version: "jev-decisions/v1" as const, request_digest: "", state: "in-flight" as const, claimed_at_utc: times[0], transition_actor: "coordinator" as const };
const custody = { source_ref: "src-33333333333333333333333333333333", repository: "agent-skills" as const, ref: "codex/jev-p1-typed-validator-and-fixture-replay", path: "plugins/foreman-line/jev-decisions/tests/fixtures/complete.json", commit: "0000000000000000000000000000000000000001", tree: "1111111111111111111111111111111111111111" };
const state = { schema_version: "support-triage-input/v1" as const, values: { case_type: "billing" as const, urgency_signal: 0.9, frustration_signal: 0.8, contact_channel: "chat" as const } };

function request() { return { schema_version: "jev-decisions/v1" as const, capability: "openrouter-alpha-decisions" as const, requested_identity: REQUESTED_IDENTITY, state, questions: QUESTIONS }; }
function budget(requestDigest: string): BudgetAcknowledgement {
  const value = { schema_version: "jev-budget/v1" as const, mode: "provider-hard-budget" as const, provider: "openrouter" as const, account_ref: "acct-44444444444444444444444444444444", cap_amount: 0.01 as const, currency: "USD" as const, acknowledged_at_utc: times[1], acknowledgement_digest: "", repository: "agent-skills" as const, ref: custody.ref, path: custody.path, commit: custody.commit, tree: custody.tree, lease_id: lease.lease_id, run_id: lease.run_id, capability: "openrouter-alpha-decisions" as const, decision_schema_version: "jev-decisions/v1" as const, request_digest: requestDigest };
  const without = { ...value } as Record<string, unknown>;
  delete without.acknowledgement_digest;
  return { ...value, acknowledgement_digest: canonicalDigest(without) };
}
function provider() { return { model: "typesafe/jev-1.13-20260917", response_id: "r-001", server_timestamp_utc: times[2], answers: { is_urgent: { noul: 0.95, confidence: 0.95 }, department: { choice: "billing", confidence: 0.82, probabilities: { billing: 0.88, technical: 0.12, sales: 0 } }, frustration: { score: 1.04, confidence: 0.94 } }, usage: { input_tokens: 427, output_tokens: 73, total_tokens: 500 }, cost: { amount: 0.000017934, currency: "USD" } }; }
function ports(responseBody: unknown, calls: string[]): { leasePort: LeasePort; transport: TransportPort } {
  return { leasePort: { claim: async () => "claimed", consume: async () => { calls.push("consume"); return true; }, terminal: async () => { calls.push("terminal"); } }, transport: { post: async (request) => { calls.push(`${request.method} ${request.endpoint}`); assert.equal(request.endpoint, DECISIONS_ENDPOINT); assert.equal(request.method, "POST"); assert.equal(request.timeout_ms, 30_000); assert.match(request.headers.Authorization, /^Bearer /); return { status: 200, content_type: "application/json", body_bytes: JSON.stringify(responseBody).length, body: responseBody, socket_opened_at_utc: times[3] }; } } };
}
async function input(body: unknown = provider(), calls: string[] = []): Promise<RuntimeInput> {
  const reqDigest = canonicalDigest(request());
  const configuredLease = { ...lease, request_digest: reqDigest };
  return { state, lease: configuredLease, budget_ack: budget(reqDigest), custody, clock: { now: (() => { let index = 0; return () => times[Math.min(index++, times.length - 1)]; })() }, lease_port: ports(body, calls).leasePort, transport: ports(body, calls).transport };
}

test("executes one bounded call and returns only a redacted live observation", async () => {
  const calls: string[] = [];
  const value = await input(provider(), calls);
  process.env.OPENROUTER_API_KEY = "test-only-secret";
  const result = await executeDecision({ ...value, lease_port: ports(provider(), calls).leasePort, transport: ports(provider(), calls).transport });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.observation.endpoint, DECISIONS_ENDPOINT);
  assert.deepEqual(result.observation.requested_identity, REQUESTED_IDENTITY);
  assert.equal(result.observation.served_identity.model, "typesafe/jev-1.13-20260917");
  assert.equal(result.observation.cost.currency, "USD");
  assert.equal(JSON.stringify(result).includes("test-only-secret"), false);
  assert.deepEqual(calls, ["consume", "POST https://openrouter.ai/api/alpha/decisions", "terminal"]);
});

test("refuses missing credentials without opening transport", async () => {
  delete process.env.OPENROUTER_API_KEY;
  const calls: string[] = [];
  const value = await input(provider(), calls);
  const result = await executeDecision(value);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.record.reason_code, "evidence:R06");
  assert.deepEqual(calls, ["consume", "terminal"]);
});

test("holds missing cost and refuses malformed transport/provider results", async () => {
  process.env.OPENROUTER_API_KEY = "test-only-secret";
  const missingCost = { ...provider() } as Record<string, unknown>;
  delete missingCost.cost;
  const calls: string[] = [];
  const result = await executeDecision({ ...(await input(missingCost, calls)), lease_port: ports(missingCost, calls).leasePort, transport: ports(missingCost, calls).transport });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.record.reason_code, "evidence:R13");
  assert.equal(JSON.stringify(result).includes("test-only-secret"), false);

  const missingMetadata = { ...provider() } as Record<string, unknown>;
  delete missingMetadata.server_timestamp_utc;
  const metadataResult = await executeDecision({ ...(await input(missingMetadata)), lease_port: ports(missingMetadata, []).leasePort, transport: ports(missingMetadata, []).transport });
  assert.equal(metadataResult.ok, false);
  if (!metadataResult.ok) assert.equal(metadataResult.record.reason_code, "evidence:R12");
});

test("refuses a competing lease before transport and preserves generic shape", async () => {
  process.env.OPENROUTER_API_KEY = "test-only-secret";
  const value = await input(provider());
  const result = await executeDecision({ ...value, lease_port: { claim: async () => "occupied", consume: async () => true, terminal: async () => {} } });
  assert.deepEqual(result, { ok: false, record: { evidence_class: "refusal-record", status: "refused", reason_code: "evidence:R16", source_kind: "coordinator-review", source_ref: custody.source_ref, recorded_at_utc: times[0], retention_until_utc: "2026-12-20T12:00:00.000Z" } });
});
