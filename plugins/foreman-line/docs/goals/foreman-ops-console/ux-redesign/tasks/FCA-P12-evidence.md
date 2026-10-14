# FCA-P12 evidence — goal-scoped alert acknowledgements

## Scratch mapping / real-fleet note

Alert identity now includes its goal in both the fingerprint and acknowledgement lookup. Acknowledgement storage replaces an entry only when both `id` and `goal` match, so identical alert IDs in separate goal trees remain independent. The API resolves an alert within the supplied goal before accepting an acknowledgement; it does not search every goal for an ID match.

The UI has no unescaped acknowledgement/evidence rendering path in the scanned `ops-console/ui/` sources: signal evidence and IDs are interpolated via `esc`, and the session tray escapes every evidence line and output tail. The existing test `ledger output is escaped: hostile pane text cannot inject markup` provides hostile-string coverage for the session evidence path. No additional UI test was necessary for the scanned acknowledgement rendering, whose note is not rendered in the UI.

This is a source/test-level scratch mapping, not a live-fleet API observation: no live server or scratch fleet was provisioned for this verification, so no real-fleet alert inventory is claimed.

## Verification

- Added `same alert id in two goals keeps acknowledgements independent`.
- Mutation check performed in a disposable `/tmp` copy by reverting the goal-aware replacement filter. The targeted test failed as expected: `same alert id in two goals keeps acknowledgements independent`.
- Full package `npm test`: PASS, 600 tests.
- `npm run typecheck`: PASS.
- `npm run lint`: initial run detected formatting in the new test; fixed with Biome. Re-run recorded below.
