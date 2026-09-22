import { canonicalDigest, canonicalize } from "./canonical-json.ts";
import type {
  Answer, ChoiceAnswer, ChoiceQuestion, Criterion, ProviderIdentity,
  RequestEnvelope, ResponseEnvelope, ServedIdentity, ValidationResult,
  ValidatedRequest, ValidatedResponse,
} from "./types.ts";

const REQUEST_KEYS = ["schema_version", "capability", "requested_identity", "state", "questions"];
const IDENTITY_KEYS = ["provider", "model", "surface"];
const STATE_KEYS = ["schema_version", "values"];
const STATE_VALUE_KEYS = ["case_type", "urgency_signal", "frustration_signal", "contact_channel"];
const QUESTION_KEYS = ["name", "type", "instructions", "criteria"];
const CHOICE_QUESTION_KEYS = [...QUESTION_KEYS, "choices"];
const SCORE_QUESTION_KEYS = [...QUESTION_KEYS, "score_label"];
const RESPONSE_KEYS = ["schema_version", "capability", "requested_identity", "served_identity", "response_id", "server_timestamp_utc", "answers"];
const SERVED_KEYS = ["model", "response_id", "source"];
const ANSWER_KEYS = ["name", "type", "criteria", "value", "confidence"];
const CHOICE_ANSWER_KEYS = [...ANSWER_KEYS, "distribution"];

export const REQUESTED_IDENTITY: ProviderIdentity = {
  provider: "openrouter", model: "typesafe/jev-1.13", surface: "alpha-decisions",
};

export const QUESTIONS = [
  { name: "is_urgent", type: "noul", instructions: ["support_triage_v1"], criteria: [{ key: "urgent_signal", description: "customer urgency signal" }] },
  { name: "department", type: "choice", instructions: ["support_triage_v1"], criteria: [{ key: "department_signal", description: "support department signal" }], choices: ["billing", "technical", "sales"] },
  { name: "frustration", type: "score", instructions: ["support_triage_v1"], criteria: [{ key: "frustration_signal", description: "customer frustration signal" }], score_label: "frustration_score" },
] as const;

const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MODEL = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/;
const RESPONSE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === keys.length && actual.every((key, index) => key === [...keys].sort()[index]);
}

function equal(a: unknown, b: unknown): boolean {
  try { return canonicalize(a) === canonicalize(b); } catch { return false; }
}

function finite(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
function printable(value: unknown): value is string {
  return typeof value === "string" && /^[\x20-\x7e]*$/.test(value);
}
function timestamp(value: unknown): value is string {
  return printable(value) && TIMESTAMP.test(value) && !Number.isNaN(Date.parse(value));
}
function failure(reason: "R09" | "R10" | "R11" | "R12"): ValidationResult<never> {
  return { ok: false, status: reason === "R12" ? "hold" : "refused", reason };
}

function validateIdentity(value: unknown): value is ProviderIdentity {
  return record(value) && exactKeys(value, IDENTITY_KEYS) && equal(value, REQUESTED_IDENTITY);
}

function validateCriterion(value: unknown, expected: Criterion): value is Criterion {
  return record(value) && exactKeys(value, ["key", "description"]) && equal(value, expected);
}

function validateQuestions(value: unknown): value is RequestEnvelope["questions"] {
  if (!Array.isArray(value) || value.length !== 3) return false;
  const [urgent, department, frustration] = value;
  if (!record(urgent) || !exactKeys(urgent, QUESTION_KEYS) || urgent.name !== QUESTIONS[0].name || urgent.type !== QUESTIONS[0].type || !equal(urgent.instructions, QUESTIONS[0].instructions) || !Array.isArray(urgent.criteria) || urgent.criteria.length !== 1 || !validateCriterion(urgent.criteria[0], QUESTIONS[0].criteria[0])) return false;
  if (!record(department) || !exactKeys(department, CHOICE_QUESTION_KEYS) || department.name !== QUESTIONS[1].name || department.type !== QUESTIONS[1].type || !equal(department.instructions, QUESTIONS[1].instructions) || !equal(department.choices, QUESTIONS[1].choices) || !Array.isArray(department.criteria) || department.criteria.length !== 1 || !validateCriterion(department.criteria[0], QUESTIONS[1].criteria[0])) return false;
  if (!record(frustration) || !exactKeys(frustration, SCORE_QUESTION_KEYS) || frustration.name !== QUESTIONS[2].name || frustration.type !== QUESTIONS[2].type || !equal(frustration.instructions, QUESTIONS[2].instructions) || frustration.score_label !== QUESTIONS[2].score_label || !Array.isArray(frustration.criteria) || frustration.criteria.length !== 1 || !validateCriterion(frustration.criteria[0], QUESTIONS[2].criteria[0])) return false;
  return true;
}

function validateState(value: unknown): boolean {
  if (!record(value) || !exactKeys(value, STATE_KEYS) || value.schema_version !== "support-triage-input/v1" || !record(value.values)) return false;
  if (!exactKeys(value.values, Object.keys(value.values))) return false;
  const keys = Object.keys(value.values);
  if (keys.some((key) => !STATE_VALUE_KEYS.includes(key))) return false;
  const values = value.values;
  if (values.case_type !== undefined && !["billing", "technical", "sales", "other"].includes(values.case_type as string)) return false;
  if (values.urgency_signal !== undefined && (!finite(values.urgency_signal) || values.urgency_signal < 0 || values.urgency_signal > 1)) return false;
  if (values.frustration_signal !== undefined && (!finite(values.frustration_signal) || values.frustration_signal < 0)) return false;
  if (values.contact_channel !== undefined && !["email", "chat", "phone"].includes(values.contact_channel as string)) return false;
  return true;
}

export function validateRequest(value: unknown): ValidationResult<ValidatedRequest> {
  if (!record(value) || !exactKeys(value, REQUEST_KEYS) || value.schema_version !== "jev-decisions/v1" || value.capability !== "openrouter-alpha-decisions" || !validateIdentity(value.requested_identity) || !validateState(value.state) || !validateQuestions(value.questions)) return failure("R10");
  return { ok: true, value: value as RequestEnvelope };
}

function validateServed(value: unknown): value is ServedIdentity {
  return record(value) && exactKeys(value, SERVED_KEYS) && printable(value.model) && MODEL.test(value.model) && printable(value.response_id) && RESPONSE_ID.test(value.response_id) && value.response_id !== "none" && value.source === "provider-declared";
}

function validateCriteria(value: unknown, expected: readonly [Criterion]): value is readonly [Criterion] {
  return Array.isArray(value) && value.length === 1 && validateCriterion(value[0], expected[0]);
}

function validateAnswer(value: unknown, index: number): value is Answer {
  if (!record(value)) return false;
  const question = QUESTIONS[index];
  const keys = question.type === "choice" ? CHOICE_ANSWER_KEYS : ANSWER_KEYS;
  if (!exactKeys(value, keys) || value.name !== question.name || value.type !== question.type || !validateCriteria(value.criteria, question.criteria) || !finite(value.confidence) || value.confidence < 0 || value.confidence > 1) return false;
  if (question.type === "noul") return finite(value.value) && value.value >= 0 && value.value <= 1;
  if (question.type === "score") return finite(value.value);
  if (!["billing", "technical", "sales"].includes(value.value as string) || !record(value.distribution) || !exactKeys(value.distribution, ["billing", "technical", "sales"])) return false;
  const distribution = value.distribution;
  const values = [distribution.billing, distribution.technical, distribution.sales];
  return values.every((item) => finite(item) && item >= 0 && item <= 1) && Math.abs(values.reduce((sum, item) => sum + item, 0) - 1) <= 1e-12;
}

export function validateResponse(request: ValidatedRequest, value: unknown): ValidationResult<ValidatedResponse> {
  if (validateRequest(request).ok === false) return failure("R10");
  if (!record(value)) return failure("R10");
  const hasOnlyResponseFields = Object.keys(value).every((key) => RESPONSE_KEYS.includes(key));
  const missingProviderMetadata = hasOnlyResponseFields && value.schema_version === "jev-decisions/v1" && value.capability === "openrouter-alpha-decisions" && equal(value.requested_identity, request.requested_identity) && (!Object.prototype.hasOwnProperty.call(value, "response_id") || !Object.prototype.hasOwnProperty.call(value, "server_timestamp_utc") || !record(value.served_identity) || !Object.prototype.hasOwnProperty.call(value.served_identity, "model") || !Object.prototype.hasOwnProperty.call(value.served_identity, "response_id") || !Object.prototype.hasOwnProperty.call(value.served_identity, "source"));
  if (missingProviderMetadata) return failure("R12");
  if (!exactKeys(value, RESPONSE_KEYS) || value.schema_version !== "jev-decisions/v1" || value.capability !== "openrouter-alpha-decisions" || !equal(value.requested_identity, request.requested_identity)) return failure("R10");
  if (!record(value.served_identity) || !Object.prototype.hasOwnProperty.call(value.served_identity, "model") || !Object.prototype.hasOwnProperty.call(value.served_identity, "response_id") || !Object.prototype.hasOwnProperty.call(value.served_identity, "source")) return failure("R12");
  if (!validateServed(value.served_identity) || !printable(value.response_id) || !RESPONSE_ID.test(value.response_id) || value.response_id === "none" || !timestamp(value.server_timestamp_utc)) return failure("R10");
  if (value.served_identity.response_id !== value.response_id) return failure("R09");
  if (!Array.isArray(value.answers) || value.answers.length !== 3 || !value.answers.every((answer, index) => validateAnswer(answer, index))) return failure("R10");
  return { ok: true, value: value as ResponseEnvelope };
}

export { canonicalDigest };
