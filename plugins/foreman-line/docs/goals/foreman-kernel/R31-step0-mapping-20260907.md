# R31 Step 0 source mapping — September 7, 2026

Status: proposed exact mapping for independent review. No implementation, source or generated-artifact edits and no commits are authorized by this document. Only this mapping and evidence/20260907/r31 are builder-authored. R31.5 migration-evidence clarification is ratified; this exact mapping still requires independent review and a recorded implementation ruling.

## Subjects, authority and write boundary

- Worktree: D:/Repos/agent-skills-worktrees/fk-p0-r31-source-adoption-20260907; branch codex/fk-p0-r31-source-adoption-20260907.
- Prepared source-first HEAD:47828207456ec2ea19028e7c911be5f20d1a3f8c.
- Real fixed source commit:8d500704c9e3d6d8b652bbe838aa3623f88203fc (Git object type independently read as commit).
- Accepted R30 base:c35ff72ef45fb19d647cede6acf5a13636911db7; prior registry-changing commit:446700d47c2e162fcfa575d5a46b9247241a59c1; prior source:65c471416e4a3916695815e951ffbe389288560e.
- Selected upstream source subject:476b8df6efe6c9974879957147449f61c34cd9a0. Only two selected blobs were adopted. This is not a main merge or full-main validation.
- Governing decisions: FK-P0-amendment-R31.md, R31-coordinator-decision-20260907.md, R31-source-plan-review-20260907.md, main-source-impact-20260907.md, source-integration JSON, and active P0 R31 overlay. The planning-and-task-breakdown skill is applied in read-only planning mode. R30's two fresh final approvals and686green baseline remain separate immutable evidence.

The nine future implementation paths, all beneath plugins/foreman-line/authority-registry, are README.md; src/generate.ts; src/registry.ts; src/validate.ts; authority-enforcement-registry.yaml; tests/fixtures/pass-minimal.yaml; tests/semantic-invariants.test.ts; tests/corpus-sweep.test.ts; tests/parity.test.ts. They narrow the existing28-file ceiling. No schema, dependency, package manifest, lockfile, index/CLI/type file, test helper, source/spec/amendment, resolver redesign, install operation or actual main merge is authorized. npm ci into ignored node_modules was expressly authorized for read-only probes and returned0; the lockfile and all package bytes are unchanged.

## Exact eighteen-source set

The following are fixed snapshot Git-blob SHA256 values from the coordinator manifest, independently matched to current working bytes in05-source-byte-check.json. The changed-source markers compare accepted R30 source65c. Commit-object SHA1 identities and source-content SHA256 are distinct evidence types.

| Source ID | Path | SHA256 | Changed |
|---|---|---|---|
| fk-charter | plugins/foreman-line/docs/goals/foreman-kernel/charter.md | c289fbcc384ca825181662b091572c2f085e23c984ad2be6bec5fff49d7350d3 | False |
| fk-plan-review-findings | plugins/foreman-line/docs/goals/foreman-kernel/plan-review-findings.md | d2e5bc3268450c77456ad14baa6df8dadb9cd132123ddc52a782886e42a73057 | False |
| fk-loop-directive | plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md | 8b2cd6818833d3f27ecd346f05d3f84bdfc669f16ce81265a1bf6667664ce4cb | False |
| spec-convention | plugins/foreman-line/docs/SPEC-CONVENTION.md | 7ac315005cde6ad6def848b83de1d1b644e321c5d9f6434bc925deb6daba8703 | False |
| coordinator-pattern | plugins/foreman-line/docs/COORDINATOR-PATTERN.md | c734c9b2aef15f020a4a5eb261a1291740eddb2a154376386599074cbb8ca9bd | False |
| goal-skill | plugins/foreman-line/skills/goal/SKILL.md | ee003674865be3a45316b95f5459b8f317d8150bdb8c0774601929cb0befd831 | False |
| standing-constraints | plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md | 57e345f9294cb8fcd8c3d90325505c80903648f60522f820061a5f8f288a86ac | True |
| parcel-driven-development | plugins/foreman-line/skills/parcel-driven-development/SKILL.md | f673472c804a659f9f01515b878f02c653d4ed97c2c4c97f7340139325c6df05 | False |
| foreman-line-plan | plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md | dcca81e1e38e245bc6b8bc8ddfdbd44b8b7546c4f0663639256fb421f686f8eb | True |
| approval-readme | plugins/foreman-line/approval/README.md | 5369e558879ea9faeee5828329807dc544dfbcc21722a1c94d3458f670244849 | False |
| spec-frontmatter-schema | plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json | 8ff17dbd4ccbd29d0f60f7b03dfdc9f08afb63d9de1b64549bc1646ce546034e | False |
| spec-linter-validator | plugins/foreman-line/spec-linter/src/validate.ts | 4e542bfa6943c71b962236cbd5410713186f6eabb2b7788e12392cbffaef3a99 | False |
| spec-linter-cli | plugins/foreman-line/spec-linter/src/cli.ts | aa0928ab5173d868c61c1ddd75ce990dbb698afdaee9269b7e99965f5e687c18 | False |
| spec-linter-readme | plugins/foreman-line/spec-linter/README.md | 8be95883d16a3a73a128a8c0d14d73d61204724531c99ee9dfc8072dff08a69c | False |
| permission-profiles-registry | plugins/foreman-line/permission-profiles/permission-profiles.yaml | 9da06cf299653b244c636dd9809b5ba6410efb5e9e7f89389c1ef7260fa577cb | False |
| permission-profiles-types | plugins/foreman-line/permission-profiles/src/types.ts | 91651a073156834119b5037127b942f315ea4d45d26bc17e0c9df2a1499aa5a9 | False |
| permission-profiles-validator | plugins/foreman-line/permission-profiles/src/validator.ts | 1f12fe53f75b089d25dd27e995af024c52269b0db6b8c4e22c616702749a7d23 | False |
| permission-profiles-readme | plugins/foreman-line/permission-profiles/README.md | b790947a8223daab2babf45cba648f1bfd073d7d0b1e6f524fa02f51dc129f00 | False |

## Independent structural accounting and alias decisions

Read-only exported Markdown projection was executed from unchanged accepted code against old and new source text; it did not call buildRegistry or write generated artifacts. Full projection output is02-source-discovery.json. It exposes an unsafe old behavior rather than an accepted candidate: the inserted note inherits item.two-gate-thesis, and the real thesis is assigned an unbound fresh candidate. The approved future finite selector must intervene before BOTH privileged target lookup and frozen-anchor fallback.

| Unit | Discovered raw candidate / old behavior | Proposed published item | Rules / disposition |
|---|---|---|---|
| M01 | item.e3c4f313970c | item.constraint-14 | rule.standing-constraints.constraint-14; one complete conditional obligation |
| M02 annotation | raw item.8bef504af1db; current unsafe code instead returns item.two-gate-thesis | item.8bef504af1db | no rule; non-normative-explanation, explicit historical annotation |
| M02 relocated thesis | raw item.13c267a420b3 | item.two-gate-thesis | preserve rule.foreman-line-plan.two-gate-thesis and its entire historical semantic shape |
| M03 | item.483a4914f57e | item.483a4914f57e | no rule; preserve non-normative-explanation and original rationale |

Aliases are correspondences, not extra materialized rows. M01's ordinary hashed candidate maps once to the stable numbered identity; no item.e3c4f313970c or extra hashed rule is published. M02's raw paragraph2 candidate maps once to the preexisting thesis identity; no item.13c267a420b3 is published. The note uses the ordinary identity formula at its exact new source location, overriding the privileged old target only for the exact successor tuple. M03 has no additional alias. Prior standing1–13 are each one canonical item with one rule; the existing source has17items, not30items from duplicate specialized discovery. R31 makes that18. The historical plan has157items and becomes158. No heading is added. First-13 identities/values/rules remain unchanged; navigation line hints may move without changing locatorDigest.

### Exact affected item pins and text

These are independent source-projection values and explicitly proposed identities; they are not generated registry acceptance evidence. locatorDigest hashes normalized kind/anchor, while lineHint is a navigation coordinate. Raw discovery candidate IDs include their original location tuple and remain documented even when a finite approved alias selects the published stable identity.

#### M01

```json
{
  "unit": "M01",
  "sourceId": "standing-constraints",
  "rawCandidateItemId": "item.e3c4f313970c",
  "proposedItemId": "item.constraint-14",
  "itemId": "item.constraint-14",
  "locator": {
    "kind": "numbered-item",
    "anchor": "md-block:# Standing Constraints — included by reference in every dispatch kickstarter > ## Builder — conditional:list-item:3",
    "lineHint": 21
  },
  "locatorDigest": "22f088d2c9e1efe1e1f6b620474d795c54c76354b19c1b0508ebd1b31d3b959c",
  "normalizedExcerpt": "14. **Plugin/marketplace parcels:** verify each living install identifier through the declared marketplace entry to an existing plugin source whose nested manifest name equals the requested plugin. A normalized repository URL does not prove that an install command resolves. (#37)",
  "valueDigest": "4f3ee9daa1a008f7002cce5742fa585387976783bb9a1a333f5cd6ab5a1d4d19",
  "ruleIds": [
    "rule.standing-constraints.constraint-14"
  ],
  "exclusionDisposition": null
}
```

#### M02-note

```json
{
  "unit": "M02-note",
  "sourceId": "foreman-line-plan",
  "wrongLegacyProjectionItemId": "item.two-gate-thesis",
  "rawCandidateItemId": "item.8bef504af1db",
  "itemId": "item.8bef504af1db",
  "locator": {
    "kind": "line-excerpt",
    "anchor": "md-block:# The Foreman Line — Master Plugin Plan:paragraph:1",
    "lineHint": 3
  },
  "locatorDigest": "6a99cca27c8da23a9569a3ab65ca4c3f0b29751f420e6a3bfd4ba8969b31c07d",
  "normalizedExcerpt": "> **Repository identity migration (2026-09-06):** Repository identifiers and paths in this historical record were normalized to `m0r6aN/agent-skills`. Recorded commands were not rerun; all other historical outcomes remain as captured.",
  "valueDigest": "9d600b9b44dfe18183d5a668eb46862ab9187395aa35ce43a15d2b9e41e4741d",
  "ruleIds": [],
  "exclusionDisposition": "non-normative-explanation"
}
```

#### M02-thesis

```json
{
  "unit": "M02-thesis",
  "sourceId": "foreman-line-plan",
  "rawCandidateItemId": "item.13c267a420b3",
  "itemId": "item.two-gate-thesis",
  "locator": {
    "kind": "line-excerpt",
    "anchor": "md-block:# The Foreman Line — Master Plugin Plan:paragraph:2",
    "lineHint": 5
  },
  "locatorDigest": "464f7353d3bb900a07fe85436e96f2fd8729dd616c635338c17ed6f3a703875e",
  "normalizedExcerpt": "**Version:** 0.1 (Draft — working name \"the Line\"; rename at will) **Owner:** Clinton Morgan — Principal Agentic AI Platform Architect, KaseyaOne **Status:** Proposed **Thesis:** One orchestrated pipeline from idea to merged code, in which specs are the unit of truth, humans hold exactly two gates (dispatch and merge), every stage emits a verifiable receipt, and the platform layer (model routing, Kompress, audit suite, DocSpine) is wired in by default — not by memory.",
  "valueDigest": "9f09f265b9c38dd2abd8707f94a94d70783e32bcd58c354ff1c1c0446a532d59",
  "ruleIds": [
    "rule.foreman-line-plan.two-gate-thesis"
  ],
  "exclusionDisposition": null
}
```

#### M03

```json
{
  "unit": "M03",
  "sourceId": "foreman-line-plan",
  "itemId": "item.483a4914f57e",
  "locator": {
    "kind": "line-excerpt",
    "anchor": "md-block:# The Foreman Line — Master Plugin Plan > ## 5a. Skill Injection Policy (the execution-plane library):paragraph:1",
    "lineHint": 143
  },
  "locatorDigest": "b209a80af8457ba1a89290fe308c3a65484075080d43cc059692d7044e788647",
  "normalizedExcerpt": "The Line is the conveyor; the skills library is the rack of tools hanging above each station (`agent-skills`, deployed at `~\\.claude\\skills\\`). Skills are wired in through a single mechanism — a versioned **skill injection matrix**, policy-as-code alongside the routing policy — rather than hardcoding each skill into a pipeline stage:",
  "valueDigest": "9bc1d135bbd0ddbb5fedd27f9d7040660d8ad8e94b6ba2ff3da56f86ecd516ad",
  "ruleIds": [],
  "exclusionDisposition": "non-normative-explanation"
}
```

M02 historical thesis before relocation has kind line-excerpt, anchor `md-block:# The Foreman Line — Master Plugin Plan:paragraph:1`, lineHint3, locatorDigest6a99cca27c8da23a9569a3ab65ca4c3f0b29751f420e6a3bfd4ba8969b31c07d and unchanged valueDigest9f09f265b9c38dd2abd8707f94a94d70783e32bcd58c354ff1c1c0446a532d59. Current paragraph2/lineHint5 changes locatorDigest to464f7353d3bb900a07fe85436e96f2fd8729dd616c635338c17ed6f3a703875e. M03's old valueDigest is da9dc34eec1507684380cc49d976e06fc0bf876e5c2406578fe099b317672f42; new valueDigest9bc1d135bbd0ddbb5fedd27f9d7040660d8ad8e94b6ba2ff3da56f86ecd516ad. Its locatorDigest stays b209a80af8457ba1a89290fe308c3a65484075080d43cc059692d7044e788647; lineHint141 becomes143.

## Complete rule shapes and applicability

M01 is one indivisible conditional duty. Splitting off the marketplace, existence, nested-name or URL clauses would permit incomplete interpretations; the literal statement retains all of them, including the plugin/marketplace condition. The subject is a consultation of that conditional verification duty, not a parcel classifier or install authorization. Its literal five axes are goals=[all-foreman-goals], roles=[builder], stages=[any], operations=[any], hosts=[any]. This matches the builder duty across existing axes without inventing parcel kind or claiming the resolver proves a successful installation. No reviewer role is added merely because enforcementOwner is independent-reviewer; owner and applicability have different purposes. No operationId grant, ALLOW, external principal or new human gate is introduced.

Expected isolated applicable query: subject plugin-marketplace.install-identifier-verification, goal foreman-kernel, role builder, stage build, operation repo-read (also explicit external-write consultation control), host unsupported-host: outcome RESOLVED, decision REQUIRE_HUMAN, assurance human-ratified, controllingRuleIds exactly[rule.standing-constraints.constraint-14], authorityClaim as below. This returns the source's conditional review duty, never permission to perform external-write. The same query with role reviewer is nonapplicable. All unrelated legacy subjects remain unchanged and no mixed controlling set with the existing thirteen constraints is created.

Proposed M01 full shape (bindingDigest is independently calculated from this proposed source-authored shape, not generator output):
```json
{
  "ruleId": "rule.standing-constraints.constraint-14",
  "authoritySubject": "plugin-marketplace.install-identifier-verification",
  "authorityClaim": "plugin-marketplace-parcels-require-complete-install-identifier-chain-not-url-only",
  "normalizedStatement": "14. **Plugin/marketplace parcels:** verify each living install identifier through the declared marketplace entry to an existing plugin source whose nested manifest name equals the requested plugin. A normalized repository URL does not prove that an install command resolves. (#37)",
  "sourceRefs": [
    {
      "sourceId": "standing-constraints",
      "itemId": "item.constraint-14",
      "locatorDigest": "22f088d2c9e1efe1e1f6b620474d795c54c76354b19c1b0508ebd1b31d3b959c",
      "valueDigest": "4f3ee9daa1a008f7002cce5742fa585387976783bb9a1a333f5cd6ab5a1d4d19"
    }
  ],
  "authorityBasisRef": {
    "sourceId": "standing-constraints",
    "itemId": "item.constraint-14",
    "locatorDigest": "22f088d2c9e1efe1e1f6b620474d795c54c76354b19c1b0508ebd1b31d3b959c",
    "valueDigest": "4f3ee9daa1a008f7002cce5742fa585387976783bb9a1a333f5cd6ab5a1d4d19"
  },
  "applicability": {
    "goals": [
      "all-foreman-goals"
    ],
    "roles": [
      "builder"
    ],
    "stages": [
      "any"
    ],
    "operations": [
      "any"
    ],
    "hosts": [
      "any"
    ]
  },
  "severity": "critical",
  "classification": "independent-review-human-judgment",
  "decision": "REQUIRE_HUMAN",
  "refusalCode": null,
  "enforcementOwner": "independent-reviewer",
  "assurance": "human-ratified",
  "pairedRuleIds": [],
  "retirementState": "active-reading",
  "retirementEvidence": {
    "predicate": null,
    "negativeRefusalTest": null,
    "corpusSweep": null,
    "independentBypassAttempt": null
  },
  "bindingDigest": "cd409e5b4c139afc93892ef16579d900b5abde76aec1556d3b47ae4ae830a3ca"
}
```

M01 is a separate R31 reservation. Admit human-ratified assurance only after exact reserved identity, complete shape, source pin, typed actual item locator/value and reciprocal membership checks. Preserve IJ's ordinary REQUIRE_HUMAN/independent-reviewer pair. Reserved removal/substitution or mismatch fails AUTHORITY_ESCALATION and never falls through the ordinary IJ independently-verified branch. R30's72reservations and finite correspondence map stay unchanged. M01's statement is the exact normalized excerpt and refs=[basis] only, so no R30.8 paraphrase waiver, R30.9 corroborating-edge exception or component suffix exception is needed.

The preserved thesis keeps every semantic field, assurance narrative, historical-only retirement, all five literal enum-ordered arrays, source effect historical, and sole designated basis. Only both occurrences of its current SourceRef locatorDigest change, plus the computed bindingDigest. Its full successor shape follows; the complete before shape is04-step0-proposed-contract.json:thesisBefore. Its isolated historical/provenance subject never controls resolver authority; preserve existing NO_APPLICABLE_AUTHORITY behavior when isolated, not an ALLOW or a new narrative API.
```json
{
  "ruleId": "rule.foreman-line-plan.two-gate-thesis",
  "authoritySubject": "gate.namespace",
  "authorityClaim": "historical-two-stage-gates",
  "normalizedStatement": "**Version:** 0.1 (Draft — working name \"the Line\"; rename at will) **Owner:** Clinton Morgan — Principal Agentic AI Platform Architect, KaseyaOne **Status:** Proposed **Thesis:** One orchestrated pipeline from idea to merged code, in which specs are the unit of truth, humans hold exactly two gates (dispatch and merge), every stage emits a verifiable receipt, and the platform layer (model routing, Kompress, audit suite, DocSpine) is wired in by default — not by memory.",
  "sourceRefs": [
    {
      "sourceId": "foreman-line-plan",
      "itemId": "item.two-gate-thesis",
      "locatorDigest": "464f7353d3bb900a07fe85436e96f2fd8729dd616c635338c17ed6f3a703875e",
      "valueDigest": "9f09f265b9c38dd2abd8707f94a94d70783e32bcd58c354ff1c1c0446a532d59"
    }
  ],
  "authorityBasisRef": {
    "sourceId": "foreman-line-plan",
    "itemId": "item.two-gate-thesis",
    "locatorDigest": "464f7353d3bb900a07fe85436e96f2fd8729dd616c635338c17ed6f3a703875e",
    "valueDigest": "9f09f265b9c38dd2abd8707f94a94d70783e32bcd58c354ff1c1c0446a532d59"
  },
  "applicability": {
    "goals": [
      "all-foreman-goals"
    ],
    "roles": [
      "developer",
      "coordinator",
      "shaper",
      "builder",
      "reviewer",
      "ci",
      "host-adapter",
      "kernel",
      "operator"
    ],
    "stages": [
      "stage-zero",
      "shaping",
      "step-zero",
      "build",
      "deterministic-verify",
      "adversarial-review",
      "merge",
      "closure",
      "runtime"
    ],
    "operations": [
      "source-inventory",
      "spec-mutation",
      "repo-read",
      "repo-mutation",
      "state-transition",
      "control-call",
      "receipt-validation",
      "external-write"
    ],
    "hosts": [
      "provider-neutral",
      "claude-windows-docker-loaded",
      "claude-windows-docker-unenrolled",
      "unsupported-host",
      "ci"
    ]
  },
  "severity": "medium",
  "classification": "narrative-provenance",
  "decision": "ADVISORY",
  "refusalCode": null,
  "enforcementOwner": "provenance-only",
  "assurance": "narrative",
  "pairedRuleIds": [],
  "retirementState": "historical-only",
  "retirementEvidence": {
    "predicate": null,
    "negativeRefusalTest": null,
    "corpusSweep": null,
    "independentBypassAttempt": null
  },
  "bindingDigest": "2a603de7e4b87897cdebca094241430df41f0aa3c04ce244666aac7bc3a5379c"
}
```

Annotation and M03 publish no rule, have no authority subject/claim/owner/assurance, and cannot satisfy gates or grant installation authority. Their inventory exclusion is the existing legal enum non-normative-explanation; there is no historical-context enum or schema expansion. The initial evidence03 draft used descriptive historical-context/map labels; that unvalidated draft is preserved separately and corrected in04 to non-normative-explanation/publish before this reviewable mapping.

## Exact audit and reciprocal-edge mapping

Append these four source-authored audit rows after the unchanged198R30rows. M02 is one edited source unit but requires two dispositions: annotation exclusion and relocated thesis publication. M03's explicit value-correction exclusion is separately audited. This deliberate denominator is4, not inferred from generated candidate counts. SourceRefs and authorityBasisRef must deep-equal the exact complete tuples above; counts alone cannot accept swapped edges. Inventory ruleIds are exactly: M01=[constraint14], note=[], thesis=[two-gate-thesis], M03=[]. Every other inventory ruleIds array is unchanged. There are zero new corroborating edges, one new rule→item edge, and the preserved thesis's edge retains item identity while its locator binding moves.
```json
[
  {
    "sourceId": "standing-constraints",
    "itemId": "item.constraint-14",
    "valueDigest": "4f3ee9daa1a008f7002cce5742fa585387976783bb9a1a333f5cd6ab5a1d4d19",
    "disposition": "publish",
    "ruleIds": [
      "rule.standing-constraints.constraint-14"
    ],
    "exclusionCode": null,
    "rationale": "Exact upstream conditional builder obligation14 is mapped without an install grant."
  },
  {
    "sourceId": "foreman-line-plan",
    "itemId": "item.8bef504af1db",
    "valueDigest": "9d600b9b44dfe18183d5a668eb46862ab9187395aa35ce43a15d2b9e41e4741d",
    "disposition": "exclude",
    "ruleIds": [],
    "exclusionCode": "non-normative-explanation",
    "rationale": "The repository-identity annotation records historical normalization and expressly disclaims rerun evidence."
  },
  {
    "sourceId": "foreman-line-plan",
    "itemId": "item.two-gate-thesis",
    "valueDigest": "9f09f265b9c38dd2abd8707f94a94d70783e32bcd58c354ff1c1c0446a532d59",
    "disposition": "publish",
    "ruleIds": [
      "rule.foreman-line-plan.two-gate-thesis"
    ],
    "exclusionCode": null,
    "rationale": "The unchanged historical thesis keeps its original identity at the approved paragraph2 location."
  },
  {
    "sourceId": "foreman-line-plan",
    "itemId": "item.483a4914f57e",
    "valueDigest": "9bc1d135bbd0ddbb5fedd27f9d7040660d8ad8e94b6ba2ff3da56f86ecd516ad",
    "disposition": "exclude",
    "ruleIds": [],
    "exclusionCode": "non-normative-explanation",
    "rationale": "The historical library-name correction remains explanatory context and supplies no new live authority."
  }
]
```

## Independent expected totals, before any generation

| Measure | Accepted R30 | R31 proposal | Delta / reason |
|---|---:|---:|---|
| Sources |18|18|same exact IDs/paths;2blob replacements|
| Inventory items |1583|1585|M01 and note +2; thesis relocation is not an added row|
| Rules |541|542|only complete M01 +1|
| Audit records |198|202|four exact affected-item dispositions|
| Reconciliations |20|21|one append; all20canonical records preserved|
| Existing item value changes |0|1|M03 only; thesis's actual text is unchanged|
| Existing locator-identity changes |0|1|actual thesis paragraph1→2 only|
| Existing rule binding changes |0|1|two-gate-thesis only|
| Item/rule removals |0|0|all accepted identities preserved|

Classes become276PR,13PD,78CI,53IJ,109NP,13unsupported, total542. No new NP rule is introduced by the note. All72R30shapes and all old standing1–13 semantic values remain byte-canonical identical. The new thesis binding is2a603de7e4b87897cdebca094241430df41f0aa3c04ce244666aac7bc3a5379c; M01 binding iscd409e5b4c139afc93892ef16579d900b5abde76aec1556d3b47ae4ae830a3ca. Source snapshot metadata advances for all18 sources, while only2content hashes change. Other physical line hints shift (+1 reviewer rows; +2 plan content after note), but do not count as locator identities or additional source edits.

## Finite relocation and identity algorithm preservation

Use a narrowly named trusted R31 source-unit table in src/registry.ts, including exact sourceSnapshotCommit8d5007, source IDs/paths and approved snapshot fullFileSha256, typed locator kind/anchor, normalized value digest, explicit candidate→published mapping, expected rule IDs and full shapes. Historical selector evidence is source65c with accepted implementation446700d/accepted registryc35; it is a pinned historical test subject, not a caller-controlled historical generation mode.

For the successor, sourceSnapshotCommit is the exact8d5007constant; raw mutable HEAD or caller arguments never select the branch. Match M01's exact conditional list-item3 to item.constraint-14; match note paragraph1 plus exact approved note value to item.8bef504af1db; match thesis paragraph2 plus exact thesis value to item.two-gate-thesis. Unknown source pins, swapped values, missing/duplicate/extra paragraphs or mismatched tuples must throw/refuse explicitly at reserved boundaries before old special cases or frozen lookup. Keep lineHint navigational; source-version and identity/value assertions use the pinned snapshot and actual semantic locator/value, preserving ordinary benign formatting semantics where unchanged.

Do not globally replace R12's historical paragraph1 target. Select a separate finite current target for the thesis and apply it consistently to itemIdFor, frozenMarkdownItemIds seed/lookup collision handling, legacyRuleIdsFor, curation/copy of prior thesis semantics, markdownIdentityProjectionForTesting, buildSource, validator's R12-target check and source sweep's expected block identity. Existing hash algorithm and unrelated target map remain unchanged. Pin the exact prior446700dregistry when preserving newly accepted R30 anchors; if a prior anchor is ambiguous, fail rather than choose a value heuristically. The two title-level slots require explicit finite source-version mapping before this ordinary anchor freeze, so the annotation cannot inherit the old thesis name through a second path.

All consumers must resolve the same trusted finite tuple; validators rederive actual normalized excerpt digest and typed locator rather than trust copied valueDigest. Require exact unique current thesis and note inventory membership, exact current rule/basis/ordered refs, and the correct source authority shape. Preserve all R30 pins and no-fallback rules. No generic search for the word Thesis, blanket item-ID exception, extra volatile region, alias duplication or broad source-hash waiver is allowed.

## Historical evidence and migration-head preservation

Load the complete accepted registry from exact prior registry-changing446700d, independently equal to acceptedc35package bytes. Copy all20reconciliations without reconstruction. Preserve current head registry-rework-66a514d under its existing canonical pin6d39f17f70b25ce44030e729c62d975b45a8597b99af8c22f19c6a3cbfba92d7 and register it as a required pinned historical record. Append exactly registry-rework-446700d. The new head's eventual canonical pin is computed from the reviewed final record for future demotion; never substitute a manifest hash or rewrite its predecessor's content. Prior binding manifest is7f122f6ddecc916582ca299b48f8eedc23c813a960f28f2b786c76e343d90d2b. The independent in-memory source-authored proposed manifest is specified below; no candidate generator output is used as its own expected evidence.

The sole old reconciliation with observedRef item.two-gate-thesis is frozen pre-R12 gate-namespace-count. Its historical ref is locatorDigestc234b89e0d8abd7ad1f32fc63581b5aeabb6accde83549b92e69f91e3cd30aad/valueDigestf6a643b044b41c84ad751f6bf817b19847b012049dd6753cc892c980749c900f, not either current structural paragraph digest. Preserve that entire frozen record and its own snapshot resolution exactly. Existing frozenPreR12Record handling already avoids retargeting it to current inventory; inspect and retain that narrow mechanism. No new generic LEGACY_RECONCILIATION_SOURCE_REFS waiver is presently justified. If an actual probe finds a separate unresolved historical ref, return the exact record ID/ref/snapshot for coordinator review before adding compatibility.

The historical positive reads/runs the pinned prior implementation and source65c in an isolated historical fixture, or directly compares its committed source projection/registry linkage as the coordinator decision permits. It proves paragraph1 linked to actual thesis under that subject. The successor positive proves paragraph2 under8d5007. Neither requires the successor to regenerate arbitrary historical full registries.

Canonical preservation pins for all20accepted records:

| Record | Canonical SHA256 |
|---|---|
| gate-namespace-count | 23f3549859f81eddfd5645dc3de3ffe07997c624cd75d61d3410645b710968d3 |
| gate3-delegation | 13f5094dc781381ad5c1124f094af5f6f57b462c73df3fd3925e2b844c3f53c6 |
| spec-linter-profile-behavior | 48c147ae850d5779e763c187ee9381bc2b824e299764eeb15869f57dce2e553c |
| surfaces-allowed-files | c7addc8070757f6da21ae15354139d2a39c6f5db2dc164d2534305e0f944d7c1 |
| permission-profile-enforcement-bound | 6558689b94ae965d85c60cef8cc7d9086278f38c755276b74953d2613440eda2 |
| missing-provenance-reference | ed49c8796d80a450fbb272d7aaba9c1159225e54bbf5d96e0a441cf757135b80 |
| registry-rework-6eb1c25 | c2b4971fd67a81df51ab33931fda17122c06de67ce5cc6ef857380704348fd6d |
| registry-rework-9285945 | fc10cc1e7f98635521a8fbc65ba34895415b8901d62c49790b8b3e7337fd3fb1 |
| registry-rework-6f45963 | 3954ba2fc23122f82f6d68e294a180b8dc789983e2bb3da0198c79f8550513d9 |
| registry-rework-b414d06 | 8a7c1fdd61cbb664d6c9b1b0aefcba1dc35dc26873eff711bbfada8480247d7f |
| registry-rework-00b41b7 | 7113ebbad6811a3dfd4f14302f736ac11074c04943686eea28a1de820c75e9c9 |
| registry-rework-37afc65 | 5f3bba04f9177884da88d21a8535d3ebc04557252aa27b30cbb191824e0b0f17 |
| registry-rework-91145d7 | 6b6e2dbd3b009428c647ed8947ba5d7008445dabdcccdde7d135466b9f46f3e3 |
| registry-rework-1b42f4b | 14bb9b5739d37281619e6ace7ea9e5d0f6fd0febeecf3facc892e1a606795a56 |
| registry-rework-ee29973 | b9a3ed7f9eaa25468df8557fb812ae343910a481450411928b8abe5d4e216bb3 |
| registry-rework-544d8a3 | d04e710f14c6f7b9978662161c1bba011a11fe862138dd73e5e477594751fd9d |
| registry-rework-0683bc0 | f1a7ee84cb618300079786833537fef4494e093970cffc1ead8d1d66e2bd6aa9 |
| registry-rework-df8155a | ca5015f0446edbc5e1d7055357dac8d60cc87b4d283f0bba9ce26c15b40d88d2 |
| registry-rework-40394be | 307a1b563240107c5a12610e18b340e66f3be0621e6bc30b438ae79af91b4bfd |
| registry-rework-66a514d | 6d39f17f70b25ce44030e729c62d975b45a8597b99af8c22f19c6a3cbfba92d7 |

### R31.5 exact migration evidence, after independent contract review

R31.5 was ratified at coordinator75144b9 and integrated locally in metadata-only HEAD99c8f1c19ffc5dcba1fcebd0fdf4abadb5e9ef23. Read R31-migration-evidence-ruling-20260907.md and its independent review. Source8d, all18source bytes and package code remain unchanged. The following is the exact proposed record for mapping review, not an assertion that implementation is dispatched or that the plan-decision blob already contains later rulings.

The source-authored item/rule/audit proposal was applied only in memory to accepted registry446700d. No generator function or shipped artifact writer ran. Preserve source, item and rule order; insert M01 immediately before constraint8 in standing inventory and global rule order, note immediately before retained thesis; append four audit rows M01,note,thesis,M03. This deterministic independent proposal produces binding manifest605f9c370c62cdbf619d1f65583a2404311d69cfc8c0fcc7c7867959b4adf4d5 from prior7f122f6ddecc916582ca299b48f8eedc23c813a960f28f2b786c76e343d90d2b. Future generation must match this reviewed semantic expectation rather than choose its own manifest as the oracle. The proposed complete new record canonical SHA256 is73b921477e09f2bcf20c4cf27d182221746c6cd85e2948a82f573e465177bf33; it is proposed, not yet a shipped pin.

Decision diagnostic input bytes are UTF-8 of this canonical JSON, with sorted keys, no BOM and no trailing newline:

```json
{"commit":"8d500704c9e3d6d8b652bbe838aa3623f88203fc","path":"plugins/foreman-line/docs/goals/foreman-kernel/R31-coordinator-decision-20260907.md"}
```

Input SHA2567095b8623ecfbab4d383046d19111a0c99580f94e2b03ca20f0dd1eb02639e69. Result SHA256974c26657ef1cfab3c7a72cdb552e1e979ac9534832acb7009d5d0f74c776e9f is the actual binary Git blob returned by `git show 8d500704c9e3d6d8b652bbe838aa3623f88203fc:plugins/foreman-line/docs/goals/foreman-kernel/R31-coordinator-decision-20260907.md`, captured with execFileSync Buffer before decoding. It is not a hash of rewritten approval prose or a mutable working file. The command-result uses the registry tool's planned typed custody diagnostic, not a claim that the generic validator already authenticates Git content. Its exact seven-field JSON and outer evidence digest appear below.

The finite R31validator must compare the entire diagnostic tuple and exact full new record, including ordered five refs/two rule IDs/evidence/prose; the repository-aware sweep/evidence check must independently read the actual decision Git blob at the fixed commit/path and compare its byte digest. No global generic-command interpretation changes. Independently repair outer digests/manifests after removing the diagnostic; substituting another commit/path/input/result/actor/commandId/tool/toolVersion/exitCode; reordering/adding evidence; or changing the recorded decision meaning. Every case must refuse. A correct diagnostic paired with bad source/migration/protected-operation evidence still refuses.

Only prior446700d and source8d are Git-commit evidence entries; their body digests below are SHA256 of actual `git cat-file -p <commit>` byte streams. The supporting command does not add a nineteenth source or a third commit. Source8d decision ratifies plan106fd58 only. Later R31.5, mapping approval and implementation dispatch remain separately recorded. M01 is representative changed-corpus evidence, L01 remains noncontrolling delegation provenance, and neither is an installation grant. The historical thesis is an observed changed-location subject, not a newly controlling authority.

Exact proposed record:
```json
{
  "reconciliationId": "registry-rework-446700d",
  "topic": "R30 registry bindings superseded by the coordinator-ratified finite R31 source adoption.",
  "observedRefs": [
    {
      "sourceId": "standing-constraints",
      "itemId": "item.constraint-14",
      "locatorDigest": "22f088d2c9e1efe1e1f6b620474d795c54c76354b19c1b0508ebd1b31d3b959c",
      "valueDigest": "4f3ee9daa1a008f7002cce5742fa585387976783bb9a1a333f5cd6ab5a1d4d19"
    },
    {
      "sourceId": "foreman-line-plan",
      "itemId": "item.8bef504af1db",
      "locatorDigest": "6a99cca27c8da23a9569a3ab65ca4c3f0b29751f420e6a3bfd4ba8969b31c07d",
      "valueDigest": "9d600b9b44dfe18183d5a668eb46862ab9187395aa35ce43a15d2b9e41e4741d"
    },
    {
      "sourceId": "foreman-line-plan",
      "itemId": "item.two-gate-thesis",
      "locatorDigest": "464f7353d3bb900a07fe85436e96f2fd8729dd616c635338c17ed6f3a703875e",
      "valueDigest": "9f09f265b9c38dd2abd8707f94a94d70783e32bcd58c354ff1c1c0446a532d59"
    },
    {
      "sourceId": "foreman-line-plan",
      "itemId": "item.483a4914f57e",
      "locatorDigest": "b209a80af8457ba1a89290fe308c3a65484075080d43cc059692d7044e788647",
      "valueDigest": "9bc1d135bbd0ddbb5fedd27f9d7040660d8ad8e94b6ba2ff3da56f86ecd516ad"
    },
    {
      "sourceId": "fk-loop-directive",
      "itemId": "item.c98e1f76aeb5",
      "locatorDigest": "1388a84f45baa2148f545913cc7c750ae1e2deb65ca58db0de74ed4824c00588",
      "valueDigest": "f8efec1d5b8607c1af4634545b805ef6fff99f1b18a615575b37b10fd07a0146"
    }
  ],
  "observedEvidence": [
    {
      "kind": "git-commit",
      "reference": "446700d47c2e162fcfa575d5a46b9247241a59c1",
      "digest": "bb421f8e3d3baba8781937f302d42210262a72ed874f756a72e527767b462e05"
    },
    {
      "kind": "git-commit",
      "reference": "8d500704c9e3d6d8b652bbe838aa3623f88203fc",
      "digest": "81070168ff53c12d3cc94020d76da1dbcbfde5a460b579e74d14f258cc4c2a71"
    },
    {
      "kind": "command-result",
      "reference": "{\"actorClass\":\"coordinator\",\"commandId\":\"registry-binding-manifest-r30\",\"exitCode\":0,\"inputDigest\":\"43d3dfe4823498282c484ef4a614bef918b89543ca80fc14bc0548bf2281eae5\",\"resultDigest\":\"7f122f6ddecc916582ca299b48f8eedc23c813a960f28f2b786c76e343d90d2b\",\"tool\":\"@foreman-line/authority-registry\",\"toolVersion\":\"0.1.0\"}",
      "digest": "b0a426bb57a320f5c2379df4b0272fc356dc7dfc28d7f3ff42c4785bdc257d8c"
    },
    {
      "kind": "command-result",
      "reference": "{\"actorClass\":\"coordinator\",\"commandId\":\"superseding-binding-manifest-r31\",\"exitCode\":0,\"inputDigest\":\"7f122f6ddecc916582ca299b48f8eedc23c813a960f28f2b786c76e343d90d2b\",\"resultDigest\":\"605f9c370c62cdbf619d1f65583a2404311d69cfc8c0fcc7c7867959b4adf4d5\",\"tool\":\"@foreman-line/authority-registry\",\"toolVersion\":\"0.1.0\"}",
      "digest": "c486ecceac7f2d3205cc044ff2a5d3c49d5669c72aea6b35600de19d91400be5"
    },
    {
      "kind": "command-result",
      "reference": "{\"actorClass\":\"coordinator\",\"commandId\":\"r31-plan-decision-git-blob\",\"exitCode\":0,\"inputDigest\":\"7095b8623ecfbab4d383046d19111a0c99580f94e2b03ca20f0dd1eb02639e69\",\"resultDigest\":\"974c26657ef1cfab3c7a72cdb552e1e979ac9534832acb7009d5d0f74c776e9f\",\"tool\":\"@foreman-line/authority-registry\",\"toolVersion\":\"0.1.0\"}",
      "digest": "d44523e9f8d044c45f6138d5df68c521ea8f359674e40aea874df8bf2c7d8ee4"
    }
  ],
  "authoritativeRuleIds": [
    "rule.standing-constraints.constraint-14",
    "rule.fk-loop-directive.c98e1f76aeb5.continuation"
  ],
  "scopedDisposition": "R31 adopts two exact upstream source blobs within the unchanged eighteen-source set under the externally recorded coordinator ratification of finite plan106fd58 and existing continuation delegation. The decision blob at source8d ratifies that plan only; later mapping approval and implementation dispatch are separately recorded and are not attributed to the old decision. Add the complete conditional plugin/marketplace verification requirement without an install grant. Add the distinct historical repository annotation, relocate the unchanged historical thesis from paragraph1 to paragraph2 while preserving its identity and authority effect, and correct the historical library-name value without new policy or deployment evidence. Preserve all twenty prior reconciliation records canonically, including historical thirteen-standing-rule statements; current coverage becomes fourteen. Add two inventory items, one rule and four audit dispositions; change one existing value and one existing locator binding. M01 is representative changed-corpus evidence, not ratification of the entire amendment. L01 remains noncontrolling provenance, and the supporting diagnostic establishes Git-blob custody only.",
  "unresolvedConsequence": "Future binding changes require another typed prior-to-new migration. Independent mapping review and a separately recorded implementation ruling remain prerequisites; complete verification, fresh independent reviews and human Gate3 remain mandatory. No diagnostic, source annotation or record membership grants operational authority, proves installation verification, or claims historical commands were rerun.",
  "migrationStatus": "superseded-by-amendment",
  "supersedingEvidence": {
    "sourceId": "standing-constraints",
    "itemId": "item.constraint-14",
    "locatorDigest": "22f088d2c9e1efe1e1f6b620474d795c54c76354b19c1b0508ebd1b31d3b959c",
    "valueDigest": "4f3ee9daa1a008f7002cce5742fa585387976783bb9a1a333f5cd6ab5a1d4d19"
  }
}
```

Exact preserved L01 full shape, pinned separately from record membership:

```json
{
  "ruleId": "rule.fk-loop-directive.c98e1f76aeb5.continuation",
  "authoritySubject": "goal.continuation.scoped-decision-authority",
  "authorityClaim": "covered-coordinator-decisions-need-no-repeat-permission",
  "normalizedStatement": "The recorded developer instruction authorizes this coordinator's needed non-destructive decisions/actions within the existing goal without repeated permission requests.",
  "sourceRefs": [
    {
      "sourceId": "fk-loop-directive",
      "itemId": "item.c98e1f76aeb5",
      "locatorDigest": "1388a84f45baa2148f545913cc7c750ae1e2deb65ca58db0de74ed4824c00588",
      "valueDigest": "f8efec1d5b8607c1af4634545b805ef6fff99f1b18a615575b37b10fd07a0146"
    }
  ],
  "authorityBasisRef": {
    "sourceId": "fk-loop-directive",
    "itemId": "item.c98e1f76aeb5",
    "locatorDigest": "1388a84f45baa2148f545913cc7c750ae1e2deb65ca58db0de74ed4824c00588",
    "valueDigest": "f8efec1d5b8607c1af4634545b805ef6fff99f1b18a615575b37b10fd07a0146"
  },
  "applicability": {
    "goals": [
      "foreman-kernel"
    ],
    "roles": [
      "coordinator"
    ],
    "stages": [
      "stage-zero",
      "shaping",
      "step-zero",
      "build",
      "deterministic-verify",
      "adversarial-review",
      "merge",
      "closure"
    ],
    "operations": [
      "source-inventory",
      "spec-mutation",
      "repo-read",
      "repo-mutation",
      "state-transition",
      "external-write"
    ],
    "hosts": [
      "any"
    ]
  },
  "severity": "critical",
  "classification": "narrative-provenance",
  "decision": "ADVISORY",
  "refusalCode": null,
  "enforcementOwner": "provenance-only",
  "assurance": "human-ratified",
  "pairedRuleIds": [],
  "retirementState": "active-reading",
  "retirementEvidence": {
    "predicate": null,
    "negativeRefusalTest": null,
    "corpusSweep": null,
    "independentBypassAttempt": null
  },
  "bindingDigest": "088cb025312c0789567e682f124b98e4a614e9cab231f8e3e9bcc1d522c10735"
}
```

Negative controls must reject promotion of L01 or the thesis to controlling grants, including with repaired incidental digests. Record membership never overrides the existing narrative/historical eligibility filters.


## Test migration inventory and required controls

Retain the complete meaningful686R30coverage. Preserve historical expectations by loading the exact accepted R30fixture when the assertion describes R30's541/1583/198/20counts,72-addition delta or19-preserved-plus-one history. Current-only R31 assertions separately require542/1585/202/21and20preserved-plus-one. Do not merely replace numeric expectations across the suite.

- Existing R5 standing semantic-subject/applicability tests cover1–13; preserve them and add explicit14current identity/condition/query coverage. Historical missing-provenance-reference's thirteen inline rule IDs and prose remain unchanged. The active overlay is the source for current14coverage.
- Corpus numbered-rule current coverage becomes1–14; the additive unadopted constraint fixture becomes15, with its mutation and named uncovered-source refusal verified. No removal of the old coverage test.
- R30 all72shape/ordered-ref oracle remains applicable unchanged. R30 exact reciprocal set/delta tests must preserve the exact accepted R30subject and additionally verify current R31adds only the single separately approved M01edge; do not broadly exclude every newly seen rule. The four R31audit rows are independently expected.
- R30 baseline/current delta and history tests gain an explicit accepted R30fixture for their old subject. Mutation tests against live reserved R30shapes remain live, with current-head manifest repair updated narrowly to registry-rework-446700d. Existing R22 current-head rewrite test already uses actual beforeTopic, and must keep all20historical records unchanged.
- Historical thesis positive uses pinned prior implementation/source/registry; successor current-target test uses the exact finite8dtuple. Existing no-heading and legacy literal-basis assertions remain strict; no new basis paraphrase exception is introduced.

Required added controls, independently named before implementation: exact M01shape, exact four item/audit/ref sets and predicted counts; builder applicable/unsupported-host query and reviewer nonapplicability; isolated annotation/M03 no-rule/noncontrol; independently remove condition, weaken the each-living-identifier quantifier to a sample, remove the marketplace entry link, source existence, nested-name equality and URL-insufficiency clauses; change source identity/location/value with repaired incidental digests; change M01assurance to independently-verified and change decision/owner/severity/applicability/pairing/retirement; remove/substitute reserved constraint14; unadopted constraint15; swap note/thesis IDs in both directions; duplicate/loss of thesis ID; stale paragraph1 current basis/ref; grant note the thesis rule; change note value or source snapshot; insert a further title paragraph; change actual thesis value; promote historical plan source to binding/ALLOW; promote M03 exclusion to live authority; historical paragraph1 positive and current paragraph2 positive; all16unchanged source blobs; all20canonical records preserved; old-head rewrite while appending; tree-as-commit substitution; missing/wrong-predecessor migration; second unregistered append; exact mapped shape plus independently bad protected-operation/chain evidence still refuses. Test names/count additions will be recorded before the full run; baseline686 is a floor, not an excuse to skip any named invariant.

## Implementation sequence after ruling

1. Add red source-authored oracle/control assertions in the existing semantic/corpus tests. They must demonstrate the current note/thesis collision and missing14 before implementation. Preserve full failures with direct exits/timing.
2. Implement only finite R31identity/source/fullshape tables and consistent generator/validator consumers; preserve R30tables and every historical source/ref semantics. Check M01complete-chain and M02swap/drift refusal before generation.
3. Implement reviewed migration evidence,20-record preservation/required old-head pin/new-head append, plus exact four audit rows. Confirm independently expected counts and only one old rule binding/one old item value/one old locator change.
4. Generate once to the three existing permitted artifacts; compare to predeclared mapping. Update README and narrowly migrate historical tests, preserving old controls and all nine-file boundaries.
5. Commit a reviewable code checkpoint; run serialized supported-host npm ci/typecheck/full suite/Biome/CLIvalidate/full sweep/two deterministic generation passes, source/lock/package hashes and exact edge/history/count evidence. Preserve every failure/canceled run honestly; no pass before direct exit. Commit evidence after green and obtain two fresh final reviews. No actual main merge or Gate3claim.

## Current limitations and stop state

This is Step0 only: no new registry was generated, no package/source/spec bytes edited, no tests or full acceptance chain claimed, and no commit made. npm ci and source-projection/proposed-shape read-only probes are preparation evidence. Full snapshot working-byte comparison matched18/18. The historical ref preservation analysis is static, so its runtime proof remains required during implementation. Migration supporting-evidence semantics are now ratified in R31.5; the exact diagnostic/record, audit4 and finite alias choices below remain proposals pending independent mapping review. The exact package hash readback accompanies the final Step0 handoff. The builder stops here for that review and recorded ruling.

## Independent expectation cross-check and complete preservation denominator

After preparing the mapping, read the separately authored R31-source-expectations-20260907.md at coordinator commit74c68cb from the coordinator tree. That author did not read this pending mapping. Its three-unit/two-added-body denominator, proposed numbered14family, exact old thesis value/classification and M03value/exclusion match this proposal. The chosen M02representation is the legal explicit non-normative exclusion permitted by the ratified plan; no new narrative rule is claimed. Four audit rows and exact successor IDs/counts remain proposed for mapping review.

06-complete-item-correspondence.json independently enumerates all174accepted items in the two changed sources plus2proposed additions:176rows total. It explicitly accounts for172preserved semantic identities/values,1relocated unchanged thesis,1changed-value M03,2additions and162navigation lineHint changes. Every before/expectedAfter row includes full typed locator, normalized text/value digest, ruleIds and exclusion disposition; raw and approved aliases are retained in04. The other1409accepted inventory items belong to unchanged source blobs and remain identical. No item is silently omitted or materialized twice. All13old standing rules and their canonical anchors are present in the complete correspondence, separate from the new14item; the intro is not a substitute.

### Additional explicit current-versus-historical test migration boundaries

Keep whole-current-sample validator/resolver tests pointed at the live successor; never retarget a generic sample() helper to an old fixture. Localized tests whose subject is R30's1583/541/198/20counts or the pre-R30baseline0ee/66a→R30seventy-two-rule delta must explicitly load pinned acceptedR30source/registry and retain that exact historical assertion. Separately add an independently authored prior446700d→current R31oracle covering all174old affected-source items plus2new, exactly1newrule/1oldbindingchange,4audit additions and every exact new/refreshed reference. Its expected subject is the four-unit table and independent source expectation supplement, not generated output.

The existing R30reciprocal oracle iterates every inventory item; adding M01 must not be handled by silently ignoring unknown current items. Preserve its complete R30fixture assertion and live72reserved-shape/ref checks, then compose the separately enumerated R31M01edge with the old exact edge set for every current inventory item. Unknown extra items/edges/aliases still fail. Preserve20historical records and current live head mutation/refusal controls. Run the focused affected R30counts/delta/reciprocity/history plus R31exact correspondence/diagnostic controls before the expensive full suite. All686prior controls retain their original meaning even where their explicit historical subject is named.
