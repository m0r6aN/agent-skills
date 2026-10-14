/**
 * Harness argv builders — flags verified against real help output on
 * 2026-10-11 (fail-fast spike; recorded in
 * `docs/transcripts/spawn-flag-verification-2026-10-11.md`):
 *
 * - `pi` (42 flags): `--model <pattern>`, `--thinking <off|minimal|low|medium|
 *   high|xhigh|max>` (the ratified dropdown vocabulary exactly), `--name`.
 *   No spend-cap flag exists.
 * - `claude`: `--model <model>`, `--effort <low|medium|high|xhigh|max>`
 *   (no `off`/`minimal`), `-n, --name`. `--max-budget-usd` exists but works
 *   ONLY with `--print` (non-interactive) — it is therefore never placed on an
 *   interactive spawn argv.
 *
 * Consequences enforced by the planner: thinking levels a harness cannot
 * express are refused typed (fail closed — never silently downgraded), and the
 * budget cap is asserted in the prompt payload (FCA-P5 4) since no harness can
 * enforce it in an interactive session.
 */

export const THINKING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const
export const BUDGET_PRESETS = ['$1', '$5', '$10', '$20', '$50', '$100'] as const

export interface HarnessArgvInput {
  readonly model: string
  readonly thinking: string
  readonly sessionName: string
}

export interface HarnessSpec {
  readonly id: 'pi' | 'claude'
  /** Help-verified thinking vocabulary this harness can actually express. */
  readonly thinkingLevels: readonly string[]
  argv(input: HarnessArgvInput): readonly string[]
  promptArgv(prompt: string): readonly string[]
  /**
   * Harness-specific model-id check, run at plan time so a launch that is
   * certain to die at startup never creates a worktree or a process. Returns a
   * human-readable refusal, or null when the id is acceptable.
   */
  modelProblem?(model: string): string | null
}

/**
 * pi resolves a bare model id across every authenticated provider and exits 1
 * when more than one matches (observed 2026-10-13: `Model "claude-sonnet-5-5"
 * is ambiguous across providers ... Use --provider or provider/model`). The
 * console therefore requires the explicit `provider/model` form (optionally
 * with pi's documented `:thinking` suffix) rather than guessing a provider.
 */
const PI_QUALIFIED_MODEL = /^[^/\s:]+\/[^\s]+$/

export const HARNESS_REGISTRY: Record<string, HarnessSpec> = {
  pi: {
    id: 'pi',
    thinkingLevels: THINKING_LEVELS,
    argv: (input) => [
      'pi',
      '--model',
      input.model,
      '--thinking',
      input.thinking,
      '--name',
      input.sessionName,
    ],
    promptArgv: (prompt) => ['--', prompt],
    modelProblem: (model) =>
      PI_QUALIFIED_MODEL.test(model)
        ? null
        : `model '${model}' is not in provider/model form; pi exits at startup when a bare id is ambiguous across providers (e.g. anthropic/claude-sonnet-5-5)`,
  },
  claude: {
    id: 'claude',
    thinkingLevels: ['low', 'medium', 'high', 'xhigh', 'max'],
    argv: (input) => [
      'claude',
      '--model',
      input.model,
      '--effort',
      input.thinking,
      '-n',
      input.sessionName,
    ],
    promptArgv: (prompt) => [prompt],
  },
}
