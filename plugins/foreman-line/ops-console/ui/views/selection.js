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
    signature: actionSignature(entry), unavailable: null, needsReview: false }
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
