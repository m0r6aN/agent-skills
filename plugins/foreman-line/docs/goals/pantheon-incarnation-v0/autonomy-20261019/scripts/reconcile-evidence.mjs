// Read-only reconciliation. No provider calls, credential values or transcript text output.
import fs from 'node:fs';
import crypto from 'node:crypto';
const root = 'D:/Repos/Pantheon/docs/reviews/pantheon-incarnation-v0-plan-review';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const manifest = JSON.parse(fs.readFileSync(`${root}/authorized-attempt-1/evidence-manifest.json`));
const files = manifest.files.map(f => {
  const b = fs.readFileSync(`${root}/authorized-attempt-1/${f.name}`);
  return {name:f.name, bytes:b.length, sha256:sha(b), valid:b.length===f.bytes && sha(b)===f.sha256};
});
const events = fs.readFileSync(`${root}/authorized-attempt-1/response.jsonl`, 'utf8').trim().split(/\r?\n/).map(JSON.parse);
const assistants = events.filter(x=>x.type==='assistant');
const final = events.findLast(x=>x.type==='result');
const replacement = fs.readFileSync(`${root}/replacement-request.json`);
const body=JSON.parse(replacement);
const ownerPath='C:/Users/clint/.pi/agent/sessions/--D--Repos-agent-skills-plugins-foreman-line--/2026-10-19T01-01-10-251Z_01a151ad-3cea-70cf-9dfc-233a9da3dd00.jsonl';
const ownerRecords=fs.readFileSync(ownerPath,'utf8').trim().split(/\r?\n/).map(JSON.parse);
const lastAssistant=ownerRecords.findLast(x=>x.message?.role==='assistant');
const report={
  recordedAt:new Date().toISOString(), kind:'local-integrity-and-metadata-only', files,
  consumed:{operatorInvocations:1, distinctAssistantIds:new Set(assistants.map(x=>x.message.id)).size,
    syntheticContinuations:events.filter(x=>x.type==='user'&&x.isSynthetic).length,
    assistantTextBlocks:assistants.flatMap(x=>x.message.content??[]).filter(x=>x.type==='text').length,
    result:{subtype:final.subtype,is_error:final.is_error,num_turns:final.num_turns,stop_reason:final.stop_reason,
      terminal_reason:final.terminal_reason,usage:final.usage,modelUsage:final.modelUsage,total_cost_usd:final.total_cost_usd}},
  replacement:{bytes:replacement.length,sha256:sha(replacement),model:body.model,max_tokens:body.max_tokens,
    tools:body.tools,packetMatches:body.messages.length===1&&body.messages[0].content===fs.readFileSync(`${root}/REVIEW-PACKET.md`,'utf8')},
  retainedOwner:{sessionId:'01a151ad-3cea-70cf-9dfc-233a9da3dd00',records:ownerRecords.length,
    fileMtime:fs.statSync(ownerPath).mtime.toISOString(),lastStopReason:lastAssistant?.message?.stopReason??null,
    observationIsRelease:false},
  anthropicCredentialInCurrentProcess:Object.hasOwn(process.env,'ANTHROPIC_API_KEY'),
  limitations:['Synthetic integrity is not live qualification.','CLI list cost is not billed cost.','No owner transfer implied.','No provider request made.']
};
console.log(JSON.stringify(report,null,2));
if(files.some(x=>!x.valid)||report.consumed.distinctAssistantIds!==4||report.consumed.syntheticContinuations!==3||report.consumed.assistantTextBlocks!==0) process.exitCode=1;
