/**
 * P0 parity: the embedded P0 vocabularies and reference shapes preserved in
 * this package are verbatim-identical to the accepted upstream source
 * (authority-registry, R31 `1747c1d` — read-only here; never imported).
 *
 * The three embedded reference shapes stay distinct and are never conflated
 * (F05.5/F01). Digest semantics of embedded values remain upstream P0
 * semantics: untagged 64 hex computed with P0 canonicalJson (NFC-normalizing).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  HOST_POSTURE_CLAIMS,
  OPERATION_SCOPES,
  P0_ASSURANCE_LEVELS,
  P0_ENFORCEMENT_OWNERS,
  P0_EVIDENCE_KINDS,
  P0_GOVERNANCE_OPERATION_IDS,
  P0_PRINCIPAL_CLASSES,
  P0_RESOLUTION_REASON_CODES,
  P0_RESOLVED_DECISIONS,
  P0_RULE_CLASSIFICATIONS,
  P0_SEVERITIES,
  ROLE_SELECTIONS,
  STAGE_SELECTIONS,
} from '../src/types.js'

const here = dirname(fileURLToPath(import.meta.url))
const upstreamPath = join(here, '..', '..', 'authority-registry', 'src', 'types.ts')
const upstream = readFileSync(upstreamPath, 'utf8')

/** Linear extraction of the quoted members of `export const NAME = [ … ] as const`. */
function constArray(name: string): string[] {
  const marker = `export const ${name} = [`
  const start = upstream.indexOf(marker)
  assert.ok(start >= 0, `upstream must declare ${name}`)
  const end = upstream.indexOf('] as const', start)
  assert.ok(end > start, `${name} must end with ] as const`)
  return [...upstream.slice(start, end).matchAll(/'([^']*)'/g)].map((match) => match[1] as string)
}

/** Linear extraction of the quoted members of `export type NAME = …` up to the next export. */
function typeUnion(name: string): string[] {
  const marker = `export type ${name} =`
  const start = upstream.indexOf(marker)
  assert.ok(start >= 0, `upstream must declare ${name}`)
  const end = upstream.indexOf('\nexport ', start)
  const body = upstream.slice(start, end === -1 ? undefined : end)
  return [...body.matchAll(/'([^']*)'/g)].map((match) => match[1] as string)
}

test('P0 PrincipalClass vocabulary is verbatim', () => {
  assert.deepEqual(constArray('PRINCIPAL_CLASSES'), [...P0_PRINCIPAL_CLASSES])
})

test('P0 RoleScope/StageScope/OperationScope/HostPosture vocabularies are verbatim (minus any)', () => {
  assert.deepEqual(constArray('ROLE_SCOPES'), [...ROLE_SELECTIONS, 'any'])
  assert.deepEqual(constArray('STAGE_SCOPES'), [...STAGE_SELECTIONS, 'any'])
  assert.deepEqual(constArray('OPERATION_SCOPES'), [...OPERATION_SCOPES, 'any'])
  assert.deepEqual(constArray('HOST_POSTURES'), [...HOST_POSTURE_CLAIMS, 'any'])
})

test('P0 RuleClassification/AssuranceLevel/EnforcementOwner/Severity are verbatim', () => {
  assert.deepEqual(constArray('RULE_CLASSIFICATIONS'), [...P0_RULE_CLASSIFICATIONS])
  assert.deepEqual(constArray('ASSURANCE_LEVELS'), [...P0_ASSURANCE_LEVELS])
  assert.deepEqual(constArray('ENFORCEMENT_OWNERS'), [...P0_ENFORCEMENT_OWNERS])
  assert.deepEqual(constArray('SEVERITIES'), [...P0_SEVERITIES])
})

test('P0 OperationId (seven governance ids) and EvidenceKind are verbatim', () => {
  assert.deepEqual(typeUnion('OperationId'), [...P0_GOVERNANCE_OPERATION_IDS])
  assert.deepEqual(typeUnion('EvidenceKind'), [...P0_EVIDENCE_KINDS])
})

test('P0 registry identity literals are preserved verbatim in PolicyIdentity', () => {
  assert.ok(upstream.includes("readonly schemaVersion: '0.1.0'"))
  assert.ok(upstream.includes("readonly registryId: 'foreman-kernel-authority-enforcement'"))
})

function interfaceBlock(name: string): string {
  const marker = `export interface ${name} {`
  const start = upstream.indexOf(marker)
  assert.ok(start >= 0, `upstream must declare ${name}`)
  const end = upstream.indexOf('\n}', start)
  assert.ok(end > start)
  return upstream.slice(start, end)
}

function fieldNames(block: string): string[] {
  return [...block.matchAll(/readonly ([A-Za-z0-9_]+):/g)].map((match) => match[1] as string)
}

test('embedded SourceRef/SnapshotEvidence/EvidenceRef shapes are preserved verbatim and stay distinct', () => {
  assert.deepEqual(fieldNames(interfaceBlock('SourceRef')), [
    'sourceId',
    'itemId',
    'locatorDigest',
    'valueDigest',
  ])
  assert.deepEqual(fieldNames(interfaceBlock('SnapshotEvidence')), ['commit', 'fullFileSha256'])
  assert.deepEqual(fieldNames(interfaceBlock('EvidenceRef')), ['kind', 'path', 'digest'])
})

test('P0 resolution has no CONFLICT outcome and retains the three reason codes verbatim', () => {
  const resolution = upstream.slice(upstream.indexOf('export type AuthorityResolution'))
  assert.ok(resolution.includes("'ALLOW' | 'REFUSE' | 'ADVISORY' | 'REQUIRE_HUMAN'"))
  assert.ok(
    resolution.includes("'REGISTRY_INVALID' | 'INVALID_QUERY_SCOPE' | 'NO_APPLICABLE_AUTHORITY'"),
  )
  assert.ok(!resolution.includes("outcome: 'CONFLICT'"))
})

function unionFrom(resolution: string, marker: string): string[] {
  const start = resolution.indexOf(marker)
  assert.ok(start >= 0, `upstream resolution must declare ${marker}`)
  const line = resolution.slice(start, resolution.indexOf('\n', start))
  return [...line.matchAll(/'([^']*)'/g)].map((match) => match[1] as string)
}

test('P0 resolved-decision subset and reason codes are verbatim in package consts', () => {
  const resolution = upstream.slice(upstream.indexOf('export type AuthorityResolution'))
  assert.deepEqual(unionFrom(resolution, 'readonly decision:'), [...P0_RESOLVED_DECISIONS])
  assert.deepEqual(unionFrom(resolution, 'readonly reasonCode:'), [...P0_RESOLUTION_REASON_CODES])
})
