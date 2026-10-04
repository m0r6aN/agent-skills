# Changelog — @foreman-line/role-authority

All notable changes to this package's contracts are recorded here. Every
bump states its major/minor classification; a major bump additionally lists
every already-dispatched parcel flagged for re-check under D26 (a model
upgrade or registry-key change does not automatically become production
default).

## v1 — 2026-09-01 (minor: initial release)

- Initial release. `apiVersion: role-authority.kaseya/v1`.
- Ships the eight enforceable concepts named by AC1/AC2: role identity
  (`RoleIdentity`, carrying the D2/D4/D6 registry-key binding as an open
  `string`), risk-class enum (`RiskClass`, D18), role-category enum
  (`RoleCategory`, D16), family-diversity rule (`ModelFamilyDiversityRule`,
  D21), authority flag (`RoleAuthority`, D20), serialization-point ownership
  (`SerializationPointOwnership`, D33), data-classification eligibility
  shape (`DataClassificationEligibility`, D34), and this versioning record
  shape itself (`VersionBumpRecord`).
- No prior major to flag parcels against (first release).
