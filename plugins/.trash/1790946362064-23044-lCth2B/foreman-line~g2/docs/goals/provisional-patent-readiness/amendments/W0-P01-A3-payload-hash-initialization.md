# Amendment W0-P01-A3: Payload Hash Initialization

Status: ratified 2026-08-17 by Clinton Morgan.

W0-P01 may use the newly named, initially absent output root `D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260817-w0-p01-custody-snapshot-retry-02/`. Before copying a source entry, the audit implementation must initialize a writable payload-hash field for every manifest entry and perform an in-memory schema smoke check that assigns and reads that field.

All W0-P01-A1/A2 constraints remain unchanged. Preserve without alteration every earlier partial root, including the A2 root ending `...retry-01/`.
