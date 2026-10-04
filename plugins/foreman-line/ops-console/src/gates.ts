import type { ChainWalk } from './chain.js'
import { isRecord } from './guards.js'
import type { SidecarFact } from './scan.js'
import type { GateProxy } from './types.js'

/**
 * FOC-P0 C3 gate proxy rules (OQ5): presentation of what disk proves, nothing
 * inferred. The console records no gate decision and Gate 1 ratification /
 * Gate 3 merge have no console capture path (charter exit criterion 4).
 *
 * Contract reconciliation (documented conformance note): C3's G1 "evidenced"
 * cell reads "approval sidecar joins the spec, or the chain has its A
 * receipt", while R3 requires G1-pending when "chain tip is A and no approval
 * sidecar and no A-receipt-backed approval". Those only coexist if the A
 * receipt counts as the approval record precisely when it carries the
 * approval marker (`subject.approvedHash`) — which matches A2: the approval
 * flow itself mints `000000-A-shaping-result.json` with the approved hash.
 * Implemented that way: an approval-carrying A receipt = "the chain has its A
 * receipt" (evidenced); an A tip without one = pending per R3.
 */
export interface GateInputs {
  readonly walk: ChainWalk | null
  readonly sidecars: readonly SidecarFact[]
}

const MERGE_SHA_PATTERN = /^[0-9a-f]{40}$/

function approvalReceipt(
  walk: ChainWalk | null,
): { locator: string; carriesApproval: boolean } | null {
  if (walk === null) return null
  for (let i = 0; i < walk.docs.length; i++) {
    const doc = walk.docs[i]
    if (doc === undefined || doc.stage !== 'A') continue
    const subject = doc.subject
    const carriesApproval =
      isRecord(subject) &&
      typeof subject.approvedHash === 'string' &&
      subject.approvedHash.length > 0
    return { locator: walk.members[i]?.locator ?? walk.locator, carriesApproval }
  }
  return null
}

export function gateProxies(inputs: GateInputs): { G1: GateProxy; G2: GateProxy; G3: GateProxy } {
  const { walk, sidecars } = inputs
  const decisionSidecar = sidecars.find(
    (sidecar) =>
      (sidecar.kind === 'approval' || sidecar.kind === 'rejection') && sidecar.decision !== null,
  )
  const aReceipt = approvalReceipt(walk)

  // G1 — Stage-A approval
  let g1: GateProxy
  if (decisionSidecar !== undefined) {
    g1 = {
      gate: 'G1',
      status: 'evidenced',
      evidence: decisionSidecar.ref,
      detail: `decision sidecar joins the spec (decision: ${decisionSidecar.decision ?? 'unknown'})`,
    }
  } else if (aReceipt?.carriesApproval === true) {
    g1 = {
      gate: 'G1',
      status: 'evidenced',
      evidence: aReceipt.locator,
      detail: 'chain has its Stage-A receipt carrying the approval (subject.approvedHash)',
    }
  } else {
    const projected = sidecars.find((sidecar) => sidecar.kind === 'projected')
    const tipIsA = walk !== null && walk.tipStage === 'A'
    if (walk === null && projected !== undefined) {
      g1 = {
        gate: 'G1',
        status: 'pending',
        evidence: projected.ref,
        detail: 'projected shaping artifact joins the spec; no approval sidecar and no chain',
      }
    } else if (tipIsA) {
      g1 = {
        gate: 'G1',
        status: 'pending',
        evidence: aReceipt?.locator ?? null,
        detail: 'chain tip is A with no approval sidecar and no A-receipt-backed approval',
      }
    } else {
      g1 = {
        gate: 'G1',
        status: 'unknown',
        evidence: null,
        detail: 'no approval sidecar, no projected artifact pending approval, no chain',
      }
    }
  }

  // G2 — dispatch (Stage-C DispatchOrder receipt)
  let g2: GateProxy
  const cMember = walk?.members.find((member) => member.stage === 'C') ?? null
  if (walk === null) {
    g2 = { gate: 'G2', status: 'unknown', evidence: null, detail: 'no chain' }
  } else if (cMember !== null) {
    g2 = {
      gate: 'G2',
      status: 'evidenced',
      evidence: cMember.locator,
      detail: 'chain has its Stage-C DispatchOrder receipt',
    }
  } else {
    g2 = {
      gate: 'G2',
      status: 'pending',
      evidence: null,
      detail: `chain exists (tip ${walk.tipStage ?? 'empty'}) and has no C receipt`,
    }
  }

  // G3 — merge (Stage-F ClosureRecord with a 40-hex mergeSha)
  let g3: GateProxy
  const fMember = walk?.members.find((member) => member.stage === 'F') ?? null
  if (walk === null) {
    g3 = { gate: 'G3', status: 'unknown', evidence: null, detail: 'no chain' }
  } else if (fMember !== null) {
    const fDoc = walk.docs.find((doc) => doc.hash === fMember.hash)
    const subject = fDoc?.subject
    const mergeSha =
      isRecord(subject) && typeof subject.mergeSha === 'string' ? subject.mergeSha : null
    if (mergeSha !== null && MERGE_SHA_PATTERN.test(mergeSha)) {
      g3 = {
        gate: 'G3',
        status: 'evidenced',
        evidence: fMember.locator,
        detail: `chain has its Stage-F ClosureRecord (mergeSha ${mergeSha})`,
      }
    } else {
      g3 = {
        gate: 'G3',
        status: 'unknown',
        evidence: fMember.locator,
        detail: 'Stage-F receipt present but subject.mergeSha is not a 40-hex merge sha',
      }
    }
  } else {
    g3 = {
      gate: 'G3',
      status: 'pending',
      evidence: null,
      detail: `chain exists (tip ${walk.tipStage ?? 'empty'}) and has no F receipt`,
    }
  }

  return { G1: g1, G2: g2, G3: g3 }
}
