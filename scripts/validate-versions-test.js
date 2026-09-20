"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const manifestPaths = [
  "plugin.json",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".agents/plugins/marketplace.json",
];

function readManifestVersions(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
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

test("rejects a stale non-first marketplace entry (negative probe)", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "versions-neg-"));
  try {
    const write = (rel, obj) => {
      const full = path.join(dir, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, JSON.stringify(obj));
    };
    write("plugin.json", { version: "9.9.9" });
    write(".codex-plugin/plugin.json", { version: "9.9.9" });
    write(".claude-plugin/plugin.json", { version: "9.9.9" });
    write(".claude-plugin/marketplace.json", {
      plugins: [
        { name: "foreman-line", version: "9.9.9" },
        { name: "audit-suite", version: "0.0.0" },
      ],
    });
    write(".agents/plugins/marketplace.json", {
      plugins: [{ name: "agent-skills", version: "9.9.9" }],
    });
    const git = (args) =>
      execFileSync("git", args, { cwd: dir, stdio: "pipe" });
    git(["init", "-q"]);
    git(["config", "user.email", "test@example.com"]);
    git(["config", "user.name", "test"]);
    git(["add", "."]);
    git(["commit", "-qm", "fixture"]);
    git(["tag", "9.9.9"]);
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [path.join(__dirname, "validate-versions.js")],
          { cwd: dir, stdio: "pipe" },
        ),
      /\[audit-suite\] has version 0\.0\.0/,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
