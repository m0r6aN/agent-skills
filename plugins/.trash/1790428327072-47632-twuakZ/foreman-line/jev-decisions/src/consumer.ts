import type {
  ChoiceAnswer,
  NoulAnswer,
  ScoreAnswer,
  ValidatedResponse,
} from "./types.ts";

const RESPONSE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const MODEL = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/;
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const RESPONSE_KEYS = ["schema_version", "capability", "requested_identity", "served_identity", "response_id", "server_timestamp_utc", "answers"];
const ANSWER_KEYS = ["name", "type", "criteria", "value", "confidence"];
const CHOICE_ANSWER_KEYS = [...ANSWER_KEYS, "distribution"];

export type SupportTriageAdvisory = {
  readonly schema_version: "support-triage-advisory/v1";
  readonly source: "jev";
  readonly response_id: string;
  readonly is_urgent: number;
  readonly department: "billing" | "technical" | "sales";
  readonly frustration: number;
};

function isNoulAnswer(value: unknown): value is NoulAnswer {
  return isRecord(value) && exactKeys(value, ANSWER_KEYS) && value.name === "is_urgent" && value.type === "noul" && criteria(value.criteria, "urgent_signal", "customer urgency signal") && finiteRange(value.value, 0, 1) && finiteRange(value.confidence, 0, 1);
}

function isChoiceAnswer(value: unknown): value is ChoiceAnswer {
  if (!isRecord(value) || !exactKeys(value, CHOICE_ANSWER_KEYS) || value.name !== "department" || value.type !== "choice" || !criteria(value.criteria, "department_signal", "support department signal") || typeof value.value !== "string" || !["billing", "technical", "sales"].includes(value.value) || !finiteRange(value.confidence, 0, 1) || !isRecord(value.distribution) || !exactKeys(value.distribution, ["billing", "technical", "sales"])) return false;
  const distribution = [value.distribution.billing, value.distribution.technical, value.distribution.sales];
  return distribution.every((item) => finiteRange(item, 0, 1)) && Math.abs(distribution.reduce((sum, item) => sum + (item as number), 0) - 1) <= 1e-12;
}

function isScoreAnswer(value: unknown): value is ScoreAnswer {
  return isRecord(value) && exactKeys(value, ANSWER_KEYS) && value.name === "frustration" && value.type === "score" && criteria(value.criteria, "frustration_signal", "customer frustration signal") && finiteRange(value.value, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY) && finiteRange(value.confidence, 0, 1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function finiteRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function criteria(value: unknown, key: string, description: string): boolean {
  if (!Array.isArray(value) || value.length !== 1 || !isRecord(value[0]) || !exactKeys(value[0], ["key", "description"])) return false;
  return value[0].key === key && value[0].description === description;
}

function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && UTC.test(value) && !Number.isNaN(Date.parse(value));
}

function validResponse(value: unknown): value is { readonly response_id: string; readonly answers: readonly unknown[] } {
  if (!isRecord(value) || !exactKeys(value, RESPONSE_KEYS) || value.schema_version !== "jev-decisions/v1" || value.capability !== "openrouter-alpha-decisions" || !isRecord(value.requested_identity) || !exactKeys(value.requested_identity, ["provider", "model", "surface"]) || value.requested_identity.provider !== "openrouter" || value.requested_identity.model !== "typesafe/jev-1.13" || value.requested_identity.surface !== "alpha-decisions" || !isRecord(value.served_identity) || !exactKeys(value.served_identity, ["model", "response_id", "source"]) || typeof value.served_identity.model !== "string" || !MODEL.test(value.served_identity.model) || typeof value.served_identity.response_id !== "string" || !RESPONSE_ID.test(value.served_identity.response_id) || value.served_identity.response_id === "none" || value.served_identity.source !== "provider-declared" || typeof value.response_id !== "string" || !RESPONSE_ID.test(value.response_id) || value.response_id === "none" || value.served_identity.response_id !== value.response_id || !validTimestamp(value.server_timestamp_utc) || !Array.isArray(value.answers) || value.answers.length !== 3) return false;
  return isNoulAnswer(value.answers[0]) && isChoiceAnswer(value.answers[1]) && isScoreAnswer(value.answers[2]);
}

function answerOrThrow<T>(
  answers: readonly unknown[],
  predicate: (value: unknown) => value is T,
): T {
  const answer = answers.find(predicate);
  if (answer === undefined) throw new TypeError("ValidatedResponse contract violated");
  return answer;
}

export function createSupportTriageAdvisory(
  response: ValidatedResponse,
): SupportTriageAdvisory {
  const candidate = response as unknown;
  if (!validResponse(candidate)) throw new TypeError("ValidatedResponse contract violated");
  const answers = candidate.answers;
  const urgent = answerOrThrow(answers, isNoulAnswer);
  const department = answerOrThrow(answers, isChoiceAnswer);
  const frustration = answerOrThrow(answers, isScoreAnswer);

  return {
    schema_version: "support-triage-advisory/v1",
    source: "jev",
    response_id: response.response_id,
    is_urgent: urgent.value,
    department: department.value,
    frustration: frustration.value,
  };
}
