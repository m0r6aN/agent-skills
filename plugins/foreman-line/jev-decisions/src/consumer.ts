import type {
  ChoiceAnswer,
  NoulAnswer,
  ScoreAnswer,
  ValidatedResponse,
} from "./types.ts";

const RESPONSE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
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
  return isRecord(value) && exactKeys(value, ANSWER_KEYS) && value.name === "is_urgent" && value.type === "noul" && Array.isArray(value.criteria) && typeof value.value === "number" && Number.isFinite(value.value) && typeof value.confidence === "number" && Number.isFinite(value.confidence);
}

function isChoiceAnswer(value: unknown): value is ChoiceAnswer {
  return isRecord(value) && exactKeys(value, CHOICE_ANSWER_KEYS) && value.name === "department" && value.type === "choice" && Array.isArray(value.criteria) && typeof value.value === "string" && ["billing", "technical", "sales"].includes(value.value) && typeof value.confidence === "number" && Number.isFinite(value.confidence) && isRecord(value.distribution) && exactKeys(value.distribution, ["billing", "technical", "sales"]);
}

function isScoreAnswer(value: unknown): value is ScoreAnswer {
  return isRecord(value) && exactKeys(value, ANSWER_KEYS) && value.name === "frustration" && value.type === "score" && Array.isArray(value.criteria) && typeof value.value === "number" && Number.isFinite(value.value) && typeof value.confidence === "number" && Number.isFinite(value.confidence);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
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
  if (!isRecord(candidate) || !exactKeys(candidate, RESPONSE_KEYS) || candidate.schema_version !== "jev-decisions/v1" || candidate.capability !== "openrouter-alpha-decisions" || typeof candidate.response_id !== "string" || !RESPONSE_ID.test(candidate.response_id) || !Array.isArray(candidate.answers) || candidate.answers.length !== 3) throw new TypeError("ValidatedResponse contract violated");
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
