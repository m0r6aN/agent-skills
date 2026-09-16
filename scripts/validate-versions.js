#!/usr/bin/env node

"use strict";

const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");

const manifestPaths = [
  "plugin.json",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".agents/plugins/marketplace.json",
];

function readManifestVersions(manifestPath) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (Array.isArray(manifest.plugins)) {
    return manifest.plugins.map((plugin, index) => ({
      label: plugin?.name ?? `#${index}`,
      version: plugin?.version,
    }));
  }
  return [{ label: manifestPath, version: manifest.version }];
}

const expectedVersion = execFileSync(
  "git",
  ["describe", "--tags", "--abbrev=0"],
  { encoding: "utf8" },
).trim();

for (const manifestPath of manifestPaths) {
  for (const { label, version } of readManifestVersions(manifestPath)) {
    if (version !== expectedVersion) {
      throw new Error(
        `${manifestPath} [${label}] has version ${version ?? "<missing>"}; expected ${expectedVersion}`,
      );
    }
  }
}

console.log(`All plugin manifests use version ${expectedVersion}.`);
