"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const test = require("node:test");

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

test("all plugin manifests use the latest release tag", () => {
  const expectedVersion = execFileSync(
    "git",
    ["describe", "--tags", "--abbrev=0"],
    { encoding: "utf8" },
  ).trim();

  for (const manifestPath of manifestPaths) {
    for (const { label, version } of readManifestVersions(manifestPath)) {
      assert.equal(
        version,
        expectedVersion,
        `${manifestPath} [${label}] must use version ${expectedVersion}`,
      );
    }
  }
});
