#!/usr/bin/env node

"use strict";

const { execFileSync } = require("node:child_process");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");

// The root plugin ("agent-skills") tracks the release tag. Every other plugin
// carries its own version in its own manifest(s), and each marketplace entry
// must agree with the plugin it points at (per-plugin releases, e.g.
// foreman-line 0.2.0 while the repo tag is 0.6.9).
const rootManifestPaths = [
  "plugin.json",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
];

const marketplacePaths = [
  ".claude-plugin/marketplace.json",
  ".agents/plugins/marketplace.json",
];

const pluginManifestRels = [
  ".claude-plugin/plugin.json",
  ".codex-plugin/plugin.json",
];

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function versionOf(filePath) {
  return readJson(filePath).version ?? "<missing>";
}

// Marketplace `source` shapes: a plain local path (".claude-plugin") or
// { source: "local", path } (".agents"). Anything else is refused — a remote
// or unrecognized source has no manifest to bind against.
function entryPluginDir(entry) {
  const source = entry?.source;
  if (typeof source === "string") return source;
  if (
    source !== null &&
    typeof source === "object" &&
    source.source === "local" &&
    typeof source.path === "string"
  ) {
    return source.path;
  }
  return null;
}

const expectedVersion = execFileSync(
  "git",
  ["describe", "--tags", "--abbrev=0", "--match", "[0-9]*.[0-9]*.[0-9]*"],
  { encoding: "utf8" },
).trim();

for (const manifestPath of rootManifestPaths) {
  const version = readJson(manifestPath).version;
  if (version !== expectedVersion) {
    throw new Error(
      `${manifestPath} [root] has version ${version ?? "<missing>"}; expected ${expectedVersion}`,
    );
  }
}

for (const marketplacePath of marketplacePaths) {
  const manifest = readJson(marketplacePath);
  const plugins = Array.isArray(manifest.plugins) ? manifest.plugins : null;
  if (plugins === null) {
    throw new Error(`${marketplacePath} has no plugins array`);
  }
  for (const [index, entry] of plugins.entries()) {
    const label = entry?.name ?? `#${index}`;
    const dir = entryPluginDir(entry);
    if (dir === null) {
      throw new Error(
        `${marketplacePath} [${label}] has an unsupported source; expected a local path`,
      );
    }
    let expected;
    if (dir === "./" || dir === "." || dir === "") {
      expected = expectedVersion;
    } else {
      const manifestPaths = pluginManifestRels
        .map((rel) => path.join(dir, rel))
        .filter((candidate) => existsSync(candidate));
      if (manifestPaths.length === 0) {
        throw new Error(
          `${marketplacePath} [${label}] points at ${dir}, which has no plugin manifest`,
        );
      }
      const versions = manifestPaths.map(versionOf);
      if (versions.some((version) => version !== versions[0])) {
        throw new Error(
          `${marketplacePath} [${label}] plugin manifests disagree: ${manifestPaths
            .map((manifestPath, i) => `${manifestPath}=${versions[i]}`)
            .join(", ")}`,
        );
      }
      expected = versions[0];
    }
    const version = entry?.version ?? "<missing>";
    if (version !== expected) {
      throw new Error(
        `${marketplacePath} [${label}] has version ${version}; expected ${expected}`,
      );
    }
  }
}

console.log(
  `All plugin manifests are consistent (release tag ${expectedVersion}).`,
);
