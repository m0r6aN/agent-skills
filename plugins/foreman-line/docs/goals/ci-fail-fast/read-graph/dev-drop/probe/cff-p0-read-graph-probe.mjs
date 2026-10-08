// CFF-P0 D7 read-graph MEASUREMENT VEHICLE — scratch branch only.
// COORDINATOR RULING (2026-10-08): this file lives SOLELY on
// `measure/cff-p0-read-graph` and dies with that branch. It never merges.
//
// Role: OBSERVE file opens at test time — imports AND non-import couplings
// (materialized temp-repo reads, fixture path strings, generation targets,
// module-load reads) — without forking or modifying runner logic (D2). It
// never changes a return value, never throws into caller code, never
// changes control flow. Pure observation.
//
// Loaded via NODE_OPTIONS="--require=<abs path to this file>". A single file
// serves two roles:
//   1. A CommonJS-loadable probe (Node's require(ESM) support) that patches
//      `node:fs` read surfaces and `Module._load` to observe non-import and
//      CJS-require reads in the MAIN thread.
//   2. A node:module customization hook (`resolve`/`load` exports) that the
//      same file self-registers via `module.register()` to observe ESM
//      import resolution/load — this runs in Node's dedicated hooks thread,
//      guarded by `isMainThread` so the self-registration in (1) never
//      recurses into the hooks thread.
//
// Silent no-op if READGRAPH_CAPTURE_DIR is unset — this file must never
// change behavior for any invocation that does not opt in.

import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { isMainThread } = require('node:worker_threads');

const CAPTURE_DIR = process.env.READGRAPH_CAPTURE_DIR;
const THREAD_TAG = isMainThread ? 'main' : 'hooks';

function appendRecord(kind, target) {
  if (!CAPTURE_DIR || typeof target !== 'string' || target.length === 0) return;
  try {
    fs.mkdirSync(CAPTURE_DIR, { recursive: true });
    const file = path.join(CAPTURE_DIR, `capture-${process.pid}-${THREAD_TAG}.jsonl`);
    const line = JSON.stringify({
      kind,
      path: target,
      cwd: process.cwd(),
      pid: process.pid,
      thread: THREAD_TAG,
      argv1: process.argv[1] ?? null,
      ts: Date.now(),
    });
    fs.appendFileSync(file, `${line}\n`);
  } catch {
    // Observation must never break the run it observes.
  }
}

function toStr(p) {
  if (typeof p === 'string') return p;
  if (p && typeof p.toString === 'function') {
    try {
      return p.toString();
    } catch {
      return null;
    }
  }
  return null;
}

// ---- Main-thread observation: non-import fs reads + CJS require ---------
if (CAPTURE_DIR && isMainThread && !globalThis.__CFF_P0_READGRAPH_FS_PATCHED__) {
  globalThis.__CFF_P0_READGRAPH_FS_PATCHED__ = true;

  const wrap = (obj, name, kind) => {
    const orig = obj && obj[name];
    if (typeof orig !== 'function') return;
    obj[name] = function patched(p, ...rest) {
      appendRecord(kind, toStr(p));
      return orig.call(this, p, ...rest);
    };
  };

  wrap(fs, 'readFileSync', 'fs.readFileSync');
  wrap(fs, 'readFile', 'fs.readFile');
  wrap(fs, 'openSync', 'fs.openSync');
  wrap(fs, 'open', 'fs.open');
  wrap(fs, 'existsSync', 'fs.existsSync');
  wrap(fs, 'statSync', 'fs.statSync');
  wrap(fs, 'lstatSync', 'fs.lstatSync');
  wrap(fs, 'createReadStream', 'fs.createReadStream');
  if (fs.promises) {
    wrap(fs.promises, 'readFile', 'fs.promises.readFile');
    wrap(fs.promises, 'open', 'fs.promises.open');
    wrap(fs.promises, 'stat', 'fs.promises.stat');
  }

  const origLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    try {
      const resolved = Module._resolveFilename(request, parent, isMain);
      appendRecord('cjs.require', resolved);
    } catch {
      // Builtins and unresolvable specifiers are not file reads — skip.
    }
    return origLoad.apply(this, arguments);
  };
}

// ---- ESM module customization hooks (import observation) ----------------
// Exported for `module.register()`. These hooks only observe — they return
// `nextResolve`/`nextLoad`'s result verbatim, never altering it (D2).
export async function resolve(specifier, context, nextResolve) {
  const result = await nextResolve(specifier, context);
  appendRecord('esm.resolve', result && result.url ? safeFsPath(result.url) : null);
  return result;
}

export async function load(url, context, nextLoad) {
  appendRecord('esm.load', safeFsPath(url));
  return nextLoad(url, context);
}

function safeFsPath(url) {
  try {
    return typeof url === 'string' && url.startsWith('file://') ? fileURLToPath(url) : url;
  } catch {
    return url ?? null;
  }
}

// Self-register as the ESM hooks module. Guarded by isMainThread so the
// hooks thread (which re-evaluates this same module) never tries to spawn
// another hooks thread — no recursion.
if (CAPTURE_DIR && isMainThread && !globalThis.__CFF_P0_READGRAPH_LOADER_REGISTERED__) {
  globalThis.__CFF_P0_READGRAPH_LOADER_REGISTERED__ = true;
  try {
    const selfUrl = pathToFileURL(fileURLToPath(import.meta.url)).href;
    Module.register(selfUrl, { parentURL: import.meta.url });
  } catch {
    // Hooks registration unsupported on this host — fs/CJS observation still
    // stands; ESM import edges simply fall back to uncaptured on that host
    // (recorded honestly in measurement-log.md, never silently assumed).
  }
}
