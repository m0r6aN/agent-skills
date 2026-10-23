# Separate test-host admission from production adapter completion

Coordinator clarification under existing authority: requiring a finished production
adapter before building the library it imports creates a circular dependency.
Do not use that interpretation of the earlier P2C wording.

1. The fixed synthetic qualification harness establishes candidate Linux test-host
   mechanisms and resource ceilings. Independent host review, actual baseline,
   scope pins and credential-isolated worker/route clearance still precede build.
2. Build/review the pure library using only fixed synthetic inputs in that bounded
   test lane. No production ingestion, supplied-program execution or hostile input
   outside the reviewed host. Preserve the three-new-file workorder.
3. Build the separately scoped production adapter against the reviewed library.
   Implement framing, image/code packaging, deadlines, response/error validation
   and cleanup; no arbitrary interpreter arguments or host credentials.
4. Independently review and verify the assembled adapter/library before admitting
   hostile production input. The library's acceptance alone does not provide it.

The previously written phrase requiring production adapter implementation before
library Gate2 is superseded. Test-host review remains necessary; its mechanism
checks do not self-authorize worker dispatch. Credential holds and the owner exact
Pi preference opencode-go/kimi-k3.1-pro remain unchanged. No paid phase admitted.
