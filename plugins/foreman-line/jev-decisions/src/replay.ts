import { canonicalDigest, canonicalize } from "./canonical-json.ts";
import { validateRequest, validateResponse } from "./validator.ts";
import type {
  CompleteFixture, HoldFixture, ManifestEntry, ManifestReceipt, Provenance,
  RefusalFixture, ReplayFixture, ReplayResult, ValidatedRequest,
} from "./types.ts";

const COMPLETE_KEYS = ["evidence_class", "repository", "ref", "path", "commit", "tree", "manifest_id", "fixture_id", "provenance", "provenance_digest", "schema_version", "requested_identity", "served_identity", "response_id", "server_timestamp_utc", "request", "response", "request_digest", "response_digest", "manifest_entry", "source_kind", "source_ref", "status", "reason_code", "retention_until_utc"];
const PROVENANCE_KEYS = ["fixture_id", "source_kind", "source_ref", "captured_at_utc", "authenticated_response_id", "manifest_id", "repository", "ref", "path", "manifest_commit", "manifest_tree"];
const ENTRY_KEYS = ["schema_version", "manifest_id", "fixture_id", "repository", "ref", "path", "commit", "tree", "request_digest", "response_digest", "provenance_digest"];
const RECEIPT_KEYS = ["receipt_schema_version", "authority", "receipt_id", "resolution", "manifest_id", "fixture_id", "repository", "ref", "path", "commit", "tree", "request_digest", "response_digest", "provenance_digest", "resolved_at_utc"];
const REFUSAL_KEYS = ["evidence_class", "status", "reason_code", "source_kind", "source_ref", "recorded_at_utc", "retention_until_utc"];
const HOLD_KEYS = ["evidence_class", "status", "reason_code", "disposition", "source_kind", "source_ref", "recorded_at_utc", "retention_until_utc"];
const REFS = ["main", "codex/jev-p0-contract", "codex/jev-p1-typed-validator-and-fixture-replay"] as const;
const PATHS = [
  "plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md",
  "plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md",
  "plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md",
  "plugins/foreman-line/jev-decisions/tests/fixtures/complete.json",
  "plugins/foreman-line/jev-decisions/tests/fixtures/refused.json",
  "plugins/foreman-line/jev-decisions/tests/fixtures/hold.json",
  "plugins/foreman-line/jev-decisions/tests/fixtures/mismatch-response-id.json",
  "plugins/foreman-line/jev-decisions/tests/fixtures/mismatched-digest.json",
  "plugins/foreman-line/jev-decisions/tests/fixtures/extra-field.json",
  "plugins/foreman-line/jev-decisions/tests/fixtures/unsafe-reason.json",
] as const;
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const ID = (prefix: string, value: unknown): value is string => typeof value === "string" && new RegExp(`^${prefix}-[0-9a-f]{32}$`).test(value);
const SHA = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
const DIGEST = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
const RESPONSE_ID = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value) && value !== "none";

function record(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function equal(a: unknown, b: unknown): boolean { try { return canonicalize(a) === canonicalize(b); } catch { return false; } }
function utc(value: unknown): value is string { return typeof value === "string" && UTC.test(value) && !Number.isNaN(Date.parse(value)); }
function failure(reason: "R17" | "R18" | "R19" | "R20" | "R21" | "R22" | "R23"): ReplayResult {
  return { ok: false, status: reason === "R19" ? "hold" : "refused", reason };
}
function retention(anchor: string, end: unknown): boolean {
  if (!utc(end)) return false;
  const startMs = Date.parse(anchor);
  const endMs = Date.parse(end);
  return endMs >= startMs && endMs <= startMs + 90 * 24 * 60 * 60 * 1000;
}
function genericReason(value: unknown, status: "refused" | "hold"): boolean {
  const allowedRefusal = new Set(["evidence:R01", "evidence:R02", "evidence:R03", "evidence:R04", "evidence:R05", "evidence:R06", "evidence:R07", "evidence:R08", "evidence:R09", "evidence:R10", "evidence:R11", "evidence:R13", "evidence:R16", "evidence:R17", "evidence:R18", "evidence:R20", "evidence:R21", "evidence:R22", "evidence:R23", "evidence:R24", "evidence:R25"]);
  const allowedHold = new Set(["evidence:R12", "evidence:R13", "evidence:R14", "evidence:R15", "evidence:R19"]);
  return typeof value === "string" && (status === "refused" ? allowedRefusal.has(value) : allowedHold.has(value));
}

function validateGeneric(value: Record<string, unknown>): ReplayResult {
  const isRefusal = value.evidence_class === "refusal-record";
  const isHold = value.evidence_class === "hold-record";
  if (isRefusal) {
    if (!exactKeys(value, REFUSAL_KEYS)) return failure("R23");
    if (value.status !== "refused" || value.source_kind !== "coordinator-review" || !genericReason(value.reason_code, "refused") || !ID("src", value.source_ref) || !utc(value.recorded_at_utc) || !retention(value.recorded_at_utc as string, value.retention_until_utc)) return failure("R22");
    return { ok: true, value: value as unknown as RefusalFixture };
  }
  if (isHold) {
    if (!exactKeys(value, HOLD_KEYS)) return failure("R23");
    if (value.status !== "hold" || value.disposition !== "pending-coordinator" || value.source_kind !== "coordinator-review" || !genericReason(value.reason_code, "hold") || !ID("src", value.source_ref) || !utc(value.recorded_at_utc) || !retention(value.recorded_at_utc as string, value.retention_until_utc)) return failure("R22");
    return { ok: true, value: value as unknown as HoldFixture };
  }
  return failure("R23");
}

function validateReceipt(value: unknown, fixture: CompleteFixture): ReplayResult {
  if (!record(value)) return failure("R19");
  if (!exactKeys(value, RECEIPT_KEYS)) return failure("R23");
  if (value.receipt_schema_version !== "jev-manifest-receipt/v1" || value.authority !== "coordinator-manifest-resolver-v1" || value.resolution !== "resolved" || !ID("mreceipt", value.receipt_id) || !ID("manifest", value.manifest_id) || !ID("fx", value.fixture_id) || value.repository !== "agent-skills" || !REFS.includes(value.ref as typeof REFS[number]) || !PATHS.includes(value.path as typeof PATHS[number]) || !SHA(value.commit) || !SHA(value.tree) || !DIGEST(value.request_digest) || !DIGEST(value.response_digest) || !DIGEST(value.provenance_digest) || !utc(value.resolved_at_utc)) return failure("R22");
  if (value.manifest_id !== fixture.manifest_id || value.fixture_id !== fixture.fixture_id || value.repository !== fixture.repository || value.ref !== fixture.ref || value.path !== fixture.path || value.commit !== fixture.commit || value.tree !== fixture.tree || value.request_digest !== fixture.request_digest || value.response_digest !== fixture.response_digest || value.provenance_digest !== fixture.provenance_digest) return failure("R20");
  return { ok: true, value: fixture };
}

function validateComplete(value: Record<string, unknown>, receipt: unknown): ReplayResult {
  if (!exactKeys(value, COMPLETE_KEYS)) return failure("R23");
  if (!record(value.provenance) || !exactKeys(value.provenance, PROVENANCE_KEYS)) return failure("R23");
  if (!record(value.manifest_entry) || !exactKeys(value.manifest_entry, ENTRY_KEYS)) return failure("R23");
  if (value.evidence_class !== "sanitized-replay-fixture" || value.status !== "complete" || value.reason_code !== "none" || value.repository !== "agent-skills" || value.source_kind !== "sanitized-fixture" || !ID("src", value.source_ref) || !ID("manifest", value.manifest_id) || !ID("fx", value.fixture_id) || !SHA(value.commit) || !SHA(value.tree) || !utc(value.server_timestamp_utc) || !utc(value.retention_until_utc) || !DIGEST(value.request_digest) || !DIGEST(value.response_digest) || !DIGEST(value.provenance_digest) || !REFS.includes(value.ref as typeof REFS[number]) || !PATHS.includes(value.path as typeof PATHS[number])) return failure("R22");
  const provenance = value.provenance;
  if (provenance.source_kind !== "sanitized-fixture" || !ID("src", provenance.source_ref) || !ID("fx", provenance.fixture_id) || !ID("manifest", provenance.manifest_id) || !utc(provenance.captured_at_utc) || !RESPONSE_ID(provenance.authenticated_response_id) || provenance.repository !== "agent-skills" || !REFS.includes(provenance.ref as typeof REFS[number]) || !PATHS.includes(provenance.path as typeof PATHS[number]) || !SHA(provenance.manifest_commit) || !SHA(provenance.manifest_tree)) return failure("R22");
  if (!retention(provenance.captured_at_utc, value.retention_until_utc)) return failure("R22");
  const entry = value.manifest_entry;
  if (entry.schema_version !== "jev-decisions/v1" || !ID("manifest", entry.manifest_id) || !ID("fx", entry.fixture_id) || entry.repository !== "agent-skills" || !REFS.includes(entry.ref as typeof REFS[number]) || !PATHS.includes(entry.path as typeof PATHS[number]) || !SHA(entry.commit) || !SHA(entry.tree) || !DIGEST(entry.request_digest) || !DIGEST(entry.response_digest) || !DIGEST(entry.provenance_digest)) return failure("R22");
  const req = validateRequest(value.request);
  if (!req.ok) return failure("R23");
  const response = validateResponse(req.value, value.response);
  if (!response.ok) return failure("R23");
  const fixture = value as unknown as CompleteFixture;
  if (!equal(fixture.requested_identity, req.value.requested_identity) || !equal(fixture.requested_identity, response.value.requested_identity) || !equal(fixture.served_identity, response.value.served_identity) || fixture.response_id !== response.value.response_id || fixture.response_id !== fixture.served_identity.response_id || fixture.response_id !== provenance.authenticated_response_id || fixture.server_timestamp_utc !== response.value.server_timestamp_utc || fixture.source_ref !== provenance.source_ref || fixture.source_kind !== provenance.source_kind || fixture.fixture_id !== provenance.fixture_id || fixture.fixture_id !== entry.fixture_id || fixture.manifest_id !== provenance.manifest_id || fixture.manifest_id !== entry.manifest_id || !equal(fixture.schema_version, req.value.schema_version) || !equal(fixture.schema_version, response.value.schema_version)) return failure("R21");
  if (!equal({ repository: fixture.repository, ref: fixture.ref, path: fixture.path, commit: fixture.commit, tree: fixture.tree }, { repository: provenance.repository, ref: provenance.ref, path: provenance.path, commit: provenance.manifest_commit, tree: provenance.manifest_tree }) || !equal({ repository: fixture.repository, ref: fixture.ref, path: fixture.path, commit: fixture.commit, tree: fixture.tree }, { repository: entry.repository, ref: entry.ref, path: entry.path, commit: entry.commit, tree: entry.tree })) return failure("R20");
  let requestDigest: string;
  let responseDigest: string;
  let provenanceDigest: string;
  try { requestDigest = canonicalDigest(fixture.request); responseDigest = canonicalDigest(fixture.response); provenanceDigest = canonicalDigest(fixture.provenance); } catch { return failure("R17"); }
  if (fixture.request_digest !== requestDigest || fixture.response_digest !== responseDigest || fixture.request_digest !== entry.request_digest || fixture.response_digest !== entry.response_digest) return failure("R17");
  if (fixture.provenance_digest !== provenanceDigest || fixture.provenance_digest !== entry.provenance_digest) return failure("R18");
  return validateReceipt(receipt, fixture);
}

export function replayFixture(fixture: unknown, manifestReceipt: unknown): ReplayResult {
  if (!record(fixture)) return failure("R23");
  if (fixture.evidence_class === "refusal-record" || fixture.evidence_class === "hold-record") return validateGeneric(fixture);
  if (fixture.evidence_class === "sanitized-replay-fixture") return validateComplete(fixture, manifestReceipt);
  return failure("R23");
}
