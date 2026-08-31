import { createHash } from 'node:crypto'
import { lstatSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { parse } from 'yaml'
import AjvModule, { type Ajv as AjvType } from '../node_modules/ajv/dist/ajv.js'
import { authorityEnforcementRegistrySchema } from './schemas.js'
import {
  type AuthorityEnforcementRegistry,
  type AuthorityRule,
  type CanonSource,
  GOAL_SCOPES,
  HOST_POSTURES,
  OPERATION_SCOPES,
  PRINCIPAL_CLASSES,
  type RegistrySummary,
  type ResultCode,
  ROLE_SCOPES,
  RULE_CLASSIFICATIONS,
  type SourceLocator,
  STAGE_SCOPES,
  type ValidationResult,
  type ValidationViolation,
} from './types.js'

const Ajv = AjvModule as unknown as typeof AjvType
const ajv = new Ajv({ allErrors: true })
const validateStructure = ajv.compile(authorityEnforcementRegistrySchema)
const REQUIRED_RECONCILIATIONS = [
  'gate-namespace-count',
  'gate3-delegation',
  'spec-linter-profile-behavior',
  'surfaces-allowed-files',
  'permission-profile-enforcement-bound',
  'missing-provenance-reference',
] as const
const REQUIRED_OPERATIONS = [
  'gate1.ratify',
  'gate2.dispatch',
  'gate3.merge',
  'verification.issue',
  'closure.record',
  'receipt.mint-generic',
  'external.write',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeRuleText(value: string): string {
  return value
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(' ')
    .replace(/\s+/gu, ' ')
}

function canonicalize(value: unknown): unknown {
  if (typeof value === 'string') return value.normalize('NFC')
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!isRecord(value)) return value
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  )
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

export function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

export function locatorDigestFor(locator: SourceLocator): string {
  return sha256(canonicalJson({ kind: locator.kind, anchor: locator.anchor }))
}

export function bindingDigestFor(
  rule: Pick<AuthorityRule, 'ruleId' | 'sourceRefs' | 'normalizedStatement'>,
): string {
  return sha256(
    canonicalJson({
      ruleId: rule.ruleId,
      sourceRefs: rule.sourceRefs,
      normalizedStatement: rule.normalizedStatement,
    }),
  )
}

function violation(
  code: ResultCode,
  message: string,
  detail: Omit<ValidationViolation, 'code' | 'message'> = {},
): ValidationViolation {
  return { code, message, ...detail }
}

function ordered(violations: readonly ValidationViolation[]): ValidationViolation[] {
  return [...violations].sort((left, right) => {
    const fields: (keyof ValidationViolation)[] = ['sourcePath', 'locator', 'ruleId', 'code']
    for (const field of fields) {
      const comparison = String(left[field] ?? '').localeCompare(String(right[field] ?? ''))
      if (comparison !== 0) return comparison
    }
    return left.message.localeCompare(right.message)
  })
}

function summaryFor(
  document: AuthorityEnforcementRegistry,
  violations: readonly ValidationViolation[],
): RegistrySummary {
  const classificationCounts = Object.fromEntries(
    RULE_CLASSIFICATIONS.map((classification) => [classification, 0]),
  ) as Record<(typeof RULE_CLASSIFICATIONS)[number], number>
  for (const rule of document.rules) classificationCounts[rule.classification] += 1
  return {
    sourceSnapshot: document.sourceSnapshotCommit,
    sourceCount: document.sources.length,
    itemCount: document.sources.reduce((count, source) => count + source.inventoryItems.length, 0),
    ruleCount: document.rules.length,
    classificationCounts,
    reconciliationStatuses: Object.fromEntries(
      document.reconciliations.map((record) => [record.reconciliationId, record.migrationStatus]),
    ),
    unresolvedActiveConflicts: violations.filter((item) => item.code === 'RULE_CONFLICT').length,
  }
}

function referenceKey(sourceId: string, itemId: string): string {
  return `${sourceId}\u0000${itemId}`
}

function arraysOverlap(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.includes('any') || right.includes('any') || left.some((value) => right.includes(value))
  )
}

function followsEnumOrder(values: readonly string[], order: readonly string[]): boolean {
  let prior = -1
  for (const value of values) {
    const index = order.indexOf(value)
    if (index < prior) return false
    prior = index
  }
  return true
}

function checkOperationAuthority(document: AuthorityEnforcementRegistry): ValidationViolation[] {
  const violations: ValidationViolation[] = []
  const rows = new Map(document.operationAuthority.map((row) => [row.operationId, row]))
  for (const operationId of REQUIRED_OPERATIONS) {
    if (!rows.has(operationId)) {
      violations.push(
        violation('AUTHORITY_ESCALATION', `required operation row '${operationId}' is missing`),
      )
    }
  }
  if (rows.size !== document.operationAuthority.length) {
    violations.push(
      violation('AUTHORITY_ESCALATION', 'operationAuthority contains a duplicate operation row'),
    )
  }
  if (
    document.operationAuthority.map((row) => row.operationId).join('|') !==
    REQUIRED_OPERATIONS.join('|')
  ) {
    violations.push(
      violation('MIGRATION_EVIDENCE_INVALID', 'operationAuthority rows must use schema-enum order'),
    )
  }

  const protectedRows = [
    'gate1.ratify',
    'gate3.merge',
    'verification.issue',
    'closure.record',
    'receipt.mint-generic',
    'external.write',
  ] as const
  for (const operationId of protectedRows) {
    const row = rows.get(operationId)
    if (
      row !== undefined &&
      (row.agentCallable || row.operationalStateMaySatisfy || row.toolMayIssueAuthorityEvidence)
    ) {
      violations.push(
        violation(
          'AUTHORITY_ESCALATION',
          `${operationId} cannot be agent-callable, operational-state satisfiable, or tool-issued`,
        ),
      )
    }
  }

  const gate1 = rows.get('gate1.ratify')
  if (
    gate1 !== undefined &&
    (gate1.allowedPrincipals.length !== 1 ||
      gate1.allowedPrincipals[0] !== 'human-developer' ||
      gate1.missingEvidenceDecision !== 'REQUIRE_HUMAN')
  ) {
    violations.push(violation('AUTHORITY_ESCALATION', 'Gate 1 must remain human-developer only'))
  }
  const gate2 = rows.get('gate2.dispatch')
  if (
    gate2 !== undefined &&
    (!gate2.agentCallable ||
      gate2.operationalStateMaySatisfy ||
      gate2.toolMayIssueAuthorityEvidence ||
      gate2.requiredGitEvidence.length === 0)
  ) {
    violations.push(
      violation(
        'AUTHORITY_ESCALATION',
        'Gate 2 requires pre-existing Git evidence and cannot be state- or tool-minted',
      ),
    )
  }
  const gate3 = rows.get('gate3.merge')
  if (
    gate3 !== undefined &&
    (gate3.allowedPrincipals.length !== 1 || gate3.allowedPrincipals[0] !== 'human-developer')
  ) {
    violations.push(
      violation('AUTHORITY_ESCALATION', 'FK Gate 3 must remain nondelegated and human-owned'),
    )
  }
  const verification = rows.get('verification.issue')
  if (
    verification !== undefined &&
    (verification.allowedPrincipals.length !== 1 ||
      verification.allowedPrincipals[0] !== 'independent-reviewer')
  ) {
    violations.push(
      violation(
        'AUTHORITY_ESCALATION',
        'verification evidence requires a mechanically distinct independent reviewer',
      ),
    )
  }
  return violations
}

function semanticViolations(document: AuthorityEnforcementRegistry): ValidationViolation[] {
  const violations: ValidationViolation[] = []
  const sourcesById = new Map<string, CanonSource>()
  const itemsByRef = new Map<string, CanonSource['inventoryItems'][number]>()
  const normalizedPaths = new Set<string>()

  for (const source of document.sources) {
    if (sourcesById.has(source.sourceId)) {
      violations.push(
        violation('SOURCE_DUPLICATE_PATH', `duplicate sourceId '${source.sourceId}'`, {
          sourcePath: source.path,
        }),
      )
    }
    sourcesById.set(source.sourceId, source)
    if (!followsEnumOrder(source.scope, GOAL_SCOPES)) {
      violations.push(
        violation('MIGRATION_EVIDENCE_INVALID', 'source scope set is not in schema-enum order', {
          sourcePath: source.path,
        }),
      )
    }
    if (source.snapshotEvidence.commit !== document.sourceSnapshotCommit) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          'source snapshot commit does not match registry snapshot',
          {
            sourcePath: source.path,
          },
        ),
      )
    }
    const normalizedPath = source.path.replace(/\\/g, '/').toLowerCase()
    if (normalizedPaths.has(normalizedPath)) {
      violations.push(
        violation('SOURCE_DUPLICATE_PATH', `duplicate normalized source path '${source.path}'`, {
          sourcePath: source.path,
        }),
      )
    }
    normalizedPaths.add(normalizedPath)
    const itemIds = new Set<string>()
    const locators = new Set<string>()
    for (const item of source.inventoryItems) {
      const locatorKey = canonicalJson({ kind: item.locator.kind, anchor: item.locator.anchor })
      if (itemIds.has(item.itemId)) {
        violations.push(
          violation('LOCATOR_DUPLICATE', `duplicate itemId '${item.itemId}'`, {
            sourcePath: source.path,
            locator: item.locator.anchor,
          }),
        )
      }
      if (locators.has(locatorKey)) {
        violations.push(
          violation('LOCATOR_DUPLICATE', `duplicate locator '${item.locator.anchor}'`, {
            sourcePath: source.path,
            locator: item.locator.anchor,
          }),
        )
      }
      itemIds.add(item.itemId)
      locators.add(locatorKey)
      itemsByRef.set(referenceKey(source.sourceId, item.itemId), item)
      if ((item.ruleIds.length === 0) === (item.exclusionDisposition === null)) {
        violations.push(
          violation(
            'SOURCE_ITEM_UNCOVERED',
            'inventory item must map rules or carry one exclusion disposition',
            {
              sourcePath: source.path,
              locator: item.locator.anchor,
            },
          ),
        )
      }
      if (sha256(normalizeRuleText(item.normalizedExcerpt)) !== item.valueDigest) {
        violations.push(
          violation(
            'VALUE_DIGEST_MISMATCH',
            'inventory normalizedExcerpt does not match valueDigest',
            {
              sourcePath: source.path,
              locator: item.locator.anchor,
            },
          ),
        )
      }
    }
  }

  const rulesById = new Map<string, AuthorityRule>()
  for (const rule of document.rules) {
    const applicabilitySets: readonly [readonly string[], readonly string[], string][] = [
      [rule.applicability.goals, GOAL_SCOPES, 'goals'],
      [rule.applicability.roles, ROLE_SCOPES, 'roles'],
      [rule.applicability.stages, STAGE_SCOPES, 'stages'],
      [rule.applicability.operations, OPERATION_SCOPES, 'operations'],
      [rule.applicability.hosts, HOST_POSTURES, 'hosts'],
    ]
    for (const [values, order, name] of applicabilitySets) {
      if (!followsEnumOrder(values, order)) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            `rule applicability ${name} set is not in schema-enum order`,
            {
              ruleId: rule.ruleId,
            },
          ),
        )
      }
    }
    if (rulesById.has(rule.ruleId)) {
      violations.push(
        violation('RULE_DUPLICATE', `duplicate ruleId '${rule.ruleId}'`, { ruleId: rule.ruleId }),
      )
    }
    rulesById.set(rule.ruleId, rule)
  }

  for (const source of document.sources) {
    for (const item of source.inventoryItems) {
      for (const ruleId of item.ruleIds) {
        if (!rulesById.has(ruleId)) {
          violations.push(
            violation('RULE_ORPHANED', `inventory item maps missing rule '${ruleId}'`, {
              sourcePath: source.path,
              locator: item.locator.anchor,
              ruleId,
            }),
          )
        }
      }
    }
  }

  for (const rule of document.rules) {
    if (bindingDigestFor(rule) !== rule.bindingDigest) {
      violations.push(
        violation('MIGRATION_EVIDENCE_INVALID', 'rule bindingDigest is stale', {
          ruleId: rule.ruleId,
        }),
      )
    }
    if (rule.classification === 'pre-action-refusal' && rule.refusalCode === null) {
      violations.push(
        violation('MIGRATION_EVIDENCE_INVALID', 'pre-action-refusal requires refusalCode', {
          ruleId: rule.ruleId,
        }),
      )
    }
    if (rule.classification !== 'pre-action-refusal' && rule.refusalCode !== null) {
      violations.push(
        violation('MIGRATION_EVIDENCE_INVALID', 'only pre-action-refusal may carry refusalCode', {
          ruleId: rule.ruleId,
        }),
      )
    }
    for (const sourceRef of rule.sourceRefs) {
      const source = sourcesById.get(sourceRef.sourceId)
      const item = itemsByRef.get(referenceKey(sourceRef.sourceId, sourceRef.itemId))
      if (source === undefined || item === undefined) {
        violations.push(
          violation('RULE_SOURCE_MISSING', 'rule source reference does not resolve', {
            sourcePath: source?.path,
            ruleId: rule.ruleId,
          }),
        )
        continue
      }
      if (locatorDigestFor(item.locator) !== sourceRef.locatorDigest) {
        violations.push(
          violation(
            'LOCATOR_DIGEST_MISMATCH',
            'rule source locator digest does not match inventory',
            {
              sourcePath: source.path,
              locator: item.locator.anchor,
              ruleId: rule.ruleId,
            },
          ),
        )
      }
      if (item.valueDigest !== sourceRef.valueDigest) {
        violations.push(
          violation('VALUE_DIGEST_MISMATCH', 'rule source value digest does not match inventory', {
            sourcePath: source.path,
            locator: item.locator.anchor,
            ruleId: rule.ruleId,
          }),
        )
      }
      if (!item.ruleIds.includes(rule.ruleId)) {
        violations.push(
          violation(
            'RULE_ORPHANED',
            'rule source reference is not reciprocally mapped by inventory',
            {
              sourcePath: source.path,
              locator: item.locator.anchor,
              ruleId: rule.ruleId,
            },
          ),
        )
      }
    }
    for (const pairedRuleId of rule.pairedRuleIds) {
      if (!rulesById.has(pairedRuleId)) {
        violations.push(
          violation('RULE_ORPHANED', `paired/backstop rule '${pairedRuleId}' does not exist`, {
            ruleId: rule.ruleId,
          }),
        )
      }
    }
    const evidence = rule.retirementEvidence
    const evidenceValues = [
      evidence.predicate,
      evidence.negativeRefusalTest,
      evidence.corpusSweep,
      evidence.independentBypassAttempt,
    ]
    const retired = rule.retirementState === 'retired-from-agent-reading'
    const complete =
      evidence.predicate?.kind === 'predicate-contract' &&
      evidence.negativeRefusalTest?.kind === 'negative-test' &&
      evidence.corpusSweep?.kind === 'corpus-sweep' &&
      evidence.independentBypassAttempt?.kind === 'independent-bypass'
    if ((retired && !complete) || (!retired && evidenceValues.some((item) => item !== null))) {
      violations.push(
        violation(
          'RETIREMENT_EVIDENCE_INCOMPLETE',
          'retirement evidence must be all-four iff retired',
          {
            ruleId: rule.ruleId,
          },
        ),
      )
    }
    if (
      retired &&
      rule.sourceRefs.some((sourceRef) => sourceRef.sourceId === 'standing-constraints')
    ) {
      violations.push(
        violation(
          'RETIREMENT_EVIDENCE_INCOMPLETE',
          'standing constraints cannot retire while missing-provenance-reference remains open',
          { ruleId: rule.ruleId },
        ),
      )
    }
  }

  const rules = [...rulesById.values()]
  for (let leftIndex = 0; leftIndex < rules.length; leftIndex += 1) {
    const left = rules[leftIndex]
    if (left === undefined) continue
    for (let rightIndex = leftIndex + 1; rightIndex < rules.length; rightIndex += 1) {
      const right = rules[rightIndex]
      if (
        right !== undefined &&
        left.normalizedStatement === right.normalizedStatement &&
        left.decision !== right.decision &&
        arraysOverlap(left.applicability.goals, right.applicability.goals) &&
        arraysOverlap(left.applicability.roles, right.applicability.roles) &&
        arraysOverlap(left.applicability.stages, right.applicability.stages)
      ) {
        violations.push(
          violation('RULE_CONFLICT', `rules '${left.ruleId}' and '${right.ruleId}' contradict`, {
            ruleId: left.ruleId,
          }),
        )
      }
    }
  }

  for (const reconciliationId of REQUIRED_RECONCILIATIONS) {
    if (!document.reconciliations.some((record) => record.reconciliationId === reconciliationId)) {
      violations.push(
        violation(
          'RECONCILIATION_MISSING',
          `required reconciliation '${reconciliationId}' is missing`,
        ),
      )
    }
  }
  for (const record of document.reconciliations) {
    if (
      (record.migrationStatus === 'superseded-by-amendment') !==
      (record.supersedingEvidence !== null)
    ) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          'supersedingEvidence must exist iff superseded-by-amendment',
        ),
      )
    }
    for (const ruleId of record.authoritativeRuleIds) {
      if (!rulesById.has(ruleId)) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            `reconciliation references missing rule '${ruleId}'`,
            {
              ruleId,
            },
          ),
        )
      }
    }
    for (const sourceRef of record.observedRefs) {
      if (!itemsByRef.has(referenceKey(sourceRef.sourceId, sourceRef.itemId))) {
        violations.push(
          violation('MIGRATION_EVIDENCE_INVALID', 'reconciliation observedRef does not resolve'),
        )
      }
    }
  }
  for (const operation of document.operationAuthority) {
    if (!followsEnumOrder(operation.allowedPrincipals, PRINCIPAL_CLASSES)) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `${operation.operationId} allowedPrincipals is not in schema-enum order`,
        ),
      )
    }
    for (const sourceRef of operation.requiredGitEvidence) {
      if (!itemsByRef.has(referenceKey(sourceRef.sourceId, sourceRef.itemId))) {
        violations.push(
          violation(
            'AUTHORITY_ESCALATION',
            `${operation.operationId} Git evidence does not resolve`,
          ),
        )
      }
    }
  }
  violations.push(...checkOperationAuthority(document))
  return violations
}

export function validateRegistry(document: unknown): ValidationResult {
  const violations: ValidationViolation[] = []
  if (!validateStructure(document)) {
    for (const error of validateStructure.errors ?? []) {
      violations.push(
        violation(
          'SCHEMA_INVALID',
          `${error.instancePath.length > 0 ? error.instancePath : '(root)'} ${error.message ?? 'is invalid'}`,
          { locator: error.instancePath },
        ),
      )
    }
  }
  if (!validateStructure(document)) {
    const sorted = ordered(violations)
    return { valid: false, violations: sorted, summary: null }
  }
  const registry = document as AuthorityEnforcementRegistry
  violations.push(...semanticViolations(registry))
  const sorted = ordered(violations)
  return { valid: sorted.length === 0, violations: sorted, summary: summaryFor(registry, sorted) }
}

export function parseRegistry(content: string): ValidationResult {
  try {
    return validateRegistry(parse(content) as unknown)
  } catch (error) {
    return {
      valid: false,
      violations: [
        violation('PARSE_ERROR', `registry YAML cannot be parsed: ${(error as Error).message}`),
      ],
      summary: null,
    }
  }
}

function occurrences(content: string, needle: string): number[] {
  const indexes: number[] = []
  let from = 0
  while (from <= content.length) {
    const index = content.indexOf(needle, from)
    if (index === -1) break
    indexes.push(index)
    from = index + Math.max(needle.length, 1)
  }
  return indexes
}

function extractLocator(content: string, locator: SourceLocator): { count: number; value: string } {
  if (locator.kind === 'line-excerpt' || locator.kind === 'table-row') {
    const matches = occurrences(content, locator.anchor)
    return { count: matches.length, value: locator.anchor }
  }
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  if (locator.kind === 'heading') {
    const stack: { level: number; heading: string }[] = []
    const matches: { index: number; level: number }[] = []
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? ''
      const heading = /^(#{1,6})\s+.+/.exec(line)
      if (heading === null) continue
      const level = heading[1]?.length ?? 6
      while ((stack.at(-1)?.level ?? 0) >= level) stack.pop()
      stack.push({ level, heading: line.trim() })
      if (stack.map((item) => item.heading).join(' > ') === locator.anchor) {
        matches.push({ index, level })
      }
    }
    if (matches.length !== 1) return { count: matches.length, value: '' }
    const start = matches[0]?.index ?? 0
    const level = matches[0]?.level ?? 6
    let end = lines.length
    for (let index = start + 1; index < lines.length; index += 1) {
      const nextLevel = /^(#+)\s/.exec(lines[index] ?? '')?.[1]?.length
      if (nextLevel !== undefined && nextLevel <= level) {
        end = index
        break
      }
    }
    return { count: 1, value: lines.slice(start, end).join('\n') }
  }
  if (locator.kind === 'numbered-item') {
    const stack: { level: number; heading: string }[] = []
    const matches: { index: number; indent: number }[] = []
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? ''
      const heading = /^(#{1,6})\s+.+/.exec(line)
      if (heading !== null) {
        const level = heading[1]?.length ?? 6
        while ((stack.at(-1)?.level ?? 0) >= level) stack.pop()
        stack.push({ level, heading: line.trim() })
        continue
      }
      const numbered = /^(\s*)\d+\.\s+\S/.exec(line)
      if (numbered === null) continue
      const anchor = [...stack.map((item) => item.heading), line.trim()].join(' > ')
      if (anchor === locator.anchor) {
        matches.push({ index, indent: numbered[1]?.length ?? 0 })
      }
    }
    if (matches.length !== 1) return { count: matches.length, value: '' }
    const match = matches[0]
    if (match === undefined) return { count: 0, value: '' }
    let end = lines.length
    for (let index = match.index + 1; index < lines.length; index += 1) {
      const line = lines[index] ?? ''
      if (/^#{1,6}\s+/.test(line)) {
        end = index
        break
      }
      const next = /^(\s*)\d+\.\s+\S/.exec(line)
      if (next !== null && (next[1]?.length ?? 0) <= match.indent) {
        end = index
        break
      }
    }
    return { count: 1, value: lines.slice(match.index, end).join('\n') }
  }
  if (locator.kind === 'symbol') {
    const matches = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.trim() === locator.anchor.trim())
    return { count: matches.length, value: matches.length === 1 ? (matches[0]?.line ?? '') : '' }
  }
  return { count: 0, value: '' }
}

function pathProblem(path: string): ResultCode | null {
  if (
    path.length === 0 ||
    isAbsolute(path) ||
    /^[A-Za-z]:/.test(path) ||
    path.includes('\\') ||
    path.includes('*') ||
    path.includes('?') ||
    path.split('/').includes('..')
  ) {
    return 'SOURCE_PATH_INVALID'
  }
  return null
}

export function sweepRegistrySources(document: unknown, repoRoot: string): ValidationResult {
  const base = validateRegistry(document)
  if (!validateStructure(document)) return base
  const registry = document as AuthorityEnforcementRegistry
  const violations = [...base.violations]
  const root = resolve(repoRoot)
  const normalizedPaths = new Set<string>()
  for (const source of registry.sources) {
    const invalidPath = pathProblem(source.path)
    if (invalidPath !== null) {
      violations.push(
        violation(invalidPath, `invalid repo-relative source path '${source.path}'`, {
          sourcePath: source.path,
        }),
      )
      continue
    }
    const normalized = source.path.toLowerCase()
    if (normalizedPaths.has(normalized)) {
      violations.push(
        violation('SOURCE_DUPLICATE_PATH', `duplicate normalized source path '${source.path}'`, {
          sourcePath: source.path,
        }),
      )
      continue
    }
    normalizedPaths.add(normalized)
    const absolute = resolve(root, ...source.path.split('/'))
    const relativePath = relative(root, absolute)
    if (relativePath.startsWith(`..${sep}`) || relativePath === '..' || isAbsolute(relativePath)) {
      violations.push(
        violation('SOURCE_PATH_ESCAPE', `source path escapes repo root`, {
          sourcePath: source.path,
        }),
      )
      continue
    }
    let content: string
    try {
      const stat = lstatSync(absolute)
      if (stat.isSymbolicLink()) {
        violations.push(
          violation('SOURCE_SYMLINK_FORBIDDEN', 'source path is a symlink or reparse target', {
            sourcePath: source.path,
          }),
        )
        continue
      }
      if (!stat.isFile()) {
        violations.push(
          violation('SOURCE_NOT_REGULAR', 'source path is not a regular file', {
            sourcePath: source.path,
          }),
        )
        continue
      }
      content = readFileSync(absolute, 'utf8')
    } catch (error) {
      violations.push(
        violation('RULE_SOURCE_MISSING', `cannot read source: ${(error as Error).message}`, {
          sourcePath: source.path,
        }),
      )
      continue
    }
    for (const item of source.inventoryItems) {
      const extracted = extractLocator(content, item.locator)
      if (extracted.count === 0) {
        violations.push(
          violation('LOCATOR_MISSING', 'registered locator is missing', {
            sourcePath: source.path,
            locator: item.locator.anchor,
          }),
        )
      } else if (extracted.count > 1) {
        violations.push(
          violation('LOCATOR_DUPLICATE', 'registered locator is not unique', {
            sourcePath: source.path,
            locator: item.locator.anchor,
          }),
        )
      } else if (sha256(normalizeRuleText(extracted.value)) !== item.valueDigest) {
        violations.push(
          violation('VALUE_DIGEST_MISMATCH', 'operative normalized source value changed', {
            sourcePath: source.path,
            locator: item.locator.anchor,
          }),
        )
      }
    }
  }
  const sorted = ordered(violations)
  return { valid: sorted.length === 0, violations: sorted, summary: summaryFor(registry, sorted) }
}
