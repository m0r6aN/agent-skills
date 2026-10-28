# Omarchy Pi transport preflight — completed October 21

Status: **READ-ONLY METADATA PREFLIGHT PASS**. Connection details are resolved;
no further SSH-details request is needed. This is not model/role admission,
provider inference or uncertain-outcome continuation approval.

## Established destination and source

- Destination: `cmorgan76@10.0.0.174` (default SSH port22).
- Existing identity: `C:/Users/clint/.ssh/pantheon_machine_b`; private content was
  not inspected. Existing authentication succeeded without prompts or changes.
- Source: prior successful October18 inventory in
  `../pantheon-incarnation-v0/machine-b-preflight.md`, corroborated by that goal's
  `gate-record.md` owner-supplied access record. Reading this evidence does not
  transfer that goal or its permissions; today's user directly authorized this
  Context read-only preflight.
- Expected stored ED25519 fingerprint:
  `SHA256:DYARjdrGe5f7RoL1lLGC6u102NYdFWiIAxNwLdSsv1A`.
  Local known_hosts matched, and strict SSH verification succeeded. No new host
  key was accepted or fresh out-of-band verification claimed.

## Three completed checks

1. `uname -s` → `Linux`, exit0,0.549s.
2. `command -v pi` → `/home/cmorgan76/.local/share/mise/shims/pi`, exit0,0.283s.
3. That exact executable's `--help` → successful metadata, exit0,0.857s.

Windows OpenSSH used BatchMode, strict stored ED25519, dedicated identity,
public-key-only authentication, no password/interactive fallback, no forwarding,
no host-key updates, connect timeout10s and one connection attempt. Each fixed
remote command had a15-second local timeout; retained stdout metadata was at
most2KiB per command. No session/prompt, inference, installation, model download,
configuration/key change, project write, Git mutation or network scan occurred.
Ordinary SSH/Pi-help logs/cache effects are not claimed absent.

[Local identity/trust evidence](evidence/omarchy-local-connection-evidence-20261021.json)
and [actual three-command evidence](evidence/omarchy-readonly-preflight-20261021.json)
retain exact timestamps, commands, exits, timing and bounded excerpts. Pi help
returned10705 bytes in memory; only selected metadata lines up to2KiB were retained.

## Transport-specific capability findings and remaining boundary

Help documents provider/model selection, text/json/rpc output, session file/id/
directory capture, `--no-tools` (built-in and extension tools), `--no-extensions`
(extension discovery and built-in extensions), and thinking-level selection.
This is static advertised support, not runtime enforcement evidence. No current
Pi version query was added after the three-command cap; the prior October18
record reported1.3.0, which is historical only.

The single candidate remains an isolated persistent Pi artifact-builder session
on this host, requested `openai/gpt-6.1-sol`; no second coordinator or repository
worker. Persistent remote session capture could make a connection loss
recoverable, but a different host does not prove a different provider endpoint
or prevent the original proxy's HTTP524. Exact configured provider/model,
existing entitlement/cost units, output/one-request controls, disabled retry,
actual safe session capture, timeout and cancellation limits remain unverified.
No paid continuation command, rate/cost quote, loaded Foreman profile or actual
model availability is invented from help text. Existing source/AC/reviewer
qualification is not reopened by these transport-specific gaps.

Preflight inference requests0; inference credit reservation0. Original request01
is still unusable with unknown upstream generation/billing attribution; preserve
full94.6 reservation. Known P1A reported95.7 plus unresolved94.6=190.3 of700.
October21 shared1000 exception and all other limits remain in force. Neither
budget nor SSH success disposes the uncertain-call hold. No support message,
retry/fallback, model session or duplicate worker was launched.
