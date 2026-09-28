/** Legacy governed inference is retired; public contracts remain for consumers. */
import type { ProviderIdentity, SupportTriageState } from "./types.ts";

export const DECISIONS_ENDPOINT = "https://openrouter.ai/api/alpha/decisions";
export const CAPABILITY = "openrouter-alpha-decisions";
export const DECISION_SCHEMA_VERSION = "jev-decisions/v1";
type Status = "refused" | "hold";

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

export class LegacyDecisionRetiredError extends Error {
  readonly code = "LEGACY_EXECUTION_RETIRED" as const;

  constructor() {
    super("Legacy governed inference is retired.");
    this.name = "LegacyDecisionRetiredError";
  }
}

/** No argument, credential, clock, lease or transport is inspected. */
export async function executeDecision(_input: RuntimeInput): Promise<RuntimeResult> {
  throw new LegacyDecisionRetiredError();
}
