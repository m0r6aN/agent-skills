import { canonicalDigest } from "../src/canonical-json.ts";
import { executeDecision, DECISIONS_ENDPOINT } from "../src/runtime.ts";
import { QUESTIONS, REQUESTED_IDENTITY } from "../src/validator.ts";

const MAX_INPUT_BYTES = 256 * 1024;
const DRY_RUN_KEY = "jev-container-dry-run-placeholder";

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function output(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function launcherFailure(error) {
  // Keep malformed-input diagnostics generic so input fields are never echoed.
  output({ ok: false, error });
  return 2;
}

async function readJsonStdin() {
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += Buffer.byteLength(chunk);
    if (size > MAX_INPUT_BYTES) throw new Error("input too large");
    chunks.push(chunk);
  }
  const text = chunks.join("").trim();
  if (text.length === 0) throw new Error("empty input");
  return JSON.parse(text);
}

function buildRequest(state) {
  return {
    schema_version: "jev-decisions/v1",
    capability: "openrouter-alpha-decisions",
    requested_identity: REQUESTED_IDENTITY,
    state,
    questions: QUESTIONS,
  };
}

function buildRuntimeInput(payload) {
  if (!isRecord(payload) || payload.mode !== "dry-run") throw new Error("unsupported mode");
  if (!isRecord(payload.state) || !isRecord(payload.lease) || !isRecord(payload.budget_ack) || !isRecord(payload.custody)) throw new Error("missing runtime fields");

  const requestDigest = canonicalDigest(buildRequest(payload.state));
  const lease = {
    lease_id: payload.lease.lease_id,
    run_id: payload.lease.run_id,
    capability: "openrouter-alpha-decisions",
    decision_schema_version: "jev-decisions/v1",
    request_digest: requestDigest,
    state: "in-flight",
    claimed_at_utc: payload.lease.claimed_at_utc,
    transition_actor: "coordinator",
  };

  const budgetWithoutDigest = {
    schema_version: payload.budget_ack.schema_version,
    mode: payload.budget_ack.mode,
    provider: payload.budget_ack.provider,
    account_ref: payload.budget_ack.account_ref,
    cap_amount: payload.budget_ack.cap_amount,
    currency: payload.budget_ack.currency,
    acknowledged_at_utc: payload.budget_ack.acknowledged_at_utc,
    repository: payload.budget_ack.repository,
    ref: payload.budget_ack.ref,
    path: payload.budget_ack.path,
    commit: payload.budget_ack.commit,
    tree: payload.budget_ack.tree,
    lease_id: lease.lease_id,
    run_id: lease.run_id,
    capability: lease.capability,
    decision_schema_version: lease.decision_schema_version,
    request_digest: requestDigest,
  };
  const budget_ack = {
    ...budgetWithoutDigest,
    acknowledgement_digest: canonicalDigest(budgetWithoutDigest),
  };

  const ticks = Array.isArray(payload.clock) ? payload.clock : [];
  let clockIndex = 0;
  const clock = {
    now: () => ticks[Math.min(clockIndex++, Math.max(ticks.length - 1, 0))] ?? "not-a-timestamp",
  };

  const synthetic = isRecord(payload.synthetic_response) ? payload.synthetic_response : {};
  const socketOpenedAt = typeof payload.socket_opened_at_utc === "string"
    ? payload.socket_opened_at_utc
    : "not-a-timestamp";
  const body = new TextEncoder().encode(JSON.stringify(synthetic));

  const lease_port = {
    claim: async () => ({ lease }),
    consume: async () => true,
    terminal: async () => undefined,
  };
  const transport = {
    post: async () => ({
      status: 200,
      content_type: "application/json",
      body,
      socket_opened_at_utc: socketOpenedAt,
      authority: {
        endpoint: DECISIONS_ENDPOINT,
        method: "POST",
        redirects: "disabled",
        tls: "verified",
        proxy: "none",
      },
    }),
  };

  return { state: payload.state, lease, budget_ack, custody: payload.custody, clock, lease_port, transport };
}

async function main() {
  let payload;
  try {
    payload = await readJsonStdin();
  } catch {
    return launcherFailure("invalid_input");
  }

  let runtimeInput;
  try {
    runtimeInput = buildRuntimeInput(payload);
  } catch {
    return launcherFailure("invalid_input");
  }

  // executeDecision intentionally checks for a credential before transport. The
  // dry-run marker satisfies that guard without reading or exposing a real key.
  process.env.OPENROUTER_API_KEY = DRY_RUN_KEY;
  try {
    const result = await executeDecision(runtimeInput);
    output(result);
    return result.ok ? 0 : 1;
  } catch {
    return launcherFailure("execution_error");
  } finally {
    delete process.env.OPENROUTER_API_KEY;
  }
}

process.exitCode = await main();
