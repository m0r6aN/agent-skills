/**
 * HRO-P4b (MRC-10) — evidence-backed configuration-repair proposals.
 * PROPOSAL ONLY (ruling D): this module NEVER reads or writes host
 * configuration. It is a pure generator over caller-supplied typed inputs
 * (documents arrive as bytes + content hash — the MRC-06 C2 input-seam
 * pattern) and a reference apply that performs I/O only through an injected
 * seam (the mock/temp writer ruling D permits, C5.3). The artifact is
 * `PROPOSED-NOT-WRITTEN` forever (PMC discipline); applying it to the real
 * host configuration is PMC's authorized writer behind named gates, and this
 * module grants, claims, or infers no write authority.
 *
 * Scope of one call: one verified provider model (approved mapping + named
 * catalog observation) missing from the supplied local configuration view.
 * The emitted diff is MINIMAL — exactly the `add` operations required to
 * configure the model (enablement at the `provider:model` spelling; a
 * declaration entry only when a `PiModelsEntryContract` is supplied), each
 * with named provenance. An unestablished host contract is never assumed: the
 * declaration entry is contract-parameterized or a fail-closed residual.
 *
 * Honesty rules carried from HRO-P1: mapping identity fields are carried
 * exactly (null stays null, never derived); absent provenance is honest
 * unknown (never imputed); freshness is carried as data and never re-derived;
 * identical inputs plus the injected clock yield a byte-identical artifact
 * and digest; duplicate evidence coalesces to one change per (role, locator);
 * an already-configured model returns `no-action`; an invalid source is a
 * repair failure, never permission to replace; secrets and configuration
 * contents stay off every redacted surface.
 *
 * The one digest formula: `proposal_digest` is `documentDigest` over the
 * artifact minus its digest field (`route-receipt.ts` — never a second
 * scheme).
 */

import { isAbsolute, relative, resolve, sep } from 'node:path'
import type {
  ProposedChange,
  ProvenanceRef,
  ResidualDisposition,
} from './host-settings-proposal.js'
import type { PiOpenRouterProvenance } from './pi-openrouter.js'
import { documentDigest } from './route-receipt.js'
import type { DeclaredEvidence } from './types.js'

// ---------------------------------------------------------------------------
// Vocabulary (module-owned; the `LAUNCH_REFUSALS` domain-file precedent — the
// vocabulary home `types.ts` is deliberately not touched). Every name below is
// emitted by exactly one named negative control (the RB-5 pattern).
// ---------------------------------------------------------------------------

export const CONFIG_REPAIR_REFUSALS = [
  'PROPOSAL_DIGEST_MISMATCH_REFUSED',
  'SOURCE_INVALID_REFUSED',
  'SOURCE_HASH_MISMATCH_REFUSED',
  'TARGET_SCOPE_MISMATCH_REFUSED',
  'EVIDENCE_INSUFFICIENT_REFUSED',
] as const

export type ConfigRepairRefusalName = (typeof CONFIG_REPAIR_REFUSALS)[number]

type DocumentRole = 'pi-settings' | 'pi-models-declaration'

// ---------------------------------------------------------------------------
// Typed inputs (C1.2) — pure, side-band; the module opens no file.
// ---------------------------------------------------------------------------

/** One observed source document: opaque bytes + hash + observation time. */
export interface SourceState {
  readonly role: DocumentRole
  readonly text: string
  readonly content_hash: string
  readonly observed_at: string
}

/** The observed local configuration state (bytes supplied by the caller). */
export interface LocalConfigView {
  readonly documents: readonly SourceState[]
}

/**
 * HRO-P1 mapping provenance: the four identity fields carried exactly (a null
 * stays null — never derived from a registry key or host id) plus the named
 * policy mapping record. `provider`/`model` are the host identity values the
 * enablement spelling composes from (C2.3); they are carried, never derived.
 */
export interface MappingProvenance {
  readonly provider: string
  readonly model: string
  readonly registry_key: string
  readonly opencode_id: string | null
  readonly provider_local_id: string | null
  readonly protocol: string | null
  readonly mapping_source: ProvenanceRef
}

/**
 * What was observed and from where. `provenance` is the optional declared
 * catalog envelope (`fetched_at`/`valid_until`/`content_hash`); its absence is
 * honest unknown and is recorded as `null`, never imputed.
 */
export interface CatalogEvidence {
  readonly observed_via: 'metadata-refresh' | 'catalog-snapshot'
  readonly source: ProvenanceRef
  readonly provenance?: DeclaredEvidence<PiOpenRouterProvenance>
}

/**
 * One verified-model observation (C1.2 exactly). `freshness` arrives as data
 * under MRC-08's `FreshnessVerdict` names and is recorded verbatim — never
 * re-derived, never a rejection on its own.
 */
export interface VerifiedModelEvidence {
  readonly mapping: MappingProvenance
  readonly catalog: CatalogEvidence
  readonly freshness: 'fresh' | 'stale' | 'unknown'
  readonly trigger: {
    readonly source_refusal: string
    readonly episode_ref?: string
  }
}

/**
 * The contract-parameterized declaration entry (C2.5): supplied only from
 * ratified host-contract evidence. `entry_locator` is a dotted object-key path
 * inside the declaration document at which the projected entry is added;
 * `project_entry` produces the entry value. The module assumes no entry shape
 * and no provider key — an absent contract yields a fail-closed residual.
 */
export interface PiModelsEntryContract {
  readonly provider_key: string
  readonly entry_locator: string
  readonly project_entry: (mapping: MappingProvenance) => unknown
}

export interface ConfigRepairInput {
  /** One or more observations of one model; duplicates coalesce (C2.4). */
  readonly evidence: readonly VerifiedModelEvidence[]
  readonly local: LocalConfigView
  readonly entry_contract?: PiModelsEntryContract
}

// ---------------------------------------------------------------------------
// The proposal artifact (C2.1) — every non-identity field reuses PMC's
// vocabulary types (`ProposedChange`, `ProvenanceRef`, `ResidualDisposition`).
// ---------------------------------------------------------------------------

/** D10 identity names + digests + counts + roles only; never values or bytes. */
export interface RedactedSummary {
  readonly model: {
    readonly registry_key: string
    readonly host_spelling: string
  }
  readonly documents: readonly DocumentRole[]
  readonly change_count: number
  readonly source_hashes: readonly {
    readonly role: DocumentRole
    readonly content_hash: string
  }[]
}

/**
 * One writer duty with its acceptance tag. `named-gate` items are surfaced,
 * never satisfied here (ruling D; C4.3).
 */
export interface ApplyChecklistItem {
  readonly id: string
  readonly duty: string
  readonly state: 'provable-in-reference-harness' | 'named-gate'
  readonly gate?: 'G-PI-HOST-CONTRACT' | 'G-APPLY-AUTH' | 'G-RELOAD-VERIFY'
}

/** The documented apply contract the proposal carries for PMC's writer. */
export interface ApplyContract {
  readonly authority: string
  readonly writer: 'pi-model-configuration authorized writer'
  readonly concurrency: 'content-hash | lock'
  readonly checklist: readonly ApplyChecklistItem[]
}

export interface ConfigRepairProposal {
  readonly kind: 'pi-config-repair-proposal'
  readonly status: 'PROPOSED-NOT-WRITTEN'
  readonly schema_version: 1
  readonly target: {
    /** Logical document roles, never host paths (the PMC target precedent). */
    readonly documents: readonly DocumentRole[]
    readonly write_policy: string
    readonly scope_preference: string
  }
  /** The observed bytes + hashes + observation times (concurrent-change anchor). */
  readonly source_state: readonly SourceState[]
  /** Minimal add-ops only (C2.1): no keep-noise, no unrelated paths. */
  readonly changes: readonly ProposedChange[]
  readonly mapping_provenance: {
    readonly registry_key: string
    readonly opencode_id: string | null
    readonly provider_local_id: string | null
    readonly protocol: string | null
    readonly mapping_source: ProvenanceRef
  }
  readonly evidence: {
    /** Absent catalog envelope = honest unknown, recorded as null. */
    readonly catalog: DeclaredEvidence<PiOpenRouterProvenance> | null
    readonly freshness: 'fresh' | 'stale' | 'unknown'
    readonly availability: {
      readonly available: true
      readonly observed_via: 'metadata-refresh' | 'catalog-snapshot'
      readonly provenance: ProvenanceRef
    }
    readonly trigger: {
      readonly source_refusal: string
      readonly episode_ref?: string
    }
  }
  readonly apply_contract: ApplyContract
  readonly residual_dispositions: readonly ResidualDisposition[]
  readonly redacted_summary: RedactedSummary
  readonly credentials: {
    readonly policy: string
    readonly contains_credential_value: false
  }
  /** `documentDigest` over this artifact minus this field (the one formula). */
  readonly proposal_digest: string
}

export type ConfigRepairResult =
  | { readonly status: 'proposed'; readonly proposal: ConfigRepairProposal }
  | { readonly status: 'no-action' }
  | {
      readonly status: 'refused'
      readonly refusal: ConfigRepairRefusalName
      readonly detail: string
    }

// ---------------------------------------------------------------------------
// The reference apply (C5) — pure plan, I/O only through the injected seam.
// ---------------------------------------------------------------------------

export type ApplyPlan =
  | {
      readonly status: 'planned'
      readonly role: DocumentRole
      readonly result_text: string
      readonly backup_text: string
    }
  | { readonly status: 'already-applied'; readonly role: DocumentRole }
  | {
      readonly status: 'refused'
      readonly refusal: ConfigRepairRefusalName
      readonly detail: string
    }

export type ApplyOutcome =
  | { readonly status: 'applied'; readonly hook_error?: string }
  | { readonly status: 'already-applied' }
  | {
      readonly status: 'refused'
      readonly refusal: ConfigRepairRefusalName
      readonly detail: string
    }
  | { readonly status: 'rolled-back'; readonly detail: string }

/** The mock/temp writer seam (C5.3) — the module itself performs no I/O. */
export interface ConfigWriteSeam {
  readonly read: (path: string) => string
  readonly writeTemp: (path: string, content: string) => void
  readonly rename: (from: string, to: string) => void
  readonly remove: (path: string) => void
  readonly exists: (path: string) => boolean
}

// ---------------------------------------------------------------------------
// Internal helpers (the pi-resolver fail-closed call-shape convention:
// TypeError on malformed shapes, returned discriminated results otherwise).
// ---------------------------------------------------------------------------

/** Malformed call shapes fail closed with TypeError and authorize nothing. */
function malformed(detail: string): TypeError {
  return new TypeError(
    `config-repair-proposal: malformed call shape — ${detail} (fail closed; nothing is authorized)`,
  )
}

function isRole(value: unknown): value is DocumentRole {
  return value === 'pi-settings' || value === 'pi-models-declaration'
}

/** A named source is a non-empty (source, locator) pair; else it is unnamed. */
function namedRef(value: unknown): ProvenanceRef | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null
  const ref = value as Record<string, unknown>
  const source = ref.source
  const locator = ref.locator
  if (typeof source !== 'string' || source.length === 0) return null
  if (typeof locator !== 'string' || locator.length === 0) return null
  return { source, locator }
}

function locatorSegments(locator: string): readonly string[] {
  const segments = locator.split('.')
  if (segments.length === 0 || segments.some((segment) => segment.length === 0)) {
    throw malformed(`entry_locator '${locator}' must be a dotted non-empty object-key path`)
  }
  return segments
}

/**
 * Walk a dotted object-key path through a parsed document. Only generic JSON
 * object navigation is assumed (no entry shape, no provider key). The final
 * segment's value counts as PRESENT whatever its JSON type (a present scalar
 * entry is an already-present entry, never an invalid source); only an
 * existing non-object INTERMEDIATE makes the document invalid (repair
 * failure, never replacement).
 */
function resolveAt(
  root: Record<string, unknown>,
  segments: readonly string[],
): { readonly present: boolean; readonly invalid: boolean } {
  let cursor: Record<string, unknown> = root
  const lastIndex = segments.length - 1
  for (const [index, segment] of segments.entries()) {
    if (!Object.hasOwn(cursor, segment)) {
      return { present: false, invalid: false }
    }
    const next: unknown = cursor[segment]
    if (next === undefined) return { present: false, invalid: false }
    if (index === lastIndex) return { present: true, invalid: false }
    if (next === null || typeof next !== 'object' || Array.isArray(next)) {
      return { present: false, invalid: true }
    }
    cursor = next as Record<string, unknown>
  }
  return { present: true, invalid: false }
}

function parseSettingsText(
  text: string,
):
  | { readonly ok: true; readonly doc: Record<string, unknown> }
  | { readonly ok: false; readonly detail: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return {
      ok: false,
      detail: 'pi-settings source is not valid JSON (repair failure; never replaced)',
    }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      detail: 'pi-settings source is not a JSON object (repair failure; never replaced)',
    }
  }
  const doc = parsed as Record<string, unknown>
  const enabled: unknown = doc.enabledModels
  if (
    enabled !== undefined &&
    (!Array.isArray(enabled) || enabled.some((entry) => typeof entry !== 'string'))
  ) {
    return {
      ok: false,
      detail:
        'pi-settings enabledModels must be an array of strings when present (repair failure; never replaced)',
    }
  }
  return { ok: true, doc }
}

function parseDeclarationText(
  text: string,
):
  | { readonly ok: true; readonly doc: Record<string, unknown> }
  | { readonly ok: false; readonly detail: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return {
      ok: false,
      detail: 'pi-models-declaration source is not valid JSON (repair failure; never replaced)',
    }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      detail: 'pi-models-declaration source is not a JSON object (repair failure; never replaced)',
    }
  }
  return { ok: true, doc: parsed as Record<string, unknown> }
}

const ENABLEMENT_PATH = 'enabledModels'

const WRITE_POLICY =
  'applying this proposal requires existing scoped configuration-write authorization (pi-model-configuration authorized writer); this artifact grants none (HRO-D9)'

const SCOPE_PREFERENCE =
  'managed/session-scoped configuration is preferred where supported (HRO-D9); that support is unestablished (host-contract GAP) and is an input of the establishment act, never assumed here'

const CREDENTIALS_POLICY =
  'credential references and configuration contents never appear on redacted surfaces (HRO-D9); contains_credential_value is machine-checked'

const ENTRY_CONTRACT_SOURCE =
  'config-repair-input.entry_contract (PiModelsEntryContract; caller-supplied ratified host-contract evidence)'

const AUTHORITY =
  'ruling D (HRO-P4b is proposal-only): apply stays with pi-model-configuration authorized writer until a ratified reconciliation exists (HRO-D9: this charter does not grant configuration-write authorization)'

/** D9's writer duties verbatim-in-substance + the authorization precondition. */
const APPLY_CHECKLIST: readonly ApplyChecklistItem[] = [
  {
    id: 'apply-authorization',
    duty: 'Applying this diff requires existing scoped configuration-write authorization; this artifact grants none (HRO-D9)',
    state: 'named-gate',
    gate: 'G-APPLY-AUTH',
  },
  {
    id: 'validate-complete-result',
    duty: 'validate the complete result against the actual Pi contract',
    state: 'named-gate',
    gate: 'G-PI-HOST-CONTRACT',
  },
  {
    id: 'preserve-unrelated',
    duty: 'preserve unrelated fields and credential references',
    state: 'provable-in-reference-harness',
  },
  {
    id: 'enforce-path-scope',
    duty: 'enforce the intended path/scope (the real host path binding is the writer act)',
    state: 'provable-in-reference-harness',
  },
  {
    id: 'detect-concurrent-changes',
    duty: 'detect concurrent changes with a content hash or lock',
    state: 'provable-in-reference-harness',
  },
  {
    id: 'atomic-write-backup-rollback',
    duty: 'write atomically with recoverable backup/rollback',
    state: 'provable-in-reference-harness',
  },
  {
    id: 'invalid-source-is-repair-failure',
    duty: 'treat an invalid source file or version conflict as a repair failure, never permission to replace the file',
    state: 'provable-in-reference-harness',
  },
  {
    id: 'identical-updates-idempotent',
    duty: 'make identical updates idempotent',
    state: 'provable-in-reference-harness',
  },
  {
    id: 'cache-refresh-after-apply',
    duty: 'refresh relevant cache versions only after a successful apply',
    state: 'provable-in-reference-harness',
  },
  {
    id: 'verify-reload',
    duty: 'verify reload/new-session behavior before claiming the route is usable',
    state: 'named-gate',
    gate: 'G-RELOAD-VERIFY',
  },
  {
    id: 'keep-secrets-out-of-logs',
    duty: 'keep config contents and secrets out of alerts and diffs exposed to logs',
    state: 'provable-in-reference-harness',
  },
]

// ---------------------------------------------------------------------------
// The proposal builder (C1–C3) — pure; `now` is injected (no clock reads) and
// is shape-validated only: the fixed artifact shape carries no builder
// timestamp (observation times ride on `source_state`).
// ---------------------------------------------------------------------------

export function buildConfigRepairProposal(
  input: ConfigRepairInput,
  options: { readonly now: string },
): ConfigRepairResult {
  if (options === null || typeof options !== 'object') {
    throw malformed('options must be an object')
  }
  const optionsRaw = options as unknown as Record<string, unknown>
  if (typeof optionsRaw.now !== 'string' || optionsRaw.now.length === 0) {
    throw malformed(
      'options.now must be a non-empty injected timestamp (the module reads no clock)',
    )
  }
  if (input === null || typeof input !== 'object') {
    throw malformed('input must be an object')
  }
  const inputRaw = input as unknown as Record<string, unknown>
  const evidenceInput: unknown = inputRaw.evidence
  const localInput: unknown = inputRaw.local
  const contractInput: unknown = inputRaw.entry_contract
  if (!Array.isArray(evidenceInput)) throw malformed('input.evidence must be an array')
  if (localInput === null || typeof localInput !== 'object' || Array.isArray(localInput)) {
    throw malformed('input.local must be an object')
  }
  const localRaw = localInput as Record<string, unknown>
  if (!Array.isArray(localRaw.documents)) {
    throw malformed('input.local.documents must be an array')
  }

  // Structural validation first (fail closed), then the named-source test.
  if (evidenceInput.length === 0) {
    return {
      status: 'refused',
      refusal: 'EVIDENCE_INSUFFICIENT_REFUSED',
      detail:
        'no approved mapping: zero verified-model evidence records (a discovered-but-unapproved model is never proposed)',
    }
  }
  const records: VerifiedModelEvidence[] = []
  for (const raw of evidenceInput) {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      throw malformed('each evidence record must be an object')
    }
    const record = raw as Record<string, unknown>
    const mapping: unknown = record.mapping
    const catalog: unknown = record.catalog
    const freshness: unknown = record.freshness
    const trigger: unknown = record.trigger
    if (freshness !== 'fresh' && freshness !== 'stale' && freshness !== 'unknown') {
      throw malformed("evidence.freshness must be 'fresh' | 'stale' | 'unknown'")
    }
    if (trigger === null || typeof trigger !== 'object' || Array.isArray(trigger)) {
      throw malformed('evidence.trigger must be an object')
    }
    const triggerRaw = trigger as Record<string, unknown>
    if (typeof triggerRaw.source_refusal !== 'string') {
      throw malformed('evidence.trigger.source_refusal must be a string')
    }
    const episodeRef: unknown = triggerRaw.episode_ref
    if (episodeRef !== undefined && typeof episodeRef !== 'string') {
      throw malformed('evidence.trigger.episode_ref must be a string when present')
    }
    if (mapping === undefined || mapping === null) {
      return {
        status: 'refused',
        refusal: 'EVIDENCE_INSUFFICIENT_REFUSED',
        detail: 'no approved mapping: an evidence record without a mapping never manufactures one',
      }
    }
    if (catalog === undefined || catalog === null) {
      return {
        status: 'refused',
        refusal: 'EVIDENCE_INSUFFICIENT_REFUSED',
        detail: 'no named catalog observation: a proposal without evidence is never emitted',
      }
    }
    if (mapping === null || typeof mapping !== 'object' || Array.isArray(mapping)) {
      throw malformed('evidence.mapping must be an object')
    }
    if (catalog === null || typeof catalog !== 'object' || Array.isArray(catalog)) {
      throw malformed('evidence.catalog must be an object')
    }
    const mappingRaw = mapping as Record<string, unknown>
    const catalogRaw = catalog as Record<string, unknown>
    const provider = mappingRaw.provider
    const model = mappingRaw.model
    const registryKey = mappingRaw.registry_key
    for (const [name, value] of [
      ['provider', provider],
      ['model', model],
      ['registry_key', registryKey],
    ] as const) {
      if (typeof value !== 'string') throw malformed(`evidence.mapping.${name} must be a string`)
      if (value.length === 0) {
        return {
          status: 'refused',
          refusal: 'EVIDENCE_INSUFFICIENT_REFUSED',
          detail: `no approved mapping: empty ${name} is not an identity`,
        }
      }
    }
    for (const field of ['opencode_id', 'provider_local_id', 'protocol'] as const) {
      const value: unknown = mappingRaw[field]
      if (value !== null && typeof value !== 'string') {
        throw malformed(`evidence.mapping.${field} must be a string or null`)
      }
    }
    const observedVia = catalogRaw.observed_via
    if (observedVia !== 'metadata-refresh' && observedVia !== 'catalog-snapshot') {
      throw malformed(
        "evidence.catalog.observed_via must be 'metadata-refresh' | 'catalog-snapshot'",
      )
    }
    const envelope: unknown = catalogRaw.provenance
    if (
      envelope !== undefined &&
      (envelope === null || typeof envelope !== 'object' || Array.isArray(envelope))
    ) {
      throw malformed(
        'evidence.catalog.provenance must be a declared-evidence envelope when present',
      )
    }
    const mappingSource = namedRef(mappingRaw.mapping_source)
    if (mappingSource === null) {
      return {
        status: 'refused',
        refusal: 'EVIDENCE_INSUFFICIENT_REFUSED',
        detail: 'no approved mapping: the policy mapping record must be a named source',
      }
    }
    const catalogSource = namedRef(catalogRaw.source)
    if (catalogSource === null) {
      return {
        status: 'refused',
        refusal: 'EVIDENCE_INSUFFICIENT_REFUSED',
        detail: 'no named catalog observation: the catalog source must be named (source + locator)',
      }
    }
    records.push({
      mapping: {
        provider: provider as string,
        model: model as string,
        registry_key: registryKey as string,
        opencode_id: mappingRaw.opencode_id as string | null,
        provider_local_id: mappingRaw.provider_local_id as string | null,
        protocol: mappingRaw.protocol as string | null,
        mapping_source: mappingSource,
      },
      catalog: {
        observed_via: observedVia,
        source: catalogSource,
        ...(envelope === undefined
          ? {}
          : { provenance: envelope as DeclaredEvidence<PiOpenRouterProvenance> }),
      },
      freshness,
      trigger: {
        source_refusal: triggerRaw.source_refusal as string,
        ...(episodeRef === undefined ? {} : { episode_ref: episodeRef }),
      },
    })
  }

  // One proposal per model: mismatched identities are a malformed call.
  const first = records[0]
  if (first === undefined) throw malformed('input.evidence must not be empty')
  for (const record of records) {
    if (
      record.mapping.provider !== first.mapping.provider ||
      record.mapping.model !== first.mapping.model ||
      record.mapping.registry_key !== first.mapping.registry_key
    ) {
      throw malformed('all evidence records must describe one model identity')
    }
  }

  // Contract input (optional; absent = fail-closed residual, never fabricated).
  let entryContract: PiModelsEntryContract | null = null
  if (contractInput !== undefined && contractInput !== null) {
    if (typeof contractInput !== 'object' || Array.isArray(contractInput)) {
      throw malformed('input.entry_contract must be an object')
    }
    const contractRaw = contractInput as Record<string, unknown>
    const providerKey = contractRaw.provider_key
    const entryLocator = contractRaw.entry_locator
    const projectEntry = contractRaw.project_entry
    if (typeof providerKey !== 'string' || providerKey.length === 0) {
      throw malformed('input.entry_contract.provider_key must be a non-empty string')
    }
    if (typeof entryLocator !== 'string' || entryLocator.length === 0) {
      throw malformed('input.entry_contract.entry_locator must be a non-empty string')
    }
    if (typeof projectEntry !== 'function') {
      throw malformed('input.entry_contract.project_entry must be a function')
    }
    if (entryLocator === ENABLEMENT_PATH) {
      throw malformed(
        "input.entry_contract.entry_locator collides with the enablement scope ('enabledModels')",
      )
    }
    locatorSegments(entryLocator)
    entryContract = {
      provider_key: providerKey,
      entry_locator: entryLocator,
      project_entry: projectEntry as (mapping: MappingProvenance) => unknown,
    }
  }

  // The observed view: every supplied document is anchored in source_state.
  const documents: SourceState[] = []
  for (const raw of localRaw.documents) {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      throw malformed('each source document must be an object')
    }
    const doc = raw as Record<string, unknown>
    const role = doc.role
    const text = doc.text
    const contentHash = doc.content_hash
    const observedAt = doc.observed_at
    if (!isRole(role)) {
      throw malformed("source document role must be 'pi-settings' | 'pi-models-declaration'")
    }
    if (typeof text !== 'string') throw malformed('source document text must be a string')
    if (typeof contentHash !== 'string' || contentHash.length === 0) {
      throw malformed('source document content_hash must be a non-empty string')
    }
    if (typeof observedAt !== 'string' || observedAt.length === 0) {
      throw malformed('source document observed_at must be a non-empty string')
    }
    if (documents.some((doc) => doc.role === role)) {
      throw malformed(`duplicate source document role '${role}'`)
    }
    documents.push({ role, text, content_hash: contentHash, observed_at: observedAt })
  }
  const settingsDoc = documents.find((doc) => doc.role === 'pi-settings')
  if (settingsDoc === undefined) {
    throw malformed(
      "input.local.documents must supply the 'pi-settings' document (enablement is always inspected)",
    )
  }
  const declarationDoc = documents.find((doc) => doc.role === 'pi-models-declaration')
  if (entryContract !== null && declarationDoc === undefined) {
    throw malformed(
      "an entry_contract requires the 'pi-models-declaration' document in input.local.documents",
    )
  }

  const settings = parseSettingsText(settingsDoc.text)
  if (!settings.ok) {
    return { status: 'refused', refusal: 'SOURCE_INVALID_REFUSED', detail: settings.detail }
  }
  let declaration: Record<string, unknown> | null = null
  if (entryContract !== null && declarationDoc !== undefined) {
    const parsed = parseDeclarationText(declarationDoc.text)
    if (!parsed.ok) {
      return { status: 'refused', refusal: 'SOURCE_INVALID_REFUSED', detail: parsed.detail }
    }
    const walked = resolveAt(parsed.doc, locatorSegments(entryContract.entry_locator))
    if (walked.invalid) {
      return {
        status: 'refused',
        refusal: 'SOURCE_INVALID_REFUSED',
        detail:
          'pi-models-declaration has a non-object along the contract locator (repair failure; never replaced)',
      }
    }
    declaration = parsed.doc
  }

  const mapping = first.mapping
  // Deliberate duplication (MRC-06 A1.5 precedent): `hostSpelling` is
  // module-private in host-settings-proposal.ts, outside this write set.
  // Pinned by the lockstep parity control in tests/config-repair-proposal.test.ts
  // against hostSpelling's documented rule and the committed PROPOSED
  // artifact's enabledModels values. Never derived from a registry key.
  const spelling = `${mapping.provider}:${mapping.model}`

  const enabled: unknown = settings.doc[ENABLEMENT_PATH]
  const enabledList: readonly string[] = Array.isArray(enabled) ? (enabled as string[]) : []
  const enablementMissing = !enabledList.includes(spelling)

  let entryMissing = false
  if (entryContract !== null && declaration !== null) {
    entryMissing = !resolveAt(declaration, locatorSegments(entryContract.entry_locator)).present
  }

  if (!enablementMissing && !entryMissing) {
    return { status: 'no-action' }
  }

  // Provenance: the named sources of every record, coalesced (C2.4).
  const baseRefs: ProvenanceRef[] = []
  const seen = new Set<string>()
  for (const record of records) {
    for (const ref of [record.mapping.mapping_source, record.catalog.source]) {
      const key = `${ref.source} ${ref.locator}`
      if (seen.has(key)) continue
      seen.add(key)
      baseRefs.push(ref)
    }
  }

  const changes: ProposedChange[] = []
  if (enablementMissing) {
    changes.push({
      path: ENABLEMENT_PATH,
      op: 'add',
      value: spelling,
      reason:
        'enable the verified model at its host spelling (absent from the observed enabledModels membership; minimal repair)',
      provenance: [...baseRefs],
    })
  }
  if (entryContract !== null && declaration !== null && entryMissing) {
    changes.push({
      path: entryContract.entry_locator,
      op: 'add',
      value: entryContract.project_entry(mapping),
      reason:
        'register the declaration entry projected by the supplied PiModelsEntryContract at its locator (contract-parameterized; no entry shape assumed)',
      provenance: [
        ...baseRefs,
        { source: ENTRY_CONTRACT_SOURCE, locator: entryContract.entry_locator },
      ],
    })
  }

  const residualDispositions: ResidualDisposition[] = []
  if (entryContract === null) {
    residualDispositions.push({
      slot: 'pi-models-declaration',
      residual: 'CONTRACT_UNESTABLISHED',
      state: 'fail-closed',
      attempted_evidence:
        'no PiModelsEntryContract input was supplied: the declaration entry contract is unestablished (establishment gate G-PI-HOST-CONTRACT) and no entry change is fabricated',
      provenance: [...baseRefs],
    })
  }

  const targetDocuments: DocumentRole[] = []
  for (const change of changes) {
    // Which logical document a change path belongs to (the two-role scope):
    // the enablement key lives on pi-settings; every other path is the
    // contract locator on pi-models-declaration.
    const role: DocumentRole =
      change.path === ENABLEMENT_PATH ? 'pi-settings' : 'pi-models-declaration'
    if (!targetDocuments.includes(role)) targetDocuments.push(role)
  }

  const trigger = first.trigger
  const proposalWithoutDigest = {
    kind: 'pi-config-repair-proposal',
    status: 'PROPOSED-NOT-WRITTEN',
    schema_version: 1,
    target: {
      documents: targetDocuments,
      write_policy: WRITE_POLICY,
      scope_preference: SCOPE_PREFERENCE,
    },
    source_state: documents,
    changes,
    mapping_provenance: {
      registry_key: mapping.registry_key,
      opencode_id: mapping.opencode_id,
      provider_local_id: mapping.provider_local_id,
      protocol: mapping.protocol,
      mapping_source: mapping.mapping_source,
    },
    evidence: {
      catalog: first.catalog.provenance ?? null,
      freshness: first.freshness,
      availability: {
        available: true,
        observed_via: first.catalog.observed_via,
        provenance: first.catalog.source,
      },
      trigger: {
        source_refusal: trigger.source_refusal,
        ...(trigger.episode_ref === undefined ? {} : { episode_ref: trigger.episode_ref }),
      },
    },
    apply_contract: {
      authority: AUTHORITY,
      writer: 'pi-model-configuration authorized writer',
      concurrency: 'content-hash | lock',
      checklist: APPLY_CHECKLIST,
    },
    residual_dispositions: residualDispositions,
    redacted_summary: {
      model: { registry_key: mapping.registry_key, host_spelling: spelling },
      documents: targetDocuments,
      change_count: changes.length,
      source_hashes: documents.map((doc) => ({ role: doc.role, content_hash: doc.content_hash })),
    },
    credentials: {
      policy: CREDENTIALS_POLICY,
      contains_credential_value: false,
    },
  } as const

  const proposal: ConfigRepairProposal = {
    ...proposalWithoutDigest,
    proposal_digest: documentDigest(proposalWithoutDigest),
  }
  return { status: 'proposed', proposal }
}

// ---------------------------------------------------------------------------
// The reference apply plan (C5.1) — pure; order: digest, scope, validity,
// concurrency, merge, idempotence.
// ---------------------------------------------------------------------------

export function planConfigRepairApply(
  proposal: ConfigRepairProposal,
  current: SourceState,
): ApplyPlan {
  if (proposal === null || typeof proposal !== 'object') {
    throw malformed('proposal must be an object')
  }
  const proposalRaw = proposal as unknown as Record<string, unknown>
  if (typeof proposalRaw.proposal_digest !== 'string') {
    throw malformed('proposal must carry a proposal_digest')
  }
  const targetBlock: unknown = proposalRaw.target
  if (
    targetBlock === null ||
    typeof targetBlock !== 'object' ||
    !Array.isArray((targetBlock as Record<string, unknown>).documents)
  ) {
    throw malformed('proposal.target.documents must be an array')
  }
  if (!Array.isArray(proposalRaw.source_state) || !Array.isArray(proposalRaw.changes)) {
    throw malformed('proposal.source_state and proposal.changes must be arrays')
  }
  if (current === null || typeof current !== 'object') {
    throw malformed('current must be an object')
  }
  const currentRaw = current as unknown as Record<string, unknown>
  if (!isRole(currentRaw.role) || typeof currentRaw.text !== 'string') {
    throw malformed('current must be a SourceState')
  }
  if (typeof currentRaw.content_hash !== 'string' || currentRaw.content_hash.length === 0) {
    throw malformed('current.content_hash must be a non-empty string')
  }

  // (1) Recompute the one digest — a tampered proposal is refused first.
  const { proposal_digest: digest, ...withoutDigest } = proposal
  if (documentDigest(withoutDigest) !== digest) {
    return {
      status: 'refused',
      refusal: 'PROPOSAL_DIGEST_MISMATCH_REFUSED',
      detail:
        'proposal_digest does not match the artifact content (tampered proposal; nothing is applied)',
    }
  }

  // (2) Role/scope match against the bound target.
  const role = current.role
  const targetDocuments = proposal.target.documents
  if (!targetDocuments.includes(role)) {
    return {
      status: 'refused',
      refusal: 'TARGET_SCOPE_MISMATCH_REFUSED',
      detail: `role '${role}' is not a member of the proposal target documents`,
    }
  }
  const anchor = proposal.source_state.find((doc) => doc.role === role)
  if (anchor === undefined) {
    return {
      status: 'refused',
      refusal: 'TARGET_SCOPE_MISMATCH_REFUSED',
      detail: `role '${role}' has no source_state anchor in the proposal`,
    }
  }
  // The two-role scope mapping (mirrors the builder): the enablement key
  // lives on pi-settings; every other path is the contract locator.
  const roleChanges = proposal.changes.filter(
    (change) =>
      (change.path === ENABLEMENT_PATH ? 'pi-settings' : 'pi-models-declaration') === role,
  )
  if (roleChanges.length === 0) {
    return {
      status: 'refused',
      refusal: 'TARGET_SCOPE_MISMATCH_REFUSED',
      detail: `role '${role}' has no in-scope change in the proposal`,
    }
  }
  for (const change of roleChanges) {
    if (change.op !== 'add' || typeof change.path !== 'string' || change.path.length === 0) {
      return {
        status: 'refused',
        refusal: 'TARGET_SCOPE_MISMATCH_REFUSED',
        detail: 'only minimal add operations at a non-empty path are in scope',
      }
    }
  }

  // (3) Source validity — invalid bytes are a repair failure, never replaced.
  const parsed =
    role === 'pi-settings' ? parseSettingsText(current.text) : parseDeclarationText(current.text)
  if (!parsed.ok) {
    return { status: 'refused', refusal: 'SOURCE_INVALID_REFUSED', detail: parsed.detail }
  }

  // (4) Concurrent-change detection (reference hash mode; a lock-based writer
  // maps the same duty onto its lock and records its own refusal).
  if (current.content_hash !== anchor.content_hash) {
    return {
      status: 'refused',
      refusal: 'SOURCE_HASH_MISMATCH_REFUSED',
      detail: `current content_hash does not match the recorded source_state anchor for role '${role}'`,
    }
  }

  // (5–6) Merge the missing minimal changes; a fully-present change set is
  // already-applied with zero writes.
  const doc = parsed.doc
  const missing: typeof roleChanges = []
  for (const change of roleChanges) {
    if (change.path === ENABLEMENT_PATH) {
      const existing: unknown = doc[ENABLEMENT_PATH]
      const list: readonly string[] = Array.isArray(existing) ? (existing as string[]) : []
      if (!list.includes(change.value as string)) missing.push(change)
      continue
    }
    const walked = resolveAt(doc, locatorSegments(change.path))
    if (walked.invalid) {
      return {
        status: 'refused',
        refusal: 'SOURCE_INVALID_REFUSED',
        detail:
          'pi-models-declaration has a non-object along the change locator (repair failure; never replaced)',
      }
    }
    if (!walked.present) missing.push(change)
  }
  if (missing.length === 0) {
    return { status: 'already-applied', role }
  }

  for (const change of missing) {
    if (change.path === ENABLEMENT_PATH) {
      const existing: unknown = doc[ENABLEMENT_PATH]
      const list: string[] = Array.isArray(existing) ? [...(existing as string[])] : []
      list.push(change.value as string)
      doc[ENABLEMENT_PATH] = list
      continue
    }
    const segments = locatorSegments(change.path)
    let cursor = doc
    for (const segment of segments.slice(0, -1)) {
      const next: unknown = cursor[segment]
      if (next === undefined) {
        const created: Record<string, unknown> = {}
        cursor[segment] = created
        cursor = created
      } else {
        cursor = next as Record<string, unknown>
      }
    }
    const last = segments[segments.length - 1]
    if (last === undefined) throw malformed('change locator must have a final segment')
    cursor[last] = change.value
  }

  return {
    status: 'planned',
    role,
    result_text: JSON.stringify(doc, null, 2),
    backup_text: current.text,
  }
}

// ---------------------------------------------------------------------------
// The atomic reference write (C5.2) — I/O only through the injected seam;
// absolute-root + containment guards run before any seam call.
// ---------------------------------------------------------------------------

export function writeConfigRepairAtomically(
  plan: ApplyPlan,
  target: { readonly path: string; readonly root: string },
  seam: ConfigWriteSeam,
  hooks?: { readonly on_applied?: () => void },
): ApplyOutcome {
  if (plan === null || typeof plan !== 'object') throw malformed('plan must be an object')
  if (target === null || typeof target !== 'object') throw malformed('target must be an object')
  const targetRaw = target as unknown as Record<string, unknown>
  if (typeof targetRaw.path !== 'string' || typeof targetRaw.root !== 'string') {
    throw malformed('target must carry absolute-capable path and root strings')
  }
  if (seam === null || typeof seam !== 'object') throw malformed('seam must be an object')
  const seamRaw = seam as unknown as Record<string, unknown>
  if (
    typeof seamRaw.read !== 'function' ||
    typeof seamRaw.writeTemp !== 'function' ||
    typeof seamRaw.rename !== 'function' ||
    typeof seamRaw.remove !== 'function' ||
    typeof seamRaw.exists !== 'function'
  ) {
    throw malformed('seam must carry read/writeTemp/rename/remove/exists functions')
  }
  if (
    hooks !== undefined &&
    hooks.on_applied !== undefined &&
    typeof hooks.on_applied !== 'function'
  ) {
    throw malformed('hooks.on_applied must be a function when present')
  }

  if (plan.status === 'already-applied') return { status: 'already-applied' }
  if (plan.status === 'refused') {
    return { status: 'refused', refusal: plan.refusal, detail: plan.detail }
  }

  // Guards first (the assertAbsoluteRoot/assertContainedRootPath family style)
  // — before ANY seam call.
  if (!isAbsolute(target.root) || !isAbsolute(target.path)) {
    return {
      status: 'refused',
      refusal: 'TARGET_SCOPE_MISMATCH_REFUSED',
      detail: 'target root and path must be absolute before any I/O',
    }
  }
  const rel = relative(resolve(target.root), resolve(target.path))
  if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    return {
      status: 'refused',
      refusal: 'TARGET_SCOPE_MISMATCH_REFUSED',
      detail: 'target path resolves outside the bound root before any I/O',
    }
  }

  // A repair never replaces or creates its source: a missing target is an
  // invalid source state.
  if (!seam.exists(target.path)) {
    return {
      status: 'refused',
      refusal: 'SOURCE_INVALID_REFUSED',
      detail: 'target source is missing (repair failure; never replaced)',
    }
  }
  const existing = seam.read(target.path)
  if (existing === plan.result_text) {
    return { status: 'already-applied' }
  }
  if (existing !== plan.backup_text) {
    return {
      status: 'refused',
      refusal: 'SOURCE_HASH_MISMATCH_REFUSED',
      detail:
        'target bytes changed since the plan was computed (concurrent change detected at the write boundary)',
    }
  }

  const tempPath = `${target.path}.tmp`
  const backupPath = `${target.path}.backup`
  try {
    seam.writeTemp(tempPath, plan.result_text)
    seam.writeTemp(backupPath, plan.backup_text)
    seam.rename(tempPath, target.path)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // R1: the restore runs from the catch and is never gated on a success
    // flag — the seam contract promises no atomicity, so a rename may have
    // moved the file and then thrown. It runs BEFORE any backup deletion and
    // only against a verified-complete backup (a partial backup write must
    // never overwrite the original).
    let backupComplete = false
    try {
      backupComplete = seam.exists(backupPath) && seam.read(backupPath) === plan.backup_text
    } catch {
      backupComplete = false
    }
    if (backupComplete) {
      try {
        seam.rename(backupPath, target.path)
      } catch {
        // Tolerated: the verification below decides the truthful outcome.
      }
    }
    // 'Original restored' is claimed only when verified against the exact
    // original bytes. Anything else is a degraded rollback: the backup — the
    // only remaining copy of the original — is preserved, never deleted.
    let restored = false
    try {
      restored = seam.read(target.path) === plan.backup_text
    } catch {
      restored = false
    }
    try {
      seam.remove(tempPath)
    } catch {
      // Best-effort cleanup never masks the outcome.
    }
    if (restored) {
      try {
        seam.remove(backupPath)
      } catch {
        // Best-effort cleanup never masks the outcome.
      }
      return {
        status: 'rolled-back',
        detail: `write failed before completion (${message}); original restored, no partial output`,
      }
    }
    let backupPreserved = false
    try {
      backupPreserved = seam.exists(backupPath)
    } catch {
      backupPreserved = false
    }
    return {
      status: 'rolled-back',
      detail: backupPreserved
        ? `write failed before completion (${message}); rollback-incomplete, backup preserved at role '${plan.role}' (restore unverified)`
        : `write failed before completion (${message}); rollback-incomplete, no recoverable backup for role '${plan.role}' (restore unverified)`,
    }
  }

  // Ordering duty (D9): post-apply work fires exactly once and only after the
  // successful swap. A hook failure is surfaced, never concealed, and never
  // changes the applied state.
  let hookError: string | undefined
  if (hooks?.on_applied !== undefined) {
    try {
      hooks.on_applied()
    } catch (error) {
      hookError = error instanceof Error ? error.message : String(error)
    }
  }
  return hookError === undefined
    ? { status: 'applied' }
    : { status: 'applied', hook_error: hookError }
}
