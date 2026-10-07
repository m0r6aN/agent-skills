// One-off Amendment 07 tooling: re-mint the live host-settings proposal
// artifact from the generator. Same-day regeneration of the 2026-10-07
// artifact (the binding set it asserts now exists as of that date).
import { writeFileSync } from 'node:fs'
import { buildHostSettingsProposal } from './src/host-settings-proposal.js'
import {
  loadSettingsProjection,
  loadShippedPolicy,
  proposalArtifactPath,
} from './tests/pi-fixtures.js'

const proposal = buildHostSettingsProposal({
  policy: loadShippedPolicy(),
  current: loadSettingsProjection(),
})
writeFileSync(proposalArtifactPath, `${JSON.stringify(proposal, null, 2)}\n`)
const adds = proposal.changes.filter((c) => c.op === 'add').map((c) => c.value)
console.log('wrote', proposalArtifactPath)
console.log('adds:', adds.length)
console.log(adds.filter((a) => String(a).includes('gpt-6') || String(a).includes('sonnet-5-5')))
