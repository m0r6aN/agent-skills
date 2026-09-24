# Context

The subject is a proposed Pi coding-agent configuration and whether Pi's automatic model routing should become part of the Foreman Line execution workflow. The system must preserve Foreman's role, risk, approval, and evidence boundaries while improving model selection efficiency. The user supplied a draft settings.json containing OpenCode and OpenRouter providers, four enabled models, and a minimal default thinking level.

# Inventory

- The draft settings file declares `defaultProvider`, `defaultModel`, `defaultThinkingLevel`, `providers`, and `enabledModels`.
- The draft providers are named `openrouter` and `opencode`.
- The draft enabled models are an OpenCode Qwen 2.5 Coder 32B model, an OpenCode DeepSeek R1 Distill Qwen 32B model, an OpenRouter Claude 3.5 Sonnet model, and an OpenRouter GPT-4o-mini model.
- The draft `baseUrl` values are written using Markdown-link syntax rather than plain URL strings.
- The draft environment-variable placeholders contain backslashes before underscores.
- Pi's current documentation places startup defaults and model-cycling patterns in settings.json, and custom providers/models in models.json.
- Pi's current documentation describes `pi-model-auto` as a router with Low, Medium, High, and Ultra capability modes, quality/cost selection policy, session stickiness, optional filters, exact mode pins, and an optional semantic classifier.
- Pi's current documentation describes `pi-auto-router` as a separate extension with named routes, provider/model targets, failover, budgets, policy rules, shadow mode, and an explain command.
- The current packaged Foreman Line version is behind the standalone `D:\Repos\foreman-line` version. The standalone version has explicit repository/plugin roots, configuration and role-authority helpers, worker envelopes, mutation-scope guards, contract readers, hooks, templates, and Fireworks worker routing/result contracts. The packaged version has broader `process.cwd()` defaults and hardcoded coordinator/operator identity in dispatch paths.
- Foreman Line has coordinator, builder, reviewer, verifier, and approval-oriented responsibilities; its control-plane contracts are separate from worker execution.

# Verified observations

- Pi settings use `defaultProvider` and `defaultModel` for the startup model; `enabledModels` controls model cycling rather than automatic routing.
- Pi supports per-model startup thinking levels keyed by `provider/modelId`.
- `pi-model-auto` keeps a selected model warm across turns, upgrades when a higher capability mode is required, and does not automatically downgrade within a session.
- `pi-auto-router` reads a separate route configuration file and exposes routing explanations, budgets, policy rules, and shadow mode.
- Both Pi package pages warn that packages can execute code and influence agent behavior and should be reviewed before installation.

# Your task

Evaluate whether automatic model routing should be adopted for this workflow. Recommend which Pi routing approach, model roles/tiers, provider boundaries, thinking-level strategy, and Foreman integration rules should be used. Identify risks or configuration errors in the draft. Distinguish mechanisms that improve execution from mechanisms that must remain controlled by Foreman.

# Output contract

Deliver EXACTLY: "TOP 5 BRUTAL FINDINGS" (numbered, one line each) then "TOP 5 MOVES" (numbered, one line each, implementation-ready). Max 350 words total. Plain text only.
