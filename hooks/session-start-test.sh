#!/bin/bash
# session-start-test.sh - Tests for the SessionStart hook JSON payload

set -euo pipefail

tmp_payload="$(mktemp)"
trap 'rm -f "$tmp_payload"' EXIT

has_jq=0
if command -v jq >/dev/null 2>&1; then
  has_jq=1
fi

payload="$(bash hooks/session-start.sh)"
printf '%s' "$payload" > "$tmp_payload"

HAS_JQ="$has_jq" PAYLOAD_PATH="$tmp_payload" node <<'NODE'
const fs = require('fs');

const payload = JSON.parse(fs.readFileSync(process.env.PAYLOAD_PATH, 'utf8'));
const hasJq = process.env.HAS_JQ === '1';

// session-start.sh emits the standard SessionStart envelope
// {"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "..."}}
const out = payload.hookSpecificOutput;
if (!out || out.hookEventName !== 'SessionStart') {
  throw new Error(`expected SessionStart envelope, got ${JSON.stringify(payload).slice(0, 120)}`);
}
const message = out.additionalContext;

if (hasJq) {
  if (!message.includes('agent-skills loaded.')) {
    throw new Error('context is missing startup preface');
  }

  if (!message.includes('# Using Agent Skills')) {
    throw new Error('context is missing using-agent-skills content');
  }
} else {
  if (!message.includes('jq is required')) {
    throw new Error('context is missing jq fallback guidance');
  }
}

console.log('session-start JSON payload OK');
NODE
