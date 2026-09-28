export type ProviderIdentity = {
  readonly provider: "openrouter";
  readonly model: "typesafe/jev-1.13";
  readonly surface: "alpha-decisions";
};

export type StateValues = {
  readonly case_type?: "billing" | "technical" | "sales" | "other";
  readonly urgency_signal?: number;
  readonly frustration_signal?: number;
  readonly contact_channel?: "email" | "chat" | "phone";
};

export type SupportTriageState = {
  readonly schema_version: "support-triage-input/v1";
  readonly values: StateValues;
};

export type Criterion = {
  readonly key: string;
  readonly description: string;
};

export type NoulQuestion = {
  readonly name: "is_urgent";
  readonly type: "noul";
  readonly instructions: readonly ["support_triage_v1"];
  readonly criteria: readonly [Criterion];
};

export type ChoiceQuestion = {
  readonly name: "department";
  readonly type: "choice";
  readonly instructions: readonly ["support_triage_v1"];
  readonly criteria: readonly [Criterion];
  readonly choices: readonly ["billing", "technical", "sales"];
};

export type ScoreQuestion = {
  readonly name: "frustration";
  readonly type: "score";
  readonly instructions: readonly ["support_triage_v1"];
  readonly criteria: readonly [Criterion];
  readonly score_label: "frustration_score";
};

export type Question = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export type RequestEnvelope = {
  readonly schema_version: "jev-decisions/v1";
  readonly capability: "openrouter-alpha-decisions";
  readonly requested_identity: ProviderIdentity;
  readonly state: SupportTriageState;
  readonly questions: readonly [NoulQuestion, ChoiceQuestion, ScoreQuestion];
};

export type ServedIdentity = {
  readonly model: string;
  readonly response_id: string;
  readonly source: "provider-declared";
};

export type NoulAnswer = {
  readonly name: "is_urgent";
  readonly type: "noul";
  readonly criteria: readonly [Criterion];
  readonly value: number;
  readonly confidence: number;
};

export type ChoiceAnswer = {
  readonly name: "department";
  readonly type: "choice";
  readonly criteria: readonly [Criterion];
  readonly value: "billing" | "technical" | "sales";
  readonly confidence: number;
  readonly distribution: {
    readonly billing: number;
    readonly technical: number;
    readonly sales: number;
  };
};

export type ScoreAnswer = {
  readonly name: "frustration";
  readonly type: "score";
  readonly criteria: readonly [Criterion];
  readonly value: number;
  readonly confidence: number;
};

export type Answer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export type ResponseEnvelope = {
  readonly schema_version: "jev-decisions/v1";
  readonly capability: "openrouter-alpha-decisions";
  readonly requested_identity: ProviderIdentity;
  readonly served_identity: ServedIdentity;
  readonly response_id: string;
  readonly server_timestamp_utc: string;
  readonly answers: readonly [NoulAnswer, ChoiceAnswer, ScoreAnswer];
};

export type ReasonCode =
  | "R09" | "R10" | "R11" | "R12"
  | "R17" | "R18" | "R19" | "R20" | "R21" | "R22" | "R23";

export type ValidationSuccess<T> = { readonly ok: true; readonly value: T };
export type ValidationFailure = {
  readonly ok: false;
  readonly status: "refused" | "hold";
  readonly reason: ReasonCode;
};
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export type ValidatedRequest = RequestEnvelope;
export type ValidatedResponse = ResponseEnvelope;

export type ManifestEntry = {
  readonly schema_version: "jev-decisions/v1";
  readonly manifest_id: string;
  readonly fixture_id: string;
  readonly repository: "agent-skills";
  readonly ref: string;
  readonly path: string;
  readonly commit: string;
  readonly tree: string;
  readonly request_digest: string;
  readonly response_digest: string;
  readonly provenance_digest: string;
};

export type Provenance = {
  readonly fixture_id: string;
  readonly source_kind: "sanitized-fixture";
  readonly source_ref: string;
  readonly captured_at_utc: string;
  readonly authenticated_response_id: string;
  readonly manifest_id: string;
  readonly repository: "agent-skills";
  readonly ref: string;
  readonly path: string;
  readonly manifest_commit: string;
  readonly manifest_tree: string;
};

export type CompleteFixture = {
  readonly evidence_class: "sanitized-replay-fixture";
  readonly repository: "agent-skills";
  readonly ref: string;
  readonly path: string;
  readonly commit: string;
  readonly tree: string;
  readonly manifest_id: string;
  readonly fixture_id: string;
  readonly provenance: Provenance;
  readonly provenance_digest: string;
  readonly schema_version: "jev-decisions/v1";
  readonly requested_identity: ProviderIdentity;
  readonly served_identity: ServedIdentity;
  readonly response_id: string;
  readonly server_timestamp_utc: string;
  readonly request: RequestEnvelope;
  readonly response: ResponseEnvelope;
  readonly request_digest: string;
  readonly response_digest: string;
  readonly manifest_entry: ManifestEntry;
  readonly source_kind: "sanitized-fixture";
  readonly source_ref: string;
  readonly status: "complete";
  readonly reason_code: "none";
  readonly retention_until_utc: string;
};

export type RefusalFixture = {
  readonly evidence_class: "refusal-record";
  readonly status: "refused";
  readonly reason_code: `evidence:R${number}`;
  readonly source_kind: "coordinator-review";
  readonly source_ref: string;
  readonly recorded_at_utc: string;
  readonly retention_until_utc: string;
};

export type HoldFixture = {
  readonly evidence_class: "hold-record";
  readonly status: "hold";
  readonly reason_code: `evidence:R${number}`;
  readonly disposition: "pending-coordinator";
  readonly source_kind: "coordinator-review";
  readonly source_ref: string;
  readonly recorded_at_utc: string;
  readonly retention_until_utc: string;
};

export type ReplayFixture = CompleteFixture | RefusalFixture | HoldFixture;

export type ManifestReceipt = {
  readonly receipt_schema_version: "jev-manifest-receipt/v1";
  readonly authority: "coordinator-manifest-resolver-v1";
  readonly receipt_id: string;
  readonly resolution: "resolved";
  readonly manifest_id: string;
  readonly fixture_id: string;
  readonly repository: "agent-skills";
  readonly ref: string;
  readonly path: string;
  readonly commit: string;
  readonly tree: string;
  readonly request_digest: string;
  readonly response_digest: string;
  readonly provenance_digest: string;
  readonly resolved_at_utc: string;
};

export type ReplayResult = ValidationResult<ReplayFixture>;
