import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nextAction,queue} from '../coordinator-loop.mjs';
const now=Date.parse('2026-10-19T13:00:00Z');
function state(id='P07'){
 const parcels={}; for(const p of queue){if(p.id===id) break;parcels[p.id]={status:'closed'};}
 parcels[id]={specLinted:true,allowedFiles:['src/evidence-summary.mjs'],sourceHead:'head-a',step0Exact:true};
 return {authority:{verified:true,expiresAt:'2026-10-20T00:00:00Z'},lease:{verified:true,expiresAt:'2026-10-19T13:02:00Z'},
 account:{qualified:true,credentialBound:true,autoReloadOff:true},workflowApplied:true,planReviewClosed:true,runtimeReady:true,bootstrapClosed:true,
 totalPaidRequests:0,bootstrapPaidRequests:0,bootstrapExposureUsd:0,newExposureUsd:0,attempts:[],parcels,exceptions:[],completedExitCriteria:[]};
}
function green(){const s=state();Object.assign(s.parcels.P07,{buildResult:true,tests:{passed:true},artifactHashesValid:true,reviews:[{complete:true,substantive:true,provenanceVerified:true,independent:true,sourceHead:'head-a',verdict:'pass'}],merge:{rulesGreen:true,checkedHead:'head-a'}});return s;}
test('unratified mandate holds effects but permits local work',()=>{const s=state();s.authority.verified=false;assert.equal(nextAction(s,now).code,'MANDATE_NOT_RATIFIED');assert(nextAction(s,now).continue.includes('local-inspection'));});
test('expired authority and stale lease hold',()=>{const s=state();s.authority.expiresAt='2020-01-01';assert.equal(nextAction(s,now).code,'MANDATE_EXPIRED');s.authority.expiresAt='2030-01-01';s.lease.expiresAt='2026-10-19T13:00:20Z';assert.equal(nextAction(s,now).code,'LEASE_UNAVAILABLE_OR_STALE');});
test('missing budget state fails closed',()=>{const s=state();delete s.bootstrapExposureUsd;assert.equal(nextAction(s,now).code,'ACCOUNTING_STATE_UNVERIFIED');});
test('malformed expiry cannot become an unbounded grant',()=>{const s=state();s.authority.expiresAt='invalid';assert.equal(nextAction(s,now).code,'MANDATE_EXPIRED');s.authority.expiresAt='2030-01-01';s.lease.expiresAt='invalid';assert.equal(nextAction(s,now).code,'LEASE_UNAVAILABLE_OR_STALE');});
test('total budget exhaustion never dispatches',()=>{const s=state();s.newExposureUsd=75;assert.equal(nextAction(s,now).code,'TOTAL_BUDGET_OR_CALL_LIMIT');});
test('unknown send reconciles without resend, then holds affected parcel',()=>{const s=state();s.attempts=[{id:'attempt-1',status:'unknown',parcel:'P07'}];assert.equal(nextAction(s,now).code,'NO_RESEND');s.attempts[0].reconciled=true;assert.equal(nextAction(s,now).code,'SCOPED_EXCEPTION_OR_UNKNOWN_EFFECT');});
test('Runtime outage blocks ordinary dispatch',()=>{const s=state();s.runtimeReady=false;assert.equal(nextAction(s,now).code,'RUNTIME_UNAVAILABLE');});
test('unbound account or reload on blocks paid path',()=>{const s=state();s.account.autoReloadOff=false;assert.equal(nextAction(s,now).code,'ACCOUNT_QUALIFICATION_REQUIRED');});
test('empty review cannot produce merge',()=>{const s=green();s.parcels.P07.reviews[0].substantive=false;assert.equal(nextAction(s,now).kind,'review');});
test('wrong reviewed head and non-independent review rejected',()=>{const s=green();s.parcels.P07.reviews[0].sourceHead='old';assert.equal(nextAction(s,now).kind,'review');s.parcels.P07.reviews[0].sourceHead='head-a';s.parcels.P07.reviews[0].independent=false;assert.equal(nextAction(s,now).kind,'review');});
test('findings request rework only within limit',()=>{const s=green();s.parcels.P07.reviews[0].verdict='changes_required';assert.equal(nextAction(s,now).kind,'rework');s.parcels.P07.reworkCycles=2;assert.equal(nextAction(s,now).code,'REWORK_LIMIT');});
test('changed merge head holds; accepted exact head yields merge intent only',()=>{const s=green();s.parcels.P07.merge.checkedHead='other';assert.equal(nextAction(s,now).code,'MERGE_RULE_OR_HEAD_MISMATCH');s.parcels.P07.merge.checkedHead='head-a';assert.equal(nextAction(s,now).kind,'merge');});
test('queue exhaustion is not proof completion',()=>{const s=state();for(const p of queue)s.parcels[p.id]={status:'closed'};assert.equal(nextAction(s,now).code,'QUEUE_EMPTY_WITH_OPEN_EXITS');});
test('bootstrap cap holds prerequisite work',()=>{const s=state('P03');s.bootstrapClosed=false;s.bootstrapPaidRequests=16;assert.equal(nextAction(s,now).code,'BOOTSTRAP_CALL_LIMIT');});
