import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  isSealed,
  type ReceiptDocument,
  validateChain,
  validateReceiptDocument,
} from '../../receipts/src/index.js'
import type { ChainMemberSummary, ChainSummary } from './types.js'

/**
 * FOC-P0 C2 receipt-chain walk semantics. Chain membership is the frozen
 * `receiptPath` locator convention (six-digit sequence prefix + stage letter);
 * every other file in the workflow directory is a sidecar and never a chain
 * member. Validation is delegated to the shipped receipts validator
 * (`validateReceiptDocument` per member, `validateChain` for contiguity +
 * hash linkage + shared correlation) — no re-implementation.
 */
export const CHAIN_MEMBER_PATTERN = /^[0-9]{6}-([A-F])-[a-z0-9-]+\.json$/

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

export interface ChainWalk extends ChainSummary {
  /** Parsed chain-member documents in filename order. */
  readonly docs: readonly ReceiptDocument[]
}

export function listWorkflowIds(receiptsDir: string): string[] {
  let entries: string[]
  try {
    entries = readdirSync(receiptsDir)
  } catch {
    return []
  }
  return entries.filter((name) => UUID_PATTERN.test(name)).sort()
}

export function walkChain(receiptsDir: string, workflowId: string): ChainWalk {
  const locator = `docs/receipts/${workflowId}`
  const dir = join(receiptsDir, workflowId)
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch (err) {
    return {
      workflowId,
      locator,
      members: [],
      sidecars: [],
      docs: [],
      valid: false,
      errors: [`${locator}: workflow directory unreadable (${(err as Error).message})`],
      sealed: false,
      tipStage: null,
    }
  }

  const memberFiles = entries.filter((name) => CHAIN_MEMBER_PATTERN.test(name)).sort()
  const sidecars = entries.filter((name) => !CHAIN_MEMBER_PATTERN.test(name)).sort()
  const errors: string[] = []
  const docs: ReceiptDocument[] = []
  const members: ChainMemberSummary[] = []
  let unparseable = false

  for (const file of memberFiles) {
    const memberLocator = `${locator}/${file}`
    let parsed: unknown
    try {
      parsed = JSON.parse(readFileSync(join(dir, file), 'utf8'))
    } catch (err) {
      errors.push(`${memberLocator}: unparseable chain member (${(err as Error).message})`)
      unparseable = true
      continue
    }
    const memberCheck = validateReceiptDocument(parsed)
    for (const message of memberCheck.errors) {
      errors.push(`${memberLocator}: ${message}`)
    }
    const doc = parsed as ReceiptDocument
    docs.push(doc)
    members.push({
      sequence: typeof doc.sequence === 'number' ? doc.sequence : Number.NaN,
      stage: typeof doc.stage === 'string' ? doc.stage : '?',
      subjectKind: typeof doc.subjectKind === 'string' ? doc.subjectKind : '?',
      timestamp: typeof doc.timestamp === 'string' ? doc.timestamp : '',
      hash: typeof doc.hash === 'string' ? doc.hash : '',
      locator: memberLocator,
    })
  }

  // An unparseable member invalidates the chain outright (C2.3); chain-level
  // checks only run over a fully parseable member set.
  if (!unparseable && docs.length > 0) {
    const chainCheck = validateChain(docs)
    for (const message of chainCheck.errors) {
      errors.push(`${locator}: ${message}`)
    }
  }
  if (memberFiles.length === 0) {
    errors.push(`${locator}: no chain members matching the receiptPath convention`)
  }

  const valid = errors.length === 0
  const tip = members.length > 0 ? members[members.length - 1] : undefined
  return {
    workflowId,
    locator,
    members,
    sidecars: sidecars.map((name) => `${locator}/${name}`),
    docs,
    valid,
    errors,
    sealed: valid && docs.length > 0 && isSealed(docs),
    tipStage: tip?.stage ?? null,
  }
}
