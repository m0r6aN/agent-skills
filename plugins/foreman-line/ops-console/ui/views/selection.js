// Full signal ids are the only selection keys; labels and subjects are not identities.
export function eligibleActions(signal, registry) {
  return registry.filter((entry) => signal.actions?.includes(entry.verb) &&
    entry.signalClasses?.includes(signal.class) && entry.invocation === 'spawn' && !entry.destructive)
}
export function actionSignature(entry) {
  return entry ? JSON.stringify([entry.verb, entry.invocation, entry.destructive, entry.promptTemplate, entry.autonomy]) : ''
}
const NO_WRITE = { decisions: 'partial', commit: false, push: false, openPr: false, merge: false }
export function selectTarget(signal, registry) {
  const entry = eligibleActions(signal, registry).find((e) => e.verb === 'investigate')
  return { signal, verb: entry?.verb || null, autonomy: { ...(entry?.autonomy || NO_WRITE), merge: false },
    signature: actionSignature(entry), unavailable: null, needsReview: false, extraText: null,
    manualAction: false, manualPermissions: false, bulkIssue: null }
}
// Suggested changes can narrow existing authority, never widen it.
function conservativePermissions(current, defaults) {
  return { decisions: current.decisions === 'partial' ? 'partial' : defaults.decisions,
    commit: current.commit && defaults.commit, push: current.push && defaults.push,
    openPr: current.openPr && defaults.openPr, merge: false }
}
export function chooseAction(item, entry, suggested = true) {
  item.verb = entry?.verb || null
  if (suggested && !item.manualPermissions && entry) item.autonomy = conservativePermissions(item.autonomy, entry.autonomy)
  item.signature = actionSignature(entry)
  item.bulkIssue = null
}
export function applyToSelection(selected, registry, settings, suggested = true) {
  let updated = 0, skipped = 0
  for (const item of selected.values()) {
    if (item.unavailable || item.needsReview || (!settings.verb && item.bulkIssue)) { skipped++; continue }
    const choices = eligibleActions(item.signal, registry)
    const entry = choices.find((e) => e.verb === (settings.verb || item.verb))
    if (!entry) { item.bulkIssue = 'Requested action is not offered for this item. Choose a compatible action or remove it.'; skipped++; continue }
    if (settings.verb) { chooseAction(item, entry, suggested); item.manualAction = true }
    if (settings.autonomy) { item.autonomy = { ...settings.autonomy, merge: false }; item.manualPermissions = true }
    updated++
  }
  return { updated, skipped }
}
export function useSuggestedSettings(selected, registry) {
  let updated = 0, skipped = 0
  for (const item of selected.values()) {
    if (item.unavailable || item.needsReview || item.bulkIssue || (item.manualAction && item.manualPermissions)) { skipped++; continue }
    const choices = eligibleActions(item.signal, registry)
    const entry = choices.find((e) => e.verb === (item.manualAction ? item.verb : 'investigate'))
    if (!entry) { skipped++; continue }
    const before = JSON.stringify([item.verb, item.autonomy])
    chooseAction(item, entry)
    if (before === JSON.stringify([item.verb, item.autonomy])) skipped++
    else updated++
  }
  return { updated, skipped }
}
export function reconcileSelection(selected, signals, registry) {
  const current = new Map(signals.map((signal) => [signal.id, signal]))
  for (const item of selected.values()) {
    const signal = current.get(item.signal.id)
    item.unavailable = null
    if (!signal) { item.unavailable = 'Finding is no longer offered. Remove it or wait for refresh.'; continue }
    if (signal.repo !== item.signal.repo || signal.class !== item.signal.class || signal.subject !== item.signal.subject) {
      item.unavailable = 'Finding identity changed. Remove it and select the current finding.'; continue
    }
    item.signal = signal
    const choices = eligibleActions(signal, registry)
    if (!choices.length) item.unavailable = 'No supported bulk-launch action remains.'
    else if (item.verb) {
      const entry = choices.find((e) => e.verb === item.verb)
      if (!entry) item.unavailable = 'Chosen action is no longer offered. Choose another or remove this item.'
      else if (actionSignature(entry) !== item.signature) item.needsReview = true
    }
  }
}
