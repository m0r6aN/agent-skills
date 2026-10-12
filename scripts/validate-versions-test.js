"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const validator = path.join(__dirname, "validate-versions.js");

// Per-plugin version model: root manifests track the release tag; every
// marketplace entry binds the version of the plugin manifest it points at.
function makeFixtureRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "versions-"));
  const write = (rel, obj) => {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, JSON.stringify(obj));
  };
  write("plugin.json", { version: "9.9.9" });
  write(".codex-plugin/plugin.json", { version: "9.9.9" });
  write(".claude-plugin/plugin.json", { version: "9.9.9" });
  write("plugins/foreman-line/.claude-plugin/plugin.json", { version: "9.9.9" });
  write("plugins/foreman-line/.codex-plugin/plugin.json", { version: "9.9.9" });
  write("plugins/audit-suite/.claude-plugin/plugin.json", { version: "9.9.9" });
  write(".claude-plugin/marketplace.json", {
    plugins: [
      { name: "agent-skills", source: "./", version: "9.9.9" },
      {
        name: "foreman-line",
        source: "./plugins/foreman-line",
        version: "9.9.9",
      },
      {
        name: "audit-suite",
        source: "./plugins/audit-suite",
        version: "9.9.9",
      },
    ],
  });
  write(".agents/plugins/marketplace.json", {
    plugins: [
      {
        name: "agent-skills",
        source: { source: "local", path: "./" },
        version: "9.9.9",
      },
      {
        name: "foreman-line",
        source: { source: "local", path: "./plugins/foreman-line" },
        version: "9.9.9",
      },
    ],
  });
  const git = (args) => execFileSync("git", args, { cwd: dir, stdio: "pipe" });
  git(["init", "-q"]);
  git(["config", "user.email", "test@example.com"]);
  git(["config", "user.name", "test"]);
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);
  git(["tag", "9.9.9"]);
  return { dir, write };
}

function runValidator(dir) {
  return execFileSync(process.execPath, [validator], {
    cwd: dir,
    stdio: "pipe",
  });
}

test("validate-versions passes on the repository", () => {
  const out = runValidator(path.join(__dirname, ".."));
  assert.match(String(out), /All plugin manifests are consistent/);
});

test("fixture repo passes with per-plugin versions (positive control)", () => {
  const { dir, write } = makeFixtureRepo();
  try {
    write(".claude-plugin/marketplace.json", {
      plugins: [
        { name: "agent-skills", source: "./", version: "9.9.9" },
        {
          name: "foreman-line",
          source: "./plugins/foreman-line",
          version: "0.2.0",
        },
        {
          name: "audit-suite",
          source: "./plugins/audit-suite",
          version: "9.9.9",
        },
      ],
    });
    write("plugins/foreman-line/.claude-plugin/plugin.json", {
      version: "0.2.0",
    });
    write("plugins/foreman-line/.codex-plugin/plugin.json", {
      version: "0.2.0",
    });
    write(".agents/plugins/marketplace.json", {
      plugins: [
        {
          name: "agent-skills",
          source: { source: "local", path: "./" },
          version: "9.9.9",
        },
        {
          name: "foreman-line",
          source: { source: "local", path: "./plugins/foreman-line" },
          version: "0.2.0",
        },
      ],
    });
    runValidator(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("rejects a stale non-first marketplace entry (negative probe)", () => {
  const { dir, write } = makeFixtureRepo();
  try {
    write(".claude-plugin/marketplace.json", {
      plugins: [
        { name: "agent-skills", source: "./", version: "9.9.9" },
        {
          name: "foreman-line",
          source: "./plugins/foreman-line",
          version: "9.9.9",
        },
        {
          name: "audit-suite",
          source: "./plugins/audit-suite",
          version: "0.0.0",
        },
      ],
    });
    assert.throws(() => runValidator(dir), /\[audit-suite\] has version 0\.0\.0/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("rejects a cross-marketplace entry drift (negative probe)", () => {
  const { dir, write } = makeFixtureRepo();
  try {
    write(".agents/plugins/marketplace.json", {
      plugins: [
        {
          name: "agent-skills",
          source: { source: "local", path: "./" },
          version: "9.9.9",
        },
        {
          name: "foreman-line",
          source: { source: "local", path: "./plugins/foreman-line" },
          version: "0.6.9",
        },
      ],
    });
    assert.throws(
      () => runValidator(dir),
      /\.agents\/plugins\/marketplace\.json \[foreman-line\] has version 0\.6\.9/,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("rejects disagreeing plugin manifests (negative probe)", () => {
  const { dir, write } = makeFixtureRepo();
  try {
    write("plugins/foreman-line/.codex-plugin/plugin.json", {
      version: "8.8.8",
    });
    assert.throws(() => runValidator(dir), /plugin manifests disagree/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("rejects a root manifest drift from the release tag (negative probe)", () => {
  const { dir, write } = makeFixtureRepo();
  try {
    write("plugin.json", { version: "8.8.8" });
    assert.throws(() => runValidator(dir), /\[root\] has version 8\.8\.8/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
