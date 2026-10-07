import test from "node:test";
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

async function withKey<T>(key: string | undefined, action: () => Promise<T>): Promise<T> {
  const previous = process.env.OPENROUTER_API_KEY;
  if (key === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = key;
  try {
    return await action();
  } finally {
    if (previous === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previous;
  }
}

function reason(result: Awaited<ReturnType<typeof executeDecision>>): string {
  assert.equal(result.ok, false);
  if (result.ok) throw new Error("expected a closed result");
  return result.record.reason_code;
}

test("missing credential refuses before the synthetic transport opens", async () => {
  const calls: string[] = [];
  const result = await withKey(undefined, async () => executeDecision(await input(fixture("provider-success"), calls)));
  assert.equal(reason(result), "evidence:R06");
  assert.deepEqual(calls, ["consume", "terminal"]);
});

test("malformed provider and transport results fail closed", async () => {
  const malformedProvider = await withKey("p4-test-key", async () => executeDecision(await input(fixture("provider-malformed"))));
  assert.equal(reason(malformedProvider), "evidence:R10");

  const malformedTransport = await withKey("p4-test-key", async () => executeDecision(await input(fixture("provider-success"), [], { responseOverride: { authority: undefined } })));
  assert.equal(reason(malformedTransport), "evidence:R04");
});

test("timeout and lease refusal never permit a live call", async () => {
  const timeoutCalls: string[] = [];
  const timeout = await withKey("p4-test-key", async () => executeDecision(await input(fixture("provider-success"), timeoutCalls, { rejectWith: new Error("synthetic timeout detail") })));
  assert.equal(reason(timeout), "evidence:R04");
  assert.deepEqual(timeoutCalls, ["consume", "transport", "terminal"]);

  const calls: string[] = [];
  const base = await input(fixture("provider-success"), calls);
  const refused = await withKey("p4-test-key", async () => executeDecision({
    ...base,
    lease_port: {
      claim: async () => "occupied",
      consume: async () => true,
      terminal: async () => { calls.push("terminal"); },
    },
  }));
  assert.equal(reason(refused), "evidence:R16");
  assert.deepEqual(calls, []);
});

test("provider cost above the hard cap becomes a bounded hold", async () => {
  const calls: string[] = [];
  const result = await withKey("p4-test-key", async () => executeDecision(await input(fixture("provider-over-cap"), calls)));
  assert.equal(reason(result), "evidence:R13");
  assert.deepEqual(calls, ["consume", "transport", "terminal"]);
});

test("redirect and unverified TLS authorities are rejected", async () => {
  for (const authority of [
    { redirects: "follow" as const },
    { tls: "unverified" as const },
  ]) {
    const result = await withKey("p4-test-key", async () => executeDecision(await input(fixture("provider-success"), [], { authority })));
    assert.equal(reason(result), "evidence:R04");
  }
});

test("synthetic success returns a redacted observation and never discloses the credential", async () => {
  const secret = "p4-secret-must-not-escape";
  const calls: string[] = [];
  let authorization = "";
  const base = await input(fixture("provider-success"), calls);
  const result = await withKey(secret, async () => executeDecision({
    ...base,
    transport: {
      post: async (request) => {
        authorization = request.headers.Authorization;
        return transport(fixture("provider-success"), calls).post(request);
      },
    },
  }));
  assert.equal(result.ok, true);
  assert.equal(authorization, `Bearer ${secret}`);
  assert.deepEqual(calls, ["consume", "transport", "terminal"]);
  assert.equal(JSON.stringify(result).includes(secret), false);
  if (result.ok) {
    assert.equal(result.observation.endpoint, DECISIONS_ENDPOINT);
    assert.equal(result.observation.served_identity.model, "typesafe/jev-1.13-20260917");
    assert.equal(result.observation.cost.amount, 0.000017934);
  }
});
