import { type ConsoleConfig, goalTrees, treeConfigFor } from './config.js'
import { projectGoal } from './project.js'
import { listGoalSlugs } from './scan.js'
import { makeSignal, type Signal, type SignalProvider } from './signals.js'

/**
 * FCA-P3 goal-hygiene provider: goal records needing attention beyond parcel
 * state — ratification records (pending/unknown) and stale loop-directive
 * states (a queue no projection can place, or narrative activity with no
 * parsable queue — the "non-foreman-line dialect" case the FCA-2 `narrativeActive`
 * predicate names). Subjects are goal-scoped (`<key>/…`) so FCA-2 attention
 * counts can scope them per goal.
 */

/** Same closure phrase test the FCA-2 narrative-activity predicate uses. */
const GOAL_CLOSURE_PATTERN = /exit criterion met|goal complete|goal closed|queue empty/i

export const goalHygieneProvider: SignalProvider = {
  class: 'goal-hygiene',
  collect(config: ConsoleConfig, now: number): Signal[] {
    const signals: Signal[] = []
    const detectedAt = new Date(now).toISOString()
    for (const tree of goalTrees(config)) {
      const treeConfig = treeConfigFor(config, tree)
      for (const slug of listGoalSlugs(treeConfig)) {
        const projection = projectGoal(treeConfig, slug, now)
        if (projection === null) continue
        const key = tree.key === null ? slug : `${tree.key}.${slug}`
        const goal = projection.goal

        if (goal.ratification.status === 'pending' || goal.ratification.status === 'unknown') {
          signals.push(
            makeSignal({
              class: 'goal-hygiene',
              severity: goal.ratification.status === 'pending' ? 'attention' : 'info',
              repo: tree.root,
              subject: `${key}/ratification`,
              evidence: [goal.loopDirectiveRef, goal.ratification.detail],
              detectedAt,
              actions: ['investigate', 'explain', 'remediate'],
            }),
          )
        }
        if (goal.items.length > 0 && projection.parcels.length === 0) {
          signals.push(
            makeSignal({
              class: 'goal-hygiene',
              severity: 'attention',
              repo: tree.root,
              subject: `${key}/queue`,
              evidence: [
                goal.loopDirectiveRef,
                `${goal.items.length} queue item(s) no projection could place`,
              ],
              detectedAt,
              actions: ['investigate', 'explain', 'remediate'],
            }),
          )
        }
        const narrativeActive =
          projection.parcels.length === 0 &&
          goal.items.length === 0 &&
          goal.stateLines.length > 0 &&
          !GOAL_CLOSURE_PATTERN.test(goal.stateLines.join('\n'))
        if (narrativeActive) {
          signals.push(
            makeSignal({
              class: 'goal-hygiene',
              severity: 'info',
              repo: tree.root,
              subject: `${key}/loop-directive`,
              evidence: [goal.loopDirectiveRef, `state lines: ${goal.stateLines.length}`],
              detectedAt,
              actions: ['investigate', 'explain'],
            }),
          )
        }
      }
    }
    return signals
  },
}
