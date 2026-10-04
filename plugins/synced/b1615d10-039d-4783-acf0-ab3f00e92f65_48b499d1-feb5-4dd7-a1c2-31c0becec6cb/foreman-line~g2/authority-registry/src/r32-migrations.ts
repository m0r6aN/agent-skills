// R32 typed prior-to-new migration tables for the FK-P0 corpus/contract amendment R32.
//
// R32 re-pins the corpus to the live consolidated charter and the RS-1/RS-2-era canon. History
// pins (RECONCILIATION_RECORD_DIGESTS, R30_SOURCE_ITEMS, R31_SOURCE_ITEMS, the R31 record) stay
// byte-stable in their own modules; nothing here rewrites them. These tables are the typed
// prior-to-new entries that let the generator and the validator re-anchor, re-value, and re-bind
// the affected items and rules without a silent rewrite:
//
//   R32_ANCHOR_MIGRATIONS          item identity preserved through a locator rename - the item id
//                                  is pinned to its prior derivation, never re-learned from the
//                                  new locator;
//   R32_ITEM_MIGRATIONS            the complete reviewed binding of every changed item: prior
//                                  locator/value digests (the R31-era state) and the new
//                                  locator/value digests (the R32 live state), with a disposition
//                                  of re-anchored, re-valued, re-anchored-and-re-valued, retired,
//                                  or adopted;
//   R32_RULE_STATEMENT_MIGRATIONS  pinned R30 rule statements re-stated against the new source
//                                  text, preserving each rule's historical subject.
//
// Transcribed from the R32 mapping; the complete prior-to-new table and its review obligations
// are recorded in docs/goals/foreman-kernel/FK-P0-corpus-amendment-R32-2026-09-27.md.

export const R32_SOURCE_SNAPSHOT = '6356bca419b4a139528ceb3de38fb51aabb989d3'
export const R32_PRIOR_REGISTRY_COMMIT = '521214e4fa7e3475e2544ef1f1492638250437f6'

export interface R32AnchorMigration {
  readonly sourceId: string
  readonly itemId: string
  readonly priorAnchor: string
  readonly newAnchor: string
}

export interface R32ItemMigration {
  readonly unit: string
  readonly sourceId: string
  readonly itemId: string
  readonly priorKind: string
  readonly priorAnchor: string
  readonly priorLocatorDigest: string
  readonly priorValueDigest: string
  readonly newKind: string | null
  readonly newAnchor: string | null
  readonly newLocatorDigest: string | null
  readonly newValueDigest: string | null
  readonly disposition:
    | 're-anchored'
    | 're-valued'
    | 're-anchored-and-re-valued'
    | 'retired'
    | 'adopted'
}

export interface R32RuleStatementMigration {
  readonly ruleId: string
  readonly priorStatement: string
  readonly newStatement: string
}

export const R32_ANCHOR_MIGRATIONS: readonly R32AnchorMigration[] = [
  {
    sourceId: 'fk-charter',
    itemId: 'item.cb21b44ff80f',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 1. Objective',
    newAnchor: '# Foreman Kernel Development Charter > ## 1. Objective',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.388a6fe1b0b3',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 2. Problem statement',
    newAnchor: '# Foreman Kernel Development Charter > ## 2. Problem statement',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.b95669aefb57',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy',
    newAnchor: '# Foreman Kernel Development Charter > ## 3. Authority hierarchy',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.6486ca2f9352',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 4. Locked decisions',
    newAnchor: '# Foreman Kernel Development Charter > ## 4. Locked decisions',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.3bc8baf32931',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.aa9ab580f03e',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 5. First-release architecture',
    newAnchor: '# Foreman Kernel Development Charter > ## 5. First-release architecture',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.77af408c0fb3',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.e330e909f6f6',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.21384b7c24b2',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition',
    newAnchor: '# Foreman Kernel Development Charter > ## 6. Parcel decomposition',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.28648594b8fe',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 0 — Authority and contracts',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 0  -  Authority and contracts',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.7c611ad6ad15',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 1 — Pure trust core',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 1  -  Pure trust core',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.2fc2d08c0a18',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 2 — Stateless read-only MCP and container',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 2  -  Stateless read-only MCP and container',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.d399511a374e',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.2661ab7d1dc1',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.1b6849fd1180',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal',
    newAnchor: '# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.80a3748c262d',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 8. Integration scenarios',
    newAnchor: '# Foreman Kernel Development Charter > ## 8. Integration scenarios',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.1ecd3156bb7b',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion',
    newAnchor: '# Foreman Kernel Development Charter > ## 9. Goal exit criterion',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.17fbcec22bcf',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 10. Human gates and standing authorizations requested',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 10. Human gates and standing authorizations requested',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.4f436ba95f57',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 10. Human gates and standing authorizations requested > ### Gate 1 — charter ratification',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 10. Human gates and standing authorizations requested > ### Gate 1  -  charter ratification',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.e4b9ff1f8c41',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 10. Human gates and standing authorizations requested > ### Gate 2 — parcel dispatch',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 10. Human gates and standing authorizations requested > ### Gate 2  -  parcel dispatch',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.ef74f9b402bf',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 10. Human gates and standing authorizations requested > ### Gate 3 — merge',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 10. Human gates and standing authorizations requested > ### Gate 3  -  merge',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.6234115eff36',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 11. Stop conditions',
    newAnchor: '# Foreman Kernel Development Charter > ## 11. Stop conditions',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.56a03af5e844',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.3d5255bad2ec',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list',
    newAnchor: '# Foreman Kernel Development Charter > ## 13. Gate 1 decision list',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.708e84a0404d',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.5a0993db959d',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.786b95269a6a',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.24ace3f8b3bd',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.b220994ee1cd',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.b2cef1abaa06',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.9a6254ae7454',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.2fa788c26a4e',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.826be554f021',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.b82ee9d4ddfe',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.a583b7f02950',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel:paragraph:1',
    newAnchor: 'md-block:# Foreman Kernel Development Charter:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.203907c2fcab',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 1. Objective:paragraph:1',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 1. Objective:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.3620260045a5',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 1. Objective:list-item:1',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 1. Objective:list-item:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.16f0036885ba',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 1. Objective:list-item:2',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 1. Objective:list-item:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.eebf9c2d70f0',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 1. Objective:list-item:3',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 1. Objective:list-item:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.93c91aa31d91',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 1. Objective:paragraph:2',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 1. Objective:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.2e6e09d602a5',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 2. Problem statement:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.93d5d3978e5f',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:list-item:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 2. Problem statement:list-item:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.286e2c0ff452',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:list-item:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 2. Problem statement:list-item:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.263bc52874f2',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:list-item:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 2. Problem statement:list-item:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.30e0d34f1b24',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:list-item:4',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 2. Problem statement:list-item:4',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.b743b2f6db66',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:list-item:5',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 2. Problem statement:list-item:5',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.bad88a513c02',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:paragraph:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 2. Problem statement:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.69c53b27e66e',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.3ba0fca807d0',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:list-item:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:list-item:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.527356f5f91e',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:list-item:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:list-item:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.bb4a5c9fdec0',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:list-item:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:list-item:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.191e6ee40a8a',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:list-item:4',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:list-item:4',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.a249a913deaa',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:list-item:5',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:list-item:5',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.f7ed5dccb318',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:list-item:6',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:list-item:6',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.611c1a6f6bce',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:list-item:7',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:list-item:7',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.2a524c1ea63f',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:paragraph:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.cd014d6d90c5',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions:paragraph:1',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.0077176dba28',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.11307b6ee77e',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:paragraph:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.73c2e8af98c5',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.56c611d71350',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.cf301316d970',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.fbed3af63b13',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L4',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L4',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.f081be090f04',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L5',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L5',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.131a7863b940',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:paragraph:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:paragraph:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.0b2a6def88bd',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.10a0b56e3fcc',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:list-item:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:list-item:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.ac1c865d9920',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:list-item:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:list-item:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.b94466bd3859',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:list-item:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:list-item:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.98c351f848d6',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:list-item:4',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:list-item:4',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.9044bb776176',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:list-item:5',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:list-item:5',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.d93995e783e9',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:list-item:6',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:list-item:6',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.5f601badf99a',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:paragraph:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.0ec27db05f7c',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.863fbb9202f0',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.420807aa841c',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.0b65a783a0be',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.8d204432b7c7',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:4',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:4',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.e7be31fb263e',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:5',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:5',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.a554def3d728',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.5149fedd28d9',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.5c1f19dd9911',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.7983e741c7aa',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 0 — Authority and contracts:table-row:FK-P0 — Canon authority and enforcement registry',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 0  -  Authority and contracts:table-row:FK-P0  -  Canon authority and enforcement registry',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.ba4689f0d16e',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 0 — Authority and contracts:table-row:FK-P1 — Lifecycle, admission, and decision contracts',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 0  -  Authority and contracts:table-row:FK-P1 — Lifecycle, admission, and decision contracts',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.144bb836f528',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 0 — Authority and contracts:table-row:FK-P2 — Spec-body compiler',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 0  -  Authority and contracts:table-row:FK-P2  -  Spec-body compiler',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.7d74bdcd5bb3',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 0 — Authority and contracts:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 0  -  Authority and contracts:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.e64616afcaf9',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 1 — Pure trust core:table-row:FK-P3 — Pure dispatch decisions',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 1  -  Pure trust core:table-row:FK-P3  -  Pure dispatch decisions',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.01fc2f9fcdd0',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 1 — Pure trust core:table-row:FK-P4 — Verifier facade',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 1  -  Pure trust core:table-row:FK-P4  -  Verifier facade',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.9aee50455247',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 1 — Pure trust core:table-row:FK-P5 — Clean-room trust-core spike',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 1  -  Pure trust core:table-row:FK-P5  -  Clean-room trust-core spike',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.5f823cd304d6',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 1 — Pure trust core:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 1  -  Pure trust core:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.6427173452f4',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 2 — Stateless read-only MCP and container:table-row:FK-P6 — Read-only MCP server',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 2  -  Stateless read-only MCP and container:table-row:FK-P6  -  Read-only MCP server',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.d6c307d21998',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 2 — Stateless read-only MCP and container:table-row:FK-P7 — Stateless verifier image and launcher',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 2  -  Stateless read-only MCP and container:table-row:FK-P7  -  Stateless verifier image and launcher',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.9e512e70b8f5',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 2 — Stateless read-only MCP and container:table-row:FK-P8 — Stateless harness portability proof',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 2  -  Stateless read-only MCP and container:table-row:FK-P8  -  Stateless harness portability proof',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.f1439c7e3a90',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 2 — Stateless read-only MCP and container:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 2  -  Stateless read-only MCP and container:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.d4059b59ac59',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:table-row:FK-P9 — SQLite storage and migration ABI',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:table-row:FK-P9  -  SQLite storage and migration ABI',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.f4e2ba3acfd6',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:table-row:FK-P10 — Lease and transition engine',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:table-row:FK-P10  -  Lease and transition engine',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.d92a7c500de4',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:table-row:FK-P11 — Legacy import and projection engine',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:table-row:FK-P11  -  Legacy import and projection engine',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.dc8cc83e01e7',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:table-row:FK-P12 — Authorization policy engine',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:table-row:FK-P12  -  Authorization policy engine',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.387fb9c622d2',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:table-row:FK-P13 — Admission-protected control catalog',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:table-row:FK-P13  -  Admission-protected control catalog',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.9efe42c4e01c',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:table-row:FK-P14 — Stateful image composition and operator lifecycle',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:table-row:FK-P14  -  Stateful image composition and operator lifecycle',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.dde24d4c9b7c',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:table-row:FK-P15 — Stateful restart and admission proof',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:table-row:FK-P15  -  Stateful restart and admission proof',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.fec816847e8e',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.ce7c8467ddb3',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion:table-row:FK-P16 — Claude lifecycle adapter, shadow mode',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion:table-row:FK-P16  -  Claude lifecycle adapter, shadow mode',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.8e9428543291',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion:table-row:FK-P17 — Bypass and outage harness',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion:table-row:FK-P17 — Bypass and outage harness',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.a087b0ab4c3b',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion:table-row:FK-P18 — CI scope and state-evidence backstops',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion:table-row:FK-P18  -  CI scope and state-evidence backstops',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.c9611681dcca',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion:table-row:FK-P19 — High-confidence refusal enforcement',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion:table-row:FK-P19  -  High-confidence refusal enforcement',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.1cf05e6b7716',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion:table-row:FK-P20 — Second-host feasibility and host registration',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion:table-row:FK-P20  -  Second-host feasibility and host registration',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.5c24c3ef6591',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion:table-row:FK-P21 — Exit evidence manifest and clean-room proof',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion:table-row:FK-P21  -  Exit evidence manifest and clean-room proof',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.10bcdc2cae49',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.a010e2bb3224',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.2fec5af13994',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.9b018ade48a1',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.d651115878fe',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:4',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:4',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.a963f0e618eb',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:5',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:5',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.bbfe9f24507d',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:6',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:6',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.7d9c7deea8e6',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:7',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:7',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.6035fee8c157',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:8',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:8',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.7b4cfcbe2393',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:9',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:9',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.99c5c5dbea9e',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.7c489fbd50c0',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.ec0f6225e0a6',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.0689031c79ed',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.349023b0246d',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.9308bed876c7',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:4',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:4',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.612528548655',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:5',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:5',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.102464b0e25b',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:6',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:6',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.e1b224d7294b',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:7',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:7',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.501441d1853e',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:8',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:8',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.fc74f0320a1c',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:9',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:9',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.7eba1cb561c5',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:10',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:10',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.eb56a1ab24d9',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:11',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:11',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.8843a7774432',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:12',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:12',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.10f729956b77',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:13',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:13',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.ff0f88a958e0',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:14',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:14',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.6116f0dd5f60',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.e9ec57edc0a2',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.eddc1a2874a3',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.248b8ef73429',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.7854414d4093',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:4',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:4',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.a0d98411d75e',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:5',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:5',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.fec95f508418',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:6',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:6',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.4910b2a0a7a3',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:7',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:7',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.4d6ea442cfff',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:8',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:8',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.49288a83830e',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:9',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:9',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.8cf027fc811e',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 10. Human gates and standing authorizations requested > ### Gate 1 — charter ratification:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 10. Human gates and standing authorizations requested > ### Gate 1  -  charter ratification:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.15a44cf50bc6',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 10. Human gates and standing authorizations requested > ### Gate 2 — parcel dispatch:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 10. Human gates and standing authorizations requested > ### Gate 2  -  parcel dispatch:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.c74628d41600',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 10. Human gates and standing authorizations requested > ### Gate 3 — merge:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 10. Human gates and standing authorizations requested > ### Gate 3  -  merge:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.225873bff4ee',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:paragraph:1',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.d9921c51d7ea',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:1',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.41b4b3dccd81',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:2',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.0afd841f51f8',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:3',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.c80d986d4cfe',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:4',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:4',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.ab729d219bbb',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:5',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:5',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.1c42ce2f7e94',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:6',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:6',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.28ec67f3ddb4',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:7',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:7',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.5138fd735a8a',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:8',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:8',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.6aae5fe2d602',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:9',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:9',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.fc4a386b94fe',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:10',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:10',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.42e05d00c67a',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:11',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:11',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.07490af17320',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:12',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:12',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.b5bad0475a3e',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:13',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:13',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.e86843a842bc',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:14',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:14',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.98b291e68000',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:15',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:15',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.2cbbc7ae0192',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:16',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:16',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.76049b5d2003',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:17',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:17',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.bdb66c5bc7f1',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints:list-item:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.fdf4aae4f444',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints:list-item:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.a7fd9c343f75',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints:list-item:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.e39357b6cda0',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:4',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints:list-item:4',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.f534e19ce193',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:5',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints:list-item:5',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.5163b20d9238',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:6',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints:list-item:6',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.fd16f98ac72d',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:7',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints:list-item:7',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.f010166230e6',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.1c4b84a3f6e1',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.eead58a85428',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.a4bd5ca1c933',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.6abf5135d0ef',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:4',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:4',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.7eea83f03c07',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:5',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:5',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.a117b9a306bd',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:6',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:6',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.cfd3dbab5179',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:7',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:7',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.e0879b980578',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:8',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:8',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.31a7488199a5',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:9',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:9',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.8ab6cbecef4c',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:10',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:10',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.b1ac4aa9eddf',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:11',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:11',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.b0a3e204145f',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:paragraph:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.7df1436dcd98',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.6aa2e5c4c5e5',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.0334ebc1c195',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution:paragraph:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.ac3a94701bf0',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution:paragraph:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution:paragraph:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.d5def2117d58',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.aedd676e1a43',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts:paragraph:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.5602e9c0f2d7',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts:paragraph:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts:paragraph:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.0e5b4dca9153',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.823540249b94',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions:paragraph:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.b760093ab1a0',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions:paragraph:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions:paragraph:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.a903b0947304',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.738d073932ec',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence:paragraph:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.4d179a0e3c71',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence:paragraph:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence:paragraph:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.f0be0de850ce',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.85625a932abb',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:Warm kernel decision',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:Warm kernel decision',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.c9672cddd1f2',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:End-to-end mediated action',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:End-to-end mediated action',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.db57a9d18103',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:First call after startup',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:First call after startup',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.8e7289313266',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:Per-decision hard deadline',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:Per-decision hard deadline',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.90282758c3ec',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:paragraph:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.bd0165a4630f',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:paragraph:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:paragraph:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.52a3074f5030',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.7dd8dba116bc',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Accepted parcels per hour',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Accepted parcels per hour',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.5eb069676d8e',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Cost per accepted parcel, including rework',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Cost per accepted parcel, including rework',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.73e69c428a2f',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Reviewer queue delay, latency, tokens, rework rate',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Reviewer queue delay, latency, tokens, rework rate',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.065406de951b',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Installation and verification duration',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Installation and verification duration',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.aac81e1754fb',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Both A1 latency spans',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Both A1 latency spans',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.a09a3029f031',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:SQLite contention and CPU/memory/disk pressure by concurrency',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:SQLite contention and CPU/memory/disk pressure by concurrency',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.5ab7daa95afc',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:paragraph:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.2483eaff6f43',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:paragraph:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:paragraph:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.6bef45e68858',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.4ed03c71f99b',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory:paragraph:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.9b7ce5dacd99',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory:paragraph:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory:paragraph:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.462313b4d210',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.4f5a41ed9f1d',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.dbbeaf39106c',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.96e53dfda63f',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:4',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:4',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.c3ba63d89fb1',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:1',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:1',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.f95b77d201bc',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:2',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.24841a6c1279',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:3',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:3',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.df7635424bf7',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:4',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:4',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.6eca2202eee8',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:5',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:5',
  },
  {
    sourceId: 'fk-loop-directive',
    itemId: 'item.cdf0b701e09a',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P17 — Bypass and outage harness',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P17′ — Bypass and outage harness (RS-1.2 retarget: shipped surfaces)',
  },
  {
    sourceId: 'fk-loop-directive',
    itemId: 'item.1c4fbecdf373',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P18 — CI scope and state-evidence backstops',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P18′ — CI scope and state-evidence backstops (RS-1.2 retarget)',
  },
  {
    sourceId: 'spec-convention',
    itemId: 'item.2bdb867c0e6a',
    priorAnchor:
      'md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.8 `Allowed Files` Mutation Authority:paragraph:4',
    newAnchor:
      'md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.9 `expertise:`, `inputs:`, `min_context:`, `thinking_level:` (schema v0.4, added 2026-09-27 — RCM-P2):paragraph:3',
  },
  {
    sourceId: 'spec-linter-cli',
    itemId: 'item.66fec8a20db5',
    priorAnchor:
      ' *   2  usage error: missing/unreadable path, bad invocation, or directory with no .md files',
    newAnchor: ' *   2  usage error: missing/unreadable path, bad invocation, a non-absolute',
  },
  {
    sourceId: 'spec-linter-cli',
    itemId: 'item.39787f778432',
    priorAnchor: 'process.exitCode = run(process.argv.slice(2))',
    newAnchor: 'process.exitCode = await run(process.argv.slice(2))',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.3df7b6a51799',
    priorAnchor: '',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L6',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.5722ad7bc5ab',
    priorAnchor: '',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L7',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.6a8d073a64f1',
    priorAnchor: '',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:paragraph:2',
  },
  {
    sourceId: 'fk-charter',
    itemId: 'item.1d6405c6eacd',
    priorAnchor: '',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 16. Completion accounting for the infrastructure requirements:paragraph:1',
  },
]

export const R32_ITEM_MIGRATIONS: readonly R32ItemMigration[] = [
  {
    unit: 'R32-M001',
    sourceId: 'fk-charter',
    itemId: 'item.d9',
    priorKind: 'table-row',
    priorAnchor: 'D9',
    priorLocatorDigest: '1122736df86e42ba03aaa4e0c1c875c84cfb1e78da6d9b58dc25797dfe6c7ace',
    priorValueDigest: 'c94f713fcb89b9e6f3ef19f2ae85b936fdd0a1896c47a804a13a0696a94cd88e',
    newKind: 'table-row',
    newAnchor: 'D9',
    newLocatorDigest: '1122736df86e42ba03aaa4e0c1c875c84cfb1e78da6d9b58dc25797dfe6c7ace',
    newValueDigest: 'b8cd4c13ef7fb80ccff568340023c1ad8ffbae50160b0515f683c4039f57b0da',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M002',
    sourceId: 'fk-charter',
    itemId: 'item.cb21b44ff80f',
    priorKind: 'heading',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 1. Objective',
    priorLocatorDigest: '02ff4b612abb1bbcc8f01fdf7296d449537c38f3a223c9e215a5254c60d730d8',
    priorValueDigest: '43ca8b89e5d67f0d4aaddaf89a1892c1bdff55bcd62390dc9146c11cf1ed83a2',
    newKind: 'heading',
    newAnchor: '# Foreman Kernel Development Charter > ## 1. Objective',
    newLocatorDigest: '27d96b45896382a1d1796ed5cc7a9d277682d6db23f60108772978c35cd6528a',
    newValueDigest: '43ca8b89e5d67f0d4aaddaf89a1892c1bdff55bcd62390dc9146c11cf1ed83a2',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M003',
    sourceId: 'fk-charter',
    itemId: 'item.388a6fe1b0b3',
    priorKind: 'heading',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 2. Problem statement',
    priorLocatorDigest: '7953d986515763db4e6c283bbfc5a06dbfe59a476c42b3b76a718d1bdc67c3ae',
    priorValueDigest: '5918d6cd790a84c127c310c305ab8a1035f2b63c34f74e4110c1e2b97d473e34',
    newKind: 'heading',
    newAnchor: '# Foreman Kernel Development Charter > ## 2. Problem statement',
    newLocatorDigest: '163d7424aebb612f6bcc7e9417bbfc462b3a94334fb9cdc2346e8b4be325cac3',
    newValueDigest: '5918d6cd790a84c127c310c305ab8a1035f2b63c34f74e4110c1e2b97d473e34',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M004',
    sourceId: 'fk-charter',
    itemId: 'item.b95669aefb57',
    priorKind: 'heading',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy',
    priorLocatorDigest: 'd7266f97774c9ab56bc5e74ea9b3927287b2c7817ef8031c23e986a9eb4904c2',
    priorValueDigest: '2f02ccc71b6761394d37aa83032b4bccdb93f4efe6b11cc09af5d9762bc3af00',
    newKind: 'heading',
    newAnchor: '# Foreman Kernel Development Charter > ## 3. Authority hierarchy',
    newLocatorDigest: '6011ffa46adeb50894b47a06fb767dca07cc45d62562232b94444f79f1832b3f',
    newValueDigest: '2f02ccc71b6761394d37aa83032b4bccdb93f4efe6b11cc09af5d9762bc3af00',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M005',
    sourceId: 'fk-charter',
    itemId: 'item.6486ca2f9352',
    priorKind: 'heading',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 4. Locked decisions',
    priorLocatorDigest: 'deaa495545d9d3a475661bef83b1259d8937f2eda1de4c3dc373781a8b3665b4',
    priorValueDigest: '90c64a15e826e55847243d82466504d5fb362a7ce40159784e30314ded4323de',
    newKind: 'heading',
    newAnchor: '# Foreman Kernel Development Charter > ## 4. Locked decisions',
    newLocatorDigest: '7f888f675084cf81220ae3c84fdfa7958c11081116a0cbc60734ea2f456c1dac',
    newValueDigest: '90c64a15e826e55847243d82466504d5fb362a7ce40159784e30314ded4323de',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M006',
    sourceId: 'fk-charter',
    itemId: 'item.3bc8baf32931',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger',
    priorLocatorDigest: 'b96ea6937bcfe526b2925bf437bc1d06e895bf6b22789df7df6ac1d3525871aa',
    priorValueDigest: '4258bc03c27f7a144cd89b81fb037f868b5c5f1b6ea40ae90d0e839ecaaf57fe',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger',
    newLocatorDigest: 'b33da7c610b6ddc7a2a968798d40a6f6d91627525842d5fac55a402624cc4401',
    newValueDigest: '4258bc03c27f7a144cd89b81fb037f868b5c5f1b6ea40ae90d0e839ecaaf57fe',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M007',
    sourceId: 'fk-charter',
    itemId: 'item.aa9ab580f03e',
    priorKind: 'heading',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 5. First-release architecture',
    priorLocatorDigest: '916905d0eeb0c036e96d69c5290219135cfc98a36c921f4f3dd288a80f52b81e',
    priorValueDigest: '5a1d0bcf23f339be8ac31f5ef3474731e5505ed4d1e0f3cee1c00d253e7a7ea6',
    newKind: 'heading',
    newAnchor: '# Foreman Kernel Development Charter > ## 5. First-release architecture',
    newLocatorDigest: 'c4182fa437f5c3d08855170412b490324f870a4328fc7ee5e6c4402294f7ca5e',
    newValueDigest: '5a1d0bcf23f339be8ac31f5ef3474731e5505ed4d1e0f3cee1c00d253e7a7ea6',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M008',
    sourceId: 'fk-charter',
    itemId: 'item.77af408c0fb3',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope',
    priorLocatorDigest: 'f072de150e7d4ce6495f0656b2d9f6e7342316dafbdcae2bcbaa219c4c2bc9b7',
    priorValueDigest: '38e3317477411fbe92fb88dd2be845fa27954ac13481ab1a4c973c4954938121',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope',
    newLocatorDigest: '698810b0ab7509e450952a7fcc6af9736770c8a6c47c29a602bb63c06b2fb6bf',
    newValueDigest: '38e3317477411fbe92fb88dd2be845fa27954ac13481ab1a4c973c4954938121',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M009',
    sourceId: 'fk-charter',
    itemId: 'item.e330e909f6f6',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes',
    priorLocatorDigest: '6eac5e01d0bc72381b3a049c0365836af09ecd353e95adaee68ce546778f6649',
    priorValueDigest: '2664cdd4cac67aeadeff2f1d406eb7ecccdb45c1659f56321f3f34cb333b6bb1',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes',
    newLocatorDigest: '6c210f2ed278b7ccbf587307ccac1eae71c66e3b6f6c7cfe360476645da4706f',
    newValueDigest: '2664cdd4cac67aeadeff2f1d406eb7ecccdb45c1659f56321f3f34cb333b6bb1',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M010',
    sourceId: 'fk-charter',
    itemId: 'item.21384b7c24b2',
    priorKind: 'heading',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition',
    priorLocatorDigest: 'cf3e3f920a3301d1cb07c8671f08e376ae20385e417f59374208e8ec2010915c',
    priorValueDigest: 'dd26a2c7d28096c61f8ac69b1e4c31f6194b71d9e201c0cf4e553c2598223320',
    newKind: 'heading',
    newAnchor: '# Foreman Kernel Development Charter > ## 6. Parcel decomposition',
    newLocatorDigest: 'bcfbf9c2e537a24ba132a4953c7a92b5abe46a43a2bf447070ed0135936e7e7f',
    newValueDigest: 'dd26a2c7d28096c61f8ac69b1e4c31f6194b71d9e201c0cf4e553c2598223320',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M011',
    sourceId: 'fk-charter',
    itemId: 'item.28648594b8fe',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 0 — Authority and contracts',
    priorLocatorDigest: 'c6bdcada57772482421e1802e071b054a6a08d39f09e0310cfa46ab137413954',
    priorValueDigest: '3f504461b144cf1539886c5ba5ea45f96e858a380ed2fbc45c2080c74af25951',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 0  -  Authority and contracts',
    newLocatorDigest: 'c7deddd82bf33eef3fb8a6724ace76c0ab29b7eb3d00abd93080e0f5f0346012',
    newValueDigest: 'a8cf8c0a7c3a40189cb6d4b29a9d68652fa28d32ec363168211e7c575a9beeaa',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M012',
    sourceId: 'fk-charter',
    itemId: 'item.7c611ad6ad15',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 1 — Pure trust core',
    priorLocatorDigest: '344114b46b2b1f6f176b97d223ece3c0fe553bf89f5b2c508723e67db4bf916f',
    priorValueDigest: 'b4904e34bb56aa8ed73b1b72526d56e5690411140b0b338f094d5d87a15e310d',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 1  -  Pure trust core',
    newLocatorDigest: '2ff5e64e533bdb017d09d0c2c773a258c93ce10dccb1b4f157fe99a277ecd75b',
    newValueDigest: '2ebfddabb64dd7dcea68592b53336f6b3ac302de4d92aee5ba0a90047b9ee678',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M013',
    sourceId: 'fk-charter',
    itemId: 'item.2fc2d08c0a18',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 2 — Stateless read-only MCP and container',
    priorLocatorDigest: '019cddf48170792ca848583e05132568b8f2f1c734a35c5e5df048da66ba4176',
    priorValueDigest: 'f1c6e1fac97167eb109b793a90d75dad1051183c74ed835f617b72fc3c5482b7',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 2  -  Stateless read-only MCP and container',
    newLocatorDigest: '9789c94563a0a535336a80bc14ef36e510d9cb50e4a43333dc6522a3bc4e2ac2',
    newValueDigest: 'fd575fc1a912682fc02f74a31c5ba150ff7b71df41a99ab3d5deab2ab3c4fffa',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M014',
    sourceId: 'fk-charter',
    itemId: 'item.d399511a374e',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state',
    priorLocatorDigest: '41d58f67ce81b5611fe871bfcdbbac5799c3efea983b11c25c70eb391c565ff4',
    priorValueDigest: 'ecb139a9466ddb7daf4af8db14ccac5fd468042bc113ada17557eddf55f9c0c2',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state',
    newLocatorDigest: 'c1f2c7b0acb49ee8cc9756c1de1b99aa8e75ce6a2fe97bcb0ab6049a98481cf1',
    newValueDigest: 'cea890ee4dd7ba25f2e1cfc684ee89f3b4353cd73dba3265c94a9405fc548889',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M015',
    sourceId: 'fk-charter',
    itemId: 'item.2661ab7d1dc1',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion',
    priorLocatorDigest: 'feef97e668607a06503d2e9457c6f39b3a4534b0d7ef807873050a66114a87dc',
    priorValueDigest: '48e30ecf09aefb8c82896d3e4ca7e856ae3277939a073da5de0969e228bbd05a',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion',
    newLocatorDigest: '8578a76b46ca480fed3143898d20e7f7985f6b8ca9cd45ca610e6cb69f64359a',
    newValueDigest: '09609a9643de938e57f8ad6468af44b3429383080a2d5e01de55d89fc3c8c761',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M016',
    sourceId: 'fk-charter',
    itemId: 'item.1b6849fd1180',
    priorKind: 'heading',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal',
    priorLocatorDigest: 'c1a164db16eabf84a778fcf8f0d9f053f9a9ccaa37f0e21bcbbb4fbd41f45218',
    priorValueDigest: '011940574ca84be2c81f823bfc35ea0650b7ab41c9c79d5c4631a9b0638b6b83',
    newKind: 'heading',
    newAnchor: '# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal',
    newLocatorDigest: 'fd48238ba321e13970f0ac282a2be2ac7ae4582fc9b534efd47b6d64d5cc6e36',
    newValueDigest: '011940574ca84be2c81f823bfc35ea0650b7ab41c9c79d5c4631a9b0638b6b83',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M017',
    sourceId: 'fk-charter',
    itemId: 'item.80a3748c262d',
    priorKind: 'heading',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 8. Integration scenarios',
    priorLocatorDigest: '8742c779aee89e5a684f90306a6aed94c4a1d6ab3f5234799a0a77c0ecadd7e1',
    priorValueDigest: 'fc0cea94fcee8c3775735bfa1d2055a6537f3f10ac5445aaf2f5c342efe6beb9',
    newKind: 'heading',
    newAnchor: '# Foreman Kernel Development Charter > ## 8. Integration scenarios',
    newLocatorDigest: 'e3219da4421a29bacab6d32bb3e5e1744713570dfcb8155ea83b7ff4fe819f20',
    newValueDigest: 'fc0cea94fcee8c3775735bfa1d2055a6537f3f10ac5445aaf2f5c342efe6beb9',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M018',
    sourceId: 'fk-charter',
    itemId: 'item.1ecd3156bb7b',
    priorKind: 'heading',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion',
    priorLocatorDigest: 'eb3bc9e39155b4d9e9a1165a090da90df9feb71e36a9a8e1fd9ee70937579141',
    priorValueDigest: '81a71045b90d3e5cc0938c505278c9903b636626dd98a4a79210105f5c6ec217',
    newKind: 'heading',
    newAnchor: '# Foreman Kernel Development Charter > ## 9. Goal exit criterion',
    newLocatorDigest: '9a9a8f89e66a5f054ac1aad5e76cc1afa6aa5efb6a5a31216f0339543561ab3e',
    newValueDigest: '81a71045b90d3e5cc0938c505278c9903b636626dd98a4a79210105f5c6ec217',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M019',
    sourceId: 'fk-charter',
    itemId: 'item.17fbcec22bcf',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 10. Human gates and standing authorizations requested',
    priorLocatorDigest: 'acc80cc3f8e66b1e9c8892f5d002135aba55a1994227eeb6f6e24915f1aaa003',
    priorValueDigest: '8cd59986a10022f166dfcc641d9f3a5a9d4a72d50b18ef6156e7b434d9bb2564',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 10. Human gates and standing authorizations requested',
    newLocatorDigest: 'fafb96c09a96e8ff0872e953423d089b4543a12f901c6995152f4b575ce01729',
    newValueDigest: '8cd59986a10022f166dfcc641d9f3a5a9d4a72d50b18ef6156e7b434d9bb2564',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M020',
    sourceId: 'fk-charter',
    itemId: 'item.4f436ba95f57',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 10. Human gates and standing authorizations requested > ### Gate 1 — charter ratification',
    priorLocatorDigest: '6c18c6241b970aaac51f1726cb3d60d6b5813cd962a8b0a6b785848072593392',
    priorValueDigest: 'c64b8039a41e5a4d07bd136710a76a046ba7e7d9ab4d1309be1bee02d2ee1fc7',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 10. Human gates and standing authorizations requested > ### Gate 1  -  charter ratification',
    newLocatorDigest: 'dacb128196bd434eb09d27c2c2c58dd9432ce2e757e379b1f70863847934d780',
    newValueDigest: '8b6820d9d3d8a2044e46c76891dca7d46e62e829a527d34e9699c21cd695797a',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M021',
    sourceId: 'fk-charter',
    itemId: 'item.e4b9ff1f8c41',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 10. Human gates and standing authorizations requested > ### Gate 2 — parcel dispatch',
    priorLocatorDigest: '72f93a8f7858b0034a01ca31ce1ad5397362c95b73c0a013afbe9263fa107cc7',
    priorValueDigest: 'd851160c9ee9730ed94cdf768ae98b8effd02b4a13858fd99ffdccca28a1d8ce',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 10. Human gates and standing authorizations requested > ### Gate 2  -  parcel dispatch',
    newLocatorDigest: '4edc729f41d41f7fc4c94062649715fbda17de00334d0eba20fb90bd32979df9',
    newValueDigest: '0a45f9f4c74ce620920a9521c034ce627cb9b78853fd15f43ae581cb0e87be5a',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M022',
    sourceId: 'fk-charter',
    itemId: 'item.ef74f9b402bf',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 10. Human gates and standing authorizations requested > ### Gate 3 — merge',
    priorLocatorDigest: '3b68eb27384ea133257aed538df7b822ebb8616528b0dad1b12a065db10cf414',
    priorValueDigest: 'b3d6fcb5ce3bbefc5a8c1dc1cd32cbfa72ebf1de19995c2f78789573f6958d2f',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 10. Human gates and standing authorizations requested > ### Gate 3  -  merge',
    newLocatorDigest: 'c8a65746a41530e65da10e4a1bf5911c7e9220430805ed5b39293f67b0275370',
    newValueDigest: '05529b45c9979f236d8a042f2f2ea237c6b4333704c34e2d1839bb06af414b85',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M023',
    sourceId: 'fk-charter',
    itemId: 'item.6234115eff36',
    priorKind: 'heading',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 11. Stop conditions',
    priorLocatorDigest: '499a225bc5cd4f4ab4fa7eaaaf5f83b94e932229ab7893bc17c87034da550b7c',
    priorValueDigest: '131151923209ac4cd178dbc326da8a1b682dfeae74ebe6111fff961ff4ed37c3',
    newKind: 'heading',
    newAnchor: '# Foreman Kernel Development Charter > ## 11. Stop conditions',
    newLocatorDigest: '630bdcd42ce0e0fd8025402597b70e8892937ab9f7a39816420e2c79246c0abf',
    newValueDigest: '131151923209ac4cd178dbc326da8a1b682dfeae74ebe6111fff961ff4ed37c3',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M024',
    sourceId: 'fk-charter',
    itemId: 'item.56a03af5e844',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints',
    priorLocatorDigest: '7dc9b628b076db0339a9f22fa9ff2393ef234f1ee6a4d8fdd0adaf1cae59a312',
    priorValueDigest: '795bad6731febe105217663d7f701e9a350dbd1cc9e2a89894540717e0ebe810',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints',
    newLocatorDigest: '523fe72756a105c8aec1c3584d835751bbe6bcb739d6c245500845eb7b1d5f51',
    newValueDigest: '795bad6731febe105217663d7f701e9a350dbd1cc9e2a89894540717e0ebe810',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M025',
    sourceId: 'fk-charter',
    itemId: 'item.3d5255bad2ec',
    priorKind: 'heading',
    priorAnchor: '# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list',
    priorLocatorDigest: '427cfe18874336d24a71bfa27cb02bb946ee6cdd3cb440d1ec66e1c958927d6b',
    priorValueDigest: '81f5bf89fb132c3669513e2a42788563fac54da6eff92b7366ac9a8da3382b8b',
    newKind: 'heading',
    newAnchor: '# Foreman Kernel Development Charter > ## 13. Gate 1 decision list',
    newLocatorDigest: '112d6be7429bc9ae7426e5850c22f68fca7b47c0acc5b27696d9001c7d20f1f6',
    newValueDigest: '81f5bf89fb132c3669513e2a42788563fac54da6eff92b7366ac9a8da3382b8b',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M026',
    sourceId: 'fk-charter',
    itemId: 'item.708e84a0404d',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07',
    priorLocatorDigest: '35191de8e540f7ebd09caf0081a8ba0d3286e6c8c67e9130f8d3c7aecd0afb7d',
    priorValueDigest: '66a92578ca608594d0583f123d3888964dda990bbda5420d79d3499a9d61917a',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07',
    newLocatorDigest: '2c9f9c074f7bd1aaea4b578c9f288eba96f78635491950a9864b96a3a3f01494',
    newValueDigest: '66a92578ca608594d0583f123d3888964dda990bbda5420d79d3499a9d61917a',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M027',
    sourceId: 'fk-charter',
    itemId: 'item.5a0993db959d',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution',
    priorLocatorDigest: 'a419ab9a5a680401aaafcbb7e41e72b3b676fee77955f758d9cdb373cff8fec3',
    priorValueDigest: 'fa788505f08e181959c274af57b97fced4557cc61932808efeb3648a733c59ef',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution',
    newLocatorDigest: 'fcce39b289d428105397f44f5c82471a41c6cc644b0ef5d3351af31e5e30d755',
    newValueDigest: 'fa788505f08e181959c274af57b97fced4557cc61932808efeb3648a733c59ef',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M028',
    sourceId: 'fk-charter',
    itemId: 'item.786b95269a6a',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts',
    priorLocatorDigest: '52f130311f5c9253bfaa80fdd57c4dfe7e4bf2394b5b70187f539bbe69ba9401',
    priorValueDigest: '27c9314e6d236c3a059410310064d2f475f7436a2d5c5d75f73064324a16ad54',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts',
    newLocatorDigest: '1af3a3adfaa0cd8c17b6180e4c3e210e359796b969c2a854488d5df73f5626aa',
    newValueDigest: '27c9314e6d236c3a059410310064d2f475f7436a2d5c5d75f73064324a16ad54',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M029',
    sourceId: 'fk-charter',
    itemId: 'item.24ace3f8b3bd',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions',
    priorLocatorDigest: 'c1340b6a14273a6e0f48176a28e92a907142604da6f08667fa2522312e42dce2',
    priorValueDigest: '03047db718b5c71de518460ee5479f81f8fba0bfb58d69694d28f096203f719c',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions',
    newLocatorDigest: 'f1e10f040fab3e431b4cc06298088e2a0158c61adcf944d75fa8d6896514208c',
    newValueDigest: '03047db718b5c71de518460ee5479f81f8fba0bfb58d69694d28f096203f719c',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M030',
    sourceId: 'fk-charter',
    itemId: 'item.b220994ee1cd',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence',
    priorLocatorDigest: '21be625afa3db4fb3e052254c641300780addbb6db0de016037d77fdb82bca97',
    priorValueDigest: '6d40079a5fc3100c81363a96492838e3eb90c38a7289c1e067203d246f987210',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence',
    newLocatorDigest: 'df5c7e369e9188e0ec4b6af0041c6b20bfa7e6614a26bbf05a0a0428e687bda8',
    newValueDigest: '6d40079a5fc3100c81363a96492838e3eb90c38a7289c1e067203d246f987210',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M031',
    sourceId: 'fk-charter',
    itemId: 'item.b2cef1abaa06',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans',
    priorLocatorDigest: '2a8e312a972cb8d78cf9f3a5cc84ff91d0b4ed8e77dd3d5a65e8eb8f9a616f5c',
    priorValueDigest: 'bd6421f23b4d1e5333fc41d12feea33eec28463d07fe3e05d0f43650e9895a92',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans',
    newLocatorDigest: 'd89ebd02a014abc681791f7d628bf4896dd3ae143921495b229e5cc0afc85ec6',
    newValueDigest: 'bd6421f23b4d1e5333fc41d12feea33eec28463d07fe3e05d0f43650e9895a92',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M032',
    sourceId: 'fk-charter',
    itemId: 'item.9a6254ae7454',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline',
    priorLocatorDigest: '67445cc91b11e30d8a1dba27589c77e622e21c8feca5b0dc76e7228a0c7cf5cc',
    priorValueDigest: '1a33c2ff8ff3506441beae322ee3c7e9e6715c48da18ac359ab0cc89e9d6561f',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline',
    newLocatorDigest: '7e5871e3c7f7a68062320f85f4f3508dd862977ec0bd0d584506a495421e2a8c',
    newValueDigest: '1a33c2ff8ff3506441beae322ee3c7e9e6715c48da18ac359ab0cc89e9d6561f',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M033',
    sourceId: 'fk-charter',
    itemId: 'item.2fa788c26a4e',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory',
    priorLocatorDigest: '65c88d1ae47bb9a175ae0bfc2acc766e4a21bbdd10e8b66c5e4b709fe24f8734',
    priorValueDigest: '452cac370f6ac0f8415a4cac24c82572755b179308708f50342ba24832dd587d',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory',
    newLocatorDigest: '30c83a4abb4eec638cb3777b456960aa0efc377a7d1c1c3c30a967296308d08c',
    newValueDigest: '452cac370f6ac0f8415a4cac24c82572755b179308708f50342ba24832dd587d',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M034',
    sourceId: 'fk-charter',
    itemId: 'item.826be554f021',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions',
    priorLocatorDigest: 'c6bcc450827ffd53484fcc95295e562148937f2722bfdfe823aea54eb2ad4998',
    priorValueDigest: '5a11ed3772f98da25606a05e00cf677cc96b69aed38f99f63a6750871b773648',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions',
    newLocatorDigest: 'f452b856fc00ccfb3117637d3c7aa19d91b7e1ef7822064a871efee891aa1af6',
    newValueDigest: '5a11ed3772f98da25606a05e00cf677cc96b69aed38f99f63a6750871b773648',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M035',
    sourceId: 'fk-charter',
    itemId: 'item.b82ee9d4ddfe',
    priorKind: 'heading',
    priorAnchor:
      '# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership',
    priorLocatorDigest: '23855263e5bdefd66618ac8a2aceb5bdceec7d134bd264549a19ad1437761f7c',
    priorValueDigest: '9e389a6c0e004bda086890f818cfd67832e3b27c15041f263dbdb566dd6c0223',
    newKind: 'heading',
    newAnchor:
      '# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership',
    newLocatorDigest: '48dcb27261d3d10c26f6fa6460269a0f513ab28ceb191792ca965664df69b539',
    newValueDigest: '9e389a6c0e004bda086890f818cfd67832e3b27c15041f263dbdb566dd6c0223',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M036',
    sourceId: 'fk-charter',
    itemId: 'item.a583b7f02950',
    priorKind: 'line-excerpt',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel:paragraph:1',
    priorLocatorDigest: '224c078bc28fe09b71d046ebe991c6fb82ea78739d5271f0047eb26ebcde4afa',
    priorValueDigest: '3060943cf8ab59e03075de35423dc0a6a09e3aa64937afc9937e1e8d92debc30',
    newKind: 'line-excerpt',
    newAnchor: 'md-block:# Foreman Kernel Development Charter:paragraph:1',
    newLocatorDigest: '383563247f863339d6ec34936bef39a7dabef2d3120d188ac7a3ba70f9c7fa1f',
    newValueDigest: 'd30e7dde62fd9df19d477bf2e7a74d018e4a8b250e2ab8a286be02272e2b47b6',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M037',
    sourceId: 'fk-charter',
    itemId: 'item.203907c2fcab',
    priorKind: 'line-excerpt',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 1. Objective:paragraph:1',
    priorLocatorDigest: '3db7ff097fcf3b3850d8a73781518e1257279cd3984fd4b9b0d61cf290a4ed36',
    priorValueDigest: '08907208ee29f07b7f5d56687eb369f761125c89e76d2209d3e19f8486ab9174',
    newKind: 'line-excerpt',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 1. Objective:paragraph:1',
    newLocatorDigest: '1fcfffd77f13ed5dbfc6641b3abf9b06825346c7e1e71cd6236927f4e94999a1',
    newValueDigest: '08907208ee29f07b7f5d56687eb369f761125c89e76d2209d3e19f8486ab9174',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M038',
    sourceId: 'fk-charter',
    itemId: 'item.3620260045a5',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 1. Objective:list-item:1',
    priorLocatorDigest: 'a41111b4331b0d85e33010c77b6392335d64042cc8ee116285f0fd37f13da22c',
    priorValueDigest: '17c50890dec8bd42d16c1f6e220e44353939f8b47f50cf729fd0df42265c077a',
    newKind: 'numbered-item',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 1. Objective:list-item:1',
    newLocatorDigest: '3908551fc6acc0a82bed300e11e5a0839247369d28d44c1c3745405121ee1bdc',
    newValueDigest: '17c50890dec8bd42d16c1f6e220e44353939f8b47f50cf729fd0df42265c077a',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M039',
    sourceId: 'fk-charter',
    itemId: 'item.16f0036885ba',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 1. Objective:list-item:2',
    priorLocatorDigest: '0ba87ee148d4ad9597ed677c7090cb8fd68d251f73de67d60e5a66f3b6f12166',
    priorValueDigest: '822d7a3a5f4f20b5ead0503b4aba8b979748c925000aa34d413890438952f4ad',
    newKind: 'numbered-item',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 1. Objective:list-item:2',
    newLocatorDigest: '8999ec6f1061bb49d8e4c8ddbafe480c8d2e673565aed1ee285f3beb3b88349e',
    newValueDigest: '822d7a3a5f4f20b5ead0503b4aba8b979748c925000aa34d413890438952f4ad',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M040',
    sourceId: 'fk-charter',
    itemId: 'item.eebf9c2d70f0',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 1. Objective:list-item:3',
    priorLocatorDigest: '4d350ba009034ee62a45e08f04491a6297b537463a996eed4a7588cb49bb034e',
    priorValueDigest: 'bd4400203d17f9235c248392ab5473f66708728b37e8271941ea3d43f4ba4994',
    newKind: 'numbered-item',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 1. Objective:list-item:3',
    newLocatorDigest: '615a5335cda432a7da2ab5b2529b1e5cd7e48b8ecfec8efcb81c418af9373a8b',
    newValueDigest: 'bd4400203d17f9235c248392ab5473f66708728b37e8271941ea3d43f4ba4994',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M041',
    sourceId: 'fk-charter',
    itemId: 'item.93c91aa31d91',
    priorKind: 'line-excerpt',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 1. Objective:paragraph:2',
    priorLocatorDigest: 'b01710bee8c2afc9dddd71c41b8eb6d815c7ff2da3642b8cc72a837c11d8fb9a',
    priorValueDigest: '0f5213b5ddb5fac98c4a59e70b3a1e1e92c615abf8866ee78f9dbe87f0a2ffb3',
    newKind: 'line-excerpt',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 1. Objective:paragraph:2',
    newLocatorDigest: '64a0e78b8b477283756833d799d09d18037d501a7ca8641a3b6eec8ac6680e27',
    newValueDigest: '0f5213b5ddb5fac98c4a59e70b3a1e1e92c615abf8866ee78f9dbe87f0a2ffb3',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M042',
    sourceId: 'fk-charter',
    itemId: 'item.2e6e09d602a5',
    priorKind: 'line-excerpt',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:paragraph:1',
    priorLocatorDigest: '8b579fce8c8241c954b51be908cf628bad0b9567e7614dc47d045a7b86637a32',
    priorValueDigest: 'c2cd700017fa9b11095ed57c24d35d39db491216501b71d8b3e7bfc15c15f4ff',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 2. Problem statement:paragraph:1',
    newLocatorDigest: 'a6321b4279ca3bbc58816d7c09c0ba2cff096c905e3a291cd9dc8afc074df86e',
    newValueDigest: 'c2cd700017fa9b11095ed57c24d35d39db491216501b71d8b3e7bfc15c15f4ff',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M043',
    sourceId: 'fk-charter',
    itemId: 'item.93d5d3978e5f',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:list-item:1',
    priorLocatorDigest: '9be132ec290c035c66f1724a4672cc191e8c669d3706a0baff8b2378b1bfeb4e',
    priorValueDigest: '931914e367c02a1e7b789c1b2f4f69a95a989dd98a45c2312a34cded646f82cc',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 2. Problem statement:list-item:1',
    newLocatorDigest: '071074eaa9086bfabe7916d8248eac98ecfc78901b381f3fe2933ee6024335c3',
    newValueDigest: '931914e367c02a1e7b789c1b2f4f69a95a989dd98a45c2312a34cded646f82cc',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M044',
    sourceId: 'fk-charter',
    itemId: 'item.286e2c0ff452',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:list-item:2',
    priorLocatorDigest: '63f28894940d57959f57f22a0b4cd364684d29af2c8c7b84f24acdd90473581c',
    priorValueDigest: '3bb95654f10461cdcaa0487ab443c458b7cb1ce9e585e0cd6816996806c7829c',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 2. Problem statement:list-item:2',
    newLocatorDigest: 'a132de3b8c0c9b817cd295c3038cb847ca320aa239c735f30d7341db61c12ced',
    newValueDigest: '3bb95654f10461cdcaa0487ab443c458b7cb1ce9e585e0cd6816996806c7829c',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M045',
    sourceId: 'fk-charter',
    itemId: 'item.263bc52874f2',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:list-item:3',
    priorLocatorDigest: '221061ed08fa25eb71cb8e86f29158342b13b3c0c9c4266bb6ec80ac61c29c9b',
    priorValueDigest: '0deef02d1d3b856fe384f7448866699d77da31af7932616d3c3eb5408565520a',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 2. Problem statement:list-item:3',
    newLocatorDigest: '034966f8ad9fc2bff59884b6c9b7224b5271a8314c8c3e44ea3b9fd00c32167b',
    newValueDigest: '0deef02d1d3b856fe384f7448866699d77da31af7932616d3c3eb5408565520a',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M046',
    sourceId: 'fk-charter',
    itemId: 'item.30e0d34f1b24',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:list-item:4',
    priorLocatorDigest: '9018b35f0af36fe671c46007fab8554e3a990ae519842dfcf8a63fc79264a2e4',
    priorValueDigest: 'd17a96884c65898a602949cad2e22ae9edbed54bea47dd01a0955d730ccd7d01',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 2. Problem statement:list-item:4',
    newLocatorDigest: '170b5e1a7b49675e48f65aae325fe0c4a6fdaacb5e3c577c1162b14f19b22e48',
    newValueDigest: 'd17a96884c65898a602949cad2e22ae9edbed54bea47dd01a0955d730ccd7d01',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M047',
    sourceId: 'fk-charter',
    itemId: 'item.b743b2f6db66',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:list-item:5',
    priorLocatorDigest: '85a1a5270551ff03e51f79287084379cd88909e6aa58e4389013ebec524d38fa',
    priorValueDigest: '3076685adfc3883293e8d7351e24f4add659a6a4c960603f62f40e33ba18ea21',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 2. Problem statement:list-item:5',
    newLocatorDigest: '0fb78ded8a82220e846ad7000e563f8fb2d07d1309118677c8e0fc2261a1d579',
    newValueDigest: '3076685adfc3883293e8d7351e24f4add659a6a4c960603f62f40e33ba18ea21',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M048',
    sourceId: 'fk-charter',
    itemId: 'item.bad88a513c02',
    priorKind: 'line-excerpt',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:paragraph:2',
    priorLocatorDigest: 'be4c34eee39cfa6dcc42da384371f6598497509b13c247cbb8387e5aa636c3db',
    priorValueDigest: 'a54cdd3ee9146eae38b96caaf09a546bfc09ecc6fc5cb818b423daa5ba2b8dbd',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 2. Problem statement:paragraph:2',
    newLocatorDigest: 'ff0d8cc236c593f0898eb3d5b600bc7873ba97eba6d916e57247fa0bd27ce6fb',
    newValueDigest: 'a54cdd3ee9146eae38b96caaf09a546bfc09ecc6fc5cb818b423daa5ba2b8dbd',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M049',
    sourceId: 'fk-charter',
    itemId: 'item.69c53b27e66e',
    priorKind: 'line-excerpt',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:paragraph:1',
    priorLocatorDigest: '81d9998e07ba4428153a5fb57600478ad7adc35f5e881827f2ca02e2448ac44b',
    priorValueDigest: '0274a0193f698beefc0a61c7f2561fd666510f64030ae3ac68f2f161fc4f00d9',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:paragraph:1',
    newLocatorDigest: 'c21103d571228ad066c71987eebe81cad0b073adffe79cf9bbb341226ceb7922',
    newValueDigest: '0274a0193f698beefc0a61c7f2561fd666510f64030ae3ac68f2f161fc4f00d9',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M050',
    sourceId: 'fk-charter',
    itemId: 'item.3ba0fca807d0',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:list-item:1',
    priorLocatorDigest: '7df27495a3e13be88ebffb3ec1e476b2282e17f52dafbb80f7b23e5ac145c268',
    priorValueDigest: 'c188c213952c78a1a81df894b28188b2e07f66b50227c19cad871176f5c8c24d',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:list-item:1',
    newLocatorDigest: 'c30a7d6fbc9092687cea2ec3821f8fe0a7672f0e21ba48e2d4842b1ced5f743b',
    newValueDigest: 'c188c213952c78a1a81df894b28188b2e07f66b50227c19cad871176f5c8c24d',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M051',
    sourceId: 'fk-charter',
    itemId: 'item.527356f5f91e',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:list-item:2',
    priorLocatorDigest: '30a0a8531106e5ff6c70cd20a278ff6d277f539a4cf352fda54f586115e8cd4c',
    priorValueDigest: '665357c3f7ab04c2a508c581d7100594daacbef947508dc9e5bf42e9e34205e7',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:list-item:2',
    newLocatorDigest: '3286309b064e8530b333d05e353f105cb0a9a62d5b2a389e8519afa1dc826809',
    newValueDigest: '665357c3f7ab04c2a508c581d7100594daacbef947508dc9e5bf42e9e34205e7',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M052',
    sourceId: 'fk-charter',
    itemId: 'item.bb4a5c9fdec0',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:list-item:3',
    priorLocatorDigest: 'b114b204f086046c8f12a6dd705520a7640ddc5d7b3446946309d7749c2aaae9',
    priorValueDigest: 'ff060d19535b85e5ea28170a2d922dd94c4a8a77c1bca93ce0037a09be0d2e35',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:list-item:3',
    newLocatorDigest: '9e3713319e8adbd7064efbc527e0a388882c29a2f3e783b6af0117eaf8302625',
    newValueDigest: 'ff060d19535b85e5ea28170a2d922dd94c4a8a77c1bca93ce0037a09be0d2e35',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M053',
    sourceId: 'fk-charter',
    itemId: 'item.191e6ee40a8a',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:list-item:4',
    priorLocatorDigest: 'f6812bba7b3530e43a88c3de362c608ff9ff9c5a348c43ef64eea74ef461c0b4',
    priorValueDigest: '638fc21fd3fa04d255ebaa8f675d676d94eb7591dd145be823e97edf30b6d338',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:list-item:4',
    newLocatorDigest: '9c637a09e7ddf00560f1d9693a229390adc88f47cad4ecd7ccfc68eefb622487',
    newValueDigest: '638fc21fd3fa04d255ebaa8f675d676d94eb7591dd145be823e97edf30b6d338',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M054',
    sourceId: 'fk-charter',
    itemId: 'item.a249a913deaa',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:list-item:5',
    priorLocatorDigest: 'a774c3bd33828a5d0ee454abcf47b39ca24045d58105b0b53aab07a8bc43bf74',
    priorValueDigest: 'b4cc56de7375192991c8a8073c967ab1000b9e37e7b31a7d5d0808dfb6f0c527',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:list-item:5',
    newLocatorDigest: '6e4061abd947f259541f810caf973c3241a4164cc7d4f2b855fea2e2e7230923',
    newValueDigest: 'b4cc56de7375192991c8a8073c967ab1000b9e37e7b31a7d5d0808dfb6f0c527',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M055',
    sourceId: 'fk-charter',
    itemId: 'item.f7ed5dccb318',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:list-item:6',
    priorLocatorDigest: '551423131ebffb8fe5f2579d3d2a5d281a31a3632eee360f084d8b21f1c85f0f',
    priorValueDigest: '8b5fa5a3f41965106ba8182d54b2812e106f3f5792fd47ca936c5f569c67176e',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:list-item:6',
    newLocatorDigest: '97a0a01b968642796f75a5a874c44a9cbadc410742460c5e8ce3f9b63274d4ee',
    newValueDigest: '8b5fa5a3f41965106ba8182d54b2812e106f3f5792fd47ca936c5f569c67176e',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M056',
    sourceId: 'fk-charter',
    itemId: 'item.611c1a6f6bce',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:list-item:7',
    priorLocatorDigest: 'a11be926dbd19b16448455fcdb91da8be0f357d9217f9d389c2b7330a076206c',
    priorValueDigest: 'ab50f0e197929bcec65c8114bbf7aad71ac08b71e2de1c63626ea48a6c6c9de4',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:list-item:7',
    newLocatorDigest: '6a7aa3f56b29af4980d18877c672ba5fcd6e01ccc820f2b4dc3683015a46a6c6',
    newValueDigest: 'ab50f0e197929bcec65c8114bbf7aad71ac08b71e2de1c63626ea48a6c6c9de4',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M057',
    sourceId: 'fk-charter',
    itemId: 'item.2a524c1ea63f',
    priorKind: 'line-excerpt',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:paragraph:2',
    priorLocatorDigest: '90869ff1fdd3d7b5b03ace121fa6dcf12beb30f29068119cc352e406b628b3b2',
    priorValueDigest: '5e9805301c2d5aae54a063f4dba845ad95d6e33e5af6e3fb5327837265fb1289',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 3. Authority hierarchy:paragraph:2',
    newLocatorDigest: '076989e915e29fb23629a90f1730af69ac52c57a1af1120f39926050e5039d00',
    newValueDigest: '5e9805301c2d5aae54a063f4dba845ad95d6e33e5af6e3fb5327837265fb1289',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M058',
    sourceId: 'fk-charter',
    itemId: 'item.cd014d6d90c5',
    priorKind: 'line-excerpt',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions:paragraph:1',
    priorLocatorDigest: '31709c1c04662a3189c76cecaa2408c7e0f05060ad72525e6a254d397705a104',
    priorValueDigest: 'cb5b17ef33650df3765f3839ed98448d446dc302d3f5643fdba46aa184cb5c4a',
    newKind: 'line-excerpt',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions:paragraph:1',
    newLocatorDigest: 'd53bca1f2f407e1b55464cc2b2be992c4a28d9629831f4aab4c9120a566b49e9',
    newValueDigest: 'cb5b17ef33650df3765f3839ed98448d446dc302d3f5643fdba46aa184cb5c4a',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M059',
    sourceId: 'fk-charter',
    itemId: 'item.0077176dba28',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:paragraph:1',
    priorLocatorDigest: 'f93df4bcd8a2af0fee77ea4e8732a0d681f85f1670af4a61937f3a8f538fd26c',
    priorValueDigest: '016efba085ed863e9c02388fbbe01979213cf54e48082f7efc71d2e1a4892762',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:paragraph:1',
    newLocatorDigest: 'd98b4dbe434fc750b549bd583f19942f444c730053c5197974807cecfbd4eb92',
    newValueDigest: '016efba085ed863e9c02388fbbe01979213cf54e48082f7efc71d2e1a4892762',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M060',
    sourceId: 'fk-charter',
    itemId: 'item.11307b6ee77e',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:paragraph:2',
    priorLocatorDigest: 'db19b61d7acd1f6b1924ca7ad8fd946f15ef92e54e3e64f066a9543211352f8b',
    priorValueDigest: '5e7cd92bdf6e801b50e2b7e00850c9bb8525e7f420bb10240e945ab875ee4533',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:paragraph:2',
    newLocatorDigest: '5a012787845c10978e566b9ee83ae62d98ea970a8c538436c69e62a3a72a96ae',
    newValueDigest: '5e7cd92bdf6e801b50e2b7e00850c9bb8525e7f420bb10240e945ab875ee4533',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M061',
    sourceId: 'fk-charter',
    itemId: 'item.73c2e8af98c5',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L1',
    priorLocatorDigest: '5be96aabdbd4616070df8699ac926a4054fb9cc4764558e5f8841dcd17f84a1e',
    priorValueDigest: '10227f07e504175c130d828b50c7924ce2fd5bd1aaf379c5044528a228e4daab',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L1',
    newLocatorDigest: 'f459538904815a9edd9c1ace86a45b96afd5ea725ed9f7e1faa5adfad90935ce',
    newValueDigest: '10227f07e504175c130d828b50c7924ce2fd5bd1aaf379c5044528a228e4daab',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M062',
    sourceId: 'fk-charter',
    itemId: 'item.56c611d71350',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L2',
    priorLocatorDigest: '9ed5b6bb5387081898d234a7234de6a00783a61789d39cd0b66b43dbb58b5459',
    priorValueDigest: '87ca8e25c8dc385f9a685eedd2cd26da688e706e1b08f3b313e23d5f8cea3643',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L2',
    newLocatorDigest: 'ef62cb2875c76a44789a73e3e1a0453468050d0315e4a48f98e4089afa0eceb9',
    newValueDigest: '87ca8e25c8dc385f9a685eedd2cd26da688e706e1b08f3b313e23d5f8cea3643',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M063',
    sourceId: 'fk-charter',
    itemId: 'item.cf301316d970',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L3',
    priorLocatorDigest: '878f7003a230b2948dba17fd503be70abaf6cfa489a57c014fe4c21a00fe4162',
    priorValueDigest: '77fca69f904dc731171e4d5263cb55848a94dea875d76d945fba243f330da5f7',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L3',
    newLocatorDigest: 'c799a9b4b639cab0306ebd4d8d954f5c67b2bf82f20dd9cb46f5207b533ec498',
    newValueDigest: '77fca69f904dc731171e4d5263cb55848a94dea875d76d945fba243f330da5f7',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M064',
    sourceId: 'fk-charter',
    itemId: 'item.fbed3af63b13',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L4',
    priorLocatorDigest: '78e8b87907322cf1dae7fd214ab9079aa16ce6e1b3446709b2b0745d01b68024',
    priorValueDigest: 'c79a6e083966ed83dbbe3d7655b8202713fe70c5df036e265c4cdd79e5bdc1a7',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L4',
    newLocatorDigest: '43ff291ed633156a034ba49f8137cced1b54ad4aab5050147bd5ab695c5e9e36',
    newValueDigest: 'c79a6e083966ed83dbbe3d7655b8202713fe70c5df036e265c4cdd79e5bdc1a7',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M065',
    sourceId: 'fk-charter',
    itemId: 'item.f081be090f04',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L5',
    priorLocatorDigest: '99d6c696ddd05b97d9a97d61c1a19217c12d4e430d509e622dc4b0161bf2e405',
    priorValueDigest: 'ab5dce965ea7e68dcfa2ac68e0c7cd1217949553daeace56cbaf2241005577d5',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L5',
    newLocatorDigest: '2466ff4dc7d8e949593e57bd7a9fba2c1ec9af4f9012e0f738a3cb94b02b6ec8',
    newValueDigest: 'ab5dce965ea7e68dcfa2ac68e0c7cd1217949553daeace56cbaf2241005577d5',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M066',
    sourceId: 'fk-charter',
    itemId: 'item.131a7863b940',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 4. Locked decisions > ### 4.1 Ratification ledger:paragraph:3',
    priorLocatorDigest: 'c912b118b8d8d243968b8c5dae10899d27bc398ac8b8b78db6e872c0a3a1b36a',
    priorValueDigest: '463f75ca85843d1223f301c815e7e677b49e6642149003ea69d3c545853d1aa4',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:paragraph:3',
    newLocatorDigest: '8103fda16b7ba08848bf2658c9b269685bbc878fe34546a89d3da4dd940c9de0',
    newValueDigest: '463f75ca85843d1223f301c815e7e677b49e6642149003ea69d3c545853d1aa4',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M067',
    sourceId: 'fk-charter',
    itemId: 'item.0b2a6def88bd',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:paragraph:1',
    priorLocatorDigest: 'f335ec47590e89a72113e487e28b618d229bbc653dc2185ae0ddcbea00c1ca63',
    priorValueDigest: '74d953061b806534ca4dc02932312e536d4b0ea38db1047700fe8a5d218ba6be',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:paragraph:1',
    newLocatorDigest: '26308ae5d2bdfe6bf68a1a436ec0535373ad256b9274121b11ecee8a0e753ec8',
    newValueDigest: '74d953061b806534ca4dc02932312e536d4b0ea38db1047700fe8a5d218ba6be',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M068',
    sourceId: 'fk-charter',
    itemId: 'item.10a0b56e3fcc',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:list-item:1',
    priorLocatorDigest: 'ed239331b2680c72c39a4e083b8eab4194abe25348e099839dc925e0415b4992',
    priorValueDigest: 'fe5d62cc358a4655c69f7e513b0dd0d7d1712fa6aaec5fe58e34e8e81698ba67',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:list-item:1',
    newLocatorDigest: '0151226bfd26f3470750459b2cb58cfcf677ae3ec6ce3497a257e46368f96d6f',
    newValueDigest: 'fe5d62cc358a4655c69f7e513b0dd0d7d1712fa6aaec5fe58e34e8e81698ba67',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M069',
    sourceId: 'fk-charter',
    itemId: 'item.ac1c865d9920',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:list-item:2',
    priorLocatorDigest: '43035552b28c6c8df0f5c5d115209b608fad21df469cf179de25342104658566',
    priorValueDigest: '351e2b161e3e2c4f6c6a9c144ebb4fc4e4aa50f52f9843295eed599961798507',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:list-item:2',
    newLocatorDigest: 'a0b4c7b812a228fce7115ceaa28a44fec372057552abcd95280307ea3e14fe86',
    newValueDigest: '351e2b161e3e2c4f6c6a9c144ebb4fc4e4aa50f52f9843295eed599961798507',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M070',
    sourceId: 'fk-charter',
    itemId: 'item.b94466bd3859',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:list-item:3',
    priorLocatorDigest: 'dc9ffef6aa11d645a0788663c6f678f550e8ba125be50d8695baa10395d9a2bf',
    priorValueDigest: 'b565ff06f6dc896d605f604ddb987cffe59c89da7a635b199ce3e43b516ba23c',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:list-item:3',
    newLocatorDigest: '438f7475b04fcfae07e8d2e50cbe53246ebab48312ef91906c0bf45697e55f77',
    newValueDigest: 'b565ff06f6dc896d605f604ddb987cffe59c89da7a635b199ce3e43b516ba23c',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M071',
    sourceId: 'fk-charter',
    itemId: 'item.98c351f848d6',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:list-item:4',
    priorLocatorDigest: '7a015d6ad90ca67fa487679ce3ce10b9fa49afd5f9e62da788f04a5b19818dca',
    priorValueDigest: 'e20c0aa3f62470cd4b290695f2add5e819320463e12a0e5374137bdcc1609f94',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:list-item:4',
    newLocatorDigest: '82c2c7b5d3716ab111f59df8caf267a85bb51748d42244fbd02c5d8e0879f12e',
    newValueDigest: 'e20c0aa3f62470cd4b290695f2add5e819320463e12a0e5374137bdcc1609f94',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M072',
    sourceId: 'fk-charter',
    itemId: 'item.9044bb776176',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:list-item:5',
    priorLocatorDigest: '115415b2a293f74e838e1599042229e12b6643b4fbde0b3110788ded38a8c46a',
    priorValueDigest: '1156731577661deae7eba9740b11748c885ffa984249dd3a9d98209ec6151aa6',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:list-item:5',
    newLocatorDigest: 'c205ca0a51da89888fedc840eeb99ece3f10fc869ded7cac26bfd92092a664a4',
    newValueDigest: '1156731577661deae7eba9740b11748c885ffa984249dd3a9d98209ec6151aa6',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M073',
    sourceId: 'fk-charter',
    itemId: 'item.d93995e783e9',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:list-item:6',
    priorLocatorDigest: '7248ec423ee7a746e4b9a36a3302a303207dc86f81816ec85370d0901e3ab38a',
    priorValueDigest: 'dbce62df7a3e293b132da86b33a2ba3888c0f4babc513641a375cdb8d4b14470',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:list-item:6',
    newLocatorDigest: 'bf20176562890eda59c57f635fbbb69cfd05e8e01233b9b55330a36336427ade',
    newValueDigest: 'dbce62df7a3e293b132da86b33a2ba3888c0f4babc513641a375cdb8d4b14470',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M074',
    sourceId: 'fk-charter',
    itemId: 'item.5f601badf99a',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:paragraph:2',
    priorLocatorDigest: '430bbca3514f8763211d81c7ff2bd2482fa42aafc72899a1e282deed8289123d',
    priorValueDigest: 'b52e2f1a1b301fc828e83c4c2b103d32041490089ef676b13c9427a77f8afe74',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Common decision envelope:paragraph:2',
    newLocatorDigest: '1b7b30b972ac96c462754e5581b67934247c32d2aeb3f2692fb19a1c5c7ae049',
    newValueDigest: 'b52e2f1a1b301fc828e83c4c2b103d32041490089ef676b13c9427a77f8afe74',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M075',
    sourceId: 'fk-charter',
    itemId: 'item.0ec27db05f7c',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:1',
    priorLocatorDigest: 'c5c824c31b397d3b0f2162074a3c5f8abe5891a5a6c36b98a3f744bdc35803b0',
    priorValueDigest: 'e3d5556f0dc9b3de95f67a3643ff2f5c56e99872d84e564614606f3b18886a1a',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:1',
    newLocatorDigest: 'e46a1db3d7fde8ee8bb74c7c5fd8146a04d9a5cb305638a9d85221e250e9b272',
    newValueDigest: 'e3d5556f0dc9b3de95f67a3643ff2f5c56e99872d84e564614606f3b18886a1a',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M076',
    sourceId: 'fk-charter',
    itemId: 'item.863fbb9202f0',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:1',
    priorLocatorDigest: 'f208d28b49e11d99db2ea382efb581e55a8d3d293f3c78047a421b20801322c4',
    priorValueDigest: '99bee92b57a517970f554029d6085317da9b073b58a4dfd267759bd3f5a4ddc6',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:1',
    newLocatorDigest: '98f5b38263d0d854ac21780eafe7a808f0210784bcdb1a1d2b2175c3e45259e2',
    newValueDigest: '99bee92b57a517970f554029d6085317da9b073b58a4dfd267759bd3f5a4ddc6',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M077',
    sourceId: 'fk-charter',
    itemId: 'item.420807aa841c',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:2',
    priorLocatorDigest: '2b62732e734f0a2d6bbf373314191c40d3b4ab2fb24bd541795f1b9a8c548920',
    priorValueDigest: '8289f20129d656cf60d4350790b798ebdaa2b3d2ea0780707df6800bf8f19857',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:2',
    newLocatorDigest: '2436cd28e320bf521fff7ddbd26c0c564152daa255f0cef7777722dd6049e2dd',
    newValueDigest: '8289f20129d656cf60d4350790b798ebdaa2b3d2ea0780707df6800bf8f19857',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M078',
    sourceId: 'fk-charter',
    itemId: 'item.0b65a783a0be',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:3',
    priorLocatorDigest: '6e2665e973e0760d50b79ebe6cfb7d5f5cdc50e2664e0efd6cb747d1e489fbb0',
    priorValueDigest: '89a502c7601b24576cb31ce35286a7a8dc468b9cb36828f336ff06e47e69d5a9',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:3',
    newLocatorDigest: 'bc9f04032299d8552d6e307a77ef71e113de7cca31bfebdcaa1ec1b1744839c5',
    newValueDigest: '89a502c7601b24576cb31ce35286a7a8dc468b9cb36828f336ff06e47e69d5a9',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M079',
    sourceId: 'fk-charter',
    itemId: 'item.8d204432b7c7',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:4',
    priorLocatorDigest: '53cf898387c0c0cc691987a84b09bb46d92d08dbaa64af3ff028e4ad9ff57cb1',
    priorValueDigest: 'e42fa64ac9a56ddfdb4b229f2aaa53290ec802b0919dbdc7b5b3af731732f5ac',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:4',
    newLocatorDigest: 'ca09e1c76349c754c788c7ff76fd30c0b7e1f8dfdd20bc231702cd9bd751450e',
    newValueDigest: 'e42fa64ac9a56ddfdb4b229f2aaa53290ec802b0919dbdc7b5b3af731732f5ac',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M080',
    sourceId: 'fk-charter',
    itemId: 'item.e7be31fb263e',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:5',
    priorLocatorDigest: '5429c5106adcc041e8d5c6ec5e438ffe5e6e600da5be46afdbb45a6138d7fcb5',
    priorValueDigest: '6642f75fd1724b355c5bf3993f7a5ff016ad0b5bd9143ca800f58c7a692ecf52',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:list-item:5',
    newLocatorDigest: '03b8d3714c94e21e9992ebc1744ada45bab7abba8bed41169c5b786da4887beb',
    newValueDigest: '6642f75fd1724b355c5bf3993f7a5ff016ad0b5bd9143ca800f58c7a692ecf52',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M081',
    sourceId: 'fk-charter',
    itemId: 'item.a554def3d728',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:2',
    priorLocatorDigest: '4000b9adcb7caf665331145300d15025a7da41e87b24790003a48277248a9948',
    priorValueDigest: 'b40ea0ed118b687783ec6d5733c2c2140aaa7beafa0b4a826296262fdbf36d06',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:2',
    newLocatorDigest: '96c6aa49b442a351cd5b2229df0b8b69186f25f565a18b51391a030acf1fd9c6',
    newValueDigest: 'b40ea0ed118b687783ec6d5733c2c2140aaa7beafa0b4a826296262fdbf36d06',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M082',
    sourceId: 'fk-charter',
    itemId: 'item.5149fedd28d9',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:3',
    priorLocatorDigest: 'd2c8636cfff12c70c56649415ce210c8568df3bb48555a798bf82d4b9e7eadc9',
    priorValueDigest: '901d03f2e5da1ec84763eb697826144618074772c0895df624a3c2b905cdb472',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:3',
    newLocatorDigest: 'c2dc64be9e1a04911ec3f9afcbad899d250bce084f9626d0ac9f5e3e336ef7c6',
    newValueDigest: '03ca71750f9da7084cf915a2d7d4bd57ba898b7e831ffe5445fb714c2242d7e3',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M083',
    sourceId: 'fk-charter',
    itemId: 'item.5c1f19dd9911',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition:paragraph:1',
    priorLocatorDigest: '3ab11f26bc2a3d9c8106a4d92bbbe060443cd90d40e7854956f281cf27b9d03e',
    priorValueDigest: '0ea8cda783fed8e481cfcd52c013825f674c6acfc5eb4c5214d1748f55b62b34',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition:paragraph:1',
    newLocatorDigest: 'f27893a2dfe51f5a788342a1309efc9a4c796e5302d608f3687e863ecc6e1f35',
    newValueDigest: '0ea8cda783fed8e481cfcd52c013825f674c6acfc5eb4c5214d1748f55b62b34',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M084',
    sourceId: 'fk-charter',
    itemId: 'item.7983e741c7aa',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 0 — Authority and contracts:table-row:FK-P0 — Canon authority and enforcement registry',
    priorLocatorDigest: '6aeef9d70eaad987f779c787562c7b927e8b68aa7c8c4996506c772a90953cdb',
    priorValueDigest: '5283f8fc8731ef5c6cf6c15340f68a446e00e593708087ebcbec5792d2d531be',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 0  -  Authority and contracts:table-row:FK-P0  -  Canon authority and enforcement registry',
    newLocatorDigest: '3827b2681a19e5274aef4d65d1e8a795adcc4cde31b90cb0bb0bf03aead5efe8',
    newValueDigest: '750edd506af2873068d7c1a366c6ea11e27ef444495bd38d362a0229a634b5fd',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M085',
    sourceId: 'fk-charter',
    itemId: 'item.ba4689f0d16e',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 0 — Authority and contracts:table-row:FK-P1 — Lifecycle, admission, and decision contracts',
    priorLocatorDigest: '1984ed5250694a75b2d3d00a44ac27ec269d23401ad817ab95c7fc9b9d669207',
    priorValueDigest: '1ab44962c3ccfb1756d2bfccf36436b3c1eeb26e02acf7dfce92702714a2769e',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 0  -  Authority and contracts:table-row:FK-P1 — Lifecycle, admission, and decision contracts',
    newLocatorDigest: 'c17da5f3380673f4658efda816c9b78f2117c95461d6bed5a4b16bbe19d95b7a',
    newValueDigest: '1ab44962c3ccfb1756d2bfccf36436b3c1eeb26e02acf7dfce92702714a2769e',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M086',
    sourceId: 'fk-charter',
    itemId: 'item.144bb836f528',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 0 — Authority and contracts:table-row:FK-P2 — Spec-body compiler',
    priorLocatorDigest: 'd326372f914d02245822a591880b7b40d6d71b3bfbabf3a53b642b2c4205205b',
    priorValueDigest: '8020bc28f5bbbfd97c998570fe48e3f05e846c6d12c0ff47fb5fd18549f6d49e',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 0  -  Authority and contracts:table-row:FK-P2  -  Spec-body compiler',
    newLocatorDigest: 'c895a5d65389aae12d7ac3d6454c221db02c64d2a9196347535a903c13b953f9',
    newValueDigest: '038b3e0fd177407dbd2737448ced33e133da858cfa8aa3e2598f6886be4769d1',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M087',
    sourceId: 'fk-charter',
    itemId: 'item.7d74bdcd5bb3',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 0 — Authority and contracts:paragraph:1',
    priorLocatorDigest: '3521310a8faec6be00c3c1e277594d7266ffda4145f3b9eded818e5bc7cf2b87',
    priorValueDigest: '00130e9fe6606ee35ea7945795aae9c9372b27f72cc1ceb5790808fa38498805',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 0  -  Authority and contracts:paragraph:1',
    newLocatorDigest: 'a077d947ddcd73405b7aba1337f4cfec157ad82a9748bcdeac143bdbfc1f2fff',
    newValueDigest: '00130e9fe6606ee35ea7945795aae9c9372b27f72cc1ceb5790808fa38498805',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M088',
    sourceId: 'fk-charter',
    itemId: 'item.e64616afcaf9',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 1 — Pure trust core:table-row:FK-P3 — Pure dispatch decisions',
    priorLocatorDigest: 'd24047821b415199c48e3dc1225c729a78f1ecab920a39539321b85e2fcd7cf5',
    priorValueDigest: '33195dbabc550aeb03e5609e8ddea0d25c53593bd3032410c80940400aca1f8d',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 1  -  Pure trust core:table-row:FK-P3  -  Pure dispatch decisions',
    newLocatorDigest: '0928466fa32b67166bd6528b1b0aba97a074a8dec8a9ee9f379ee12f0e224c57',
    newValueDigest: '1336bad9686433b7469fa2c061d73ddbedd2a86f8ae061674a2089efd77b0334',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M089',
    sourceId: 'fk-charter',
    itemId: 'item.01fc2f9fcdd0',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 1 — Pure trust core:table-row:FK-P4 — Verifier facade',
    priorLocatorDigest: '0d8204d9dfdf236b25f0d384649d5eb5295342428bec79fbe97bab6cc10d4d71',
    priorValueDigest: 'f8e5361b8486ab57ffa83189d4280e20f29c8bd47a053df57ae97c6383cd63ed',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 1  -  Pure trust core:table-row:FK-P4  -  Verifier facade',
    newLocatorDigest: '9e24efc36c15c609928a91628b685a0b49c90c1b5558ce3aa7f7253f4b9e695e',
    newValueDigest: '0df0a6229846c0e9f4f48fe27af71a6ab68944bcc4e82a684c01cf51b50e7561',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M090',
    sourceId: 'fk-charter',
    itemId: 'item.9aee50455247',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 1 — Pure trust core:table-row:FK-P5 — Clean-room trust-core spike',
    priorLocatorDigest: 'a72b978923de6d93f4ab6d6dabb07bfdb11199b07f8483a4ca1cf5a71f033e6c',
    priorValueDigest: 'd378ea835e93a5c907124d08eae0984ff72b2cec88d4124d1d53a7d8aa2c4bdb',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 1  -  Pure trust core:table-row:FK-P5  -  Clean-room trust-core spike',
    newLocatorDigest: 'a96a81e11044613b4b7979ae7036a60214ff73b556eecc0493a4983b4a1212a2',
    newValueDigest: 'd2201185659189e4b53e5dffcb7a0c6ff636a047b3535c39556b8313a80c7075',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M091',
    sourceId: 'fk-charter',
    itemId: 'item.5f823cd304d6',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 1 — Pure trust core:paragraph:1',
    priorLocatorDigest: 'd0e19c26ef9813e0508c86ad0a23cac9b744401d01ab88030aebe00111223f55',
    priorValueDigest: 'a28ac1154138a0df62f72225c5046b5bcd28e760df00b5f5a9429fa53d3823de',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 1  -  Pure trust core:paragraph:1',
    newLocatorDigest: '023aa748aa98f875f4553b8ba8ffd15260df97d89d0108a1a94a661a6d931227',
    newValueDigest: 'a28ac1154138a0df62f72225c5046b5bcd28e760df00b5f5a9429fa53d3823de',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M092',
    sourceId: 'fk-charter',
    itemId: 'item.6427173452f4',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 2 — Stateless read-only MCP and container:table-row:FK-P6 — Read-only MCP server',
    priorLocatorDigest: '414589709d0eb6040e6b5dc880729f8e4f4e5e585a2f5909c3910b1611e6d574',
    priorValueDigest: 'cb4d492f82b04f38656d767c04a7f9512c025a34d0f500bd998ccb45f51a662d',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 2  -  Stateless read-only MCP and container:table-row:FK-P6  -  Read-only MCP server',
    newLocatorDigest: 'c89cde0505d3de6313dfca839e2cd54b66b682ea7641ec5e0a6d2a95fbd7b1c2',
    newValueDigest: 'a442dafa8b8b9a9d1036f75715f61987012369b108964f936031c59633032361',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M093',
    sourceId: 'fk-charter',
    itemId: 'item.d6c307d21998',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 2 — Stateless read-only MCP and container:table-row:FK-P7 — Stateless verifier image and launcher',
    priorLocatorDigest: '5cee70ac935b45261e0cec06143f71872ca409a77672fa529857f1e4e355b9bc',
    priorValueDigest: '4621253de2741978bd8d1928b867e895aec4edd96dc2df2b6d390fe7836e15a6',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 2  -  Stateless read-only MCP and container:table-row:FK-P7  -  Stateless verifier image and launcher',
    newLocatorDigest: 'f28f1acade57cd434ff558cc47f599e80dd5d1e28f32cc9575652aeb057958d4',
    newValueDigest: '196eb524028c01f03e7ed8f19bf901fb47247966296a9a7cf952032688373d72',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M094',
    sourceId: 'fk-charter',
    itemId: 'item.9e512e70b8f5',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 2 — Stateless read-only MCP and container:table-row:FK-P8 — Stateless harness portability proof',
    priorLocatorDigest: '25c226394ca42888b9df1776c313cf925da89060c036fa58167ff1c2288dbbbe',
    priorValueDigest: '8b8f707b6ed3ab80ea56a99bd3c931f2d975e997a0ec01e8aa1e6a33cf83c3c4',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 2  -  Stateless read-only MCP and container:table-row:FK-P8  -  Stateless harness portability proof',
    newLocatorDigest: 'f674ba99ab3a31513f14400e07da6d78d35c09b2b5f2696965ecefedc68beb9d',
    newValueDigest: '832d75ede3dcd4c7fbc1f7fd1c516e31852e302cd44a407dec4fc543147c66c4',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M095',
    sourceId: 'fk-charter',
    itemId: 'item.f1439c7e3a90',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 2 — Stateless read-only MCP and container:paragraph:1',
    priorLocatorDigest: '2f27f48a66a6aa9a71a7b071aca317dcf6f2dc131faf7bfe15a39aaf6846e0c1',
    priorValueDigest: 'bf4e35807f376279713e2d734550b24beab061786a8c0da2fbc019ac78cce8a4',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 2  -  Stateless read-only MCP and container:paragraph:1',
    newLocatorDigest: '9e76077da6333323dcaeb370a2ede65de27a38ae24b83305e2105e8fa0bcc9c8',
    newValueDigest: 'bf4e35807f376279713e2d734550b24beab061786a8c0da2fbc019ac78cce8a4',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M096',
    sourceId: 'fk-charter',
    itemId: 'item.d4059b59ac59',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:table-row:FK-P9 — SQLite storage and migration ABI',
    priorLocatorDigest: 'a16ae4feeccbc9e3a7ed8f7f0a46a08431333fc3caa32a5a67bcb0dfe1a4bdb0',
    priorValueDigest: 'eb1ae1406cf5fdcb5c8c4c48f4098f3ec274b583c8b88bb8b13e03d8dda3009e',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:table-row:FK-P9  -  SQLite storage and migration ABI',
    newLocatorDigest: 'a13b16031d936dd7606478979315655abb27159c71e5c2266fd764fa04bb86cb',
    newValueDigest: 'fec14090549c375766af1398bd9d5d36012003f43611259e5e0ce90b08952dec',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M097',
    sourceId: 'fk-charter',
    itemId: 'item.f4e2ba3acfd6',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:table-row:FK-P10 — Lease and transition engine',
    priorLocatorDigest: 'b8aacf9e6c073d379f5a7e9a3c77a5afe1c4c291978e2d08881403ce010c83c9',
    priorValueDigest: '31a30eba739f02a608b64462842aca13d0698f45f405124a5ee1b1d087b15234',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:table-row:FK-P10  -  Lease and transition engine',
    newLocatorDigest: '7df961b146af774d0c8aa32588f8a0b886aa54b89a56d425245d349cf0b6dc3e',
    newValueDigest: '1fb96e67dd8b1eed67e44b51c2680bf394eaa73334660f9fd4a92ae16a635a0a',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M098',
    sourceId: 'fk-charter',
    itemId: 'item.d92a7c500de4',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:table-row:FK-P11 — Legacy import and projection engine',
    priorLocatorDigest: 'f0081f43b09c94fb05710e1136b761e434e32eb46d9fa1763525430a4549750e',
    priorValueDigest: '9dd776f5e27f1d8dba008823fb78cdee94ed494742838de392fe0aeb1bbbee98',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:table-row:FK-P11  -  Legacy import and projection engine',
    newLocatorDigest: 'fe085652863d20624c5ca2a59a5d10eb0e90fc8895d5fb2a2c158f8cd1b8f7e8',
    newValueDigest: 'f0beddf957408beb98682404a403e97f54193eb4420a30759cc0490675fe89b4',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M099',
    sourceId: 'fk-charter',
    itemId: 'item.dc8cc83e01e7',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:table-row:FK-P12 — Authorization policy engine',
    priorLocatorDigest: '332b39215a84f0878fa3083a233958fd4ca76562c63ca8dbcdd3f13dda3dfb5f',
    priorValueDigest: 'e111f025507b92d4c3e02d0797b10606a70c5b147f575dabbd8c0b4cabb07094',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:table-row:FK-P12  -  Authorization policy engine',
    newLocatorDigest: '5e6431db4e400f8ec2d68d3b70a451822bbcc413e700a36e5e8823269f08e6d3',
    newValueDigest: '48427858926c43f6f5f3514f25c0beed3a82d9172fe0d05f70ab0e13a781383c',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M100',
    sourceId: 'fk-charter',
    itemId: 'item.387fb9c622d2',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:table-row:FK-P13 — Admission-protected control catalog',
    priorLocatorDigest: '596cc454be19f1c59b5f815c667b6f814efcbdc05d679a3eee3f524949063263',
    priorValueDigest: '7afc8524b4772e6552f05ce28d8fb9b16daeb69dedc62ea647eb1632350f015e',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:table-row:FK-P13  -  Admission-protected control catalog',
    newLocatorDigest: 'ba03bc03a4bc52aed873b856fee93f29ffb1c809995171feb7a1bedf9a4a8550',
    newValueDigest: 'de39eca671cd21a00395351a1996f92b00a8f962689d533da9b6bcd9af4003c8',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M101',
    sourceId: 'fk-charter',
    itemId: 'item.9efe42c4e01c',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:table-row:FK-P14 — Stateful image composition and operator lifecycle',
    priorLocatorDigest: '56525769e88d720c791cb8810a1aee92a844b446fbd1a78ffc9c000997ca1f5c',
    priorValueDigest: '852e5be3eebab93bb60b87158b5864e5cc803a03415836aa45ed022b5334abbc',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:table-row:FK-P14  -  Stateful image composition and operator lifecycle',
    newLocatorDigest: 'cdc9ed7d3f321bf52b55ebb7b5575ea9974ad3cd8fcc8c8d154ee4f822b1251d',
    newValueDigest: '0e2c2eef7462c5dfcdf70b2c47599a8220aa44b533a3ae53cbb98b4dc1e4e7f6',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M102',
    sourceId: 'fk-charter',
    itemId: 'item.dde24d4c9b7c',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:table-row:FK-P15 — Stateful restart and admission proof',
    priorLocatorDigest: '0fc4905d8c2051f793591ebbef459fe57c3df9ee262950beb47191df160c2228',
    priorValueDigest: '942c5255be7f7879d27af19caa5538df8a5a7cf9c56e5a744b71f10b5c8e9931',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:table-row:FK-P15  -  Stateful restart and admission proof',
    newLocatorDigest: 'de6ff9408d2ac5a4794f3a4987f444fd241cf966abea11f4da1754531925dba3',
    newValueDigest: 'b909da271c740c98f5a510fea5f6ebe69bb323e1dcda22097c5ae6cf377f0816',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M103',
    sourceId: 'fk-charter',
    itemId: 'item.fec816847e8e',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 3 — Durable operational state:paragraph:1',
    priorLocatorDigest: 'a9b6193fcbfe4b3237b80cc21c8c114fd02a11b25493549a2871e4e8345f547e',
    priorValueDigest: 'a30990b15e42f4c14c3f18862be7b98fb9c94b922fa06e986a2c5e30014688cb',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 3  -  Durable operational state:paragraph:2',
    newLocatorDigest: '399e21fe0974a09365d25ef9cce5b5b264b7f4f3573a5d046a7644ad3c51d91e',
    newValueDigest: 'a30990b15e42f4c14c3f18862be7b98fb9c94b922fa06e986a2c5e30014688cb',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M104',
    sourceId: 'fk-charter',
    itemId: 'item.ce7c8467ddb3',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion:table-row:FK-P16 — Claude lifecycle adapter, shadow mode',
    priorLocatorDigest: '880a34bbaabbf48021a78ec1da8dae37eb20437eb85ed83b7932ca44f25b901f',
    priorValueDigest: '352338c82fbe42850968a0388e12684bc311072c62b955b9f0016236fe45876e',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion:table-row:FK-P16  -  Claude lifecycle adapter, shadow mode',
    newLocatorDigest: '325d62e049671e6e04b2b621d0718e6e1f1d9f6bb552ec0052452983bc039fc7',
    newValueDigest: 'f086deb623f9d7854314d9fb342c27c3b8cae059a552d1a725f13e451fa2f921',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M105',
    sourceId: 'fk-charter',
    itemId: 'item.8e9428543291',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion:table-row:FK-P17 — Bypass and outage harness',
    priorLocatorDigest: 'ab00ca7233aaf23afc25b40d971187863988929a4d3b023bd493cc835357e633',
    priorValueDigest: 'a6150efb0b4cb2a1cc8b8aeff668bc71064f48bda4bc3eec95af96e5e772fe3b',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion:table-row:FK-P17 — Bypass and outage harness',
    newLocatorDigest: '1c32e7baa84036f63c69a426f503d858bd4194ab9b72767b60720b2c1ffdb812',
    newValueDigest: 'a6150efb0b4cb2a1cc8b8aeff668bc71064f48bda4bc3eec95af96e5e772fe3b',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M106',
    sourceId: 'fk-charter',
    itemId: 'item.a087b0ab4c3b',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion:table-row:FK-P18 — CI scope and state-evidence backstops',
    priorLocatorDigest: 'af8246bcc888c9a298ba573a5d33d3fe892e6e8857a2e86deaa5e81c3ebaa413',
    priorValueDigest: '33f7dcfc9f618f8c1f89b9fb203b65fb95b129bc9abcab455045f8e995408b3c',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion:table-row:FK-P18  -  CI scope and state-evidence backstops',
    newLocatorDigest: '7df7cfa957793fd6df6e69adf17f1676c74078cd43b22875811eaf53217678d3',
    newValueDigest: '25cf79b18b87988628fd84472ec89cd42ef9bcf6833e44579f4054524d790985',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M107',
    sourceId: 'fk-charter',
    itemId: 'item.c9611681dcca',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion:table-row:FK-P19 — High-confidence refusal enforcement',
    priorLocatorDigest: '09287df996f97144e28055025c4a38b515c6e6d46abe802cc4c20e114b64c474',
    priorValueDigest: 'a4430bd86fa8257ceb658b786bf3ae326047d195c54c077c81de338cc476e819',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion:table-row:FK-P19  -  High-confidence refusal enforcement',
    newLocatorDigest: '0e91e7f547a25dc69fb1dd9934aa5258c441808fcb3f64be2c209d980da76684',
    newValueDigest: '55693be1d94597d5383b83256dab7ba05823741f6fa8e427ec1b471937da8146',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M108',
    sourceId: 'fk-charter',
    itemId: 'item.1cf05e6b7716',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion:table-row:FK-P20 — Second-host feasibility and host registration',
    priorLocatorDigest: '27c8ee2e2aca00abbe4d52a7aadedf55dd51d6d5c6577803608e083deae89a06',
    priorValueDigest: '36cc56c812f0373c063c4be969e44117971c72502555ad0dd6a0a0a50f7e07cc',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion:table-row:FK-P20  -  Second-host feasibility and host registration',
    newLocatorDigest: 'ef459bc8d04506afd1228b6e92baa521d186669e87d0d81ebce2e1f16a2675ed',
    newValueDigest: '198eb201593464f69033701418fdd8efca3c82d8688aa46ed9464f3f7e8446e8',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M109',
    sourceId: 'fk-charter',
    itemId: 'item.5c24c3ef6591',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion:table-row:FK-P21 — Exit evidence manifest and clean-room proof',
    priorLocatorDigest: 'e0c4666e5ecd734f36f5b65f94dc9f5726a0c9fc990809c9d6eec67e743b0525',
    priorValueDigest: '458410a0a8616c794bf1ea8833171fbad1ca7c413425ad3ae417f49714c27f79',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion:table-row:FK-P21  -  Exit evidence manifest and clean-room proof',
    newLocatorDigest: '3c891353329c5acdabec33b810cb19b2eb71c6a2dc0053ff8e1770d9e5f791c1',
    newValueDigest: 'e1988c356cf64deb63b51a7eedf94e6b11c2b22e58a7ea88c7ba5a29ecc221bb',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M110',
    sourceId: 'fk-charter',
    itemId: 'item.10bcdc2cae49',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 6. Parcel decomposition > ### Wave 4 — Hook adapter and enforcement promotion:paragraph:1',
    priorLocatorDigest: '01315856ecc4b7431f7458fabfe510f7713789e07b6be91b56533334b8e59321',
    priorValueDigest: '5597e9f57af65aae2dbdf71718c152ce8e3123a35fbc740030c80f7626189d22',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 6. Parcel decomposition > ### Wave 4  -  Hook adapter and enforcement promotion:paragraph:2',
    newLocatorDigest: '4514f930a904d420c8cbd21bf125c5bf3ceb09dfa5216b637c9b41f6221e9324',
    newValueDigest: '5597e9f57af65aae2dbdf71718c152ce8e3123a35fbc740030c80f7626189d22',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M111',
    sourceId: 'fk-charter',
    itemId: 'item.a010e2bb3224',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:1',
    priorLocatorDigest: 'f3436f8728664aa0e0ef9e7dac220623592869339fd169cbb88c54d02089591d',
    priorValueDigest: '8cb59a52f37240e5de6aafa5e36666966f305e744cdd52392ead1b4c6f8d760f',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:1',
    newLocatorDigest: '60ed5004bb5f06f5fd226baf965d255542c75b7dd6963c788f3f19e9e17e870e',
    newValueDigest: '8cb59a52f37240e5de6aafa5e36666966f305e744cdd52392ead1b4c6f8d760f',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M112',
    sourceId: 'fk-charter',
    itemId: 'item.2fec5af13994',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:2',
    priorLocatorDigest: 'c06711d0e9db541018b2bf5de1235ed7b73301f71522ccec3d36fe8254dfb081',
    priorValueDigest: '404ae4931d2ef15e4a00c0cbc8a0020d15b725e339f9cc7466e1f34902b56f03',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:2',
    newLocatorDigest: '309849a4ce91e2de7b57d033ea06dea028881072410c8658c1b60eb9bea9a2b9',
    newValueDigest: '404ae4931d2ef15e4a00c0cbc8a0020d15b725e339f9cc7466e1f34902b56f03',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M113',
    sourceId: 'fk-charter',
    itemId: 'item.9b018ade48a1',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:3',
    priorLocatorDigest: '0fc4729d46539ac6d940287a47b74bcaefa57e7606c807b7ff221884ae9a676f',
    priorValueDigest: '741844b3f2afe5cf3cc7a77e7156d8579a7fdede0573123928f53bb83614d07a',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:3',
    newLocatorDigest: 'f07a0097f5dcb8ae9969f4c0d48595555906c14eda4ffdaf7c5f7cb22e1a9028',
    newValueDigest: '741844b3f2afe5cf3cc7a77e7156d8579a7fdede0573123928f53bb83614d07a',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M114',
    sourceId: 'fk-charter',
    itemId: 'item.d651115878fe',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:4',
    priorLocatorDigest: 'cbd2157cd338c397c903c7dac9f8a4b070d0affbea6f2cd5748a4794a76712cd',
    priorValueDigest: '36b8008b75f2b81ace2a28aa5ee501dca4db0eefc33ec9dd119e567aae3b1d32',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:4',
    newLocatorDigest: '23fe8bb87e530cf2b23e9117b4486c0318a6b9102233df96ac6d5d483ec5b0ef',
    newValueDigest: '36b8008b75f2b81ace2a28aa5ee501dca4db0eefc33ec9dd119e567aae3b1d32',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M115',
    sourceId: 'fk-charter',
    itemId: 'item.a963f0e618eb',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:5',
    priorLocatorDigest: '641456a2373f759dd0355467bcfd6560a6b0a358b077b8523bd4bd143ce99a5e',
    priorValueDigest: 'f6098f924610628f970efac4bf28435d939bac95d807f2da37bbe55c3af88e87',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:5',
    newLocatorDigest: 'b895cff88f330993a0e6bb2c522c4106b8317a93da38a472103a6a423cc82a04',
    newValueDigest: 'f6098f924610628f970efac4bf28435d939bac95d807f2da37bbe55c3af88e87',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M116',
    sourceId: 'fk-charter',
    itemId: 'item.bbfe9f24507d',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:6',
    priorLocatorDigest: 'c59ebaed386a186e56caa4f332cec4b104199c6911d47cad43c8ef1b74f93428',
    priorValueDigest: '1b9f76910a8c5dbe0e1585920dda1bc50b4bd12ad5b407ff00c855b0354d43a5',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:6',
    newLocatorDigest: '09057a8f1c1ef6de331b1209653c43d638c2b2e86b292cbe8017d3e5026c8565',
    newValueDigest: '1b9f76910a8c5dbe0e1585920dda1bc50b4bd12ad5b407ff00c855b0354d43a5',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M117',
    sourceId: 'fk-charter',
    itemId: 'item.7d9c7deea8e6',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:7',
    priorLocatorDigest: 'f501e72dee5ac6e9888133141e68ddc5ed90304d4dc0b0fbfa89a83d88a2eb60',
    priorValueDigest: '1b29f04164a01d4dcd9af8e026900573269604a85faab92c4cbe164c92957d6f',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:7',
    newLocatorDigest: 'c47a6acab8faae565f472e2388fc122077d8126ede0fcd94c6cd9ed8335fa2a5',
    newValueDigest: '1b29f04164a01d4dcd9af8e026900573269604a85faab92c4cbe164c92957d6f',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M118',
    sourceId: 'fk-charter',
    itemId: 'item.6035fee8c157',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:8',
    priorLocatorDigest: '3531ad82895c55881b6eb17a66c0474c7c1e6951e92e6aa38495b991d8b15fe2',
    priorValueDigest: '83100df096c76a476d9aaebe96442c8b5c67203de1ea97b6550d51b99d1e3760',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:8',
    newLocatorDigest: '5f4203fe552ded7d8abe103ccc85ff307ed06b00f0bdad9f9bad76de6f257a54',
    newValueDigest: '83100df096c76a476d9aaebe96442c8b5c67203de1ea97b6550d51b99d1e3760',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M119',
    sourceId: 'fk-charter',
    itemId: 'item.7b4cfcbe2393',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:9',
    priorLocatorDigest: '5ddb57c2f0248a900e94bfc81dae46c7c7dde2c6a15e26824a5f565c4c7e763e',
    priorValueDigest: '55c7d41da88ac13efb80fa68863423dbd2226a9ec1e94580a7fe3b0d60ac043f',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:list-item:9',
    newLocatorDigest: 'cd49283d0edf03d0db3b0a1673819b357ba3f5e329be004accba5816b7f87997',
    newValueDigest: '55c7d41da88ac13efb80fa68863423dbd2226a9ec1e94580a7fe3b0d60ac043f',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M120',
    sourceId: 'fk-charter',
    itemId: 'item.99c5c5dbea9e',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:paragraph:1',
    priorLocatorDigest: '4d2f1a6afccb7a41b81dcb7c03744fbdcc0b2aef7ee6d715418b10deef1940ad',
    priorValueDigest: 'e7b6ba0d9363ef16e23311d5466c452075c08cfafb9cc2c48f31cd63493617bc',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 7. Explicitly not doing in this goal:paragraph:1',
    newLocatorDigest: 'e8d5bf139a0064904ee981f7482a207a9afbf1f3eb16f511f95d5930ca989749',
    newValueDigest: 'e7b6ba0d9363ef16e23311d5466c452075c08cfafb9cc2c48f31cd63493617bc',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M121',
    sourceId: 'fk-charter',
    itemId: 'item.7c489fbd50c0',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:paragraph:1',
    priorLocatorDigest: '46ac35eabb7181fdbda6db9174e1365e1883a4ad0ab228560ba3f670aff9cf46',
    priorValueDigest: '0f7d586665809084f332f856b156c10db506f1091b55be0ce3f867d8c3136948',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:paragraph:1',
    newLocatorDigest: '00da3cfa326af514d7596433c25ea2d0c0e4cca8ba5eef1479bd9ed2315c2aed',
    newValueDigest: '0f7d586665809084f332f856b156c10db506f1091b55be0ce3f867d8c3136948',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M122',
    sourceId: 'fk-charter',
    itemId: 'item.ec0f6225e0a6',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:1',
    priorLocatorDigest: '8d1315a0170d7fa0c1e01a4183c04ff4283380d762ba2fbc1a7c687a77183967',
    priorValueDigest: '7ce86c80f7dd7c69a298c5baeb94b6f21fddc3a0c0363a054c4e8b6586554093',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:1',
    newLocatorDigest: '4d15fbbead829905559f5535d56c8f32af2e765458a18fd03921f5b0c14ca845',
    newValueDigest: '7ce86c80f7dd7c69a298c5baeb94b6f21fddc3a0c0363a054c4e8b6586554093',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M123',
    sourceId: 'fk-charter',
    itemId: 'item.0689031c79ed',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:2',
    priorLocatorDigest: '0aa01515d1cedad8f0dd8d76334b463f62b10403624279adf54dd3c2f7948286',
    priorValueDigest: '50e8c7436c4c2d073fdb25370a89281d52903606dda3ab50f950b6c229c3b433',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:2',
    newLocatorDigest: 'a81187cab45e9a5887c0220881469ca9af8b7a98dc3ffeb9b8f8e9d64bc009af',
    newValueDigest: '50e8c7436c4c2d073fdb25370a89281d52903606dda3ab50f950b6c229c3b433',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M124',
    sourceId: 'fk-charter',
    itemId: 'item.349023b0246d',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:3',
    priorLocatorDigest: '6b74bf7a0ffaef06af2404872ce83a4b6c0373efd98972a296d0511cd0c99496',
    priorValueDigest: 'f545337af878ac29b283a3bb5346ece1ebdae6d887a3fec152082e8c39234cf3',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:3',
    newLocatorDigest: '2b030c8e29187ab1437fdba4da2d3b3174f640bfcaf4bbebe6f703904f62cd6e',
    newValueDigest: 'f545337af878ac29b283a3bb5346ece1ebdae6d887a3fec152082e8c39234cf3',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M125',
    sourceId: 'fk-charter',
    itemId: 'item.9308bed876c7',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:4',
    priorLocatorDigest: 'd49b4fe17fb72734c0e00a94c61fa33518c88804dcb500cad6ef204e23b3e5e5',
    priorValueDigest: '8e6e458d5c65db6573568ac994a875872d365cedb443b462ffbf9f5340d8c36a',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:4',
    newLocatorDigest: '99693c6854cbabff615e85b1140630d2e4477249295224ea696fff713b1ab68c',
    newValueDigest: '8e6e458d5c65db6573568ac994a875872d365cedb443b462ffbf9f5340d8c36a',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M126',
    sourceId: 'fk-charter',
    itemId: 'item.612528548655',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:5',
    priorLocatorDigest: '1ef1ceb35ccac96da6e9f5772a7798b0a48ee96931f9dd2cb52d5fce5ae0a25d',
    priorValueDigest: '7eecc3dd8d5952475e98963ec4eaaae0882adf45f3ddd23612ca724bb417926c',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:5',
    newLocatorDigest: '31e3e91d41126cc7abbae594b84ad400b7f4bb66f903251b966ba35e40b0b3ea',
    newValueDigest: '7eecc3dd8d5952475e98963ec4eaaae0882adf45f3ddd23612ca724bb417926c',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M127',
    sourceId: 'fk-charter',
    itemId: 'item.102464b0e25b',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:6',
    priorLocatorDigest: '01dd5379e0eb026d0276402e981a94d14d14c91a1cbaba112c7bbb3493b50c4e',
    priorValueDigest: '24fcc7114c1bbeed58279f840d541a7559ddfe8644b4146f0c36ff7faa426a47',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:6',
    newLocatorDigest: '235302b3711d758a79a3f8f8489ea7314c7e9237a0fbb76bbb74061d1af706c5',
    newValueDigest: '24fcc7114c1bbeed58279f840d541a7559ddfe8644b4146f0c36ff7faa426a47',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M128',
    sourceId: 'fk-charter',
    itemId: 'item.e1b224d7294b',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:7',
    priorLocatorDigest: 'cb0bc64cdd734081298d33ea7bc3fa3b7f84ce64ab1c33ef81c7c6ed82259bff',
    priorValueDigest: 'e7c87c77e021203842f2771da7590215f5281235586113e6db2b690ca61cad01',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:7',
    newLocatorDigest: '93d643b1b7b9b07b75fa29ca7fa58e446ed5671efe5a3918962f2e28002b427b',
    newValueDigest: 'e7c87c77e021203842f2771da7590215f5281235586113e6db2b690ca61cad01',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M129',
    sourceId: 'fk-charter',
    itemId: 'item.501441d1853e',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:8',
    priorLocatorDigest: '68b1323a12d71a3ca17f415b04a18730d5c561cb79206ef89b50232d8d4a001b',
    priorValueDigest: 'a9bf6da8ba7152b2c2d338b184b55753b16feb3fef2a1d1758726f29ea48d31d',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:8',
    newLocatorDigest: '13697d5530927a503756ba679c53459754c2a5104ba97ab9e54e018bbcfd053d',
    newValueDigest: 'a9bf6da8ba7152b2c2d338b184b55753b16feb3fef2a1d1758726f29ea48d31d',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M130',
    sourceId: 'fk-charter',
    itemId: 'item.fc74f0320a1c',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:9',
    priorLocatorDigest: 'aa2c132f66aad40b4f1a4eb8235740f4c64e7237967608832a727fe0e96a2415',
    priorValueDigest: 'd613501a804414d53a49e775c74c12d2d2dca245318fae236fc412e84e2c128d',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:9',
    newLocatorDigest: '49f60f4a016b810ff8bb676af85774eca3d4000b63fa99ff32c54342af4cf448',
    newValueDigest: 'd613501a804414d53a49e775c74c12d2d2dca245318fae236fc412e84e2c128d',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M131',
    sourceId: 'fk-charter',
    itemId: 'item.7eba1cb561c5',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:10',
    priorLocatorDigest: '2fe0f72c491b99de497f4804cbdb4284f25f08bb8e77d32be43098ffa4260d42',
    priorValueDigest: 'd6782ee29d5367be17166ef702c95aadae30c1f213bc9242d3ee0b1e9b03d0e8',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:10',
    newLocatorDigest: '3bca8c1362da036532becc769d59d7dd521ba26a55cc049d2f324f66ff536b7c',
    newValueDigest: 'd6782ee29d5367be17166ef702c95aadae30c1f213bc9242d3ee0b1e9b03d0e8',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M132',
    sourceId: 'fk-charter',
    itemId: 'item.eb56a1ab24d9',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:11',
    priorLocatorDigest: 'fdc33d0685d07ad66aa9a30c0710c8df789181081177465a68e6b39125fbb468',
    priorValueDigest: '4450af70189b8ab274d93e3e87a5775a5ff112c1de4743b8f6b907499136888a',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:11',
    newLocatorDigest: 'b5eeae7acdcce3d2fdf26ad9123513fa67b37548cbdae1757078ddd48989fb41',
    newValueDigest: '4450af70189b8ab274d93e3e87a5775a5ff112c1de4743b8f6b907499136888a',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M133',
    sourceId: 'fk-charter',
    itemId: 'item.8843a7774432',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:12',
    priorLocatorDigest: '089d4cdcfe88e6788c792f5d7046155849ef288da5e11539be680955f4247cce',
    priorValueDigest: '3ee2df9bdf0008d3b8067ab896bd477064d034129323d23135887d6285eaeec3',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:12',
    newLocatorDigest: 'af556d13fe9ee6ef5394146af6e3cd1fb39e015c32d1c3a72aecdff937f41f7c',
    newValueDigest: '3ee2df9bdf0008d3b8067ab896bd477064d034129323d23135887d6285eaeec3',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M134',
    sourceId: 'fk-charter',
    itemId: 'item.10f729956b77',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:13',
    priorLocatorDigest: '5076d5aff65ee213e9dd4c3dd984e4c176cf280764ba58fffabd6b7fc7e1ba55',
    priorValueDigest: 'c2fc7427e24279f867cee70da5b98ac5c0b8f40454ed9409729bb575f76c2bef',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:13',
    newLocatorDigest: '2cbfdaaa0af1bfa1b47181fd880c222a58e8f39cd51fc0f50a2945aaa09487ca',
    newValueDigest: 'c2fc7427e24279f867cee70da5b98ac5c0b8f40454ed9409729bb575f76c2bef',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M135',
    sourceId: 'fk-charter',
    itemId: 'item.ff0f88a958e0',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 8. Integration scenarios:list-item:14',
    priorLocatorDigest: '00e847cc369683866f6184df0d1bf77bd07fb81b2300999de85705eaff3a6233',
    priorValueDigest: '00d00f41d915f0d64eec83652adbac10b29ccf70d175562fa3aa5475f853b451',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 8. Integration scenarios:list-item:14',
    newLocatorDigest: '703f979bf5807ed04bdb6f2d8398a57cbb932137ce4db08473a4d2aa536a2ea1',
    newValueDigest: '00d00f41d915f0d64eec83652adbac10b29ccf70d175562fa3aa5475f853b451',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M136',
    sourceId: 'fk-charter',
    itemId: 'item.6116f0dd5f60',
    priorKind: 'line-excerpt',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:paragraph:1',
    priorLocatorDigest: 'cf25e784bcb77696572df459012cfc4b32e90d6fbc9f5860c5bcf7e8683f90f8',
    priorValueDigest: 'a8c2333624f2620261b683e01088112dc32726d2dc78fbfa82c67ad1fa6eec0d',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:paragraph:1',
    newLocatorDigest: 'c45553445f43b09de69f51fdb9bbb3f77d47589484c3e911bad6f51bf59436a1',
    newValueDigest: 'cc0ed5fa0f796467b400c30e1e114de0f6bfabe33446681e6bfe5a814d7116a9',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M137',
    sourceId: 'fk-charter',
    itemId: 'item.e9ec57edc0a2',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:1',
    priorLocatorDigest: '161affa72f9c5423e69239e51f78617cc466d19a712d9171ec121f4a2f8dc32d',
    priorValueDigest: '70b8cb7a1358159c74948d5512a376906be93c47f3acc4c4a96685f8a5af26ae',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:1',
    newLocatorDigest: '5ead211f730fb625607cafd9887fef97da058db31c6790a410229179214165ca',
    newValueDigest: '70b8cb7a1358159c74948d5512a376906be93c47f3acc4c4a96685f8a5af26ae',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M138',
    sourceId: 'fk-charter',
    itemId: 'item.eddc1a2874a3',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:2',
    priorLocatorDigest: 'fa1a5de3e6c6b886d956ebd2b346fb00edd1cc7121f8f9cf10ae122e5dc8dd22',
    priorValueDigest: 'a0229fca74998509557bf4f5a4acaa65f941b9ca314262508bbbba88906511c8',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:2',
    newLocatorDigest: '7540debed0e9b82954b9046c93321be8059b4119c131cd4e78247c71b7a492bb',
    newValueDigest: 'a0229fca74998509557bf4f5a4acaa65f941b9ca314262508bbbba88906511c8',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M139',
    sourceId: 'fk-charter',
    itemId: 'item.248b8ef73429',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:3',
    priorLocatorDigest: '899bd3f6af7aa14c8f6fb3e4fc88ee04f63f6ee0d39d00f95cee9d4a0731a98f',
    priorValueDigest: '8b54f64081757e7a14b516a1b06f3ff242d3189bb0afb879f0f3f3f0d45c3344',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:3',
    newLocatorDigest: 'd8ca251b3db301a5fdb0f806ca23bb065909282570a7fdce04f9c9e671db6ba0',
    newValueDigest: '8b54f64081757e7a14b516a1b06f3ff242d3189bb0afb879f0f3f3f0d45c3344',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M140',
    sourceId: 'fk-charter',
    itemId: 'item.7854414d4093',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:4',
    priorLocatorDigest: 'ab73cfa39bdf2b562db1d371fa74c9b7487f1d1deb7c1134d2dbf7368fd97850',
    priorValueDigest: 'edbeb67a6d54e7d8b6a2e87d6e806ba9a7ec5489d2717c119764860c1e2536bf',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:4',
    newLocatorDigest: '1bf39c5496ef80f9f229796f5737a334f646a18048290637dc55d349b9e04dca',
    newValueDigest: 'edbeb67a6d54e7d8b6a2e87d6e806ba9a7ec5489d2717c119764860c1e2536bf',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M141',
    sourceId: 'fk-charter',
    itemId: 'item.a0d98411d75e',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:5',
    priorLocatorDigest: '95e1c054529b1eda70b2a5c582ec7d1f5cc85fe3f39700f6a03c2fa1702c5482',
    priorValueDigest: '18ed2daf1e1cb32a8dacfe70970ea19a9ba3e00ff7421a35d6dbd5980f44719c',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:5',
    newLocatorDigest: '937849d26119d5b522515862e8c975e4fb60e67325828207a4ebe2d1d225420f',
    newValueDigest: '18ed2daf1e1cb32a8dacfe70970ea19a9ba3e00ff7421a35d6dbd5980f44719c',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M142',
    sourceId: 'fk-charter',
    itemId: 'item.fec95f508418',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:6',
    priorLocatorDigest: '80bdfa57f77d651ced2e77b911399a8817c262263c61cc661a64da57ed9d36f7',
    priorValueDigest: 'd6dcca2f24ef5e93b7dd1455d49a7d191961133cfe59761495a34aa29ef6a0b5',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:6',
    newLocatorDigest: '29baf052a77b5ef27d971e66ec8d61104014f13db218be2fbc61146f15504b35',
    newValueDigest: 'd6dcca2f24ef5e93b7dd1455d49a7d191961133cfe59761495a34aa29ef6a0b5',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M143',
    sourceId: 'fk-charter',
    itemId: 'item.4910b2a0a7a3',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:7',
    priorLocatorDigest: '82334efc3089b3b67c31b292770c0776663e23db4846883245f0bdfb5279a535',
    priorValueDigest: '067440bd9b4b15f23bac951d2b6f6d2267f9f737aa1daf9cdf9b3c6051e27bf7',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:7',
    newLocatorDigest: 'a60cd2836f1e4fce3c75b5c3b855b77c9cb27b31c703ca96008e43c49d719c0c',
    newValueDigest: '067440bd9b4b15f23bac951d2b6f6d2267f9f737aa1daf9cdf9b3c6051e27bf7',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M144',
    sourceId: 'fk-charter',
    itemId: 'item.4d6ea442cfff',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:8',
    priorLocatorDigest: 'ea6c63d80acd7c7385a2b1a66bccd6c4d4fb532fa1c4cfce2ff02b655bded867',
    priorValueDigest: '55b9809c44cb222beeb8313c6109fff79f57262fa97222616075426718460f48',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:8',
    newLocatorDigest: '4028d59953e90b5b0b0c9da4e2c4d9aab048d0072bcc6381e2af05e4ceb04ab4',
    newValueDigest: '55b9809c44cb222beeb8313c6109fff79f57262fa97222616075426718460f48',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M145',
    sourceId: 'fk-charter',
    itemId: 'item.49288a83830e',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 9. Goal exit criterion:list-item:9',
    priorLocatorDigest: '31a76e767c83e7046bcb467d9124c5c984298ff68650aec629f7c6a28108ae26',
    priorValueDigest: '23b19f8351758ce25c26c5556881b061886d3efa6a388e7b8dfa6d6caa4a5add',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:list-item:9',
    newLocatorDigest: 'dbe08362bf714d64d240d6b18c4ab3f388d20994288aaaab8e18a057dd20517e',
    newValueDigest: '23b19f8351758ce25c26c5556881b061886d3efa6a388e7b8dfa6d6caa4a5add',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M146',
    sourceId: 'fk-charter',
    itemId: 'item.8cf027fc811e',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 10. Human gates and standing authorizations requested > ### Gate 1 — charter ratification:paragraph:1',
    priorLocatorDigest: 'c237a3a71334eb697c6a2e771e36985246be873f98f4e21983e3b1c100b95f71',
    priorValueDigest: '6e8532b302fdd1709ef286bf2ecd212a952fb49a65fbd755052bc081c080c0d1',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 10. Human gates and standing authorizations requested > ### Gate 1  -  charter ratification:paragraph:1',
    newLocatorDigest: 'ac519852f364e25075cb9e07e1bd094532fd4aad2359f9f56f6b68e0202210e9',
    newValueDigest: '6e8532b302fdd1709ef286bf2ecd212a952fb49a65fbd755052bc081c080c0d1',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M147',
    sourceId: 'fk-charter',
    itemId: 'item.15a44cf50bc6',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 10. Human gates and standing authorizations requested > ### Gate 2 — parcel dispatch:paragraph:1',
    priorLocatorDigest: 'f603abfe0a64843297b4903e5f6fcdb1348e86566b896ae687bb360e11d0d735',
    priorValueDigest: '7b1455e4deea2f7a7227ec6bc8a68ebfcf1afe7b0ff3c7614c048ddeaf1e67e0',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 10. Human gates and standing authorizations requested > ### Gate 2  -  parcel dispatch:paragraph:1',
    newLocatorDigest: '87501e77733e2a508bbb03e77c39e8a9d2ee23587285b439585b7b78b68aee04',
    newValueDigest: '7b1455e4deea2f7a7227ec6bc8a68ebfcf1afe7b0ff3c7614c048ddeaf1e67e0',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M148',
    sourceId: 'fk-charter',
    itemId: 'item.c74628d41600',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 10. Human gates and standing authorizations requested > ### Gate 3 — merge:paragraph:1',
    priorLocatorDigest: '50da0abf251438acc30c4bb719317e8f8bda7842ac9ad875e3a8ae7025180592',
    priorValueDigest: '6e4dd01598eff49eb6515709afbd3d72bc35c8c47858ecf957e0df5e2da7d923',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 10. Human gates and standing authorizations requested > ### Gate 3  -  merge:paragraph:1',
    newLocatorDigest: '7749a20c0e0587e6686cbc5b3bd60d78c300550025841b36ee95a19ac15e20a8',
    newValueDigest: 'd29357ac94ab01858cd5e0cd2c3be42677bdbaeda445389b880440dc6a89664e',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M149',
    sourceId: 'fk-charter',
    itemId: 'item.225873bff4ee',
    priorKind: 'line-excerpt',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:paragraph:1',
    priorLocatorDigest: '69555b81fc4c769745ebf99b533f010df48485ec4f5861d74c49d30c31828ceb',
    priorValueDigest: '1ef4a8adf227cf71f28e11109394d28eb1ae14bf3a7876a43f6dbb567a946a0e',
    newKind: 'line-excerpt',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:paragraph:1',
    newLocatorDigest: '8eb4d4cc0c869d061390b4d6af90e405c6e9126c1342c9531e27798a0fe9fa5e',
    newValueDigest: '1ef4a8adf227cf71f28e11109394d28eb1ae14bf3a7876a43f6dbb567a946a0e',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M150',
    sourceId: 'fk-charter',
    itemId: 'item.d9921c51d7ea',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:1',
    priorLocatorDigest: 'fe817cd24fa66ffe5cd097d27de3aeff99d4fe5fe92f8d946b4058cc627730ad',
    priorValueDigest: '04907af800b46d732003d2d947ce023d5dd98323bc8ea21d6c45c7b0f9ef02c9',
    newKind: 'numbered-item',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:1',
    newLocatorDigest: '89f92fbd73089ad65bd1d5fb33baad74672b661d9cb2ba85e38ca3da67aae251',
    newValueDigest: '04907af800b46d732003d2d947ce023d5dd98323bc8ea21d6c45c7b0f9ef02c9',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M151',
    sourceId: 'fk-charter',
    itemId: 'item.41b4b3dccd81',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:2',
    priorLocatorDigest: '1d5007c56b23bf77e23d4d037cda9ec8fbf41a880b8fdd1cd296853f617b9e37',
    priorValueDigest: 'e64ace8cbdc0dad31cb91fc3e626a882eaacea628970bfdbadc895a0049bf3ab',
    newKind: 'numbered-item',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:2',
    newLocatorDigest: '1762b26205dac5c4f702d7182a034d4412e0d31a2f926daa331b3a9bd77e31d4',
    newValueDigest: 'e64ace8cbdc0dad31cb91fc3e626a882eaacea628970bfdbadc895a0049bf3ab',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M152',
    sourceId: 'fk-charter',
    itemId: 'item.0afd841f51f8',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:3',
    priorLocatorDigest: '0c30891d82866243ad468e48cd9153182a8b8d8bc2230cac02d2bc0eb5cd4ed4',
    priorValueDigest: 'f06e8c435a78ec7e2903dff246b0afce8417917da0671d6301c4a93e99615555',
    newKind: 'numbered-item',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:3',
    newLocatorDigest: '757362fdc07f2aafcc31f6a0d3e9df5771ed34712b36f9eb1f43b5e1a60c76d9',
    newValueDigest: 'f06e8c435a78ec7e2903dff246b0afce8417917da0671d6301c4a93e99615555',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M153',
    sourceId: 'fk-charter',
    itemId: 'item.c80d986d4cfe',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:4',
    priorLocatorDigest: '0e4df87905aba3c1754a47866a95bbf9faf98f87ad32edae2172b024f703543f',
    priorValueDigest: '220c9bbe97ed95f36ef6fcbff98b14f79599c332aa99bec66129e1ff3343d93a',
    newKind: 'numbered-item',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:4',
    newLocatorDigest: '6cd7d87e7625c79f7f5969eb870ea7c79c00729aa66df2193cfbd557e95e7d70',
    newValueDigest: '220c9bbe97ed95f36ef6fcbff98b14f79599c332aa99bec66129e1ff3343d93a',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M154',
    sourceId: 'fk-charter',
    itemId: 'item.ab729d219bbb',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:5',
    priorLocatorDigest: '7d40790df61a6cf3c237790fcd93432c892678047e7c3601bbea8972c3b604b0',
    priorValueDigest: '9b50b9c3a95d718f4a876c1e5cfb2f0cc5402715325bd30a16f76415a1603c91',
    newKind: 'numbered-item',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:5',
    newLocatorDigest: 'fdd94a23fce521d99192226617dbd8b99da3407d7892d3843703b8c14650759d',
    newValueDigest: '9b50b9c3a95d718f4a876c1e5cfb2f0cc5402715325bd30a16f76415a1603c91',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M155',
    sourceId: 'fk-charter',
    itemId: 'item.1c42ce2f7e94',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:6',
    priorLocatorDigest: 'a70c28e6c91eaf8678eb27cb0947ceef4137cff8936b6593f5f2e0ec333eaef1',
    priorValueDigest: '0b10cb77206cadc329b3d0cdec97e92350bf5a60377d276e4f0991d0c5e94e49',
    newKind: 'numbered-item',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:6',
    newLocatorDigest: '6f1e778bfbc07cacfc889b506746c774aa490a5390520679209c7714ff4d1c55',
    newValueDigest: '0b10cb77206cadc329b3d0cdec97e92350bf5a60377d276e4f0991d0c5e94e49',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M156',
    sourceId: 'fk-charter',
    itemId: 'item.28ec67f3ddb4',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:7',
    priorLocatorDigest: '8dacfa934f9eea713d507add53a3cf4110fa1c828811bf83e0bd6543e929ad88',
    priorValueDigest: 'bee6d846d01c3ea8ffbf203d5eac8ec832448557b54e4110ebe212456c2e343d',
    newKind: 'numbered-item',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:7',
    newLocatorDigest: '7eb4d12ad1382872ff3df43f9de4fef02ffe86c802445cbb9d751216d2e50d83',
    newValueDigest: 'bee6d846d01c3ea8ffbf203d5eac8ec832448557b54e4110ebe212456c2e343d',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M157',
    sourceId: 'fk-charter',
    itemId: 'item.5138fd735a8a',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:8',
    priorLocatorDigest: '7a2b66cbbda89164cfe8f53086f45c92779b3a7b5d689c19e4fc09500221cfac',
    priorValueDigest: '59e4f36854d7e4edd25f9dbadcd70c8195a81150f26a450bbd2ef4544af73b03',
    newKind: 'numbered-item',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:8',
    newLocatorDigest: '6a28f4bf93d7dcdc0ae859cb4556be87d16a6038fdfeec72c2b5f70e1e2f7755',
    newValueDigest: '59e4f36854d7e4edd25f9dbadcd70c8195a81150f26a450bbd2ef4544af73b03',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M158',
    sourceId: 'fk-charter',
    itemId: 'item.6aae5fe2d602',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:9',
    priorLocatorDigest: 'b0e78ab663f835de6f71b2eb63809734f0a33b775780f4d0a3e401e3bbad4220',
    priorValueDigest: 'ddfa5e9f869493c2b3906d92f38ab0cb5072720fcf417160ffd937977766aa09',
    newKind: 'numbered-item',
    newAnchor: 'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:9',
    newLocatorDigest: '2703f10c6260b6f6284bac2ead02d72fe7960a04286024bea43190e40232f640',
    newValueDigest: 'ddfa5e9f869493c2b3906d92f38ab0cb5072720fcf417160ffd937977766aa09',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M159',
    sourceId: 'fk-charter',
    itemId: 'item.fc4a386b94fe',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:10',
    priorLocatorDigest: 'b8f32e5d9de18bd73f95e8dc00f9cda4102066a5fb12cd60ec0c900fcaa0a434',
    priorValueDigest: '4a5529e47a7a0ae1cfc5eca3f9f4d93c9e1d88586e5470cd6fe097314a58970a',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:10',
    newLocatorDigest: '73216237488679b1fa9200c1b1dcfb81b7aa04d022f9ff8ccf82489ad3a4fff8',
    newValueDigest: '4a5529e47a7a0ae1cfc5eca3f9f4d93c9e1d88586e5470cd6fe097314a58970a',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M160',
    sourceId: 'fk-charter',
    itemId: 'item.42e05d00c67a',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:11',
    priorLocatorDigest: 'be773cb85ab5eee9f5e8c93629e14073c466d83d29da455bd8d634f210c6dab7',
    priorValueDigest: '4e91722aadd28fb0924942fa6ff9bcd4951169dd5700cf28c48427e4359d8825',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:11',
    newLocatorDigest: '335013422c87d64fbc55fb40e0c07474456bea3589a4c8368a5e112710f66771',
    newValueDigest: '4e91722aadd28fb0924942fa6ff9bcd4951169dd5700cf28c48427e4359d8825',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M161',
    sourceId: 'fk-charter',
    itemId: 'item.07490af17320',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:12',
    priorLocatorDigest: 'ab9095eddcf3aea6de5d54cc753cf3586bbd57a87c9dfcea1be31229493f9305',
    priorValueDigest: '56b5836773886c8eaf6fb588cc5eece5d46db7d4c98fd4d766bfbd33503c4147',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:12',
    newLocatorDigest: 'c25e61e900471ab2ff05ef44e229a278776398927cfa4240a2d3bab853775d95',
    newValueDigest: '56b5836773886c8eaf6fb588cc5eece5d46db7d4c98fd4d766bfbd33503c4147',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M162',
    sourceId: 'fk-charter',
    itemId: 'item.b5bad0475a3e',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:13',
    priorLocatorDigest: '5ea675c3568ab97b5b129528069242cbe5dc51d26e4e28285d06e082b9f7703c',
    priorValueDigest: '83a2c78119775e6dac151bcc3607a36bb18c4f0cd7271af2683b2c2bc870cbaa',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:13',
    newLocatorDigest: 'b9aee3e09fe33b3741321344ac3e88bcedb24831cd471f96691a6292d82855ce',
    newValueDigest: '83a2c78119775e6dac151bcc3607a36bb18c4f0cd7271af2683b2c2bc870cbaa',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M163',
    sourceId: 'fk-charter',
    itemId: 'item.e86843a842bc',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:14',
    priorLocatorDigest: 'b9f7f48efd1c95523797c31e736a4ab28fe8584bc92a2d12c69db20259a742ff',
    priorValueDigest: '8c81655503620f0dc467d45df9172c38dd7c037cd40b20d3f919e9c37864133a',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:14',
    newLocatorDigest: '5ae19ce0d033abec33e07437ecb8512097fcde2dc5ccb881919f30c6f039d619',
    newValueDigest: '8c81655503620f0dc467d45df9172c38dd7c037cd40b20d3f919e9c37864133a',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M164',
    sourceId: 'fk-charter',
    itemId: 'item.98b291e68000',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:15',
    priorLocatorDigest: '62219e4e4e43e50cfa68f676215772c191c41ffb3fea46f41586976ed8e2c5d1',
    priorValueDigest: '49d2ad080e0bc780411cfe832e1e9a05fcd92184743b392fcbd364fada388955',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:15',
    newLocatorDigest: 'd81213c3d8cd29398e8c2a86a63fb01bb660dd035c577a4e4ea07c9216bfbe7f',
    newValueDigest: '49d2ad080e0bc780411cfe832e1e9a05fcd92184743b392fcbd364fada388955',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M165',
    sourceId: 'fk-charter',
    itemId: 'item.2cbbc7ae0192',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:16',
    priorLocatorDigest: 'd1aafc7b541836629daf4f730324edd7e2de10a35933b3807199b8a428cf5fc0',
    priorValueDigest: '856dfda72e56d5be160a843e71e72bc9c5b5843288861effba3cc64365bc0723',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:16',
    newLocatorDigest: '6acb08147b4cdb0e1ca47b83e067e434fa359f5feebc3770e4acea722a139204',
    newValueDigest: '856dfda72e56d5be160a843e71e72bc9c5b5843288861effba3cc64365bc0723',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M166',
    sourceId: 'fk-charter',
    itemId: 'item.76049b5d2003',
    priorKind: 'numbered-item',
    priorAnchor: 'md-block:# Goal Charter — Foreman Kernel > ## 11. Stop conditions:list-item:17',
    priorLocatorDigest: '3eec36317fbf76ef973f5306a6cef1646db4d62c4d18955a7f64166edad19bcd',
    priorValueDigest: '0447666a5a2373f22ff85ef23055539409da77eca56494e72327c1e41c2f8b89',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 11. Stop conditions:list-item:17',
    newLocatorDigest: '0453081f54d55a12d78e0457092d8e0de511799dd7bc72869dfd838a1bb030db',
    newValueDigest: '0447666a5a2373f22ff85ef23055539409da77eca56494e72327c1e41c2f8b89',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M167',
    sourceId: 'fk-charter',
    itemId: 'item.bdb66c5bc7f1',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:1',
    priorLocatorDigest: '646d89144dc17f87eeee5bfdc4d11ccebbc12e4862a00ad9517f5e106875f9e5',
    priorValueDigest: 'adbbd382f70ffb8348405dbf7251548f5a2c68580f21e480ceb783f61344925e',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints:list-item:1',
    newLocatorDigest: '8f1c08224be4ba9e20e39d4c3c4e2b81cee2d286e3b1e395f5c145c8ceb01b48',
    newValueDigest: 'adbbd382f70ffb8348405dbf7251548f5a2c68580f21e480ceb783f61344925e',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M168',
    sourceId: 'fk-charter',
    itemId: 'item.fdf4aae4f444',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:2',
    priorLocatorDigest: '9cbc0bf739977782ff931f24d5208664418c46e20b013ca6d5c7a21c8f077cdb',
    priorValueDigest: '5f9daac6effc74f2c1e82a15647ae0df1ad1848547944003e49845a2463b07db',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints:list-item:2',
    newLocatorDigest: '16fa2521d6e744f395e08037dd0dee27396a20fc8bdb4559f9d66405251e6ceb',
    newValueDigest: '5f9daac6effc74f2c1e82a15647ae0df1ad1848547944003e49845a2463b07db',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M169',
    sourceId: 'fk-charter',
    itemId: 'item.a7fd9c343f75',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:3',
    priorLocatorDigest: '3899451f21532d24fc988f8e4924005876b4be50937ef648d2574202bcc4bab2',
    priorValueDigest: '747904de0290adc1383901dd06bf1951f9bc60d26d588e085fd954382f10537e',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints:list-item:3',
    newLocatorDigest: '1e7702cbf61463a28eba06d27f6559a3c7f98a1c1b123931ace1ebdf25979e77',
    newValueDigest: '747904de0290adc1383901dd06bf1951f9bc60d26d588e085fd954382f10537e',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M170',
    sourceId: 'fk-charter',
    itemId: 'item.e39357b6cda0',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:4',
    priorLocatorDigest: '36ae864229bce494d4d71b369e6af66e0bc45370a679a10c9df4add007ebe970',
    priorValueDigest: 'e73991215b536ed86c20949df4775d60c322b6e5470d5674134e17721fb3fd4b',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints:list-item:4',
    newLocatorDigest: '05cefa1f7ef48766da7a20685ade61869fb171fbe37eceba8e97e0a18becc7f2',
    newValueDigest: 'e73991215b536ed86c20949df4775d60c322b6e5470d5674134e17721fb3fd4b',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M171',
    sourceId: 'fk-charter',
    itemId: 'item.f534e19ce193',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:5',
    priorLocatorDigest: '6ac4c74038fb10819caf7793fcbaf4990c763ee3287e68d3b72ed6b28215560b',
    priorValueDigest: 'd408f10a5988f2965c96bd728fdea4949af5f0ca494929ea3c3143f7cfea9b22',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints:list-item:5',
    newLocatorDigest: '5ec4acda96a093f110efce59dd2eb64b55ce777ff7b3ebacae35b64db8608597',
    newValueDigest: 'd408f10a5988f2965c96bd728fdea4949af5f0ca494929ea3c3143f7cfea9b22',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M172',
    sourceId: 'fk-charter',
    itemId: 'item.5163b20d9238',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:6',
    priorLocatorDigest: 'c7474aab64a41ddbc81c7c2b96ba3960084de6b5ce4bb9c8532e702c5eb7ff13',
    priorValueDigest: 'c9a8dc263be32332290b64ea83d0b32350a884112827b10969538a4a3ca3102b',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints:list-item:6',
    newLocatorDigest: '66a91edaf642ee5d0f3d04190d6619b562ab1155728c45419deebbe70c34662f',
    newValueDigest: 'c9a8dc263be32332290b64ea83d0b32350a884112827b10969538a4a3ca3102b',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M173',
    sourceId: 'fk-charter',
    itemId: 'item.fd16f98ac72d',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:7',
    priorLocatorDigest: 'dbe776286a5206a3584dfc8a32f19ad15cb46e5f337ae7ba95c2015b8f2e1ac3',
    priorValueDigest: 'a60d1565127559450a895fe483f606579f23b1793553d0389279bf14f8a36bc4',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 12. Known serialization points and repo constraints:list-item:7',
    newLocatorDigest: '8a1eaa5376dad5bad7b1d2bff67a79f95a8174398059310dfc27610de39e15fd',
    newValueDigest: 'a60d1565127559450a895fe483f606579f23b1793553d0389279bf14f8a36bc4',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M174',
    sourceId: 'fk-charter',
    itemId: 'item.f010166230e6',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:paragraph:1',
    priorLocatorDigest: 'dfcd714b23be95a316b126eca2ae12cd525b40626c37c607e71f07ccec59a3d0',
    priorValueDigest: '1c87f4263ede60d4d60be0b50b652afafd12503a93ade30c9cb043fc4b7e0527',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:paragraph:1',
    newLocatorDigest: 'faf65286434f4201c9b88ce983083ae7c6af36482c1b192c88a4f3327d529967',
    newValueDigest: '1c87f4263ede60d4d60be0b50b652afafd12503a93ade30c9cb043fc4b7e0527',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M175',
    sourceId: 'fk-charter',
    itemId: 'item.1c4b84a3f6e1',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:1',
    priorLocatorDigest: '91ae5db41b7a17be43c93e7c7c03576940ca684dcdc6aa484b2243ce3eb098ba',
    priorValueDigest: 'e39c21a716ac44db79d45f2d7b9ad9764ec7a6f04eec6e385b3f43c0a7994d03',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:1',
    newLocatorDigest: '84ecd72fcd7718c7bfb5838429ae3e53566dfb22715829ec2a52f47a844aece6',
    newValueDigest: 'e39c21a716ac44db79d45f2d7b9ad9764ec7a6f04eec6e385b3f43c0a7994d03',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M176',
    sourceId: 'fk-charter',
    itemId: 'item.eead58a85428',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:2',
    priorLocatorDigest: 'fec046e130e9c91278f0c35e6ac5c3381d23746b34e940604ed94536d4c2ffe6',
    priorValueDigest: 'a490f7af303a0c4e4feab0f1ac6dc3c28f28fbb0fab7e10d433cf39e49a35de5',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:2',
    newLocatorDigest: '1e92413e50acc34f1168056e4ddeb8bf228983a6dbda3abdec80ffdd398e34aa',
    newValueDigest: 'a490f7af303a0c4e4feab0f1ac6dc3c28f28fbb0fab7e10d433cf39e49a35de5',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M177',
    sourceId: 'fk-charter',
    itemId: 'item.a4bd5ca1c933',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:3',
    priorLocatorDigest: 'cb81fa4c9fce4c7b1f227fdf11a3148f9e5d7ea5269a3d0d9755dd1aacb25060',
    priorValueDigest: '062a5216e4541786bf0bd0e5fc65160b94c0e99a05bcfcf0935854eda9a2dcd2',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:3',
    newLocatorDigest: 'ffae0604d2a10c443e5d0c4816c50efceab49b92c2e782f44381ad005972c484',
    newValueDigest: '062a5216e4541786bf0bd0e5fc65160b94c0e99a05bcfcf0935854eda9a2dcd2',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M178',
    sourceId: 'fk-charter',
    itemId: 'item.6abf5135d0ef',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:4',
    priorLocatorDigest: '65374a14799aab86383ede73e0f10d358ae282e74755f2e629d936e0148921d2',
    priorValueDigest: 'f04f0c0610ab2430996bb1417eb621765d1867a13292f8b9c43e05224c3d35da',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:4',
    newLocatorDigest: '69581887e31092f781f4d04e06fc4ac28a3475ab9f3c4b885b1f36f4ae108619',
    newValueDigest: 'f04f0c0610ab2430996bb1417eb621765d1867a13292f8b9c43e05224c3d35da',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M179',
    sourceId: 'fk-charter',
    itemId: 'item.7eea83f03c07',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:5',
    priorLocatorDigest: '61c0108a56b1f6d889c456bc07d0812a8dcbdbb80e1629b7f8cf5be9e6164839',
    priorValueDigest: '164a4984a65922c73bd439878a9e3e8d323ad5678b8dd0abf8ecb458ad7166ad',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:5',
    newLocatorDigest: '958626cb2b41a64ee4a05da43e1aa10e169caf15a10b47d23b2f71942ee19d1d',
    newValueDigest: '164a4984a65922c73bd439878a9e3e8d323ad5678b8dd0abf8ecb458ad7166ad',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M180',
    sourceId: 'fk-charter',
    itemId: 'item.a117b9a306bd',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:6',
    priorLocatorDigest: '3f4940039124a1f88fee61a427986d2de2b64d717d7bc1773dd1dd85cb7eef6a',
    priorValueDigest: '77efe32358aa72299ef1ec5ad737115cbd8ab9eb029c9358160eb7f43f4fd719',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:6',
    newLocatorDigest: '456d2d6cca4bf0f340c7615f5db45e726ab08f7c7fa45ca3c302cc77f06ef9be',
    newValueDigest: '77efe32358aa72299ef1ec5ad737115cbd8ab9eb029c9358160eb7f43f4fd719',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M181',
    sourceId: 'fk-charter',
    itemId: 'item.cfd3dbab5179',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:7',
    priorLocatorDigest: '156fa5eb11c1c845beab8730f34fcec53a8e0fbb3397853140b87dc009fe4b14',
    priorValueDigest: '507e7d606381ce24e41234b5c66b27df0d8a234fbcb064d8967f0f9a9fef136b',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:7',
    newLocatorDigest: '67525b2ce0734ed5ce6a95f53ef7f5c3be44a9a82fe6579d159b26ec0aac633f',
    newValueDigest: '507e7d606381ce24e41234b5c66b27df0d8a234fbcb064d8967f0f9a9fef136b',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M182',
    sourceId: 'fk-charter',
    itemId: 'item.e0879b980578',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:8',
    priorLocatorDigest: 'f024f01888501a5353c682c001ecfbeb231e40111ed89204d4f69697ae264faf',
    priorValueDigest: '06590b63f6a3bbf355711f3b5943a87e8655bd9d01cd839522f5c544c43e2bd1',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:8',
    newLocatorDigest: 'e4c9f571389d686db248fa4e9341b668c9d05333f128987a6469e4ec04ccdba2',
    newValueDigest: '06590b63f6a3bbf355711f3b5943a87e8655bd9d01cd839522f5c544c43e2bd1',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M183',
    sourceId: 'fk-charter',
    itemId: 'item.31a7488199a5',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:9',
    priorLocatorDigest: '02883fcd7e8111afa01f21cbc6db81465c3c35b067a2dc80c10171aa31dd96b0',
    priorValueDigest: '252e666b82f35488fccafc725bfb2d078d56f2fc092a551485c245db4a142b74',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:9',
    newLocatorDigest: 'ff95640c77b8c4eba0c5e0cb5b25b81a433a6e5421c0ea463eefc05cc5da37cc',
    newValueDigest: '252e666b82f35488fccafc725bfb2d078d56f2fc092a551485c245db4a142b74',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M184',
    sourceId: 'fk-charter',
    itemId: 'item.8ab6cbecef4c',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:10',
    priorLocatorDigest: '06f3b9c35c5c93203ac04c655a1d86d1b42c9f21de64f6b2c7261429347ce26a',
    priorValueDigest: 'bf64d0c00bfce2595147a430145e8d8ae23003b721996b4450cb5b6cc7d1b96c',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:10',
    newLocatorDigest: 'd2374865d805d1db5876cea1e5c91eea5fb25ffd5a0d97e0a3a5021b5cce359e',
    newValueDigest: 'bf64d0c00bfce2595147a430145e8d8ae23003b721996b4450cb5b6cc7d1b96c',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M185',
    sourceId: 'fk-charter',
    itemId: 'item.b1ac4aa9eddf',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:11',
    priorLocatorDigest: '68e8ad9c893ce026b168086b994e268f6e2925529d87a8b5d0edd09c8ee96be9',
    priorValueDigest: '4d67d991b566cac23d275df38b820b75259a5d273e7e506f3aaf53fea3a2666f',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:list-item:11',
    newLocatorDigest: '1a45e2433485658669d42b9b077cafb94884ac4331394c80b5a31d075d162769',
    newValueDigest: '7f797e5dc1522e3748cc4b90380d584713a44eb12dc52dc0e045032cdbb1ab37',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M186',
    sourceId: 'fk-charter',
    itemId: 'item.b0a3e204145f',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:paragraph:2',
    priorLocatorDigest: 'b3dce86ab340aa0fe86f2a9ba1fc842e74f5250b55e79ed86e985f0ec4d0a8bb',
    priorValueDigest: '098bbd6004eb620868d1cd87b3ff8ec544357d8f0cde5d09f8db7504d7dcf303',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 13. Gate 1 decision list:paragraph:2',
    newLocatorDigest: 'c958a5c913c7da3c1fc33fec724b564fa1a80c19514766ad1b0ec3326dd16511',
    newValueDigest: '098bbd6004eb620868d1cd87b3ff8ec544357d8f0cde5d09f8db7504d7dcf303',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M187',
    sourceId: 'fk-charter',
    itemId: 'item.7df1436dcd98',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07:paragraph:1',
    priorLocatorDigest: '4fc0181749940bbea6964f4476056000687b7b48d6b147b013d2f3f761ceb097',
    priorValueDigest: '7cdb06b5d62c333331028f47aa79a9c5c01650a0d20ecd5d6e63ef1756751da4',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07:paragraph:1',
    newLocatorDigest: '1ae52b4d286bb82b1fede0f607dc7ff7d97d6953aa0cc4ad94bd5df127576362',
    newValueDigest: '4ff597b46af2120fcaec3f3de5265dbf6cb9050cbbe14ec83e0a69bb48078a5b',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M188',
    sourceId: 'fk-charter',
    itemId: 'item.6aa2e5c4c5e5',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution:paragraph:1',
    priorLocatorDigest: '507db9239273fcf016096325e685e782e0fb56857606132cffc10f739334171f',
    priorValueDigest: '718cdbdaf7eb1c33c65a3f1406dc4fba47bef84318c64619eddc87a3b336d3f3',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution:paragraph:1',
    newLocatorDigest: '54d868857918ea15fa5d1e8c341a434e7f6038ab20cb35abcc4a3b154f0e2aad',
    newValueDigest: '718cdbdaf7eb1c33c65a3f1406dc4fba47bef84318c64619eddc87a3b336d3f3',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M189',
    sourceId: 'fk-charter',
    itemId: 'item.0334ebc1c195',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution:paragraph:2',
    priorLocatorDigest: '76750020376f56a3b2104e2e961b27cd1f927c5b739ea41a5e51378332c55224',
    priorValueDigest: 'b0ad07741b0f585054c316c55dccdd2381af5adbf835af80fe90d7634b7934cd',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution:paragraph:2',
    newLocatorDigest: '6bbb5ade67d46ea6d941dc2cc60fb7648c7757942f6919857684ae896a3f2751',
    newValueDigest: 'e0eb08458aebbe10e23cb169c3601a568ab88486ed0830c6167f5d783a08b6e6',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M190',
    sourceId: 'fk-charter',
    itemId: 'item.ac3a94701bf0',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution:paragraph:3',
    priorLocatorDigest: '138456051cb4fd46eafe91d1c2bd87afa290e91950b60d609fb6bdbf8936d731',
    priorValueDigest: '885da27a0ab8b8113ea9b8763b691a2ec1a87a92c52b2a1245643d2282be69f7',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-1: Separate platform proof, development, and future execution:paragraph:3',
    newLocatorDigest: '171843c3bdf30e9ce1dc2141ff175eb3d4b17ee3b12187c50c368ac82cc97a60',
    newValueDigest: '65600ca8d4e0498c4f4176115594228b11b9e9e30ec6a1d7490cee19aa0b9888',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M191',
    sourceId: 'fk-charter',
    itemId: 'item.d5def2117d58',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts:paragraph:1',
    priorLocatorDigest: '0a8e2c74c5a03ac61c0e5ed6ae251dafb7dcd6394dbc0d66a64448fad9dc2d9f',
    priorValueDigest: '4e7fb00f29af7a0513a606af4d226b3b74eb9d225c38047fcec1731d832bde9f',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts:paragraph:1',
    newLocatorDigest: '7ddacc6479c14b79194c6ba1f8effe5b6b9c5a6a34ab0eb0d954720d15aed23f',
    newValueDigest: '4e7fb00f29af7a0513a606af4d226b3b74eb9d225c38047fcec1731d832bde9f',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M192',
    sourceId: 'fk-charter',
    itemId: 'item.aedd676e1a43',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts:paragraph:2',
    priorLocatorDigest: '55fcc70cc4db1c5e213cd9d14cbacc651112a562ab93f4d2485750676d1213de',
    priorValueDigest: 'e80447cf1949f27260b56ba203ccf8180118f8100851e57bcd4bd462d7508bf2',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts:paragraph:2',
    newLocatorDigest: '2954d174727c0e1d132d5d6d2e8bf4e263696cbcd713abe848aa64e31d66a5c1',
    newValueDigest: 'e80447cf1949f27260b56ba203ccf8180118f8100851e57bcd4bd462d7508bf2',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M193',
    sourceId: 'fk-charter',
    itemId: 'item.5602e9c0f2d7',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts:paragraph:3',
    priorLocatorDigest: '0a1b97eb822375755436ef9db29b12acba5ac1cdd4faa526cf8237c075e243b6',
    priorValueDigest: '441f7a8234754e2bdf32a23516c4914d0dfc896b9608fff75c2599abdca2e994',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-2: Scope storage and hosting decisions to their actual contracts:paragraph:3',
    newLocatorDigest: 'b4471909279fe8aa2b0c1d2b359d7beeb741253e8e4254cc0e59e84b69d7e721',
    newValueDigest: 'cada5bd95dc6149c25bbc95d9ea3d66079ab72dde4da2833f869fbd58d4f4912',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M194',
    sourceId: 'fk-charter',
    itemId: 'item.0e5b4dca9153',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions:paragraph:1',
    priorLocatorDigest: '32a6cb9e553981dea8d87912c6d6fb20137853b59be59370c189dc3ca8ffe02f',
    priorValueDigest: 'a5c60298e50b4f882c79410999acefa80364ab3389338a5611fdf4f0d1d4be71',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions:paragraph:1',
    newLocatorDigest: '8a3fcb8f6fd7ea91b6b0eefb5d20dce852e048c5ccf3ec4b63837af2d224dd95',
    newValueDigest: 'a5c60298e50b4f882c79410999acefa80364ab3389338a5611fdf4f0d1d4be71',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M195',
    sourceId: 'fk-charter',
    itemId: 'item.823540249b94',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions:paragraph:2',
    priorLocatorDigest: 'bcc0e0518e60a3da38a6b6bc215bd5ce828b637a69d3de4ff69f7676a5e3f88e',
    priorValueDigest: 'cc2b292fc763639f0268a30fe790f4ecbb07ab814c5b66263859d47a65bf2bad',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions:paragraph:2',
    newLocatorDigest: 'db9593bfe7210405a3216d390ea33551e693676e0c4b46707d877cd847bce176',
    newValueDigest: 'cc2b292fc763639f0268a30fe790f4ecbb07ab814c5b66263859d47a65bf2bad',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M196',
    sourceId: 'fk-charter',
    itemId: 'item.b760093ab1a0',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions:paragraph:3',
    priorLocatorDigest: 'adba99a81cf6269c21d92fe6e5e383fe6f27e91af20c28250ee273f3250c307e',
    priorValueDigest: 'f31ddd26f10d95b4600788f348ffc89a5f28197136a99905af72876990313df9',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-3: Measure workstation optimization without blanket exclusions:paragraph:3',
    newLocatorDigest: 'bc599b4407fb2f0ffd07a32c535c45555b2e4b48c8f77d330f02a41c4bb9374f',
    newValueDigest: '691fba97f3128d76a792314e08ad7d6b83f511dda9531f6cc6cf21423034c3ff',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M197',
    sourceId: 'fk-charter',
    itemId: 'item.a903b0947304',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence:paragraph:1',
    priorLocatorDigest: '6e88bd6b51fa05309ba0e99398c6750b988d688b9ef4a7ec2e1cd261bd1689b1',
    priorValueDigest: 'd270568d88576df98355eb7562487d2dc0257df8c39fa417ca5d7c810fac2539',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence:paragraph:1',
    newLocatorDigest: '847faf571e0bc1156ea737014d27fb0bd4e0d260055d649976510695bc27e065',
    newValueDigest: 'd270568d88576df98355eb7562487d2dc0257df8c39fa417ca5d7c810fac2539',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M198',
    sourceId: 'fk-charter',
    itemId: 'item.738d073932ec',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence:paragraph:2',
    priorLocatorDigest: '094a7ac7e92e92dc4fe5cffb3f0ad3ea6ded12d9d19698a2ba93e326c7465e2b',
    priorValueDigest: '4d2c95c0c853e2a90b9f30e9f70e3df14737295f48ce7ae63a20c2b5d8348491',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence:paragraph:2',
    newLocatorDigest: '8e627bd2bb2398bd904d2219475ebf4869c49a949f2f4b809c0515d78c9cf336',
    newValueDigest: '4d2c95c0c853e2a90b9f30e9f70e3df14737295f48ce7ae63a20c2b5d8348491',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M199',
    sourceId: 'fk-charter',
    itemId: 'item.4d179a0e3c71',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence:paragraph:3',
    priorLocatorDigest: '5359f92c233b35fc364dc96fe56d9712c58dafa7f169d0cc9b1fccb541b07368',
    priorValueDigest: '1014689b6a7b2d7ee374948367b955d916e990c82d21839ebdb5706e05c75a0b',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-4: Prove verification independence and retain evidence:paragraph:3',
    newLocatorDigest: '47a6379154b8f45f8f1b41eb5bad843fdd6d7d9c4d28cf55f38a92ba2c3adac2',
    newValueDigest: '8630454cbdda7f32b90811b03914150e882140a84b010480cc850a6d0735690a',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M200',
    sourceId: 'fk-charter',
    itemId: 'item.f0be0de850ce',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:paragraph:1',
    priorLocatorDigest: 'c7a376dfd8f9db8c95f36ce318fec447931231b03993eb198c5afefad0dd1f9e',
    priorValueDigest: '991c6811c1aab8d9c4fb885bfceedf282617ab26201c985990fb33bd5c8b747e',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:paragraph:1',
    newLocatorDigest: 'b27bff97bc946d82739723aeefa35ea9a956f475f26c959b7e865783c3833241',
    newValueDigest: '991c6811c1aab8d9c4fb885bfceedf282617ab26201c985990fb33bd5c8b747e',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M201',
    sourceId: 'fk-charter',
    itemId: 'item.85625a932abb',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:Warm kernel decision',
    priorLocatorDigest: 'f23b3dc45588fd8d2c1ff15f41e0b358717035de88e7f848fb4b41f10c5d79ed',
    priorValueDigest: 'd28871e2cbd8dce8c907acd9b7f6b7f0a06672cdc3065b021393de8a91abf23a',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:Warm kernel decision',
    newLocatorDigest: '4738e0a295e44b92203250a58f35d212826ed39d39c8441a1cdd8c4aa97618a3',
    newValueDigest: 'd28871e2cbd8dce8c907acd9b7f6b7f0a06672cdc3065b021393de8a91abf23a',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M202',
    sourceId: 'fk-charter',
    itemId: 'item.c9672cddd1f2',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:End-to-end mediated action',
    priorLocatorDigest: 'f13ee5f18880bea1280640d7de00e17003f9753fc1be056d2f90b4a41f303be3',
    priorValueDigest: '705a2ed7f955548982cdbec85ba713c6dabbcdc3a29f96aec5685aa2a565a32b',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:End-to-end mediated action',
    newLocatorDigest: '0d6d69eb81007cff0bf033ffa4b6c3fbaf64b4f0109e5c3f90320c2003bdb09d',
    newValueDigest: '705a2ed7f955548982cdbec85ba713c6dabbcdc3a29f96aec5685aa2a565a32b',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M203',
    sourceId: 'fk-charter',
    itemId: 'item.db57a9d18103',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:First call after startup',
    priorLocatorDigest: 'abae1d5c7df77797b6406226ab381b1f01f32f159388fea3291e95ae8395c950',
    priorValueDigest: '10b89c57d7a263417d3b562160af061db1f92759902d68039a73b5d6bd7de0ae',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:First call after startup',
    newLocatorDigest: '4273148b2b261c62c98166af577470199f080fbd82f6861f16654ac256f95da4',
    newValueDigest: '10b89c57d7a263417d3b562160af061db1f92759902d68039a73b5d6bd7de0ae',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M204',
    sourceId: 'fk-charter',
    itemId: 'item.8e7289313266',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:Per-decision hard deadline',
    priorLocatorDigest: 'ca0613157c2841ebcdb0b906a14cec6da63f8b42637ac6aa4328d286bea069ea',
    priorValueDigest: '185dd02060ac72766f09581849c2eac612423c9cec667a122e926ecd669f1b0e',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:table-row:Per-decision hard deadline',
    newLocatorDigest: 'c0f9e6444cd61eb47b199d9ebaf4f2c302497350170e6fccf7f92874ca97b746',
    newValueDigest: '185dd02060ac72766f09581849c2eac612423c9cec667a122e926ecd669f1b0e',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M205',
    sourceId: 'fk-charter',
    itemId: 'item.90282758c3ec',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:paragraph:2',
    priorLocatorDigest: 'e757d18986be5c67396e96fef5c118dcc1111b222cca1deb5cff469c08d278f4',
    priorValueDigest: '5e80bc865949837ad1a4e505ca8287e38152067f9430b6c901d952818943af21',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:paragraph:2',
    newLocatorDigest: '00de88acbdb0f9dded02d1ce9806889742d8fae687502c8c4579faee2d2413d2',
    newValueDigest: '5e80bc865949837ad1a4e505ca8287e38152067f9430b6c901d952818943af21',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M206',
    sourceId: 'fk-charter',
    itemId: 'item.bd0165a4630f',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:paragraph:3',
    priorLocatorDigest: '5a537c41cc8dce77ba8050734d8465d46fbd5a4f3af60f6f090f3be196969a86',
    priorValueDigest: '67b2b4486373bbeb158e9f488f38d414686d22188ddaa8edbf49640debcf409f',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-5: Reconcile A1 and measure both latency spans:paragraph:3',
    newLocatorDigest: '4905e98b8248d4113f5b7554eccf00be7c6c71298950c7cc16a6ce64dddcd525',
    newValueDigest: '206caa660f433723cf461517dff2cb4426687484a91356f8502afb28a86f0257',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M207',
    sourceId: 'fk-charter',
    itemId: 'item.52a3074f5030',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:paragraph:1',
    priorLocatorDigest: 'acf2245e477192d1eaf67f53aa95011ea775e1a67aec382761239ad0286fb354',
    priorValueDigest: 'bb891c6487a2ed866169f56e4874f470cf9c1dedaf30715d94e9058f726abed8',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:paragraph:1',
    newLocatorDigest: '05381afa40f423e42eafcdab45dd4d428bd5d47a13cd18dd908a5f7591d8cb36',
    newValueDigest: 'bb891c6487a2ed866169f56e4874f470cf9c1dedaf30715d94e9058f726abed8',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M208',
    sourceId: 'fk-charter',
    itemId: 'item.7dd8dba116bc',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Accepted parcels per hour',
    priorLocatorDigest: 'e7ffe97e83b601f3f2d55ce268a1ef4c2ee296746784427387ec29574bfcd107',
    priorValueDigest: '222efd280053046fd30dfae35af8cf40bd26711f4960ccd2969dc03f4bde2cbf',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Accepted parcels per hour',
    newLocatorDigest: '35cfb2c3fd1c2ee148f66a611dfe8266c3716b9dd62578eb260b7d13582ce090',
    newValueDigest: '222efd280053046fd30dfae35af8cf40bd26711f4960ccd2969dc03f4bde2cbf',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M209',
    sourceId: 'fk-charter',
    itemId: 'item.5eb069676d8e',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Cost per accepted parcel, including rework',
    priorLocatorDigest: 'd2dbbe3bc702b47bd0f49946c7d2adfe90b561b9351c712a6d3d3a4b765d7450',
    priorValueDigest: '47138a879b48761a8fafc2c07338176e6fcff8d4daa448eb4b5b679ba2232f12',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Cost per accepted parcel, including rework',
    newLocatorDigest: 'c58cdfe1af3e78d663b4d18ed81394292e8c367661c0ed9df4a526e349ecd052',
    newValueDigest: '47138a879b48761a8fafc2c07338176e6fcff8d4daa448eb4b5b679ba2232f12',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M210',
    sourceId: 'fk-charter',
    itemId: 'item.73e69c428a2f',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Reviewer queue delay, latency, tokens, rework rate',
    priorLocatorDigest: '5bf02d2f5731fcf1e3e36144efac47a351fc881aa7000da48db15de7aefd0af2',
    priorValueDigest: '65047f7e4f0a3e535a34e30ff433a9812d84054074458b4cd08c485207b9d13a',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Reviewer queue delay, latency, tokens, rework rate',
    newLocatorDigest: '6a18965c5d732884188678a5f3820ef061498cb1241c5d08e05e02ddb2dabd15',
    newValueDigest: '65047f7e4f0a3e535a34e30ff433a9812d84054074458b4cd08c485207b9d13a',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M211',
    sourceId: 'fk-charter',
    itemId: 'item.065406de951b',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Installation and verification duration',
    priorLocatorDigest: 'e906c507f36f4fc0827a64bdb3f9da19021da303aa9000676fcc749a5d7bb4bf',
    priorValueDigest: '5fd42944a43c9bb90b7bc9e3100a59817c99a8cdd8212ef3695b38fa0a41be30',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Installation and verification duration',
    newLocatorDigest: 'd84850669b8ded7afab193361489cbf3fbbd0bb0be48249ba2b8f8fa2c72f405',
    newValueDigest: '5fd42944a43c9bb90b7bc9e3100a59817c99a8cdd8212ef3695b38fa0a41be30',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M212',
    sourceId: 'fk-charter',
    itemId: 'item.aac81e1754fb',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Both A1 latency spans',
    priorLocatorDigest: '6b1553f523c87b1da8d44bc92dd8381417f9f21d01f12f58458deb12555027de',
    priorValueDigest: '5eb6cf7d7d15216d14ea590caac6304c899ecebab3b011b3055a9c5865d9b39a',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:Both A1 latency spans',
    newLocatorDigest: 'bcd3b04be82b01380e879093e2f36718402e8c50b2f5fb4a04110511db5528b0',
    newValueDigest: '5eb6cf7d7d15216d14ea590caac6304c899ecebab3b011b3055a9c5865d9b39a',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M213',
    sourceId: 'fk-charter',
    itemId: 'item.a09a3029f031',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:SQLite contention and CPU/memory/disk pressure by concurrency',
    priorLocatorDigest: '044ce673b268c5e69a21845aa9465c11386dcf1a96d26580a5b43dd94b715bde',
    priorValueDigest: '8ecc71533bc18b378202f053aaa6aa8b3aa416639a9d6534797d12c596a6efb3',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:table-row:SQLite contention and CPU/memory/disk pressure by concurrency',
    newLocatorDigest: '5ae35544c23895f8fc565f9c4c21882426e64503f23082073f06505465daac33',
    newValueDigest: '8ecc71533bc18b378202f053aaa6aa8b3aa416639a9d6534797d12c596a6efb3',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M214',
    sourceId: 'fk-charter',
    itemId: 'item.5ab7daa95afc',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:paragraph:2',
    priorLocatorDigest: 'ff62db4263f7b489738feb327cfa0618d37cf4ff7b34f27f18789309f99c1ca2',
    priorValueDigest: '445f858c17e0af3052acc8a9fd603ef7187c7fabe3def7810292f7050c1995fb',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:paragraph:2',
    newLocatorDigest: '98f512063ef7458db10aaaae7cf401421758ac7ecaa6875fa1d9a435c580710e',
    newValueDigest: '445f858c17e0af3052acc8a9fd603ef7187c7fabe3def7810292f7050c1995fb',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M215',
    sourceId: 'fk-charter',
    itemId: 'item.2483eaff6f43',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:paragraph:3',
    priorLocatorDigest: 'fc425483e98452868b478b70dafb9d404f36da694b7b7e1736868d13e20f5f9d',
    priorValueDigest: 'f7105e55003f855866e2119c3c0aa06514a49121fed66c57968389232e28dd5f',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-6: Use a reproducible performance and cost baseline:paragraph:3',
    newLocatorDigest: '686dbbddbca68fef10b99eda09ef22b8eead2a08f8345484c617a7af43d9119b',
    newValueDigest: 'd710b88f2034b300a5fea9602dd9384e049ef5e11a92a0ed5db91bd83db0ae51',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M216',
    sourceId: 'fk-charter',
    itemId: 'item.6bef45e68858',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory:paragraph:1',
    priorLocatorDigest: '9fdf866e282f94fa77dd0328a435b739e10b723c37ae66ca5f5672f50f9eb16b',
    priorValueDigest: '39ddd54a680143a68b4b8972db409c19c621124c1896cbb30b0969f7c69908c0',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory:paragraph:1',
    newLocatorDigest: 'e884b9fa7a401505e6443d5ea140d9f3a5d8f1a4aa576df6d49268cd183916d7',
    newValueDigest: '39ddd54a680143a68b4b8972db409c19c621124c1896cbb30b0969f7c69908c0',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M217',
    sourceId: 'fk-charter',
    itemId: 'item.4ed03c71f99b',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory:paragraph:2',
    priorLocatorDigest: '9b15aa69861a9d316496e9807a496625c995139baee4bc0ff6a7c910d8d3503d',
    priorValueDigest: '33528b32a55f362f7110d1ee7de30168a5450502aaa87a93417666360039ae2f',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory:paragraph:2',
    newLocatorDigest: '1633dd9dfc30142bb388c0291b87438f2afc6f4480c905525e6100536052838f',
    newValueDigest: '33528b32a55f362f7110d1ee7de30168a5450502aaa87a93417666360039ae2f',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M218',
    sourceId: 'fk-charter',
    itemId: 'item.9b7ce5dacd99',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory:paragraph:3',
    priorLocatorDigest: 'b6065dcc34a4d4835e29aa1a1ee7cfd8bc456c68b2a1cb397e471127879f2b8a',
    priorValueDigest: '74a087d5a4c75bff1e3018f52aac808feaa0334f8dbf5e90774025145ac4bca7',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-7: Exhaustive corpus manifests; retrieval remains advisory:paragraph:3',
    newLocatorDigest: '03919c082f106d724a3ab91eeeb925298234ea866540baf1c4e2f38ff6d18d39',
    newValueDigest: '1ebe2fd90250d79077b7375bd1b707fb312790fd70aa8103f2ab59cb3d99fa24',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M219',
    sourceId: 'fk-charter',
    itemId: 'item.462313b4d210',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:1',
    priorLocatorDigest: '222f517bba587d9b4c1ea30e52bc2da6a2eaad81367be14931f9be5a234ca040',
    priorValueDigest: '3b0961d85aeaf823a8147d9715ca2f9a45e2610c9a39de85025395c93ccbed4c',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:1',
    newLocatorDigest: 'cdba9d099a530c9a6190f98d9e4e42ccf7d53d40c3dfce284eb5cf03ab588c72',
    newValueDigest: '3b0961d85aeaf823a8147d9715ca2f9a45e2610c9a39de85025395c93ccbed4c',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M220',
    sourceId: 'fk-charter',
    itemId: 'item.4f5a41ed9f1d',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:2',
    priorLocatorDigest: '0ec3da57a09d1b3a914f3f1c11572de9bad083ecc92d63b0704107b07dfcceb6',
    priorValueDigest: 'e8325766788b7b4225bfbeab607a33e939f387e7fdd9002317f113771ef8553b',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:2',
    newLocatorDigest: '49b584ae014faec3f16b651e0eed730ed4b793a91a208b7ac3294c99152f0a44',
    newValueDigest: 'e8325766788b7b4225bfbeab607a33e939f387e7fdd9002317f113771ef8553b',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M221',
    sourceId: 'fk-charter',
    itemId: 'item.dbbeaf39106c',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:3',
    priorLocatorDigest: '1430d36ac3a1c88d723153036390ee017e7e57945f5130f59a353e1a08814e6b',
    priorValueDigest: '284f11242f5dd836e0fc27a99a27b80eade3d741b12e1329ff0e4e9dff84637b',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:3',
    newLocatorDigest: 'ce7937ca04d1aa9d95a3604ec59dac061c90da7157f839e42bef02288e33d60e',
    newValueDigest: '284f11242f5dd836e0fc27a99a27b80eade3d741b12e1329ff0e4e9dff84637b',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M222',
    sourceId: 'fk-charter',
    itemId: 'item.96e53dfda63f',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:4',
    priorLocatorDigest: 'fb04b02c3403d5da8b64abbf4b76fe25dd2620994fcbac5f1b0717f9555d3dbd',
    priorValueDigest: '2aa46edb2223185ac862bd192e1bba2b39e3883d0e55d2fd97933377dd582ecb',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### INF-8: Demonstrate recovery and define measured revisit conditions:paragraph:4',
    newLocatorDigest: '6bdc387f443918ba382d4b0ab08e4c824384d4bcbcafafa77b9037b13ad8517b',
    newValueDigest: '3f1b5bcc49721159d1d0da6c7f8f7c7195692e21913a1804d3beaff2745a8c54',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M223',
    sourceId: 'fk-charter',
    itemId: 'item.c3ba63d89fb1',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:1',
    priorLocatorDigest: '4fd2857932514c488480e2dcecf7875cb68addd128ebeca1926dd11b9f08cfb0',
    priorValueDigest: '7cbc7c80c2d8cb38be0fe1fc2e514ff869a8d9d8c68d4bb9cb271eb50b50c8c6',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:1',
    newLocatorDigest: 'fc40ce9dbb053385ddc90b1e704626fa3bc9dc5a6de00bed03ff24287d5764e1',
    newValueDigest: '7cbc7c80c2d8cb38be0fe1fc2e514ff869a8d9d8c68d4bb9cb271eb50b50c8c6',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M224',
    sourceId: 'fk-charter',
    itemId: 'item.f95b77d201bc',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:2',
    priorLocatorDigest: 'ae9b333a43a69b31ae81d42163e6eb8a8592153f9c29dd4fedb5faeea2eeb26f',
    priorValueDigest: '8e4d31552ac7a2706b75a6903045412225434c57dccda59eed43d09b53ed9f0b',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:2',
    newLocatorDigest: 'c49625c0c2a4401a9f74bb5455d8fafd5197f2da868ec982a3d4c1eb7a9f7024',
    newValueDigest: '8e4d31552ac7a2706b75a6903045412225434c57dccda59eed43d09b53ed9f0b',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M225',
    sourceId: 'fk-charter',
    itemId: 'item.24841a6c1279',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:3',
    priorLocatorDigest: '7b9432b738c849536a0c19ab2eabf9b0656b0eb3d641978f2f2d9022a17a50aa',
    priorValueDigest: '4dd478551e4a12cb6d04b6c7ee420058bfb2f297f8ef47191b5e64858da59669',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:3',
    newLocatorDigest: '02486854182f90fc5af690fcb67e6e0685ebacdb5590edca61d655d6df7a6d08',
    newValueDigest: '4dd478551e4a12cb6d04b6c7ee420058bfb2f297f8ef47191b5e64858da59669',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M226',
    sourceId: 'fk-charter',
    itemId: 'item.df7635424bf7',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:4',
    priorLocatorDigest: '45e6510c07c337c30896e7920d2bd0a42254643084ef370bf7a7e6cfe6d7dd3f',
    priorValueDigest: '9aab73c2a8893a644d36436691dc8a70625745739bf5acd6526e97bb7a565e9e',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:4',
    newLocatorDigest: '0e0e3c4b1eb3f8fdbbf26f4ee56bccdc58a03529234c424aab21bb8c00e73a6b',
    newValueDigest: '9aab73c2a8893a644d36436691dc8a70625745739bf5acd6526e97bb7a565e9e',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M227',
    sourceId: 'fk-charter',
    itemId: 'item.6eca2202eee8',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Goal Charter — Foreman Kernel > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:5',
    priorLocatorDigest: '16df7355c481786387be5d21c80f02bccfacc4697d9a496b3c5b0db55f927761',
    priorValueDigest: '72c06f92ca6947cd47fb275407f254a6d04cef2e765fdec8eec570c4d83e20d7',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 14. Ratified infrastructure adoption, 2026-09-07 > ### Adoption dependencies and evidence ownership:list-item:5',
    newLocatorDigest: 'afb8b8af34bfd767cc091c0421c6604b7b8df755cbcf8491e22f75fc6596ed7d',
    newValueDigest: '72c06f92ca6947cd47fb275407f254a6d04cef2e765fdec8eec570c4d83e20d7',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M228',
    sourceId: 'fk-loop-directive',
    itemId: 'item.08b3cbb91027',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## COORDINATOR OWNERSHIP — read before dispatching anything:list-item:5',
    priorLocatorDigest: '4da374985363b8005fc0c87a0ea61ca1f21a1bf8267dbe0fdaa7fd394a4c4688',
    priorValueDigest: '9ccae06690da1cd4c63744f1463a6b82df1f1b54f2d3f65e08db9b60bf5f8cb1',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## COORDINATOR OWNERSHIP — read before dispatching anything:list-item:5',
    newLocatorDigest: '4da374985363b8005fc0c87a0ea61ca1f21a1bf8267dbe0fdaa7fd394a4c4688',
    newValueDigest: '794c0f8bed6cd36bc4ad341b54bfea52f722dfc0bc5af97394f719be5086ad4f',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M229',
    sourceId: 'fk-loop-directive',
    itemId: 'item.7eb6018d9e57',
    priorKind: 'numbered-item',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Standing authorizations and their limits:list-item:6',
    priorLocatorDigest: '9486fd3b17d2b6d4ad94b584ebec5fb60fc8bf547f13c1bf4ff7c6805c88cd2a',
    priorValueDigest: '3d876b410aa392c1cac6b95b512177e5f9e5c94bac78555b89c8fe81d271ba36',
    newKind: 'numbered-item',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Standing authorizations and their limits:list-item:6',
    newLocatorDigest: '9486fd3b17d2b6d4ad94b584ebec5fb60fc8bf547f13c1bf4ff7c6805c88cd2a',
    newValueDigest: '14bd6a460c875fb89f51ef4c451efac7b84294ae552699e7cb0d81ff2a2797af',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M230',
    sourceId: 'fk-loop-directive',
    itemId: 'item.e9eb4ab74455',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P1 — Lifecycle, admission, and decision contracts',
    priorLocatorDigest: 'ee38eb69d16c8709485b84713a2bda279df485673bb10ecd8efaad5449c908f8',
    priorValueDigest: 'aec927c00530d1ab33b574458f6e2c0ef0dfbf6c185c09e135906b9cc4c549a0',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P1 — Lifecycle, admission, and decision contracts',
    newLocatorDigest: 'ee38eb69d16c8709485b84713a2bda279df485673bb10ecd8efaad5449c908f8',
    newValueDigest: '26327234747e5ae966134b6dafb1677298a2090ca71eb72bdccf5c6d7f8b56ec',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M231',
    sourceId: 'fk-loop-directive',
    itemId: 'item.d8d1772d0e0d',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P2 — Spec-body compiler',
    priorLocatorDigest: '480c8cfe09ca11649e3c4d59bd8083ce32b7017e68a8e54a74776648a2dc5293',
    priorValueDigest: '144dc1e47bb2155e2fd7cfcfc184550c868c6b28b9998561edb291775d521725',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P2 — Spec-body compiler',
    newLocatorDigest: '480c8cfe09ca11649e3c4d59bd8083ce32b7017e68a8e54a74776648a2dc5293',
    newValueDigest: 'd424ce363da5dbda4e478f0299e9535b9804ec24ad99f8bcdbe8ec1c70d670a0',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M232',
    sourceId: 'fk-loop-directive',
    itemId: 'item.d787ebd03f22',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P12 — Authorization policy engine',
    priorLocatorDigest: '16b75a549dd1fe9453ef339ef62b0a7d09efee81f2b98f1a5c3bb8dbc70f7075',
    priorValueDigest: '2d968e51a73b07ce04a46998c29676d55dc7c3db3032c73e84d6676b91713a87',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P12 — Authorization policy engine',
    newLocatorDigest: '16b75a549dd1fe9453ef339ef62b0a7d09efee81f2b98f1a5c3bb8dbc70f7075',
    newValueDigest: 'd7e5c341c4dc23876271cf2dce5614acd4c8927437cab18b4ab06b28a75c64c0',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M233',
    sourceId: 'fk-loop-directive',
    itemId: 'item.3666c4f9e179',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P13 — Admission-protected control catalog',
    priorLocatorDigest: 'ba61a1ebbdc50f33914455b29311cbc63c093f855826bd2404665c3ebb11c9a7',
    priorValueDigest: 'c7931b3caac3a6c9d82d5c5f85688bca708cd351278d99f7d47bbda90d140054',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P13 — Admission-protected control catalog',
    newLocatorDigest: 'ba61a1ebbdc50f33914455b29311cbc63c093f855826bd2404665c3ebb11c9a7',
    newValueDigest: '8e18d524cb1bdbb528887a2ae3d3683d08a28e2ce2732cf350ac7388dddef57d',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M234',
    sourceId: 'fk-loop-directive',
    itemId: 'item.10030fbfcd56',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P14 — Stateful image composition and operator lifecycle',
    priorLocatorDigest: '9484c8f2168082e5da23c9f01c6a513c7dc949556dae57298cc9fd1de3ecd45c',
    priorValueDigest: 'd3e8ac1d30e8172dcf52670401c03e280d0c8e83e1f75200857a84bb829c20c8',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P14 — Stateful image composition and operator lifecycle',
    newLocatorDigest: '9484c8f2168082e5da23c9f01c6a513c7dc949556dae57298cc9fd1de3ecd45c',
    newValueDigest: 'ba50fab43f5bf9462e53a447a89e639a83a447d9498718f29637a5db1b82ac2d',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M235',
    sourceId: 'fk-loop-directive',
    itemId: 'item.4fc7d51f39b6',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P15 — Stateful restart and admission proof',
    priorLocatorDigest: 'b45c8dea4fdc57e08564d4ed0e7b2ece06e802bcd28ce8e35182d867dc10713f',
    priorValueDigest: 'ae0caa6fe3c47d33b82756766313f7593cda150f57be383ae6490a5b56fef167',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P15 — Stateful restart and admission proof',
    newLocatorDigest: 'b45c8dea4fdc57e08564d4ed0e7b2ece06e802bcd28ce8e35182d867dc10713f',
    newValueDigest: 'b88fc933d331598af9fe8477895336d966e395e5f386917b4cf91e15a0369971',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M236',
    sourceId: 'fk-loop-directive',
    itemId: 'item.e0a833129b92',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P16 — Claude lifecycle adapter, shadow mode',
    priorLocatorDigest: '260846171f9401398cf93b6249bb524af0ecfb3e3f0224fad5db3e580c206a4c',
    priorValueDigest: '780fe3a7f3b7b60e57ad2d0ca517ed314deaf6b6c00d7ffa0c861d67eaf8fa89',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P16 — Claude lifecycle adapter, shadow mode',
    newLocatorDigest: '260846171f9401398cf93b6249bb524af0ecfb3e3f0224fad5db3e580c206a4c',
    newValueDigest: '83b62bba29a865d82bfb41b8379cb26b535f56db3e4209ed4e220a9cf26a2269',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M237',
    sourceId: 'fk-loop-directive',
    itemId: 'item.cdf0b701e09a',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P17 — Bypass and outage harness',
    priorLocatorDigest: '5c2122509242b285180a3424f62e48b8b41313b12d5bacc530483d80a98ca78c',
    priorValueDigest: 'e8b16d6d8adcc779abb36d36949d0e0f08bdc87f9f1d1ab5d958ec1c6872e9d1',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P17′ — Bypass and outage harness (RS-1.2 retarget: shipped surfaces)',
    newLocatorDigest: '8a584e4a70f8e1c2bc85218bf477ec6eea09f779bfc350a65a068a51c489bc65',
    newValueDigest: 'e752e30a2521ccac950d605cb139b507334fe94a46bc5e0c0fcbb16cc6d3e2cd',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M238',
    sourceId: 'fk-loop-directive',
    itemId: 'item.1c4fbecdf373',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P18 — CI scope and state-evidence backstops',
    priorLocatorDigest: 'a5786173b270026d118f3c5cb513b1a124cfaaa78a39ae1572e3479a53bb6282',
    priorValueDigest: '5a7666e2f9d4caed9449eb2e5dbf3463bfb2f82d3b35e266b9b49df87d0436b6',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P18′ — CI scope and state-evidence backstops (RS-1.2 retarget)',
    newLocatorDigest: '89ddb8edc8887201ba58134ae92da51725c447e8ef06b3cc2d7850eb90b987d0',
    newValueDigest: '7dea635a16b3327406e9d274af73015d9cf10d350fbae5e1b047d30865563638',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M239',
    sourceId: 'fk-loop-directive',
    itemId: 'item.4aef5cb209b8',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P19 — High-confidence refusal enforcement',
    priorLocatorDigest: '98459cdc576e74c93037912378ba1bc9035e4398c2df771276d2497accc0edf1',
    priorValueDigest: 'ffb90c2cb875e0d789a8a211df79e7987c450e351c2c58ec1ec1134932252263',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P19 — High-confidence refusal enforcement',
    newLocatorDigest: '98459cdc576e74c93037912378ba1bc9035e4398c2df771276d2497accc0edf1',
    newValueDigest: '031d47f9653cec0c22bf824ace8f25d429676948522e2f96eaaa743f9e15e276',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M240',
    sourceId: 'fk-loop-directive',
    itemId: 'item.aaa6909a5dde',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P20 — Second-host feasibility and host registration',
    priorLocatorDigest: 'd279d0e38023f258c0c62ea2cd25cb205a6441a87664b8f97372c2bfc45dd6ff',
    priorValueDigest: '81a908bef5041f3e6603ca22a0b94660b332d5c3b35ba2733e80760b53fbc34d',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P20 — Second-host feasibility and host registration',
    newLocatorDigest: 'd279d0e38023f258c0c62ea2cd25cb205a6441a87664b8f97372c2bfc45dd6ff',
    newValueDigest: 'e5eb1830a977237ea0afed647b89087409cbe3dbde77eea9b89c3555f4358950',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M241',
    sourceId: 'fk-loop-directive',
    itemId: 'item.10a84529b2f5',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P21 — Exit evidence manifest and clean-room proof',
    priorLocatorDigest: '8562c7c1b6c0ae830912b48f3b553fa8fca62ca931c4e853b450bb09f2b2542e',
    priorValueDigest: 'b384f521821d5fb0c0ac0db695f5b187f722f475789209819422b8abbc4e8088',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P21 — Exit evidence manifest and clean-room proof',
    newLocatorDigest: '8562c7c1b6c0ae830912b48f3b553fa8fca62ca931c4e853b450bb09f2b2542e',
    newValueDigest: 'd9d6724aa1729720cf083de3326641d4b0d00a6cb69dea04b760c238a74e928c',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M242',
    sourceId: 'spec-convention',
    itemId: 'item.2bdb867c0e6a',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.8 `Allowed Files` Mutation Authority:paragraph:4',
    priorLocatorDigest: 'de228701ec3a464c54d5abc2ed458e21f87f3b29c5f9213471ffbc359eab0fc3',
    priorValueDigest: 'bfa7b304d0ae33612d7de7dca5147c835189544d2d71aa4462c1cc1277419b5c',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.9 `expertise:`, `inputs:`, `min_context:`, `thinking_level:` (schema v0.4, added 2026-09-27 — RCM-P2):paragraph:3',
    newLocatorDigest: 'f1d951422e870aca6f72682b277023e7bcb6189b8ab95f57c7ecf3cda88646cc',
    newValueDigest: 'bfa7b304d0ae33612d7de7dca5147c835189544d2d71aa4462c1cc1277419b5c',
    disposition: 're-anchored',
  },
  {
    unit: 'R32-M243',
    sourceId: 'coordinator-pattern',
    itemId: 'item.6fa5b60d426b',
    priorKind: 'line-excerpt',
    priorAnchor: 'md-block:# The Coordinator Pattern > ## Dispatch table:paragraph:1',
    priorLocatorDigest: '22b91c23b63a70ecd3276e6ac9b0871e89f47fae78213a01e5022fe549b50a54',
    priorValueDigest: 'ebb1649585ae088516ed724f5d2ea1da78f84fa32629be81da2ede4c4e4a116e',
    newKind: 'line-excerpt',
    newAnchor: 'md-block:# The Coordinator Pattern > ## Dispatch table:paragraph:1',
    newLocatorDigest: '22b91c23b63a70ecd3276e6ac9b0871e89f47fae78213a01e5022fe549b50a54',
    newValueDigest: 'a48e0888292a9ccfca1edec32a2bd667c43aba8d5fbe4b7943ce7b14f7f8db8d',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M244',
    sourceId: 'foreman-line-plan',
    itemId: 'item.1bd18456b8fb',
    priorKind: 'line-excerpt',
    priorAnchor:
      'md-block:# The Foreman Line — Master Plugin Plan > ## 5. Model Routing Policy (v0 shape):paragraph:3',
    priorLocatorDigest: '8418d85e8245747fc5a6c04b149faa63b6f6d6c1a6a1fb98846c539930826f42',
    priorValueDigest: '999af331c6f80490355106902efd27fbcfe7d2037b51c90ba6e73d46e917afaa',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# The Foreman Line — Master Plugin Plan > ## 5. Model Routing Policy (v0 shape):paragraph:3',
    newLocatorDigest: '8418d85e8245747fc5a6c04b149faa63b6f6d6c1a6a1fb98846c539930826f42',
    newValueDigest: 'edd107a37d1d9b98af4ac2b0e9969cdb80426804f98c2c30df85a7525f21a7c7',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M245',
    sourceId: 'foreman-line-plan',
    itemId: 'item.8fd7ac81820d',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# The Foreman Line — Master Plugin Plan > ## 5. Model Routing Policy (v0 shape):table-row:Builder (default)',
    priorLocatorDigest: 'e6a1be1271a94f852d2978b95fa0bf171334995c645ab785d9051ddd5291bc47',
    priorValueDigest: 'acd6dca8d5a664281044259cf5f36668a6010d238f68b19b57733d0ecbf41bc7',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M246',
    sourceId: 'foreman-line-plan',
    itemId: 'item.596ec7996d32',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# The Foreman Line — Master Plugin Plan > ## 5. Model Routing Policy (v0 shape):table-row:Boilerplate / build-fix-loop',
    priorLocatorDigest: 'caf01e760b70a61b9c14f11b7175674380fe80bff1a191271835b6fedc3e506f',
    priorValueDigest: 'b2ae69870a8a9b899f60777b986f7512c56a72aeacd1800881a96838a0c27a47',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M247',
    sourceId: 'foreman-line-plan',
    itemId: 'item.389ca82e4c31',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# The Foreman Line — Master Plugin Plan > ## 5. Model Routing Policy (v0 shape):table-row:Coordinator',
    priorLocatorDigest: 'c954fc96ab4172e0c15df26b36041ac1fc196e70d212effb46ee9e6fb871138f',
    priorValueDigest: 'b4f93dd1722b094bc9d6f4f97dec81752821ce60956894cf73d91c13daaf1872',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M248',
    sourceId: 'foreman-line-plan',
    itemId: 'item.79cbd057e357',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# The Foreman Line — Master Plugin Plan > ## 5. Model Routing Policy (v0 shape):table-row:Adversarial Reviewer',
    priorLocatorDigest: '0851293ee37bd62458e63dfef64102f5e11e73d735be18d53ea8ef6bd361aef4',
    priorValueDigest: '0f08ea7a7c006b4a0556496c37b72ff53f0931b57691e6ae722aac6ebcae43b3',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M249',
    sourceId: 'foreman-line-plan',
    itemId: 'item.a9cf544f084d',
    priorKind: 'table-row',
    priorAnchor:
      'md-block:# The Foreman Line — Master Plugin Plan > ## 5. Model Routing Policy (v0 shape):table-row:Security-audit parcels & security review',
    priorLocatorDigest: 'c66c2add53748458d35778d8550f8a23d803ef5c4237b0e3ec674d3e3071b82a',
    priorValueDigest: '1a87ef163c67f4984ea2952c9a53d6273b4f65902070f08b60eb36e919917ccc',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M250',
    sourceId: 'spec-frontmatter-schema',
    itemId: 'item.6a054c176039',
    priorKind: 'symbol',
    priorAnchor: 'json-pointer:/required',
    priorLocatorDigest: '55488d0b1bc00fd9a50fab436037dda635b9aa0f93d540a35ab3eb8f057b7f27',
    priorValueDigest: '3cbc7cb2d1d70668a6b1f8824dce4ec1bd88568a474956b7e16abf4c2b0ebc28',
    newKind: 'symbol',
    newAnchor: 'json-pointer:/required',
    newLocatorDigest: '55488d0b1bc00fd9a50fab436037dda635b9aa0f93d540a35ab3eb8f057b7f27',
    newValueDigest: '6b7705efd245aefc00a4e9fa19c8484d8a82a8382d5abc19b76024195230d2a5',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M251',
    sourceId: 'spec-linter-validator',
    itemId: 'item.553029f2f1cf',
    priorKind: 'symbol',
    priorAnchor:
      'ts-import:./grandfather.js:{"defaultBinding":null,"module":"./grandfather.js","namedBindings":["waiversFor"],"namespaceBinding":null}',
    priorLocatorDigest: '61090e0b9c9ecaa1f7f3ec2d304d4c2ab80f47c9a3c6a1d6e20e35eb701c488e',
    priorValueDigest: 'dc8f6b8b73d15089309961e8533f8edac20f40e6295c2c0fac82b99e72bdf4b1',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M252',
    sourceId: 'spec-linter-validator',
    itemId: 'item.a6d886ce90ff',
    priorKind: 'symbol',
    priorAnchor: 'ts-body:ts-construct:isRecord:7:FunctionDeclaration:isRecord',
    priorLocatorDigest: '4323fd8acf01a9ce0751d498c521a52b0e9c53c744a2c136093d8b2ab35e0a99',
    priorValueDigest: '695b3657fc36725a93b0160c8ef8b6b58a7be1399a8311833d1c9cf2401455c9',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M253',
    sourceId: 'spec-linter-validator',
    itemId: 'item.52312b4131d6',
    priorKind: 'symbol',
    priorAnchor:
      'ts-body:ts-construct:checkSupersededInvariant:8:FunctionDeclaration:checkSupersededInvariant',
    priorLocatorDigest: '253db7a7f7886f96e03a7d50956385d6ad159e167ae524f96ba3a5c017de9e44',
    priorValueDigest: 'c79c1f6d02b37a53dd0014fc6128144808861fe05781056f2580fb71e78e6ae2',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M254',
    sourceId: 'spec-linter-validator',
    itemId: 'item.02598b67511a',
    priorKind: 'symbol',
    priorAnchor: 'ts-construct:validateSpecFrontmatter',
    priorLocatorDigest: '7226adbfe11cc55253adedc1b29f482caa7dc48f5a7bc157ecddf3036c115058',
    priorValueDigest: '17634f063f8b19bc7fd4009351842209bf06ca3eedd1de73046bd3bf0a00b768',
    newKind: 'symbol',
    newAnchor: 'ts-construct:validateSpecFrontmatter',
    newLocatorDigest: '7226adbfe11cc55253adedc1b29f482caa7dc48f5a7bc157ecddf3036c115058',
    newValueDigest: 'f90e4bb6be50748754e141c9fa1569f46c44ba01b6d174c914d322f91244d99a',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M255',
    sourceId: 'spec-linter-validator',
    itemId: 'item.ec8bb3e50aaf',
    priorKind: 'symbol',
    priorAnchor:
      'ts-body:ts-construct:validateSpecFrontmatter:9:FunctionDeclaration:validateSpecFrontmatter',
    priorLocatorDigest: '4f9664277b45bb4a7f027aa47fbbfba3738e36524abf7c2887cccf3dca69ada6',
    priorValueDigest: '54a49637c568a888c170eb3708510e6ef08e15fe9ad913aa2fbeb76c42f90c70',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M256',
    sourceId: 'spec-linter-validator',
    itemId: 'item.84c3ef51056c',
    priorKind: 'symbol',
    priorAnchor:
      'ts-body:ts-construct:validateSpecFrontmatter:9.5.4.1.0.2.2.0.0.1.1:ArrowFunction:anonymous',
    priorLocatorDigest: 'c190e0e1ad2ba756d2e71f73c654125b8f41dd19bde32838f6f5e32dbfc0d46b',
    priorValueDigest: '1def7c6d9dfb066ae4353f06431df5661f63ecf6de3456e3370b218e649a3d67',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M257',
    sourceId: 'spec-linter-validator',
    itemId: 'item.de529d858473',
    priorKind: 'symbol',
    priorAnchor:
      'ts-body:ts-construct:validateSpecFrontmatter:9.5.5.1.3.2.0.1.0.0.0.1.1:ArrowFunction:anonymous',
    priorLocatorDigest: 'f79b15efb7f5db9afedce2e93731a735f539df2bad2d4b2feac6d943bfce207f',
    priorValueDigest: '43b2e315d6cfe159053e21833ad49e63967d346b2d0959d38331f1c7bbfdf072',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M258',
    sourceId: 'spec-linter-validator',
    itemId: 'item.cc4d7eedd2d5',
    priorKind: 'symbol',
    priorAnchor: 'ts-body:ts-construct:parseFrontmatter:10:FunctionDeclaration:parseFrontmatter',
    priorLocatorDigest: '27790abd58351c4fae9ebf7c4a0a1dec1661a01010b957bc24ab5118b7b16959',
    priorValueDigest: '1a80680e3f542db73c29f73ff3d72f99e2cd300846110e4703f149ac7747469c',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M259',
    sourceId: 'spec-linter-cli',
    itemId: 'item.66fec8a20db5',
    priorKind: 'line-excerpt',
    priorAnchor:
      ' *   2  usage error: missing/unreadable path, bad invocation, or directory with no .md files',
    priorLocatorDigest: '758ae549862468a4b2cde0e5b613c689430c0a592946c1656ca292c750c81552',
    priorValueDigest: '24b71b2187d7334a4dbfb7d91f08c2d7113d76abf1164a427b64a123097ba2fe',
    newKind: 'line-excerpt',
    newAnchor: ' *   2  usage error: missing/unreadable path, bad invocation, a non-absolute',
    newLocatorDigest: '39c93a034cc4bf9772994b868c49090d6f9b8bd01104176ba0daad1a7574371b',
    newValueDigest: 'e10b3be33e93a606c6a8ccb938260a378431d25d13ca55b7c2e45890a5039d63',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M260',
    sourceId: 'spec-linter-cli',
    itemId: 'item.39787f778432',
    priorKind: 'line-excerpt',
    priorAnchor: 'process.exitCode = run(process.argv.slice(2))',
    priorLocatorDigest: '257eb005dd2a4b1be95ca87d79e6d44673b7139266d9bff3a6c86b87194eac0f',
    priorValueDigest: '39787f7784328e52bde054b73dd5568c6e4499668dd3563f45c0c07519bed0de',
    newKind: 'line-excerpt',
    newAnchor: 'process.exitCode = await run(process.argv.slice(2))',
    newLocatorDigest: 'eabb00dac383fcc934bc8156c8393685b3b0c34db2ceb07c243d03c93d4d4416',
    newValueDigest: '67111d20262bc72f27fd8d8539867fcda494313853dd93c2f0b032f7cf816030',
    disposition: 're-anchored-and-re-valued',
  },
  {
    unit: 'R32-M261',
    sourceId: 'spec-linter-cli',
    itemId: 'item.6c0e9ff52a67',
    priorKind: 'symbol',
    priorAnchor:
      'ts-import:node:fs:{"defaultBinding":null,"module":"node:fs","namedBindings":["readFileSync","readdirSync","statSync"],"namespaceBinding":null}',
    priorLocatorDigest: 'b4252578d2e56f163bf3c321370271328863309a5b526dd286d08e4bcede95ef',
    priorValueDigest: 'e0b6905cf5d75b9047ff69b2fb1e622cb7d694170571c2413037e73380853af4',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M262',
    sourceId: 'spec-linter-cli',
    itemId: 'item.ed56f11b9cd8',
    priorKind: 'symbol',
    priorAnchor:
      'ts-import:node:path:{"defaultBinding":null,"module":"node:path","namedBindings":["basename","dirname","join"],"namespaceBinding":null}',
    priorLocatorDigest: 'bd2772eb691272c1e686c441b65197360b1e282604ed5bb4bd32b076bec954f3',
    priorValueDigest: 'd6ff93478f56a34bb4831377a9de8008ca9ab4eca4e70fb8997bf531e5a30c31',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M263',
    sourceId: 'spec-linter-cli',
    itemId: 'item.ce3cb2055aa4',
    priorKind: 'symbol',
    priorAnchor: 'ts-body:ts-construct:collectMdFiles:3:FunctionDeclaration:collectMdFiles',
    priorLocatorDigest: '6e443ef649ee30992e4e9baf5ad26fee7d54a20d0132592ce1a3ca2b4f9a01d3',
    priorValueDigest: '9021b0fc1ee627b0aa9a0e538d4e82da56d5f7b69f255a6c7d59bdca687f7e55',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M264',
    sourceId: 'spec-linter-cli',
    itemId: 'item.77a7578d4a36',
    priorKind: 'symbol',
    priorAnchor: 'ts-construct:validateFile',
    priorLocatorDigest: 'e4634031a302bfeb477a8535cfbc9e77dfd1b93edb03af4be52ba3c22f6cc1c6',
    priorValueDigest: '79e5fde3fa280847beb46a1324ef06724442a3809565c6bff70547b79c25ff1c',
    newKind: 'symbol',
    newAnchor: 'ts-construct:validateFile',
    newLocatorDigest: 'e4634031a302bfeb477a8535cfbc9e77dfd1b93edb03af4be52ba3c22f6cc1c6',
    newValueDigest: '819e09ec926f63d8dadabadaa6ba1cb9d0bf7e70d27b1707031aa699f2b588ba',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M265',
    sourceId: 'spec-linter-cli',
    itemId: 'item.493834db7c8b',
    priorKind: 'symbol',
    priorAnchor: 'ts-body:ts-construct:validateFile:4:FunctionDeclaration:validateFile',
    priorLocatorDigest: '1845eab6347dfba16be20bebb7c2f106c419cede7a762e74f21e8350a35ca723',
    priorValueDigest: '7cda2fc2255514993a183fbe26c6d34056da079b3ec6d6252cfb932d92af967d',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M266',
    sourceId: 'spec-linter-cli',
    itemId: 'item.9dd99503d3a1',
    priorKind: 'symbol',
    priorAnchor: 'ts-construct:run',
    priorLocatorDigest: '76dae03e6ad2c234229cd40d923e8717ee65e922786b92768edbfe579670da79',
    priorValueDigest: 'aa7fee52c78ba8eed2c1513f5340d3a202ae6b7dde8fe633c56321d60a994784',
    newKind: 'symbol',
    newAnchor: 'ts-construct:run',
    newLocatorDigest: '76dae03e6ad2c234229cd40d923e8717ee65e922786b92768edbfe579670da79',
    newValueDigest: 'ecade0a5376614c64172b9ed19aac66c081abe55a66866b201b82f1ebbf0c342',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M267',
    sourceId: 'spec-linter-cli',
    itemId: 'item.5a4271d75901',
    priorKind: 'symbol',
    priorAnchor: 'ts-body:ts-construct:run:5:FunctionDeclaration:run',
    priorLocatorDigest: 'bb7c247e8d5ad45629cafe850eb8ab71f31f0f154171265f1be181b1f83f6a26',
    priorValueDigest: '903d502000607a4476b7072b5646e40d62de71658cc4fb5be98498908026d147',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M268',
    sourceId: 'spec-linter-cli',
    itemId: 'item.e80038e6ca7c',
    priorKind: 'symbol',
    priorAnchor: 'ts-body:ts-construct:run:5.3.1.0.0.1.1:ArrowFunction:anonymous',
    priorLocatorDigest: '5eaaad80bd0ff33816b4d5961c7495cc5d067869c5cc84bc0d511f4f6a8dc6b6',
    priorValueDigest: 'b38762ba237c05beace8e4890390e2a8bc88246a09197d42b3fcbfda62c622fa',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M269',
    sourceId: 'spec-linter-cli',
    itemId: 'item.7ff4e4acb2f6',
    priorKind: 'symbol',
    priorAnchor: 'ts-top:6:ExpressionStatement',
    priorLocatorDigest: '7de170cfcf2f8e3481b4ca166ed827c8498d48ae35aeddb0d033b4ca6340f045',
    priorValueDigest: 'ca65c430aa95e7a81095a289a8aa8b449b45a7e1f31638505912dc448a2534e8',
    newKind: null,
    newAnchor: null,
    newLocatorDigest: null,
    newValueDigest: null,
    disposition: 'retired',
  },
  {
    unit: 'R32-M270',
    sourceId: 'spec-linter-readme',
    itemId: 'item.ca1f2e558214',
    priorKind: 'line-excerpt',
    priorAnchor: 'md-block:# @foreman-line/spec-linter:paragraph:1',
    priorLocatorDigest: '722733d18c475a0ad8163eab557562f9c75987a18d7a2808c9a11c399388b2a0',
    priorValueDigest: '735b1bb1aaba23a681d6af2c848ecc9f5af20dc6d3b06f55d3f34653c8fcb3d7',
    newKind: 'line-excerpt',
    newAnchor: 'md-block:# @foreman-line/spec-linter:paragraph:1',
    newLocatorDigest: '722733d18c475a0ad8163eab557562f9c75987a18d7a2808c9a11c399388b2a0',
    newValueDigest: 'f753cf0bcb95aa0b89410c498dbafd4b344813c7601e46262d4f3827fed27730',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M271',
    sourceId: 'spec-linter-readme',
    itemId: 'item.e0d3be7366b2',
    priorKind: 'line-excerpt',
    priorAnchor: 'md-block:# @foreman-line/spec-linter > ## Schema shape:paragraph:1',
    priorLocatorDigest: '2d1b725346ba7304d66afd88767f54e3b74df61b42eb2976e9423fe5f8f6e7e5',
    priorValueDigest: '0d8f01bdf2d90d152baa3e0de5834af70e42d3de7d7deea12160c5862a8e41a0',
    newKind: 'line-excerpt',
    newAnchor: 'md-block:# @foreman-line/spec-linter > ## Schema shape:paragraph:1',
    newLocatorDigest: '2d1b725346ba7304d66afd88767f54e3b74df61b42eb2976e9423fe5f8f6e7e5',
    newValueDigest: '97d905155c0c8ceea088fe6cffddc4685bc89e9ecb1e34f0fd0fdcbbb1d77c56',
    disposition: 're-valued',
  },
  {
    unit: 'R32-M272',
    sourceId: 'fk-charter',
    itemId: 'item.3df7b6a51799',
    priorKind: '',
    priorAnchor: '',
    priorLocatorDigest: '',
    priorValueDigest: '',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L6',
    newLocatorDigest: '03d51a0890b771c4b672b0d38501a17e0228f521cd734b8264cc638b0e2caa7c',
    newValueDigest: '08aff1aba3fa5454f2a521771d101ae651434f70e034d10dfec8c344dcd08884',
    disposition: 'adopted',
  },
  {
    unit: 'R32-M273',
    sourceId: 'fk-charter',
    itemId: 'item.5722ad7bc5ab',
    priorKind: '',
    priorAnchor: '',
    priorLocatorDigest: '',
    priorValueDigest: '',
    newKind: 'table-row',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 4. Locked decisions > ### 4.1 Ratification ledger:table-row:L7',
    newLocatorDigest: '7ecafdd34559bf0957817e1df4a8db965cfc4d2c4795236aa8f4570f77bbc3ed',
    newValueDigest: '1f1c87616d4f979458a701aabea7a58b0d5dc3c4a8601ea23572715270d83eea',
    disposition: 'adopted',
  },
  {
    unit: 'R32-M274',
    sourceId: 'fk-charter',
    itemId: 'item.6a8d073a64f1',
    priorKind: '',
    priorAnchor: '',
    priorLocatorDigest: '',
    priorValueDigest: '',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 9. Goal exit criterion:paragraph:2',
    newLocatorDigest: 'd5ed363f863e9177e056d85921704d1c11df752ba57fd2f55eba9263beb4aa1a',
    newValueDigest: '4b1f945c5af5acfc5c9e23314506ab9812c66c6b5d2567f9b0893e09db596ce8',
    disposition: 'adopted',
  },
  {
    unit: 'R32-M275',
    sourceId: 'fk-charter',
    itemId: 'item.1d6405c6eacd',
    priorKind: '',
    priorAnchor: '',
    priorLocatorDigest: '',
    priorValueDigest: '',
    newKind: 'line-excerpt',
    newAnchor:
      'md-block:# Foreman Kernel Development Charter > ## 16. Completion accounting for the infrastructure requirements:paragraph:1',
    newLocatorDigest: 'ee5b323c554c99b30b6e7eb8b90a17df5b4af3683244f28d8ec026099c4aa24c',
    newValueDigest: '62b9e6d4d3faa3fe397394e4394be9832dd3d110753e5445efb3806d0ed339dd',
    disposition: 'adopted',
  },
]

export const R32_RULE_STATEMENT_MIGRATIONS: readonly R32RuleStatementMigration[] = [
  {
    ruleId: 'rule.fk-charter.7df1436dcd98.scope',
    priorStatement:
      "L5 adopts the eight recommendations through detailed carriers without new parcels or edges; the companion's older sections are provenance, A1 and A1.8/A1.9 remain recorded in L3/L4, and new source coverage requires a separately reviewed P0 corpus amendment; unchanged Round 6 is only baseline evidence.",
    newStatement:
      "L5 adopts the eight recommendations through detailed carriers without new parcels or edges; the companion's older sections are provenance, A1 and A1.8/A1.9 remain recorded in L3/L4, and new source coverage requires a separately reviewed P0 corpus amendment; unchanged Round 6 is only baseline evidence. `INF-1` through `INF-8` are traceability labels local to this section, not claims to unused global D numbers.",
  },
  {
    ruleId: 'rule.fk-charter.0334ebc1c195.future',
    priorStatement:
      'Future coordinator, sidecar, retrieval and worker hosting require separately ratified designs; HCS and worker-fabric retain owners and gates; this goal imports neither HCS A3 nor hierarchical commissioning nor distributed execution scope, while preserving neutral contracts.',
    newStatement:
      'Future coordinator, sidecar, retrieval and worker hosting require separately ratified designs; HCS retains owner and gates; the former `heterogeneous-agent-worker-fabric` record was deleted 2026-09-26 per the coordinator audit (goal-status-report-2026-09-26.md); this goal imports neither HCS A3 nor hierarchical commissioning nor distributed execution scope, while preserving neutral contracts.',
  },
  {
    ruleId: 'rule.fk-charter.ac3a94701bf0.carriers',
    priorStatement:
      'P1 records environment and assurance semantics; P7/P14 implement local deployment; P16/P17 prove Windows mediation; P20 reports only demonstrated additional capabilities; P21 binds the resulting matrix to evidence.',
    newStatement:
      'P1 records environment and assurance semantics; P7/P14 implement local deployment; P16/P17 prove Windows mediation; P20 reports only demonstrated additional capabilities; P21 binds the resulting matrix to evidence. (RS-2.2: carrier deferred/dropped by RS-1; obligation named in the RS-2.3 exit annex, never claimed satisfied)',
  },
  {
    ruleId: 'rule.fk-charter.5602e9c0f2d7.carriers',
    priorStatement:
      'P9 owns storage and backup contracts, P14 deployment and operator lifecycle, and P15 recovery and concurrency proof on the exact placement.',
    newStatement:
      'P9 owns storage and backup contracts, P14 deployment and operator lifecycle, and P15 recovery and concurrency proof on the exact placement. (RS-2.2: carrier deferred/dropped by RS-1; obligation named in the RS-2.3 exit annex, never claimed satisfied)',
  },
  {
    ruleId: 'rule.fk-charter.b760093ab1a0.carriers',
    priorStatement:
      'P0 records operational rules, P7/P14 own their respective configuration and benchmark evidence, and P21 reports measured outcomes.',
    newStatement:
      'P0 records operational rules, P7/P14 own their respective configuration and benchmark evidence, and P21 reports measured outcomes. (RS-2.2: carrier deferred/dropped by RS-1; obligation named in the RS-2.3 exit annex, never claimed satisfied)',
  },
  {
    ruleId: 'rule.fk-charter.4d179a0e3c71.carriers',
    priorStatement:
      'P5/P8/P15 define clean-environment proof, P18 the independently controlled CI backstop, and P21 the retained evidence manifest.',
    newStatement:
      'P5/P8/P15 define clean-environment proof, P18 the independently controlled CI backstop, and P21 the retained evidence manifest. (RS-2.2: carrier deferred/dropped by RS-1; obligation named in the RS-2.3 exit annex, never claimed satisfied)',
  },
  {
    ruleId: 'rule.fk-charter.bd0165a4630f.carriers',
    priorStatement:
      'P0 records reconciliation, P1 the contract, P16 the adapter, P17 both spans/cold/deadline behavior on D20, P18 only A1-authorized coarse CI regressions, and P21 evidence; coarse CI does not prove platform latency.',
    newStatement:
      'P0 records reconciliation, P1 the contract, P16 the adapter, P17 both spans/cold/deadline behavior on D20, P18 only A1-authorized coarse CI regressions, and P21 evidence; coarse CI does not prove platform latency. (RS-2.2: measurement carrier retargeted to FK-P17′ on the shipped mediated surfaces; FK-P1 adopts the contract only)',
  },
  {
    ruleId: 'rule.fk-charter.2483eaff6f43.carriers',
    priorStatement:
      'Coordinator records parcel/review economics, P7/P14 build paths, P10/P15 contention, P17 decision latency, and P21 the baseline and gaps.',
    newStatement:
      'Coordinator records parcel/review economics, P7/P14 build paths, P10/P15 contention, P17 decision latency, and P21 the baseline and gaps. (RS-2.2: carrier deferred/dropped by RS-1; obligation named in the RS-2.3 exit annex, never claimed satisfied)',
  },
  {
    ruleId: 'rule.fk-charter.9b7ce5dacd99.carriers',
    priorStatement:
      'P0 inventories obligations, P3 covers every read-reachable mixed evaluator, P19 requires complete sweep before retirement/promotion, and P21 binds identities, counts and outcomes.',
    newStatement:
      'P0 inventories obligations, P3 covers every read-reachable mixed evaluator, P19 requires complete sweep before retirement/promotion, and P21 binds identities, counts and outcomes. (RS-2.2: carrier deferred/dropped by RS-1; obligation named in the RS-2.3 exit annex, never claimed satisfied)',
  },
  {
    ruleId: 'rule.fk-charter.96e53dfda63f.carriers',
    priorStatement:
      'P9/P14 define backup and restore, P15 proves recovery, and P21 records limitations, objectives, results and revisit evidence.',
    newStatement:
      'P9/P14 define backup and restore, P15 proves recovery, and P21 records limitations, objectives, results and revisit evidence. (RS-2.2: in-scope fragments FK-P9/FK-P11; process-boundary recovery proof stranded in the exit annex)',
  },
]
