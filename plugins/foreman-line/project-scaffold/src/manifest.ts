/**
 * The scaffold artifact manifest (charter §4.5): the complete, enumerated map
 * of template sources to target paths, plus the artifacts the generator emits
 * rather than copies. The manifest is curated — templates/ holds files for
 * other purposes too, and only entries listed here ever reach a target repo.
 */
import { substitute, type TokenMap, yamlScalar } from './render.js'

export interface CopyEntry {
  readonly kind: 'copy'
  readonly template: string
  readonly target: string
  readonly substitute: boolean
}

export interface EmitEntry {
  readonly kind: 'emit'
  readonly target: string
  readonly tokens: boolean
  readonly render: (tokens: TokenMap) => string
}

export type ArtifactEntry = CopyEntry | EmitEntry

/** The one file whose managed block the generator may touch in an existing file. */
export const MANAGED_TARGET = 'AGENTS.md'

/** The generated managed content, WITHOUT markers (managed-block.ts wraps it). */
export const MANAGED_BLOCK_INNER = [
  '## Canon pointers (generated)',
  '',
  '- **Coordination pattern, spec convention, and the parcel method** are',
  '  referenced from the **installed Foreman Line plugin** at run time — never',
  '  copied into this repo. A project running a different version of them is a',
  '  bug, not a customization.',
  "- **Session entry:** the installed plugin's goal-management skill (`/goal`).",
  '  Its scaffold preflight is idempotent: on an already-scaffolded repo a',
  '  second run reports every path as skipped or unchanged and writes zero',
  '  bytes.',
  '',
  '## Managed region — resume state',
  '',
  '> Everything between the two foreman-line markers is written and rewritten',
  "> by this repo's own coordinator sessions. Do not hand-author content here;",
  '> do not assume its shape is stable between sessions.',
  '',
  '```',
  '<in-flight goal: none>',
  '<current parcel: none>',
  '<last-known gate: none>',
  '```',
].join('\n')

const GOALS_INDEX_HEADER = [
  '# {{PROJECT_NAME}} — Goal Index',
  '',
  "This file is a discovery projection. Each goal's `charter.md` and",
  '`loop-directive.md` remain authoritative for status, ownership, gates, and',
  'next action. Never infer authority from an index row.',
  '',
  '## Active goals',
  '',
  '| Goal | State | Current authority |',
  '|---|---|---|',
  '',
  '(empty at scaffold time)',
  '',
].join('\n')

/**
 * The CI job that runs the frontmatter linter via Node (charter D6). The
 * linter is referenced from the installed Foreman Line plugin, never vendored
 * (D15); the plugin checkout is pinned by the repository variables
 * FOREMAN_LINE_REPOSITORY and FOREMAN_LINE_REF. The `${{ vars.* }}`
 * expressions are GitHub Actions syntax, not scaffold placeholders.
 */
const SPEC_LINT_WORKFLOW = [
  '# Emitted by the Foreman Line project scaffold (D6): enforcement is a CI',
  '# job running the frontmatter linter via Node, independent of project',
  '# language. The linter is resolved from the installed Foreman Line plugin,',
  '# never vendored here (see docs/kickstarters/VENDORED-CANON.md).',
  'name: spec-lint',
  '',
  'on:',
  '  push:',
  '  pull_request:',
  '',
  'permissions:',
  '  contents: read',
  '',
  'jobs:',
  '  spec-lint:',
  '    runs-on: ubuntu-latest',
  '    steps:',
  '      - name: Check out this repository',
  '        uses: actions/checkout@v4',
  '',
  '      - name: Check out the Foreman Line plugin at the pinned ref',
  '        uses: actions/checkout@v4',
  '        with:',
  // biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression in emitted workflow content, not a JS template placeholder
  '          repository: ${{ vars.FOREMAN_LINE_REPOSITORY }}',
  // biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression in emitted workflow content, not a JS template placeholder
  '          ref: ${{ vars.FOREMAN_LINE_REF }}',
  '          path: .foreman-line-plugin',
  '',
  '      - name: Set up Node',
  '        uses: actions/setup-node@v4',
  '        with:',
  '          node-version: 22',
  '',
  "      - name: Install the plugin's spec linter",
  '        run: npm ci && npm ci --prefix ../foreman-config',
  '        working-directory: .foreman-line-plugin/spec-linter',
  '',
  '      - name: Lint spec frontmatter',
  '        run: |',
  '          set -euo pipefail',
  "          for f in $(find docs/specs/active docs/specs/done -name '*.md' | sort); do",
  '            npx tsx .foreman-line-plugin/spec-linter/src/cli.ts validate --config foreman/config.yaml --repo-root "$GITHUB_WORKSPACE" "$f"',
  '          done',
  '',
].join('\n')

export const ARTIFACTS: readonly ArtifactEntry[] = [
  { kind: 'copy', template: 'AGENTS.md', target: 'AGENTS.md', substitute: false },
  { kind: 'copy', template: 'CLAUDE.md', target: 'CLAUDE.md', substitute: false },
  {
    kind: 'copy',
    template: 'foreman-config.yaml',
    target: 'foreman/config.yaml',
    substitute: true,
  },
  {
    kind: 'copy',
    template: 'foreman-routing-policy.yaml',
    target: 'foreman/routing-policy.yaml',
    substitute: false,
  },
  {
    kind: 'copy',
    template: 'foreman-skill-injection.yaml',
    target: 'foreman/skill-injection.yaml',
    substitute: false,
  },
  { kind: 'copy', template: 'spec-index.md', target: 'docs/specs/INDEX.md', substitute: true },
  {
    kind: 'copy',
    template: 'defects_lessons.md',
    target: 'docs/transcripts/defects_lessons.md',
    substitute: false,
  },
  {
    kind: 'copy',
    template: 'STANDING-CONSTRAINTS.md',
    target: 'docs/kickstarters/STANDING-CONSTRAINTS.md',
    substitute: false,
  },
  {
    kind: 'copy',
    template: 'kickstarters/shaping-template.md',
    target: 'docs/kickstarters/shaping-template.md',
    substitute: false,
  },
  {
    kind: 'copy',
    template: 'kickstarters/builder-template.md',
    target: 'docs/kickstarters/builder-template.md',
    substitute: false,
  },
  {
    kind: 'copy',
    template: 'kickstarters/reviewer-template.md',
    target: 'docs/kickstarters/reviewer-template.md',
    substitute: false,
  },
  {
    kind: 'copy',
    template: 'VENDORED-CANON.md',
    target: 'docs/kickstarters/VENDORED-CANON.md',
    substitute: false,
  },
  {
    kind: 'emit',
    target: 'docs/goals/INDEX.md',
    tokens: true,
    render: (tokens) => substitute(GOALS_INDEX_HEADER, { PROJECT_NAME: tokens.PROJECT_NAME }),
  },
  {
    kind: 'emit',
    target: '.github/workflows/spec-lint.yml',
    tokens: false,
    render: () => SPEC_LINT_WORKFLOW,
  },
]

/** Directories every scaffolded project receives (§4.5's layout). */
export const DIRECTORY_TARGETS: readonly string[] = [
  'foreman',
  'docs/specs/active',
  'docs/specs/done',
  'docs/transcripts',
  'docs/kickstarters',
  'docs/goals',
  '.github/workflows',
]

/** Builds the enumerated substitution token map from typed arguments. */
export function buildTokenMap(input: {
  projectName: string
  slug: string
  baseBranch: string
  branchPrefix: string
  worktreeRoot: string
  projectKey?: string
  dispatchQueue?: string
}): TokenMap {
  return {
    PROJECT_NAME: input.projectName,
    SLUG: input.slug,
    BASE_BRANCH: yamlScalar(input.baseBranch),
    BRANCH_PREFIX: yamlScalar(input.branchPrefix),
    WORKTREE_ROOT: yamlScalar(input.worktreeRoot),
    PROJECT_KEY: yamlScalar(input.projectKey),
    DISPATCH_QUEUE: yamlScalar(input.dispatchQueue),
  }
}
