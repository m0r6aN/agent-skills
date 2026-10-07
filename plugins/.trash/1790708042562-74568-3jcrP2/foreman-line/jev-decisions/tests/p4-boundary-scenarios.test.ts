import test from "node:test";
import * as barrel from "../src/index.ts";
import * as direct from "../src/runtime.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  canonicalDigest,
  DECISIONS_ENDPOINT,
  executeDecision,
  type BudgetAcknowledgement,
  type LeasePort,
  type RuntimeInput,
  type TransportPort,
} from "../src/index.ts";
import { QUESTIONS, REQUESTED_IDENTITY } from "../src/validator.ts";

const TIMES = [
  "2026-09-21T12:00:00.000Z",
  "2026-09-21T12:00:01.000Z",
  "2026-09-21T12:00:02.000Z",
  "2026-09-21T12:00:03.000Z",
];
const LEASE = {
  lease_id: "lease-11111111111111111111111111111111",
  run_id: "run-22222222222222222222222222222222",
  capability: "openrouter-alpha-decisions" as const,
  decision_schema_version: "jev-decisions/v1" as const,
  request_digest: "",
  state: "in-flight" as const,
  claimed_at_utc: TIMES[0],
  transition_actor: "coordinator" as const,
};
const CUSTODY = {
  source_ref: "src-33333333333333333333333333333333",
  repository: "agent-skills" as const,
  ref: "codex/jev-p1-typed-validator-and-fixture-replay",
  path: "plugins/foreman-line/jev-decisions/tests/fixtures/complete.json",
  commit: "0000000000000000000000000000000000000001",
  tree: "1111111111111111111111111111111111111111",
};
const STATE = {
  schema_version: "support-triage-input/v1" as const,
  values: {
    case_type: "billing" as const,
    urgency_signal: 0.9,
    frustration_signal: 0.8,
    contact_channel: "chat" as const,
  },
};

type ProviderBody = Record<string, unknown>;
type TransportOptions = {
  readonly responseBody?: unknown;
  readonly authority?: Partial<TransportResponseAuthority>;
  readonly rejectWith?: Error;
  readonly responseOverride?: Partial<TransportResponse>;
};
type TransportResponseAuthority = {
  readonly endpoint: string;
  readonly method: "POST";
  readonly redirects: "disabled" | "follow";
  readonly tls: "verified" | "unverified";
  readonly proxy: "none";
};
type TransportResponse = {
  readonly status: number;
  readonly content_type: string;
  readonly body: Uint8Array;
  readonly socket_opened_at_utc: string;
  readonly authority: TransportResponseAuthority;
};

function fixture(name: string): ProviderBody {
  const path = new URL(`./fixtures/p4/${name}.json`, import.meta.url);
  return JSON.parse(readFileSync(fileURLToPath(path), "utf8")) as ProviderBody;
}

function request() {
  return {
    schema_version: "jev-decisions/v1" as const,
    capability: "openrouter-alpha-decisions" as const,
    requested_identity: REQUESTED_IDENTITY,
    state: STATE,
    questions: QUESTIONS,
  };
}

function budget(requestDigest: string): BudgetAcknowledgement {
  const value = {
    schema_version: "jev-budget/v1" as const,
    mode: "provider-hard-budget" as const,
    provider: "openrouter" as const,
    account_ref: "acct-44444444444444444444444444444444",
    cap_amount: 0.01 as const,
    currency: "USD" as const,
    acknowledged_at_utc: TIMES[1],
    acknowledgement_digest: "",
    repository: "agent-skills" as const,
    ref: CUSTODY.ref,
    path: CUSTODY.path,
    commit: CUSTODY.commit,
    tree: CUSTODY.tree,
    lease_id: LEASE.lease_id,
    run_id: LEASE.run_id,
    capability: "openrouter-alpha-decisions" as const,
    decision_schema_version: "jev-decisions/v1" as const,
    request_digest: requestDigest,
  };
  const withoutDigest = { ...value } as Record<string, unknown>;
  delete withoutDigest.acknowledgement_digest;
  return { ...value, acknowledgement_digest: canonicalDigest(withoutDigest) };
}

function transport(
  body: unknown,
  calls: string[],
  options: TransportOptions = {},
): TransportPort {
  return {
    post: async (request) => {
      calls.push("transport");
      assert.equal(request.endpoint, DECISIONS_ENDPOINT);
      assert.equal(request.method, "POST");
      assert.equal(request.timeout_ms, 30_000);
      assert.equal(request.redirect, "error");
      assert.ok(request.signal instanceof AbortSignal);
      assert.equal(request.headers.Accept, "application/json");
      if (options.rejectWith) throw options.rejectWith;
      const authority: TransportResponseAuthority = {
        endpoint: DECISIONS_ENDPOINT,
        method: "POST",
        redirects: "disabled",
        tls: "verified",
        proxy: "none",
        ...options.authority,
      };
      return {
        status: 200,
        content_type: "application/json",
        body: new TextEncoder().encode(JSON.stringify(options.responseBody ?? body)),
        socket_opened_at_utc: TIMES[3],
        authority,
        ...options.responseOverride,
      } as Awaited<ReturnType<TransportPort["post"]>>;
    },
  };
}

async function input(
  body: unknown = fixture("provider-success"),
  calls: string[] = [],
  options: TransportOptions = {},
): Promise<RuntimeInput> {
  const requestDigest = canonicalDigest(request());
  const lease = { ...LEASE, request_digest: requestDigest };
  return {
    state: STATE,
    lease,
    budget_ack: budget(requestDigest),
    custody: CUSTODY,
    clock: {
      now: (() => {
        let index = 0;
        return () => TIMES[Math.min(index++, TIMES.length - 1)];
      })(),
    },
    lease_port: {
      claim: async () => ({ lease }),
      consume: async () => {
        calls.push("consume");
        return true;
      },
      terminal: async () => {
        calls.push("terminal");
      },
    } satisfies LeasePort,
    transport: transport(body, calls, options),
  };
}

function retired(error: unknown): boolean {
  assert.equal(typeof barrel.LegacyDecisionRetiredError, "function");
  assert.ok(error instanceof barrel.LegacyDecisionRetiredError);
  assert.equal(error.code, "LEGACY_EXECUTION_RETIRED");
  assert.equal(error.message, "Legacy governed inference is retired.");
  return true;
}

test("barrel and direct runtime expose identical retired executor and error", async () => {
  assert.equal(executeDecision, direct.executeDecision);
  assert.equal(barrel.LegacyDecisionRetiredError, direct.LegacyDecisionRetiredError);
  await assert.rejects(executeDecision(null as unknown as RuntimeInput), retired);
});

for (const scenario of [
  { name: "previous provider success", body: "provider-success" },
  { name: "malformed provider", body: "provider-malformed" },
  { name: "cost above cap", body: "provider-over-cap" },
  { name: "malformed transport", body: "provider-success", options: { responseOverride: { authority: undefined } } },
  { name: "timeout", body: "provider-success", options: { rejectWith: new Error("synthetic timeout") } },
  { name: "redirect", body: "provider-success", options: { authority: { redirects: "follow" as const } } },
  { name: "unverified TLS", body: "provider-success", options: { authority: { tls: "unverified" as const } } },
]) {
  test("retired before former P4 scenario: " + scenario.name, async () => {
    const calls: string[] = [];
    const value = await input(fixture(scenario.body), calls, scenario.options);
    // The former provider fixture stays intact, but none of the runtime seams may run.
    const guarded = { ...value,
      clock: { now() { calls.push("clock"); throw new Error("no clock or credentials"); } },
      lease_port: { ...value.lease_port, claim: async () => { calls.push("claim"); return "occupied" as const; } },
    };
    await assert.rejects(executeDecision(guarded), retired);
    assert.deepEqual(calls, []);
  });
}

test("missing or hostile credential supply is irrelevant: input is never inspected", async () => {
  let reads = 0;
  const value = new Proxy({}, { get() { reads += 1; throw new Error("no input reads"); } });
  await assert.rejects(executeDecision(value as RuntimeInput), retired);
  assert.equal(reads, 0);
});
