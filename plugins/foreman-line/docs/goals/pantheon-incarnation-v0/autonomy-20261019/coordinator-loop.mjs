// Executable decision kernel for the proposed coordinator. No network/shell/write ports.
// Input flags must come from trusted host verifiers in production; JSON is NOT authority.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url));
export const queue=JSON.parse(fs.readFileSync(path.join(dir,'queue.json'))).parcels;
export const mandate=JSON.parse(fs.readFileSync(path.join(dir,'mandate.json')));
const hold=(code,scope='effects',detail={})=>({kind:'hold',code,scope,continue:['local-inspection','analysis','package-refinement'],...detail});
export function nextAction(s,now=Date.now()) {
  if(!s.authority?.verified) return hold('MANDATE_NOT_RATIFIED');
  if(!Number.isFinite(Date.parse(s.authority.expiresAt)) || Date.parse(s.authority.expiresAt)<=now) return hold('MANDATE_EXPIRED');
  if(!s.lease?.verified || !Number.isFinite(Date.parse(s.lease.expiresAt)) || Date.parse(s.lease.expiresAt)-now<30000) return hold('LEASE_UNAVAILABLE_OR_STALE');
  if(![s.newExposureUsd,s.totalPaidRequests,s.bootstrapExposureUsd,s.bootstrapPaidRequests].every(x=>Number.isFinite(x)&&x>=0)) return hold('ACCOUNTING_STATE_UNVERIFIED');
  if(s.newExposureUsd>=mandate.spending.newAllowance || s.totalPaidRequests>=mandate.limits.totalPaidRequests) return hold('TOTAL_BUDGET_OR_CALL_LIMIT');
  const ambiguous=(s.attempts??[]).filter(a=>['sending','unknown'].includes(a.status)&&!a.reconciled);
  if(ambiguous.length) return {kind:'reconcile',code:'NO_RESEND',attemptIds:ambiguous.map(a=>a.id),retainReservations:true,continue:['independent-local-work']};
  const ready=queue.filter(p=>s.parcels?.[p.id]?.status!=='closed' && p.dependsOn.every(d=>s.parcels?.[d]?.status==='closed'));
  const blocked=id=>(s.exceptions??[]).some(e=>e.status==='pending'&&e.blocks?.includes(id)) || (s.attempts??[]).some(a=>['sending','unknown'].includes(a.status)&&a.parcel===id);
  const row=ready.find(p=>!blocked(p.id));
  if(!row&&ready.length) return hold('SCOPED_EXCEPTION_OR_UNKNOWN_EFFECT',ready.map(x=>x.id));
  if(!row) {
    const required=['P-LOCAL','P-RESUME','P-GOV','P-MEM','P-B','P-HUMAN'];
    const missing=required.filter(x=>!s.completedExitCriteria?.includes(x));
    return missing.length?hold('QUEUE_EMPTY_WITH_OPEN_EXITS','closure',{missing}):{kind:'complete',requires:'independent reconstruction and durable closure record'};
  }
  const p=s.parcels?.[row.id]??{};
  if((s.exceptions??[]).some(e=>e.status==='pending'&&e.blocks?.includes(row.id))) return hold('SCOPED_EXCEPTION',row.id);
  if(!s.workflowApplied) return {kind:'prepare',parcel:'P01',action:'apply-ratified-workflow-docs-and-verify-loaded-digests',execution:false};
  if(!s.account?.qualified||!s.account.credentialBound||!s.account.autoReloadOff) return hold('ACCOUNT_QUALIFICATION_REQUIRED',row.id);
  if(row.id==='P00') return {kind:'bootstrap',parcel:'P00',action:'qualified-sender-and-substantive-plan-review',requires:'verified bootstrap grant, reservation and independent result'};
  if(!s.planReviewClosed) return hold('SUBSTANTIVE_PLAN_REVIEW_REQUIRED',row.id);
  if(row.executionMode==='bootstrap'&&!s.bootstrapClosed) {
    if(s.bootstrapPaidRequests>=mandate.limits.bootstrapPaidRequests) return hold('BOOTSTRAP_CALL_LIMIT',row.id);
    if(s.bootstrapExposureUsd>=mandate.spending.bootstrapAllowance) return hold('BOOTSTRAP_BUDGET_LIMIT',row.id);
  } else if(!s.runtimeReady) return hold('RUNTIME_UNAVAILABLE',row.id);
  if((p.reworkCycles??0)>mandate.limits.reworkCyclesPerParcel) return hold('REWORK_LIMIT',row.id);
  const rework=reason=>(p.reworkCycles??0)>=mandate.limits.reworkCyclesPerParcel?hold('REWORK_LIMIT',row.id):{kind:'rework',parcel:row.id,reason};
  if(!p.specLinted||!p.allowedFiles?.length||!p.sourceHead) return {kind:'shape',parcel:row.id,execution:false};
  if(!p.step0Exact) return {kind:'step0',parcel:row.id,action:'restate-compare-auto-continue',requires:'scope and admission exact match'};
  if(!p.buildResult) return {kind:'dispatch',parcel:row.id,mode:row.executionMode,requires:'authentic admission and fresh reservation before effect'};
  if(!p.tests?.passed||!p.artifactHashesValid) return rework('TEST_OR_ARTIFACT_FAILURE');
  const valid=(p.reviews??[]).filter(r=>r.complete&&r.substantive&&r.provenanceVerified&&r.independent&&r.sourceHead===p.sourceHead);
  if(valid.length<row.reviewCount) {
    if((p.reviewAttempts??0)>=row.reviewCount*mandate.limits.reviewAttemptsPerArtifactVersion) return hold('REVIEW_RECOVERY_EXHAUSTED',row.id);
    return {kind:'review',parcel:row.id,remaining:row.reviewCount-valid.length,requires:'fresh independent session; one bounded request'};
  }
  if(valid.some(r=>r.verdict!=='pass')||p.openBlockingFindings) return rework('REVIEW_FINDINGS');
  if(!p.merge?.completed) {
    if(!p.merge?.rulesGreen||p.merge.checkedHead!==p.sourceHead) return hold('MERGE_RULE_OR_HEAD_MISMATCH',row.id);
    return {kind:'merge',parcel:row.id,sourceHead:p.sourceHead,requires:'separate authentic Runtime or still-valid bootstrap admission'};
  }
  return {kind:'close',parcel:row.id,requires:'durable evidence, accounting, outbox and Stage-F record'};
}

// Host integration contract. The current package ships no implementation of these ports.
// verifySnapshot must authenticate source records, lease, epoch and grant; callers cannot
// replace it with JSON booleans. perform must re-check admission at the effect boundary.
export async function coordinate(ports,{maxIterations=32}={}) {
  for(let i=0;i<maxIterations;i++) {
    const s=await ports.verifySnapshot(await ports.readDurableState());
    const action=nextAction(s,await ports.trustedNow());
    await ports.recordDecision(action);
    if(action.kind==='complete') return action;
    if(action.kind==='hold') {
      await ports.continueIndependentLocalWork(action.scope);
      await ports.batchExceptionIfMaterialOrRecoveryExhausted(action);
      await ports.waitForCompletionOrAuthorityChange({maxWaitMs:60000});
      return action; // durable host wakeup resumes; no busy polling or sleeping chat authority
    }
    await ports.perform(action); // mandatory trusted admission/broker implementation in P05
  }
  return {kind:'yield',reason:'bounded coordinator iteration count; persist cursor and await event'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(process.argv.length!==3||process.argv[2]!=='--check') throw Error('Only --check is shipped. No live execution ports exist.');
  const state=JSON.parse(fs.readFileSync(path.join(dir,'initial-state.json')));
  console.log(JSON.stringify({mode:'offline-decision-check',action:nextAction(state),livePortsBound:false},null,2));
}
