#!/usr/bin/env node
/**
 * validate-skills.js
 *
 * CLI that validates every skill in skills/ against the rules in
 * docs/skill-anatomy.md. The rules themselves live in scripts/lib/skill-lint.js
 * (a single source of truth, importable and unit-testable); this file is a thin
 * wrapper that walks the skills directory, runs the linter, prints the report,
 * and sets the exit code.
 *
 * Exit codes: 0 = all clear, 1 = one or more errors
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const { lintSkill } = require('./lib/skill-lint');

const SKILLS_DIR = path.resolve(__dirname, '..', 'skills');

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.error(`ERROR: skills directory not found at ${SKILLS_DIR}`);
    process.exit(1);
  }

  // `skills/` also holds non-skill directories: dot-directories (quarantine,
  // editor state) and containers that hold skills one level down (the synced
  // cache). Linting those as skills kept CI red on every run, which is how a
  // real frontmatter error went unnoticed. A directory is a skill iff it has a
  // SKILL.md; one with neither a SKILL.md nor nested skills is still an error,
  // so a skill whose file is missing cannot slip through silently.
  const allDirs = fs.readdirSync(SKILLS_DIR)
    .filter(d => fs.statSync(path.join(SKILLS_DIR, d)).isDirectory())
    .sort();

  const hasNestedSkill = (dir, depth = 0) => {
    if (depth > 3) return false;
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .some(entry => {
        const child = path.join(dir, entry.name);
        return fs.existsSync(path.join(child, 'SKILL.md')) || hasNestedSkill(child, depth + 1);
      });
  };

  const isContainer = d => !fs.existsSync(path.join(SKILLS_DIR, d, 'SKILL.md'))
    && (d.startsWith('.') || hasNestedSkill(path.join(SKILLS_DIR, d)));

  const skillDirs = allDirs.filter(d => !isContainer(d));
  const skipped   = allDirs.filter(isContainer);

  const knownSkills = new Set(skillDirs);

  let totalErrors   = 0;
  let totalWarnings = 0;

  for (const dirName of skillDirs) {
    const { errors, warnings, exempt } = lintSkill(dirName, SKILLS_DIR, knownSkills);
    totalErrors   += errors.length;
    totalWarnings += warnings.length;

    if (errors.length === 0 && warnings.length === 0) {
      const tag = exempt ? ' (section checks exempt)' : '';
      console.log(`  ✓  ${dirName}${tag}`);
    } else {
      const icon = errors.length > 0 ? '  ✗ ' : '  ⚠ ';
      console.log(`${icon} ${dirName}`);
      for (const msg of errors)   console.log(`       ERROR: ${msg}`);
      for (const msg of warnings) console.log(`       WARN:  ${msg}`);
    }
  }

  for (const dirName of skipped) {
    console.log(`  ·  ${dirName} (not a skill directory — skipped)`);
  }

  const status = totalErrors > 0 ? 'FAILED' : totalWarnings > 0 ? 'PASSED WITH WARNINGS' : 'PASSED';
  console.log(`\n${skillDirs.length} skills checked — ${totalErrors} error(s), ${totalWarnings} warning(s) — ${status}`);

  if (totalErrors > 0) process.exit(1);
}

// Surface unexpected failures (fs errors, bad symlinks, …) as a structured
// one-line CI error instead of an uncaught stack trace.
try {
  main();
} catch (err) {
  console.error(`\nERROR: validate-skills failed unexpectedly: ${err.message}`);
  process.exit(1);
}
