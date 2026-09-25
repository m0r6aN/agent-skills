import test from "node:test";
import assert from "node:assert/strict";
import {
  createSupportTriageAdvisory,
  validateRequest,
  validateResponse,
  type RequestEnvelope,
  type ResponseEnvelope,
  type SupportTriageAdvisory,
  type ValidatedResponse,
} from "../src/index.ts";

const fixture: {
  request: RequestEnvelope;
  response: ResponseEnvelope;
} = {
  request: {
    schema_version: "jev-decisions/v1",
    capability: "openrouter-alpha-decisions",
    requested_identity: {
      provider: "openrouter",
      model: "typesafe/jev-1.13",
      surface: "alpha-decisions",
    },
    state: {
      schema_version: "support-triage-input/v1",
      values: {
        case_type: "billing",
        urgency_signal: 0.9,
        frustration_signal: 0.8,
        contact_channel: "chat",
      },
    },
    questions: [
      {
        name: "is_urgent",
        type: "noul",
        instructions: ["support_triage_v1"],
        criteria: [{ key: "urgent_signal", description: "customer urgency signal" }],
      },
      {
        name: "department",
        type: "choice",
        instructions: ["support_triage_v1"],
        criteria: [{ key: "department_signal", description: "support department signal" }],
        choices: ["billing", "technical", "sales"],
      },
      {
        name: "frustration",
        type: "score",
        instructions: ["support_triage_v1"],
        criteria: [{ key: "frustration_signal", description: "customer frustration signal" }],
        score_label: "frustration_score",
      },
    ],
  },
  response: {
    schema_version: "jev-decisions/v1",
    capability: "openrouter-alpha-decisions",
    requested_identity: {
      provider: "openrouter",
      model: "typesafe/jev-1.13",
      surface: "alpha-decisions",
    },
    served_identity: {
      model: "typesafe/jev-1.13",
      response_id: "r-001",
      source: "provider-declared",
    },
    response_id: "r-001",
    server_timestamp_utc: "2026-09-21T12:00:01.000Z",
    answers: [
      {
        name: "is_urgent",
        type: "noul",
        criteria: [{ key: "urgent_signal", description: "customer urgency signal" }],
        value: 0.95,
        confidence: 0.9,
      },
      {
        name: "department",
        type: "choice",
        criteria: [{ key: "department_signal", description: "support department signal" }],
        value: "billing",
        confidence: 0.82,
        distribution: { billing: 0.88, technical: 0.12, sales: 0 },
      },
      {
        name: "frustration",
        type: "score",
        criteria: [{ key: "frustration_signal", description: "customer frustration signal" }],
        value: 1.04,
        confidence: 0.94,
      },
    ],
  },
};

function validatedResponse(): ValidatedResponse {
  const request = validateRequest(structuredClone(fixture.request));
  assert.equal(request.ok, true);
  if (!request.ok) throw new Error("fixture request must validate");

  const response = validateResponse(request.value, structuredClone(fixture.response));
  assert.equal(response.ok, true);
  if (!response.ok) throw new Error("fixture response must validate");
  return response.value;
}

test("maps a validated response to the exact closed advisory", () => {
  const advisory = createSupportTriageAdvisory(validatedResponse());

  assert.deepEqual(advisory, {
    schema_version: "support-triage-advisory/v1",
    source: "jev",
    response_id: "r-001",
    is_urgent: 0.95,
    department: "billing",
    frustration: 1.04,
  });
  assert.deepEqual(Object.keys(advisory).sort(), [
    "department",
    "frustration",
    "is_urgent",
    "response_id",
    "schema_version",
    "source",
  ]);
});

test("uses the canonical P1 answer slots and exact names/types", () => {
  const response = validatedResponse();

  const advisory = createSupportTriageAdvisory(response);
  assert.equal(advisory.is_urgent, 0.95);
  assert.equal(advisory.department, "billing");
  assert.equal(advisory.frustration, 1.04);
});

test("rejects a reordered answer array that P1 would reject", () => {
  const response = validatedResponse();
  const answers = response.answers as unknown as Array<Record<string, unknown>>;
  answers.reverse();
  assert.throws(() => createSupportTriageAdvisory(response), new TypeError("ValidatedResponse contract violated"));
});

test("returns a detached advisory snapshot", () => {
  const response = validatedResponse();
  const advisory = createSupportTriageAdvisory(response);

  (advisory as SupportTriageAdvisory & { response_id: string }).response_id = "changed";
  (response as ResponseEnvelope & { response_id: string }).response_id = "original-preserved";

  assert.equal(advisory.response_id, "changed");
  assert.equal(response.response_id, "original-preserved");
});

test("does not copy provider or authority fields into the advisory", () => {
  const response = validatedResponse();
  const advisory = createSupportTriageAdvisory(response);

  assert.equal("served_identity" in advisory, false);
  assert.equal("command" in advisory, false);
  assert.equal("confidence" in advisory, false);
  assert.equal("distribution" in advisory, false);
  assert.equal("capability" in advisory, false);
});

test("invalid envelopes are rejected before consumer use", () => {
  const request = validateRequest(fixture.request);
  assert.equal(request.ok, true);
  if (!request.ok) return;

  const invalidCases = [
    (() => {
      const value = structuredClone(fixture.response) as Record<string, unknown>;
      value.extra = true;
      return value;
    })(),
    (() => {
      const value = structuredClone(fixture.response) as ResponseEnvelope;
      (value.answers[0] as Record<string, unknown>).name = "wrong";
      return value;
    })(),
    (() => {
      const value = structuredClone(fixture.response) as ResponseEnvelope;
      (value.answers[1] as Record<string, unknown>).type = "score";
      return value;
    })(),
    (() => {
      const value = structuredClone(fixture.response) as Record<string, unknown>;
      delete value.response_id;
      return value;
    })(),
    (() => {
      const value = structuredClone(fixture.response) as ResponseEnvelope;
      (value.answers[0] as Record<string, unknown>).value = "not-a-number";
      return value;
    })(),
  ];

  for (const value of invalidCases) {
    assert.equal(validateResponse(request.value, value).ok, false);
  }
});

test("does not produce an advisory when an invalid validated cast lacks an exact answer", () => {
  const response = validatedResponse();
  const invalid = structuredClone(response) as ValidatedResponse;
  (invalid.answers[0] as Record<string, unknown>).name = "wrong";

  assert.throws(
    () => createSupportTriageAdvisory(invalid),
    new TypeError("ValidatedResponse contract violated"),
  );
});

test("rejects forged answer values and response identifiers at the consumer boundary", () => {
  const invalidValues = structuredClone(validatedResponse()) as ValidatedResponse;
  (invalidValues.answers[0] as Record<string, unknown>).value = "urgent";
  assert.throws(() => createSupportTriageAdvisory(invalidValues), new TypeError("ValidatedResponse contract violated"));

  const invalidDepartment = structuredClone(validatedResponse()) as ValidatedResponse;
  (invalidDepartment.answers[1] as Record<string, unknown>).value = "operations";
  assert.throws(() => createSupportTriageAdvisory(invalidDepartment), new TypeError("ValidatedResponse contract violated"));

  const invalidId = structuredClone(validatedResponse()) as ValidatedResponse;
  (invalidId as ResponseEnvelope & { response_id: string }).response_id = "not allowed\n";
  assert.throws(() => createSupportTriageAdvisory(invalidId), new TypeError("ValidatedResponse contract violated"));
});
