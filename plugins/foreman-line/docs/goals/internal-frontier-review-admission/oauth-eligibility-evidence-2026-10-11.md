# Subscription/OAuth eligibility — bounded public-source evidence

**Recorded:** 2026-10-11
**Mode:** public first-party documents and owner direction only; no authenticated account inspection, credential resolution, provider-model request or independent legal/security audit
**Owner-selected auth:** Anthropic subscription/OAuth. Exact plan/organization/custom terms are unknown; do not assume Pro/Max or commercial API use.

## Evidence and exact passage locators

### E1 — application/authentication scope

Source: [Claude Code legal and compliance](https://code.claude.com/docs/en/legal-and-compliance), sections `Usage policy / Authentication and credential use` and `Can customers offer Claude Code in their products?`, fetched 2026-10-11.

> OAuth authentication is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications.

> Developers building products or services that interact with Claude's capabilities, including those using the Agent SDK, should use API key authentication through Claude Console or a supported cloud provider.

The same section prohibits third-party developers from offering Claude.ai login in their applications or routing plan credentials on their users' behalf, and from collecting/storing/intermediating Claude.ai credentials/session tokens. It separately permits an end user to sign into the unmodified Claude Code binary, including specified hosted-product circumstances. That native-binary permission is NOT evidence for an independent Pi SDK worker or a custom OAuth broker. The page also mentions ordinary Agent SDK usage elsewhere; neither that wording nor a working token establishes permission for this particular route. Obtain applicable explicit permission/terms rather than overstate a categorical conclusion about every OAuth use.

### E2 — consumer automated-access and training conditions

Source: [Consumer Terms](https://www.anthropic.com/legal/consumer-terms), `3. Use of our Services`, prohibition 7; and `4. Inputs, Outputs, Actions, and Materials / Our use of Materials`, fetched 2026-10-11.

> Except when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit it, to access the Services through automated or non-human means, whether through a bot, script, or otherwise.

Section 4 distinguishes training opt-out from feedback and safety-review exceptions. These consumer clauses apply if the selected account is governed by them; exact plan and any special permission are not established here. Owner consent to this repository is not Anthropic's explicit permission.

### E3 — account-dependent retention, not OAuth = ZDR

Source: [Claude Code data usage](https://code.claude.com/docs/en/data-usage), `Data policies / Data training policy` and `Data retention`, fetched 2026-10-11.

> Users who don't allow data use for model improvement: 30-day retention period

The page distinguishes consumer improvement-enabled retention (five years) from disabled retention (30 days), commercial defaults, and qualified organization-specific ZDR. These are published policy descriptions, not this owner's measured setting or a Pi-specific guarantee. Training opt-out alone is not ZDR and does not discharge existing `data_collection: deny` / `zdr: true` obligations. Commercial API access would not itself prove ZDR either.

### E4 — plan allocation and billing are not an API-price proof

Source: [Use Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan), `What happens when you hit usage limits` and `Claude Code billing`, fetched 2026-10-11. The readable fetch exposes shared session/weekly limit text but omits several billing lists; search excerpts are not treated as complete account evidence.

Published plan limits describe Claude/Claude Code shared allocation, not a verified bound for this Pi installation or the owner's additional-usage configuration. No subscription-dollar-zero inference, API list-price substitution, quota reset permission, billing/settings alteration or automatic API fallback is made. Explicit source-backed marginal-charge/fee bounds and account-mode evidence are needed before monetary admission; quota and money are distinct.

## Disposition

**HOLD for the proposed internal Pi review route.** Auth mode is now owner-selected, while application permission, required data controls, account-specific billable bound and executed runtime/model capability are still unestablished. Current first-party sources do not establish that ordinary subscription OAuth admits this proposed Pi companion.

This is an evidence-based admission hold, not a claim about the owner's account violating terms, nor a formal legal opinion. No plan settings/private agreements were inspected. The current draft must reject before credentials/network when these facts are missing. A human bootstrap exception cannot waive provider permissions, change internal data to public or assert subscription usage is free.

Next route disposition is one of: applicable explicit permission plus all required account/control evidence for OAuth; or a separately approved auth/transport/data-policy amendment. Native Claude Code review would itself need a distinct Foreman harness/scope amendment and does not automatically solve data/budget requirements. Neither an API change nor a native-harness substitution is silently adopted here.

## Retrieval coverage

Used three varied public searches, then direct readable fetches and exact passage retrieval for E1–E4. Also inspected the public consumer policy update and privacy training article; the latter readable extraction omitted its list, so no missing list is quoted as full evidence. Full sites/account agreements were not audited. Public wording can change: recheck sources at any proposed activation and preserve the actual applicable terms/version in its reviewed packet. Public pages were not sent to a new model reviewer; no delegate/probe inference was launched.
