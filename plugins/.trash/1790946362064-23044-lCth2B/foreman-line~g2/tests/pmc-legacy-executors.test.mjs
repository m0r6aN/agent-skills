import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const smokeUrl = new URL("./jev-smoke-test.mjs", import.meta.url);
const root = fileURLToPath(new URL("../../../", import.meta.url));
const expected = '{"ok":false,"code":"LEGACY_EXECUTION_RETIRED"}\n';

// No inherited environment or credentials enter these isolated children.
// Install traps before evaluating the target, not after its module-level effects.
const traps = String.raw`
  import assert from "node:assert/strict";
  const calls = [];
  globalThis.fetch = () => { calls.push("fetch"); throw new Error("network forbidden"); };
  process.env = new Proxy(Object.create(null), {
    get(_target, key) {
      if (typeof key === "string" && /KEY|TOKEN|SECRET|CREDENTIAL/.test(key)) {
        calls.push("credential");
        throw new Error("credential access forbidden");
      }
      return undefined;
    },
    ownKeys() { calls.push("environment enumeration"); throw new Error("environment enumeration forbidden"); },
  });
  const timeout = () => { calls.push("timeout"); throw new Error("timeout allocation forbidden"); };
  globalThis.setTimeout = timeout;
  AbortSignal.timeout = timeout;
  process.on("exit", () => assert.deepEqual(calls, []));
`;
const trapUrl = "data:text/javascript," + encodeURIComponent(traps);

function child(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env: { NODE_NO_WARNINGS: "1" },
    input: "ignored stdin must not be read",
    encoding: "utf8",
    timeout: 10_000,
    maxBuffer: 65_536,
    windowsHide: true,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  return result;
}

test("direct smoke command refuses with exact output before fetch or credential access", () => {
  const result = child(["--import", trapUrl, fileURLToPath(smokeUrl), "--enable", "--live"]);
  assert.equal(result.status, 2, result.stderr);
  assert.equal(result.stdout, expected);
  assert.equal(result.stderr, "");
});

test("module evaluation also refuses with exact output and ignores hostile input surfaces", () => {
  const script = traps + String.raw`
    Object.defineProperty(process, "argv", { get() { calls.push("argv"); throw new Error("argv forbidden"); } });
    Object.defineProperty(process, "stdin", { get() { calls.push("stdin"); throw new Error("stdin forbidden"); } });
    await import(SMOKE_URL);
  `;
  const result = child(["--input-type=module", "--eval", script.replace("SMOKE_URL", JSON.stringify(smokeUrl.href))]);
  assert.equal(result.status, 2, result.stderr);
  assert.equal(result.stdout, expected);
  assert.equal(result.stderr, "");
});

test("Jev direct and barrel calls cannot reach credential, timeout, lease, clock or transport", () => {
  const runtime = new URL("../jev-decisions/src/runtime.ts", import.meta.url).href;
  const barrel = new URL("../jev-decisions/src/index.ts", import.meta.url).href;
  const script = traps + String.raw`
    const direct = await import(RUNTIME_URL);
    const barrel = await import(BARREL_URL);
    assert.equal(direct.executeDecision, barrel.executeDecision);
    assert.equal(direct.LegacyDecisionRetiredError, barrel.LegacyDecisionRetiredError);
    let reads = 0;
    const hostile = new Proxy({}, { get() { reads++; throw new Error("input forbidden"); } });
    const clock = () => { calls.push("clock"); throw new Error("clock forbidden"); };
    const port = () => { calls.push("port"); throw new Error("port forbidden"); };
    for (const execute of [direct.executeDecision, barrel.executeDecision]) {
      for (const input of [hostile, null, {
        state: {}, lease: {}, budget_ack: {}, custody: {},
        clock: { now: clock }, lease_port: { claim: port, consume: port, terminal: port },
        transport: { post: port },
      }]) {
        await assert.rejects(execute(input), error => {
          assert.ok(error instanceof direct.LegacyDecisionRetiredError);
          assert.equal(error.code, "LEGACY_EXECUTION_RETIRED");
          assert.equal(error.message, "Legacy governed inference is retired.");
          return true;
        });
      }
    }
    assert.equal(reads, 0);
    assert.deepEqual(calls, []);
  `;
  const result = child(["--input-type=module", "--eval",
    script.replace("RUNTIME_URL", JSON.stringify(runtime)).replace("BARREL_URL", JSON.stringify(barrel))]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
});

for (const [name, operation] of [
  ["credential", "void process.env.OPENROUTER_API_KEY"],
  ["fetch", "fetch('https://example.invalid/never-sent')"],
  ["timeout", "AbortSignal.timeout(1)"],
]) {
  test("negative control: the isolated harness detects " + name + " access", () => {
    const result = child(["--input-type=module", "--eval", traps + operation]);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /forbidden/);
  });
}
