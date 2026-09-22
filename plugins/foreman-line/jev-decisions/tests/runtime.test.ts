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
  return { leasePort: { claim: async () => ({ lease: { ...lease, request_digest: canonicalDigest(request()) } }), consume: async () => { calls.push("consume"); return true; }, terminal: async () => { calls.push("terminal"); } }, transport: { post: async (request) => { calls.push(`${request.method} ${request.endpoint}`); assert.equal(request.endpoint, DECISIONS_ENDPOINT); assert.equal(request.method, "POST"); assert.equal(request.timeout_ms, 30_000); assert.equal(request.redirect, "error"); assert.ok(request.signal instanceof AbortSignal); assert.equal(request.headers.Accept, "application/json"); assert.match(request.headers.Authorization, /^Bearer /); return { status: 200, content_type: "application/json", body: new TextEncoder().encode(JSON.stringify(responseBody)), authority: { endpoint: DECISIONS_ENDPOINT, method: "POST", redirects: "disabled", tls: "verified", proxy: "none" }, socket_opened_at_utc: times[3] }; } } };
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

  const mismatched = await executeDecision({ ...value, lease_port: { claim: async () => ({ lease: { ...value.lease, lease_id: "lease-99999999999999999999999999999999" } }), consume: async () => true, terminal: async () => {} } });
  assert.equal(mismatched.ok, false);
  if (!mismatched.ok) assert.equal(mismatched.record.reason_code, "evidence:R16");
});

test("does not echo unsafe custody and handles lease/transport boundary failures", async () => {
  process.env.OPENROUTER_API_KEY = "test-only-secret";
  const value = await input(provider());
  const unsafe = { ...value, custody: { ...custody, source_ref: "Bearer secret\r\nX-Leak: yes" } };
  const unsafeResult = await executeDecision(unsafe);
  assert.equal(unsafeResult.ok, false);
  if (!unsafeResult.ok) {
    assert.equal(unsafeResult.record.source_ref, "src-00000000000000000000000000000000");
    assert.equal(JSON.stringify(unsafeResult).includes("Bearer secret"), false);
  }

  const leaseFailure = await executeDecision({ ...value, lease_port: { claim: async () => { throw new Error("untrusted detail"); }, consume: async () => true, terminal: async () => {} } });
  assert.equal(leaseFailure.ok, false);
  if (!leaseFailure.ok) assert.equal(leaseFailure.record.reason_code, "evidence:R15");

  const badTransport = { post: async (request: Parameters<TransportPort["post"]>[0]) => {
    const base = await ports(provider(), []).transport.post(request);
    return { ...base, authority: { ...base.authority, redirects: "follow" } } as unknown as Awaited<ReturnType<TransportPort["post"]>>;
  } };
  const badAuthority = await executeDecision({ ...value, transport: badTransport });
  assert.equal(badAuthority.ok, false);
  if (!badAuthority.ok) assert.equal(badAuthority.record.reason_code, "evidence:R04");

  const invalidUtf8 = { post: async () => ({ status: 200, content_type: "application/json", body: new Uint8Array([0xc3, 0x28]), authority: { endpoint: DECISIONS_ENDPOINT, method: "POST", redirects: "disabled", tls: "verified", proxy: "none" }, socket_opened_at_utc: times[3] }) };
  const invalidBody = await executeDecision({ ...value, transport: invalidUtf8 });
  assert.equal(invalidBody.ok, false);
  if (!invalidBody.ok) assert.equal(invalidBody.record.reason_code, "evidence:R04");
});

test("rejects duplicate JSON keys and nested provider extras", async () => {
  process.env.OPENROUTER_API_KEY = "test-only-secret";
  const value = await input(provider());
  const duplicateText = JSON.stringify(provider()).replace('"model":"typesafe/jev-1.13-20260917"', '"model":"typesafe/jev-1.13-20260917","model":"typesafe/jev-1.13-20260917"');
  const duplicate = { post: async () => ({ status: 200, content_type: "application/json", body: new TextEncoder().encode(duplicateText), authority: { endpoint: DECISIONS_ENDPOINT, method: "POST", redirects: "disabled", tls: "verified", proxy: "none" }, socket_opened_at_utc: times[3] }) };
  const duplicateResult = await executeDecision({ ...value, transport: duplicate });
  assert.equal(duplicateResult.ok, false);
  if (!duplicateResult.ok) assert.equal(duplicateResult.record.reason_code, "evidence:R04");

  const extraProvider = provider() as { answers: { is_urgent: Record<string, unknown>; department: Record<string, unknown>; frustration: Record<string, unknown> } } & Record<string, unknown>;
  extraProvider.answers.department.extra = "discard-me";
  const extraResult = await executeDecision({ ...(await input(extraProvider)), transport: { post: async () => ({ status: 200, content_type: "application/json", body: new TextEncoder().encode(JSON.stringify(extraProvider)), authority: { endpoint: DECISIONS_ENDPOINT, method: "POST", redirects: "disabled", tls: "verified", proxy: "none" }, socket_opened_at_utc: times[3] }) } });
  assert.equal(extraResult.ok, false);
  if (!extraResult.ok) assert.equal(extraResult.record.reason_code, "evidence:R10");
});

test("fails closed when malformed provider bytes cannot be terminalized", async () => {
  const base = await input(provider());
  const result = await executeDecision({
    ...base,
    transport: { post: async () => ({ status: 200, content_type: "application/json", body: new TextEncoder().encode("{bad"), authority: { endpoint: DECISIONS_ENDPOINT, method: "POST", redirects: "disabled", tls: "verified", proxy: "none" }, socket_opened_at_utc: times[3] }) },
    lease_port: { claim: async () => ({ lease: { ...base.lease, request_digest: canonicalDigest(request()) } }), consume: async () => true, terminal: async () => { throw new Error("terminal unavailable"); } },
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.record.reason_code, "evidence:R15");
});

test("returns a bounded record when the initial clock is invalid", async () => {
  const base = await input(provider());
  const result = await executeDecision({ ...base, clock: { now: () => "not-a-timestamp" } });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.record.reason_code, "evidence:R22");
    assert.equal(result.record.recorded_at_utc, "1970-01-01T00:00:00.000Z");
  }
});

test("terminalizes when a post-claim clock read throws", async () => {
  const base = await input(provider());
  const calls: string[] = [];
  let reads = 0;
  const result = await executeDecision({
    ...base,
    clock: { now: () => { reads += 1; if (reads === 3) throw new Error("clock unavailable"); return times[reads - 1]; } },
    lease_port: { claim: async () => ({ lease: { ...base.lease, request_digest: canonicalDigest(request()) } }), consume: async () => { calls.push("consume"); return true; }, terminal: async () => { calls.push("terminal"); } },
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.record.reason_code, "evidence:R15");
  assert.deepEqual(calls, ["consume", "terminal"]);
});

test("snapshots requested identity in returned observations", async () => {
  process.env.OPENROUTER_API_KEY = "test-only-secret";
  const value = await input(provider());
  const result = await executeDecision(value);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  (result.observation.requested_identity as Record<string, unknown>).model = "mutated";
  assert.equal(REQUESTED_IDENTITY.model, "typesafe/jev-1.13");

  const terminalInput = await input(provider());
  const terminalFailure = await executeDecision({ ...terminalInput, lease_port: { claim: async () => ({ lease: { ...terminalInput.lease, request_digest: canonicalDigest(request()) } }), consume: async () => true, terminal: async () => { throw new Error("terminal unavailable"); } } });
  assert.equal(terminalFailure.ok, false);
  if (!terminalFailure.ok) assert.equal(terminalFailure.record.reason_code, "evidence:R15");
});
