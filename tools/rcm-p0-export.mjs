import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";

const sourceCatalog = "C:\\Users\\clint\\.pi\\agent\\models-store.json";
const sourceSettings = "C:\\Users\\clint\\.pi\\agent\\settings.json";
const repoRoot = "D:\\Repos\\agent-skills";
const snapshotPath = join(
  repoRoot,
  "plugins",
  "foreman-line",
  "docs",
  "goals",
  "routing-currency-and-merit",
  "rcm-p0-catalog-snapshot.v1.json",
);
const outputDir = join(
  repoRoot,
  "plugins",
  "foreman-line",
  "docs",
  "goals",
  "routing-currency-and-merit",
  "host-owner-export",
);

const extractorVersion = "rcm-p0-host-owner-export-v1";
const costUnit = "USD per 1M tokens";

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function stableJson(value) {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isPrivateIpv4(hostname) {
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function publicUrl(value) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const text = value.trim();
  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    return undefined;
  }
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!["https:", "http:"].includes(parsed.protocol)) return undefined;
  if (parsed.username || parsed.password || parsed.search || parsed.hash) return undefined;
  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname === "::1" ||
    hostname.startsWith("fc") ||
    hostname.startsWith("fd") ||
    isPrivateIpv4(hostname)
  ) return undefined;
  return text;
}

function safeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function safeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : undefined;
}

function safeString(value) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function safeThinkingLevelMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const result = {};
  for (const key of Object.keys(value).sort()) {
    const item = value[key];
    if (item === null || typeof item === "string") result[key] = item;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function sourceObservation(path) {
  const before = statSync(path);
  const acquiredAtUtc = new Date().toISOString();
  const rawBytes = readFileSync(path);
  const text = rawBytes.toString("utf8");
  const parsed = JSON.parse(text);
  const after = statSync(path);
  const stable = before.size === after.size && before.mtimeMs === after.mtimeMs;
  if (!stable) throw new Error(`Source changed during bounded observation: ${path}`);
  return {
    path,
    rawBytes,
    parsed,
    acquiredAtUtc,
    sourceStability: {
      stable,
      evidence: "pre-read and post-read size/mtime match; source bytes were not hashed",
      before: { byteLength: before.size, lastWriteTimeUtc: before.mtime.toISOString() },
      after: { byteLength: after.size, lastWriteTimeUtc: after.mtime.toISOString() },
    },
  };
}

function costRate(value) {
  const number = safeNumber(value);
  return number === undefined ? undefined : { value: number, unit: costUnit };
}

const catalogObservation = sourceObservation(sourceCatalog);
const settingsObservation = sourceObservation(sourceSettings);
const rawCatalog = catalogObservation.parsed;
const rawSettings = settingsObservation.parsed;

const safeCatalogFields = [
  "id",
  "provider",
  "baseUrl",
  "api",
  "input",
  "reasoning",
  "contextWindow",
  "maxTokens",
  "cost.input",
  "cost.output",
  "thinkingLevelMap",
];

const providers = [];
const identities = new Set();
const duplicateIdentities = [];

for (const providerKey of Object.keys(rawCatalog).sort()) {
  const providerSource = rawCatalog[providerKey];
  const modelsSource = Array.isArray(providerSource?.models) ? providerSource.models : [];
  const fieldCounts = Object.fromEntries(safeCatalogFields.map((field) => [field, 0]));
  const models = [];
  for (const modelSource of modelsSource) {
    const id = safeString(modelSource?.id);
    if (!id) continue;
    const identity = `${providerKey}\u0000${id}`;
    if (identities.has(identity)) duplicateIdentities.push({ providerKey, id });
    identities.add(identity);
    const model = { id };
    fieldCounts.id += 1;

    const provider = safeString(modelSource.provider);
    if (provider !== undefined) {
      model.provider = provider;
      fieldCounts.provider += 1;
    }
    const baseUrl = publicUrl(modelSource.baseUrl);
    if (baseUrl !== undefined) {
      model.baseUrl = baseUrl;
      fieldCounts.baseUrl += 1;
    }
    const api = safeString(modelSource.api);
    if (api !== undefined) {
      model.api = api;
      fieldCounts.api += 1;
    }
    if (Array.isArray(modelSource.input) && modelSource.input.every((item) => typeof item === "string")) {
      model.input = [...new Set(modelSource.input)].sort();
      fieldCounts.input += 1;
    }
    if (typeof modelSource.reasoning === "boolean") {
      model.reasoning = modelSource.reasoning;
      fieldCounts.reasoning += 1;
    }
    const contextWindow = safeInteger(modelSource.contextWindow);
    if (contextWindow !== undefined) {
      model.contextWindow = contextWindow;
      fieldCounts.contextWindow += 1;
    }
    const maxTokens = safeInteger(modelSource.maxTokens);
    if (maxTokens !== undefined) {
      model.maxTokens = maxTokens;
      fieldCounts.maxTokens += 1;
    }
    const inputCost = costRate(modelSource.cost?.input);
    const outputCost = costRate(modelSource.cost?.output);
    if (inputCost !== undefined || outputCost !== undefined) {
      model.cost = {};
      if (inputCost !== undefined) {
        model.cost.input = inputCost;
        fieldCounts["cost.input"] += 1;
      }
      if (outputCost !== undefined) {
        model.cost.output = outputCost;
        fieldCounts["cost.output"] += 1;
      }
    }
    const thinkingLevelMap = safeThinkingLevelMap(modelSource.thinkingLevelMap);
    if (thinkingLevelMap !== undefined) {
      model.thinkingLevelMap = thinkingLevelMap;
      fieldCounts.thinkingLevelMap += 1;
    }
    models.push(model);
  }
  models.sort((a, b) => a.id.localeCompare(b.id));
  const checkedAt = safeString(providerSource?.checkedAt);
  const provider = { providerKey, recordCount: models.length, fieldCounts, models };
  if (checkedAt !== undefined) provider.checkedAt = checkedAt;
  providers.push(provider);
}

if (duplicateIdentities.length > 0) {
  throw new Error(`Ambiguous provider/model identities refuse export: ${JSON.stringify(duplicateIdentities)}`);
}

const catalogProjection = {
  projectionVersion: 1,
  providers,
};

const settingsProviders = [];
for (const providerKey of Object.keys(rawSettings.providers ?? {}).sort()) {
  const providerSource = rawSettings.providers[providerKey];
  const provider = { providerKey };
  const baseUrl = publicUrl(providerSource?.baseUrl);
  if (baseUrl !== undefined) provider.baseUrl = baseUrl;
  settingsProviders.push(provider);
}

const settingsProjection = {
  defaultProvider: safeString(rawSettings.defaultProvider) ?? null,
  defaultModel: safeString(rawSettings.defaultModel) ?? null,
  enabledModels: Array.isArray(rawSettings.enabledModels) ? rawSettings.enabledModels.filter((item) => typeof item === "string") : [],
  defaultThinkingLevel: safeString(rawSettings.defaultThinkingLevel) ?? null,
  providers: settingsProviders,
};

const catalogText = stableJson(catalogProjection);
const settingsText = stableJson(settingsProjection);
mkdirSync(outputDir, { recursive: true });
const catalogPath = join(outputDir, "catalog-projection.json");
const settingsPath = join(outputDir, "settings-projection.json");
const manifestPath = join(outputDir, "export-manifest.json");
const catalogOutputBytes = Buffer.from(catalogText, "utf8");
const settingsOutputBytes = Buffer.from(settingsText, "utf8");
writeFileSync(catalogPath, catalogOutputBytes);
writeFileSync(settingsPath, settingsOutputBytes);

let requiredOpenRouterIdentities = [];
try {
  const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
  requiredOpenRouterIdentities = Object.values(snapshot.repositoryFacts?.tiers ?? {})
    .flat()
    .map((entry) => entry?.id)
    .filter((id) => typeof id === "string");
} catch {
  requiredOpenRouterIdentities = [];
}
requiredOpenRouterIdentities = [...new Set([...requiredOpenRouterIdentities, "typesafe/jev-1.13"])].sort();
const openrouterProjection = providers.find((provider) => provider.providerKey === "openrouter");
const openrouterIds = new Set(openrouterProjection?.models.map((model) => model.id) ?? []);

function projectionMeta(fileName, bytes, observation, sourceRole, safeLocator, fieldCoverage, omissions) {
  return {
    file: fileName,
    sourceRole,
    owner: "host-owner",
    safeLocator,
    exactSourceBinding: {
      kind: "host-owner-retained-local-binding",
      value: safeLocator,
      retainedByOwner: true,
      disclosure: "coordinator-only when needed; contains no credential material",
    },
    acquisitionTimeUtc: observation.acquiredAtUtc,
    sourceCheckedAt: sourceRole === "H02"
      ? Object.fromEntries(providers.filter((provider) => provider.checkedAt).map((provider) => [provider.providerKey, provider.checkedAt]))
      : {},
    extractionMethod: {
      name: "host-owner allowlist projection",
      version: extractorVersion,
      implementation: "tools/rcm-p0-export.mjs",
      exclusionBeforeBoundary: true,
    },
    fieldCoverage,
    explicitOmissions: omissions,
    byteFormat: {
      encoding: "UTF-8",
      bom: false,
      lineEndings: "LF",
      byteLength: bytes.length,
    },
    sha256: sha256(bytes),
    sourceStability: observation.sourceStability,
  };
}

const manifest = {
  manifestVersion: 1,
  purpose: "RCM-P0 host-owner sanitized export",
  generatedAtUtc: new Date().toISOString(),
  sourceBoundary: {
    credentialValuesExported: false,
    secretUrlsExported: false,
    rawMixedDocumentBytesExported: false,
    rawSourceBytesHashed: false,
    hashedBytes: "sanitized projection bytes only",
    note: "No credentials, headers, auth-file data, environment dumps, private endpoints, URL userinfo/query/fragment, arbitrary compat payloads, PII, or raw mixed-document bytes were exported or hashed.",
  },
  projections: [
    projectionMeta(
      "catalog-projection.json",
      catalogOutputBytes,
      catalogObservation,
      "H02",
      "pi-agent/models-store.json",
      {
        modelRecords: identities.size,
        providerRecords: providers.length,
        included: safeCatalogFields,
        inventory: "fieldCounts are counts of safe allowlisted fields present across each provider's model records",
      },
      ["name", "lastModified", "etag", "headers", "compat", "cacheRead cost", "cacheWrite cost", "all non-allowlisted fields"],
    ),
    projectionMeta(
      "settings-projection.json",
      settingsOutputBytes,
      settingsObservation,
      "H03",
      "pi-agent/settings.json",
      {
        included: ["defaultProvider", "defaultModel", "enabledModels", "defaultThinkingLevel", "provider keys", "public baseUrl values"],
        providerCount: settingsProviders.length,
      },
      ["headers", "apiKey values", "credential references", "auth-file data", "private endpoints", "URL userinfo/query/fragment", "packages", "unrelated UI settings", "PII"],
    ),
  ],
  catalogCoverage: {
    mode: "full Pi models-store catalog projection",
    openrouterRequiredIdentities: requiredOpenRouterIdentities,
    openrouterObservedRequiredIdentities: requiredOpenRouterIdentities.filter((id) => openrouterIds.has(id)),
    openrouterMissingRequiredIdentities: requiredOpenRouterIdentities.filter((id) => !openrouterIds.has(id)),
    separateOpenCodeExportRequired: !settingsProviders.some((provider) => ["opencode", "opencode-go"].includes(provider.providerKey)),
    duplicateProviderModelIdentities: duplicateIdentities,
  },
  acceptanceStatus: {
    liveEvidence: "not-yet-accepted",
    freshnessBound: "not-accepted-by-coordinator",
    downstreamAuthority: "existing complete:false snapshot remains authoritative until fresh verification passes",
    sideEffectsAuthorized: false,
  },
};

const manifestText = stableJson(manifest);
writeFileSync(manifestPath, Buffer.from(manifestText, "utf8"));

console.log(JSON.stringify({
  outputDir,
  files: [
    { file: catalogPath, bytes: catalogOutputBytes.length, sha256: sha256(catalogOutputBytes) },
    { file: settingsPath, bytes: settingsOutputBytes.length, sha256: sha256(settingsOutputBytes) },
    { file: manifestPath, bytes: Buffer.byteLength(manifestText, "utf8") },
  ],
  catalogProviders: providers.length,
  catalogModels: identities.size,
  settingsProviders: settingsProviders.map((provider) => provider.providerKey),
  openrouterRequiredIdentities: requiredOpenRouterIdentities.length,
  openrouterObservedRequiredIdentities: requiredOpenRouterIdentities.filter((id) => openrouterIds.has(id)).length,
  openrouterMissingRequiredIdentities: requiredOpenRouterIdentities.filter((id) => !openrouterIds.has(id)),
}, null, 2));
