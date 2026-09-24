# Pi routing directive

Pi may automatically choose a model only after Foreman has supplied the role,
risk class, data classification, allowed mutation scope, and budget. Automatic
routing is an execution convenience, not a new approval or coordination
authority.

For fast structured routing/classification decisions, the OpenRouter candidate
is exactly `typesafe/jev-1.13` at `https://openrouter.ai/api/v1`. Jev may
recommend or select a bounded execution lane, but it is `recommend-only`: it is
not a prose-generation or implementation model and may not approve, merge,
release, or bypass policy. Keep the model in the enabled list only with the
capability restrictions from `pi-openrouter-routing.json`.

Keep coordinator, approval, security, verifier-independence, merge, and release
decisions explicit. Record the selected provider/model and route explanation in
the dispatch or result envelope. Do not add provider credentials or a provider
specific fallback to this repository.
