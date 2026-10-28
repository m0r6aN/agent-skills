#!/usr/bin/env node
// Human-operated helper for an explicitly accepted configured-control exception.
// --check never launches a process. --run requires a real interactive terminal.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { inspectConfig, childEnvironment, reviewArguments, claimAttempt, supervise, inspectResponse, sha256 } from './review-core.mjs';

async function main() {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === '--prepare' && args.length === 5) {
    const [packet, authority, executable, runDirectory, destination] = args.map(x => resolve(x));
    const pin = path => ({ path, sha256: sha256(readFileSync(path)) });
    const config = { version: 1, envelope: 'manual-claude-configured-v1',
      packet: { ...pin(packet), bytes: readFileSync(packet).length }, authority: pin(authority),
      executable: { ...pin(executable), version: '2.1.303' }, model: 'claude-opus-5-5', authorFamily: 'openai',
      systemPrompt: 'You are an independent adversarial plan reviewer. Use only the supplied packet; no tools, prior conversations, repository context or implementation. Return concise evidence-backed findings and proposed corrections. A separately human-approved manual review envelope, if applicable, changes only this review transport, not the design under review. Do not claim enforced billing, complete token counts or remote cancellation.',
      runDirectory, outputTokens: 4000, timeoutSeconds: 600 };
    inspectConfig(config);
    writeFileSync(destination, JSON.stringify(config, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    console.log(`Prepared ${destination}. No approval inferred and no process launched. Check authorFamily and systemPrompt against the actual approved scope.`);
    return;
  }
  if (!['--check', '--run'].includes(mode) || args.length !== 1) throw new Error(
    'Usage: node manual-claude.mjs --check|--run manifest.json\nPrepare: --prepare PACKET AUTHORITY_RECORD NATIVE_CLAUDE_EXE NEW_RUN_DIRECTORY NEW_MANIFEST');
  if (mode === '--run' && (!process.stdin.isTTY || !process.stdout.isTTY)) throw new Error('Human-operated mode requires an interactive terminal; no unattended or piped confirmation');
  const manifestPath = resolve(args[0]);
  const config = JSON.parse(readFileSync(manifestPath, 'utf8'));
  inspectConfig(config);
  if (existsSync(config.runDirectory)) throw new Error('Attempt directory already exists. Preserve it and reconcile; this helper cannot retry or reset it.');
  console.log(JSON.stringify({ status: 'prepared-only', envelope: config.envelope,
    packet: config.packet, authorityRecord: config.authority.path, model: config.model,
    attemptDirectory: config.runDirectory, configuredOutputTokens: 4000, localDeadlineSeconds: 600,
    requires: ['actual scoped manual-review approval', 'included-only first-party Max with paid extra usage OFF',
      'model improvement OFF; standard retention explicitly accepted', 'managed policy inspected: no added context/hooks/tools/recipient',
      'no earlier attempt on either machine; active coordinator retains ownership'],
    doesNotEstablish: ['Foreman admission', 'OS sandbox', 'total request token bound', 'hard all-output token bound',
      'hard client billing cap', 'remote cancellation', 'distributed single-use permit'] }, null, 2));
  if (mode === '--check') return;
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  let confirmation;
  try { confirmation = await terminal.question('\nRead the requirements above. Type SEND-ONCE only if each is satisfied and this exact packet/recipient is authorized: '); }
  finally { terminal.close(); }
  if (confirmation !== 'SEND-ONCE') throw new Error('Cancelled before launch');
  // Recheck after the operator pause. Pass these exact verified bytes to stdin.
  const { packet } = inspectConfig(config);
  claimAttempt(config, { confirmedAt: new Date().toISOString(), source: 'interactive human SEND-ONCE; not machine attestation' });
  const cwd = join(config.runDirectory, 'cwd');
  const env = childEnvironment(process.env);
  const save = (name, value) => writeFileSync(join(config.runDirectory, name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  let invocationStarted = false;
  try {
    const metadata = argv => execFileSync(config.executable.path, argv, {
      cwd, env, shell: false, windowsHide: true, encoding: 'utf8', timeout: 20000,
      maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    if (metadata(['--version']) !== '2.1.303 (Claude Code)') throw new Error('CLI version mismatch');
    const auth = JSON.parse(metadata(['auth', 'status', '--json']));
    if (auth.loggedIn !== true || auth.authMethod !== 'claude.ai' || auth.apiProvider !== 'firstParty' || auth.subscriptionType !== 'max') throw new Error('Required first-party Max authentication is not established');
    // Retain only readiness fields, never raw auth output or account identifiers.
    save('preflight.json', { cliVersion: '2.1.303', loggedIn: true, authMethod: 'claude.ai',
      apiProvider: 'firstParty', subscriptionType: 'max', observedAt: new Date().toISOString(),
      billingAndPrivacyEvidence: 'human-observed, not verified by auth metadata' });
    inspectConfig(config);
    const argv = reviewArguments(config);
    save('invocation.json', { executable: config.executable, argv, cwd, packet: config.packet,
      shell: false, attempts: 1, noFallback: true, noForemanReceipt: true });
    invocationStarted = true;
    const execution = await supervise({ command: config.executable.path, args: argv, cwd, env,
      input: packet, outputDirectory: config.runDirectory, timeoutMs: 600000 });
    save('execution.json', execution);
    const result = inspectResponse(readFileSync(join(config.runDirectory, 'response.jsonl'), 'utf8'));
    if (execution.reason || execution.exitCode !== 0 || !execution.localExitObserved) {
      result.status = 'held'; result.reasons.push(execution.reason ?? 'NONZERO_OR_UNOBSERVED_EXIT'); delete result.text;
    }
    save('result.json', result);
    if (result.status === 'captured') writeFileSync(join(config.runDirectory, 'review.txt'), result.text + '\n', { flag: 'wx', mode: 0o600 });
    console.log(`${result.status}: ${config.runDirectory}. Coordinator triage is required. No gate or route has been approved.`);
    if (result.status !== 'captured') process.exitCode = 2;
  } catch {
    // exec errors can contain raw auth stdout/stderr. Never echo or persist them.
    save('held.json', { status: 'held', phase: invocationStarted ? 'execution-or-capture' : 'metadata-preflight',
      remoteOutcome: invocationStarted ? 'unknown' : 'no review invocation',
      instruction: 'Preserve this attempt. Inspect local metadata/account conditions without sharing raw auth output. No automatic retry.' });
    console.error(`Held; see ${config.runDirectory}. Raw authentication output was not recorded.`);
    process.exitCode = 2;
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 2; });
