import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  canonicalDigest,
  createSupportTriageAdvisory,
  DECISIONS_ENDPOINT,
  executeDecision,
  validateRequest,
  validateResponse,
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

// ---------------------------------------------------------------------------
// Environment-specific scenario matrix (charter JEV-P4).
//
// The charter requires positive, negative, timeout, auth, privacy, cost,
// refusal, and provider-boundary scenarios by environment. Two offline
// environments are executable in this suite; the live-provider environment is
// not authorized by this parcel and carries no scenario here:
//
//   runtime-adapter     - in-process JEV-P2 runtime over injected lease,
//                         transport, clock, and custody seams. The six
//                         scenarios above plus the scenarios below run here.
//   container-launcher  - the portable-container entrypoint contract
//                         (container/jev-run.mjs) over one-request stdin
//                         framing, dry-run only, with a credential sentinel in
//                         the process environment.
//
// Scenario classes per environment:
//
//   class           runtime-adapter              container-launcher
//   positive        synthetic success (above),   dry-run typed result (below)
//                   advisory path (below)
//   negative        malformed provider/transport malformed answers (below),
//                   (above), malformed answers    framing matrix (below)
//                   (below)
//   timeout         synthetic timeout + lease    one-request lifecycle (below)
//                   refusal (above)
//   auth            missing key R06 (above)      credential non-disclosure
//                                                (below)
//   privacy         closed-state refusal (below) closed-state refusal (below)
//   cost            unqualified/over-cap (below) over-cap refusal (below)
//   refusal         alias + incomplete answers   caller-override neutralized
//                   (below)                       (below)
//   provider-       redirect/TLS (above),        missing provider metadata
//   boundary        transport/body bounds (below) hold (below)
//
// Scenarios assert only the runtime's own closed records and outputs;
// refusal, hold, lease, budget, authority, and redaction rules are not
// re-implemented here.
// ---------------------------------------------------------------------------

const LAUNCHER = fileURLToPath(new URL("../container/jev-run.mjs", import.meta.url));
const DRY_RUN = fileURLToPath(new URL("../container/fixtures/dry-run.json", import.meta.url));
const SENTINEL_KEY = "p4-env-sentinel-must-not-escape";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("expected a closed record");
  }
  return value as Record<string, unknown>;
}

function launcherPayload(): Record<string, unknown> {
  return record(JSON.parse(readFileSync(DRY_RUN, "utf8")) as unknown);
}

function runLauncher(input: string): { readonly status: number | null; readonly out: string } {
  const result = spawnSync(process.execPath, [LAUNCHER], {
    input,
    encoding: "utf8",
    env: { ...process.env, OPENROUTER_API_KEY: SENTINEL_KEY },
  });
  return { status: result.status, out: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

function singleJsonLine(out: string): Record<string, unknown> {
  const lines = out.trim().split("\n");
  assert.equal(lines.length, 1);
  return record(JSON.parse(lines[0]) as unknown);
}

test("[env:runtime-adapter] auth: missing and blank keys refuse before the transport seam", async () => {
  for (const key of [undefined, ""]) {
    const calls: string[] = [];
    const result = await withKey(key, async () => executeDecision(await input(fixture("provider-success"), calls)));
    assert.equal(reason(result), "evidence:R06");
    assert.deepEqual(calls, ["consume", "terminal"]);
  }
});

test("[env:runtime-adapter] privacy: free-text or extra state refuses at the closed schema and is never retained", () => {
  const pii = {
    schema_version: "support-triage-input/v1",
    values: { case_type: "billing", note: "call John at 555-0100" },
  };
  const piiResult = validateRequest({ ...request(), state: pii });
  assert.equal(piiResult.ok, false);
  if (piiResult.ok) throw new Error("expected a refusal");
  assert.equal(piiResult.status, "refused");
  assert.equal(piiResult.reason, "R10");
  assert.equal(JSON.stringify(piiResult).includes("555-0100"), false);

  const transcript = { ...request(), transcript: "customer said their card was stolen" };
  const transcriptResult = validateRequest(transcript);
  assert.equal(transcriptResult.ok, false);
  if (transcriptResult.ok) throw new Error("expected a refusal");
  assert.equal(transcriptResult.reason, "R10");
  assert.equal(JSON.stringify(transcriptResult).includes("stolen"), false);
});

test("[env:runtime-adapter] positive: a canonical validated P1 response yields the exact advisory object", () => {
  const complete = record(JSON.parse(readFileSync(fileURLToPath(new URL("./fixtures/complete.json", import.meta.url)), "utf8")) as unknown);
  const validated = validateResponse(request(), complete.response);
  assert.equal(validated.ok, true);
  if (!validated.ok) throw new Error("expected the canonical P1 fixture to validate");
  const advisory = createSupportTriageAdvisory(validated.value);
  assert.deepEqual(advisory, {
    schema_version: "support-triage-advisory/v1",
    source: "jev",
    response_id: "r-001",
    is_urgent: 0.95,
    department: "billing",
    frustration: 1.04,
  });
  assert.deepEqual(
    Object.keys(advisory).sort(),
    ["department", "frustration", "is_urgent", "response_id", "schema_version", "source"],
  );
  // recommendation-only boundary: no identity, authority, or route fields leak in
  assert.equal(JSON.stringify(advisory).includes("openrouter"), false);
  assert.equal(JSON.stringify(advisory).includes("typesafe"), false);
});

test("[env:runtime-adapter] refusal: alias identity and incomplete answers refuse without fabricated answers", async () => {
  const aliasResult = validateRequest({
    ...request(),
    requested_identity: { provider: "openrouter", model: "typesafe/jev-latest", surface: "alpha-decisions" },
  });
  assert.equal(aliasResult.ok, false);
  if (aliasResult.ok) throw new Error("expected a refusal");
  assert.equal(aliasResult.reason, "R10");

  const success = fixture("provider-success");
  const answers = record(success.answers);
  const missing = await withKey("p4-test-key", async () =>
    executeDecision(await input({ ...success, answers: { is_urgent: answers.is_urgent } })));
  assert.equal(reason(missing), "evidence:R10");
  assert.equal(JSON.stringify(missing).includes("0.95"), false);

  const extra = await withKey("p4-test-key", async () =>
    executeDecision(await input({ ...success, answers: { ...answers, bonus: { noul: 0.5, confidence: 0.5 } } })));
  assert.equal(reason(extra), "evidence:R10");

  const badDistribution = await withKey("p4-test-key", async () =>
    executeDecision(await input({
      ...success,
      answers: {
        ...answers,
        department: { choice: "billing", confidence: 0.82, probabilities: { billing: 0.5, technical: 0.1, sales: 0.1 } },
      },
    })));
  assert.equal(reason(badDistribution), "evidence:R10");
});

test("[env:runtime-adapter] cost: unqualified and missing cost never becomes a success", async () => {
  const success = fixture("provider-success");

  const noCurrency = await withKey("p4-test-key", async () =>
    executeDecision(await input({ ...success, cost: { amount: 0.000017934 } })));
  assert.equal(reason(noCurrency), "evidence:R13");

  const nonUsd = await withKey("p4-test-key", async () =>
    executeDecision(await input({ ...success, cost: { amount: 0.000017934, currency: "EUR" } })));
  assert.equal(reason(nonUsd), "evidence:R13");

  const withoutCost: Record<string, unknown> = { ...success };
  delete withoutCost.cost;
  const missingCost = await withKey("p4-test-key", async () => executeDecision(await input(withoutCost)));
  assert.equal(reason(missingCost), "evidence:R13");
  assert.equal(missingCost.ok, false);
  if (missingCost.ok) throw new Error("expected a closed result");
  assert.equal(missingCost.record.status, "hold");
  assert.equal(missingCost.record.disposition, "pending-coordinator");

  // closed records never retain cost estimates or provider payload
  for (const closed of [noCurrency, nonUsd, missingCost]) {
    assert.equal(JSON.stringify(closed).includes("0.000017934"), false);
    assert.equal("cost" in record(JSON.parse(JSON.stringify(closed)) as unknown), false);
  }
});

test("[env:runtime-adapter] provider-boundary: transport, authority, and body bounds refuse as R04", async () => {
  const success = fixture("provider-success");
  const cases: ReadonlyArray<readonly [string, TransportOptions]> = [
    ["non-2xx provider status", { responseOverride: { status: 401 } }],
    ["non-JSON content type", { responseOverride: { content_type: "text/html" } }],
    ["unexpected endpoint authority", {
      responseOverride: {
        authority: { endpoint: "https://evil.example/alpha", method: "POST", redirects: "disabled", tls: "verified", proxy: "none" },
      },
    }],
    ["invalid socket timestamp", { responseOverride: { socket_opened_at_utc: "not-a-timestamp" } }],
    ["invalid UTF-8 body", { responseOverride: { body: new Uint8Array([0xff, 0xfe, 0xfd]) } }],
  ];
  for (const [label, options] of cases) {
    const result = await withKey("p4-test-key", async () => executeDecision(await input(success, [], options)));
    assert.equal(reason(result), "evidence:R04", label);
    assert.equal(JSON.stringify(result).includes("evil.example"), false);
  }

  const oversized = await withKey("p4-test-key", async () =>
    executeDecision(await input({ ...success, filler: "x".repeat(70_000) })));
  assert.equal(reason(oversized), "evidence:R04");
});

test("[env:runtime-adapter] provider-boundary: missing provider metadata is a terminal hold, never client-filled", async () => {
  const success = fixture("provider-success");
  const withoutModel: Record<string, unknown> = { ...success };
  delete withoutModel.model;
  const result = await withKey("p4-test-key", async () => executeDecision(await input(withoutModel)));
  assert.equal(reason(result), "evidence:R12");
  assert.equal(result.ok, false);
  if (result.ok) throw new Error("expected a closed result");
  assert.equal(result.record.status, "hold");
  assert.equal(result.record.disposition, "pending-coordinator");
  // the requested identity is never copied in to fill the missing declaration
  assert.equal(JSON.stringify(result).includes("typesafe/jev-1.13-20260917"), false);
});

test("[env:container-launcher] positive: one dry-run request returns a single redacted typed result without disclosing the credential", () => {
  const { status, out } = runLauncher(readFileSync(DRY_RUN, "utf8"));
  assert.equal(status, 0);
  const result = singleJsonLine(out);
  assert.equal(result.ok, true);
  const observation = record(result.observation);
  assert.equal(observation.endpoint, DECISIONS_ENDPOINT);
  assert.deepEqual(observation.requested_identity, REQUESTED_IDENTITY);
  assert.deepEqual(record(observation.served_identity).model, "typesafe/jev-1.13-20260917");
  const cost = record(observation.cost);
  assert.equal(cost.currency, "USD");
  assert.equal(cost.amount, 0.000017934);
  // redaction: no input state, no raw synthetic provider body, no credential,
  // not even the launcher's internal dry-run marker
  assert.equal(out.includes(SENTINEL_KEY), false);
  assert.equal(out.includes("urgency_signal"), false);
  assert.equal(out.includes("probabilities"), false);
  assert.equal(out.includes("jev-container-dry-run-placeholder"), false);
});

test("[env:container-launcher] negative: empty, malformed, trailing, oversized, and unsupported-mode inputs fail closed", () => {
  const dry = readFileSync(DRY_RUN, "utf8");
  const payload = launcherPayload();
  const cases: ReadonlyArray<readonly [string, string]> = [
    ["empty input", ""],
    ["malformed JSON", "{not-json"],
    ["duplicate/trailing framing", `${dry}\n${dry}`],
    ["unsupported mode", JSON.stringify({ ...payload, mode: "live-run" })],
    ["oversized input", JSON.stringify({ ...payload, pad: "x".repeat(300_000) })],
  ];
  for (const [label, input] of cases) {
    const { status, out } = runLauncher(input);
    assert.equal(status, 2, label);
    assert.deepEqual(singleJsonLine(out), { ok: false, error: "invalid_input" });
    assert.equal(out.includes(SENTINEL_KEY), false);
  }
});

test("[env:container-launcher] refusal: caller-override fields cannot repoint endpoint, identity, cost cap, or credential", () => {
  const payload = launcherPayload();
  const baseline = runLauncher(readFileSync(DRY_RUN, "utf8"));
  const override = runLauncher(JSON.stringify({
    ...payload,
    endpoint: "https://evil.example/alpha",
    method: "GET",
    model: "typesafe/jev-latest",
    cost_cap: 99,
    credential: "sk-override-must-not-escape",
    redirect: "follow",
  }));
  assert.equal(override.status, 0);
  const overrideResult = singleJsonLine(override.out);
  assert.deepEqual(overrideResult, singleJsonLine(baseline.out));
  const observation = record(overrideResult.observation);
  assert.equal(observation.endpoint, DECISIONS_ENDPOINT);
  assert.deepEqual(observation.requested_identity, REQUESTED_IDENTITY);
  assert.equal(record(observation.cost).amount, 0.000017934);
  assert.equal(override.out.includes("evil.example"), false);
  assert.equal(override.out.includes("sk-override-must-not-escape"), false);
  assert.equal(override.out.includes("typesafe/jev-latest"), false);
});

test("[env:container-launcher] privacy, cost, and provider metadata failures close with bounded records", () => {
  const payload = launcherPayload();

  const pii = runLauncher(JSON.stringify({
    ...payload,
    state: { schema_version: "support-triage-input/v1", values: { case_type: "billing", note: "call John at 555-0100" } },
  }));
  assert.equal(pii.status, 1);
  const piiResult = singleJsonLine(pii.out);
  assert.equal(piiResult.ok, false);
  assert.equal(record(piiResult.record).reason_code, "evidence:R10");
  assert.equal(pii.out.includes("555-0100"), false);
  assert.equal(pii.out.includes("note"), false);

  const overCap = runLauncher(JSON.stringify({
    ...payload,
    synthetic_response: { ...record(payload.synthetic_response), cost: { amount: 0.02, currency: "USD" } },
  }));
  assert.equal(overCap.status, 1);
  const overCapResult = singleJsonLine(overCap.out);
  assert.equal(overCapResult.ok, false);
  assert.equal(record(overCapResult.record).reason_code, "evidence:R13");
  assert.equal(overCap.out.includes('"cost"'), false);

  const withoutModel = launcherPayload();
  const synthetic = record(withoutModel.synthetic_response);
  const shortened: Record<string, unknown> = { ...synthetic };
  delete shortened.model;
  withoutModel.synthetic_response = shortened;
  const hold = runLauncher(JSON.stringify(withoutModel));
  assert.equal(hold.status, 1);
  const holdResult = singleJsonLine(hold.out);
  assert.equal(holdResult.ok, false);
  const holdRecord = record(holdResult.record);
  assert.equal(holdRecord.reason_code, "evidence:R12");
  assert.equal(holdRecord.status, "hold");
  assert.equal(holdRecord.disposition, "pending-coordinator");
  assert.equal(hold.out.includes("typesafe/jev-1.13-20260917"), false);
});
