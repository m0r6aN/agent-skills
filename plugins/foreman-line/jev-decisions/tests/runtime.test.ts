import test from "node:test";
import assert from "node:assert/strict";
import { canonicalDigest } from "../src/index.ts";
import * as runtime from "../src/runtime.ts";
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

function retired(error: unknown): boolean {
  assert.equal(typeof runtime.LegacyDecisionRetiredError, "function");
  assert.ok(error instanceof runtime.LegacyDecisionRetiredError);
  assert.equal(error.name, "LegacyDecisionRetiredError");
  assert.equal(error.code, "LEGACY_EXECUTION_RETIRED");
  assert.equal(error.message, "Legacy governed inference is retired.");
  return true;
}

test("formerly successful input rejects before clock, lease or transport with no observation", async () => {
  const calls: string[] = [];
  const value = await input(provider(), calls);
  Object.defineProperty(value, "clock", { value: { now: () => { calls.push("clock"); throw new Error("clock must not run"); } } });
  const promise = executeDecision(value);
  assert.ok(promise instanceof Promise);
  await assert.rejects(promise, retired);
  assert.deepEqual(calls, []);
});

for (const field of ["state", "lease", "budget_ack", "custody", "clock", "lease_port", "transport"]) {
  test("retirement never reads input field " + field, async () => {
    let reads = 0;
    const value = await input();
    Object.defineProperty(value, field, { get() { reads += 1; throw new Error("input must not be inspected"); } });
    // Other fields cannot reach credential access even in the pre-retirement RED run.
    if (field !== "clock") Object.defineProperty(value, "clock", { value: { now() { throw new Error("clock forbidden"); } } });
    await assert.rejects(executeDecision(value), retired);
    assert.equal(reads, 0);
  });
}

test("null, primitive, revoked proxy and reentrant getters receive the same typed refusal", async () => {
  let reads = 0;
  const trap = () => { reads += 1; throw new Error("argument trap"); };
  const hostile = new Proxy({}, { get: trap, ownKeys: trap, getOwnPropertyDescriptor: trap, getPrototypeOf: trap });
  const revoked = Proxy.revocable({}, {});
  revoked.revoke();
  const accessor = Object.defineProperty({}, "clock", { get() {
    reads += 1;
    void executeDecision(hostile as RuntimeInput).catch(() => {});
    throw new Error("reentry forbidden");
  } });
  for (const value of [null, undefined, 1, "legacy", hostile, revoked.proxy, accessor]) {
    await assert.rejects(executeDecision(value as RuntimeInput), retired);
  }
  assert.equal(reads, 0);
});

const oldScenarios: ReadonlyArray<{
  name: string;
  prepare: (value: RuntimeInput) => RuntimeInput;
}> = [
  { name: "missing cost", prepare: value => {
    const body = provider() as Record<string, unknown>; delete body.cost;
    return { ...value, transport: ports(body, []).transport };
  } },
  { name: "missing server metadata", prepare: value => {
    const body = provider() as Record<string, unknown>; delete body.server_timestamp_utc;
    return { ...value, transport: ports(body, []).transport };
  } },
  { name: "competing lease", prepare: value => ({ ...value, lease_port: { ...value.lease_port, claim: async () => "occupied" } }) },
  { name: "mismatched lease", prepare: value => ({ ...value, lease: { ...value.lease, lease_id: "lease-99999999999999999999999999999999" } }) },
  { name: "unsafe custody", prepare: value => ({ ...value, custody: { ...value.custody, source_ref: "Bearer unsafe\r\nX-Leak: yes" } }) },
  { name: "lease failure", prepare: value => ({ ...value, lease_port: { ...value.lease_port, claim: async () => { throw new Error("lease failed"); } } }) },
  { name: "malformed custody", prepare: value => ({ ...value, custody: null as never }) },
  { name: "terminal failure", prepare: value => ({ ...value, lease_port: { ...value.lease_port, terminal: async () => { throw new Error("terminal failed"); } } }) },
  { name: "invalid initial clock", prepare: value => ({ ...value, clock: { now: () => "not-a-timestamp" } }) },
  { name: "post-claim clock failure", prepare: value => {
    let reads = 0;
    return { ...value, clock: { now: () => { if (++reads === 3) throw new Error("clock failed"); return times[reads - 1]; } } };
  } },
  ...["redirect authority", "invalid UTF-8", "duplicate JSON keys", "nested provider extras", "malformed bytes and failed terminalization"].map(name => ({
    name,
    prepare(value: RuntimeInput): RuntimeInput {
      const body = provider();
      if (name === "nested provider extras") Object.assign(body.answers.department, { extra: "discard-me" });
      let bytes = new TextEncoder().encode(JSON.stringify(body));
      if (name === "invalid UTF-8") bytes = new Uint8Array([0xc3, 0x28]);
      if (name === "duplicate JSON keys") bytes = new TextEncoder().encode('{"model":"a","model":"b"}');
      if (name === "malformed bytes and failed terminalization") bytes = new TextEncoder().encode("{bad");
      return { ...value, transport: { post: async () => ({
        status: 200, content_type: "application/json", body: bytes, socket_opened_at_utc: times[3],
        authority: { endpoint: DECISIONS_ENDPOINT, method: "POST", redirects: name === "redirect authority" ? "follow" : "disabled", tls: "verified", proxy: "none" },
      } as never) }, ...(name === "malformed bytes and failed terminalization" ? {
        lease_port: { ...value.lease_port, terminal: async () => { throw new Error("terminal failed"); } },
      } : {}) };
    },
  })),
];
for (const scenario of oldScenarios) {
  test("old runtime scenario refuses without inspecting its configured faults: " + scenario.name, async () => {
    const value = scenario.prepare(await input());
    let reads = 0;
    const guarded = new Proxy(value, { get() { reads += 1; throw new Error("input access forbidden"); } });
    await assert.rejects(executeDecision(guarded), retired);
    assert.equal(reads, 0);
  });
}

test("concurrent invocations stay retired and do not mutate pure provider identity", async () => {
  const before = JSON.stringify(REQUESTED_IDENTITY);
  const calls: string[] = [];
  const value = await input(provider(), calls);
  Object.defineProperty(value, "clock", { get() { calls.push("clock"); throw new Error("forbidden"); } });
  await Promise.all(Array.from({ length: 8 }, () => assert.rejects(executeDecision(value), retired)));
  assert.deepEqual(calls, []);
  assert.equal(JSON.stringify(REQUESTED_IDENTITY), before);
});
