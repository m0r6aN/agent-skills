import { canonicalDigest, canonicalize } from "./canonical-json.ts";
import {
  QUESTIONS, REQUESTED_IDENTITY, validateRequest, validateResponse,
} from "./validator.ts";
import type {
  ProviderIdentity, RequestEnvelope, ResponseEnvelope, SupportTriageState,
  ValidatedRequest, ValidatedResponse,
} from "./types.ts";

export const DECISIONS_ENDPOINT = "https://openrouter.ai/api/alpha/decisions";
export const CAPABILITY = "openrouter-alpha-decisions";
export const DECISION_SCHEMA_VERSION = "jev-decisions/v1";
const REQUEST_LIMIT = 65_536;
const RESPONSE_LIMIT = 65_536;
const COST_CAP = 0.01;
const MAX_AGE_MS = 60_000;
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const ID_PATTERNS = {
  run: /^run-[0-9a-f]{32}$/,
  lease: /^lease-[0-9a-f]{32}$/,
  source: /^src-[0-9a-f]{32}$/,
  response: /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/,
  model: /^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/,
  sha: /^[0-9a-f]{64}$/,
  commit: /^[0-9a-f]{40}$/,
};
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const CUSTODY_PATHS = new Set([
  "plugins/foreman-line/jev-decisions/tests/fixtures/complete.json",
  "plugins/foreman-line/jev-decisions/tests/fixtures/refused.json",
  "plugins/foreman-line/jev-decisions/tests/fixtures/hold.json",
]);
const REFS = new Set(["main", "codex/jev-p0-contract", "codex/jev-p1-typed-validator-and-fixture-replay"]);

type Status = "refused" | "hold";
type Reason = "R04" | "R05" | "R09" | "R10" | "R11" | "R12" | "R13" | "R14" | "R15" | "R16" | "R17" | "R18" | "R19" | "R20" | "R21" | "R22" | "R23";

export type LeaseRecord = {
  readonly lease_id: string;
  readonly run_id: string;
  readonly capability: typeof CAPABILITY;
  readonly decision_schema_version: typeof DECISION_SCHEMA_VERSION;
  readonly request_digest: string;
  readonly state: "in-flight";
  readonly claimed_at_utc: string;
  readonly transition_actor: "coordinator";
};

export type BudgetAcknowledgement = {
  readonly schema_version: "jev-budget/v1";
  readonly mode: "provider-hard-budget" | "account-hard-budget";
  readonly provider: "openrouter";
  readonly account_ref: string;
  readonly cap_amount: 0.01;
  readonly currency: "USD";
  readonly acknowledged_at_utc: string;
  readonly acknowledgement_digest: string;
  readonly repository: "agent-skills";
  readonly ref: string;
  readonly path: string;
  readonly commit: string;
  readonly tree: string;
  readonly lease_id: string;
  readonly run_id: string;
  readonly capability: typeof CAPABILITY;
  readonly decision_schema_version: typeof DECISION_SCHEMA_VERSION;
  readonly request_digest: string;
};

export type CustodyMetadata = {
  readonly source_ref: string;
  readonly repository: "agent-skills";
  readonly ref: string;
  readonly path: string;
  readonly commit: string;
  readonly tree: string;
};

export type Clock = { readonly now: () => string };

export type LeasePort = {
  readonly claim: (request: { readonly run_id: string; readonly lease_id: string; readonly request_digest: string }) => Promise<"occupied" | "unavailable" | { readonly lease: LeaseRecord }>;
  readonly consume: (lease: LeaseRecord) => Promise<boolean>;
  readonly terminal: (lease: LeaseRecord) => Promise<void>;
};

export type TransportResponse = {
  readonly status: number;
  readonly content_type: string;
  readonly body: Uint8Array;
  readonly socket_opened_at_utc: string;
  readonly authority: {
    readonly endpoint: typeof DECISIONS_ENDPOINT;
    readonly method: "POST";
    readonly redirects: "disabled";
    readonly tls: "verified";
    readonly proxy: "none";
  };
};

export type TransportPort = {
  readonly post: (request: {
    readonly endpoint: typeof DECISIONS_ENDPOINT;
    readonly method: "POST";
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string;
    readonly timeout_ms: 30_000;
    readonly redirect: "error";
    readonly signal: AbortSignal;
  }) => Promise<TransportResponse>;
};

export type RuntimeInput = {
  readonly state: SupportTriageState;
  readonly lease: LeaseRecord;
  readonly budget_ack: BudgetAcknowledgement;
  readonly custody: CustodyMetadata;
  readonly clock: Clock;
  readonly lease_port: LeasePort;
  readonly transport: TransportPort;
};

export type Usage = {
  readonly input_tokens: number;
  readonly output_tokens: number;
  readonly total_tokens: number;
};

export type Cost = { readonly amount: number; readonly currency: "USD" };

export type LiveObservation = {
  readonly evidence_class: "live-observation";
  readonly capability: typeof CAPABILITY;
  readonly run_id: string;
  readonly lease_id: string;
  readonly endpoint: typeof DECISIONS_ENDPOINT;
  readonly requested_identity: ProviderIdentity;
  readonly served_identity: { readonly model: string; readonly response_id: string; readonly source: "provider-declared" };
  readonly schema_version: typeof DECISION_SCHEMA_VERSION;
  readonly response_id: string;
  readonly server_timestamp_utc: string;
  readonly client_timestamp_utc: string;
  readonly run_started_at_utc: string;
  readonly acknowledged_at_utc: string;
  readonly transmission_started_at_utc: string;
  readonly socket_opened_at_utc: string;
  readonly request_digest: string;
  readonly response_digest: string;
  readonly usage: Usage;
  readonly cost: Cost;
  readonly budget_ack: BudgetAcknowledgement;
  readonly source_kind: "coordinator-live";
  readonly source_ref: string;
  readonly status: "complete";
  readonly reason_code: "none";
  readonly retention_until_utc: string;
};

export type GenericRecord = {
  readonly evidence_class: "refusal-record" | "hold-record";
  readonly status: Status;
  readonly reason_code: `evidence:R${number}`;
  readonly disposition?: "pending-coordinator";
  readonly source_kind: "coordinator-review";
  readonly source_ref: string;
  readonly recorded_at_utc: string;
  readonly retention_until_utc: string;
};

export type RuntimeResult =
  | { readonly ok: true; readonly observation: LiveObservation }
  | { readonly ok: false; readonly record: GenericRecord };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function utc(value: unknown): value is string {
  return typeof value === "string" && UTC.test(value) && !Number.isNaN(Date.parse(value));
}

function generated(value: unknown, kind: keyof typeof ID_PATTERNS): value is string {
  return typeof value === "string" && ID_PATTERNS[kind].test(value);
}

function boundedRetention(anchor: string, end: string): boolean {
  return utc(anchor) && utc(end) && Date.parse(end) >= Date.parse(anchor) && Date.parse(end) <= Date.parse(anchor) + RETENTION_MS;
}

function later(anchor: string, end: string): boolean { return Date.parse(end) >= Date.parse(anchor); }

function duplicateJsonKeys(text: string): boolean {
  let index = 0;
  const whitespace = () => { while (/\s/.test(text[index] ?? "")) index += 1; };
  const stringEnd = (): number => {
    if (text[index] !== '"') return -1;
    index += 1;
    while (index < text.length) {
      if (text[index] === "\\") { index += 2; continue; }
      if (text[index] === '"') { index += 1; return index; }
      index += 1;
    }
    return -1;
  };
  const value = (): boolean => {
    whitespace();
    if (text[index] === "{") {
      index += 1;
      const keys = new Set<string>();
      whitespace();
      if (text[index] === "}") { index += 1; return false; }
      while (index < text.length) {
        const keyStart = index;
        const keyEnd = stringEnd();
        if (keyEnd < 0) return false;
        let key: unknown;
        try { key = JSON.parse(text.slice(keyStart, keyEnd)); } catch { return false; }
        if (typeof key !== "string") return false;
        if (keys.has(key)) return true;
        keys.add(key);
        whitespace();
        if (text[index] !== ":") return false;
        index += 1;
        if (value()) return true;
        whitespace();
        if (text[index] === "}") { index += 1; return false; }
        if (text[index] !== ",") return false;
        index += 1;
        whitespace();
      }
      return false;
    }
    if (text[index] === "[") {
      index += 1;
      whitespace();
      if (text[index] === "]") { index += 1; return false; }
      while (index < text.length) {
        if (value()) return true;
        whitespace();
        if (text[index] === "]") { index += 1; return false; }
        if (text[index] !== ",") return false;
        index += 1;
        whitespace();
      }
      return false;
    }
    if (text[index] === '"') return stringEnd() < 0;
    while (index < text.length && !",]}".includes(text[index])) index += 1;
    return false;
  };
  return value();
}

function equalAuthority(value: unknown): boolean {
  return isRecord(value) && exactKeys(value, ["endpoint", "method", "redirects", "tls", "proxy"]) && value.endpoint === DECISIONS_ENDPOINT && value.method === "POST" && value.redirects === "disabled" && value.tls === "verified" && value.proxy === "none";
}

async function terminal(port: LeasePort, lease: LeaseRecord): Promise<boolean> {
  try { await port.terminal(lease); return true; } catch { return false; }
}

async function consumeThenTerminal(port: LeasePort, lease: LeaseRecord): Promise<boolean> {
  try { await port.consume(lease); } catch { /* refusal remains closed */ }
  return terminal(port, lease);
}

async function closedFailure(input: RuntimeInput, lease: LeaseRecord, status: Status, reason: Reason, recordedAt: string): Promise<RuntimeResult> {
  if (!(await terminal(input.lease_port, lease))) return generic(input, "hold", "R15", recordedAt);
  return generic(input, status, reason, recordedAt);
}

function generic(input: RuntimeInput, status: Status, reason: Reason, recordedAt: string): RuntimeResult {
  const retention = new Date(Date.parse(recordedAt) + RETENTION_MS).toISOString();
  const sourceRef = generated(input.custody.source_ref, "source") ? input.custody.source_ref : "src-00000000000000000000000000000000";
  if (status === "hold") return { ok: false, record: { evidence_class: "hold-record", status, reason_code: `evidence:${reason}`, disposition: "pending-coordinator", source_kind: "coordinator-review", source_ref: sourceRef, recorded_at_utc: recordedAt, retention_until_utc: retention } };
  return { ok: false, record: { evidence_class: "refusal-record", status, reason_code: `evidence:${reason}`, source_kind: "coordinator-review", source_ref: sourceRef, recorded_at_utc: recordedAt, retention_until_utc: retention } };
}

function buildRequest(state: SupportTriageState): RequestEnvelope {
  return { schema_version: DECISION_SCHEMA_VERSION, capability: CAPABILITY, requested_identity: REQUESTED_IDENTITY, state, questions: QUESTIONS };
}

function validateCustody(value: CustodyMetadata): boolean {
  return generated(value.source_ref, "source") && value.repository === "agent-skills" && REFS.has(value.ref) && CUSTODY_PATHS.has(value.path) && generated(value.commit, "commit") && generated(value.tree, "commit");
}

function validateLease(value: LeaseRecord, requestDigest: string): boolean {
  return generated(value.lease_id, "lease") && generated(value.run_id, "run") && value.capability === CAPABILITY && value.decision_schema_version === DECISION_SCHEMA_VERSION && value.request_digest === requestDigest && generated(value.request_digest, "sha") && value.state === "in-flight" && utc(value.claimed_at_utc) && value.transition_actor === "coordinator";
}

function validateBudget(value: BudgetAcknowledgement, input: RuntimeInput, lease: LeaseRecord, requestDigest: string, now: string): Reason | null {
  const keys = ["schema_version", "mode", "provider", "account_ref", "cap_amount", "currency", "acknowledged_at_utc", "acknowledgement_digest", "repository", "ref", "path", "commit", "tree", "lease_id", "run_id", "capability", "decision_schema_version", "request_digest"];
  if (!isRecord(value) || !exactKeys(value, keys)) return "R14";
  if (value.schema_version !== "jev-budget/v1" || !["provider-hard-budget", "account-hard-budget"].includes(value.mode as string) || value.provider !== "openrouter" || typeof value.account_ref !== "string" || !/^acct-[0-9a-f]{32}$/.test(value.account_ref) || value.cap_amount !== COST_CAP || value.currency !== "USD" || !utc(value.acknowledged_at_utc) || !generated(value.acknowledgement_digest, "sha") || value.repository !== "agent-skills" || !REFS.has(value.ref as string) || !CUSTODY_PATHS.has(value.path as string) || !generated(value.commit, "commit") || !generated(value.tree, "commit") || value.repository !== input.custody.repository || value.ref !== input.custody.ref || value.path !== input.custody.path || value.commit !== input.custody.commit || value.tree !== input.custody.tree || value.lease_id !== lease.lease_id || value.run_id !== lease.run_id || value.capability !== CAPABILITY || value.decision_schema_version !== DECISION_SCHEMA_VERSION || value.request_digest !== requestDigest) return "R14";
  try {
    const withoutDigest = { ...value } as Record<string, unknown>;
    delete withoutDigest.acknowledgement_digest;
    if (canonicalDigest(withoutDigest) !== value.acknowledgement_digest) return "R14";
  } catch { return "R14"; }
  if (!later(lease.claimed_at_utc, value.acknowledged_at_utc) || !later(value.acknowledged_at_utc, now) || Date.parse(now) - Date.parse(value.acknowledged_at_utc) > MAX_AGE_MS) return "R14";
  return null;
}

function normalizeProvider(value: unknown): { response: ResponseEnvelope; usage: Usage; cost: Cost } | { reason: Reason; status: Status } {
  if (!isRecord(value)) return { reason: "R10", status: "refused" };
  if (!Object.prototype.hasOwnProperty.call(value, "answers") || !Object.prototype.hasOwnProperty.call(value, "usage")) return { reason: "R10", status: "refused" };
  if (!Object.prototype.hasOwnProperty.call(value, "model") || !Object.prototype.hasOwnProperty.call(value, "response_id") || !Object.prototype.hasOwnProperty.call(value, "server_timestamp_utc")) return { reason: "R12", status: "hold" };
  if (!Object.prototype.hasOwnProperty.call(value, "cost")) return { reason: "R13", status: "hold" };
  if (!exactKeys(value, ["model", "response_id", "server_timestamp_utc", "answers", "usage", "cost"])) return { reason: "R10", status: "refused" };
  if (!generated(value.model, "model") || !generated(value.response_id, "response") || value.response_id === "none" || !utc(value.server_timestamp_utc)) return { reason: "R10", status: "refused" };
  if (!isRecord(value.answers) || !exactKeys(value.answers, ["is_urgent", "department", "frustration"]) || !isRecord(value.usage) || !isRecord(value.cost)) return { reason: "R10", status: "refused" };
  const usage = value.usage;
  if (!exactKeys(usage, ["input_tokens", "output_tokens", "total_tokens"]) || !Number.isInteger(usage.input_tokens) || !Number.isInteger(usage.output_tokens) || !Number.isInteger(usage.total_tokens) || usage.input_tokens < 0 || usage.output_tokens < 0 || usage.input_tokens > 65_536 || usage.output_tokens > 65_536 || usage.total_tokens !== usage.input_tokens + usage.output_tokens || usage.total_tokens > 131_072) return { reason: "R10", status: "refused" };
  const cost = value.cost;
  if (!exactKeys(cost, ["amount", "currency"])) return { reason: "R13", status: "refused" };
  if (typeof cost.amount !== "number" || !Number.isFinite(cost.amount) || cost.amount < 0 || cost.amount > COST_CAP || cost.currency !== "USD") return { reason: "R13", status: "refused" };
  const answers = value.answers;
  const urgent = answers.is_urgent;
  const department = answers.department;
  const frustration = answers.frustration;
  if (!isRecord(urgent) || !isRecord(department) || !isRecord(frustration) || !exactKeys(urgent, ["noul", "confidence"]) || !exactKeys(department, ["choice", "confidence", "probabilities"]) || !exactKeys(frustration, ["score", "confidence"]) || !Object.prototype.hasOwnProperty.call(urgent, "noul") || !Object.prototype.hasOwnProperty.call(department, "choice") || !Object.prototype.hasOwnProperty.call(department, "probabilities") || !Object.prototype.hasOwnProperty.call(frustration, "score")) return { reason: "R10", status: "refused" };
  if (!isRecord(department.probabilities) || !exactKeys(department.probabilities, ["billing", "technical", "sales"])) return { reason: "R11", status: "refused" };
  const response = {
    schema_version: DECISION_SCHEMA_VERSION,
    capability: CAPABILITY,
    requested_identity: REQUESTED_IDENTITY,
    served_identity: { model: value.model, response_id: value.response_id, source: "provider-declared" as const },
    response_id: value.response_id,
    server_timestamp_utc: value.server_timestamp_utc,
    answers: [
      { name: "is_urgent" as const, type: "noul" as const, criteria: [QUESTIONS[0].criteria[0]], value: urgent.noul, confidence: urgent.confidence },
      { name: "department" as const, type: "choice" as const, criteria: [QUESTIONS[1].criteria[0]], value: department.choice, confidence: department.confidence, distribution: { billing: department.probabilities.billing, technical: department.probabilities.technical, sales: department.probabilities.sales } },
      { name: "frustration" as const, type: "score" as const, criteria: [QUESTIONS[2].criteria[0]], value: frustration.score, confidence: frustration.confidence },
    ],
  } as unknown as ResponseEnvelope;
  return { response, usage: usage as unknown as Usage, cost: cost as unknown as Cost };
}

export async function executeDecision(input: RuntimeInput): Promise<RuntimeResult> {
  const recordedAt = input.clock.now();
  if (!utc(recordedAt) || !validateCustody(input.custody)) return generic(input, "refused", "R22", recordedAt);
  const request = buildRequest(input.state);
  const requestValidation = validateRequest(request);
  if (!requestValidation.ok) return generic(input, "refused", "R10", recordedAt);
  let requestDigest: string;
  let body: string;
  try { requestDigest = canonicalDigest(request); body = canonicalize(request); } catch { return generic(input, "refused", "R17", recordedAt); }
  if (new TextEncoder().encode(body).byteLength > REQUEST_LIMIT) return generic(input, "refused", "R05", recordedAt);
  if (!validateLease(input.lease, requestDigest)) return generic(input, "hold", "R15", recordedAt);
  let claim: "occupied" | "unavailable" | { readonly lease: LeaseRecord };
  try { claim = await input.lease_port.claim({ run_id: input.lease.run_id, lease_id: input.lease.lease_id, request_digest: requestDigest }); } catch { return generic(input, "hold", "R15", recordedAt); }
  if (claim === "unavailable") return generic(input, "hold", "R15", recordedAt);
  if (claim === "occupied") return generic(input, "refused", "R16", recordedAt);
  if (!isRecord(claim) || !isRecord(claim.lease)) return generic(input, "hold", "R15", recordedAt);
  const lease = claim.lease as unknown as LeaseRecord;
  if (!validateLease(lease, requestDigest)) {
    if (generated(lease.lease_id, "lease") && generated(lease.run_id, "run") && lease.lease_id === input.lease.lease_id && lease.run_id === input.lease.run_id) await terminal(input.lease_port, lease);
    return generic(input, "hold", "R15", recordedAt);
  }
  if (lease.lease_id !== input.lease.lease_id || lease.run_id !== input.lease.run_id) return generic(input, "refused", "R16", recordedAt);
  const budgetNow = input.clock.now();
  const budgetReason = validateBudget(input.budget_ack, input, lease, requestDigest, budgetNow);
  if (budgetReason !== null) { if (!(await consumeThenTerminal(input.lease_port, lease))) return generic(input, "hold", "R15", recordedAt); return generic(input, "hold", budgetReason, recordedAt); }
  const budgetSnapshot = JSON.parse(canonicalize(input.budget_ack)) as BudgetAcknowledgement;
  let consumed = false;
  try { consumed = await input.lease_port.consume(lease); } catch { consumed = false; }
  if (!consumed) return closedFailure(input, lease, "refused", "R16", recordedAt);
  const transmissionStarted = input.clock.now();
  if (!utc(transmissionStarted) || !later(lease.claimed_at_utc, transmissionStarted) || !later(budgetSnapshot.acknowledged_at_utc, transmissionStarted) || Date.parse(transmissionStarted) - Date.parse(budgetSnapshot.acknowledged_at_utc) > MAX_AGE_MS) return closedFailure(input, lease, "hold", "R14", recordedAt);
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (typeof apiKey !== "string" || apiKey.length === 0 || /[\r\n]/.test(apiKey)) return closedFailure(input, lease, "refused", "R06", recordedAt);
  let transportResponse: TransportResponse;
  try {
    transportResponse = await input.transport.post({ endpoint: DECISIONS_ENDPOINT, method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "application/json" }, body, timeout_ms: 30_000, redirect: "error", signal: AbortSignal.timeout(30_000) });
  } catch { return closedFailure(input, lease, "refused", "R04", recordedAt); }
  let socketOpened: string;
  try {
    if (!isRecord(transportResponse) || !(transportResponse.body instanceof Uint8Array) || typeof transportResponse.content_type !== "string" || !Number.isInteger(transportResponse.status) || !equalAuthority(transportResponse.authority)) throw new Error("malformed transport");
    socketOpened = transportResponse.socket_opened_at_utc;
    if (!utc(socketOpened) || Date.parse(socketOpened) < Date.parse(transmissionStarted) || Date.parse(socketOpened) - Date.parse(budgetSnapshot.acknowledged_at_utc) >= MAX_AGE_MS || transportResponse.body.byteLength > RESPONSE_LIMIT || transportResponse.status < 200 || transportResponse.status >= 300 || transportResponse.content_type.toLowerCase() !== "application/json") throw new Error("rejected transport");
  } catch { return closedFailure(input, lease, "refused", "R04", recordedAt); }
  let providerBody: unknown;
  try {
    const bodyText = new TextDecoder("utf-8", { fatal: true }).decode(transportResponse.body);
    if (duplicateJsonKeys(bodyText)) throw new Error("duplicate JSON key");
    providerBody = JSON.parse(bodyText);
  } catch { await terminal(input.lease_port, lease); return generic(input, "refused", "R04", recordedAt); }
  const normalized = normalizeProvider(providerBody);
  if ("reason" in normalized) return closedFailure(input, lease, normalized.status, normalized.reason, recordedAt);
  const responseValidation = validateResponse(requestValidation.value as ValidatedRequest, normalized.response);
  if (!responseValidation.ok) return closedFailure(input, lease, responseValidation.status, responseValidation.reason, recordedAt);
  let responseDigest: string;
  try { responseDigest = canonicalDigest(responseValidation.value); } catch { return closedFailure(input, lease, "refused", "R17", recordedAt); }
  const clientTimestamp = input.clock.now();
  if (!utc(clientTimestamp) || !later(socketOpened, clientTimestamp)) return closedFailure(input, lease, "refused", "R10", recordedAt);
  if (!(await terminal(input.lease_port, lease))) return generic(input, "hold", "R15", recordedAt);
  const retention = new Date(Date.parse(clientTimestamp) + RETENTION_MS).toISOString();
  const observation: LiveObservation = {
    evidence_class: "live-observation", capability: CAPABILITY, run_id: lease.run_id, lease_id: lease.lease_id, endpoint: DECISIONS_ENDPOINT,
    requested_identity: JSON.parse(canonicalize(REQUESTED_IDENTITY)) as ProviderIdentity, served_identity: JSON.parse(canonicalize(responseValidation.value.served_identity)), schema_version: DECISION_SCHEMA_VERSION,
    response_id: responseValidation.value.response_id, server_timestamp_utc: responseValidation.value.server_timestamp_utc, client_timestamp_utc: clientTimestamp,
    run_started_at_utc: lease.claimed_at_utc, acknowledged_at_utc: budgetSnapshot.acknowledged_at_utc, transmission_started_at_utc: transmissionStarted,
    socket_opened_at_utc: socketOpened, request_digest: requestDigest, response_digest: responseDigest, usage: normalized.usage, cost: normalized.cost,
    budget_ack: budgetSnapshot, source_kind: "coordinator-live", source_ref: input.custody.source_ref, status: "complete", reason_code: "none", retention_until_utc: retention,
  };
  return { ok: true, observation };
}
