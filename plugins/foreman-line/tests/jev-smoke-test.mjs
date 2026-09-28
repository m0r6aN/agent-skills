#!/usr/bin/env node
// Retired governed inference entry: fixed refusal, no input or environment inspection.
process.stdout.write('{"ok":false,"code":"LEGACY_EXECUTION_RETIRED"}\n');
process.exitCode = 2;
