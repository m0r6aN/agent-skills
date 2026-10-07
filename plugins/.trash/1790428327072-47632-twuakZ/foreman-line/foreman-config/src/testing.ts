/**
 * Canonical sample values, typed against `types.ts`, used by the parity test
 * to prove each schema accepts values of the shape its type describes. The
 * full-document sample mirrors charter §4.3's `vite-react-ts-tailwind`
 * example. These are FIXTURE data — no live `foreman/config.yaml` lands in
 * this repo (spec Constraint 9; that is P6's).
 */
import type {
  ForemanAuditPolicy,
  ForemanCapabilities,
  ForemanConfig,
  ForemanIdentity,
  ForemanPolicy,
  ForemanStack,
  StackLayout,
} from './types.js'

export const sampleIdentity: ForemanIdentity = {
  project_key: 'KONE',
  base_branch: 'main',
  branch_prefix: 'feat/',
  worktree_root: '../worktrees',
  // `dispatch_queue` denotes the Jira ASSIGNEE IDENTITY (account id or email)
  // whose assigned issues form the dispatch queue (P1b Step 0 Q2 ruling). This
  // sample uses the `:`-prefixed Atlassian account-id form deliberately — it is
  // the regression pin for the colon finding: assertJqlSafeToken refuses `:`,
  // so this value must flow through assertJqlSafeQuotedLiteral, never the
  // token guard.
  dispatch_queue: '557058:f58131cb-b67c-48f0-b3c1-e6d24a441e3d',
}

export const sampleLayout: StackLayout = {
  route_roots: ['src'],
  style_roots: ['src', 'src/styles'],
  component_roots: ['src/components'],
  theme_files: ['src/index.css'],
  ui_primitives: ['src/components/ui'],
}

export const sampleStack: ForemanStack = {
  profile: 'vite-react-ts-tailwind',
  layout: sampleLayout,
  surfaces_present: ['charts', 'forms'],
}

export const sampleCapabilities: ForemanCapabilities = {
  ticketing: ['jira-workflow'],
  compression: ['kompress'],
}

export const sampleAuditPolicy: ForemanAuditPolicy = {
  require_security_audit_at: ['elevated', 'critical'],
}

export const samplePolicy: ForemanPolicy = {
  audit: sampleAuditPolicy,
}

export const sampleForemanConfig: ForemanConfig = {
  identity: sampleIdentity,
  stack: sampleStack,
  capabilities: sampleCapabilities,
  policy: samplePolicy,
}
