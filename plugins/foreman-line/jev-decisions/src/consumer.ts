import type {
  ChoiceAnswer,
  NoulAnswer,
  ScoreAnswer,
  ValidatedResponse,
} from "./types.ts";

export type SupportTriageAdvisory = {
  readonly schema_version: "support-triage-advisory/v1";
  readonly source: "jev";
  readonly response_id: string;
  readonly is_urgent: number;
  readonly department: "billing" | "technical" | "sales";
  readonly frustration: number;
};

function isNoulAnswer(value: unknown): value is NoulAnswer {
  return isRecord(value) && value.name === "is_urgent" && value.type === "noul";
}

function isChoiceAnswer(value: unknown): value is ChoiceAnswer {
  return isRecord(value) && value.name === "department" && value.type === "choice";
}

function isScoreAnswer(value: unknown): value is ScoreAnswer {
  return isRecord(value) && value.name === "frustration" && value.type === "score";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function answerOrThrow<T>(
  response: ValidatedResponse,
  predicate: (value: unknown) => value is T,
): T {
  const answer = response.answers.find(predicate);
  if (answer === undefined) {
    throw new TypeError("ValidatedResponse answer contract violated");
  }
  return answer;
}

export function createSupportTriageAdvisory(
  response: ValidatedResponse,
): SupportTriageAdvisory {
  const urgent = answerOrThrow(response, isNoulAnswer);
  const department = answerOrThrow(response, isChoiceAnswer);
  const frustration = answerOrThrow(response, isScoreAnswer);

  return {
    schema_version: "support-triage-advisory/v1",
    source: "jev",
    response_id: response.response_id,
    is_urgent: urgent.value,
    department: department.value,
    frustration: frustration.value,
  };
}
