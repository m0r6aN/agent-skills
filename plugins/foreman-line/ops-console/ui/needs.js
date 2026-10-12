// FCA-2/FCA-3 board "needs" treatment — the pure rule shared by app.js and the
// node test suite (ES module; no build step, no dependencies). A card needs the
// human when its parcel state says so, or when any urgent signal is scoped to
// it (the signal model generalizes attention beyond parcel state — e.g. future
// `session-state` signals attached to parcels).
export function needsFor(parcelState, urgent) {
  if (urgent) return 'needs needs-red'
  if (parcelState === 'hung' || parcelState === 'failed') return 'needs needs-red'
  if (parcelState === 'awaiting-gate') return 'needs needs-amber'
  return ''
}
