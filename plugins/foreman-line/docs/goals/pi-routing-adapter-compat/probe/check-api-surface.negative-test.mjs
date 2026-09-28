#!/usr/bin/env node
// PRAC-P0 negative test for check-api-surface.mjs fail-closed behavior. Builds a fake
// package tree at a temp root and runs the probe as a subprocess with PI_PKG_ROOT pointed
// at it (and PRAC_EVIDENCE_DIR at a temp dir, so the real evidence is never touched).
// Asserts every missing surface and a version mismatch exit non-zero, and a complete fake
// exits 0. Node stdlib only.

import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const probePath = join(dirname(fileURLToPath(import.meta.url)), 'check-api-surface.mjs');

function buildFake() {
  const root = mkdtempSync(join(tmpdir(), 'prac-probe-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fake-pi', version: '0.87.1' }));
  mkdirSync(join(root, 'docs'), { recursive: true });
  writeFileSync(join(root, 'docs', 'index.md'), '# fake index\n');
  writeFileSync(join(root, 'docs', 'extensions.md'), 'setActiveTools\n');
  mkdirSync(join(root, 'examples', 'extensions'), { recursive: true });
  writeFileSync(join(root, 'examples', 'extensions', 'demo.ts'), 'pi.setModel\n');
  mkdirSync(join(root, 'dist', 'core', 'extensions'), { recursive: true });
  writeFileSync(
    join(root, 'dist', 'core', 'extensions', 'types.d.ts'),
    'setModel(m: Model<any>): Promise<boolean>;\nsetThinkingLevel(l: ThinkingLevel): void;\n',
  );
  return root;
}

function run(root) {
  const outDir = mkdtempSync(join(tmpdir(), 'prac-out-'));
  const res = spawnSync(process.execPath, [probePath], {
    env: { ...process.env, PI_PKG_ROOT: root, PRAC_EVIDENCE_DIR: outDir },
    encoding: 'utf8',
  });
  rmSync(outDir, { recursive: true, force: true });
  return res.status;
}

const failures = [];

// Positive control: a complete fake layout exits 0.
{
  const root = buildFake();
  const code = run(root);
  if (code !== 0) failures.push(`complete fake expected exit 0, got ${code}`);
  rmSync(root, { recursive: true, force: true });
}

const cases = [
  { name: 'missing package.json', mutate: (r) => rmSync(join(r, 'package.json')) },
  { name: 'missing docs/index.md', mutate: (r) => rmSync(join(r, 'docs', 'index.md')) },
  { name: 'missing docs/extensions.md', mutate: (r) => rmSync(join(r, 'docs', 'extensions.md')) },
  { name: 'missing examples/extensions dir', mutate: (r) => rmSync(join(r, 'examples', 'extensions'), { recursive: true, force: true }) },
  { name: 'missing dist dir', mutate: (r) => rmSync(join(r, 'dist'), { recursive: true, force: true }) },
  { name: 'missing dist/core/extensions/types.d.ts', mutate: (r) => rmSync(join(r, 'dist', 'core', 'extensions', 'types.d.ts')) },
  { name: 'wrong version', mutate: (r) => writeFileSync(join(r, 'package.json'), JSON.stringify({ name: 'fake-pi', version: '0.86.1' })) },
];

for (const c of cases) {
  const root = buildFake();
  const outDir = mkdtempSync(join(tmpdir(), 'prac-out-'));
  c.mutate(root);
  const res = spawnSync(process.execPath, [probePath], {
    env: { ...process.env, PI_PKG_ROOT: root, PRAC_EVIDENCE_DIR: outDir },
    encoding: 'utf8',
  });
  if (res.status === 0) failures.push(`${c.name}: expected non-zero exit, got 0`);
  rmSync(root, { recursive: true, force: true });
  rmSync(outDir, { recursive: true, force: true });
}

if (failures.length) {
  process.stderr.write('NEGATIVE-TEST FAIL\n- ' + failures.join('\n- ') + '\n');
  process.exit(1);
}
process.stdout.write(
  'NEGATIVE-TEST PASS: complete fake exits 0; every missing surface and a version mismatch exit non-zero.\n',
);
