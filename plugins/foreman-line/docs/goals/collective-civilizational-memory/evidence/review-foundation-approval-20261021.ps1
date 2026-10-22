# Human-operated offline tree approval. No model calls, network or automatic confirmation.
$ErrorActionPreference = 'Stop'
$ccmRoot = 'D:\Repos\agent-skills'
$ccmEvidence = Join-Path $ccmRoot 'plugins\foreman-line\docs\goals\collective-civilizational-memory\evidence'
$ccmPreparation = Get-Content -LiteralPath (Join-Path $ccmEvidence 'foundation-approval-preparation-20261021.json') -Raw | ConvertFrom-Json
$ccmPreview = Get-Content -LiteralPath (Join-Path $ccmEvidence 'foundation-approval-subject-preview-20261021.json') -Raw | ConvertFrom-Json

foreach ($ccmEntry in $ccmPreparation.sourceManifest) {
    $ccmOriginal = Join-Path $ccmRoot $ccmEntry.path
    $ccmMirrored = Join-Path $ccmPreparation.mirror $ccmEntry.path
    if ((Get-FileHash -LiteralPath $ccmOriginal -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ccmEntry.sha256 -or
        (Get-FileHash -LiteralPath $ccmMirrored -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ccmEntry.sha256) {
        throw "Approval source changed: $($ccmEntry.path). Stop for reconciliation."
    }
}
foreach ($ccmSpec in $ccmPreview.subject.specSet) {
    if ((Get-FileHash -LiteralPath (Join-Path $ccmRoot $ccmSpec.ref) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ccmSpec.contentHash) {
        throw "Spec changed: $($ccmSpec.ref). Stop for a refreshed review subject."
    }
}

$ccmProjected = Join-Path $ccmRoot 'docs\specs\active\collective-civilizational-memory-foundation-2026-10-19-01a155c3.projected.shaping-result.json'
if ((Get-FileHash -LiteralPath $ccmProjected -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ccmPreparation.projectedSha256) {
    throw 'Projected tree changed. Stop for a refreshed review subject.'
}
Write-Host "Review subject preview (not an approval): $($ccmPreview.proposedSubjectHash)"
Write-Host 'The official CLI displays the tree and asks you personally to type its exact slug.'
Write-Host 'This approves the spec/tree subject only. Builder admission, Gate 2 and Step 0 remain separate.'
& $ccmPreparation.node $ccmPreparation.tsx $ccmPreparation.cli approve $ccmProjected --repo-root $ccmRoot --approver 'Clinton Morgan'
if ($LASTEXITCODE -ne 0) { throw 'Approval did not complete. Preserve output and reconcile; do not automate confirmation.' }
