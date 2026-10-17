---
name: security-and-hardening
description: Build-time secure-coding guardrails. Use while writing or changing code that handles user input, authentication, sessions, secrets, personal data, external integrations, new dependencies, or LLM/tool calls. For reviewing, auditing, or threat-modeling existing code or systems, use security-review instead.
---

# Security and Hardening (build-time wrapper)

This is a thin wrapper. The canonical security skill is **security-review**. This wrapper only covers what to do *while building*.

## While writing code
1. Threat-model the change in 3 lines: what is the trust boundary, what is untrusted input, and what is the worst-case misuse.
2. Apply the matching patterns from `../security-review/references/secure-coding-patterns.md`:
   - input validation and output encoding (OWASP Top 10)
   - authn/authz, session handling, and rate limiting
   - secrets (never in code, config, logs, or prompts) and least-privilege credentials
   - dependency triage for any new package (`npm audit` / `pip-audit` / `dotnet list package --vulnerable`)
   - personal data minimization (GDPR/CCPA)
   - LLM features: treat model output and tool results as untrusted, and guard against prompt injection
3. Add or keep tests for the security behavior (rejects bad input, denies unauthorized access).

## Hand-offs
- Finished feature, PR, or "is this secure?" → run **security-review**.
- Compliance framework mapping (SOC 2, HIPAA, PCI, NIST, and others) → run **compliance-audit** (audit-suite) after security-review.

## Red flags
Suppressing a security linter, adding `--no-verify`, hard-coding a token, broadening CORS/IAM "temporarily", or disabling TLS verification.